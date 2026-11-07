/* ============================================================
   CIEL AFRICA PHOTO BOOKS — photo editor
   Crop (with aspect ratios), adjustments and filters, and
   background removal (U²-Net small, run in the browser) with an
   erase / restore brush. Nothing is uploaded.
   PBKPhotoEdit.open({ src, fx, rect, maskSrc, frameAr, sticker }) → Promise<result|null>
   result: { rect, ar, fx, mask: Blob|null|undefined (undefined = unchanged) }
   ============================================================ */
(function () {
  'use strict';
  var R = window.PBKR;
  var PRESETS = [
    ['Original', {}], ['B&W', { g: 1, c: 10 }], ['Noir', { g: 1, c: 45, b: -6 }], ['Sepia', { sp: 1 }], ['Vintage', { sp: 1, f: 40, w: 10, c: -10 }],
    ['Warm', { w: 35, s: 10 }], ['Cool', { w: -30 }], ['Vivid', { s: 45, c: 15 }], ['Fade', { f: 55, c: -15 }], ['Bright', { b: 18, c: 6 }]
  ];
  var SLIDERS = [['b', 'Brightness'], ['c', 'Contrast'], ['s', 'Saturation'], ['w', 'Warmth'], ['f', 'Fade']];
  var RATIOS = [['frame', 'Frame'], ['orig', 'Original'], ['1', 'Square'], ['0.8', '4:5'], ['0.75', '3:4'], ['1.333', '4:3'], ['1.778', '16:9'], ['free', 'Free']];
  var X = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  function loadImg(src) { return new Promise(function (ok, no) { var i = new Image(); i.onload = function () { ok(i); }; i.onerror = no; i.src = src; }); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ---------- background removal ---------- */
  var ortP = null, sessP = null;
  function model() {
    if (sessP) return sessP;
    ortP = ortP || new Promise(function (ok, no) {
      if (window.ort) return ok(window.ort);
      var s = document.createElement('script'); s.src = '/assets/vendor/ort/ort.wasm.min.js'; s.onload = function () { ok(window.ort); }; s.onerror = function () { no(new Error('Could not load the background tool. Check your connection.')); }; document.head.appendChild(s);
    });
    sessP = ortP.then(function (ort) {
      ort.env.wasm.wasmPaths = '/assets/vendor/ort/'; ort.env.wasm.numThreads = 1;
      return ort.InferenceSession.create('/assets/pbk/models/u2netp.onnx', { executionProviders: ['wasm'] });
    }).catch(function (e) { sessP = null; throw e; });
    return sessP;
  }
  /** returns a canvas (mw×mh) whose alpha is the foreground */
  function autoMask(im, mw, mh) {
    return model().then(function (sess) {
      var S = 320, c = document.createElement('canvas'); c.width = S; c.height = S;
      var x = c.getContext('2d'); x.drawImage(im, 0, 0, S, S);
      var d = x.getImageData(0, 0, S, S).data, n = S * S, t = new Float32Array(3 * n);
      var mean = [0.485, 0.456, 0.406], std = [0.229, 0.224, 0.225];
      for (var i = 0; i < n; i++) for (var k = 0; k < 3; k++) t[k * n + i] = (d[i * 4 + k] / 255 - mean[k]) / std[k];
      var feeds = {}; feeds[sess.inputNames[0]] = new window.ort.Tensor('float32', t, [1, 3, S, S]);
      return sess.run(feeds).then(function (out) {
        var o = out[sess.outputNames[0]].data, mn = Infinity, mx = -Infinity;
        for (var i = 0; i < n; i++) { if (o[i] < mn) mn = o[i]; if (o[i] > mx) mx = o[i]; }
        var sm = document.createElement('canvas'); sm.width = S; sm.height = S;
        var sx = sm.getContext('2d'), id = sx.createImageData(S, S);
        for (var j = 0; j < n; j++) { var a = (o[j] - mn) / (mx - mn || 1); a = clamp((a - 0.12) / 0.76, 0, 1); id.data[j * 4] = id.data[j * 4 + 1] = id.data[j * 4 + 2] = 255; id.data[j * 4 + 3] = a * 255; }
        sx.putImageData(id, 0, 0);
        var m = document.createElement('canvas'); m.width = mw; m.height = mh;
        var mx2 = m.getContext('2d'); mx2.imageSmoothingQuality = 'high'; mx2.drawImage(sm, 0, 0, mw, mh);
        return m;
      });
    });
  }

  var dlg;
  function open(o) {
    return new Promise(function (resolve) {
      loadImg(o.src).then(function (im) {
        var maskP = o.maskSrc ? loadImg(o.maskSrc).catch(function () { return null; }) : Promise.resolve(null);
        maskP.then(function (mimg) { start(im, mimg, o, resolve); });
      }).catch(function () { resolve(null); });
    });
  }

  function start(im, mimg, o, resolve) {
    var IW = im.naturalWidth, IH = im.naturalHeight, iar = IW / IH;
    var st = { tab: o.sticker ? 'bg' : 'crop', fx: Object.assign({}, o.fx || {}), ratio: o.sticker ? 'free' : 'frame', rect: o.rect ? Object.assign({}, o.rect) : null, brush: 'erase', size: 40, tol: 28, maskChanged: false, zoom: 1, vc: null, sel: null };
    var hist = [], redo = [];
    var frameAr = o.frameAr || iar;
    // mask canvas in image pixel space (max 1400 px)
    var mk = Math.min(1, 1400 / Math.max(IW, IH)), MW = Math.round(IW * mk), MH = Math.round(IH * mk);
    var mask = null;
    if (mimg) { mask = document.createElement('canvas'); mask.width = MW; mask.height = MH; mask.getContext('2d').drawImage(mimg, 0, 0, MW, MH); }
    function fitRect(ar) { // largest centred rect with the given aspect (in image pixels)
      var w = 1, h = (IW / ar) / IH; if (h > 1) { h = 1; w = (IH * ar) / IW; } return { x: (1 - w) / 2, y: (1 - h) / 2, w: w, h: h };
    }
    if (!st.rect) st.rect = o.sticker ? { x: 0, y: 0, w: 1, h: 1 } : fitRect(frameAr);
    function curAr() { return st.ratio === 'frame' ? frameAr : st.ratio === 'orig' ? iar : st.ratio === 'free' ? null : +st.ratio; }

    if (!dlg) { dlg = document.createElement('dialog'); dlg.className = 'pfx'; document.body.appendChild(dlg); }
    dlg.innerHTML = '<div class="pfx__in"><header class="pfx__h"><h3>' + (o.sticker ? 'Edit sticker' : 'Edit photo') + '</h3><div class="pfx__tabs">' +
      '<button data-tab="crop">Crop</button><button data-tab="adj">Adjust</button><button data-tab="bg">Background</button></div><div class="pfx__ur"><button data-hist="undo" aria-label="Undo" title="Undo (Ctrl+Z)" disabled>↶</button><button data-hist="redo" aria-label="Redo" title="Redo" disabled>↷</button></div><button class="pfx__x" data-x aria-label="Close">' + X + '</button></header>' +
      '<div class="pfx__body"><div class="pfx__stage" id="pfxStage"><canvas id="pfxC"></canvas><div class="pfx__crop" id="pfxCrop" hidden><i data-h="nw"></i><i data-h="ne"></i><i data-h="sw"></i><i data-h="se"></i><b></b></div><div class="pfx__crop pfx__sel" id="pfxSel" hidden><i data-h="nw"></i><i data-h="ne"></i><i data-h="sw"></i><i data-h="se"></i></div><div class="pfx__zoom" id="pfxZoom" hidden><button data-z="-" aria-label="Zoom out">−</button><output id="pfxZv">100%</output><button data-z="+" aria-label="Zoom in">+</button><button data-z="fit">Fit</button></div><div class="pfx__busy" id="pfxBusy" hidden><span></span><p>Finding the subject… the first time takes a few seconds.</p></div></div>' +
      '<aside class="pfx__side" id="pfxSide"></aside></div>' +
      '<footer class="pfx__f"><button class="pfx__link pfx__reset" data-resetall>Start over</button><button class="btn btn--ghost" data-x>Cancel</button><button class="btn btn--p" data-ok>Apply</button></footer></div>';
    var cv = dlg.querySelector('#pfxC'), g = cv.getContext('2d'), stage = dlg.querySelector('#pfxStage'), side = dlg.querySelector('#pfxSide'), box = dlg.querySelector('#pfxCrop'), selBox = dlg.querySelector('#pfxSel'), zoomBox = dlg.querySelector('#pfxZoom');
    /* ---- one history for everything in this editor: crop, filters, background ---- */
    function snapshot() { return { fx: Object.assign({}, st.fx), rect: Object.assign({}, st.rect), ratio: st.ratio, mask: mask ? mask.getContext('2d').getImageData(0, 0, MW, MH) : null, maskChanged: st.maskChanged }; }
    function push() { hist.push(snapshot()); if (hist.length > 10) hist.shift(); redo = []; ur(); }
    function back(from, to) { var x = from.pop(); if (!x) return; to.push(snapshot()); st.fx = x.fx; st.rect = x.rect; st.ratio = x.ratio; st.maskChanged = true; if (x.mask) { if (!mask) { mask = document.createElement('canvas'); mask.width = MW; mask.height = MH; } mask.getContext('2d').putImageData(x.mask, 0, 0); } else mask = null; fxCache.key = null; ur(); sideUI(); }
    function ur() { var u = dlg.querySelector('[data-hist="undo"]'), r0 = dlg.querySelector('[data-hist="redo"]'); if (u) u.disabled = !hist.length; if (r0) r0.disabled = !redo.length; }
    var view = { k: 1, ox: 0, oy: 0, w: 0, h: 0 };
    // preview source (max 1400 px) for fast filtering
    var pk = Math.min(1, 1400 / Math.max(IW, IH)), P = document.createElement('canvas'); P.width = Math.round(IW * pk); P.height = Math.round(IH * pk); P.getContext('2d').drawImage(im, 0, 0, P.width, P.height);
    var fxCache = { key: null, c: null };
    function filtered() {
      var key = JSON.stringify(st.fx); if (fxCache.key === key) return fxCache.c;
      var c = document.createElement('canvas'); c.width = P.width; c.height = P.height; var x = c.getContext('2d'); x.drawImage(P, 0, 0);
      if (R.hasFx(st.fx)) { var id = x.getImageData(0, 0, c.width, c.height); R.applyFx(id.data, st.fx); x.putImageData(id, 0, 0); }
      fxCache = { key: key, c: c }; return c;
    }
    /** the part of the photo on screen: the crop, or a zoomed-in piece of it */
    function vis() {
      var r = st.rect, z = st.tab === 'crop' ? 1 : st.zoom || 1; if (z <= 1) { st.vc = null; return r; }
      var w = r.w / z, h = r.h / z, c = st.vc || { x: r.x + r.w / 2, y: r.y + r.h / 2 };
      var x = clamp(c.x - w / 2, r.x, r.x + r.w - w), y = clamp(c.y - h / 2, r.y, r.y + r.h - h); st.vc = { x: x + w / 2, y: y + h / 2 };
      return { x: x, y: y, w: w, h: h };
    }
    function setZoom(z, cx, cy) {
      var r = st.rect, before = vis(); z = clamp(z, 1, 8);
      if (cx != null) { var px = before.x + cx * before.w, py = before.y + cy * before.h; st.zoom = z; var w = r.w / z, h = r.h / z; st.vc = { x: px - (cx - 0.5) * w, y: py - (cy - 0.5) * h }; }
      else st.zoom = z;
      var zv = dlg.querySelector('#pfxZv'); if (zv) zv.textContent = Math.round(st.zoom * 100) + '%';
      paint();
    }
    function layout() {
      var dpr = Math.min(2, window.devicePixelRatio || 1), aw = stage.clientWidth - 24, ah = stage.clientHeight - 24;
      var showAr = st.tab === 'crop' ? iar : (st.rect.w * IW) / (st.rect.h * IH);
      var w = Math.min(aw, ah * showAr), h = w / showAr;
      cv.style.width = w + 'px'; cv.style.height = h + 'px'; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      view = { w: w, h: h, dpr: dpr, left: (stage.clientWidth - w) / 2, top: (stage.clientHeight - h) / 2 };
      zoomBox.hidden = st.tab === 'crop'; if (st.tab === 'crop') st.zoom = 1;
      paint();
    }
    function checker(x, w, h, s) { x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.fillStyle = '#e8e3da'; for (var yy = 0; yy < h; yy += s) for (var xx = (yy / s) % 2 ? s : 0; xx < w; xx += 2 * s) x.fillRect(xx, yy, s, s); }
    function paint() {
      var W = cv.width, H = cv.height, src = filtered();
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
      if (st.tab === 'crop') {
        g.drawImage(src, 0, 0, W, H);
        g.fillStyle = 'rgba(20,16,12,.55)'; var r = st.rect;
        g.fillRect(0, 0, W, r.y * H); g.fillRect(0, (r.y + r.h) * H, W, H - (r.y + r.h) * H); g.fillRect(0, r.y * H, r.x * W, r.h * H); g.fillRect((r.x + r.w) * W, r.y * H, W - (r.x + r.w) * W, r.h * H);
        box.hidden = false; box.style.left = view.left + r.x * view.w + 'px'; box.style.top = view.top + r.y * view.h + 'px'; box.style.width = r.w * view.w + 'px'; box.style.height = r.h * view.h + 'px';
      } else {
        box.hidden = true;
        var r2 = vis(), sx = r2.x * src.width, sy = r2.y * src.height, sw = r2.w * src.width, sh = r2.h * src.height;
        if (mask || st.tab === 'bg') checker(g, W, H, 14 * view.dpr);
        if (mask) {
          var t = document.createElement('canvas'); t.width = src.width; t.height = src.height; var tx = t.getContext('2d'); tx.drawImage(src, 0, 0);
          tx.globalCompositeOperation = 'destination-in'; tx.drawImage(mask, 0, 0, t.width, t.height);
          g.drawImage(t, sx, sy, sw, sh, 0, 0, W, H);
        } else g.drawImage(src, sx, sy, sw, sh, 0, 0, W, H);
      }
      placeSelBox();
    }
    function placeSelBox() {
      if (!st.sel || st.tab !== 'bg') { selBox.hidden = true; return; }
      var v = vis(), s0 = st.sel, l = view.left + (s0.x - v.x) / v.w * view.w, t = view.top + (s0.y - v.y) / v.h * view.h;
      selBox.hidden = false; selBox.style.left = l + 'px'; selBox.style.top = t + 'px'; selBox.style.width = s0.w / v.w * view.w + 'px'; selBox.style.height = s0.h / v.h * view.h + 'px';
    }
    function sideUI() {
      dlg.querySelectorAll('[data-tab]').forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-tab') === st.tab); });
      var h = '';
      if (st.tab === 'crop') {
        h = '<h4>Shape</h4><div class="pfx__chips">' + RATIOS.map(function (r) { return '<button data-ratio="' + r[0] + '"' + (st.ratio === r[0] ? ' class="is-on"' : '') + '>' + r[1] + '</button>'; }).join('') + '</div>' +
          '<p class="pfx__note">Drag the box to choose what shows; drag its corners to crop tighter. The photo frame on the page takes this shape.</p><button class="pfx__link" data-act="rcrop">Reset crop</button>';
      } else if (st.tab === 'adj') {
        h = '<h4>Filters</h4><div class="pfx__pre" id="pfxPre">' + PRESETS.map(function (p, i) { return '<button data-pre="' + i + '"><canvas width="84" height="84"></canvas><span>' + p[0] + '</span></button>'; }).join('') + '</div>' +
          '<h4>Adjust</h4>' + SLIDERS.map(function (s) { return '<label class="pfx__sl"><span>' + s[1] + '<output>' + (st.fx[s[0]] || 0) + '</output></span><input type="range" min="-100" max="100" value="' + (st.fx[s[0]] || 0) + '" data-fx="' + s[0] + '"></label>'; }).join('') +
          '<div class="pfx__chips"><button data-tog="g"' + (st.fx.g ? ' class="is-on"' : '') + '>Black &amp; white</button><button data-tog="sp"' + (st.fx.sp ? ' class="is-on"' : '') + '>Sepia</button></div><button class="pfx__link" data-act="rfx">Reset adjustments</button>';
      } else {
        h = '<h4>Remove background</h4><button class="btn btn--p pfx__auto" data-act="auto">✨ Remove background</button><p class="pfx__note">Works best when the subject stands out: a person, a pet, an object. Then tidy the edges with the brush.</p>' +
          '<h4>Tools</h4><div class="pfx__chips"><button data-brush="erase"' + (st.brush === 'erase' ? ' class="is-on"' : '') + '>Erase brush</button><button data-brush="restore"' + (st.brush === 'restore' ? ' class="is-on"' : '') + '>Restore brush</button><button data-brush="magic"' + (st.brush === 'magic' ? ' class="is-on"' : '') + '>Tap to remove</button><button data-brush="rect"' + (st.brush === 'rect' ? ' class="is-on"' : '') + '>Box</button><button data-brush="move"' + (st.brush === 'move' ? ' class="is-on"' : '') + '>Move view</button></div>' +
          (st.brush === 'magic' ? '<label class="pfx__sl"><span>How similar<output>' + st.tol + '</output></span><input type="range" min="4" max="90" value="' + st.tol + '" data-tol></label><p class="pfx__note">Tap the background: the area of that colour around where you tap disappears. Tap again for more; lower “How similar” if it takes too much.</p>'
            : st.brush === 'rect' ? (st.sel ? '<p class="pfx__note">Drag the box or its corners to adjust it, then:</p><div class="pfx__row"><button class="btn btn--p btn--sm" data-act="selin">Erase inside</button><button class="btn btn--ghost btn--sm" data-act="selout">Keep only inside</button><button class="btn btn--ghost btn--sm" data-act="selrest">Restore inside</button><button class="pfx__link" data-act="selx">Cancel</button></div>' : '<p class="pfx__note">Drag on the photo to draw a box around what you want to erase (or keep).</p>')
            : st.brush === 'move' ? '<p class="pfx__note">Drag to move around the zoomed photo. Zoom with + and −, the mouse wheel, or two fingers.</p>'
            : '<label class="pfx__sl"><span>Brush size<output>' + st.size + '</output></span><input type="range" min="4" max="160" value="' + st.size + '" data-size></label><p class="pfx__note">Paint on the photo to erase or bring parts back. Zoom in for small details.</p>') +
          '<div class="pfx__row"><button class="btn btn--ghost btn--sm" data-act="rmask">Restore all</button></div>';
      }
      side.innerHTML = h;
      if (st.tab === 'adj') {
        var thumbs = side.querySelectorAll('#pfxPre canvas'), t = document.createElement('canvas'), tw = 84; t.width = tw; t.height = tw;
        var tx = t.getContext('2d'), s0 = Math.min(P.width, P.height); tx.drawImage(P, (P.width - s0) / 2, (P.height - s0) / 2, s0, s0, 0, 0, tw, tw);
        var base = tx.getImageData(0, 0, tw, tw);
        thumbs.forEach(function (c, i) { var d = new ImageData(new Uint8ClampedArray(base.data), tw, tw); R.applyFx(d.data, PRESETS[i][1]); c.getContext('2d').putImageData(d, 0, 0); });
      }
      layout();
    }
    // ---- crop interactions ----
    var drag = null;
    box.addEventListener('pointerdown', function (e) {
      var h = e.target.getAttribute('data-h'); push(); drag = { h: h, x: e.clientX, y: e.clientY, r: Object.assign({}, st.rect) };
      box.setPointerCapture(e.pointerId); e.preventDefault();
    });
    box.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var dx = (e.clientX - drag.x) / view.w, dy = (e.clientY - drag.y) / view.h, r = drag.r, n = Object.assign({}, r), ar = curAr();
      if (!drag.h) { n.x = clamp(r.x + dx, 0, 1 - r.w); n.y = clamp(r.y + dy, 0, 1 - r.h); }
      else {
        var west = drag.h.indexOf('w') >= 0, north = drag.h.indexOf('n') >= 0;
        var ax = west ? r.x + r.w : r.x, ay = north ? r.y + r.h : r.y;
        var w = clamp(west ? r.w - dx : r.w + dx, 0.06, west ? ax : 1 - ax), hh = clamp(north ? r.h - dy : r.h + dy, 0.06, north ? ay : 1 - ay);
        if (ar) { var hFromW = (w * IW / ar) / IH; if (hFromW <= (north ? ay : 1 - ay)) hh = hFromW; else { hh = north ? ay : 1 - ay; w = (hh * IH * ar) / IW; } }
        n.w = w; n.h = hh; n.x = west ? ax - w : ax; n.y = north ? ay - hh : ay;
      }
      st.rect = n; paint();
    });
    box.addEventListener('pointerup', function () { drag = null; });
    // ---- brush ----
    var painting = null;
    function brushAt(e) {
      var r = cv.getBoundingClientRect(), u = (e.clientX - r.left) / r.width, v = (e.clientY - r.top) / r.height, vv = vis();
      var mx = (vv.x + u * vv.w) * MW, my = (vv.y + v * vv.h) * MH, rad = st.size / 2 * (vv.w * MW / r.width);
      var x = mask.getContext('2d'), grd = x.createRadialGradient(mx, my, rad * 0.55, mx, my, rad);
      grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
      x.globalCompositeOperation = st.brush === 'erase' ? 'destination-out' : 'source-over'; x.fillStyle = grd;
      if (painting.last) { var lx = painting.last[0], ly = painting.last[1], dist = Math.hypot(mx - lx, my - ly), steps = Math.max(1, Math.ceil(dist / (rad * 0.3))); for (var i = 1; i <= steps; i++) { var px = lx + (mx - lx) * i / steps, py = ly + (my - ly) * i / steps; var g2 = x.createRadialGradient(px, py, rad * 0.55, px, py, rad); g2.addColorStop(0, 'rgba(255,255,255,1)'); g2.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g2; x.beginPath(); x.arc(px, py, rad, 0, 7); x.fill(); } }
      else { x.beginPath(); x.arc(mx, my, rad, 0, 7); x.fill(); }
      x.globalCompositeOperation = 'source-over'; painting.last = [mx, my];
    }
    function ensureMask() { if (!mask) { mask = document.createElement('canvas'); mask.width = MW; mask.height = MH; var mx = mask.getContext('2d'); mx.fillStyle = '#fff'; mx.fillRect(0, 0, MW, MH); } }
    function at(e) { var r = cv.getBoundingClientRect(), vv = vis(); return { u: (e.clientX - r.left) / r.width, v: (e.clientY - r.top) / r.height, x: vv.x + (e.clientX - r.left) / r.width * vv.w, y: vv.y + (e.clientY - r.top) / r.height * vv.h }; }
    var pts = {}, pinch = null, pan = null, boxing = null;
    cv.addEventListener('pointerdown', function (e) {
      if (st.tab === 'crop') return;
      pts[e.pointerId] = { x: e.clientX, y: e.clientY }; cv.setPointerCapture(e.pointerId); e.preventDefault();
      var ids = Object.keys(pts);
      if (ids.length === 2) { /* two fingers: zoom and move */ if (painting) { var u0 = hist.pop(); if (u0) back([u0], []); painting = null; } var a = pts[ids[0]], b = pts[ids[1]], r = cv.getBoundingClientRect(); pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: st.zoom, cx: ((a.x + b.x) / 2 - r.left) / r.width, cy: ((a.y + b.y) / 2 - r.top) / r.height, vc: Object.assign({}, st.vc || {}) }; return; }
      if (st.tab !== 'bg') { if (st.zoom > 1) pan = { x: e.clientX, y: e.clientY, vc: Object.assign({}, st.vc) }; return; }
      if (st.brush === 'move') { pan = { x: e.clientX, y: e.clientY, vc: Object.assign({}, st.vc || {}) }; return; }
      if (st.brush === 'magic') { push(); ensureMask(); var p = at(e); magic(p.x, p.y, st.brush); st.maskChanged = true; paint(); return; }
      if (st.brush === 'rect') { var p2 = at(e); boxing = { x0: p2.x, y0: p2.y }; st.sel = { x: p2.x, y: p2.y, w: 0, h: 0 }; return; }
      push(); ensureMask();
      painting = { last: null }; st.maskChanged = true; brushAt(e); paint();
    });
    cv.addEventListener('pointermove', function (e) {
      if (pts[e.pointerId]) pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      if (pinch) { var ids = Object.keys(pts); if (ids.length < 2) return; var a = pts[ids[0]], b = pts[ids[1]], d = Math.hypot(a.x - b.x, a.y - b.y); setZoom(pinch.z * d / (pinch.d || 1), pinch.cx, pinch.cy); return; }
      if (pan) { var r = cv.getBoundingClientRect(), vv = vis(); st.vc = { x: pan.vc.x - (e.clientX - pan.x) / r.width * vv.w, y: pan.vc.y - (e.clientY - pan.y) / r.height * vv.h }; paint(); return; }
      if (boxing) { var p = at(e); st.sel = { x: Math.min(boxing.x0, p.x), y: Math.min(boxing.y0, p.y), w: Math.abs(p.x - boxing.x0), h: Math.abs(p.y - boxing.y0) }; placeSelBox(); return; }
      if (painting) { brushAt(e); paint(); }
    });
    function up(e) { delete pts[e.pointerId]; if (Object.keys(pts).length < 2) pinch = null; pan = null; painting = null; if (boxing) { boxing = null; if (!st.sel || st.sel.w < 0.01 || st.sel.h < 0.01) st.sel = null; sideUI(); } }
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    stage.addEventListener('wheel', function (e) { if (st.tab === 'crop') return; e.preventDefault(); var r = cv.getBoundingClientRect(); setZoom(st.zoom * (e.deltaY < 0 ? 1.12 : 0.89), clamp((e.clientX - r.left) / r.width, 0, 1), clamp((e.clientY - r.top) / r.height, 0, 1)); }, { passive: false });
    zoomBox.addEventListener('click', function (e) { var b = e.target.closest('[data-z]'); if (!b) return; var z = b.getAttribute('data-z'); setZoom(z === 'fit' ? 1 : st.zoom * (z === '+' ? 1.5 : 1 / 1.5)); });
    /* the box: move it or drag its corners before applying */
    var sdrag = null;
    selBox.addEventListener('pointerdown', function (e) { var h = e.target.getAttribute('data-h'); sdrag = { h: h, x: e.clientX, y: e.clientY, s: Object.assign({}, st.sel) }; selBox.setPointerCapture(e.pointerId); e.preventDefault(); e.stopPropagation(); });
    selBox.addEventListener('pointermove', function (e) {
      if (!sdrag) return; var r = cv.getBoundingClientRect(), vv = vis(), dx = (e.clientX - sdrag.x) / r.width * vv.w, dy = (e.clientY - sdrag.y) / r.height * vv.h, s0 = sdrag.s, n = Object.assign({}, s0);
      if (!sdrag.h) { n.x = s0.x + dx; n.y = s0.y + dy; } else { if (sdrag.h.indexOf('w') >= 0) { n.x = s0.x + dx; n.w = s0.w - dx; } else n.w = s0.w + dx; if (sdrag.h.indexOf('n') >= 0) { n.y = s0.y + dy; n.h = s0.h - dy; } else n.h = s0.h + dy; }
      if (n.w > 0.01 && n.h > 0.01) { st.sel = n; placeSelBox(); }
    });
    selBox.addEventListener('pointerup', function () { sdrag = null; });
    function selApply(mode) {
      var s0 = st.sel; if (!s0) return; push(); ensureMask(); var x = mask.getContext('2d'), rx = s0.x * MW, ry = s0.y * MH, rw = s0.w * MW, rh = s0.h * MH;
      if (mode === 'in') x.clearRect(rx, ry, rw, rh);
      else if (mode === 'rest') { x.fillStyle = '#fff'; x.fillRect(rx, ry, rw, rh); }
      else { var keep = x.getImageData(rx, ry, Math.max(1, rw), Math.max(1, rh)); x.clearRect(0, 0, MW, MH); x.putImageData(keep, rx, ry); }
      st.sel = null; st.maskChanged = true; sideUI();
    }
    /* tap to remove: the area of similar colour connected to where you tapped */
    var px = null;
    function magic(fx0, fy0) {
      if (!px) { var c = document.createElement('canvas'); c.width = MW; c.height = MH; c.getContext('2d').drawImage(P, 0, 0, MW, MH); px = c.getContext('2d').getImageData(0, 0, MW, MH).data; }
      var sx = Math.floor(clamp(fx0, 0, 0.9999) * MW), sy = Math.floor(clamp(fy0, 0, 0.9999) * MH), i0 = (sy * MW + sx) * 4, R0 = px[i0], G0 = px[i0 + 1], B0 = px[i0 + 2], tol = st.tol * 2.2, tol2 = tol * tol;
      var md = mask.getContext('2d').getImageData(0, 0, MW, MH), m = md.data, seen = new Uint8Array(MW * MH), stack = [sx, sy], n = 0;
      while (stack.length) {
        var y = stack.pop(), x0 = stack.pop(), xl = x0, xr = x0, k;
        function ok(xx, yy) { var j = yy * MW + xx; if (seen[j]) return false; var q = j * 4, dr = px[q] - R0, dg = px[q + 1] - G0, db = px[q + 2] - B0; return dr * dr + dg * dg + db * db <= tol2; }
        if (!ok(x0, y)) continue;
        while (xl > 0 && ok(xl - 1, y)) xl--;
        while (xr < MW - 1 && ok(xr + 1, y)) xr++;
        for (k = xl; k <= xr; k++) { var j2 = y * MW + k; seen[j2] = 1; m[j2 * 4 + 3] = 0; n++; if (y > 0 && !seen[j2 - MW]) stack.push(k, y - 1); if (y < MH - 1 && !seen[j2 + MW]) stack.push(k, y + 1); }
      }
      mask.getContext('2d').putImageData(md, 0, 0);
      /* soften the cut edge a little */
      var sm = document.createElement('canvas'); sm.width = MW; sm.height = MH; var sx2 = sm.getContext('2d'); sx2.filter = 'blur(1px)'; sx2.drawImage(mask, 0, 0); var mx3 = mask.getContext('2d'); mx3.clearRect(0, 0, MW, MH); mx3.drawImage(sm, 0, 0);
      return n;
    }
    // ---- side panel ----
    side.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-ratio') || b.hasAttribute('data-pre') || b.hasAttribute('data-tog') || /^(rcrop|rfx|rmask|auto|selin|selout|selrest)$/.test(b.getAttribute('data-act') || '')) { if (!/^sel/.test(b.getAttribute('data-act') || '')) push(); }
      if (b.hasAttribute('data-ratio')) {
        st.ratio = b.getAttribute('data-ratio'); var ar = curAr();
        if (ar) { var c = { x: st.rect.x + st.rect.w / 2, y: st.rect.y + st.rect.h / 2 }, f = fitRect(ar), s = Math.min(1, Math.max(st.rect.w / f.w, st.rect.h / f.h)); st.rect = { w: f.w * s, h: f.h * s }; st.rect.x = clamp(c.x - st.rect.w / 2, 0, 1 - st.rect.w); st.rect.y = clamp(c.y - st.rect.h / 2, 0, 1 - st.rect.h); }
        sideUI(); return;
      }
      if (b.hasAttribute('data-pre')) { st.fx = Object.assign({}, PRESETS[+b.getAttribute('data-pre')][1]); sideUI(); return; }
      if (b.hasAttribute('data-tog')) { var k = b.getAttribute('data-tog'); st.fx[k] = st.fx[k] ? 0 : 1; if (k === 'g' && st.fx.g) st.fx.sp = 0; if (k === 'sp' && st.fx.sp) st.fx.g = 0; sideUI(); return; }
      if (b.hasAttribute('data-brush')) { st.brush = b.getAttribute('data-brush'); if (st.brush !== 'rect') st.sel = null; sideUI(); return; }
      var a = b.getAttribute('data-act');
      if (a === 'rcrop') { st.ratio = 'frame'; st.rect = fitRect(frameAr); sideUI(); }
      else if (a === 'rfx') { st.fx = {}; sideUI(); }
      else if (a === 'rmask') { mask = null; st.maskChanged = true; paint(); }
      else if (a === 'selin') selApply('in'); else if (a === 'selout') selApply('out'); else if (a === 'selrest') selApply('rest'); else if (a === 'selx') { st.sel = null; sideUI(); }
      else if (a === 'auto') {
        var busy = dlg.querySelector('#pfxBusy'); busy.hidden = false; b.disabled = true;
        autoMask(im, MW, MH).then(function (m) { mask = m; st.maskChanged = true; paint(); })
          .catch(function (er) { alert(er && er.message || 'The background could not be removed on this device.'); })
          .then(function () { busy.hidden = true; b.disabled = false; });
      }
    });
    side.addEventListener('input', function (e) {
      var t = e.target;
      if (t.hasAttribute('data-tol')) { st.tol = +t.value; t.parentNode.querySelector('output').textContent = t.value; }
      if (t.hasAttribute('data-fx')) { if (!t._h) { push(); t._h = 1; } st.fx[t.getAttribute('data-fx')] = +t.value; t.parentNode.querySelector('output').textContent = t.value; clearTimeout(st.ft); st.ft = setTimeout(paint, 30); }
      if (t.hasAttribute('data-size')) { st.size = +t.value; t.parentNode.querySelector('output').textContent = t.value; }
    });
    side.addEventListener('change', function (e) { e.target._h = 0; });
    dlg.querySelector('.pfx__tabs').onclick = function (e) { var b = e.target.closest('[data-tab]'); if (b) { st.tab = b.getAttribute('data-tab'); sideUI(); } };
    function finish(res) { window.removeEventListener('resize', layout); dlg.close(); resolve(res); }
    dlg.onclick = function (e) {
      if (e.target.closest('[data-x]')) return finish(null);
      var hb = e.target.closest('[data-hist]'); if (hb) { if (hb.getAttribute('data-hist') === 'undo') back(hist, redo); else back(redo, hist); return; }
      if (e.target.closest('[data-resetall]')) { push(); st.zoom = 1; st.sel = null; st.fx = {}; st.ratio = o.sticker ? 'orig' : 'frame'; st.rect = o.sticker ? { x: 0, y: 0, w: 1, h: 1 } : fitRect(o.frameAr || iar); if (mask) { mask = null; st.maskChanged = true; } sideUI(); return; }
      if (e.target.closest('[data-ok]')) {
        var r = st.rect, ar = (r.w * IW) / (r.h * IH), res = { rect: (r.x || r.y || r.w < 1 || r.h < 1) ? r : null, ar: ar, fx: R.hasFx(st.fx) ? st.fx : null };
        if (!st.maskChanged) return finish(res);
        if (!mask) { res.mask = null; return finish(res); }
        mask.toBlob(function (bl) { res.mask = bl; finish(res); }, 'image/png');
      }
    };
    dlg.oncancel = function (e) { e.preventDefault(); finish(null); };
    dlg.onkeydown = function (e) { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) back(redo, hist); else back(hist, redo); } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); back(redo, hist); } };
    window.addEventListener('resize', layout);
    dlg.showModal(); sideUI();
  }
  window.PBKPhotoEdit = { open: open };
})();
