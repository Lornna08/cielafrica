/* Ciel Domains — run with: node --test tests/ */
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');

process.env.ADMIN_PASSWORD = 'test-admin-pass-123';
process.env.DOMAINS_SECRET = 'test-secret';
process.env.PAYSTACK_SECRET_KEY = 'sk_test_x';
delete process.env.RESEND_API_KEY;

const { MemoryStore } = require('../lib/domains/store');
const { parseQuery, validateDomain } = require('../lib/domains/normalize');
const { suggest, isMark } = require('../lib/domains/suggest');
const { quote } = require('../lib/domains/pricing');
const { merge, saveConfig, getConfig } = require('../lib/domains/config');
const { makeChecker, rdapProvider, _memCache } = require('../lib/domains/availability');
const { createHandler } = require('../lib/domains/handler');
const { normalizePhone } = require('../lib/domains/payments');
const sec = require('../lib/domains/security');

const TLDS = merge(null).tlds.map(t => t.tld);
const cfg0 = merge(null);
const T = tld => cfg0.tlds.find(t => t.tld === tld);

/* ---------- fakes ---------- */
function rdapFake(map) { // map: domain → status code | 'throw' | 'timeout'
  const calls = [];
  const f = async (url) => {
    const d = decodeURIComponent(url.split('/domain/')[1]);
    calls.push(d);
    const v = map[d] !== undefined ? map[d] : 404;
    if (v === 'throw') throw new TypeError('fetch failed');
    if (v === 'timeout') { const e = new Error('t'); e.name = 'TimeoutError'; throw e; }
    if (v === 'reserved') return { status: 200, json: async () => ({ objectClassName: 'domain', status: ['server hold', 'reserved'] }) };
    return { status: v, json: async () => (v === 200 ? { objectClassName: 'domain', ldhName: d, status: ['active'], events: [{ eventAction: 'expiration', eventDate: '2030-01-01T00:00:00Z' }] } : { errorCode: v }) };
  };
  f.calls = calls; return f;
}
function dnsFake(registered) {
  return { async check(d) { return registered.includes(d) ? { state: 'registered', detail: 'has live nameservers' } : { state: 'unknown', detail: 'no nameservers' }; } };
}
function mailFake() {
  const sent = [];
  return { sent, async notifyCustomer(kind, o) { sent.push({ to: 'customer', kind, ref: o.ref, status: o.status }); return { ok: true }; }, async notifyTeam(subject, o) { sent.push({ to: 'team', subject, ref: o.ref }); return { ok: true }; } };
}
function mpesaFake() {
  const st = { n: 0, results: {} };
  return { st, async stkPush({ amount }) { st.n++; const id = 'ws_CO_' + st.n; st.results[id] = st.next || 'paid'; st.lastAmount = amount; return { ok: true, checkoutRequestID: id }; }, async query(id) { return { status: st.results[id] || 'pending', desc: 'x' }; } };
}
function paystackFake() {
  const st = { verify: {}, refunds: [] };
  return {
    st,
    async initialize({ reference, amount }) { st.verify[reference] = { status: 'paid', amount, currency: 'KES' }; return { ok: true, url: 'https://checkout.paystack.com/abc', reference }; },
    async verify(ref) { return st.verify[ref] || { status: 'pending' }; },
    async refund({ reference, amount }) { st.refunds.push({ reference, amount }); return { ok: true, id: 777, status: 'pending' }; },
    verifySignature(raw, sig) { return sig === crypto.createHmac('sha512', 'sk_test_x').update(raw).digest('hex'); }
  };
}

