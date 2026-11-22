/* ============================================================
   CIEL ADMIN — every lead, order and message becomes a task.
   add(): puts a task on the board (once per lead/order: `key` stops doubles).
   remind(): run by the 10-minute scheduler (GitHub → /api/hq?route=ig-cron);
   nudges the phone about tasks that have waited too long.
   ============================================================ */
const BS = require('../photobooks/blobstore');
const PATH = 'hq/tasks.json';
const rid = () => Date.now().toString(36) + require('crypto').randomBytes(3).toString('hex');
const nb = t => new Date((t || Date.now()) + 3 * 3600e3).toISOString().slice(0, 10);   /* Nairobi date */

/* what to do about each kind of event */
const VERB = { lead: 'Respond to', message: 'Reply to', order: 'Fulfil', whatsapp: 'Confirm', pages: 'Check' };
const TAG = { lead: 'Lead', message: 'Message', order: 'Order', whatsapp: 'WhatsApp order', pages: 'Photo Books' };
const STEPS = {
  lead: ['Read the brief', 'Reply (WhatsApp, call or email)', 'Book a discovery call', 'Send a proposal'],
  message: ['Read the message', 'Reply'],
  order: ['Check the payment', 'Prepare the order', 'Deliver and let the customer know'],
  whatsapp: ['Confirm the order on WhatsApp', 'Take payment', 'Deliver'],
  pages: ['Check the pages', 'Send to print']
};

async function add(t) {
  if (!BS.on()) return null;
  const d = (await BS.getJSON(PATH).catch(() => null)) || { items: [], v: 0 };
  if (t.key && d.items.some(x => x.key === t.key)) return null;
  const now = Date.now();
  const it = Object.assign({ id: rid(), status: 'todo', priority: 'high', due: nb(now), remind: '1h', createdAt: now, updatedAt: now }, t);
  d.items.push(it); d.v = (d.v || 0) + 1;
  await BS.putJSON(PATH, d);
  return it;
}

/* from a notification event: { kind, title, body, url, task? } */
function fromEvent(e) {
  if (!VERB[e.kind]) return null;
  const who = String(e.title || '').split(' · ').slice(1).join(' · ').trim();
  const isBrief = e.kind === 'lead' && /^project brief/i.test(e.body || '');
  let title;
  if (e.kind === 'lead' || e.kind === 'message') title = VERB[e.kind] + ' ' + (who || 'a new lead') + (isBrief ? ' · project brief' : ' · message');
  else if (e.kind === 'order') title = VERB.order + ' ' + String(e.title || 'order').replace(/^new\s+/i, '');
  else if (e.kind === 'whatsapp') title = VERB.whatsapp + ' ' + String(e.title || 'WhatsApp order').replace(/\s*request\b/i, '');
  else title = String(e.title || 'Check pages');
  const t = Object.assign({
    title: title.slice(0, 120), src: e.kind, tag: TAG[e.kind], link: e.url || '', notes: String(e.body || '').slice(0, 2000),
    steps: (STEPS[isBrief ? 'lead' : e.kind] || []).join('\n'), remind: e.kind === 'pages' ? '3h' : '1h', key: e.kind + ':' + (e.tag || e.url || e.title)
  }, e.task || {});
  return add(t);
}

/* how long a task may wait before a nudge, then how often to repeat (at most 5 nudges) */
const GAP = { '1h': 3600e3, '3h': 3 * 3600e3, '1d': 864e5 };
async function remind(NT) {
  if (!BS.on()) return 0;
  const [d, pj] = await Promise.all([BS.getJSON(PATH).catch(() => null), BS.getJSON('hq/projects.json').catch(() => null)]);
  if (!d) return 0;
  /* paused: a task (or its project) waiting on the client stays quiet until it moves again */
  const paused = {}; ((pj && pj.items) || []).forEach(p => { if (/^(waiting|on_hold|completed)$/.test(p.status)) paused[p.id] = 1; });
  const now = Date.now(), today = nb(now), due = [];
  d.items.forEach(t => {
    if (t.status === 'done' || t.status === 'waiting' || (t.ref && paused[t.ref])) return;
    const g = GAP[t.remind], n = t.nrem || 0;
    let why = '';
    /* the clock starts again when the task comes back from waiting */
    if (g && n < 5) { const from = Math.max(t.reminded || 0, t.resumedAt || 0) || t.createdAt || now; if (now >= from + (n ? g * 3 : g)) why = 'wait'; }
    if (!why && t.due && t.due < today && (!t.reminded || nb(t.reminded) < today)) why = 'late';
    if (why) due.push([t, why]);
  });
  if (!due.length) return 0;
  /* one nudge per run: the oldest; the rest come on later runs */
  due.sort((a, b) => (a[0].createdAt || 0) - (b[0].createdAt || 0));
  const [t, why] = due[0];
  const age = now - (t.createdAt || now), h = Math.floor(age / 3600e3), m = Math.floor(age / 60e3);
  const waited = h >= 48 ? Math.floor(h / 24) + ' days' : h >= 1 ? h + ' h' : m + ' min';
  t.reminded = now; t.nrem = (t.nrem || 0) + 1; d.v = (d.v || 0) + 1;
  await BS.putJSON(PATH, d);
  await NT.event({ kind: 'task', title: (why === 'late' ? 'Overdue · ' : 'Still waiting ' + waited + ' · ') + t.title, body: t.contact ? t.contact : (t.notes || '').split('\n')[0].slice(0, 140), url: '/admin#tasks/' + t.id, tag: 'task-' + t.id, urgent: t.src === 'lead' || t.src === 'order' || t.src === 'whatsapp' });
  return 1 + (due.length > 1 ? 0 : 0);
}

module.exports = { add, fromEvent, remind };
