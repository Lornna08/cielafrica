/* ============================================================
   CIEL DOMAINS — HTTP router behind /api/domains/*
   (vercel.json rewrites /api/domains/<route> → /api/domains?route=<route>)
   ============================================================ */
const { getStore } = require('./store');
const { getConfig, saveConfig, publicConfig, findTld } = require('./config');
const { parseQuery, validateDomain } = require('./normalize');
const { suggest, INDUSTRIES } = require('./suggest');
const { makeChecker } = require('./availability');
const { quote } = require('./pricing');
const payments = require('./payments');
const email = require('./email');
const sec = require('./security');
const { makeOrders, LABELS, FILTERS } = require('./orders');
const { getRegistrar } = require('./registrar');

function createHandler(deps) {
  deps = deps || {};
  const store = () => deps.store || getStore();
  let checkerMemo = null;
  const checker = () => deps.checker || (checkerMemo = checkerMemo || makeChecker({ store: store(), fetch: deps.fetch, resolver: deps.resolver }));
  const mp = deps.mpesa || payments.mpesa(deps.fetch);
  const ps = deps.paystack || payments.paystack(deps.fetch);
  const mail = deps.email || email;
  const orders = () => makeOrders({ store: store(), checker: checker(), email: mail, mpesa: mp, paystack: ps, now: deps.now, baseUrl: deps.baseUrl });
  const mpesaOn = () => deps.mpesaConfigured != null ? deps.mpesaConfigured : payments.mpesaConfigured();
  const cardOn = () => deps.cardConfigured != null ? deps.cardConfigured : payments.cardConfigured();

  async function ctxFor(req) {
    const s = store(), cfg = await getConfig(s);
    const durable = !!s.durable, hasSecret = !!sec.secret();
    return {
      cfg, durable, ip: sec.clientIp(req),
      ordering: !!(cfg.settings.orderingEnabled && durable && hasSecret),
      mpesa: !!(mpesaOn() && cfg.settings.paymentMethods.mpesa),
      card: !!(cardOn() && cfg.settings.paymentMethods.card),
      caps: { durable, mpesa: mpesaOn(), card: cardOn(), email: !!process.env.RESEND_API_KEY, secret: hasSecret, adminPassword: !!process.env.ADMIN_PASSWORD }
    };
  }

  const send = (res, code, obj, headers) => {
    res.statusCode = code;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    Object.entries(headers || {}).forEach(([k, v]) => res.setHeader(k, v));
    res.end(JSON.stringify(obj));
  };
  const fail = (res, e) => {
    const code = e && e.status ? e.status : 500;
    if (code >= 500) console.error('[domains]', e && e.code, e && e.message);
    send(res, code, { ok: false, code: (e && e.code) || 'error', error: code >= 500 && !(e && e.status) ? 'Something went wrong on our side. Please try again.' : e.message });
  };
  const limited = res => send(res, 429, { ok: false, code: 'rate', error: 'Too many requests — please wait a minute and try again.' });

  async function readRaw(req) {
    if (typeof req.rawBody === 'string') return req.rawBody;
    if (req.readableEnded || req.complete && !req.readable) return req.body ? (typeof req.body === 'string' ? req.body : JSON.stringify(req.body)) : '';
    let raw = '', size = 0;
    await new Promise((ok, no) => {
      req.on('data', c => { size += c.length; if (size > 64 * 1024) { no(Object.assign(new Error('Request too large.'), { status: 413, code: 'size' })); req.destroy(); } else raw += c; });
      req.on('end', ok); req.on('error', no);
    });
    return raw;
  }
  async function readJson(req) {
    const raw = await readRaw(req);
    if (!raw) return {};
    try { const j = JSON.parse(raw); return j && typeof j === 'object' ? j : {}; } catch (e) { throw Object.assign(new Error('Invalid JSON.'), { status: 400, code: 'json' }); }
  }

  /* ---------- public routes ---------- */
  async function search(req, res, ctx) {
    if (!(await sec.rateLimit(store(), 'search', ctx.ip, 30, 60))) return limited(res);
    const b = await readJson(req);
    const enabled = ctx.cfg.tlds.filter(t => t.enabled);
    const p = parseQuery(String(b.q || ''), ctx.cfg.tlds.map(t => t.tld));
    if (!p.ok) return send(res, 400, { ok: false, code: p.code, error: p.message });
    const industry = INDUSTRIES[b.industry] ? b.industry : null;
    let tld = p.tld && enabled.find(t => t.tld === p.tld) ? p.tld : null;
    const notes = [];
    if (p.unsupportedTld) notes.push(`We don’t offer .${p.unsupportedTld} yet — here’s “${p.name}” on the extensions we do.`);
    if (p.tld && !tld) notes.push(`.${p.tld} isn’t available to order right now — here are other options.`);
    if (!tld) tld = (industry && INDUSTRIES[industry].tlds.find(t => enabled.some(e => e.tld === t))) || 'com';
    const t = findTld(ctx.cfg, tld);
    const primary = await checker().checkOne(p.name + '.' + tld, t);
    const s = suggest({ name: p.name, words: p.words, tld, industry, enabledTlds: enabled.map(e => e.tld) });
    if (s.blocked) notes.push(s.note);
    const price = (domain, tt, label) => { const q = quote(tt, tt.periods[0], ctx.cfg.settings, label); return q.ok ? { years: q.years, firstYear: q.firstYear, renewal: q.renewal, total: q.total, verifyBeforePayment: q.verifyBeforePayment } : null; };
    const pr = Object.assign({}, primary, { price: price(primary.domain, t, p.name) });
    const groups = s.groups.map(g => ({ id: g.id, title: g.title, items: g.items.map(i => Object.assign({}, i, { price: price(i.domain, findTld(ctx.cfg, i.tld), i.label) })) }));
    return send(res, 200, { ok: true, query: { name: p.name, tld, words: s.words || null, industry }, primary: pr, groups, notes, blocked: !!s.blocked });
  }

  async function check(req, res, ctx) {
    const b = await readJson(req);
    const list = Array.isArray(b.domains) ? b.domains.slice(0, 10) : [];
    if (!list.length) return send(res, 400, { ok: false, code: 'empty', error: 'No domains to check.' });
    if (!(await sec.rateLimit(store(), 'check', ctx.ip, 150, 60))) return limited(res);
    const tlds = ctx.cfg.tlds.filter(t => t.enabled).map(t => t.tld);
    const items = [];
    const bad = [];
    list.forEach(d => { const v = validateDomain(String(d), tlds); if (v.ok) items.push({ domain: v.domain, t: findTld(ctx.cfg, v.tld) }); else bad.push({ domain: String(d).slice(0, 80), error: v.message }); });
    const results = await checker().checkMany(items, { fresh: b.fresh === true });
    return send(res, 200, { ok: true, results, invalid: bad });
  }

  async function quoteRoute(req, res, ctx) {
    const b = await readJson(req);
    const v = validateDomain(String(b.domain || ''), ctx.cfg.tlds.filter(t => t.enabled).map(t => t.tld));
    if (!v.ok) return send(res, 400, { ok: false, code: v.code, error: v.message });
    const t = findTld(ctx.cfg, v.tld);
    const years = Number(b.years) || t.periods[0];
    const q = quote(t, years, ctx.cfg.settings, v.label);
    if (!q.ok) return send(res, 400, { ok: false, code: q.code, error: q.message });
    let fresh = null;
    if (b.recheck) { if (!(await sec.rateLimit(store(), 'check', ctx.ip, 150, 60))) return limited(res); fresh = await checker().checkOne(v.domain, t, { fresh: true }); }
    return send(res, 200, { ok: true, domain: v.domain, quote: q, availability: fresh, ordering: ctx.ordering, payments: { mpesa: ctx.mpesa, card: ctx.card } });
  }

  async function createOrder(req, res, ctx) {
    if (!sec.sameOrigin(req)) return send(res, 403, { ok: false, code: 'origin', error: 'Request blocked.' });
    if (!(await sec.rateLimit(store(), 'order', ctx.ip, 8, 3600))) return limited(res);
    const b = await readJson(req);
    if (b.website) return send(res, 200, { ok: true, ref: 'CD-00000000' }); // honeypot
    if (!ctx.durable) return requestOnly(res, ctx, b);
    const r = await orders().create(b, ctx);
    const link = '/domains/order?ref=' + r.order.ref + '&k=' + encodeURIComponent(r.key);
    return send(res, r.duplicate ? 200 : 201, { ok: true, ref: r.order.ref, link, status: r.order.status, duplicate: r.duplicate, order: orders().publicView(r.order) });
  }

  /** no database yet: email the request so nothing is lost; nothing is charged */
  async function requestOnly(res, ctx, b) {
    const v = validateDomain(String(b.domain || ''), ctx.cfg.tlds.filter(t => t.enabled).map(t => t.tld));
    if (!v.ok) return send(res, 400, { ok: false, code: v.code, error: v.message });
    const c = b.customer || {};
    if (!c.name || !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(String(c.email || '')) || !c.phone) return send(res, 400, { ok: false, code: 'details', error: 'Add your name, email and phone so we can confirm the domain with you.' });
    if (b.agree !== true) return send(res, 400, { ok: false, code: 'terms', error: 'Please accept the registration and refund terms.' });
    const ref = sec.orderRef();
    const t = findTld(ctx.cfg, v.tld), q = quote(t, Number(b.years) || t.periods[0], ctx.cfg.settings, v.label);
    const o = { ref, domain: v.domain, years: q.ok ? q.years : 1, amount: q.ok ? q.total : null, currency: 'KES', status: 'request', payment: { status: 'unpaid' }, customer: { name: String(c.name).slice(0, 80), email: String(c.email).slice(0, 120), phone: String(c.phone).slice(0, 20) } };
    const sent = await mail.notifyTeam('Domain request (no database yet): ' + v.domain, o, [['Address', String(c.address || '') + ', ' + String(c.city || '') + ', ' + String(c.country || '')], ['Organisation', String(c.organisation || '')], ['Note', 'Orders database not configured — reply to the customer by email/WhatsApp.']]);
    if (!sent || !sent.ok) return send(res, 503, { ok: false, code: 'unavailable', error: 'We couldn’t send your request right now. Please WhatsApp us on +254 706 549 703.' });
    await mail.notifyCustomer('received_verify', o, (process.env.DOMAINS_BASE_URL || 'https://cielafrica.com') + '/domains');
    return send(res, 202, { ok: true, ref, requestOnly: true });
  }

  async function getOrder(req, res, ctx, q) {
    if (!(await sec.rateLimit(store(), 'view', ctx.ip, 90, 60))) return limited(res);
    const o = await orders().forCustomer(String(q.ref || ''), String(q.k || ''));
    const cur = (await orders().refresh(o)) || o;
    return send(res, 200, { ok: true, order: orders().publicView(cur), ordering: ctx.ordering, payments: { mpesa: ctx.mpesa, card: ctx.card }, support: publicConfig(ctx.cfg, ctx.caps).support });
  }

  async function pay(req, res, ctx) {
    if (!sec.sameOrigin(req)) return send(res, 403, { ok: false, code: 'origin', error: 'Request blocked.' });
    if (!(await sec.rateLimit(store(), 'pay', ctx.ip, 6, 600))) return limited(res);
    const b = await readJson(req);
    const r = await orders().startPayment(String(b.ref || ''), String(b.k || ''), { method: b.method, phone: b.phone }, ctx);
    return send(res, 200, Object.assign({ ok: true }, r));
  }

  async function respond(req, res, ctx) {
    if (!sec.sameOrigin(req)) return send(res, 403, { ok: false, code: 'origin', error: 'Request blocked.' });
    if (!(await sec.rateLimit(store(), 'respond', ctx.ip, 20, 600))) return limited(res);
    const b = await readJson(req);
    const o = await orders().customerAction(String(b.ref || ''), String(b.k || ''), String(b.action || ''));
    return send(res, 200, { ok: true, order: orders().publicView(o) });
  }

  async function mpesaCallback(req, res, ctx, q) {
    let b = {}; try { b = await readJson(req); } catch (e) { b = {}; }
    try { const r = await orders().mpesaCallback(q, b); if (!r.ok) console.warn('[domains] mpesa callback rejected:', r.reason); }
    catch (e) { console.error('[domains] mpesa callback error', e && e.message); }
    return send(res, 200, { ResultCode: 0, ResultDesc: 'Accepted' }); // always ACK so Daraja stops retrying
  }

  async function paystackWebhook(req, res) {
    const raw = await readRaw(req);
    const r = await orders().paystackWebhook(raw, req.headers['x-paystack-signature']);
    return send(res, r.ok ? 200 : (r.status || 400), { ok: r.ok, duplicate: !!r.duplicate });
  }

  /* ---------- admin ---------- */
  const requireAdmin = (req, res, mutating) => {
    if (!sec.secret() || !process.env.ADMIN_PASSWORD) { send(res, 503, { ok: false, code: 'setup', error: 'Set ADMIN_PASSWORD in Vercel to use the admin.' }); return false; }
    if (!sec.checkSession(req)) { send(res, 401, { ok: false, code: 'auth', error: 'Please sign in.' }); return false; }
    if (mutating && !sec.sameOrigin(req)) { send(res, 403, { ok: false, code: 'origin', error: 'Request blocked.' }); return false; }
    return true;
  };

  async function admin(route, req, res, ctx, q) {
    const s = store();
    if (route === 'admin/login') {
      if (req.method !== 'POST') return send(res, 405, { ok: false });
      if (!sec.sameOrigin(req)) return send(res, 403, { ok: false, code: 'origin', error: 'Request blocked.' });
      if (!process.env.ADMIN_PASSWORD || !sec.secret()) return send(res, 503, { ok: false, code: 'setup', error: 'Set ADMIN_PASSWORD in Vercel → Settings → Environment Variables, then redeploy.' });
      if (!(await sec.rateLimit(s, 'login', ctx.ip, 5, 900)) || !(await sec.rateLimit(s, 'login-all', 'all', 40, 3600))) return limited(res);
      const b = await readJson(req);
      if (!sec.checkPassword(String(b.password || ''))) { await new Promise(r => setTimeout(r, 400)); return send(res, 401, { ok: false, code: 'auth', error: 'Wrong password.' }); }
      return send(res, 200, { ok: true }, { 'Set-Cookie': sec.sessionCookie(sec.makeSession(), sec.SESSION_H * 3600) });
    }
    if (route === 'admin/logout') return send(res, 200, { ok: true }, { 'Set-Cookie': sec.sessionCookie('', 0) });
    if (route === 'admin/session') {
      const ok = !!(sec.secret() && process.env.ADMIN_PASSWORD && sec.checkSession(req));
      return send(res, 200, { ok: true, signedIn: ok, caps: ok ? ctx.caps : { adminPassword: !!process.env.ADMIN_PASSWORD }, registrar: ok ? getRegistrar().name : undefined, ordering: ok ? ctx.ordering : undefined });
    }
    const mut = req.method !== 'GET';
    if (!requireAdmin(req, res, mut)) return;
    if (!ctx.durable && route !== 'admin/config') return send(res, 503, { ok: false, code: 'store', error: 'Connect the orders database (Upstash Redis) first.' });
    const O = orders();
    if (route === 'admin/orders') {
      const list = await O.list(String(q.filter || 'all'));
      const counts = {}; const all = await O.list('all');
      Object.keys(FILTERS).forEach(k => { counts[k] = all.filter(FILTERS[k]).length; });
      return send(res, 200, { ok: true, orders: list.map(O.adminView), counts, labels: LABELS });
    }
    if (route === 'admin/order') {
      const o = await O.get(String(q.ref || '')); if (!o) return send(res, 404, { ok: false, error: 'Not found.' });
      return send(res, 200, { ok: true, order: O.adminView(o), audit: await O.auditLog(o.ref), labels: LABELS, link: O.orderLink(o) });
    }
    if (route === 'admin/action') {
      const b = await readJson(req);
      const o = await O.adminAction(String(b.ref || ''), String(b.action || ''), b.data || {}, ctx);
      return send(res, 200, { ok: true, order: O.adminView(o), audit: await O.auditLog(o.ref) });
    }
    if (route === 'admin/export') {
      const list = await O.list(String(q.filter || 'all'));
      res.statusCode = 200; res.setHeader('Content-Type', 'text/csv; charset=utf-8'); res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Content-Disposition', 'attachment; filename="ciel-domain-orders-' + new Date().toISOString().slice(0, 10) + '.csv"');
      return res.end(O.csv(list));
    }
    if (route === 'admin/config') {
      if (req.method === 'GET') return send(res, 200, { ok: true, config: ctx.cfg, caps: ctx.caps, ordering: ctx.ordering });
      if (!ctx.durable) return send(res, 503, { ok: false, code: 'store', error: 'Connect the orders database (Upstash Redis) to save settings.' });
      const b = await readJson(req);
      const cfg = await saveConfig(s, b.patch || {}, 'admin');
      return send(res, 200, { ok: true, config: cfg });
    }
    if (route === 'admin/purge') { const n = await O.purgeUnpaid(); return send(res, 200, { ok: true, deleted: n }); }
    return send(res, 404, { ok: false, error: 'Unknown admin route.' });
  }

  return async function handler(req, res) {
    const url = new URL(req.url, 'http://x');
    const q = Object.fromEntries(url.searchParams.entries());
    let route = String(q.route || url.pathname.replace(/^\/api\/domains\/?/, '')).replace(/^\/+|\/+$/g, '');
    try {
      const ctx = await ctxFor(req);
      if (route.startsWith('admin/')) return await admin(route, req, res, ctx, q);
      if (route === 'config' && req.method === 'GET') return send(res, 200, Object.assign({ ok: true }, publicConfig(ctx.cfg, ctx.caps), { ordering: ctx.ordering, payments: { mpesa: ctx.mpesa, card: ctx.card }, industries: Object.fromEntries(Object.entries(INDUSTRIES).map(([k, v]) => [k, v.label])) }));
      if (route === 'order' && req.method === 'GET') return await getOrder(req, res, ctx, q);
      if (route === 'check' && req.method === 'GET') { req.rawBody = JSON.stringify({ domains: String(q.d || '').split(',').filter(Boolean) }); return await check(req, res, ctx); }
      if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'Method not allowed.' });
      switch (route) {
        case 'search': return await search(req, res, ctx);
        case 'check': return await check(req, res, ctx);
        case 'quote': return await quoteRoute(req, res, ctx);
        case 'order': return await createOrder(req, res, ctx);
        case 'pay': return await pay(req, res, ctx);
        case 'respond': return await respond(req, res, ctx);
        case 'mpesa-callback': return await mpesaCallback(req, res, ctx, q);
        case 'paystack-webhook': return await paystackWebhook(req, res);
        default: return send(res, 404, { ok: false, error: 'Not found.' });
      }
    } catch (e) { return fail(res, e); }
  };
}

module.exports = { createHandler };