function rig(opts) {
  opts = opts || {};
  _memCache.clear();
  const store = new MemoryStore(); store.durable = opts.durable !== false;
  const fetchImpl = rdapFake(opts.rdap || {});
  const checker = makeChecker({ store, rdap: rdapProvider(fetchImpl), dns: dnsFake(opts.dnsRegistered || []) });
  const mail = mailFake(), mpesa = mpesaFake(), paystack = paystackFake();
  const h = createHandler({ store, checker, email: mail, mpesa, paystack, mpesaConfigured: true, cardConfigured: opts.card !== false });
  let cookie = '';
  async function call(method, route, body, o) {
    o = o || {};
    const raw = body === undefined ? '' : (typeof body === 'string' ? body : JSON.stringify(body));
    const req = { method, url: '/api/domains?route=' + route + (o.qs ? '&' + o.qs : ''), headers: Object.assign({ host: 'cielafrica.com', origin: 'https://cielafrica.com', 'x-real-ip': o.ip || '10.0.0.1', cookie: o.noCookie ? '' : cookie }, o.headers || {}), rawBody: raw };
    const res = { statusCode: 200, headers: {}, body: '', setHeader(k, v) { this.headers[k.toLowerCase()] = v; }, end(b) { this.body = b || ''; } };
    await h(req, res);
    if (res.headers['set-cookie']) cookie = String(res.headers['set-cookie']).split(';')[0];
    let json = null; try { json = JSON.parse(res.body); } catch (e) { json = null; }
    return { status: res.statusCode, json, text: res.body, headers: res.headers };
  }
  return { store, call, mail, mpesa, paystack, fetchImpl };
}
const idem = () => crypto.randomBytes(12).toString('hex');
const cust = { name: 'Amina Otieno', email: 'amina@example.com', phone: '0712345678', address: 'P.O. Box 123', city: 'Nairobi', country: 'Kenya' };
async function openShop(r) { await saveConfig(r.store, { settings: { orderingEnabled: true } }); await getConfig(r.store, true); }

/* ---------- input ---------- */
test('parses names, domains, urls and rejects bad input', () => {
  assert.deepEqual(parseQuery('BrightStudio.com', TLDS).name, 'brightstudio');
  assert.equal(parseQuery('https://www.brightstudio.co.ke/about?x=1', TLDS).tld, 'co.ke');
  assert.equal(parseQuery('brightstudio.ke', TLDS).tld, 'ke');
  assert.equal(parseQuery('Bright Studio Ltd', TLDS).name, 'brightstudio');
  assert.equal(parseQuery('hello@zuri.africa', TLDS).name, 'zuri');
  assert.equal(parseQuery('x.zz', TLDS).unsupportedTld, 'zz');
  assert.equal(parseQuery('', TLDS).ok, false);
  assert.equal(parseQuery('café.com', TLDS).code, 'idn');
  assert.equal(parseQuery('a'.repeat(64) + '.com', TLDS).code, 'label_long');
  assert.equal(parseQuery('ab--cd.com', TLDS).name, 'ab-cd');
  assert.equal(validateDomain('xn--caf-dma.com', TLDS).ok, false);
  assert.equal(validateDomain('-x.com', TLDS).ok, false);
  assert.equal(validateDomain('good.co.ke', TLDS).tld, 'co.ke');
  assert.equal(validateDomain('good.example', TLDS).ok, false);
  assert.equal(validateDomain('a.b.com', TLDS).ok, false);
});

/* ---------- suggestions ---------- */
test('suggestions: grouped, deduped, limited, industry aware, no brand look-alikes', () => {
  const en = cfg0.tlds.filter(t => t.enabled).map(t => t.tld);
  const s = suggest({ name: 'brightstudio', tld: 'com', enabledTlds: en });
  const all = s.groups.flatMap(g => g.items.map(i => i.domain));
  assert.ok(all.length >= 8 && all.length <= 15, 'count ' + all.length);
  assert.equal(new Set(all).size, all.length);
  assert.ok(!all.includes('brightstudio.com'));
  assert.ok(all.includes('brightstudio.co.ke') && all.includes('brightstudio.africa'));
  assert.ok(all.every(d => !/\d/.test(d)));
  assert.ok(all.every(d => en.includes(d.slice(d.indexOf('.') + 1))), 'only enabled extensions');
  const tech = suggest({ name: 'kilele', tld: 'com', industry: 'tech', enabledTlds: en });
  assert.equal(tech.groups[0].items[0].domain, 'kilele.dev');
  assert.ok(suggest({ name: 'safaricomdeals', enabledTlds: en }).blocked);
  assert.ok(isMark('equitybank') && !isMark('equityhomes') && !isMark('boltworks'));
});

