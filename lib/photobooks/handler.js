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
const PM = require('./mail');

const STATUSES = {
  awaiting_payment: 'Awaiting payment', awaiting_confirmation: 'Paybill: confirm payment', whatsapp_request: 'WhatsApp order request', paid: 'Paid', preparing: 'Preparing print files', ready: 'Ready for printing',
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
const esc = s => String(s == null ? '' : s).replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

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
  /** branded photo book email (lib/photobooks/mail.js) */
  /* the front cover the customer's device sent (orders/<ref>/<book>/view/000.jpg), for the emails */
  async function coverOf(o) {
    if (!BS.on() || !o || !o.files) return null;
    for (const pid of Object.keys(o.files)) { const r = await BS.getBuf('orders/' + o.ref + '/' + activeDir(o, pid) + '/view/000.jpg').catch(() => null); if (r && r.buf) return r.buf; }
    return null;
  }
  async function mailBook(to, subject, o) {
    const cover = o.cover; delete o.cover;
    if (cover) o.coverCid = 'bookcover';
    const html = PM.render(o);
    if (deps.email) return deps.email({ to, subject, title: o.title, html, cover: !!cover });
    if (!process.env.RESEND_API_KEY) { console.log('[photobooks] email not configured:', subject); return { ok: false, skipped: true }; }
    try {
      const r = await (deps.fetch || fetch)('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(10000),
        body: JSON.stringify(Object.assign({ from: process.env.MAIL_FROM || 'Ciel Africa <hello@cielafrica.com>', to: Array.isArray(to) ? to : [to], subject, html, reply_to: 'hello@cielafrica.com' }, cover ? { attachments: [{ filename: 'book-cover.jpg', content: cover.toString('base64'), content_type: 'image/jpeg', content_id: 'bookcover' }] } : {})) });
      return { ok: r.ok };
    } catch (e) { console.error('[photobooks] email error', e && e.message); return { ok: false }; }
  }
  const trackUrl = ref => base() + '/photobooks/track?ref=' + encodeURIComponent(ref) + '&t=' + encodeURIComponent(tokenSign('pbk-track', { ref }));
  const addrText = a => a ? [a.line1, a.area, a.town, a.county, a.country && a.country !== 'Kenya' ? a.country : ''].filter(Boolean).join(', ') + (a.notes ? '\n' + a.notes : '') : '';
  const giftText = g => g ? 'For ' + (g.to || '—') + (g.phone ? ' · ' + g.phone : '') + (g.note ? '\n“' + g.note + '”' : '') : '';
  /** tells the customer that their order moved on (printing, dispatched, delivered…) */
  async function notifyCustomer(o, status, note) {
    const m = PM.CUSTOMER_STATUS[status]; if (!m || !o || !o.customer || !o.customer.email) return;
    const cover = await coverOf(o).catch(() => null);
    await mailBook(o.customer.email, (o.test ? '[TEST] ' : '') + m.title + ' · ' + o.ref, { cover, eyebrow: 'Order update', title: m.title, intro: esc(m.intro) + (note ? '<br><br><i>' + esc(note) + '</i>' : ''), ref: o.ref, status, product: (o.items || []).some(i => i.product === 'print') ? 'print' : 'digital', details: [['Delivery', o.delivery && o.delivery.name], ['Address', addrText(o.address)]], button: { label: 'Track your order', url: trackUrl(o.ref) }, test: o.test });
  }

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
    /* a price for each book size: a book between sizes pays the next size up */
    if (r && r.tiers && typeof r.tiers === 'object') {
      const t = Object.keys(r.tiers).map(Number).filter(n => n > 0 && r.tiers[n] != null).sort((a, b) => a - b);
      if (!t.length) return null; const k = t.find(n => n >= pages) || t[t.length - 1];
      return Math.round(Number(r.tiers[k]));
    }
    if (!r || r.base == null || r.perExtraPage == null) return null;
    return Math.round(Number(r.base) + Math.max(0, pages - (r.includedPages || minPages)) * Number(r.perExtraPage));
  }
  function pbkQuote(b, opt) {
    opt = opt || {};
    const c = cfg(), bk = c.book;
    if (!bk) throw err(503, 'setup', 'Photo books are not on sale right now.');
    const items = (Array.isArray(b.items) ? b.items : []).slice(0, 10);
    if (!items.length) throw err(400, 'empty', 'Your cart has no photo books.');
    if (items.some(it => it && it.test)) {
      /* the admin-only test book: one item, a fixed small price, no delivery charge */
      if (items.length !== 1) throw err(400, 'test', 'A test order has to be on its own. Remove the other books from the cart.');
      const it = items[0], pages = Math.round(Number(it.pages) || 0), price = Number(bk.testPrice || 5);
      if (pages < bk.pages.min || pages > bk.pages.max || pages % 2) throw err(400, 'pages', 'A book has between ' + bk.pages.min + ' and ' + bk.pages.max + ' pages.');
      const name = clean(it.name, 60) || 'Ciel Test';
      return { ok: true, test: true, items: [{ projectId: clean(it.projectId, 40), name, product: 'print', pages, qty: 1, unit: price }], lines: [{ label: name + ' · TEST order · ' + pages + ' pages', amount: price, qty: 1 }], total: price, currency: c.currency || 'KES', delivery: (function () { const d = (c.delivery || []).find(x => x.id === b.delivery && x.enabled !== false) || { id: 'collect', name: 'Collection', needsAddress: false }; return { id: d.id, name: d.name + ' (test, free)', price: 0, needsAddress: !!d.needsAddress }; })(), anyPrint: true };
    }
    const lines = []; let total = 0, anyPrint = false;
    const clean2 = items.map(it => {
      const product = it.product === 'digital' ? 'digital' : 'print';
      if (product === 'digital' && bk.pdf === false) throw err(409, 'pdf_off', 'Print-ready PDFs aren’t sold right now. Choose the printed hardcover.');
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
    if (anyPrint && !opt.noDelivery) {
      del = (c.delivery || []).find(x => x.id === b.delivery && x.enabled !== false);
      if (!del) throw err(400, 'delivery', 'Choose how you’d like your book delivered.');
      if (del.price == null) throw err(409, 'price_not_set', 'Delivery is not priced yet.');
      lines.push({ label: del.name, amount: Number(del.price), qty: 1 }); total += Number(del.price);
    }
    return { ok: true, items: clean2, lines, total, currency: c.currency || 'KES', delivery: del ? { id: del.id, name: del.name, price: del.price, needsAddress: !!del.needsAddress } : null, anyPrint };
  }
  /* ---- coupons (Ciel Admin → Website → Prices): kept in Blob storage, never in the public files ----
     { code, type: 'percent'|'fixed', value, expires: 'YYYY-MM-DD' | null, maxUses, minTotal, active, uses } */
  const CP = 'pbk/coupons.json';
  const cpCode = s => String(s || '').toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 24);
  async function couponList() { const d = BS.on() ? await BS.getJSON(CP).catch(() => null) : null; return (d && Array.isArray(d.list)) ? d.list : []; }
  async function couponSave(list) { if (!BS.on()) throw err(409, 'storage', 'Blob storage isn’t connected.'); await BS.putJSON(CP, { list, at: now() }); }
  /** applies a coupon to the books (not delivery); throws a clear message if it can't be used */
  async function withCoupon(q, code) {
    code = cpCode(code); if (!code) return q;
    if (q.test) throw err(400, 'coupon', 'Coupons don’t apply to test orders.');
    const cp = (await couponList()).find(x => x.code === code);
    if (!cp || cp.active === false) throw err(404, 'coupon', 'That coupon code isn’t valid.');
    const today = new Date(now() + 3 * 36e5).toISOString().slice(0, 10); /* Nairobi date */
    if (cp.starts && today < cp.starts) throw err(400, 'coupon', 'That coupon isn’t active yet.');
    if (cp.expires && today > cp.expires) throw err(400, 'coupon', 'That coupon has expired.');
    if (cp.maxUses && (cp.uses || 0) >= cp.maxUses) throw err(400, 'coupon', 'That coupon has been used up.');
    const sub = q.items.reduce((s, i) => s + i.unit * i.qty, 0);
    if (cp.minTotal && sub < cp.minTotal) throw err(400, 'coupon', 'That coupon needs books worth ' + money(cp.minTotal) + ' or more.');
    let off = cp.type === 'percent' ? Math.round(sub * Math.min(100, Math.max(0, +cp.value)) / 100) : Math.round(+cp.value || 0);
    off = Math.min(off, sub); if (off <= 0) return q;
    if (q.total - off < 1) throw err(400, 'coupon', 'That coupon covers the whole order. WhatsApp us on +254 706 549 703 and we’ll set it up for you.');
    q.lines.push({ label: 'Coupon ' + code + (cp.type === 'percent' ? ' (' + (+cp.value) + '% off)' : ''), amount: -off, qty: 1 });
    q.total -= off; q.coupon = { code, type: cp.type, value: +cp.value, discount: off };
    return q;
  }
  async function couponUsed(code, ref) {
    code = cpCode(code); if (!code || !BS.on()) return;
    const list = await couponList(), cp = list.find(x => x.code === code); if (!cp) return;
    cp.uses = (cp.uses || 0) + 1; cp.refs = (cp.refs || []).concat([ref]).slice(-200); await couponSave(list).catch(() => null);
  }
  R['pbk-coupon'] = async (req) => {
    const b = await readBody(req, 16384); await limit(req, 'pbk-coupon', 25, 600);
    const q = await withCoupon(pbkQuote(b, { noDelivery: true }), b.coupon);
    if (!q.coupon) throw err(400, 'coupon', 'Enter a coupon code.');
    return { ok: true, coupon: q.coupon };
  };
  R['pbk-admin-coupons'] = async (req) => { admin(req); return { ok: true, storage: BS.on(), coupons: await couponList() }; };
  R['pbk-admin-coupon-save'] = async (req) => {
    admin(req); const b = await readBody(req, 8192), code = cpCode(b.code);
    if (code.length < 3) throw err(400, 'code', 'A coupon code needs at least 3 letters or numbers.');
    const type = b.type === 'fixed' ? 'fixed' : 'percent', value = Math.round(Number(b.value) * 100) / 100;
    if (!(value > 0) || (type === 'percent' && value > 100)) throw err(400, 'value', type === 'percent' ? 'Enter a percentage between 1 and 100.' : 'Enter an amount in KES.');
    const day = v => /^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) ? String(v) : null;
    const list = await couponList(), old = list.find(x => x.code === (cpCode(b.was) || code));
    if (!old && list.some(x => x.code === code)) throw err(409, 'code', 'There is already a coupon called ' + code + '.');
    const cp = Object.assign(old || { createdAt: now(), uses: 0 }, { code, type, value, starts: day(b.starts), expires: day(b.expires), maxUses: Math.max(0, Math.round(+b.maxUses || 0)) || null, minTotal: Math.max(0, Math.round(+b.minTotal || 0)) || null, active: b.active !== false, note: clean(b.note, 120), updatedAt: now() });
    if (!old) list.unshift(cp);
    await couponSave(list); return { ok: true, coupons: list };
  };
  R['pbk-admin-coupon-delete'] = async (req) => {
    admin(req); const b = await readBody(req, 2048), code = cpCode(b.code);
    const list = (await couponList()).filter(x => x.code !== code); await couponSave(list); return { ok: true, coupons: list };
  };
  R['pbk-quote'] = async (req) => { const b = await readBody(req, 16384); const q = await withCoupon(pbkQuote(b), b.coupon); if (q.test) admin(req); return q; };
  const TEST_TTL = 24 * 3600 * 1000;
  /* Test orders are kept until they are deleted by hand (Delete now in the order). Set
     PBK_TEST_AUTODELETE=1 in Vercel to delete them automatically after 24 hours again. */
  const TEST_AUTODELETE = () => process.env.PBK_TEST_AUTODELETE === '1';
  /** deletes test orders (and their files) older than 24 hours, when switched on */
  async function purgeTests(list) {
    if (!BS.on() || !TEST_AUTODELETE()) return 0;
    list = list || await BS.listOrders(2000); let n = 0;
    for (const o of list) {
      if (!o.test || now() - (o.createdAt || 0) < TEST_TTL) continue;
      const files = await BS.listFiles('orders/' + o.ref + '/'); await BS.del(files.map(f => f.path)); n++;
    }
    return n;
  }
  R['pbk-cron'] = async (req) => {
    if (process.env.CRON_SECRET && req.headers.authorization !== 'Bearer ' + process.env.CRON_SECRET) throw err(401, 'auth', 'Not allowed.');
    const list = BS.on() ? await BS.listOrders(2000) : [];
    return { ok: true, purged: await purgeTests(list), reminded: await remind(list) };
  };
  /* once-a-day reminders for customers who started but didn't finish (one email each, never repeated) */
  async function remind(list) {
    let n = 0; const H = 3600e3, mb = base() + '/photobooks/my-books';
    for (const o of list) {
      if (o.test || !o.customer || !o.customer.email) continue;
      const age = now() - (o.createdAt || 0), r = o.remind || {}, first = String(o.customer.name || '').split(' ')[0];
      const print = (o.items || []).some(i => i.product === 'print');
      if (/^(awaiting_payment|payment_failed)$/.test(o.status) && age > 2 * H && age < 6 * 24 * H && !r.pay) {
        await mailBook(o.customer.email, 'Your photo book is waiting · ' + o.ref, { preheader: 'Finish your order whenever you’re ready', eyebrow: 'Almost there', title: 'Your photo book is waiting' + (first ? ', ' + first : ''), intro: 'You started an order but the payment didn’t go through, so nothing was charged. Your book is still saved on the phone or computer you made it on: open <b>My books</b> there to finish it.', ref: o.ref, details: [['Total', money(o.total)]], button: { label: 'Open My books', url: mb }, note: 'Need help paying? Reply to this email or WhatsApp us and we’ll sort it out.' });
        o.remind = Object.assign(r, { pay: now() }); await BS.saveOrder(o); n++;
      } else if (print && /^(paid|preparing)$/.test(o.status) && !(o.files && Object.keys(o.files).length) && age > 3 * H && !r.pages) {
        await mailBook(o.customer.email, 'One more step: send your book’s pages · ' + o.ref, { preheader: 'We haven’t received your pages yet', eyebrow: 'One more step', title: 'We’re waiting for your pages', intro: 'Thank you for your payment. Your book’s pages haven’t reached us yet, so we can’t print it. On the phone or computer you made the book on, open <b>My books</b> and tap <b>Send now</b>. It picks up where it stopped.', ref: o.ref, status: o.status, product: 'print', button: { label: 'Open My books', url: mb }, note: 'Made it on another device? Reply to this email and we’ll help.' });
        o.remind = Object.assign(r, { pages: now() }); await BS.saveOrder(o); n++;
      }
      if (n >= 40) break;
    }
    return n;
  }
  R['pbk-pay'] = async (req) => {
    const b = await readBody(req, 16384);
    if (!mpesaOn() || !sec.secret()) throw err(503, 'setup', 'M-Pesa checkout is not available right now. Please order on WhatsApp.');
    await limit(req, 'pbk-pay', 6, 600);
    const q = await withCoupon(pbkQuote(b), b.coupon);
    if (q.test) admin(req); /* only the signed-in owner can buy the KES 5 test book */
    const ph = payments.normalizePhone ? payments.normalizePhone(b.phone) : null;
    if (!ph) throw err(400, 'phone', 'Enter an M-Pesa number like 0712 345 678.');
    const mob0 = b.mobile ? (payments.normalizePhone ? payments.normalizePhone(b.mobile) : null) || clean(b.mobile, 30) : null, mob = mob0 && mob0 !== ph ? mob0 : null;
    const name = clean(b.name, 80), email = clean(b.email, 190).toLowerCase();
    if (name.length < 2) throw err(400, 'name', 'Enter your full name.');
    if (!isEmail(email)) throw err(400, 'email', 'Enter a valid email address.');
    let addr = null;
    if (q.delivery && q.delivery.needsAddress) {
      const a = b.address || {};
      addr = { line1: clean(a.line1, 120), area: clean(a.area, 80), town: clean(a.town, 60), county: clean(a.county, 60), country: clean(a.country, 60) || 'Kenya', notes: clean(a.notes, 200) };
      if (addr.line1.length < 3 || addr.area.length < 2 || addr.town.length < 2 || addr.county.length < 2) throw err(400, 'address', 'Enter your street address, area, town and county.');
    }
    const gift = b.gift && b.gift.is ? { to: clean(b.gift.to, 80), phone: clean(b.gift.phone, 30), note: clean(b.gift.note, 400) } : null;
    await limit(req, 'pbk-pay-phone', 4, 600, ph);
    const ref = orderRef(), iat = now();
    const r = await mp.stkPush({ phone: ph, amount: q.total, accountRef: ref.replace('-', ''), description: q.test ? 'Photo book test' : 'Photo book', callbackUrl: process.env.MPESA_CALLBACK_URL || base() + '/api/mpesa-callback' });
    if (!r.ok) throw err(502, 'mpesa', r.error || 'M-Pesa could not start the payment. Check the number and try again.');
    const items = q.items.map(i => ({ p: i.projectId, n: i.name, pr: i.product, pg: i.pages, q: i.qty }));
    if (BS.on()) {
      await BS.saveOrder({ ref, app: 'pbk', status: 'awaiting_payment', history: [{ status: 'awaiting_payment', at: iat }], total: q.total, currency: q.currency, lines: q.lines,
        items: q.items.map(i => ({ projectId: i.projectId, name: i.name, product: i.product, pages: i.pages, qty: i.qty, unit: i.unit })),
        customer: { name, email, phone: ph, mobile: mob || undefined }, coupon: q.coupon, delivery: q.delivery, address: addr, gift, cr: r.checkoutRequestID, createdAt: iat, test: q.test || undefined, expiresAt: q.test && TEST_AUTODELETE() ? iat + TEST_TTL : undefined });
    }
    const intent = tokenSign('pbk-intent', { cr: r.checkoutRequestID, ref, amount: q.total, items, iat, c: { n: name, e: email, ph }, d: q.delivery ? q.delivery.name : null, a: addr, g: gift, t: q.test ? 1 : undefined, cp: q.coupon ? q.coupon.code : undefined });
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
    if (first && it.cp) await couponUsed(it.cp, it.ref).catch(() => null);
    if (first) {
      const anyPrint = it.items.some(i => i.pr === 'print'), auto = BS.on();
      const lines = (bo && bo.lines) || it.items.map(i => ({ label: i.n + ' · ' + (i.pr === 'digital' ? 'Print-ready PDF' : 'Printed hardcover') + ' · ' + i.pg + ' pages', amount: 0, qty: i.q }));
      const det = [['Name', it.c.n], ['Phone', '+' + it.c.ph], ['Email', it.c.e], ['Delivery', it.d], ['Address', addrText(it.a)], ['Gift', giftText(it.g)]];
      await require('../hq/notify').event({ kind: 'order', title: (it.t ? 'Test order ' : 'New photo book order · ') + money(it.amount), body: (it.c.n || 'A customer') + ' · ' + it.ref + (anyPrint ? ' · printed' : ' · PDF'), url: '/admin#orders/' + it.ref });
      await mailBook(team(), (it.t ? '[TEST] ' : '') + 'New photo book order ' + it.ref + ' · ' + money(it.amount), { eyebrow: 'New order', title: (it.t ? 'Test order ' : 'Paid order ') + money(it.amount), intro: it.t ? 'A KES test order was paid. It stays in the orders list until you delete it: don’t print it.' : anyPrint ? (auto ? 'A printed photo book was paid for with M-Pesa. Its pages upload from the customer’s device; you’ll get another email when they arrive.' : 'A printed photo book was paid for. Ask the customer for the print file.') : 'A print-ready PDF was paid for. The customer downloads it on their device.', ref: it.ref, status: 'paid', product: anyPrint ? 'print' : 'digital', lines, total: it.amount, details: det, button: { label: 'Open the order', url: base() + '/admin#orders/' + it.ref }, test: it.t });
      await mailBook(it.c.e, (it.t ? '[TEST] ' : '') + 'Thank you! Your photo book order ' + it.ref, { preheader: 'Payment received: ' + money(it.amount), eyebrow: 'Payment received', title: 'Thank you, ' + String(it.c.n || '').split(' ')[0] + '!', intro: anyPrint ? 'We’ve received your payment. Your book’s pages are sending to us from the phone or computer you designed it on: keep that page open until it says they’ve arrived. Once they’re here, your book is printed and dispatched for delivery within <b>24–48 hours</b>. We’ll email you at every step.' : 'Your print-ready PDF is unlocked. Download it from <b>My books</b> on the same device you designed it on.', ref: it.ref, status: 'paid', product: anyPrint ? 'print' : 'digital', lines, total: it.amount, details: [['Delivery', it.d], ['Address', addrText(it.a)], ['Gift', giftText(it.g)]], button: { label: 'Track your order', url: trackUrl(it.ref) }, note: anyPrint ? 'If sending stopped (no network, or the page was closed), open <a href="' + base() + '/photobooks/my-books" style="color:#1b1714">cielafrica.com/photobooks/my-books</a> on the same device and tap <b>Send now</b>. Nothing you sent is lost.' : '', test: it.t });
    }
    return { ok: true, status: 'paid', ref: it.ref, receipts };
  };
  /* ---- M-Pesa Paybill, paid by hand: the customer pastes the M-Pesa message, Ciel Africa confirms it ----
     Printed books can send their pages straight away (nothing is printed before the payment is confirmed);
     print-ready PDFs unlock only after the confirmation. */
  R['pbk-manual'] = async (req) => {
    const b = await readBody(req, 16384), m = manualCfg();
    if (!m || !sec.secret() || !BS.on()) throw err(503, 'setup', 'Paybill payments aren’t available right now. Please use the M-Pesa prompt or order on WhatsApp.');
    await limit(req, 'pbk-manual', 6, 600);
    const q = await withCoupon(pbkQuote(b), b.coupon);
    if (q.test) admin(req);
    const ph = payments.normalizePhone ? payments.normalizePhone(b.phone) : null;
    if (!ph) throw err(400, 'phone', 'Enter your phone number like 0712 345 678.');
    const name = clean(b.name, 80), email = clean(b.email, 190).toLowerCase();
    if (name.length < 2) throw err(400, 'name', 'Enter your full name.');
    if (!isEmail(email)) throw err(400, 'email', 'Enter a valid email address.');
    let addr = null;
    if (q.delivery && q.delivery.needsAddress) {
      const a = b.address || {};
      addr = { line1: clean(a.line1, 120), area: clean(a.area, 80), town: clean(a.town, 60), county: clean(a.county, 60), country: clean(a.country, 60) || 'Kenya', notes: clean(a.notes, 200) };
      if (addr.line1.length < 3 || addr.area.length < 2 || addr.town.length < 2 || addr.county.length < 2) throw err(400, 'address', 'Enter your street address, area, town and county.');
    }
    const msg = String(b.message || '').replace(/[\u0000-\u0008\u000b-\u001f\u007f<>]/g, ' ').trim().slice(0, 800);
    const code = ((msg.toUpperCase().match(/\b(?=[A-Z0-9]*\d)(?=[A-Z0-9]*[A-Z])[A-Z0-9]{10}\b/) || [])[0]) || null;
    if (msg.length < 10 || !code) throw err(400, 'message', 'Paste the whole M-Pesa confirmation message. It starts with a 10-character code like SKL4ABC12D.');
    const used = await BS.getJSON('manual/' + code + '.json').catch(() => null);
    if (used && used.ref) throw err(409, 'used', 'This M-Pesa code was already used for order ' + used.ref + '. If that’s a mistake, WhatsApp us on +254 706 549 703.');
    const gift = b.gift && b.gift.is ? { to: clean(b.gift.to, 80), phone: clean(b.gift.phone, 30), note: clean(b.gift.note, 400) } : null;
    const ref = orderRef(), iat = now();
    const items = q.items.map(i => ({ p: i.projectId, n: i.name, pr: i.product, pg: i.pages, q: i.qty }));
    await BS.saveOrder({ ref, app: 'pbk', status: 'awaiting_confirmation', history: [{ status: 'awaiting_confirmation', at: iat, note: 'Paybill ' + m.paybill + ' · account ' + m.account + ' · code ' + code }], total: q.total, currency: q.currency, lines: q.lines,
      items: q.items.map(i => ({ projectId: i.projectId, name: i.name, product: i.product, pages: i.pages, qty: i.qty, unit: i.unit })),
      customer: { name, email, phone: ph }, delivery: q.delivery, address: addr, gift, createdAt: iat, test: q.test || undefined,
      payment: { method: 'paybill', paybill: m.paybill, account: m.account, code, message: msg, at: iat }, coupon: q.coupon });
    await BS.putJSON('manual/' + code + '.json', { ref, at: iat });
    const det = [['Name', name], ['Phone', '+' + ph], ['Email', email], ['Paybill', m.paybill + ' · account ' + m.account], ['M-Pesa code', code], ['Their message', msg], ['Delivery', q.delivery ? q.delivery.name : ''], ['Address', addrText(addr)], ['Gift', giftText(gift)]];
    await require('../hq/notify').event({ kind: 'order', title: 'Paybill payment to confirm · ' + money(q.total), body: name + ' · ' + ref + ' · code ' + code, url: '/admin#orders/' + ref }).catch(() => null);
    await mailBook(team(), (q.test ? '[TEST] ' : '') + 'Confirm Paybill payment ' + code + ' · ' + ref + ' · ' + money(q.total), { eyebrow: 'Payment to confirm', title: 'Check M-Pesa for ' + money(q.total), intro: 'A customer paid by Paybill ' + esc(m.paybill) + ' (account ' + esc(m.account) + ') and pasted this message. Check the code <b>' + esc(code) + '</b> in your M-Pesa statement, then confirm or reject the order.', ref, lines: q.lines, total: q.total, unpaid: true, details: det, button: { label: 'Confirm or reject', url: base() + '/photobooks/orders#' + ref }, test: q.test });
    await mailBook(email, (q.test ? '[TEST] ' : '') + 'We’ve got your order ' + ref + ': confirming your payment', { preheader: 'We’re checking your M-Pesa payment', eyebrow: 'Order received', title: 'Thank you, ' + name.split(' ')[0] + '!', intro: 'We’ve received your order and your M-Pesa message (code <b>' + esc(code) + '</b>). We’ll email you as soon as it’s confirmed, usually within a few minutes.' + (q.anyPrint ? ' Your book is printed and dispatched 24–48 hours after that.' : ' Your print-ready PDF unlocks in <b>My books</b> once it’s confirmed.'), ref, lines: q.lines, total: q.total, unpaid: true, details: [['Delivery', q.delivery ? q.delivery.name : ''], ['Address', addrText(addr)]], button: { label: 'Track your order', url: trackUrl(ref) }, note: q.anyPrint ? 'Keep the order page open on the device you made the book on until it says your pages have reached us. If it stopped, open <a href="' + base() + '/photobooks/my-books" style="color:#1b1714">My books</a> there and tap <b>Send now</b>.' : '', test: q.test });
    /* printed books may send their pages now; nothing prints until the payment is confirmed */
    const receipts = q.items.filter(i => i.product === 'print').map(i => ({ projectId: i.projectId, product: 'print', pages: i.pages, receipt: tokenSign('pbk-receipt', { ref, cr: 'paybill:' + code, p: i.projectId, pr: 'print', pg: i.pages, m: 1 }) }));
    const intent = tokenSign('pbk-manual', { ref, items, iat });
    return { ok: true, ref, intent, amount: q.total, currency: q.currency, receipts };
  };
  /* ---- "Order on WhatsApp": the customer's name, phone and books are saved first, so the order (and a
     preview of every page) shows in Ciel Admin before the chat starts. Nothing is paid here. ---- */
  R['pbk-wa'] = async (req) => {
    const b = await readBody(req, 16384);
    await limit(req, 'pbk-wa', 8, 600);
    let q = pbkQuote(b, { noDelivery: true });
    if (q.test) admin(req);
    if (b.coupon) q = await withCoupon(q, b.coupon).catch(() => q);
    const name = clean(b.name, 80);
    if (name.length < 2) throw err(400, 'name', 'Enter your full name.');
    const raw = String(b.phone || '').replace(/[^\d+]/g, ''), ph = (payments.normalizePhone && payments.normalizePhone(b.phone)) || (raw.replace(/\D/g, '').length >= 7 && raw.replace(/\D/g, '').length <= 15 ? raw.replace(/\D/g, '') : null);
    if (!ph) throw err(400, 'phone', 'Enter your phone number like 0712 345 678.');
    const email = clean(b.email, 190).toLowerCase();
    if (!BS.on()) return { ok: true, saved: false };
    const c = cfg(), dl = (c.delivery || []).find(x => x.id === b.delivery && x.enabled !== false) || null;
    const a = b.address || {}, addr = a.line1 || a.town ? { line1: clean(a.line1, 120), area: clean(a.area, 80), town: clean(a.town, 60), county: clean(a.county, 60), country: clean(a.country, 60) || 'Kenya', notes: clean(a.notes, 200) } : null;
    const gift = b.gift && b.gift.is ? { to: clean(b.gift.to, 80), phone: clean(b.gift.phone, 30), note: clean(b.gift.note, 400) } : null;
    const ref = orderRef(), iat = now(), total = q.total + (dl && q.anyPrint && dl.price ? Number(dl.price) : 0);
    await BS.saveOrder({ ref, app: 'pbk', status: 'whatsapp_request', history: [{ status: 'whatsapp_request', at: iat, note: 'Order request sent on WhatsApp (not paid yet)' }], total, currency: q.currency, lines: q.lines,
      items: q.items.map(i => ({ projectId: i.projectId, name: i.name, product: i.product, pages: i.pages, qty: i.qty, unit: i.unit })),
      customer: { name, email: isEmail(email) ? email : '', phone: ph }, delivery: dl ? { id: dl.id, name: dl.name, price: dl.price } : null, address: addr, gift, createdAt: iat, test: q.test || undefined,
      channel: 'whatsapp', coupon: q.coupon });
    await require('../hq/notify').event({ kind: 'order', title: 'WhatsApp order request · ' + money(total), body: name + ' · +' + ph + ' · ' + ref, url: '/admin#orders/' + ref }).catch(() => null);
    /* lets this device send small previews of each book (not print files) so the order shows what they made */
    const receipts = !sec.secret() ? [] : q.items.map(i => ({ projectId: i.projectId, product: i.product, pages: i.pages, receipt: tokenSign('pbk-receipt', { ref, cr: 'wa', p: i.projectId, pr: i.product, pg: i.pages, w: 1 }) }));
    return { ok: true, saved: true, ref, total, receipts };
  };
  R['pbk-manual-status'] = async (req) => {
    const b = await readBody(req, 8192), it = tokenRead('pbk-manual', b.intent);
    if (!it) throw err(400, 'token', 'This order link is not valid.');
    await limit(req, 'manual-status', 60, 600);
    const o = BS.on() ? await BS.getOrder(it.ref).catch(() => null) : null;
    if (!o) throw err(404, 'missing', 'Order not found.');
    if (o.status === 'awaiting_confirmation') return { ok: true, status: 'pending', ref: o.ref };
    if (/^(cancelled|refunded)$/.test(o.status) && !o.paidAt) return { ok: true, status: 'rejected', ref: o.ref };
    const receipts = it.items.map(i => ({ projectId: i.p, product: i.pr, pages: i.pg, receipt: tokenSign('pbk-receipt', { ref: it.ref, cr: 'paybill:' + ((o.payment || {}).code || ''), p: i.p, pr: i.pr, pg: i.pg }) }));
    return { ok: true, status: 'paid', ref: o.ref, receipts };
  };
  R['pbk-admin-confirm'] = async (req) => {
    admin(req); const b = await readBody(req, 4096); const o = await BS.getOrder(b.ref); if (!o) throw err(404, 'missing', 'Order not found.');
    if (o.status !== 'awaiting_confirmation') throw err(409, 'state', 'This order isn’t waiting for a Paybill confirmation.');
    const print = (o.items || []).some(i => i.product === 'print');
    if (b.ok) {
      setStatus(o, 'paid', 'Paybill payment confirmed' + (o.payment && o.payment.code ? ' (' + o.payment.code + ')' : ''), 'admin'); o.paidAt = now();
      if (o.coupon) await couponUsed(o.coupon.code, o.ref).catch(() => null);
      const pagesIn = o.files && Object.keys(o.files).length;
      if (print && pagesIn) setStatus(o, 'ready', 'Print files received');
      await BS.saveOrder(o);
      await mailBook(o.customer.email, (o.test ? '[TEST] ' : '') + 'Payment confirmed · ' + o.ref, { cover: await coverOf(o).catch(() => null), preheader: 'Payment received: ' + money(o.total), eyebrow: 'Payment confirmed', title: 'You’re all set, ' + String(o.customer.name || '').split(' ')[0] + '!', intro: print ? (pagesIn ? 'We’ve confirmed your M-Pesa payment and your book’s pages are here. It’s printed and dispatched for delivery within <b>24–48 hours</b>.' : 'We’ve confirmed your M-Pesa payment. Your book’s pages haven’t reached us yet: on the phone or computer you made it on, open <b>My books</b> and tap <b>Send now</b>.') : 'We’ve confirmed your M-Pesa payment. Your print-ready PDF is unlocked: open <b>My books</b> on the device you designed it on to download it.', ref: o.ref, status: print ? o.status : undefined, product: print ? 'print' : 'digital', lines: o.lines, total: o.total, button: { label: print ? 'Track your order' : 'Open My books', url: print ? trackUrl(o.ref) : base() + '/photobooks/my-books' }, test: o.test });
      return { ok: true, order: o };
    }
    setStatus(o, 'cancelled', 'Paybill payment not found' + (b.note ? ': ' + clean(b.note, 200) : ''), 'admin'); await BS.saveOrder(o);
    await mailBook(o.customer.email, (o.test ? '[TEST] ' : '') + 'We couldn’t confirm your payment · ' + o.ref, { eyebrow: 'Payment not found', title: 'We couldn’t confirm your payment', intro: 'We couldn’t find an M-Pesa Paybill payment matching the message you sent for this order' + (o.payment && o.payment.code ? ' (code ' + esc(o.payment.code) + ')' : '') + ', so the order is on hold.' + (b.note ? '<br><br><i>' + esc(clean(b.note, 300)) + '</i>' : '') + ' If you did pay, reply to this email with the M-Pesa message or a screenshot and we’ll sort it out.', ref: o.ref, test: o.test });
    return { ok: true, order: o };
  };

  /* ---- print pages: uploaded from the customer's device after payment, one page per request ---- */
  const manualCfg = () => { const m = (cfg().book || {}).manualPay; return m && m.enabled !== false && m.paybill && m.account ? m : null; };
  R['pbk-caps'] = async () => ({ ok: true, payments: mpesaOn() && !!sec.secret(), uploads: BS.on(), manual: !!(manualCfg() && sec.secret() && BS.on()) });
  R['pbk-upload'] = async (req, q) => {
    if (!BS.on()) throw err(409, 'storage', 'Order storage is not set up.');
    const rc = tokenRead('pbk-receipt', req.headers['x-receipt']);
    if (!rc) throw err(403, 'receipt', 'Not allowed.');
    const kind = q.kind, i = Math.round(Number(q.i));
    if (!['print', 'view', 'book', 'spine'].includes(kind)) throw err(400, 'kind', 'Bad file.');
    if (rc.w && kind !== 'view' && kind !== 'book') throw err(403, 'receipt', 'Previews only.');
    if (kind !== 'book' && !(i >= 0 && i <= rc.pg + 3)) throw err(400, 'index', 'Bad page.');
    await limit(req, 'pbk-up', 900, 3600, rc.ref);
    const fx = req.headers['x-edit'] ? await fixOpen(req.headers['x-edit'], rc) : null, dir = fx ? fx.dir : rc.p;
    if (!fx && rc.pr === 'print' && kind !== 'view' && kind !== 'book') { const o0 = await BS.getOrder(rc.ref); if (o0 && o0.files && o0.files[rc.p] && o0.files[rc.p].complete) throw err(409, 'sent', 'These pages were already received. Ask Ciel Africa to open the order for corrections.'); }
    const buf = await readBody(req, 4.4 * 1024 * 1024, true);
    if (kind === 'book') { let j; try { j = JSON.parse(buf.toString()); } catch (e) { throw err(400, 'json', 'Bad book.'); } await BS.putJSON('orders/' + rc.ref + '/' + dir + '/book.json', Object.assign(j, { receivedAt: now(), pages: rc.pg, product: rc.pr }, fx ? { round: fx.round } : {})); return { ok: true }; }
    if (!(buf[0] === 0xFF && buf[1] === 0xD8)) throw err(400, 'type', 'Pages must be JPEG.');
    await BS.putFile('orders/' + rc.ref + '/' + dir + '/' + kind + '/' + String(i).padStart(3, '0') + '.jpg', buf, 'image/jpeg');
    return { ok: true };
  };
  R['pbk-upload-done'] = async (req) => {
    if (!BS.on()) throw err(409, 'storage', 'Order storage is not set up.');
    const b = await readBody(req, 8192), rc = tokenRead('pbk-receipt', b.receipt);
    if (!rc) throw err(403, 'receipt', 'Not allowed.');
    if (b.edit) return fixDone(rc, b.edit);
    const files = await BS.listFiles('orders/' + rc.ref + '/' + rc.p + '/print/');
    const o = await BS.getOrder(rc.ref);
    if (o) {
      o.files = o.files || {}; const had = o.files[rc.p] && o.files[rc.p].complete;
      o.files[rc.p] = { complete: true, pages: files.length, at: now() };
      if (!had) { o.history = (o.history || []).concat([{ status: o.status, at: now(), note: 'Print pages received for ' + rc.p + ' (' + files.length + ' files)' }]); if (o.status === 'paid') setStatus(o, 'ready', 'Print files received'); }
      const waitPay = o.status === 'awaiting_confirmation';
      await BS.saveOrder(o);
      if (!had) {
        await mailBook(team(), (o.test ? '[TEST] ' : '') + 'Print pages received · ' + rc.ref, { cover: await coverOf(o).catch(() => null), eyebrow: waitPay ? 'Pages in · payment to confirm' : 'Ready to print', title: 'Print pages received', intro: 'All ' + files.length + ' print files for this order have arrived (300 dpi, 3 mm bleed). Download the print PDF from the order.' + (waitPay ? ' <b>The Paybill payment still needs confirming</b> before you print.' : ''), ref: rc.ref, details: [['Customer', o.customer.name + ' · +' + o.customer.phone], ['Delivery', o.delivery && o.delivery.name], ['Address', addrText(o.address)]], button: { label: 'Open the order', url: base() + '/admin#orders/' + rc.ref }, test: o.test });
        if (!waitPay) await notifyCustomer(o, 'ready');
        await require('../hq/notify').event({ kind: 'pages', title: (o.test ? 'Test: ' : '') + 'Pages received · ' + rc.ref, body: (o.customer.name || '') + ' · ready to print', url: '/admin#orders/' + rc.ref });
      }
    }
    return { ok: true, files: files.length };
  };
  /* ---- corrections after an order: only when Ciel Africa opens the order for them ----
     o.edit = { round, open, note, at, until, pids, done: {pid: at}, review }
     Corrected pages go to orders/<ref>/<pid>-r<round>/…; earlier versions stay untouched. */
  const FIX_DAYS = 7;
  const fixLink = (o) => base() + '/photobooks/my-books?fix=' + encodeURIComponent(tokenSign('pbk-edit', { ref: o.ref, r: o.edit.round, exp: o.edit.until }));
  const activeDir = (o, pid) => (o.files && o.files[pid] && o.files[pid].dir) || pid;
  async function fixState(t) {
    const tk = tokenRead('pbk-edit', t);
    if (!tk) throw err(403, 'link', 'This correction link isn’t valid. Use the latest link Ciel Africa sent you.');
    const o = await BS.getOrder(tk.ref); const e = o && o.edit;
    if (!o || !e || e.round !== tk.r) throw err(410, 'old', 'This correction link has been replaced by a newer one. Use the latest link Ciel Africa sent you.');
    if (!e.open || now() > e.until) throw err(410, 'closed', 'Corrections for order ' + o.ref + ' are closed. WhatsApp us on +254 706 549 703 if you still need a change.');
    return { o, e };
  }
  async function fixOpen(t, rc) {
    const { o, e } = await fixState(t);
    if (o.ref !== rc.ref || !e.pids.includes(rc.p)) throw err(403, 'book', 'This correction link is for a different book.');
    if (e.done && e.done[rc.p]) throw err(409, 'done', 'Your corrected pages for this book were already received.');
    return { o, e, round: e.round, dir: rc.p + '-r' + e.round };
  }
  async function fixDone(rc, t) {
    const { o, e, dir, round } = await fixOpen(t, rc);
    const files = await BS.listFiles('orders/' + rc.ref + '/' + dir + '/print/');
    if (files.length < rc.pg + 2) throw err(409, 'missing', 'Some pages haven’t arrived yet (' + files.length + ' of ' + (rc.pg + 2) + '). Tap Send again to finish.');
    const prev = activeDir(o, rc.p);
    o.files = o.files || {}; o.files[rc.p] = { complete: true, pages: files.length, at: now(), dir, round };
    o.versions = o.versions || {}; o.versions[rc.p] = (o.versions[rc.p] || []).concat([{ dir: prev, until: now() }]);
    e.done = Object.assign({}, e.done, { [rc.p]: now() });
    if (e.pids.every(p => e.done[p])) { e.open = false; e.closedAt = now(); }
    e.review = true;
    o.history = (o.history || []).concat([{ status: o.status, at: now(), note: 'Corrected pages received (correction ' + round + ', ' + files.length + ' files). The earlier version is kept.' }]);
    await BS.saveOrder(o);
    await mailBook(team(), (o.test ? '[TEST] ' : '') + 'Corrected pages received · ' + o.ref, { cover: await coverOf(o).catch(() => null), eyebrow: 'Correction ' + round, title: 'Corrected pages received', intro: esc(o.customer.name || 'The customer') + ' sent a corrected version of their book. Review it in Photo Book orders before printing. The earlier version is kept.', ref: o.ref, button: { url: base() + '/photobooks/orders#' + o.ref, label: 'Review the corrected book' } }).catch(() => { });
    await require('../hq/notify').event({ kind: 'pages', title: (o.test ? 'Test: ' : '') + 'Corrected pages · ' + o.ref, body: (o.customer.name || '') + ' · review before printing', url: '/admin#orders/' + o.ref }).catch(() => { });
    return { ok: true, files: files.length, round };
  }
  R['pbk-admin-reopen'] = async (req) => {
    admin(req); const b = await readBody(req, 8192); const o = await BS.getOrder(b.ref); if (!o) throw err(404, 'missing', 'Order not found.');
    const prints = (o.items || []).filter(i => i.product === 'print').map(i => i.projectId);
    if (b.close) {
      if (o.edit) { o.edit.open = false; o.edit.closedAt = now(); o.history = (o.history || []).concat([{ status: o.status, at: now(), note: 'Corrections closed by Ciel Africa', by: 'admin' }]); await BS.saveOrder(o); }
      return { ok: true, order: o };
    }
    if (b.reviewed) { if (o.edit) { o.edit.review = false; o.edit.reviewedAt = now(); o.history = (o.history || []).concat([{ status: o.status, at: now(), note: 'Corrected book reviewed', by: 'admin' }]); await BS.saveOrder(o); } return { ok: true, order: o }; }
    if (!prints.length) throw err(409, 'kind', 'Only printed books can be reopened for corrections.');
    if (/^(dispatched|delivered|cancelled|refunded|ready_collection)$/.test(o.status)) throw err(409, 'state', 'This order is already ' + o.status.replace('_', ' ') + '. Change its status first if it really needs corrections.');
    const pids = (Array.isArray(b.pids) && b.pids.length ? b.pids : prints).filter(p => prints.includes(p));
    if (!pids.length) throw err(400, 'pids', 'Choose which book to reopen.');
    const days = Math.max(1, Math.min(30, Math.round(+b.days || FIX_DAYS)));
    o.edit = { round: ((o.edit && o.edit.round) || 0) + 1, open: true, note: clean(b.note || '', 600), at: now(), until: now() + days * 864e5, pids, done: {} };
    if (o.status === 'printing') setStatus(o, 'ready', 'Back from printing for corrections', 'admin');
    o.history = (o.history || []).concat([{ status: o.status, at: now(), note: 'Opened for corrections (' + days + ' days)' + (o.edit.note ? ': ' + o.edit.note : ''), by: 'admin' }]);
    await BS.saveOrder(o);
    const url = fixLink(o); let emailed = false;
    if (b.notify !== false && o.customer && o.customer.email) {
      const r = await mailBook(o.customer.email, (o.test ? '[TEST] ' : '') + 'Please check your photo book · ' + o.ref, { cover: await coverOf(o).catch(() => null), eyebrow: 'A quick correction', title: 'Your book is open for changes', intro: 'Before we print order <b>' + esc(o.ref) + '</b>, we’d like you to make a change.' + (o.edit.note ? '<br><br><i>' + esc(o.edit.note) + '</i>' : '') + '<br><br>Open the link on the phone or computer you made the book on, make your changes, then tap <b>Send corrected book</b>. The link works for ' + days + ' day' + (days === 1 ? '' : 's') + '.', ref: o.ref, button: { url, label: 'Edit my book' } }).catch(() => null);
      emailed = !!(r && r.ok);
    }
    return { ok: true, order: o, url, emailed };
  };
  R['pbk-fix'] = async (req) => {
    const b = await readBody(req, 4096); await limit(req, 'fix', 40, 600);
    const { o, e } = await fixState(b.t);
    return { ok: true, ref: o.ref, round: e.round, note: e.note, until: e.until, pids: e.pids.filter(p => !(e.done && e.done[p])), done: Object.keys(e.done || {}),
      items: (o.items || []).filter(i => e.pids.includes(i.projectId)).map(i => ({ projectId: i.projectId, name: i.name, pages: i.pages })) };
  };

  /* ---- printing partner: a saved profile, then a share link per order with only the details chosen ----
     The partner never sees prices, payment details or anything not ticked. */
  const PRINTER = 'settings/printer.json', SPINE_MIN_PAGES = 37;
  const pTok = (ref, id) => tokenSign('pbk-print', { ref, s: id, exp: now() + 60 * 864e5 });
  const printerUrl = (ref, id) => base() + '/photobooks/printer?t=' + encodeURIComponent(pTok(ref, id));
  async function printer() { return (await BS.getJSON(PRINTER).catch(() => null)) || { name: '', email: '', phone: '', prefs: { name: true, phone: false, delivery: 'self' } }; }
  function jobOf(o, sh) {
    const a = o.address, inc = sh.include || {}, books = (o.items || []).filter(i => i.product === 'print');
    return {
      ref: o.ref, test: !!o.test, sharedAt: sh.at, notes: sh.notes || '',
      customer: { name: inc.name ? o.customer.name : null, phone: inc.phone || sh.delivery === 'printer' ? '+' + String(o.customer.phone || '').replace(/^\+/, '') : null },
      delivery: sh.delivery === 'printer' ? { by: 'printer', method: o.delivery ? o.delivery.name : null, address: a ? [a.line1, a.area, a.town, a.county, a.country && a.country !== 'Kenya' ? a.country : ''].filter(Boolean).join(', ') : null, notes: a && a.notes || null, gift: o.gift && inc.gift ? { to: o.gift.to || null, phone: o.gift.phone || null } : null } : { by: 'ciel' },
      books: books.map(i => ({ pid: i.projectId, name: i.name, qty: i.qty || 1, pages: i.pages, spine: i.pages >= SPINE_MIN_PAGES }))
    };
  }
  function jobText(j, url) {
    const L = ['Ciel Africa · print job ' + j.ref + (j.test ? ' (TEST, do not print)' : ''), ''];
    j.books.forEach((b, k) => {
      L.push((j.books.length > 1 ? (k + 1) + '. ' : '') + b.name + ': ' + b.qty + ' × hardcover, ' + b.pages + ' pages, A4 portrait (210 × 297 mm)');
      L.push('   Files: front cover (A4), back cover (A4), ' + (b.spine ? 'spine (PNG)' : 'no spine print (' + b.pages + ' pages is too thin)') + ', ' + b.pages + ' pages (A4, print back to back, page 1 first)');
    });
    L.push('');
    if (j.customer.name) L.push('Customer: ' + j.customer.name);
    if (j.delivery.by === 'printer') {
      L.push('Delivery: please deliver to the customer' + (j.delivery.method ? ' (' + j.delivery.method + ')' : ''));
      if (j.delivery.address) L.push('Address: ' + j.delivery.address + (j.delivery.notes ? ' (' + j.delivery.notes + ')' : ''));
      if (j.customer.phone) L.push('Phone: ' + j.customer.phone);
      if (j.delivery.gift) L.push('Gift for: ' + (j.delivery.gift.to || '') + (j.delivery.gift.phone ? ', ' + j.delivery.gift.phone : ''));
    } else { if (j.customer.phone) L.push('Phone: ' + j.customer.phone); L.push('Delivery: Ciel Africa collects the finished books.'); }
    if (j.notes) L.push('', 'Notes: ' + j.notes);
    if (url) L.push('', 'Files and details: ' + url);
    return L.join('\n');
  }
  R['pbk-printer-get'] = async (req) => { admin(req); return { ok: true, printer: await printer() }; };
  R['pbk-printer-save'] = async (req) => {
    admin(req); const b = await readBody(req, 4096); const p = await printer();
    const email = clean(b.email, 120), phone = String(b.phone || '').replace(/\D/g, '').replace(/^0(\d{9})$/, '254$1').slice(0, 15);
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw err(400, 'email', 'That email doesn’t look right.');
    const np = { name: clean(b.name, 80) || p.name, email, phone, prefs: Object.assign({}, p.prefs, b.prefs || {}) };
    await BS.putJSON(PRINTER, np); return { ok: true, printer: np };
  };
  R['pbk-printer-share'] = async (req) => {
    admin(req); const b = await readBody(req, 8192); const o = await BS.getOrder(b.ref); if (!o) throw err(404, 'missing', 'Order not found.');
    const prints = (o.items || []).filter(i => i.product === 'print');
    if (!prints.length) throw err(409, 'kind', 'This order has no printed books.');
    const missing = prints.filter(i => !(o.files && o.files[i.projectId] && o.files[i.projectId].complete));
    if (missing.length) throw err(409, 'pages', 'The print pages for ' + missing.map(i => i.name).join(', ') + ' haven’t all arrived yet.');
    const inc = b.include || {}, sh = { id: sec.randomId(6), at: now(), via: ['email', 'whatsapp', 'link'].includes(b.via) ? b.via : 'link', include: { name: !!inc.name, phone: !!inc.phone, gift: !!inc.gift }, delivery: b.delivery === 'printer' ? 'printer' : 'self', notes: clean(b.notes, 600),
      versions: Object.fromEntries(prints.map(i => [i.projectId, activeDir(o, i.projectId)])) };
    if (sh.delivery === 'printer' && !o.address) throw err(409, 'address', 'This order has no delivery address, so the printer can’t deliver it. Choose “I’ll handle delivery”.');
    const P = await printer(), j = jobOf(o, sh);
    if (b.preview) return { ok: true, text: jobText(j, '(link appears here when you send)'), job: j, printer: P };
    if (sh.via === 'email' && !P.email) throw err(400, 'email', 'Add the printer’s email first.');
    const url = printerUrl(o.ref, sh.id); sh.to = sh.via === 'email' ? P.email : sh.via === 'whatsapp' ? P.phone : null;
    let emailed = null;
    if (sh.via === 'email') {
      const r = await mailBook(P.email, (o.test ? '[TEST] ' : '') + 'Print job ' + o.ref + ' · Ciel Africa', { eyebrow: 'Print job', title: 'New print job ' + o.ref, intro: esc(jobText(j)).replace(/\n/g, '<br>'), button: { url, label: 'Open the files' }, note: 'Files: front and back cover as A4 PDFs, the spine as a PNG (books over 36 pages), and all inside pages in one A4 PDF to print back to back.' }).catch(() => null);
      emailed = !!(r && r.ok); if (!emailed) throw err(502, 'email', 'The email couldn’t be sent. Use WhatsApp or copy the link instead.');
    }
    o.printer = o.printer || { shares: [] }; o.printer.shares = (o.printer.shares || []).concat([sh]); o.printer.state = 'sent';
    o.history = (o.history || []).concat([{ status: o.status, at: now(), note: 'Shared with the printer' + (P.name ? ' (' + P.name + ')' : '') + ' by ' + (sh.via === 'link' ? 'link' : sh.via) + (sh.delivery === 'printer' ? ', printer delivers' : ''), by: 'admin' }]);
    await BS.saveOrder(o);
    return { ok: true, url, text: jobText(j, url), emailed, order: o, printer: P };
  };
  async function shareOf(t) {
    const tk = tokenRead('pbk-print', t); if (!tk || !(tk.exp > now())) throw err(403, 'link', 'This print link has expired or isn’t valid. Ask Ciel Africa for a new one.');
    const o = await BS.getOrder(tk.ref); const sh = o && o.printer && (o.printer.shares || []).find(x => x.id === tk.s);
    if (!o || !sh || sh.revoked) throw err(403, 'link', 'This print link is no longer active. Ask Ciel Africa for a new one.');
    return { o, sh };
  }
  R['pbk-printer-view'] = async (req) => {
    const b = await readBody(req, 4096); await limit(req, 'prv', 60, 600);
    const { o, sh } = await shareOf(b.t), j = jobOf(o, sh);
    for (const bk of j.books) {
      const dir = (sh.versions || {})[bk.pid] || activeDir(o, bk.pid);
      const fl = await BS.listFiles('orders/' + o.ref + '/' + dir + '/');
      bk.files = fl.filter(f => /\/print\/\d{3}\.jpg$/.test(f.path)).length; bk.hasSpine = fl.some(f => /\/spine\/000\.jpg$/.test(f.path));
      bk.book = await BS.getJSON('orders/' + o.ref + '/' + dir + '/book.json').then(x => x ? { trimW: x.trimW, trimH: x.trimH, bleedMm: x.bleedMm, dpi: x.dpi, spineMm: x.spineMm } : null).catch(() => null);
    }
    const newer = (o.printer.shares || []).some(x => x.at > sh.at);
    return { ok: true, job: j, text: jobText(j), newer, ack: o.printer.ack || null };
  };
  R['pbk-printer-file'] = async (req, q) => {
    const { o, sh } = await shareOf(q.t);
    const pid = String(q.p || ''); if (!(o.items || []).some(i => i.projectId === pid && i.product === 'print')) throw err(404, 'book', 'Not found.');
    const dir = (sh.versions || {})[pid] || activeDir(o, pid), kind = q.k === 'spine' ? 'spine' : 'print', i = Math.round(+q.i || 0);
    if (!(i >= 0 && i < 400)) throw err(400, 'index', 'Bad page.');
    const r = await BS.getBuf('orders/' + o.ref + '/' + dir + '/' + kind + '/' + String(i).padStart(3, '0') + '.jpg'); if (!r) throw err(404, 'missing', 'File not found.');
    return { __binary: r.buf, meta: { type: 'image/jpeg' } };
  };
  R['pbk-printer-ack'] = async (req) => {
    const b = await readBody(req, 4096); await limit(req, 'pra', 20, 600);
    const { o } = await shareOf(b.t); const st = b.status === 'printed' ? 'printed' : b.status === 'problem' ? 'problem' : 'received';
    o.printer.ack = { status: st, at: now(), note: clean(b.note, 400) }; o.printer.state = st;
    o.history = (o.history || []).concat([{ status: o.status, at: now(), note: 'Printer: ' + (st === 'received' ? 'files received' : st === 'printed' ? 'printed' : 'reported a problem') + (o.printer.ack.note ? ' (' + o.printer.ack.note + ')' : '') }]);
    if (st === 'received' && (o.status === 'ready' || o.status === 'paid')) setStatus(o, 'printing', 'The printer confirmed it has the files', 'printer');
    await BS.saveOrder(o);
    await require('../hq/notify').event({ kind: 'order', title: 'Printer · ' + o.ref, body: st === 'received' ? 'Files received' : st === 'printed' ? 'Printed' : 'Problem: ' + (o.printer.ack.note || ''), url: '/admin#orders/' + o.ref }).catch(() => { });
    if (st === 'problem') await mailBook(team(), 'Printer reported a problem · ' + o.ref, { eyebrow: 'Printer', title: 'Problem with ' + o.ref, intro: esc(o.printer.ack.note || 'No details given.'), ref: o.ref, button: { url: base() + '/photobooks/orders#' + o.ref, label: 'Open the order' } }).catch(() => { });
    return { ok: true, ack: o.printer.ack };
  };

  /* ---- orders admin (/photobooks/orders) ---- */
  R['pbk-admin-orders'] = async (req) => {
    admin(req); if (!BS.on()) return { ok: true, storage: false, orders: [] };
    let list = await BS.listOrders(500);
    if (TEST_AUTODELETE() && list.some(o => o.test && now() - (o.createdAt || 0) >= TEST_TTL)) { await purgeTests(list); list = list.filter(o => !(o.test && now() - (o.createdAt || 0) >= TEST_TTL)); }
    return { ok: true, storage: true, orders: list };
  };
  R['pbk-admin-delete'] = async (req) => {
    admin(req); const b = await readBody(req, 4096); const o = await BS.getOrder(b.ref); if (!o) throw err(404, 'missing', 'Order not found.');
    if (!o.test) throw err(409, 'state', 'Only test orders can be deleted here.');
    const files = await BS.listFiles('orders/' + o.ref + '/'); await BS.del(files.map(f => f.path)); return { ok: true };
  };
  R['pbk-admin-order'] = async (req, q) => {
    admin(req); const o = await BS.getOrder(q.ref); if (!o) throw err(404, 'missing', 'Order not found.');
    const files = await BS.listFiles('orders/' + o.ref + '/');
    const books = {};
    files.forEach(f => { const m = f.path.match(/^orders\/[^/]+\/([^/]+)\/(print|view|spine)\/(\d{3})\.jpg$/); if (m) { const b = books[m[1]] = books[m[1]] || { print: [], view: [], spine: [] }; b[m[2]].push({ path: f.path, size: f.size }); } });
    for (const pid of Object.keys(books)) { books[pid].print.sort((a, b) => a.path < b.path ? -1 : 1); books[pid].view.sort((a, b) => a.path < b.path ? -1 : 1); books[pid].book = await BS.getJSON('orders/' + o.ref + '/' + pid + '/book.json').catch(() => null); }
    /* corrections: the item's book is its newest received version; earlier ones are kept beside it */
    const out = {};
    (o.items || []).forEach(it => {
      const pid = it.projectId, cur = activeDir(o, pid);
      const vs = Object.keys(books).filter(d => d === pid || d.indexOf(pid + '-r') === 0);
      out[pid] = books[cur] || (cur === pid ? null : books[pid]) || { print: [], view: [], spine: [] };
      out[pid].dir = cur;
      out[pid].earlier = vs.filter(d => d !== cur).sort().map(d => ({ dir: d, round: d === pid ? 0 : +d.split('-r').pop(), view: books[d].view, print: books[d].print.length }));
      const live = vs.filter(d => d !== cur && o.edit && d === pid + '-r' + o.edit.round);
      if (live.length) out[pid].incoming = { round: o.edit.round, print: books[live[0]].print.length };
    });
    return { ok: true, order: o, books: out };
  };
  R['pbk-admin-file'] = async (req, q) => {
    admin(req);
    if (!/^orders\/PB-[0-9A-Z]{8}\/[A-Za-z0-9_-]{1,40}\/(print|view|spine)\/\d{3}\.jpg$/.test(String(q.path || ''))) throw err(400, 'path', 'Bad file.');
    const r = await BS.getBuf(q.path); if (!r) throw err(404, 'missing', 'File not found.');
    return { __binary: r.buf, meta: { type: 'image/jpeg' } };
  };
  R['pbk-admin-status'] = async (req) => {
    admin(req); const b = await readBody(req, 4096); const o = await BS.getOrder(b.ref); if (!o) throw err(404, 'missing', 'Order not found.');
    if (!ADMIN_SET.concat(['paid']).includes(b.status)) throw err(400, 'status', 'Unknown status.');
    const changed = setStatus(o, b.status, b.note, 'admin'); await BS.saveOrder(o);
    if (changed && b.notify !== false) await notifyCustomer(o, b.status, b.public ? b.note : '');
    return { ok: true, order: o, emailed: changed && b.notify !== false && !!PM.CUSTOMER_STATUS[b.status] };
  };

  /* ---- order tracking for customers: order number + the phone or email used, or the signed link from an email ---- */
  const TRACK = { awaiting_payment: 'Waiting for payment', awaiting_confirmation: 'Confirming your payment', whatsapp_request: 'We’ll reply on WhatsApp', payment_failed: 'Payment not completed', paid: 'Paid: waiting for your pages', ready: 'Pages received', printing: 'Printing', ready_collection: 'Ready for collection', dispatched: 'On its way', delivered: 'Delivered', cancelled: 'Cancelled', refunded: 'Refunded' };
  R['pbk-track'] = async (req) => {
    const b = await readBody(req, 4096); await limit(req, 'track', 30, 600);
    if (!BS.on()) throw err(503, 'storage', 'Order tracking isn’t available right now. WhatsApp us on +254 706 549 703.');
    const ref = String(b.ref || '').toUpperCase().replace(/\s+/g, '').replace(/^PB(?!-)/, 'PB-');
    const o = /^PB-[0-9A-Z]{8}$/.test(ref) ? await BS.getOrder(ref) : null;
    const t = b.t ? tokenRead('pbk-track', b.t) : null;
    let okc = !!(o && t && t.ref === ref);
    if (o && !okc) { const c = String(b.contact || '').trim().toLowerCase(), digits = c.replace(/\D/g, ''); okc = (c.includes('@') && c === String(o.customer.email || '').toLowerCase()) || (digits.length >= 9 && String(o.customer.phone || '').endsWith(digits.slice(-9))); }
    if (!o || !okc) throw err(404, 'missing', 'We couldn’t find that order. Check the order number (it starts with PB-) and use the phone number or email you ordered with.');
    /* the book(s) as we received them: read-only preview pages, through a short-lived link */
    const books = [];
    for (const pid of Object.keys(o.files || {})) {
      const dir = activeDir(o, pid), n = (await BS.listFiles('orders/' + o.ref + '/' + dir + '/view/').catch(() => [])).length;
      const it = (o.items || []).find(i => i.projectId === pid || i.p === pid) || {};
      if (n) books.push({ pid, pages: n, name: it.name || 'Photo book', v: tokenSign('pbk-view', { ref: o.ref, p: dir, exp: now() + 6 * 3600e3 }) });
    }
    const hist = []; (o.history || []).forEach(h => { if (!TRACK[h.status]) return; const last = hist[hist.length - 1]; if (last && last.label === TRACK[h.status]) return; hist.push({ label: TRACK[h.status], at: h.at }); });
    return { ok: true, books, order: { ref: o.ref, status: o.status, label: TRACK[o.status] || o.status, step: PM.stepIndex(o.status), test: !!o.test, createdAt: o.createdAt, paidAt: o.paidAt, total: o.total, currency: o.currency, delivery: o.delivery ? o.delivery.name : null, items: (o.items || []).map(i => ({ name: i.name, product: i.product, pages: i.pages, qty: i.qty })), pagesIn: !!(o.files && Object.keys(o.files).length), history: hist } };
  };
  R['pbk-view'] = async (req, q) => {
    const t = tokenRead('pbk-view', q.t); if (!t || !(t.exp > now())) throw err(403, 'expired', 'This preview link has expired. Open the order again.');
    const i = Math.round(Number(q.i)); if (!(i >= 0 && i < 400)) throw err(400, 'index', 'Bad page.');
    const r = await BS.getBuf('orders/' + t.ref + '/' + t.p + '/view/' + String(i).padStart(3, '0') + '.jpg'); if (!r) throw err(404, 'missing', 'Page not found.');
    return { __binary: r.buf, meta: { type: 'image/jpeg' } };
  };
  R['pbk-verify'] = async (req) => {
    const b = await readBody(req, 8192); const rc = tokenRead('pbk-receipt', b.receipt);
    if (!rc) throw err(403, 'receipt', 'We couldn’t verify this purchase.');
    if (b.projectId && b.projectId !== rc.p) throw err(409, 'project', 'This purchase is for a different book.');
    if (rc.w) throw err(402, 'unpaid', 'This order hasn’t been paid yet.');
    if (rc.m) { const o = BS.on() ? await BS.getOrder(rc.ref).catch(() => null) : null; if (!o || /^(awaiting_confirmation|cancelled|refunded)$/.test(o.status)) throw err(402, 'unconfirmed', 'This Paybill payment hasn’t been confirmed yet. Try again once you get our confirmation email.'); }
    return { ok: true, ref: rc.ref, product: rc.pr, projectId: rc.p, pages: rc.pg };
  };

  return async function handler(req, res) {
    const u = new URL(req.url, 'http://x'), q = Object.fromEntries(u.searchParams.entries()), route = q.route || '';
    const fn = R[route];
    try {
      if (!fn) throw err(404, 'route', 'Not found.');
      const isGet = ['caps', 'order', 'admin-orders', 'admin-me', 'admin-file', 'pbk-caps', 'pbk-admin-orders', 'pbk-admin-coupons', 'pbk-admin-order', 'pbk-admin-file', 'pbk-cron', 'pbk-view', 'pbk-printer-get', 'pbk-printer-file'].includes(route);
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
