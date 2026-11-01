/* ============================================================
   CIEL AFRICA PHOTO BOOKS — editor (/photobooks/design)
   A simple, Canva-like editor: cover designer with live book
   preview, pages with one or two photos that can be moved,
   resized and cropped, text, stickers, colours and a preview.
   Projects and photos are stored on this device (IndexedDB).
   ============================================================ */
(function () {
  'use strict';
  var R = window.PBKR, C = window.PBKCat, A = window.PBKArt, ST = window.PBStore, PH = window.PBPhotos;
  var PBK = window.PBK, esc = PBK.esc, BOOK = PBK.BOOK, BASE = PBK.BASE;
  var CFG = (window.CIEL && CIEL.photobooks) || {};
  var W = R.W, H = R.H, BRAND_TOP = 1440, MAXPH = BOOK.maxPhotosPerPage || 2;

  var LAYOUTS = {
    one: { n: 'One photo', f: [[90, 90, 1020, 1330]] },
    full: { n: 'Full page', f: [[0, 0, 1200, 1600]] },
    land: { n: 'Landscape', f: [[90, 420, 1020, 765]] },
    square: { n: 'Square', f: [[150, 260, 900, 900]] },
    twov: { n: 'Two, stacked', f: [[90, 90, 1020, 690], [90, 820, 1020, 690]] },
    twoh: { n: 'Two, side by side', f: [[90, 330, 495, 840], [615, 330, 495, 840]] },
    collage: { n: 'Two, overlapping', f: [[90, 110, 690, 880], [430, 820, 680, 680]], border: 14 },
    bigsmall: { n: 'Big and small', f: [[0, 0, 1200, 1010], [640, 1060, 470, 440]] }
  };
  var COLORS = ['#ffffff', '#faf6ef', '#f4ecdf', '#fbd3dc', '#ffe27a', '#86d6e8', '#c8e6c9', '#cfe8ff', '#e5383b', '#ff4f9a', '#ff7a2e', '#2f80ed', '#0f5c3a', '#1f3c74', '#3b2314', '#141414'];

  var S = {}; /* editor state */
  var el$ = {};
  function uid(p) { return (p || 'x') + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function $(s, r) { return (r || document).querySelector(s); }
  function toast(msg) { var t = el$.toast; t.textContent = msg; t.classList.add('is-on'); clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove('is-on'); }, 2600); }

  var I = {
    back: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    photo: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/></svg>',
    layout: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M4 12h16"/></svg>',
    text: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 6V4h14v2M12 4v16M9 20h6"/></svg>',
    sticker: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/></svg>',
    color: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.6-.9 1.3-1.8-.4-1 .2-2.2 1.4-2.2H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10z"/><circle cx="7.5" cy="11" r="1.2" fill="currentColor"/><circle cx="10" cy="7" r="1.2" fill="currentColor"/><circle cx="15" cy="7.5" r="1.2" fill="currentColor"/></svg>',
    cover: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6z"/><path d="M6 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2"/><path d="M9 8h7M9 11h5"/></svg>',
    undo: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/></svg>',
    redo: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/></svg>',
    eye: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    trash: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
    crop: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 2v16h16M2 6h16v16"/></svg>',
    swap: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h14l-3-3M20 17H6l3 3"/></svg>',
    flip: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3v18M9 6L3 18h6zM15 6l6 12h-6z"/></svg>',
    dup: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>',
    up: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
    edit: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
    plus: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    left: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    right: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>',
    x: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    lock: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>'
  };

  /* ---------------- project ---------------- */
  function pageDoc(layout) {
    var L = LAYOUTS[layout] || LAYOUTS.one;
    return { kind: 'page', bg: '#ffffff', layout: layout, els: L.f.map(function (f, i) { return { id: 'ph' + (i + 1), t: 'photo', x: f[0], y: f[1], w: f[2], h: f[3], photo: null, crop: { z: 1, cx: 0.5, cy: 0.5 }, border: L.border || 0 }; }) };
  }
  function newProject(tid, pal, pages) {
    var t = tid === 'blank' ? null : C.TPL[tid];
    var cover = C.docFor(tid, pal) || C.blankDoc(C.BLANK[0]);
    var n = Math.max(BOOK.pages.min, Math.min(BOOK.pages.max, pages || BOOK.pages.default));
    if (n % 2) n++;
    var list = []; for (var i = 0; i < n; i++) list.push(pageDoc('one'));
    return { id: uid('pb'), app: 'pbk', v: 1, name: t ? t.name + ' photo book' : 'My photo book', tpl: tid, pal: pal || 0, cover: cover, pages: list, createdAt: Date.now() };
  }

  /* ---------------- photo URLs ---------------- */
  var urls = {};
  function photoUrl(id) { return urls[id] || null; }
  function loadPhotoUrls(list) {
    return Promise.all(list.map(function (m) {
      if (urls[m.id]) return null;
      return ST.blob(m.id, 'prev').then(function (b) { if (b) urls[m.id] = URL.createObjectURL(b); });
    }));
  }
  var thumbs = {};
  function thumbUrl(id) {
    if (thumbs[id]) return Promise.resolve(thumbs[id]);
    return ST.blob(id, 'thumb').then(function (b) { if (b) thumbs[id] = URL.createObjectURL(b); return thumbs[id]; });
  }

  /* ---------------- save & history ---------------- */
  var saveT;
  function save() {
    el$.saved.textContent = 'Saving…';
    clearTimeout(saveT);
    saveT = setTimeout(function () {
      ST.saveProject(S.p).then(function () { el$.saved.textContent = 'Saved on this device'; }, function (e) { el$.saved.textContent = 'Not saved'; toast(e.message || 'Could not save'); });
    }, 500);
  }
  function snap() { return JSON.stringify({ cover: S.p.cover, pages: S.p.pages }); }
  function commit() { S.undo.push(S.last); if (S.undo.length > 60) S.undo.shift(); S.redo = []; S.last = snap(); save(); updUndo(); }
  function restore(js) { var o = JSON.parse(js); S.p.cover = o.cover; S.p.pages = o.pages; S.last = js; if (S.cur >= S.p.pages.length) S.cur = S.p.pages.length - 1; S.sel = null; save(); updUndo(); renderAll(); }
  function undo() { if (!S.undo.length) return; S.redo.push(S.last); restore(S.undo.pop()); }
  function redo() { if (!S.redo.length) return; S.undo.push(S.last); restore(S.redo.pop()); }
  function updUndo() { el$.undo.disabled = !S.undo.length; el$.redo.disabled = !S.redo.length; }

  function doc() { return S.cur < 0 ? S.p.cover : S.p.pages[S.cur]; }
  function selEl() { var d = doc(); return S.sel ? (d.els || []).filter(function (e) { return e.id === S.sel; })[0] : null; }

  /* ---------------- open ---------------- */
  function open(main) {
    document.body.classList.add('pbk-editing');
    document.title = 'Design your photo book — Ciel Africa';
    main.innerHTML = '<div class="pe" id="pe"><div class="pe-load">Opening your book…</div></div>';
    if (!ST || !PH) { main.innerHTML = '<div class="pe-err wrap"><h2>This browser can’t store your book</h2><p>Try a recent version of Chrome, Safari or Edge, and turn off private browsing.</p></div>'; return; }
    var q = new URLSearchParams(location.search);
    var pid = q.get('p');
    var ready = pid ? ST.project(pid).then(function (p) { if (!p || p.app !== 'pbk') throw new Error('missing'); return p; }) :
      Promise.resolve().then(function () {
        var t = q.get('t') || 'blank'; if (t !== 'blank' && !C.TPL[t]) t = 'blank';
        var p = newProject(t, +q.get('c') || 0, +q.get('n') || 0);
        return ST.saveProject(p).then(function () { history.replaceState({}, '', BASE + '/design?p=' + p.id); return p; });
      });
    ready.then(function (p) {
      S = { p: p, cur: -1, sel: null, undo: [], redo: [], last: null, photos: {}, order: [], panel: null, crop: false };
      S.last = snap();
      return ST.photos(p.id).then(function (list) {
        list.sort(function (a, b) { return (a.taken || '').localeCompare(b.taken || '') || a.added - b.added; });
        list.forEach(function (m) { S.photos[m.id] = m; S.order.push(m.id); });
        return loadPhotoUrls(list);
      });
    }).then(function () {
      build(main);
      ST.persist();
    }).catch(function (e) {
      main.innerHTML = '<div class="pe-err wrap"><h2>We couldn’t open that book</h2><p>' + (e && e.message === 'missing' ? 'It isn’t saved in this browser. Books are stored on the device where they were made.' : esc(e && e.message || 'Something went wrong.')) + '</p><a class="btn btn--p" data-go href="' + BASE + '">Back to Photo Books</a></div>';
    });
  }

  /* ---------------- UI ---------------- */
  function build(main) {
    var pe = $('#pe', main);
    pe.innerHTML =
      '<header class="pe-top"><a class="pe-back" data-go href="' + BASE + '" aria-label="Back to Photo Books">' + I.back + '<span>Photo Books</span></a>' +
      '<input class="pe-name" id="peName" value="' + esc(S.p.name) + '" aria-label="Book name" maxlength="60">' +
      '<span class="pe-saved" id="peSaved">Saved on this device</span>' +
      '<div class="pe-top__r"><button class="pe-ib" id="peUndo" aria-label="Undo" title="Undo">' + I.undo + '</button><button class="pe-ib" id="peRedo" aria-label="Redo" title="Redo">' + I.redo + '</button>' +
      '<button class="btn btn--ghost btn--sm pe-prevbtn" id="pePrev">' + I.eye + '<span>Preview</span></button><button class="btn btn--p btn--sm" id="peOrder">Order</button></div></header>' +
      '<div class="pe-body">' +
      '<nav class="pe-rail" id="peRail" aria-label="Tools">' +
      [['cover', I.cover, 'Cover'], ['photos', I.photo, 'Photos'], ['layouts', I.layout, 'Layouts'], ['text', I.text, 'Text'], ['stickers', I.sticker, 'Stickers'], ['colors', I.color, 'Colours']].map(function (b) { return '<button data-panel="' + b[0] + '">' + b[1] + '<span>' + b[2] + '</span></button>'; }).join('') +
      '</nav>' +
      '<aside class="pe-panel" id="pePanel" aria-live="polite"></aside>' +
      '<main class="pe-stage" id="peStage"><div class="pe-canvaswrap" id="peWrap"><canvas id="peCanvas"></canvas><div class="pe-hinge" id="peHinge" title="Spine side"></div><div class="pe-brand" id="peBrand">' + I.lock + ' CIEL AFRICA stays here</div><div class="pe-sel" id="peSel" hidden><i data-h="nw"></i><i data-h="ne"></i><i data-h="sw"></i><i data-h="se"></i></div></div>' +
      '<div class="pe-ctx" id="peCtx" hidden></div>' +
      '<div class="pe-mock" id="peMock"><span>Book preview</span><canvas id="peMockC" width="550" height="710"></canvas></div>' +
      '<div class="pe-hint" id="peHint"></div></main>' +
      '</div>' +
      '<footer class="pe-strip"><div class="pe-strip__nav"><button class="pe-ib" id="pePgPrev" aria-label="Previous page">' + I.left + '</button><span id="pePgLbl"></span><button class="pe-ib" id="pePgNext" aria-label="Next page">' + I.right + '</button></div><div class="pe-strip__list" id="peStrip"></div><div class="pe-strip__info"><span id="pePages"></span><b id="pePrice"></b></div></footer>' +
      '<div class="pe-toast" id="peToast" role="status"></div>' +
      '<input type="file" id="peFile" accept="' + (PH.accept || 'image/*') + '" multiple hidden>';
    el$ = { pe: pe, canvas: $('#peCanvas', pe), wrap: $('#peWrap', pe), sel: $('#peSel', pe), ctx: $('#peCtx', pe), panel: $('#pePanel', pe), strip: $('#peStrip', pe), toast: $('#peToast', pe), saved: $('#peSaved', pe), undo: $('#peUndo', pe), redo: $('#peRedo', pe), mock: $('#peMockC', pe), mockBox: $('#peMock', pe), stage: $('#peStage', pe), file: $('#peFile', pe), hint: $('#peHint', pe) };
    el$.g = el$.canvas.getContext('2d');
    bindTop(); bindRail(); bindCanvas(); bindStrip();
    R.loadFonts().then(function () { renderAll(); });
    renderAll();
    window.addEventListener('resize', fit);
    document.addEventListener('keydown', keys);
    openPanel(innerWidth > 900 ? 'cover' : null);
    if (!S.order.length) setTimeout(function () { hint('Start by adding your photos: tap Photos, then Add photos.'); }, 900);
  }
  function hint(t) { var h = el$.hint; if (!h) return; h.textContent = t; h.classList.add('is-on'); clearTimeout(h._t); h._t = setTimeout(function () { h.classList.remove('is-on'); }, 6000); }

  function bindTop() {
    $('#peName').addEventListener('input', function () { S.p.name = this.value.slice(0, 60); save(); });
    el$.undo.addEventListener('click', undo); el$.redo.addEventListener('click', redo); updUndo();
    $('#pePrev').addEventListener('click', preview);
    $('#peOrder').addEventListener('click', order);
  }
  function keys(e) {
    if (!document.body.classList.contains('pbk-editing')) { document.removeEventListener('keydown', keys); return; }
    if (document.querySelector('dialog[open]')) return;
    var tag = (e.target.tagName || '').toLowerCase(); if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
    else if ((e.key === 'Delete' || e.key === 'Backspace') && S.sel) { e.preventDefault(); removeSel(); }
    else if (e.key === 'Escape') { S.crop = false; select(null); }
    else if (e.key === 'ArrowRight' && !S.sel) go(S.cur + 1);
    else if (e.key === 'ArrowLeft' && !S.sel) go(S.cur - 1);
  }

  /* ---------------- canvas & stage ---------------- */
  var dpr = Math.min(2, window.devicePixelRatio || 1);
  function fit() {
    var st = el$.stage; if (!st) return;
    var pad = innerWidth < 700 ? 18 : 40;
    var aw = st.clientWidth - pad * 2, ah = st.clientHeight - pad * 2 - (innerWidth < 700 ? 0 : 10);
    var w = Math.max(160, Math.min(aw, ah * W / H)), h = w * H / W;
    S.k = w / W;
    el$.wrap.style.width = w + 'px'; el$.wrap.style.height = h + 'px';
    el$.canvas.width = Math.round(w * dpr); el$.canvas.height = Math.round(h * dpr);
    el$.canvas.style.width = w + 'px'; el$.canvas.style.height = h + 'px';
    draw();
  }
  var rafId;
  function draw() {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(function () {
      var d = doc(), g = el$.g;
      R.load(d, { photo: photoUrl }).then(function () {
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.clearRect(0, 0, el$.canvas.width, el$.canvas.height);
        R.draw(g, d, { scale: S.k * dpr, photo: photoUrl, empty: 'editor' });
        placeSel();
      });
      var isCover = S.cur < 0;
      $('#peHinge').hidden = !isCover; $('#peBrand').hidden = !isCover;
      el$.mockBox.hidden = !isCover;
      if (isCover) mockSoon();
    });
  }
  var mockT;
  function mockSoon() {
    clearTimeout(mockT);
    mockT = setTimeout(function () {
      Promise.all([R.mockMap(), R.toCanvas(S.p.cover, 600, { photo: photoUrl })]).then(function (r) {
        var m = R.mock(r[1], r[0]);
        [el$.mock, document.getElementById('peMockP')].forEach(function (cv) { if (!cv) return; var x = cv.getContext('2d'); x.clearRect(0, 0, 550, 710); x.drawImage(m, 0, 0); });
      }).catch(function () {});
    }, 180);
  }
  function renderAll() { fit(); drawStrip(); drawInfo(); if (S.panel) openPanel(S.panel, true); ctxBar(); }

  /* bounds of an element in document units */
  function bounds(e) {
    if (e.t === 'text') { var L = R.layoutText(el$.g, e); var x0 = Infinity, x1 = -Infinity; L.lines.forEach(function (l) { x0 = Math.min(x0, l.x); x1 = Math.max(x1, l.x + l.w); }); if (!isFinite(x0)) { x0 = e.x; x1 = e.x + e.w; } return { x: Math.min(x0, e.x), y: e.y - L.cap * 0.18, w: Math.max(x1, e.x + e.w) - Math.min(x0, e.x), h: L.h + L.cap * 0.42 }; }
    return { x: e.x, y: e.y, w: e.w, h: e.h };
  }
  function placeSel() {
    var e = selEl(), s = el$.sel;
    if (!e) { s.hidden = true; return; }
    var b = bounds(e), k = S.k;
    s.hidden = false;
    s.style.left = b.x * k + 'px'; s.style.top = b.y * k + 'px'; s.style.width = b.w * k + 'px'; s.style.height = b.h * k + 'px';
    s.className = 'pe-sel' + (S.crop ? ' is-crop' : '') + (e.t === 'text' ? ' is-text' : '');
    s.style.transform = e.rot ? 'rotate(' + e.rot + 'deg)' : '';
    ctxPos();
  }
  function hit(x, y) {
    var d = doc(), list = (d.els || []).slice().reverse();
    for (var i = 0; i < list.length; i++) { var b = bounds(list[i]); if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return list[i]; }
    return null;
  }
  function pt(ev) { var r = el$.canvas.getBoundingClientRect(); return { x: (ev.clientX - r.left) / S.k, y: (ev.clientY - r.top) / S.k }; }
  function select(id) { S.sel = id; if (!id) S.crop = false; placeSel(); ctxBar(); }

  function clampEl(e) {
    var minS = 40;
    if (e.t === 'text') e.h = bounds(e).h;
    e.w = Math.max(minS, e.w || minS); e.h = Math.max(minS * 0.5, e.h || minS);
    if (!isFinite(e.x)) e.x = 140; if (!isFinite(e.y)) e.y = 600;
    e.x = Math.max(-e.w * 0.8, Math.min(W - e.w * 0.2, e.x));
    e.y = Math.max(-e.h * 0.8, Math.min(H - e.h * 0.2, e.y));
    if (S.cur < 0) { var b = bounds(e); if (b.y + b.h > BRAND_TOP && e.t !== 'photo') e.y -= (b.y + b.h - BRAND_TOP); if (e.t === 'photo' && e.y + e.h > BRAND_TOP) { e.h = Math.max(80, BRAND_TOP - e.y); } }
  }

  function bindCanvas() {
    var drag = null;
    var wrap = el$.wrap;
    wrap.addEventListener('pointerdown', function (ev) {
      if (ev.button > 0) return;
      var p = pt(ev), h = ev.target.getAttribute && ev.target.getAttribute('data-h');
      var e = selEl();
      if (h && e) { drag = { mode: 'resize', h: h, e: e, p: p, o: clone(e), b: bounds(e) }; }
      else {
        var t = hit(p.x, p.y);
        if (S.crop && e && e.t === 'photo' && t === e) { drag = { mode: 'pan', e: e, p: p, o: clone(e) }; }
        else if (t) {
          var was = S.sel === t.id;
          if (!was) { S.crop = false; select(t.id); }
          if (t.t === 'photo' && !t.photo) { drag = null; S.target = t.id; openPanel('photos'); return; }
          drag = { mode: 'move', e: t, p: p, o: clone(t), moved: false, wasSel: was };
        } else { select(null); return; }
      }
      wrap.setPointerCapture(ev.pointerId); ev.preventDefault();
    });
    wrap.addEventListener('pointermove', function (ev) {
      if (!drag) return;
      var p = pt(ev), dx = p.x - drag.p.x, dy = p.y - drag.p.y, e = drag.e, o = drag.o;
      if (drag.mode === 'move') {
        if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 6) return;
        drag.moved = true;
        e.x = o.x + dx; e.y = o.y + dy;
        // gentle snapping to the page centre and margins
        var b = bounds(e), cx = b.x + b.w / 2;
        if (Math.abs(cx - (S.cur < 0 ? 650 : 600)) < 14) e.x += (S.cur < 0 ? 650 : 600) - cx;
        if (Math.abs(b.x - 90) < 12) e.x += 90 - b.x;
        clampEl(e);
      } else if (drag.mode === 'pan') {
        var im = R.ready(photoUrl(e.photo)); if (!im) return;
        var z = (e.crop && e.crop.z) || 1, iw = im.naturalWidth, ih = im.naturalHeight, s = Math.max(e.w / iw, e.h / ih) * z;
        e.crop = e.crop || { z: 1 };
        e.crop.cx = Math.max(0, Math.min(1, o.crop.cx - dx / (iw * s)));
        e.crop.cy = Math.max(0, Math.min(1, o.crop.cy - dy / (ih * s)));
      } else if (drag.mode === 'resize') {
        var b0 = drag.b, ax = drag.h.indexOf('w') >= 0 ? b0.x + b0.w : b0.x, ay = drag.h.indexOf('n') >= 0 ? b0.y + b0.h : b0.y;
        var keep = e.t !== 'photo' || ev.shiftKey;
        var nw = Math.abs(p.x - ax), nh = Math.abs(p.y - ay);
        if (keep) { var sc = Math.max(nw / b0.w, nh / b0.h); sc = Math.max(0.1, sc); nw = b0.w * sc; nh = b0.h * sc; }
        nw = Math.max(60, nw); nh = Math.max(40, nh);
        var fx = drag.h.indexOf('w') >= 0 ? ax - nw : ax, fy = drag.h.indexOf('n') >= 0 ? ay - nh : ay;
        if (e.t === 'text') {
          var r = nw / b0.w;
          if (o.cap) e.cap = Math.max(14, o.cap * r); else e.size = Math.max(14, (o.size || 80) * r);
          e.w = Math.max(60, o.w * r); e.x = fx + (o.x - b0.x) * r; e.y = fy + (o.y - b0.y) * r;
        } else { e.x = fx; e.y = fy; e.w = nw; e.h = nh; }
        clampEl(e);
      }
      draw();
    });
    function end(ev) {
      if (!drag) return;
      var d = drag; drag = null;
      if (d.mode === 'move' && !d.moved) {
        // a tap: text opens the text editor; a filled photo opens crop on a second tap
        if (d.e.t === 'text' && d.wasSel) openPanel('text');
        return;
      }
      commit(); drawThumb(S.cur); ctxBar();
    }
    wrap.addEventListener('pointerup', end); wrap.addEventListener('pointercancel', end);
    wrap.addEventListener('dblclick', function (ev) { var e = selEl(); if (!e) return; if (e.t === 'text') openPanel('text'); else if (e.t === 'photo' && e.photo) { S.crop = true; placeSel(); ctxBar(); } });
    // drop photos from the panel (desktop)
    wrap.addEventListener('dragover', function (ev) { if (ev.dataTransfer.types.indexOf('text/pbk-photo') >= 0) ev.preventDefault(); });
    wrap.addEventListener('drop', function (ev) {
      var id = ev.dataTransfer.getData('text/pbk-photo'); if (!id) return; ev.preventDefault();
      var p = pt(ev), t = hit(p.x, p.y);
      placePhoto(id, t && t.t === 'photo' ? t.id : null);
    });
    // pinch/wheel to zoom while cropping
    wrap.addEventListener('wheel', function (ev) { var e = selEl(); if (!S.crop || !e || e.t !== 'photo') return; ev.preventDefault(); e.crop = e.crop || { z: 1, cx: .5, cy: .5 }; e.crop.z = Math.max(1, Math.min(4, (e.crop.z || 1) * (ev.deltaY < 0 ? 1.06 : 0.94))); draw(); clearTimeout(S.wt); S.wt = setTimeout(function () { commit(); drawThumb(S.cur); }, 300); var zr = $('#peZoom'); if (zr) zr.value = e.crop.z; }, { passive: false });
  }

  /* contextual toolbar for the selected element */
  function ctxBar() {
    var bar = el$.ctx, e = selEl();
    if (!e) { bar.hidden = true; return; }
    var h = '';
    if (e.t === 'photo') {
      if (S.crop) h = '<label class="pe-zoom">Zoom <input type="range" id="peZoom" min="1" max="4" step="0.01" value="' + ((e.crop && e.crop.z) || 1) + '"></label><button data-a="done" class="pe-done">Done</button>';
      else h = (e.photo ? '<button data-a="crop">' + I.crop + '<span>Crop</span></button><button data-a="replace">' + I.swap + '<span>Replace</span></button>' : '<button data-a="replace">' + I.photo + '<span>Add photo</span></button>') +
        (e.photo ? '<button data-a="clear">' + I.x + '<span>Remove photo</span></button>' : '') + '<button data-a="front">' + I.up + '<span>To front</span></button><button data-a="del" class="pe-del">' + I.trash + '<span>Delete frame</span></button>';
    } else if (e.t === 'text') {
      h = '<button data-a="edit">' + I.edit + '<span>Edit text</span></button><button data-a="dup">' + I.dup + '<span>Duplicate</span></button><button data-a="front">' + I.up + '<span>To front</span></button><button data-a="del" class="pe-del">' + I.trash + '<span>Delete</span></button>';
    } else {
      h = '<button data-a="flip">' + I.flip + '<span>Flip</span></button><button data-a="dup">' + I.dup + '<span>Duplicate</span></button><button data-a="front">' + I.up + '<span>To front</span></button><button data-a="del" class="pe-del">' + I.trash + '<span>Delete</span></button>';
    }
    bar.innerHTML = h; bar.hidden = false; ctxPos();
    bar.onclick = function (ev) {
      var b = ev.target.closest('[data-a]'); if (!b) return; var a = b.getAttribute('data-a'), e = selEl(); if (!e) return;
      if (a === 'crop') { S.crop = true; placeSel(); ctxBar(); hint('Drag the photo to move it inside the frame. Use the slider to zoom.'); }
      else if (a === 'done') { S.crop = false; placeSel(); ctxBar(); }
      else if (a === 'replace') { S.target = e.id; openPanel('photos'); }
      else if (a === 'clear') { e.photo = null; e.crop = { z: 1, cx: .5, cy: .5 }; commit(); draw(); drawThumb(S.cur); ctxBar(); if (S.panel === 'photos') openPanel('photos', true); }
      else if (a === 'del') removeSel();
      else if (a === 'front') { var d = doc(); d.els.splice(d.els.indexOf(e), 1); d.els.push(e); commit(); draw(); }
      else if (a === 'flip') { e.flip = !e.flip; commit(); draw(); drawThumb(S.cur); }
      else if (a === 'dup') { var c = clone(e); c.id = uid(e.t); c.x += 40; c.y += 40; clampEl(c); doc().els.push(c); commit(); select(c.id); draw(); drawThumb(S.cur); }
      else if (a === 'edit') openPanel('text');
    };
    var z = $('#peZoom');
    if (z) z.oninput = function () { e.crop = e.crop || { cx: .5, cy: .5 }; e.crop.z = +z.value; draw(); clearTimeout(S.zt); S.zt = setTimeout(function () { commit(); drawThumb(S.cur); }, 300); };
  }
  function ctxPos() {
    var bar = el$.ctx, e = selEl(); if (!e || bar.hidden) return;
    var b = bounds(e), k = S.k, wr = el$.wrap.getBoundingClientRect(), sr = el$.stage.getBoundingClientRect();
    var top = wr.top - sr.top + b.y * k - bar.offsetHeight - 12;
    if (top < 6) top = wr.top - sr.top + (b.y + b.h) * k + 12;
    if (top + bar.offsetHeight > sr.height - 6) top = Math.max(6, sr.height - bar.offsetHeight - 6);
    var left = wr.left - sr.left + (b.x + b.w / 2) * k - bar.offsetWidth / 2;
    left = Math.max(6, Math.min(sr.width - bar.offsetWidth - 6, left));
    bar.style.top = top + 'px'; bar.style.left = left + 'px';
  }
  function removeSel() {
    var d = doc(), e = selEl(); if (!e) return;
    d.els.splice(d.els.indexOf(e), 1); select(null); commit(); draw(); drawThumb(S.cur);
    if (S.panel === 'photos') openPanel('photos', true);
  }

  /* ---------------- photos ---------------- */
  function photoCount(d) { return (d.els || []).filter(function (e) { return e.t === 'photo'; }).length; }
  function usedMap() { var m = {}; [S.p.cover].concat(S.p.pages).forEach(function (d) { (d.els || []).forEach(function (e) { if (e.t === 'photo' && e.photo) m[e.photo] = (m[e.photo] || 0) + 1; }); }); return m; }
  function placePhoto(id, frameId) {
    var d = doc(), e = null;
    if (frameId) e = d.els.filter(function (x) { return x.id === frameId; })[0];
    if (!e && S.target) e = d.els.filter(function (x) { return x.id === S.target && x.t === 'photo'; })[0];
    if (!e) e = d.els.filter(function (x) { return x.t === 'photo' && !x.photo; })[0];
    if (!e) {
      if (photoCount(d) >= MAXPH) { toast('A page holds up to ' + MAXPH + ' photos. Select a photo to replace it, or go to another page.'); return; }
      if (S.cur < 0) { e = { id: uid('ph'), t: 'photo', x: 300, y: 520, w: 700, h: 820, photo: null, crop: { z: 1, cx: .5, cy: .5 }, border: 14, borderColor: '#ffffff' }; d.els.push(e); }
      else { var keep = d.els.filter(function (x) { return x.t === 'photo'; }).map(function (x) { return x.photo; }); applyLayout(d, 'twov'); var fr = d.els.filter(function (x) { return x.t === 'photo'; }); keep.forEach(function (p, i) { if (fr[i]) fr[i].photo = p; }); e = fr.filter(function (x) { return !x.photo; })[0]; }
    }
    if (!e) return;
    e.photo = id; e.crop = { z: 1, cx: 0.5, cy: 0.5 }; S.target = null;
    commit(); select(e.id); draw(); drawThumb(S.cur);
    if (S.panel === 'photos') openPanel('photos', true);
  }
  function applyLayout(d, key) {
    var L = LAYOUTS[key]; if (!L) return;
    var photos = d.els.filter(function (x) { return x.t === 'photo'; });
    var others = d.els.filter(function (x) { return x.t !== 'photo'; });
    var frames = L.f.map(function (f, i) { var old = photos[i]; return { id: old ? old.id : uid('ph'), t: 'photo', x: f[0], y: f[1], w: f[2], h: f[3], photo: old ? old.photo : null, crop: old && old.photo ? { z: 1, cx: old.crop ? old.crop.cx : .5, cy: old.crop ? old.crop.cy : .5 } : { z: 1, cx: .5, cy: .5 }, border: L.border || 0, borderColor: '#ffffff' }; });
    var lost = photos.slice(L.f.length).filter(function (x) { return x.photo; }).length;
    d.els = frames.concat(others); d.layout = key;
    return lost;
  }
  function importFiles(files) {
    files = Array.prototype.slice.call(files || []); if (!files.length) return;
    var lim = CFG.limits || { maxPhotosPerProject: 300, maxFileMB: 40, minPhotoPx: 800 };
    var room = (lim.maxPhotosPerProject || 300) - S.order.length;
    if (room <= 0) { toast('This book already has the maximum number of photos.'); return; }
    files = files.slice(0, room);
    var hashes = {}; S.order.forEach(function (id) { if (S.photos[id].hash) hashes[S.photos[id].hash] = 1; });
    var done = 0, bad = [], added = [];
    var prog = $('#peProg');
    function next(i) {
      if (i >= files.length) {
        if (prog) prog.textContent = '';
        if (added.length) toast(added.length + ' photo' + (added.length === 1 ? '' : 's') + ' added' + (bad.length ? '. ' + bad.length + ' skipped.' : '. Tap a photo to place it, or use Auto-fill.'));
        else if (bad.length) toast(bad[0]);
        if (S.panel === 'photos') openPanel('photos', true);
        return;
      }
      if (prog) prog.textContent = 'Adding ' + (i + 1) + ' of ' + files.length + '…';
      PH.importFile(files[i], { limits: lim, hashes: hashes, projectId: S.p.id, uid: uid }).then(function (r) {
        return ST.savePhoto(r.meta, r.blobs).then(function () {
          hashes[r.meta.hash] = 1; S.photos[r.meta.id] = r.meta; S.order.push(r.meta.id); added.push(r.meta.id);
          urls[r.meta.id] = URL.createObjectURL(r.blobs.prev); thumbs[r.meta.id] = URL.createObjectURL(r.blobs.thumb);
        });
      }).catch(function (e) { bad.push(e.message || 'A file could not be added.'); }).then(function () { done++; if (S.panel === 'photos' && done % 4 === 0) openPanel('photos', true); next(i + 1); });
    }
    next(0);
  }
  function autofill() {
    var used = usedMap(), free = S.order.filter(function (id) { return !used[id]; });
    if (!free.length) { toast(S.order.length ? 'All your photos are already in the book.' : 'Add some photos first.'); return; }
    var n = 0;
    for (var i = 0; i < S.p.pages.length && free.length; i++) {
      var d = S.p.pages[i];
      var frames = d.els.filter(function (e) { return e.t === 'photo'; });
      if (frames.some(function (f) { return f.photo; })) { frames.forEach(function (f) { if (!f.photo && free.length) { f.photo = free.shift(); n++; } }); continue; }
      if (!frames.length && d.els.length) continue;
      if (frames.length && (d.layout !== 'one' || d.els.some(function (e) { return e.t !== 'photo'; }))) { frames.forEach(function (f) { if (free.length) { f.photo = free.shift(); n++; } }); continue; }
      var a = S.photos[free[0]], b = S.photos[free[1]];
      var landA = a && a.w > a.h * 1.1, landB = b && b.w > b.h * 1.1;
      if (landA && landB) applyLayout(d, 'twov');
      else if (landA) applyLayout(d, 'land');
      else applyLayout(d, i % 5 === 2 ? 'full' : 'one');
      d.els.filter(function (e) { return e.t === 'photo'; }).forEach(function (f) { if (free.length) { f.photo = free.shift(); n++; } });
    }
    commit(); if (innerWidth < 900) S.panel = null; renderAll(); if (innerWidth < 900) openPanel(null);
    toast(n + ' photo' + (n === 1 ? '' : 's') + ' placed' + (free.length ? '. ' + free.length + ' left: add pages to fit them.' : '.'));
  }

  /* ---------------- panels ---------------- */
  function bindRail() {
    $('#peRail').addEventListener('click', function (ev) { var b = ev.target.closest('[data-panel]'); if (!b) return; var p = b.getAttribute('data-panel'); openPanel(S.panel === p && innerWidth < 900 ? null : p); });
    el$.file.addEventListener('change', function () { importFiles(this.files); this.value = ''; });
  }
  function openPanel(name, keepScroll) {
    var P = el$.panel, sc = P.scrollTop;
    S.panel = name;
    document.querySelectorAll('#peRail [data-panel]').forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-panel') === name); });
    el$.pe.classList.toggle('has-panel', !!name);
    if (!name) { P.innerHTML = ''; setTimeout(fit, 0); return; }
    var head = function (t, sub) { return '<div class="pe-ph"><div><h3>' + t + '</h3>' + (sub ? '<p>' + sub + '</p>' : '') + '</div><button class="pe-ib pe-ph__x" data-close aria-label="Close">' + I.x + '</button></div>'; };
    var h = '';
    if (name === 'photos') {
      var used = usedMap();
      h = head('Photos', S.target ? 'Choose a photo for the selected frame.' : 'Tap a photo to place it on this page' + (innerWidth > 900 ? ', or drag it onto a frame.' : '.')) +
        '<div class="pe-row"><button class="btn btn--p btn--sm" data-act="add">' + I.plus + ' Add photos</button>' + (S.order.length ? '<button class="btn btn--ghost btn--sm" data-act="auto">Auto-fill pages</button>' : '') + '</div><p class="pe-prog" id="peProg"></p>' +
        (S.order.length ? '<div class="pe-photos">' + S.order.map(function (id) { var m = S.photos[id]; return '<button class="pe-thumb" draggable="true" data-ph="' + id + '" title="' + esc(m.name) + '"><img alt="" data-src="' + id + '">' + (used[id] ? '<span class="pe-used">' + used[id] + '</span>' : '') + (m.low ? '<span class="pe-low" title="Small photo: it may look soft in print">Low res</span>' : '') + '</button>'; }).join('') + '</div>' :
          '<div class="pe-emptyp">' + I.photo + '<p>Your photos stay on this device while you design. JPEG, PNG or WebP.</p></div>');
    } else if (name === 'layouts') {
      if (S.cur < 0) h = head('Layouts', 'Layouts are for the inside pages. Choose a page below the cover.') + '<div class="pe-row"><button class="btn btn--dark btn--sm" data-act="page1">Go to page 1</button></div>';
      else h = head('Page layout', 'One or two photos per page. You can still move and resize them.') + '<div class="pe-layouts">' + Object.keys(LAYOUTS).map(function (k) {
        var L = LAYOUTS[k]; return '<button class="pe-lay' + (doc().layout === k ? ' is-on' : '') + '" data-lay="' + k + '" title="' + L.n + '"><svg viewBox="0 0 120 160">' + L.f.map(function (f) { return '<rect x="' + f[0] / 10 + '" y="' + f[1] / 10 + '" width="' + f[2] / 10 + '" height="' + f[3] / 10 + '" rx="1.5"/>'; }).join('') + '</svg><span>' + L.n + '</span></button>';
      }).join('') + '</div>' +
        '<div class="pe-sub"><h4>Pages</h4><div class="pe-row"><button class="btn btn--ghost btn--sm" data-act="addpages">' + I.plus + ' Add 2 pages</button><button class="btn btn--ghost btn--sm" data-act="delpage">' + I.trash + ' Remove this page</button></div><div class="pe-row"><button class="btn btn--ghost btn--sm" data-act="mvl">' + I.left + ' Move earlier</button><button class="btn btn--ghost btn--sm" data-act="mvr">Move later ' + I.right + '</button></div></div>';
    } else if (name === 'text') {
      var e = selEl(), isText = e && e.t === 'text';
      h = head(isText ? 'Edit text' : 'Text', isText ? '' : 'Add a heading or a caption, then drag it into place.');
      if (isText) {
        h += '<textarea class="pe-ta" id="peTa" rows="' + (e.role === 'title' ? 1 : 3) + '">' + esc(e.text) + '</textarea>' +
          '<div class="pe-sub"><h4>Font</h4><div class="pe-fonts">' + Object.keys(R.FONTS).map(function (k) { var f = R.FONTS[k]; return '<button data-font="' + k + '" class="' + (e.font === k ? 'is-on' : '') + '" style="font-family:' + esc(f.css) + ';font-weight:' + f.w + (f.italic ? ';font-style:italic' : '') + '">' + esc(f.name) + '</button>'; }).join('') + '</div></div>' +
          '<div class="pe-sub"><h4>Colour</h4>' + swatches('tcolor', e.color) + '</div>' +
          '<div class="pe-sub"><h4>Size</h4><input type="range" id="peTs" min="18" max="320" value="' + Math.round(e.cap ? e.cap : (e.size || 80) * 0.7) + '"></div>' +
          '<div class="pe-sub"><h4>Alignment</h4><div class="pe-seg">' + [['left', 'Left'], ['center', 'Centre'], ['right', 'Right'], ['fill', 'Fill width']].map(function (a) { return '<button data-align="' + a[0] + '"' + ((e.align || 'left') === a[0] ? ' class="is-on"' : '') + '>' + a[1] + '</button>'; }).join('') + '</div></div>' +
          '<div class="pe-row"><button class="btn btn--ghost btn--sm" data-act="shadow">' + (e.shadow ? 'Remove shadow' : 'Add shadow') + '</button><button class="btn btn--ghost btn--sm" data-act="deltext">' + I.trash + ' Delete</button></div>';
      } else {
        h += '<div class="pe-addtext"><button data-add="h"><b style="font-family:' + R.FONTS.spartan.css + ';font-weight:800;font-size:1.5rem">ADD A HEADING</b></button><button data-add="s"><b style="font-family:' + R.FONTS.serif.css + ';font-size:1.25rem">Add a subheading</b></button><button data-add="c"><span style="font-family:' + R.FONTS.sans.css + '">Add a caption</span></button><button data-add="q"><span style="font-family:' + R.FONTS.script.css + ';font-size:1.4rem">Add a handwritten note</span></button></div>';
        if (S.cur < 0) { var t = C.TPL[S.p.tpl]; if (t && t.kind === 'raster') h += rasterNote(t); }
      }
    } else if (name === 'stickers') {
      h = head('Stickers', 'Tap to add, then drag and resize.') + '<label class="pe-q"><input type="search" id="peSq" placeholder="Search stickers: heart, safari, beach…"></label><div class="pe-stk" id="peStk">' + stickerGrid('') + '</div>';
    } else if (name === 'colors') {
      var d = doc(), isCov = S.cur < 0, tt = isCov && C.TPL[S.p.tpl];
      h = head(isCov ? 'Cover colours' : 'Page colour');
      if (isCov && tt && tt.kind === 'raster' && !d.edited) h += '<p class="pe-note">This cover’s colours are part of its artwork. Edit the title on the Cover tab to change the words and their colour.</p>';
      else h += '<div class="pe-sub"><h4>Background</h4>' + swatches('bg', d.bg) + '</div>';
      if (isCov) {
        var tEl = d.els.filter(function (x) { return x.role === 'title'; })[0], sEl = d.els.filter(function (x) { return x.role === 'sub'; })[0];
        if (tEl) h += '<div class="pe-sub"><h4>Title</h4>' + swatches('title', tEl.color) + '</div>';
        if (sEl) h += '<div class="pe-sub"><h4>Subtitle</h4>' + swatches('sub', sEl.color) + '</div>';
        if (!d.ownBrand) h += '<div class="pe-sub"><h4>CIEL AFRICA mark</h4><div class="pe-sw">' + uniq([tEl && tEl.color, sEl && sEl.color, '#ffffff', '#141414']).map(function (c) { return '<button style="--c:' + c + '" data-k="brand" data-c="' + c + '"' + (c === d.brand ? ' class="is-on"' : '') + ' aria-label="' + c + '"></button>'; }).join('') + '</div><p class="pe-note">Its size and place stay the same on every book.</p></div>';
      } else h += '<div class="pe-row"><button class="btn btn--ghost btn--sm" data-act="bgall">Use this colour on every page</button></div>';
    } else if (name === 'cover') {
      var t2 = C.TPL[S.p.tpl], cov = S.p.cover;
      h = head('Cover', S.cur < 0 ? 'Edit the words, colours and stickers. The preview shows your book.' : '') + '<canvas class="pe-mockp" id="peMockP" width="550" height="710" aria-label="Book preview"></canvas>';
      if (S.cur >= 0) h += '<div class="pe-row"><button class="btn btn--dark btn--sm" data-act="gocover">Edit the cover</button></div>';
      h += '<div class="pe-curcover"><img alt="" src="' + (t2 ? PBK.mockSrc(t2, S.p.pal) : PBK.mockSrc('blank', 0)) + '"><div><b>' + esc(t2 ? t2.name : 'Blank cover') + '</b><span>' + esc(t2 ? (C.cat(t2.cat) || {}).name || '' : 'Your own design') + '</span><button class="btn btn--ghost btn--sm" data-act="change">Change cover</button></div></div>';
      if (t2 && t2.kind === 'vector') h += '<div class="pe-sub"><h4>Colour options</h4><div class="pe-sw pe-sw--big">' + t2.palettes.map(function (p, i) { return '<button style="--c:' + p[0] + ';--d:' + p[1] + '" data-pal="' + i + '"' + (i === S.p.pal ? ' class="is-on"' : '') + ' aria-label="Colour option ' + (i + 1) + '"></button>'; }).join('') + '</div></div>';
      if (S.p.tpl === 'blank') h += '<div class="pe-sub"><h4>Colour</h4><div class="pe-sw pe-sw--big">' + C.BLANK.map(function (c, i) { return '<button style="--c:' + c + '" data-blank="' + i + '"' + (cov.bg === c ? ' class="is-on"' : '') + '></button>'; }).join('') + '</div></div>';
      if (t2 && t2.kind === 'raster') h += rasterNote(t2);
      var tE = cov.els.filter(function (x) { return x.role === 'title'; })[0], sE = cov.els.filter(function (x) { return x.role === 'sub'; })[0];
      if (tE) h += '<div class="pe-sub"><h4>Title</h4><input class="pe-in" data-role="title" value="' + esc(tE.text) + '" maxlength="40"></div>';
      if (sE) h += '<div class="pe-sub"><h4>Subtitle</h4><input class="pe-in" data-role="sub" value="' + esc(sE.text) + '" maxlength="40"></div>';
      h += '<div class="pe-sub"><h4>Add to the cover</h4><div class="pe-row"><button class="btn btn--ghost btn--sm" data-act="covphoto">' + I.photo + ' A photo</button><button class="btn btn--ghost btn--sm" data-go-panel="stickers">' + I.sticker + ' Stickers</button><button class="btn btn--ghost btn--sm" data-go-panel="text">' + I.text + ' Text</button></div></div>' +
        '<p class="pe-note">' + I.lock + ' The small CIEL AFRICA mark always stays at the bottom of the cover.</p>';
    }
    P.innerHTML = h;
    if (keepScroll) P.scrollTop = sc;
    bindPanel(name);
    setTimeout(fit, 0);
    if (name === 'cover') mockSoon();
    if (name === 'photos') P.querySelectorAll('img[data-src]').forEach(function (im) { thumbUrl(im.getAttribute('data-src')).then(function (u) { if (u) im.src = u; }); });
  }
  function rasterNote(t) {
    if (S.p.cover.edited) return '<p class="pe-note">Type a new title or subtitle below. The artwork and the CIEL AFRICA mark stay as they are.</p><div class="pe-row"><button class="btn btn--ghost btn--sm" data-act="orig">Back to the original lettering</button></div>';
    if (t.editable) return '<div class="pe-sub"><h4>Words on the cover</h4><p class="pe-note">Change the place name or add a year. The artwork stays the same.</p><button class="btn btn--dark btn--sm" data-act="edittitle">' + I.edit + ' Edit the title</button></div>';
    return '<p class="pe-note">This cover’s lettering is part of its artwork and can’t be changed. You can still add stickers, text or a photo.</p>';
  }
  function uniq(a) { var o = []; a.forEach(function (x) { if (x && o.indexOf(x) < 0) o.push(x); }); return o; }
  function swatches(k, cur) {
    var list = uniq([cur].concat(COLORS));
    return '<div class="pe-sw">' + list.map(function (c) { return '<button style="--c:' + c + '" data-k="' + k + '" data-c="' + c + '"' + (String(c).toLowerCase() === String(cur).toLowerCase() ? ' class="is-on"' : '') + ' aria-label="' + c + '"></button>'; }).join('') + '<label class="pe-sw__more" title="More colours"><input type="color" data-k="' + k + '" value="' + (/^#[0-9a-f]{6}$/i.test(cur) ? cur : '#ffffff') + '">+</label></div>';
  }
  function stickerGrid(q) {
    q = (q || '').toLowerCase().trim();
    return A.list().filter(function (a) { return !q || (a.n + ' ' + a.k).toLowerCase().indexOf(q) >= 0; }).map(function (a) { return '<button data-art="' + a.id + '" title="' + esc(a.n) + '"><img alt="' + esc(a.n) + '" loading="lazy" src="' + R.artSrc(a.id) + '"></button>'; }).join('') || '<p class="pe-note">No sticker matches. Try “heart”, “sun” or “Kenya”.</p>';
  }
  function bindPanel(name) {
    var P = el$.panel;
    P.onclick = function (ev) {
      var t = ev.target;
      if (t.closest('[data-close]')) { openPanel(null); return; }
      var gp = t.closest('[data-go-panel]'); if (gp) { openPanel(gp.getAttribute('data-go-panel')); return; }
      var act = t.closest('[data-act]'); if (act) return doAct(act.getAttribute('data-act'));
      var ph = t.closest('[data-ph]'); if (ph) return placePhoto(ph.getAttribute('data-ph'), S.target || (selEl() && selEl().t === 'photo' ? S.sel : null));
      var lay = t.closest('[data-lay]'); if (lay) { var lost = applyLayout(doc(), lay.getAttribute('data-lay')); select(null); commit(); draw(); drawThumb(S.cur); openPanel('layouts', true); if (lost) toast('One photo was taken off this page. It is still in your photos.'); return; }
      var art = t.closest('[data-art]'); if (art) return addArt(art.getAttribute('data-art'));
      var add = t.closest('[data-add]'); if (add) return addText(add.getAttribute('data-add'));
      var f = t.closest('[data-font]'); if (f) { var e = selEl(); if (e) { e.font = f.getAttribute('data-font'); delete e.weight; commit(); draw(); drawThumb(S.cur); openPanel('text', true); } return; }
      var al = t.closest('[data-align]'); if (al) { var e2 = selEl(); if (e2) { e2.align = al.getAttribute('data-align'); commit(); draw(); openPanel('text', true); } return; }
      var sw = t.closest('[data-c][data-k]'); if (sw) return setColor(sw.getAttribute('data-k'), sw.getAttribute('data-c'));
      var pal = t.closest('[data-pal]'); if (pal) return setPalette(+pal.getAttribute('data-pal'));
      var bl = t.closest('[data-blank]'); if (bl) { var c = C.BLANK[+bl.getAttribute('data-blank')]; S.p.cover.bg = c; var dark = C.luminance(c) < 0.45; S.p.cover.brand = dark ? '#ffffff' : '#1d1d1f'; S.p.cover.els.forEach(function (x) { if (x.role === 'title') x.color = dark ? '#ffffff' : '#1d1d1f'; if (x.role === 'sub') x.color = dark ? '#ffd25e' : '#e5383b'; }); commit(); renderAll(); return; }
    };
    P.querySelectorAll('input[type=color][data-k]').forEach(function (inp) { inp.addEventListener('input', function () { setColor(inp.getAttribute('data-k'), inp.value, true); }); inp.addEventListener('change', function () { commit(); openPanel(S.panel, true); }); });
    P.querySelectorAll('[data-ph]').forEach(function (b) { b.addEventListener('dragstart', function (ev) { ev.dataTransfer.setData('text/pbk-photo', b.getAttribute('data-ph')); ev.dataTransfer.effectAllowed = 'copy'; }); });
    var ta = $('#peTa', P);
    if (ta) {
      ta.addEventListener('input', function () { var e = selEl(); if (!e) return; e.text = e.role === 'title' || e.role === 'sub' ? ta.value.replace(/\n/g, ' ') : ta.value; draw(); });
      ta.addEventListener('change', function () { commit(); drawThumb(S.cur); syncCoverInputs(); });
      if (innerWidth > 900) ta.focus();
    }
    var ts = $('#peTs', P);
    if (ts) { ts.addEventListener('input', function () { var e = selEl(); if (!e) return; var v = +ts.value; if (e.cap) e.cap = v; else e.size = v / 0.7; if (e.align === 'fill' && e.cap) e.w = Math.max(e.w, 200); clampEl(e); draw(); }); ts.addEventListener('change', function () { commit(); drawThumb(S.cur); }); }
    var sq = $('#peSq', P); if (sq) sq.addEventListener('input', function () { $('#peStk').innerHTML = stickerGrid(sq.value); });
    P.querySelectorAll('.pe-in[data-role]').forEach(function (inp) {
      inp.addEventListener('focus', function () { ensureEditable(); });
      inp.addEventListener('input', function () { ensureEditable(); var e = S.p.cover.els.filter(function (x) { return x.role === inp.getAttribute('data-role'); })[0]; if (e) { e.text = inp.value.toUpperCase(); if (S.cur !== -1) go(-1); draw(); } });
      inp.addEventListener('change', function () { commit(); drawThumb(-1); });
    });
  }
  function syncCoverInputs() { document.querySelectorAll('.pe-in[data-role]').forEach(function (inp) { var e = S.p.cover.els.filter(function (x) { return x.role === inp.getAttribute('data-role'); })[0]; if (e && document.activeElement !== inp) inp.value = e.text; }); }
  function ensureEditable() {
    var t = C.TPL[S.p.tpl], cov = S.p.cover;
    if (!t || t.kind !== 'raster' || cov.edited || !t.editable) return;
    var nd = C.rasterDoc(t, true);
    nd.els = nd.els.concat(cov.els.filter(function (x) { return x.role !== 'title' && x.role !== 'sub'; }));
    S.p.cover = nd; commit();
  }
  function doAct(a) {
    if (a === 'add') el$.file.click();
    else if (a === 'auto') autofill();
    else if (a === 'page1') go(0);
    else if (a === 'gocover') go(-1);
    else if (a === 'addpages') addPages();
    else if (a === 'delpage') delPage();
    else if (a === 'mvl' || a === 'mvr') movePage(a === 'mvl' ? -1 : 1);
    else if (a === 'deltext') removeSel();
    else if (a === 'shadow') { var e = selEl(); if (e) { e.shadow = e.shadow ? 0 : 1; commit(); draw(); openPanel('text', true); } }
    else if (a === 'bgall') { var c = doc().bg; S.p.pages.forEach(function (p) { p.bg = c; }); commit(); renderAll(); toast('Every page now uses this colour.'); }
    else if (a === 'change') PBK.pick(C.TPL[S.p.tpl] ? C.TPL[S.p.tpl].cat : 'all', changeCover);
    else if (a === 'edittitle') { ensureEditable(); go(-1); var te = S.p.cover.els.filter(function (x) { return x.role === 'title'; })[0]; if (te) select(te.id); openPanel('text'); }
    else if (a === 'orig') { var t = C.TPL[S.p.tpl]; var nd = C.rasterDoc(t, false); nd.els = S.p.cover.els.filter(function (x) { return x.role !== 'title' && x.role !== 'sub'; }); S.p.cover = nd; select(null); commit(); renderAll(); }
    else if (a === 'covphoto') { go(-1); var d = S.p.cover; var has = d.els.filter(function (x) { return x.t === 'photo'; }).length; if (has >= MAXPH) { toast('The cover holds up to ' + MAXPH + ' photos.'); return; } var e2 = { id: uid('ph'), t: 'photo', x: 330, y: 500, w: 640, h: 800, photo: null, crop: { z: 1, cx: .5, cy: .5 }, border: 14, borderColor: '#ffffff' }; d.els.push(e2); commit(); select(e2.id); S.target = e2.id; draw(); openPanel('photos'); }
  }
  function changeCover(id, c) {
    var keep = S.p.cover.els.filter(function (x) { return x.t === 'photo' && x.photo; });
    var nd = C.docFor(id, c); nd.els = nd.els.concat(keep);
    S.p.cover = nd; S.p.tpl = id; S.p.pal = c;
    if (/photo book$/.test(S.p.name) || S.p.name === 'My photo book') { var t = C.TPL[id]; S.p.name = t ? t.name + ' photo book' : 'My photo book'; $('#peName').value = S.p.name; }
    select(null); commit(); go(-1); renderAll();
  }
  function setPalette(i) {
    var t = C.TPL[S.p.tpl]; if (!t || t.kind !== 'vector') return;
    var p = t.palettes[i]; S.p.pal = i;
    var d = S.p.cover; d.bg = p[0]; d.brand = p[3] || p[1];
    d.els.forEach(function (e) { if (e.role === 'title') e.color = p[1]; if (e.role === 'sub') e.color = p[2]; });
    commit(); renderAll();
  }
  function setColor(k, c, live) {
    var d = doc();
    if (k === 'bg') d.bg = c;
    else if (k === 'brand') d.brand = c;
    else if (k === 'title' || k === 'sub') { ensureEditable(); S.p.cover.els.forEach(function (e) { if (e.role === k) e.color = c; }); }
    else if (k === 'tcolor') { var e = selEl(); if (e) e.color = c; }
    if (live) { draw(); return; }
    commit(); draw(); drawThumb(S.cur); openPanel(S.panel, true);
  }
  function addArt(id) {
    var a = A.all[id], b = a.b.split(' ').map(Number), s = 380 / Math.max(b[0], b[1]);
    var d = doc(), e = { id: uid('art'), t: 'art', art: id, w: b[0] * s, h: b[1] * s };
    e.x = (S.cur < 0 ? 650 : 600) - e.w / 2; e.y = (S.cur < 0 ? 900 : 800) - e.h / 2;
    clampEl(e); d.els.push(e); commit(); select(e.id); draw(); drawThumb(S.cur);
    if (innerWidth < 900) openPanel(null);
  }
  function addText(kind) {
    var d = doc(), dark = C.luminance(d.bg || '#ffffff') < 0.45, col = dark ? '#ffffff' : '#1d1d1f';
    var e = { id: uid('tx'), t: 'text', x: 140, w: 920, color: col };
    if (kind === 'h') Object.assign(e, { text: 'HEADING', font: 'spartan', cap: 110, align: 'center', y: 640 });
    else if (kind === 's') Object.assign(e, { text: 'A subheading', font: 'serif', size: 90, align: 'center', y: 700 });
    else if (kind === 'c') Object.assign(e, { text: 'A caption for this page', font: 'sans', size: 44, align: 'center', y: S.cur < 0 ? 1300 : 1460, x: 140 });
    else Object.assign(e, { text: 'A little note', font: 'script', size: 96, align: 'center', y: 760 });
    if (S.cur >= 0 && kind === 'c') { e.x = 90; e.w = 1020; }
    clampEl(e); d.els.push(e); commit(); select(e.id); draw(); drawThumb(S.cur); openPanel('text');
  }

  /* ---------------- pages ---------------- */
  function go(i) {
    i = Math.max(-1, Math.min(S.p.pages.length - 1, i));
    if (i === S.cur) return;
    S.cur = i; S.sel = null; S.crop = false; S.target = null;
    draw(); ctxBar(); drawStripSel();
    if (S.panel && S.panel !== 'photos' && S.panel !== 'stickers') openPanel(S.panel, false);
  }
  function addPages() {
    if (S.p.pages.length + 2 > BOOK.pages.max) { toast('A book can have up to ' + BOOK.pages.max + ' pages.'); return; }
    S.p.pages.splice(S.cur + 1, 0, pageDoc('one'), pageDoc('one')); commit(); drawStrip(); drawInfo(); go(S.cur + 1);
  }
  function delPage() {
    if (S.cur < 0) return;
    if (S.p.pages.length - 1 < BOOK.pages.min) { toast('A book needs at least ' + BOOK.pages.min + ' pages. Add pages first, or leave this one blank.'); return; }
    S.p.pages.splice(S.cur, 1);
    if (S.p.pages.length % 2) S.p.pages.push(pageDoc('one'));
    commit(); var c = Math.min(S.cur, S.p.pages.length - 1); S.cur = -2; drawStrip(); drawInfo(); go(c);
    toast('Page removed. Books always have an even number of pages.');
  }
  function movePage(dir) {
    var i = S.cur, j = i + dir; if (i < 0 || j < 0 || j >= S.p.pages.length) return;
    var t = S.p.pages[i]; S.p.pages[i] = S.p.pages[j]; S.p.pages[j] = t; commit(); S.cur = j; drawStrip(); draw(); drawStripSel();
  }
  function drawInfo() {
    var n = S.p.pages.length;
    $('#pePages').textContent = n + ' pages';
    $('#pePrice').textContent = PBK.priceLabel(n);
  }
  function bindStrip() {
    el$.strip.addEventListener('click', function (ev) { var b = ev.target.closest('[data-pg]'); if (b) go(+b.getAttribute('data-pg')); var a = ev.target.closest('[data-addpg]'); if (a) { S.cur = S.p.pages.length - 1; addPages(); } });
    $('#pePgPrev').addEventListener('click', function () { go(S.cur - 1); });
    $('#pePgNext').addEventListener('click', function () { go(S.cur + 1); });
  }
  function drawStrip() {
    var h = '<button class="pe-pg pe-pg--cover" data-pg="-1"><canvas width="96" height="128"></canvas><span>Cover</span></button>';
    for (var i = 0; i < S.p.pages.length; i++) {
      if (i % 2 === 0) h += '<span class="pe-spread">';
      h += '<button class="pe-pg" data-pg="' + i + '"><canvas width="96" height="128"></canvas><span>' + (i + 1) + '</span></button>';
      if (i % 2 === 1 || i === S.p.pages.length - 1) h += '</span>';
    }
    h += '<button class="pe-pg pe-pg--add" data-addpg aria-label="Add pages">' + I.plus + '<span>Add</span></button>';
    el$.strip.innerHTML = h;
    drawStripSel();
    var all = [-1]; for (var j = 0; j < S.p.pages.length; j++) all.push(j);
    var k = 0; (function step() { if (k >= all.length) return; drawThumb(all[k++]); setTimeout(step, 16); })();
  }
  function drawStripSel() {
    el$.strip.querySelectorAll('[data-pg]').forEach(function (b) { b.classList.toggle('is-on', +b.getAttribute('data-pg') === S.cur); });
    var on = el$.strip.querySelector('.is-on'); if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest', inline: 'center' });
    $('#pePgLbl').textContent = S.cur < 0 ? 'Cover' : 'Page ' + (S.cur + 1) + ' of ' + S.p.pages.length;
  }
  var thumbT = {};
  function drawThumb(i) {
    clearTimeout(thumbT[i]);
    thumbT[i] = setTimeout(function () {
      var b = el$.strip.querySelector('[data-pg="' + i + '"] canvas'); if (!b) return;
      var d = i < 0 ? S.p.cover : S.p.pages[i]; if (!d) return;
      R.load(d, { photo: photoUrl }).then(function () { var g = b.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 96, 128); R.draw(g, d, { scale: 96 / W, photo: photoUrl, empty: 'soft' }); });
    }, i === S.cur ? 120 : 0);
  }

  /* ---------------- preview (flip through) ---------------- */
  var pdlg;
  function preview() {
    select(null);
    if (!pdlg) { pdlg = document.createElement('dialog'); pdlg.className = 'pe-pv'; document.body.appendChild(pdlg); pdlg.addEventListener('click', function (e) { if (e.target === pdlg) pdlg.close(); }); }
    var spreads = [['cover']], n = S.p.pages.length;
    var mobile = innerWidth < 760;
    if (mobile) for (var i = 0; i < n; i++) spreads.push([i]);
    else { spreads.push([null, 0]); for (var j = 1; j < n; j += 2) spreads.push(j + 1 < n ? [j, j + 1] : [j, null]); }
    var at = 0;
    pdlg.innerHTML = '<div class="pe-pv__in"><header><h3>' + esc(S.p.name) + '</h3><span id="pvLbl"></span><button class="pe-ib" data-x aria-label="Close preview">' + I.x + '</button></header><div class="pe-pv__stage" id="pvStage"></div><footer><button class="pe-ib" data-p aria-label="Previous">' + I.left + '</button><input type="range" id="pvR" min="0" max="' + (spreads.length - 1) + '" value="0" aria-label="Page"><button class="pe-ib" data-n aria-label="Next">' + I.right + '</button></footer></div>';
    var stage = $('#pvStage', pdlg);
    function show() {
      var s = spreads[at];
      $('#pvLbl', pdlg).textContent = s[0] === 'cover' ? 'Cover' : s.filter(function (x) { return x != null; }).map(function (x) { return x + 1; }).join(' – ') + ' of ' + n;
      $('#pvR', pdlg).value = at;
      stage.innerHTML = '';
      if (s[0] === 'cover') {
        var c = document.createElement('canvas'); c.className = 'pv-cover'; c.width = 550; c.height = 710; stage.appendChild(c);
        Promise.all([R.mockMap(), R.toCanvas(S.p.cover, 900, { photo: photoUrl })]).then(function (r) { c.getContext('2d').drawImage(R.mock(r[1], r[0]), 0, 0); });
        return;
      }
      var sp = document.createElement('div'); sp.className = 'pv-spread' + (s.length === 1 ? ' is-single' : ''); stage.appendChild(sp);
      s.forEach(function (pi) {
        var c = document.createElement('canvas'); c.width = 600; c.height = 800; c.className = 'pv-page' + (pi == null ? ' is-blank' : ''); sp.appendChild(c);
        if (pi == null) { var g = c.getContext('2d'); g.fillStyle = '#f3efe7'; g.fillRect(0, 0, 600, 800); return; }
        R.toCanvas(S.p.pages[pi], 600, { photo: photoUrl, empty: 'soft' }).then(function (cv) { c.getContext('2d').drawImage(cv, 0, 0); });
      });
    }
    pdlg.onclick = function (e) { if (e.target.closest('[data-x]')) pdlg.close(); if (e.target.closest('[data-p]')) { at = Math.max(0, at - 1); show(); } if (e.target.closest('[data-n]')) { at = Math.min(spreads.length - 1, at + 1); show(); } };
    $('#pvR', pdlg).oninput = function () { at = +this.value; show(); };
    pdlg.onkeydown = function (e) { if (e.key === 'ArrowRight') { at = Math.min(spreads.length - 1, at + 1); show(); } if (e.key === 'ArrowLeft') { at = Math.max(0, at - 1); show(); } };
    var sx = null; stage.addEventListener('pointerdown', function (e) { sx = e.clientX; }); stage.addEventListener('pointerup', function (e) { if (sx == null) return; var dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 40) { at = Math.max(0, Math.min(spreads.length - 1, at + (dx < 0 ? 1 : -1))); show(); } });
    show(); pdlg.showModal();
  }

  /* ---------------- order / finish ---------------- */
  var odlg;
  function checks() {
    var empty = 0, emptyPages = 0, low = 0, used = usedMap();
    S.p.pages.forEach(function (d) { var fr = d.els.filter(function (e) { return e.t === 'photo'; }); var filled = fr.filter(function (e) { return e.photo; }).length; empty += fr.length - filled; if (!filled && !d.els.some(function (e) { return e.t !== 'photo'; })) emptyPages++; });
    Object.keys(used).forEach(function (id) { if (S.photos[id] && S.photos[id].low) low++; });
    return { empty: empty, emptyPages: emptyPages, low: low };
  }
  function order() {
    select(null);
    if (!odlg) { odlg = document.createElement('dialog'); odlg.className = 'pe-or'; document.body.appendChild(odlg); odlg.addEventListener('click', function (e) { if (e.target === odlg) odlg.close(); }); }
    var n = S.p.pages.length, c = checks(), t = C.TPL[S.p.tpl], pr = PBK.price(n);
    var msg = 'Hello Ciel Africa, I’d like to order a photo book.\nBook: ' + S.p.name + '\nCover: ' + (t ? t.name : 'Blank cover') + '\nPages: ' + n + '\nSize: ' + (BOOK.size || '21 × 28 cm') + ' portrait';
    odlg.innerHTML = '<div class="pe-or__in"><header><h3>Your book</h3><button class="pe-ib" data-x aria-label="Close">' + I.x + '</button></header>' +
      '<div class="pe-or__body"><canvas width="550" height="710" id="orCov"></canvas><div><dl><dt>Book</dt><dd>' + esc(S.p.name) + '</dd><dt>Cover</dt><dd>' + esc(t ? t.name : 'Blank cover') + '</dd><dt>Format</dt><dd>' + esc((BOOK.binding || 'Hardcover') + ', ' + (BOOK.size || '21 × 28 cm') + ' portrait') + '</dd><dt>Pages</dt><dd>' + n + '</dd><dt>Price</dt><dd><b>' + esc(PBK.priceLabel(n)) + '</b></dd></dl>' +
      ((c.empty || c.emptyPages || c.low) ? '<div class="pe-or__warn"><b>Before you order</b><ul>' + (c.emptyPages ? '<li>' + c.emptyPages + ' page' + (c.emptyPages === 1 ? ' is' : 's are') + ' still empty.</li>' : '') + (c.empty - c.emptyPages * 1 > 0 ? '<li>Some photo frames are empty. Empty frames print as blank space.</li>' : '') + (c.low ? '<li>' + c.low + ' small photo' + (c.low === 1 ? '' : 's') + ' may look soft in print.</li>' : '') + '</ul></div>' : '<p class="pe-or__ok">Every page has content.</p>') +
      (BOOK.ordering && pr != null ? '' : '<p class="pe-note">Online ordering and payment aren’t open yet' + (pr == null ? ' and prices are being finalised' : '') + '. Your book is saved on this device. Send us a message to order it, and we’ll tell you how to send the print file.</p>') +
      '<div class="pe-or__acts"><a class="btn btn--p" target="_blank" rel="noopener" href="https://wa.me/254706549703?text=' + encodeURIComponent(msg) + '">Ask to order on WhatsApp</a><button class="btn btn--ghost" data-pdf>Download print PDF</button></div><p class="pe-prog" id="orProg"></p></div></div></div>';
    odlg.onclick = function (e) { if (e.target.closest('[data-x]')) odlg.close(); if (e.target.closest('[data-pdf]')) exportPdf(); };
    Promise.all([R.mockMap(), R.toCanvas(S.p.cover, 900, { photo: photoUrl })]).then(function (r) { $('#orCov', odlg).getContext('2d').drawImage(R.mock(r[1], r[0]), 0, 0); });
    odlg.showModal();
  }
  function js(src) { return new Promise(function (ok, no) { if (document.querySelector('script[src="' + src + '"]')) return ok(); var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = function () { no(new Error('Could not load the PDF tool. Check your connection.')); }; document.head.appendChild(s); }); }
  function exportPdf() {
    var prog = $('#orProg', odlg), btn = odlg.querySelector('[data-pdf]');
    btn.disabled = true; prog.textContent = 'Preparing…';
    var PX = 1654; /* 200 dpi at 21 cm */
    var mmPt = 72 / 25.4, pw = (BOOK.trimW || 210) * mmPt, ph = (BOOK.trimH || 280) * mmPt;
    js('/assets/vendor/pdf-lib-1.17.1.min.js').then(function () {
      var L = window.PDFLib; return L.PDFDocument.create().then(function (pdf) {
        pdf.setTitle(S.p.name); pdf.setCreator('Ciel Africa Photo Books'); pdf.setProducer('cielafrica.com');
        var docs = [S.p.cover].concat(S.p.pages), i = 0, orig = {};
        function origUrl(id) { return orig[id] || urls[id]; }
        function one() {
          if (i >= docs.length) return pdf.save();
          prog.textContent = 'Page ' + (i === 0 ? 'cover' : i) + ' of ' + (docs.length - 1) + '…';
          var d = docs[i++];
          var ids = (d.els || []).filter(function (e) { return e.t === 'photo' && e.photo; }).map(function (e) { return e.photo; });
          return Promise.all(ids.map(function (id) { return ST.blob(id, 'orig').then(function (b) { if (b) orig[id] = URL.createObjectURL(b); }); })).then(function () {
            return R.toCanvas(d, PX, { photo: origUrl, empty: 'none' });
          }).then(function (cv) {
            return new Promise(function (ok) { cv.toBlob(ok, 'image/jpeg', 0.92); });
          }).then(function (b) { return b.arrayBuffer(); }).then(function (buf) { return pdf.embedJpg(buf); }).then(function (img) {
            var page = pdf.addPage([pw, ph]); page.drawImage(img, { x: 0, y: 0, width: pw, height: ph });
            ids.forEach(function (id) { if (orig[id]) { URL.revokeObjectURL(orig[id]); delete orig[id]; } });
            return one();
          });
        }
        return one();
      });
    }).then(function (bytes) {
      var blob = new Blob([bytes], { type: 'application/pdf' }), a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = (S.p.name || 'photo-book').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase() + '.pdf';
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 60000);
      prog.textContent = 'Downloaded: cover + ' + S.p.pages.length + ' pages, ' + (BOOK.size || '21 × 28 cm') + '.';
      btn.disabled = false;
    }).catch(function (e) { prog.textContent = e.message || 'The PDF could not be made.'; btn.disabled = false; });
  }

  window.PBKEditor = { open: open, LAYOUTS: LAYOUTS };
})();
