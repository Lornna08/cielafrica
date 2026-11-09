/* ============================================================
   CIEL AFRICA PHOTO BOOKS — the printing partner's file package.
   Made in the browser from the order's print files (300 dpi JPEGs with
   3 mm bleed) without re-compressing them:
     front cover  → A4 PDF          back cover → A4 PDF
     spine        → PNG (only for books thick enough for a printed spine)
     inside pages → one A4 PDF, page 1 first, to print back to back
     README.txt   → the production summary (no prices)
   Everything goes into one .zip (stored, no compression: PDFs and
   images are already compressed).
   ============================================================ */
(function () {
  'use strict';
  var MM = 72 / 25.4;
  function loadPdfLib() { return window.PDFLib ? Promise.resolve() : new Promise(function (ok, no) { var s = document.createElement('script'); s.src = '/assets/vendor/pdf-lib-1.17.1.min.js'; s.onload = ok; s.onerror = function () { no(new Error('Couldn’t load the PDF tool. Check your connection.')); }; document.head.appendChild(s); }); }
  function slug(s) { return String(s || 'book').replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'book'; }

  /* one or more print JPEGs → an A4 (trim size) PDF; the 3 mm bleed falls just outside the page */
  function a4Pdf(blobs, title, tr) {
    var L = window.PDFLib, W = tr.w, H = tr.h, B = tr.b;
    return L.PDFDocument.create().then(function (doc) {
      doc.setTitle(title); doc.setCreator('Ciel Africa Photo Books'); doc.setProducer('Ciel Africa');
      var i = 0;
      function next() {
        if (i >= blobs.length) return doc.save();
        var get = blobs[i++];
        return get().then(function (bl) { return bl.arrayBuffer(); }).then(function (buf) { return doc.embedJpg(buf); }).then(function (im) {
          var p = doc.addPage([W * MM, H * MM]);
          p.drawImage(im, { x: -B * MM, y: -B * MM, width: (W + 2 * B) * MM, height: (H + 2 * B) * MM });
          return next();
        });
      }
      return next();
    }).then(function (bytes) { return new Blob([bytes], { type: 'application/pdf' }); });
  }
  function toPng(bl) {
    return new Promise(function (ok, no) {
      var u = URL.createObjectURL(bl), im = new Image();
      im.onload = function () { var c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; c.getContext('2d').drawImage(im, 0, 0); URL.revokeObjectURL(u); c.toBlob(function (b) { b ? ok(b) : no(new Error('Couldn’t make the spine PNG.')); }, 'image/png'); };
      im.onerror = function () { no(new Error('Couldn’t read the spine image.')); }; im.src = u;
    });
  }

  /* ---------- a minimal ZIP writer (store method) ---------- */
  var CRC = (function () { var t = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u8) { var c = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function zip(files) {
    return Promise.all(files.map(function (f) { return f.blob.arrayBuffer().then(function (b) { return { name: f.name, data: new Uint8Array(b) }; }); })).then(function (list) {
      var parts = [], central = [], off = 0, enc = new TextEncoder(), d = new Date();
      var dt = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xFFFF, dd = (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF;
      list.forEach(function (f) {
        var nm = enc.encode(f.name), crc = crc32(f.data), sz = f.data.length;
        var h = new DataView(new ArrayBuffer(30));
        h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true); h.setUint16(10, dt, true); h.setUint16(12, dd, true);
        h.setUint32(14, crc, true); h.setUint32(18, sz, true); h.setUint32(22, sz, true); h.setUint16(26, nm.length, true); h.setUint16(28, 0, true);
        parts.push(h.buffer, nm, f.data);
        var c = new DataView(new ArrayBuffer(46));
        c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true); c.setUint16(12, dt, true); c.setUint16(14, dd, true);
        c.setUint32(16, crc, true); c.setUint32(20, sz, true); c.setUint32(24, sz, true); c.setUint16(28, nm.length, true); c.setUint32(42, off, true);
        central.push(c.buffer, nm);
        off += 30 + nm.length + sz;
      });
      var cs = central.reduce(function (n, p) { return n + (p.byteLength || p.length); }, 0), e = new DataView(new ArrayBuffer(22));
      e.setUint32(0, 0x06054b50, true); e.setUint16(8, list.length, true); e.setUint16(10, list.length, true); e.setUint32(12, cs, true); e.setUint32(16, off, true);
      return new Blob(parts.concat(central, [e.buffer]), { type: 'application/zip' });
    });
  }

  /**
   * opts: { ref, text (summary), books: [{ name, pages, qty, spine, files (count of print files), info: {trimW,trimH,bleedMm},
   *         print(i) → Promise<Blob>, spineFile() → Promise<Blob|null> }], progress(msg) }
   * → Promise<{ blob, name }>
   */
  function build(opts) {
    var say = opts.progress || function () { }, out = [], multi = opts.books.length > 1;
    return loadPdfLib().then(function () {
      var k = 0;
      function book() {
        if (k >= opts.books.length) return null;
        var b = opts.books[k++], dir = opts.ref + '/' + (multi ? k + '-' + slug(b.name) + '/' : ''), inf = b.info || {};
        var tr = { w: +inf.trimW || 210, h: +inf.trimH || 297, b: inf.bleedMm == null ? 3 : +inf.bleedMm }, last = b.files - 1;
        if (b.files < 3) throw new Error('The print files for “' + b.name + '” are incomplete.');
        var tag = multi ? ' (' + b.name + ')' : '';
        say('Front cover' + tag + '…');
        return a4Pdf([function () { return b.print(0); }], b.name + ' · front cover · ' + opts.ref, tr).then(function (pdf) {
          out.push({ name: dir + '01-front-cover-A4.pdf', blob: pdf }); say('Back cover' + tag + '…');
          return a4Pdf([function () { return b.print(last); }], b.name + ' · back cover · ' + opts.ref, tr);
        }).then(function (pdf) {
          out.push({ name: dir + '02-back-cover-A4.pdf', blob: pdf });
          if (!b.spine) return null; say('Spine' + tag + '…');
          return b.spineFile().then(function (bl) { return bl ? toPng(bl) : null; });
        }).then(function (png) {
          if (png) out.push({ name: dir + '03-spine.png', blob: png });
          var gets = [], n = 0;
          for (var i = 1; i < last; i++) (function (i) { gets.push(function () { say('Page ' + (++n) + ' of ' + (last - 1) + tag + '…'); return b.print(i); }); })(i);
          return a4Pdf(gets, b.name + ' · ' + (last - 1) + ' pages · ' + opts.ref, tr);
        }).then(function (pdf) { out.push({ name: dir + '04-pages-A4-' + b.pages + 'pp-back-to-back.pdf', blob: pdf }); return book(); });
      }
      return book();
    }).then(function () {
      out.unshift({ name: opts.ref + '/README.txt', blob: new Blob([opts.text.replace(/\n/g, '\r\n') + '\r\n\r\nFiles\r\n01 front cover, A4 PDF\r\n02 back cover, A4 PDF\r\n03 spine, PNG (only for books over 36 pages; thinner books have no printed spine)\r\n04 inside pages, A4 PDF, page 1 first, print back to back\r\n\r\nPages are 300 dpi. A4 = 210 x 297 mm, trimmed exactly to A4.\r\n'], { type: 'text/plain' }) });
      say('Packing the .zip…');
      return zip(out);
    }).then(function (z) { say(''); return { blob: z, name: opts.ref + '-print-files.zip' }; });
  }
  function save(blob, name) { var a = document.createElement('a'), u = URL.createObjectURL(blob); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 120000); }
  window.PBKPack = { build: build, save: save, zip: zip };
})();