/* ---------- pricing ---------- */
test('pricing: first year + renewals, tax included/added, verification reasons', () => {
  const s = { currency: 'KES', taxRate: 0, pricesIncludeTax: true };
  const q = quote(T('com'), 3, s, 'brightstudio');
  assert.equal(q.total, 1850 + 2050 * 2);
  assert.equal(q.verifyBeforePayment, false);
  const v = quote(T('com'), 1, { currency: 'KES', taxRate: 0.16, pricesIncludeTax: false }, 'x1x');
  assert.equal(v.tax, Math.round(1850 * 0.16)); assert.equal(v.total, 1850 + v.tax);
  const inc = quote(T('com'), 1, { currency: 'KES', taxRate: 0.16, pricesIncludeTax: true }, 'abcde');
  assert.equal(inc.total, 1850); assert.equal(inc.tax, Math.round(1850 - 1850 / 1.16));
  assert.equal(quote(T('ai'), 1, s, 'abc').ok, false, '.ai min 2 years');
  assert.equal(quote(T('online'), 1, s, 'abc').verifyBeforePayment, false, 'no review step: pay directly');
  assert.equal(quote(T('tech'), 1, s, 'brightstudio').ok, false, 'unpriced extensions are off');
  assert.equal(quote(T('co'), 1, s, 'brightstudio').ok, false, 'dns-only extensions are off');
  // every enabled extension has a price and is payable straight away
  merge(null).tlds.filter(t => t.enabled).forEach(t => { assert.ok(t.register > 0 && t.renew > 0, t.tld); assert.equal(t.verifyBeforePayment, false, t.tld); assert.equal(t.method, 'rdap', t.tld); });
});

/* ---------- availability states ---------- */
test('availability: every state, DNS override, outage handling, cache', async () => {
  _memCache.clear();
  const store = new MemoryStore();
  const f = rdapFake({ 'taken.com': 200, 'down.com': 'throw', 'slow.com': 'timeout', 'limited.com': 429, 'odd.com': 400, 'held.com': 'reserved', 'ghost.com': 404 });
  const c = makeChecker({ store, rdap: rdapProvider(f), dns: dnsFake(['ghost.com', 'used.co']) });
  const st = async (d, t) => (await c.checkOne(d, T(t || 'com'), { fresh: true })).state;
  assert.equal(await st('free.com'), 'available');
  assert.equal(await st('taken.com'), 'registered');
  assert.equal(await st('down.com'), 'temporarily_unavailable');
  assert.equal(await st('slow.com'), 'temporarily_unavailable');
  assert.equal(await st('limited.com'), 'temporarily_unavailable');
  assert.equal(await st('odd.com'), 'unknown');
  assert.equal(await st('held.com'), 'reserved');
  assert.equal(await st('ghost.com'), 'registered', 'DNS nameservers beat an RDAP 404');
  assert.equal(await st('used.co', 'co'), 'registered');
  const unk = await c.checkOne('fresh.co', T('co'), { fresh: true });
  assert.equal(unk.state, 'unknown'); assert.equal(unk.needsConfirmation, true, 'never shown as available');
  const free = await c.checkOne('free.com', T('com'));
  assert.equal(free.preliminary, true);
  const n = f.calls.length; await c.checkOne('free.com', T('com')); assert.equal(f.calls.length, n, 'cached');
});

/* ---------- search api ---------- */
test('search API returns primary + grouped ideas; check API validates', async () => {
  const r = rig({ rdap: { 'brightstudio.com': 200 } });
  const s = await r.call('POST', 'search', { q: 'brightstudio.com' });
  assert.equal(s.status, 200);
  assert.equal(s.json.primary.state, 'registered');
  assert.ok(s.json.groups.length >= 2);
  const ds = s.json.groups.flatMap(g => g.items.map(i => i.domain)).slice(0, 10);
  const c = await r.call('POST', 'check', { domains: ds.concat(['bad..com']) });
  assert.equal(c.json.results.length, ds.length);
  assert.ok(c.json.results.every(x => ['available', 'registered', 'unknown', 'temporarily_unavailable', 'reserved'].includes(x.state)));
  const bad = await r.call('POST', 'search', { q: '   ' });
  assert.equal(bad.status, 400);
});

test('rate limiting kicks in', async () => {
  const r = rig();
  let last;
  for (let i = 0; i < 32; i++) last = await r.call('POST', 'search', { q: 'name' + i }, { ip: '9.9.9.9' });
  assert.equal(last.status, 429);
});

