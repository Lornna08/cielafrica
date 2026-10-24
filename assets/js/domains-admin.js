/* CIEL DOMAINS — admin dashboard (/domains/admin). Auth is server-side (HttpOnly session cookie). */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var money = function (n) { return n == null ? '—' : 'KES ' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); };
  var dt = function (s) { if (!s) return '—'; var d = new Date(s); return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }); };
  var root = $('#adm');
  var MOVES = { awaiting_verification: ['unavailable', 'cancelled'], pending_payment: ['cancelled', 'unavailable'], pending_registration: ['registration_in_progress', 'registered', 'failed', 'unavailable'], registration_in_progress: ['registered', 'failed', 'unavailable', 'pending_registration'], failed: ['registration_in_progress', 'pending_registration'], unavailable: ['registration_in_progress'] };
  var FILTERS = [['all', 'All'], ['pending_payment', 'Pending payment / verification'], ['paid', 'Paid · to register'], ['in_progress', 'In progress'], ['registered', 'Registered'], ['failed', 'Failed / unavailable'], ['refund_pending', 'Refund pending'], ['refunded', 'Refunded']];
  var S = { tab: 'orders', filter: 'paid', q: '', orders: [], counts: {}, labels: {}, cur: null, caps: {}, ordering: false, config: null };

  function api(route, body, method) {
    return fetch('/api/domains/admin/' + route, { method: method || (body ? 'POST' : 'GET'), credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'ciel' }, body: body ? JSON.stringify(body) : undefined })
      .then(function (r) { return r.json().catch(function () { return { ok: false, error: 'Unexpected response (' + r.status + ')' }; }).then(function (j) { j.__s = r.status; return j; }); })
      .catch(function () { return { ok: false, error: 'Network error.' }; });
  }
  function toast(msg, bad) { var t = document.createElement('div'); t.className = 'adm-toast' + (bad ? ' bad' : ''); t.textContent = msg; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 3800); }

  /* ---------- sign in ---------- */
  function login(msg) {
    root.innerHTML = '<div class="adm-login"><form id="lg" class="adm-card"><span class="eyebrow" style="margin:0"><span class="brk">‹</span> Ciel Domains</span><h1>Admin sign in</h1><div class="fld"><label for="pw">Password</label><input id="pw" type="password" autocomplete="current-password" required></div><button class="btn btn--p" type="submit">Sign in</button><p class="adm-err" id="lgE">' + esc(msg || '') + '</p></form></div>';
    $('#pw').focus();
    $('#lg').addEventListener('submit', function (e) {
      e.preventDefault();
      api('login', { password: $('#pw').value }).then(function (j) { if (j.ok) boot(); else $('#lgE').textContent = j.error || 'Sign-in failed.'; });
    });
  }
  function boot() {
    api('session').then(function (j) {
      if (!j.signedIn) return login(j.caps && !j.caps.adminPassword ? 'ADMIN_PASSWORD is not set in Vercel yet — add it under Settings → Environment Variables and redeploy.' : '');
      S.caps = j.caps; S.ordering = j.ordering; S.registrar = j.registrar;
      shell(); go(location.hash.slice(1));
    });
  }

  /* ---------- shell ---------- */
  function shell() {
    root.innerHTML = '<header class="adm-top"><div class="adm-top__in"><b><span class="brk">‹</span> Ciel Domains · Admin</b><nav class="adm-tabs"><button data-tab="orders">Orders</button><button data-tab="pricing">Pricing &amp; settings</button><button data-tab="setup">Setup</button></nav><span class="adm-mode" id="mode"></span><button class="btn btn--ghost btn--sm" id="out">Sign out</button></div></header><main class="adm-main" id="view"></main>';
    $('#out').addEventListener('click', function () { api('logout', {}).then(function () { login('Signed out.'); }); });
    $$('[data-tab]').forEach(function (b) { b.addEventListener('click', function () { S.tab = b.dataset.tab; S.cur = null; render(); }); });
    mode();
  }
  function mode() { var m = $('#mode'); if (!m) return; m.className = 'adm-mode ' + (S.ordering ? 'on' : ''); m.textContent = S.ordering ? 'Taking orders & payments' : 'Requests only (payments off)'; }
  function go(ref) { if (/^CD-/.test(ref)) { S.tab = 'orders'; S.filter = 'all'; open(ref); } render(); }
  function render() {
    $$('[data-tab]').forEach(function (b) { b.classList.toggle('on', b.dataset.tab === S.tab); });
    if (S.tab === 'orders') return orders();
    if (S.tab === 'pricing') return pricing();
    return setup();
  }

  /* ---------- orders ---------- */
  function orders() {
    var v = $('#view');
    if (!S.caps.durable) { v.innerHTML = '<div class="adm-card"><h2>Connect the orders database first</h2><p>Orders can’t be stored until Upstash Redis is connected. See the Setup tab.</p></div>'; return; }
    v.innerHTML = '<div class="adm-bar"><div class="adm-filters" id="flt"></div><div class="adm-tools"><input id="srch" type="search" placeholder="Search ref, domain, email…" value="' + esc(S.q) + '"><a class="btn btn--ghost btn--sm" id="csv" href="/api/domains/admin/export?filter=' + S.filter + '">Export CSV</a><button class="btn btn--ghost btn--sm" id="purge" title="Delete unpaid orders older than 30 days">Clean up</button></div></div><div class="adm-split"><div class="adm-card adm-list" id="list"><p>Loading…</p></div><div id="det"></div></div>';
    $('#srch').addEventListener('input', function () { S.q = this.value.trim().toLowerCase(); table(); });
    $('#purge').addEventListener('click', function () { if (!confirm('Delete unpaid orders older than 30 days? Paid orders are kept.')) return; api('purge', {}).then(function (j) { toast(j.ok ? 'Removed ' + j.deleted + ' old unpaid order(s).' : j.error, !j.ok); load(); }); });
    load();
    if (S.cur) detail();
  }
  function load() {
    api('orders?filter=' + encodeURIComponent(S.filter)).then(function (j) {
      if (j.__s === 401) return login('Session expired — sign in again.');
      if (!j.ok) { $('#list').innerHTML = '<p class="adm-err">' + esc(j.error) + '</p>'; return; }
      S.orders = j.orders; S.counts = j.counts; S.labels = j.labels; filters(); table();
    });
  }
  function filters() {
    $('#flt').innerHTML = FILTERS.map(function (f) { return '<button data-f="' + f[0] + '" class="' + (S.filter === f[0] ? 'on' : '') + '">' + f[1] + ' <span>' + (S.counts[f[0]] || 0) + '</span></button>'; }).join('');
    $$('#flt [data-f]').forEach(function (b) { b.addEventListener('click', function () { S.filter = b.dataset.f; $('#csv').href = '/api/domains/admin/export?filter=' + S.filter; load(); filters(); }); });
  }
  function table() {
    var rows = S.orders.filter(function (o) { if (!S.q) return true; return (o.ref + ' ' + o.domain + ' ' + o.customer.email + ' ' + o.customer.name + ' ' + o.customer.phone).toLowerCase().indexOf(S.q) > -1; });
    if (!rows.length) { $('#list').innerHTML = '<p class="adm-empty">No orders here.</p>'; return; }
    $('#list').innerHTML = '<table class="adm-t"><thead><tr><th>Order</th><th>Domain</th><th>Customer</th><th>Amount</th><th>Payment</th><th>Status</th><th>Refund</th><th>Ordered</th><th>Updated</th></tr></thead><tbody>' + rows.map(function (o) {
      return '<tr data-ref="' + esc(o.ref) + '"' + (S.cur === o.ref ? ' class="on"' : '') + '><td><b>' + esc(o.ref) + '</b></td><td>' + esc(o.domain) + '<small>' + o.years + ' yr · .' + esc(o.tld) + '</small></td><td>' + esc(o.customer.name) + '<small>' + esc(o.customer.email) + '</small></td><td>' + money(o.amount) + '</td><td><span class="adm-chip ' + o.payment.status + '">' + esc(o.payment.status) + '</span></td><td><span class="adm-chip st-' + o.status + '">' + esc(S.labels[o.status] || o.status) + '</span>' + (o.verification.status === 'recheck_before_registering' ? '<small>recheck before registering</small>' : '') + '</td><td>' + (o.refund.status === 'none' ? '—' : esc(o.refund.status)) + '</td><td>' + dt(o.createdAt) + '</td><td>' + dt(o.updatedAt) + '</td></tr>';
    }).join('') + '</tbody></table>';
    $$('#list tr[data-ref]').forEach(function (tr) { tr.addEventListener('click', function () { open(tr.dataset.ref); }); });
  }
  function open(ref) { S.cur = ref; try { history.replaceState(null, '', '#' + ref); } catch (e) { /* */ } detail(); $$('#list tr').forEach(function (tr) { tr.classList.toggle('on', tr.dataset.ref === ref); }); }

  function detail() {
    var box = $('#det'); if (!box) return;
    box.innerHTML = '<div class="adm-card"><p>Loading ' + esc(S.cur) + '…</p></div>';
    api('order?ref=' + encodeURIComponent(S.cur)).then(function (j) { if (!j.ok) { box.innerHTML = '<div class="adm-card adm-err">' + esc(j.error) + '</div>'; return; } paintDetail(j); });
  }
  function act(action, data, okMsg) {
    return api('action', { ref: S.cur, action: action, data: data || {} }).then(function (j) {
      if (!j.ok) { toast(j.error || 'Action failed.', true); return null; }
      toast(okMsg || 'Saved.'); paintDetail({ order: j.order, audit: j.audit, link: S.link }); load(); return j;
    });
  }
  function kv(pairs) { return '<dl class="adm-kv">' + pairs.map(function (p) { return '<dt>' + p[0] + '</dt><dd>' + (p[1] == null || p[1] === '' ? '—' : p[1]) + '</dd>'; }).join('') + '</dl>'; }
  function paintDetail(j) {
    var o = j.order, L = S.labels, paid = o.payment.status === 'paid', c = o.customer; S.link = j.link || S.link;
    var av = o.availability || {}, last = av.last || {}, at = av.atOrder || {};
    var moves = (MOVES[o.status] || []);
    var h = '<div class="adm-card adm-det"><div class="adm-det__h"><div><small>' + esc(o.ref) + '</small><h2>' + esc(o.domain) + '</h2><span class="adm-chip st-' + o.status + '">' + esc(L[o.status] || o.status) + '</span> <span class="adm-chip ' + o.payment.status + '">payment: ' + esc(o.payment.status) + '</span></div><button class="adm-x" id="dx" aria-label="Close">×</button></div>';
    if (o.payment.attempts.some(function (a) { return a.status === 'duplicate_paid'; })) h += '<p class="adm-alert">This order was paid twice. Refund the extra payment (see attempts below) and note it here.</p>';
    h += sec('Customer', kv([['Name', esc(c.name)], ['Organisation', esc(c.organisation)], ['Email', '<a href="mailto:' + esc(c.email) + '">' + esc(c.email) + '</a>'], ['Phone', '<a href="tel:+' + esc(c.phone) + '">' + esc(c.phone) + '</a>'], ['Address', esc(c.address) + ', ' + esc(c.city) + ', ' + esc(c.country)], ['Customer note', esc(c.notes)], ['Order link', S.link ? '<button class="adm-link" id="cpl">Copy private order link</button>' : '—']]));
    h += sec('Order', kv([['Term', o.years + ' year(s)'], ['Total', money(o.amount) + (o.quote && o.quote.tax ? ' (incl. ' + money(o.quote.tax) + ' ' + esc(o.quote.tax_label) + ')' : '')], ['First year / renewal', money(o.quote && o.quote.firstYear) + ' / ' + money(o.quote && o.quote.renewal)], ['Ordered', dt(o.createdAt)], ['Updated', dt(o.updatedAt)], ['Terms accepted', esc(o.consent && o.consent.termsVersion) + ' · ' + dt(o.consent && o.consent.agreedAt)]]));
    h += sec('Availability', kv([['At order', esc(at.state) + ' · ' + esc(at.sourceName || '') + ' · ' + dt(at.checkedAt)], ['Last check', esc(last.state) + ' · ' + esc(last.sourceName || '') + ' · ' + dt(last.checkedAt)]]) + '<div class="adm-row"><button class="btn btn--dark btn--sm" id="rc">Recheck now</button><button class="btn btn--ghost btn--sm" id="th">Copy name &amp; open Truehost ↗</button></div>');
    h += sec('Verification', kv([['Status', esc(o.verification.status)], ['Reasons', esc((o.verification.reasons || []).join(', '))], ['Note', esc(o.verification.note)]]) +
      (o.priceChange ? '<p class="adm-note">Price change proposed: ' + money(o.priceChange.from) + ' → ' + money(o.priceChange.to) + ' · ' + (o.priceChange.accepted ? 'accepted' : o.priceChange.declined ? 'declined' : 'waiting for customer') + '</p>' : '') +
      '<div class="adm-form"><input id="vAmt" type="number" min="1" placeholder="Confirmed total KES (blank = keep ' + esc(o.amount == null ? 'none' : o.amount) + ')"><input id="vNote" type="text" placeholder="Note, e.g. checked on Truehost, standard price"><button class="btn btn--dark btn--sm" id="vGo">Mark verified</button></div>');
    h += sec('Payment', kv([['Status', esc(o.payment.status)], ['Method', esc(o.payment.method)], ['Paid at', dt(o.payment.paidAt)], ['Amount paid', money(o.payment.amount)], ['Receipt / ref', esc(o.payment.receipt || o.payment.reference)]]) +
      (o.payment.attempts.length ? '<ul class="adm-att">' + o.payment.attempts.map(function (a) { return '<li><b>' + esc(a.method) + '</b> ' + esc(a.id) + ' · ' + money(a.amount) + ' · <span class="adm-chip ' + esc(a.status) + '">' + esc(a.status) + '</span> · ' + dt(a.startedAt) + (a.receipt ? ' · ' + esc(a.receipt) : '') + (a.result ? ' · ' + esc(a.result) : '') + '</li>'; }).join('') + '</ul>' : ''));
    h += sec('Registration (Truehost)', kv([['Truehost ref', esc(o.registration.truehostRef)], ['Nameservers', esc((o.registration.nameservers || []).join(', '))], ['Registered', dt(o.registration.registeredAt)], ['Expires', esc(o.registration.expiresAt)], ['Failure reason', esc(o.registration.failureReason)]]) +
      '<div class="adm-form"><input id="thRef" type="text" placeholder="Truehost order / transaction ref" value="' + esc(o.registration.truehostRef) + '"><input id="thNs" type="text" placeholder="Nameservers (comma separated)" value="' + esc((o.registration.nameservers || []).join(', ')) + '"><input id="thExp" type="date" value="' + esc(o.registration.expiresAt || '') + '"><input id="thNotes" type="text" placeholder="Setup notes" value="' + esc(o.registration.setupNotes || '') + '"><button class="btn btn--ghost btn--sm" id="thSave">Save details</button></div>' +
      (moves.length ? '<div class="adm-form"><select id="mv">' + moves.map(function (m) { return '<option value="' + m + '">' + esc(L[m] || m) + '</option>'; }).join('') + '</select><input id="mvWhy" type="text" placeholder="Reason (shown to customer for failed / unavailable)"><label class="adm-cb"><input type="checkbox" id="mvRc"> I rechecked availability on Truehost</label><button class="btn btn--p btn--sm" id="mvGo">Update status</button></div><p class="adm-hint">The customer is emailed automatically for: in progress, registered, failed, unavailable. “Registered” needs the Truehost ref.</p>' : ''));
    if (paid && (o.status === 'failed' || o.status === 'unavailable')) h += sec('Offer an alternative', (o.proposal ? '<p class="adm-note">Proposed ' + esc(o.proposal.domain) + ' · ' + esc(o.proposal.decided || 'waiting for customer') + '</p>' : '') + '<div class="adm-form"><input id="alt" type="text" placeholder="e.g. zurihomes.africa"><button class="btn btn--dark btn--sm" id="altGo">Send to customer (same price)</button></div>');
    if (paid) h += sec('Refund', kv([['Status', esc(o.refund.status)], ['Amount', money(o.refund.amount)], ['Method', esc(o.refund.method)], ['Provider ref', esc(o.refund.providerRef)], ['Completed', dt(o.refund.completedAt)]]) +
      (o.status !== 'refund_pending' && o.status !== 'refunded' ? '<div class="adm-form"><input id="rfAmt" type="number" min="1" placeholder="Amount (blank = full ' + esc(o.payment.amount) + ')"><input id="rfNote" type="text" placeholder="Note"><label class="adm-cb"><input type="checkbox" id="rfOv"> Override (refund from another status)</label><button class="btn btn--dark btn--sm" id="rfGo">' + (o.payment.method === 'card' ? 'Refund via Paystack' : 'Start M-Pesa refund') + '</button></div>' + (o.payment.method !== 'card' ? '<p class="adm-hint">M-Pesa refunds are sent by you (e.g. from the M-Pesa business portal). After sending, record the transaction code below.</p>' : '') : '') +
      (o.status === 'refund_pending' ? '<div class="adm-form"><input id="rfRef" type="text" placeholder="' + (o.refund.method === 'card' ? 'Paystack refund id (optional)' : 'M-Pesa transaction code of the refund') + '"><button class="btn btn--p btn--sm" id="rfDone">Record refund completed</button><input id="rfWhy" type="text" placeholder="Why it failed"><button class="btn btn--ghost btn--sm" id="rfFail">Mark refund failed</button></div>' : ''));
    h += sec('Notes (internal)', (o.notes.length ? '<ul class="adm-notes">' + o.notes.map(function (n) { return '<li><small>' + dt(n.at) + '</small>' + esc(n.text) + '</li>'; }).join('') + '</ul>' : '') + '<div class="adm-form"><input id="nt" type="text" placeholder="Add a note"><button class="btn btn--ghost btn--sm" id="ntGo">Add note</button></div>');
    h += sec('Emails', '<div class="adm-form"><select id="rs"><option value="received">Order received</option><option value="verified">Verified — ready to pay</option><option value="price_change">Price change</option><option value="payment_confirmed">Payment confirmed</option><option value="in_progress">Registration in progress</option><option value="registered">Registered</option><option value="unavailable">Unavailable</option><option value="alternative">Alternative offered</option><option value="refund_initiated">Refund started</option><option value="refund_completed">Refund completed</option></select><button class="btn btn--ghost btn--sm" id="rsGo">Resend to customer</button></div>');
    h += sec('History', '<ol class="adm-audit">' + (j.audit || []).map(function (a) { return '<li><small>' + dt(a.at) + ' · ' + esc(a.actor) + '</small><b>' + esc(a.action) + '</b>' + (a.detail ? '<code>' + esc(JSON.stringify(a.detail)) + '</code>' : '') + '</li>'; }).join('') + '</ol>');
    h += '</div>';
    $('#det').innerHTML = h;
    var on = function (id, fn) { var e = $('#' + id); if (e) e.addEventListener('click', fn); };
    on('dx', function () { S.cur = null; $('#det').innerHTML = ''; try { history.replaceState(null, '', location.pathname); } catch (e) { /* */ } $$('#list tr').forEach(function (tr) { tr.classList.remove('on'); }); });
    on('cpl', function () { navigator.clipboard.writeText(S.link).then(function () { toast('Order link copied.'); }); });
    on('rc', function () { act('recheck', {}, 'Rechecked.'); });
    on('th', function () { try { navigator.clipboard.writeText(o.domain); } catch (e) { /* */ } window.open('https://truehost.co.ke/domain-registration/', '_blank', 'noopener'); });
    on('vGo', function () { act('mark_verified', { amount: $('#vAmt').value, note: $('#vNote').value }, 'Marked verified — customer emailed.'); });
    on('thSave', function () { act('record_registration', { truehostRef: $('#thRef').value, nameservers: $('#thNs').value, expiresAt: $('#thExp').value, setupNotes: $('#thNotes').value }); });
    on('mvGo', function () { var to = $('#mv').value; if (to === 'registered' && !$('#thRef').value.trim()) { toast('Add the Truehost ref first.', true); return; } if ((to === 'registered' || to === 'unavailable' || to === 'failed') && !confirm('Set “' + (L[to] || to) + '” and email the customer?')) return; act('set_status', { status: to, reason: $('#mvWhy').value, rechecked: $('#mvRc').checked, truehostRef: $('#thRef') ? $('#thRef').value : '', expiresAt: $('#thExp') ? $('#thExp').value : '' }, 'Status updated.'); });
    on('altGo', function () { act('propose_alternative', { domain: $('#alt').value }, 'Alternative sent to customer.'); });
    on('rfGo', function () { if (!confirm('Start the refund and email the customer?')) return; act('refund_start', { amount: $('#rfAmt').value, note: $('#rfNote').value, override: $('#rfOv').checked }, 'Refund started.'); });
    on('rfDone', function () { act('refund_complete', { providerRef: $('#rfRef').value }, 'Refund recorded — customer emailed.'); });
    on('rfFail', function () { act('refund_failed', { reason: $('#rfWhy').value }, 'Refund marked failed.'); });
    on('ntGo', function () { act('note', { text: $('#nt').value }, 'Note added.'); });
    on('rsGo', function () { act('resend', { kind: $('#rs').value }, 'Email sent.'); });
  }
  function sec(title, body) { return '<section class="adm-sec"><h3>' + title + '</h3>' + body + '</section>'; }

  /* ---------- pricing & settings ---------- */
  function pricing() {
    var v = $('#view'); v.innerHTML = '<div class="adm-card"><p>Loading…</p></div>';
    api('config').then(function (j) {
      if (!j.ok) { v.innerHTML = '<div class="adm-card adm-err">' + esc(j.error) + '</div>'; return; }
      S.config = j.config; S.caps = j.caps; S.ordering = j.ordering; mode();
      var st = j.config.settings;
      var rows = j.config.tlds.map(function (t) {
        return '<tr data-t="' + esc(t.tld) + '"><td><input type="checkbox" data-k="enabled"' + (t.enabled ? ' checked' : '') + ' aria-label="Enable .' + esc(t.tld) + '"></td><td><b>.' + esc(t.tld) + '</b><small>' + esc(t.category) + '</small></td>' +
          '<td><input type="number" min="0" data-k="register" value="' + (t.register == null ? '' : t.register) + '" placeholder="on request"></td><td><input type="number" min="0" data-k="renew" value="' + (t.renew == null ? '' : t.renew) + '" placeholder="on request"></td>' +
          '<td><input type="text" data-k="periods" value="' + esc(t.periods.join(',')) + '" style="width:6.5rem"></td><td><input type="checkbox" data-k="verifyBeforePayment"' + (t.verifyBeforePayment ? ' checked' : '') + ' aria-label="Verify before payment"></td>' +
          '<td><select data-k="method">' + ['rdap', 'dns', 'manual'].map(function (m) { return '<option' + (t.method === m ? ' selected' : '') + (m === 'rdap' && !t.rdap ? ' disabled' : '') + '>' + m + '</option>'; }).join('') + '</select><small>' + esc(t.source) + '</small></td>' +
          '<td><select data-k="truehost">' + ['listed', 'confirmed', 'unconfirmed'].map(function (m) { return '<option' + (t.truehost === m ? ' selected' : '') + '>' + m + '</option>'; }).join('') + '</select></td><td><input type="text" data-k="note" value="' + esc(t.note) + '" placeholder="Shown on the page"></td></tr>';
      }).join('');
      v.innerHTML = '<div class="adm-card"><h2>Selling</h2><div class="adm-set">' +
        '<label class="adm-cb big"><input type="checkbox" id="sOrd"' + (st.orderingEnabled ? ' checked' : '') + '> Accept orders &amp; payments online</label><p class="adm-hint">Off = customers can only send requests; nothing is charged. Turn on after the database, admin password and a small real M-Pesa test are done.' + (!S.caps.durable ? ' <b>Needs the orders database.</b>' : '') + '</p>' +
        '<label class="adm-cb"><input type="checkbox" id="sMp"' + (st.paymentMethods.mpesa ? ' checked' : '') + '> M-Pesa ' + (S.caps.mpesa ? '(keys found)' : '(MPESA_* keys missing)') + '</label>' +
        '<label class="adm-cb"><input type="checkbox" id="sCd"' + (st.paymentMethods.card ? ' checked' : '') + '> Card via Paystack ' + (S.caps.card ? '(key found)' : '(PAYSTACK_SECRET_KEY missing — hidden from customers)') + '</label>' +
        '<div class="adm-form"><label>Tax rate % <input id="sTax" type="number" min="0" max="50" step="0.01" value="' + Math.round(st.taxRate * 10000) / 100 + '"></label><label>Label <input id="sTaxL" type="text" value="' + esc(st.taxLabel) + '" style="width:6rem"></label><label class="adm-cb"><input type="checkbox" id="sInc"' + (st.pricesIncludeTax ? ' checked' : '') + '> Prices include tax</label></div>' +
        '<div class="adm-form"><label>Support email <input id="sEm" type="email" value="' + esc(st.supportEmail) + '"></label><label>Phone <input id="sPh" type="text" value="' + esc(st.supportPhone) + '"></label><label>WhatsApp (digits) <input id="sWa" type="text" value="' + esc(st.whatsapp) + '"></label></div></div></div>' +
        '<div class="adm-card"><h2>Extensions &amp; prices (KES)</h2><p class="adm-hint">Defaults are indicative starting points above Truehost’s public prices — set your own. Blank price = “on request” (always verified before payment). Registration for N years = first year + renewal × (N−1).</p><div class="adm-scroll"><table class="adm-t adm-pt"><thead><tr><th>On</th><th>Extension</th><th>First year</th><th>Renewal / yr</th><th>Terms (yrs)</th><th>Verify first</th><th>Check method</th><th>Truehost</th><th>Note</th></tr></thead><tbody>' + rows + '</tbody></table></div><div class="adm-row"><button class="btn btn--p" id="saveCfg">Save pricing &amp; settings</button>' + (j.config.updatedAt ? '<small>Last saved ' + dt(j.config.updatedAt) + '</small>' : '') + '</div></div>';
      $('#saveCfg').addEventListener('click', saveCfg);
    });
  }
  function saveCfg() {
    var patch = { tlds: {}, settings: {} };
    $$('.adm-pt tbody tr').forEach(function (tr) {
      var t = tr.dataset.t, p = {};
      $$('[data-k]', tr).forEach(function (el) {
        var k = el.dataset.k;
        if (el.type === 'checkbox') p[k] = el.checked;
        else if (k === 'periods') p[k] = el.value.split(/[\s,]+/).map(Number).filter(Boolean);
        else if (k === 'register' || k === 'renew') p[k] = el.value === '' ? null : Number(el.value);
        else p[k] = el.value;
      });
      patch.tlds[t] = p;
    });
    patch.settings = { orderingEnabled: $('#sOrd').checked, paymentMethods: { mpesa: $('#sMp').checked, card: $('#sCd').checked }, taxRate: Number($('#sTax').value || 0) / 100, taxLabel: $('#sTaxL').value, pricesIncludeTax: $('#sInc').checked, supportEmail: $('#sEm').value, supportPhone: $('#sPh').value, whatsapp: $('#sWa').value.replace(/\D/g, '') };
    if (patch.settings.orderingEnabled && !S.config.settings.orderingEnabled && !confirm('Turn on online orders and payments? Customers will be charged real money.')) return;
    api('config', { patch: patch }).then(function (j) { if (!j.ok) return toast(j.error, true); toast('Saved. The public page updates within a minute.'); api('session').then(function (s) { S.ordering = s.ordering; mode(); pricing(); }); });
  }

  /* ---------- setup ---------- */
  function setup() {
    var c = S.caps, row = function (ok, title, how) { return '<li class="' + (ok ? 'ok' : 'todo') + '"><b>' + (ok ? '✓ ' : '○ ') + title + '</b><span>' + how + '</span></li>'; };
    $('#view').innerHTML = '<div class="adm-card"><h2>Setup status</h2><ul class="adm-check">' +
      row(c.durable, 'Orders database (Upstash Redis)', c.durable ? 'Connected.' : 'Vercel → your project → Storage → Create / Connect → Upstash for Redis (free plan) → connect to this project. Vercel adds KV_REST_API_URL and KV_REST_API_TOKEN; redeploy.') +
      row(c.adminPassword, 'Admin password', 'ADMIN_PASSWORD environment variable — used to sign in here (server-checked).') +
      row(c.secret, 'Signing secret', c.secret ? 'Present (from DOMAINS_SECRET or derived from ADMIN_PASSWORD).' : 'Set DOMAINS_SECRET to a long random string.') +
      row(c.mpesa, 'M-Pesa (Daraja)', 'Reuses MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_SHORTCODE, MPESA_PASSKEY, MPESA_TILL, MPESA_ENV. Callback: https://cielafrica.com/api/domains/mpesa-callback (set per payment automatically).') +
      row(c.card, 'Card payments (optional)', 'PAYSTACK_SECRET_KEY (use sk_test_… first). In Paystack → Settings → API, set the webhook URL to https://cielafrica.com/api/domains/paystack-webhook.') +
      row(c.email, 'Email (Resend)', 'Reuses RESEND_API_KEY, MAIL_FROM and MAIL_TO. Customer and team notifications are sent from MAIL_FROM.') +
      '</ul><p class="adm-hint">Registrar: <b>' + esc(S.registrar || 'manual-truehost') + '</b> — registrations are done by hand on Truehost and recorded here. A registrar API can be added later without changing the storefront (lib/domains/registrar.js).</p></div>';
  }

  boot();
})();
