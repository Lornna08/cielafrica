/* ============================================================
   Reside Ke — Listings, property workspace, pricing tool, listing form
   ============================================================ */
(function () {
  'use strict';
  var I = ES.icon, st = ES.store, f = ES.fmt, esc = f.esc, DAY = 864e5;
  var U = ES.ui.listings, PRICE = ES.ui.pricing = {};
  var PER = 12;

  function priceLabel(p) { return f.money(p.price, true) + (p.category === 'rent' ? '<small> /mo</small>' : ''); }
  ES.priceLabel = priceLabel;
  function isHouse(p) { return /house|villa|townhouse/i.test(p.type); }

  /* ======================= LIST ======================= */
  function filtered() {
    var q = U.q.toLowerCase(), now = Date.now();
    var src = U.status === 'sold' ? st.s.properties : st.listings();
    var L = src.filter(function (p) {
      if (U.cat && p.category !== U.cat) return false;
      if (U.type && p.type !== U.type) return false;
      if (U.status && p.status !== U.status) return false;
      if (U.area && p.area !== U.area) return false;
      if (U.beds && p.beds < +U.beds) return false;
      if (U.agent && p.agentId !== U.agent) return false;
      if (U.min && p.price < +U.min) return false;
      if (U.max && p.price > +U.max) return false;
      if (U.listed && now - new Date(p.listedAt) > +U.listed * DAY) return false;
      if (q && (p.title + ' ' + p.ref + ' ' + p.area + ' ' + p.address + ' ' + p.type).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    var sorts = { newest: function (a, b) { return new Date(b.listedAt) - new Date(a.listedAt); }, high: function (a, b) { return b.price - a.price; }, low: function (a, b) { return a.price - b.price; }, views: function (a, b) { return b.views - a.views; }, dom: function (a, b) { return st.daysOnMarket(b) - st.daysOnMarket(a); } };
    return L.sort(sorts[U.sort] || sorts.newest);
  }
  var PRICE_OPTS = { sale: [0, 10e6, 20e6, 40e6, 60e6, 80e6, 100e6, 150e6, 300e6], rent: [0, 50e3, 100e3, 150e3, 200e3, 300e3, 500e3, 1e6] };

  ES.pages.listings = {
    render: function (v) {
      var L = filtered(), all = st.listings(), pages = Math.max(1, Math.ceil(L.length / PER));
      if (U.page > pages) U.page = pages;
      var slice = L.slice((U.page - 1) * PER, U.page * PER);
      var active = all.filter(function (p) { return p.status === 'active'; });
      var po = PRICE_OPTS[U.cat === 'rent' ? 'rent' : 'sale'];
      var leadsBy = {}; st.s.leads.forEach(function (l) { if (l.propertyId) leadsBy[l.propertyId] = (leadsBy[l.propertyId] || 0) + 1; });
      var filtersOn = ['type', 'status', 'area', 'beds', 'agent', 'min', 'max', 'listed', 'q'].some(function (k) { return U[k]; });

      v.innerHTML =
        '<header class="ph"><h1>Listings</h1><div class="ph__k">' +
        kq('home', active.filter(function (p) { return p.category === 'sale'; }).length, 'For sale · active') +
        kq('key', active.filter(function (p) { return p.category === 'rent'; }).length, 'For rent · available') +
        kq('tag', all.filter(function (p) { return p.status === 'under_offer'; }).length, 'Under offer') +
        kq('eye', f.n(all.reduce(function (a, p) { return a + p.views; }, 0)), 'Listing views') +
        '</div><div class="ph__a"><button class="btn" data-l="csv">' + I('download', 15) + 'Export CSV</button><a class="btn btn--dark" href="#/listings/new">' + I('plus', 15) + 'New listing</a></div></header>' +
        '<div class="tb"><span class="seg" role="group" aria-label="Category">' + [['', 'All'], ['sale', 'For sale'], ['rent', 'For rent']].map(function (o) { return '<button data-l="cat" data-v="' + o[0] + '" class="' + (U.cat === o[0] ? 'is-on' : '') + '">' + o[1] + '</button>'; }).join('') + '</span>' +
        '<label class="tb__s">' + I('search', 15) + '<input type="search" data-f="q" placeholder="Search title, area, EST-ref…" value="' + esc(U.q) + '" aria-label="Search listings"></label>' +
        '<span class="tb__sp"></span><span class="seg" role="group" aria-label="View"><button data-l="view" data-v="grid" class="' + (U.view === 'grid' ? 'is-on' : '') + '" aria-label="Grid view">' + I('grid', 14) + '</button><button data-l="view" data-v="table" class="' + (U.view === 'table' ? 'is-on' : '') + '" aria-label="Table view">' + I('list', 14) + '</button></span></div>' +
        '<div class="tb">' +
        sel('type', 'Property type', ES.PTYPES) +
        sel('status', 'Any status', [{ v: 'active', l: 'Active' }, { v: 'under_offer', l: 'Under offer' }, { v: 'let', l: 'Let' }, { v: 'sold', l: 'Sold' }, { v: 'draft', l: 'Draft' }]) +
        sel('area', 'Any location', ES.AREAS.filter(function (a) { return all.some(function (p) { return p.area === a; }); })) +
        sel('beds', 'Bedrooms', [1, 2, 3, 4, 5].map(function (n) { return { v: n, l: n + '+ beds' }; })) +
        sel('min', 'Min price', po.slice(1).map(function (n) { return { v: n, l: 'From ' + f.money(n, true) }; })) +
        sel('max', 'Max price', po.slice(1).map(function (n) { return { v: n, l: 'Up to ' + f.money(n, true) }; })) +
        sel('agent', 'Any agent', st.s.team.map(function (u) { return { v: u.id, l: u.name }; })) +
        sel('listed', 'Date listed', [{ v: 7, l: 'Last 7 days' }, { v: 30, l: 'Last 30 days' }, { v: 90, l: 'Last 90 days' }]) +
        '<span class="tb__sp"></span>' + (filtersOn ? '<button class="btn btn--sm btn--ghost" data-l="clear">' + I('x', 13) + 'Clear filters</button>' : '') +
        '<select data-f="sort" aria-label="Sort">' + [['newest', 'Newest first'], ['high', 'Price: high to low'], ['low', 'Price: low to high'], ['views', 'Most viewed'], ['dom', 'Longest on market']].map(function (o) { return '<option value="' + o[0] + '"' + (U.sort === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div>' +
        (L.length ? (U.view === 'grid' ? grid(slice, leadsBy) : table(slice, leadsBy)) : ES.empty('search', 'No listings match', 'Try removing a filter or searching for something broader.', '<button class="btn" data-l="clear">Clear filters</button>')) +
        (L.length ? '<div class="pager"><span>Showing ' + ((U.page - 1) * PER + 1) + '–' + Math.min(L.length, U.page * PER) + ' of ' + L.length + '</span><span class="pager__b"><button class="btn btn--sm" data-l="pg" data-v="-1"' + (U.page <= 1 ? ' disabled' : '') + '>' + I('left', 14) + 'Previous</button><button class="btn btn--sm" data-l="pg" data-v="1"' + (U.page >= pages ? ' disabled' : '') + '>Next' + I('right', 14) + '</button></span></div>' : '');

      v.oninput = function (e) {
        var el = e.target.closest('[data-f]'); if (!el) return;
        U[el.dataset.f] = el.value; U.page = 1;
        if (el.dataset.f === 'q') { clearTimeout(v._t); v._t = setTimeout(function () { ES.app.refresh(); var i = v.querySelector('[data-f=q]'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 180); }
        else ES.app.refresh();
      };
      v.onclick = function (e) {
        var b = e.target.closest('[data-l]'), r = e.target.closest('tr[data-href]');
        if (r && !b) { ES.app.go(r.dataset.href); return; }
        if (!b) return;
        var k = b.dataset.l;
        if (k === 'cat') { U.cat = b.dataset.v; U.min = U.max = ''; U.page = 1; }
        if (k === 'view') U.view = b.dataset.v;
        if (k === 'pg') { U.page += +b.dataset.v; window.scrollTo(0, 0); }
        if (k === 'clear') { ['type', 'status', 'area', 'beds', 'agent', 'min', 'max', 'listed', 'q'].forEach(function (x) { U[x] = ''; }); U.page = 1; }
        if (k === 'csv') { ES.csv('reside-ke-listings.csv', [['Ref', 'Title', 'Type', 'Category', 'Status', 'Location', 'Asking (KES)', 'Beds', 'Baths', 'Size (m²)', 'Agent', 'Date listed', 'Views', 'Leads']].concat(L.map(function (p) { return [p.ref, p.title, p.type, p.category, f.status(p.status), p.area, p.price, p.beds, p.baths, p.size, st.user(p.agentId).name, f.dateLong(p.listedAt), p.views, leadsBy[p.id] || 0]; }))); return; }
        ES.app.refresh();
      };
    }
  };
  function kq(ic, val, label) { return '<div class="kq"><span class="kq__ic">' + I(ic, 16) + '</span><span class="kq__b"><b>' + val + '</b><em>' + label + '</em></span></div>'; }
  function sel(k, ph, opts) { return '<select data-f="' + k + '" aria-label="' + ph + '"><option value="">' + ph + '</option>' + opts.map(function (o) { var val = typeof o === 'object' ? o.v : o, l = typeof o === 'object' ? o.l : o; return '<option value="' + val + '"' + (String(U[k]) === String(val) ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('') + '</select>'; }
  function grid(L, leadsBy) {
    return '<div class="lg">' + L.map(function (p) {
      return '<a class="lc" href="#/property/' + p.id + '"><div class="lc__m"><img src="' + p.images[0] + '" alt="' + esc(p.title) + '" loading="lazy"><span class="lc__tag">' + ES.pill(p.category === 'rent' ? 'For rent' : 'For sale', p.category === 'rent' ? 'dark' : 'blue') + ES.statusPill(p.status) + '</span><span class="lc__ph">' + ES.av(st.user(p.agentId), 28) + '</span></div>' +
        '<div class="lc__b"><span class="lc__t">' + esc(p.title) + '</span><span class="lc__l">' + I('pin', 12) + esc(p.area) + ' · ' + esc(p.type) + '</span><span class="lc__p">' + priceLabel(p) + '</span>' +
        '<span class="lc__s">' + (p.beds ? '<span>' + I('bed', 14) + p.beds + ' bd</span>' : '') + '<span>' + I('bath', 14) + p.baths + ' ba</span><span>' + I('area', 14) + f.n(p.size) + ' m²</span></span>' +
        '<span class="lc__f"><span>' + p.ref + ' · ' + st.daysOnMarket(p) + ' days</span><span>' + (leadsBy[p.id] || 0) + ((leadsBy[p.id] || 0) === 1 ? ' lead · ' : ' leads · ') + f.n(p.views) + ' views</span></span></div></a>';
    }).join('') + '</div>';
  }
  function table(L, leadsBy) {
    return '<div class="t-wrap"><table class="t"><thead><tr><th>Property</th><th>Type</th><th>Location</th><th class="r">Asking price</th><th>Agent</th><th>Status</th><th>Listed</th><th class="r">Leads</th><th class="r">Views</th></tr></thead><tbody>' +
      L.map(function (p) { var u = st.user(p.agentId); return '<tr data-href="#/property/' + p.id + '"><td><span class="t-prop"><img src="' + p.images[0] + '" alt="" loading="lazy"><span><b>' + esc(p.title) + '</b><em>' + p.ref + ' · ' + (p.category === 'rent' ? 'For rent' : 'For sale') + '</em></span></span></td><td>' + esc(p.type) + '</td><td>' + esc(p.area) + '</td><td class="r num"><b>' + priceLabel(p) + '</b></td><td><span class="t-who">' + ES.av(u, 24) + esc(u.name.split(' ')[0]) + '</span></td><td>' + ES.statusPill(p.status) + '</td><td>' + f.date(p.listedAt) + '</td><td class="r">' + (leadsBy[p.id] || 0) + '</td><td class="r">' + f.n(p.views) + '</td></tr>'; }).join('') + '</tbody></table></div>';
  }

  /* ======================= PROPERTY WORKSPACE ======================= */
  var TABS = [['overview', 'Overview'], ['viewings', 'Viewings'], ['offers', 'Offers & deals'], ['leads', 'Leads'], ['activity', 'Activity'], ['documents', 'Documents'], ['notes', 'Notes'], ['owner', 'The owner']];
  ES.pages.property = {
    render: function (v, params) {
      var p = st.prop(params[0]);
      if (!p) { v.innerHTML = ES.empty('building', 'Listing not found', 'It may have been removed when the demo was reset.', '<a class="btn" href="#/listings">Back to listings</a>'); return; }
      var tab = params[1] || 'overview', deals = st.dealsFor(p.id), ev = st.eventsFor(p.id), leads = st.leadsFor(p.id), docs = st.docsFor(p.id);
      var viewings = ev.filter(function (e) { return e.type === 'viewing'; });
      var openD = deals.filter(function (d) { return d.stage !== 'won' && d.stage !== 'lost'; });
      var furthest = openD.reduce(function (m, d) { return Math.max(m, ES.STAGES.map(function (s) { return s.id; }).indexOf(d.stage)); }, -1);
      var closing = p.status === 'sold' || p.status === 'let' || furthest >= 4;
      var agent = st.user(p.agentId), coord = st.user('u7');
      var viewAgents = []; viewings.forEach(function (e) { if (viewAgents.indexOf(e.agentId) < 0) viewAgents.push(e.agentId); });
      var steps = [
        { n: 1, l: 'Listing', done: true, av: [agent] },
        { n: 2, l: 'Marketing', done: p.images.length >= 2, av: [coord] },
        { n: 3, l: 'Viewings', done: closing, cur: !closing && viewings.length > 0, av: viewAgents.slice(0, 3).map(st.user) },
        { n: 4, l: 'Closing', done: p.status === 'sold' || p.status === 'let', cur: closing && !(p.status === 'sold' || p.status === 'let'), av: openD.filter(function (d) { return d.stage === 'under_offer' || d.stage === 'contract'; }).slice(0, 1).map(function (d) { return st.user(d.agentId); }) }
      ];
      if (!steps.some(function (s) { return s.cur; })) { var nx = steps.filter(function (s) { return !s.done; })[0]; if (nx) nx.cur = true; }

      v.innerHTML =
        '<a class="back" href="#/listings">' + I('left', 14) + 'Listings</a>' +
        '<header class="pd-h"><div><h1>' + esc(p.title) + '</h1><div class="pd-h__sub">' + I('pin', 13) + esc(p.address) + (p.city !== 'Nairobi' ? ', ' + esc(p.city) : '') + ' <span class="dot dot--' + (p.status === 'active' ? 'b' : p.status === 'under_offer' ? 'a' : 'g') + '"></span><b style="color:var(--ink)">' + (p.category === 'rent' ? 'For rent' : 'For sale') + ' · ' + f.status(p.status) + '</b> · ' + p.ref + '</div></div>' +
        '<div class="pd-h__tools"><button class="ib" data-p="book" title="Book a viewing" aria-label="Book a viewing">' + I('cal', 16) + '</button><button class="ib" data-p="photos" title="Photos" aria-label="Photos">' + I('image', 16) + '</button><button class="ib' + (p.featured ? ' is-on' : '') + '" data-p="feature" title="' + (p.featured ? 'Featured on overview' : 'Feature on overview') + '" aria-label="Toggle featured">' + I('star', 16) + '</button><button class="ib" data-p="offer" title="Record an offer" aria-label="Record an offer">' + I('tag', 16) + '</button><a class="ib" href="#/property/' + p.id + '/edit" title="Edit listing" aria-label="Edit listing">' + I('edit', 16) + '</a><button class="ib" data-p="share" title="Copy listing link" aria-label="Share">' + I('share', 16) + '</button></div>' +
        '<div class="pd-h__a"><button class="btn" data-p="status">' + I('refresh', 15) + 'Status</button><button class="btn btn--dark" data-p="print">' + I('print', 15) + 'Print brochure</button></div></header>' +
        '<nav class="steps" aria-label="Listing progress">' + steps.map(function (s, i) { return (i ? '<span class="steps__line"></span>' : '') + '<span class="step' + (s.done ? ' is-done' : '') + (s.cur ? ' is-cur' : '') + '"><span class="step__n">' + (s.done ? I('check', 14) : s.n + '.') + '</span>' + s.l + (s.av.length ? '<span class="avs">' + s.av.map(function (u) { return ES.av(u, 24); }).join('') + '</span>' : '') + '</span>'; }).join('') + '</nav>' +
        '<nav class="stabs" aria-label="Property sections">' + TABS.map(function (t) { var n = { viewings: viewings.length, offers: deals.length, leads: leads.length, documents: docs.length, notes: p.notes.length }[t[0]]; return '<a href="#/property/' + p.id + (t[0] === 'overview' ? '' : '/' + t[0]) + '" class="stab' + (tab === t[0] ? ' is-on' : '') + '">' + t[1] + (n ? '<i>' + n + '</i>' : '') + '</a>'; }).join('') + '</nav>' +
        '<div id="pdBody"></div>';
      var body = v.querySelector('#pdBody');
      (SECTIONS[tab] || SECTIONS.overview)(body, p, { deals: deals, viewings: viewings, leads: leads, docs: docs, events: ev });

      v.onclick = function (e) {
        var b = e.target.closest('[data-p]'); if (!b) return;
        var k = b.dataset.p;
        if (k === 'book') ES.pages.calendar.edit(null, { type: 'viewing', propertyId: p.id, agentId: p.agentId });
        if (k === 'photos') gallery(p, 0);
        if (k === 'feature') { st.listings().forEach(function (x) { x.featured = false; }); p.featured = true; ES.try(function () { st.saveListing({ title: p.title, price: p.price, minPrice: p.minPrice }, p.id); }, p.title + ' is now the featured listing'); }
        if (k === 'offer') ES.pages.deal.offerModal(null, p.id);
        if (k === 'share') { var url = location.href; (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () { ES.toast('Listing link copied'); }, function () { ES.toast('Copy failed — use the address bar', 'err'); }); }
        if (k === 'print') window.print();
        if (k === 'status') ES.menu(b, ['active', 'under_offer', p.category === 'rent' ? 'let' : 'sold', 'draft', 'withdrawn'].map(function (s) { return { label: f.status(s), on: p.status === s, s: s }; }), function (it) { if (it.s !== p.status) ES.try(function () { st.setListingStatus(p.id, it.s); }, 'Status changed to ' + f.status(it.s)); });
        if (k === 'gal') gallery(p, +b.dataset.i);
        if (k === 'plan') floorPlan(p, b.dataset.f);
        if (k === 'pvp' || k === 'pvn') { var ui = PRICE[p.id + ':pv'] || 0, n = p.images.length; ui = (ui + (k === 'pvn' ? 1 : -1) + n) % n; PRICE[p.id + ':pv'] = ui; var img = v.querySelector('.pv__main img'); img.src = p.images[ui]; v.querySelectorAll('.thumbs button').forEach(function (t, i) { t.classList.toggle('is-on', i === ui); }); }
        if (k === 'thumb') { PRICE[p.id + ':pv'] = +b.dataset.i; v.querySelector('.pv__main img').src = p.images[+b.dataset.i]; v.querySelectorAll('.thumbs button').forEach(function (t, i) { t.classList.toggle('is-on', i === +b.dataset.i); }); }
      };
    }
  };

  var SECTIONS = {
    overview: function (el, p, x) {
      var u = st.user(p.agentId), owner = st.contact(p.ownerId), pvi = PRICE[p.id + ':pv'] || 0;
      var house = isHouse(p) && p.floors > 1;
      el.innerHTML = '<div class="pd-grid"><div class="pd-col">' +
        '<article class="card pr" id="priceCard"></article>' +
        '<article class="card"><header class="card__h"><span class="card__t">' + I('list', 16) + 'Overview</span><a class="ib" href="#/property/' + p.id + '/edit" aria-label="Edit">' + I('edit', 15) + '</a></header>' +
        '<dl class="kv"><dt>Request type</dt><dd>' + (p.category === 'rent' ? 'Rent' : 'Sale') + '</dd><dt>Property type</dt><dd>' + esc(p.type) + '</dd><dt>Reference</dt><dd>' + p.ref + '</dd><dt>Listed</dt><dd>' + f.dateLong(p.listedAt) + ' · ' + st.daysOnMarket(p) + ' days</dd>' + (p.plot ? '<dt>Plot</dt><dd>' + esc(p.plot) + '</dd>' : '') + '<dt>Parking</dt><dd>' + p.parking + ' bays</dd><dt>Published</dt><dd>' + (p.published ? ES.pill('Live on website', 'green') : ES.pill('Not published', 'grey')) + '</dd><dt>Views · leads</dt><dd>' + f.n(p.views) + ' views · ' + x.leads.length + ' leads</dd></dl></article>' +
        '<article class="card"><header class="card__h"><span class="card__t">' + I('file', 16) + 'Description</span></header><p class="desc">' + esc(p.description || 'No description yet.') + '</p>' + (p.amenities.length ? '<div class="amen" style="margin-top:14px">' + p.amenities.map(function (a) { return '<span class="chip chip--soft">' + esc(a) + '</span>'; }).join('') + '</div>' : '') + '</article>' +
        '</div><div class="pd-col">' +
        '<article class="card"><header class="card__h"><span class="card__t">' + I('image', 16) + 'Preview</span><span class="card__x"><span class="muted" style="font-size:12px">' + (pvi + 1) + ' / ' + p.images.length + '</span><button class="ib" data-p="photos" aria-label="Open gallery">' + I('expand', 15) + '</button></span></header>' +
        '<div class="pv__m"><div class="pv__main"><img src="' + p.images[pvi] + '" alt="' + esc(p.title) + '" data-p="gal" data-i="' + pvi + '" style="cursor:zoom-in"><div class="pv__tag"><span>' + esc(p.type) + '</span><span class="' + (p.status === 'active' ? 'is-g' : '') + '">' + (p.status === 'active' ? 'Active' : f.status(p.status)) + '</span></div><div class="pv__nav"><button data-p="pvp" aria-label="Previous photo">' + I('left', 15) + '</button><button data-p="pvn" aria-label="Next photo">' + I('right', 15) + '</button></div></div>' +
        '<div class="pv__plans">' + (house ? '<button class="pv__plan" data-p="plan" data-f="ground">' + miniPlan('ground') + 'Ground floor</button><button class="pv__plan" data-p="plan" data-f="upper">' + miniPlan('upper') + 'Upper floor</button>' : '<button class="pv__plan" data-p="plan" data-f="ground">' + miniPlan(p.beds ? 'upper' : 'office') + 'Floor plan</button>') + '</div></div>' +
        (p.images.length > 1 ? '<div class="thumbs">' + p.images.map(function (src, i) { return '<button data-p="thumb" data-i="' + i + '" class="' + (i === pvi ? 'is-on' : '') + '" aria-label="Photo ' + (i + 1) + '"><img src="' + src + '" alt="" loading="lazy"></button>'; }).join('') + '</div>' : '') + '</article>' +
        '<article class="card"><div class="specs">' + spec('area', 'Area', f.n(p.size) + ' m²') + spec('layers', 'Floors', p.floors) + (p.beds ? spec('bed', 'Bedrooms', p.beds) : spec('car', 'Parking', p.parking)) + spec('bath', 'Bathrooms', p.baths) + '</div></article>' +
        '<article class="card"><header class="card__h"><span class="card__t">' + I('user', 16) + 'People</span></header><div class="mini">' +
        '<div class="mini__i">' + ES.av(u, 34) + '<span class="grow"><b>' + esc(u.name) + '</b><em>Listing agent · ' + esc(u.phone) + '</em></span><a class="ib" href="tel:' + u.phone.replace(/\s/g, '') + '" aria-label="Call">' + I('phone', 15) + '</a></div>' +
        (owner ? '<a class="mini__i" href="#/contact/' + owner.id + '">' + ES.cav(owner, 34) + '<span class="grow"><b>' + esc(owner.name) + '</b><em>' + (p.category === 'rent' ? 'Landlord' : 'Owner / seller') + ' · ' + esc(owner.phone) + '</em></span>' + I('right', 14) + '</a>' : '') +
        x.deals.filter(function (d) { return d.stage !== 'lost'; }).slice(0, 3).map(function (d) { var b = st.contact(d.buyerId); return '<a class="mini__i" href="#/deal/' + d.id + '">' + ES.cav(b, 34) + '<span class="grow"><b>' + esc(b.name) + '</b><em>' + (d.kind === 'rent' ? 'Tenant' : 'Buyer') + ' · ' + st.stage(d.stage).short + ' · ' + f.money(d.value, true) + '</em></span>' + I('right', 14) + '</a>'; }).join('') +
        '</div></article>' +
        '</div></div>';
      pricing(el.querySelector('#priceCard'), p);
    },
    viewings: function (el, p, x) {
      var ev = x.events.slice().sort(function (a, b) { return new Date(b.start) - new Date(a.start); });
      el.innerHTML = '<div class="tb"><span class="tb__n">' + x.viewings.length + ' viewings · ' + ev.length + ' events on this listing</span><span class="tb__sp"></span><button class="btn btn--dark" data-p="book">' + I('plus', 15) + 'Book a viewing</button></div>' +
        (ev.length ? '<div class="agenda">' + ev.map(function (e) { return ES.pages.calendar.agItem(e); }).join('') + '</div>' : ES.empty('cal', 'No viewings yet', 'Book the first viewing for this property.'));
      el.onclick = function (e) { var b = e.target.closest('[data-ev]'); if (b) ES.pages.calendar.open(b.dataset.ev); };
    },
    offers: function (el, p, x) {
      el.innerHTML = '<div class="tb"><span class="tb__n">' + x.deals.length + ' deals on this listing</span><span class="tb__sp"></span><button class="btn" data-p="newdeal">' + I('plus', 15) + 'New deal</button><button class="btn btn--dark" data-p="offer">' + I('tag', 15) + 'Record an offer</button></div>' +
        (x.deals.length ? '<div class="t-wrap"><table class="t"><thead><tr><th>Deal</th><th>Buyer / tenant</th><th>Stage</th><th class="r">Value</th><th class="r">vs asking</th><th>Latest offer</th><th>Expected close</th></tr></thead><tbody>' + x.deals.map(function (d) { var b = st.contact(d.buyerId), lo = d.offers[d.offers.length - 1], diff = (d.value - p.price) / p.price * 100; return '<tr data-href="#/deal/' + d.id + '"><td><b>' + d.ref + '</b></td><td><span class="t-who">' + ES.cav(b, 26) + esc(b.name) + '</span></td><td>' + ES.pill(st.stage(d.stage).short, d.stage === 'won' ? 'green' : d.stage === 'lost' ? 'red' : 'blue') + '</td><td class="r"><b>' + f.money(d.value, true) + '</b></td><td class="r">' + ES.delta(diff) + '</td><td>' + (lo ? f.money(lo.amount, true) + ' <span class="t-sub">' + lo.status + ' · ' + f.date(lo.at) + '</span>' : '<span class="muted">—</span>') + '</td><td>' + f.date(d.expectedClose) + '</td></tr>'; }).join('') + '</tbody></table></div>' : ES.empty('tag', 'No offers yet', 'Record an offer or create a deal when a buyer is serious.'));
      el.onclick = function (e) { var r = e.target.closest('tr[data-href]'); if (r) ES.app.go(r.dataset.href); var b = e.target.closest('[data-p=newdeal]'); if (b) ES.pages.deal.newModal({ propertyId: p.id }); };
    },
    leads: function (el, p, x) {
      el.innerHTML = '<div class="tb"><span class="tb__n">' + x.leads.length + ' leads interested in this property</span><span class="tb__sp"></span><button class="btn btn--dark" data-ld="new">' + I('plus', 15) + 'Add lead</button></div>' +
        (x.leads.length ? ES.pages.leads.table(x.leads) : ES.empty('user', 'No leads yet', 'Leads from your website and portals will appear here.'));
      el.onclick = function (e) { var r = e.target.closest('[data-lead]'); if (r) ES.pages.leads.open(r.dataset.lead); if (e.target.closest('[data-ld=new]')) ES.pages.leads.edit(null, { propertyId: p.id, agentId: p.agentId, location: p.area, ptype: p.type }); };
    },
    activity: function (el, p, x) {
      var ids = x.deals.map(function (d) { return d.id; });
      var A = st.s.activity.filter(function (a) { return a.ref && ((a.ref.type === 'property' && a.ref.id === p.id) || (a.ref.type === 'deal' && ids.indexOf(a.ref.id) > -1)); });
      A = A.concat([{ at: p.listedAt, kind: 'listing', text: 'Listing created — ' + p.title, by: p.agentId }]);
      el.innerHTML = '<article class="card">' + (A.length ? timeline(A) : ES.empty('clock', 'No activity yet', '')) + '</article>';
    },
    documents: function (el, p, x) {
      el.innerHTML = '<div class="tb"><span class="tb__n">' + x.docs.length + ' documents</span><span class="tb__sp"></span><button class="btn btn--dark" data-doc="up">' + I('upload', 15) + 'Add document</button></div>' + (x.docs.length ? ES.pages.documents.table(x.docs) : ES.empty('file', 'No documents yet', 'Upload listing agreements, inspections and photos here.'));
      el.onclick = function (e) { if (e.target.closest('[data-doc=up]')) ES.pages.documents.upload({ propertyId: p.id }); var r = e.target.closest('[data-docid]'); if (r) ES.pages.documents.open(r.dataset.docid); };
    },
    notes: function (el, p) {
      el.innerHTML = '<article class="card"><form class="note-f"><textarea name="t" placeholder="Add an internal note — only your team can see it" aria-label="Note"></textarea><button class="btn btn--dark">Add note</button></form>' +
        (p.notes.length ? p.notes.map(function (n) { return '<div class="note">' + esc(n.text) + '<em>' + esc(st.user(n.by).name) + ' · ' + f.ago(n.at) + '</em></div>'; }).join('') : ES.empty('edit', 'No notes yet', 'Notes are internal and never shown to clients.')) + '</article>';
      el.querySelector('form').onsubmit = function (e) { e.preventDefault(); ES.try(function () { st.addPropertyNote(p.id, e.target.t.value); }, 'Note added'); };
    },
    owner: function (el, p) {
      var c = st.contact(p.ownerId);
      el.innerHTML = c ? '<article class="card" style="max-width:640px"><div class="mini__i" style="border:0">' + ES.cav(c, 48) + '<span class="grow"><b style="font-size:16px">' + esc(c.name) + '</b><em>' + c.types.join(' · ') + '</em></span><a class="btn" href="#/contact/' + c.id + '">Open contact ' + I('right', 14) + '</a></div><dl class="kv" style="margin-top:12px"><dt>Phone</dt><dd><a href="tel:' + c.phone.replace(/\s/g, '') + '">' + esc(c.phone) + '</a></dd><dt>Email</dt><dd><a href="mailto:' + esc(c.email) + '">' + esc(c.email) + '</a></dd>' + (c.company ? '<dt>Company</dt><dd>' + esc(c.company) + '</dd>' : '') + '<dt>Other listings</dt><dd>' + (st.listings().filter(function (x) { return x.ownerId === c.id && x.id !== p.id; }).map(function (x) { return '<a class="lnk" href="#/property/' + x.id + '">' + esc(x.title) + '</a>'; }).join(', ') || '—') + '</dd></dl><p class="badge-sample" style="margin-top:14px">' + I('info', 12) + 'Synthetic contact for the demo</p></article>' : ES.empty('user', 'No owner linked', 'Edit the listing to link an owner or landlord.');
    }
  };
  ES.timeline = timeline;
  function timeline(A) {
    return '<div class="tl">' + A.sort(function (a, b) { return new Date(b.at) - new Date(a.at); }).map(function (a) { var h = ES.refLink(a.ref); return '<div class="tl__i"><span class="tl__ic">' + I(ES.actIcon[a.kind] || 'info', 13) + '</span><span class="tl__t">' + (h ? '<a href="' + h + '">' + esc(a.text) + '</a>' : esc(a.text)) + '<em>' + f.dt(a.at) + ' · ' + esc(st.user(a.by).name) + '</em></span></div>'; }).join('') + '</div>';
  }
  function spec(ic, l, v) { return '<div class="spec"><span class="spec__ic">' + I(ic, 17) + '</span><span>' + l + '<b>' + v + '</b></span></div>'; }

  /* ---------------- pricing tool ---------------- */
  function verdict(diffPct) {
    if (diffPct > 4) return { label: 'High risk', tone: 'red', ins: 'red', g: 'red' };
    if (diffPct > 2) return { label: 'Above market', tone: 'amber', ins: 'amber', g: 'amber' };
    if (diffPct < -6) return { label: 'Under-priced', tone: 'blue', ins: 'blue', g: 'amber' };
    return { label: 'Fair price', tone: 'green', ins: 'green', g: 'amber' };
  }
  function pricing(el, p) {
    var rent = p.category === 'rent', step = rent ? 1000 : 500000;
    var lo = Math.round(p.estimate * 0.85 / step) * step, hi = Math.round(p.estimate * 1.15 / step) * step;
    var S = PRICE[p.id] = PRICE[p.id] || { target: p.price, min: p.minPrice };
    S.target = Math.max(lo, Math.min(hi, S.target)); S.min = Math.max(lo, Math.min(S.target, S.min));
    function shortM(v) { return rent ? f.money(v, true).replace('KES ', 'KES ') : f.money(v, true); }
    function frac(v) { return (v - lo) / (hi - lo); }
    el.innerHTML = '<header class="card__h"><span class="card__t">' + I('list', 16) + 'Price</span><span class="card__x"><span class="badge-sample">' + I('info', 12) + 'Sample estimate</span></span></header>' +
      '<div class="pr__g"><div id="gauge"></div><div class="pr__c"><span>Target ' + (rent ? 'monthly rent' : 'home price') + '</span><b id="prBig"></b><span id="prPill"></span></div></div>' +
      '<div class="pr__cols"><div><div class="pr__k">Target price</div><div class="pr__v"><b id="prT"></b><em id="prTv"></em></div>' +
      '<div class="rng"><span class="rng__t"></span><span class="rng__f" id="fT"></span><span class="rng__ticks"></span><input type="range" min="' + lo + '" max="' + hi + '" step="' + step + '" value="' + S.target + '" id="rT" aria-label="Target price"><span class="rng__k" id="kT"><i></i><i></i><i></i></span></div></div>' +
      '<div><div class="pr__k">Lowest acceptable</div><div class="pr__v"><b id="prM"></b><em class="muted" id="prRoom"></em></div>' +
      '<div class="rng"><span class="rng__t"></span><span class="rng__f rng__f--dark" id="fM"></span><span class="rng__ticks"></span><input type="range" min="' + lo + '" max="' + hi + '" step="' + step + '" value="' + S.min + '" id="rM" aria-label="Lowest acceptable price"><span class="rng__k" id="kM"><i></i><i></i><i></i></span></div></div></div>' +
      '<div class="ins" id="prIns" role="status"></div>' +
      '<p class="pr__note">' + I('info', 12) + 'Market estimate of ' + f.money(p.estimate, true) + ' is demo sample data, not an independent valuation.</p>' +
      '<div class="pr__acts"><button class="btn" id="prCancel">Cancel</button><button class="btn btn--dark" id="prSave">Save changes</button></div>';
    var rT = el.querySelector('#rT'), rM = el.querySelector('#rM');
    function upd() {
      var t = S.target, m = S.min, diff = (t - p.estimate) / p.estimate * 100, vd = verdict(diff), dAbs = t - p.estimate;
      el.querySelector('#gauge').innerHTML = ES.gauge({ fe: frac(p.estimate), ft: frac(t), tone: vd.g, diffLabel: (dAbs >= 0 ? '+' : '−') + f.money(Math.abs(dAbs), true).replace('KES ', '') });
      el.querySelector('#prBig').textContent = shortM(t);
      el.querySelector('#prPill').innerHTML = ES.pill(vd.label, vd.tone);
      el.querySelector('#prT').textContent = shortM(t);
      el.querySelector('#prTv').innerHTML = '<span style="color:var(--' + (vd.tone === 'grey' ? 'ink-3' : vd.tone) + ')">' + vd.label + '</span>';
      el.querySelector('#prM').textContent = shortM(m);
      el.querySelector('#prRoom').textContent = f.money(t - m, true).replace('KES ', 'KES ') + ' room';
      el.querySelector('#fT').style.width = frac(t) * 100 + '%'; el.querySelector('#kT').style.left = frac(t) * 100 + '%';
      el.querySelector('#fM').style.width = frac(m) * 100 + '%'; el.querySelector('#kM').style.left = frac(m) * 100 + '%';
      var pct = Math.abs(diff).toFixed(1), ins = el.querySelector('#prIns');
      ins.className = 'ins ins--' + vd.ins;
      ins.innerHTML = I(Math.abs(diff) < 0.05 ? 'check' : 'alert', 16) + '<span>' + (Math.abs(diff) < 0.05 ? 'The price matches the sample market estimate of ' + f.money(p.estimate, true) + '.' : 'The price is ' + pct + '% ' + (diff > 0 ? 'above' : 'below') + ' the sample market estimate of ' + f.money(p.estimate, true) + (diff > 4 ? ' — expect fewer viewings.' : diff > 2 ? ' — buyers may negotiate hard.' : diff < -6 ? ' — you may be leaving money on the table.' : '.')) + '</span>';
      var dirty = t !== p.price || m !== p.minPrice, save = el.querySelector('#prSave');
      save.disabled = !dirty && !S.justSaved; el.querySelector('#prCancel').disabled = !dirty;
      if (!S.justSaved) { save.className = 'btn btn--dark'; save.innerHTML = 'Save changes'; }
    }
    rT.addEventListener('input', function () { S.justSaved = false; S.target = +rT.value; if (S.min > S.target) { S.min = S.target; rM.value = S.min; } upd(); });
    rM.addEventListener('input', function () { S.justSaved = false; S.min = Math.min(+rM.value, S.target); rM.value = S.min; upd(); });
    el.querySelector('#prCancel').onclick = function () { S.target = p.price; S.min = p.minPrice; rT.value = S.target; rM.value = S.min; upd(); };
    el.querySelector('#prSave').onclick = function () {
      if (ES.try(function () { st.setPrice(p.id, S.target, S.min); })) {
        S.justSaved = true; setTimeout(function () {
          var b = document.querySelector('#prSave'); if (b) { b.className = 'btn btn--ok'; b.innerHTML = I('check', 15) + 'Saved'; }
          setTimeout(function () { S.justSaved = false; var b2 = document.querySelector('#prSave'); if (b2) { b2.className = 'btn btn--dark'; b2.innerHTML = 'Save changes'; b2.disabled = true; } }, 1800);
        }, 60);
      }
    };
    upd();
  }

  /* ---------------- gallery & floor plans ---------------- */
  function gallery(p, i) {
    var panel = ES.open('modal', ES.head(p.title, p.images.length + ' photos · ' + esc(p.area)) + '<div class="ovl__body"><div class="pv__main" style="aspect-ratio:3/2"><img id="gImg" src="' + p.images[i] + '" alt=""><div class="pv__nav"><button data-g="-1" aria-label="Previous">' + I('left', 15) + '</button><button data-g="1" aria-label="Next">' + I('right', 15) + '</button></div></div><div class="thumbs">' + p.images.map(function (s, j) { return '<button data-gi="' + j + '" class="' + (j === i ? 'is-on' : '') + '"><img src="' + s + '" alt=""></button>'; }).join('') + '</div><p class="pr__note">' + I('info', 12) + 'Photography via Unsplash. Demo listing details are fictional.</p></div>', { wide: true, label: 'Photo gallery' });
    function show(j) { i = (j + p.images.length) % p.images.length; panel.querySelector('#gImg').src = p.images[i]; panel.querySelectorAll('[data-gi]').forEach(function (b, k) { b.classList.toggle('is-on', k === i); }); }
    panel.addEventListener('click', function (e) { var a = e.target.closest('[data-g]'), t = e.target.closest('[data-gi]'); if (a) show(i + +a.dataset.g); if (t) show(+t.dataset.gi); });
    panel.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') show(i + 1); if (e.key === 'ArrowLeft') show(i - 1); });
  }
  var PLANS = {
    ground: { w: 460, h: 300, rooms: [['Living', 0, 0, 190, 160, .24], ['Dining', 190, 0, 140, 160, .17], ['Pantry', 330, 0, 130, 110, .09], ['Garage', 0, 160, 110, 140, .12], ['WC', 110, 160, 80, 140, .06], ['Hall', 190, 160, 140, 140, .14], ['Kitchen', 330, 110, 130, 190, .18]] },
    upper: { w: 460, h: 300, rooms: [['Main bedroom', 0, 0, 180, 170, .26], ['En-suite', 180, 0, 100, 90, .08], ['Bedroom 2', 280, 0, 180, 150, .19], ['Landing', 180, 90, 100, 120, .08], ['Bath', 0, 170, 100, 130, .07], ['Bedroom 3', 100, 210, 180, 90, .14], ['Bedroom 4', 280, 150, 180, 150, .18]] },
    office: { w: 460, h: 300, rooms: [['Open office', 0, 0, 300, 300, .62], ['Boardroom', 300, 0, 160, 120, .15], ['Kitchenette', 300, 120, 160, 80, .09], ['Reception', 300, 200, 160, 100, .14]] }
  };
  function planSVG(kind, total, hl, cls) {
    var P = PLANS[kind], s = '<svg class="' + (cls || 'fp') + '" viewBox="-8 -8 ' + (P.w + 16) + ' ' + (P.h + 16) + '">';
    P.rooms.forEach(function (r) {
      s += '<rect x="' + r[1] + '" y="' + r[2] + '" width="' + r[3] + '" height="' + r[4] + '" class="fp-room' + (hl === r[0] ? ' is-hl' : '') + '"/>';
      if (!cls) s += '<text x="' + (r[1] + r[3] / 2) + '" y="' + (r[2] + r[4] / 2 - 2) + '" text-anchor="middle" class="fp-l">' + r[0] + '</text><text x="' + (r[1] + r[3] / 2) + '" y="' + (r[2] + r[4] / 2 + 16) + '" text-anchor="middle" class="fp-a">' + Math.round(total * r[5]) + ' m²</text>';
    });
    if (!cls) [[40, 0, 120, 0], [250, 0, 300, 0], [460, 40, 460, 90], [0, 210, 0, 260], [370, 300, 430, 300]].forEach(function (w) { s += '<line x1="' + w[0] + '" y1="' + w[1] + '" x2="' + w[2] + '" y2="' + w[3] + '" class="fp-win"/>'; });
    return s + '</svg>';
  }
  function miniPlan(kind) { return planSVG(kind, 0, null, 'fp-mini'); }
  function floorPlan(p, which) {
    var house = isHouse(p) && p.floors > 1, kind = !p.beds ? 'office' : (house ? which : 'upper'), per = house ? p.size / 2 : p.size;
    var panel = ES.open('modal', ES.head(house ? (kind === 'ground' ? 'Ground floor' : 'Upper floor') : 'Floor plan', esc(p.title) + ' · ' + f.n(Math.round(per)) + ' m² measured') + '<div class="ovl__body"><div id="fpBox">' + planSVG(kind, per) + '</div>' +
      (house ? '<div class="fp-tabs seg"><button data-fp="ground" class="' + (kind === 'ground' ? 'is-on' : '') + '">Ground floor</button><button data-fp="upper" class="' + (kind === 'upper' ? 'is-on' : '') + '">Upper floor</button></div>' : '') +
      '<div class="fp-rooms" id="fpRooms">' + PLANS[kind].rooms.map(function (r) { return '<span data-room="' + r[0] + '">' + r[0] + '<em>' + Math.round(per * r[5]) + ' m²</em></span>'; }).join('') + '</div><p class="pr__note">' + I('info', 12) + 'Indicative layout generated for the demo — not a surveyed plan.</p></div>', { wide: true, label: 'Floor plan' });
    panel.addEventListener('click', function (e) { var b = e.target.closest('[data-fp]'); if (b) { ES.close(); setTimeout(function () { floorPlan(p, b.dataset.fp); }, 230); } });
    panel.addEventListener('mouseover', function (e) { var r = e.target.closest('[data-room]'); if (r) panel.querySelector('#fpBox').innerHTML = planSVG(kind, per, r.dataset.room); });
  }

  /* ======================= LISTING FORM ======================= */
  var LIB = ['karura-1', 'karura-2', 'kitisuru-1', 'kitisuru-2', 'runda-1', 'diani-1', 'limuru-1', 'nyali-1', 'lavington-1', 'kileleshwa-1', 'karen-1', 'tigoni-1', 'apt-westlands', 'apt-kilimani', 'apt-parklands', 'apt-riverside', 'apt-upperhill', 'town-lavington', 'town-syokimau', 'town-ruaka', 'com-westlands', 'com-gigiri', 'com-mombasard', 'int-living-1', 'int-living-2', 'int-living-3', 'int-living-4', 'int-kitchen-1', 'int-kitchen-2', 'int-bed-1', 'int-bed-2', 'int-dining'].map(function (n) { return 'img/p/' + n + '.webp'; });
  function form(v, p) {
    var edit = !!p; p = p || { title: '', type: 'Detached house', category: 'sale', status: 'active', published: true, price: '', minPrice: '', area: 'Runda', city: 'Nairobi', address: '', beds: 4, baths: 3, size: '', plot: '', parking: 2, floors: 2, agentId: ES.config.userId, ownerId: '', amenities: [], images: [], description: '' };
    var owners = st.s.contacts.filter(function (c) { return c.types.some(function (t) { return t === 'owner' || t === 'seller' || t === 'landlord'; }); });
    var imgs = LIB.slice(); (p.images || []).forEach(function (s) { if (imgs.indexOf(s) < 0) imgs.unshift(s); });
    v.innerHTML = '<a class="back" href="' + (edit ? '#/property/' + p.id : '#/listings') + '">' + I('left', 14) + (edit ? esc(p.title) : 'Listings') + '</a>' +
      '<header class="ph"><h1>' + (edit ? 'Edit listing' : 'New listing') + '</h1>' + (edit ? '<span class="muted">' + p.ref + '</span>' : '') + '</header>' +
      '<form class="form-page card" novalidate id="lf" style="padding:22px 24px 6px">' +
      '<fieldset class="fs"><legend>Basics</legend><div class="g2">' +
      ES.field('Property title *', '<input name="title" value="' + esc(p.title) + '" placeholder="e.g. Karura Ridge House" required autofocus>', '', 'span2') +
      ES.field('Property type', ES.select('type', ES.PTYPES, p.type)) +
      ES.field('Sale or rental', '<div class="cks"><label class="ck"><input type="radio" name="category" value="sale"' + (p.category === 'sale' ? ' checked' : '') + '>For sale</label><label class="ck"><input type="radio" name="category" value="rent"' + (p.category === 'rent' ? ' checked' : '') + '>For rent</label></div>') +
      ES.field('Description', '<textarea name="description" placeholder="What makes this property worth a viewing?">' + esc(p.description) + '</textarea>', '', 'span2') +
      '</div></fieldset>' +
      '<fieldset class="fs"><legend>Pricing</legend><div class="g3">' +
      ES.field('Asking price (KES) *', '<input name="price" data-num inputmode="numeric" value="' + (p.price || '') + '" placeholder="e.g. 85000000">', 'For rentals, enter the monthly rent.') +
      ES.field('Minimum acceptable (KES)', '<input name="minPrice" data-num inputmode="numeric" value="' + (p.minPrice || '') + '" placeholder="Optional">', 'Internal only — never published.') +
      ES.field('Sample market estimate (KES)', '<input name="estimate" data-num inputmode="numeric" value="' + (p.estimate || '') + '" placeholder="Defaults to asking price">', 'Used by the pricing tool. Not a valuation.') +
      '</div></fieldset>' +
      '<fieldset class="fs"><legend>Location</legend><div class="g3">' +
      ES.field('Street address', '<input name="address" value="' + esc(p.address) + '" placeholder="e.g. 14 Ridgeview Close">', '', 'span2') +
      ES.field('Area', ES.select('area', ES.AREAS, p.area)) +
      ES.field('City / county', '<input name="city" value="' + esc(p.city) + '">') +
      '</div></fieldset>' +
      '<fieldset class="fs"><legend>Specifications</legend><div class="g4">' +
      ES.field('Bedrooms', '<input name="beds" data-num type="number" min="0" max="20" value="' + p.beds + '">') +
      ES.field('Bathrooms', '<input name="baths" data-num type="number" min="0" max="20" value="' + p.baths + '">') +
      ES.field('Floor area (m²)', '<input name="size" data-num type="number" min="0" value="' + (p.size || '') + '">') +
      ES.field('Floors', '<input name="floors" data-num type="number" min="1" max="60" value="' + (p.floors || 1) + '">') +
      ES.field('Plot size', '<input name="plot" value="' + esc(p.plot || '') + '" placeholder="e.g. 0.5 acre">') +
      ES.field('Parking bays', '<input name="parking" data-num type="number" min="0" value="' + p.parking + '">') +
      '</div><div class="fld"><span class="fld__l">Amenities</span><div class="cks">' + ES.AMENITIES.map(function (a) { return '<label class="ck"><input type="checkbox" data-multi name="amenities" value="' + esc(a) + '"' + (p.amenities.indexOf(a) > -1 ? ' checked' : '') + '>' + esc(a) + '</label>'; }).join('') + '</div></div></fieldset>' +
      '<fieldset class="fs"><legend>Photos</legend><p class="fld__h" style="margin-top:-8px">Pick from the demo photo library or upload your own (stored in this browser only, resized to 1200px).</p><div class="imgpick" id="imgpick">' + imgs.map(function (s) { return '<label><img src="' + s + '" alt="" loading="lazy"><input type="checkbox" data-multi name="images" value="' + s + '"' + ((p.images || []).indexOf(s) > -1 ? ' checked' : '') + ' aria-label="Use photo"></label>'; }).join('') + '</div><label class="drop" id="drop">' + I('upload', 20) + '<b>Upload photos</b><span>JPG, PNG or WebP · up to 8 MB each</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden id="upl"></label></fieldset>' +
      '<fieldset class="fs"><legend>People & publishing</legend><div class="g4">' +
      ES.field('Assigned agent', ES.select('agentId', st.s.team.map(function (u) { return { v: u.id, l: u.name }; }), p.agentId)) +
      ES.field('Owner / landlord', ES.select('ownerId', [{ v: '', l: 'Select a contact…' }].concat(owners.map(function (c) { return { v: c.id, l: c.name }; })), p.ownerId)) +
      ES.field('Listing status', ES.select('status', [{ v: 'active', l: 'Active' }, { v: 'draft', l: 'Draft' }, { v: 'under_offer', l: 'Under offer' }, { v: 'withdrawn', l: 'Withdrawn' }].concat(edit ? [{ v: 'sold', l: 'Sold' }, { v: 'let', l: 'Let' }] : []), p.status)) +
      ES.field('Publication', '<label class="ck"><input type="checkbox" name="published"' + (p.published ? ' checked' : '') + '>Publish on website</label>') +
      '</div></fieldset>' +
      '<div class="form-acts"><a class="btn" href="' + (edit ? '#/property/' + p.id : '#/listings') + '">Cancel</a><button class="btn btn--dark" type="submit">' + I('check', 15) + (edit ? 'Save listing' : 'Create listing') + '</button></div></form>';
    var fm = v.querySelector('#lf');
    v.querySelector('#upl').addEventListener('change', function (e) {
      [].forEach.call(e.target.files, function (file) {
        if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { ES.toast(file.name + ': only JPG, PNG or WebP', 'err'); return; }
        if (file.size > 8 * 1024 * 1024) { ES.toast(file.name + ' is larger than 8 MB', 'err'); return; }
        var r = new FileReader();
        r.onload = function () { var im = new Image(); im.onload = function () { var sc = Math.min(1, 1200 / im.width), c = document.createElement('canvas'); c.width = im.width * sc; c.height = im.height * sc; c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); var url = c.toDataURL('image/jpeg', .78); var lab = document.createElement('label'); lab.innerHTML = '<img src="' + url + '" alt=""><input type="checkbox" data-multi name="images" value="' + url + '" checked aria-label="Use photo">'; v.querySelector('#imgpick').prepend(lab); ES.toast('Photo added'); }; im.src = r.result; };
        r.readAsDataURL(file);
      });
    });
    fm.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = ES.formData(fm);
      fm.querySelectorAll('.is-err').forEach(function (x) { x.classList.remove('is-err'); });
      if (!d.title) fm.title.closest('.fld').classList.add('is-err');
      if (!(d.price > 0)) fm.price.closest('.fld').classList.add('is-err');
      if (!d.minPrice) d.minPrice = Math.round(d.price * (d.category === 'rent' ? .95 : .96));
      if (!d.estimate) d.estimate = d.price;
      var saved = ES.try(function () { return st.saveListing(d, edit ? p.id : null); }, edit ? 'Listing saved' : 'Listing created');
      if (saved) { if (PRICE[saved.id]) delete PRICE[saved.id]; ES.app.go('#/property/' + saved.id); }
    });
  }
  ES.pages['listing-new'] = { static: true, render: function (v) { form(v, null); } };
  ES.pages['listing-edit'] = { static: true, render: function (v, params) { var p = st.prop(params[0]); if (!p) { v.innerHTML = ES.empty('building', 'Listing not found', '', '<a class="btn" href="#/listings">Back</a>'); return; } form(v, p); } };
})();
