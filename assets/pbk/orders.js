/* ============================================================
   CIEL AFRICA PHOTO BOOKS — orders inbox (/photobooks/orders)
   Sign in with ADMIN_PASSWORD. Lists paid orders, the customer's
   details, a flip-through preview of each book as they saw it, and
   the print files: every page at 300 dpi with 3 mm bleed, or one
   print-ready PDF (A4 trim 210 × 297 mm, TrimBox/BleedBox set), and the
   whole cover in one piece (back · spine · front) sized for the page count.
   ============================================================ */
(function () {
  'use strict';
  var root = document.getElementById('ao'), CFG = (window.CIEL && CIEL.photobooks) || {}, BOOK = CFG.book || {};
  var LABEL = { awaiting_payment: 'Awaiting payment', awaiting_confirmation: 'Paybill: confirm payment', whatsapp_request: 'WhatsApp request', payment_failed: 'Payment failed', paid: 'Paid', preparing: 'Waiting for pages', ready: 'Pages received', printing: 'Printing', ready_collection: 'Ready for collection', dispatched: 'Dispatched', delivered: 'Delivered', cancelled: 'Cancelled', refunded: 'Refunded' };
  var SET = ['paid', 'ready', 'printing', 'ready_collection', 'dispatched', 'delivered', 'cancelled', 'refunded'];
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function money(n) { return 'KES ' + Number(n || 0).toLocaleString('en-KE'); }
  function when(t) { return t ? new Date(t).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' }) : '—'; }
  function api(route, body, qs) {
    var get = body === undefined;
    return fetch('/api/photobooks?route=' + route + (qs || ''), { method: get ? 'GET' : 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'ciel' }, body: get ? undefined : JSON.stringify(body) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok || j.ok === false) { var e = new Error(j.error || 'Request failed'); e.code = j.code; e.status = r.status; throw e; } return j; }); });
  }
  var fileCache = {};
  function file(path) {
    if (fileCache[path]) return fileCache[path];
    return (fileCache[path] = fetch('/api/photobooks?route=pbk-admin-file&path=' + encodeURIComponent(path), { credentials: 'same-origin' }).then(function (r) { if (!r.ok) throw new Error('Could not load ' + path); return r.blob(); }));
  }
  function save(blob, name) { var a = document.createElement('a'), u = URL.createObjectURL(blob); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 60000); }
  function badge(s) { return '<span class="ao__b ao__b--' + esc(s) + '">' + esc(LABEL[s] || s) + '</span>'; }

  function start() {
    api('admin-me').then(function (m) {
      if (!m.setup.adminPassword) { root.innerHTML = '<div class="ao__card ao__login"><h2>Set an admin password</h2><p class="ao__msg">Add an environment variable named <b>ADMIN_PASSWORD</b> in Vercel (Project → Settings → Environment Variables), redeploy, then sign in here.</p></div>'; return; }
      if (!m.signedIn) return login();
      list();
    }).catch(function (e) { root.innerHTML = '<p class="ao__msg">' + esc(e.message) + '</p>'; });
  }
  function login() {
    root.innerHTML = '<form class="ao__card ao__login" id="lf"><h2>Photo Book orders</h2><input type="password" id="pw" placeholder="Admin password" autocomplete="current-password" required><button class="btn btn--p">Sign in</button><p class="ao__msg" id="lm"></p></form>';
    document.getElementById('lf').onsubmit = function (e) { e.preventDefault(); api('admin-login', { password: document.getElementById('pw').value }).then(list, function (er) { document.getElementById('lm').textContent = er.message; }); };
  }
  var all = [], filt = { q: '', s: '' };
  function top(extra) { return '<div class="ao__top"><a href="/admin"><img src="/assets/img/logo-dark.png?v=20261021i" alt="Ciel Africa"></a><h1>Photo Book orders</h1><a class="btn btn--ghost btn--sm" href="/admin">Ciel Admin</a>' + (extra || '') + '<button class="btn btn--ghost btn--sm" id="lo">Sign out</button></div>'; }
  function admin(on) { try { if (on) localStorage.setItem('pbk_admin', '1'); else localStorage.removeItem('pbk_admin'); } catch (e) { } }
  function wireTop() { var lo = document.getElementById('lo'); if (lo) lo.onclick = function () { admin(false); api('admin-logout', {}).then(login); }; }
  function list() {
    admin(true);
    root.innerHTML = top('<button class="btn btn--ghost btn--sm" id="rf">Refresh</button>') + '<p class="ao__msg">Loading orders…</p>'; wireTop();
    api('pbk-admin-orders').then(function (r) {
      if (!r.storage) { root.innerHTML = top() + '<div class="ao__card"><p class="ao__msg">Order storage is not connected to this deployment yet.</p></div>'; wireTop(); return; }
      all = r.orders;
      var h = decodeURIComponent((location.hash || '').slice(1)); if (/^PB-[0-9A-Z]{8}$/.test(h)) detail(h); else drawList();
    }).catch(function (e) { if (e.status === 401) return login(); root.innerHTML = top() + '<p class="ao__msg">' + esc(e.message) + '</p>'; wireTop(); });
  }
  function drawList() {
    if (location.hash) history.replaceState(null, '', location.pathname);
    var q = filt.q.toLowerCase(), l = all.filter(function (o) { return (!filt.s || o.status === filt.s) && (!q || (o.ref + ' ' + o.customer.name + ' ' + o.customer.phone + ' ' + o.customer.email).toLowerCase().indexOf(q) >= 0); });
    var paidOnly = all.filter(function (o) { return o.paidAt && !o.test; });
    root.innerHTML = top('<button class="btn btn--ghost btn--sm" id="stg">Storage</button><button class="btn btn--ghost btn--sm" id="rf">Refresh</button>') +
      '<div id="stgBox"></div><div class="ao__bar"><input id="aq" type="search" placeholder="Search order, name, phone, email" value="' + esc(filt.q) + '"><select id="as"><option value="">All statuses</option>' + Object.keys(LABEL).map(function (k) { return '<option value="' + k + '"' + (filt.s === k ? ' selected' : '') + '>' + LABEL[k] + '</option>'; }).join('') + '</select></div>' +
      '<div class="ao__card ao__tip"><b>Try an order yourself</b><span>On this browser, open <a href="/photobooks/my-books" target="_blank" rel="noopener">My books</a> → Test books, add the Serengeti or Dubai book, tap <b>Order</b> and choose <b>Place test order (no payment)</b>. Test orders are marked TEST, never count as revenue, and stay here until you delete them.</span></div>' +
      '<p class="ao__msg">' + paidOnly.length + ' paid order' + (paidOnly.length === 1 ? '' : 's') + ' · ' + money(paidOnly.reduce(function (s, o) { return s + (o.total || 0); }, 0)) + '</p>' +
      '<div class="ao__list">' + (l.length ? l.map(function (o) {
        var prints = (o.items || []).filter(function (i) { return i.product === 'print'; }).length;
        return '<button class="ao__row' + (o.test ? ' is-test' : '') + '" data-ref="' + esc(o.ref) + '"><span><b>' + esc(o.ref) + '</b>' + (o.test ? ' <i class="ao__test">TEST</i>' : '') + '<small>' + when(o.createdAt) + '</small></span><span>' + esc(o.customer.name) + '<small>' + esc(o.customer.phone) + (o.gift ? ' · 🎁 gift' : '') + '</small></span>' +
          '<span>' + (o.items || []).map(function (i) { return esc(i.name) + ' · ' + (i.product === 'print' ? 'Print ×' + i.qty : 'PDF') + ' · ' + i.pages + 'p'; }).join('<br>') + (prints ? '<small>' + (o.files ? Object.keys(o.files).length : 0) + '/' + prints + ' print files received</small>' : '') + '</span><span><b>' + money(o.total) + '</b></span><span>' + badge(o.status) + '</span></button>';
      }).join('') : '<p class="ao__msg">No orders yet.</p>') + '</div>';
    wireTop(); document.getElementById('rf').onclick = list; document.getElementById('stg').onclick = storage;
    var aq = document.getElementById('aq'); aq.oninput = function () { filt.q = aq.value; var pos = aq.selectionStart; drawList(); var n = document.getElementById('aq'); n.focus(); n.setSelectionRange(pos, pos); };
    document.getElementById('as').onchange = function () { filt.s = this.value; drawList(); };
    root.querySelectorAll('[data-ref]').forEach(function (b) { b.onclick = function () { detail(b.getAttribute('data-ref')); }; });
  }
  /* ---------- storage: delete page files of finished (and test) orders so the store doesn't fill up ---------- */
  function mb(n) { return n >= 1073741824 ? (Math.round(n / 107374182.4) / 10) + ' GB' : Math.max(n ? 0.1 : 0, Math.round(n / 104857.6) / 10) + ' MB'; }
  function storage() {
    var el = document.getElementById('stgBox'); if (!el) return;
    if (el.innerHTML) { el.innerHTML = ''; return; }
    el.innerHTML = '<div class="ao__card"><p class="ao__msg">Checking storage…</p></div>';
    function run(opts) {
      return api('pbk-admin-storage', opts).then(function (r) {
        if (opts.run) return r;
        el.innerHTML = '<div class="ao__card ao__stg"><h2>Storage</h2>' +
          '<p class="ao__msg">Order files: <b>' + mb(r.orders.bytes) + '</b> (' + r.orders.files + ' files) · Pages uploaded while customers design: <b>' + mb(r.drafts.bytes) + '</b> (' + r.drafts.files + ' files, removed by themselves after 30 days; ' + r.drafts.old + ' older than 7 days)</p>' +
          '<p class="ao__msg">Free up space by deleting the page files of <b>finished orders</b> (delivered, collected, cancelled, refunded or failed) and <b>test orders</b>. The order record, customer details and cover picture stay.</p>' +
          '<div class="ao__acts"><select id="stD"><option value="0">Finished any time</option><option value="14">Finished over 14 days ago</option><option value="30" selected>Finished over 30 days ago</option><option value="90">Finished over 90 days ago</option></select>' +
          '<select id="stW"><option value="print">Print files only (keep previews)</option><option value="all">Print files and previews</option></select>' +
          '<label class="ao__chk"><input type="checkbox" id="stX" checked> Also pages from books never ordered (over 7 days old)</label></div>' +
          '<p class="ao__msg" id="stE">' + r.finished.orders + ' order' + (r.finished.orders === 1 ? '' : 's') + ' (' + r.finished.tests + ' test) · about <b>' + mb(r.finished.bytes) + '</b></p>' +
          '<div class="ao__acts"><button class="btn btn--p btn--sm" id="stGo"' + (r.finished.orders || r.drafts.old ? '' : ' disabled') + '>Delete these files</button><span class="ao__msg" id="stM"></span></div></div>';
        var D = document.getElementById('stD'), W = document.getElementById('stW');
        D.value = String(opts.days); W.value = opts.what;
        D.onchange = W.onchange = function () { run({ days: +D.value, what: W.value }); };
        document.getElementById('stGo').onclick = function () {
          var x = document.getElementById('stX').checked;
          if (!confirm('Delete the ' + (W.value === 'all' ? 'print files and previews' : 'print files') + ' of ' + r.finished.orders + ' order(s)' + (x ? ' and old unordered pages' : '') + '? This can’t be undone.')) return;
          this.disabled = true; document.getElementById('stM').textContent = 'Deleting…';
          run({ days: +D.value, what: W.value, drafts: x, run: true }).then(function (z) { el.innerHTML = ''; list(); setTimeout(function () { alert('Deleted ' + z.deleted + ' files (' + mb(z.bytes) + ').'); }, 300); }, function (e) { document.getElementById('stM').textContent = e.message; });
        };
      }, function (e) { el.innerHTML = '<div class="ao__card"><p class="ao__msg">' + esc(e.message) + '</p></div>'; });
    }
    run({ days: 30, what: 'print' });
  }
  /** one order's files: delete them once the book is printed and delivered (or straight away for a test) */
  function purgeBox(o, r) {
    var el = document.getElementById('pg'); if (!el) return;
    var st = r.storage || { files: 0, bytes: 0 }, done = o.test || /^(delivered|ready_collection|cancelled|refunded|payment_failed)$/.test(o.status);
    var h = '<h2 style="margin-top:1.2rem">Files</h2>';
    if (o.purged) h += '<p class="ao__msg">' + (o.purged.what === 'all' ? 'Page files and previews' : 'Print files') + ' deleted ' + when(o.purged.at) + ' (' + mb(o.purged.bytes) + ').</p>';
    if (!st.files) { el.innerHTML = h + '<p class="ao__msg">No page files are stored for this order.</p>'; return; }
    h += '<p class="ao__msg">' + st.files + ' files · ' + mb(st.bytes) + ' in storage.' + (done ? '' : ' This order isn’t finished yet: keep its files until the book is printed and delivered.') + '</p>' +
      '<div class="ao__acts"><button class="btn btn--ghost btn--sm" data-pg="print">Delete print files</button><button class="btn btn--ghost btn--sm" data-pg="all">Delete files and previews</button>' + (done ? '' : '<label class="ao__chk"><input type="checkbox" id="pgF"> I’m sure</label>') + '</div><span class="ao__msg" id="pgM"></span>';
    el.innerHTML = h;
    el.querySelectorAll('[data-pg]').forEach(function (bt) {
      bt.onclick = function () {
        var what = bt.getAttribute('data-pg'), f = document.getElementById('pgF');
        if (f && !f.checked) { document.getElementById('pgM').textContent = 'Tick “I’m sure” first: this order isn’t finished.'; return; }
        if (!confirm(what === 'all' ? 'Delete all page files and previews of ' + o.ref + '? The order record and cover picture stay. This can’t be undone.' : 'Delete the print files of ' + o.ref + '? The previews stay, so you can still look at the book. This can’t be undone.')) return;
        bt.disabled = true;
        api('pbk-admin-purge', { ref: o.ref, what: what, force: !!(f && f.checked) }).then(function (x) { all = all.map(function (y) { return y.ref === o.ref ? x.order : y; }); detail(o.ref); }, function (e) { bt.disabled = false; document.getElementById('pgM').textContent = e.message; });
      };
    });
  }
  /* ---------- corrections: let the customer fix their book after ordering ---------- */
  function fixBox(o, r) {
    var el = document.getElementById('fx'); if (!el) return;
    var prints = (o.items || []).filter(function (i) { return i.product === 'print'; }), e = o.edit;
    if (!prints.length) { el.innerHTML = ''; return; }
    var phone = String(o.customer.phone || '').replace(/\D/g, ''), first = (o.customer.name || '').split(' ')[0] || 'there';
    function share(url) {
      var msg = 'Hello ' + first + ', this is Ciel Africa about your photo book order ' + o.ref + '. ' + (e && e.note ? e.note + ' ' : '') + 'Please open this link on the phone or computer you made the book on, make the change, then tap "Send corrected book": ' + url;
      return '<div class="ao__fxl"><input readonly value="' + esc(url) + '"><button class="btn btn--ghost btn--sm" data-copy>Copy link</button>' + (phone ? '<a class="btn btn--dark btn--sm" target="_blank" rel="noopener" href="https://wa.me/' + esc(phone) + '?text=' + encodeURIComponent(msg) + '">Send on WhatsApp</a>' : '') + '</div>';
    }
    function done(x, url) {
      o = x.order; all = all.map(function (y) { return y.ref === o.ref ? o : y; }); e = o.edit; draw(url, x.emailed);
    }
    function draw(url, emailed) {
      var h = '<h2 style="margin-top:1.2rem">Corrections</h2>';
      if (e && e.review) h += '<div class="ao__pay"><b>' + (e.self ? 'The customer changed their book after sending it' : 'Corrected book received') + '</b><span>Check the new version under Books before printing. The earlier version is kept.</span><div class="ao__acts"><button class="btn btn--p btn--sm" data-rv>Mark as reviewed</button></div></div>';
      if (e && e.self && e.open && e.until > Date.now()) {
        h += '<div class="ao__pay is-wait"><b>The customer can still change this book until ' + when(e.until) + '</b><span>Everyone gets ' + 10 + ' minutes after sending their book. You’ll be notified if they send a new version. Wait before printing.</span><div class="ao__acts"><button class="btn btn--ghost btn--sm" data-close>End it now</button></div></div>';
      } else if (e && e.open && e.until > Date.now()) {
        h += '<div class="ao__pay is-wait"><b>Open for corrections until ' + when(e.until) + '</b><span>Correction ' + e.round + (e.note ? ' · “' + esc(e.note) + '”' : '') + (prints.length > 1 ? ' · ' + Object.keys(e.done || {}).length + ' of ' + e.pids.length + ' books sent back' : '') + '</span>' +
          (url ? share(url) + (emailed ? '<span>✓ Emailed to ' + esc(o.customer.email) + '</span>' : '') : '<span>Lost the link? Open corrections again to make a new one (the old link stops working).</span>') +
          '<div class="ao__acts"><button class="btn btn--ghost btn--sm" data-close>Close corrections</button></div></div>';
      } else if (/^(dispatched|delivered|cancelled|refunded|ready_collection)$/.test(o.status)) {
        h += '<p class="ao__msg">This order is ' + esc(LABEL[o.status] || o.status) + ', so it can’t be reopened.</p>';
      }
      if (!(e && e.open && e.until > Date.now() && !e.self) && !(e && e.self && e.open && e.until > Date.now()) && !/^(dispatched|delivered|cancelled|refunded|ready_collection)$/.test(o.status)) {
        h += '<p class="ao__msg">Saw a problem, or pages missing? Let the customer open this book again, fix it and send it back. Nothing else in their order changes, and the version you have now is kept.</p>' +
          (prints.length > 1 ? '<div class="ao__acts">' + prints.map(function (it) { return '<label class="ao__chk"><input type="checkbox" data-fp value="' + esc(it.projectId) + '" checked> ' + esc(it.name) + '</label>'; }).join('') + '</div>' : '') +
          '<textarea id="fxn" rows="2" maxlength="600" placeholder="What should they fix? e.g. Page 7 is blank and the photo on page 12 is cut off. (They see this.)"></textarea>' +
          '<div class="ao__acts"><select id="fxd"><option value="1">Open for 1 day</option><option value="3">Open for 3 days</option><option value="7" selected>Open for 7 days</option><option value="14">Open for 14 days</option></select><label class="ao__chk"><input type="checkbox" id="fxe"' + (o.customer.email ? ' checked' : ' disabled') + '> Email the link to the customer</label><button class="btn btn--p btn--sm" data-open>Allow corrections</button></div>';
      }
      el.innerHTML = h;
      var q = function (s2) { return el.querySelector(s2); };
      if (q('[data-copy]')) q('[data-copy]').onclick = function () { var i = q('.ao__fxl input'); i.select(); (navigator.clipboard ? navigator.clipboard.writeText(i.value) : Promise.reject()).then(function () { q('[data-copy]').textContent = 'Copied ✓'; }, function () { document.execCommand('copy'); }); };
      if (q('[data-rv]')) q('[data-rv]').onclick = function () { api('pbk-admin-reopen', { ref: o.ref, reviewed: true }).then(function (x) { done(x, url); }, function (er) { alert(er.message); }); };
      if (q('[data-close]')) q('[data-close]').onclick = function () { if (!confirm('Close corrections? The customer’s link stops working.')) return; api('pbk-admin-reopen', { ref: o.ref, close: true }).then(function (x) { done(x); }, function (er) { alert(er.message); }); };
      if (q('[data-open]')) q('[data-open]').onclick = function () {
        var pids = [].slice.call(el.querySelectorAll('[data-fp]')).filter(function (c) { return c.checked; }).map(function (c) { return c.value; });
        if (prints.length > 1 && !pids.length) return alert('Choose at least one book.');
        var btn = q('[data-open]'); btn.disabled = true; btn.textContent = 'Opening…';
        api('pbk-admin-reopen', { ref: o.ref, note: q('#fxn').value, days: +q('#fxd').value, notify: q('#fxe').checked, pids: pids.length ? pids : undefined }).then(function (x) { done(x, x.url); }, function (er) { btn.disabled = false; btn.textContent = 'Allow corrections'; alert(er.message); });
      };
    }
    draw();
  }
  /* ---------- printing partner: choose what to share, review it, send it ---------- */
  var PRN = null;
  function printerBox(o, r) {
    var el = document.getElementById('pr'); if (!el) return;
    var prints = (o.items || []).filter(function (i) { return i.product === 'print'; }); if (!prints.length) { el.innerHTML = ''; return; }
    var ready = prints.every(function (i) { return o.files && o.files[i.projectId] && o.files[i.projectId].complete; });
    (PRN ? Promise.resolve(PRN) : api('pbk-printer-get').then(function (x) { return (PRN = x.printer); })).then(function (P) { draw(P); }, function (e) { el.innerHTML = '<p class="ao__msg">' + esc(e.message) + '</p>'; });
    function q(s2) { return el.querySelector(s2); }
    function opts() { return { ref: o.ref, include: { name: q('#prN').checked, phone: q('#prP').checked, gift: !!(q('#prG') && q('#prG').checked) }, delivery: q('[name=prD]:checked').value, notes: q('#prT').value }; }
    function packBooks(text) {
      return prints.map(function (it) {
        var b = r.books[it.projectId] || { print: [], spine: [] };
        return { name: it.name, pages: it.pages, qty: it.qty, spine: it.pages >= 37, files: b.print.length, info: b.book || {}, print: function (i) { return file(b.print[i].path).then(function (bl) { delete fileCache[b.print[i].path]; return bl; }); }, spineFile: function () { return b.spine && b.spine[0] ? file(b.spine[0].path) : Promise.resolve(null); } };
      });
    }
    function draw(P) {
      var sh = (o.printer && o.printer.shares) || [], ack = o.printer && o.printer.ack, pf = P.prefs || {};
      var h = '<h2 style="margin-top:1.2rem">Printing partner</h2>';
      if (!P.name && !P.email && !P.phone) h += '<p class="ao__msg">Save your printer’s contact once; it’s used for every order.</p>';
      h += '<details class="ao__prc"' + (P.name || P.email || P.phone ? '' : ' open') + '><summary>' + (P.name ? esc(P.name) : 'Printer contact') + (P.email ? ' · ' + esc(P.email) : '') + (P.phone ? ' · +' + esc(P.phone) : '') + '</summary><div class="ao__prf"><input id="pcN" placeholder="Printer name" value="' + esc(P.name) + '"><input id="pcE" type="email" placeholder="Email" value="' + esc(P.email) + '"><input id="pcP" type="tel" placeholder="WhatsApp number, e.g. 0712 345 678" value="' + esc(P.phone ? '+' + P.phone : '') + '"><button class="btn btn--ghost btn--sm" id="pcS">Save printer</button></div></details>';
      if (ack) h += '<div class="ao__pay"><b>Printer: ' + (ack.status === 'received' ? 'files received' : ack.status === 'printed' ? 'printed' : 'reported a problem') + '</b><span>' + when(ack.at) + (ack.note ? ' · “' + esc(ack.note) + '”' : '') + '</span></div>';
      if (!ready) h += '<p class="ao__msg">The print pages haven’t all arrived yet, so this order can’t go to the printer.</p>';
      else {
        h += '<p class="ao__msg">The printer gets the files and only what you tick. Prices and payment details are never shared.</p>' +
          '<div class="ao__prs"><label class="ao__chk"><input type="checkbox" id="prN"' + (pf.name !== false ? ' checked' : '') + '> Customer name</label><label class="ao__chk"><input type="checkbox" id="prP"' + (pf.phone ? ' checked' : '') + '> Customer phone</label>' + (o.gift ? '<label class="ao__chk"><input type="checkbox" id="prG"> Gift recipient</label>' : '') + '</div>' +
          '<div class="ao__prs"><label class="ao__chk"><input type="radio" name="prD" value="self"' + (pf.delivery !== 'printer' || !o.address ? ' checked' : '') + '> I’ll handle delivery</label><label class="ao__chk"><input type="radio" name="prD" value="printer"' + (pf.delivery === 'printer' && o.address ? ' checked' : '') + (o.address ? '' : ' disabled') + '> Printer delivers to the customer' + (o.address ? '' : ' (no address)') + '</label></div>' +
          '<textarea id="prT" rows="2" maxlength="600" placeholder="Production notes for the printer (optional)"></textarea>' +
          '<div class="ao__acts"><button class="btn btn--dark btn--sm" id="prV">Review what will be sent</button><button class="btn btn--ghost btn--sm" id="prZ">Download the files (.zip)</button></div><p class="ao__msg" id="prM"></p><div id="prR"></div>';
      }
      if (sh.length) h += '<p class="ao__msg"><b>Shared</b><br>' + sh.slice().reverse().map(function (x) { return when(x.at) + ' · ' + (x.via === 'email' ? 'email to ' + esc(x.to || '') : x.via === 'whatsapp' ? 'WhatsApp' : 'link') + ' · ' + (x.delivery === 'printer' ? 'printer delivers' : 'you deliver') + (x.include && x.include.phone ? ' · phone' : '') + (x.include && x.include.name ? ' · name' : ''); }).join('<br>') + '</p>';
      el.innerHTML = h;
      q('#pcS').onclick = function () { api('pbk-printer-save', { name: q('#pcN').value, email: q('#pcE').value, phone: q('#pcP').value }).then(function (x) { PRN = x.printer; draw(PRN); }, function (e) { alert(e.message); }); };
      if (!ready) return;
      q('#prZ').onclick = function () {
        var bt = q('#prZ'), m = q('#prM'); bt.disabled = true;
        api('pbk-printer-share', Object.assign(opts(), { preview: true })).then(function (x) {
          return PBKPack.build({ ref: o.ref, text: x.text, books: packBooks(), progress: function (s2) { if (s2) m.textContent = s2; } });
        }).then(function (z) { PBKPack.save(z.blob, z.name); m.textContent = 'Downloaded ' + z.name + ' (' + Math.round(z.blob.size / 1048576) + ' MB).'; }, function (e) { m.textContent = e.message; }).then(function () { bt.disabled = false; });
      };
      q('#prV').onclick = function () {
        var o1 = opts();
        api('pbk-printer-share', Object.assign({}, o1, { preview: true })).then(function (x) {
          var P2 = x.printer;
          q('#prR').innerHTML = '<div class="ao__pay"><b>This is what the printer will get</b><pre class="ao__pre">' + esc(x.text) + '</pre><span>Plus a link to download: front and back cover (A4 PDFs), ' + (prints.some(function (i) { return i.pages >= 37; }) ? 'the spine (PNG), ' : '') + 'and the pages (one A4 PDF).' + (prints.some(function (i) { return i.pages < 37; }) ? ' Books of 36 pages or fewer have no printed spine.' : '') + '</span>' +
            '<div class="ao__acts">' + (P2.email ? '<button class="btn btn--p btn--sm" data-via="email">Send by email to ' + esc(P2.email) + '</button>' : '') + (P2.phone ? '<button class="btn btn--dark btn--sm" data-via="whatsapp">Send on WhatsApp</button>' : '') + '<button class="btn btn--ghost btn--sm" data-via="link">Just make the link</button></div>' + (!P2.email && !P2.phone ? '<span>Save the printer’s email or WhatsApp number above to send directly.</span>' : '') + '</div>';
          q('#prR').querySelectorAll('[data-via]').forEach(function (b) {
            b.onclick = function () {
              var via = b.getAttribute('data-via'), w = via === 'whatsapp' ? window.open('', '_blank') : null; b.disabled = true;
              api('pbk-printer-share', Object.assign({}, o1, { via: via })).then(function (y) {
                o = y.order; all = all.map(function (z) { return z.ref === o.ref ? o : z; });
                api('pbk-printer-save', { prefs: { name: o1.include.name, phone: o1.include.phone, delivery: o1.delivery } }).then(function (z) { PRN = z.printer; }).catch(function () { });
                if (w) w.location = 'https://wa.me/' + y.printer.phone + '?text=' + encodeURIComponent(y.text);
                draw(PRN || P);
                q('#prM').innerHTML = (via === 'email' ? '✓ Emailed to ' + esc(y.printer.email) + '. ' : via === 'whatsapp' ? '✓ WhatsApp opened with the message. ' : '') + 'Link: <a href="' + esc(y.url) + '" target="_blank" rel="noopener">open the printer’s page</a>';
              }, function (e) { if (w) w.close(); b.disabled = false; alert(e.message); });
            };
          });
        }, function (e) { q('#prM').textContent = e.message; });
      };
    }
  }
  function detail(ref) {
    if (/^PB-[0-9A-Z]{8}$/.test(ref) && location.hash !== '#' + ref) history.replaceState(null, '', location.pathname + '#' + ref);
    root.innerHTML = top() + '<button class="ao__back" id="bk">‹ All orders</button><p class="ao__msg">Loading ' + esc(ref) + '…</p>'; wireTop();
    document.getElementById('bk').onclick = drawList;
    api('pbk-admin-order', undefined, '&ref=' + encodeURIComponent(ref)).then(function (r) {
      var o = r.order, a = o.address, g = o.gift;
      root.innerHTML = top() + '<button class="ao__back" id="bk">‹ All orders</button><div class="ao__det"><div class="ao__card"><h2>' + esc(o.ref) + ' ' + badge(o.status) + (o.test ? ' <i class="ao__test">TEST</i>' : '') + '</h2>' + (o.test ? '<p class="ao__msg">Test order: don’t print. It stays here until you delete it. <button class="btn btn--ghost btn--sm" id="tdel">Delete now</button></p>' : '') +
        (o.payment && o.payment.method === 'paybill' ? '<div class="ao__pay' + (o.status === 'awaiting_confirmation' ? ' is-wait' : '') + '"><b>' + (o.status === 'awaiting_confirmation' ? 'Check this Paybill payment' : 'Paid by Paybill') + '</b><span>Paybill ' + esc(o.payment.paybill) + ' · account ' + esc(o.payment.account) + ' · code <b>' + esc(o.payment.code) + '</b> · ' + money(o.total) + '</span><blockquote>' + esc(o.payment.message) + '</blockquote>' +
          (o.status === 'awaiting_confirmation' ? '<div class="ao__acts"><button class="btn btn--p btn--sm" id="pyok">Confirm payment</button><button class="btn btn--ghost btn--sm" id="pyno">Not received</button></div><p class="ao__msg">Confirming emails the customer and unlocks the order. Pages can arrive before you confirm; don’t print until it’s confirmed.</p>' : '') + '</div>' : '') +
        '<dl>' +
        '<dt>Placed</dt><dd>' + when(o.createdAt) + '</dd><dt>Paid</dt><dd>' + (o.paidAt ? when(o.paidAt) : 'Not paid') + '</dd><dt>Total</dt><dd><b>' + money(o.total) + '</b></dd>' +
        '<dt>Customer</dt><dd>' + esc(o.customer.name) + '<br><a href="tel:+' + esc(o.customer.phone) + '">+' + esc(o.customer.phone) + '</a><br><a href="mailto:' + esc(o.customer.email) + '">' + esc(o.customer.email) + '</a></dd>' +
        (o.delivery ? '<dt>Delivery</dt><dd>' + esc(o.delivery.name) + '</dd>' : '') + (a ? '<dt>Address</dt><dd>' + esc([a.line1, a.area, a.town, a.county].filter(Boolean).join(', ')) + (a.notes ? '<br><i>' + esc(a.notes) + '</i>' : '') + '</dd>' : '') +
        (g ? '<dt>Gift</dt><dd>🎁 For ' + esc(g.to || '—') + (g.phone ? ' · ' + esc(g.phone) : '') + (g.note ? '<br>“' + esc(g.note) + '”' : '') + '</dd>' : '') +
        '<dt>Lines</dt><dd>' + (o.lines || []).map(function (l) { return esc(l.label) + (l.qty > 1 ? ' × ' + l.qty : '') + ' — ' + money(l.amount * (l.qty || 1)); }).join('<br>') + '</dd></dl>' +
        '<h2 style="margin-top:1.2rem">Status</h2><div class="ao__acts"><select id="ss">' + SET.map(function (k) { return '<option value="' + k + '"' + (o.status === k ? ' selected' : '') + '>' + LABEL[k] + '</option>'; }).join('') + '</select></div><textarea id="sn" rows="2" placeholder="Note (optional)" style="margin-top:.4rem"></textarea><label style="display:flex;gap:.4rem;align-items:center;font-size:.86rem;margin-top:.4rem"><input type="checkbox" id="se" checked> Email the customer</label><button class="btn btn--dark btn--sm" id="sb" style="margin-top:.4rem">Update status</button>' +
        '<div id="fx"></div><div id="pr"></div><div id="pg"></div><ul class="ao__hist">' + (o.history || []).slice().reverse().map(function (h) { return '<li><b>' + esc(LABEL[h.status] || h.status) + '</b> · ' + when(h.at) + (h.note ? ' — ' + esc(h.note) : '') + '</li>'; }).join('') + '</ul></div>' +
        '<div class="ao__card"><h2>Books</h2>' + (o.items || []).map(function (it) {
          var b = r.books[it.projectId] || { print: [], view: [], spine: [] }, bk = b.book || {}, tr = trim(bk);
          return '<div class="ao__book" data-pid="' + esc(it.projectId) + '"><img data-cov alt=""><div><b>' + esc(it.name) + '</b>' + (b.dir && b.dir !== it.projectId ? ' <span class="ao__b ao__b--fix">Corrected version ' + esc(b.dir.split('-r').pop()) + '</span>' : '') + (b.incoming ? '<span class="ao__msg">Correction ' + b.incoming.round + ' arriving: ' + b.incoming.print + ' of ' + (it.pages + 2) + ' files so far.</span>' : '') + (b.earlier && b.earlier.length ? '<span class="ao__msg">Earlier version' + (b.earlier.length > 1 ? 's' : '') + ' kept: ' + b.earlier.map(function (v) { return '<button class="ao__lnk" data-old="' + esc(v.dir) + '">' + (v.round ? 'correction ' + v.round : 'first version') + '</button>'; }).join(', ') + '</span>' : '') + '<span class="ao__msg">' + (it.product === 'print' ? 'Printed hardcover × ' + it.qty : 'Print-ready PDF (customer downloads it)') + ' · ' + it.pages + ' pages · ' + tr.w / 10 + ' × ' + tr.h / 10 + ' cm' + (tr.h === 297 ? ' (A4)' : '') + '</span>' +
            (o.channel === 'whatsapp' ? '<span class="ao__msg"><b>WhatsApp order request.</b> ' + (b.view.length ? 'These are previews of what they designed (not print files).' : 'No preview yet: it sends from their device right after they tap Order on WhatsApp.') + '</span>' : '') +
            (it.product === 'print' ? '<span class="ao__msg">' + b.print.length + ' of ' + (it.pages + 2) + ' print files received' + (bk.spine ? ' · Spine ' + (bk.spineMm || spineMm(it.pages)) + ' mm: “' + esc(bk.spine.hideTitle ? '(no words)' : bk.spine.title || '') + '” on ' + esc(bk.spine.bg || '') : '') + '</span>' : '') +
            (b.view.length ? '<div class="ao__acts"><button class="btn btn--p btn--sm" data-prev>Preview book</button>' + (b.print.length ? '<button class="btn btn--dark btn--sm" data-pdf>Print PDF</button><button class="btn btn--dark btn--sm" data-wrap>Full cover PDF</button><button class="btn btn--ghost btn--sm" data-pages>Show pages</button>' : '') + '</div><div class="ao__pages" data-grid hidden></div><span class="ao__msg" data-msg></span>' : (it.product === 'print' ? '<span class="ao__msg">The pages haven’t arrived yet. They send from the customer’s device after payment.</span>' : '')) + '</div></div>';
        }).join('') + '<p class="ao__msg">Print files: 000 = front cover, then the pages in order, last = back cover, each its own page at ' + ((BOOK.trimW || 210) + 6) + ' × ' + ((BOOK.trimH || 297) + 6) + ' mm (3 mm bleed) at 300 dpi; the PDF’s TrimBox is ' + (BOOK.trimW || 210) + ' × ' + (BOOK.trimH || 297) + ' mm. <b>Full cover</b> is the hardcover case in one piece: wrap · back · hinge · spine · hinge · front · wrap, sized for that book’s page count (numbers from Ciel Admin → Prices → Hardcover case).</p></div></div>';
      wireTop(); document.getElementById('bk').onclick = drawList;
      fixBox(o, r); printerBox(o, r); purgeBox(o, r);
      var pyok = document.getElementById('pyok'), pyno = document.getElementById('pyno');
      if (pyok) pyok.onclick = function () { if (!confirm('Confirm that ' + money(o.total) + ' (code ' + o.payment.code + ') reached Paybill ' + o.payment.paybill + '?')) return; pyok.disabled = true; api('pbk-admin-confirm', { ref: o.ref, ok: true }).then(function (x) { all = all.map(function (y) { return y.ref === o.ref ? x.order : y; }); detail(o.ref); }, function (e) { pyok.disabled = false; alert(e.message); }); };
      if (pyno) pyno.onclick = function () { var note = prompt('Payment not found. A short note for the customer (optional):', ''); if (note === null) return; api('pbk-admin-confirm', { ref: o.ref, ok: false, note: note }).then(function (x) { all = all.map(function (y) { return y.ref === o.ref ? x.order : y; }); detail(o.ref); }, function (e) { alert(e.message); }); };
      var td = document.getElementById('tdel'); if (td) td.onclick = function () { if (!confirm('Delete test order ' + o.ref + ' and its files now?')) return; api('pbk-admin-delete', { ref: o.ref }).then(function () { all = all.filter(function (y) { return y.ref !== o.ref; }); drawList(); }, function (e) { alert(e.message); }); };
      document.getElementById('sb').onclick = function () { api('pbk-admin-status', { ref: o.ref, status: document.getElementById('ss').value, note: document.getElementById('sn').value, notify: document.getElementById('se').checked }).then(function (x) { all = all.map(function (y) { return y.ref === o.ref ? x.order : y; }); detail(o.ref); }, function (e) { alert(e.message); }); };
      (o.items || []).forEach(function (it) {
        var b = r.books[it.projectId], el = root.querySelector('[data-pid="' + it.projectId + '"]'); if (!b || !el) return;
        var msg = el.querySelector('[data-msg]');
        el.querySelectorAll('[data-old]').forEach(function (bt) { bt.onclick = function () {
          var v = b.earlier.filter(function (x) { return x.dir === bt.getAttribute('data-old'); })[0]; if (!v || !v.view.length) return alert('No preview pages were kept for that version.');
          var n = v.view.length - 2, tr = trim(b.book || {});
          PBKFlip.open({ title: it.name + ' · ' + (v.round ? 'correction ' + v.round : 'first version'), count: n, board: '#3b2f26', ratio: tr.h / tr.w, page: function (i) { var k = i === 0 ? 0 : i === n + 3 ? n + 1 : (i === 1 || i === n + 2) ? -1 : i - 1; if (k < 0 || !v.view[k]) return null; return file(v.view[k].path).then(function (bl) { return URL.createObjectURL(bl); }); } });
        }; });
        if (b.view[0]) file(b.view[0].path).then(function (bl) { el.querySelector('[data-cov]').src = URL.createObjectURL(bl); });
        var pv = el.querySelector('[data-prev]');
        if (pv) pv.onclick = function () {
          var n = b.view.length - 2;
          var tr = trim(b.book || {});
          PBKFlip.open({ title: it.name + ' · ' + o.ref, count: n, board: '#3b2f26', ratio: tr.h / tr.w, page: function (i) {
            var k = i === 0 ? 0 : i === n + 3 ? n + 1 : (i === 1 || i === n + 2) ? -1 : i - 1;
            if (k < 0 || !b.view[k]) return null; return file(b.view[k].path).then(function (bl) { return URL.createObjectURL(bl); });
          } });
        };
        var pg = el.querySelector('[data-pages]'), grid = el.querySelector('[data-grid]');
        if (pg) pg.onclick = function () {
          grid.hidden = !grid.hidden; if (grid.innerHTML) return;
          grid.innerHTML = b.print.map(function (f, i) { var v = b.view[i]; return '<button data-f="' + esc(f.path) + '" title="Download ' + esc(f.path.split('/').pop()) + '"><img data-v="' + esc(v ? v.path : '') + '" alt="">' + (i === 0 ? 'Cover' : i === b.print.length - 1 ? 'Back' : 'Page ' + i) + '</button>'; }).join('');
          grid.querySelectorAll('img[data-v]').forEach(function (im) { var p = im.getAttribute('data-v'); if (p) file(p).then(function (bl) { im.src = URL.createObjectURL(bl); }); });
          grid.querySelectorAll('[data-f]').forEach(function (bt) { bt.onclick = function () { var p = bt.getAttribute('data-f'); file(p).then(function (bl) { save(bl, o.ref + '-' + it.projectId + '-' + p.split('/').pop()); }); }; });
          /* the spine, always, whatever the page count (the printer decides whether it prints) */
          grid.insertAdjacentHTML('beforeend', '<button data-spine title="Download the spine as a PNG with a transparent background: just the words, the picture and CIEL AFRICA"><canvas data-spc width="40" height="300" style="height:120px;width:auto;margin:0 auto;display:block;background:repeating-conic-gradient(#e6e1d9 0 25%,#fff 0 50%) 0 0/10px 10px"></canvas>Spine (PNG, no background)</button>');
          var spb = grid.querySelector('[data-spine]');
          spineCanvas(b, it, true).then(function (c) { var t = spb.querySelector('canvas'); if (!c) { spb.innerHTML = 'No spine design'; return; } t.width = Math.max(4, Math.round(c.width * 300 / c.height)); t.height = 300; t.getContext('2d').drawImage(c, 0, 0, t.width, t.height); });
          spb.onclick = function () { spineCanvas(b, it, true).then(function (c) { if (!c) return; c.toBlob(function (bl) { save(bl, o.ref + '-' + it.projectId + '-spine-' + spineMm(it.pages) + 'mm.png'); }, 'image/png'); }); };
        };
        var pd = el.querySelector('[data-pdf]');
        if (pd) pd.onclick = function () {
          pd.disabled = true;
          loadPdfLib().then(function () {
            var L = window.PDFLib, mm = 72 / 25.4, tr = trim(b.book || {}), W = tr.w, H = tr.h, B = 3;
            return L.PDFDocument.create().then(function (doc) {
              doc.setTitle(it.name + ' ' + o.ref); doc.setCreator('Ciel Africa Photo Books');
              var i = 0;
              function next() {
                if (i >= b.print.length) return doc.save();
                msg.textContent = 'Adding page ' + (i + 1) + ' of ' + b.print.length + '…';
                return file(b.print[i].path).then(function (bl) { return bl.arrayBuffer(); }).then(function (buf) { return doc.embedJpg(buf); }).then(function (im) {
                  var p = doc.addPage([(W + 2 * B) * mm, (H + 2 * B) * mm]); p.drawImage(im, { x: 0, y: 0, width: (W + 2 * B) * mm, height: (H + 2 * B) * mm });
                  p.setTrimBox(B * mm, B * mm, W * mm, H * mm); p.setBleedBox(0, 0, (W + 2 * B) * mm, (H + 2 * B) * mm);
                  delete fileCache[b.print[i].path]; i++; return next();
                });
              }
              return next();
            });
          }).then(function (bytes) { pdfOut(new Blob([bytes], { type: 'application/pdf' }), o.ref + '-' + it.name.replace(/[^\w-]+/g, '-') + '-print.pdf', it.name + ' · print PDF', b.print.length + ' files · A4 with 3 mm bleed'); msg.textContent = ''; }, function (e) { msg.textContent = e.message; }).then(function () { pd.disabled = false; });
        };
        var wb = el.querySelector('[data-wrap]');
        if (wb) wb.onclick = function () {
          wb.disabled = true; msg.textContent = 'Making the full cover…';
          var bk = b.book || {}, tr = trim(bk), sp = spineMm(it.pages), cc = BOOK.cover || {}, R = window.PBKR;
          function im(bl) { return new Promise(function (ok, no) { var u = URL.createObjectURL(bl), x = new Image(); x.onload = function () { ok(x); }; x.onerror = no; x.src = u; }); }
          /* books sent before spine files were uploaded: the spine drawn here from its colour and words */
          function spineImg() {
            /* drawn fresh from the book's spine settings (the current spine layout); the uploaded spine file only if those are missing */
            var so = bk.spine || null;
            if (!so || !R) return b.spine && b.spine[0] ? file(b.spine[0].path).then(im) : Promise.resolve(null);
            if (so.artImg && !/^(\/assets\/|https:\/\/cielafrica\.com\/)/.test(so.artImg)) { so = Object.assign({}, so); delete so.artImg; }
            return Promise.all([R.loadFonts(), R.loadSpine(so)]).then(function () { var w = Math.max(8, Math.round(sp / 25.4 * 300)), h = Math.round((tr.h + 6) / 25.4 * 300), c = document.createElement('canvas'); c.width = w; c.height = h; var x = c.getContext('2d'), su = R.spineUnits(it.pages), bp = 3 / 25.4 * 300; x.fillStyle = so.bg || '#fff'; x.fillRect(0, 0, w, h); x.setTransform(w / su, 0, 0, (h - 2 * bp) / R.H, 0, bp); R.drawSpine(x, so, su); return c; });
          }
          Promise.all([file(b.print[0].path).then(im), file(b.print[b.print.length - 1].path).then(im), spineImg(), loadPdfLib()]).then(function (r) {
            var cv = R.caseCover(r[1], r[0], r[2], { trimW: tr.w, trimH: tr.h, bleedMm: 3, spineMm: sp, cover: cc, dpi: 300, maxPx: /iPhone|iPad|iPod|Android/.test(navigator.userAgent) ? 16e6 : 60e6 });
            return new Promise(function (ok) { cv.canvas.toBlob(ok, 'image/jpeg', 0.93); }).then(function (jb) { return jb.arrayBuffer(); }).then(function (buf) {
              var L = window.PDFLib, mm = 72 / 25.4;
              return L.PDFDocument.create().then(function (doc) {
                doc.setTitle(it.name + ' ' + o.ref + ' hardcover case'); doc.setCreator('Ciel Africa Photo Books');
                doc.setSubject('Case wrap ' + cv.widthMm + ' × ' + cv.heightMm + ' mm · spine ' + sp + ' mm · hinge ' + cv.hingeMm + ' mm each side · wrap ' + cv.wrapMm + ' mm · ' + cv.dpi + ' dpi');
                return doc.embedJpg(buf).then(function (img) {
                  var pg = doc.addPage([cv.widthMm * mm, cv.heightMm * mm]); pg.drawImage(img, { x: 0, y: 0, width: cv.widthMm * mm, height: cv.heightMm * mm });
                  /* page 2: the same cover with the folds marked, to check against (print page 1) */
                  var p2 = doc.addPage([cv.widthMm * mm, cv.heightMm * mm]); p2.drawImage(img, { x: 0, y: 0, width: cv.widthMm * mm, height: cv.heightMm * mm, opacity: 0.55 });
                  var wr = cv.wrapMm, hg = cv.hingeMm, tw = tr.w, Hh = cv.heightMm;
                  var xs = [[wr, 'wrap ' + wr], [wr + tw, 'back ' + tw], [wr + tw + hg, 'hinge ' + hg], [wr + tw + hg + sp, 'spine ' + sp], [wr + tw + 2 * hg + sp, 'hinge ' + hg], [wr + 2 * tw + 2 * hg + sp, 'front ' + tw]];
                  var red = L.rgb(0.85, 0.1, 0.1);
                  xs.forEach(function (x) { p2.drawLine({ start: { x: x[0] * mm, y: 0 }, end: { x: x[0] * mm, y: Hh * mm }, thickness: 0.6, color: red, dashArray: [4, 3] }); });
                  [wr, Hh - wr].forEach(function (y) { p2.drawLine({ start: { x: 0, y: y * mm }, end: { x: cv.widthMm * mm, y: y * mm }, thickness: 0.6, color: red, dashArray: [4, 3] }); });
                  return doc.embedFont(L.StandardFonts.HelveticaBold).then(function (font) {
                    var prev = 0; xs.forEach(function (x) { var mid = (prev + x[0]) / 2; p2.drawText(x[1] + ' mm', { x: mid * mm - 18, y: (Hh / 2) * mm, size: 7, font: font, color: red }); prev = x[0]; });
                    p2.drawText('wrap ' + wr + ' mm', { x: (cv.widthMm - wr / 2) * mm - 18, y: (Hh / 2) * mm, size: 7, font: font, color: red });
                    p2.drawText('Guide only: print page 1. Total ' + (Math.round(cv.widthMm * 10) / 10) + ' × ' + Hh + ' mm · spine ' + sp + ' mm for ' + it.pages + ' pages', { x: 12, y: 8, size: 8, font: font, color: red });
                    return doc.save();
                  });
                });
              });
            }).then(function (bytes) { pdfOut(new Blob([bytes], { type: 'application/pdf' }), o.ref + '-' + it.name.replace(/[^\w-]+/g, '-') + '-case-' + Math.round(cv.widthMm) + 'x' + Math.round(cv.heightMm) + 'mm-spine' + sp + 'mm.pdf', it.name + ' · full cover', (Math.round(cv.widthMm * 10) / 10) + ' × ' + cv.heightMm + ' mm · page 2 shows the folds');
              msg.innerHTML = 'Full cover: <b>' + (Math.round(cv.widthMm * 10) / 10) + ' × ' + cv.heightMm + ' mm</b>. Back ' + tr.w + ' · hinge ' + cv.hingeMm + ' · spine ' + sp + ' · hinge ' + cv.hingeMm + ' · front ' + tr.w + ' mm, with ' + cv.wrapMm + ' mm wrap all round (' + cv.dpi + ' dpi).'; });
          }).catch(function (e) { msg.textContent = e.message || 'Couldn’t make the cover.'; }).then(function () { wb.disabled = false; });
        };
      });
    }).catch(function (e) { if (e.status === 401) return login(); root.innerHTML = top() + '<p class="ao__msg">' + esc(e.message) + '</p>'; wireTop(); });
  }
  /** a PDF made here: shown first (pages drawn in the browser), with Download in the preview */
  function pdfOut(blob, name, title, note) {
    function go() { if (window.PBKPdfView) return window.PBKPdfView.open(blob, { name: name, title: title, note: note }); save(blob, name); }
    if (window.PBKPdfView) return go();
    var s = document.createElement('script'); s.src = '/assets/pbk/pdfview.js?v=1'; s.onload = go; s.onerror = function () { save(blob, name); }; document.head.appendChild(s);
  }
  /** the spine at 300 dpi: drawn from the book's spine settings, or the uploaded spine file */
  /** the spine at print size; clear = only the words, the picture and CIEL AFRICA on a transparent background */
  function spineCanvas(b, it, clear) {
    var bk = b.book || {}, tr = trim(bk), sp = spineMm(it.pages), R = window.PBKR, so = bk.spine || null;
    function fromFile() { if (!(b.spine && b.spine[0])) return Promise.resolve(null); return file(b.spine[0].path).then(function (bl) { return new Promise(function (ok) { var im = new Image(); im.onload = function () { var c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; c.getContext('2d').drawImage(im, 0, 0); ok(c); }; im.onerror = function () { ok(null); }; im.src = URL.createObjectURL(bl); }); }); }
    if (!so || !R) return fromFile();
    if (so.artImg && !/^(\/assets\/|https:\/\/cielafrica\.com\/)/.test(so.artImg)) { so = Object.assign({}, so); delete so.artImg; }
    return Promise.all([R.loadFonts(), R.loadSpine(so)]).then(function () { var w = Math.max(8, Math.round(sp / 25.4 * 300)), h = Math.round((tr.h + 6) / 25.4 * 300), c = document.createElement('canvas'); c.width = w; c.height = h; var x = c.getContext('2d'), su = R.spineUnits(it.pages), bp = 3 / 25.4 * 300; if (!clear) { x.fillStyle = so.bg || '#fff'; x.fillRect(0, 0, w, h); } x.setTransform(w / su, 0, 0, (h - 2 * bp) / R.H, 0, bp); R.drawSpine(x, clear ? Object.assign({}, so, { bg: 'rgba(0,0,0,0)' }) : so, su); return c; }).catch(clear ? function () { return null; } : fromFile);
  }
  /** a book's trim size (mm): from the files it sent; books before the A4 switch were 210 × 280 */
  function trim(bk) {
    if (bk && bk.trimW && bk.trimH) return { w: +bk.trimW, h: +bk.trimH };
    var m = bk && String(bk.size || '').match(/(\d+)\s*×\s*(\d+)/);
    if (m) return { w: +m[1], h: +m[2] };
    return { w: BOOK.trimW || 210, h: BOOK.trimH || 297 };
  }
  function spineMm(pages) { var c = BOOK.cover || {}, g = +c.paperGsm || 170, k = +c.paperBulk || 1, bd = c.boardMm == null ? 3 : +c.boardMm; return Math.round((g * k * Math.ceil((pages || 24) / 2) / 1000 + 2 * bd) * 10) / 10; }
  function loadPdfLib() { return window.PDFLib ? Promise.resolve() : new Promise(function (ok, no) { var s = document.createElement('script'); s.src = '/assets/vendor/pdf-lib-1.17.1.min.js'; s.onload = ok; s.onerror = no; document.head.appendChild(s); }); }
  start();
})();
