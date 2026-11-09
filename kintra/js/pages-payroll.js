/* ============================================================
   KINTRA — Payroll: periods, timesheet review, calculation with
   configurable rules, exceptions, approval (separation of duties),
   payment recording, payslip detail and CSV exports.
   KINTRA records payroll; it never moves money.
   ============================================================ */
(function () {
  'use strict';
  var ui = KT.ui, store = KT.store, R = KT.rules, app = KT.app, I = ui.icon;

  function due(p) { return R.addDays(p.payDate, -store.state.org.payroll.approvalLeadDays); }
  function statusLabel(p) { var t = store.today(); if (p.status === 'open') return p.end >= t ? ['upcoming', 'In progress'] : ['pending', 'To process']; return [p.status, null]; }
  function recordsOf(p) { return p.records || store.calcPreview(p); }

  /* ---------- payslip drawer ---------- */
  KT.v.payslip = function (p, empId) {
    var recs = recordsOf(p), r = recs.filter(function (x) { return x.employeeId === empId; })[0], e = store.emp(empId);
    if (!r) { ui.toast('No record for this period', 'info'); return; }
    var cur = function (n) { return ui.money(n, { cents: true }); };
    var body = '<div class="row" style="gap:12px;margin-bottom:12px">' + ui.avatar(store.name(e), 'lg') + '<div><div class="strong" style="font-size:15px">' + ui.esc(store.name(e)) + '</div><div class="muted">' + ui.esc(store.role(e.jobRoleId).name) + ' · ' + ui.esc(store.locName(e.locationId)) + ' · ' + (r.payType === 'hourly' ? ui.money(r.rate) + '/h' : ui.money(r.salary) + '/month') + '</div></div></div>' +
      (p.records ? '' : '<div class="note note--info">' + I('info', 14) + '<span>Preview from current timesheets. Nothing is saved until payroll is calculated.</span></div>') +
      (r.flags.length ? '<div class="issues" style="margin-top:10px">' + r.flags.map(function (f) { return '<div class="note ' + (f.level === 'err' ? 'note--bad' : f.level === 'info' ? 'note--plain' : '') + '">' + I(f.level === 'info' ? 'info' : 'alert', 14) + '<span>' + ui.esc(f.text) + '</span></div>'; }).join('') + '</div>' : '') +
      '<div class="slip"><h4>Earnings</h4><table>' + r.earnings.map(function (x) { return '<tr><td>' + ui.esc(x.label) + (x.qty != null ? ' <span class="q">' + ui.dec(x.qty, 2) + ' ' + x.unit + (x.rate != null ? ' × ' + ui.money(x.rate, { noCur: true, cents: true }) : '') + '</span>' : '') + '</td><td>' + cur(x.amount) + '</td></tr>'; }).join('') + '<tr class="tot"><td>Gross pay</td><td>' + cur(r.gross) + '</td></tr></table>' +
      '<h4>Deductions</h4><table>' + r.deductions.map(function (x) { return '<tr><td>' + ui.esc(x.name) + '</td><td>−' + cur(x.amount) + '</td></tr>'; }).join('') + '<tr class="tot"><td>Total deductions</td><td>−' + cur(r.totalDeductions) + '</td></tr></table>' +
      '<h4>Net pay</h4><table><tr class="tot"><td>Net pay</td><td style="font-size:16px">' + cur(r.net) + '</td></tr></table>' +
      (r.employer.length ? '<h4>Employer contributions</h4><table>' + r.employer.map(function (x) { return '<tr><td>' + ui.esc(x.name) + '</td><td>' + cur(x.amount) + '</td></tr>'; }).join('') + '<tr class="tot"><td>Total cost to employer</td><td>' + cur(r.cost) + '</td></tr></table>' : '') +
      '<h4>Hours</h4><table><tr><td>Regular</td><td>' + ui.dec(r.hours.regular, 2) + ' h</td></tr><tr><td>Overtime</td><td>' + ui.dec(r.hours.overtime, 2) + ' h</td></tr><tr><td>Public holiday</td><td>' + ui.dec(r.hours.holiday, 2) + ' h</td></tr><tr><td>Paid leave</td><td>' + ui.dec(r.hours.leave, 2) + ' h</td></tr><tr><td>Approved timesheets</td><td>' + r.entryCount + '</td></tr></table></div>' +
      '<p class="muted small" style="margin-top:14px">Calculated with ' + ui.esc(store.state.org.name) + '’s payroll rules (Settings → Payroll). The rules in this demo are examples, not tax advice.</p>';
    var canAtt = store.can('attendance.view', e.locationId);
    ui.modal({ title: 'Pay record', sub: ui.range(p.start, p.end) + ' · ' + ui.label(p.status), drawer: true, body: body, foot: (canAtt ? '<a class="btn btn--sm" href="#/attendance?from=' + p.start + '&to=' + p.end + '&who=' + encodeURIComponent(store.name(e)) + '" data-x>' + I('clock', 14) + 'Timesheets</a>' : '') + '<span class="sp"></span><button class="btn" data-x>Close</button>' });
  };

  /* ---------- overview ---------- */
  KT.route('/payroll', function () {
    if (!store.can('payroll.view')) return { title: 'Payroll', html: app.ph('Payroll') + app.locked('Payroll is restricted', 'payroll.view') };
    var S = store.state, today = store.today(), P = S.org.payroll;
    var periods = S.periods.slice().reverse();
    var toProcess = S.periods.filter(function (p) { return p.end < today && p.status !== 'paid'; });
    var focus = toProcess[0] || S.periods[S.periods.length - 1];
    var fr = recordsOf(focus), fs = R.summarise(fr), ts = store.timesheetStatus(focus);
    var lastPaid = S.periods.filter(function (p) { return p.status === 'paid'; }).slice(-1)[0];
    var strip = '<div class="mstrip" style="--n:5"><a class="mstat" href="#/payroll/' + focus.id + '"><span>' + (toProcess.length ? 'Next payroll' : 'Current period') + '</span><b>' + ui.money(fs.gross) + '</b><em>gross · ' + ui.range(focus.start, focus.end) + (focus.records ? '' : ' (preview)') + '</em></a><div class="mstat"><span>Employees included</span><b>' + fs.count + '</b><em>' + fr.filter(function (r) { return r.payType === 'hourly'; }).length + ' hourly · ' + fr.filter(function (r) { return r.payType === 'salaried'; }).length + ' salaried</em></div><a class="mstat' + (ts.pending ? ' mstat--warn' : '') + '" href="#/payroll/' + focus.id + '"><span>Records flagged</span><b>' + fs.flags + '</b><em>' + ts.pending + ' timesheet' + (ts.pending === 1 ? '' : 's') + ' still unapproved</em></a><div class="mstat' + (toProcess.length ? ' mstat--warn' : '') + '"><span>Approval due</span><b>' + (toProcess.length ? ui.date(due(focus)) : '—') + '</b><em>' + (toProcess.length ? 'pay date ' + ui.date(focus.payDate) : 'nothing waiting') + '</em></div><div class="mstat"><span>Last paid</span><b>' + (lastPaid ? ui.money(R.summarise(lastPaid.records).net) : '—') + '</b><em>' + (lastPaid ? 'net · ' + ui.range(lastPaid.start, lastPaid.end) : '') + '</em></div></div>';
    return {
      title: 'Payroll', wide: true,
      html: app.ph('Payroll', ui.esc(P.frequency.charAt(0).toUpperCase() + P.frequency.slice(1)) + ' pay periods · pay date ' + P.payDateOffset + ' days after the period ends ' + ui.demoTag('Demo calculations'), (store.can('org.settings') ? '<a class="btn btn--sm" href="#/settings?tab=payroll">' + I('settings', 14) + 'Payroll rules</a>' : '') + '<a class="btn btn--p btn--sm" href="#/payroll/' + focus.id + '">' + I('wallet', 15) + (toProcess.length ? 'Process ' + ui.range(focus.start, focus.end) : 'Open current period') + '</a>') +
        strip + '<div class="note note--plain" style="margin:14px 0">' + I('shield', 15) + '<span><b>KINTRA records payroll; it doesn’t pay anyone.</b> After approval, pay through your bank or payroll provider, then record the payment date and reference here. Deduction rules are configurable examples: confirm statutory rates for your country before using real figures.</span></div>' +
        '<div class="card" id="pt"></div>',
      mount: function (v) {
        ui.table(v.querySelector('#pt'), { rows: periods, onRowClick: function (p) { app.go('#/payroll/' + p.id); },
          columns: [
            { key: 'start', label: 'Pay period', render: function (p) { return '<b>' + ui.range(p.start, p.end) + '</b>'; } },
            { key: 'payDate', label: 'Pay date', render: function (p) { return ui.date(p.payDate); } },
            { key: 'status', label: 'Status', render: function (p) { var s = statusLabel(p); return ui.badge(s[0], s[1]) + (p.stale ? ' ' + ui.badge('pending', 'Needs recalculation') : ''); } },
            { key: 'n', label: 'Employees', align: 'r', render: function (p) { return p.records ? p.records.length : '<span class="muted">' + store.periodEmployees(p).length + '</span>'; }, sort: false },
            { key: 'gross', label: 'Gross', align: 'r', render: function (p) { return p.records ? ui.money(R.summarise(p.records).gross) : '<span class="muted">—</span>'; }, sort: false },
            { key: 'net', label: 'Net', align: 'r', render: function (p) { return p.records ? ui.money(R.summarise(p.records).net) : '<span class="muted">—</span>'; }, sort: false },
            { key: 'cost', label: 'Employer cost', align: 'r', render: function (p) { return p.records ? ui.money(R.summarise(p.records).cost) : '<span class="muted">—</span>'; }, sort: false },
            { key: 'paid', label: 'Payment', render: function (p) { return p.paid ? ui.date(p.paid.date) + ' <span class="muted small">' + ui.esc(p.paid.reference) + '</span>' : '<span class="muted">—</span>'; }, sort: false }
          ] });
      }
    };
  });

  /* ---------- period workspace ---------- */
  KT.route('/payroll/:id', function (p0, q) {
    if (!store.can('payroll.view')) return { title: 'Payroll', html: app.locked('Payroll is restricted', 'payroll.view') };
    var p = store.period(p0.id); if (!p) return null;
    var S = store.state, today = store.today(), recs = recordsOf(p), sum = R.summarise(recs), ts = store.timesheetStatus(p), st = statusLabel(p);
    var me = store.me(), canRun = store.can('payroll.run'), canAppr = store.can('payroll.approve');
    var ended = p.end < today;
    var steps = [
      ['Period', ui.range(p.start, p.end), 'done'],
      ['Timesheets', ts.pending ? ts.pending + ' not approved' : 'All approved', ts.pending ? (p.status === 'open' ? 'cur warn' : 'warn') : 'done'],
      ['Calculate', p.calculatedAt ? ui.dt(p.calculatedAt) : 'Not yet', p.calculatedAt && !p.stale ? 'done' : p.status === 'open' && !ts.pending ? 'cur' : ''],
      ['Review', sum.flags ? ui.plural(sum.flags, 'item') + ' flagged' : 'No flags', p.status === 'calculated' ? 'cur' : p.status === 'approved' || p.status === 'paid' ? 'done' : ''],
      ['Approve', p.approvedAt ? store.userName(p.approvedBy) : 'By ' + ui.date(due(p)), p.status === 'approved' || p.status === 'paid' ? 'done' : ''],
      ['Record payment', p.paid ? ui.date(p.paid.date) : 'Pay date ' + ui.date(p.payDate), p.status === 'paid' ? 'done' : p.status === 'approved' ? 'cur' : '']
    ];
    var stepper = '<div class="psteps">' + steps.map(function (s) { return '<div class="pstep ' + s[2] + '"><b>' + s[0] + '</b><span>' + ui.esc(s[1]) + '</span></div>'; }).join('') + '</div>';
    // primary action for the current state
    var act = '', note = '';
    if (p.status === 'open') {
      if (!ended) note = '<div class="note note--info">' + I('info', 15) + '<span>This period is still running until ' + ui.date(p.end) + '. Figures below are a live preview from today’s timesheets.</span></div>';
      if (ts.ids.length && store.canAny('attendance.approve')) act += '<button class="btn btn--sm" data-apprts>' + I('check', 14) + 'Approve ' + ui.plural(ts.ids.length, 'timesheet') + '</button>';
      act += '<a class="btn btn--sm" href="#/attendance?from=' + p.start + '&to=' + (p.end < today ? p.end : today) + '&status=pending">' + I('clock', 14) + 'Review timesheets</a>';
      if (canRun) act += '<button class="btn btn--p btn--sm" data-calc>' + I('zap', 14) + 'Calculate payroll</button>';
    } else if (p.status === 'calculated') {
      if (p.stale) note = '<div class="note">' + I('alert', 15) + '<span>Timesheets, leave or pay details changed after this payroll was calculated on ' + ui.dt(p.calculatedAt) + '. Recalculate before approving.</span></div>';
      if (canRun) act += '<button class="btn btn--sm" data-calc>' + I('refresh', 14) + 'Recalculate</button>';
      if (canAppr) act += '<button class="btn btn--sm" data-reopen>Reopen</button><button class="btn btn--p btn--sm" data-approve>' + I('approve', 14) + 'Approve payroll</button>';
      else note += '<div class="note note--plain" style="margin-top:6px">' + I('lock', 15) + '<span>Approval needs the Payroll Manager or Owner role.</span></div>';
      if (S.org.approvals.payroll === 'separate' && p.calculatedBy === me.id && canAppr) note += '<div class="note note--plain" style="margin-top:6px">' + I('users', 15) + '<span>You calculated this payroll. Your organisation requires someone else to approve it; switch to the owner (Wairimu Kamau) to try that step.</span></div>';
    } else if (p.status === 'approved') {
      note = '<div class="note note--info">' + I('info', 15) + '<span>Approved by ' + ui.esc(store.userName(p.approvedBy)) + ' on ' + ui.dt(p.approvedAt) + '. Make the payment through your bank or payroll provider, then record it here. Clock records in this period are locked.</span></div>';
      if (canAppr) act += '<button class="btn btn--sm" data-reopen>Reopen</button>';
      if (canRun) act += '<button class="btn btn--p btn--sm" data-paid>' + I('check', 14) + 'Record payment</button>';
    } else if (p.status === 'paid') {
      note = '<div class="note note--ok">' + I('check', 15) + '<span>Payment recorded for ' + ui.date(p.paid.date) + ' (reference ' + ui.esc(p.paid.reference) + ') by ' + ui.esc(store.userName(p.paid.recordedBy)) + '. This is a record of a payment made outside KINTRA.</span></div>';
    }
    var cards = '<div class="mstrip" style="--n:6;margin-top:12px"><div class="mstat"><span>Gross pay</span><b>' + ui.money(sum.gross) + '</b><em>' + sum.count + ' employees</em></div><div class="mstat"><span>Deductions</span><b>' + ui.money(sum.deductions) + '</b><em>employee share</em></div><div class="mstat"><span>Net pay</span><b>' + ui.money(sum.net) + '</b><em>to be paid</em></div><div class="mstat"><span>Employer contributions</span><b>' + ui.money(sum.employer) + '</b><em>configured rules</em></div><div class="mstat"><span>Total cost</span><b>' + ui.money(sum.cost) + '</b><em>gross + employer</em></div><div class="mstat' + (sum.overtime ? ' mstat--warn' : '') + '"><span>Hours paid</span><b>' + ui.num(sum.hours) + '</b><em>' + ui.dec(sum.overtime) + ' h overtime</em></div></div>';
    var flagged = recs.filter(function (r) { return r.flags.some(function (f) { return f.level !== 'info'; }); });
    var exc = flagged.length ? '<div class="card" style="margin-top:14px"><div class="card__h"><h2>' + I('alert', 16) + 'Exceptions to review</h2><span class="sub">' + flagged.length + ' employees</span></div>' + flagged.slice(0, 8).map(function (r) { var e = store.emp(r.employeeId); return '<button type="button" class="lrow" data-rec="' + r.employeeId + '">' + ui.avatar(store.name(e), 'sm') + '<span class="lrow__m"><div class="lrow__t">' + ui.esc(store.name(e)) + '</div><div class="lrow__s">' + r.flags.filter(function (f) { return f.level !== 'info'; }).map(function (f) { return ui.esc(f.text); }).join(' · ') + '</div></span><span class="lrow__r">' + I('chevR', 14) + '</span></button>'; }).join('') + (flagged.length > 8 ? '<div class="card__f"><span class="muted small">+' + (flagged.length - 8) + ' more in the table below (filter “With flags”)</span></div>' : '') + '</div>' : '';
    var hist = '<div class="card" style="margin-top:14px"><div class="card__h"><h2>' + I('history', 16) + 'Payroll history</h2></div><div class="card__b"><div class="timeline">' + ((p.history || []).length ? p.history.slice().reverse().map(function (h) { return '<div class="tl"><span class="tl__i acc">' + I('check', 11) + '</span><div><div class="tl__t">' + ui.esc(h.action) + (h.note ? ' · ' + ui.esc(h.note) : '') + '</div><div class="tl__s">' + ui.esc(store.userName(h.by)) + ' · ' + ui.dt(h.at) + '</div></div></div>'; }).join('') : '<p class="muted">Nothing recorded yet.</p>') + '</div></div></div>';
    var flt = q.f || '';
    return {
      title: 'Payroll ' + ui.range(p.start, p.end), crumbs: [['Payroll', '#/payroll']], wide: true,
      html: '<div class="ph"><div><h1>Payroll · ' + ui.range(p.start, p.end) + '</h1><p>' + ui.badge(st[0], st[1]) + ' · pay date ' + ui.date(p.payDate, { dow: true }) + (p.status !== 'paid' ? ' · approve by ' + ui.date(due(p)) : '') + ' ' + ui.demoTag(p.records ? 'Demo calculation' : 'Preview') + '</p></div><div class="ph__acts">' + act + '</div></div>' + stepper + note + cards + exc +
        '<div class="card" style="margin-top:14px"><div class="tbar"><div class="search-inp">' + I('search', 14) + '<input class="inp inp--sm" type="search" placeholder="Search employee" data-s aria-label="Search employee"></div>' + ui.select('f', [{ value: '', label: 'All employees' }, { value: 'flags', label: 'With flags (' + flagged.length + ')' }, { value: 'hourly', label: 'Hourly' }, { value: 'salaried', label: 'Salaried' }], flt, { cls: 'sel--sm', attr: ' aria-label="Filter"' }) + ui.select('loc', [{ value: '', label: 'All locations' }].concat(S.locations.map(function (l) { return { value: l.id, label: l.name }; })), q.loc || '', { cls: 'sel--sm', attr: ' aria-label="Location"' }) + '<span class="sp"></span><button class="btn btn--sm" data-csv="sum">' + I('download', 14) + 'Summary CSV</button><button class="btn btn--sm" data-csv="det">' + I('download', 14) + 'Detailed CSV</button></div><div id="prt"></div></div>' + hist,
      mount: function (v) {
        var flagsHtml = function (r) { var f = r.flags.filter(function (x) { return x.level !== 'info'; }); return f.length ? f.map(function (x) { return '<span class="bdg bdg--' + (x.level === 'err' ? 'red' : 'amber') + '" title="' + ui.esc(x.text) + '">' + I('alert', 11) + (x.code === 'pending' ? 'Unapproved' : x.code === 'missed_out' ? 'No clock-out' : x.code === 'no_rate' ? 'No rate' : x.code === 'negative' ? 'Negative' : 'Check') + '</span>'; }).join(' ') : (r.flags.length ? '<span class="muted small">' + ui.esc(r.flags[0].text) + '</span>' : '<span class="muted">—</span>'); };
        function rows() { var s = (v.querySelector('[data-s]').value || '').toLowerCase(), f = v.querySelector('[name=f]').value, l = v.querySelector('[name=loc]').value; return recs.filter(function (r) { var e = store.emp(r.employeeId); if (s && store.name(e).toLowerCase().indexOf(s) < 0) return false; if (l && e.locationId !== l) return false; if (f === 'flags') return flagged.indexOf(r) >= 0; if (f === 'hourly' || f === 'salaried') return r.payType === f; return true; }); }
        var t = ui.table(v.querySelector('#prt'), { rows: rows(), pageSize: 50, showCount: true, rowId: function (r) { return r.employeeId; }, initialSort: { key: 'emp', dir: 'asc' }, onRowClick: function (r) { KT.v.payslip(p, r.employeeId); },
          columns: [
            { key: 'emp', label: 'Employee', render: function (r) { return app.empCell(store.emp(r.employeeId), store.role(store.emp(r.employeeId).jobRoleId).name + ' · ' + store.locName(store.emp(r.employeeId).locationId)); }, sort: function (r) { return store.empName(r.employeeId); } },
            { key: 'type', label: 'Pay', render: function (r) { return r.payType === 'hourly' ? ui.money(r.rate) + '/h' : 'Salary'; }, sort: function (r) { return r.payType; } },
            { key: 'reg', label: 'Regular h', align: 'r', render: function (r) { return ui.dec(r.hours.regular); }, sort: function (r) { return r.hours.regular; } },
            { key: 'ot', label: 'OT h', align: 'r', render: function (r) { return r.hours.overtime ? '<b>' + ui.dec(r.hours.overtime) + '</b>' : '<span class="muted">0</span>'; }, sort: function (r) { return r.hours.overtime; } },
            { key: 'hol', label: 'Holiday h', align: 'r', render: function (r) { return r.hours.holiday ? ui.dec(r.hours.holiday) : '<span class="muted">0</span>'; }, sort: function (r) { return r.hours.holiday; } },
            { key: 'gross', label: 'Gross', align: 'r', render: function (r) { return ui.money(r.gross, { noCur: true }); }, sort: function (r) { return r.gross; } },
            { key: 'ded', label: 'Deductions', align: 'r', render: function (r) { return ui.money(r.totalDeductions, { noCur: true }); }, sort: function (r) { return r.totalDeductions; } },
            { key: 'net', label: 'Net', align: 'r', render: function (r) { return '<b>' + ui.money(r.net, { noCur: true }) + '</b>'; }, sort: function (r) { return r.net; } },
            { key: 'emp2', label: 'Employer', align: 'r', render: function (r) { return ui.money(r.totalEmployer, { noCur: true }); }, sort: function (r) { return r.totalEmployer; } },
            { key: 'flags', label: 'Flags', render: flagsHtml, sort: function (r) { return r.flags.filter(function (x) { return x.level !== 'info'; }).length; }, defaultDir: 'desc' }
          ], empty: ui.empty('wallet', 'No employees match', '') });
        v.querySelector('[data-s]').addEventListener('input', ui.debounce(function () { t.setRows(rows()); }, 150));
        v.querySelector('[name=f]').onchange = function () { q.f = this.value; app.updateQuery(q); t.setRows(rows()); };
        v.querySelector('[name=loc]').onchange = function () { q.loc = this.value; app.updateQuery(q); t.setRows(rows()); };
        v.querySelectorAll('[data-rec]').forEach(function (b) { b.onclick = function () { KT.v.payslip(p, b.getAttribute('data-rec')); }; });
        var tag = p.records ? '' : '-preview';
        v.querySelectorAll('[data-csv]').forEach(function (b) { b.onclick = function () {
          var list = t.rows();
          if (b.getAttribute('data-csv') === 'sum') ui.csv('kintra-payroll-' + p.start + '_' + p.end + tag + '-summary.csv', [{ label: 'Employee', csv: function (r) { return store.empName(r.employeeId); } }, { label: 'Employee ID', csv: function (r) { return r.employeeId.toUpperCase(); } }, { label: 'Location', csv: function (r) { return store.locName(store.emp(r.employeeId).locationId); } }, { label: 'Pay type', key: 'payType' }, { label: 'Regular hours', csv: function (r) { return r.hours.regular; } }, { label: 'Overtime hours', csv: function (r) { return r.hours.overtime; } }, { label: 'Holiday hours', csv: function (r) { return r.hours.holiday; } }, { label: 'Paid leave hours', csv: function (r) { return r.hours.leave; } }, { label: 'Gross', key: 'gross' }, { label: 'Deductions', key: 'totalDeductions' }, { label: 'Net', key: 'net' }, { label: 'Employer contributions', key: 'totalEmployer' }, { label: 'Total cost', key: 'cost' }, { label: 'Flags', csv: function (r) { return r.flags.map(function (f) { return f.text; }).join('; '); } }, { label: 'Status', csv: function () { return p.records ? p.status : 'preview'; } }, { label: 'Demo data', csv: function () { return 'yes'; } }], list);
          else { var lines = []; list.forEach(function (r) { var n = store.empName(r.employeeId); r.earnings.forEach(function (x) { lines.push({ e: n, k: 'Earning', l: x.label, q: x.qty, rt: x.rate, a: x.amount }); }); r.deductions.forEach(function (x) { lines.push({ e: n, k: 'Deduction', l: x.name, a: -x.amount }); }); r.employer.forEach(function (x) { lines.push({ e: n, k: 'Employer contribution', l: x.name, a: x.amount }); }); lines.push({ e: n, k: 'Net pay', l: 'Net', a: r.net }); }); ui.csv('kintra-payroll-' + p.start + '_' + p.end + tag + '-detail.csv', [{ label: 'Employee', key: 'e' }, { label: 'Line type', key: 'k' }, { label: 'Description', key: 'l' }, { label: 'Quantity', key: 'q' }, { label: 'Rate', key: 'rt' }, { label: 'Amount', key: 'a' }], lines); }
        }; });
        var c = v.querySelector('[data-calc]'); if (c) c.onclick = function () {
          var go = function () { var s = ui.run(function () { return store.calculate(p.id); }); if (s) ui.toast('Payroll calculated: ' + s.count + ' employees, ' + ui.plural(s.flags, 'item') + ' to review'); };
          if (ts.pending || !ended) ui.confirm({ title: 'Calculate with unapproved timesheets?', body: (ts.pending ? ui.plural(ts.pending, 'timesheet is', 'timesheets are') + ' not approved. Only approved hours are paid; the rest are flagged and left out.' : '') + (!ended ? ' The period hasn’t ended, so more hours may still come in.' : ''), ok: 'Calculate anyway' }).then(function (ok) { if (ok) go(); });
          else go();
        };
        var at = v.querySelector('[data-apprts]'); if (at) at.onclick = function () { ui.confirm({ title: 'Approve ' + ui.plural(ts.ids.length, 'timesheet') + '?', body: 'Approves every completed clock record in ' + ui.range(p.start, p.end) + ' that you’re allowed to approve. Records without a clock-out stay pending; review exceptions in Attendance first if needed.', ok: 'Approve timesheets' }).then(function (ok) { if (!ok) return; var r = ui.run(function () { return store.approveEntries(ts.ids); }); if (r) ui.toast('Approved ' + ui.plural(r.done, 'timesheet') + (r.skipped.length ? ' · ' + r.skipped.length + ' skipped' : ''), r.skipped.length ? 'info' : 'ok'); }); };
        var ap = v.querySelector('[data-approve]'); if (ap) ap.onclick = function () { ui.confirm({ title: 'Approve payroll for ' + ui.range(p.start, p.end) + '?', body: 'Net pay ' + ui.money(sum.net) + ' for ' + sum.count + ' employees' + (sum.flags ? ', with ' + ui.plural(sum.flags, 'flagged item') : '') + '. Approval locks clock records in this period. No money moves until you pay through your bank or provider.', ok: 'Approve payroll' }).then(function (ok) { if (ok) ui.run(function () { store.approvePayroll(p.id); }, 'Payroll approved'); }); };
        var ro = v.querySelector('[data-reopen]'); if (ro) ro.onclick = function () { ui.modal({ title: 'Reopen this payroll?', body: ui.field('Reason', '<input class="inp" name="r" placeholder="e.g. Late timesheet correction for Kevin Otieno">', { req: true, hint: 'Kept in the payroll history.' }), ok: 'Reopen', danger: true, onOk: function (a) { return !!ui.run(function () { store.reopenPayroll(p.id, a.el.querySelector('[name=r]').value); }, 'Payroll reopened'); } }); };
        var pd = v.querySelector('[data-paid]'); if (pd) pd.onclick = function () { ui.modal({ title: 'Record payment', sub: 'Net ' + ui.money(sum.net) + ' · ' + sum.count + ' employees', body: '<div class="fgrid">' + ui.field('Payment date', '<input class="inp" type="date" name="d" value="' + (p.payDate <= today ? p.payDate : today) + '" max="' + today + '">', { req: true }) + ui.field('Bank or provider reference', '<input class="inp" name="ref" placeholder="e.g. batch number">', { req: true }) + '<div class="f f--full"><label class="cbx" style="align-items:flex-start"><input type="checkbox" class="chk" name="c" style="margin-top:2px"> <span>I confirm this payroll has been paid through our bank or payroll provider. KINTRA only records it.</span></label></div></div>', ok: 'Record payment', onOk: function (a) { return !!ui.run(function () { store.recordPayment(p.id, { date: a.el.querySelector('[name=d]').value, reference: a.el.querySelector('[name=ref]').value, confirm: a.el.querySelector('[name=c]').checked }); }, 'Payment recorded'); } }); };
      }
    };
  });
})();
