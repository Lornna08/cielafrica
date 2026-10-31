/* ============================================================
   CIEL PHOTO BOOKS — editor (design) and full preview
   Every change goes through A.snapshot() → mutate → A.commit(),
   which gives undo/redo and autosave to this device.
   ============================================================ */
(function () {
  'use strict';
  var A = window.PBApp, E = A.E, SV = A.SV, CFG = A.CFG, S = A.S, esc = A.esc, I = A.icon;
  var app = document.getElementById('app');
  var mq = window.matchMedia('(max-width: 820px)');
  var COLORS = ['#FFFFFF', '#FAFAF8', '#F4F0E8', '#141414', '#2B2B2B'];

  function W(where) { return where.kind === 'page' ? 'page:' + where.i : where.kind; }
  function parseW(s) { var p = s.split(':'); return p[0] === 'page' ? { kind: 'page', i: +p[1] } : { kind: p[0] }; }
  function render(where) {
    var p = S.project;
    if (where.kind === 'front') return E.renderFront(CFG, p, S.photos);
    if (where.kind === 'back') return E.renderBack(CFG, p, S.photos);
    if (where.kind === 'spine') return E.renderSpine(CFG, p);
    return E.renderPage(CFG, p, where.i, S.photos);
  }
  /** slot object behind a selection */
  function slotObj(where, i, create) {
    var p = S.project;
    if (where.kind === 'front') { p.cover = p.cover || {}; if (!p.cover.photo && create) p.cover.photo = {}; return p.cover.photo; }
    if (where.kind === 'back') { p.cover = p.cover || {}; p.cover.back = p.cover.back || {}; if (!p.cover.back.photo && create) p.cover.back.photo = {}; return p.cover.back.photo; }
    var pg = p.pages[where.i]; pg.slots = pg.slots || []; if (!pg.slots[i] && create) pg.slots[i] = {}; return pg.slots[i];
  }
  function urlFor(id) { return A.url(id, 'prev'); }
  function ensureUrls(ids, kind) { return A.loadUrls(ids.filter(function (id) { return S.photos[id]; }), kind); }
  function idsIn(r) { return r.ops.filter(function (o) { return o.t === 'img'; }).map(function (o) { return o.id; }); }
  function spreadOf(i) { return Math.floor((i + 1) / 2); }
  function spreadPages(s, n) { var a = []; if (2 * s - 1 >= 0 && 2 * s - 1 < n) a.push(2 * s - 1); else a.push(null); if (2 * s < n) a.push(2 * s); else a.push(null); return a; }

  /* =============================== DESIGN =============================== */
  A.views.design = function () {
    var p = S.project;
    if (!p.pages || !p.pages.length) { if (A.orderedPhotos().length) A.autoDesign(); else { location.hash = '#/p/' + p.id + '/photos'; return; } }
    document.body.classList.add('st--editor');
    var ed = { cur: { kind: 'page', i: 0 }, sel: null, tab: 'photos', zoom: 1, guides: false, placing: null, sheet: !mq.matches, trayFilter: 'all' };
    app.innerHTML = '<div class="ed">' +
      '<div class="ed-bar"><div class="ed-bar__g"><button class="ibtn" data-a="undo" title="Undo (Ctrl+Z)" aria-label="Undo">' + I('undo') + '</button><button class="ibtn" data-a="redo" title="Redo (Ctrl+Shift+Z)" aria-label="Redo">' + I('redo') + '</button></div>' +
      '<div class="ed-bar__g ed-bar__mid"><button class="btn btn--sm btn--ghost" data-a="regen">' + I('refresh') + '<span>Regenerate layout</span></button><button class="btn btn--sm btn--ghost" data-a="check">' + I('check') + '<span>Check book</span></button></div>' +
      '<div class="ed-bar__g"><button class="ibtn ed-z" data-a="zout" aria-label="Zoom out">' + I('zoomout') + '</button><button class="btn btn--sm btn--ghost ed-zoom ed-z" data-a="zfit" aria-label="Fit to screen">100%</button><button class="ibtn ed-z" data-a="zin" aria-label="Zoom in">' + I('zoomin') + '</button><label class="ed-guides"><input type="checkbox" data-a="guides"> <span>Safe area</span></label><a class="btn btn--sm btn--p" href="#/p/' + p.id + '/preview">' + I('eye') + '<span>Preview</span></a></div></div>' +
      '<div class="ed-body"><aside class="ed-panel" id="panel"><div class="ed-tabs" role="tablist" id="tabs"></div><div class="ed-pbody" id="pbody"></div></aside>' +
      '<section class="ed-stage" id="stage"><div class="ed-placing" id="placing" hidden></div><div class="ed-canvas" id="canvas"></div><div class="ed-nav"><button class="ibtn" data-a="prev" aria-label="Previous page">' + I('left') + '</button><span id="where"></span><button class="ibtn" data-a="next" aria-label="Next page">' + I('right') + '</button></div></section></div>' +
      '<div class="ed-strip" id="strip" aria-label="Pages"></div></div>';
    var canvas = document.getElementById('canvas'), stage = document.getElementById('stage'), strip = document.getElementById('strip');

    /* ---------- canvas ---------- */
    function views() {
      if (ed.cur.kind === 'cover') return mq.matches ? [{ kind: ed.coverSide === 'back' ? 'back' : 'front' }] : [{ kind: 'back' }, { kind: 'spine' }, { kind: 'front' }];
      if (mq.matches) return [{ kind: 'page', i: ed.cur.i }];
      return spreadPages(spreadOf(ed.cur.i), p.pages.length).map(function (i) { return i == null ? null : { kind: 'page', i: i }; });
    }
    function scale() {
      var d = E.dims(CFG, p), vs = views(), sp = E.spineMm(CFG, p);
      var totalW = vs.reduce(function (t, v) { return t + (v ? (v.kind === 'spine' ? sp : d.W) : d.W); }, 0);
      var aw = Math.max(160, stage.clientWidth - (mq.matches ? 24 : 64)), ah = Math.max(160, stage.clientHeight - (mq.matches ? 150 : 96));
      return Math.min(aw / totalW, ah / d.H) * ed.zoom;
    }
    function pageEl(v, k) {
      if (!v) return '<div class="pg pg--void" style="width:' + (E.dims(CFG, p).W * k) + 'px;height:' + (E.dims(CFG, p).H * k) + 'px" aria-hidden="true"></div>';
      var r = render(v), w = W(v), d = E.dims(CFG, p);
      ensureUrls(idsIn(r), 'prev');
      var hs = '';
      if (v.kind !== 'spine') {
        r.slots.forEach(function (s) {
          var x = Math.max(0, s.rect.x), y = Math.max(0, s.rect.y), x2 = Math.min(r.w, s.rect.x + s.rect.w), y2 = Math.min(r.h, s.rect.y + s.rect.h);
          var on = ed.sel && ed.sel.t === 'slot' && ed.sel.w === w && ed.sel.i === s.i;
          var low = s.dpi && s.dpi < 150 ? ' hs--low' : '';
          hs += '<button type="button" class="hs hs--slot' + (on ? ' sel' : '') + (s.photo ? '' : ' hs--empty') + low + '" data-w="' + w + '" data-slot="' + s.i + '"' + (on && s.photo ? '' : ' draggable="' + (!!s.photo) + '"') + ' style="left:' + (x / r.w * 100) + '%;top:' + (y / r.h * 100) + '%;width:' + ((x2 - x) / r.w * 100) + '%;height:' + ((y2 - y) / r.h * 100) + '%" aria-label="' + (s.photo ? 'Photo' : 'Empty photo frame') + ' ' + (s.i + 1) + (low ? ', low resolution' : '') + '">' + (low ? '<i class="hs__warn" title="' + s.dpi + ' dpi">' + I('alert') + '</i>' : '') + (on && s.photo ? '<i class="hs__pan">' + I('move') + ' Drag to reposition</i>' : '') + '</button>';
        });
        r.texts.forEach(function (t) {
          var on = ed.sel && ed.sel.t === 'text' && ed.sel.w === w && ed.sel.key === t.key;
          hs += '<button type="button" class="hs hs--text' + (on ? ' sel' : '') + (t.empty ? ' hs--tempty' : '') + '" data-w="' + w + '" data-key="' + t.key + '" style="left:' + (t.rect.x / r.w * 100) + '%;top:' + (t.rect.y / r.h * 100) + '%;width:' + (t.rect.w / r.w * 100) + '%;height:' + (t.rect.h / r.h * 100) + '%" aria-label="' + (t.empty ? 'Add ' : 'Edit ') + t.key + '">' + (t.empty ? '<span>Add ' + ({ title: 'title', subtitle: 'subtitle', byline: 'name or date', body: 'text', caption: 'caption', text: 'text' }[t.key] || t.key) + '</span>' : '') + '</button>';
        });
      }
      var label = v.kind === 'page' ? 'Page ' + (v.i + 1) + (p.pages[v.i].locked ? ' · kept' : '') : v.kind === 'front' ? 'Front cover' : v.kind === 'back' ? 'Back cover' : 'Spine';
      var cur = v.kind === 'page' && ed.page === v.i;
      return '<div class="pg' + (v.kind === 'spine' ? ' pg--spine' : '') + (cur ? ' pg--cur' : '') + '" data-pg="' + w + '" style="width:' + (r.w * k) + 'px;height:' + (r.h * k) + 'px">' + SV.svg(r, { url: urlFor, guides: ed.guides && v.kind !== 'spine', empty: 'editor', label: label }) + '<div class="pg-ov">' + hs + '</div><span class="pg-lab">' + label + '</span></div>';
    }
    function drawCanvas() {
      var k = scale(), vs = views();
      canvas.innerHTML = '<div class="spread' + (ed.cur.kind === 'cover' ? ' spread--cover' : '') + '">' + vs.map(function (v) { return pageEl(v, k); }).join('') + '</div>';
      var n = p.pages.length;
      document.getElementById('where').textContent = ed.cur.kind === 'cover' ? 'Cover' : (mq.matches ? 'Page ' + (ed.cur.i + 1) + ' of ' + n : views().filter(Boolean).map(function (v) { return v.i + 1; }).join('–') + ' of ' + n);
      app.querySelector('.ed-zoom').textContent = Math.round(ed.zoom * 100) + '%';
      // images arrive asynchronously the first time
      var pend = []; canvas.querySelectorAll('image').forEach(function (im) { if (!im.getAttribute('href')) pend.push(im); });
      var wanted = []; vs.forEach(function (v) { if (v) idsIn(render(v)).forEach(function (id) { if (!A.url(id, 'prev')) wanted.push(id); }); });
      if (wanted.length) ensureUrls(wanted, 'prev').then(function () { if (!ed.dragging) drawCanvas(); });
    }
    function redrawOne(w) {
      var el = canvas.querySelector('[data-pg="' + w + '"]'); if (!el) return drawCanvas();
      var k = scale(), tmp = document.createElement('div'); tmp.innerHTML = pageEl(parseW(w), k); el.parentNode.replaceChild(tmp.firstChild, el);
    }

    /* ---------- strip ---------- */
    function thumb(v, cls) { var r = render(v); return '<span class="th ' + (cls || '') + '" style="aspect-ratio:' + r.w + '/' + r.h + '">' + SV.svg(r, { url: function (id) { return A.url(id, 'thumb'); }, empty: 'editor' }) + '</span>'; }
    function drawStrip() {
      var n = p.pages.length, h = '<button type="button" class="st-cell' + (ed.cur.kind === 'cover' ? ' on' : '') + '" data-go="cover">' + '<span class="st-cell__pp">' + thumb({ kind: 'back' }) + thumb({ kind: 'front' }) + '</span><b>Cover</b></button>';
      var issues = {};
      for (var s = 0; s <= Math.floor(n / 2); s++) {
        var pr = spreadPages(s, n);
        if (pr[0] == null && pr[1] == null) continue;
        var on = ed.cur.kind === 'page' && (ed.cur.i === pr[0] || ed.cur.i === pr[1]);
        h += '<div class="st-cell' + (on ? ' on' : '') + '"><span class="st-cell__pp">' + pr.map(function (i) {
          if (i == null) return '<span class="th th--void"></span>';
          var pg = p.pages[i], empty = (pg.slots || []).some(function (x, j) { return !x || !x.photo; }) || ((E.LMAP[pg.layout] || {}).slots || []).length > (pg.slots || []).filter(function (x) { return x && x.photo; }).length;
          return '<button type="button" class="st-pgbtn' + (ed.cur.kind === 'page' && ed.cur.i === i ? ' cur' : '') + '" data-go="' + i + '" draggable="true" aria-label="Page ' + (i + 1) + '">' + thumb({ kind: 'page', i: i }) + '<i>' + (i + 1) + (pg.locked ? ' ' + I('lock') : '') + (empty ? ' <em title="Empty frame">●</em>' : '') + '</i></button>';
        }).join('') + '</span></div>';
      }
      h += '<button type="button" class="st-cell st-cell--add" data-a="addend">' + I('plus') + '<b>Add pages</b></button>';
      strip.innerHTML = h;
      var c = strip.querySelector('.on'); if (c && c.scrollIntoView) { var r = c.getBoundingClientRect(), sr = strip.getBoundingClientRect(); if (r.left < sr.left || r.right > sr.right) strip.scrollLeft += r.left - sr.left - sr.width / 2 + r.width / 2; }
      var want = []; Object.keys(S.photos).forEach(function (id) { if (!A.url(id, 'thumb')) want.push(id); });
      if (want.length) ensureUrls(want, 'thumb').then(drawStrip);
    }

    /* ---------- panel ---------- */
    function tabs() {
      var T = [['photos', 'Photos', 'image'], [ed.cur.kind === 'cover' ? 'cover' : 'layout', ed.cur.kind === 'cover' ? 'Cover' : 'Layout', 'grid'], ['text', 'Text', 'type'], ['style', 'Style', 'palette'], ['book', 'Book', 'book']];
      if (ed.sel) T.unshift(['edit', 'Edit', 'edit']);
      if (ed.tab === 'layout' && ed.cur.kind === 'cover') ed.tab = 'cover';
      if (ed.tab === 'cover' && ed.cur.kind !== 'cover') ed.tab = 'layout';
      if (ed.tab === 'edit' && !ed.sel) ed.tab = ed.cur.kind === 'cover' ? 'cover' : 'layout';
      document.getElementById('tabs').innerHTML = T.map(function (t) { return '<button type="button" role="tab" aria-selected="' + (ed.tab === t[0] && ed.sheet) + '" data-tab="' + t[0] + '">' + I(t[2]) + '<span>' + t[1] + '</span></button>'; }).join('');
      document.getElementById('panel').classList.toggle('open', ed.sheet);
    }
    function sw(colors, cur, attr) { return '<div class="sw">' + colors.map(function (c) { return '<button type="button" class="sw__c' + (String(cur).toLowerCase() === c.toLowerCase() ? ' on' : '') + '" style="background:' + c + '" ' + attr + '="' + c + '" aria-label="Colour ' + c + '"></button>'; }).join('') + '<label class="sw__custom" title="Custom colour"><input type="color" ' + attr + '-in value="' + (/^#[0-9a-f]{6}$/i.test(cur) ? cur : '#888888') + '" aria-label="Custom colour"></label></div>'; }
    function fontSel(name, cur, label) { return '<label class="fld fld--sm"><span>' + label + '</span><select ' + name + '>' + Object.keys(E.FONTS).map(function (k) { return '<option value="' + k + '"' + (k === cur ? ' selected' : '') + ' style="font-family:pb-' + k + '">' + esc(E.FONTS[k].name) + ' · ' + E.FONTS[k].kind + '</option>'; }).join('') + '</select></label>'; }
    function themeVal(k) { var t = p.theme || {}, th = E.theme(p.templateId); return t[k] || th[{ titleFont: 'title', bodyFont: 'body', captionFont: 'caption' }[k] || k]; }
    var layoutThumbs = {};
    function layoutThumb(L) {
      var key = p.formatId + L.id; if (layoutThumbs[key]) return layoutThumbs[key];
      var tmp = { formatId: p.formatId, templateId: 'blank', pages: [{ layout: L.id, slots: [], texts: L.kind === 'text' ? { title: 'Title', subtitle: 'Subtitle', body: 'Text' } : (L.texts ? { caption: 'Caption', body: 'Text' } : {}), spacing: 'normal' }], cover: {}, theme: {} };
      return (layoutThumbs[key] = SV.svg(E.renderPage(CFG, tmp, 0, {}), { empty: 'sample', sampleFill: '#CFCCC4' }));
    }
    function panel() {
      tabs();
      var b = document.getElementById('pbody'), h = '';
      var pg = ed.cur.kind === 'page' ? p.pages[ed.page] : null;
      if (ed.tab === 'photos') {
        var list = A.orderedPhotos(), use = A.usage(), shown = ed.trayFilter === 'unused' ? list.filter(function (m) { return !use[m.id]; }) : list;
        h = '<div class="pn-h"><h3>Your photos</h3><a class="btn btn--sm btn--ghost" href="#/p/' + p.id + '/photos">' + I('plus') + 'Add</a></div>' +
          '<div class="seg"><button type="button" data-tray="all" class="' + (ed.trayFilter === 'all' ? 'on' : '') + '">All ' + list.length + '</button><button type="button" data-tray="unused" class="' + (ed.trayFilter === 'unused' ? 'on' : '') + '">Not used ' + list.filter(function (m) { return !use[m.id]; }).length + '</button></div>' +
          '<p class="pn-hint">' + (ed.sel && ed.sel.t === 'slot' ? 'Tap a photo to put it in the selected frame.' : mq.matches ? 'Tap a photo, then tap a frame.' : 'Drag a photo onto a frame, or tap it and then a frame.') + '</p>' +
          '<div class="tray">' + shown.map(function (m) { return '<button type="button" class="tray__i' + (ed.placing === m.id ? ' on' : '') + '" draggable="true" data-ph="' + m.id + '" aria-label="' + esc(m.name) + (use[m.id] ? ', used ' + use[m.id] + ' times' : ', not used') + '"><img alt="" data-tt="' + m.id + '">' + (use[m.id] ? '<i>' + use[m.id] + '</i>' : '') + (m.low ? '<em>Low res</em>' : '') + '</button>'; }).join('') + (shown.length ? '' : '<p class="muted">' + (list.length ? 'Every photo is in the book.' : 'No photos yet.') + '</p>') + '</div>';
      } else if (ed.tab === 'layout' && pg) {
        var groups = [[1, '1 photo'], [2, '2 photos'], [3, '3 photos'], [4, '4 photos'], [5, '5 photos'], [6, '6 photos'], [0, 'Text & blank']];
        h = '<div class="pn-h"><h3>Page ' + (ed.page + 1) + '</h3><span class="muted">' + esc((E.LMAP[pg.layout] || {}).name || '') + '</span></div>' +
          '<div class="pn-acts"><button type="button" class="btn btn--sm btn--ghost" data-pa="lock" aria-pressed="' + !!pg.locked + '">' + I('lock') + (pg.locked ? 'Kept' : 'Keep page') + '</button><button type="button" class="ibtn" data-pa="left" aria-label="Move page earlier">' + I('left') + '</button><button type="button" class="ibtn" data-pa="right" aria-label="Move page later">' + I('right') + '</button><button type="button" class="ibtn" data-pa="add" aria-label="Add two pages after" title="Add two pages after">' + I('plus') + '</button><button type="button" class="ibtn" data-pa="del" aria-label="Delete page" title="Delete page">' + I('trash') + '</button></div>' +
          (pg.locked ? '<p class="pn-hint">Kept pages stay exactly as they are when you regenerate the layout.</p>' : '') +
          (pg.inferred ? '<p class="pn-hint">' + I('alert') + ' The dates on this page were read from your photos’ metadata, not typed by you. Check or edit them.</p>' : '') +
          groups.map(function (g) { var ls = E.LAYOUTS.filter(function (l) { return l.group === g[0]; }); return '<h4>' + g[1] + '</h4><div class="lays">' + ls.map(function (l) { return '<button type="button" class="lay' + (l.id === pg.layout ? ' on' : '') + '" data-lay="' + l.id + '" title="' + esc(l.name) + '" aria-label="' + esc(l.name) + '" style="aspect-ratio:' + A.fmt().trimW + '/' + A.fmt().trimH + '">' + layoutThumb(l) + '</button>'; }).join('') + '</div>'; }).join('') +
          '<h4>Spacing</h4><div class="seg">' + ['tight', 'normal', 'airy'].map(function (s) { return '<button type="button" data-spc="' + s + '" class="' + ((pg.spacing || 'normal') === s ? 'on' : '') + '">' + s.charAt(0).toUpperCase() + s.slice(1) + '</button>'; }).join('') + '</div>' +
          '<h4>Background</h4>' + sw([themeVal('page'), E.theme(p.templateId).soft, themeVal('bg'), themeVal('accent')].concat(COLORS).filter(function (c, i, a) { return a.indexOf(c) === i; }), pg.bg || (pg.layout === 'section' ? (p.theme || {}).sectionBg || E.theme(p.templateId).sectionBg : themeVal('page')), 'data-pbg') +
          ((E.LMAP[pg.layout] || {}).kind === 'text' ? '<h4>Text colour</h4>' + sw(['#1A1A1A', '#FFFFFF', themeVal('accent'), themeVal('bg'), themeVal('ink')].filter(function (c, i, a) { return a.indexOf(c) === i; }), pg.ink || '#1A1A1A', 'data-pink') + '<h4>Decoration</h4><div class="seg">' + E.ORNAMENTS.map(function (o) { return '<button type="button" data-orn="' + o + '" class="' + ((pg.ornament || ((E.LMAP[pg.layout] || {}).ornament ? 'rule' : 'none')) === o ? 'on' : '') + '">' + o.charAt(0).toUpperCase() + o.slice(1) + '</button>'; }).join('') + '</div>' : '') +
          '<div class="pn-acts pn-acts--wrap"><button type="button" class="btn btn--sm btn--ghost" data-pa="section">' + I('plus') + 'Section page after</button><button type="button" class="btn btn--sm btn--ghost" data-pa="message">' + I('plus') + 'Message page after</button></div>';
      } else if (ed.tab === 'cover') h = coverPanel();
      else if (ed.tab === 'text') {
        h = '<div class="pn-h"><h3>Book text</h3></div><p class="pn-hint">Click any text on a page to edit it. Empty text boxes don’t print.</p>' +
          '<label class="fld"><span>Title</span><input data-bk="title" maxlength="80" value="' + esc(p.title || '') + '"></label><label class="fld"><span>Subtitle</span><input data-bk="subtitle" maxlength="90" value="' + esc(p.subtitle || '') + '"></label><label class="fld"><span>Dedication or message</span><textarea data-bk="dedication" rows="3" maxlength="300">' + esc(p.dedication || '') + '</textarea></label>' +
          '<p class="pn-hint">These update the cover and the title page (where you haven’t changed them separately).</p>' +
          '<h4>Book fonts</h4>' + fontSel('data-tf="titleFont"', themeVal('titleFont'), 'Titles') + fontSel('data-tf="bodyFont"', themeVal('bodyFont'), 'Body text') + fontSel('data-tf="captionFont"', themeVal('captionFont'), 'Captions') +
          (pg ? '<h4>Captions on page ' + (ed.page + 1) + '</h4>' + ((E.LMAP[pg.layout] || {}).texts ? '<p class="pn-hint">This layout has a text box — click it on the page to write.</p>' : '<p class="pn-hint">Choose a layout with a caption:</p><div class="lays">' + ['single-caption', 'single-small', 'two-quiet', 'text-photo', 'photo-text-side'].map(function (id) { var l = E.LMAP[id]; return '<button type="button" class="lay" data-lay="' + id + '" title="' + esc(l.name) + '" aria-label="' + esc(l.name) + '" style="aspect-ratio:' + A.fmt().trimW + '/' + A.fmt().trimH + '">' + layoutThumb(l) + '</button>'; }).join('') + '</div>') : '');
      } else if (ed.tab === 'style') {
        h = '<div class="pn-h"><h3>Look</h3><span class="muted">' + esc(A.tplMeta(p.templateId).name) + '</span></div><div class="tpls-sm">' + A.visibleTemplates().map(function (t) { return '<button type="button" class="tpl-sm' + (t.id === p.templateId ? ' on' : '') + '" data-look="' + t.id + '" title="' + esc(t.name) + '">' + A.templateCover(t.id, null, p.formatId) + '<span>' + esc(t.name) + '</span></button>'; }).join('') + '</div>' +
          '<p class="pn-hint">Changing the look keeps your photos, text and layouts.</p>' +
          '<h4>Cover colour</h4>' + sw([E.theme(p.templateId).bg, themeVal('accent'), '#141414', '#FFFFFF', '#F4F0E8', '#1B2A4A', '#C8623E', '#26A4EA'].filter(function (c, i, a) { return a.indexOf(c) === i; }), (p.cover && p.cover.bg) || themeVal('bg'), 'data-cbg') +
          '<h4>Page colour (all pages)</h4>' + sw(['#FFFFFF', '#FAFAF8', '#F4F0E8', E.theme(p.templateId).soft, '#141414'].filter(function (c, i, a) { return a.indexOf(c) === i; }), themeVal('page'), 'data-tpage') +
          '<h4>Spacing (all pages)</h4><div class="seg">' + ['tight', 'normal', 'airy'].map(function (s) { return '<button type="button" data-allspc="' + s + '">' + s.charAt(0).toUpperCase() + s.slice(1) + '</button>'; }).join('') + '</div>' +
          '<h4>Automatic layout</h4><p class="pn-hint">Rearranges the photos on every page you haven’t kept. Your cover, kept pages and photo order stay.</p><button type="button" class="btn btn--dark btn--block" data-a="regen">' + I('refresh') + 'Regenerate layout</button>';
      } else if (ed.tab === 'book') {
        var f = A.fmt(), bd = CFG.bindings || {}, sp = E.spineMm(CFG, p);
        h = '<div class="pn-h"><h3>Book</h3></div><label class="fld"><span>Name (for you)</span><input data-name maxlength="80" value="' + esc(p.name || '') + '"></label>' +
          '<h4>Format</h4><div class="fmts-sm">' + CFG.formats.filter(function (x) { return x.enabled !== false; }).map(function (x) { return '<button type="button" class="' + (x.id === p.formatId ? 'on' : '') + '" data-fmt="' + x.id + '"><b>' + esc(x.name) + '</b><span>' + esc(x.size) + '</span></button>'; }).join('') + '</div>' +
          '<h4>Pages</h4><div class="stepper"><button type="button" class="ibtn" data-pc="-1" aria-label="Fewer pages">−</button><b>' + p.pages.length + ' pages</b><button type="button" class="ibtn" data-pc="1" aria-label="More pages">+</button></div><p class="pn-hint">' + f.pages.min + '–' + f.pages.max + ' pages, in steps of ' + (f.pages.step || 2) + '. Removing pages takes them from the end.</p>' +
          '<button type="button" class="btn btn--sm btn--ghost" data-a="refit">Fit pages to my photos</button>' +
          '<h4>Binding (for printed books)</h4><div class="seg">' + Object.keys(bd).map(function (k) { return '<button type="button" data-bind="' + k + '" class="' + (p.binding === k ? 'on' : '') + '">' + esc(bd[k].name) + '</button>'; }).join('') + '</div>' +
          '<h4>Paper</h4><div class="seg">' + (CFG.papers || []).filter(function (x) { return x.enabled !== false; }).map(function (x) { return '<button type="button" data-paper="' + x.id + '" class="' + (p.paper === x.id ? 'on' : '') + '">' + esc(x.name) + '</button>'; }).join('') + '</div>' +
          '<dl class="specs"><dt>Trim size</dt><dd>' + f.trimW + ' × ' + f.trimH + ' mm</dd><dt>Bleed</dt><dd>' + f.bleed + ' mm each edge</dd><dt>Safe margin</dt><dd>' + f.safe + ' mm</dd><dt>Spine (estimate)</dt><dd>' + sp + ' mm</dd></dl>';
      } else if (ed.tab === 'edit' && ed.sel) h = editPanel();
      b.innerHTML = h;
      b.querySelectorAll('[data-tt]').forEach(function (img) { var id = img.getAttribute('data-tt'), u = A.url(id, 'thumb'); if (u) img.src = u; else S.urls[id + ':thumb'].p.then(function (x) { img.src = x; }); });
    }
    function coverPanel() {
      var cv = p.cover = p.cover || {}, th = E.theme(p.templateId), style = cv.style || th.cover.style, T = E.coverTexts(p), bk = cv.back || {};
      var allowSpine = E.spineTextAllowed(CFG, p), bind = (CFG.bindings || {})[p.binding] || {};
      var art = cv.art !== undefined ? cv.art : th.cover.art;
      return (mq.matches ? '<div class="seg"><button type="button" data-cside="front" class="' + (ed.coverSide !== 'back' ? 'on' : '') + '">Show front</button><button type="button" data-cside="back" class="' + (ed.coverSide === 'back' ? 'on' : '') + '">Show back</button></div>' : '') + '<div class="pn-h"><h3>Front cover</h3></div><div class="seg seg--wrap">' + E.COVER_STYLES.map(function (s) { return '<button type="button" data-cstyle="' + s.id + '" class="' + (style === s.id ? 'on' : '') + '">' + esc(s.name) + '</button>'; }).join('') + '</div>' +
        (style === 'illustration' || style === 'type' ? '<h4>Illustration</h4><div class="arts">' + ['none'].concat(PBA.list).map(function (k) { var on = (art || 'none') === k; return '<button type="button" class="art' + (on ? ' on' : '') + '" data-art="' + k + '" title="' + esc(k === 'none' ? 'No illustration' : PBA.art[k].name) + '">' + (k === 'none' ? '<span>None</span>' : '<svg viewBox="0 0 100 100">' + PBA.art[k].shapes.map(function (s) { var c = function (x) { return x && x.charAt(0) === '@' ? (x === '@accent' ? th.accent : th.ink) : x; }; return '<path d="' + s.d + '" fill="' + (c(s.f) || 'none') + '"' + (s.s ? ' stroke="' + c(s.s) + '" stroke-width="' + (s.w || 1) + '"' : '') + '/>'; }).join('') + '</svg>') + '</button>'; }).join('') + '</div>' : '<p class="pn-hint">Click the photo on the cover to change or reposition it. Titles sit on a solid band, never over faces.</p>') +
        '<label class="fld"><span>Title</span><input data-ct="title" maxlength="80" value="' + esc(T.title) + '"></label><label class="fld"><span>Subtitle</span><input data-ct="subtitle" maxlength="90" value="' + esc(T.subtitle) + '"></label><label class="fld"><span>Name or date line <em>optional</em></span><input data-ct="byline" maxlength="60" value="' + esc(T.byline) + '"></label>' +
        fontSel('data-cf="titleFont"', cv.titleFont || themeVal('titleFont'), 'Title font') +
        '<label class="fld fld--sm"><span>Title size</span><input type="range" min="0.5" max="1.6" step="0.05" data-cr="titleScale" value="' + (cv.titleScale || 1) + '"></label>' +
        '<div class="seg"><button type="button" data-cal="start" class="' + (cv.align === 'start' ? 'on' : '') + '">Left</button><button type="button" data-cal="middle" class="' + (!cv.align || cv.align === 'middle' ? 'on' : '') + '">Centre</button><button type="button" data-cal="end" class="' + (cv.align === 'end' ? 'on' : '') + '">Right</button><button type="button" data-cup="1" class="' + ((cv.upper != null ? cv.upper : th.cover.upper) ? 'on' : '') + '">ABC</button></div>' +
        '<h4>Cover colour</h4>' + sw([th.bg, th.accent, '#141414', '#FFFFFF', '#F4F0E8', '#26A4EA', '#E68AD2', '#FF8B72', '#CFF8FC', '#1B2A4A'].filter(function (c, i, a) { return a.indexOf(c) === i; }), cv.bg || themeVal('bg'), 'data-cbg') +
        '<h4>Title colour</h4>' + sw([th.ink, '#FFFFFF', '#141414', th.accent].filter(function (c, i, a) { return a.indexOf(c) === i; }), cv.ink || themeVal('ink'), 'data-cink') +
        '<div class="pn-h pn-h--sep"><h3>Back cover</h3></div><div class="seg">' + E.BACK_STYLES.map(function (s) { return '<button type="button" data-bstyle="' + s.id + '" class="' + ((bk.style || 'color') === s.id ? 'on' : '') + '">' + esc(s.name) + '</button>'; }).join('') + '</div>' +
        '<label class="fld"><span>Back cover text <em>optional</em></span><textarea data-btext rows="3" maxlength="300">' + esc(bk.text || '') + '</textarea></label>' +
        '<div class="pn-h pn-h--sep"><h3>Spine</h3></div>' + (allowSpine ? '<label class="fld"><span>Spine text</span><input data-spine maxlength="60" value="' + esc((cv.spine && cv.spine.text) || '') + '"></label>' : '<p class="pn-hint">' + (bind.spineText ? 'Spine text needs a spine at least ' + (bind.spineTextMinMm || 6) + ' mm thick (this book: ' + E.spineMm(CFG, p) + ' mm). Add pages to enable it.' : esc(bind.name || 'This binding') + ' doesn’t support spine text.') + '</p>');
    }
    function editPanel() {
      var s = ed.sel, v = parseW(s.w);
      if (s.t === 'slot') {
        var o = slotObj(v, s.i) || {}, m = o.photo && S.photos[o.photo], r = render(v), rs = r.slots[s.i] || {};
        var pages = p.pages.map(function (x, i) { return '<option value="' + i + '">Page ' + (i + 1) + '</option>'; }).join('');
        return '<div class="pn-h"><h3>Photo frame</h3><button type="button" class="ibtn" data-a="desel" aria-label="Done">' + I('x') + '</button></div>' +
          (m ? '<div class="ep"><img data-tt="' + m.id + '" alt=""><div><b>' + esc(m.name) + '</b><span>' + m.w + ' × ' + m.h + ' px</span>' + (rs.dpi ? '<span class="' + (rs.dpi < 150 ? 'warn' : 'ok') + '">' + rs.dpi + ' dpi at this size' + (rs.dpi < 100 ? ' — will look soft' : rs.dpi < 150 ? ' — may look soft' : ' — good for print') + '</span>' : '') + (m.taken ? '<span class="muted">Taken ' + new Date(m.taken).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ' (from the file)</span>' : '') + '</div></div>' +
            '<label class="fld fld--sm"><span>Zoom</span><input type="range" min="1" max="3" step="0.02" data-zoom value="' + (o.zoom || 1) + '"></label>' +
            '<div class="focus" data-focus aria-label="Focus point: click where the most important part of the photo is"><img data-tt="' + m.id + '" alt=""><i style="left:' + ((o.fx == null ? 0.5 : o.fx) * 100) + '%;top:' + ((o.fy == null ? 0.5 : o.fy) * 100) + '%"></i></div><p class="pn-hint">Click the most important part of the photo to keep it in view, or drag the photo on the page.</p>' +
            '<div class="pn-acts pn-acts--wrap"><button type="button" class="btn btn--sm btn--ghost" data-e="replace">' + I('image') + 'Replace</button><button type="button" class="btn btn--sm btn--ghost" data-e="reset">Reset crop</button><button type="button" class="btn btn--sm btn--ghost btn--warn" data-e="remove">' + I('trash') + 'Remove</button></div>' +
            (v.kind === 'page' ? '<label class="fld fld--sm"><span>Move to page</span><select data-moveto><option value="">Choose a page…</option>' + pages + '</select></label>' : '')
            : '<p class="pn-hint">This frame is empty. Choose a photo:</p><button type="button" class="btn btn--dark btn--block" data-e="replace">' + I('image') + 'Choose a photo</button>');
      }
      var cur = textVal(v, s.key), st = textStyleOver(v, s.key) || {};
      var role = s.key, isCover = v.kind === 'front' || v.kind === 'back';
      return '<div class="pn-h"><h3>Text</h3><button type="button" class="ibtn" data-a="desel" aria-label="Done">' + I('x') + '</button></div>' +
        '<label class="fld"><span>' + esc({ title: 'Title', subtitle: 'Subtitle', body: 'Text', caption: 'Caption', byline: 'Name or date', text: 'Back cover text' }[role] || role) + '</span><textarea data-tx rows="' + (role === 'title' ? 2 : 4) + '" maxlength="600">' + esc(cur || '') + '</textarea></label>' +
        '<p class="pn-hint">' + (isCover ? 'Cover text uses the cover font settings in the Cover tab.' : 'Leave it empty to print nothing here.') + '</p>' +
        (isCover ? '' : fontSel('data-sf', st.font || '', 'Font').replace('<select data-sf>', '<select data-sf><option value="">Book default</option>') +
          '<label class="fld fld--sm"><span>Size</span><input type="range" min="0.5" max="2.2" step="0.05" data-ss value="' + (st.scale || 1) + '"></label>' +
          '<div class="seg"><button type="button" data-sa="start" class="' + (st.align === 'start' ? 'on' : '') + '">Left</button><button type="button" data-sa="middle" class="' + (st.align === 'middle' ? 'on' : '') + '">Centre</button><button type="button" data-sa="end" class="' + (st.align === 'end' ? 'on' : '') + '">Right</button></div>' +
          '<h4>Colour</h4>' + sw(['#1A1A1A', '#FFFFFF', '#6B6B66', themeVal('accent'), themeVal('bg')].filter(function (c, i, a) { return a.indexOf(c) === i; }), st.color || '', 'data-sc'));
    }
    function textVal(v, key) {
      if (v.kind === 'front') return E.coverTexts(p)[key];
      if (v.kind === 'back') return ((p.cover || {}).back || {}).text;
      return (p.pages[v.i].texts || {})[key];
    }
    function setText(v, key, val) {
      if (v.kind === 'front') { p.cover = p.cover || {}; p.cover[key] = val; return; }
      if (v.kind === 'back') { p.cover = p.cover || {}; p.cover.back = p.cover.back || {}; p.cover.back.text = val; return; }
      var pg = p.pages[v.i]; pg.texts = pg.texts || {}; pg.texts[key] = val;
    }
    function textStyleOver(v, key, create) {
      if (v.kind !== 'page') return null; var pg = p.pages[v.i]; pg.style = pg.style || {}; if (!pg.style[key] && create) pg.style[key] = {}; return pg.style[key];
    }

    function all() { drawCanvas(); drawStrip(); panel(); placingBar(); }
    A.onChange = all;
    function change(fn, light) { A.snapshot(); fn(); A.save(); if (light) { light(); } else all(); }
    function placingBar() { var b = document.getElementById('placing'); if (!ed.placing) { b.hidden = true; return; } b.hidden = false; b.innerHTML = '<span>Tap a frame to place this photo</span><button type="button" class="btn btn--sm btn--ghost" data-a="cancelplace">Cancel</button>'; }
    function select(sel) { ed.sel = sel; if (sel) { ed.tab = 'edit'; ed.sheet = true; } if (sel && sel.w.indexOf('page:') === 0) ed.page = +sel.w.split(':')[1]; all(); }
    function go(target) {
      ed.sel = null; ed.placing = null;
      if (target === 'cover') ed.cur = { kind: 'cover' };
      else { var i = Math.max(0, Math.min(p.pages.length - 1, target)); ed.cur = { kind: 'page', i: i }; ed.page = i; }
      all();
    }
    function step(d) {
      if (ed.cur.kind === 'cover') { if (d > 0) go(0); return; }
      if (mq.matches) { var n = ed.cur.i + d; if (n < 0) go('cover'); else go(Math.min(p.pages.length - 1, n)); return; }
      var s = spreadOf(ed.cur.i) + d; if (s < 0) return go('cover');
      var pr = spreadPages(s, p.pages.length); var t = pr[0] != null ? pr[0] : pr[1]; if (t != null) go(t);
    }
    function placePhoto(w, i, id) {
      var v = parseW(w);
      change(function () { var o = slotObj(v, i, true); o.photo = id; o.zoom = 1; o.fx = 0.5; o.fy = S.photos[id] && E.orientOf(S.photos[id].w, S.photos[id].h) === 'p' ? 0.42 : 0.5; if (v.kind === 'front' && p.cover && !p.cover.style) { /* keep template style */ } });
      ed.placing = null; A.toast('Photo placed');
    }
    ed.page = 0;

    /* ---------- events ---------- */
    app.addEventListener('click', function (e) {
      var t = e.target.closest('button,[data-focus]'); if (!t) { return; }
      var a = t.getAttribute('data-a');
      if (a === 'undo') return A.undo();
      if (a === 'redo') return A.redo();
      if (a === 'zin') { ed.zoom = Math.min(3, ed.zoom * 1.25); return drawCanvas(); }
      if (a === 'zout') { ed.zoom = Math.max(0.5, ed.zoom / 1.25); return drawCanvas(); }
      if (a === 'zfit') { ed.zoom = 1; return drawCanvas(); }
      if (a === 'prev') return step(-1);
      if (a === 'next') return step(1);
      if (a === 'desel') { ed.sel = null; ed.tab = ed.cur.kind === 'cover' ? 'cover' : 'layout'; return all(); }
      if (a === 'cancelplace') { ed.placing = null; return all(); }
      if (a === 'regen') return regenerate();
      if (a === 'refit') return regenerate(true);
      if (a === 'check') return check();
      if (a === 'addend') return change(function () { p.pages.push({ id: A.uid('pg'), layout: 'blank', slots: [], texts: {} }, { id: A.uid('pg'), layout: 'blank', slots: [], texts: {} }); }, function () { go(p.pages.length - 2); });
      if (t.hasAttribute('data-tab')) { var tb = t.getAttribute('data-tab'); if (mq.matches && ed.tab === tb && ed.sheet) ed.sheet = false; else { ed.tab = tb; ed.sheet = true; } return panel(); }
      if (t.hasAttribute('data-cside')) { ed.coverSide = t.getAttribute('data-cside'); return all(); }
      if (t.hasAttribute('data-go')) { var g = t.getAttribute('data-go'); return go(g === 'cover' ? 'cover' : +g); }
      if (t.hasAttribute('data-tray')) { ed.trayFilter = t.getAttribute('data-tray'); return panel(); }
      if (t.hasAttribute('data-ph')) {
        var id = t.getAttribute('data-ph');
        if (ed.sel && ed.sel.t === 'slot') { placePhoto(ed.sel.w, ed.sel.i, id); return; }
        ed.placing = ed.placing === id ? null : id; if (mq.matches && ed.placing) ed.sheet = false; return all();
      }
      if (t.classList.contains('hs')) {
        var w = t.getAttribute('data-w');
        if (t.hasAttribute('data-slot')) { var si = +t.getAttribute('data-slot'); if (ed.placing) return placePhoto(w, si, ed.placing); if (ed.justPanned) { ed.justPanned = false; return; } return select({ t: 'slot', w: w, i: si }); }
        if (t.hasAttribute('data-key')) { select({ t: 'text', w: w, key: t.getAttribute('data-key') }); var ta = document.querySelector('[data-tx]'); if (ta && !mq.matches) ta.focus(); return; }
      }
      // panel actions
      var pg = p.pages[ed.page];
      if (t.hasAttribute('data-lay')) { var L = t.getAttribute('data-lay'); return change(function () { E.applyLayout(p.pages[ed.page], L); if (E.LMAP[L].kind === 'text' && L === 'title-page') { var x = p.pages[ed.page].texts; if (!x.title) x.title = p.title || ''; if (!x.subtitle) x.subtitle = p.subtitle || ''; if (!x.body) x.body = p.dedication || ''; } }); }
      if (t.hasAttribute('data-spc')) return change(function () { pg.spacing = t.getAttribute('data-spc'); });
      if (t.hasAttribute('data-allspc')) return change(function () { p.pages.forEach(function (x) { x.spacing = t.getAttribute('data-allspc'); }); });
      if (t.hasAttribute('data-pbg')) return change(function () { pg.bg = t.getAttribute('data-pbg'); });
      if (t.hasAttribute('data-pink')) return change(function () { pg.ink = t.getAttribute('data-pink'); });
      if (t.hasAttribute('data-orn')) return change(function () { pg.ornament = t.getAttribute('data-orn'); });
      if (t.hasAttribute('data-pa')) return pageAction(t.getAttribute('data-pa'));
      if (t.hasAttribute('data-look')) return change(function () { p.templateId = t.getAttribute('data-look'); p.theme = {}; if (p.cover) { ['bg', 'ink', 'style', 'art', 'titleFont', 'upper'].forEach(function (k) { delete p.cover[k]; }); } p.pages.forEach(function (x) { delete x.bg; delete x.ink; }); });
      if (t.hasAttribute('data-cbg')) return change(function () { p.cover = p.cover || {}; p.cover.bg = t.getAttribute('data-cbg'); });
      if (t.hasAttribute('data-cink')) return change(function () { p.cover.ink = t.getAttribute('data-cink'); });
      if (t.hasAttribute('data-tpage')) return change(function () { p.theme = p.theme || {}; p.theme.page = t.getAttribute('data-tpage'); p.pages.forEach(function (x) { if (x.layout !== 'section') delete x.bg; }); });
      if (t.hasAttribute('data-cstyle')) return change(function () { p.cover = p.cover || {}; p.cover.style = t.getAttribute('data-cstyle'); var need = E.COVER_STYLES.filter(function (s) { return s.id === p.cover.style; })[0].photo; if (need && (!p.cover.photo || !p.cover.photo.photo)) { var l = A.orderedPhotos(); if (l[0]) p.cover.photo = { photo: l[0].id, zoom: 1, fx: 0.5, fy: 0.45 }; } });
      if (t.hasAttribute('data-art')) return change(function () { var k = t.getAttribute('data-art'); p.cover.art = k === 'none' ? null : k; });
      if (t.hasAttribute('data-cal')) return change(function () { p.cover.align = t.getAttribute('data-cal'); });
      if (t.hasAttribute('data-cup')) return change(function () { var th = E.theme(p.templateId); p.cover.upper = !(p.cover.upper != null ? p.cover.upper : th.cover.upper); });
      if (t.hasAttribute('data-bstyle')) return change(function () { p.cover.back = p.cover.back || {}; p.cover.back.style = t.getAttribute('data-bstyle'); if (p.cover.back.style === 'photo' && (!p.cover.back.photo || !p.cover.back.photo.photo)) { var l = A.orderedPhotos(); if (l[1] || l[0]) p.cover.back.photo = { photo: (l[1] || l[0]).id }; } });
      if (t.hasAttribute('data-fmt')) return change(function () { p.formatId = t.getAttribute('data-fmt'); var f = A.fmt(); var n = E.evenPages(CFG, f, p.pages.length); while (p.pages.length < n) p.pages.push({ id: A.uid('pg'), layout: 'blank', slots: [], texts: {} }); layoutThumbs = {}; });
      if (t.hasAttribute('data-pc')) return pageCount(+t.getAttribute('data-pc'));
      if (t.hasAttribute('data-bind')) return change(function () { p.binding = t.getAttribute('data-bind'); });
      if (t.hasAttribute('data-paper')) return change(function () { p.paper = t.getAttribute('data-paper'); });
      if (t.hasAttribute('data-sa')) return change(function () { textStyleOver(parseW(ed.sel.w), ed.sel.key, true).align = t.getAttribute('data-sa'); });
      if (t.hasAttribute('data-sc')) return change(function () { textStyleOver(parseW(ed.sel.w), ed.sel.key, true).color = t.getAttribute('data-sc'); });
      if (t.hasAttribute('data-e')) return editAction(t.getAttribute('data-e'));
      if (t.hasAttribute('data-focus')) {
        var rc = t.getBoundingClientRect(), fx = Math.max(0, Math.min(1, (e.clientX - rc.left) / rc.width)), fy = Math.max(0, Math.min(1, (e.clientY - rc.top) / rc.height));
        return change(function () { var o = slotObj(parseW(ed.sel.w), ed.sel.i); o.fx = fx; o.fy = fy; });
      }
    });
    // click on page background selects that page (for the Layout tab)
    canvas.addEventListener('click', function (e) {
      if (e.target.closest('.hs')) return;
      var pgEl = e.target.closest('[data-pg]'); if (!pgEl) return;
      var v = parseW(pgEl.getAttribute('data-pg'));
      ed.sel = null;
      if (v.kind === 'page') { ed.page = v.i; ed.tab = 'layout'; } else ed.tab = 'cover';
      all();
    });
    app.addEventListener('input', function (e) {
      var t = e.target;
      if (t.hasAttribute('data-tx')) { var v = parseW(ed.sel.w), k = ed.sel.key; liveText(function () { setText(v, k, t.value); }, ed.sel.w); }
      else if (t.hasAttribute('data-ct')) { var key = t.getAttribute('data-ct'); liveText(function () { p.cover = p.cover || {}; p.cover[key] = t.value; }, 'front'); }
      else if (t.hasAttribute('data-btext')) liveText(function () { p.cover.back = p.cover.back || {}; p.cover.back.text = t.value; }, 'back');
      else if (t.hasAttribute('data-spine')) liveText(function () { p.cover.spine = p.cover.spine || {}; p.cover.spine.text = t.value; }, 'spine');
      else if (t.hasAttribute('data-bk')) { var bk = t.getAttribute('data-bk'); liveText(function () { var old = p[bk]; p[bk] = t.value; p.pages.forEach(function (pg) { if (pg.layout === 'title-page') { var m = { title: 'title', subtitle: 'subtitle', dedication: 'body' }[bk]; pg.texts = pg.texts || {}; if ((pg.texts[m] || '') === (old || '')) pg.texts[m] = t.value; } }); if (bk === 'title' && (!p.name || p.name === 'Untitled photo book' || p.name === old)) p.name = t.value || 'Untitled photo book'; }, null); }
      else if (t.hasAttribute('data-name')) liveText(function () { p.name = t.value; }, null);
      else if (t.hasAttribute('data-zoom')) live(function () { slotObj(parseW(ed.sel.w), ed.sel.i).zoom = +t.value; }, ed.sel.w);
      else if (t.hasAttribute('data-ss')) live(function () { textStyleOver(parseW(ed.sel.w), ed.sel.key, true).scale = +t.value; }, ed.sel.w);
      else if (t.hasAttribute('data-cr')) live(function () { p.cover[t.getAttribute('data-cr')] = +t.value; }, 'front');
      else if (t.hasAttribute('data-pbg-in')) live(function () { p.pages[ed.page].bg = t.value; }, 'page:' + ed.page);
      else if (t.hasAttribute('data-pink-in')) live(function () { p.pages[ed.page].ink = t.value; }, 'page:' + ed.page);
      else if (t.hasAttribute('data-cbg-in')) live(function () { p.cover = p.cover || {}; p.cover.bg = t.value; }, null);
      else if (t.hasAttribute('data-cink-in')) live(function () { p.cover.ink = t.value; }, null);
      else if (t.hasAttribute('data-tpage-in')) live(function () { p.theme = p.theme || {}; p.theme.page = t.value; }, null);
      else if (t.hasAttribute('data-sc-in')) live(function () { textStyleOver(parseW(ed.sel.w), ed.sel.key, true).color = t.value; }, ed.sel.w);
    });
    app.addEventListener('change', function (e) {
      var t = e.target;
      if (t.hasAttribute('data-tf')) change(function () { p.theme = p.theme || {}; p.theme[t.getAttribute('data-tf')] = t.value; });
      else if (t.hasAttribute('data-cf')) change(function () { p.cover = p.cover || {}; p.cover[t.getAttribute('data-cf')] = t.value; });
      else if (t.hasAttribute('data-sf')) change(function () { var o = textStyleOver(parseW(ed.sel.w), ed.sel.key, true); if (t.value) o.font = t.value; else delete o.font; });
      else if (t.hasAttribute('data-moveto') && t.value !== '') moveTo(+t.value);
      else if (t.type === 'range' || t.type === 'color' || t.tagName === 'TEXTAREA' || t.tagName === 'INPUT') { liveEnd(); }
    });
    // live edits: one undo step per gesture, quick redraw of the affected page
    var liveOn = false, liveTimer;
    function live(fn, w) { if (!liveOn) { A.snapshot(); liveOn = true; } fn(); A.save(); if (w) redrawOne(w); else drawCanvas(); clearTimeout(liveTimer); liveTimer = setTimeout(liveEnd, 1200); }
    function liveText(fn, w) { live(fn, w === null ? null : w); }
    function liveEnd() { if (!liveOn) return; liveOn = false; setTimeout(drawStrip, 400); }
    function pageAction(a) {
      var i = ed.page, pg = p.pages[i];
      if (a === 'lock') return change(function () { pg.locked = !pg.locked; });
      if (a === 'left' && i > 0) return change(function () { p.pages.splice(i - 1, 0, p.pages.splice(i, 1)[0]); }, function () { go(i - 1); });
      if (a === 'right' && i < p.pages.length - 1) return change(function () { p.pages.splice(i + 1, 0, p.pages.splice(i, 1)[0]); }, function () { go(i + 1); });
      if (a === 'add') { if (p.pages.length + 2 > A.fmt().pages.max) return A.toast('This format allows up to ' + A.fmt().pages.max + ' pages.', 'err'); return change(function () { p.pages.splice(i + 1, 0, { id: A.uid('pg'), layout: 'blank', slots: [], texts: {} }, { id: A.uid('pg'), layout: 'blank', slots: [], texts: {} }); }, function () { go(i + 1); }); }
      if (a === 'section' || a === 'message') return change(function () { p.pages.splice(i + 1, 0, { id: A.uid('pg'), layout: a === 'section' ? 'section' : 'quote', slots: [], texts: {} }); }, function () { go(i + 1); A.toast('Page added. Books need an even page count — add or remove one more page before ordering.'); });
      if (a === 'del') {
        if (p.pages.length <= 1) return;
        var has = (pg.slots || []).some(function (x) { return x && x.photo; }) || Object.keys(pg.texts || {}).some(function (k) { return pg.texts[k]; });
        var run = function () { change(function () { p.pages.splice(i, 1); }, function () { go(Math.min(i, p.pages.length - 1)); }); };
        if (!has) return run();
        return A.confirm('Delete page ' + (i + 1) + '?', 'Its photos stay in your tray. You can undo this.', 'Delete page', true).then(function (ok) { if (ok) run(); });
      }
    }
    function pageCount(d) {
      var f = A.fmt(), stp = f.pages.step || 2, n = p.pages.length + d * stp;
      if (n < f.pages.min || n > f.pages.max) return A.toast('This format allows ' + f.pages.min + '–' + f.pages.max + ' pages.', 'err');
      if (d > 0) return change(function () { for (var k = 0; k < stp; k++) p.pages.push({ id: A.uid('pg'), layout: 'blank', slots: [], texts: {} }); });
      var tail = p.pages.slice(n), busy = tail.some(function (pg) { return (pg.slots || []).some(function (x) { return x && x.photo; }); });
      var run = function () { change(function () { p.pages = p.pages.slice(0, n); if (ed.page >= n) ed.page = n - 1; if (ed.cur.kind === 'page' && ed.cur.i >= n) ed.cur.i = n - 1; }); };
      if (!busy) return run();
      A.confirm('Remove the last ' + stp + ' pages?', 'They contain photos. The photos stay in your tray; you can undo this.', 'Remove pages', true).then(function (ok) { if (ok) run(); });
    }
    function editAction(a) {
      var v = parseW(ed.sel.w), o = slotObj(v, ed.sel.i, true);
      if (a === 'replace') { ed.tab = 'photos'; ed.sheet = true; A.toast('Choose a photo for the selected frame'); return panel(); }
      if (a === 'reset') return change(function () { o.zoom = 1; o.fx = 0.5; o.fy = 0.5; });
      if (a === 'remove') return change(function () { delete o.photo; });
    }
    function moveTo(target) {
      var v = parseW(ed.sel.w), o = slotObj(v, ed.sel.i), tp = p.pages[target];
      if (!o || !o.photo) return;
      var L = E.LMAP[tp.layout] || {}, n = (L.slots || []).length, at = -1;
      for (var k = 0; k < n; k++) if (!tp.slots || !tp.slots[k] || !tp.slots[k].photo) { at = k; break; }
      if (at < 0) return A.toast('Page ' + (target + 1) + ' has no empty frame. Change its layout first.', 'err');
      change(function () { tp.slots = tp.slots || []; tp.slots[at] = { photo: o.photo, zoom: 1, fx: 0.5, fy: 0.5 }; delete o.photo; }, function () { ed.sel = null; go(target); });
    }
    function regenerate(refit) {
      A.confirm(refit ? 'Fit pages to your photos?' : 'Regenerate the layout?', (refit ? 'The page count is recalculated from your ' + A.orderedPhotos().length + ' photos and pages are rearranged. ' : 'Photos on pages you haven’t kept are arranged again with new layouts. ') + 'Kept pages and your cover stay. You can undo this.', refit ? 'Fit and arrange' : 'Regenerate').then(function (ok) {
        if (!ok) return;
        A.snapshot(); A.autoDesign({ seed: Math.floor(Math.random() * 1e6) + 1, refit: !!refit }); ed.sel = null; go(0); A.toast('New layout ready. Undo brings back the previous one.');
      });
    }
    function check() {
      var v = E.validate(CFG, p, S.photos);
      var row = function (x, err) { var w = x.where || {}; return '<li class="' + (err ? 'err' : 'wrn') + '"><span>' + esc(x.msg) + '</span>' + (w.kind ? '<button type="button" class="btn btn--sm btn--ghost" data-jump="' + (w.kind === 'page' ? w.i : 'cover') + '">Show</button>' : '') + '</li>'; };
      A.modal(v.errors.length ? 'Fix these before ordering' : (v.warnings.length ? 'Ready, with a few notes' : 'Your book looks ready'), '<ul class="issues">' + v.errors.map(function (x) { return row(x, 1); }).join('') + v.warnings.slice(0, 40).map(function (x) { return row(x); }).join('') + (!v.errors.length && !v.warnings.length ? '<li class="ok">No problems found: every frame has a photo, text fits and the page count is valid.</li>' : '') + '</ul>', [{ label: 'Close', value: false }]);
      document.getElementById('modalBody').addEventListener('click', function (e) { var j = e.target.closest('[data-jump]'); if (!j) return; document.getElementById('modal').hidden = true; var g = j.getAttribute('data-jump'); go(g === 'cover' ? 'cover' : +g); });
      A.track('check', { errors: v.errors.length });
    }

    /* ---------- drag photo (tray → frame, frame ↔ frame) ---------- */
    app.addEventListener('dragstart', function (e) {
      var t = e.target.closest('[data-ph]'); if (t) { e.dataTransfer.setData('text/x-pb-photo', t.getAttribute('data-ph')); e.dataTransfer.effectAllowed = 'copy'; return; }
      var h = e.target.closest('.hs--slot'); if (h) { e.dataTransfer.setData('text/x-pb-slot', h.getAttribute('data-w') + '|' + h.getAttribute('data-slot')); e.dataTransfer.effectAllowed = 'move'; return; }
      var pgb = e.target.closest('.st-pgbtn'); if (pgb) { e.dataTransfer.setData('text/x-pb-page', pgb.getAttribute('data-go')); e.dataTransfer.effectAllowed = 'move'; }
    });
    app.addEventListener('dragover', function (e) {
      var types = Array.prototype.slice.call(e.dataTransfer.types || []);
      if ((types.indexOf('text/x-pb-photo') >= 0 || types.indexOf('text/x-pb-slot') >= 0) && e.target.closest('.hs--slot')) { e.preventDefault(); app.querySelectorAll('.hs.over').forEach(function (x) { x.classList.remove('over'); }); e.target.closest('.hs--slot').classList.add('over'); }
      if (types.indexOf('text/x-pb-page') >= 0 && e.target.closest('.st-pgbtn')) e.preventDefault();
    });
    app.addEventListener('drop', function (e) {
      var h = e.target.closest('.hs--slot'), id = e.dataTransfer.getData('text/x-pb-photo'), from = e.dataTransfer.getData('text/x-pb-slot'), pgFrom = e.dataTransfer.getData('text/x-pb-page');
      app.querySelectorAll('.hs.over').forEach(function (x) { x.classList.remove('over'); });
      if (h && id) { e.preventDefault(); return placePhoto(h.getAttribute('data-w'), +h.getAttribute('data-slot'), id); }
      if (h && from) {
        e.preventDefault(); var f = from.split('|'), a = slotObj(parseW(f[0]), +f[1]), bw = h.getAttribute('data-w'), bi = +h.getAttribute('data-slot');
        if (f[0] === bw && +f[1] === bi) return;
        return change(function () { var b = slotObj(parseW(bw), bi, true), tmp = JSON.parse(JSON.stringify(a || {})); var src = slotObj(parseW(f[0]), +f[1], true); Object.keys(src).forEach(function (k) { delete src[k]; }); Object.assign(src, JSON.parse(JSON.stringify(b))); Object.keys(b).forEach(function (k) { delete b[k]; }); Object.assign(b, tmp); });
      }
      var tgt = e.target.closest('.st-pgbtn');
      if (tgt && pgFrom !== '') { e.preventDefault(); var fi = +pgFrom, ti = +tgt.getAttribute('data-go'); if (fi === ti) return; change(function () { p.pages.splice(ti, 0, p.pages.splice(fi, 1)[0]); }, function () { go(ti); }); }
    });

    /* ---------- pan a selected photo inside its frame ---------- */
    canvas.addEventListener('pointerdown', function (e) {
      var h = e.target.closest('.hs--slot.sel'); if (!h) return;
      var w = h.getAttribute('data-w'), i = +h.getAttribute('data-slot'), v = parseW(w), o = slotObj(v, i); if (!o || !o.photo) return;
      var r = render(v).slots[i]; if (!r || !r.img) return;
      e.preventDefault(); h.setPointerCapture(e.pointerId);
      var k = scale(), x0 = e.clientX, y0 = e.clientY, fx0 = o.fx == null ? 0.5 : o.fx, fy0 = o.fy == null ? 0.5 : o.fy, moved = false, snap = JSON.stringify(p);
      var minx = r.rect.w / 2 / r.img.w, miny = r.rect.h / 2 / r.img.h;
      ed.dragging = true;
      function mv(ev) {
        var dx = (ev.clientX - x0) / k, dy = (ev.clientY - y0) / k; if (Math.abs(dx) + Math.abs(dy) > 0.5) moved = true;
        o.fx = Math.max(minx, Math.min(1 - minx, Math.max(minx, Math.min(1 - minx, fx0)) - dx / r.img.w));
        o.fy = Math.max(miny, Math.min(1 - miny, Math.max(miny, Math.min(1 - miny, fy0)) - dy / r.img.h));
        var svgEl = canvas.querySelector('[data-pg="' + w + '"] svg'), nr = render(v), tmp = document.createElement('div');
        tmp.innerHTML = SV.svg(nr, { url: urlFor, guides: ed.guides, empty: 'editor' }); svgEl.parentNode.replaceChild(tmp.firstChild, svgEl);
      }
      function up() {
        h.removeEventListener('pointermove', mv); h.removeEventListener('pointerup', up); h.removeEventListener('pointercancel', up); ed.dragging = false;
        if (moved) { S.undo.push(snap); S.redo = []; A.save(); ed.justPanned = true; setTimeout(function () { ed.justPanned = false; }, 50); drawStrip(); panel(); }
      }
      h.addEventListener('pointermove', mv); h.addEventListener('pointerup', up); h.addEventListener('pointercancel', up);
    });

    /* ---------- keyboard & resize ---------- */
    function key(e) {
      var inField = /INPUT|TEXTAREA|SELECT/.test(document.activeElement && document.activeElement.tagName);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !inField) { e.preventDefault(); return e.shiftKey ? A.redo() : A.undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y' && !inField) { e.preventDefault(); return A.redo(); }
      if (inField || !document.getElementById('modal').hidden) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); step(1); }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); step(-1); }
      if (e.key === 'Escape') { ed.sel = null; ed.placing = null; all(); }
      if ((e.key === 'Delete' || e.key === 'Backspace') && ed.sel && ed.sel.t === 'slot') { e.preventDefault(); editAction('remove'); }
    }
    document.addEventListener('keydown', key);
    var rz; function onResize() { clearTimeout(rz); rz = setTimeout(function () { if (ed.cur.kind === 'page' && !mq.matches) { /* spread view */ } all(); }, 120); }
    window.addEventListener('resize', onResize);
    A.leave = function () { document.removeEventListener('keydown', key); window.removeEventListener('resize', onResize); };
    if (mq.matches) ed.sheet = false;
    all();
    A.track('editor_open', { pages: p.pages.length });
  };

  /* =============================== PREVIEW =============================== */
  A.views.preview = function () {
    var p = S.project;
    if (!p.pages || !p.pages.length) { location.hash = '#/p/' + p.id + '/photos'; return; }
    var n = p.pages.length, single = mq.matches;
    var seq = [[{ kind: 'front' }]];
    if (single) p.pages.forEach(function (x, i) { seq.push([{ kind: 'page', i: i }]); });
    else for (var s = 0; s <= Math.floor(n / 2); s++) { var pr = spreadPages(s, n); if (pr[0] == null && pr[1] == null) continue; seq.push(pr.map(function (i) { return i == null ? null : { kind: 'page', i: i }; })); }
    seq.push([{ kind: 'back' }]);
    var at = 0, v = E.validate(CFG, p, S.photos);
    app.innerHTML = '<section class="pv"><div class="pv-top"><div><p class="eyebrow">Preview</p><h1>' + esc(E.coverTexts(p).title || p.name) + '</h1><p class="muted">' + esc(A.fmt().name + ' · ' + A.fmt().size + ' · ' + n + ' pages') + ' · This is a free on-screen preview. The print-ready PDF is created after purchase.</p></div><div class="pv-acts"><a class="btn btn--ghost" href="#/p/' + p.id + '/design">' + I('edit') + 'Keep editing</a><a class="btn btn--p" href="#/p/' + p.id + '/order">Order ' + I('right') + '</a></div></div>' +
      '<div class="pv-stage" id="pvStage" tabindex="0" aria-label="Book preview. Use arrow keys to turn pages."><button class="pv-arrow pv-arrow--l" data-pv="-1" aria-label="Previous">' + I('left') + '</button><div class="pv-book" id="pvBook"></div><button class="pv-arrow pv-arrow--r" data-pv="1" aria-label="Next">' + I('right') + '</button></div>' +
      '<div class="pv-meta"><span id="pvAt"></span><input type="range" id="pvRange" min="0" max="' + (seq.length - 1) + '" value="0" aria-label="Turn to page"></div>' +
      (v.errors.length || v.warnings.length ? '<div class="pv-issues"><b>' + (v.errors.length ? v.errors.length + ' thing' + (v.errors.length === 1 ? '' : 's') + ' to fix before ordering' : 'Notes') + '</b><ul>' + v.errors.concat(v.warnings).slice(0, 8).map(function (x) { return '<li class="' + (v.errors.indexOf(x) >= 0 ? 'err' : 'wrn') + '">' + esc(x.msg) + '</li>'; }).join('') + '</ul></div>' : '<div class="pv-issues pv-issues--ok">' + I('check') + ' No problems found.</div>') + '</section>';
    var book = document.getElementById('pvBook'), stage = document.getElementById('pvStage');
    function draw() {
      var d = E.dims(CFG, p), cur = seq[at], cnt = cur.length, aw = stage.clientWidth - (single ? 16 : 140), ah = Math.min(window.innerHeight * 0.68, 760);
      var k = Math.min(aw / (d.W * (cnt === 1 ? 1 : 2)), ah / d.H);
      var ids = [];
      book.innerHTML = cur.map(function (v) { if (!v) return '<div class="pv-pg pv-pg--void" style="width:' + d.W * k + 'px;height:' + d.H * k + 'px"></div>'; var r = render(v); r.ops.forEach(function (o) { if (o.t === 'img') ids.push(o.id); }); return '<div class="pv-pg" style="width:' + d.W * k + 'px;height:' + d.H * k + 'px">' + SV.svg(r, { url: function (id) { return A.url(id, 'prev'); }, empty: 'editor', label: v.kind === 'page' ? 'Page ' + (v.i + 1) : v.kind === 'front' ? 'Front cover' : 'Back cover' }) + '</div>'; }).join('');
      book.className = 'pv-book' + (cnt === 2 ? ' pv-book--spread' : '');
      document.getElementById('pvAt').textContent = cur[0] && cur[0].kind === 'front' ? 'Front cover' : cur[0] && cur[0].kind === 'back' ? 'Back cover' : 'Pages ' + cur.filter(Boolean).map(function (x) { return x.i + 1; }).join('–') + ' of ' + n;
      document.getElementById('pvRange').value = at;
      var miss = ids.filter(function (id) { return !A.url(id, 'prev'); });
      if (miss.length) A.loadUrls(miss, 'prev').then(draw);
      // warm the next spread
      (seq[at + 1] || []).forEach(function (v) { if (v) idsIn(render(v)).forEach(function (id) { A.url(id, 'prev'); }); });
    }
    function turn(d) { at = Math.max(0, Math.min(seq.length - 1, at + d)); draw(); }
    app.querySelector('.pv').addEventListener('click', function (e) { var b = e.target.closest('[data-pv]'); if (b) turn(+b.getAttribute('data-pv')); });
    document.getElementById('pvRange').addEventListener('input', function () { at = +this.value; draw(); });
    function key(e) { if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && document.activeElement.id !== 'pvRange') return; if (e.key === 'ArrowRight') turn(1); if (e.key === 'ArrowLeft') turn(-1); }
    document.addEventListener('keydown', key);
    var sx = null; stage.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true }); stage.addEventListener('touchend', function (e) { if (sx == null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) turn(dx < 0 ? 1 : -1); sx = null; });
    var rz; function onR() { clearTimeout(rz); rz = setTimeout(draw, 120); } window.addEventListener('resize', onR);
    A.leave = function () { document.removeEventListener('keydown', key); window.removeEventListener('resize', onR); };
    draw();
    A.track('preview', { pages: n });
  };
})();
