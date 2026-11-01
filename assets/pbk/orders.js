/* ============================================================
   CIEL AFRICA PHOTO BOOKS — orders inbox (/photobooks/orders)
   Sign in with ADMIN_PASSWORD. Lists paid orders, the customer's
   details, a flip-through preview of each book as they saw it, and
   the print files: every page at 300 dpi with 3 mm bleed, or one
   print-ready PDF (trim 210 × 280 mm, TrimBox/BleedBox set).
   ============================================================ */
(function () {
  'use strict';
  var root = document.getElementById('ao'), CFG = (window.CIEL && CIEL.photobooks) || {}, BOOK = CFG.book || {};
  var LABEL = { awaiting_payment: 'Awaiting payment', payment_failed: 'Payment failed', paid: 'Paid', preparing: 'Waiting for pages', ready: 'Pages received', printing: 'Printing', ready_collection: 'Ready for collection', dispatched: 'Dispatched', delivered: 'Delivered', cancelled: 'Cancelled', refunded: 'Refunded' };
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
  function top(extra) { return '<div class="ao__top"><img src="/assets/img/logo-dark.png?v=20261021i" alt="Ciel Africa"><h1>Photo Book orders</h1>' + (extra || '') + '<button class="btn btn--ghost btn--sm" id="lo">Sign out</button></div>'; }
  function admin(on) { try { if (on) localStorage.setItem('pbk_admin', '1'); else localStorage.removeItem('pbk_admin'); } catch (e) { } }
  function wireTop() { var lo = document.getElementById('lo'); if (lo) lo.onclick = function () { admin(false); api('admin-logout', {}).then(login); }; }
  function list() {
    admin(true);
    root.innerHTML = top('<button class="btn btn--ghost btn--sm" id="rf">Refresh</button>') + '<p class="ao__msg">Loading orders…</p>'; wireTop();
    api('pbk-admin-orders').then(function (r) {
      if (!r.storage) { root.innerHTML = top() + '<div class="ao__card"><p class="ao__msg">Order storage is not connected to this deployment yet.</p></div>'; wireTop(); return; }
      all = r.orders; drawList();
    }).catch(function (e) { if (e.status === 401) return login(); root.innerHTML = top() + '<p class="ao__msg">' + esc(e.message) + '</p>'; wireTop(); });
  }
  function drawList() {
    var q = filt.q.toLowerCase(), l = all.filter(function (o) { return (!filt.s || o.status === filt.s) && (!q || (o.ref + ' ' + o.customer.name + ' ' + o.customer.phone + ' ' + o.customer.email).toLowerCase().indexOf(q) >= 0); });
    var paidOnly = all.filter(function (o) { return o.paidAt && !o.test; });
    root.innerHTML = top('<button class="btn btn--ghost btn--sm" id="rf">Refresh</button>') +
      '<div class="ao__bar"><input id="aq" type="search" placeholder="Search order, name, phone, email" value="' + esc(filt.q) + '"><select id="as"><option value="">All statuses</option>' + Object.keys(LABEL).map(function (k) { return '<option value="' + k + '"' + (filt.s === k ? ' selected' : '') + '>' + LABEL[k] + '</option>'; }).join('') + '</select></div>' +
      '<div class="ao__card ao__tip"><b>Try a real order for KES ' + (BOOK.testPrice || 5) + '</b><span>On this browser, open <a href="/photobooks/someone" target="_blank" rel="noopener">Photo Books → Someone</a> and pick <b>Ciel Test</b> (only you see it while signed in here). Add a few photos, tap <b>Order</b>, pay with M-Pesa, keep the page open while the pages send, then refresh this list. Test orders are marked TEST and deleted automatically after 24 hours.</span></div>' +
      '<p class="ao__msg">' + paidOnly.length + ' paid order' + (paidOnly.length === 1 ? '' : 's') + ' · ' + money(paidOnly.reduce(function (s, o) { return s + (o.total || 0); }, 0)) + '</p>' +
      '<div class="ao__list">' + (l.length ? l.map(function (o) {
        var prints = (o.items || []).filter(function (i) { return i.product === 'print'; }).length;
        return '<button class="ao__row' + (o.test ? ' is-test' : '') + '" data-ref="' + esc(o.ref) + '"><span><b>' + esc(o.ref) + '</b>' + (o.test ? ' <i class="ao__test">TEST</i>' : '') + '<small>' + when(o.createdAt) + '</small></span><span>' + esc(o.customer.name) + '<small>' + esc(o.customer.phone) + (o.gift ? ' · 🎁 gift' : '') + '</small></span>' +
          '<span>' + (o.items || []).map(function (i) { return esc(i.name) + ' · ' + (i.product === 'print' ? 'Print ×' + i.qty : 'PDF') + ' · ' + i.pages + 'p'; }).join('<br>') + (prints ? '<small>' + (o.files ? Object.keys(o.files).length : 0) + '/' + prints + ' print files received</small>' : '') + '</span><span><b>' + money(o.total) + '</b></span><span>' + badge(o.status) + '</span></button>';
      }).join('') : '<p class="ao__msg">No orders yet.</p>') + '</div>';
    wireTop(); document.getElementById('rf').onclick = list;
    var aq = document.getElementById('aq'); aq.oninput = function () { filt.q = aq.value; var pos = aq.selectionStart; drawList(); var n = document.getElementById('aq'); n.focus(); n.setSelectionRange(pos, pos); };
    document.getElementById('as').onchange = function () { filt.s = this.value; drawList(); };
    root.querySelectorAll('[data-ref]').forEach(function (b) { b.onclick = function () { detail(b.getAttribute('data-ref')); }; });
  }
  function detail(ref) {
    root.innerHTML = top() + '<button class="ao__back" id="bk">‹ All orders</button><p class="ao__msg">Loading ' + esc(ref) + '…</p>'; wireTop();
    document.getElementById('bk').onclick = drawList;
    api('pbk-admin-order', undefined, '&ref=' + encodeURIComponent(ref)).then(function (r) {
      var o = r.order, a = o.address, g = o.gift;
      root.innerHTML = top() + '<button class="ao__back" id="bk">‹ All orders</button><div class="ao__det"><div class="ao__card"><h2>' + esc(o.ref) + ' ' + badge(o.status) + (o.test ? ' <i class="ao__test">TEST</i>' : '') + '</h2>' + (o.test ? '<p class="ao__msg">Test order: don’t print. Deleted automatically ' + when((o.createdAt || 0) + 864e5) + '. <button class="btn btn--ghost btn--sm" id="tdel">Delete now</button></p>' : '') + '<dl>' +
        '<dt>Placed</dt><dd>' + when(o.createdAt) + '</dd><dt>Paid</dt><dd>' + (o.paidAt ? when(o.paidAt) : 'Not paid') + '</dd><dt>Total</dt><dd><b>' + money(o.total) + '</b></dd>' +
        '<dt>Customer</dt><dd>' + esc(o.customer.name) + '<br><a href="tel:+' + esc(o.customer.phone) + '">+' + esc(o.customer.phone) + '</a><br><a href="mailto:' + esc(o.customer.email) + '">' + esc(o.customer.email) + '</a></dd>' +
        (o.delivery ? '<dt>Delivery</dt><dd>' + esc(o.delivery.name) + '</dd>' : '') + (a ? '<dt>Address</dt><dd>' + esc([a.line1, a.area, a.town, a.county].filter(Boolean).join(', ')) + (a.notes ? '<br><i>' + esc(a.notes) + '</i>' : '') + '</dd>' : '') +
        (g ? '<dt>Gift</dt><dd>🎁 For ' + esc(g.to || '—') + (g.phone ? ' · ' + esc(g.phone) : '') + (g.note ? '<br>“' + esc(g.note) + '”' : '') + '</dd>' : '') +
        '<dt>Lines</dt><dd>' + (o.lines || []).map(function (l) { return esc(l.label) + (l.qty > 1 ? ' × ' + l.qty : '') + ' — ' + money(l.amount * (l.qty || 1)); }).join('<br>') + '</dd></dl>' +
        '<h2 style="margin-top:1.2rem">Status</h2><div class="ao__acts"><select id="ss">' + SET.map(function (k) { return '<option value="' + k + '"' + (o.status === k ? ' selected' : '') + '>' + LABEL[k] + '</option>'; }).join('') + '</select></div><textarea id="sn" rows="2" placeholder="Note (optional)" style="margin-top:.4rem"></textarea><button class="btn btn--dark btn--sm" id="sb" style="margin-top:.4rem">Update status</button>' +
        '<ul class="ao__hist">' + (o.history || []).slice().reverse().map(function (h) { return '<li><b>' + esc(LABEL[h.status] || h.status) + '</b> · ' + when(h.at) + (h.note ? ' — ' + esc(h.note) : '') + '</li>'; }).join('') + '</ul></div>' +
        '<div class="ao__card"><h2>Books</h2>' + (o.items || []).map(function (it) {
          var b = r.books[it.projectId] || { print: [], view: [] }, bk = b.book || {};
          return '<div class="ao__book" data-pid="' + esc(it.projectId) + '"><img data-cov alt=""><div><b>' + esc(it.name) + '</b><span class="ao__msg">' + (it.product === 'print' ? 'Printed hardcover × ' + it.qty : 'Print-ready PDF (customer downloads it)') + ' · ' + it.pages + ' pages · ' + esc(BOOK.size || '21 × 28 cm') + '</span>' +
            (it.product === 'print' ? '<span class="ao__msg">' + b.print.length + ' of ' + (it.pages + 2) + ' print files received' + (bk.spine ? ' · Spine: “' + esc(bk.spine.title || '') + '” on ' + esc(bk.spine.bg || '') : '') + '</span>' : '') +
            (b.view.length ? '<div class="ao__acts"><button class="btn btn--p btn--sm" data-prev>Preview book</button>' + (b.print.length ? '<button class="btn btn--dark btn--sm" data-pdf>Download print PDF</button><button class="btn btn--ghost btn--sm" data-pages>Show pages</button>' : '') + '</div><div class="ao__pages" data-grid hidden></div><span class="ao__msg" data-msg></span>' : (it.product === 'print' ? '<span class="ao__msg">The pages haven’t arrived yet. They send from the customer’s device after payment.</span>' : '')) + '</div></div>';
        }).join('') + '<p class="ao__msg">Print files: 000 = front cover, then the pages in order, last = back cover. Each page is ' + ((BOOK.trimW || 210) + 6) + ' × ' + ((BOOK.trimH || 280) + 6) + ' mm (3 mm bleed) at 300 dpi; the PDF’s TrimBox is ' + (BOOK.trimW || 210) + ' × ' + (BOOK.trimH || 280) + ' mm.</p></div></div>';
      wireTop(); document.getElementById('bk').onclick = drawList;
      var td = document.getElementById('tdel'); if (td) td.onclick = function () { if (!confirm('Delete test order ' + o.ref + ' and its files now?')) return; api('pbk-admin-delete', { ref: o.ref }).then(function () { all = all.filter(function (y) { return y.ref !== o.ref; }); drawList(); }, function (e) { alert(e.message); }); };
      document.getElementById('sb').onclick = function () { api('pbk-admin-status', { ref: o.ref, status: document.getElementById('ss').value, note: document.getElementById('sn').value }).then(function (x) { all = all.map(function (y) { return y.ref === o.ref ? x.order : y; }); detail(o.ref); }, function (e) { alert(e.message); }); };
      (o.items || []).forEach(function (it) {
        var b = r.books[it.projectId], el = root.querySelector('[data-pid="' + it.projectId + '"]'); if (!b || !el) return;
        var msg = el.querySelector('[data-msg]');
        if (b.view[0]) file(b.view[0].path).then(function (bl) { el.querySelector('[data-cov]').src = URL.createObjectURL(bl); });
        var pv = el.querySelector('[data-prev]');
        if (pv) pv.onclick = function () {
          var n = b.view.length - 2;
          PBKFlip.open({ title: it.name + ' · ' + o.ref, count: n, board: '#3b2f26', page: function (i) {
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
        };
        var pd = el.querySelector('[data-pdf]');
        if (pd) pd.onclick = function () {
          pd.disabled = true;
          loadPdfLib().then(function () {
            var L = window.PDFLib, mm = 72 / 25.4, W = (BOOK.trimW || 210), H = (BOOK.trimH || 280), B = 3;
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
          }).then(function (bytes) { save(new Blob([bytes], { type: 'application/pdf' }), o.ref + '-' + it.name.replace(/[^\w-]+/g, '-') + '-print.pdf'); msg.textContent = 'Downloaded.'; }, function (e) { msg.textContent = e.message; }).then(function () { pd.disabled = false; });
        };
      });
    }).catch(function (e) { if (e.status === 401) return login(); root.innerHTML = top() + '<p class="ao__msg">' + esc(e.message) + '</p>'; wireTop(); });
  }
  function loadPdfLib() { return window.PDFLib ? Promise.resolve() : new Promise(function (ok, no) { var s = document.createElement('script'); s.src = '/assets/vendor/pdf-lib-1.17.1.min.js'; s.onload = ok; s.onerror = no; document.head.appendChild(s); }); }
  start();
})();
