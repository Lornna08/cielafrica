/* ============================================================
   CIEL HQ — the Ciel Africa back office (/admin)
   Overview · Orders (photo books, shop, domains) · Calendar · Tasks ·
   Customers · Website. Sign-in is checked on the server.
   ============================================================ */
(function () {
  'use strict';
  var root = document.getElementById('hq');
  var CFG = (window.CIEL && CIEL.photobooks) || {};
  var S = { view: 'overview', orders: [], sources: {}, tasks: [], events: [], notes: [], loaded: false, filt: { kind: 'all', q: '', st: 'open' }, cal: null };

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function money(n) { return n == null ? '—' : 'KES ' + Math.round(n).toLocaleString('en-KE'); }
  function d2(t) { return t ? new Date(t).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }) : ''; }
  function dt(t) { return t ? new Date(t).toLocaleString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''; }
  function iso(d) { var z = function (n) { return String(n).padStart(2, '0'); }; return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()); }
  function today() { return iso(new Date()); }
  function api(url, body) {
    var get = body === undefined;
    return fetch(url, { method: get ? 'GET' : 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'ciel' }, body: get ? undefined : JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return { ok: false, error: 'Unexpected response (' + r.status + ')' }; }).then(function (j) { if (!r.ok || j.ok === false) { var e = new Error(j.error || 'Request failed'); e.status = r.status; e.code = j.code; throw e; } return j; }); });
  }
  var toastT;
  function toast(m) { var t = document.querySelector('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); } t.textContent = m; t.classList.add('is-on'); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('is-on'); }, 2600); }
  var I = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
    orders: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M6 7h12l-1 13H7z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    tasks: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 10l2 2 4-4M8 16h8"/></svg>',
    people: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.5a5 5 0 0 1 5.5 5.5"/></svg>',
    web: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    ref: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/></svg>',
    l: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>',
    r: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/></svg>',
    pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/></svg>'
  };
  var NAV = [['overview', 'Overview', I.home], ['orders', 'Orders', I.orders], ['calendar', 'Calendar', I.cal], ['tasks', 'Tasks', I.tasks], ['customers', 'Customers', I.people], ['website', 'Website', I.web], ['settings', 'Setup', I.gear]];

  /* ---------- order sources, normalised ---------- */
  var KIND = { photobook: ['Photo book', '#ff5a1f'], shop: ['Shop', '#1f4fb5'], domain: ['Domain', '#5b3fd1'] };
  var PB_LABEL = { awaiting_payment: 'Awaiting payment', payment_failed: 'Payment failed', paid: 'Waiting for pages', preparing: 'Waiting for pages', ready: 'Pages received', printing: 'Printing', ready_collection: 'Ready to collect', dispatched: 'Dispatched', delivered: 'Delivered', cancelled: 'Cancelled', refunded: 'Refunded' };
  var PB_SET = ['paid', 'ready', 'printing', 'ready_collection', 'dispatched', 'delivered', 'cancelled', 'refunded'];
  var SHOP_SET = ['paid', 'processing', 'fulfilled', 'delivered', 'cancelled', 'refunded'];
  var CLOSED = /^(delivered|cancelled|refunded|payment_failed|registered|unavailable|failed|fulfilled)$/;
  function tone(st) { return /deliver|registered|fulfilled/.test(st) ? 'g' : /print|ready|processing|progress|dispatch/.test(st) ? 'b' : /await|pending|paid|prepar|checking/.test(st) ? 'y' : /fail|cancel|refund|unavail/.test(st) ? 'r' : ''; }
  function fromPB(o) { return { kind: 'photobook', ref: o.ref, at: o.createdAt, paid: !!o.paidAt, test: !!o.test, customer: o.customer || {}, total: o.total, status: o.status, label: PB_LABEL[o.status] || o.status, summary: (o.items || []).map(function (i) { return i.name + ' · ' + (i.product === 'print' ? 'Print ×' + i.qty : 'PDF') + ' · ' + i.pages + 'p'; }).join(', '), raw: o }; }
  function fromShop(o) { return { kind: 'shop', ref: o.ref || o.id, at: o.createdAt, paid: true, customer: o.customer || {}, total: o.total, status: o.status, label: o.status.charAt(0).toUpperCase() + o.status.slice(1), summary: o.order || '', raw: o }; }
  function fromDomain(o, labels) { var c = o.customer || {}; return { kind: 'domain', ref: o.ref, at: o.createdAt, paid: /registered|pending_registration|registration_in_progress|refund/.test(o.status), customer: { name: c.name || o.name, email: c.email || o.email, phone: c.phone || o.phone }, total: o.amount, status: o.status, label: (labels && labels[o.status]) || o.status, summary: o.domain + ' · ' + o.years + ' yr', raw: o }; }
  function loadOrders() {
    S.sources = {};
    return Promise.all([
      api('/api/photobooks?route=pbk-admin-orders').then(function (r) { S.sources.photobook = r.storage ? 'ok' : 'Blob storage not connected'; return (r.orders || []).map(fromPB); }, function (e) { S.sources.photobook = e.message; return []; }),
      api('/api/hq?route=shop-orders').then(function (r) { S.sources.shop = r.storage ? 'ok' : 'Blob storage not connected'; return (r.orders || []).map(fromShop); }, function (e) { S.sources.shop = e.message; return []; }),
      api('/api/domains/admin/orders?filter=all').then(function (r) { S.sources.domain = 'ok'; return (r.orders || []).map(function (o) { return fromDomain(o, r.labels); }); }, function (e) { S.sources.domain = e.code === 'store' ? 'Domains database not connected' : e.message; return []; })
    ]).then(function (r) { S.orders = r[0].concat(r[1], r[2]).sort(function (a, b) { return (b.at || 0) - (a.at || 0); }); });
  }
  function loadLists() {
    return Promise.all(['tasks', 'events', 'notes'].map(function (c) { return api('/api/hq?route=list&c=' + c).then(function (r) { S[c] = r.items || []; }, function (e) { S[c] = []; S.listErr = e.message; }); }));
  }
  function saveItem(c, item) { return api('/api/hq?route=save', { c: c, item: item }).then(function (r) { var l = S[c], i = l.findIndex(function (x) { return x.id === r.item.id; }); if (i >= 0) l[i] = r.item; else l.push(r.item); return r.item; }); }
  function delItem(c, id) { return api('/api/hq?route=save', { c: c, op: 'delete', id: id }).then(function () { S[c] = S[c].filter(function (x) { return x.id !== id; }); }); }

  /* ---------- start ---------- */
  function start() {
    api('/api/hq?route=me').then(function (m) { S.setup = m.setup; if (!m.signedIn) return login(m.setup); boot(); }, function () { login({}); });
  }
  function login(setup) {
    root.className = '';
    root.innerHTML = '<div class="hq-login"><div class="hq-login__art"><img src="/assets/img/logo-dark.png?v=20261021i" alt="Ciel Africa"><div><h1>Run all of Ciel Africa from one place.</h1><p>Orders from the shop, Photo Books and Ciel Domains, your calendar, tasks and customers.</p><ul><li>Orders</li><li>Calendar</li><li>Tasks</li><li>Customers</li><li>Website</li></ul></div><small style="color:#8a8076">Ciel HQ</small></div>' +
      '<div class="hq-login__f"><form id="lf"><h2>Sign in</h2><p>Use your admin password.</p>' + (setup && setup.adminPassword === false ? '<div class="hq-setup"><b>Set your admin password first.</b><br>In Vercel open the cielafrica project → Settings → Environment Variables → add <b>ADMIN_PASSWORD</b> with a strong password → Save → Deployments → Redeploy. Then sign in here with it.</div>' : '') +
      '<input class="hq-in" type="password" id="pw" placeholder="Admin password" autocomplete="current-password" required><button class="b b--p" style="justify-content:center;padding:.8rem">Sign in</button><p class="hq-err" id="le"></p></form></div></div>';
    document.getElementById('lf').onsubmit = function (e) {
      e.preventDefault(); var le = document.getElementById('le'); le.textContent = 'Checking…';
      api('/api/hq?route=login', { password: document.getElementById('pw').value }).then(function () { try { localStorage.setItem('pbk_admin', '1'); } catch (er) { } boot(); }, function (er) { le.textContent = er.message; });
    };
  }
  function boot() {
    try { localStorage.setItem('pbk_admin', '1'); } catch (e) { }
    root.className = 'hq';
    root.innerHTML = '<aside class="hq-side"><div class="hq-side__brand"><img src="/assets/img/logo-dark.png?v=20261021i" alt=""><div><b>Ciel HQ</b><span>Ciel Africa back office</span></div></div><nav class="hq-nav" id="nav"></nav><div class="hq-side__foot"><a href="/" target="_blank" rel="noopener" style="color:#cfc5b8">cielafrica.com ↗</a><button id="lo">Sign out</button></div></aside>' +
      '<div class="hq-main"><header class="hq-top"><h1 id="ttl"></h1><button class="b b--sm" id="rf" title="Refresh">' + I.ref + '<span>Refresh</span></button><div id="topx"></div></header><main class="hq-body" id="body"><p class="muted">Loading…</p></main></div><nav class="hq-mnav" id="mnav"></nav>';
    document.getElementById('lo').onclick = function () { api('/api/hq?route=logout', {}).then(function () { try { localStorage.removeItem('pbk_admin'); } catch (e) { } login(S.setup || {}); }); };
    document.getElementById('rf').onclick = function () { refresh(true); };
    window.addEventListener('hashchange', route);
    refresh(false);
  }
  function refresh(note) {
    return Promise.all([loadOrders(), loadLists()]).then(function () { S.loaded = true; route(); if (note) toast('Up to date'); });
  }
  function route() {
    var h = (location.hash || '#overview').slice(1).split('/'), v = h[0];
    if (!NAV.some(function (n) { return n[0] === v; })) v = 'overview';
    document.querySelectorAll('.drawer,.modal').forEach(function (x) { x.remove(); });
    S.view = v; navs();
    var titles = { overview: 'Good ' + (new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening') + ', Lorna', orders: 'Orders', calendar: 'Calendar', tasks: 'Tasks', customers: 'Customers', website: 'Website', settings: 'Setup' };
    document.getElementById('ttl').innerHTML = esc(titles[v]) + '<small>' + new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + '</small>';
    document.getElementById('topx').innerHTML = v === 'calendar' ? '<button class="b b--p b--sm" data-newev>' + I.plus + '<span>Event</span></button>' : v === 'tasks' ? '<button class="b b--p b--sm" data-newtk>' + I.plus + '<span>Task</span></button>' : '';
    var tb = document.querySelector('[data-newev]'); if (tb) tb.onclick = function () { eventModal({ date: today() }); };
    var tt = document.querySelector('[data-newtk]'); if (tt) tt.onclick = function () { taskModal({ status: 'todo' }); };
    ({ overview: overview, orders: orders, calendar: calendar, tasks: tasks, customers: customers, website: website, settings: settings })[v]();
    if (v === 'orders' && h[1]) { var o = S.orders.filter(function (x) { return x.ref === h[1]; })[0]; if (o) orderDrawer(o); }
    window.scrollTo(0, 0);
  }
  function counts() {
    return { orders: S.orders.filter(function (o) { return o.paid && !CLOSED.test(o.status) && !o.test; }).length, tasks: S.tasks.filter(function (t) { return t.status !== 'done'; }).length, calendar: S.events.filter(function (e) { return e.date === today(); }).length };
  }
  function navs() {
    var c = counts();
    document.getElementById('nav').innerHTML = NAV.map(function (n, i) { return (i === 5 ? '<div class="hq-nav__h">Business</div>' : '') + '<a href="#' + n[0] + '" class="' + (S.view === n[0] ? 'is-on' : '') + '">' + n[2] + '<span>' + n[1] + '</span>' + (c[n[0]] ? '<i>' + c[n[0]] + '</i>' : '') + '</a>'; }).join('');
    document.getElementById('mnav').innerHTML = NAV.slice(0, 5).map(function (n) { return '<a href="#' + n[0] + '" class="' + (S.view === n[0] ? 'is-on' : '') + '">' + n[2] + '<span>' + n[1] + '</span>' + (c[n[0]] ? '<i>' + c[n[0]] + '</i>' : '') + '</a>'; }).join('');
  }
  function body(h) { document.getElementById('body').innerHTML = h; return document.getElementById('body'); }

  /* ---------- overview ---------- */
  function overview() {
    var now = new Date(), m0 = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    var real = S.orders.filter(function (o) { return o.paid && !o.test && !/cancel|refund/.test(o.status); });
    var month = real.filter(function (o) { return o.at >= m0; }), rev = month.reduce(function (s, o) { return s + (o.total || 0); }, 0);
    var todo = S.orders.filter(function (o) { return o.paid && !CLOSED.test(o.status) && !o.test; });
    var open = S.tasks.filter(function (t) { return t.status !== 'done'; }), overdue = open.filter(function (t) { return t.due && t.due < today(); });
    var up = S.events.filter(function (e) { return (e.end || e.date) >= today(); }).sort(function (a, b) { return (a.date + (a.start || '')).localeCompare(b.date + (b.start || '')); });
    var week = up.filter(function (e) { return e.date <= iso(new Date(Date.now() + 6 * 864e5)); });
    // last 30 days revenue
    var days = []; for (var i = 29; i >= 0; i--) { var d = new Date(Date.now() - i * 864e5); days.push({ k: iso(d), v: 0, d: d }); }
    real.forEach(function (o) { var k = iso(new Date(o.at)), x = days.filter(function (y) { return y.k === k; })[0]; if (x) x.v += o.total || 0; });
    var mx = Math.max(1, Math.max.apply(null, days.map(function (x) { return x.v; })));
    var bars = days.map(function (x, j) { var h = x.v / mx * 140; return '<rect x="' + (j * 20 + 4) + '" y="' + (160 - h) + '" width="12" height="' + Math.max(2, h) + '" rx="3" fill="' + (x.v ? '#ff5a1f' : '#ebe4d8') + '"><title>' + d2(x.d) + ': ' + money(x.v) + '</title></rect>'; }).join('');
    var attention = [];
    S.orders.forEach(function (o) {
      if (o.test) return;
      if (o.kind === 'photobook' && (o.status === 'paid' || o.status === 'preparing') && Date.now() - o.at > 864e5) attention.push(['y', o.ref + ': paid ' + d2(o.at) + ', pages not received yet', 'Ask ' + (o.customer.name || 'the customer') + ' to open My books → Send now', '#orders/' + o.ref]);
      if (o.kind === 'photobook' && o.status === 'ready') attention.push(['b', o.ref + ' is ready to print', o.summary, '#orders/' + o.ref]);
      if (o.kind === 'shop' && o.status === 'paid') attention.push(['b', o.ref + ': new shop order', o.summary.slice(0, 80), '#orders/' + o.ref]);
      if (o.kind === 'domain' && o.status === 'pending_registration') attention.push(['b', o.ref + ': register ' + (o.raw.domain || ''), 'Paid, waiting for registration', '#orders/' + o.ref]);
    });
    overdue.forEach(function (t) { attention.push(['r', 'Overdue: ' + t.title, 'Was due ' + d2(t.due + 'T12:00'), '#tasks']); });
    var b = body(
      '<div class="kpis"><div class="card kpi"><span>Revenue this month</span><b>' + money(rev) + '</b><small>' + month.length + ' paid order' + (month.length === 1 ? '' : 's') + '</small></div>' +
      '<div class="card kpi"><span>Orders to handle</span><b>' + todo.length + '</b><small>' + todo.filter(function (o) { return o.kind === 'photobook'; }).length + ' photo books · ' + todo.filter(function (o) { return o.kind === 'shop'; }).length + ' shop · ' + todo.filter(function (o) { return o.kind === 'domain'; }).length + ' domains</small></div>' +
      '<div class="card kpi"><span>Open tasks</span><b>' + open.length + '</b><small>' + (overdue.length ? overdue.length + ' overdue' : 'Nothing overdue') + '</small></div>' +
      '<div class="card kpi"><span>This week</span><b>' + week.length + '</b><small>event' + (week.length === 1 ? '' : 's') + ' in the next 7 days</small></div></div>' +
      '<div class="grid2"><div class="card"><div class="card__h"><h2>Revenue, last 30 days</h2><span class="muted">' + money(days.reduce(function (s, x) { return s + x.v; }, 0)) + '</span></div><div class="card__b"><svg class="chart" viewBox="0 0 600 170" preserveAspectRatio="none">' + bars + '<line x1="0" y1="160.5" x2="600" y2="160.5" stroke="#ebe4d8"/></svg><div class="row muted" style="justify-content:space-between;font-size:.76rem"><span>' + d2(days[0].d) + '</span><span>Today</span></div></div></div>' +
      '<div class="card"><div class="card__h"><h2>Needs attention</h2><span class="chip' + (attention.length ? ' chip--o' : ' chip--g') + '">' + attention.length + '</span></div><ul class="list">' + (attention.length ? attention.slice(0, 7).map(function (a) { return '<li><span class="dot" style="background:var(--' + a[0] + ')"></span><div><b>' + esc(a[1]) + '</b><small>' + esc(a[2]) + '</small></div><a class="b b--sm" href="' + a[3] + '">Open</a></li>'; }).join('') : '<li class="empty">All clear. Nothing waiting on you.</li>') + '</ul></div></div>' +
      '<div class="grid2"><div class="card"><div class="card__h"><h2>Recent orders</h2><a class="b b--sm" href="#orders">All orders</a></div>' + orderTable(S.orders.slice(0, 6), true) + '</div>' +
      '<div class="card"><div class="card__h"><h2>Coming up</h2><a class="b b--sm" href="#calendar">Calendar</a></div><ul class="list">' + (up.length ? up.slice(0, 6).map(evRow).join('') : '<li class="empty">No upcoming events. <a href="#calendar">Plan one</a>.</li>') + '</ul>' +
      '<div class="card__h" style="border-top:1px solid var(--line)"><h2>Tasks due soon</h2><a class="b b--sm" href="#tasks">Board</a></div><ul class="list">' + (open.length ? open.slice().sort(function (a, c) { return (a.due || '9').localeCompare(c.due || '9'); }).slice(0, 5).map(function (t) { return '<li><span class="dot" style="background:' + ({ high: 'var(--r)', med: 'var(--o)', low: 'var(--g)' }[t.priority] || 'var(--faint)') + '"></span><div><b>' + esc(t.title) + '</b><small>' + (t.due ? 'Due ' + d2(t.due + 'T12:00') : 'No due date') + (t.status === 'doing' ? ' · in progress' : '') + '</small></div></li>'; }).join('') : '<li class="empty">No open tasks.</li>') + '</ul></div></div>'
    );
    bindOrderRows(b);
  }
  function evRow(e) { var d = new Date(e.date + 'T12:00'); return '<li><span class="date-b"><b>' + d.getDate() + '</b><small>' + d.toLocaleDateString('en-KE', { month: 'short' }) + '</small></span><div><b>' + esc(e.title) + '</b><small>' + (e.allDay || !e.start ? 'All day' : esc(e.start) + (e.finish ? '–' + esc(e.finish) : '')) + (e.location ? ' · ' + esc(e.location) : '') + '</small></div><span class="chip chip--' + ({ meeting: 'b', shoot: 'p', deadline: 'r', delivery: 'g' }[e.type] || 'o') + '">' + esc(EVT[e.type] || 'Event') + '</span></li>'; }

  /* ---------- orders ---------- */
  function orderTable(list, compact) {
    if (!list.length) return '<p class="empty">No orders yet.</p>';
    return '<table class="tbl"><thead><tr><th>Order</th><th>Customer</th><th class="hide-m">Items</th><th>Total</th><th>Status</th></tr></thead><tbody>' + list.map(function (o) {
      var k = KIND[o.kind];
      return '<tr data-ref="' + esc(o.ref) + '"><td><b>' + esc(o.ref) + '</b>' + (o.test ? ' <span class="chip chip--k">TEST</span>' : '') + '<small><span class="kind"><i style="background:' + k[1] + '"></i>' + k[0] + '</span> · ' + d2(o.at) + '</small></td><td>' + esc(o.customer.name || '—') + '<small>' + esc(o.customer.phone ? '+' + String(o.customer.phone).replace(/^\+/, '') : o.customer.email || '') + '</small></td>' +
        (compact ? '<td class="hide-m"><small>' + esc((o.summary || '').slice(0, 60)) + '</small></td>' : '<td class="hide-m"><small>' + esc((o.summary || '').slice(0, 90)) + '</small></td>') + '<td><b>' + money(o.total) + '</b></td><td><span class="chip chip--' + tone(o.status) + '">' + esc(o.label) + '</span></td></tr>';
    }).join('') + '</tbody></table>';
  }
  function bindOrderRows(el) { el.querySelectorAll('tr[data-ref]').forEach(function (tr) { tr.onclick = function () { location.hash = '#orders/' + tr.getAttribute('data-ref'); }; }); }
  function orders() {
    var f = S.filt, q = f.q.toLowerCase();
    var list = S.orders.filter(function (o) {
      if (f.kind !== 'all' && o.kind !== f.kind) return false;
      if (f.st === 'open' && (CLOSED.test(o.status) || !o.paid)) return false;
      if (f.st === 'unpaid' && o.paid) return false;
      if (f.st === 'done' && !CLOSED.test(o.status)) return false;
      return !q || (o.ref + ' ' + o.customer.name + ' ' + o.customer.email + ' ' + o.customer.phone + ' ' + o.summary).toLowerCase().indexOf(q) >= 0;
    });
    var n = function (k) { return S.orders.filter(function (o) { return k === 'all' || o.kind === k; }).length; };
    var src = Object.keys(S.sources).filter(function (k) { return S.sources[k] !== 'ok'; });
    var b = body('<div class="card"><div class="card__h" style="flex-wrap:wrap;gap:.7rem"><div class="tabs" id="kt">' + [['all', 'All'], ['photobook', 'Photo books'], ['shop', 'Shop'], ['domain', 'Domains']].map(function (k) { return '<button data-k="' + k[0] + '"' + (f.kind === k[0] ? ' class="is-on"' : '') + '>' + k[1] + '<i>' + n(k[0]) + '</i></button>'; }).join('') + '</div><div class="bar" style="margin-left:auto"><input class="hq-in" id="oq" type="search" placeholder="Search name, phone, order…" value="' + esc(f.q) + '"><select class="hq-in" id="os" style="width:auto">' + [['open', 'To handle'], ['all', 'All'], ['unpaid', 'Not paid'], ['done', 'Done']].map(function (s) { return '<option value="' + s[0] + '"' + (f.st === s[0] ? ' selected' : '') + '>' + s[1] + '</option>'; }).join('') + '</select></div></div>' +
      (src.length ? '<div class="card__b" style="border-bottom:1px solid var(--line)">' + src.map(function (k) { return '<p class="muted" style="font-size:.82rem">' + KIND[k][0] + ' orders: ' + esc(S.sources[k]) + '</p>'; }).join('') + '</div>' : '') + orderTable(list) + '</div>' +
      '<p class="faint" style="font-size:.8rem">Shop orders are recorded when M-Pesa confirms a payment on the website checkout (from now on). Photo book print files, previews and the print PDF open from each photo book order.</p>');
    b.querySelectorAll('#kt [data-k]').forEach(function (x) { x.onclick = function () { f.kind = x.getAttribute('data-k'); orders(); }; });
    var oq = b.querySelector('#oq'); oq.oninput = function () { f.q = oq.value; var pos = oq.selectionStart; orders(); var n2 = document.getElementById('oq'); n2.focus(); n2.setSelectionRange(pos, pos); };
    b.querySelector('#os').onchange = function () { f.st = this.value; orders(); };
    bindOrderRows(b);
  }
  function drawer(title, html, onClose) {
    var d = document.createElement('div'); d.className = 'drawer';
    d.innerHTML = '<div class="drawer__p"><div class="drawer__h"><h2>' + title + '</h2><button class="b b--sm b--ghost" data-x>' + I.x + '</button></div><div class="drawer__b">' + html + '</div></div>';
    document.body.appendChild(d);
    function close() { d.remove(); if (onClose) onClose(); }
    d.addEventListener('click', function (e) { if (e.target === d || e.target.closest('[data-x]')) close(); });
    document.addEventListener('keydown', function k(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', k); } });
    return d;
  }
  function orderDrawer(o) {
    var r = o.raw, c = o.customer, set = o.kind === 'photobook' ? PB_SET : o.kind === 'shop' ? SHOP_SET : null;
    var a = r.address, g = r.gift, addr = a ? [a.line1, a.area, a.town, a.county].filter(Boolean).join(', ') + (a.notes ? ' (' + a.notes + ')' : '') : '';
    var labels = o.kind === 'photobook' ? PB_LABEL : null;
    var h = '<div class="row"><span class="kind"><i style="background:' + KIND[o.kind][1] + '"></i>' + KIND[o.kind][0] + '</span><span class="chip chip--' + tone(o.status) + '">' + esc(o.label) + '</span>' + (o.test ? '<span class="chip chip--k">TEST · deleted after 24 h</span>' : '') + '</div>' +
      '<dl class="dl"><dt>Placed</dt><dd>' + dt(o.at) + '</dd><dt>Total</dt><dd><b>' + money(o.total) + '</b></dd><dt>Customer</dt><dd>' + esc(c.name || '—') + (c.phone ? '<br><a href="tel:+' + esc(String(c.phone).replace(/^\+/, '')) + '">+' + esc(String(c.phone).replace(/^\+/, '')) + '</a> · <a target="_blank" rel="noopener" href="https://wa.me/' + esc(String(c.phone).replace(/\D/g, '')) + '">WhatsApp</a>' : '') + (c.email ? '<br><a href="mailto:' + esc(c.email) + '">' + esc(c.email) + '</a>' : '') + '</dd>' +
      (o.kind === 'domain' ? '<dt>Domain</dt><dd>' + esc(r.domain) + ' · ' + esc(r.years) + ' year(s)</dd>' : '') +
      (r.delivery ? '<dt>Delivery</dt><dd>' + esc(r.delivery.name || r.delivery) + '</dd>' : '') + (addr ? '<dt>Address</dt><dd>' + esc(addr) + '</dd>' : '') +
      (g ? '<dt>Gift</dt><dd>For ' + esc(g.to || '—') + (g.phone ? ' · ' + esc(g.phone) : '') + (g.note ? '<br>“' + esc(g.note) + '”' : '') + '</dd>' : '') +
      '<dt>Items</dt><dd>' + (r.lines ? r.lines.map(function (l) { return esc(l.label) + (l.qty > 1 ? ' × ' + l.qty : '') + ' — ' + money(l.amount * (l.qty || 1)); }).join('<br>') : esc(o.summary)) + '</dd></dl>' +
      (o.kind === 'photobook' ? '<a class="b b--d" href="/photobooks/orders#' + esc(o.ref) + '" target="_blank" rel="noopener">' + I.book + '<span>Print files, book preview &amp; print PDF</span></a>' : '') +
      (o.kind === 'domain' ? '<a class="b b--d" href="/domains/admin" target="_blank" rel="noopener">' + I.globe + '<span>Open in Domains admin</span></a>' : '') +
      (set ? '<div class="card" style="padding:1rem;display:grid;gap:.7rem"><b>Update status</b><select class="hq-in" id="ds">' + set.map(function (s) { return '<option value="' + s + '"' + (o.status === s ? ' selected' : '') + '>' + esc(labels ? labels[s] : s.charAt(0).toUpperCase() + s.slice(1)) + '</option>'; }).join('') + '</select><textarea class="hq-in" id="dn" rows="2" placeholder="Note (optional)"></textarea>' + (o.kind === 'photobook' ? '<label class="check"><input type="checkbox" id="de" checked> Email the customer about this update</label><label class="check"><input type="checkbox" id="dp"> Include my note in the email</label>' : '') + '<button class="b b--p" id="db" style="justify-content:center">Save</button></div>' : '') +
      (r.history && r.history.length ? '<b>History</b><ul class="hist">' + r.history.slice().reverse().map(function (x) { return '<li><b>' + esc((labels && labels[x.status]) || x.status) + '</b> · ' + dt(x.at) + (x.note ? '<br><span class="muted">' + esc(x.note) + '</span>' : '') + '</li>'; }).join('') + '</ul>' : '') +
      '<button class="b" id="dtask">' + I.tasks + '<span>Make a task for this order</span></button>';
    var d = drawer(esc(o.ref), h, function () { if (location.hash.indexOf('#orders/') === 0) history.replaceState(null, '', '#orders'); });
    var sb = d.querySelector('#db');
    if (sb) sb.onclick = function () {
      sb.disabled = true; var st = d.querySelector('#ds').value, note = d.querySelector('#dn').value;
      var p = o.kind === 'photobook' ? api('/api/photobooks?route=pbk-admin-status', { ref: o.ref, status: st, note: note, notify: d.querySelector('#de').checked, public: d.querySelector('#dp').checked }).then(function (x) { toast(x.emailed ? 'Saved and emailed to the customer' : 'Saved'); return fromPB(x.order); })
        : api('/api/hq?route=shop-status', { id: r.id, status: st, note: note }).then(function (x) { toast('Saved'); return fromShop(x.order); });
      p.then(function (n) { S.orders = S.orders.map(function (y) { return y.ref === n.ref ? n : y; }); d.remove(); history.replaceState(null, '', '#orders'); route(); }, function (e) { sb.disabled = false; toast(e.message); });
    };
    d.querySelector('#dtask').onclick = function () { taskModal({ status: 'todo', ref: o.ref, title: 'Follow up ' + o.ref + (c.name ? ' (' + c.name + ')' : '') }); };
  }

  /* ---------- calendar ---------- */
  var EVT = { meeting: 'Meeting', shoot: 'Shoot', event: 'Event', deadline: 'Deadline', delivery: 'Delivery', personal: 'Personal' };
  function calendar() {
    var c = S.cal || (S.cal = new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    var first = new Date(c.getFullYear(), c.getMonth(), 1), start = new Date(first); start.setDate(1 - ((first.getDay() + 6) % 7));
    var cells = []; for (var i = 0; i < 42; i++) { var d = new Date(start); d.setDate(start.getDate() + i); cells.push(d); }
    if (cells[35].getMonth() !== c.getMonth()) cells = cells.slice(0, 35);
    var t = today();
    function evOn(k) { return S.events.filter(function (e) { return k >= e.date && k <= (e.end || e.date); }).sort(function (a, b) { return (a.start || '').localeCompare(b.start || ''); }); }
    var up = S.events.filter(function (e) { return (e.end || e.date) >= t; }).sort(function (a, b) { return (a.date + (a.start || '')).localeCompare(b.date + (b.start || '')); });
    var b = body('<div class="grid2"><div class="card"><div class="card__h cal__h"><h2>' + c.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' }) + '</h2><button class="b b--sm" data-m="-1">' + I.l + '</button><button class="b b--sm" data-m="0">Today</button><button class="b b--sm" data-m="1">' + I.r + '</button></div>' +
      '<div class="cal">' + ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(function (x) { return '<div class="cal__dow">' + x + '</div>'; }).join('') + cells.map(function (d) {
        var k = iso(d), l = evOn(k);
        return '<div class="cal__d' + (d.getMonth() !== c.getMonth() ? ' is-out' : '') + (k === t ? ' is-today' : '') + '" data-day="' + k + '"><span class="cal__n">' + d.getDate() + '</span>' + l.slice(0, 3).map(function (e) { return '<button class="ev ev--' + esc(e.type || 'event') + '" data-ev="' + e.id + '" title="' + esc(e.title) + '">' + (e.start && !e.allDay ? esc(e.start) + ' ' : '') + esc(e.title) + '</button>'; }).join('') + (l.length > 3 ? '<span class="cal__more">+' + (l.length - 3) + ' more</span>' : '') + '</div>';
      }).join('') + '</div></div>' +
      '<div class="card"><div class="card__h"><h2>Agenda</h2><button class="b b--p b--sm" data-new>' + I.plus + '<span>New event</span></button></div><ul class="list">' + (up.length ? up.slice(0, 14).map(function (e) { return evRow(e).replace('<li>', '<li data-ev="' + e.id + '" style="cursor:pointer">'); }).join('') : '<li class="empty">Nothing planned yet. Tap a day to add an event.</li>') + '</ul></div></div>');
    b.querySelectorAll('[data-m]').forEach(function (x) { x.onclick = function () { var m = +x.getAttribute('data-m'); S.cal = m === 0 ? new Date(new Date().getFullYear(), new Date().getMonth(), 1) : new Date(c.getFullYear(), c.getMonth() + m, 1); calendar(); }; });
    b.querySelector('[data-new]').onclick = function () { eventModal({ date: t }); };
    b.addEventListener('click', function (e) {
      var ev = e.target.closest('[data-ev]'); if (ev) { e.stopPropagation(); eventModal(S.events.filter(function (x) { return x.id === ev.getAttribute('data-ev'); })[0]); return; }
      var day = e.target.closest('[data-day]'); if (day) eventModal({ date: day.getAttribute('data-day') });
    });
  }
  function modal(html) {
    var m = document.createElement('div'); m.className = 'modal'; m.innerHTML = '<div class="modal__p">' + html + '</div>'; document.body.appendChild(m);
    m.addEventListener('click', function (e) { if (e.target === m || e.target.closest('[data-x]')) m.remove(); });
    return m;
  }
  function eventModal(e) {
    e = e || {};
    var m = modal('<h2>' + (e.id ? 'Edit event' : 'New event') + '</h2><label class="field"><span>Title</span><input class="hq-in" id="et" value="' + esc(e.title || '') + '" placeholder="e.g. Wedding shoot, client meeting" maxlength="120"></label>' +
      '<div class="g2"><label class="field"><span>Date</span><input class="hq-in" type="date" id="ed" value="' + esc(e.date || today()) + '"></label><label class="field"><span>Type</span><select class="hq-in" id="ey">' + Object.keys(EVT).map(function (k) { return '<option value="' + k + '"' + ((e.type || 'event') === k ? ' selected' : '') + '>' + EVT[k] + '</option>'; }).join('') + '</select></label></div>' +
      '<label class="check"><input type="checkbox" id="ea"' + (e.allDay || (!e.start && e.id) ? ' checked' : '') + '> All day</label>' +
      '<div class="g2" id="etimes"><label class="field"><span>Starts</span><input class="hq-in" type="time" id="es" value="' + esc(e.start || '09:00') + '"></label><label class="field"><span>Ends</span><input class="hq-in" type="time" id="ef" value="' + esc(e.finish || '10:00') + '"></label></div>' +
      '<div class="g2"><label class="field"><span>Until (optional, for multi-day)</span><input class="hq-in" type="date" id="ee" value="' + esc(e.end || '') + '"></label><label class="field"><span>Client</span><input class="hq-in" id="ec" value="' + esc(e.client || '') + '" maxlength="120"></label></div>' +
      '<label class="field"><span>Location</span><input class="hq-in" id="el" value="' + esc(e.location || '') + '" maxlength="160"></label><label class="field"><span>Notes</span><textarea class="hq-in" id="en" rows="3">' + esc(e.notes || '') + '</textarea></label>' +
      '<div class="row" style="justify-content:flex-end">' + (e.id ? '<button class="b" data-del style="margin-right:auto;color:var(--r)">Delete</button>' : '') + '<button class="b" data-x>Cancel</button><button class="b b--p" data-save>Save</button></div>');
    var tg = function () { m.querySelector('#etimes').style.display = m.querySelector('#ea').checked ? 'none' : ''; }; m.querySelector('#ea').onchange = tg; tg();
    m.querySelector('[data-save]').onclick = function () {
      var all = m.querySelector('#ea').checked;
      var it = { id: e.id, title: m.querySelector('#et').value, date: m.querySelector('#ed').value, type: m.querySelector('#ey').value, allDay: all, start: all ? '' : m.querySelector('#es').value, finish: all ? '' : m.querySelector('#ef').value, end: m.querySelector('#ee').value > m.querySelector('#ed').value ? m.querySelector('#ee').value : '', client: m.querySelector('#ec').value, location: m.querySelector('#el').value, notes: m.querySelector('#en').value, ref: e.ref };
      saveItem('events', it).then(function () { m.remove(); toast('Event saved'); route(); }, function (er) { toast(er.message); });
    };
    var del = m.querySelector('[data-del]'); if (del) del.onclick = function () { if (!confirm('Delete this event?')) return; delItem('events', e.id).then(function () { m.remove(); toast('Deleted'); route(); }); };
    setTimeout(function () { m.querySelector('#et').focus(); }, 50);
  }

  /* ---------- tasks ---------- */
  var COLS = [['todo', 'To do'], ['doing', 'In progress'], ['done', 'Done']];
  function tasks() {
    var b = body('<div class="board">' + COLS.map(function (c, ci) {
      var l = S.tasks.filter(function (t) { return (t.status || 'todo') === c[0]; }).sort(function (a, z) { return (a.due || '9').localeCompare(z.due || '9') || ({ high: 0, med: 1, low: 2 }[a.priority] || 1) - ({ high: 0, med: 1, low: 2 }[z.priority] || 1); });
      return '<div class="col" data-col="' + c[0] + '"><div class="col__h"><span>' + c[1] + '</span><i>' + l.length + '</i></div>' + l.map(function (t) {
        var over = t.due && t.due < today() && t.status !== 'done';
        return '<div class="tk" draggable="true" data-tk="' + t.id + '"><b>' + esc(t.title) + '</b><div class="tk__m">' + (t.priority ? '<span class="chip chip--' + ({ high: 'r', med: 'o', low: 'g' }[t.priority]) + '">' + ({ high: 'High', med: 'Medium', low: 'Low' }[t.priority]) + '</span>' : '') + (t.due ? '<span class="chip' + (over ? ' chip--r' : '') + '">' + (over ? 'Overdue · ' : 'Due ') + d2(t.due + 'T12:00') + '</span>' : '') + (t.tag ? '<span class="chip chip--b">' + esc(t.tag) + '</span>' : '') + (t.ref ? '<span class="chip chip--p">' + esc(t.ref) + '</span>' : '') + (t.assignee ? '<span>· ' + esc(t.assignee) + '</span>' : '') + '</div>' +
          '<div class="tk__mv">' + (ci > 0 ? '<button class="b b--sm" data-mv="' + COLS[ci - 1][0] + '">' + I.l + COLS[ci - 1][1] + '</button>' : '') + (ci < 2 ? '<button class="b b--sm" data-mv="' + COLS[ci + 1][0] + '">' + COLS[ci + 1][1] + I.r + '</button>' : '') + '</div></div>';
      }).join('') + (c[0] === 'todo' ? '<form class="addtask" data-add><input class="hq-in" placeholder="Add a task…" maxlength="120"><button class="b b--p b--sm">' + I.plus + '</button></form>' : '') + '</div>';
    }).join('') + '</div>');
    b.querySelector('[data-add]').onsubmit = function (e) { e.preventDefault(); var v = this.querySelector('input').value.trim(); if (!v) return; saveItem('tasks', { title: v, status: 'todo', priority: 'med' }).then(function () { tasks(); navs(); }, function (er) { toast(er.message); }); };
    b.addEventListener('click', function (e) {
      var mv = e.target.closest('[data-mv]'); if (mv) { e.stopPropagation(); var t = S.tasks.filter(function (x) { return x.id === mv.closest('[data-tk]').getAttribute('data-tk'); })[0]; t.status = mv.getAttribute('data-mv'); saveItem('tasks', t).then(function () { tasks(); navs(); }); return; }
      var tk = e.target.closest('[data-tk]'); if (tk) taskModal(S.tasks.filter(function (x) { return x.id === tk.getAttribute('data-tk'); })[0]);
    });
    var drag = null;
    b.querySelectorAll('[data-tk]').forEach(function (el) { el.addEventListener('dragstart', function (e) { drag = el.getAttribute('data-tk'); el.classList.add('is-dragging'); e.dataTransfer.setData('text/plain', drag); }); el.addEventListener('dragend', function () { el.classList.remove('is-dragging'); }); });
    b.querySelectorAll('[data-col]').forEach(function (col) {
      col.addEventListener('dragover', function (e) { e.preventDefault(); col.classList.add('is-drop'); });
      col.addEventListener('dragleave', function () { col.classList.remove('is-drop'); });
      col.addEventListener('drop', function (e) { e.preventDefault(); col.classList.remove('is-drop'); var t = S.tasks.filter(function (x) { return x.id === drag; })[0]; if (!t || t.status === col.getAttribute('data-col')) return; t.status = col.getAttribute('data-col'); tasks(); saveItem('tasks', t).then(navs, function (er) { toast(er.message); }); });
    });
  }
  function taskModal(t) {
    t = t || {};
    var m = modal('<h2>' + (t.id ? 'Task' : 'New task') + '</h2><label class="field"><span>Task</span><input class="hq-in" id="tt" value="' + esc(t.title || '') + '" maxlength="120"></label>' +
      '<div class="g2"><label class="field"><span>Status</span><select class="hq-in" id="ts">' + COLS.map(function (c) { return '<option value="' + c[0] + '"' + ((t.status || 'todo') === c[0] ? ' selected' : '') + '>' + c[1] + '</option>'; }).join('') + '</select></label><label class="field"><span>Priority</span><select class="hq-in" id="tp">' + [['high', 'High'], ['med', 'Medium'], ['low', 'Low']].map(function (p) { return '<option value="' + p[0] + '"' + ((t.priority || 'med') === p[0] ? ' selected' : '') + '>' + p[1] + '</option>'; }).join('') + '</select></label></div>' +
      '<div class="g2"><label class="field"><span>Due date</span><input class="hq-in" type="date" id="td" value="' + esc(t.due || '') + '"></label><label class="field"><span>Label</span><input class="hq-in" id="tg" value="' + esc(t.tag || '') + '" placeholder="e.g. Photo Books, Client" maxlength="40"></label></div>' +
      '<div class="g2"><label class="field"><span>Who</span><input class="hq-in" id="ta" value="' + esc(t.assignee || '') + '" maxlength="60"></label><label class="field"><span>Order</span><input class="hq-in" id="tr" value="' + esc(t.ref || '') + '" placeholder="PB-…" maxlength="40"></label></div>' +
      '<label class="field"><span>Notes</span><textarea class="hq-in" id="tn" rows="4">' + esc(t.notes || '') + '</textarea></label>' +
      '<div class="row" style="justify-content:flex-end">' + (t.id ? '<button class="b" data-del style="margin-right:auto;color:var(--r)">Delete</button>' : '') + '<button class="b" data-x>Cancel</button><button class="b b--p" data-save>Save</button></div>');
    m.querySelector('[data-save]').onclick = function () {
      var it = { id: t.id, title: m.querySelector('#tt').value, status: m.querySelector('#ts').value, priority: m.querySelector('#tp').value, due: m.querySelector('#td').value, tag: m.querySelector('#tg').value, assignee: m.querySelector('#ta').value, ref: m.querySelector('#tr').value, notes: m.querySelector('#tn').value };
      saveItem('tasks', it).then(function () { m.remove(); toast('Task saved'); if (S.view === 'tasks') tasks(); else route(); navs(); }, function (er) { toast(er.message); });
    };
    var del = m.querySelector('[data-del]'); if (del) del.onclick = function () { if (!confirm('Delete this task?')) return; delItem('tasks', t.id).then(function () { m.remove(); route(); }); };
    setTimeout(function () { m.querySelector('#tt').focus(); }, 50);
  }

  /* ---------- customers (built from every order) ---------- */
  function customers() {
    var map = {};
    S.orders.forEach(function (o) {
      if (o.test) return;
      var c = o.customer, k = (c.email || '').toLowerCase() || String(c.phone || '').replace(/\D/g, '').slice(-9) || c.name; if (!k) return;
      var x = map[k] || (map[k] = { key: k, name: c.name, email: c.email, phone: c.phone, orders: 0, spent: 0, last: 0, kinds: {} });
      x.orders++; if (o.paid && !/cancel|refund/.test(o.status)) x.spent += o.total || 0; x.last = Math.max(x.last, o.at || 0); x.kinds[o.kind] = 1; if (!x.name && c.name) x.name = c.name; if (!x.phone && c.phone) x.phone = c.phone;
    });
    var list = Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) { return b.last - a.last; });
    var q = (S.cq || '').toLowerCase(), shown = list.filter(function (x) { return !q || ((x.name || '') + ' ' + (x.email || '') + ' ' + (x.phone || '')).toLowerCase().indexOf(q) >= 0; });
    var b = body('<div class="card"><div class="card__h"><h2>' + list.length + ' customer' + (list.length === 1 ? '' : 's') + '</h2><input class="hq-in" id="cq" type="search" placeholder="Search customers" value="' + esc(S.cq || '') + '" style="max-width:280px"></div>' +
      (shown.length ? '<table class="tbl"><thead><tr><th>Customer</th><th>Contact</th><th>Orders</th><th>Spent</th><th class="hide-m">Last order</th></tr></thead><tbody>' + shown.map(function (x) { return '<tr data-c="' + esc(x.key) + '"><td><b>' + esc(x.name || '—') + '</b><small>' + Object.keys(x.kinds).map(function (k) { return KIND[k][0]; }).join(' · ') + '</small></td><td>' + esc(x.phone ? '+' + String(x.phone).replace(/^\+/, '') : '') + '<small>' + esc(x.email || '') + '</small></td><td>' + x.orders + '</td><td><b>' + money(x.spent) + '</b></td><td class="hide-m">' + d2(x.last) + '</td></tr>'; }).join('') + '</tbody></table>' : '<p class="empty">Customers appear here as orders come in.</p>') + '</div>');
    var cq = b.querySelector('#cq'); cq.oninput = function () { S.cq = cq.value; var p = cq.selectionStart; customers(); var n = document.getElementById('cq'); n.focus(); n.setSelectionRange(p, p); };
    b.querySelectorAll('[data-c]').forEach(function (tr) {
      tr.onclick = function () {
        var x = map[tr.getAttribute('data-c')], note = S.notes.filter(function (n) { return n.key === x.key; })[0] || { key: x.key, text: '' };
        var os = S.orders.filter(function (o) { var c = o.customer; return (c.email || '').toLowerCase() === x.key || String(c.phone || '').replace(/\D/g, '').slice(-9) === x.key || c.name === x.key; });
        var d = drawer(esc(x.name || 'Customer'), '<dl class="dl"><dt>Phone</dt><dd>' + (x.phone ? '<a href="tel:+' + esc(String(x.phone).replace(/^\+/, '')) + '">+' + esc(String(x.phone).replace(/^\+/, '')) + '</a> · <a target="_blank" rel="noopener" href="https://wa.me/' + esc(String(x.phone).replace(/\D/g, '')) + '">WhatsApp</a>' : '—') + '</dd><dt>Email</dt><dd>' + (x.email ? '<a href="mailto:' + esc(x.email) + '">' + esc(x.email) + '</a>' : '—') + '</dd><dt>Spent</dt><dd><b>' + money(x.spent) + '</b> over ' + x.orders + ' order' + (x.orders === 1 ? '' : 's') + '</dd></dl>' +
          '<label class="field"><span>Notes about this customer</span><textarea class="hq-in" id="cn" rows="4" placeholder="Preferences, follow-ups, birthdays…">' + esc(note.text) + '</textarea></label><button class="b b--p" id="cs" style="justify-self:start">Save notes</button><b>Orders</b>' + orderTable(os, true));
        d.querySelector('#cs').onclick = function () { note.text = d.querySelector('#cn').value; saveItem('notes', note).then(function () { toast('Notes saved'); }, function (er) { toast(er.message); }); };
        d.querySelectorAll('tr[data-ref]').forEach(function (r2) { r2.onclick = function () { d.remove(); location.hash = '#orders/' + r2.getAttribute('data-ref'); }; });
      };
    });
  }

  /* ---------- website & setup ---------- */
  function website() {
    var tiles = [
      [I.pen, 'Website content', 'Edit products, templates, work and team on cielafrica.com. Publishes to the site when GitHub is connected.', '/admin/content'],
      [I.book, 'Photo Books orders', 'Every page at print size, the book preview and the print PDF for each photo book order.', '/photobooks/orders'],
      [I.globe, 'Ciel Domains', 'Domain orders: check, register, refund.', '/domains/admin'],
      [I.orders, 'Shop', 'The products customers buy on cielafrica.com.', '/products.html'],
      [I.book, 'Photo Books store', 'What customers see: covers, the editor and checkout.', '/photobooks'],
      [I.web, 'cielafrica.com', 'The public website.', '/']
    ];
    body('<div class="cards3">' + tiles.map(function (t) { return '<a class="card tile" href="' + t[3] + '" target="_blank" rel="noopener"><span class="ico">' + t[0] + '</span><h3>' + t[1] + ' ↗</h3><p>' + t[2] + '</p></a>'; }).join('') + '</div>');
  }
  function settings() {
    var s = S.setup || {};
    var rows = [
      [s.adminPassword, 'Admin password', 'ADMIN_PASSWORD in Vercel. One password for Ciel HQ, Photo Book orders, Domains and website content.'],
      [s.storage, 'Private file storage', 'Vercel Blob (cielafrica-photobooks): orders, print files, tasks and calendar.'],
      [s.payments, 'M-Pesa payments', 'Daraja keys in Vercel. Mode: ' + esc(s.mpesaEnv || 'sandbox') + '.'],
      [s.email, 'Email', 'RESEND_API_KEY in Vercel: receipts and order updates to customers, alerts to you.'],
      [s.publish, 'One-click publishing', 'GITHUB_TOKEN in Vercel so website content changes go live without downloading files.'],
      [s.domainsDb, 'Domains database', 'Upstash Redis for Ciel Domains orders.']
    ];
    body('<div class="card"><div class="card__h"><h2>Setup checklist</h2></div><ul class="list setup">' + rows.map(function (r) { return '<li><span class="st' + (r[0] ? '' : ' no') + '">' + (r[0] ? '✓' : '') + '</span><div><b>' + r[1] + '</b><p>' + r[2] + '</p></div></li>'; }).join('') + '</ul></div><p class="faint" style="font-size:.82rem">Change any of these in Vercel → cielafrica → Settings → Environment Variables, then redeploy.</p>');
  }

  start();
})();
