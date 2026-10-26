'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const M = require('../src');
const { startMockDaraja, callbackBody } = require('./mock-daraja');

const SECRET = 'cb_secret_for_tests_0123456789';
const quiet = { info() {}, warn() {}, error() {} };

async function setup(t, extra = {}) {
  const mock = await startMockDaraja();
  t.after(() => mock.close());
  const orders = { A: { amount: 150, reference: 'ORD-A', description: 'Order A' }, B: { amount: 99, reference: 'ORD-B' } };
  const hooks = { paid: [], bad: [], review: [] };
  const mpesa = M.createMpesa(Object.assign({
    ...mock.config, environment: 'sandbox', publicUrl: 'https://shop.example.com', callbackSecret: SECRET,
    resolveOrder: async (id) => orders[id] || null,
    onPaid: async (p) => hooks.paid.push(p), onUnsuccessful: async (p) => hooks.bad.push(p), onReview: async (p) => hooks.review.push(p),
    logger: quiet, minQueryAgeMs: 0, queryIntervalMs: 0
  }, extra));
  return { mock, mpesa, hooks, orders };
}

test('phone numbers are normalised and validated', () => {
  const ok = { '0712345678': '254712345678', '0112 345 678': '254112345678', '+254 712-345-678': '254712345678', '712345678': '254712345678', '254110000000': '254110000000' };
  for (const [i, o] of Object.entries(ok)) assert.equal(M.normalizePhone(i), o, i);
  for (const bad of ['', '0812345678', '07123', '25471234567', 'abc', '+1 555 0100', '0712345678 9']) assert.equal(M.normalizePhone(bad), null, bad);
  assert.equal(M.maskPhone('0712345678'), '0712 *** 678');
});

test('Daraja timestamp is East Africa Time and the password matches', () => {
  assert.equal(M.darajaTimestamp(new Date('2026-10-25T21:05:09Z')), '20261026000509');
  assert.equal(M.stkPassword('174379', 'pk', '20261026000509'), Buffer.from('174379pk20261026000509').toString('base64'));
});

test('theme validation keeps good values, drops bad ones', () => {
  const { theme, problems } = M.validateTheme({ merchantName: '<b>Duka</b>', mode: 'dark', radius: 99, colors: { primary: '#abc', button: 'red' }, layout: 'split', extra: 1 });
  assert.equal(theme.merchantName, 'bDuka/b');
  assert.equal(theme.mode, 'dark');
  assert.equal(theme.radius, 12);
  assert.equal(theme.colors.primary, '#ABC');
  assert.equal(theme.colors.button, M.DEFAULT_THEME.colors.button);
  assert.equal(theme.layout, 'split');
  assert.deepEqual(problems.sort(), ['colors.button', 'radius']);
});

test('browser checkout and server agree on theme CSS variables', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'public', 'checkout.js'), 'utf8');
  const sandbox = { module: { exports: {} }, self: {} }; vm.createContext(sandbox); vm.runInContext(src, sandbox);
  const C = sandbox.module.exports;
  const themes = [{}, { mode: 'dark', font: 'serif', buttonStyle: 'pill', radius: 20, colors: { primary: '#112233', background: '#000' } }, { layout: 'compact', font: 'mono', radius: 0 }];
  for (const th of themes) assert.deepEqual(JSON.parse(JSON.stringify(C.cssVars(th))), M.themeToCssVars(th));
  assert.equal(C.normalizePhone('0712 345 678'), '254712345678');
});

test('initiate uses the server-side amount, not anything from the browser', async (t) => {
  const { mock, mpesa } = await setup(t);
  const view = await mpesa.initiate({ orderId: 'A', phone: '0712 345 678', amount: 1 });
  assert.equal(view.status, 'pending');
  assert.equal(view.amount, 150);
  const push = mock.state.pushes[0];
  assert.equal(push.Amount, 150);
  assert.equal(push.PartyA, '254712345678');
  assert.equal(push.TransactionType, 'CustomerPayBillOnline');
  assert.equal(push.CallBackURL, 'https://shop.example.com/mpesa/callback/' + SECRET);
  assert.equal(push.AccountReference, 'ORD-A');
  await assert.rejects(mpesa.initiate({ orderId: 'nope', phone: '0712345678' }), /could not find/);
  await assert.rejects(mpesa.initiate({ orderId: 'B', phone: '0812345678' }), /Safaricom number/);
});

