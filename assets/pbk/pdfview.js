/* ============================================================
   CIEL AFRICA — PDF preview (admin). Shows a PDF made in the browser
   page by page (pdf.js, Apache-2.0, /assets/vendor/pdfjs-4.10.38) before
   it is downloaded, with a Download button. Works the same on phones,
   where browsers don't show PDFs inside a page.
   PBKPdfView.open(blob, { name, title, note })
   ============================================================ */
(function () {
  'use strict';
  var V = '/assets/vendor/pdfjs-4.10.38/', lib = null;
  function load() {
    if (lib) return lib;
    lib = import(V + 'pdf.min.mjs').then(function (m) { m.GlobalWorkerOptions.workerSrc = V + 'pdf.worker.min.mjs'; return m; });
    lib.catch(function () { lib = null; });
    return lib;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function save(blob, name) { var a = document.createElement('a'), u = URL.createObjectURL(blob); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 120000); }
  var css = false;
  function style() {
    if (css) return; css = true;
    var s = document.createElement('style');
    s.textContent = '.pdv{position:fixed;inset:0;z-index:9999;background:rgba(18,18,20,.92);display:flex;flex-direction:column;color:#fff;font:14px/1.4 system-ui,-apple-system,sans-serif}' +
      '.pdv__top{display:flex;align-items:center;gap:.6rem;padding:calc(env(safe-area-inset-top,0px) + .7rem) 1rem .7rem;background:#111;border-bottom:1px solid #2a2a2e;flex-wrap:wrap}' +
      '.pdv__t{flex:1;min-width:10rem}.pdv__t b{display:block;font-size:15px}.pdv__t span{color:#aaa;font-size:12.5px}' +
      '.pdv__b{border:0;border-radius:999px;padding:.55rem 1rem;font:600 13.5px system-ui;cursor:pointer;background:#2a2a2e;color:#fff}.pdv__b--p{background:#ff5a1f}' +
      '.pdv__s{flex:1;overflow:auto;padding:1rem;display:flex;flex-direction:column;align-items:center;gap:1rem;-webkit-overflow-scrolling:touch}' +
      '.pdv__pg{background:#fff;box-shadow:0 6px 24px rgba(0,0,0,.5);max-width:100%;position:relative}.pdv__pg canvas{display:block;width:100%;height:auto}' +
      '.pdv__n{color:#999;font-size:12px;margin-top:-.6rem}.pdv__m{color:#bbb;padding:2rem;text-align:center}';
    document.head.appendChild(s);
  }
  /**
   * blob: the PDF; opt.name: file name for Download; opt.title / opt.note: shown at the top
   */
  function open(blob, opt) {
    opt = opt || {}; style();
    var ov = document.createElement('div'); ov.className = 'pdv'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'PDF preview');
    ov.innerHTML = '<div class="pdv__top"><div class="pdv__t"><b>' + esc(opt.title || opt.name || 'PDF') + '</b><span data-i>' + esc(Math.round(blob.size / 1048576 * 10) / 10 + ' MB') + (opt.note ? ' · ' + esc(opt.note) : '') + '</span></div><button class="pdv__b pdv__b--p" data-dl>Download PDF</button><button class="pdv__b" data-x>Close</button></div><div class="pdv__s"><p class="pdv__m">Opening the PDF…</p></div>';
    document.body.appendChild(ov);
    var sc = ov.querySelector('.pdv__s'), alive = true, doc = null;
    function close() { alive = false; if (doc) doc.destroy(); ov.remove(); document.removeEventListener('keydown', key); }
    function key(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', key);
    ov.querySelector('[data-x]').onclick = close;
    ov.querySelector('[data-dl]').onclick = function () { save(blob, opt.name || 'file.pdf'); };
    blob.arrayBuffer().then(function (buf) { return load().then(function (L) { return L.getDocument({ data: new Uint8Array(buf) }).promise; }); }).then(function (d) {
      if (!alive) { d.destroy(); return; }
      doc = d; sc.innerHTML = '';
      ov.querySelector('[data-i]').textContent = d.numPages + ' page' + (d.numPages === 1 ? '' : 's') + ' · ' + Math.round(blob.size / 1048576 * 10) / 10 + ' MB' + (opt.note ? ' · ' + opt.note : '');
      var boxes = [];
      for (var i = 1; i <= d.numPages; i++) {
        var w = document.createElement('div'); w.className = 'pdv__pg'; w.setAttribute('data-n', i);
        var n = document.createElement('div'); n.className = 'pdv__n'; n.textContent = 'Page ' + i + ' of ' + d.numPages;
        sc.appendChild(w); sc.appendChild(n); boxes.push(w);
      }
      /* sizes first (placeholders), then each page is drawn as it scrolls into view */
      return d.getPage(1).then(function (p1) {
        var vp = p1.getViewport({ scale: 1 }), maxW = Math.min(sc.clientWidth - 32, 900);
        boxes.forEach(function (b) { b.style.width = maxW + 'px'; b.style.aspectRatio = vp.width + ' / ' + vp.height; });
        var drawn = {}, q = Promise.resolve();
        function draw(b) {
          var k = +b.getAttribute('data-n'); if (drawn[k]) return; drawn[k] = 1;
          q = q.then(function () {
            if (!alive) return;
            return d.getPage(k).then(function (pg) {
              var v0 = pg.getViewport({ scale: 1 }), scale = Math.min(2.5, (b.clientWidth * Math.min(2, window.devicePixelRatio || 1)) / v0.width), v = pg.getViewport({ scale: scale });
              var c = document.createElement('canvas'); c.width = Math.round(v.width); c.height = Math.round(v.height);
              b.appendChild(c); b.style.aspectRatio = '';
              return pg.render({ canvasContext: c.getContext('2d'), viewport: v }).promise.then(function () { pg.cleanup(); });
            });
          }).catch(function () { });
        }
        if ('IntersectionObserver' in window) {
          var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { draw(e.target); io.unobserve(e.target); } }); }, { root: sc, rootMargin: '600px 0px' });
          boxes.forEach(function (b) { io.observe(b); });
        } else boxes.forEach(draw);
      });
    }).catch(function (e) { if (alive) sc.innerHTML = '<p class="pdv__m">Couldn’t show the preview (' + esc((e && e.message) || 'error') + '). You can still download the PDF.</p>'; });
    return { close: close };
  }
  window.PBKPdfView = { open: open };
})();
