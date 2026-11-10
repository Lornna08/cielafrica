/* ============================================================
   CIEL ADMIN — Instagram, laid out like Instagram itself.
   Views (#instagram/…): profile (posts · reels · tagged · planned),
   feed (your posts + accounts you add), search + u/<username> (any
   business or creator account), messages (Direct), activity
   (notifications), planner (drafts and scheduled posts), stats.
   Server: lib/hq/instagram.js (routes ig-*).
   ============================================================ */
(function () {
  'use strict';
  var H, S = { view: 'profile', ptab: 'posts', st: null, prof: null, media: null, after: null, reels: null, tagged: null, posts: null, open: null, poll: null, watch: null };
  var esc = function (s) { return H.esc(s); };
  var sv = function (p, o) { return '<svg viewBox="0 0 24 24" fill="' + ((o && o.fill) || 'none') + '" stroke="currentColor" stroke-width="' + ((o && o.w) || 2) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>'; };
  var HEART = '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>';
  var IC = {
    ig: sv('<rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><path d="M17.5 6.5h.01"/>'),
    home: sv('<path d="M3 10.2 12 3l9 7.2V20a1 1 0 0 1-1 1h-5.5v-6.5h-5V21H4a1 1 0 0 1-1-1z"/>'),
    search: sv('<circle cx="11" cy="11" r="7.5"/><path d="m21 21-4.3-4.3"/>'),
    plus: sv('<rect x="3" y="3" width="18" height="18" rx="5"/><path d="M12 8v8M8 12h8"/>'),
    heart: sv(HEART), heartOn: sv(HEART, { fill: 'currentColor' }),
    msg: sv('<path d="M20.66 17A10 10 0 1 0 17 20.62L22 22Z"/>'),
    dm: sv('<path d="M22 3 9.2 10.1M11.7 20.3 22 3H2l7.2 7.1z"/>'),
    send: sv('<path d="M22 3 9.2 10.1M11.7 20.3 22 3H2l7.2 7.1z"/>'),
    grid: sv('<rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>'),
    reels: sv('<rect x="2.5" y="2.5" width="19" height="19" rx="5"/><path d="M2.5 8h19M8.5 2.5l3 5.5M14.5 2.5l3 5.5"/><path d="m10 11.5 5 3-5 3z" fill="currentColor"/>'),
    tag: sv('<path d="M10.2 4.2 12 2l1.8 2.2H19a2 2 0 0 1 2 2V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6.2a2 2 0 0 1 2-2z"/><circle cx="12" cy="10.5" r="3"/><path d="M7 18c1-2 3-3 5-3s4 1 5 3"/>'),
    cal: sv('<rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
    chart: sv('<path d="M3 3v18h18"/><path d="m7 14 4-4 4 4 5-6"/>'),
    dots: sv('<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>', { fill: 'currentColor' }),
    x: sv('<path d="M18 6 6 18M6 6l12 12"/>'),
    l: sv('<path d="m15 18-6-6 6-6"/>', { w: 2.4 }), r: sv('<path d="m9 18 6-6-6-6"/>', { w: 2.4 }),
    layers: sv('<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M4 16V5a1 1 0 0 1 1-1h11"/>'),
    play: sv('<path d="M8 5v14l11-7z"/>', { fill: 'currentColor' }),
    img: sv('<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/>'),
    ext: sv('<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>'),
    del: sv('<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>'),
    clock: sv('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    user: sv('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'),
    check: sv('<path d="M20 6 9 17l-5-5"/>', { w: 2.6 }),
    stats: sv('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>')
  };
  var TYPE = { photo: ['Photo', IC.img], carousel: ['Carousel', IC.layers], reel: ['Reel', IC.play], story: ['Story', IC.ig] };
  var STATUS = { draft: ['Draft', ''], scheduled: ['Scheduled', 'chip--b'], processing: ['Publishing…', 'chip--y'], published: ['Published', 'chip--g'], failed: ['Failed', 'chip--r'] };
  function api(route, body, qs) { return H.api('/api/hq?route=' + route + (qs ? '&' + qs : ''), body); }
  function ago(t) { var s = (Date.now() - new Date(t).getTime()) / 1000; if (s < 60) return 'now'; if (s < 3600) return Math.floor(s / 60) + 'm'; if (s < 86400) return Math.floor(s / 3600) + 'h'; if (s < 7 * 86400) return Math.floor(s / 86400) + 'd'; if (s < 365 * 86400) return Math.floor(s / 604800) + 'w'; return new Date(t).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }); }
  function longDate(t) { var d = new Date(t), y = d.getFullYear() !== new Date().getFullYear(); return d.toLocaleDateString('en-KE', { month: 'long', day: 'numeric', year: y ? 'numeric' : undefined }); }
  function when(t) { return new Date(t).toLocaleString('en-KE', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
  function num(n) { n = +n || 0; return n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : n >= 1e4 ? Math.round(n / 1e3) + 'K' : n >= 1e3 ? (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K' : String(n); }
  function full(n) { return (+n || 0).toLocaleString('en-KE'); }
  function localInput(t) { var d = new Date(t - new Date().getTimezoneOffset() * 6e4); return d.toISOString().slice(0, 16); }
  function stopPoll() { if (S.poll) { clearInterval(S.poll); S.poll = null; } }
  function ls(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem('ig.' + k) || 'null'); localStorage.setItem('ig.' + k, JSON.stringify(v)); } catch (e) { return null; } }
  function liked(id, v) { var m = ls('liked') || {}; if (v === undefined) return !!m[id]; if (v) m[id] = 1; else delete m[id]; var k = Object.keys(m); if (k.length > 400) delete m[k[0]]; ls('liked', m); }
  /* a round picture, or a coloured circle with the first letter */
  function av(url, name, cls) {
    var n = String(name || '?').replace(/^@/, ''), hue = 0; for (var i = 0; i < n.length; i++) hue = (hue * 31 + n.charCodeAt(i)) % 360;
    return url ? '<img class="igx-av ' + (cls || '') + '" src="' + esc(url) + '" alt="" referrerpolicy="no-referrer" loading="lazy">' : '<i class="igx-av ' + (cls || '') + '" style="background:hsl(' + hue + ' 60% 55%)">' + esc(n.charAt(0).toUpperCase()) + '</i>';
  }
  /* caption text with #hashtags and @mentions highlighted */
  function rich(t) { return esc(t || '').replace(/(^|\s)([#@][\w.À-￿]+)/g, '$1<span class="igx-tagt">$2</span>').replace(/\n/g, '<br>'); }
  function thumb(x) {
    if (!x) return '';
    var k = x.children && x.children.data && x.children.data[0];
    return (x.media_type === 'VIDEO' ? x.thumbnail_url : x.media_url) || (k && (k.thumbnail_url || k.media_url)) || x.thumbnail_url || '';
  }
  var isReel = function (x) { return x.media_product_type === 'REELS' || x.media_type === 'VIDEO'; };

  /* ---------- page + Instagram-style navigation ---------- */
  var NAV = [['feed', 'Home', 'home'], ['search', 'Search', 'search'], ['messages', 'Messages', 'dm'], ['activity', 'Activity', 'heart'], ['create', 'Create', 'plus'], ['planner', 'Planner', 'cal'], ['stats', 'Insights', 'stats'], ['profile', 'Profile', 'user']];
  function render(sub, extra) {
    stopPoll(); closeViewer();
    if (Date.now() - (S.fresh || 0) > 120000) { S.prof = S.media = S.tagged = null; S.fresh = Date.now(); }
    if (sub === 'connected') { H.toast('Instagram connected', 'ok'); history.replaceState(null, '', '#instagram'); sub = ''; }
    if (sub === 'error') { H.toast(decodeURIComponent(extra || 'Could not connect Instagram.'), 'err'); history.replaceState(null, '', '#instagram'); sub = ''; }
    var alias = { posts: 'profile', published: 'profile', reels: 'profile', tagged: 'profile', planned: 'profile', '': 'profile' };
    if (/^(reels|tagged|planned|posts)$/.test(sub || '')) S.ptab = sub === 'posts' ? 'posts' : sub;
    S.view = alias[sub || ''] || (/^(feed|search|u|messages|activity|planner|stats|profile)$/.test(sub) ? sub : 'profile');
    S.user = S.view === 'u' ? decodeURIComponent(extra || '') : null;
    var b = H.body('<div class="igx"><nav class="igx-nav" id="igNav"></nav><div id="igHead"></div><div id="igBody" class="igx-body"><div class="igx-load"><i></i></div></div></div>');
    (S.st ? Promise.resolve(S.st) : api('ig-status')).then(function (st) {
      S.st = st;
      if (!st.account) { S.st = null; b.querySelector('#igNav').hidden = true; return connect(b); }
      nav(b); dots();
      var el = b.querySelector('#igBody');
      ({ profile: profile, feed: feed, search: search, u: userPage, messages: messages, activity: activity, planner: planner, stats: stats })[S.view](el);
      if (!S.kicked) { S.kicked = 1; api('ig-cron').catch(function () { }); }   /* publish anything due while the admin is open */
    }).catch(function (e) { b.querySelector('#igBody').innerHTML = '<div class="card"><div class="card__b"><p>' + esc(e.message) + '</p></div></div>'; });
  }
  function nav(b) {
    var a = S.st.account, n = b.querySelector('#igNav');
    n.innerHTML = '<span class="igx-brand">' + IC.ig + '<b>Instagram</b></span>' + NAV.map(function (t) {
      var on = S.view === t[0] || (t[0] === 'search' && S.view === 'u');
      var ic = t[0] === 'profile' ? av(a.picture, a.username, 'igx-av--nav') : t[0] === 'activity' && on ? IC.heartOn : IC[t[2]];
      return '<button class="igx-nb' + (on ? ' is-on' : '') + '" data-v="' + t[0] + '" title="' + t[1] + '">' + ic + '<span>' + t[1] + '</span>' + (t[0] === 'messages' || t[0] === 'activity' ? '<em class="igx-dot" data-dot="' + t[0] + '" hidden></em>' : '') + '</button>';
    }).join('') + '<span class="igx-sp"></span><button class="igx-nb igx-nb--more" id="igMore" title="Connection">' + IC.dots + '<span>More</span></button>';
    n.querySelectorAll('[data-v]').forEach(function (x) {
      x.onclick = function () { var v = x.getAttribute('data-v'); if (v === 'create') return editor(null); location.hash = 'instagram/' + v; };
    });
    n.querySelector('#igMore').onclick = connectionModal;
  }
  function dots() {
    var items = S.watch || [], seenA = ls('seenA') || 0, seenM = ls('seenM') || 0;
    var a = items.some(function (x) { return x.k !== 'message' && x.at > seenA; }), m = items.some(function (x) { return x.k === 'message' && x.at > seenM; });
    document.querySelectorAll('[data-dot="activity"]').forEach(function (d) { d.hidden = !a || S.view === 'activity'; });
    document.querySelectorAll('[data-dot="messages"]').forEach(function (d) { d.hidden = !m || S.view === 'messages'; });
  }
  function connectionModal() {
    var a = S.st.account;
    var m = H.modal('<h2>Instagram connection</h2><p class="muted">Connected as <b>@' + esc(a.username) + '</b>' + (a.pageName ? ' (through the Facebook Page ' + esc(a.pageName) + ')' : '') + '. ' + (a.expiresAt ? 'The connection lasts 60 days and renews itself.' : 'The connection doesn’t expire.') + '</p>' +
      '<p class="faint">Connected ' + when(a.connectedAt) + (a.expiresAt ? ' · current connection until ' + when(a.expiresAt) : '') + '</p>' +
      '<p class="faint">New messages, comments, likes, followers and tags are checked every few minutes while Ciel Admin is open, and every 30 minutes otherwise. They show in the bell and as phone notifications.</p>' +
      '<div class="row"><a class="b" href="https://www.instagram.com/' + encodeURIComponent(a.username) + '/" target="_blank" rel="noopener">' + IC.ext + '<span>Open Instagram</span></a><button class="b" id="igRe">Reconnect</button><button class="b b--ghost ig-danger" id="igOff">Disconnect</button><span class="ig-sp"></span><button class="b" data-x>Close</button></div>');
    m.querySelector('#igRe').onclick = function () { m.remove(); S.st = null; tokenBox(); };
    m.querySelector('#igOff').onclick = function () { HQAsk.confirm('Disconnect @' + a.username + '? Scheduled posts stay saved but won’t be published until you connect again.').then(function (ok) { if (!ok) return; api('ig-disconnect', {}).then(function () { m.remove(); S.st = null; S.media = null; render(''); }); }); };
  }

  /* ---------- profile: header, then posts · reels · tagged · planned ---------- */
  function profile(el) {
    var a = S.st.account;
    el.innerHTML = '<div id="igPh">' + headSkel() + '</div><div class="igx-tabs" id="igPt"></div><div id="igPg"></div>';
    var ph = el.querySelector('#igPh');
    (S.prof ? Promise.resolve(S.prof) : api('ig-profile')).then(function (r) {
      S.prof = r; var p = r.profile || {};
      ph.innerHTML = header(p, { me: true, actions: '<button class="igx-btn" id="igNew2">New post</button><button class="igx-btn" id="igPl">Planner</button><button class="igx-btn" id="igIn">Insights</button>' });
      ph.querySelector('#igNew2').onclick = function () { editor(null); };
      ph.querySelector('#igPl').onclick = function () { location.hash = 'instagram/planner'; };
      ph.querySelector('#igIn').onclick = function () { location.hash = 'instagram/stats'; };
    }).catch(function (e) { ph.innerHTML = header({ username: a.username, profile_picture_url: a.picture }, { me: true }) + '<p class="faint">' + esc(e.message) + '</p>'; });
    var tabs = [['posts', 'Posts', IC.grid], ['reels', 'Reels', IC.reels], ['tagged', 'Tagged', IC.tag], ['planned', 'Planned', IC.clock]];
    var pt = el.querySelector('#igPt');
    pt.innerHTML = tabs.map(function (t) { return '<button data-pt="' + t[0] + '" class="' + (S.ptab === t[0] ? 'is-on' : '') + '">' + t[2] + '<span>' + t[1] + '</span></button>'; }).join('');
    pt.querySelectorAll('[data-pt]').forEach(function (b) { b.onclick = function () { S.ptab = b.getAttribute('data-pt'); pt.querySelectorAll('[data-pt]').forEach(function (x) { x.classList.toggle('is-on', x === b); }); ptab(el.querySelector('#igPg')); }; });
    ptab(el.querySelector('#igPg'));
  }
  function headSkel() { return '<div class="igx-ph is-skel"><span class="igx-ring"><i class="igx-av igx-av--xl"></i></span><div class="igx-pi"><b class="skel"></b><b class="skel"></b><b class="skel"></b></div></div>'; }
  function header(p, o) {
    var site = p.website ? String(p.website).replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '') : '';
    return '<div class="igx-ph"><span class="igx-ring">' + av(p.profile_picture_url, p.username, 'igx-av--xl') + '</span>' +
      '<div class="igx-pi"><div class="igx-pr1"><h2>' + esc(p.username || '') + '</h2>' + (o.actions || '') + '</div>' +
      '<ul class="igx-pst"><li><b>' + full(p.media_count) + '</b> posts</li><li><b>' + num(p.followers_count) + '</b> followers</li><li><b>' + num(p.follows_count) + '</b> following</li></ul>' +
      '<div class="igx-bio">' + (p.name ? '<b>' + esc(p.name) + '</b>' : '') + (p.biography ? '<p>' + rich(p.biography) + '</p>' : '') + (site ? '<a href="' + esc(/^https?:/.test(p.website) ? p.website : 'https://' + p.website) + '" target="_blank" rel="noopener">' + esc(site) + '</a>' : '') + '</div></div></div>';
  }
  function ptab(el) {
    if (S.ptab === 'planned') return plannedGrid(el);
    if (S.ptab === 'tagged') return tagged(el);
    if (S.media) return showMedia(el);
    el.innerHTML = gridSkel();
    api('ig-media').then(function (r) { S.media = r.items; S.after = r.after; showMedia(el); }).catch(function (e) { el.innerHTML = '<p class="igx-empty">' + esc(e.message) + '</p>'; });
  }
  function gridSkel() { var h = ''; for (var i = 0; i < 9; i++) h += '<span class="igx-t is-skel"></span>'; return '<div class="igx-g">' + h + '</div>'; }
  function showMedia(el) {
    var reels = S.ptab === 'reels', list = reels ? S.media.filter(isReel) : S.media;
    if (!list.length && !S.after) { el.innerHTML = emptyState(reels ? IC.reels : IC.img, reels ? 'No reels yet' : 'Share photos', reels ? 'Reels you share will appear here.' : 'When you share photos, they will appear on your profile.', true); var c = el.querySelector('[data-new]'); if (c) c.onclick = function () { editor(null); }; return; }
    el.innerHTML = grid(list, reels) + (S.after ? '<div class="igx-more"><button class="igx-btn" id="igLm">Load more</button></div>' : '');
    bindGrid(el, list, { own: true });
    var lm = el.querySelector('#igLm'); if (lm) lm.onclick = function () { lm.textContent = 'Loading…'; lm.disabled = true; api('ig-media', undefined, 'after=' + encodeURIComponent(S.after)).then(function (r) { S.media = S.media.concat(r.items); S.after = r.after; showMedia(el); }); };
  }
  function emptyState(icon, title, text, cta) { return '<div class="igx-empty"><span class="igx-ei">' + icon + '</span><h3>' + title + '</h3><p>' + text + '</p>' + (cta ? '<button class="igx-link" data-new>Share your first post</button>' : '') + '</div>'; }
  function grid(list, tall) {
    return '<div class="igx-g' + (tall ? ' igx-g--tall' : '') + '">' + list.map(function (x, i) {
      var t = thumb(x), badge = x.media_type === 'CAROUSEL_ALBUM' ? IC.layers : isReel(x) ? IC.reels : '';
      return '<button class="igx-t" data-i="' + i + '">' + (t ? '<img src="' + esc(t) + '" alt="" loading="lazy" referrerpolicy="no-referrer">' : '<span class="igx-noimg">' + IC.img + '</span>') + (badge ? '<em>' + badge + '</em>' : '') +
        '<span class="igx-ov"><span>' + IC.heartOn + num(x.like_count) + '</span><span>' + sv('<path d="M20.66 17A10 10 0 1 0 17 20.62L22 22Z"/>', { fill: 'currentColor' }) + num(x.comments_count) + '</span></span></button>';
    }).join('') + '</div>';
  }
  function bindGrid(el, list, o) { el.querySelectorAll('.igx-t[data-i]').forEach(function (b) { b.onclick = function () { viewer(list, +b.getAttribute('data-i'), o); }; }); }
  function tagged(el) {
    if (S.tagged) return draw();
    el.innerHTML = gridSkel();
    api('ig-tags').then(function (r) { S.tagged = r.items; draw(); }).catch(function (e) { el.innerHTML = '<p class="igx-empty">' + esc(e.message) + '</p>'; });
    function draw() {
      if (!S.tagged.length) { el.innerHTML = emptyState(IC.tag, 'Photos of you', 'When people tag you in photos, they’ll appear here.'); return; }
      S.tagged.forEach(function (x) { x.owner = { username: x.username }; });
      el.innerHTML = grid(S.tagged); bindGrid(el, S.tagged, { own: false });
    }
  }

  /* ---------- planned posts (drafts, scheduled, failed) ---------- */
  function plannedGrid(el, big) {
    el.innerHTML = gridSkel();
    api('ig-posts').then(function (r) {
      S.posts = r.items;
      var up = r.items.filter(function (p) { return p.status !== 'published'; }).sort(function (a, b) { return (a.status === 'failed' ? -1 : 0) - (b.status === 'failed' ? -1 : 0) || (a.at || 9e15) - (b.at || 9e15) || b.updatedAt - a.updatedAt; });
      el.innerHTML = '<div class="igx-g igx-g--plan">' + '<button class="igx-t igx-t--new" data-new>' + IC.plus + '<span>New post</span></button>' + up.map(function (p) {
        var m = p.media[0], s = STATUS[p.status] || STATUS.draft;
        return '<button class="igx-t igx-t--p" data-p="' + p.id + '">' + (m ? (m.kind === 'video' ? '<video src="' + esc(m.url) + '#t=0.5" muted playsinline preload="metadata"></video>' : '<img src="' + esc(m.url) + '" alt="" loading="lazy">') : '<span class="igx-noimg">' + IC.img + '</span>') +
          (p.media.length > 1 ? '<em>' + IC.layers + '</em>' : m && m.kind === 'video' ? '<em>' + IC.reels + '</em>' : '') +
          '<span class="igx-pb"><span class="chip ' + s[1] + '">' + s[0] + '</span><b>' + (p.at ? when(p.at) : 'No time set') + '</b>' + (p.error ? '<small>' + esc(p.error) + '</small>' : p.caption ? '<small>' + esc(p.caption.slice(0, 70)) + '</small>' : '') + '</span></button>';
      }).join('') + '</div>' +
        (up.length ? '' : '<p class="igx-note">Nothing planned yet. Tap <b>New post</b> to write one, then post it now or pick a day and time.</p>') +
        '<p class="igx-note">Scheduled posts go out within about 20 minutes of their time, even when Ciel Admin is closed.</p>';
      el.querySelector('[data-new]').onclick = function () { editor(null); };
      el.querySelectorAll('[data-p]').forEach(function (x) { x.onclick = function () { var p = S.posts.filter(function (q) { return q.id === x.getAttribute('data-p'); })[0]; if (p) editor(p); }; });
      if (up.some(function (p) { return p.status === 'processing' || (p.status === 'scheduled' && p.at < Date.now() + 15 * 6e4); })) S.poll = setInterval(function () { if (!document.body.contains(el)) return stopPoll(); api('ig-cron').then(function () { return api('ig-posts'); }).then(function (r2) { if (JSON.stringify(r2.items.map(st)) !== JSON.stringify(S.posts.map(st))) { S.media = null; plannedGrid(el); } }).catch(function () { }); }, 30000);
    }).catch(function (e) { el.innerHTML = '<p class="igx-empty">' + esc(e.message) + '</p>'; });
    function st(p) { return p.id + p.status; }
  }
  function planner(el) {
    el.innerHTML = '<div class="igx-sec"><div class="igx-sech"><h2>Planner</h2><button class="igx-btn igx-btn--b" id="igNew3">New post</button></div><p class="igx-sub">Drafts and scheduled posts. Tap one to edit it, post it now or change its time.</p><div id="igPg"></div></div>';
    el.querySelector('#igNew3').onclick = function () { editor(null); };
    plannedGrid(el.querySelector('#igPg'));
  }

  /* ---------- the post viewer (like opening a post on instagram.com) ---------- */
  var V = null;
  function closeViewer() { if (V) { V.el.remove(); document.removeEventListener('keydown', V.key); V = null; } }
  function viewer(list, i, o) {
    closeViewer();
    var el = document.createElement('div'); el.className = 'igv'; document.body.appendChild(el);
    V = { el: el, list: list, i: i, o: o || {} };
    V.key = function (e) { if (e.key === 'Escape') closeViewer(); else if (e.key === 'ArrowRight' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) go(1); else if (e.key === 'ArrowLeft' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) go(-1); };
    document.addEventListener('keydown', V.key);
    el.addEventListener('click', function (e) { if (e.target === el) closeViewer(); });
    function go(d) { var j = V.i + d; if (j >= 0 && j < V.list.length) { V.i = j; draw(); } }
    V.go = go;
    draw();
    function draw() {
      var x = V.list[V.i], own = V.o.own !== false && !(x.owner && !x.owner.me && x.owner.username && S.st.account && x.owner.username !== S.st.account.username);
      var owner = own ? { username: S.st.account.username, picture: S.st.account.picture } : (x.owner || { username: x.username });
      el.innerHTML = '<button class="igv-x" title="Close">' + IC.x + '</button>' +
        (V.i > 0 ? '<button class="igv-nav igv-nav--l" title="Previous">' + IC.l + '</button>' : '') + (V.i < V.list.length - 1 ? '<button class="igv-nav igv-nav--r" title="Next">' + IC.r + '</button>' : '') +
        '<div class="igv-p"><div class="igv-m">' + slides(x) + '</div><div class="igv-s">' +
        '<div class="igv-h">' + av(owner.picture, owner.username) + '<b>' + esc(owner.username || '') + '</b>' + (own ? '' : '<a class="igx-link" href="#instagram/u/' + encodeURIComponent(owner.username || '') + '">View profile</a>') + '<span class="igx-sp"></span><button class="igv-ic" id="igvMore" title="More">' + IC.dots + '</button></div>' +
        '<div class="igv-c" id="igvC">' + (x.caption ? cRow({ username: owner.username, text: x.caption, timestamp: x.timestamp, pic: owner.picture }, { cap: true }) : '') + (own ? '<div class="igx-load igx-load--s"><i></i></div>' : '<p class="igv-note">Instagram only lets apps read comments on your own posts. <a href="' + esc(x.permalink || '#') + '" target="_blank" rel="noopener">See comments on Instagram</a></p>') + '</div>' +
        '<div class="igv-a"><div class="igv-ar"><button class="igv-ic igv-like' + (liked(x.id) ? ' is-on' : '') + '" id="igvLike" title="Like">' + (liked(x.id) ? IC.heartOn : IC.heart) + '</button><button class="igv-ic" id="igvCm" title="Comment">' + IC.msg + '</button><button class="igv-ic" id="igvSh" title="Copy link">' + IC.send + '</button><span class="igx-sp"></span>' + (own ? '<button class="igv-ic" id="igvIn" title="Insights">' + IC.stats + '</button>' : '') + '</div>' +
        '<b class="igv-likes" id="igvLk">' + likesText(x.like_count) + '</b><small class="igv-date">' + (x.timestamp ? longDate(x.timestamp) : '') + '</small><div id="igvIns"></div></div>' +
        (own ? '<form class="igv-f" id="igvF"><input id="igvT" maxlength="2200" placeholder="Add a comment…" autocomplete="off"><button type="submit" id="igvP" disabled>Post</button></form>' : '<a class="igv-f igv-f--ext" href="' + esc(x.permalink || '#') + '" target="_blank" rel="noopener">Comment on Instagram ' + IC.ext + '</a>') +
        '</div></div>';
      el.querySelector('.igv-x').onclick = closeViewer;
      var l = el.querySelector('.igv-nav--l'), r = el.querySelector('.igv-nav--r'); if (l) l.onclick = function () { go(-1); }; if (r) r.onclick = function () { go(1); };
      carousel(el.querySelector('.igv-m'));
      el.querySelector('#igvLike').onclick = function () { toggleLike(x, this); };
      el.querySelector('.igv-m').ondblclick = function () { if (!liked(x.id)) toggleLike(x, el.querySelector('#igvLike')); heartPop(el.querySelector('.igv-m')); };
      el.querySelector('#igvSh').onclick = function () { if (x.permalink && navigator.clipboard) navigator.clipboard.writeText(x.permalink).then(function () { H.toast('Link copied', 'ok'); }); };
      el.querySelector('#igvCm').onclick = function () { var t = el.querySelector('#igvT'); if (t) t.focus(); else if (x.permalink) window.open(x.permalink, '_blank', 'noopener'); };
      el.querySelector('#igvMore').onclick = function () { postMenu(x, own); };
      if (own) {
        var f = el.querySelector('#igvF'), t = el.querySelector('#igvT'), p = el.querySelector('#igvP');
        t.oninput = function () { p.disabled = !t.value.trim(); if (!/^@\S+\s/.test(t.value)) V.replyTo = null; };
        f.onsubmit = function (e) {
          e.preventDefault(); if (!t.value.trim()) return; p.disabled = true;
          var body = V.replyTo ? { op: 'reply', id: V.replyTo, text: t.value } : { op: 'comment', id: x.id, text: t.value };
          api('ig-comment', body).then(function () { t.value = ''; V.replyTo = null; x.comments_count = (x.comments_count || 0) + 1; comments(x); }, function (er) { p.disabled = false; H.toast(er.message, 'err'); });
        };
        el.querySelector('#igvIn').onclick = function () { insights(x); };
        comments(x);
        api('ig-media-one', undefined, 'id=' + encodeURIComponent(x.id) + '&t=' + encodeURIComponent(x.media_product_type || '')).then(function (rr) {
          if (!V || V.list[V.i] !== x) return;
          Object.assign(x, rr.item || {}); x._stats = rr.stats || {};
          var lk = el.querySelector('#igvLk'); if (lk) lk.innerHTML = likesText(x.like_count);
        }).catch(function () { });
      }
    }
  }
  function likesText(n) { n = +n || 0; return n === 0 ? 'Be the first to like this' : full(n) + ' like' + (n === 1 ? '' : 's'); }
  function slides(x) {
    var kids = x.children && x.children.data && x.children.data.length ? x.children.data : [x];
    var one = function (k) {
      var vid = k.media_type === 'VIDEO' || (k === x && isReel(x) && x.media_type !== 'IMAGE' && x.media_type !== 'CAROUSEL_ALBUM');
      if (vid && k.media_url) return '<video src="' + esc(k.media_url) + '" poster="' + esc(k.thumbnail_url || '') + '" controls playsinline loop preload="metadata"></video>';
      var u = k.media_url || k.thumbnail_url; return u ? '<img src="' + esc(u) + '" alt="" referrerpolicy="no-referrer">' : '<span class="igx-noimg">' + IC.img + '<small>Instagram didn’t share this photo</small></span>';
    };
    return '<div class="igv-tr">' + kids.map(function (k) { return '<div class="igv-sl">' + one(k) + '</div>'; }).join('') + '</div>' +
      (kids.length > 1 ? '<button class="igv-cl" data-d="-1">' + IC.l + '</button><button class="igv-cr" data-d="1">' + IC.r + '</button><div class="igv-dots">' + kids.map(function (_, i) { return '<i class="' + (i ? '' : 'is-on') + '"></i>'; }).join('') + '</div>' : '');
  }
  function carousel(m) {
    var tr = m.querySelector('.igv-tr'), n = tr.children.length, i = 0; if (n < 2) return;
    var set = function (j) { i = Math.max(0, Math.min(n - 1, j)); tr.style.transform = 'translateX(' + (-100 * i) + '%)'; m.querySelectorAll('.igv-dots i').forEach(function (d, k) { d.classList.toggle('is-on', k === i); }); m.querySelector('.igv-cl').hidden = i === 0; m.querySelector('.igv-cr').hidden = i === n - 1; tr.querySelectorAll('video').forEach(function (v) { v.pause(); }); };
    m.querySelectorAll('[data-d]').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); set(i + +b.getAttribute('data-d')); }; });
    var sx = null; m.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true }); m.addEventListener('touchend', function (e) { if (sx == null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) set(i + (dx < 0 ? 1 : -1)); sx = null; });
    set(0);
  }
  function heartPop(m) { var h = document.createElement('span'); h.className = 'igv-pop'; h.innerHTML = IC.heartOn; m.appendChild(h); setTimeout(function () { h.remove(); }, 900); }
  function toggleLike(x, btn) {
    var on = !liked(x.id); liked(x.id, on); x.like_count = Math.max(0, (+x.like_count || 0) + (on ? 1 : -1));
    var paint = function () { if (!btn || !document.body.contains(btn)) return; btn.classList.toggle('is-on', liked(x.id)); btn.innerHTML = liked(x.id) ? IC.heartOn : IC.heart; var lk = document.getElementById('igvLk'); if (lk) lk.innerHTML = likesText(x.like_count); document.querySelectorAll('[data-lk="' + x.id + '"]').forEach(function (e) { e.textContent = likesText(x.like_count); }); };
    paint(); if (on && btn) { btn.classList.add('is-pop'); setTimeout(function () { btn.classList.remove('is-pop'); }, 400); }
    api('ig-like', { id: x.id, on: on }).catch(function (e) { liked(x.id, !on); x.like_count = Math.max(0, x.like_count + (on ? -1 : 1)); paint(); H.toast(e.message, 'err'); });
  }
  function cRow(c, o) {
    var u = c.username || (c.from && c.from.username) || '';
    return '<div class="igc' + (o.reply ? ' igc--r' : '') + (c.hidden ? ' is-hidden' : '') + '">' + av(c.pic, u) + '<div class="igc-b"><p><b>' + esc(u) + '</b> ' + rich(c.text) + '</p>' +
      '<div class="igc-m"><span>' + (c.timestamp ? ago(c.timestamp) : '') + '</span>' + (c.like_count ? '<span>' + c.like_count + ' like' + (c.like_count > 1 ? 's' : '') + '</span>' : '') + (c.hidden ? '<span>Hidden</span>' : '') +
      (o.cap ? '' : (o.reply ? '' : '<button data-rp="' + c.id + '" data-u="' + esc(u) + '">Reply</button>') + '<button data-hd="' + c.id + '" data-h="' + (c.hidden ? 1 : 0) + '">' + (c.hidden ? 'Unhide' : 'Hide') + '</button><button data-dl="' + c.id + '">Delete</button>') + '</div></div>' +
      (o.cap ? '' : '<button class="igc-lk' + (liked(c.id) ? ' is-on' : '') + '" data-lc="' + c.id + '" title="Like">' + (liked(c.id) ? IC.heartOn : IC.heart) + '</button>') + '</div>';
  }
  function comments(x) {
    var box = document.getElementById('igvC'); if (!box) return;
    api('ig-comments', undefined, 'id=' + encodeURIComponent(x.id)).then(function (r) {
      box = document.getElementById('igvC'); if (!box || !V || V.list[V.i] !== x) return;
      var cap = x.caption ? cRow({ username: S.st.account.username, text: x.caption, timestamp: x.timestamp, pic: S.st.account.picture }, { cap: true }) : '';
      box.innerHTML = cap + (r.items.length ? r.items.map(function (c) { return cRow(c, {}) + ((c.replies && c.replies.data) || []).slice().reverse().map(function (y) { return cRow(y, { reply: true }); }).join(''); }).join('') : '<div class="igv-none"><h3>No comments yet.</h3><p>Start the conversation.</p></div>');
      box.querySelectorAll('[data-rp]').forEach(function (b) { b.onclick = function () { var t = document.getElementById('igvT'); V.replyTo = b.getAttribute('data-rp'); t.value = '@' + b.getAttribute('data-u') + ' '; t.focus(); document.getElementById('igvP').disabled = false; }; });
      box.querySelectorAll('[data-hd]').forEach(function (b) { b.onclick = function () { api('ig-comment', { op: b.getAttribute('data-h') === '1' ? 'unhide' : 'hide', id: b.getAttribute('data-hd') }).then(function () { comments(x); }, function (e) { H.toast(e.message, 'err'); }); }; });
      box.querySelectorAll('[data-dl]').forEach(function (b) { b.onclick = function () { HQAsk.confirm('Delete this comment?').then(function (ok) { if (ok) api('ig-comment', { op: 'delete', id: b.getAttribute('data-dl') }).then(function () { comments(x); }, function (e) { H.toast(e.message, 'err'); }); }); }; });
      box.querySelectorAll('[data-lc]').forEach(function (b) {
        b.onclick = function () {
          var id = b.getAttribute('data-lc'), on = !liked(id); liked(id, on); b.classList.toggle('is-on', on); b.innerHTML = on ? IC.heartOn : IC.heart;
          api('ig-like', { kind: 'comment', id: id, on: on }).catch(function (e) { liked(id, !on); b.classList.toggle('is-on', !on); b.innerHTML = !on ? IC.heartOn : IC.heart; H.toast(e.message, 'err'); });
        };
      });
    }).catch(function (e) { if (box) box.innerHTML = '<p class="igv-note">' + esc(e.message) + '</p>'; });
  }
  function insights(x) {
    var box = document.getElementById('igvIns'); if (!box) return;
    if (box.innerHTML) { box.innerHTML = ''; return; }
    var show = function (st) {
      var k = [['reach', 'Reached'], ['views', 'Views'], ['likes', 'Likes'], ['comments', 'Comments'], ['shares', 'Shares'], ['saved', 'Saves'], ['total_interactions', 'Interactions']].filter(function (k) { return st[k[0]] != null; });
      box.innerHTML = '<div class="igv-ins">' + (k.length ? k.map(function (k) { return '<span><b>' + num(st[k[0]]) + '</b><small>' + k[1] + '</small></span>'; }).join('') : '<p class="igv-note">' + esc(st.error || 'No insights for this post yet.') + '</p>') + '</div>';
    };
    if (x._stats) return show(x._stats);
    box.innerHTML = '<div class="igx-load igx-load--s"><i></i></div>';
    api('ig-media-one', undefined, 'id=' + encodeURIComponent(x.id) + '&t=' + encodeURIComponent(x.media_product_type || '')).then(function (r) { x._stats = r.stats || {}; show(x._stats); }, function (e) { box.innerHTML = '<p class="igv-note">' + esc(e.message) + '</p>'; });
  }
  function postMenu(x, own) {
    var m = H.modal('<div class="igx-menu">' +
      (x.permalink ? '<a href="' + esc(x.permalink) + '" target="_blank" rel="noopener">Go to post on Instagram</a><button data-a="copy">Copy link</button>' : '') +
      (own ? '<button data-a="ins">View insights</button><button data-a="cm">' + (x.comment_enabled === false ? 'Turn on commenting' : 'Turn off commenting') + '</button><button data-a="del" class="is-red">Delete post</button>' : '<a href="#instagram/u/' + encodeURIComponent((x.owner && x.owner.username) || x.username || '') + '" data-x>About this account</a>') +
      '<button data-x>Cancel</button></div>');
    m.classList.add('igx-menum');
    m.querySelectorAll('[data-a]').forEach(function (b) {
      b.onclick = function () {
        var a = b.getAttribute('data-a'); m.remove();
        if (a === 'copy' && navigator.clipboard) navigator.clipboard.writeText(x.permalink).then(function () { H.toast('Link copied', 'ok'); });
        if (a === 'ins') insights(x);
        if (a === 'cm') { var on = x.comment_enabled === false; api('ig-media-comments', { id: x.id, on: on }).then(function () { x.comment_enabled = on; H.toast(on ? 'Commenting turned on' : 'Commenting turned off', 'ok'); }, function (e) { H.toast(e.message, 'err'); }); }
        if (a === 'del') HQAsk.confirm('Delete this post from Instagram? This can’t be undone.').then(function (ok) {
          if (!ok) return;
          api('ig-media-del', { id: x.id }).then(function () { H.toast('Post deleted', 'ok'); if (S.media) S.media = S.media.filter(function (y) { return y.id !== x.id; }); if (S.prof && S.prof.profile) S.prof.profile.media_count = Math.max(0, (S.prof.profile.media_count || 1) - 1); closeViewer(); render(S.view === 'feed' ? 'feed' : 'profile'); }, function (e) { H.toast(e.message, 'err'); });
        });
      };
    });
  }

  /* ---------- home feed: your posts + the accounts you add ---------- */
  function feed(el) {
    el.innerHTML = '<div class="igx-feed"><div class="igx-fc" id="igFc"><div class="igx-load"><i></i></div></div><aside class="igx-fs" id="igFs"></aside></div>';
    api('ig-feed').then(function (r) {
      S.feed = r.items; S.following = r.following;
      var fc = el.querySelector('#igFc');
      fc.innerHTML = (r.following.length ? '' : '<div class="igx-card igx-hint"><b>Make this your feed</b><p>Add the business and creator accounts you want to keep up with, and their latest posts show here with yours.</p><button class="igx-btn igx-btn--b" data-go="search">Find accounts</button></div>') +
        (r.items.length ? r.items.map(function (x, i) { return post(x, i); }).join('') : '<p class="igx-empty">No posts yet.</p>') +
        (r.failed ? '<p class="igx-note">' + r.failed + ' account' + (r.failed > 1 ? 's' : '') + ' couldn’t be loaded right now.</p>' : '') + '<p class="igx-note">Instagram doesn’t let apps show your full home feed, so this shows your posts and the accounts you add in Search.</p>';
      fc.querySelectorAll('[data-go]').forEach(function (b) { b.onclick = function () { location.hash = 'instagram/' + b.getAttribute('data-go'); }; });
      fc.querySelectorAll('.igx-post').forEach(function (p) {
        var i = +p.getAttribute('data-i'), x = S.feed[i], o = { own: !!(x.owner && x.owner.me) };
        carousel(p.querySelector('.igv-m'));
        p.querySelector('[data-like]').onclick = function () { toggleLike(x, this); };
        p.querySelector('.igv-m').ondblclick = function () { if (!liked(x.id)) toggleLike(x, p.querySelector('[data-like]')); heartPop(p.querySelector('.igv-m')); };
        p.querySelectorAll('[data-open]').forEach(function (b) { b.onclick = function () { viewer(S.feed, i, o); }; });
        p.querySelector('[data-share]').onclick = function () { if (x.permalink && navigator.clipboard) navigator.clipboard.writeText(x.permalink).then(function () { H.toast('Link copied', 'ok'); }); };
        var mo = p.querySelector('[data-more]'); if (mo) mo.onclick = function () { mo.parentNode.innerHTML = rich(x.caption); };
      });
      side(el.querySelector('#igFs'));
    }).catch(function (e) { el.querySelector('#igFc').innerHTML = '<p class="igx-empty">' + esc(e.message) + '</p>'; });
  }
  function post(x, i) {
    var o = x.owner || {}, cap = x.caption || '', short = cap.length > 125 ? cap.slice(0, 125) : null;
    return '<article class="igx-post" data-i="' + i + '"><header>' + '<span class="igx-ring igx-ring--s">' + av(o.picture, o.username) + '</span><a href="' + (o.me ? '#instagram/profile' : '#instagram/u/' + encodeURIComponent(o.username || '')) + '"><b>' + esc(o.username || '') + '</b></a><span class="igx-faint">• ' + ago(x.timestamp) + '</span><span class="igx-sp"></span><a class="igv-ic" href="' + esc(x.permalink || '#') + '" target="_blank" rel="noopener" title="Open on Instagram">' + IC.ext + '</a></header>' +
      '<div class="igv-m igx-pm">' + slides(x) + '</div>' +
      '<div class="igv-ar"><button class="igv-ic igv-like' + (liked(x.id) ? ' is-on' : '') + '" data-like title="Like">' + (liked(x.id) ? IC.heartOn : IC.heart) + '</button><button class="igv-ic" data-open title="Comments">' + IC.msg + '</button><button class="igv-ic" data-share title="Copy link">' + IC.send + '</button></div>' +
      '<b class="igv-likes" data-lk="' + x.id + '">' + likesText(x.like_count) + '</b>' +
      (cap ? '<p class="igx-cap"><b>' + esc(o.username || '') + '</b> <span>' + (short ? rich(short) + '… <button class="igx-faint" data-more>more</button>' : rich(cap)) + '</span></p>' : '') +
      (x.comments_count ? '<button class="igx-faint igx-vc" data-open>View all ' + full(x.comments_count) + ' comment' + (x.comments_count > 1 ? 's' : '') + '</button>' : '') + '</article>';
  }
  function side(el) {
    var a = S.st.account;
    el.innerHTML = '<div class="igx-me">' + av(a.picture, a.username) + '<span><b>' + esc(a.username) + '</b><small>' + esc((S.prof && S.prof.profile && S.prof.profile.name) || '') + '</small></span></div>' +
      '<div class="igx-fsh"><b>Accounts in your feed</b><button class="igx-link" data-go="search">Add</button></div>' +
      ((S.following || []).length ? S.following.map(function (f) { return '<a class="igx-acc" href="#instagram/u/' + encodeURIComponent(f.username) + '">' + av(f.picture, f.username) + '<span><b>' + esc(f.username) + '</b><small>' + esc(f.name || '') + '</small></span></a>'; }).join('') : '<p class="igx-faint">None yet. Search for an account and tap “Add to feed”.</p>');
    el.querySelectorAll('[data-go]').forEach(function (b) { b.onclick = function () { location.hash = 'instagram/' + b.getAttribute('data-go'); }; });
  }

  /* ---------- search + other accounts ---------- */
  function search(el) {
    var recent = ls('recent') || [];
    el.innerHTML = '<div class="igx-sec igx-search"><h2>Search</h2><form id="igSf" class="igx-sbar">' + IC.search + '<input id="igSq" placeholder="Search a username, e.g. natgeo" autocomplete="off" autocapitalize="off" spellcheck="false"></form>' +
      '<p class="igx-sub">Look up any business or creator account to see their posts, like them, and add them to your feed. Instagram doesn’t share personal accounts with apps.</p><div id="igSl"><div class="igx-load igx-load--s"><i></i></div></div>' +
      (recent.length ? '<div class="igx-fsh"><b>Recent</b><button class="igx-link" id="igClr">Clear all</button></div><div>' + recent.map(function (u) { return '<a class="igx-acc" href="#instagram/u/' + encodeURIComponent(u) + '">' + av(null, u) + '<span><b>' + esc(u) + '</b></span></a>'; }).join('') + '</div>' : '') + '</div>';
    var q = el.querySelector('#igSq'); q.focus();
    el.querySelector('#igSf').onsubmit = function (e) { e.preventDefault(); var u = q.value.trim().replace(/^@/, '').toLowerCase(); if (u) location.hash = 'instagram/u/' + encodeURIComponent(u); };
    var c = el.querySelector('#igClr'); if (c) c.onclick = function () { ls('recent', []); search(el); };
    api('ig-following').then(function (r) {
      S.following = r.list;
      el.querySelector('#igSl').innerHTML = r.list.length ? '<div class="igx-fsh"><b>In your feed</b></div>' + r.list.map(function (f) { return '<div class="igx-acc"><a href="#instagram/u/' + encodeURIComponent(f.username) + '">' + av(f.picture, f.username) + '<span><b>' + esc(f.username) + '</b><small>' + esc(f.name || '') + '</small></span></a><button class="igv-ic" data-rm="' + esc(f.username) + '" title="Remove from feed">' + IC.x + '</button></div>'; }).join('') : '';
      el.querySelectorAll('[data-rm]').forEach(function (b) { b.onclick = function () { api('ig-follow', { username: b.getAttribute('data-rm'), on: false }).then(function () { search(el); }); }; });
    }).catch(function () { el.querySelector('#igSl').innerHTML = ''; });
  }
  function userPage(el) {
    var u = S.user;
    el.innerHTML = '<div id="igPh">' + headSkel() + '</div><div class="igx-tabs"><button class="is-on">' + IC.grid + '<span>Posts</span></button></div><div id="igPg">' + gridSkel() + '</div>';
    var list = [], after = null;
    api('ig-discover', undefined, 'u=' + encodeURIComponent(u)).then(function (r) {
      var p = r.profile, me = p.username === S.st.account.username;
      var rec = (ls('recent') || []).filter(function (x) { return x !== p.username; }); rec.unshift(p.username); ls('recent', rec.slice(0, 8));
      var inFeed = (S.following || []).some(function (f) { return f.username === p.username; });
      var ph = el.querySelector('#igPh');
      var paint = function () {
        ph.innerHTML = header(p, { actions: me ? '<a class="igx-btn" href="#instagram/profile">Your profile</a>' : '<button class="igx-btn ' + (inFeed ? '' : 'igx-btn--b') + '" id="igFol">' + (inFeed ? 'In your feed ' + IC.check : 'Add to feed') + '</button><a class="igx-btn" href="https://www.instagram.com/' + encodeURIComponent(p.username) + '/" target="_blank" rel="noopener">Open on Instagram</a>' });
        var f = ph.querySelector('#igFol'); if (f) f.onclick = function () { f.disabled = true; api('ig-follow', { username: p.username, on: !inFeed, name: p.name, picture: p.profile_picture_url }).then(function (rr) { S.following = rr.list; inFeed = !inFeed; H.toast(inFeed ? '@' + p.username + ' added to your feed' : 'Removed from your feed', 'ok'); paint(); }, function (e) { f.disabled = false; H.toast(e.message, 'err'); }); };
      };
      if (!S.following) api('ig-following').then(function (rr) { S.following = rr.list; inFeed = rr.list.some(function (f) { return f.username === p.username; }); paint(); }).catch(function () { });
      paint();
      list = r.items; after = r.after; draw();
    }).catch(function (e) { el.innerHTML = '<div class="igx-empty"><span class="igx-ei">' + IC.search + '</span><h3>@' + esc(u) + '</h3><p>' + esc(e.message) + '</p><a class="igx-link" href="#instagram/search">Back to search</a></div>'; });
    function draw() {
      var g = el.querySelector('#igPg');
      if (!list.length) { g.innerHTML = emptyState(IC.img, 'No posts yet', ''); return; }
      g.innerHTML = grid(list) + (after ? '<div class="igx-more"><button class="igx-btn" id="igLm">Load more</button></div>' : '');
      bindGrid(g, list, { own: false });
      var lm = g.querySelector('#igLm'); if (lm) lm.onclick = function () { lm.textContent = 'Loading…'; lm.disabled = true; api('ig-discover', undefined, 'u=' + encodeURIComponent(u) + '&after=' + encodeURIComponent(after)).then(function (r) { list = list.concat(r.items); after = r.after; draw(); }); };
    }
  }

  /* ---------- notifications ---------- */
  function activity(el) {
    el.innerHTML = '<div class="igx-sec igx-act"><div class="igx-sech"><h2>Notifications</h2><button class="igx-btn" id="igChk">Check now</button></div><div id="igAl"><div class="igx-load"><i></i></div></div>' +
      '<p class="igx-note">Checked every few minutes while Ciel Admin is open and every 30 minutes otherwise; new ones also come to the bell and your phone. Instagram shares how many people liked a post, not who.</p></div>';
    var load = function (force) {
      api('ig-watch', undefined, force ? 'force=1' : '').then(function (r) { if (r.items) S.watch = r.items; draw(); ls('seenA', Date.now()); dots(); }).catch(function (e) { el.querySelector('#igAl').innerHTML = '<p class="igx-empty">' + esc(e.message) + '</p>'; });
    };
    el.querySelector('#igChk').onclick = function () { this.textContent = 'Checking…'; this.disabled = true; var b = this; load(true); setTimeout(function () { b.textContent = 'Check now'; b.disabled = false; }, 2500); };
    load(!S.watch);
    function draw() {
      var items = (S.watch || []).filter(function (x) { return x.k !== 'message'; }), seen = ls('seenA') || 0, box = el.querySelector('#igAl');
      if (!items.length) { box.innerHTML = '<div class="igx-empty"><span class="igx-ei">' + IC.heart + '</span><h3>Activity on your posts</h3><p>When someone likes or comments on your posts, follows you or tags you, you’ll see it here.</p></div>'; return; }
      var groups = [['Today', 864e5], ['This week', 7 * 864e5], ['This month', 30 * 864e5], ['Earlier', 1e15]], used = {}, h = '';
      groups.forEach(function (g) {
        var list = items.filter(function (x) { return !used[x.id] && Date.now() - x.at < g[1]; }); list.forEach(function (x) { used[x.id] = 1; });
        if (list.length) h += '<h3 class="igx-gh">' + g[0] + '</h3>' + list.map(function (x) { return actRow(x, x.at > seen); }).join('');
      });
      box.innerHTML = h;
      box.querySelectorAll('[data-m]').forEach(function (b) { b.onclick = function () { openMedia(b.getAttribute('data-m'), b.getAttribute('data-link')); }; });
    }
  }
  function actRow(x, unseen) {
    var u = '<b>' + esc(x.user || 'Someone') + '</b>';
    var t = ({ like: '<b>' + x.n + ' ' + (x.n > 1 ? 'people' : 'person') + '</b> liked your post.', comment: u + ' commented: ' + esc(x.text || ''), follow: '<b>' + x.n + ' new follower' + (x.n > 1 ? 's' : '') + '</b> started following you.', tag: u + ' tagged you in a post.', message: u + ' sent you a message.' })[x.k] || '';
    var ic = x.k === 'like' ? '<i class="igx-av igx-av--ic igx-av--r">' + IC.heartOn + '</i>' : x.k === 'follow' ? '<i class="igx-av igx-av--ic igx-av--b">' + IC.user + '</i>' : av(null, x.user);
    return '<button class="igx-ar' + (unseen ? ' is-new' : '') + '"' + (x.media ? ' data-m="' + esc(x.media) + '" data-link="' + esc(x.link || '') + '"' : '') + '>' + ic + '<span>' + t + ' <small>' + ago(x.at) + '</small></span>' + (x.thumb ? '<img src="' + esc(x.thumb) + '" alt="" referrerpolicy="no-referrer" loading="lazy">' : '') + '</button>';
  }
  function openMedia(id, link) {
    if (link) return window.open(link, '_blank', 'noopener');
    api('ig-media-one', undefined, 'id=' + encodeURIComponent(id)).then(function (r) { viewer([r.item], 0, { own: true }); }, function (e) { H.toast(e.message, 'err'); });
  }

  /* ---------- messages (Direct) ---------- */
  function messages(el) {
    var a = S.st.account;
    el.innerHTML = '<div class="igd' + (S.open ? ' is-thread' : '') + '"><div class="igd-l"><div class="igd-lh"><b>' + esc(a.username) + '</b></div><div class="igd-lt">Messages</div><div id="igCl"><div class="igx-load igx-load--s"><i></i></div></div></div><div class="igd-t" id="igTh">' + dmEmpty() + '</div></div>';
    loadConvos(el);
    if (S.open) loadThread(el, S.open);
    ls('seenM', Date.now()); dots();
    S.poll = setInterval(function () { if (!document.body.contains(el) || location.hash.indexOf('#instagram/messages') !== 0) return stopPoll(); if (document.hidden) return; loadConvos(el, true); if (S.open) loadThread(el, S.open, true); }, 20000);
  }
  function dmEmpty() { return '<div class="igd-e"><span class="igx-ei">' + IC.dm + '</span><h3>Your messages</h3><p>Pick a conversation to read and reply.</p></div>'; }
  function other(c, me) { var ps = (c.participants && c.participants.data) || []; return ps.filter(function (p) { return String(p.id) !== String(me) && p.username !== S.st.account.username; })[0] || ps[0] || {}; }
  function loadConvos(el, quiet) {
    var cl = el.querySelector('#igCl'); if (!cl) return;
    api('ig-convos').then(function (r) {
      S.convos = r.items; S.me = r.me;
      var seen = ls('seenC') || {};
      if (!r.items.length) { cl.innerHTML = '<p class="igx-faint igx-pad">No messages yet. When someone messages @' + esc(S.st.account.username) + ', it shows here.</p>'; return; }
      cl.innerHTML = r.items.map(function (c) {
        var o = other(c, r.me), last = c.messages && c.messages.data && c.messages.data[0], mine = last && last.from && (String(last.from.id) === String(r.me) || last.from.username === S.st.account.username);
        var unread = last && !mine && seen[c.id] !== last.id && S.open !== c.id;
        return '<button class="igd-c' + (S.open === c.id ? ' is-on' : '') + (unread ? ' is-unread' : '') + '" data-c="' + esc(c.id) + '">' + av(null, o.username) + '<span><b>' + esc(o.username || 'Instagram user') + '</b><small>' + (mine ? 'You: ' : '') + esc(last ? (last.message || (last.attachments ? 'Sent an attachment' : '…')) : '') + ' · ' + (c.updated_time ? ago(c.updated_time) : '') + '</small></span>' + (unread ? '<em></em>' : '') + '</button>';
      }).join('');
      cl.querySelectorAll('[data-c]').forEach(function (b) { b.onclick = function () { S.open = b.getAttribute('data-c'); cl.querySelectorAll('.igd-c').forEach(function (x) { x.classList.toggle('is-on', x === b); }); b.classList.remove('is-unread'); var d = b.querySelector('em'); if (d) d.remove(); el.querySelector('.igd').classList.add('is-thread'); loadThread(el, S.open); }; });
    }).catch(function (e) { if (!quiet) cl.innerHTML = '<p class="igx-pad">' + esc(e.message) + '</p>'; });
  }
  function loadThread(el, id, quiet) {
    var th = el.querySelector('#igTh'); if (!th) return;
    if (!quiet) th.innerHTML = '<div class="igx-load"><i></i></div>';
    api('ig-thread', undefined, 'id=' + encodeURIComponent(id)).then(function (r) {
      if (S.open !== id) return;
      var me = r.me, isMe = function (m) { return m.from && (String(m.from.id) === String(me) || m.from.username === S.st.account.username); };
      var o = other(r, me), msgs = ((r.messages && r.messages.data) || []).slice().reverse();
      var lastIn = msgs.filter(function (m) { return !isMe(m); }).pop();
      if (msgs.length) { var sc = ls('seenC') || {}; sc[id] = msgs[msgs.length - 1].id; ls('seenC', sc); }
      var open24 = lastIn && Date.now() - new Date(lastIn.created_time).getTime() < 24 * 3600e3;
      var draft = th.querySelector('#igTx') ? th.querySelector('#igTx').value : '', prevT = 0;
      var body = msgs.map(function (m, k) {
        var mine = isMe(m), att = (m.attachments && m.attachments.data) || [], t = new Date(m.created_time).getTime(), next = msgs[k + 1];
        var sep = t - prevT > 3600e3 ? '<div class="igd-time">' + new Date(t).toLocaleString('en-KE', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + '</div>' : ''; prevT = t;
        var lastOfGroup = !next || isMe(next) !== mine;
        return sep + '<div class="igd-m' + (mine ? ' is-me' : '') + '">' + (!mine ? (lastOfGroup ? av(null, o.username, 'igx-av--xs') : '<i class="igx-av igx-av--xs igx-av--gap"></i>') : '') + '<div class="igd-bw">' +
          att.map(function (a) { var u = (a.image_data && a.image_data.url) || (a.video_data && a.video_data.url) || a.file_url; return u ? (a.video_data ? '<video class="igd-media" src="' + esc(u) + '" controls playsinline></video>' : '<img class="igd-media" src="' + esc(u) + '" alt="" referrerpolicy="no-referrer">') : ''; }).join('') +
          (m.story ? '<small class="igd-story">' + (mine ? 'You replied to their story' : 'Replied to your story') + '</small>' : '') +
          (m.message ? '<p class="igd-b" title="' + esc(new Date(t).toLocaleString('en-KE')) + '">' + esc(m.message) + '</p>' : (att.length || m.story ? '' : '<p class="igd-b igd-b--x">Message type not shown here</p>')) + '</div></div>';
      }).join('');
      th.innerHTML = '<div class="igd-th"><button class="igv-ic igd-back">' + IC.l + '</button>' + av(null, o.username) + '<span><b>' + esc(o.username || 'Instagram user') + '</b><small>Instagram</small></span><span class="igx-sp"></span><a class="igv-ic" href="https://www.instagram.com/' + encodeURIComponent(o.username || '') + '/" target="_blank" rel="noopener" title="Profile">' + IC.user + '</a></div>' +
        '<div class="igd-ms" id="igMs"><div class="igd-who">' + av(null, o.username, 'igx-av--xl') + '<b>' + esc(o.username || '') + '</b><a class="igx-btn" href="https://www.instagram.com/' + encodeURIComponent(o.username || '') + '/" target="_blank" rel="noopener">View profile</a></div>' + body + '</div>' +
        (open24 || !lastIn ? '' : '<p class="igd-24">It’s been more than 24 hours since their last message. Instagram only lets businesses reply within 24 hours from apps; reply in the Instagram app.</p>') +
        '<div class="igd-comp"><button class="igv-ic" id="igPic" title="Send a photo">' + IC.img + '</button><input type="file" id="igPf" hidden accept="image/*"><textarea id="igTx" rows="1" maxlength="1000" placeholder="Message…"></textarea><button class="igd-send" id="igSend" hidden>Send</button></div>';
      var ms = th.querySelector('#igMs'); ms.scrollTop = ms.scrollHeight;
      th.querySelector('.igd-back').onclick = function () { el.querySelector('.igd').classList.remove('is-thread'); S.open = null; th.innerHTML = dmEmpty(); loadConvos(el, true); };
      var tx = th.querySelector('#igTx'), sb = th.querySelector('#igSend'); tx.value = draft;
      var fit = function () { tx.style.height = 'auto'; tx.style.height = Math.min(120, tx.scrollHeight) + 'px'; sb.hidden = !tx.value.trim(); }; fit();
      tx.oninput = fit;
      var send = function (img) {
        if (!tx.value.trim() && !img) return; var t = tx.value; sb.disabled = true;
        api('ig-send', { to: o.id, text: t, image: img || undefined }).then(function () { tx.value = ''; fit(); sb.disabled = false; loadThread(el, id, true); loadConvos(el, true); }, function (e) { H.toast(e.message, 'err'); sb.disabled = false; });
      };
      sb.onclick = function () { send(); };
      tx.onkeydown = function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
      th.querySelector('#igPic').onclick = function () { th.querySelector('#igPf').click(); };
      th.querySelector('#igPf').onchange = function () { var f = this.files[0]; this.value = ''; if (!f) return; H.toast('Sending photo…'); toJpeg(f, null).then(function (r2) { return upload(r2.file, r2.name, function () { }); }).then(function (p) { send(p); }, function (e) { H.toast(e.message, 'err'); }); };
      if (!quiet) tx.focus();
    }).catch(function (e) { if (!quiet) th.innerHTML = '<p class="igx-pad">' + esc(e.message) + '</p>'; });
  }

  /* ---------- insights ---------- */
  function stats(el) {
    el.innerHTML = '<div class="igx-load"><i></i></div>';
    Promise.all([S.prof ? Promise.resolve(S.prof) : api('ig-profile'), api('ig-insights', undefined, 'days=' + (S.days || 7)).catch(function () { return { stats: {} }; })]).then(function (r) {
      S.prof = r[0]; var p = r[0].profile || {}, lim = r[0].limit, s = r[1].stats || {};
      var tile = function (v, l, big) { return '<div class="igx-tile' + (big ? ' igx-tile--big' : '') + '"><b>' + num(v) + '</b><small>' + l + '</small></div>'; };
      var ins = [['reach', 'Accounts reached'], ['views', 'Views'], ['accounts_engaged', 'Accounts engaged'], ['total_interactions', 'Interactions'], ['likes', 'Likes'], ['comments', 'Comments'], ['shares', 'Shares'], ['saves', 'Saves'], ['profile_links_taps', 'Link taps']].filter(function (k) { return typeof s[k[0]] === 'number'; });
      var fc = s.follower_count || [], max = Math.max.apply(null, fc.map(function (v) { return v.n; }).concat([1]));
      el.innerHTML = '<div class="igx-sec"><div class="igx-sech"><h2>Insights</h2><div class="igx-seg">' + [7, 14, 30].map(function (d) { return '<button data-d="' + d + '" class="' + ((S.days || 7) === d ? 'is-on' : '') + '">Last ' + d + ' days</button>'; }).join('') + '</div></div>' +
        '<div class="igx-tiles">' + tile(p.followers_count, 'Followers', 1) + tile(p.follows_count, 'Following', 1) + tile(p.media_count, 'Posts', 1) + '</div>' +
        (ins.length ? '<h3 class="igx-gh">Overview</h3><div class="igx-tiles">' + ins.map(function (k) { return tile(s[k[0]], k[1]); }).join('') + '</div>' : '<p class="igx-note">Instagram hasn’t shared account stats yet. They appear once the account has some activity.</p>') +
        (fc.length ? '<h3 class="igx-gh">New followers per day</h3><div class="igx-bars">' + fc.map(function (v) { return '<span title="' + esc(new Date(v.at).toLocaleDateString('en-KE') + ': ' + v.n) + '"><i style="height:' + Math.max(3, Math.round(v.n / max * 100)) + '%"></i></span>'; }).join('') + '</div>' : '') +
        (lim && lim.config ? '<p class="igx-note">Posts published through apps in the last 24 hours: ' + (lim.quota_usage || 0) + ' of ' + lim.config.quota_total + '.</p>' : '') + '</div>';
      el.querySelectorAll('[data-d]').forEach(function (b) { b.onclick = function () { S.days = +b.getAttribute('data-d'); stats(el); }; });
    }).catch(function (e) { el.innerHTML = '<p class="igx-empty">' + esc(e.message) + '</p>'; });
  }

  /* ---------- background check for new activity while Ciel Admin is open ---------- */
  function bg() {
    if (document.hidden) return;
    api('ig-watch').then(function (r) { if (r && r.items) { S.watch = r.items; dots(); } }).catch(function () { });
  }

  function goConnect() { api('ig-connect').then(function (r) { location.href = r.url; }).catch(function (e) { H.toast(e.message, 'err'); }); }
  function connect(b) {
    var st = S.st, body = b.querySelector('#igBody');
    body.innerHTML = '<div class="card ig-connect"><div class="card__b"><i class="ig-big">' + IC.ig + '</i><h2>Connect Instagram</h2>' +
      '<p class="muted">Post and schedule photos, carousels, reels and stories, answer messages and comments, and see your stats, all from here.</p>' +
      (st.configured ? '<button class="b b--p" id="igTok">Connect with an access token</button><p class="faint">Make the token in Meta Business Settings → Users → System users → Generate token. Use a <b>Business</b> or <b>Creator</b> account.</p><button class="b b--sm b--ghost" id="igGo">Or sign in with Meta</button>'
        : '<div class="ig-setup"><b>One step first</b><p>In Vercel (Project → Settings → Environment Variables) add <code>IG_APP_SECRET</code> = your App secret (Meta app → App settings → Basic), then redeploy. In your Meta app (Instagram → API setup with Unified login), add this as the redirect URL:</p><code class="ig-copy">' + esc(st.redirect) + '</code></div>') +
      (st.storage ? '' : '<p class="ig-warn">The private Blob store isn’t connected, so posts can’t be saved.</p>') + '</div></div>';
    var g = body.querySelector('#igGo'); if (g) g.onclick = goConnect;
    var t = body.querySelector('#igTok'); if (t) t.onclick = tokenBox;
  }
  /* connect with a token made in Business Settings → System users → Generate token */
  function tokenBox() {
    var m = H.modal('<h2>Connect with an access token</h2>' +
      '<p class="muted">In Meta Business Settings, open <b>Users → System users</b>, pick your system user (it needs your Instagram account assigned), click <b>Generate token</b>, choose this app, set it to never expire, tick the Instagram, Pages and <b>business_management</b> permissions, then copy the token and paste it here.</p>' +
      '<label class="field"><span>Access token</span><input type="password" id="igTk" autocomplete="off" spellcheck="false" placeholder="EAA…"></label>' +
      '<p class="ig-warn" id="igTkMsg" hidden></p>' +
      '<div class="row"><span class="ig-sp"></span><button class="b" data-x>Cancel</button><button class="b b--p" id="igTkGo">Connect</button></div>');
    var go = m.querySelector('#igTkGo'), msg = m.querySelector('#igTkMsg');
    go.onclick = function () {
      var v = m.querySelector('#igTk').value.trim(); if (!v) return;
      go.disabled = true; go.textContent = 'Connecting…'; msg.hidden = true;
      api('ig-token', { token: v }).then(function (r) { m.remove(); H.toast('Connected @' + r.account.username, 'ok'); S.st = null; S.prof = null; S.media = null; render(''); })
        .catch(function (e) { msg.textContent = e.message; msg.hidden = false; go.disabled = false; go.textContent = 'Connect'; });
    };
  }


  /* ---------- the post editor ---------- */
  var RATIO = { photo: [0.8, 1.91], carousel: [0.8, 1.91], story: [0.5625, 0.5625], reel: [0.5625, 0.5625] };
  function editor(p) {
    var d = p ? JSON.parse(JSON.stringify(p)) : { type: 'photo', caption: '', media: [], altText: '', collaborators: [], shareToFeed: true, at: null, status: 'draft' };
    var m = H.modal('<div class="ig-ed"><div class="ig-edh"><h2>' + (p ? 'Edit post' : 'New post') + '</h2><button class="b b--sm b--ghost" data-x>✕</button></div>' +
      '<div class="ig-edc"><div class="ig-edl">' +
      '<div class="tabs ig-types">' + Object.keys(TYPE).map(function (k) { return '<button data-ty="' + k + '">' + TYPE[k][1] + '<span>' + TYPE[k][0] + '</span></button>'; }).join('') + '</div>' +
      '<div class="ig-media" id="igMd"></div><input type="file" id="igFile" hidden multiple accept="image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime">' +
      '<p class="faint" id="igMHint"></p></div>' +
      '<div class="ig-edr"><label class="field" id="igCapF"><span>Caption <i id="igCnt"></i></span><textarea class="hq-in" id="igCap" rows="7" maxlength="2200" placeholder="Write a caption… #hashtags and @mentions work as on Instagram"></textarea></label>' +
      '<details class="ig-more"><summary>More options</summary><label class="field" id="igAltF"><span>Alt text (describes the photo for people who can’t see it)</span><input class="hq-in" id="igAlt" maxlength="1000"></label>' +
      '<label class="field" id="igColF"><span>Collaborators (up to 3 usernames)</span><input class="hq-in" id="igCol" placeholder="@friend, @brand"></label>' +
      '<label class="ig-ck" id="igFeedF"><input type="checkbox" id="igFeed"> Also show the reel in the main feed</label></details>' +
      '<div class="ig-when"><label class="field"><span>Post on</span><input class="hq-in" type="datetime-local" id="igAt"></label><div class="ig-quick">' + [['In 1 hour', 1], ['Tonight 7pm', 'e'], ['Tomorrow 9am', 't']].map(function (q) { return '<button class="b b--sm" data-q="' + q[1] + '">' + q[0] + '</button>'; }).join('') + '</div></div>' +
      '<p class="ig-msg" id="igMsg"></p>' +
      '<div class="ig-acts">' + (p ? '<button class="b b--ghost ig-danger" id="igDel">' + IC.del + '</button>' : '') + '<span class="ig-sp"></span><button class="b" id="igDraft">Save draft</button><button class="b" id="igSched">Schedule</button><button class="b b--p" id="igNow">Post now</button></div>' +
      '</div></div></div>');
    m.classList.add('ig-modal');
    var $ = function (s) { return m.querySelector(s); };
    $('#igCap').value = d.caption || ''; $('#igAlt').value = d.altText || ''; $('#igCol').value = (d.collaborators || []).map(function (c) { return '@' + c; }).join(', '); $('#igFeed').checked = d.shareToFeed !== false;
    if (d.at) $('#igAt').value = localInput(d.at);
    $('#igAt').min = localInput(Date.now());
    function msg(t, err) { var e = $('#igMsg'); e.textContent = t || ''; e.classList.toggle('is-err', !!err); }
    function type(t) {
      d.type = t; m.querySelectorAll('[data-ty]').forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-ty') === t); });
      $('#igCapF').hidden = t === 'story'; $('#igAltF').hidden = t !== 'photo'; $('#igColF').hidden = t === 'story'; $('#igFeedF').hidden = t !== 'reel';
      $('#igMHint').textContent = { photo: 'One photo. Best shape: square or 4:5 portrait (1080 × 1350).', carousel: '2 to 10 photos or videos. They all show in the first one’s shape, so keep them the same shape.', reel: 'One video, 3 seconds to 15 minutes, upright 9:16 (1080 × 1920), MP4 or MOV.', story: 'One photo or video, upright 9:16 (1080 × 1920). Videos up to 60 seconds.' }[t];
      draw(); count();
    }
    function count() { var c = $('#igCap').value, tags = (c.match(/#[\p{L}\p{N}_]+/gu) || []).length; $('#igCnt').textContent = c.length + ' / 2200' + (tags ? ' · ' + tags + ' hashtag' + (tags > 1 ? 's' : '') + (tags > 30 ? ' (30 max)' : '') : ''); }
    function draw() {
      var max = d.type === 'carousel' ? 10 : 1;
      $('#igMd').innerHTML = d.media.map(function (x, i) {
        return '<div class="ig-mi" data-i="' + i + '">' + (x.kind === 'video' ? '<video src="' + esc(x.url) + '#t=0.5" muted playsinline preload="metadata"></video><em>' + IC.play + '</em>' : '<img src="' + esc(x.url) + '" alt="">') +
          (x.up ? '<span class="ig-up">' + esc(x.up) + '</span>' : '') +
          '<span class="ig-mb">' + (d.media.length > 1 && i ? '<button data-mv="' + i + '" title="Move left">' + IC.l + '</button>' : '') + '<button data-rm="' + i + '" title="Remove">✕</button></span></div>';
      }).join('') + (d.media.length < max ? '<button class="ig-add" id="igAdd">' + IC.img + '<span>' + (d.media.length ? 'Add more' : 'Add ' + (d.type === 'reel' ? 'a video' : d.type === 'carousel' ? 'photos or videos' : d.type === 'story' ? 'a photo or video' : 'a photo')) + '</span></button>' : '');
      var a = $('#igAdd'); if (a) a.onclick = function () { $('#igFile').multiple = d.type === 'carousel'; $('#igFile').click(); };
      m.querySelectorAll('[data-rm]').forEach(function (b) { b.onclick = function () { d.media.splice(+b.getAttribute('data-rm'), 1); draw(); }; });
      m.querySelectorAll('[data-mv]').forEach(function (b) { b.onclick = function () { var i = +b.getAttribute('data-mv'), t = d.media[i]; d.media[i] = d.media[i - 1]; d.media[i - 1] = t; draw(); }; });
    }
    $('#igFile').onchange = function () {
      var files = [].slice.call(this.files || []); this.value = '';
      var room = (d.type === 'carousel' ? 10 : 1) - d.media.length; if (room <= 0 && d.type !== 'carousel') { d.media = []; room = 1; }
      files.slice(0, room).forEach(function (f) { addFile(f); });
    };
    function addFile(f) {
      var isV = /^video\//.test(f.type) || /\.(mp4|mov)$/i.test(f.name);
      if (d.type === 'reel' && !isV) return msg('A reel needs a video. Pick “Photo” for a photo post.', true);
      if (d.type === 'photo' && isV) { type('reel'); }
      var item = { kind: isV ? 'video' : 'image', url: '', up: 'Preparing…', name: f.name }; d.media.push(item); draw();
      (isV ? videoInfo(f) : toJpeg(f, RATIO[d.type])).then(function (r) {
        item.url = r.preview; item.w = r.w; item.h = r.h; item.up = 'Uploading…'; draw();
        if (isV && d.type !== 'carousel' && Math.abs(r.w / r.h - 0.5625) > 0.06) msg('This video isn’t 9:16 upright. Instagram may crop it.', false);
        return upload(r.file, r.name, function (pc) { item.up = 'Uploading ' + pc + '%'; var u = m.querySelector('.ig-mi[data-i="' + d.media.indexOf(item) + '"] .ig-up'); if (u) u.textContent = item.up; });
      }).then(function (path) { item.path = path; item.up = ''; draw(); }).catch(function (e) { d.media.splice(d.media.indexOf(item), 1); draw(); msg((e && e.message) || 'Upload failed.', true); });
    }
    function collect(status) {
      var at = $('#igAt').value ? new Date($('#igAt').value).getTime() : null;
      return { id: d.id, type: d.type, caption: d.type === 'story' ? '' : $('#igCap').value, altText: $('#igAlt').value, collaborators: $('#igCol').value, shareToFeed: $('#igFeed').checked, at: status === 'draft' ? at : at, status: status,
        media: d.media.filter(function (x) { return x.path; }).map(function (x) { return { path: x.path, kind: x.kind, w: x.w, h: x.h, name: x.name }; }) };
    }
    function busy(on) { m.querySelectorAll('.ig-acts .b').forEach(function (b) { b.disabled = on; }); }
    function pending() { if (d.media.some(function (x) { return !x.path; })) { msg('Wait for the upload to finish.', true); return true; } }
    function save(status) {
      if (pending()) return Promise.reject();
      var body = collect(status);
      if (status === 'scheduled' && !body.at) { msg('Pick a day and time first.', true); $('#igAt').focus(); return Promise.reject(); }
      busy(true); msg('Saving…');
      return api('ig-post-save', body).then(function (r) { d.id = r.item.id; busy(false); return r.item; }, function (e) { busy(false); msg(e.message, true); throw e; });
    }
    $('#igDraft').onclick = function () { save('draft').then(function () { m.remove(); H.toast('Draft saved', 'ok'); refreshTab('planner'); }, function () { }); };
    $('#igSched').onclick = function () { save('scheduled').then(function (it) { m.remove(); H.toast('Scheduled for ' + when(it.at), 'ok'); refreshTab('planner'); }, function () { }); };
    $('#igNow').onclick = function () {
      if (pending()) return;
      var body = collect('draft'); body.at = null;
      busy(true); msg('Saving…');
      api('ig-post-save', body).then(function (r) { d.id = r.item.id; msg('Publishing to Instagram… (videos can take a minute)'); return api('ig-post-now', { id: d.id }); })
        .then(function (r) { m.remove(); H.toast(r.finished ? 'Posted to Instagram' : 'Instagram is still processing the video. It will post in a few minutes.', 'ok'); refreshTab(r.finished ? 'profile' : 'planner'); }, function (e) { busy(false); msg(e.message, true); });
    };
    var del = $('#igDel'); if (del) del.onclick = function () { HQAsk.confirm('Delete this ' + (d.status === 'draft' ? 'draft' : 'post') + '?').then(function (ok) { if (!ok) return; api('ig-post-del', { id: d.id }).then(function () { m.remove(); refreshTab(); }); }); };
    m.querySelectorAll('[data-ty]').forEach(function (b) { b.onclick = function () { var t = b.getAttribute('data-ty'); if (t !== 'carousel' && d.media.length > 1) d.media = d.media.slice(0, 1); type(t); }; });
    m.querySelectorAll('[data-q]').forEach(function (b) { b.onclick = function () { var q = b.getAttribute('data-q'), t = new Date(); if (q === '1') t = new Date(Date.now() + 36e5); else if (q === 'e') { t.setHours(19, 0, 0, 0); if (t < Date.now()) t.setDate(t.getDate() + 1); } else { t.setDate(t.getDate() + 1); t.setHours(9, 0, 0, 0); } $('#igAt').value = localInput(t.getTime()); }; });
    $('#igCap').oninput = count;
    type(d.type);
  }
  function refreshTab(t) { S.media = null; t = t || S.view; if (location.hash === '#instagram/' + t || (t === 'profile' && location.hash === '#instagram')) render(t); else location.hash = 'instagram/' + t; }

  /* photos → JPEG (Instagram only takes JPEG), at most 1440 px wide, trimmed to a shape Instagram accepts */
  function toJpeg(file, ratio) {
    return new Promise(function (ok, no) {
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        var w = im.naturalWidth, h = im.naturalHeight, r = w / h, sx = 0, sy = 0, sw = w, sh = h;
        if (ratio && r < ratio[0] - 0.01) { sh = Math.round(w / ratio[0]); sy = Math.round((h - sh) / 2); }
        else if (ratio && r > ratio[1] + 0.01) { sw = Math.round(h * ratio[1]); sx = Math.round((w - sw) / 2); }
        var k = Math.min(1, 1440 / sw), cw = Math.round(sw * k), ch = Math.round(sh * k), c = document.createElement('canvas'); c.width = cw; c.height = ch;
        var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, cw, ch); g.drawImage(im, sx, sy, sw, sh, 0, 0, cw, ch);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) { if (!b) return no(new Error('Couldn’t read this photo.')); ok({ file: b, name: 'photo.jpg', w: cw, h: ch, preview: URL.createObjectURL(b) }); }, 'image/jpeg', 0.92);
      };
      im.onerror = function () { URL.revokeObjectURL(url); no(new Error('This photo type can’t be read here. Save it as JPG or PNG and try again.')); };
      im.src = url;
    });
  }
  function videoInfo(file) {
    return new Promise(function (ok, no) {
      if (file.size > 300 * 1048576) return no(new Error('That video is over 300 MB. Export a smaller copy first.'));
      var url = URL.createObjectURL(file), v = document.createElement('video'); v.preload = 'metadata'; v.muted = true;
      v.onloadedmetadata = function () { ok({ file: file, name: /\.mov$/i.test(file.name) ? 'video.mov' : 'video.mp4', w: v.videoWidth, h: v.videoHeight, dur: v.duration, preview: url }); };
      v.onerror = function () { ok({ file: file, name: /\.mov$/i.test(file.name) ? 'video.mov' : 'video.mp4', w: 0, h: 0, preview: url }); };
      v.src = url;
    });
  }
  function lib() { return window.CielBlobUpload ? Promise.resolve(window.CielBlobUpload) : new Promise(function (ok, no) { var sc = document.createElement('script'); sc.src = '/assets/vendor/vercel-blob-client-2.8.2.min.js'; sc.onload = function () { ok(window.CielBlobUpload); }; sc.onerror = function () { no(new Error('Upload tool didn’t load.')); }; document.head.appendChild(sc); }); }
  function upload(blob, name, onPc) {
    return Promise.all([lib(), api('ig-key', { name: name })]).then(function (r) {
      var type = /\.mov$/.test(r[1].path) ? 'video/quicktime' : /\.mp4$/.test(r[1].path) ? 'video/mp4' : /\.png$/.test(r[1].path) ? 'image/png' : 'image/jpeg';
      return r[0](r[1].path, blob, { access: 'private', handleUploadUrl: '/api/hq?route=ig-upload', multipart: blob.size > 20 * 1048576, contentType: type, onUploadProgress: function (e) { onPc(Math.round(e.percentage || 0)); } }).then(function () { return r[1].path; });
    });
  }


  window.HQIg = { init: function (h) { H = h; setTimeout(bg, 6000); setInterval(bg, 240000); }, render: render };
})();
