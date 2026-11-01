/* ============================================================
   CIEL AFRICA HQ — server for /admin (behind /api/hq?route=…)
   Sign-in: the same ADMIN_PASSWORD session as Photo Book orders and
   Ciel Domains (HttpOnly cookie). Data lives in the private Vercel Blob
   store (hq/*.json, shop/orders/*.json); nothing here is public.
   ============================================================ */
const sec = require('../domains/security');
const { getStore } = require('../domains/store');
const BS = require('../photobooks/blobstore');

const COLLECTIONS = { tasks: 'hq/tasks.json', events: 'hq/events.json', notes: 'hq/notes.json' };
const SHOP_STATUSES = ['paid', 'processing', 'fulfilled', 'delivered', 'cancelled', 'refunded'];

const clean = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, n || 200);
const cleanML = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, ' ').slice(0, n || 4000);
const err = (status, code, message) => Object.assign(new Error(message), { status, code });

/* fields kept for each kind of record (everything else is dropped) */
const SHAPE = {
  tasks: { title: 120, notes: 2000, status: 20, priority: 10, due: 10, tag: 40, ref: 40, assignee: 60 },
  events: { title: 120, notes: 2000, type: 20, date: 10, end: 10, start: 5, finish: 5, allDay: 0, location: 160, client: 120, ref: 40 },
  notes: { key: 200, text: 4000 }
};
function shape(c, item) {
  const o = { id: /^[a-z0-9]{6,32}$/i.test(item.id || '') ? item.id : sec.randomId(9).replace(/[^a-z0-9]/gi, '').slice(0, 12) };
  Object.entries(SHAPE[c]).forEach(([k, n]) => {
    if (item[k] == null) return;
    if (n === 0) o[k] = !!item[k];
    else if (k === 'notes' || k === 'text') o[k] = cleanML(item[k], n);
    else o[k] = clean(item[k], n);
  });
  if (o.date && !/^\d{4}-\d{2}-\d{2}$/.test(o.date)) delete o.date;
  if (o.end && !/^\d{4}-\d{2}-\d{2}$/.test(o.end)) delete o.end;
  if (o.due && !/^\d{4}-\d{2}-\d{2}$/.test(o.due)) delete o.due;
  return o;
}

