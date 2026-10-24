/* CIEL DOMAINS — secrets, admin sessions, rate limiting, request helpers */
const crypto = require('crypto');

function secret() {
  if (process.env.DOMAINS_SECRET) return process.env.DOMAINS_SECRET;
  if (process.env.ADMIN_PASSWORD) return crypto.createHash('sha256').update('ciel-domains|' + process.env.ADMIN_PASSWORD).digest('hex');
  // server-only M-Pesa credentials are a safe fallback seed for signing tokens
  if (process.env.MPESA_CONSUMER_SECRET && process.env.MPESA_PASSKEY) return crypto.createHash('sha256').update('ciel-domains|' + process.env.MPESA_CONSUMER_SECRET + '|' + process.env.MPESA_PASSKEY).digest('hex');
  return null;
}
const hmac = (s, data) => crypto.createHmac('sha256', s).update(data).digest('base64url');
function sign(data) { const s = secret(); return s ? hmac(s, data) : null; }
function safeEq(a, b) { a = Buffer.from(String(a || '')); b = Buffer.from(String(b || '')); return a.length === b.length && a.length > 0 && crypto.timingSafeEqual(a, b); }
function randomId(bytes) { return crypto.randomBytes(bytes || 18).toString('base64url'); }
function sha(s) { return crypto.createHash('sha256').update(String(s)).digest('hex'); }

// Crockford base32 (no I L O U) — readable order references
const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
function orderRef() { const b = crypto.randomBytes(5); let n = BigInt('0x' + b.toString('hex')), s = ''; for (let i = 0; i < 8; i++) { s = B32[Number(n % 32n)] + s; n /= 32n; } return 'CD-' + s; }

/* ---------- admin session (HttpOnly cookie, 12h) ---------- */
const COOKIE = 'cd_admin';
const SESSION_H = 12;
function makeSession() {
  const exp = Date.now() + SESSION_H * 3600 * 1000, id = randomId(9);
  const body = exp + '.' + id;
  return body + '.' + sign('session|' + body);
}
function checkSession(req) {
  const c = parseCookies(req)[COOKIE]; if (!c) return false;
  const parts = c.split('.'); if (parts.length !== 3) return false;
  const [exp, id, sig] = parts;
  if (!(Number(exp) > Date.now())) return false;
  return safeEq(sig, sign('session|' + exp + '.' + id));
}
function sessionCookie(v, maxAge) {
  return `${COOKIE}=${v}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}
function checkPassword(p) { return !!process.env.ADMIN_PASSWORD && safeEq(sha('pw|' + p), sha('pw|' + process.env.ADMIN_PASSWORD)); }

function parseCookies(req) {
  const out = {}; String(req.headers.cookie || '').split(';').forEach(p => { const i = p.indexOf('='); if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); });
  return out;
}
function clientIp(req) {
  return String(req.headers['x-real-ip'] || (req.headers['x-forwarded-for'] || '').split(',')[0] || (req.socket && req.socket.remoteAddress) || 'unknown').trim();
}

/** fixed-window limiter: returns true when allowed */
async function rateLimit(store, bucket, id, max, windowSec) {
  const k = 'dc:rl:' + bucket + ':' + sha(id).slice(0, 16) + ':' + Math.floor(Date.now() / (windowSec * 1000));
  try { const n = await store.incr(k, windowSec + 5); return n <= max; } catch (e) { return true; } // never block on store failure
}

/** same-origin check for state-changing browser requests */
function sameOrigin(req) {
  const o = req.headers.origin; if (!o) return req.headers['x-requested-with'] === 'ciel';
  try { const h = new URL(o).host; return h === req.headers.host || /(^|\.)cielafrica\.com$/.test(h) || /^(127\.0\.0\.1|localhost)(:\d+)?$/.test(h); } catch (e) { return false; }
}

module.exports = { secret, sign, safeEq, randomId, sha, orderRef, makeSession, checkSession, sessionCookie, checkPassword, clientIp, rateLimit, sameOrigin, parseCookies, COOKIE, SESSION_H };
