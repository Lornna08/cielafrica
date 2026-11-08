/* ============================================================
   CIEL ADMIN — email subscribers and campaigns
   Subscribers sign up on the website (homepage, Photo Books), confirm by
   email (double opt-in) and can leave with one click from any email.
   Each subscriber is one private Blob file (hq/subs/<id>.json); campaigns
   are hq/campaigns/<id>.json. Emails go out through Resend (RESEND_API_KEY,
   MAIL_FROM), the same sender as order emails. Nothing here is public.
   ============================================================ */
const sec = require('../domains/security');
const BS = require('../photobooks/blobstore');

const SUBS = 'hq/subs/', CAMPS = 'hq/campaigns/';
const SITE = () => (process.env.SITE_URL || 'https://cielafrica.com').replace(/\/$/, '');
const FROM = () => process.env.MAIL_FROM || 'Ciel Africa <hello@cielafrica.com>';
const SOURCES = { home: 'Homepage', photobooks: 'Photo Books', admin: 'Added in Ciel Admin', other: 'Website' };
const CONSENT = 'Pressed Subscribe under: “By subscribing you agree to get Ciel Africa emails. Unsubscribe in one click, any time.”';
const err = (status, code, message) => Object.assign(new Error(message), { status, code });
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clean = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, n || 200);

const normEmail = e => clean(e, 190).toLowerCase();
const okEmail = e => /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[a-z]{2,24}$/i.test(e);
const idOf = email => sec.sha('sub|' + email).slice(0, 24);
const subPath = id => SUBS + id + '.json';
/* links are signed, so no token has to be stored and old emails keep working */
const sig = (what, id) => (sec.sign(what + '|' + id) || '').slice(0, 24);
const confirmUrl = id => SITE() + '/subscribe?c=' + id + '.' + sig('confirm', id);
const unsubUrl = id => SITE() + '/subscribe?u=' + id + '.' + sig('unsub', id);
const oneClickUrl = id => SITE() + '/api/hq?route=sub-unsub&k=' + id + '.' + sig('unsub', id);
function checkKey(what, k) {
  const m = String(k || '').match(/^([a-f0-9]{24})\.([A-Za-z0-9_-]{10,40})$/);
  if (!m || !sec.secret() || !sec.safeEq(m[2], sig(what, m[1]))) throw err(400, 'link', 'This link isn’t valid. Copy the whole link from the email, or subscribe again.');
  return m[1];
}
const mask = e => { const [u, d] = String(e).split('@'); return (u.length <= 2 ? u[0] + '•' : u.slice(0, 2) + '•••' + u.slice(-1)) + '@' + d; };
const pub = s => ({ id: s.id, email: s.email, name: s.name || '', source: s.source, status: s.status, createdAt: s.createdAt, confirmedAt: s.confirmedAt || null, unsubscribedAt: s.unsubscribedAt || null, received: s.received || 0, lastSentAt: s.lastSentAt || null });

