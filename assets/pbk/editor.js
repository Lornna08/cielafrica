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
  var W = R.W, H = R.H, BRAND_TOP = H - 100, MAXPH = Math.max(12, BOOK.maxPhotosPerPage || 0);
  /* A4 page (1200 × 1697): positions designed for the old 1600-high page are moved with ay() */
  var KY = H / (R.LEGACY_H || 1600);
  function ay(v) { return v * KY; }

  var LAYOUTS = {
    one: { n: 'One photo', f: [[90, 90, 1020, H - 270]] },
    full: { n: 'Full page', f: [[0, 0, 1200, H]] },
    land: { n: 'Landscape', f: [[90, ay(420) + 40, 1020, 765]] },
    square: { n: 'Square', f: [[150, ay(260) + 30, 900, 900]] },
    twov: { n: 'Two, stacked', f: [[90, 90, 1020, 735], [90, 865, 1020, 735]] },
    twoh: { n: 'Two, side by side', f: [[90, ay(330), 495, 900], [615, ay(330), 495, 900]] },
    collage: { n: 'Two, overlapping', f: [[90, 110, 690, 935], [430, 880, 680, 720]], border: 14 },
    bigsmall: { n: 'Big and small', f: [[0, 0, 1200, 1075], [640, 1125, 470, 470]] },
    three: { n: 'Three', f: [[90, 90, 1020, 760], [90, 880, 495, 727], [615, 880, 495, 727]] },
    threev: { n: 'Three, stacked', f: [[90, 90, 1020, 487], [90, 605, 1020, 487], [90, 1120, 1020, 487]] },
    four: { n: 'Four', f: [[90, 90, 495, 744], [615, 90, 495, 744], [90, 864, 495, 744], [615, 864, 495, 744]] },
    six: { n: 'Six', f: [[90, 90, 495, 485], [615, 90, 495, 485], [90, 605, 495, 485], [615, 605, 495, 485], [90, 1120, 495, 485], [615, 1120, 495, 485]] },
    fullduo: { n: 'Two, full bleed', f: [[0, 0, 1200, 846], [0, 851, 1200, 846]] },
    polaroid: { n: 'Framed', f: [[170, 200, 860, 1060]], border: 40 },
    wide: { n: 'Wide, edge to edge', f: [[0, 300, 1200, 900]] },
    twop: { n: 'Two portraits', f: [[90, 500, 495, 660], [615, 500, 495, 660]] },
    lp: { n: 'Wide and tall', f: [[90, 90, 1020, 700], [308, 820, 583, 777]] },
    threel: { n: 'Three wide', f: [[90, 260, 1020, 765], [90, 1055, 495, 371], [615, 1055, 495, 371]] },
    threep: { n: 'Three tall', f: [[90, 443, 600, 800], [720, 443, 390, 385], [720, 858, 390, 385]] },
    fourl: { n: 'Four wide', f: [[90, 408, 495, 420], [615, 408, 495, 420], [90, 858, 495, 420], [615, 858, 495, 420]] },
    five: { n: 'Five', f: [[90, 90, 1020, 520], [90, 640, 495, 462], [615, 640, 495, 462], [90, 1132, 495, 462], [615, 1132, 495, 462]] }
  };
  var COLORS = ['#ffffff', '#faf6ef', '#f4ecdf', '#fbd3dc', '#ffe27a', '#86d6e8', '#c8e6c9', '#cfe8ff', '#e5383b', '#ff4f9a', '#ff7a2e', '#2f80ed', '#0f5c3a', '#1f3c74', '#3b2314', '#141414'];

  var S = {}; /* editor state */
  var el$ = {};
  function uid(p) { return (p || 'x') + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function $(s, r) { return (r || document).querySelector(s); }
  function toast(msg, kind) { if (window.CielNote) return CielNote(msg, kind ? { kind: kind } : null); var t = el$.toast; t.textContent = msg; t.classList.add('is-on'); clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove('is-on'); }, 2600); }

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
    wand: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4V2M15 10V8M11 6h2M17 6h2M4 20L14 10"/><path d="M19 13l.7 1.3L21 15l-1.3.7L19 17l-.7-1.3L17 15l1.3-.7z"/></svg>',
    frame: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M12 9v6M9 12h6"/></svg>',
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
    lock: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    lockb: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    unlock: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/></svg>',
    reset: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>',
    copy: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>',
    paste: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>',
    brush: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/><path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z"/></svg>',
    align: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><rect width="14" height="6" x="5" y="5" rx="1"/><rect width="10" height="6" x="7" y="13" rx="1"/></svg>',
    group: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><path d="M14 4h6v6M4 14v6h6"/></svg>',
    ungroup: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/></svg>',
    selmore: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M12 8v8M8 12h8"/></svg>',
    clock: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>',
    fill: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9V5a2 2 0 0 1 2-2h4M15 3h4a2 2 0 0 1 2 2v4M21 15v4a2 2 0 0 1-2 2h-4M9 21H5a2 2 0 0 1-2-2v-4"/></svg>',
    palette: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r="1"/><circle cx="17.5" cy="10.5" r="1"/><circle cx="8.5" cy="7.5" r="1"/><circle cx="6.5" cy="12.5" r="1"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.6-.7 1.6-1.7 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.9.7-1.7 1.7-1.7H16c3.1 0 5.6-2.5 5.6-5.6C21.9 6 17.5 2 12 2z"/></svg>',
    down: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>',
    grid: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>'
  };

  /* ---------------- project ---------------- */
  function pageDoc(layout) {
    var L = LAYOUTS[layout] || LAYOUTS.one;
    return { kind: 'page', bg: '#ffffff', layout: layout, els: L.f.map(function (f, i) { return { id: 'ph' + (i + 1), t: 'photo', x: f[0], y: f[1], w: f[2], h: f[3], photo: null, crop: { z: 1, cx: 0.5, cy: 0.5 }, border: L.border || 0 }; }) };
  }
  function newProject(tid, pal, pages, cu) {
    var t = tid === 'blank' ? null : C.TPL[tid];
    var cover = C.customDoc(tid, pal, cu) || C.blankDoc(C.BLANK[0]);
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
  var saveT, FIX = null;
  function save() {
    if (!S.p) return;
    if (S.ro) { el$.saved.textContent = 'Open in another tab'; return; }
    var vs = S.p.versions || [];
    if (!vs.length || Date.now() - vs[vs.length - 1].at > 10 * 60e3) checkpoint('Autosaved');
    el$.saved.textContent = 'Saving…';
    clearTimeout(saveT);
    saveT = setTimeout(function () {
      ST.saveProject(S.p).then(function () { remember(); var t = new Date(); el$.saved.textContent = 'Saved ' + t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); el$.saved.classList.add('is-ok'); }, function (e) { el$.saved.textContent = 'Not saved'; toast(e.message || 'Could not save'); });
    }, 500);
  }
  /* ---------- earlier versions of the whole book ---------- */
  function checkpoint(label) { if (!S.p || !S.last) return; var vs = S.p.versions = S.p.versions || []; vs.push({ at: Date.now(), label: label, pages: S.p.pages.length, data: S.last }); while (vs.length > 12) vs.shift(); }
  var vdlg;
  function versions() {
    select(null);
    if (!vdlg) { vdlg = document.createElement('dialog'); vdlg.className = 'pe-pc'; document.body.appendChild(vdlg); vdlg.addEventListener('click', function (e) { if (e.target === vdlg) vdlg.close(); }); }
    var vs = (S.p.versions || []).slice().reverse();
    vdlg.innerHTML = '<div class="pe-pc__in"><header><h3>Earlier versions</h3><button class="pe-ib" data-x aria-label="Close">' + I.x + '</button></header><p class="pe-note">Your book is saved as you work. Every 10 minutes, and before big changes, a copy is kept here so you can go back.</p>' +
      (vs.length ? '<div class="pe-vers">' + vs.map(function (v, i) { return '<div><span><b>' + new Date(v.at).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' }) + '</b><small>' + esc(v.label || '') + ' · ' + v.pages + ' pages</small></span><button class="btn btn--ghost btn--sm" data-v="' + (vs.length - 1 - i) + '">Restore</button></div>'; }).join('') + '</div>' : '<p class="pe-note">No earlier versions yet. They appear as you work.</p>') + '</div>';
    vdlg.querySelector('[data-x]').onclick = function () { vdlg.close(); };
    vdlg.querySelectorAll('[data-v]').forEach(function (b) { b.onclick = function () {
      var v = S.p.versions[+b.getAttribute('data-v')]; if (!v || !confirm('Go back to the version from ' + new Date(v.at).toLocaleString() + '? What you have now is kept as another version.')) return;
      checkpoint('Before restoring'); restore(v.data); S.cur = Math.min(S.cur, S.p.pages.length); commit(); vdlg.close(); drawStrip(); drawInfo(); fit(); mockSoon(); toast('Earlier version restored. Tap ↶ to undo.');
    }; });
    if (!vdlg.open) vdlg.showModal();
  }
  /* ---------- the same book open in two tabs: only the newest one saves ---------- */
  var bc = null, tabId = Math.random().toString(36).slice(2);
  function claim() {
    try { bc = bc || new BroadcastChannel('pbk-edit'); } catch (e) { return; }
    bc.onmessage = function (m) {
      var d = m.data || {}; if (!S.p || d.id !== S.p.id || d.tab === tabId) return;
      if (d.type === 'open') { flush(); S.ro = true; roBar(); bc.postMessage({ type: 'here', id: S.p.id, tab: tabId }); }
    };
    S.ro = false; var rb = $('#peRo'); if (rb) rb.remove();
    bc.postMessage({ type: 'open', id: S.p.id, tab: tabId });
  }
  function roBar() {
    if ($('#peRo')) return;
    var b = document.createElement('div'); b.id = 'peRo'; b.className = 'pe-ro';
    b.innerHTML = '<div><b>This book is open in another tab.</b><span>Changes here won’t be saved, so nothing is overwritten. Close this tab, or continue here instead.</span></div><button class="btn btn--p btn--sm">Continue here</button>';
    b.querySelector('button').onclick = function () { ST.project(S.p.id).then(function (fresh) { if (fresh) { S.p = fresh; S.last = snap(); S.undo = []; S.redo = []; } claim(); drawStrip(); drawInfo(); fit(); updUndo(); toast('You’re editing here now. The other tab stopped saving.'); }); };
    el$.pe.appendChild(b);
  }
  /* the "Back to my book" button on every page of the site (assets/js/site.js) reads this */
  var lastT;
  function remember() {
    if (!S || !S.p) return;
    var p = S.p, o = { kind: 'book', id: p.id, name: p.name || 'My photo book', at: Date.now() };
    try { if (JSON.parse(localStorage.getItem('pbk_ordered') || '{}')[p.id]) return; } catch (e) { }
    try { var old = JSON.parse(localStorage.getItem('pbk_last') || 'null'); if (old && old.id === p.id && old.img) o.img = old.img; localStorage.setItem('pbk_last', JSON.stringify(o)); } catch (e) { }
    clearTimeout(lastT);
    lastT = setTimeout(function () {
      if (!S || !S.p || S.p.id !== o.id || !R.toCanvas) return;
      R.load(S.p.cover, { photo: photoUrl }).then(function () { return R.toCanvas(S.p.cover, 72, { photo: photoUrl, empty: 'none' }); }).then(function (c) {
        o.img = c.toDataURL('image/jpeg', 0.7); try { localStorage.setItem('pbk_last', JSON.stringify(o)); } catch (e) { }
      }).catch(function () { });
    }, 1500);
  }
  /* ---------- corrections Ciel Africa opened for a placed order ---------- */
  function fixMode() {
    var pu = FIX, b = $('#peOrder');
    b.textContent = 'Send corrected book'; b.classList.add('pe-fixbtn');
    var n = document.createElement('div'); n.className = 'pe-fixnote'; n.setAttribute('role', 'status');
    n.innerHTML = '<div><b>Correcting order ' + esc(pu.ref) + '</b>' + (pu.fix.note ? '<span>“' + esc(pu.fix.note) + '”</span>' : '<span>Make your changes, then tap Send corrected book.</span>') + '<small>Keep ' + pu.pages + ' pages · open until ' + new Date(pu.fix.until).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }) + '</small></div><button aria-label="Hide">×</button>';
    n.querySelector('button').onclick = function () { n.remove(); };
    $('#pe').appendChild(n);
    b.addEventListener('click', function () {
      if (S.p.pages.length !== pu.pages) { toast('Your order is for ' + pu.pages + ' pages. This book has ' + S.p.pages.length + ': add or remove pages first.'); return; }
      if (!confirm('Send the corrected book to Ciel Africa now? After this it can’t be changed again unless we reopen it.')) return;
      clearTimeout(saveT);
      var ov = document.createElement('div'); ov.className = 'pe-fixsend'; ov.innerHTML = '<div><b>Sending your corrected book</b><p id="fxP">Preparing pages…</p><div class="pe-fixbar"><i id="fxB"></i></div><p class="pe-fixsend__m">Keep this page open until it finishes.</p></div>';
      document.body.appendChild(ov);
      ST.saveProject(S.p).then(function () {
        return PBKShop.sendPages(pu, function (d, t) { $('#fxP', ov).textContent = 'Sending ' + Math.min(d, t) + ' of ' + t + '…'; $('#fxB', ov).style.width = Math.round(d / t * 100) + '%'; }, pu.fix);
      }).then(function () {
        ov.innerHTML = '<div><b>Corrected book sent ✓</b><p>Thank you! Ciel Africa will check it before printing. Your first version is kept too.</p><a class="btn btn--p" data-go href="' + BASE + '/track?ref=' + encodeURIComponent(pu.ref) + '">Track my order</a></div>';
        ov.querySelector('a').addEventListener('click', function () { ov.remove(); });
      }, function (e) {
        ov.innerHTML = '<div><b>Not sent yet</b><p>' + esc(e.message || 'Something went wrong.') + '</p><p class="pe-fixsend__m">Pages already sent are kept: tap Send corrected book again to finish.</p><button class="btn btn--p">OK</button></div>';
        ov.querySelector('button').onclick = function () { ov.remove(); };
      });
    });
  }
  function flush() { if (!S || !S.p) return; clearTimeout(saveT); ST.saveProject(S.p).catch(function () {}); }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden' && document.body.classList.contains('pbk-editing')) flush(); });
  window.addEventListener('pagehide', function () { if (document.body.classList.contains('pbk-editing')) flush(); });
  function snap() { return JSON.stringify({ cover: S.p.cover, pages: S.p.pages, back: S.p.back || null, spine: S.p.spine || null }); }
  function commit() { if (S.p && S.cur != null) drawThumb(S.cur); S.undo.push(S.last); if (S.undo.length > 60) S.undo.shift(); S.redo = []; S.last = snap(); save(); updUndo(); }
  function restore(js) { var o = JSON.parse(js); S.p.cover = o.cover; S.p.pages = o.pages; if (o.back) S.p.back = o.back; else delete S.p.back; if (o.spine) S.p.spine = o.spine; else delete S.p.spine; S.last = js; if (S.cur > S.p.pages.length) S.cur = S.p.pages.length; S.sel = null; save(); updUndo(); renderAll(); }
  function undo() { if (!S.undo.length) return; S.redo.push(S.last); restore(S.undo.pop()); }
  function redo() { if (!S.redo.length) return; S.undo.push(S.last); restore(S.redo.pop()); }
  function updUndo() { el$.undo.disabled = !S.undo.length; el$.redo.disabled = !S.redo.length; }

  function isBack(i) { return (i == null ? S.cur : i) >= S.p.pages.length; }
  function backDoc() { if (!S.p.back && window.PBKShop) S.p.back = PBKShop.backDoc(S.p); return S.p.back; }
  function docAt(i) { return i < 0 ? S.p.cover : i >= S.p.pages.length ? backDoc() : S.p.pages[i]; }
  function doc() { return docAt(S.cur); }
  /* ---- the whole cover: back · spine · front side by side (like a printed cover sheet) ---- */
  function isCoverIdx(i) { i = i == null ? S.cur : i; return i < 0 || i >= S.p.pages.length; }
  function isWrap(i) { return isCoverIdx(i) && S.cview === 'wrap'; }
  /** the spine on its own, turned to read left to right and made as big as the screen allows */
  function isSpineV() { return isCoverIdx() && S.cview === 'spine'; }
  function spU() { return R.spineUnits(S.p.pages.length); }
  /** the hinge (the groove where the cover bends) each side of the spine, and everything between back and front */
  /* the hinges are a printing detail (the case-cover file adds them from the cover's edges): the editor shows
     back · spine · front, so the whole space between the spine's folds is the spine */
  function hgU() { return 0; }
  function midU() { return spU() + 2 * hgU(); }
  /** where the side being edited starts inside the whole-cover view (document units) */
  function ox() { return isWrap() ? (S.cur < 0 ? W + midU() : 0) : 0; }
  function spineOpts() { return window.PBKShop && PBKShop.spineOf ? PBKShop.spineOf(S.p) : C.spineFor(S.p.cover, S.p.tpl, S.p.pal); }
  /** which part of the whole cover is under x (units from the left edge): -1 front, 'spine', or the back cover index */
  function sideAt(x) { var m = midU(), e = Math.max(0, (70 - m) / 2); return x < W - e ? S.p.pages.length : x > W + m + e ? -1 : 'spine'; }
  function selEl() { var d = doc(); return S.sel ? (d.els || []).filter(function (e) { return e.id === S.sel; })[0] : null; }

  /* ---------------- open ---------------- */
  function open(main) {
    document.body.classList.add('pbk-editing');
    document.title = 'Design your photo book — Ciel Africa';
    main.innerHTML = '<div class="pe" id="pe"><div class="pe-load">Opening your book…</div></div>';
    if (!ST || !PH) { main.innerHTML = '<div class="pe-err wrap"><h2>This browser can’t store your book</h2><p>Try a recent version of Chrome, Safari or Edge, and turn off private browsing.</p></div>'; return; }
    var q = new URLSearchParams(location.search);
    var pid = q.get('p'); FIX = null;
    var ready = pid ? ST.project(pid).then(function (p) { if (!p || p.app !== 'pbk') throw new Error('missing'); return p; }) :
      Promise.resolve().then(function () {
        var t = q.get('t') || 'blank'; if (t !== 'blank' && !C.TPL[t]) t = 'blank';
        var cu = {}; ['title', 'sub', 'bg', 'tc', 'sc', 'year', 'sh', 'stk'].forEach(function (k) { var v = q.get(k); if (v) cu[k] = k === 'bg' || k === 'tc' || k === 'sc' ? (/^#[0-9a-f]{6}$/i.test(v) ? v : null) : k === 'stk' ? (/^(tr|ph):[a-z0-9-]{1,60}$/.test(v) ? v : null) : v.slice(0, 40); });
        var p = newProject(t, +q.get('c') || 0, +q.get('n') || 0, cu);
        return ST.saveProject(p).then(function () { history.replaceState({}, '', BASE + '/design?p=' + p.id); return p; });
      });
    /* a printed book whose pages were sent can't be changed any more */
    var sentP = pid && window.PBKShop ? PBKShop.purchases().then(function (l) { var fx = l.filter(function (pu) { return pu.projectId === pid && PBKShop.fixActive(pu); })[0]; if (fx) { FIX = fx; return null; } return l.filter(function (pu) { return pu.projectId === pid && pu.product === 'print' && (pu.done || (pu.sent && pu.sent.print && pu.sent.print.length)); })[0] || null; }, function () { return null; }) : Promise.resolve(null);
    ready = Promise.all([ready, sentP]).then(function (r) {
      if (r[1]) { var pu = r[1]; main.innerHTML = '<div class="pe-err wrap pe-sentlock"><h2>This book has been sent to print</h2><p>Order <b>' + esc(pu.ref) + '</b> is with Ciel Africa, so it can’t be edited any more. Need a change? Talk to us on WhatsApp and we’ll help.</p><p><a class="btn btn--p" target="_blank" rel="noopener" href="https://wa.me/254706549703?text=' + encodeURIComponent('Hello Ciel Africa, I need help with my photo book order ' + pu.ref) + '">WhatsApp support</a> <a class="btn btn--ghost" data-go href="' + BASE + '/my-books?order=' + encodeURIComponent(pu.ref) + '">View my book</a></p></div>'; throw new Error('sent'); }
      return r[0];
    });
    ready.then(function (p) {
      /* books made before the A4 switch move to A4 now (same photos, words and stickers) */
      [p.cover].concat(p.pages).concat(p.back ? [p.back] : []).forEach(function (d) { R.toA4(d); });
      C.fixCover(p.cover, p.tpl);
      /* older books on a layered travel cover that was never customised: make its words and artwork movable now */
      var tl = C.TPL[p.tpl];
      if (tl && tl.kind === 'raster' && tl.layered && tl.editable && !p.cover.edited) {
        var nd = C.rasterDoc(tl, true), oy = (p.cover.els || []).filter(function (x) { return x.role === 'year'; })[0];
        if (oy) nd.els.forEach(function (x) { if (x.role === 'year') { x.text = oy.text; x.shadow = oy.shadow; } });
        nd.els = nd.els.concat((p.cover.els || []).filter(function (x) { return x.role !== 'title' && x.role !== 'sub' && x.role !== 'year'; }));
        R.toA4(nd); p.cover = nd;
      }
      S = { p: p, cur: -1, sel: null, undo: [], redo: [], last: null, photos: {}, order: [], stickers: [], panel: null, crop: false };
      if (p.lastPage != null && !q.get('go')) S.cur = Math.max(-1, Math.min(p.pages.length, p.lastPage));
      S.last = snap(); S.go = q.get('go');
      return ST.photos(p.id).then(function (list) {
        list.sort(function (a, b) { return (a.taken || '').localeCompare(b.taken || '') || a.added - b.added; });
        list.forEach(function (m) { S.photos[m.id] = m; if (m.mask) return; if (m.sticker) S.stickers.push(m.id); else S.order.push(m.id); });
        return loadPhotoUrls(list);
      });
    }).then(function () {
      build(main); claim();
      ST.persist();
      remember();
    }).catch(function (e) {
      if (e && e.message === 'sent') return;
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
      '<div class="pe-top__r"><button class="pe-ib pe-delbook" id="peDel" aria-label="Delete this book" title="Delete this book">' + I.trash + '</button><button class="pe-ib" id="peUndo" aria-label="Undo" title="Undo">' + I.undo + '</button><button class="pe-ib" id="peRedo" aria-label="Redo" title="Redo">' + I.redo + '</button><button class="pe-ib" id="peHist" aria-label="Earlier versions" title="Earlier versions">' + I.clock + '</button>' +
      '<button class="btn btn--ghost btn--sm pe-prevbtn" id="pePrev">' + I.eye + '<span>Preview</span></button><button class="btn btn--p btn--sm" id="peOrder">Order</button></div></header>' +
      '<div class="pe-body">' +
      '<nav class="pe-rail" id="peRail" aria-label="Tools">' +
      [['cover', I.cover, 'Cover'], ['photos', I.photo, 'Photos'], ['layouts', I.layout, 'Layouts'], ['text', I.text, 'Text'], ['stickers', I.sticker, 'Stickers'], ['colors', I.color, 'Colours']].map(function (b) { return '<button data-panel="' + b[0] + '">' + b[1] + '<span>' + b[2] + '</span></button>'; }).join('') +
      '</nav>' +
      '<aside class="pe-panel" id="pePanel" aria-live="polite"></aside>' +
      '<main class="pe-stage" id="peStage"><div class="pe-cvtabs" id="peCvTabs" role="tablist" aria-label="Cover view" hidden><button data-cv="wrap">Whole cover</button><button data-cv="front">Front</button><button data-cv="back">Back</button><button data-cv="spine">Spine</button></div><div class="pe-canvaswrap" id="peWrap"><div class="pe-wraplbl" id="peWrapLbl" hidden><span>Back cover</span><span data-sp>Spine</span><span>Front cover</span></div><canvas id="peCanvas"></canvas><div class="pe-hinge" id="peHinge" title="Spine side"></div><div class="pe-brand" id="peBrand">' + I.lock + '</div><div class="pe-sel" id="peSel" hidden><i data-h="nw"></i><i data-h="ne"></i><i data-h="sw"></i><i data-h="se"></i></div></div>' +
      '<div class="pe-ctx" id="peCtx" hidden></div>' +
      '<div class="pe-mock" id="peMock"><span>Your book</span><div class="pe-rot" id="peRotBox"><div class="pe-rot__b" id="peRot"><canvas class="pe-rot__f"></canvas><canvas class="pe-rot__k"></canvas><canvas class="pe-rot__s"></canvas><i class="pe-rot__p"></i><i class="pe-rot__t"></i><i class="pe-rot__u"></i></div></div><canvas id="peMockC" width="550" height="710" hidden></canvas></div>' +
      '<div class="pe-hint" id="peHint"></div></main>' +
      '</div>' +
      '<footer class="pe-strip"><div class="pe-strip__nav"><button class="pe-ib" id="pePgPrev" aria-label="Previous page">' + I.left + '</button><span id="pePgLbl"></span><button class="pe-ib" id="pePgNext" aria-label="Next page">' + I.right + '</button></div><div class="pe-strip__list" id="peStrip"></div><button class="pe-ib pe-gridbtn" id="peGrid" title="See all pages" aria-label="See all pages">' + I.grid + '</button><button class="pe-strip__info" id="pePgCount" title="Change the number of pages"><span id="pePages"></span><b id="pePrice"></b></button></footer>' +
      '<div class="pe-toast" id="peToast" role="status"></div>' +
      '<input type="file" id="peFile" accept="' + (PH.accept || 'image/*') + '" multiple hidden><input type="file" id="peSFile" accept="image/png,image/webp,image/jpeg" hidden>';
    el$ = { pe: pe, canvas: $('#peCanvas', pe), wrap: $('#peWrap', pe), sel: $('#peSel', pe), ctx: $('#peCtx', pe), panel: $('#pePanel', pe), strip: $('#peStrip', pe), toast: $('#peToast', pe), saved: $('#peSaved', pe), undo: $('#peUndo', pe), redo: $('#peRedo', pe), mock: $('#peMockC', pe), mockBox: $('#peMock', pe), stage: $('#peStage', pe), file: $('#peFile', pe), sfile: $('#peSFile', pe), hint: $('#peHint', pe) };
    el$.g = el$.canvas.getContext('2d');
    el$.guides = document.createElement('div'); el$.guides.className = 'pe-guides'; el$.wrap.appendChild(el$.guides);
    el$.msel = document.createElement('div'); el$.msel.className = 'pe-msel'; el$.wrap.appendChild(el$.msel);
    el$.panel.addEventListener('pointerdown', function () { if (el$.pe.classList.contains('is-peek')) { el$.pe.classList.remove('is-peek'); setTimeout(fit, 300); } }, true);
    bindTop(); bindRail(); bindCanvas(); bindStrip(); bindPhotoDrag(el$.panel);
    if (S.cview == null) S.cview = 'wrap';
    $('#peCvTabs', pe).addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-cv]'); if (!b) return; var v = b.getAttribute('data-cv');
      S.cview = v === 'wrap' || v === 'spine' ? v : 'single'; S.sel = null; S.crop = false;
      if (v === 'front' || v === 'spine') S.cur = -1; else if (v === 'back') S.cur = S.p.pages.length;
      if (v === 'spine') { fit(); ctxBar(); drawStripSel(); openPanel('spine'); return; }
      fit(); ctxBar(); drawStripSel(); if (S.panel && S.panel !== 'photos' && S.panel !== 'stickers') openPanel(S.panel, false);
    });
    R.loadFonts().then(function () { renderAll(); });
    renderAll();
    window.addEventListener('resize', fit);
    document.addEventListener('keydown', keys);
    openPanel(S.go === 'photos' ? 'photos' : S.go === 'cover' ? 'cover' : innerWidth > 900 ? 'cover' : null);
    if (S.go === 'cover') setTimeout(function () { hint('Tap anything on the cover to change it: words, colours, artwork.'); }, 700);
    else if (!S.order.length) setTimeout(function () { hint('Add as many photos as you like: we’ll arrange them for you.'); }, 900);
  }
  /* tips show once per device: after that people know how it works */
  function seenTip(t) { try { var k = 'pbk_tips', l = JSON.parse(localStorage.getItem(k) || '[]'); if (l.indexOf(t) >= 0) return true; l.push(t); localStorage.setItem(k, JSON.stringify(l.slice(-60))); } catch (e) { } return false; }
  function tip(t) { if (!seenTip(t)) toast(t, 'tip'); }
  function hint(t) { if (seenTip(t)) return; if (window.CielNote) return CielNote(t, { kind: 'tip' }); var h = el$.hint; if (!h) return; h.textContent = t; h.classList.add('is-on'); clearTimeout(h._t); h._t = setTimeout(function () { h.classList.remove('is-on'); }, 6000); }

  function bindTop() {
    $('#peName').addEventListener('input', function () { S.p.name = this.value.slice(0, 60); save(); });
    el$.undo.addEventListener('click', undo); el$.redo.addEventListener('click', redo); updUndo();
    $('#pePrev').addEventListener('click', preview);
    $('#peHist').addEventListener('click', versions);
    $('#peDel').addEventListener('click', deleteBook);
    if (FIX) fixMode(); else $('#peOrder').addEventListener('click', order);
  }
  function keys(e) {
    if (!document.body.classList.contains('pbk-editing')) { document.removeEventListener('keydown', keys); return; }
    if (document.querySelector('dialog[open]')) return;
    var tag = (e.target.tagName || '').toLowerCase(); if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
    else if ((e.key === 'Delete' || e.key === 'Backspace') && S.sel) { e.preventDefault(); if (S.multi) removeMany(); else removeSel(); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && S.sel) { e.preventDefault(); copySel(); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v' && S.clip) { e.preventDefault(); paste(); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && S.sel) { e.preventDefault(); duplicate(); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g' && S.sel) { e.preventDefault(); e.shiftKey ? ungroup() : group(); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a' && !isWrap()) { e.preventDefault(); var all = (doc().els || []).filter(function (x) { return !x.role && !x.lock; }).map(function (x) { return x.id; }); if (all.length) selectMany(all); }
    else if (/^Arrow/.test(e.key) && S.sel) { e.preventDefault(); var st = e.shiftKey ? 20 : 4, ddx = e.key === 'ArrowLeft' ? -st : e.key === 'ArrowRight' ? st : 0, ddy = e.key === 'ArrowUp' ? -st : e.key === 'ArrowDown' ? st : 0; selEls().forEach(function (x) { if (!x.lock) { x.x += ddx; x.y += ddy; } }); clearTimeout(S.nt); S.nt = setTimeout(commit, 400); draw(); placeSel(); }
    else if (e.key === 'Escape') { S.crop = false; S.pick = false; select(null); }
    else if (e.key === 'ArrowRight' && !S.sel) go(S.cur + 1);
    else if (e.key === 'ArrowLeft' && !S.sel) go(S.cur - 1);
  }

  /* ---------------- canvas & stage ---------------- */
  var dpr = Math.min(2, window.devicePixelRatio || 1);
  function fit() {
    var st = el$.stage; if (!st) return;
    var pad = innerWidth < 700 ? 18 : 40;
    var wrapV = isWrap(), cov = isCoverIdx(), TW = wrapV ? 2 * W + midU() : W;
    var mk = cov && innerWidth >= 900 ? 210 : 0, mob = cov && wrapV && innerWidth < 900 ? 150 : 0;
    var aw = st.clientWidth - pad * 2 - mk, ah = st.clientHeight - pad * 2 - (innerWidth < 700 ? 0 : 10) - (cov ? 44 : 0) - mob;
    var w = Math.max(160, Math.min(aw, ah * TW / H)), h = w * H / TW;
    if (isSpineV()) { var cs0 = getComputedStyle(st), vis = st.clientHeight - (parseFloat(cs0.paddingTop) || 0) - (parseFloat(cs0.paddingBottom) || 0) - pad - 44; h = Math.max(200, Math.min(ah, vis)); w = h * spU() / H; }
    S.k = isSpineV() ? h / H : w / TW;
    el$.wrap.style.width = w + 'px'; el$.wrap.style.height = h + 'px';
    el$.wrap.classList.toggle('is-wrap', wrapV); el$.wrap.style.marginRight = mk ? mk + 'px' : ''; el$.wrap.style.marginBottom = mob ? mob + 'px' : ''; st.classList.toggle('is-wrapv', wrapV); st.classList.toggle('is-covv', cov); el$.wrap.style.marginTop = cov ? '34px' : '';
    var tabs = $('#peCvTabs'); tabs.hidden = !cov;
    tabs.querySelectorAll('[data-cv]').forEach(function (b) { var v = b.getAttribute('data-cv'); b.classList.toggle('is-on', wrapV ? v === 'wrap' : isSpineV() ? v === 'spine' : (S.cur < 0 ? v === 'front' : v === 'back')); });
    st.classList.toggle('is-spinev', isSpineV());
    var lbl = $('#peWrapLbl'); lbl.hidden = !wrapV;
    if (wrapV) { var sp = midU(), sl = lbl.children; sl[0].style.left = '0'; sl[0].style.width = (W / TW * 100) + '%'; sl[1].style.left = (W / TW * 100) + '%'; sl[1].style.width = (sp / TW * 100) + '%'; sl[2].style.left = ((W + sp) / TW * 100) + '%'; sl[2].style.width = (W / TW * 100) + '%'; sl[1].title = 'Spine: ' + R.spineMm(S.p.pages.length) + ' mm for ' + S.p.pages.length + ' pages'; }
    if (wrapV) { lbl.children[0].classList.toggle('is-on', isBack()); lbl.children[2].classList.toggle('is-on', S.cur < 0); }
    el$.canvas.width = Math.round(w * dpr); el$.canvas.height = Math.round(h * dpr);
    el$.canvas.style.width = w + 'px'; el$.canvas.style.height = h + 'px';
    draw();
  }
  var rafId;
  function draw() {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(function () {
      if (!el$.canvas || !el$.canvas.isConnected || !S.p) return;
      var d = doc(), g = el$.g;
      if (isSpineV()) {
        var so2 = spineOpts(), su2 = spU(), k2 = S.k * dpr;
        Promise.all([R.loadFonts(), R.loadSpine(so2)]).then(function () {
          if (!isSpineV()) return;
          g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, el$.canvas.width, el$.canvas.height);
          /* upright, as it stands on a shelf: the whole spine, top to bottom */
          g.setTransform(k2, 0, 0, k2, 0, 0); R.drawSpine(g, so2, su2);
          g.setTransform(1, 0, 0, 1, 0, 0); el$.sel.hidden = true;
        });
      } else if (isWrap()) {
        var front = S.p.cover, back = backDoc(), sp = spU(), so = spineOpts(), kk = S.k * dpr;
        Promise.all([R.load(front, { photo: photoUrl }), R.load(back, { photo: photoUrl }), R.loadFonts(), R.loadSpine(so)]).then(function () {
          if (!isWrap()) return;
          g.setTransform(1, 0, 0, 1, 0, 0);
          g.clearRect(0, 0, el$.canvas.width, el$.canvas.height);
          var hg = hgU(), cv = el$.canvas, ph = cv.height;
          R.draw(g, back, { scale: kk, photo: photoUrl, empty: S.cur < 0 ? 'soft' : 'editor' });
          /* hinges: the cover's edge carries on into the groove, as it does in print */
          g.setTransform(1, 0, 0, 1, 0, 0); var bx = Math.round(W * kk); if (hg) g.drawImage(cv, bx - 2, 0, 1, ph, bx, 0, Math.ceil(hg * kk) + 1, ph);
          g.setTransform(kk, 0, 0, kk, (W + hg) * kk, 0); R.drawSpine(g, so, sp);
          g.setTransform(1, 0, 0, 1, (W + midU()) * kk, 0); R.draw(g, front, { scale: kk, photo: photoUrl, empty: S.cur < 0 ? 'editor' : 'soft' });
          g.setTransform(1, 0, 0, 1, 0, 0); var fx = Math.round((W + midU()) * kk); if (hg) g.drawImage(cv, fx + 1, 0, 1, ph, Math.floor((W + hg + sp) * kk), 0, fx - Math.floor((W + hg + sp) * kk) + 1, ph);
          /* folds: the spine edges (dashed) and the hinge edges (dotted) */
          g.setTransform(kk, 0, 0, kk, 0, 0); g.save(); g.lineWidth = 2 / S.k; g.strokeStyle = 'rgba(27,23,20,.35)';
          g.setLineDash([10, 8]); [W + hg, W + hg + sp].forEach(function (x) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); });
          g.restore();
          g.setTransform(1, 0, 0, 1, 0, 0);
          placeSel();
        });
      } else R.load(d, { photo: photoUrl }).then(function () {
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.clearRect(0, 0, el$.canvas.width, el$.canvas.height);
        R.draw(g, d, { scale: S.k * dpr, photo: photoUrl, empty: 'editor' });
        placeSel();
      });
      var isCover = S.cur < 0;
      /* front and back on their own look like the real book (the hinge groove by the spine); the whole cover is flat */
      var hg = $('#peHinge'); hg.hidden = isWrap() || isSpineV() || !isCoverIdx(); hg.classList.toggle('is-back', isBack() && !isWrap());
      $('#peBrand').hidden = !isCover || isWrap() || isSpineV();
      el$.mockBox.hidden = !isCoverIdx();
      if (isCoverIdx()) mockSoon();
    });
  }
  var mockT;
  /** The cover as a standing 3D book (canvas). */
  function book3d(cover, px, large) {
    var so = Object.assign({}, spineOpts()); if (so.hideTitle) so.title = '';
    return R.renderBook(cover, so, { pages: S.p.pages.length, photo: photoUrl, px: px || 900, large: large });
  }
  function mockSoon() {
    clearTimeout(mockT);
    mockT = setTimeout(function () {
      if (!S.p || !el$.mock || !el$.mock.isConnected) return;
      rotBook();
      book3d(S.p.cover, 900).then(function (m) {
        [el$.mock, document.getElementById('peMockP')].forEach(function (cv) { if (!cv) return; cv.width = m.width; cv.height = m.height; var x = cv.getContext('2d'); x.clearRect(0, 0, cv.width, cv.height); x.drawImage(m, 0, 0); });
      }).catch(function () {});
    }, 180);
  }
  /** the slowly turning book beside the cover: front, spine and back drawn from the design */
  function rotBook() {
    var box = $('#peRot'); if (!box || !S.p) return;
    var fw = 240, fh = Math.round(fw * H / W), su = spU(), so = spineOpts(), front = S.p.cover, back = backDoc();
    Promise.all([R.load(front, { photo: photoUrl }), R.load(back, { photo: photoUrl }), R.loadFonts(), R.loadSpine(so)]).then(function () {
      var cf = box.querySelector('.pe-rot__f'), ck = box.querySelector('.pe-rot__k'), cs = box.querySelector('.pe-rot__s');
      [cf, ck].forEach(function (c, i) { c.width = fw; c.height = fh; var g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, fw, fh); R.draw(g, i ? back : front, { scale: fw / W, photo: photoUrl, empty: 'none' }); });
      var sw = Math.max(6, Math.round(su / W * fw)); cs.width = sw; cs.height = fh; var gs = cs.getContext('2d'); gs.setTransform(sw / su, 0, 0, fh / H, 0, 0); R.drawSpine(gs, so, su);
      var vw = box.parentNode.clientWidth || 120, vh = vw * H / W, d = Math.max(9, su / W * vw * 1.6);
      box.style.setProperty('--w', vw + 'px'); box.style.setProperty('--h', vh + 'px'); box.style.setProperty('--d', d + 'px');
      box.parentNode.style.height = vh + 'px';
    }).catch(function () {});
  }
  function renderAll() { fit(); drawStrip(); drawInfo(); if (S.panel) openPanel(S.panel, true); ctxBar(); }

  /* bounds of an element in document units */
  function bounds(e) {
    if (e.t === 'text') { var L = R.layoutText(el$.g, e); var x0 = Infinity, x1 = -Infinity; L.lines.forEach(function (l) { x0 = Math.min(x0, l.x); x1 = Math.max(x1, l.x + l.w); }); if (!isFinite(x0)) { x0 = e.x; x1 = e.x + e.w; } return { x: Math.min(x0, e.x), y: e.y - L.cap * 0.18, w: Math.max(x1, e.x + e.w) - Math.min(x0, e.x), h: L.h + L.cap * 0.42 }; }
    return { x: e.x, y: e.y, w: e.w, h: e.h };
  }
  function placeSel() {
    var e = selEl(), s = el$.sel, ms = el$.msel;
    if (ms) ms.innerHTML = '';
    if (!e) { s.hidden = true; return; }
    if (S.multi) {
      var list = selEls(), u = union(list), k0 = S.k;
      s.hidden = false; s.className = 'pe-sel is-multi'; s.style.transform = '';
      s.style.left = (u.x + ox()) * k0 + 'px'; s.style.top = u.y * k0 + 'px'; s.style.width = u.w * k0 + 'px'; s.style.height = u.h * k0 + 'px';
      if (ms) ms.innerHTML = list.map(function (x) { var bb = bounds(x); return '<i style="left:' + (bb.x + ox()) * k0 + 'px;top:' + bb.y * k0 + 'px;width:' + bb.w * k0 + 'px;height:' + bb.h * k0 + 'px' + (x.rot ? ';transform:rotate(' + x.rot + 'deg)' : '') + '"></i>'; }).join('');
      ctxPos(); return;
    }
    var b = bounds(e), k = S.k;
    s.hidden = false;
    s.style.left = (b.x + ox()) * k + 'px'; s.style.top = b.y * k + 'px'; s.style.width = b.w * k + 'px'; s.style.height = b.h * k + 'px';
    s.className = 'pe-sel' + (S.crop ? ' is-crop' : '') + (e.t === 'text' ? ' is-text' : '') + (e.lock ? ' is-locked' : '');
    s.style.transform = e.rot ? 'rotate(' + e.rot + 'deg)' : '';
    ctxPos();
  }
  function hit(x, y) {
    var d = doc(), list = (d.els || []).slice().reverse();
    for (var i = 0; i < list.length; i++) { var b = bounds(list[i]); if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return list[i]; }
    return null;
  }
  function pt(ev) { var r = el$.canvas.getBoundingClientRect(); return { x: (ev.clientX - r.left) / S.k - ox(), y: (ev.clientY - r.top) / S.k }; }
  /** in the whole-cover view: the side under the pointer becomes the one being edited; the spine opens its settings */
  function pickSide(clientX) {
    if (isSpineV()) { select(null); openPanel('spine'); return false; }
    if (!isWrap()) return true;
    var r = el$.canvas.getBoundingClientRect(), sd = sideAt((clientX - r.left) / S.k);
    if (sd === 'spine') { select(null); openPanel('spine'); return false; }
    if (sd !== S.cur) { S.cur = sd; S.sel = null; S.crop = false; S.target = null; draw(); drawStripSel(); ctxBar(); if (S.panel && S.panel !== 'photos' && S.panel !== 'stickers') openPanel(S.panel, false); }
    return true;
  }
  function select(id) { if (id !== S.sel) { S.more = false; S.alignOpen = false; S.colorOpen = false; } S.sel = id; S.multi = null; if (!id) { S.crop = false; S.pick = false; } placeSel(); ctxBar(); }
  /** several elements selected at once (shift/ctrl click, "Select more", or a group) */
  function selectMany(ids) { ids = ids.filter(function (v, i) { return ids.indexOf(v) === i; }); if (ids.length < 2) return select(ids[0] || null); S.sel = ids[ids.length - 1]; S.multi = ids; S.crop = false; placeSel(); ctxBar(); }
  function selEls() { var d = doc(); if (S.multi) return (d.els || []).filter(function (e) { return S.multi.indexOf(e.id) >= 0; }); var e = selEl(); return e ? [e] : []; }
  function groupIds(e) { return e && e.g ? (doc().els || []).filter(function (x) { return x.g === e.g; }).map(function (x) { return x.id; }) : null; }
  function union(list) { var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; list.forEach(function (e) { var b = bounds(e); x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.w); y1 = Math.max(y1, b.y + b.h); }); return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }; }

  function clampEl(e) {
    var minS = 40;
    if (e.t === 'text') e.h = bounds(e).h;
    e.w = Math.max(minS, e.w || minS); e.h = Math.max(minS * 0.5, e.h || minS);
    if (!isFinite(e.x)) e.x = 140; if (!isFinite(e.y)) e.y = ay(600);
    e.x = Math.max(-e.w * 0.8, Math.min(W - e.w * 0.2, e.x));
    e.y = Math.max(-e.h * 0.8, Math.min(H - e.h * 0.2, e.y));
    if (S.cur < 0) { var b = bounds(e); if (b.y + b.h > BRAND_TOP && e.t !== 'photo') e.y -= (b.y + b.h - BRAND_TOP); if (e.t === 'photo' && e.y + e.h > BRAND_TOP) { e.h = Math.max(80, BRAND_TOP - e.y); } }
  }

  function bindCanvas() {
    var drag = null, pts = {}, pinch = null;
    var wrap = el$.wrap;
    /* tapping the empty space around the page lets go of the selection (and brings the main menu back) */
    el$.stage.addEventListener('pointerdown', function (ev) { if ((ev.target === el$.stage) && (S.sel || S.multi) && !drag && !pinch) { S.crop = false; select(null); } });
    /* two fingers: resize the selected item around its centre (or zoom the photo inside its frame while cropping) */
    function pinchStart() {
      var ids = Object.keys(pts), a = pts[ids[0]], b = pts[ids[1]], e = selEl();
      if (!e || e.lock) { var mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; e = hit(mid.x, mid.y); if (e && !e.lock) select(e.id); }
      if (drag && drag.o && drag.e) { Object.assign(drag.e, { x: drag.o.x, y: drag.o.y }); if (drag.many) drag.many.forEach(function (m) { m.e.x = m.o.x; m.e.y = m.o.y; }); }
      drag = null; guides(null);
      if (!e || e.lock) { pinch = { none: true }; return; }
      pinch = { e: e, o: clone(e), b: bounds(e), d0: Math.max(10, Math.hypot(a.x - b.x, a.y - b.y)) }; el$.pe.classList.add('is-moving');
    }
    function pinchMove() {
      var ids = Object.keys(pts); if (ids.length < 2 || !pinch || pinch.none) return;
      var a = pts[ids[0]], b = pts[ids[1]], k = Math.max(0.2, Math.min(5, Math.hypot(a.x - b.x, a.y - b.y) / pinch.d0)), e = pinch.e, o = pinch.o, b0 = pinch.b;
      if (S.crop && e.t === 'photo') { e.crop = Object.assign({ cx: .5, cy: .5 }, e.crop, { z: Math.max(1, Math.min(4, ((o.crop && o.crop.z) || 1) * k)) }); var zr = $('#peZoom'); if (zr) zr.value = e.crop.z; }
      else {
        var cx = b0.x + b0.w / 2, cy = b0.y + b0.h / 2;
        if (e.t === 'text') { if (o.cap) e.cap = Math.max(14, o.cap * k); else e.size = Math.max(14, (o.size || 80) * k); e.w = Math.max(60, o.w * k); e.x = cx - (cx - o.x) * k; e.y = cy - (cy - o.y) * k; }
        else { e.w = Math.max(40, o.w * k); e.h = Math.max(30, o.h * k); e.x = cx - e.w / 2; e.y = cy - e.h / 2; }
      }
      draw();
    }
    wrap.addEventListener('pointerdown', function (ev) {
      if (ev.pointerType === 'touch') { pts[ev.pointerId] = pt(ev); if (Object.keys(pts).length === 2) { pinchStart(); ev.preventDefault(); return; } if (Object.keys(pts).length > 2) return; }
      if (ev.button > 0) return;
      var hh = ev.target.getAttribute && ev.target.getAttribute('data-h');
      if (!hh && !pickSide(ev.clientX)) return;
      var p = pt(ev), h = hh;
      var e = selEl();
      if (S.panel === 'photos' && innerWidth < 900) openPanel(null);
      if (S.cur < 0 && !S.p.cover.edited) { var tt = C.TPL[S.p.tpl]; if (tt && tt.kind === 'raster' && tt.editable) { ensureEditable(); draw(); } }
      if (h && e && !e.lock && !S.multi) { drag = { mode: 'resize', h: h, e: e, p: p, o: clone(e), b: bounds(e) }; }
      else {
        var t = hit(p.x, p.y);
        if (S.crop && e && e.t === 'photo' && t === e) { drag = { mode: 'pan', e: e, p: p, o: clone(e) }; }
        else if (t && (ev.shiftKey || ev.ctrlKey || ev.metaKey || S.pick)) {
          /* add to (or take out of) the selection */
          var cur = S.multi ? S.multi.slice() : S.sel ? [S.sel] : [], add = groupIds(t) || [t.id];
          if (cur.indexOf(t.id) >= 0) cur = cur.filter(function (x) { return add.indexOf(x) < 0; }); else cur = cur.concat(add);
          if (cur.length) selectMany(cur); else select(null);
          return;
        }
        else if (t && S.multi && S.multi.indexOf(t.id) >= 0) {
          drag = { mode: 'move', e: t, p: p, o: clone(t), moved: false, wasSel: true, many: selEls().filter(function (x) { return !x.lock; }).map(function (x) { return { e: x, o: clone(x) }; }) };
        }
        else if (t) {
          var was = S.sel === t.id && !S.multi;
          var gi = groupIds(t);
          if (gi && gi.length > 1) { selectMany(gi); drag = { mode: 'move', e: t, p: p, o: clone(t), moved: false, wasSel: true, many: selEls().filter(function (x) { return !x.lock; }).map(function (x) { return { e: x, o: clone(x) }; }) }; wrap.setPointerCapture(ev.pointerId); ev.preventDefault(); return; }
          if (!was) { S.crop = false; select(t.id); }
          if (t.lock) { drag = null; if (was) toast('This is locked. Tap Unlock to move it.'); return; }
          drag = { mode: 'move', e: t, p: p, o: clone(t), moved: false, wasSel: was, empty: t.t === 'photo' && !t.photo };
        } else { select(null); return; }
      }
      wrap.setPointerCapture(ev.pointerId); ev.preventDefault();
    });
    wrap.addEventListener('pointermove', function (ev) {
      if (pts[ev.pointerId]) pts[ev.pointerId] = pt(ev);
      if (pinch) { pinchMove(); return; }
      if (!drag) return;
      var p = pt(ev), dx = p.x - drag.p.x, dy = p.y - drag.p.y, e = drag.e, o = drag.o;
      if (drag.mode === 'move') {
        if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 6) return;
        if (!drag.moved) el$.pe.classList.add('is-moving');
        drag.moved = true;
        if (drag.many) {
          drag.many.forEach(function (m) { m.e.x = m.o.x + dx; m.e.y = m.o.y + dy; });
          var sn = snapTo(drag.many.map(function (m) { return m.e; })); drag.many.forEach(function (m) { m.e.x += sn.dx; m.e.y += sn.dy; });
          draw(); placeSel(); return;
        }
        var movable = !e.role && e.id !== 'map' && e.id !== 'place';
        if ((e.t === 'photo' && e.photo) || (movable && e.t !== 'photo')) { var pg = stripTarget(ev.clientX, ev.clientY); drag.toPage = pg; }
        /* whole cover: drag a sticker, words or a photo across from the back to the front (or back) */
        if (isWrap() && movable) {
          var rr = el$.canvas.getBoundingClientRect(), sd = sideAt((ev.clientX - rr.left) / S.k);
          if (sd !== 'spine' && sd !== S.cur && (e.t !== 'photo' || photoCount(docAt(sd)) < MAXPH)) {
            var from = doc(), o1 = ox(); from.els.splice(from.els.indexOf(e), 1);
            S.cur = sd; var o2 = ox(); doc().els.push(e);
            var sh = o1 - o2; drag.o.x += sh; drag.p.x += sh; o = drag.o; dx = p.x - drag.p.x;
            fit(); drawStripSel(); drag.crossed = true;
          }
        }
        e.x = o.x + dx; e.y = o.y + dy;
        /* a photo held over another photo for a moment replaces it on release (like Canva) */
        if (e.t === 'photo' && e.photo) {
          var under = (doc().els || []).slice().reverse().filter(function (x) { if (x === e || x.t !== 'photo' || x.lock) return false; var bb = bounds(x); return p.x >= bb.x && p.x <= bb.x + bb.w && p.y >= bb.y && p.y <= bb.y + bb.h; })[0] || null;
          if (under !== drag.over) { drag.over = under; drag.overAt = Date.now(); drag.swap = null; clearTimeout(drag.swT); if (under) drag.swT = setTimeout(function () { if (drag && drag.over === under) { drag.swap = under; swapMark(under); } }, 450); else swapMark(null); }
          if (drag.swap) { draw(); return; }
        }
        /* alignment guides: page centre, edges, margins and the other elements */
        var sn1 = snapTo([e]); e.x += sn1.dx; e.y += sn1.dy;
        clampEl(e);
      } else if (drag.mode === 'pan') {
        var im = R.ready(photoUrl(e.photo)); if (!im) return;
        var z = (e.crop && e.crop.z) || 1, iw = im.naturalWidth * (e.rect ? e.rect.w : 1), ih = im.naturalHeight * (e.rect ? e.rect.h : 1), s = Math.max(e.w / iw, e.h / ih) * z;
        e.crop = e.crop || { z: 1 };
        e.crop.cx = Math.max(0, Math.min(1, o.crop.cx - dx / (iw * s)));
        e.crop.cy = Math.max(0, Math.min(1, o.crop.cy - dy / (ih * s)));
      } else if (drag.mode === 'resize') {
        el$.pe.classList.add('is-moving');
        var b0 = drag.b, ax = drag.h.indexOf('w') >= 0 ? b0.x + b0.w : b0.x, ay = drag.h.indexOf('n') >= 0 ? b0.y + b0.h : b0.y;
        var keep = (e.t !== 'photo' && e.t !== 'shape') || ev.shiftKey;
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
      if (ev && pts[ev.pointerId]) delete pts[ev.pointerId];
      if (pinch) { if (Object.keys(pts).length < 2) { var pn = pinch; pinch = null; el$.pe.classList.remove('is-moving'); if (!pn.none) { clampEl(pn.e); commit(); placeSel(); ctxBar(); } drag = null; } return; }
      if (!drag) return;
      var d = drag; drag = null; guides(null); el$.pe.classList.remove('is-moving'); if (d.swT) clearTimeout(d.swT); swapMark(null);
      if (d.swap && d.e.photo) {
        /* replace: the frame underneath takes this photo (and its edits); the dragged copy goes away */
        var tg = d.swap, src = d.e, pg = doc(); pushPh(tg);
        tg.photo = src.photo; tg.crop = { z: 1, cx: (src.crop && src.crop.cx) || .5, cy: (src.crop && src.crop.cy) || .5 }; ['fx', 'mask', 'rect'].forEach(function (k) { if (src[k]) tg[k] = clone(src[k]); else delete tg[k]; });
        pg.els.splice(pg.els.indexOf(src), 1); commit(); select(tg.id); R.load(pg, { photo: photoUrl }).then(draw); toast('Photo replaced. Tap ↶ to undo.'); return;
      }
      if (d.many) { if (d.moved) { commit(); placeSel(); ctxBar(); } return; }
      if (d.mode === 'move' && !d.moved) {
        // a tap: text opens the text editor; an empty frame asks for a photo
        if (d.e.t === 'text' && d.wasSel) openPanel('text');
        /* an empty frame shows its menu first (Add photo is the first choice), not the whole photo library */
        return;
      }
      stripTarget(null);
      if (d.mode === 'move' && d.toPage != null && d.toPage !== S.cur) {
        /* anything dropped on another page in the strip moves there exactly as it is: size, crop and edits */
        if (d.e.t === 'photo' && photoCount(docAt(d.toPage)) >= MAXPH) { Object.assign(d.e, { x: d.o.x, y: d.o.y }); draw(); toast('That page already has ' + MAXPH + ' photos.'); return; }
        Object.assign(d.e, { x: d.o.x, y: d.o.y }); var src = doc(); src.els.splice(src.els.indexOf(d.e), 1);
        var dst = docAt(d.toPage); dst.els.push(d.e); clampEl(d.e); var from = S.cur;
        commit(); drawThumb(from); drawThumb(d.toPage); select(null); go(d.toPage); select(d.e.id);
        toast('Moved to ' + (d.toPage < 0 ? 'the cover' : isBack(d.toPage) ? 'the back cover' : 'page ' + (d.toPage + 1)) + '.'); return;
      }
      if (d.crossed) { commit(); drawThumb(-1); drawThumb(S.p.pages.length); ctxBar(); return; }
      if (d.mode === 'move' && d.toPage != null && d.toPage !== S.cur) {
        // dropped on another page in the strip: the photo moves there
        Object.assign(d.e, { x: d.o.x, y: d.o.y }); var ph = d.e.photo; d.e.photo = null;
        if (dropOnPage(ph, d.toPage)) { toast('Photo moved to ' + (d.toPage < 0 ? 'the cover' : 'page ' + (d.toPage + 1)) + '.'); return; }
        d.e.photo = ph; draw(); return;
      }
      commit(); drawThumb(S.cur); ctxBar();
    }
    wrap.addEventListener('pointerup', end); wrap.addEventListener('pointercancel', end);
    wrap.addEventListener('dblclick', function (ev) { var e = selEl(); if (!e) return; if (e.t === 'text') openPanel('text'); else if (e.t === 'photo' && e.photo) { S.crop = true; placeSel(); ctxBar(); } });
    // drop photos from the panel (desktop)
    wrap.addEventListener('dragover', function (ev) { if (ev.dataTransfer.types.indexOf('text/pbk-photo') >= 0) ev.preventDefault(); });
    wrap.addEventListener('drop', function (ev) {
      var id = ev.dataTransfer.getData('text/pbk-photo'); if (!id) return; ev.preventDefault();
      if (!pickSide(ev.clientX)) return;
      var p = pt(ev), t = hit(p.x, p.y);
      placePhoto(id, t && t.t === 'photo' ? t.id : null);
    });
    // pinch/wheel to zoom while cropping
    wrap.addEventListener('wheel', function (ev) { var e = selEl(); if (!S.crop || !e || e.t !== 'photo') return; ev.preventDefault(); e.crop = e.crop || { z: 1, cx: .5, cy: .5 }; e.crop.z = Math.max(1, Math.min(4, (e.crop.z || 1) * (ev.deltaY < 0 ? 1.06 : 0.94))); draw(); clearTimeout(S.wt); S.wt = setTimeout(function () { commit(); drawThumb(S.cur); }, 300); var zr = $('#peZoom'); if (zr) zr.value = e.crop.z; }, { passive: false });
  }

  /* contextual toolbar for the selected element */
  function ctxBar() {
    var bar = el$.ctx, e = selEl();
    el$.pe.classList.toggle('has-sel', !!e);
    if (!e) { bar.hidden = true; return; }
    var h = '';
    if (S.multi) { multiBar(bar); return; }
    if (S.alignOpen) { alignBar(bar); return; }
    if (S.colorOpen && e.t === 'shape') { colorBar(bar); return; }
    if (e.lock) {
      bar.innerHTML = '<span class="pe-lockmsg">' + I.lockb + ' Locked</span><button data-a="unlock" class="pe-hl">' + I.unlock + '<span>Unlock</span></button>'; bar.hidden = false; ctxPos();
      bar.onclick = function (ev) { if (ev.target.closest('[data-a="unlock"]')) { var x = selEl(); if (x) { delete x.lock; commit(); placeSel(); ctxBar(); } } };
      return;
    }
    var edited = (e.t === 'photo' || e.t === 'img') && (e.fx || e.mask || e.rect), hist = (S.phist && S.phist[e.id] || []).length;
    var more = '<button data-a="copy">' + I.copy + '<span>Copy</span></button>' + (S.clip ? '<button data-a="paste">' + I.paste + '<span>Paste</span></button>' : '') + '<button data-a="align">' + I.align + '<span>Align</span></button><button data-a="pick">' + I.selmore + '<span>Select more</span></button>';
    var style = (e.t === 'photo' || e.t === 'img') && e.photo ? '<button data-a="cstyle">' + I.brush + '<span>Copy edits</span></button>' + (S.style ? '<button data-a="pstyle">' + I.brush + '<span>Paste edits</span></button>' : '') : '';
    var fixes = (hist ? '<button data-a="phundo">' + I.undo + '<span>Undo edit</span></button>' : '') + (edited ? '<button data-a="phreset">' + I.reset + '<span>Original</span></button>' : '');
    if (e.t === 'photo') {
      if (S.crop) h = '<label class="pe-zoom">Zoom <input type="range" id="peZoom" min="1" max="4" step="0.01" value="' + ((e.crop && e.crop.z) || 1) + '"></label><button data-a="done" class="pe-done">Done</button>';
      else h = (e.photo ? '<button data-a="edit-photo" class="pe-hl">' + I.wand + '<span>Edit photo</span></button>' + fixes + '<button data-a="crop">' + I.crop + '<span>Move &amp; zoom</span></button><button data-a="replace">' + I.swap + '<span>Replace</span></button>' : '<button data-a="replace" class="pe-hl">' + I.photo + '<span>Add photo</span></button>') +
        (e.photo ? '<button data-a="clear">' + I.x + '<span>Remove photo</span></button>' : '') + '<button data-a="dup">' + I.dup + '<span>Duplicate</span></button>' + more + style + '<button data-a="fill">' + I.fill + '<span>Fill page</span></button><button data-a="front">' + I.up + '<span>To front</span></button><button data-a="back">' + I.down + '<span>To back</span></button><button data-a="lock">' + I.lockb + '<span>Lock</span></button><button data-a="del" class="pe-del">' + I.trash + '<span>' + (e.photo ? 'Delete' : 'Delete frame') + '</span></button>';
    } else if (e.t === 'shape') {
      h = '<button data-a="color" class="pe-hl">' + I.palette + '<span>Colour</span></button><button data-a="dup">' + I.dup + '<span>Duplicate</span></button><button data-a="align">' + I.align + '<span>Align</span></button>' + more + '<button data-a="front">' + I.up + '<span>To front</span></button><button data-a="back">' + I.down + '<span>To back</span></button><button data-a="lock">' + I.lockb + '<span>Lock</span></button><button data-a="del" class="pe-del">' + I.trash + '<span>Delete</span></button>';
    } else if (e.t === 'text') {
      h = '<button data-a="edit">' + I.edit + '<span>Edit text</span></button><button data-a="dup">' + I.dup + '<span>Duplicate</span></button>' + more + '<button data-a="front">' + I.up + '<span>To front</span></button><button data-a="lock">' + I.lockb + '<span>Lock</span></button><button data-a="del" class="pe-del">' + I.trash + '<span>Delete</span></button>';
    } else {
      h = (e.t === 'img' && e.photo ? '<button data-a="edit-photo" class="pe-hl">' + I.wand + '<span>Crop &amp; edit</span></button>' + fixes : '') + '<button data-a="swap">' + I.swap + '<span>Replace</span></button><button data-a="flip">' + I.flip + '<span>Flip</span></button><button data-a="dup">' + I.dup + '<span>Duplicate</span></button>' + more + style + '<button data-a="front">' + I.up + '<span>To front</span></button><button data-a="lock">' + I.lockb + '<span>Lock</span></button><button data-a="del" class="pe-del">' + I.trash + '<span>Delete</span></button>';
    }
    if (S.pick) h = '<span class="pe-lockmsg">Tap more items to select them</span><button data-a="pickdone" class="pe-hl"><span>Done</span></button>';
    /* the most used actions first; the rest behind More */
    if (!S.crop && !S.pick) {
      var tpl = document.createElement('div'); tpl.innerHTML = h;
      var PRI = ['edit-photo', 'phundo', 'phreset', 'crop', 'replace', 'dup', 'align', 'del', 'edit', 'swap', 'color'];
      var kids = [].slice.call(tpl.children), sec = kids.filter(function (x) { return PRI.indexOf(x.getAttribute('data-a')) < 0; });
      if (innerWidth <= 900) { kids.filter(function (x) { return PRI.indexOf(x.getAttribute('data-a')) < 0 && x.getAttribute('data-a') !== 'del'; }).concat(kids.filter(function (x) { return x.getAttribute('data-a') === 'del'; })).forEach(function (x) { tpl.appendChild(x); }); }
      else if (sec.length > 1) {
        kids.forEach(function (x) { var isP = PRI.indexOf(x.getAttribute('data-a')) >= 0; if (S.more ? isP : !isP) x.remove(); });
        tpl.insertAdjacentHTML(S.more ? 'afterbegin' : 'beforeend', S.more ? '<button data-a="less">' + I.left + '<span>Back</span></button>' : '<button data-a="more"><span>More ⋯</span></button>');
        if (!S.more) tpl.insertBefore(tpl.querySelector('[data-a="del"]') || document.createTextNode(''), null);
      }
      h = tpl.innerHTML;
    }
    bar.innerHTML = h; bar.hidden = false; ctxPos(); bar.scrollLeft = 0;
    bar.onclick = function (ev) {
      var b = ev.target.closest('[data-a]'); if (!b) return; var a = b.getAttribute('data-a'), e = selEl(); if (!e) return;
      if (a === 'more' || a === 'less') { S.more = a === 'more'; ctxBar(); return; }
      if (a === 'pickdone') { S.pick = false; ctxBar(); return; }
      if (a === 'crop') { S.crop = true; placeSel(); ctxBar(); hint('Drag the photo to move it inside the frame. Use the slider to zoom.'); }
      else if (a === 'edit-photo') editPhoto(e);
      else if (a === 'lock') { e.lock = true; S.crop = false; commit(); placeSel(); ctxBar(); tip('Locked: it won’t move until you unlock it.'); }
      else if (a === 'phundo') { var st2 = S.phist[e.id], prev = st2 && st2.pop(); if (prev) { Object.assign(e, prev); ['fx', 'mask', 'rect'].forEach(function (k) { if (prev[k] == null) delete e[k]; }); R.load(doc(), { photo: photoUrl }).then(function () { commit(); draw(); drawThumb(S.cur); placeSel(); ctxBar(); }); } }
      else if (a === 'phreset') { pushPh(e); var m0 = S.photos[e.photo]; delete e.fx; delete e.mask; delete e.rect; e.crop = { z: 1, cx: 0.5, cy: 0.5 }; if (e.t === 'img' && m0 && m0.w) { var cy0 = e.y + e.h / 2; e.h = e.w * m0.h / m0.w; e.y = cy0 - e.h / 2; } commit(); draw(); drawThumb(S.cur); placeSel(); ctxBar(); tip('Back to the original photo. Tap Undo edit to go back.'); }
      else if (a === 'done') { S.crop = false; placeSel(); ctxBar(); }
      else if (a === 'replace') askPhoto(e.id, true);
      else if (a === 'swap') { S.replaceArt = e.id; openPanel('stickers'); hint('Pick a sticker, emoji or artwork to put in its place.'); }
      else if (a === 'clear') { e.photo = null; e.crop = { z: 1, cx: .5, cy: .5 }; commit(); draw(); drawThumb(S.cur); ctxBar(); if (S.panel === 'photos') openPanel('photos', true); }
      else if (a === 'del') removeSel();
      else if (a === 'front') { var d = doc(); d.els.splice(d.els.indexOf(e), 1); d.els.push(e); commit(); draw(); }
      else if (a === 'flip') { e.flip = !e.flip; commit(); draw(); drawThumb(S.cur); }
      else if (a === 'dup') duplicate();
      else if (a === 'copy') copySel();
      else if (a === 'paste') paste();
      else if (a === 'align') { S.alignOpen = true; ctxBar(); }
      else if (a === 'color') { S.colorOpen = true; ctxBar(); }
      else if (a === 'back') { var d2 = doc(); d2.els.splice(d2.els.indexOf(e), 1); d2.els.unshift(e); commit(); draw(); }
      else if (a === 'fill') { pushPh(e); e.x = 0; e.y = 0; e.w = W; e.h = S.cur < 0 ? BRAND_TOP : H; e.rot = 0; delete e.border; commit(); draw(); placeSel(); toast('The photo now fills the page to the edges (full bleed).'); }
      else if (a === 'pick') { S.pick = true; S.more = false; ctxBar(); }
      else if (a === 'cstyle') { S.style = { fx: e.fx ? clone(e.fx) : null, rot: e.rot || 0, border: e.border || 0, borderColor: e.borderColor || null, flip: !!e.flip, z: e.crop && e.crop.z || 1, mask: null }; toast('Edits copied. Select another photo and tap Paste edits.'); ctxBar(); }
      else if (a === 'pstyle') pasteStyle();
      else if (a === 'edit') openPanel('text');
    };
    var z = $('#peZoom');
    if (z) z.oninput = function () { e.crop = e.crop || { cx: .5, cy: .5 }; e.crop.z = +z.value; draw(); clearTimeout(S.zt); S.zt = setTimeout(function () { commit(); drawThumb(S.cur); }, 300); };
  }
  function ctxPos() {
    var bar = el$.ctx, e = selEl(); if (!e || bar.hidden) return;
    var b = S.multi ? union(selEls()) : bounds(e), k = S.k, wr = el$.wrap.getBoundingClientRect(), sr = el$.stage.getBoundingClientRect();
    var top = wr.top - sr.top + b.y * k - bar.offsetHeight - 12;
    if (top < 6) top = wr.top - sr.top + (b.y + b.h) * k + 12;
    if (top + bar.offsetHeight > sr.height - 6) top = Math.max(6, sr.height - bar.offsetHeight - 6);
    /* phones: the bar sits at the bottom; when the photo reaches down there, it moves to the top */
    if (innerWidth <= 900) { var selB = wr.top - sr.top + (b.y + b.h) * k, selT = wr.top - sr.top + b.y * k; bar.classList.toggle('is-top', selB > sr.height - bar.offsetHeight - 24 && selT > bar.offsetHeight + 24); }
    var left = wr.left - sr.left + (b.x + ox() + b.w / 2) * k - bar.offsetWidth / 2;
    left = Math.max(6, Math.min(sr.width - bar.offsetWidth - 6, left));
    bar.style.top = top + 'px'; bar.style.left = left + 'px';
  }
  /** Photo editor: crop (frame takes the crop's shape), filters, background removal / eraser. */
  function editPhoto(e) {
    var src = photoUrl(e.photo); if (!src) return;
    var d = doc();
    window.PBKPhotoEdit.open({ src: src, fx: e.fx, rect: e.rect, maskSrc: e.mask ? photoUrl(e.mask) : null, frameAr: e.w / e.h, sticker: e.t === 'img' }).then(function (r) {
      if (!r) return;
      pushPh(e);
      var next = Promise.resolve();
      if (r.mask === null) e.mask = null;
      else if (r.mask) {
        var id = uid('mk'), meta = { id: id, projectId: S.p.id, name: 'mask', type: 'image/png', size: r.mask.size, w: 0, h: 0, mask: true, added: Date.now() };
        next = ST.savePhoto(meta, { orig: r.mask, prev: r.mask, thumb: r.mask }).then(function () { S.photos[id] = meta; urls[id] = URL.createObjectURL(r.mask); e.mask = id; });
      }
      next.then(function () {
        e.fx = r.fx || null;
        if (e.t === 'photo' && JSON.stringify(r.rect || null) === JSON.stringify(e.rect || null)) { /* only colours or background changed: keep size, zoom and position */ }
        else if (e.t === 'photo') {
          e.rect = r.rect; e.crop = { z: 1, cx: 0.5, cy: 0.5 };
          var ar = r.ar, cx = e.x + e.w / 2, cy = e.y + e.h / 2, area = e.w * e.h, w = Math.sqrt(area * ar), h = w / ar;
          var maxW = S.cur < 0 ? 1060 : 1140, maxH = S.cur < 0 ? ay(1300) : H - 60, k = Math.min(1, maxW / w, maxH / h); w *= k; h *= k;
          e.w = w; e.h = h; e.x = Math.max(S.cur < 0 ? 110 : 30, Math.min((S.cur < 0 ? 1170 : 1170) - w, cx - w / 2)); e.y = Math.max(30, Math.min((S.cur < 0 ? BRAND_TOP : H - 30) - h, cy - h / 2));
        } else {
          /* stickers: keep the width, take the crop's shape */
          var m1 = S.photos[e.photo], ar1 = r.rect ? r.ar : (m1 && m1.w ? m1.w / m1.h : e.w / e.h), cy1 = e.y + e.h / 2;
          if (r.rect) e.rect = r.rect; else delete e.rect;
          e.h = e.w / ar1; e.y = cy1 - e.h / 2; clampEl(e);
        }
        return R.load(d, { photo: photoUrl });
      }).then(function () { commit(); draw(); drawThumb(S.cur); placeSel(); ctxBar(); });
    });
  }
  /** remembers a photo's state so its last edit can be undone on its own */
  function pushPh(e) { S.phist = S.phist || {}; var l = S.phist[e.id] = S.phist[e.id] || []; l.push({ fx: e.fx ? clone(e.fx) : null, mask: e.mask || null, rect: e.rect ? clone(e.rect) : null, crop: e.crop ? clone(e.crop) : null, x: e.x, y: e.y, w: e.w, h: e.h }); if (l.length > 20) l.shift(); }
  /* ---------- dragging photos onto pages ---------- */
  var dropOn = null;
  /** highlights the strip page under the pointer; returns its index (−1 = cover) or null */
  function stripTarget(x, y) {
    var b = x == null ? null : document.elementFromPoint(x, y), pg = b && b.closest && b.closest('#peStrip [data-pg]');
    if (dropOn && dropOn !== pg) dropOn.classList.remove('is-drop');
    dropOn = pg || null; if (pg) pg.classList.add('is-drop');
    return pg ? +pg.getAttribute('data-pg') : null;
  }
  /** puts a photo on page i: an empty frame, a second frame, or in place of the last photo */
  function dropOnPage(id, i) {
    var d = docAt(i); if (!d || !id) return false;
    var fr = d.els.filter(function (x) { return x.t === 'photo'; }), e = fr.filter(function (x) { return !x.photo; })[0], replaced = false;
    if (!e) {
      if (fr.length >= MAXPH) { toast('That page already has ' + MAXPH + ' photos.'); return false; }
      e = newPhotoEl(id, d, i < 0 || isBack(i)); d.els.push(e);
    } else { e.photo = id; e.crop = { z: 1, cx: 0.5, cy: 0.5 }; delete e.rect; delete e.fx; delete e.mask; }
    commit(); drawThumb(i);
    if (i !== S.cur) go(i);
    select(e.id); draw(); if (S.panel === 'photos') openPanel('photos', true);

    return true;
  }
  /** drag a photo from the library (mouse: drag; touch: press and hold, then drag) */
  function bindPhotoDrag(P) {
    var dr = null;
    function begin(btn, x, y) {
      var im = btn.querySelector('img'), gh = document.createElement('div'); gh.className = 'pe-ghost';
      gh.innerHTML = '<img alt="" src="' + (im && im.src || '') + '">'; document.body.appendChild(gh);
      dr.on = true; dr.gh = gh; btn.classList.add('is-drag'); el$.pe.classList.add('is-dragging'); move(x, y);
      if (navigator.vibrate) try { navigator.vibrate(12); } catch (e) { }
      hint('Drop it on a photo frame, or on a page in the strip below.');
    }
    function move(x, y) {
      if (!dr || !dr.on) return;
      dr.gh.style.transform = 'translate(' + (x - 36) + 'px,' + (y - 36) + 'px)';
      var r = el$.wrap.getBoundingClientRect(), over = x >= r.left && x <= r.right && y >= r.top && y <= r.bottom && !(document.elementFromPoint(x, y) || document.body).closest('.pe-panel');
      el$.wrap.classList.toggle('is-drop', over); dr.canvas = over;
      dr.page = over ? null : stripTarget(x, y); if (over) stripTarget(null);
    }
    function end(x, y) {
      if (!dr) return; var d = dr; dr = null; clearTimeout(d.t);
      if (!d.on) return;
      d.btn.classList.remove('is-drag'); el$.pe.classList.remove('is-dragging'); d.gh.remove(); el$.wrap.classList.remove('is-drop'); stripTarget(null);
      P._noClick = Date.now();
      if (d.canvas) { if (!pickSide(x)) return; var r = el$.canvas.getBoundingClientRect(), t = hit((x - r.left) / S.k - ox(), (y - r.top) / S.k); placePhoto(d.id, t && t.t === 'photo' ? t.id : null); }
      else if (d.page != null) dropOnPage(d.id, d.page);
    }
    P.addEventListener('pointerdown', function (ev) {
      if (ev.pointerType === 'touch') return;
      var b = ev.target.closest('[data-ph]'); if (!b) return;
      dr = { id: b.getAttribute('data-ph'), btn: b, x: ev.clientX, y: ev.clientY, on: false };
    });
    window.addEventListener('pointermove', function (ev) { if (!dr || ev.pointerType === 'touch') return; if (!dr.on && Math.hypot(ev.clientX - dr.x, ev.clientY - dr.y) > 6) begin(dr.btn, ev.clientX, ev.clientY); move(ev.clientX, ev.clientY); });
    window.addEventListener('pointerup', function (ev) { if (ev.pointerType !== 'touch') end(ev.clientX, ev.clientY); });
    P.addEventListener('touchstart', function (ev) {
      var b = ev.target.closest('[data-ph]'); if (!b || ev.touches.length > 1) return;
      var t0 = ev.touches[0]; dr = { id: b.getAttribute('data-ph'), btn: b, x: t0.clientX, y: t0.clientY, on: false, lx: t0.clientX, ly: t0.clientY };
      dr.t = setTimeout(function () { if (dr && !dr.on) begin(b, dr.lx, dr.ly); }, 320);
    }, { passive: true });
    P.addEventListener('touchmove', function (ev) {
      if (!dr) return; var t0 = ev.touches[0]; dr.lx = t0.clientX; dr.ly = t0.clientY;
      if (!dr.on) { if (Math.hypot(t0.clientX - dr.x, t0.clientY - dr.y) > 10) { clearTimeout(dr.t); dr = null; } return; }
      ev.preventDefault(); move(t0.clientX, t0.clientY);
    }, { passive: false });
    P.addEventListener('touchend', function () { if (dr) end(dr.lx, dr.ly); });
    P.addEventListener('touchcancel', function () { if (dr) { var d = dr; end(-1, -1); if (d.gh) d.gh.remove(); } });
    P.addEventListener('contextmenu', function (ev) { if (ev.target.closest('[data-ph]')) ev.preventDefault(); });
  }
  /** Adds an empty photo frame (pages hold up to two). */
  function addFrame() {
    var d = doc(), n = photoCount(d);
    if (n >= MAXPH) { toast('This page already has ' + MAXPH + ' photos. Use another page.'); return; }
    var e = S.cur < 0 || isBack() ? { x: 330, y: ay(500), w: 640, h: ay(800), border: 14, borderColor: '#ffffff' } : n ? { x: 300, y: ay(860), w: 600, h: 600 } : { x: 90, y: 90, w: 1020, h: H - 270 };
    e = Object.assign({ id: uid('ph'), t: 'photo', photo: null, crop: { z: 1, cx: 0.5, cy: 0.5 } }, e);
    d.els.push(e); commit(); select(e.id); draw(); drawThumb(S.cur);
    tip('Photo frame added. Tap it to choose a photo.');
  }
  function whyNot(e) {
    if (e.lock) return 'It’s locked, so it can’t be deleted. Tap Unlock first, then Delete.';
    if (e.role === 'title' || e.role === 'sub' || e.role === 'year') return 'These words are part of the cover design, so they can’t be deleted. Tap Edit text to change or clear them.';
    if (e.role || e.id === 'map' || e.id === 'place') return 'This is part of the cover design, so it can’t be deleted. You can move, resize or recolour it, or pick another cover.';
    return null;
  }
  function removeSel() {
    var d = doc(), e = selEl(); if (!e) return;
    var no = whyNot(e); if (no) { toast(no); return; }
    d.els.splice(d.els.indexOf(e), 1); select(null); commit(); draw(); drawThumb(S.cur);
    toast(e.t === 'photo' ? 'Frame deleted. Tap ↶ to undo, or add a new frame from Layouts.' : 'Deleted. Tap ↶ to undo.');
    if (S.panel === 'photos') openPanel('photos', true);
  }

  /* ---------------- copy, paste, duplicate, groups, alignment ---------------- */
  function copySel() { var l = selEls(); if (!l.length) return; S.clip = { els: clone(l), from: S.cur }; toast(l.length > 1 ? l.length + ' items copied. Go to any page and tap Paste.' : 'Copied. Go to any page and tap Paste: it keeps the same size and place.'); ctxBar(); }
  function paste() {
    if (!S.clip || isSpineV()) return; var d = doc(), gm = {}, ids = [];
    var nPh = S.clip.els.filter(function (x) { return x.t === 'photo'; }).length;
    if (nPh && photoCount(d) + nPh > MAXPH) { toast('This page can hold ' + MAXPH + ' photos.'); return; }
    var same = S.clip.from === S.cur && S.clip.els.some(function (x) { return d.els.some(function (y) { return Math.abs(y.x - x.x) < 2 && Math.abs(y.y - x.y) < 2; }); });
    S.clip.els.forEach(function (x) { var c = clone(x); c.id = uid(c.t === 'photo' ? 'ph' : c.t); delete c.role; delete c.lock; if (c.g) c.g = gm[c.g] || (gm[c.g] = uid('g')); if (same) { c.x += 30; c.y += 30; } clampEl(c); d.els.push(c); ids.push(c.id); });
    commit(); draw(); if (ids.length > 1) selectMany(ids); else select(ids[0]);
    if (same) S.clip.els.forEach(function (x) { x.x += 30; x.y += 30; });
  }
  function duplicate() { var keep = S.clip; S.clip = { els: clone(selEls()), from: S.cur }; paste(); S.clip = keep; ctxBar(); }
  function pasteStyle() {
    var st = S.style; if (!st) return; var n = 0;
    selEls().forEach(function (e) { if ((e.t !== 'photo' && e.t !== 'img') || !e.photo) return; pushPh(e); e.fx = st.fx ? clone(st.fx) : null; if (!e.fx) delete e.fx; e.rot = st.rot || 0; if (!e.rot) delete e.rot; e.flip = st.flip || undefined; if (e.t === 'photo') { e.border = st.border; if (st.borderColor) e.borderColor = st.borderColor; e.crop = Object.assign({ cx: .5, cy: .5 }, e.crop, { z: st.z }); } n++; });
    if (!n) return; R.load(doc(), { photo: photoUrl }).then(function () { commit(); draw(); placeSel(); ctxBar(); }); toast('Edits pasted. Tap ↶ to undo.');
  }
  function group() { var l = selEls(); if (l.length < 2) return; var g = uid('g'); l.forEach(function (e) { e.g = g; }); commit(); ctxBar(); toast('Grouped: they move together. Ungroup any time.'); }
  function ungroup() { var l = selEls(); l.forEach(function (e) { delete e.g; }); commit(); ctxBar(); toast('Ungrouped: each one moves on its own again.'); }
  function removeMany() { var d = doc(), all = selEls(), l = all.filter(function (e) { return !whyNot(e); }); if (l.length < all.length) toast((all.length - l.length) + ' item' + (all.length - l.length === 1 ? ' is' : 's are') + ' locked or part of the cover design, so ' + (all.length - l.length === 1 ? 'it stays' : 'they stay') + '.'); if (!l.length) return; d.els = d.els.filter(function (e) { return l.indexOf(e) < 0; }); select(null); commit(); draw(); toast(l.length + ' deleted. Tap ↶ to undo.'); }
  function multiBar(bar) {
    var l = selEls(), grouped = l.length > 1 && l.every(function (e) { return e.g && e.g === l[0].g; });
    if (S.alignOpen) return alignBar(bar);
    bar.innerHTML = '<span class="pe-lockmsg">' + l.length + ' selected</span><button data-a="align">' + I.align + '<span>Align</span></button>' + (grouped ? '<button data-a="ungroup">' + I.ungroup + '<span>Ungroup</span></button>' : '<button data-a="group">' + I.group + '<span>Group</span></button>') + '<button data-a="dup">' + I.dup + '<span>Duplicate</span></button><button data-a="copy">' + I.copy + '<span>Copy</span></button>' + (S.style ? '<button data-a="pstyle">' + I.brush + '<span>Paste edits</span></button>' : '') + '<button data-a="pick">' + I.selmore + '<span>Select more</span></button><button data-a="del" class="pe-del">' + I.trash + '<span>Delete</span></button><button data-a="none">' + I.x + '<span>Done</span></button>';
    bar.hidden = false; ctxPos();
    bar.onclick = function (ev) {
      var b = ev.target.closest('[data-a]'); if (!b) return; var a = b.getAttribute('data-a');
      if (a === 'align') { S.alignOpen = true; ctxBar(); } else if (a === 'group') group(); else if (a === 'ungroup') ungroup(); else if (a === 'dup') duplicate(); else if (a === 'copy') copySel(); else if (a === 'pstyle') pasteStyle();
      else if (a === 'pick') { S.pick = true; ctxBar(); } else if (a === 'del') removeMany(); else if (a === 'none') select(null);
    };
  }
  function alignBar(bar) {
    var l = selEls(), many = l.length > 1;
    bar.innerHTML = '<span class="pe-lockmsg">Align ' + (many ? 'to each other' : 'on the page') + '</span>' +
      [['ch', 'Centre ↔'], ['cv', 'Centre ↕'], ['l', 'Left'], ['r', 'Right'], ['t', 'Top'], ['b', 'Bottom']].map(function (x) { return '<button data-al="' + x[0] + '"><span>' + x[1] + '</span></button>'; }).join('') +
      (many ? '<button data-al="pc"><span>Centre on page</span></button>' : '') + (l.length > 2 ? '<button data-al="dh"><span>Space evenly ↔</span></button><button data-al="dv"><span>Space evenly ↕</span></button>' : '') + '<button data-al="x">' + I.x + '<span>Done</span></button>';
    bar.hidden = false; ctxPos();
    bar.onclick = function (ev) { var b = ev.target.closest('[data-al]'); if (!b) return; var a = b.getAttribute('data-al'); if (a === 'x') { S.alignOpen = false; ctxBar(); return; } align(a); };
  }
  function align(a) {
    var l = selEls().filter(function (e) { return !e.lock; }); if (!l.length) return;
    var many = l.length > 1, M = 60, box = many && a !== 'pc' ? union(l) : { x: 0, y: 0, w: W, h: H };
    function mv(e, nx, ny) { var b = bounds(e); if (nx != null) e.x += nx - b.x; if (ny != null) e.y += ny - b.y; }
    if (a === 'pc') { var u = union(l), sx = W / 2 - (u.x + u.w / 2), sy = H / 2 - (u.y + u.h / 2); l.forEach(function (e) { e.x += sx; e.y += sy; }); }
    else if (a === 'dh' || a === 'dv') {
      var hz = a === 'dh', srt = l.slice().sort(function (p, q) { return hz ? bounds(p).x - bounds(q).x : bounds(p).y - bounds(q).y; }), u2 = union(l);
      var tot = srt.reduce(function (n, e) { var b = bounds(e); return n + (hz ? b.w : b.h); }, 0), gap = ((hz ? u2.w : u2.h) - tot) / (srt.length - 1), at = hz ? u2.x : u2.y;
      srt.forEach(function (e) { var b = bounds(e); if (hz) mv(e, at, null); else mv(e, null, at); at += (hz ? b.w : b.h) + gap; });
    } else l.forEach(function (e) {
      var b = bounds(e), bx = box, pad = many ? 0 : M;
      if (a === 'l') mv(e, bx.x + pad, null); else if (a === 'r') mv(e, bx.x + bx.w - pad - b.w, null); else if (a === 'ch') mv(e, bx.x + (bx.w - b.w) / 2, null);
      else if (a === 't') mv(e, null, bx.y + pad); else if (a === 'b') mv(e, null, bx.y + bx.h - (many ? 0 : (S.cur < 0 ? H - BRAND_TOP + 20 : M)) - b.h); else if (a === 'cv') mv(e, null, bx.y + (bx.h - b.h) / 2);
    });
    commit(); draw(); placeSel();
  }
  /* dotted guides while dragging: snaps to the page centre, edges, margins and other elements */
  function snapTo(list) {
    var u = union(list), th = 9 / (S.k || 1), M = 60, others = (doc().els || []).filter(function (x) { return list.indexOf(x) < 0; });
    var xs = [[0, 'e'], [M, 'm'], [W / 2, 'c'], [W - M, 'm'], [W, 'e']], ys = [[0, 'e'], [M, 'm'], [H / 2, 'c'], [H - M, 'm'], [H, 'e']];
    others.forEach(function (o) { var b = bounds(o); xs.push([b.x, 'o'], [b.x + b.w / 2, 'o'], [b.x + b.w, 'o']); ys.push([b.y, 'o'], [b.y + b.h / 2, 'o'], [b.y + b.h, 'o']); });
    function best(edges, cands) { var r = null; edges.forEach(function (v) { cands.forEach(function (c) { var d0 = c[0] - v; if (Math.abs(d0) <= th && (!r || Math.abs(d0) < Math.abs(r.d))) r = { d: d0, at: c[0], k: c[1] }; }); }); return r; }
    var bx = best([u.x, u.x + u.w / 2, u.x + u.w], xs), by = best([u.y, u.y + u.h / 2, u.y + u.h], ys);
    guides([bx ? { v: 1, at: bx.at, k: bx.k } : null, by ? { v: 0, at: by.at, k: by.k } : null]);
    return { dx: bx ? bx.d : 0, dy: by ? by.d : 0 };
  }
  function swapMark(t) {
    var g = el$.guides; if (!g) return; var old = g.querySelector('.pe-swap'); if (old) old.remove(); if (!t) return; g.innerHTML = '';
    var b = bounds(t), k = S.k, m = document.createElement('div'); m.className = 'pe-swap';
    m.style.cssText = 'left:' + (b.x + ox()) * k + 'px;top:' + b.y * k + 'px;width:' + b.w * k + 'px;height:' + b.h * k + 'px'; m.innerHTML = '<span>Release to replace</span>'; g.appendChild(m);
    if (navigator.vibrate) try { navigator.vibrate(10); } catch (e) { }
  }
  function guides(l) {
    var g = el$.guides; if (!g) return; if (!l) { g.innerHTML = ''; return; }
    g.innerHTML = l.filter(Boolean).map(function (x) { return x.v ? '<i class="pe-guide is-v is-' + x.k + '" style="left:' + (x.at + ox()) * S.k + 'px"></i>' : '<i class="pe-guide is-h is-' + x.k + '" style="top:' + x.at * S.k + 'px"></i>'; }).join('');
  }
  /** a new photo on a page, the photo's own shape: big on an empty page, smaller beside others */
  function newPhotoEl(id, d, cover) {
    var m = S.photos[id] || {}, ar = m.w && m.h ? m.w / m.h : 4 / 3, n = photoCount(d), w, h;
    if (cover) { w = 700; h = w / ar; if (h > ay(900)) { h = ay(900); w = h * ar; } }
    else if (!n) { w = W - 180; h = w / ar; if (h > H - 300) { h = H - 300; w = h * ar; } }
    else { w = W * 0.46; h = w / ar; if (h > H * 0.42) { h = H * 0.42; w = h * ar; } }
    var x = (W - w) / 2, y = (H - h) / 2 - (n ? 0 : 20);
    if (n) {
      /* beside what's already there: the free-est of nine spots, nothing existing is moved */
      var M = 70, best = null, rs = (d.els || []).map(bounds);
      [0, .5, 1].forEach(function (fy) { [0, .5, 1].forEach(function (fx) {
        var cx = M + (W - 2 * M - w) * fx, cy = M + (H - 2 * M - h - (cover ? 120 : 0)) * fy, ov = 0;
        rs.forEach(function (r) { var ix = Math.max(0, Math.min(cx + w, r.x + r.w) - Math.max(cx, r.x)), iy = Math.max(0, Math.min(cy + h, r.y + r.h) - Math.max(cy, r.y)); ov += ix * iy; });
        if (!best || ov < best.ov - 1) best = { ov: ov, x: cx, y: cy };
      }); });
      x = best.x; y = best.y;
    }
    var e = { id: uid('ph'), t: 'photo', x: x, y: y, w: w, h: h, photo: id, crop: { z: 1, cx: .5, cy: .5 } };
    if (cover) { e.border = 14; e.borderColor = '#ffffff'; }
    return e;
  }
  /** after placing a photo on a phone, the library slides down so the page shows */
  function peek() { el$.pe.classList.add('is-peek'); setTimeout(fit, 300); }
  /* ---------------- all pages at once ---------------- */
  var gdlg;
  function blankDoc(d) { return !d || !(d.els || []).some(function (e) { return e.t === 'photo' ? !!e.photo : true; }); }
  function gridView() {
    select(null); flush();
    if (!gdlg) { gdlg = document.createElement('dialog'); gdlg.className = 'pe-gd'; document.body.appendChild(gdlg); gdlg.addEventListener('cancel', function (e) { e.preventDefault(); gdlg.close(); }); }
    var n = S.p.pages.length, sel = S.cur;
    function tile(i, lbl, fixed) { return '<div class="pe-gd__t' + (fixed ? ' is-fixed' : '') + (i === sel ? ' is-on' : '') + '" data-i="' + i + '"' + (fixed ? '' : ' draggable="true"') + '><canvas width="150" height="212"></canvas><span class="pe-gd__n">' + lbl + '</span>' + (fixed ? '' : '<div class="pe-gd__a"><button data-g="dup" title="Duplicate page" aria-label="Duplicate page ' + (i + 1) + '">' + I.dup + '</button><button data-g="del" title="Delete page" aria-label="Delete page ' + (i + 1) + '">' + I.trash + '</button></div>') + '</div>'; }
    var h = '<div class="pe-gd__in"><header><h3>All pages <small>' + n + ' pages</small></h3><button class="btn btn--ghost btn--sm" data-g="add">' + I.plus + ' Add 2 pages</button><button class="btn btn--p btn--sm" data-g="done">Done</button></header><p class="pe-note">Tap a page to edit it. Drag pages (or press and hold on a phone) to change the order.</p><div class="pe-gd__grid">' + tile(-1, 'Cover', true);
    for (var i = 0; i < n; i++) h += tile(i, 'Page ' + (i + 1));
    h += tile(n, 'Back cover', true) + '</div></div>';
    gdlg.innerHTML = h; if (!gdlg.open) gdlg.showModal();
    var all = [-1]; for (var j = 0; j <= n; j++) all.push(j);
    var k = 0; (function step() { if (k >= all.length || !gdlg.open) return; var idx = all[k++], cv = gdlg.querySelector('[data-i="' + idx + '"] canvas'), d = docAt(idx); if (!cv || !d) return step(); R.load(d, { photo: photoUrl }).then(function () { var g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height); R.draw(g, d, { scale: cv.width / W, scaleY: cv.height / H, photo: photoUrl, empty: 'soft' }); setTimeout(step, 10); }); })();
    function redraw(focus) { S.cur = focus == null ? Math.min(S.cur, S.p.pages.length - 1) : focus; drawStrip(); drawInfo(); fit(); gridView(); }
    gdlg.onclick = function (ev) {
      var b = ev.target.closest('[data-g]'), t = ev.target.closest('[data-i]');
      if (b) {
        var a = b.getAttribute('data-g'), i2 = t ? +t.getAttribute('data-i') : null;
        if (a === 'done') return gdlg.close();
        if (a === 'add') { if (S.p.pages.length + 2 > BOOK.pages.max) return toast('A book can have up to ' + BOOK.pages.max + ' pages.'); S.p.pages.push(pageDoc('one'), pageDoc('one')); commit(); return redraw(S.p.pages.length - 2); }
        if (a === 'dup') {
          if (S.p.pages.length + 1 > BOOK.pages.max) return toast('A book can have up to ' + BOOK.pages.max + ' pages.');
          var c = clone(S.p.pages[i2]); c.els.forEach(function (x) { x.id = uid(x.t === 'photo' ? 'ph' : x.t); }); S.p.pages.splice(i2 + 1, 0, c);
          var note = '';
          if (S.p.pages.length % 2) { var last = S.p.pages[S.p.pages.length - 1]; if (blankDoc(last) && S.p.pages.length - 1 > i2 + 1) { S.p.pages.pop(); note = ' A blank page at the end was removed to keep an even number of pages.'; } else { S.p.pages.push(pageDoc('one')); note = ' A blank page was added at the end: books always have an even number of pages.'; } }
          commit(); toast('Page ' + (i2 + 1) + ' duplicated.' + note); return redraw(i2 + 1);
        }
        if (a === 'del') {
          if (S.p.pages.length - 1 < BOOK.pages.min) return toast('A book needs at least ' + BOOK.pages.min + ' pages.');
          if (!blankDoc(S.p.pages[i2]) && !confirm('Delete page ' + (i2 + 1) + ' and everything on it? You can undo with ↶.')) return;
          S.p.pages.splice(i2, 1); var nt = '';
          if (S.p.pages.length % 2) { S.p.pages.push(pageDoc('one')); nt = ' A blank page was added at the end to keep an even number of pages.'; }
          commit(); toast('Page ' + (i2 + 1) + ' deleted; the pages after it moved up.' + nt); return redraw(Math.min(i2, S.p.pages.length - 1));
        }
        return;
      }
      if (t && !gdlg._drag) { var gi2 = +t.getAttribute('data-i'); gdlg.close(); go(gi2); }
    };
    /* reorder: drag (mouse) or press-and-hold then drag (touch) */
    var dr = null, grid = gdlg.querySelector('.pe-gd__grid');
    function over(x, y) { var el = document.elementFromPoint(x, y), t2 = el && el.closest && el.closest('.pe-gd__t:not(.is-fixed)'); grid.querySelectorAll('.is-over').forEach(function (z) { z.classList.remove('is-over'); }); if (t2 && dr && t2 !== dr.t) t2.classList.add('is-over'); return t2; }
    function drop(t2) {
      if (!dr) return; var from = +dr.t.getAttribute('data-i'); dr.t.classList.remove('is-lift'); grid.querySelectorAll('.is-over').forEach(function (z) { z.classList.remove('is-over'); }); var d0 = dr; dr = null; setTimeout(function () { gdlg._drag = false; }, 50);
      if (!t2 || t2 === d0.t) return; var to = +t2.getAttribute('data-i'); var pg = S.p.pages.splice(from, 1)[0]; S.p.pages.splice(to, 0, pg); commit(); toast('Page ' + (from + 1) + ' moved to position ' + (to + 1) + '.'); redraw(to);
    }
    grid.querySelectorAll('.pe-gd__t:not(.is-fixed)').forEach(function (t) {
      t.addEventListener('dragstart', function (ev) { dr = { t: t }; gdlg._drag = true; t.classList.add('is-lift'); try { ev.dataTransfer.setData('text/plain', t.getAttribute('data-i')); ev.dataTransfer.effectAllowed = 'move'; } catch (e) { } });
      t.addEventListener('dragover', function (ev) { if (dr) { ev.preventDefault(); over(ev.clientX, ev.clientY); } });
      t.addEventListener('drop', function (ev) { ev.preventDefault(); drop(t); });
      t.addEventListener('dragend', function () { if (dr) { dr.t.classList.remove('is-lift'); dr = null; setTimeout(function () { gdlg._drag = false; }, 50); } });
      var hold = null;
      t.addEventListener('touchstart', function (ev) { if (ev.target.closest('[data-g]')) return; var t0 = ev.touches[0], sx = t0.clientX, sy = t0.clientY; hold = { x: sx, y: sy, tm: setTimeout(function () { dr = { t: t }; gdlg._drag = true; t.classList.add('is-lift'); if (navigator.vibrate) try { navigator.vibrate(12); } catch (e) { } }, 380) }; }, { passive: true });
      t.addEventListener('touchmove', function (ev) { var t0 = ev.touches[0]; if (!dr) { if (hold && Math.hypot(t0.clientX - hold.x, t0.clientY - hold.y) > 10) { clearTimeout(hold.tm); hold = null; } return; } ev.preventDefault(); dr.lx = t0.clientX; dr.ly = t0.clientY; over(t0.clientX, t0.clientY); }, { passive: false });
      t.addEventListener('touchend', function () { if (hold) clearTimeout(hold.tm); hold = null; if (dr) { var t2 = dr.lx != null ? over(dr.lx, dr.ly) : null; drop(t2); } });
    });
  }
  /* ---------------- blank pages before ordering ---------------- */
  /** finds empty pages; offers to remove them, keeping the page count even and above the minimum */
  function blankCheck() {
    return new Promise(function (ok) {
      if (S.keepBlank) return ok();
      var blanks = []; S.p.pages.forEach(function (d, i) { if (blankDoc(d)) blanks.push(i); });
      if (!blanks.length) return ok();
      var n = S.p.pages.length, can = Math.min(blanks.length, n - BOOK.pages.min), why = [];
      if (can < blanks.length) why.push('a book needs at least ' + BOOK.pages.min + ' pages');
      if ((n - can) % 2) { can--; why.push('pages are printed on both sides of each sheet, so a book always has an even number of pages'); }
      var dlg = document.createElement('dialog'); dlg.className = 'pe-pc'; document.body.appendChild(dlg);
      var list = blanks.map(function (i) { return i + 1; }), tag = list.length > 6 ? list.slice(0, 6).join(', ') + '…' : list.join(', ');
      var keepN = blanks.length - Math.max(0, can);
      dlg.innerHTML = '<div class="pe-pc__in"><header><h3>Blank pages found</h3></header><p>' + (blanks.length === 1 ? 'Page ' + tag + ' is' : 'Pages ' + tag + ' are') + ' empty and would print blank.</p>' +
        (can > 0 ? '<p>We can remove ' + (can === blanks.length ? (can === 1 ? 'it' : 'them') : can + ' of them') + ' for you.' + (keepN > 0 ? ' ' + (keepN === 1 ? 'One blank page has' : keepN + ' blank pages have') + ' to stay because ' + why.join(', and ') + '. You can add a photo or words to ' + (keepN === 1 ? 'it' : 'them') + ' instead.' : '') + '</p>' : '<p>They have to stay because ' + why.join(', and ') + '. Add photos or words to them, or keep them blank.</p>') +
        '<div class="pe-row">' + (can > 0 ? '<button class="btn btn--p btn--sm" data-b="rm">Remove ' + (can === 1 ? 'the blank page' : can + ' blank pages') + '</button>' : '') + '<button class="btn btn--ghost btn--sm" data-b="keep">Keep blank pages</button><button class="btn btn--ghost btn--sm" data-b="go">Go to ' + (blanks.length === 1 ? 'it' : 'the first one') + '</button></div></div>';
      dlg.showModal(); dlg.oncancel = function () { S.blankAsked = false; setTimeout(function () { dlg.remove(); }, 0); };
      dlg.onclick = function (ev) {
        var b = ev.target.closest('[data-b]'); if (!b) return; var a = b.getAttribute('data-b'); dlg.close(); dlg.remove();
        if (a === 'keep') { S.keepBlank = true; return ok(); }
        if (a === 'go') { S.blankAsked = false; go(blanks[0]); return; }
        checkpoint('Before removing blank pages'); var rm = blanks.slice(blanks.length - can); /* keeps the first blanks if some must stay; removes from the end of the list */
        rm.sort(function (x, y) { return y - x; }).forEach(function (i) { S.p.pages.splice(i, 1); });
        commit(); S.cur = Math.min(S.cur, S.p.pages.length - 1); drawStrip(); drawInfo(); fit();
        toast(can + ' blank page' + (can === 1 ? '' : 's') + ' removed. Tap ↶ to bring ' + (can === 1 ? 'it' : 'them') + ' back.'); ok();
      };
    });
  }

  /* ---------------- photos ---------------- */
  function photoCount(d) { return (d.els || []).filter(function (e) { return e.t === 'photo'; }).length; }
  function usedMap() { var m = {}; [S.p.cover].concat(S.p.pages).concat(S.p.back ? [S.p.back] : []).forEach(function (d) { (d.els || []).forEach(function (e) { if (e.t === 'photo' && e.photo) m[e.photo] = (m[e.photo] || 0) + 1; }); }); return m; }
  function placePhoto(id, frameId) {
    var d = doc(), e = null;
    if (frameId) e = d.els.filter(function (x) { return x.id === frameId; })[0];
    if (!e && S.target) e = d.els.filter(function (x) { return x.id === S.target && x.t === 'photo'; })[0];
    if (!e) e = d.els.filter(function (x) { return x.t === 'photo' && !x.photo; })[0];
    if (!e) {
      if (photoCount(d) >= MAXPH) { toast('This page already has ' + MAXPH + ' photos. Use another page, or select a photo and tap Replace.'); return; }
      e = newPhotoEl(id, d, S.cur < 0 || isBack()); d.els.push(e); clampEl(e);
    } else { e.photo = id; e.crop = { z: 1, cx: 0.5, cy: 0.5 }; delete e.rect; delete e.fx; delete e.mask; }
    S.target = null;
    commit(); select(e.id); draw(); drawThumb(S.cur);
    if (S.panel === 'photos') { if (innerWidth < 900) peek(); else openPanel('photos', true); }
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
  /** Empty frame tapped: no photos yet → open the file picker; otherwise show the library. */
  function askPhoto(frameId, replace) {
    S.target = frameId;
    if (!S.order.length) { S.importTarget = frameId; el$.file.click(); return; }
    openPanel('photos');
    if (replace) hint('Tap a photo to put it in this frame, or Upload more.');
  }
  function importFiles(files, retry) {
    files = Array.prototype.slice.call(files || []); if (!files.length) return;
    var target = S.importTarget; S.importTarget = null;
    var lim = CFG.limits || { maxPhotosPerProject: 300, maxFileMB: 40, minPhotoPx: 800 };
    var hashes = {}; S.order.forEach(function (id) { if (S.photos[id].hash) hashes[S.photos[id].hash] = 1; });
    var done = 0, bad = [], added = [], dup = 0, conv = 0, list = [];
    var prog = $('#peProg');
    function say(t) { prog = $('#peProg'); if (prog) prog.textContent = t; }
    /* PDFs and Word documents first become their pages / pictures */
    var k = 0;
    function expand() {
      if (k >= files.length) return start();
      var f = files[k++];
      return PH.expand(f, say).then(function (l) { list = list.concat(l); if (l.length > 1 || l[0] !== f) conv++; }, function (e) { bad.push({ file: f, why: e.message }); }).then(expand);
    }
    function start() {
      var room = (lim.maxPhotosPerProject || 300) - S.order.length;
      if (room <= 0) { toast('This book already has the maximum number of photos (' + (lim.maxPhotosPerProject || 300) + ').'); return; }
      if (list.length > room) { toast('Only the first ' + room + ' photos were added: a book can hold ' + (lim.maxPhotosPerProject || 300) + '.'); list = list.slice(0, room); }
      next(0);
    }
    function next(i) {
      if (i >= list.length) {
        say('');
        if (added.length && target) { placePhoto(added[0], target); added = added.slice(1); }
        if (added.length > 1) arrangeAsk(added.length);
        else if (added.length) tip('Photo added. Tap it to place it, or drag it onto a frame.');
        if (dup) toast(dup === 1 ? 'That photo is already in your library: use it as often as you like.' : dup + ' photos were already in your library: use them as often as you like.');
        S.importBad = bad;
        if (S.panel === 'photos' || bad.length) openPanel('photos', true);
        return;
      }
      say('Adding ' + (i + 1) + ' of ' + list.length + '…');
      PH.importFile(list[i], { limits: lim, hashes: hashes, projectId: S.p.id, uid: uid }).then(function (r) {
        return ST.savePhoto(r.meta, r.blobs).then(function () {
          hashes[r.meta.hash] = 1; S.photos[r.meta.id] = r.meta; S.order.push(r.meta.id); added.push(r.meta.id);
          urls[r.meta.id] = URL.createObjectURL(r.blobs.prev); thumbs[r.meta.id] = URL.createObjectURL(r.blobs.thumb);
        });
      }).catch(function (e) { if (e && e.duplicate) dup++; else bad.push({ file: list[i], why: (e && e.message) || 'This file couldn’t be added.' }); }).then(function () { done++; if (S.panel === 'photos' && done % 4 === 0) openPanel('photos', true); next(i + 1); });
    }
    say(retry ? 'Trying again…' : 'Preparing…');
    expand();
  }
  function arrangeAsk(n) {
    var d = document.createElement('dialog'); d.className = 'pe-ask';
    d.innerHTML = '<div class="pe-ask__in"><h3>' + n + ' photos added</h3><p>Shall we design the pages for you? We group your photos into moments by when and where they were taken and how they look, open each moment with its best shot, and fit every photo into a frame of its own shape, centred on the people in it. You can change any page afterwards.</p>' +
      '<div class="pe-ask__acts"><button class="btn btn--p" data-a="empty">Arrange them for me</button><button class="btn btn--ghost" data-a="all">Rearrange the whole book</button><button class="btn btn--ghost" data-a="no">I’ll place them myself</button></div></div>';
    document.body.appendChild(d); d.showModal();
    d.addEventListener('click', function (e) { var b = e.target.closest('[data-a]'); if (!b && e.target !== d) return; var a = b ? b.getAttribute('data-a') : 'no'; d.close(); d.remove(); if (a === 'empty') arrange(false); else if (a === 'all') arrange(true); });
  }
  /** Lays photos out across pages like a designer would (see arrange.js): moments by time, place and mood, an
      opening photo per moment, every photo in a frame of its own shape, crops centred on the subject.
      all = rebuild every page from every photo; otherwise fill the empty pages. */
  function arrange(all) {
    var AR = window.PBKArrange;
    var used = all ? {} : usedMap();
    var free = S.order.filter(function (id) { return !used[id]; });
    if (!free.length) { toast(S.order.length ? 'All your photos are already in the book.' : 'Add some photos first.'); return; }
    if (S.arranging) return; S.arranging = true;
    var pages = S.p.pages, slots = [];
    function busy(t) { var pr = $('#peProg'); if (pr) pr.textContent = t || ''; }
    busy('Looking at your photos…'); toast('Arranging ' + free.length + ' photo' + (free.length === 1 ? '' : 's') + '…');
    AR.features(free.map(function (id) { return S.photos[id]; }), thumbUrl, function (i, n) { busy('Looking at your photos… ' + Math.round(i / n * 100) + '%'); }).then(function (items) {
      if (all) { for (var i = 0; i < pages.length; i++) slots.push(i); }
      else pages.forEach(function (d, i) { var fr = d.els.filter(function (e) { return e.t === 'photo'; }); if (!d.els.some(function (e) { return e.t !== 'photo'; }) && !fr.some(function (f) { return f.photo; })) slots.push(i); });
      var plan = AR.plan(items, { layouts: LAYOUTS, slots: slots.length, max: slots.length + (BOOK.pages.max - pages.length) });
      var need = plan.length - slots.length, added = 0;
      while (need > 0 && pages.length < BOOK.pages.max) { pages.push(pageDoc('one')); slots.push(pages.length - 1); need--; added++; }
      if (pages.length % 2 && pages.length < BOOK.pages.max) { pages.push(pageDoc('one')); added++; }
      var placed = 0;
      plan.forEach(function (pl, j) {
        if (j >= slots.length) return;
        var d = pages[slots[j]];
        d.els = d.els.filter(function (e) { return e.t !== 'photo'; });
        applyLayout(d, pl.layout);
        var fr = d.els.filter(function (e) { return e.t === 'photo'; });
        pl.ids.forEach(function (id, x) { if (fr[x]) { fr[x].photo = id; fr[x].crop = pl.crops[x]; placed++; } });
      });
      if (all) {
        for (var r = plan.length; r < slots.length; r++) { var d2 = pages[slots[r]]; if (!d2.els.some(function (e) { return e.t !== 'photo'; })) { var L0 = pageDoc('one'); d2.els = L0.els; d2.layout = 'one'; } }
        /* empty pages left at the end beyond the minimum are taken out (in twos, so spreads stay whole) */
        var cut = 0;
        while (pages.length - 2 >= BOOK.pages.min && [pages[pages.length - 1], pages[pages.length - 2]].every(function (d) { return !d.els.some(function (e) { return e.t !== 'photo' || e.photo; }); })) { pages.splice(pages.length - 2, 2); cut += 2; }
        if (cut) added -= cut;
      }
      commit(); S.cur = Math.max(0, Math.min(pages.length - 1, slots[0] || 0)); if (innerWidth < 900) S.panel = null; renderAll(); if (innerWidth < 900) openPanel(null);
      var left = free.length - placed;
      toast(placed + ' photo' + (placed === 1 ? '' : 's') + ' arranged on ' + Math.min(plan.length, slots.length) + ' page' + (plan.length === 1 ? '' : 's') + (added > 0 ? ', ' + added + ' page' + (added === 1 ? '' : 's') + ' added' : added < 0 ? ', ' + (-added) + ' empty pages taken out' : '') + (left > 0 ? '. ' + left + ' didn’t fit: the book is at ' + BOOK.pages.max + ' pages.' : '. Tap ↶ to undo.'));
    }).catch(function (e) { toast('Couldn’t arrange the photos: ' + ((e && e.message) || 'please try again') + '.'); }).then(function () { S.arranging = false; busy(''); });
  }
  function autofill() { arrange(false); }

  /* ---------------- panels ---------------- */
  function bindRail() {
    $('#peRail').addEventListener('click', function (ev) { var b = ev.target.closest('[data-panel]'); if (!b) return; var p = b.getAttribute('data-panel'); openPanel(S.panel === p && innerWidth < 900 ? null : p); });
    el$.file.addEventListener('change', function () { importFiles(this.files); this.value = ''; });
    el$.sfile.addEventListener('change', function () { importSticker(this.files && this.files[0]); this.value = ''; });
  }
  function openPanel(name, keepScroll) {
    var P = el$.panel, sc = P.scrollTop;
    S.panel = name; el$.pe.classList.remove('is-peek');
    document.querySelectorAll('#peRail [data-panel]').forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-panel') === (name === 'spine' ? 'cover' : name)); });
    el$.pe.classList.toggle('has-panel', !!name);
    if (!name) { P.innerHTML = ''; setTimeout(fit, 0); return; }
    var head = function (t, sub) { return '<div class="pe-ph"><div><h3>' + t + '</h3>' + (sub ? '<p>' + sub + '</p>' : '') + '</div><button class="pe-ib pe-ph__x" data-close aria-label="Close">' + I.x + '</button></div>'; };
    var h = '';
    if (name === 'photos') {
      var used = usedMap();
      h = head('Photos', S.target ? 'Choose a photo for the selected frame.' : 'Tap a photo to place it on this page, or ' + (innerWidth > 900 ? 'drag it' : 'press, hold and drag it') + ' onto a frame or a page below.') +
        '<div class="pe-row"><button class="btn btn--p btn--sm" data-act="add">' + I.plus + ' Add photos</button>' + (S.order.length ? '<button class="btn btn--ghost btn--sm" data-act="auto">Arrange for me</button>' : '') + '<button class="btn btn--ghost btn--sm" data-act="frame">' + I.frame + ' Add a photo frame</button></div>' + (S.order.length > 1 ? '<button class="pe-linkbtn" data-act="autoall">Rearrange the whole book</button>' : '<p class="pe-note">Select as many photos as you like: we’ll lay them out, two landscapes to a page, portraits on their own.</p>') + '<p class="pe-prog" id="peProg"></p>' +
        (S.importBad && S.importBad.length ? '<div class="pe-bad"><b>' + S.importBad.length + ' file' + (S.importBad.length === 1 ? '' : 's') + ' couldn’t be added</b><ul>' + S.importBad.slice(0, 6).map(function (x) { return '<li>' + esc(x.why) + '</li>'; }).join('') + '</ul><div class="pe-row"><button class="btn btn--ghost btn--sm" data-act="retry">Try again</button><button class="pe-linkbtn" data-act="badok">Dismiss</button></div></div>' : '') +
        (S.order.length ? '<div class="pe-photos">' + S.order.map(function (id) { var m = S.photos[id]; return '<button class="pe-thumb" data-ph="' + id + '" title="' + esc(m.name) + '"><img alt="" data-src="' + id + '">' + (used[id] ? '<span class="pe-used">' + used[id] + '</span>' : '') + (m.low ? '<span class="pe-low" title="Small photo: it may look soft in print">Low res</span>' : '') + '</button>'; }).join('') + '</div>' :
          '<div class="pe-emptyp">' + I.photo + '<p>Your photos stay on this device while you design. JPEG, PNG, WebP and iPhone (HEIC) photos, or the pages of a PDF and the pictures in a Word document.</p></div>');
    } else if (name === 'layouts') {
      if (S.cur < 0) h = head('Layouts', 'Layouts are for the inside pages. Choose a page below the cover.') + '<div class="pe-row"><button class="btn btn--dark btn--sm" data-act="page1">Go to page 1</button></div>';
      else if (isBack()) h = head('Back cover', 'Move, resize or replace the map and words, add a photo, text or artwork, or change the colour.') + '<div class="pe-row"><button class="btn btn--dark btn--sm" data-act="frame">' + I.frame + ' Add a photo frame</button><button class="btn btn--ghost btn--sm" data-act="resetback">' + I.reset + ' Reset the back cover</button></div>';
      else h = head('Page layout', 'Start from a layout, or add photos straight onto the page. You can move, resize and align everything.') + '<div class="pe-row"><button class="btn btn--dark btn--sm" data-act="frame">' + I.frame + ' Add a photo frame</button></div><div class="pe-layouts">' + Object.keys(LAYOUTS).map(function (k) {
        var L = LAYOUTS[k]; return '<button class="pe-lay' + (doc().layout === k ? ' is-on' : '') + '" data-lay="' + k + '" title="' + L.n + '"><svg viewBox="0 0 120 ' + Math.round(H / 10) + '">' + L.f.map(function (f) { return '<rect x="' + f[0] / 10 + '" y="' + f[1] / 10 + '" width="' + f[2] / 10 + '" height="' + f[3] / 10 + '" rx="1.5"/>'; }).join('') + '</svg><span>' + L.n + '</span></button>';
      }).join('') + '</div>' +
        '<div class="pe-sub"><h4>Use on more pages</h4><div class="pe-row"><button class="btn btn--ghost btn--sm" data-act="layall"' + (doc().layout ? '' : ' disabled') + '>Use this layout on every empty page</button></div>' +
        '<h4>My page designs</h4><p class="pe-note">Save this page’s arrangement (frames, words, shapes) and reuse it on any page. Photos aren’t copied: the frames wait for new ones.</p><div class="pe-row"><button class="btn btn--ghost btn--sm" data-act="tplsave">' + I.plus + ' Save this page’s design</button></div>' +
        ((S.p.tpls || []).length ? '<div class="pe-tpls">' + S.p.tpls.map(function (t, i) { return '<div class="pe-tpl"><button data-act="tpluse:' + i + '"><canvas width="90" height="127" data-tpl="' + i + '"></canvas><span>' + esc(t.name) + '</span></button><button class="pe-tpl__x" data-act="tpldel:' + i + '" aria-label="Delete this design">' + I.x + '</button></div>'; }).join('') + '</div>' : '') + '</div>' +
        '<div class="pe-sub"><h4>Pages</h4><div class="pe-row"><button class="btn btn--ghost btn--sm" data-act="addpages">' + I.plus + ' Add 2 pages</button><button class="btn btn--ghost btn--sm" data-act="delpage">' + I.trash + ' Remove this page</button></div><div class="pe-row"><button class="btn btn--ghost btn--sm" data-act="mvl">' + I.left + ' Move earlier</button><button class="btn btn--ghost btn--sm" data-act="mvr">Move later ' + I.right + '</button></div></div>';
    } else if (name === 'text') {
      var e = selEl(), isText = e && e.t === 'text';
      h = head(isText ? 'Edit text' : 'Text', isText ? '' : 'Add a heading or a caption, then drag it into place.');
      if (isText) {
        R.loadAllFonts().then(function () { draw(); });
        h += '<textarea class="pe-ta" id="peTa" rows="' + (e.role === 'title' ? 1 : 3) + '">' + esc(e.text) + '</textarea>' +
          '<div class="pe-sub"><h4>Font</h4><div class="pe-fonts">' + Object.keys(R.FONTS).map(function (k) { var f = R.FONTS[k]; return '<button data-font="' + k + '" class="' + (e.font === k ? 'is-on' : '') + '" style="font-family:' + esc(f.css) + ';font-weight:' + f.w + (f.italic ? ';font-style:italic' : '') + '">' + esc(f.name) + '</button>'; }).join('') + '</div></div>' +
          '<div class="pe-sub"><h4>Colour</h4>' + swatches('tcolor', e.color) + '</div>' +
          '<div class="pe-sub"><h4>Size</h4><input type="range" id="peTs" min="18" max="320" value="' + Math.round(e.cap ? e.cap : (e.size || 80) * 0.7) + '"></div>' +
          '<div class="pe-sub"><h4>Alignment</h4><div class="pe-seg">' + [['left', 'Left'], ['center', 'Centre'], ['right', 'Right'], ['fill', 'Fill width']].map(function (a) { return '<button data-align="' + a[0] + '"' + ((e.align || 'left') === a[0] ? ' class="is-on"' : '') + '>' + a[1] + '</button>'; }).join('') + '</div></div>' +
          '<label class="pe-check"><input type="checkbox" data-act="shadow"' + (e.shadow ? ' checked' : '') + '><span>Shadow behind the words</span></label>' +
          '<div class="pe-row"><button class="btn btn--ghost btn--sm" data-act="deltext">' + I.trash + ' Delete</button></div>';
      } else {
        h += '<div class="pe-addtext"><button data-add="h"><b style="font-family:' + R.FONTS.spartan.css + ';font-weight:800;font-size:1.5rem">ADD A HEADING</b></button><button data-add="s"><b style="font-family:' + R.FONTS.serif.css + ';font-size:1.25rem">Add a subheading</b></button><button data-add="c"><span style="font-family:' + R.FONTS.sans.css + '">Add a caption</span></button><button data-add="q"><span style="font-family:' + R.FONTS.script.css + ';font-size:1.4rem">Add a handwritten note</span></button></div>';
        if (S.cur < 0) { var t = C.TPL[S.p.tpl]; if (t && t.kind === 'raster') h += rasterNote(t); }
      }
    } else if (name === 'stickers') {
      var tab = S.stab || 'all'; if (['all', 'classic', 'stickers', 'emoji', 'words', 'shapes', 'mine'].indexOf(tab) < 0) tab = S.stab = 'all';
      h = head(S.replaceArt ? 'Replace artwork' : 'Stickers', S.replaceArt ? 'Choose what goes in its place.' : 'Tap to add, then drag and resize.') +
        '<label class="pe-q"><input type="search" id="peSq" placeholder="Search: Paris, safari, beach, flowers…"></label>' +
        '<div class="pe-tabs">' + [['all', 'All'], ['classic', 'Stickers'], ['stickers', 'Travel art'], ['emoji', 'Emoji'], ['words', 'Words'], ['shapes', 'Shapes'], ['mine', 'My uploads']].map(function (x) { return '<button data-stab="' + x[0] + '"' + (tab === x[0] ? ' class="is-on"' : '') + '>' + x[1] + '</button>'; }).join('') + '</div>' +
        '<div id="peStk">' + (tab === 'shapes' ? shapeGrid() : stickerGrid('', tab)) + '</div>';
    } else if (name === 'colors') {
      var d = doc(), isCov = S.cur < 0, tt = isCov && C.TPL[S.p.tpl];
      h = head(isCov ? 'Cover colours' : 'Page colour');
      if (isCov && tt && tt.kind === 'raster' && !tt.layered) h += '<p class="pe-note">This cover’s colours are part of its artwork. ' + (tt.editable ? 'You can change its title and the title colour.' : '') + '</p>';
      else h += '<div class="pe-sub"><h4>' + (isCov ? 'Cover colour' : 'Background') + '</h4>' + swatches('bg', d.img && tt ? tt.bg : d.bg, isCov ? C.COVER_COLORS : null) + '</div>';
      if (isCov && tt && tt.kind === 'raster' && tt.editable && !d.edited) h += '<div class="pe-sub"><h4>Title</h4>' + swatches('title', tt.tc, C.TEXT_COLORS) + '</div>';
      if (isCov) {
        var tEl = d.els.filter(function (x) { return x.role === 'title'; })[0], sEl = d.els.filter(function (x) { return x.role === 'sub'; })[0];
        if (tEl) h += '<div class="pe-sub"><h4>Title</h4>' + swatches('title', tEl.color) + '</div>';
        if (sEl) h += '<div class="pe-sub"><h4>Subtitle</h4>' + swatches('sub', sEl.color) + '</div>';
        if (!d.ownBrand) h += '<div class="pe-sub"><h4>Logo colour</h4><div class="pe-sw">' + uniq([tEl && tEl.color, sEl && sEl.color, '#ffffff', '#141414']).map(function (c) { return '<button style="--c:' + c + '" data-k="brand" data-c="' + c + '"' + (c === d.brand ? ' class="is-on"' : '') + ' aria-label="' + c + '"></button>'; }).join('') + '</div><p class="pe-note">Its size and place stay the same on every book.</p></div>';
      } else if (isBack()) h += '<div class="pe-sub"><h4>Website text</h4><div class="pe-sw">' + uniq([d.brand, '#ffffff', '#141414', '#1b1714']).map(function (c) { return '<button style="--c:' + c + '" data-k="brand" data-c="' + c + '"' + (c === d.brand ? ' class="is-on"' : '') + ' aria-label="' + c + '"></button>'; }).join('') + '</div></div>';
      else h += '<div class="pe-row"><button class="btn btn--ghost btn--sm" data-act="bgall">Use this colour on every page</button></div>';
    } else if (name === 'cover') {
      var t2 = C.TPL[S.p.tpl], cov = S.p.cover;
      h = head('Cover', S.cur < 0 ? 'Edit the words, colours and stickers. The preview shows your book.' : '') + '<canvas class="pe-mockp" id="peMockP" width="550" height="710" aria-label="Book preview"></canvas>';
      if (S.cur >= 0) h += '<div class="pe-row"><button class="btn btn--dark btn--sm" data-act="gocover">Edit the cover</button></div>';
      h += '<div class="pe-curcover"><img alt="" src="' + (t2 ? PBK.mockSrc(t2, S.p.pal) : PBK.mockSrc('blank', 0)) + '"><div><b>' + esc(t2 ? t2.name : 'Blank cover') + '</b><span>' + esc(t2 ? (C.cat(t2.cat) || {}).name || '' : 'Your own design') + '</span><button class="btn btn--ghost btn--sm" data-act="change">Change cover</button></div></div>';
      if (t2 && t2.kind === 'vector') h += '<div class="pe-sub"><h4>Colour options</h4><div class="pe-sw pe-sw--big">' + t2.palettes.map(function (p, i) { return '<button style="--c:' + p[0] + ';--d:' + p[1] + '" data-pal="' + i + '"' + (i === S.p.pal ? ' class="is-on"' : '') + ' aria-label="Colour option ' + (i + 1) + '"></button>'; }).join('') + '</div></div>';
      if (S.p.tpl === 'blank') h += '<div class="pe-sub"><h4>Colour</h4><div class="pe-sw pe-sw--big">' + C.BLANK.map(function (c, i) { return '<button style="--c:' + c + '" data-blank="' + i + '"' + (cov.bg === c ? ' class="is-on"' : '') + '></button>'; }).join('') + '</div></div>';
      if (t2 && t2.kind === 'raster') h += rasterNote(t2);
      var tE = cov.els.filter(function (x) { return x.role === 'title'; })[0], sE = cov.els.filter(function (x) { return x.role === 'sub'; })[0];
      var tw = t2 && t2.kind === 'raster' && t2.editable && !cov.edited ? { title: (t2.lines[0] || {}).text, sub: (t2.lines.filter(function (l, i) { return i > 0 && l.role !== 'year'; })[0] || {}).text } : null;
      if (tE || (tw && tw.title)) h += '<div class="pe-sub"><h4>Title</h4><input class="pe-in" data-role="title" value="' + esc(tE ? tE.text : tw.title) + '" maxlength="40"></div>';
      if (sE || (tw && tw.sub)) h += '<div class="pe-sub"><h4>Subtitle</h4><input class="pe-in" data-role="sub" value="' + esc(sE ? sE.text : tw.sub) + '" maxlength="40"></div>';
      var yE = cov.els.filter(function (x) { return x.role === 'year'; })[0];
      if (yE) h += '<div class="pe-sub"><h4>Year</h4><input class="pe-in" data-role="year" value="' + esc(yE.text) + '" maxlength="9" inputmode="numeric"></div>';
      if (tE || yE || (tw && tw.title)) h += '<label class="pe-check"><input type="checkbox" data-act="covshadow"' + ((tE || yE || {}).shadow ? ' checked' : '') + '><span>Shadow behind the words</span></label>';
      if (t2 && t2.layered) h += '<div class="pe-sub"><h4>Cover colour</h4>' + swatches('bg', cov.img ? t2.bg : cov.bg, C.COVER_COLORS) + '</div>';
      if (t2 && t2.kind === 'raster' && t2.editable) { var tc = tE ? tE.color : t2.tc; h += '<div class="pe-sub"><h4>Title colour</h4>' + swatches('title', tc, C.TEXT_COLORS) + '</div>'; }
      var so = spineOpts();
      h += '<div class="pe-sub"><h4>Spine</h4><button class="pe-spbtn" data-go-panel="spine"><span class="pe-spbtn__s" style="background:' + esc(so.bg || '#fff') + ';color:' + esc(so.tc || '#111') + '">' + esc(so.hideTitle ? '' : (so.title || '').slice(0, 14)) + '</span><span>Edit the spine<small>Words, font, colours</small></span>' + I.right + '</button></div>';
      h += '<div class="pe-sub"><h4>Add to the cover</h4><div class="pe-row"><button class="btn btn--ghost btn--sm" data-act="covphoto">' + I.photo + ' A photo</button><button class="btn btn--ghost btn--sm" data-go-panel="stickers">' + I.sticker + ' Stickers</button><button class="btn btn--ghost btn--sm" data-go-panel="text">' + I.text + ' Text</button></div></div>' +
        '<div class="pe-sub"><h4>This book</h4><button class="btn btn--ghost btn--sm pe-danger" data-act="delbook">' + I.trash + ' Delete this book</button></div>';
    }
    if (name === 'spine') {
      var sp = spineOpts(), SPF = Object.keys(R.FONTS).map(function (k) { return [k, R.FONTS[k].name]; });
      h = head('Spine', 'What you see on the shelf.') +
        '<div class="pe-sub"><h4>Words</h4><input class="pe-in" data-spine="title" value="' + esc(sp.title || '') + '" maxlength="40" placeholder="Words on the spine"' + (sp.hideTitle ? ' disabled' : '') + '>' +
        '<label class="pe-check"><input type="checkbox" data-act="spineoff"' + (sp.hideTitle ? ' checked' : '') + '><span>No words on the spine</span></label></div>' +
        '<div class="pe-sub"><h4>Font</h4><div class="pe-spf">' + SPF.map(function (f) { var F = R.FONTS[f[0]]; return '<button data-spf="' + f[0] + '"' + ((sp.font || 'spartan') === f[0] ? ' class="is-on"' : '') + ' style="font-family:' + esc(F.css) + ';font-weight:' + F.w + (F.italic ? ';font-style:italic' : '') + '">' + f[1] + '</button>'; }).join('') + '</div></div>' +
        '<div class="pe-sub"><h4>Size</h4><input type="range" id="peSpSz" min="50" max="130" step="5" value="' + Math.round((sp.scale || 1) * 100) + '"></div>' +
        '<label class="pe-check"><input type="checkbox" data-act="spinepic"' + (sp.noPic ? '' : ' checked') + '><span>Small picture from the cover</span></label>' +
        '<div class="pe-sub"><h4>Spine colour</h4>' + swatches('spbg', sp.bg, C.COVER_COLORS) + '</div><div class="pe-sub"><h4>Words colour</h4>' + swatches('sptc', sp.tc, C.TEXT_COLORS) + '</div>';
    }
    P.innerHTML = h;
    P.scrollTop = keepScroll ? sc : 0;
    bindPanel(name);
    setTimeout(fit, 0);
    if (name === 'cover') mockSoon();
    if (name === 'photos') P.querySelectorAll('img[data-src]').forEach(function (im) { thumbUrl(im.getAttribute('data-src')).then(function (u) { if (u) im.src = u; }); });
  }
  function rasterNote(t) {
    if (S.p.cover.edited) return '<p class="pe-note">' + (S.p.cover.layered ? 'Tap the words or the artwork on the cover to move, resize or replace them. Type new words below.' : 'Type a new title or subtitle below. The artwork stays as it is.') + '</p><div class="pe-row"><button class="btn btn--ghost btn--sm" data-act="orig">Back to the original</button></div>';
    if (t.editable) return '<div class="pe-sub"><h4>Customise this cover</h4><p class="pe-note">' + (t.layered ? 'Change the place name, add a year, move or replace the artwork, change the colour.' : 'Change the place name or add a year.') + '</p><button class="btn btn--dark btn--sm" data-act="edittitle">' + I.edit + ' Customise</button></div>';
    return '<p class="pe-note">This cover’s lettering is part of its artwork and can’t be changed. You can still add stickers, text or a photo.</p>';
  }
  function uniq(a) { var o = []; a.forEach(function (x) { if (x && o.indexOf(x) < 0) o.push(x); }); return o; }
  function swatches(k, cur, set) {
    var list = uniq([cur].concat(set || COLORS));
    return '<div class="pe-sw">' + list.map(function (c) { return '<button style="--c:' + c + '" data-k="' + k + '" data-c="' + c + '"' + (String(c).toLowerCase() === String(cur).toLowerCase() ? ' class="is-on"' : '') + ' aria-label="' + c + '"></button>'; }).join('') + '<label class="pe-sw__more" title="More colours"><input type="color" data-k="' + k + '" value="' + (/^#[0-9a-f]{6}$/i.test(cur) ? cur : '#ffffff') + '">+</label></div>';
  }
  function EMO() { return window.PBK_EMOJI || {}; }
  /* word stickers: [text, font, colour, background] */
  var WORDS = [['Karibu', 'script', '#c4512b'], ['Hakuna Matata', 'spartan', '#0f5c3a'], ['Safari Njema', 'serifi', '#3b2314'], ['Asante', 'script', '#e5383b'], ['Pole pole', 'round', '#1f3c74'], ['Nairobi nights', 'spartan', '#ffd25e', '#141414'],
    ['Best day ever', 'script', '#ff4f9a'], ['Adventure awaits', 'spartan', '#1f3c74'], ['Good times', 'round', '#ff7a2e'], ['Happy birthday!', 'script', '#e5383b'], ['Just married', 'serifi', '#141414'], ['Love you', 'script', '#e5383b'],
    ['Wish you were here', 'serif', '#1f3c74'], ['Summer vibes', 'round', '#ff4f9a', '#ffe27a'], ['Squad', 'block', '#ffffff', '#141414'], ['Family', 'serif', '#3b2314'], ['Hello, world', 'script', '#2f80ed'], ['Our story', 'serifi', '#c4512b'],
    ['Road trip', 'block', '#141414', '#ffd25e'], ['Bon voyage', 'script', '#1f3c74'], ['Making memories', 'serif', '#0f5c3a'], ['Celebrate', 'spartan', '#ff4f9a'], ['Cheers!', 'script', '#b9831e'], ['Little one', 'round', '#5aaee0'],
    ['Good boy', 'round', '#c8661f'], ['Then & now', 'serif', '#141414'], ['The best is yet to come', 'serifi', '#c4512b'], ['2026', 'block', '#e5383b'], ['Wanderlust', 'script', '#0f5c3a'], ['Home sweet home', 'serif', '#c4512b'],
    ['Jambo!', 'shrikhand', '#ff7a2e'], ['Tukutane', 'pacifico', '#1f3c74'], ['Nakupenda', 'greatvibes', '#e5383b'], ['Sherehe', 'righteous', '#ff4f9a'], ['Mambo vipi?', 'marker', '#141414'], ['Kenya, my home', 'playfairi', '#0f5c3a'],
    ['Mr & Mrs', 'greatvibes', '#b9831e'], ['Forever & always', 'cormorant', '#141414'], ['Save the date', 'playfair', '#1f3c74'], ['Happily ever after', 'dancing', '#c4512b'], ['The beginning', 'playfairi', '#3b2314'], ['I do', 'greatvibes', '#e5383b'],
    ['Happy anniversary', 'dancing', '#e5383b'], ['Class of 2026', 'bebas', '#1f3c74'], ['Graduated!', 'shrikhand', '#7c3aed'], ['Welcome to the world', 'fredoka', '#5aaee0'], ['Oh baby', 'pacifico', '#ff4f9a'], ['First steps', 'amatic', '#2f80ed'],
    ['Beach days', 'pacifico', '#1d7fae', '#ffe27a'], ['Sun, sea & sand', 'satisfy', '#ff7a2e'], ['Passport ready', 'bebas', '#141414', '#ffd25e'], ['Out of office', 'oswald', '#ffffff', '#1f3c74'], ['Postcard from…', 'kaushan', '#c4512b'], ['Weekend getaway', 'lobster', '#0f5c3a'],
    ['Girls trip', 'lobster', '#ff4f9a'], ['Boys trip', 'bebas', '#1f3c74'], ['Best friends', 'pacifico', '#7c3aed'], ['Good vibes only', 'righteous', '#ff7a2e', '#141414'], ['Chapter one', 'abril', '#141414'], ['Making it count', 'josefin', '#0f5c3a'],
    ['Merry Christmas', 'lobster', '#e5383b'], ['Happy new year', 'shrikhand', '#ffd25e', '#141414'], ['Eid Mubarak', 'playfairi', '#0f5c3a'], ['Happy Mother’s Day', 'dancing', '#d23a6a'], ['Happy Father’s Day', 'oswald', '#1f3c74'], ['Thank you', 'greatvibes', '#3b2314'],
    ['Pawsome', 'fredoka', '#c8661f'], ['Fur baby', 'pacifico', '#c8661f'], ['Cutie', 'shrikhand', '#ff4f9a'], ['Grandma & me', 'dancing', '#7c3aed'], ['Sunday lunch', 'cormorant', '#3b2314'], ['Our happy place', 'satisfy', '#1d7fae']];
  function addWord(i) {
    var w = WORDS[i], d = doc();
    var e = { id: uid('tx'), t: 'text', text: w[0], font: w[1], color: w[2], size: w[1] === 'script' ? 110 : 84, align: 'center', x: 150, w: 900, y: ay(S.cur < 0 ? 760 : 700), rot: (Math.random() * 8 - 4) | 0 };
    if (w[3]) e.bgc = w[3];
    clampEl(e); d.els.push(e); commit(); select(e.id); draw(); drawThumb(S.cur); if (innerWidth < 900) openPanel(null);
  }
  function emojiSrc(code) { return '/assets/pbk/emoji/' + code + '.svg'; }
  function travelArt() { return C.ORDER.map(function (id) { return C.TPL[id]; }).filter(function (t) { return t.layered; }); }
  var PH_NAMES = { rings: 'Wedding rings', puppy: 'Puppy', cat: 'Cat', tulips: 'Tulips', dog: 'Dog' };
  function travelGrid(q) {
    var tl = travelArt().filter(function (t) { return !q || (t.name + ' travel').toLowerCase().indexOf(q) >= 0; });
    var pl = [];
    var ph = pl.length ? '<h4 class="pe-gh">Love, family &amp; pets <small>' + pl.length + '</small></h4><div class="pe-stk">' + pl.map(function (k) { var d = C.PH_ART[k]; return '<button data-img="' + C.flSrc('ph:' + k) + '" data-ar="' + (d[0] / d[1]).toFixed(4) + '" title="' + esc(PH_NAMES[k]) + '"><img alt="' + esc(PH_NAMES[k]) + '" loading="lazy" src="/assets/pbk/art2/s/' + k + '.webp"></button>'; }).join('') + '</div>' : '';
    return ph + (tl.length ? '<h4 class="pe-gh">Places <small>' + tl.length + '</small></h4><div class="pe-stk">' + tl.map(function (t) { return '<button data-img="' + t.art + '" data-ar="' + (t.artBox[2] / t.artBox[3]).toFixed(4) + '" title="' + esc(t.name) + '"><img alt="' + esc(t.name) + '" loading="lazy" src="' + t.artThumb + '"></button>'; }).join('') + '</div>' : '');
  }
  var flP = null;
  function flLoad() {
    if (window.PBK_FL || flP) return;
    flP = new Promise(function (ok) { var sc = document.createElement('script'); sc.src = '/assets/pbk/fl/index.js?v=1'; sc.onload = ok; sc.onerror = ok; document.head.appendChild(sc); }).then(function () { if (S.panel === 'stickers') openPanel('stickers', true); });
  }
  function stickerGrid(q, tab) {
    q = (q || '').toLowerCase().trim();
    var h = '';
    if (q) tab = 'all';
    if (tab === 'all' && !q) h += travelGrid(q) + '<h4 class="pe-gh">Stickers</h4>';
    if (tab === 'classic' || tab === 'all') {
      var al = A.list().filter(function (a) { return !q || (a.n + ' ' + a.k).toLowerCase().indexOf(q) >= 0; });
      if (al.length) h += '<div class="pe-stk">' + al.map(function (a) { return '<button data-art="' + a.id + '" title="' + esc(a.n) + '"><img alt="' + esc(a.n) + '" loading="lazy" src="' + R.artSrc(a.id) + '"></button>'; }).join('') + '</div>';
    }
    if (tab === 'stickers' || (tab === 'all' && q)) h += travelGrid(q);
    if (tab === 'emoji' || tab === 'all') {
      var E = EMO(); Object.keys(E).forEach(function (g) {
        var l = E[g].filter(function (e) { return !q || ((e[2] || '') + ' ' + g).toLowerCase().indexOf(q) >= 0; });
        if (l.length) h += '<h4 class="pe-gh">' + esc(g) + ' <small>' + l.length + '</small></h4><div class="pe-stk pe-stk--emo">' + l.map(function (e) { return '<button data-img="' + emojiSrc(e[0]) + '" data-ar="1" title="' + esc(e[2] || e[1]) + '"><img alt="' + esc(e[1]) + '" loading="lazy" src="' + emojiSrc(e[0]) + '"></button>'; }).join('') + '</div>';
      });
      if (tab === 'emoji') h += '<p class="pe-note pe-credit">Emoji: Twemoji, CC-BY 4.0.</p>';
    }
    if (tab === 'words' || (tab === 'all' && q)) {
      R.loadAllFonts();
      var wl = WORDS.filter(function (w) { return !q || w[0].toLowerCase().indexOf(q) >= 0; });
      if (wl.length) h += (tab === 'all' ? '<h4 class="pe-gh">Words</h4>' : '<p class="pe-note">Tap to add, then drag, resize and edit the words.</p>') + '<div class="pe-words">' + wl.map(function (w, i) { var f = R.FONTS[w[1]]; return '<button data-word="' + WORDS.indexOf(w) + '" style="font-family:' + esc(f.css) + ';font-weight:' + f.w + (f.italic ? ';font-style:italic' : '') + ';color:' + w[2] + (w[3] ? ';background:' + w[3] : '') + '">' + esc(w[0]) + '</button>'; }).join('') + '</div>';
    }
    if (tab === 'mine') {
      h += '<div class="pe-row"><button class="btn btn--p btn--sm" data-act="upsticker">' + I.plus + ' Upload a sticker</button></div><p class="pe-note">PNG with a transparent background works best. It stays on this device.</p>';
      if (S.stickers.length) h += '<div class="pe-stk">' + S.stickers.map(function (id) { var m = S.photos[id]; return '<button data-mine="' + id + '" data-ar="' + (m.w / m.h).toFixed(4) + '" title="' + esc(m.name) + '"><img alt="" data-src="' + id + '"></button>'; }).join('') + '</div>';
    }
    return h || '<p class="pe-note">Nothing matches. Try “heart”, “sun”, “lion” or “Kenya”.</p>';
  }
  function bindPanel(name) {
    var P = el$.panel;
    P.onclick = function (ev) {
      var t = ev.target;
      if (t.closest('[data-close]')) { openPanel(null); return; }
      var gp = t.closest('[data-go-panel]'); if (gp) { openPanel(gp.getAttribute('data-go-panel')); return; }
      var act = t.closest('[data-act]'); if (act) { if (act.type === 'checkbox') return; return doAct(act.getAttribute('data-act')); }
      var ph = t.closest('[data-ph]'); if (ph && P._noClick && Date.now() - P._noClick < 400) return; if (ph) return placePhoto(ph.getAttribute('data-ph'), S.target || (selEl() && selEl().t === 'photo' ? S.sel : null));
      var lay = t.closest('[data-lay]'); if (lay) { var lost = applyLayout(doc(), lay.getAttribute('data-lay')); select(null); commit(); draw(); drawThumb(S.cur); openPanel('layouts', true); if (lost) toast('One photo was taken off this page. It is still in your photos.'); return; }
      var art = t.closest('[data-art]'); if (art) return addArt(art.getAttribute('data-art'));
      var im = t.closest('[data-img]'); if (im) return addImg({ src: im.getAttribute('data-img') }, +im.getAttribute('data-ar') || 1);
      var wd = t.closest('[data-word]'); if (wd) return addWord(+wd.getAttribute('data-word'));
      var mn = t.closest('[data-mine]'); if (mn) return addImg({ photo: mn.getAttribute('data-mine') }, +mn.getAttribute('data-ar') || 1);
      var tb = t.closest('[data-stab]'); if (tb) { S.stab = tb.getAttribute('data-stab'); openPanel('stickers'); return; }
      var add = t.closest('[data-add]'); if (add) return addText(add.getAttribute('data-add'));
      var f = t.closest('[data-font]'); if (f) { var e = selEl(); if (e) { e.font = f.getAttribute('data-font'); delete e.weight; commit(); draw(); drawThumb(S.cur); openPanel('text', true); } return; }
      var al = t.closest('[data-align]'); if (al) { var e2 = selEl(); if (e2) { e2.align = al.getAttribute('data-align'); commit(); draw(); openPanel('text', true); } return; }
      var sw = t.closest('[data-c][data-k]'); if (sw) return setColor(sw.getAttribute('data-k'), sw.getAttribute('data-c'));
      var pal = t.closest('[data-pal]'); if (pal) return setPalette(+pal.getAttribute('data-pal'));
      var bl = t.closest('[data-blank]'); if (bl) { var c = C.BLANK[+bl.getAttribute('data-blank')]; S.p.cover.bg = c; var dark = C.luminance(c) < 0.45; S.p.cover.brand = dark ? '#ffffff' : '#1d1d1f'; S.p.cover.els.forEach(function (x) { if (x.role === 'title') x.color = dark ? '#ffffff' : '#1d1d1f'; if (x.role === 'sub') x.color = dark ? '#ffd25e' : '#e5383b'; }); commit(); renderAll(); return; }
    };
    P.querySelectorAll('input[type=checkbox][data-act]').forEach(function (cb) { cb.addEventListener('change', function () { doAct(cb.getAttribute('data-act')); }); });
    P.querySelectorAll('input[type=color][data-k]').forEach(function (inp) { inp.addEventListener('input', function () { setColor(inp.getAttribute('data-k'), inp.value, true); }); inp.addEventListener('change', function () { commit(); openPanel(S.panel, true); }); });

    var ta = $('#peTa', P);
    if (ta) {
      ta.addEventListener('input', function () { var e = selEl(); if (!e) return; e.text = e.role === 'title' || e.role === 'sub' ? ta.value.replace(/\n/g, ' ') : ta.value; draw(); });
      ta.addEventListener('change', function () { commit(); drawThumb(S.cur); syncCoverInputs(); });
      if (innerWidth > 900) ta.focus();
    }
    var ts = $('#peTs', P);
    if (ts) { ts.addEventListener('input', function () { var e = selEl(); if (!e) return; var v = +ts.value; if (e.cap) e.cap = v; else e.size = v / 0.7; if (e.align === 'fill' && e.cap) e.w = Math.max(e.w, 200); clampEl(e); draw(); }); ts.addEventListener('change', function () { commit(); drawThumb(S.cur); }); }
    var sq = $('#peSq', P); if (sq) sq.addEventListener('input', function () { $('#peStk').innerHTML = stickerGrid(sq.value, (S.stab === 'shapes' ? 'all' : S.stab) || 'all'); loadMine(); });
    P.querySelectorAll('canvas[data-tpl]').forEach(function (cv) { var t = (S.p.tpls || [])[+cv.getAttribute('data-tpl')]; if (!t) return; var d = { bg: t.bg, els: t.els }; R.load(d, { photo: photoUrl }).then(function () { var g = cv.getContext('2d'); R.draw(g, d, { scale: cv.width / W, scaleY: cv.height / H, photo: photoUrl, empty: 'soft' }); }); });
    if (name === 'stickers') loadMine();
    P.querySelectorAll('[data-spf]').forEach(function (b) { b.onclick = function () { S.p.spine = S.p.spine || {}; S.p.spine.font = b.getAttribute('data-spf'); R.loadFam && R.loadFam(S.p.spine.font); R.loadAllFonts(); commit(); if (!isCoverIdx()) go(-1); draw(); mockSoon(); openPanel('spine', true); setTimeout(draw, 400); }; });
    var spz = $('#peSpSz', P); if (spz) { spz.addEventListener('input', function () { S.p.spine = S.p.spine || {}; S.p.spine.scale = +spz.value / 100; draw(); }); spz.addEventListener('change', function () { commit(); mockSoon(); }); }
    P.querySelectorAll('.pe-in[data-spine]').forEach(function (inp) {
      inp.addEventListener('input', function () { S.p.spine = S.p.spine || {}; S.p.spine.title = inp.value.toUpperCase(); if (!isCoverIdx()) go(-1); draw(); mockSoon(); });
      inp.addEventListener('change', function () { commit(); });
    });
    P.querySelectorAll('.pe-in[data-role]').forEach(function (inp) {
      inp.addEventListener('focus', function () { ensureEditable(); });
      inp.addEventListener('input', function () { if (inp.getAttribute('data-role') !== 'year') ensureEditable(); var e = S.p.cover.els.filter(function (x) { return x.role === inp.getAttribute('data-role'); })[0]; if (e) { e.text = inp.value.toUpperCase(); if (S.cur !== -1) go(-1); draw(); mockSoon(); } });
      inp.addEventListener('change', function () { commit(); drawThumb(-1); });
    });
  }
  function syncCoverInputs() { document.querySelectorAll('.pe-in[data-role]').forEach(function (inp) { var e = S.p.cover.els.filter(function (x) { return x.role === inp.getAttribute('data-role'); })[0]; if (e && document.activeElement !== inp) inp.value = e.text; }); }
  function ensureEditable() {
    var t = C.TPL[S.p.tpl], cov = S.p.cover;
    if (!t || t.kind !== 'raster' || cov.edited || !t.editable) return;
    var nd = C.rasterDoc(t, true), oy = cov.els.filter(function (x) { return x.role === 'year'; })[0];
    if (oy) nd.els.forEach(function (x) { if (x.role === 'year') { x.text = oy.text; x.shadow = oy.shadow; } });
    nd.els = nd.els.concat(cov.els.filter(function (x) { return x.role !== 'title' && x.role !== 'sub' && x.role !== 'year'; }));
    S.p.cover = nd; commit();
  }
  function doAct(a) {
    if (a.indexOf('shape:') === 0) return addShape(a.slice(6));
    if (a === 'layall') { var key = doc().layout, n = 0; if (!LAYOUTS[key]) return; S.p.pages.forEach(function (d, i) { if (i !== S.cur && blankDoc(d)) { applyLayout(d, key); n++; drawThumb(i); } }); commit(); toast(n ? 'Layout used on ' + n + ' empty page' + (n === 1 ? '' : 's') + '.' : 'There are no empty pages.'); return; }
    if (a === 'tplsave') { var d0 = doc(), nm = prompt('Name this design', 'Design ' + (((S.p.tpls || []).length) + 1)); if (nm === null) return; var els = clone(d0.els || []).map(function (e) { if (e.t === 'photo') { e.photo = null; delete e.fx; delete e.mask; delete e.rect; e.crop = { z: 1, cx: .5, cy: .5 }; } return e; }); S.p.tpls = (S.p.tpls || []).concat([{ name: (nm || 'My design').slice(0, 30), bg: d0.bg, els: els }]).slice(-12); commit(); openPanel('layouts', true); toast('Saved. Tap it on any page to use it.'); return; }
    if (a.indexOf('tpluse:') === 0) { var t = (S.p.tpls || [])[+a.slice(7)]; if (!t) return; var d1 = doc(), keep = d1.els.filter(function (e) { return e.t === 'photo' && e.photo; }).map(function (e) { return e.photo; }), ne = clone(t.els).map(function (e) { e.id = uid(e.t === 'photo' ? 'ph' : e.t); return e; }); ne.filter(function (e) { return e.t === 'photo'; }).forEach(function (e, k) { if (keep[k]) e.photo = keep[k]; }); var lost = Math.max(0, keep.length - ne.filter(function (e) { return e.t === 'photo'; }).length); d1.els = ne; if (t.bg) d1.bg = t.bg; delete d1.layout; select(null); commit(); draw(); toast(lost ? 'Design used. ' + lost + ' photo' + (lost === 1 ? '' : 's') + ' didn’t fit and went back to your library.' : 'Design used on this page.'); return; }
    if (a.indexOf('tpldel:') === 0) { if (!confirm('Delete this saved design? Pages already using it stay as they are.')) return; S.p.tpls.splice(+a.slice(7), 1); commit(); openPanel('layouts', true); return; }
    if (a === 'add') { S.importTarget = S.target || null; el$.file.click(); }
    else if (a === 'retry') { var bl = (S.importBad || []).map(function (x) { return x.file; }); S.importBad = null; importFiles(bl, true); }
    else if (a === 'badok') { S.importBad = null; openPanel('photos', true); }
    else if (a === 'auto') arrange(false);
    else if (a === 'autoall') { if (confirm('Rearrange every page using all your photos? Text and stickers on the pages stay.')) arrange(true); }
    else if (a === 'upsticker') el$.sfile.click();
    else if (a === 'frame') addFrame();
    else if (a === 'delbook') deleteBook();
    else if (a === 'page1') go(0);
    else if (a === 'resetback') { delete S.p.back; backDoc(); select(null); commit(); draw(); drawThumb(S.p.pages.length); }
    else if (a === 'gocover') go(-1);
    else if (a === 'addpages') addPages();
    else if (a === 'delpage') delPage();
    else if (a === 'mvl' || a === 'mvr') movePage(a === 'mvl' ? -1 : 1);
    else if (a === 'deltext') removeSel();
    else if (a === 'spineoff') { S.p.spine = S.p.spine || {}; S.p.spine.hideTitle = !S.p.spine.hideTitle; commit(); if (!isCoverIdx()) go(-1); draw(); mockSoon(); openPanel('spine', true); }
    else if (a === 'spinepic') { S.p.spine = S.p.spine || {}; S.p.spine.noPic = !S.p.spine.noPic; commit(); if (!isCoverIdx()) go(-1); draw(); mockSoon(); openPanel('spine', true); }
    else if (a === 'shadow') { var e = selEl(); if (e) { e.shadow = e.shadow ? 0 : 1; commit(); draw(); drawThumb(S.cur); } }
    else if (a === 'covshadow') { ensureEditable(); var on = !(S.p.cover.els.filter(function (x) { return x.role === 'title' || x.role === 'year'; })[0] || {}).shadow; S.p.cover.els.forEach(function (x) { if (x.t === 'text' && (x.role === 'title' || x.role === 'sub' || x.role === 'year')) x.shadow = on ? 1 : 0; }); if (S.cur !== -1) go(-1); commit(); draw(); drawThumb(-1); mockSoon(); }
    else if (a === 'bgall') { var c = doc().bg; S.p.pages.forEach(function (p) { p.bg = c; }); commit(); renderAll(); }
    else if (a === 'change') PBK.pick(C.TPL[S.p.tpl] ? C.TPL[S.p.tpl].cat : 'all', changeCover);
    else if (a === 'edittitle') { ensureEditable(); go(-1); var te = S.p.cover.els.filter(function (x) { return x.role === 'title'; })[0]; if (te) select(te.id); openPanel('text'); }
    else if (a === 'orig') { var t = C.TPL[S.p.tpl]; var nd = C.rasterDoc(t, !!t.layered); nd.els = nd.els.concat(S.p.cover.els.filter(function (x) { return x.role !== 'title' && x.role !== 'sub' && x.role !== 'year' && x.id !== 'art'; })); S.p.cover = nd; select(null); commit(); renderAll(); }
    else if (a === 'covphoto') { go(-1); var d = S.p.cover; var has = d.els.filter(function (x) { return x.t === 'photo'; }).length; if (has >= MAXPH) { toast('The cover holds up to ' + MAXPH + ' photos.'); return; } var e2 = { id: uid('ph'), t: 'photo', x: 330, y: ay(500), w: 640, h: ay(800), photo: null, crop: { z: 1, cx: .5, cy: .5 }, border: 14, borderColor: '#ffffff' }; d.els.push(e2); commit(); select(e2.id); S.target = e2.id; draw(); openPanel('photos'); }
  }
  function replaceWith(props, ar) {
    var d = doc(), old = d.els.filter(function (x) { return x.id === S.replaceArt; })[0]; S.replaceArt = null;
    if (!old) return;
    var w = old.w, h = w / ar; if (h > old.h) { h = old.h; w = h * ar; }
    var e = Object.assign({ id: old.id, x: old.x + (old.w - w) / 2, y: old.y + (old.h - h) / 2, w: w, h: h }, props);
    d.els[d.els.indexOf(old)] = e;
    R.load(d, { photo: photoUrl }).then(function () { draw(); });
    commit(); select(e.id); draw(); drawThumb(S.cur); if (innerWidth < 900) openPanel(null); else openPanel('stickers', true);
  }
  function changeCover(id, c) {
    var keep = S.p.cover.els.filter(function (x) { return x.t === 'photo' && x.photo; });
    var nd = C.docFor(id, c); nd.els = nd.els.concat(keep);
    S.p.cover = nd; S.p.tpl = id; S.p.pal = c; refreshBack(true);
    if (/photo book$/.test(S.p.name) || S.p.name === 'My photo book') { var t = C.TPL[id]; S.p.name = t ? t.name + ' photo book' : 'My photo book'; $('#peName').value = S.p.name; }
    select(null); commit(); go(-1); renderAll();
  }
  function setPalette(i) {
    var t = C.TPL[S.p.tpl]; if (!t || t.kind !== 'vector') return;
    var p = t.palettes[i]; S.p.pal = i;
    var d = S.p.cover; d.bg = p[0]; d.brand = p[3] || p[1];
    d.els.forEach(function (e) { if (e.role === 'title') e.color = p[1]; if (e.role === 'sub') e.color = p[2]; });
    refreshBack(false); commit(); renderAll();
  }
  /** a new cover (or colour) brings a matching back cover; anything the customer added there stays.
      The spine takes the new cover's words and colours, keeping the chosen font and size. */
  function refreshBack(newCover) {
    var old = S.p.back; delete S.p.back;
    var nb = backDoc(); if (old && nb) nb.els = nb.els.concat((old.els || []).filter(function (e) { return ['map', 'place', 'art'].indexOf(e.id) < 0; }));
    if (S.p.spine) { delete S.p.spine.bg; delete S.p.spine.tc; if (newCover) delete S.p.spine.title; }
  }
  function setColor(k, c, live) {
    if (S.cur < 0 && (k === 'bg' || k === 'brand')) ensureEditable();
    if (k === 'spbg' || k === 'sptc') { S.p.spine = S.p.spine || {}; S.p.spine[k === 'spbg' ? 'bg' : 'tc'] = c; if (live) { draw(); return; } commit(); draw(); mockSoon(); openPanel(S.panel, true); return; }
    var d = doc();
    if (k === 'bg') d.bg = c;
    else if (k === 'brand') d.brand = c;
    else if (k === 'title' || k === 'sub') { ensureEditable(); S.p.cover.els.forEach(function (e) { if (e.role === k) e.color = c; }); }
    else if (k === 'tcolor') { var e = selEl(); if (e) e.color = c; }
    if (live) { draw(); return; }
    commit(); draw(); drawThumb(S.cur); openPanel(S.panel, true);
  }
  function loadMine() { el$.panel.querySelectorAll('[data-mine] img[data-src]').forEach(function (im) { thumbUrl(im.getAttribute('data-src')).then(function (u) { if (u) im.src = u; }); }); }
  /** Put a sticker/emoji/uploaded image on the page, or in place of the element being replaced. */
  function addImg(o, ar) {
    var d = doc(), size = 380, w = ar >= 1 ? size : size * ar, h = ar >= 1 ? size / ar : size;
    var e = { id: uid('im'), t: 'img', src: o.src || null, photo: o.photo || null, w: w, h: h };
    var old = S.replaceArt && d.els.filter(function (x) { return x.id === S.replaceArt; })[0];
    if (old) {
      var s = Math.min(old.w / w, old.h / h); e.w = w * s; e.h = h * s; e.x = old.x + (old.w - e.w) / 2; e.y = old.y + (old.h - e.h) / 2; e.id = old.id;
      d.els[d.els.indexOf(old)] = e; S.replaceArt = null;
    } else { e.x = (S.cur < 0 ? 650 : 600) - w / 2; e.y = ay(S.cur < 0 ? 900 : 800) - h / 2; clampEl(e); d.els.push(e); }
    R.load(d, { photo: photoUrl }).then(function () { draw(); drawThumb(S.cur); });
    commit(); select(e.id); draw(); drawThumb(S.cur);
    if (innerWidth < 900) openPanel(null); else if (S.panel === 'stickers') openPanel('stickers', true);
  }
  function importSticker(file) {
    if (!file) return;
    var lim = { maxFileMB: 15, minPhotoPx: 1 };
    PH.importFile(file, { limits: lim, hashes: {}, projectId: S.p.id, uid: uid }).then(function (r) {
      r.meta.sticker = true;
      return ST.savePhoto(r.meta, r.blobs).then(function () {
        S.photos[r.meta.id] = r.meta; S.stickers.push(r.meta.id);
        urls[r.meta.id] = URL.createObjectURL(r.blobs.prev); thumbs[r.meta.id] = URL.createObjectURL(r.blobs.thumb);
        addImg({ photo: r.meta.id }, r.meta.w / r.meta.h);
        tip('Sticker added. Drag the corners to resize it.');
      });
    }).catch(function (e) { toast(e.message || 'That file could not be used.'); });
  }
  var SHAPES = [['rect', 'Rectangle'], ['round', 'Rounded'], ['circle', 'Circle'], ['line', 'Line'], ['frame', 'Border'], ['ring', 'Ring'], ['pageborder', 'Page border'], ['band', 'Colour band']];
  function shapeGrid() {
    return '<p class="pe-note">Simple shapes for a clean, designed look. Change the colour from the toolbar.</p><div class="pe-shapes">' + SHAPES.map(function (x) {
      var k = x[0], svg = k === 'circle' ? '<circle cx="24" cy="24" r="16"/>' : k === 'ring' ? '<circle cx="24" cy="24" r="15" fill="none" stroke-width="4"/>' : k === 'line' ? '<rect x="6" y="22" width="36" height="4" rx="1"/>' : k === 'frame' ? '<rect x="9" y="9" width="30" height="30" fill="none" stroke-width="4"/>' : k === 'pageborder' ? '<rect x="12" y="6" width="24" height="36" fill="none" stroke-width="2.5"/>' : k === 'band' ? '<rect x="6" y="30" width="36" height="10"/>' : k === 'round' ? '<rect x="8" y="12" width="32" height="24" rx="8"/>' : '<rect x="8" y="12" width="32" height="24"/>';
      return '<button data-act="shape:' + k + '"><svg viewBox="0 0 48 48" fill="currentColor" stroke="currentColor">' + svg + '</svg><span>' + x[1] + '</span></button>';
    }).join('') + '</div>';
  }
  function addShape(k) {
    var d = doc(), c = '#1b1714', e = { id: uid('shape'), t: 'shape', color: c };
    if (k === 'rect') Object.assign(e, { shape: 'rect', x: 400, y: ay(700), w: 400, h: 280, r: 0 });
    else if (k === 'round') Object.assign(e, { shape: 'rect', x: 400, y: ay(700), w: 400, h: 280, r: 40 });
    else if (k === 'circle') Object.assign(e, { shape: 'circle', x: 450, y: ay(700), w: 300, h: 300 });
    else if (k === 'ring') Object.assign(e, { shape: 'ring', x: 450, y: ay(700), w: 300, h: 300, lw: 12 });
    else if (k === 'line') Object.assign(e, { shape: 'rect', x: 300, y: ay(800), w: 600, h: 8, r: 0 });
    else if (k === 'frame') Object.assign(e, { shape: 'frame', x: 300, y: ay(560), w: 600, h: 600, lw: 14 });
    else if (k === 'pageborder') Object.assign(e, { shape: 'frame', x: 50, y: 50, w: W - 100, h: H - 100, lw: 8, color: '#b08d57' });
    else if (k === 'band') Object.assign(e, { shape: 'rect', x: 0, y: H - 260, w: W, h: 260, r: 0, color: '#f3ece0' });
    d.els.push(e); commit(); select(e.id); draw(); if (innerWidth < 900) openPanel(null);
  }
  var SWATCH = ['#1b1714', '#ffffff', '#ff5a1f', '#b08d57', '#f3ece0', '#c4512b', '#0f5c3a', '#1e4fae', '#e8a5b4', '#ffd36b', '#7a5a46', '#9aa5b1'];
  function colorBar(bar) {
    var e = selEl();
    bar.innerHTML = '<span class="pe-lockmsg">Colour</span>' + SWATCH.map(function (c) { return '<button class="pe-sw2' + (e && e.color === c ? ' is-on' : '') + '" data-c="' + c + '" style="--c:' + c + '" aria-label="' + c + '"></button>'; }).join('') + (e && (e.shape === 'frame' || e.shape === 'ring') ? '<button data-lw="-"><span>Thinner</span></button><button data-lw="+"><span>Thicker</span></button>' : '') + '<button data-c="x">' + I.x + '<span>Done</span></button>';
    bar.hidden = false; ctxPos();
    bar.onclick = function (ev) {
      var b = ev.target.closest('[data-c],[data-lw]'), x = selEl(); if (!b || !x) return;
      if (b.hasAttribute('data-lw')) { x.lw = Math.max(2, Math.min(60, (x.lw || 12) + (b.getAttribute('data-lw') === '+' ? 4 : -4))); commit(); draw(); return; }
      var c = b.getAttribute('data-c'); if (c === 'x') { S.colorOpen = false; ctxBar(); return; } x.color = c; commit(); draw(); colorBar(bar);
    };
  }
  function addArt(id) {
    if (S.replaceArt) { var a0 = A.all[id], b0 = a0.b.split(' ').map(Number); return replaceWith({ t: 'art', art: id }, b0[0] / b0[1]); }
    var a = A.all[id], b = a.b.split(' ').map(Number), s = 380 / Math.max(b[0], b[1]);
    var d = doc(), e = { id: uid('art'), t: 'art', art: id, w: b[0] * s, h: b[1] * s };
    e.x = (S.cur < 0 ? 650 : 600) - e.w / 2; e.y = ay(S.cur < 0 ? 900 : 800) - e.h / 2;
    clampEl(e); d.els.push(e); commit(); select(e.id); draw(); drawThumb(S.cur);
    if (innerWidth < 900) openPanel(null);
  }
  function addText(kind) {
    var d = doc(), dark = C.luminance(d.bg || '#ffffff') < 0.45, col = dark ? '#ffffff' : '#1d1d1f';
    var e = { id: uid('tx'), t: 'text', x: 140, w: 920, color: col };
    if (kind === 'h') Object.assign(e, { text: 'HEADING', font: 'spartan', cap: 110, align: 'center', y: ay(640) });
    else if (kind === 's') Object.assign(e, { text: 'A subheading', font: 'serif', size: 90, align: 'center', y: ay(700) });
    else if (kind === 'c') Object.assign(e, { text: 'A caption for this page', font: 'sans', size: 44, align: 'center', y: S.cur < 0 ? BRAND_TOP - 200 : H - 140, x: 140 });
    else Object.assign(e, { text: 'A little note', font: 'script', size: 96, align: 'center', y: ay(760) });
    if (S.cur >= 0 && kind === 'c') { e.x = 90; e.w = 1020; }
    clampEl(e); d.els.push(e); commit(); select(e.id); draw(); drawThumb(S.cur); openPanel('text');
  }

  /* ---------------- pages ---------------- */
  function go(i) {
    i = Math.max(-1, Math.min(S.p.pages.length, i));
    if (i === S.cur) return;
    var was = isWrap(), wasCov = isCoverIdx(), wasSp = isSpineV();
    if (S.cview === 'spine') S.cview = 'wrap';
    S.cur = i; S.sel = null; S.crop = false; S.target = null; S.p.lastPage = i; clearTimeout(S.lpT); S.lpT = setTimeout(function () { if (!S.ro) ST.saveProject(S.p).catch(function () { }); }, 1500);
    if (wasSp) { fit(); ctxBar(); drawStripSel(); return; }
    if (was !== isWrap() || wasCov !== isCoverIdx()) fit(); else draw();
    ctxBar(); drawStripSel();
    if (S.panel && S.panel !== 'photos' && S.panel !== 'stickers') openPanel(S.panel, false);
  }
  /** choose how many pages the book has (from the strip) */
  var pcdlg;
  function pageCount() {
    if (!pcdlg) { pcdlg = document.createElement('dialog'); pcdlg.className = 'pe-pc'; document.body.appendChild(pcdlg); pcdlg.addEventListener('click', function (e) { if (e.target === pcdlg) pcdlg.close(); }); }
    var n = S.p.pages.length, opts = [], mn = BOOK.pages.min, mx = BOOK.pages.max, st = BOOK.pages.step || 2;
    [24, 36, 48, 60, 80, 100].forEach(function (k) { if (k >= mn && k <= mx) opts.push(k); }); if (opts.indexOf(n) < 0) opts.push(n); opts.sort(function (a, b) { return a - b; });
    pcdlg.innerHTML = '<div class="pe-pc__in"><header><h3>Pages</h3><button class="pe-ib" data-x aria-label="Close">' + I.x + '</button></header>' +
      '<div class="pe-pc__step"><button class="pe-ib" data-d="-' + st + '" aria-label="Fewer pages"' + (n - st < mn ? ' disabled' : '') + '>−</button><b>' + n + '</b><button class="pe-ib" data-d="' + st + '" aria-label="More pages"' + (n + st > mx ? ' disabled' : '') + '>+</button></div>' +
      '<div class="pe-pc__opts">' + opts.map(function (k) { return '<button data-n="' + k + '"' + (k === n ? ' class="is-on"' : '') + '><b>' + k + '</b><small>' + esc(PBK.priceLabel(k)) + '</small></button>'; }).join('') + '</div>' +
      '<p class="pe-note">New pages are added at the end. Removing pages takes them off the end.</p></div>';
    pcdlg.querySelector('[data-x]').onclick = function () { pcdlg.close(); };
    pcdlg.querySelectorAll('[data-d]').forEach(function (b) { b.onclick = function () { setPages(n + +b.getAttribute('data-d')); }; });
    pcdlg.querySelectorAll('[data-n]').forEach(function (b) { b.onclick = function () { setPages(+b.getAttribute('data-n')); }; });
    if (!pcdlg.open) pcdlg.showModal();
  }
  function setPages(t) {
    var n = S.p.pages.length; t = Math.max(BOOK.pages.min, Math.min(BOOK.pages.max, t)); if (t % 2) t++;
    if (t === n) return pageCount();
    if (t < n) {
      var gone = S.p.pages.slice(t), used = gone.filter(function (d) { return (d.els || []).some(function (e) { return (e.t === 'photo' && e.photo) || e.t === 'text' || e.t === 'art' || e.t === 'img'; }); }).length;
      if (used && !confirm('The last ' + (n - t) + ' pages include ' + used + ' page' + (used === 1 ? '' : 's') + ' you’ve designed. Remove them?')) return;
      checkpoint('Before removing pages'); S.p.pages.length = t;
    } else { for (var i = n; i < t; i++) S.p.pages.push(pageDoc('one')); }
    if (S.cur >= S.p.pages.length && S.cur !== n) S.cur = S.p.pages.length - 1;
    if (S.cur === n) S.cur = S.p.pages.length; /* was on the back cover */
    commit(); drawStrip(); drawInfo(); fit(); mockSoon(); pageCount();
  }
  function addPages() {
    if (S.p.pages.length + 2 > BOOK.pages.max) { toast('A book can have up to ' + BOOK.pages.max + ' pages.'); return; }
    S.p.pages.splice(S.cur + 1, 0, pageDoc('one'), pageDoc('one')); commit(); drawStrip(); drawInfo(); go(S.cur + 1);
  }
  function delPage() {
    if (S.cur < 0) return;
    if (isBack()) { tip('The back cover stays. You can change everything on it.'); return; }
    if (S.p.pages.length - 1 < BOOK.pages.min) { toast('A book needs at least ' + BOOK.pages.min + ' pages. Add pages first, or leave this one blank.'); return; }
    if (!blankDoc(S.p.pages[S.cur]) && !confirm('Remove page ' + (S.cur + 1) + ' and everything on it? You can undo with ↶.')) return;
    S.p.pages.splice(S.cur, 1);
    if (S.p.pages.length % 2) S.p.pages.push(pageDoc('one'));
    commit(); var c = Math.min(S.cur, S.p.pages.length - 1); S.cur = -2; drawStrip(); drawInfo(); go(c);
    toast('Page removed. Books always have an even number of pages.');
  }
  function movePage(dir) {
    var i = S.cur, j = i + dir; if (i < 0 || isBack() || j < 0 || j >= S.p.pages.length) return;
    var t = S.p.pages[i]; S.p.pages[i] = S.p.pages[j]; S.p.pages[j] = t; commit(); S.cur = j; drawStrip(); draw(); drawStripSel();
  }
  function drawInfo() {
    var n = S.p.pages.length;
    $('#pePages').textContent = n + ' pages';
    if (S.lastN != null && S.lastN !== n && isWrap()) setTimeout(fit, 0); S.lastN = n;
    $('#pePrice').textContent = PBK.priceLabel(n);
    if (S.lastKind && S.lastKind !== R.bookKind(n)) mockSoon(); S.lastKind = R.bookKind(n);
  }
  function bindStrip() {
    el$.strip.addEventListener('click', function (ev) { var b = ev.target.closest('[data-pg]'); if (b) go(+b.getAttribute('data-pg')); var a = ev.target.closest('[data-addpg]'); if (a) { S.cur = S.p.pages.length - 1; addPages(); } });
    $('#pePgPrev').addEventListener('click', function () { go(S.cur - 1); });
    $('#pePgNext').addEventListener('click', function () { go(S.cur + 1); });
    $('#pePgCount').addEventListener('click', pageCount);
    $('#peGrid').addEventListener('click', gridView);
  }
  function drawStrip() {
    var h = '<button class="pe-pg pe-pg--cover" data-pg="-1"><canvas width="96" height="136"></canvas><span>Cover</span></button>';
    for (var i = 0; i < S.p.pages.length; i++) {
      if (i === 0 || i % 2 === 1) h += '<span class="pe-spread' + (i === 0 || i === S.p.pages.length - 1 ? ' is-single' : '') + '">';
      h += '<button class="pe-pg" data-pg="' + i + '"><canvas width="96" height="136"></canvas><span>' + (i + 1) + '</span></button>';
      if (i === 0 || i % 2 === 0 || i === S.p.pages.length - 1) h += '</span>';
    }
    h += '<button class="pe-pg pe-pg--add" data-addpg aria-label="Add pages">' + I.plus + '<span>Add</span></button>';
    h += '<button class="pe-pg pe-pg--cover" data-pg="' + S.p.pages.length + '"><canvas width="96" height="136"></canvas><span>Back</span></button>';
    el$.strip.innerHTML = h;
    drawStripSel();
    var all = [-1]; for (var j = 0; j <= S.p.pages.length; j++) all.push(j);
    var k = 0; (function step() { if (k >= all.length) return; drawThumb(all[k++]); setTimeout(step, 16); })();
  }
  function drawStripSel() {
    el$.strip.querySelectorAll('[data-pg]').forEach(function (b) { b.classList.toggle('is-on', +b.getAttribute('data-pg') === S.cur); });
    var on = el$.strip.querySelector('.is-on'); if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest', inline: 'center' });
    $('#pePgLbl').textContent = isWrap() ? (S.cur < 0 ? 'Cover · front' : 'Cover · back') : S.cur < 0 ? 'Cover' : isBack() ? 'Back cover' : 'Page ' + (S.cur + 1) + ' of ' + S.p.pages.length;
  }
  var thumbT = {};
  function drawThumb(i) {
    clearTimeout(thumbT[i]);
    thumbT[i] = setTimeout(function () {
      var b = el$.strip.querySelector('[data-pg="' + i + '"] canvas'); if (!b) return;
      var d = docAt(i); if (!d) return;
      R.load(d, { photo: photoUrl }).then(function () { var g = b.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, b.width, b.height); R.draw(g, d, { scale: b.width / W, scaleY: b.height / H, photo: photoUrl, empty: 'soft' }); });
    }, i === S.cur ? 120 : 0);
  }

  /* ---------------- preview (flip through) ---------------- */
  /** Delete the whole book (and its photos) from this device. */
  function deleteBook() {
    if (!confirm('Delete “' + (S.p.name || 'this book') + '” and its photos from this device? This can’t be undone.')) return;
    clearTimeout(saveT);
    var id = S.p.id; S.p = null;
    try { var lb = JSON.parse(localStorage.getItem('pbk_last') || 'null'); if (lb && lb.id === id) localStorage.removeItem('pbk_last'); } catch (e) { }
    try { (CIEL.cart.pbItems ? CIEL.cart.pbItems() : []).forEach(function (i) { if (i.pb.p === id) CIEL.cart.remove(i.id); }); } catch (e) { }
    ST.deleteProject(id).then(function () { PBK.go(BASE + '/my-books'); }, function () { PBK.go(BASE + '/my-books'); });
  }

  /* ---------------- preview: a real book you can flip ---------------- */
  function preview() {
    select(null); flush();
    var t = C.TPL[S.p.tpl], board = S.p.cover.img && t ? t.bg : S.p.cover.bg;
    var list = window.PBKShop ? PBKShop.docs(S.p) : [S.p.cover].concat(S.p.pages);
    var made = [];
    function jpg(doc, px) { return R.toCanvas(doc, px, { photo: photoUrl, empty: 'soft' }).then(function (c) { return new Promise(function (ok) { c.toBlob(function (b) { var u = URL.createObjectURL(b); made.push(u); ok(u); }, 'image/jpeg', 0.86); }); }); }
    var startAt = typeof arguments[0] === 'number' ? arguments[0] : 0;
    PBKFlip.open({
      title: S.p.name, count: S.p.pages.length, board: board || '#3b2f26', endpaper: '#f3ece0', start: startAt,
      onEdit: function (pg, at) { go(pg); backToPreview(at); },
      page: function (i) {
        var n = S.p.pages.length;
        if (i === 0) return jpg(list[0], 1100);
        if (i === n + 3) return jpg(list[list.length - 1], 700);
        if (i === 1 || i === n + 2) return null;
        return jpg(S.p.pages[i - 2], 900);
      },
      onClose: function () { made.forEach(function (u) { URL.revokeObjectURL(u); }); }
    });
  }

  function backToPreview(at) {
    var b = $('#peBackPrev'); if (b) b.remove();
    b = document.createElement('button'); b.id = 'peBackPrev'; b.className = 'pe-backprev'; b.innerHTML = I.eye + '<span>Back to preview</span>';
    b.onclick = function () { b.remove(); preview(at); }; el$.pe.appendChild(b);
  }
  /* ---------------- order ---------------- */
  var odlg;
  /** effective print resolution of a placed photo (pixels per inch at its printed size) */
  function dpiOf(e) { var m = S.photos[e.photo]; if (!m || !m.w) return 999; var z = (e.crop && e.crop.z) || 1, rw = e.rect ? e.rect.w : 1, rh = e.rect ? e.rect.h : 1, iw = m.w * rw, ih = m.h * rh, s = Math.max(e.w / iw, e.h / ih) * z, inch = (W / 210) * 25.4; return Math.round(inch / s); }
  function printChecks() {
    var out = { low: [], edge: [] }, SAFE = Math.round(W / 210 * 5);
    [S.p.cover].concat(S.p.pages).forEach(function (d, i) {
      var name = i === 0 ? 'the cover' : 'page ' + i;
      (d.els || []).forEach(function (e) {
        if (e.t === 'photo' && e.photo && dpiOf(e) < 150) out.low.push(name);
        if ((e.t === 'text' || (e.t === 'img' && !e.role)) && !e.role) { var b = bounds(e); if (b.x < SAFE || b.y < SAFE || b.x + b.w > W - SAFE || b.y + b.h > H - SAFE) out.edge.push(name); }
      });
    });
    function uniq2(a) { return a.filter(function (x, k) { return a.indexOf(x) === k; }); }
    out.low = uniq2(out.low); out.edge = uniq2(out.edge); return out;
  }
  function checks() {
    var empty = 0, emptyPages = 0, low = 0, used = usedMap();
    S.p.pages.forEach(function (d) { var fr = d.els.filter(function (e) { return e.t === 'photo'; }); var filled = fr.filter(function (e) { return e.photo; }).length; empty += fr.length - filled; if (!filled && !d.els.some(function (e) { return e.t !== 'photo'; })) emptyPages++; });
    Object.keys(used).forEach(function (id) { if (S.photos[id] && S.photos[id].low) low++; });
    return { empty: empty, emptyPages: emptyPages, low: low };
  }
  function order() {
    select(null);
    if (!S.blankAsked) { S.blankAsked = true; return blankCheck().then(order); }
    S.blankAsked = false; flush();
    if (!odlg) { odlg = document.createElement('dialog'); odlg.className = 'pe-or'; document.body.appendChild(odlg); odlg.addEventListener('click', function (e) { if (e.target === odlg) odlg.close(); }); }
    var n = S.p.pages.length, c = checks(), t = C.TPL[S.p.tpl], Sh = window.PBKShop, st = { product: 'print' };
    var pPrint = Sh.unit('print', n), pPdf = Sh.unit('digital', n);
    odlg.innerHTML = '<div class="pe-or__in"><header><h3>Order your book</h3><button class="pe-ib" data-x aria-label="Close">' + I.x + '</button></header>' +
      '<div class="pe-or__body"><canvas width="440" height="550" id="orCov"></canvas><div>' +
      '<p class="pe-or__name"><b>' + esc(S.p.name) + '</b><span>' + n + ' pages · A4 hardcover</span></p>' +
      (Sh.isTest(S.p) ? '<div class="pe-or__opts"><label class="pe-or__opt is-on"><input type="radio" name="prod" value="print" checked><span><b>Test order</b><small>A real M-Pesa payment that goes through the whole order flow. Only works while you’re signed in to Photo Book orders. Not printed; it stays in your orders until you delete it.</small></span><em>' + PBK.money(BOOK.testPrice || 5) + '</em></label></div>' :
      '<div class="pe-or__opts"><label class="pe-or__opt is-on"><input type="radio" name="prod" value="print" checked><span><b>Printed hardcover</b><small>Printed in Kenya and delivered or collected</small></span><em>' + PBK.money(pPrint) + '</em></label>' +
      (BOOK.pdf === false ? '' : '<label class="pe-or__opt"><input type="radio" name="prod" value="digital"><span><b>Print-ready PDF</b><small>Download the finished book after paying</small></span><em>' + PBK.money(pPdf) + '</em></label>') + '</div>') +
      (function () { var pc = printChecks(), lst = function (a) { return a.length > 4 ? a.slice(0, 4).join(', ') + ' and ' + (a.length - 4) + ' more' : a.join(', '); }; return (c.emptyPages || pc.low.length || pc.edge.length) ? '<div class="pe-or__warn"><b>Before you order</b><ul>' + (c.emptyPages ? '<li>' + c.emptyPages + ' page' + (c.emptyPages === 1 ? ' is' : 's are') + ' still empty — they print blank.</li>' : '') + (pc.low.length ? '<li>A photo on ' + lst(pc.low) + ' is enlarged a lot and may look soft in print. Use a bigger photo or make it smaller on the page.</li>' : '') + (pc.edge.length ? '<li>Words or a sticker on ' + lst(pc.edge) + ' are very close to the edge and could be trimmed off. Move them a little inwards.</li>' : '') + '</ul></div>' : ''; })() +
      '<div class="pe-or__exact">' + I.eye + '<span><b>Printed exactly as you designed it.</b> ' + (n < 37 ? 'Every page and the cover come out just as you see them in the preview. A ' + n + '-page book is too thin for a printed spine, so the spine stays plain. Books with more than 36 pages get the spine you designed.' : 'Every page, the cover and the spine come out just as you see them in the preview.') + '</span></div>' +
      '<div class="pe-or__back"><button class="btn btn--ghost btn--sm" data-prev>' + I.eye + ' Preview my book</button><button class="btn btn--ghost btn--sm" data-x>' + I.left + ' Keep editing</button></div>' +
      '<div class="pe-or__acts"><button class="btn btn--p" data-buy>Checkout</button><button class="btn btn--ghost" data-cart>Add to cart</button></div>' +
      '<button type="button" class="pe-or__wa" data-wa>Or order on WhatsApp</button><div id="orPaid"></div></div></div></div>';
    odlg.querySelectorAll('[name=prod]').forEach(function (r) { r.onchange = function () { st.product = r.value; odlg.querySelectorAll('.pe-or__opt').forEach(function (l) { l.classList.toggle('is-on', l.contains(r)); }); }; });
    odlg.onclick = function (e) {
      if (e.target.closest('[data-x]')) odlg.close();
      if (e.target.closest('[data-prev]')) { odlg.close(); preview(); return; }
      if (e.target.closest('[data-cart]')) Sh.add(S.p, st.product).then(function () { odlg.close(); });
      if (e.target.closest('[data-buy]')) Sh.add(S.p, st.product, { silent: true }).then(function () { odlg.close(); PBK.go(BASE + '/checkout'); });
      /* WhatsApp orders go through checkout too: we need their name and number, and the order shows in Ciel Admin */
      if (e.target.closest('[data-wa]')) Sh.add(S.p, st.product, { silent: true }).then(function () { odlg.close(); PBK.go(BASE + '/checkout?wa=1'); });
    };
    Sh.purchases(S.p.id).then(function (l) {
      var pdfs = l.filter(function (x) { return x.product === 'digital'; }), prints = l.filter(function (x) { return x.product === 'print'; });
      var box = $('#orPaid', odlg); if (!box || (!pdfs.length && !prints.length)) return;
      box.innerHTML = '<div class="pe-or__paid"><b>Already paid</b>' + (pdfs.length ? '<p>Print-ready PDF (' + esc(pdfs[0].ref) + ')' + (pdfs[0].pages !== n ? ' — paid for ' + pdfs[0].pages + ' pages' : '') + '</p><button class="btn btn--dark btn--sm" data-dl>Download PDF</button>' : '') +
        (prints.length ? '<p>Printed book, order ' + esc(prints[0].ref) + (prints[0].done ? ': pages sent to Ciel Africa.' : ': pages not sent yet.') + '</p>' + (prints[0].done ? '' : '<a class="btn btn--dark btn--sm" data-go href="' + BASE + '/checkout?sent=' + encodeURIComponent(prints[0].ref) + '">Send pages</a>') : '') + '<span class="pe-prog" id="orProg"></span></div>';
      var dl = box.querySelector('[data-dl]');
      if (dl) dl.onclick = function () { dl.disabled = true; Sh.pdf(S.p, pdfs[0].receipt, function (i, k) { $('#orProg', odlg).textContent = 'Preparing ' + (i + 1) + ' of ' + k + '…'; }).then(function () { $('#orProg', odlg).textContent = 'Downloaded.'; dl.disabled = false; }, function (e) { $('#orProg', odlg).textContent = e.message; dl.disabled = false; }); };
    });
    book3d(S.p.cover, 900).then(function (m) { var cv = $('#orCov', odlg); cv.width = m.width; cv.height = m.height; cv.getContext('2d').drawImage(m, 0, 0); });
    odlg.showModal();
  }

  window.PBKEditor = { open: open, LAYOUTS: LAYOUTS };
})();
