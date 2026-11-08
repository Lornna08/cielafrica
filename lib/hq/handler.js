/* ============================================================
   CIEL AFRICA HQ — server for /admin (behind /api/hq?route=…)
   Sign-in: the same ADMIN_PASSWORD session as Photo Book orders and
   Ciel Domains (HttpOnly cookie). Data lives in the private Vercel Blob
   store (hq/*.json, shop/orders/*.json); nothing here is public.
   ============================================================ */
const sec = require('../domains/security');
const { getStore } = require('../domains/store');
const BS = require('../photobooks/blobstore');
const NT = require('./notify');
const GH = require('./github');
const MAIL = require('./mail');
const CMS = require('../../assets/hq/sitecms.js');

const COLLECTIONS = { tasks: 'hq/tasks.json', events: 'hq/events.json', notes: 'hq/notes.json', projects: 'hq/projects.json', invoices: 'hq/invoices.json', expenses: 'hq/expenses.json' };
const SHOP_STATUSES = ['paid', 'processing', 'fulfilled', 'delivered', 'cancelled', 'refunded'];

const clean = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, n || 200);
const cleanML = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, ' ').slice(0, n || 4000);
const err = (status, code, message) => Object.assign(new Error(message), { status, code });

/* fields kept for each kind of record (everything else is dropped) */
const SHAPE = {
  tasks: { title: 120, notes: 2000, status: 20, priority: 10, due: 10, tag: 40, ref: 40, assignee: 60 },
  events: { title: 120, notes: 2000, type: 20, date: 10, end: 10, start: 5, finish: 5, allDay: 0, location: 160, client: 120, ref: 40 },
  notes: { key: 200, text: 4000 },
  projects: { name: 120, client: 120, email: 190, phone: 30, desc: 4000, scope: 4000, start: 10, deadline: 10, status: 20, priority: 10, budget: 40, lead: 40, milestones: 4000 },
  /* -1 = an amount in KES, -2 = invoice lines */
  invoices: { number: 30, kind: 10, client: 120, email: 190, phone: 30, address: 300, date: 10, due: 10, status: 20, notes: 1000, ref: 40, paidAt: 10, method: 40, code: 40, items: -2, discount: -1, delivery: -1 },
  expenses: { date: 10, amount: -1, category: 30, note: 300, ref: 40 }
};
const MULTI = ['notes', 'text', 'desc', 'scope', 'milestones'];
function shape(c, item) {
  const o = { id: /^[a-z0-9]{6,32}$/i.test(item.id || '') ? item.id : sec.randomId(9).replace(/[^a-z0-9]/gi, '').slice(0, 12) };
  Object.entries(SHAPE[c]).forEach(([k, n]) => {
    if (item[k] == null) return;
    if (n === 0) o[k] = !!item[k];
    else if (n === -1) o[k] = Math.max(0, Math.round((Number(item[k]) || 0) * 100) / 100);
    else if (n === -2) o[k] = (Array.isArray(item[k]) ? item[k] : []).slice(0, 60).map(l => ({ desc: clean(l.desc, 200), qty: Math.max(0, Math.round((Number(l.qty) || 0) * 100) / 100), price: Math.max(0, Math.round((Number(l.price) || 0) * 100) / 100) })).filter(l => l.desc || l.price);
    else if (MULTI.includes(k)) o[k] = cleanML(item[k], n);
    else o[k] = clean(item[k], n);
  });
  if (o.date && !/^\d{4}-\d{2}-\d{2}$/.test(o.date)) delete o.date;
  if (o.end && !/^\d{4}-\d{2}-\d{2}$/.test(o.end)) delete o.end;
  if (o.due && !/^\d{4}-\d{2}-\d{2}$/.test(o.due)) delete o.due;
  ['start', 'deadline', 'paidAt'].forEach(k => { if (o[k] && !/^\d{4}-\d{2}-\d{2}$/.test(o[k])) delete o[k]; });
  if (c === 'invoices') o.total = Math.max(0, Math.round(((o.items || []).reduce((n, l) => n + l.qty * l.price, 0) + (o.delivery || 0) - (o.discount || 0)) * 100) / 100);
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
    await new Promise((ok, no) => { req.on('data', c => { n += c.length; if (n > (req.__max || 512 * 1024)) { no(err(413, 'size', 'Too large.')); req.destroy(); } else parts.push(c); }); req.on('end', ok); req.on('error', no); });
    try { return parts.length ? JSON.parse(Buffer.concat(parts).toString()) : {}; } catch (e) { throw err(400, 'json', 'Invalid request.'); }
  }
  const admin = req => { if (!sec.secret() || !process.env.ADMIN_PASSWORD || !sec.checkSession(req)) throw err(401, 'auth', 'Please sign in.'); };
  const needBlob = () => { if (!BS.on()) throw err(503, 'storage', 'Connect the private Blob store to this project first.'); };
  async function read(c) { return (await BS.getJSON(COLLECTIONS[c]).catch(() => null)) || { items: [], v: 0 }; }

  const R = {};
  R.me = async req => ({ ok: true, signedIn: !!(sec.secret() && process.env.ADMIN_PASSWORD && sec.checkSession(req)), setup: { mail: MAIL.configured(), adminPassword: !!process.env.ADMIN_PASSWORD, storage: BS.on(), payments: !!(process.env.MPESA_CONSUMER_KEY && process.env.MPESA_PASSKEY), email: !!process.env.RESEND_API_KEY, publish: !!process.env.GITHUB_TOKEN, domainsDb: !!(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || BS.on()), mpesaEnv: process.env.MPESA_ENV || 'sandbox' } });
  R.login = async req => {
    const b = await body(req);
    if (!(await sec.rateLimit(getStore(), 'hq-login', sec.clientIp(req), 8, 900))) throw err(429, 'rate', 'Too many attempts. Wait 15 minutes and try again.');
    if (!sec.secret() || !process.env.ADMIN_PASSWORD) throw err(503, 'setup', 'Set ADMIN_PASSWORD in Vercel first (Project → Settings → Environment Variables), then redeploy.');
    if (!sec.checkPassword(b.password)) { await log('Failed sign-in', sec.clientIp(req)); throw err(401, 'auth', 'Wrong password.'); }
    await log('Signed in', '');
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
      if (b.c === 'projects' && !it.name) throw err(400, 'name', 'Give the project a name.');
      if (b.c === 'expenses' && (!it.amount || !it.date)) throw err(400, 'expense', 'A cost needs an amount and a date.');
      if (b.c === 'invoices') {
        if (!it.client || !(it.items || []).length) throw err(400, 'invoice', 'An invoice needs a client and at least one line.');
        const old = d.items.find(x => x.id === it.id);
        if (old) it.number = old.number;
        else { const y = String(new Date(now()).getFullYear()), n = d.items.filter(x => String(x.number || '').indexOf('INV-' + y + '-') === 0).map(x => +String(x.number).split('-')[2] || 0); it.number = 'INV-' + y + '-' + String((n.length ? Math.max.apply(null, n) : 0) + 1).padStart(3, '0'); }
      }
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
    /* records made only by the shared M-Pesa callback (a Photo Books or Domains payment) are not shop orders */
    const list = (await Promise.all(files.slice(0, 600).map(f => BS.getJSON(f.path).catch(() => null)))).filter(o => o && (o.history || []).some(h => h.status === 'awaiting_payment'));
    return { ok: true, storage: true, orders: list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)) };
  };
  /* ---- digital products: files, the customer's download page, links ---- */
  const DL = require('./delivery');
  R['pf-list'] = async req => { admin(req); return { ok: true, storage: BS.on(), files: BS.on() ? await DL.files() : {} }; };
  /* the browser uploads straight to private Blob storage (large files); this only hands out a one-time token */
  R['pf-upload'] = async (req) => {
    const b = await body(req);
    if (b && b.type === 'blob.generate-client-token') admin(req);
    const { handleUpload } = require('@vercel/blob/client');
    return handleUpload({ body: b, request: req,
      onBeforeGenerateToken: async (pathname) => {
        const m = String(pathname).match(/^products\/([A-Za-z0-9_-]{1,60})\/[A-Za-z0-9_-]{6,20}\/[\w.\- ]{1,120}$/);
        if (!m || !DL.catalog()[m[1]]) throw err(400, 'path', 'Unknown product.');
        return { maximumSizeInBytes: 500 * 1024 * 1024, addRandomSuffix: false, allowOverwrite: false };
      },
      onUploadCompleted: async () => { } });
  };
  R['pf-key'] = async req => { admin(req); needBlob(); const b = await body(req); if (!DL.catalog()[b.id]) throw err(400, 'id', 'Unknown product. Publish it first, then add its file.'); return { ok: true, path: DL.fileKey(b.id, b.name) }; };
  R['pf-attach'] = async req => {
    admin(req); needBlob(); const b = await body(req);
    if (!DL.catalog()[b.id]) throw err(400, 'id', 'Unknown product.');
    if (String(b.path || '').indexOf('products/' + b.id + '/') !== 0) throw err(400, 'path', 'Bad file.');
    const h = await require('@vercel/blob').head(b.path).catch(() => null); if (!h) throw err(404, 'missing', 'The upload didn’t finish. Try again.');
    const f = await DL.attach(b.id, { path: b.path, name: DL.safeName(b.name), size: h.size, type: h.contentType || 'application/octet-stream' });
    await log('Added a download file', b.id + ' · ' + f.name);
    return { ok: true, file: f };
  };
  R['pf-remove'] = async req => { admin(req); needBlob(); const b = await body(req); await DL.detach(String(b.id || '')); await log('Removed a download file', String(b.id || '')); return { ok: true }; };
  R['dl-info'] = async req => { const b = await body(req); return DL.summary(String(b.o || ''), String(b.k || '')); };
  R['dl'] = async (req, q) => { const f = await DL.fetchFile(String(q.o || ''), String(q.k || ''), String(q.f || '')); return { __stream: f }; };
  /** admin: the order's download link; make a new one (old link stops) or email it again */
  R['shop-link'] = async req => {
    admin(req); needBlob(); const b = await body(req);
    const p = 'shop/orders/' + String(b.id || '').replace(/[^A-Za-z0-9_-]/g, '') + '.json', o = await BS.getJSON(p); if (!o) throw err(404, 'missing', 'Order not found.');
    if (!o.paid) throw err(409, 'unpaid', 'This order isn’t paid.');
    if (b.op === 'renew' || !o.dl) { if (!(o.lines || []).length) throw err(409, 'lines', 'This order was placed before downloads were set up, so it has no product list. Send the files by email instead.'); o.verified = true; if (o.dl) o.dlN = (o.dlN || 0) + 1; delete o.dl; DL.grant(o); o.history = (o.history || []).concat([{ status: 'download', at: now(), note: 'New download link made (30 days)' }]); await BS.putJSON(p, o); }
    let emailed = null; if (b.op === 'email') { emailed = await DL.emailLink(o); if (emailed) { o.history = (o.history || []).concat([{ status: 'download', at: now(), note: 'Download link emailed to ' + o.customer.email }]); await BS.putJSON(p, o); } }
    return { ok: true, url: DL.link(o), until: o.dl.until, emailed, order: o };
  };
  R['shop-status'] = async req => {
    admin(req); needBlob(); const b = await body(req);
    if (!/^[A-Za-z0-9_-]{6,80}$/.test(b.id || '')) throw err(400, 'id', 'Bad order.');
    if (!SHOP_STATUSES.includes(b.status)) throw err(400, 'status', 'Unknown status.');
    const p = 'shop/orders/' + b.id + '.json', o = await BS.getJSON(p); if (!o) throw err(404, 'missing', 'Order not found.');
    o.status = b.status; o.history = (o.history || []).concat([{ status: b.status, at: now(), note: clean(b.note, 300) || undefined }]);
    await BS.putJSON(p, o); return { ok: true, order: o };
  };

  /* live updates: Ciel Admin polls this while open */
  R.pulse = async req => { admin(req); const p = await NT.readPulse(); return { ok: true, v: p.v || 0, items: (p.items || []).slice(0, 30) }; };
  /* phone / computer notifications */
  R['push-key'] = async req => { admin(req); const k = await NT.vapid(); if (!k) throw err(503, 'storage', 'Connect the private Blob store first.'); return { ok: true, key: k.publicKey }; };
  R['push-sub'] = async req => { admin(req); const b = await body(req); if (b.op === 'remove') { await NT.removeSub(String(b.endpoint || '')); return { ok: true }; } return { ok: true, devices: await NT.addSub(b.sub, clean(b.label, 80)) }; };
  R['notify-prefs'] = async req => { admin(req); return { ok: true, prefs: await NT.prefs() }; };
  R['notify-prefs-save'] = async req => { admin(req); return { ok: true, prefs: await NT.savePrefs(await body(req)) }; };
  R['push-test'] = async req => { admin(req); const n = await NT.push({ title: 'Ciel Admin', body: 'Notifications are on for this device.', url: '/admin', tag: 'test' }); return { ok: true, sent: n }; };

  /* inbox: website form messages and WhatsApp orders (hq/inbox/*.json) */
  const INBOX_ST = ['new', 'pending', 'contacted', 'confirmed', 'paid', 'done', 'cancelled'];
  R.inbox = async req => {
    admin(req); if (!BS.on()) return { ok: true, storage: false, items: [] };
    const files = (await BS.listFiles('hq/inbox/')).sort((a, b) => (a.path < b.path ? 1 : -1)).slice(0, 400);
    const items = (await Promise.all(files.map(f => BS.getJSON(f.path).catch(() => null)))).filter(Boolean);
    return { ok: true, storage: true, items: items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)) };
  };
  R['inbox-status'] = async req => {
    admin(req); needBlob(); const b = await body(req);
    if (!/^[A-Za-z0-9_-]{6,60}$/.test(b.id || '')) throw err(400, 'id', 'Bad item.');
    const p = 'hq/inbox/' + b.id + '.json';
    if (b.op === 'delete') { await BS.del([p]); return { ok: true }; }
    const o = await BS.getJSON(p); if (!o) throw err(404, 'missing', 'Not found.');
    if (b.status) { if (!INBOX_ST.includes(b.status)) throw err(400, 'status', 'Unknown status.'); o.status = b.status; o.history = (o.history || []).concat([{ status: b.status, at: now(), note: clean(b.note, 300) || undefined }]); }
    if (b.total != null) o.total = Math.max(0, Math.round(Number(b.total) || 0)) || null;
    if (b.read) o.read = true;
    await BS.putJSON(p, o); return { ok: true, item: o };
  };
  /* leads: pipeline stage, priority, follow-up date and internal notes on a website inquiry */
  const STAGES = ['new', 'reviewing', 'awaiting', 'discovery', 'proposal_prep', 'proposal_sent', 'negotiation', 'approved', 'in_progress', 'completed', 'declined', 'archived'];
  R['lead-update'] = async req => {
    admin(req); needBlob(); const b = await body(req);
    if (!/^[A-Za-z0-9_-]{6,60}$/.test(b.id || '')) throw err(400, 'id', 'Bad item.');
    const p = 'hq/inbox/' + b.id + '.json', o = await BS.getJSON(p); if (!o) throw err(404, 'missing', 'Not found.');
    if (b.stage) { if (!STAGES.includes(b.stage)) throw err(400, 'stage', 'Unknown stage.'); if (o.stage !== b.stage) o.history = (o.history || []).concat([{ status: 'stage:' + b.stage, at: now() }]); o.stage = b.stage; if (o.status === 'new') o.status = 'contacted'; }
    if (b.priority != null) o.priority = ['low', 'normal', 'high', 'urgent'].includes(b.priority) ? b.priority : 'normal';
    if (b.followUp !== undefined) o.followUp = /^\d{4}-\d{2}-\d{2}$/.test(b.followUp || '') ? b.followUp : null;
    if (b.project) o.project = clean(b.project, 40);
    if (b.note) o.notes = (o.notes || []).concat([{ at: now(), text: cleanML(b.note, 2000) }]).slice(-100);
    await BS.putJSON(p, o); return { ok: true, item: o };
  };

  /* someone tapped a WhatsApp order link on the website: keep it as a pending order */
  R.lead = async req => {
    req.__max = 16 * 1024; const b = await body(req);
    if (!(await sec.rateLimit(getStore(), 'hq-lead', sec.clientIp(req), 30, 3600))) return { ok: true };
    if (!BS.on()) return { ok: true };
    const text = cleanML(b.text, 2000).trim(); if (!text && !b.page) return { ok: true };
    const id = Date.now().toString(36) + sec.randomId(6).replace(/[^a-z0-9]/gi, '').slice(0, 6);
    const it = { id, kind: 'whatsapp', status: 'pending', createdAt: now(), source: clean(b.source, 40) || 'website', page: clean(b.page, 160), text,
      customer: { name: clean(b.name, 80), phone: clean(b.phone, 20).replace(/[^\d+]/g, '').replace(/^\+/, '').replace(/^0(\d{9})$/, '254$1'), email: clean(b.email, 190) }, total: Math.round(Number(b.total) || 0) || null,
      ref: 'WA-' + id.slice(-6).toUpperCase(), history: [{ status: 'pending', at: now(), note: 'Tapped “WhatsApp” on ' + (clean(b.page, 160) || 'the website') }] };
    await BS.putJSON('hq/inbox/' + id + '.json', it);
    await NT.event({ kind: 'whatsapp', title: 'WhatsApp order started', body: (it.customer.name ? it.customer.name + ': ' : '') + (text.split('\n')[0] || it.page).slice(0, 110), url: '/admin#inbox/' + id });
    return { ok: true };
  };

  /* ---------- email subscribers (website sign-up, double opt-in) and campaigns ---------- */
  const SUB = require('./subs');
  R.subscribe = async req => {
    req.__max = 8 * 1024; const b = await body(req);
    if (b.hp) return { ok: true, state: 'sent' };                                   // a bot filled the hidden field
    if (!(await sec.rateLimit(getStore(), 'hq-sub', sec.clientIp(req), 8, 3600))) throw err(429, 'rate', 'Too many tries from here. Please wait a little and try again.');
    return SUB.subscribe(b, deps.fetch);
  };
  R['sub-confirm'] = async req => {
    req.__max = 4 * 1024; const b = await body(req);
    if (!(await sec.rateLimit(getStore(), 'hq-subc', sec.clientIp(req), 40, 3600))) throw err(429, 'rate', 'Too many tries. Please wait a little.');
    const r = await SUB.confirm(b.k);
    if (r.fresh) {
      await NT.event({ kind: 'subscriber', title: 'New subscriber', body: r.sub.email + ' · ' + (SUB.SOURCES[r.sub.source] || 'Website'), url: '/admin#campaigns/subscribers' }); await log('New subscriber', r.email);
      if (!r.sub.welcomedAt) { try { await SUB.sendWelcome(r.sub, await SET.get('welcome'), deps.fetch); } catch (e) { console.error('[hq] welcome', e.message); } }
    }
    return { ok: true, email: r.email };
  };
  /* the unsubscribe page, and one-click unsubscribe from Gmail / Apple Mail (List-Unsubscribe-Post) */
  R['sub-unsub'] = async (req, q) => { let k = q.k; if (!k) { req.__max = 4 * 1024; k = (await body(req)).k; } return SUB.unsubscribe(k); };
  R.subs = async req => { admin(req); if (!BS.on()) return { ok: true, storage: false, items: [] }; return { ok: true, storage: true, email: !!process.env.RESEND_API_KEY, items: (await SUB.allSubs()).map(SUB.pub) }; };
  R['sub-admin'] = async req => {
    admin(req); needBlob(); const b = await body(req);
    if (!/^[a-f0-9]{24}$/.test(b.id || '')) throw err(400, 'id', 'Bad subscriber.');
    const s = await SUB.getSub(b.id); if (!s) throw err(404, 'missing', 'Subscriber not found.');
    if (b.op === 'delete') { await BS.del(['hq/subs/' + b.id + '.json']); await log('Deleted a subscriber', s.email); return { ok: true }; }
    if (b.op === 'unsubscribe') { s.status = 'unsubscribed'; s.unsubscribedAt = now(); await SUB.putSub(s); await log('Unsubscribed', s.email); return { ok: true, item: SUB.pub(s) }; }
    throw err(400, 'op', 'Unknown action.');
  };
  R.camps = async req => { admin(req); if (!BS.on()) return { ok: true, storage: false, items: [] }; return { ok: true, storage: true, email: !!process.env.RESEND_API_KEY, from: process.env.MAIL_FROM || 'Ciel Africa <hello@cielafrica.com>', items: await SUB.listCamps() }; };
  R['camp-save'] = async req => {
    admin(req); needBlob(); req.__max = 64 * 1024; const b = await body(req);
    const old = b.id ? await SUB.getCamp(b.id) : null;
    if (old && !/^(draft|scheduled)$/.test(old.status)) throw err(409, 'sent', 'This campaign has already gone out. Duplicate it to send a new one.');
    const c = SUB.shapeCamp(b, old); await BS.putJSON(SUB.campPath(c.id), c); return { ok: true, item: c };
  };
  R['camp-del'] = async req => { admin(req); needBlob(); const b = await body(req); const c = await SUB.getCamp(b.id); if (c.status === 'sending') throw err(409, 'sending', 'Finish sending first.'); await BS.del([SUB.campPath(c.id)]); return { ok: true }; };
  R['camp-preview'] = async req => { admin(req); req.__max = 64 * 1024; const b = await body(req); const c = SUB.shapeCamp(b, null); return { ok: true, html: SUB.emailHtml(SUB.campEmail(c, null)) }; };
  R['camp-test'] = async req => { admin(req); needBlob(); const b = await body(req); const c = await SUB.getCamp(b.id); await SUB.sendTest(c, b.to, deps.fetch); await log('Sent a test campaign', c.subject + ' → ' + SUB.normEmail(b.to)); return { ok: true }; };
  R['camp-send'] = async req => {
    admin(req); needBlob(); const b = await body(req);
    const r = await SUB.sendBatch(b.id, deps.fetch, 50);
    if (r.done && r.camp.sentAt && now() - r.camp.sentAt < 5000) await log('Sent a campaign', r.camp.subject + ' · ' + r.sent + ' people');
    r.camp = Object.assign({}, r.camp, { queue: undefined, done: undefined, failed: undefined }); return r;
  };

  R['camp-schedule'] = async req => {
    admin(req); needBlob(); const b = await body(req); const c = await SUB.getCamp(b.id);
    if (!/^(draft|scheduled)$/.test(c.status)) throw err(409, 'sent', 'This campaign is already going out.');
    if (b.at) { const t = Date.parse(b.at); if (!(t > now() - 60000)) throw err(400, 'at', 'Pick a time in the future.'); if (!c.subject || !c.title || !String(c.body || '').trim()) throw err(400, 'ready', 'Add a subject, headline and message first.'); c.status = 'scheduled'; c.sendAt = t; }
    else { c.status = 'draft'; delete c.sendAt; }
    c.updatedAt = now(); await BS.putJSON(SUB.campPath(c.id), c); return { ok: true, item: c };
  };
  /* while Ciel Admin is open it checks for scheduled campaigns that are due (the daily job catches the rest) */
  R['camp-due'] = async req => { admin(req); if (!BS.on()) return { ok: true }; return Object.assign({ ok: true }, await require('./daily').campaigns(deps.fetch, 25000)); };

  /* ---------- settings: business details, quick WhatsApp replies, welcome email, reviews ---------- */
  const SET = require('./settings');
  R['settings-get'] = async (req, q) => { admin(req); return { ok: true, key: q.k, value: await SET.get(String(q.k || '')) }; };
  R['settings-save'] = async req => { admin(req); needBlob(); req.__max = 64 * 1024; const b = await body(req); const v = await SET.save(String(b.k || ''), b.v); await log('Changed settings', String(b.k)); return { ok: true, value: v }; };

  /* ---------- receipts & invoices: the browser makes the PDF, this emails it ---------- */
  R['doc-email'] = async req => {
    admin(req); req.__max = 4 * 1024 * 1024; const b = await body(req);
    const to = SUB.normEmail(b.to); if (!SUB.okEmail(to)) throw err(400, 'to', 'Enter a valid email address.');
    if (!process.env.RESEND_API_KEY) throw err(503, 'email', 'Email sending isn’t set up (RESEND_API_KEY).');
    const pdf = String(b.pdf || ''); if (!/^[A-Za-z0-9+/=]+$/.test(pdf) || pdf.length > 3.5 * 1024 * 1024) throw err(400, 'pdf', 'The document is missing or too big.');
    const name = clean(b.filename, 80).replace(/[^\w.\- ]+/g, '_') || 'document.pdf', kind = b.kind === 'invoice' ? 'Invoice' : 'Receipt';
    const m = { kicker: kind, title: clean(b.title, 140) || kind, body: cleanML(b.message, 3000) || ('Please find your ' + kind.toLowerCase() + ' attached.'), foot: '<p style="margin:0">Questions about this ' + kind.toLowerCase() + '? Just reply to this email.</p>' };
    const r = await (deps.fetch || fetch)('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(20000),
      body: JSON.stringify({ from: process.env.MAIL_FROM || 'Ciel Africa <hello@cielafrica.com>', to: [to], subject: clean(b.subject, 200) || kind + ' from Ciel Africa', html: SUB.emailHtml(m), reply_to: 'hello@cielafrica.com', attachments: [{ filename: name.replace(/(\.pdf)?$/i, '.pdf'), content: pdf, content_type: 'application/pdf' }] }) });
    if (!r.ok) { const j = await r.json().catch(() => ({})); throw err(502, 'resend', 'The email service said: ' + (j.message || 'HTTP ' + r.status)); }
    await log('Emailed ' + kind.toLowerCase(), clean(b.ref, 40) + ' → ' + to);
    return { ok: true };
  };

  /* ---------- reviews ---------- */
  const REV = require('./reviews');
  R['review-info'] = async req => { const b = await body(req); return REV.info(b.k); };
  R['review-submit'] = async req => {
    req.__max = 8 * 1024; const b = await body(req);
    if (!(await sec.rateLimit(getStore(), 'hq-rev', sec.clientIp(req), 10, 3600))) throw err(429, 'rate', 'Too many tries. Please wait a little.');
    const r = await REV.submit(b.k, b);
    await NT.event({ kind: 'review', title: 'New review · ' + '★'.repeat(r.stars), body: (r.name ? r.name + ': ' : '') + (r.text || '').slice(0, 100), url: '/admin#reviews' });
    return { ok: true };
  };
  R.reviews = async req => { admin(req); if (!BS.on()) return { ok: true, items: [] }; return { ok: true, items: await REV.all(), settings: await SET.get('reviews') }; };
  R['review-admin'] = async req => { admin(req); needBlob(); const b = await body(req); const r = await REV.admin(b); await log('Review ' + b.op, String(b.id)); return { ok: true, item: r }; };
  R['reviews-public'] = async () => [{ ok: true, items: BS.on() ? await REV.publicList() : [] }, { 'Cache-Control': 'public, max-age=60, s-maxage=300' }];
  R['review-link'] = async req => { admin(req); const b = await body(req); if (!REV.okRef(b.ref)) throw err(400, 'ref', 'Bad order.'); if (!sec.secret()) throw err(503, 'setup', 'Missing signing secret.'); return { ok: true, url: REV.link(String(b.ref)) }; };
  R['review-ask'] = async req => {
    admin(req); const b = await body(req); const ref = String(b.ref || '');
    await REV.ask({ ref, email: SUB.normEmail(b.email), name: clean(b.name, 80) }, deps.fetch);
    if (/^PB-[0-9A-Z]{8}$/.test(ref)) { const o = await BS.getOrder(ref).catch(() => null); if (o) { o.reviewAsk = now(); await BS.saveOrder(o); } }
    await log('Asked for a review', ref); return { ok: true };
  };

  /* ---------- full backup of everything Ciel Admin keeps (no keys, no photos) ---------- */
  R.backup = async req => {
    admin(req); needBlob();
    const skip = /^hq\/(vapid|push-subs)\.json$|^hq\/site-versions\//;
    const files = (await BS.listFiles('hq/')).concat(await BS.listFiles('shop/orders/')).filter(f => /\.json$/.test(f.path) && !skip.test(f.path));
    const out = {};
    for (let i = 0; i < files.length; i += 40) await Promise.all(files.slice(i, i + 40).map(f => BS.getJSON(f.path).then(j => { out[f.path] = j; }, () => null)));
    const pb = await BS.listOrders(5000).catch(() => []);
    pb.forEach(o => { out['orders/' + o.ref + '/order.json'] = o; });
    await log('Downloaded a backup', Object.keys(out).length + ' records');
    return { ok: true, exportedAt: new Date(now()).toISOString(), note: 'Ciel Admin backup: orders, customers, messages, subscribers, campaigns, tasks, calendar, invoices, costs, reviews and settings. No passwords, keys or photos. Keep it private.', count: Object.keys(out).length, files: out };
  };

  /* ---------- activity log (hq/activity.json, newest first, last 500) ---------- */
  async function log(action, detail) {
    try { const d = (await BS.getJSON('hq/activity.json').catch(() => null)) || { items: [] }; d.items.unshift({ at: now(), action: clean(action, 80), detail: clean(detail, 300) }); d.items = d.items.slice(0, 500); await BS.putJSON('hq/activity.json', d); } catch (e) { console.error('[hq] log', e && e.message); }
  }
  R.activity = async req => { admin(req); return { ok: true, items: ((await BS.getJSON('hq/activity.json').catch(() => null)) || { items: [] }).items.slice(0, 200) }; };

  /* ---------- website: drafts, publishing and versions ---------- */
  R['site-status'] = async req => { admin(req); return { ok: true, github: GH.on(), repo: GH.REPO(), storage: BS.on() }; };
  R['site-draft'] = async req => { admin(req); return { ok: true, draft: BS.on() ? await BS.getJSON('hq/site-draft.json').catch(() => null) : null }; };
  R['site-draft-save'] = async req => {
    admin(req); needBlob(); req.__max = 4.4 * 1024 * 1024; const b = await body(req);
    if (b.clear) { await BS.del(['hq/site-draft.json']).catch(() => {}); return { ok: true }; }
    await BS.putJSON('hq/site-draft.json', { at: now(), model: b.model || null, items: b.items || null, photobooks: b.photobooks || null, uploads: b.uploads || null });
    return { ok: true, at: now() };
  };
  R['site-publish'] = async req => {
    admin(req); req.__max = 4.4 * 1024 * 1024; const b = await body(req);
    if (!GH.on()) throw err(503, 'github', 'Publishing isn’t switched on yet: add GITHUB_TOKEN in Vercel (see Setup).');
    const files = [], summary = [];
    if (b.model) {
      const m = b.model;
      if (!m.hero || !Array.isArray(m.sections) || !Array.isArray(m.nav) || !Array.isArray(m.footer)) throw err(400, 'model', 'The website content is incomplete.');
      const root = (await GH.rootFiles()).filter(p => /\.html$/.test(p) && !/^(admin|admin-content|domains-admin)\.html$/.test(p));
      const pages = await Promise.all(root.map(p => GH.read(p).then(c => ({ path: p, content: c }))));
      pages.forEach(p => { if (!/nav__links|<main id="main">/.test(p.content)) return; const out = CMS.apply(p.content, m, p.path); if (out !== p.content) files.push({ path: p.path, content: out }); });
      files.push({ path: 'data/site.json', content: JSON.stringify(Object.assign({}, m, { publishedAt: now() }), null, 1) + '\n' });
      summary.push('website content');
    }
    for (const [file, key] of [['data/products.js', 'products'], ['data/templates.js', 'templates']]) {
      const ch = b.items && b.items[key]; if (!ch || !Object.keys(ch).length) continue;
      const js = await GH.read(file), out = CMS.setItems(js, ch, key); if (out !== js) { files.push({ path: file, content: out }); summary.push(Object.keys(ch).length + ' ' + key); }
    }
    /* product and template pictures uploaded in Ciel Admin */
    const ups = b.uploads && typeof b.uploads === 'object' ? Object.keys(b.uploads) : [];
    ups.forEach(path => {
      if (!/^assets\/img\/(products|templates)\/[a-z0-9-]{2,60}\.(webp|jpg|png)$/.test(path)) throw err(400, 'upload', 'Bad image name.');
      const data = String(b.uploads[path] || ''); if (!data || data.length > 2.8 * 1024 * 1024) throw err(413, 'upload', 'An image is too big.');
      files.push({ path, base64: data });
    });
    if (ups.length) summary.push(ups.length + ' image' + (ups.length === 1 ? '' : 's'));
    if (b.photobooks) { const js = await GH.read('data/photobooks.js'), out = CMS.setPhotoBooks(js, b.photobooks); if (out !== js) { files.push({ path: 'data/photobooks.js', content: out }); summary.push('Photo Books prices'); } }
    /* the "from" price Google shows for /photobooks (structured data) follows the smallest book's price */
    if (b.photobooks && b.photobooks.tiers && typeof b.photobooks.tiers === 'object') {
      const t = b.photobooks.tiers, ks = Object.keys(t).map(Number).filter(k => Number(t[k]) > 0).sort((x, y) => x - y);
      if (ks.length) {
        const low = Math.round(Number(t[ks[0]])), html = await GH.read('photobooks/index.html').catch(() => null);
        const h2 = html && html.replace(/("priceCurrency":"KES","price":")\d+(")/, '$1' + low + '$2');
        if (h2 && h2 !== html) files.push({ path: 'photobooks/index.html', content: h2 });
      }
    }
    if (!files.length) return { ok: true, sha: null, message: 'Nothing changed.' };
    const msg = '[Ciel Admin] Publish ' + summary.join(', ') + (b.note ? ' — ' + clean(b.note, 120) : '');
    const sha = await GH.commit(files, msg + '\n\nPublished from Ciel Admin (cielafrica.com/admin).');
    const id = now().toString(36);
    if (BS.on()) {
      await BS.putJSON('hq/site-versions/' + id + '.json', { id, at: now(), sha, summary: summary.join(', '), note: clean(b.note, 120), model: b.model || null, items: b.items || null, photobooks: b.photobooks || null });
      await log('Catalogue', JSON.stringify(Object.keys((b.items && b.items.products) || {}).concat(Object.keys((b.items && b.items.templates) || {}))).slice(0, 280));
      await BS.del(['hq/site-draft.json']).catch(() => {});
    }
    await log('Published website', summary.join(', ') + ' · ' + files.length + ' files · ' + String(sha).slice(0, 7));
    return { ok: true, sha, files: files.map(f => f.path), stamp: b.model ? JSON.parse(files.find(f => f.path === 'data/site.json').content).publishedAt : null };
  };
  R['site-versions'] = async req => {
    admin(req); if (!BS.on()) return { ok: true, items: [] };
    const fl = (await BS.listFiles('hq/site-versions/')).sort((a, b) => (a.path < b.path ? 1 : -1)).slice(0, 25);
    const items = (await Promise.all(fl.map(f => BS.getJSON(f.path).catch(() => null)))).filter(Boolean).map(v => ({ id: v.id, at: v.at, sha: v.sha, summary: v.summary, note: v.note, hasModel: !!v.model }));
    return { ok: true, items };
  };
  R['site-version'] = async (req, q) => { admin(req); if (!/^[a-z0-9]{4,20}$/.test(q.id || '')) throw err(400, 'id', 'Bad version.'); const v = await BS.getJSON('hq/site-versions/' + q.id + '.json'); if (!v) throw err(404, 'missing', 'Version not found.'); return { ok: true, version: v }; };

  /* ---------- website traffic from Vercel Web Analytics (needs VERCEL_TOKEN, read-only use) ---------- */
  R['web-analytics'] = async (req, q) => {
    admin(req);
    if (!process.env.VERCEL_TOKEN) return { ok: true, configured: false };
    const days = Math.min(365, Math.max(1, Math.round(+q.days || 30))), until = new Date(), since = new Date(Date.now() - days * 864e5);
    const base = 'https://api.vercel.com/v1/query/web-analytics/visits/aggregate?projectId=' + encodeURIComponent(process.env.VERCEL_PROJECT_ID || 'prj_c2CEPfvIOJc4VO4jRmnVOHId4xQq') + '&teamId=' + encodeURIComponent(process.env.VERCEL_TEAM_ID || 'team_vTRnveTUbWgrVG699Jx8OiP9') + '&since=' + since.toISOString() + '&until=' + until.toISOString();
    const get = async (by, limit) => {
      const r = await fetch(base + '&by=' + by + (limit ? '&limit=' + limit : ''), { headers: { Authorization: 'Bearer ' + process.env.VERCEL_TOKEN }, signal: AbortSignal.timeout(12000) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { const m = (j.error && (j.error.code || j.error.message)) || ('HTTP ' + r.status); throw err(r.status === 403 || r.status === 401 ? 503 : 502, 'vercel', /not_enabled/.test(m) ? 'Web Analytics is not switched on for this project yet (Vercel → cielafrica → Analytics → Enable).' : 'Vercel Analytics: ' + m); }
      return j;
    };
    const [day, pages, refs, countries, devices] = await Promise.all([get('day'), get('requestPath', 10), get('referrerHostname', 8), get('country', 8), get('deviceType', 4)]);
    return { ok: true, configured: true, days, day, pages, refs, countries, devices };
  };

  /* ---------- email: the real hello@ and lorna@ mailboxes (IMAP/SMTP) ---------- */
  const acct = v => (MAIL.ACCOUNTS[v] ? v : (() => { throw err(400, 'acct', 'Unknown mailbox.'); })());
  const folderName = v => { v = String(v || 'INBOX'); if (v.length > 120 || /[\r\n]/.test(v)) throw err(400, 'folder', 'Bad folder.'); return v; };
  R['mail-accounts'] = async req => { admin(req); return { ok: true, accounts: MAIL.configured() }; };
  R['mail-unread'] = async req => { admin(req); return { ok: true, boxes: await MAIL.unread() }; };
  R['mail-folders'] = async (req, q) => { admin(req); return Object.assign({ ok: true }, await MAIL.folderList(acct(q.acct))); };
  R['mail-list'] = async (req, q) => {
    admin(req); const qs = clean(q.q, 80);
    if (q.acct === 'all') {
      const ids = MAIL.configured().filter(a => a.configured && !a.alias).map(a => a.id);
      const res = await Promise.all(ids.map(id => MAIL.list(id, 'INBOX', 0, qs).catch(e => ({ items: [], error: e.message, id }))));
      return { ok: true, items: [].concat.apply([], res.map(r => r.items)).sort((a, b) => b.date - a.date).slice(0, 40), errors: res.filter(r => r.error).map(r => r.error), unseen: res.reduce((n, r) => n + (r.unseen || 0), 0) };
    }
    const to = q.to && MAIL.ACCOUNTS[q.to] ? MAIL.ACCOUNTS[q.to].email : '';
    return Object.assign({ ok: true }, await MAIL.list(acct(q.acct), folderName(q.folder), q.page, qs, to));
  };
  R['mail-read'] = async (req, q) => { admin(req); return { ok: true, message: await MAIL.read(acct(q.acct), folderName(q.folder), Math.round(+q.uid)) }; };
  R['mail-att'] = async (req, q) => { admin(req); const a = await MAIL.attachment(acct(q.acct), folderName(q.folder), Math.round(+q.uid), Math.round(+q.i)); return { __binary: a.buf, type: a.type, name: a.name }; };
  R['mail-act'] = async req => {
    admin(req); const b = await body(req);
    if (!['read', 'unread', 'star', 'unstar', 'archive', 'trash', 'spam'].includes(b.op)) throw err(400, 'op', 'Unknown action.');
    const uids = (Array.isArray(b.uids) ? b.uids : [b.uids]).map(Number).filter(n => n > 0).slice(0, 200); if (!uids.length) throw err(400, 'uid', 'Nothing selected.');
    return MAIL.act(acct(b.acct), folderName(b.folder), uids, b.op);
  };
  R['mail-send'] = async req => {
    admin(req); req.__max = 4.4 * 1024 * 1024; const b = await body(req);
    const list = v => String(v || '').split(/[,;]/).map(x => x.trim()).filter(Boolean);
    const okAddr = x => /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(x.replace(/^.*<([^>]+)>$/, '$1'));
    const to = list(b.to), cc = list(b.cc), bcc = list(b.bcc);
    if (!to.length) throw err(400, 'to', 'Add at least one recipient.');
    if (to.concat(cc, bcc).some(x => !okAddr(x))) throw err(400, 'to', 'One of the email addresses looks wrong.');
    const att = (Array.isArray(b.attachments) ? b.attachments : []).slice(0, 10).map(a => ({ name: clean(a.name, 120), type: clean(a.type, 80) || 'application/octet-stream', data: String(a.data || '') }));
    if (att.reduce((n, a) => n + a.data.length * 0.75, 0) > 3.2 * 1024 * 1024) throw err(413, 'size', 'Attachments are too big (3 MB in total).');
    const r = await MAIL.send({ acct: acct(b.acct), to, cc, bcc, subject: clean(b.subject, 300), html: typeof b.html === 'string' ? b.html.slice(0, 200000) : undefined, text: cleanML(b.text, 100000), inReplyTo: clean(b.inReplyTo, 300) || undefined, references: (Array.isArray(b.references) ? b.references : []).slice(-20).map(x => clean(x, 300)), attachments: att });
    await log('Sent email', MAIL.ACCOUNTS[b.acct].email + ' → ' + to.join(', ') + ' · ' + clean(b.subject, 80));
    return r;
  };

  return async function handler(req, res) {
    const u = new URL(req.url, 'http://x'), q = Object.fromEntries(u.searchParams.entries()), route = q.route || '';
    try {
      const fn = R[route]; if (!fn) throw err(404, 'route', 'Not found.');
      const isGet = ['me', 'list', 'shop-orders', 'pulse', 'push-key', 'inbox', 'activity', 'site-status', 'site-draft', 'site-versions', 'site-version', 'web-analytics', 'mail-accounts', 'mail-unread', 'mail-folders', 'mail-list', 'mail-read', 'mail-att', 'pf-list', 'dl', 'notify-prefs', 'subs', 'camps', 'settings-get', 'reviews', 'reviews-public', 'backup'].includes(route);
      if (isGet ? req.method !== 'GET' : req.method !== 'POST') throw err(405, 'method', 'Method not allowed.');
      if (!isGet && route !== 'pf-upload' && !(route === 'sub-unsub' && q.k) && !sec.sameOrigin(req)) throw err(403, 'origin', 'Blocked.');
      const out = await fn(req, q);
      if (out && out.__stream) return DL.stream(res, out.__stream);
      if (out && out.__binary) { res.statusCode = 200; res.setHeader('Content-Type', out.type || 'application/octet-stream'); res.setHeader('Content-Disposition', 'attachment; filename="' + String(out.name || 'file').replace(/[^\w.\- ]+/g, '_') + '"'); res.setHeader('Cache-Control', 'private, no-store'); res.setHeader('X-Content-Type-Options', 'nosniff'); return res.end(out.__binary); }
      if (Array.isArray(out)) return send(res, 200, out[0], out[1]);
      return send(res, 200, out);
    } catch (e) {
      const code = e && e.status ? e.status : 500;
      if (!e.status) console.error('[hq]', route, e);
      if (route === 'dl') { res.statusCode = code; res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.setHeader('Cache-Control', 'no-store'); return res.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Download</title><body style="font-family:system-ui;max-width:560px;margin:3rem auto;padding:0 1rem;line-height:1.5"><h2>We couldn’t start the download</h2><p>' + String(e.status ? e.message : 'Something went wrong. Please try again.').replace(/[<>&]/g, '') + '</p><p><a href="javascript:history.back()">Back to your downloads</a></p>'); }
      return send(res, code, { ok: false, code: e.code || 'error', error: e.status ? e.message : 'Something went wrong. Please try again.' });
    }
  };
}
module.exports = { createHandler, SHOP_STATUSES };