/* ---------- orders ---------- */
test('orders go straight to payment; sales paused in the admin blocks new orders', async () => {
  const r = rig();
  const o = await r.call('POST', 'order', { domain: 'kilele.co.ke', years: 1, customer: cust, agree: true, idemKey: idem() });
  assert.equal(o.status, 201); assert.equal(o.json.status, 'pending_payment');
  await saveConfig(r.store, { settings: { orderingEnabled: false } }); await getConfig(r.store, true);
  const c = await r.call('POST', 'order', { domain: 'kilele2.co.ke', years: 1, customer: cust, agree: true, idemKey: idem() });
  assert.equal(c.status, 503); assert.equal(c.json.code, 'closed');
  await saveConfig(r.store, { settings: { orderingEnabled: true } }); await getConfig(r.store, true);
});

test('registry not answering → no order is taken (never sold unchecked)', async () => {
  const r = rig({ rdap: { 'flaky.com': 'timeout' } });
  const o = await r.call('POST', 'order', { domain: 'flaky.com', years: 1, customer: cust, agree: true, idemKey: idem() });
  assert.equal(o.status, 503); assert.equal(o.json.code, 'check');
});

test('no database → token checkout: STK push, server-side confirmation, emails', async () => {
  const r = rig({ durable: false });
  const o = await r.call('POST', 'order', { domain: 'kilele.co.ke', years: 2, customer: cust, agree: true, idemKey: idem() });
  assert.equal(o.status, 201); assert.ok(o.json.token); assert.equal(o.json.amount, 1700 + 1900);
  assert.ok(r.mail.sent.some(m => m.to === 'team'), 'team gets the order details');
  // tampered token is rejected
  const bad = o.json.token.replace(/^./, c => c === 'e' ? 'f' : 'e');
  assert.equal((await r.call('POST', 'pay', { token: bad, phone: '0712345678' })).status, 400);
  const p = await r.call('POST', 'pay', { token: o.json.token, phone: '0712345678' });
  assert.equal(p.status, 200); assert.equal(r.mpesa.st.lastAmount, 3600);
  assert.equal((await r.call('POST', 'status', { token: o.json.token, crid: p.json.crid, at: 'forged' })).status, 400);
  const st = await r.call('POST', 'status', { token: o.json.token, crid: p.json.crid, at: p.json.at });
  assert.equal(st.json.status, 'paid');
  await r.call('POST', 'status', { token: o.json.token, crid: p.json.crid, at: p.json.at });
  assert.equal(r.mail.sent.filter(m => m.kind === 'payment_confirmed').length, 1, 'one customer email');
  assert.equal(r.mail.sent.filter(m => m.to === 'team' && /PAID/.test(m.subject)).length, 1, 'one PAID email');
  // a cancelled payment is not confirmed
  r.mpesa.st.next = 'failed';
  const p2 = await r.call('POST', 'pay', { token: o.json.token, phone: '0712345678' });
  assert.equal((await r.call('POST', 'status', { token: o.json.token, crid: p2.json.crid, at: p2.json.at })).json.status, 'failed');
});

test('search without an extension flags it so taken .com is not shown as the headline', async () => {
  const r = rig({ rdap: { 'brandhouse.com': 200 } });
  const s = await r.call('POST', 'search', { q: 'brand house' });
  assert.equal(s.json.query.explicitTld, false);
  assert.ok(s.json.groups[0].items.length >= 6, 'wide list of extensions');
  const e = await r.call('POST', 'search', { q: 'brandhouse.com' });
  assert.equal(e.json.query.explicitTld, true);
});

