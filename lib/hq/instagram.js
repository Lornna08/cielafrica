/* ============================================================
   CIEL ADMIN — Instagram (Instagram API with Instagram Login)
   · connect: /admin → Instagram → Connect opens Instagram's sign-in;
     Instagram sends the browser back to /api/ig-callback with a code,
     which is swapped for a 60-day token (refreshed automatically).
   · posts: photo, carousel (2–10), reel and story; publish now or
     schedule. Scheduled posts are published by /api/hq?route=ig-cron
     (called every ~15 minutes by .github/workflows/instagram.yml, and
     whenever Ciel Admin is open).
   · messages (DMs), comments (reply, hide, delete), profile and stats.
   Media sits in the private Blob store (hq/ig/media/…); Instagram reads it
   through a signed link (/api/hq?route=ig-file&k=…) that only works for
   that one file.
   Needs: IG_APP_ID, IG_APP_SECRET (Meta app → Instagram → API setup with
   Instagram login). Optional: IG_API_VERSION (default v23.0).
   The token never leaves the server.
   ============================================================ */
const crypto = require('crypto');
const sec = require('../domains/security');
const BS = require('../photobooks/blobstore');

const ACC = 'hq/ig/account.json', POSTS = 'hq/ig/posts.json', LOCK = 'hq/ig/lock.json';
const SITE = 'https://cielafrica.com';
const REDIRECT = SITE + '/api/ig-callback';
const SCOPES = ['instagram_business_basic', 'instagram_business_content_publish', 'instagram_business_manage_messages', 'instagram_business_manage_comments', 'instagram_business_manage_insights'];
const ver = () => /^v\d+\.\d+$/.test(process.env.IG_API_VERSION || '') ? process.env.IG_API_VERSION : 'v23.0';
const G = p => 'https://graph.instagram.com/' + ver() + p;
const err = (status, code, message) => Object.assign(new Error(message), { status, code });
const configured = () => !!(process.env.IG_APP_ID && process.env.IG_APP_SECRET);
const clean = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, ' ').slice(0, n || 2200);

/* ---------- small helpers ---------- */
let F = (...a) => fetch(...a);
function setFetch(f) { if (f) F = f; }
async function call(url, opt) {
  const r = await F(url, Object.assign({ signal: AbortSignal.timeout(25000) }, opt || {}));
  let j = null; try { j = await r.json(); } catch (e) { }
  if (!r.ok || (j && j.error)) {
    const e = (j && j.error) || {}, m = e.error_user_msg || e.message || ('Instagram error ' + r.status);
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
async function get(path, params, a) { a = a || await token(); return call(G(path) + '?' + q(Object.assign({}, params, { access_token: a.token }))); }
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
  if (!configured()) throw err(503, 'ig-setup', 'Add IG_APP_ID and IG_APP_SECRET in Vercel first, then redeploy.');
  if (!sec.secret()) throw err(503, 'setup', 'Missing signing secret.');
  return 'https://www.instagram.com/oauth/authorize?' + q({ enable_fb_login: 0, force_authentication: 1, client_id: process.env.IG_APP_ID, redirect_uri: REDIRECT, response_type: 'code', scope: SCOPES.join(','), state: signed({ n: crypto.randomBytes(6).toString('hex') }, 900) });
}
async function callback(qs) {
  if (qs.error) throw err(400, 'ig-denied', qs.error_description || 'Instagram sign-in was cancelled.');
  if (!unsign(qs.state)) throw err(400, 'ig-state', 'This sign-in link expired. Start again from Ciel Admin → Instagram.');
  const code = String(qs.code || '').replace(/#_$/, ''); if (!code) throw err(400, 'ig-code', 'Instagram didn’t send a code.');
  const form = new URLSearchParams({ client_id: process.env.IG_APP_ID, client_secret: process.env.IG_APP_SECRET, grant_type: 'authorization_code', redirect_uri: REDIRECT, code });
  const s = await call('https://api.instagram.com/oauth/access_token', { method: 'POST', body: form });
  const short = s.access_token || (s.data && s.data[0] && s.data[0].access_token);
  const l = await call('https://graph.instagram.com/access_token?' + q({ grant_type: 'ig_exchange_token', client_secret: process.env.IG_APP_SECRET, access_token: short }));
  const a = { token: l.access_token, expiresAt: Date.now() + (l.expires_in || 5184000) * 1000, refreshedAt: Date.now(), connectedAt: Date.now(), scopes: String(s.permissions || (s.data && s.data[0] && s.data[0].permissions) || '').split(',').filter(Boolean) };
  const me = await get('/me', { fields: 'user_id,username,name,profile_picture_url,account_type' }, a);
  Object.assign(a, { userId: String(me.user_id || me.id), username: me.username, name: me.name || '', picture: me.profile_picture_url || '', type: me.account_type || '' });
  await BS.putJSON(ACC, a);
  return a;
}
async function disconnect() { await BS.del([ACC]).catch(() => { }); }
/** long-lived tokens last 60 days; refresh when less than 20 days are left */
async function refreshToken(force) {
  const a = await account(); if (!a || !a.token) return null;
  if (!force && a.expiresAt - Date.now() > 20 * 864e5) return a;
  const r = await call('https://graph.instagram.com/refresh_access_token?' + q({ grant_type: 'ig_refresh_token', access_token: a.token }));
  a.token = r.access_token; a.expiresAt = Date.now() + (r.expires_in || 5184000) * 1000; a.refreshedAt = Date.now();
  await BS.putJSON(ACC, a); return a;
}
function publicAccount(a) { return a ? { userId: a.userId, username: a.username, name: a.name, picture: a.picture, type: a.type, expiresAt: a.expiresAt, connectedAt: a.connectedAt, scopes: a.scopes } : null; }

/* ---------- profile, posts, stats ---------- */
async function profile() {
  const a = await token();
  const me = await get('/me', { fields: 'user_id,username,name,biography,website,profile_picture_url,followers_count,follows_count,media_count,account_type' }, a);
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

/* ---------- messages ---------- */
async function conversations(after) {
  const a = await token();
  return get('/' + a.userId + '/conversations', { platform: 'instagram', fields: 'id,updated_time,participants,messages.limit(1){id,message,from,created_time,attachments}', limit: 25, after }, a);
}
async function thread(id) {
  const a = await token();
  const r = await get('/' + id, { fields: 'id,participants,messages.limit(40){id,message,from,to,created_time,attachments,story,shares,reactions}' }, a);
  return Object.assign(r, { me: a.userId, username: a.username });
}
async function sendMessage(to, text, imagePath) {
  const a = await token();
  if (imagePath) await postJSON('/' + a.userId + '/messages', { recipient: { id: String(to) }, message: { attachment: { type: 'image', payload: { url: fileUrl(imagePath, 2) } } } }, a);
  if (text) return postJSON('/' + a.userId + '/messages', { recipient: { id: String(to) }, message: { text: clean(text, 1000) } }, a);
  return { ok: true };
}

/* ---------- posts (drafts, scheduled, published) ---------- */
const TYPES = ['photo', 'carousel', 'reel', 'story'];
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
  try { const m = await get('/' + r.id, { fields: 'permalink' }, a); p.permalink = m.permalink; } catch (e) { }
  return true;
}
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

module.exports = { configured, account, publicAccount, connectUrl, callback, disconnect, refreshToken, profile, insights, media, mediaOne, mediaInsights, setComments, comments, reply, hide, delComment, conversations, thread, sendMessage, posts, savePosts, shapePost, check, runDue, publishNow, mediaKey, okMediaPath, fileUrl, streamFile, setFetch, REDIRECT, SCOPES };
