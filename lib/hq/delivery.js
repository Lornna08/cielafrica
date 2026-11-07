/* ============================================================
   CIEL ADMIN — digital product delivery.
   • Prices come from the published catalogue files (data/products.js,
     data/templates.js) on the server, never from the browser.
   • Product files live in the PRIVATE Blob store (products/<id>/…);
     hq/product-files.json says which file belongs to which product.
   • After M-Pesa confirms a shop payment whose items and amount match the
     catalogue, the order gets a secret download key. The customer downloads
     through /download?o=<order>&k=<key> (30 days, 20 downloads per file).
   ============================================================ */
const fs = require('fs'), path = require('path'), vm = require('vm');
const BS = require('../photobooks/blobstore');
const sec = require('../domains/security');
const INDEX = 'hq/product-files.json';
const DAYS = 30, MAX_DL = 20;

let CAT = null;
function load(file, key) {
  try {
    const src = fs.readFileSync(path.join(__dirname, '..', '..', 'data', file), 'utf8');
    const sb = { window: {} }; vm.runInNewContext(src, sb, { timeout: 1000 });
    return (sb.window.CIEL && sb.window.CIEL[key]) || [];
  } catch (e) { console.error('[delivery] catalogue', file, e && e.message); return []; }
}
function catalog() {
  if (CAT) return CAT;
  CAT = {};
  load('products.js', 'products').forEach(p => { if (p && p.id && p.price > 0) CAT[p.id] = { id: p.id, name: p.name, price: Number(p.price), kind: 'product' }; });
  load('templates.js', 'templates').forEach(t => { if (t && t.id && t.price > 0) CAT[t.id] = { id: t.id, name: t.name, price: Number(t.price), kind: 'template' }; });
  return CAT;
}
/** items from the browser → priced lines from the catalogue. ok=false if anything is unknown. */
function price(items) {
  const c = catalog(), lines = [];
  if (!Array.isArray(items) || !items.length || items.length > 30) return { ok: false, lines, total: 0 };
  for (const it of items) {
    const p = c[String(it && it.id || '')], qty = Math.max(1, Math.min(20, Math.round(+it.qty || 1)));
    if (!p) return { ok: false, lines, total: 0 };
    lines.push({ id: p.id, name: p.name, price: p.price, qty });
  }
  return { ok: true, lines, total: lines.reduce((n, l) => n + l.price * l.qty, 0) };
}

/* ---------- product files ---------- */
async function files() { return (await BS.getJSON(INDEX).catch(() => null)) || {}; }
async function attach(id, f) {
  const idx = await files(), old = idx[id];
  idx[id] = { path: f.path, name: f.name, size: f.size || 0, type: f.type || 'application/octet-stream', at: Date.now() };
  await BS.putJSON(INDEX, idx);
  if (old && old.path !== f.path) await BS.del([old.path]).catch(() => { });
  return idx[id];
}
async function detach(id) { const idx = await files(), old = idx[id]; if (!old) return; delete idx[id]; await BS.putJSON(INDEX, idx); await BS.del([old.path]).catch(() => { }); }
const safeName = n => String(n || 'file').replace(/[^\w.\- ]+/g, '_').replace(/\s+/g, '-').slice(-120) || 'file';
const fileKey = (id, name) => 'products/' + id + '/' + sec.randomId(9) + '/' + safeName(name);

