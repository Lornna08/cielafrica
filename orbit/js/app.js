/* ============================================================
   ORBIT SOCIAL — application shell & router
   ============================================================ */
window.OS = window.OS || {};
(function () {
  'use strict';
  var ui = OS.ui, store = OS.store, T = OS.time, policy = OS.policy;
  var app = OS.app = { routes: [] };

  OS.route = function (pattern, fn) {
    var keys = [], re = new RegExp('^' + pattern.replace(/:[a-z]+/g, function (m) { keys.push(m.slice(1)); return '([^/]+)'; }) + '$');
    app.routes.push({ re: re, keys: keys, fn: fn });
  };
  app.go = function (hash) { if (location.hash === hash) render(); else location.hash = hash; };

  var NAV = [
    { id: 'overview', label: 'Overview', icon: 'grid', href: '#/overview' },
    { id: 'compose', label: 'Compose', icon: 'pen', href: '#/compose', show: function () { return store.can('content.edit'); } },
    { id: 'calendar', label: 'Calendar', icon: 'cal', href: '#/calendar' },
    { id: 'library', label: 'Content Library', icon: 'folder', href: '#/library' },
    { id: 'approvals', label: 'Approvals', icon: 'approve', href: '#/approvals', count: function () { return store.postsInScope().filter(function (p) { return p.status === 'in_review' && !store.reviewBlock(p); }).length; }, countTitle: 'Waiting for your review' },
    { sec: 'Insights' },
    { id: 'analytics', label: 'Analytics', icon: 'chart', href: '#/analytics', show: function () { return store.can('analytics.view'); } },
    { id: 'inbox', label: 'Inbox', icon: 'inbox', href: '#/inbox', show: function () { return store.can('inbox.view'); }, count: function () { return store.can('inbox.view') ? store.state.conversations.filter(function (c) { return store.inScope(c.brandId) && c.unread && c.status === 'open'; }).length : 0; }, countTitle: 'Unread conversations' },
    { sec: 'Workspace' },
    { id: 'team', label: 'Team & Roles', icon: 'users', href: '#/team', show: function () { return store.me().role !== 'client'; } },
    { id: 'settings', label: 'Settings', icon: 'settings', href: '#/settings' }
  ];

  function navHtml(active) {
    return NAV.map(function (n) {
      if (n.sec) return '<div class="side__sec">' + n.sec + '</div>';
      if (n.show && !n.show()) return '';
      var c = n.count ? n.count() : 0;
      return '<a class="nav-i' + (active === n.id ? ' on' : '') + '" href="' + n.href + '" title="' + n.label + '"' + (active === n.id ? ' aria-current="page"' : '') + '>' + ui.icon(n.icon, 18) + '<span>' + n.label + '</span>' + (c ? '<em class="cnt" title="' + n.countTitle + '">' + c + '</em><i class="cnt-dot"></i>' : '') + '</a>';
    }).join('');
  }

  var shell, view, current = null, lastHash = null;
  function boot() {
    store.init();
    // With <base href="/orbit/">, "#/route" links would point at /orbit/#/route (a full reload
    // and a redirect, since the page is served at /orbit). Keep them as in-page hash changes.
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a || a.target) return;
      e.preventDefault();
      var h = a.getAttribute('href');
      if (h.length > 1 && location.hash !== h) location.hash = h;
    });
    document.body.insertAdjacentHTML('afterbegin',
      '<div class="demo-bar" role="region" aria-label="Template notice"><a class="demo-bar__back" href="../index.html" aria-label="Back to Ciel Africa"><b>‹</b><span> Ciel Africa</span></a><span class="dot"></span><span class="demo-bar__msg"><b><span class="txt-long">You’re exploring the </span>ORBIT Social template<span class="txt-long">.</span></b> <span class="txt-long">Sample accounts and data, saved in this browser only. Nothing is posted to real networks.</span></span>' +
      '<span class="demo-bar__acts"><button type="button" data-guide class="hide-sm">Guide</button><button type="button" data-reset>Reset</button><a class="pri" href="../quote.html?template=ORBIT%20Social">Get ORBIT</a></span></div>' +
      '<div class="shell' + (store.prefs.collapsed ? ' is-collapsed' : '') + '" id="shell"><aside class="side" aria-label="Main navigation"><div class="side__brand"><span class="logo">' + ui.icon('orbit', 18, 2) + '</span><span class="side__name">ORBIT<span>Social</span></span></div>' +
      '<button class="ws" id="wsbtn" type="button" aria-label="Workspace"></button><nav class="side__nav" id="nav"></nav>' +
      '<div class="side__foot"><button class="collapse-btn" id="collapse" aria-label="Collapse sidebar">' + ui.icon('collapse', 18) + '<span>Collapse</span></button></div></aside><div class="scrim" id="scrim"></div>' +
      '<div class="main"><header class="top"><button class="burger" id="burger" aria-label="Open navigation">' + ui.icon('menu', 18) + '</button><button class="brandsel" id="brandsel" type="button" aria-haspopup="listbox"></button><div class="crumbs" id="crumbs"></div><div class="top__sp"></div>' +
      '<button class="gsearch" id="gsearch" aria-label="Search">' + ui.icon('search', 15) + '<span><span class="gs-long">Search posts, files, conversations…</span><span class="gs-short">Search…</span></span><span class="kbd">⌘K</span></button>' +
      '<button class="ibtn" id="bell" aria-label="Notifications">' + ui.icon('bell', 18) + '</button>' +
      '<a class="btn btn--p top-create" id="create" href="#/compose">' + ui.icon('plus', 16, 2.2) + '<span>Create post</span></a>' +
      '<button class="userbtn" id="userbtn" aria-label="Account"></button></header><main class="view" id="view" tabindex="-1"></main></div></div>');
    shell = document.getElementById('shell'); view = document.getElementById('view');
    document.getElementById('collapse').onclick = function () { shell.classList.toggle('is-collapsed'); store.setPref('collapsed', shell.classList.contains('is-collapsed')); };
    document.getElementById('burger').onclick = function () { shell.classList.add('nav-open'); };
    document.getElementById('scrim').onclick = function () { shell.classList.remove('nav-open'); };
    document.getElementById('nav').addEventListener('click', function (e) { if (e.target.closest('a')) shell.classList.remove('nav-open'); });
    document.getElementById('gsearch').onclick = palette;
    document.getElementById('bell').onclick = function (e) { notifPanel(e.currentTarget); };
    document.getElementById('userbtn').onclick = function (e) { userMenu(e.currentTarget); };
    document.getElementById('brandsel').onclick = function (e) { brandMenu(e.currentTarget); };
    document.getElementById('wsbtn').onclick = function (e) { wsMenu(e.currentTarget); };
    document.querySelector('[data-reset]').onclick = resetDemo;
    document.querySelector('[data-guide]').onclick = guide;
    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); palette(); }
      else if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && !document.activeElement.isContentEditable && !document.querySelector('.ov')) { e.preventDefault(); palette(); }
      else if (e.key === 'Escape') { if (document.querySelector('.pop')) ui.closePop(); else if (!ui.closeTop()) shell.classList.remove('nav-open'); }
    });
    window.addEventListener('hashchange', function () { render(); });
    store.subscribe(function (what) { chrome(); if (current && current.onChange) current.onChange(what); else if (current && !current.static) render(true); });
    if (!store.persistOk()) setTimeout(function () { ui.toast('Your browser is blocking storage, so changes will reset when you leave the page.', 'info'); }, 800);
    if (!location.hash || location.hash === '#' || location.hash === '#/') location.replace(location.pathname + location.search + '#/overview');
    render();
    tick(true);
    setInterval(function () { tick(false); }, 30000);
    if (!store.prefs.welcomed) { store.setPref('welcomed', 1); setTimeout(guide, 700); }
  }
  // simulated scheduler: in production this runs on the server (cron/queue), not in a tab
  function tick(first) {
    var n = store.runScheduler();
    if (n) ui.toast((first ? 'While you were away, the' : 'The') + ' simulated scheduler published ' + n + ' post' + (n > 1 ? 's' : '') + '. Nothing was sent to real networks.', 'info');
  }

  function chrome() {
    var hash = location.hash.replace(/^#/, '') || '/overview';
    var seg = hash.split('?')[0].split('/')[1] || 'overview';
    document.getElementById('nav').innerHTML = navHtml(seg);
    var me = store.me(), unread = store.notifications().filter(function (n) { return !n.read; }).length, S = store.state;
    document.getElementById('userbtn').innerHTML = ui.avatar(me.name) + '<span><div class="nm">' + ui.esc(me.name) + '</div><div class="rl">' + ui.esc(policy.roleName(me.role)) + '</div></span>' + ui.icon('chevD', 14);
    document.getElementById('bell').innerHTML = ui.icon('bell', 18) + (unread ? '<span class="pip">' + (unread > 9 ? '9+' : unread) + '</span>' : '');
    var b = store.scopeBrand();
    document.getElementById('brandsel').innerHTML = (b ? ui.brandMark(b, 24) + '<span>' + ui.esc(b.name) + '</span>' : '<span class="allmark"></span><span>All brands</span>') + ui.icon('chevD', 14);
    document.getElementById('wsbtn').innerHTML = '<span class="logo" style="width:28px;height:28px;border-radius:8px;background:#26322E">' + ui.icon('building', 15) + '</span><span class="ws__t"><b>' + ui.esc(S.workspace.name) + '</b><span>' + ui.esc(S.workspace.plan) + ' workspace · ' + store.brands().length + ' brands</span></span>' + ui.icon('chevD', 14);
    var cr = document.getElementById('create');
    var canCreate = store.can('content.edit', b ? b.id : null) || store.brands().some(function (x) { return store.can('content.edit', x.id); });
    cr.style.display = canCreate ? '' : 'none';
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
    chrome();
    var page;
    try { page = match ? match.fn(params, q) : null; } catch (e) { console.error(e); page = { title: 'Something went wrong', html: ui.empty('alert', 'This page hit an error', ui.esc(e.message)) }; }
    if (!page) page = { title: 'Not found', html: ui.empty('search', 'We couldn’t find that page', 'It may have been deleted, or the template was reset.', '<a class="btn btn--sm" href="#/overview" style="margin-top:8px">Back to overview</a>') };
    current = page;
    document.title = (page.title ? page.title + ' · ' : '') + 'ORBIT Social template';
    document.getElementById('crumbs').innerHTML = (page.crumbs || []).map(function (c) { return '<a href="' + c[1] + '">' + ui.esc(c[0]) + '</a>' + ui.icon('chevR', 13); }).join('') + (page.crumbs && page.crumbs.length ? '<b>' + ui.esc(page.title || '') + '</b>' : '');
    // Fresh element per render so listeners bound by an earlier page's mount() never stack up.
    var fresh = view.cloneNode(false); view.parentNode.replaceChild(fresh, view); view = fresh;
    view.className = 'view' + (page.wide ? ' view--wide' : '') + (page.full ? ' view--full' : '');
    view.innerHTML = page.html || '';
    if (!same || !keepScroll) { view.classList.remove('view-enter'); void view.offsetWidth; view.classList.add('view-enter'); }
    if (page.mount) { try { page.mount(view); } catch (e) { console.error(e); ui.toast('This view hit an error: ' + e.message, 'err'); } }
    ui.hydrate(view);
    if (same && keepScroll) window.scrollTo(0, y); else window.scrollTo(0, 0);
  }
  app.render = render;
  app.refresh = function () { render(true); };

  /* ---------- shared page bits ---------- */
  app.ph = function (title, sub, actions) { return '<div class="ph"><div><h1>' + title + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div><div class="ph__acts">' + (actions || '') + '</div></div>'; };
  app.tabs = function (items, active) { return '<div class="tabs" role="tablist">' + items.map(function (t) { return '<a class="tab' + (t[0] === active ? ' on' : '') + '" href="' + t[2] + '" role="tab" aria-selected="' + (t[0] === active) + '">' + t[1] + (t[3] != null ? ' <span class="cnt">' + t[3] + '</span>' : '') + '</a>'; }).join('') + '</div>'; };
  app.locked = function (title, perm, brandId) {
    var w = store.why(perm, brandId);
    return '<div class="card">' + ui.empty('lock', title, ui.esc(w || 'You don’t have access to this page.') + '<br>Ask a workspace administrator to change your role, or switch user from the account menu (template).', '<button class="btn btn--sm" data-switch style="margin-top:8px">' + ui.icon('users', 15) + 'Switch user</button>') + '</div>';
  };
  app.bindLocked = function (root) { var b = root.querySelector('[data-switch]'); if (b) b.onclick = function (e) { userMenu(e.currentTarget); }; };
  app.userName = function (id) { var u = id && store.user(id); return u ? u.name : (id ? 'Former member' : 'ORBIT'); };
  app.brandOptions = function (perm, all) {
    var bs = store.brands().filter(function (b) { return !perm || store.can(perm, b.id); });
    var o = bs.map(function (b) { return { value: b.id, label: b.name }; });
    return all ? [{ value: '', label: 'All brands' }].concat(o) : o;
  };
  app.updateQuery = function (q) {
    var hash = location.hash.replace(/^#/, ''), path = hash.split('?')[0];
    var qs = Object.keys(q).filter(function (k) { return q[k] !== '' && q[k] != null; }).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(q[k]); }).join('&');
    history.replaceState(null, '', location.pathname + location.search + '#' + path + (qs ? '?' + qs : ''));
    lastHash = location.hash.replace(/^#/, '');
  };

  /* ---------- brand switcher ---------- */
  function brandMenu(anchor) {
    var cur = store.prefs.brand || '';
    var items = [{ label: 'Show content for', header: true }, { label: 'All brands', icon: 'layers', on: !cur, fn: function () { setBrand(''); } }];
    store.brands().forEach(function (b) { items.push({ label: b.name, html: ui.brandMark(b, 20), on: cur === b.id, fn: function () { setBrand(b.id); } }); });
    if (store.can('settings.manage')) items.push('-', { label: 'Manage brands', icon: 'settings', fn: function () { app.go('#/settings?tab=brands'); } });
    ui.menu(anchor, items, { alignLeft: true });
  }
  function setBrand(id) { store.setPref('brand', id); chrome(); render(true); }
  app.setBrand = setBrand;
  function wsMenu(anchor) {
    var S = store.state;
    ui.menu(anchor, [{ label: 'Workspace', header: true }, { label: S.workspace.name, icon: 'building', on: true, fn: function () {} }, { label: 'Other workspaces appear here', icon: 'plus', disabled: 'Multiple workspaces aren’t part of this template', fn: function () {} }, '-', { label: 'Workspace settings', icon: 'settings', fn: function () { app.go('#/settings'); } }, { label: 'Connected accounts', icon: 'plug', fn: function () { app.go('#/settings?tab=accounts'); } }], { alignLeft: true });
  }

  /* ---------- reset ---------- */
  function resetDemo() {
    ui.confirm({ title: 'Reset the template?', body: 'This restores the original sample workspace and removes every post, upload, comment and setting you changed in this browser.', ok: 'Reset template', danger: true }).then(function (ok) {
      if (!ok) return;
      store.reset(); store.setPref('brand', '');
      app.go('#/overview'); chrome();
      ui.toast('Template reset to the original sample data');
    });
  }
  app.reset = resetDemo;

  /* ---------- command palette ---------- */
  var QUICK = [
    { t: 'Create a post', s: 'Compose', link: '#/compose', icon: 'pen' },
    { t: 'Review waiting posts', s: 'Approvals', link: '#/approvals', icon: 'approve' },
    { t: 'This week’s calendar', s: 'Calendar', link: '#/calendar?view=week', icon: 'week' },
    { t: 'Upload media', s: 'Content Library', link: '#/library?upload=1', icon: 'upload' },
    { t: 'Unread conversations', s: 'Inbox', link: '#/inbox?filter=unread', icon: 'inbox' },
    { t: 'Export analytics (CSV)', s: 'Analytics', link: '#/analytics', icon: 'download' },
    { t: 'Connected accounts', s: 'Settings', link: '#/settings?tab=accounts', icon: 'plug' }
  ];
  function palette() {
    if (document.querySelector('.cmdk')) return;
    var m = ui.modal({ title: 'Search', foot: false, body: '' });
    m.el.className = 'modal cmdk';
    m.el.innerHTML = '<div class="cmdk__in">' + ui.icon('search', 18) + '<input type="text" placeholder="Search posts, files, conversations, campaigns, people…" aria-label="Search" autocomplete="off"><span class="kbd">Esc</span></div><div class="cmdk__res" role="listbox"></div><div class="cmdk__foot"><span>↑↓ to move</span><span>↵ to open</span><span>Try “harvest”, “serum” or “Njoki”</span></div>';
    var inp = m.el.querySelector('input'), res = m.el.querySelector('.cmdk__res'), items = [], on = 0;
    function draw() {
      var q = inp.value.trim();
      items = q ? store.search(q, 5) : QUICK.map(function (x) { return { type: 'Quick actions', title: x.t, sub: x.s, link: x.link, icon: x.icon }; });
      on = 0;
      if (!items.length) { res.innerHTML = ui.empty('search', 'No matches', 'Search covers captions, file names and tags, conversations, campaigns and people in the brands you can see.'); return; }
      var h = '', g = null, ICON = { Post: 'pen', File: 'image', Conversation: 'message', Campaign: 'flag', Person: 'user' };
      items.forEach(function (it, i) {
        if (it.type !== g) { g = it.type; h += '<div class="cmdk__g">' + ui.esc(g === 'Quick actions' ? g : g + 's') + '</div>'; }
        var lead = it.asset ? ui.media(it.asset, { cls: 'mthumb--30' }) : it.post && it.post.mediaIds.length ? ui.media(store.asset(it.post.mediaIds[0]), { cls: 'mthumb--30' }) : '<span class="ico-c">' + ui.icon(it.icon || ICON[it.type], 16) + '</span>';
        h += '<div class="cmdk__i" role="option" data-i="' + i + '">' + lead + '<div><div class="t">' + ui.esc(it.title) + '</div><div class="s">' + ui.esc(it.sub) + '</div></div></div>';
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
    var ICON = { warn: 'ico-c--amber', info: 'ico-c--blue', ok: 'ico-c--green' };
    var html = '<div class="npanel__h"><b>Notifications' + (unread ? ' <span class="pill pill--acc pill--plain">' + unread + ' new</span>' : '') + '</b>' + (unread ? '<button class="link" data-all>Mark all as read</button>' : '') + '</div><div class="npanel__b">' +
      (list.length ? list.map(function (n) { return '<div class="nitem ' + (n.read ? 'read' : 'unread') + '" data-id="' + ui.esc(n.id) + '" data-link="' + ui.esc(n.link) + '" tabindex="0" role="button"><span class="ico-c ' + (ICON[n.kind] || 'ico-c--blue') + '">' + ui.icon(n.icon, 15) + '</span><div><div class="nitem__t">' + ui.esc(n.title) + '</div><div class="nitem__s">' + ui.esc(n.body) + (n.at ? ' · ' + ui.rel(n.at) : '') + '</div></div></div>'; }).join('') : ui.empty('bell', 'You’re all caught up', 'Review requests, feedback, failed posts and mentions appear here.')) + '</div>';
    var p = ui.pop(anchor, html, { cls: 'npanel' });
    p.addEventListener('click', function (e) {
      if (e.target.closest('[data-all]')) { store.markAllRead(); ui.closePop(); ui.toast('All notifications marked as read'); return; }
      var it = e.target.closest('.nitem'); if (!it) return;
      store.markRead(it.getAttribute('data-id')); ui.closePop(); app.go(it.getAttribute('data-link'));
    });
    p.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.classList.contains('nitem')) e.target.click(); });
  }

  /* ---------- user menu ---------- */
  function userMenu(anchor) {
    var S = store.state, me = store.me(), items = [{ label: 'Switch user (template only)', header: true }];
    S.users.filter(function (u) { return u.status === 'active'; }).forEach(function (u) { items.push({ label: u.name + ' · ' + policy.roleName(u.role), html: ui.avatar(u.name, 'xs'), on: u.id === me.id, fn: function () { ui.run(function () { store.setCurrentUser(u.id); }); ui.toast('Now acting as ' + u.name + ' (' + policy.roleName(u.role) + '). Permissions follow their role.'); render(); } }); });
    items.push('-', { label: 'Your profile & notifications', icon: 'user', fn: function () { app.go('#/settings?tab=profile'); } }, { label: 'Template guide', icon: 'help', fn: guide }, { label: 'Reset template data', icon: 'refresh', danger: true, fn: resetDemo });
    ui.menu(anchor, items, { cls: 'umenu' });
  }

  /* ---------- guide ---------- */
  function guide() {
    var steps = [
      ['Write a post for several networks', 'Pick accounts, write once, then check each network’s preview and limits.', '#/compose'],
      ['Review and approve', 'Approve a waiting post, or request changes with a note.', '#/approvals'],
      ['Reschedule by dragging', 'Drag a post to another day in the month or week view.', '#/calendar'],
      ['Switch user to test permissions', 'Act as a client reviewer, creator or analyst from the account menu.', '#/team'],
      ['Reuse a file from the library', 'Open any asset and choose “Use in a post”.', '#/library'],
      ['Answer the inbox', 'Reply, add an internal note or assign a teammate.', '#/inbox'],
      ['Compare channels', 'Filter by date range and export the report to CSV.', '#/analytics'],
      ['See what’s real and what’s simulated', 'Connections, publishing and metrics are all labelled.', '#/settings?tab=accounts']
    ];
    ui.modal({
      title: 'Welcome to the ORBIT Social template', size: 'wide',
      sub: 'A working social media workspace for a fictional agency, Northlight Studio, and four client brands. The accounts are sample accounts: nothing is posted to Instagram, TikTok or anywhere else, and every metric is generated sample data.',
      body: '<div class="g-2 grid" style="gap:4px">' + steps.map(function (s, i) { return '<a class="guide-i" href="' + s[2] + '" data-close><span class="n">' + (i + 1) + '</span><span><b>' + s[0] + '</b><span>' + s[1] + '</span></span></a>'; }).join('') + '</div><div class="note note--plain" style="margin-top:14px">' + ui.icon('info', 15) + '<span>Your changes are saved in this browser only. Use <b>Reset</b> in the top bar to start over. Press <span class="kbd">⌘K</span> or <span class="kbd">/</span> to search.</span></div>',
      foot: '<span class="sp"></span><button class="btn btn--p" data-x>Start exploring</button>',
      onOpen: function (el, api) { el.querySelectorAll('[data-close]').forEach(function (a) { a.addEventListener('click', function () { api.close(); }); }); }
    });
  }
  app.guide = guide;

  document.addEventListener('DOMContentLoaded', boot);
})();
