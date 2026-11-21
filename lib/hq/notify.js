/* ============================================================
   CIEL HQ — live updates and phone notifications
   • pulse: a small counter + the latest 30 events. Ciel HQ checks it
     every 30 s while it is open and reloads only when it changes.
     Kept in Redis when the Domains database is connected (cheap),
     otherwise in the private Blob store (hq/pulse.json).
   • push: Web Push to every phone/computer that turned notifications
     on in Ciel HQ. Keys come from VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY
     in Vercel, or are created once and kept in the private Blob store.
   Never throws: a failed notification must not break an order.
   ============================================================ */
const BS = require('../photobooks/blobstore');
const { getStore } = require('../domains/store');

const PULSE = 'hq/pulse.json', SUBS = 'hq/push-subs.json', KEYS = 'hq/vapid.json';
let keysCache = null;

async function readPulse() {
  try {
    const st = getStore();
    if (st.durable) return (await st.get('hq:pulse')) || { v: 0, items: [] };
    if (BS.on()) return (await BS.getJSON(PULSE).catch(() => null)) || { v: 0, items: [] };
  } catch (e) { }
  return { v: 0, items: [] };
}
async function writePulse(p) {
  const st = getStore();
  if (st.durable) return st.set('hq:pulse', p);
  if (BS.on()) return BS.putJSON(PULSE, p);
}

async function vapid() {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) return { publicKey: process.env.VAPID_PUBLIC_KEY, privateKey: process.env.VAPID_PRIVATE_KEY };
  if (keysCache) return keysCache;
  if (!BS.on()) return null;
  let k = await BS.getJSON(KEYS).catch(() => null);
  if (!k || !k.publicKey) { k = require('web-push').generateVAPIDKeys(); await BS.putJSON(KEYS, k); }
  return (keysCache = k);
}
async function subs() { return BS.on() ? ((await BS.getJSON(SUBS).catch(() => null)) || { list: [] }) : { list: [] }; }
async function addSub(sub, label) {
  if (!BS.on()) throw Object.assign(new Error('Connect the private Blob store first.'), { status: 503, code: 'storage' });
  if (!sub || typeof sub.endpoint !== 'string' || !/^https:\/\//.test(sub.endpoint) || !sub.keys || !sub.keys.p256dh || !sub.keys.auth) throw Object.assign(new Error('That device could not be registered.'), { status: 400, code: 'sub' });
  const s = await subs();
  s.list = s.list.filter(x => x.endpoint !== sub.endpoint).concat([{ endpoint: sub.endpoint.slice(0, 600), keys: { p256dh: String(sub.keys.p256dh).slice(0, 200), auth: String(sub.keys.auth).slice(0, 100) }, label: String(label || '').slice(0, 80), at: Date.now() }]).slice(-20);
  await BS.putJSON(SUBS, s); return s.list.length;
}
async function removeSub(endpoint) { const s = await subs(); s.list = s.list.filter(x => x.endpoint !== endpoint); if (BS.on()) await BS.putJSON(SUBS, s); }

async function push(payload) {
  const k = await vapid(); if (!k) return 0;
  const s = await subs(); if (!s.list.length) return 0;
  const wp = require('web-push');
  wp.setVapidDetails('mailto:hello@cielafrica.com', k.publicKey, k.privateKey);
  let n = 0, dead = [];
  await Promise.all(s.list.map(x => wp.sendNotification({ endpoint: x.endpoint, keys: x.keys }, JSON.stringify(payload), { TTL: payload.urgent ? 3 * 86400 : 86400, urgency: payload.urgent ? 'high' : 'normal' })
    .then(() => { n++; }, e => { if (e && (e.statusCode === 404 || e.statusCode === 410)) dead.push(x.endpoint); })));
  if (dead.length) { s.list = s.list.filter(x => dead.indexOf(x.endpoint) < 0); await BS.putJSON(SUBS, s).catch(() => { }); }
  return n;
}

/** e = { kind: 'order'|'lead'|'message'|'whatsapp'|'pages'|…, title, body, url, tag?, urgent? }
    urgent (website leads): stays on the phone until tapped, and comes through quiet hours unless that is switched off.
    The bell keeps what happened to the phone alert (sent / quiet hours / switched off / no device), so a missed alert is explainable. */
const URGENT = ['lead', 'order', 'whatsapp'];
async function event(e) {
  let pushed = null;
  try {
    e.urgent = !!e.urgent || URGENT.includes(e.kind);   /* leads, orders and payments, WhatsApp: high-priority alerts */
    const why = await blocked(e.kind, e.urgent);
    if (why) pushed = why;
    else { const n = await push({ title: e.title, body: e.body, url: e.url || '/admin', tag: e.tag || e.kind, kind: e.kind, urgent: !!e.urgent }); pushed = n ? 'sent:' + n : 'no-device'; }
  } catch (er) { pushed = 'error'; console.error('[hq] push', er && er.message); }
  try {
    const p = await readPulse();
    p.v = (p.v || 0) + 1;
    p.items = [{ kind: e.kind, title: String(e.title || '').slice(0, 120), body: String(e.body || '').slice(0, 200), url: e.url || '/admin', at: Date.now(), pushed }].concat(p.items || []).slice(0, 30);
    await writePulse(p);
  } catch (er) { console.error('[hq] pulse', er && er.message); }
  if (pushed !== null && !/^sent:/.test(pushed)) console.warn('[hq] phone alert not sent', e.kind, pushed);
}
/* which events reach the phone, and quiet hours (Nairobi time); everything still shows in the bell */
const PREFS = 'hq/notify-prefs.json', KINDS = ['lead', 'order', 'whatsapp', 'pages', 'message', 'printer', 'renewal', 'subscriber', 'review', 'instagram'];
async function prefs() { const p = BS.on() ? await BS.getJSON(PREFS).catch(() => null) : null; const o = Object.assign({ kinds: {}, quiet: { on: false, from: '22:00', to: '07:00' } }, p || {}); if (o.quiet.leads === undefined) o.quiet.leads = true; return o; }
async function savePrefs(b) {
  const p = await prefs(); KINDS.forEach(k => { if (b.kinds && typeof b.kinds[k] === 'boolean') p.kinds[k] = b.kinds[k]; });
  if (b.quiet) { const t = v => /^([01]\d|2[0-3]):[0-5]\d$/.test(v || '') ? v : null; p.quiet = { on: !!b.quiet.on, from: t(b.quiet.from) || p.quiet.from, to: t(b.quiet.to) || p.quiet.to, leads: b.quiet.leads === undefined ? p.quiet.leads !== false : !!b.quiet.leads }; }
  if (!BS.on()) throw Object.assign(new Error('Connect the private Blob store first.'), { status: 503, code: 'storage' });
  await BS.putJSON(PREFS, p); return p;
}
/* null = send it; otherwise why not */
async function blocked(kind, urgent) {
  const p = await prefs(); if (p.kinds[kind] === false) return 'off';
  if (p.quiet && p.quiet.on && !(urgent && p.quiet.leads !== false)) {
    const nb = new Date(Date.now() + 3 * 3600e3), m = nb.getUTCHours() * 60 + nb.getUTCMinutes(), f = p.quiet.from.split(':'), t = p.quiet.to.split(':'), a = +f[0] * 60 + +f[1], z = +t[0] * 60 + +t[1];
    if (a > z ? (m >= a || m < z) : (m >= a && m < z)) return 'quiet';
  }
  return null;
}
async function wants(kind, urgent) { return !(await blocked(kind, urgent)); }

module.exports = { event, readPulse, vapid, addSub, removeSub, push, prefs, savePrefs, wants, KINDS };