test('validation, terms, taken-on-recheck, duplicate submit', async () => {
  const r = rig({ rdap: { 'gone.com': 200 } }); await openShop(r);
  const base = { domain: 'kilele.com', years: 1, customer: cust, agree: true };
  assert.equal((await r.call('POST', 'order', Object.assign({}, base, { agree: false, idemKey: idem() }))).json.code, 'terms');
  assert.equal((await r.call('POST', 'order', Object.assign({}, base, { customer: Object.assign({}, cust, { email: 'nope' }), idemKey: idem() }))).json.code, 'email');
  assert.equal((await r.call('POST', 'order', Object.assign({}, base, { years: 4, idemKey: idem() }))).json.code, 'years');
  assert.equal((await r.call('POST', 'order', Object.assign({}, base, { domain: 'gone.com', idemKey: idem() }))).status, 409);
  const key = idem();
  const a = await r.call('POST', 'order', Object.assign({}, base, { idemKey: key }));
  const b = await r.call('POST', 'order', Object.assign({}, base, { idemKey: key }));
  assert.equal(a.json.ref, b.json.ref); assert.equal(b.json.duplicate, true);
  assert.equal((await r.call('POST', 'order', Object.assign({}, base, { idemKey: idem() }), { headers: { origin: 'https://evil.example' } })).status, 403);
});

async function paidOrder(r, domain, method) {
  await openShop(r);
  const o = await r.call('POST', 'order', { domain: domain || 'kilele.com', years: 2, customer: cust, agree: true, idemKey: idem() });
  assert.equal(o.json.status, 'pending_payment');
  const k = new URL('https://x' + o.json.link).searchParams.get('k');
  const p = await r.call('POST', 'pay', { ref: o.json.ref, k, method: method || 'mpesa', phone: '0712345678' });
  assert.equal(p.status, 200, JSON.stringify(p.json));
  return { ref: o.json.ref, k };
}

test('M-Pesa: success confirmed server-side, duplicate callbacks are harmless', async () => {
  const r = rig();
  const { ref, k } = await paidOrder(r);
  assert.equal(r.mpesa.st.lastAmount, 1850 + 2050, 'charged the quoted 2-year total');
  // a forged callback (bad token) is ignored
  await r.call('POST', 'mpesa-callback', { Body: { stkCallback: { CheckoutRequestID: 'ws_CO_1', ResultCode: 0 } } }, { qs: 'o=' + ref + '&t=forged' });
  let v = (await r.store.get('dc:order:' + ref)); assert.equal(v.payment.status, 'pending');
  // a real callback + duplicates
  const cb = { Body: { stkCallback: { CheckoutRequestID: 'ws_CO_1', ResultCode: 0, CallbackMetadata: { Item: [{ Name: 'Amount', Value: 3900 }, { Name: 'MpesaReceiptNumber', Value: 'SJK3XY12AB' }] } } } };
  const t = sec.sign('mpesa|' + ref);
  for (let i = 0; i < 3; i++) { const x = await r.call('POST', 'mpesa-callback', cb, { qs: 'o=' + ref + '&t=' + t }); assert.equal(x.json.ResultCode, 0); }
  v = await r.store.get('dc:order:' + ref);
  assert.equal(v.payment.status, 'paid'); assert.equal(v.status, 'pending_registration'); assert.equal(v.payment.receipt, 'SJK3XY12AB');
  assert.equal(r.mail.sent.filter(m => m.kind === 'payment_confirmed').length, 1, 'one confirmation email');
  const view = await r.call('GET', 'order', undefined, { qs: 'ref=' + ref + '&k=' + k });
  assert.equal(view.json.order.statusLabel, 'Payment received');
  assert.equal(view.json.order.customer.phone.includes('•••'), true, 'phone masked');
  assert.equal((await r.call('GET', 'order', undefined, { qs: 'ref=' + ref + '&k=wrong' })).status, 404);
});

test('M-Pesa: cancelled payment stays unpaid; returning to the page does not mark paid', async () => {
  const r = rig(); await openShop(r);
  r.mpesa.st.next = 'failed';
  const o = await r.call('POST', 'order', { domain: 'kilele.com', years: 1, customer: cust, agree: true, idemKey: idem() });
  const k = new URL('https://x' + o.json.link).searchParams.get('k');
  await r.call('POST', 'pay', { ref: o.json.ref, k, method: 'mpesa', phone: '0712345678' });
  const x = await r.store.get('dc:order:' + o.json.ref); x.payment.attempts[0].startedAt = new Date(Date.now() - 10000).toISOString(); await r.store.set('dc:order:' + o.json.ref, x);
  const v = await r.call('GET', 'order', undefined, { qs: 'ref=' + o.json.ref + '&k=' + k });
  assert.equal(v.json.order.payment.status, 'failed'); assert.equal(v.json.order.status, 'pending_payment');
});

