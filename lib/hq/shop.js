/* ============================================================
   Website shop orders for Ciel HQ (private Blob: shop/orders/<CheckoutRequestID>.json)
   • started:  recorded when the M-Pesa prompt is sent (status awaiting_payment)
   • paid:     when M-Pesa confirms (status check from the page, or Safaricom's callback)
   • failed:   cancelled / timed out
   ============================================================ */
const BS = require('../photobooks/blobstore');
const cut = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').slice(0, n);
const pathOf = id => 'shop/orders/' + id + '.json';
const idOf = v => String(v || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 80);

async function started(crid, b, amount) {
  const id = idOf(crid); if (!BS.on() || !id) return;
  const at = Date.now();
  await BS.putJSON(pathOf(id), { id, kind: 'shop', ref: 'SH-' + id.slice(-8).toUpperCase(), status: 'awaiting_payment', createdAt: at, history: [{ status: 'awaiting_payment', at, note: 'M-Pesa prompt sent' }],
    customer: { name: cut(b.customerName, 80), email: cut(b.customerEmail, 190), phone: cut(b.phone, 20) }, order: cut(b.order, 1500), totalText: 'KES ' + Number(amount).toLocaleString('en-KE'), total: Number(amount) || null,
    note: 'Items as sent by the checkout page; the amount is what M-Pesa was asked to charge.' });
}
async function paid(crid, b, info) {
  const id = idOf(crid); if (!BS.on() || !id) return false;
  const p = pathOf(id), at = Date.now(); b = b || {};
  let o = await BS.getJSON(p).catch(() => null);
  if (o && o.status !== 'awaiting_payment' && o.status !== 'payment_failed') return false; /* already recorded */
  if (!o) o = { id, kind: 'shop', ref: 'SH-' + id.slice(-8).toUpperCase(), createdAt: at, history: [], customer: { name: cut(b.customerName, 80), email: cut(b.customerEmail, 190), phone: cut(b.phone, 20) }, order: cut(b.order, 1500), totalText: cut(b.total, 40), total: Number(String(b.total || '').replace(/[^\d.]/g, '')) || null };
  o.status = 'paid'; o.paidAt = at;
  if (info && info.receipt) o.receipt = cut(info.receipt, 30);
  if (info && info.amount) { o.total = Number(info.amount) || o.total; o.totalText = 'KES ' + Number(o.total).toLocaleString('en-KE'); }
  o.history = (o.history || []).concat([{ status: 'paid', at, note: 'Confirmed by M-Pesa' + (o.receipt ? ' · ' + o.receipt : '') }]);
  await BS.putJSON(p, o);
  await require('./notify').event({ kind: 'order', title: 'New shop order · ' + (o.totalText || ''), body: (o.customer.name || 'A customer') + ': ' + (o.order || '').slice(0, 100), url: '/admin#orders/' + o.ref });
  return true;
}
async function failed(crid, desc) {
  const id = idOf(crid); if (!BS.on() || !id) return;
  const p = pathOf(id), o = await BS.getJSON(p).catch(() => null);
  if (!o || o.status !== 'awaiting_payment') return;
  o.status = 'payment_failed'; o.history = (o.history || []).concat([{ status: 'payment_failed', at: Date.now(), note: cut(desc, 200) || 'Not completed' }]);
  await BS.putJSON(p, o);
}
module.exports = { started, paid, failed };