test('till (Buy Goods) payments go to the till number', async (t) => {
  const mock = await startMockDaraja(); t.after(() => mock.close());
  const mpesa = M.createMpesa({ ...mock.config, till: '5551234', publicUrl: 'https://x.example', callbackSecret: SECRET, resolveOrder: async () => ({ amount: 10 }), logger: quiet });
  await mpesa.initiate({ orderId: 'T', phone: '0712345678' });
  assert.equal(mock.state.pushes[0].TransactionType, 'CustomerBuyGoodsOnline');
  assert.equal(mock.state.pushes[0].PartyB, '5551234');
  assert.equal(mock.state.pushes[0].BusinessShortCode, '174379');
});

test('success callback is verified with a query and settles exactly once', async (t) => {
  const { mock, mpesa, hooks } = await setup(t);
  const v = await mpesa.initiate({ orderId: 'A', phone: '0712345678' });
  mock.state.results.set(v.id, { code: '0' });
  const r1 = await mpesa.handleCallback(callbackBody(v.id, 0, { amount: 150, receipt: 'TJK1PAID01' }), SECRET);
  assert.equal(r1.status, 200); assert.deepEqual(r1.body, M.ACK); assert.equal(r1.outcome, 'paid');
  const r2 = await mpesa.handleCallback(callbackBody(v.id, 0, { amount: 150, receipt: 'TJK1PAID01' }), SECRET);
  assert.equal(r2.outcome, 'duplicate');
  assert.equal(hooks.paid.length, 1);
  assert.equal(hooks.paid[0].receipt, 'TJK1PAID01');
  assert.equal(hooks.paid[0].verifiedBy, 'callback+query');
  const s = await mpesa.status(v.id);
  assert.equal(s.status, 'paid'); assert.equal(s.receipt, 'TJK1PAID01');
  await assert.rejects(mpesa.initiate({ orderId: 'A', phone: '0712345678' }), /already has a payment/);
});

test('callback with a wrong secret or bad body changes nothing', async (t) => {
  const { mpesa, hooks } = await setup(t);
  const v = await mpesa.initiate({ orderId: 'A', phone: '0712345678' });
  assert.equal((await mpesa.handleCallback(callbackBody(v.id, 0, { amount: 150 }), 'wrong')).status, 403);
  assert.equal((await mpesa.handleCallback(callbackBody(v.id, 0, { amount: 150 }), '')).status, 403);
  assert.equal((await mpesa.handleCallback({ hello: 1 }, SECRET)).status, 400);
  assert.equal((await mpesa.handleCallback(callbackBody('ws_CO_UNKNOWN', 0, { amount: 150 }), SECRET)).outcome, 'unknown');
  assert.equal(hooks.paid.length, 0);
  assert.equal((await mpesa.status(v.id)).status, 'pending');
});

test('amount mismatch goes to review, never to paid', async (t) => {
  const { mock, mpesa, hooks } = await setup(t);
  const v = await mpesa.initiate({ orderId: 'A', phone: '0712345678' });
  mock.state.results.set(v.id, { code: '0' });
  const r = await mpesa.handleCallback(callbackBody(v.id, 0, { amount: 1 }), SECRET);
  assert.equal(r.outcome, 'review');
  assert.equal(hooks.paid.length, 0); assert.equal(hooks.review.length, 1);
  assert.equal((await mpesa.status(v.id)).status, 'review');
});

test('callback says paid but Daraja query disagrees -> review', async (t) => {
  const { mock, mpesa, hooks } = await setup(t);
  const v = await mpesa.initiate({ orderId: 'A', phone: '0712345678' });
  mock.state.results.set(v.id, { code: '1032' });
  assert.equal((await mpesa.handleCallback(callbackBody(v.id, 0, { amount: 150 }), SECRET)).outcome, 'review');
  assert.equal(hooks.paid.length, 0);
});

