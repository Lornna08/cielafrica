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
  await Promise.all(s.list.map(x => wp.sendNotification({ endpoint: x.endpoint, keys: x.keys }, JSON.stringify(payload), { TTL: 86400, urgency: 'high' })
    .then(() => { n++; }, e => { if (e && (e.statusCode === 404 || e.statusCode === 410)) dead.push(x.endpoint); })));
  if (dead.length) { s.list = s.list.filter(x => dead.indexOf(x.endpoint) < 0); await BS.putJSON(SUBS, s).catch(() => { }); }
  return n;
}

/** e = { kind: 'order'|'message'|'whatsapp'|'pages', title, body, url } */
async function event(e) {
  try {
    const p = await readPulse();
    p.v = (p.v || 0) + 1;
    p.items = [{ kind: e.kind, title: String(e.title || '').slice(0, 120), body: String(e.body || '').slice(0, 200), url: e.url || '/admin', at: Date.now() }].concat(p.items || []).slice(0, 30);
    await writePulse(p);
  } catch (er) { console.error('[hq] pulse', er && er.message); }
  try { await push({ title: e.title, body: e.body, url: e.url || '/admin', tag: e.tag || e.kind }); } catch (er) { console.error('[hq] push', er && er.message); }
}

module.exports = { event, readPulse, vapid, addSub, removeSub, push };