test('M-Pesa: pending payment stays pending; second pay click reuses attempt', async () => {
  const r = rig(); await openShop(r);
  r.mpesa.st.next = 'pending';
  const o = await r.call('POST', 'order', { domain: 'kilele.com', years: 1, customer: cust, agree: true, idemKey: idem() });
  const k = new URL('https://x' + o.json.link).searchParams.get('k');
  await r.call('POST', 'pay', { ref: o.json.ref, k, method: 'mpesa', phone: '0712345678' });
  const again = await r.call('POST', 'pay', { ref: o.json.ref, k, method: 'mpesa', phone: '0712345678' });
  assert.equal(again.json.reused, true); assert.equal(r.mpesa.st.n, 1);
});

test('Card: signed webhook verified, bad signature rejected, refund via provider', async () => {
  const r = rig();
  const { ref } = await paidOrder(r, 'zurihomes.com', 'card');
  const raw = JSON.stringify({ event: 'charge.success', data: { id: 1, reference: ref + '-1' } });
  assert.equal((await r.call('POST', 'paystack-webhook', raw, { headers: { 'x-paystack-signature': 'bad' } })).status, 401);
  const sig = crypto.createHmac('sha512', 'sk_test_x').update(raw).digest('hex');
  assert.equal((await r.call('POST', 'paystack-webhook', raw, { headers: { 'x-paystack-signature': sig } })).status, 200);
  assert.equal((await r.call('POST', 'paystack-webhook', raw, { headers: { 'x-paystack-signature': sig } })).json.duplicate, true);
  let o = await r.store.get('dc:order:' + ref); assert.equal(o.payment.status, 'paid'); assert.equal(o.payment.method, 'card');
  // admin: unavailable → refund via Paystack → webhook completes it
  await r.call('POST', 'admin/login', { password: 'test-admin-pass-123' });
  await r.call('POST', 'admin/action', { ref, action: 'set_status', data: { status: 'unavailable', reason: 'taken minutes before' } });
  const rf = await r.call('POST', 'admin/action', { ref, action: 'refund_start', data: {} });
  assert.equal(rf.json.order.refund.status, 'processing', 'not claimed as refunded yet');
  assert.equal(r.paystack.st.refunds[0].amount, 1850 + 2050);
  const raw2 = JSON.stringify({ event: 'refund.processed', data: { id: 777, transaction: { reference: ref + '-1' } } });
  await r.call('POST', 'paystack-webhook', raw2, { headers: { 'x-paystack-signature': crypto.createHmac('sha512', 'sk_test_x').update(raw2).digest('hex') } });
  o = await r.store.get('dc:order:' + ref); assert.equal(o.status, 'refunded'); assert.equal(o.refund.status, 'completed');
  assert.ok(r.mail.sent.some(m => m.kind === 'refund_completed'));
});

test('Card: amount mismatch never marks paid', async () => {
  const r = rig(); await openShop(r);
  const o = await r.call('POST', 'order', { domain: 'kilele.com', years: 1, customer: cust, agree: true, idemKey: idem() });
  const k = new URL('https://x' + o.json.link).searchParams.get('k');
  await r.call('POST', 'pay', { ref: o.json.ref, k, method: 'card' });
  r.paystack.st.verify[o.json.ref + '-1'] = { status: 'paid', amount: 10, currency: 'KES' };
  const x = await r.store.get('dc:order:' + o.json.ref); x.payment.attempts[0].startedAt = new Date(Date.now() - 10000).toISOString(); await r.store.set('dc:order:' + o.json.ref, x);
  const v = await r.call('GET', 'order', undefined, { qs: 'ref=' + o.json.ref + '&k=' + k });
  assert.notEqual(v.json.order.payment.status, 'paid');
});

