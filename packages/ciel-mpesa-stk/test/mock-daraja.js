'use strict';
// A small stand-in for Safaricom Daraja, used by the tests (and handy for local demos).
const http = require('http');

function startMockDaraja(opts = {}) {
  const state = { tokens: 0, pushes: [], queries: [], results: new Map(), n: 0, failAuthOnce: false, rejectPush: null, expiredToken: null };
  const SHORT = opts.shortcode || '174379', PASS = opts.passkey || 'test-passkey', KEY = opts.key || 'ck', SECRET = opts.secret || 'cs';
  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      const send = (code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };
      const url = new URL(req.url, 'http://x');
      if (url.pathname === '/oauth/v1/generate') {
        const want = 'Basic ' + Buffer.from(KEY + ':' + SECRET).toString('base64');
        if (req.headers.authorization !== want) return send(400, { errorMessage: 'Invalid credentials' });
        state.tokens++;
        return send(200, { access_token: 'tok' + state.tokens, expires_in: '3599' });
      }
      const auth = req.headers.authorization || '';
      if (!/^Bearer tok\d+$/.test(auth) || auth === 'Bearer ' + state.expiredToken) return send(401, { errorMessage: 'Invalid Access Token' });
      let body = {}; try { body = JSON.parse(raw); } catch (e) { return send(400, { errorMessage: 'bad json' }); }
      const ts = String(body.Timestamp || '');
      const okPass = body.Password === Buffer.from(SHORT + PASS + ts).toString('base64') && /^\d{14}$/.test(ts);
      if (url.pathname === '/mpesa/stkpush/v1/processrequest') {
        if (!okPass || body.BusinessShortCode !== SHORT) return send(400, { errorCode: '400.002.02', errorMessage: 'Bad Request - Invalid Password' });
        if (state.rejectPush) return send(400, { errorCode: '500.001.1001', errorMessage: state.rejectPush });
        state.n++;
        const id = 'ws_CO_TEST_' + state.n;
        state.pushes.push(Object.assign({ id }, body));
        return send(200, { MerchantRequestID: 'm-' + state.n, CheckoutRequestID: id, ResponseCode: '0', ResponseDescription: 'Success. Request accepted for processing', CustomerMessage: 'Success. Request accepted for processing' });
      }
      if (url.pathname === '/mpesa/stkpushquery/v1/query') {
        if (!okPass) return send(400, { errorMessage: 'Invalid Password' });
        state.queries.push(body.CheckoutRequestID);
        const r = state.results.get(body.CheckoutRequestID);
        if (!r) return send(500, { requestId: 'q', errorCode: '500.001.1001', errorMessage: 'The transaction is being processed' });
        return send(200, { ResponseCode: '0', ResponseDescription: 'The service request has been accepted successsfully', MerchantRequestID: 'm', CheckoutRequestID: body.CheckoutRequestID, ResultCode: r.code, ResultDesc: r.desc || 'done' });
      }
      send(404, { errorMessage: 'not found' });
    });
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => {
    const base = 'http://127.0.0.1:' + server.address().port;
    resolve({ base, state, server, close: () => new Promise((r) => server.close(r)), config: { consumerKey: KEY, consumerSecret: SECRET, shortcode: SHORT, passkey: PASS, baseUrl: base } });
  }));
}

/** Builds the body Daraja POSTs to the callback URL. */
function callbackBody(id, code, o = {}) {
  const cb = { MerchantRequestID: 'm', CheckoutRequestID: id, ResultCode: code, ResultDesc: o.desc || (code === 0 ? 'The service request is processed successfully.' : 'Request cancelled by user') };
  if (code === 0) cb.CallbackMetadata = { Item: [{ Name: 'Amount', Value: o.amount }, { Name: 'MpesaReceiptNumber', Value: o.receipt || 'TJK1ABC2DE' }, { Name: 'Balance' }, { Name: 'TransactionDate', Value: 20261025143012 }, { Name: 'PhoneNumber', Value: Number(o.phone || 254708374149) }] };
  return { Body: { stkCallback: cb } };
}

module.exports = { startMockDaraja, callbackBody };
