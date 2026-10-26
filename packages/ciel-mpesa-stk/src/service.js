'use strict';
/**
 * Payment service: starts STK pushes, records them, and settles them ONLY from
 * Safaricom's answer (the callback and/or an STK query). The browser never decides
 * the amount and never decides that a payment succeeded.
 */
const crypto = require('crypto');
const { DarajaClient, stateForResult } = require('./daraja');
const { parseStkCallback, ACK } = require('./callback');
const { normalizePhone, maskPhone } = require('./phone');
const { MemoryStore } = require('./store');
const { MpesaError } = require('./errors');

const FINAL = ['paid', 'cancelled', 'expired', 'failed', 'review'];

function safeEqual(a, b) {
  const x = Buffer.from(String(a || '')), y = Buffer.from(String(b || ''));
  return x.length === y.length && x.length > 0 && crypto.timingSafeEqual(x, y);
}

class MpesaService {
  /**
   * @param {object} cfg  see README "Configuration"
   */
  constructor(cfg) {
    if (!cfg || typeof cfg !== 'object') throw new MpesaError('Missing configuration.', { code: 'config', status: 500 });
    this.daraja = cfg.daraja || new DarajaClient(cfg);
    this.environment = this.daraja.environment;
    const secret = String(cfg.callbackSecret || '');
    if (secret.length < 24 || !/^[A-Za-z0-9_-]+$/.test(secret)) {
      throw new MpesaError('callbackSecret must be at least 24 characters of letters, digits, "-" or "_". Generate one with: node -e "console.log(require(\'crypto\').randomBytes(24).toString(\'base64url\'))"', { code: 'config', status: 500 });
    }
    this.callbackSecret = secret;
    const pub = String(cfg.publicUrl || '').replace(/\/$/, '');
    if (!/^https?:\/\//.test(pub)) throw new MpesaError('publicUrl must be the public address of your site, e.g. https://shop.example.com', { code: 'config', status: 500 });
    if (this.environment === 'production' && !pub.startsWith('https://')) throw new MpesaError('In production, publicUrl must use https://', { code: 'config', status: 500 });
    this.basePath = '/' + String(cfg.basePath || '/mpesa').replace(/^\/|\/$/g, '');
    this.callbackUrl = pub + this.basePath + '/callback/' + secret;
    if (typeof cfg.resolveOrder !== 'function') throw new MpesaError('resolveOrder(orderId) is required: it must return { amount, reference, description } from YOUR server-side records.', { code: 'config', status: 500 });
    this.resolveOrder = cfg.resolveOrder;
    this.store = cfg.store || new MemoryStore();
    this.onPaid = cfg.onPaid || null;
    this.onUnsuccessful = cfg.onUnsuccessful || null;
    this.onReview = cfg.onReview || null;
    this.log = cfg.logger || { info() {}, warn: console.warn.bind(console), error: console.error.bind(console) };
    this.verifyWithQuery = cfg.verifyCallbackWithQuery !== false;
    this.minQueryAgeMs = cfg.minQueryAgeMs != null ? cfg.minQueryAgeMs : 8000;
    this.queryIntervalMs = cfg.queryIntervalMs != null ? cfg.queryIntervalMs : 5000;
    this.expireAfterMs = cfg.expireAfterMs != null ? cfg.expireAfterMs : 5 * 60 * 1000;
    this.retryAfterMs = cfg.retryAfterMs != null ? cfg.retryAfterMs : 90 * 1000;
    this.now = cfg.now || (() => Date.now());
  }

  /** What the browser may see about a payment. */
  publicView(rec) {
    if (!rec) return null;
    const msg = {
      pending: 'Check your phone and enter your M-Pesa PIN.',
      paid: 'Payment confirmed by M-Pesa.',
      cancelled: 'The request was cancelled on the phone.',
      expired: 'The request timed out before a PIN was entered.',
      failed: 'M-Pesa did not complete the payment.',
      review: 'We received a response that needs checking. Our team will confirm your payment.'
    }[rec.status];
    return { id: rec.id, status: rec.status, amount: rec.amount, reference: rec.reference, phone: maskPhone(rec.phone), receipt: rec.status === 'paid' ? (rec.receipt || null) : null, message: msg, environment: this.environment };
  }

  /**
   * Starts an STK Push for one of YOUR orders.
   * @param {{orderId:string, phone:string}} input  from the browser
   */
  async initiate(input) {
    const orderId = String((input && input.orderId) || '').trim();
    if (!orderId || orderId.length > 64) throw new MpesaError('Missing order.', { code: 'order', status: 400 });
    const phone = normalizePhone(input && input.phone);
    if (!phone) throw new MpesaError('Enter a Safaricom number like 0712 345 678.', { code: 'phone', status: 400 });
    const order = await this.resolveOrder(orderId);
    if (!order) throw new MpesaError('We could not find that order.', { code: 'order', status: 404 });
    const amount = Number(order.amount);
    if (!Number.isInteger(amount) || amount < 1 || amount > 250000) {
      throw new MpesaError('This order amount cannot be paid by STK Push (whole shillings, 1 to 250,000).', { code: 'amount', status: 400 });
    }
    // One live request per order, and never a second payment for a paid order.
    const existing = typeof this.store.findByOrder === 'function' ? await this.store.findByOrder(orderId) : [];
    for (const p of existing) {
      if (p.status === 'paid' || p.status === 'review') throw new MpesaError('This order already has a payment on record.', { code: 'duplicate', status: 409 });
      if (p.status === 'pending' && this.now() - Date.parse(p.createdAt) < this.retryAfterMs) {
        throw new MpesaError('A payment request is already waiting on a phone for this order. Complete it or wait a moment before trying again.', { code: 'in_progress', status: 409 });
      }
    }
    const reference = String(order.reference || orderId).replace(/[^A-Za-z0-9 #-]/g, '').slice(0, 12) || 'Payment';
    const sent = await this.daraja.stkPush({ phone, amount, accountReference: reference, description: order.description || 'Payment', callbackUrl: this.callbackUrl });
    const rec = await this.store.create({
      id: sent.checkoutRequestId,
      merchantRequestId: sent.merchantRequestId,
      orderId, amount, phone, reference,
      environment: this.environment,
      status: 'pending',
      createdAt: new Date(this.now()).toISOString(),
      updatedAt: new Date(this.now()).toISOString(),
      lastQueryAt: null, resultCode: null, resultDesc: null, receipt: null, transactionDate: null,
      verifiedBy: null, callback: null, callbackCount: 0
    });
    this.log.info('[mpesa] STK sent', { id: rec.id, orderId, amount, phone: maskPhone(phone) });
    return this.publicView(rec);
  }

  async _settle(rec, state, info, source) {
    const patch = { status: state, resultCode: info.resultCode, resultDesc: info.resultDesc, verifiedBy: source };
    if (info.receipt) patch.receipt = info.receipt;
    if (info.transactionDate) patch.transactionDate = info.transactionDate;
    const done = await this.store.transition(rec.id, 'pending', patch);
    if (!done) return await this.store.get(rec.id); // someone else settled it first: do nothing twice
    this.log.info('[mpesa] payment ' + state, { id: done.id, orderId: done.orderId, by: source });
    try {
      if (state === 'paid' && this.onPaid) await this.onPaid(done);
      else if (state === 'review' && this.onReview) await this.onReview(done);
      else if (state !== 'paid' && state !== 'review' && this.onUnsuccessful) await this.onUnsuccessful(done);
    } catch (e) { this.log.error('[mpesa] hook failed for ' + done.id + ': ' + (e && e.message)); }
    return done;
  }

  /**
   * Handles Safaricom's callback. Always answer with result.body and result.status.
   * @param {object} body          parsed JSON body
   * @param {string} secretInPath  the secret segment from the callback URL
   */
  async handleCallback(body, secretInPath) {
    if (!safeEqual(secretInPath, this.callbackSecret)) {
      this.log.warn('[mpesa] callback with a wrong secret was rejected');
      return { status: 403, body: { ResultCode: 1, ResultDesc: 'Rejected' }, outcome: 'forbidden' };
    }
    const cb = parseStkCallback(body);
    if (!cb) return { status: 400, body: { ResultCode: 1, ResultDesc: 'Malformed callback' }, outcome: 'malformed' };
    const rec = await this.store.get(cb.checkoutRequestId);
    if (!rec) {
      this.log.warn('[mpesa] callback for an unknown request ' + cb.checkoutRequestId);
      return { status: 200, body: ACK, outcome: 'unknown' };
    }
    await this.store.patch(rec.id, { callbackCount: (rec.callbackCount || 0) + 1 });
    if (rec.status === 'expired' && cb.resultCode === '0') {
      // We stopped waiting, but the customer did pay. Never drop that: a person must look at it.
      const late = await this.store.transition(rec.id, 'expired', { status: 'review', resultCode: cb.resultCode, resultDesc: 'Paid after the request had expired locally', receipt: cb.receipt, transactionDate: cb.transactionDate, verifiedBy: 'callback' });
      if (late && this.onReview) { try { await this.onReview(late); } catch (e) { this.log.error('[mpesa] hook failed for ' + late.id + ': ' + (e && e.message)); } }
      return { status: 200, body: ACK, outcome: 'review' };
    }
    if (rec.status !== 'pending') {
      // Duplicate or late callback. Keep a missing receipt, change nothing else.
      if (rec.status === 'paid' && !rec.receipt && cb.resultCode === '0' && cb.receipt) await this.store.patch(rec.id, { receipt: cb.receipt, transactionDate: cb.transactionDate });
      return { status: 200, body: ACK, outcome: 'duplicate' };
    }
    const state = stateForResult(cb.resultCode);
    if (state !== 'paid') {
      await this._settle(rec, state, cb, 'callback');
      return { status: 200, body: ACK, outcome: state };
    }
    // Success callback: amounts must match what WE asked for.
    if (cb.amount !== rec.amount) {
      await this._settle(rec, 'review', Object.assign({}, cb, { resultDesc: 'Amount mismatch: callback ' + cb.amount + ', expected ' + rec.amount }), 'callback');
      return { status: 200, body: ACK, outcome: 'review' };
    }
    await this.store.patch(rec.id, { callback: { resultCode: cb.resultCode, amount: cb.amount, receipt: cb.receipt, transactionDate: cb.transactionDate, phone: cb.phone ? maskPhone(cb.phone) : null } });
    if (!this.verifyWithQuery) {
      await this._settle(rec, 'paid', cb, 'callback');
      return { status: 200, body: ACK, outcome: 'paid' };
    }
    // Confirm with Daraja before marking paid. If Daraja is not ready yet, a later
    // status check finishes the job; the callback evidence is kept on the record.
    try {
      const q = await this.daraja.stkQuery(rec.id);
      if (q.state === 'paid') { await this._settle(rec, 'paid', cb, 'callback+query'); return { status: 200, body: ACK, outcome: 'paid' }; }
      if (q.state !== 'pending') { await this._settle(rec, 'review', Object.assign({}, cb, { resultDesc: 'Callback said paid but query said ' + q.state + ' (' + q.resultCode + ')' }), 'callback+query'); return { status: 200, body: ACK, outcome: 'review' }; }
    } catch (e) { this.log.warn('[mpesa] verification query failed: ' + e.message); }
    return { status: 200, body: ACK, outcome: 'awaiting_verification' };
  }

  /**
   * Returns the payment, asking Daraja for the result when it is still pending.
   * Safe to call repeatedly (the browser polls it); queries are rate limited per payment.
   */
  async status(id) {
    let rec = await this.store.get(String(id || ''));
    if (!rec) throw new MpesaError('Payment not found.', { code: 'not_found', status: 404 });
    if (rec.status !== 'pending') return this.publicView(rec);
    const age = this.now() - Date.parse(rec.createdAt);
    const sinceQuery = rec.lastQueryAt ? this.now() - Date.parse(rec.lastQueryAt) : Infinity;
    if (age >= this.minQueryAgeMs && sinceQuery >= this.queryIntervalMs) {
      await this.store.patch(rec.id, { lastQueryAt: new Date(this.now()).toISOString() });
      try {
        const q = await this.daraja.stkQuery(rec.id);
        if (q.state === 'paid') {
          const cb = rec.callback || {};
          rec = await this._settle(rec, 'paid', { resultCode: q.resultCode, resultDesc: q.resultDesc, receipt: cb.receipt || null, transactionDate: cb.transactionDate || null }, rec.callback ? 'callback+query' : 'query');
        } else if (q.state !== 'pending') {
          rec = await this._settle(rec, rec.callback ? 'review' : q.state, { resultCode: q.resultCode, resultDesc: q.resultDesc }, 'query');
        }
      } catch (e) { this.log.warn('[mpesa] status query failed: ' + e.message); }
    }
    if (rec.status === 'pending' && age > this.expireAfterMs) {
      rec = await this._settle(rec, 'expired', { resultCode: null, resultDesc: 'No result from M-Pesa within ' + Math.round(this.expireAfterMs / 60000) + ' minutes' }, 'timeout');
    }
    return this.publicView(rec);
  }
}

module.exports = { MpesaService, FINAL };