/* ---------- sending (Resend) ---------- */
async function resend(path, payload, fetchImpl) {
  if (!process.env.RESEND_API_KEY) throw err(503, 'email', 'Email sending isn’t set up: add RESEND_API_KEY in Vercel.');
  const r = await (fetchImpl || fetch)('https://api.resend.com' + path, { method: 'POST', headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(20000) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw err(502, 'resend', 'The email service said: ' + ((j && (j.message || j.name)) || 'HTTP ' + r.status));
  return j;
}
const unsubHeaders = id => ({ 'List-Unsubscribe': '<' + oneClickUrl(id) + '>, <mailto:hello@cielafrica.com?subject=Unsubscribe>', 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' });

/* ---------- the email design (shared by confirmations, campaigns and the admin preview) ---------- */
function linkify(t) { return t.replace(/\bhttps?:\/\/[^\s<]+[^\s<.,;:!?)]/g, u => '<a href="' + u + '" style="color:#FF5A1F;font-weight:600">' + u.replace(/^https?:\/\//, '') + '</a>'); }
function bodyHtml(text) {
  const blocks = String(text || '').replace(/\r/g, '').split(/\n{2,}/).map(b => b.trim()).filter(Boolean);
  return blocks.map(b => {
    const lines = b.split('\n');
    if (lines.every(l => /^[-•*]\s+/.test(l))) return '<ul style="margin:0 0 18px;padding-left:20px;font-size:16px;line-height:1.6;color:#2b2724">' + lines.map(l => '<li style="margin:0 0 6px">' + linkify(esc(l.replace(/^[-•*]\s+/, ''))).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>') + '</li>').join('') + '</ul>';
    return '<p style="margin:0 0 18px;font-size:16px;line-height:1.65;color:#2b2724">' + linkify(esc(b)).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>') + '</p>';
  }).join('');
}
function emailHtml(o) {
  /* o: { preheader, kicker, title, body (plain text), image, btnLabel, btnUrl, foot (html), unsub } */
  const img = o.image && /^https:\/\//.test(o.image) ? '<tr><td style="padding:0"><img src="' + esc(o.image) + '" width="600" alt="" style="display:block;width:100%;max-width:600px;height:auto;border:0"></td></tr>' : '';
  const btn = o.btnLabel && /^https?:\/\//.test(o.btnUrl || '') ? '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 26px"><tr><td style="background:#FF5A1F;border-radius:999px"><a href="' + esc(o.btnUrl) + '" style="display:inline-block;padding:14px 26px;font:700 15px Arial,Helvetica,sans-serif;color:#ffffff;text-decoration:none">' + esc(o.btnLabel) + ' &rarr;</a></td></tr></table>' : '';
  return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>' + esc(o.title || 'Ciel Africa') + '</title></head>' +
    '<body style="margin:0;padding:0;background:#F4EEE4">' +
    '<div style="display:none;max-height:0;overflow:hidden;opacity:0">' + esc(o.preheader || '') + '&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;</div>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4EEE4"><tr><td align="center" style="padding:24px 12px">' +
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;font-family:Arial,Helvetica,sans-serif">' +
    '<tr><td style="background:#141110;padding:22px 28px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td><img src="' + SITE() + '/assets/img/logo-light.png?v=20261108" height="26" alt="Ciel Africa" style="display:block;height:26px;width:auto;border:0"></td><td align="right" style="font:700 12px Arial,Helvetica,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#FF7A2F">' + esc(o.kicker || '') + '</td></tr></table></td></tr>' +
    '<tr><td style="height:4px;background:#FF5A1F;background-image:linear-gradient(90deg,#FF5A1F,#FF7A2F,#FFB04A);font-size:0;line-height:0">&nbsp;</td></tr>' +
    img +
    '<tr><td style="padding:34px 32px 8px"><h1 style="margin:0 0 18px;font:700 30px/1.15 Arial,Helvetica,sans-serif;letter-spacing:-.02em;color:#141110">' + esc(o.title || '') + '</h1>' + bodyHtml(o.body) + btn + '</td></tr>' +
    '<tr><td style="padding:22px 32px 30px;border-top:1px solid #EFE8DC;font-size:12.5px;line-height:1.6;color:#8A8178">' + (o.foot || '') +
    '<p style="margin:10px 0 0">Ciel Africa · Websites and Photo Books · Nairobi, Kenya · <a href="' + SITE() + '" style="color:#8A8178">cielafrica.com</a></p>' +
    (o.unsub ? '<p style="margin:6px 0 0"><a href="' + esc(o.unsub) + '" style="color:#8A8178;text-decoration:underline">Unsubscribe</a> — one click, no questions.</p>' : '') +
    '</td></tr></table></td></tr></table></body></html>';
}
function emailText(o) {
  return [o.title, '', String(o.body || '').replace(/\*\*(.+?)\*\*/g, '$1'), o.btnLabel && o.btnUrl ? '\n' + o.btnLabel + ': ' + o.btnUrl : '', '', '—', 'Ciel Africa · Nairobi, Kenya · ' + SITE(), o.unsub ? 'Unsubscribe: ' + o.unsub : ''].join('\n');
}

/* ---------- subscribers ---------- */
async function getSub(id) { return BS.getJSON(subPath(id)).catch(() => null); }
async function putSub(s) { s.updatedAt = Date.now(); await BS.putJSON(subPath(s.id), s); return s; }
async function allSubs() {
  const files = (await BS.listFiles(SUBS)).filter(f => /\.json$/.test(f.path)).slice(0, 5000), out = [];
  for (let i = 0; i < files.length; i += 40) out.push.apply(out, await Promise.all(files.slice(i, i + 40).map(f => BS.getJSON(f.path).catch(() => null))));
  return out.filter(Boolean).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}
async function sendConfirm(s, fetchImpl) {
  const first = s.name ? s.name.split(' ')[0] : '';
  const o = { kicker: s.source === 'photobooks' ? 'Photo Books' : 'Ciel Africa', preheader: 'One tap to confirm your subscription.', title: 'Confirm your email' + (first ? ', ' + first : '') + '.',
    body: 'Thanks for subscribing to Ciel Africa. Tap the button below to confirm it’s really you, and we’ll send you the occasional note about new photo book covers, website work and offers.\n\nDidn’t sign up? Ignore this email and you won’t hear from us.',
    btnLabel: 'Yes, subscribe me', btnUrl: confirmUrl(s.id), foot: '<p style="margin:0">You’re getting this one email because this address was entered at cielafrica.com.</p>' };
  await resend('/emails', { from: FROM(), to: [s.email], subject: 'Confirm your subscription to Ciel Africa', html: emailHtml(o), text: emailText(o), reply_to: 'hello@cielafrica.com' }, fetchImpl);
}
async function subscribe(b, fetchImpl) {
  const email = normEmail(b.email);
  if (!okEmail(email)) throw err(400, 'email', 'Enter a valid email address.');
  if (b.consent !== true) throw err(400, 'consent', 'Tick the box to say you’d like our emails.');
  if (!BS.on() || !process.env.RESEND_API_KEY || !sec.secret()) throw err(503, 'setup', 'Subscriptions aren’t open just yet. Please try again soon.');
  const id = idOf(email), now = Date.now(); let s = await getSub(id);
  if (s && s.status === 'confirmed') return { ok: true, state: 'sent' };            // same answer for everyone: nothing leaks
  if (s && s.status === 'pending' && now - (s.mailedAt || 0) < 10 * 60e3) return { ok: true, state: 'sent' };
  s = Object.assign(s || { id, email, createdAt: now }, { name: clean(b.name, 80) || (s && s.name) || '', source: SOURCES[b.source] ? b.source : 'other', status: 'pending', consentAt: now, consentText: CONSENT, mailedAt: now });
  delete s.unsubscribedAt;
  await putSub(s);
  await sendConfirm(s, fetchImpl);
  return { ok: true, state: 'sent' };
}
async function confirm(k) {
  const id = checkKey('confirm', k), s = await getSub(id); if (!s) throw err(404, 'missing', 'We couldn’t find this subscription. Please subscribe again.');
  const fresh = s.status !== 'confirmed';
  if (fresh) { s.status = 'confirmed'; s.confirmedAt = Date.now(); delete s.unsubscribedAt; await putSub(s); }
  return { ok: true, email: mask(s.email), fresh, sub: s };
}
async function unsubscribe(k) {
  const id = checkKey('unsub', k), s = await getSub(id);
  if (s && s.status !== 'unsubscribed') { s.status = 'unsubscribed'; s.unsubscribedAt = Date.now(); await putSub(s); }
  return { ok: true, email: s ? mask(s.email) : '' };
}

/* ---------- campaigns ---------- */
const AUD = ['all', 'home', 'photobooks'];
function shapeCamp(b, old) {
  const c = Object.assign({}, old || {});
  c.id = old ? old.id : Date.now().toString(36) + sec.randomId(4).replace(/[^a-z0-9]/gi, '').slice(0, 4).toLowerCase();
  ['subject', 'preheader', 'kicker', 'title', 'btnLabel'].forEach(k => { if (b[k] != null) c[k] = clean(b[k], k === 'preheader' ? 160 : 140); });
  if (b.body != null) c.body = String(b.body).replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, ' ').slice(0, 12000);
  if (b.image != null) { const u = clean(b.image, 500); c.image = /^https:\/\/[^\s"'<>]+$/.test(u) ? u : ''; }
  if (b.btnUrl != null) { const u = clean(b.btnUrl, 500); c.btnUrl = /^https?:\/\/[^\s"'<>]+$/.test(u) ? u : ''; }
  if (b.audience != null) c.audience = AUD.includes(b.audience) ? b.audience : 'all';
  c.status = c.status || 'draft'; c.createdAt = c.createdAt || Date.now(); c.updatedAt = Date.now();
  return c;
}
const campPath = id => { if (!/^[a-z0-9]{6,20}$/.test(String(id || ''))) throw err(400, 'id', 'Bad campaign.'); return CAMPS + id + '.json'; };
async function getCamp(id) { const c = await BS.getJSON(campPath(id)).catch(() => null); if (!c) throw err(404, 'missing', 'Campaign not found.'); return c; }
async function listCamps() {
  const files = (await BS.listFiles(CAMPS)).filter(f => /\.json$/.test(f.path)).slice(0, 300);
  const out = (await Promise.all(files.map(f => BS.getJSON(f.path).catch(() => null)))).filter(Boolean);
  return out.map(c => Object.assign({}, c, { queue: undefined, done: undefined, queued: (c.queue || []).length, delivered: (c.done || []).length })).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}
const campEmail = (c, id) => ({ kicker: c.kicker || 'Ciel Africa', preheader: c.preheader, title: c.title || c.subject, body: c.body, image: c.image, btnLabel: c.btnLabel, btnUrl: c.btnUrl, unsub: id ? unsubUrl(id) : SITE() + '/subscribe?u=preview', foot: '<p style="margin:0">You’re receiving this because you subscribed at cielafrica.com.</p>' });
function ready(c) {
  if (!c.subject) throw err(400, 'subject', 'Add a subject line.');
  if (!c.title) throw err(400, 'title', 'Add a headline.');
  if (!String(c.body || '').trim()) throw err(400, 'body', 'Write the message.');
}
async function sendTest(c, to, fetchImpl) {
  ready(c); to = normEmail(to); if (!okEmail(to)) throw err(400, 'to', 'Enter a valid email for the test.');
  const o = campEmail(c, null);
  await resend('/emails', { from: FROM(), to: [to], subject: '[Test] ' + c.subject, html: emailHtml(o), text: emailText(o), reply_to: 'hello@cielafrica.com' }, fetchImpl);
  return { ok: true };
}
/** sends the next batch; the first call fixes the audience (confirmed subscribers at that moment) */
async function sendBatch(id, fetchImpl, size) {
  const c = await getCamp(id); ready(c);
  if (c.status === 'sent') return { ok: true, done: true, sent: (c.done || []).length, remaining: 0, failed: (c.failed || []).length, camp: c };
  if (!c.queue) {
    const subs = (await allSubs()).filter(s => s.status === 'confirmed' && (c.audience === 'all' || !c.audience || s.source === c.audience));
    if (!subs.length) throw err(409, 'empty', 'No confirmed subscribers in this audience yet.');
    c.queue = subs.map(s => s.id); c.done = []; c.failed = []; c.status = 'sending'; c.startedAt = Date.now();
  }
  const doneSet = new Set(c.done.concat(c.failed.map(f => f.id))), next = c.queue.filter(x => !doneSet.has(x)).slice(0, Math.min(100, size || 50));
  if (next.length) {
    const subs = (await Promise.all(next.map(getSub))).map((s, i) => s || { id: next[i], status: 'gone' });
    const live = subs.filter(s => s.status === 'confirmed');
    subs.filter(s => s.status !== 'confirmed').forEach(s => c.failed.push({ id: s.id, why: s.status === 'unsubscribed' ? 'unsubscribed' : 'removed' }));
    if (live.length) {
      try {
        await resend('/emails/batch', live.map(s => { const o = campEmail(c, s.id); return { from: FROM(), to: [s.email], subject: c.subject, html: emailHtml(o), text: emailText(o), reply_to: 'hello@cielafrica.com', headers: unsubHeaders(s.id) }; }), fetchImpl);
        live.forEach(s => c.done.push(s.id));
        await Promise.all(live.map(s => { s.received = (s.received || 0) + 1; s.lastSentAt = Date.now(); return putSub(s).catch(() => null); }));
      } catch (e) { await BS.putJSON(campPath(c.id), c); throw e; }      // keep progress; sending again carries on
    }
  }
  const remaining = c.queue.length - c.done.length - c.failed.length;
  if (remaining <= 0) { c.status = 'sent'; c.sentAt = Date.now(); }
  c.updatedAt = Date.now(); await BS.putJSON(campPath(c.id), c);
  return { ok: true, done: remaining <= 0, sent: c.done.length, failed: c.failed.length, remaining: Math.max(0, remaining), total: c.queue.length, camp: c };
}

/* the welcome email, sent once when someone confirms (Campaigns → Welcome email) */
async function sendWelcome(s, w, fetchImpl) {
  if (!w || !w.on || !s || s.status !== 'confirmed') return false;
  const first = s.name ? s.name.split(' ')[0] : '', fill = t => String(t || '').replace(/\{, ?first\}/g, first ? ', ' + first : '').replace(/\{first\}/g, first || 'there');
  const o = { kicker: w.kicker || 'Welcome', preheader: fill(w.subject), title: fill(w.title), body: fill(w.body), image: w.image, btnLabel: w.btnLabel, btnUrl: w.btnUrl, unsub: unsubUrl(s.id), foot: '<p style="margin:0">You’re receiving this because you subscribed at cielafrica.com.</p>' };
  await resend('/emails', { from: FROM(), to: [s.email], subject: fill(w.subject) || 'Welcome to Ciel Africa', html: emailHtml(o), text: emailText(o), reply_to: 'hello@cielafrica.com', headers: unsubHeaders(s.id) }, fetchImpl);
  s.received = (s.received || 0) + 1; s.lastSentAt = Date.now(); s.welcomedAt = Date.now(); await putSub(s);
  return true;
}
module.exports = { sendWelcome, emailText,  subscribe, confirm, unsubscribe, allSubs, getSub, putSub, pub, idOf, normEmail, okEmail, shapeCamp, getCamp, listCamps, campPath, campEmail, emailHtml, sendTest, sendBatch, SOURCES, CONSENT };
