/* ============================================================
   Reside Ke — Overview dashboard
   ============================================================ */
(function () {
  'use strict';
  var I = ES.icon, st = ES.store, f = ES.fmt, esc = f.esc;
  var ui = ES.ui.overview = { period: 12, feat: 0 };

  function greet() { var h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; }
  ES.refLink = function (r) { if (!r) return null; return r.type === 'property' ? '#/property/' + r.id : r.type === 'deal' ? '#/deal/' + r.id : r.type === 'contact' ? '#/contact/' + r.id : r.type === 'lead' ? '#/leads?lead=' + r.id : null; };
  ES.actIcon = { lead: 'user', photo: 'image', offer: 'tag', viewing: 'cal', stage: 'board', commission: 'wallet', listing: 'building', note: 'edit', contact: 'users', rent: 'key', doc: 'file', settings: 'gear' };

  ES.pages.overview = {
    redrawOnResize: true,
    render: function (v) {
      var s = st.s, k = st.kpis(), me = st.me();
      var series = st.commissionSeries(ui.period), total = series.reduce(function (a, x) { return a + x.value; }, 0);
      var target = s.settings.monthlyTarget, hit = series.filter(function (x) { return x.value >= target; }).length;
      var prevMonth = st.commissionSeries(2)[0].value;
      var open = st.openDeals(), weighted = open.reduce(function (a, d) { return a + st.weighted(d); }, 0), ifAll = open.reduce(function (a, d) { return a + st.commission(d); }, 0);
      var feat = st.listings().filter(function (p) { return p.featured; })[0] || st.listings()[0];

      var kp = [
        { ic: 'home', v: k.active, l: 'Active listings', h: '#/listings' },
        { ic: 'tag', v: k.under, l: 'Under offer', h: '#/listings' },
        { ic: 'trophy', v: f.money(k.commissionMonth, true), l: 'Commission · ' + f.mon(new Date()), h: '#/commissions' },
        { ic: 'clock', v: k.dom, l: 'Avg. days on market', h: '#/analytics' },
        { ic: 'user', v: k.newLeads, l: 'New leads this week', h: '#/leads' },
        { ic: 'cal', v: k.closing, l: 'Closing in 30 days', h: '#/deals' }
      ];

      // pipeline groups
      var groups = ES.STAGES.filter(function (x) { return x.id !== 'won' && x.id !== 'lost'; }).map(function (g) {
        var ds = open.filter(function (d) { return d.stage === g.id; });
        return { g: g, n: ds.length, value: ds.reduce(function (a, d) { return a + d.value; }, 0), w: ds.reduce(function (a, d) { return a + st.weighted(d); }, 0) };
      });

      var events = s.events.filter(function (e) { return e.status === 'scheduled' && new Date(e.start) > Date.now() - 3600e3; }).sort(function (a, b) { return new Date(a.start) - new Date(b.start); }).slice(0, 5);
      var follow = s.leads.filter(function (l) { return l.nextFollowUp && l.status !== 'converted' && l.status !== 'lost'; }).sort(function (a, b) { return new Date(a.nextFollowUp) - new Date(b.nextFollowUp); }).slice(0, 5);

      v.innerHTML =
        '<section class="ov-head">' +
        '<h1 class="ov-greet">' + greet() + ', ' + esc(me.name.split(' ')[0]) + '</h1>' +
        '<div class="ov-kpis">' + kp.map(function (x) { return '<a class="kq" href="' + x.h + '"><span class="kq__ic">' + I(x.ic, 17) + '</span><span class="kq__b"><b>' + x.v + '</b>' + (x.sub || '') + '<em>' + x.l + '</em></span></a>'; }).join('') + '</div>' +
        '<div class="ov-acts"><a class="btn btn--dark" href="#/listings/new">' + I('plus', 15) + 'New listing</a><button class="ib ib--round ib--card" data-ov="more" aria-label="More actions">' + I('more', 18) + '</button></div>' +
        '</section>' +

        '<section class="ov-grid">' +
        '<div class="ov-col">' +
        // commission
        '<article class="card cm">' +
        '<header class="card__h"><span class="card__t">' + I('trend', 16) + 'Commission</span><span class="card__x"><span class="seg" role="group" aria-label="Period"><button class="' + (ui.period === 6 ? 'is-on' : '') + '" data-ov="p" data-p="6">6M</button><button class="' + (ui.period === 12 ? 'is-on' : '') + '" data-ov="p" data-p="12">12M</button></span><a class="ib ib--round ib--card" href="#/commissions" aria-label="Open commission reports">' + I('out', 15) + '</a></span></header>' +
        '<div class="cm__big"><b>' + f.money(total, true).replace('KES ', '<small>KES</small>') + '</b><span>earned ' + (ui.period === 12 ? 'over 12 months' : 'over 6 months') + ' · <strong>' + hit + '</strong> of ' + ui.period + ' months at target</span></div>' +
        '<div class="legend"><span><i class="lg-dot" style="background:var(--blue)"></i>Commission earned</span><span><i class="lg-dash"></i>Team target · ' + f.money(target, true) + ' /mo</span></div>' +
        '<div class="cm__chart" id="cmChart"></div></article>' +
        // pipeline
        '<article class="card pl">' +
        '<header class="card__h"><span class="card__t">' + I('layers', 16) + 'Pipeline by stage</span><span class="card__x"><a class="btn btn--sm btn--ghost" href="#/deals">Open board ' + I('out', 13) + '</a></span></header>' +
        '<div class="pl__big"><b>' + f.money(weighted, true).replace('KES ', '<small>KES</small>') + '</b><span>weighted commission · ' + open.length + ' open deals · ' + f.money(ifAll, true) + ' if all close</span></div>' +
        '<div class="pl__bar">' + groups.filter(function (x) { return x.n; }).map(function (x) { return '<a href="#/deals" style="flex:' + x.n + ';background:' + x.g.c + '" title="' + esc(x.g.name + ': ' + x.n + ' deals') + '"><span>' + x.n + '</span></a>'; }).join('') + '</div>' +
        '<div class="pl__rows">' + groups.map(function (x) { return '<div class="pl__r"><span><i style="background:' + x.g.c + '"></i>' + x.g.name + '</span><b>' + x.n + '</b><span class="num">' + f.money(x.value, true) + '</span><em>' + x.g.p + '%</em></div>'; }).join('') + '</div>' +
        '</article>' +
        '</div>' +
        // featured
        featured(feat) +
        '</section>' +

        '<section class="ov-row">' +
        '<article class="card"><header class="card__h"><span class="card__t">' + I('bell', 16) + 'Live activity</span></header><div class="feed">' +
        s.activity.slice(0, 7).map(function (a) { var h = ES.refLink(a.ref); return '<' + (h ? 'a href="' + h + '"' : 'div') + ' class="feed__i"><span class="feed__ic feed__ic--' + a.kind + '">' + I(ES.actIcon[a.kind] || 'info', 14) + '</span><span class="feed__t">' + esc(a.text) + '<em>' + f.ago(a.at) + ' · ' + esc(st.user(a.by).name.split(' ')[0]) + '</em></span></' + (h ? 'a' : 'div') + '>'; }).join('') + '</div></article>' +
        '<article class="card"><header class="card__h"><span class="card__t">' + I('cal', 16) + 'Coming up</span><span class="card__x"><a class="lnk" href="#/calendar">Calendar ' + I('right', 13) + '</a></span></header><div class="up">' +
        (events.length ? events.map(function (e) { var d = new Date(e.start), p = e.propertyId ? st.prop(e.propertyId) : null; return '<a class="up__i" href="#/calendar"><span class="up__d"><b>' + d.getDate() + '</b><em>' + f.mon(d) + '</em></span><span class="up__t"><b>' + esc(e.title) + '</b><em>' + f.day(d) + ' · ' + f.time(d) + (p ? ' · ' + esc(p.area) : '') + '</em></span>' + ES.av(st.user(e.agentId), 24) + '</a>'; }).join('') : ES.empty('cal', 'Nothing scheduled', 'Book a viewing from any listing.')) + '</div></article>' +
        '<article class="card"><header class="card__h"><span class="card__t">' + I('phone', 16) + 'Follow-ups</span><span class="card__x"><a class="lnk" href="#/tasks">All tasks ' + I('right', 13) + '</a></span></header><div class="fu">' +
        (follow.length ? follow.map(function (l) { var od = new Date(l.nextFollowUp) < Date.now(), p = l.propertyId ? st.prop(l.propertyId) : null; return '<button class="fu__i" data-ov="lead" data-id="' + l.id + '">' + ES.cav({ name: l.name }, 32) + '<span class="fu__t"><b>' + esc(l.name) + '</b><em>' + (p ? esc(p.title) : esc(l.location)) + '</em></span><span class="fu__w' + (od ? ' is-od' : '') + '">' + (od ? 'Overdue' : f.day(l.nextFollowUp)) + '<em>' + f.time(l.nextFollowUp) + '</em></span></button>'; }).join('') : ES.empty('check', 'No follow-ups due', 'Schedule one from any lead.')) + '</div></article>' +
        '</section>';

      var el = v.querySelector('#cmChart');
      ES.chart.line(el, { h: innerWidth < 640 ? 170 : 196, labels: series.map(function (x) { return f.mon(x.date); }), tipLabels: series.map(function (x) { return f.mon(x.date) + ' ' + x.date.getFullYear() + ' · ' + x.count + ' closed'; }), series: [{ values: series.map(function (x) { return x.value; }), color: '#2F5BEA', label: 'Earned' }], target: target, vfmt: function (x) { return f.money(x, true); }, yfmt: function (x) { return x ? f.compact(x) : '0'; } });

      v.onclick = function (e) {
        var b = e.target.closest('[data-ov]'); if (!b) return;
        var a = b.dataset.ov;
        if (a === 'p') { ui.period = +b.dataset.p; ES.app.refresh(); }
        if (a === 'fp' || a === 'fn') { var n = feat.images.length; ui.feat = (ui.feat + (a === 'fn' ? 1 : -1) + n) % n; var img = v.querySelector('.ft__img'); img.src = feat.images[ui.feat]; v.querySelector('.ft__n').textContent = pad(ui.feat + 1) + ' / ' + pad(n); }
        if (a === 'lead') { ES.app.go('#/leads'); setTimeout(function () { ES.pages.leads.open(b.dataset.id); }, 60); }
        if (a === 'more') ES.menu(b, [{ label: 'Export pipeline (CSV)', icon: 'download', k: 'csv' }, { label: 'Book a viewing', icon: 'cal', k: 'view' }, { label: 'Add a lead', icon: 'user', k: 'lead' }], function (it) {
          if (it.k === 'csv') ES.csv('reside-ke-pipeline.csv', [['Ref', 'Property', 'Buyer/Tenant', 'Stage', 'Value (KES)', 'Probability %', 'Expected commission (KES)', 'Weighted (KES)', 'Expected close', 'Agent']].concat(st.openDeals().map(function (d) { return [d.ref, st.prop(d.propertyId).title, (st.contact(d.buyerId) || {}).name, st.stage(d.stage).name, d.value, st.stage(d.stage).p, st.commission(d), st.weighted(d), f.dateLong(d.expectedClose), st.user(d.agentId).name]; })));
          if (it.k === 'view') ES.pages.calendar.edit(null, { type: 'viewing' });
          if (it.k === 'lead') { ES.app.go('#/leads'); setTimeout(function () { ES.pages.leads.edit(); }, 60); }
        });
      };
    }
  };
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function featured(p) {
    var n = p.images.length; if (ui.feat >= n) ui.feat = 0;
    return '<article class="ft">' +
      '<img class="ft__img" src="' + p.images[ui.feat] + '" alt="' + esc(p.title + ', ' + p.area) + '">' +
      '<div class="ft__top"><span class="chip chip--glass">' + I('star', 13) + 'Featured listing</span><span class="ft__nav"><span class="ft__n">' + pad(ui.feat + 1) + ' / ' + pad(n) + '</span><button class="ib ib--glass" data-ov="fp" aria-label="Previous photo">' + I('left', 15) + '</button><button class="ib ib--glass" data-ov="fn" aria-label="Next photo">' + I('right', 15) + '</button></span></div>' +
      '<div class="ft__b"><div class="ft__chips"><span class="chip chip--w"><i class="dot dot--b"></i>' + (p.category === 'rent' ? 'For rent' : 'For sale') + '</span><span class="chip chip--glass">' + I('pin', 12) + esc(p.area) + '</span><span class="chip chip--glass">' + esc(p.ref) + '</span></div>' +
      '<h2>' + esc(p.title) + '</h2>' +
      '<div class="ft__row"><b>' + f.money(p.price, true) + '</b><span class="chip chip--glass">' + I('bed', 13) + p.beds + ' bd</span><span class="chip chip--glass">' + I('bath', 13) + p.baths + ' ba</span><span class="chip chip--glass">' + I('area', 13) + f.n(p.size) + ' m²</span></div>' +
      '<div class="ft__foot"><span>' + I('clock', 13) + st.daysOnMarket(p) + ' days listed · ' + f.n(p.views) + ' views</span><a class="btn btn--w btn--sm" href="#/property/' + p.id + '">View property ' + I('out', 13) + '</a></div></div></article>';
  }
})();
