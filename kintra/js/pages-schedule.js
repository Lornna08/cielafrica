/* ============================================================
   KINTRA — Scheduling: week grid (drag to reassign), day timeline,
   list, shift editor with live validation, open-shift filling,
   copy week, publish, staffing coverage.
   ============================================================ */
(function () {
  'use strict';
  var ui = KT.ui, store = KT.store, R = KT.rules, app = KT.app, I = ui.icon;
  KT.v = KT.v || {};

  function short(loc) { return { 'Central Kitchen': 'CK' }[loc.name] || loc.name; }
  function canEditAny() { return store.canAny('schedule.edit'); }

  /* ---------- shift editor (drawer) ---------- */
  KT.v.shiftEditor = function (o) {
    o = o || {};
    var S = store.state, old = o.id ? store.shift(o.id) : null;
    var base = old ? JSON.parse(JSON.stringify(old)) : { date: o.date || store.today(), start: o.start || '09:00', end: o.end || '17:00', breakMin: o.breakMin != null ? o.breakMin : 30, locationId: o.locationId || store.scopeLoc() || (store.myLocations().filter(function (l) { return store.can('schedule.edit', l.id); })[0] || {}).id, jobRoleId: o.jobRoleId || '', employeeId: o.employeeId || '', notes: o.notes || '' };
    if (!old && base.employeeId && !o.jobRoleId) { var e0 = store.emp(base.employeeId); if (e0) { base.jobRoleId = e0.jobRoleId; if (!o.locationId) base.locationId = e0.locationId; } }
    var editable = old ? store.can('schedule.edit', old.locationId) : canEditAny();
    if (!editable && !old) { ui.toast(store.why('schedule.edit'), 'err'); return; }
    var title = old ? (editable ? 'Edit shift' : 'Shift details') : o.duplicateOf ? 'Duplicate shift' : 'New shift';
    var locOpts = app.locOptions('schedule.edit');
    if (old && !locOpts.some(function (x) { return x.value === old.locationId; })) locOpts.unshift({ value: old.locationId, label: store.locName(old.locationId) });
    function empOptions(locId, roleId) {
      var list = S.employees.filter(function (e) { return e.status !== 'terminated' && (store.canSeeEmp(e)) && ((e.locationIds || [e.locationId]).indexOf(locId) >= 0 || e.id === base.employeeId); });
      list.sort(function (a, b) { var sa = (a.skills || []).indexOf(roleId) >= 0 ? 0 : 1, sb = (b.skills || []).indexOf(roleId) >= 0 ? 0 : 1; return sa - sb || (a.first < b.first ? -1 : 1); });
      return [{ value: '', label: 'Open shift (unassigned)' }].concat(list.map(function (e) { return { value: e.id, label: store.name(e) + ' · ' + store.role(e.jobRoleId).name + ((e.skills || []).indexOf(roleId) < 0 && roleId ? ' (not listed for this role)' : '') }; }));
    }
    var ro = editable ? '' : ' disabled';
    var body = '<form id="shf" novalidate>' + (old ? '<div class="row wrap" style="margin-bottom:12px;gap:6px">' + ui.badge(old.status) + (!old.employeeId ? ui.badge('open', 'Open shift') : '') + '<span class="muted small">Last changed ' + (old.updatedAt ? ui.rel(old.updatedAt) + ' by ' + ui.esc(store.userName(old.updatedBy)) : 'when the schedule was built') + '</span></div>' : '') +
      '<div class="fgrid">' +
      ui.field('Date', ui.input('date', base.date, { type: 'date', attr: ro + ' required' }), { req: true }) +
      ui.field('Break (minutes)', ui.input('breakMin', base.breakMin, { type: 'number', min: 0, step: 5, attr: ro }), {}) +
      ui.field('Start', ui.input('start', base.start, { type: 'time', attr: ro + ' required' }), { req: true }) +
      ui.field('End', ui.input('end', base.end, { type: 'time', attr: ro + ' required' }), { req: true, hint: 'An end before the start finishes the next day.' }) +
      ui.field('Location', ui.select('locationId', locOpts, base.locationId, { attr: ro }), { req: true }) +
      ui.field('Role', ui.select('jobRoleId', app.roleOptions(false).filter(function (r) { return !/Manager|Recruiter/.test(r.label) || r.value === base.jobRoleId; }), base.jobRoleId, { attr: ro, placeholder: 'Choose a role' }), { req: true }) +
      ui.field('Employee', '<div id="empwrap">' + ui.select('employeeId', empOptions(base.locationId, base.jobRoleId), base.employeeId || '', { attr: ro }) + '</div>', { full: true }) +
      ui.field('Shift notes', '<textarea class="ta" name="notes" rows="2" placeholder="e.g. Covering the private booking"' + ro + '>' + ui.esc(base.notes || '') + '</textarea>', { full: true }) +
      '</div><div id="shf-sum" class="shf-sum"></div><div id="shf-issues" class="issues" style="margin-top:12px"></div><div id="shf-fill"></div>' +
      (old ? '<details class="shf-hist"><summary>Shift history</summary><div class="timeline" style="margin-top:10px">' + (store.history('shift', old.id).map(function (a) { return '<div class="tl"><span class="tl__i">' + I('history', 11) + '</span><div><div class="tl__t">' + ui.esc(a.text) + '</div><div class="tl__s">' + ui.esc(store.userName(a.by)) + ' · ' + ui.dt(a.at) + '</div></div></div>'; }).join('') || '<p class="muted small">No changes recorded since the schedule was built.</p>') + '</div></details>' : '') + '</form>';
    var foot = '';
    if (editable && old) foot += '<button class="btn btn--danger btn--sm" data-del type="button">' + I('trash', 14) + (old.status === 'draft' ? 'Delete' : 'Cancel shift') + '</button><button class="btn btn--sm" data-dup type="button">' + I('copy', 14) + 'Duplicate</button>';
    foot += '<span class="sp"></span><button class="btn" data-x type="button">' + (editable ? 'Cancel' : 'Close') + '</button>' + (editable ? '<button class="btn btn--p" data-save type="button">' + (old ? 'Save changes' : base.employeeId || o.employeeId ? 'Add shift' : 'Add shift') + '</button>' : '');
    var m = ui.modal({ title: title, sub: old ? store.describeShift(old) : 'Saved as a draft until you publish the schedule.', body: body, foot: foot, drawer: true });
    var f = m.el.querySelector('#shf');
    function data() { var d = ui.read(f); d.id = old ? old.id : null; d.employeeId = d.employeeId || null; return d; }
    function check() {
      var d = data(), box = m.el.querySelector('#shf-issues'), sum = m.el.querySelector('#shf-sum');
      if (!d.jobRoleId || !d.locationId) { box.innerHTML = ''; sum.innerHTML = ''; return { errors: [{ text: 'Choose a location and role.' }], warnings: [] }; }
      var v = store.checkShift(d);
      var mins = !isNaN(R.toMin(d.start)) && !isNaN(R.toMin(d.end)) ? R.shiftMinutes(d) : 0, overnight = R.toMin(d.end) <= R.toMin(d.start);
      var e = d.employeeId && store.emp(d.employeeId);
      sum.innerHTML = mins ? '<span>' + I('clock', 14) + '<b class="num">' + ui.hm(mins) + '</b> paid' + (overnight ? ' · ends next day' : '') + '</span>' + (e && store.canSeeSensitive(e) && e.payType === 'hourly' && store.can('reports.cost', d.locationId) ? '<span>' + I('coins', 14) + 'about <b class="num">' + ui.money(mins / 60 * e.rate) + '</b></span>' : '') : '';
      box.innerHTML = v.errors.map(function (x) { return '<div class="note note--bad">' + I('alert', 14) + '<span>' + ui.esc(x.text) + '</span></div>'; }).join('') + v.warnings.map(function (x) { return '<div class="note">' + I('alert', 14) + '<span>' + ui.esc(x.text) + '</span></div>'; }).join('');
      // suggestions for open shifts
      var fill = m.el.querySelector('#shf-fill');
      if (editable && !d.employeeId && !v.errors.filter(function (x) { return x.code !== 'overlap'; }).length) {
        var opts = store.fillOptions(d).slice(0, 6);
        fill.innerHTML = opts.length ? '<div class="fill"><div class="flabel" style="margin:14px 0 6px">Who can take it</div>' + opts.map(function (c) { return '<div class="fill__i">' + ui.avatar(store.name(c.emp), 'sm') + '<span class="lrow__m"><div class="lrow__t">' + ui.esc(store.name(c.emp)) + '</div><div class="lrow__s">' + ui.dec(c.hours) + ' h this week' + (c.errors.length ? ' · ' + ui.esc(c.errors[0].text) : c.warnings.length ? ' · ' + ui.esc(c.warnings[0].text) : ' · available') + '</div></span>' + (c.ok ? '<button type="button" class="btn btn--xs" data-pick="' + c.emp.id + '">Assign</button>' : ui.badge('declined', 'Unavailable', 'grey')) + '</div>'; }).join('') + '</div>' : '';
        fill.querySelectorAll('[data-pick]').forEach(function (b) { b.onclick = function () { f.querySelector('[name=employeeId]').value = b.getAttribute('data-pick'); check(); }; });
      } else fill.innerHTML = '';
      return v;
    }
    f.addEventListener('input', ui.debounce(check, 120));
    f.addEventListener('change', function (e) {
      if (e.target.name === 'locationId' || e.target.name === 'jobRoleId') { var cur = f.querySelector('[name=employeeId]').value; m.el.querySelector('#empwrap').innerHTML = ui.select('employeeId', empOptions(f.querySelector('[name=locationId]').value, f.querySelector('[name=jobRoleId]').value), cur, { attr: ro }); }
      check();
    });
    check();
    var save = m.el.querySelector('[data-save]');
    if (save) save.onclick = function () {
      var d = data(); if (old) d._prevEmp = old.employeeId;
      var res = ui.run(function () { return store.saveShift(d); });
      if (!res) return;
      m.close();
      if (res.changed === false) { ui.toast('No changes to save', 'info'); return; }
      var pub = res.shift.status === 'published';
      ui.toast((old ? 'Shift updated' : 'Shift added as a draft') + (old && pub && res.shift.employeeId ? '. ' + store.empName(res.shift.employeeId).split(' ')[0] + ' was notified.' : '') + (res.warnings.length ? ' · ' + ui.plural(res.warnings.length, 'warning') : ''), res.warnings.length ? 'info' : 'ok');
      if (o.onSaved) o.onSaved(res.shift);
    };
    var del = m.el.querySelector('[data-del]');
    if (del) del.onclick = function () {
      if (old.status === 'draft') { ui.confirm({ title: 'Delete this draft shift?', body: ui.esc(store.describeShift(old)) + '. Drafts were never visible to employees.', ok: 'Delete draft', danger: true }).then(function (ok) { if (ok && ui.run(function () { store.cancelShift(old.id); }, 'Draft deleted')) m.close(); }); return; }
      var mm = ui.modal({ title: 'Cancel this published shift?', body: '<p style="margin-bottom:12px">' + ui.esc(store.describeShift(old)) + '.' + (old.employeeId ? ' ' + ui.esc(store.empName(old.employeeId).split(' ')[0]) + ' will be notified.' : '') + '</p>' + ui.field('Reason (shared with the employee)', '<input class="inp" name="reason" placeholder="e.g. Private event cancelled">'), ok: 'Cancel shift', danger: true, onOk: function (a) { var r = a.el.querySelector('[name=reason]').value; if (ui.run(function () { store.cancelShift(old.id, r); }, 'Shift cancelled')) { m.close(); return true; } return false; } });
      void mm;
    };
    var dup = m.el.querySelector('[data-dup]');
    if (dup) dup.onclick = function () { m.close(); var d = JSON.parse(JSON.stringify(old)); KT.v.shiftEditor({ date: R.addDays(old.date, 1), start: d.start, end: d.end, breakMin: d.breakMin, locationId: d.locationId, jobRoleId: d.jobRoleId, employeeId: d.employeeId, notes: d.notes, duplicateOf: old.id }); };
    return m;
  };

  /* ---------- page ---------- */
  KT.route('/schedule', function (p, q) {
    var S = store.state, today = store.today(), mgr = canEditAny();
    var narrow = window.matchMedia('(max-width: 760px)').matches;
    var view = q.view || store.prefs.schedView || (narrow ? 'list' : 'week');
    if (narrow && view === 'week' && !q.view) view = 'list';
    var anchor = q.date || today;
    if (q.week === 'next') anchor = R.addDays(R.weekStart(today, S.org.weekStart), 7);
    if (q.loc && store.myLocations().some(function (l) { return l.id === q.loc; }) && store.scopeLoc() !== q.loc) { store.setPref('loc', q.loc); }
    var ws = R.weekStart(anchor, S.org.weekStart), we = R.addDays(ws, 6), days = R.range(ws, we);
    var from = view === 'day' ? anchor : ws, to = view === 'day' ? anchor : we;
    var filt = q.filter || '', dept = q.dept || '', role = q.role || '', who = (q.who || '').toLowerCase();
    var me = store.me(), myEmp = store.myEmp();
    var all = store.shiftsBetween(R.addDays(from, -1), to).filter(function (s) { return mgr ? store.can('schedule.edit', s.locationId) || s.status === 'published' : s.status === 'published'; });
    var inRange = all.filter(function (s) { return s.date >= from; });
    // validation per shift (memoised for this render)
    var issues = {};
    if (mgr) inRange.forEach(function (s) { if (!s.employeeId) return; var v = store.checkShift(s); var w = v.errors.concat(v.warnings).filter(function (x) { return x.code !== 'skill' && x.code !== 'location'; }); if (w.length) issues[s.id] = w; });
    function keep(s) {
      if (dept && store.role(s.jobRoleId).deptId !== dept) return false;
      if (role && s.jobRoleId !== role) return false;
      if (who) { var e = s.employeeId && store.emp(s.employeeId); if (!e || store.name(e).toLowerCase().indexOf(who) < 0) return false; }
      if (filt === 'open' && s.employeeId) return false;
      if (filt === 'draft' && s.status !== 'draft') return false;
      if (filt === 'issues' && !issues[s.id]) return false;
      if (filt === 'mine' && (!myEmp || s.employeeId !== myEmp.id)) return false;
      return true;
    }
    var shown = inRange.filter(keep);
    var drafts = store.draftsIn(from, to).filter(function (s) { return store.can('schedule.publish', s.locationId); });
    var openN = inRange.filter(function (s) { return !s.employeeId; }).length;
    var hrs = shown.filter(function (s) { return s.employeeId; }).reduce(function (a, s) { return a + R.shiftMinutes(s); }, 0);
    var costOk = store.canAny('reports.cost'), cost = 0;
    if (costOk) shown.forEach(function (s) { var e = s.employeeId && store.emp(s.employeeId); if (e && e.payType === 'hourly' && store.can('reports.cost', s.locationId)) cost += R.shiftMinutes(s) / 60 * e.rate; });
    var label = view === 'day' ? ui.date(anchor, { dow: true, year: true }) : ui.range(ws, we);
    var step = view === 'day' ? 1 : 7;
    var locs = store.myLocations().filter(function (l) { return store.inScope(l.id); });
    var holidays = {}; S.org.holidays.forEach(function (h) { holidays[h.date] = h.name; });

    var toolbar = '<div class="sch-bar"><div class="row" style="gap:6px"><a class="btn btn--sm btn--icon" href="#" data-nav="-1" aria-label="Previous ' + (view === 'day' ? 'day' : 'week') + '">' + I('chevL', 16) + '</a><a class="btn btn--sm" href="#" data-nav="0">Today</a><a class="btn btn--sm btn--icon" href="#" data-nav="1" aria-label="Next ' + (view === 'day' ? 'day' : 'week') + '">' + I('chevR', 16) + '</a><label class="sch-date"><span class="sr">Go to date</span><input type="date" class="inp inp--sm" value="' + anchor + '" data-goto></label><b class="sch-label">' + label + '</b></div>' +
      '<div class="seg" role="tablist" aria-label="View">' + [['day', 'Day', 'columns'], ['week', 'Week', 'week'], ['list', 'List', 'list']].map(function (v) { return '<button type="button" role="tab" aria-selected="' + (view === v[0]) + '" class="' + (view === v[0] ? 'on' : '') + '" data-view="' + v[0] + '">' + I(v[2], 14) + v[1] + '</button>'; }).join('') + '</div></div>';
    var filters = '<div class="sch-filters">' +
      '<div class="search-inp">' + I('search', 14) + '<input class="inp inp--sm" type="search" placeholder="Filter by employee" value="' + ui.esc(q.who || '') + '" data-who aria-label="Filter by employee"></div>' +
      ui.select('dept', app.deptOptions(true), dept, { cls: 'sel--sm', attr: ' aria-label="Department"' }) +
      ui.select('role', app.roleOptions(true, dept), role, { cls: 'sel--sm', attr: ' aria-label="Role"' }) +
      ui.select('filter', [{ value: '', label: 'All shifts' }].concat(mgr ? [{ value: 'open', label: 'Open shifts (' + openN + ')' }, { value: 'draft', label: 'Drafts (' + store.draftsIn(from, to).length + ')' }, { value: 'issues', label: 'With warnings (' + Object.keys(issues).length + ')' }] : []).concat(myEmp ? [{ value: 'mine', label: 'Only my shifts' }] : []), filt, { cls: 'sel--sm', attr: ' aria-label="Show"' }) +
      '<span class="sp"></span>' +
      (mgr ? '<button class="btn btn--sm" data-copy type="button">' + I('copy', 14) + '<span>Copy week</span></button>' + (store.canAny('schedule.publish') ? '<button class="btn btn--sm' + (drafts.length ? ' btn--dark' : '') + '" data-publish type="button"' + (drafts.length ? '' : ' disabled title="No drafts in this ' + (view === 'day' ? 'day' : 'week') + '"') + '>' + I('send', 14) + 'Publish' + (drafts.length ? ' <span class="pubn">' + drafts.length + '</span>' : '') + '</button>' : '') + '<button class="btn btn--p btn--sm" data-new type="button">' + I('plus', 15) + 'Add shift</button>' : '') + '</div>';
    var summary = '<div class="sch-sum"><span><b class="num">' + shown.filter(function (s) { return s.employeeId; }).length + '</b> shifts</span><span><b class="num">' + ui.hrs(hrs) + '</b> scheduled</span>' + (mgr ? '<span class="' + (openN ? 'warn' : '') + '"><b class="num">' + openN + '</b> open</span><span><b class="num">' + store.draftsIn(from, to).length + '</b> draft</span><span class="' + (Object.keys(issues).length ? 'warn' : '') + '"><b class="num">' + Object.keys(issues).length + '</b> with warnings</span>' : '') + (costOk && mgr ? '<span><b class="num">' + ui.money(cost) + '</b> est. hourly cost</span>' : '') + '<span class="legend sch-leg"><span><i class="lg lg--pub"></i>Published</span><span><i class="lg lg--draft"></i>Draft</span><span><i class="lg lg--open"></i>Open</span></span></div>';

    var content = '';
    if (view === 'week') content = weekGrid();
    else if (view === 'day') content = dayView();
    else content = listView();

    function rowEmployees() {
      // people with a shift in range, plus (for managers) everyone assigned to the scoped locations
      var ids = {}; shown.forEach(function (s) { if (s.employeeId) ids[s.employeeId] = 1; });
      var list = store.employees({ perm: mgr ? 'employees.view' : null }).filter(function (e) { if (dept && e.deptId !== dept) return false; if (role && e.jobRoleId !== role && !ids[e.id]) return false; if (who && store.name(e).toLowerCase().indexOf(who) < 0) return false; if (filt && filt !== 'mine' && !ids[e.id]) return false; if (filt === 'mine' && (!myEmp || e.id !== myEmp.id)) return false; return ids[e.id] || (mgr && store.inScope(e.locationId) && (!e.end || e.end >= ws) && e.start <= we); });
      Object.keys(ids).forEach(function (id) { if (!list.some(function (e) { return e.id === id; })) { var e = store.emp(id); if (e) list.push(e); } });
      return list;
    }
    function weekGrid() {
      var emps = rowEmployees(), groups = [];
      locs.forEach(function (l) {
        var es = emps.filter(function (e) { return e.locationId === l.id || (!locs.some(function (x) { return x.id === e.locationId; }) && shown.some(function (s) { return s.employeeId === e.id && s.locationId === l.id; })); });
        es.sort(function (a, b) { var da = S.departments.map(function (d) { return d.id; }); return da.indexOf(a.deptId) - da.indexOf(b.deptId) || (a.first < b.first ? -1 : 1); });
        if (myEmp) es.sort(function (a, b) { return (b.id === myEmp.id) - (a.id === myEmp.id); });
        var opens = shown.filter(function (s) { return !s.employeeId && s.locationId === l.id; });
        if (es.length || opens.length) groups.push({ loc: l, emps: es, opens: opens });
      });
      var cols = 'grid-template-columns:minmax(190px,220px) repeat(7,minmax(118px,1fr)) 64px';
      var h = '<div class="card sch-card"><div class="wk" style="' + cols + '" role="grid" aria-label="Weekly schedule">';
      h += '<div class="wk-h wk-corner">' + (groups.length ? '' : '') + '</div>' + days.map(function (d) {
        var dm = shown.filter(function (s) { return s.date === d && s.employeeId; }).reduce(function (a, s) { return a + R.shiftMinutes(s); }, 0);
        return '<div class="wk-h' + (d === today ? ' is-today' : '') + '" role="columnheader"><a href="#/schedule?view=day&date=' + d + '"><b>' + ui.DAY[R.dow(d)] + ' ' + (+d.slice(8)) + '</b></a><span>' + ui.hrs(dm) + (holidays[d] ? ' · <em title="Public holiday">' + ui.esc(holidays[d]) + '</em>' : '') + '</span></div>';
      }).join('') + '<div class="wk-h wk-tot">Total</div>';
      if (!groups.length) h += '<div class="wk-empty">' + ui.empty('cal', 'No shifts match', 'Change the filters, or add a shift.') + '</div>';
      groups.forEach(function (g) {
        if (locs.length > 1) h += '<div class="wk-grp">' + I('pin', 13) + ui.esc(g.loc.name) + '<span>' + ui.esc(g.loc.type) + '</span></div>';
        if (mgr && (g.opens.length || !filt)) {
          h += '<div class="wk-who wk-who--open"><span class="av av--sm" style="--avc:#B8862E">' + I('alert', 12) + '</span><span><div class="pcell__t">Open shifts</div><div class="pcell__s">Drag onto a person to assign</div></span></div>';
          days.forEach(function (d) { h += cell(null, d, g.loc.id, g.opens.filter(function (s) { return s.date === d; })); });
          h += '<div class="wk-tot num">' + (g.opens.length || '') + '</div>';
        }
        g.emps.forEach(function (e) {
          var mine = shown.filter(function (s) { return s.employeeId === e.id && (locs.length === 1 || s.locationId === g.loc.id || e.locationId === g.loc.id); });
          var wkMin = S.shifts.filter(function (s) { return s.employeeId === e.id && s.status !== 'cancelled' && R.inRange(s.date, ws, we); }).reduce(function (a, s) { return a + R.shiftMinutes(s); }, 0);
          var limit = store.rulesAt(e.locationId).weeklyHoursLimit, over = limit && wkMin / 60 > limit;
          h += '<div class="wk-who' + (myEmp && e.id === myEmp.id ? ' is-me' : '') + '"><a href="#/employees/' + e.id + '" class="pcell">' + ui.avatar(store.name(e), 'sm') + '<span style="min-width:0"><div class="pcell__t">' + ui.esc(store.name(e)) + (e.status === 'onboarding' ? ' ' + ui.badge('onboarding', 'New') : '') + '</div><div class="pcell__s"><i class="kdot" style="--kc:' + app.deptColor(e.deptId) + '"></i>' + ui.esc(store.role(e.jobRoleId).name) + '</div></span></a></div>';
          days.forEach(function (d) { h += cell(e, d, g.loc.id, mine.filter(function (s) { return s.date === d; })); });
          h += '<div class="wk-tot num' + (over ? ' is-over' : '') + '" title="' + (over ? 'Over the ' + limit + ' h overtime threshold' : 'Scheduled this week') + '">' + ui.hrs(wkMin) + '</div>';
        });
      });
      // coverage row
      if (mgr && S.requirements.some(function (r) { return locs.some(function (l) { return l.id === r.locationId; }); })) {
        h += '<div class="wk-who wk-cov-h"><span><div class="pcell__t">Coverage</div><div class="pcell__s">Required vs scheduled</div></span></div>';
        days.forEach(function (d) {
          var gaps = [], total = 0;
          locs.forEach(function (l) { R.coverage(d, l.id, S.shifts.filter(function (s) { return s.date >= R.addDays(d, -1) && s.date <= d; }), S.requirements).forEach(function (c) { if (dept && store.role(c.req.jobRoleId).deptId !== dept) return; total++; if (!c.ok) gaps.push((locs.length > 1 ? short(l) + ' · ' : '') + store.role(c.req.jobRoleId).name + ' ' + c.req.start + '–' + c.req.end + ' (' + c.scheduled + '/' + c.required + ')'); }); });
          h += '<div class="wk-cov' + (gaps.length ? ' is-gap' : '') + '"><a href="#/schedule?view=day&date=' + d + '" title="' + ui.esc(gaps.join('\n') || 'All requirements met') + '">' + (total ? (gaps.length ? I('alert', 12) + ui.plural(gaps.length, 'gap') : I('check', 12) + 'Covered') : '<span class="muted">—</span>') + '</a>' + (gaps.length ? '<div class="wk-gaps">' + gaps.slice(0, 2).map(function (g) { return '<span>' + ui.esc(g) + '</span>'; }).join('') + (gaps.length > 2 ? '<span>+' + (gaps.length - 2) + ' more</span>' : '') + '</div>' : '') + '</div>';
        });
        h += '<div class="wk-tot"></div>';
      }
      return h + '</div></div>';
    }
    function cell(e, d, locId, list) {
      var lv = e ? S.leave.filter(function (l) { return l.employeeId === e.id && (l.status === 'approved' || (l.status === 'pending' && mgr)) && R.inRange(d, l.start, l.end); })[0] : null;
      var drop = mgr && store.can('schedule.edit', locId) ? ' data-drop data-emp="' + (e ? e.id : '') + '" data-date="' + d + '" data-loc="' + locId + '"' : '';
      var h = '<div class="wk-c' + (d === today ? ' is-today' : '') + (lv ? ' has-leave' : '') + '"' + drop + ' role="gridcell">';
      if (lv) h += '<span class="leave-chip' + (lv.status === 'pending' ? ' is-pending' : '') + '">' + I('plane', 11) + ui.esc(store.leaveType(lv.typeId).name) + (lv.status === 'pending' ? ' (pending)' : '') + '</span>';
      list.sort(function (a, b) { return R.toMin(a.start) - R.toMin(b.start); }).forEach(function (s) { h += chip(s, e, locId); });
      if (drop) h += '<button type="button" class="wk-add" data-add aria-label="Add a shift' + (e ? ' for ' + ui.esc(store.name(e)) : '') + ' on ' + ui.date(d) + '">' + I('plus', 13) + '</button>';
      return h + '</div>';
    }
    function chip(s, e, groupLoc) {
      var r = store.role(s.jobRoleId), iss = issues[s.id], other = locs.length === 1 && e && s.locationId !== e.locationId || (groupLoc && s.locationId !== groupLoc);
      var cls = 'shc' + (s.status === 'draft' ? ' is-draft' : '') + (!s.employeeId ? ' is-open' : '') + (iss ? ' has-issue' : '') + (myEmp && s.employeeId === myEmp.id ? ' is-mine' : '');
      var en = s.employeeId && s.date <= today ? store.entryFor(s.id) : null, ev = s.employeeId && s.date <= today ? R.evaluate(s, en, store.evalOpts()) : null;
      var st = ev && (ev.state === 'absent' || ev.state === 'not_in') ? '<i class="shc__st shc__st--bad" title="' + ui.label(ev.state) + '"></i>' : ev && (ev.state === 'working' || ev.state === 'on_break') ? '<i class="shc__st shc__st--on" title="' + ui.label(ev.state) + '"></i>' : '';
      return '<button type="button" class="' + cls + '" data-shift="' + s.id + '"' + (mgr && store.can('schedule.edit', s.locationId) ? ' draggable="true"' : '') + ' style="--kc:' + app.deptColor(r.deptId) + '" aria-label="' + ui.esc(store.describeShift(s) + ', ' + store.locName(s.locationId) + ', ' + ui.label(s.status) + (iss ? ', ' + iss.length + ' warning' : '')) + '"><span class="shc__t">' + s.start + '–' + s.end + st + '</span><span class="shc__r">' + ui.esc(r.name) + (other ? ' · ' + ui.esc(short(store.loc(s.locationId))) : '') + '</span>' + (s.breakMin ? '<span class="shc__b">' + s.breakMin + 'm break</span>' : '') + (iss ? '<span class="shc__w" title="' + ui.esc(iss.map(function (x) { return x.text; }).join('\n')) + '">' + I('alert', 11) + '</span>' : '') + (s.notes && !s.employeeId ? '<span class="shc__n">' + ui.esc(s.notes) + '</span>' : '') + '</button>';
    }
    function dayView() {
      var rows = [], byE = {};
      shown.filter(function (s) { return s.date === anchor || (s.date === R.addDays(anchor, -1) && R.span(s).e > R.epochDay(anchor) * 1440 + 5 * 60); }).forEach(function (s) { var k = s.employeeId || 'o:' + s.id; (byE[k] = byE[k] || []).push(s); });
      var att = {}; store.attendance(anchor, anchor).forEach(function (r) { att[r.empId] = r.ev.state; });
      Object.keys(byE).forEach(function (k) { var sh = byE[k], e = sh[0].employeeId ? store.emp(sh[0].employeeId) : null; rows.push({ emp: e, shifts: sh, state: e && att[e.id] && anchor <= today ? att[e.id] : null, sub: store.role(sh[0].jobRoleId).name + ' · ' + store.locName(sh[0].locationId), s0: R.span(sh[0]).s, loc: sh[0].locationId, dept: store.role(sh[0].jobRoleId).deptId }); });
      var dorder = S.departments.map(function (d) { return d.id; });
      rows.sort(function (a, b) { return (a.loc < b.loc ? -1 : a.loc > b.loc ? 1 : 0) || dorder.indexOf(a.dept) - dorder.indexOf(b.dept) || a.s0 - b.s0; });
      var tl = rows.length ? KT.v.timeline(anchor, rows, { from: 5 * 60, to: 26 * 60 }) : ui.empty('cal', 'Nobody is scheduled', 'No shifts match these filters on this day.');
      // hourly coverage per requirement
      var covH = '';
      if (mgr) {
        var lines = [];
        locs.forEach(function (l) { R.coverage(anchor, l.id, S.shifts.filter(function (s) { return s.date >= R.addDays(anchor, -1) && s.date <= anchor; }), S.requirements).forEach(function (c) { if (dept && store.role(c.req.jobRoleId).deptId !== dept) return; lines.push({ l: l, c: c }); }); });
        if (lines.length) {
          var d0 = R.epochDay(anchor) * 1440, from = 5 * 60, span = 21 * 60;
          covH = '<div class="card" style="margin-top:14px"><div class="card__h"><h2>' + I('gauge', 16) + 'Staffing by hour</h2><span class="sub">Each block is one hour: scheduled / required</span></div><div class="tl-scroll"><div class="tl-wrap">' + lines.map(function (x) {
            return '<div class="tl-row"><div class="tl-who"><span><div class="pcell__t">' + ui.esc(store.role(x.c.req.jobRoleId).name) + ' × ' + x.c.required + '</div><div class="pcell__s">' + ui.esc(x.l.name) + ' · ' + x.c.req.start + '–' + x.c.req.end + '</div></span><span class="tl-st">' + (x.c.ok ? ui.badge('approved', 'Covered') : ui.badge('declined', x.c.gapHours + ' h short')) + '</span></div><div class="tl-track">' + x.c.slots.map(function (sl) { var a = (sl.t - d0 - from) / span * 100; return '<span class="covb' + (sl.c < x.c.required ? ' is-gap' : sl.c > x.c.required ? ' is-over' : '') + '" style="left:' + a + '%;width:' + (60 / span * 100) + '%" title="' + R.fromMin(sl.t % 1440) + ': ' + sl.c + ' of ' + x.c.required + '">' + sl.c + '</span>'; }).join('') + '</div></div>';
          }).join('') + '</div></div></div>';
        }
      }
      return '<div class="card sch-card"><div class="tl-scroll">' + tl + '</div></div>' + covH;
    }
    function listView() {
      var rows = shown.slice().sort(function (a, b) { return R.span(a).s - R.span(b).s; });
      if (narrow) {
        var byD = {}; rows.forEach(function (s) { (byD[s.date] = byD[s.date] || []).push(s); });
        return '<div class="agenda">' + days.map(function (d) {
          var l = byD[d] || [];
          return '<div class="card agenda__d' + (d === today ? ' is-today' : '') + '"><div class="card__h"><h2>' + ui.relDay(d) + (ui.relDay(d).indexOf(' ') < 0 ? ' <span class="muted" style="font-weight:500">' + ui.date(d) + '</span>' : '') + '</h2><span class="sub">' + (l.length ? ui.plural(l.length, 'shift') : 'No shifts') + (holidays[d] ? ' · ' + ui.esc(holidays[d]) : '') + '</span></div>' + l.map(function (s) { var e = s.employeeId && store.emp(s.employeeId), r = store.role(s.jobRoleId); return '<button type="button" class="lrow agenda__i" data-shift="' + s.id + '" style="--kc:' + app.deptColor(r.deptId) + '"><span class="agenda__t num">' + s.start + '<br><span class="muted">' + s.end + '</span></span><span class="lrow__m"><div class="lrow__t">' + (e ? ui.esc(store.name(e)) : 'Open shift') + '</div><div class="lrow__s">' + ui.esc(r.name) + ' · ' + ui.esc(store.locName(s.locationId)) + (issues[s.id] ? ' · ' + issues[s.id].length + ' warning' : '') + '</div></span><span class="lrow__r">' + (s.status === 'draft' ? ui.badge('draft') : !s.employeeId ? ui.badge('open', 'Unfilled') : '') + '</span></button>'; }).join('') + '</div>';
        }).join('') + '</div>';
      }
      return '<div class="card" id="sch-list"></div>';
    }

    return {
      title: mgr ? 'Scheduling' : 'My schedule', wide: view !== 'list',
      html: app.ph(mgr ? 'Scheduling' : 'Schedule', mgr ? 'Plan shifts, fill gaps and publish to your team.' : 'Published shifts for you and your team.') + toolbar + filters + summary + content,
      mount: function (v) {
        function upd(k, val) { q[k] = val; if (k !== 'date') delete q.week; app.updateQuery(q); app.refresh(); }
        v.querySelectorAll('[data-nav]').forEach(function (b) { b.onclick = function (e) { e.preventDefault(); var n = +b.getAttribute('data-nav'); upd('date', n === 0 ? today : R.addDays(anchor, n * step)); }; });
        v.querySelector('[data-goto]').onchange = function (e) { if (e.target.value) upd('date', e.target.value); };
        v.querySelectorAll('[data-view]').forEach(function (b) { b.onclick = function () { store.setPref('schedView', b.getAttribute('data-view')); upd('view', b.getAttribute('data-view')); }; });
        ['dept', 'role', 'filter'].forEach(function (k) { var el = v.querySelector('[name=' + k + ']'); if (el) el.onchange = function () { if (k === 'dept') q.role = ''; upd(k, el.value); }; });
        var whoInp = v.querySelector('[data-who]'); whoInp.addEventListener('input', ui.debounce(function () { q.who = whoInp.value; app.updateQuery(q); app.refresh(); setTimeout(function () { var w = document.querySelector('[data-who]'); if (w) { w.focus(); w.setSelectionRange(w.value.length, w.value.length); } }, 0); }, 250));
        var nb = v.querySelector('[data-new]'); if (nb) nb.onclick = function () { KT.v.shiftEditor({ date: view === 'day' ? anchor : (today >= ws && today <= we ? today : ws) }); };
        if (q.new && mgr) { delete q.new; app.updateQuery(q); setTimeout(function () { KT.v.shiftEditor({ date: today }); }, 50); }
        v.querySelectorAll('[data-shift]').forEach(function (b) { b.addEventListener('click', function () { KT.v.shiftEditor({ id: b.getAttribute('data-shift') }); }); });
        v.querySelectorAll('[data-add]').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); var c = b.closest('[data-drop]'); KT.v.shiftEditor({ date: c.getAttribute('data-date'), employeeId: c.getAttribute('data-emp') || null, locationId: c.getAttribute('data-loc') }); }; });
        var pub = v.querySelector('[data-publish]'); if (pub) pub.onclick = function () { publishDialog(from, to); };
        var cp = v.querySelector('[data-copy]'); if (cp) cp.onclick = function () { copyDialog(ws); };
        // drag and drop: the data layer moves the shift, then the view re-renders from it
        var dragId = null;
        v.addEventListener('dragstart', function (e) { var c = e.target.closest && e.target.closest('[data-shift][draggable]'); if (!c) return; dragId = c.getAttribute('data-shift'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', dragId); } catch (x) { /* IE */ } c.classList.add('is-drag'); v.classList.add('is-dragging'); });
        v.addEventListener('dragend', function () { v.classList.remove('is-dragging'); v.querySelectorAll('.is-drag,.is-over').forEach(function (x) { x.classList.remove('is-drag', 'is-over'); }); });
        v.addEventListener('dragover', function (e) { var c = e.target.closest && e.target.closest('[data-drop]'); if (!c || !dragId) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; v.querySelectorAll('.is-over').forEach(function (x) { if (x !== c) x.classList.remove('is-over'); }); c.classList.add('is-over'); });
        v.addEventListener('drop', function (e) {
          var c = e.target.closest && e.target.closest('[data-drop]'); if (!c || !dragId) return; e.preventDefault();
          var id = dragId; dragId = null;
          var sh = store.shift(id); if (!sh) return;
          var prev = { employeeId: sh.employeeId, date: sh.date, locationId: sh.locationId };
          var to = { employeeId: c.getAttribute('data-emp') || null, date: c.getAttribute('data-date'), locationId: c.getAttribute('data-loc') };
          var res = ui.run(function () { return store.moveShift(id, to); });
          if (!res || res.changed === false) return;
          var who2 = to.employeeId ? store.empName(to.employeeId).split(' ')[0] : 'open shifts';
          var msg = 'Moved to ' + who2 + ', ' + ui.date(to.date, { dow: true }) + (res.warnings.length ? ' · ' + res.warnings[0].text : '');
          ui.toast(msg, res.warnings.length ? 'info' : 'ok', { label: 'Undo', fn: function () { ui.run(function () { store.moveShift(id, prev); }, 'Move undone'); } });
        });
        if (view === 'list' && !narrow) {
          var host = v.querySelector('#sch-list');
          var rows = shown.slice().sort(function (a, b) { return R.span(a).s - R.span(b).s; });
          var t = ui.table(host, {
            rows: rows, pageSize: 40, selectable: mgr, showCount: true,
            columns: [
              { key: 'date', label: 'Date', render: function (s) { return '<b>' + ui.date(s.date, { dow: true }) + '</b>'; }, sort: function (s) { return R.span(s).s; } },
              { key: 'time', label: 'Time', render: function (s) { return s.start + '–' + s.end; }, sort: function (s) { return R.toMin(s.start); } },
              { key: 'emp', label: 'Employee', render: function (s) { return s.employeeId ? app.empCell(store.emp(s.employeeId), false) : ui.badge('open', 'Open shift'); }, sort: function (s) { return s.employeeId ? store.empName(s.employeeId) : ''; } },
              { key: 'role', label: 'Role', render: function (s) { return '<span class="row" style="gap:6px"><i class="kdot" style="--kc:' + app.deptColor(store.role(s.jobRoleId).deptId) + '"></i>' + ui.esc(store.role(s.jobRoleId).name) + '</span>'; }, sort: function (s) { return store.role(s.jobRoleId).name; } },
              { key: 'loc', label: 'Location', render: function (s) { return ui.esc(store.locName(s.locationId)); }, sort: function (s) { return store.locName(s.locationId); } },
              { key: 'brk', label: 'Break', align: 'r', render: function (s) { return s.breakMin ? s.breakMin + ' min' : '—'; }, sort: function (s) { return s.breakMin; } },
              { key: 'hrs', label: 'Paid hours', align: 'r', render: function (s) { return ui.hrs(R.shiftMinutes(s)); }, sort: function (s) { return R.shiftMinutes(s); } },
              { key: 'st', label: 'Status', render: function (s) { return ui.badge(s.status) + (issues[s.id] ? ' <span class="bdg bdg--amber" title="' + ui.esc(issues[s.id].map(function (x) { return x.text; }).join('\n')) + '">' + I('alert', 11) + issues[s.id].length + '</span>' : ''); }, sort: function (s) { return s.status; } },
              { key: 'notes', label: 'Notes', cls: 'wrapc', render: function (s) { return '<span class="muted small">' + ui.esc(s.notes || '') + '</span>'; }, sort: false }
            ],
            onRowClick: function (s) { KT.v.shiftEditor({ id: s.id }); },
            bulk: function () { return '<button class="btn btn--sm" data-bpub>' + I('send', 13) + 'Publish selected drafts</button><button class="btn btn--sm" data-bdel>' + I('trash', 13) + 'Delete selected drafts</button>'; },
            empty: ui.empty('cal', 'No shifts match', 'Change the filters or add a shift.')
          });
          host.addEventListener('click', function (e) {
            var sel = t.selected().map(store.shift).filter(function (s) { return s && s.status === 'draft'; });
            if (e.target.closest('[data-bpub]')) { if (!sel.length) { ui.toast('Select draft shifts to publish', 'info'); return; } var dates = sel.map(function (s) { return s.date; }).sort(); var r = ui.run(function () { return store.publish(dates[0], dates[dates.length - 1], sel.map(function (s) { return s.id; })); }); if (r) { ui.toast('Published ' + ui.plural(r.count, 'shift') + '; ' + ui.plural(r.people, 'person', 'people') + ' notified'); t.clear(); } }
            if (e.target.closest('[data-bdel]')) { if (!sel.length) { ui.toast('Select draft shifts to delete', 'info'); return; } ui.confirm({ title: 'Delete ' + ui.plural(sel.length, 'draft shift') + '?', body: 'Drafts were never visible to employees. This can’t be undone.', ok: 'Delete', danger: true }).then(function (ok) { if (ok) { ui.run(function () { sel.forEach(function (s) { store.cancelShift(s.id); }); }, 'Deleted ' + ui.plural(sel.length, 'draft')); } }); }
          });
        }
        var cur = v.querySelector('.tl-now'); if (cur && view === 'day') { var sc = cur.closest('.tl-scroll'); if (sc) sc.scrollLeft = Math.max(0, sc.scrollWidth * (+getComputedStyle(cur).getPropertyValue('--x') / 100) - sc.clientWidth / 2); }
      },
      tick: function () { if (!document.querySelector('.ov') && !document.querySelector('.is-dragging')) app.refresh(); }
    };
  });

  function publishDialog(from, to) {
    var drafts = store.draftsIn(from, to).filter(function (s) { return store.can('schedule.publish', s.locationId); });
    var byLoc = {}; drafts.forEach(function (s) { byLoc[s.locationId] = (byLoc[s.locationId] || 0) + 1; });
    var people = {}; drafts.forEach(function (s) { if (s.employeeId) people[s.employeeId] = 1; });
    var open = drafts.filter(function (s) { return !s.employeeId; }).length;
    var warn = drafts.filter(function (s) { if (!s.employeeId) return false; var v = store.checkShift(s); return v.warnings.filter(function (x) { return x.code !== 'skill' && x.code !== 'location'; }).length; }).length;
    ui.modal({ title: 'Publish ' + ui.plural(drafts.length, 'shift') + '?', sub: ui.range(from, to),
      body: '<dl class="kv">' + Object.keys(byLoc).map(function (l) { return '<dt>' + ui.esc(store.locName(l)) + '</dt><dd>' + ui.plural(byLoc[l], 'shift') + '</dd>'; }).join('') + '<dt>People notified</dt><dd>' + Object.keys(people).length + ' (in the app)</dd></dl>' +
        (open ? '<div class="note" style="margin-top:12px">' + I('alert', 14) + '<span>' + ui.plural(open, 'shift is', 'shifts are') + ' still open. Publishing makes them visible as unfilled.</span></div>' : '') +
        (warn ? '<div class="note" style="margin-top:8px">' + I('alert', 14) + '<span>' + ui.plural(warn, 'shift has', 'shifts have') + ' warnings (rest, overtime or break rules). Review them in the list view if needed.</span></div>' : '') +
        '<p class="muted small" style="margin-top:12px">Employees see published shifts in their schedule and get an in-app notification. This template doesn’t send email or SMS.</p>',
      ok: 'Publish', onOk: function () { var r = ui.run(function () { return store.publish(from, to); }); if (r) ui.toast('Published ' + ui.plural(r.count, 'shift') + '. ' + ui.plural(r.people, 'person', 'people') + ' notified in the app.'); return !!r; } });
  }
  function copyDialog(ws) {
    var S = store.state, next = R.addDays(ws, 7);
    var src = S.shifts.filter(function (s) { return s.status !== 'cancelled' && R.inRange(s.date, ws, R.addDays(ws, 6)) && store.inScope(s.locationId) && store.can('schedule.edit', s.locationId); });
    ui.modal({ title: 'Copy this week’s schedule', sub: ui.plural(src.length, 'shift') + ' from ' + ui.range(ws, R.addDays(ws, 6)),
      body: ui.field('Copy to the week starting', '<input class="inp" type="date" name="to" value="' + next + '" step="7">', { hint: 'Copies are drafts. Shifts that would clash with leave or other shifts become open shifts; exact duplicates are skipped.' }),
      ok: 'Copy shifts', onOk: function (a) {
        var to = a.el.querySelector('[name=to]').value; if (!to) { ui.toast('Choose a week', 'err'); return false; }
        to = R.weekStart(to, S.org.weekStart);
        if (to === ws) { ui.toast('Choose a different week', 'err'); return false; }
        var r = ui.run(function () { return store.copyWeek(ws, to); }); if (!r) return false;
        ui.toast('Copied ' + ui.plural(r.made, 'shift') + ' as drafts' + (r.asOpen ? ', ' + r.asOpen + ' as open shifts (clashes)' : '') + (r.skipped.length ? ', skipped ' + r.skipped.length : ''), 'ok', { label: 'View', fn: function () { app.go('#/schedule?date=' + to); } });
        return true;
      } });
  }
})();
