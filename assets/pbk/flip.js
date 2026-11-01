/* ============================================================
   CIEL AFRICA PHOTO BOOKS — flip-book preview (page-flip, MIT)
   PBKFlip.open({ title, count, page(i) → Promise<url>, cover, endpaper, edge })
   i: 0 front cover · 1 inside front · 2..count+1 pages · count+2 inside back · count+3 back cover
   ============================================================ */
(function () {
  'use strict';
  var I = {
    x: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    l: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    r: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>'
  };
  var libP = null;
  function lib() {
    if (window.St && window.St.PageFlip) return Promise.resolve(window.St);
    return libP || (libP = new Promise(function (ok, no) { var s = document.createElement('script'); s.src = '/assets/vendor/page-flip-2.0.7.min.js'; s.onload = function () { ok(window.St); }; s.onerror = no; document.head.appendChild(s); }));
  }
  var dlg, pf;
  function open(o) {
    if (!dlg) { dlg = document.createElement('dialog'); dlg.className = 'pf'; document.body.appendChild(dlg); }
    var total = o.count + 4, urls = {}, pending = {};
    dlg.innerHTML = '<div class="pf__in"><header class="pf__h"><b>' + esc(o.title || 'Your book') + '</b><span class="pf__lbl" id="pfLbl">Cover</span><button class="pf__x" data-x aria-label="Close preview">' + I.x + '<span>Close</span></button></header>' +
      '<div class="pf__stage" id="pfStage"><button class="pf__nav pf__nav--l" data-p aria-label="Previous page">' + I.l + '</button><div class="pf__book" id="pfBook" style="--board:' + (o.board || '#3b2f26') + '"><div class="pf__board"></div><div class="pf__stack pf__stack--l"></div><div class="pf__stack pf__stack--r"></div><div class="pf__flip" id="pfFlip"></div></div><button class="pf__nav pf__nav--r" data-n aria-label="Next page">' + I.r + '</button><div class="pf__load" id="pfLoad"><span></span></div></div>' +
      '<footer class="pf__f"><button class="pf__btn" data-p>' + I.l + '<span>Back</span></button><input type="range" id="pfR" min="0" max="' + (total - 1) + '" value="0" step="1" aria-label="Go to page"><button class="pf__btn pf__btn--n" data-n><span>Next</span>' + I.r + '</button></footer>' +
      '<p class="pf__tip" id="pfTip">' + (innerWidth < 760 && innerHeight > innerWidth ? 'Swipe to turn the page. Turn your phone sideways for a bigger book.' : 'Drag a page corner, swipe, or tap the arrows to turn the page.') + '</p></div>';
    dlg.showModal();
    var stage = dlg.querySelector('#pfStage'), book = dlg.querySelector('#pfBook'), host = dlg.querySelector('#pfFlip'), lbl = dlg.querySelector('#pfLbl'), range = dlg.querySelector('#pfR');
    function want(i) {
      if (i < 0 || i >= total || urls[i] || pending[i]) return pending[i];
      pending[i] = Promise.resolve(o.page(i)).then(function (u) { urls[i] = u; delete pending[i]; var im = host.querySelector('[data-pg="' + i + '"] img'); if (im && u) { im.src = u; im.parentNode.classList.add('is-ready'); } return u; });
      return pending[i];
    }
    function around(i) { var q = [i, i + 1, i - 1, i + 2, i + 3, i - 2, i + 4, i + 5]; return Promise.all(q.map(want)); }
    function sizes() {
      /* always an open book (two pages side by side), on phones too */
      var sw = stage.clientWidth - (innerWidth > 760 ? 140 : 44), sh = stage.clientHeight - 28, spread = sw >= 240;
      var pw = spread ? Math.min(sw / 2, sh * 0.75) : Math.min(sw, sh * 0.75);
      return { pw: Math.floor(pw), ph: Math.floor(pw * 4 / 3), spread: spread };
    }
    function label(i) {
      if (i === 0) return 'Cover';
      if (i >= total - 1) return 'Back cover';
      var s = sizes(); if (!s.spread) { var p = i - 1; return p < 1 || p > o.count ? 'Inside cover' : 'Page ' + p + ' of ' + o.count; }
      var a = i % 2 ? i : i - 1, L = a - 1, Rr = a; // spread pages
      var names = [L, Rr].filter(function (p) { return p >= 1 && p <= o.count; });
      return names.length ? (names.length === 2 ? 'Pages ' + names[0] + '–' + names[1] : 'Page ' + names[0]) + ' of ' + o.count : 'Inside cover';
    }
    function state(i) {
      lbl.textContent = label(i); range.value = i;
      var closedF = i === 0, closedB = i >= total - 1, p = i / (total - 1);
      book.classList.toggle('is-closed', closedF || closedB); book.classList.toggle('is-back', closedB);
      book.style.setProperty('--l', (closedF ? 0 : 2 + p * 12).toFixed(1) + 'px'); book.style.setProperty('--r', (closedB ? 0 : 2 + (1 - p) * 12).toFixed(1) + 'px');
      dlg.querySelectorAll('[data-p]').forEach(function (b) { b.disabled = i === 0; });
      dlg.querySelectorAll('[data-n]').forEach(function (b) { b.disabled = i >= total - 1; });
      around(i);
    }
    // the cover first, so the viewer opens at once
    var s = sizes(), cur = 0;
    function build(at) {
    s = sizes();
    book.style.width = (s.spread ? s.pw * 2 : s.pw) + 'px'; book.style.height = s.ph + 'px';
    return Promise.all([lib(), want(0)]).then(function (r) {
      var St = r[0];
      var html = '';
      for (var i = 0; i < total; i++) {
        var hard = i === 0 || i === total - 1, end = i === 1 || i === total - 2;
        html += '<div class="pf-pg' + (hard ? ' pf-pg--hard' : '') + (end ? ' pf-pg--end' : '') + (i % 2 ? ' pf-pg--l' : ' pf-pg--r') + (urls[i] ? ' is-ready' : '') + '" data-pg="' + i + '"' + (hard ? ' data-density="hard"' : '') + (end ? ' style="background:' + (o.endpaper || '#efe7da') + '"' : '') + '>' + (end ? '' : '<img alt="" draggable="false"' + (urls[i] ? ' src="' + urls[i] + '"' : '') + '>') + '<i class="pf-sh"></i></div>';
      }
      if (pf) { try { pf.destroy(); } catch (e) { } pf = null; }
      if (!host.isConnected) { host = document.createElement('div'); host.className = 'pf__flip'; host.id = 'pfFlip'; book.appendChild(host); }
      host.innerHTML = html;
      pf = new St.PageFlip(host, { width: s.pw, height: s.ph, size: 'fixed', showCover: true, usePortrait: !s.spread, autoSize: false, maxShadowOpacity: 0.45, flippingTime: 750, mobileScrollSupport: false, swipeDistance: 24, showPageCorners: true, drawShadow: true });
      pf.loadFromHTML(host.querySelectorAll('.pf-pg'));
      pf.on('flip', function (e) { cur = e.data; state(e.data); });
      dlg.querySelector('#pfLoad').hidden = true;
      if (at) { pf.turnToPage(at); }
      state(at || 0);
      // fill the rest quietly
      var k = 0; (function idle() { if (!dlg.open) return; while (k < total && urls[k]) k++; if (k >= total) return; want(k).then(function () { setTimeout(idle, 30); }); })();
    });
    }
    build(0);
    var rt, lastW = innerWidth, lastH = innerHeight;
    function onResize() { if (!dlg.open) return; if (Math.abs(innerWidth - lastW) < 40 && Math.abs(innerHeight - lastH) < 120) return; lastW = innerWidth; lastH = innerHeight; clearTimeout(rt); rt = setTimeout(function () { build(cur); }, 250); }
    window.addEventListener('resize', onResize);
    /* no pinch or double-tap zoom inside the book */
    dlg.addEventListener('gesturestart', function (e) { e.preventDefault(); });
    dlg.addEventListener('dblclick', function (e) { e.preventDefault(); });
    dlg.onclick = function (e) {
      if (e.target.closest('[data-x]')) return close();
      if (!pf) return;
      if (e.target.closest('[data-p]')) pf.flipPrev('top');
      else if (e.target.closest('[data-n]')) pf.flipNext('top');
    };
    range.oninput = function () { if (pf) { cur = +range.value; pf.turnToPage(cur); state(cur); } };
    dlg.onkeydown = function (e) { if (!pf) return; if (e.key === 'ArrowRight') pf.flipNext(); if (e.key === 'ArrowLeft') pf.flipPrev(); };
    dlg.oncancel = function (e) { e.preventDefault(); close(); };
    setTimeout(function () { var t = dlg.querySelector('#pfTip'); if (t) t.classList.add('is-off'); }, 6000);
    function close() { window.removeEventListener('resize', onResize); if (pf) { try { pf.destroy(); } catch (e) { } pf = null; } dlg.close(); if (o.onClose) o.onClose(urls); }
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  window.PBKFlip = { open: open };
})();
