/* ============================================================
   C-Ledger — application shell, router, search, notifications
   ============================================================ */
(function () {
  'use strict';
  var CL = window.CL, I = CL.icon, esc = CL.esc, f = CL.fmt, st = CL.store;
  CL.pages = CL.pages || {};

  var NAV = [
    ['Menu', [['overview', 'Overview', 'overview'], ['ledger', 'Ledger', 'ledger'], ['journals', 'Journal Entries', 'journal'], ['accounts', 'Chart of Accounts', 'coa'], ['banking', 'Banking', 'bank'], ['invoices', 'Invoices', 'invoice'], ['bills', 'Bills & Payables', 'bill'], ['expenses', 'Expenses', 'expense'], ['customers', 'Customers', 'customers'], ['suppliers', 'Suppliers', 'suppliers'], ['reports', 'Financial Reports', 'reports'], ['reconciliation', 'Reconciliation', 'recon']]],
    ['General', [['team', 'Team', 'team'], ['settings', 'Settings', 'settings']]]
  ];
  var ROUTES = [
    [/^overview$/, 'overview'], [/^ledger$/, 'ledger'], [/^journals$/, 'journals'], [/^journal\/([\w-]+)$/, 'journal'], [/^accounts$/, 'accounts'], [/^account\/([\w-]+)$/, 'account'],
    [/^banking$/, 'banking'], [/^banking\/([\w-]+)$/, 'bankAccount'], [/^invoices$/, 'invoices'], [/^invoice\/([\w-]+)$/, 'invoice'], [/^bills$/, 'bills'], [/^bill\/([\w-]+)$/, 'bill'],
    [/^expenses$/, 'expenses'], [/^customers$/, 'customers'], [/^customer\/([\w-]+)$/, 'customer'], [/^suppliers$/, 'suppliers'], [/^supplier\/([\w-]+)$/, 'supplier'],
    [/^reports$/, 'reports'], [/^reports\/([\w-]+)$/, 'report'], [/^reconciliation$/, 'reconciliation'], [/^reconciliation\/([\w-]+)$/, 'rec'], [/^team$/, 'team'], [/^team\/([\w-]+)$/, 'team'], [/^settings$/, 'settings'], [/^settings\/([\w-]+)$/, 'settings']
  ];
  var NAV_OF = { journal: 'journals', account: 'accounts', bankAccount: 'banking', invoice: 'invoices', bill: 'bills', customer: 'customers', supplier: 'suppliers', report: 'reports', rec: 'reconciliation' };
  var TITLES = { overview: 'Overview', ledger: 'General ledger', journals: 'Journal entries', journal: 'Journal entry', accounts: 'Chart of accounts', account: 'Account', banking: 'Banking', bankAccount: 'Bank account', invoices: 'Invoices', invoice: 'Invoice', bills: 'Bills & payables', bill: 'Bill', expenses: 'Expenses', customers: 'Customers', customer: 'Customer', suppliers: 'Suppliers', supplier: 'Supplier', reports: 'Financial reports', report: 'Report', reconciliation: 'Reconciliation', rec: 'Reconciliation', team: 'Team', settings: 'Settings' };
  var current = { name: null, params: [] };
  CL.current = function () { return current; };

  /* ---------- shell ---------- */
  function shell() {
    var me = st.me(), co = st.S.settings.company;
    document.body.innerHTML =
      '<div class="demo-bar" role="region" aria-label="Demo notice"><a class="db-back" href="../index.html"><b>‹</b><span> Ciel Africa</span></a><span class="db-msg"><i class="db-dot" aria-hidden="true"></i><span class="db-long">You’re exploring the <b>C-Ledger demo</b>. Changes affect sample data only.</span><span class="db-short"><b>C-Ledger demo</b> · sample data only</span></span><span class="db-a"><button class="db-btn" data-act="reset">Reset demo</button><a class="db-btn db-hide" href="./#features">View features</a><a class="db-btn db-btn--p" href="../quote.html?template=C-Ledger">Get C-Ledger</a></span></div>' +
      '<div class="app" id="app">' +
      '<aside class="side" id="side" aria-label="Main navigation"><div class="side__in">' +
        '<div class="side__brand"><a class="brand" href="#/overview" aria-label="C-Ledger overview"><span class="brand__m">' + I('leaf', 18) + '</span><span class="brand__w">C-Ledger</span></a><button class="ib side__col" data-act="collapse" aria-label="Collapse sidebar">' + I('panel', 17) + '</button></div>' +
        NAV.map(function (g) { return '<div class="side__g"><span class="side__h">' + g[0] + '</span>' + g[1].map(function (n) { return '<a class="side__a" href="#/' + n[0] + '" data-nav="' + n[0] + '" title="' + n[1] + '">' + I(n[2], 18) + '<span>' + n[1] + '</span><i class="side__b" data-badge="' + n[0] + '"></i></a>'; }).join('') + '</div>'; }).join('') +
        '<div class="side__card" id="sideCard"></div>' +
      '</div></aside>' +
      '<div class="main">' +
        '<header class="top">' +
          '<button class="ib top__menu" data-act="drawer" aria-label="Open navigation">' + I('menu', 20) + '</button>' +
          '<button class="co" data-act="company" aria-label="Switch company"><span class="co__m">' + esc(co.initials) + '</span><span class="co__t"><b><span class="co__f">' + esc(co.name) + '</span><span class="co__s">' + esc(co.short || co.name) + '</span></b><em>' + esc(st.E.fyOf(st.today()).label) + ' · ' + esc(st.S.settings.currency) + '</em></span>' + I('down', 15) + '</button>' +
          '<button class="srch" data-act="search" aria-label="Search">' + I('search', 17) + '<span class="srch__l">Search accounts, entries, invoices…</span><span class="srch__s">Search</span><kbd>Ctrl K</kbd></button>' +
          '<div class="top__a">' +
            '<button class="ib top__s" data-act="search" aria-label="Search">' + I('search', 19) + '</button>' +
            '<button class="ib ib--b" data-act="notes" aria-label="Notifications">' + I('bell', 19) + '<i class="dotb" id="noteDot" hidden></i></button>' +
            '<button class="ib top__h" data-act="help" aria-label="Help">' + I('help', 19) + '</button>' +
            '<button class="me" data-act="me" aria-label="Your profile">' + CL.av(me, 34) + '<span class="me__t"><b>' + esc(me.name) + '</b><em id="meRole"></em></span></button>' +
            '<button class="btn btn--p top__new" data-act="new">' + I('plus', 16) + '<span>New transaction</span></button>' +
          '</div>' +
        '</header>' +
        '<main class="view" id="view" tabindex="-1"></main>' +
      '</div></div>';
    if (st.S.settings.sidebar === 'collapsed') document.getElementById('app').classList.add('is-col');
  }
  function theme() { document.documentElement.setAttribute('data-theme', st.S.settings.theme || 'forest'); }

  function onAct(e) {
    var a = e.target.closest('[data-act]'); if (!a) return; var act = a.dataset.act;
    if (act === 'reset') CL.confirm({ title: 'Reset the demo?', text: 'All changes you made — entries, invoices, reconciliations and settings — are replaced with fresh sample books. This only affects this browser.', ok: 'Reset demo', icon: 'refresh', tone: 'a', onOk: function () { st.reset(); CL.toast('Demo reset — fresh sample books loaded'); location.hash = '#/overview'; } });
    else if (act === 'collapse') { var app = document.getElementById('app'); app.classList.toggle('is-col'); st.setPref('sidebar', app.classList.contains('is-col') ? 'collapsed' : 'open'); }
    else if (act === 'drawer') drawer();
    else if (act === 'search') palette();
    else if (act === 'notes') notes();
    else if (act === 'help') help();
    else if (act === 'company') CL.menu(a, [{ label: st.S.settings.company.name, icon: 'check', fn: function () { } }, '-', { label: 'Add another company', icon: 'plus', hint: 'Production', disabled: true, fn: function () { } }, { label: 'Company settings', icon: 'building', fn: function () { location.hash = '#/settings/company'; } }]);
    else if (act === 'me') { var me = st.me(); CL.menu(a, [{ label: me.name + ' · ' + st.E.roleName(st.actor().role), icon: 'user', disabled: true, fn: function () { } }, { label: 'Demo identity — not a signed-in account', icon: 'info', disabled: true, fn: function () { } }, '-', { label: 'View as another role…', icon: 'shield', fn: function () { location.hash = '#/team/roles'; } }, { label: 'Preferences', icon: 'settings', fn: function () { location.hash = '#/settings/preferences'; } }, { label: 'Reset demo', icon: 'refresh', fn: function () { document.querySelector('[data-act=reset]').click(); } }]); }
    else if (act === 'new') CL.newMenu(a);
  }
  /** Global "New transaction" menu — also used by page buttons. */
  CL.newMenu = function (anchor) {
    CL.menu(anchor, [
      { label: 'Journal entry', icon: 'journal', fn: function () { location.hash = '#/journal/new'; } },
      { label: 'Invoice', icon: 'invoice', fn: function () { location.hash = '#/invoice/new'; } },
      { label: 'Receive payment', icon: 'arrowDown', fn: function () { CL.receiptModal(); } },
      '-',
      { label: 'Bill', icon: 'bill', fn: function () { location.hash = '#/bill/new'; } },
      { label: 'Pay a bill', icon: 'arrowUp', fn: function () { CL.payModal(); } },
      { label: 'Expense', icon: 'expense', fn: function () { CL.expenseModal(); } },
      '-',
      { label: 'Transfer between accounts', icon: 'transfer', fn: function () { CL.transferModal(); } }
    ]);
  };

  function drawer() {
    var p = CL.open('drawer', '<div class="dnav"><div class="dnav__h"><span class="brand"><span class="brand__m">' + I('leaf', 18) + '</span><span class="brand__w">C-Ledger</span></span><button class="ib" data-close aria-label="Close">' + I('x', 18) + '</button></div>' +
      NAV.map(function (g) { return '<span class="side__h">' + g[0] + '</span>' + g[1].map(function (n) { var on = (NAV_OF[current.name] || current.name) === n[0]; return '<a class="dnav__a' + (on ? ' is-on' : '') + '" href="#/' + n[0] + '">' + I(n[2], 18) + '<span>' + n[1] + '</span></a>'; }).join(''); }).join('') +
      '<div class="dnav__sep"></div><a class="dnav__a" href="./">' + I('leaf', 18) + '<span>C-Ledger product page</span></a><a class="dnav__a dnav__home" href="../index.html"><b>‹</b><span>Back to Ciel Africa</span></a></div>', { label: 'Navigation', cls: 'ovl--left' });
    p.addEventListener('click', function (e) { if (e.target.closest('a')) CL.close(); });
  }

  /* ---------- router ---------- */
  function parse() {
    var h = location.hash.replace(/^#\/?/, ''), q = '', i = h.indexOf('?'); if (i >= 0) { q = h.slice(i + 1); h = h.slice(0, i); }
    var qs = {}; q.split('&').forEach(function (p) { if (!p) return; var kv = p.split('='); qs[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || ''); });
    for (var k = 0; k < ROUTES.length; k++) { var m = h.match(ROUTES[k][0]); if (m) return { name: ROUTES[k][1], params: m.slice(1), q: qs }; }
    return { name: 'overview', params: [], q: qs };
  }
  CL.q = function () { return current.q || {}; };
  function go() {
    var r = parse(), same = r.name === current.name && r.params.join() === current.params.join();
    current = r; CL.closeAll(); document.querySelectorAll('.menu').forEach(function (m) { m.remove(); });
    render(); if (!same) { window.scrollTo(0, 0); var v = document.getElementById('view'); v && v.focus({ preventScroll: true }); }
  }
  CL.go = function (h) { if (location.hash === h) go(); else location.hash = h; };
  function render() {
    var v = document.getElementById('view'), page = CL.pages[current.name];
    var nav = NAV_OF[current.name] || current.name;
    document.querySelectorAll('[data-nav]').forEach(function (a) { var on = a.dataset.nav === nav; a.classList.toggle('is-on', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    document.title = (TITLES[current.name] || 'C-Ledger') + ' · C-Ledger demo';
    var role = st.actor().role; document.getElementById('meRole').textContent = st.E.roleName(role) + (st.S.viewAs ? ' (viewing as)' : '');
    document.documentElement.setAttribute('data-role', role);
    if (!page) { v.innerHTML = CL.empty('info', 'This page is on its way', 'Choose another section from the menu.'); return; }
    try { page.render(v, current.params, current.q || {}); }
    catch (e) { console.error(e); v.innerHTML = CL.empty('alert', 'This page could not be shown', String(e.message || e)); }
    badges();
  }
  CL.rerender = render;
  function badges() {
    var E = st.E, T = st.today(), S = st.S;
    var b = {
      invoices: S.invoices.filter(function (i) { return E.invoiceStatus(i, T) === 'overdue'; }).length,
      bills: S.bills.filter(function (x) { return x.status === 'draft' || x.status === 'approved'; }).length,
      expenses: S.expenses.filter(function (x) { return x.status === 'submitted'; }).length,
      journals: S.journals.filter(function (j) { return j.status === 'draft'; }).length,
      reconciliation: S.recs.filter(function (r) { return r.status === 'in_progress'; }).length
    };
    document.querySelectorAll('[data-badge]').forEach(function (el) { var n = b[el.dataset.badge] || 0; el.textContent = n || ''; el.hidden = !n; el.classList.toggle('side__b--r', el.dataset.badge === 'invoices'); });
    var n = alerts().length, dot = document.getElementById('noteDot'); if (dot) dot.hidden = !n;
    var card = document.getElementById('sideCard');
    if (card) {
      var closed = S.periods.filter(function (p) { return p.status === 'closed'; }), lastClosed = closed[closed.length - 1], open = S.periods.filter(function (p) { return p.status === 'open' && p.key <= T.slice(0, 7); });
      card.innerHTML = '<span class="sc__ic">' + I('lock', 16) + '</span><b>Books closed to ' + (lastClosed ? f.date(CL.addDays(CL.iso(new Date(+lastClosed.key.slice(0, 4), +lastClosed.key.slice(5, 7), 1)), -1)) : '—') + '</b><p>' + (open.length ? open.map(function (p) { return p.label.split(' ')[0]; }).join(' & ') + ' open for posting' : 'All periods closed') + '</p><a href="#/settings/periods">Manage periods</a>';
    }
  }
  CL.badges = badges;

  /* ---------- alerts (dashboard + notifications) ---------- */
  var alerts = CL.alerts = function () {
    var E = st.E, S = st.S, T = st.today(), out = [];
    var od = S.invoices.filter(function (i) { return E.invoiceStatus(i, T) === 'overdue'; });
    if (od.length) out.push({ tone: 'r', icon: 'alert', title: f.plural(od.length, 'invoice') + ' overdue', text: f.money(od.reduce(function (t, i) { return t + E.invoiceOutstanding(i); }, 0)) + ' past due — oldest ' + od.map(function (i) { return CL.daysBetween(i.due, T); }).sort(function (a, b) { return b - a; })[0] + ' days', href: '#/invoices?status=overdue' });
    var soon = S.bills.filter(function (b) { var s = E.billStatus(b, T); return (s === 'posted' || s === 'partial') && b.due <= CL.addDays(T, 7); });
    if (soon.length) out.push({ tone: 'a', icon: 'calendar', title: f.plural(soon.length, 'bill') + ' due within 7 days', text: f.money(soon.reduce(function (t, b) { return t + E.billOutstanding(b); }, 0)) + ' to pay', href: '#/bills?status=due' });
    var odb = S.bills.filter(function (b) { return E.billStatus(b, T) === 'overdue'; });
    if (odb.length) out.push({ tone: 'r', icon: 'bill', title: f.plural(odb.length, 'supplier bill') + ' overdue', text: f.money(odb.reduce(function (t, b) { return t + E.billOutstanding(b); }, 0)) + ' past due', href: '#/bills?status=overdue' });
    var sub = S.expenses.filter(function (x) { return x.status === 'submitted'; });
    if (sub.length) out.push({ tone: 'a', icon: 'expense', title: f.plural(sub.length, 'expense') + ' awaiting approval', text: 'Submitted by ' + sub.map(function (x) { return x.by.split(' ')[0]; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).join(', '), href: '#/expenses?status=submitted' });
    var bd = S.bills.filter(function (b) { return b.status === 'draft' || b.status === 'approved'; });
    if (bd.length) out.push({ tone: 'n', icon: 'bill', title: f.plural(bd.length, 'bill') + ' not yet posted', text: bd.map(function (b) { return b.no + ' (' + b.status + ')'; }).join(', '), href: '#/bills?status=unposted' });
    var dj = S.journals.filter(function (j) { return j.status === 'draft'; });
    if (dj.length) out.push({ tone: 'n', icon: 'journal', title: f.plural(dj.length, 'draft journal') + ' not posted', text: dj.map(function (j) { return j.ref + (E.validate(j).length ? ' — unbalanced' : ''); }).join(', '), href: '#/journals?status=draft' });
    var rip = S.recs.filter(function (r) { return r.status === 'in_progress'; });
    rip.forEach(function (r) { var s = E.recSummary(r.id); out.push({ tone: 'a', icon: 'recon', title: E.account(r.accountId).name + ' reconciliation in progress', text: s.unmatched + ' unmatched statement line' + (s.unmatched === 1 ? '' : 's') + ' · difference ' + f.money(s.difference), href: '#/reconciliation/' + r.id }); });
    E.cashAccounts().filter(function (a) { return a.sub === 'bank'; }).forEach(function (a) { var last = E.lastReconciliation(a.id); if (!last || CL.daysBetween(last.end, T) > 45) out.push({ tone: 'a', icon: 'recon', title: a.name + ' not reconciled recently', text: last ? 'Last reconciled to ' + f.date(last.end) : 'Never reconciled', href: '#/reconciliation' }); });
    var vat = E.balance(E.def('vat').id, CL.addDays(T.slice(0, 7) + '-01', -1)), d = +T.slice(8, 10);
    if (vat > 0 && d <= 20) out.push({ tone: 'n', icon: 'percent', title: 'VAT return due by the 20th', text: f.money(vat) + ' owed for last month (balance of Tax Payable — VAT)', href: '#/account/' + E.def('vat').id });
    return out;
  };

  function notes() {
    var a = alerts(), recent = st.S.audit.slice(-8).reverse();
    var p = CL.open('drawer', CL.head('Notifications', f.plural(a.length, 'item') + ' need attention', 'bell') + '<div class="ovl__body">' +
      (a.length ? '<div class="al">' + a.map(function (x) { return '<a class="al__i al__i--' + x.tone + '" href="' + x.href + '"><span class="al__ic">' + I(x.icon, 16) + '</span><span><b>' + esc(x.title) + '</b><em>' + esc(x.text) + '</em></span>' + I('right', 15) + '</a>'; }).join('') + '</div>' : CL.empty('check', 'All clear', 'Nothing needs attention right now.')) +
      '<h3 class="sub-h">Recent activity</h3><div class="feed">' + recent.map(function (x) { return '<div class="feed__i">' + CL.av(st.S.team.filter(function (u) { return u.id === x.actor.id; })[0] || { name: x.actor.name }, 26) + '<span><b>' + esc(x.actor.name) + '</b> ' + esc(x.summary) + '<em>' + f.ago(x.at) + '</em></span></div>'; }).join('') + '</div>' +
      '<a class="btn btn--block" href="#/team/audit">Open the full audit trail</a></div>', { label: 'Notifications', cls: 'ovl--right' });
    p.addEventListener('click', function (e) { if (e.target.closest('a')) CL.close(); });
  }

  function help() {
    CL.open('modal', CL.head('Getting around C-Ledger', 'A working demo with sample books for a fictional design studio.', 'help') + '<div class="ovl__body help">' +
      '<div class="help__g"><div><h3>Try these</h3><ul>' +
      '<li><a href="#/journal/new">Post a journal entry</a> — it won’t post until debits equal credits.</li>' +
      '<li><a href="#/invoices">Issue an invoice and record a receipt</a> — watch Accounts Receivable move.</li>' +
      '<li><a href="#/reconciliation">Finish the bank reconciliation</a> — one bank charge is missing from the books.</li>' +
      '<li><a href="#/reports/balance-sheet">Open the balance sheet</a> — assets always equal liabilities plus equity.</li>' +
      '<li><a href="#/team/roles">View as a different role</a> — a read-only viewer cannot post.</li></ul></div>' +
      '<div><h3>Shortcuts</h3><dl class="kbd"><dt><kbd>Ctrl</kbd> <kbd>K</kbd> or <kbd>/</kbd></dt><dd>Search</dd><dt><kbd>N</kbd></dt><dd>New transaction</dd><dt><kbd>Esc</kbd></dt><dd>Close a dialog</dd></dl>' +
      '<h3>How the numbers work</h3><p>Every figure is calculated from posted journal lines. Drafts never affect balances. Posted entries are corrected by reversal, never edited.</p></div></div>' +
      '<p class="muted small">' + I('info', 13) + ' Sample data only — fictional company, people and bank accounts. C-Ledger is not certified for any jurisdiction’s tax rules; tax settings are configurable.</p></div>', { label: 'Help' });
  }

  /* ---------- search palette ---------- */
  function palette() {
    var p = CL.open('modal', '<div class="pal"><label class="pal__in">' + I('search', 19) + '<input id="palQ" placeholder="Search accounts, entries, invoices, bills, contacts…" autocomplete="off" autofocus aria-label="Search"><kbd>Esc</kbd></label><div class="pal__r" id="palR" role="listbox"></div></div>', { label: 'Search', cls: 'ovl--pal' });
    var q = p.querySelector('#palQ'), box = p.querySelector('#palR'), sel = 0, items = [];
    function run() {
      var s = q.value.trim().toLowerCase(), E = st.E, S = st.S; items = [];
      function add(group, ic, title, sub, href) { items.push({ group: group, ic: ic, title: title, sub: sub, href: href }); }
      if (!s) { [['Post a journal entry', '#/journal/new', 'journal'], ['New invoice', '#/invoice/new', 'invoice'], ['Trial balance', '#/reports/trial-balance', 'reports'], ['Balance sheet', '#/reports/balance-sheet', 'reports'], ['Profit and loss', '#/reports/profit-loss', 'reports'], ['Bank reconciliation', '#/reconciliation', 'recon']].forEach(function (x) { add('Quick actions', x[2], x[0], '', x[1]); }); }
      else {
        S.accounts.forEach(function (a) { if ((a.code + ' ' + a.name).toLowerCase().indexOf(s) >= 0) add('Accounts', 'coa', a.code + ' · ' + a.name, f.money(E.balance(a.id)), '#/account/' + a.id); });
        S.invoices.forEach(function (i) { var c = E.contact(i.contactId); if ((i.no + ' ' + c.name + ' ' + (i.ref || '')).toLowerCase().indexOf(s) >= 0) add('Invoices', 'invoice', i.no + ' · ' + c.name, f.money(E.invoiceTotals(i).total) + ' · ' + E.invoiceStatus(i), '#/invoice/' + i.id); });
        S.bills.forEach(function (b) { var c = E.contact(b.contactId); if ((b.no + ' ' + c.name + ' ' + (b.ref || '') + ' ' + b.desc).toLowerCase().indexOf(s) >= 0) add('Bills', 'bill', b.no + ' · ' + c.name, f.money(E.billTotals(b).total) + ' · ' + E.billStatus(b), '#/bill/' + b.id); });
        S.journals.forEach(function (j) { if ((j.ref + ' ' + j.desc).toLowerCase().indexOf(s) >= 0) add('Journal entries', 'journal', j.ref + ' · ' + j.desc, f.date(j.date) + ' · ' + j.status, '#/journal/' + j.id); });
        S.contacts.forEach(function (c) { if ((c.name + ' ' + c.ref + ' ' + (c.contact || '')).toLowerCase().indexOf(s) >= 0) add(c.kind === 'customer' ? 'Customers' : 'Suppliers', c.kind === 'customer' ? 'customers' : 'suppliers', c.name, c.ref, '#/' + c.kind + '/' + c.id); });
        S.expenses.forEach(function (x) { if ((x.no + ' ' + x.payee + ' ' + x.desc).toLowerCase().indexOf(s) >= 0) add('Expenses', 'expense', x.no + ' · ' + x.payee, x.desc + ' · ' + f.money(x.amount), '#/expenses?open=' + x.id); });
      }
      var groups = {}, order = []; items.forEach(function (x) { if (!groups[x.group]) { groups[x.group] = []; order.push(x.group); } if (groups[x.group].length < 6) groups[x.group].push(x); });
      items = []; order.forEach(function (g) { items = items.concat(groups[g]); }); sel = 0;
      box.innerHTML = items.length ? order.map(function (g) { return '<div class="pal__g">' + g + '</div>' + groups[g].map(function (x) { var i = items.indexOf(x); return '<a href="' + x.href + '" class="pal__i" role="option" data-i="' + i + '">' + I(x.ic, 16) + '<span><b>' + esc(x.title) + '</b>' + (x.sub ? '<em>' + esc(x.sub) + '</em>' : '') + '</span></a>'; }).join(''); }).join('') : CL.empty('search', 'No results', 'Try an invoice number, account code or a name.');
      hi();
    }
    function hi() { box.querySelectorAll('.pal__i').forEach(function (a) { a.classList.toggle('is-on', +a.dataset.i === sel); }); var on = box.querySelector('.is-on'); if (on) on.scrollIntoView({ block: 'nearest' }); }
    q.addEventListener('input', run);
    q.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(items.length - 1, sel + 1); hi(); } else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); hi(); } else if (e.key === 'Enter' && items[sel]) { e.preventDefault(); CL.close(); location.hash = items[sel].href; } });
    box.addEventListener('click', function (e) { if (e.target.closest('a')) CL.close(); });
    run();
  }

  document.addEventListener('keydown', function (e) {
    var t = e.target, typing = /INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); palette(); }
    else if (!typing && e.key === '/' && !document.querySelector('.ovl')) { e.preventDefault(); palette(); }
    else if (!typing && e.key.toLowerCase() === 'n' && !e.ctrlKey && !e.metaKey && !document.querySelector('.ovl')) { var b = document.querySelector('.top__new'); if (b) CL.newMenu(b); }
  });

  /* ---------- boot ---------- */
  CL.boot = function () {
    st.load(); theme(); shell();
    document.body.addEventListener('click', onAct);
    window.addEventListener('hashchange', go);
    st.sub(function (kind) { if (kind === 'prefs') theme(); if (kind === 'reset') { theme(); shell(); go(); return; } var page = CL.pages[current.name]; if (page && page.keep && kind === 'data') { badges(); return; } render(); });
    if (!location.hash) history.replaceState(null, '', '#/overview');
    go();
  };
  document.addEventListener('DOMContentLoaded', function () { CL.boot(); });
})();