test('cancel, timeout and failure codes settle as unsuccessful', async (t) => {
  const { mpesa, hooks, orders } = await setup(t);
  orders.C = { amount: 5 }; orders.D = { amount: 6 }; orders.E = { amount: 7 };
  const c = await mpesa.initiate({ orderId: 'C', phone: '0712345678' });
  const d = await mpesa.initiate({ orderId: 'D', phone: '0712345679' });
  const e = await mpesa.initiate({ orderId: 'E', phone: '0712345670' });
  assert.equal((await mpesa.handleCallback(callbackBody(c.id, 1032), SECRET)).outcome, 'cancelled');
  assert.equal((await mpesa.handleCallback(callbackBody(d.id, 1037, { desc: 'DS timeout user cannot be reached' }), SECRET)).outcome, 'expired');
  assert.equal((await mpesa.handleCallback(callbackBody(e.id, 1, { desc: 'The balance is insufficient for the transaction.' }), SECRET)).outcome, 'failed');
  assert.deepEqual(hooks.bad.map((p) => p.status), ['cancelled', 'expired', 'failed']);
  assert.equal(hooks.paid.length, 0);
});

test('status polling settles from Daraja when the callback is slow, and a late callback adds the receipt only', async (t) => {
  const { mock, mpesa, hooks } = await setup(t);
  const v = await mpesa.initiate({ orderId: 'A', phone: '0712345678' });
  assert.equal((await mpesa.status(v.id)).status, 'pending'); // "being processed"
  mock.state.results.set(v.id, { code: '0' });
  const s = await mpesa.status(v.id);
  assert.equal(s.status, 'paid'); assert.equal(s.receipt, null);
  assert.equal(hooks.paid.length, 1); assert.equal(hooks.paid[0].verifiedBy, 'query');
  assert.equal((await mpesa.handleCallback(callbackBody(v.id, 0, { amount: 150, receipt: 'LATE123' }), SECRET)).outcome, 'duplicate');
  assert.equal((await mpesa.status(v.id)).receipt, 'LATE123');
  assert.equal(hooks.paid.length, 1);
});

test('expired locally, then paid: goes to review so the money is not lost', async (t) => {
  let now = Date.parse('2026-10-25T10:00:00Z');
  const { mpesa, hooks } = await setup(t, { now: () => now, expireAfterMs: 60000 });
  const v = await mpesa.initiate({ orderId: 'A', phone: '0712345678' });
  now += 61000;
  assert.equal((await mpesa.status(v.id)).status, 'expired');
  assert.equal((await mpesa.handleCallback(callbackBody(v.id, 0, { amount: 150, receipt: 'LATEPAY1' }), SECRET)).outcome, 'review');
  assert.equal(hooks.review.length, 1); assert.equal(hooks.paid.length, 0);
});

test('one live request per order; retry allowed after the wait', async (t) => {
  let now = Date.parse('2026-10-25T10:00:00Z');
  const { mpesa } = await setup(t, { now: () => now, retryAfterMs: 30000 });
  await mpesa.initiate({ orderId: 'A', phone: '0712345678' });
  await assert.rejects(mpesa.initiate({ orderId: 'A', phone: '0712345678' }), /already waiting/);
  now += 31000;
  const again = await mpesa.initiate({ orderId: 'A', phone: '0712345678' });
  assert.equal(again.status, 'pending');
});

test('token is cached, concurrent calls share it, and a 401 refreshes it', async (t) => {
  const { mock, mpesa, orders } = await setup(t);
  orders.X = { amount: 1 }; orders.Y = { amount: 1 }; orders.Z = { amount: 1 };
  await Promise.all([mpesa.initiate({ orderId: 'X', phone: '0712345671' }), mpesa.initiate({ orderId: 'Y', phone: '0712345672' })]);
  assert.equal(mock.state.tokens, 1);
  mock.state.expiredToken = 'tok1';
  await mpesa.initiate({ orderId: 'Z', phone: '0712345673' });
  assert.equal(mock.state.tokens, 2);
});

test('Daraja rejection surfaces a safe message and stores nothing', async (t) => {
  const { mock, mpesa } = await setup(t);
  mock.state.rejectPush = 'Internal secret details';
  await assert.rejects(mpesa.initiate({ orderId: 'A', phone: '0712345678' }), (e) => e instanceof M.MpesaError && !/secret/.test(e.message) && e.code === 'stk_rejected');
  assert.equal((await mpesa.store.findByOrder('A')).length, 0);
});

