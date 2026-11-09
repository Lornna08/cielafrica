/* ============================================================
   CIEL AFRICA — image preview (admin). Opens a page, the cover or the spine
   large before anything is downloaded, like the PDF preview: arrows / swipe
   to move through the book, tap to zoom to full size, Download for the one
   on screen. Works the same on phones.
   PBKImgView.open(items, start, { title })
     items[i] = { label, thumb?: url, full: () => Promise<Blob>, name: 'file.jpg', clear?: true }
   ============================================================ */
(function () {
  'use strict';
  var css = false;
  function style() {
    if (css) return; css = true;
    var s = document.createElement('style');
    s.textContent = '.piv{position:fixed;inset:0;z-index:9999;background:#0e0e10;display:flex;flex-direction:column;color:#fff;font:14px/1.4 system-ui,-apple-system,sans-serif;touch-action:none}' +
      '.piv__top{display:flex;align-items:center;gap:.6rem;padding:calc(env(safe-area-inset-top,0px) + .7rem) 1rem .7rem;background:#111;border-bottom:1px solid #2a2a2e;flex-wrap:wrap}' +
      '.piv__t{flex:1;min-width:9rem}.piv__t b{display:block;font-size:15px}.piv__t span{color:#aaa;font-size:12.5px}' +
      '.piv__b{border:0;border-radius:999px;padding:.55rem 1rem;font:600 13.5px system-ui;cursor:pointer;background:#2a2a2e;color:#fff;min-height:40px}.piv__b--p{background:#ff5a1f}.piv__b:disabled{opacity:.6}' +
      '.piv__s{flex:1;position:relative;overflow:hidden;min-height:0}' +
      '.piv__s.is-zoom{overflow:auto;display:block;touch-action:pan-x pan-y;-webkit-overflow-scrolling:touch}' +
      '.piv__im{position:absolute;inset:0;margin:auto;max-width:calc(100% - 32px);max-height:calc(100% - 32px);box-shadow:0 8px 30px rgba(0,0,0,.55);background:#fff;cursor:zoom-in;user-select:none;-webkit-user-drag:none}' +
      '.piv__im.is-clear{background:repeating-conic-gradient(#3a3a40 0 25%,#2a2a30 0 50%) 0 0/16px 16px}' +
      '.piv__s.is-zoom .piv__im{position:static;max-width:none;max-height:none;cursor:zoom-out;margin:16px;display:block}' +
      '.piv__nav{position:absolute;top:50%;transform:translateY(-50%);width:46px;height:46px;border-radius:50%;border:0;background:rgba(40,40,46,.85);color:#fff;font-size:22px;cursor:pointer;display:grid;place-items:center;z-index:2}' +
      '.piv__nav:disabled{opacity:.25;cursor:default}.piv__nav--l{left:12px}.piv__nav--r{right:12px}.piv__s.is-zoom .piv__nav{position:fixed}' +
      '.piv__m{color:#bbb;padding:2rem;text-align:center}' +
      '.piv__strip{display:flex;gap:6px;overflow-x:auto;padding:.55rem .8rem calc(env(safe-area-inset-bottom,0px) + .55rem);background:#111;border-top:1px solid #2a2a2e;-webkit-overflow-scrolling:touch}' +
      '.piv__strip button{flex:none;border:2px solid transparent;border-radius:6px;padding:0;background:#222;cursor:pointer;height:64px;min-width:44px;overflow:hidden;color:#999;font-size:10px}' +
      '.piv__strip button.is-on{border-color:#ff5a1f}.piv__strip img{height:100%;width:auto;display:block}';
    document.head.appendChild(s);
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function save(blob, name) { var a = document.createElement('a'), u = URL.createObjectURL(blob); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 120000); }
  function mb(n) { return n > 1048576 ? (Math.round(n / 1048576 * 10) / 10) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'; }

  function open(items, start, opt) {
    opt = opt || {}; style();
    var cur = Math.max(0, Math.min(items.length - 1, start || 0)), alive = true, cache = {}, urls = [];
    var ov = document.createElement('div'); ov.className = 'piv'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'Image preview');
    ov.innerHTML = '<div class="piv__top"><div class="piv__t"><b data-l></b><span data-i></span></div><button class="piv__b piv__b--p" data-dl>Download</button><button class="piv__b" data-x>Close</button></div>' +
      '<div class="piv__s" data-s><button class="piv__nav piv__nav--l" data-pv aria-label="Previous">‹</button><img class="piv__im" alt="" draggable="false"><button class="piv__nav piv__nav--r" data-nx aria-label="Next">›</button></div>' +
      (items.length > 1 ? '<div class="piv__strip" data-st>' + items.map(function (it, i) { return '<button data-k="' + i + '" title="' + esc(it.label) + '">' + (it.thumb ? '<img src="' + esc(it.thumb) + '" alt="">' : esc(it.label)) + '</button>'; }).join('') + '</div>' : '');
    document.body.appendChild(ov);
    var sc = ov.querySelector('[data-s]'), img = sc.querySelector('img'), lab = ov.querySelector('[data-l]'), inf = ov.querySelector('[data-i]'), dl = ov.querySelector('[data-dl]'), st = ov.querySelector('[data-st]');
    function full(i) { if (!cache[i]) { cache[i] = items[i].full(); cache[i].catch(function () { delete cache[i]; }); } return cache[i]; }
    function show(i) {
      cur = i; sc.classList.remove('is-zoom');
      var it = items[i];
      lab.textContent = (opt.title ? opt.title + ' · ' : '') + it.label;
      inf.textContent = (i + 1) + ' of ' + items.length + ' · loading…';
      img.classList.toggle('is-clear', !!it.clear);
      if (it.thumb) img.src = it.thumb; else img.removeAttribute('src');
      ov.querySelector('[data-pv]').disabled = i === 0; ov.querySelector('[data-nx]').disabled = i === items.length - 1;
      if (st) { st.querySelectorAll('button').forEach(function (b) { b.classList.toggle('is-on', +b.getAttribute('data-k') === i); }); var on = st.querySelector('.is-on'); if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest', inline: 'center' }); }
      full(i).then(function (bl) {
        if (!alive || cur !== i) return;
        var u = URL.createObjectURL(bl); urls.push(u);
        var probe = new Image(); probe.onload = function () { if (!alive || cur !== i) return; img.src = u; inf.textContent = (i + 1) + ' of ' + items.length + ' · ' + probe.naturalWidth + ' × ' + probe.naturalHeight + ' px · ' + mb(bl.size) + (it.note ? ' · ' + it.note : ''); };
        probe.src = u;
      }, function (e) { if (alive && cur === i) inf.textContent = (i + 1) + ' of ' + items.length + ' · couldn’t load (' + ((e && e.message) || 'error') + ')'; });
      /* the next one is fetched in the background so moving on is instant */
      if (i + 1 < items.length) setTimeout(function () { if (alive) full(i + 1); }, 400);
    }
    function close() { alive = false; ov.remove(); document.removeEventListener('keydown', key); urls.forEach(function (u) { URL.revokeObjectURL(u); }); }
    function key(e) { if (e.key === 'Escape') close(); else if (e.key === 'ArrowLeft' && cur > 0) show(cur - 1); else if (e.key === 'ArrowRight' && cur < items.length - 1) show(cur + 1); }
    document.addEventListener('keydown', key);
    ov.querySelector('[data-x]').onclick = close;
    ov.querySelector('[data-pv]').onclick = function (e) { e.stopPropagation(); if (cur > 0) show(cur - 1); };
    ov.querySelector('[data-nx]').onclick = function (e) { e.stopPropagation(); if (cur < items.length - 1) show(cur + 1); };
    if (st) st.addEventListener('click', function (e) { var b = e.target.closest('[data-k]'); if (b) show(+b.getAttribute('data-k')); });
    dl.onclick = function () { var it = items[cur]; dl.disabled = true; full(cur).then(function (bl) { save(bl, it.name || 'image'); }).then(function () { dl.disabled = false; }, function () { dl.disabled = false; }); };
    img.addEventListener('click', function () { sc.classList.toggle('is-zoom'); });
    /* swipe left / right (not while zoomed in) */
    var sx = null, sy = 0;
    sc.addEventListener('pointerdown', function (e) { if (sc.classList.contains('is-zoom') || e.pointerType === 'mouse') return; sx = e.clientX; sy = e.clientY; });
    sc.addEventListener('pointerup', function (e) {
      if (sx == null) return; var dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) { if (dx < 0 && cur < items.length - 1) show(cur + 1); else if (dx > 0 && cur > 0) show(cur - 1); }
    });
    show(cur);
    return { close: close };
  }
  window.PBKImgView = { open: open };
})();
