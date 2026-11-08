/* ============================================================
   CIEL ADMIN — customer reviews
   After delivery a customer gets a private link (/review?k=<order>.<signature>).
   What they write is kept privately (hq/reviews/<order>.json). Nothing shows
   on the website until Ciel Africa approves it AND the customer agreed to
   it being shown; then only their first name, town, stars and words.
   ============================================================ */
const sec = require('../domains/security');
const BS = require('../photobooks/blobstore');
const SUB = require('./subs');

const P = 'hq/reviews/';
const SITE = () => (process.env.SITE_URL || 'https://cielafrica.com').replace(/\/$/, '');
const FROM = () => process.env.MAIL_FROM || 'Ciel Africa <hello@cielafrica.com>';
const err = (status, code, message) => Object.assign(new Error(message), { status, code });
const one = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, n || 100);
const okRef = r => /^[A-Za-z0-9-]{4,60}$/.test(String(r || ''));
const sig = ref => (sec.sign('review|' + ref) || '').slice(0, 22);
const link = ref => SITE() + '/review?k=' + encodeURIComponent(ref) + '.' + sig(ref);
function check(k) {
  const m = String(k || '').match(/^([A-Za-z0-9-]{4,60})\.([A-Za-z0-9_-]{10,40})$/);
  if (!m || !sec.secret() || !sec.safeEq(m[2], sig(m[1]))) throw err(400, 'link', 'This review link isn’t valid. Please use the link from your message.');
  return m[1];
}
const kindOf = ref => /^PB-/.test(ref) ? 'Photo Books' : /^WA-/.test(ref) ? 'WhatsApp order' : /^CD-/.test(ref) ? 'Domains' : /^INV-/.test(ref) ? 'Website' : 'Shop';
async function get(ref) { return BS.getJSON(P + ref + '.json').catch(() => null); }

async function info(k) { const ref = check(k), r = await get(ref); return { ok: true, ref, kind: kindOf(ref), done: !!(r && r.stars), review: r && r.stars ? { stars: r.stars, text: r.text, name: r.name, town: r.town, publish: r.publish } : null }; }
async function submit(k, b) {
  const ref = check(k), stars = Math.round(+b.stars);
  if (!(stars >= 1 && stars <= 5)) throw err(400, 'stars', 'Tap the stars to give a rating.');
  const text = String(b.text == null ? '' : b.text).replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, ' ').trim().slice(0, 1500);
  const old = await get(ref);
  const r = Object.assign(old || { id: ref, ref, kind: kindOf(ref), createdAt: Date.now() }, { stars, text, name: one(b.name, 40), town: one(b.town, 40), publish: !!b.publish, status: old && old.status === 'approved' && old.text === text && old.stars === stars ? 'approved' : 'new', at: Date.now() });
  await BS.putJSON(P + ref + '.json', r);
  return r;
}
async function all() {
  const files = (await BS.listFiles(P)).filter(f => /\.json$/.test(f.path)).slice(0, 2000), out = [];
  for (let i = 0; i < files.length; i += 40) out.push.apply(out, await Promise.all(files.slice(i, i + 40).map(f => BS.getJSON(f.path).catch(() => null))));
  return out.filter(r => r && r.stars).sort((a, b) => (b.at || 0) - (a.at || 0));
}
async function admin(b) {
  if (!okRef(b.id)) throw err(400, 'id', 'Bad review.');
  const r = await get(b.id); if (!r) throw err(404, 'missing', 'Review not found.');
  if (b.op === 'delete') { await BS.del([P + b.id + '.json']); return null; }
  if (b.op === 'approve') { if (!r.publish) throw err(409, 'consent', 'This customer didn’t agree to their review being shown on the website.'); r.status = 'approved'; r.approvedAt = Date.now(); }
  else if (b.op === 'hide') r.status = 'hidden';
  else throw err(400, 'op', 'Unknown action.');
  await BS.putJSON(P + b.id + '.json', r); return r;
}
/* what the website may show: approved, agreed to, first name only */
async function publicList() {
  return (await all()).filter(r => r.status === 'approved' && r.publish).slice(0, 30).map(r => ({ name: String(r.name || '').split(' ')[0] || 'A customer', town: r.town || '', stars: r.stars, text: r.text, kind: r.kind, at: r.at }));
}
async function ask(o, fetchImpl) {
  /* o = { ref, email, name } */
  if (!process.env.RESEND_API_KEY) throw err(503, 'email', 'Email sending isn’t set up (RESEND_API_KEY).');
  if (!okRef(o.ref) || !o.email) throw err(400, 'email', 'This order has no email address. Send the review link on WhatsApp instead.');
  const first = String(o.name || '').split(' ')[0];
  const m = { kicker: kindOf(o.ref), preheader: 'Two minutes, and it helps us a lot.', title: 'How did we do' + (first ? ', ' + first : '') + '?', body: 'Thank you for your order ' + o.ref + '. We’d love to know what you think: tap a star rating and, if you like, add a few words.\n\nYou choose whether we may show your review on our website.', btnLabel: 'Write a review', btnUrl: link(o.ref), foot: '<p style="margin:0">You’re getting this because you ordered from Ciel Africa. It’s the only time we’ll ask about this order.</p>' };
  const r = await (fetchImpl || fetch)('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(15000), body: JSON.stringify({ from: FROM(), to: [o.email], subject: 'How was your order? · ' + o.ref, html: SUB.emailHtml(m), reply_to: 'hello@cielafrica.com' }) });
  if (!r.ok) { const j = await r.json().catch(() => ({})); throw err(502, 'resend', 'The email service said: ' + (j.message || 'HTTP ' + r.status)); }
  return true;
}
module.exports = { link, check, info, submit, all, admin, publicList, ask, okRef };
