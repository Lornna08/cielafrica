/* ============================================================
   CIEL ADMIN — Instagram (Instagram API with Unified Login)
   Meta no longer offers "Instagram login" to new apps, so this uses Unified
   login: Facebook Login for Business with a login configuration (config_id).
   · connect: /admin → Instagram → Connect opens Meta's sign-in (with
     Instagram or Facebook); Meta sends the browser back to /api/ig-callback
     with a code, which is swapped for a business (system-user) token that
     doesn't expire. If Meta returns a normal user token instead, it is made
     long-lived (60 days) and renewed automatically.
   · posts: photo, carousel (2–10), reel and story; publish now or
     schedule. Scheduled posts are published by /api/hq?route=ig-cron
     (called every ~15 minutes by .github/workflows/instagram.yml, and
     whenever Ciel Admin is open).
   · messages (DMs), comments (reply, hide, delete), profile and stats.
   Media sits in the private Blob store (hq/ig/media/…); Instagram reads it
   through a signed link (/api/hq?route=ig-file&k=…) that only works for
   that one file.
   Needs: IG_APP_SECRET = the App secret (Meta app → App settings → Basic).
   The Meta App ID (1787373005877426) is built in. Optional: IG_CONFIG_ID (the Unified
   login configuration ID; defaults to Ciel's), IG_API_VERSION (default v26.0).
   The token never leaves the server.
   ============================================================ */
const crypto = require('crypto');
const sec = require('../domains/security');
const BS = require('../photobooks/blobstore');

const ACC = 'hq/ig/account.json', POSTS = 'hq/ig/posts.json', LOCK = 'hq/ig/lock.json';
const SITE = 'https://cielafrica.com';
const REDIRECT = SITE + '/api/ig-callback';
/* the permissions come from the login configuration in the Meta app (Instagram → API setup with Unified login) */
const SCOPES = ['instagram_basic', 'instagram_content_publish', 'instagram_manage_messages', 'instagram_manage_comments', 'instagram_manage_insights'];
const CONFIG_ID = () => /^\d{6,25}$/.test(process.env.IG_CONFIG_ID || '') ? process.env.IG_CONFIG_ID : '1867663284432366';
const ver = () => /^v\d+\.\d+$/.test(process.env.IG_API_VERSION || '') ? process.env.IG_API_VERSION : 'v26.0';
const G = p => 'https://graph.facebook.com/' + ver() + p;
const err = (status, code, message) => Object.assign(new Error(message), { status, code });
/* Ciel's Meta App ID is public (it appears in every sign-in link), so it is built in; IG_APP_ID isn't
   used any more (an Instagram app ID or a stray space there broke sign-in). For another Meta app, set
   META_APP_ID. */
