/* ============================================================
   KINTRA — application shell, router, navigation, search,
   notifications, location scope and user switching.
   ============================================================ */
window.KT = window.KT || {};
(function () {
  'use strict';
  var ui = KT.ui, store = KT.store, R = KT.rules, policy = KT.policy;
  var app = KT.app = { routes: [] };

  KT.route = function (pattern, fn) {
    var keys = [], re = new RegExp('^' + pattern.replace(/:[a-z]+/g, function (m) { keys.push(m.slice(1)); return '([^/]+)'; }) + '$');
    app.routes.push({ re: re, keys: keys, fn: fn });
  };
  app.go = function (hash) { if (hash.indexOf('#loc:') === 0) { setLoc(hash.slice(5)); return; } if (location.hash === hash) render(); else location.hash = hash; };

  /* ---------- navigation ---------- */
  function navItems() {
    var me = store.me(), emp = store.myEmp(), mgr = store.isManager();
    var items = [{ id: 'overview', label: mgr ? 'Overview' : 'Home', icon: 'grid', href: '#/overview' }];
    items.push({ id: 'schedule', label: mgr && store.canAny('schedule.edit') ? 'Scheduling' : 'My schedule', icon: 'week', href: '#/schedule', count: function () { if (!store.canAny('schedule.edit')) return 0; var t = store.today(); return store.shiftsBetween(t, R.addDays(t, 7)).filter(function (s) { return !s.employeeId && store.can('schedule.edit', s.locationId); }).length; }, warn: true, countTitle: 'Open shifts in the next 7 days' });
    if (store.canAny('attendance.view')) items.push({ id: 'attendance', label: 'Attendance', icon: 'clock', href: '#/attendance', count: function () { var t = store.today(); return store.attendance(t, t).filter(function (r) { return r.ev.state === 'not_in'; }).length; }, warn: true, countTitle: 'Not clocked in yet today' });
    if (emp) items.push({ id: 'clock', label: 'Time clock', icon: 'timer', href: '#/clock' });
    items.push({ id: 'time-off', label: 'Time off', icon: 'plane', href: '#/time-off', count: function () { return store.pendingForMe().length; }, countTitle: 'Requests waiting for your decision' });
    if (store.can('hiring.view')) items.push({ id: 'hiring', label: 'Hiring', icon: 'briefcase', href: '#/hiring', count: function () { return store.state.candidates.filter(function (c) { var j = store.job(c.jobId); return c.stage === 'applied' && j && store.inScope(j.locationId); }).length; }, countTitle: 'New applications to review' });
    if (store.canAny('employees.view')) items.push({ id: 'employees', label: 'Employees', icon: 'users', href: '#/employees' });
    else if (emp) items.push({ id: 'employees', label: 'My profile', icon: 'user', href: '#/employees/' + emp.id });
    if (store.can('payroll.view')) items.push({ id: 'payroll', label: 'Payroll', icon: 'wallet', href: '#/payroll', count: function () { var t = store.today(); return store.state.periods.filter(function (p) { return p.end < t && p.status !== 'paid'; }).length; }, warn: true, countTitle: 'Pay periods that need action' });
    if (store.canAny('reports.view')) items.push({ id: 'reports', label: 'Reports', icon: 'chart', href: '#/reports' });
    items.push({ sec: 'Workspace' });
    items.push({ id: 'settings', label: 'Settings', icon: 'settings', href: '#/settings' });
    void me;
    return items;
  }
  function navHtml(active) {
    return navItems().map(function (n) {
      if (n.sec) return '<div class="side__sec">' + n.sec + '</div>';
      var c = n.count ? n.count() : 0;
      return '<a class="nav-i' + (active === n.id ? ' on' : '') + '" href="' + n.href + '" title="' + n.label + '"' + (active === n.id ? ' aria-current="page"' : '') + '>' + ui.icon(n.icon, 18) + '<span>' + n.label + '</span>' + (c ? '<em class="cnt' + (n.warn ? ' cnt--warn' : '') + '" title="' + ui.esc(n.countTitle) + '">' + c + '<span class="sr"> ' + ui.esc(n.countTitle) + '</span></em><i class="cnt-dot"></i>' : '') + '</a>';
    }).join('');
  }
  function mnavHtml(active) {
    var emp = store.myEmp(), pend = store.pendingForMe().length;
    var items = [['overview', store.isManager() ? 'Overview' : 'Home', 'grid', '#/overview'], ['schedule', 'Schedule', 'week', '#/schedule']];
    if (emp) items.push(['clock', 'Clock', 'timer', '#/clock']); else if (store.canAny('attendance.view')) items.push(['attendance', 'Attendance', 'clock', '#/attendance']); else items.push(['employees', 'People', 'users', '#/employees']);
    items.push(['time-off', 'Time off', 'plane', '#/time-off', pend]);
    return items.map(function (i) { return '<a href="' + i[3] + '" class="' + (active === i[0] ? 'on' : '') + '"' + (active === i[0] ? ' aria-current="page"' : '') + '>' + ui.icon(i[2], 20) + i[1] + (i[4] ? '<span class="pip">' + i[4] + '</span>' : '') + '</a>'; }).join('') + '<button type="button" data-more aria-label="More: open the menu">' + ui.icon('menu', 20) + 'More</button>';
  }

  var shell, view, current = null, lastHash = null;
  function boot() {
    store.init();
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a || a.target) return;
      e.preventDefault();
      var h = a.getAttribute('href');
      if (h.indexOf('#loc:') === 0) { setLoc(h.slice(5)); return; }
      if (h.length > 1 && location.hash !== h) location.hash = h; else if (h.length > 1) render(true);
    });
    document.body.insertAdjacentHTML('afterbegin',
      '<div class="demo-bar" role="region" aria-label="Template notice"><a class="demo-bar__back" href="../index.html" aria-label="Back to Ciel Africa"><b>‹</b><span> Ciel Africa</span></a><span class="dot"></span><span class="demo-bar__msg"><b>KINTRA template</b><span class="txt-long"> · Fictional demo company, saved in this browser only. No payments, messages or emails are sent.</span></span>' +
      '<span class="demo-bar__acts"><button type="button" data-guide class="hide-sm">Guide</button><button type="button" data-reset>Reset</button><a class="pri" href="../quote.html?template=KINTRA">Get KINTRA</a></span></div>' +
      '<div class="shell' + (store.prefs.collapsed ? ' is-collapsed' : '') + '" id="shell"><aside class="side" aria-label="Main navigation"><div class="side__brand"><span class="mark">' + KT.logo(16) + '</span><span class="side__name">KINTRA</span></div>' +
      '<button class="org" id="orgbtn" type="button" aria-label="Organisation"></button><nav class="side__nav" id="nav"></nav>' +
      '<div class="side__foot"><a class="side__btn" href="#/careers">' + ui.icon('globe', 18) + '<span>Careers page</span></a><button class="side__btn" data-collapse type="button" aria-label="Collapse sidebar">' + ui.icon('collapse', 18) + '<span>Collapse</span></button></div></aside><div class="scrim" id="scrim"></div>' +
      '<div class="main"><header class="top"><button class="burger" id="burger" aria-label="Open navigation">' + ui.icon('menu', 18) + '</button><button class="locsel" id="locsel" type="button" aria-haspopup="menu"></button><div class="crumbs" id="crumbs"></div><div class="top__sp"></div>' +
      '<button class="gsearch" id="gsearch" aria-label="Search">' + ui.icon('search', 15) + '<span>Search people, candidates, jobs…</span><span class="kbd">⌘K</span></button>' +
      '<button class="ibtn" id="bell" aria-label="Notifications"></button>' +
      '<button class="userbtn" id="userbtn" aria-label="Account and demo users" aria-haspopup="menu"></button></header><main class="view" id="view" tabindex="-1"></main></div><nav class="mnav" id="mnav" aria-label="Quick navigation"></nav></div>');
    shell = document.getElementById('shell'); view = document.getElementById('view');
    shell.querySelector('[data-collapse]').onclick = function () { shell.classList.toggle('is-collapsed'); store.setPref('collapsed', shell.classList.contains('is-collapsed')); };
    document.getElementById('burger').onclick = openNav;
    document.getElementById('scrim').onclick = closeNav;
    document.getElementById('nav').addEventListener('click', function (e) { if (e.target.closest('a')) closeNav(); });
    shell.querySelector('.side__foot').addEventListener('click', function (e) { if (e.target.closest('a')) closeNav(); });
    document.getElementById('mnav').addEventListener('click', function (e) { if (e.target.closest('[data-more]')) openNav(); });
    document.getElementById('gsearch').onclick = palette;
    document.getElementById('bell').onclick = function (e) { notifPanel(e.currentTarget); };
    document.getElementById('userbtn').onclick = function (e) { userMenu(e.currentTarget); };
    document.getElementById('locsel').onclick = function (e) { locMenu(e.currentTarget); };
    document.getElementById('orgbtn').onclick = function (e) { orgMenu(e.currentTarget); };
    document.querySelector('[data-reset]').onclick = resetDemo;
    document.querySelector('[data-guide]').onclick = guide;
    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); palette(); }
      else if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && !document.querySelector('.ov')) { e.preventDefault(); palette(); }
      else if (e.key === 'Escape') { if (document.querySelector('.pop')) ui.closePop(); else if (!ui.closeTop()) closeNav(); }
    });
    window.addEventListener('hashchange', function () { render(); });
    store.subscribe(function (what) { chrome(); if (what === 'reset' || what === 'user') { render(); return; } if (current && current.onChange) current.onChange(what); else if (current && !current.static) render(true); });
    if (!store.persistOk()) setTimeout(function () { ui.toast('Your browser is blocking storage, so changes will reset when you leave the page.', 'info'); }, 800);
    if (!location.hash || location.hash === '#' || location.hash === '#/') location.replace(location.pathname + location.search + '#/overview');
    render();
    setInterval(function () { if (current && current.tick) current.tick(); }, 15000);
    if (!store.prefs.welcomed && location.hash.indexOf('#/careers') !== 0) { store.setPref('welcomed', 1); setTimeout(guide, 600); }
  }
  function openNav() { shell.classList.add('nav-open'); var a = shell.querySelector('.nav-i.on') || shell.querySelector('.nav-i'); if (a) setTimeout(function () { a.focus(); }, 50); }
  function closeNav() { shell.classList.remove('nav-open'); }

  function seg() { var hash = location.hash.replace(/^#/, '') || '/overview'; return hash.split('?')[0].split('/')[1] || 'overview'; }
  function chrome() {
    var s = seg(), me = store.me(), S = store.state;
    var active = s === 'employees' && !store.canAny('employees.view') ? 'employees' : s;
    document.getElementById('nav').innerHTML = navHtml(active);
    document.getElementById('mnav').innerHTML = mnavHtml(active);
    var unread = store.notifications().filter(function (n) { return !n.isRead; }).length;
    document.getElementById('bell').innerHTML = ui.icon('bell', 18) + (unread ? '<span class="pip">' + (unread > 9 ? '9+' : unread) + '</span><span class="sr">' + unread + ' unread</span>' : '');
    document.getElementById('userbtn').innerHTML = ui.avatar(me.name) + '<span><div class="nm">' + ui.esc(me.name) + '</div><div class="rl">' + ui.esc(policy.roleName(me.role)) + '</div></span>' + ui.icon('chevD', 14);
    var l = store.scopeLoc(), mine = store.myLocations();
    document.getElementById('locsel').innerHTML = ui.icon('pin', 15) + '<span>' + (l ? ui.esc(store.locName(l)) : mine.length === S.locations.length ? 'All locations' : mine.length === 1 ? ui.esc(mine[0].name) : 'My locations (' + mine.length + ')') + '</span>' + ui.icon('chevD', 14);
    document.getElementById('locsel').style.display = mine.length > 1 ? '' : 'none';
    document.getElementById('orgbtn').innerHTML = '<span class="org__m">' + ui.esc(ui.initials(S.org.name)) + '</span><span class="org__t"><b>' + ui.esc(S.org.name) + '</b><span>Demo workspace · ' + S.locations.length + ' locations</span></span>' + ui.icon('chevD', 14);
  }

  function render(keepScroll) {
    var hash = location.hash.replace(/^#/, '') || '/overview';
    var path = hash.split('?')[0], q = {};
    (hash.split('?')[1] || '').split('&').forEach(function (kv) { if (kv) { var p = kv.split('='); q[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || ''); } });
    var match = null, params = {};
    for (var i = 0; i < app.routes.length; i++) { var m = path.match(app.routes[i].re); if (m) { match = app.routes[i]; match.keys.forEach(function (k, j) { params[k] = decodeURIComponent(m[j + 1]); }); break; } }
    var same = hash === lastHash, y = window.scrollY;
    if (current && current.leave && !same) { try { current.leave(); } catch (e) { /* ignore */ } }
    lastHash = hash;
    ui.closePop();
    var page;
    try { page = match ? match.fn(params, q) : null; } catch (e) { console.error(e); page = { title: 'Something went wrong', html: '<div class="card">' + ui.empty('alert', 'This page hit an error', ui.esc(e.message)) + '</div>' }; }
    if (!page) page = { title: 'Not found', html: '<div class="card">' + ui.empty('search', 'We couldn’t find that page', 'It may have been removed, or the demo was reset.', '<a class="btn btn--sm" href="#/overview" style="margin-top:8px">Back to overview</a>') + '</div>' };
    current = page;
    document.body.classList.toggle('is-public', !!page.public);
    chrome();
    document.title = (page.title ? page.title + ' · ' : '') + 'KINTRA';
    document.getElementById('crumbs').innerHTML = (page.crumbs || []).map(function (c) { return '<a href="' + c[1] + '">' + ui.esc(c[0]) + '</a>' + ui.icon('chevR', 13); }).join('') + (page.crumbs && page.crumbs.length ? '<b>' + ui.esc(page.title || '') + '</b>' : '');
    var fresh = view.cloneNode(false); view.parentNode.replaceChild(fresh, view); view = fresh;
    view.className = 'view' + (page.wide ? ' view--wide' : '');
    view.innerHTML = page.html || '';
    if (!same || !keepScroll) { view.classList.remove('view-enter'); void view.offsetWidth; view.classList.add('view-enter'); }
    if (page.mount) { try { page.mount(view); } catch (e) { console.error(e); ui.toast('This view hit an error: ' + e.message, 'err'); } }
    app.bindLocked(view);
    if (same && keepScroll) window.scrollTo(0, y); else { window.scrollTo(0, 0); if (!same && lastFocusNav) view.focus({ preventScroll: true }); }
  }
  var lastFocusNav = true;
  app.render = render;
  app.refresh = function () { render(true); };

  /* ---------- shared page helpers ---------- */
  app.ph = function (title, sub, actions) { return '<div class="ph"><div><h1>' + title + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div>' + (actions ? '<div class="ph__acts">' + actions + '</div>' : '') + '</div>'; };
  app.tabs = function (items, active) { return '<div class="tabs" role="tablist">' + items.map(function (t) { return '<a class="tab' + (t[0] === active ? ' on' : '') + '" href="' + t[2] + '" role="tab" aria-selected="' + (t[0] === active) + '">' + t[1] + (t[3] ? ' <span class="cnt">' + t[3] + '</span>' : '') + '</a>'; }).join('') + '</div>'; };
  app.locked = function (title, perm, locId) {
    var w = store.why(perm, locId);
    return '<div class="card">' + ui.empty('lock', title, ui.esc(w || 'You don’t have access to this page.') + '<br>Ask an administrator to change your access, or switch to another demo user.', '<button class="btn btn--sm" data-switch style="margin-top:8px">' + ui.icon('users', 15) + 'Switch demo user</button>') + '</div>';
  };
  app.bindLocked = function (root) { root.querySelectorAll('[data-switch]').forEach(function (b) { b.onclick = function (e) { userMenu(e.currentTarget); }; }); };
  app.updateQuery = function (q) {
    var hash = location.hash.replace(/^#/, ''), path = hash.split('?')[0];
    var qs = Object.keys(q).filter(function (k) { return q[k] !== '' && q[k] != null && q[k] !== false; }).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(q[k]); }).join('&');
    history.replaceState(null, '', location.pathname + location.search + '#' + path + (qs ? '?' + qs : ''));
    lastHash = location.hash.replace(/^#/, '');
  };
  app.locOptions = function (perm, all) {
    var ls = store.myLocations().filter(function (l) { return !perm || store.can(perm, l.id); });
    var o = ls.map(function (l) { return { value: l.id, label: l.name }; });
    return all ? [{ value: '', label: 'All locations' }].concat(o) : o;
  };
  app.deptOptions = function (all) { var o = store.state.departments.map(function (d) { return { value: d.id, label: d.name }; }); return all ? [{ value: '', label: 'All departments' }].concat(o) : o; };
  app.roleOptions = function (all, deptId) { var o = store.state.jobRoles.filter(function (r) { return !deptId || r.deptId === deptId; }).map(function (r) { return { value: r.id, label: r.name }; }); return all ? [{ value: '', label: 'All roles' }].concat(o) : o; };
  app.empCell = function (e, sub) { if (!e) return '<span class="muted">Unassigned</span>'; return '<span class="pcell">' + ui.avatar(store.name(e), 'sm') + '<span style="min-width:0"><div class="pcell__t">' + ui.esc(store.name(e)) + '</div>' + (sub !== false ? '<div class="pcell__s">' + ui.esc(sub || store.role(e.jobRoleId).name) + '</div>' : '') + '</span></span>'; };
  app.empLink = function (e) { return e ? '<a class="link" style="color:var(--ink);font-size:inherit" href="#/employees/' + e.id + '">' + ui.esc(store.name(e)) + '</a>' : '<span class="muted">Unassigned</span>'; };
  app.deptColor = function (deptId) { return { 'd-kit': 'var(--k-kit)', 'd-foh': 'var(--k-foh)', 'd-bar': 'var(--k-bar)', 'd-del': 'var(--k-del)', 'd-ops': 'var(--k-ops)' }[deptId] || 'var(--k-ops)'; };
  app.run = function (fn, ok) { return ui.run(fn, ok); };
  app.userMenu = function (a) { userMenu(a); };

  /* ---------- location scope ---------- */
  function locMenu(anchor) {
    var cur = store.scopeLoc() || '';
    var items = [{ label: 'Show data for', header: true }, { label: 'All my locations', icon: 'layers', on: !cur, fn: function () { setLoc(''); } }];
    store.myLocations().forEach(function (l) { items.push({ label: l.name + ' · ' + l.type, icon: 'pin', on: cur === l.id, fn: function () { setLoc(l.id); } }); });
    if (store.can('org.settings')) items.push('-', { label: 'Manage locations', icon: 'settings', fn: function () { app.go('#/settings?tab=locations'); } });
    ui.menu(anchor, items, { alignLeft: true });
  }
  function setLoc(id) { store.setPref('loc', id); chrome(); render(true); ui.toast(id ? 'Showing ' + store.locName(id) + ' only' : 'Showing all your locations', 'info'); }
  app.setLoc = setLoc;
  function orgMenu(anchor) {
    var S = store.state;
    ui.menu(anchor, [{ label: 'Organisation', header: true }, { label: S.org.name, icon: 'building', on: true, fn: function () {} }, { label: 'Organisation settings', icon: 'settings', disabled: store.can('org.settings') ? false : store.why('org.settings'), fn: function () { app.go('#/settings?tab=org'); } }, { label: 'Users & access', icon: 'shield', disabled: store.can('users.manage') ? false : store.why('users.manage'), fn: function () { app.go('#/settings?tab=users'); } }, '-', { label: 'Public careers page', icon: 'globe', fn: function () { app.go('#/careers'); } }], { alignLeft: true });
  }

  /* ---------- reset ---------- */
  function resetDemo() {
    ui.confirm({ title: 'Reset the demo?', body: 'This rebuilds the sample company around today’s date and removes every change you made in this browser: shifts, clock records, requests, candidates, payroll runs, uploads and settings.', ok: 'Reset demo', danger: true }).then(function (ok) {
      if (!ok) return;
      store.reset(); store.setPref('loc', '');
      app.go('#/overview'); chrome();
      ui.toast('Demo reset to fresh sample data');
    });
  }
  app.reset = resetDemo;

  /* ---------- command palette ---------- */
  function quick() {
    var q = [];
    if (store.canAny('schedule.edit')) q.push(['Add a shift', 'Scheduling', '#/schedule?new=1', 'plus'], ['Fill open shifts', 'Scheduling', '#/schedule?filter=open', 'alert']);
    if (store.myEmp()) q.push(['Clock in or out', 'Time clock', '#/clock', 'timer']);
    q.push(['Request time off', 'Time off', '#/time-off?new=1', 'plane']);
    if (store.pendingForMe().length) q.push(['Review time-off requests', 'Time off', '#/time-off?tab=approvals', 'approve']);
    if (store.canAny('attendance.view')) q.push(['Today’s attendance exceptions', 'Attendance', '#/attendance?exc=any', 'clock']);
    if (store.can('hiring.view')) q.push(['Hiring pipeline', 'Hiring', '#/hiring', 'kanban']);
    if (store.can('payroll.view')) q.push(['Run payroll', 'Payroll', '#/payroll', 'wallet']);
    if (store.canAny('reports.view')) q.push(['Labour cost report', 'Reports', '#/reports?r=cost', 'chart']);
    return q;
  }
  function palette() {
    if (document.querySelector('.cmdk')) return;
    var m = ui.modal({ title: 'Search', foot: false, body: '' });
    m.el.className = 'modal cmdk';
    m.el.innerHTML = '<div class="cmdk__in">' + ui.icon('search', 18) + '<input type="text" placeholder="Search people, candidates, jobs, locations…" aria-label="Search" autocomplete="off"><span class="kbd">Esc</span></div><div class="cmdk__res" role="listbox" aria-label="Results"></div><div class="cmdk__foot"><span>↑↓ to move</span><span>↵ to open</span><span>Try “Kevin”, “barista” or “Karen”</span></div>';
    var inp = m.el.querySelector('input'), res = m.el.querySelector('.cmdk__res'), items = [], on = 0;
    function draw() {
      var q = inp.value.trim();
      items = q ? store.search(q, 6) : quick().map(function (x) { return { type: 'Quick actions', title: x[0], sub: x[1], link: x[2], icon: x[3] }; });
      on = 0;
      if (!items.length) { res.innerHTML = ui.empty('search', 'No matches', 'Search covers employees you can see, candidates, job openings and locations.'); return; }
      var h = '', g = null, ICON = { Employee: 'user', Candidate: 'userplus', Job: 'briefcase', Location: 'pin' };
      items.forEach(function (it, i) {
        if (it.type !== g) { g = it.type; h += '<div class="cmdk__g">' + ui.esc(g === 'Quick actions' ? g : g + 's') + '</div>'; }
        var lead = it.emp ? ui.avatar(store.name(it.emp), 'sm') : '<span class="ico-c">' + ui.icon(it.icon || ICON[it.type], 15) + '</span>';
        h += '<div class="cmdk__i" role="option" data-i="' + i + '">' + lead + '<div><div class="t">' + ui.esc(it.title) + '</div><div class="s">' + ui.esc(it.sub) + '</div></div></div>';
      });
      res.innerHTML = h; hl();
    }
    function hl() { res.querySelectorAll('.cmdk__i').forEach(function (el, i) { el.classList.toggle('on', i === on); el.setAttribute('aria-selected', i === on); if (i === on) el.scrollIntoView({ block: 'nearest' }); }); }
    function open(i) { var it = items[i]; if (!it) return; m.close(); app.go(it.link); }
    inp.addEventListener('input', ui.debounce(draw, 60));
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); on = Math.min(items.length - 1, on + 1); hl(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); on = Math.max(0, on - 1); hl(); }
      else if (e.key === 'Enter') { e.preventDefault(); open(on); }
    });
    res.addEventListener('click', function (e) { var r = e.target.closest('[data-i]'); if (r) open(+r.getAttribute('data-i')); });
    draw(); setTimeout(function () { inp.focus(); }, 30);
  }
  app.palette = palette;

  /* ---------- notifications ---------- */
  function notifPanel(anchor) {
    var list = store.notifications(), unread = list.filter(function (n) { return !n.isRead; }).length;
    var TONE = { warn: 'ico-c--amber', info: 'ico-c--blue', ok: 'ico-c--green' };
    var html = '<div class="npanel__h"><b>Notifications' + (unread ? ' <span class="bdg bdg--acc">' + unread + ' new</span>' : '') + '</b>' + (unread ? '<button class="link" data-all>Mark all as read</button>' : '') + '</div><div class="npanel__b">' +
      (list.length ? list.slice(0, 40).map(function (n) { return '<div class="nitem ' + (n.isRead ? 'read' : 'unread') + '" data-id="' + ui.esc(n.id) + '" data-link="' + ui.esc(n.link) + '" tabindex="0" role="button"><span class="ico-c ' + (TONE[n.kind] || 'ico-c--blue') + '">' + ui.icon(n.icon, 15) + '</span><div><div class="nitem__t">' + ui.esc(n.title) + '</div><div class="nitem__s">' + ui.esc(n.body) + ' · ' + ui.rel(n.at) + '</div></div></div>'; }).join('') : ui.empty('bell', 'You’re all caught up', 'Requests, schedule changes, attendance exceptions, applications and payroll tasks appear here.')) + '</div>';
    var p = ui.pop(anchor, html, { cls: 'npanel' });
    p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', 'Notifications');
    p.addEventListener('click', function (e) {
      if (e.target.closest('[data-all]')) { store.markAllRead(); ui.closePop(); ui.toast('All notifications marked as read'); return; }
      var it = e.target.closest('.nitem'); if (!it) return;
      store.markRead(it.getAttribute('data-id')); ui.closePop(); app.go(it.getAttribute('data-link'));
    });
    p.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.classList.contains('nitem')) e.target.click(); });
    var f = p.querySelector('.nitem,[data-all]'); if (f) f.focus();
  }

  /* ---------- user menu ---------- */
  function userMenu(anchor) {
    var S = store.state, me = store.me(), items = [{ label: 'Try the demo as…', header: true }];
    S.users.filter(function (u) { return u.status === 'active'; }).forEach(function (u) {
      var where = u.locationIds === 'all' ? 'All locations' : u.locationIds.map(store.locName).join(', ');
      items.push({ label: u.name + ' · ' + policy.roleName(u.role) + (u.role === 'locmgr' || u.role === 'ops' ? ' (' + where + ')' : ''), html: ui.avatar(u.name, 'xs'), on: u.id === me.id, fn: function () { ui.run(function () { store.setCurrentUser(u.id); store.setPref('loc', ''); }); ui.toast('Now viewing as ' + u.name + ', ' + policy.roleName(u.role) + '. Access follows their role.', 'info'); app.go('#/overview'); } });
    });
    var emp = store.myEmp();
    items.push('-');
    if (emp) items.push({ label: 'My profile', icon: 'user', fn: function () { app.go('#/employees/' + emp.id); } });
    items.push({ label: 'Notification settings', icon: 'bell', fn: function () { app.go('#/settings?tab=notifications'); } }, { label: 'Template guide', icon: 'help', fn: guide }, { label: 'Reset demo data', icon: 'refresh', danger: true, fn: resetDemo });
    ui.menu(anchor, items, { cls: 'umenu' });
  }

  /* ---------- guide ---------- */
  function guide() {
    var steps = [
      ['Build next week’s schedule', 'Drag shifts between people and days, fill open shifts, then publish.', '#/schedule?week=next'],
      ['Approve or decline time off', 'See coverage gaps and overlapping requests before deciding.', '#/time-off?tab=approvals'],
      ['Review attendance exceptions', 'Late arrivals, missed clock-outs and absences, with corrections that keep an audit trail.', '#/attendance?exc=any'],
      ['Clock in as an employee', 'Switch to Kevin Otieno from the account menu, then open Time clock.', '#/clock'],
      ['Move candidates through hiring', 'Drag cards across stages, schedule interviews, hire into an employee record.', '#/hiring'],
      ['Run payroll for the last period', 'Approve timesheets, calculate, review flags, approve (as a second person) and record payment.', '#/payroll'],
      ['Filter reports by location', 'Every report follows the location picker in the top bar and exports to CSV.', '#/reports'],
      ['Switch users to test permissions', 'A location manager only sees their locations; an employee sees only their own data.', '#/settings?tab=users']
    ];
    ui.modal({
      title: 'Welcome to KINTRA', size: 'wide',
      sub: 'A working template of a workforce management product. It opens on Kijani Hearth Hospitality, a fictional restaurant group with four Nairobi locations and 40+ demo employees. Every name, figure and record is invented demo data.',
      body: '<div class="grid g-2" style="gap:6px">' + steps.map(function (s, i) { return '<a class="guide-i" href="' + s[2] + '" data-close><span class="n">' + (i + 1) + '</span><span><b>' + s[0] + '</b><span>' + s[1] + '</span></span></a>'; }).join('') + '</div><div class="note note--plain" style="margin-top:12px">' + ui.icon('info', 15) + '<span>Changes are saved in this browser only. Nothing is emailed, no money moves and no GPS or biometric checks run. <b>Reset</b> in the top bar starts over. Press <span class="kbd">⌘K</span> or <span class="kbd">/</span> to search.</span></div>',
      foot: '<span class="sp"></span><button class="btn btn--p" data-x>Start exploring</button>',
      onOpen: function (el, api) { el.querySelectorAll('[data-close]').forEach(function (a) { a.addEventListener('click', function () { api.close(); }); }); }
    });
  }
  app.guide = guide;

  KT.logo = function (s) { s = s || 16; return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 4v16"/><path d="M18 4 9.5 12 18 20"/><path d="M12.5 9.2 17 4.6"/></svg>'; };
  document.addEventListener('DOMContentLoaded', boot);
})();
