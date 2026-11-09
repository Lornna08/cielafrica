/* ============================================================
   CIEL PHOTO BOOKS — photo import
   Validates each file, reads its capture date and orientation,
   detects duplicates by content hash and makes small preview copies
   for the editor. The original file is stored unchanged for print.
   ============================================================ */
(function (root) {
  'use strict';
  var OK = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

  function typeOf(file, head) {
    var b = new Uint8Array(head);
    if (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return 'image/jpeg';
    if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47) return 'image/png';
    if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'image/webp';
    var s = String.fromCharCode.apply(null, b.subarray(4, 12));
    if (/ftyp(heic|heix|hevc|mif1|msf1|heif)/.test(s)) return 'image/heic';
    return file.type || 'unknown';
  }

  /** minimal EXIF reader: Orientation, DateTimeOriginal and GPS position from a JPEG */
  function exif(buf) {
    var v = new DataView(buf), out = { orientation: 1, taken: null };
    if (v.byteLength < 4 || v.getUint16(0) !== 0xFFD8) return out;
    var off = 2;
    while (off + 4 < v.byteLength) {
      var marker = v.getUint16(off), len = v.getUint16(off + 2);
      if (marker === 0xFFE1 && v.getUint32(off + 4) === 0x45786966) { try { parse(off + 10); } catch (e) { } break; }
      if ((marker & 0xFF00) !== 0xFF00 || marker === 0xFFDA) break;
      off += 2 + len;
    }
    function parse(t) {
      var le = v.getUint16(t) === 0x4949;
      function u16(o) { return v.getUint16(o, le); } function u32(o) { return v.getUint32(o, le); }
      function ifd(o, cb) { if (o + 2 > v.byteLength) return; var n = u16(o); for (var i = 0; i < n; i++) { var e = o + 2 + i * 12; if (e + 12 > v.byteLength) return; cb(u16(e), e); } }
      var first = t + u32(t + 4), exifPtr = null, gpsPtr = null;
      ifd(first, function (tag, e) { if (tag === 0x0112) out.orientation = u16(e + 8); if (tag === 0x8769) exifPtr = t + u32(e + 8); if (tag === 0x8825) gpsPtr = t + u32(e + 8); });
      if (gpsPtr) {
        var g = {};
        ifd(gpsPtr, function (tag, e) {
          if (tag === 1 || tag === 3) g[tag] = String.fromCharCode(v.getUint8(e + 8));
          if (tag === 2 || tag === 4) { var p = t + u32(e + 8), r = function (k) { var dn = u32(p + k * 8 + 4); return dn ? u32(p + k * 8) / dn : 0; }; if (p + 24 <= v.byteLength) g[tag] = r(0) + r(1) / 60 + r(2) / 3600; }
        });
        if (g[2] != null && g[4] != null && (g[2] || g[4])) out.gps = { lat: +(g[1] === 'S' ? -g[2] : g[2]).toFixed(5), lng: +(g[3] === 'W' ? -g[4] : g[4]).toFixed(5) };
      }
      if (exifPtr) ifd(exifPtr, function (tag, e) {
        if (tag === 0x9003 || (tag === 0x9004 && !out.taken)) {
          var p = t + u32(e + 8), s = ''; for (var i = 0; i < 19 && p + i < v.byteLength; i++) s += String.fromCharCode(v.getUint8(p + i));
          var m = s.match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
          if (m && m[1] !== '0000') out.taken = m[1] + '-' + m[2] + '-' + m[3] + 'T' + m[4] + ':' + m[5] + ':' + m[6];
        }
      });
    }
    try { return out; } catch (e) { return { orientation: 1, taken: null }; }
  }

  function hex(buf) { var a = new Uint8Array(buf), s = ''; for (var i = 0; i < a.length; i++) s += (a[i] < 16 ? '0' : '') + a[i].toString(16); return s; }
  function sha256(buf) { return crypto.subtle.digest('SHA-256', buf).then(hex); }

  function decode(blob) {
    if (root.createImageBitmap) return createImageBitmap(blob, { imageOrientation: 'from-image' }).catch(function () { return createImageBitmap(blob); }).catch(function () { return viaImg(blob); });
    return viaImg(blob);
  }
  function viaImg(blob) {
    return new Promise(function (res, rej) { var u = URL.createObjectURL(blob), im = new Image(); im.onload = function () { res(im); }; im.onerror = function () { URL.revokeObjectURL(u); rej(new Error('decode')); }; im.src = u; });
  }
  function scaled(img, max, q, type) {
    var w = img.width || img.naturalWidth, h = img.height || img.naturalHeight, s = Math.min(1, max / Math.max(w, h));
    var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * s)); c.height = Math.max(1, Math.round(h * s));
    var x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(img, 0, 0, c.width, c.height);
    return new Promise(function (res, rej) { c.toBlob(function (b) { b ? res(b) : rej(new Error('encode')); }, type || 'image/jpeg', q || 0.85); });
  }

  function script(src, name) { return root[name] ? Promise.resolve(root[name]) : new Promise(function (ok, no) { var el = document.createElement('script'); el.src = src; el.onload = function () { ok(root[name]); }; el.onerror = function () { no(new Error('Couldn’t load a converter. Check your connection and try again.')); }; document.head.appendChild(el); }); }
  function canvasOf(img) { var w = img.width || img.naturalWidth, h = img.height || img.naturalHeight, c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(img, 0, 0); return c; }
  function hasAlpha(c) { try { var d = c.getContext('2d').getImageData(0, 0, Math.min(c.width, 64), Math.min(c.height, 64)).data; for (var i = 3; i < d.length; i += 4) if (d[i] < 250) return true; } catch (e) { } return false; }
  /** any image the browser (or our HEIC converter) can open → JPEG, or PNG when it has transparency */
  function convert(file, buf, type) {
    var name = file.name || 'This file', isHeic = type === 'image/heic' || /\.(heic|heif)$/i.test(name);
    var blob = new Blob([buf], { type: isHeic ? 'image/heic' : (type !== 'unknown' ? type : file.type || '') });
    function encode(img) { var c = canvasOf(img); if (img.close) img.close(); var png = hasAlpha(c); return new Promise(function (ok, no) { c.toBlob(function (b) { b ? ok(b) : no(new Error(name + ' could not be converted.')); }, png ? 'image/png' : 'image/jpeg', 0.95); }); }
    return decode(blob).then(encode, function () {
      if (!isHeic) throw new Error(name + ' isn’t a photo format we can open here. Save it as JPEG or PNG and add it again.');
      return script('/assets/vendor/heic2any-0.0.4.min.js', 'heic2any').then(function (h2a) { return h2a({ blob: blob, toType: 'image/jpeg', quality: 0.95 }); })
        .then(function (r) { return Array.isArray(r) ? r[0] : r; }, function () { throw new Error(name + ' is an iPhone HEIC photo we couldn’t convert. On iPhone, choose it from Photos (it’s sent as JPEG), or set Settings → Camera → Formats → Most Compatible.'); });
    });
  }
  /** PDF pages and the pictures inside Word documents become photos; returns a list of image Files */
  function expand(file, onStep) {
    var name = file.name || 'file', low = name.toLowerCase();
    if (file.type === 'application/pdf' || /\.pdf$/.test(low)) {
      return script('/assets/vendor/pdfjs-3.11.174.min.js', 'pdfjsLib').then(function (lib) {
        lib.GlobalWorkerOptions.workerSrc = '/assets/vendor/pdfjs-3.11.174.worker.min.js';
        return file.arrayBuffer().then(function (b) { return lib.getDocument({ data: b }).promise; });
      }).then(function (pdf) {
        var n = Math.min(pdf.numPages, 60), out = [], i = 1;
        function page() {
          if (i > n) return out;
          if (onStep) onStep('Reading page ' + i + ' of ' + n + ' in ' + name + '…');
          return pdf.getPage(i).then(function (pg) {
            var v0 = pg.getViewport({ scale: 1 }), sc = Math.min(3, 3000 / Math.max(v0.width, v0.height)), v = pg.getViewport({ scale: sc });
            var c = document.createElement('canvas'); c.width = Math.round(v.width); c.height = Math.round(v.height);
            var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
            return pg.render({ canvasContext: g, viewport: v }).promise.then(function () { return new Promise(function (ok) { c.toBlob(ok, 'image/jpeg', 0.92); }); });
          }).then(function (b) { out.push(new File([b], name.replace(/\.pdf$/i, '') + ' p' + i + '.jpg', { type: 'image/jpeg' })); i++; return page(); });
        }
        return page();
      }, function (e) { throw new Error(name + ' couldn’t be opened as a PDF' + (e && /password/i.test(e.message) ? ' (it has a password)' : '') + '.'); });
    }
    if (/\.docx$/.test(low) || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return Promise.all([script('/assets/vendor/fflate-0.8.2.min.js', 'fflate'), file.arrayBuffer()]).then(function (r) {
        var files = r[0].unzipSync(new Uint8Array(r[1]), { filter: function (f) { return /^word\/media\/.+\.(jpe?g|png|webp|gif|bmp|tiff?|heic)$/i.test(f.name); } });
        var out = Object.keys(files).sort().map(function (k) { var ext = k.split('.').pop().toLowerCase(), t = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', bmp: 'image/bmp', heic: 'image/heic' }[ext] || ''; return new File([files[k]], name.replace(/\.docx$/i, '') + ' ' + k.split('/').pop(), { type: t }); });
        if (!out.length) throw new Error(name + ' has no pictures in it. Only the photos inside a Word document can be used.');
        return out;
      }, function (e) { throw new Error(e && e.message && /pictures/.test(e.message) ? e.message : name + ' couldn’t be opened. Save it again as .docx or PDF.'); });
    }
    if (/\.doc$/.test(low) || file.type === 'application/msword') return Promise.reject(new Error(name + ' is an older Word file (.doc). Open it and save it as .docx or PDF, then add it again.'));
    return Promise.resolve([file]);
  }
  /** returns {meta, blobs} or throws Error with a friendly message */
  function importFile(file, ctx) {
    var lim = ctx.limits || { maxFileMB: 40, minPhotoPx: 800 };
    if (file.size > lim.maxFileMB * 1048576) return Promise.reject(new Error(file.name + ' is larger than ' + lim.maxFileMB + ' MB.'));
    if (file.size < 200) return Promise.reject(new Error(file.name + ' is empty or damaged.'));
    return file.arrayBuffer().then(function (buf) {
      var type = typeOf(file, buf.slice(0, 16));
      if (OK[type]) return { buf: buf, type: type };
      /* iPhone HEIC/HEIF and other image formats become a high-quality JPEG (or PNG) first */
      return convert(file, buf, type).then(function (b) { return b.arrayBuffer().then(function (nb) { return { buf: nb, type: b.type, converted: true }; }); });
    }).then(function (src) {
      var buf = src.buf, type = src.type;
      return sha256(buf).then(function (hash) {
        if (ctx.hashes && ctx.hashes[hash]) { var e = new Error(file.name + ' is already in this book.'); e.duplicate = true; throw e; }
        var ex = type === 'image/jpeg' ? exif(buf) : { orientation: 1, taken: null };
        var blob = new Blob([buf], { type: type });
        return decode(blob).then(function (img) {
          var w = img.width || img.naturalWidth, h = img.height || img.naturalHeight;
          if (!w || !h) throw new Error(file.name + ' could not be read.');
          return Promise.all([scaled(img, 1600, 0.86), scaled(img, 420, 0.8)]).then(function (d) {
            if (img.close) img.close();
            var meta = { id: ctx.uid('ph'), projectId: ctx.projectId, name: String(file.name || 'photo').slice(0, 120), type: type, size: buf.byteLength, converted: src.converted || undefined, w: w, h: h, orient: ex.orientation || 1, taken: ex.taken, gps: ex.gps || undefined, hash: hash, added: Date.now(), low: Math.min(w, h) < lim.minPhotoPx };
            return { meta: meta, blobs: { orig: blob, prev: d[0], thumb: d[1] } };
          });
        });
      });
    });
  }
  root.PBPhotos = { importFile: importFile, expand: expand, exif: exif, sha256: sha256, decode: decode, scaled: scaled, accept: 'image/*,.heic,.heif,.pdf,application/pdf,.docx,.doc' };
})(self);