const APP_ID = () => { const v = String(process.env.META_APP_ID || '').trim().replace(/^["']+|["']+$/g, '').trim(); return /^\d{10,20}$/.test(v) ? v : '1787373005877426'; };
const SECRET = () => String(process.env.IG_APP_SECRET || '').trim().replace(/^["']+|["']+$/g, '').trim();
const configured = () => !!SECRET();
const clean = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, ' ').slice(0, n || 2200);

/* ---------- small helpers ---------- */
let F = (...a) => fetch(...a);
function setFetch(f) { if (f) F = f; }
/* Instagram allows the app a limited number of calls an hour. When it says we're close (or over), looking at other
   accounts pauses for a while and the page shows what it already has; posting, messages and our own profile carry on. */
const RATE = [4, 17, 32, 613], COOLF = 'hq/ig/cool.json';
let COOL = 0, COOLREAD = 0;
async function cool(ms) { COOL = Math.max(COOL, Date.now() + ms); if (BS.on()) await BS.putJSON(COOLF, { until: COOL }).catch(() => { }); }
async function cooling() {
  if (COOL > Date.now()) return true;
  if (BS.on() && Date.now() - COOLREAD > 30e3) { COOLREAD = Date.now(); const d = await BS.getJSON(COOLF).catch(() => null); if (d && d.until) COOL = Math.max(COOL, d.until); }
  return COOL > Date.now();
}
async function call(url, opt) {
  const r = await F(url, Object.assign({ signal: AbortSignal.timeout(25000) }, opt || {}));
  let j = null; try { j = await r.json(); } catch (e) { }
  try {   /* Meta reports how much of the hour's allowance is used, in percent */
    const u = [r.headers.get('x-app-usage'), r.headers.get('x-business-use-case-usage')].filter(Boolean).join('');
    const pct = Math.max(0, ...(u.match(/"(call_count|total_time|total_cputime)":\s*(\d+)/g) || []).map(m => +m.split(':')[1]));
    if (pct >= 75) cool(pct >= 90 ? 40 * 60e3 : 15 * 60e3);
  } catch (e) { }
  if (!r.ok || (j && j.error)) {
    const e = (j && j.error) || {}, m = e.error_user_msg || e.message || ('Instagram error ' + r.status);
    if (RATE.includes(e.code)) { await cool(45 * 60e3); const x = err(429, 'ig-rate', 'Instagram needs a short break. This will show again in a few minutes.'); x.rate = true; x.ig = { code: e.code }; throw x; }
    const x = err(r.status === 401 || e.code === 190 ? 401 : 502, 'ig', m); x.ig = { code: e.code, sub: e.error_subcode, type: e.type }; if (e.code === 190) x.expired = true; throw x;
  }
  return j || {};
}
async function account() { return BS.on() ? await BS.getJSON(ACC).catch(() => null) : null; }
async function token() {
  const a = await account(); if (!a || !a.token) throw err(409, 'ig-connect', 'Connect your Instagram account first.');
  return a;
}
const q = o => Object.entries(o).filter(([, v]) => v != null && v !== '').map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v)).join('&');
async function get(path, params, a) {
  a = a || await token();
  try { return await call(G(path) + '?' + q(Object.assign({}, params, { access_token: a.token }))); }
  catch (e) {   /* the token works but can no longer see the account: it was unassigned in Business Settings */
    if (a.userId && path.indexOf('/' + a.userId) === 0 && e.ig && e.ig.code === 100 && e.ig.sub === 33) e.message = 'Meta no longer lets this connection see @' + (a.username || 'your account') + '. In Meta Business Settings → Users → System users → your system user → Assigned assets, add the Instagram account back with full control (and make sure the account is still in the business portfolio), then refresh.';
    throw e;
  }
}
async function post(path, params, a) { a = a || await token(); return call(G(path), { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: q(Object.assign({}, params, { access_token: a.token })) }); }
async function postJSON(path, obj, a) { a = a || await token(); return call(G(path), { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + a.token }, body: JSON.stringify(obj) }); }
async function del(path, a) { a = a || await token(); return call(G(path) + '?access_token=' + encodeURIComponent(a.token), { method: 'DELETE' }); }

/* ---------- signed values (OAuth state, media links) ---------- */
function signed(obj, ttlSec) { const s = Buffer.from(JSON.stringify(Object.assign({ e: Math.floor(Date.now() / 1000) + ttlSec }, obj))).toString('base64url'); return s + '.' + sec.sign('ig|' + s); }
function unsign(t) {
  const [s, m] = String(t || '').split('.'); if (!s || !m || !sec.safeEq(m, sec.sign('ig|' + s))) return null;
  try { const o = JSON.parse(Buffer.from(s, 'base64url').toString()); return o.e > Date.now() / 1000 ? o : null; } catch (e) { return null; }
}
/** a public link to one private media file, for Instagram (and the admin preview) to read */
function fileUrl(path, days) { return SITE + '/api/hq?route=ig-file&k=' + signed({ p: path }, (days || 14) * 86400); }

/* ---------- connect / disconnect ---------- */
function connectUrl() {
  if (!configured()) throw err(503, 'ig-setup', 'Add IG_APP_SECRET (your Meta App secret) in Vercel first, then redeploy.');
  if (!sec.secret()) throw err(503, 'setup', 'Missing signing secret.');
  return 'https://www.facebook.com/' + ver() + '/dialog/oauth?' + q({ client_id: APP_ID(), redirect_uri: REDIRECT, config_id: CONFIG_ID(), response_type: 'code', override_default_response_type: 'true', state: signed({ n: crypto.randomBytes(6).toString('hex') }, 900) });
}
const exchange = tok => call(G('/oauth/access_token') + '?' + q({ grant_type: 'fb_exchange_token', client_id: APP_ID(), client_secret: SECRET(), fb_exchange_token: tok }));
/** find the Instagram professional account the token can manage. Tries, in order: the accounts the
    token was granted (debug_token), /me/assigned_instagram_accounts, the business portfolio's accounts,
    and an account linked to a Facebook Page. Every step is logged (never the token). */
async function findAccount(a) {
  const F_ = 'id,username,name,profile_picture_url', notes = [], ids = [];
  const note = (step, e) => notes.push(step + ': ' + (e && e.message ? e.message.slice(0, 160) : e));
  const add = id => { id = String(id || ''); if (/^\d{5,25}$/.test(id) && !ids.includes(id)) ids.push(id); };
  /* 1 · what the token was granted, and on which accounts */
  let granted = [];
  try {
    const d = (await call(G('/debug_token') + '?' + q({ input_token: a.token, access_token: APP_ID() + '|' + SECRET() }))).data || {};
    granted = d.scopes || []; a.scopes = granted; a.tokenType = d.type || '';
    if (d.expires_at === 0) a.expiresAt = null; else if (d.expires_at > 0) a.expiresAt = d.expires_at * 1000;
    if (d.is_valid === false) throw err(400, 'ig-token', 'Meta says this access token isn’t valid' + (d.error && d.error.message ? ': ' + d.error.message : '.'));
    (d.granular_scopes || []).forEach(g => { if (/^instagram_/.test(g.scope)) (g.target_ids || []).forEach(add); });
    note('debug_token', 'type ' + (d.type || '?') + ', scopes ' + granted.join(' ') + ', ig targets ' + (ids.join(' ') || 'none'));
  } catch (e) { if (e.expired || e.code === 'ig-token') throw e; note('debug_token', e); }
  /* a user token (Facebook Login for Business, "User access token"): the Instagram account comes
     through the Facebook Page it is linked to; that also gives the Page token used for messages */
  const tryPages = async () => {
    try {
      const pages = ((await get('/me/accounts', { fields: 'id,name,access_token,instagram_business_account{' + F_ + '}', limit: 100 }, a)).data || []);
      note('pages', pages.length + ' pages, ' + pages.filter(p => p.instagram_business_account).length + ' with Instagram');
      const p = pages.find(x => x.instagram_business_account && (!ids.length || ids.includes(String(x.instagram_business_account.id)))) || pages.find(x => x.instagram_business_account);
      if (p) { const ig = p.instagram_business_account; return Object.assign(a, { userId: String(ig.id), username: ig.username, name: ig.name || '', picture: ig.profile_picture_url || '', via: 'page', pageId: String(p.id), pageName: p.name || '', pageToken: p.access_token || '' }); }
    } catch (e) { if (e.expired) throw e; note('pages', e); }
    return null;
  };
  if (a.tokenType && a.tokenType !== 'SYSTEM_USER') { const r = await tryPages(); if (r) { console.log('[ig] connect', notes.join(' | ')); return r; } }
  /* 2 · accounts assigned to the business token */
  if (!ids.length) { try { const r = await get('/me/assigned_instagram_accounts', { fields: 'id,username', limit: 50 }, a); (r.data || []).forEach(x => add(x.id)); note('assigned', (r.data || []).length + ' found'); } catch (e) { if (e.expired) throw e; note('assigned', e); } }
  /* 3 · the business portfolio's Instagram accounts */
  if (!ids.length) {
    try {
      const me = await get('/me', { fields: 'id,name,client_business_id' }, a); note('me', (me.name || '') + ' biz ' + (me.client_business_id || 'none'));
      if (me.client_business_id) for (const edge of ['instagram_accounts', 'owned_instagram_accounts', 'client_instagram_accounts']) {
        try { const r = await get('/' + me.client_business_id + '/' + edge, { fields: 'id,username', limit: 50 }, a); (r.data || []).forEach(x => add(x.id)); note(edge, (r.data || []).length + ' found'); if (ids.length) break; } catch (e) { note(edge, e); }
      }
    } catch (e) { if (e.expired) throw e; note('me', e); }
  }
  /* 4 · an Instagram account linked to a Facebook Page */
  if (!ids.length && (!a.tokenType || a.tokenType === 'SYSTEM_USER')) { const r = await tryPages(); if (r) { console.log('[ig] connect', notes.join(' | ')); return r; } }
  console.log('[ig] connect', notes.join(' | '));
  if (!ids.length) throw err(400, 'ig-none', 'No Instagram account was shared. Connect again and tick your Instagram account when Meta asks which accounts to share.');
  let ig = { id: ids[0] };
  try { ig = await get('/' + ids[0], { fields: F_ }, a); } catch (e) { if (e.expired) throw e; console.log('[ig] profile', e.message); }
  return Object.assign(a, { userId: String(ig.id || ids[0]), username: ig.username || '', name: ig.name || '', picture: ig.profile_picture_url || '', via: 'business' });
}
async function callback(qs) {
  if (qs.error) throw err(400, 'ig-denied', qs.error_description || qs.error_message || 'Sign-in was cancelled.');
  if (!unsign(qs.state)) throw err(400, 'ig-state', 'This sign-in link expired. Start again from Ciel Admin → Instagram.');
  const code = String(qs.code || '').replace(/#_$/, ''); if (!code) throw err(400, 'ig-code', 'Meta didn’t send a code.');
  const s = await call(G('/oauth/access_token') + '?' + q({ client_id: APP_ID(), client_secret: SECRET(), redirect_uri: REDIRECT, code }));
  let tok = s.access_token, expiresAt = null;
  if (s.expires_in) {   /* a normal (short-lived) user token: make it long-lived. Business tokens come without expires_in and never expire. */
    expiresAt = Date.now() + s.expires_in * 1000;
    if (s.expires_in < 7 * 86400) { try { const l = await exchange(tok); tok = l.access_token; expiresAt = Date.now() + (l.expires_in || 5184000) * 1000; } catch (e) { console.error('[ig] long-lived', e.message); } }
  }
  const a = { token: tok, expiresAt, refreshedAt: Date.now(), connectedAt: Date.now(), scopes: SCOPES };
  await findAccount(a);
  await BS.putJSON(ACC, a);
  return a;
}
/** connect with an access token made in Business Settings → System users → Generate token
    (or any token for this app that can manage the Instagram account) */
async function connectToken(tok) {
  tok = String(tok || '').trim();
  if (!/^[A-Za-z0-9_\-|.]{40,1000}$/.test(tok)) throw err(400, 'ig-token', 'That doesn’t look like an access token. Copy the whole token from Meta and paste it again.');
  const a = { token: tok, expiresAt: null, refreshedAt: Date.now(), connectedAt: Date.now(), scopes: SCOPES, how: 'token' };
  await findAccount(a);
  await BS.putJSON(ACC, a);
  return a;
}
async function disconnect() { await BS.del([ACC]).catch(() => { }); }
/** business tokens never expire; a long-lived user token is renewed when less than 20 days are left */
async function refreshToken(force) {
  const a = await account(); if (!a || !a.token) return null;
  if (!a.expiresAt || (!force && a.expiresAt - Date.now() > 20 * 864e5)) return a;
  const r = await exchange(a.token);
  a.token = r.access_token; a.expiresAt = Date.now() + (r.expires_in || 5184000) * 1000; a.refreshedAt = Date.now();
  if (a.pageId) { try { const p = await get('/' + a.pageId, { fields: 'access_token' }, a); if (p.access_token) a.pageToken = p.access_token; } catch (e) { } }
  await BS.putJSON(ACC, a); return a;
}
function publicAccount(a) { return a ? { userId: a.userId, username: a.username, name: a.name, picture: a.picture, expiresAt: a.expiresAt || null, connectedAt: a.connectedAt, via: a.via || '', pageName: a.pageName || '' } : null; }

/* ---------- profile, posts, stats ---------- */
async function profile() {
  const a = await token();
  const me = await get('/' + a.userId, { fields: 'id,username,name,biography,website,profile_picture_url,followers_count,follows_count,media_count' }, a);
  if (me.profile_picture_url && me.profile_picture_url !== a.picture) { a.picture = me.profile_picture_url; a.username = me.username; await BS.putJSON(ACC, a).catch(() => { }); }
  let limit = null; try { const l = await get('/' + a.userId + '/content_publishing_limit', { fields: 'quota_usage,config' }, a); limit = l.data && l.data[0]; } catch (e) { }
  return { profile: me, limit };
}
async function insights(days) {
  const a = await token(), until = Math.floor(Date.now() / 1000), since = until - (days || 7) * 86400, out = {};
  for (const m of ['reach', 'views', 'accounts_engaged', 'total_interactions', 'likes', 'comments', 'shares', 'saves', 'profile_links_taps', 'follows_and_unfollows']) {
    try { const r = await get('/' + a.userId + '/insights', { metric: m, period: 'day', metric_type: 'total_value', since, until }, a); const d = r.data && r.data[0]; if (d) out[m] = d.total_value ? (d.total_value.value != null ? d.total_value.value : (d.total_value.breakdowns || [])) : null; } catch (e) { }
  }
  try { const r = await get('/' + a.userId + '/insights', { metric: 'follower_count', period: 'day', since, until }, a); out.follower_count = ((r.data && r.data[0] && r.data[0].values) || []).map(v => ({ at: v.end_time, n: v.value })); } catch (e) { }
  return out;
}
const MEDIA_F = 'id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count,comment_enabled,children{media_type,media_url,thumbnail_url}';
async function media(after) { const a = await token(); return get('/' + a.userId + '/media', { fields: MEDIA_F, limit: 24, after }, a); }
async function mediaOne(id) { return get('/' + id, { fields: MEDIA_F }); }
async function mediaInsights(id, type) {
  const metrics = type === 'STORY' ? 'reach,views,replies,navigation' : 'reach,views,likes,comments,shares,saved,total_interactions';
  try { const r = await get('/' + id + '/insights', { metric: metrics }); const o = {}; (r.data || []).forEach(d => { o[d.name] = d.values && d.values[0] ? d.values[0].value : (d.total_value && d.total_value.value); }); return o; } catch (e) { return { error: e.message }; }
}
async function setComments(id, on) { return post('/' + id, { comment_enabled: on ? 'true' : 'false' }); }

/* ---------- comments ---------- */
async function comments(id) { return get('/' + id + '/comments', { fields: 'id,text,username,timestamp,like_count,hidden,from{id,username},replies{id,text,username,timestamp,hidden,from{id,username}}', limit: 50 }); }
async function reply(commentId, text) { return post('/' + commentId + '/replies', { message: clean(text, 2200) }); }
async function hide(commentId, on) { return post('/' + commentId, { hide: on ? 'true' : 'false' }); }
async function delComment(commentId) { return del('/' + commentId); }

/* ---------- messages ----------
   Business connection: the Instagram account's own conversations/messages.
   Connected through a Facebook Page: the Page's Instagram inbox, with the Page token. */
/* messages go through the Facebook Page linked to the account (the Page's Instagram inbox); found once and kept */
async function msgAcc() {
  let a = await token();
  if (!a.pageId && (!globalThis.__igPageTry || Date.now() - globalThis.__igPageTry > 600e3)) {
    globalThis.__igPageTry = Date.now();
    try {
      const pages = ((await get('/me/accounts', { fields: 'id,name,access_token,instagram_business_account{id}', limit: 100 }, a)).data || []);
      const p = pages.find(x => x.instagram_business_account && String(x.instagram_business_account.id) === String(a.userId));
      if (p) { a = Object.assign({}, a, { pageId: String(p.id), pageName: p.name || '', pageToken: p.access_token || '' }); await BS.putJSON(ACC, a); }
    } catch (e) { console.log('[ig] page', e.message); }
  }
  return a.pageId && a.pageToken ? { box: a.pageId, a: Object.assign({}, a, { token: a.pageToken }) } : { box: a.userId, a };
}
const MSGHELP = u => 'Instagram messages aren’t reaching the app yet. Three things switch them on: (1) in the Instagram app on your phone: Settings → Messages and story replies → Message controls → Connected tools → turn on “Allow access to messages”; (2) in Meta Business Settings, the Facebook Page linked to @' + u + ' is assigned to the system user with full control; (3) the token was generated with instagram_manage_messages, pages_manage_metadata, pages_show_list and pages_messaging ticked, then pasted in ⋯ → Reconnect.';
async function conversations(after) {
  const { box, a } = await msgAcc();
  try { return await get('/' + box + '/conversations', { platform: 'instagram', fields: 'id,updated_time,participants,messages.limit(1){id,message,from,created_time,attachments}', limit: 25, after }, a); }
  catch (e) { if (e.rate || e.expired) throw e; console.log('[ig] messages', e.message); throw err(409, 'ig-msg', MSGHELP(a.username || 'the account')); }
}
async function thread(id) {
  const { a } = await msgAcc();
  const r = await get('/' + id, { fields: 'id,participants,messages.limit(40){id,message,from,to,created_time,attachments,story,shares,reactions}' }, a);
  return Object.assign(r, { me: a.userId, username: a.username });
}
async function sendMessage(to, text, imagePath) {
  const { box, a } = await msgAcc();
  if (imagePath) await postJSON('/' + box + '/messages', { recipient: { id: String(to) }, message: { attachment: { type: 'image', payload: { url: fileUrl(imagePath, 2) } } } }, a);
  if (text) return postJSON('/' + box + '/messages', { recipient: { id: String(to) }, message: { text: clean(text, 1000) } }, a);
  return { ok: true };
}

/* ---------- engagement: likes, comments, deleting posts ---------- */
/** like / unlike a post, reel or comment (Likes API; needs instagram_manage_engagement) */
async function like(kind, id, on) {
  const a = await token(), p = '/' + a.userId + '/likes', params = kind === 'comment' ? { comment_id: id } : { media_id: id };
  try { return on ? await post(p, params, a) : await call(G(p) + '?' + q(Object.assign({}, params, { access_token: a.token })), { method: 'DELETE' }); }
  catch (e) { if (/permission|\(#(10|200)\)/i.test(e.message)) e.message = 'Liking needs the instagram_manage_engagement permission. Generate a new token with it ticked, then connect again.'; throw e; }
}
async function addComment(mediaId, text) { return post('/' + mediaId + '/comments', { message: clean(text, 2200) }); }
async function deleteMedia(id) { return del('/' + id); }

/* ---------- other accounts (business discovery), your feed of them, posts you're tagged in ---------- */
const DM_F = 'id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count';
const FOLLOW = 'hq/ig/follow.json';
function uname(u) { u = String(u || '').replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').split(/[/?#]/)[0].trim().toLowerCase(); if (!/^[a-z0-9._]{1,30}$/.test(u)) throw err(400, 'user', 'Type an Instagram username, like ciel.africa.'); return u; }
const slim = x => ({ id: x.id, caption: String(x.caption || '').slice(0, 600), media_type: x.media_type, media_product_type: x.media_product_type, media_url: x.media_url, thumbnail_url: x.thumbnail_url, permalink: x.permalink, timestamp: x.timestamp, like_count: x.like_count, comments_count: x.comments_count, owner: x.owner, children: x.children && x.children.data ? { data: x.children.data.slice(0, 10).map(k => ({ media_type: k.media_type, media_url: k.media_url, thumbnail_url: k.thumbnail_url })) } : undefined });
const UDOC = u => 'hq/ig/u/' + u + '.json';
const USLIM = r => ({ profile: r.profile, items: r.items.slice(0, 12).map(slim), after: r.after });
/** another account's profile and latest posts. Kept for 2 hours (one Instagram call per account per 2 hours at most);
    when Instagram asks for a break, the saved copy is shown however old it is. */
async function discover(username, after, limit, opt) {
  const u = uname(username), fresh = (opt && opt.fresh) || 2 * 3600e3;
  if (!after && BS.on()) {
    const c = await BS.getJSON(UDOC(u)).catch(() => null);
    if (c && c.v && (Date.now() - c.at < fresh || await cooling())) return c.v;
    if (await cooling()) throw Object.assign(err(429, 'ig-rate', 'Instagram needs a short break. @' + u + ' will show in a few minutes.'), { rate: true });
    const v = await discoverLive(u, null, Math.max(limit || 0, 12));
    await BS.putJSON(UDOC(u), { at: Date.now(), v: USLIM(v) }).catch(() => { });
    return v;
  }
  if (await cooling()) throw Object.assign(err(429, 'ig-rate', 'Instagram needs a short break. Try loading more in a few minutes.'), { rate: true });
  return discoverLive(u, after, limit);
}
async function discoverLive(username, after, limit) {
  const a = await token(), u = uname(username);
  const f = kids => 'business_discovery.username(' + u + '){id,username,name,biography,website,profile_picture_url,followers_count,follows_count,media_count,media' + (after ? '.after(' + after + ')' : '') + '.limit(' + (limit || 24) + '){' + DM_F + (kids ? ',children{media_type,media_url,thumbnail_url}' : '') + '}}';
  let r;
  try { r = await get('/' + a.userId, { fields: f(true) }, a); }
  catch (e) {
    if (e.expired || e.rate) throw e;
    if (/children/i.test(e.message)) r = await get('/' + a.userId, { fields: f(false) }, a);
    else { if (/cannot find|does not exist|not found|invalid user/i.test(e.message) || (e.ig && e.ig.code === 110)) e.message = '@' + u + ' wasn’t found. Only business and creator accounts can be viewed here (Instagram doesn’t share personal accounts with apps).'; throw e; }
  }
  const d = r.business_discovery || {}, m = d.media || {};
  return { profile: Object.assign({}, d, { media: undefined }), items: (m.data || []).map(x => Object.assign(x, { owner: { username: d.username, picture: d.profile_picture_url } })), after: m.paging && m.paging.cursors && m.paging.next ? m.paging.cursors.after : null };
}
/* the accounts in the feed: some to start with (design, tech, business, Kenyan creators and some fun), then two new
   ones join by themselves every few hours, never one someone took out */
const MAXF = 80;
const SEED = ['dribbble', 'behance', 'adobe', 'figma', 'canva', 'apple', 'google', 'spotify', 'netflix', 'mkbhd', 'techcrunch', 'ycombinator', 'theverge', 'wired',
  'nasa', 'natgeo', 'magicalkenya', 'safaricomplc', 'crazy_kennar', 'eddiebutita', 'abelmutua', 'mammito_eunice', 'zachking', 'khaby00', 'dudeperfect',
  'dogsofinstagram', 'catsofinstagram', 'goodnews_movement', 'tasty', '9gag'];
const POOL = ['awwwards', 'webflow', 'framer', 'notionhq', 'openai', 'microsoft', 'samsung', 'nike', 'adidas', 'redbull', 'gopro', 'disney', 'pixar', 'marvel',
  'houseofhighlights', 'espn', 'premierleague', 'nba', 'sautisol', 'nyashinski', 'gordongram', 'buzzfeedtasty', 'therock', 'kevinhart4real', 'trevornoah', 'nbcsnl',
  'unsplash', 'pentagram', 'ted', 'forbes', 'fastcompany', 'bloombergbusiness', 'nikonusa', 'canonusa', 'sony', 'lego', 'ikea', 'airbnb', 'tesla', 'polestar'];
async function following() {
  const f = (BS.on() && await BS.getJSON(FOLLOW).catch(() => null)) || { list: [] };
  if ((f.seeded || 0) < 1 && BS.on()) {
    const have = new Set(f.list.map(x => x.username));
    f.list = f.list.concat(SEED.filter(u => !have.has(u)).map(u => ({ username: u, name: '', picture: '', at: Date.now(), seed: true }))).slice(0, MAXF);
    f.seeded = 1; await BS.putJSON(FOLLOW, f).catch(() => { });
  }
  return f;
}
function addFromPool(f) {
  if (f.list.length >= MAXF || (f.poolAt && Date.now() - f.poolAt < 3 * 3600e3)) return false;
  const have = new Set(f.list.map(x => x.username).concat(f.removed || [], f.poolTried || []));
  const next = POOL.filter(u => !have.has(u)).slice(0, 2);
  f.poolAt = Date.now(); f.poolTried = (f.poolTried || []).concat(next).slice(-200);
  next.forEach(u => f.list.push({ username: u, name: '', picture: '', at: Date.now(), seed: true, added: Date.now() }));
  return next.length > 0;
}
const FEEDDOC = 'hq/ig/feed.json';
let FEED = null;
async function setFollow(username, on, info) {
  const u = uname(username), f = await following();
  f.list = f.list.filter(x => x.username !== u);
  if (on) f.list.unshift({ username: u, name: clean(info && info.name, 80), picture: String((info && info.picture) || '').slice(0, 1000), at: Date.now(), added: Date.now() });
  if (!on) f.removed = [u].concat((f.removed || []).filter(x => x !== u)).slice(0, 200);
  f.list = f.list.slice(0, MAXF); await BS.putJSON(FOLLOW, f);
  /* update the saved feed straight away: add (or take out) just this account's posts */
  try {
    const d = await BS.getJSON(FEEDDOC).catch(() => null);
    if (d && d.v) {
      let items = d.v.items.filter(x => !(x.owner && x.owner.username === u));
      if (on) { const r = await discover(u, null, 12); items = items.concat(r.items.map(m => slim(Object.assign({}, m, { owner: { username: u, picture: r.profile.profile_picture_url || '' } })))).sort((x, y) => new Date(y.timestamp) - new Date(x.timestamp)); }
      d.v = Object.assign({}, d.v, { items: items.slice(0, 300), following: f.list.map(x => ({ username: x.username, name: x.name, picture: x.picture, added: x.added || 0 })) });
      FEED = d; await BS.putJSON(FEEDDOC, d);
    }
  } catch (e) { FEED = null; }
  return f;
}
/** several accounts at once: added straight away, their posts arrive with the next refreshes */
async function followMany(names) {
  const f = await following(), have = new Set(f.list.map(x => x.username)), added = [];
  for (const n of (Array.isArray(names) ? names : String(names || '').split(/[\s,]+/))) {
    let u = ''; try { u = uname(String(n)); } catch (e) { continue; }
    if (!u || have.has(u)) continue; have.add(u); added.push(u);
    f.list.unshift({ username: u, name: '', picture: '', at: Date.now(), added: Date.now() });
  }
  f.removed = (f.removed || []).filter(x => !added.includes(x));
  f.list = f.list.slice(0, MAXF); await BS.putJSON(FOLLOW, f);
  return { list: f.list, added: added.length };
}
/** our own stories (Instagram only shares our own, for 24 hours) */
async function myStories(a) { try { return ((await get('/' + a.userId + '/stories', { fields: 'id,media_type,media_url,thumbnail_url,timestamp,permalink' }, a)).data || []).slice(0, 30); } catch (e) { return []; } }
/* the feed is put together from each account's saved copy. Each run refreshes only the few oldest accounts,
   so the whole list is renewed every couple of hours without ever coming near Instagram's hourly allowance. */
async function buildFeed(maxCalls) {
  const a = await token(), f = await following(); addFromPool(f); const list = f.list.slice(0, MAXF);
  const saved = await Promise.all(list.map(x => BS.getJSON(UDOC(x.username)).catch(() => null)));
  const prev = await BS.getJSON(FEEDDOC).catch(() => null), had = {};
  ((prev && prev.v && prev.v.items) || []).forEach(m => { const k = m.owner && !m.owner.me && m.owner.username; if (k) (had[k] = had[k] || []).push(m); });
  list.forEach((x, i) => { if (!saved[i] && had[x.username]) saved[i] = { at: 1, v: { profile: null, items: had[x.username] } }; });
  const busy = await cooling();
  const order = list.map((x, i) => ({ x, i, at: (saved[i] && saved[i].at) || 0 })).filter(o => Date.now() - o.at > 2 * 3600e3).sort((p, q2) => p.at - q2.at).slice(0, busy ? 0 : (maxCalls == null ? 6 : maxCalls));
  const gone = [];
  for (const o of order) {   /* one at a time, so a rate warning stops the rest */
    if (await cooling()) break;
    try { const v = await discoverLive(o.x.username, null, 12); saved[o.i] = { at: Date.now(), v: USLIM(v) }; await BS.putJSON(UDOC(o.x.username), saved[o.i]).catch(() => { }); }
    catch (e) { if (e.rate) break; if (o.x.seed && /wasn’t found|business and creator/i.test(e.message)) gone.push(o.x.username); else if (saved[o.i]) { saved[o.i].at = Date.now() - 1.5 * 3600e3; await BS.putJSON(UDOC(o.x.username), saved[o.i]).catch(() => { }); } }
  }
  list.forEach((x, i) => { const v = saved[i] && saved[i].v; if (v && v.profile) { x.picture = v.profile.profile_picture_url || x.picture; x.name = v.profile.name || x.name; } });
  if (gone.length) { const g = new Set(gone); f.list = f.list.filter(x => !g.has(x.username)); }
  await BS.putJSON(FOLLOW, f).catch(() => { });
  let mine = [];
  try { mine = (await get('/' + a.userId + '/media', { fields: DM_F + ',children{media_type,media_url,thumbnail_url}', limit: 6 }, a)).data || []; } catch (e) { mine = prev && prev.v ? prev.v.items.filter(x => x.owner && x.owner.me) : []; }
  mine.forEach(x => { x.owner = { username: a.username, picture: a.picture, me: true }; });
  const others = [].concat(...list.map((x, i) => ((saved[i] && saved[i].v && saved[i].v.items) || []).map(m => Object.assign(m, { owner: { username: x.username, picture: x.picture } }))));
  const items = mine.map(slim).concat(others).filter(x => x.media_url || x.thumbnail_url).sort((x, y) => new Date(y.timestamp) - new Date(x.timestamp)).slice(0, 300);
  const stories = await myStories(a);
  const v = { items, stories, me: { username: a.username, picture: a.picture }, following: f.list.map(x => ({ username: x.username, name: x.name, picture: x.picture, added: x.added || 0 })) };
  FEED = { at: Date.now(), v };
  await BS.putJSON(FEEDDOC, FEED).catch(() => { });
  return v;
}
/** the home feed: from the saved copy (the scheduler keeps it fresh); a pull-to-refresh renews two more accounts (at most once every 3 minutes) */
async function feed(force, pull) {
  if (pull && !(await cooling())) {
    const last = await BS.getJSON('hq/ig/pullat.json').catch(() => null);
    if (!last || Date.now() - last.at > 180e3) { await BS.putJSON('hq/ig/pullat.json', { at: Date.now() }).catch(() => { }); return buildFeed(2); }
  }
  if (!force && FEED && Date.now() - FEED.at < 120e3) return FEED.v;
  const d = await BS.getJSON(FEEDDOC).catch(() => null);
  if (d && d.v && !force) { FEED = d; return d.v; }
  return buildFeed(force ? 6 : 4);
}
/** the scheduler (every 15 minutes) refreshes a few accounts each time */
async function warmFeed() { if (!configured() || !BS.on()) return false; await buildFeed(5); return true; }
async function tags(after) { const a = await token(); return get('/' + a.userId + '/tags', { fields: DM_F + ',username,children{media_type,media_url,thumbnail_url}', limit: 24, after }, a); }

/* ---------- activity: new messages, comments, likes, followers and tags → notifications ----------
   Checked every ~15 minutes by the scheduler and every few minutes while Ciel Admin is open.
   The first check only takes a snapshot; later checks compare against it. */
const WATCH = 'hq/ig/watch.json';
async function activity() { return (BS.on() && await BS.getJSON(WATCH).catch(() => null)) || { items: [] }; }
const thumbOf = m => m ? (m.media_type === 'VIDEO' ? m.thumbnail_url : m.media_url) || '' : '';
async function watch(force) {
  if (!BS.on() || !configured()) return { ok: true, skipped: true };
  /* at most one check every 90 s per server instance (several admin tabs, the scheduler) */
  if (!force && globalThis.__igWatchAt && Date.now() - globalThis.__igWatchAt < 90e3 && globalThis.__igWatchItems) return { ok: true, fresh: true, items: globalThis.__igWatchItems };
  if (!force) {
    const last = await BS.getJSON('hq/ig/watchat.json').catch(() => null);
    if ((last && Date.now() - last.at < 180e3) || await cooling()) { const w0 = await activity(); globalThis.__igWatchItems = w0.items || []; globalThis.__igWatchAt = Date.now(); return { ok: true, fresh: true, items: w0.items || [] }; }
    await BS.putJSON('hq/ig/watchat.json', { at: Date.now() }).catch(() => { });
  }
  globalThis.__igWatchAt = Date.now();
  const a = await account(); if (!a || !a.token || !a.userId) return { ok: true, idle: true };
  const w = await activity();
  const first = !w.at, since = w.at || Date.now(), news = [], before = JSON.stringify(w), me = String(a.userId), mine = x => x && (String(x.id) === me || (x.username && x.username === a.username));
  try {
    const p = await get('/' + me, { fields: 'followers_count,media_count' }, a);
    if (!first && p.followers_count > (w.followers || 0)) news.push({ k: 'follow', n: p.followers_count - (w.followers || 0) });
    w.followers = p.followers_count;
  } catch (e) { if (e.expired) return { ok: false, expired: true }; }
  try {
    const md = await get('/' + me + '/media', { fields: 'id,like_count,comments_count,media_type,media_url,thumbnail_url,permalink', limit: 12 }, a), old = w.media || {}, now = {};
    for (const m of md.data || []) {
      const o = old[m.id], th = thumbOf(m);
      if (o && !first) {
        if ((m.like_count || 0) > o[0]) news.push({ k: 'like', n: m.like_count - o[0], media: m.id, thumb: th });
        if ((m.comments_count || 0) > o[1]) {
          try {
            const c = await get('/' + m.id + '/comments', { fields: 'id,text,username,timestamp,from{id,username}', limit: 25 }, a);
            (c.data || []).filter(x => new Date(x.timestamp).getTime() > since - 90e3 && !mine(x.from || { username: x.username })).slice(0, 5)
              .forEach(x => news.push({ k: 'comment', user: x.username || (x.from && x.from.username) || '', text: clean(x.text, 200), media: m.id, thumb: th, id: x.id }));
          } catch (e) { }
        }
      }
      now[m.id] = [m.like_count || 0, m.comments_count || 0];
    }
    w.media = now;
  } catch (e) { }
  try {
    const { box, a: ma } = await msgAcc();
    const cv = await get('/' + box + '/conversations', { platform: 'instagram', fields: 'id,updated_time,messages.limit(1){id,message,from,created_time,attachments}', limit: 20 }, ma), old = w.convos || {}, now = {};
    for (const c of cv.data || []) {
      const last = c.messages && c.messages.data && c.messages.data[0];
      if (!first && last && old[c.id] !== last.id && !mine(last.from) && new Date(last.created_time).getTime() > since - 5 * 6e4) news.push({ k: 'message', user: (last.from && last.from.username) || '', text: clean(last.message, 200) || 'Sent an attachment', convo: c.id });
      now[c.id] = last ? last.id : c.updated_time;
    }
    w.convos = now;
  } catch (e) { }
  try {
    const tg = await get('/' + me + '/tags', { fields: 'id,username,media_type,media_url,thumbnail_url,permalink', limit: 10 }, a), seen = w.tags || [];
    for (const t of tg.data || []) if (!first && !seen.includes(t.id)) news.push({ k: 'tag', user: t.username || '', media: t.id, thumb: thumbOf(t), link: t.permalink || '' });
    w.tags = (tg.data || []).map(t => t.id).concat(seen.filter(id => !(tg.data || []).some(t => t.id === id))).slice(0, 60);
  } catch (e) { }
  /* saved only when something changed (storage writes are limited), so w.at = the last change */
  const at = Date.now();
  w.items = news.map((x, i) => Object.assign({ id: at.toString(36) + i, at }, x)).concat(w.items || []).slice(0, 100);
  const changed = JSON.stringify(Object.assign({}, w, { at: undefined })) !== JSON.stringify(Object.assign(JSON.parse(before), { at: undefined }));
  if (changed || first) { w.at = at; await BS.putJSON(WATCH, w).catch(e => console.error('[ig] watch save', e.message)); }
  globalThis.__igWatchItems = w.items;
  if (news.length) await tellNews(news, a);
  return { ok: true, at: w.at, items: w.items, new: news.length };
}
function newsText(x) {
  const u = x.user ? '@' + x.user : 'Someone';
  return ({
    message: [u + ' sent you a message', x.text, '/admin#instagram/messages'],
    comment: [u + ' commented', x.text, '/admin#instagram/activity'],
    like: [x.n + ' new like' + (x.n > 1 ? 's' : '') + ' on your post', '', '/admin#instagram/activity'],
    follow: [x.n + ' new follower' + (x.n > 1 ? 's' : ''), '', '/admin#instagram/activity'],
    tag: [u + ' tagged you in a post', '', '/admin#instagram/activity']
  })[x.k];
}
async function tellNews(news, a) {
  const N = require('./notify');
  const list = news.length <= 3 ? news : null;
  if (list) { for (const x of list) { const t = newsText(x); await N.event({ kind: 'instagram', title: 'Instagram · ' + t[0], body: t[1], url: t[2], tag: 'ig-' + x.k }); } return; }
  const c = k => news.filter(x => x.k === k).reduce((s, x) => s + (x.n || 1), 0), parts = [];
  if (c('message')) parts.push(c('message') + ' message' + (c('message') > 1 ? 's' : ''));
  if (c('comment')) parts.push(c('comment') + ' comment' + (c('comment') > 1 ? 's' : ''));
  if (c('like')) parts.push(c('like') + ' like' + (c('like') > 1 ? 's' : ''));
  if (c('follow')) parts.push(c('follow') + ' follower' + (c('follow') > 1 ? 's' : ''));
  if (c('tag')) parts.push(c('tag') + ' tag' + (c('tag') > 1 ? 's' : ''));
  await N.event({ kind: 'instagram', title: 'Instagram · ' + parts.join(', '), body: '@' + a.username, url: news.some(x => x.k === 'message') ? '/admin#instagram/messages' : '/admin#instagram/activity', tag: 'ig-sum' });
}

/* ---------- posts (drafts, scheduled, published) ---------- */
const TYPES = ['photo', 'carousel', 'reel', 'story'];
/* ---------- designs: ready-made posts, stories, reel covers and highlight covers waiting to be posted ---------- */
const DESIGNS = 'hq/ig/designs.json', DKINDS = ['post', 'carousel', 'story', 'reel', 'highlight'];
async function designs() { return (BS.on() && await BS.getJSON(DESIGNS).catch(() => null)) || { items: [] }; }
function designOut(p) { return Object.assign({}, p, { images: (p.paths || []).map(x => fileUrl(x, 14)) }); }
async function saveDesign(b) {
  const d = await designs(), old = b.id ? d.items.find(x => x.id === b.id) : null;
  const p = Object.assign({}, old || { id: 'd' + crypto.randomBytes(6).toString('hex'), created: new Date().toISOString() });
  if (b.kind !== undefined) p.kind = DKINDS.includes(b.kind) ? b.kind : 'post';
  if (b.caption !== undefined) p.caption = clean(b.caption, 2200);
  if (b.title !== undefined) p.title = clean(b.title, 120);
  if (Array.isArray(b.paths)) p.paths = b.paths.map(String).filter(okMediaPath).slice(0, 10);
  if (b.status !== undefined) p.status = b.status === 'posted' ? 'posted' : 'ready';
  if (b.seq !== undefined) p.seq = Math.max(0, +b.seq || 0) || undefined;
  if (!p.kind) p.kind = 'post'; if (!p.status) p.status = 'ready'; if (!p.paths) p.paths = [];
  p.updated = new Date().toISOString();
  if (old) Object.assign(old, p); else d.items.push(p);
  await BS.putJSON(DESIGNS, d);
  return designOut(p);
}
async function delDesign(id) { const d = await designs(); d.items = d.items.filter(x => x.id !== id); await BS.putJSON(DESIGNS, d); return true; }
async function markDesignPosted(id) { if (!id) return; try { const d = await designs(), p = d.items.find(x => x.id === id); if (p && p.status !== 'posted') { p.status = 'posted'; p.postedAt = new Date().toISOString(); await BS.putJSON(DESIGNS, d); } } catch (e) { } }
async function posts() { return (await BS.getJSON(POSTS).catch(() => null)) || { items: [] }; }
async function savePosts(d) { d.items = d.items.slice(-500); await BS.putJSON(POSTS, d); }
function shapePost(b, old) {
  const p = Object.assign({}, old || {});
  p.id = old ? old.id : 'p' + crypto.randomBytes(6).toString('hex');
  p.type = TYPES.includes(b.type) ? b.type : 'photo';
  p.caption = clean(b.caption, 2200);
  p.media = (Array.isArray(b.media) ? b.media : []).slice(0, 10).map(m => ({ path: String(m.path || ''), kind: m.kind === 'video' ? 'video' : 'image', w: +m.w || 0, h: +m.h || 0, name: clean(m.name, 120) })).filter(m => /^hq\/ig\/media\/[\w\-]+\/[\w.\-]+$/.test(m.path));
  p.altText = clean(b.altText, 1000);
  p.collaborators = String(b.collaborators || '').split(/[\s,]+/).map(x => x.replace(/^@/, '')).filter(x => /^[\w.]{1,30}$/.test(x)).slice(0, 3);
  p.location = /^\d{1,20}$/.test(String(b.location || '')) ? String(b.location) : '';
  p.shareToFeed = b.shareToFeed !== false;
  p.at = b.at && !isNaN(+new Date(b.at)) ? +new Date(b.at) : null;
  p.status = b.status === 'draft' ? 'draft' : (p.at ? 'scheduled' : 'draft');
  if (b.planId !== undefined) p.planId = /^d[a-f0-9]{12}$/.test(String(b.planId || '')) ? String(b.planId) : undefined;
  p.updatedAt = Date.now(); if (!old) p.createdAt = Date.now();
  delete p.error; delete p.containers; delete p.containerAt;
  return p;
}
function check(p) {
  const n = p.media.length, vids = p.media.filter(m => m.kind === 'video').length;
  if (!n) return 'Add a photo or video.';
  if (p.type === 'photo' && (n !== 1 || vids)) return 'A photo post has exactly one photo.';
  if (p.type === 'reel' && (n !== 1 || vids !== 1)) return 'A reel has exactly one video.';
  if (p.type === 'story' && n !== 1) return 'A story has one photo or one video.';
  if (p.type === 'carousel' && (n < 2 || n > 10)) return 'A carousel has 2 to 10 photos or videos.';
  if (p.type !== 'story' && p.caption.length > 2200) return 'The caption is too long (2,200 characters at most).';
  if ((p.caption.match(/#[\p{L}\p{N}_]+/gu) || []).length > 30) return 'Instagram allows 30 hashtags at most.';
  return '';
}
/** create Instagram's containers for a post (step 1 of publishing) */
async function makeContainers(p, a) {
  const uid = a.userId, url = m => fileUrl(m.path, 2), extra = {};
  if (p.collaborators.length && p.type !== 'story') extra.collaborators = JSON.stringify(p.collaborators);
  if (p.location && p.type !== 'story') extra.location_id = p.location;
  if (p.type === 'photo') return { main: (await post('/' + uid + '/media', Object.assign({ image_url: url(p.media[0]), caption: p.caption, alt_text: p.altText || undefined }, extra), a)).id, kids: [] };
  if (p.type === 'reel') return { main: (await post('/' + uid + '/media', Object.assign({ media_type: 'REELS', video_url: url(p.media[0]), caption: p.caption, share_to_feed: p.shareToFeed ? 'true' : 'false' }, extra), a)).id, kids: [] };
  if (p.type === 'story') { const m = p.media[0]; return { main: (await post('/' + uid + '/media', Object.assign({ media_type: 'STORIES' }, m.kind === 'video' ? { video_url: url(m) } : { image_url: url(m) }), a)).id, kids: [] }; }
  const kids = [];
  for (const m of p.media) kids.push((await post('/' + uid + '/media', Object.assign({ is_carousel_item: 'true' }, m.kind === 'video' ? { media_type: 'VIDEO', video_url: url(m) } : { image_url: url(m) }), a)).id);
  return { main: null, kids, extra };
}
async function status(id, a) { const r = await get('/' + id, { fields: 'status_code,status' }, a); return r.status_code || 'IN_PROGRESS'; }
/** take a post as far as it can go within the time left: containers → wait for video → publish */
async function advance(p, a, deadline) {
  if (!p.containers || Date.now() - (p.containerAt || 0) > 20 * 3600e3) { p.containers = await makeContainers(p, a); p.containerAt = Date.now(); p.status = 'processing'; }
  const c = p.containers, waitAll = async ids => {
    for (const id of ids) {
      for (;;) {
        const s = await status(id, a);
        if (s === 'FINISHED' || s === 'PUBLISHED') break;
        if (s === 'ERROR' || s === 'EXPIRED') { delete p.containers; throw err(502, 'ig-media', 'Instagram couldn’t process this ' + (p.media.some(m => m.kind === 'video') ? 'video' : 'photo') + ' (' + s.toLowerCase() + '). Check its size and shape, then try again.'); }
        if (Date.now() > deadline) return false;
        await new Promise(r => setTimeout(r, 3000));
      }
    }
    return true;
  };
  if (!(await waitAll(c.kids))) return false;
  if (!c.main && c.kids.length) { c.main = (await post('/' + a.userId + '/media', Object.assign({ media_type: 'CAROUSEL', children: c.kids.join(','), caption: p.caption }, c.extra || {}), a)).id; }
  if (!(await waitAll([c.main]))) return false;
  const r = await post('/' + a.userId + '/media_publish', { creation_id: c.main }, a);
  p.status = 'published'; p.publishedAt = Date.now(); p.igId = r.id; delete p.containers; delete p.error;
  if (p.planId) await markDesignPosted(p.planId);
  try { const m = await get('/' + r.id, { fields: 'permalink' }, a); p.permalink = m.permalink; } catch (e) { }
  return true;
}
/* a safe pace: Instagram's spam checks flag accounts that post in bursts (many posts close together).
   Feed posts (photos, carousels, reels) go out at most one an hour and 4 a day; stories at most 10 a day.
   A scheduled post that would break this waits for the next run; Post now says when it can go. */
function paceWait(items, p, now) {
  const feed = (x) => x.type !== 'story';
  const mine = items.filter((x) => x.id !== p.id && x.status === 'published' && x.publishedAt && feed(x) === feed(p));
  const last = mine.reduce((m, x) => Math.max(m, x.publishedAt), 0);
  const day = mine.filter((x) => now - x.publishedAt < 864e5).sort((a, b) => a.publishedAt - b.publishedAt);
  if (feed(p)) { if (now - last < 3600e3) return last + 3600e3; if (day.length >= 4) return day[day.length - 4].publishedAt + 864e5; }
  else if (day.length >= 10) return day[day.length - 10].publishedAt + 864e5;
  return 0;
}
const paceMsg = (w) => 'To keep the account safe from Instagram’s spam checks, feed posts go out at most one an hour and 4 a day (stories 10 a day). This one can go out from ' + new Date(w).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi', weekday: 'short', hour: 'numeric', minute: '2-digit' }) + ', so schedule it for then.';
/** publish every post that is due (and finish ones still processing). Safe to call often. */
async function runDue(budgetMs) {
  if (!BS.on() || !configured()) return { ok: true, skipped: true };
  /* cheap check first (one read): nothing due → no writes at all */
  const d0 = await posts(), isDue = p => (p.status === 'scheduled' && p.at && p.at <= Date.now()) || p.status === 'processing';
  const a = d0.items.some(isDue) || Date.now() % 864e5 < 15 * 6e4 ? await account() : null;   /* the account is also read once a day, around midnight UTC, to renew the token */
  if (!a || !a.token) return { ok: true, idle: true };
  if (!d0.items.some(isDue)) { await refreshToken(false).catch(e => console.error('[ig] refresh', e.message)); return { ok: true, idle: true }; }
  const lock = await BS.getJSON(LOCK).catch(() => null); if (lock && Date.now() - lock.at < 90e3) return { ok: true, busy: true };
  await BS.putJSON(LOCK, { at: Date.now() });
  const deadline = Date.now() + (budgetMs || 40000), done = [], fail = [];
  try {
    const acc = (await refreshToken(false).catch(e => { console.error('[ig] refresh', e.message); return null; })) || a, d = await posts();
    const due = d.items.filter(isDue).sort((x, y) => (x.at || 0) - (y.at || 0));
    for (const p of due) {
      if (Date.now() > deadline - 5000) break;
      if (p.status === 'scheduled' && paceWait(d.items, p, Date.now())) continue;   /* too soon after the last post: waits for a later run */
      try { const fin = await advance(p, acc, deadline - 3000); if (fin) done.push(p.id); }
      catch (e) { p.tries = (p.tries || 0) + 1; p.error = e.message; if (p.tries >= 3 || e.status === 400 || e.expired) { p.status = 'failed'; fail.push(p.id); } }
      p.updatedAt = Date.now(); await savePosts(d);
    }
    if (done.length || fail.length) {
      try { await require('./notify').event({ kind: 'instagram', title: done.length ? 'Instagram: ' + done.length + ' post' + (done.length > 1 ? 's' : '') + ' published' : 'Instagram post failed', body: fail.length ? 'Open Ciel Admin → Instagram to see why.' : '@' + acc.username, url: '/admin#instagram/posts' }); } catch (e) { }
    }
    return { ok: true, published: done.length, failed: fail.length };
  } finally { await BS.del([LOCK]).catch(() => { }); }
}
/** publish one post now (from the editor) */
async function publishNow(id) {
  const a = await token(), d = await posts(), p = d.items.find(x => x.id === id);
  if (!p) throw err(404, 'post', 'Post not found.');
  if (p.status === 'published') throw err(409, 'done', 'Already published.');
  const bad = check(p); if (bad) throw err(400, 'post', bad);
  const wait = paceWait(d.items, p, Date.now()); if (wait) throw err(429, 'pace', paceMsg(wait));
  p.status = 'scheduled'; p.at = Date.now();
  let fin = false;
  try { fin = await advance(p, a, Date.now() + 45000); }
  catch (e) { p.error = e.message; p.status = 'failed'; await savePosts(d); throw e; }
  p.updatedAt = Date.now(); await savePosts(d);
  return { post: p, finished: fin };
}

/* ---------- media files ---------- */
function mediaKey(name) {
  const ext = (String(name).match(/\.(jpe?g|png|mp4|mov)$/i) || [, 'jpg'])[1].toLowerCase().replace('jpeg', 'jpg');
  return 'hq/ig/media/' + new Date().toISOString().slice(0, 7) + '/' + crypto.randomBytes(8).toString('hex') + '.' + ext;
}
const okMediaPath = p => /^hq\/ig\/media\/[\w\-]+\/[a-f0-9]{16}\.(jpg|png|mp4|mov)$/.test(String(p || ''));
async function streamFile(res, k) {
  const o = unsign(k); if (!o || !okMediaPath(o.p)) { res.statusCode = 404; return res.end('Not found'); }
  const r = await require('@vercel/blob').get(o.p, { access: 'private', useCache: false });
  if (!r || r.statusCode !== 200 || !r.stream) { res.statusCode = 404; return res.end('Not found'); }
  const ext = o.p.split('.').pop();
  res.statusCode = 200;
  res.setHeader('Content-Type', { jpg: 'image/jpeg', png: 'image/png', mp4: 'video/mp4', mov: 'video/quicktime' }[ext]);
  const size = r.blob && r.blob.size; if (size) res.setHeader('Content-Length', String(size));
  res.setHeader('Cache-Control', 'private, max-age=3600'); res.setHeader('X-Robots-Tag', 'noindex'); res.setHeader('X-Content-Type-Options', 'nosniff');
  const { Readable } = require('stream');
  const src = typeof r.stream.getReader === 'function' ? Readable.fromWeb(r.stream) : r.stream;
  await new Promise((ok, bad) => { src.on('error', bad); res.on('finish', ok); res.on('close', ok); src.pipe(res); });
}

module.exports = { designs, designOut, saveDesign, delDesign, followMany, warmFeed, cooling, like, addComment, deleteMedia, discover, following, setFollow, feed, tags, activity, watch, configured, account, publicAccount, connectUrl, callback, connectToken, disconnect, refreshToken, profile, insights, media, mediaOne, mediaInsights, setComments, comments, reply, hide, delComment, conversations, thread, sendMessage, posts, savePosts, shapePost, check, runDue, publishNow, mediaKey, okMediaPath, fileUrl, streamFile, setFetch, REDIRECT, SCOPES };
