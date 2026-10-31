/* ============================================================
   CIEL PHOTO BOOKS — print-ready PDF renderer
   Draws the same engine draw-lists the editor shows, at physical
   size: every page is trim + bleed with TrimBox/BleedBox set, fonts
   are embedded (subset), and photographs are embedded from the
   customer's ORIGINAL files at full resolution (JPEG and PNG as-is;
   orientation is applied with a transform, not by re-encoding).

   kinds: 'book'     front cover, interior pages, back cover (digital)
          'interior' interior pages only (printer)
          'cover'    one spread: back + spine + front with wrap (printer)
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./engine.js'));
  else root.PBPdf = factory(root.PBE);
})(typeof self !== 'undefined' ? self : this, function (E) {
  'use strict';
  var PT = E.PT;
  function hexRgb(L, h) { h = String(h || '#000000').replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); var n = parseInt(h, 16); return L.rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255); }

  /**
   * o: { L (pdf-lib), fontkit, cfg, project, photos (id→meta), kind,
   *      bytes(photoId) → Promise<ArrayBuffer> (original file),
   *      fontBytes(file) → Promise<ArrayBuffer>,
   *      reencode(photoId, meta) → Promise<{bytes, type:'jpg'}> (browser: for WebP / mirrored EXIF),
   *      hash, onProgress(done,total) }
   */
  function build(o) {
    var L = o.L, cfg = o.cfg, project = o.project, photos = o.photos;
    var v = E.validate(cfg, project, photos);
    if (v.errors.length) { var e = new Error('The book has problems to fix before it can be exported: ' + v.errors[0].msg); e.validation = v; return Promise.reject(e); }
    var d = E.dims(cfg, project), fonts = {}, imgs = {}, done = 0, doc;
    var targets = [];
    if (o.kind === 'book') { targets.push({ k: 'front' }); project.pages.forEach(function (p, i) { targets.push({ k: 'page', i: i }); }); targets.push({ k: 'back' }); }
    else if (o.kind === 'interior') project.pages.forEach(function (p, i) { targets.push({ k: 'page', i: i }); });
    else targets.push({ k: 'cover' });
    var total = targets.length;

    function font(id) {
      if (fonts[id]) return fonts[id];
      fonts[id] = o.fontBytes(E.FONTS[id].file).then(function (b) { return doc.embedFont(b, { subset: true }); });
      return fonts[id];
    }
    function image(id) {
      if (imgs[id]) return imgs[id];
      var m = photos[id];
      imgs[id] = o.bytes(id).then(function (buf) {
        if (!buf) throw new Error('A photo is missing from this device: ' + (m && m.name));
        var orient = m.orient || 1;
        if (m.type === 'image/png') return doc.embedPng(buf).then(function (im) { return { im: im, orient: 1 }; });
        if (m.type === 'image/jpeg' && [1, 3, 6, 8].indexOf(orient) >= 0) return doc.embedJpg(buf).then(function (im) { return { im: im, orient: orient }; });
        if (!o.reencode) throw new Error('This photo format needs converting in the browser: ' + m.name);
        return o.reencode(id, m).then(function (r) { return doc.embedJpg(r.bytes).then(function (im) { return { im: im, orient: 1, reencoded: true }; }); });
      });
      return imgs[id];
    }
    // collect fonts and images used, then draw synchronously-ish per page
    function drawOps(page, ops, ox, oy, H, clip) {
      // ox, oy: page-space offset (pt) of this panel's trim top-left; H: trim height (mm) for y-flip
      function X(x) { return ox + x * PT; }
      function Y(y) { return oy - y * PT; }
      var chain = Promise.resolve();
      if (clip) page.pushOperators(L.pushGraphicsState(), L.rectangle(clip.x, clip.y, clip.w, clip.h), L.clip(), L.endPath());
      ops.forEach(function (op) {
        chain = chain.then(function () {
          if (op.t === 'rect') page.drawRectangle({ x: X(op.x), y: Y(op.y + op.h), width: op.w * PT, height: op.h * PT, color: hexRgb(L, op.fill) });
          else if (op.t === 'path') {
            var po = { x: X(op.tx), y: Y(op.ty), scale: op.s * PT };
            if (op.fill) po.color = hexRgb(L, op.fill);
            if (op.stroke) { po.borderColor = hexRgb(L, op.stroke); po.borderWidth = op.sw / op.s; po.borderLineCap = L.LineCapStyle ? L.LineCapStyle.Round : undefined; }
            page.drawSvgPath(op.d, po);
          } else if (op.t === 'text') {
            return font(op.font).then(function (f) {
              var w = E.measure(op.font, op.text, op.size), sz = op.size;
              if (op.rot) {
                // spine text, reading top to bottom
                var cx = X((op.w0 || 0) - op.y), cy = Y(op.x) + (op.anchor === 'middle' ? w / 2 : 0);
                page.drawText(op.text, { x: cx, y: cy, size: sz, font: f, color: hexRgb(L, op.color), rotate: L.degrees(-90) });
              } else {
                var x0 = op.anchor === 'middle' ? X(op.x) - w / 2 : op.anchor === 'end' ? X(op.x) - w : X(op.x);
                page.drawText(op.text, { x: x0, y: Y(op.y), size: sz, font: f, color: hexRgb(L, op.color) });
              }
            });
          } else if (op.t === 'img') {
            return image(op.id).then(function (I) {
              var name = page.node.newXObject('Image', I.im.ref);
              var cx = X(op.clip.x), cy = Y(op.clip.y + op.clip.h), cw = op.clip.w * PT, ch = op.clip.h * PT;
              var x0 = X(op.x), y0 = Y(op.y + op.h), w = op.w * PT, h = op.h * PT, m;
              if (I.orient === 3) m = [-w, 0, 0, -h, x0 + w, y0 + h];
              else if (I.orient === 6) m = [0, -h, w, 0, x0, y0 + h];
              else if (I.orient === 8) m = [0, h, -w, 0, x0 + w, y0];
              else m = [w, 0, 0, h, x0, y0];
              page.pushOperators(L.pushGraphicsState(), L.rectangle(cx, cy, cw, ch), L.clip(), L.endPath(),
                L.concatTransformationMatrix(m[0], m[1], m[2], m[3], m[4], m[5]), L.drawObject(name), L.popGraphicsState());
            });
          } else if (op.t === 'empty') throw new Error('Empty photo frame');
        });
      });
      return chain.then(function () { if (clip) page.pushOperators(L.popGraphicsState()); });
    }
    function boxes(page, wPt, hPt, inset) {
      page.setMediaBox(0, 0, wPt, hPt); page.setBleedBox(0, 0, wPt, hPt);
      page.setTrimBox(inset, inset, wPt - 2 * inset, hPt - 2 * inset); page.setCropBox(0, 0, wPt, hPt);
    }
    function standard(r) {
      var wPt = (r.w + 2 * r.b) * PT, hPt = (r.h + 2 * r.b) * PT, page = doc.addPage([wPt, hPt]);
      boxes(page, wPt, hPt, r.b * PT);
      return drawOps(page, r.ops, r.b * PT, hPt - r.b * PT, r.h);
    }
    function coverSpread() {
      var bind = (cfg.bindings || {})[project.binding || 'softcover'] || { wrap: d.b, hinge: 0 };
      var wrap = Math.max(d.b, bind.wrap || 0), hinge = bind.hinge || 0, sp = E.spineMm(cfg, project);
      // render panels with bleed = wrap so photos and colour run around the board edge
      var c2 = JSON.parse(JSON.stringify(cfg)); c2.formats.forEach(function (f) { if (f.id === project.formatId) f.bleed = wrap; });
      var front = E.renderFront(c2, project, photos), back = E.renderBack(c2, project, photos), spine = E.renderSpine(cfg, project);
      var Wt = wrap + d.W + hinge + sp + hinge + d.W + wrap, Ht = d.H + 2 * wrap;
      var wPt = Wt * PT, hPt = Ht * PT, page = doc.addPage([wPt, hPt]);
      boxes(page, wPt, hPt, 0);
      page.setTrimBox(wrap * PT, wrap * PT, (Wt - 2 * wrap) * PT, d.H * PT);
      var bg = (project.cover && project.cover.bg) || (project.theme || {}).bg || E.theme(project.templateId).bg;
      page.drawRectangle({ x: 0, y: 0, width: wPt, height: hPt, color: hexRgb(L, bg) });
      var backX = wrap, spineX = wrap + d.W + hinge, frontX = spineX + sp + hinge, top = hPt - wrap * PT;
      return drawOps(page, back.ops, backX * PT, top, d.H, { x: 0, y: 0, w: (backX + d.W + hinge) * PT, h: hPt })
        .then(function () { return drawOps(page, spine.ops, spineX * PT, top, d.H, { x: spineX * PT, y: 0, w: sp * PT, h: hPt }); })
        .then(function () { return drawOps(page, front.ops, frontX * PT, top, d.H, { x: (frontX - hinge) * PT, y: 0, w: wPt - (frontX - hinge) * PT, h: hPt }); })
        .then(function () { return { spine: sp, wrap: wrap, hinge: hinge, width: Wt, height: Ht }; });
    }

    return L.PDFDocument.create().then(function (pdf) {
      doc = pdf; doc.registerFontkit(o.fontkit);
      var T = E.coverTexts(project), f = d.f;
      doc.setTitle((T.title || 'Photo book') + (o.kind === 'interior' ? ' — interior' : o.kind === 'cover' ? ' — cover' : ''));
      doc.setAuthor(T.byline || ''); doc.setCreator('Ciel Africa Photo Books'); doc.setProducer('Ciel Africa Photo Books (pdf-lib)');
      doc.setSubject('Print-ready ' + (o.kind || 'book') + ' · ' + f.name + ' ' + f.trimW + '×' + f.trimH + ' mm trim · ' + (o.kind === 'cover' ? 'wrap/bleed included' : f.bleed + ' mm bleed') + ' · ' + project.pages.length + ' pages');
      doc.setKeywords(['ciel-photobooks', 'design:' + (o.hash || ''), 'format:' + f.id, 'pages:' + project.pages.length]);
      doc.setCreationDate(new Date()); doc.setModificationDate(new Date());
      var chain = Promise.resolve(), info = null;
      targets.forEach(function (t) {
        chain = chain.then(function () {
          if (t.k === 'cover') return coverSpread().then(function (x) { info = x; });
          var r = t.k === 'front' ? E.renderFront(cfg, project, photos) : t.k === 'back' ? E.renderBack(cfg, project, photos) : E.renderPage(cfg, project, t.i, photos);
          return standard(r);
        }).then(function () { done++; if (o.onProgress) o.onProgress(done, total); });
      });
      return chain.then(function () { return doc.save({ useObjectStreams: true }); }).then(function (bytes) { return { bytes: bytes, info: info, pages: doc.getPageCount() }; });
    });
  }
  return { build: build };
});
