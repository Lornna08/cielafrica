'use strict';
/**
 * Minimal Safaricom Daraja client for Lipa na M-Pesa Online (STK Push).
 * Server-side only: it needs your consumer secret and passkey.
 *
 * Endpoints used:
 *   GET  /oauth/v1/generate?grant_type=client_credentials
 *   POST /mpesa/stkpush/v1/processrequest
 *   POST /mpesa/stkpushquery/v1/query
 */
const { MpesaError } = require('./errors');

const BASE_URLS = {
  sandbox: 'https://sandbox.safaricom.co.ke',
  production: 'https://api.safaricom.co.ke'
};

/** Daraja timestamps are YYYYMMDDHHmmss in East Africa Time (UTC+3, no daylight saving). */
function darajaTimestamp(date = new Date()) {
  const eat = new Date(date.getTime() + 3 * 3600 * 1000);
  const z = (n) => String(n).padStart(2, '0');
  return eat.getUTCFullYear() + z(eat.getUTCMonth() + 1) + z(eat.getUTCDate()) + z(eat.getUTCHours()) + z(eat.getUTCMinutes()) + z(eat.getUTCSeconds());
}

function stkPassword(shortcode, passkey, timestamp) {
  return Buffer.from(String(shortcode) + String(passkey) + String(timestamp)).toString('base64');
}

class DarajaClient {
  /**
   * @param {object} cfg
   * @param {'sandbox'|'production'} cfg.environment
   * @param {string} cfg.consumerKey
   * @param {string} cfg.consumerSecret
   * @param {string} cfg.shortcode       Paybill number, or the store/head-office number for a Till
   * @param {string} cfg.passkey         Lipa na M-Pesa Online passkey
   * @param {string} [cfg.till]          Till (Buy Goods) number. When set, payments go to the till.
   * @param {string} [cfg.baseUrl]       Override for tests or a proxy
   * @param {number} [cfg.timeoutMs]     Per-request timeout (default 15000)
   * @param {Function} [cfg.fetch]       fetch implementation (default global fetch)
   */
  constructor(cfg) {
    const env = cfg.environment === 'production' ? 'production' : 'sandbox';
    for (const k of ['consumerKey', 'consumerSecret', 'shortcode', 'passkey']) {
      if (!cfg[k] || !String(cfg[k]).trim()) throw new MpesaError('M-Pesa is not configured: ' + k + ' is missing.', { code: 'config', status: 500 });
    }
    this.environment = env;
    this.baseUrl = (cfg.baseUrl || BASE_URLS[env]).replace(/\/$/, '');
    this.consumerKey = String(cfg.consumerKey).trim();
    this.consumerSecret = String(cfg.consumerSecret).trim();
    this.shortcode = String(cfg.shortcode).trim();
    this.passkey = String(cfg.passkey).trim();
    this.till = cfg.till ? String(cfg.till).trim() : '';
    this.timeoutMs = cfg.timeoutMs || 15000;
    this._fetch = cfg.fetch || globalThis.fetch;
    if (typeof this._fetch !== 'function') throw new MpesaError('This Node.js version has no fetch(). Use Node.js 18.17 or newer.', { code: 'config', status: 500 });
    this._token = null;
    this._tokenExpires = 0;
    this._tokenPending = null;
  }

