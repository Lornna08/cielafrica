/* ============================================================
   ORBIT SOCIAL — platform capabilities & provider adapters
   Each platform declares what it can actually publish, so the
   composer validates per network instead of assuming they are all
   the same. Adapters are the seam for real integrations: in this
   template every account uses the SampleAdapter, which never
   contacts a network and labels every result as simulated.
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.OS = root.OS || {}; root.OS.platforms = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var P = {
    instagram: {
      id: 'instagram', name: 'Instagram', color: '#C13584', short: 'IG',
      caption: 2200, hashtags: 30, needsMedia: true, maxImages: 10, maxVideos: 1, mixMedia: true,
      types: [{ id: 'feed', name: 'Feed post' }, { id: 'reel', name: 'Reel', video: true }, { id: 'story', name: 'Story' }],
      linksClickable: false, firstComment: true,
      api: 'Instagram Graph API — content publishing for professional (Business or Creator) accounts linked to a Facebook Page.',
      scopes: ['instagram_basic', 'instagram_content_publish', 'pages_show_list'],
      notes: ['Links in captions aren’t clickable.', 'Personal accounts can’t be published to through the API.']
    },
    facebook: {
      id: 'facebook', name: 'Facebook', color: '#1877F2', short: 'FB',
      caption: 63206, hashtags: null, needsMedia: false, maxImages: 10, maxVideos: 1, mixMedia: false,
      types: [{ id: 'post', name: 'Page post' }, { id: 'reel', name: 'Reel', video: true }],
      linksClickable: true,
      api: 'Facebook Pages API — publishing to Pages you manage.',
      scopes: ['pages_manage_posts', 'pages_read_engagement'],
      notes: ['Publishes to Pages only, not personal profiles or groups.']
    },
    linkedin: {
      id: 'linkedin', name: 'LinkedIn', color: '#0A66C2', short: 'in',
      caption: 3000, hashtags: null, needsMedia: false, maxImages: 9, maxVideos: 1, mixMedia: false,
      types: [{ id: 'post', name: 'Page post' }],
      linksClickable: true,
      api: 'LinkedIn Community Management API — organisation pages (requires LinkedIn’s app review).',
      scopes: ['w_organization_social', 'r_organization_social'],
      notes: ['Company pages need an admin who connects the page.']
    },
    tiktok: {
      id: 'tiktok', name: 'TikTok', color: '#111111', short: 'TT',
      caption: 2200, hashtags: null, needsMedia: true, needsVideo: true, maxImages: 0, maxVideos: 1, mixMedia: false,
      types: [{ id: 'video', name: 'Video', video: true }],
      linksClickable: false, privacy: true,
      api: 'TikTok Content Posting API — direct posting requires an audited app; unaudited apps can only post privately.',
      scopes: ['video.publish', 'user.info.basic'],
      notes: ['A video is required in this template.', 'Choose who can view the post before it goes out.']
    },
    youtube: {
      id: 'youtube', name: 'YouTube', color: '#FF0000', short: 'YT',
      caption: 5000, title: 100, hashtags: 15, needsMedia: true, needsVideo: true, maxImages: 0, maxVideos: 1, mixMedia: false,
      types: [{ id: 'short', name: 'Short', video: true }, { id: 'video', name: 'Video', video: true }],
      linksClickable: true,
      api: 'YouTube Data API v3 — videos.insert with OAuth consent from the channel owner; upload quota applies.',
      scopes: ['youtube.upload'],
      notes: ['A title is required.', 'Uploads count against the daily API quota.']
    },
    x: {
      id: 'x', name: 'X', color: '#0F1419', short: 'X',
      caption: 280, hashtags: null, needsMedia: false, maxImages: 4, maxVideos: 1, mixMedia: false,
      types: [{ id: 'post', name: 'Post' }],
      linksClickable: true, linkWeight: 23,
      api: 'X API v2 — posting requires a paid access tier for most volumes.',
      scopes: ['tweet.write', 'users.read', 'offline.access'],
      notes: ['280 characters for standard accounts; every link counts as 23.']
    }
  };
  var ORDER = ['instagram', 'facebook', 'linkedin', 'tiktok', 'youtube', 'x'];

  function countChars(text, p) {
    if (!text) return 0;
    if (p.linkWeight) return text.replace(/https?:\/\/\S+/g, new Array(p.linkWeight + 1).join('x')).length;
    return Array.from(text).length;
  }
  function hashtags(text) { return (text.match(/(^|\s)#[\p{L}\p{N}_]+/gu) || []).map(function (h) { return h.trim(); }); }

  // validate(post, platformId, assets[]) -> {errors:[], warnings:[]}
  function validate(post, pid, assets) {
    var p = P[pid], E = [], W = [];
    if (!p) return { errors: ['Unknown platform'], warnings: [] };
    var cap = (post.captions && post.captions[pid] != null ? post.captions[pid] : post.caption) || '';
    var n = countChars(cap, p), imgs = assets.filter(function (a) { return a.type === 'image'; }), vids = assets.filter(function (a) { return a.type === 'video'; });
    var o = (post.options && post.options[pid]) || {};
    var type = p.types.filter(function (t) { return t.id === o.type; })[0] || p.types[0];
    if (!cap.trim() && !assets.length) E.push('Add a caption or media.');
    if (n > p.caption) E.push('Caption is ' + (n - p.caption) + ' characters over the ' + p.caption.toLocaleString() + ' limit.');
    if (p.hashtags && hashtags(cap).length > p.hashtags) E.push('Use at most ' + p.hashtags + ' hashtags (' + hashtags(cap).length + ' now).');
    if (p.needsMedia && !assets.length) E.push(p.needsVideo ? 'Add a video.' : 'Add at least one image or video.');
    if (p.needsVideo && imgs.length) E.push(p.name + ' accepts video only in this template.');
    if (vids.length > p.maxVideos) E.push('Only ' + p.maxVideos + ' video per post.');
    if (imgs.length > p.maxImages && !p.needsVideo) E.push('Up to ' + p.maxImages + ' images per post.');
    if (!p.mixMedia && imgs.length && vids.length) E.push('Don’t mix images and video on ' + p.name + '.');
    if (type.video && !vids.length && assets.length) E.push(type.name + ' needs a video.');
    if (pid === 'instagram' && type.id === 'story' && assets.length > 1) W.push('Stories publish one item each; extra media will be split into separate stories.');
    if (p.title && !(o.title || '').trim()) E.push('Add a video title.');
    if (p.title && (o.title || '').length > p.title) E.push('Title is over ' + p.title + ' characters.');
    if (p.privacy && !o.privacy) E.push('Choose who can view this TikTok.');
    if (!p.linksClickable && /https?:\/\//.test(cap)) W.push('Links won’t be clickable on ' + p.name + '.');
    if (n > p.caption * 0.9 && n <= p.caption) W.push('Close to the character limit.');
    return { errors: E, warnings: W, count: n, limit: p.caption, type: type };
  }

  /* ---------- provider adapters ----------
     interface: { connect(account), refresh(account), publish(post, account),
                  fetchMetrics(account, range), fetchInbox(account) }
     Real adapters must run on a server: they hold OAuth tokens and app
     secrets that must never reach the browser. */
  var SampleAdapter = {
    kind: 'sample',
    publish: function (post, account) {
      if (account.status === 'expired') return { ok: false, error: 'The connection to ' + account.handle + ' has expired. Reconnect the account and try again.' };
      if (account.status === 'error') return { ok: false, error: account.note || 'The network rejected the request.' };
      return { ok: true, simulated: true, externalId: null };
    },
    connect: function () { return { ok: false, error: 'Connecting real accounts needs ORBIT’s server and an approved developer app. Not available in this template.' }; }
  };
  var ServerAdapter = {
    kind: 'server',
    // In production: POST /api/publish {postId, accountId} -> server loads the token, calls the network, stores the result.
    publish: function () { return { ok: false, error: 'No server is configured for this template.' }; },
    connect: function () { return { ok: false, error: 'No server is configured for this template.' }; }
  };
  function adapterFor(account) { return account && account.connection === 'server' ? ServerAdapter : SampleAdapter; }

  return { P: P, ORDER: ORDER, list: ORDER.map(function (k) { return P[k]; }), validate: validate, countChars: countChars, hashtags: hashtags, adapterFor: adapterFor };
}));