/* ---------- orders ---------- */
const orderPath = id => 'shop/orders/' + String(id).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 80) + '.json';
/** called when a payment is confirmed: gives a matching order its download key */
function grant(o) {
  if (!o || !o.verified || !(o.lines || []).length) return o;
  /* the key is derived from the order (and how many times it was renewed), so two confirmations arriving together agree on it */
  if (!o.dl) { const k = sec.sign && sec.sign('pbk-dl|' + o.id + '|' + (o.dlN || 0)); o.dl = { key: k ? String(k).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32) : sec.randomId(18), at: Date.now(), until: Date.now() + DAYS * 864e5, count: {} }; }
  return o;
}
function link(o) { return o && o.dl ? (process.env.SITE_URL || 'https://cielafrica.com') + '/download?o=' + encodeURIComponent(o.id) + '&k=' + encodeURIComponent(o.dl.key) : null; }
async function open(id, key) {
  const o = await BS.getJSON(orderPath(id)).catch(() => null);
  if (!o || !o.dl || !key || !sec.safeEq(String(key), o.dl.key)) throw Object.assign(new Error('This download link is not valid. Check the link in your email, or contact hello@cielafrica.com.'), { status: 404, code: 'link' });
  if (o.status !== 'paid' && o.status !== 'processing' && o.status !== 'fulfilled' && o.status !== 'delivered') throw Object.assign(new Error('This order is not available for download. Contact hello@cielafrica.com.'), { status: 403, code: 'status' });
  return o;
}
async function summary(id, key) {
  const o = await open(id, key), idx = await files(), expired = Date.now() > o.dl.until;
  return { ok: true, ref: o.ref, name: (o.customer && o.customer.name) || '', paidAt: o.paidAt, until: o.dl.until, expired,
    items: o.lines.map(l => { const f = idx[l.id]; return { id: l.id, name: l.name, qty: l.qty, file: f ? { name: f.name, size: f.size } : null, left: f ? Math.max(0, MAX_DL - ((o.dl.count || {})[l.id] || 0)) : 0 }; }) };
}
async function fetchFile(id, key, pid) {
  const o = await open(id, key);
  if (Date.now() > o.dl.until) throw Object.assign(new Error('This link has expired. Contact hello@cielafrica.com and we will send a new one.'), { status: 410, code: 'expired' });
  if (!o.lines.some(l => l.id === pid)) throw Object.assign(new Error('That product is not part of this order.'), { status: 404, code: 'item' });
  const f = (await files())[pid]; if (!f) throw Object.assign(new Error('The file for this product is being prepared. We will email you as soon as it is ready.'), { status: 404, code: 'nofile' });
  o.dl.count = o.dl.count || {}; const n = o.dl.count[pid] || 0;
  if (n >= MAX_DL) throw Object.assign(new Error('The download limit for this file has been reached. Contact hello@cielafrica.com.'), { status: 429, code: 'limit' });
  o.dl.count[pid] = n + 1; o.history = (o.history || []).concat([{ status: 'download', at: Date.now(), note: 'Downloaded ' + f.name }]);
  await BS.putJSON(orderPath(id), o);
  return f;
}
/** stream a private blob to the response (large files are not held in memory) */
async function stream(res, f) {
  const r = await require('@vercel/blob').get(f.path, { access: 'private', useCache: false });
  if (!r || r.statusCode !== 200 || !r.stream) { res.statusCode = 404; return res.end('File not found.'); }
  res.statusCode = 200;
  res.setHeader('Content-Type', f.type || 'application/octet-stream');
  res.setHeader('Content-Disposition', 'attachment; filename="' + safeName(f.name) + '"');
  if (f.size) res.setHeader('Content-Length', String(f.size));
  res.setHeader('Cache-Control', 'private, no-store'); res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('X-Robots-Tag', 'noindex');
  const { Readable } = require('stream');
  const src = typeof r.stream.getReader === 'function' ? Readable.fromWeb(r.stream) : r.stream;
  await new Promise((ok, bad) => { src.on('error', bad); res.on('finish', ok); res.on('close', ok); src.pipe(res); });
}

/** email the customer their link (from hello@ if mail is set up). Never throws. */
async function emailLink(o) {
  try {
    const to = o.customer && o.customer.email, url = link(o);
    if (!to || !url || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return false;
    const MAIL = require('./mail');
    const acc = MAIL.configured().filter(a => a.configured)[0]; if (!acc) return false;
    const from = MAIL.configured().filter(a => a.id === 'hello' && a.configured)[0] || acc;
    const items = o.lines.map(l => '• ' + l.name + (l.qty > 1 ? ' ×' + l.qty : '')).join('\n');
    const esc = s => String(s).replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
    await MAIL.send({
      acct: from.id, to: [to], subject: 'Your Ciel Africa download · ' + o.ref,
      text: 'Hi ' + ((o.customer.name || '').split(' ')[0] || 'there') + ',\n\nThank you for your order (' + o.ref + (o.receipt ? ', M-Pesa ' + o.receipt : '') + ').\n\n' + items + '\n\nDownload your files here (valid for ' + DAYS + ' days):\n' + url + '\n\nIf anything is missing, reply to this email.\n\nCiel Africa',
      html: '<div style="font-family:Arial,sans-serif;color:#141414;line-height:1.5"><p>Hi ' + esc((o.customer.name || '').split(' ')[0] || 'there') + ',</p><p>Thank you for your order <b>' + esc(o.ref) + '</b>' + (o.receipt ? ' (M-Pesa ' + esc(o.receipt) + ')' : '') + '.</p><ul>' + o.lines.map(l => '<li>' + esc(l.name) + (l.qty > 1 ? ' ×' + l.qty : '') + '</li>').join('') + '</ul><p><a href="' + esc(url) + '" style="display:inline-block;background:#ff5a1f;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Download your files</a></p><p style="color:#666;font-size:13px">The link works for ' + DAYS + ' days. If anything is missing, reply to this email.</p><p>Ciel Africa</p></div>'
    });
    return true;
  } catch (e) { console.error('[delivery] email', e && e.message); return false; }
}
module.exports = { catalog, price, files, attach, detach, fileKey, safeName, grant, link, summary, fetchFile, stream, emailLink, orderPath, DAYS, MAX_DL };
