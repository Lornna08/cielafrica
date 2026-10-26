'use strict';
/**
 * Kenyan mobile numbers for STK Push.
 * Accepts 07XXXXXXXX, 01XXXXXXXX, 7XXXXXXXX, 1XXXXXXXX, +2547XXXXXXXX, 2541XXXXXXXX
 * (spaces, dashes and brackets are ignored) and returns 2547XXXXXXXX / 2541XXXXXXXX.
 * Returns null when the input is not a valid Kenyan mobile number.
 */
function normalizePhone(input) {
  let p = String(input == null ? '' : input).trim().replace(/[\s\-().]/g, '');
  if (p.startsWith('+')) p = p.slice(1);
  if (!/^\d+$/.test(p)) return null;
  if (p.startsWith('0') && p.length === 10) p = '254' + p.slice(1);
  else if ((p.startsWith('7') || p.startsWith('1')) && p.length === 9) p = '254' + p;
  return /^254(7|1)\d{8}$/.test(p) ? p : null;
}

/** 254712345678 -> 0712 *** 678 (for logs and receipts shown to staff) */
function maskPhone(p) {
  const n = normalizePhone(p);
  if (!n) return '';
  return '0' + n.slice(3, 6) + ' *** ' + n.slice(-3);
}

module.exports = { normalizePhone, maskPhone };
