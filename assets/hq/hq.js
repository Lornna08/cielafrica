/* ============================================================
   CIEL HQ — the   (/admin)
   Overview · Orders (photo books, shop, domains) · Calendar · Tasks ·
   Customers · Website. Sign-in is checked on the server.
   ============================================================ */
(function () {
  'use strict';
  var root = document.getElementById('hq');
  var CFG = (window.CIEL && CIEL.photobooks) || {};
  var S = { view: 'overview', orders: [], inbox: [], sources: {}, tasks: [], events: [], notes: [], projects: [], loaded: false, pulse: null, filt: { kind: 'all', q: '', st: 'open' }, cal: null };

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function money(n) { return n == null ? '—' : 'KES ' + Math.round(n).toLocaleString('en-KE'); }
  function d2(t) { return t ? new Date(t).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }) : ''; }
  function dt(t) { return t ? new Date(t).toLocaleString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''; }
  function iso(d) { var z = function (n) { return String(n).padStart(2, '0'); }; return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()); }
  function today() { return iso(new Date()); }
  var inflight = 0;
  function prog(d) { var p = document.getElementById('prog'); if (!p) return; inflight = Math.max(0, inflight + d); if (inflight) { p.className = 'hq-prog'; void p.offsetWidth; p.className = 'hq-prog is-on'; } else { p.className = 'hq-prog is-done'; } }
  function api(url, body) {
    var get = body === undefined, quiet = /route=(pulse|mail-unread)\b/.test(url);
    if (!quiet) { prog(1); return api0(url, body, get).then(function (r) { prog(-1); return r; }, function (e) { prog(-1); throw e; }); }
    return api0(url, body, get);
  }
  function api0(url, body, get) {
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
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z"/><path d="M9 9.5c.3 2 2.5 4.3 4.6 4.6l1.2-1.1 1.7.8"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/></svg>'
  };
  var NAV = [['overview', 'Overview', I.home, 'Main'], ['orders', 'Orders', I.orders, 'Commerce'], ['payments', 'Payments', I.book], ['products', 'Products', I.pen], ['templates', 'Website templates', I.web], ['inbox', 'Inbox', I.mail, 'Customers & sales'], ['leads', 'Leads', I.orders], ['customers', 'Customers', I.people], ['projects', 'Projects', I.tasks], ['website', 'Website editor', I.web, 'Website'], ['content', 'Content library', I.pen], ['calendar', 'Calendar', I.cal, 'Operations'], ['tasks', 'Tasks', I.tasks], ['activity', 'Activity log', I.book, 'System'], ['settings', 'Setup', I.gear]];

  /* ---------- order sources, normalised ---------- */
  var KIND = { photobook: ['Photo book', '#ff5a1f'], shop: ['Shop', '#1f4fb5'], domain: ['Domain', '#5b3fd1'], whatsapp: ['WhatsApp', '#1fa855'] };
  var WA_SET = ['pending', 'contacted', 'confirmed', 'paid', 'done', 'cancelled'];
  var WA_LABEL = { pending: 'Pending', contacted: 'Contacted', confirmed: 'Confirmed', paid: 'Paid', done: 'Delivered', cancelled: 'Cancelled', new: 'New' };
  var PB_LABEL = { awaiting_payment: 'Awaiting payment', payment_failed: 'Payment failed', paid: 'Waiting for pages', preparing: 'Waiting for pages', ready: 'Pages received', printing: 'Printing', ready_collection: 'Ready to collect', dispatched: 'Dispatched', delivered: 'Delivered', cancelled: 'Cancelled', refunded: 'Refunded' };
  var PB_SET = ['paid', 'ready', 'printing', 'ready_collection', 'dispatched', 'delivered', 'cancelled', 'refunded'];
  var SHOP_SET = ['paid', 'processing', 'fulfilled', 'delivered', 'cancelled', 'refunded'];
  var CLOSED = /^(delivered|cancelled|refunded|payment_failed|registered|unavailable|failed|fulfilled|done)$/;
  function tone(st) { return /deliver|registered|fulfilled/.test(st) ? 'g' : /print|ready|processing|progress|dispatch/.test(st) ? 'b' : /await|pending|paid|prepar|checking/.test(st) ? 'y' : /fail|cancel|refund|unavail/.test(st) ? 'r' : ''; }
  function fromPB(o) { return { kind: 'photobook', ref: o.ref, at: o.createdAt, paid: !!o.paidAt, test: !!o.test, customer: o.customer || {}, total: o.total, status: o.status, label: PB_LABEL[o.status] || o.status, summary: (o.items || []).map(function (i) { return i.name + ' · ' + (i.product === 'print' ? 'Print ×' + i.qty : 'PDF') + ' · ' + i.pages + 'p'; }).join(', '), raw: o }; }
  function fromShop(o) { return { kind: 'shop', ref: o.ref || o.id, at: o.createdAt, paid: !/^(awaiting_payment|payment_failed)$/.test(o.status), customer: o.customer || {}, total: o.total, status: o.status, label: ({ awaiting_payment: 'Awaiting payment', payment_failed: 'Payment failed' })[o.status] || o.status.charAt(0).toUpperCase() + o.status.slice(1), summary: o.order || '', raw: o }; }
  function fromDomain(o, labels) { var c = o.customer || {}; return { kind: 'domain', ref: o.ref, at: o.createdAt, paid: /registered|pending_registration|registration_in_progress|refund/.test(o.status), customer: { name: c.name || o.name, email: c.email || o.email, phone: c.phone || o.phone }, total: o.amount, status: o.status, label: (labels && labels[o.status]) || o.status, summary: o.domain + ' · ' + o.years + ' yr', raw: o }; }
  function fromWA(o) { return { kind: 'whatsapp', ref: o.ref, id: o.id, at: o.createdAt, paid: /^(paid|done)$/.test(o.status), customer: o.customer || {}, total: o.total, status: o.status, label: WA_LABEL[o.status] || o.status, summary: (o.text || o.page || '').replace(/\s+/g, ' ').slice(0, 140), raw: o }; }
  function loadInbox() {
    return api('/api/hq?route=inbox').then(function (r) { S.inbox = r.items || []; S.sources.inbox = r.storage ? 'ok' : 'Blob storage not connected'; }, function (e) { S.inbox = []; S.sources.inbox = e.message; });
  }
  function loadOrders() {
    S.sources = {};
    return Promise.all([
      api('/api/photobooks?route=pbk-admin-orders').then(function (r) { S.sources.photobook = r.storage ? 'ok' : 'Blob storage not connected'; return (r.orders || []).map(fromPB); }, function (e) { S.sources.photobook = e.message; return []; }),
      api('/api/hq?route=shop-orders').then(function (r) { S.sources.shop = r.storage ? 'ok' : 'Blob storage not connected'; return (r.orders || []).map(fromShop); }, function (e) { S.sources.shop = e.message; return []; }),
      api('/api/domains/admin/orders?filter=all').then(function (r) { S.sources.domain = 'ok'; return (r.orders || []).map(function (o) { return fromDomain(o, r.labels); }); }, function (e) { S.sources.domain = e.code === 'store' ? 'Domains database not connected' : e.message; return []; })
    ]).then(function (r) { S.base = r[0].concat(r[1], r[2]); mergeOrders(); });
  }
  function mergeOrders() {
    S.orders = (S.base || []).concat(S.inbox.filter(function (x) { return x.kind === 'whatsapp'; }).map(fromWA)).sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
  }
  function loadLists() {
    return Promise.all(['tasks', 'events', 'notes', 'projects'].map(function (c) { return api('/api/hq?route=list&c=' + c).then(function (r) { S[c] = r.items || []; }, function (e) { S[c] = []; S.listErr = e.message; }); }));
  }
  function saveItem(c, item) { return api('/api/hq?route=save', { c: c, item: item }).then(function (r) { var l = S[c], i = l.findIndex(function (x) { return x.id === r.item.id; }); if (i >= 0) l[i] = r.item; else l.push(r.item); return r.item; }); }
  function delItem(c, id) { return api('/api/hq?route=save', { c: c, op: 'delete', id: id }).then(function () { S[c] = S[c].filter(function (x) { return x.id !== id; }); }); }

  /* ---------- start ---------- */
  function start() {
    api('/api/hq?route=me').then(function (m) { S.setup = m.setup; if (!m.signedIn) return login(m.setup); boot(); }, function () { login({}); });
  }
  function login(setup) {
    root.className = '';
    root.innerHTML = '<div class="hq-login"><div class="hq-login__art"><img src="/assets/img/logo-dark.png?v=20261021i" alt="Ciel Africa"><div><h1>Run all of Ciel Africa from one place.</h1><p>Orders from the shop, Photo Books and Ciel Domains, your calendar, tasks and customers.</p><ul><li>Orders</li><li>Calendar</li><li>Tasks</li><li>Customers</li><li>Website</li></ul></div><small style="color:#8a8076">Ciel Admin</small></div>' +
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
    root.innerHTML = '<aside class="hq-side"><div class="hq-side__brand"><img src="/assets/img/logo-dark.png?v=20261021i" alt="Ciel Africa"><span class="hq-side__tag">Admin</span></div><nav class="hq-nav" id="nav"></nav><div class="hq-side__foot"><a href="/" target="_blank" rel="noopener">cielafrica.com ↗</a><button id="lo">Sign out</button></div></aside>' +
      '<div class="hq-main"><header class="hq-top"><button class="hq-burger" id="burger" aria-label="Open menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg><span>Menu</span></button><h1 id="ttl"></h1><span class="hq-live" id="lv" title="Live">Live</span><button class="b b--sm" id="inst" hidden>Install app</button><button class="b b--sm" id="thm" title="Light or dark"></button><button class="b b--sm" id="nb" title="Phone notifications">' + I.bell + '</button><button class="b b--sm" id="rf" title="Refresh">' + I.ref + '<span>Refresh</span></button><div id="topx"></div></header><main class="hq-body" id="body"><p class="muted">Loading…</p></main></div><nav class="hq-mnav" id="mnav"></nav>';
    document.getElementById('lo').onclick = function () { api('/api/hq?route=logout', {}).then(function () { try { localStorage.removeItem('pbk_admin'); } catch (e) { } login(S.setup || {}); }); };
    document.getElementById('rf').onclick = function () { refresh(true); };
    /* phone & tablet: the sidebar slides in from the left */
    var side = root.querySelector('.hq-side'), scrim = document.createElement('div'); scrim.className = 'hq-scrim'; root.appendChild(scrim);
    var setNav = function (on) { root.classList.toggle('nav-open', on); document.body.style.overflow = on ? 'hidden' : ''; };
    document.getElementById('burger').onclick = function () { setNav(true); };
    scrim.onclick = function () { setNav(false); };
    side.addEventListener('click', function (e) { if (e.target.closest('a[href^="#"]')) setNav(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setNav(false); });
    /* swipe in from the left edge to open, swipe left to close */
    var sx = null, sy = 0;
    document.addEventListener('touchstart', function (e) { var t = e.touches[0]; sx = (t.clientX < 24 || root.classList.contains('nav-open')) ? t.clientX : null; sy = t.clientY; }, { passive: true });
    document.addEventListener('touchend', function (e) { if (sx == null) return; var t = e.changedTouches[0], dx = t.clientX - sx; if (Math.abs(t.clientY - sy) < 60) { if (dx > 50) setNav(true); else if (dx < -50) setNav(false); } sx = null; }, { passive: true });
    var th = document.getElementById('thm'), dark = function () { return document.documentElement.getAttribute('data-theme') === 'dark'; };
    var paintTh = function () { th.innerHTML = dark() ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>' : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>'; th.title = dark() ? 'Switch to light' : 'Switch to dark'; };
    paintTh(); th.onclick = function () { var d = !dark(); if (d) document.documentElement.setAttribute('data-theme', 'dark'); else document.documentElement.removeAttribute('data-theme'); try { localStorage.setItem('ca_theme', d ? 'dark' : 'light'); } catch (e) { } paintTh(); var m = document.querySelector('meta[name=theme-color]'); if (m) m.content = d ? '#0c0c0e' : '#ffffff'; };
    document.getElementById('inst').onclick = install; if (installEv) document.getElementById('inst').hidden = false;
    var nb = document.getElementById('nb');
    pushState().then(function (st) { nb.classList.toggle('is-on', st === 'on'); });
    nb.onclick = function () { pushState().then(function (st) { return st === 'on' ? (confirm('Turn off notifications on this device?') ? disablePush() : null) : enablePush(); }).then(function () { return pushState(); }).then(function (st) { nb.classList.toggle('is-on', st === 'on'); }); };
    window.addEventListener('hashchange', route);
    refresh(false);
    live();
  }
  function refresh(note, quiet) {
    return Promise.all([loadOrders(), loadInbox(), loadLists()]).then(function () {
      mergeOrders(); S.loaded = true;
      if (quiet && (document.querySelector('.drawer,.modal') || /^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName || ''))) navs(); else route(true);
      if (note) toast('Up to date');
      document.getElementById('lv').title = 'Live · updated ' + new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
    });
  }

  /* ---------- live: check for news every 30 s while open, and when a notification arrives ---------- */
  function live() {
    function tick() {
      if (document.hidden) return;
      api('/api/hq?route=pulse').then(function (p) {
        var lv = document.getElementById('lv'); if (lv) lv.classList.remove('is-off');
        if (S.pulse === null) { S.pulse = p.v; return; }
        if (p.v !== S.pulse) {
          var fresh = (p.items || []).slice(0, Math.min(5, p.v - S.pulse));
          S.pulse = p.v;
          refresh(false, true).then(function () { if (fresh[0]) { toast(fresh[0].title + (fresh[0].body ? ' · ' + fresh[0].body : '')); ping(); } });
          if (document.hasFocus && !document.hasFocus() && 'Notification' in window && Notification.permission === 'granted' && !S.pushOn) fresh.forEach(function (x) { try { new Notification(x.title, { body: x.body, icon: '/assets/img/icon-192.png' }); } catch (e) { } });
        }
      }, function (e) { var lv = document.getElementById('lv'); if (lv) lv.classList.add('is-off'); if (e.status === 401) login(S.setup || {}); });
    }
    tick(); setInterval(tick, 30000);
    var mailOn = S.setup && S.setup.mail && S.setup.mail.some(function (a) { return a.configured; });
    if (mailOn && window.HQMail) { var mp = function () { if (!document.hidden) HQMail.poll(function () { navs(); }); }; mp(); setInterval(mp, 120000); }
    document.addEventListener('visibilitychange', function () { if (!document.hidden) tick(); });
    if (navigator.serviceWorker) navigator.serviceWorker.addEventListener('message', function (e) { if (e.data && e.data.type === 'hq-push') tick(); });
  }
  function ping() { try { var a = new (window.AudioContext || window.webkitAudioContext)(), o = a.createOscillator(), g = a.createGain(); o.frequency.value = 880; g.gain.setValueAtTime(0.08, a.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.35); o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + 0.36); } catch (e) { } }

  /* ---------- app install + phone notifications ---------- */
  var installEv = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); installEv = e; var b = document.getElementById('inst'); if (b) b.hidden = false; });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/hq-sw.js', { scope: '/admin' }).catch(function () { });
  function standalone() { return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone; }
  function isIOS() { return /iphone|ipad|ipod/i.test(navigator.userAgent); }
  function b64u(s) { var p = '='.repeat((4 - s.length % 4) % 4), b = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')), a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }
  function pushState() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return Promise.resolve(isIOS() && !standalone() ? 'ios' : 'none');
    if (Notification.permission === 'denied') return Promise.resolve('denied');
    return navigator.serviceWorker.ready.then(function (r) { return r.pushManager.getSubscription(); }).then(function (sub) { S.pushOn = !!sub; return sub ? 'on' : 'off'; });
  }
  function enablePush() {
    if (isIOS() && !standalone()) { toast('On iPhone: tap Share → Add to Home Screen, open Ciel Admin from there, then turn notifications on.'); return Promise.resolve(); }
    if (!('PushManager' in window)) { toast('This browser can’t receive notifications.'); return Promise.resolve(); }
    return Notification.requestPermission().then(function (perm) {
      if (perm !== 'granted') throw new Error('Notifications are blocked. Allow them in the browser settings for cielafrica.com.');
      return Promise.all([api('/api/hq?route=push-key'), navigator.serviceWorker.ready]);
    }).then(function (x) {
      return x[1].pushManager.getSubscription().then(function (old) { return old || x[1].pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64u(x[0].key) }); });
    }).then(function (sub) {
      return api('/api/hq?route=push-sub', { sub: sub.toJSON(), label: (isIOS() ? 'iPhone' : /android/i.test(navigator.userAgent) ? 'Android' : 'Computer') + ' · ' + new Date().toLocaleDateString('en-KE') });
    }).then(function () { S.pushOn = true; return api('/api/hq?route=push-test', {}); }).then(function () { toast('Notifications are on. A test one is on its way.'); }, function (e) { toast(e.message); });
  }
  function disablePush() {
    return navigator.serviceWorker.ready.then(function (r) { return r.pushManager.getSubscription(); }).then(function (sub) { if (!sub) return; return api('/api/hq?route=push-sub', { op: 'remove', endpoint: sub.endpoint }).then(function () { return sub.unsubscribe(); }); }).then(function () { S.pushOn = false; toast('Notifications off on this device'); });
  }
  function install() {
    if (installEv) { installEv.prompt(); installEv.userChoice.then(function () { installEv = null; var b = document.getElementById('inst'); if (b) b.hidden = true; }); return; }
    toast(isIOS() ? 'On iPhone: tap Share → Add to Home Screen.' : 'Use your browser menu → Install app (or Add to Home screen).');
  }

  /* ---------- in-app windows (no new tabs: everything stays inside Ciel Admin) ---------- */
  function frame(title, url) {
    var d = document.createElement('div'); d.className = 'hq-frame';
    d.innerHTML = '<div class="hq-frame__h"><button class="b b--sm" data-x>' + I.l + '<span>Back</span></button><b>' + esc(title) + '</b><button class="b b--sm b--ghost" data-rl title="Reload">' + I.ref + '</button></div><iframe src="' + esc(url) + '" title="' + esc(title) + '"></iframe>';
    document.body.appendChild(d);
    d.querySelector('[data-x]').onclick = function () { d.remove(); refresh(false, true); };
    d.querySelector('[data-rl]').onclick = function () { var f = d.querySelector('iframe'); f.src = f.src; };
    return d;
  }
  function route(keep) {
    var sy = window.scrollY;
    var h = (location.hash || '#overview').slice(1).split('/'), v = h[0];
    if (!NAV.some(function (n) { return n[0] === v; })) v = 'overview';
    document.querySelectorAll('.drawer,.modal').forEach(function (x) { x.remove(); });
    S.view = v; navs();
    var titles = { overview: 'Good ' + (new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening') + ', Lorna', orders: 'Orders', calendar: 'Calendar', tasks: 'Tasks', customers: 'Customers', website: 'Website', settings: 'Setup', inbox: 'Inbox', content: 'Content library', activity: 'Activity log', payments: 'Payments', products: 'Products', templates: 'Website templates', leads: 'Leads', projects: 'Projects' };
    document.getElementById('ttl').innerHTML = esc(titles[v]) + '<small>' + new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + '</small>';
    document.getElementById('topx').innerHTML = v === 'calendar' ? '<button class="b b--p b--sm" data-newev>' + I.plus + '<span>Event</span></button>' : v === 'tasks' ? '<button class="b b--p b--sm" data-newtk>' + I.plus + '<span>Task</span></button>' : '';
    var tb = document.querySelector('[data-newev]'); if (tb) tb.onclick = function () { eventModal({ date: today() }); };
    var tt = document.querySelector('[data-newtk]'); if (tt) tt.onclick = function () { taskModal({ status: 'todo' }); };
    if (v === 'website') { if (window.HQSite) HQSite.render(h[1] || 'home'); }
    else if (v === 'products' || v === 'templates') { if (window.HQSite) HQSite.renderCatalog(v); }
    else if (v === 'leads' && window.HQCrm) HQCrm.leads();
    else if (v === 'projects' && window.HQCrm) HQCrm.projects(h[1]);
    else if (v === 'customers' && window.HQCrm) HQCrm.customers();
    else ({ overview: overview, orders: orders, inbox: inbox, calendar: calendar, tasks: tasks, customers: customers, content: content, activity: activity, payments: payments, settings: settings })[v]();
    if (v === 'orders' && h[1]) { var o = S.orders.filter(function (x) { return x.ref === h[1]; })[0]; if (o) orderDrawer(o); }
    if (v === 'inbox' && h[1]) { S.itab = 'web'; inbox(); var m = S.inbox.filter(function (x) { return x.id === h[1]; })[0]; if (m) msgDrawer(m); }
    window.scrollTo(0, keep === true ? sy : 0);
  }
  function counts() {
    return { leads: S.inbox.filter(function (m) { return m.kind !== 'whatsapp' && (m.stage || (m.status === 'new' ? 'new' : '')) === 'new'; }).length, inbox: S.inbox.filter(function (m) { return m.kind !== 'whatsapp' && m.status === 'new'; }).length + (window.HQMail ? HQMail.unseen() : 0), orders: S.orders.filter(function (o) { return (o.paid || o.kind === 'whatsapp') && !CLOSED.test(o.status); }).length, tasks: S.tasks.filter(function (t) { return t.status !== 'done'; }).length, calendar: S.events.filter(function (e) { return e.date === today(); }).length };
  }
  function navs() {
    var c = counts();
    document.getElementById('nav').innerHTML = NAV.map(function (n, i) { return (n[3] ? '<div class="hq-nav__h">' + n[3] + '</div>' : '') + '<a href="#' + n[0] + '" class="' + (S.view === n[0] ? 'is-on' : '') + '">' + n[2] + '<span>' + n[1] + '</span>' + (c[n[0]] ? '<i>' + c[n[0]] + '</i>' : '') + '</a>'; }).join('');
    document.getElementById('mnav').innerHTML = NAV.filter(function (n) { return /^(overview|orders|inbox|website|tasks)$/.test(n[0]); }).map(function (n) { return '<a href="#' + n[0] + '" class="' + (S.view === n[0] ? 'is-on' : '') + '">' + n[2] + '<span>' + n[1] + '</span>' + (c[n[0]] ? '<i>' + c[n[0]] + '</i>' : '') + '</a>'; }).join('');
  }
  function body(h) { document.getElementById('body').innerHTML = h; return document.getElementById('body'); }

  /* ---------- overview ---------- */
  function overview() {
    var now = new Date(), m0 = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    var real = S.orders.filter(function (o) { return o.paid && !o.test && !/cancel|refund/.test(o.status); });
    var month = real.filter(function (o) { return o.at >= m0; }), rev = month.reduce(function (s, o) { return s + (o.total || 0); }, 0);
    var todo = S.orders.filter(function (o) { return o.paid && !CLOSED.test(o.status) && o.kind !== 'whatsapp'; });
    var pending = S.orders.filter(function (o) { return (o.kind === 'whatsapp' && !CLOSED.test(o.status) && o.status !== 'paid') || (o.kind !== 'whatsapp' && !o.paid && /await|pending_payment|payment_failed/.test(o.status) && Date.now() - o.at < 14 * 864e5); });
    var newMsgs = S.inbox.filter(function (m) { return m.kind !== 'whatsapp' && m.status === 'new'; });
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
      var tg = o.test ? 'TEST · ' : '';
      if (o.paid && !CLOSED.test(o.status) && Date.now() - o.at < 2 * 864e5 && !(o.kind === 'photobook' && o.status === 'ready')) attention.push(['o', tg + 'New ' + KIND[o.kind][0].toLowerCase() + ' order ' + o.ref + ' · ' + money(o.total), (o.customer.name || '') + ' · ' + o.label + ' · ' + dt(o.at), '#orders/' + o.ref]);
      if (o.kind === 'whatsapp' && o.status === 'pending') attention.push(['g', 'WhatsApp order ' + o.ref + (o.customer.name ? ' · ' + o.customer.name : ''), o.summary.slice(0, 80) || 'Reply on WhatsApp', '#orders/' + o.ref]);
      if (o.test && o.kind === 'photobook' && o.status === 'ready') attention.push(['b', tg + o.ref + ' pages received', 'Test only: don’t print', '#orders/' + o.ref]);
      if (o.test) return;
      if (o.kind === 'photobook' && (o.status === 'paid' || o.status === 'preparing') && Date.now() - o.at > 864e5) attention.push(['y', o.ref + ': paid ' + d2(o.at) + ', pages not received yet', 'Ask ' + (o.customer.name || 'the customer') + ' to open My books → Send now', '#orders/' + o.ref]);
      if (o.kind === 'photobook' && o.status === 'ready') attention.push(['b', o.ref + ' is ready to print', o.summary, '#orders/' + o.ref]);
      if (o.kind === 'shop' && o.status === 'paid') attention.push(['b', o.ref + ': new shop order', o.summary.slice(0, 80), '#orders/' + o.ref]);
      if (o.kind === 'domain' && o.status === 'pending_registration') attention.push(['b', o.ref + ': register ' + (o.raw.domain || ''), 'Paid, waiting for registration', '#orders/' + o.ref]);
    });
    S.inbox.forEach(function (m) { if (m.followUp && m.followUp <= today() && !/completed|declined|archived/.test(m.stage || '')) attention.push(['y', 'Follow up: ' + (m.customer.name || m.customer.email || 'lead'), (m.subject || '').slice(0, 80), '#leads']); });
    newMsgs.forEach(function (m) { attention.push(['p', 'Message from ' + (m.customer.name || m.customer.email || 'a visitor'), (m.subject || '').slice(0, 80), '#inbox/' + m.id]); });
    overdue.forEach(function (t) { attention.push(['r', 'Overdue: ' + t.title, 'Was due ' + d2(t.due + 'T12:00'), '#tasks']); });
    var b = body(
      '<div class="kpis"><div class="card kpi"><span>Revenue this month</span><b>' + money(rev) + '</b><small>' + month.length + ' paid order' + (month.length === 1 ? '' : 's') + ' · tests not counted</small></div>' +
      '<div class="card kpi"><span>Orders to handle</span><b>' + todo.length + '</b><small>' + todo.filter(function (o) { return o.kind === 'photobook'; }).length + ' photo books · ' + todo.filter(function (o) { return o.kind === 'shop'; }).length + ' shop · ' + todo.filter(function (o) { return o.kind === 'domain'; }).length + ' domains</small></div>' +
      '<div class="card kpi"><span>Pending orders</span><b>' + pending.length + '</b><small>' + pending.filter(function (o) { return o.kind === 'whatsapp'; }).length + ' WhatsApp · ' + pending.filter(function (o) { return o.kind !== 'whatsapp'; }).length + ' not paid yet</small></div>' +
      '<div class="card kpi"><span>New messages</span><b>' + newMsgs.length + '</b><small>' + open.length + ' open task' + (open.length === 1 ? '' : 's') + (overdue.length ? ' · ' + overdue.length + ' overdue' : '') + ' · ' + week.length + ' event' + (week.length === 1 ? '' : 's') + ' this week</small></div></div>' +
      '<div class="ov"><div class="ov__main"><div class="card"><div class="card__h"><h2>Revenue, last 30 days</h2><span class="muted">' + money(days.reduce(function (s, x) { return s + x.v; }, 0)) + '</span></div><div class="card__b"><svg class="chart" viewBox="0 0 600 170" preserveAspectRatio="none">' + bars + '<line x1="0" y1="160.5" x2="600" y2="160.5" stroke="#ebe4d8"/></svg><div class="row muted" style="justify-content:space-between;font-size:.76rem"><span>' + d2(days[0].d) + '</span><span>Today</span></div></div></div>' +
      '<div class="card"><div class="card__h"><h2>Recent orders</h2><a class="b b--sm" href="#orders">All orders</a></div>' + orderTable(S.orders.slice(0, 6), true) +
      '<div class="card__h" style="border-top:1px solid var(--line)"><h2>Pending orders</h2><span class="muted" style="font-size:.8rem">WhatsApp and unpaid</span></div>' + orderTable(pending.slice(0, 6), true) + '</div>' +
      '</div><div class="ov__rail">' +
      '<div class="card"><div class="card__h"><h2>Needs attention</h2><span class="chip' + (attention.length ? ' chip--o' : ' chip--g') + '">' + attention.length + '</span></div><ul class="list">' + (attention.length ? attention.slice(0, 7).map(function (a) { return '<li><span class="dot" style="background:var(--' + a[0] + ')"></span><div><b>' + esc(a[1]) + '</b><small>' + esc(a[2]) + '</small></div><a class="b b--sm" href="' + a[3] + '">Open</a></li>'; }).join('') : '<li class="empty">All clear. Nothing waiting on you.</li>') + '</ul></div>' +
      '<div class="card"><div class="card__h"><h2>Coming up</h2><a class="b b--sm" href="#calendar">Calendar</a></div><ul class="list">' + (up.length ? up.slice(0, 6).map(evRow).join('') : '<li class="empty">No upcoming events. <a href="#calendar">Plan one</a>.</li>') + '</ul>' +
      '<div class="card__h" style="border-top:1px solid var(--line)"><h2>Tasks due soon</h2><a class="b b--sm" href="#tasks">Board</a></div><ul class="list">' + (open.length ? open.slice().sort(function (a, c) { return (a.due || '9').localeCompare(c.due || '9'); }).slice(0, 5).map(function (t) { return '<li><span class="dot" style="background:' + ({ high: 'var(--r)', med: 'var(--o)', low: 'var(--g)' }[t.priority] || 'var(--faint)') + '"></span><div><b>' + esc(t.title) + '</b><small>' + (t.due ? 'Due ' + d2(t.due + 'T12:00') : 'No due date') + (t.status === 'doing' ? ' · in progress' : '') + '</small></div></li>'; }).join('') : '<li class="empty">No open tasks.</li>') + '</ul></div></div></div></div>'
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
      if (f.st === 'open' && (CLOSED.test(o.status) || (!o.paid && o.kind !== 'whatsapp'))) return false;
      if (f.st === 'unpaid' && o.paid) return false;
      if (f.st === 'done' && !CLOSED.test(o.status)) return false;
      return !q || (o.ref + ' ' + o.customer.name + ' ' + o.customer.email + ' ' + o.customer.phone + ' ' + o.summary).toLowerCase().indexOf(q) >= 0;
    });
    var n = function (k) { return S.orders.filter(function (o) { return k === 'all' || o.kind === k; }).length; };
    var src = Object.keys(S.sources).filter(function (k) { return S.sources[k] !== 'ok'; });
    var b = body('<div class="card"><div class="card__h" style="flex-wrap:wrap;gap:.7rem"><div class="tabs" id="kt">' + [['all', 'All'], ['photobook', 'Photo books'], ['shop', 'Shop'], ['whatsapp', 'WhatsApp'], ['domain', 'Domains']].map(function (k) { return '<button data-k="' + k[0] + '"' + (f.kind === k[0] ? ' class="is-on"' : '') + '>' + k[1] + '<i>' + n(k[0]) + '</i></button>'; }).join('') + '</div><div class="bar" style="margin-left:auto"><input class="hq-in" id="oq" type="search" placeholder="Search name, phone, order…" value="' + esc(f.q) + '"><select class="hq-in" id="os" style="width:auto">' + [['open', 'To handle'], ['all', 'All'], ['unpaid', 'Pending / not paid'], ['done', 'Done']].map(function (s) { return '<option value="' + s[0] + '"' + (f.st === s[0] ? ' selected' : '') + '>' + s[1] + '</option>'; }).join('') + '</select></div></div>' +
      (src.length ? '<div class="card__b" style="border-bottom:1px solid var(--line)">' + src.map(function (k) { return '<p class="muted" style="font-size:.82rem">' + KIND[k][0] + ' orders: ' + esc(S.sources[k]) + '</p>'; }).join('') + '</div>' : '') + orderTable(list) + '</div>' +
      '<p class="faint" style="font-size:.8rem">Shop orders are recorded when M-Pesa confirms a payment on the website. WhatsApp orders are recorded when someone taps a WhatsApp order button on the website (what they then send in WhatsApp isn’t visible here). Updates arrive live.</p>');
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
    var r = o.raw, c = o.customer, set = o.kind === 'photobook' ? PB_SET : o.kind === 'shop' ? SHOP_SET : o.kind === 'whatsapp' ? WA_SET : null;
    var a = r.address, g = r.gift, addr = a ? [a.line1, a.area, a.town, a.county].filter(Boolean).join(', ') + (a.notes ? ' (' + a.notes + ')' : '') : '';
    var labels = o.kind === 'photobook' ? PB_LABEL : o.kind === 'whatsapp' ? WA_LABEL : null;
    var h = '<div class="row"><span class="kind"><i style="background:' + KIND[o.kind][1] + '"></i>' + KIND[o.kind][0] + '</span><span class="chip chip--' + tone(o.status) + '">' + esc(o.label) + '</span>' + (o.test ? '<span class="chip chip--k">TEST · deleted after 24 h</span>' : '') + '</div>' +
      '<dl class="dl"><dt>Placed</dt><dd>' + dt(o.at) + '</dd><dt>Total</dt><dd><b>' + money(o.total) + '</b></dd><dt>Customer</dt><dd>' + esc(c.name || '—') + (c.phone ? '<br><a href="tel:+' + esc(String(c.phone).replace(/^\+/, '')) + '">+' + esc(String(c.phone).replace(/^\+/, '')) + '</a> · <a target="_blank" rel="noopener" href="https://wa.me/' + esc(String(c.phone).replace(/\D/g, '')) + '">WhatsApp</a>' : '') + (c.email ? '<br><a href="mailto:' + esc(c.email) + '">' + esc(c.email) + '</a>' : '') + '</dd>' +
      (o.kind === 'domain' ? '<dt>Domain</dt><dd>' + esc(r.domain) + ' · ' + esc(r.years) + ' year(s)</dd>' : '') +
      (r.delivery ? '<dt>Delivery</dt><dd>' + esc(r.delivery.name || r.delivery) + '</dd>' : '') + (addr ? '<dt>Address</dt><dd>' + esc(addr) + '</dd>' : '') +
      (g ? '<dt>Gift</dt><dd>For ' + esc(g.to || '—') + (g.phone ? ' · ' + esc(g.phone) : '') + (g.note ? '<br>“' + esc(g.note) + '”' : '') + '</dd>' : '') +
      '<dt>Items</dt><dd>' + (r.lines ? r.lines.map(function (l) { return esc(l.label) + (l.qty > 1 ? ' × ' + l.qty : '') + ' — ' + money(l.amount * (l.qty || 1)); }).join('<br>') : esc(o.summary)) + '</dd></dl>' +
      (o.kind === 'whatsapp' ? '<dl class="dl"><dt>Page</dt><dd>' + esc(r.page || '—') + '</dd><dt>Message</dt><dd style="white-space:pre-wrap">' + esc(r.text || '—') + '</dd></dl>' : '') +
      (o.kind === 'photobook' ? '<button class="b b--d" id="dpf">' + I.book + '<span>Book preview, pages &amp; print PDF</span></button>' : '') +
      (o.kind === 'domain' ? '<button class="b b--d" id="ddm">' + I.globe + '<span>Register, check or refund</span></button>' : '') +
      (o.kind === 'whatsapp' && c.phone ? '<a class="b b--d" target="_blank" rel="noopener" href="https://wa.me/' + esc(String(c.phone).replace(/\D/g, '').replace(/^0/, '254')) + '">' + I.wa + '<span>Reply on WhatsApp</span></a>' : '') +
      (o.kind === 'whatsapp' ? '<label class="field"><span>Order total (KES)</span><input class="hq-in" id="dtot" type="number" min="0" value="' + esc(o.total || '') + '" placeholder="e.g. 4500"></label>' : '') +
      (set ? '<div class="card" style="padding:1rem;display:grid;gap:.7rem"><b>Update status</b><select class="hq-in" id="ds">' + set.map(function (s) { return '<option value="' + s + '"' + (o.status === s ? ' selected' : '') + '>' + esc(labels ? labels[s] : s.charAt(0).toUpperCase() + s.slice(1)) + '</option>'; }).join('') + '</select><textarea class="hq-in" id="dn" rows="2" placeholder="Note (optional)"></textarea>' + (o.kind === 'photobook' ? '<label class="check"><input type="checkbox" id="de" checked> Email the customer about this update</label><label class="check"><input type="checkbox" id="dp"> Include my note in the email</label>' : '') + '<button class="b b--p" id="db" style="justify-content:center">Save</button></div>' : '') +
      (r.history && r.history.length ? '<b>History</b><ul class="hist">' + r.history.slice().reverse().map(function (x) { return '<li><b>' + esc((labels && labels[x.status]) || x.status) + '</b> · ' + dt(x.at) + (x.note ? '<br><span class="muted">' + esc(x.note) + '</span>' : '') + '</li>'; }).join('') + '</ul>' : '') +
      '<button class="b" id="dtask">' + I.tasks + '<span>Make a task for this order</span></button>';
    var d = drawer(esc(o.ref), h, function () { if (location.hash.indexOf('#orders/') === 0) history.replaceState(null, '', '#orders'); });
    var sb = d.querySelector('#db');
    if (sb) sb.onclick = function () {
      sb.disabled = true; var st = d.querySelector('#ds').value, note = d.querySelector('#dn').value;
      var p = o.kind === 'photobook' ? api('/api/photobooks?route=pbk-admin-status', { ref: o.ref, status: st, note: note, notify: d.querySelector('#de').checked, public: d.querySelector('#dp').checked }).then(function (x) { toast(x.emailed ? 'Saved and emailed to the customer' : 'Saved'); return fromPB(x.order); })
        : o.kind === 'whatsapp' ? api('/api/hq?route=inbox-status', { id: r.id, status: st, note: note, total: d.querySelector('#dtot').value }).then(function (x) { toast('Saved'); S.inbox = S.inbox.map(function (m) { return m.id === x.item.id ? x.item : m; }); return fromWA(x.item); })
        : api('/api/hq?route=shop-status', { id: r.id, status: st, note: note }).then(function (x) { toast('Saved'); return fromShop(x.order); });
      p.then(function (n) { S.orders = S.orders.map(function (y) { return y.ref === n.ref ? n : y; }); d.remove(); history.replaceState(null, '', '#orders'); route(); }, function (e) { sb.disabled = false; toast(e.message); });
    };
    var pf = d.querySelector('#dpf'); if (pf) pf.onclick = function () { frame(o.ref + ' · book and print files', '/photobooks/orders?embed=1#' + o.ref); };
    var dm = d.querySelector('#ddm'); if (dm) dm.onclick = function () { frame('Ciel Domains', '/domains/admin?embed=1'); };
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

  /* ---------- inbox: website messages, project briefs and WhatsApp orders ---------- */
  var MK = { message: ['Message', 'b'], brief: ['Project brief', 'p'], whatsapp: ['WhatsApp order', 'g'] };
  function itabs() { return '<div class="tabs" id="itb" style="margin-bottom:2px">' + [['email', 'Email'], ['web', 'Website messages & WhatsApp']].map(function (t) { return '<button data-t="' + t[0] + '"' + ((S.itab || 'email') === t[0] ? ' class="is-on"' : '') + '>' + t[1] + '</button>'; }).join('') + '</div>'; }
  function bindItabs(b) { b.querySelectorAll('#itb [data-t]').forEach(function (x) { x.onclick = function () { S.itab = x.getAttribute('data-t'); inbox(); }; }); }
  function inbox() {
    if ((S.itab || 'email') === 'email' && window.HQMail) { var bb = body(itabs() + '<div id="mxBox"></div>'); bindItabs(bb); HQMail.render(bb.querySelector('#mxBox')); return; }
    var f = S.ifilt || (S.ifilt = 'all'), list = S.inbox.filter(function (m) { return f === 'all' || (f === 'new' ? m.status === 'new' || (m.kind === 'whatsapp' && m.status === 'pending') : m.kind === f); });
    var b = body(itabs() + '<div class="card"><div class="card__h" style="flex-wrap:wrap;gap:.7rem"><div class="tabs" id="ik">' + [['all', 'All'], ['new', 'New'], ['message', 'Messages'], ['brief', 'Briefs'], ['whatsapp', 'WhatsApp']].map(function (k) { return '<button data-k="' + k[0] + '"' + (f === k[0] ? ' class="is-on"' : '') + '>' + k[1] + '</button>'; }).join('') + '</div></div>' +
      (S.sources.inbox && S.sources.inbox !== 'ok' ? '<p class="muted card__b">' + esc(S.sources.inbox) + '</p>' : '') +
      (list.length ? '<ul class="list inbox">' + list.map(function (m) { var k = MK[m.kind] || MK.message, unread = m.status === 'new' || (m.kind === 'whatsapp' && m.status === 'pending'); return '<li data-m="' + esc(m.id) + '" class="' + (unread ? 'is-new' : '') + '"><span class="dot" style="background:var(--' + (unread ? 'o' : 'line') + ')"></span><div><b>' + esc(m.customer && (m.customer.name || m.customer.email || m.customer.phone) || (m.kind === 'whatsapp' ? 'WhatsApp visitor' : 'Visitor')) + '</b><small>' + esc((m.kind === 'whatsapp' ? (m.text || m.page) : m.subject || '').replace(/\s+/g, ' ').slice(0, 120)) + '</small></div><span class="chip chip--' + k[1] + '">' + k[0] + '</span><small class="muted hide-m" style="white-space:nowrap">' + dt(m.createdAt) + '</small></li>'; }).join('') + '</ul>' : '<p class="empty">Messages from the website forms and WhatsApp order taps appear here, live.</p>') + '</div>' +
      '<div class="card card__b"><b>Emails to hello@ and lorna@cielafrica.com</b><p class="muted" style="font-size:.86rem;margin-top:.3rem">Those mailboxes live with your email provider, so Ciel Admin can’t read them yet. Website form messages are already here. Showing the mailboxes too needs a connection to the mail provider that hosts cielafrica.com email (IMAP or its API).</p></div>');
    bindItabs(b);
    b.querySelectorAll('#ik [data-k]').forEach(function (x) { x.onclick = function () { S.ifilt = x.getAttribute('data-k'); inbox(); }; });
    b.querySelectorAll('[data-m]').forEach(function (li) { li.onclick = function () { location.hash = '#inbox/' + li.getAttribute('data-m'); }; });
  }
  function msgDrawer(m) {
    if (m.kind === 'whatsapp') { var o = S.orders.filter(function (x) { return x.id === m.id; })[0]; if (o) return orderDrawer(o); }
    var c = m.customer || {}, ph = String(c.phone || '').replace(/\D/g, '').replace(/^0/, '254');
    var h = '<div class="row"><span class="chip chip--' + (MK[m.kind] || MK.message)[1] + '">' + (MK[m.kind] || MK.message)[0] + '</span><span class="muted">' + dt(m.createdAt) + '</span></div>' +
      '<dl class="dl"><dt>From</dt><dd>' + esc(c.name || '—') + (c.email ? '<br><a href="mailto:' + esc(c.email) + '?subject=' + encodeURIComponent('Re: ' + (m.subject || 'your message')) + '">' + esc(c.email) + '</a>' : '') + (ph ? '<br><a target="_blank" rel="noopener" href="https://wa.me/' + esc(ph) + '">WhatsApp +' + esc(ph) + '</a>' : '') + '</dd>' +
      (m.fields || []).map(function (f) { return '<dt>' + esc(f[0]) + '</dt><dd style="white-space:pre-wrap">' + esc(f[1]) + '</dd>'; }).join('') + '</dl>' +
      '<div class="row">' + (c.email ? '<a class="b b--p" href="mailto:' + esc(c.email) + '?subject=' + encodeURIComponent('Re: ' + (m.subject || 'your message')) + '">' + I.mail + '<span>Reply by email</span></a>' : '') + '<select class="hq-in" id="ms" style="width:auto">' + [['new', 'New'], ['contacted', 'Replied'], ['done', 'Done']].map(function (x) { return '<option value="' + x[0] + '"' + (m.status === x[0] ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select></div>' +
      '<button class="b" id="mt">' + I.tasks + '<span>Make a task</span></button><button class="b b--ghost" id="md" style="color:var(--r)">Delete</button>';
    var d = drawer('Message', h, function () { if (location.hash.indexOf('#inbox/') === 0) history.replaceState(null, '', '#inbox'); });
    function set(st) { return api('/api/hq?route=inbox-status', { id: m.id, status: st }).then(function (x) { S.inbox = S.inbox.map(function (y) { return y.id === m.id ? x.item : y; }); m = x.item; navs(); }); }
    if (m.status === 'new') set('contacted').then(function () { d.querySelector('#ms').value = 'contacted'; }, function () { });
    d.querySelector('#ms').onchange = function () { set(this.value).then(function () { toast('Saved'); }, function (e) { toast(e.message); }); };
    d.querySelector('#mt').onclick = function () { taskModal({ status: 'todo', title: 'Reply to ' + (c.name || c.email || 'message') }); };
    d.querySelector('#md').onclick = function () { if (!confirm('Delete this message?')) return; api('/api/hq?route=inbox-status', { id: m.id, op: 'delete' }).then(function () { S.inbox = S.inbox.filter(function (y) { return y.id !== m.id; }); d.remove(); history.replaceState(null, '', '#inbox'); route(); }, function (e) { toast(e.message); }); };
  }

  /* ---------- website & setup ---------- */
  /* ---------- payments: every M-Pesa payment across the shop, Photo Books, domains and WhatsApp ---------- */
  function payments() {
    var P = S.pay || (S.pay = { per: 'month', kind: 'all', st: 'paid', q: '', tests: false });
    var now = new Date(), from = { today: new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime(), week: Date.now() - 7 * 864e5, month: new Date(now.getFullYear(), now.getMonth(), 1).getTime(), year: new Date(now.getFullYear(), 0, 1).getTime(), all: 0 }[P.per];
    var REF = /refund/, FAIL = /fail|cancel/;
    function stOf(o) { return REF.test(o.status) ? 'refunded' : o.paid ? 'paid' : FAIL.test(o.status) ? 'failed' : 'pending'; }
    var base = S.orders.filter(function (o) { return (P.tests || !o.test) && (o.at || 0) >= from && (P.kind === 'all' || o.kind === P.kind); });
    var list = base.filter(function (o) { return (P.st === 'all' || stOf(o) === P.st) && (!P.q || (o.ref + ' ' + (o.customer.name || '') + ' ' + (o.customer.phone || '') + ' ' + (o.raw.receipt || '')).toLowerCase().indexOf(P.q.toLowerCase()) >= 0); });
    var sum = function (l) { return l.reduce(function (n, o) { return n + (o.total || 0); }, 0); };
    var paid = base.filter(function (o) { return stOf(o) === 'paid'; }), refd = base.filter(function (o) { return stOf(o) === 'refunded'; }), pend = base.filter(function (o) { return stOf(o) === 'pending'; }), fail = base.filter(function (o) { return stOf(o) === 'failed'; });
    var byKind = {}; paid.forEach(function (o) { byKind[o.kind] = (byKind[o.kind] || 0) + (o.total || 0); }); var mx = Math.max.apply(null, [1].concat(Object.keys(byKind).map(function (k) { return byKind[k]; })));
    var b = body('<div class="row" style="gap:.5rem"><div class="tabs" id="pPer">' + [['today', 'Today'], ['week', '7 days'], ['month', 'This month'], ['year', 'This year'], ['all', 'All time']].map(function (x) { return '<button data-v="' + x[0] + '"' + (P.per === x[0] ? ' class="is-on"' : '') + '>' + x[1] + '</button>'; }).join('') + '</div><select class="hq-in" id="pKind" style="width:auto">' + [['all', 'All products'], ['photobook', 'Photo books'], ['shop', 'Shop'], ['domain', 'Domains'], ['whatsapp', 'WhatsApp']].map(function (x) { return '<option value="' + x[0] + '"' + (P.kind === x[0] ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select><label class="check" style="margin-left:auto"><input type="checkbox" id="pTest"' + (P.tests ? ' checked' : '') + '> Include test orders</label><button class="b b--sm" id="pCsv">Export CSV</button></div>' +
      '<div class="kpis"><div class="card kpi"><span>Paid (gross)</span><b>' + money(sum(paid)) + '</b><small>' + paid.length + ' payment' + (paid.length === 1 ? '' : 's') + ' · avg ' + money(paid.length ? sum(paid) / paid.length : 0) + '</small></div><div class="card kpi"><span>Refunded</span><b>' + money(sum(refd)) + '</b><small>' + refd.length + ' refund' + (refd.length === 1 ? '' : 's') + '</small></div><div class="card kpi"><span>Net</span><b>' + money(sum(paid) - 0) + '</b><small>M-Pesa fees not included</small></div><div class="card kpi"><span>Not paid</span><b>' + money(sum(pend)) + '</b><small>' + pend.length + ' waiting · ' + fail.length + ' failed</small></div></div>' +
      '<div class="ov"><div class="ov__main"><div class="card"><div class="card__h"><div class="tabs" id="pSt">' + [['paid', 'Paid'], ['pending', 'Waiting'], ['failed', 'Failed'], ['refunded', 'Refunded'], ['all', 'All']].map(function (x) { return '<button data-v="' + x[0] + '"' + (P.st === x[0] ? ' class="is-on"' : '') + '>' + x[1] + '</button>'; }).join('') + '</div><input class="hq-in" id="pQ" type="search" placeholder="Order, name, phone, receipt" value="' + esc(P.q) + '" style="max-width:240px;margin-left:auto"></div>' +
      (list.length ? '<table class="tbl"><thead><tr><th>Date</th><th>Order</th><th class="hide-m">Customer</th><th>Amount</th><th>Status</th></tr></thead><tbody>' + list.slice(0, 300).map(function (o) { var st = stOf(o); return '<tr data-ref="' + esc(o.ref) + '"><td>' + dt(o.at) + '</td><td><b>' + esc(o.ref) + '</b>' + (o.test ? ' <span class="chip">TEST</span>' : '') + '<small><span class="kind"><i style="background:' + KIND[o.kind][1] + '"></i>' + KIND[o.kind][0] + '</span> · M-Pesa' + (o.raw.receipt ? ' · ' + esc(o.raw.receipt) : '') + '</small></td><td class="hide-m">' + esc(o.customer.name || '—') + '<small>' + esc(o.customer.phone || o.customer.email || '') + '</small></td><td><b>' + money(o.total) + '</b><small>KES</small></td><td><span class="chip chip--' + ({ paid: 'g', pending: 'y', failed: 'r', refunded: 'p' }[st]) + '">' + st.charAt(0).toUpperCase() + st.slice(1) + '</span></td></tr>'; }).join('') + '</tbody></table>' : '<p class="empty">No payments in this view.</p>') + '</div></div>' +
      '<div class="ov__rail"><div class="card"><div class="card__h"><h2>Paid by product</h2></div><div class="card__b" style="display:grid;gap:.7rem">' + (Object.keys(byKind).length ? Object.keys(byKind).sort(function (a, c) { return byKind[c] - byKind[a]; }).map(function (k) { return '<div><div class="row" style="justify-content:space-between;font-size:.84rem"><span>' + KIND[k][0] + '</span><b>' + money(byKind[k]) + '</b></div><div style="height:6px;border-radius:6px;background:var(--line2);margin-top:5px"><div style="height:100%;width:' + Math.round(byKind[k] / mx * 100) + '%;border-radius:6px;background:' + KIND[k][1] + '"></div></div></div>'; }).join('') : '<p class="muted" style="font-size:.84rem">No paid orders in this period.</p>') + '</div></div>' +
      '<div class="card card__b"><b style="font-size:.86rem">About these numbers</b><p class="muted" style="font-size:.8rem;margin-top:.3rem">Payments are confirmed by M-Pesa on the server, never by a customer returning to a page. All amounts are in KES (the only currency the checkout takes). Unpaid orders are never counted as revenue.</p></div></div></div>');
    b.querySelectorAll('#pPer [data-v]').forEach(function (x) { x.onclick = function () { P.per = x.getAttribute('data-v'); payments(); }; });
    b.querySelectorAll('#pSt [data-v]').forEach(function (x) { x.onclick = function () { P.st = x.getAttribute('data-v'); payments(); }; });
    b.querySelector('#pKind').onchange = function () { P.kind = this.value; payments(); };
    b.querySelector('#pTest').onchange = function () { P.tests = this.checked; payments(); };
    var pq = b.querySelector('#pQ'); pq.oninput = function () { P.q = pq.value; var c = pq.selectionStart; payments(); var n = document.getElementById('pQ'); n.focus(); n.setSelectionRange(c, c); };
    b.querySelector('#pCsv').onclick = function () {
      var rows = [['Date', 'Order', 'Product', 'Customer', 'Phone', 'Email', 'Amount (KES)', 'Status', 'M-Pesa receipt', 'Test']].concat(list.map(function (o) { return [new Date(o.at).toISOString(), o.ref, KIND[o.kind][0], o.customer.name || '', o.customer.phone || '', o.customer.email || '', o.total || 0, stOf(o), o.raw.receipt || '', o.test ? 'yes' : '']; }));
      var csv = rows.map(function (r) { return r.map(function (v) { v = String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(','); }).join('\n');
      var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'ciel-payments-' + P.per + '-' + today() + '.csv'; a.click();
    };
    bindOrderRows(b);
  }
  function content() {
    var tabs = [['/admin/content?embed=1', 'Products, templates, work & team'], ['/domains/admin?embed=1', 'Ciel Domains'], ['/photobooks/orders?embed=1', 'Photo Book files']];
    var cur = S.ctab || 0;
    var b = body('<div class="tabs" id="ct" style="margin-bottom:12px">' + tabs.map(function (t, i) { return '<button data-i="' + i + '"' + (i === cur ? ' class="is-on"' : '') + '>' + t[1] + '</button>'; }).join('') + '</div><iframe class="hq-embed" src="' + tabs[cur][0] + '" title="' + tabs[cur][1] + '"></iframe>');
    b.querySelectorAll('#ct [data-i]').forEach(function (x) { x.onclick = function () { S.ctab = +x.getAttribute('data-i'); content(); }; });
  }
  function activity() {
    var b = body('<div class="card"><div class="card__h"><h2>Activity log</h2><span class="muted" style="font-size:.8rem">Sign-ins and website publishing</span></div><div id="al"><p class="empty">Loading…</p></div></div>');
    api('/api/hq?route=activity').then(function (r) { b.querySelector('#al').innerHTML = r.items.length ? '<table class="tbl"><thead><tr><th>When</th><th>What</th><th>Details</th></tr></thead><tbody>' + r.items.map(function (x) { return '<tr><td>' + dt(x.at) + '</td><td><b>' + esc(x.action) + '</b></td><td><small>' + esc(x.detail || '') + '</small></td></tr>'; }).join('') + '</tbody></table>' : '<p class="empty">Nothing recorded yet.</p>'; }, function (e) { b.querySelector('#al').innerHTML = '<p class="empty">' + esc(e.message) + '</p>'; });
  }
  function website() {
    var tiles = [
      [I.pen, 'Website content', 'Edit products, templates, work and team on cielafrica.com.', '/admin/content'],
      [I.book, 'Photo Books orders', 'Every page at print size, the book preview and the print PDF for each photo book order.', '/photobooks/orders'],
      [I.globe, 'Ciel Domains', 'Domain orders: check, register, refund.', '/domains/admin'],
      [I.orders, 'Shop', 'The products customers buy on cielafrica.com.', '/products.html'],
      [I.book, 'Photo Books store', 'What customers see: covers, the editor and checkout.', '/photobooks'],
      [I.web, 'cielafrica.com', 'The public website.', '/']
    ];
    var b = body('<div class="cards3">' + tiles.map(function (t, i) { return '<button class="card tile" data-t="' + i + '"><span class="ico">' + t[0] + '</span><h3>' + t[1] + '</h3><p>' + t[2] + '</p></button>'; }).join('') + '</div>');
    b.querySelectorAll('[data-t]').forEach(function (x) { x.onclick = function () { var t = tiles[+x.getAttribute('data-t')]; frame(t[1], t[3] + (/admin|orders/.test(t[3]) ? '?embed=1' : '')); }; });
  }
  function settings() {
    var s = S.setup || {};
    var rows = [
      [s.adminPassword, 'Admin password', 'ADMIN_PASSWORD in Vercel. One password for Ciel Admin, Photo Book orders, Domains and website content.'],
      [s.storage, 'Private file storage', 'Vercel Blob (cielafrica-photobooks): orders, print files, tasks and calendar.'],
      [s.payments, 'M-Pesa payments', 'Daraja keys in Vercel. Mode: ' + esc(s.mpesaEnv || 'sandbox') + '.'],
      [s.email, 'Automatic emails', 'RESEND_API_KEY in Vercel: receipts, order updates and reminders to customers, alerts to you.'],
      [!!(s.mail && s.mail.every(function (a) { return a.configured; })), 'Mailboxes in Ciel Admin', (s.mail || []).map(function (a) { return a.email + (a.configured ? ' ✓ connected' : ' · not connected'); }).join(' · ') + '. Add MAIL_IMAP_HOST, MAIL_SMTP_HOST, MAIL_HELLO_PASSWORD and MAIL_LORNA_PASSWORD in Vercel (Inbox → Email shows the full list).'],
      [s.publish, 'Website publishing', 'GITHUB_TOKEN in Vercel lets the Website editor publish to cielafrica.com. Create it on GitHub: Settings → Developer settings → Fine-grained tokens → Generate. Repository access: only Lornna08/cielafrica. Permissions: Contents → Read and write. Copy the token, add it in Vercel as GITHUB_TOKEN, then redeploy.'],
      [s.domainsDb, 'Orders database', 'Ciel Domains and shop orders are kept in the private Blob store (or Upstash Redis if you add it later).']
    ];
    var b = body('<div class="card"><div class="card__h"><h2>This device</h2></div><ul class="list setup"><li><span class="st" id="sp">…</span><div><b>Phone notifications</b><p id="spt">New orders, WhatsApp orders, pages received and website messages, even when Ciel Admin is closed.</p></div><button class="b b--sm b--p" id="spb">Turn on</button></li>' +
      '<li><span class="st' + (standalone() ? '' : ' no') + '">' + (standalone() ? '✓' : '') + '</span><div><b>Ciel Admin app</b><p>' + (standalone() ? 'Installed and running as an app.' : isIOS() ? 'On iPhone: open cielafrica.com/admin in Safari → Share → Add to Home Screen. Notifications on iPhone work only from the installed app.' : 'Install it on this phone or computer: it opens like an app and stays signed in.') + '</p></div>' + (standalone() ? '' : '<button class="b b--sm" id="spi">Install</button>') + '</li></ul></div>' +
      '<div class="card"><div class="card__h"><h2>Setup checklist</h2></div><ul class="list setup">' + rows.map(function (r) { return '<li><span class="st' + (r[0] === 'opt' ? ' opt' : r[0] ? '' : ' no') + '">' + (r[0] === true ? '✓' : r[0] === 'opt' ? '–' : '') + '</span><div><b>' + r[1] + '</b><p>' + r[2] + '</p></div></li>'; }).join('') + '</ul></div><p class="faint" style="font-size:.82rem">Change any of these in Vercel → cielafrica → Settings → Environment Variables, then redeploy.</p>');
    function upd() { pushState().then(function (st) { var on = st === 'on'; b.querySelector('#sp').className = 'st' + (on ? '' : ' no'); b.querySelector('#sp').textContent = on ? '✓' : ''; var bt = b.querySelector('#spb'); bt.textContent = on ? 'Turn off' : 'Turn on'; bt.className = 'b b--sm' + (on ? '' : ' b--p'); if (st === 'denied') b.querySelector('#spt').textContent = 'Blocked in this browser’s settings. Allow notifications for cielafrica.com, then try again.'; if (st === 'ios') b.querySelector('#spt').textContent = 'On iPhone, install Ciel Admin first (Share → Add to Home Screen), then turn notifications on from the app.'; }); }
    upd();
    b.querySelector('#spb').onclick = function () { pushState().then(function (st) { return st === 'on' ? disablePush() : enablePush(); }).then(upd); };
    var si = b.querySelector('#spi'); if (si) si.onclick = install;
  }

  window.HQ = { api: api, toast: toast, esc: esc, dt: dt, d2: d2, money: money, today: today, body: body, modal: modal, drawer: drawer, S: S, navs: navs, route: route, saveItem: saveItem, delItem: delItem, taskModal: taskModal, eventModal: eventModal };
  if (window.HQCrm) HQCrm.init(window.HQ);
  if (window.HQSite) HQSite.init(window.HQ);
  if (window.HQMail) HQMail.init(window.HQ);
  start();
})();
