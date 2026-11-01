/* ============================================================
   CIEL PHOTO BOOKS — server (behind /api/photobooks?route=…)

   Prices are computed here from data/photobooks.js, never taken from
   the browser. A purchase is unlocked only by a receipt this server
   signs after Safaricom's STK Query API confirms the payment.

   Storage: the existing Upstash Redis store (lib/domains/store.js).
   Without it, digital PDF purchases still work (signed receipts), but
   printed orders are not accepted: they need a durable order record
   and a place to keep the approved print files.
   ============================================================ */
const crypto = require('crypto');
const { getStore } = require('../domains/store');
const payments = require('../domains/payments');
const sec = require('../domains/security');
const { layout } = require('../domains/email');
const E = require('../../assets/js/pb/engine.js');
const BS = require('./blobstore');

const STATUSES = {
  awaiting_payment: 'Awaiting payment', paid: 'Paid', preparing: 'Preparing print files', ready: 'Ready for printing',
  printing: 'Printing', ready_collection: 'Ready for collection', dispatched: 'Dispatched', delivered: 'Delivered',
  pdf_delivered: 'PDF downloaded', cancelled: 'Cancelled', refunded: 'Refunded', payment_failed: 'Payment not completed'
};
const ADMIN_SET = ['preparing', 'ready', 'printing', 'ready_collection', 'dispatched', 'delivered', 'cancelled', 'refunded'];
const FILES = ['interior', 'cover'];
const CHUNK = 2 * 1024 * 1024; // raw bytes per upload request (stays under the 4.5 MB function body limit)
const FILE_TTL = 180 * 86400;

const b64u = s => Buffer.from(s).toString('base64url');
const unb64u = s => Buffer.from(String(s), 'base64url').toString();
function tokenSign(kind, obj) { const body = b64u(JSON.stringify(Object.assign({ k: kind }, obj))); const sig = sec.sign('pb|' + kind + '|' + body); if (!sig) throw Object.assign(new Error('Payments are not set up yet.'), { status: 503, code: 'setup' }); return body + '.' + sig; }
function tokenRead(kind, tok) {
  const p = String(tok || '').split('.'); if (p.length !== 2) return null;
  if (!sec.safeEq(p[1], sec.sign('pb|' + kind + '|' + p[0]))) return null;
  try { const o = JSON.parse(unb64u(p[0])); return o.k === kind ? o : null; } catch (e) { return null; }
}
const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
function orderRef() { const b = crypto.randomBytes(5); let n = BigInt('0x' + b.toString('hex')), s = ''; for (let i = 0; i < 8; i++) { s = B32[Number(n % 32n)] + s; n /= 32n; } return 'PB-' + s; }
const clean = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n || 200);
const isEmail = e => /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,}$/i.test(e);
const money = (n, c) => (c || 'KES') + ' ' + Number(n || 0).toLocaleString('en-KE');

