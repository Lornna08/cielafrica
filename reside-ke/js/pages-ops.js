/* ============================================================
   Reside Ke — Rentals, calendar, tasks, documents, team, analytics,
   settings
   ============================================================ */
(function () {
  'use strict';
  var I = ES.icon, st = ES.store, f = ES.fmt, esc = f.esc, DAY = 864e5;
  function kq(ic, val, label) { return '<div class="kq"><span class="kq__ic">' + I(ic, 16) + '</span><span class="kq__b"><b>' + val + '</b><em>' + label + '</em></span></div>'; }
  function days(d) { return Math.round((new Date(d) - Date.now()) / DAY); }

  /* ======================= RENTALS ======================= */
  var RT = [['properties', 'Properties'], ['leases', 'Leases'], ['payments', 'Rent payments'], ['applications', 'Applications'], ['maintenance', 'Maintenance']];
  var MT = { open: 'red', in_progress: 'amber', scheduled: 'blue', done: 'green' };
  ES.pages.rentals = {
    render: function (v, params) {
      var tab = params[0] === 'management' ? 'maintenance' : (params[0] || 'properties');
      var rent = st.listings().filter(function (p) { return p.category === 'rent'; });
      var leases = st.s.leases.filter(function (l) { return l.status === 'active'; });
      var occ = rent.filter(function (p) { return p.status === 'let'; }).length;
      var arrears = st.s.payments.filter(function (x) { return x.status === 'late' || (x.status === 'due' && new Date(x.due) < Date.now()); });
      var ending = leases.filter(function (l) { return days(l.end) <= 60; });
      v.innerHTML = '<header class="ph"><h1>Rentals</h1><div class="ph__k">' +
        kq('key', (rent.length ? Math.round(occ / rent.length * 100) : 0) + '%', 'Occupancy · ' + occ + ' of ' + rent.length) +
        kq('wallet', f.money(leases.reduce(function (a, l) { return a + l.rent; }, 0), true), 'Monthly rent roll') +
        kq('alert', '<span style="color:' + (arrears.length ? 'var(--red)' : 'inherit') + '">' + f.money(arrears.reduce(function (a, x) { return a + x.amount; }, 0), true) + '</span>', 'Arrears · ' + arrears.length + ' payment' + (arrears.length === 1 ? '' : 's')) +
        kq('clock', ending.length, 'Leases ending ≤ 60 days') +
        '</div><div class="ph__a"><button class="btn" data-r="mnt">' + I('wrench', 15) + 'Maintenance request</button><button class="btn" data-r="app">' + I('file', 15) + 'Add application</button><a class="btn btn--dark" href="#/listings/new">' + I('plus', 15) + 'New rental listing</a></div></header>' +
        '<nav class="stabs">' + RT.map(function (t) { return '<a class="stab' + (tab === t[0] ? ' is-on' : '') + '" href="#/rentals/' + t[0] + '">' + t[1] + '</a>'; }).join('') + '</nav><div id="rtBody"></div>';
      var b = v.querySelector('#rtBody');
      if (tab === 'properties') {
        b.innerHTML = '<div class="lg">' + rent.map(function (p) {
          var l = st.leaseFor(p.id), t = l ? st.contact(l.tenantId) : null, apps = st.s.applications.filter(function (a) { return a.propertyId === p.id && a.status !== 'declined'; }).length;
          return '<a class="lc" href="#/property/' + p.id + '"><div class="lc__m"><img src="' + p.images[0] + '" alt="" loading="lazy"><span class="lc__tag">' + (l ? ES.pill('Occupied', 'green') : ES.pill('Available', 'blue')) + '</span></div><div class="lc__b"><span class="lc__t">' + esc(p.title) + '</span><span class="lc__l">' + I('pin', 12) + esc(p.area) + ' · ' + esc(p.type) + '</span><span class="lc__p">' + f.money(p.price) + '<small> /month</small></span>' +
            (l ? '<span class="lc__s"><span>' + ES.cav(t, 20) + esc(t.name) + '</span></span><span class="t-sub">Lease to ' + f.dateLong(l.end) + ' · ' + days(l.end) + ' days left</span><span class="lease-bar' + (days(l.end) <= 60 ? ' is-soon' : '') + '"><i style="width:' + leasePct(l) + '%"></i></span>' : '<span class="t-sub">' + apps + ' application' + (apps === 1 ? '' : 's') + ' · listed ' + st.daysOnMarket(p) + ' days</span>') + '</div></a>';
        }).join('') + '</div>';
      }
      if (tab === 'leases') {
        var LL = st.s.leases.slice().sort(function (a, b2) { return new Date(a.end) - new Date(b2.end); });
        b.innerHTML = '<div class="t-wrap"><table class="t"><thead><tr><th>Property</th><th>Tenant</th><th>Landlord</th><th>Start</th><th>End</th><th class="r">Rent</th><th class="r">Deposit</th><th>Status</th></tr></thead><tbody>' + LL.map(function (l) {
          var p = st.prop(l.propertyId), t = st.contact(l.tenantId), ll = st.contact(l.landlordId), d = days(l.end), soon = l.status === 'active' && d <= 60;
          return '<tr data-lease="' + l.id + '" style="cursor:pointer"><td><span class="t-prop"><img src="' + p.images[0] + '" alt=""><span><b>' + esc(p.title) + '</b><em>' + esc(p.area) + '</em></span></span></td><td><span class="t-who">' + ES.cav(t, 24) + esc(t.name) + '</span></td><td>' + esc(ll ? ll.name : '—') + '</td><td>' + f.date(l.start) + '</td><td>' + f.date(l.end) + (l.status === 'active' ? '<span class="lease-bar' + (soon ? ' is-soon' : '') + '"><i style="width:' + leasePct(l) + '%"></i></span>' : '') + '</td><td class="r"><b>' + f.money(l.rent) + '</b></td><td class="r">' + f.money(l.deposit) + '</td><td>' + (l.status === 'ended' ? ES.pill('Ended', 'grey') : soon ? ES.pill('Ends in ' + d + 'd', 'amber') : ES.pill('Active', 'green')) + '</td></tr>';
        }).join('') + '</tbody></table></div>';
      }
      if (tab === 'payments') {
        var P = st.s.payments.slice().sort(function (a, b2) { return new Date(b2.due) - new Date(a.due); });
        b.innerHTML = '<p class="muted" style="font-size:12.5px;margin-bottom:10px">' + I('info', 12) + ' Sample payment records. “Record received” notes a payment in Reside Ke — it does not collect or verify money. Connect M-Pesa or your bank feed in production.</p><div class="t-wrap"><table class="t"><thead><tr><th>Month</th><th>Property</th><th>Tenant</th><th class="r">Amount</th><th>Due</th><th>Status</th><th>Recorded</th><th></th></tr></thead><tbody>' + P.map(function (x) {
          var l = st.lease(x.leaseId), p = st.prop(l.propertyId), t = st.contact(l.tenantId), late = x.status === 'late' || (x.status === 'due' && new Date(x.due) < Date.now());
          return '<tr><td><b>' + f.MON[new Date(x.due).getMonth()] + ' ' + new Date(x.due).getFullYear() + '</b></td><td>' + esc(p.title) + '</td><td>' + esc(t.name) + '</td><td class="r num">' + f.money(x.amount) + '</td><td>' + f.date(x.due) + '</td><td>' + (x.status === 'paid' ? ES.pill('Received', 'green') : late ? ES.pill('Overdue', 'red') : ES.pill('Due', 'amber')) + '</td><td>' + (x.recordedAt ? f.date(x.recordedAt) : '<span class="muted">—</span>') + '</td><td class="r">' + (x.status !== 'paid' ? '<button class="btn btn--sm" data-r="pay" data-id="' + x.id + '">Record received</button>' : '') + '</td></tr>';
        }).join('') + '</tbody></table></div>';
      }
      if (tab === 'applications') {
        var A = st.s.applications;
        b.innerHTML = A.length ? '<div class="t-wrap"><table class="t"><thead><tr><th>Applicant</th><th>Property</th><th class="r">Monthly income</th><th>Move-in</th><th>Received</th><th>Status</th><th></th></tr></thead><tbody>' + A.map(function (a) { var p = st.prop(a.propertyId); return '<tr><td><span class="t-who">' + ES.cav({ name: a.name }, 26) + '<span><b>' + esc(a.name) + '</b><span class="t-sub">' + esc(a.phone) + '</span></span></span></td><td>' + esc(p.title) + '<span class="t-sub">' + f.money(p.price) + ' /mo</span></td><td class="r">' + (a.income ? f.money(a.income) + (a.income < p.price * 3 ? ' <span class="pill pill--amber">&lt; 3× rent</span>' : '') : '<span class="muted">Company</span>') + '</td><td>' + f.date(a.moveIn) + '</td><td>' + f.ago(a.createdAt) + '</td><td>' + ES.pill(a.status, { received: 'violet', screening: 'amber', approved: 'green', declined: 'red' }[a.status]) + '</td><td class="r">' + (a.status === 'received' ? '<button class="btn btn--sm" data-r="as" data-id="' + a.id + '" data-s="screening">Start screening</button>' : a.status === 'screening' ? '<button class="btn btn--sm btn--ok" data-r="as" data-id="' + a.id + '" data-s="approved">Approve</button> <button class="btn btn--sm" data-r="as" data-id="' + a.id + '" data-s="declined">Decline</button>' : '') + '</td></tr>'; }).join('') + '</tbody></table></div>' : ES.empty('file', 'No applications', 'Applications from prospective tenants appear here.');
      }
      if (tab === 'maintenance') {
        var M = st.s.maintenance.slice().sort(function (a, b2) { return (a.status === 'done') - (b2.status === 'done') || new Date(b2.createdAt) - new Date(a.createdAt); });
        b.innerHTML = '<div class="t-wrap"><table class="t"><thead><tr><th>Request</th><th>Property</th><th>Priority</th><th>Vendor</th><th>Logged</th><th>Status</th><th></th></tr></thead><tbody>' + M.map(function (m) { var p = st.prop(m.propertyId), vd = m.vendorId ? st.contact(m.vendorId) : null; return '<tr><td><b>' + esc(m.title) + '</b></td><td>' + esc(p.title) + '</td><td>' + ES.pill(m.priority, { high: 'red', medium: 'amber', low: 'grey' }[m.priority]) + '</td><td>' + esc(vd ? vd.name : '—') + '</td><td>' + f.ago(m.createdAt) + '</td><td>' + ES.pill(m.status.replace('_', ' '), MT[m.status]) + '</td><td class="r"><button class="btn btn--sm" data-r="ms" data-id="' + m.id + '">Update ' + I('down', 12) + '</button></td></tr>'; }).join('') + '</tbody></table></div>';
      }
      v.onclick = function (e) {
        var x = e.target.closest('[data-r]'), lr = e.target.closest('[data-lease]');
        if (lr && !x) { leaseDrawer(lr.dataset.lease); return; }
        if (!x) return; var k = x.dataset.r;
        if (k === 'pay') ES.confirm({ title: 'Record rent as received?', icon: 'wallet', tone: 'green', ok: 'Record received', text: 'This notes the payment in the tenant ledger. No money is collected or verified in the demo.', onOk: function () { ES.try(function () { st.recordPayment(x.dataset.id); }, 'Payment recorded'); } });
        if (k === 'as') { var go = function () { ES.try(function () { st.setApplication(x.dataset.id, x.dataset.s); }, 'Application ' + x.dataset.s); }; if (x.dataset.s === 'screening') go(); else ES.confirm({ title: x.dataset.s === 'approved' ? 'Approve this application?' : 'Decline this application?', icon: x.dataset.s === 'approved' ? 'check' : 'x', tone: x.dataset.s === 'approved' ? 'green' : 'red', ok: x.dataset.s === 'approved' ? 'Approve' : 'Decline', text: x.dataset.s === 'approved' ? 'Next step: create a rental deal and move it to Contract when the lease is signed.' : 'The applicant is not notified automatically in the demo.', onOk: go }); }
        if (k === 'ms') ES.menu(x, ['open', 'scheduled', 'in_progress', 'done'].map(function (s) { return { label: s.replace('_', ' ').replace(/^./, function (c) { return c.toUpperCase(); }), s: s }; }), function (it) { ES.try(function () { st.setMaintenance(x.dataset.id, it.s); }, 'Request updated'); });
        if (k === 'mnt') maintModal();
        if (k === 'app') appModal();
      };
    }
  };
  function leasePct(l) { var s = new Date(l.start).getTime(), e = new Date(l.end).getTime(); return Math.max(2, Math.min(100, (Date.now() - s) / (e - s) * 100)).toFixed(0); }
  function leaseDrawer(id) {
    var l = st.lease(id), p = st.prop(l.propertyId), t = st.contact(l.tenantId), ll = st.contact(l.landlordId), pays = st.s.payments.filter(function (x) { return x.leaseId === id; });
    var panel = ES.open('drawer', ES.head('Lease — ' + p.title, esc(t.name) + ' · ' + f.dateLong(l.start) + ' to ' + f.dateLong(l.end)) + '<div class="ovl__body"><img src="' + p.images[0] + '" alt="" style="width:100%;height:160px;object-fit:cover;border-radius:14px;margin-bottom:14px"><dl class="kv"><dt>Tenant</dt><dd><a class="lnk" href="#/contact/' + t.id + '">' + esc(t.name) + '</a></dd><dt>Landlord</dt><dd>' + (ll ? '<a class="lnk" href="#/contact/' + ll.id + '">' + esc(ll.name) + '</a>' : '—') + '</dd><dt>Monthly rent</dt><dd>' + f.money(l.rent) + '</dd><dt>Deposit held</dt><dd>' + f.money(l.deposit) + '</dd><dt>Term</dt><dd>' + f.dateLong(l.start) + ' → ' + f.dateLong(l.end) + '</dd><dt>Status</dt><dd>' + (l.status === 'ended' ? 'Ended' : days(l.end) + ' days remaining') + '</dd></dl>' +
      '<h3 style="font-size:13px;margin:18px 0 8px">Payment history</h3>' + (pays.length ? '<div class="mini">' + pays.map(function (x) { return '<div class="mini__i"><span class="grow"><b>' + f.MON[new Date(x.due).getMonth()] + ' ' + new Date(x.due).getFullYear() + '</b><em>Due ' + f.date(x.due) + '</em></span><span class="num">' + f.money(x.amount) + '</span>' + ES.pill(x.status === 'paid' ? 'Received' : x.status, x.status === 'paid' ? 'green' : 'red') + '</div>'; }).join('') + '</div>' : '<p class="muted">No payments recorded.</p>') + '<p class="badge-sample" style="margin-top:12px">' + I('info', 12) + 'Sample transaction records</p></div>' +
      (l.status === 'active' ? '<div class="ovl__foot"><button class="btn" data-lz="mnt">' + I('wrench', 14) + 'Maintenance</button><button class="btn btn--dark" data-lz="renew">' + I('refresh', 14) + 'Schedule renewal</button></div>' : ''), { label: 'Lease' });
    panel.addEventListener('click', function (e) { var b = e.target.closest('[data-lz]'); if (!b) return; ES.close(); setTimeout(function () { if (b.dataset.lz === 'renew') ES.pages.calendar.edit(null, { type: 'renewal', propertyId: p.id, contactId: t.id, agentId: p.agentId, start: new Date(new Date(l.end).getTime() - 30 * DAY).toISOString() }); else maintModal(p.id); }, 240); });
  }
  function maintModal(pid) {
    var props = st.listings().filter(function (p) { return p.category === 'rent'; });
    var panel = ES.open('modal', ES.head('Maintenance request') + '<form class="ovl__body" id="mf" novalidate><div class="g2">' + ES.field('Property *', ES.select('propertyId', props.map(function (p) { return { v: p.id, l: p.title }; }), pid || props[0].id), '', 'span2') + ES.field('Issue *', '<input name="title" placeholder="e.g. Water heater not working" autofocus>', '', 'span2') + ES.field('Priority', ES.select('priority', ['low', 'medium', 'high'], 'medium')) + ES.field('Vendor', ES.select('vendorId', [{ v: '', l: 'Unassigned' }].concat(st.s.contacts.filter(function (c) { return c.types.indexOf('vendor') > -1; }).map(function (c) { return { v: c.id, l: c.name }; })), '')) + '</div></form><div class="ovl__foot"><button class="btn" data-close>Cancel</button><button class="btn btn--dark" id="mSave">Log request</button></div>', { label: 'Maintenance request' });
    panel.querySelector('#mSave').onclick = function () { var d = ES.formData(panel.querySelector('#mf')); if (ES.try(function () { st.saveMaintenance(d); }, 'Request logged')) { ES.close(); ES.app.go('#/rentals/maintenance'); } };
  }
  function appModal() {
    var props = st.listings().filter(function (p) { return p.category === 'rent' && p.status === 'active'; });
    var panel = ES.open('modal', ES.head('Rental application', 'Synthetic applicant details for the demo') + '<form class="ovl__body" id="af" novalidate><div class="g2">' + ES.field('Applicant name *', '<input name="name" autofocus>') + ES.field('Phone', '<input name="phone" type="tel">') + ES.field('Property *', ES.select('propertyId', props.map(function (p) { return { v: p.id, l: p.title + ' — ' + f.money(p.price) + '/mo' }; }), props[0] && props[0].id), '', 'span2') + ES.field('Monthly income (KES)', '<input name="income" data-num inputmode="numeric">') + ES.field('Move-in date', '<input type="date" name="moveIn" value="' + new Date(Date.now() + 21 * DAY).toISOString().slice(0, 10) + '">') + '</div></form><div class="ovl__foot"><button class="btn" data-close>Cancel</button><button class="btn btn--dark" id="aSave">Add application</button></div>', { label: 'Rental application' });
    panel.querySelector('#aSave').onclick = function () { var d = ES.formData(panel.querySelector('#af')); d.moveIn = new Date(d.moveIn + 'T09:00').toISOString(); if (ES.try(function () { st.saveApplication(d); }, 'Application added')) { ES.close(); ES.app.go('#/rentals/applications'); } };
  }

  /* ======================= CALENDAR ======================= */
  var TYPES = { viewing: 'Property viewing', meeting: 'Client meeting', call: 'Follow-up call', deadline: 'Offer deadline', milestone: 'Contract milestone', renewal: 'Lease renewal', task: 'Agent task' };
  var TICON = { viewing: 'eye', meeting: 'users', call: 'phone', deadline: 'flag', milestone: 'file', renewal: 'refresh', task: 'task' };
  var C = ES.ui.cal;
  function agItem(e) {
    var p = e.propertyId ? st.prop(e.propertyId) : null, c = e.contactId ? st.contact(e.contactId) : null, u = st.user(e.agentId);
    return '<button class="ag' + (e.status !== 'scheduled' ? ' is-done' : '') + '" data-ev="' + e.id + '"><span class="ag__t">' + f.time(e.start) + '<span class="t-sub">' + f.day(e.start) + '</span></span><span class="ce ce--' + e.type + '" style="width:auto;flex-shrink:0">' + I(TICON[e.type] || 'cal', 12) + '</span><span class="ag__b"><b>' + esc(e.title) + '</b><em>' + TYPES[e.type] + (c ? ' · ' + esc(c.name) : '') + (p ? ' · ' + esc(p.area) : '') + (e.status === 'cancelled' ? ' · cancelled' : e.status === 'done' ? ' · done' : '') + '</em></span>' + ES.av(u, 26) + '</button>';
  }
  ES.pages.calendar = {
    agItem: agItem,
    render: function (v) {
      if (!C.cursor) C.cursor = new Date().toISOString();
      if (innerWidth < 640 && !C.userView) C.view = 'agenda';
      var cur = new Date(C.cursor), E = st.s.events.filter(function (e) { return (!C.agent || e.agentId === C.agent) && (!C.type || e.type === C.type); });
      var head = '<header class="ph"><h1>Calendar</h1><span class="seg"><button data-c="v" data-v="month" class="' + (C.view === 'month' ? 'is-on' : '') + '">Month</button><button data-c="v" data-v="agenda" class="' + (C.view === 'agenda' ? 'is-on' : '') + '">Agenda</button></span>' +
        '<div class="ph__a"><select class="sel" data-cf="agent" aria-label="Agent"><option value="">Everyone</option>' + st.s.team.map(function (u) { return '<option value="' + u.id + '"' + (C.agent === u.id ? ' selected' : '') + '>' + u.name + '</option>'; }).join('') + '</select><select class="sel" data-cf="type" aria-label="Type"><option value="">All types</option>' + Object.keys(TYPES).map(function (k) { return '<option value="' + k + '"' + (C.type === k ? ' selected' : '') + '>' + TYPES[k] + '</option>'; }).join('') + '</select><button class="btn btn--dark" data-c="new">' + I('plus', 15) + 'Schedule</button></div></header>';
      var body = '';
      if (C.view === 'month') {
        var first = new Date(cur.getFullYear(), cur.getMonth(), 1), start = new Date(first); start.setDate(1 - ((first.getDay() + 6) % 7));
        var today = new Date().toDateString(), cells = '';
        for (var i = 0; i < 42; i++) {
          var d = new Date(start); d.setDate(start.getDate() + i);
          var de = E.filter(function (e) { return new Date(e.start).toDateString() === d.toDateString(); }).sort(function (a, b) { return new Date(a.start) - new Date(b.start); });
          cells += '<div class="calm__d' + (d.getMonth() !== cur.getMonth() ? ' is-out' : '') + (d.toDateString() === today ? ' is-today' : '') + '"><span class="calm__n">' + d.getDate() + '</span>' + de.slice(0, 3).map(function (e) { return '<button class="ce ce--' + e.type + (e.status !== 'scheduled' ? ' is-' + e.status : '') + '" data-ev="' + e.id + '" title="' + esc(f.time(e.start) + ' ' + e.title) + '">' + I(TICON[e.type], 11) + '<span>' + f.time(e.start).replace(':00', '') + ' ' + esc(e.title.replace(/^Viewing — /, '')) + '</span></button>'; }).join('') + (de.length > 3 ? '<button class="calm__more" data-day="' + d.toISOString() + '">+' + (de.length - 3) + ' more</button>' : '') + '</div>';
        }
        body = '<div class="tb"><button class="ib ib--card ib--round" data-c="prev" aria-label="Previous month">' + I('left', 16) + '</button><button class="ib ib--card ib--round" data-c="next" aria-label="Next month">' + I('right', 16) + '</button><h2 style="font-size:18px;font-weight:650">' + ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][cur.getMonth()] + ' ' + cur.getFullYear() + '</h2><button class="btn btn--sm" data-c="today">Today</button><span class="tb__sp"></span><div class="legend">' + Object.keys(TYPES).map(function (k) { return '<span><span class="ce ce--' + k + '" style="width:12px;height:12px;padding:0"></span>' + TYPES[k] + '</span>'; }).join('') + '</div></div>' +
          '<div class="calm"><div class="calm__h">' + ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(function (d) { return '<span>' + d + '</span>'; }).join('') + '</div><div class="calm__g">' + cells + '</div></div>';
      } else {
        var from = new Date(); from.setHours(0, 0, 0, 0);
        var up = E.filter(function (e) { var t = new Date(e.start); return t >= from && t < from.getTime() + 21 * DAY; }).sort(function (a, b) { return new Date(a.start) - new Date(b.start); });
        var groups = {}; up.forEach(function (e) { var k = new Date(e.start).toDateString(); (groups[k] = groups[k] || []).push(e); });
        body = Object.keys(groups).length ? '<div class="agenda">' + Object.keys(groups).map(function (k) { return '<div class="agenda__d"><h3>' + f.day(k) + (f.day(k) !== f.date(k) ? ' · ' + f.date(k) : '') + '</h3>' + groups[k].map(agItem).join('') + '</div>'; }).join('') + '</div>' : ES.empty('cal', 'Nothing in the next three weeks', 'Schedule a viewing or follow-up.');
        body = '<p class="muted" style="font-size:12.5px;margin-bottom:12px">Next 21 days · ' + up.length + ' events</p>' + body;
      }
      v.innerHTML = head + body + '<p class="pr__note" style="margin-top:14px">' + I('info', 12) + 'Events live in Reside Ke only — the demo is not connected to Google or Outlook calendars.</p>';
      v.onchange = function (e) { var k = e.target.dataset.cf; if (k) { C[k] = e.target.value; ES.app.refresh(); } };
      v.onclick = function (e) {
        var b = e.target.closest('[data-c]'), ev = e.target.closest('[data-ev]'), more = e.target.closest('[data-day]');
        if (ev) { open(ev.dataset.ev); return; }
        if (more) { C.view = 'agenda'; C.userView = true; ES.app.refresh(); return; }
        if (!b) return; var k = b.dataset.c, c2 = new Date(C.cursor);
        if (k === 'v') { C.view = b.dataset.v; C.userView = true; }
        if (k === 'prev') C.cursor = new Date(c2.getFullYear(), c2.getMonth() - 1, 1).toISOString();
        if (k === 'next') C.cursor = new Date(c2.getFullYear(), c2.getMonth() + 1, 1).toISOString();
        if (k === 'today') C.cursor = new Date().toISOString();
        if (k === 'new') { edit(); return; }
        ES.app.refresh();
      };
    },
    open: open, edit: edit
  };
  function open(id) {
    var e = st.event(id); if (!e) return;
    var p = e.propertyId ? st.prop(e.propertyId) : null, c = e.contactId ? st.contact(e.contactId) : null, u = st.user(e.agentId);
    var panel = ES.open('drawer', ES.head(e.title, TYPES[e.type] + ' · ' + f.dt(e.start) + (e.duration ? ' · ' + e.duration + ' min' : '')) + '<div class="ovl__body">' +
      (e.status !== 'scheduled' ? '<p style="margin-bottom:12px">' + ES.pill(e.status === 'done' ? 'Completed' : 'Cancelled', e.status === 'done' ? 'green' : 'grey') + '</p>' : '') +
      (p ? '<a class="mini__i" href="#/property/' + p.id + '" style="border:1px solid var(--line);border-radius:12px;padding:10px;margin-bottom:14px"><img src="' + p.images[0] + '" alt="" style="width:64px;height:46px;border-radius:8px;object-fit:cover"><span class="grow"><b>' + esc(p.title) + '</b><em>' + esc(p.address) + '</em></span>' + I('right', 14) + '</a>' : '') +
      '<dl class="kv"><dt>When</dt><dd>' + f.dt(e.start) + '</dd><dt>Agent</dt><dd><span class="t-who">' + ES.av(u, 22) + esc(u.name) + '</span></dd>' + (c ? '<dt>Contact</dt><dd><a class="lnk" href="#/contact/' + c.id + '">' + esc(c.name) + '</a> · ' + esc(c.phone) + '</dd>' : '') + '<dt>Notes</dt><dd>' + esc(e.notes || '—') + '</dd></dl></div>' +
      '<div class="ovl__foot">' + (e.status === 'scheduled' ? '<button class="btn" data-ex="cancelled">' + I('x', 14) + 'Cancel event</button><span style="flex:1"></span><button class="btn" data-ex="edit">' + I('edit', 14) + 'Edit</button><button class="btn btn--ok" data-ex="done">' + I('check', 14) + 'Mark done</button>' : '<button class="btn" data-ex="scheduled">' + I('refresh', 14) + 'Reopen</button>') + '</div>', { label: e.title });
    panel.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-ex]'); if (!b) return; var k = b.dataset.ex;
      if (k === 'edit') { ES.close(); setTimeout(function () { edit(id); }, 240); return; }
      if (k === 'cancelled') { ES.close(); setTimeout(function () { ES.confirm({ title: 'Cancel this event?', icon: 'x', tone: 'red', ok: 'Cancel event', text: 'It stays on the calendar as cancelled. Nobody is notified in the demo.', onOk: function () { ES.try(function () { st.setEventStatus(id, 'cancelled'); }, 'Event cancelled'); } }); }, 240); return; }
      ES.try(function () { st.setEventStatus(id, k); }, k === 'done' ? 'Marked as done' : 'Event reopened'); ES.close();
    });
  }
  function edit(id, pre) {
    var e = id ? st.event(id) : Object.assign({ type: 'viewing', title: '', start: new Date(Math.ceil(Date.now() / 36e5) * 36e5 + DAY).toISOString(), duration: 45, propertyId: '', contactId: '', agentId: ES.config.userId, notes: '' }, pre || {});
    var props = st.listings(), contacts = st.s.contacts.slice().sort(function (a, b) { return a.name.localeCompare(b.name); });
    var panel = ES.open('modal', ES.head(id ? 'Edit event' : 'Schedule', 'Viewings, meetings, calls, deadlines and renewals') + '<form class="ovl__body" id="evf" novalidate><div class="g2">' +
      ES.field('Type', ES.select('type', Object.keys(TYPES).map(function (k) { return { v: k, l: TYPES[k] }; }), e.type)) +
      ES.field('Date & time *', '<input type="datetime-local" name="start" value="' + ES.localInput(e.start) + '">') +
      ES.field('Title *', '<input name="title" value="' + esc(e.title) + '" placeholder="Filled in from the property if left blank">', '', 'span2') +
      ES.field('Property', ES.select('propertyId', [{ v: '', l: 'None' }].concat(props.map(function (p) { return { v: p.id, l: p.title }; })), e.propertyId || '')) +
      ES.field('Contact', ES.select('contactId', [{ v: '', l: 'None' }].concat(contacts.map(function (c) { return { v: c.id, l: c.name }; })), e.contactId || '')) +
      ES.field('Agent', ES.select('agentId', st.s.team.map(function (u) { return { v: u.id, l: u.name }; }), e.agentId)) +
      ES.field('Duration', ES.select('duration', [{ v: 0, l: 'All-day / deadline' }, { v: 15, l: '15 min' }, { v: 30, l: '30 min' }, { v: 45, l: '45 min' }, { v: 60, l: '1 hour' }, { v: 90, l: '1.5 hours' }], e.duration)) +
      ES.field('Notes', '<textarea name="notes" placeholder="Access codes, what to prepare…">' + esc(e.notes || '') + '</textarea>', '', 'span2') +
      '</div></form><div class="ovl__foot"><button class="btn" data-close>Cancel</button><button class="btn btn--dark" id="evSave">' + I('check', 15) + (id ? 'Save' : 'Schedule') + '</button></div>', { label: 'Schedule' });
    var fm = panel.querySelector('#evf');
    panel.querySelector('#evSave').onclick = function () {
      var d = ES.formData(fm); d.duration = +d.duration;
      if (!d.title) { var p = d.propertyId ? st.prop(d.propertyId) : null, c = d.contactId ? st.contact(d.contactId) : null; d.title = d.type === 'viewing' && p ? 'Viewing — ' + p.title : TYPES[d.type] + (c ? ' — ' + c.name : p ? ' — ' + p.title : ''); }
      d.start = d.start ? new Date(d.start).toISOString() : '';
      if (!d.propertyId) d.propertyId = null; if (!d.contactId) d.contactId = null;
      if (d.start && new Date(d.start) < Date.now() - 6e4 && !id) { ES.toast('That time is in the past — pick a future date', 'err'); return; }
      if (ES.try(function () { st.saveEvent(d, id); }, id ? 'Event updated' : 'Scheduled for ' + f.dt(d.start))) ES.close();
    };
  }

  /* ======================= TASKS ======================= */
  ES.pages.tasks = {
    render: function (v) {
      var now = Date.now(), sod = new Date(); sod.setHours(0, 0, 0, 0); var eod = sod.getTime() + DAY;
      var T = st.s.events.filter(function (e) { return (e.type === 'task' || e.type === 'call' || e.type === 'deadline') && e.status !== 'cancelled' && (e.status === 'scheduled' || now - new Date(e.start) < 7 * DAY); });
      var leads = st.s.leads.filter(function (l) { return l.nextFollowUp && l.status !== 'converted' && l.status !== 'lost' && !st.s.events.some(function (e) { return e.leadId === l.id && e.status === 'scheduled'; }); });
      var items = T.map(function (e) { return { kind: 'ev', id: e.id, title: e.title, at: e.start, done: e.status === 'done', sub: (e.propertyId ? st.prop(e.propertyId).title + ' · ' : '') + st.user(e.agentId).name, type: e.type }; })
        .concat(leads.map(function (l) { return { kind: 'lead', id: l.id, title: 'Follow up ' + l.name, at: l.nextFollowUp, done: false, sub: (l.propertyId ? st.prop(l.propertyId).title + ' · ' : '') + st.user(l.agentId).name, type: 'call' }; }));
      var groups = [['Overdue', items.filter(function (x) { return !x.done && new Date(x.at) < sod; })], ['Today', items.filter(function (x) { return !x.done && new Date(x.at) >= sod && new Date(x.at) < eod; })], ['Upcoming', items.filter(function (x) { return !x.done && new Date(x.at) >= eod; })], ['Done · last 7 days', items.filter(function (x) { return x.done; })]];
      v.innerHTML = '<header class="ph"><h1>Tasks & follow-ups</h1><div class="ph__k">' + kq('alert', '<span style="color:' + (groups[0][1].length ? 'var(--red)' : 'inherit') + '">' + groups[0][1].length + '</span>', 'Overdue') + kq('task', groups[1][1].length, 'Due today') + kq('cal', groups[2][1].length, 'Upcoming') + kq('check', groups[3][1].length, 'Done this week') + '</div><div class="ph__a"><button class="btn btn--dark" data-t="new">' + I('plus', 15) + 'New task</button></div></header>' +
        groups.map(function (g) { g[1].sort(function (a, b) { return new Date(a.at) - new Date(b.at); }); return g[1].length ? '<article class="card" style="margin-bottom:14px;padding:6px 8px"><header class="card__h" style="padding:8px 8px 0;margin-bottom:4px"><span class="card__t">' + g[0] + ' <span class="pill pill--grey">' + g[1].length + '</span></span></header>' + g[1].map(function (x) { var od = !x.done && new Date(x.at) < sod; return '<div class="task' + (x.done ? ' is-done' : '') + '"><button class="task__ck" data-t="ck" data-k="' + x.kind + '" data-id="' + x.id + '" aria-label="' + (x.done ? 'Mark not done' : 'Mark done') + '">' + I('check', 13) + '</button><span class="ce ce--' + x.type + '" style="width:auto">' + I(TICON[x.type], 12) + '</span><button class="task__t" style="text-align:left" data-t="open" data-k="' + x.kind + '" data-id="' + x.id + '"><b>' + esc(x.title) + '</b><em>' + esc(x.sub) + '</em></button><span class="task__w' + (od ? ' is-od' : '') + '">' + f.day(x.at) + ' · ' + f.time(x.at) + '</span></div>'; }).join('') + '</article>' : ''; }).join('');
      v.onclick = function (e) {
        var b = e.target.closest('[data-t]'); if (!b) return; var k = b.dataset.t;
        if (k === 'new') edit(null, { type: 'task' });
        if (k === 'open') { if (b.dataset.k === 'lead') ES.pages.leads.open(b.dataset.id); else open(b.dataset.id); }
        if (k === 'ck') { if (b.dataset.k === 'lead') { ES.pages.leads.open(b.dataset.id); ES.toast('Log the contact or schedule the next follow-up', 'info'); } else { var ev = st.event(b.dataset.id); ES.try(function () { st.setEventStatus(ev.id, ev.status === 'done' ? 'scheduled' : 'done'); }, ev.status === 'done' ? 'Task reopened' : 'Task completed'); } }
      };
    }
  };

  /* ======================= DOCUMENTS ======================= */
  var DU = { kind: '', q: '' };
  function docTable(D) {
    return '<div class="t-wrap"><table class="t"><thead><tr><th>Document</th><th>Type</th><th>Property</th><th>Status</th><th class="r">Size</th><th>Added by</th><th>Date</th></tr></thead><tbody>' + D.map(function (d) { var p = d.propertyId ? st.prop(d.propertyId) : null, u = st.user(d.by); return '<tr data-docid="' + d.id + '" style="cursor:pointer"><td><span class="t-who"><span class="doc-ic doc-ic--' + d.kind + '">' + I(d.kind === 'photos' ? 'image' : 'file', 15) + '</span><b style="white-space:normal">' + esc(d.name) + '</b></span></td><td>' + ES.DOC_KINDS[d.kind] + '</td><td>' + (p ? esc(p.title) : '—') + '</td><td>' + ES.pill(d.status, { signed: 'green', final: 'blue', draft: 'grey', sent: 'amber', received: 'violet' }[d.status] || 'grey') + '</td><td class="r num">' + (d.size >= 1024 ? (d.size / 1024).toFixed(1) + ' MB' : d.size + ' KB') + '</td><td><span class="t-who">' + ES.av(u, 22) + esc(u.name.split(' ')[0]) + '</span></td><td>' + f.date(d.at) + '</td></tr>'; }).join('') + '</tbody></table></div>';
  }
  ES.pages.documents = {
    table: docTable,
    render: function (v) {
      var q = DU.q.toLowerCase(), D = st.s.docs.filter(function (d) { return (!DU.kind || d.kind === DU.kind) && (!q || d.name.toLowerCase().indexOf(q) > -1); });
      v.innerHTML = '<header class="ph"><h1>Documents</h1><div class="ph__k">' + kq('file', st.s.docs.length, 'Documents') + kq('check', st.s.docs.filter(function (d) { return d.status === 'signed'; }).length, 'Signed') + kq('clock', st.s.docs.filter(function (d) { return d.status === 'sent' || d.status === 'draft'; }).length, 'Awaiting signature') + '</div><div class="ph__a"><button class="btn btn--dark" data-dc="up">' + I('upload', 15) + 'Add document</button></div></header>' +
        '<div class="tb"><label class="tb__s">' + I('search', 15) + '<input type="search" id="dq" placeholder="Search documents" value="' + esc(DU.q) + '" aria-label="Search documents"></label><select id="dk" aria-label="Type"><option value="">All types</option>' + Object.keys(ES.DOC_KINDS).map(function (k) { return '<option value="' + k + '"' + (DU.kind === k ? ' selected' : '') + '>' + ES.DOC_KINDS[k] + '</option>'; }).join('') + '</select></div>' +
        '<p class="muted" style="font-size:12.5px;margin-bottom:10px">' + I('info', 12) + ' Demo documents are mock records — file contents aren’t stored. Production uses secure storage with access controls.</p>' +
        (D.length ? docTable(D) : ES.empty('file', 'No documents match', ''));
      v.querySelector('#dq').oninput = function (e) { DU.q = e.target.value; clearTimeout(v._t); v._t = setTimeout(function () { ES.app.refresh(); var i = v.querySelector('#dq'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 180); };
      v.querySelector('#dk').onchange = function (e) { DU.kind = e.target.value; ES.app.refresh(); };
      v.onclick = function (e) { if (e.target.closest('[data-dc=up]')) upload({}); var r = e.target.closest('[data-docid]'); if (r) openDoc(r.dataset.docid); };
    },
    upload: upload, open: openDoc
  };
  function upload(pre) {
    var panel = ES.open('modal', ES.head('Add document', 'PDF, Word, images or ZIP · up to 25 MB') + '<form class="ovl__body" id="upf" novalidate><label class="drop" id="dz">' + I('upload', 22) + '<b id="dzT">Choose a file or drop it here</b><span>Only the file name and size are kept in the demo</span><input type="file" hidden id="dzF" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.zip"></label><div class="g2" style="margin-top:14px">' +
      ES.field('Document type', ES.select('kind', Object.keys(ES.DOC_KINDS).map(function (k) { return { v: k, l: ES.DOC_KINDS[k] }; }), 'listing')) +
      ES.field('Property', ES.select('propertyId', [{ v: '', l: 'None' }].concat(st.listings().map(function (p) { return { v: p.id, l: p.title }; })), pre.propertyId || '')) +
      ES.field('Status', ES.select('status', ['draft', 'sent', 'signed', 'final'], 'final')) + '</div></form><div class="ovl__foot"><button class="btn" data-close>Cancel</button><button class="btn btn--dark" id="upSave">Add document</button></div>', { label: 'Add document' });
    var file = null, dz = panel.querySelector('#dz');
    function pick(fl) { file = fl; panel.querySelector('#dzT').textContent = fl.name + ' · ' + (fl.size / 1048576).toFixed(2) + ' MB'; }
    panel.querySelector('#dzF').onchange = function (e) { if (e.target.files[0]) pick(e.target.files[0]); };
    dz.addEventListener('dragover', function (e) { e.preventDefault(); dz.classList.add('is-over'); });
    dz.addEventListener('dragleave', function () { dz.classList.remove('is-over'); });
    dz.addEventListener('drop', function (e) { e.preventDefault(); dz.classList.remove('is-over'); if (e.dataTransfer.files[0]) pick(e.dataTransfer.files[0]); });
    panel.querySelector('#upSave').onclick = function () {
      var d = ES.formData(panel.querySelector('#upf'));
      if (ES.try(function () { st.addDoc({ name: file ? file.name : '', size: file ? Math.max(1, Math.round(file.size / 1024)) : 0, kind: d.kind, propertyId: d.propertyId || null, dealId: pre.dealId || null, status: d.status }); }, 'Document added')) ES.close();
    };
  }
  function openDoc(id) {
    var d = st.s.docs.filter(function (x) { return x.id === id; })[0]; if (!d) return;
    var p = d.propertyId ? st.prop(d.propertyId) : null;
    var panel = ES.open('drawer', ES.head(d.name, ES.DOC_KINDS[d.kind]) + '<div class="ovl__body"><div class="drop" style="cursor:default;margin-bottom:16px">' + I('file', 26) + '<b>Sample record</b><span>File contents aren’t stored in the demo. This is not a real legal document.</span></div><dl class="kv"><dt>Status</dt><dd>' + d.status + '</dd><dt>Size</dt><dd>' + (d.size >= 1024 ? (d.size / 1024).toFixed(1) + ' MB' : d.size + ' KB') + '</dd><dt>Property</dt><dd>' + (p ? '<a class="lnk" href="#/property/' + p.id + '">' + esc(p.title) + '</a>' : '—') + '</dd>' + (d.dealId ? '<dt>Deal</dt><dd><a class="lnk" href="#/deal/' + d.dealId + '">' + (st.deal(d.dealId) || {}).ref + '</a></dd>' : '') + '<dt>Added</dt><dd>' + f.dt(d.at) + ' by ' + esc(st.user(d.by).name) + '</dd></dl></div><div class="ovl__foot"><button class="btn btn--danger" data-dz="rm">' + I('trash', 14) + 'Remove</button></div>', { label: d.name });
    panel.addEventListener('click', function (e) { if (e.target.closest('[data-dz=rm]')) { ES.close(); setTimeout(function () { ES.confirm({ title: 'Remove this document?', icon: 'trash', tone: 'red', ok: 'Remove', text: d.name + ' will be removed from Reside Ke.', onOk: function () { ES.try(function () { st.removeDoc(id); }, 'Document removed'); } }); }, 240); } });
  }

  /* ======================= TEAM ======================= */
  ES.pages.team = {
    render: function (v) {
      var yr = 365 * DAY, target = st.s.settings.monthlyTarget / 5;
      v.innerHTML = '<header class="ph"><h1>Team</h1><div class="ph__k">' + kq('users', st.s.team.length, 'Agents') + kq('chat', st.s.team.filter(function (u) { return u.online; }).length, 'Online now') + '</div></header><div class="g-cards">' + st.s.team.map(function (u) {
        var L = st.listings().filter(function (p) { return p.agentId === u.id && (p.status === 'active' || p.status === 'under_offer'); }), D = st.openDeals().filter(function (d) { return d.agentId === u.id; });
        var won = st.wonDeals().filter(function (d) { return d.agentId === u.id && Date.now() - new Date(d.closedAt) < yr; }), comm = won.reduce(function (a, d) { return a + st.commission(d); }, 0);
        var month = st.commissionSeries(1, u.id)[0].value, tasks = st.s.events.filter(function (e) { return e.agentId === u.id && e.status === 'scheduled' && new Date(e.start) > Date.now() - 3600e3; }).sort(function (a, b) { return new Date(a.start) - new Date(b.start); });
        return '<article class="card agent"><div class="agent__h">' + ES.av(u, 52, u.online ? 'is-online' : '') + '<span><b>' + esc(u.name) + '</b><em>' + esc(u.role) + ' · ' + (u.online ? 'Online' : 'Away') + '</em></span></div>' +
          '<div class="agent__s"><div><span>Listings</span><b>' + L.length + '</b></div><div><span>Open deals</span><b>' + D.length + '</b></div><div><span>Closed · 12m</span><b>' + won.length + '</b></div></div>' +
          '<div><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px"><span class="muted">Commission · 12 months</span><b>' + f.money(comm, true) + '</b></div><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px"><span class="muted">This month vs ' + f.money(target, true) + '</span><b>' + Math.round(month / target * 100) + '%</b></div><div class="prog"><i style="width:' + Math.min(100, month / target * 100) + '%"></i></div></div>' +
          '<div class="mini">' + (tasks.slice(0, 2).map(function (e) { return '<div class="mini__i" style="padding:6px 0"><span class="ce ce--' + e.type + '" style="width:auto">' + I(TICON[e.type], 11) + '</span><span class="grow"><b style="font-size:12px">' + esc(e.title) + '</b><em>' + f.dt(e.start) + '</em></span></div>'; }).join('') || '<p class="muted" style="font-size:12px">No upcoming tasks.</p>') + '</div>' +
          '<div style="display:flex;gap:6px"><a class="btn btn--sm" href="tel:' + u.phone.replace(/\s/g, '') + '">' + I('phone', 13) + 'Call</a><button class="btn btn--sm" data-tm="chat" data-u="' + u.id + '"' + (u.id === ES.config.userId ? ' disabled' : '') + '>' + I('chat', 13) + 'Message</button><button class="btn btn--sm" data-tm="deals" data-u="' + u.id + '">' + I('board', 13) + 'Deals</button></div></article>';
      }).join('') + '</div>';
      v.onclick = function (e) { var b = e.target.closest('[data-tm]'); if (!b) return; if (b.dataset.tm === 'deals') { ES.ui.deals.agent = b.dataset.u; ES.app.go('#/deals'); } else { var cv = st.s.convs.filter(function (c) { return c.userId === b.dataset.u; })[0]; if (!cv) { cv = { id: 'cv' + b.dataset.u, kind: 'dm', userId: b.dataset.u, unread: 0 }; st.s.convs.push(cv); } ES.ui.chat.conv = cv.id; if (innerWidth > 1180) { ES.ui.chat.open = true; document.documentElement.classList.remove('is-chat-off'); ES.app.refresh(); setTimeout(function () { var i = document.querySelector('.chat__f input'); if (i) i.focus(); }, 80); } else ES.app.go('#/chat'); } };
    }
  };

  /* ======================= ANALYTICS ======================= */
  var AU = { months: 12 };
  ES.pages.analytics = {
    redrawOnResize: true,
    render: function (v) {
      var n = AU.months, since = new Date(new Date().getFullYear(), new Date().getMonth() - n + 1, 1).getTime();
      var leads = st.s.leads, L = st.listings(), active = L.filter(function (p) { return p.status === 'active' || p.status === 'under_offer'; });
      var won = st.wonDeals().filter(function (d) { return new Date(d.closedAt) >= since; }), lost = st.s.deals.filter(function (d) { return d.stage === 'lost' && new Date(d.closedAt) >= since; });
      var offers = []; st.s.deals.forEach(function (d) { d.offers.forEach(function (o) { if (new Date(o.at) >= since) offers.push(o); }); });
      var soldDom = won.filter(function (d) { return d.kind === 'sale'; }).map(function (d) { var p = st.prop(d.propertyId); return Math.max(1, Math.round((new Date(d.closedAt) - new Date(p.listedAt)) / DAY)); });
      var conv = leads.filter(function (l) { return l.status === 'converted'; }).length, lostL = leads.filter(function (l) { return l.status === 'lost'; }).length;
      var series = st.commissionSeries(n);
      // funnel
      var order = ['new', 'contacted', 'qualified', 'viewing', 'negotiating', 'converted'];
      var reached = order.map(function (s, i) { return { s: s, n: leads.filter(function (l) { var k = order.indexOf(l.status); return l.status !== 'lost' ? k >= i : false; }).length }; });
      // dom by type
      var byType = {}; active.forEach(function (p) { (byType[p.type] = byType[p.type] || []).push(st.daysOnMarket(p)); });
      var types = {}; active.forEach(function (p) { types[p.type] = (types[p.type] || 0) + 1; });
      var pal = ['#2F5BEA', '#1F9D6A', '#F59E0B', '#7C8CF8', '#0F1729', '#38BDF8'];
      var rent = L.filter(function (p) { return p.category === 'rent'; }), occ = rent.filter(function (p) { return p.status === 'let'; }).length;
      var exp = st.s.leases.filter(function (l) { return l.status === 'active'; }).sort(function (a, b) { return new Date(a.end) - new Date(b.end); });
      var src = {}; leads.forEach(function (l) { src[l.source] = (src[l.source] || 0) + 1; });
      var perf = active.map(function (p) { return { p: p, leads: st.leadsFor(p.id).length, views: st.eventsFor(p.id).filter(function (e) { return e.type === 'viewing'; }).length, offers: st.dealsFor(p.id).reduce(function (a, d) { return a + d.offers.length; }, 0) }; }).sort(function (a, b) { return b.p.views - a.p.views; });
      var agents = st.s.team.map(function (u) { var w = won.filter(function (d) { return d.agentId === u.id; }), ld = leads.filter(function (l) { return l.agentId === u.id; }), c = ld.filter(function (l) { return l.status === 'converted'; }).length; return { u: u, listings: L.filter(function (p) { return p.agentId === u.id && p.status === 'active'; }).length, open: st.openDeals().filter(function (d) { return d.agentId === u.id; }).length, won: w.length, value: w.reduce(function (a, d) { return a + d.value; }, 0), comm: w.reduce(function (a, d) { return a + st.commission(d); }, 0), conv: ld.length ? Math.round(c / ld.length * 100) : 0 }; }).sort(function (a, b) { return b.comm - a.comm; });
      var stages = ES.STAGES.filter(function (s) { return s.id !== 'won' && s.id !== 'lost'; });
      v.innerHTML = '<header class="ph"><h1>Analytics</h1><span class="seg">' + [3, 6, 12].map(function (m) { return '<button data-a="m" data-v="' + m + '" class="' + (n === m ? 'is-on' : '') + '">' + m + 'M</button>'; }).join('') + '</span><div class="ph__a"><button class="btn" data-a="csv1">' + I('download', 15) + 'Listing report</button><button class="btn" data-a="csv2">' + I('download', 15) + 'Agent report</button></div></header>' +
        '<div class="kgrid" style="grid-template-columns:repeat(6,minmax(0,1fr))">' + [['Enquiries', leads.length, 'Leads on record'], ['Lead conversion', (conv + lostL ? Math.round(conv / (conv + lostL) * 100) : 0) + '%', conv + ' converted · ' + lostL + ' lost'], ['Avg. days to sell', soldDom.length ? Math.round(soldDom.reduce(function (a, b) { return a + b; }, 0) / soldDom.length) : '—', 'Sales closed in period'], ['Offers submitted', offers.length, 'In period'], ['Deals closed', won.length, f.money(won.reduce(function (a, d) { return a + d.value; }, 0), true) + ' value'], ['Pipeline value', f.money(st.openDeals().reduce(function (a, d) { return a + d.value; }, 0), true), st.openDeals().length + ' open deals']].map(function (k) { return '<article class="card stat"><span>' + k[0] + '</span><b>' + k[1] + '</b><em>' + k[2] + '</em></article>'; }).join('') + '</div>' +
        '<div class="two"><article class="card"><header class="card__h"><span class="card__t">' + I('trophy', 16) + 'Deals closed per month</span></header><div id="anDeals"></div></article><article class="card"><header class="card__h"><span class="card__t">' + I('trend', 16) + 'Commission performance</span></header><div id="anComm"></div></article></div>' +
        '<div class="three"><article class="card"><header class="card__h"><span class="card__t">' + I('user', 16) + 'Lead conversion funnel</span></header><div class="funnel">' + reached.map(function (r, i) { return '<div><span>' + ES.LEAD_STATUS.filter(function (s) { return s.id === r.s; })[0].name + '</span><i style="width:' + Math.max(8, r.n / Math.max(1, reached[0].n) * 100) + '%;opacity:' + (1 - i * .12) + '">' + r.n + '</i></div>'; }).join('') + '</div></article>' +
        '<article class="card"><header class="card__h"><span class="card__t">' + I('chat', 16) + 'Enquiries by source</span></header>' + ES.chart.hbars(Object.keys(src).sort(function (a, b) { return src[b] - src[a]; }).map(function (k) { return { label: k, value: src[k], color: 'var(--violet)' }; })) + '</article>' +
        '<article class="card"><header class="card__h"><span class="card__t">' + I('clock', 16) + 'Days on market by type</span></header>' + ES.chart.hbars(Object.keys(byType).map(function (k) { return { label: k, value: Math.round(byType[k].reduce(function (a, b) { return a + b; }, 0) / byType[k].length), sub: byType[k].length + ' live' }; }).sort(function (a, b) { return b.value - a.value; }), { vfmt: function (x) { return x + ' days'; } }) + '</article></div>' +
        '<div class="three"><article class="card"><header class="card__h"><span class="card__t">' + I('building', 16) + 'Live listings by type</span></header><div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">' + ES.chart.donut(Object.keys(types).map(function (k, i) { return { label: k, value: types[k], color: pal[i % pal.length] }; }), { center: active.length, sub: 'live' }) + '<div class="legend" style="flex-direction:column;gap:6px">' + Object.keys(types).map(function (k, i) { return '<span><i class="lg-dot" style="background:' + pal[i % pal.length] + '"></i>' + k + ' · ' + types[k] + '</span>'; }).join('') + '</div></div></article>' +
        '<article class="card"><header class="card__h"><span class="card__t">' + I('key', 16) + 'Rental occupancy</span></header><div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">' + ES.chart.donut([{ label: 'Occupied', value: occ, color: '#1F9D6A' }, { label: 'Available', value: rent.length - occ, color: '#D5DAE5' }], { center: (rent.length ? Math.round(occ / rent.length * 100) : 0) + '%', sub: 'occupied' }) + '<div class="mini" style="flex:1;min-width:150px">' + exp.slice(0, 3).map(function (l) { var p = st.prop(l.propertyId); return '<div class="mini__i"><span class="grow"><b style="font-size:12px">' + esc(p.title) + '</b><em>Ends ' + f.date(l.end) + '</em></span>' + ES.pill(days(l.end) + 'd', days(l.end) <= 60 ? 'amber' : 'grey') + '</div>'; }).join('') + '</div></div></article>' +
        '<article class="card"><header class="card__h"><span class="card__t">' + I('layers', 16) + 'Pipeline value by stage</span></header><div id="anPipe"></div></article></div>' +
        '<article class="card" style="margin-bottom:16px"><header class="card__h"><span class="card__t">' + I('eye', 16) + 'Listing performance</span></header><div class="t-wrap" style="box-shadow:none"><table class="t"><thead><tr><th>Listing</th><th class="r">Views</th><th class="r">Leads</th><th class="r">Viewings</th><th class="r">Offers</th><th class="r">Days listed</th><th class="r">Asking</th></tr></thead><tbody>' + perf.map(function (x) { return '<tr data-href="#/property/' + x.p.id + '"><td><span class="t-prop"><img src="' + x.p.images[0] + '" alt="" loading="lazy"><span><b>' + esc(x.p.title) + '</b><em>' + esc(x.p.area) + '</em></span></span></td><td class="r">' + f.n(x.p.views) + '</td><td class="r">' + x.leads + '</td><td class="r">' + x.views + '</td><td class="r">' + x.offers + '</td><td class="r">' + st.daysOnMarket(x.p) + '</td><td class="r"><b>' + f.money(x.p.price, true) + '</b></td></tr>'; }).join('') + '</tbody></table></div></article>' +
        '<article class="card"><header class="card__h"><span class="card__t">' + I('users', 16) + 'Agent performance · ' + n + ' months</span></header><div class="t-wrap" style="box-shadow:none"><table class="t"><thead><tr><th>Agent</th><th class="r">Active listings</th><th class="r">Open deals</th><th class="r">Closed</th><th class="r">Closed value</th><th class="r">Commission</th><th class="r">Lead conversion</th></tr></thead><tbody>' + agents.map(function (a) { return '<tr><td><span class="t-who">' + ES.av(a.u, 26) + '<span><b>' + esc(a.u.name) + '</b><span class="t-sub">' + esc(a.u.role) + '</span></span></span></td><td class="r">' + a.listings + '</td><td class="r">' + a.open + '</td><td class="r">' + a.won + '</td><td class="r">' + f.money(a.value, true) + '</td><td class="r"><b>' + f.money(a.comm, true) + '</b></td><td class="r">' + a.conv + '%</td></tr>'; }).join('') + '</tbody></table></div></article>';
      ES.chart.vbars(v.querySelector('#anDeals'), { h: 200, labels: series.map(function (x) { return f.mon(x.date); }), values: series.map(function (x) { return x.count; }), color: '#2F5BEA', vfmt: function (x) { return x + ' closed'; }, yfmt: function (x) { return Math.round(x); } });
      ES.chart.line(v.querySelector('#anComm'), { h: 200, labels: series.map(function (x) { return f.mon(x.date); }), series: [{ values: series.map(function (x) { return x.value; }), color: '#1F9D6A', label: 'Commission' }], target: st.s.settings.monthlyTarget, vfmt: function (x) { return f.money(x, true); } });
      ES.chart.vbars(v.querySelector('#anPipe'), { h: 190, labels: stages.map(function (s) { return s.short.split(' ')[0]; }), values: stages.map(function (s) { return st.openDeals().filter(function (d) { return d.stage === s.id; }).reduce(function (a, d) { return a + d.value; }, 0); }), colors: stages.map(function (s) { return s.c; }), vfmt: function (x) { return f.money(x, true); } });
      v.onclick = function (e) {
        var b = e.target.closest('[data-a]'), r = e.target.closest('tr[data-href]');
        if (r) { ES.app.go(r.dataset.href); return; } if (!b) return;
        if (b.dataset.a === 'm') { AU.months = +b.dataset.v; ES.app.refresh(); }
        if (b.dataset.a === 'csv1') ES.csv('reside-ke-listing-performance.csv', [['Ref', 'Listing', 'Area', 'Type', 'Views', 'Leads', 'Viewings', 'Offers', 'Days listed', 'Asking (KES)']].concat(perf.map(function (x) { return [x.p.ref, x.p.title, x.p.area, x.p.type, x.p.views, x.leads, x.views, x.offers, st.daysOnMarket(x.p), x.p.price]; })));
        if (b.dataset.a === 'csv2') ES.csv('reside-ke-agent-performance.csv', [['Agent', 'Role', 'Active listings', 'Open deals', 'Closed', 'Closed value (KES)', 'Commission (KES)', 'Lead conversion %']].concat(agents.map(function (a) { return [a.u.name, a.u.role, a.listings, a.open, a.won, a.value, a.comm, a.conv]; })));
      };
    }
  };

  /* ======================= SETTINGS ======================= */
  ES.pages.settings = {
    static: true,
    render: function (v) {
      var s = st.s.settings;
      v.innerHTML = '<header class="ph"><h1>Settings</h1></header><div class="two" style="align-items:start">' +
        '<form class="card" id="sf" novalidate><header class="card__h"><span class="card__t">' + I('gear', 16) + 'Agency & commission</span></header><div class="g2">' +
        ES.field('Agency name', '<input name="agency" value="' + esc(s.agency) + '">') + ES.field('Currency', '<input value="KES — Kenyan shilling" disabled>', 'Configurable per deployment') +
        ES.field('Sale commission (%)', '<input name="saleRate" data-num type="number" step="0.1" min="0" max="10" value="' + s.saleRate + '">', 'Applies to deals without a custom rate') +
        ES.field('Letting fee (months of rent)', '<input name="rentMonths" data-num type="number" step="0.25" min="0" max="3" value="' + s.rentMonths + '">') +
        ES.field('Team monthly target (KES)', '<input name="monthlyTarget" data-num inputmode="numeric" value="' + s.monthlyTarget + '">', '', 'span2') +
        '</div><div class="form-acts" style="position:static;background:none;padding-bottom:0"><button class="btn btn--dark">' + I('check', 15) + 'Save settings</button></div></form>' +
        '<div class="pd-col"><article class="card"><header class="card__h"><span class="card__t">' + I('refresh', 16) + 'Demo data</span></header><p class="desc" style="font-size:13px">Everything in this demo is sample data stored in your browser (key <code>' + ES.config.storageKey + '</code>). Nothing is sent to a server, and no real clients, payments or messages are involved.</p><div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap"><button class="btn" data-st="json">' + I('download', 14) + 'Export data (JSON)</button><button class="btn btn--danger" data-act="reset">' + I('refresh', 14) + 'Reset demo</button></div></article>' +
        '<article class="card"><header class="card__h"><span class="card__t">' + I('info', 16) + 'In a production deployment</span></header><ul style="margin-left:18px;display:flex;flex-direction:column;gap:7px;color:var(--ink-2);font-size:13px;line-height:1.5"><li>Sign-in with roles (principal, agent, lettings, admin) and per-agency tenancy</li><li>Database with audit history and server-side validation</li><li>Secure document storage with access controls</li><li>Real-time team chat, email/SMS and calendar sync (Google, Outlook)</li><li>M-Pesa / bank reconciliation for rent and commission</li><li>Website & property-portal listing feeds</li></ul><p class="badge-sample" style="margin-top:12px">' + I('info', 12) + 'Not configured in this demo</p></article></div></div>';
      v.querySelector('#sf').onsubmit = function (e) { e.preventDefault(); var d = ES.formData(e.target); ES.try(function () { st.saveSettings(d); }, 'Settings saved'); var a = document.querySelector('.top__agency'); if (a) a.textContent = st.s.settings.agency; };
      v.onclick = function (e) { if (e.target.closest('[data-st=json]')) { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(st.s, null, 2)], { type: 'application/json' })); a.download = 'reside-ke-demo-data.json'; document.body.appendChild(a); a.click(); setTimeout(function () { a.remove(); }, 300); ES.toast('Exported reside-ke-demo-data.json'); } };
    }
  };
})();
