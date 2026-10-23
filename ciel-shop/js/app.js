/* ============================================================
   CIEL SHOP — application shell & router
   ============================================================ */
window.CS = window.CS || {};
(function () {
  'use strict';
  var ui = CS.ui, store = CS.store;
  var app = CS.app = { routes: [], period: '30d', ui: {} };
  var PREF = 'cielshop:demo:ui';
  try { var saved = JSON.parse(localStorage.getItem(PREF) || '{}'); app.ui = saved || {}; if (saved.period) app.period = saved.period; } catch (e) { app.ui = {}; }
  app.savePref = function (k, v) { app.ui[k] = v; try { localStorage.setItem(PREF, JSON.stringify(app.ui)); } catch (e) { /* preferences are optional */ } };

  // page registry: CS.route('/products/:id', fn(params) -> {crumbs, title, actions, html, mount, period})
  CS.route = function (pattern, fn) {
    var keys = [], re = new RegExp('^' + pattern.replace(/:[a-z]+/g, function (m) { keys.push(m.slice(1)); return '([^/]+)'; }) + '$');
    app.routes.push({ re: re, keys: keys, fn: fn, pattern: pattern });
  };
  app.go = function (hash) { if (location.hash === hash) render(); else location.hash = hash; };

  var NAV = [
    { sec: 'Overview' },
    { id: 'dashboard', label: 'Dashboard', icon: 'grid', href: '#/dashboard' },
    { sec: 'Catalogue' },
    { id: 'products', label: 'Products', icon: 'box', href: '#/products' },
    { id: 'inventory', label: 'Inventory', icon: 'layers', href: '#/inventory', count: function () { return store.lowStock().length; }, countTitle: 'Products at or below reorder point' },
    { id: 'batches', label: 'Batches', icon: 'tag', href: '#/batches' },
    { sec: 'Sales' },
    { id: 'orders', label: 'Orders', icon: 'cart', href: '#/orders', count: function () { return store.state.orders.filter(function (o) { return o.fulfilment === 'new'; }).length; }, countTitle: 'New orders' },
    { id: 'board', label: 'Order Board', icon: 'kanban', href: '#/board' },
    { id: 'customers', label: 'Customers', icon: 'users', href: '#/customers' },
    { sec: 'Operations' },
    { id: 'warehouses', label: 'Warehouses', icon: 'warehouse', href: '#/warehouses' },
    { id: 'suppliers', label: 'Suppliers', icon: 'truck', href: '#/suppliers' },
    { sec: 'Insights' },
    { id: 'analytics', label: 'Analytics', icon: 'chart', href: '#/analytics' },
    { id: 'reports', label: 'Reports', icon: 'file', href: '#/reports' },
    { sec: 'Account' },
    { id: 'settings', label: 'Settings', icon: 'settings', href: '#/settings' }
  ];
  var SECTION = { 'purchase-orders': 'suppliers', returns: 'orders' };

  function navHtml(active) {
    return NAV.map(function (n) {
      if (n.sec) return '<div class="side__sec">' + n.sec + '</div>';
      var c = n.count ? n.count() : 0;
      return '<a class="nav-i' + (active === n.id ? ' on' : '') + '" href="' + n.href + '" title="' + n.label + '"' + (active === n.id ? ' aria-current="page"' : '') + '>' + ui.icon(n.icon, 18) + '<span>' + n.label + '</span>' + (c ? '<em class="cnt" title="' + n.countTitle + '">' + c + '</em><i class="cnt-dot"></i>' : '') + '</a>';
    }).join('');
  }

  var shell, view, current = null, lastHash = null;
  function boot() {
    store.init();
    document.body.insertAdjacentHTML('afterbegin',
      '<div class="demo-bar" role="region" aria-label="Template notice"><a class="demo-bar__back" href="../index.html" aria-label="Back to Ciel Africa"><b>‹</b><span> Ciel Africa</span></a><span class="dot"></span><span class="demo-bar__msg"><b><span class="txt-long">You’re exploring the </span>Ciel Shop template<span class="txt-long">.</span></b> <span class="txt-long">Changes here affect sample data only.</span></span>' +
      '<span class="demo-bar__acts"><button type="button" data-reset>Reset template</button><a class="hide-sm" href="../ciel-shop.html#features">View features</a><a class="pri" href="../ciel-shop.html#pricing">Get Ciel Shop</a></span></div>' +
      '<div class="shell' + (app.ui.collapsed ? ' is-collapsed' : '') + '" id="shell"><aside class="side" aria-label="Main navigation"><div class="side__brand"><span class="logo"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5 8 12l7 7"/></svg></span><span class="side__name">Ciel <span>Shop</span></span></div><nav class="side__nav" id="nav"></nav><div class="side__foot"><button class="collapse-btn" id="collapse" aria-label="Collapse sidebar">' + ui.icon('collapse', 18) + '<span>Collapse</span></button></div></aside><div class="scrim" id="scrim"></div>' +
      '<div class="main"><header class="top"><button class="burger" id="burger" aria-label="Open navigation">' + ui.icon('menu', 18) + '</button><div class="crumbs" id="crumbs"></div><div class="top__sp"></div><div class="top__ctx" id="ctx"></div>' +
      '<button class="gsearch" id="gsearch" aria-label="Search">' + ui.icon('search', 15) + '<span><span class="gs-long">Search products, orders, batches…</span><span class="gs-short">Search…</span></span><span class="kbd">⌘K</span></button>' +
      '<button class="ibtn" id="help" aria-label="Template guide">' + ui.icon('help', 18) + '</button><button class="ibtn" id="bell" aria-label="Notifications">' + ui.icon('bell', 18) + '</button>' +
      '<button class="userbtn" id="userbtn" aria-label="Account"></button></header><main class="view" id="view" tabindex="-1"></main></div></div>');
    shell = document.getElementById('shell'); view = document.getElementById('view');
    document.getElementById('collapse').onclick = function () { shell.classList.toggle('is-collapsed'); app.savePref('collapsed', shell.classList.contains('is-collapsed')); };
    document.getElementById('burger').onclick = function () { shell.classList.add('nav-open'); };
    document.getElementById('scrim').onclick = function () { shell.classList.remove('nav-open'); };
    document.getElementById('nav').addEventListener('click', function (e) { if (e.target.closest('a')) shell.classList.remove('nav-open'); });
    document.getElementById('gsearch').onclick = palette;
    document.getElementById('bell').onclick = function (e) { notifPanel(e.currentTarget); };
    document.getElementById('help').onclick = guide;
    document.getElementById('userbtn').onclick = function (e) { userMenu(e.currentTarget); };
    document.querySelector('[data-reset]').onclick = resetDemo;
    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); palette(); }
      else if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && !document.querySelector('.ov')) { e.preventDefault(); palette(); }
      else if (e.key === 'Escape') { if (document.querySelector('.pop')) ui.closePop(); else if (!ui.closeTop()) shell.classList.remove('nav-open'); }
    });
    window.addEventListener('hashchange', render);
    store.subscribe(function () { chrome(); if (current && !current.static) render(true); });
    if (!store.persistOk()) setTimeout(function () { ui.toast('Your browser is blocking storage, so template changes will reset when you leave the page.', 'info'); }, 800);
    if (!location.hash || location.hash === '#' || location.hash === '#/') location.replace('#/dashboard');
    render();
    if (!app.ui.welcomed) { app.savePref('welcomed', 1); setTimeout(guide, 700); }
  }

  function chrome() {
    var hash = location.hash.replace(/^#/, '') || '/dashboard';
    var seg = hash.split('/')[1] || 'dashboard';
    document.getElementById('nav').innerHTML = navHtml(SECTION[seg] || seg);
    var me = store.me(), unread = store.notifications().filter(function (n) { return !n.read; }).length;
    document.getElementById('userbtn').innerHTML = ui.avatar(me.name) + '<span><div class="nm">' + ui.esc(me.name) + '</div><div class="rl">' + ui.esc(me.role) + '</div></span>' + ui.icon('chevD', 14);
    document.getElementById('bell').innerHTML = ui.icon('bell', 18) + (unread ? '<span class="pip">' + (unread > 9 ? '9+' : unread) + '</span>' : '');
  }

  function render(keepScroll) {
    var hash = location.hash.replace(/^#/, '') || '/dashboard';
    var path = hash.split('?')[0], q = {};
    (hash.split('?')[1] || '').split('&').forEach(function (kv) { if (kv) { var p = kv.split('='); q[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || ''); } });
    var match = null, params = {};
    for (var i = 0; i < app.routes.length; i++) { var m = path.match(app.routes[i].re); if (m) { match = app.routes[i]; match.keys.forEach(function (k, j) { params[k] = decodeURIComponent(m[j + 1]); }); break; } }
    var same = hash === lastHash;
    var y = window.scrollY;
    lastHash = hash;
    ui.closePop();
    chrome();
    var page;
    try { page = match ? match.fn(params, q) : null; } catch (e) { console.error(e); page = null; }
    if (!page) page = { crumbs: [], title: 'Not found', html: ui.empty('search', 'We couldn’t find that page', 'It may have been removed — or the record was deleted when the template was reset.', '<a class="btn btn--sm" href="#/dashboard" style="margin-top:8px">Back to dashboard</a>') };
    current = page;
    document.title = (page.title ? page.title + ' · ' : '') + 'Ciel Shop template';
    var cr = (page.crumbs || []).map(function (c) { return '<a href="' + c[1] + '">' + ui.esc(c[0]) + '</a>' + ui.icon('chevR', 13); }).join('') + '<b>' + ui.esc(page.title || '') + '</b>';
    document.getElementById('crumbs').innerHTML = cr;
    var ctx = document.getElementById('ctx');
    ctx.innerHTML = page.period ? periodSel() : '';
    if (page.period) ctx.querySelector('.seg').addEventListener('click', function (e) { var b = e.target.closest('[data-p]'); if (!b) return; app.period = b.getAttribute('data-p'); app.savePref('period', app.period); render(true); });
    view.classList.toggle('view--wide', !!page.wide);
    view.innerHTML = page.html || '';
    if (!same || !keepScroll) { view.classList.remove('view-enter'); void view.offsetWidth; view.classList.add('view-enter'); }
    if (page.mount) { try { page.mount(view); } catch (e) { console.error(e); ui.toast('This view hit an error: ' + e.message, 'err'); } }
    if (same && keepScroll) window.scrollTo(0, y); else { window.scrollTo(0, 0); }
  }
  app.render = render;

  function periodSel() {
    var P = [['today', 'Today'], ['7d', '7D'], ['30d', '30D'], ['90d', '90D']];
    return '<div class="seg" role="group" aria-label="Reporting period">' + P.map(function (p) { return '<button data-p="' + p[0] + '" class="' + (app.period === p[0] ? 'on' : '') + '" aria-pressed="' + (app.period === p[0]) + '">' + p[1] + '</button>'; }).join('') + '</div>';
  }
  app.periodLabel = function (p) { return { today: 'today', '7d': 'the last 7 days', '30d': 'the last 30 days', '90d': 'the last 90 days' }[p || app.period]; };
  app.prevLabel = function (p) { return { today: 'vs same time yesterday', '7d': 'vs previous 7 days', '30d': 'vs previous 30 days', '90d': 'vs previous 90 days' }[p || app.period]; };

  /* ---------- reset ---------- */
  function resetDemo() {
    ui.confirm({ title: 'Reset the template?', body: 'This restores the original sample dataset and removes every product, order and stock change you’ve made in this browser.', ok: 'Reset template', danger: true }).then(function (ok) {
      if (!ok) return;
      store.reset();
      app.go('#/dashboard');
      ui.toast('Template reset to the original sample data');
    });
  }
  app.reset = resetDemo;

  /* ---------- command palette ---------- */
  var QUICK = [
    { t: 'Create order', s: 'New sales order', link: '#/orders/new', icon: 'cart' },
    { t: 'Add product', s: 'New catalogue item', link: '#/products/new', icon: 'box' },
    { t: 'Receive stock', s: 'Inventory', link: '#/inventory?do=receive', icon: 'receive' },
    { t: 'New purchase order', s: 'Suppliers', link: '#/purchase-orders/new', icon: 'truck' },
    { t: 'Order board', s: 'Fulfilment', link: '#/board', icon: 'kanban' },
    { t: 'Expiring batches', s: 'Batches', link: '#/batches?status=expiring', icon: 'clock' },
    { t: 'Low-stock products', s: 'Inventory', link: '#/inventory?status=low', icon: 'alert' }
  ];
  function palette() {
    if (document.querySelector('.cmdk')) return;
    var m = ui.modal({ title: 'Search', foot: false, body: '' });
    m.el.className = 'modal cmdk';
    m.el.innerHTML = '<div class="cmdk__in">' + ui.icon('search', 18) + '<input type="text" placeholder="Search products, SKUs, orders, customers, batches, suppliers…" aria-label="Search" autocomplete="off"><span class="kbd">Esc</span></div><div class="cmdk__res" role="listbox"></div><div class="cmdk__foot"><span>↑↓ to move</span><span>↵ to open</span><span>Try “MW-104”, “honey” or a batch like “CF-”</span></div>';
    var inp = m.el.querySelector('input'), res = m.el.querySelector('.cmdk__res'), items = [], on = 0;
    function draw() {
      var q = inp.value.trim();
      items = q ? store.search(q, 5) : QUICK.map(function (x) { return { type: 'Quick actions', title: x.t, sub: x.s, link: x.link, icon: x.icon }; });
      on = 0;
      if (!items.length) { res.innerHTML = ui.empty('search', 'No matches', 'Search covers names, SKUs, barcodes, order numbers, emails, batch numbers and suppliers.'); return; }
      var h = '', g = null, ICON = { Product: 'box', Order: 'cart', Customer: 'user', Batch: 'tag', Supplier: 'truck', 'Purchase order': 'receipt' };
      items.forEach(function (it, i) {
        if (it.type !== g) { g = it.type; h += '<div class="cmdk__g">' + ui.esc(g === 'Quick actions' ? g : g + 's') + '</div>'; }
        h += '<div class="cmdk__i" role="option" data-i="' + i + '">' + (it.p ? ui.thumb(it.p, 30) : '<span class="ico-c">' + ui.icon(it.icon || ICON[it.type], 16) + '</span>') + '<div><div class="t">' + ui.esc(it.title) + '</div><div class="s">' + ui.esc(it.sub) + '</div></div></div>';
      });
      res.innerHTML = h; hl();
    }
    function hl() { res.querySelectorAll('.cmdk__i').forEach(function (el, i) { el.classList.toggle('on', i === on); if (i === on) el.scrollIntoView({ block: 'nearest' }); }); }
    function open(i) { var it = items[i]; if (!it) return; m.close(); app.go(it.link); }
    inp.addEventListener('input', ui.debounce(draw, 80));
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); on = Math.min(items.length - 1, on + 1); hl(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); on = Math.max(0, on - 1); hl(); }
      else if (e.key === 'Enter') { e.preventDefault(); open(on); }
    });
    res.addEventListener('click', function (e) { var r = e.target.closest('[data-i]'); if (r) open(+r.getAttribute('data-i')); });
    res.addEventListener('mousemove', function (e) { var r = e.target.closest('[data-i]'); if (r && +r.getAttribute('data-i') !== on) { on = +r.getAttribute('data-i'); hl(); } });
    draw(); setTimeout(function () { inp.focus(); }, 30);
  }
  app.palette = palette;

  /* ---------- notifications ---------- */
  function notifPanel(anchor) {
    var list = store.notifications(), unread = list.filter(function (n) { return !n.read; }).length;
    var ICON = { danger: 'ico-c--red', warn: 'ico-c--amber', info: 'ico-c--blue' };
    var html = '<div class="npanel__h"><b>Notifications' + (unread ? ' <span class="pill pill--acc pill--plain">' + unread + ' new</span>' : '') + '</b>' + (unread ? '<button class="link" data-all>Mark all as read</button>' : '') + '</div><div class="npanel__b">' +
      (list.length ? list.map(function (n) { return '<div class="nitem ' + (n.read ? 'read' : 'unread') + '" data-id="' + ui.esc(n.id) + '" data-link="' + n.link + '"><span class="ico-c ' + ICON[n.kind] + '">' + ui.icon(n.icon, 15) + '</span><div><div class="nitem__t">' + ui.esc(n.title) + '</div><div class="nitem__s">' + ui.esc(n.body) + (n.at ? ' · ' + ui.rel(n.at) : '') + '</div></div></div>'; }).join('') : ui.empty('bell', 'You’re all caught up', 'Alerts for low stock, new orders, expiring batches and incoming purchase orders appear here.')) + '</div>';
    var p = ui.pop(anchor, html, { cls: 'npanel' });
    p.addEventListener('click', function (e) {
      if (e.target.closest('[data-all]')) { store.markAllRead(); ui.closePop(); ui.toast('All notifications marked as read'); return; }
      var it = e.target.closest('.nitem'); if (!it) return;
      store.markRead(it.getAttribute('data-id')); ui.closePop(); app.go(it.getAttribute('data-link'));
    });
  }

  /* ---------- user menu ---------- */
  function userMenu(anchor) {
    var S = store.state, items = [{ label: 'Act as (template)', header: true }];
    S.team.filter(function (u) { return !u.invited; }).forEach(function (u) { items.push({ label: u.name + ' · ' + u.role, icon: 'user', on: u.id === S.currentUserId, fn: function () { store.setUser(u.id); ui.toast('Now acting as ' + u.name + '. New activity is recorded under their name.'); } }); });
    items.push('-', { label: 'Business settings', icon: 'settings', fn: function () { app.go('#/settings'); } }, { label: 'Template guide', icon: 'help', fn: guide }, '-', { label: 'Reset template data', icon: 'refresh', danger: true, fn: resetDemo }, { label: 'Back to Ciel Shop', icon: 'logout', fn: function () { location.href = '../ciel-shop.html'; } });
    ui.menu(anchor, items);
  }

  /* ---------- template guide ---------- */
  function guide() {
    var steps = [
      ['Move an order across the board', 'Drag a card from Packing to Ready to ship — or use the status menu on the card.', '#/board'],
      ['Create an order', 'Pick a customer and products. Stock is reserved the moment you save.', '#/orders/new'],
      ['Ship it and watch stock drop', 'Shipping consumes batches first-expiry-first-out and writes stock movements.', '#/orders'],
      ['Receive a purchase order', 'Open an ordered PO and receive it — new batches appear with expiry dates.', '#/purchase-orders'],
      ['Add a product', 'Set a price, cost, variants and opening stock in a warehouse.', '#/products/new'],
      ['Check expiring batches', 'Perishable stock close to its expiry date is flagged here.', '#/batches?status=expiring'],
      ['Process a return', 'Open a delivered order and choose “Create return”. Only resellable items go back on the shelf.', '#/returns'],
      ['Explore analytics', 'Every figure is calculated from the same orders and stock records.', '#/analytics']
    ];
    ui.modal({
      title: 'Welcome to the Ciel Shop template', size: 'wide',
      sub: 'This is the working application, filled with six months of sample trading for a fictional retailer, Mawe Home &amp; Pantry. Nothing here touches real customers, payments or couriers.',
      body: '<div class="g-2 grid" style="gap:4px">' + steps.map(function (s, i) { return '<a class="guide-i" href="' + s[2] + '" data-close><span class="n">' + (i + 1) + '</span><span><b>' + s[0] + '</b><span>' + s[1] + '</span></span></a>'; }).join('') + '</div><div class="note note--plain" style="margin-top:14px">' + ui.icon('info', 15) + '<span>Your changes are saved in this browser only. Use <b>Reset template</b> in the top bar to start over at any time. Press <span class="kbd">⌘K</span> or <span class="kbd">/</span> to search.</span></div>',
      foot: '<span class="sp"></span><button class="btn btn--p" data-x>Start exploring</button>',
      onOpen: function (el, api) { el.querySelectorAll('[data-close]').forEach(function (a) { a.addEventListener('click', function () { api.close(); }); }); }
    });
  }
  app.guide = guide;

  /* ---------- shared bits for pages ---------- */
  app.ph = function (title, sub, actions) { return '<div class="ph"><div><h1>' + title + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div><div class="ph__acts">' + (actions || '') + '</div></div>'; };
  app.tabs = function (items, active) { return '<div class="tabs" role="tablist">' + items.map(function (t) { return '<a class="tab' + (t[0] === active ? ' on' : '') + '" href="' + t[2] + '" role="tab" aria-selected="' + (t[0] === active) + '">' + t[1] + (t[3] != null ? ' <span class="cnt">' + t[3] + '</span>' : '') + '</a>'; }).join('') + '</div>'; };
  app.whOptions = function (all) { var o = store.state.warehouses.map(function (w) { return { value: w.id, label: w.name }; }); return all ? [{ value: '', label: 'All warehouses' }].concat(o) : o; };
  app.userName = function (id) { var u = id && store.user(id); return u ? u.name : (id ? 'Former team member' : 'System'); };

  document.addEventListener('DOMContentLoaded', boot);
})();
