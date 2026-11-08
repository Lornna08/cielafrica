/* ============================================================
   CIEL ADMIN — notification centre (the bell) and search (Ctrl+K).
   Notifications are the real events the server records (new orders,
   WhatsApp orders, pages received, website messages). Search runs over
   the records already loaded in Ciel Admin.
   ============================================================ */
(function () {
  var H, esc = function (s) { return H.esc(s); };
  var SEEN = 'ca_nseen';
  function seen() { try { return +localStorage.getItem(SEEN) || 0; } catch (e) { return 0; } }
  function setSeen(t) { try { localStorage.setItem(SEEN, String(t)); } catch (e) { } }
  function ago(t) { var s = (Date.now() - t) / 1000; return s < 60 ? 'just now' : s < 3600 ? Math.floor(s / 60) + ' min ago' : s < 86400 ? Math.floor(s / 3600) + ' h ago' : H.d2(t); }
  var KI = { order: ['Order', 'o'], whatsapp: ['WhatsApp', 'g'], pages: ['Pages', 'p'], message: ['Message', 'b'], printer: ['Printer', 'p'], renewal: ['Renewal', 'o'], subscriber: ['Subscriber', 'g'] };

  function bell() {
    var c = document.getElementById('nbc'); if (!c) return;
    var n = (H.S.pitems || []).filter(function (x) { return x.at > seen(); }).length;
    c.hidden = !n; c.textContent = n > 9 ? '9+' : n;
  }
  function close() { var p = document.querySelector('.np'); if (p) p.remove(); document.removeEventListener('click', outside, true); }
  function outside(e) { if (!e.target.closest('.np') && !e.target.closest('#nb')) close(); }
  function notifs(btn) {
    if (document.querySelector('.np')) return close();
    var items = H.S.pitems || [], last = seen();
    var p = document.createElement('div'); p.className = 'np';
    p.innerHTML = '<div class="np__h"><b>Notifications</b><button class="b b--sm" data-all>Mark all read</button></div><div class="np__l">' +
      (items.length ? items.map(function (x, i) { var k = KI[x.kind] || KI.message; return '<a href="' + esc(x.url && x.url.indexOf('/admin') === 0 ? x.url : '/admin') + '" data-i="' + i + '" class="np__i' + (x.at > last ? ' is-new' : '') + '"><span class="np__k np__k--' + k[1] + '">' + k[0] + '</span><div><b>' + esc(x.title) + '</b>' + (x.body ? '<p>' + esc(x.body) + '</p>' : '') + '<small>' + ago(x.at) + '</small></div></a>'; }).join('') : '<p class="np__e">Nothing yet. New orders, WhatsApp orders, pages received and website messages appear here.</p>') +
      '</div><div class="np__f"><span id="npS">Phone notifications</span><button class="b b--sm" id="npB">…</button></div><div class="np__f np__f2"><button class="np__lnk" id="npC">Choose what reaches your phone</button></div><div class="np__p" id="npP" hidden></div>';
    document.body.appendChild(p);
    var r = btn.getBoundingClientRect(); p.style.top = (r.bottom + 8) + 'px'; p.style.right = Math.max(8, Math.min(innerWidth - r.right, innerWidth - p.offsetWidth - 8)) + 'px';
    p.querySelector('[data-all]').onclick = function () { setSeen(Date.now()); bell(); p.querySelectorAll('.is-new').forEach(function (x) { x.classList.remove('is-new'); }); };
    p.querySelectorAll('.np__i').forEach(function (a) { a.onclick = function (e) { var u = a.getAttribute('href'); if (u.indexOf('/admin#') === 0) { e.preventDefault(); location.hash = u.slice(6); } close(); }; });
    var upd = function () { H.pushState().then(function (st) { var b = p.querySelector('#npB'), s = p.querySelector('#npS'); if (!b) return; b.textContent = st === 'on' ? 'Turn off' : 'Turn on'; b.className = 'b b--sm' + (st === 'on' ? '' : ' b--p'); b.style.display = (st === 'denied' || st === 'none' || st === 'ios') ? 'none' : ''; s.textContent = st === 'on' ? 'Phone notifications are on for this device' : st === 'denied' ? 'Notifications are blocked in this browser’s settings' : st === 'ios' ? 'On iPhone, install Ciel Admin to the Home Screen first' : st === 'none' ? 'This browser can’t show notifications' : 'Get these on this device, even when Ciel Admin is closed'; btn.classList.toggle('is-on', st === 'on'); }); };
    p.querySelector('#npC').onclick = function () {
      var box = p.querySelector('#npP'); box.hidden = !box.hidden; if (box.hidden) return; box.innerHTML = '<p class="np__e">Loading…</p>';
      var NAMES = [['order', 'New orders and payments'], ['whatsapp', 'WhatsApp orders'], ['pages', 'Photo book pages received'], ['message', 'Website messages and leads'], ['printer', 'Printer updates'], ['renewal', 'Domain renewals'], ['subscriber', 'New email subscribers']];
      H.api('/api/hq?route=notify-prefs').then(function (x) {
        var pr = x.prefs;
        box.innerHTML = NAMES.map(function (n) { return '<label class="np__ck"><input type="checkbox" data-k="' + n[0] + '"' + (pr.kinds[n[0]] === false ? '' : ' checked') + '> ' + n[1] + '</label>'; }).join('') +
          '<label class="np__ck"><input type="checkbox" id="npQ"' + (pr.quiet.on ? ' checked' : '') + '> Quiet hours</label><div class="np__q">from <input type="time" id="npQf" value="' + esc(pr.quiet.from) + '"> to <input type="time" id="npQt" value="' + esc(pr.quiet.to) + '"></div><p class="np__note">Everything still appears here under the bell.</p>';
        box.onchange = function () {
          var k = {}; box.querySelectorAll('[data-k]').forEach(function (c) { k[c.getAttribute('data-k')] = c.checked; });
          H.api('/api/hq?route=notify-prefs-save', { kinds: k, quiet: { on: box.querySelector('#npQ').checked, from: box.querySelector('#npQf').value, to: box.querySelector('#npQt').value } }).then(function () { H.toast('Saved'); }, function (e) { H.toast(e.message); });
        };
      }, function (e) { box.innerHTML = '<p class="np__e">' + esc(e.message) + '</p>'; });
    };
    p.querySelector('#npB').onclick = function () { H.pushState().then(function (st) { return st === 'on' ? H.disablePush() : H.enablePush(); }).then(upd, upd); };
    upd();
    setTimeout(function () { document.addEventListener('click', outside, true); });
    /* opening the panel counts as having seen them */
    if (items[0]) setSeen(Math.max(last, items[0].at)); setTimeout(bell, 50);
  }

  /* ---------- search / command palette ---------- */
  function idx() {
    var S = H.S, out = [];
    H.NAV.forEach(function (n) { out.push({ g: 'Go to', t: n[1], s: '', ic: n[2], go: '#' + n[0] }); });
    out.push({ g: 'Create', t: 'New task', s: '', go: function () { H.taskModal({ status: 'todo' }); } });
    out.push({ g: 'Create', t: 'New calendar event', s: '', go: function () { H.eventModal({ date: H.today() }); } });
    if (window.HQMail) out.push({ g: 'Create', t: 'New email', s: 'From lorna@ or hello@', go: function () { location.hash = '#inbox'; setTimeout(function () { HQMail.compose({}); }, 60); } });
    S.orders.forEach(function (o) { var c = o.customer || {}; out.push({ g: 'Orders', t: (c.name || 'Customer') + ' · ' + o.ref, s: (o.label || '') + ' · ' + H.money(o.total || 0) + (o.summary ? ' · ' + o.summary : ''), k: [o.ref, c.name, c.email, c.phone, o.summary].join(' '), go: '#orders/' + o.ref }); });
    S.inbox.filter(function (m) { return m.kind !== 'whatsapp'; }).forEach(function (m) { var c = m.customer || {}; out.push({ g: 'Leads & messages', t: (c.name || c.email || 'Website message'), s: (m.subject || '') + (m.stage ? ' · ' + m.stage.replace(/_/g, ' ') : ''), k: [c.name, c.email, c.phone, m.subject, m.text].join(' '), go: '#inbox/' + m.id }); });
    S.projects.forEach(function (p) { out.push({ g: 'Projects', t: p.name || 'Project', s: [p.client, (p.status || '').replace(/_/g, ' '), p.deadline ? 'due ' + p.deadline : ''].filter(Boolean).join(' · '), k: [p.name, p.client, p.email, p.desc].join(' '), go: '#projects/' + p.id }); });
    S.tasks.forEach(function (t) { out.push({ g: 'Tasks', t: t.title || 'Task', s: [t.status === 'done' ? 'Done' : 'Open', t.due].filter(Boolean).join(' · '), k: [t.title, t.notes].join(' '), go: function () { H.taskModal(t); } }); });
    S.events.forEach(function (e) { out.push({ g: 'Calendar', t: e.title || 'Event', s: [e.date, e.start, e.client].filter(Boolean).join(' · '), k: [e.title, e.notes, e.date].join(' '), go: '#calendar' }); });
    var cs = {}; S.orders.forEach(function (o) { var c = o.customer || {}, key = (c.email || c.phone || '').toLowerCase(); if (key && !cs[key]) cs[key] = { g: 'Customers', t: c.name || c.email || c.phone, s: [c.email, c.phone].filter(Boolean).join(' · '), k: [c.name, c.email, c.phone].join(' '), go: '#customers' }; });
    Object.keys(cs).forEach(function (k) { out.push(cs[k]); });
    return out;
  }
  function score(it, q) {
    var t = (it.t || '').toLowerCase(), all = (t + ' ' + (it.s || '') + ' ' + (it.k || '')).toLowerCase(), words = q.split(/\s+/).filter(Boolean), sc = 0;
    for (var i = 0; i < words.length; i++) { var w = words[i], p = all.indexOf(w); if (p < 0) return -1; sc += t.indexOf(w) === 0 ? 30 : t.indexOf(w) >= 0 ? 20 : 5; }
    return sc + (it.g === 'Go to' ? 4 : 0);
  }
  function palette() {
    if (document.querySelector('.cp')) return;
    var all = idx(), sel = 0, list = [];
    var w = document.createElement('div'); w.className = 'cp';
    w.innerHTML = '<div class="cp__box" role="dialog" aria-label="Search"><div class="cp__in"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input placeholder="Search orders, customers, leads, projects, tasks… or type a page" autocomplete="off" spellcheck="false"><kbd>Esc</kbd></div><div class="cp__l"></div></div>';
    document.body.appendChild(w);
    var inp = w.querySelector('input'), L = w.querySelector('.cp__l');
    function shut() { w.remove(); document.removeEventListener('keydown', key, true); }
    function run(it) { shut(); if (typeof it.go === 'function') it.go(); else { if (location.hash === it.go) H.route(); else location.hash = it.go; } }
    function draw() {
      var q = inp.value.trim().toLowerCase();
      list = q ? all.map(function (it) { return [score(it, q), it]; }).filter(function (x) { return x[0] >= 0; }).sort(function (a, b) { return b[0] - a[0]; }).slice(0, 40).map(function (x) { return x[1]; }) : all.filter(function (it) { return it.g === 'Go to' || it.g === 'Create'; });
      sel = Math.min(sel, Math.max(0, list.length - 1));
      var g = '', h = '';
      list.forEach(function (it, i) { if (it.g !== g) { g = it.g; h += '<div class="cp__g">' + esc(g) + '</div>'; } h += '<button class="cp__i' + (i === sel ? ' is-on' : '') + '" data-i="' + i + '"><b>' + esc(it.t) + '</b>' + (it.s ? '<span>' + esc(it.s) + '</span>' : '') + '</button>'; });
      L.innerHTML = h || '<p class="cp__e">Nothing matches “' + esc(inp.value) + '”.</p>';
      L.querySelectorAll('.cp__i').forEach(function (b) { b.onclick = function () { run(list[+b.getAttribute('data-i')]); }; b.onmousemove = function () { if (sel !== +b.getAttribute('data-i')) { sel = +b.getAttribute('data-i'); mark(); } }; });
    }
    function mark() { L.querySelectorAll('.cp__i').forEach(function (b) { b.classList.toggle('is-on', +b.getAttribute('data-i') === sel); }); var on = L.querySelector('.is-on'); if (on) on.scrollIntoView({ block: 'nearest' }); }
    function key(e) {
      if (e.key === 'Escape') { e.preventDefault(); shut(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(list.length - 1, sel + 1); mark(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); mark(); }
      else if (e.key === 'Enter' && list[sel]) { e.preventDefault(); run(list[sel]); }
    }
    inp.oninput = function () { sel = 0; draw(); };
    w.onclick = function (e) { if (e.target === w) shut(); };
    document.addEventListener('keydown', key, true);
    draw(); inp.focus();
  }
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K') && document.querySelector('.hq-main')) { e.preventDefault(); palette(); }
    else if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '') && !(document.activeElement || {}).isContentEditable && document.querySelector('.hq-main') && !document.querySelector('.modal,.drawer,.cp')) { e.preventDefault(); palette(); }
  });
  window.HQTools = { init: function (h) { H = h; }, bell: bell, notifs: notifs, palette: palette };
})();
