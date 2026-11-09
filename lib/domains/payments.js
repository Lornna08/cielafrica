/* ============================================================
   CIEL DOMAINS — payment providers

   M-Pesa (Safaricom Daraja STK push) — reuses the site's existing
   MPESA_* environment variables. Daraja callbacks are not signed, so a
   callback is only a hint: every payment is confirmed with Daraja's
   STK Query API from the server before an order is marked paid.

   Card (Paystack, optional) — enabled when PAYSTACK_SECRET_KEY is set.
   Webhooks are verified with the x-paystack-signature HMAC-SHA512 and
   every charge is re-verified with GET /transaction/verify/:reference.
   No card data ever touches this server (Paystack hosts the form).
   ============================================================ */
const crypto = require('crypto');

function mpesaConfigured() { return ['MPESA_CONSUMER_KEY', 'MPESA_CONSUMER_SECRET', 'MPESA_SHORTCODE', 'MPESA_PASSKEY'].every(k => !!process.env[k]); }
function cardConfigured() { return !!process.env.PAYSTACK_SECRET_KEY; }

function normalizePhone(p) {
  p = String(p || '').replace(/\D/g, '');
  if (p.startsWith('0')) p = '254' + p.slice(1);
  if (/^[17]\d{8}$/.test(p)) p = '254' + p;
  return /^254[17]\d{8}$/.test(p) ? p : null;
}
function timestamp(d) {
  // Daraja expects Kenyan local time (EAT, UTC+3)
  const t = new Date((d || Date.now()) + 3 * 3600 * 1000), z = n => String(n).padStart(2, '0');
  return t.getUTCFullYear() + z(t.getUTCMonth() + 1) + z(t.getUTCDate()) + z(t.getUTCHours()) + z(t.getUTCMinutes()) + z(t.getUTCSeconds());
}

function mpesa(fetchImpl) {
  const f = fetchImpl || fetch;
  const base = () => (process.env.MPESA_ENV === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke');
  let tok = null, tokExp = 0;
  async function token() {
    if (tok && Date.now() < tokExp) return tok;
    const auth = Buffer.from(process.env.MPESA_CONSUMER_KEY + ':' + process.env.MPESA_CONSUMER_SECRET).toString('base64');
    const r = await f(base() + '/oauth/v1/generate?grant_type=client_credentials', { headers: { Authorization: 'Basic ' + auth }, signal: AbortSignal.timeout(10000) });
    const j = await r.json().catch(() => ({}));
    if (!j.access_token) throw new Error('mpesa auth failed');
    tok = j.access_token; tokExp = Date.now() + Math.max(60, (Number(j.expires_in) || 3599) - 120) * 1000;
    return tok;
  }
  function creds() {
    const ts = timestamp();
    const shortcode = String(process.env.MPESA_SHORTCODE || '').trim();
    const till = String(process.env.MPESA_TILL || '').trim();
    return { ts, shortcode, till, password: Buffer.from(shortcode + process.env.MPESA_PASSKEY + ts).toString('base64') };
  }
  return {
    name: 'mpesa',
    /** returns { ok, checkoutRequestID } or { ok:false, error } */
    async stkPush({ phone, amount, accountRef, description, callbackUrl }) {
      const c = creds(), t = await token();
      const r = await f(base() + '/mpesa/stkpush/v1/processrequest', {
        method: 'POST', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(15000),
        body: JSON.stringify({
          BusinessShortCode: c.shortcode, Password: c.password, Timestamp: c.ts,
          TransactionType: c.till ? 'CustomerBuyGoodsOnline' : 'CustomerPayBillOnline',
          Amount: amount, PartyA: phone, PartyB: c.till || c.shortcode, PhoneNumber: phone,
          CallBackURL: callbackUrl, AccountReference: String(accountRef).slice(0, 12), TransactionDesc: String(description || 'Domain order').slice(0, 13)
        })
      });
      const j = await r.json().catch(() => ({}));
      if (String(j.ResponseCode) === '0' && j.CheckoutRequestID) return { ok: true, checkoutRequestID: j.CheckoutRequestID };
      return { ok: false, error: j.errorMessage || j.ResponseDescription || 'M-Pesa request failed' };
    },
    /** server-side confirmation. returns { status: 'paid'|'failed'|'pending', desc } */
    async query(checkoutRequestID) {
      const c = creds(), t = await token();
      const r = await f(base() + '/mpesa/stkpushquery/v1/query', {
        method: 'POST', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(15000),
        body: JSON.stringify({ BusinessShortCode: c.shortcode, Password: c.password, Timestamp: c.ts, CheckoutRequestID: checkoutRequestID })
      });
      const j = await r.json().catch(() => ({}));
      const rc = j.ResultCode != null ? String(j.ResultCode) : null;
      const desc = String(j.ResultDesc || j.errorMessage || '');
      if (rc === '0') return { status: 'paid', desc };
      if (rc && ['1032', '1037', '2001', '1', '1019', '1025', '9999', '1001', '17', '26'].includes(rc)) return { status: 'failed', desc, code: rc };
      return { status: 'pending', desc };
    }
  };
}

function paystack(fetchImpl) {
  const f = fetchImpl || fetch;
  const H = () => ({ Authorization: 'Bearer ' + process.env.PAYSTACK_SECRET_KEY, 'Content-Type': 'application/json' });
  return {
    name: 'card',
    async initialize({ email, amount, reference, callbackUrl, metadata }) {
      const r = await f('https://api.paystack.co/transaction/initialize', {
        method: 'POST', headers: H(), signal: AbortSignal.timeout(15000),
        body: JSON.stringify({ email, amount: amount * 100, currency: 'KES', reference, callback_url: callbackUrl, channels: ['card', 'mobile_money'], metadata })
      });
      const j = await r.json().catch(() => ({}));
      if (j.status && j.data && j.data.authorization_url) return { ok: true, url: j.data.authorization_url, reference: j.data.reference || reference };
      return { ok: false, error: j.message || 'Card payment could not start' };
    },
    /** returns { status: 'paid'|'failed'|'pending', amount, currency, channel } */
    async verify(reference) {
      const r = await f('https://api.paystack.co/transaction/verify/' + encodeURIComponent(reference), { headers: H(), signal: AbortSignal.timeout(15000) });
      const j = await r.json().catch(() => ({}));
      const d = j && j.data;
      if (!d) return { status: 'pending' };
      const s = d.status;
      return { status: s === 'success' ? 'paid' : (s === 'failed' || s === 'abandoned' || s === 'reversed') ? 'failed' : 'pending', amount: d.amount / 100, currency: d.currency, channel: d.channel, id: d.id };
    },
    async refund({ reference, amount }) {
      const r = await f('https://api.paystack.co/refund', { method: 'POST', headers: H(), signal: AbortSignal.timeout(15000), body: JSON.stringify({ transaction: reference, amount: amount * 100 }) });
      const j = await r.json().catch(() => ({}));
      if (j.status && j.data) return { ok: true, id: j.data.id, status: j.data.status };
      return { ok: false, error: j.message || 'Refund request failed' };
    },
    verifySignature(raw, sig) {
      if (!process.env.PAYSTACK_SECRET_KEY || !sig) return false;
      const h = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY).update(raw).digest('hex');
      const a = Buffer.from(h), b = Buffer.from(String(sig));
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    }
  };
}

module.exports = { mpesa, paystack, mpesaConfigured, cardConfigured, normalizePhone, timestamp };
