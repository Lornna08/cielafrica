/* ==========================================================================
   MOKARA — shared UI: header, footer, cart drawer, toasts, floating beans
   ========================================================================== */
(function () {
  'use strict';
  var M = window.MOKARA, C = M.config, U = M.u, db = M.db, esc = U.esc;

  /* ---------- header ---------- */
  var NAV = [['shop', 'Shop'], ['origins', 'Origins'], ['brew', 'Brewing'], ['story', 'Our story']];
  U.logo = function () { return '<span class="logo__w">MOKARA</span>'; };
  function header() {
    U.$('#hdr').innerHTML = '<header class="hd" id="hd"><div class="hd__in">' +
      '<a class="logo" href="' + M.href('') + '" aria-label="MOKARA home">' + U.logo() + '</a>' +
      '<nav class="hd__nav" aria-label="Main">' + NAV.map(function (n) { return '<a href="' + M.href(n[0]) + '" data-nav="' + n[0] + '">' + n[1] + '</a>'; }).join('') + '</nav>' +
      '<div class="hd__r"><button class="cartpill" type="button" data-cart aria-label="Open cart">Cart · <b id="cartN">0</b></button>' +
      '<button class="hd__menu" type="button" id="menuBtn" aria-label="Menu" aria-expanded="false">' + U.i('menu', 22) + '</button></div></div></header>' +
      '<div class="mnav" id="mnav" hidden><nav aria-label="Menu">' + [['', 'Home']].concat(NAV).map(function (n, i) { return '<a href="' + M.href(n[0]) + '" style="--i:' + i + '"><span>0' + (i + 1) + '</span>' + n[1] + '</a>'; }).join('') + '</nav>' +
      '<p class="mnav__f">' + esc(C.roastDays) + '</p></div>';
    U.$('#menuBtn').addEventListener('click', function () { var o = U.$('#mnav').hidden; toggleMenu(o); });
    count();
  }
  function toggleMenu(open) {
    var m = U.$('#mnav'), b = U.$('#menuBtn'); if (!m) return;
    m.hidden = !open; b.setAttribute('aria-expanded', open ? 'true' : 'false'); b.innerHTML = U.i(open ? 'x' : 'menu', 22);
    document.body.classList.toggle('lock', !!open);
  }
  function count() { var n = U.$('#cartN'); if (n) n.textContent = db.count(); }
  db.on(count);
  window.addEventListener('scroll', function () { var h = U.$('#hd'); if (h) h.classList.toggle('hd--s', scrollY > 30); }, { passive: true });

  /* ---------- footer ---------- */
  function footer() {
    var c = C.contact;
    U.$('#ftr').innerHTML = '<footer class="ft"><div class="ft__in"><div class="ft__brand"><a class="logo logo--lg" href="' + M.href('') + '">' + U.logo() + '</a><p>' + esc(C.store.tagline) + '</p></div>' +
      '<div class="ft__cols"><div><h4>Shop</h4><a href="' + M.href('shop') + '">All coffees</a>' + M.products.map(function (p) { return '<a href="' + M.href('coffee/' + p.id) + '">' + esc(p.title) + '</a>'; }).join('') + '</div>' +
      '<div><h4>Learn</h4><a href="' + M.href('origins') + '">Origins</a><a href="' + M.href('process') + '">Bean to cup</a><a href="' + M.href('brew') + '">Brew guides</a><a href="' + M.href('discover') + '">Find your coffee</a><a href="' + M.href('story') + '">Our story</a></div>' +
      '<div><h4>Help</h4>' + (c.email ? '<a href="mailto:' + esc(c.email) + '">' + esc(c.email) + '</a>' : '') + (c.hours ? '<span>' + esc(c.hours) + '</span>' : '') + '<span>' + esc(C.roastDays) + '</span><a href="' + M.href('credits') + '">Photo credits</a></div></div></div>' +
      '<div class="ft__b"><span>© 2026 MOKARA — a store template by <a href="../index.html">Ciel Africa</a>. Sample brand, products and prices.</span><span>Payments shown are simulated in template mode.</span></div></footer>';
  }

  /* ---------- layers (drawer, menu) ---------- */
  M.closeLayers = function () { toggleMenu(false); closeDrawer(); var t = U.$('#toast'); if (t) t.className = 'toast'; };
  var lastFocus = null;
  function drawer() {
    var el = document.createElement('div'); el.id = 'drawer'; el.className = 'dr'; el.hidden = true;
    el.innerHTML = '<div class="dr__bg" data-close></div><aside class="dr__p" role="dialog" aria-modal="true" aria-labelledby="drT"><div class="dr__h"><h2 id="drT">Your cart</h2><button type="button" class="ib" data-close aria-label="Close cart">' + U.i('x') + '</button></div><div class="dr__b" id="drB"></div></aside>';
    document.body.appendChild(el);
    el.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) return closeDrawer();
      var b = e.target.closest('button[data-q]'); if (b) { var l = db.state().cart.filter(function (x) { return x.key === b.dataset.k; })[0]; if (l) db.setQty(l.key, l.qty + (+b.dataset.q)); return; }
      var r = e.target.closest('button[data-rm]'); if (r) db.remove(r.dataset.rm);
    });
    el.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawer(); trap(e, el.querySelector('.dr__p')); });
    db.on(function () { if (!el.hidden) fillDrawer(); });
  }
  function fillDrawer() {
    var lines = db.lines(), t = db.totals();
    U.$('#drB').innerHTML = !lines.length ? '<div class="dr__empty"><img src="img/beans/bean-dark-2-240.webp" alt="" width="120" height="120"><p>Your cart is empty.</p><a class="btn btn--d" href="' + M.href('shop') + '">Shop coffee</a></div>' :
      '<div class="ship">' + (t.toFree > 0 ? 'Add <b>' + U.money(t.toFree) + '</b> for free delivery' : '<b>Free delivery</b> unlocked') + '<i><b style="width:' + Math.min(100, Math.round((t.sub - t.disc) / C.shipping.freeOver * 100)) + '%"></b></i></div>' +
      '<ul class="cl">' + lines.map(lineHtml).join('') + '</ul>' +
      '<div class="dr__f"><div class="row"><span>Subtotal</span><b>' + U.money(t.sub) + '</b></div>' + (t.disc ? '<div class="row"><span>Discount (' + esc(t.code) + ')</span><b>−' + U.money(t.disc) + '</b></div>' : '') +
      '<p class="muted sm">Delivery is calculated at checkout. ' + esc(C.roastDays) + '</p><a class="btn btn--d btn--full" href="' + M.href('checkout') + '">Checkout · ' + U.money(t.sub - t.disc) + '</a><a class="btn btn--g btn--full" href="' + M.href('cart') + '">View cart</a></div>';
  }
  function lineHtml(x) {
    return '<li class="cl__i"><a class="cl__img" href="' + M.href('coffee/' + x.p.id) + '" style="background:' + x.p.bg + '"><img src="' + U.render(x.p, 'front', 480) + '" alt="" loading="lazy"></a><div class="cl__b"><a href="' + M.href('coffee/' + x.p.id) + '"><b>' + esc(x.p.title) + '</b></a><span>' + esc(M.optLabel(x.l)) + '</span>' +
      '<div class="cl__r"><div class="qty"><button type="button" data-q="-1" data-k="' + x.l.key + '" aria-label="Fewer">' + U.i('minus', 16) + '</button><span>' + x.l.qty + '</span><button type="button" data-q="1" data-k="' + x.l.key + '" aria-label="More">' + U.i('plus', 16) + '</button></div><b>' + U.money(x.total) + '</b></div>' +
      '<button type="button" class="cl__rm" data-rm="' + x.l.key + '">Remove</button></div></li>';
  }
  U.lineHtml = lineHtml;
  function openDrawer() { var el = U.$('#drawer'); lastFocus = document.activeElement; fillDrawer(); el.hidden = false; document.body.classList.add('lock'); requestAnimationFrame(function () { el.classList.add('on'); var f = el.querySelector('.dr__h button'); if (f) f.focus(); }); }
  function closeDrawer() { var el = U.$('#drawer'); if (!el || el.hidden) return; el.classList.remove('on'); document.body.classList.remove('lock'); setTimeout(function () { el.hidden = true; }, U.reduce ? 0 : 320); if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  M.openCart = openDrawer;
  /* on the home page, section links scroll smoothly instead of redrawing the page */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]'); if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    var t = a.getAttribute('href').replace(/^#\//, ''); if (!/^(origins|brew|story|discover|process)$/.test(t) || !U.$('#hx') || !U.$('#' + t)) return;
    e.preventDefault(); e.stopImmediatePropagation(); toggleMenu(false);
    if (location.protocol !== 'file:') history.pushState({}, '', C.store.basePath + t);
    M.current = t; M.afterRender(t);
    window.scrollTo({ top: U.$('#' + t).getBoundingClientRect().top + scrollY - 70, behavior: U.reduce ? 'auto' : 'smooth' });
  }, true);
  function trap(e, box) {
    if (e.key !== 'Tab') return;
    var f = U.$$('a[href],button:not([disabled]),input,select,textarea', box).filter(function (x) { return x.offsetParent !== null; }); if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  }
  U.trap = trap;
  document.addEventListener('click', function (e) { if (e.target.closest('[data-cart]')) { e.preventDefault(); openDrawer(); } });

  /* ---------- toast ---------- */
  var tt;
  U.toast = function (html, kind) {
    var t = U.$('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite'); document.body.appendChild(t); }
    t.innerHTML = html; t.className = 'toast on' + (kind ? ' toast--' + kind : ''); clearTimeout(tt); tt = setTimeout(function () { t.className = 'toast'; }, 3800);
  };
  U.added = function (p, l) {
    U.toast('<span class="toast__img" style="background:' + p.bg + '"><img src="' + U.render(p, 'front', 480) + '" alt=""></span><span><b>Added to cart</b>' + esc(p.title) + ' · ' + esc(M.optLabel(l)) + '</span><button type="button" data-cart>View cart</button>');
  };
  /* quick add from cards: 250 g whole bean */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-add]'); if (!b) return;
    e.preventDefault();
    var r = db.add(b.dataset.add, { size: b.dataset.size || '250g', format: b.dataset.format || 'whole', grind: b.dataset.grind, qty: +b.dataset.qty || 1 });
    if (r.ok) { U.added(M.byId[b.dataset.add], r.line); b.classList.add('ok'); setTimeout(function () { b.classList.remove('ok'); }, 1200); } else U.toast(esc(r.msg), 'err');
  });

  /* ---------- floating beans ---------- */
  U.beans = function (host, n, o) {
    o = o || {}; var seed = o.seed || 1, rnd = function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    var html = '';
    for (var i = 0; i < n; i++) {
      var s = (o.min || 26) + rnd() * ((o.max || 64) - (o.min || 26)), x = rnd() * 100, y = (o.top || 14) + rnd() * (90 - (o.top || 14)), r = Math.round(rnd() * 360), d = (0.4 + rnd() * 1.2).toFixed(2), k = Math.floor(rnd() * 6);
      if (o.avoid && x > o.avoid[0] && x < o.avoid[1]) x = rnd() < 0.5 ? rnd() * o.avoid[0] : o.avoid[1] + rnd() * (100 - o.avoid[1]);
      html += '<img class="bean" src="img/beans/bean-' + (o.kind || 'dark') + '-' + (k % (o.kinds || 6)) + '-240.webp" alt="" aria-hidden="true" style="--x:' + x.toFixed(1) + '%;--y:' + y.toFixed(1) + '%;--s:' + Math.round(s) + 'px;--r:' + r + 'deg;--d:' + d + ';--t:' + (6 + rnd() * 6).toFixed(1) + 's;--dl:-' + (rnd() * 6).toFixed(1) + 's" loading="lazy" decoding="async">';
    }
    var layer = document.createElement('div'); layer.className = 'beans'; layer.setAttribute('aria-hidden', 'true'); layer.innerHTML = html; host.appendChild(layer);
    if (U.reduce || !matchMedia('(hover: hover)').matches) return layer;
    host.addEventListener('pointermove', function (e) { var r = host.getBoundingClientRect(); layer.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3)); layer.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3)); });
    return layer;
  };

  /* ---------- reveal on scroll ---------- */
  U.reveal = function (root) {
    var els = U.$$('[data-rv]:not(.in)', root);
    if (U.reduce || !('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (e) { io.observe(e); });
  };

  M.afterRender = function (path) {
    U.$$('[data-nav]').forEach(function (a) { var on = path === a.dataset.nav || (a.dataset.nav === 'shop' && /^coffee\//.test(path)); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    document.body.dataset.page = path.split('/')[0] || 'home';
    U.reveal(document);
    var app = U.$('#app'); if (app && M.focusMain) { app.focus({ preventScroll: true }); }
    M.focusMain = true;
  };
  M.setTitle = function (t) { document.title = t ? t + ' | MOKARA' : 'MOKARA | Specialty coffee, roasted to order'; };

  header(); footer(); drawer();
})();
