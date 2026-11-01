/* ============================================================
   CIEL AFRICA PHOTO BOOKS — page & cover renderer
   One renderer for everything: editor canvas, thumbnails,
   the book preview, mockups and the print file. A cover or page
   is a small document in a 1200 × 1600 space (21 × 28 cm portrait).
   ============================================================ */
(function (root) {
  'use strict';
  var W = 1200, H = 1600, HINGE = 100;
  /* The CIEL AFRICA mark: fixed position, size and tracking on every cover. */
  var BRAND = { text: 'CIEL AFRICA', size: 27, track: 0.24, y: 1496, x: 600, font: '500 {s}px "PBK Mont", "Montserrat", sans-serif' };

  var FONTS = {
    spartan: { css: '"PBK Spartan", "League Spartan", sans-serif', w: 800, name: 'Bold Sans' },
    sans: { css: '"PBK Mont", "Montserrat", sans-serif', w: 600, name: 'Clean Sans' },
    serif: { css: '"PBK Serif", Georgia, serif', w: 400, name: 'Serif' },
    serifi: { css: '"PBK Serif I", Georgia, serif', w: 400, name: 'Serif Italic', italic: true },
    script: { css: '"PBK Script", cursive', w: 600, name: 'Handwritten' },
    round: { css: '"PBK Round", sans-serif', w: 400, name: 'Rounded' },
    block: { css: '"PBK Block", sans-serif', w: 400, name: 'Heavy' }
  };
  var FONT_FILES = [
    ['PBK Spartan', '/assets/fonts/pbk/spartan.woff2', { weight: '100 900' }],
    ['PBK Mont', '/assets/fonts/pbk/montserrat-500.woff2', { weight: '500' }],
    ['PBK Mont', '/assets/fonts/pbk/montserrat-600.woff2', { weight: '600' }],
    ['PBK Serif', '/assets/fonts/pb/pb-dmserif.ttf', {}],
    ['PBK Serif I', '/assets/fonts/pb/pb-dmserif-i.ttf', {}],
    ['PBK Script', '/assets/fonts/pb/pb-caveat.ttf', { weight: '400 700' }],
    ['PBK Round', '/assets/fonts/pb/pb-lilita.ttf', {}],
    ['PBK Block', '/assets/fonts/pb/pb-archivo.ttf', {}]
  ];
  var fontsP = null;
  function loadFonts() {
    if (fontsP) return fontsP;
    if (!root.FontFace || !root.document) return (fontsP = Promise.resolve());
    fontsP = Promise.all(FONT_FILES.map(function (f) {
      var ff = new FontFace(f[0], 'url(' + f[1] + ')', f[2]);
      return ff.load().then(function (x) { document.fonts.add(x); }).catch(function () {});
    }));
    return fontsP;
  }

  /* ---------- image cache ---------- */
  var cache = {};
  function img(src) {
    if (!src) return Promise.resolve(null);
    if (cache[src]) return cache[src].p;
    var o = { im: null };
    o.p = new Promise(function (res) {
      var i = new Image(); i.decoding = 'async';
      if (!/^(blob:|data:)/.test(src)) i.crossOrigin = 'anonymous';
      i.onload = function () { o.im = i; res(i); };
      i.onerror = function () { res(null); };
      i.src = src;
    });
    cache[src] = o;
    return o.p;
  }
  function ready(src) { var o = cache[src]; return o && o.im; }
  function artSrc(id, tint) {
    var A = root.PBKArt; if (!A || !A.all[id]) return null;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(A.svg(id));
  }

  /* ---------- text ---------- */
  var capCache = {};
  function cap(ctx, font) {
    if (capCache[font]) return capCache[font];
    ctx.save(); ctx.font = font.replace('{s}', 100); var m = ctx.measureText('H'); ctx.restore();
    var r = (m.actualBoundingBoxAscent || 70) / 100;
    if (document.fonts && document.fonts.check && document.fonts.check(font.replace('{s}', 20))) capCache[font] = r;
    return r;
  }
  function fontStr(el, size) {
    var f = FONTS[el.font] || FONTS.spartan;
    return (f.italic ? 'italic ' : '') + (el.weight || f.w) + ' ' + size + 'px ' + f.css;
  }
  function tracked(ctx, s, ls) { if (!ls) return ctx.measureText(s).width; var w = 0; for (var i = 0; i < s.length; i++) w += ctx.measureText(s[i]).width + (i < s.length - 1 ? ls : 0); return w; }
  function drawTracked(ctx, s, x, y, ls) {
    if (!ls) { ctx.fillText(s, x, y); return; }
    for (var i = 0; i < s.length; i++) { ctx.fillText(s[i], x, y); x += ctx.measureText(s[i]).width + ls; }
  }
  /* Lays out a text element. Size is the cap height in document units for display
     styles ('fill' titles), or the font size for body text. Returns lines with positions. */
  function layoutText(ctx, el) {
    var lines = String(el.text || '').split('\n');
    var f = FONTS[el.font] || FONTS.spartan;
    var probe = fontStr(el, 100); ctx.font = probe;
    var capR = cap(ctx, probe.replace('100px', '{s}px'));
    var ls = el.ls || 0;
    var size = el.cap ? el.cap / capR : (el.size || 80); /* cap height wins when given */
    // shrink to fit the box width (never grow beyond the set size)
    var widest = 0;
    lines.forEach(function (l) { var w = tracked(ctx, l, ls * 100) ; widest = Math.max(widest, w); });
    var fit = widest > 0 ? (el.w / widest) * 100 : size;
    if (el.align === 'fill') size = Math.min(fit, size);
    else size = Math.min(size, fit);
    size = Math.max(6, size);
    var lh = (el.lh || (el.align === 'fill' ? 1.0 : 1.15)) * size;
    var capH = capR * size;
    var out = { size: size, font: fontStr(el, size), lines: [], cap: capH, lh: lh, ls: ls * size };
    ctx.font = out.font;
    lines.forEach(function (l, i) {
      var w = tracked(ctx, l, out.ls), x = el.x;
      if (el.align === 'center') x = el.x + (el.w - w) / 2;
      else if (el.align === 'right') x = el.x + el.w - w;
      out.lines.push({ t: l, x: x, y: el.y + capH + i * lh, w: w });
    });
    out.h = capH + (lines.length - 1) * lh;
    return out;
  }

  /* ---------- draw ---------- */
  function cover(ctx, im, x, y, w, h, crop) {
    var iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height;
    var z = Math.max(1, (crop && crop.z) || 1);
    var s = Math.max(w / iw, h / ih) * z;
    var dw = iw * s, dh = ih * s;
    var cx = crop && crop.cx != null ? crop.cx : 0.5, cy = crop && crop.cy != null ? crop.cy : 0.5;
    var dx = x + w / 2 - cx * dw, dy = y + h / 2 - cy * dh;
    dx = Math.min(x, Math.max(x + w - dw, dx)); dy = Math.min(y, Math.max(y + h - dh, dy));
    ctx.drawImage(im, dx, dy, dw, dh);
  }
  function rr(ctx, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  /**
   * draw(ctx, doc, opt): draws a cover/page into ctx scaled to opt.scale.
   * opt.photo(id) -> src url; opt.hide = element id to skip (editing text);
   * opt.empty: 'editor' shows grey placeholders for empty photo frames.
   */
  function draw(ctx, doc, opt) {
    opt = opt || {};
    var s = opt.scale || 1;
    ctx.save(); ctx.scale(s, s);
    ctx.fillStyle = doc.bg || '#ffffff'; ctx.fillRect(0, 0, W, H);
    if (doc.img) { var b = ready(doc.img); if (b) ctx.drawImage(b, 0, 0, W, H); }
    (doc.els || []).forEach(function (el) {
      if (opt.hide && opt.hide === el.id) return;
      ctx.save();
      if (el.rot) { var cx = el.x + el.w / 2, cy = el.y + el.h / 2; ctx.translate(cx, cy); ctx.rotate(el.rot * Math.PI / 180); ctx.translate(-cx, -cy); }
      if (el.t === 'photo') {
        var src = el.photo && opt.photo ? opt.photo(el.photo) : null, im = src && ready(src);
        if (el.border) { ctx.fillStyle = el.borderColor || '#ffffff'; rr(ctx, el.x - el.border, el.y - el.border, el.w + el.border * 2, el.h + el.border * 2, (el.r || 0) + el.border); ctx.fill(); }
        rr(ctx, el.x, el.y, el.w, el.h, el.r || 0); ctx.clip();
        if (im) cover(ctx, im, el.x, el.y, el.w, el.h, el.crop);
        else if (opt.empty === 'editor') {
          ctx.fillStyle = 'rgba(20,20,20,.06)'; ctx.fillRect(el.x, el.y, el.w, el.h);
          ctx.strokeStyle = 'rgba(20,20,20,.25)'; ctx.lineWidth = 4; ctx.setLineDash([18, 14]); ctx.strokeRect(el.x + 2, el.y + 2, el.w - 4, el.h - 4); ctx.setLineDash([]);
          ctx.fillStyle = 'rgba(20,20,20,.45)'; ctx.font = '600 44px "PBK Mont", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('+ Photo', el.x + el.w / 2, el.y + el.h / 2);
        } else if (opt.empty === 'soft') { ctx.fillStyle = 'rgba(0,0,0,.05)'; ctx.fillRect(el.x, el.y, el.w, el.h); }
      } else if (el.t === 'art') {
        var a = ready(artSrc(el.art));
        if (a) {
          if (el.flip) { ctx.translate(el.x * 2 + el.w, 0); ctx.scale(-1, 1); }
          ctx.globalAlpha = el.op == null ? 1 : el.op;
          ctx.drawImage(a, el.x, el.y, el.w, el.h);
        }
      } else if (el.t === 'img') {
        var isrc = el.src || (el.photo && opt.photo ? opt.photo(el.photo) : null), iim = isrc && ready(isrc);
        if (iim) {
          if (el.flip) { ctx.translate(el.x * 2 + el.w, 0); ctx.scale(-1, 1); }
          ctx.globalAlpha = el.op == null ? 1 : el.op;
          ctx.drawImage(iim, el.x, el.y, el.w, el.h);
        }
      } else if (el.t === 'text') {
        var L = layoutText(ctx, el);
        ctx.font = L.font; ctx.fillStyle = el.color || '#111'; ctx.textBaseline = 'alphabetic';
        if (el.shadow) { ctx.shadowColor = 'rgba(0,0,0,.2)'; ctx.shadowBlur = Math.max(2, L.cap * 0.06 * s); ctx.shadowOffsetX = L.cap * 0.02 * s; ctx.shadowOffsetY = L.cap * 0.035 * s; }
        L.lines.forEach(function (l) { drawTracked(ctx, l.t, l.x, l.y, L.ls); });
      } else if (el.t === 'shape') {
        ctx.fillStyle = el.color || '#111';
        if (el.shape === 'circle') { ctx.beginPath(); ctx.ellipse(el.x + el.w / 2, el.y + el.h / 2, el.w / 2, el.h / 2, 0, 0, Math.PI * 2); ctx.fill(); }
        else { rr(ctx, el.x, el.y, el.w, el.h, el.r || 0); ctx.fill(); }
      }
      ctx.restore();
    });
    if (doc.kind === 'cover' && !doc.ownBrand) drawBrand(ctx, doc.brand || '#ffffff');
    ctx.restore();
  }
  function drawBrand(ctx, color) {
    ctx.save();
    var font = BRAND.font.replace('{s}', BRAND.size);
    ctx.font = font; ctx.fillStyle = color; ctx.textBaseline = 'alphabetic';
    var ls = BRAND.track * BRAND.size, w = tracked(ctx, BRAND.text, ls);
    drawTracked(ctx, BRAND.text, BRAND.x - w / 2, BRAND.y, ls);
    ctx.restore();
  }

  /** Loads everything a document needs (fonts, base image, art, photos). */
  function load(doc, opt) {
    opt = opt || {};
    var list = [loadFonts(), img(doc.img)];
    (doc.els || []).forEach(function (el) {
      if (el.t === 'art') list.push(img(artSrc(el.art)));
      if (el.t === 'photo' && el.photo && opt.photo) list.push(img(opt.photo(el.photo)));
      if (el.t === 'img') list.push(img(el.src || (el.photo && opt.photo ? opt.photo(el.photo) : null)));
    });
    return Promise.all(list);
  }

  /** Renders a document to a new canvas of width px. */
  function toCanvas(doc, px, opt) {
    opt = opt || {};
    return load(doc, opt).then(function () {
      var c = document.createElement('canvas'); c.width = px; c.height = Math.round(px * H / W);
      var x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
      draw(x, doc, Object.assign({}, opt, { scale: px / W }));
      return c;
    });
  }

  /* ---------- book mockup (front view, spine on the left) ---------- */
  function mockup(ctx, src, x, y, w, h, opt) {
    opt = opt || {};
    var hinge = w * (HINGE / W);
    ctx.save();
    // soft shadow
    if (!opt.flat) { ctx.shadowColor = 'rgba(30,20,10,.28)'; ctx.shadowBlur = w * 0.05; ctx.shadowOffsetY = w * 0.025; ctx.shadowOffsetX = w * 0.012; }
    var r = w * 0.022;
    ctx.beginPath(); ctx.moveTo(x + hinge * 0.5, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + hinge * 0.5, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - hinge * 0.5); ctx.lineTo(x, y + hinge * 0.5); ctx.quadraticCurveTo(x, y, x + hinge * 0.5, y); ctx.closePath();
    ctx.fillStyle = '#ddd'; ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.clip();
    ctx.drawImage(src, x, y, w, h);
    // hinge roll shading
    var g = ctx.createLinearGradient(x, 0, x + hinge * 1.15, 0);
    g.addColorStop(0, 'rgba(0,0,0,.20)'); g.addColorStop(0.18, 'rgba(255,255,255,.22)'); g.addColorStop(0.42, 'rgba(255,255,255,.05)');
    g.addColorStop(0.7, 'rgba(0,0,0,.16)'); g.addColorStop(0.86, 'rgba(0,0,0,.05)'); g.addColorStop(0.9, 'rgba(0,0,0,.28)'); g.addColorStop(0.94, 'rgba(255,255,255,.18)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(x, y, hinge * 1.15, h);
    // edge light & right edge shade
    var g2 = ctx.createLinearGradient(x + w - w * 0.03, 0, x + w, 0); g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(0,0,0,.14)');
    ctx.fillStyle = g2; ctx.fillRect(x + w - w * 0.03, y, w * 0.03, h);
    var g3 = ctx.createLinearGradient(0, y, 0, y + h); g3.addColorStop(0, 'rgba(255,255,255,.18)'); g3.addColorStop(0.012, 'rgba(255,255,255,0)'); g3.addColorStop(0.985, 'rgba(0,0,0,0)'); g3.addColorStop(1, 'rgba(0,0,0,.18)');
    ctx.fillStyle = g3; ctx.fillRect(x, y, w, h);
    // subtle sheen
    var g4 = ctx.createLinearGradient(x, y, x + w, y + h); g4.addColorStop(0, 'rgba(255,255,255,.08)'); g4.addColorStop(.5, 'rgba(255,255,255,0)'); g4.addColorStop(1, 'rgba(0,0,0,.05)');
    ctx.fillStyle = g4; ctx.fillRect(x, y, w, h);
    ctx.restore();
  }


  /* ---------- photographic book mockup ----------
     A shading map captured from the Ciel Africa cover mockups: R = multiply (×1.5),
     G = add (−0.5…0.5), A = book silhouette. Covers are mapped hinge → spine roll. */
  var GEO = { W: 1100, H: 1420, left: 41, right: 1058, crease: 158, top: 54, bottom: 1367, btop: 40, bbottom: 1379 };
  var maps = {};
  function mockMap(src) {
    src = src || '/assets/pbk/mockmap-sm.png?v=1';
    if (maps[src]) return maps[src];
    maps[src] = img(src).then(function (im) {
      if (!im) throw new Error('mockup map missing');
      var c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
      var x = c.getContext('2d'); x.drawImage(im, 0, 0);
      return { w: c.width, h: c.height, d: x.getImageData(0, 0, c.width, c.height).data, k: c.width / GEO.W };
    });
    return maps[src];
  }
  /** src: canvas/image of a flat cover (any size, 3:4). Returns a canvas with the book mockup. */
  function mock(src, map) {
    var k = map.k, c = document.createElement('canvas'); c.width = map.w; c.height = map.h;
    var x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
    var sw = src.naturalWidth || src.width, sh = src.naturalHeight || src.height, hs = sw * HINGE / W;
    var top = GEO.btop * k, hh = (GEO.bbottom - GEO.btop) * k;
    x.drawImage(src, 0, 0, hs, sh, GEO.left * k, top, (GEO.crease - GEO.left) * k, hh);
    x.drawImage(src, hs, 0, sw - hs, sh, GEO.crease * k, GEO.top * k - 2 * k, (GEO.right - GEO.crease) * k, (GEO.bottom - GEO.top + 4) * k);
    // above/below the face (the spine roll) take the nearest face row
    x.drawImage(src, hs, 0, sw - hs, 2, GEO.crease * k, top, (GEO.right - GEO.crease) * k, (GEO.top - GEO.btop) * k);
    x.drawImage(src, hs, sh - 2, sw - hs, 2, GEO.crease * k, GEO.bottom * k, (GEO.right - GEO.crease) * k, (GEO.bbottom - GEO.bottom) * k);
    var id = x.getImageData(0, 0, c.width, c.height), p = id.data, m = map.d;
    for (var i = 0; i < p.length; i += 4) {
      var A = m[i + 3]; if (!A) { p[i + 3] = 0; continue; }
      var a = m[i] / 170, b = (m[i + 1] - 127.5);
      p[i] = a * p[i] + b; p[i + 1] = a * p[i + 1] + b; p[i + 2] = a * p[i + 2] + b; p[i + 3] = A;
    }
    x.putImageData(id, 0, 0);
    return c;
  }

  /* ---------- 3D book (standing, spine on the left) ----------
     book3d-*.png stacks three tiles rendered in Blender (tools/pbk/rig.py):
     1) R,G = u (16 bit), B = v high byte; 2) R = v low byte, G = surface (60 front, 120 spine, 180 edge),
     B = diffuse light ×1.4; 3) R = gloss, G = book alpha, B = shadow alpha. */
  var maps3 = {};
  function book3dMap(src) {
    src = src || '/assets/pbk/book3d-440.png?v=1';
    if (maps3[src]) return maps3[src];
    maps3[src] = img(src).then(function (im) {
      if (!im) throw new Error('3D map missing');
      var w = im.naturalWidth, h = im.naturalHeight / 3, c = document.createElement('canvas'); c.width = w; c.height = h * 3;
      var x = c.getContext('2d'); x.drawImage(im, 0, 0);
      var d = x.getImageData(0, 0, w, h * 3).data, n = w * h;
      var m = { w: w, h: h, u: new Float32Array(n), v: new Float32Array(n), reg: new Uint8Array(n), D: new Float32Array(n), S: new Float32Array(n), A: new Float32Array(n), Sh: new Float32Array(n) };
      for (var i = 0; i < n; i++) {
        var a = i * 4, b = (i + n) * 4, c2 = (i + 2 * n) * 4;
        m.u[i] = (d[a] * 256 + d[a + 1]) / 65535; m.v[i] = (d[a + 2] * 256 + d[b]) / 65535;
        m.reg[i] = Math.round(d[b + 1] / 60); m.D[i] = d[b + 2] / 255 * 1.4;
        m.S[i] = d[c2] / 255; m.A[i] = d[c2 + 1] / 255; m.Sh[i] = d[c2 + 2] / 255;
      }
      return m;
    });
    return maps3[src];
  }
  function pixels(src, w, h) {
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    var x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(src, 0, 0, w, h);
    return { w: w, h: h, d: x.getImageData(0, 0, w, h).data };
  }
  function sample(t, u, v, o) {
    var fx = Math.max(0, Math.min(t.w - 1.001, u * (t.w - 1))), fy = Math.max(0, Math.min(t.h - 1.001, (1 - v) * (t.h - 1)));
    var x0 = fx | 0, y0 = fy | 0, ax = fx - x0, ay = fy - y0, d = t.d, w = t.w;
    var i00 = (y0 * w + x0) * 4, i10 = i00 + 4, i01 = i00 + w * 4, i11 = i01 + 4;
    for (var k = 0; k < 3; k++) o[k] = (d[i00 + k] * (1 - ax) + d[i10 + k] * ax) * (1 - ay) + (d[i01 + k] * (1 - ax) + d[i11 + k] * ax) * ay;
  }
  /** The spine: background, the title running down, a small artwork and CIEL AFRICA. */
  function spine(o) {
    var w = 160, h = 1320, c = document.createElement('canvas'); c.width = w; c.height = h;
    var x = c.getContext('2d');
    x.fillStyle = o.bg || '#ffffff'; x.fillRect(0, 0, w, h);
    x.save(); x.translate(w, 0); x.rotate(Math.PI / 2); /* text runs top to bottom */
    var title = String(o.title || '').toUpperCase().slice(0, 28);
    if (title) {
      var fs = 74; x.font = '800 ' + fs + 'px ' + FONTS.spartan.css;
      var tw = x.measureText(title).width, maxW = h * 0.56;
      if (tw > maxW) { fs = fs * maxW / tw; x.font = '800 ' + fs + 'px ' + FONTS.spartan.css; }
      x.fillStyle = o.tc || '#111111'; x.textBaseline = 'middle';
      x.fillText(title, h * 0.06, w / 2 + fs * 0.04);
    }
    var bs = 27; x.font = '500 ' + bs + 'px ' + FONTS.sans.css.replace('600', '500');
    x.fillStyle = o.bc || o.tc || '#111111';
    var ls = bs * 0.24, bw = tracked(x, BRAND.text, ls);
    drawTracked(x, BRAND.text, h * 0.94 - bw, w / 2 + bs * 0.36, ls);
    x.restore();
    if (o.art || o.artImg) { var a = ready(o.artImg || artSrc(o.art)); if (a) { var r = a.naturalWidth / a.naturalHeight, aw = w * 0.74, ah = aw / r; if (ah > w * 1.1) { ah = w * 1.1; aw = ah * r; } x.drawImage(a, (w - aw) / 2, h * 0.68 - ah / 2, aw, ah); } }
    return c;
  }
  /** Composes the 3D book: front = flat cover canvas/image (3:4), sp = spine canvas. */
  function book3d(front, sp, map, opt) {
    opt = opt || {};
    var F = pixels(front, opt.fw || Math.min(900, (front.naturalWidth || front.width)), Math.round((opt.fw || Math.min(900, (front.naturalWidth || front.width))) * 4 / 3));
    var P = pixels(sp, sp.width, sp.height);
    var edge = opt.edge || [80, 80, 80];
    var c = document.createElement('canvas'); c.width = map.w; c.height = map.h;
    var x = c.getContext('2d'), id = x.createImageData(map.w, map.h), p = id.data, col = [0, 0, 0];
    for (var i = 0, n = map.w * map.h; i < n; i++) {
      var A = map.A[i], Sh = map.Sh[i], o = i * 4;
      if (A < 0.004 && Sh < 0.004) continue;
      var r = 0, g = 0, b = 0;
      if (A > 0) {
        var reg = map.reg[i];
        if (reg === 1) sample(F, map.u[i], map.v[i], col);
        else if (reg === 2) sample(P, map.u[i], map.v[i], col);
        else { col[0] = edge[0]; col[1] = edge[1]; col[2] = edge[2]; }
        var D = map.D[i], S = map.S[i] * 255 * (opt.gloss == null ? 0.7 : opt.gloss);
        r = col[0] * D + S; g = col[1] * D + S; b = col[2] * D + S;
      }
      var ao = A + Sh * 0.55 * (1 - A);
      p[o] = Math.min(255, r * A / ao); p[o + 1] = Math.min(255, g * A / ao); p[o + 2] = Math.min(255, b * A / ao); p[o + 3] = ao * 255;
    }
    x.putImageData(id, 0, 0);
    return c;
  }

  var API = { book3dMap: book3dMap, book3d: book3d, spine: spine, GEO: GEO, mockMap: mockMap, mock: mock, W: W, H: H, HINGE: HINGE, BRAND: BRAND, FONTS: FONTS, loadFonts: loadFonts, img: img, ready: ready, artSrc: artSrc, draw: draw, load: load, toCanvas: toCanvas, layoutText: layoutText, mockup: mockup, drawBrand: drawBrand, rr: rr };
  if (typeof module === 'object' && module.exports) module.exports = API; else root.PBKR = API;
})(typeof self !== 'undefined' ? self : this);
