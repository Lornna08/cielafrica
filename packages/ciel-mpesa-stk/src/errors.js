'use strict';
class MpesaError extends Error {
  /**
   * @param {string} message  safe to show to a customer
   * @param {object} [o]      { code, status, details } — details are for logs only
   */
  constructor(message, o = {}) {
    super(message);
    this.name = 'MpesaError';
    this.code = o.code || 'mpesa_error';
    this.status = o.status || 400;
    if (o.details) Object.defineProperty(this, 'details', { value: o.details, enumerable: false });
  }
}
module.exports = { MpesaError };
