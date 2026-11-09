/* ============================================================
   KINTRA — Overview (managers) and Home (employees)
   ============================================================ */
(function () {
  'use strict';
  var ui = KT.ui, store = KT.store, R = KT.rules, app = KT.app, I = ui.icon;
  KT.v = KT.v || {};

  function greet() { var m = store.now().min; return m < 720 ? 'Good morning' : m < 1020 ? 'Good afternoon' : 'Good evening'; }
  function staleNote() {
    var S = store.state; if (!S.meta.stale) return '';
    return '<div class="note note--info" style="margin-bottom:14px">' + I('info', 15) + '<span>This demo was set up on ' + ui.date(S.meta.seededOn) + ', so its sample attendance stops there. <button class="link" data-reset-demo>Refresh the sample data</button> to rebuild it around today (this removes your changes).</span></div>';
  }

  /* ---------- the day timeline (shared with Scheduling → Day) ---------- */
  // rows: [{emp, shifts:[...], entry}] ; returns html
  // phone layout for the day timeline: one line per person, in start order
  function tlList(rows) {
    return '<div class="tl-list">' + rows.map(function (r) {
      var sh = r.shifts[0], st = r.state && ['working', 'on_break', 'not_in', 'absent', 'missing_out', 'on_leave'].indexOf(r.state) >= 0 ? ui.badge(r.state) : '';
      var who = r.emp ? ui.esc(store.name(r.emp)) : 'Open shift';
      return '<a class="tl-li" href="' + (r.emp ? '#/employees/' + r.emp.id : '#/schedule?view=day&date=' + sh.date) + '">' + (r.emp ? ui.avatar(store.name(r.emp), 'sm') : '<span class="av av--sm av--open">' + I('alert', 13) + '</span>') +
        '<span class="tl-li__m"><b>' + who + '</b><span>' + ui.esc(r.sub) + '</span></span><span class="tl-li__r"><b class="num">' + r.shifts.map(function (x) { return x.start + '–' + x.end; }).join(', ') + '</b>' + st + '</span></a>';
    }).join('') + '</div>';
  }
  KT.v.timeline = function (date, rows, o) {
    o = o || {};
    var from = o.from != null ? o.from : 5 * 60, to = o.to != null ? o.to : 25 * 60, span = to - from, n = store.now(), d0 = R.epochDay(date) * 1440;
    var hours = []; for (var h = from; h <= to; h += 60) hours.push(h);
    var nowX = n.abs >= d0 + from && n.abs <= d0 + to ? ((n.abs - d0 - from) / span * 100) : null;
    var head = '<div class="tl-row tl-row--head"><div class="tl-who"></div><div class="tl-track">' + hours.map(function (h, i) { return i > 0 && i % (o.every || 2) === (o.every || 2) - 1 && h < to ? '<span style="left:' + ((h - from) / span * 100) + '%">' + R.fromMin(h) + '</span>' : ''; }).join('') + '</div></div>';
    var body = rows.map(function (r) {
      var bars = r.shifts.map(function (s) {
        var sp = R.span(s), a = Math.max(0, (sp.s - d0 - from) / span * 100), b = Math.min(100, (sp.e - d0 - from) / span * 100);
        var en = store.entryFor(s.id), ev = R.evaluate(s, en, store.evalOpts());
        var actual = '';
        if (en && en.in) { var ai = Math.max(0, (R.abs(en.in) - d0 - from) / span * 100), ao = Math.min(100, ((en.out ? R.abs(en.out) : n.abs) - d0 - from) / span * 100); if (ao > ai) actual = '<i class="tl-act" style="left:' + ai + '%;width:' + (ao - ai) + '%"></i>'; }
        var cls = 'tl-bar' + (s.status === 'draft' ? ' is-draft' : '') + (!s.employeeId ? ' is-open' : '') + (ev.state === 'not_in' || ev.state === 'absent' ? ' is-bad' : ev.late ? ' is-warn' : '');
        return '<button type="button" class="' + cls + '" data-shift="' + s.id + '" style="left:' + a + '%;width:' + (b - a) + '%;--kc:' + app.deptColor(store.role(s.jobRoleId).deptId) + '" title="' + ui.esc(store.describeShift(s) + ' · ' + ui.label(ev.state)) + '"><span>' + s.start + '–' + s.end + '</span><em>' + ui.esc(store.role(s.jobRoleId).name) + '</em></button>' + actual;
      }).join('');
      var st = r.state && ['working', 'on_break', 'not_in', 'absent', 'missing_out', 'on_leave'].indexOf(r.state) >= 0 ? ui.badge(r.state) : '';
      return '<div class="tl-row"><div class="tl-who">' + (r.emp ? '<a href="#/employees/' + r.emp.id + '" class="pcell">' + ui.avatar(store.name(r.emp), 'sm') + '<span style="min-width:0"><div class="pcell__t">' + ui.esc(store.name(r.emp)) + '</div><div class="pcell__s">' + ui.esc(r.sub || store.role(r.emp.jobRoleId).name) + '</div></span></a>' : '<span class="pcell"><span class="av av--sm" style="--avc:#C9A35A">' + I('alert', 12) + '</span><span><div class="pcell__t">Open shift</div><div class="pcell__s">' + ui.esc(r.sub || '') + '</div></span></span>') + '<span class="tl-st">' + st + '</span></div><div class="tl-track">' + hours.map(function (h) { return '<i class="tl-grid" style="left:' + ((h - from) / span * 100) + '%"></i>'; }).join('') + bars + '</div></div>';
    }).join('');
    return '<div class="tl-wrap">' + head + body + (nowX != null ? '<div class="tl-now" style="--x:' + nowX + '"><span>' + R.fromMin(n.min) + '</span></div>' : '') + '</div>';
  };

  /* ---------- manager overview ---------- */
  function managerView(q) {
    var S = store.state, n = store.now(), today = n.date, date = q.date || today;
    var dept = q.dept || '', team = q.team || '', me = store.me();
    function keepEmp(e) { return e && (!dept || e.deptId === dept) && (!team || e.teamId === team); }
    var rows = store.attendance(date, date).filter(function (r) { return keepEmp(store.emp(r.empId)); });
    var todays = store.shiftsBetween(date, date).filter(function (s) { return s.status !== 'draft' && (!s.employeeId ? (!dept || store.role(s.jobRoleId).deptId === dept) : keepEmp(store.emp(s.employeeId))); });
    var working = rows.filter(function (r) { return r.ev.state === 'working' || r.ev.state === 'on_break'; }).length;
    var lateRows = rows.filter(function (r) { return r.ev.late || r.ev.state === 'not_in'; });
    var absent = rows.filter(function (r) { return r.ev.state === 'absent'; }).length, onLeave = S.leave.filter(function (l) { var e = store.emp(l.employeeId); return l.status === 'approved' && R.inRange(date, l.start, l.end) && e && store.inScope(e.locationId) && keepEmp(e); });
    var week7 = store.shiftsBetween(today, R.addDays(today, 6)).filter(function (s) { return !s.employeeId && (!dept || store.role(s.jobRoleId).deptId === dept); });
    var pend = store.pendingForMe();
    var canAtt = store.canAny('attendance.view'), canCost = store.canAny('reports.cost');
    var sched = todays.filter(function (s) { return s.employeeId; });
    var mstrip = '<div class="mstrip" style="--n:6">' +
      '<a class="mstat" href="#/attendance?date=' + date + '"><span>' + (date === today ? 'Working now' : 'Worked') + '</span><b>' + (date === today ? working : rows.filter(function (r) { return r.entry; }).length) + '<small> / ' + sched.length + '</small></b><em>' + (date === today ? 'clocked in at this moment' : 'with a clock record') + '</em></a>' +
      '<a class="mstat" href="#/schedule?view=day&date=' + date + '"><span>Scheduled ' + (date === today ? 'today' : ui.date(date)) + '</span><b>' + sched.length + '</b><em>' + ui.hrs(sched.reduce(function (a, s) { return a + R.shiftMinutes(s); }, 0)) + ' planned</em></a>' +
      '<a class="mstat' + (week7.length ? ' mstat--warn' : '') + '" href="#/schedule?filter=open"><span>Open shifts</span><b>' + week7.length + '</b><em>next 7 days</em></a>' +
      '<a class="mstat' + (lateRows.length ? ' mstat--warn' : '') + '" href="#/attendance?date=' + date + '&exc=late"><span>Late arrivals</span><b>' + lateRows.length + '</b><em>' + rows.filter(function (r) { return r.ev.state === 'not_in'; }).length + ' not clocked in yet</em></a>' +
      '<a class="mstat' + (absent ? ' mstat--bad' : '') + '" href="#/attendance?date=' + date + '&exc=absent"><span>Absences</span><b>' + absent + '</b><em>' + onLeave.length + ' on approved leave</em></a>' +
      '<a class="mstat' + (pend.length ? ' mstat--warn' : '') + '" href="#/time-off?tab=approvals"><span>Time-off requests</span><b>' + pend.length + '</b><em>waiting for you</em></a></div>';

    // today's schedule timeline
    var byEmp = {};
    todays.forEach(function (s) { var k = s.employeeId || 'open:' + s.id; (byEmp[k] = byEmp[k] || []).push(s); });
    var trows = Object.keys(byEmp).map(function (k) { var sh = byEmp[k], e = sh[0].employeeId ? store.emp(sh[0].employeeId) : null; var r = e ? rows.filter(function (x) { return x.empId === e.id; })[0] : null; return { emp: e, shifts: sh, state: r ? r.ev.state : null, sub: e ? store.role(sh[0].jobRoleId).name + ' · ' + store.locName(sh[0].locationId) : store.role(sh[0].jobRoleId).name + ' · ' + store.locName(sh[0].locationId), s0: R.span(sh[0]).s }; });
    trows.sort(function (a, b) { return (a.emp ? 1 : 0) - (b.emp ? 1 : 0) || a.s0 - b.s0; });
    var tlShown = trows.slice(0, q.all ? 200 : 12);
    var timeline = '<div class="card"><div class="card__h"><h2>' + I('week', 16) + (date === today ? 'Today’s team' : 'Team on ' + ui.date(date, { dow: true })) + '</h2><span class="sub">' + trows.length + ' people and open shifts</span></div>' +
      (trows.length ? '<div class="tl-scroll tl-scroll--ov">' + KT.v.timeline(date, tlShown, { every: 3 }) + '</div>' + tlList(tlShown) : ui.empty('cal', 'Nobody is scheduled', 'No published shifts match these filters.')) +
      (trows.length > tlShown.length ? '<div class="card__f"><span class="muted small">Showing ' + tlShown.length + ' of ' + trows.length + '</span><a class="link" href="#/schedule?view=day&date=' + date + '">Open the day view ' + I('arrowR', 13) + '</a></div>' : '<div class="card__f"><span class="legend"><span><i style="background:var(--acc-soft);box-shadow:inset 0 0 0 1px var(--acc)"></i>Scheduled</span><span><i style="background:var(--acc)"></i>Clocked time</span></span><a class="link" href="#/schedule?view=day&date=' + date + '">Day view ' + I('arrowR', 13) + '</a></div>') + '</div>';

    // needs attention
    var att = [];
    pend.slice(0, 4).forEach(function (r) { var e = store.emp(r.employeeId); att.push(['plane', 'blue', store.name(e) + ' · ' + store.leaveType(r.typeId).name, ui.range(r.start, r.end) + ' · ' + ui.plural(r.days, 'day'), '#/time-off?req=' + r.id, 'Review']); });
    if (canAtt) {
      rows.filter(function (r) { return r.ev.state === 'not_in'; }).forEach(function (r) { var e = store.emp(r.empId); att.push(['clock', 'red', store.name(e) + ' hasn’t clocked in', 'Shift started ' + r.shift.start + ' · ' + store.locName(r.locationId), '#/attendance?date=' + date + '&exc=missed_in', 'Check']); });
      var yday = R.addDays(today, -1);
      var mo = store.attendance(R.addDays(today, -7), yday).filter(function (r) { return r.ev.state === 'missing_out' && keepEmp(store.emp(r.empId)); });
      if (mo.length) att.push(['alert', 'amber', ui.plural(mo.length, 'missed clock-out'), 'Last 7 days · needs a correction before payroll', '#/attendance?from=' + R.addDays(today, -7) + '&to=' + yday + '&exc=missed_out', 'Fix']);
    }
    var soon = week7.filter(function (s) { return s.date <= R.addDays(today, 2); });
    if (soon.length) att.push(['alert', 'amber', ui.plural(soon.length, 'open shift') + ' in the next 48 hours', soon.slice(0, 2).map(function (s) { return store.role(s.jobRoleId).name + ' ' + ui.dshort(s.date) + ' ' + s.start; }).join(', '), '#/schedule?filter=open', 'Fill']);
    var drafts = store.draftsIn(today, R.addDays(today, 13)).length;
    if (drafts && store.canAny('schedule.publish')) att.push(['cal', 'blue', ui.plural(drafts, 'draft shift') + ' not published', 'Employees can’t see drafts yet', '#/schedule?week=next', 'Publish']);
    if (store.can('payroll.view')) S.periods.filter(function (p) { return p.end < today && p.status !== 'paid'; }).forEach(function (p) { var due = R.addDays(p.payDate, -S.org.payroll.approvalLeadDays); att.push(['wallet', due < today ? 'red' : 'amber', 'Payroll ' + ui.range(p.start, p.end) + ': ' + ui.label(p.status).toLowerCase(), 'Approve by ' + ui.date(due) + ' · pay date ' + ui.date(p.payDate), '#/payroll/' + p.id, 'Open']); });
    if (store.can('hiring.view')) { var apps = S.candidates.filter(function (c) { var j = store.job(c.jobId); return c.stage === 'applied' && j && store.inScope(j.locationId); }); if (apps.length) att.push(['userplus', 'violet', ui.plural(apps.length, 'new application'), 'Waiting for screening', '#/hiring?stage=applied', 'Review']); }
    var exp = []; store.employees().forEach(function (e) { (e.docs || []).forEach(function (d) { if (d.expires && d.expires <= R.addDays(today, 30)) exp.push([e, d]); }); });
    if (exp.length && store.canAny('employees.edit')) att.push(['file', 'amber', ui.plural(exp.length, 'document') + ' expiring within 30 days', exp.slice(0, 2).map(function (x) { return x[0].first + ' ' + x[0].last + ': ' + x[1].kind.toLowerCase(); }).join(', '), '#/employees/' + exp[0][0].id + '?tab=documents', 'View']);
    var attention = '<div class="card"><div class="card__h"><h2>' + I('alert', 16) + 'Needs attention</h2><span class="sub">' + att.length + '</span></div>' + (att.length ? att.map(function (a) { return '<a class="lrow" href="' + a[4] + '"><span class="ico-c ico-c--' + a[1] + '">' + I(a[0], 15) + '</span><span class="lrow__m"><div class="lrow__t">' + ui.esc(a[2]) + '</div><div class="lrow__s">' + ui.esc(a[3]) + '</div></span><span class="lrow__r"><span class="btn btn--xs">' + a[5] + '</span></span></a>'; }).join('') : ui.empty('check', 'Nothing needs you right now', 'Approvals, exceptions and deadlines appear here.')) + '</div>';

    // coverage next 7 days
    var days = R.range(date, R.addDays(date, 6)), locs = store.myLocations().filter(function (l) { return store.inScope(l.id); });
    var cov = '<div class="card"><div class="card__h"><h2>' + I('gauge', 16) + 'Staffing coverage</h2><span class="sub">required vs scheduled, next 7 days</span></div><div class="tscroll"><table class="t t-compact cov-t"><thead><tr><th>Location</th>' + days.map(function (d) { return '<th class="c">' + ui.DAY[R.dow(d)] + '<div class="muted" style="font-weight:500">' + (+d.slice(8)) + '</div></th>'; }).join('') + '</tr></thead><tbody>' +
      locs.map(function (l) {
        return '<tr><td><b>' + ui.esc(l.name) + '</b></td>' + days.map(function (d) {
          var c = R.coverage(d, l.id, S.shifts.filter(function (s) { return s.date >= R.addDays(d, -1) && s.date <= d; }), S.requirements).filter(function (x) { return !dept || store.role(x.req.jobRoleId).deptId === dept; });
          if (!c.length) return '<td class="c muted">—</td>';
          var gaps = c.filter(function (x) { return !x.ok; });
          return '<td class="c"><a class="covc ' + (gaps.length ? 'covc--gap' : 'covc--ok') + '" href="#/schedule?view=day&date=' + d + '&loc=' + l.id + '" title="' + ui.esc(gaps.length ? gaps.map(function (g) { return store.role(g.req.jobRoleId).name + ' ' + g.req.start + '–' + g.req.end + ': ' + g.scheduled + '/' + g.required; }).join('\n') : 'All ' + c.length + ' requirements met') + '">' + (gaps.length ? I('alert', 12) + gaps.length + ' gap' + (gaps.length > 1 ? 's' : '') : I('check', 12) + 'OK') + '</a></td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody></table></div><div class="card__f"><span class="muted small">Gaps count hours where fewer people are scheduled than the staffing requirement.</span><a class="link" href="#/settings?tab=staffing">Requirements</a></div></div>';

    // labour
    var ws = R.weekStart(date, S.org.weekStart), we = R.addDays(ws, 6);
    var wk = store.shiftsBetween(ws, we).filter(function (s) { return s.employeeId && (!dept || store.role(s.jobRoleId).deptId === dept); });
    var schedMin = wk.reduce(function (a, s) { return a + R.shiftMinutes(s); }, 0);
    var att2 = store.attendance(ws, we).filter(function (r) { return keepEmp(store.emp(r.empId)); });
    var actMin = att2.reduce(function (a, r) { return a + r.ev.workedMin; }, 0), toDateMin = att2.filter(function (r) { return r.date <= today && r.shift; }).reduce(function (a, r) { return a + (r.shift && R.span(r.shift).s <= n.abs ? R.shiftMinutes(r.shift) : 0); }, 0);
    function cost(s) { var e = store.emp(s.employeeId); if (!e) return 0; return e.payType === 'hourly' ? R.shiftMinutes(s) / 60 * e.rate : 0; }
    var hourlyCost = wk.reduce(function (a, s) { return a + cost(s); }, 0);
    var salaried = store.employees().filter(function (e) { return e.payType === 'salaried' && e.status !== 'terminated' && keepEmp(e); }).reduce(function (a, e) { return a + e.salary * 12 / 52; }, 0);
    var labour = '<div class="card"><div class="card__h"><h2>' + I('timer', 16) + 'Labour this week</h2><span class="sub">' + ui.range(ws, we) + '</span></div><div class="card__b"><dl class="kv"><dt>Scheduled hours</dt><dd class="num">' + ui.hrs(schedMin) + '</dd><dt>Worked so far</dt><dd class="num">' + ui.hrs(actMin) + ' <span class="muted">of ' + ui.hrs(toDateMin) + ' due</span></dd>' +
      (canCost ? '<dt>Estimated hourly labour</dt><dd class="num">' + ui.money(hourlyCost) + '</dd><dt>Salaried staff (weekly share)</dt><dd class="num">' + ui.money(salaried) + '</dd>' : '') + '</dl>' + (canCost ? '<p class="muted small" style="margin-top:10px">Estimate from scheduled hours × hourly rates. Excludes overtime premiums and employer contributions; see Payroll for calculated figures.</p>' : '') + '</div></div>';

    // upcoming shifts / open shifts
    var upcoming = store.shiftsBetween(today, R.addDays(today, 6)).filter(function (s) { return R.span(s).s > n.abs && (!dept || store.role(s.jobRoleId).deptId === dept); }).sort(function (a, b) { return R.span(a).s - R.span(b).s; });
    var openFirst = upcoming.filter(function (s) { return !s.employeeId; }).concat(upcoming.filter(function (s) { return s.employeeId; })).slice(0, 7);
    var up = '<div class="card"><div class="card__h"><h2>' + I('cal', 16) + 'Upcoming shifts</h2><a class="link" href="#/schedule?view=list">All shifts</a></div>' + (openFirst.length ? openFirst.map(function (s) { var e = s.employeeId && store.emp(s.employeeId); return '<a class="lrow" href="#/schedule?date=' + s.date + (s.employeeId ? '' : '&filter=open') + '"><span class="dchip"><b>' + (+s.date.slice(8)) + '</b>' + ui.DAY[R.dow(s.date)] + '</span><span class="lrow__m"><div class="lrow__t">' + (e ? ui.esc(store.name(e)) : 'Open shift') + '</div><div class="lrow__s">' + s.start + '–' + s.end + ' · ' + ui.esc(store.role(s.jobRoleId).name) + ' · ' + ui.esc(store.locName(s.locationId)) + '</div></span><span class="lrow__r">' + (e ? (s.status === 'draft' ? ui.badge('draft') : '') : ui.badge('open', 'Unfilled')) + '</span></a>'; }).join('') : ui.empty('cal', 'No upcoming shifts', '')) + '</div>';

    // payroll deadlines
    var pay = '';
    if (store.can('payroll.view')) {
      var ps = S.periods.filter(function (p) { return p.status !== 'paid' || p.end >= R.addDays(today, -20); }).slice(-3).reverse();
      pay = '<div class="card"><div class="card__h"><h2>' + I('wallet', 16) + 'Payroll deadlines</h2><a class="link" href="#/payroll">Payroll</a></div>' + ps.map(function (p) { var due = R.addDays(p.payDate, -S.org.payroll.approvalLeadDays); return '<a class="lrow" href="#/payroll/' + p.id + '"><span class="lrow__m"><div class="lrow__t">' + ui.range(p.start, p.end) + '</div><div class="lrow__s">' + (p.status === 'paid' ? 'Paid ' + ui.date(p.paid.date) : p.end >= today ? 'In progress · ends ' + ui.date(p.end) : 'Approve by ' + ui.date(due) + ' · pay date ' + ui.date(p.payDate)) + '</div></span><span class="lrow__r">' + ui.badge(p.status === 'open' && p.end >= today ? 'upcoming' : p.status, p.status === 'open' && p.end >= today ? 'Current' : p.status === 'open' ? 'To process' : null) + '</span></a>'; }).join('') + '</div>';
    }
    // upcoming starts
    var starts = store.employees().filter(function (e) { return e.status === 'onboarding' || (e.start >= R.addDays(today, -14) && e.start <= R.addDays(today, 30)); });
    var st = '<div class="card"><div class="card__h"><h2>' + I('userplus', 16) + 'Upcoming starts</h2><span class="sub">' + starts.length + '</span></div>' + (starts.length ? starts.map(function (e) { var ob = e.onboarding || [], done = ob.filter(function (t) { return t.done; }).length; return '<a class="lrow" href="#/employees/' + e.id + '">' + ui.avatar(store.name(e), 'sm') + '<span class="lrow__m"><div class="lrow__t">' + ui.esc(store.name(e)) + '</div><div class="lrow__s">' + ui.esc(store.role(e.jobRoleId).name) + ' · ' + ui.esc(store.locName(e.locationId)) + ' · starts ' + ui.relDay(e.start).replace('Today', 'today') + '</div></span><span class="lrow__r">' + (ob.length ? '<span class="small muted">' + done + '/' + ob.length + '</span><span class="meter" style="width:54px"><i style="width:' + (done / ob.length * 100) + '%"></i></span>' : '') + '</span></a>'; }).join('') : ui.empty('userplus', 'No new starters', 'People hired through KINTRA appear here while they onboard.')) + '</div>';

    // activity
    var acts = S.audit.filter(function (a) { return (!a.locationId || store.inScope(a.locationId)) && (a.entity !== 'payroll' || store.can('payroll.view')) && (a.entity !== 'candidate' || store.can('hiring.view')) && (a.entity !== 'user' && a.entity !== 'settings' || store.can('org.settings') || store.can('users.manage')); }).slice(0, 8);
    var ICON = { shift: 'cal', schedule: 'week', entry: 'clock', leave: 'plane', candidate: 'userplus', job: 'briefcase', employee: 'user', payroll: 'wallet', settings: 'settings', user: 'shield' };
    var act = '<div class="card"><div class="card__h"><h2>' + I('history', 16) + 'Recent activity</h2></div><div class="card__b"><div class="timeline">' + (acts.length ? acts.map(function (a) { return '<div class="tl"><span class="tl__i">' + I(ICON[a.entity] || 'info', 12) + '</span><div><div class="tl__t">' + ui.esc(a.text) + '</div><div class="tl__s">' + ui.esc(a.by ? store.userName(a.by) : 'Careers page') + ' · ' + ui.rel(a.at) + '</div></div></div>'; }).join('') : '<p class="muted">No activity yet.</p>') + '</div></div></div>';

    var teams = S.teams.filter(function (t) { return store.inScope(t.locationId); });
    var filters = '<div class="ph__acts"><label class="sr" for="ov-date">Date</label><input class="inp inp--sm" type="date" id="ov-date" value="' + date + '" style="width:150px">' + ui.select('dept', app.deptOptions(true), dept, { cls: 'sel--sm', attr: ' aria-label="Department" style="width:auto"' }) + ui.select('team', [{ value: '', label: 'All teams' }].concat(teams.map(function (t) { return { value: t.id, label: t.name }; })), team, { cls: 'sel--sm', attr: ' aria-label="Team" style="width:auto"' }) + (store.canAny('schedule.edit') ? '<a class="btn btn--p btn--sm" href="#/schedule?new=1">' + I('plus', 15) + 'Add shift</a>' : '') + '</div>';
    var scopeName = store.scopeLoc() ? store.locName(store.scopeLoc()) : store.myLocations().length === S.locations.length ? 'all locations' : store.myLocations().map(function (l) { return l.name; }).join(', ');
    return {
      title: 'Overview',
      html: staleNote() + '<div class="ph"><div><h1>' + greet() + ', ' + ui.esc(me.name.split(' ')[0]) + '</h1><p>' + ui.date(today, { dow: true, year: true }) + ' · ' + ui.esc(scopeName) + ' ' + ui.demoTag('Demo workspace') + '</p></div>' + filters + '</div>' +
        mstrip + '<div class="grid g-main" style="margin-top:14px"><div class="stack">' + timeline + cov + '<div class="grid g-2">' + up + labour + '</div></div><div class="stack">' + attention + pay + st + act + '</div></div>',
      mount: function (v) {
        function upd(k, val) { q[k] = val; app.updateQuery(q); app.refresh(); }
        v.querySelector('#ov-date').onchange = function (e) { if (e.target.value) upd('date', e.target.value === today ? '' : e.target.value); };
        v.querySelector('[name=dept]').onchange = function (e) { upd('dept', e.target.value); };
        v.querySelector('[name=team]').onchange = function (e) { upd('team', e.target.value); };
        bindCommon(v);
        v.querySelectorAll('[data-shift]').forEach(function (b) { b.onclick = function () { KT.v.shiftEditor({ id: b.getAttribute('data-shift') }); }; });
      },
      tick: function () { if (!document.querySelector('.ov')) app.refresh(); }
    };
  }
  function bindCommon(v) { var b = v.querySelector('[data-reset-demo]'); if (b) b.onclick = app.reset; }

  /* ---------- employee home ---------- */
  function employeeView() {
    var S = store.state, me = store.me(), e = store.myEmp(), n = store.now();
    if (!e) return { title: 'Home', html: app.ph('Welcome, ' + ui.esc(me.name.split(' ')[0])) + '<div class="card">' + ui.empty('user', 'No employee record', 'Your account isn’t linked to an employee record.') + '</div>' };
    var c = store.clockContext(e.id), next = c.shift || c.next;
    var mine = S.shifts.filter(function (s) { return s.employeeId === e.id && s.status === 'published' && s.date >= n.date && s.date <= R.addDays(n.date, 13); }).sort(function (a, b) { return R.span(a).s - R.span(b).s; });
    var clockCard = '<div class="card hero-clock"><div class="card__b"><div class="row row--between wrap" style="gap:14px"><div><div class="muted small">' + (c.open ? 'You’re clocked in' : next ? (c.shift ? 'Your shift today' : 'Your next shift') : 'No upcoming shifts') + '</div>' +
      (next ? '<div class="hero-clock__t">' + ui.relDay(next.date) + ', ' + next.start + '–' + next.end + '</div><div class="muted">' + ui.esc(store.role(next.jobRoleId).name) + ' · ' + ui.esc(store.locName(next.locationId)) + (next.breakMin ? ' · ' + next.breakMin + ' min break' : '') + '</div>' : '<div class="hero-clock__t">Enjoy your time off</div>') + '</div>' +
      '<a class="btn ' + (c.open ? 'btn--dark' : 'btn--p') + '" href="#/clock">' + I(c.open ? 'logout' : 'login', 16) + (c.open ? 'Clock out' : 'Open time clock') + '</a></div>' + (c.todayMin ? '<p class="small muted" style="margin-top:10px">Recorded today: <b class="num" style="color:var(--ink)">' + ui.hm(c.todayMin) + '</b></p>' : '') + '</div></div>';
    var list = '<div class="card"><div class="card__h"><h2>' + I('week', 16) + 'My shifts</h2><a class="link" href="#/schedule">Full schedule</a></div>' + (mine.length ? mine.map(function (s) { return '<div class="lrow"><span class="dchip"><b>' + (+s.date.slice(8)) + '</b>' + ui.DAY[R.dow(s.date)] + '</span><span class="lrow__m"><div class="lrow__t">' + s.start + '–' + s.end + ' · ' + ui.esc(store.role(s.jobRoleId).name) + '</div><div class="lrow__s">' + ui.esc(store.locName(s.locationId)) + (s.breakMin ? ' · ' + s.breakMin + ' min break' : '') + (s.notes ? ' · ' + ui.esc(s.notes) : '') + '</div></span><span class="lrow__r small muted">' + ui.hrs(R.shiftMinutes(s)) + '</span></div>'; }).join('') : ui.empty('cal', 'No published shifts in the next two weeks', 'Your manager publishes the schedule here.')) + '</div>';
    var bal = S.leaveTypes.filter(function (t) { return !t.archived && t.allowance; }).map(function (t) { var b = store.balance(e, t); return '<div class="balc"><span>' + ui.esc(t.name) + '</span><b class="num">' + b.available + '</b><em>of ' + b.entitlement + ' days' + (b.pending ? ' · ' + b.pending + ' pending' : '') + '</em></div>'; }).join('');
    var reqs = S.leave.filter(function (l) { return l.employeeId === e.id; }).sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; }).slice(0, 4);
    var to = '<div class="card"><div class="card__h"><h2>' + I('plane', 16) + 'Time off</h2><a class="btn btn--sm" href="#/time-off?new=1">' + I('plus', 14) + 'Request</a></div><div class="card__b"><div class="balgrid">' + bal + '</div></div>' + reqs.map(function (r) { return '<a class="lrow" href="#/time-off?req=' + r.id + '"><span class="lrow__m"><div class="lrow__t">' + ui.esc(store.leaveType(r.typeId).name) + '</div><div class="lrow__s">' + ui.range(r.start, r.end) + ' · ' + ui.plural(r.days, 'day') + '</div></span><span class="lrow__r">' + ui.badge(r.status) + '</span></a>'; }).join('') + '</div>';
    var notes = store.notifications().slice(0, 5);
    var nc = '<div class="card"><div class="card__h"><h2>' + I('bell', 16) + 'Updates for you</h2></div>' + (notes.length ? notes.map(function (x) { return '<a class="lrow" href="' + x.link + '" data-n="' + x.id + '"><span class="ico-c">' + I(x.icon, 14) + '</span><span class="lrow__m"><div class="lrow__t">' + ui.esc(x.title) + '</div><div class="lrow__s">' + ui.esc(x.body) + ' · ' + ui.rel(x.at) + '</div></span></a>'; }).join('') : ui.empty('bell', 'No updates', 'Schedule changes and request decisions appear here.')) + '</div>';
    var hire = '';
    if (store.can('hiring.view')) {
      var cnt = store.stageCounts(), open = S.jobs.filter(function (j) { return j.status === 'open'; }).length;
      var ivs = []; S.candidates.forEach(function (cd) { cd.interviews.forEach(function (iv) { if (iv.date >= n.date && iv.date <= R.addDays(n.date, 7)) ivs.push([cd, iv]); }); });
      ivs.sort(function (a, b) { return (a[1].date + a[1].time) < (b[1].date + b[1].time) ? -1 : 1; });
      hire = '<div class="card"><div class="card__h"><h2>' + I('briefcase', 16) + 'Hiring</h2><a class="link" href="#/hiring">Pipeline</a></div><div class="mstrip" style="--n:3;border:0;box-shadow:none;border-radius:0;border-bottom:1px solid var(--line)"><a class="mstat" href="#/hiring/jobs"><span>Open roles</span><b>' + open + '</b></a><a class="mstat" href="#/hiring?stage=applied"><span>New applications</span><b>' + (cnt.applied || 0) + '</b></a><a class="mstat" href="#/hiring?stage=offer"><span>Offers out</span><b>' + (cnt.offer || 0) + '</b></a></div>' +
        (ivs.length ? ivs.slice(0, 4).map(function (x) { return '<a class="lrow" href="#/hiring/c/' + x[0].id + '"><span class="dchip"><b>' + (+x[1].date.slice(8)) + '</b>' + ui.DAY[R.dow(x[1].date)] + '</span><span class="lrow__m"><div class="lrow__t">' + ui.esc(x[0].first + ' ' + x[0].last) + '</div><div class="lrow__s">' + ui.esc(x[1].type) + ' · ' + x[1].time + ' · ' + ui.esc((store.job(x[0].jobId) || {}).title || '') + '</div></span></a>'; }).join('') : '<div class="card__b muted">No interviews in the next 7 days.</div>') + '</div>';
    }
    return {
      title: 'Home',
      html: staleNote() + app.ph(greet() + ', ' + ui.esc(e.first), ui.date(n.date, { dow: true, year: true }) + ' · ' + ui.esc(store.role(e.jobRoleId).name) + ', ' + ui.esc(store.locName(e.locationId)) + ' ' + ui.demoTag('Demo workspace')) +
        '<div class="grid g-main"><div class="stack">' + clockCard + hire + list + '</div><div class="stack">' + to + nc + '</div></div>',
      mount: function (v) { bindCommon(v); v.querySelectorAll('[data-n]').forEach(function (a) { a.addEventListener('click', function () { store.markRead(a.getAttribute('data-n')); }); }); },
      tick: function () { app.refresh(); }
    };
  }

  KT.route('/overview', function (p, q) { return store.isManager() && (store.canAny('schedule.edit') || store.canAny('attendance.view') || store.can('payroll.view')) ? managerView(q) : employeeView(); });
})();
