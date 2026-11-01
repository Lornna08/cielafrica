/* ============================================================
   CIEL PHOTO BOOKS — admin
   Sign-in uses ADMIN_PASSWORD (same session as the Domains admin).
   Orders come from /api/photobooks; configuration (formats, prices,
   delivery, templates) is published to data/photobooks.js through the
   existing /api/save GitHub publisher.
   ============================================================ */
(function () {
  'use strict';
  var root = document.getElementById('ad'), E = window.PBE, CFG = JSON.parse(JSON.stringify((window.CIEL && CIEL.photobooks) || {}));
  var st = { tab: 'orders', me: null, orders: [], statuses: {}, adminStatuses: [], f: { status: '', product: '', q: '', from: '', to: '' }, open: null };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function money(n, c) { return (c || CFG.currency || 'KES') + ' ' + Number(n || 0).toLocaleString('en-KE'); }
  function when(t) { return t ? new Date(t).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''; }
  var tt; function toast(m, err) { var t = document.getElementById('toast'); t.textContent = m; t.className = 'st-toast on' + (err ? ' st-toast--err' : ''); clearTimeout(tt); tt = setTimeout(function () { t.className = 'st-toast'; }, 4000); }
  function api(route, body, raw) {
    return fetch('/api/photobooks?route=' + route, { method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', headers: Object.assign({ 'X-Requested-With': 'ciel' }, body !== undefined ? { 'Content-Type': 'application/json' } : {}), body: body === undefined ? undefined : JSON.stringify(body) })
      .then(function (r) { if (raw) { if (!r.ok) return r.json().then(function (j) { throw new Error(j.error || 'Failed'); }); return r; } return r.json().catch(function () { return { ok: false, error: 'Unexpected response' }; }).then(function (j) { if (!r.ok || j.ok === false) { var e = new Error(j.error || 'Request failed'); e.status = r.status; throw e; } return j; }); });
  }

  function start() {
    api('admin-me').then(function (m) { st.me = m; if (!m.signedIn) return login(); document.getElementById('who').innerHTML = '<button class="btn btn--sm btn--ghost" id="out">Sign out</button>'; document.getElementById('out').onclick = function () { api('admin-logout', {}).then(function () { location.reload(); }); }; draw(); })
      .catch(function () { root.innerHTML = '<div class="ad-card"><h2>Admin unavailable</h2><p>The Photo Books server didn’t respond. Check the deployment.</p></div>'; });
  }
  function login() {
    root.innerHTML = '<form class="ad-card ad-login" id="lf"><h2>Photo Books admin</h2>' + (st.me && st.me.setup && !st.me.setup.adminPassword ? '<p class="muted">Set ADMIN_PASSWORD in Vercel → Settings → Environment Variables, then redeploy.</p>' : '') + '<label class="fld"><span>Admin password</span><input type="password" id="pw" autocomplete="current-password" required></label><button class="btn btn--p btn--block">Sign in</button><p class="muted" id="le" style="margin-top:10px"></p></form>';
    document.getElementById('lf').onsubmit = function (e) { e.preventDefault(); api('admin-login', { password: document.getElementById('pw').value }).then(start).catch(function (er) { document.getElementById('le').textContent = er.message; }); };
  }
  function draw() {
    root.innerHTML = '<h1>Photo Books</h1><div class="ad-tabs">' + [['orders', 'Orders'], ['config', 'Formats & pricing'], ['templates', 'Templates'], ['setup', 'Setup checklist']].map(function (t) { return '<button data-tab="' + t[0] + '" class="' + (st.tab === t[0] ? 'on' : '') + '">' + t[1] + '</button>'; }).join('') + '</div><div id="pane"></div>';
    root.querySelectorAll('[data-tab]').forEach(function (b) { b.onclick = function () { st.tab = b.getAttribute('data-tab'); draw(); }; });
    ({ orders: orders, config: config, templates: templates, setup: setup })[st.tab]();
  }

  /* ---------------- setup ---------------- */
  function missingPrices() {
    var m = [];
    (CFG.formats || []).forEach(function (f) {
      if (f.enabled === false) return;
      if (typeof (f.digital || {}).base !== 'number') m.push(f.name + ' ' + f.size + ': digital price');
      if (f.print && f.print.enabled) Object.keys(f.print.bindings || {}).forEach(function (k) { if (typeof f.print.bindings[k].base !== 'number') m.push(f.name + ': ' + k + ' print price'); });
    });
    if ((CFG.formats || []).some(function (f) { return f.print && f.print.enabled; })) { (CFG.papers || []).forEach(function (p) { if (p.enabled !== false && typeof p.perPage !== 'number') m.push('Paper ' + p.name + ': price per page'); }); (CFG.delivery || []).forEach(function (d) { if (d.enabled !== false && typeof d.price !== 'number') m.push('Delivery ' + d.name + ': price'); }); }
    return m;
  }
  function setup() {
    var s = (st.me && st.me.setup) || {}, miss = missingPrices();
    var rows = [
      [s.payments, 'M-Pesa (Daraja) keys', 'Already set (MPESA_*). Needed to take payments.'],
      [s.adminPassword, 'ADMIN_PASSWORD', 'Protects this admin.'],
      [s.publish, 'GITHUB_TOKEN', 'Lets “Publish” below save formats and prices to data/photobooks.js (same as the main admin).'],
      [s.email, 'RESEND_API_KEY', 'Order emails to you and to customers.'],
      [s.orders, 'Order storage (Upstash Redis: KV_REST_API_URL / KV_REST_API_TOKEN)', 'Required for printed orders (order records + approved print files) and for the orders list. Add it free from Vercel → Storage → Upstash Redis. Without it, digital PDFs still sell and you get an email per sale.'],
      [!miss.length, 'Prices', miss.length ? 'Not set yet: ' + miss.join('; ') + '. Customers can design and preview, but can’t buy until prices are set.' : 'All enabled products are priced.'],
      [s.ai, 'AI suggestions (optional): ANTHROPIC_API_KEY or OPENAI_API_KEY', 'Without it, the studio uses built-in suggestions based only on the customer’s words.']
    ];
    document.getElementById('pane').innerHTML = '<div class="ad-card"><h2>Setup checklist</h2><ul class="ad-ck">' + rows.map(function (r) { return '<li class="' + (r[0] ? 'y' : 'n') + '"><b>' + (r[0] ? '✓' : '!') + '</b><span>' + esc(r[1]) + '<small>' + esc(r[2]) + '</small></span></li>'; }).join('') + '</ul></div><div class="ad-card"><h2>Printed books</h2><p class="muted">Turn on printing per format in “Formats & pricing” only after your printer confirms the exact trim size, bleed, binding, paper and spine thickness. Print orders also need order storage (above).</p></div>';
  }

  /* ---------------- orders ---------------- */
  function orders() {
    var p = document.getElementById('pane');
    p.innerHTML = '<div class="ad-card"><div class="ad-filters"><select id="fs"><option value="">All statuses</option></select><select id="fp"><option value="">All products</option><option value="digital">Digital PDF</option><option value="print">Printed</option></select><input id="ff" type="date" aria-label="From"><input id="ft" type="date" aria-label="To"><input id="fq" placeholder="Search ref, name, email, phone"><button class="btn btn--sm btn--dark" id="fgo">Filter</button></div><div id="olist"><div class="st-loading">Loading orders…</div></div></div><div id="odet"></div>';
    var q = Object.keys(st.f).filter(function (k) { return st.f[k]; }).map(function (k) { return k + '=' + encodeURIComponent(st.f[k]); }).join('&');
    api('admin-orders' + (q ? '&' + q : '')).then(function (r) {
      st.orders = r.orders; st.statuses = r.statuses || {}; st.adminStatuses = r.adminStatuses || [];
      var fs = document.getElementById('fs'); Object.keys(st.statuses).forEach(function (k) { fs.insertAdjacentHTML('beforeend', '<option value="' + k + '"' + (st.f.status === k ? ' selected' : '') + '>' + esc(st.statuses[k]) + '</option>'); });
      document.getElementById('fp').value = st.f.product; document.getElementById('fq').value = st.f.q; document.getElementById('ff').value = st.f.from; document.getElementById('ft').value = st.f.to;
      var el = document.getElementById('olist');
      if (!r.durable) { el.innerHTML = '<p class="ad-miss">Order storage isn’t set up, so orders can’t be listed here. Each paid order is still emailed to you. Add Upstash Redis in Vercel → Storage to keep order records and accept printed orders.</p>'; return; }
      el.innerHTML = r.orders.length ? '<div class="ad-tw"><table class="ad-t"><thead><tr><th>Order</th><th>Date</th><th>Product</th><th>Customer</th><th>Total</th><th>Status</th><th>Files</th></tr></thead><tbody>' + r.orders.map(function (o) { return '<tr data-ref="' + o.ref + '"><td><b>' + esc(o.ref) + '</b></td><td>' + when(o.createdAt) + '</td><td>' + (o.product === 'print' ? 'Printed' : 'Digital PDF') + '<br><small class="muted">' + esc(o.specs.formatId + ' · ' + o.specs.pages + 'p' + (o.specs.quantity > 1 ? ' × ' + o.specs.quantity : '')) + '</small></td><td>' + esc(o.customer.name) + '<br><small class="muted">' + esc(o.customer.phone) + '</small></td><td>' + money(o.total, o.currency) + '</td><td><span class="pill pill--' + o.status + '">' + esc(st.statuses[o.status] || o.status) + '</span></td><td>' + (o.product === 'print' ? ['interior', 'cover'].map(function (f) { return o.files && o.files[f] && o.files[f].complete ? f + ' ✓' : f + ' –'; }).join('<br>') : '—') + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<p class="muted">No orders match.</p>';
      el.onclick = function (e) { var tr = e.target.closest('[data-ref]'); if (tr) detail(tr.getAttribute('data-ref')); };
    }).catch(function (e) { document.getElementById('olist').innerHTML = '<p class="ad-miss">' + esc(e.message) + '</p>'; });
    document.getElementById('fgo').onclick = function () { st.f = { status: document.getElementById('fs').value, product: document.getElementById('fp').value, q: document.getElementById('fq').value.trim(), from: document.getElementById('ff').value, to: document.getElementById('ft').value }; orders(); };
  }
  function detail(ref) {
    var o = st.orders.filter(function (x) { return x.ref === ref; })[0]; if (!o) return;
    var d = document.getElementById('odet'), a = o.delivery && o.delivery.address;
    d.innerHTML = '<div class="ad-card"><h2>' + esc(o.ref) + ' <span class="pill pill--' + o.status + '">' + esc(st.statuses[o.status] || o.status) + '</span></h2><div class="ad-od"><dl>' +
      '<dt>Product</dt><dd>' + (o.product === 'print' ? 'Printed book' : 'Digital PDF') + '</dd>' + o.lines.map(function (l) { return '<dt>Item</dt><dd>' + esc(l.label) + (l.qty > 1 ? ' × ' + l.qty : '') + ' — ' + money(l.amount * (l.qty || 1)) + '</dd>'; }).join('') + '<dt>Total</dt><dd><b>' + money(o.total, o.currency) + '</b></dd>' +
      '<dt>Customer</dt><dd>' + esc(o.customer.name) + '<br><a href="mailto:' + esc(o.customer.email) + '">' + esc(o.customer.email) + '</a><br><a href="tel:+' + esc(o.customer.phone) + '">+' + esc(o.customer.phone) + '</a></dd>' +
      (o.delivery ? '<dt>Delivery</dt><dd>' + esc(o.delivery.name) + (a ? '<br>' + esc([a.line1, a.area, a.town, a.county].filter(Boolean).join(', ')) + (a.notes ? '<br><i>' + esc(a.notes) + '</i>' : '') : '') + '</dd>' : '') +
      (o.notes ? '<dt>Notes</dt><dd>' + esc(o.notes) + '</dd>' : '') + '<dt>Design version</dt><dd><code style="font-size:11px">' + esc(o.designHash.slice(0, 16)) + '…</code></dd><dt>M-Pesa request</dt><dd><code style="font-size:11px">' + esc(o.cr || '') + '</code></dd></dl>' +
      '<div><h3 style="font-size:15px;margin-bottom:8px">History</h3><ul class="ad-hist">' + (o.history || []).map(function (h) { return '<li><b>' + esc(st.statuses[h.status] || h.status) + '</b> · ' + when(h.at) + (h.note ? '<br><small class="muted">' + esc(h.note) + '</small>' : '') + '</li>'; }).join('') + '</ul>' +
      (o.product === 'print' ? '<h3 style="font-size:15px;margin:16px 0 8px">Approved print files</h3>' + ['interior', 'cover'].map(function (f) { var m = o.files && o.files[f]; return '<p>' + (m && m.complete ? '<button class="btn btn--sm btn--dark" data-dl="' + f + '">Download ' + f + ' PDF (' + (m.size > 1048576 ? (m.size / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(m.size / 1024)) + ' KB') + ')</button>' : '<span class="muted">' + f + ': ' + (m && m.deleted ? 'deleted ' + when(m.deleted) : 'not received yet (the customer’s browser sends it after payment)') + '</span>') + '</p>'; }).join('') + '<p id="dlp" class="muted"></p>' + (o.files && (o.files.interior || o.files.cover) ? '<button class="btn btn--sm btn--ghost btn--warn" id="fdel">Delete print files</button>' : '') : '') + '</div></div>' +
      '<h3 style="font-size:15px;margin:18px 0 8px">Update status</h3><div class="ad-filters"><select id="ns">' + st.adminStatuses.map(function (s) { return '<option value="' + s + '">' + esc(st.statuses[s]) + '</option>'; }).join('') + '</select><input id="nn" placeholder="Note (required for refunds: M-Pesa reversal reference)" style="flex:1;min-width:220px"><label style="display:flex;gap:6px;align-items:center;font-size:13px"><input type="checkbox" id="npub"> Show note to customer</label><label style="display:flex;gap:6px;align-items:center;font-size:13px"><input type="checkbox" id="nmail" checked> Email customer</label><button class="btn btn--sm btn--p" id="nsave">Save</button></div><p class="muted" style="font-size:12.5px">Only mark printed or dispatched when that has actually happened. Refunds are made in M-Pesa (reversal) and recorded here.</p></div>';
    d.scrollIntoView({ behavior: 'smooth' });
    d.querySelectorAll('[data-dl]').forEach(function (b) { b.onclick = function () { download(o, b.getAttribute('data-dl')); }; });
    var del = document.getElementById('fdel'); if (del) del.onclick = function () { if (!confirm('Delete the stored print files for ' + o.ref + '? Do this after printing.')) return; api('admin-file-delete', { ref: o.ref }).then(function () { toast('Files deleted'); orders(); }); };
    document.getElementById('nsave').onclick = function () { api('admin-status', { ref: o.ref, status: document.getElementById('ns').value, note: document.getElementById('nn').value, public: document.getElementById('npub').checked, notify: document.getElementById('nmail').checked }).then(function () { toast('Status updated'); orders(); }).catch(function (e) { toast(e.message, true); }); };
  }
  function download(o, file) {
    var m = o.files[file], parts = [], i = 0, p = document.getElementById('dlp');
    function next() {
      if (i >= m.chunks) {
        var blob = new Blob(parts, { type: 'application/pdf' });
        return blob.arrayBuffer().then(function (b) { return crypto.subtle.digest('SHA-256', b); }).then(function (h) {
          var hx = Array.prototype.map.call(new Uint8Array(h), function (x) { return (x < 16 ? '0' : '') + x.toString(16); }).join('');
          if (hx !== m.sha256) throw new Error('Checksum mismatch — try again.');
          var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = o.ref + '-' + file + '.pdf'; document.body.appendChild(a); a.click(); a.remove();
          p.textContent = file + ' downloaded and verified.';
        });
      }
      p.textContent = 'Downloading ' + file + '… ' + Math.round(i / m.chunks * 100) + '%';
      return api('admin-file&ref=' + o.ref + '&file=' + file + '&i=' + i, undefined, true).then(function (r) { return r.arrayBuffer(); }).then(function (b) { parts.push(b); i++; return next(); });
    }
    next().catch(function (e) { p.textContent = e.message; });
  }

  /* ---------------- configuration ---------------- */
  function num(v) { return v === '' || v == null ? null : Math.max(0, Math.round(Number(v))); }
  function inp(path, v) { return '<input type="number" min="0" step="1" data-p="' + path + '" value="' + (typeof v === 'number' ? v : '') + '" class="' + (typeof v === 'number' ? '' : 'miss') + '" placeholder="not set">'; }
  function config() {
    var miss = missingPrices();
    var h = (miss.length ? '<div class="ad-miss"><b>Prices not set:</b> ' + esc(miss.join('; ')) + '</div>' : '') +
      '<div class="ad-card ad-cfg"><h2>Formats</h2><p class="muted" style="margin-bottom:10px">Digital price = base + (pages − included pages) × per extra page. Leave empty for “not set” — that product can’t be bought.</p><div class="ad-tw"><table><thead><tr><th>Format</th><th>On</th><th>Pages (min–max)</th><th>Digital base</th><th>Included pages</th><th>Per extra page</th><th>Print on</th></tr></thead><tbody>' +
      CFG.formats.map(function (f, i) { return '<tr><td><b>' + esc(f.name) + '</b><br><small class="muted">' + esc(f.size) + ' · bleed ' + f.bleed + ' mm · safe ' + f.safe + ' mm</small></td><td><input type="checkbox" data-b="formats.' + i + '.enabled"' + (f.enabled !== false ? ' checked' : '') + '></td><td>' + f.pages.min + '–' + f.pages.max + '</td><td>' + inp('formats.' + i + '.digital.base', f.digital.base) + '</td><td>' + inp('formats.' + i + '.digital.includedPages', f.digital.includedPages) + '</td><td>' + inp('formats.' + i + '.digital.perExtraPage', f.digital.perExtraPage) + '</td><td><input type="checkbox" data-b="formats.' + i + '.print.enabled"' + (f.print && f.print.enabled ? ' checked' : '') + '></td></tr>'; }).join('') + '</tbody></table></div></div>' +
      '<div class="ad-card ad-cfg"><h2>Printed book prices (per copy)</h2><p class="muted" style="margin-bottom:10px">Used only for formats with printing turned on. Unit price = base + (pages − included) × per extra page, plus paper × pages.</p><div class="ad-tw"><table><thead><tr><th>Format</th><th>Binding</th><th>Base</th><th>Included pages</th><th>Per extra page</th></tr></thead><tbody>' +
      CFG.formats.map(function (f, i) { return Object.keys((f.print || {}).bindings || {}).map(function (k) { var b = f.print.bindings[k]; return '<tr><td>' + esc(f.name + ' ' + f.size) + '</td><td>' + esc((CFG.bindings[k] || {}).name || k) + '</td><td>' + inp('formats.' + i + '.print.bindings.' + k + '.base', b.base) + '</td><td>' + inp('formats.' + i + '.print.bindings.' + k + '.includedPages', b.includedPages) + '</td><td>' + inp('formats.' + i + '.print.bindings.' + k + '.perExtraPage', b.perExtraPage) + '</td></tr>'; }).join(''); }).join('') + '</tbody></table></div>' +
      '<h3 style="font-size:15px;margin:16px 0 8px">Paper</h3><table><thead><tr><th>Paper</th><th>On</th><th>Price per page</th><th>Thickness per page (mm, for spine)</th></tr></thead><tbody>' + CFG.papers.map(function (p, i) { return '<tr><td>' + esc(p.name) + '</td><td><input type="checkbox" data-b="papers.' + i + '.enabled"' + (p.enabled !== false ? ' checked' : '') + '></td><td>' + inp('papers.' + i + '.perPage', p.perPage) + '</td><td><input type="number" step="0.01" min="0" data-f="papers.' + i + '.mmPerPage" value="' + p.mmPerPage + '"></td></tr>'; }).join('') + '</tbody></table>' +
      '<h3 style="font-size:15px;margin:16px 0 8px">Delivery in Kenya</h3><table><thead><tr><th>Option</th><th>On</th><th>Price</th><th>Needs address</th></tr></thead><tbody>' + CFG.delivery.map(function (d, i) { return '<tr><td><input type="text" data-s="delivery.' + i + '.name" value="' + esc(d.name) + '"></td><td><input type="checkbox" data-b="delivery.' + i + '.enabled"' + (d.enabled !== false ? ' checked' : '') + '></td><td>' + inp('delivery.' + i + '.price', d.price) + '</td><td><input type="checkbox" data-b="delivery.' + i + '.needsAddress"' + (d.needsAddress ? ' checked' : '') + '></td></tr>'; }).join('') + '</tbody></table></div>';
    document.getElementById('pane').innerHTML = h + publishBar();
    bindCfg();
  }
  function templates() {
    document.getElementById('pane').innerHTML = '<div class="ad-card ad-cfg"><h2>Templates</h2><p class="muted" style="margin-bottom:10px">Names, descriptions and visibility. Artwork and layouts are in assets/js/pb/.</p><div class="ad-tw"><table><thead><tr><th>Visible</th><th>Name</th><th>Description</th><th>Category</th></tr></thead><tbody>' + CFG.templates.map(function (t, i) { return '<tr><td><input type="checkbox" data-b="templates.' + i + '.visible"' + (t.visible !== false ? ' checked' : '') + '></td><td><input type="text" data-s="templates.' + i + '.name" value="' + esc(t.name) + '"></td><td><input type="text" data-s="templates.' + i + '.desc" value="' + esc(t.desc) + '"></td><td><select data-s="templates.' + i + '.category">' + CFG.categories.map(function (c) { return '<option value="' + c.id + '"' + (c.id === t.category ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('') + '</select></td></tr>'; }).join('') + '</tbody></table></div></div>' + publishBar();
    bindCfg();
  }
  function setPath(path, v) { var k = path.split('.'), o = CFG; for (var i = 0; i < k.length - 1; i++) o = o[k[i]]; o[k[k.length - 1]] = v; }
  function bindCfg() {
    var p = document.getElementById('pane');
    p.addEventListener('change', function (e) {
      var t = e.target;
      if (t.hasAttribute('data-p')) { setPath(t.getAttribute('data-p'), num(t.value)); t.classList.toggle('miss', t.value === ''); }
      if (t.hasAttribute('data-f')) setPath(t.getAttribute('data-f'), Math.max(0, Number(t.value) || 0));
      if (t.hasAttribute('data-b')) setPath(t.getAttribute('data-b'), t.checked);
      if (t.hasAttribute('data-s')) setPath(t.getAttribute('data-s'), t.value.trim());
      document.getElementById('dirty').textContent = 'Unsaved changes';
    });
    document.getElementById('pub').onclick = publish;
    document.getElementById('dlc').onclick = function () { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([fileText()], { type: 'text/javascript' })); a.download = 'photobooks.js'; a.click(); };
  }
  function publishBar() { return '<div class="ad-bar"><span class="muted" id="dirty" style="align-self:center;margin-right:auto"></span><button class="btn btn--ghost" id="dlc">Download photobooks.js</button><button class="btn btn--p" id="pub">Publish to the website</button></div>'; }
  function fileText() {
    var head = '/* ============================================================\n   CIEL AFRICA — Photo Books configuration (published from /photobooks/admin)\n   Prices: null = not set (that product cannot be bought).\n   Turn print on for a format only after your printer confirms the spec.\n   ============================================================ */\n';
    return head + '(function (root) {\n  var PB = ' + JSON.stringify(CFG, null, 2).replace(/\n/g, '\n  ') + ';\n  if (typeof module === \'object\' && module.exports) module.exports = PB;\n  else { root.CIEL = root.CIEL || {}; root.CIEL.photobooks = PB; }\n})(typeof self !== \'undefined\' ? self : this);\n';
  }
  function publish() {
    var bad = []; CFG.formats.forEach(function (f) { if (f.print && f.print.enabled && f.enabled === false) bad.push(f.name); });
    var pw = prompt('Enter the admin password to publish (it is sent only to /api/save):'); if (!pw) return;
    fetch('/api/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw, file: 'photobooks.js', content: fileText(), message: 'Photo Books: update formats and pricing' }) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok || !j.ok) throw new Error(j.error || 'Publish failed'); return j; }); })
      .then(function () { document.getElementById('dirty').textContent = 'Published — live after the deploy finishes (about a minute).'; toast('Published'); })
      .catch(function (e) { toast(e.message, true); });
  }
  start();
})();