  async _request(path, init) {
    let res;
    try {
      res = await this._fetch(this.baseUrl + path, Object.assign({ signal: AbortSignal.timeout(this.timeoutMs) }, init));
    } catch (e) {
      throw new MpesaError('Could not reach M-Pesa. Please try again.', { code: 'network', status: 502, details: e && e.message });
    }
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : {}; } catch (e) { json = null; }
    return { status: res.status, ok: res.ok, json, text };
  }

  /** OAuth access token, cached until shortly before it expires. Concurrent callers share one request. */
  async token() {
    if (this._token && Date.now() < this._tokenExpires) return this._token;
    if (this._tokenPending) return this._tokenPending;
    const auth = Buffer.from(this.consumerKey + ':' + this.consumerSecret).toString('base64');
    this._tokenPending = (async () => {
      try {
        const r = await this._request('/oauth/v1/generate?grant_type=client_credentials', { method: 'GET', headers: { Authorization: 'Basic ' + auth } });
        if (!r.json || !r.json.access_token) throw new MpesaError('Could not authenticate with M-Pesa.', { code: 'auth', status: 502, details: r.text && r.text.slice(0, 300) });
        const ttl = Math.max(60, Number(r.json.expires_in) || 3599);
        this._token = r.json.access_token;
        this._tokenExpires = Date.now() + (ttl - 60) * 1000;
        return this._token;
      } finally { this._tokenPending = null; }
    })();
    return this._tokenPending;
  }

  async _post(path, body, retried) {
    const token = await this.token();
    const r = await this._request(path, { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (r.status === 401 && !retried) { this._token = null; return this._post(path, body, true); }
    return r;
  }

  /**
   * Sends the STK Push prompt to the customer's phone.
   * Resolves when Daraja ACCEPTS the request. That is NOT a payment: wait for the
   * callback or a successful query before treating the order as paid.
   */
  async stkPush({ phone, amount, accountReference, description, callbackUrl }) {
    const ts = darajaTimestamp();
    const isTill = !!this.till;
    const payload = {
      BusinessShortCode: this.shortcode,
      Password: stkPassword(this.shortcode, this.passkey, ts),
      Timestamp: ts,
      TransactionType: isTill ? 'CustomerBuyGoodsOnline' : 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phone,
      PartyB: isTill ? this.till : this.shortcode,
      PhoneNumber: phone,
      CallBackURL: callbackUrl,
      AccountReference: String(accountReference || 'Payment').slice(0, 12),
      TransactionDesc: String(description || 'Payment').slice(0, 13)
    };
    const r = await this._post('/mpesa/stkpush/v1/processrequest', payload);
    const j = r.json || {};
    if (String(j.ResponseCode) === '0' && j.CheckoutRequestID) {
      return { checkoutRequestId: j.CheckoutRequestID, merchantRequestId: j.MerchantRequestID || null, customerMessage: j.CustomerMessage || '' };
    }
    throw new MpesaError('M-Pesa could not send the payment request. Check the number and try again.', { code: 'stk_rejected', status: 502, details: (j.errorMessage || j.ResponseDescription || r.text || '').toString().slice(0, 300) });
  }

  /**
   * Asks Daraja for the result of an STK Push.
   * @returns {{state:'paid'|'cancelled'|'expired'|'failed'|'pending', resultCode:string|null, resultDesc:string}}
   */
  async stkQuery(checkoutRequestId) {
    const ts = darajaTimestamp();
    const r = await this._post('/mpesa/stkpushquery/v1/query', {
      BusinessShortCode: this.shortcode,
      Password: stkPassword(this.shortcode, this.passkey, ts),
      Timestamp: ts,
      CheckoutRequestID: checkoutRequestId
    });
    const j = r.json || {};
    const rc = j.ResultCode != null ? String(j.ResultCode) : null;
    const desc = String(j.ResultDesc || j.errorMessage || '');
    // While the customer is still deciding, Daraja answers with an error such as
    // errorCode 500.001.1001 "The transaction is being processed". That means pending.
    if (rc === null) return { state: 'pending', resultCode: null, resultDesc: desc };
    return { state: stateForResult(rc), resultCode: rc, resultDesc: desc };
  }
}

/** Result codes that end an STK transaction. Anything unknown is treated as a failure, not a success. */
function stateForResult(code) {
  const c = String(code);
  if (c === '0') return 'paid';
  if (c === '1032') return 'cancelled';      // request cancelled by the customer
  if (c === '1037' || c === '1019') return 'expired'; // no response from the phone / transaction expired
  return 'failed';                           // e.g. 1 insufficient balance, 2001 wrong PIN, 1025/9999 system errors
}

module.exports = { DarajaClient, darajaTimestamp, stkPassword, stateForResult, BASE_URLS };
