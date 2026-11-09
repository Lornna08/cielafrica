/* ============================================================
   Reside Ke — central data layer
   One state object; every screen reads through these selectors and
   writes through these actions so listings, deals, commissions and
   reports stay consistent.

   Template persistence: browser localStorage under "reside-ke:demo:v1".
   It is isolated sample data — never real customer records — and a
   production deployment would replace this module with an API.
   ============================================================ */
(function () {
  'use strict';
  var KEY = ES.config.storageKey, DAY = 864e5;
  var S = null, subs = [], timer = null, persistOk = true;

  function iso(d) { return (d || new Date()).toISOString(); }
  function fail(m) { var e = new Error(m); e.userFacing = true; throw e; }
  function byId(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
  function nid(p) { S.seq = (S.seq || 100) + 1; return p + S.seq; }

  function load() {
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { persistOk = false; }
    if (raw) {
      try {
        var p = JSON.parse(raw), age = Date.now() - new Date(p.seededAt).getTime();
        if (p.version === 1 && (p.touched ? age < 30 * DAY : age < 12 * 3600e3)) { S = p; return; }
      } catch (e) { /* reseed */ }
    }
    S = ES.generate(new Date()); save(true);
  }
  function save(now) {
    clearTimeout(timer);
    var run = function () { try { localStorage.setItem(KEY, JSON.stringify(S)); persistOk = true; } catch (e) { persistOk = false; } };
    if (now) run(); else timer = setTimeout(run, 200);
  }
  function commit(a) {
    S.touched = true;
    if (a) { S.activity.unshift(Object.assign({ at: iso(), by: ES.config.userId }, a)); S.activity = S.activity.slice(0, 120); }
    save(); subs.forEach(function (f) { try { f('data'); } catch (e) { console.error(e); } });
  }

  var stageIdx = {}; ES.STAGES.forEach(function (s, i) { stageIdx[s.id] = i; });

  var store = ES.store = {
    get s() { return S; },
    init: load,
    persistOk: function () { return persistOk; },
    subscribe: function (f) { subs.push(f); return function () { subs = subs.filter(function (x) { return x !== f; }); }; },
    reset: function () { S = ES.generate(new Date()); save(true); subs.forEach(function (f) { f('data'); }); },

    /* ---------- lookups ---------- */
    user: function (id) { return byId(S.team, id) || { id: id, name: 'Unassigned', avatar: '' }; },
    me: function () { return byId(S.team, ES.config.userId); },
    prop: function (id) { return byId(S.properties, id); },
    contact: function (id) { return byId(S.contacts, id); },
    deal: function (id) { return byId(S.deals, id); },
    lead: function (id) { return byId(S.leads, id); },
    event: function (id) { return byId(S.events, id); },
    lease: function (id) { return byId(S.leases, id); },
    stage: function (id) { return ES.STAGES[stageIdx[id]]; },

    /* ---------- derived ---------- */
    listings: function () { return S.properties.filter(function (p) { return !p.archived; }); },
    commission: function (d) {
      if (!d) return 0;
      if (d.kind === 'rent') return Math.round(d.value * (S.settings.rentMonths || 1));
      return Math.round(d.value * (d.rate != null ? d.rate : S.settings.saleRate) / 100);
    },
    weighted: function (d) { return Math.round(store.commission(d) * store.stage(d.stage).p / 100); },
    openDeals: function () { return S.deals.filter(function (d) { return d.stage !== 'won' && d.stage !== 'lost'; }); },
    wonDeals: function () { return S.deals.filter(function (d) { return d.stage === 'won'; }); },
    dealsFor: function (pid) { return S.deals.filter(function (d) { return d.propertyId === pid; }); },
    leadsFor: function (pid) { return S.leads.filter(function (l) { return l.propertyId === pid; }); },
    eventsFor: function (pid) { return S.events.filter(function (e) { return e.propertyId === pid; }); },
    docsFor: function (pid) { return S.docs.filter(function (d) { return d.propertyId === pid; }); },
    activityFor: function (type, id) { return S.activity.filter(function (a) { return a.ref && a.ref.type === type && a.ref.id === id; }); },
    leaseFor: function (pid) { return S.leases.filter(function (l) { return l.propertyId === pid && l.status !== 'ended'; })[0] || null; },
    daysOnMarket: function (p) { return Math.max(1, Math.round((Date.now() - new Date(p.listedAt).getTime()) / DAY)); },
    monthKey: function (d) { d = new Date(d); return d.getFullYear() * 12 + d.getMonth(); },

    // commission earned per month for the last n months (ends with current month)
    commissionSeries: function (n, agentId) {
      var now = new Date(), endKey = now.getFullYear() * 12 + now.getMonth(), out = [];
      for (var i = n - 1; i >= 0; i--) {
        var k = endKey - i, sum = 0, cnt = 0;
        S.deals.forEach(function (d) {
          if (d.stage !== 'won' || !d.closedAt) return;
          if (agentId && d.agentId !== agentId) return;
          if (store.monthKey(d.closedAt) === k) { sum += store.commission(d); cnt++; }
        });
        out.push({ key: k, date: new Date(Math.floor(k / 12), k % 12, 1), value: sum, count: cnt });
      }
      return out;
    },
    kpis: function () {
      var L = store.listings(), now = new Date(), mk = now.getFullYear() * 12 + now.getMonth();
      var active = L.filter(function (p) { return p.status === 'active'; });
      var under = L.filter(function (p) { return p.status === 'under_offer'; });
      var thisMonth = store.commissionSeries(1)[0].value;
      var dom = active.length ? Math.round(active.reduce(function (a, p) { return a + store.daysOnMarket(p); }, 0) / active.length) : 0;
      var newLeads = S.leads.filter(function (l) { return (Date.now() - new Date(l.createdAt)) < 7 * DAY; }).length;
      var closing = store.openDeals().filter(function (d) { return d.expectedClose && (new Date(d.expectedClose) - Date.now()) < 30 * DAY; });
      return { active: active.length, under: under.length, commissionMonth: thisMonth, dom: dom, newLeads: newLeads, closing: closing.length, closingValue: closing.reduce(function (a, d) { return a + d.value; }, 0), mk: mk };
    },
    unreadCount: function () { return S.convs.reduce(function (a, c) { return a + (c.unread || 0); }, 0); },
    newLeadCount: function () { return S.leads.filter(function (l) { return l.status === 'new'; }).length; },
    overdueFollowups: function () { return S.leads.filter(function (l) { return l.nextFollowUp && new Date(l.nextFollowUp) < Date.now() && l.status !== 'converted' && l.status !== 'lost'; }); },

    /* ---------- listings ---------- */
    saveListing: function (data, id) {
      if (!data.title || data.title.trim().length < 3) fail('Give the listing a title.');
      if (!(data.price > 0)) fail('Enter an asking price.');
      if (data.minPrice && data.minPrice > data.price) fail('Minimum acceptable price can’t be above the asking price.');
      var p;
      if (id) {
        p = store.prop(id); if (!p) fail('Listing not found.');
        var priceChanged = p.price !== data.price;
        Object.assign(p, data);
        commit({ kind: 'listing', text: priceChanged ? 'Price updated on ' + p.title + ' to ' + ES.fmt.money(p.price, true) : 'Listing updated — ' + p.title, ref: { type: 'property', id: p.id } });
      } else {
        S.seq = (S.seq || 100) + 1;
        var max = S.properties.reduce(function (m, x) { return Math.max(m, parseInt(x.ref.split('-')[1], 10) || 0); }, 1000);
        p = Object.assign({ id: 'p' + (max + 1), ref: 'EST-' + (max + 1), views: 0, listedAt: iso(), notes: [], images: [], amenities: [], estimate: null, floors: 1 }, data);
        if (!p.estimate) p.estimate = p.price;
        if (!p.images.length) p.images = ['img/p/int-living-2.webp'];
        S.properties.unshift(p);
        commit({ kind: 'listing', text: 'New listing created — ' + p.title, ref: { type: 'property', id: p.id } });
      }
      return p;
    },
    setPrice: function (id, target, min) {
      var p = store.prop(id); if (!p) fail('Listing not found.');
      if (min > target) fail('Lowest acceptable price must be at or below the target.');
      var old = p.price; p.price = target; p.minPrice = min;
      store.openDeals().forEach(function (d) { if (d.propertyId === id && !d.offers.length) d.value = target; });
      commit({ kind: 'listing', text: 'Price on ' + p.title + ' changed from ' + ES.fmt.money(old, true) + ' to ' + ES.fmt.money(target, true), ref: { type: 'property', id: id } });
    },
    setListingStatus: function (id, status) {
      var p = store.prop(id); p.status = status;
      commit({ kind: 'listing', text: p.title + ' marked ' + ES.fmt.status(status).toLowerCase(), ref: { type: 'property', id: id } });
    },
    addPropertyNote: function (id, text) {
      if (!text.trim()) fail('Write a note first.');
      var p = store.prop(id); p.notes.unshift({ at: iso(), by: ES.config.userId, text: text.trim() });
      commit({ kind: 'note', text: 'Note added on ' + p.title, ref: { type: 'property', id: id } });
    },

    /* ---------- deals ---------- */
    createDeal: function (o) {
      var p = store.prop(o.propertyId); if (!p) fail('Choose a property.');
      if (!o.buyerId) fail('Choose a buyer or tenant.');
      if (!(o.value > 0)) fail('Enter a deal value.');
      S.seq++;
      var max = S.deals.reduce(function (m, d) { return Math.max(m, parseInt(d.ref.split('-')[1], 10)); }, 2000);
      var d = { id: 'd' + (max + 1), ref: 'DL-' + (max + 1), propertyId: p.id, buyerId: o.buyerId, sellerId: p.ownerId, agentId: o.agentId || p.agentId, kind: p.category, value: o.value, rate: p.category === 'rent' ? null : (o.rate || null), stage: o.stage || 'new', expectedClose: o.expectedClose || new Date(Date.now() + 45 * DAY).toISOString(), createdAt: iso(), offers: [], commissionStatus: 'projected', notes: [] };
      S.deals.unshift(d);
      commit({ kind: 'stage', text: 'New deal ' + d.ref + ' — ' + p.title, ref: { type: 'deal', id: d.id } });
      return d;
    },
    moveDeal: function (id, stage, opts) {
      var d = store.deal(id); if (!d) fail('Deal not found.');
      if (d.stage === stage) return d;
      if (d.stage === 'won') fail('This deal is closed. Reopen isn’t available in the template.');
      var p = store.prop(d.propertyId), from = store.stage(d.stage).short;
      d.stage = stage;
      if (stage === 'won') {
        d.closedAt = iso(); d.commissionStatus = 'earned';
        if (opts && opts.value) d.value = opts.value;
        p.status = d.kind === 'rent' ? 'let' : 'sold';
        if (d.kind === 'rent' && !store.leaseFor(p.id)) {
          var start = new Date(); S.leases.unshift({ id: nid('l'), propertyId: p.id, tenantId: d.buyerId, landlordId: p.ownerId, start: start.toISOString(), end: new Date(start.getTime() + 365 * DAY).toISOString(), rent: d.value, deposit: d.value * 2, status: 'active' });
        }
        S.activity.unshift({ at: iso(), by: ES.config.userId, kind: 'commission', text: 'Commission ' + ES.fmt.money(store.commission(d), true) + ' recorded — ' + p.title, ref: { type: 'deal', id: d.id } });
      } else if (stage === 'lost') {
        d.closedAt = iso(); d.lostReason = (opts && opts.reason) || 'Not specified';
        if (p.status === 'under_offer' && !store.openDeals().some(function (x) { return x.propertyId === p.id && x.id !== d.id && (x.stage === 'under_offer' || x.stage === 'contract'); })) p.status = 'active';
      } else {
        if ((stage === 'under_offer' || stage === 'contract') && p.status === 'active') p.status = 'under_offer';
      }
      commit({ kind: 'stage', text: p.title + ' moved from ' + from + ' to ' + store.stage(stage).short, ref: { type: 'deal', id: d.id } });
      return d;
    },
    recordOffer: function (id, amount, note) {
      var d = store.deal(id); if (!d) fail('Deal not found.');
      if (!(amount > 0)) fail('Enter the offer amount.');
      d.offers.forEach(function (o) { if (o.status === 'open') o.status = 'superseded'; });
      d.offers.push({ amount: amount, at: iso(), status: 'open', note: note || '' });
      d.value = amount;
      if (stageIdx[d.stage] < stageIdx.offer) d.stage = 'offer';
      var p = store.prop(d.propertyId);
      commit({ kind: 'offer', text: 'Offer ' + ES.fmt.money(amount, true) + ' recorded on ' + p.title, ref: { type: 'deal', id: d.id } });
    },
    respondOffer: function (id, idx, status) {
      var d = store.deal(id), o = d.offers[idx]; o.status = status;
      var p = store.prop(d.propertyId);
      if (status === 'accepted') { d.value = o.amount; if (stageIdx[d.stage] < stageIdx.under_offer) d.stage = 'under_offer'; if (p.status === 'active') p.status = 'under_offer'; }
      commit({ kind: 'offer', text: 'Offer ' + ES.fmt.money(o.amount, true) + ' ' + status + ' — ' + p.title, ref: { type: 'deal', id: d.id } });
    },
    setCommissionStatus: function (id, status) {
      var d = store.deal(id); d.commissionStatus = status;
      commit({ kind: 'commission', text: 'Commission on ' + store.prop(d.propertyId).title + ' marked ' + status, ref: { type: 'deal', id: id } });
    },
    addDealNote: function (id, text) {
      if (!text.trim()) fail('Write a note first.');
      var d = store.deal(id); d.notes.unshift({ at: iso(), by: ES.config.userId, text: text.trim() });
      commit({ kind: 'note', text: 'Note added on ' + d.ref, ref: { type: 'deal', id: id } });
    },

    /* ---------- leads & contacts ---------- */
    saveLead: function (o, id) {
      if (!o.name || o.name.trim().length < 2) fail('Enter the lead’s name.');
      if (!o.phone && !o.email) fail('Add a phone number or email.');
      if (o.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(o.email)) fail('That email address doesn’t look right.');
      var l;
      if (id) { l = store.lead(id); Object.assign(l, o); commit({ kind: 'lead', text: 'Lead updated — ' + l.name, ref: { type: 'lead', id: id } }); }
      else {
        l = Object.assign({ id: nid('ld'), status: 'new', createdAt: iso(), notes: [], lastContact: null, contactId: null }, o);
        S.leads.unshift(l);
        S.notifications.unshift({ id: nid('n'), kind: 'lead', text: 'New lead: ' + l.name, at: iso(), read: false, ref: { type: 'lead', id: l.id } });
        commit({ kind: 'lead', text: 'New lead ' + l.name + (l.propertyId ? ' for ' + store.prop(l.propertyId).title : ''), ref: { type: 'lead', id: l.id } });
      }
      return l;
    },
    setLeadStatus: function (id, status, reason) {
      var l = store.lead(id); l.status = status; l.lastContact = iso();
      if (status === 'lost') { l.lostReason = reason || 'Not specified'; l.nextFollowUp = null; }
      commit({ kind: 'lead', text: l.name + ' marked ' + ES.LEAD_STATUS.filter(function (s) { return s.id === status; })[0].name.toLowerCase(), ref: { type: 'lead', id: id } });
    },
    assignLead: function (id, agentId) { var l = store.lead(id); l.agentId = agentId; commit({ kind: 'lead', text: l.name + ' assigned to ' + store.user(agentId).name, ref: { type: 'lead', id: id } }); },
    scheduleFollowUp: function (id, when) {
      var l = store.lead(id); if (!when) fail('Pick a date and time.');
      l.nextFollowUp = new Date(when).toISOString();
      S.events.push({ id: nid('e'), type: 'call', title: 'Follow up ' + l.name, start: l.nextFollowUp, duration: 15, agentId: l.agentId, propertyId: l.propertyId, status: 'scheduled', notes: '', leadId: l.id });
      commit({ kind: 'lead', text: 'Follow-up scheduled with ' + l.name + ' for ' + ES.fmt.dt(l.nextFollowUp), ref: { type: 'lead', id: id } });
    },
    addLeadNote: function (id, text) { if (!text.trim()) fail('Write a note first.'); var l = store.lead(id); l.notes.unshift({ at: iso(), by: ES.config.userId, text: text.trim() }); l.lastContact = iso(); commit({ kind: 'note', text: 'Note on lead ' + l.name, ref: { type: 'lead', id: id } }); },
    convertLead: function (id, withDeal) {
      var l = store.lead(id); if (l.contactId) fail('This lead is already converted.');
      var existing = S.contacts.filter(function (c) { return (l.email && c.email === l.email) || (l.phone && c.phone === l.phone); })[0];
      var p = l.propertyId ? store.prop(l.propertyId) : null;
      var c = existing || { id: nid('c'), name: l.name, phone: l.phone, email: l.email, types: [p && p.category === 'rent' ? 'tenant' : 'buyer'], company: '', agentId: l.agentId, createdAt: iso(), notes: l.notes.slice(), comms: [] };
      if (!existing) S.contacts.unshift(c);
      l.contactId = c.id; l.status = 'converted'; l.nextFollowUp = null;
      var d = null;
      if (withDeal && p) {
        S.seq++;
        var max = S.deals.reduce(function (m, x) { return Math.max(m, parseInt(x.ref.split('-')[1], 10)); }, 2000);
        d = { id: 'd' + (max + 1), ref: 'DL-' + (max + 1), propertyId: p.id, buyerId: c.id, sellerId: p.ownerId, agentId: l.agentId, kind: p.category, value: p.price, rate: null, stage: 'qualified', expectedClose: new Date(Date.now() + 45 * DAY).toISOString(), createdAt: iso(), offers: [], commissionStatus: 'projected', notes: [], leadId: l.id };
        S.deals.unshift(d);
      }
      commit({ kind: 'lead', text: l.name + ' converted to contact' + (d ? ' and deal ' + d.ref : ''), ref: { type: 'lead', id: id } });
      return { contact: c, deal: d };
    },
    saveContact: function (o, id) {
      if (!o.name || o.name.trim().length < 2) fail('Enter a name.');
      if (!o.types || !o.types.length) fail('Choose at least one contact type.');
      if (o.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(o.email)) fail('That email address doesn’t look right.');
      var dup = S.contacts.filter(function (c) { return c.id !== id && ((o.email && c.email === o.email) || (o.phone && c.phone.replace(/\s/g, '') === o.phone.replace(/\s/g, ''))); })[0];
      if (dup) fail('A contact with that phone or email already exists: ' + dup.name + '.');
      var c;
      if (id) { c = store.contact(id); Object.assign(c, o); commit({ kind: 'contact', text: 'Contact updated — ' + c.name, ref: { type: 'contact', id: id } }); }
      else { c = Object.assign({ id: nid('c'), createdAt: iso(), notes: [], comms: [], company: '' }, o); S.contacts.unshift(c); commit({ kind: 'contact', text: 'New contact ' + c.name, ref: { type: 'contact', id: c.id } }); }
      return c;
    },
    logComm: function (id, channel, text) {
      if (!text.trim()) fail('Add a short summary.');
      var c = store.contact(id); c.comms.unshift({ at: iso(), by: ES.config.userId, channel: channel, text: text.trim() });
      commit({ kind: 'contact', text: channel + ' logged with ' + c.name, ref: { type: 'contact', id: id } });
    },

    /* ---------- calendar ---------- */
    saveEvent: function (o, id) {
      if (!o.title || !o.title.trim()) fail('Give the event a title.');
      if (!o.start || isNaN(new Date(o.start))) fail('Pick a date and time.');
      var e;
      if (id) { e = store.event(id); Object.assign(e, o); commit({ kind: 'viewing', text: 'Updated — ' + e.title, ref: o.propertyId ? { type: 'property', id: o.propertyId } : null }); }
      else { e = Object.assign({ id: nid('e'), status: 'scheduled', duration: 45, notes: '' }, o); S.events.push(e); commit({ kind: 'viewing', text: (e.type === 'viewing' ? 'Viewing booked — ' : 'Scheduled — ') + e.title.replace(/^Viewing — /, ''), ref: o.propertyId ? { type: 'property', id: o.propertyId } : null }); }
      return e;
    },
    setEventStatus: function (id, status) { var e = store.event(id); e.status = status; commit({ kind: 'viewing', text: e.title + (status === 'done' ? ' completed' : status === 'cancelled' ? ' cancelled' : ' reopened'), ref: e.propertyId ? { type: 'property', id: e.propertyId } : null }); },

    /* ---------- rentals ---------- */
    recordPayment: function (id) { var p = byId(S.payments, id); p.status = 'paid'; p.recordedAt = iso(); var l = store.lease(p.leaseId); commit({ kind: 'rent', text: 'Rent ' + ES.fmt.money(p.amount) + ' recorded as received — ' + store.prop(l.propertyId).title, ref: { type: 'property', id: l.propertyId } }); },
    saveMaintenance: function (o) { if (!o.title || !o.title.trim()) fail('Describe the issue.'); if (!o.propertyId) fail('Choose a property.'); var m = Object.assign({ id: nid('m'), status: 'open', createdAt: iso() }, o); S.maintenance.unshift(m); commit({ kind: 'rent', text: 'Maintenance request — ' + m.title, ref: { type: 'property', id: m.propertyId } }); },
    setMaintenance: function (id, status) { var m = byId(S.maintenance, id); m.status = status; commit({ kind: 'rent', text: 'Maintenance "' + m.title + '" → ' + status.replace('_', ' '), ref: { type: 'property', id: m.propertyId } }); },
    saveApplication: function (o) { if (!o.name || !o.name.trim()) fail('Enter the applicant’s name.'); if (!o.propertyId) fail('Choose a property.'); var a = Object.assign({ id: nid('ap'), status: 'received', createdAt: iso() }, o); S.applications.unshift(a); commit({ kind: 'rent', text: 'Rental application from ' + a.name, ref: { type: 'property', id: a.propertyId } }); },
    setApplication: function (id, status) { var a = byId(S.applications, id); a.status = status; commit({ kind: 'rent', text: 'Application from ' + a.name + ' ' + status, ref: { type: 'property', id: a.propertyId } }); },

    /* ---------- documents ---------- */
    addDoc: function (o) {
      if (!o.name) fail('Choose a file.');
      if (!/\.(pdf|docx?|jpe?g|png|webp|zip)$/i.test(o.name)) fail('Allowed types: PDF, Word, images or ZIP.');
      if (o.size > 25 * 1024) fail('Files must be 25 MB or smaller.');
      var d = Object.assign({ id: nid('doc'), at: iso(), by: ES.config.userId, status: 'final' }, o); S.docs.unshift(d);
      commit({ kind: 'doc', text: 'Document added — ' + d.name, ref: d.propertyId ? { type: 'property', id: d.propertyId } : null });
    },
    removeDoc: function (id) { var d = byId(S.docs, id); S.docs = S.docs.filter(function (x) { return x.id !== id; }); commit({ kind: 'doc', text: 'Document removed — ' + d.name }); },

    /* ---------- chat ---------- */
    sendMessage: function (convId, text, extra) {
      if (!text.trim() && !extra) return;
      var m = Object.assign({ id: nid('msg'), convId: convId, from: ES.config.userId, text: text.trim(), at: iso() }, extra || {});
      S.msgs.push(m); S.touched = true; save(); subs.forEach(function (f) { f('chat'); });
      return m;
    },
    receiveMessage: function (convId, from, text) { S.msgs.push({ id: nid('msg'), convId: convId, from: from, text: text, at: iso(), simulated: true }); save(); subs.forEach(function (f) { f('chat'); }); },
    markRead: function (convId) { var c = byId(S.convs, convId); if (c && c.unread) { c.unread = 0; save(); subs.forEach(function (f) { f('chat'); }); } },

    /* ---------- notifications & settings ---------- */
    readNote: function (id) { var n = byId(S.notifications, id); if (n) n.read = true; save(); subs.forEach(function (f) { f('meta'); }); },
    readAll: function () { S.notifications.forEach(function (n) { n.read = true; }); save(); subs.forEach(function (f) { f('meta'); }); },
    saveSettings: function (o) {
      if (!(o.saleRate > 0 && o.saleRate <= 10)) fail('Sale commission must be between 0 and 10%.');
      if (!(o.rentMonths > 0 && o.rentMonths <= 3)) fail('Letting fee must be between 0 and 3 months of rent.');
      if (!(o.monthlyTarget > 0)) fail('Enter a monthly target.');
      Object.assign(S.settings, o); commit({ kind: 'settings', text: 'Agency settings updated' });
    }
  };
})();
