/* ============================================================
   CIEL ADMIN — once-a-day jobs (run by the daily Photo Books cron)
   · asks customers for a review a few days after delivery (once per order)
   · sends campaigns that were scheduled for today or earlier
   ============================================================ */
const BS = require('../photobooks/blobstore');
const SET = require('./settings');
const REV = require('./reviews');
const SUB = require('./subs');

const DAY = 864e5;
function deliveredAt(o, re) { const h = (o.history || []).filter(x => re.test(x.status || '')); return h.length ? h[h.length - 1].at : 0; }

async function reviews(pbOrders, fetchImpl) {
  const st = await SET.get('reviews'); if (!st.auto || !process.env.RESEND_API_KEY) return 0;
  let n = 0; const now = Date.now(), wait = st.days * DAY;
  for (const o of pbOrders || []) {
    if (n >= 30) break;
    if (o.test || o.reviewAsk || o.status !== 'delivered' || !o.customer || !o.customer.email) continue;
    const at = deliveredAt(o, /^delivered$/); if (!at || now - at < wait || now - at > 30 * DAY) continue;
    try { await REV.ask({ ref: o.ref, email: o.customer.email, name: o.customer.name }, fetchImpl); o.reviewAsk = now; await BS.saveOrder(o); n++; } catch (e) { console.error('[hq daily] review', o.ref, e.message); }
  }
  const files = (await BS.listFiles('shop/orders/').catch(() => [])).slice(0, 600);
  for (const f of files) {
    if (n >= 30) break;
    const o = await BS.getJSON(f.path).catch(() => null);
    if (!o || o.reviewAsk || !/^(delivered|fulfilled)$/.test(o.status) || !o.customer || !o.customer.email) continue;
    const at = deliveredAt(o, /^(delivered|fulfilled)$/); if (!at || now - at < wait || now - at > 30 * DAY) continue;
    const ref = String(o.ref || o.id || ''); if (!REV.okRef(ref)) continue;
    try { await REV.ask({ ref, email: o.customer.email, name: o.customer.name }, fetchImpl); o.reviewAsk = now; await BS.putJSON(f.path, o); n++; } catch (e) { console.error('[hq daily] review', ref, e.message); }
  }
  return n;
}
/* scheduled campaigns that are due: send them in batches for up to ~40 seconds */
async function campaigns(fetchImpl, budgetMs) {
  const t0 = Date.now(), due = (await SUB.listCamps()).filter(c => c.status === 'scheduled' && c.sendAt && c.sendAt <= Date.now());
  let sent = 0;
  for (const c of due) {
    let r = { done: false };
    while (!r.done && Date.now() - t0 < (budgetMs || 40000)) { r = await SUB.sendBatch(c.id, fetchImpl, 50); sent = r.sent; }
  }
  return { due: due.length, sent };
}
async function run(o) {
  o = o || {}; if (!BS.on()) return { skipped: true };
  const out = {};
  try { out.reviews = await reviews(o.pbOrders, o.fetch); } catch (e) { out.reviews = 'error: ' + e.message; }
  try { out.campaigns = await campaigns(o.fetch); } catch (e) { out.campaigns = 'error: ' + e.message; }
  return out;
}
module.exports = { run, campaigns, reviews };
