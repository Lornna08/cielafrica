/* ==========================================================================
   APEX MOTION — core: utilities, icons, template data layer, router
   The data layer (APEX.db) is the only place that reads or writes state.
   Swap its methods for API calls to connect a real backend.
   ========================================================================== */
(function () {
  var A = window.APEX, C = A.config;

  /* ---------- theme tokens from config ---------- */
  var t = C.theme, rs = document.documentElement.style;
  rs.setProperty('--ivory', t.ivory); rs.setProperty('--white', t.white); rs.setProperty('--ink', t.ink);
  rs.setProperty('--charcoal', t.charcoal); rs.setProperty('--accent', t.accent); rs.setProperty('--accent-ink', t.accentInk);
  rs.setProperty('--muted', t.muted); rs.setProperty('--line', t.line); rs.setProperty('--fd', t.fontDisplay); rs.setProperty('--ft', t.fontText);

  /* ---------- utils ---------- */
  var U = A.u = {};
  U.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  U.money = function (n) {
    var c = C.currency;
    return c.symbol + Number(n).toLocaleString(c.locale, { minimumFractionDigits: c.decimals, maximumFractionDigits: c.decimals });
  };
  U.date = function (iso) { var d = new Date(iso + (iso.length === 10 ? 'T12:00:00' : '')); return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); };
  U.$ = function (s, r) { return (r || document).querySelector(s); };
  U.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  U.reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  U.uid = function (p) { return p + '-' + Math.random().toString(36).slice(2, 8).toUpperCase(); };
  U.stars = function (r) {
    var s = '', i; for (i = 1; i <= 5; i++) {
      var f = r >= i ? 1 : (r >= i - 0.5 ? 0.5 : 0);
      s += '<svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="sg' + i + (f * 10) + '"><stop offset="' + (f * 100) + '%" stop-color="currentColor"/><stop offset="' + (f * 100) + '%" stop-color="#D9D4C7"/></linearGradient></defs><path fill="url(#sg' + i + (f * 10) + ')" d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.5L12 17.3l-5.9 3.2 1.3-6.5L2.5 9.4l6.6-.8z"/></svg>';
    }
    return '<span class="stars" aria-label="' + r + ' out of 5 (sample rating)">' + s + '</span>';
  };

  /* ---------- icons (stroke, 24 grid) ---------- */
  var P = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    heart: '<path d="M12 20s-7-4.4-9.2-8.6C1.3 8.5 3 5 6.4 5c2.1 0 3.4 1.2 4.1 2.3.4.6 1.2.6 1.6 0C12.8 6.2 14.1 5 16.2 5 19.6 5 21.3 8.5 19.8 11.4 17.6 15.6 12 20 12 20z"/>',
    bag: '<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.3-4 4.4-6 8-6s6.7 2 8 6"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowL: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    list: '<rect x="4" y="5" width="5" height="5" rx="1"/><rect x="4" y="14" width="5" height="5" rx="1"/><path d="M12 7.5h8M12 16.5h8"/>',
    truck: '<path d="M2 6h12v10H2zM14 10h4l3 3v3h-7z"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
    shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    returns: '<path d="M4 9h11a5 5 0 0 1 0 10H8"/><path d="M8 5 4 9l4 4"/>',
    gauge: '<path d="M4 16a8 8 0 1 1 16 0"/><path d="M12 16l4-5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    car: '<path d="M3 15l2-5c.4-1 1.3-1.6 2.4-1.6h9.2c1.1 0 2 .6 2.4 1.6l2 5v3H3z"/><circle cx="7.5" cy="16.5" r="1.5"/><circle cx="16.5" cy="16.5" r="1.5"/>',
    wheel: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v6M12 15v6M3 12h6M15 12h6M5.6 5.6l4.3 4.3M14.1 14.1l4.3 4.3M18.4 5.6l-4.3 4.3M9.9 14.1l-4.3 4.3"/>',
    tyre: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"/>',
    piston: '<rect x="7" y="3" width="10" height="8" rx="1.5"/><path d="M7 6h10M10 11l-2 10M14 11l2 10M8 21h8"/>',
    spring: '<path d="M8 3h8M8 21h8M8 5l8 2-8 2 8 2-8 2 8 2-8 2 8 2"/>',
    disc: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/><path d="M17 5.5c2 1.3 3.3 3.3 3.8 5.6"/><circle cx="8" cy="8" r=".6"/><circle cx="16" cy="16" r=".6"/><circle cx="8" cy="16" r=".6"/><circle cx="16" cy="8" r=".6"/>',
    lamp: '<path d="M4 8c0-1 1-2 2-2h6c4 0 7 2.7 7 6s-3 6-7 6H6c-1 0-2-1-2-2z"/><path d="M20 9l2-1M20 15l2 1M21 12h2"/>',
    seat: '<path d="M8 3h5a2 2 0 0 1 2 2l-1 9H7L6 5a2 2 0 0 1 2-2z"/><path d="M7 14l-1 4h11l1-4M9 18v3M14 18v3"/>',
    tool: '<path d="M14.5 5.5a4 4 0 0 0-5 5L4 16l4 4 5.5-5.5a4 4 0 0 0 5-5l-2.5 2.5-3-.5-.5-3z"/>',
    coupe: '<path d="M2 16c0-2 1-3 3-3.5L9 9h6l5 3.5c1.3.4 2 1.4 2 3.5"/><path d="M2 16h20"/><circle cx="6.5" cy="16.5" r="2"/><circle cx="17.5" cy="16.5" r="2"/>',
    gt: '<path d="M1.5 16c.3-2 1.5-3 3.5-3.4L10 9.5h4.5l6 3.2c1.5.5 2 1.5 2 3.3"/><path d="M1.5 16h21"/><circle cx="6.5" cy="16.5" r="2"/><circle cx="18" cy="16.5" r="2"/>',
    suv: '<path d="M2 16v-3l2-5h12l4 4c1.2.3 2 1 2 2v2"/><path d="M2 16h20M8 8v4M2 12h18"/><circle cx="6.5" cy="16.5" r="2"/><circle cx="17.5" cy="16.5" r="2"/>',
    reset: '<path d="M4 4v6h6"/><path d="M20 12a8 8 0 1 1-2.3-5.7L20 9"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>'
  };
  U.i = function (n, s, extra) { return '<svg width="' + (s || 20) + '" height="' + (s || 20) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + (extra || '') + '>' + (P[n] || '') + '</svg>'; };
  U.logo = function (light) {
    return '<svg class="logo__mark" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3 3 28h6.5L16 15l6.5 13H29z" fill="' + (light ? '#fff' : 'currentColor') + '"/><path d="M11.8 24h8.4l-1.6-3.2h-5.2z" fill="' + C.theme.accent + '"/></svg><b>' + U.esc(C.store.short) + '</b><span>' + U.esc(C.store.shortTail) + '</span>';
  };

  /* ---------- catalogue indexes ---------- */
  A.bySlug = {}; A.byId = {};
  A.products.forEach(function (p) { A.bySlug[p.slug] = p; A.byId[p.id] = p; });
  A.brandById = {}; A.brands.forEach(function (b) { A.brandById[b.id] = b; });
  A.catById = {}; A.categories.forEach(function (c) { A.catById[c.id] = c; });
  A.vehicleById = {}; A.vehicles.forEach(function (v) { A.vehicleById[v.id] = v; });
  A.collections.forEach(function (c) { c.count = A.products.filter(function (p) { return (p.tags || []).indexOf(c.tag) >= 0; }).length; });

  /* ---------- template data layer ---------- */
  var KEY = 'apexmotion:demo:v1';
  var blank = function () { return { v: 1, cart: [], wish: [], orders: [], account: null, addresses: [], vehicle: null, code: null, stock: {}, news: false }; };
  var S;
  try { S = JSON.parse(localStorage.getItem(KEY)) || blank(); if (S.v !== 1) S = blank(); } catch (e) { S = blank(); }
  var subs = [];
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} subs.forEach(function (f) { f(); }); }

  var db = A.db = {
    state: function () { return S; },
    on: function (f) { subs.push(f); },
    stockOf: function (id) { var p = A.byId[id]; var d = S.stock[id] || 0; return Math.max(0, (p ? p.stock : 0) - d); },
    inCart: function (id) { return S.cart.filter(function (l) { return l.id === id; }).reduce(function (a, l) { return a + l.qty; }, 0); },
    /* cart */
    add: function (id, qty, opts) {
      opts = opts || {}; qty = Math.max(1, qty | 0);
      var p = A.byId[id]; if (!p) return { ok: false, msg: 'Product not found' };
      var avail = db.stockOf(id) - db.inCart(id);
      if (avail <= 0) return { ok: false, msg: db.stockOf(id) ? 'You already have all available stock in your bag' : p.name + ' is out of stock' };
      var q = Math.min(qty, avail);
      var size = opts.size || (p.sizes ? p.sizes[0] : ''), finish = opts.finish || (p.finishes ? p.finishes[0].n : '');
      var line = S.cart.filter(function (l) { return l.id === id && l.size === size && l.finish === finish; })[0];
      if (line) line.qty += q; else S.cart.push({ key: U.uid('L'), id: id, size: size, finish: finish, qty: q });
      save();
      return { ok: true, qty: q, capped: q < qty };
    },
    setQty: function (key, qty) {
      var l = S.cart.filter(function (x) { return x.key === key; })[0]; if (!l) return;
      if (qty <= 0) { db.remove(key); return; }
      var others = db.inCart(l.id) - l.qty;
      l.qty = Math.min(qty, Math.max(1, db.stockOf(l.id) - others)); save();
    },
    remove: function (key) { S.cart = S.cart.filter(function (l) { return l.key !== key; }); save(); },
    lines: function () { return S.cart.map(function (l) { var p = A.byId[l.id]; return p ? { l: l, p: p, total: p.price * l.qty } : null; }).filter(Boolean); },
    count: function () { return S.cart.reduce(function (a, l) { return a + l.qty; }, 0); },
    applyCode: function (code) {
      code = String(code || '').trim().toUpperCase();
      var d = C.discounts.filter(function (x) { return x.code === code; })[0];
      if (!d) return { ok: false, msg: 'That code isn\'t valid. Try APEX10 in this template.' };
      S.code = d.code; save(); return { ok: true, d: d };
    },
    clearCode: function () { S.code = null; save(); },
    totals: function (shipId) {
      var sub = db.lines().reduce(function (a, x) { return a + x.total; }, 0);
      var d = S.code ? C.discounts.filter(function (x) { return x.code === S.code; })[0] : null, disc = 0, note = '';
      if (d) {
        if (d.minSubtotal && sub < d.minSubtotal) note = 'Add ' + U.money(d.minSubtotal - sub) + ' to use ' + d.code;
        else disc = d.type === 'percent' ? Math.round(sub * d.value / 100) : Math.min(d.value, sub);
      }
      var m = C.shipping.methods.filter(function (x) { return x.id === (shipId || 'standard'); })[0] || C.shipping.methods[0];
      var ship = sub === 0 ? 0 : (m.id === 'standard' && sub - disc >= C.shipping.freeOver ? 0 : m.price);
      return { sub: sub, disc: disc, code: d, note: note, ship: ship, method: m, total: Math.max(0, sub - disc + ship) };
    },
    /* wishlist */
    isWish: function (id) { return S.wish.indexOf(id) >= 0; },
    toggleWish: function (id) { var i = S.wish.indexOf(id); if (i >= 0) S.wish.splice(i, 1); else S.wish.push(id); save(); return i < 0; },
    /* vehicle */
    setVehicle: function (id) { S.vehicle = id || null; save(); },
    vehicle: function () { return S.vehicle ? A.vehicleById[S.vehicle] : null; },
    /* account (browser-only template) */
    signIn: function (name, email) { S.account = { name: name, email: email, since: new Date().toISOString().slice(0, 10) }; save(); },
    signOut: function () { S.account = null; save(); },
    addAddress: function (a) { a.id = U.uid('A'); S.addresses.push(a); save(); return a; },
    removeAddress: function (id) { S.addresses = S.addresses.filter(function (a) { return a.id !== id; }); save(); },
    /* orders (simulated) */
    placeOrder: function (info) {
      var lines = db.lines(); if (!lines.length) return { ok: false, msg: 'Your bag is empty' };
      for (var i = 0; i < lines.length; i++) {
        var x = lines[i]; if (db.inCart(x.p.id) > db.stockOf(x.p.id)) return { ok: false, msg: 'Only ' + db.stockOf(x.p.id) + ' of ' + x.p.name + ' left. Update your bag and try again.' };
      }
      var tt = db.totals(info.ship);
      var o = { id: 'AM-' + String(Date.now()).slice(-6), date: new Date().toISOString(), status: 'Confirmed (template)',
        lines: lines.map(function (x) { return { id: x.p.id, name: x.p.name, size: x.l.size, finish: x.l.finish, qty: x.l.qty, price: x.p.price }; }),
        sub: tt.sub, disc: tt.disc, code: tt.code ? tt.code.code : null, ship: tt.ship, method: tt.method.name, total: tt.total,
        contact: { name: info.name, email: info.email, phone: info.phone }, address: info.address, pay: info.pay };
      lines.forEach(function (x) { S.stock[x.p.id] = (S.stock[x.p.id] || 0) + x.l.qty; });
      S.orders.unshift(o); S.cart = []; S.code = null; save();
      return { ok: true, order: o };
    },
    order: function (id) { return S.orders.filter(function (o) { return o.id === id; })[0]; },
    subscribe: function () { S.news = true; save(); },
    reset: function () { S = blank(); save(); }
  };

  /* ---------- fitment ---------- */
  A.fits = function (p, v) {
    if (!v || !p.fit) return null;
    if (p.category === 'wheels') return p.fit.bolts.indexOf(v.bolt) >= 0 && v.diameters.indexOf(p.fit.diameter) >= 0 && p.fit.cb >= v.cb;
    if (p.category === 'tyres') return p.fit.rims.some(function (r) { return v.diameters.indexOf(r) >= 0; });
    if (p.fit.vehicles && p.fit.vehicles.length) return p.fit.vehicles.indexOf(v.id) >= 0;
    return null; /* universal / not vehicle specific */
  };
  A.fitReason = function (p, v) {
    if (p.category === 'wheels') {
      var r = [];
      if (p.fit.bolts.indexOf(v.bolt) < 0) r.push('bolt pattern ' + v.bolt + ' isn\'t offered');
      if (v.diameters.indexOf(p.fit.diameter) < 0) r.push(p.fit.diameter + '-inch isn\'t a listed size for this car');
      if (p.fit.cb < v.cb) r.push('centre bore ' + p.fit.cb + ' mm is smaller than the hub (' + v.cb + ' mm)');
      return r.join('; ');
    }
    if (p.category === 'tyres') return 'no listed rim size matches this vehicle';
    return 'not listed for this vehicle';
  };

  /* ---------- router (History API, with hash fallback) ---------- */
  var base = C.store.basePath;
  var routes = [];
  A.route = function (pattern, fn) {
    var keys = [], re = new RegExp('^' + pattern.replace(/:(\w+)/g, function (_, k) { keys.push(k); return '([^/]+)'; }) + '/?$');
    routes.push({ re: re, keys: keys, fn: fn });
  };
  var useHash = location.protocol === 'file:' || !location.pathname.startsWith(base.replace(/\/$/, ''));
  A.path = function () {
    if (useHash) return (location.hash.replace(/^#/, '') || '/').split('?')[0];
    var p = location.pathname.slice(base.length - 1) || '/';
    return p.replace(/\/+$/, '') || '/';
  };
  A.query = function () { var q = useHash ? (location.hash.split('?')[1] || '') : location.search.slice(1); return new URLSearchParams(q); };
  A.href = function (p) { p = String(p || '').replace(/^\//, ''); return useHash ? '#/' + p : base + p; };
  A.go = function (p, replace) {
    var url = A.href(p);
    if (useHash) { if (replace) location.replace(url); else location.hash = url.slice(1); return; }
    history[replace ? 'replaceState' : 'pushState']({}, '', url); A.render();
  };
  A.setQuery = function (params) {
    var s = params.toString(), p = A.path().replace(/^\//, '');
    var url = A.href(p) + (s ? '?' + s : '');
    if (useHash) history.replaceState({}, '', url); else history.replaceState({}, '', url);
  };
  A.render = function () {
    var path = A.path();
    for (var i = 0; i < routes.length; i++) {
      var m = path.match(routes[i].re);
      if (m) { var params = {}; routes[i].keys.forEach(function (k, j) { params[k] = decodeURIComponent(m[j + 1]); }); routes[i].fn(params); return; }
    }
    A.notFound();
  };
  /* intercept internal links */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]'); if (!a || a.target || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    var h = a.getAttribute('href');
    if (h.charAt(0) === '#' && h.charAt(1) !== '/') { var el = document.getElementById(h.slice(1)); if (el) { e.preventDefault(); el.scrollIntoView({ behavior: U.reduce ? 'auto' : 'smooth' }); } return; }
    if (useHash) return;
    if (a.origin !== location.origin || !a.pathname.startsWith(base)) return;
    e.preventDefault(); history.pushState({}, '', a.pathname + a.search); A.render();
  });
  window.addEventListener('popstate', function () { A.render(); });
  window.addEventListener('hashchange', function () { if (useHash) A.render(); });
})();
