/* ============================================================
   Reside Ke — application shell: navigation, routing, search,
   notifications and the live team chat panel
   ============================================================ */
(function () {
  'use strict';
  var I = ES.icon, st = ES.store, f = ES.fmt, esc = f.esc;
  ES.pages = {};
  ES.ui = { listings: { view: 'grid', q: '', type: '', cat: '', status: '', area: '', beds: '', agent: '', min: '', max: '', listed: '', sort: 'newest', page: 1 }, deals: { agent: '', kind: 'all', showLost: false }, leads: { q: '', status: '', source: '', agent: '', sort: 'recent' }, contacts: { q: '', type: '' }, cal: { view: 'month', cursor: null }, chat: { conv: 'cv1', open: true, drafts: {} }, period: 12 };

  var PRIMARY = [
    { id: 'overview', label: 'Overview', icon: 'home' },
    { id: 'listings', label: 'Listings', icon: 'building' },
    { id: 'rentals', label: 'Rentals', icon: 'key' },
    { id: 'sales', label: 'Sales', icon: 'tag' },
    { id: 'deals', label: 'Deals', icon: 'board' },
    { id: 'leads', label: 'Leads', icon: 'user', badge: function () { return st.newLeadCount(); } },
    { id: 'contacts', label: 'Contacts', icon: 'users' }
  ];
  var MORE = [
    { id: 'rentals', sub: 'management', label: 'Property management', icon: 'wrench' },
    { id: 'tasks', label: 'Tasks & follow-ups', icon: 'task', badge: function () { return st.overdueFollowups().length; } },
    { id: 'calendar', label: 'Calendar', icon: 'cal' },
    { id: 'team', label: 'Team', icon: 'users' },
    { id: 'commissions', label: 'Commission reports', icon: 'wallet' },
    { id: 'analytics', label: 'Analytics', icon: 'chart' },
    { id: 'documents', label: 'Documents', icon: 'file' },
    { id: 'settings', label: 'Settings', icon: 'gear' }
  ];
  var TAB_OF = { property: 'listings', 'listing-new': 'listings', 'listing-edit': 'listings', deal: 'deals', contact: 'contacts', lead: 'leads' };

  /* ---------------- shell ---------------- */
  function shell() {
    document.body.innerHTML =
      '<div class="demo-bar" role="region" aria-label="Demo notice"><span class="dot" aria-hidden="true"></span><span class="demo-bar__t">You’re exploring the <b>Reside Ke demo</b>. Changes affect sample data only.</span><span class="demo-bar__a"><button class="db-btn" data-act="reset">Reset demo</button><a class="db-btn db-hide" href="./#features">View features</a><a class="db-btn db-btn--p" href="../quote.html?template=Reside%20Ke">Get Reside Ke</a></span></div>' +
      '<div class="app" id="app">' +
      '<div class="main">' +
      '<header class="top"><button class="ib top__menu" data-act="drawer" aria-label="Open navigation">' + I('menu', 20) + '</button>' +
      '<a class="brand" href="#/overview" aria-label="Reside Ke overview"><span class="brand__m">' + I('logo', 18) + '</span><span class="brand__w">RESIDE<em>KE</em></span></a>' +
      '<span class="top__agency">' + esc(st.s.settings.agency) + '</span><span class="top__sp"></span>' +
      '<button class="ib ib--round" data-act="search" aria-label="Search (Ctrl+K)">' + I('search', 18) + '</button>' +
      '<button class="ib ib--round" data-act="notes" aria-label="Notifications">' + I('bell', 18) + '<i class="ib__dot" id="noteDot" hidden></i></button>' +
      '<button class="ib ib--round top__hide-s" data-act="help" aria-label="Help">' + I('help', 18) + '</button>' +
      '<button class="ib ib--round top__chat" data-act="chatm" aria-label="Team chat">' + I('chat', 18) + '<i class="ib__dot" id="chatDot" hidden></i></button>' +
      '<button class="me" data-act="me" aria-label="Your profile">' + ES.av(st.me(), 36) + '</button></header>' +
      '<nav class="tabs" id="tabs" aria-label="Primary"></nav>' +
      '<main class="view" id="view" tabindex="-1"></main></div>' +
      '<aside class="chat" id="chat" aria-label="Team chat"></aside></div>' +
      '<button class="chat-fab" data-act="chatm" aria-label="Open team chat">' + I('chat', 22) + '<i id="fabDot" hidden></i></button>';
    document.body.addEventListener('click', onClick);
    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSearch(); }
      if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement.tagName) && !document.querySelector('.ovl')) { e.preventDefault(); openSearch(); }
    });
    window.addEventListener('resize', debounce(function () { var r = route(); if (r.redrawOnResize) render(); }, 200));
  }

  function tabs() {
    var cur = current.name, active = TAB_OF[cur] || cur, inMore = MORE.some(function (m) { return m.id === active && !PRIMARY.some(function (p) { return p.id === active; }); });
    var html = PRIMARY.map(function (t) {
      var b = t.badge ? t.badge() : 0;
      return '<a href="#/' + t.id + '" class="tab' + (active === t.id ? ' is-on' : '') + '"' + (active === t.id ? ' aria-current="page"' : '') + '>' + t.label + (b ? '<i class="tab__b">' + b + '</i>' : '') + '</a>';
    }).join('');
    var mb = MORE.reduce(function (a, m) { return a + (m.badge ? m.badge() : 0); }, 0);
    html += '<button class="tab tab--more' + (inMore ? ' is-on' : '') + '" data-act="more" aria-haspopup="menu">' + (inMore ? MORE.filter(function (m) { return m.id === active; })[0].label : 'More') + (mb ? '<i class="tab__b tab__b--r">' + mb + '</i>' : '') + I('down', 14) + '</button>';
    document.getElementById('tabs').innerHTML = html;
    var nd = document.getElementById('noteDot'); if (nd) nd.hidden = !st.s.notifications.some(function (n) { return !n.read; });
    var un = st.unreadCount(); ['chatDot', 'fabDot'].forEach(function (id) { var e = document.getElementById(id); if (e) { e.hidden = !un; e.textContent = id === 'fabDot' ? un : ''; } });
  }

  /* ---------------- router ---------------- */
  var current = { name: 'overview', params: [] };
  var ROUTES = [
    [/^overview$/, 'overview'], [/^listings$/, 'listings'], [/^listings\/new$/, 'listing-new'], [/^property\/([\w-]+)$/, 'property'], [/^property\/([\w-]+)\/edit$/, 'listing-edit'], [/^property\/([\w-]+)\/(\w+)$/, 'property'],
    [/^rentals$/, 'rentals'], [/^rentals\/(\w+)$/, 'rentals'], [/^sales$/, 'sales'], [/^deals$/, 'deals'], [/^deal\/([\w-]+)$/, 'deal'],
    [/^leads$/, 'leads'], [/^contacts$/, 'contacts'], [/^contact\/([\w-]+)$/, 'contact'], [/^calendar$/, 'calendar'], [/^tasks$/, 'tasks'],
    [/^team$/, 'team'], [/^commissions$/, 'commissions'], [/^analytics$/, 'analytics'], [/^documents$/, 'documents'], [/^settings$/, 'settings'], [/^chat$/, 'chat']
  ];
  function parse() {
    var h = location.hash.replace(/^#\/?/, '').split('?')[0];
    for (var i = 0; i < ROUTES.length; i++) { var m = h.match(ROUTES[i][0]); if (m) return { name: ROUTES[i][1], params: m.slice(1) }; }
    return { name: 'overview', params: [] };
  }
  function route() { return ES.pages[current.name] || {}; }
  var lastKey = '';
  function render(keepScroll) {
    var v = document.getElementById('view'), p = route(), y = window.scrollY;
    if (!p.render) { v.innerHTML = ES.empty('alert', 'Page not found', 'That page doesn’t exist in the demo.', '<a class="btn" href="#/overview">Back to overview</a>'); return; }
    v.className = 'view view--' + current.name;
    p.render(v, current.params);
    tabs();
    if (keepScroll) window.scrollTo(0, y);
  }
  function go() {
    var next = parse(), key = next.name + '/' + next.params.join('/');
    var same = key === lastKey; lastKey = key; current = next;
    ES.closeMenu(); if (document.querySelector('.ovl') && !same) ES.close();
    document.documentElement.classList.remove('is-drawer');
    render(same);
    if (!same) { window.scrollTo(0, 0); var v = document.getElementById('view'); try { v.focus({ preventScroll: true }); } catch (e) { } }
    var t = (TAB_OF[current.name] || current.name); document.title = (t.charAt(0).toUpperCase() + t.slice(1)) + ' · Reside Ke demo';
    document.documentElement.classList.toggle('is-chatroute', current.name === 'chat');
  }
  ES.app = { go: function (h) { if (location.hash === h) go(); else location.hash = h; }, refresh: function () { render(true); }, current: function () { return current; } };

  /* ---------------- clicks ---------------- */
  function onClick(e) {
    var a = e.target.closest('[data-act]'); if (!a) return;
    var act = a.dataset.act;
    if (act === 'reset') ES.confirm({ title: 'Reset the demo?', text: 'This restores the original sample listings, deals, leads and messages. Anything you created in this browser will be removed.', ok: 'Reset demo', tone: 'red', icon: 'refresh', onOk: function () { st.reset(); ES.toast('Demo data restored'); ES.app.go('#/overview'); } });
    else if (act === 'search') openSearch();
    else if (act === 'notes') openNotes(a);
    else if (act === 'help') openHelp();
    else if (act === 'me') ES.menu(a, [{ label: st.me().name + ' — ' + st.me().role, icon: 'user', disabled: true }, '-', { label: 'Settings', icon: 'gear', go: '#/settings' }, { label: 'Team', icon: 'users', go: '#/team' }, { label: 'Reset demo data', icon: 'refresh', act: 'reset' }, '-', { label: 'Back to the Reside Ke site', icon: 'out', href: './' }], function (it) { if (it.go) ES.app.go(it.go); else if (it.href) location.href = it.href; else if (it.act) document.querySelector('[data-act=reset]').click(); });
    else if (act === 'more') ES.menu(a, MORE.map(function (m) { var b = m.badge ? m.badge() : 0; return { label: m.label + (b ? ' (' + b + ')' : ''), icon: m.icon, go: '#/' + m.id + (m.sub ? '/' + m.sub : '') }; }), function (it) { ES.app.go(it.go); });
    else if (act === 'drawer') openDrawerNav();
    else if (act === 'chatm') { if (innerWidth > 1180) { ES.ui.chat.open = !ES.ui.chat.open; document.documentElement.classList.toggle('is-chat-off', !ES.ui.chat.open); } else ES.app.go('#/chat'); }
  }

  function openDrawerNav() {
    var items = PRIMARY.concat(MORE.filter(function (m) { return !m.sub; }));
    var p = ES.open('drawer', '<div class="dnav"><div class="dnav__h"><span class="brand"><span class="brand__m">' + I('logo', 18) + '</span><span class="brand__w">RESIDE<em>KE</em></span></span><button class="ib" data-close aria-label="Close">' + I('x', 18) + '</button></div>' +
      items.map(function (t) { var on = (TAB_OF[current.name] || current.name) === t.id, b = t.badge ? t.badge() : 0; return '<a href="#/' + t.id + '" class="dnav__a' + (on ? ' is-on' : '') + '">' + I(t.icon, 18) + '<span>' + t.label + '</span>' + (b ? '<i>' + b + '</i>' : '') + '</a>'; }).join('') +
      '<a href="#/chat" class="dnav__a">' + I('chat', 18) + '<span>Team chat</span>' + (st.unreadCount() ? '<i>' + st.unreadCount() + '</i>' : '') + '</a></div>', { label: 'Navigation', cls: 'ovl--left' });
    p.addEventListener('click', function (e) { if (e.target.closest('a')) ES.close(); });
  }

  /* ---------------- search ---------------- */
  function openSearch() {
    var p = ES.open('modal', '<div class="srch"><div class="srch__in">' + I('search', 18) + '<input type="search" placeholder="Search listings, contacts, leads, deals…" aria-label="Search" autofocus><kbd>Esc</kbd></div><div class="srch__res" id="srchRes"></div></div>', { label: 'Search', cls: 'ovl--top' });
    var input = p.querySelector('input'), res = p.querySelector('#srchRes'), sel = 0, items = [];
    function run() {
      var q = input.value.trim().toLowerCase(); items = [];
      function m(s) { return s && String(s).toLowerCase().indexOf(q) > -1; }
      if (!q) {
        items = st.listings().slice(0, 4).map(function (x) { return { g: 'Recent listings', h: '#/property/' + x.id, t: x.title, s: x.area + ' · ' + f.money(x.price, true), img: x.images[0] }; });
      } else {
        st.listings().forEach(function (x) { if (m(x.title) || m(x.ref) || m(x.area) || m(x.address) || m(x.type)) items.push({ g: 'Listings', h: '#/property/' + x.id, t: x.title, s: x.ref + ' · ' + x.area + ' · ' + f.money(x.price, true), img: x.images[0] }); });
        st.s.contacts.forEach(function (c) { if (m(c.name) || m(c.phone) || m(c.email) || m(c.company)) items.push({ g: 'Contacts', h: '#/contact/' + c.id, t: c.name, s: c.types.join(', ') + ' · ' + c.phone, c: c }); });
        st.s.leads.forEach(function (l) { if (m(l.name) || m(l.phone) || m(l.email)) items.push({ g: 'Leads', h: '#/leads?lead=' + l.id, lead: l.id, t: l.name, s: l.status + ' · ' + l.source }); });
        st.s.deals.forEach(function (d) { var p2 = st.prop(d.propertyId), b = st.contact(d.buyerId); if (m(d.ref) || m(p2.title) || (b && m(b.name))) items.push({ g: 'Deals', h: '#/deal/' + d.id, t: d.ref + ' — ' + p2.title, s: st.stage(d.stage).short + ' · ' + f.money(d.value, true) }); });
        st.s.docs.forEach(function (d) { if (m(d.name)) items.push({ g: 'Documents', h: '#/documents', t: d.name, s: ES.DOC_KINDS[d.kind] }); });
        items = items.slice(0, 14);
      }
      sel = 0;
      var g = '';
      res.innerHTML = items.length ? items.map(function (it, i) {
        var head = it.g !== g ? '<div class="srch__g">' + it.g + '</div>' : ''; g = it.g;
        return head + '<a href="' + it.h + '" class="srch__i' + (i === 0 ? ' is-sel' : '') + '" data-i="' + i + '">' + (it.img ? '<img src="' + it.img + '" alt="">' : it.c ? ES.cav(it.c, 32) : '<span class="srch__ic">' + I(it.g === 'Deals' ? 'board' : it.g === 'Leads' ? 'user' : 'file', 16) + '</span>') + '<span><b>' + esc(it.t) + '</b><em>' + esc(it.s) + '</em></span>' + I('right', 14) + '</a>';
      }).join('') : ES.empty('search', 'No matches', 'Try a name, area, phone number or reference like EST-1041.');
    }
    function pick(i) { var it = items[i]; if (!it) return; ES.close(); if (it.lead) { ES.app.go('#/leads'); setTimeout(function () { ES.pages.leads.open(it.lead); }, 60); } else ES.app.go(it.h); }
    input.addEventListener('input', run);
    input.addEventListener('keydown', function (e) {
      var els = res.querySelectorAll('.srch__i');
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, Math.min(els.length - 1, sel + (e.key === 'ArrowDown' ? 1 : -1))); els.forEach(function (x, i) { x.classList.toggle('is-sel', i === sel); }); if (els[sel]) els[sel].scrollIntoView({ block: 'nearest' }); }
      if (e.key === 'Enter') { e.preventDefault(); pick(sel); }
    });
    res.addEventListener('click', function (e) { var a = e.target.closest('.srch__i'); if (a) { e.preventDefault(); pick(+a.dataset.i); } });
    run();
  }

  /* ---------------- notifications ---------------- */
  function openNotes(anchor) {
    var N = st.s.notifications, ic = { lead: 'user', overdue: 'clock', offer: 'tag', lease: 'key', rent: 'wallet' };
    var p = ES.open('drawer', ES.head('Notifications', N.filter(function (n) { return !n.read; }).length + ' unread') +
      '<div class="ovl__body"><div class="nt-acts"><button class="btn btn--sm" data-all>' + I('check', 14) + 'Mark all as read</button></div>' +
      (N.length ? N.map(function (n) { return '<button class="nt' + (n.read ? '' : ' is-new') + '" data-id="' + n.id + '"><span class="nt__ic">' + I(ic[n.kind] || 'bell', 16) + '</span><span class="nt__b"><b>' + esc(n.text) + '</b><em>' + f.ago(n.at) + '</em></span>' + (n.read ? '' : '<i class="nt__dot"></i>') + '</button>'; }).join('') : ES.empty('bell', 'You’re all caught up', 'New leads, offers and lease reminders will show here.')) + '</div>', { label: 'Notifications' });
    p.addEventListener('click', function (e) {
      if (e.target.closest('[data-all]')) { st.readAll(); ES.close(); ES.toast('All notifications marked as read'); return; }
      var b = e.target.closest('.nt'); if (!b) return;
      var n = N.filter(function (x) { return x.id === b.dataset.id; })[0]; st.readNote(n.id); ES.close();
      var r = n.ref || {}; if (r.type === 'lead') { ES.app.go('#/leads'); setTimeout(function () { ES.pages.leads.open(r.id); }, 60); } else if (r.type === 'deal') ES.app.go('#/deal/' + r.id); else if (r.type === 'property') ES.app.go('#/property/' + r.id); else if (r.type === 'rentals') ES.app.go('#/rentals/payments');
    });
  }
  function openHelp() {
    ES.open('modal', ES.head('Getting around Reside Ke') + '<div class="ovl__body help"><p>This is a working demo filled with sample data for a fictional Nairobi agency. Try these:</p><ul>' +
      ['Open <a href="#/property/p1041">Karura Ridge House</a> and drag the price sliders — the gauge and market insight update live.', 'Drag a card on the <a href="#/deals">Deals board</a> to a new stage. Closing a deal records its commission.', 'Add a lead on <a href="#/leads">Leads</a>, schedule a follow-up, then convert it to a contact and deal.', 'Send a message in the team chat. Replies are simulated in this demo.', 'Press <kbd>Ctrl</kbd> + <kbd>K</kbd> (or <kbd>/</kbd>) to search everything.'].map(function (t) { return '<li>' + t + '</li>'; }).join('') +
      '</ul><p class="muted">Everything you change is stored only in this browser. Use <b>Reset demo</b> in the top bar to start over.</p></div>', { label: 'Help' }).addEventListener('click', function (e) { if (e.target.closest('a')) ES.close(); });
  }

  /* ---------------- chat panel ---------------- */
  var REPLIES = {
    u2: ['On it — I’ll send the upstairs shots in a few minutes.', 'Perfect, I’ll let the buyer know. 👍', 'Booked. I’ll confirm with the owner tonight.'],
    u3: ['Got it, I’ll update the deal and loop in Okoth.', 'Will do. Completion still looks on track.'],
    u4: ['Noted — I’ll call the Trust’s lawyer this afternoon.', 'Sounds good. Deposit is already confirmed.'],
    u5: ['Done, viewing is on the calendar.', 'I’ll get the lease draft over to Nadia today.'],
    u7: ['Uploading the rest now.', 'I’ll swap the cover photo to the twilight shot.']
  };
  function chatHTML(mobile) {
    var c = ES.ui.chat, convs = st.s.convs, conv = convs.filter(function (x) { return x.id === c.conv; })[0] || convs[0];
    var other = st.user(conv.userId), online = st.s.team.filter(function (u) { return u.online; }).length;
    var msgs = st.s.msgs.filter(function (m) { return m.convId === conv.id; }).sort(function (a, b) { return new Date(a.at) - new Date(b.at); });
    var pinned = msgs.filter(function (m) { return m.propertyId; })[0], pp = pinned ? st.prop(pinned.propertyId) : null;
    var html = '<div class="chat__h">' + (mobile ? '<a href="#/overview" class="ib" aria-label="Back">' + I('left', 18) + '</a>' : '<button class="ib" data-chat="toggle" aria-label="Collapse chat">' + I('collapse', 16) + '</button>') + '<b>Live Chat</b><span class="chat__on"><i></i>' + online + ' online</span></div>' +
      '<div class="chat__people" role="tablist" aria-label="Conversations">' + convs.map(function (cv) { var u = st.user(cv.userId); return '<button role="tab" aria-selected="' + (cv.id === conv.id) + '" class="chat__p' + (cv.id === conv.id ? ' is-on' : '') + '" data-chat="conv" data-id="' + cv.id + '">' + ES.av(u, 38, u.online ? 'is-online' : '') + (cv.unread ? '<i class="chat__u">' + cv.unread + '</i>' : '') + '<span>' + esc(u.name.split(' ')[0]) + '</span></button>'; }).join('') + '</div>' +
      (pp ? '<a class="chat__pin" href="#/property/' + pp.id + '"><img src="' + pp.images[0] + '" alt=""><span><b>' + esc(pp.title) + '</b><em>' + esc(pp.area) + ' · ' + f.money(pp.price, true) + '</em></span>' + I('right', 14) + '</a>' : '') +
      '<div class="chat__log" id="chatLog" aria-live="polite">';
    var lastDay = '';
    msgs.forEach(function (m) {
      var day = f.day(m.at); if (day !== lastDay) { html += '<div class="chat__day"><span>' + day + '</span></div>'; lastDay = day; }
      var mine = m.from === ES.config.userId, u = st.user(m.from);
      html += '<div class="msg' + (mine ? ' is-me' : '') + (Date.now() - new Date(m.at) < 4000 ? ' is-new' : '') + '">' + (mine ? '<div class="msg__meta"><em>' + f.time(m.at) + '</em><b>' + esc(u.name.split(' ')[0]) + '</b>' + ES.av(u, 22) + '</div>' : '<div class="msg__meta">' + ES.av(u, 22) + '<b>' + esc(u.name) + '</b><em>' + f.time(m.at) + '</em></div>');
      if (m.voice) html += '<div class="bub bub--voice"><span class="vplay">' + I('play', 12) + '</span><span class="wave">' + Array.apply(null, Array(26)).map(function (_, i) { return '<i style="height:' + (4 + Math.abs(Math.sin(i * 1.7 + m.voice)) * 14).toFixed(0) + 'px"></i>'; }).join('') + '</span><em>' + Math.floor(m.voice / 60) + ':' + ('0' + m.voice % 60).slice(-2) + '</em></div>';
      if (m.photos) html += '<div class="bub bub--photos"><div class="phg"><img src="' + m.photos[0] + '" alt=""><span class="phg__s"><img src="' + m.photos[1] + '" alt=""><b>+' + (m.count - 2) + '</b></span></div><em>' + m.count + ' photos · ' + m.size + '</em></div>' + (m.reactions ? '<div class="rx">' + Object.keys(m.reactions).map(function (k) { return '<span>' + k + ' ' + m.reactions[k] + '</span>'; }).join('') + '</div>' : '');
      if (m.text) html += '<div class="bub">' + esc(m.text) + '</div>';
      html += '</div>';
    });
    if (c.typing === conv.id) html += '<div class="msg"><div class="msg__meta">' + ES.av(other, 22) + '<b>' + esc(other.name) + '</b></div><div class="bub bub--typing"><i></i><i></i><i></i></div></div>';
    html += '</div><form class="chat__f" data-chat="form"><input name="m" placeholder="Enter your message" aria-label="Message ' + esc(other.name) + '" autocomplete="off" value="' + esc(c.drafts[conv.id] || '') + '"><button type="button" class="ib" data-chat="attach" aria-label="Attach listing photos">' + I('clip', 17) + '</button><button class="btn btn--p btn--sm" aria-label="Send">' + I('send', 14) + 'Send</button></form>' +
      '<p class="chat__note">' + I('info', 12) + 'Demo chat — messages stay in this browser; replies are simulated.</p>';
    return html;
  }
  function renderChat() {
    var el = document.getElementById('chat');
    var cv = st.s.convs.filter(function (x) { return x.id === ES.ui.chat.conv; })[0];
    if (cv && cv.unread && innerWidth > 1180 && ES.ui.chat.open) { cv.unread = 0; }
    el.innerHTML = chatHTML(false);
    var log = el.querySelector('#chatLog'); log.scrollTop = log.scrollHeight;
  }
  ES.chatHTML = chatHTML;
  function chatEvents(root) {
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-chat]'); if (!b) return;
      var k = b.dataset.chat;
      if (k === 'conv') { ES.ui.chat.conv = b.dataset.id; st.markRead(b.dataset.id); refreshChat(); setTimeout(function () { var i = document.querySelector('.chat__f input'); if (i) i.focus(); }, 0); }
      if (k === 'toggle') { ES.ui.chat.open = false; document.documentElement.classList.add('is-chat-off'); }
      if (k === 'attach') {
        var p = st.prop('p1041');
        st.sendMessage(ES.ui.chat.conv, '', { photos: p.images.slice(2, 4).concat(p.images.slice(0, 1)), count: 4, size: '1.6 MB', propertyId: p.id }); afterSend();
      }
    });
    root.addEventListener('submit', function (e) {
      var form = e.target.closest('[data-chat=form]'); if (!form) return; e.preventDefault();
      var v = form.m.value; if (!v.trim()) return;
      ES.ui.chat.drafts[ES.ui.chat.conv] = '';
      st.sendMessage(ES.ui.chat.conv, v); afterSend();
    });
    root.addEventListener('input', function (e) { if (e.target.name === 'm') ES.ui.chat.drafts[ES.ui.chat.conv] = e.target.value; });
  }
  function afterSend() {
    var convId = ES.ui.chat.conv, cv = st.s.convs.filter(function (x) { return x.id === convId; })[0], uid = cv.userId;
    setTimeout(function () { ES.ui.chat.typing = convId; refreshChat(); }, 700);
    setTimeout(function () {
      ES.ui.chat.typing = null;
      var pool = REPLIES[uid] || ['👍'], n = st.s.msgs.filter(function (m) { return m.convId === convId && m.simulated; }).length;
      st.receiveMessage(convId, uid, pool[n % pool.length]);
      if (ES.ui.chat.conv !== convId || (innerWidth <= 1180 && current.name !== 'chat')) cv.unread = (cv.unread || 0) + 1;
      refreshChat(); tabs();
    }, 2300);
    refreshChat();
    setTimeout(function () { var i = document.querySelector('.chat__f input'); if (i) i.focus(); }, 0);
  }
  function refreshMobileChat() { var v = document.querySelector('.mchat'); if (v) { v.innerHTML = chatHTML(true); var l = v.querySelector('#chatLog'); l.scrollTop = l.scrollHeight; } }
  function refreshChat() {
    if (current.name === 'chat') { var v = document.querySelector('.mchat'); if (v) { v.innerHTML = chatHTML(true); var l = v.querySelector('#chatLog'); l.scrollTop = l.scrollHeight; } }
    renderChat();
  }
  ES.pages.chat = {
    render: function (v) {
      st.markRead(ES.ui.chat.conv);
      v.innerHTML = '<div class="mchat">' + chatHTML(true) + '</div>';
      var l = v.querySelector('#chatLog'); l.scrollTop = l.scrollHeight;
    }
  };

  /* ---------------- boot ---------------- */
  function debounce(fn, ms) { var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }
  ES.boot = function () {
    st.init(); shell();
    chatEvents(document.getElementById('chat')); chatEvents(document.getElementById('view'));
    if (innerWidth <= 1180) ES.ui.chat.open = false;
    var pend = {}, flush = debounce(function () { var k = pend; pend = {}; if (k.data && !route().static) render(true); else tabs(); if (k.chat || k.data) { if (current.name === 'chat' && k.chat) refreshMobileChat(); renderChat(); } }, 30);
    st.subscribe(function (kind) { pend[kind || 'data'] = 1; flush(); });
    window.addEventListener('hashchange', go);
    if (!location.hash) history.replaceState(null, '', '#/overview');
    go(); renderChat();
  };
  document.addEventListener('DOMContentLoaded', function () { ES.boot(); });
})();
