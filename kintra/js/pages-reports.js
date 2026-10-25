/* ============================================================
   KINTRA — Reports. Every figure is computed from the records in
   the workspace (shifts, clock records, leave, candidates, payroll)
   and follows the date range, location and department filters.
   ============================================================ */
(function () {
  'use strict';
  var ui = KT.ui, store = KT.store, R = KT.rules, app = KT.app, I = ui.icon, C = KT.charts;
  var COL = ['#0F766B', '#3B5E92', '#98592A', '#67589C', '#59625F', '#B4372B'];

  var REPORTS = [
    ['attendance', 'Attendance & absence', 'clock'], ['hours', 'Scheduled vs actual', 'timer'], ['cost', 'Labour cost', 'coins', 'reports.cost'], ['overtime', 'Overtime', 'trend'],
    ['leave', 'Leave utilisation', 'plane'], ['coverage', 'Staffing coverage', 'gauge'], ['recruiting', 'Recruitment', 'briefcase', 'hiring.view'], ['headcount', 'Headcount', 'users'], ['payroll', 'Payroll summary', 'wallet', 'payroll.view']
  ];
  function allowed(r) { return !r[3] || (r[3] === 'reports.cost' ? store.canAny('reports.cost') : store.can(r[3])); }

  KT.route('/reports', function (p, q) {
    if (!store.canAny('reports.view')) return { title: 'Reports', html: app.ph('Reports') + app.locked('Reports are for managers', 'reports.view') };
    var S = store.state, today = store.today(), list = REPORTS.filter(allowed);
    var rid = list.some(function (r) { return r[0] === q.r; }) ? q.r : list[0][0];
    var range = q.range || '8w', from, to;
    var cw = R.weekStart(today, S.org.weekStart);
    if (range === '4w') { from = R.addDays(cw, -21); to = today; } else if (range === '8w') { from = R.addDays(cw, -49); to = today; } else if (range === 'period') { var pp = store.periodFor(today); from = pp.start; to = today; } else if (range === 'last') { var lp = store.periodFor(R.addDays(store.periodFor(today).start, -1)); from = lp.start; to = lp.end; } else if (range === 'next') { from = today; to = R.addDays(cw, 13); } else { from = q.from || R.addDays(today, -27); to = q.to || today; }
    if (rid === 'coverage' && !q.range) { from = R.addDays(cw, -14); to = R.addDays(cw, 13); range = 'cov'; }
    if (to < from) to = from;
    var dept = q.dept || '';
    var weeks = []; for (var w = R.weekStart(from, S.org.weekStart); w <= to; w = R.addDays(w, 7)) weeks.push(w);
    var wlabel = weeks.map(function (x) { return ui.dshort(x); });
    function keepEmp(e) { return e && (!dept || e.deptId === dept); }
    function wk(d) { return R.weekStart(d, S.org.weekStart); }
    var locs = store.myLocations().filter(function (l) { return store.inScope(l.id); });
    var out = { kpis: [], charts: [], table: null, note: '' };

    // ---- shared data ----
    var att = null;
    function attRows() { if (!att) att = store.attendance(from, to < today ? to : today).filter(function (r) { return keepEmp(store.emp(r.empId)) && r.ev.state !== 'upcoming' && r.ev.state !== 'due'; }); return att; }

    if (rid === 'attendance') {
      var rows = attRows().filter(function (r) { return r.shift; });
      var per = weeks.map(function (w) { var rs = rows.filter(function (r) { return wk(r.date) === w; }); var att2 = rs.filter(function (r) { return r.ev.state !== 'on_leave'; }); var present = att2.filter(function (r) { return r.entry; }).length; return { w: w, n: att2.length, present: present, late: rs.filter(function (r) { return r.ev.late; }).length, absent: rs.filter(function (r) { return r.ev.state === 'absent'; }).length, lateMin: rs.reduce(function (a, r) { return a + r.ev.late; }, 0) }; });
      var tot = per.reduce(function (a, x) { a.n += x.n; a.present += x.present; a.late += x.late; a.absent += x.absent; a.lateMin += x.lateMin; return a; }, { n: 0, present: 0, late: 0, absent: 0, lateMin: 0 });
      out.kpis = [['Attendance rate', tot.n ? ui.pct(tot.present / tot.n, 1) : '—', 'shifts with a clock record'], ['Late arrivals', tot.late, tot.late ? 'avg ' + Math.round(tot.lateMin / tot.late) + ' min late' : ''], ['Absences', tot.absent, tot.n ? ui.pct(tot.absent / tot.n, 1) + ' of shifts' : ''], ['Shifts', tot.n, 'excluding approved leave']];
      out.charts.push({ title: 'Attendance rate by week', render: function (el) { C.line(el, { labels: wlabel, series: [{ name: 'Attendance rate', values: per.map(function (x) { return x.n ? Math.round(x.present / x.n * 1000) / 10 : 0; }), color: COL[0] }], fmt: function (v) { return v + '%'; }, yFmt: function (v) { return v + '%'; }, max: 100, height: 220, aria: 'Attendance rate by week' }); } });
      out.charts.push({ title: 'Late arrivals and absences by week', render: function (el) { C.bars(el, { labels: wlabel, series: [{ name: 'Late arrivals', values: per.map(function (x) { return x.late; }), color: '#D08A1F' }, { name: 'Absences', values: per.map(function (x) { return x.absent; }), color: '#B4372B' }], height: 220 }); }, legend: [['Late arrivals', '#D08A1F'], ['Absences', '#B4372B']] });
      var by = groupBy(rows, function (r) { var e = store.emp(r.empId); return store.locName(r.locationId) + '|' + store.dept(e.deptId).name; });
      out.table = { cols: ['Location', 'Department', 'Shifts', 'Attended', 'Rate', 'Late', 'Avg min late', 'Absent'], rows: Object.keys(by).sort().map(function (k) { var rs = by[k].filter(function (r) { return r.ev.state !== 'on_leave'; }), pr = rs.filter(function (r) { return r.entry; }).length, lt = rs.filter(function (r) { return r.ev.late; }); return k.split('|').concat([rs.length, pr, rs.length ? ui.pct(pr / rs.length, 1) : '—', lt.length, lt.length ? Math.round(lt.reduce(function (a, r) { return a + r.ev.late; }, 0) / lt.length) : 0, rs.filter(function (r) { return r.ev.state === 'absent'; }).length]); }) };
    }
    else if (rid === 'hours') {
      var rows2 = attRows();
      var per2 = weeks.map(function (w) { var rs = rows2.filter(function (r) { return wk(r.date) === w; }); return { s: rs.reduce(function (a, r) { return a + (r.shift && r.ev.state !== 'on_leave' ? R.shiftMinutes(r.shift) : 0); }, 0) / 60, a: rs.reduce(function (a, r) { return a + r.ev.workedMin; }, 0) / 60 }; });
      var ts = per2.reduce(function (a, x) { return a + x.s; }, 0), ta = per2.reduce(function (a, x) { return a + x.a; }, 0);
      out.kpis = [['Scheduled hours', ui.num(ts), 'published shifts'], ['Actual hours', ui.num(ta), 'from clock records'], ['Variance', (ta - ts >= 0 ? '+' : '−') + ui.num(Math.abs(ta - ts)) + ' h', ts ? ui.pct((ta - ts) / ts, 1) : ''], ['Unscheduled hours', ui.num(rows2.filter(function (r) { return !r.shift; }).reduce(function (a, r) { return a + r.ev.workedMin; }, 0) / 60), 'worked without a shift']];
      out.charts.push({ title: 'Scheduled vs actual hours by week', render: function (el) { C.bars(el, { labels: wlabel, series: [{ name: 'Scheduled', values: per2.map(function (x) { return Math.round(x.s); }), color: '#B9C8C4' }, { name: 'Actual', values: per2.map(function (x) { return Math.round(x.a); }), color: COL[0] }], height: 240, fmt: function (v) { return ui.num(v) + ' h'; } }); }, legend: [['Scheduled', '#B9C8C4'], ['Actual', COL[0]]] });
      var by2 = groupBy(rows2, function (r) { return store.locName(r.locationId) + '|' + store.dept(store.emp(r.empId).deptId).name; });
      out.table = { cols: ['Location', 'Department', 'Scheduled h', 'Actual h', 'Variance h', 'Variance %'], rows: Object.keys(by2).sort().map(function (k) { var s = by2[k].reduce(function (a, r) { return a + (r.shift && r.ev.state !== 'on_leave' ? R.shiftMinutes(r.shift) : 0); }, 0) / 60, a = by2[k].reduce(function (x, r) { return x + r.ev.workedMin; }, 0) / 60; return k.split('|').concat([ui.dec(s), ui.dec(a), (a - s >= 0 ? '+' : '') + ui.dec(a - s), s ? ui.pct((a - s) / s, 1) : '—']); }) };
    }
    else if (rid === 'cost' || rid === 'overtime') {
      var rows3 = attRows(), P = S.org.payroll, thr = P.overtimeAfterWeekly, om = P.overtimeMultiplier;
      // per employee per week
      var ew = {};
      rows3.forEach(function (r) { if (!r.entry) return; var k = r.empId + '|' + wk(r.date); ew[k] = (ew[k] || 0) + r.ev.workedMin / 60; });
      var perW = weeks.map(function (w) {
        var o = { w: w, reg: 0, ot: 0, cost: 0, otCost: 0, sal: 0, byLoc: {} };
        Object.keys(ew).forEach(function (k) { var pr = k.split('|'); if (pr[1] !== w) return; var e = store.emp(pr[0]); var h = ew[k]; var ot = e.payType === 'hourly' && h > thr ? h - thr : 0; o.reg += h - ot; o.ot += ot; if (e.payType === 'hourly') { var c = (h - ot) * e.rate + ot * e.rate * om; o.cost += c; o.otCost += ot * e.rate * om; o.byLoc[e.locationId] = (o.byLoc[e.locationId] || 0) + c; } });
        store.employees({ includeLeft: true }).filter(function (e) { return e.payType === 'salaried' && keepEmp(e) && store.inScope(e.locationId) && e.start <= R.addDays(w, 6) && (!e.end || e.end >= w); }).forEach(function (e) { var c = e.salary * 12 / 52; o.sal += c; o.byLoc[e.locationId] = (o.byLoc[e.locationId] || 0) + c; });
        return o;
      });
      if (rid === 'cost') {
        var tc = perW.reduce(function (a, x) { return a + x.cost + x.sal; }, 0), th = perW.reduce(function (a, x) { return a + x.reg + x.ot; }, 0);
        out.kpis = [['Labour cost', ui.money(tc), ui.range(from, to < today ? to : today)], ['Hourly staff', ui.money(perW.reduce(function (a, x) { return a + x.cost; }, 0)), 'actual hours × rate'], ['Salaried staff', ui.money(perW.reduce(function (a, x) { return a + x.sal; }, 0)), 'weekly share of salary'], ['Cost per hour worked', th ? ui.money(perW.reduce(function (a, x) { return a + x.cost; }, 0) / th) : '—', 'hourly staff']];
        out.charts.push({ title: 'Labour cost by week and location', render: function (el) { C.bars(el, { labels: wlabel, stacked: true, series: locs.map(function (l, i) { return { name: l.name, values: perW.map(function (x) { return Math.round(x.byLoc[l.id] || 0); }), color: COL[i % COL.length] }; }), height: 250, fmt: function (v) { return ui.money(v); } }); }, legend: locs.map(function (l, i) { return [l.name, COL[i % COL.length]]; }) });
        var byD = {};
        Object.keys(ew).forEach(function (k) { var e = store.emp(k.split('|')[0]); if (e.payType !== 'hourly') return; var h = ew[k], ot = h > thr ? h - thr : 0, key = store.locName(e.locationId) + '|' + store.dept(e.deptId).name; byD[key] = byD[key] || { h: 0, c: 0, ot: 0 }; byD[key].h += h; byD[key].c += (h - ot) * e.rate + ot * e.rate * om; byD[key].ot += ot * e.rate * om; });
        out.table = { cols: ['Location', 'Department', 'Hours (hourly staff)', 'Cost', 'of which overtime'], rows: Object.keys(byD).sort().map(function (k) { return k.split('|').concat([ui.dec(byD[k].h), ui.money(byD[k].c), ui.money(byD[k].ot)]); }) };
        out.note = 'Cost uses approved and pending clock records × hourly rates, with the overtime multiplier above ' + thr + ' h a week, plus each salaried person’s weekly share. Employer contributions are in Payroll.';
      } else {
        var tot2 = perW.reduce(function (a, x) { return a + x.ot; }, 0);
        var people = {}; Object.keys(ew).forEach(function (k) { var pr = k.split('|'), e = store.emp(pr[0]); if (e.payType === 'hourly' && ew[k] > thr) { people[pr[0]] = people[pr[0]] || { h: 0, wks: 0 }; people[pr[0]].h += ew[k] - thr; people[pr[0]].wks++; } });
        var top = Object.keys(people).sort(function (a, b) { return people[b].h - people[a].h; });
        out.kpis = [['Overtime hours', ui.dec(tot2), 'over ' + thr + ' h a week'], ['People with overtime', top.length, 'hourly staff'], ['Overtime premium', store.canAny('reports.cost') ? ui.money(perW.reduce(function (a, x) { return a + x.otCost; }, 0)) : '—', 'at ×' + om], ['Share of hours', ui.pct(tot2 / Math.max(1, perW.reduce(function (a, x) { return a + x.reg + x.ot; }, 0)), 1), 'of all hours worked']];
        out.charts.push({ title: 'Overtime hours by week', render: function (el) { C.bars(el, { labels: wlabel, series: [{ name: 'Overtime hours', values: perW.map(function (x) { return Math.round(x.ot * 10) / 10; }), color: '#D08A1F' }], height: 220, fmt: function (v) { return ui.dec(v) + ' h'; } }); } });
        out.table = { cols: ['Employee', 'Role', 'Location', 'Weeks over threshold', 'Overtime hours'], rows: top.map(function (id) { var e = store.emp(id); return [store.name(e), store.role(e.jobRoleId).name, store.locName(e.locationId), people[id].wks, ui.dec(people[id].h)]; }) };
        out.note = 'Weekly overtime threshold: ' + thr + ' h (Settings → Payroll). Salaried staff are not overtime-eligible in this configuration.';
      }
    }
    else if (rid === 'leave') {
      var lv = S.leave.filter(function (l) { var e = store.emp(l.employeeId); return l.status === 'approved' && e && keepEmp(e) && store.inScope(e.locationId) && R.overlapsRange(l.start, l.end, from, to); });
      function daysIn(l, a, b) { var s = l.start < a ? a : l.start, e = l.end > b ? b : l.end; return s > e ? 0 : store.leaveDays(s, e, l.half); }
      var types = S.leaveTypes;
      var perL = weeks.map(function (w) { return types.map(function (t) { return lv.filter(function (l) { return l.typeId === t.id; }).reduce(function (a, l) { return a + daysIn(l, w, R.addDays(w, 6)); }, 0); }); });
      var emps = store.employees().filter(keepEmp);
      var annual = types[0], ent = 0, used = 0; emps.forEach(function (e) { var b = store.balance(e, annual); ent += b.entitlement || 0; used += b.used; });
      out.kpis = [['Days taken', ui.dec(lv.reduce(function (a, l) { return a + daysIn(l, from, to); }, 0)), 'approved, in range'], ['Sick days', ui.dec(lv.filter(function (l) { return l.typeId === 'lt-sick'; }).reduce(function (a, l) { return a + daysIn(l, from, to); }, 0)), ''], ['Annual leave used', ent ? ui.pct(used / ent, 0) : '—', 'of this year’s entitlement'], ['Pending requests', S.leave.filter(function (l) { var e = store.emp(l.employeeId); return l.status === 'pending' && e && keepEmp(e) && store.inScope(e.locationId); }).length, 'awaiting a decision']];
      out.charts.push({ title: 'Leave days by week and type', render: function (el) { C.bars(el, { labels: wlabel, stacked: true, series: types.map(function (t, i) { return { name: t.name, values: perL.map(function (x) { return x[i]; }), color: ['#0F766B', '#D08A1F', '#3B5E92', '#8A918E'][i % 4] }; }), height: 230, fmt: function (v) { return ui.dec(v) + ' days'; } }); }, legend: types.map(function (t, i) { return [t.name, ['#0F766B', '#D08A1F', '#3B5E92', '#8A918E'][i % 4]]; }) });
      var byDept = groupBy(emps, function (e) { return store.dept(e.deptId).name; });
      out.table = { cols: ['Department', 'People', 'Annual leave taken (year)', 'Entitlement (year)', 'Used', 'Sick days in range'], rows: Object.keys(byDept).sort().map(function (k) { var en = 0, us = 0; byDept[k].forEach(function (e) { var b = store.balance(e, annual); en += b.entitlement || 0; us += b.used; }); var sick = lv.filter(function (l) { return l.typeId === 'lt-sick' && byDept[k].some(function (e) { return e.id === l.employeeId; }); }).reduce(function (a, l) { return a + daysIn(l, from, to); }, 0); return [k, byDept[k].length, ui.dec(us), ui.dec(en), en ? ui.pct(us / en, 0) : '—', ui.dec(sick)]; }) };
    }
    else if (rid === 'coverage') {
      var days = R.range(from, to), roles = {};
      var perC = weeks.map(function () { return 0; });
      days.forEach(function (d) { locs.forEach(function (l) { R.coverage(d, l.id, S.shifts.filter(function (s) { return s.date >= R.addDays(d, -1) && s.date <= d; }), S.requirements).forEach(function (c) { if (dept && store.role(c.req.jobRoleId).deptId !== dept) return; var k = l.name + '|' + store.role(c.req.jobRoleId).name; roles[k] = roles[k] || { req: 0, gap: 0, days: 0 }; roles[k].req += c.slots.length; roles[k].gap += c.gapHours; if (!c.ok) roles[k].days++; perC[weeks.indexOf(wk(d))] += c.gapHours; }); }); });
      var reqH = Object.keys(roles).reduce(function (a, k) { return a + roles[k].req; }, 0), gapH = Object.keys(roles).reduce(function (a, k) { return a + roles[k].gap; }, 0);
      out.kpis = [['Coverage', reqH ? ui.pct(1 - gapH / reqH, 1) : '—', 'of required staffed hours'], ['Understaffed hours', gapH, 'role-hours below requirement'], ['Days with a gap', Object.keys(roles).reduce(function (a, k) { return a + roles[k].days; }, 0), 'role-days'], ['Requirements', S.requirements.filter(function (q2) { return locs.some(function (l) { return l.id === q2.locationId; }); }).length, 'configured']];
      out.charts.push({ title: 'Understaffed hours by week', render: function (el) { C.bars(el, { labels: wlabel, series: [{ name: 'Understaffed hours', values: perC, color: '#B4372B' }], height: 220, fmt: function (v) { return v + ' h'; } }); } });
      out.table = { cols: ['Location', 'Role', 'Required role-hours', 'Understaffed hours', 'Coverage', 'Days with a gap'], rows: Object.keys(roles).sort().map(function (k) { var r = roles[k]; return k.split('|').concat([r.req, r.gap, ui.pct(1 - r.gap / r.req, 1), r.days]); }) };
      out.note = 'Compares scheduled (assigned) shifts with the staffing requirements in Settings → Staffing. Open shifts don’t count as covered until someone is assigned.';
    }
    else if (rid === 'recruiting') {
      var cs = S.candidates.filter(function (c) { var j = store.job(c.jobId); return j && store.inScope(j.locationId) && (!dept || j.deptId === dept) && c.appliedAt.slice(0, 10) >= from && c.appliedAt.slice(0, 10) <= to; });
      var stages = S.org.hiring.stages, cnt = {}; cs.forEach(function (c) { cnt[c.stage] = (cnt[c.stage] || 0) + 1; });
      var hired = cs.filter(function (c) { return c.stage === 'hired'; }), tth = hired.map(function (c) { var h = store.history('candidate', c.id).filter(function (a) { return a.to === 'hired'; })[0]; return h ? R.diffDays(c.appliedAt.slice(0, 10), h.at.slice(0, 10)) : null; }).filter(function (x) { return x != null; });
      var src = groupBy(cs, function (c) { return c.source; });
      out.kpis = [['Applications', cs.length, ui.range(from, to)], ['Active in pipeline', cs.filter(function (c) { return c.stage !== 'hired' && c.stage !== 'rejected'; }).length, ''], ['Hired', hired.length, cs.length ? ui.pct(hired.length / cs.length, 0) + ' of applicants' : ''], ['Time to hire', tth.length ? Math.round(tth.reduce(function (a, b) { return a + b; }, 0) / tth.length) + ' days' : '—', 'application to hire']];
      out.charts.push({ title: 'Candidates by current stage', render: function (el) { el.innerHTML = C.hbars(stages.map(function (s) { return { label: s.name, value: cnt[s.id] || 0, color: s.id === 'rejected' ? '#B4372B' : s.id === 'hired' ? '#2B7A4B' : '#0F766B' }; })); } });
      out.charts.push({ title: 'Applications by source', render: function (el) { C.donut(el, { items: Object.keys(src).map(function (k, i) { return { label: k, value: src[k].length, color: COL[i % COL.length] }; }), center: String(cs.length), centerSub: 'applications', size: 140 }); } });
      var byJob = groupBy(cs, function (c) { var j = store.job(c.jobId); return j.title + ' · ' + store.locName(j.locationId); });
      out.table = { cols: ['Job'].concat(stages.map(function (s) { return s.name; })).concat(['Total']), rows: Object.keys(byJob).sort().map(function (k) { return [k].concat(stages.map(function (s) { return byJob[k].filter(function (c) { return c.stage === s.id; }).length; })).concat([byJob[k].length]); }) };
    }
    else if (rid === 'headcount') {
      var all = store.employees({ includeLeft: true }).filter(function (e) { return keepEmp(e) && store.inScope(e.locationId); });
      var activeAt = function (d) { return all.filter(function (e) { return e.start <= d && (!e.end || e.end >= d); }).length; };
      var starts = all.filter(function (e) { return R.inRange(e.start, from, to); }), leavers = all.filter(function (e) { return e.end && R.inRange(e.end, from, to); });
      out.kpis = [['Headcount today', activeAt(today), all.filter(function (e) { return e.status === 'onboarding'; }).length + ' onboarding'], ['Starters', starts.length, ui.range(from, to)], ['Leavers', leavers.length, ui.range(from, to)], ['Hourly / salaried', all.filter(function (e) { return e.status !== 'terminated' && e.payType === 'hourly'; }).length + ' / ' + all.filter(function (e) { return e.status !== 'terminated' && e.payType === 'salaried'; }).length, '']];
      out.charts.push({ title: 'Headcount at the end of each week', render: function (el) { C.line(el, { labels: wlabel, series: [{ name: 'Headcount', values: weeks.map(function (x) { return activeAt(R.addDays(x, 6) > today ? today : R.addDays(x, 6)); }), color: COL[0], area: true }], height: 220 }); } });
      var cur = all.filter(function (e) { return e.status !== 'terminated'; });
      var byL = groupBy(cur, function (e) { return store.locName(e.locationId); });
      out.charts.push({ title: 'Current headcount by location', render: function (el) { el.innerHTML = C.hbars(Object.keys(byL).sort().map(function (k, i) { return { label: k, value: byL[k].length, color: COL[i % COL.length] }; })); } });
      var byLD = groupBy(cur, function (e) { return store.locName(e.locationId) + '|' + store.dept(e.deptId).name; });
      out.table = { cols: ['Location', 'Department', 'Headcount', 'Full-time', 'Part-time / casual', 'Onboarding'], rows: Object.keys(byLD).sort().map(function (k) { var l = byLD[k]; return k.split('|').concat([l.length, l.filter(function (e) { return e.type === 'Full-time'; }).length, l.filter(function (e) { return e.type !== 'Full-time'; }).length, l.filter(function (e) { return e.status === 'onboarding'; }).length]); }) };
    }
    else if (rid === 'payroll') {
      var ps = S.periods.filter(function (pp2) { return pp2.records && R.overlapsRange(pp2.start, pp2.end, from, to); });
      function fil(pp2) { return pp2.records.filter(function (r) { var e = store.emp(r.employeeId); return keepEmp(e) && store.inScope(e.locationId); }); }
      var sums = ps.map(function (pp2) { return R.summarise(fil(pp2)); });
      out.kpis = [['Periods', ps.length, 'calculated or paid'], ['Gross pay', ui.money(sums.reduce(function (a, s) { return a + s.gross; }, 0)), ''], ['Net pay', ui.money(sums.reduce(function (a, s) { return a + s.net; }, 0)), ''], ['Employer cost', ui.money(sums.reduce(function (a, s) { return a + s.cost; }, 0)), 'gross + contributions']];
      out.charts.push({ title: 'Payroll by period', render: function (el) { C.bars(el, { labels: ps.map(function (pp2) { return ui.dshort(pp2.start); }), tipLabels: ps.map(function (pp2) { return ui.range(pp2.start, pp2.end); }), stacked: true, series: [{ name: 'Net pay', values: sums.map(function (s) { return Math.round(s.net); }), color: COL[0] }, { name: 'Deductions', values: sums.map(function (s) { return Math.round(s.deductions); }), color: '#8FB1A9' }, { name: 'Employer contributions', values: sums.map(function (s) { return Math.round(s.employer); }), color: '#C9B48A' }], height: 240, fmt: function (v) { return ui.money(v); } }); }, legend: [['Net pay', COL[0]], ['Deductions', '#8FB1A9'], ['Employer contributions', '#C9B48A']] });
      out.table = { cols: ['Period', 'Status', 'Employees', 'Hours', 'Gross', 'Deductions', 'Net', 'Employer', 'Total cost'], rows: ps.map(function (pp2, i) { var s = sums[i]; return [ui.range(pp2.start, pp2.end), ui.label(pp2.status), s.count, ui.num(s.hours), ui.money(s.gross), ui.money(s.deductions), ui.money(s.net), ui.money(s.employer), ui.money(s.cost)]; }) };
      out.note = 'Calculated with example payroll rules. Periods that are still open aren’t included until they’re calculated.';
    }

    var rdef = REPORTS.filter(function (r) { return r[0] === rid; })[0];
    var nav = '<nav class="rep-nav" aria-label="Reports">' + list.map(function (r) { return '<a href="#/reports?r=' + r[0] + '&range=' + (q.range || '') + (dept ? '&dept=' + dept : '') + '" class="' + (r[0] === rid ? 'on' : '') + '"' + (r[0] === rid ? ' aria-current="page"' : '') + '>' + I(r[2], 16) + r[1] + '</a>'; }).join('') + '</nav>';
    var ranges = [['4w', 'Last 4 weeks'], ['8w', 'Last 8 weeks'], ['period', 'This pay period'], ['last', 'Last pay period']].concat(rid === 'coverage' ? [['cov', 'Past 2 + next 2 weeks'], ['next', 'Next 2 weeks']] : []).concat([['custom', 'Custom']]);
    var filters = '<div class="rep-filters">' + ui.select('range', ranges.map(function (r) { return { value: r[0], label: r[1] }; }), range, { cls: 'sel--sm', attr: ' aria-label="Date range"' }) + (range === 'custom' ? '<input class="inp inp--sm" type="date" name="from" value="' + from + '" aria-label="From"><input class="inp inp--sm" type="date" name="to" value="' + to + '" aria-label="To">' : '<span class="muted small">' + ui.range(from, to) + '</span>') + ui.select('dept', app.deptOptions(true), dept, { cls: 'sel--sm', attr: ' aria-label="Department"' }) + '<span class="muted small">' + I('pin', 12).replace('<svg', '<svg style="display:inline;vertical-align:-2px"') + ' ' + (store.scopeLoc() ? store.locName(store.scopeLoc()) : 'All your locations') + ' (top bar)</span><span class="sp"></span><button class="btn btn--sm" data-csv>' + I('download', 14) + 'Export CSV</button><button class="btn btn--sm" data-print>' + I('printer', 14) + 'Print</button></div>';
    var kp = '<div class="mstrip" style="--n:' + out.kpis.length + '">' + out.kpis.map(function (k) { return '<div class="mstat"><span>' + ui.esc(k[0]) + '</span><b>' + k[1] + '</b><em>' + ui.esc(k[2] || '') + '</em></div>'; }).join('') + '</div>';
    var charts = '<div class="grid ' + (out.charts.length > 1 ? 'g-2' : '') + '" style="margin-top:14px">' + out.charts.map(function (c, i) { return '<div class="card"><div class="card__h"><h2>' + ui.esc(c.title) + '</h2>' + (c.legend ? '<span class="legend">' + c.legend.map(function (l) { return '<span><i style="background:' + l[1] + '"></i>' + ui.esc(l[0]) + '</span>'; }).join('') + '</span>' : '') + '</div><div class="card__b"><div data-chart="' + i + '"></div></div></div>'; }).join('') + '</div>';
    var tbl = out.table ? '<div class="card" style="margin-top:14px"><div class="card__h"><h2>Breakdown</h2><span class="sub">' + out.table.rows.length + ' rows</span></div><div class="tscroll"><table class="t"><thead><tr>' + out.table.cols.map(function (c, i) { return '<th class="' + (i > 1 || (i > 0 && typeof out.table.rows[0] !== 'undefined' && typeof out.table.rows[0][i] === 'number') ? 'r' : '') + '">' + ui.esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' + (out.table.rows.length ? out.table.rows.map(function (r) { return '<tr>' + r.map(function (c, i) { return '<td class="' + (i > 1 || (i > 0 && typeof c === 'number') ? 'r' : '') + '">' + ui.esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') : '<tr><td colspan="' + out.table.cols.length + '">' + ui.empty('chart', 'No data for these filters', '') + '</td></tr>') + '</tbody></table></div></div>' : '';
    return {
      title: rdef[1] + ' · Reports', wide: true,
      html: app.ph('Reports', 'Computed from the records in this workspace. ' + ui.demoTag('Demo data')) + '<div class="rep-layout">' + nav + '<div style="min-width:0"><h2 style="font-size:16px;font-weight:650;margin-bottom:10px">' + ui.esc(rdef[1]) + '</h2>' + filters + kp + charts + tbl + (out.note ? '<p class="muted small" style="margin-top:10px">' + ui.esc(out.note) + '</p>' : '') + '</div></div>',
      mount: function (v) {
        out.charts.forEach(function (c, i) { c.render(v.querySelector('[data-chart="' + i + '"]')); });
        function upd(o) { Object.keys(o).forEach(function (k) { q[k] = o[k]; }); q.r = rid; app.updateQuery(q); app.refresh(); }
        v.querySelector('[name=range]').onchange = function (e) { upd({ range: e.target.value, from: e.target.value === 'custom' ? from : '', to: e.target.value === 'custom' ? to : '' }); };
        v.querySelector('[name=dept]').onchange = function (e) { upd({ dept: e.target.value }); };
        ['from', 'to'].forEach(function (k) { var el = v.querySelector('[name=' + k + ']'); if (el) el.onchange = function () { var o = {}; o[k] = el.value; upd(o); }; });
        v.querySelector('[data-csv]').onclick = function () { if (!out.table) return; ui.csv('kintra-report-' + rid + '-' + from + '_' + to + '.csv', out.table.cols.map(function (c, i) { return { label: c, csv: function (r) { return String(r[i]).replace(/^KES /, ''); } }; }).concat([{ label: 'Demo data', csv: function () { return 'yes'; } }]), out.table.rows); };
        v.querySelector('[data-print]').onclick = function () { window.print(); };
      }
    };
  });
  function groupBy(list, f) { var o = {}; list.forEach(function (x) { var k = f(x); (o[k] = o[k] || []).push(x); }); return o; }
})();
