/* ============================================================
   KINTRA — service layer. The only module that changes data.
   Every write: 1) checks permission with KT.policy (the rules a
   server must apply), 2) validates, 3) writes, 4) records an audit
   event and real notifications, 5) saves and notifies views.
   Persistence in this template: the visitor's browser
   (localStorage for records, IndexedDB for uploaded files).
   ============================================================ */
window.KT = window.KT || {};
(function () {
  'use strict';
  var R = KT.rules, policy = KT.policy;
  var KEY = 'kintra:demo:v1', PREF = 'kintra:demo:prefs';
  var S = null, subs = [], persistOk = true;
  var store = KT.store = {};

  function err(msg) { var e = new Error(msg); e.userFacing = true; return e; }
  function uid(p) { return (p || 'x') + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function by(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  store.err = err;

  /* ---------- clock (organisation time zone) ---------- */
  store.now = function () {
    if (window.KT_NOW) { var p = window.KT_NOW.split('T'); return { date: p[0], min: R.toMin(p[1]), abs: R.abs(window.KT_NOW), stamp: window.KT_NOW }; }
    var tz = (S && S.org.timezone) || 'Africa/Nairobi', parts = {};
    try {
      new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).forEach(function (x) { parts[x.type] = x.value; });
    } catch (e) { var d = new Date(); parts = { year: d.getFullYear(), month: R.pad(d.getMonth() + 1), day: R.pad(d.getDate()), hour: R.pad(d.getHours()), minute: R.pad(d.getMinutes()) }; }
    var date = parts.year + '-' + parts.month + '-' + parts.day, hm = (parts.hour === '24' ? '00' : parts.hour) + ':' + parts.minute;
    return { date: date, min: R.toMin(hm), abs: R.epochDay(date) * 1440 + R.toMin(hm), stamp: date + 'T' + hm };
  };
  store.today = function () { return store.now().date; };
  function stamp() { return store.now().stamp; }

  /* ---------- persistence ---------- */
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); persistOk = true; } catch (e) { persistOk = false; } }
  function emit(what) { S.meta.dirty = true; save(); subs.forEach(function (f) { try { f(what); } catch (e) { console.error(e); } }); }
  store.subscribe = function (f) { subs.push(f); };
  store.persistOk = function () { return persistOk; };
  function fresh() { var n = store.now(); return KT.seed(n.date, n.min); }
  store.init = function () {
    try { var raw = localStorage.getItem(KEY); if (raw) S = JSON.parse(raw); } catch (e) { persistOk = false; }
    if (!S || S.v !== 1) { S = fresh(); save(); }
    else if (S.meta.seededOn !== store.today()) {
      // Untouched demo from an earlier day: rebuild it around today so the sample week stays current.
      if (!S.meta.dirty) { S = fresh(); save(); } else S.meta.stale = R.diffDays(S.meta.seededOn, store.today());
    }
    store.state = S;
    ensurePeriods();
  };
  store.reset = function () { S = fresh(); store.state = S; KT.files.clear(); save(); S.meta.dirty = false; subs.forEach(function (f) { f('reset'); }); };
  store.prefs = (function () { try { return JSON.parse(localStorage.getItem(PREF) || '{}') || {}; } catch (e) { return {}; } })();
  store.setPref = function (k, v) { store.prefs[k] = v; try { localStorage.setItem(PREF, JSON.stringify(store.prefs)); } catch (e) { /* optional */ } };
  store.exportJson = function () { return JSON.stringify(S, null, 1); };

  /* ---------- lookups ---------- */
  store.me = function () { return by(S.users, S.currentUserId) || S.users[0]; };
  store.myEmp = function () { var m = store.me(); return m.employeeId ? by(S.employees, m.employeeId) : null; };
  store.user = function (id) { return by(S.users, id); };
  store.userOf = function (empId) { return S.users.filter(function (u) { return u.employeeId === empId; })[0] || null; };
  store.emp = function (id) { return by(S.employees, id); };
  store.loc = function (id) { return by(S.locations, id); };
  store.dept = function (id) { return by(S.departments, id); };
  store.role = function (id) { return by(S.jobRoles, id); };
  store.team = function (id) { return by(S.teams, id); };
  store.shift = function (id) { return by(S.shifts, id); };
  store.entry = function (id) { return by(S.entries, id); };
  store.leaveReq = function (id) { return by(S.leave, id); };
  store.leaveType = function (id) { return by(S.leaveTypes, id); };
  store.job = function (id) { return by(S.jobs, id); };
  store.cand = function (id) { return by(S.candidates, id); };
  store.period = function (id) { return by(S.periods, id); };
  store.stage = function (id) { return by(S.org.hiring.stages, id); };
  store.name = function (e) { return e ? e.first + ' ' + e.last : 'Unassigned'; };
  store.empName = function (id) { var e = store.emp(id); return e ? store.name(e) : 'Unassigned'; };
  store.userName = function (id) { var u = id && store.user(id); return u ? u.name : (id ? 'Former user' : 'System'); };

  /* ---------- permissions & scope ---------- */
  store.can = function (perm, locId) { return policy.has(store.me(), perm, locId); };
  store.canAny = function (perm) { var me = store.me(); return S.locations.some(function (l) { return policy.has(me, perm, l.id); }); };
  store.why = function (perm, locId) { return policy.why(store.me(), perm, locId); };
  function need(perm, locId) { policy.assert(store.me(), perm, locId); }
  store.need = need;
  store.myLocations = function () { var me = store.me(); return S.locations.filter(function (l) { return policy.hasLoc(me, l.id); }); };
  store.scopeLoc = function () { var id = store.prefs.loc; return id && store.loc(id) && policy.hasLoc(store.me(), id) ? id : null; };
  // in the current location selection, and in the user's location access
  store.inScope = function (locId) { var me = store.me(); if (!policy.hasLoc(me, locId)) return false; var sel = store.scopeLoc(); return !sel || sel === locId; };
  store.canSeeEmp = function (e) { return policy.canSeeEmployee(store.me(), e); };
  store.canSeeSensitive = function (e) { return policy.canSeeSensitive(store.me(), e); };
  store.isManager = function () { return store.me().role !== 'employee'; };
  // employees visible in the current scope (self always included when in scope)
  store.employees = function (o) {
    o = o || {}; var me = store.me();
    return S.employees.filter(function (e) {
      if (!o.includeLeft && e.status === 'terminated') return false;
      if (o.perm ? !(policy.has(me, o.perm, e.locationId) || (o.self !== false && me.employeeId === e.id)) : !store.canSeeEmp(e)) return false;
      if (o.anyLoc) return true;
      return store.inScope(e.locationId) || (e.locationIds || []).some(store.inScope);
    });
  };
  store.locName = function (id) { var l = store.loc(id); return l ? l.name : '—'; };
  store.rulesAt = function (locId) { return R.rulesFor(S.org, store.loc(locId)); };

  /* ---------- audit & notifications ---------- */
  function log(entity, entityId, action, text, extra) {
    var a = { id: uid('au'), at: stamp(), by: store.me().id, entity: entity, entityId: entityId, action: action, text: text };
    if (extra) for (var k in extra) a[k] = extra[k];
    S.audit.unshift(a);
    if (S.audit.length > 600) S.audit.length = 600;
    return a;
  }
  store.log = log;
  store.history = function (entity, id) { return S.audit.filter(function (a) { return a.entity === entity && a.entityId === id; }); };
  // recipients: list of user ids, or a function(user) -> bool. Respects each user's preferences; never notifies the actor.
  function notify(recipients, n) {
    var me = store.me().id;
    var list = typeof recipients === 'function' ? S.users.filter(recipients).map(function (u) { return u.id; }) : (recipients || []);
    list = list.filter(function (id, i) { var u = store.user(id); return u && u.status === 'active' && id !== me && list.indexOf(id) === i && (!u.notify || u.notify[n.cat] !== false); });
    if (!list.length) return 0;
    S.notifications.unshift({ id: uid('n'), at: stamp(), userIds: list, read: false, readBy: [], kind: n.kind || 'info', icon: n.icon || 'bell', title: n.title, body: n.body || '', link: n.link || '#/overview', cat: n.cat });
    if (S.notifications.length > 150) S.notifications.length = 150;
    return list.length;
  }
  store.notifications = function () {
    var me = store.me().id;
    return S.notifications.filter(function (n) { return !n.userIds || n.userIds.indexOf(me) >= 0; }).map(function (n) { n.isRead = (n.readBy || []).indexOf(me) >= 0; return n; });
  };
  store.markRead = function (id) { var n = by(S.notifications, id); if (!n) return; n.readBy = n.readBy || []; if (n.readBy.indexOf(store.me().id) < 0) n.readBy.push(store.me().id); emit('notif'); };
  store.markAllRead = function () { var me = store.me().id; store.notifications().forEach(function (n) { n.readBy = n.readBy || []; if (n.readBy.indexOf(me) < 0) n.readBy.push(me); }); emit('notif'); };
  function usersWith(perm, locId) { return function (u) { return policy.has(u, perm, locId); }; }
  store.setCurrentUser = function (id) { var u = store.user(id); if (!u || u.status !== 'active') throw err('That user isn’t active.'); S.currentUserId = id; save(); subs.forEach(function (f) { f('user'); }); };

  /* =========================================================
     SCHEDULING
     ========================================================= */
  store.shiftsBetween = function (from, to, o) {
    o = o || {};
    return S.shifts.filter(function (s) {
      if (s.status === 'cancelled' || s.date < from || s.date > to) return false;
      if (!store.inScope(s.locationId)) {
        // employees always see their own shifts
        var me = store.me(); if (!(me.employeeId && s.employeeId === me.employeeId && !store.scopeLoc())) return false;
      }
      return true;
    });
  };
  store.checkShift = function (data) {
    var emp = data.employeeId ? store.emp(data.employeeId) : null;
    return R.validateShift(data, { shifts: S.shifts, employee: emp, leave: S.leave, rules: store.rulesAt(data.locationId), weekStart: S.org.weekStart });
  };
  function lockedByPayroll(date) { var p = store.periodFor(date); return p && (p.status === 'approved' || p.status === 'paid') ? p : null; }
  store.saveShift = function (data) {
    var old = data.id ? store.shift(data.id) : null;
    need('schedule.edit', data.locationId);
    if (old) need('schedule.edit', old.locationId);
    var sh = { id: old ? old.id : uid('sh'), employeeId: data.employeeId || null, date: data.date, start: data.start, end: data.end, breakMin: +data.breakMin || 0, jobRoleId: data.jobRoleId, locationId: data.locationId, status: old ? old.status : (data.status || 'draft'), notes: (data.notes || '').trim() };
    if (!sh.notes) delete sh.notes;
    var v = store.checkShift(sh);
    if (v.errors.length) throw err(v.errors[0].text);
    var lp = lockedByPayroll(sh.date) || (old && lockedByPayroll(old.date));
    if (lp) throw err('Payroll for ' + lp.start + ' to ' + lp.end + ' is ' + lp.status + '. Reopen it before changing shifts in that period.');
    sh.updatedAt = stamp(); sh.updatedBy = store.me().id;
    var desc = store.describeShift(sh);
    if (old) {
      var changes = [];
      if (old.employeeId !== sh.employeeId) changes.push((old.employeeId ? store.empName(old.employeeId) : 'Open') + ' → ' + (sh.employeeId ? store.empName(sh.employeeId) : 'Open'));
      if (old.date !== sh.date || old.start !== sh.start || old.end !== sh.end) changes.push(old.date + ' ' + old.start + '–' + old.end + ' → ' + sh.date + ' ' + sh.start + '–' + sh.end);
      if (old.jobRoleId !== sh.jobRoleId) changes.push('role ' + store.role(old.jobRoleId).name + ' → ' + store.role(sh.jobRoleId).name);
      if (old.locationId !== sh.locationId) changes.push(store.locName(old.locationId) + ' → ' + store.locName(sh.locationId));
      if ((+old.breakMin || 0) !== sh.breakMin) changes.push('break ' + (old.breakMin || 0) + ' → ' + sh.breakMin + ' min');
      if ((old.notes || '') !== (sh.notes || '')) changes.push('notes');
      if (!changes.length) return { shift: old, warnings: v.warnings, changed: false };
      for (var k in sh) old[k] = sh[k];
      if (!sh.notes) delete old.notes;
      log('shift', old.id, 'updated', 'Changed ' + desc + ': ' + changes.join('; '), { locationId: old.locationId, empId: old.employeeId });
      if (old.status === 'published') {
        var who = [];
        if (old.employeeId) who.push(old.employeeId);
        if (data._prevEmp && data._prevEmp !== old.employeeId) who.push(data._prevEmp);
        notifyEmployees(who, { kind: 'info', icon: 'cal', title: 'Your shift changed', body: sh.date + ' ' + sh.start + '–' + sh.end + ' at ' + store.locName(sh.locationId), link: '#/schedule?date=' + sh.date, cat: 'schedule' });
      }
      emit('shift'); return { shift: old, warnings: v.warnings, changed: true };
    }
    S.shifts.push(sh);
    log('shift', sh.id, 'created', 'Added ' + desc + (sh.status === 'draft' ? ' (draft)' : ''), { locationId: sh.locationId, empId: sh.employeeId });
    emit('shift'); return { shift: sh, warnings: v.warnings, changed: true };
  };
  store.describeShift = function (sh) { return (sh.employeeId ? store.empName(sh.employeeId) + '’s ' : 'an open ') + store.role(sh.jobRoleId).name + ' shift on ' + sh.date + ' ' + sh.start + '–' + sh.end; };
  function notifyEmployees(empIds, n) { var us = empIds.map(function (e) { var u = store.userOf(e); return u && u.id; }).filter(Boolean); if (us.length) notify(us, n); }
  store.moveShift = function (id, to) {
    var sh = store.shift(id); if (!sh) throw err('That shift no longer exists.');
    var data = clone(sh); data._prevEmp = sh.employeeId;
    if ('employeeId' in to) data.employeeId = to.employeeId;
    if (to.date) data.date = to.date;
    if (to.locationId) data.locationId = to.locationId;
    if (data.employeeId === sh.employeeId && data.date === sh.date && data.locationId === sh.locationId) return { shift: sh, changed: false, warnings: [] };
    return store.saveShift(data);
  };
  store.cancelShift = function (id, reason) {
    var sh = store.shift(id); if (!sh) throw err('That shift no longer exists.');
    need('schedule.edit', sh.locationId);
    var lp = lockedByPayroll(sh.date); if (lp) throw err('Payroll for this period is ' + lp.status + '. Reopen it first.');
    var desc = store.describeShift(sh);
    if (sh.status === 'draft') { S.shifts.splice(S.shifts.indexOf(sh), 1); log('shift', sh.id, 'deleted', 'Deleted draft ' + desc, { locationId: sh.locationId, empId: sh.employeeId }); }
    else {
      sh.status = 'cancelled'; sh.updatedAt = stamp(); sh.updatedBy = store.me().id; sh.cancelReason = reason || '';
      log('shift', sh.id, 'cancelled', 'Cancelled ' + desc, { locationId: sh.locationId, empId: sh.employeeId, reason: reason || '' });
      if (sh.employeeId) notifyEmployees([sh.employeeId], { kind: 'warn', icon: 'x', title: 'A shift was cancelled', body: sh.date + ' ' + sh.start + '–' + sh.end + ' at ' + store.locName(sh.locationId) + (reason ? ' · ' + reason : ''), link: '#/schedule?date=' + sh.date, cat: 'schedule' });
    }
    emit('shift');
  };
  store.copyWeek = function (fromMon, toMon) {
    var locs = S.locations.filter(function (l) { return store.inScope(l.id) && store.can('schedule.edit', l.id); }).map(function (l) { return l.id; });
    if (!locs.length) need('schedule.edit', store.scopeLoc());
    var delta = R.diffDays(fromMon, toMon), src = S.shifts.filter(function (s) { return s.status !== 'cancelled' && R.inRange(s.date, fromMon, R.addDays(fromMon, 6)) && locs.indexOf(s.locationId) >= 0; });
    var made = 0, skipped = [], asOpen = 0;
    src.forEach(function (s) {
      var n = { id: uid('sh'), employeeId: s.employeeId, date: R.addDays(s.date, delta), start: s.start, end: s.end, breakMin: s.breakMin, jobRoleId: s.jobRoleId, locationId: s.locationId, status: 'draft', updatedAt: stamp(), updatedBy: store.me().id };
      if (s.notes) n.notes = s.notes;
      var dup = S.shifts.some(function (o) { return o.status !== 'cancelled' && o.date === n.date && o.start === n.start && o.end === n.end && o.locationId === n.locationId && o.jobRoleId === n.jobRoleId && o.employeeId === n.employeeId; });
      if (dup) { skipped.push(store.describeShift(n) + ': already there'); return; }
      var v = store.checkShift(n);
      if (v.errors.length && n.employeeId) { n.employeeId = null; asOpen++; v = store.checkShift(n); }
      if (v.errors.length) { skipped.push(store.describeShift(s) + ': ' + v.errors[0].text); return; }
      S.shifts.push(n); made++;
    });
    if (made) log('schedule', locs.join(','), 'copied', 'Copied ' + made + ' shift' + (made === 1 ? '' : 's') + ' from the week of ' + fromMon + ' to the week of ' + toMon + ' as drafts');
    emit('shift');
    return { made: made, skipped: skipped, asOpen: asOpen };
  };
  store.draftsIn = function (from, to) { return S.shifts.filter(function (s) { return s.status === 'draft' && R.inRange(s.date, from, to) && store.inScope(s.locationId); }); };
  store.publish = function (from, to, onlyIds) {
    var drafts = store.draftsIn(from, to).filter(function (s) { return store.can('schedule.publish', s.locationId) && (!onlyIds || onlyIds.indexOf(s.id) >= 0); });
    if (!drafts.length) { if (store.draftsIn(from, to).length) need('schedule.publish', store.draftsIn(from, to)[0].locationId); throw err('There are no draft shifts to publish in this range.'); }
    var emps = {}, locs = {};
    drafts.forEach(function (s) { s.status = 'published'; s.updatedAt = stamp(); s.updatedBy = store.me().id; if (s.employeeId) emps[s.employeeId] = (emps[s.employeeId] || 0) + 1; locs[s.locationId] = 1; });
    Object.keys(emps).forEach(function (e) { notifyEmployees([e], { kind: 'ok', icon: 'cal', title: 'New shifts published', body: emps[e] + ' shift' + (emps[e] > 1 ? 's' : '') + ' between ' + from + ' and ' + to, link: '#/schedule?date=' + from, cat: 'schedule' }); });
    var open = drafts.filter(function (s) { return !s.employeeId; }).length;
    if (open) notify(function (u) { return Object.keys(locs).some(function (l) { return policy.has(u, 'schedule.edit', l); }); }, { kind: 'warn', icon: 'alert', title: open + ' open shift' + (open > 1 ? 's' : '') + ' published', body: 'Between ' + from + ' and ' + to + '. They still need someone.', link: '#/schedule?date=' + from + '&filter=open', cat: 'schedule' });
    Object.keys(locs).forEach(function (l) { log('schedule', l, 'published', 'Published ' + drafts.filter(function (s) { return s.locationId === l; }).length + ' shifts at ' + store.locName(l) + ' for ' + from + ' to ' + to, { locationId: l }); });
    emit('shift');
    return { count: drafts.length, people: Object.keys(emps).length };
  };
  // available people for an open shift, best first
  store.fillOptions = function (sh) {
    var ws = R.weekStart(sh.date, S.org.weekStart), we = R.addDays(ws, 6);
    return S.employees.filter(function (e) { return e.status !== 'terminated' && store.canSeeEmp(e) && (e.locationIds || [e.locationId]).indexOf(sh.locationId) >= 0; }).map(function (e) {
      var t = clone(sh); t.employeeId = e.id; var v = store.checkShift(t);
      var hrs = S.shifts.filter(function (s) { return s.employeeId === e.id && s.status !== 'cancelled' && R.inRange(s.date, ws, we); }).reduce(function (a, s) { return a + R.shiftMinutes(s); }, 0) / 60;
      var skill = (e.skills || [e.jobRoleId]).indexOf(sh.jobRoleId) >= 0;
      return { emp: e, ok: !v.errors.length, errors: v.errors, warnings: v.warnings, hours: Math.round(hrs * 10) / 10, skill: skill };
    }).filter(function (c) { return c.skill || c.emp.jobRoleId === sh.jobRoleId; }).sort(function (a, b) { return (b.ok - a.ok) || (a.warnings.length - b.warnings.length) || (a.hours - b.hours); });
  };
  store.saveRequirement = function (q) {
    need('schedule.edit', q.locationId);
    if (isNaN(R.toMin(q.start)) || isNaN(R.toMin(q.end)) || q.start === q.end) throw err('Enter a valid time window.');
    if (!(+q.count >= 1)) throw err('Required staff must be at least 1.');
    if (!q.days || !q.days.length) throw err('Choose at least one day.');
    var old = q.id && by(S.requirements, q.id);
    var rec = { id: old ? old.id : uid('rq'), locationId: q.locationId, jobRoleId: q.jobRoleId, start: q.start, end: q.end, count: +q.count, days: q.days.map(Number) };
    if (old) S.requirements[S.requirements.indexOf(old)] = rec; else S.requirements.push(rec);
    log('settings', rec.id, old ? 'updated' : 'created', (old ? 'Updated' : 'Added') + ' a staffing requirement: ' + rec.count + ' × ' + store.role(rec.jobRoleId).name + ' ' + rec.start + '–' + rec.end + ' at ' + store.locName(rec.locationId), { locationId: rec.locationId });
    emit('settings');
  };
  store.removeRequirement = function (id) { var q = by(S.requirements, id); if (!q) return; need('schedule.edit', q.locationId); S.requirements.splice(S.requirements.indexOf(q), 1); log('settings', id, 'deleted', 'Removed a staffing requirement for ' + store.role(q.jobRoleId).name + ' at ' + store.locName(q.locationId), { locationId: q.locationId }); emit('settings'); };

  /* =========================================================
     ATTENDANCE
     ========================================================= */
  store.entryFor = function (shiftId) { for (var i = 0; i < S.entries.length; i++) if (S.entries[i].shiftId === shiftId) return S.entries[i]; return null; };
  store.onLeave = function (empId, date) { return S.leave.filter(function (l) { return l.employeeId === empId && l.status === 'approved' && R.inRange(date, l.start, l.end); })[0] || null; };
  store.evalOpts = function (locId) { var a = S.org.attendance; return { now: store.now().abs, graceMin: a.graceMin, earlyGraceMin: a.earlyGraceMin }; };
  // rows for an attendance view: every assigned shift in range (with its record) plus unscheduled records
  store.attendance = function (from, to, o) {
    o = o || {}; var me = store.me(), now = store.now().abs, rows = [], seen = {};
    var idx = {}; S.entries.forEach(function (e) { if (e.shiftId) idx[e.shiftId] = e; });
    function ok(locId, empId) {
      if (o.empId) return empId === o.empId && (me.employeeId === empId || policy.has(me, 'attendance.view', locId));
      return (policy.has(me, 'attendance.view', locId) && store.inScope(locId)) || (o.self && me.employeeId === empId);
    }
    S.shifts.forEach(function (s) {
      if (!s.employeeId || s.status === 'cancelled' || s.status === 'draft' || s.date < from || s.date > to) return;
      if (!ok(s.locationId, s.employeeId)) return;
      var en = idx[s.id] || null; if (en) seen[en.id] = 1;
      rows.push(row(s, en));
    });
    S.entries.forEach(function (en) {
      if (seen[en.id] || en.date < from || en.date > to) return;
      if (en.shiftId && store.shift(en.shiftId) && store.shift(en.shiftId).status !== 'cancelled') return;
      if (!ok(en.locationId, en.employeeId)) return;
      rows.push(row(null, en));
    });
    function row(s, en) {
      var empId = s ? s.employeeId : en.employeeId, date = s ? s.date : en.date;
      var ev = R.evaluate(s, en, { now: now, graceMin: S.org.attendance.graceMin, earlyGraceMin: S.org.attendance.earlyGraceMin, onLeave: !!store.onLeave(empId, date) });
      return { id: en ? en.id : 's:' + s.id, shift: s, entry: en, empId: empId, date: date, locationId: s ? s.locationId : en.locationId, ev: ev };
    }
    return rows;
  };
  function checkPeriodLock(date) { var p = lockedByPayroll(date); if (p) throw err('Payroll for ' + p.start + ' to ' + p.end + ' is ' + p.status + '. Reopen it before changing these records.'); var q = store.periodFor(date); if (q && q.status === 'calculated') q.stale = true; }
  // the shift the employee is clocking against: in progress, or starting within 2 hours, or ended within the last hour
  store.clockContext = function (empId) {
    var n = store.now(), mine = S.shifts.filter(function (s) { return s.employeeId === empId && s.status === 'published' && Math.abs(R.diffDays(s.date, n.date)) <= 1; });
    var open = S.entries.filter(function (e) { return e.employeeId === empId && !e.out && R.diffDays(e.date, n.date) <= 1 && R.diffDays(e.date, n.date) >= 0; })[0] || null;
    var cur = null, next = null;
    mine.forEach(function (s) { var sp = R.span(s); if (n.abs >= sp.s - 120 && n.abs <= sp.e + 60 && !(store.entryFor(s.id) && store.entryFor(s.id).out)) { if (!cur || sp.s < R.span(cur).s) cur = s; } if (sp.s > n.abs && (!next || sp.s < R.span(next).s)) next = s; });
    if (open && open.shiftId) cur = store.shift(open.shiftId);
    var todays = S.entries.filter(function (e) { return e.employeeId === empId && e.date === n.date; });
    var mins = todays.reduce(function (a, e) { return a + R.evaluate(null, e, { now: n.abs }).workedMin; }, 0);
    var upcoming = S.shifts.filter(function (s) { return s.employeeId === empId && s.status === 'published' && R.span(s).s > n.abs; }).sort(function (a, b) { return R.span(a).s - R.span(b).s; });
    return { now: n, shift: cur, next: upcoming[0] || null, open: open, onBreak: open ? (open.breaks || []).some(function (b) { return !b.e; }) : false, todayMin: mins, entries: todays };
  };
  function selfOnly(empId) { var me = store.me(); if (me.employeeId !== empId) throw err('You can only use the time clock for yourself. Switch to that person from the account menu to try their view.'); }
  store.clockIn = function (empId, note) {
    selfOnly(empId);
    var c = store.clockContext(empId);
    if (c.open) throw err('You’re already clocked in.');
    var e = store.emp(empId), sh = c.shift, n = c.now;
    if (sh && store.entryFor(sh.id)) sh = null;
    var en = { id: uid('te'), employeeId: empId, shiftId: sh ? sh.id : null, date: sh ? sh.date : n.date, locationId: sh ? sh.locationId : e.locationId, in: n.stamp, out: null, breaks: [], status: 'pending', source: 'clock' };
    if (note) en.note = note;
    S.entries.push(en);
    var ev = R.evaluate(sh, en, store.evalOpts(en.locationId));
    log('entry', en.id, 'clock_in', store.name(e) + ' clocked in' + (sh ? ' for the ' + sh.start + ' shift' : ' (no scheduled shift)'), { locationId: en.locationId, empId: empId });
    if (ev.late) notify(function (u) { return policy.has(u, 'attendance.view', en.locationId) && ['owner', 'ops', 'locmgr'].indexOf(u.role) >= 0; }, { kind: 'warn', icon: 'clock', title: store.name(e) + ' clocked in ' + ev.late + ' min late', body: 'Shift started at ' + sh.start + ' at ' + store.locName(en.locationId), link: '#/attendance?date=' + en.date + '&exc=late', cat: 'attendance' });
    if (!sh) notify(function (u) { return policy.has(u, 'attendance.approve', en.locationId) && ['owner', 'ops', 'locmgr'].indexOf(u.role) >= 0; }, { kind: 'info', icon: 'clock', title: store.name(e) + ' clocked in without a shift', body: 'At ' + store.locName(en.locationId) + '. Review the record when it’s complete.', link: '#/attendance?date=' + en.date + '&exc=unscheduled', cat: 'attendance' });
    emit('entry'); return { entry: en, late: ev.late };
  };
  store.clockOut = function (empId) {
    selfOnly(empId);
    var c = store.clockContext(empId); if (!c.open) throw err('You’re not clocked in.');
    var en = c.open, n = c.now;
    (en.breaks || []).forEach(function (b) { if (!b.e) b.e = n.stamp; });
    en.out = n.stamp;
    var sh = en.shiftId ? store.shift(en.shiftId) : null, ev = R.evaluate(sh, en, store.evalOpts(en.locationId));
    log('entry', en.id, 'clock_out', store.empName(empId) + ' clocked out (' + R.hours(ev.workedMin) + ' h)', { locationId: en.locationId, empId: empId });
    var p = store.periodFor(en.date); if (p && p.status === 'calculated') p.stale = true;
    emit('entry'); return { entry: en, worked: ev.workedMin, early: ev.early };
  };
  store.startBreak = function (empId) { selfOnly(empId); var c = store.clockContext(empId); if (!c.open) throw err('Clock in first.'); if (c.onBreak) throw err('You’re already on a break.'); c.open.breaks = c.open.breaks || []; c.open.breaks.push({ s: c.now.stamp, e: null }); log('entry', c.open.id, 'break', store.empName(empId) + ' started a break', { locationId: c.open.locationId, empId: empId }); emit('entry'); };
  store.endBreak = function (empId) { selfOnly(empId); var c = store.clockContext(empId); if (!c.onBreak) throw err('You’re not on a break.'); c.open.breaks.forEach(function (b) { if (!b.e) b.e = c.now.stamp; }); log('entry', c.open.id, 'break_end', store.empName(empId) + ' ended a break', { locationId: c.open.locationId, empId: empId }); emit('entry'); };
  function validStamp(s) { return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s || '') && !isNaN(R.abs(s)); }
  // manager correction: in/out/break stamps; a reason is required and kept with the record
  store.correctEntry = function (id, data, reason) {
    var en = store.entry(id); if (!en) throw err('That record no longer exists.');
    need('attendance.correct', en.locationId);
    if (!reason || reason.trim().length < 4) throw err('Give a reason for the correction (it’s kept in the audit trail).');
    checkPeriodLock(en.date);
    if (!validStamp(data.in)) throw err('Enter a valid clock-in time.');
    if (data.out && !validStamp(data.out)) throw err('Enter a valid clock-out time.');
    if (data.out && R.abs(data.out) <= R.abs(data.in)) throw err('Clock-out must be after clock-in.');
    if (data.out && R.abs(data.out) - R.abs(data.in) > 20 * 60) throw err('That record would be longer than 20 hours. Check the dates.');
    if (data.out && R.abs(data.out) > store.now().abs) throw err('Clock-out can’t be in the future.');
    var brk = +data.breakMin || 0;
    if (data.out && brk >= R.abs(data.out) - R.abs(data.in)) throw err('The break is longer than the time worked.');
    var changes = [];
    function ch(field, a, b) { if ((a || '') !== (b || '')) changes.push({ field: field, from: a ? a.slice(11) : '(none)', to: b ? b.slice(11) : '(none)' }); }
    ch('Clock-in', en.in, data.in); ch('Clock-out', en.out, data.out || null);
    var oldBrk = R.breakMinutes(en, en.out ? R.abs(en.out) : store.now().abs);
    if (data.breakMin != null && data.breakMin !== '' && Math.round(oldBrk) !== brk) changes.push({ field: 'Break', from: Math.round(oldBrk) + ' min', to: brk + ' min' });
    if (!changes.length) throw err('Nothing changed.');
    en.in = data.in; en.out = data.out || null;
    if (data.breakMin != null && data.breakMin !== '' && Math.round(oldBrk) !== brk) { var mid = R.abs(en.in) + Math.floor(((en.out ? R.abs(en.out) : R.abs(en.in) + 480) - R.abs(en.in)) / 2); en.breaks = brk ? [{ s: R.fromAbs(mid), e: R.fromAbs(mid + brk) }] : []; }
    en.corrections = en.corrections || [];
    var at = stamp(), me = store.me().id;
    changes.forEach(function (c) { en.corrections.push({ at: at, by: me, field: c.field, from: c.from, to: c.to, reason: reason.trim() }); });
    en.source = 'manual';
    if (en.status === 'approved') { en.status = 'pending'; delete en.approvedBy; delete en.approvedAt; }
    log('entry', en.id, 'corrected', 'Corrected ' + changes.map(function (c) { return c.field.toLowerCase(); }).join(', ') + ' for ' + store.empName(en.employeeId) + ' on ' + en.date, { locationId: en.locationId, empId: en.employeeId, reason: reason.trim() });
    emit('entry'); return en;
  };
  // record attendance for a scheduled shift that has no clock record (e.g. paper sign-in)
  store.addEntry = function (shiftId, data, reason) {
    var sh = store.shift(shiftId); if (!sh) throw err('That shift no longer exists.');
    need('attendance.correct', sh.locationId);
    if (store.entryFor(shiftId)) throw err('This shift already has a clock record.');
    if (!reason || reason.trim().length < 4) throw err('Give a reason (it’s kept in the audit trail).');
    checkPeriodLock(sh.date);
    if (!validStamp(data.in) || !validStamp(data.out)) throw err('Enter clock-in and clock-out times.');
    if (R.abs(data.out) <= R.abs(data.in)) throw err('Clock-out must be after clock-in.');
    if (R.abs(data.out) > store.now().abs) throw err('Clock-out can’t be in the future.');
    var brk = +data.breakMin || 0, mid = R.abs(data.in) + Math.floor((R.abs(data.out) - R.abs(data.in)) / 2);
    var en = { id: uid('te'), employeeId: sh.employeeId, shiftId: sh.id, date: sh.date, locationId: sh.locationId, in: data.in, out: data.out, breaks: brk ? [{ s: R.fromAbs(mid), e: R.fromAbs(mid + brk) }] : [], status: 'pending', source: 'manual', corrections: [{ at: stamp(), by: store.me().id, field: 'Record added', from: '(none)', to: data.in.slice(11) + '–' + data.out.slice(11), reason: reason.trim() }] };
    S.entries.push(en);
    log('entry', en.id, 'corrected', 'Added a clock record for ' + store.empName(sh.employeeId) + ' on ' + sh.date, { locationId: sh.locationId, empId: sh.employeeId, reason: reason.trim() });
    emit('entry'); return en;
  };
  store.approveEntries = function (ids) {
    var me = store.me(), done = 0, skipped = [];
    ids.forEach(function (id) {
      var en = store.entry(id); if (!en || en.status === 'approved') return;
      if (!policy.has(me, 'attendance.approve', en.locationId)) { skipped.push(store.empName(en.employeeId) + ': ' + policy.why(me, 'attendance.approve', en.locationId)); return; }
      if (me.employeeId && me.employeeId === en.employeeId) { skipped.push('Your own timesheet needs another approver'); return; }
      if (!en.out) { skipped.push(store.empName(en.employeeId) + ' ' + en.date + ': no clock-out yet'); return; }
      var lp = lockedByPayroll(en.date); if (lp) { skipped.push(en.date + ': payroll is ' + lp.status); return; }
      en.status = 'approved'; en.approvedBy = me.id; en.approvedAt = stamp(); done++;
      var p = store.periodFor(en.date); if (p && p.status === 'calculated') p.stale = true;
    });
    if (done) log('entry', ids.length === 1 ? ids[0] : 'bulk', 'approved', 'Approved ' + done + ' timesheet' + (done === 1 ? '' : 's'), { locationId: ids.length === 1 && store.entry(ids[0]) ? store.entry(ids[0]).locationId : null, empId: ids.length === 1 && store.entry(ids[0]) ? store.entry(ids[0]).employeeId : null });
    emit('entry');
    return { done: done, skipped: skipped };
  };

  /* =========================================================
     TIME OFF
     ========================================================= */
  store.leaveDays = function (start, end, half) { return R.leaveDays(start, end, S.org.leave.countMode, S.org.holidays, half); };
  store.balance = function (emp, type) { return R.balance(type, emp, S.leave, store.today()); };
  store.leaveSteps = function () { return S.org.approvals.timeoff === 'manager_hr' ? ['manager', 'hr'] : ['manager']; };
  store.canDecide = function (req) {
    var me = store.me(), e = store.emp(req.employeeId);
    if (!e || req.status !== 'pending') return false;
    if (me.employeeId === req.employeeId) return false;
    if (!policy.has(me, 'timeoff.approve', e.locationId)) return false;
    var step = store.leaveSteps()[(req.approvals || []).length];
    if (step === 'hr') return policy.has(me, 'employees.edit', e.locationId) && (req.approvals || []).every(function (a) { return a.by !== me.id; });
    return true;
  };
  store.requestLeave = function (d) {
    var me = store.me(), e = store.emp(d.employeeId);
    if (!e) throw err('Choose an employee.');
    if (me.employeeId !== e.id) { if (!(policy.has(me, 'timeoff.approve', e.locationId) || policy.has(me, 'employees.edit', e.locationId))) throw err('You can only request time off for yourself.'); }
    var type = store.leaveType(d.typeId); if (!type || type.archived) throw err('Choose a leave type.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.start || '') || !/^\d{4}-\d{2}-\d{2}$/.test(d.end || '')) throw err('Choose the start and end dates.');
    if (d.end < d.start) throw err('The end date is before the start date.');
    if (R.diffDays(d.start, d.end) > 60) throw err('Requests are limited to 60 days. Split longer absences into separate requests.');
    var today = store.today();
    if (d.start < today && type.id !== 'lt-sick' && !type.allowPast) throw err('Only sick leave can be requested for past dates.');
    var half = !!d.half && d.start === d.end, days = store.leaveDays(d.start, d.end, half);
    if (!days) throw err('Those dates don’t include any working days under your leave policy.');
    if (type.note && !(d.note || '').trim()) throw err(type.name + ' needs a short note.');
    var clash = S.leave.filter(function (l) { return l.employeeId === e.id && (l.status === 'pending' || l.status === 'approved') && R.overlapsRange(l.start, l.end, d.start, d.end); })[0];
    if (clash) throw err('This overlaps another ' + clash.status + ' request (' + clash.start + ' to ' + clash.end + ').');
    var b = R.balance(type, e, S.leave, today);
    if (b.available != null && days > b.available - b.pending) throw err('Not enough ' + type.name.toLowerCase() + ': ' + Math.max(0, b.available - b.pending) + ' day' + (b.available - b.pending === 1 ? '' : 's') + ' left after pending requests.');
    var req = { id: uid('lv'), employeeId: e.id, typeId: type.id, start: d.start, end: d.end, half: half, days: days, note: (d.note || '').trim(), status: 'pending', createdAt: stamp(), decidedBy: null, decidedAt: null, reason: '', approvals: [] };
    S.leave.push(req);
    log('leave', req.id, 'requested', store.name(e) + ' requested ' + type.name.toLowerCase() + ' (' + days + ' day' + (days === 1 ? '' : 's') + ', ' + d.start + (d.end !== d.start ? ' to ' + d.end : '') + ')', { locationId: e.locationId, empId: e.id });
    notify(function (u) { return policy.has(u, 'timeoff.approve', e.locationId) && u.employeeId !== e.id; }, { kind: 'info', icon: 'plane', title: 'Time-off request from ' + store.name(e), body: type.name + ', ' + days + ' day' + (days === 1 ? '' : 's') + ' from ' + d.start, link: '#/time-off?req=' + req.id, cat: 'timeoff' });
    emit('leave'); return req;
  };
  store.cancelLeave = function (id) {
    var r = store.leaveReq(id); if (!r) throw err('That request no longer exists.');
    var me = store.me(), e = store.emp(r.employeeId);
    if (me.employeeId !== r.employeeId && !policy.has(me, 'timeoff.approve', e.locationId)) throw err('You can only cancel your own requests.');
    if (r.status !== 'pending') throw err('Only pending requests can be cancelled here. Ask your manager to change an approved request.');
    r.status = 'cancelled'; r.decidedAt = stamp(); r.decidedBy = me.id;
    log('leave', r.id, 'cancelled', 'Cancelled ' + store.name(e) + '’s ' + store.leaveType(r.typeId).name.toLowerCase() + ' request', { locationId: e.locationId, empId: e.id });
    emit('leave');
  };
  store.leaveImpact = function (r) {
    var e = store.emp(r.employeeId);
    var shifts = S.shifts.filter(function (s) { return s.employeeId === r.employeeId && s.status !== 'cancelled' && R.inRange(s.date, r.start, r.end); });
    var gaps = [], today = store.today();
    shifts.forEach(function (s) {
      if (s.date < today) return; // a day that has passed can't be re-covered; only future gaps are useful
      var others = S.shifts.filter(function (x) { return x.id !== s.id; });
      R.coverage(s.date, s.locationId, others, S.requirements).forEach(function (c) { if (!c.ok && c.req.jobRoleId === s.jobRoleId) { var t0 = R.span(s); if (c.slots.some(function (sl) { return sl.c < c.required && sl.t >= t0.s && sl.t < t0.e; })) gaps.push({ date: s.date, role: store.role(s.jobRoleId).name, window: c.req.start + '–' + c.req.end, scheduled: c.scheduled, required: c.required }); } });
    });
    return { shifts: shifts, gaps: gaps, overlaps: R.overlappingLeave(r, S.leave, S.employees), balance: store.balance(e, store.leaveType(r.typeId)) };
  };
  store.decideLeave = function (id, decision, o) {
    o = o || {};
    var r = store.leaveReq(id); if (!r) throw err('That request no longer exists.');
    var e = store.emp(r.employeeId), me = store.me();
    need('timeoff.approve', e.locationId);
    if (me.employeeId === r.employeeId) throw err('You can’t decide on your own request.');
    if (r.status !== 'pending') throw err('This request was already ' + r.status + '.');
    var type = store.leaveType(r.typeId);
    if (decision === 'declined') {
      if (!o.reason || o.reason.trim().length < 3) throw err('Give the employee a reason for declining.');
      r.status = 'declined'; r.reason = o.reason.trim(); r.decidedBy = me.id; r.decidedAt = stamp();
      log('leave', r.id, 'declined', 'Declined ' + store.name(e) + '’s ' + type.name.toLowerCase(), { locationId: e.locationId, empId: e.id, reason: r.reason });
      notifyEmployees([e.id], { kind: 'warn', icon: 'plane', title: 'Time off declined', body: r.start + (r.end !== r.start ? ' to ' + r.end : '') + ' · ' + r.reason, link: '#/time-off?req=' + r.id, cat: 'timeoff' });
      emit('leave'); return r;
    }
    if (!store.canDecide(r)) throw err('This step needs someone else (HR) to approve.');
    var b = R.balance(type, e, S.leave, store.today());
    if (b.available != null && r.days > b.available) throw err('Approving would take ' + store.name(e) + ' below zero (' + b.available + ' days available).');
    r.approvals = r.approvals || [];
    var steps = store.leaveSteps();
    r.approvals.push({ by: me.id, at: stamp(), step: steps[r.approvals.length] });
    if (r.approvals.length < steps.length) {
      log('leave', r.id, 'approved_step', 'Approved ' + store.name(e) + '’s ' + type.name.toLowerCase() + ' (manager step); waiting for HR', { locationId: e.locationId, empId: e.id });
      notify(function (u) { return policy.has(u, 'employees.edit', e.locationId) && policy.has(u, 'timeoff.approve', e.locationId) && u.id !== me.id; }, { kind: 'info', icon: 'plane', title: 'Time off ready for HR approval', body: store.name(e) + ' · ' + r.start + (r.end !== r.start ? ' to ' + r.end : ''), link: '#/time-off?req=' + r.id, cat: 'timeoff' });
      emit('leave'); return r;
    }
    r.status = 'approved'; r.decidedBy = me.id; r.decidedAt = stamp();
    var released = 0;
    if (o.release !== false) {
      S.shifts.forEach(function (s) {
        if (s.employeeId !== r.employeeId || s.status === 'cancelled' || !R.inRange(s.date, r.start, r.end)) return;
        if (lockedByPayroll(s.date)) return;
        s.employeeId = null; s.notes = 'Released: ' + e.first + ' on ' + type.name.toLowerCase(); s.updatedAt = stamp(); s.updatedBy = me.id; released++;
      });
      if (released) notify(function (u) { return policy.has(u, 'schedule.edit', e.locationId); }, { kind: 'warn', icon: 'alert', title: released + ' shift' + (released > 1 ? 's' : '') + ' now open', body: e.first + ' ' + e.last + ' is on approved leave ' + r.start + (r.end !== r.start ? ' to ' + r.end : '') + '.', link: '#/schedule?date=' + r.start + '&filter=open', cat: 'schedule' });
    }
    log('leave', r.id, 'approved', 'Approved ' + store.name(e) + '’s ' + type.name.toLowerCase() + ' (' + r.days + ' day' + (r.days === 1 ? '' : 's') + ')' + (released ? '; released ' + released + ' shift' + (released > 1 ? 's' : '') + ' as open' : ''), { locationId: e.locationId, empId: e.id });
    notifyEmployees([e.id], { kind: 'ok', icon: 'plane', title: 'Time off approved', body: type.name + ' · ' + r.start + (r.end !== r.start ? ' to ' + r.end : ''), link: '#/time-off?req=' + r.id, cat: 'timeoff' });
    var p = store.periodFor(r.start); if (p && p.status === 'calculated') p.stale = true;
    emit('leave'); return { req: r, released: released };
  };
  store.pendingForMe = function () { return S.leave.filter(function (r) { var e = store.emp(r.employeeId); return r.status === 'pending' && e && store.inScope(e.locationId) && store.canDecide(r); }); };

  /* =========================================================
     HIRING
     ========================================================= */
  store.jobs = function () { return S.jobs.filter(function (j) { return store.can('hiring.view') && store.inScope(j.locationId); }); };
  store.saveJob = function (d) {
    need('hiring.jobs');
    if (!(d.title || '').trim()) throw err('Give the job a title.');
    if (!store.loc(d.locationId)) throw err('Choose a location.');
    if (!store.dept(d.deptId)) throw err('Choose a department.');
    if (!(+d.openings >= 1)) throw err('Openings must be at least 1.');
    var old = d.id && store.job(d.id);
    var j = old || { id: uid('job'), posted: null };
    var wasOpen = old && old.status === 'open';
    ['title', 'deptId', 'locationId', 'type', 'status', 'pay', 'summary', 'recruiterId', 'managerId'].forEach(function (k) { if (d[k] != null) j[k] = typeof d[k] === 'string' ? d[k].trim() : d[k]; });
    j.openings = +d.openings;
    j.requirements = (Array.isArray(d.requirements) ? d.requirements : String(d.requirements || '').split('\n')).map(function (x) { return x.trim(); }).filter(Boolean);
    if (j.status === 'open' && !j.posted) j.posted = store.today();
    if (!old) S.jobs.unshift(j);
    log('job', j.id, old ? 'updated' : 'created', (old ? 'Updated' : 'Created') + ' the ' + j.title + ' opening at ' + store.locName(j.locationId) + (j.status === 'open' && !wasOpen ? ' and published it to the careers page' : ''), { locationId: j.locationId });
    emit('job'); return j;
  };
  store.stageCounts = function (jobId) { var c = {}; S.candidates.forEach(function (x) { if (!jobId || x.jobId === jobId) c[x.stage] = (c[x.stage] || 0) + 1; }); return c; };
  store.moveCandidate = function (id, stage, o) {
    o = o || {};
    var c = store.cand(id); if (!c) throw err('That candidate no longer exists.');
    need('hiring.edit');
    if (!store.stage(stage)) throw err('Unknown stage.');
    if (c.stage === stage) return c;
    if (c.stage === 'hired' && c.employeeId) throw err(c.first + ' already has an employee record. Change it from their employee profile.');
    if (stage === 'rejected' && (!o.reason || o.reason.trim().length < 3)) throw err('Add a short reason for rejecting (kept on the candidate record).');
    var from = c.stage; c.stage = stage; if (stage === 'rejected') c.reason = o.reason.trim();
    log('candidate', c.id, 'stage', 'Moved ' + c.first + ' ' + c.last + ' to ' + store.stage(stage).name, { from: from, to: stage, reason: o.reason || '' });
    emit('cand'); return c;
  };
  store.updateCandidate = function (id, d) {
    var c = store.cand(id); need('hiring.edit');
    if (!(d.first || '').trim() || !(d.last || '').trim()) throw err('First and last name are required.');
    if (d.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) throw err('That email address doesn’t look right.');
    ['first', 'last', 'email', 'phone', 'source', 'summary', 'recruiterId'].forEach(function (k) { if (d[k] != null) c[k] = String(d[k]).trim(); });
    if (d.skills != null) c.skills = String(d.skills).split(',').map(function (x) { return x.trim(); }).filter(Boolean);
    if (d.rating != null) c.rating = +d.rating;
    log('candidate', c.id, 'updated', 'Updated ' + c.first + ' ' + c.last + '’s profile');
    emit('cand'); return c;
  };
  store.addCandNote = function (id, text) {
    var c = store.cand(id); need('hiring.view');
    if (!(text || '').trim()) throw err('Write a comment first.');
    c.notes.unshift({ id: uid('nt'), at: stamp(), by: store.me().id, text: text.trim() });
    log('candidate', c.id, 'note', 'Commented on ' + c.first + ' ' + c.last);
    emit('cand');
  };
  store.saveInterview = function (id, d) {
    var c = store.cand(id); need('hiring.edit');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date || '') || isNaN(R.toMin(d.time))) throw err('Choose a date and time.');
    if (!(d.with || '').trim()) throw err('Who is interviewing?');
    var iv = d.ivId ? c.interviews.filter(function (x) { return x.id === d.ivId; })[0] : null;
    if (!iv) { iv = { id: uid('iv') }; c.interviews.push(iv); }
    ['date', 'time', 'type', 'with', 'location', 'outcome', 'notes'].forEach(function (k) { if (d[k] != null) iv[k] = String(d[k]).trim(); });
    c.interviews.sort(function (a, b) { return (a.date + a.time) < (b.date + b.time) ? -1 : 1; });
    log('candidate', c.id, 'interview', (d.ivId ? 'Updated' : 'Scheduled') + ' a ' + (iv.type || 'interview').toLowerCase() + ' with ' + c.first + ' ' + c.last + ' on ' + iv.date + ' ' + iv.time + (iv.outcome ? ' (' + iv.outcome + ')' : ''));
    if (!d.ivId && c.recruiterId && c.recruiterId !== store.me().id) notify([c.recruiterId], { kind: 'info', icon: 'cal', title: 'Interview scheduled', body: c.first + ' ' + c.last + ' · ' + iv.date + ' ' + iv.time, link: '#/hiring/c/' + c.id, cat: 'hiring' });
    emit('cand'); return iv;
  };
  store.setResume = function (id, file) {
    var c = store.cand(id); need('hiring.edit');
    return KT.files.put(file).then(function (fid) { c.resume = { name: file.name, size: file.size, type: file.type, fileId: fid }; log('candidate', c.id, 'resume', 'Uploaded a CV for ' + c.first + ' ' + c.last + ' (' + file.name + ')'); emit('cand'); });
  };
  // the hire step: creates the employee record (HR permission) and links it to the candidate
  store.hire = function (id, d) {
    var c = store.cand(id); if (!c) throw err('That candidate no longer exists.');
    need('hiring.edit');
    if (c.employeeId) throw err(c.first + ' already has an employee record.');
    var emp = store.saveEmployee({ first: c.first, last: c.last, jobRoleId: d.jobRoleId, locationId: d.locationId, start: d.start, type: d.type, payType: d.payType, rate: d.rate, salary: d.salary, managerId: d.managerId, workEmail: d.workEmail, personal: { email: c.email, phone: c.phone }, status: 'onboarding' });
    emp.onboarding = (S.org.onboarding || ['Signed employment contract', 'ID and tax PIN copies received', 'Bank details captured by payroll', 'Uniform and locker assigned', 'First-week shifts scheduled']).map(function (t) { return { task: t, done: false }; });
    var from = c.stage; c.stage = 'hired'; c.employeeId = emp.id;
    log('candidate', c.id, 'stage', 'Hired ' + c.first + ' ' + c.last + ' and created their employee record', { from: from, to: 'hired' });
    var job = store.job(c.jobId);
    if (job) { var hired = S.candidates.filter(function (x) { return x.jobId === job.id && x.stage === 'hired'; }).length; if (hired >= job.openings && job.status === 'open') { job.status = 'closed'; log('job', job.id, 'closed', 'Closed the ' + job.title + ' opening: all ' + job.openings + ' filled', { locationId: job.locationId }); } }
    notify(function (u) { return policy.has(u, 'schedule.edit', emp.locationId) || policy.has(u, 'payroll.run'); }, { kind: 'ok', icon: 'user', title: 'New starter: ' + store.name(emp), body: store.role(emp.jobRoleId).name + ' at ' + store.locName(emp.locationId) + ', starting ' + emp.start, link: '#/employees/' + emp.id, cat: 'hiring' });
    emit('cand'); return emp;
  };
  // public careers page submission (no sign-in)
  store.apply = function (jobId, d) {
    var j = store.job(jobId); if (!j || j.status !== 'open') throw err('This opening is no longer accepting applications.');
    if (!(d.first || '').trim() || !(d.last || '').trim()) throw err('Enter your first and last name.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email || '')) throw err('Enter a valid email address.');
    if (!/^[+\d][\d\s-]{7,}$/.test((d.phone || '').trim())) throw err('Enter a phone number we can reach you on.');
    if (!d.consent) throw err('Please confirm we may store your details for this application.');
    var dup = S.candidates.filter(function (c) { return c.jobId === jobId && c.email.toLowerCase() === d.email.trim().toLowerCase(); })[0];
    if (dup) throw err('You’ve already applied for this role with that email address.');
    var c = { id: uid('cand'), first: d.first.trim(), last: d.last.trim(), jobId: jobId, stage: 'applied', appliedAt: stamp(), source: 'Careers page', recruiterId: j.recruiterId, skills: String(d.skills || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean), summary: (d.summary || '').trim(), email: d.email.trim(), phone: d.phone.trim(), resume: null, interviews: [], notes: [], rating: 0, reason: '', employeeId: null };
    S.candidates.unshift(c);
    S.audit.unshift({ id: uid('au'), at: stamp(), by: null, entity: 'candidate', entityId: c.id, action: 'applied', text: c.first + ' ' + c.last + ' applied for ' + j.title + ' on the careers page' });
    var notified = notify(function (u) { return policy.has(u, 'hiring.view') && (u.id === j.recruiterId || u.role === 'hr'); }, { kind: 'info', icon: 'user', title: 'New application: ' + c.first + ' ' + c.last, body: j.title + ' · ' + store.locName(j.locationId), link: '#/hiring/c/' + c.id, cat: 'hiring' });
    var p = d.file ? KT.files.put(d.file).then(function (fid) { c.resume = { name: d.file.name, size: d.file.size, type: d.file.type, fileId: fid }; save(); }) : Promise.resolve();
    emit('cand');
    return p.then(function () { return { cand: c, notified: notified }; });
  };

  /* =========================================================
     EMPLOYEES
     ========================================================= */
  store.saveEmployee = function (d) {
    var old = d.id ? store.emp(d.id) : null, me = store.me();
    var selfEdit = old && me.employeeId === old.id && !policy.has(me, 'employees.edit', old.locationId);
    if (!selfEdit) { need('employees.edit', d.locationId || (old && old.locationId)); if (old) need('employees.edit', old.locationId); }
    if (selfEdit) {
      // employees may update their own personal contact details only
      var p = d.personal || {};
      if (p.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p.email)) throw err('That email address doesn’t look right.');
      old.personal = old.personal || {};
      ['email', 'phone', 'address'].forEach(function (k) { if (p[k] != null) old.personal[k] = String(p[k]).trim(); });
      if (p.emergency) old.personal.emergency = { name: String(p.emergency.name || '').trim(), relation: String(p.emergency.relation || '').trim(), phone: String(p.emergency.phone || '').trim() };
      log('employee', old.id, 'updated', store.name(old) + ' updated their personal details', { empId: old.id, locationId: old.locationId });
      emit('emp'); return old;
    }
    if (!(d.first || (old && old.first) || '').trim() || !(d.last || (old && old.last) || '').trim()) throw err('First and last name are required.');
    var role = store.role(d.jobRoleId || (old && old.jobRoleId)); if (!role) throw err('Choose a job role.');
    if (!store.loc(d.locationId || (old && old.locationId))) throw err('Choose a location.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.start || (old && old.start) || '')) throw err('Choose a start date.');
    if (d.workEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.workEmail)) throw err('That work email doesn’t look right.');
    var canPay = policy.has(me, 'employees.sensitive', d.locationId || old.locationId);
    var e = old || { id: uid('e'), skills: [], docs: [], notes: '', status: 'onboarding', personal: {}, onboarding: null, locationIds: [] };
    var changes = [];
    function set(k, v) { if (v === undefined) return; if (old && String(old[k] == null ? '' : old[k]) !== String(v == null ? '' : v)) changes.push(k); e[k] = v; }
    set('first', d.first && d.first.trim()); set('last', d.last && d.last.trim()); set('jobRoleId', d.jobRoleId); set('deptId', role.id ? role.deptId : undefined);
    set('locationId', d.locationId); set('teamId', d.teamId); set('managerId', d.managerId || null); set('type', d.type); set('start', d.start); set('workEmail', d.workEmail && d.workEmail.trim()); set('workPhone', d.workPhone && d.workPhone.trim());
    if (d.status && old) { if (d.status === 'terminated') throw err('Use “End employment” to record a leaver.'); set('status', d.status); }
    if (!old) { e.status = d.status || 'onboarding'; e.workEmail = e.workEmail || (e.first + '.' + e.last).toLowerCase().replace(/\s+/g, '') + '@' + (S.org.emailDomain || 'kijanihearth.example'); }
    if (d.payType !== undefined || d.rate !== undefined || d.salary !== undefined || d.allowance !== undefined) {
      if (!canPay) { if (!old) { e.payType = role.rate ? 'hourly' : 'salaried'; e.rate = role.rate || 0; e.salary = 0; } }
      else {
        var pt = d.payType || (old && old.payType) || 'hourly';
        if (pt === 'hourly' && !(+d.rate > 0) && !(old && old.rate && d.rate === undefined)) throw err('Enter an hourly rate.');
        if (pt === 'salaried' && !(+d.salary > 0) && !(old && old.salary && d.salary === undefined)) throw err('Enter a salary.');
        set('payType', pt); if (d.rate !== undefined) set('rate', pt === 'hourly' ? +d.rate : 0); if (d.salary !== undefined) set('salary', pt === 'salaried' ? +d.salary : 0); if (d.allowance !== undefined) set('allowance', +d.allowance || 0); e.otEligible = pt === 'hourly';
        if (d.payMethod) set('payMethod', d.payMethod);
      }
    }
    if (d.personal && (canPay || !old)) { e.personal = e.personal || {}; ['email', 'phone', 'address', 'dob'].forEach(function (k) { if (d.personal[k] != null) e.personal[k] = String(d.personal[k]).trim(); }); }
    if (d.skills) e.skills = d.skills; if (e.skills.indexOf(e.jobRoleId) < 0) e.skills.unshift(e.jobRoleId);
    if (d.locationIds) e.locationIds = d.locationIds; if (e.locationIds.indexOf(e.locationId) < 0) e.locationIds.unshift(e.locationId);
    if (!old) {
      if (!e.payType) { e.payType = role.rate ? 'hourly' : 'salaried'; e.rate = role.rate; e.salary = 0; }
      if (!e.teamId) { var t = S.teams.filter(function (t) { return t.locationId === e.locationId && t.deptId === e.deptId; })[0]; e.teamId = t ? t.id : null; }
      S.employees.push(e);
      log('employee', e.id, 'created', 'Created an employee record for ' + store.name(e), { empId: e.id, locationId: e.locationId });
    } else if (changes.length) {
      var labels = { first: 'name', last: 'name', jobRoleId: 'role', deptId: 'department', locationId: 'location', teamId: 'team', managerId: 'manager', type: 'employment type', start: 'start date', workEmail: 'work email', workPhone: 'work phone', status: 'status', payType: 'pay type', rate: 'hourly rate', salary: 'salary', allowance: 'allowance', payMethod: 'payment method' };
      var uniq = []; changes.forEach(function (c) { var l = labels[c] || c; if (uniq.indexOf(l) < 0) uniq.push(l); });
      log('employee', e.id, 'updated', 'Updated ' + store.name(e) + ': ' + uniq.join(', '), { empId: e.id, locationId: e.locationId });
      if (changes.some(function (c) { return ['rate', 'salary', 'allowance', 'payType'].indexOf(c) >= 0; })) S.periods.forEach(function (p) { if (p.status === 'calculated' && p.end >= store.today()) p.stale = true; });
    }
    emit('emp'); return e;
  };
  store.setOnboarding = function (empId, i, done) { var e = store.emp(empId); need('employees.edit', e.locationId); e.onboarding[i].done = !!done; log('employee', e.id, 'onboarding', (done ? 'Completed' : 'Reopened') + ' onboarding task “' + e.onboarding[i].task + '” for ' + store.name(e), { empId: e.id, locationId: e.locationId }); if (e.status === 'onboarding' && e.onboarding.every(function (t) { return t.done; }) && e.start <= store.today()) { e.status = 'active'; log('employee', e.id, 'activated', store.name(e) + ' finished onboarding', { empId: e.id, locationId: e.locationId }); } emit('emp'); };
  store.activate = function (empId) { var e = store.emp(empId); need('employees.edit', e.locationId); if (e.status !== 'onboarding') throw err('Only onboarding employees can be activated.'); e.status = 'active'; log('employee', e.id, 'activated', 'Marked ' + store.name(e) + ' as active', { empId: e.id, locationId: e.locationId }); emit('emp'); };
  store.endEmployment = function (empId, end, reason) {
    var e = store.emp(empId); need('employees.edit', e.locationId);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(end || '')) throw err('Choose the last working day.');
    if (end < e.start) throw err('The last day is before the start date.');
    if (!reason || reason.trim().length < 3) throw err('Add a short reason.');
    if (store.userOf(e.id) && store.userOf(e.id).id === store.me().id) throw err('You can’t end your own employment here.');
    e.end = end; e.notes = (e.notes ? e.notes + '\n' : '') + 'Leaving: ' + reason.trim();
    if (end < store.today()) e.status = 'terminated';
    var released = 0;
    S.shifts.forEach(function (s) { if (s.employeeId === e.id && s.date > end && s.status !== 'cancelled') { s.employeeId = null; s.notes = 'Released: ' + e.first + ' has left'; released++; } });
    var u = store.userOf(e.id); if (u && end < store.today()) u.status = 'suspended';
    log('employee', e.id, 'ended', 'Recorded ' + store.name(e) + '’s last day as ' + end + (released ? '; ' + released + ' future shift' + (released > 1 ? 's' : '') + ' released as open' : ''), { empId: e.id, locationId: e.locationId, reason: reason.trim() });
    emit('emp'); return released;
  };
  store.addDoc = function (empId, file, kind, expires) {
    var e = store.emp(empId); need('employees.edit', e.locationId);
    if (file.size > 8 * 1048576) return Promise.reject(err('Files up to 8 MB.'));
    return KT.files.put(file).then(function (fid) { e.docs.unshift({ id: uid('doc'), name: file.name, kind: kind || 'Document', size: file.size, type: file.type, at: stamp(), by: store.me().id, fileId: fid, expires: expires || null }); log('employee', e.id, 'document', 'Uploaded ' + file.name + ' to ' + store.name(e) + '’s documents', { empId: e.id, locationId: e.locationId }); emit('emp'); });
  };
  store.removeDoc = function (empId, docId) { var e = store.emp(empId); need('employees.edit', e.locationId); var d = e.docs.filter(function (x) { return x.id === docId; })[0]; if (!d) return; e.docs.splice(e.docs.indexOf(d), 1); if (d.fileId) KT.files.del(d.fileId); log('employee', e.id, 'document', 'Removed ' + d.name + ' from ' + store.name(e) + '’s documents', { empId: e.id, locationId: e.locationId }); emit('emp'); };

  /* =========================================================
     PAYROLL
     ========================================================= */
  function ensurePeriods() {
    var P = S.org.payroll, today = store.today(), len = { weekly: 7, fortnightly: 14 }[P.frequency] || 14;
    if (!S.periods.length) return;
    var last = S.periods[S.periods.length - 1], guard = 0;
    while (last.end < today && guard++ < 30) {
      var ps = R.addDays(last.end, 1), pe = R.addDays(ps, len - 1);
      if (P.frequency === 'monthly') { var y = +ps.slice(0, 4), m = +ps.slice(5, 7); pe = R.addDays((m === 12 ? (y + 1) + '-01' : y + '-' + R.pad(m + 1)) + '-01', -1); }
      last = { id: 'pp-' + ps, start: ps, end: pe, payDate: R.addDays(pe, P.payDateOffset), status: 'open', records: null, history: [] };
      S.periods.push(last);
    }
  }
  store.periodFor = function (d) { for (var i = 0; i < S.periods.length; i++) if (R.inRange(d, S.periods[i].start, S.periods[i].end)) return S.periods[i]; return null; };
  store.periodEmployees = function (p) { return S.employees.filter(function (e) { return e.start <= p.end && (!e.end || e.end >= p.start); }); };
  store.calcPreview = function (p) {
    return store.periodEmployees(p).map(function (e) {
      return R.calcRecord(e, p, { entries: S.entries.filter(function (x) { return x.employeeId === e.id; }), leave: S.leave.filter(function (l) { return l.employeeId === e.id; }), leaveTypes: S.leaveTypes, holidays: S.org.holidays, payroll: S.org.payroll, weekStart: S.org.weekStart, leaveMode: S.org.leave.countMode });
    });
  };
  store.timesheetStatus = function (p) {
    var inP = S.entries.filter(function (e) { return R.inRange(e.date, p.start, p.end); });
    return { total: inP.length, pending: inP.filter(function (e) { return e.status !== 'approved'; }).length, noOut: inP.filter(function (e) { return !e.out; }).length, ids: inP.filter(function (e) { return e.status !== 'approved' && e.out; }).map(function (e) { return e.id; }) };
  };
  function phist(p, action, note) { p.history = p.history || []; p.history.push({ at: stamp(), by: store.me().id, action: action, note: note || '' }); log('payroll', p.id, action.toLowerCase().split(' ')[0], action + ' for ' + p.start + ' to ' + p.end + (note ? ' (' + note + ')' : '')); }
  store.calculate = function (id) {
    var p = store.period(id); need('payroll.run');
    if (p.status === 'approved' || p.status === 'paid') throw err('This payroll is ' + p.status + '. Reopen it to recalculate.');
    p.records = store.calcPreview(p); p.status = 'calculated'; p.calculatedAt = stamp(); p.calculatedBy = store.me().id; p.stale = false;
    var s = R.summarise(p.records);
    phist(p, 'Calculated payroll', s.count + ' employees, ' + s.flags + ' item' + (s.flags === 1 ? '' : 's') + ' to review');
    emit('payroll'); return s;
  };
  store.approvePayroll = function (id) {
    var p = store.period(id); need('payroll.approve');
    if (p.status !== 'calculated') throw err('Calculate the payroll before approving it.');
    if (p.stale) throw err('Timesheets or pay details changed since this payroll was calculated. Recalculate first.');
    if (S.org.approvals.payroll === 'separate' && p.calculatedBy === store.me().id) throw err('Your organisation requires a different person to approve payroll than the one who calculated it.');
    var s = R.summarise(p.records); if (s.errors) throw err(s.errors + ' record' + (s.errors > 1 ? 's have' : ' has') + ' blocking errors (marked red). Fix them and recalculate.');
    p.status = 'approved'; p.approvedAt = stamp(); p.approvedBy = store.me().id;
    phist(p, 'Approved payroll', 'Net ' + S.org.currency + ' ' + Math.round(s.net).toLocaleString('en-US'));
    notify(function (u) { return policy.has(u, 'payroll.run'); }, { kind: 'ok', icon: 'wallet', title: 'Payroll approved', body: p.start + ' to ' + p.end + '. Record the payment once your bank has processed it.', link: '#/payroll/' + p.id, cat: 'payroll' });
    emit('payroll');
  };
  store.reopenPayroll = function (id, reason) {
    var p = store.period(id); need('payroll.approve');
    if (p.status !== 'approved' && p.status !== 'calculated') throw err('Only calculated or approved payroll can be reopened.');
    if (!reason || reason.trim().length < 4) throw err('Give a reason for reopening.');
    p.status = 'open'; p.approvedAt = null; p.approvedBy = null; p.stale = false;
    phist(p, 'Reopened payroll', reason.trim());
    emit('payroll');
  };
  store.recordPayment = function (id, d) {
    var p = store.period(id); need('payroll.run');
    if (p.status !== 'approved') throw err('Payroll must be approved before you record payment.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date || '')) throw err('Enter the date the payment was made.');
    if (d.date > store.today()) throw err('The payment date can’t be in the future. Record it once the payment has gone through.');
    if (!(d.reference || '').trim()) throw err('Enter the bank or provider reference.');
    if (!d.confirm) throw err('Confirm that the payment has been made outside KINTRA.');
    p.status = 'paid'; p.paid = { date: d.date, reference: d.reference.trim(), recordedBy: store.me().id, recordedAt: stamp() };
    phist(p, 'Recorded payment', d.reference.trim());
    emit('payroll');
  };

  /* =========================================================
     SETTINGS, USERS
     ========================================================= */
  store.saveOrg = function (patch, what) {
    need('org.settings');
    var o = S.org;
    if (patch.name != null && !String(patch.name).trim()) throw err('The organisation needs a name.');
    function merge(t, s) { Object.keys(s).forEach(function (k) { if (s[k] && typeof s[k] === 'object' && !Array.isArray(s[k]) && t[k] && typeof t[k] === 'object') merge(t[k], s[k]); else t[k] = s[k]; }); }
    merge(o, patch);
    log('settings', 'org', 'updated', 'Updated ' + (what || 'organisation settings'));
    emit('settings');
  };
  var KINDS = { location: 'locations', department: 'departments', role: 'jobRoles', team: 'teams', leaveType: 'leaveTypes' };
  store.saveRef = function (kind, d) {
    need('org.settings');
    var list = S[KINDS[kind]], old = d.id && by(list, d.id);
    if (!(d.name || '').trim()) throw err('Enter a name.');
    if (list.some(function (x) { return x.id !== d.id && x.name.toLowerCase() === d.name.trim().toLowerCase() && (kind !== 'team' || x.locationId === d.locationId); })) throw err('That name is already used.');
    if (kind === 'role' && !store.dept(d.deptId)) throw err('Choose a department.');
    if (kind === 'team' && (!store.loc(d.locationId) || !store.dept(d.deptId))) throw err('Choose a location and department.');
    if (kind === 'leaveType' && d.allowance !== '' && d.allowance != null && !(+d.allowance >= 0)) throw err('Allowance must be zero or more.');
    var rec = old || { id: uid(kind.slice(0, 3)) };
    Object.keys(d).forEach(function (k) { if (k !== 'id') rec[k] = typeof d[k] === 'string' ? d[k].trim() : d[k]; });
    if (kind === 'leaveType') { rec.allowance = d.allowance === '' || d.allowance == null ? null : +d.allowance; rec.paid = !!d.paid; rec.note = !!d.note; }
    if (kind === 'role') rec.rate = +d.rate || 0;
    if (kind === 'location') { rec.rules = rec.rules || {}; }
    if (!old) list.push(rec);
    log('settings', rec.id, old ? 'updated' : 'created', (old ? 'Updated ' : 'Added ') + kind.replace('leaveType', 'leave type') + ' “' + rec.name + '”');
    emit('settings'); return rec;
  };
  store.refUsage = function (kind, id) {
    if (kind === 'location') return S.employees.filter(function (e) { return e.status !== 'terminated' && e.locationId === id; }).length + S.shifts.filter(function (s) { return s.locationId === id && s.status !== 'cancelled'; }).length;
    if (kind === 'department') return S.jobRoles.filter(function (r) { return r.deptId === id; }).length + S.employees.filter(function (e) { return e.deptId === id; }).length;
    if (kind === 'role') return S.employees.filter(function (e) { return e.jobRoleId === id; }).length + S.shifts.filter(function (s) { return s.jobRoleId === id; }).length;
    if (kind === 'team') return S.employees.filter(function (e) { return e.teamId === id && e.status !== 'terminated'; }).length;
    if (kind === 'leaveType') return S.leave.filter(function (l) { return l.typeId === id; }).length;
    return 0;
  };
  store.removeRef = function (kind, id) {
    need('org.settings');
    var list = S[KINDS[kind]], rec = by(list, id); if (!rec) return;
    var n = store.refUsage(kind, id);
    if (n) { if (kind === 'leaveType') { rec.archived = true; log('settings', id, 'archived', 'Archived leave type “' + rec.name + '” (kept for ' + n + ' existing requests)'); emit('settings'); return 'archived'; } throw err('“' + rec.name + '” is still used by ' + n + ' record' + (n > 1 ? 's' : '') + '. Reassign them first.'); }
    list.splice(list.indexOf(rec), 1);
    log('settings', id, 'deleted', 'Removed ' + kind + ' “' + rec.name + '”');
    emit('settings'); return 'deleted';
  };
  store.saveLocationRules = function (locId, rules) {
    need('org.settings'); var l = store.loc(locId); l.rules = {};
    Object.keys(rules).forEach(function (k) { if (rules[k] !== '' && rules[k] != null) { var v = +rules[k]; if (!(v >= 0)) throw err('Rules must be numbers.'); l.rules[k] = v; } });
    log('settings', locId, 'updated', 'Updated scheduling rules for ' + l.name);
    emit('settings');
  };
  store.saveHolidays = function (list) {
    need('org.settings');
    list.forEach(function (h) { if (!/^\d{4}-\d{2}-\d{2}$/.test(h.date) || !h.name.trim()) throw err('Each holiday needs a date and a name.'); });
    S.org.holidays = list.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    log('settings', 'holidays', 'updated', 'Updated the public holiday list (' + list.length + ' dates)'); emit('settings');
  };
  store.saveRule = function (d) {
    need('org.settings');
    if (!(d.name || '').trim()) throw err('Name the rule.');
    if (d.method === 'percent' && !(+d.rate >= 0 && +d.rate <= 100) ) throw err('Rate must be between 0 and 100.');
    if (d.method === 'fixed' && !(+d.amount >= 0)) throw err('Enter an amount.');
    if (d.method === 'bands') { if (!d.bands || !d.bands.length) throw err('Add at least one band.'); var prev = -1; d.bands.forEach(function (b, i) { if (b.upTo !== '' && !(+b.upTo > prev)) throw err('Band limits must increase.'); if (b.upTo === '' && i !== d.bands.length - 1) throw err('Only the last band can be open-ended.'); prev = b.upTo === '' ? Infinity : +b.upTo; }); }
    var rules = S.org.payroll.rules, old = d.id && by(rules, d.id), rec = old || { id: uid('pr') };
    ['name', 'method', 'base', 'appliesTo'].forEach(function (k) { if (d[k] != null) rec[k] = d[k]; });
    rec.rate = +d.rate || 0; rec.employerRate = +d.employerRate || 0; rec.amount = +d.amount || 0; rec.pretax = !!d.pretax; rec.active = d.active !== false;
    rec.min = d.min === '' || d.min == null ? null : +d.min; rec.max = d.max === '' || d.max == null ? null : +d.max; rec.relief = +d.relief || 0;
    if (d.bands) rec.bands = d.bands.map(function (b) { return { upTo: b.upTo === '' ? '' : +b.upTo, rate: +b.rate }; });
    if (!old) rules.push(rec);
    S.periods.forEach(function (p) { if (p.status === 'calculated') p.stale = true; });
    log('settings', rec.id, old ? 'updated' : 'created', (old ? 'Updated' : 'Added') + ' payroll rule “' + rec.name + '”');
    emit('settings');
  };
  store.removeRule = function (id) { need('org.settings'); var rules = S.org.payroll.rules, r = by(rules, id); if (!r) return; rules.splice(rules.indexOf(r), 1); S.periods.forEach(function (p) { if (p.status === 'calculated') p.stale = true; }); log('settings', id, 'deleted', 'Removed payroll rule “' + r.name + '”'); emit('settings'); };

  function owners() { return S.users.filter(function (u) { return u.role === 'owner' && u.status === 'active'; }); }
  store.inviteUser = function (d) {
    need('users.manage');
    if (!(d.name || '').trim()) throw err('Enter a name.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email || '')) throw err('Enter a valid email.');
    if (S.users.some(function (u) { return u.email.toLowerCase() === d.email.trim().toLowerCase(); })) throw err('Someone with that email is already a user.');
    if (!policy.ROLES[d.role]) throw err('Choose a role.');
    if (d.role === 'owner' && store.me().role !== 'owner') throw err('Only an owner can add another owner.');
    var locs = d.locationIds === 'all' ? 'all' : (d.locationIds || []);
    if (locs !== 'all' && !locs.length) throw err('Give access to at least one location.');
    if (d.employeeId && S.users.some(function (u) { return u.employeeId === d.employeeId; })) throw err('That employee already has a user account.');
    var u = { id: uid('u'), name: d.name.trim(), email: d.email.trim(), role: d.role, employeeId: d.employeeId || null, locationIds: locs, status: 'invited', lastActive: null, notify: { timeoff: true, schedule: true, attendance: true, hiring: true, payroll: true } };
    S.users.push(u);
    log('user', u.id, 'invited', 'Invited ' + u.name + ' as ' + policy.roleName(u.role) + ' (no email is sent in this template)');
    emit('users'); return u;
  };
  store.updateUser = function (id, d) {
    need('users.manage');
    var u = store.user(id), me = store.me();
    if (u.id === me.id && d.role && d.role !== u.role) throw err('You can’t change your own role.');
    if ((u.role === 'owner' || d.role === 'owner') && me.role !== 'owner' && d.role !== u.role) throw err('Only an owner can change owner access.');
    if (u.role === 'owner' && d.role && d.role !== 'owner' && owners().length <= 1) throw err('The organisation needs at least one owner.');
    if (d.locationIds && d.locationIds !== 'all' && !d.locationIds.length) throw err('Give access to at least one location.');
    var ch = [];
    if (d.role && d.role !== u.role) { ch.push('role ' + policy.roleName(u.role) + ' → ' + policy.roleName(d.role)); u.role = d.role; }
    if (d.locationIds && JSON.stringify(d.locationIds) !== JSON.stringify(u.locationIds)) { ch.push('locations'); u.locationIds = d.locationIds; }
    if (!ch.length) return u;
    log('user', u.id, 'updated', 'Changed ' + u.name + '’s access: ' + ch.join(', '));
    notify([u.id], { kind: 'info', icon: 'shield', title: 'Your access changed', body: ch.join(', '), link: '#/overview', cat: 'account' });
    emit('users'); return u;
  };
  store.setUserStatus = function (id, status) {
    need('users.manage'); var u = store.user(id), me = store.me();
    if (u.id === me.id) throw err('You can’t suspend yourself.');
    if (u.role === 'owner' && me.role !== 'owner') throw err('Only an owner can suspend an owner.');
    if (u.role === 'owner' && status !== 'active' && owners().length <= 1) throw err('The organisation needs at least one active owner.');
    if (status === 'removed') { S.users.splice(S.users.indexOf(u), 1); log('user', id, 'removed', 'Removed ' + u.name + '’s access'); emit('users'); return; }
    u.status = status; log('user', id, status, (status === 'active' ? 'Reactivated ' : 'Suspended ') + u.name);
    emit('users');
  };
  store.setNotify = function (cat, on) { var me = store.me(); me.notify = me.notify || {}; me.notify[cat] = !!on; emit('prefs'); };

  /* ---------- search ---------- */
  store.search = function (q, limit) {
    q = q.toLowerCase().trim(); if (!q) return [];
    var out = [], lim = limit || 6;
    store.employees({ includeLeft: true }).filter(function (e) { return (store.name(e) + ' ' + store.role(e.jobRoleId).name + ' ' + store.locName(e.locationId)).toLowerCase().indexOf(q) >= 0; }).slice(0, lim).forEach(function (e) { out.push({ type: 'Employee', title: store.name(e), sub: store.role(e.jobRoleId).name + ' · ' + store.locName(e.locationId), link: '#/employees/' + e.id, emp: e }); });
    if (store.can('hiring.view')) {
      S.candidates.filter(function (c) { return (c.first + ' ' + c.last + ' ' + (store.job(c.jobId) || {}).title).toLowerCase().indexOf(q) >= 0; }).slice(0, lim).forEach(function (c) { var j = store.job(c.jobId); out.push({ type: 'Candidate', title: c.first + ' ' + c.last, sub: (j ? j.title + ' · ' : '') + store.stage(c.stage).name, link: '#/hiring/c/' + c.id }); });
      S.jobs.filter(function (j) { return (j.title + ' ' + store.locName(j.locationId)).toLowerCase().indexOf(q) >= 0; }).slice(0, lim).forEach(function (j) { out.push({ type: 'Job', title: j.title + ' · ' + store.locName(j.locationId), sub: j.status.charAt(0).toUpperCase() + j.status.slice(1) + ' · ' + j.openings + ' opening' + (j.openings > 1 ? 's' : ''), link: '#/hiring/jobs/' + j.id }); });
    }
    S.locations.filter(function (l) { return l.name.toLowerCase().indexOf(q) >= 0 && policy.hasLoc(store.me(), l.id); }).forEach(function (l) { out.push({ type: 'Location', title: l.name, sub: l.type + ' · switch to this location', link: '#loc:' + l.id }); });
    return out;
  };

  /* ---------- files (IndexedDB; uploads stay in this browser) ---------- */
  KT.files = (function () {
    var DB = 'kintra-files', dbp = null;
    function db() { if (!dbp) dbp = new Promise(function (res, rej) { try { var r = indexedDB.open(DB, 1); r.onupgradeneeded = function () { r.result.createObjectStore('f'); }; r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); }; } catch (e) { rej(e); } }); return dbp; }
    function tx(mode, fn) { return db().then(function (d) { return new Promise(function (res, rej) { var t = d.transaction('f', mode), st = t.objectStore('f'), r = fn(st); t.oncomplete = function () { res(r && r.result); }; t.onerror = function () { rej(t.error); }; }); }); }
    return {
      put: function (file) { var id = uid('f'); return tx('readwrite', function (st) { return st.put(file, id); }).then(function () { return id; }).catch(function () { throw err('This browser couldn’t store the file.'); }); },
      get: function (id) { return tx('readonly', function (st) { return st.get(id); }); },
      del: function (id) { return tx('readwrite', function (st) { return st.delete(id); }).catch(function () {}); },
      clear: function () { return tx('readwrite', function (st) { return st.clear(); }).catch(function () {}); }
    };
  })();
})();
