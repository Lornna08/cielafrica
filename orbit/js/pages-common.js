/* ============================================================
   ORBIT SOCIAL — shared post components
   Post rows, platform previews, the post detail drawer and the
   date/time picker. Used by Overview, Calendar, Approvals,
   Compose and Library so a post looks and behaves the same
   everywhere.
   ============================================================ */
window.OS = window.OS || {};
(function () {
  'use strict';
  var ui = OS.ui, store = OS.store, T = OS.time, PL = OS.platforms, app = OS.app, policy = OS.policy;
  var pc = OS.pc = {};

  pc.accIcons = function (p, size) {
    var seen = {};
    return '<span class="plats">' + (p.accountIds || []).map(function (id) { var a = store.account(id); if (!a || seen[a.platform]) return ''; seen[a.platform] = 1; return ui.plat(a.platform, size || 18, a.handle); }).join('') + '</span>';
  };
  pc.thumb = function (p, cls) { var a = p.mediaIds && p.mediaIds[0] ? store.asset(p.mediaIds[0]) : null; return a ? ui.media(a, { cls: cls }) : '<span class="mthumb mthumb--text ' + (cls || '') + '">' + ui.icon('note', 16) + '</span>'; };
  pc.when = function (p) {
    if (p.status === 'published') return 'Published ' + T.dateTime(p.publishedAt);
    if (p.status === 'failed') return 'Failed ' + T.dateTime(p.failedAt || p.scheduledAt);
    if (!p.scheduledAt) return 'No date yet';
    return (p.status === 'scheduled' ? 'Goes out ' : 'Planned for ') + T.dateTime(p.scheduledAt);
  };
  pc.row = function (p, opts) {
    opts = opts || {};
    var b = store.brand(p.brandId);
    return '<button type="button" class="prow" data-post="' + p.id + '">' + pc.thumb(p, 'mthumb--44') + '<span class="prow__m"><span class="prow__t">' + ui.esc(store.title(p)) + '</span><span class="prow__s">' + (b ? ui.brandDot(b) + ui.esc(b.name) + ' · ' : '') + ui.esc(opts.sub || pc.when(p)) + '</span></span><span class="prow__r">' + pc.accIcons(p, 18) + (opts.noStatus ? '' : ui.pill(p.status)) + (p.simulated && p.status === 'published' ? ui.sim() : '') + '</span></button>';
  };
  pc.bindRows = function (root) { root.addEventListener('click', function (e) { var r = e.target.closest('[data-post]'); if (r && root.contains(r)) pc.drawer(r.getAttribute('data-post')); }); };

  /* ---------- approval track ---------- */
  pc.track = function (p) {
    var stages = store.stages(p.brandId);
    if (!stages.length) return '';
    var v = p.version;
    return '<div class="track">' + stages.map(function (st, i) {
      var rec = (p.approvals || []).filter(function (a) { return a.stageId === st.id && a.version === v; }).pop();
      var cls = rec && rec.decision === 'approved' ? 'done' : rec && rec.decision === 'changes' ? 'bad' : (p.status === 'in_review' && (p.stage || 0) === i) ? 'cur' : '';
      if (['approved', 'scheduled', 'published'].indexOf(p.status) >= 0 && !rec) cls = 'done';
      var who = rec ? app.userName(rec.userId) + ' · ' + T.rel(rec.at) : cls === 'cur' ? 'Waiting' : cls === 'done' ? 'Done' : '—';
      return '<div class="track__s ' + cls + '"><i>' + (cls === 'done' ? ui.icon('check', 11, 3) : cls === 'bad' ? ui.icon('x', 11, 3) : i + 1) + '</i><span><b>' + ui.esc(st.name) + '</b><em>' + ui.esc(who) + '</em></span></div>';
    }).join('') + '</div>';
  };

  /* ---------- previews ---------- */
  function capFor(p, pid) { return (p.captions && p.captions[pid] != null ? p.captions[pid] : p.caption) || ''; }
  function linkify(t) { return ui.esc(t).replace(/(^|\s)(#[\p{L}\p{N}_]+)/gu, '$1<span class="hl">$2</span>').replace(/(^|\s)(@[\w.]+)/g, '$1<span class="hl">$2</span>').replace(/\n/g, '<br>'); }
  function more(text, n) { var a = Array.from(text); if (a.length <= n) return { t: text, more: false }; return { t: a.slice(0, n).join('').replace(/\s+\S*$/, ''), more: true }; }
  function mediaBox(assets, ratio, opts) {
    opts = opts || {};
    if (!assets.length) return '';
    var a = assets[0];
    var inner = a.type === 'video'
      ? '<video ' + (a.local ? 'data-local="' + a.id + '"' : 'src="' + ui.esc(a.src) + '"') + ' poster="' + ui.esc(a.thumb) + '" muted loop playsinline preload="none" aria-label="' + ui.esc(a.alt || a.name) + '">' + (a.srcAlt ? '<source src="' + ui.esc(a.srcAlt) + '" type="video/webm"><source src="' + ui.esc(a.src) + '" type="video/mp4">' : '') + '</video><button type="button" class="pv-play" aria-label="Play video">' + ui.icon('play', 16) + '</button>'
      : '<img src="' + ui.esc(ui.mediaSrc(a, true)) + '" alt="' + ui.esc(a.alt || a.name) + '"' + (a.local ? ' data-local="' + a.id + '"' : '') + '>';
    return '<div class="pv-media" style="aspect-ratio:' + ratio + '">' + inner + (assets.length > 1 && !opts.grid ? '<span class="pv-count">1/' + assets.length + '</span>' : '') + '</div>';
  }
  pc.preview = function (p, pid, account) {
    var b = store.brand(p.brandId) || { name: 'Brand', color: '#888' }, assets = store.mediaOf(p), cap = capFor(p, pid), o = (p.options && p.options[pid]) || {};
    var name = account ? account.name : b.name, handle = account ? account.handle : '@' + (b.handle || 'brand');
    var av = '<span class="pv-av" style="background:' + b.color + '">' + ui.esc(ui.initials(b.name)) + '</span>';
    var when = p.status === 'published' ? T.rel(p.publishedAt) : p.scheduledAt ? T.date(p.scheduledAt) : 'Now';
    var h = '';
    if (pid === 'instagram') {
      var type = o.type || 'feed', m = more(cap, 125);
      if (type === 'story' || type === 'reel') {
        h = '<div class="pv pv--ig pv--tall"><div class="pv-vert">' + (assets.length ? mediaBox(assets, '9/16') : '<div class="pv-media pv-empty" style="aspect-ratio:9/16">' + ui.icon('image', 22) + '<span>Add a ' + (type === 'reel' ? 'video' : 'photo or video') + '</span></div>') + '<div class="pv-overlay"><div class="pv-row">' + av + '<b>' + ui.esc(handle.replace(/^@/, '')) + '</b>' + (type === 'reel' ? '<span class="pv-badge">Reel</span>' : '<span class="pv-badge">Story</span>') + '</div>' + (type === 'reel' ? '<p>' + linkify(m.t) + (m.more ? '… <span class="muted">more</span>' : '') + '</p>' : '') + '</div></div></div>';
      } else {
        h = '<div class="pv pv--ig"><div class="pv-head">' + av + '<div><b>' + ui.esc(handle.replace(/^@/, '')) + '</b></div><span class="pv-dots">' + ui.icon('more', 16) + '</span></div>' + (assets.length ? mediaBox(assets, '4/5') : '<div class="pv-media pv-empty" style="aspect-ratio:4/5">' + ui.icon('image', 22) + '<span>Instagram needs a photo or video</span></div>') +
          '<div class="pv-acts">' + ui.icon('heart', 19) + ui.icon('message', 19) + ui.icon('send', 19) + '<span style="margin-left:auto">' + ui.icon('bookmark', 19) + '</span></div><div class="pv-body"><p><b>' + ui.esc(handle.replace(/^@/, '')) + '</b> ' + linkify(m.t) + (m.more ? '… <span class="muted">more</span>' : '') + '</p>' + (o.firstComment ? '<p class="muted pv-fc">First comment: ' + ui.esc(o.firstComment) + '</p>' : '') + '<p class="pv-time">' + ui.esc(when) + '</p></div></div>';
      }
    } else if (pid === 'facebook') {
      var mf = more(cap, 300);
      h = '<div class="pv pv--fb"><div class="pv-head">' + av + '<div><b>' + ui.esc(name) + '</b><span>' + ui.esc(when) + ' · ' + ui.icon('globe', 11) + '</span></div><span class="pv-dots">' + ui.icon('more', 16) + '</span></div><div class="pv-body"><p>' + linkify(mf.t) + (mf.more ? '… <span class="hl">See more</span>' : '') + '</p></div>' + mediaBox(assets, assets[0] && assets[0].h > assets[0].w ? '4/5' : '1.91/1') + '<div class="pv-foot">' + ui.icon('heart', 15) + ' Like<span>' + ui.icon('message', 15) + ' Comment</span><span>' + ui.icon('share', 15) + ' Share</span></div></div>';
    } else if (pid === 'linkedin') {
      var ml = more(cap, 210);
      h = '<div class="pv pv--li"><div class="pv-head">' + '<span class="pv-av pv-av--sq" style="background:' + b.color + '">' + ui.esc(ui.initials(b.name)) + '</span><div><b>' + ui.esc(name) + '</b><span>' + ui.short(account ? account.followers : 1200) + ' followers · ' + ui.esc(when) + '</span></div></div><div class="pv-body"><p>' + linkify(ml.t) + (ml.more ? '… <span class="muted">see more</span>' : '') + '</p></div>' + mediaBox(assets, '1.91/1') + '<div class="pv-foot">' + ui.icon('heart', 15) + ' Like<span>' + ui.icon('message', 15) + ' Comment</span><span>' + ui.icon('repeat', 15) + ' Repost</span></div></div>';
    } else if (pid === 'tiktok') {
      var mt = more(cap, 90);
      h = '<div class="pv pv--tt pv--tall"><div class="pv-vert">' + (assets.length && assets[0].type === 'video' ? mediaBox(assets, '9/16') : '<div class="pv-media pv-empty pv-empty--dark" style="aspect-ratio:9/16">' + ui.icon('video', 22) + '<span>TikTok needs a video</span></div>') + '<div class="pv-side">' + av + ui.icon('heart', 22) + ui.icon('message', 22) + ui.icon('share', 22) + '</div><div class="pv-overlay"><b>' + ui.esc(handle) + '</b><p>' + linkify(mt.t) + (mt.more ? '… more' : '') + '</p></div></div></div>';
    } else if (pid === 'youtube') {
      var short = (o.type || 'short') === 'short';
      h = '<div class="pv pv--yt' + (short ? ' pv--tall' : '') + '">' + (assets.length && assets[0].type === 'video' ? mediaBox(assets, short ? '9/16' : '16/9') : '<div class="pv-media pv-empty pv-empty--dark" style="aspect-ratio:' + (short ? '9/16' : '16/9') + '">' + ui.icon('video', 22) + '<span>YouTube needs a video</span></div>') + '<div class="pv-head">' + av + '<div><b class="pv-title">' + ui.esc(o.title || 'Add a title') + '</b><span>' + ui.esc(name) + ' · ' + (short ? 'Short' : 'Video') + '</span></div></div></div>';
    } else if (pid === 'x') {
      var cnt = PL.countChars(cap, PL.P.x);
      h = '<div class="pv pv--x"><div class="pv-xrow">' + av + '<div class="pv-xm"><div><b>' + ui.esc(name) + '</b> <span class="muted">' + ui.esc(handle) + ' · ' + ui.esc(when) + '</span></div><p>' + linkify(cap) + '</p>' + (assets.length ? '<div class="pv-xmedia">' + mediaBox(assets, assets.length > 1 ? '1/1' : '16/9', { grid: true }) + '</div>' : '') + '<div class="pv-foot pv-foot--x">' + ui.icon('message', 15) + ui.icon('repeat', 15) + ui.icon('heart', 15) + ui.icon('share', 15) + '</div></div></div>' + (cnt > 280 ? '<p class="pv-warn">' + ui.icon('alert', 13) + (cnt - 280) + ' characters over the limit</p>' : '') + '</div>';
    }
    return h;
  };
  pc.bindPreviews = function (root) {
    root.addEventListener('click', function (e) {
      var b = e.target.closest('.pv-play'); if (!b) return;
      var v = b.parentNode.querySelector('video'); if (!v) return;
      if (v.paused) { v.play().catch(function () {}); b.classList.add('on'); } else { v.pause(); b.classList.remove('on'); }
    });
  };

  /* ---------- date/time picker dialog ---------- */
  pc.pickTime = function (o) {
    // o: {title, iso, ok, help, onOk(iso)}
    var d = o.iso ? T.dayKey(o.iso) : T.addDaysKey(T.todayKey(), 1), t = o.iso ? T.timeOf(o.iso) : (store.state.workspace.defaultTime || '09:00');
    ui.modal({
      title: o.title, ok: o.ok || 'Save',
      body: (o.help ? '<p class="muted" style="margin-bottom:12px">' + o.help + '</p>' : '') + '<div class="fgrid">' + ui.field('Date', '<input class="inp" type="date" name="d" value="' + d + '" min="' + T.todayKey() + '" required>') + ui.field('Time', '<input class="inp" type="time" name="t" value="' + t + '" step="300" required>') + '</div><p class="hint" style="margin-top:8px">' + ui.icon('clock', 12) + ' Times are in the workspace time zone: <b>' + ui.esc(T.zoneLabel()) + '</b></p><p class="ferr" data-err></p>',
      onOk: function (api) {
        var v = ui.read(api.el);
        if (!v.d || !v.t) { api.el.querySelector('[data-err]').textContent = 'Choose a date and a time.'; return false; }
        var iso = T.iso(v.d, v.t);
        var ok = ui.run(function () { return o.onOk(iso); });
        if (!ok) return false;
      }
    });
  };


  /* ---------- file ingest (uploads) ----------
     Reads the file with progress, makes a small thumbnail, stores the
     original in IndexedDB and registers the asset through the store
     (permission-checked). Production: upload to object storage with a
     signed URL instead, and keep only the URL in the database. */
  pc.TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime'];
  pc.MAX_MB = 25;
  pc.ingest = function (f, brandId, onProgress) {
    return new Promise(function (resolve, reject) {
      if (pc.TYPES.indexOf(f.type) < 0) return reject(new Error('Unsupported file type (' + (f.type || 'unknown') + '). Use JPG, PNG, WebP, GIF or MP4.'));
      if (f.size > pc.MAX_MB * 1048576) return reject(new Error('Too large: ' + ui.bytes(f.size) + '. The limit is ' + pc.MAX_MB + ' MB.'));
      var why = store.why('content.edit', brandId); if (why) return reject(new Error(why));
      var rd = new FileReader();
      rd.onprogress = function (e) { if (e.lengthComputable && onProgress) onProgress(Math.round(e.loaded / e.total * 90)); };
      rd.onerror = function () { reject(new Error('Couldn’t read this file.')); };
      rd.onload = function () {
        var blob = new Blob([rd.result], { type: f.type }), url = URL.createObjectURL(blob), isVid = f.type.indexOf('video') === 0, key = Math.random().toString(36).slice(2, 9);
        if (onProgress) onProgress(95);
        function done(thumb, w, h, dur) {
          var id = 'm-up-' + key;
          OS.media.put(id, blob).then(function (persisted) {
            try {
              var a = store.addAsset({ id: id, name: f.name, type: isVid ? 'video' : 'image', brandId: brandId, src: 'local', thumb: thumb, w: w, h: h, duration: dur, size: f.size, local: true, alt: '' });
              a._persisted = persisted; resolve(a);
            } catch (e) { reject(e); }
          });
        }
        if (isVid) {
          var v = document.createElement('video'); v.muted = true; v.preload = 'metadata'; v.src = url;
          v.onloadeddata = function () { v.currentTime = Math.min(0.5, (v.duration || 1) / 2); };
          v.onseeked = function () { var c = document.createElement('canvas'), s = 400 / Math.max(v.videoWidth, v.videoHeight); c.width = Math.round(v.videoWidth * s); c.height = Math.round(v.videoHeight * s); c.getContext('2d').drawImage(v, 0, 0, c.width, c.height); done(c.toDataURL('image/jpeg', 0.72), v.videoWidth, v.videoHeight, v.duration); };
          v.onerror = function () { reject(new Error('This video format can’t be played in your browser.')); };
        } else {
          var im = new Image();
          im.onload = function () { var c = document.createElement('canvas'), s = Math.min(1, 400 / Math.max(im.width, im.height)); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); done(c.toDataURL('image/jpeg', 0.75), im.width, im.height, null); };
          im.onerror = function () { reject(new Error('This image couldn’t be opened.')); };
          im.src = url;
        }
      };
      rd.readAsArrayBuffer(f);
    });
  };

  /* ---------- detail drawer ---------- */
  pc.drawer = function (id) {
    var p = store.post(id); if (!p) { ui.toast('That post no longer exists.', 'err'); return; }
    var api = ui.modal({ title: store.title(p), drawer: true, body: '', foot: '' });
    api.el.classList.add('drawer--post');
    function draw() {
      p = store.post(id);
      if (!p) { api.close(); return; }
      var b = store.brand(p.brandId), plats = store.platformsOf(p), cur = api.el.getAttribute('data-pv') || plats[0];
      if (plats.indexOf(cur) < 0) cur = plats[0];
      var acc = p.accountIds.map(store.account).filter(Boolean), accOf = function (pid) { return acc.filter(function (a) { return a.platform === pid; })[0]; };
      var camp = p.campaignId && store.campaign(p.campaignId);
      var h = '<div class="dr-top"><div class="row wrap">' + ui.pill(p.status) + (p.simulated && p.status === 'published' ? ui.sim('Simulated publish') : '') + (p.sample && p.status === 'published' ? ui.sampleTag('Sample post') : '') + '<span class="muted">v' + p.version + '</span></div><p class="dr-when">' + ui.icon('clock', 13) + ui.esc(pc.when(p)) + ' <span class="muted">(' + ui.esc(T.zoneLabel()) + ')</span></p></div>';
      h += '<div class="dr-acts" data-acts>' + actions(p) + '</div>';
      if (plats.length) h += '<div class="dr-pvtabs">' + plats.map(function (pid) { return '<button type="button" data-pvt="' + pid + '" class="' + (pid === cur ? 'on' : '') + '">' + ui.plat(pid, 16) + PL.P[pid].name + '</button>'; }).join('') + '</div><div class="dr-pv">' + pc.preview(p, cur, accOf(cur)) + '</div>';
      else h += '<div class="note note--plain">' + ui.icon('info', 15) + '<span>No accounts selected yet. Edit the post to choose where it goes.</span></div>';
      h += '<dl class="kv dr-kv"><dt>Brand</dt><dd>' + ui.brandDot(b) + ' ' + ui.esc(b.name) + '</dd><dt>Accounts</dt><dd>' + (acc.map(function (a) { return ui.esc(a.handle) + (a.status === 'expired' ? ' <span class="pill pill--red pill--plain">reconnect</span>' : ''); }).join(', ') || '—') + '</dd>' +
        '<dt>Campaign</dt><dd>' + (camp ? '<span class="cdot" style="background:' + camp.color + '"></span>' + ui.esc(camp.name) : '—') + '</dd><dt>Author</dt><dd>' + ui.esc(app.userName(p.authorId)) + '</dd><dt>Created</dt><dd>' + T.dateTime(p.createdAt) + '</dd></dl>';
      if (Object.keys(p.results || {}).length) {
        h += '<h4 class="dr-h">Publishing results</h4><div class="results">' + Object.keys(p.results).map(function (aid) { var r = p.results[aid], a = store.account(aid); return '<div class="res">' + (a ? ui.plat(a.platform, 18) : '') + '<span><b>' + ui.esc(a ? a.handle : 'Disconnected account') + '</b><em>' + (r.ok ? (r.simulated ? 'Simulated, not sent to ' + (a ? PL.P[a.platform].name : 'the network') : 'Published (sample history)') : ui.esc(r.error)) + '</em></span>' + (r.ok ? '<span class="pill pill--green pill--plain">' + (r.simulated ? 'Simulated' : 'OK') + '</span>' : '<span class="pill pill--red pill--plain">Failed</span>') + '</div>'; }).join('') + '</div>';
      }
      if (p.metrics && Object.keys(p.metrics).length) {
        var tot = { reach: 0, impressions: 0, likes: 0, comments: 0, shares: 0, saves: 0 };
        Object.keys(p.metrics).forEach(function (k) { Object.keys(tot).forEach(function (m) { tot[m] += p.metrics[k][m] || 0; }); });
        var er = tot.reach ? (tot.likes + tot.comments + tot.shares + tot.saves) / tot.reach : 0;
        h += '<h4 class="dr-h">Performance ' + ui.sampleTag() + '</h4><div class="mstats"><div><span>Reach</span><b>' + ui.num(tot.reach) + '</b></div><div><span>Impressions</span><b>' + ui.num(tot.impressions) + '</b></div><div><span>Engagement</span><b>' + ui.num(tot.likes + tot.comments + tot.shares + tot.saves) + '</b></div><div><span>Eng. rate</span><b>' + ui.pct(er) + '</b></div></div>';
      } else if (p.status === 'published' && p.simulated) {
        h += '<div class="note note--plain" style="margin-top:14px">' + ui.icon('info', 15) + '<span>No metrics: this post was published by the simulator, so no network can report on it.</span></div>';
      }
      if (store.stages(p.brandId).length && p.status !== 'draft') h += '<h4 class="dr-h">Approval</h4>' + pc.track(p);
      h += '<h4 class="dr-h">Comments &amp; history</h4>' + thread(p) + (store.can('content.view', p.brandId) && p.status !== 'published' ? '<form class="cbox" data-cform><textarea class="ta" name="body" rows="2" placeholder="Add a comment. Use @name to mention a teammate." aria-label="Comment"></textarea><button class="btn btn--sm" type="submit">' + ui.icon('send', 14) + 'Comment</button></form>' : '');
      api.el.querySelector('.modal__b').innerHTML = h;
      api.el.querySelector('.modal__h h2').textContent = store.title(p);
      ui.hydrate(api.el);
    }
    function actions(p) {
      var a = [], br = p.brandId;
      var can = function (perm) { return store.can(perm, br); };
      var block = p.status === 'in_review' ? store.reviewBlock(p) : 'x';
      if (p.status === 'in_review') a.push(block ? '<button class="btn btn--sm" disabled title="' + ui.esc(block) + '">' + ui.icon('lock', 14) + 'Review</button>' : '<button class="btn btn--sm btn--p" data-a="approve">' + ui.icon('check', 14) + 'Approve</button><button class="btn btn--sm" data-a="changes">' + ui.icon('reply', 14) + 'Request changes</button>');
      if (p.status === 'draft' || p.status === 'changes_requested') a.push('<button class="btn btn--sm btn--p" data-a="submit"' + (can('content.submit') ? '' : ' disabled title="' + ui.esc(store.why('content.submit', br)) + '"') + '>' + ui.icon('send', 14) + (p.status === 'changes_requested' ? 'Resubmit' : 'Submit for review') + '</button>');
      if (p.status === 'approved' || p.status === 'failed') a.push('<button class="btn btn--sm btn--p" data-a="schedule"' + (can('content.schedule') ? '' : ' disabled title="' + ui.esc(store.why('content.schedule', br)) + '"') + '>' + ui.icon('cal', 14) + 'Schedule</button>');
      if (p.status === 'scheduled') a.push('<button class="btn btn--sm" data-a="move"' + (can('content.schedule') ? '' : ' disabled title="' + ui.esc(store.why('content.schedule', br)) + '"') + '>' + ui.icon('cal', 14) + 'Reschedule</button><button class="btn btn--sm" data-a="unschedule"' + (can('content.schedule') ? '' : ' disabled') + '>Cancel schedule</button>');
      if (['approved', 'scheduled', 'failed'].indexOf(p.status) >= 0) a.push('<button class="btn btn--sm" data-a="publish"' + (can('content.publish') ? '' : ' disabled title="' + ui.esc(store.why('content.publish', br)) + '"') + '>' + ui.icon('zap', 14) + (p.status === 'failed' ? 'Retry now' : 'Publish now') + '</button>');
      if (['draft', 'changes_requested', 'in_review'].indexOf(p.status) >= 0 && p.scheduledAt !== undefined) a.push('<button class="btn btn--sm" data-a="move"' + (can('content.edit') ? '' : ' disabled') + '>' + ui.icon('cal', 14) + (p.scheduledAt ? 'Change date' : 'Set a date') + '</button>');
      var more = '';
      if (p.status !== 'published') more += '<a class="btn btn--sm" href="#/compose/' + p.id + '" data-close' + (can('content.edit') ? '' : ' aria-disabled="true"') + '>' + ui.icon('edit', 14) + 'Edit</a>';
      more += '<button class="btn btn--sm" data-a="dup"' + (can('content.edit') ? '' : ' disabled') + '>' + ui.icon('copy', 14) + 'Duplicate</button>';
      if (p.status !== 'published') more += '<button class="btn btn--sm btn--ghost btn--danger" data-a="del"' + (can('content.edit') ? '' : ' disabled') + '>' + ui.icon('trash', 14) + 'Delete</button>';
      return '<div class="row wrap">' + a.join('') + more + '</div>';
    }
    function thread(p) {
      var items = (p.comments || []).slice().sort(function (a, b) { return a.at < b.at ? -1 : 1; });
      if (!items.length) return '<p class="muted" style="font-size:12.5px">No comments yet.</p>';
      return '<div class="thread">' + items.map(function (c) {
        var u = c.userId && store.user(c.userId);
        if (c.kind === 'system') return '<div class="th th--sys">' + ui.icon('orbit', 13) + '<span>' + ui.esc(c.body) + ' <em>' + T.rel(c.at) + '</em></span></div>';
        return '<div class="th' + (c.kind === 'feedback' ? ' th--fb' : '') + '">' + ui.userAv(u, 'sm') + '<div><div class="th__h"><b>' + ui.esc(u ? u.name : 'Former member') + '</b>' + (c.kind === 'feedback' ? '<span class="pill pill--amber pill--plain">Requested changes</span>' : '') + '<em>v' + c.version + ' · ' + T.rel(c.at) + '</em></div><p>' + ui.esc(c.body).replace(/(@\w+)/g, '<b class="hl">$1</b>') + '</p></div></div>';
      }).join('') + '</div>';
    }
    api.el.addEventListener('click', function (e) {
      var t = e.target.closest('[data-pvt]'); if (t) { api.el.setAttribute('data-pv', t.getAttribute('data-pvt')); draw(); return; }
      if (e.target.closest('[data-close]')) { api.close(); return; }
      var b = e.target.closest('[data-a]'); if (!b || b.disabled) return;
      var act = b.getAttribute('data-a'), p = store.post(id);
      if (act === 'approve') { if (ui.run(function () { return store.approve(id); }, function (r) { return r.status === 'in_review' ? 'Approved. Sent to ' + store.stages(r.brandId)[r.stage].name.toLowerCase() + '.' : r.status === 'scheduled' ? 'Approved and scheduled for ' + T.dateTime(r.scheduledAt) : 'Approved. Ready to schedule.'; })) draw(); }
      if (act === 'changes') pc.changesDialog(id, draw);
      if (act === 'submit') { if (ui.run(function () { return store.submit(id); }, 'Submitted for review')) draw(); }
      if (act === 'schedule') pc.pickTime({ title: 'Schedule post', ok: 'Schedule', iso: p.scheduledAt && new Date(p.scheduledAt) > new Date() ? p.scheduledAt : null, help: 'In this template, scheduled posts are published by a simulator when their time comes. Nothing is sent to real networks.', onOk: function (iso) { var r = store.schedule(id, iso); ui.toast('Scheduled for ' + T.dateTime(iso)); draw(); return r; } });
      if (act === 'move') pc.pickTime({ title: p.status === 'scheduled' ? 'Reschedule post' : 'Planned date', ok: 'Save', iso: p.scheduledAt && new Date(p.scheduledAt) > new Date() ? p.scheduledAt : null, onOk: function (iso) { var r = store.reschedule(id, iso); ui.toast('Moved to ' + T.dateTime(iso)); draw(); return r; } });
      if (act === 'unschedule') ui.confirm({ title: 'Cancel the schedule?', body: 'The post goes back to Approved and won’t be published until someone schedules it again.', ok: 'Cancel schedule' }).then(function (ok) { if (ok && ui.run(function () { return store.unschedule(id); }, 'Schedule cancelled')) draw(); });
      if (act === 'publish') pc.publishDialog(id, draw);
      if (act === 'dup') { var np = ui.run(function () { return store.duplicate(id); }); if (np) { api.close(); ui.toast('Duplicated as a new draft', 'ok', { label: 'Open', fn: function () { app.go('#/compose/' + np.id); } }); } }
      if (act === 'del') ui.confirm({ title: 'Delete this post?', body: 'The post, its comments and approval history are removed. This can’t be undone.', ok: 'Delete post', danger: true }).then(function (ok) { if (ok && ui.run(function () { return store.deletePost(id); }, 'Post deleted')) api.close(); });
    });
    api.el.addEventListener('submit', function (e) {
      if (!e.target.matches('[data-cform]')) return;
      e.preventDefault();
      var body = e.target.querySelector('textarea').value;
      if (ui.run(function () { return store.comment(id, body); }, 'Comment added')) draw();
    });
    pc.bindPreviews(api.el);
    draw();
    return api;
  };

  pc.changesDialog = function (id, done) {
    ui.modal({ title: 'Request changes', ok: 'Send to author', body: '<p class="muted" style="margin-bottom:10px">The author is notified and the post goes back to them. Be specific about what to change.</p>' + ui.field('What should change?', '<textarea class="ta" name="note" rows="4" placeholder="e.g. Swap the second image for the close-up, and mention the launch date." required></textarea>') + '<p class="ferr" data-err></p>',
      onOk: function (api) { var v = ui.read(api.el); var r = ui.run(function () { return store.requestChanges(id, v.note); }, 'Changes requested'); if (!r) return false; if (done) done(); } });
  };
  pc.publishDialog = function (id, done) {
    var p = store.post(id), acc = p.accountIds.map(store.account).filter(Boolean);
    ui.modal({ title: 'Publish now?', ok: 'Publish (simulated)',
      body: '<div class="note note--info">' + ui.icon('flask', 15) + '<span><b>Simulated publishing.</b> These are sample accounts, so ORBIT marks the post as published here but nothing is sent to ' + acc.map(function (a) { return PL.P[a.platform].name; }).filter(function (v, i, s) { return s.indexOf(v) === i; }).join(', ') + '. Accounts that need reconnecting will fail, just as they would for real.</span></div><div class="results" style="margin-top:12px">' + acc.map(function (a) { return '<div class="res">' + ui.plat(a.platform, 18) + '<span><b>' + ui.esc(a.handle) + '</b><em>' + (a.status === 'expired' ? 'Connection expired, this one will fail' : 'Sample connection') + '</em></span></div>'; }).join('') + '</div>',
      onOk: function () {
        var r = ui.run(function () { return store.publishNow(id); });
        if (!r) return false;
        if (r.ok) ui.toast('Marked as published (simulated)' + (r.errors.length ? '. ' + r.errors.length + ' account failed.' : ''), r.errors.length ? 'info' : 'ok');
        else ui.toast('Publishing failed: ' + r.errors[0], 'err');
        if (done) done();
      } });
  };
})();
