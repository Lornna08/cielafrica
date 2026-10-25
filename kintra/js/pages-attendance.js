/* ============================================================
   KINTRA — Attendance (timesheet review, corrections with audit
   trail, approvals) and the employee time clock.
   ============================================================ */
(function () {
  'use strict';
  var ui = KT.ui, store = KT.store, R = KT.rules, app = KT.app, I = ui.icon;

  var EXC = [['', 'All records'], ['any', 'Any exception'], ['late', 'Late arrival'], ['early', 'Left early'], ['absent', 'Absent'], ['missed_in', 'Not clocked in'], ['missed_out', 'Missed clock-out'], ['unscheduled', 'Unscheduled'], ['pending', 'Awaiting approval'], ['corrected', 'Corrected']];
  function flagsOf(r) {
    var f = r.ev.flags.slice();
    if (r.ev.state === 'missing_out' && f.indexOf('missed_out') < 0) f.push('missed_out');
    return f;
  }
  function stateHtml(r) {
    var ev = r.ev, out = [];
    if (['working', 'on_break', 'not_in', 'absent', 'missing_out', 'on_leave', 'upcoming', 'due'].indexOf(ev.state) >= 0) out.push(ui.badge(ev.state));
    if (ev.late) out.push(ui.badge('late', 'Late ' + ui.hm(ev.late)));
    if (ev.early) out.push(ui.badge('early', 'Left ' + ui.hm(ev.early) + ' early'));
    if (!r.shift) out.push(ui.badge('unscheduled'));
    if (r.entry && r.entry.corrections && r.entry.corrections.length) out.push(ui.tag('Corrected', 'blue'));
    if (!out.length) out.push(ui.badge('done', 'On time', 'green'));
    return out.join(' ');
  }
  function brk(en) { return en ? Math.round(R.breakMinutes(en, en.out ? R.abs(en.out) : store.now().abs)) : 0; }
  function match(r, exc) {
    var f = flagsOf(r);
    if (!exc) return true;
    if (exc === 'any') return f.length > 0;
    if (exc === 'pending') return r.entry && r.entry.status !== 'approved';
    if (exc === 'corrected') return r.entry && r.entry.corrections && r.entry.corrections.length;
    return f.indexOf(exc) >= 0;
  }

  /* ---------- record drawer: details, correction, approval ---------- */
  function recordDrawer(row) {
    var en = row.entry, sh = row.shift, e = store.emp(row.empId), canFix = store.can('attendance.correct', row.locationId), canAppr = store.can('attendance.approve', row.locationId);
    var ev = row.ev, n = store.now();
    var head = '<div class="row" style="gap:12px;margin-bottom:14px">' + ui.avatar(store.name(e), 'lg') + '<div><div class="strong" style="font-size:15px">' + ui.esc(store.name(e)) + '</div><div class="muted">' + ui.esc(store.role(e.jobRoleId).name) + ' · ' + ui.esc(store.locName(row.locationId)) + '</div></div></div>';
    var info = '<dl class="kv"><dt>Date</dt><dd>' + ui.date(row.date, { dow: true, year: true }) + '</dd><dt>Scheduled</dt><dd>' + (sh ? sh.start + '–' + sh.end + ' · ' + ui.hm(R.shiftMinutes(sh)) + ' paid' + (sh.breakMin ? ', ' + sh.breakMin + ' min break' : '') : 'No scheduled shift') + '</dd>' +
      '<dt>Clock-in</dt><dd>' + (en ? ui.time(en.in) + (ev.late ? ' <span class="bdg bdg--amber">' + ui.hm(ev.late) + ' late</span>' : '') : '—') + '</dd><dt>Clock-out</dt><dd>' + (en && en.out ? ui.time(en.out) + (en.out.slice(0, 10) !== row.date ? ' (next day)' : '') + (ev.early ? ' <span class="bdg bdg--amber">' + ui.hm(ev.early) + ' early</span>' : '') : en ? '<span class="bdg bdg--red">Missing</span>' : '—') + '</dd>' +
      '<dt>Breaks</dt><dd>' + (en && en.breaks && en.breaks.length ? en.breaks.map(function (b) { return ui.time(b.s) + '–' + (b.e ? ui.time(b.e) : 'now'); }).join(', ') + ' (' + brk(en) + ' min)' : '—') + '</dd>' +
      '<dt>Worked</dt><dd class="num">' + (en ? ui.hm(ev.workedMin) : '—') + (ev.state === 'done' && sh ? ' <span class="' + (ev.variance >= 0 ? 'var-pos' : 'var-neg') + '">(' + (ev.variance >= 0 ? '+' : '−') + ui.hm(ev.variance) + ')</span>' : '') + '</dd>' +
      '<dt>Source</dt><dd>' + (en ? (en.source === 'manual' ? 'Manual entry by a manager' : 'KINTRA time clock') : '—') + '</dd>' +
      '<dt>Timesheet</dt><dd>' + (en ? ui.badge(en.status) + (en.approvedBy ? ' <span class="muted small">by ' + ui.esc(store.userName(en.approvedBy)) + ', ' + ui.dt(en.approvedAt) + '</span>' : '') : '—') + '</dd>' + (en && en.note ? '<dt>Note</dt><dd>' + ui.esc(en.note) + '</dd>' : '') + '</dl>';
    var p = store.periodFor(row.date), locked = p && (p.status === 'approved' || p.status === 'paid');
    var corr = en && en.corrections && en.corrections.length ? '<h4 class="flabel" style="margin:16px 0 6px">Correction history</h4>' + en.corrections.slice().reverse().map(function (c) { return '<div class="corr"><b>' + ui.esc(c.field) + '</b>: ' + ui.esc(c.from) + ' → ' + ui.esc(c.to) + '<div class="muted small">' + ui.esc(store.userName(c.by)) + ' · ' + ui.dt(c.at) + ' · “' + ui.esc(c.reason) + '”</div></div>'; }).join('') : '';
    var form = '';
    if (canFix && !locked && (en || (sh && ev.state === 'absent'))) {
      var inV = en ? en.in : row.date + 'T' + sh.start, outV = en && en.out ? en.out : (sh ? R.fromAbs(Math.min(R.span(sh).e, n.abs)) : '');
      form = '<details class="shf-hist" ' + (ev.state === 'missing_out' || ev.state === 'absent' ? 'open' : '') + '><summary>' + (en ? 'Correct this record' : 'Add a clock record') + '</summary><form id="corrf" style="margin-top:12px" novalidate><div class="fgrid">' +
        ui.field('Clock-in', '<input class="inp" type="datetime-local" name="in" value="' + (inV || '') + '" required>', { req: true }) +
        ui.field('Clock-out', '<input class="inp" type="datetime-local" name="out" value="' + (outV || '') + '"' + (en ? '' : ' required') + '>', { req: !en, hint: en ? 'Leave empty if they’re still working.' : '' }) +
        ui.field('Break (minutes)', ui.input('breakMin', en ? brk(en) : (sh ? sh.breakMin : 0), { type: 'number', min: 0, step: 5 })) +
        ui.field('Reason', '<input class="inp" name="reason" placeholder="e.g. Forgot to clock out; confirmed with supervisor" required>', { req: true, full: true, hint: 'Kept with the record and in the audit log.' }) +
        '</div><div class="row" style="margin-top:12px;justify-content:flex-end"><button class="btn btn--p btn--sm" type="submit">' + (en ? 'Save correction' : 'Add record') + '</button></div></form></details>';
    } else if (locked) form = '<div class="note note--plain" style="margin-top:14px">' + I('lock', 14) + '<span>Payroll for ' + ui.range(p.start, p.end) + ' is ' + p.status + ', so this record is locked. Reopen the payroll to change it.</span></div>';
    else if (!canFix && store.isManager()) form = '<div class="note note--plain" style="margin-top:14px">' + I('lock', 14) + '<span>' + ui.esc(store.why('attendance.correct', row.locationId)) + '</span></div>';
    var foot = '<span class="sp"></span><button class="btn" data-x>Close</button>' + (en && en.status !== 'approved' && canAppr ? '<button class="btn btn--p" data-appr' + (en.out ? '' : ' disabled title="Needs a clock-out first"') + '>' + I('check', 15) + 'Approve timesheet</button>' : '');
    var m = ui.modal({ title: 'Attendance record', sub: ui.date(row.date, { dow: true }) + (sh ? ' · ' + sh.start + '–' + sh.end : ''), drawer: true, body: head + '<div class="row wrap" style="gap:6px;margin-bottom:12px">' + stateHtml(row) + '</div>' + info + corr + form, foot: foot });
    var f = m.el.querySelector('#corrf');
    if (f) f.onsubmit = function (ev2) {
      ev2.preventDefault();
      var d = ui.read(f), ok;
      if (en) ok = ui.run(function () { return store.correctEntry(en.id, { in: d.in, out: d.out || null, breakMin: d.breakMin }, d.reason); }, 'Correction saved. The timesheet needs approval again.');
      else ok = ui.run(function () { return store.addEntry(sh.id, { in: d.in, out: d.out, breakMin: d.breakMin }, d.reason); }, 'Clock record added');
      if (ok) m.close();
    };
    var ab = m.el.querySelector('[data-appr]');
    if (ab) ab.onclick = function () { var r = ui.run(function () { return store.approveEntries([en.id]); }); if (r) { if (r.done) { ui.toast('Timesheet approved'); m.close(); } else ui.toast(r.skipped[0] || 'Not approved', 'err'); } };
  }
  KT.v.recordDrawer = recordDrawer;

  /* ---------- attendance page ---------- */
  KT.route('/attendance', function (p, q) {
    if (!store.canAny('attendance.view')) return { title: 'Attendance', html: app.ph('Attendance') + app.locked('Attendance is for managers', 'attendance.view') };
    var S = store.state, today = store.today();
    var from = q.from || q.date || today, to = q.to || q.date || today;
    if (to < from) to = from;
    var exc = q.exc || '', dept = q.dept || '', st = q.status || '', who = (q.who || '').toLowerCase();
    var rows = store.attendance(from, to).filter(function (r) { var e = store.emp(r.empId); if (!e) return false; if (dept && e.deptId !== dept) return false; if (who && store.name(e).toLowerCase().indexOf(who) < 0) return false; if (st === 'approved' && !(r.entry && r.entry.status === 'approved')) return false; if (st === 'pending' && !(r.entry && r.entry.status !== 'approved')) return false; return r.ev.state !== 'upcoming' && r.ev.state !== 'due' || from > today; });
    var shown = rows.filter(function (r) { return match(r, exc); });
    var cnt = {}; EXC.forEach(function (x) { if (x[0]) cnt[x[0]] = rows.filter(function (r) { return match(r, x[0]); }).length; });
    var sched = rows.reduce(function (a, r) { return a + (r.shift && r.ev.state !== 'on_leave' ? R.shiftMinutes(r.shift) : 0); }, 0), worked = rows.reduce(function (a, r) { return a + r.ev.workedMin; }, 0);
    var live = { working: 1, upcoming: 1, due: 1, not_in: 1, on_break: 1 }, fin = rows.filter(function (r) { return !live[r.ev.state] && r.ev.state !== 'on_leave'; }), finVar = fin.reduce(function (a, r) { return a + r.ev.workedMin - (r.shift ? R.shiftMinutes(r.shift) : 0); }, 0), inProg = rows.length - fin.length - rows.filter(function (r) { return r.ev.state === 'on_leave'; }).length;
    var withShift = rows.filter(function (r) { return r.shift && r.entry; }), ontime = withShift.filter(function (r) { return !r.ev.late; }).length;
    var quick = [['Today', today, today], ['Yesterday', R.addDays(today, -1), R.addDays(today, -1)], ['This week', R.weekStart(today, S.org.weekStart), today]];
    var per = store.periodFor(today), prev = per && store.periodFor(R.addDays(per.start, -1));
    if (prev) quick.push(['Last pay period', prev.start, prev.end]);
    var strip = '<div class="mstrip" style="--n:6"><div class="mstat"><span>Records</span><b>' + rows.length + '</b><em>' + ui.range(from, to) + '</em></div><div class="mstat"><span>On time</span><b>' + (withShift.length ? Math.round(ontime / withShift.length * 100) : 0) + '<small>%</small></b><em>of ' + withShift.length + ' clock-ins</em></div><a class="mstat' + (cnt.late ? ' mstat--warn' : '') + '" href="#" data-exc="late"><span>Late arrivals</span><b>' + cnt.late + '</b><em>' + cnt.early + ' left early</em></a><a class="mstat' + (cnt.absent + cnt.missed_in ? ' mstat--bad' : '') + '" href="#" data-exc="absent"><span>Absent</span><b>' + cnt.absent + '</b><em>' + cnt.missed_in + ' not clocked in yet</em></a><a class="mstat' + (cnt.missed_out ? ' mstat--bad' : '') + '" href="#" data-exc="missed_out"><span>Missed clock-outs</span><b>' + cnt.missed_out + '</b><em>' + cnt.unscheduled + ' unscheduled</em></a><div class="mstat"><span>Hours worked</span><b>' + ui.hrs(worked, true) + '<small> / ' + ui.hrs(sched, true) + ' h</small></b><em class="' + (fin.length ? (finVar < 0 ? 'var-neg' : 'var-pos') : '') + '">' + (fin.length ? (finVar >= 0 ? '+' : '−') + ui.hm(finVar) + ' on finished shifts' : 'all shifts still in progress') + (fin.length && inProg > 0 ? ' · ' + inProg + ' in progress' : '') + '</em></div></div>';
    var bar = '<div class="att-bar"><div class="seg">' + quick.map(function (x) { return '<button type="button" data-q="' + x[1] + '|' + x[2] + '" class="' + (from === x[1] && to === x[2] ? 'on' : '') + '">' + x[0] + '</button>'; }).join('') + '</div><label class="sr" for="af">From</label><input class="inp inp--sm" type="date" id="af" value="' + from + '"><span class="muted">to</span><label class="sr" for="at">To</label><input class="inp inp--sm" type="date" id="at" value="' + to + '"></div>' +
      '<div class="att-bar"><div class="search-inp" style="flex:1;max-width:260px">' + I('search', 14) + '<input class="inp inp--sm" type="search" placeholder="Filter by employee" value="' + ui.esc(q.who || '') + '" data-who aria-label="Filter by employee"></div>' + ui.select('dept', app.deptOptions(true), dept, { cls: 'sel--sm', attr: ' aria-label="Department"' }) + ui.select('exc', EXC.map(function (x) { return { value: x[0], label: x[1] + (x[0] ? ' (' + cnt[x[0]] + ')' : '') }; }), exc, { cls: 'sel--sm', attr: ' aria-label="Exception"' }) + ui.select('status', [{ value: '', label: 'Any approval' }, { value: 'pending', label: 'Awaiting approval' }, { value: 'approved', label: 'Approved' }], st, { cls: 'sel--sm', attr: ' aria-label="Approval status"' }) + '</div>';
    return {
      title: 'Attendance', wide: true,
      html: app.ph('Attendance', 'Scheduled versus actual hours, exceptions and timesheet approval.', '<button class="btn btn--sm" data-csv>' + I('download', 14) + 'Export CSV</button>') + bar + strip + '<div class="card" style="margin-top:12px" id="att-t"></div><p class="muted small" style="margin-top:10px">' + I('info', 13).replace('<svg', '<svg style="display:inline;vertical-align:-2px;margin-right:4px"') + 'Clock records come from the KINTRA time clock or manual manager entries. GPS checks, biometric terminals and wall kiosks are possible future integrations and are not active in this template.</p>',
      mount: function (v) {
        function upd(o) { Object.keys(o).forEach(function (k) { q[k] = o[k]; }); delete q.date; app.updateQuery(q); app.refresh(); }
        v.querySelectorAll('[data-q]').forEach(function (b) { b.onclick = function () { var x = b.getAttribute('data-q').split('|'); upd({ from: x[0], to: x[1] }); }; });
        v.querySelector('#af').onchange = function (e) { if (e.target.value) upd({ from: e.target.value, to: e.target.value > to ? e.target.value : to }); };
        v.querySelector('#at').onchange = function (e) { if (e.target.value) upd({ to: e.target.value, from: e.target.value < from ? e.target.value : from }); };
        ['dept', 'exc', 'status'].forEach(function (k) { v.querySelector('[name=' + k + ']').onchange = function (e) { var o = {}; o[k] = e.target.value; upd(o); }; });
        v.querySelectorAll('[data-exc]').forEach(function (a) { a.onclick = function (e) { e.preventDefault(); upd({ exc: a.getAttribute('data-exc') }); }; });
        var w = v.querySelector('[data-who]'); w.addEventListener('input', ui.debounce(function () { q.who = w.value; app.updateQuery(q); tbl.setRows(filtered()); }, 200));
        function filtered() { var ww = (q.who || '').toLowerCase(); return shown.filter(function (r) { return !ww || store.empName(r.empId).toLowerCase().indexOf(ww) >= 0; }); }
        var cols = [
          { key: 'emp', label: 'Employee', render: function (r) { return app.empCell(store.emp(r.empId), store.locName(r.locationId)); }, sort: function (r) { return store.empName(r.empId); } },
          { key: 'date', label: 'Date', render: function (r) { return ui.date(r.date, { dow: true }); }, sort: function (r) { return r.date + (r.shift ? r.shift.start : r.entry.in.slice(11)); } },
          { key: 'sched', label: 'Scheduled', render: function (r) { return r.shift ? r.shift.start + '–' + r.shift.end : '<span class="muted">—</span>'; }, sort: function (r) { return r.shift ? r.shift.start : ''; } },
          { key: 'in', label: 'In', render: function (r) { return r.entry ? '<span class="' + (r.ev.late ? 'var-neg' : '') + '">' + ui.time(r.entry.in) + '</span>' : '<span class="muted">—</span>'; }, sort: function (r) { return r.entry ? r.entry.in : ''; } },
          { key: 'out', label: 'Out', render: function (r) { return r.entry && r.entry.out ? '<span class="' + (r.ev.early ? 'var-neg' : '') + '">' + ui.time(r.entry.out) + '</span>' : r.entry ? (r.ev.state === 'working' || r.ev.state === 'on_break' ? '<span class="muted">…</span>' : '<b class="var-neg">Missing</b>') : '<span class="muted">—</span>'; }, sort: function (r) { return r.entry && r.entry.out || ''; } },
          { key: 'brk', label: 'Break', align: 'r', render: function (r) { return r.entry ? brk(r.entry) + ' min' : '—'; }, sort: function (r) { return brk(r.entry); } },
          { key: 'sh', label: 'Sched. h', align: 'r', render: function (r) { return r.shift && r.ev.state !== 'on_leave' ? ui.hrs(R.shiftMinutes(r.shift), true) : '—'; }, sort: function (r) { return r.shift ? R.shiftMinutes(r.shift) : 0; } },
          { key: 'wk', label: 'Actual h', align: 'r', render: function (r) { return r.entry ? ui.hrs(r.ev.workedMin, true) : '—'; }, sort: function (r) { return r.ev.workedMin; } },
          { key: 'var', label: 'Variance', align: 'r', render: function (r) { if (r.ev.state !== 'done' && r.ev.state !== 'absent') return '<span class="muted">—</span>'; var x = r.ev.state === 'absent' ? -r.ev.schedMin : r.ev.variance; return '<span class="' + (x < -5 ? 'var-neg' : x > 5 ? 'var-pos' : 'muted') + '">' + (x >= 0 ? '+' : '−') + ui.hm(x) + '</span>'; }, sort: function (r) { return r.ev.variance; } },
          { key: 'st', label: 'Status', render: stateHtml, sort: function (r) { return flagsOf(r).length; }, defaultDir: 'desc' },
          { key: 'ap', label: 'Timesheet', render: function (r) { return r.entry ? ui.badge(r.entry.status) : '<span class="muted">—</span>'; }, sort: function (r) { return r.entry ? r.entry.status : 'z'; } }
        ];
        var tbl = ui.table(v.querySelector('#att-t'), {
          rows: filtered(), columns: cols, pageSize: 30, selectable: store.canAny('attendance.approve'), showCount: true,
          initialSort: { key: 'date', dir: 'desc' }, rowId: function (r) { return r.id; },
          onRowClick: function (r) { recordDrawer(r); },
          bulk: function () { return '<button class="btn btn--sm" data-bappr>' + I('check', 13) + 'Approve selected</button>'; },
          empty: ui.empty('clock', 'No records match', exc ? 'No ' + EXC.filter(function (x) { return x[0] === exc; })[0][1].toLowerCase() + ' records in this range.' : 'Nobody was scheduled in this range.')
        });
        v.querySelector('#att-t').addEventListener('click', function (e) {
          if (!e.target.closest('[data-bappr]')) return;
          var ids = tbl.selected().filter(function (id) { return id.indexOf('s:') !== 0; });
          if (!ids.length) { ui.toast('Selected rows have no clock record to approve', 'info'); return; }
          var r = ui.run(function () { return store.approveEntries(ids); });
          if (r) { ui.toast('Approved ' + ui.plural(r.done, 'timesheet') + (r.skipped.length ? ' · skipped ' + r.skipped.length + ': ' + r.skipped[0] : ''), r.skipped.length ? 'info' : 'ok'); tbl.clear(); }
        });
        v.querySelector('[data-csv]').onclick = function () {
          ui.csv('kintra-attendance-' + from + '_' + to + '.csv', [{ label: 'Employee', csv: function (r) { return store.empName(r.empId); } }, { label: 'Location', csv: function (r) { return store.locName(r.locationId); } }, { label: 'Date', key: 'date' }, { label: 'Scheduled start', csv: function (r) { return r.shift ? r.shift.start : ''; } }, { label: 'Scheduled end', csv: function (r) { return r.shift ? r.shift.end : ''; } }, { label: 'Clock in', csv: function (r) { return r.entry ? r.entry.in.replace('T', ' ') : ''; } }, { label: 'Clock out', csv: function (r) { return r.entry && r.entry.out ? r.entry.out.replace('T', ' ') : ''; } }, { label: 'Break minutes', csv: function (r) { return brk(r.entry); } }, { label: 'Scheduled hours', csv: function (r) { return r.shift ? R.hours(R.shiftMinutes(r.shift)) : ''; } }, { label: 'Worked hours', csv: function (r) { return R.hours(r.ev.workedMin); } }, { label: 'Status', csv: function (r) { return ui.label(r.ev.state); } }, { label: 'Exceptions', csv: function (r) { return flagsOf(r).join(' '); } }, { label: 'Timesheet', csv: function (r) { return r.entry ? r.entry.status : ''; } }, { label: 'Demo data', csv: function () { return 'yes'; } }], tbl.rows());
        };
      },
      tick: function () { if (!document.querySelector('.ov') && to >= today) app.refresh(); }
    };
  });

  /* ---------- employee time clock ---------- */
  var lastAction = null;
  KT.route('/clock', function () {
    var e = store.myEmp();
    if (!e) return { title: 'Time clock', html: app.ph('Time clock') + '<div class="card">' + ui.empty('timer', 'Your account isn’t linked to an employee', 'The time clock is for employees clocking their own shifts. Switch to Kevin Otieno or Grace Akinyi from the account menu to try it.', '<button class="btn btn--sm" data-switch style="margin-top:8px">' + I('users', 15) + 'Switch demo user</button>') + '</div>' };
    var c = store.clockContext(e.id), n = c.now, sh = c.shift;
    var ev = sh || c.open ? R.evaluate(sh, c.open || (sh && store.entryFor(sh.id)), store.evalOpts()) : null;
    var state = c.open ? (c.onBreak ? 'on_break' : 'working') : 'off';
    var stLabel = { working: 'Clocked in', on_break: 'On a break', off: 'Not clocked in' }[state];
    var shiftCard = sh ? '<div class="clock__shift"><span class="ico-c ico-c--acc">' + I('cal', 16) + '</span><span class="lrow__m"><div class="lrow__t">' + (R.span(sh).s > n.abs ? 'Next shift ' : 'Current shift ') + sh.start + '–' + sh.end + '</div><div class="lrow__s">' + ui.esc(store.role(sh.jobRoleId).name) + ' · ' + ui.esc(store.locName(sh.locationId)) + (sh.breakMin ? ' · ' + sh.breakMin + ' min break' : '') + '</div></span></div>' :
      (c.next ? '<div class="clock__shift"><span class="ico-c">' + I('cal', 16) + '</span><span class="lrow__m"><div class="lrow__t">No shift right now</div><div class="lrow__s">Next: ' + ui.relDay(c.next.date) + ' ' + c.next.start + '–' + c.next.end + ' at ' + ui.esc(store.locName(c.next.locationId)) + '</div></span></div>' : '<div class="clock__shift"><span class="ico-c">' + I('cal', 16) + '</span><span class="lrow__m"><div class="lrow__t">No upcoming shifts</div><div class="lrow__s">Clocking in without a shift creates an unscheduled record for your manager to review.</div></span></div>');
    var acts = state === 'off' ? '<div class="clock__acts"><button class="btn btn--p" data-act="in">' + I('login', 18) + 'Clock in' + (sh ? '' : ' without a shift') + '</button></div>' :
      '<div class="clock__acts clock__acts--2">' + (state === 'on_break' ? '<button class="btn" data-act="endbreak">' + I('coffee', 18) + 'End break</button>' : '<button class="btn" data-act="break">' + I('coffee', 18) + 'Start break</button>') + '<button class="btn btn--dark" data-act="out">' + I('logout', 18) + 'Clock out</button></div>';
    var done = lastAction && lastAction.emp === e.id && n.abs - lastAction.at < 10 ? '<div class="note note--ok clock__done" role="status">' + I('check', 16) + '<span>' + ui.esc(lastAction.text) + '</span></div>' : '';
    var punches = c.entries.length ? c.entries.map(function (en) { var x = R.evaluate(en.shiftId ? store.shift(en.shiftId) : null, en, store.evalOpts()); return '<div class="punch"><span>' + ui.time(en.in) + ' – ' + (en.out ? ui.time(en.out) : '<b>now</b>') + (en.breaks && en.breaks.length ? ' <span class="muted">· ' + Math.round(R.breakMinutes(en, en.out ? R.abs(en.out) : n.abs)) + ' min break</span>' : '') + '</span><b class="num">' + ui.hm(x.workedMin) + '</b></div>'; }).join('') : '<p class="muted small">No clock records today.</p>';
    var mine = store.state.entries.filter(function (x) { return x.employeeId === e.id && x.date >= R.addDays(n.date, -13) && x.date < n.date; }).sort(function (a, b) { return a.in < b.in ? 1 : -1; }).slice(0, 8);
    var hist = '<div class="card" style="margin-top:14px"><div class="card__h"><h2>' + I('history', 16) + 'My recent timesheets</h2><span class="sub">last 14 days</span></div>' + (mine.length ? '<div class="tscroll"><table class="t t-compact"><thead><tr><th>Date</th><th>In</th><th>Out</th><th class="r">Hours</th><th>Status</th></tr></thead><tbody>' + mine.map(function (x) { var y = R.evaluate(x.shiftId ? store.shift(x.shiftId) : null, x, store.evalOpts()); return '<tr><td>' + ui.date(x.date, { dow: true }) + '</td><td>' + ui.time(x.in) + (y.late ? ' <span class="bdg bdg--amber">late</span>' : '') + '</td><td>' + (x.out ? ui.time(x.out) : '<b class="var-neg">Missing</b>') + '</td><td class="r">' + ui.hrs(y.workedMin, true) + '</td><td>' + ui.badge(x.status) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<div class="card__b muted">No timesheets yet.</div>') + '</div>';
    return {
      title: 'Time clock',
      html: '<div class="clock">' + app.ph('Time clock', ui.esc(store.name(e)) + ' · ' + ui.esc(store.locName(e.locationId))) +
        '<div class="card"><div class="card__b" style="text-align:center;padding:26px 20px">' +
        '<div class="clock__now" aria-live="polite">' + R.fromMin(n.min) + '</div><div class="clock__date">' + ui.date(n.date, { dow: true, year: true }) + ' · ' + ui.esc(store.state.org.timezone.replace('_', ' ')) + '</div>' +
        '<div class="clock__state">' + ui.dot(state === 'working' ? 'green' : state === 'on_break' ? 'blue' : 'grey') + stLabel + (c.open ? ' since ' + ui.time(c.open.in) : '') + (ev && ev.late && c.open ? ' · ' + ui.hm(ev.late) + ' late' : '') + '</div>' +
        shiftCard + acts + done +
        '</div><div class="card__f"><span class="muted">Recorded today</span><b class="num">' + ui.hm(c.todayMin) + '</b></div></div>' +
        '<div class="card" style="margin-top:14px"><div class="card__h"><h2>' + I('clock', 16) + 'Today’s clock records</h2></div><div class="card__b"><div class="punches">' + punches + '</div></div></div>' + hist +
        '<p class="muted small" style="margin-top:12px;text-align:center">Location checks (GPS), biometric terminals and shared kiosks are future integration options and are not active in this template.</p></div>',
      mount: function (v) {
        v.querySelectorAll('[data-act]').forEach(function (b) {
          b.onclick = function () {
            var a = b.getAttribute('data-act'), r, msg;
            if (a === 'in') { r = ui.run(function () { return store.clockIn(e.id); }); if (!r) return; msg = 'Clocked in at ' + ui.time(r.entry.in) + (r.late ? ' (' + ui.hm(r.late) + ' after the shift start)' : '') + '.'; }
            else if (a === 'out') { r = ui.run(function () { return store.clockOut(e.id); }); if (!r) return; msg = 'Clocked out at ' + ui.time(r.entry.out) + '. You worked ' + ui.hm(r.worked) + '.'; }
            else if (a === 'break') { if (!ui.run(function () { store.startBreak(e.id); })) return; msg = 'Break started at ' + R.fromMin(store.now().min) + '.'; }
            else { if (!ui.run(function () { store.endBreak(e.id); })) return; msg = 'Break ended at ' + R.fromMin(store.now().min) + '.'; }
            lastAction = { emp: e.id, at: store.now().abs, text: msg };
            ui.toast(msg);
          };
        });
      },
      tick: function () { app.refresh(); }
    };
  });
})();
