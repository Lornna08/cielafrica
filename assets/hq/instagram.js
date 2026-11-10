/* ============================================================
   CIEL ADMIN — Instagram: connect the account, plan and schedule posts
   (photo, carousel, reel, story), see published posts with their stats
   and comments (reply, hide, delete), and read and answer messages.
   Server: lib/hq/instagram.js (routes ig-*). Tabs: #instagram/posts,
   /published, /messages, /stats.
   ============================================================ */
(function () {
  'use strict';
  var H, S = { tab: 'posts', st: null, posts: null, media: null, after: null, convos: null, open: null, poll: null };
  var esc = function (s) { return H.esc(s); };
  var IC = {
    ig: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><path d="M17.5 6.5h.01"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
    msg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>',
    img: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
    layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M4 16V5a1 1 0 0 1 1-1h11"/></svg>',
    ext: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>',
    del: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/></svg>',
    l: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',
    r: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>'
  };
  var TYPE = { photo: ['Photo', IC.img], carousel: ['Carousel', IC.layers], reel: ['Reel', IC.play], story: ['Story', IC.ig] };
  var STATUS = { draft: ['Draft', ''], scheduled: ['Scheduled', 'chip--b'], processing: ['Publishing…', 'chip--y'], published: ['Published', 'chip--g'], failed: ['Failed', 'chip--r'] };
  function api(route, body, qs) { return H.api('/api/hq?route=' + route + (qs ? '&' + qs : ''), body); }
  function ago(t) { var s = (Date.now() - new Date(t).getTime()) / 1000; if (s < 60) return 'now'; if (s < 3600) return Math.floor(s / 60) + 'm'; if (s < 86400) return Math.floor(s / 3600) + 'h'; if (s < 7 * 86400) return Math.floor(s / 86400) + 'd'; return new Date(t).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }); }
  function when(t) { return new Date(t).toLocaleString('en-KE', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
  function num(n) { n = +n || 0; return n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e4 ? Math.round(n / 1e3) + 'K' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : String(n); }
  function localInput(t) { var d = new Date(t - new Date().getTimezoneOffset() * 6e4); return d.toISOString().slice(0, 16); }
  function stopPoll() { if (S.poll) { clearInterval(S.poll); S.poll = null; } }

  /* ---------- page ---------- */
  function render(sub, extra) {
    stopPoll();
    if (sub === 'connected') { H.toast('Instagram connected', 'ok'); history.replaceState(null, '', '#instagram'); sub = 'posts'; }
    if (sub === 'error') { H.toast(decodeURIComponent(extra || 'Could not connect Instagram.'), 'err'); history.replaceState(null, '', '#instagram'); sub = 'posts'; }
    S.tab = /^(posts|published|messages|stats)$/.test(sub || '') ? sub : 'posts';
    var b = H.body('<div class="ig"><div id="igHead"></div><div id="igBody"><p class="muted">Loading…</p></div></div>');
    api('ig-status').then(function (st) {
      S.st = st; head(b);
      if (!st.account) return connect(b);
      ({ posts: posts, published: published, messages: messages, stats: stats })[S.tab](b.querySelector('#igBody'));
      api('ig-cron').catch(function () { });   /* publish anything due while the admin is open */
    }).catch(function (e) { b.querySelector('#igBody').innerHTML = '<div class="card"><div class="card__b"><p>' + esc(e.message) + '</p></div></div>'; });
  }
  function head(b) {
    var a = S.st.account, h = b.querySelector('#igHead');
    if (!a) { h.innerHTML = ''; return; }
    var days = a.expiresAt ? Math.round((a.expiresAt - Date.now()) / 864e5) : 999;
    h.innerHTML = '<div class="ig-top"><div class="ig-who">' + (a.picture ? '<img src="' + esc(a.picture) + '" alt="" referrerpolicy="no-referrer">' : '<i>' + IC.ig + '</i>') +
      '<span><b>@' + esc(a.username) + '</b><small>' + (days < 7 ? '<span class="ig-warn">Connection ends in ' + days + ' days. Reconnect below.</span>' : (a.expiresAt ? 'Connected · renews itself' : 'Connected')) + '</small></span></div>' +
      '<div class="tabs ig-tabs">' + [['posts', 'Planner'], ['published', 'Posts'], ['messages', 'Messages'], ['stats', 'Stats']].map(function (t) { return '<button data-t="' + t[0] + '" class="' + (S.tab === t[0] ? 'is-on' : '') + '">' + t[1] + '</button>'; }).join('') + '</div>' +
      '<span class="ig-sp"></span><button class="b b--p b--sm" id="igNew">+ New post</button><a class="b b--sm" href="https://www.instagram.com/' + encodeURIComponent(a.username) + '/" target="_blank" rel="noopener">' + IC.ext + '<span>Open</span></a><button class="b b--sm b--ghost" id="igMore" title="Connection">⋯</button></div>';
    h.querySelectorAll('[data-t]').forEach(function (x) { x.onclick = function () { location.hash = 'instagram/' + x.getAttribute('data-t'); }; });
    h.querySelector('#igNew').onclick = function () { editor(null); };
    h.querySelector('#igMore').onclick = function () {
      var m = H.modal('<h2>Instagram connection</h2><p class="muted">Signed in as <b>@' + esc(a.username) + '</b>' + (a.pageName ? ' (through the Facebook Page ' + esc(a.pageName) + ')' : '') + '. ' + (a.expiresAt ? 'The connection lasts 60 days and renews itself.' : 'The connection doesn’t expire.') + '</p>' +
        '<p class="faint">Connected ' + when(a.connectedAt) + (a.expiresAt ? ' · current connection until ' + when(a.expiresAt) : '') + '</p>' +
        '<div class="row"><button class="b" id="igRe">Reconnect</button><button class="b b--ghost ig-danger" id="igOff">Disconnect</button><span class="ig-sp"></span><button class="b" data-x>Close</button></div>');
      m.querySelector('#igRe').onclick = goConnect;
      m.querySelector('#igOff').onclick = function () { HQAsk.confirm('Disconnect @' + a.username + '? Scheduled posts stay saved but won’t be published until you connect again.').then(function (ok) { if (!ok) return; api('ig-disconnect', {}).then(function () { m.remove(); render('posts'); }); }); };
    };
  }
  function goConnect() { api('ig-connect').then(function (r) { location.href = r.url; }).catch(function (e) { H.toast(e.message, 'err'); }); }
  function connect(b) {
    var st = S.st, body = b.querySelector('#igBody');
    body.innerHTML = '<div class="card ig-connect"><div class="card__b"><i class="ig-big">' + IC.ig + '</i><h2>Connect Instagram</h2>' +
      '<p class="muted">Post and schedule photos, carousels, reels and stories, answer messages and comments, and see your stats, all from here.</p>' +
      (st.configured ? '<button class="b b--p" id="igGo">Connect Instagram</button><p class="faint">Meta will ask you to sign in (with Instagram or Facebook), pick your business and tick your Instagram account. Use a <b>Business</b> or <b>Creator</b> account.</p>'
        : '<div class="ig-setup"><b>One step first</b><p>In Vercel (Project → Settings → Environment Variables) add <code>IG_APP_SECRET</code> = your App secret (Meta app → App settings → Basic), then redeploy. In your Meta app (Instagram → API setup with Unified login), add this as the redirect URL:</p><code class="ig-copy">' + esc(st.redirect) + '</code></div>') +
      (st.storage ? '' : '<p class="ig-warn">The private Blob store isn’t connected, so posts can’t be saved.</p>') + '</div></div>';
    var g = body.querySelector('#igGo'); if (g) g.onclick = goConnect;
  }

  /* ---------- planner: drafts, scheduled, failed, recently published ---------- */
  function posts(el) {
    el.innerHTML = '<p class="muted">Loading your posts…</p>';
    api('ig-posts').then(function (r) {
      S.posts = r.items;
      var up = r.items.filter(function (p) { return p.status !== 'published'; }).sort(function (a, b) { return (a.at || 9e15) - (b.at || 9e15) || b.updatedAt - a.updatedAt; });
      var done = r.items.filter(function (p) { return p.status === 'published'; }).sort(function (a, b) { return b.publishedAt - a.publishedAt; }).slice(0, 12);
      el.innerHTML = (up.length ? '' : '<div class="card ig-empty"><div class="card__b"><p><b>Nothing planned yet.</b> Tap <b>+ New post</b> to write a post, then post it now or pick a day and time.</p></div></div>') +
        group('Coming up', up.filter(function (p) { return p.status === 'scheduled' || p.status === 'processing'; })) +
        group('Needs attention', up.filter(function (p) { return p.status === 'failed'; })) +
        group('Drafts', up.filter(function (p) { return p.status === 'draft'; })) +
        group('Published from here', done) +
        '<p class="faint ig-note">Scheduled posts go out within about 20 minutes of their time, even when this page is closed.</p>';
      el.querySelectorAll('[data-p]').forEach(function (x) { x.onclick = function () { var p = S.posts.filter(function (q) { return q.id === x.getAttribute('data-p'); })[0]; if (p) (p.status === 'published' ? openPublished(p) : editor(p)); }; });
      if (up.some(function (p) { return p.status === 'processing' || (p.status === 'scheduled' && p.at < Date.now() + 15 * 6e4); })) S.poll = setInterval(function () { if (location.hash.indexOf('#instagram') === 0 && S.tab === 'posts') api('ig-cron').then(function () { return api('ig-posts'); }).then(function (r2) { if (JSON.stringify(r2.items.map(st)) !== JSON.stringify(S.posts.map(st))) posts(el); }).catch(function () { }); else stopPoll(); }, 30000);
    }).catch(function (e) { el.innerHTML = '<p>' + esc(e.message) + '</p>'; });
    function st(p) { return p.id + p.status; }
  }
  function group(title, list) {
    if (!list.length) return '';
    return '<h3 class="ig-h">' + title + ' <i>' + list.length + '</i></h3><div class="ig-plan">' + list.map(function (p) {
      var m = p.media[0], s = STATUS[p.status] || STATUS.draft;
      return '<button class="card ig-pi" data-p="' + p.id + '"><span class="ig-th">' + (m ? (m.kind === 'video' ? '<video src="' + esc(m.url) + '#t=0.5" muted playsinline preload="metadata"></video>' : '<img src="' + esc(m.url) + '" alt="" loading="lazy">') : '') + (p.media.length > 1 ? '<em>' + IC.layers + '</em>' : m && m.kind === 'video' ? '<em>' + IC.play + '</em>' : '') + '</span>' +
        '<span class="ig-pt"><span class="ig-row"><span class="chip ' + s[1] + '">' + s[0] + '</span><span class="chip">' + TYPE[p.type][0] + '</span></span>' +
        '<b>' + (p.status === 'published' ? 'Posted ' + when(p.publishedAt) : p.at ? when(p.at) : 'No time set') + '</b>' +
        '<small>' + esc((p.caption || '').slice(0, 120) || (p.type === 'story' ? 'Story' : 'No caption')) + '</small>' +
        (p.error ? '<small class="ig-err">' + esc(p.error) + '</small>' : '') + '</span></button>';
    }).join('') + '</div>';
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
    $('#igDraft').onclick = function () { save('draft').then(function () { m.remove(); H.toast('Draft saved', 'ok'); refreshTab(); }, function () { }); };
    $('#igSched').onclick = function () { save('scheduled').then(function (it) { m.remove(); H.toast('Scheduled for ' + when(it.at), 'ok'); refreshTab('posts'); }, function () { }); };
    $('#igNow').onclick = function () {
      if (pending()) return;
      var body = collect('draft'); body.at = null;
      busy(true); msg('Saving…');
      api('ig-post-save', body).then(function (r) { d.id = r.item.id; msg('Publishing to Instagram… (videos can take a minute)'); return api('ig-post-now', { id: d.id }); })
        .then(function (r) { m.remove(); H.toast(r.finished ? 'Posted to Instagram' : 'Instagram is still processing the video. It will post in a few minutes.', 'ok'); refreshTab(r.finished ? 'posts' : 'posts'); }, function (e) { busy(false); msg(e.message, true); });
    };
    var del = $('#igDel'); if (del) del.onclick = function () { HQAsk.confirm('Delete this ' + (d.status === 'draft' ? 'draft' : 'post') + '?').then(function (ok) { if (!ok) return; api('ig-post-del', { id: d.id }).then(function () { m.remove(); refreshTab(); }); }); };
    m.querySelectorAll('[data-ty]').forEach(function (b) { b.onclick = function () { var t = b.getAttribute('data-ty'); if (t !== 'carousel' && d.media.length > 1) d.media = d.media.slice(0, 1); type(t); }; });
    m.querySelectorAll('[data-q]').forEach(function (b) { b.onclick = function () { var q = b.getAttribute('data-q'), t = new Date(); if (q === '1') t = new Date(Date.now() + 36e5); else if (q === 'e') { t.setHours(19, 0, 0, 0); if (t < Date.now()) t.setDate(t.getDate() + 1); } else { t.setDate(t.getDate() + 1); t.setHours(9, 0, 0, 0); } $('#igAt').value = localInput(t.getTime()); }; });
    $('#igCap').oninput = count;
    type(d.type);
  }
  function refreshTab(t) { if (t && S.tab !== t) location.hash = 'instagram/' + t; else render(S.tab); }

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

  /* ---------- published posts (from Instagram) ---------- */
  function published(el, more) {
    if (!more) { el.innerHTML = '<p class="muted">Loading posts from Instagram…</p>'; S.media = []; S.after = null; }
    api('ig-media', undefined, S.after ? 'after=' + encodeURIComponent(S.after) : '').then(function (r) {
      S.media = S.media.concat(r.items); S.after = r.after;
      el.innerHTML = (S.media.length ? '<div class="ig-grid">' + S.media.map(function (x, i) {
        var src = x.media_type === 'VIDEO' ? x.thumbnail_url : (x.media_url || (x.children && x.children.data && x.children.data[0] && (x.children.data[0].thumbnail_url || x.children.data[0].media_url)));
        return '<button class="ig-gi" data-i="' + i + '"><img src="' + esc(src || '') + '" alt="" loading="lazy" referrerpolicy="no-referrer">' + (x.media_type === 'CAROUSEL_ALBUM' ? '<em>' + IC.layers + '</em>' : x.media_type === 'VIDEO' ? '<em>' + IC.play + '</em>' : '') +
          '<span class="ig-gs"><span>' + IC.heart + num(x.like_count) + '</span><span>' + IC.msg + num(x.comments_count) + '</span></span></button>';
      }).join('') + '</div>' : '<div class="card"><div class="card__b"><p class="muted">No posts on this account yet.</p></div></div>') +
        (S.after ? '<div class="ig-moreb"><button class="b" id="igMoreP">Load more</button></div>' : '') +
        '<p class="faint ig-note">Stories aren’t listed here (Instagram only shares them while they’re live).</p>';
      el.querySelectorAll('[data-i]').forEach(function (b) { b.onclick = function () { postDrawer(S.media[+b.getAttribute('data-i')]); }; });
      var mb = el.querySelector('#igMoreP'); if (mb) mb.onclick = function () { mb.textContent = 'Loading…'; published(el, true); };
    }).catch(function (e) { el.innerHTML = '<p>' + esc(e.message) + '</p>'; });
  }
  function openPublished(p) { if (p.igId) postDrawer({ id: p.igId, permalink: p.permalink, caption: p.caption, media_type: p.type === 'carousel' ? 'CAROUSEL_ALBUM' : p.media[0] && p.media[0].kind === 'video' ? 'VIDEO' : 'IMAGE', media_product_type: p.type === 'story' ? 'STORY' : p.type === 'reel' ? 'REELS' : 'FEED', timestamp: p.publishedAt }); }
  function postDrawer(x) {
    var d = H.drawer('Post', '<div id="igPd"><p class="muted">Loading…</p></div>');
    var box = d.querySelector('#igPd');
    api('ig-media-one', undefined, 'id=' + encodeURIComponent(x.id) + '&t=' + encodeURIComponent(x.media_product_type || '')).then(function (r) {
      var it = r.item, st = r.stats || {}, kids = it.children && it.children.data ? it.children.data : [it];
      box.innerHTML = '<div class="ig-pm">' + kids.map(function (k) { return k.media_type === 'VIDEO' ? '<video src="' + esc(k.media_url || '') + '" poster="' + esc(k.thumbnail_url || '') + '" controls playsinline preload="none"></video>' : '<img src="' + esc(k.media_url || '') + '" alt="" referrerpolicy="no-referrer">'; }).join('') + '</div>' +
        '<p class="ig-cap">' + esc(it.caption || '') + '</p><p class="faint">' + when(it.timestamp) + ' · <a href="' + esc(it.permalink || '#') + '" target="_blank" rel="noopener">Open on Instagram</a></p>' +
        '<div class="ig-stats">' + [['reach', 'Reached'], ['views', 'Views'], ['likes', 'Likes'], ['comments', 'Comments'], ['shares', 'Shares'], ['saved', 'Saves']].filter(function (k) { return st[k[0]] != null; }).map(function (k) { return '<span><b>' + num(st[k[0]]) + '</b><small>' + k[1] + '</small></span>'; }).join('') + '</div>' +
        (it.media_product_type === 'STORY' ? '' : '<label class="ig-ck"><input type="checkbox" id="igCe"' + (it.comment_enabled !== false ? ' checked' : '') + '> Allow comments</label>') +
        '<p class="faint">Instagram doesn’t let apps change a caption or delete a post after it’s published. Use the Instagram app for that.</p>' +
        '<h3 class="ig-h">Comments</h3><div id="igCm"><p class="muted">Loading…</p></div>';
      var ce = box.querySelector('#igCe'); if (ce) ce.onchange = function () { api('ig-media-comments', { id: it.id, on: ce.checked }).then(function () { H.toast(ce.checked ? 'Comments on' : 'Comments off', 'ok'); }, function (e) { ce.checked = !ce.checked; H.toast(e.message, 'err'); }); };
      loadComments(box.querySelector('#igCm'), it.id);
    }).catch(function (e) { box.innerHTML = '<p>' + esc(e.message) + '</p>'; });
  }
  function loadComments(el, mediaId) {
    api('ig-comments', undefined, 'id=' + encodeURIComponent(mediaId)).then(function (r) {
      if (!r.items.length) { el.innerHTML = '<p class="faint">No comments yet.</p>'; return; }
      var one = function (c, reply) {
        return '<div class="ig-c' + (reply ? ' ig-c--r' : '') + (c.hidden ? ' is-hidden' : '') + '"><div><b>@' + esc(c.username || (c.from && c.from.username) || '') + '</b> ' + esc(c.text) + '<small>' + ago(c.timestamp) + (c.hidden ? ' · hidden' : '') + '</small></div>' +
          '<span class="ig-ca">' + (reply ? '' : '<button data-rp="' + c.id + '" data-u="' + esc(c.username || '') + '">Reply</button>') + '<button data-hd="' + c.id + '" data-h="' + (c.hidden ? 1 : 0) + '">' + (c.hidden ? 'Unhide' : 'Hide') + '</button><button data-dl="' + c.id + '">Delete</button></span></div>';
      };
      el.innerHTML = r.items.map(function (c) { return one(c) + ((c.replies && c.replies.data) || []).map(function (x) { return one(x, true); }).join(''); }).join('');
      el.querySelectorAll('[data-rp]').forEach(function (b) {
        b.onclick = function () {
          var row = b.closest('.ig-c'); if (row.nextSibling && row.nextSibling.className === 'ig-rb') return;
          var f = document.createElement('div'); f.className = 'ig-rb'; f.innerHTML = '<input class="hq-in" maxlength="2200" value="@' + esc(b.getAttribute('data-u')) + ' "><button class="b b--p b--sm">' + IC.send + '</button>';
          row.after(f); var i = f.querySelector('input'); i.focus(); i.setSelectionRange(i.value.length, i.value.length);
          var go = function () { if (!i.value.trim()) return; f.querySelector('button').disabled = true; api('ig-comment', { op: 'reply', id: b.getAttribute('data-rp'), text: i.value }).then(function () { H.toast('Reply posted', 'ok'); loadComments(el, mediaId); }, function (e) { f.querySelector('button').disabled = false; H.toast(e.message, 'err'); }); };
          f.querySelector('button').onclick = go; i.onkeydown = function (e) { if (e.key === 'Enter') go(); };
        };
      });
      el.querySelectorAll('[data-hd]').forEach(function (b) { b.onclick = function () { api('ig-comment', { op: b.getAttribute('data-h') === '1' ? 'unhide' : 'hide', id: b.getAttribute('data-hd') }).then(function () { loadComments(el, mediaId); }, function (e) { H.toast(e.message, 'err'); }); }; });
      el.querySelectorAll('[data-dl]').forEach(function (b) { b.onclick = function () { HQAsk.confirm('Delete this comment?').then(function (ok) { if (ok) api('ig-comment', { op: 'delete', id: b.getAttribute('data-dl') }).then(function () { loadComments(el, mediaId); }, function (e) { H.toast(e.message, 'err'); }); }); }; });
    }).catch(function (e) { el.innerHTML = '<p class="faint">' + esc(e.message) + '</p>'; });
  }

  /* ---------- messages ---------- */
  function messages(el) {
    el.innerHTML = '<div class="ig-dm"><div class="ig-dml card" id="igCl"><p class="muted">Loading…</p></div><div class="ig-dmt card" id="igTh"><div class="ig-dmempty">' + IC.msg + '<p>Pick a conversation</p></div></div></div>';
    loadConvos(el);
    S.poll = setInterval(function () { if (location.hash.indexOf('#instagram/messages') !== 0) return stopPoll(); loadConvos(el, true); if (S.open) loadThread(el, S.open, true); }, 20000);
  }
  function other(c, me) { var ps = (c.participants && c.participants.data) || []; return ps.filter(function (p) { return String(p.id) !== String(me); })[0] || ps[0] || {}; }
  function loadConvos(el, quiet) {
    var cl = el.querySelector('#igCl'); if (!cl) return;
    api('ig-convos').then(function (r) {
      S.convos = r.items; S.me = r.me;
      if (!r.items.length) { cl.innerHTML = '<p class="muted ig-pad">No messages yet. When someone messages @' + esc(S.st.account.username) + ', it shows here.</p>'; return; }
      cl.innerHTML = r.items.map(function (c) {
        var o = other(c, r.me), last = c.messages && c.messages.data && c.messages.data[0], mine = last && last.from && String(last.from.id) === String(r.me);
        return '<button class="ig-cv' + (S.open === c.id ? ' is-on' : '') + '" data-c="' + esc(c.id) + '"><i>' + esc((o.username || '?').slice(0, 1).toUpperCase()) + '</i><span><b>' + esc(o.username || 'Instagram user') + '</b><small>' + (mine ? 'You: ' : '') + esc(last ? (last.message || (last.attachments ? 'Photo' : '…')) : '') + '</small></span><em>' + (c.updated_time ? ago(c.updated_time) : '') + '</em></button>';
      }).join('');
      cl.querySelectorAll('[data-c]').forEach(function (b) { b.onclick = function () { S.open = b.getAttribute('data-c'); cl.querySelectorAll('.ig-cv').forEach(function (x) { x.classList.toggle('is-on', x === b); }); el.querySelector('.ig-dm').classList.add('is-thread'); loadThread(el, S.open); }; });
    }).catch(function (e) { if (!quiet) cl.innerHTML = '<p class="ig-pad">' + esc(e.message) + '</p>'; });
  }
  function loadThread(el, id, quiet) {
    var th = el.querySelector('#igTh'); if (!th) return;
    if (!quiet) th.innerHTML = '<p class="muted ig-pad">Loading…</p>';
    api('ig-thread', undefined, 'id=' + encodeURIComponent(id)).then(function (r) {
      var o = other(r, r.me), msgs = ((r.messages && r.messages.data) || []).slice().reverse();
      var last = msgs.filter(function (m) { return m.from && String(m.from.id) !== String(r.me); }).pop();
      var open24 = last && Date.now() - new Date(last.created_time).getTime() < 24 * 3600e3;
      var draft = th.querySelector('#igTx') ? th.querySelector('#igTx').value : '';
      th.innerHTML = '<div class="ig-tth"><button class="b b--sm b--ghost ig-back">' + IC.l + '</button><b>' + esc(o.username || 'Instagram user') + '</b><span class="ig-sp"></span><a class="b b--sm" href="https://www.instagram.com/' + encodeURIComponent(o.username || '') + '/" target="_blank" rel="noopener">Profile</a></div>' +
        '<div class="ig-msgs" id="igMs">' + msgs.map(function (m) {
          var mine = m.from && String(m.from.id) === String(r.me), att = (m.attachments && m.attachments.data) || [];
          return '<div class="ig-bub' + (mine ? ' is-me' : '') + '">' + att.map(function (a) { var u = (a.image_data && a.image_data.url) || (a.video_data && a.video_data.url) || a.file_url; return u ? (a.video_data ? '<video src="' + esc(u) + '" controls playsinline></video>' : '<img src="' + esc(u) + '" alt="" referrerpolicy="no-referrer">') : ''; }).join('') +
            (m.story ? '<small class="faint">Replied to a story</small>' : '') + (m.message ? '<p>' + esc(m.message) + '</p>' : (att.length || m.story ? '' : '<p class="faint">(message type not shown here)</p>')) + '<small>' + ago(m.created_time) + '</small></div>';
        }).join('') + '</div>' +
        (open24 || !last ? '' : '<p class="ig-24">More than 24 hours since their last message. Instagram only lets businesses reply within 24 hours; reply in the Instagram app.</p>') +
        '<div class="ig-comp"><button class="b b--sm b--ghost" id="igPic" title="Send a photo">' + IC.img + '</button><input type="file" id="igPf" hidden accept="image/*"><textarea class="hq-in" id="igTx" rows="1" maxlength="1000" placeholder="Message…"></textarea><button class="b b--p b--sm" id="igSend">' + IC.send + '</button></div>';
      var ms = th.querySelector('#igMs'); ms.scrollTop = ms.scrollHeight;
      th.querySelector('.ig-back').onclick = function () { el.querySelector('.ig-dm').classList.remove('is-thread'); S.open = null; };
      var tx = th.querySelector('#igTx'); tx.value = draft;
      var send = function (img) {
        if (!tx.value.trim() && !img) return; var t = tx.value; th.querySelector('#igSend').disabled = true;
        api('ig-send', { to: o.id, text: t, image: img || undefined }).then(function () { tx.value = ''; loadThread(el, id, true); loadConvos(el, true); }, function (e) { H.toast(e.message, 'err'); th.querySelector('#igSend').disabled = false; });
      };
      th.querySelector('#igSend').onclick = function () { send(); };
      tx.onkeydown = function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
      th.querySelector('#igPic').onclick = function () { th.querySelector('#igPf').click(); };
      th.querySelector('#igPf').onchange = function () { var f = this.files[0]; this.value = ''; if (!f) return; H.toast('Sending photo…'); toJpeg(f, null).then(function (r) { return upload(r.file, r.name, function () { }); }).then(function (p) { send(p); }, function (e) { H.toast(e.message, 'err'); }); };
    }).catch(function (e) { if (!quiet) th.innerHTML = '<p class="ig-pad">' + esc(e.message) + '</p>'; });
  }

  /* ---------- stats ---------- */
  function stats(el) {
    el.innerHTML = '<p class="muted">Loading…</p>';
    Promise.all([api('ig-profile'), api('ig-insights', undefined, 'days=' + (S.days || 7)).catch(function () { return { stats: {} }; })]).then(function (r) {
      var p = r[0].profile || {}, lim = r[0].limit, s = r[1].stats || {};
      var tiles = [['followers_count', 'Followers', p], ['follows_count', 'Following', p], ['media_count', 'Posts', p]].map(function (t) { return '<div class="card ig-tile"><b>' + num(t[2][t[0]]) + '</b><small>' + t[1] + '</small></div>'; }).join('');
      var ins = [['reach', 'Accounts reached'], ['views', 'Views'], ['accounts_engaged', 'Accounts engaged'], ['total_interactions', 'Interactions'], ['likes', 'Likes'], ['comments', 'Comments'], ['shares', 'Shares'], ['saves', 'Saves'], ['profile_links_taps', 'Link taps']].filter(function (k) { return typeof s[k[0]] === 'number'; })
        .map(function (k) { return '<div class="card ig-tile"><b>' + num(s[k[0]]) + '</b><small>' + k[1] + '</small></div>'; }).join('');
      el.innerHTML = '<div class="card ig-prof"><div class="card__b">' + (p.profile_picture_url ? '<img src="' + esc(p.profile_picture_url) + '" alt="" referrerpolicy="no-referrer">' : '') + '<div><b>' + esc(p.name || '') + '</b> <span class="muted">@' + esc(p.username || '') + '</span><p>' + esc(p.biography || '') + '</p>' + (p.website ? '<a href="' + esc(p.website) + '" target="_blank" rel="noopener">' + esc(p.website) + '</a>' : '') + '</div></div></div>' +
        '<div class="ig-tiles">' + tiles + '</div>' +
        '<div class="ig-row ig-rh"><h3 class="ig-h">Last</h3><div class="tabs">' + [7, 14, 30].map(function (d) { return '<button data-d="' + d + '" class="' + ((S.days || 7) === d ? 'is-on' : '') + '">' + d + ' days</button>'; }).join('') + '</div></div>' +
        (ins ? '<div class="ig-tiles">' + ins + '</div>' : '<p class="faint">Instagram hasn’t shared account stats yet (they appear once the account has some activity and the insights permission is allowed).</p>') +
        (lim && lim.config ? '<p class="faint ig-note">Posts published through apps in the last 24 hours: ' + (lim.quota_usage || 0) + ' of ' + lim.config.quota_total + '.</p>' : '');
      el.querySelectorAll('[data-d]').forEach(function (b) { b.onclick = function () { S.days = +b.getAttribute('data-d'); stats(el); }; });
    }).catch(function (e) { el.innerHTML = '<p>' + esc(e.message) + '</p>'; });
  }

  window.HQIg = { init: function (h) { H = h; }, render: render };
})();