/* ---------- admin ---------- */
test('admin: access control, login limits, workflow guards, registration, M-Pesa refund, CSV, audit', async () => {
  const r = rig();
  assert.equal((await r.call('GET', 'admin/orders')).status, 401);
  assert.equal((await r.call('POST', 'admin/login', { password: 'wrong' })).status, 401);
  assert.equal((await r.call('POST', 'admin/login', { password: 'test-admin-pass-123' })).status, 200);
  const forged = await r.call('GET', 'admin/orders', undefined, { headers: { cookie: 'cd_admin=' + (Date.now() + 9e6) + '.abc.fake' } });
  assert.equal(forged.status, 401);
  const { ref } = await paidOrder(r);
  const t = sec.sign('mpesa|' + ref);
  await r.call('POST', 'mpesa-callback', { Body: { stkCallback: { CheckoutRequestID: 'ws_CO_1', ResultCode: 0 } } }, { qs: 'o=' + ref + '&t=' + t });
  const list = await r.call('GET', 'admin/orders', undefined, { qs: 'filter=paid' });
  assert.equal(list.json.orders.length, 1); assert.equal(list.json.orders[0].accessKey, undefined, 'no customer key in admin');
  const A = (action, data) => r.call('POST', 'admin/action', { ref, action, data });
  assert.equal((await A('set_status', { status: 'registered' })).status, 400, 'needs Truehost ref');
  assert.equal((await A('set_status', { status: 'registration_in_progress' })).status, 400, 'needs recheck first');
  assert.equal((await A('recheck')).json.order.availability.last.state, 'available');
  assert.equal((await A('set_status', { status: 'registration_in_progress', rechecked: true })).status, 200);
  assert.equal((await A('set_status', { status: 'unavailable', reason: 'registered by someone else' })).status, 200);
  assert.equal((await A('refund_complete', { providerRef: 'X' })).status, 400, 'start refund first');
  const rs = await A('refund_start', {});
  assert.equal(rs.json.order.refund.status, 'pending'); assert.equal(rs.json.order.status, 'refund_pending');
  assert.equal((await A('refund_complete', { providerRef: 'bad' })).status, 400, 'needs M-Pesa code');
  const rc = await A('refund_complete', { providerRef: 'SJK3XY12AB' });
  assert.equal(rc.json.order.status, 'refunded');
  assert.equal((await A('set_status', { status: 'registered', truehostRef: 'T1' })).status, 400, 'refunded is final');
  assert.equal((await A('note', { text: 'Customer called' })).json.order.notes.length, 1);
  const csv = await r.call('GET', 'admin/export', undefined, { qs: 'filter=all' });
  assert.match(csv.text, /^ref,createdAt/); assert.ok(csv.text.includes(ref));
  const det = await r.call('GET', 'admin/order', undefined, { qs: 'ref=' + ref });
  const acts = det.json.audit.map(a => a.action);
  ['created', 'payment_started', 'payment_confirmed', 'recheck', 'status', 'refund_started', 'refund_completed', 'note'].forEach(a => assert.ok(acts.includes(a), a));
  for (let i = 0; i < 6; i++) await r.call('POST', 'admin/login', { password: 'wrong' }, { ip: '7.7.7.7' });
  assert.equal((await r.call('POST', 'admin/login', { password: 'test-admin-pass-123' }, { ip: '7.7.7.7' })).status, 429);
});

test('admin: verify with a new price needs customer approval; alternative domain needs consent', async () => {
  const r = rig(); await saveConfig(r.store, { tlds: { com: { verifyBeforePayment: true } } }); await getConfig(r.store, true);
  const o = await r.call('POST', 'order', { domain: 'kilele.com', years: 1, customer: cust, agree: true, idemKey: idem() });
  assert.equal(o.json.status, 'awaiting_verification'); assert.equal(o.json.order.amount, 1850);
  const k = new URL('https://x' + o.json.link).searchParams.get('k');
  await r.call('POST', 'admin/login', { password: 'test-admin-pass-123' });
  const v = await r.call('POST', 'admin/action', { ref: o.json.ref, action: 'mark_verified', data: { amount: 2400 } });
  assert.equal(v.json.order.status, 'awaiting_verification'); assert.equal(v.json.order.priceChange.to, 2400);
  assert.equal((await r.call('POST', 'pay', { ref: o.json.ref, k, method: 'mpesa', phone: '0712345678' })).status, 409);
  const acc = await r.call('POST', 'respond', { ref: o.json.ref, k, action: 'accept_price' });
  assert.equal(acc.json.order.status, 'pending_payment'); assert.equal(acc.json.order.amount, 2400);
  await r.call('POST', 'pay', { ref: o.json.ref, k, method: 'mpesa', phone: '0712345678' });
  assert.equal(r.mpesa.st.lastAmount, 2400);
  await r.call('POST', 'mpesa-callback', { Body: { stkCallback: { CheckoutRequestID: 'ws_CO_1', ResultCode: 0 } } }, { qs: 'o=' + o.json.ref + '&t=' + sec.sign('mpesa|' + o.json.ref) });
  await r.call('POST', 'admin/action', { ref: o.json.ref, action: 'set_status', data: { status: 'unavailable' } });
  await r.call('POST', 'admin/action', { ref: o.json.ref, action: 'propose_alternative', data: { domain: 'kileletech.com' } });
  const alt = await r.call('POST', 'respond', { ref: o.json.ref, k, action: 'accept_alternative' });
  assert.equal(alt.json.order.domain, 'kileletech.com'); assert.equal(alt.json.order.status, 'pending_registration'); assert.equal(alt.json.order.amount, 2400);
});

