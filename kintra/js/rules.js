/* ============================================================
   KINTRA — business rules (pure functions, no DOM, no storage).
   Dates are 'YYYY-MM-DD' and times 'HH:MM' in the organisation's
   time zone; clock stamps are 'YYYY-MM-DDTHH:MM'. Shifts that end
   at or before their start time finish the next day.
   UMD: runs in the browser and in Node (see tests/).
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.KT = root.KT || {}; root.KT.rules = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var R = {};

  /* ---------- dates ---------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  R.pad = pad;
  R.epochDay = function (d) { var p = d.split('-'); return Math.round(Date.UTC(+p[0], +p[1] - 1, +p[2]) / 864e5); };
  R.fromEpoch = function (n) { var x = new Date(n * 864e5); return x.getUTCFullYear() + '-' + pad(x.getUTCMonth() + 1) + '-' + pad(x.getUTCDate()); };
  R.addDays = function (d, n) { return R.fromEpoch(R.epochDay(d) + n); };
  R.diffDays = function (a, b) { return R.epochDay(b) - R.epochDay(a); };
  R.dow = function (d) { return ((R.epochDay(d) % 7) + 11) % 7; }; // 0 = Sunday (1970-01-01 was a Thursday)
  R.weekStart = function (d, ws) { ws = ws == null ? 1 : ws; return R.addDays(d, -((R.dow(d) - ws + 7) % 7)); };
  R.range = function (a, b) { var out = [], n = R.diffDays(a, b); for (var i = 0; i <= n; i++) out.push(R.addDays(a, i)); return out; };
  R.inRange = function (d, a, b) { return d >= a && d <= b; };
  R.overlapsRange = function (a1, b1, a2, b2) { return a1 <= b2 && a2 <= b1; };
  R.toMin = function (t) { if (!/^\d{1,2}:\d{2}$/.test(t || '')) return NaN; var p = t.split(':'); var h = +p[0], m = +p[1]; if (h > 23 || m > 59) return NaN; return h * 60 + m; };
  R.fromMin = function (m) { m = ((m % 1440) + 1440) % 1440; return pad(Math.floor(m / 60)) + ':' + pad(m % 60); };
  R.stamp = function (d, t) { return d + 'T' + t; };
  R.abs = function (stamp) { if (!stamp) return null; var p = stamp.split('T'); return R.epochDay(p[0]) * 1440 + R.toMin(p[1]); };
  R.fromAbs = function (a) { return R.fromEpoch(Math.floor(a / 1440)) + 'T' + R.fromMin(a % 1440); };
  R.hours = function (min) { return Math.round(min / 60 * 100) / 100; };
  R.round2 = function (x) { return Math.round((x + Number.EPSILON) * 100) / 100; };

  /* ---------- shifts ---------- */
  // absolute start/end minutes of a shift
  R.span = function (sh) {
    var s = R.epochDay(sh.date) * 1440 + R.toMin(sh.start), e = R.epochDay(sh.date) * 1440 + R.toMin(sh.end);
    if (e <= s) e += 1440;
    return { s: s, e: e };
  };
  R.shiftMinutes = function (sh) { var x = R.span(sh); return Math.max(0, x.e - x.s - (+sh.breakMin || 0)); };
  R.isLive = function (sh) { return sh && sh.status !== 'cancelled'; };

  // the scheduling rules that apply at a location (organisation defaults + location overrides)
  R.rulesFor = function (org, loc) {
    var base = org.scheduling || {}, o = (loc && loc.rules) || {}, out = {};
    Object.keys(base).forEach(function (k) { out[k] = base[k]; });
    Object.keys(o).forEach(function (k) { if (o[k] !== '' && o[k] != null) out[k] = o[k]; });
    return out;
  };

  /* validateShift(shift, ctx) -> { errors:[{code,text}], warnings:[{code,text}] }
     ctx: { shifts, employee, leave (requests for that employee), rules, weekStart, location } */
  R.validateShift = function (sh, ctx) {
    var errors = [], warnings = [], rules = ctx.rules || {};
    function E(c, t) { errors.push({ code: c, text: t }); }
    function W(c, t) { warnings.push({ code: c, text: t }); }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(sh.date || '')) E('date', 'Choose a date.');
    if (isNaN(R.toMin(sh.start)) || isNaN(R.toMin(sh.end))) E('time', 'Enter start and end times as HH:MM.');
    if (!sh.locationId) E('location', 'Choose a location.');
    if (!sh.jobRoleId) E('role', 'Choose a role.');
    if (errors.length) return { errors: errors, warnings: warnings };
    if (sh.start === sh.end) E('zero', 'The shift starts and ends at the same time.');
    var mins = R.span(sh), dur = mins.e - mins.s, brk = +sh.breakMin || 0;
    if (brk < 0) E('break', 'A break can’t be negative.');
    else if (brk >= dur) E('break', 'The break is as long as the shift.');
    if (rules.maxShiftHours && dur / 60 > rules.maxShiftHours) W('long', 'Longer than the ' + rules.maxShiftHours + '-hour maximum for this location (' + R.hours(dur) + ' h).');
    if (rules.minShiftHours && dur / 60 < rules.minShiftHours) W('short', 'Shorter than the ' + rules.minShiftHours + '-hour minimum (' + R.hours(dur) + ' h).');
    if (rules.breakAfterHours && dur / 60 > rules.breakAfterHours && brk < (rules.minBreakMin || 0)) W('nobreak', 'Shifts over ' + rules.breakAfterHours + ' h need at least a ' + rules.minBreakMin + '-minute break.');
    var emp = ctx.employee;
    if (emp) {
      if (emp.status === 'terminated' && (!emp.end || sh.date > emp.end)) E('inactive', emp.first + ' has left the organisation.');
      if (emp.end && sh.date > emp.end && emp.status !== 'terminated') E('inactive', emp.first + '’s last day is ' + emp.end + '.');
      if (emp.start && sh.date < emp.start) E('notstarted', emp.first + ' starts on ' + emp.start + '.');
      var mine = (ctx.shifts || []).filter(function (o) { return o.id !== sh.id && o.employeeId === emp.id && R.isLive(o); });
      mine.forEach(function (o) {
        var x = R.span(o);
        if (x.s < mins.e && mins.s < x.e) E('overlap', 'Overlaps ' + emp.first + '’s ' + o.start + '–' + o.end + ' shift on ' + o.date + '.');
      });
      (ctx.leave || []).forEach(function (l) {
        if (l.employeeId !== emp.id || !R.inRange(sh.date, l.start, l.end)) return;
        if (l.status === 'approved') E('leave', emp.first + ' is on approved leave (' + l.start + (l.end !== l.start ? ' to ' + l.end : '') + ').');
        else if (l.status === 'pending') W('leave_pending', emp.first + ' has a pending time-off request for this date.');
      });
      if (rules.minRestHours) {
        mine.forEach(function (o) {
          var x = R.span(o), gap = x.s >= mins.e ? x.s - mins.e : mins.s >= x.e ? mins.s - x.e : -1;
          if (gap >= 0 && gap < rules.minRestHours * 60) W('rest', 'Only ' + R.hours(gap) + ' h rest next to the ' + o.date + ' ' + o.start + ' shift (minimum ' + rules.minRestHours + ' h).');
        });
      }
      if (rules.weeklyHoursLimit) {
        var ws = R.weekStart(sh.date, ctx.weekStart == null ? 1 : ctx.weekStart), we = R.addDays(ws, 6);
        var total = R.shiftMinutes(sh) + mine.filter(function (o) { return R.inRange(o.date, ws, we); }).reduce(function (a, o) { return a + R.shiftMinutes(o); }, 0);
        if (total / 60 > rules.weeklyHoursLimit) W('overtime', emp.first + ' would work ' + R.hours(total) + ' h this week, over the ' + rules.weeklyHoursLimit + ' h overtime threshold.');
      }
      if ((emp.locationIds || [emp.locationId]).indexOf(sh.locationId) < 0) W('location', emp.first + ' isn’t usually assigned to this location.');
      if ((emp.skills || [emp.jobRoleId]).indexOf(sh.jobRoleId) < 0) W('skill', 'This role isn’t one of ' + emp.first + '’s listed roles.');
    }
    return { errors: errors, warnings: warnings };
  };

  /* ---------- staffing coverage ----------
     For each requirement that applies on `date` at `locationId`, count scheduled shifts
     of that role covering each hour of the window. Open (unassigned) shifts don't count. */
  R.coverage = function (date, locationId, shifts, reqs) {
    var dow = R.dow(date), day0 = R.epochDay(date) * 1440;
    return (reqs || []).filter(function (q) { return q.locationId === locationId && (q.days || []).indexOf(dow) >= 0; }).map(function (q) {
      var s = day0 + R.toMin(q.start), e = day0 + R.toMin(q.end); if (e <= s) e += 1440;
      var live = shifts.filter(function (x) { return R.isLive(x) && x.employeeId && x.locationId === locationId && x.jobRoleId === q.jobRoleId; }).map(R.span);
      var slots = [], minC = Infinity, gaps = 0;
      for (var t = s; t < e; t += 60) {
        var te = Math.min(t + 60, e);
        var c = live.filter(function (x) { return x.s <= t && x.e >= te; }).length;
        slots.push({ t: t, c: c });
        if (c < minC) minC = c;
        if (c < q.count) gaps++;
      }
      if (minC === Infinity) minC = 0;
      return { req: q, required: q.count, scheduled: minC, gapHours: gaps, slots: slots, ok: gaps === 0 };
    });
  };

  /* ---------- attendance ----------
     evaluate(shift|null, entry|null, opts) -> { state, late, early, workedMin, schedMin, variance, flags[] }
     opts: { now (abs minutes), graceMin, earlyGraceMin, onLeave } */
  R.breakMinutes = function (entry, nowAbs) {
    return (entry && entry.breaks || []).reduce(function (a, b) { var s = R.abs(b.s), e = b.e ? R.abs(b.e) : nowAbs; return a + (e && s != null ? Math.max(0, e - s) : 0); }, 0);
  };
  R.evaluate = function (sh, en, o) {
    o = o || {};
    var now = o.now, grace = o.graceMin == null ? 5 : o.graceMin, eg = o.earlyGraceMin == null ? 10 : o.earlyGraceMin;
    var res = { state: 'upcoming', late: 0, early: 0, workedMin: 0, schedMin: sh ? R.shiftMinutes(sh) : 0, variance: 0, flags: [] };
    var sp = sh ? R.span(sh) : null;
    if (o.onLeave && !en) { res.state = 'on_leave'; res.schedMin = 0; return res; }
    if (!en) {
      if (!sp) return res;
      if (now == null || now < sp.s) { res.state = 'upcoming'; return res; }
      if (now < sp.e) { res.state = now > sp.s + grace ? 'not_in' : 'due'; if (res.state === 'not_in') res.flags.push('missed_in'); return res; }
      res.state = 'absent'; res.flags.push('absent'); res.variance = -res.schedMin; return res;
    }
    var ci = R.abs(en.in), co = en.out ? R.abs(en.out) : null;
    if (!sh) res.flags.push('unscheduled');
    if (sp && ci != null && ci > sp.s + grace) { res.late = ci - sp.s; res.flags.push('late'); }
    var onBreak = (en.breaks || []).some(function (b) { return !b.e; });
    if (co == null) {
      var endBy = sp ? sp.e : ci + 12 * 60;
      if (now != null && now < endBy + 120 && R.epochDay(en.in.split('T')[0]) >= Math.floor(now / 1440) - 1) {
        res.state = onBreak ? 'on_break' : 'working';
        res.workedMin = Math.max(0, now - ci - R.breakMinutes(en, now));
      } else { res.state = 'missing_out'; res.flags.push('missed_out'); }
    } else {
      res.state = 'done';
      res.workedMin = Math.max(0, co - ci - R.breakMinutes(en, co));
      if (sp && co < sp.e - eg) { res.early = sp.e - co; res.flags.push('early'); }
    }
    if (res.state === 'done') res.variance = res.workedMin - res.schedMin;
    return res;
  };

  /* ---------- leave ---------- */
  R.leaveDays = function (start, end, mode, holidays, half) {
    if (!start || !end || end < start) return 0;
    var hol = {}; (holidays || []).forEach(function (h) { hol[h.date] = 1; });
    var n = 0;
    R.range(start, end).forEach(function (d) {
      var w = R.dow(d);
      if (mode === 'weekdays' && (w === 0 || w === 6)) return;
      if (mode === 'mon_sat' && w === 0) return;
      if (mode !== 'calendar' && hol[d]) return;
      n++;
    });
    if (half && start === end && n) return 0.5;
    return n;
  };
  // entitlement for the leave year containing `today`, pro-rated for people who started this year
  R.entitlement = function (type, emp, today) {
    if (!type.allowance) return null; // unlimited / not tracked
    var y = today.slice(0, 4), ys = y + '-01-01';
    if (emp.start && emp.start > ys) {
      var months = 12 - (+emp.start.slice(5, 7) - 1);
      return Math.round(type.allowance * months / 12 * 2) / 2;
    }
    return type.allowance;
  };
  R.balance = function (type, emp, requests, today) {
    var y = today.slice(0, 4);
    var mine = requests.filter(function (r) { return r.employeeId === emp.id && r.typeId === type.id && r.start.slice(0, 4) === y; });
    var used = mine.filter(function (r) { return r.status === 'approved'; }).reduce(function (a, r) { return a + r.days; }, 0);
    var pending = mine.filter(function (r) { return r.status === 'pending'; }).reduce(function (a, r) { return a + r.days; }, 0);
    var ent = R.entitlement(type, emp, today);
    return { entitlement: ent, used: used, pending: pending, available: ent == null ? null : Math.round((ent - used) * 2) / 2 };
  };
  R.overlappingLeave = function (req, all, employees) {
    var me = employees.filter(function (e) { return e.id === req.employeeId; })[0];
    if (!me) return [];
    return all.filter(function (r) {
      if (r.id === req.id || r.employeeId === req.employeeId || (r.status !== 'approved' && r.status !== 'pending')) return false;
      if (!R.overlapsRange(req.start, req.end, r.start, r.end)) return false;
      var e = employees.filter(function (x) { return x.id === r.employeeId; })[0];
      return e && e.locationId === me.locationId && e.deptId === me.deptId;
    });
  };

  /* ---------- payroll ----------
     calcRecord(emp, period, ctx) -> record. ctx: {entries (this employee's), leave (approved, this employee),
     leaveTypes, holidays, payroll (org config), periodsPerYear, weekStart, leaveMode} */
  R.periodsPerYear = function (freq) { return { weekly: 52, fortnightly: 26, semimonthly: 24, monthly: 12 }[freq] || 26; };
  R.applyRules = function (gross, rules, ppy, payType) {
    var ded = [], emp = [], pre = 0;
    var active = (rules || []).filter(function (r) { return r.active !== false && (!r.appliesTo || r.appliesTo === 'all' || r.appliesTo === payType); });
    function capped(x, r) { if (r.min != null && r.min !== '' && x < +r.min) x = +r.min; if (r.max != null && r.max !== '' && x > +r.max) x = +r.max; return R.round2(Math.max(0, x)); }
    active.filter(function (r) { return r.pretax; }).forEach(function (r) {
      if (r.method === 'percent') {
        if (+r.rate) { var a = capped(gross * r.rate / 100, r); ded.push({ ruleId: r.id, name: r.name, amount: a }); pre += a; }
        if (+r.employerRate) emp.push({ ruleId: r.id, name: r.name, amount: capped(gross * r.employerRate / 100, r) });
      } else if (r.method === 'fixed') { var f = R.round2(+r.amount || 0); ded.push({ ruleId: r.id, name: r.name, amount: f }); pre += f; }
    });
    var taxable = Math.max(0, gross - pre);
    active.filter(function (r) { return !r.pretax; }).forEach(function (r) {
      var base = r.base === 'taxable' ? taxable : gross, a = 0;
      if (r.method === 'percent') {
        if (+r.rate) ded.push({ ruleId: r.id, name: r.name, amount: capped(base * r.rate / 100, r) });
        if (+r.employerRate) emp.push({ ruleId: r.id, name: r.name, amount: capped(base * r.employerRate / 100, r) });
        return;
      }
      if (r.method === 'fixed') { ded.push({ ruleId: r.id, name: r.name, amount: R.round2(+r.amount || 0) }); return; }
      if (r.method === 'bands') {
        var prev = 0;
        (r.bands || []).forEach(function (b) {
          var top = b.upTo == null || b.upTo === '' ? Infinity : +b.upTo / ppy;
          if (base > prev) a += (Math.min(base, top) - prev) * (+b.rate / 100);
          prev = top;
        });
        a -= (+r.relief || 0) / ppy;
        ded.push({ ruleId: r.id, name: r.name, amount: R.round2(Math.max(0, a)) });
      }
    });
    return { deductions: ded, employer: emp, taxable: R.round2(taxable) };
  };

  R.calcRecord = function (emp, period, ctx) {
    var P = ctx.payroll || {}, ppy = R.periodsPerYear(P.frequency), flags = [];
    var hol = {}; (ctx.holidays || []).forEach(function (h) { hol[h.date] = h.name; });
    var entries = (ctx.entries || []).filter(function (e) { return R.inRange(e.date, period.start, period.end); });
    var approved = entries.filter(function (e) { return e.status === 'approved' && e.out; });
    var pending = entries.filter(function (e) { return e.status !== 'approved' && e.out; });
    var noOut = entries.filter(function (e) { return !e.out; });
    if (pending.length) flags.push({ code: 'pending', level: 'warn', text: pending.length + ' timesheet' + (pending.length > 1 ? 's' : '') + ' awaiting approval (' + R.hours(pending.reduce(function (a, e) { return a + R.evaluate(null, e, {}).workedMin; }, 0)) + ' h not included)' });
    if (noOut.length) flags.push({ code: 'missed_out', level: 'warn', text: noOut.length + ' clock record' + (noOut.length > 1 ? 's' : '') + ' with no clock-out, not included' });
    var rec = { employeeId: emp.id, payType: emp.payType, rate: emp.rate || 0, salary: emp.salary || 0, hours: { regular: 0, overtime: 0, holiday: 0, leave: 0 }, earnings: [], gross: 0, deductions: [], employer: [], net: 0, cost: 0, flags: flags, entryCount: approved.length };
    // paid leave days in the period
    var types = {}; (ctx.leaveTypes || []).forEach(function (t) { types[t.id] = t; });
    var paidLeaveDays = 0, unpaidLeaveDays = 0;
    (ctx.leave || []).forEach(function (l) {
      if (l.status !== 'approved' || !R.overlapsRange(l.start, l.end, period.start, period.end)) return;
      var s = l.start < period.start ? period.start : l.start, e = l.end > period.end ? period.end : l.end;
      var d = R.leaveDays(s, e, ctx.leaveMode || 'weekdays', ctx.holidays, l.half);
      if (types[l.typeId] && types[l.typeId].paid) paidLeaveDays += d; else unpaidLeaveDays += d;
    });
    var hpd = +P.hoursPerDay || 8;
    if (emp.payType === 'hourly') {
      if (!emp.rate) flags.push({ code: 'no_rate', level: 'err', text: 'No hourly rate on the employee record' });
      var weeks = {}, holMin = 0, ws = ctx.weekStart == null ? 1 : ctx.weekStart;
      approved.forEach(function (e) {
        var w = R.evaluate(null, e, {}).workedMin;
        if (hol[e.date]) { holMin += w; return; }
        var k = R.weekStart(e.date, ws); weeks[k] = (weeks[k] || 0) + w;
      });
      var thr = (+P.overtimeAfterWeekly || 0) * 60, reg = 0, ot = 0;
      Object.keys(weeks).forEach(function (k) { var m = weeks[k]; if (thr && m > thr && emp.otEligible !== false) { reg += thr; ot += m - thr; } else reg += m; });
      rec.hours.regular = R.hours(reg); rec.hours.overtime = R.hours(ot); rec.hours.holiday = R.hours(holMin); rec.hours.leave = paidLeaveDays * hpd;
      var r = +emp.rate || 0, om = +P.overtimeMultiplier || 1.5, hm = +P.holidayMultiplier || 2;
      rec.earnings.push({ label: 'Regular hours', qty: rec.hours.regular, unit: 'h', rate: r, amount: R.round2(reg / 60 * r) });
      if (ot) rec.earnings.push({ label: 'Overtime ×' + om, qty: rec.hours.overtime, unit: 'h', rate: R.round2(r * om), amount: R.round2(ot / 60 * r * om) });
      if (holMin) rec.earnings.push({ label: 'Public holiday ×' + hm, qty: rec.hours.holiday, unit: 'h', rate: R.round2(r * hm), amount: R.round2(holMin / 60 * r * hm) });
      if (paidLeaveDays) rec.earnings.push({ label: 'Paid leave', qty: rec.hours.leave, unit: 'h', rate: r, amount: R.round2(paidLeaveDays * hpd * r) });
      if (!reg && !ot && !holMin && !paidLeaveDays && !pending.length) flags.push({ code: 'no_hours', level: 'info', text: 'No approved hours in this period' });
    } else {
      if (!emp.salary) flags.push({ code: 'no_rate', level: 'err', text: 'No salary on the employee record' });
      var per = (+emp.salary || 0) * 12 / ppy;
      // pro-rate for people who started or left inside the period
      var days = R.diffDays(period.start, period.end) + 1, from = emp.start && emp.start > period.start ? emp.start : period.start, to = emp.end && emp.end < period.end ? emp.end : period.end;
      var worked = Math.max(0, R.diffDays(from, to) + 1);
      if (worked < days) { per = per * worked / days; flags.push({ code: 'prorated', level: 'info', text: 'Salary pro-rated for ' + worked + ' of ' + days + ' days' }); }
      rec.earnings.push({ label: 'Salary', qty: null, unit: '', rate: null, amount: R.round2(per) });
      if (unpaidLeaveDays) { var daily = (+emp.salary || 0) * 12 / 260; rec.earnings.push({ label: 'Unpaid leave', qty: unpaidLeaveDays, unit: 'days', rate: R.round2(daily), amount: -R.round2(daily * unpaidLeaveDays) }); }
      rec.hours.leave = paidLeaveDays * hpd;
      rec.hours.regular = R.hours(approved.reduce(function (a, e) { return a + R.evaluate(null, e, {}).workedMin; }, 0));
    }
    if (+emp.allowance) rec.earnings.push({ label: 'Allowance', qty: null, unit: '', rate: null, amount: R.round2(+emp.allowance) });
    rec.gross = R.round2(rec.earnings.reduce(function (a, x) { return a + x.amount; }, 0));
    var d = R.applyRules(rec.gross, P.rules, ppy, emp.payType);
    rec.deductions = d.deductions; rec.employer = d.employer; rec.taxable = d.taxable;
    var td = d.deductions.reduce(function (a, x) { return a + x.amount; }, 0), te = d.employer.reduce(function (a, x) { return a + x.amount; }, 0);
    rec.totalDeductions = R.round2(td); rec.totalEmployer = R.round2(te);
    rec.net = R.round2(rec.gross - td); rec.cost = R.round2(rec.gross + te);
    if (rec.net < 0) flags.push({ code: 'negative', level: 'err', text: 'Deductions are larger than gross pay' });
    return rec;
  };
  R.summarise = function (records) {
    var s = { count: records.length, gross: 0, net: 0, deductions: 0, employer: 0, cost: 0, hours: 0, overtime: 0, flags: 0, errors: 0 };
    records.forEach(function (r) {
      s.gross += r.gross; s.net += r.net; s.deductions += r.totalDeductions; s.employer += r.totalEmployer; s.cost += r.cost;
      s.hours += r.hours.regular + r.hours.overtime + r.hours.holiday; s.overtime += r.hours.overtime;
      s.flags += r.flags.filter(function (f) { return f.level !== 'info'; }).length; s.errors += r.flags.filter(function (f) { return f.level === 'err'; }).length;
    });
    ['gross', 'net', 'deductions', 'employer', 'cost', 'hours', 'overtime'].forEach(function (k) { s[k] = R.round2(s[k]); });
    return s;
  };

  /* ---------- deterministic random (seed data) ---------- */
  R.rng = function (seed) { var s = seed >>> 0; return function () { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

  return R;
});
