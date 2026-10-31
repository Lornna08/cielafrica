/* ============================================================
   CIEL PHOTO BOOKS — studio core: state, routing, My books,
   new-book flow (story + suggestions + look + format) and photos.
   Editor/preview: editor.js · Ordering: checkout.js
   ============================================================ */
(function () {
  'use strict';
  var E = PBE, SV = PBS, ST = PBStore, CFG = (window.CIEL && CIEL.photobooks) || {};
  var app = document.getElementById('app');
  var A = window.PBApp = { E: E, SV: SV, ST: ST, CFG: CFG, S: { project: null, photos: {}, urls: {}, undo: [], redo: [] }, views: {} };
  var S = A.S;

  /* ---------- utilities ---------- */
  var esc = A.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  A.uid = function (p) { var a = new Uint8Array(9); crypto.getRandomValues(a); return (p || 'id') + '_' + Array.prototype.map.call(a, function (x) { return (x % 36).toString(36); }).join(''); };
  A.fmtMoney = function (n) { return (CFG.currency || 'KES') + ' ' + Number(n).toLocaleString('en-KE'); };
  A.when = function (t) { var d = new Date(t); return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ', ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); };
  A.track = function (name, props) { try { if (window.va) window.va('event', { name: 'pb_' + name, data: props || {} }); } catch (e) { /* analytics is optional */ } };
  var toastT;
  A.toast = function (msg, kind) { var t = document.getElementById('toast'); t.textContent = msg; t.className = 'st-toast on' + (kind ? ' st-toast--' + kind : ''); clearTimeout(toastT); toastT = setTimeout(function () { t.className = 'st-toast'; }, 4200); };
  A.icon = function (n) {
    var P = { plus: 'M12 5v14M5 12h14', undo: 'M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3', redo: 'm15 14 5-5-5-5M20 9H10a6 6 0 0 0 0 12h3', x: 'M18 6 6 18M6 6l12 12', up: 'm18 15-6-6-6 6', left: 'm15 18-6-6 6-6', right: 'm9 18 6-6-6-6', trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6', grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z', image: 'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6', type: 'M4 7V4h16v3M9 20h6M12 4v16', palette: 'M12 3a9 9 0 1 0 0 18c1 0 1.5-.8 1.5-1.6 0-.9-.6-1.3-.6-2.1 0-1 .8-1.6 1.8-1.6H17a4 4 0 0 0 4-4c0-4.6-4-8.7-9-8.7z', book: 'M4 4h10a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4zM18 20h2V6', check: 'M20 6 9 17l-5-5', lock: 'M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4', refresh: 'M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5', eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z', edit: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4', move: 'M12 3v18M3 12h18M8 7l4-4 4 4M8 17l4 4 4-4', zoomin: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-5-5M11 8v6M8 11h6', zoomout: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-5-5M8 11h6', copy: 'M8 8h12v12H8zM4 16V4h12', download: 'M12 3v12M7 10l5 5 5-5M4 21h16', alert: 'M12 3 2 21h20zM12 10v5M12 18h.01', upload: 'M12 21V9M7 14l5-5 5 5M4 3h16', sparkle: 'M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z' };
    return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="' + (P[n] || '') + '"/></svg>';
  };
  /** small modal: fields [{name,label,value,type}] → Promise<values|null> */
  A.modal = function (title, html, buttons) {
    var m = document.getElementById('modal'), b = document.getElementById('modalBody'), prev = document.activeElement;
    b.innerHTML = '<h2 id="modalT">' + esc(title) + '</h2>' + html + '<div class="st-modal__acts">' + buttons.map(function (x, i) { return '<button type="button" class="btn ' + (x.primary ? 'btn--p' : x.danger ? 'btn--danger' : 'btn--ghost') + '" data-mi="' + i + '">' + esc(x.label) + '</button>'; }).join('') + '</div>';
    m.hidden = false;
    var f = b.querySelector('input,textarea,select,button.btn--p,button'); if (f) setTimeout(function () { f.focus(); if (f.select) try { f.select(); } catch (e) { /* */ } }, 30);
    return new Promise(function (res) {
      function close(v) { m.hidden = true; b.innerHTML = ''; document.removeEventListener('keydown', key, true); if (prev && prev.focus) prev.focus(); res(v); }
      function key(e) { if (e.key === 'Escape') { e.preventDefault(); close(null); } }
      document.addEventListener('keydown', key, true);
      b.onclick = function (e) { var t = e.target.closest('[data-mi]'); if (!t) return; var x = buttons[+t.getAttribute('data-mi')], vals = {}; b.querySelectorAll('[name]').forEach(function (el) { vals[el.name] = el.type === 'checkbox' ? el.checked : el.value; }); close(x.value === undefined ? vals : (x.value ? vals : null)); };
      b.onsubmit = function (e) { e.preventDefault(); };
      m.onclick = function (e) { if (e.target === m) close(null); };
    });
  };
  A.confirm = function (title, msg, label, danger) { return A.modal(title, '<p>' + msg + '</p>', [{ label: 'Cancel', value: false }, { label: label || 'OK', value: true, primary: !danger, danger: danger }]).then(function (v) { return !!v; }); };

  /* ---------- photo URLs (object URLs from device storage) ---------- */
  A.url = function (id, kind) {
    var k = id + ':' + (kind || 'prev');
    if (window.PBSamples && PBSamples.isSample(id)) { if (!S.urls[k]) S.urls[k] = { u: PBSamples.url(PBSamples.get(id), kind === 'thumb' ? 480 : 1400), p: null, ext: true }; S.urls[k].p = Promise.resolve(S.urls[k].u); return S.urls[k].u; }
    if (S.urls[k]) return S.urls[k].u;
    S.urls[k] = { u: '', p: ST.blob(id, kind || 'prev').then(function (b) { if (b) { S.urls[k].u = URL.createObjectURL(b); } return S.urls[k].u; }) };
    return '';
  };
  A.loadUrls = function (ids, kind) { return Promise.all(ids.map(function (id) { A.url(id, kind); return S.urls[id + ':' + (kind || 'prev')].p; })); };
  function dropUrls() { Object.keys(S.urls).forEach(function (k) { if (S.urls[k].u && !S.urls[k].ext) URL.revokeObjectURL(S.urls[k].u); }); S.urls = {}; }

  /* ---------- project load / save ---------- */
  var saveT, saving = false, again = false;
  A.setSave = function (txt, cls) { var el = document.getElementById('saveState'); el.textContent = txt; el.className = 'st-save' + (cls ? ' st-save--' + cls : ''); };
  A.save = function (now) {
    clearTimeout(saveT); A.setSave('Saving…', 'busy');
    var run = function () {
      if (saving) { again = true; return; }
      saving = true; var p = S.project;
      ST.saveProject(p).then(function () { A.setSave('Saved ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), 'ok'); })
        .catch(function (e) { A.setSave('Not saved', 'err'); A.toast(e.message || 'Could not save', 'err'); })
        .then(function () { saving = false; if (again) { again = false; run(); } });
    };
    if (now) run(); else saveT = setTimeout(run, 600);
  };
  window.addEventListener('beforeunload', function (e) { if (saving || saveT && document.getElementById('saveState').classList.contains('st-save--busy')) { e.preventDefault(); e.returnValue = ''; } });
  /** record an undoable change: call before mutating */
  A.snapshot = function () { S.undo.push(JSON.stringify(S.project)); if (S.undo.length > 80) S.undo.shift(); S.redo = []; };
  A.commit = function () { A.save(); if (A.onChange) A.onChange(); };
  // restore in place so views holding a reference to the project stay in sync
  function restore(json) { var o = JSON.parse(json), p = S.project; Object.keys(p).forEach(function (k) { delete p[k]; }); Object.assign(p, o); }
  A.undo = function () { if (!S.undo.length) return; S.redo.push(JSON.stringify(S.project)); restore(S.undo.pop()); A.commit(); };
  A.redo = function () { if (!S.redo.length) return; S.undo.push(JSON.stringify(S.project)); restore(S.redo.pop()); A.commit(); };

  A.open = function (id) {
    if (S.project && S.project.id === id) return Promise.resolve(S.project);
    dropUrls(); S.undo = []; S.redo = [];
    return ST.project(id).then(function (p) {
      if (!p) throw new Error('This photo book isn’t saved in this browser.');
      S.project = p;
      return ST.photos(id).then(function (list) {
        S.photos = {}; list.forEach(function (m) { S.photos[m.id] = m; });
        A.addSamples(p);
        var known = {}; (p.photoOrder || []).forEach(function (x) { if (S.photos[x]) known[x] = 1; });
        p.photoOrder = (p.photoOrder || []).filter(function (x) { return S.photos[x]; }).concat(list.filter(function (m) { return !known[m.id]; }).sort(function (a, b) { return a.added - b.added; }).map(function (m) { return m.id; }));
        return p;
      });
    });
  };
  /** sample photos referenced by a project (they live outside device storage) */
  A.addSamples = function (p, photos) {
    photos = photos || S.photos; if (!window.PBSamples) return;
    function add(id) { if (id && PBSamples.isSample(id)) photos[id] = PBSamples.get(id); }
    (p.sampleIds || []).forEach(add);
    (p.pages || []).forEach(function (pg) { (pg.slots || []).forEach(function (s) { add(s && s.photo); }); });
    if (p.cover) { add(p.cover.photo && p.cover.photo.photo); add(p.cover.back && p.cover.back.photo && p.cover.back.photo.photo); }
  };
  /** frames that still show a sample photo, in reading order (cover first) */
  A.sampleSlots = function () {
    var p = S.project, out = [];
    function chk(o, where, i) { if (o && o.photo && PBSamples.isSample(o.photo)) out.push({ o: o, where: where, i: i }); }
    if (p.cover) { chk(p.cover.photo, 'front', 0); if (p.cover.back) chk(p.cover.back.photo, 'back', 0); }
    (p.pages || []).forEach(function (pg, pi) { (pg.slots || []).forEach(function (sl, i) { chk(sl, 'page:' + pi, i); }); });
    return out;
  };
  /** put the customer's photos into sample frames, in order. Returns how many were placed. */
  A.fillSamples = function (ids) {
    var slots = A.sampleSlots(), n = 0;
    ids.forEach(function (id) { var s = slots[n]; if (!s) return; var m = S.photos[id]; s.o.photo = id; s.o.zoom = 1; s.o.fx = 0.5; s.o.fy = m && m.h > m.w * 1.12 ? 0.42 : 0.5; n++; });
    return n;
  };
  A.unusedPhotos = function () { var u = A.usage(); return A.orderedPhotos().filter(function (m) { return !u[m.id]; }); };
  /** a finished-looking book for a design, filled with sample photos (not saved) */
  A.sampleProject = function (tid, fmtId) {
    var r = PBSamples.book(E, CFG, tid, fmtId);
    r.p.id = A.uid('pb'); r.p.createdAt = Date.now(); r.p.name = A.tplMeta(tid).name + ' book';
    return r;
  };
  /** start a book from a design and save it on this device */
  A.createBook = function (tid, fmtId) {
    var p = A.sampleProject(tid, fmtId).p;
    p.seed = Math.floor(Math.random() * 1e6) + 1;
    return ST.saveProject(p).then(function () { ST.persist(); A.track('project_created', { format: p.formatId, template: tid, from: 'design' }); return p; });
  };
  /** add photo files from this device. onProg(done,total,fails). Resolves with the new photo ids in order. */
  A.importFiles = function (files, onProg) {
    var p = S.project, lim = CFG.limits || {}, ids = [], fails = [], done = 0;
    files = Array.prototype.slice.call(files || []);
    var room = (lim.maxPhotosPerProject || 300) - p.photoOrder.length;
    if (files.length > room) { fails.push((files.length - Math.max(0, room)) + ' photo(s) over the limit of ' + (lim.maxPhotosPerProject || 300) + ' were not added.'); files = files.slice(0, Math.max(0, room)); }
    var hashes = {}; Object.keys(S.photos).forEach(function (id) { if (!S.photos[id].sample) hashes[S.photos[id].hash] = 1; });
    var total = files.length, q = files.map(function (f, i) { return { f: f, i: i }; }), slots = new Array(total);
    if (onProg) onProg(0, total, fails);
    return new Promise(function (res) {
      if (!total) return res({ ids: [], fails: fails });
      var busy = 0;
      function pump() {
        while (busy < 2 && q.length) {
          var it = q.shift(); busy++;
          (function (it) {
            PBPhotos.importFile(it.f, { projectId: p.id, uid: A.uid, hashes: hashes, limits: lim }).then(function (r) {
              hashes[r.meta.hash] = 1;
              return ST.savePhoto(r.meta, r.blobs).then(function () { S.photos[r.meta.id] = r.meta; slots[it.i] = r.meta.id; });
            }).catch(function (e) { fails.push((it.f.name ? it.f.name + ': ' : '') + (e.message || 'could not be added')); }).then(function () {
              busy--; done++; if (onProg) onProg(done, total, fails);
              if (!busy && !q.length) { ids = slots.filter(Boolean); p.photoOrder = p.photoOrder.concat(ids); A.track('upload_complete', { count: ids.length }); res({ ids: ids, fails: fails }); } else pump();
            });
          })(it);
        }
      }
      pump();
    });
  };
  A.orderedPhotos = function () { return S.project.photoOrder.map(function (id) { return S.photos[id]; }).filter(Boolean); };
  A.usage = function () {
    var u = {}, p = S.project;
    function add(s) { if (s && s.photo) u[s.photo] = (u[s.photo] || 0) + 1; }
    (p.pages || []).forEach(function (pg) { (pg.slots || []).forEach(add); });
    if (p.cover) { add(p.cover.photo); if (p.cover.back) add(p.cover.back.photo); }
    return u;
  };
  A.fmt = function () { return E.format(CFG, S.project.formatId); };
  A.tplMeta = function (id) { return (CFG.templates || []).filter(function (t) { return t.id === id; })[0] || { id: id, name: id }; };
  A.visibleTemplates = function () { return (CFG.templates || []).filter(function (t) { return t.visible !== false && E.THEMES[t.id]; }); };

  /** sample cover for template cards (uses illustration or placeholder blocks, never customer photos) */
  A.templateCover = function (tid, title, formatId) {
    var t = A.tplMeta(tid), th = E.theme(tid);
    var pr = { formatId: formatId || 'sq21', templateId: tid, title: title != null ? title : (t.sample || t.name), subtitle: '', pages: [], cover: {} };
    if (!title && t.collection === 'destinations') pr.title = { 'zanzibar-blue': 'Zanzibar', 'zanzibar-night': 'Zanzibar', 'paris-rose': 'Paris', 'cape-coral': 'Cape Town', 'amsterdam-canal': 'Amsterdam', 'diani-shore': 'Diani', 'savanna-gold': 'Savanna', 'lamu-dhow': 'Lamu' }[tid] || t.name;
    if (window.PBSamples && PBSamples.coverStyle(tid) && title == null) pr.cover.style = PBSamples.coverStyle(tid);
    var ph = {}, need = E.COVER_STYLES.filter(function (s) { return s.id === (pr.cover.style || th.cover.style); })[0].photo;
    if (need && window.PBSamples) { var m = PBSamples.forTemplate(tid, 1)[0]; ph[m.id] = m; pr.cover.photo = { photo: m.id, fy: 0.42 }; }
    if (!title && window.PBSamples) pr.title = PBSamples.title(tid);
    return SV.svg(E.renderFront(CFG, pr, ph), { url: function (id) { return PBSamples.url(PBSamples.get(id), 600); }, empty: 'sample', sampleFill: th.soft === '#FFFFFF' ? '#E8E6E0' : shade(th.bg), label: t.name + ' cover' });
  };
  function shade(hex) { var n = parseInt(String(hex).slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255, l = (r * 299 + g * 587 + b * 114) / 1000; var k = l > 140 ? -38 : 40; function c(v) { return Math.max(0, Math.min(255, v + k)); } return 'rgb(' + c(r) + ',' + c(g) + ',' + c(b) + ')'; }
  A.shade = shade;

  /* ---------- steps header ---------- */
  A.steps = function (active) {
    var nav = document.getElementById('steps'), p = S.project;
    if (!p || !active) { nav.hidden = true; return; }
    var L = [['design', 'Design'], ['preview', 'Preview'], ['order', 'Order']];
    nav.hidden = false;
    nav.innerHTML = '<span class="st-steps__name" title="' + esc(p.name) + '">' + esc(p.name || 'Photo book') + '</span>' + L.map(function (x, i) { return '<a href="#/p/' + p.id + '/' + x[0] + '"' + (x[0] === active ? ' aria-current="step"' : '') + '><i>' + (i + 1) + '</i>' + x[1] + '</a>'; }).join('');
  };

  /* ---------- router ---------- */
  function route() {
    var h = location.hash.replace(/^#/, '') || '/', q = {}, qi = h.indexOf('?');
    if (qi >= 0) { h.slice(qi + 1).split('&').forEach(function (kv) { var p = kv.split('='); q[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || ''); }); h = h.slice(0, qi); }
    var m = h.match(/^\/p\/([\w-]+)\/(photos|design|preview|order)$/);
    if (A.leave) { try { A.leave(); } catch (e) { /* */ } A.leave = null; }
    A.onChange = null; document.body.classList.remove('st--editor');
    window.scrollTo(0, 0);
    if (m) {
      app.innerHTML = '<div class="st-loading">Opening your book…</div>';
      return A.open(m[1]).then(function () { A.steps(m[2]); A.setSave(S.project.updatedAt ? 'Saved' : '', 'ok'); return A.views[m[2]](q); }).catch(function (e) { A.steps(null); app.innerHTML = '<section class="st-wrap st-empty"><h1>Book not found</h1><p>' + esc(e.message) + '</p><p class="muted">Books are saved in the browser where they were made. If you designed it on another device or browser, open it there.</p><a class="btn btn--p" href="#/">My books</a></section>'; });
    }
    A.steps(null); A.setSave('');
    if (h === '/new') return chooser(q);
    if (h === '/new/story') return newView(q);
    return home();
  }
  window.addEventListener('hashchange', route);

  /* ---------- My books ---------- */
  function home() {
    S.project = null;
    Promise.all([ST.projects(), ST.purchases()]).then(function (r) {
      var list = r[0], buys = r[1];
      app.innerHTML = '<section class="st-wrap st-home">' +
        '<div class="st-head"><div><p class="eyebrow">Photo Book Studio</p><h1>Your photo books</h1><p class="lead">Saved privately in this browser on this device. Your photos are not uploaded while you design.</p></div><a class="btn btn--p btn--lg" href="#/new">' + A.icon('plus') + 'New photo book</a></div>' +
        (list.length ? '<div class="st-books">' + list.map(function (p) {
          return '<article class="st-book" data-id="' + p.id + '"><a class="st-book__cov" href="#/p/' + p.id + '/design" aria-label="Open ' + esc(p.name) + '"><div class="st-book__svg" data-cover="' + p.id + '"></div></a><div class="st-book__b"><h3>' + esc(p.name || 'Untitled photo book') + '</h3><p>' + esc(E.format(CFG, p.formatId).name) + ' · ' + (p.pages ? p.pages.length : 0) + ' pages · edited ' + A.when(p.updatedAt || p.createdAt) + '</p>' +
            '<div class="st-book__acts"><a class="btn btn--sm btn--p" href="#/p/' + p.id + '/design">Open</a><button class="btn btn--sm btn--ghost" data-act="rename">Rename</button><button class="btn btn--sm btn--ghost" data-act="dup">Duplicate</button><button class="btn btn--sm btn--ghost btn--warn" data-act="del">Delete</button></div></div></article>';
        }).join('') + '</div>' : '<div class="st-emptybox"><h2>No photo books yet</h2><p>Pick a design and you\u2019ll get a finished-looking book straight away. Then add your photos \u2014 they replace the samples.</p><a class="btn btn--p" href="#/new">Choose a design</a></div>') +
        (buys.length ? '<h2 class="st-h2">Purchases on this device</h2><div class="st-buys">' + buys.sort(function (a, b) { return b.createdAt - a.createdAt; }).map(function (b) { return '<div class="st-buy"><b>' + esc(b.ref || '') + '</b><span>' + (b.product === 'print' ? 'Printed book' : 'Digital PDF') + ' · ' + esc(b.name || '') + ' · ' + A.when(b.createdAt) + ' · ' + (b.status === 'paid' ? 'Paid' : esc(b.status || '')) + '</span><a class="btn btn--sm" href="#/p/' + b.projectId + '/order">View</a></div>'; }).join('') + '</div>' : '') +
        '<aside class="st-note"><h3>Where your photos are kept</h3><p>Projects and photographs are stored in this browser’s private storage on this device. Ciel Africa can’t see them. A printed order sends only the final print files, after payment. Deleting a book here removes its photos from this device. Clearing your browser data also deletes them, so keep your originals.</p></aside></section>';
      list.forEach(function (p) {
        var el = app.querySelector('[data-cover="' + p.id + '"]'); if (!el) return;
        var ph = {}; var cid = p.cover && p.cover.photo && p.cover.photo.photo;
        A.addSamples(p, ph); if (cid && PBSamples.isSample(cid)) cid = null;
        var draw = function () { el.innerHTML = SV.svg(E.renderFront(CFG, p, ph), { url: function (id) { return A.url(id, 'thumb'); }, empty: 'sample' }); };
        if (cid) ST.photos(p.id).then(function (l) { l.forEach(function (m) { ph[m.id] = m; }); A.addSamples(p, ph); return ST.blob(cid, 'thumb'); }).then(function (b) { if (b) S.urls[cid + ':thumb'] = { u: URL.createObjectURL(b), p: Promise.resolve() }; draw(); }); else draw();
      });
      app.onclick = function (e) {
        var b = e.target.closest('[data-act]'); if (!b) return;
        var card = b.closest('[data-id]'), id = card.getAttribute('data-id'), p = list.filter(function (x) { return x.id === id; })[0];
        var act = b.getAttribute('data-act');
        if (act === 'rename') A.modal('Rename book', '<label class="fld"><span>Name</span><input name="name" maxlength="80" value="' + esc(p.name || '') + '"></label>', [{ label: 'Cancel', value: false }, { label: 'Save', primary: true }]).then(function (v) { if (!v) return; p.name = v.name.trim() || p.name; ST.saveProject(p).then(home); });
        if (act === 'dup') ST.duplicateProject(p, A.uid('pb'), A.uid).then(function () { A.toast('Duplicated'); home(); });
        if (act === 'del') A.confirm('Delete “' + (p.name || 'this book') + '”?', 'This removes the book and its photos from this device. It can’t be undone. Purchase records stay.', 'Delete book', true).then(function (ok) { if (ok) ST.deleteProject(p.id).then(function () { A.toast('Deleted'); home(); }); });
      };
    }).catch(function (e) { app.innerHTML = '<section class="st-wrap st-empty"><h1>Storage unavailable</h1><p>' + esc(e.message) + '</p></section>'; });
  }

  /* ---------- New book: choose a design (opens filled with sample photos) ---------- */
  function chooser(q) {
    var fmts = (CFG.formats || []).filter(function (f) { return f.enabled !== false; });
    var st = { fmt: (q.f && fmts.some(function (f) { return f.id === q.f; })) ? q.f : fmts[0].id, cat: 'all' };
    if (q.t && E.THEMES[q.t] && q.go) { app.innerHTML = '<div class="st-loading">Preparing your book…</div>'; return start(q.t); }
    var cats = (CFG.categories || []).filter(function (c) { return A.visibleTemplates().some(function (t) { return t.category === c.id; }); });
    app.innerHTML = '<section class="st-wrap ch">' +
      '<div class="ch-head"><div><p class="eyebrow">New photo book</p><h1>Choose a design</h1><p class="lead">Every design opens as a finished book filled with sample photos. Add your own photos and they drop straight into place — then change anything you like.</p></div>' +
      '<ol class="ch-how" aria-label="How it works"><li><i>1</i>Pick a design</li><li><i>2</i>Add your photos</li><li><i>3</i>Preview &amp; order</li></ol></div>' +
      '<div class="ch-bar"><div class="gfilters" id="cats"><button type="button" class="gfilter on" data-cat="all">All designs</button><button type="button" class="gfilter" data-cat="destinations">Destinations</button>' + cats.map(function (c) { return '<button type="button" class="gfilter" data-cat="' + c.id + '">' + esc(c.name) + '</button>'; }).join('') + '</div>' +
      '<label class="ch-size">Size <select id="fmtSel">' + fmts.map(function (f) { return '<option value="' + f.id + '"' + (f.id === st.fmt ? ' selected' : '') + '>' + esc(f.name + ' · ' + f.size) + '</option>'; }).join('') + '</select></label></div>' +
      '<div class="ch-grid" id="chGrid"></div>' +
      '<div class="ch-alt"><div><h2>Prefer to start from your own photos?</h2><p>Describe your book, get title ideas, add your photos and let the layout assistant arrange them.</p></div><a class="btn btn--ghost" href="#/new/story">Start from my photos</a></div>' +
      '<p class="ch-credit">Sample photos from <a href="https://unsplash.com/?utm_source=ciel_africa&utm_medium=referral" target="_blank" rel="noopener">Unsplash</a>, shown only to illustrate the designs. They can’t be printed — you replace every one with your own.</p></section>';
    var grid = document.getElementById('chGrid');
    function draw() {
      var pc = function (id) { var x = PBSamples.coverStyle(id) || E.theme(id).cover.style; return E.COVER_STYLES.filter(function (c) { return c.id === x; })[0].photo ? 0 : 1; };
      var list = A.visibleTemplates().filter(function (t) { return st.cat === 'all' || t.category === st.cat || t.collection === st.cat; });
      list = list.filter(function (t) { return !pc(t.id); }).concat(list.filter(function (t) { return pc(t.id); }));
      grid.innerHTML = list.map(function (t) {
        var ph = PBSamples.forTemplate(t.id, 4, true);
        return '<article class="ch-card"><button type="button" class="ch-card__cov" data-peek="' + t.id + '" aria-label="Look inside ' + esc(t.name) + '"><span class="ch-book">' + A.templateCover(t.id, null, st.fmt) + '</span><span class="ch-peek">' + A.icon('eye') + 'Look inside</span></button>' +
          '<div class="ch-card__strip" aria-hidden="true">' + ph.map(function (m) { return '<img loading="lazy" alt="" src="' + esc(PBSamples.url(m, 240)) + '">'; }).join('') + '</div>' +
          '<div class="ch-card__b"><h3>' + esc(t.name) + '</h3><p>' + esc(t.desc || '') + '</p><button type="button" class="btn btn--p btn--block" data-use="' + t.id + '">Use this design</button></div></article>';
      }).join('');
    }
    function peek(tid) {
      var sp = A.sampleProject(tid, st.fmt), p = sp.p, ph = sp.photos, t = A.tplMeta(tid);
      var u = function (id) { return PBSamples.url(PBSamples.get(id), 700); };
      var pg = function (i) { return '<div class="pk-pg">' + SV.svg(E.renderPage(CFG, p, i, ph), { url: u, empty: 'sample' }) + '</div>'; };
      var html = '<div class="pk"><div class="pk-cov">' + SV.svg(E.renderFront(CFG, p, ph), { url: u, empty: 'sample' }) + '</div>' +
        '<div class="pk-sp">' + pg(1) + pg(2) + '</div><div class="pk-sp">' + pg(3) + pg(4) + '</div><div class="pk-sp">' + pg(5) + pg(6) + '</div></div>' +
        '<p class="pn-hint">' + esc(t.desc || '') + ' These are sample photos — yours replace them.</p>';
      A.modal(t.name, html, [{ label: 'Back', value: false }, { label: 'Use this design', value: true, primary: true }]).then(function (ok) { if (ok) start(tid); });
      var bx = document.querySelector('.st-modal__box'); bx.classList.add('st-modal__box--wide'); setTimeout(function () { bx.scrollTop = 0; }, 60);
    }
    function start(tid) {
      A.createBook(tid, st.fmt).then(function (p) { location.replace('#/p/' + p.id + '/design'); }).catch(function (er) { A.toast(er.message || 'Could not create the book', 'err'); });
    }
    app.querySelector('.ch').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.dataset.cat) { st.cat = b.dataset.cat; app.querySelectorAll('[data-cat]').forEach(function (x) { x.classList.toggle('on', x === b); }); draw(); }
      else if (b.dataset.use) { b.disabled = true; b.textContent = 'Preparing your book…'; start(b.dataset.use); }
      else if (b.dataset.peek) peek(b.dataset.peek);
    });
    document.getElementById('fmtSel').addEventListener('change', function () { st.fmt = this.value; draw(); });
    draw();
    A.track('create_start', { flow: 'design' });
  }

  /* ---------- New book: story, suggestions, look, format ---------- */
  var EXAMPLES = ['A collection of my favourite memories.', 'Our relationship and the places we’ve visited.', 'My childhood and growing-up years.', 'Our wedding day and celebrations.', 'My baby’s first year.', 'A family holiday.', 'My graduation journey.', 'My life at twenty-five.', 'A birthday celebration.', 'A photography portfolio.', 'A collection of our best moments together.'];
  function newView(q) {
    var st = { tpl: q.t && E.THEMES[q.t] ? q.t : null, fmt: (CFG.formats || []).filter(function (f) { return f.enabled !== false; })[0].id, seed: 1, sug: null, cat: 'all', caps: null };
    var cats = (CFG.categories || []).filter(function (c) { return A.visibleTemplates().some(function (t) { return t.category === c.id; }); });
    app.innerHTML = '<form class="st-wrap st-new" id="newF" novalidate>' +
      '<div class="st-head"><div><p class="eyebrow">New photo book · <a href="#/new">or choose a ready-made design</a></p><h1>Tell us the story behind your book.</h1><p class="lead">What memories would you like to keep? Write as much or as little as you like — it’s only used to suggest ideas, and you can change everything later.</p></div></div>' +
      '<div class="st-new__grid"><div class="st-new__main">' +
        '<label class="fld"><span>About your book <em>optional</em></span><textarea id="desc" rows="5" maxlength="1500" placeholder="e.g. Ten days in Zanzibar with my sisters in March 2026 — the beaches, Stone Town and our boat trip."></textarea></label>' +
        '<div class="chips" aria-label="Examples">' + EXAMPLES.map(function (x) { return '<button type="button" class="chip" data-ex="' + esc(x) + '">' + esc(x) + '</button>'; }).join('') + '</div>' +
        '<div class="st-two"><label class="fld"><span>Title <em>optional</em></span><input id="title" maxlength="80" placeholder="Your book’s title"></label>' +
        '<label class="fld"><span>Subtitle <em>optional</em></span><input id="subtitle" maxlength="90" placeholder="A place, a date, a line"></label></div>' +
        '<label class="fld"><span>Dedication or message <em>optional</em></span><input id="dedication" maxlength="200" placeholder="Printed on the first page"></label>' +
        '<div class="st-sug" id="sug"><div class="st-sug__h"><div><h2>' + A.icon('sparkle') + 'Ideas from the design assistant</h2><p class="muted" id="sugSrc">Get title and style ideas based on what you wrote. Use them, edit them or ignore them.</p></div><div class="st-sug__b"><button type="button" class="btn btn--dark" id="getIdeas">Suggest ideas</button></div></div><div id="sugBody"></div></div>' +
        '<h2 class="st-h2">Choose a look</h2><p class="muted">Every look works for any kind of book. You can switch looks later without losing your work.</p>' +
        '<div class="gfilters" id="cats"><button type="button" class="gfilter on" data-cat="all">All</button><button type="button" class="gfilter" data-cat="destinations">Destination collection</button>' + cats.map(function (c) { return '<button type="button" class="gfilter" data-cat="' + c.id + '">' + esc(c.name) + '</button>'; }).join('') + '</div>' +
        '<div class="st-tpls" id="tpls"></div>' +
        '<h2 class="st-h2">Book format</h2><div class="st-fmts" id="fmts"></div>' +
      '</div><aside class="st-new__side"><div class="st-sum" id="sum"></div></aside></div>' +
      '<div class="st-new__bar"><a class="btn btn--ghost" href="#/">Cancel</a><button class="btn btn--p btn--lg" type="submit">Create my book ' + A.icon('right') + '</button></div></form>';
    var F = document.getElementById('newF');
    function tpls() {
      var list = A.visibleTemplates().filter(function (t) { return st.cat === 'all' || t.category === st.cat || t.collection === st.cat; });
      var rec = st.sug ? st.sug.templates || [] : [];
      list.sort(function (a, b) { var ra = rec.indexOf(a.id), rb = rec.indexOf(b.id); return (ra < 0 ? 99 : ra) - (rb < 0 ? 99 : rb); });
      document.getElementById('tpls').innerHTML = list.map(function (t) {
        var th = E.theme(t.id);
        return '<button type="button" class="st-tpl' + (st.tpl === t.id ? ' on' : '') + '" data-tpl="' + t.id + '" aria-pressed="' + (st.tpl === t.id) + '"><span class="st-tpl__cov">' + A.templateCover(t.id) + '</span><span class="st-tpl__n">' + esc(t.name) + (rec.indexOf(t.id) >= 0 ? ' <em>Suggested</em>' : '') + '</span><span class="st-tpl__d">' + esc(t.desc) + '</span><span class="st-tpl__sw">' + [th.bg, th.accent, th.ink, th.page].map(function (c) { return '<i style="background:' + c + '"></i>'; }).join('') + '<small>' + esc((t.tags || []).join(' · ')) + '</small></span></button>';
      }).join('');
    }
    function fmts() {
      document.getElementById('fmts').innerHTML = (CFG.formats || []).filter(function (f) { return f.enabled !== false; }).map(function (f) {
        var r = f.trimW / f.trimH, w = r >= 1 ? 54 : 54 * r, h = r >= 1 ? 54 / r : 54;
        return '<button type="button" class="st-fmt' + (st.fmt === f.id ? ' on' : '') + '" data-fmt="' + f.id + '" aria-pressed="' + (st.fmt === f.id) + '"><span class="st-fmt__shape"><i style="width:' + w + 'px;height:' + h + 'px"></i></span><b>' + esc(f.name) + '</b><span>' + esc(f.size) + '</span><small>' + f.pages.min + '–' + f.pages.max + ' pages</small></button>';
      }).join('');
    }
    function sum() {
      var t = st.tpl ? A.tplMeta(st.tpl) : null, f = E.format(CFG, st.fmt), title = F.querySelector('#title').value.trim();
      document.getElementById('sum').innerHTML = '<div class="st-sum__cov">' + (st.tpl ? A.templateCover(st.tpl, title || null, st.fmt) : '<div class="st-sum__ph">Choose a look</div>') + '</div><dl><dt>Look</dt><dd>' + (t ? esc(t.name) : 'Not chosen — a neutral look is used') + '</dd><dt>Format</dt><dd>' + esc(f.name + ' · ' + f.size) + '</dd><dt>Pages</dt><dd>Set automatically from your photos (' + f.pages.min + '–' + f.pages.max + ')</dd></dl>';
    }
    function showSug(s, src) {
      st.sug = s;
      document.getElementById('sugSrc').textContent = src === 'ai' ? 'Suggestions from our AI design assistant, based only on what you wrote. Check them before using.' : (s.notes || 'Built-in suggestions.');
      var sec = function (label, key, arr) { return arr && arr.length ? '<div class="st-sug__row"><b>' + label + '</b><div class="chips">' + arr.map(function (x) { return '<button type="button" class="chip chip--use" data-use="' + key + '" data-v="' + esc(x) + '">' + esc(x) + '</button>'; }).join('') + '</div></div>' : ''; };
      document.getElementById('sugBody').innerHTML = sec('Titles', 'title', s.titles) + sec('Subtitles', 'subtitle', s.subtitles) + sec('Dedications', 'dedication', s.dedications) +
        (s.templates && s.templates.length ? '<div class="st-sug__row"><b>Looks</b><div class="chips">' + s.templates.map(function (id) { return '<button type="button" class="chip chip--use" data-usetpl="' + id + '">' + esc(A.tplMeta(id).name) + '</button>'; }).join('') + '</div></div>' : '') +
        '<div class="st-sug__row"><b>Pages</b><p>' + esc({ airy: 'Calm, airy pages with one or two photos and plenty of white space.', balanced: 'A balanced mix of single photos and small groups.', full: 'Lively pages with collages and grids.' }[s.density] || '') + (s.cover ? ' ' + esc(s.cover) : '') + ' ' + esc(s.sections || '') + '</p></div>' +
        '<div class="st-sug__acts"><button type="button" class="btn btn--sm btn--ghost" id="moreIdeas">' + A.icon('refresh') + 'More ideas</button><button type="button" class="btn btn--sm btn--ghost" id="noIdeas">Hide ideas</button></div>';
      tpls();
    }
    function ideas() {
      var input = { description: F.querySelector('#desc').value, title: F.querySelector('#title').value };
      var loc = PBSuggest.local(input, st.seed, CFG);
      showSug(loc, 'built-in');
      A.track('suggest', { ai: !!(st.caps && st.caps.ai) });
      if (st.caps && st.caps.ai && input.description.trim().length > 8) {
        document.getElementById('sugSrc').textContent = 'Asking the AI design assistant… (only your text is sent, never photos)';
        PBSuggest.ai(input, st.seed).then(function (s) { if (s && s.titles && s.titles.length) showSug(s, 'ai'); else document.getElementById('sugSrc').textContent = loc.notes + ' (The AI assistant is unavailable right now.)'; });
      }
    }
    PBSuggest.status().then(function (c) { st.caps = c; });
    F.addEventListener('click', function (e) {
      var t = e.target.closest('button'); if (!t) return;
      if (t.dataset.ex) { var d = F.querySelector('#desc'); d.value = t.dataset.ex; d.focus(); }
      else if (t.id === 'getIdeas') ideas();
      else if (t.id === 'moreIdeas') { st.seed++; ideas(); }
      else if (t.id === 'noIdeas') { st.sug = null; document.getElementById('sugBody').innerHTML = ''; tpls(); }
      else if (t.dataset.use) { var f = F.querySelector('#' + t.dataset.use); f.value = t.dataset.v; f.focus(); sum(); }
      else if (t.dataset.usetpl) { st.tpl = t.dataset.usetpl; tpls(); sum(); }
      else if (t.dataset.tpl) { st.tpl = st.tpl === t.dataset.tpl ? null : t.dataset.tpl; tpls(); sum(); }
      else if (t.dataset.fmt) { st.fmt = t.dataset.fmt; fmts(); sum(); }
      else if (t.dataset.cat) { st.cat = t.dataset.cat; F.querySelectorAll('[data-cat]').forEach(function (b) { b.classList.toggle('on', b === t); }); tpls(); }
    });
    F.querySelector('#title').addEventListener('input', sum);
    F.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = E.format(CFG, st.fmt), g = function (id) { return F.querySelector('#' + id).value.trim(); };
      var bind = Object.keys(CFG.bindings || {})[0] || 'softcover';
      var p = { id: A.uid('pb'), schema: 1, createdAt: Date.now(), name: g('title') || 'Untitled photo book', description: g('desc'), title: g('title'), subtitle: g('subtitle'), dedication: g('dedication'), templateId: st.tpl || 'blank', formatId: f.id, binding: bind, paper: (CFG.papers || [])[0] ? CFG.papers[0].id : null, pageMode: 'auto', pages: [], cover: {}, theme: {}, photoOrder: [], seed: Math.floor(Math.random() * 1e6) + 1, density: st.sug ? st.sug.density : null };
      ST.saveProject(p).then(function () { ST.persist(); A.track('project_created', { format: f.id, template: p.templateId }); location.hash = '#/p/' + p.id + '/photos'; }).catch(function (er) { A.toast(er.message, 'err'); });
    });
    tpls(); fmts(); sum();
    A.track('create_start');
  }

  /* ---------- Photos ---------- */
  A.views.photos = function () {
    var p = S.project, sel = {}, busy = 0, queue = [], done = 0, fails = [];
    var lim = CFG.limits || {};
    function render() {
      var list = A.orderedPhotos(), use = A.usage(), f = A.fmt(), n = list.length;
      var pages = p.pages && p.pages.length ? p.pages.length : E.suggestPages(CFG, p, n);
      var lo = Math.round(pages * 0.8), hi = pages * 3;
      var hint = !n ? 'Add your photos to get started.' : n < lo ? n + ' photos. A ' + pages + '-page book looks best with at least ' + lo + ' — add more, or the assistant will use calmer single-photo pages.' : n > hi ? n + ' photos is a lot for ' + pages + ' pages. The assistant will add pages (up to ' + f.pages.max + ') or leave some in your tray.' : n + ' photos — a good amount for about ' + pages + ' pages.';
      var lows = list.filter(function (m) { return m.low; }).length;
      app.innerHTML = '<section class="st-wrap st-photos">' +
        '<div class="st-head"><div><p class="eyebrow">Your photos</p><h1>Add your photos</h1><p class="lead">' + esc(hint) + '</p></div><div class="st-head__acts">' + (n ? '<button class="btn btn--p btn--lg" id="toDesign">' + (p.pages && p.pages.length ? 'Continue designing' : 'Design my book') + ' ' + A.icon('right') + '</button>' : '') + '</div></div>' +
        '<label class="st-drop" id="drop" tabindex="0"><input type="file" id="file" multiple accept="' + PBPhotos.accept + '" hidden>' + A.icon('upload') + '<b>Drop photos here or choose files</b><span>JPEG, PNG or WebP · up to ' + (lim.maxFileMB || 40) + ' MB each · up to ' + (lim.maxPhotosPerProject || 300) + ' photos. On a phone, tap to pick from your gallery.</span></label>' +
        '<div class="st-prog" id="prog" hidden></div>' +
        (n ? '<div class="st-ptools"><div class="st-ptools__l"><b>' + n + ' photo' + (n === 1 ? '' : 's') + '</b>' + (lows ? '<span class="tag tag--warn">' + lows + ' low resolution</span>' : '') + '<button class="btn btn--sm btn--ghost" id="selAll">Select all</button><button class="btn btn--sm btn--ghost btn--warn" id="rmSel" disabled>Remove selected</button></div><div class="st-ptools__r"><label class="sel">Order <select id="sort"><option value="">My order (drag to rearrange)</option><option value="date">By date taken</option><option value="name">By file name</option></select></label></div></div>' +
          '<ol class="st-pgrid" id="pgrid">' + list.map(function (m, i) {
            return '<li class="st-ph' + (sel[m.id] ? ' on' : '') + '" draggable="true" data-id="' + m.id + '"><label class="st-ph__chk"><input type="checkbox" data-sel="' + m.id + '"' + (sel[m.id] ? ' checked' : '') + ' aria-label="Select photo ' + (i + 1) + '"></label><img alt="' + esc(m.name) + '" data-thumb="' + m.id + '"><span class="st-ph__n">' + (i + 1) + '</span>' +
              '<span class="st-ph__tags">' + (m.low ? '<i class="tag tag--warn" title="' + m.w + '×' + m.h + ' px">Low res</i>' : '') + (use[m.id] ? '<i class="tag">In book</i>' : '') + (m.taken ? '<i class="tag tag--soft" title="Date read from the photo’s metadata">' + esc(new Date(m.taken).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })) + '</i>' : '') + '</span>' +
              '<span class="st-ph__mv"><button data-mv="-1" aria-label="Move earlier">' + A.icon('left') + '</button><button data-mv="1" aria-label="Move later">' + A.icon('right') + '</button><button data-rm="' + m.id + '" aria-label="Remove">' + A.icon('x') + '</button></span></li>';
          }).join('') + '</ol>' : '') +
        '<aside class="st-note"><h3>Private by design</h3><p>Photos are copied into this browser’s storage on this device — not uploaded. Originals are kept at full quality for printing; smaller copies keep the editor fast. Photo dates come from the files’ own metadata when available.</p></aside></section>';
      app.querySelectorAll('[data-thumb]').forEach(function (img) { var id = img.getAttribute('data-thumb'); A.url(id, 'thumb'); S.urls[id + ':thumb'].p.then(function (u) { img.src = u; }); });
      bind();
    }
    function bind() {
      var drop = document.getElementById('drop'), inp = document.getElementById('file');
      drop.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inp.click(); } });
      inp.addEventListener('change', function () { add(inp.files); inp.value = ''; });
      ['dragenter', 'dragover'].forEach(function (t) { drop.addEventListener(t, function (e) { if (e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types, 'Files') >= 0) { e.preventDefault(); drop.classList.add('on'); } }); });
      ['dragleave', 'drop'].forEach(function (t) { drop.addEventListener(t, function () { drop.classList.remove('on'); }); });
      drop.addEventListener('drop', function (e) { e.preventDefault(); add(e.dataTransfer.files); });
      var go = document.getElementById('toDesign'); if (go) go.onclick = toDesign;
      var grid = document.getElementById('pgrid'); if (!grid) return;
      document.getElementById('selAll').onclick = function () { var all = A.orderedPhotos().every(function (m) { return sel[m.id]; }); A.orderedPhotos().forEach(function (m) { if (all) delete sel[m.id]; else sel[m.id] = 1; }); render(); };
      var rm = document.getElementById('rmSel'); rm.disabled = !Object.keys(sel).length;
      rm.onclick = function () { remove(Object.keys(sel)); };
      document.getElementById('sort').onchange = function () {
        var v = this.value, l = A.orderedPhotos(); if (!v) return;
        A.snapshot();
        if (v === 'date') l.sort(function (a, b) { return (a.taken ? Date.parse(a.taken) : 9e15) - (b.taken ? Date.parse(b.taken) : 9e15) || a.added - b.added; });
        if (v === 'name') l.sort(function (a, b) { return a.name.localeCompare(b.name, undefined, { numeric: true }); });
        p.photoOrder = l.map(function (m) { return m.id; }); A.save(); render();
        A.toast(v === 'date' ? 'Sorted by the dates stored in your photos. Photos without a date go last.' : 'Sorted by file name.');
      };
      grid.addEventListener('change', function (e) { var id = e.target.getAttribute('data-sel'); if (!id) return; if (e.target.checked) sel[id] = 1; else delete sel[id]; e.target.closest('li').classList.toggle('on', e.target.checked); rm.disabled = !Object.keys(sel).length; });
      grid.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        var li = b.closest('li'), id = li.getAttribute('data-id');
        if (b.dataset.rm) return remove([b.dataset.rm]);
        if (b.dataset.mv) { var o = p.photoOrder, i = o.indexOf(id), j = i + Number(b.dataset.mv); if (j < 0 || j >= o.length) return; A.snapshot(); o.splice(i, 1); o.splice(j, 0, id); A.save(); render(); var nb = app.querySelector('[data-id="' + id + '"] [data-mv="' + b.dataset.mv + '"]'); if (nb) nb.focus(); }
      });
      var dragId = null;
      grid.addEventListener('dragstart', function (e) { var li = e.target.closest('li'); if (!li) return; dragId = li.getAttribute('data-id'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', dragId); li.classList.add('drag'); });
      grid.addEventListener('dragend', function () { dragId = null; grid.querySelectorAll('.drag,.over').forEach(function (x) { x.classList.remove('drag', 'over'); }); });
      grid.addEventListener('dragover', function (e) { if (!dragId) return; var li = e.target.closest('li'); if (li) { e.preventDefault(); grid.querySelectorAll('.over').forEach(function (x) { x.classList.remove('over'); }); li.classList.add('over'); } });
      grid.addEventListener('drop', function (e) { if (!dragId) return; var li = e.target.closest('li'); if (!li) return; e.preventDefault(); var to = li.getAttribute('data-id'); if (to === dragId) return; var o = p.photoOrder; A.snapshot(); o.splice(o.indexOf(dragId), 1); o.splice(o.indexOf(to), 0, dragId); A.save(); render(); });
    }
    function remove(ids) {
      var use = A.usage(), inBook = ids.filter(function (id) { return use[id]; }).length;
      A.confirm('Remove ' + ids.length + ' photo' + (ids.length === 1 ? '' : 's') + '?', (inBook ? inBook + ' of them ' + (inBook === 1 ? 'is' : 'are') + ' placed in your book; those frames will become empty. ' : '') + 'They’ll be deleted from this device.', 'Remove', true).then(function (ok) {
        if (!ok) return;
        A.snapshot();
        var set = {}; ids.forEach(function (id) { set[id] = 1; delete sel[id]; delete S.photos[id]; });
        p.photoOrder = p.photoOrder.filter(function (id) { return !set[id]; });
        function clr(s) { if (s && set[s.photo]) { delete s.photo; } }
        (p.pages || []).forEach(function (pg) { (pg.slots || []).forEach(clr); });
        if (p.cover) { clr(p.cover.photo); if (p.cover.back) clr(p.cover.back.photo); }
        S.undo = []; // removed files can't be restored by undo
        ST.removePhotos(ids).then(function () { A.save(true); render(); A.toast('Removed'); });
      });
    }
    function add(files) {
      files = Array.prototype.slice.call(files || []);
      if (!files.length) return;
      var room = (lim.maxPhotosPerProject || 300) - p.photoOrder.length;
      if (files.length > room) { A.toast('This book can hold ' + (lim.maxPhotosPerProject || 300) + ' photos. ' + (files.length - Math.max(0, room)) + ' were not added.', 'err'); files = files.slice(0, Math.max(0, room)); }
      queue = queue.concat(files); fails = fails.concat([]); pump();
    }
    function prog() {
      var el = document.getElementById('prog'); if (!el) return;
      var total = done + busy + queue.length;
      el.hidden = !total && !fails.length;
      el.innerHTML = (busy || queue.length ? '<div class="st-prog__bar"><i style="width:' + Math.round(done / Math.max(1, total) * 100) + '%"></i></div><p>Adding photos… ' + done + ' of ' + total + '</p>' : (done ? '<p>' + A.icon('check') + ' ' + done + ' photo' + (done === 1 ? '' : 's') + ' added.</p>' : '')) +
        (fails.length ? '<details class="st-prog__err" open><summary>' + fails.length + ' file' + (fails.length === 1 ? '' : 's') + ' not added</summary><ul>' + fails.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul></details>' : '');
    }
    var hashes = null;
    function pump() {
      if (!hashes) { hashes = {}; Object.keys(S.photos).forEach(function (id) { hashes[S.photos[id].hash] = 1; }); }
      while (busy < 2 && queue.length) {
        var f = queue.shift(); busy++;
        PBPhotos.importFile(f, { projectId: p.id, uid: A.uid, hashes: hashes, limits: lim }).then(function (r) {
          hashes[r.meta.hash] = 1;
          return ST.savePhoto(r.meta, r.blobs).then(function () { S.photos[r.meta.id] = r.meta; p.photoOrder.push(r.meta.id); done++; });
        }).catch(function (e) { fails.push(e.message || 'A file could not be added.'); }).then(function () {
          busy--; prog();
          if (!busy && !queue.length) { A.save(true); A.track('upload_complete', { count: done }); var keep = { d: done, f: fails }; render(); done = keep.d; fails = keep.f; prog(); done = 0; fails = []; hashes = null; }
          else pump();
        });
      }
      prog();
    }
    function toDesign() {
      if (p.pages && p.pages.length) { location.hash = '#/p/' + p.id + '/design'; return; }
      A.autoDesign(); location.hash = '#/p/' + p.id + '/design';
    }
    render();
  };

  /** first automatic design (or a regenerate) */
  A.autoDesign = function (opts) {
    opts = opts || {};
    var p = S.project, list = A.orderedPhotos(), f = A.fmt();
    if (!p.pages || !p.pages.length || opts.refit) {
      var n = opts.pages || (p.pageMode === 'auto' || opts.refit ? E.suggestPages(CFG, p, list.length) : E.evenPages(CFG, f, f.pages.default)), old = p.pages || [];
      p.pages = new Array(n).fill(0).map(function (_, i) { return old[i] && old[i].locked ? old[i] : {}; });
    }
    if (opts.seed) p.seed = opts.seed;
    var th = E.theme(p.templateId);
    var cv = p.cover = p.cover || {};
    var coverStyle = cv.style || th.cover.style, needPhoto = E.COVER_STYLES.filter(function (s) { return s.id === coverStyle; })[0].photo;
    if (needPhoto && (!cv.photo || !cv.photo.photo || !S.photos[cv.photo.photo]) && list.length) {
      var best = list.slice().sort(function (a, b) { var sa = Math.min(a.w, a.h) * (a.w >= a.h === (f.trimW >= f.trimH) ? 1.2 : 1), sb = Math.min(b.w, b.h) * (b.w >= b.h === (f.trimW >= f.trimH) ? 1.2 : 1); return sb - sa; })[0];
      cv.photo = { photo: best.id, zoom: 1, fx: 0.5, fy: 0.45 };
    }
    p.pages = E.autoLayout(CFG, p, list, { seed: p.seed, idSeed: Math.floor(Math.random() * 1e4).toString(36) });
    if (p.density) p.pages.forEach(function (pg) { if (!pg.locked && pg.slots && pg.slots.length) pg.spacing = p.density === 'airy' ? 'airy' : p.density === 'full' ? 'tight' : 'normal'; });
    A.save(true); A.track('layout_generated', { pages: p.pages.length, photos: list.length });
  };

  SV.loadFonts().then(function () { if (A.onChange) A.onChange(); });
  route();
})();
