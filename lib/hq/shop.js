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

async function started(crid, b, amount, priced) {
  const id = idOf(crid); if (!BS.on() || !id) return;
  const at = Date.now(), v = !!(priced && priced.ok && priced.total === Number(amount));
  await BS.putJSON(pathOf(id), { id, kind: 'shop', ref: 'SH-' + id.slice(-8).toUpperCase(), status: 'awaiting_payment', createdAt: at, history: [{ status: 'awaiting_payment', at, note: 'M-Pesa prompt sent' }],
    lines: priced && priced.ok ? priced.lines : [], verified: v,
    customer: { name: cut(b.customerName, 80), email: cut(b.customerEmail, 190), phone: cut(b.phone, 20) }, order: cut(b.order, 1500), totalText: 'KES ' + Number(amount).toLocaleString('en-KE'), total: Number(amount) || null,
    note: 'Items as sent by the checkout page; the amount is what M-Pesa was asked to charge.' });
}
async function paid(crid, b, info) {
  const id = idOf(crid); if (!BS.on() || !id) return false;
  const p = pathOf(id), at = Date.now(); b = b || {};
  let o = await BS.getJSON(p).catch(() => null);
  if (o && o.status !== 'awaiting_payment' && o.status !== 'payment_failed') return false; /* already recorded */
  /* Photo Books and Domains share the M-Pesa callback: a payment this shop never started isn't a shop order */
  if (!o) return false;
  o.status = 'paid'; o.paidAt = at;
  if (info && info.receipt) o.receipt = cut(info.receipt, 30);
  if (info && info.amount) { o.total = Number(info.amount) || o.total; o.totalText = 'KES ' + Number(o.total).toLocaleString('en-KE'); }
  o.history = (o.history || []).concat([{ status: 'paid', at, note: 'Confirmed by M-Pesa' + (o.receipt ? ' · ' + o.receipt : '') }]);
  /* a paid amount lower than the catalogue total never unlocks downloads */
  if (o.verified && info && info.amount && Number(info.amount) < o.lines.reduce((n, l) => n + l.price * l.qty, 0)) o.verified = false;
  const DL = require('./delivery'); DL.grant(o);
  await BS.putJSON(p, o);
  if (o.dl) { const sent = await DL.emailLink(o); if (sent) { o.history.push({ status: 'download', at: Date.now(), note: 'Download link emailed to ' + o.customer.email }); await BS.putJSON(p, o).catch(() => { }); } }
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
/** download link for a paid order (shown on the checkout page right after payment) */
async function downloadLink(crid) { const id = idOf(crid); if (!BS.on() || !id) return null; const o = await BS.getJSON(pathOf(id)).catch(() => null); return o && o.dl ? require('./delivery').link(o) : null; }
module.exports = { started, paid, failed, downloadLink };
