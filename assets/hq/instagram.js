/* ============================================================
   CIEL ADMIN — Instagram (#instagram/…), laid out like the Instagram app.
   Same page as ABC Club's officials' app (Lornna08/abcclub site/admin/instagram.js), fitted into Ciel Admin:
   Home feed, Search, Reels, Planner (designs + drafts + scheduled), Designs, Profile, Messages, Activity, Stats.
   Server: lib/hq/instagram.js (routes ig-* in lib/hq/handler.js). Styles: assets/hq/instagram.css.
   ============================================================ */
(function () {
  'use strict';
  /* ---------- the little bit of the host app this page uses (ABC's officials' app calls it A) ---------- */
  var HQ = null;
  var store = { get: function (k, d) { try { var v = localStorage.getItem('hq.ig.' + k); return v == null ? (d === undefined ? null : d) : JSON.parse(v); } catch (e) { return d === undefined ? null : d; } }, set: function (k, v) { try { localStorage.setItem('hq.ig.' + k, JSON.stringify(v)); } catch (e) { /* storage full */ } } };
  var A = {
    S: { hashNow: '', get section() { return /^#instagram(\/|$)/.test(location.hash) ? 'instagram' : ''; }, rooms: {} },
    member: false, views: {}, store: store, igPlannerKit: null, refreshRooms: null, computeBell: null,
    owner: function () { return true; }, access: function () { return 'edit'; },
    esc: function (t) { return HQ ? HQ.esc(t) : String(t == null ? '' : t); },
    toast: function (m, bad) { if (HQ) HQ.toast(m, bad ? 'err' : 'ok'); },
    saveRoute: function (r) { store.set('route', String(r || '').replace(/\/tour$/, '')); }
  };
  var H, S = { view: 'profile', ptab: 'posts', st: null, prof: null, media: null, after: null, reels: null, tagged: null, posts: null, open: null, poll: null, watch: null };
  var esc = function (s) { return H ? H.esc(s) : String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var sv = function (p, o) { return '<svg viewBox="0 0 24 24" style="fill:' + ((o && o.fill) || 'none') + ';stroke:currentColor;stroke-width:' + ((o && o.w) || 2) + ';stroke-linecap:round;stroke-linejoin:round" aria-hidden="true">' + p + '</svg>'; };
  var HEART = '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>';
  var IC = {
    ig: sv('<rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><path d="M17.5 6.5h.01"/>'),
    home: sv('<path d="M3 10.2 12 3l9 7.2V20a1 1 0 0 1-1 1h-5.5v-6.5h-5V21H4a1 1 0 0 1-1-1z"/>'),
    search: sv('<circle cx="11" cy="11" r="7.5"/><path d="m21 21-4.3-4.3"/>'),
    plus: sv('<rect x="3" y="3" width="18" height="18" rx="5"/><path d="M12 8v8M8 12h8"/>'),
    heart: sv(HEART), heartOn: sv(HEART, { fill: 'currentColor' }),
    up: sv('<path d="M12 19V5M5 12l7-7 7 7"/>'),
    mute: sv('<path d="M11 5 6 9H3v6h3l5 4zM22 9l-6 6M16 9l6 6"/>'),
    sound: sv('<path d="M11 5 6 9H3v6h3l5 4zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>'),
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
  var STATUS = { draft: ['Draft', ''], scheduled: ['Scheduled', 'igk-chip--b'], processing: ['Publishing…', 'igk-chip--y'], published: ['Published', 'igk-chip--g'], failed: ['Failed', 'igk-chip--r'] };
  /* Ciel Admin's API helper: GET /api/hq?route=ig-<route>, POST the same with a body */
  function api(route, body, qs) {
    return HQ.api('/api/hq?route=ig-' + route + (qs ? '&' + qs : ''), body).then(function (j) { if (!j || j.error || j.ok === false) { var e = new Error((j && (j.error || j.message)) || 'Something went wrong. Try again.'); e.status = j && j.status; throw e; } return j; });
  }
  /* questions are asked in the page (the phone's own pop-ups are blocked in the installed app) */
  function ask(t) {
    return new Promise(function (ok) {
      var danger = /^(Delete|Remove|Disconnect)\b/.test(t), m = H.modal('<p class="igq-ask">' + esc(t) + '</p><div class="igk-row igq-askr"><span class="igq-sp"></span><button class="igk-b" data-no>Cancel</button><button class="igk-b ' + (danger ? 'igk-b--d' : 'igk-b--p') + '" data-yes>' + (danger ? esc(/^\w+/.exec(t)[0]) : 'Yes') + '</button></div>');
      var done = function (v) { m.remove(); ok(v); };
      m.querySelector('[data-no]').onclick = function () { done(false); }; m.querySelector('[data-yes]').onclick = function () { done(true); };
      m.addEventListener('click', function (e) { if (e.target === m) ok(false); });
    });
  }
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

  /* ---------- the Instagram planner's designs (site/admin/social.js) inside this page ----------
     Planner and the profile's Planned tab show every design that isn't posted yet; any of them can be
     posted now or scheduled, and New post can start from one. */
  var PK = function () { return A.igPlannerKit || null; };
  var PL = { items: null, at: 0 };
  var planSig = function (l) { return JSON.stringify((l || []).map(function (p) { return [p.id, p.status, p.updatedAt, p.caption, (p.images || []).join()]; })); };
  /* answers at once from the copy kept on this phone, then again only if the fresh list is different */
  function planItems(cb, force) {
    if (!PL.items) { var sv0 = A.store.get('ig_list'); if (sv0 && sv0.items) PL.items = sv0.items; }
    var had = !!PL.items; if (had) cb(PL.items);
    if (!force && had && Date.now() - PL.at < 30000) return;
    api('designs').then(function (j) {
      if (!j || !j.items) { if (!had) cb([]); return; }
      var diff = planSig(j.items) !== planSig(PL.items); PL.items = j.items; PL.at = Date.now();
      var sv = A.store.get('ig_list') || {}; sv.items = j.items; A.store.set('ig_list', sv);
      if (diff || !had) cb(j.items);
    }, function () { if (!had) cb([]); });
  }
  /* what an Instagram post made from this design would be: photo, carousel or story (reel and highlight covers are added in the app) */
  function planType(p) { var n = (p.images || []).length; if (!n) return null; if (p.kind === 'story') return n === 1 ? 'story' : null; if (p.kind === 'post' || p.kind === 'carousel') return n > 1 ? 'carousel' : 'photo'; return null; }
  function planThumb(u) { var k = PK(); return k ? k.thumb(u) : u; }
  function planOrder(p) { var k = PK(); return k ? k.order(p) : 0; }
  function planFor(id) { return (S.posts || []).filter(function (x) { return x.planId === id && x.status !== 'published'; })[0]; }
  var canPost = function () { return A.access('instagram') === 'edit'; };
  function planTile(p, ratio, i) {
    var img = p.images && p.images[0], q = planFor(p.id), chip = p.status === 'posted' ? ['Posted', 'igk-chip--g'] : q ? (STATUS[q.status] || STATUS.draft) : null;
    return '<button class="igx-t igx-t--d" data-d="' + esc(p.id) + '" style="aspect-ratio:' + ratio + '">' + (img ? '<img src="' + esc(planThumb(img)) + '" alt="" decoding="async"' + (i > 11 ? ' loading="lazy"' : ' fetchpriority="high"') + '>' : '<span class="igx-noimg">' + IC.img + '<small>No picture yet</small></span>') +
      (p.images && p.images.length > 1 ? '<em>' + IC.layers + '</em>' : '') + (chip ? '<span class="igx-pc"><span class="igk-chip ' + chip[1] + '">' + chip[0] + '</span></span>' : '') + '</button>';
  }
  /* a post saved in this page: photo or video, a status chip and the start of the caption (no dates on the tiles) */
  function postTile(p) {
    var m = p.media[0], s = STATUS[p.status] || STATUS.draft, src = m ? (m.plan ? planThumb(m.url) : m.url) : '';
    return '<button class="igx-t igx-t--p" data-p="' + p.id + '">' + (m ? (m.kind === 'video' ? '<video src="' + esc(src) + '#t=0.5" muted playsinline preload="metadata"></video>' : '<img src="' + esc(src) + '" alt="" decoding="async">') : '<span class="igx-noimg">' + IC.img + '</span>') +
      (p.media.length > 1 ? '<em>' + IC.layers + '</em>' : m && m.kind === 'video' ? '<em>' + IC.reels + '</em>' : '') +
      '<span class="igx-pb"><span class="igk-chip ' + s[1] + '">' + s[0] + '</span>' + (p.error ? '<small>' + esc(p.error) + '</small>' : p.caption ? '<small>' + esc(p.caption.slice(0, 70)) + '</small>' : '') + '</span></button>';
  }
  function fromPlan(p) {
    return { type: planType(p) || 'photo', caption: p.kind === 'story' ? '' : (p.caption || ''), media: (p.images || []).slice(0, 10).map(function (u, i) { return { plan: true, url: u, kind: 'image', path: (p.paths || [])[i] || '' }; }), planId: p.id, altText: '', collaborators: [], shareToFeed: true, at: null, status: 'draft' };
  }
  /* tapping a design: post it now, schedule it, see it big and save it, copy the caption, edit it */
  function planSheet(p) {
    var k = PK(), t = planType(p), q = planFor(p.id), posted = p.status === 'posted';
    var kind = k ? (k.KINDS.filter(function (x) { return x[0] === p.kind; })[0] || [0, 'Post'])[1] : 'Post';
    var m = H.modal('<div class="igx-sheet"><div class="igx-shh">' + (p.images && p.images[0] ? '<img src="' + esc(planThumb(p.images[0])) + '" alt="">' : '') + '<div><b>' + esc(kind) + (p.images && p.images.length > 1 ? ' · ' + p.images.length + ' pictures' : '') + (posted ? ' · Posted' : '') + '</b>' + (p.caption ? '<p>' + esc(p.caption.slice(0, 160)) + (p.caption.length > 160 ? '…' : '') + '</p>' : '') + '</div></div>' +
      '<div class="igx-menu">' +
      (t && !posted && canPost() ? (q ? '<button data-a="open" class="is-b">' + (q.status === 'scheduled' ? 'Change the schedule' : q.status === 'failed' ? 'See why it failed' : 'Open the draft') + '</button>' : '<button data-a="now" class="is-b">Post now</button><button data-a="sched">Schedule…</button>') : '') +
      (p.kind === 'reel' ? '<p class="igx-shn">Reel cover: film the reel, then pick this picture as its cover in the Instagram app.</p>' : p.kind === 'highlight' ? '<p class="igx-shn">Highlight cover: add it in the Instagram app (Edit highlight → Edit cover).</p>' : '') +
      (p.images && p.images.length ? '<button data-a="big">See it big and save it</button>' : '') + (p.caption ? '<button data-a="copy">Copy caption</button>' : '') + (k && k.canEdit() ? '<button data-a="edit">Edit in the planner</button>' : '') + '<button data-x>Cancel</button></div></div>');
    m.classList.add('igx-menum');
    m.querySelectorAll('[data-a]').forEach(function (b) {
      b.onclick = function () {
        var a = b.getAttribute('data-a'); m.remove();
        if (a === 'now') ask('Post this to Instagram now?').then(function (ok) { if (ok) postPlan(p); });
        if (a === 'sched') editor(fromPlan(p));
        if (a === 'open') editor(q);
        if (a === 'big' && k) k.preview(p, PL.items || [], { connected: false });
        if (a === 'copy') { try { navigator.clipboard.writeText(p.caption || ''); H.toast('Caption copied'); } catch (e) { H.toast('Couldn’t copy.', 'err'); } }
        if (a === 'edit' && k) k.edit(p, { connected: false });
      };
    });
  }
  function postPlan(p) {
    var d = fromPlan(p); H.toast('Posting to Instagram…');
    api('post-save', { type: d.type, caption: d.caption, media: d.media, planId: d.planId, status: 'draft', at: null })
      .then(function (r) { return api('post-now', { id: r.item.id }); })
      .then(function (r) { if (r.finished) { p.status = 'posted'; PL.at = 0; } S.media = null; S.prof = null; S.posts = null; H.toast(r.finished ? 'Posted to Instagram 🎉' : 'Instagram is still preparing it. It will post in a few minutes.', 'ok'); render(S.view === 'profile' ? '' : S.view); },
        function (e) { H.toast(e.message, 'err'); render(S.view === 'profile' ? 'profile' : S.view); });
  }
  /* New post → Choose from planner */
  function pickPlan(cb) {
    var tab = 'post', m = H.modal('<div class="igx-pick"><div class="igx-sech"><h2>Choose from the planner</h2><button class="igk-b igk-b--sm igk-b--ghost" data-x>✕</button></div><div class="igx-seg" id="igPkT"></div><div id="igPkG"><div class="igx-load igx-load--s"><i></i></div></div></div>');
    m.classList.add('igx-pickm');
    var draw = function (items) {
      var ok = items.filter(function (p) { return p.status !== 'posted' && planType(p); });
      var list = ok.filter(function (p) { return tab === 'story' ? p.kind === 'story' : p.kind !== 'story'; }).sort(function (a, b) { return planOrder(a) - planOrder(b); });
      m.querySelector('#igPkT').innerHTML = [['post', 'Posts'], ['story', 'Stories']].map(function (t) { return '<button data-t="' + t[0] + '" class="' + (tab === t[0] ? 'is-on' : '') + '">' + t[1] + ' · ' + ok.filter(function (p) { return t[0] === 'story' ? p.kind === 'story' : p.kind !== 'story'; }).length + '</button>'; }).join('');
      m.querySelectorAll('#igPkT [data-t]').forEach(function (b) { b.onclick = function () { tab = b.getAttribute('data-t'); draw(items); }; });
      m.querySelector('#igPkG').innerHTML = list.length ? '<div class="igx-g igx-g--pick">' + list.map(function (p, i) { return planTile(p, tab === 'story' ? '9 / 16' : '4 / 5', i); }).join('') + '</div>' : '<p class="igx-note">Nothing left to post here.</p>';
      m.querySelectorAll('[data-d]').forEach(function (b) { b.onclick = function () { var p = items.filter(function (x) { return x.id === b.getAttribute('data-d'); })[0]; if (p) { m.remove(); cb(p); } }; });
    };
    planItems(draw);
  }
  function kitChange() { PL.at = 0; if (A.S.section === 'instagram' && (S.view === 'planner' || (S.view === 'profile' && S.ptab === 'planned'))) render(S.view === 'profile' ? 'planned' : S.view); }

  /* ---------- page + Instagram-style navigation ---------- */
  var NAV = [['feed', 'Home', 'home'], ['search', 'Search', 'search'], ['reels', 'Reels', 'reels'], ['messages', 'Messages', 'dm'], ['activity', 'Activity', 'heart'], ['create', 'Create', 'plus'], ['planner', 'Planner', 'cal'], ['designs', 'Designs', 'grid'], ['stats', 'Insights', 'stats'], ['profile', 'Profile', 'user']];
  /* moving between this page's tabs stays inside the page: no reload of the whole screen, the menu stays put */
  function igGo(path) {
    path = String(path || '').replace(/^#?instagram\/?/, '');
    var h = 'instagram' + (path ? '/' + path : '');
    if (location.hash !== '#' + h) history.pushState(null, '', '#' + h);
    A.S.hashNow = h; if (A.saveRoute) A.saveRoute(h);
    window.scrollTo(0, 0); var sc = document.querySelector('.a-app'); if (sc) sc.scrollTop = 0;
    var p = path.split('/'); render(p[0] || '', p.slice(1).join('/'));
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#instagram"]');
    if (!a || A.S.section !== 'instagram' || e.metaKey || e.ctrlKey) return;
    e.preventDefault(); document.querySelectorAll('.igk-modal:not(.igq-tourm)').forEach(function (m) { if (m.contains(a)) m.remove(); }); igGo(a.getAttribute('href'));
  });
  function render(sub, extra) {
    stopPoll(); closeViewer(); closeReels(); closeList();
    if (Date.now() - (S.fresh || 0) > 120000) { S.prof = S.media = S.tagged = null; S.fresh = Date.now(); }
    if (sub === 'connected') { H.toast('Instagram connected', 'ok'); history.replaceState(null, '', '#instagram'); sub = ''; }
    if (sub === 'error') { H.toast(decodeURIComponent(extra || 'Could not connect Instagram.'), 'err'); history.replaceState(null, '', '#instagram'); sub = ''; }
    var alias = { posts: 'profile', published: 'profile', reels: 'profile', tagged: 'profile', planned: 'profile', planner: 'profile', '': 'feed' };   /* opening Instagram lands on Home */
    if (sub === 'planner') sub = 'planned';   /* Planner opens the profile's Planned tab: the designs, right there */
    if (/^(reels|tagged|planned|posts)$/.test(sub || '')) S.ptab = sub === 'posts' ? 'posts' : sub;
    else if (sub === 'profile' || !sub) S.ptab = S.ptab === 'planned' ? 'posts' : S.ptab;
    S.view = alias[sub || ''] || (/^(feed|search|u|messages|activity|planner|designs|library|stats|profile)$/.test(sub) ? sub : 'profile');
    var wantTour = sub === 'tour';
    S.user = S.view === 'u' ? decodeURIComponent(extra || '') : null;
    /* the page frame (menus) is built once and kept; only the part below changes */
    var main = document.querySelector('#body'), keep = S.st && main.querySelector('.igx > #igNav[data-built]');
    var b = keep ? main : H.body('<div class="igx"><nav class="igx-nav" id="igNav"></nav><div class="igx-mtop" id="igMTop"></div><div id="igHead"></div><div id="igBody" class="igx-body"><div class="igx-load"><i></i></div></div><nav class="igx-mbot" id="igMBot"></nav></div>');
    if (keep) b.querySelector('#igBody').innerHTML = '';
    (S.st ? Promise.resolve(S.st) : api('status')).then(function (st) {
      S.st = st;
      if (!st.account) {
        S.st = null; b.querySelector('#igNav').hidden = true; b.querySelector('#igMTop').hidden = true; b.querySelector('#igMBot').hidden = true;
        if (S.view === 'designs' || S.view === 'library') return designs(b.querySelector('#igBody'));   /* the designs work before Instagram is connected */
        return connect(b, st);
      }
      nav(b); dots();
      var el = b.querySelector('#igBody');
      ({ profile: profile, feed: feed, search: search, u: userPage, messages: messages, activity: activity, planner: planner, designs: planner, library: designs, stats: stats })[S.view](el);
      if (wantTour || !ls('toured2')) setTimeout(tour, 900);
      if (!S.kicked) { S.kicked = 1; api('cron').catch(function () { }); }   /* publish anything due while the admin is open */
    }).catch(function (e) { b.querySelector('#igBody').innerHTML = '<div class="igk-card"><div class="igk-card__b"><p>' + esc(e.message) + '</p></div></div>'; });
  }
  var MBOT = [['feed', 'Home', 'home'], ['search', 'Search', 'search'], ['reels', 'Reels', 'reels'], ['planner', 'Planner', 'cal'], ['designs', 'Designs', 'grid'], ['profile', 'Profile', 'user']];
  var MTOP = [['create', 'Create', 'plus'], ['activity', 'Activity', 'heart'], ['messages', 'Messages', 'dm'], ['stats', 'Insights', 'stats']];
  function navBtn(t, cls) {
    var a = S.st.account, ic = t[0] === 'profile' ? av(a.picture, a.username, 'igx-av--nav') : IC[t[2]];
    return '<button class="' + cls + '" data-v="' + t[0] + '" title="' + t[1] + '" aria-label="' + t[1] + '">' + ic + '<span>' + t[1] + '</span>' + (t[0] === 'messages' || t[0] === 'activity' ? '<em class="igx-dot" data-dot="' + t[0] + '" hidden></em>' : '') + '</button>';
  }
  function nav(b) {
    var a = S.st.account, n = b.querySelector('#igNav');
    if (!n.hasAttribute('data-built')) {
      n.innerHTML = '<span class="igx-brand">' + IC.ig + '<b>Instagram</b></span>' + NAV.map(function (t) { return navBtn(t, 'igx-nb'); }).join('') + '<span class="igx-sp"></span><button class="igx-nb igx-nb--more" data-more title="Connection">' + IC.dots + '<span>More</span></button>';
      b.querySelector('#igMTop').innerHTML = '<button class="igx-mu" data-v="profile"><b>' + esc(a.username) + '</b></button><span class="igx-sp"></span>' + MTOP.map(function (t) { return navBtn(t, 'igx-mi'); }).join('') + '<button class="igx-mi" data-more title="More">' + IC.dots + '</button>';
      b.querySelector('#igMBot').innerHTML = MBOT.map(function (t) { return navBtn(t, 'igx-mb'); }).join('');
      b.querySelectorAll('#igNav [data-v], #igMTop [data-v], #igMBot [data-v]').forEach(function (x) {
        x.onclick = function () {
          var v = x.getAttribute('data-v'); if (v === 'create') return editor(null);
          if (v === 'reels') return openReelsTab();
          if (S.view === 'profile' && (v === 'planner' || v === 'profile')) return profTab(v === 'planner' ? 'planned' : 'posts');   /* same page: just switch the tab */
          if (v === S.view) return; igGo(v === 'planner' ? 'planned' : v);
        };
      });
      b.querySelectorAll('[data-more]').forEach(function (x) { x.onclick = connectionModal; });
      n.setAttribute('data-built', '1');
    }
    navActive();
  }
  /* which tab is open (Planner = the profile's Planned tab) */
  function navActive() {
    document.querySelectorAll('#igNav [data-v], #igMTop [data-v], #igMBot [data-v]').forEach(function (x) {
      var v = x.getAttribute('data-v'), plan = S.view === 'profile' && S.ptab === 'planned';
      var on = v === 'planner' ? plan : v === 'profile' ? S.view === 'profile' && !plan : S.view === v || (v === 'search' && S.view === 'u') || (v === 'designs' && S.view === 'library');
      x.classList.toggle('is-on', on);
      if (v === 'activity') { var sv0 = x.querySelector('svg'); if (sv0) sv0.outerHTML = on ? IC.heartOn : IC.heart; }
    });
  }
  function dots() {
    var items = S.watch || [], seenA = ls('seenA') || 0, seenM = ls('seenM') || 0;
    var a = items.some(function (x) { return x.k !== 'message' && x.at > seenA; }), m = items.some(function (x) { return x.k === 'message' && x.at > seenM; });
    document.querySelectorAll('[data-dot="activity"]').forEach(function (d) { d.hidden = !a || S.view === 'activity'; });
    document.querySelectorAll('[data-dot="messages"]').forEach(function (d) { d.hidden = !m || S.view === 'messages'; });
    if (A.computeBell) A.computeBell();
  }
  function connectionModal() {
    var a = S.st.account;
    var m = H.modal('<h2>Instagram connection</h2><p class="igk-muted">Connected as <b>@' + esc(a.username) + '</b>' + (a.pageName ? ' (through the Facebook Page ' + esc(a.pageName) + ')' : '') + '. ' + (a.expiresAt ? 'The connection lasts 60 days and renews itself.' : 'The connection doesn’t expire.') + '</p>' +
'<p class="igk-faint">Connected ' + when(a.connectedAt) + (a.expiresAt ? ' · current connection until ' + when(a.expiresAt) : '') + '</p>' +
      '<p class="igk-faint">New messages, comments, likes, followers and tags are checked every few minutes while the app is open, and every 30 minutes otherwise. They show in the bell and as notifications on your phone.</p>' +
      '<div class="igk-row"><a class="igk-b" href="https://www.instagram.com/' + encodeURIComponent(a.username) + '/" target="_blank" rel="noopener">' + IC.ext + '<span>Open Instagram</span></a>' + (A.owner() ? '<button class="igk-b" id="igRe">Reconnect</button><button class="igk-b igk-b--ghost igq-danger" id="igOff">Disconnect</button>' : '') + '<button class="igk-b" id="igTour">Take the tour</button><span class="igq-sp"></span><button class="igk-b" data-x>Close</button></div>');
    m.querySelector('#igTour').onclick = function () { m.remove(); tour(); };
    if (m.querySelector('#igRe')) m.querySelector('#igRe').onclick = function () { m.remove(); S.st = null; tokenBox(); };
    if (m.querySelector('#igOff')) m.querySelector('#igOff').onclick = function () { ask('Disconnect @' + a.username + '? Scheduled posts stay saved but won’t be published until you connect again.').then(function (ok) { if (!ok) return; api('disconnect', {}).then(function () { m.remove(); S.st = null; S.media = null; render(''); }); }); };
  }

  /* ---------- profile: header, then posts · reels · tagged · planned ---------- */
  function profile(el) {
    var a = S.st.account;
    el.innerHTML = '<div id="igPh">' + headSkel() + '</div><div class="igx-tabs" id="igPt"></div><div id="igPg"></div>';
    var ph = el.querySelector('#igPh');
    var paint = function (r) {
      var p = r.profile || {};
      ph.innerHTML = header(p, { me: true, actions: '<button class="igx-btn" id="igNew2">New post</button><button class="igx-btn" id="igPl">Planner</button><button class="igx-btn" id="igIn">Insights</button>' });
      ph.querySelector('#igNew2').onclick = function () { editor(null); };
      ph.querySelector('#igPl').onclick = function () { profTab('planned'); };
      ph.querySelector('#igIn').onclick = function () { igGo('stats'); };
    };
    /* opens at once from the copy kept on this phone, then updates quietly */
    var cp = !S.prof && ls('cprof');
    if (S.prof) paint(S.prof); else if (cp && cp.profile) paint(cp);
    if (!S.prof) api('profile').then(function (r) {
      S.prof = r; ls('cprof', r);
      var same = function (x, y) { return ['username', 'name', 'biography', 'website', 'followers_count', 'follows_count', 'media_count'].every(function (k) { return (x || {})[k] === (y || {})[k]; }); };
      if (document.body.contains(ph) && !(cp && same(r.profile, cp.profile))) paint(r);
    }).catch(function (e) { if (!cp) ph.innerHTML = header({ username: a.username, profile_picture_url: a.picture }, { me: true }) + '<p class="igk-faint">' + esc(e.message) + '</p>'; });
    var tabs = [['posts', 'Posts', IC.grid], ['reels', 'Reels', IC.reels], ['tagged', 'Tagged', IC.tag], ['planned', 'Planned', IC.clock]];
    var pt = el.querySelector('#igPt');
    pt.innerHTML = tabs.map(function (t) { return '<button data-pt="' + t[0] + '" class="' + (S.ptab === t[0] ? 'is-on' : '') + '">' + t[2] + '<span>' + t[1] + '</span></button>'; }).join('');
    pt.querySelectorAll('[data-pt]').forEach(function (b) { b.onclick = function () { profTab(b.getAttribute('data-pt')); }; });
    ptab(el.querySelector('#igPg'));
  }
  /* switch the profile's tab in place (Posts, Reels, Tagged, Planned) and keep the address in step */
  function profTab(t) {
    var pt = document.getElementById('igPt'), pg = document.getElementById('igPg'); if (!pt || !pg) return igGo(t);
    S.ptab = t; stopPoll();
    pt.querySelectorAll('[data-pt]').forEach(function (x) { x.classList.toggle('is-on', x.getAttribute('data-pt') === t); });
    var h = 'instagram/' + (t === 'posts' ? 'profile' : t); if (location.hash !== '#' + h) { history.replaceState(null, '', '#' + h); A.S.hashNow = h; } if (A.saveRoute) A.saveRoute(h);
    navActive(); ptab(pg);
    if (t === 'planned') { var r = pt.getBoundingClientRect(); if (r.top < 0 || r.top > innerHeight * .6) pt.scrollIntoView({ block: 'start', behavior: 'smooth' }); }
  }
  function headSkel() { return '<div class="igx-ph is-skel"><span class="igx-ring"><i class="igx-av igx-av--xl"></i></span><div class="igx-pi"><b class="igk-skel"></b><b class="igk-skel"></b><b class="igk-skel"></b></div></div>'; }
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
    /* the last posts seen on this phone show at once; the grid only redraws if Instagram has something different */
    var key = function (l) { return JSON.stringify((l || []).map(function (x) { return [x.id, x.like_count, x.comments_count]; })); };
    var cm = ls('cmedia'), tab0 = S.ptab;
    if (cm && cm.items && cm.items.length) { S.media = cm.items; S.after = cm.after; showMedia(el); S.media = null; } else el.innerHTML = gridSkel();
    api('media').then(function (r) {
      S.media = r.items; S.after = r.after; ls('cmedia', { items: r.items, after: r.after });
      if (!document.body.contains(el) || S.ptab !== tab0) return;
      if (!cm || key(cm.items) !== key(r.items) || cm.after !== r.after) return showMedia(el);
      /* same posts: keep the grid, only swap in fresh links for pictures whose old link expired */
      el.querySelectorAll('.igx-t[data-i] img').forEach(function (im) { var x = r.items[+im.parentNode.getAttribute('data-i')]; if (x && im.complete && !im.naturalWidth) im.src = thumb(x); });
    }).catch(function (e) { if (!cm) el.innerHTML = '<p class="igx-empty">' + esc(e.message) + '</p>'; });
  }
  function gridSkel() { var h = ''; for (var i = 0; i < 9; i++) h += '<span class="igx-t is-skel"></span>'; return '<div class="igx-g">' + h + '</div>'; }
  function showMedia(el) {
    var reels = S.ptab === 'reels', list = reels ? S.media.filter(isReel) : S.media;
    if (!list.length && !S.after) { el.innerHTML = emptyState(reels ? IC.reels : IC.img, reels ? 'No reels yet' : 'Share photos', reels ? 'Reels you share will appear here.' : 'When you share photos, they will appear on your profile.', true); var c = el.querySelector('[data-new]'); if (c) c.onclick = function () { editor(null); }; return; }
    el.innerHTML = grid(list, reels) + (S.after ? '<div class="igx-more"><button class="igx-btn" id="igLm">Load more</button></div>' : '');
    bindGrid(el, list, { own: true });
    var lm = el.querySelector('#igLm'); if (lm) lm.onclick = function () { lm.textContent = 'Loading…'; lm.disabled = true; api('media', undefined, 'after=' + encodeURIComponent(S.after)).then(function (r) { S.media = S.media.concat(r.items); S.after = r.after; showMedia(el); }); };
  }
  function emptyState(icon, title, text, cta) { return '<div class="igx-empty"><span class="igx-ei">' + icon + '</span><h3>' + title + '</h3><p>' + text + '</p>' + (cta ? '<button class="igx-link" data-new>Share your first post</button>' : '') + '</div>'; }
  function grid(list, tall) {
    return '<div class="igx-g' + (tall ? ' igx-g--tall' : '') + '">' + list.map(function (x, i) {
      var t = thumb(x), badge = x.media_type === 'CAROUSEL_ALBUM' ? IC.layers : isReel(x) ? IC.reels : '';
      return '<button class="igx-t" data-i="' + i + '">' + (t ? '<img src="' + esc(t) + '" alt="" decoding="async" referrerpolicy="no-referrer"' + (i < 9 ? ' fetchpriority="high"' : ' loading="lazy"') + '>' : '<span class="igx-noimg">' + IC.img + '</span>') + (badge ? '<em>' + badge + '</em>' : '') +
        '<span class="igx-ov"><span>' + IC.heartOn + num(x.like_count) + '</span><span>' + sv('<path d="M20.66 17A10 10 0 1 0 17 20.62L22 22Z"/>', { fill: 'currentColor' }) + num(x.comments_count) + '</span></span></button>';
    }).join('') + '</div>';
  }
  function bindGrid(el, list, o) { el.querySelectorAll('.igx-t[data-i]').forEach(function (b) { b.onclick = function () { openPost(list, +b.getAttribute('data-i'), o); }; }); }
  var vidUrl = function (x) { return x && x.media_type === 'VIDEO' && x.media_url ? x.media_url : ''; };
  var isVid = function (x) { return !!vidUrl(x); };
  function ownerOf(x, o) { if (!x.owner) x.owner = (o && o.owner) || (o && o.own && S.st && S.st.account ? { username: S.st.account.username, picture: S.st.account.picture, me: true } : { username: x.username || '' }); return x.owner; }
  function openPost(list, i, o) {
    list.forEach(function (x) { ownerOf(x, o); });
    var x = list[i];
    if (isVid(x) && isReel(x)) { var rl = list.filter(function (y) { return isVid(y) && isReel(y); }); return reels(rl, rl.indexOf(x), o); }
    if (innerWidth <= 760) return postList(list, i, o);
    viewer(list, i, o);
  }
  function tagged(el) {
    if (S.tagged) return draw();
    el.innerHTML = gridSkel();
    api('tags').then(function (r) { S.tagged = r.items; draw(); }).catch(function (e) { el.innerHTML = '<p class="igx-empty">' + esc(e.message) + '</p>'; });
    function draw() {
      if (!S.tagged.length) { el.innerHTML = emptyState(IC.tag, 'Photos of you', 'When people tag you in photos, they’ll appear here.'); return; }
      S.tagged.forEach(function (x) { x.owner = { username: x.username }; });
      el.innerHTML = grid(S.tagged); bindGrid(el, S.tagged, { own: false });
    }
  }

  /* ---------- planned: posts saved here (drafts, scheduled, failed) and the planner's designs ---------- */
  function upcoming() {
    return (S.posts || []).filter(function (p) { return p.status !== 'published'; }).sort(function (a, b) { return (a.status === 'failed' ? -1 : 0) - (b.status === 'failed' ? -1 : 0) || (a.at || 9e15) - (b.at || 9e15) || b.updatedAt - a.updatedAt; });
  }
  function bindPosts(el) { el.querySelectorAll('[data-p]').forEach(function (x) { x.onclick = function () { var p = (S.posts || []).filter(function (q) { return q.id === x.getAttribute('data-p'); })[0]; if (p) editor(p); }; }); }
  function bindDesigns(el, items) { el.querySelectorAll('[data-d]').forEach(function (x) { x.onclick = function () { var p = items.filter(function (q) { return q.id === x.getAttribute('data-d'); })[0]; if (p) planSheet(p); }; }); }
  function watchQueue(el, redraw) {
    if (!upcoming().some(function (p) { return p.status === 'processing' || (p.status === 'scheduled' && p.at < Date.now() + 15 * 6e4); })) return;
    var st = function (l) { return JSON.stringify((l || []).map(function (p) { return p.id + p.status; })); };
    S.poll = setInterval(function () { if (!document.body.contains(el)) return stopPoll(); api('cron').then(function () { return api('posts'); }).then(function (r2) { if (st(r2.items) !== st(S.posts)) { S.posts = r2.items; S.media = null; PL.at = 0; redraw(); } }).catch(function () { }); }, 30000);
  }
  /* the profile's Planned tab: what will go out next, as it will look on the grid */
  function plannedGrid(el) {
    var designs = null, got = false;
    var draw = function () {
      if (!document.body.contains(el)) return;
      var st = S.pkind === 'story', isK = function (p) { return st ? p.kind === 'story' : (p.kind === 'post' || p.kind === 'carousel'); };
      var up = upcoming().filter(function (p) { return st ? p.type === 'story' : p.type !== 'story'; }), ds = (designs || []).filter(function (p) { return p.status !== 'posted' && isK(p) && !planFor(p.id); }).sort(function (a, b) { return st ? planOrder(a) - planOrder(b) : planOrder(b) - planOrder(a); });
      var nStories = (designs || []).filter(function (p) { return p.status !== 'posted' && p.kind === 'story'; }).length;
      /* like the profile once everything is out: newest top left, the next one to post at the bottom right.
         Posts with a time come last (they go out first, the soonest at the very end); drafts and failed ones first */
      var loose = up.filter(function (p) { return p.status !== 'scheduled' && p.status !== 'processing'; }), timed = up.filter(function (p) { return p.status === 'scheduled' || p.status === 'processing'; }).sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
      var sig = JSON.stringify([S.pkind, up.map(function (p) { return [p.id, p.status, p.updatedAt]; }), ds.map(function (p) { return p.id; })]);
      if (el.getAttribute('data-sig') === sig) return; el.setAttribute('data-sig', sig);
      el.innerHTML = (nStories ? '<div class="igx-seg igx-pk"><button data-k="post" class="' + (st ? '' : 'is-on') + '">Posts</button><button data-k="story" class="' + (st ? 'is-on' : '') + '">Stories · ' + nStories + '</button></div>' : '') +
        '<div class="igx-g igx-g--plan' + (st ? ' igx-g--tall' : '') + '"><button class="igx-t igx-t--new" data-new>' + IC.plus + '<span>New ' + (st ? 'story' : 'post') + '</span></button>' + loose.map(postTile).join('') + ds.map(function (p, i) { return planTile(p, st ? '9 / 16' : '3 / 4', i); }).join('') + timed.map(postTile).join('') + '</div>' +
        (up.length || ds.length ? '<p class="igx-note">' + (st ? 'Stories in posting order. Tap one to post it now or schedule it.' : 'This is how the profile will look once they’re all out: the next post is at the bottom right. Tap a design to post it now or schedule it.') + '</p>' : '<p class="igx-note">Nothing planned yet. Tap <b>New post</b>, or add designs in <a href="#instagram/designs">Designs</a>.</p>');
      el.querySelector('[data-new]').onclick = function () { editor(st ? { type: 'story', caption: '', media: [], at: null, status: 'draft' } : null); };
      el.querySelectorAll('[data-k]').forEach(function (b) { b.onclick = function () { S.pkind = b.getAttribute('data-k'); draw(); }; });
      bindPosts(el); bindDesigns(el, designs || []);
    };
    if (S.posts) { got = true; } else el.innerHTML = gridSkel();
    planItems(function (items) { designs = items; if (got) draw(); });
    if (got) draw();
    api('posts').then(function (r) { S.posts = r.items; got = true; draw(); watchQueue(el, draw); }).catch(function (e) { if (!got) el.innerHTML = '<p class="igx-empty">' + esc(e.message) + '</p>'; });
  }
  /* Planner: scheduled posts and drafts, then every design by type (posts, stories, reel covers, highlights) */
  var PT = { tab: 'post', filter: 'open' };
  function planner(el) {
    el.innerHTML = '<div class="igx-sec igx-planner"><div class="igx-sech"><h2>Designs</h2><a class="igx-btn" href="#instagram/designs" data-igadd>Add or edit</a><button class="igx-btn igx-btn--b" id="igNew3">New post</button></div><div data-igpack></div><div id="igPq"></div><div id="igPd"><div class="igx-load"><i></i></div></div></div>';
    el.querySelector('#igNew3').onclick = function () { editor(null); };
    var pq = el.querySelector('#igPq'), pd = el.querySelector('#igPd'), designs = null;
    var queue = function () {
      var up = upcoming();
      var sig = JSON.stringify(up.map(function (p) { return [p.id, p.status, p.updatedAt]; })); if (pq.getAttribute('data-sig') === sig) return; pq.setAttribute('data-sig', sig);
      pq.innerHTML = up.length ? '<h3 class="igx-gh">Scheduled and drafts</h3><div class="igx-g igx-g--plan">' + up.map(postTile).join('') + '</div>' : '';
      bindPosts(pq);
    };
    var draw = function (force) {
      if (!document.body.contains(pd) || !designs) return;
      var sig = JSON.stringify([PT, (S.posts || []).map(function (p) { return [p.id, p.status, p.planId]; }), designs.map(function (p) { return [p.id, p.status, p.updatedAt]; })]);
      if (!force && pd.getAttribute('data-sig') === sig) return; pd.setAttribute('data-sig', sig);
      var TABS = [['post', 'Posts', '4 / 5'], ['story', 'Stories', '9 / 16'], ['reel', 'Reel covers', '9 / 16'], ['highlight', 'Highlights', '1 / 1']];
      var tabOf = function (p) { return p.kind === 'carousel' ? 'post' : (p.kind || 'post'); };
      var open = function (p) { return p.status !== 'posted'; };
      /* posts: arranged like the profile (newest top left, the next to post bottom right); the rest in posting order */
      var list = designs.filter(function (p) { return tabOf(p) === PT.tab && (PT.filter === 'all' || (PT.filter === 'posted' ? !open(p) : open(p))); }).sort(function (a, b) { return PT.tab === 'post' ? planOrder(b) - planOrder(a) : planOrder(a) - planOrder(b); });
      var ratio = TABS.filter(function (t) { return t[0] === PT.tab; })[0][2];
      pd.innerHTML = '<h3 class="igx-gh">Ready to post</h3><div class="igx-ptabs">' + TABS.map(function (t) { return '<button data-t="' + t[0] + '" class="' + (PT.tab === t[0] ? 'is-on' : '') + '">' + t[1] + ' <i>' + designs.filter(function (p) { return tabOf(p) === t[0] && open(p); }).length + '</i></button>'; }).join('') + '</div>' +
        '<div class="igx-seg igx-pf">' + [['open', 'To post'], ['posted', 'Posted'], ['all', 'All']].map(function (f) { return '<button data-f="' + f[0] + '" class="' + (PT.filter === f[0] ? 'is-on' : '') + '">' + f[1] + '</button>'; }).join('') + '</div>' +
        (list.length ? '<div class="igx-g igx-g--d">' + list.map(function (p, i) { return planTile(p, ratio, i); }).join('') + '</div>' : '<p class="igx-note">Nothing here.' + ' <a href="#instagram/designs" data-igadd>Add designs</a>.' + '</p>') +
        '<p class="igx-note">' + ({ post: 'This is how the profile will look: the next post is at the bottom right. Tap one to post it now, schedule it or save it to your phone.', story: 'In posting order. Stickers (polls, links, questions) are added in the Instagram app.', reel: 'Covers for reels: film the reel, then pick the cover in the Instagram app.', highlight: 'Add each cover in the Instagram app (Edit highlight → Edit cover).' })[PT.tab] + '</p>' +
        '<div class="igx-more"><a class="igx-btn" href="#instagram/designs" data-igadd>' + IC.grid + '<span>Add, edit or reorder designs</span></a></div>';
      pd.querySelectorAll('[data-t]').forEach(function (b) { b.onclick = function () { PT.tab = b.getAttribute('data-t'); draw(true); }; });
      pd.querySelectorAll('[data-f]').forEach(function (b) { b.onclick = function () { PT.filter = b.getAttribute('data-f'); draw(true); }; });
      bindDesigns(pd, designs);
    };
    planItems(function (items) { designs = items; draw(); var k = PK(); if (k && A.owner()) k.packPanel(items); });
    var go = function () { queue(); draw(); };
    if (S.posts) go();
    api('posts').then(function (r) { S.posts = r.items; go(); watchQueue(el, go); }).catch(function (e) { pq.innerHTML = '<p class="igx-note">' + esc(e.message) + '</p>'; });
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
      el.querySelector('#igvSh').onclick = function () { shareSheet(x); };
      el.querySelector('#igvCm').onclick = function () { var t = el.querySelector('#igvT'); if (t) t.focus(); else if (x.permalink) window.open(x.permalink, '_blank', 'noopener'); };
      el.querySelector('#igvMore').onclick = function () { postMenu(x, own); };
      if (own) {
        var f = el.querySelector('#igvF'), t = el.querySelector('#igvT'), p = el.querySelector('#igvP');
        t.oninput = function () { p.disabled = !t.value.trim(); if (!/^@\S+\s/.test(t.value)) V.replyTo = null; };
        f.onsubmit = function (e) {
          e.preventDefault(); if (!t.value.trim()) return; p.disabled = true;
          var body = V.replyTo ? { op: 'reply', id: V.replyTo, text: t.value } : { op: 'comment', id: x.id, text: t.value };
          api('comment', body).then(function () { t.value = ''; V.replyTo = null; x.comments_count = (x.comments_count || 0) + 1; comments(x); }, function (er) { p.disabled = false; H.toast(er.message, 'err'); });
        };
        el.querySelector('#igvIn').onclick = function () { insights(x); };
        comments(x);
        api('media-one', undefined, 'id=' + encodeURIComponent(x.id) + '&t=' + encodeURIComponent(x.media_product_type || '')).then(function (rr) {
          if (!V || V.list[V.i] !== x) return;
          Object.assign(x, rr.item || {}); x._stats = rr.stats || {};
          var lk = el.querySelector('#igvLk'); if (lk) lk.innerHTML = likesText(x.like_count);
        }).catch(function () { });
      }
    }
  }
  function likesText(n) { n = +n || 0; return n === 0 ? 'Be the first to like this' : full(n) + ' like' + (n === 1 ? '' : 's'); }
  function slides(x, lite) {
    var kids = x.children && x.children.data && x.children.data.length ? x.children.data : [x];
    var one = function (k) {
      var vid = k.media_type === 'VIDEO' || (k === x && isReel(x) && x.media_type !== 'IMAGE' && x.media_type !== 'CAROUSEL_ALBUM');
      if (vid && k.media_url && lite) return '<span class="igx-vs" data-vsrc="' + esc(k.media_url) + '" data-vposter="' + esc(k.thumbnail_url || '') + '">' + (k.thumbnail_url ? '<img class="igx-vp" src="' + esc(k.thumbnail_url) + '" alt="" referrerpolicy="no-referrer">' : '<i class="igx-vph">' + IC.reels + '</i>') + '</span>';
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
  /* Instagram only lets the app like things if the token carries instagram_manage_engagement */
  /* when Instagram hasn't given the app liking yet, the heart quietly opens the post in Instagram to like it there */
  function canLike() { return true; }
  /* Instagram only lets the app send likes once the token carries instagram_manage_engagement; until then a like is kept in the app */
  function likeOnIg() { var a = S.st && S.st.account; return !(a && (a.missing || []).indexOf('instagram_manage_engagement') >= 0); }
  function toggleLike(x, btn) {
    if (!canLike(x)) return;
    var on = !liked(x.id); liked(x.id, on); x.like_count = Math.max(0, (+x.like_count || 0) + (on ? 1 : -1));
    var paint = function () { if (!btn || !document.body.contains(btn)) return; btn.classList.toggle('is-on', liked(x.id)); btn.innerHTML = liked(x.id) ? IC.heartOn : IC.heart; var lk = document.getElementById('igvLk'); if (lk) lk.innerHTML = likesText(x.like_count); document.querySelectorAll('[data-lk="' + x.id + '"]').forEach(function (e) { e.textContent = likesText(x.like_count); }); };
    paint(); if (on && btn) { btn.classList.add('is-pop'); setTimeout(function () { btn.classList.remove('is-pop'); }, 400); }
    if (likeOnIg()) api('like', { id: x.id, on: on }).catch(function () { /* kept in the app */ });
  }
  function cRow(c, o) {
    var u = c.username || (c.from && c.from.username) || '';
    return '<div class="igc' + (o.reply ? ' igc--r' : '') + (c.hidden ? ' is-hidden' : '') + '">' + av(c.pic, u) + '<div class="igc-b"><p><b>' + esc(u) + '</b> ' + rich(c.text) + '</p>' +
      '<div class="igc-m"><span>' + (c.timestamp ? ago(c.timestamp) : '') + '</span>' + (c.like_count ? '<span>' + c.like_count + ' like' + (c.like_count > 1 ? 's' : '') + '</span>' : '') + (c.hidden ? '<span>Hidden</span>' : '') +
      (o.cap ? '' : (o.reply ? '' : '<button data-rp="' + c.id + '" data-u="' + esc(u) + '">Reply</button>') + '<button data-hd="' + c.id + '" data-h="' + (c.hidden ? 1 : 0) + '">' + (c.hidden ? 'Unhide' : 'Hide') + '</button>' + (A.owner() ? '<button data-dl="' + c.id + '">Delete</button>' : '')) + '</div></div>' +
      (o.cap ? '' : '<button class="igc-lk' + (liked(c.id) ? ' is-on' : '') + '" data-lc="' + c.id + '" title="Like">' + (liked(c.id) ? IC.heartOn : IC.heart) + '</button>') + '</div>';
  }
  function comments(x) {
    var box = document.getElementById('igvC'); if (!box) return;
    api('comments', undefined, 'id=' + encodeURIComponent(x.id)).then(function (r) {
      box = document.getElementById('igvC'); if (!box || !V || V.list[V.i] !== x) return;
      var cap = x.caption ? cRow({ username: S.st.account.username, text: x.caption, timestamp: x.timestamp, pic: S.st.account.picture }, { cap: true }) : '';
      box.innerHTML = cap + (r.items.length ? r.items.map(function (c) { return cRow(c, {}) + ((c.replies && c.replies.data) || []).slice().reverse().map(function (y) { return cRow(y, { reply: true }); }).join(''); }).join('') : '<div class="igv-none"><h3>No comments yet.</h3><p>Start the conversation.</p></div>');
      box.querySelectorAll('[data-rp]').forEach(function (b) { b.onclick = function () { var t = document.getElementById('igvT'); V.replyTo = b.getAttribute('data-rp'); t.value = '@' + b.getAttribute('data-u') + ' '; t.focus(); document.getElementById('igvP').disabled = false; }; });
      box.querySelectorAll('[data-hd]').forEach(function (b) { b.onclick = function () { api('comment', { op: b.getAttribute('data-h') === '1' ? 'unhide' : 'hide', id: b.getAttribute('data-hd') }).then(function () { comments(x); }, function (e) { H.toast(e.message, 'err'); }); }; });
      box.querySelectorAll('[data-dl]').forEach(function (b) { b.onclick = function () { ask('Delete this comment?').then(function (ok) { if (ok) api('comment', { op: 'delete', id: b.getAttribute('data-dl') }).then(function () { comments(x); }, function (e) { H.toast(e.message, 'err'); }); }); }; });
      box.querySelectorAll('[data-lc]').forEach(function (b) {
        b.onclick = function () {
          if (!canLike(V && V.list[V.i])) return;
          var id = b.getAttribute('data-lc'), on = !liked(id); liked(id, on); b.classList.toggle('is-on', on); b.innerHTML = on ? IC.heartOn : IC.heart;
          if (likeOnIg()) api('like', { kind: 'comment', id: id, on: on }).catch(function () { /* kept in the app */ });
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
    api('media-one', undefined, 'id=' + encodeURIComponent(x.id) + '&t=' + encodeURIComponent(x.media_product_type || '')).then(function (r) { x._stats = r.stats || {}; show(x._stats); }, function (e) { box.innerHTML = '<p class="igv-note">' + esc(e.message) + '</p>'; });
  }
  function postMenu(x, own) {
    var m = H.modal('<div class="igx-menu">' +
      (x.permalink ? '<a href="' + esc(x.permalink) + '" target="_blank" rel="noopener">Go to post on Instagram</a><button data-a="copy">Copy link</button>' : '') +
      (own ? '<button data-a="ins">View insights</button><button data-a="cm">' + (x.comment_enabled === false ? 'Turn on commenting' : 'Turn off commenting') + '</button>' + (A.owner() ? '<button data-a="del" class="is-red">Delete post</button>' : '') : '<a href="#instagram/u/' + encodeURIComponent((x.owner && x.owner.username) || x.username || '') + '" data-x>About this account</a>') +
      '<button data-x>Cancel</button></div>');
    m.classList.add('igx-menum');
    m.querySelectorAll('[data-a]').forEach(function (b) {
      b.onclick = function () {
        var a = b.getAttribute('data-a'); m.remove();
        if (a === 'copy' && navigator.clipboard) navigator.clipboard.writeText(x.permalink).then(function () { H.toast('Link copied', 'ok'); });
        if (a === 'ins') insights(x);
        if (a === 'cm') { var on = x.comment_enabled === false; api('media-comments', { id: x.id, on: on }).then(function () { x.comment_enabled = on; H.toast(on ? 'Commenting turned on' : 'Commenting turned off', 'ok'); }, function (e) { H.toast(e.message, 'err'); }); }
        if (a === 'del') ask('Delete this post from Instagram? This can’t be undone.').then(function (ok) {
          if (!ok) return;
          api('media-del', { id: x.id }).then(function () { H.toast('Post deleted', 'ok'); if (S.media) S.media = S.media.filter(function (y) { return y.id !== x.id; }); if (S.prof && S.prof.profile) S.prof.profile.media_count = Math.max(0, (S.prof.profile.media_count || 1) - 1); closeViewer(); render(S.view === 'feed' ? 'feed' : 'profile'); }, function (e) { H.toast(e.message, 'err'); });
        });
      };
    });
  }

  /* ---------- home feed: your posts + the accounts you add ---------- */
  /* posts grouped into rounds: round 1 = the newest post of every account (each account once), round 2 = the next one… */
  function rounds(items) {
    var by = {}, order = [], out = [];
    items.forEach(function (x) { var u = (x.owner && x.owner.username) || '?'; if (!by[u]) { by[u] = []; order.push(u); } by[u].push(x); });
    for (var r = 0; r < 8; r++) { var row = []; order.forEach(function (u) { if (by[u][r]) row.push(by[u][r]); }); if (!row.length) break; row.sort(function (p, q) { return new Date(q.timestamp) - new Date(p.timestamp); }); out.push(row); }
    return out;
  }
  function feed(el) {
    el.innerHTML = '<div class="igx-feed"><div class="igx-fc"><div class="igx-tray" id="igTray"></div><div class="igx-fk" id="igFk"><button data-k="all" class="is-on">For you</button><button data-k="reels">' + IC.reels + 'Reels</button></div><div id="igFc"><div class="igx-load"><i></i></div></div></div><aside class="igx-fs" id="igFs"></aside></div>';
    var shown = 0, list = [], rr = [], round = 0, io = null, fc = el.querySelector('#igFc');
    var reelsList = function () { var v = rounds((S.feedAll || []).filter(function (x) { return isVid(x) && (isReel(x) || x.media_type === 'VIDEO'); })); return v[0] || []; };
    el.querySelector('#igFk [data-k="reels"]').onclick = function () { var l = reelsList(); if (!l.length) return H.toast('No reels right now. Check back soon.'); reels(l, 0, { own: false, from: 'feed' }); };
    el.querySelector('#igFk [data-k="all"]').onclick = function () { var sc = document.querySelector('.a-app'); if (sc) sc.scrollTo({ top: 0, behavior: 'smooth' }); window.scrollTo({ top: 0, behavior: 'smooth' }); };
    var more = function () {
      var box = fc.querySelector('#igFl'); if (!box) return;
      var next = list.slice(shown, shown + 6), from = shown; shown += next.length;
      box.insertAdjacentHTML('beforeend', next.map(function (x, k) { return post(x, from + k, from + k > 1); }).join(''));
      [].slice.call(box.querySelectorAll('.igx-post')).slice(from).forEach(function (p) { wirePost(p, list, { own: false, feed: true }); if (sio) sio.observe(p); });
      var end = fc.querySelector('#igFe'); if (end) end.hidden = shown < list.length;
    };
    /* the row of profiles: our story first, then new accounts and ones with posts you haven't seen, then the rest */
    var tray = function (fl, r) {
      var seen = ls('seenF') || {}, latest = {};
      (S.feedAll || []).forEach(function (x) { var u = (x.owner || {}).username; if (u && (!latest[u] || x.timestamp > latest[u].timestamp)) latest[u] = x; });
      var acc = (fl || []).map(function (f, k) { var l = latest[f.username]; return { f: f, k: k, fresh: l && !seen[l.id] ? 1 : 0, nu: f.added && Date.now() - f.added < 3 * 864e5 ? 1 : 0, t: l ? l.timestamp : '' }; })
        .sort(function (a, b) { return b.nu - a.nu || b.fresh - a.fresh || String(b.t).localeCompare(String(a.t)) || a.k - b.k; });
      var me = (r && r.me) || (S.st && S.st.account) || {}, st = (r && r.stories) || [];
      el.querySelector('#igTray').innerHTML = (st.length ? '<button class="igx-tr" data-story><span class="igx-ring">' + av(me.picture, me.username) + '</span><small>Your story</small></button>' : '') +
        acc.slice(0, 50).map(function (o) { var f = o.f; return '<a class="igx-tr' + (o.fresh || o.nu ? '' : ' is-seen') + '" href="#instagram/u/' + encodeURIComponent(f.username) + '"><span class="igx-ring">' + av(f.picture, f.username) + (o.nu ? '<em class="igx-new">NEW</em>' : '') + '</span><small>' + esc(f.username) + '</small></a>'; }).join('') +
        '<a class="igx-tr igx-tr--add" href="#instagram/search"><span class="igx-ring igx-ring--add">' + IC.plus + '</span><small>Add</small></a>';
      var sb = el.querySelector('[data-story]'); if (sb) sb.onclick = function () { storyView(st); };
    };
    /* a post counts as seen once it has been on screen; unseen posts come first every time the feed opens */
    var sio = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
      var seen = ls('seenF') || {}, ch = 0;
      es.forEach(function (e) { if (e.isIntersecting) { var x = list[+e.target.getAttribute('data-i')]; if (x && !seen[x.id]) { seen[x.id] = Date.now(); ch = 1; } sio.unobserve(e.target); } });
      if (ch) { var k = Object.keys(seen); if (k.length > 1500) k.sort(function (a, b) { return seen[a] - seen[b]; }).slice(0, k.length - 1500).forEach(function (id) { delete seen[id]; }); ls('seenF', seen); }
    }, { threshold: 0.5 }) : null;
    var order = function (row) { var seen = ls('seenF') || {}; return row.slice().sort(function (a, b) { return (seen[a.id] ? 1 : 0) - (seen[b.id] ? 1 : 0) || new Date(b.timestamp) - new Date(a.timestamp); }); };
    var draw = function (r) {
      S.feedAll = r.items || []; S.feedR = r; rr = rounds(S.feedAll).map(order); round = 0; list = (rr[0] || []).slice(); shown = 0; S.feed = list; S.following = r.following || [];
      tray(S.following, r);
      fc.innerHTML = (list.length ? '<div id="igFl"></div><div class="igx-sent" id="igFs2"></div>' : '<p class="igx-empty">No posts yet.</p>') +
        '<div id="igFe" hidden><div class="igx-done"><span>' + IC.check + '</span><b>You’re all caught up</b><small>You’ve seen the newest post from every account.</small>' + (rr.length > 1 ? '<button class="igx-link" id="igOlder">See earlier posts</button>' : '') + '</div></div>';
      more();
      if (io) io.disconnect();
      var sent = fc.querySelector('#igFs2');
      if (sent && 'IntersectionObserver' in window) { io = new IntersectionObserver(function (es) { if (es[0].isIntersecting && shown < list.length) more(); }, { rootMargin: '1400px 0px' }); io.observe(sent); }
      else while (shown < list.length) more();
      var older = fc.querySelector('#igOlder');
      if (older) older.onclick = function () { round++; var nx = rr[round] || []; list = list.concat(nx); S.feed = list; if (round >= rr.length - 1) older.remove(); else older.textContent = 'See even earlier posts'; fc.querySelector('#igFe').hidden = true; more(); };
      side(el.querySelector('#igFs'));
    };
    var key = function (r) { return JSON.stringify(((r && r.items) || []).slice(0, 30).map(function (x) { return x.id; })); };
    var cf = ls('cfeed'); if (cf && cf.items && cf.items.length) draw(cf);
    var save = function (r) { try { ls('cfeed', { items: r.items.slice(0, 80), following: r.following, stories: r.stories, me: r.me }); } catch (e) { /* phone storage full */ } };
    /* while the page is open: look for new posts every 3 minutes (from the saved feed, so it costs Instagram nothing) */
    var newPill = function (r) {
      var have = {}; list.forEach(function (x) { have[x.id] = 1; });
      var n = (r.items || []).filter(function (x) { return !have[x.id]; }).length; if (!n) return;
      var p0 = el.querySelector('.igx-newp'); if (p0) p0.remove();
      var pb = document.createElement('button'); pb.className = 'igx-newp'; pb.innerHTML = IC.up + '<span>New posts</span>'; el.querySelector('.igx-fc').appendChild(pb);
      pb.onclick = function () { pb.remove(); draw(r); var sc = document.querySelector('.a-app'); if (sc) sc.scrollTo({ top: 0, behavior: 'smooth' }); window.scrollTo({ top: 0, behavior: 'smooth' }); };
    };
    var pull = S.pull; S.pull = 0;
    api('feed', undefined, pull ? 'pull=1' : '').then(function (r) {
      save(r);
      if (!document.body.contains(fc)) return;
      if (!cf || !cf.items || key(cf) !== key(r) || pull) { if (shown <= 2 || pull) draw(r); else newPill(r); }
      else { S.feedAll = r.items; tray(S.following, r); }
    }).catch(function () { if (!cf) fc.innerHTML = '<p class="igx-empty">The feed is taking a break. Come back in a minute.</p>'; });
    var poll = setInterval(function () { if (!document.body.contains(fc)) return clearInterval(poll); if (document.hidden) return; api('feed').then(function (r) { save(r); if (key({ items: S.feedAll }) !== key(r)) newPill(r); }).catch(function () { }); }, 180000);
  }
  /* ---------- videos: one shared player moves to whichever video is on screen. Sound is on (until you mute it);
     a phone only allows sound after a first tap, so until then it plays quietly and the first tap anywhere turns it on ---------- */
  if (S.sound == null) S.sound = ls('sound') !== 0;
  var PV = null, PRE = null, VIO = null;
  function pv() {
    if (PV) return PV;
    PV = document.createElement('video'); PV.className = 'igx-pv'; PV.setAttribute('playsinline', ''); PV.setAttribute('webkit-playsinline', ''); PV.playsInline = true; PV.loop = true; PV.preload = 'auto';
    var host = function () { return PV.parentNode; };
    PV.addEventListener('waiting', function () { if (host()) host().classList.add('is-buf'); });
    PV.addEventListener('playing', function () { if (host()) { host().classList.remove('is-buf'); host().classList.add('is-play'); } });
    PV.addEventListener('loadedmetadata', function () { var m = host() && host().closest('.igx-pm'); if (m && PV.videoWidth) m.style.aspectRatio = String(Math.max(0.8, Math.min(1.91, PV.videoWidth / PV.videoHeight))); });
    return PV;
  }
  /* the first tap or touch anywhere lets the sound play (sound buttons and reels handle their own taps) */
  ['pointerdown', 'touchend', 'click', 'keydown'].forEach(function (ev) {
    document.addEventListener(ev, function (e) {
      if (!PV || !S.locked || (e.target && e.target.closest && e.target.closest('[data-snd], .igr-i'))) return;
      if (S.sound && PV.muted && PV.getAttribute('src')) { PV.muted = false; var pr = PV.play(); if (pr && pr.catch) pr.catch(function () { PV.muted = true; }); }
      S.locked = 0; paintSound();
    }, { capture: true, passive: true });
  });
  function attachPV(host, src, poster) {
    var v = pv();
    if (v.parentNode !== host) { if (v.parentNode) v.parentNode.classList.remove('is-play', 'is-buf'); v.pause(); host.appendChild(v); }
    if (v.getAttribute('src') !== src) { host.classList.remove('is-play'); host.classList.add('is-buf'); v.setAttribute('src', src); if (poster) v.poster = poster; else v.removeAttribute('poster'); }
    v.muted = !S.sound;
    var pr = v.play();
    if (pr && pr.catch) pr.catch(function () { if (!v.muted) { v.muted = true; S.locked = 1; paintSound(); v.play().catch(function () { }); } });
  }
  function detachPV(host) { if (PV && PV.parentNode === host) PV.pause(); }
  function preload(src) { if (!src) return; if (!PRE) { PRE = document.createElement('video'); PRE.muted = true; PRE.preload = 'auto'; PRE.setAttribute('playsinline', ''); } if (PRE.getAttribute('src') !== src) { PRE.setAttribute('src', src); try { PRE.load(); } catch (e) { /* ignore */ } } }
  function vio() {
    if (VIO || !('IntersectionObserver' in window)) return VIO;
    VIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) { var h = e.target; if (RL) return; if (e.isIntersecting) attachPV(h, h.getAttribute('data-vsrc'), h.getAttribute('data-vposter')); else detachPV(h); });
    }, { threshold: 0.6 });
    return VIO;
  }
  /* after closing the reels: carry on with the video that's on screen */
  function resumeFeed() {
    var best = null;
    document.querySelectorAll('.igx-post .igx-vs').forEach(function (h) { var r = h.getBoundingClientRect(), vis = Math.min(r.bottom, innerHeight) - Math.max(r.top, 0); if (r.height && vis / r.height >= 0.6 && !best) best = h; });
    if (best) attachPV(best, best.getAttribute('data-vsrc'), best.getAttribute('data-vposter')); else if (PV) PV.pause();
  }
  function playV(v) { if (v === PV) { v.muted = !S.sound; v.play().catch(function () { v.muted = true; v.play().catch(function () { }); }); } }
  function soundOn() { return S.sound && !S.locked; }
  function paintSound() { document.querySelectorAll('[data-snd]').forEach(function (b) { b.innerHTML = soundOn() ? IC.sound : IC.mute; b.title = soundOn() ? 'Sound on' : 'Tap for sound'; }); }
  function setSound(on) {
    S.sound = on; S.locked = 0; ls('sound', on ? 1 : 0);
    if (PV) { PV.muted = !on; if (on && PV.paused && PV.getAttribute('src')) PV.play().catch(function () { }); }
    paintSound();
  }
  /* a post card's buttons (feed, profile list) */
  function wirePost(p, list, o) {
    var i = +p.getAttribute('data-i'), x = list[i];
    o = Object.assign({}, o, { own: !!(x.owner && x.owner.me) });
    var m = p.querySelector('.igv-m');
    carousel(m);
    p.querySelector('[data-like]').onclick = function () { toggleLike(x, this); };
    var last = 0;
    m.addEventListener('click', function (e) {
      if (e.target.closest('[data-snd], .igv-cl, .igv-cr')) return;
      var now = Date.now();
      if (now - last < 300) { last = 0; clearTimeout(m._t); if (!liked(x.id)) toggleLike(x, p.querySelector('[data-like]')); heartPop(m); return; }
      last = now;
      if (isVid(x)) m._t = setTimeout(function () { var rl = (o.feed ? (S.feedAll || []) : list).filter(isVid); if (rl.indexOf(x) < 0) rl.unshift(x); var seen = {}; rl = rl.filter(function (y) { var u = (y.owner && y.owner.username) || ''; if (y !== x && seen[u]) return false; seen[u] = 1; return true; }); reels(rl, rl.indexOf(x), o); }, 300);
    });
    p.querySelectorAll('[data-open]').forEach(function (b) { b.onclick = function () { viewer(list, i, o); }; });
    p.querySelector('[data-share]').onclick = function () { shareSheet(x); };
    var dm = p.querySelector('[data-dots]'); if (dm) dm.onclick = function () { postMenu(x, o.own); };
    var mo = p.querySelector('[data-more]'); if (mo) mo.onclick = function () { mo.parentNode.innerHTML = rich(x.caption); };
    p.querySelectorAll('[data-snd]').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); setSound(!soundOn()); }; });
    /* the frame takes the picture's own shape, like Instagram (from tall 4:5 to wide 1.91:1) */
    var shape = function (w, h) { if (!w || !h) return; var r = Math.max(0.8, Math.min(1.91, w / h)); m.style.aspectRatio = String(r); };
    var first = m.querySelector('.igv-sl img, .igv-sl video');
    if (first) { if (first.tagName === 'IMG') { if (first.complete && first.naturalWidth) shape(first.naturalWidth, first.naturalHeight); else first.addEventListener('load', function () { shape(first.naturalWidth, first.naturalHeight); }, { once: true }); } else first.addEventListener('loadedmetadata', function () { shape(first.videoWidth, first.videoHeight); }, { once: true }); }
    p.querySelectorAll('.igx-vs').forEach(function (h) { if (vio()) VIO.observe(h); });
    /* a picture Instagram won't load shows a grey frame, never a black box */
    p.querySelectorAll('.igx-pm img').forEach(function (im) { im.addEventListener('error', function () { var sp = document.createElement('span'); sp.className = 'igx-noimg'; sp.innerHTML = IC.img; im.replaceWith(sp); }, { once: true }); });
  }
  /* ---------- share a post or reel to a chat room (or copy its link) ---------- */
  function shareSheet(x) {
    var ow = x.owner || {}, th = thumb(x), link = x.permalink || '';
    var m = H.modal('<div class="igx-share"><div class="igx-shh"><b>Share</b></div>' +
      '<div class="igx-shp">' + (th ? '<img src="' + esc(th) + '" alt="" referrerpolicy="no-referrer">' : '') + '<span><b>' + esc(ow.username || '') + '</b><small>' + esc(String(x.caption || '').slice(0, 90)) + '</small></span></div>' +
      '<div class="igx-shl">' +
      '<button data-a="copy">' + av(null, 'Link') + '<span><b>Copy link</b><small>Paste it anywhere</small></span><em>Copy</em></button>' +
      '<button data-a="wa">' + av(null, 'WhatsApp') + '<span><b>WhatsApp</b><small>Send it to a chat</small></span><em>Send</em></button>' +
      '<button data-a="mail">' + av(null, 'Email') + '<span><b>Email</b><small>Send it from your mail app</small></span><em>Send</em></button>' +
      '</div>' + (navigator.share ? '<div class="igx-sha"><button data-a="os">' + IC.ext + '<span>More…</span></button></div>' : '') + '</div>');
    m.classList.add('igx-menum');
    var text = '@' + (ow.username || '') + ' on Instagram: ' + link;
    m.querySelector('[data-a="copy"]').onclick = function () { if (link && navigator.clipboard) navigator.clipboard.writeText(link).then(function () { H.toast('Link copied', 'ok'); }); m.remove(); };
    m.querySelector('[data-a="wa"]').onclick = function () { window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener'); m.remove(); };
    m.querySelector('[data-a="mail"]').onclick = function () { location.href = 'mailto:?subject=' + encodeURIComponent('@' + (ow.username || '') + ' on Instagram') + '&body=' + encodeURIComponent(text); m.remove(); };
    var os = m.querySelector('[data-a="os"]'); if (os) os.onclick = function () { navigator.share({ url: link, title: '@' + (ow.username || '') + ' on Instagram' }).catch(function () { }); };
  }
  /* ---------- Reels tab: each account once first (ones you haven't watched first), then the rest ---------- */
  function openReelsTab() {
    var start = function (items) {
      var seen = ls('seenF') || {};
      var all = items.filter(function (x) { return isVid(x); }).sort(function (a, b) { return (seen[a.id] ? 1 : 0) - (seen[b.id] ? 1 : 0) || new Date(b.timestamp) - new Date(a.timestamp); });
      var one = {}, out = [];
      all.forEach(function (x) { var u = (x.owner || {}).username; if (!one[u]) { one[u] = 1; out.push(x); } });
      all.forEach(function (x) { if (out.indexOf(x) < 0) out.push(x); });
      if (!out.length) return H.toast('No reels right now. Check back soon.');
      reels(out, 0, { own: false, from: 'tab' });
    };
    if (S.feedAll && S.feedAll.length) return start(S.feedAll);
    var cf = ls('cfeed'); if (cf && cf.items && cf.items.length) return start(cf.items);
    api('feed').then(function (r) { S.feedAll = r.items; start(r.items); }).catch(function () { H.toast('Reels are taking a break. Try again in a minute.'); });
  }
  /* ---------- the club's own stories (Instagram only shares our own) ---------- */
  function storyView(list) {
    if (!list || !list.length) return;
    var i = 0, t = null, el = document.createElement('div'); el.className = 'igs'; document.body.appendChild(el); document.body.classList.add('igr-on');
    var key = function (e) { if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); };
    var close = function () { clearTimeout(t); el.remove(); document.body.classList.remove('igr-on'); document.removeEventListener('keydown', key); };
    document.addEventListener('keydown', key);
    var step = function (d) { i += d; if (i < 0) i = 0; if (i >= list.length) return close(); draw(); };
    var draw = function () {
      clearTimeout(t); var x = list[i], me = (S.st && S.st.account) || {};
      el.innerHTML = '<div class="igs-bars">' + list.map(function (_, k) { return '<i class="' + (k < i ? 'is-done' : '') + '"><b></b></i>'; }).join('') + '</div>' +
        '<div class="igs-h">' + av(me.picture, me.username) + '<b>' + esc(me.username || '') + '</b><span>' + ago(x.timestamp) + '</span><span class="igx-sp"></span><button class="igs-x" aria-label="Close">' + IC.x + '</button></div>' +
        (x.media_type === 'VIDEO' && x.media_url ? '<video src="' + esc(x.media_url) + '" playsinline autoplay></video>' : '<img src="' + esc(x.media_url || x.thumbnail_url || '') + '" alt="" referrerpolicy="no-referrer">') +
        '<button class="igs-l" aria-label="Previous"></button><button class="igs-r" aria-label="Next"></button>';
      el.querySelector('.igs-x').onclick = close; el.querySelector('.igs-l').onclick = function () { step(-1); }; el.querySelector('.igs-r').onclick = function () { step(1); };
      var v = el.querySelector('video'), bar = el.querySelectorAll('.igs-bars i')[i].querySelector('b');
      if (v) { v.muted = !S.sound; v.play().catch(function () { v.muted = true; v.play().catch(function () { }); }); v.onended = function () { step(1); }; v.ontimeupdate = function () { if (v.duration) bar.style.width = (100 * v.currentTime / v.duration) + '%'; }; }
      else { requestAnimationFrame(function () { requestAnimationFrame(function () { bar.style.transition = 'width 5s linear'; bar.style.width = '100%'; }); }); t = setTimeout(function () { step(1); }, 5000); }
    };
    draw();
  }
  /* ---------- a profile's posts as a scrolling list (a phone, like Instagram) ---------- */
  var PLIST = null;   /* (PL is the planner's data) */
  function closeList() { if (PLIST) { PLIST.remove(); PLIST = null; document.body.classList.remove('igl-on'); } }
  function postList(list, i, o) {
    closeList(); closeViewer();
    var who = (list[i] && list[i].owner && list[i].owner.username) || '';
    var el = document.createElement('div'); el.className = 'igl'; PLIST = el; document.body.classList.add('igl-on');
    el.innerHTML = '<div class="igl-h"><button class="igl-b" aria-label="Back">' + IC.l + '</button><div><small>' + esc(who) + '</small><b>Posts</b></div></div><div class="igl-s">' + list.map(function (x, k) { return post(x, k, Math.abs(k - i) > 2); }).join('') + '<div class="igl-end"></div></div>';
    document.body.appendChild(el);
    el.querySelectorAll('.igx-post').forEach(function (p) { wirePost(p, list, o); });
    el.querySelector('.igl-b').onclick = closeList;
    el.querySelectorAll('a[href^="#instagram"]').forEach(function (a) { a.addEventListener('click', closeList); });
    var t = el.querySelector('.igx-post[data-i="' + i + '"]'); if (t) el.querySelector('.igl-s').scrollTop = t.offsetTop - 56;
  }
  /* ---------- reels: full screen, swipe up for the next one, tap for sound, double tap to like ---------- */
  var RL = null;
  function closeReels() { if (RL) { if (PV) { PV.pause(); if (PV.parentNode) PV.parentNode.classList.remove('is-play', 'is-buf'); document.body.appendChild(PV); PV.style.display = 'none'; } RL.el.remove(); document.removeEventListener('keydown', RL.key); if (RL.io) RL.io.disconnect(); RL = null; document.body.classList.remove('igr-on'); setTimeout(function () { if (PV) PV.style.display = ''; resumeFeed(); }, 60); } }
  function reels(list, i, o) {
    if (!list.length) return;
    closeReels(); i = Math.max(0, i || 0);
    if (PV) PV.pause();
    var el = document.createElement('div'); el.className = 'igr'; document.body.classList.add('igr-on');
    el.innerHTML = '<div class="igr-top"><button class="igr-x" aria-label="Back">' + IC.l + '</button><b>Reels</b></div><div class="igr-s">' + list.map(function (x, k) {
      var ow = x.owner || {}, cap = String(x.caption || '');
      return '<section class="igr-i" data-k="' + k + '">' + (x.thumbnail_url ? '<img class="igr-p" src="' + esc(x.thumbnail_url) + '" alt="" referrerpolicy="no-referrer"' + (Math.abs(k - i) > 2 ? ' loading="lazy"' : '') + '>' : '') +
        '<span class="igr-snd" data-snd></span>' +
        '<div class="igr-r"><button data-rl class="' + (liked(x.id) ? 'is-on' : '') + '">' + (liked(x.id) ? IC.heartOn : IC.heart) + '<small data-lk2>' + num(x.like_count || 0) + '</small></button>' +
        '<button data-rc>' + IC.msg + '<small>' + num(x.comments_count || 0) + '</small></button><button data-rs>' + IC.send + '</button><button data-rd>' + IC.dots + '</button></div>' +
        '<div class="igr-o"><a class="igr-u" href="' + (ow.me ? '#instagram/profile' : '#instagram/u/' + encodeURIComponent(ow.username || '')) + '">' + av(ow.picture, ow.username) + '<b>' + esc(ow.username || '') + '</b></a>' + (cap ? '<p class="igr-c">' + esc(cap.length > 90 ? cap.slice(0, 90) + '…' : cap) + '</p>' : '') + '</div></section>';
    }).join('') + '</div>';
    document.body.appendChild(el);
    var sc = el.querySelector('.igr-s');
    RL = { el: el, list: list };
    RL.key = function (e) { if (e.key === 'Escape') closeReels(); if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); sc.scrollBy({ top: (e.key === 'ArrowDown' ? 1 : -1) * sc.clientHeight, behavior: 'smooth' }); } };
    document.addEventListener('keydown', RL.key);
    el.querySelector('.igr-x').onclick = closeReels;
    el.querySelectorAll('a[href^="#instagram"]').forEach(function (a) { a.addEventListener('click', closeReels); });
    var play = function (k) { var sx = el.querySelector('.igr-i[data-k="' + k + '"]'); if (!sx) return; attachPV(sx, vidUrl(list[k]), list[k].thumbnail_url); preload(list[k + 1] && vidUrl(list[k + 1])); };
    el.querySelectorAll('.igr-i').forEach(function (s) {
      var k = +s.getAttribute('data-k'), x = list[k], last = 0;
      var v = { pause: function () { if (PV && PV.parentNode === s) PV.pause(); } };
      s.addEventListener('click', function (e) {
        if (e.target.closest('.igr-r, .igr-o')) return;
        if (s._skip) { s._skip = 0; return; }   /* the end of a press-and-hold pause */
        if (!soundOn()) { clearTimeout(s._t); last = 0; setSound(true); if (PV && PV.parentNode === s && PV.paused) playV(PV); flash(s); return; }   /* turning sound on happens right away (phones need it inside the tap) */
        var now = Date.now();
        if (now - last < 300) { last = 0; clearTimeout(s._t); if (!liked(x.id)) { toggleLike(x, null); paintLike(); } heartPop(s); return; }
        last = now; s._t = setTimeout(function () { setSound(!soundOn()); if (PV && PV.parentNode === s && PV.paused) playV(PV); flash(s); }, 260);
      });
      var hold = null;
      s.addEventListener('pointerdown', function (e) { if (e.target.closest('.igr-r, .igr-o')) return; hold = setTimeout(function () { v.pause(); s.classList.add('is-held'); }, 350); });
      var up = function () { clearTimeout(hold); if (s.classList.contains('is-held')) { s.classList.remove('is-held'); if (PV && PV.parentNode === s) playV(PV); last = 0; clearTimeout(s._t); s._skip = 1; } };
      s.addEventListener('pointerup', up); s.addEventListener('pointercancel', up);
      var lb = s.querySelector('[data-rl]');
      var paintLike = function () { lb.classList.toggle('is-on', liked(x.id)); lb.innerHTML = (liked(x.id) ? IC.heartOn : IC.heart) + '<small data-lk2>' + num(x.like_count || 0) + '</small>'; };
      lb.onclick = function () { toggleLike(x, null); paintLike(); if (liked(x.id)) { lb.classList.add('is-pop'); setTimeout(function () { lb.classList.remove('is-pop'); }, 400); } };
      s.querySelector('[data-rc]').onclick = function () { v.pause(); viewer(list, k, Object.assign({}, o, { own: !!(x.owner && x.owner.me) })); };
      s.querySelector('[data-rs]').onclick = function () { shareSheet(x); };
      s.querySelector('[data-rd]').onclick = function () { postMenu(x, !!(x.owner && x.owner.me)); };
    });
    var flash = function (s) { var f = document.createElement('span'); f.className = 'igr-fl'; f.innerHTML = soundOn() ? IC.sound : IC.mute; s.appendChild(f); setTimeout(function () { f.remove(); }, 700); };
    RL.io = new IntersectionObserver(function (es) { es.forEach(function (e) { var s = e.target; if (e.isIntersecting) play(+s.getAttribute('data-k')); else if (PV && PV.parentNode === s) PV.pause(); }); }, { root: sc, threshold: 0.65 });
    el.querySelectorAll('.igr-i').forEach(function (s) { RL.io.observe(s); });
    play(i); paintSound();   /* opened by a tap, so the sound can start straight away */
    sc.scrollTop = i * sc.clientHeight;
  }
  function post(x, i, lazy) {
    var o = x.owner || {}, cap = x.caption || '', short = cap.length > 125 ? cap.slice(0, 125) : null;
    var media = slides(x, true);
    if (lazy) media = media.replace(/<img /g, '<img loading="lazy" decoding="async" ');
    else media = media.replace(/<img /g, '<img fetchpriority="high" decoding="async" ');
    media = media.replace(/<video src="([^"]*)"([^>]*?) controls([^>]*)>/g, '<video data-src="$1"$2$3 muted>').replace(/preload="metadata"/g, 'preload="none"');
    var hasV = /igx-vs/.test(media);
    return '<article class="igx-post" data-i="' + i + '"><header>' + '<span class="igx-ring igx-ring--s">' + av(o.picture, o.username) + '</span><a href="' + (o.me ? '#instagram/profile' : '#instagram/u/' + encodeURIComponent(o.username || '')) + '"><b>' + esc(o.username || '') + '</b></a><span class="igx-faint">• ' + ago(x.timestamp) + '</span><span class="igx-sp"></span><button class="igv-ic" data-dots title="More">' + IC.dots + '</button></header>' +
      '<div class="igv-m igx-pm">' + media + (hasV ? '<button class="igx-mute" data-snd title="Sound">' + (soundOn() ? IC.sound : IC.mute) + '</button>' : '') + '</div>' +
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
    el.querySelectorAll('[data-go]').forEach(function (b) { b.onclick = function () { igGo(b.getAttribute('data-go')); }; });
  }

  /* ---------- search + other accounts ---------- */
  function search(el) {
    var recent = ls('recent') || [];
    el.innerHTML = '<div class="igx-sec igx-search"><h2>Search</h2><form id="igSf" class="igx-sbar">' + IC.search + '<input id="igSq" placeholder="Search a username, e.g. natgeo" autocomplete="off" autocapitalize="off" spellcheck="false"></form>' +
      '<p class="igx-sub">Look up any business or creator account to see their posts, like them, and add them to your feed. Instagram doesn’t share personal accounts with apps.</p><div id="igSl"><div class="igx-load igx-load--s"><i></i></div></div>' +
      (recent.length ? '<div class="igx-fsh"><b>Recent</b><button class="igx-link" id="igClr">Clear all</button></div><div>' + recent.map(function (u) { return '<a class="igx-acc" href="#instagram/u/' + encodeURIComponent(u) + '">' + av(null, u) + '<span><b>' + esc(u) + '</b></span></a>'; }).join('') + '</div>' : '') + '</div>';
    var q = el.querySelector('#igSq'); q.focus();
    el.querySelector('#igSf').onsubmit = function (e) { e.preventDefault(); var u = q.value.trim().replace(/^@/, '').toLowerCase(); if (u) igGo('u/' + encodeURIComponent(u)); };
    var c = el.querySelector('#igClr'); if (c) c.onclick = function () { ls('recent', []); search(el); };
    el.querySelector('#igSf').insertAdjacentHTML('afterend', '<details class="igx-many"><summary>Add several accounts at once</summary><p class="igx-sub">Paste usernames or Instagram links (for example the accounts the club follows), one per line or with commas. Their posts show up in the feed over the next few hours.</p><textarea id="igMany" rows="4" placeholder="crazy_kennar, zachking&#10;https://instagram.com/natgeo"></textarea><button class="igx-btn igx-btn--b" id="igManyB">Add to feed</button></details>');
    el.querySelector('#igManyB').onclick = function () { var t = el.querySelector('#igMany'), bt = this; if (!t.value.trim()) return; bt.disabled = true; api('follow-many', { usernames: t.value }).then(function (r) { H.toast(r.added ? r.added + ' account' + (r.added > 1 ? 's' : '') + ' added. Their posts arrive over the next few hours.' : 'They’re all in your feed already.', 'ok'); search(el); }, function (e) { bt.disabled = false; H.toast(e.message, 'err'); }); };
    api('following').then(function (r) {
      S.following = r.list;
      el.querySelector('#igSl').innerHTML = r.list.length ? '<div class="igx-fsh"><b>In your feed</b></div>' + r.list.map(function (f) { return '<div class="igx-acc"><a href="#instagram/u/' + encodeURIComponent(f.username) + '">' + av(f.picture, f.username) + '<span><b>' + esc(f.username) + '</b><small>' + esc(f.name || '') + '</small></span></a><button class="igv-ic" data-rm="' + esc(f.username) + '" title="Remove from feed">' + IC.x + '</button></div>'; }).join('') : '';
      el.querySelectorAll('[data-rm]').forEach(function (b) { b.onclick = function () { api('follow', { username: b.getAttribute('data-rm'), on: false }).then(function () { search(el); }); }; });
    }).catch(function () { el.querySelector('#igSl').innerHTML = ''; });
  }
  function userPage(el) {
    var u = S.user;
    el.innerHTML = '<div id="igPh">' + headSkel() + '</div><div class="igx-tabs"><button class="is-on">' + IC.grid + '<span>Posts</span></button></div><div id="igPg">' + gridSkel() + '</div>';
    var list = [], after = null;
    api('discover', undefined, 'u=' + encodeURIComponent(u)).then(function (r) {
      var p = r.profile, me = p.username === S.st.account.username;
      var rec = (ls('recent') || []).filter(function (x) { return x !== p.username; }); rec.unshift(p.username); ls('recent', rec.slice(0, 8));
      var inFeed = (S.following || []).some(function (f) { return f.username === p.username; });
      var ph = el.querySelector('#igPh');
      var paint = function () {
        ph.innerHTML = header(p, { actions: me ? '<a class="igx-btn" href="#instagram/profile">Your profile</a>' : '<button class="igx-btn ' + (inFeed ? '' : 'igx-btn--b') + '" id="igFol">' + (inFeed ? 'In your feed ' + IC.check : 'Add to feed') + '</button><a class="igx-btn" href="https://www.instagram.com/' + encodeURIComponent(p.username) + '/" target="_blank" rel="noopener">Open on Instagram</a>' });
        var f = ph.querySelector('#igFol'); if (f) f.onclick = function () { f.disabled = true; api('follow', { username: p.username, on: !inFeed, name: p.name, picture: p.profile_picture_url }).then(function (rr) { S.following = rr.list; inFeed = !inFeed; H.toast(inFeed ? '@' + p.username + ' added to your feed' : 'Removed from your feed', 'ok'); paint(); }, function (e) { f.disabled = false; H.toast(e.message, 'err'); }); };
      };
      if (!S.following) api('following').then(function (rr) { S.following = rr.list; inFeed = rr.list.some(function (f) { return f.username === p.username; }); paint(); }).catch(function () { });
      paint();
      S.uOwner = { username: p.username, picture: p.profile_picture_url || '' }; list = r.items; after = r.after; draw();
    }).catch(function (e) {
      /* Instagram asked for a break: show this account's posts we already have from the feed */
      var have = (S.feedAll || ls('cfeed') && ls('cfeed').items || []).filter(function (x) { return x.owner && x.owner.username === u; });
      var f0 = (S.following || []).filter(function (f) { return f.username === u; })[0] || {};
      if (have.length) {
        el.innerHTML = '<div class="igx-ph"><div class="igx-pi">' + av(f0.picture || (have[0].owner || {}).picture, u, 'igx-av--xl') + '<div><h2>' + esc(u) + '</h2><small class="igx-faint">' + esc(f0.name || '') + '</small></div></div></div><div id="igPg"></div>';
        var g = el.querySelector('#igPg'); g.innerHTML = grid(have); bindGrid(g, have, { own: false, owner: { username: u, picture: f0.picture || '' } });
        return;
      }
      el.innerHTML = '<div class="igx-empty"><span class="igx-ei">' + IC.search + '</span><h3>@' + esc(u) + '</h3><p>' + esc(e.status === 429 || /break|limit/i.test(e.message) ? 'Instagram needs a short break. This profile will show in a few minutes.' : e.message) + '</p><a class="igx-link" href="#instagram/search">Back to search</a></div>';
    });
    function draw() {
      var g = el.querySelector('#igPg');
      if (!list.length) { g.innerHTML = emptyState(IC.img, 'No posts yet', ''); return; }
      g.innerHTML = grid(list) + (after ? '<div class="igx-more"><button class="igx-btn" id="igLm">Load more</button></div>' : '');
      bindGrid(g, list, { own: false, owner: S.uOwner });
      var lm = g.querySelector('#igLm'); if (lm) lm.onclick = function () { lm.textContent = 'Loading…'; lm.disabled = true; api('discover', undefined, 'u=' + encodeURIComponent(u) + '&after=' + encodeURIComponent(after)).then(function (r) { list = list.concat(r.items); after = r.after; draw(); }); };
    }
  }

  /* ---------- notifications ---------- */
  function activity(el) {
    el.innerHTML = '<div class="igx-sec igx-act"><div class="igx-sech"><h2>Notifications</h2><button class="igx-btn" id="igChk">Check now</button></div><div id="igAl"><div class="igx-load"><i></i></div></div>' +
      '<p class="igx-note">Checked every few minutes while the app is open and every 30 minutes otherwise; new ones also come to the bell and your phone. Instagram shares how many people liked a post, not who.</p></div>';
    var load = function (force) {
      api('watch', undefined, force ? 'force=1' : '').then(function (r) { if (r.items) S.watch = r.items; draw(); ls('seenA', Date.now()); dots(); }).catch(function (e) { el.querySelector('#igAl').innerHTML = '<p class="igx-empty">' + esc(e.message) + '</p>'; });
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
    api('media-one', undefined, 'id=' + encodeURIComponent(id)).then(function (r) { viewer([r.item], 0, { own: true }); }, function (e) { H.toast(e.message, 'err'); });
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
    api('convos').then(function (r) {
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
    api('thread', undefined, 'id=' + encodeURIComponent(id)).then(function (r) {
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
        api('send', { to: o.id, text: t, image: img || undefined }).then(function () { tx.value = ''; fit(); sb.disabled = false; loadThread(el, id, true); loadConvos(el, true); }, function (e) { H.toast(e.message, 'err'); sb.disabled = false; });
      };
      sb.onclick = function () { send(); };
      tx.onkeydown = function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
      th.querySelector('#igPic').onclick = function () { th.querySelector('#igPf').click(); };
      th.querySelector('#igPf').onchange = function () { var f = this.files[0]; this.value = ''; if (!f) return; H.toast('Sending photo…'); toJpeg(f, null).then(function (r2) { return upload(r2.file, r2.name, function () { }); }).then(function (p) { send(p.url); }, function (e) { H.toast(e.message, 'err'); }); };
      if (!quiet) tx.focus();
    }).catch(function (e) { if (!quiet) th.innerHTML = '<p class="igx-pad">' + esc(e.message) + '</p>'; });
  }

  /* ---------- insights ---------- */
  function stats(el) {
    el.innerHTML = '<div class="igx-load"><i></i></div>';
    Promise.all([S.prof ? Promise.resolve(S.prof) : api('profile'), api('insights', undefined, 'days=' + (S.days || 7)).catch(function () { return { stats: {} }; })]).then(function (r) {
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

  /* ---------- background check for new activity while the app is open ---------- */
  function bg() {
    if (document.hidden) return;
    api('watch').then(function (r) { if (r && r.items) { S.watch = r.items; dots(); } }).catch(function () { });
  }

  function connect(b, st) {
    st = st || S.st || {}; var body = b.querySelector('#igBody'), u = st.urls || {};
    body.innerHTML = '<div class="igk-card igq-connect"><div class="igk-card__b"><i class="igq-big">' + IC.ig + '</i><h2>Connect Instagram</h2>' +
      '<p class="igk-muted">Post and schedule photos, carousels, reels and stories for <b>@' + esc(((S.st && S.st.account) || {}).username || 'ciel_africa') + '</b>, answer messages and comments, and see your stats, all from here.</p>' +
      (!A.owner() ? '<p class="igq-warn">Instagram isn’t connected yet. You connect @' + esc(((S.st && S.st.account) || {}).username || 'ciel_africa') + ' here; then everyone with access can use this page.</p>' : st.configured ? '<button class="igk-b igk-b--p" id="igTok">Connect with an access token</button><p class="igk-faint">Make the token in Meta Business Settings → Users → System users → Generate token. @' + esc(((S.st && S.st.account) || {}).username || 'ciel_africa') + ' must be a <b>Business</b> or <b>Creator</b> account.</p>'
        : '<div class="igq-setup"><b>One step first</b><p>In Vercel (Project → Settings → Environment Variables) add <code>IG_APP_SECRET</code> = your App secret (your Meta app → App settings → Basic → App secret), then redeploy.</p></div>') +
      (st.storage ? '' : '<p class="igq-warn">File storage (Vercel Blob) isn’t connected, so photos and videos can’t be uploaded.</p>') +
      '<details class="igq-more igq-urls"><summary>Meta app settings (App settings → Basic)</summary>' + [['App domain', u.domain], ['Privacy policy URL', u.privacy], ['Terms of service URL', u.terms], ['User data deletion (instructions URL)', u.deletionPage], ['Data deletion callback URL', u.dataDeletion], ['Deauthorize callback URL', u.deauthorize]].map(function (r) { return '<div class="igq-url"><small>' + r[0] + '</small><code>' + esc(r[1] || '') + '</code><button class="igk-b igk-b--sm" data-cp="' + esc(r[1] || '') + '">Copy</button></div>'; }).join('') + '</details>' +
      '</div></div>';
    body.querySelector('.igk-card__b').insertAdjacentHTML('beforeend', '<p><a class="igk-b" href="#instagram/designs">' + IC.grid + '<span>See the ready designs</span></a></p>');
    var t = body.querySelector('#igTok'); if (t) t.onclick = tokenBox;
    body.querySelectorAll('[data-cp]').forEach(function (x) { x.onclick = function () { try { navigator.clipboard.writeText(x.getAttribute('data-cp')); H.toast('Copied', 'ok'); } catch (e) { H.toast('Couldn’t copy.', 'err'); } }; });
  }
  /* connect with a token made in Business Settings → System users → Generate token */
  function tokenBox() {
    var m = H.modal('<h2>Connect with an access token</h2>' +
      '<p class="igk-muted">In Meta Business Settings, open <b>Users → System users</b>, pick your system user (it needs your Instagram account assigned), click <b>Generate token</b>, choose this app, set it to never expire, tick these permissions, then copy the token and paste it here.</p><p class="igq-perms">' + (S.st && S.st.scopes ? S.st.scopes : []).map(function (x) { return '<code>' + esc(x) + '</code>'; }).join(' ') + '</p>' +
      '<label class="igk-field"><span>Access token</span><input type="password" id="igTk" autocomplete="off" spellcheck="false" placeholder="EAA…"></label>' +
      '<p class="igq-warn" id="igTkMsg" hidden></p>' +
      '<div class="igk-row"><span class="igq-sp"></span><button class="igk-b" data-x>Cancel</button><button class="igk-b igk-b--p" id="igTkGo">Connect</button></div>');
    var go = m.querySelector('#igTkGo'), msg = m.querySelector('#igTkMsg');
    go.onclick = function () {
      var v = m.querySelector('#igTk').value.trim(); if (!v) return;
      go.disabled = true; go.textContent = 'Connecting…'; msg.hidden = true;
      api('token', { token: v }).then(function (r) { m.remove(); H.toast('Connected @' + r.account.username, 'ok'); S.st = null; S.prof = null; S.media = null; render(''); })
        .catch(function (e) { msg.textContent = e.message; msg.hidden = false; go.disabled = false; go.textContent = 'Connect'; });
    };
  }


  /* ---------- when to post: best times and a safe pace ----------
     Best times: Buffer’s 2026 study of 9.6 million Instagram posts (in local time), or, once the account has
     20+ posts, the hours its own posts got the most likes and comments. Pace: 3–5 feed posts a week, 1–2 a day,
     at least 3 hours apart; accounts that post in bursts get flagged as spam. */
  var BEST = { 0: [21, 22, 20], 1: [19, 18, 20], 2: [19, 15, 17], 3: [12, 18, 8], 4: [9, 8, 7], 5: [22, 21, 6], 6: [21, 22, 20] };
  var DAYN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var isFeed = function (t) { return t !== 'story'; };
  var ownPosts = function () { return S.media || ((ls('cmedia') || {}).items) || []; };
  function ownHours() {
    var l = ownPosts(); if (l.length < 20) return null;
    var by = {}, all = 0;
    l.forEach(function (x) { var h = new Date(x.timestamp).getHours(), e = (+x.like_count || 0) + 2 * (+x.comments_count || 0); all += e; (by[h] = by[h] || []).push(e); });
    var avg = all / l.length || 1;
    var hs = Object.keys(by).filter(function (h) { return by[h].length >= 2; }).map(function (h) { return [+h, by[h].reduce(function (s, v) { return s + v; }, 0) / by[h].length / avg]; })
      .filter(function (x) { return x[1] > 1; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 3).map(function (x) { return x[0]; });
    return hs.length >= 2 ? hs : null;
  }
  /* every other post around: scheduled here, published from here, and what's already on the profile */
  function others(id) {
    var out = [];
    (S.posts || []).forEach(function (p) { if (p.id === id) return; if ((p.status === 'scheduled' || p.status === 'processing') && p.at) out.push({ at: p.at, feed: isFeed(p.type) }); else if (p.status === 'published' && p.publishedAt) out.push({ at: p.publishedAt, feed: isFeed(p.type) }); });
    ownPosts().forEach(function (x) { var t = new Date(x.timestamp).getTime(); if (!out.some(function (o) { return Math.abs(o.at - t) < 5 * 6e4; })) out.push({ at: t, feed: true }); });
    return out;
  }
  function dayKey(t) { var d = new Date(t); return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate(); }
  function paceNote(at, type, id) {
    if (!at) return '';
    var o = others(id).filter(function (x) { return x.feed === isFeed(type); }), same = o.filter(function (x) { return dayKey(x.at) === dayKey(at); }).length;
    if (!isFeed(type)) return same >= 5 ? 'That would be story number ' + (same + 1) + ' that day. 1–3 stories a day is plenty.' : '';
    var near = o.filter(function (x) { return Math.abs(x.at - at) < 3 * 3600e3; })[0];
    if (near) return 'Another post goes out close to this one (' + when(near.at) + '). Keep feed posts at least 3 hours apart so Instagram doesn’t treat the account as spam.';
    if (same >= 2) return 'That would be ' + (same + 1) + ' feed posts that day. Keep it to 1–2 a day; posting in bursts is what gets accounts flagged.';
    var week = o.filter(function (x) { return Math.abs(x.at - at) < 3.5 * 864e5; }).length;
    if (week >= 5) return 'That’s ' + (week + 1) + ' feed posts in a week. 3–5 a week is the sweet spot.';
    return '';
  }
  /* the next good times this week that don't clash with other posts (one per day) */
  function bestSlots(type, id, n) {
    var own = ownHours(), o = others(id).filter(function (x) { return x.feed === isFeed(type); }), out = [], soon = Date.now() + 30 * 6e4;
    for (var dd = 0; dd < 9 && out.length < (n || 4); dd++) {
      var day = new Date(); day.setDate(day.getDate() + dd);
      var hours = own || BEST[day.getDay()], busy = o.filter(function (x) { return dayKey(x.at) === dayKey(day.getTime()); }).length;
      if (isFeed(type) && busy >= 2) continue;
      for (var k = 0; k < hours.length; k++) {
        var t = new Date(day); t.setHours(hours[k], 0, 0, 0); var ts = t.getTime();
        if (ts < soon || o.some(function (x) { return Math.abs(x.at - ts) < 3 * 3600e3; })) continue;
        out.push(ts); break;
      }
    }
    return { slots: out, own: !!own };
  }
  function slotLabel(t) { var d = new Date(t), today = dayKey(Date.now()) === dayKey(t), tom = dayKey(Date.now() + 864e5) === dayKey(t); return (today ? 'Today' : tom ? 'Tomorrow' : DAYN[d.getDay()]) + ' ' + d.toLocaleTimeString('en-KE', { hour: 'numeric', minute: '2-digit' }); }

  /* ---------- the post editor ---------- */
  var RATIO = { photo: [0.8, 1.91], carousel: [0.8, 1.91], story: [0.5625, 0.5625], reel: [0.5625, 0.5625] };
  function editor(p) {
    var d = p ? JSON.parse(JSON.stringify(p)) : { type: 'photo', caption: '', media: [], altText: '', collaborators: [], shareToFeed: true, at: null, status: 'draft' };
    var isNew = !d.id;
    var m = H.modal('<div class="igq-ed"><div class="igq-edh"><h2>' + (isNew ? 'New post' : 'Edit post') + '</h2><button class="igk-b igk-b--sm igk-b--ghost" data-x>✕</button></div>' +
      '<div class="igq-edc"><div class="igq-edl">' +
      '<div class="igk-tabs igq-types">' + Object.keys(TYPE).map(function (k) { return '<button data-ty="' + k + '">' + TYPE[k][1] + '<span>' + TYPE[k][0] + '</span></button>'; }).join('') + '</div>' +
      '<div class="igq-media" id="igMd"></div><input type="file" id="igFile" hidden multiple accept="image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime">' +
      '<p class="igk-faint" id="igMHint"></p><button class="igk-b igk-b--sm igq-fromplan" id="igFromPlan">' + IC.cal + '<span>Choose from the planner</span></button></div>' +
      '<div class="igq-edr"><label class="igk-field" id="igCapF"><span>Caption <i id="igCnt"></i></span><textarea class="igk-hq-in" id="igCap" rows="7" maxlength="2200" placeholder="Write a caption… #hashtags and @mentions work as on Instagram"></textarea></label>' +
      '<details class="igq-more"><summary>More options</summary><label class="igk-field" id="igAltF"><span>Alt text (describes the photo for people who can’t see it)</span><input class="igk-hq-in" id="igAlt" maxlength="1000"></label>' +
      '<label class="igk-field" id="igColF"><span>Collaborators (up to 3 usernames)</span><input class="igk-hq-in" id="igCol" placeholder="@friend, @brand"></label>' +
      '<label class="igq-ck" id="igFeedF"><input type="checkbox" id="igFeed"> Also show the reel in the main feed</label></details>' +
      '<div class="igq-when"><label class="igk-field"><span>Post on</span><input class="igk-hq-in" type="datetime-local" id="igAt"></label><div class="igq-quick" id="igBest"></div><p class="igk-faint igq-bn" id="igBestN"></p><p class="igk-faint igq-bn is-warn" id="igPace" hidden></p></div>' +
      '<p class="igq-msg" id="igMsg"></p>' +
      '<div class="igq-acts">' + (!isNew && A.owner() ? '<button class="igk-b igk-b--ghost igq-danger" id="igDel">' + IC.del + '</button>' : '') + '<span class="igq-sp"></span><button class="igk-b" id="igDraft">Save draft</button><button class="igk-b" id="igSched">Schedule</button><button class="igk-b igk-b--p" id="igNow">Post now</button></div>' +
      '</div></div></div>');
    m.classList.add('igq-modal');
    var $ = function (s) { return m.querySelector(s); };
    $('#igCap').value = d.caption || ''; $('#igAlt').value = d.altText || ''; $('#igCol').value = (d.collaborators || []).map(function (c) { return '@' + c; }).join(', '); $('#igFeed').checked = d.shareToFeed !== false;
    if (d.at) $('#igAt').value = localInput(d.at);
    $('#igAt').min = localInput(Date.now());
    function msg(t, err) { var e = $('#igMsg'); e.textContent = t || ''; e.classList.toggle('is-err', !!err); }
    function type(t) {
      d.type = t; m.querySelectorAll('[data-ty]').forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-ty') === t); });
      $('#igCapF').hidden = t === 'story'; $('#igAltF').hidden = t !== 'photo'; $('#igColF').hidden = t === 'story'; $('#igFeedF').hidden = t !== 'reel';
      $('#igMHint').textContent = { photo: 'One photo. Best shape: square or 4:5 portrait (1080 × 1350).', carousel: '2 to 10 photos or videos. They all show in the first one’s shape, so keep them the same shape.', reel: 'One video, 3 seconds to 15 minutes, upright 9:16 (1080 × 1920), MP4 or MOV.', story: 'One photo or video, upright 9:16 (1080 × 1920). Videos up to 60 seconds.' }[t];
      draw(); count(); if ($('#igBest')) best();
    }
    function count() { var c = $('#igCap').value, tags = (c.match(/#[\p{L}\p{N}_]+/gu) || []).length; $('#igCnt').textContent = c.length + ' / 2200' + (tags ? ' · ' + tags + ' hashtag' + (tags > 1 ? 's' : '') + (tags > 30 ? ' (30 max)' : '') : ''); }
    function draw() {
      var max = d.type === 'carousel' ? 10 : 1;
      $('#igMd').innerHTML = d.media.map(function (x, i) {
        return '<div class="igq-mi" data-i="' + i + '">' + (x.kind === 'video' ? '<video src="' + esc(x.url) + '#t=0.5" muted playsinline preload="metadata"></video><em>' + IC.play + '</em>' : '<img src="' + esc(x.plan ? planThumb(x.url) : x.url) + '" alt="">') +
          (x.up ? '<span class="igq-up">' + esc(x.up) + '</span>' : '') +
          '<span class="igq-mb">' + (d.media.length > 1 && i ? '<button data-mv="' + i + '" title="Move left">' + IC.l + '</button>' : '') + '<button data-rm="' + i + '" title="Remove">✕</button></span></div>';
      }).join('') + (d.media.length < max ? '<button class="igq-add" id="igAdd">' + IC.img + '<span>' + (d.media.length ? 'Add more' : 'Add ' + (d.type === 'reel' ? 'a video' : d.type === 'carousel' ? 'photos or videos' : d.type === 'story' ? 'a photo or video' : 'a photo')) + '</span></button>' : '');
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
        return upload(r.file, r.name, function (pc) { item.up = 'Uploading ' + pc + '%'; var u = m.querySelector('.igq-mi[data-i="' + d.media.indexOf(item) + '"] .igq-up'); if (u) u.textContent = item.up; });
      }).then(function (f) { item.path = f.path; if (f.url) item.url = f.url; item.up = ''; draw(); }).catch(function (e) { d.media.splice(d.media.indexOf(item), 1); draw(); msg((e && e.message) || 'Upload failed.', true); });
    }
    function collect(status) {
      var at = $('#igAt').value ? new Date($('#igAt').value).getTime() : null;
      return { id: d.id, type: d.type, caption: d.type === 'story' ? '' : $('#igCap').value, altText: $('#igAlt').value, collaborators: $('#igCol').value, shareToFeed: $('#igFeed').checked, at: status === 'draft' ? at : at, status: status,
        planId: d.media.some(function (x) { return x.plan; }) ? (d.planId || '') : '',
        media: d.media.filter(function (x) { return x.path || x.plan; }).map(function (x) { return x.plan ? { plan: true, url: x.url, kind: 'image' } : { path: x.path, url: x.url, kind: x.kind, w: x.w, h: x.h, name: x.name }; }) };
    }
    function busy(on) { m.querySelectorAll('.igq-acts .igk-b').forEach(function (b) { b.disabled = on; }); }
    function pending() { if (d.media.some(function (x) { return !x.path && !x.plan; })) { msg('Wait for the upload to finish.', true); return true; } }
    function save(status) {
      if (pending()) return Promise.reject();
      var body = collect(status);
      if (status === 'scheduled' && !body.at) { msg('Pick a day and time first.', true); $('#igAt').focus(); return Promise.reject(); }
      busy(true); msg('Saving…');
      return api('post-save', body).then(function (r) { d.id = r.item.id; busy(false); return r.item; }, function (e) { busy(false); msg(e.message, true); throw e; });
    }
    $('#igDraft').onclick = function () { save('draft').then(function () { m.remove(); H.toast('Draft saved', 'ok'); refreshTab('planner'); }, function () { }); };
    $('#igSched').onclick = function () { save('scheduled').then(function (it) { m.remove(); H.toast('Scheduled for ' + when(it.at), 'ok'); refreshTab('planner'); }, function () { }); };
    $('#igNow').onclick = function () {
      if (pending()) return;
      var pn = paceNote(Date.now(), d.type, d.id);
      if (pn && !this.dataset.ok) { var me = this; ask(pn + ' Post it anyway?').then(function (ok) { if (ok) { me.dataset.ok = '1'; me.click(); } }); return; }
      var body = collect('draft'); body.at = null;
      busy(true); msg('Saving…');
      api('post-save', body).then(function (r) { d.id = r.item.id; msg('Publishing to Instagram… (videos can take a minute)'); return api('post-now', { id: d.id }); })
        .then(function (r) { m.remove(); H.toast(r.finished ? 'Posted to Instagram' : 'Instagram is still processing the video. It will post in a few minutes.', 'ok'); refreshTab(r.finished ? 'profile' : 'planner'); }, function (e) { busy(false); msg(e.message, true); });
    };
    var del = $('#igDel'); if (del) del.onclick = function () { ask('Delete this ' + (d.status === 'draft' ? 'draft' : 'post') + '?').then(function (ok) { if (!ok) return; api('post-del', { id: d.id }).then(function () { m.remove(); refreshTab(); }); }); };
    m.querySelectorAll('[data-ty]').forEach(function (b) { b.onclick = function () { var t = b.getAttribute('data-ty'); if (t !== 'carousel' && d.media.length > 1) d.media = d.media.slice(0, 1); type(t); }; });
    /* best times to post (and a warning when posts would be too close together) */
    function pace() { var at = $('#igAt').value ? new Date($('#igAt').value).getTime() : null, n = paceNote(at, d.type, d.id), e = $('#igPace'); e.textContent = n; e.hidden = !n; }
    function best() {
      var b = bestSlots(d.type, d.id, 4);
      $('#igBest').innerHTML = b.slots.map(function (t) { return '<button class="igk-b igk-b--sm" data-bt="' + t + '">' + slotLabel(t) + '</button>'; }).join('');
      $('#igBestN').textContent = b.slots.length ? 'Best times' + (b.own ? ', from when your posts got the most likes and comments.' : ', from a 2026 study of 9.6 million posts. Once the account has more posts, they come from your own followers.') + (isFeed(d.type) ? ' 3–5 feed posts a week works best.' : '') : '';
      m.querySelectorAll('[data-bt]').forEach(function (x) { x.onclick = function () { $('#igAt').value = localInput(+x.getAttribute('data-bt')); pace(); }; });
      pace();
    }
    $('#igAt').addEventListener('input', pace); $('#igAt').addEventListener('change', pace);
    if (!S.posts) api('posts').then(function (r) { S.posts = r.items; best(); }).catch(function () { });
    $('#igCap').oninput = count;
    /* start from a planner design: its pictures, its caption (if none is written yet) and its type */
    $('#igFromPlan').onclick = function () {
      pickPlan(function (pl) {
        var f = fromPlan(pl); d.media = f.media; d.planId = pl.id;
        if (!$('#igCap').value.trim() && f.caption) $('#igCap').value = f.caption;
        type(f.type); msg('');
      });
    };
    type(d.type);
  }
  function refreshTab(t) { S.media = null; S.prof = null; igGo(t || S.view); }

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
    return Promise.all([lib(), api('key', { name: name })]).then(function (r) {
      var type = /\.mov$/.test(r[1].path) ? 'video/quicktime' : /\.mp4$/.test(r[1].path) ? 'video/mp4' : /\.png$/.test(r[1].path) ? 'image/png' : 'image/jpeg';
      return r[0](r[1].path, blob, { access: 'private', handleUploadUrl: '/api/hq?route=ig-upload', multipart: blob.size > 20 * 1048576, contentType: type, onUploadProgress: function (e) { onPc(Math.round(e.percentage || 0)); } }).then(function () { return { path: r[1].path, url: null }; });
    });
  }


  /* ---------- Designs: the ready-made posts, stories, reel and highlight covers (site/admin/social.js) ---------- */
  function designs(el) { planner(el); }


  /* ---------- the tour: a small card that walks through the page without covering it ----------
     It opens the first time you visit (and from ⋯ → Take the tour). Each step goes to the right
     place and outlines what it's talking about; the page stays usable the whole time. */
  var TOUR = [
    { go: 'profile', spot: '.igx-ph', icon: 'user', t: 'This is @' + esc(((S.st && S.st.account) || {}).username || 'ciel_africa') + '', d: 'Our Instagram, right inside Ciel Admin. Every post is here: tap one to see its likes, comments and insights.' },
    { go: 'planned', spot: '#igPt [data-pt="planned"], #igMBot [data-v="planner"], #igNav [data-v="planner"]', icon: 'clock', t: 'The planner', d: 'The clock tab (Planner) holds every design ready to post, laid out the way the profile will look. The next post is at the bottom right.' },
    { go: 'planned', spot: '#igPg [data-d]', last: true, icon: 'img', t: 'Posting from the planner: 1', d: 'Tap a design to open it. We’ll open one for you now.' },
    { go: 'planned', sheet: true, spot: '.igx-sheet [data-a="now"], .igx-sheet [data-a="sched"]', icon: 'send', t: 'Posting from the planner: 2', d: '“Post now” sends it straight to Instagram with its caption. “Schedule…” lets you pick a day and time: the best times are suggested, and the app warns you if posts are too close together.' },
    { go: 'planned', spot: '#igMTop [data-v="create"], #igNav [data-v="create"]', icon: 'plus', t: 'Or start from scratch', d: 'The + button makes a new post or story with your own photos or video. In it, “Choose from the planner” picks one of the designs too.' },
    { go: 'messages', spot: '#igMTop [data-v="messages"], #igNav [data-v="messages"]', icon: 'dm', t: 'Messages', d: 'Our Instagram DMs. Reply right here. A red dot and a notification tell you when someone writes.' },
    { go: 'activity', spot: '#igMTop [data-v="activity"], #igNav [data-v="activity"]', icon: 'heart', t: 'Activity', d: 'New comments, likes, followers and tags. You get a notification for each, even while you’re using the app.' },
    { go: 'feed', spot: '#igTray, #igMBot [data-v="feed"]', icon: 'home', t: 'Home', d: 'Posts from accounts doing work like ours, plus our own. Tap one in the row at the top to see their profile, or add more from Search.' },
    { go: 'designs', spot: '#igMBot [data-v="designs"], #igNav [data-v="designs"]', icon: 'grid', t: 'Designs', d: 'Every ready-made post, story, reel and highlight cover. Tap one to post it now, schedule it or save it to your phone.' }
  ];
  var TT = null;
  function tourEnd() { if (!TT) return; TT.el.remove(); document.querySelectorAll('.igx-spot').forEach(function (x) { x.classList.remove('igx-spot'); }); document.querySelectorAll('.igx-menum.is-tour').forEach(function (m) { m.remove(); }); TT = null; }
  function tour() {
    ls('toured2', 1); tourEnd();
    var el = document.createElement('div'); el.className = 'igx-coach'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Instagram tour');
    document.body.appendChild(el); TT = { el: el, i: 0 };
    var spot = function (sel, last) {
      document.querySelectorAll('.igx-spot').forEach(function (x) { x.classList.remove('igx-spot'); });
      var all = [].slice.call(document.querySelectorAll(sel)).filter(function (x) { return x.offsetParent !== null || getComputedStyle(x).position === 'fixed'; });
      var pick = last ? all.slice(-1) : sel.indexOf('[data-a=') >= 0 ? all : all.slice(0, 1);
      pick.forEach(function (x) { x.classList.add('igx-spot'); });
      if (pick[0] && pick[0].closest('#igBody')) pick[0].scrollIntoView({ block: 'center', behavior: 'smooth' });
    };
    var paint = function () {
      var t = TOUR[TT.i], n = TOUR.length;
      el.classList.toggle('is-top', !!t.sheet);   /* when a design is open, the card moves out of its way */
      document.querySelectorAll('.igx-menum.is-tour').forEach(function (m) { m.remove(); });
      var here = (t.go === 'planned' ? S.view === 'profile' && S.ptab === 'planned' : t.go === 'profile' ? S.view === 'profile' && S.ptab !== 'planned' : S.view === t.go);
      if (S.st && S.st.account && !here) { if (S.view === 'profile' && (t.go === 'planned' || t.go === 'profile')) profTab(t.go === 'planned' ? 'planned' : 'posts'); else igGo(t.go); }
      el.innerHTML = '<div class="igx-ch"><span class="igx-ci">' + (IC[t.icon] || IC.ig) + '</span><b>' + esc(t.t) + '</b><button class="igx-cx" data-tx aria-label="Close the tour">' + IC.x + '</button></div><p>' + esc(t.d) + '</p>' +
        '<div class="igx-cf"><span class="igx-cd">' + TOUR.map(function (x, k) { return '<i' + (k === TT.i ? ' class="is-on"' : '') + '></i>'; }).join('') + '</span><span class="igx-sp"></span>' + (TT.i ? '<button class="igx-btn" data-tb>Back</button>' : '') + '<button class="igx-btn igx-btn--b" data-tn>' + (TT.i === n - 1 ? 'Done' : 'Next') + '</button></div>';
      el.querySelector('[data-tx]').onclick = tourEnd;
      el.querySelector('[data-tn]').onclick = function () { if (TT.i === n - 1) { tourEnd(); H.toast('You’re all set. Happy posting!', 'ok'); } else { TT.i++; paint(); } };
      var bk = el.querySelector('[data-tb]'); if (bk) bk.onclick = function () { TT.i--; paint(); };
      /* wait for the page to draw, then point at the thing (and open a design to show the buttons) */
      setTimeout(function () {
        if (!TT || TOUR[TT.i] !== t) return;
        if (t.sheet) {
          var d0 = (PL.items || []).filter(function (p) { return p.status !== 'posted' && planType(p) && p.kind !== 'story'; }).sort(function (a, b) { return planOrder(a) - planOrder(b); })[0];
          if (d0) { planSheet(d0); var ms = document.querySelectorAll('.igx-menum'), m = ms[ms.length - 1]; if (m) m.classList.add('is-tour'); }
        }
        spot(t.spot, t.last);
      }, 700);
    };
    paint();
  }


  document.addEventListener('load', function (e) { var t = e.target; if (t && t.tagName === 'IMG' && t.closest && t.closest('.igx-t, .igx-ring, .igx-pm, .ig-tile')) t.classList.add('is-in'); }, true);
  document.addEventListener('error', function (e) { var t = e.target; if (t && t.tagName === 'IMG' && t.closest && t.closest('.igx-t, .igx-ring')) t.classList.add('is-in'); }, true);
  /* ---------- Designs (the planner's ready-made posts, stories, reel and highlight covers) ----------
     Kept in lib/hq/instagram.js (hq/ig/designs.json); pictures in the private Blob store like every post. */
  var KIT = (function () {
    var KINDS = [['post', 'Photo post'], ['carousel', 'Carousel (several photos)'], ['story', 'Story'], ['reel', 'Reel cover'], ['highlight', 'Highlight cover']];
    var CROP = { post: RATIO.photo, carousel: RATIO.carousel, story: RATIO.story, reel: [0.5625, 0.5625], highlight: [1, 1] };
    var kindName = function (k) { return (KINDS.filter(function (x) { return x[0] === k; })[0] || KINDS[0])[1]; };
    var changed = function () { PL.at = 0; kitChange(); };
    function order(p) { return p.seq || (1e6 + (Date.parse(p.created || '') || 0) / 1e3); }
    /* pick pictures, crop them to a shape Instagram takes, upload them; one picture per design (several for a carousel) */
    function pickFiles(kind, many, cb) {
      var inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.multiple = !!many;
      inp.onchange = function () { var fs = [].slice.call(inp.files || []); if (fs.length) cb(fs); };
      inp.click();
    }
    function sendOne(f, kind) { return toJpeg(f, CROP[kind] || CROP.post).then(function (r) { return upload(r.file, r.name, function () { }); }).then(function (u) { return u.path; }); }
    function addMany(kind) {
      pickFiles(kind, true, function (fs) {
        var done = 0, made = 0; H.toast('Adding ' + fs.length + ' design' + (fs.length > 1 ? 's' : '') + '…');
        var next = function () {
          if (done >= fs.length) { H.toast(made + ' design' + (made === 1 ? '' : 's') + ' added. Tap one to add its caption, post it or schedule it.', 'ok'); changed(); return; }
          var f = fs[done++];
          sendOne(f, kind).then(function (path) { return api('design-save', { kind: kind, paths: [path], caption: '', status: 'ready' }); }).then(function () { made++; next(); }, function (e) { H.toast((e && e.message) || 'Couldn’t add one of them.', 'err'); next(); });
        };
        next();
      });
    }
    /* the bar above the designs: add new ones by type */
    function packPanel() {
      var box = document.querySelector('[data-igpack]'); if (!box || box.getAttribute('data-built')) return; box.setAttribute('data-built', '1');
      box.innerHTML = '<div class="igq-addd"><div><b>Add designs</b><small>Pick pictures from your phone or computer. Each one becomes a design you can caption, post now or schedule.</small></div><div class="igq-addb">' +
        [['post', 'Posts'], ['story', 'Stories'], ['reel', 'Reel covers'], ['highlight', 'Highlights']].map(function (k) { return '<button class="igx-btn" data-add="' + k[0] + '">' + IC.plus + '<span>' + k[1] + '</span></button>'; }).join('') + '</div></div>';
      box.querySelectorAll('[data-add]').forEach(function (b) { b.onclick = function () { addMany(b.getAttribute('data-add')); }; });
    }
    /* full-size look, save to the phone, copy the caption */
    function big(p) {
      var imgs = p.images || []; if (!imgs.length) return edit(p);
      var tall = /story|reel/.test(p.kind);
      var m = H.modal('<div class="igq-big"><div class="igx-sech"><h2>' + esc(kindName(p.kind)) + '</h2><button class="igk-b igk-b--sm igk-b--ghost" data-x>✕</button></div>' +
        '<div class="igq-bigs">' + imgs.map(function (u) { return '<img src="' + esc(u) + '" alt="" style="aspect-ratio:' + (tall ? '9 / 16' : p.kind === 'highlight' ? '1 / 1' : 'auto') + '">'; }).join('') + '</div>' +
        (p.caption ? '<p class="igq-bigc">' + esc(p.caption).replace(/\n/g, '<br>') + '</p>' : '') +
        '<div class="igk-row"><span class="igq-sp"></span>' + (p.caption ? '<button class="igk-b" data-cp>Copy caption</button>' : '') + '<button class="igk-b igk-b--p" data-sv>' + (imgs.length > 1 ? 'Save ' + imgs.length + ' pictures' : 'Save picture') + '</button></div></div>');
      m.classList.add('igx-pickm');
      var cp = m.querySelector('[data-cp]'); if (cp) cp.onclick = function () { try { navigator.clipboard.writeText(p.caption || ''); H.toast('Caption copied', 'ok'); } catch (e) { H.toast('Couldn’t copy.', 'err'); } };
      m.querySelector('[data-sv]').onclick = function () {
        Promise.all(imgs.map(function (u, i) { return fetch(u).then(function (r) { return r.blob(); }).then(function (b) { return new File([b], 'ciel-' + (p.kind || 'post') + '-' + String(p.id || '').slice(-5) + (imgs.length > 1 ? '-' + (i + 1) : '') + '.jpg', { type: b.type || 'image/jpeg' }); }); })).then(function (files) {
          if (navigator.canShare && navigator.share && navigator.canShare({ files: files }) && /iPhone|iPad|Android/i.test(navigator.userAgent)) return navigator.share({ files: files }).catch(function () { });
          files.forEach(function (f, n) { setTimeout(function () { var a = document.createElement('a'); a.href = URL.createObjectURL(f); a.download = f.name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000); }, n * 400); });
        }, function () { H.toast('Couldn’t load the pictures.', 'err'); });
      };
    }
    /* add or change one design: type, pictures, caption, posted or not */
    function edit(p) {
      p = p || { kind: 'post', paths: [], images: [], caption: '', status: 'ready' };
      var d = { id: p.id, kind: p.kind || 'post', paths: (p.paths || []).slice(), images: (p.images || []).slice(), caption: p.caption || '', status: p.status || 'ready' };
      var m = H.modal('<div class="igq-ded"><div class="igx-sech"><h2>' + (d.id ? 'Edit design' : 'New design') + '</h2><button class="igk-b igk-b--sm igk-b--ghost" data-x>✕</button></div>' +
        '<label class="igk-fld"><span>Type</span><select id="igDk">' + KINDS.map(function (k) { return '<option value="' + k[0] + '"' + (k[0] === d.kind ? ' selected' : '') + '>' + k[1] + '</option>'; }).join('') + '</select></label>' +
        '<div class="igq-dpics" id="igDp"></div>' +
        '<label class="igk-fld"><span>Caption</span><textarea id="igDc" rows="6" maxlength="2200" placeholder="Write the caption, hashtags and all">' + esc(d.caption) + '</textarea></label>' +
        '<label class="igk-fld igq-chk"><input type="checkbox" id="igDs"' + (d.status === 'posted' ? ' checked' : '') + '> <span>Already posted</span></label>' +
        '<div class="igk-row">' + (d.id ? '<button class="igk-b igk-b--ghost igq-danger" id="igDd">' + IC.del + '</button>' : '') + '<span class="igq-sp"></span><button class="igk-b" data-x>Cancel</button><button class="igk-b igk-b--p" id="igDv">Save</button></div></div>');
      m.classList.add('igx-pickm');
      var pics = function () {
        var box = m.querySelector('#igDp'), many = d.kind === 'carousel';
        box.innerHTML = d.images.map(function (u, i) { return '<span class="igq-dpic"><img src="' + esc(u) + '" alt="">' + (d.images.length > 1 ? '<button data-l="' + i + '" title="Move left">' + IC.l + '</button>' : '') + '<button data-r="' + i + '" title="Remove">' + IC.x + '</button></span>'; }).join('') +
          ((many ? d.images.length < 10 : !d.images.length) ? '<button class="igq-dadd" id="igDa">' + IC.plus + '<span>' + (d.images.length ? 'Add a picture' : 'Add the picture') + '</span></button>' : (!many ? '<button class="igq-dadd" id="igDa">' + IC.img + '<span>Change picture</span></button>' : ''));
        box.querySelectorAll('[data-r]').forEach(function (b) { b.onclick = function () { var i = +b.getAttribute('data-r'); d.images.splice(i, 1); d.paths.splice(i, 1); pics(); }; });
        box.querySelectorAll('[data-l]').forEach(function (b) { b.onclick = function () { var i = +b.getAttribute('data-l'); if (!i) return; [d.images, d.paths].forEach(function (a) { var t = a[i]; a[i] = a[i - 1]; a[i - 1] = t; }); pics(); }; });
        var add = box.querySelector('#igDa');
        if (add) add.onclick = function () {
          pickFiles(d.kind, many, function (fs) {
            if (!many) { d.images = []; d.paths = []; }
            add.disabled = true; add.querySelector('span').textContent = 'Uploading…';
            fs.reduce(function (pr, f) { return pr.then(function () { return sendOne(f, d.kind).then(function (path) { d.paths.push(path); d.images.push(URL.createObjectURL(f)); }); }); }, Promise.resolve())
              .then(pics, function (e) { H.toast((e && e.message) || 'Upload failed.', 'err'); pics(); });
          });
        };
      };
      pics();
      m.querySelector('#igDk').onchange = function () { d.kind = this.value; if (d.kind !== 'carousel' && d.images.length > 1) { d.images = d.images.slice(0, 1); d.paths = d.paths.slice(0, 1); } pics(); };
      m.querySelector('#igDv').onclick = function () {
        var b = this; if (!d.paths.length) return H.toast('Add a picture first.', 'err');
        b.disabled = true; b.textContent = 'Saving…';
        api('design-save', { id: d.id, kind: d.kind, paths: d.paths, caption: m.querySelector('#igDc').value, status: m.querySelector('#igDs').checked ? 'posted' : 'ready' })
          .then(function () { m.remove(); H.toast('Design saved', 'ok'); changed(); }, function (e) { b.disabled = false; b.textContent = 'Save'; H.toast(e.message, 'err'); });
      };
      var del = m.querySelector('#igDd');
      if (del) del.onclick = function () { ask('Delete this design?').then(function (ok) { if (!ok) return; api('design-del', { id: d.id }).then(function () { m.remove(); H.toast('Design deleted'); changed(); }, function (e) { H.toast(e.message, 'err'); }); }); };
    }
    return { preview: function (p) { big(p); }, edit: edit, thumb: function (u) { return u; }, big: big, packPanel: packPanel, canEdit: function () { return true; }, order: order, KINDS: KINDS, ST: [], add: addMany, onChange: null };
  })();
  A.igPlannerKit = KIT;
  KIT.onChange = kitChange;

  document.addEventListener('load', function (e) { var t = e.target; if (t && t.tagName === 'IMG' && t.closest && t.closest('.igx-t, .igx-ring, .igx-pm, .ig-tile')) t.classList.add('is-in'); }, true);
  document.addEventListener('error', function (e) { var t = e.target; if (t && t.tagName === 'IMG' && t.closest && t.closest('.igx-t, .igx-ring')) t.classList.add('is-in'); }, true);

  /* ---------- fitting into Ciel Admin (assets/hq/hq.js calls HQIg.init once and HQIg.render on #instagram/…) ---------- */
  H = {
    esc: function (t) { return A.esc(t); },
    toast: function (m, kind) { if (HQ) HQ.toast(m, kind); },
    body: function (h) { var el = document.querySelector('#body'); el.innerHTML = h; return el; },
    modal: function (html) {
      var m = document.createElement('div'); m.className = 'igk-modal'; m.innerHTML = '<div class="igk-modal__p">' + html + '</div>'; document.body.appendChild(m);
      m.addEventListener('click', function (e) { if (e.target === m || e.target.closest('[data-x]')) m.remove(); });
      return m;
    }
  };
  /* the page's own top bar sits right under Ciel Admin's header, whatever its height */
  function fitTop() { var hd = document.querySelector('.hq-top'); if (hd && hd.offsetHeight) document.body.style.setProperty('--top', hd.offsetHeight + 'px'); }
  window.addEventListener('resize', function () { if (document.body.classList.contains('ig-on')) fitTop(); });
  function leave() { document.body.style.removeProperty('--top'); tourEnd(); document.body.classList.remove('ig-on'); stopPoll(); closeViewer(); closeReels(); closeList(); if (PV) PV.pause(); document.querySelectorAll('.igk-modal:not(.igq-tourm)').forEach(function (m) { m.remove(); }); }
  window.addEventListener('hashchange', function () { if (!/^#instagram(\/|$)/.test(location.hash)) leave(); });
  window.HQIg = {
    init: function (h) { HQ = h; setTimeout(bg, 6000); setInterval(bg, 240000); },
    render: function (sub, extra) {
      document.body.classList.add('ig-on'); fitTop();
      var h = 'instagram' + (sub ? '/' + sub + (extra ? '/' + extra : '') : '');
      A.S.hashNow = h; A.saveRoute(h);
      render(sub || '', extra || '');
    }
  };
})();
