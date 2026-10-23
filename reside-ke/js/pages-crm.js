/* ============================================================
   Reside Ke — Leads & Contacts
   ============================================================ */
(function () {
  'use strict';
  var I = ES.icon, st = ES.store, f = ES.fmt, esc = f.esc, DAY = 864e5;
  var U = ES.ui.leads, CU = ES.ui.contacts;
  var TONE = { new: 'violet', contacted: 'blue', qualified: 'blue', viewing: 'amber', negotiating: 'amber', converted: 'green', lost: 'red' };
  function sname(id) { return ES.LEAD_STATUS.filter(function (s) { return s.id === id; })[0].name; }
  function kq(ic, val, label) { return '<div class="kq"><span class="kq__ic">' + I(ic, 16) + '</span><span class="kq__b"><b>' + val + '</b><em>' + label + '</em></span></div>'; }
  function isToday(d) { var a = new Date(d), b = new Date(); return a.toDateString() === b.toDateString(); }

  /* ======================= LEADS ======================= */
  function leadRow(l) {
    var p = l.propertyId ? st.prop(l.propertyId) : null, u = st.user(l.agentId), od = l.nextFollowUp && new Date(l.nextFollowUp) < Date.now() && l.status !== 'converted' && l.status !== 'lost';
    return '<tr data-lead="' + l.id + '"><td><span class="t-who">' + ES.cav(l, 30) + '<span><b>' + esc(l.name) + '</b><span class="t-sub">' + esc(l.phone || l.email) + '</span></span></span></td>' +
      '<td>' + (p ? '<span class="t-prop" style="min-width:0"><img src="' + p.images[0] + '" alt="" loading="lazy" style="width:44px;height:32px"><span><b style="font-size:12.5px">' + esc(p.title) + '</b><em>' + esc(p.area) + '</em></span></span>' : esc(l.ptype || '') + '<span class="t-sub">' + esc(l.location || '') + '</span>') + '</td>' +
      '<td class="r num">' + (l.budget ? f.money(l.budget, true) : '—') + '</td><td>' + esc(l.source) + '</td><td><span class="t-who">' + ES.av(u, 22) + esc(u.name.split(' ')[0]) + '</span></td><td>' + ES.pill(sname(l.status), TONE[l.status]) + '</td>' +
      '<td>' + (l.lastContact ? f.ago(l.lastContact) : '<span class="muted">Not yet</span>') + '</td><td' + (od ? ' style="color:var(--red);font-weight:600"' : '') + '>' + (l.nextFollowUp ? (od ? 'Overdue · ' : '') + f.dt(l.nextFollowUp) : '<span class="muted">—</span>') + '</td></tr>';
  }
  function table(L) { return '<div class="t-wrap"><table class="t"><thead><tr><th>Lead</th><th>Interested in</th><th class="r">Budget</th><th>Source</th><th>Agent</th><th>Status</th><th>Last contact</th><th>Next follow-up</th></tr></thead><tbody>' + L.map(leadRow).join('') + '</tbody></table></div>'; }

  ES.pages.leads = {
    table: table,
    render: function (v) {
      var all = st.s.leads, q = U.q.toLowerCase();
      var counts = {}; all.forEach(function (l) { counts[l.status] = (counts[l.status] || 0) + 1; });
      var due = all.filter(function (l) { return l.nextFollowUp && isToday(l.nextFollowUp) && new Date(l.nextFollowUp) >= Date.now() - 3600e3; }).length;
      var od = st.overdueFollowups().length, closed = (counts.converted || 0) + (counts.lost || 0);
      var L = all.filter(function (l) {
        if (U.status && l.status !== U.status) return false; if (U.source && l.source !== U.source) return false; if (U.agent && l.agentId !== U.agent) return false;
        if (q) { var p = l.propertyId ? st.prop(l.propertyId).title : ''; if ((l.name + l.phone + l.email + p + l.location).toLowerCase().indexOf(q) < 0) return false; }
        return true;
      }).sort(U.sort === 'next' ? function (a, b) { return (a.nextFollowUp ? new Date(a.nextFollowUp) : 9e15) - (b.nextFollowUp ? new Date(b.nextFollowUp) : 9e15); } : U.sort === 'budget' ? function (a, b) { return (b.budget || 0) - (a.budget || 0); } : function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
      v.innerHTML = '<header class="ph"><h1>Leads</h1><div class="ph__k">' + kq('user', counts.new || 0, 'New, not contacted') + kq('phone', due, 'Follow-ups due today') + kq('clock', '<span style="color:' + (od ? 'var(--red)' : 'inherit') + '">' + od + '</span>', 'Overdue follow-ups') + kq('trend', (closed ? Math.round((counts.converted || 0) / closed * 100) : 0) + '%', 'Conversion rate') + '</div>' +
        '<div class="ph__a"><button class="btn" data-ld="csv">' + I('download', 15) + 'Export</button><button class="btn btn--dark" data-ld="new">' + I('plus', 15) + 'Add lead</button></div></header>' +
        '<div class="tb"><div class="chips"><button class="fchip fchip--txt' + (!U.status ? ' is-on' : '') + '" data-ld="st" data-v="">All · ' + all.length + '</button>' + ES.LEAD_STATUS.map(function (s) { return '<button class="fchip fchip--txt' + (U.status === s.id ? ' is-on' : '') + '" data-ld="st" data-v="' + s.id + '">' + s.name + ' · ' + (counts[s.id] || 0) + '</button>'; }).join('') + '</div></div>' +
        '<div class="tb"><label class="tb__s">' + I('search', 15) + '<input type="search" data-lf="q" placeholder="Search name, phone, property…" value="' + esc(U.q) + '" aria-label="Search leads"></label>' +
        '<select data-lf="source" aria-label="Source"><option value="">Any source</option>' + ES.SOURCES.map(function (s) { return '<option' + (U.source === s ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select>' +
        '<select data-lf="agent" aria-label="Agent"><option value="">Any agent</option>' + st.s.team.map(function (u) { return '<option value="' + u.id + '"' + (U.agent === u.id ? ' selected' : '') + '>' + u.name + '</option>'; }).join('') + '</select>' +
        '<span class="tb__sp"></span><select data-lf="sort" aria-label="Sort"><option value="recent"' + (U.sort === 'recent' ? ' selected' : '') + '>Newest first</option><option value="next"' + (U.sort === 'next' ? ' selected' : '') + '>Next follow-up</option><option value="budget"' + (U.sort === 'budget' ? ' selected' : '') + '>Highest budget</option></select></div>' +
        (L.length ? table(L) : ES.empty('user', 'No leads match', 'Clear a filter or add a new lead.', '<button class="btn" data-ld="new">Add lead</button>'));
      v.oninput = function (e) { var el = e.target.closest('[data-lf]'); if (!el) return; U[el.dataset.lf] = el.value; if (el.dataset.lf === 'q') { clearTimeout(v._t); v._t = setTimeout(function () { ES.app.refresh(); var i = v.querySelector('[data-lf=q]'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 180); } else ES.app.refresh(); };
      v.onclick = function (e) {
        var b = e.target.closest('[data-ld]'), r = e.target.closest('[data-lead]');
        if (b) { var k = b.dataset.ld; if (k === 'st') { U.status = b.dataset.v; ES.app.refresh(); } if (k === 'new') edit(); if (k === 'csv') ES.csv('reside-ke-leads.csv', [['Name', 'Phone', 'Email', 'Source', 'Interested in', 'Budget (KES)', 'Location', 'Type', 'Agent', 'Status', 'Last contact', 'Next follow-up', 'Created']].concat(L.map(function (l) { return [l.name, l.phone, l.email, l.source, l.propertyId ? st.prop(l.propertyId).title : '', l.budget, l.location, l.ptype, st.user(l.agentId).name, sname(l.status), l.lastContact ? f.dateLong(l.lastContact) : '', l.nextFollowUp ? f.dt(l.nextFollowUp) : '', f.dateLong(l.createdAt)]; }))); return; }
        if (r) open(r.dataset.lead);
      };
      var m = location.hash.match(/lead=([\w]+)/); if (m) { history.replaceState(null, '', '#/leads'); setTimeout(function () { open(m[1]); }, 30); }
    },
    open: open, edit: edit
  };

  function open(id) {
    var l = st.lead(id); if (!l) return;
    var p = l.propertyId ? st.prop(l.propertyId) : null, done = l.status === 'converted' || l.status === 'lost';
    var panel = ES.open('drawer', '<div class="ovl__head"><div style="display:flex;gap:12px;align-items:center">' + ES.cav(l, 44) + '<div><h2>' + esc(l.name) + '</h2><p>' + ES.pill(sname(l.status), TONE[l.status]) + ' · ' + esc(l.source) + ' · added ' + f.ago(l.createdAt) + '</p></div></div><button class="ib" data-close aria-label="Close">' + I('x', 18) + '</button></div>' +
      '<div class="ovl__body">' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">' + (l.phone ? '<a class="btn btn--sm" href="tel:' + l.phone.replace(/\s/g, '') + '">' + I('phone', 14) + 'Call</a>' : '') + (l.email ? '<a class="btn btn--sm" href="mailto:' + esc(l.email) + '">' + I('mail', 14) + 'Email</a>' : '') + '<button class="btn btn--sm" data-lx="log">' + I('edit', 14) + 'Log contact</button><button class="btn btn--sm" data-lx="edit">' + I('edit', 14) + 'Edit</button></div>' +
      '<div class="g2" style="margin-bottom:16px">' +
      ES.field('Status', ES.select('status', ES.LEAD_STATUS.filter(function (s) { return s.id !== 'converted'; }).map(function (s) { return { v: s.id, l: s.name }; }).concat(l.status === 'converted' ? [{ v: 'converted', l: 'Converted' }] : []), l.status, 'id="lxS"' + (l.status === 'converted' ? ' disabled' : ''))) +
      ES.field('Assigned agent', ES.select('agent', st.s.team.map(function (u) { return { v: u.id, l: u.name }; }), l.agentId, 'id="lxA"')) +
      '</div>' +
      (!done ? '<div class="card" style="padding:14px;margin-bottom:16px;background:var(--card-2)"><div class="fld__l" style="margin-bottom:8px">Next follow-up' + (l.nextFollowUp ? ' · currently ' + f.dt(l.nextFollowUp) : '') + '</div><div style="display:flex;gap:8px"><input type="datetime-local" id="lxF" value="' + ES.localInput(l.nextFollowUp && new Date(l.nextFollowUp) > Date.now() ? l.nextFollowUp : Date.now() + DAY) + '" style="flex:1;height:36px;border:1px solid var(--line-2);border-radius:10px;padding:0 10px" aria-label="Follow-up date and time"><button class="btn btn--dark btn--sm" data-lx="fu">Schedule</button></div><p class="fld__h" style="margin-top:6px">Adds a call to the calendar. Not synced to external calendars in the demo.</p></div>' : '') +
      '<dl class="kv" style="margin-bottom:16px"><dt>Phone</dt><dd>' + esc(l.phone || '—') + '</dd><dt>Email</dt><dd>' + esc(l.email || '—') + '</dd><dt>Budget</dt><dd>' + (l.budget ? f.money(l.budget) : '—') + '</dd><dt>Looking for</dt><dd>' + esc(l.ptype || '—') + ' in ' + esc(l.location || 'any area') + '</dd><dt>Last contact</dt><dd>' + (l.lastContact ? f.dt(l.lastContact) : 'Not yet') + '</dd>' + (l.lostReason && l.status === 'lost' ? '<dt>Lost reason</dt><dd>' + esc(l.lostReason) + '</dd>' : '') + (l.contactId ? '<dt>Contact</dt><dd><a class="lnk" href="#/contact/' + l.contactId + '">Open contact record</a></dd>' : '') + '</dl>' +
      (p ? '<a href="#/property/' + p.id + '" class="mini__i" style="border:1px solid var(--line);border-radius:12px;padding:10px;margin-bottom:16px"><img src="' + p.images[0] + '" alt="" style="width:60px;height:44px;border-radius:8px;object-fit:cover"><span class="grow"><b>' + esc(p.title) + '</b><em>' + esc(p.area) + ' · ' + f.money(p.price, true) + (p.category === 'rent' ? ' /mo' : '') + '</em></span>' + I('right', 14) + '</a>' : '') +
      '<div class="fld__l" style="margin-bottom:8px">Notes</div><form class="note-f" id="lxN"><textarea name="t" placeholder="What did they say?" aria-label="Note"></textarea><button class="btn btn--dark">Add</button></form>' + l.notes.map(function (n) { return '<div class="note">' + esc(n.text) + '<em>' + esc(st.user(n.by).name) + ' · ' + f.ago(n.at) + '</em></div>'; }).join('') +
      '</div>' +
      (!done ? '<div class="ovl__foot"><button class="btn" data-lx="lost">' + I('x', 14) + 'Mark lost</button><span style="flex:1"></span><button class="btn" data-lx="conv">Convert to contact</button>' + (p ? '<button class="btn btn--dark" data-lx="convd">' + I('board', 14) + 'Convert + deal</button>' : '') + '</div>' : ''), { label: 'Lead ' + l.name });
    function reopen() { setTimeout(function () { if (!document.querySelector('.ovl')) open(id); }, 260); }
    panel.querySelector('#lxS') && panel.querySelector('#lxS').addEventListener('change', function (e) { var s = e.target.value; if (s === 'lost') { ES.close(); markLost(); return; } if (ES.try(function () { st.setLeadStatus(id, s); }, 'Status updated')) { ES.close(); reopen(); } });
    panel.querySelector('#lxA').addEventListener('change', function (e) { if (ES.try(function () { st.assignLead(id, e.target.value); }, 'Lead reassigned')) { ES.close(); reopen(); } });
    panel.querySelector('#lxN').onsubmit = function (e) { e.preventDefault(); if (ES.try(function () { st.addLeadNote(id, e.target.t.value); }, 'Note added')) { ES.close(); reopen(); } };
    function markLost() { ES.confirm({ title: 'Mark ' + l.name + ' as lost?', icon: 'x', tone: 'red', ok: 'Mark as lost', text: 'Follow-ups stop and the lead moves out of your active list.', field: ES.field('Reason', ES.select('r', ['Bought elsewhere', 'Budget too low', 'Not responding', 'Changed plans', 'Other'], '', 'id="lxR"')), onOk: function (pn) { ES.try(function () { st.setLeadStatus(id, 'lost', pn.querySelector('#lxR').value); }, 'Lead marked as lost'); } }); }
    panel.addEventListener('click', function (e) {
      var b = e.target.closest('[data-lx]'); if (!b) return; var k = b.dataset.lx;
      if (k === 'fu') { var vv = panel.querySelector('#lxF').value; if (ES.try(function () { st.scheduleFollowUp(id, vv); }, 'Follow-up scheduled')) { ES.close(); reopen(); } }
      if (k === 'edit') { ES.close(); setTimeout(function () { edit(id); }, 240); }
      if (k === 'log') { ES.close(); setTimeout(function () { ES.confirm({ title: 'Log contact with ' + l.name, icon: 'phone', ok: 'Save', text: 'Records a call or message and updates “last contact”.', field: ES.field('Summary', '<input id="lxL" placeholder="e.g. Called — wants a Saturday viewing">'), onOk: function (pn) { var t = pn.querySelector('#lxL').value; if (!t.trim()) { ES.toast('Add a short summary', 'err'); return false; } ES.try(function () { st.addLeadNote(id, '📞 ' + t); if (l.status === 'new') st.setLeadStatus(id, 'contacted'); }, 'Contact logged'); reopen(); } }); }, 240); }
      if (k === 'lost') { ES.close(); setTimeout(markLost, 240); }
      if (k === 'conv' || k === 'convd') {
        ES.close();
        setTimeout(function () {
          ES.confirm({ title: k === 'convd' ? 'Convert to contact and deal?' : 'Convert to contact?', icon: 'users', tone: 'green', ok: 'Convert', text: k === 'convd' ? 'Creates (or links) a contact for ' + l.name + ' and opens a qualified deal on ' + p.title + '. Notes and history are kept.' : 'Creates (or links) a contact record for ' + l.name + '. Notes and history are kept.', onOk: function () { var r = ES.try(function () { return st.convertLead(id, k === 'convd'); }, 'Lead converted'); if (r && r.deal) ES.app.go('#/deal/' + r.deal.id); else if (r) ES.app.go('#/contact/' + r.contact.id); } });
        }, 240);
      }
    });
  }

  function edit(id, pre) {
    var l = id ? st.lead(id) : Object.assign({ name: '', phone: '', email: '', source: 'Website', propertyId: '', budget: '', location: '', ptype: '', agentId: ES.config.userId, nextFollowUp: new Date(Date.now() + DAY).toISOString() }, pre || {});
    var panel = ES.open('modal', ES.head(id ? 'Edit lead' : 'Add lead', id ? '' : 'New enquiries land in the “New” column for follow-up') + '<form class="ovl__body" id="lef" novalidate><div class="g2">' +
      ES.field('Full name *', '<input name="name" value="' + esc(l.name) + '" autofocus>') + ES.field('Source', ES.select('source', ES.SOURCES, l.source)) +
      ES.field('Phone', '<input name="phone" type="tel" value="' + esc(l.phone) + '" placeholder="+254 7XX XXX XXX">') + ES.field('Email', '<input name="email" type="email" value="' + esc(l.email) + '" placeholder="name@example.com">') +
      ES.field('Interested in', ES.select('propertyId', [{ v: '', l: 'No specific listing' }].concat(st.listings().filter(function (p) { return p.status === 'active' || p.status === 'under_offer'; }).map(function (p) { return { v: p.id, l: p.title }; })), l.propertyId), '', 'span2') +
      ES.field('Budget (KES)', '<input name="budget" data-num inputmode="numeric" value="' + (l.budget || '') + '">') + ES.field('Preferred location', ES.select('location', [''].concat(ES.AREAS), l.location)) +
      ES.field('Property type', ES.select('ptype', [''].concat(ES.PTYPES), l.ptype)) + ES.field('Assign to', ES.select('agentId', st.s.team.map(function (u) { return { v: u.id, l: u.name }; }), l.agentId)) +
      (id ? '' : ES.field('First follow-up', '<input type="datetime-local" name="nextFollowUp" value="' + ES.localInput(l.nextFollowUp) + '">', '', 'span2')) +
      '</div><p class="fld__h" style="margin-top:12px">' + I('info', 12) + ' Demo records only — no messages are sent to this person.</p></form><div class="ovl__foot"><button class="btn" data-close>Cancel</button><button class="btn btn--dark" id="leSave">' + I('check', 15) + (id ? 'Save' : 'Add lead') + '</button></div>', { label: id ? 'Edit lead' : 'Add lead' });
    var fm = panel.querySelector('#lef');
    fm.propertyId.addEventListener('change', function () { var p = st.prop(fm.propertyId.value); if (p) { fm.location.value = p.area; fm.ptype.value = p.type; if (!fm.budget.value) fm.budget.value = p.price; fm.agentId.value = p.agentId; } });
    panel.querySelector('#leSave').onclick = function () {
      var d = ES.formData(fm); if (d.nextFollowUp) d.nextFollowUp = new Date(d.nextFollowUp).toISOString(); else delete d.nextFollowUp;
      if (!d.propertyId) d.propertyId = null;
      var r = ES.try(function () { return st.saveLead(d, id); }, id ? 'Lead saved' : 'Lead added');
      if (r) { ES.close(); if (!id) { U.status = ''; ES.app.go('#/leads'); } }
    };
  }

  /* ======================= CONTACTS ======================= */
  var TYPES = [['buyer', 'Buyers'], ['seller', 'Sellers'], ['tenant', 'Tenants'], ['landlord', 'Landlords'], ['owner', 'Owners'], ['vendor', 'Vendors'], ['professional', 'Professionals']];
  var TT = { buyer: 'blue', seller: 'amber', tenant: 'violet', landlord: 'green', owner: 'grey', vendor: 'grey', professional: 'grey' };
  function links(c) {
    return {
      props: st.listings().filter(function (p) { return p.ownerId === c.id; }),
      deals: st.s.deals.filter(function (d) { return d.buyerId === c.id || d.sellerId === c.id; }),
      leads: st.s.leads.filter(function (l) { return l.contactId === c.id; }),
      events: st.s.events.filter(function (e) { return e.contactId === c.id; })
    };
  }
  ES.pages.contacts = {
    render: function (v) {
      var all = st.s.contacts, q = CU.q.toLowerCase();
      var L = all.filter(function (c) { if (CU.type && c.types.indexOf(CU.type) < 0) return false; if (q && (c.name + c.phone + c.email + c.company).toLowerCase().indexOf(q) < 0) return false; return true; }).sort(function (a, b) { return a.name.localeCompare(b.name); });
      v.innerHTML = '<header class="ph"><h1>Contacts</h1><div class="ph__k">' + kq('users', all.length, 'People & companies') + kq('tag', all.filter(function (c) { return c.types.indexOf('buyer') > -1; }).length, 'Buyers') + kq('home', all.filter(function (c) { return c.types.indexOf('seller') > -1 || c.types.indexOf('landlord') > -1; }).length, 'Sellers & landlords') + kq('key', all.filter(function (c) { return c.types.indexOf('tenant') > -1; }).length, 'Tenants') + '</div>' +
        '<div class="ph__a"><button class="btn" data-ct="csv">' + I('download', 15) + 'Export</button><button class="btn btn--dark" data-ct="new">' + I('plus', 15) + 'Add contact</button></div></header>' +
        '<div class="tb"><label class="tb__s">' + I('search', 15) + '<input type="search" data-cf="q" placeholder="Search name, phone, email, company" value="' + esc(CU.q) + '" aria-label="Search contacts"></label><div class="chips"><button class="fchip fchip--txt' + (!CU.type ? ' is-on' : '') + '" data-ct="t" data-v="">All</button>' + TYPES.map(function (t) { return '<button class="fchip fchip--txt' + (CU.type === t[0] ? ' is-on' : '') + '" data-ct="t" data-v="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div></div>' +
        (L.length ? '<div class="t-wrap"><table class="t"><thead><tr><th>Name</th><th>Type</th><th>Phone</th><th>Email</th><th>Agent</th><th class="r">Listings</th><th class="r">Deals</th><th>Added</th></tr></thead><tbody>' +
          L.map(function (c) { var k = links(c), u = st.user(c.agentId); return '<tr data-href="#/contact/' + c.id + '"><td><span class="t-who">' + ES.cav(c, 30) + '<span><b>' + esc(c.name) + '</b>' + (c.company && c.company !== c.name ? '<span class="t-sub">' + esc(c.company) + '</span>' : '') + '</span></span></td><td>' + c.types.map(function (t) { return ES.pill(t, TT[t]); }).join(' ') + '</td><td class="num">' + esc(c.phone) + '</td><td>' + esc(c.email) + '</td><td><span class="t-who">' + ES.av(u, 22) + esc(u.name.split(' ')[0]) + '</span></td><td class="r">' + (k.props.length || '—') + '</td><td class="r">' + (k.deals.length || '—') + '</td><td>' + f.date(c.createdAt) + '</td></tr>'; }).join('') + '</tbody></table></div>' : ES.empty('users', 'No contacts match', 'Try another type or search.'));
      v.oninput = function (e) { if (e.target.dataset.cf === 'q') { CU.q = e.target.value; clearTimeout(v._t); v._t = setTimeout(function () { ES.app.refresh(); var i = v.querySelector('[data-cf=q]'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 180); } };
      v.onclick = function (e) {
        var b = e.target.closest('[data-ct]'), r = e.target.closest('tr[data-href]');
        if (b) { if (b.dataset.ct === 't') { CU.type = b.dataset.v; ES.app.refresh(); } if (b.dataset.ct === 'new') editContact(); if (b.dataset.ct === 'csv') ES.csv('reside-ke-contacts.csv', [['Name', 'Company', 'Types', 'Phone', 'Email', 'Agent', 'Added']].concat(L.map(function (c) { return [c.name, c.company, c.types.join('; '), c.phone, c.email, st.user(c.agentId).name, f.dateLong(c.createdAt)]; }))); return; }
        if (r) ES.app.go(r.dataset.href);
      };
    }
  };
  function editContact(id) {
    var c = id ? st.contact(id) : { name: '', company: '', phone: '', email: '', types: ['buyer'], agentId: ES.config.userId };
    var panel = ES.open('modal', ES.head(id ? 'Edit contact' : 'Add contact') + '<form class="ovl__body" id="cef" novalidate><div class="g2">' +
      ES.field('Full name *', '<input name="name" value="' + esc(c.name) + '" autofocus>') + ES.field('Company', '<input name="company" value="' + esc(c.company || '') + '">') +
      ES.field('Phone', '<input name="phone" type="tel" value="' + esc(c.phone) + '">') + ES.field('Email', '<input name="email" type="email" value="' + esc(c.email) + '">') +
      '<div class="fld span2"><span class="fld__l">Contact type *</span><div class="cks">' + TYPES.map(function (t) { return '<label class="ck"><input type="checkbox" data-multi name="types" value="' + t[0] + '"' + (c.types.indexOf(t[0]) > -1 ? ' checked' : '') + '>' + t[1].replace(/s$/, '') + '</label>'; }).join('') + '</div></div>' +
      ES.field('Relationship owner', ES.select('agentId', st.s.team.map(function (u) { return { v: u.id, l: u.name }; }), c.agentId)) +
      '</div></form><div class="ovl__foot"><button class="btn" data-close>Cancel</button><button class="btn btn--dark" id="ceSave">' + I('check', 15) + 'Save contact</button></div>', { label: 'Contact' });
    panel.querySelector('#ceSave').onclick = function () { var d = ES.formData(panel.querySelector('#cef')); var r = ES.try(function () { return st.saveContact(d, id); }, 'Contact saved'); if (r) { ES.close(); if (!id) ES.app.go('#/contact/' + r.id); } };
  }
  ES.pages.contact = {
    render: function (v, params) {
      var c = st.contact(params[0]);
      if (!c) { v.innerHTML = ES.empty('users', 'Contact not found', '', '<a class="btn" href="#/contacts">Back to contacts</a>'); return; }
      var k = links(c), u = st.user(c.agentId);
      var upcoming = k.events.filter(function (e) { return e.status === 'scheduled'; }).sort(function (a, b) { return new Date(a.start) - new Date(b.start); });
      v.innerHTML = '<a class="back" href="#/contacts">' + I('left', 14) + 'Contacts</a>' +
        '<header class="ct-h">' + ES.cav(c, 64) + '<div><h1>' + esc(c.name) + '</h1><div class="types">' + c.types.map(function (t) { return ES.pill(t, TT[t]); }).join('') + (c.company && c.company !== c.name ? '<span class="muted" style="font-size:12.5px;margin-left:6px">' + esc(c.company) + '</span>' : '') + '</div></div>' +
        '<div class="ct-h__a"><a class="btn" href="tel:' + c.phone.replace(/\s/g, '') + '">' + I('phone', 15) + 'Call</a><a class="btn" href="mailto:' + esc(c.email) + '">' + I('mail', 15) + 'Email</a><button class="btn" data-cx="edit">' + I('edit', 15) + 'Edit</button><button class="btn btn--dark" data-cx="deal">' + I('plus', 15) + 'New deal</button></div></header>' +
        '<div class="dd-grid"><div class="pd-col">' +
        (k.props.length ? '<article class="card"><header class="card__h"><span class="card__t">' + I('building', 16) + 'Properties owned</span></header><div class="mini">' + k.props.map(function (p) { return '<a class="mini__i" href="#/property/' + p.id + '"><img src="' + p.images[0] + '" alt="" style="width:56px;height:40px;border-radius:8px;object-fit:cover"><span class="grow"><b>' + esc(p.title) + '</b><em>' + esc(p.area) + ' · ' + f.money(p.price, true) + '</em></span>' + ES.statusPill(p.status) + '</a>'; }).join('') + '</div></article>' : '') +
        '<article class="card"><header class="card__h"><span class="card__t">' + I('board', 16) + 'Deals</span></header>' + (k.deals.length ? '<div class="mini">' + k.deals.map(function (d) { var p = st.prop(d.propertyId); return '<a class="mini__i" href="#/deal/' + d.id + '"><img src="' + p.images[0] + '" alt="" style="width:56px;height:40px;border-radius:8px;object-fit:cover"><span class="grow"><b>' + esc(p.title) + '</b><em>' + d.ref + ' · ' + (d.buyerId === c.id ? (d.kind === 'rent' ? 'Tenant' : 'Buyer') : (d.kind === 'rent' ? 'Landlord' : 'Seller')) + ' · ' + f.money(d.value, true) + '</em></span>' + ES.pill(st.stage(d.stage).short, d.stage === 'won' ? 'green' : d.stage === 'lost' ? 'red' : 'blue') + '</a>'; }).join('') + '</div>' : '<p class="muted" style="font-size:12.5px">No deals linked yet.</p>') + '</article>' +
        '<article class="card"><header class="card__h"><span class="card__t">' + I('chat', 16) + 'Communications</span></header><form class="note-f" id="cxC" style="flex-wrap:wrap">' + ES.select('ch', ['Call', 'Email', 'WhatsApp', 'Meeting', 'SMS'], 'Call', 'class="sel" aria-label="Channel"') + '<textarea name="t" placeholder="Summary of the conversation" aria-label="Summary"></textarea><button class="btn btn--dark">Log</button></form>' +
        (c.comms.length ? c.comms.map(function (m) { return '<div class="note"><b style="font-size:12px">' + esc(m.channel) + '</b> — ' + esc(m.text) + '<em>' + esc(st.user(m.by).name) + ' · ' + f.dt(m.at) + '</em></div>'; }).join('') : '<p class="muted" style="font-size:12.5px">No communications logged. Logging is internal — nothing is sent to the contact.</p>') + '</article>' +
        (k.leads.length ? '<article class="card"><header class="card__h"><span class="card__t">' + I('user', 16) + 'Lead history</span></header>' + table(k.leads) + '</article>' : '') +
        '</div><div class="pd-col">' +
        '<article class="card"><header class="card__h"><span class="card__t">' + I('info', 16) + 'Details</span></header><dl class="kv"><dt>Phone</dt><dd>' + esc(c.phone || '—') + '</dd><dt>Email</dt><dd>' + esc(c.email || '—') + '</dd><dt>Owner</dt><dd><span class="t-who">' + ES.av(u, 22) + esc(u.name) + '</span></dd><dt>Added</dt><dd>' + f.dateLong(c.createdAt) + '</dd></dl><p class="badge-sample" style="margin-top:12px">' + I('info', 12) + 'Synthetic demo contact</p></article>' +
        '<article class="card"><header class="card__h"><span class="card__t">' + I('cal', 16) + 'Upcoming</span><button class="btn btn--sm" data-cx="ev">' + I('plus', 13) + 'Schedule</button></header>' + (upcoming.length ? '<div class="agenda">' + upcoming.map(function (e) { return ES.pages.calendar.agItem(e); }).join('') + '</div>' : '<p class="muted" style="font-size:12.5px">Nothing scheduled.</p>') + '</article>' +
        '<article class="card"><header class="card__h"><span class="card__t">' + I('clock', 16) + 'Activity</span></header>' + (function () { var A = st.activityFor('contact', c.id).concat(st.s.activity.filter(function (a) { return a.ref && a.ref.type === 'deal' && k.deals.some(function (d) { return d.id === a.ref.id; }); })); return A.length ? ES.timeline(A.slice(0, 10)) : '<p class="muted" style="font-size:12.5px">No activity yet.</p>'; })() + '</article>' +
        '</div></div>';
      v.onclick = function (e) {
        var b = e.target.closest('[data-cx]'), ev = e.target.closest('[data-ev]'), ld = e.target.closest('[data-lead]');
        if (ev) { ES.pages.calendar.open(ev.dataset.ev); return; }
        if (ld) { open(ld.dataset.lead); return; }
        if (!b) return;
        if (b.dataset.cx === 'edit') editContact(c.id);
        if (b.dataset.cx === 'deal') ES.pages.deal.newModal({ buyerId: c.id });
        if (b.dataset.cx === 'ev') ES.pages.calendar.edit(null, { type: 'meeting', contactId: c.id, agentId: c.agentId });
      };
      v.querySelector('#cxC').onsubmit = function (e) { e.preventDefault(); ES.try(function () { st.logComm(c.id, e.target.ch.value, e.target.t.value); }, 'Logged'); };
    }
  };
})();
