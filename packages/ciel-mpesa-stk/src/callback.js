'use strict';
/**
 * Parses the JSON body Daraja POSTs to your callback URL after an STK Push:
 * { Body: { stkCallback: { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc,
 *   CallbackMetadata: { Item: [ {Name:'Amount',Value}, {Name:'MpesaReceiptNumber',Value},
 *   {Name:'TransactionDate',Value}, {Name:'PhoneNumber',Value} ] } } } }
 * Returns null when the body is not a well-formed STK callback.
 */
function parseStkCallback(body) {
  const cb = body && body.Body && body.Body.stkCallback;
  if (!cb || typeof cb !== 'object') return null;
  const checkoutRequestId = typeof cb.CheckoutRequestID === 'string' ? cb.CheckoutRequestID.trim() : '';
  if (!checkoutRequestId || checkoutRequestId.length > 100) return null;
  const code = cb.ResultCode;
  if (code === undefined || code === null || !/^\d+$/.test(String(code))) return null;
  const items = (cb.CallbackMetadata && Array.isArray(cb.CallbackMetadata.Item)) ? cb.CallbackMetadata.Item : [];
  const meta = {};
  for (const it of items) if (it && typeof it.Name === 'string') meta[it.Name] = it.Value;
  const amount = meta.Amount != null && isFinite(Number(meta.Amount)) ? Number(meta.Amount) : null;
  return {
    checkoutRequestId,
    merchantRequestId: typeof cb.MerchantRequestID === 'string' ? cb.MerchantRequestID : null,
    resultCode: String(code),
    resultDesc: String(cb.ResultDesc || '').slice(0, 300),
    amount,
    receipt: meta.MpesaReceiptNumber != null ? String(meta.MpesaReceiptNumber).slice(0, 40) : null,
    transactionDate: meta.TransactionDate != null ? String(meta.TransactionDate) : null,
    phone: meta.PhoneNumber != null ? String(meta.PhoneNumber) : null
  };
}

/** The acknowledgement Daraja expects. Reply with it quickly so Safaricom does not retry. */
const ACK = Object.freeze({ ResultCode: 0, ResultDesc: 'Accepted' });

module.exports = { parseStkCallback, ACK };
