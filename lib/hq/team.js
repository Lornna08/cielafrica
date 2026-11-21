/* ============================================================
   CIEL ADMIN — team accounts
   The owner signs in with ADMIN_PASSWORD (cookie cd_admin, unchanged).
   Team members sign in with their email + own password (cookie ca_member)
   and only reach the parts of Ciel Admin the owner ticked for them.
   Stored privately in Blob: hq/team.json
     { owner: { name, avatar }, members: [ { id, name, email, title, perms[], active,
       pass: { s, h }, ver, avatar, createdAt, lastIn } ] }
   Passwords are scrypt-hashed; a member's sessions end when the owner resets
   the password, switches the account off or removes it (ver changes).
   ============================================================ */
const crypto = require('crypto');
const sec = require('../domains/security');
const BS = require('../photobooks/blobstore');

const PATH = 'hq/team.json';
const COOKIE = 'ca_member';
const SESSION_H = 24 * 30;
/* every part of Ciel Admin a member can be given (the menu) */
const SECTIONS = ['overview', 'leads', 'inbox', 'orders', 'invoices', 'instagram', 'projects', 'tasks', 'calendar', 'customers', 'photobooks', 'payments', 'products', 'templates', 'campaigns', 'reviews', 'website', 'content', 'policies', 'analytics', 'reports', 'activity', 'settings'];

let cache = null, cacheAt = 0;
async function load(fresh) {
  if (!fresh && cache && Date.now() - cacheAt < 15000) return cache;
  const d = (BS.on() && await BS.getJSON(PATH).catch(() => null)) || {};
  cache = { owner: d.owner || { name: 'Lorna' }, members: Array.isArray(d.members) ? d.members : [] }; cacheAt = Date.now();
  return cache;
}
async function save(d) { await BS.putJSON(PATH, { owner: d.owner, members: d.members }); cache = d; cacheAt = Date.now(); }

function hash(pw, salt) { salt = salt || crypto.randomBytes(16).toString('hex'); return { s: salt, h: crypto.scryptSync(String(pw), salt, 32).toString('hex') }; }
function checkPw(m, pw) { if (!m || !m.pass || !pw) return false; const x = hash(pw, m.pass.s); return sec.safeEq(x.h, m.pass.h); }

function cookieVal(m) { const exp = Date.now() + SESSION_H * 3600 * 1000, body = exp + '.' + m.id + '.' + (m.ver || 1); return body + '.' + sec.sign('member|' + body); }
function cookie(v, maxAge) { return `${COOKIE}=${v}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`; }

/* who is calling: { owner:true } · { member } · null */
async function who(req) {
  if (req.__who !== undefined) return req.__who;
  let w = null;
  if (sec.secret() && process.env.ADMIN_PASSWORD && sec.checkSession(req)) w = { owner: true };
  else {
    const c = sec.parseCookies(req)[COOKIE];
    if (c && sec.secret()) {
      const p = c.split('.');
      if (p.length === 4 && Number(p[0]) > Date.now() && sec.safeEq(p[3], sec.sign('member|' + p[0] + '.' + p[1] + '.' + p[2]))) {
        const d = await load(); const m = d.members.find(x => x.id === p[1]);
        if (m && m.active !== false && String(m.ver || 1) === p[2]) w = { member: m };
      }
    }
  }
  req.__who = w; return w;
}
const has = (m, list) => !!m && (m.perms || []).some(p => list.indexOf(p) >= 0);

