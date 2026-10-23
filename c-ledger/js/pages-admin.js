/* ============================================================
   C-Ledger — Team, roles & permissions, audit trail, settings
   ============================================================ */
(function () {
  'use strict';
  var CL = window.CL, I = CL.icon, esc = CL.esc, f = CL.fmt, st = CL.store;
  var ROLES = [
    ['owner', 'Owner / Administrator', 'Everything, including settings, periods and team.'],
    ['accountant', 'Accountant', 'Posts, reverses, reconciles and closes periods.'],
    ['finance_manager', 'Finance manager', 'Posts and approves; no period control.'],
    ['bookkeeper', 'Bookkeeper', 'Records and posts day-to-day transactions.'],
    ['approver', 'Approver', 'Approves bills and expenses; read-only otherwise.'],
    ['viewer', 'Read-only viewer', 'Views records and reports — for auditors.']
  ];
  var PERM_ROWS = [['view', 'View records'], ['draft', 'Create drafts'], ['post', 'Post to the ledger'], ['reverse', 'Reverse & void'], ['approve', 'Approve bills & expenses'], ['reconcile', 'Reconcile accounts'], ['reports', 'Run & export reports'], ['periods', 'Close & reopen periods'], ['settings', 'Accounting settings'], ['team', 'Manage team']];

  /* =================== TEAM =================== */
  CL.pages.team = {
    render: function (v, p) {
      var E = st.E, S = st.S, tab = p[0] || 'members';
      var tabs = '<nav class="tabs">' + [['members', 'Members', S.team.length], ['roles', 'Roles & permissions'], ['audit', 'Audit trail', S.audit.length]].map(function (t) { return '<a class="tab' + (tab === t[0] ? ' is-on' : '') + '" href="#/team/' + t[0] + '">' + t[1] + (t[2] != null ? ' <i>' + t[2] + '</i>' : '') + '</a>'; }).join('') + '</nav>';
      var html = '<header class="ph"><div><h1>Team</h1><p>Who can see and change the books. Every posting, reversal and setting change is recorded in the audit trail.</p></div><div class="ph__a"><button class="btn btn--p" data-x="invite">' + I('userPlus', 16) + 'Invite member</button></div></header>' + tabs;
      if (tab === 'members') {
        html += '<div class="tm">' + S.team.map(function (u) {
          var acts = S.audit.filter(function (a) { return a.actor.id === u.id; }), posted = acts.filter(function (a) { return /post|issue|record|approve|reverse|complete/.test(a.action); }).length;
          return '<article class="card"><div class="tm__h">' + CL.av(u, 48) + '<div style="flex:1;min-width:0"><b>' + esc(u.name) + (u.id === S.me ? ' <span class="muted small">(you)</span>' : '') + '</b><em>' + esc(u.title) + '</em></div>' + CL.status(u.status) + '</div>' +
            '<div class="chips" style="margin:0">' + CL.pill(E.roleName(u.role), u.role === 'owner' ? 'g' : u.role === 'viewer' ? 'n' : 'b', 'shield') + '</div>' +
            '<div class="g g2" style="gap:8px"><div class="st"><span>Actions (75 days)</span><b>' + acts.length + '</b></div><div class="st"><span>Postings & approvals</span><b>' + posted + '</b></div></div>' +
            '<span class="muted small">' + esc(u.email) + ' · ' + (u.lastActive ? 'last active ' + f.ago(u.lastActive) : u.status === 'invited' ? 'invitation pending' : 'no recent activity') + '</span>' +
            '<div class="g g2" style="gap:8px;margin-top:auto"><button class="btn btn--sm" data-act-u="' + u.id + '">' + I('clock', 14) + 'Activity</button><button class="btn btn--sm" data-role-u="' + u.id + '"' + (u.id === S.me ? ' disabled' : '') + '>' + I('shield', 14) + 'Change role</button></div></article>';
        }).join('') + '</div>';
      }
      if (tab === 'roles') {
        var me = st.me(), cur = st.actor().role;
        html += '<article class="card mb"><header class="card__h"><span class="card__t">' + I('eye', 16) + 'Try the demo as another role</span>' + (S.viewAs ? '<button class="btn btn--sm" data-va="">Back to ' + E.roleName(me.role) + '</button>' : '') + '</header><p class="card__s">You are signed in to the demo as ' + esc(me.name) + ' (' + E.roleName(me.role) + '). Pick a role to see what it can and cannot do — buttons it may not use disappear, and the engine refuses the action if attempted.</p>' +
          '<div class="role-pick">' + ROLES.map(function (r) { return '<button class="' + (cur === r[0] ? 'is-on' : '') + '" data-va="' + r[0] + '"><b>' + r[1] + '</b><span>' + r[2] + '</span></button>'; }).join('') + '</div>' +
          '<div class="note" style="margin-top:14px">' + I('info', 15) + '<span>Demo identities are simulated, not authenticated accounts. Production uses real sign-in, server-side permission checks and per-company access.</span></div></article>' +
          '<article class="card"><header class="card__h"><span class="card__t">' + I('shield', 16) + 'Permissions by role</span></header><div class="perm" style="grid-template-columns:minmax(170px,1.4fr) repeat(6,minmax(76px,1fr))"><div class="h l">Permission</div>' + ROLES.map(function (r) { return '<div class="h">' + r[1].replace(' / Administrator', '') + '</div>'; }).join('') +
          PERM_ROWS.map(function (pr) { return '<div class="l">' + pr[1] + '</div>' + ROLES.map(function (r) { var y = E.can(pr[0], r[0]); return '<div>' + (y ? I('check', 16, 'y') : I('minus', 16, 'n')) + '<span class="sr" style="position:absolute;width:1px;height:1px;overflow:hidden">' + (y ? 'Yes' : 'No') + '</span></div>'; }).join(''); }).join('') + '</div></article>';
      }
      if (tab === 'audit') {
        var F = st.ui.audit = st.ui.audit || { q: '', who: '', type: '', page: 1 }, s = F.q.trim().toLowerCase();
        var types = {}; S.audit.forEach(function (a) { types[a.action.split('.')[0]] = 1; });
        var rows = S.audit.slice().reverse().filter(function (a) { if (F.who && a.actor.id !== F.who) return false; if (F.type && a.action.split('.')[0] !== F.type) return false; if (s && (a.summary + ' ' + a.actor.name + ' ' + a.action).toLowerCase().indexOf(s) < 0) return false; return true; });
        html += '<div class="fb"><label class="s">' + I('search', 16) + '<input name="q" placeholder="Search events" value="' + esc(F.q) + '"></label><label class="sel">' + CL.select('who', [{ v: '', l: 'Everyone' }].concat(S.team.map(function (u) { return { v: u.id, l: u.name }; })), F.who) + I('down', 15) + '</label><label class="sel">' + CL.select('type', [{ v: '', l: 'All events' }].concat(Object.keys(types).sort().map(function (t) { return { v: t, l: t.charAt(0).toUpperCase() + t.slice(1) }; })), F.type) + I('down', 15) + '</label><span class="fb__r"><button class="btn" data-x="acsv">' + I('download', 16) + 'Export CSV</button></span></div>' +
          CL.table(rows, [
            { k: 'at', label: 'When', cell: function (a) { return '<span class="nowrap">' + f.date(a.at) + '</span><span class="sub">' + f.time(a.at) + '</span>'; } },
            { k: 'who', label: 'Who', cell: function (a) { var u = S.team.filter(function (x) { return x.id === a.actor.id; })[0]; return '<span class="t-who">' + CL.av(u || { name: a.actor.name }, 26) + '<span>' + esc(a.actor.name) + '<span class="sub">' + esc(E.roleName(a.actor.role)) + (a.actor.simulated ? ' · demo identity' : '') + '</span></span></span>'; } },
            { k: 'ev', label: 'Event', cell: function (a) { return '<span class="mono small">' + esc(a.action) + '</span>'; } },
            { k: 'x', label: 'Details', cell: function (a) { return esc(a.summary) + (a.before || a.after ? '<span class="sub">' + esc(diff(a.before, a.after)) + '</span>' : ''); } },
            { k: 'r', label: 'Record', cell: function (a) { return recLink(a); } }
          ], F, { per: 30 });
        st.ui.auditRows = rows;
      }
      v.innerHTML = html;
      if (tab === 'audit') {
        var F2 = st.ui.audit; CL.tableEvents(v, F2, function () { CL.pages.team.render(v, p); });
        v.querySelectorAll('.fb select').forEach(function (el) { el.onchange = function () { F2[el.name] = el.value; F2.page = 1; CL.pages.team.render(v, p); }; });
        var qi = v.querySelector('[name=q]'), tmr; qi.oninput = function () { clearTimeout(tmr); tmr = setTimeout(function () { F2.q = qi.value; F2.page = 1; CL.pages.team.render(v, p); var n = v.querySelector('[name=q]'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 200); };
      }
      v.onclick = function (e) {
        var va = e.target.closest('[data-va]'); if (va) { var r = va.dataset.va, me = st.me(); S.viewAs = r && r !== me.role ? r : null; st.emit('prefs'); CL.rerender(); CL.toast(S.viewAs ? 'Now viewing as ' + E.roleName(r) + ' — try posting something' : 'Back to ' + E.roleName(me.role), 'info'); return; }
        var au = e.target.closest('[data-act-u]'); if (au) { st.ui.audit = { q: '', who: au.dataset.actU, type: '', page: 1 }; location.hash = '#/team/audit'; return; }
        var ru = e.target.closest('[data-role-u]'); if (ru) { roleModal(S.team.filter(function (u) { return u.id === ru.dataset.roleU; })[0]); return; }
        if (e.target.closest('[data-x=invite]')) { inviteModal(); return; }
        if (e.target.closest('[data-x=acsv]')) { CL.csv('c-ledger-audit-trail.csv', [['Timestamp', 'Actor', 'Role', 'Simulated identity', 'Event', 'Record type', 'Record id', 'Summary', 'Before', 'After']].concat(st.ui.auditRows.map(function (a) { return [a.at, a.actor.name, a.actor.role, a.actor.simulated ? 'yes' : 'no', a.action, a.recordType, a.recordId, a.summary, a.before ? JSON.stringify(a.before) : '', a.after ? JSON.stringify(a.after) : '']; }))); }
      };
    }
  };
  function diff(b, a) {
    if (!b && a) return 'Created';
    if (b && !a) return 'Removed';
    var out = []; Object.keys(Object.assign({}, b, a)).forEach(function (k) { if (typeof (b || {})[k] === 'object' || typeof (a || {})[k] === 'object') return; if ((b || {})[k] !== (a || {})[k]) out.push(k + ': ' + ((b || {})[k] == null ? '—' : b[k]) + ' → ' + ((a || {})[k] == null ? '—' : a[k])); });
    return out.slice(0, 3).join(' · ');
  }
  function recLink(a) {
    var map = { journal: '#/journal/', invoice: '#/invoice/', bill: '#/bill/', account: '#/account/', reconciliation: '#/reconciliation/', customer: '#/customer/', supplier: '#/supplier/' }, E = st.E;
    if (a.recordType === 'journal' && !E.journal(a.recordId)) return '<span class="muted small">deleted</span>';
    if (a.recordType === 'receipt') { var r = st.S.receipts.filter(function (x) { return x.id === a.recordId; })[0]; return r ? '<a class="lk" href="#/invoice/' + r.invoiceId + '">' + r.no + '</a>' : '—'; }
    if (a.recordType === 'payment') { var pm = st.S.payments.filter(function (x) { return x.id === a.recordId; })[0]; return pm ? '<a class="lk" href="#/bill/' + pm.billId + '">' + pm.no + '</a>' : '—'; }
    if (a.recordType === 'expense') return '<a class="lk" href="#/expenses?open=' + a.recordId + '">Expense</a>';
    if (a.recordType === 'period') return '<a class="lk" href="#/settings/periods">' + esc(a.recordId) + '</a>';
    if (a.recordType === 'settings') return '<a class="lk" href="#/settings">Settings</a>';
    return map[a.recordType] ? '<a class="lk" href="' + map[a.recordType] + a.recordId + '">Open</a>' : '<span class="muted small">' + esc(a.recordType) + '</span>';
  }
  function roleModal(u) {
    var E = st.E;
    var p = CL.open('modal', CL.head('Change role', esc(u.name), 'shield') + '<div class="ovl__body"><div class="role-pick" style="grid-template-columns:1fr 1fr">' + ROLES.map(function (r) { return '<button class="' + (u.role === r[0] ? 'is-on' : '') + '" data-r="' + r[0] + '"><b>' + r[1] + '</b><span>' + r[2] + '</span></button>'; }).join('') + '</div><div class="form-err" hidden></div></div>', { label: 'Change role' });
    p.onclick = function (e) { var b = e.target.closest('[data-r]'); if (!b) return; var form = p.querySelector('.ovl__body'); if (st.act(function () { if (!E.can('team')) { var er = new Error('Only an Owner can change roles.'); er.userFacing = true; throw er; } var before = u.role; u.role = b.dataset.r; E.audit('team.role', 'settings', u.id, 'Changed ' + u.name + '’s role from ' + E.roleName(before) + ' to ' + E.roleName(u.role), { role: before }, { role: u.role }); }, u.name + ' is now ' + E.roleName(b.dataset.r), form) !== false) CL.close(); };
  }
  function inviteModal() {
    var E = st.E, S = st.S;
    var p = CL.open('modal', CL.head('Invite a team member', 'In the demo, invitations are recorded but no email is sent.', 'userPlus') + '<form class="ovl__body" id="if" novalidate><div class="fg">' + CL.field('Full name *', '<input name="name" autofocus>') + CL.field('Email *', '<input name="email" type="email">') + CL.field('Job title', '<input name="title">') + CL.field('Role *', CL.select('role', ROLES.map(function (r) { return { v: r[0], l: r[1] }; }), 'bookkeeper')) + '</div><div class="form-err" hidden></div></form><div class="ovl__f"><button class="btn" data-close>Cancel</button><button class="btn btn--p" data-x="ok">' + I('mail', 16) + 'Record invitation</button></div>', { label: 'Invite' });
    p.querySelector('[data-x=ok]').onclick = function () {
      var form = p.querySelector('#if'), d = CL.formData(form);
      var r = st.act(function () {
        var er; if (!E.can('team')) { er = new Error('Only an Owner can invite team members.'); er.userFacing = true; throw er; }
        if (!d.name.trim()) { er = new Error('Name is required.'); er.userFacing = true; er.field = 'name'; throw er; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) { er = new Error('Enter a valid email address.'); er.userFacing = true; er.field = 'email'; throw er; }
        if (S.team.some(function (u) { return u.email.toLowerCase() === d.email.toLowerCase(); })) { er = new Error('That email is already on the team.'); er.userFacing = true; er.field = 'email'; throw er; }
        var ini = d.name.trim().split(/\s+/).map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase();
        var u = { id: 'u' + (S.team.length + 1) + Date.now().toString(36).slice(-3), name: d.name.trim(), email: d.email.trim(), title: d.title || '', role: d.role, initials: ini, tone: ['g', 'b', 'p', 'a', 'r'][S.team.length % 5], status: 'invited', lastActive: null };
        S.team.push(u); E.audit('team.invite', 'settings', u.id, 'Invited ' + u.name + ' as ' + E.roleName(u.role), null, { email: u.email, role: u.role }); return u;
      }, function (u) { return u.name + ' invited (demo — no email sent)'; }, form);
      if (r) CL.close();
    };
  }

  /* =================== SETTINGS =================== */
  var SECTIONS = [['company', 'Company', 'building'], ['preferences', 'Appearance & preferences', 'palette'], ['accounting', 'Accounting', 'coa'], ['tax', 'Tax rates', 'percent'], ['numbering', 'Numbering', 'hash'], ['periods', 'Financial periods', 'lock'], ['notifications', 'Notifications', 'bell'], ['data', 'Data & production', 'shield']];
  CL.pages.settings = {
    render: function (v, p) {
      var E = st.E, S = st.S, set = S.settings, sec = p[0] || 'company', canSet = E.can('settings');
      var nav = '<aside class="card" style="padding:10px;align-self:start;position:sticky;top:calc(var(--banner) + var(--top) + 8px)" id="setNav">' + SECTIONS.map(function (s) { return '<a class="side__a' + (sec === s[0] ? ' is-on' : '') + '" href="#/settings/' + s[0] + '">' + I(s[2], 17) + '<span>' + s[1] + '</span></a>'; }).join('') + '</aside>';
      var body = '', lock = canSet ? '' : '<div class="note note--a mb">' + I('lock', 15) + '<span>Your role (' + E.roleName(st.actor().role) + ') can view these settings but not change them.</span></div>';
      var foot = function () { return canSet ? '<div class="form-err" hidden></div><div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px"><button type="button" class="btn" data-x="reset-form">Discard</button><button type="button" class="btn btn--p" data-x="save">' + I('check', 16) + 'Save changes</button></div>' : ''; };
      var dis = canSet ? '' : ' disabled';
      if (sec === 'company') {
        var c = set.company;
        body = '<article class="card"><header class="card__h"><span class="card__t">' + I('building', 16) + 'Company details</span></header><p class="card__s">Shown on invoices, statements and reports. Separate from the C-Ledger product identity.</p>' + lock +
          '<form id="sf" class="fg"><div class="full" style="display:flex;gap:14px;align-items:center"><span class="paper__lg" style="width:56px;height:56px;border-radius:14px">' + esc(c.initials) + '</span><div><b>Logo</b><p class="muted small">Production: upload your logo for invoices. The demo uses initials.</p></div></div>' +
          CL.field('Legal name', '<input name="name" value="' + esc(c.name) + '"' + dis + '>', '', 'full') + CL.field('Short name', '<input name="short" value="' + esc(c.short) + '"' + dis + '>') + CL.field('Initials (logo)', '<input name="initials" maxlength="3" value="' + esc(c.initials) + '"' + dis + '>') +
          CL.field('Tax PIN', '<input name="pin" value="' + esc(c.pin) + '"' + dis + '>') + CL.field('Accounts email', '<input name="email" type="email" value="' + esc(c.email) + '"' + dis + '>') + CL.field('Phone', '<input name="phone" value="' + esc(c.phone) + '"' + dis + '>') + CL.field('Website', '<input name="website" value="' + esc(c.website) + '"' + dis + '>') + CL.field('Address', '<input name="address" value="' + esc(c.address) + '"' + dis + '>', '', 'full') +
          CL.field('Invoice footer', '<textarea name="footer" rows="2"' + dis + '>' + esc(set.invoice.footer) + '</textarea>', '', 'full') + '</form>' + foot() + '</article>';
      }
      if (sec === 'preferences') {
        var th = [['forest', 'Forest', '#176B45'], ['ocean', 'Ocean', '#1F5F9E'], ['plum', 'Plum', '#6C3E8E'], ['amber', 'Amber', '#A8661A']];
        body = '<article class="card mb"><header class="card__h"><span class="card__t">' + I('palette', 16) + 'Appearance</span></header><p class="card__s">The accent re-tints the whole workspace and is remembered in this browser.</p><span class="small" style="font-weight:800;letter-spacing:.08em;color:var(--ink-4)">ACCENT</span><div class="themes" style="margin:8px 0 18px">' + th.map(function (t) { return '<button class="theme-b' + (set.theme === t[0] ? ' is-on' : '') + '" data-th="' + t[0] + '"><i style="background:' + t[2] + '"></i>' + t[1] + (t[0] === 'forest' ? ' <span class="muted small">default</span>' : '') + '</button>'; }).join('') + '</div>' +
          '<span class="small" style="font-weight:800;letter-spacing:.08em;color:var(--ink-4)">SIDEBAR</span><div class="seg" style="margin-top:8px"><button class="' + (set.sidebar !== 'collapsed' ? 'is-on' : '') + '" data-sb="open">Expanded</button><button class="' + (set.sidebar === 'collapsed' ? 'is-on' : '') + '" data-sb="collapsed">Collapsed</button></div></article>' +
          '<article class="card"><header class="card__h"><span class="card__t">' + I('user', 16) + 'Your preferences</span></header><form id="sf" class="fg">' + CL.field('Default dashboard period', CL.select('period', st.PERIODS.map(function (x) { return { v: x[0], l: x[1] }; }), set.defaultPeriod || 'month')) + CL.field('Week starts on', CL.select('weekStart', [{ v: 'mon', l: 'Monday' }, { v: 'sun', l: 'Sunday' }], set.weekStart)) + '</form><div style="display:flex;justify-content:flex-end;margin-top:16px"><button type="button" class="btn btn--p" data-x="prefs">' + I('check', 16) + 'Save preferences</button></div></article>';
      }
      if (sec === 'accounting') {
        var accOpt = function (name, filter, val) { return CL.select(name, CL.accountOptions(filter), val, dis); };
        body = '<article class="card"><header class="card__h"><span class="card__t">' + I('coa', 16) + 'Accounting settings</span></header>' + lock + '<form id="sf" class="fg">' +
          CL.field('Base currency', CL.select('currency', [{ v: 'KES', l: 'KES — Kenyan shilling' }, { v: 'UGX', l: 'UGX — Ugandan shilling' }, { v: 'TZS', l: 'TZS — Tanzanian shilling' }, { v: 'USD', l: 'USD — US dollar' }], set.currency, dis), 'Changing the label does not convert existing amounts.') +
          CL.field('Financial year starts', CL.select('fyStartMonth', f.MONTH.map(function (m, i) { return { v: i + 1, l: m }; }), set.fyStartMonth, dis), 'Current year: ' + esc(E.fyOf(st.today()).label)) +
          CL.field('Date format', CL.select('dateFormat', [{ v: 'd MMM yyyy', l: '23 Oct 2026' }, { v: 'dd/MM/yyyy', l: '23/10/2026' }, { v: 'yyyy-MM-dd', l: '2026-10-23' }], set.dateFormat, dis)) +
          CL.field('Number format', CL.select('numberFormat', [{ v: '1,234.56', l: '1,234.56' }, { v: '1 234.56', l: '1 234.56' }], set.numberFormat, dis), 'Amounts are stored to 2 decimal places (whole cents).') +
          CL.field('Ageing periods (days)', '<input name="ageing" value="' + set.ageing.join(', ') + '"' + dis + '>', 'Three increasing numbers, e.g. 30, 60, 90') +
          CL.field('Default invoice terms (days)', '<input name="terms" inputmode="numeric" value="' + set.invoice.terms + '"' + dis + '>') +
          '<div class="full"><h3 class="sub-h" style="margin:4px 0 10px">Default accounts</h3><div class="fg">' + CL.field('Main bank account', accOpt('bank', function (a) { return a.sub === 'bank' || a.sub === 'cash'; }, set.defaults.bank)) + CL.field('Default revenue', accOpt('revenue', function (a) { return a.type === 'income'; }, set.defaults.revenue)) + CL.field('Accounts receivable', accOpt('ar', function (a) { return a.sub === 'ar'; }, set.defaults.ar)) + CL.field('Accounts payable', accOpt('ap', function (a) { return a.sub === 'ap'; }, set.defaults.ap)) + CL.field('VAT control', accOpt('vat', function (a) { return a.sub === 'tax'; }, set.defaults.vat)) + CL.field('Customer credits', accOpt('custCredit', function (a) { return a.sub === 'custcredit'; }, set.defaults.custCredit)) + '</div></div></form>' + foot() + '</article>';
      }
      if (sec === 'tax') {
        body = '<article class="card"><header class="card__h"><span class="card__t">' + I('percent', 16) + 'Tax rates</span>' + (canSet ? '<button class="btn btn--sm" data-x="addtax">' + I('plus', 14) + 'Add rate</button>' : '') + '</header><p class="card__s">Applied per line on invoices, bills and expenses. Output VAT and input VAT are both posted to the VAT control account.</p>' +
          '<div class="t-wrap"><table class="t"><thead><tr><th>Name</th><th class="r">Rate</th><th>Used on</th></tr></thead><tbody>' + set.taxRates.map(function (t) { var n = st.S.invoices.filter(function (i) { return i.lines.some(function (l) { return l.taxId === t.id; }); }).length + st.S.bills.filter(function (b) { return b.lines.some(function (l) { return l.taxId === t.id; }); }).length; return '<tr><td><b>' + esc(t.name) + '</b></td><td class="r">' + t.rate + '%</td><td>' + n + ' documents</td></tr>'; }).join('') + '</tbody></table></div>' +
          '<div class="note" style="margin-top:14px">' + I('info', 15) + '<span>C-Ledger is not certified for any jurisdiction’s tax rules (including KRA eTIMS). Rates and treatments are configurable; confirm them with your tax adviser. eTIMS integration is available as a custom add-on.</span></div></article>';
      }
      if (sec === 'numbering') {
        var N = set.numbering, NL = { journal: 'Journal entries', invoice: 'Invoices', receipt: 'Receipts', bill: 'Bills', payment: 'Supplier payments', expense: 'Expenses', transfer: 'Transfers', customer: 'Customers', supplier: 'Suppliers' };
        body = '<article class="card"><header class="card__h"><span class="card__t">' + I('hash', 16) + 'Document numbering</span></header><p class="card__s">Numbers are issued in sequence and never reused — discarded drafts keep their number so there are no gaps to explain.</p>' + lock + '<form id="sf"><div class="t-wrap"><table class="t"><thead><tr><th>Document</th><th>Prefix</th><th class="r">Next number</th><th>Preview</th></tr></thead><tbody>' + Object.keys(N).map(function (k) { return '<tr><td><b>' + NL[k] + '</b></td><td style="width:140px"><input class="cell-in" name="p_' + k + '" value="' + esc(N[k].prefix) + '"' + dis + '></td><td class="r" style="width:140px"><input class="cell-in" name="n_' + k + '" inputmode="numeric" value="' + N[k].next + '" style="text-align:right"' + dis + '></td><td class="mono">' + esc(N[k].prefix + CL.pad(N[k].next, N[k].pad)) + '</td></tr>'; }).join('') + '</tbody></table></div></form>' + foot() + '</article>';
      }
      if (sec === 'periods') {
        var T = st.today(), fy = E.fyOf(T), canP = E.can('periods');
        body = '<article class="card"><header class="card__h"><span class="card__t">' + I('lock', 16) + 'Financial periods</span></header><p class="card__s">Financial year ' + esc(fy.label) + ' runs ' + f.date(fy.start) + ' – ' + f.date(fy.end) + '. Closed periods cannot receive new entries until an Owner or Accountant reopens them with a reason.</p>' + (canP ? '' : '<div class="note note--a mb">' + I('lock', 15) + '<span>Only an Owner or Accountant can close or reopen periods.</span></div>') +
          '<div class="t-wrap"><table class="t"><thead><tr><th>Period</th><th class="r">Posted entries</th><th class="r">Drafts</th><th class="r">Net profit</th><th>Status</th><th class="r"></th></tr></thead><tbody>' +
          S.periods.slice().reverse().map(function (pd) { var js = S.journals.filter(function (j) { return j.date.slice(0, 7) === pd.key; }), posted = js.filter(function (j) { return j.status === 'posted'; }).length, drafts = js.length - posted, s = pd.key + '-01', e = CL.addDays(CL.iso(new Date(+pd.key.slice(0, 4), +pd.key.slice(5, 7), 1)), -1), future = s > T; return '<tr' + (future ? ' class="is-muted"' : '') + '><td><b>' + esc(pd.label) + '</b>' + (pd.closedAt ? '<span class="sub">Closed ' + f.date(pd.closedAt) + (pd.closedBy ? ' by ' + esc(pd.closedBy) : '') + '</span>' : '') + '</td><td class="r">' + posted + '</td><td class="r">' + (drafts ? '<span class="neg">' + drafts + '</span>' : '0') + '</td><td class="r">' + (future ? '—' : f.num(E.netIncome(s, e), true)) + '</td><td>' + (future ? CL.pill('Future', 'n') : CL.status(pd.status)) + '</td><td class="r">' + (canP && !future ? (pd.status === 'open' ? '<button class="btn btn--sm" data-close-p="' + pd.key + '">' + I('lock', 14) + 'Close</button>' : '<button class="btn btn--sm" data-open-p="' + pd.key + '">' + I('unlock', 14) + 'Reopen</button>') : '') + '</td></tr>'; }).join('') + '</tbody></table></div></article>';
      }
      if (sec === 'notifications') {
        var nt = set.notifications;
        body = '<article class="card"><header class="card__h"><span class="card__t">' + I('bell', 16) + 'Notifications</span></header><p class="card__s">In the demo these control the in-app alerts. Production can also send email or SMS.</p><form id="sf" class="g" style="gap:10px">' +
          [['overdue', 'Overdue invoices', 'Alert when a customer invoice passes its due date.'], ['billsDue', 'Bills due soon', 'Alert seven days before a supplier bill is due.'], ['reconciliation', 'Reconciliation reminders', 'Alert when a bank account has not been reconciled for 45 days.'], ['weekly', 'Weekly summary', 'A Monday summary of cash, receivables and payables.']].map(function (n) { return '<label class="chk"><input type="checkbox" name="' + n[0] + '"' + (nt[n[0]] ? ' checked' : '') + '><span><b>' + n[1] + '</b><em>' + n[2] + '</em></span></label>'; }).join('') + '</form><div style="display:flex;justify-content:flex-end;margin-top:16px"><button type="button" class="btn btn--p" data-x="notes">' + I('check', 16) + 'Save</button></div></article>';
      }
      if (sec === 'data') {
        var ints = E.integrity();
        body = '<article class="card mb"><header class="card__h"><span class="card__t">' + I('check', 16) + 'Ledger integrity</span></header>' + (ints.length ? '<div class="note note--r">' + I('alert', 15) + '<span>' + ints.map(esc).join('<br>') + '</span></div>' : '<div class="note note--g">' + I('check', 15) + '<span>All checks pass: every posted entry balances, the trial balance balances, the balance sheet satisfies A = L + E, and customer, supplier, invoice and bill balances agree with their control accounts.</span></div>') + '</article>' +
          '<article class="card mb"><header class="card__h"><span class="card__t">' + I('download', 16) + 'Export</span></header><p class="card__s">Download the full demo workspace as JSON — accounts, journals, documents, reconciliations and the audit trail.</p><button class="btn" data-x="json">' + I('download', 16) + 'Download JSON</button></article>' +
          '<article class="card"><header class="card__h"><span class="card__t">' + I('shield', 16) + 'About this demo and production</span></header><div class="help" style="display:flex;flex-direction:column;gap:10px"><p>This demo keeps its books in your browser’s local storage. That is <b>not</b> secure or durable accounting storage — clearing site data or using another device starts fresh.</p><p>A production deployment of C-Ledger runs the same accounting rules on a server, backed by a relational database with transactions, so a posting either completes fully or not at all. It adds:</p><ul><li>Real sign-in, per-company access and server-side permission checks.</li><li>Database constraints: balanced entries, immutable posted lines, unique document numbers.</li><li>Idempotency keys so a repeated request never posts twice.</li><li>Encrypted backups, file storage for attachments, and exportable audit logs.</li><li>Optional integrations: bank statement feeds, M-Pesa, KRA eTIMS, email delivery of invoices.</li></ul><p class="muted small">All names, figures, bank accounts and people in this demo are fictional.</p></div></article>';
      }
      v.innerHTML = '<header class="ph"><div><h1>Settings</h1><p>' + esc(set.company.name) + '</p></div></header><div class="g" style="grid-template-columns:240px minmax(0,1fr);align-items:start" id="sg">' + nav + '<div>' + body + '</div></div>';
      if (innerWidth < 980) { v.querySelector('#sg').style.gridTemplateColumns = 'minmax(0,1fr)'; var sn = v.querySelector('#setNav'); sn.style.position = 'static'; sn.style.display = 'flex'; sn.style.overflowX = 'auto'; sn.style.gap = '4px'; }
      v.onclick = function (e) {
        var b = e.target.closest('button'); if (!b) return; var d = b.dataset, form = v.querySelector('#sf');
        if (d.th) { var before = set.theme; st.setPref('theme', d.th); E.audit('settings.theme', 'settings', 'appearance', 'Changed accent from ' + before + ' to ' + d.th, { theme: before }, { theme: d.th }); CL.rerender(); return; }
        if (d.sb) { st.setPref('sidebar', d.sb); document.getElementById('app').classList.toggle('is-col', d.sb === 'collapsed'); CL.rerender(); return; }
        if (d.x === 'reset-form') { CL.rerender(); return; }
        if (d.x === 'prefs') { var pf = CL.formData(form); set.defaultPeriod = pf.period; set.weekStart = pf.weekStart; st.ui.period = pf.period; st.setPref('weekStart', pf.weekStart); CL.toast('Preferences saved'); return; }
        if (d.x === 'notes') { var nf = CL.formData(form); st.act(function () { var before = Object.assign({}, set.notifications); Object.keys(set.notifications).forEach(function (k) { set.notifications[k] = !!nf[k]; }); E.audit('settings.notifications', 'settings', 'notifications', 'Updated notification settings', before, Object.assign({}, set.notifications)); }, 'Notification settings saved'); return; }
        if (d.x === 'json') { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(st.S, null, 1)], { type: 'application/json' })); a.download = 'c-ledger-demo-workspace.json'; document.body.appendChild(a); a.click(); setTimeout(function () { a.remove(); }, 300); CL.toast('Exported c-ledger-demo-workspace.json'); return; }
        if (d.x === 'addtax') { CL.confirm({ title: 'Add a tax rate', text: 'Name and percentage, e.g. “Withholding VAT 2%”.', ok: 'Add rate', icon: 'percent', input: { label: 'Name and rate', placeholder: 'e.g. Reduced VAT 8%', required: true }, onOk: function (val, panel) { return st.act(function () { var m = val.match(/(\d+(?:\.\d+)?)\s*%?\s*$/); if (!m) { var er = new Error('End the name with the rate, e.g. “Reduced VAT 8%”.'); er.userFacing = true; throw er; } var rate = parseFloat(m[1]); if (rate < 0 || rate > 100) { var er2 = new Error('Rate must be between 0 and 100.'); er2.userFacing = true; throw er2; } var id = 'tx' + Date.now().toString(36); set.taxRates.push({ id: id, name: val.trim(), rate: rate }); E.audit('settings.tax', 'settings', id, 'Added tax rate ' + val.trim(), null, { rate: rate }); }, 'Tax rate added', panel) !== false; } }); return; }
        if (d.closeP) { var pd = S.periods.filter(function (x) { return x.key === d.closeP; })[0]; CL.confirm({ title: 'Close ' + pd.label + '?', text: 'No one will be able to post entries dated in ' + pd.label + ' until it is reopened. Drafts dated in the period must be posted or deleted first.', ok: 'Close period', icon: 'lock', tone: 'a', onOk: function () { st.act(function () { E.closePeriod(pd.key); }, pd.label + ' closed'); } }); return; }
        if (d.openP) { var pd2 = S.periods.filter(function (x) { return x.key === d.openP; })[0]; CL.confirm({ title: 'Reopen ' + pd2.label + '?', text: 'Reopening lets entries be posted with dates in this period. It is recorded in the audit trail.', ok: 'Reopen', icon: 'unlock', tone: 'a', input: { label: 'Reason', required: true, placeholder: 'e.g. Late supplier invoice for September' }, onOk: function (reason, panel) { return st.act(function () { E.reopenPeriod(pd2.key, reason); }, pd2.label + ' reopened', panel) !== false; } }); return; }
        if (d.x === 'save') {
          var data = CL.formData(form);
          st.act(function () {
            var er; if (!E.can('settings')) { er = new Error('Your role cannot change accounting settings.'); er.userFacing = true; throw er; }
            var before = JSON.parse(JSON.stringify(set));
            if (sec === 'company') {
              if (!data.name.trim()) { er = new Error('Legal name is required.'); er.userFacing = true; er.field = 'name'; throw er; }
              ['name', 'short', 'initials', 'pin', 'email', 'phone', 'website', 'address'].forEach(function (k) { set.company[k] = (data[k] || '').trim(); }); set.company.initials = set.company.initials.toUpperCase() || 'CO'; set.invoice.footer = data.footer;
              E.audit('settings.company', 'settings', 'company', 'Updated company details', before.company, Object.assign({}, set.company));
            }
            if (sec === 'accounting') {
              var ag = data.ageing.split(/[,\s]+/).filter(Boolean).map(Number);
              if (ag.length !== 3 || ag.some(function (n) { return !(n > 0) || Math.floor(n) !== n; }) || !(ag[0] < ag[1] && ag[1] < ag[2])) { er = new Error('Ageing periods must be three increasing whole numbers, e.g. 30, 60, 90.'); er.userFacing = true; er.field = 'ageing'; throw er; }
              var terms = parseInt(data.terms, 10); if (!(terms >= 0 && terms <= 365)) { er = new Error('Invoice terms must be between 0 and 365 days.'); er.userFacing = true; er.field = 'terms'; throw er; }
              set.currency = data.currency; set.fyStartMonth = +data.fyStartMonth; set.dateFormat = data.dateFormat; set.numberFormat = data.numberFormat; set.ageing = ag; set.invoice.terms = terms;
              ['bank', 'revenue', 'ar', 'ap', 'vat', 'custCredit'].forEach(function (k) { if (data[k]) set.defaults[k] = data[k]; });
              E.audit('settings.accounting', 'settings', 'accounting', 'Updated accounting settings', { currency: before.currency, fyStartMonth: before.fyStartMonth, ageing: before.ageing.join('/'), terms: before.invoice.terms }, { currency: set.currency, fyStartMonth: set.fyStartMonth, ageing: set.ageing.join('/'), terms: set.invoice.terms });
            }
            if (sec === 'numbering') {
              Object.keys(set.numbering).forEach(function (k) { var pre = data['p_' + k], nx = parseInt(data['n_' + k], 10), N = set.numbering[k]; if (!(nx >= 1)) { er = new Error('Next numbers must be whole numbers from 1.'); er.userFacing = true; er.field = 'n_' + k; throw er; } if (nx < N.next) { er = new Error(k.charAt(0).toUpperCase() + k.slice(1) + ' numbers cannot go backwards (next is ' + N.next + ') — that could create duplicates.'); er.userFacing = true; er.field = 'n_' + k; throw er; } N.prefix = pre; N.next = nx; });
              E.audit('settings.numbering', 'settings', 'numbering', 'Updated document numbering', null, null);
            }
            st.S.rev++;
          }, 'Settings saved', v.querySelector('#sf').parentNode);
          if (sec === 'company' || sec === 'accounting') { var co = document.querySelector('.co__t'); if (co) co.innerHTML = '<b><span class="co__f">' + esc(set.company.name) + '</span><span class="co__s">' + esc(set.company.short || set.company.name) + '</span></b><em>' + esc(E.fyOf(st.today()).label) + ' · ' + esc(set.currency) + '</em>'; var cm = document.querySelector('.co__m'); if (cm) cm.textContent = set.company.initials; }
        }
      };
    }
  };
})();
