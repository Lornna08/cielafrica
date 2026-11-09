/* ==========================================================================
   MOKARA — core: utilities, images, template data layer, router
   MOKARA.db is the only place that reads or writes state. In template mode it
   keeps the cart, orders and sign-ups in this browser; swap its methods for API
   calls (WooCommerce Store API, Shopify Storefront, your own back end) to
   connect a real store.
   ========================================================================== */
(function () {
  'use strict';
  var M = window.MOKARA, C = M.config;

  /* ---------- theme tokens ---------- */
  Object.keys(C.theme).forEach(function (k) { document.documentElement.style.setProperty('--' + k, C.theme[k]); });

  /* ---------- utils ---------- */
  var U = M.u = {};
  U.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  U.money = function (n) { return C.currency.prefix + Math.round(n).toLocaleString('en-US'); };
  U.$ = function (s, r) { return (r || document).querySelector(s); };
  U.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  U.reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  U.uid = function (p) { return p + Math.random().toString(36).slice(2, 10).toUpperCase(); };
  U.plural = function (n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); };
  U.stars = function (r) {
    var out = '';
    for (var i = 1; i <= 5; i++) { var f = Math.max(0, Math.min(1, r - i + 1)); out += '<i class="str" style="--f:' + Math.round(f * 100) + '%"></i>'; }
    return '<span class="stars" role="img" aria-label="' + r.toFixed(1) + ' out of 5">' + out + '</span>';
  };

  /* ---------- images ---------- */
  // product renders (transparent WebP) in img/p/<id>-<view>-<w>.webp
  U.render = function (p, view, w) { return 'img/p/' + p.id + '-' + view + '-' + w + '.webp'; };
  U.renderSet = function (p, view, ws) { return ws.map(function (w) { return U.render(p, view, w) + ' ' + w + 'w'; }).join(', '); };
  U.pimg = function (p, view, o) {
    o = o || {}; var ws = view === 'hero' ? [600, 1200] : [480, 900];
    return '<img src="' + U.render(p, view, ws[0]) + '" srcset="' + U.renderSet(p, view, ws) + '" sizes="' + (o.sizes || '(max-width: 760px) 80vw, 40vw') + '" alt="' + U.esc(o.alt != null ? o.alt : p.title + ', ' + (p.pack === 'tin' ? '250 g tin' : '250 g bag')) + '"' +
      (o.eager ? ' fetchpriority="high"' : ' loading="lazy"') + ' decoding="async"' + (o.cls ? ' class="' + o.cls + '"' : '') + ' width="' + (view === 'hero' ? 1200 : 900) + '" height="' + (view === 'hero' ? 1300 : 1125) + '">';
  };
  // Unsplash photos are hotlinked, as the Unsplash API guidelines ask
  U.photoUrl = function (key, w) { var ph = M.photos[key]; return ph ? 'https://images.unsplash.com/' + ph[0] + '?ixlib=rb-4.1.0&auto=format&fit=crop&q=70&w=' + w : ''; };
  U.photo = function (key, o) {
    o = o || {}; var ph = M.photos[key]; if (!ph) return '';
    var ws = o.widths || [480, 900, 1400];
    return '<img src="' + U.photoUrl(key, ws[1] || ws[0]) + '" srcset="' + ws.map(function (w) { return U.photoUrl(key, w) + ' ' + w + 'w'; }).join(', ') + '" sizes="' + (o.sizes || '(max-width: 760px) 100vw, 50vw') + '" alt="' + U.esc(o.alt || '') + '" loading="lazy" decoding="async"' + (o.cls ? ' class="' + o.cls + '"' : '') + ' width="' + ph[1] + '" height="' + ph[2] + '">';
  };
  U.credit = function (key) { var ph = M.photos[key]; return ph ? 'Photo: <a href="https://unsplash.com/@' + ph[4] + '?utm_source=mokara_template&utm_medium=referral" target="_blank" rel="noopener">' + U.esc(ph[3]) + '</a> / <a href="https://unsplash.com/?utm_source=mokara_template&utm_medium=referral" target="_blank" rel="noopener">Unsplash</a>' : ''; };

  /* ---------- icons (1.5 stroke, 24 grid) ---------- */
  var P = {
    bag: '<path d="M5.5 8h13l-.9 12.2H6.4z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
    menu: '<path d="M4 8h16M4 16h16"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>',
    arrow: '<path d="M5 12h14M13.5 6.5 19 12l-5.5 5.5"/>', left: '<path d="M14.5 6 8.5 12l6 6"/>', right: '<path d="M9.5 6l6 6-6 6"/>',
    plus: '<path d="M12 5.5v13M5.5 12h13"/>', minus: '<path d="M5.5 12h13"/>', check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    pause: '<path d="M9 6v12M15 6v12"/>', play: '<path d="M8 5.5v13l10.5-6.5z"/>',
    truck: '<path d="M2.5 6.5h11v9.5h-11zM13.5 10h4l3 3v3h-7z"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    flame: '<path d="M12 21c-3.6 0-6-2.4-6-5.6 0-3.8 3.3-5.6 3.8-9.4 2.3 1.4 3.4 3.6 3.3 5.5.9-.7 1.5-1.8 1.6-3 1.9 1.6 3.3 4 3.3 6.9 0 3.2-2.4 5.6-6 5.6z"/>',
    leaf: '<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14z"/><path d="M5 19 13 11"/>',
    drop: '<path d="M12 3.5s6 6.6 6 10.6a6 6 0 0 1-12 0c0-4 6-10.6 6-10.6z"/>',
    pin: '<path d="M12 20.5s-6.5-5.8-6.5-10.5a6.5 6.5 0 0 1 13 0c0 4.7-6.5 10.5-6.5 10.5z"/><circle cx="12" cy="10" r="2.3"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    mail: '<rect x="3" y="5.5" width="18" height="13" rx="1.5"/><path d="m3.5 7 8.5 6 8.5-6"/>',
    lock: '<rect x="5" y="11" width="14" height="9.5" rx="1.5"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/>',
    phone: '<rect x="7" y="2.8" width="10" height="18.4" rx="2.2"/><path d="M11 18h2"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',
    insta: '<rect x="4" y="4" width="16" height="16" rx="4.5"/><circle cx="12" cy="12" r="3.6"/><path d="M16.8 7.2h.01"/>'
  };
  U.i = function (n, s) { s = s || 20; return '<svg class="ic" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[n] || '') + '</svg>'; };

  /* ---------- catalogue helpers ---------- */
  M.byId = {}; M.products.forEach(function (p, i) { p.order = i; M.byId[p.id] = p; });
  M.originById = {}; M.origins.forEach(function (o) { M.originById[o.id] = o; });
  M.sizeById = {}; C.sizes.forEach(function (s) { M.sizeById[s.id] = s; });
  M.priceFor = function (p, sizeId) { var s = M.sizeById[sizeId] || C.sizes[0]; return Math.round(p.price * s.factor / 50) * 50; };
  M.grindLabel = function (id) { var g = C.grinds.filter(function (x) { return x.id === id; })[0]; return g ? g.label : ''; };
  M.optLabel = function (l) {
    var s = (M.sizeById[l.size] || {}).label || '', f = l.format === 'ground' ? 'Ground for ' + M.grindLabel(l.grind).toLowerCase() : 'Whole bean';
    return s + ' · ' + f;
  };

  /* ---------- template data layer ---------- */
  var KEY = 'mokara:template:v1';
  function blank() { return { v: 1, cart: [], orders: [], code: null, news: null, reviews: {} }; }
  var S; try { S = JSON.parse(localStorage.getItem(KEY)) || blank(); if (S.v !== 1) S = blank(); } catch (e) { S = blank(); }
  var subs = [];
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* private mode */ } subs.forEach(function (f) { f(); }); }

  var db = M.db = {
    state: function () { return S; },
    on: function (f) { subs.push(f); },
    count: function () { return S.cart.reduce(function (a, l) { return a + l.qty; }, 0); },
    add: function (id, o) {
      var p = M.byId[id]; o = o || {};
      if (!p) return { ok: false, msg: 'This coffee is no longer available.' };
      var size = M.sizeById[o.size] ? o.size : C.sizes[0].id, format = o.format === 'ground' ? 'ground' : 'whole', grind = format === 'ground' ? (o.grind || 'filter') : null;
      var qty = Math.max(1, Math.min(20, o.qty | 0 || 1));
      var line = S.cart.filter(function (l) { return l.id === id && l.size === size && l.format === format && l.grind === grind; })[0];
      if (line) line.qty = Math.min(20, line.qty + qty); else { line = { key: U.uid('L'), id: id, size: size, format: format, grind: grind, qty: qty }; S.cart.push(line); }
      save(); return { ok: true, line: line };
    },
    setQty: function (key, qty) { var l = S.cart.filter(function (x) { return x.key === key; })[0]; if (!l) return; if (qty <= 0) return db.remove(key); l.qty = Math.min(20, qty); save(); },
    remove: function (key) { S.cart = S.cart.filter(function (l) { return l.key !== key; }); save(); },
    lines: function () { return S.cart.map(function (l) { var p = M.byId[l.id]; if (!p) return null; var unit = M.priceFor(p, l.size); return { l: l, p: p, unit: unit, total: unit * l.qty }; }).filter(Boolean); },
    applyCode: function (code) {
      code = String(code || '').trim().toUpperCase();
      var d = C.discounts.filter(function (x) { return x.code === code; })[0];
      if (!d) return { ok: false, msg: 'That code isn’t valid.' };
      S.code = d.code; save(); return { ok: true, msg: d.label };
    },
    clearCode: function () { S.code = null; save(); },
    totals: function (methodId) {
      var sub = db.lines().reduce(function (a, x) { return a + x.total; }, 0);
      var d = S.code && C.discounts.filter(function (x) { return x.code === S.code; })[0];
      var disc = d ? Math.round(d.type === 'percent' ? sub * d.value / 100 : Math.min(sub, d.value)) : 0;
      var m = C.shipping.methods.filter(function (x) { return x.id === methodId; })[0];
      var free = sub - disc >= C.shipping.freeOver;
      var ship = !m ? null : (free || m.price === 0 ? 0 : m.price);
      return { sub: sub, disc: disc, code: d ? d.code : null, ship: ship, free: free, total: sub - disc + (ship || 0), toFree: Math.max(0, C.shipping.freeOver - (sub - disc)) };
    },
    placeOrder: function (o) {
      var ref = 'MK-' + Math.random().toString(36).slice(2, 8).toUpperCase(), tt = db.totals(o.method);
      var order = { ref: ref, at: new Date().toISOString(), status: 'Paid (template demo)', contact: o.contact, address: o.address, method: o.method, receipt: o.receipt,
        lines: db.lines().map(function (x) { return { id: x.p.id, name: x.p.title, opt: M.optLabel(x.l), qty: x.l.qty, price: x.unit }; }), totals: tt };
      S.orders.unshift(order); S.cart = []; S.code = null; save();
      return order;
    },
    order: function (ref) { return S.orders.filter(function (o) { return o.ref === ref; })[0]; },
    subscribe: function (email) { S.news = { email: email, at: new Date().toISOString() }; save(); },
    myReviews: function (id) { return S.reviews[id] || []; },
    addReview: function (id, r) { S.reviews[id] = S.reviews[id] || []; S.reviews[id].unshift({ n: r.n, r: r.r, t: r.t, mine: true, at: new Date().toISOString() }); save(); }
  };

  /* ---------- payments ----------
     Template mode simulates the M-Pesa STK push so the whole flow can be tried
     without a real charge. To go live, replace with calls to your server, which
     sends the STK push (Daraja) and confirms it with an STK query before the
     order is marked paid. Never put API keys in this file. */
  M.pay = {
    mpesa: function () { return new Promise(function (res) { setTimeout(function () { res({ ok: true, receipt: 'TEMPLATE-' + Math.random().toString(36).slice(2, 8).toUpperCase() }); }, 2600); }); }
  };

  /* ---------- router (history API under basePath; hash on file://) ---------- */
  var FILE = location.protocol === 'file:', BASE = C.store.basePath;
  M.path = function () {
    if (FILE) return (location.hash || '#/').replace(/^#\/?/, '');
    var p = location.pathname; if (p.indexOf(BASE) === 0) p = p.slice(BASE.length); else if (p + '/' === BASE) p = '';
    return p.replace(/\/+$/, '');
  };
  M.href = function (to) { return FILE ? '#/' + to : to; };
  M.routes = [];
  M.route = function (re, fn) { M.routes.push([re, fn]); };
  M.go = function (to, o) {
    o = o || {};
    if (FILE) { location.hash = '#/' + to; return; }
    var url = BASE + to;
    if (o.replace) history.replaceState({}, '', url); else history.pushState({}, '', url);
    M.render(o);
  };
  M.render = function (o) {
    o = o || {};
    var full = M.path(), q = full.split('?'), path = q[0], params = new URLSearchParams(FILE ? (q[1] || '') : location.search);
    for (var i = 0; i < M.routes.length; i++) {
      var m = path.match(M.routes[i][0]);
      if (m) {
        if (M.onLeave) { try { M.onLeave(); } catch (e) { /* */ } M.onLeave = null; }
        if (M.closeLayers) M.closeLayers();
        M.current = path; M.routes[i][1](m, params);
        if (!o.keepScroll && !M.pendingScroll) window.scrollTo(0, 0);
        if (M.afterRender) M.afterRender(path);
        return;
      }
    }
    if (M.notFound) M.notFound();
  };
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.target || a.hasAttribute('download') || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    var h = a.getAttribute('href');
    if (/^(https?:|mailto:|tel:|\.\.\/|\/(?!mokara))/.test(h)) return;
    if (h.charAt(0) === '#') return;
    if (FILE) { if (h.indexOf('#/') !== 0) { e.preventDefault(); location.hash = '#/' + h; } return; }
    e.preventDefault(); M.go(h.replace(/^\/mokara\//, ''));
  });
  window.addEventListener('popstate', function () { M.render(); });
  if (FILE) window.addEventListener('hashchange', function () { M.render(); });
})();
