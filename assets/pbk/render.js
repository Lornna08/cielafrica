/* ============================================================
   CIEL AFRICA PHOTO BOOKS — page & cover renderer
   One renderer for everything: editor canvas, thumbnails,
   the book preview, mockups and the print file. A cover or page
   is a small document in a 1200 × 1697 space (A4 portrait, 21 × 29.7 cm).
   Books made before the A4 switch were drawn in 1200 × 1600 (21 × 28 cm);
   toA4() brings them over the first time they are drawn.
   ============================================================ */
(function (root) {
  'use strict';
  var W = 1200, H = 1697, HINGE = 100, LEGACY_H = 1600, K = H / LEGACY_H;
  /* The CIEL AFRICA mark: fixed position, size and tracking on every cover. */
  var BRAND = { text: 'CIEL AFRICA', size: 19, track: 0.3, y: H - 44, x: 650, font: '500 {s}px "PBK Mont", "Montserrat", sans-serif' };

  /* ---------- A4: documents made in the old 21 × 28 cm space move over once ----------
     Covers with a full artwork image scale evenly (the artwork fills the taller page and
     the words stay where they were on it); everything else keeps its size and moves down
     in proportion, while photo frames and colour blocks grow to the taller page. */
  function a4El(e, uniform) {
    if (!e || typeof e !== 'object') return e;
    if (uniform) {
      e.x = 600 + ((e.x || 0) - 600) * K; e.y = (e.y || 0) * K; if (e.w != null) e.w *= K; if (e.h != null) e.h *= K;
      if (e.cap) e.cap *= K; if (e.size) e.size *= K; if (e.border) e.border *= K;
      if (e.t === 'text' && e.x < 0) { if (e.w != null) e.w += e.x; e.x = 0; }
      if (e.t === 'text' && e.w != null && e.x + e.w > W) e.w = W - e.x;
      return e;
    }
    var stretch = e.t === 'photo' || (e.t === 'shape' && e.shape !== 'circle');
    if (stretch) { e.y = (e.y || 0) * K; if (e.h != null) e.h *= K; }
    else { var h = e.h || 0; e.y = ((e.y || 0) + h / 2) * K - h / 2; }
    return e;
  }
  function toA4(doc) {
    if (!doc || typeof doc !== 'object' || doc.a4) return doc;
    var uni = !!doc.img;
    (doc.els || []).forEach(function (e) { a4El(e, uni); });
    doc.a4 = 1;
    return doc;
  }
  /* ---------- the hardcover case (data/photobooks.js → book.cover, edited in Ciel Admin) ----------
     spine  = paper thickness (gsm × bulk ÷ 1000 per sheet, 2 pages a sheet) + 2 boards
     hinge  = the groove each side of the spine where the cover bends
     wrap   = the cover material folded over the boards' edges (includes bleed)
     Confirm all four numbers with the printer: they depend on their paper and boards. */
  function coverCfg(cfg) {
    var bk = (root.CIEL && root.CIEL.photobooks && root.CIEL.photobooks.book) || {};
    var c = cfg || bk.cover || {};
    return { paperGsm: +c.paperGsm || 170, paperBulk: +c.paperBulk || 1, boardMm: c.boardMm == null ? 3 : +c.boardMm, hingeMm: c.hingeMm == null ? 8 : +c.hingeMm, wrapMm: c.wrapMm == null ? 15 : +c.wrapMm };
  }
  /** spine width in mm for a page count */
  function spineMm(pages, cfg) {
    var c = coverCfg(cfg), sheets = Math.ceil((pages || 24) / 2);
    return Math.round((c.paperGsm * c.paperBulk * sheets / 1000 + 2 * c.boardMm) * 10) / 10;
  }
  /** spine width in document units (1200 units = 210 mm) */
  function spineUnits(pages, cfg) { return spineMm(pages, cfg) / 210 * W; }
  function hingeUnits(cfg) { return coverCfg(cfg).hingeMm / 210 * W; }
  /** The whole case cover in one image: wrap · back · hinge · spine · hinge · front · wrap.
      back/front: print pages with bleedMm on every edge; spine: spine width × (trim height + 2 bleed).
      Each panel's own edge carries on into the hinges and the wrap. */
  function caseCover(back, front, spine, o) {
    var c = coverCfg(o.cover), b = o.bleedMm == null ? 3 : o.bleedMm, tw = o.trimW || 210, th = o.trimH || 297, sp = o.spineMm, hg = c.hingeMm, wr = Math.max(c.wrapMm, b);
    var Wmm = 2 * wr + 2 * tw + 2 * hg + sp, Hmm = 2 * wr + th, dpi = o.dpi || 300;
    var max = o.maxPx || 16e6; if ((Wmm / 25.4 * dpi) * (Hmm / 25.4 * dpi) > max) dpi = Math.floor(dpi * Math.sqrt(max / ((Wmm / 25.4 * dpi) * (Hmm / 25.4 * dpi))));
    var k = dpi / 25.4, cv = document.createElement('canvas'); cv.width = Math.round(Wmm * k); cv.height = Math.round(Hmm * k);
    var x = cv.getContext('2d'); x.imageSmoothingQuality = 'high';
    function sz(im) { return { w: im.naturalWidth || im.width, h: im.naturalHeight || im.height }; }
    /* draws the trim area of im into [dx,dy,dw,dh] mm, then stretches its outer pixels by l/r/t/u mm */
    function panel(im, bl, dx, dy, dw, dh, l, r, t, u) {
      var s = sz(im), fx = s.w / (dw + 2 * bl), fy = s.h / (dh + 2 * bl), sx = bl * fx, sy = bl * fy, sw = dw * fx, sh = dh * fy;
      var X = dx * k, Y = dy * k, Wd = dw * k, Hd = dh * k, L = l * k, R = r * k, T = t * k, U = u * k;
      x.drawImage(im, sx, sy, sw, sh, X, Y, Wd, Hd);
      if (L) x.drawImage(im, sx, sy, 1, sh, X - L, Y, L + 1, Hd);
      if (R) x.drawImage(im, sx + sw - 1, sy, 1, sh, X + Wd - 1, Y, R + 1, Hd);
      if (T) x.drawImage(im, sx, sy, sw, 1, X, Y - T, Wd, T + 1);
      if (U) x.drawImage(im, sx, sy + sh - 1, sw, 1, X, Y + Hd - 1, Wd, U + 1);
      if (L && T) x.drawImage(im, sx, sy, 1, 1, X - L, Y - T, L + 1, T + 1);
      if (R && T) x.drawImage(im, sx + sw - 1, sy, 1, 1, X + Wd - 1, Y - T, R + 1, T + 1);
      if (L && U) x.drawImage(im, sx, sy + sh - 1, 1, 1, X - L, Y + Hd - 1, L + 1, U + 1);
      if (R && U) x.drawImage(im, sx + sw - 1, sy + sh - 1, 1, 1, X + Wd - 1, Y + Hd - 1, R + 1, U + 1);
    }
    panel(back, b, wr, wr, tw, th, wr, hg, wr, wr);
    panel(front, b, wr + tw + 2 * hg + sp, wr, tw, th, hg, wr, wr, wr);
    if (spine) {
      var ss = sz(spine), fy2 = ss.h / (th + 2 * b), X2 = (wr + tw + hg) * k;
      x.drawImage(spine, 0, b * fy2, ss.w, th * fy2, X2, wr * k, sp * k, th * k);
      x.drawImage(spine, 0, b * fy2, ss.w, 1, X2, 0, sp * k, wr * k + 1);
      x.drawImage(spine, 0, (b + th) * fy2 - 1, ss.w, 1, X2, (wr + th) * k - 1, sp * k, wr * k + 1);
    }
    return { canvas: cv, dpi: dpi, widthMm: Wmm, heightMm: Hmm, spineMm: sp, hingeMm: hg, wrapMm: wr, trimW: tw, trimH: th };
  }
  var FONTS = {
    spartan: { css: '"PBK Spartan", "League Spartan", sans-serif', w: 800, name: 'Bold Sans' },
    sans: { css: '"PBK Mont", "Montserrat", sans-serif', w: 600, name: 'Clean Sans' },
    serif: { css: '"PBK Serif", Georgia, serif', w: 400, name: 'Serif' },
    serifi: { css: '"PBK Serif I", Georgia, serif', w: 400, name: 'Serif Italic', italic: true },
    script: { css: '"PBK Script", cursive', w: 600, name: 'Handwritten' },
    round: { css: '"PBK Round", sans-serif', w: 400, name: 'Rounded' },
    block: { css: '"PBK Block", sans-serif', w: 400, name: 'Heavy' },
    playfair: { css: '"PBK Playfair Display", serif', w: 800, name: 'Elegant serif' },
    playfairi: { css: '"PBK Playfair Display Italic", serif', w: 700, name: 'Elegant italic', italic: true },
    cormorant: { css: '"PBK Cormorant Garamond Italic", serif', w: 600, name: 'Classic italic', italic: true },
    abril: { css: '"PBK Abril Fatface", serif', w: 400, name: 'Fashion' },
    bebas: { css: '"PBK Bebas Neue", sans-serif', w: 400, name: 'Tall caps' },
    oswald: { css: '"PBK Oswald", sans-serif', w: 600, name: 'Condensed' },
    poppins: { css: '"PBK Poppins", sans-serif', w: 600, name: 'Modern' },
    josefin: { css: '"PBK Josefin Sans", sans-serif', w: 700, name: 'Geometric' },
    righteous: { css: '"PBK Righteous", sans-serif', w: 400, name: 'Retro' },
    shrikhand: { css: '"PBK Shrikhand", sans-serif', w: 400, name: 'Bold retro' },
    fredoka: { css: '"PBK Fredoka", sans-serif', w: 600, name: 'Playful' },
    pacifico: { css: '"PBK Pacifico", cursive', w: 400, name: 'Surf script' },
    lobster: { css: '"PBK Lobster", cursive', w: 400, name: 'Lobster' },
    dancing: { css: '"PBK Dancing Script", cursive', w: 700, name: 'Dancing script' },
    greatvibes: { css: '"PBK Great Vibes", cursive', w: 400, name: 'Wedding script' },
    satisfy: { css: '"PBK Satisfy", cursive', w: 400, name: 'Brush script' },
    kaushan: { css: '"PBK Kaushan Script", cursive', w: 400, name: 'Bold brush' },
    marker: { css: '"PBK Permanent Marker", cursive', w: 400, name: 'Marker' },
    amatic: { css: '"PBK Amatic SC", cursive', w: 700, name: 'Hand-drawn' }
  };
  var FONT_FILES = [
    ['PBK Spartan', '/assets/fonts/pbk/spartan.woff2', { weight: '100 900' }],
    ['PBK Mont', '/assets/fonts/pbk/montserrat-500.woff2', { weight: '500' }],
    ['PBK Mont', '/assets/fonts/pbk/montserrat-600.woff2', { weight: '600' }],
    ['PBK Serif', '/assets/fonts/pb/pb-dmserif.ttf', {}],
    ['PBK Serif I', '/assets/fonts/pb/pb-dmserif-i.ttf', {}],
    ['PBK Script', '/assets/fonts/pb/pb-caveat.ttf', { weight: '400 700' }],
    ['PBK Round', '/assets/fonts/pb/pb-lilita.ttf', {}],
    ['PBK Block', '/assets/fonts/pb/pb-archivo.ttf', {}],
    ['PBK Playfair Display', '/assets/fonts/pbk/playfair.woff2', { weight: '800' }],
    ['PBK Playfair Display Italic', '/assets/fonts/pbk/playfair-i.woff2', { weight: '700', style: 'italic' }],
    ['PBK Cormorant Garamond Italic', '/assets/fonts/pbk/cormorant-i.woff2', { weight: '600', style: 'italic' }],
    ['PBK Abril Fatface', '/assets/fonts/pbk/abril.woff2', { weight: '400' }],
    ['PBK Bebas Neue', '/assets/fonts/pbk/bebas.woff2', { weight: '400' }],
    ['PBK Oswald', '/assets/fonts/pbk/oswald.woff2', { weight: '600' }],
    ['PBK Poppins', '/assets/fonts/pbk/poppins.woff2', { weight: '600' }],
    ['PBK Josefin Sans', '/assets/fonts/pbk/josefin.woff2', { weight: '700' }],
    ['PBK Righteous', '/assets/fonts/pbk/righteous.woff2', { weight: '400' }],
    ['PBK Shrikhand', '/assets/fonts/pbk/shrikhand.woff2', { weight: '400' }],
    ['PBK Fredoka', '/assets/fonts/pbk/fredoka.woff2', { weight: '600' }],
    ['PBK Pacifico', '/assets/fonts/pbk/pacifico.woff2', { weight: '400' }],
    ['PBK Lobster', '/assets/fonts/pbk/lobster.woff2', { weight: '400' }],
    ['PBK Dancing Script', '/assets/fonts/pbk/dancing.woff2', { weight: '700' }],
    ['PBK Great Vibes', '/assets/fonts/pbk/greatvibes.woff2', { weight: '400' }],
    ['PBK Satisfy', '/assets/fonts/pbk/satisfy.woff2', { weight: '400' }],
    ['PBK Kaushan Script', '/assets/fonts/pbk/kaushan.woff2', { weight: '400' }],
    ['PBK Permanent Marker', '/assets/fonts/pbk/marker.woff2', { weight: '400' }],
    ['PBK Amatic SC', '/assets/fonts/pbk/amatic.woff2', { weight: '700' }]
  ];
  /* fonts load on demand: the two cover fonts first, the others when a page uses them */
  var famP = {};
  function loadFam(fam) {
    if (!fam) return Promise.resolve();
    if (famP[fam]) return famP[fam];
    if (!root.FontFace || !root.document) return (famP[fam] = Promise.resolve());
    famP[fam] = Promise.all(FONT_FILES.filter(function (f) { return f[0] === fam; }).map(function (f) {
      var ff = new FontFace(f[0], 'url(' + f[1] + ')', f[2]);
      return ff.load().then(function (x) { document.fonts.add(x); }).catch(function () {});
    }));
    return famP[fam];
  }
  function famOf(key) { var f = FONTS[key] || FONTS.spartan, m = f.css.match(/"([^"]+)"/); return m && m[1]; }
  function loadFonts() { return Promise.all(['PBK Spartan', 'PBK Mont'].map(loadFam)); }
  function loadAllFonts() { return Promise.all(Object.keys(FONTS).map(function (k) { return loadFam(famOf(k)); })); }

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
  function forget(src) { delete cache[src]; FXCACHE.forEach(function (v, k) { if (k.indexOf(src + '|') === 0) FXCACHE.delete(k); }); }
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
  /* Fills the frame with the photo (or the cropped part of it: rect = normalised source
     rectangle), zoomed by crop.z and positioned by crop.cx/cy, never leaving a gap. */
  function cover(ctx, im, x, y, w, h, crop, rect) {
    var IW = im.naturalWidth || im.width, IH = im.naturalHeight || im.height;
    var rx = 0, ry = 0, rw = IW, rh = IH;
    if (rect && rect.w > 0 && rect.h > 0) { rx = rect.x * IW; ry = rect.y * IH; rw = rect.w * IW; rh = rect.h * IH; }
    var z = Math.max(1, (crop && crop.z) || 1);
    var s = Math.max(w / rw, h / rh) * z;
    var dw = rw * s, dh = rh * s;
    var cx = crop && crop.cx != null ? crop.cx : 0.5, cy = crop && crop.cy != null ? crop.cy : 0.5;
    var dx = x + w / 2 - cx * dw, dy = y + h / 2 - cy * dh;
    dx = Math.min(x, Math.max(x + w - dw, dx)); dy = Math.min(y, Math.max(y + h - dh, dy));
    ctx.drawImage(im, rx, ry, rw, rh, dx, dy, dw, dh);
  }
  /* ---------- photo filters and background masks (applied per pixel, cached) ---------- */
  var FXCACHE = new Map();
  function fxKey(fx) { if (!fx) return ''; return ['b', 'c', 's', 'w', 'f', 'g', 'sp'].map(function (k) { return fx[k] || 0; }).join(','); }
  function hasFx(fx) { return !!fx && fxKey(fx) !== '0,0,0,0,0,0,0'; }
  function applyFx(d, fx) {
    var b = (fx.b || 0) * 1.6, c = (fx.c || 0) * 1.28, cf = (259 * (c + 255)) / (255 * (259 - c)), sat = 1 + (fx.s || 0) / 100, warm = (fx.w || 0) * 0.35, fade = (fx.f || 0) / 100 * 0.35, g = fx.g, sp = fx.sp;
    for (var i = 0; i < d.length; i += 4) {
      var r = d[i], gg = d[i + 1], bb = d[i + 2];
      if (g || sp) { var l = 0.299 * r + 0.587 * gg + 0.114 * bb; if (sp) { r = l * 1.07 + 18; gg = l * 0.95 + 8; bb = l * 0.78; } else { r = gg = bb = l; } }
      r += b; gg += b; bb += b;
      r = cf * (r - 128) + 128; gg = cf * (gg - 128) + 128; bb = cf * (bb - 128) + 128;
      if (sat !== 1) { var L = 0.299 * r + 0.587 * gg + 0.114 * bb; r = L + (r - L) * sat; gg = L + (gg - L) * sat; bb = L + (bb - L) * sat; }
      r += warm; bb -= warm;
      if (fade) { r += (150 - r) * fade; gg += (145 - gg) * fade; bb += (140 - bb) * fade; }
      d[i] = r < 0 ? 0 : r > 255 ? 255 : r; d[i + 1] = gg < 0 ? 0 : gg > 255 ? 255 : gg; d[i + 2] = bb < 0 ? 0 : bb > 255 ? 255 : bb;
    }
  }
  /** The photo with its filters and background mask applied (canvas), or the photo itself. */
  function processed(im, src, fx, mask, maskSrc) {
    if (!hasFx(fx) && !mask) return im;
    var key = src + '|' + fxKey(fx) + '|' + (maskSrc || '');
    var hit = FXCACHE.get(key); if (hit) return hit;
    var IW = im.naturalWidth || im.width, IH = im.naturalHeight || im.height, k = Math.min(1, 2600 / Math.max(IW, IH));
    var c = document.createElement('canvas'); c.width = Math.round(IW * k); c.height = Math.round(IH * k);
    var x = c.getContext('2d'); x.drawImage(im, 0, 0, c.width, c.height);
    if (hasFx(fx)) { var id = x.getImageData(0, 0, c.width, c.height); applyFx(id.data, fx); x.putImageData(id, 0, 0); }
    if (mask) { x.globalCompositeOperation = 'destination-in'; x.imageSmoothingQuality = 'high'; x.drawImage(mask, 0, 0, c.width, c.height); x.globalCompositeOperation = 'source-over'; }
    FXCACHE.set(key, c);
    if (FXCACHE.size > 30) FXCACHE.delete(FXCACHE.keys().next().value);
    return c;
  }
  function rr(ctx, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  /**
   * draw(ctx, doc, opt): draws a cover/page into ctx scaled to opt.scale.
   * opt.photo(id) -> src url; opt.hide = element id to skip (editing text);
   * opt.empty: 'editor' shows grey placeholders for empty photo frames.
   */
  function draw(ctx, doc, opt) {
    opt = opt || {};
    toA4(doc);
    var s = opt.scale || 1, sy = opt.scaleY || s;
    ctx.save(); ctx.scale(s, sy);
    ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip(); /* nothing spills past the page (onto the spine or the next page) */
    ctx.fillStyle = doc.bg || '#ffffff'; ctx.fillRect(0, 0, W, H);
    if (doc.img) { var b = ready(doc.img); if (b) drawFill(ctx, b); }
    (doc.els || []).forEach(function (el) {
      if (opt.hide && opt.hide === el.id) return;
      ctx.save();
      if (el.rot) { var cx = el.x + el.w / 2, cy = el.y + el.h / 2; ctx.translate(cx, cy); ctx.rotate(el.rot * Math.PI / 180); ctx.translate(-cx, -cy); }
      if (el.t === 'photo') {
        var src = el.photo && opt.photo ? opt.photo(el.photo) : null, im = src && ready(src);
        if (el.border) { ctx.fillStyle = el.borderColor || '#ffffff'; rr(ctx, el.x - el.border, el.y - el.border, el.w + el.border * 2, el.h + el.border * 2, (el.r || 0) + el.border); ctx.fill(); }
        rr(ctx, el.x, el.y, el.w, el.h, el.r || 0); ctx.clip();
        var msrc = el.mask && opt.photo ? opt.photo(el.mask) : null, mim = msrc && ready(msrc);
        if (im) cover(ctx, processed(im, src, el.fx, mim, msrc), el.x, el.y, el.w, el.h, el.crop, el.rect);
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
        var imsrc = el.mask && opt.photo ? opt.photo(el.mask) : null; if (iim) iim = processed(iim, isrc, el.fx, imsrc && ready(imsrc), imsrc);
        if (iim) {
          if (el.flip) { ctx.translate(el.x * 2 + el.w, 0); ctx.scale(-1, 1); }
          ctx.globalAlpha = el.op == null ? 1 : el.op;
          if (el.rect && el.rect.w > 0) { var RW = iim.naturalWidth || iim.width, RH = iim.naturalHeight || iim.height; ctx.drawImage(iim, el.rect.x * RW, el.rect.y * RH, el.rect.w * RW, el.rect.h * RH, el.x, el.y, el.w, el.h); }
          else ctx.drawImage(iim, el.x, el.y, el.w, el.h);
        }
      } else if (el.t === 'text') {
        var L = layoutText(ctx, el);
        if (el.bgc) {
          var bx0 = Infinity, bx1 = -Infinity; L.lines.forEach(function (l) { bx0 = Math.min(bx0, l.x); bx1 = Math.max(bx1, l.x + l.w); });
          var pad = L.cap * 0.45; ctx.fillStyle = el.bgc; rr(ctx, bx0 - pad, el.y - pad * 0.9, bx1 - bx0 + pad * 2, L.h + pad * 1.9 + L.cap * 0.1, pad * 0.6); ctx.fill();
        }
        ctx.font = L.font; ctx.fillStyle = el.color || '#111'; ctx.textBaseline = 'alphabetic';
        if (el.shadow) { ctx.shadowColor = 'rgba(0,0,0,.42)'; ctx.shadowBlur = Math.max(1.5, L.cap * 0.09 * s); ctx.shadowOffsetX = Math.max(1, L.cap * 0.035 * s); ctx.shadowOffsetY = Math.max(1, L.cap * 0.06 * s); }
        L.lines.forEach(function (l) { drawTracked(ctx, l.t, l.x, l.y, L.ls); });
      } else if (el.t === 'shape') {
        ctx.fillStyle = el.color || '#111';
        if (el.shape === 'circle') { ctx.beginPath(); ctx.ellipse(el.x + el.w / 2, el.y + el.h / 2, el.w / 2, el.h / 2, 0, 0, Math.PI * 2); ctx.fill(); }
        else { rr(ctx, el.x, el.y, el.w, el.h, el.r || 0); ctx.fill(); }
      }
      ctx.restore();
    });
    if (doc.kind === 'cover' && !doc.ownBrand) drawBrand(ctx, doc.brand || '#ffffff');
    if (doc.kind === 'back') drawContact(ctx, doc.brand || '#ffffff');
    ctx.restore();
  }
  /* full-page artwork: fills the page without stretching (centred, the sides trimmed if needed) */
  function drawFill(ctx, im) {
    var iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height, k = Math.max(W / iw, H / ih), dw = iw * k, dh = ih * k;
    ctx.drawImage(im, (W - dw) / 2, (H - dh) / 2, dw, dh);
  }
  /* back cover: the website and email, small, bottom right (clear of the spine on the right) */
  function drawContact(ctx, color) {
    ctx.save(); ctx.fillStyle = color; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'right';
    ctx.font = '600 25px "PBK Mont", "Montserrat", sans-serif'; ctx.fillText('cielafrica.com', 1040, H - 92);
    ctx.font = '500 21px "PBK Mont", "Montserrat", sans-serif'; ctx.globalAlpha = 0.85; ctx.fillText('hello@cielafrica.com', 1040, H - 58);
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
    toA4(doc);
    var list = [loadFonts(), img(doc.img)];
    (doc.els || []).forEach(function (el) {
      if (el.t === 'art') list.push(img(artSrc(el.art)));
      if (el.t === 'text' && el.font) list.push(loadFam(famOf(el.font)));
      if (el.t === 'photo' && el.photo && opt.photo) list.push(img(opt.photo(el.photo)));
      if (el.t === 'img') list.push(img(el.src || (el.photo && opt.photo ? opt.photo(el.photo) : null)));
      if (el.mask && opt.photo) list.push(img(opt.photo(el.mask)));
    });
    return Promise.all(list);
  }

  /** Renders a document to a new canvas of width px. */
  function toCanvas(doc, px, opt) {
    opt = opt || {};
    return load(doc, opt).then(function () {
      var c = document.createElement('canvas'); c.width = px; c.height = Math.round(px * H / W);
      var x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
      /* the page fills every pixel row: no half-covered (see-through) last row, which used to print as a grey line */
      x.fillStyle = doc.bg || '#ffffff'; x.fillRect(0, 0, c.width, c.height);
      draw(x, doc, Object.assign({}, opt, { scale: px / W, scaleY: c.height / H }));
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
  /* Two book models: slim (up to 48 pages) and thick (more pages). sr = spine width / height. */
  var BOOKS = {
    thin: { sr: 0.017 / 0.28, s: '/assets/pbk/book3d-thin-440.png?v=1', l: '/assets/pbk/book3d-thin-720.png?v=1' },
    thick: { sr: 0.034 / 0.28, s: '/assets/pbk/book3d-440.png?v=1', l: '/assets/pbk/book3d-720.png?v=1' }
  };
  function bookKind(pages) { return (pages || 24) > 48 ? 'thick' : 'thin'; }
  function bookMap(kind, large) { var b = BOOKS[kind] || BOOKS.thin; return book3dMap(large ? b.l : b.s).then(function (m) { m.sr = b.sr; return m; }); }
  /** Cover document → standing 3D book canvas. o: { pages, large, px, photo } */
  function renderBook(doc, so, o) {
    o = o || {}; var px = o.px || 900;
    return Promise.all([bookMap(bookKind(o.pages), o.large), toCanvas(doc, px, { photo: o.photo, empty: o.empty }), so.artImg ? img(so.artImg) : so.art ? img(artSrc(so.art)) : null]).then(function (r) {
      return book3d(r[1], spine(so, r[0].sr), r[0], { fw: px });
    });
  }
  function book3dMap(src) {
    src = src || BOOKS.thin.s;
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
  function spine(o, sr) {
    var h = 1320, w = Math.max(40, Math.round(h * (sr || 0.1214))), k = w / 160, c = document.createElement('canvas'); c.width = w; c.height = h;
    var x = c.getContext('2d');
    x.fillStyle = o.bg || '#ffffff'; x.fillRect(0, 0, w, h);
    x.save(); x.translate(w, 0); x.rotate(Math.PI / 2); /* text runs top to bottom */
    var title = String(o.title || '').toUpperCase().slice(0, 28);
    if (title) {
      var fs = 74 * k; x.font = '800 ' + fs + 'px ' + FONTS.spartan.css;
      var tw = x.measureText(title).width, maxW = h * 0.56;
      if (tw > maxW) { fs = fs * maxW / tw; x.font = '800 ' + fs + 'px ' + FONTS.spartan.css; }
      x.fillStyle = o.tc || '#111111'; x.textBaseline = 'middle';
      x.fillText(title, h * 0.06, w / 2 + fs * 0.04);
    }
    var bs = Math.max(12, 27 * k); x.font = '500 ' + bs + 'px ' + FONTS.sans.css.replace('600', '500');
    x.fillStyle = o.bc || o.tc || '#111111';
    var ls = bs * 0.24, bw = tracked(x, BRAND.text, ls);
    drawTracked(x, BRAND.text, h * 0.94 - bw, w / 2 + bs * 0.36, ls);
    x.restore();
    if (o.art || o.artImg) { var a = ready(o.artImg || artSrc(o.art)); if (a) { var r = a.naturalWidth / a.naturalHeight, aw = w * 0.74, ah = aw / r; if (ah > w * 1.1) { ah = w * 1.1; aw = ah * r; } x.drawImage(a, (w - aw) / 2, h * 0.68 - ah / 2, aw, ah); } }
    return c;
  }
  /** The spine drawn flat, in document units: w wide, H high (for the wrap view and the print file).
      o: { bg, title, tc, bc, art?, artImg?, hideTitle? } */
  function drawSpine(ctx, o, w) {
    ctx.save();
    ctx.fillStyle = o.bg || '#ffffff'; ctx.fillRect(0, 0, w, H);
    /* a small picture from the front cover, upright, between the words and the CIEL AFRICA mark */
    var pic = o.noPic ? null : ready(o.artImg || (o.art ? artSrc(o.art) : null));
    if (pic && w >= 18) {
      var iw = pic.naturalWidth || pic.width, ih = pic.naturalHeight || pic.height, pw = w * 0.8, ph = pw * ih / iw;
      if (ph > w * 1.7) { ph = w * 1.7; pw = ph * iw / ih; }
      ctx.drawImage(pic, (w - pw) / 2, H * 0.8 - ph / 2, pw, ph);
    }
    ctx.translate(w, 0); ctx.rotate(Math.PI / 2); /* text runs top to bottom, read with the book lying face up */
    var title = o.hideTitle ? '' : String(o.title || '').toUpperCase().slice(0, 40);
    if (title) {
      var F = FONTS[o.font] || FONTS.spartan, k = o.scale || 1;
      /* the words fill the spine: most of its width, as long as the space allows */
      var fs = w * 0.9 * k, fnt = function (z) { return (F.italic ? 'italic ' : '') + F.w + ' ' + z + 'px ' + F.css; };
      ctx.font = fnt(fs); ctx.textBaseline = 'middle';
      var tw = ctx.measureText(title).width, maxW = H * (pic ? 0.64 : 0.8);
      if (tw > maxW) { fs = fs * maxW / tw; ctx.font = fnt(fs); }
      if (fs > w * 1.05) { fs = w * 1.05; ctx.font = fnt(fs); }
      ctx.fillStyle = o.tc || '#111111'; ctx.fillText(title, H * 0.05, w / 2 + fs * 0.04);
    }
    var bs = Math.max(7, Math.min(24, w * 0.26)); ctx.font = '500 ' + bs + 'px ' + FONTS.sans.css.replace('600', '500');
    ctx.fillStyle = o.bc || o.tc || '#111111'; ctx.textBaseline = 'middle';
    var ls = bs * 0.24, bw = tracked(ctx, BRAND.text, ls);
    drawTracked(ctx, BRAND.text, H * 0.95 - bw, w / 2 + bs * 0.05, ls);
    ctx.restore();
    return ctx;
  }
  /** loads what the spine needs (its picture and font) */
  function loadSpine(o) {
    o = o || {}; var l = [loadFonts()];
    if (!o.noPic && (o.artImg || o.art)) l.push(img(o.artImg || artSrc(o.art)));
    if (o.font && loadFam) l.push(Promise.resolve(loadFam(o.font)).catch(function () {}));
    return Promise.all(l).catch(function () {});
  }
  /** Composes the 3D book: front = flat cover canvas/image (3:4), sp = spine canvas. */
  function book3d(front, sp, map, opt) {
    opt = opt || {};
    var F = pixels(front, opt.fw || Math.min(900, (front.naturalWidth || front.width)), Math.round((opt.fw || Math.min(900, (front.naturalWidth || front.width))) * H / W));
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

  var API = { toA4: toA4, a4El: a4El, LEGACY_H: LEGACY_H, spineMm: spineMm, spineUnits: spineUnits, hingeUnits: hingeUnits, coverCfg: coverCfg, caseCover: caseCover, drawSpine: drawSpine, loadSpine: loadSpine, drawFill: drawFill, forget: forget, applyFx: applyFx, processed: processed, hasFx: hasFx, cover: cover, BOOKS: BOOKS, bookKind: bookKind, bookMap: bookMap, renderBook: renderBook, book3dMap: book3dMap, book3d: book3d, spine: spine, GEO: GEO, mockMap: mockMap, mock: mock, W: W, H: H, HINGE: HINGE, BRAND: BRAND, FONTS: FONTS, loadFonts: loadFonts, loadAllFonts: loadAllFonts, loadFam: loadFam, famOf: famOf, img: img, ready: ready, artSrc: artSrc, draw: draw, load: load, toCanvas: toCanvas, layoutText: layoutText, mockup: mockup, drawBrand: drawBrand, rr: rr };
  if (typeof module === 'object' && module.exports) module.exports = API; else root.PBKR = API;
})(typeof self !== 'undefined' ? self : this);
