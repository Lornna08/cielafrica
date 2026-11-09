/* ============================================================
   ORBIT SOCIAL — Analytics
   All numbers here come from a SAMPLE metrics source (labelled in
   the UI). The page reads through store.daily() and post.metrics,
   which is the seam a real provider sync would fill.
   ============================================================ */
(function () {
  'use strict';
  var ui = OS.ui, store = OS.store, T = OS.time, PL = OS.platforms, app = OS.app, pc = OS.pc, C = OS.charts;

  OS.route('/analytics', function (params, q) {
    var brand = store.scopeBrand();
    var allowedBrands = store.brands().filter(function (b) { return store.can('analytics.view', b.id) && store.inScope(b.id); });
    if (!allowedBrands.length) return { title: 'Analytics', html: app.ph('Analytics', '') + app.locked('Analytics isn’t available for your role', 'analytics.view', brand ? brand.id : null), mount: app.bindLocked };
    var days = OS.rangeDays(), f = { platform: q.platform || '', account: q.account || '', metric: q.metric || 'reach' };
    var accts = store.state.accounts.filter(function (a) { return allowedBrands.some(function (b) { return b.id === a.brandId; }); });
    var shown = accts.filter(function (a) { return (!f.platform || a.platform === f.platform) && (!f.account || a.id === f.account); });
    var plats = []; accts.forEach(function (a) { if (plats.indexOf(a.platform) < 0) plats.push(a.platform); });
    var head = app.ph('Analytics', 'Performance across ' + (brand ? ui.esc(brand.name) : allowedBrands.length + ' brands') + ' · last ' + days + ' days', OS.rangeSel() + '<button class="btn btn--sm" data-csv>' + ui.icon('download', 14) + 'CSV</button><button class="btn btn--sm" data-print>' + ui.icon('printer', 14) + 'Print</button>');
    head += '<div class="note note--plain anote">' + ui.icon('flask', 15) + '<span><b>Sample data.</b> These accounts aren’t connected to real networks, so every figure on this page is generated sample data that stays consistent day to day. Connected accounts would fill the same charts from each network’s insights API.</span></div>';

    if (!accts.length) {
      return { title: 'Analytics', html: head + '<div class="card">' + ui.empty('plug', 'No accounts to report on', (brand ? ui.esc(brand.name) + ' has' : 'These brands have') + ' no connected accounts yet. Analytics appear once an account is connected and its first insights sync completes.', store.can('accounts.manage', brand ? brand.id : null) ? '<a class="btn btn--sm btn--p" href="#/settings?tab=accounts" style="margin-top:8px">' + ui.icon('plug', 14) + 'Connect an account</a>' : '') + '</div>',
        mount: function (root) { root.querySelectorAll('[data-range]').forEach(function (b) { b.onclick = function () { store.setPref('range', b.getAttribute('data-range')); app.refresh(); }; }); } };
    }

    var series = store.daily(shown, days), prev = store.daily(shown, days * 2).slice(0, days);
    var sum = function (arr, k) { return arr.reduce(function (t, r) { return t + r[k]; }, 0); };
    var R = sum(series, 'reach'), I = sum(series, 'impressions'), E = sum(series, 'engagements'), CL = sum(series, 'clicks');
    var pR = sum(prev, 'reach'), pI = sum(prev, 'impressions'), pE = sum(prev, 'engagements'), pCL = sum(prev, 'clicks');
    var F1 = series[series.length - 1].followers, F0 = series[0].followers, pF0 = prev[0].followers;
    var since = Date.now() - days * 864e5, sincePrev = since - days * 864e5;
    var posts = store.state.posts.filter(function (p) { return allowedBrands.some(function (b) { return b.id === p.brandId; }) && p.status === 'published' && p.accountIds.some(function (id) { return shown.some(function (a) { return a.id === id; }); }); });
    var inRange = posts.filter(function (p) { return new Date(p.publishedAt).getTime() >= since; }), prevPosts = posts.filter(function (p) { var t = new Date(p.publishedAt).getTime(); return t >= sincePrev && t < since; });

    function kpi(label, v, d, hint) { return '<div class="card kpi" title="' + ui.esc(hint) + '"><div class="kpi__l">' + label + '</div><div class="kpi__v">' + v + '</div><div class="kpi__f">' + d + '</div></div>'; }
    var h = head + '<div class="filters">' + ui.icon('filter', 14) + ui.select('fp', [{ value: '', label: 'All networks' }].concat(plats.map(function (p) { return { value: p, label: PL.P[p].name }; })), f.platform, { cls: 'sel--sm sel--pill', attr: ' data-af="platform" aria-label="Network"' }) + ui.select('fa', [{ value: '', label: 'All accounts' }].concat(accts.filter(function (a) { return !f.platform || a.platform === f.platform; }).map(function (a) { return { value: a.id, label: a.handle + ' · ' + PL.P[a.platform].name }; })), f.account, { cls: 'sel--sm sel--pill', attr: ' data-af="account" aria-label="Account"' }) + (f.platform || f.account ? '<a class="link" href="#/analytics">Clear</a>' : '') + '<span class="filters__sp"></span><span class="muted">' + shown.length + ' account' + (shown.length === 1 ? '' : 's') + ' · ' + ui.esc(T.zoneLabel()) + '</span></div>';
    h += '<div class="grid g-kpi">' + kpi('Reach', ui.short(R), ui.delta(R, pR), 'Unique accounts that saw any post, summed per day') + kpi('Impressions', ui.short(I), ui.delta(I, pI), 'Total times content was shown') + kpi('Engagements', ui.short(E), ui.delta(E, pE), 'Likes, comments, shares and saves') + kpi('Engagement rate', ui.pct(R ? E / R : 0), ui.delta(R ? E / R : 0, pR ? pE / pR : 0), 'Engagements ÷ reach') + kpi('Follower growth', (F1 - F0 >= 0 ? '+' : '') + ui.short(F1 - F0), ui.delta(F1 - F0, F0 - pF0) + '<span>' + ui.short(F1) + ' total</span>', 'Net new followers in the period') + kpi('Posts published', inRange.length, ui.delta(inRange.length, prevPosts.length) + '<span>' + ui.short(CL) + ' link clicks</span>', 'Posts published in the period, including simulated ones') + '</div>';

    h += '<div class="grid g-main" style="margin-top:16px"><div class="card"><div class="card__h"><h3>Performance over time</h3><div class="seg seg--sm" role="group" aria-label="Metric">' + [['reach', 'Reach'], ['impressions', 'Impressions'], ['engagements', 'Engagements'], ['rate', 'Eng. rate']].map(function (m) { return '<button data-metric="' + m[0] + '" class="' + (f.metric === m[0] ? 'on' : '') + '">' + m[1] + '</button>'; }).join('') + '</div></div><div class="card__b"><div id="aLine"></div></div></div>' +
      '<div class="card"><div class="card__h"><h3>Followers</h3><span class="sub">' + ui.short(F1) + ' total</span></div><div class="card__b"><div id="aFol"></div></div></div></div>';

    // by platform
    var byP = plats.filter(function (p) { return !f.platform || p === f.platform; }).map(function (pid) {
      var as = shown.filter(function (a) { return a.platform === pid; }); if (!as.length) return null;
      var s = store.daily(as, days), r = sum(s, 'reach'), e = sum(s, 'engagements');
      return { pid: pid, followers: s[s.length - 1].followers, growth: s[s.length - 1].followers - s[0].followers, reach: r, eng: e, rate: r ? e / r : 0, posts: inRange.filter(function (p) { return p.accountIds.some(function (id) { return as.some(function (a) { return a.id === id; }); }); }).length };
    }).filter(Boolean).sort(function (a, b) { return b.reach - a.reach; });
    h += '<div class="grid g-2" style="margin-top:16px"><div class="card card--flush"><div class="card__h" style="padding-bottom:12px"><h3>Performance by network</h3></div><div class="tscroll"><table class="t"><thead><tr><th>Network</th><th class="r">Followers</th><th class="r">Growth</th><th>Reach</th><th class="r">Eng. rate</th><th class="r">Posts</th></tr></thead><tbody>' +
      byP.map(function (r) { var max = byP[0].reach || 1; return '<tr><td><span class="row">' + ui.plat(r.pid, 20) + PL.P[r.pid].name + '</span></td><td class="r num">' + ui.num(r.followers) + '</td><td class="r num"><span class="t-green">+' + ui.num(r.growth) + '</span></td><td style="min-width:150px"><div class="hb"><i style="width:' + (r.reach / max * 100).toFixed(1) + '%;background:' + PL.P[r.pid].color + '"></i></div><span class="num" style="font-size:12px">' + ui.short(r.reach) + '</span></td><td class="r num">' + ui.pct(r.rate) + '</td><td class="r num">' + r.posts + '</td></tr>'; }).join('') + '</tbody></table></div></div>' +
      '<div class="card"><div class="card__h"><h3>Posts published per week</h3></div><div class="card__b"><div id="aBars"></div></div></div></div>';

    // top posts
    var metricsOf = function (p) { var o = { reach: 0, impressions: 0, eng: 0, clicks: 0, views: 0 }; if (!p.metrics) return null; Object.keys(p.metrics).forEach(function (aid) { if (!shown.some(function (a) { return a.id === aid; })) return; var m = p.metrics[aid]; o.reach += m.reach; o.impressions += m.impressions; o.eng += m.likes + m.comments + m.shares + m.saves; o.clicks += m.clicks; o.views += m.views || 0; }); o.rate = o.reach ? o.eng / o.reach : 0; return o; };
    var top = inRange.map(function (p) { return { p: p, m: metricsOf(p) }; });
    h += '<div class="card card--flush" style="margin-top:16px"><div class="card__h" style="padding-bottom:12px"><h3>Top posts</h3><span class="sub">' + top.filter(function (x) { return x.m; }).length + ' with metrics · simulated posts have none</span></div><div data-top></div></div>';

    // campaigns
    var camps = store.state.campaigns.filter(function (c) { return allowedBrands.some(function (b) { return b.id === c.brandId; }); }).map(function (c) {
      var ps = posts.filter(function (p) { return p.campaignId === c.id; }), r = 0, e = 0, n = 0;
      ps.forEach(function (p) { var m = metricsOf(p); if (m) { r += m.reach; e += m.eng; n++; } });
      return { c: c, posts: ps.length, measured: n, reach: r, eng: e, rate: r ? e / r : 0, upcoming: store.state.posts.filter(function (p) { return p.campaignId === c.id && p.status === 'scheduled'; }).length };
    });
    h += '<div class="card card--flush" style="margin-top:16px"><div class="card__h" style="padding-bottom:12px"><h3>Campaigns</h3><span class="sub">All time, published posts</span></div><div class="tscroll"><table class="t"><thead><tr><th>Campaign</th><th>Brand</th><th class="r">Published</th><th class="r">Scheduled</th><th class="r">Reach</th><th class="r">Engagements</th><th class="r">Eng. rate</th></tr></thead><tbody>' + camps.map(function (x) { return '<tr><td><span class="row"><span class="cdot" style="background:' + x.c.color + '"></span><b>' + ui.esc(x.c.name) + '</b></span></td><td>' + ui.esc(store.brand(x.c.brandId).name) + '</td><td class="r num">' + x.posts + '</td><td class="r num">' + x.upcoming + '</td><td class="r num">' + (x.measured ? ui.num(x.reach) : '<span class="muted">No data yet</span>') + '</td><td class="r num">' + (x.measured ? ui.num(x.eng) : '—') + '</td><td class="r num">' + (x.measured ? ui.pct(x.rate) : '—') + '</td></tr>'; }).join('') + '</tbody></table></div></div>';

    h += '<details class="card defs" style="margin-top:16px"><summary>' + ui.icon('info', 15) + 'How these metrics are defined</summary><dl><dt>Reach</dt><dd>Unique accounts that saw at least one post on a given day, added up across the days in the range (networks don’t de-duplicate across days).</dd><dt>Impressions</dt><dd>Every time content was displayed, including repeat views.</dd><dt>Engagements</dt><dd>Likes, comments, shares and saves. Link clicks and video views are reported separately.</dd><dt>Engagement rate</dt><dd>Engagements divided by reach for the same period.</dd><dt>Follower growth</dt><dd>Followers at the end of the period minus followers at the start.</dd><dt>Change (↑ ↓)</dt><dd>Compared with the previous period of the same length.</dd></dl></details>';

    return {
      title: 'Analytics', wide: true, html: h,
      mount: function (root) {
        root.querySelectorAll('[data-range]').forEach(function (b) { b.onclick = function () { store.setPref('range', b.getAttribute('data-range')); app.refresh(); }; });
        root.querySelectorAll('[data-af]').forEach(function (s) { s.onchange = function () { var o = { platform: f.platform, account: f.account, metric: f.metric }; o[s.getAttribute('data-af')] = s.value; if (s.getAttribute('data-af') === 'platform') o.account = ''; app.go('#/analytics?' + Object.keys(o).filter(function (k) { return o[k]; }).map(function (k) { return k + '=' + o[k]; }).join('&')); }; });
        var labels = series.map(function (r) { var p = T.keyToParts(r.day); return p.d + ' ' + T.MON[p.m - 1]; });
        function line() {
          var m = f.metric, vals = m === 'rate' ? series.map(function (r) { return r.reach ? r.engagements / r.reach * 100 : 0; }) : series.map(function (r) { return r[m]; });
          var pv = m === 'rate' ? prev.map(function (r) { return r.reach ? r.engagements / r.reach * 100 : 0; }) : prev.map(function (r) { return r[m]; });
          C.line(root.querySelector('#aLine'), { labels: labels, height: 250, aria: 'Performance over time (sample data)', series: [{ name: 'This period', values: vals, color: 'var(--acc)' }, { name: 'Previous period', values: pv, color: 'var(--ink-4)', dashed: true }], fmt: m === 'rate' ? function (v) { return v.toFixed(2) + '%'; } : ui.num, yFmt: m === 'rate' ? function (v) { return v.toFixed(1) + '%'; } : ui.short });
        }
        line();
        root.querySelectorAll('[data-metric]').forEach(function (b) { b.onclick = function () { f.metric = b.getAttribute('data-metric'); root.querySelectorAll('[data-metric]').forEach(function (x) { x.classList.toggle('on', x === b); }); app.updateQuery({ platform: f.platform, account: f.account, metric: f.metric }); line(); }; });
        var fol = series.map(function (r) { return r.followers; }), fmin = Math.min.apply(null, fol);
        C.line(root.querySelector('#aFol'), { labels: labels, height: 250, aria: 'Followers over time (sample data)', series: [{ name: 'Followers', values: fol.map(function (v) { return v - fmin * 0.98; }), color: 'var(--blue)' }], fmt: function (v) { return ui.num(v + fmin * 0.98); }, yFmt: function (v) { return ui.short(v + fmin * 0.98); } });
        // weekly bars
        var wk = [], n = Math.ceil(days / 7);
        for (var i = n - 1; i >= 0; i--) { var end = Date.now() - i * 7 * 864e5, start = end - 7 * 864e5; wk.push({ label: T.date(new Date(start + 864e5)), n: posts.filter(function (p) { var t = new Date(p.publishedAt).getTime(); return t > start && t <= end; }).length }); }
        C.bars(root.querySelector('#aBars'), { labels: wk.map(function (w) { return w.label; }), height: 220, aria: 'Posts published per week', series: [{ name: 'Posts', values: wk.map(function (w) { return w.n; }), color: 'var(--acc)' }], tipLabels: wk.map(function (w) { return 'Week from ' + w.label; }) });
        ui.table(root.querySelector('[data-top]'), { rows: top, pageSize: 10, rowId: function (r) { return r.p.id; }, initialSort: { key: 'reach', dir: 'desc' }, onRowClick: function (r) { pc.drawer(r.p.id); }, empty: ui.empty('send', 'No posts published in this period', ''), columns: [
          { key: 'post', label: 'Post', sort: function (r) { return store.title(r.p); }, render: function (r) { return '<div class="pcell">' + pc.thumb(r.p, 'mthumb--40') + '<div><div class="pcell__t">' + ui.esc(store.title(r.p)) + '</div><div class="pcell__s">' + ui.esc(store.brand(r.p.brandId).name) + '</div></div></div>'; } },
          { key: 'plats', label: 'Networks', sort: false, render: function (r) { return pc.accIcons(r.p, 18); } },
          { key: 'date', label: 'Published', sort: function (r) { return r.p.publishedAt; }, render: function (r) { return T.date(r.p.publishedAt) + (r.p.simulated ? ' ' + ui.sim() : ''); } },
          { key: 'reach', label: 'Reach', align: 'r', defaultDir: 'desc', sort: function (r) { return r.m ? r.m.reach : -1; }, render: function (r) { return r.m ? ui.num(r.m.reach) : '<span class="muted">—</span>'; } },
          { key: 'eng', label: 'Engagements', align: 'r', defaultDir: 'desc', sort: function (r) { return r.m ? r.m.eng : -1; }, render: function (r) { return r.m ? ui.num(r.m.eng) : '—'; } },
          { key: 'rate', label: 'Eng. rate', align: 'r', defaultDir: 'desc', sort: function (r) { return r.m ? r.m.rate : -1; }, render: function (r) { return r.m ? ui.pct(r.m.rate) : '—'; } },
          { key: 'clicks', label: 'Clicks', align: 'r', defaultDir: 'desc', sort: function (r) { return r.m ? r.m.clicks : -1; }, render: function (r) { return r.m ? ui.num(r.m.clicks) : '—'; } }
        ] });
        root.querySelector('[data-csv]').onclick = function () {
          var rows = series.map(function (r) { return r; });
          ui.csv('orbit-analytics-' + T.todayKey() + '.csv', [{ label: 'Date', key: 'day' }, { label: 'Followers', key: 'followers' }, { label: 'Reach', key: 'reach' }, { label: 'Impressions', key: 'impressions' }, { label: 'Engagements', key: 'engagements' }, { label: 'Engagement rate', csv: function (r) { return r.reach ? (r.engagements / r.reach * 100).toFixed(2) + '%' : '0%'; } }, { label: 'Link clicks', key: 'clicks' }, { label: 'Data source', csv: function () { return 'sample'; } }], rows);
        };
        root.querySelector('[data-print]').onclick = function () { document.body.classList.add('printing'); window.print(); setTimeout(function () { document.body.classList.remove('printing'); }, 500); };
      }
    };
  });
})();
