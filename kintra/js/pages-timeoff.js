/* ============================================================
   KINTRA — Time off: balances, requests, approvals with coverage
   impact and overlap checks, team calendar, history.
   ============================================================ */
(function () {
  'use strict';
  var ui = KT.ui, store = KT.store, R = KT.rules, app = KT.app, I = ui.icon;
  var TONE = { teal: '', amber: 'lchip--sick', blue: 'lchip--personal', grey: 'lchip--unpaid' };

  function typeChip(t, pending) { return '<span class="lchip ' + (TONE[t.color] || '') + (pending ? ' is-pending' : '') + '" style="display:inline-block;width:auto">' + ui.esc(t.name) + '</span>'; }

  /* ---------- request form ---------- */
  KT.v.leaveForm = function (o) {
    o = o || {};
    var S = store.state, me = store.me(), myEmp = store.myEmp();
    var onBehalf = store.canAny('timeoff.approve') || store.canAny('employees.edit');
    var emps = onBehalf ? store.employees({ perm: 'timeoff.approve' }).concat(store.employees({ perm: 'employees.edit' })).filter(function (e, i, a) { return a.indexOf(e) === i && e.status !== 'terminated'; }) : [];
    if (myEmp && emps.indexOf(myEmp) < 0) emps.unshift(myEmp);
    if (!emps.length) { ui.toast('Your account isn’t linked to an employee record.', 'err'); return; }
    var empId = o.employeeId || (myEmp ? myEmp.id : emps[0].id), today = store.today();
    var types = S.leaveTypes.filter(function (t) { return !t.archived; });
    var body = '<form id="lvf" novalidate><div class="fgrid">' +
      (emps.length > 1 ? ui.field('Employee', ui.select('employeeId', emps.map(function (e) { return { value: e.id, label: store.name(e) + (myEmp && e.id === myEmp.id ? ' (you)' : ' · ' + store.locName(e.locationId)) }; }), empId), { full: true }) : '<input type="hidden" name="employeeId" value="' + empId + '">') +
      ui.field('Leave type', ui.select('typeId', types.map(function (t) { return { value: t.id, label: t.name + (t.paid ? '' : ' (unpaid)') }; }), o.typeId || types[0].id), { full: true }) +
      ui.field('First day', ui.input('start', o.start || R.addDays(today, 7), { type: 'date', req: true }), { req: true }) +
      ui.field('Last day', ui.input('end', o.end || R.addDays(today, 7), { type: 'date', req: true }), { req: true }) +
      '<div class="f f--full"><label class="cbx"><input type="checkbox" class="chk" name="half"> Half day (single day only)</label></div>' +
      ui.field('Note for your manager', '<textarea class="ta" name="note" rows="2" placeholder="Optional for most leave types"></textarea>', { full: true }) +
      '</div><div id="lv-calc" style="margin-top:12px"></div></form>';
    var m = ui.modal({ title: 'Request time off', sub: 'Your manager is notified in the app. Leave rules follow ' + ui.esc(S.org.name) + '’s policy settings.', body: body, ok: 'Submit request', onOk: function () {
      var d = ui.read(m.el.querySelector('#lvf'));
      var r = ui.run(function () { return store.requestLeave(d); });
      if (!r) return false;
      ui.toast('Request sent for approval · ' + ui.plural(r.days, 'day'));
      if (o.onDone) o.onDone(r);
      return true;
    } });
    var f = m.el.querySelector('#lvf');
    function calc() {
      var d = ui.read(f), e = store.emp(d.employeeId), t = store.leaveType(d.typeId), box = m.el.querySelector('#lv-calc');
      if (!d.start || !d.end || d.end < d.start) { box.innerHTML = d.end && d.start && d.end < d.start ? '<div class="note note--bad">' + I('alert', 14) + '<span>The last day is before the first day.</span></div>' : ''; return; }
      var half = d.half && d.start === d.end, days = store.leaveDays(d.start, d.end, half), b = store.balance(e, t);
      var shifts = S.shifts.filter(function (s) { return s.employeeId === e.id && s.status !== 'cancelled' && R.inRange(s.date, d.start, d.end); });
      var after = b.available == null ? null : b.available - b.pending - days;
      box.innerHTML = '<div class="note note--plain">' + I('cal', 14) + '<span><b>' + ui.plural(days, 'day') + '</b> counted (' + { weekdays: 'Monday to Friday', mon_sat: 'Monday to Saturday', calendar: 'every calendar day' }[S.org.leave.countMode] + ', excluding public holidays)' + (b.available != null ? '. Balance after: <b class="' + (after < 0 ? 'var-neg' : '') + '">' + after + ' of ' + b.entitlement + '</b>' + (b.pending ? ' (' + b.pending + ' already pending)' : '') : '') + '.</span></div>' +
        (shifts.length ? '<div class="note" style="margin-top:6px">' + I('alert', 14) + '<span>' + (myEmp && e.id === myEmp.id ? 'You have' : e.first + ' has') + ' ' + ui.plural(shifts.length, 'scheduled shift') + ' in this period. If approved, they become open shifts for your manager to fill.</span></div>' : '') +
        (t.note ? '<div class="muted small" style="margin-top:6px">A note is required for ' + ui.esc(t.name.toLowerCase()) + '.</div>' : '');
    }
    f.addEventListener('input', calc); f.addEventListener('change', calc); calc();
  };

  /* ---------- decide ---------- */
  function decide(r, decision, release, after) {
    if (decision === 'declined') {
      ui.modal({ title: 'Decline this request?', sub: store.empName(r.employeeId) + ' · ' + ui.range(r.start, r.end), body: ui.field('Reason (shared with the employee)', '<textarea class="ta" name="reason" rows="3" placeholder="e.g. Two people from the floor team are already off that weekend. Could you take the following week?"></textarea>', { req: true }), ok: 'Decline request', danger: true, onOk: function (a) {
        var ok = ui.run(function () { return store.decideLeave(r.id, 'declined', { reason: a.el.querySelector('[name=reason]').value }); }, 'Request declined. ' + store.empName(r.employeeId).split(' ')[0] + ' was notified.');
        if (ok && after) after(); return !!ok;
      } });
      return;
    }
    var res = ui.run(function () { return store.decideLeave(r.id, 'approved', { release: release }); });
    if (!res) return;
    if (res.status === 'pending') ui.toast('Approved at your step. HR has been asked to confirm.', 'info');
    else ui.toast('Approved' + (res.released ? '. ' + ui.plural(res.released, 'shift is', 'shifts are') + ' now open.' : '.'), 'ok', res.released ? { label: 'Fill shifts', fn: function () { app.go('#/schedule?date=' + r.start + '&filter=open'); } } : null);
    if (after) after();
  }

  function reqCard(r, withActions) {
    var e = store.emp(r.employeeId), t = store.leaveType(r.typeId), imp = store.leaveImpact(r), steps = store.leaveSteps();
    var bal = imp.balance, after = bal.available == null ? null : bal.available - r.days;
    var chk = [];
    if (after != null) chk.push(after < 0 ? ui.tag('Over balance by ' + (-after) + ' days', 'red') : ui.tag(after + ' days left after', 'grey'));
    chk.push(imp.shifts.length ? ui.tag(ui.plural(imp.shifts.length, 'scheduled shift'), 'blue') : ui.tag('No shifts affected', 'green'));
    if (imp.gaps.length) chk.push(ui.tag(ui.plural(imp.gaps.length, 'coverage gap') + ' if approved', 'red'));
    if (imp.overlaps.length) chk.push(ui.tag(ui.plural(imp.overlaps.length, 'overlapping request') + ' in the team', 'amber'));
    var details = '';
    if (imp.gaps.length || imp.overlaps.length) details = '<div class="impact" style="margin-top:8px">' + imp.gaps.slice(0, 3).map(function (g) { return '<div class="note note--bad">' + I('alert', 13) + '<span>' + ui.date(g.date, { dow: true }) + ': ' + ui.esc(g.role) + ' ' + g.window + ' would have ' + g.scheduled + ' of ' + g.required + ' scheduled</span></div>'; }).join('') + imp.overlaps.map(function (o) { var oe = store.emp(o.employeeId); return '<div class="note">' + I('users', 13) + '<span>' + ui.esc(store.name(oe)) + ' (' + ui.esc(store.role(oe.jobRoleId).name) + ') is ' + (o.status === 'approved' ? 'off' : 'asking for') + ' ' + ui.range(o.start, o.end) + (o.status === 'pending' ? ' (pending)' : '') + '</span></div>'; }).join('') + '</div>';
    var stepInfo = steps.length > 1 ? '<div class="muted small" style="margin-top:6px">Approval: ' + steps.map(function (s, i) { var a = (r.approvals || [])[i]; return (s === 'hr' ? 'HR' : 'Manager') + (a ? ' ✓ ' + ui.esc(store.userName(a.by)) : ''); }).join(' → ') + '</div>' : '';
    var acts = '';
    if (withActions) {
      if (store.canDecide(r)) acts = '<div class="req__acts"><button class="btn btn--sm" data-dec="' + r.id + '">Decline</button><button class="btn btn--p btn--sm" data-app="' + r.id + '">' + I('check', 14) + 'Approve</button></div>';
      else if (r.status === 'pending' && store.me().employeeId === r.employeeId) acts = '<div class="req__acts"><button class="btn btn--sm" data-cancel="' + r.id + '">Cancel request</button></div>';
      else if (r.status === 'pending') acts = '<div class="req__acts"><span class="muted small">' + (store.me().employeeId === r.employeeId ? '' : 'Waiting for another approver') + '</span></div>';
    }
    return '<div class="req" id="req-' + r.id + '"><div class="req__m"><div class="req__t">' + ui.avatar(store.name(e), 'sm') + '<a href="#/employees/' + e.id + '">' + ui.esc(store.name(e)) + '</a>' + typeChip(t, r.status === 'pending') + ui.badge(r.status) + '</div><div class="req__s">' + ui.date(r.start, { dow: true }) + (r.end !== r.start ? ' – ' + ui.date(r.end, { dow: true }) : '') + ' · <b>' + ui.plural(r.days, 'day') + '</b>' + (r.half ? ' (half day)' : '') + ' · ' + ui.esc(store.role(e.jobRoleId).name) + ', ' + ui.esc(store.locName(e.locationId)) + ' · requested ' + ui.rel(r.createdAt) + '</div>' + (r.note ? '<div class="req__note">“' + ui.esc(r.note) + '”</div>' : '') + (r.status === 'pending' ? '<div class="req__chk">' + chk.join('') + '</div>' + details + stepInfo : '') + (r.status === 'declined' && r.reason ? '<div class="req__s" style="margin-top:6px">Declined by ' + ui.esc(store.userName(r.decidedBy)) + ': “' + ui.esc(r.reason) + '”</div>' : '') + (r.status === 'approved' && r.decidedBy ? '<div class="req__s" style="margin-top:4px">Approved by ' + ui.esc(store.userName(r.decidedBy)) + ' ' + ui.rel(r.decidedAt) + '</div>' : '') + (r.status === 'pending' && imp.shifts.length && store.canAny('schedule.edit') ? '<a class="link" style="margin-top:8px" href="#/schedule?date=' + r.start + '&who=' + encodeURIComponent(e.first) + '">See their schedule ' + I('arrowR', 12) + '</a>' : '') + '</div>' + acts + '</div>';
  }
  function bindReqs(root, after) {
    root.querySelectorAll('[data-app]').forEach(function (b) { b.onclick = function () { var r = store.leaveReq(b.getAttribute('data-app')), imp = store.leaveImpact(r); if (imp.shifts.length && store.leaveSteps().length === (r.approvals || []).length + 1) { ui.modal({ title: 'Approve ' + store.empName(r.employeeId) + '’s time off?', sub: ui.range(r.start, r.end) + ' · ' + ui.plural(r.days, 'day'), body: '<p>' + store.empName(r.employeeId).split(' ')[0] + ' has ' + ui.plural(imp.shifts.length, 'scheduled shift') + ' in this period.</p><label class="cbx" style="margin-top:12px"><input type="checkbox" class="chk" name="rel" checked> Release them as open shifts so they can be filled</label>' + (imp.gaps.length ? '<div class="note note--bad" style="margin-top:12px">' + I('alert', 14) + '<span>' + ui.plural(imp.gaps.length, 'staffing requirement') + ' will be short until those shifts are filled.</span></div>' : ''), ok: 'Approve', onOk: function (a) { decide(r, 'approved', a.el.querySelector('[name=rel]').checked, after); } }); } else decide(r, 'approved', true, after); }; });
    root.querySelectorAll('[data-dec]').forEach(function (b) { b.onclick = function () { decide(store.leaveReq(b.getAttribute('data-dec')), 'declined', false, after); }; });
    root.querySelectorAll('[data-cancel]').forEach(function (b) { b.onclick = function () { ui.confirm({ title: 'Cancel this request?', body: 'Your manager will no longer see it as pending.', ok: 'Cancel request', danger: true }).then(function (ok) { if (ok) ui.run(function () { store.cancelLeave(b.getAttribute('data-cancel')); }, 'Request cancelled'); }); }; });
  }

  /* ---------- page ---------- */
  KT.route('/time-off', function (p, q) {
    var S = store.state, me = store.me(), myEmp = store.myEmp(), mgr = store.canAny('timeoff.approve'), today = store.today();
    var tabs = [];
    if (myEmp) tabs.push(['mine', 'My time off', '#/time-off?tab=mine']);
    if (mgr) tabs.push(['approvals', 'Approvals', '#/time-off?tab=approvals', store.pendingForMe().length || null], ['calendar', 'Team calendar', '#/time-off?tab=calendar'], ['all', 'All requests', '#/time-off?tab=all']);
    if (!tabs.length) return { title: 'Time off', html: app.ph('Time off') + '<div class="card">' + ui.empty('plane', 'No time-off access', 'Your account isn’t linked to an employee record, and your role doesn’t approve requests.') + '</div>' };
    var tab = q.tab || (q.req ? (mgr && store.leaveReq(q.req) && store.leaveReq(q.req).employeeId !== me.employeeId ? 'approvals' : myEmp ? 'mine' : 'all') : mgr && store.pendingForMe().length ? 'approvals' : tabs[0][0]);
    if (!tabs.some(function (t) { return t[0] === tab; })) tab = tabs[0][0];
    var html = '', mount = null;

    if (tab === 'mine') {
      var bal = S.leaveTypes.filter(function (t) { return !t.archived; }).map(function (t) { var b = store.balance(myEmp, t); return '<div class="balc"><span>' + ui.esc(t.name) + '</span><b class="num">' + (b.available == null ? '—' : b.available) + '</b><em>' + (b.entitlement == null ? 'Not tracked · ' + b.used + ' taken' : 'of ' + b.entitlement + ' days' + (b.pending ? ' · ' + b.pending + ' pending' : '') + (b.used ? ' · ' + b.used + ' taken' : '')) + '</em></div>'; }).join('');
      var mine = S.leave.filter(function (l) { return l.employeeId === myEmp.id; }).sort(function (a, b) { return a.start < b.start ? 1 : -1; });
      var up = mine.filter(function (l) { return l.end >= today && (l.status === 'pending' || l.status === 'approved'); }), past = mine.filter(function (l) { return up.indexOf(l) < 0; });
      html = '<div class="card"><div class="card__h"><h2>' + I('wallet', 16) + 'Balances</h2><span class="sub">Leave year ' + today.slice(0, 4) + ' · policy set by your organisation</span></div><div class="card__b"><div class="balgrid">' + bal + '</div></div></div>' +
        '<div class="card" style="margin-top:14px"><div class="card__h"><h2>' + I('cal', 16) + 'Upcoming and pending</h2></div>' + (up.length ? up.map(function (r) { return reqCard(r, true); }).join('') : ui.empty('plane', 'Nothing booked', 'Requests you make appear here until they’re over.')) + '</div>' +
        '<div class="card" style="margin-top:14px"><div class="card__h"><h2>' + I('history', 16) + 'History</h2></div>' + (past.length ? past.map(function (r) { return reqCard(r, false); }).join('') : '<div class="card__b muted">No past requests.</div>') + '</div>';
    } else if (tab === 'approvals') {
      var pend = S.leave.filter(function (r) { var e = store.emp(r.employeeId); return r.status === 'pending' && e && store.inScope(e.locationId) && store.can('timeoff.approve', e.locationId) && r.employeeId !== me.employeeId; }).sort(function (a, b) { return a.start < b.start ? -1 : 1; });
      var mineToDecide = pend.filter(store.canDecide), others = pend.filter(function (r) { return !store.canDecide(r); });
      html = '<div class="card"><div class="card__h"><h2>' + I('approve', 16) + 'Waiting for your decision</h2><span class="sub">' + mineToDecide.length + '</span></div>' + (mineToDecide.length ? mineToDecide.map(function (r) { return reqCard(r, true); }).join('') : ui.empty('check', 'All caught up', 'New requests from your teams appear here.')) + '</div>' +
        (others.length ? '<div class="card" style="margin-top:14px"><div class="card__h"><h2>Waiting for someone else</h2><span class="sub">' + others.length + '</span></div>' + others.map(function (r) { return reqCard(r, true); }).join('') + '</div>' : '');
    } else if (tab === 'calendar') {
      var month = (q.month || today.slice(0, 7)), first = month + '-01', ms = R.weekStart(first, S.org.weekStart);
      var last = R.addDays((+month.slice(5) === 12 ? (+month.slice(0, 4) + 1) + '-01' : month.slice(0, 4) + '-' + R.pad(+month.slice(5) + 1)) + '-01', -1), me2 = R.addDays(R.weekStart(last, S.org.weekStart), 6);
      var dept = q.dept || '', ltype = q.type || '';
      var reqs = S.leave.filter(function (r) { var e = store.emp(r.employeeId); return (r.status === 'approved' || r.status === 'pending') && e && store.inScope(e.locationId) && store.can('timeoff.approve', e.locationId) && (!dept || e.deptId === dept) && (!ltype || r.typeId === ltype) && R.overlapsRange(r.start, r.end, ms, me2); });
      var hol = {}; S.org.holidays.forEach(function (h) { hol[h.date] = h.name; });
      var prevM = R.addDays(first, -1).slice(0, 7), nextM = R.addDays(last, 1).slice(0, 7);
      var cells = R.range(ms, me2).map(function (d) {
        var on = reqs.filter(function (r) { return R.inRange(d, r.start, r.end); });
        var w = R.dow(d), countable = !(S.org.leave.countMode === 'weekdays' && (w === 0 || w === 6)) && !(S.org.leave.countMode === 'mon_sat' && w === 0);
        return '<div class="mcal__d' + (d.slice(0, 7) !== month ? ' is-out' : '') + (d === today ? ' is-today' : '') + '"><div class="row" style="gap:4px"><span class="mcal__n">' + (+d.slice(8)) + '</span>' + (hol[d] ? '<span class="mcal__hol" title="' + ui.esc(hol[d]) + '">' + ui.esc(hol[d]) + '</span>' : '') + '</div>' + on.slice(0, 3).map(function (r) { var t = store.leaveType(r.typeId), e = store.emp(r.employeeId); return '<button type="button" class="lchip ' + (TONE[t.color] || '') + (r.status === 'pending' ? ' is-pending' : '') + '" data-req="' + r.id + '" title="' + ui.esc(store.name(e) + ' · ' + t.name + ' · ' + ui.range(r.start, r.end) + (r.status === 'pending' ? ' (pending)' : '')) + '"' + (countable ? '' : ' style="opacity:.6"') + '>' + ui.esc(e.first + ' ' + e.last.charAt(0) + '.') + '</button>'; }).join('') + (on.length > 3 ? '<span class="lmore">+' + (on.length - 3) + ' more</span>' : '') + '</div>';
      }).join('');
      var mnames = ui.MON[+month.slice(5) - 1] + ' ' + month.slice(0, 4);
      html = '<div class="card"><div class="card__h"><div class="row" style="gap:6px"><a class="btn btn--sm btn--icon" href="#/time-off?tab=calendar&month=' + prevM + '" aria-label="Previous month">' + I('chevL', 15) + '</a><a class="btn btn--sm btn--icon" href="#/time-off?tab=calendar&month=' + nextM + '" aria-label="Next month">' + I('chevR', 15) + '</a><h2 style="margin-left:6px">' + mnames + '</h2></div><div class="row wrap" style="gap:6px">' + ui.select('dept', app.deptOptions(true), dept, { cls: 'sel--sm', attr: ' aria-label="Department" style="width:auto"' }) + ui.select('type', [{ value: '', label: 'All leave types' }].concat(S.leaveTypes.map(function (t) { return { value: t.id, label: t.name }; })), ltype, { cls: 'sel--sm', attr: ' aria-label="Leave type" style="width:auto"' }) + '</div></div>' +
        '<div class="mcal">' + [1, 2, 3, 4, 5, 6, 0].map(function (i) { return '<div class="mcal__h">' + ui.DAY[(i + S.org.weekStart - 1) % 7] + '</div>'; }).join('') + cells + '</div><div class="card__f"><span class="legend">' + S.leaveTypes.filter(function (t) { return !t.archived; }).map(function (t) { return '<span>' + typeChip(t) + '</span>'; }).join('') + '<span><span class="lchip is-pending" style="display:inline-block;width:auto;color:var(--ink-3)">Outlined</span> = pending</span></span></div></div>';
      mount = function (v) { ['dept', 'type'].forEach(function (k) { v.querySelector('[name=' + k + ']').onchange = function (e) { q[k] = e.target.value; app.updateQuery(q); app.refresh(); }; }); v.querySelectorAll('[data-req]').forEach(function (b) { b.onclick = function () { detail(store.leaveReq(b.getAttribute('data-req'))); }; }); };
    } else {
      html = '<div class="card" id="lv-all"></div>';
      mount = function (v) {
        var st = q.status || '';
        var rows = S.leave.filter(function (r) { var e = store.emp(r.employeeId); return e && store.inScope(e.locationId) && store.can('timeoff.approve', e.locationId); });
        var host = v.querySelector('#lv-all');
        host.insertAdjacentHTML('beforebegin', '');
        var bar = document.createElement('div'); bar.className = 'tbar';
        bar.innerHTML = '<div class="search-inp">' + I('search', 14) + '<input class="inp inp--sm" type="search" placeholder="Search employee" data-s aria-label="Search employee"></div>' + ui.select('status', [{ value: '', label: 'Any status' }, { value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' }, { value: 'declined', label: 'Declined' }, { value: 'cancelled', label: 'Cancelled' }], st, { cls: 'sel--sm', attr: ' aria-label="Status"' }) + ui.select('type', [{ value: '', label: 'All types' }].concat(S.leaveTypes.map(function (t) { return { value: t.id, label: t.name }; })), '', { cls: 'sel--sm', attr: ' aria-label="Type"' }) + '<span class="sp"></span><button class="btn btn--sm" data-csv>' + I('download', 14) + 'CSV</button>';
        host.appendChild(bar); var tb = document.createElement('div'); host.appendChild(tb);
        function filt() { var s = bar.querySelector('[data-s]').value.toLowerCase(), stt = bar.querySelector('[name=status]').value, ty = bar.querySelector('[name=type]').value; return rows.filter(function (r) { return (!s || store.empName(r.employeeId).toLowerCase().indexOf(s) >= 0) && (!stt || r.status === stt) && (!ty || r.typeId === ty); }); }
        var t = ui.table(tb, { rows: filt(), pageSize: 25, showCount: true, initialSort: { key: 'start', dir: 'desc' }, onRowClick: function (r) { detail(r); },
          columns: [
            { key: 'emp', label: 'Employee', render: function (r) { return app.empCell(store.emp(r.employeeId)); }, sort: function (r) { return store.empName(r.employeeId); } },
            { key: 'type', label: 'Type', render: function (r) { return typeChip(store.leaveType(r.typeId)); }, sort: function (r) { return store.leaveType(r.typeId).name; } },
            { key: 'start', label: 'Dates', render: function (r) { return ui.range(r.start, r.end); }, sort: function (r) { return r.start; } },
            { key: 'days', label: 'Days', align: 'r', render: function (r) { return r.days; } },
            { key: 'status', label: 'Status', render: function (r) { return ui.badge(r.status); } },
            { key: 'by', label: 'Decided by', render: function (r) { return r.decidedBy ? ui.esc(store.userName(r.decidedBy)) : '<span class="muted">—</span>'; }, sort: function (r) { return r.decidedBy ? store.userName(r.decidedBy) : ''; } },
            { key: 'createdAt', label: 'Requested', render: function (r) { return ui.date(r.createdAt.slice(0, 10)); } }
          ] });
        bar.addEventListener('input', ui.debounce(function () { t.setRows(filt()); }, 150)); bar.addEventListener('change', function () { t.setRows(filt()); });
        bar.querySelector('[data-csv]').onclick = function () { ui.csv('kintra-time-off.csv', [{ label: 'Employee', csv: function (r) { return store.empName(r.employeeId); } }, { label: 'Location', csv: function (r) { return store.locName(store.emp(r.employeeId).locationId); } }, { label: 'Type', csv: function (r) { return store.leaveType(r.typeId).name; } }, { label: 'Start', key: 'start' }, { label: 'End', key: 'end' }, { label: 'Days', key: 'days' }, { label: 'Status', key: 'status' }, { label: 'Decided by', csv: function (r) { return r.decidedBy ? store.userName(r.decidedBy) : ''; } }, { label: 'Reason', key: 'reason' }, { label: 'Demo data', csv: function () { return 'yes'; } }], t.rows()); };
      };
    }
    function detail(r) {
      var m = ui.modal({ title: 'Time-off request', drawer: true, body: '<div class="card" style="box-shadow:none">' + reqCard(r, true) + '</div><h4 class="flabel" style="margin:16px 0 8px">History</h4><div class="timeline">' + store.history('leave', r.id).slice().reverse().map(function (a) { return '<div class="tl"><span class="tl__i">' + I('history', 11) + '</span><div><div class="tl__t">' + ui.esc(a.text) + '</div><div class="tl__s">' + ui.esc(a.by ? store.userName(a.by) : '') + ' · ' + ui.dt(a.at) + (a.reason ? ' · “' + ui.esc(a.reason) + '”' : '') + '</div></div></div>'; }).join('') + '</div>', foot: '<span class="sp"></span><button class="btn" data-x>Close</button>' });
      bindReqs(m.el, function () { m.close(); });
    }
    return {
      title: 'Time off',
      html: app.ph('Time off', mgr ? 'Requests, balances and who’s away.' : 'Your balances and requests.', (myEmp || store.canAny('employees.edit') ? '<button class="btn btn--p btn--sm" data-new>' + I('plus', 15) + (myEmp ? 'Request time off' : 'Add request') + '</button>' : '')) + app.tabs(tabs, tab) + html,
      mount: function (v) {
        var nb = v.querySelector('[data-new]'); if (nb) nb.onclick = function () { KT.v.leaveForm(); };
        bindReqs(v);
        if (mount) mount(v);
        if (q.new) { delete q.new; app.updateQuery(q); setTimeout(function () { KT.v.leaveForm(); }, 60); }
        if (q.req) { var el = v.querySelector('#req-' + q.req); var r = store.leaveReq(q.req); delete q.req; app.updateQuery(q); if (el) { el.scrollIntoView({ block: 'center' }); el.style.background = 'var(--acc-tint)'; } else if (r) setTimeout(function () { detail(r); }, 60); }
      }
    };
  });
})();