test('admin: confirming a price for an on-request extension makes it payable without a price-change step', async () => {
  const r = rig(); await saveConfig(r.store, { tlds: { software: { enabled: true } } }); await getConfig(r.store, true);
  const o = await r.call('POST', 'order', { domain: 'kilele.software', years: 1, customer: cust, agree: true, idemKey: idem() });
  assert.equal(o.json.status, 'awaiting_verification'); assert.equal(o.json.order.amount, null);
  await r.call('POST', 'admin/login', { password: 'test-admin-pass-123' });
  assert.equal((await r.call('POST', 'admin/action', { ref: o.json.ref, action: 'mark_verified', data: {} })).status, 400, 'needs a price');
  const v = await r.call('POST', 'admin/action', { ref: o.json.ref, action: 'mark_verified', data: { amount: 3200 } });
  assert.equal(v.json.order.status, 'pending_payment'); assert.equal(v.json.order.amount, 3200); assert.equal(v.json.order.priceChange, undefined);
  assert.ok(r.mail.sent.some(m => m.kind === 'verified' && m.ref === o.json.ref));
});

test('admin: pricing config is validated and applied', async () => {
  const r = rig();
  await r.call('POST', 'admin/login', { password: 'test-admin-pass-123' });
  const c = await r.call('POST', 'admin/config', { patch: { tlds: { com: { register: 1500, renew: '2000', enabled: true }, nope: { register: 1 } }, settings: { taxRate: 0.16, pricesIncludeTax: false } } });
  const com = c.json.config.tlds.find(t => t.tld === 'com');
  assert.equal(com.register, 1500); assert.equal(com.renew, 2000);
  assert.equal(c.json.config.settings.taxRate, 0.16);
  const pub = await r.call('GET', 'config');
  assert.equal(pub.json.tlds.find(t => t.tld === 'com').register, 1500);
  assert.ok(!pub.json.tlds.some(t => t.tld === 'studio'), 'disabled hidden');
  const bad = await r.call('POST', 'admin/config', { patch: { settings: { taxRate: 5 } } });
  assert.equal(bad.json.config.settings.taxRate, 0.16, 'invalid tax ignored');
});

test('data retention purge removes only old unpaid orders', async () => {
  const r = rig(); await openShop(r);
  const a = await r.call('POST', 'order', { domain: 'oldone.com', years: 1, customer: cust, agree: true, idemKey: idem() });
  const { ref } = await paidOrder(r, 'paidone.com');
  for (const x of [a.json.ref, ref]) { const o = await r.store.get('dc:order:' + x); o.createdAt = new Date(Date.now() - 40 * 86400000).toISOString(); await r.store.set('dc:order:' + x, o); }
  await r.call('POST', 'admin/login', { password: 'test-admin-pass-123' });
  const p = await r.call('POST', 'admin/purge', {});
  assert.equal(p.json.deleted, 1);
  assert.equal(await r.store.get('dc:order:' + a.json.ref), null);
  assert.ok(await r.store.get('dc:order:' + ref));
});

test('helpers', () => {
  assert.equal(normalizePhone('0712 345 678'), '254712345678');
  assert.equal(normalizePhone('+254 110 000 000'), '254110000000');
  assert.equal(normalizePhone('12345'), null);
  assert.match(sec.orderRef(), /^CD-[0-9A-HJKMNP-TV-Z]{8}$/);
});