function createHandler(deps) {
  deps = deps || {};
  const store = () => deps.store || getStore();
  const cfg = () => deps.config || require('../../data/photobooks.js');
  const mp = deps.mpesa || payments.mpesa(deps.fetch);
  const mpesaOn = () => deps.mpesaConfigured != null ? deps.mpesaConfigured : payments.mpesaConfigured();
  const now = () => (deps.now ? deps.now() : Date.now());
  const memPaid = new Set();
  const base = () => (process.env.PHOTOBOOKS_BASE_URL || deps.baseUrl || 'https://cielafrica.com').replace(/\/$/, '');

  async function mail(to, subject, title, intro, rows, next, link) {
    if (deps.email) return deps.email({ to, subject, title, intro, rows, next, link });
    if (!process.env.RESEND_API_KEY) { console.log('[photobooks] email not configured:', subject); return { ok: false, skipped: true }; }
    try {
      const r = await (deps.fetch || fetch)('https://api.resend.com/emails', {
        method: 'POST', headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(10000),
        body: JSON.stringify({ from: process.env.MAIL_FROM || 'Ciel Africa <hello@cielafrica.com>', to: Array.isArray(to) ? to : [to], subject, html: layout(title, intro, rows, next, link), reply_to: 'hello@cielafrica.com' })
      });
      return { ok: r.ok };
    } catch (e) { console.error('[photobooks] email error', e && e.message); return { ok: false }; }
  }
  const team = () => (process.env.MAIL_TO || 'hello@cielafrica.com').split(',').map(s => s.trim()).filter(Boolean);

  const send = (res, code, obj, headers) => {
    res.statusCode = code; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Robots-Tag', 'noindex');
    Object.entries(headers || {}).forEach(([k, v]) => res.setHeader(k, v)); res.end(JSON.stringify(obj));
  };
  const err = (status, code, message) => Object.assign(new Error(message), { status, code });

  async function readBody(req, max, binary) {
    if (!binary && req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
    if (Buffer.isBuffer(req.body)) return binary ? req.body : JSON.parse(req.body.toString() || '{}');
    if (typeof req.body === 'string') return binary ? Buffer.from(req.body) : JSON.parse(req.body || '{}');
    const parts = []; let size = 0;
    await new Promise((ok, no) => {
      req.on('data', c => { size += c.length; if (size > max) { no(err(413, 'size', 'Request too large.')); req.destroy(); } else parts.push(c); });
      req.on('end', ok); req.on('error', no);
    });
    const buf = Buffer.concat(parts);
    if (binary) return buf;
    try { return buf.length ? JSON.parse(buf.toString()) : {}; } catch (e) { throw err(400, 'json', 'Invalid request.'); }
  }
  async function limit(req, bucket, max, win, id) { if (!(await sec.rateLimit(store(), 'pb-' + bucket, id || sec.clientIp(req), max, win))) throw err(429, 'rate', 'Too many requests — please wait a minute and try again.'); }
  function admin(req) { if (!sec.secret() || !process.env.ADMIN_PASSWORD || !sec.checkSession(req)) throw err(401, 'auth', 'Please sign in.'); }

  async function getOrder(ref) { return store().get('pb:order:' + ref); }
  async function putOrder(o) { o.updatedAt = now(); await store().set('pb:order:' + o.ref, o); return o; }
  function setStatus(o, status, note, by) { if (o.status === status) return false; o.status = status; o.history = (o.history || []).concat([{ status, at: now(), note: note ? clean(note, 300) : undefined, by: by || undefined }]); return true; }
  function publicOrder(o) {
    return { ref: o.ref, product: o.product, status: o.status, statusLabel: STATUSES[o.status] || o.status, history: (o.history || []).map(h => ({ status: h.status, label: STATUSES[h.status] || h.status, at: h.at, note: h.public ? h.note : undefined })), lines: o.lines, total: o.total, currency: o.currency, specs: o.specs, delivery: o.delivery ? { option: o.delivery.name } : null, files: Object.keys(o.files || {}), createdAt: o.createdAt };
  }
  function printReady() { return !!store().durable; }

  /* ---------------- routes ---------------- */
  const R = {};

  R.caps = async () => ({ ok: true, ai: !!(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY), payments: mpesaOn() && !!sec.secret(), orders: printReady(), email: !!process.env.RESEND_API_KEY });

  R.quote = async (req) => { const b = await readBody(req, 8192); const q = E.quote(cfg(), b); return Object.assign({ ok: q.ok }, q); };

  R.suggest = async (req) => {
    const b = await readBody(req, 8192);
    const key = process.env.ANTHROPIC_API_KEY, okey = process.env.OPENAI_API_KEY;
    if (!key && !okey) return { ok: false, code: 'not_configured' };
    await limit(req, 'ai', 12, 600);
    const desc = clean(b.description, 1500), title = clean(b.title, 120);
    const ids = cfg().templates.filter(t => t.visible !== false).map(t => t.id + ' (' + t.category + ': ' + t.name + ')').join(', ');
    const sys = 'You suggest design ideas for a personal photo book. Use ONLY facts the customer wrote. Never invent names, dates, places, ages, relationships or events. If something is not stated, keep wording generic. Reply with JSON only: {"titles":[up to 6 short titles],"subtitles":[up to 3],"dedications":[up to 3 generic, no names unless the customer wrote them],"templates":[up to 4 ids from the list],"density":"airy|balanced|full","coverConcept":"one sentence","sections":"one sentence about grouping photos"}. Template ids: ' + ids;
    const user = 'Customer description: """' + desc + '"""\nPreferred title (may be empty): """' + title + '"""';
    let text = '';
    try {
      if (key) {
        const r = await (deps.fetch || fetch)('https://api.anthropic.com/v1/messages', { method: 'POST', signal: AbortSignal.timeout(20000), headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, body: JSON.stringify({ model: process.env.PHOTOBOOKS_AI_MODEL || 'claude-haiku-5-5', max_tokens: 700, system: sys, messages: [{ role: 'user', content: user }] }) });
        const j = await r.json(); text = ((j.content || [])[0] || {}).text || '';
      } else {
        const r = await (deps.fetch || fetch)('https://api.openai.com/v1/chat/completions', { method: 'POST', signal: AbortSignal.timeout(20000), headers: { Authorization: 'Bearer ' + okey, 'content-type': 'application/json' }, body: JSON.stringify({ model: process.env.PHOTOBOOKS_AI_MODEL || 'gpt-4o-mini', response_format: { type: 'json_object' }, messages: [{ role: 'system', content: sys }, { role: 'user', content: user }] }) });
        const j = await r.json(); text = (((j.choices || [])[0] || {}).message || {}).content || '';
      }
      const m = text.match(/\{[\s\S]*\}/); const o = JSON.parse(m ? m[0] : text);
      const arr = (v, n, len) => (Array.isArray(v) ? v : []).map(x => clean(x, len)).filter(Boolean).slice(0, n);
      const valid = new Set(cfg().templates.filter(t => t.visible !== false).map(t => t.id));
      return { ok: true, suggestions: { source: 'ai', titles: arr(o.titles, 6, 80), subtitles: arr(o.subtitles, 3, 90), dedications: arr(o.dedications, 3, 140), templates: arr(o.templates, 4, 40).filter(t => valid.has(t)), density: ['airy', 'balanced', 'full'].includes(o.density) ? o.density : 'balanced', cover: clean(o.coverConcept, 200), sections: clean(o.sections, 200) } };
    } catch (e) { console.error('[photobooks] ai error', e && e.message); return { ok: false, code: 'ai_failed' }; }
  };

  /** start an M-Pesa payment for a quoted product bound to one exact design version */
  R.pay = async (req) => {
    const b = await readBody(req, 16384);
    if (!mpesaOn() || !sec.secret()) throw err(503, 'setup', 'Online payment is not available right now. Please contact us to order.');
    await limit(req, 'pay', 6, 600);
    const q = E.quote(cfg(), b);
    if (!q.ok) throw err(409, q.code, q.msg);
    if (!/^[a-f0-9]{64}$/.test(String(b.designHash || ''))) throw err(400, 'design', 'Save and approve your book before paying.');
    const phone = payments.normalizePhone ? payments.normalizePhone(b.phone) : null;
    const ph = phone || (String(b.phone || '').replace(/\D/g, '').replace(/^0/, '254').match(/^254[17]\d{8}$/) || [])[0];
    if (!ph) throw err(400, 'phone', 'Enter an M-Pesa number like 0712 345 678.');
    const name = clean(b.name, 80), email = clean(b.email, 190).toLowerCase();
    if (name.length < 2) throw err(400, 'name', 'Enter your name.');
    if (!isEmail(email)) throw err(400, 'email', 'Enter a valid email address.');
    let addr = null;
    if (q.product === 'print') {
      if (!printReady()) throw err(409, 'print_unavailable', 'Printed books can’t be ordered online yet. Choose the digital PDF, or contact us.');
      if (q.needsAddress) {
        addr = { line1: clean(b.address && b.address.line1, 120), area: clean(b.address && b.address.area, 80), town: clean(b.address && b.address.town, 60), county: clean(b.address && b.address.county, 60), notes: clean(b.address && b.address.notes, 200) };
        if (addr.line1.length < 3 || addr.town.length < 2) throw err(400, 'address', 'Enter a delivery address and town.');
      }
    }
    await limit(req, 'pay-phone', 4, 600, ph);
    const ref = orderRef(), iat = now();
    const specs = { formatId: b.formatId, pages: Number(b.pages), binding: q.product === 'print' ? b.binding : undefined, paper: q.product === 'print' ? b.paper : undefined, quantity: q.quantity || 1, delivery: q.product === 'print' ? b.delivery : undefined };
    const r = await mp.stkPush({ phone: ph, amount: q.total, accountRef: 'PHOTOBOOK', description: 'Photo book', callbackUrl: process.env.MPESA_CALLBACK_URL || base() + '/api/mpesa-callback' });
    if (!r.ok) throw err(502, 'mpesa', r.error || 'M-Pesa could not start the payment. Check the number and try again.');
    const intent = tokenSign('intent', { cr: r.checkoutRequestID, ref, product: q.product, amount: q.total, designHash: b.designHash, specs, iat, email });
    if (store().durable) {
      const del = q.product === 'print' ? (cfg().delivery || []).find(x => x.id === b.delivery) : null;
      const o = { ref, product: q.product, status: 'awaiting_payment', history: [{ status: 'awaiting_payment', at: iat }], total: q.total, currency: q.currency, lines: q.lines, specs, designHash: b.designHash, projectRef: clean(b.projectRef, 40), customer: { name, email, phone: ph }, delivery: del ? { id: del.id, name: del.name, address: addr } : null, notes: clean(b.notes, 500), cr: r.checkoutRequestID, createdAt: iat, files: {} };
      await putOrder(o); await store().set('pb:cr:' + r.checkoutRequestID, ref, { ex: 30 * 86400 }); await store().zadd('pb:orders', iat, ref);
    }
    return { ok: true, intent, ref, amount: q.total, currency: q.currency };
  };

  /** poll a payment. Only Daraja's own confirmation produces a receipt. */
  R.status = async (req) => {
    const b = await readBody(req, 8192);
    const it = tokenRead('intent', b.intent);
    if (!it) throw err(400, 'token', 'This payment link is not valid.');
    await limit(req, 'status', 90, 600);
    const s = await mp.query(it.cr);
    if (s.status === 'pending') return { ok: true, status: 'pending' };
    let o = store().durable ? await getOrder(it.ref) : null;
    if (s.status === 'failed') {
      if (o && o.status === 'awaiting_payment') { setStatus(o, 'payment_failed', s.desc); await putOrder(o); }
      return { ok: true, status: 'failed', desc: s.desc || 'The payment was not completed.' };
    }
    // paid: finalize exactly once
    let first;
    if (store().durable) first = await store().set('pb:paid:' + it.cr, { at: now() }, { nx: true, ex: 400 * 86400 });
    else { first = !memPaid.has(it.cr); memPaid.add(it.cr); }
    if (o && first) {
      setStatus(o, 'paid'); o.paidAt = now();
      if (o.product === 'print') setStatus(o, 'preparing', 'Waiting for the approved print files from the customer’s device.');
      await putOrder(o);
    }
    const receipt = tokenSign('receipt', { cr: it.cr, ref: it.ref, product: it.product, amount: it.amount, designHash: it.designHash, specs: it.specs, paid: it.iat });
    const orderToken = tokenSign('order', { ref: it.ref, cr: it.cr });
    if (first) {
      const rows = [['Order', it.ref], ['Product', it.product === 'print' ? 'Printed photo book' : 'Digital PDF photo book'], ['Amount', money(it.amount)], ['Format', it.specs.formatId + ' · ' + it.specs.pages + ' pages']];
      const statusLink = base() + '/photobooks/order?t=' + encodeURIComponent(orderToken);
      await mail(team(), '[Photo Books] Paid ' + (it.product === 'print' ? 'PRINT order' : 'digital PDF') + ' ' + it.ref, 'Payment confirmed by M-Pesa', it.product === 'print' ? 'A printed photo book was paid for. It needs printing once the approved files arrive (Photo Books admin).' : 'A digital PDF photo book was paid for. The customer generates the PDF on their device.', rows.concat(o ? [['Customer', o.customer.name + ' · ' + o.customer.email + ' · ' + o.customer.phone]] : []), null, base() + '/photobooks/admin');
      if (it.email) await mail(it.email, 'Your photo book order ' + it.ref, 'Thank you — payment received', it.product === 'print' ? 'We’ve received your payment for a printed photo book. Keep the order page open until your print files finish sending. We’ll email you as your order moves along.' : 'Your digital photo book is unlocked. Download it from the same browser and device you designed it on.', rows, it.product === 'print' ? 'Order status: ' + statusLink : 'Your photos stay on your device, so the PDF is created there.', statusLink);
    }
    return { ok: true, status: 'paid', receipt, orderToken, ref: it.ref, product: it.product };
  };

  /** server check before the browser builds a paid file */
  R.verify = async (req) => {
    const b = await readBody(req, 8192);
    const rc = tokenRead('receipt', b.receipt);
    if (!rc) throw err(403, 'receipt', 'We couldn’t verify this purchase.');
    if (b.designHash && b.designHash !== rc.designHash) throw err(409, 'version', 'This purchase is for a different version of the book.');
    return { ok: true, product: rc.product, ref: rc.ref, designHash: rc.designHash, specs: rc.specs };
  };
  R.delivered = async (req) => {
    const b = await readBody(req, 8192); const rc = tokenRead('receipt', b.receipt); if (!rc) throw err(403, 'receipt', 'Invalid receipt.');
    if (store().durable && rc.product === 'digital') { const o = await getOrder(rc.ref); if (o && o.status === 'paid') { setStatus(o, 'pdf_delivered', 'PDF generated on the customer’s device'); await putOrder(o); } }
    return { ok: true };
  };
  R.order = async (req, q) => {
    const t = tokenRead('order', q.t); if (!t) throw err(403, 'token', 'This order link is not valid.');
    if (!store().durable) return { ok: true, order: { ref: t.ref, status: 'paid', statusLabel: 'Paid', history: [] }, limited: true };
    const o = await getOrder(t.ref); if (!o) throw err(404, 'missing', 'Order not found.');
    return { ok: true, order: publicOrder(o) };
  };

  /* ---- print files: uploaded in chunks with the order token, kept until the admin deletes them ---- */
  async function orderFor(tok) {
    const t = tokenRead('order', tok); if (!t) throw err(403, 'token', 'Not allowed.');
    if (!store().durable) throw err(409, 'storage', 'Order storage is not set up.');
    const o = await getOrder(t.ref); if (!o || o.product !== 'print') throw err(404, 'missing', 'Order not found.');
    if (['awaiting_payment', 'payment_failed', 'cancelled', 'refunded'].includes(o.status)) throw err(409, 'state', 'This order is not paid.');
    return o;
  }
  R['file-init'] = async (req) => {
    const b = await readBody(req, 8192), o = await orderFor(b.orderToken);
    if (!FILES.includes(b.file)) throw err(400, 'file', 'Unknown file.');
    if (o.files[b.file] && o.files[b.file].complete) return { ok: true, complete: true };
    if (b.designHash !== o.designHash) throw err(409, 'version', 'These files are from a different version than the one paid for.');
    const size = Number(b.size), chunks = Math.ceil(size / CHUNK);
    if (!(size > 0 && size < 400 * 1048576) || !/^[a-f0-9]{64}$/.test(b.sha256 || '')) throw err(400, 'file', 'Invalid file.');
    await store().set('pb:fmeta:' + o.ref + ':' + b.file, { size, sha256: b.sha256, chunks, pages: Number(b.pages) || null }, { ex: FILE_TTL });
    return { ok: true, chunk: CHUNK, chunks };
  };
  R['file-chunk'] = async (req, q) => {
    const o = await orderFor(req.headers['x-order-token']);
    const file = q.file, i = Number(q.i);
    const meta = await store().get('pb:fmeta:' + o.ref + ':' + file); if (!meta) throw err(409, 'init', 'Start the upload first.');
    if (!(i >= 0 && i < meta.chunks)) throw err(400, 'chunk', 'Bad chunk.');
    const buf = await readBody(req, CHUNK + 1024, true);
    const expect = i === meta.chunks - 1 ? meta.size - CHUNK * (meta.chunks - 1) : CHUNK;
    if (buf.length !== expect) throw err(400, 'chunk', 'Chunk size mismatch.');
    await store().set('pb:file:' + o.ref + ':' + file + ':' + i, buf.toString('base64'), { ex: FILE_TTL });
    return { ok: true };
  };
  R['file-done'] = async (req) => {
    const b = await readBody(req, 8192), o = await orderFor(b.orderToken);
    const meta = await store().get('pb:fmeta:' + o.ref + ':' + b.file); if (!meta) throw err(409, 'init', 'Upload not started.');
    const h = crypto.createHash('sha256'); let size = 0;
    for (let i = 0; i < meta.chunks; i++) { const c = await store().get('pb:file:' + o.ref + ':' + b.file + ':' + i); if (!c) throw err(409, 'incomplete', 'Part ' + (i + 1) + ' of the file is missing. Try sending again.'); const buf = Buffer.from(c, 'base64'); size += buf.length; h.update(buf); }
    if (size !== meta.size || h.digest('hex') !== meta.sha256) throw err(409, 'checksum', 'The file didn’t arrive intact. Try sending again.');
    o.files[b.file] = { size, sha256: meta.sha256, chunks: meta.chunks, pages: meta.pages, complete: true, at: now() };
    if (FILES.every(f => o.files[f] && o.files[f].complete) && o.status === 'preparing') {
      setStatus(o, 'ready', 'Approved print files received and checked');
      await mail(team(), '[Photo Books] Print files ready ' + o.ref, 'Print files received', 'The approved interior and cover files for ' + o.ref + ' are ready to download in the Photo Books admin.', [['Order', o.ref], ['Customer', o.customer.name], ['Delivery', o.delivery ? o.delivery.name : '—']], null, base() + '/photobooks/admin');
    }
    await putOrder(o);
    return { ok: true, order: publicOrder(o) };
  };

  /* ---- admin (same sign-in as the Ciel Domains admin: ADMIN_PASSWORD) ---- */
  R['admin-login'] = async (req) => {
    const b = await readBody(req, 4096); await limit(req, 'login', 8, 900);
    if (!sec.secret() || !process.env.ADMIN_PASSWORD) throw err(503, 'setup', 'Set ADMIN_PASSWORD in Vercel to use the admin.');
    if (!sec.checkPassword(b.password)) throw err(401, 'auth', 'Wrong password.');
    return [{ ok: true }, { 'Set-Cookie': sec.sessionCookie(sec.makeSession(), sec.SESSION_H * 3600) }];
  };
  R['admin-logout'] = async () => [{ ok: true }, { 'Set-Cookie': sec.sessionCookie('', 0) }];
  R['admin-me'] = async (req) => { const ok = !!(sec.secret() && process.env.ADMIN_PASSWORD && sec.checkSession(req)); return { ok: true, signedIn: ok, setup: { adminPassword: !!process.env.ADMIN_PASSWORD, orders: printReady(), payments: mpesaOn(), email: !!process.env.RESEND_API_KEY, ai: !!(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY), publish: !!process.env.GITHUB_TOKEN } }; };
  R['admin-orders'] = async (req, q) => {
    admin(req);
    if (!store().durable) return { ok: true, durable: false, orders: [] };
    const refs = await store().zrevrange('pb:orders', 0, 499);
    let list = (await store().mget(refs.map(r => 'pb:order:' + r))).filter(Boolean);
    if (q.status) list = list.filter(o => o.status === q.status);
    if (q.product) list = list.filter(o => o.product === q.product);
    if (q.from) list = list.filter(o => o.createdAt >= Date.parse(q.from));
    if (q.to) list = list.filter(o => o.createdAt <= Date.parse(q.to) + 864e5);
    if (q.q) { const s = String(q.q).toLowerCase(); list = list.filter(o => (o.ref + ' ' + o.customer.name + ' ' + o.customer.email + ' ' + o.customer.phone).toLowerCase().includes(s)); }
    return { ok: true, durable: true, statuses: STATUSES, adminStatuses: ADMIN_SET, orders: list };
  };
  R['admin-status'] = async (req) => {
    admin(req); const b = await readBody(req, 8192);
    const o = await getOrder(b.ref); if (!o) throw err(404, 'missing', 'Order not found.');
    if (!ADMIN_SET.includes(b.status)) throw err(400, 'status', 'Unknown status.');
    if (['awaiting_payment', 'payment_failed'].includes(o.status) && b.status !== 'cancelled') throw err(409, 'state', 'This order has not been paid.');
    if (b.status === 'refunded' && !clean(b.note)) throw err(400, 'note', 'Add the M-Pesa reversal or refund reference in the note.');
    if (!setStatus(o, b.status, b.note, 'admin')) return { ok: true, order: o };
    if (b.public && o.history.length) o.history[o.history.length - 1].public = true;
    await putOrder(o);
    if (b.notify) {
      const link = base() + '/photobooks/order?t=' + encodeURIComponent(tokenSign('order', { ref: o.ref, cr: o.cr }));
      await mail(o.customer.email, 'Photo book ' + o.ref + ': ' + STATUSES[b.status], STATUSES[b.status], 'Your photo book order ' + o.ref + ' is now: <b>' + STATUSES[b.status] + '</b>.' + (b.public && b.note ? '<br>' + clean(b.note, 300) : ''), [['Order', o.ref]], null, link);
    }
    return { ok: true, order: o };
  };
  R['admin-file'] = async (req, q) => {
    admin(req);
    const o = await getOrder(q.ref); if (!o || !o.files || !o.files[q.file] || !o.files[q.file].complete) throw err(404, 'missing', 'File not found.');
    const i = Number(q.i), f = o.files[q.file];
    if (!(i >= 0 && i < f.chunks)) throw err(400, 'chunk', 'Bad chunk.');
    const c = await store().get('pb:file:' + o.ref + ':' + q.file + ':' + i); if (!c) throw err(410, 'gone', 'This file has been deleted or expired.');
    return { __binary: Buffer.from(c, 'base64'), meta: f };
  };
  R['admin-file-delete'] = async (req) => {
    admin(req); const b = await readBody(req, 4096);
    const o = await getOrder(b.ref); if (!o) throw err(404, 'missing', 'Order not found.');
    for (const f of FILES) { const m = o.files[f]; if (m) for (let i = 0; i < m.chunks; i++) await store().del('pb:file:' + o.ref + ':' + f + ':' + i); if (m) { m.deleted = now(); m.complete = false; } }
    o.history.push({ status: o.status, at: now(), note: 'Print files deleted by admin', by: 'admin' });
    await putOrder(o); return { ok: true };
  };

  /* ================= /photobooks cart checkout (portrait book) =================
     items: [{ projectId, name, product: 'print'|'digital', pages, qty }]
     Prices come from data/photobooks.js → book, never from the browser. */
  function rule(r, pages, minPages) {
    if (!r || r.base == null || r.perExtraPage == null) return null;
    return Math.round(Number(r.base) + Math.max(0, pages - (r.includedPages || minPages)) * Number(r.perExtraPage));
  }
  function pbkQuote(b) {
    const c = cfg(), bk = c.book;
    if (!bk) throw err(503, 'setup', 'Photo books are not on sale right now.');
    const items = (Array.isArray(b.items) ? b.items : []).slice(0, 10);
    if (!items.length) throw err(400, 'empty', 'Your cart has no photo books.');
    const lines = []; let total = 0, anyPrint = false;
    const clean2 = items.map(it => {
      const product = it.product === 'digital' ? 'digital' : 'print';
      const pages = Math.round(Number(it.pages) || 0);
      if (pages < bk.pages.min || pages > bk.pages.max || pages % 2) throw err(400, 'pages', 'A book has between ' + bk.pages.min + ' and ' + bk.pages.max + ' pages.');
      const qty = product === 'digital' ? 1 : Math.max(1, Math.min(c.maxQuantity || 10, Math.round(Number(it.qty) || 1)));
      const unit = rule(product === 'digital' ? bk.digital : bk.price, pages, bk.pages.min);
      if (unit == null) throw err(409, 'price_not_set', 'This product is not priced yet.');
      const name = clean(it.name, 60) || 'Photo book';
      const label = name + ' · ' + (product === 'digital' ? 'Print-ready PDF' : (bk.binding || 'Hardcover') + ' ' + (bk.size || '')) + ' · ' + pages + ' pages';
      lines.push({ label, amount: unit, qty }); total += unit * qty; if (product === 'print') anyPrint = true;
      return { projectId: clean(it.projectId, 40), name, product, pages, qty, unit };
    });
    let del = null;
    if (anyPrint) {
      del = (c.delivery || []).find(x => x.id === b.delivery && x.enabled !== false);
      if (!del) throw err(400, 'delivery', 'Choose collection or delivery.');
      if (del.price == null) throw err(409, 'price_not_set', 'Delivery is not priced yet.');
      lines.push({ label: del.name, amount: Number(del.price), qty: 1 }); total += Number(del.price);
    }
    return { ok: true, items: clean2, lines, total, currency: c.currency || 'KES', delivery: del ? { id: del.id, name: del.name, price: del.price, needsAddress: !!del.needsAddress } : null, anyPrint };
  }
  R['pbk-quote'] = async (req) => { const b = await readBody(req, 16384); const q = pbkQuote(b); return q; };
  R['pbk-pay'] = async (req) => {
    const b = await readBody(req, 16384);
    if (!mpesaOn() || !sec.secret()) throw err(503, 'setup', 'M-Pesa checkout is not available right now. Please order on WhatsApp.');
    await limit(req, 'pbk-pay', 6, 600);
    const q = pbkQuote(b);
    const ph = payments.normalizePhone ? payments.normalizePhone(b.phone) : null;
    if (!ph) throw err(400, 'phone', 'Enter an M-Pesa number like 0712 345 678.');
    const name = clean(b.name, 80), email = clean(b.email, 190).toLowerCase();
    if (name.length < 2) throw err(400, 'name', 'Enter your full name.');
    if (!isEmail(email)) throw err(400, 'email', 'Enter a valid email address.');
    let addr = null;
    if (q.delivery && q.delivery.needsAddress) {
      const a = b.address || {};
      addr = { line1: clean(a.line1, 120), area: clean(a.area, 80), town: clean(a.town, 60), county: clean(a.county, 60), notes: clean(a.notes, 200) };
      if (addr.line1.length < 3 || addr.town.length < 2) throw err(400, 'address', 'Enter a delivery address and town.');
    }
    const gift = b.gift && b.gift.is ? { to: clean(b.gift.to, 80), phone: clean(b.gift.phone, 30), note: clean(b.gift.note, 400) } : null;
    await limit(req, 'pbk-pay-phone', 4, 600, ph);
    const ref = orderRef(), iat = now();
    const r = await mp.stkPush({ phone: ph, amount: q.total, accountRef: ref.replace('-', ''), description: 'Photo book', callbackUrl: process.env.MPESA_CALLBACK_URL || base() + '/api/mpesa-callback' });
    if (!r.ok) throw err(502, 'mpesa', r.error || 'M-Pesa could not start the payment. Check the number and try again.');
    const items = q.items.map(i => ({ p: i.projectId, n: i.name, pr: i.product, pg: i.pages, q: i.qty }));
    if (BS.on()) {
      await BS.saveOrder({ ref, app: 'pbk', status: 'awaiting_payment', history: [{ status: 'awaiting_payment', at: iat }], total: q.total, currency: q.currency, lines: q.lines,
        items: q.items.map(i => ({ projectId: i.projectId, name: i.name, product: i.product, pages: i.pages, qty: i.qty, unit: i.unit })),
        customer: { name, email, phone: ph }, delivery: q.delivery, address: addr, gift, cr: r.checkoutRequestID, createdAt: iat });
    }
    const intent = tokenSign('pbk-intent', { cr: r.checkoutRequestID, ref, amount: q.total, items, iat, c: { n: name, e: email, ph }, d: q.delivery ? q.delivery.name : null, a: addr, g: gift });
    if (store().durable) {
      const o = { ref, product: q.anyPrint ? 'print' : 'digital', app: 'pbk', status: 'awaiting_payment', history: [{ status: 'awaiting_payment', at: iat }], total: q.total, currency: q.currency, lines: q.lines, items, customer: { name, email, phone: ph }, delivery: q.delivery, address: addr, files: {}, createdAt: iat };
      await putOrder(o); await store().set('pb:cr:' + r.checkoutRequestID, ref, { ex: 30 * 86400 }); await store().zadd('pb:orders', iat, ref);
    }
    return { ok: true, intent, ref, amount: q.total, currency: q.currency };
  };
  R['pbk-status'] = async (req) => {
    const b = await readBody(req, 16384);
    const it = tokenRead('pbk-intent', b.intent);
    if (!it) throw err(400, 'token', 'This payment link is not valid.');
    await limit(req, 'status', 90, 600);
    const s = await mp.query(it.cr);
    if (s.status === 'pending') return { ok: true, status: 'pending' };
    const o = store().durable ? await getOrder(it.ref) : null;
    const bo = BS.on() ? await BS.getOrder(it.ref).catch(() => null) : null;
    if (s.status === 'failed') {
      if (o && o.status === 'awaiting_payment') { setStatus(o, 'payment_failed', s.desc); await putOrder(o); }
      if (bo && bo.status === 'awaiting_payment') { setStatus(bo, 'payment_failed', s.desc); await BS.saveOrder(bo); }
      return { ok: true, status: 'failed', desc: s.desc || 'The payment was not completed.' };
    }
    let first;
    if (store().durable) first = await store().set('pb:paid:' + it.cr, { at: now() }, { nx: true, ex: 400 * 86400 });
    else { first = !memPaid.has(it.cr); memPaid.add(it.cr); }
    if (o && first) { setStatus(o, 'paid'); o.paidAt = now(); if (o.product === 'print') setStatus(o, 'preparing', 'Waiting for the print file from the customer.'); await putOrder(o); }
    if (bo && bo.status !== 'paid' && !bo.paidAt) { setStatus(bo, 'paid', 'Confirmed with M-Pesa'); bo.paidAt = now(); first = true; await BS.saveOrder(bo); }
    else if (bo) first = false;
    const receipts = it.items.map(i => ({ projectId: i.p, product: i.pr, pages: i.pg, receipt: tokenSign('pbk-receipt', { ref: it.ref, cr: it.cr, p: i.p, pr: i.pr, pg: i.pg }) }));
    if (first) {
      const rows = [['Order', it.ref], ['Paid', money(it.amount)]].concat(it.items.map(i => [i.pr === 'digital' ? 'PDF' : 'Printed × ' + i.q, i.n + ' · ' + i.pg + ' pages'])).concat([['Customer', it.c.n + ' · ' + it.c.e + ' · ' + it.c.ph]]).concat(it.d ? [['Delivery', it.d]] : []).concat(it.a ? [['Address', [it.a.line1, it.a.area, it.a.town, it.a.county, it.a.notes].filter(Boolean).join(', ')]] : []).concat(it.g ? [['Gift', 'For ' + (it.g.to || '—') + (it.g.phone ? ' · ' + it.g.phone : '') + (it.g.note ? ' · Message: “' + it.g.note + '”' : '')]] : []);
      const anyPrint = it.items.some(i => i.pr === 'print');
      const auto = BS.on();
      await mail(team(), '[Photo Books] Paid order ' + it.ref + (anyPrint ? ' (PRINT)' : ' (PDF)'), 'Payment confirmed by M-Pesa', anyPrint ? (auto ? 'A printed photo book was paid for. Its print pages upload from the customer’s device; you’ll get another email when they arrive. See the order in Photo Books orders.' : 'A printed photo book was paid for. The customer has been asked to send the print file on WhatsApp or by email, quoting the order number.') : 'A print-ready PDF was paid for. The customer downloads it on their device.', rows, null, base() + '/photobooks/orders');
      await mail(it.c.e, 'Your photo book order ' + it.ref, 'Thank you — payment received', anyPrint ? (auto ? 'We’ve received your payment. Your book’s pages are sending to us from your device: keep the page open until it says they’ve arrived. We’ll confirm when it goes to print.' : 'We’ve received your payment. Please send us your book’s print file from the order page, on WhatsApp +254 706 549 703 or to hello@cielafrica.com, quoting ' + it.ref + '.') : 'Your print-ready PDF is unlocked. Download it from your book on the same device you designed it on.', rows.filter(r => r[0] !== 'Customer'), null, base() + '/photobooks/my-books');
    }
    return { ok: true, status: 'paid', ref: it.ref, receipts };
  };
  /* ---- print pages: uploaded from the customer's device after payment, one page per request ---- */
  R['pbk-caps'] = async () => ({ ok: true, payments: mpesaOn() && !!sec.secret(), uploads: BS.on() });
  R['pbk-upload'] = async (req, q) => {
    if (!BS.on()) throw err(409, 'storage', 'Order storage is not set up.');
    const rc = tokenRead('pbk-receipt', req.headers['x-receipt']);
    if (!rc) throw err(403, 'receipt', 'Not allowed.');
    const kind = q.kind, i = Math.round(Number(q.i));
    if (!['print', 'view', 'book'].includes(kind)) throw err(400, 'kind', 'Bad file.');
    if (kind !== 'book' && !(i >= 0 && i <= rc.pg + 3)) throw err(400, 'index', 'Bad page.');
    await limit(req, 'pbk-up', 900, 3600, rc.ref);
    const buf = await readBody(req, 4.4 * 1024 * 1024, true);
    if (kind === 'book') { let j; try { j = JSON.parse(buf.toString()); } catch (e) { throw err(400, 'json', 'Bad book.'); } await BS.putJSON('orders/' + rc.ref + '/' + rc.p + '/book.json', Object.assign(j, { receivedAt: now(), pages: rc.pg, product: rc.pr })); return { ok: true }; }
    if (!(buf[0] === 0xFF && buf[1] === 0xD8)) throw err(400, 'type', 'Pages must be JPEG.');
    await BS.putFile('orders/' + rc.ref + '/' + rc.p + '/' + kind + '/' + String(i).padStart(3, '0') + '.jpg', buf, 'image/jpeg');
    return { ok: true };
  };
  R['pbk-upload-done'] = async (req) => {
    if (!BS.on()) throw err(409, 'storage', 'Order storage is not set up.');
    const b = await readBody(req, 8192), rc = tokenRead('pbk-receipt', b.receipt);
    if (!rc) throw err(403, 'receipt', 'Not allowed.');
    const files = await BS.listFiles('orders/' + rc.ref + '/' + rc.p + '/print/');
    const o = await BS.getOrder(rc.ref);
    if (o) {
      o.files = o.files || {}; const had = o.files[rc.p] && o.files[rc.p].complete;
      o.files[rc.p] = { complete: true, pages: files.length, at: now() };
      if (!had) { o.history = (o.history || []).concat([{ status: o.status, at: now(), note: 'Print pages received for ' + rc.p + ' (' + files.length + ' files)' }]); if (o.status === 'paid') setStatus(o, 'ready', 'Print files received'); }
      await BS.saveOrder(o);
      if (!had) await mail(team(), '[Photo Books] Print pages received ' + rc.ref, 'Print pages received', 'All pages for ' + rc.ref + ' have arrived and are ready to print.', [['Order', rc.ref], ['Customer', o.customer.name + ' · ' + o.customer.phone], ['Files', String(files.length)]], null, base() + '/photobooks/orders');
    }
    return { ok: true, files: files.length };
  };
  /* ---- orders admin (/photobooks/orders) ---- */
  R['pbk-admin-orders'] = async (req) => { admin(req); if (!BS.on()) return { ok: true, storage: false, orders: [] }; return { ok: true, storage: true, orders: await BS.listOrders(500) }; };
  R['pbk-admin-order'] = async (req, q) => {
    admin(req); const o = await BS.getOrder(q.ref); if (!o) throw err(404, 'missing', 'Order not found.');
    const files = await BS.listFiles('orders/' + o.ref + '/');
    const books = {};
    files.forEach(f => { const m = f.path.match(/^orders\/[^/]+\/([^/]+)\/(print|view)\/(\d{3})\.jpg$/); if (m) { const b = books[m[1]] = books[m[1]] || { print: [], view: [] }; b[m[2]].push({ path: f.path, size: f.size }); } });
    for (const pid of Object.keys(books)) { books[pid].print.sort((a, b) => a.path < b.path ? -1 : 1); books[pid].view.sort((a, b) => a.path < b.path ? -1 : 1); books[pid].book = await BS.getJSON('orders/' + o.ref + '/' + pid + '/book.json').catch(() => null); }
    return { ok: true, order: o, books };
  };
  R['pbk-admin-file'] = async (req, q) => {
    admin(req);
    if (!/^orders\/PB-[0-9A-Z]{8}\/[A-Za-z0-9_-]{1,40}\/(print|view)\/\d{3}\.jpg$/.test(String(q.path || ''))) throw err(400, 'path', 'Bad file.');
    const r = await BS.getBuf(q.path); if (!r) throw err(404, 'missing', 'File not found.');
    return { __binary: r.buf, meta: { type: 'image/jpeg' } };
  };
  R['pbk-admin-status'] = async (req) => {
    admin(req); const b = await readBody(req, 4096); const o = await BS.getOrder(b.ref); if (!o) throw err(404, 'missing', 'Order not found.');
    if (!ADMIN_SET.concat(['paid']).includes(b.status)) throw err(400, 'status', 'Unknown status.');
    setStatus(o, b.status, b.note, 'admin'); await BS.saveOrder(o);
    return { ok: true, order: o };
  };

  R['pbk-verify'] = async (req) => {
    const b = await readBody(req, 8192); const rc = tokenRead('pbk-receipt', b.receipt);
    if (!rc) throw err(403, 'receipt', 'We couldn’t verify this purchase.');
    if (b.projectId && b.projectId !== rc.p) throw err(409, 'project', 'This purchase is for a different book.');
    return { ok: true, ref: rc.ref, product: rc.pr, projectId: rc.p, pages: rc.pg };
  };

  return async function handler(req, res) {
    const u = new URL(req.url, 'http://x'), q = Object.fromEntries(u.searchParams.entries()), route = q.route || '';
    const fn = R[route];
    try {
      if (!fn) throw err(404, 'route', 'Not found.');
      const isGet = ['caps', 'order', 'admin-orders', 'admin-me', 'admin-file', 'pbk-caps', 'pbk-admin-orders', 'pbk-admin-order', 'pbk-admin-file'].includes(route);
      if (isGet ? req.method !== 'GET' : req.method !== 'POST') throw err(405, 'method', 'Method not allowed.');
      if (!isGet && !sec.sameOrigin(req)) throw err(403, 'origin', 'Blocked.');
      const out = await fn(req, q);
      if (out && out.__binary) { res.statusCode = 200; res.setHeader('Content-Type', out.meta.type || 'application/octet-stream'); res.setHeader('Cache-Control', 'private, no-store'); if (out.meta.sha256) res.setHeader('X-File-Sha256', out.meta.sha256); return res.end(out.__binary); }
      if (Array.isArray(out)) return send(res, 200, out[0], out[1]);
      return send(res, 200, out);
    } catch (e) {
      const code = e && e.status ? e.status : 500;
      if (code >= 500 && !e.status) console.error('[photobooks]', route, e);
      return send(res, code, { ok: false, code: (e && e.code) || 'error', error: e && e.status ? e.message : 'Something went wrong on our side. Please try again.' });
    }
  };
}

module.exports = { createHandler, STATUSES, tokenSign, tokenRead, CHUNK };
