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

  /** minimal EXIF reader: Orientation and DateTimeOriginal from a JPEG */
  function exif(buf) {
    var v = new DataView(buf), out = { orientation: 1, taken: null };
    if (v.byteLength < 4 || v.getUint16(0) !== 0xFFD8) return out;
    var off = 2;
    while (off + 4 < v.byteLength) {
      var marker = v.getUint16(off), len = v.getUint16(off + 2);
      if (marker === 0xFFE1 && v.getUint32(off + 4) === 0x45786966) { parse(off + 10); break; }
      if ((marker & 0xFF00) !== 0xFF00 || marker === 0xFFDA) break;
      off += 2 + len;
    }
    function parse(t) {
      var le = v.getUint16(t) === 0x4949;
      function u16(o) { return v.getUint16(o, le); } function u32(o) { return v.getUint32(o, le); }
      function ifd(o, cb) { if (o + 2 > v.byteLength) return; var n = u16(o); for (var i = 0; i < n; i++) { var e = o + 2 + i * 12; if (e + 12 > v.byteLength) return; cb(u16(e), e); } }
      var first = t + u32(t + 4), exifPtr = null;
      ifd(first, function (tag, e) { if (tag === 0x0112) out.orientation = u16(e + 8); if (tag === 0x8769) exifPtr = t + u32(e + 8); });
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

  /** returns {meta, blobs} or throws Error with a friendly message */
  function importFile(file, ctx) {
    var lim = ctx.limits || { maxFileMB: 40, minPhotoPx: 800 };
    if (file.size > lim.maxFileMB * 1048576) return Promise.reject(new Error(file.name + ' is larger than ' + lim.maxFileMB + ' MB.'));
    if (file.size < 200) return Promise.reject(new Error(file.name + ' is empty or damaged.'));
    return file.arrayBuffer().then(function (buf) {
      var type = typeOf(file, buf.slice(0, 16));
      if (type === 'image/heic') throw new Error(file.name + ' is a HEIC photo, which can’t be printed reliably yet. Choose it from your Photos library (iPhone converts it to JPEG automatically) or save it as JPEG first.');
      if (!OK[type]) throw new Error(file.name + ' is not a JPEG, PNG or WebP image.');
      return sha256(buf).then(function (hash) {
        if (ctx.hashes && ctx.hashes[hash]) { var e = new Error(file.name + ' is already in this book.'); e.duplicate = true; throw e; }
        var ex = type === 'image/jpeg' ? exif(buf) : { orientation: 1, taken: null };
        var blob = new Blob([buf], { type: type });
        return decode(blob).then(function (img) {
          var w = img.width || img.naturalWidth, h = img.height || img.naturalHeight;
          if (!w || !h) throw new Error(file.name + ' could not be read.');
          return Promise.all([scaled(img, 1600, 0.86), scaled(img, 420, 0.8)]).then(function (d) {
            if (img.close) img.close();
            var meta = { id: ctx.uid('ph'), projectId: ctx.projectId, name: String(file.name || 'photo').slice(0, 120), type: type, size: file.size, w: w, h: h, orient: ex.orientation || 1, taken: ex.taken, hash: hash, added: Date.now(), low: Math.min(w, h) < lim.minPhotoPx };
            return { meta: meta, blobs: { orig: blob, prev: d[0], thumb: d[1] } };
          });
        });
      });
    });
  }
  root.PBPhotos = { importFile: importFile, exif: exif, sha256: sha256, decode: decode, scaled: scaled, accept: 'image/jpeg,image/png,image/webp' };
})(self);
