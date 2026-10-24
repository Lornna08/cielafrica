/* ==========================================================================
   NJIA — core: utilities, icons, images, template data layer, router
   NJIA.db is the only place that reads or writes state. In template mode it
   keeps everything in this browser; swap its methods for API calls (e.g.
   WooCommerce Store API / your own back end) to connect a real store.
   ========================================================================== */
(function () {
  var N = window.NJIA, C = N.config;

  /* ---------- theme tokens ---------- */
  var t = C.theme, rs = document.documentElement.style;
  Object.keys(t).forEach(function (k) { rs.setProperty('--' + k, t[k]); });

  /* ---------- utils ---------- */
  var U = N.u = {};
  U.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  U.money = function (n) { return C.currency.prefix + Math.round(n).toLocaleString('en-US'); };
  U.$ = function (s, r) { return (r || document).querySelector(s); };
  U.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  U.reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  U.uid = function (p) { return p + Math.random().toString(36).slice(2, 10).toUpperCase(); };
  U.date = function (iso) { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); };
  U.plural = function (n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); };

  /* ---------- images (Unsplash photos, self-hosted as WebP in img/u/) ----------
     Editorial photos are stored in black and white at 900/1600 px, product
     photos in colour at 480/960 px. Swap in your own files with the same names. */
  var E0 = N.editorial, MONO = {};
  [E0.hero, E0.details, E0.detailsInset, E0.custom, E0.customHero, E0.customDetail].concat(E0.tiles, N.lookbook.looks).forEach(function (x) { MONO[x.img] = 1; });
  U.sizesOf = function (id) { return MONO[id] ? [900, 1600] : [480, 960]; };
  U.src = function (id, w) { var s = U.sizesOf(id), pick = w > s[0] ? s[1] : s[0]; return 'img/u/' + id.replace('photo-', '') + '-' + pick + '.webp'; };
  U.img = function (id, o) {
    o = o || {};
    var ws = U.sizesOf(id), want = (o.widths || [360, 600, 900])[1] || 600;
    var set = ws.map(function (w) { return U.src(id, w) + ' ' + w + 'w'; }).join(', ');
    return '<img src="' + U.src(id, want) + '" srcset="' + set + '" sizes="' + (o.sizes || '(max-width: 760px) 50vw, 25vw') + '" alt="' + U.esc(o.alt || '') + '"' +
      (o.pos ? ' style="object-position:' + o.pos + '"' : '') + (o.eager ? ' fetchpriority="high"' : ' loading="lazy"') + ' decoding="async"' + (o.cls ? ' class="' + o.cls + '"' : '') + '>';
  };

  /* ---------- icons (1.5 stroke, 24 grid) ---------- */
  var P = {
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    bag: '<path d="M5.5 8h13l-.9 12.2H6.4z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
    user: '<circle cx="12" cy="8.5" r="3.7"/><path d="M4.8 20.2c1.2-3.6 4-5.4 7.2-5.4s6 1.8 7.2 5.4"/>',
    menu: '<path d="M4 7.5h16M4 12h16M4 16.5h16"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    arrow: '<path d="M5 12h14M13.5 6.5 19 12l-5.5 5.5"/>',
    left: '<path d="M14.5 6 8.5 12l6 6"/>', right: '<path d="M9.5 6l6 6-6 6"/>',
    down: '<path d="M6.5 9.5 12 15l5.5-5.5"/>',
    plus: '<path d="M12 5.5v13M5.5 12h13"/>', minus: '<path d="M5.5 12h13"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    filter: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
    truck: '<path d="M2.5 6.5h11v9.5h-11zM13.5 10h4l3 3v3h-7z"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    returns: '<path d="M4 9h11a5 5 0 0 1 0 10H8"/><path d="M8 5 4 9l4 4"/>',
    phone: '<rect x="7" y="2.8" width="10" height="18.4" rx="2.2"/><path d="M11 18h2"/>',
    needle: '<path d="M19.5 4.5 7 17"/><path d="M5 19l2-2M16.5 4.5l3 3"/><path d="M8 8c-3 2-4 6-1 8"/>',
    ruler: '<path d="M3.5 15.5 15.5 3.5l5 5-12 12z"/><path d="M7.5 11.5l2 2M10.5 8.5l2 2M13.5 5.5l2 2"/>',
    lock: '<rect x="5" y="11" width="14" height="9.5" rx="1.5"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/>',
    mail: '<rect x="3" y="5.5" width="18" height="13" rx="1.5"/><path d="m3.5 7 8.5 6 8.5-6"/>',
    upload: '<path d="M12 15.5V4.5M7.5 9 12 4.5 16.5 9"/><path d="M4.5 15v4.5h15V15"/>',
    pin: '<path d="M12 20.5s-6.5-5.8-6.5-10.5a6.5 6.5 0 0 1 13 0c0 4.7-6.5 10.5-6.5 10.5z"/><circle cx="12" cy="10" r="2.3"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',
    insta: '<rect x="4" y="4" width="16" height="16" rx="4.5"/><circle cx="12" cy="12" r="3.6"/><path d="M16.8 7.2h.01"/>'
  };
  U.i = function (n, s) { s = s || 20; return '<svg class="ic" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[n] || '') + '</svg>'; };
  /* wordmark: NJIA with a lane mark */
  U.logo = function () { return '<span class="logo__word">NJIA</span><svg class="logo__lane" viewBox="0 0 12 22" aria-hidden="true"><path d="M2 21 10 1" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"/></svg>'; };

  /* ---------- catalogue helpers ---------- */
  N.byId = {}; N.bySlug = {};
  N.products.forEach(function (p, i) { p.order = i; N.byId[p.id] = p; N.bySlug[p.slug] = p; });
  N.colById = {}; N.collections.forEach(function (c) { N.colById[c.id] = c; });
  var NOW = new Date('2026-10-24T12:00:00');               // template "today" so New In stays stable
  N.isNew = function (p) { return (NOW - new Date(p.added)) / 864e5 <= 30; };
  N.inStock = function (p, size) { var s = N.db.stock(p); return size ? (s[size] || 0) > 0 : Object.keys(s).some(function (k) { return s[k] > 0; }); };
  N.label = function (p) {
    if (!N.inStock(p)) return { t: 'Sold out', c: 'out' };
    if (p.was) return { t: 'Sale', c: 'sale' };
    if (N.isNew(p)) return { t: 'New', c: 'new' };
    return null;
  };
  N.inCollection = function (col, p) { return !col.rule || col.rule(p); };
  N.sorts = {
    featured: function (a, b) { return a.order - b.order; },
    newest: function (a, b) { return new Date(b.added) - new Date(a.added); },
    'price-asc': function (a, b) { return a.price - b.price; },
    'price-desc': function (a, b) { return b.price - a.price; }
  };
  N.search = function (q) {
    q = String(q || '').toLowerCase().trim(); if (!q) return [];
    var words = q.split(/\s+/);
    return N.products.map(function (p) {
      var hay = (p.name + ' ' + p.type + ' ' + p.cat + ' ' + p.tags.join(' ') + ' ' + p.colors.map(function (c) { return c.n; }).join(' ') + ' ' + (p.g === 'w' ? 'women' : p.g === 'm' ? 'men' : 'unisex women men')).toLowerCase();
      var score = 0; words.forEach(function (w) { var ws = w.replace(/s$/, ''); if (hay.indexOf(ws) >= 0) score += p.name.toLowerCase().indexOf(ws) >= 0 ? 3 : 1; else score -= 5; });
      return { p: p, s: score };
    }).filter(function (r) { return r.s > 0; }).sort(function (a, b) { return b.s - a.s; }).map(function (r) { return r.p; });
  };

  /* ---------- template data layer ---------- */
  var KEY = 'njia:template:v1';
  function blank() { return { v: 1, cart: [], orders: [], account: null, addresses: [], code: null, sold: {}, enquiries: [], news: false }; }
  var S; try { S = JSON.parse(localStorage.getItem(KEY)) || blank(); if (S.v !== 1) S = blank(); } catch (e) { S = blank(); }
  var subs = [];
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} subs.forEach(function (f) { f(); }); }

  var db = N.db = {
    state: function () { return S; },
    on: function (f) { subs.push(f); },
    stock: function (p) { var o = {}, sold = S.sold[p.id] || {}; Object.keys(p.stock).forEach(function (k) { o[k] = Math.max(0, p.stock[k] - (sold[k] || 0)); }); return o; },
    inBag: function (id, size) { return S.cart.filter(function (l) { return l.id === id && l.size === size; }).reduce(function (a, l) { return a + l.qty; }, 0); },
    count: function () { return S.cart.reduce(function (a, l) { return a + l.qty; }, 0); },
    add: function (id, o) {
      var p = N.byId[id]; o = o || {};
      if (!p) return { ok: false, msg: 'This product is no longer available.' };
      if (!o.size) return { ok: false, msg: 'Please select a size.' };
      var have = db.stock(p)[o.size] || 0, room = have - db.inBag(id, o.size), qty = Math.max(1, o.qty | 0);
      if (have <= 0) return { ok: false, msg: 'Size ' + o.size + ' is sold out.' };
      if (room <= 0) return { ok: false, msg: 'All available stock in size ' + o.size + ' is already in your bag.' };
      var q = Math.min(qty, room), color = o.color || p.colors[0].n;
      var line = S.cart.filter(function (l) { return l.id === id && l.size === o.size && l.color === color; })[0];
      if (line) line.qty += q; else S.cart.push({ key: U.uid('L'), id: id, size: o.size, color: color, qty: q });
      save();
      return { ok: true, qty: q, capped: q < qty, line: line || S.cart[S.cart.length - 1] };
    },
    setQty: function (key, qty) {
      var l = S.cart.filter(function (x) { return x.key === key; })[0]; if (!l) return;
      if (qty <= 0) return db.remove(key);
      var p = N.byId[l.id], max = (db.stock(p)[l.size] || 0) - (db.inBag(l.id, l.size) - l.qty);
      l.qty = Math.max(1, Math.min(qty, max)); save();
    },
    maxFor: function (l) { var p = N.byId[l.id]; return (db.stock(p)[l.size] || 0) - (db.inBag(l.id, l.size) - l.qty); },
    remove: function (key) { S.cart = S.cart.filter(function (l) { return l.key !== key; }); save(); },
    lines: function () { return S.cart.map(function (l) { var p = N.byId[l.id]; return p ? { l: l, p: p, total: p.price * l.qty } : null; }).filter(Boolean); },
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
      var ship = !m ? null : (free ? 0 : m.price);
      return { sub: sub, disc: disc, code: d ? d.code : null, ship: ship, free: free, total: sub - disc + (ship || 0), toFree: Math.max(0, C.shipping.freeOver - (sub - disc)) };
    },
    placeOrder: function (o) {
      var ref = 'NJ-' + Math.random().toString(36).slice(2, 8).toUpperCase();
      var tt = db.totals(o.method);
      var order = { ref: ref, at: new Date().toISOString(), status: 'Paid', contact: o.contact, address: o.address, method: o.method, pay: o.pay, receipt: o.receipt,
        lines: db.lines().map(function (x) { return { id: x.p.id, name: x.p.name, size: x.l.size, color: x.l.color, qty: x.l.qty, price: x.p.price }; }), totals: tt };
      order.lines.forEach(function (l) { S.sold[l.id] = S.sold[l.id] || {}; S.sold[l.id][l.size] = (S.sold[l.id][l.size] || 0) + l.qty; });
      S.orders.unshift(order); S.cart = []; S.code = null; save();
      return order;
    },
    order: function (ref) { return S.orders.filter(function (o) { return o.ref === ref; })[0]; },
    signIn: function (a) { S.account = { name: a.name || a.email.split('@')[0], email: a.email, phone: a.phone || '' }; save(); },
    signOut: function () { S.account = null; save(); },
    saveDetails: function (d) { S.account = Object.assign({}, S.account, d); save(); },
    saveAddress: function (a) { if (a.id) S.addresses = S.addresses.map(function (x) { return x.id === a.id ? a : x; }); else { a.id = U.uid('A'); S.addresses.push(a); } save(); },
    removeAddress: function (id) { S.addresses = S.addresses.filter(function (x) { return x.id !== id; }); save(); },
    enquire: function (e) { e.at = new Date().toISOString(); e.ref = 'CM-' + Math.random().toString(36).slice(2, 7).toUpperCase(); S.enquiries.unshift(e); save(); return e; },
    subscribe: function () { S.news = true; save(); }
  };

  /* ---------- payments ----------
     Template mode simulates the M-Pesa STK push so the whole flow can be tried
     without a real charge. To go live, replace with calls to your server, which
     sends the STK push (Daraja) and confirms the result with an STK query
     before the order is marked paid. Never put API keys in this file. */
  N.pay = {
    mpesa: function (phone, amount) {
      return new Promise(function (res) { setTimeout(function () { res({ ok: true, receipt: 'TPL' + Math.random().toString(36).slice(2, 9).toUpperCase() }); }, 3200); });
    }
  };

  /* ---------- router (history API under basePath; hash on file://) ---------- */
  var FILE = location.protocol === 'file:';
  var BASE = C.store.basePath;
  N.path = function () {
    if (FILE) return (location.hash || '#/').replace(/^#\/?/, '');
    var p = location.pathname; if (p.indexOf(BASE) === 0) p = p.slice(BASE.length); else if (p + '/' === BASE) p = '';
    return p.replace(/\/+$/, '');
  };
  N.href = function (to) { return FILE ? '#/' + to : to; };
  N.routes = [];
  N.route = function (re, fn) { N.routes.push([re, fn]); };
  N.go = function (to, o) {
    o = o || {};
    if (FILE) { location.hash = '#/' + to; return; }
    var url = BASE + to;
    if (o.replace) history.replaceState({}, '', url); else history.pushState({}, '', url);
    N.render(o);
  };
  N.render = function (o) {
    o = o || {};
    var full = N.path(), q = full.split('?'), path = q[0], params = new URLSearchParams(FILE ? (q[1] || '') : location.search);
    for (var i = 0; i < N.routes.length; i++) {
      var m = path.match(N.routes[i][0]);
      if (m) { if (N.onLeave) { N.onLeave(); N.onLeave = null; } N.closeLayers && N.closeLayers(); N.current = path; N.routes[i][1](m, params); if (!o.keepScroll) window.scrollTo(0, 0); if (N.afterRender) N.afterRender(path); return; }
    }
    N.notFound && N.notFound();
  };
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.target || a.hasAttribute('download') || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    var h = a.getAttribute('href');
    if (h.charAt(0) === '#' && h.length > 1) { var tg = document.getElementById(h.slice(1)); if (tg) { e.preventDefault(); tg.scrollIntoView({ behavior: U.reduce ? 'auto' : 'smooth' }); if (tg.tabIndex < 0 && !tg.hasAttribute('tabindex')) tg.setAttribute('tabindex', '-1'); tg.focus({ preventScroll: true }); } return; }
    if (/^(https?:|mailto:|tel:|#|\.\.\/|\/(?!njia))/.test(h)) return;
    if (FILE) { if (h.indexOf('#/') !== 0) { e.preventDefault(); location.hash = '#/' + h; } return; }
    e.preventDefault(); N.go(h.replace(/^\/njia\//, ''));
  });
  window.addEventListener('popstate', function () { N.render({ keepScroll: false }); });
  if (FILE) window.addEventListener('hashchange', function () { N.render(); });
})();