function createHandler(deps) {
  deps = deps || {};
  const now = () => (deps.now ? deps.now() : Date.now());
  const send = (res, code, obj, headers) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Robots-Tag', 'noindex'); Object.entries(headers || {}).forEach(([k, v]) => res.setHeader(k, v)); res.end(JSON.stringify(obj)); };
  async function body(req) {
    if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
    if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
    const parts = []; let n = 0;
    await new Promise((ok, no) => { req.on('data', c => { n += c.length; if (n > 64 * 1024) { no(err(413, 'size', 'Too large.')); req.destroy(); } else parts.push(c); }); req.on('end', ok); req.on('error', no); });
    try { return parts.length ? JSON.parse(Buffer.concat(parts).toString()) : {}; } catch (e) { throw err(400, 'json', 'Invalid request.'); }
  }
  const admin = req => { if (!sec.secret() || !process.env.ADMIN_PASSWORD || !sec.checkSession(req)) throw err(401, 'auth', 'Please sign in.'); };
  const needBlob = () => { if (!BS.on()) throw err(503, 'storage', 'Connect the private Blob store to this project first.'); };
  async function read(c) { return (await BS.getJSON(COLLECTIONS[c]).catch(() => null)) || { items: [], v: 0 }; }

  const R = {};
  R.me = async req => ({ ok: true, signedIn: !!(sec.secret() && process.env.ADMIN_PASSWORD && sec.checkSession(req)), setup: { adminPassword: !!process.env.ADMIN_PASSWORD, storage: BS.on(), payments: !!(process.env.MPESA_CONSUMER_KEY && process.env.MPESA_PASSKEY), email: !!process.env.RESEND_API_KEY, publish: !!process.env.GITHUB_TOKEN, domainsDb: !!(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL), mpesaEnv: process.env.MPESA_ENV || 'sandbox' } });
  R.login = async req => {
    const b = await body(req);
    if (!(await sec.rateLimit(getStore(), 'hq-login', sec.clientIp(req), 8, 900))) throw err(429, 'rate', 'Too many attempts. Wait 15 minutes and try again.');
    if (!sec.secret() || !process.env.ADMIN_PASSWORD) throw err(503, 'setup', 'Set ADMIN_PASSWORD in Vercel first (Project → Settings → Environment Variables), then redeploy.');
    if (!sec.checkPassword(b.password)) throw err(401, 'auth', 'Wrong password.');
    return [{ ok: true }, { 'Set-Cookie': sec.sessionCookie(sec.makeSession(), sec.SESSION_H * 3600) }];
  };
  R.logout = async () => [{ ok: true }, { 'Set-Cookie': sec.sessionCookie('', 0) }];

  /* tasks, events and customer notes */
  R.list = async (req, q) => { admin(req); needBlob(); if (!COLLECTIONS[q.c]) throw err(400, 'c', 'Unknown list.'); const d = await read(q.c); return { ok: true, items: d.items, v: d.v }; };
  R.save = async req => {
    admin(req); needBlob(); const b = await body(req);
    if (!COLLECTIONS[b.c]) throw err(400, 'c', 'Unknown list.');
    const d = await read(b.c);
    if (b.op === 'delete') d.items = d.items.filter(x => x.id !== b.id);
    else {
      const it = shape(b.c, b.item || {});
      if (b.c === 'tasks' && !it.title) throw err(400, 'title', 'Give the task a title.');
      if (b.c === 'events' && (!it.title || !it.date)) throw err(400, 'event', 'An event needs a title and a date.');
      const i = d.items.findIndex(x => x.id === it.id);
      if (i >= 0) d.items[i] = Object.assign({}, d.items[i], it, { updatedAt: now() });
      else { it.createdAt = now(); it.updatedAt = now(); d.items.push(it); }
      if (d.items.length > 3000) throw err(409, 'full', 'This list is full.');
      b.item = i >= 0 ? d.items[i] : it;
    }
    d.v = (d.v || 0) + 1; await BS.putJSON(COLLECTIONS[b.c], d);
    return { ok: true, item: b.item || null, v: d.v };
  };

  /* website shop orders (recorded by /api/stkquery when M-Pesa confirms a payment) */
  R['shop-orders'] = async req => {
    admin(req); if (!BS.on()) return { ok: true, storage: false, orders: [] };
    const files = await BS.listFiles('shop/orders/');
    const list = (await Promise.all(files.slice(0, 600).map(f => BS.getJSON(f.path).catch(() => null)))).filter(Boolean);
    return { ok: true, storage: true, orders: list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)) };
  };
  R['shop-status'] = async req => {
    admin(req); needBlob(); const b = await body(req);
    if (!/^[A-Za-z0-9_-]{6,80}$/.test(b.id || '')) throw err(400, 'id', 'Bad order.');
    if (!SHOP_STATUSES.includes(b.status)) throw err(400, 'status', 'Unknown status.');
    const p = 'shop/orders/' + b.id + '.json', o = await BS.getJSON(p); if (!o) throw err(404, 'missing', 'Order not found.');
    o.status = b.status; o.history = (o.history || []).concat([{ status: b.status, at: now(), note: clean(b.note, 300) || undefined }]);
    await BS.putJSON(p, o); return { ok: true, order: o };
  };

  return async function handler(req, res) {
    const u = new URL(req.url, 'http://x'), q = Object.fromEntries(u.searchParams.entries()), route = q.route || '';
    try {
      const fn = R[route]; if (!fn) throw err(404, 'route', 'Not found.');
      const isGet = ['me', 'list', 'shop-orders'].includes(route);
      if (isGet ? req.method !== 'GET' : req.method !== 'POST') throw err(405, 'method', 'Method not allowed.');
      if (!isGet && !sec.sameOrigin(req)) throw err(403, 'origin', 'Blocked.');
      const out = await fn(req, q);
      if (Array.isArray(out)) return send(res, 200, out[0], out[1]);
      return send(res, 200, out);
    } catch (e) {
      const code = e && e.status ? e.status : 500;
      if (!e.status) console.error('[hq]', route, e);
      return send(res, code, { ok: false, code: e.code || 'error', error: e.status ? e.message : 'Something went wrong. Please try again.' });
    }
  };
}
module.exports = { createHandler, SHOP_STATUSES };