test('configuration is checked up front', () => {
  const base = { consumerKey: 'a', consumerSecret: 'b', shortcode: '1', passkey: 'p', publicUrl: 'https://x.example', callbackSecret: SECRET, resolveOrder: async () => null };
  assert.throws(() => M.createMpesa({ ...base, callbackSecret: 'short' }), /at least 24/);
  assert.throws(() => M.createMpesa({ ...base, passkey: '' }), /passkey is missing/);
  assert.throws(() => M.createMpesa({ ...base, environment: 'production', publicUrl: 'http://x.example' }), /https/);
  assert.throws(() => M.createMpesa({ ...base, resolveOrder: undefined }), /resolveOrder/);
  const env = M.configFromEnv({ MPESA_ENV: 'production', MPESA_SHORTCODE: '600000' });
  assert.equal(env.environment, 'production'); assert.equal(env.shortcode, '600000'); assert.equal(env.basePath, '/mpesa');
});

test('JsonFileStore survives a restart', async () => {
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cm-')), 'p.json');
  const a = new M.JsonFileStore(f);
  await a.create({ id: 'x1', orderId: 'O', status: 'pending', amount: 5 });
  assert.ok(await a.transition('x1', 'pending', { status: 'paid' }));
  assert.equal(await a.transition('x1', 'pending', { status: 'failed' }), null);
  await new Promise((r) => setTimeout(r, 20));
  const b = new M.JsonFileStore(f);
  assert.equal((await b.get('x1')).status, 'paid');
  assert.equal((await b.findByOrder('O')).length, 1);
});

test('HTTP handler: full flow over real HTTP, limits and errors', async (t) => {
  const { mock, mpesa } = await setup(t);
  const handler = M.createHttpHandler(mpesa, { stkPerMinute: 3 });
  const srv = http.createServer((req, res) => handler(req, res));
  await new Promise((r) => srv.listen(0, '127.0.0.1', r)); t.after(() => new Promise((r) => srv.close(r)));
  const base = 'http://127.0.0.1:' + srv.address().port;
  const post = (p, body, raw) => fetch(base + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: raw || JSON.stringify(body) }).then(async (r) => ({ status: r.status, json: await r.json() }));
  const r1 = await post('/mpesa/stk', { orderId: 'A', phone: '0712345678', amount: 1 });
  assert.equal(r1.status, 201); assert.equal(r1.json.payment.amount, 150); assert.equal(r1.json.payment.phone, '0712 *** 678');
  const id = r1.json.payment.id;
  assert.equal((await post('/mpesa/stk', { orderId: 'A', phone: '0712345678' })).status, 409);
  assert.equal((await post('/mpesa/stk', { orderId: 'B', phone: 'x' })).status, 400);
  assert.equal((await post('/mpesa/stk', { orderId: 'B', phone: '0712345678' })).status, 429); // 4th request this minute
  assert.equal((await post('/mpesa/stk', null, '{bad')).status, 429);
  assert.equal((await post('/mpesa/callback/' + SECRET, null, 'x'.repeat(20000))).status, 400);
  mock.state.results.set(id, { code: '0' });
  const cb = await post('/mpesa/callback/' + SECRET, callbackBody(id, 0, { amount: 150, receipt: 'HTTP0001' }));
  assert.equal(cb.status, 200); assert.deepEqual(cb.json, { ResultCode: 0, ResultDesc: 'Accepted' });
  assert.equal((await post('/mpesa/callback/nope', callbackBody(id, 0, { amount: 150 }))).status, 403);
  const st = await fetch(base + '/mpesa/status/' + id).then((r) => r.json());
  assert.equal(st.payment.status, 'paid'); assert.equal(st.payment.receipt, 'HTTP0001');
  assert.equal((await fetch(base + '/mpesa/status/none')).status, 404);
  assert.equal((await fetch(base + '/elsewhere')).status, 404);
  assert.equal((await fetch(base + '/mpesa/stk')).status, 405);
});