/* which menu sections open each admin route (a member needs any one of them); routes not listed are owner-only */
const ANY = '*';
const LIST_READ = { tasks: ['tasks', 'overview', 'projects'], events: ['calendar', 'overview'], notes: ['customers'], projects: ['projects', 'leads', 'overview'], invoices: ['invoices', 'orders', 'payments', 'reports', 'overview'], expenses: ['reports'] };
const LIST_WRITE = { tasks: ['tasks', 'projects'], events: ['calendar'], notes: ['customers'], projects: ['projects', 'leads'], invoices: ['invoices'], expenses: ['reports'] };
const SITE = ['website', 'products', 'templates', 'content', 'photobooks'];
const MAP = {
  me: ANY, logout: ANY, 'profile-save': ANY, pulse: ANY, 'push-key': ANY, 'push-sub': ANY, 'notify-prefs': ANY, 'notify-prefs-save': ANY, 'push-test': ANY, attn: ANY, 'attn-set': ANY, 'settings-get': ANY,
  'shop-orders': ['orders', 'payments', 'overview', 'reports', 'customers', 'invoices'], 'shop-link': ['orders'], 'shop-status': ['orders'],
  'pf-list': ['orders', 'photobooks'], 'pf-upload': ['orders', 'photobooks'], 'pf-key': ['orders', 'photobooks'], 'pf-attach': ['orders', 'photobooks'], 'pf-remove': ['orders', 'photobooks'], 'dl-info': ['orders', 'photobooks'], dl: ['orders', 'photobooks'],
  inbox: ['inbox', 'leads', 'overview', 'customers'], 'inbox-status': ['inbox', 'leads'], 'lead-update': ['inbox', 'leads'],
  subs: ['campaigns', 'customers'], 'sub-admin': ['campaigns', 'customers'],
  camps: ['campaigns'], 'camp-save': ['campaigns'], 'camp-del': ['campaigns'], 'camp-preview': ['campaigns'], 'camp-test': ['campaigns'], 'camp-send': ['campaigns'], 'camp-schedule': ['campaigns'], 'camp-due': ['campaigns'],
  'settings-save': ['settings'], 'doc-email': ['invoices', 'orders'],
  reviews: ['reviews'], 'review-admin': ['reviews'], 'review-link': ['reviews', 'orders'], 'review-ask': ['reviews', 'orders'],
  activity: ['activity'],
  'site-status': SITE, 'site-draft': SITE, 'site-draft-save': SITE, 'site-versions': SITE, 'site-version': SITE, 'site-publish': SITE,
  'policy-publish': ['policies'], 'policy-history': ['policies'],
  'web-analytics': ['analytics', 'overview', 'reports'],
  'mail-accounts': ['inbox'], 'mail-unread': ['inbox'], 'mail-folders': ['inbox'], 'mail-list': ['inbox'], 'mail-read': ['inbox'], 'mail-att': ['inbox'], 'mail-act': ['inbox'], 'mail-send': ['inbox'], 'mail-settings': ['inbox']
};
function allowed(m, route, q, method) {
  if (route === 'list' || route === 'save') { const t = (route === 'save' ? LIST_WRITE : LIST_READ)[q.c || (q.__c)]; return !!t && has(m, t); }
  if (/^ig-(token|disconnect|connect|key|hook-setup)$/.test(route)) return false;
  if (/^ig-/.test(route)) return has(m, ['instagram']);
  const r = MAP[route]; if (!r) return false;
  return r === ANY || has(m, r);
}

/* what the app gets about the signed-in person (never the password hash) */
function pub(m) { return { id: m.id, name: m.name, email: m.email, title: m.title || '', perms: m.perms || [], active: m.active !== false, avatar: m.avatar || '', createdAt: m.createdAt, lastIn: m.lastIn || null }; }

const cleanS = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, n || 120);
function okAvatar(a) { return a === '' || (typeof a === 'string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(a) && a.length < 120000); }

/* Photo Books and Domains admin APIs: let a member in when they were given one of these parts */
function gate(handler, sections, writers) {
  return async (req, res) => {
    try { if (sec.parseCookies(req)[COOKIE]) { req.__route = null; const w = await who(req); if (w && w.member && has(w.member, req.method === 'GET' ? sections : writers)) req.__teamOk = true; } } catch (e) { }
    return handler(req, res);
  };
}
module.exports = { gate, load, save, hash, checkPw, cookieVal, cookie, who, has, allowed, pub, SECTIONS, COOKIE, SESSION_H, cleanS, okAvatar };
