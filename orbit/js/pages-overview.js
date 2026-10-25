/* ============================================================
   ORBIT SOCIAL — Overview
   What's happening, what needs attention, how channels perform.
   ============================================================ */
(function () {
  'use strict';
  var ui = OS.ui, store = OS.store, T = OS.time, PL = OS.platforms, app = OS.app, pc = OS.pc, C = OS.charts;

  function rangeDays() { return { '7d': 7, '30d': 30, '90d': 90 }[store.prefs.range || '30d'] || 30; }
  function rangeSel() {
    var r = store.prefs.range || '30d';
    return '<div class="seg" role="group" aria-label="Date range">' + [['7d', '7 days'], ['30d', '30 days'], ['90d', '90 days']].map(function (x) { return '<button data-range="' + x[0] + '" class="' + (r === x[0] ? 'on' : '') + '" aria-pressed="' + (r === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div>';
  }
  OS.rangeSel = rangeSel; OS.rangeDays = rangeDays;

  OS.route('/overview', function () {
    var me = store.me(), S = store.state, days = rangeDays(), now = Date.now(), since = now - days * 864e5;
    var posts = store.postsInScope(), accts = store.accounts(), brand = store.scopeBrand();
    var hour = T.parts(new Date()).h, greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    var published = posts.filter(function (p) { return p.status === 'published' && new Date(p.publishedAt).getTime() >= since; });
    var prevPublished = posts.filter(function (p) { return p.status === 'published' && new Date(p.publishedAt).getTime() >= since - days * 864e5 && new Date(p.publishedAt).getTime() < since; });
    var week = now + 7 * 864e5;
    var scheduled = posts.filter(function (p) { return p.status === 'scheduled'; });
    var scheduledWeek = scheduled.filter(function (p) { return new Date(p.scheduledAt).getTime() <= week; });
    var review = posts.filter(function (p) { return p.status === 'in_review'; });
    var mine = review.filter(function (p) { return !store.reviewBlock(p); });
    var healthy = accts.filter(function (a) { return a.status === 'sample'; }), broken = accts.filter(function (a) { return a.status !== 'sample'; });
    var canAna = store.can('analytics.view', brand ? brand.id : null) || (!brand && store.brands().some(function (b) { return store.can('analytics.view', b.id); }));
    var series = canAna ? store.daily(accts, days) : [], prevSeries = canAna ? store.daily(accts, days * 2).slice(0, days) : [];
    var sum = function (arr, k) { return arr.reduce(function (t, r) { return t + r[k]; }, 0); };
    var reach = sum(series, 'reach'), eng = sum(series, 'engagements'), er = reach ? eng / reach : 0, prevReach = sum(prevSeries, 'reach'), prevEr = sum(prevSeries, 'reach') ? sum(prevSeries, 'engagements') / sum(prevSeries, 'reach') : 0;

    function kpi(label, icon, value, foot, href, spark) { return '<a class="card kpi" href="' + href + '"><div class="kpi__l">' + ui.icon(icon, 14) + label + '</div><div class="kpi__v">' + value + '</div><div class="kpi__f">' + foot + (spark || '') + '</div></a>'; }

    var h = '<div class="welcome"><div><h1>' + greet + ', ' + ui.esc(me.name.split(' ')[0]) + '</h1><p>' + (brand ? ui.esc(brand.name) + ' · ' + ui.esc(brand.industry || '') : 'Across ' + store.brands().length + ' brands in ' + ui.esc(S.workspace.name)) + '</p></div><div class="row wrap">' + rangeSel() + '</div></div>';
    h += '<div class="grid g-kpi">' +
      kpi('Connected accounts', 'plug', healthy.length + '<small> / ' + accts.length + '</small>', broken.length ? '<span class="delta delta--down">' + broken.length + ' need' + (broken.length > 1 ? '' : 's') + ' attention</span>' : '<span class="muted">All sample connections</span>', '#/settings?tab=accounts') +
      kpi('Published', 'send', published.length, ui.delta(published.length, prevPublished.length) + '<span>last ' + days + ' days</span>', '#/calendar?view=list&status=published') +
      kpi('Scheduled', 'cal', scheduled.length, '<span>' + scheduledWeek.length + ' in the next 7 days</span>', '#/calendar?view=list&status=scheduled') +
      kpi('Awaiting approval', 'approve', review.length, mine.length ? '<span class="delta delta--flat" style="background:var(--acc-soft);color:var(--acc-2)">' + mine.length + ' for you</span>' : '<span class="muted">none for you</span>', '#/approvals') +
      (canAna ? kpi('Engagement rate', 'heart', ui.pct(er), ui.delta(er, prevEr) + ui.sampleTag(), '#/analytics', '<span class="kpi__spark">' + C.spark(series.map(function (r) { return r.reach ? r.engagements / r.reach : 0; }), 'var(--acc)') + '</span>') : kpi('Engagement rate', 'lock', '—', '<span class="muted">Needs analytics access</span>', '#/analytics')) +
      (canAna ? kpi('Reach', 'eye', ui.short(reach), ui.delta(reach, prevReach) + ui.sampleTag(), '#/analytics', '<span class="kpi__spark">' + C.spark(series.map(function (r) { return r.reach; }), 'var(--blue)') + '</span>') : kpi('Reach', 'lock', '—', '<span class="muted">Needs analytics access</span>', '#/analytics')) +
      '</div>';

    // attention
    var att = [];
    broken.forEach(function (a) { att.push(['red', 'plug', PL.P[a.platform].name + ' needs reconnecting', store.brand(a.brandId).name + ' · ' + a.handle + '. Posts to this account will fail.', '#/settings?tab=accounts']); });
    posts.filter(function (p) { return p.status === 'failed'; }).forEach(function (p) { att.push(['red', 'alert', 'Failed: ' + store.title(p), (p.results && Object.values(p.results).filter(function (r) { return !r.ok; }).map(function (r) { return r.error; })[0]) || 'Publishing failed', 'post:' + p.id]); });
    if (mine.length) att.push(['acc', 'approve', mine.length + ' post' + (mine.length > 1 ? 's' : '') + ' waiting for your review', mine.slice(0, 2).map(function (p) { return store.brand(p.brandId).name; }).join(', ') + (mine.length > 2 ? '…' : ''), '#/approvals?filter=mine']);
    posts.filter(function (p) { return p.status === 'changes_requested'; }).forEach(function (p) { var fb = (p.comments || []).filter(function (c) { return c.kind === 'feedback'; }).pop(); att.push(['amber', 'reply', 'Changes requested: ' + store.title(p), fb ? app.userName(fb.userId) + ': “' + fb.body.slice(0, 70) + (fb.body.length > 70 ? '…' : '') + '”' : '', 'post:' + p.id]); });
    var soonUnapproved = posts.filter(function (p) { return ['draft', 'in_review', 'changes_requested'].indexOf(p.status) >= 0 && p.scheduledAt && new Date(p.scheduledAt).getTime() < now + 3 * 864e5 && new Date(p.scheduledAt).getTime() > now; });
    soonUnapproved.forEach(function (p) { att.push(['amber', 'clock', 'Due soon but not approved', store.title(p) + ' · planned ' + T.dateTime(p.scheduledAt), 'post:' + p.id]); });
    if (store.can('inbox.view')) { var un = S.conversations.filter(function (c) { return store.inScope(c.brandId) && c.unread && c.status === 'open'; }); if (un.length) att.push(['blue', 'inbox', un.length + ' unread conversation' + (un.length > 1 ? 's' : ''), un.slice(0, 3).map(function (c) { return c.contact.name; }).join(', '), '#/inbox?filter=unread']); }

    h += '<div class="grid g-ov" style="margin-top:16px"><div class="card"><div class="card__h"><h3>' + ui.icon('flag', 16) + 'Needs attention</h3><span class="sub">' + att.length + ' item' + (att.length === 1 ? '' : 's') + '</span></div><div class="card__b card__b--flush">' +
      (att.length ? att.slice(0, 7).map(function (a) { var isPost = a[4].indexOf('post:') === 0; return '<' + (isPost ? 'button type="button" data-post="' + a[4].slice(5) + '"' : 'a href="' + a[4] + '"') + ' class="lrow lrow--btn"><span class="ico-c ico-c--' + a[0] + '">' + ui.icon(a[1], 15) + '</span><span class="lrow__m"><span class="lrow__t">' + ui.esc(a[2]) + '</span><span class="lrow__s">' + ui.esc(a[3]) + '</span></span>' + ui.icon('chevR', 15) + '</' + (isPost ? 'button' : 'a') + '>'; }).join('') : ui.empty('check', 'Nothing needs you right now', 'Failed posts, review requests and expired connections show up here.')) + '</div></div>';

    // upcoming 7 days timeline
    var upcoming = posts.filter(function (p) { return p.scheduledAt && new Date(p.scheduledAt).getTime() > now && new Date(p.scheduledAt).getTime() <= week && p.status !== 'published'; }).sort(function (a, b) { return a.scheduledAt < b.scheduledAt ? -1 : 1; });
    var byDay = {}; upcoming.forEach(function (p) { var k = T.dayKey(p.scheduledAt); (byDay[k] = byDay[k] || []).push(p); });
    h += '<div class="card"><div class="card__h"><h3>' + ui.icon('cal', 16) + 'Next 7 days</h3><a class="link" href="#/calendar?view=week">Open calendar ' + ui.icon('arrowR', 13) + '</a></div><div class="card__b card__b--flush upc">' +
      (upcoming.length ? Object.keys(byDay).map(function (k) { return '<div class="upc__d"><div class="upc__l">' + T.dayLabel(k) + '</div>' + byDay[k].map(function (p) { return '<button type="button" class="upc__i" data-post="' + p.id + '"><span class="upc__t">' + T.hm(p.scheduledAt) + '</span>' + pc.thumb(p, 'mthumb--32') + '<span class="upc__m"><b>' + ui.esc(store.title(p)) + '</b><span>' + ui.brandDot(store.brand(p.brandId)) + ui.esc(store.brand(p.brandId).name) + '</span></span>' + pc.accIcons(p, 16) + ui.pill(p.status) + '</button>'; }).join('') + '</div>'; }).join('') : ui.empty('cal', 'Nothing planned this week', 'Posts with a date in the next 7 days appear here.', store.can('content.edit') ? '<a class="btn btn--sm" href="#/compose" style="margin-top:6px">' + ui.icon('plus', 14) + 'Create a post</a>' : '')) + '</div></div></div>';

    // performance + account health
    h += '<div class="grid g-main" style="margin-top:16px"><div class="card"><div class="card__h"><h3>' + ui.icon('trend', 16) + 'Performance trend</h3><div class="row">' + (canAna ? ui.sampleTag() : '') + '<a class="link" href="#/analytics">Analytics ' + ui.icon('arrowR', 13) + '</a></div></div><div class="card__b">' +
      (canAna ? (accts.length ? '<div class="legend" style="margin-bottom:8px"><span><i style="background:var(--acc)"></i>Reach</span><span><i style="background:var(--blue)"></i>Engagements × 10</span></div><div id="ovchart"></div>' : ui.empty('plug', 'No accounts connected for this brand', 'Connect an account to see performance.', '<a class="btn btn--sm" href="#/settings?tab=accounts" style="margin-top:6px">Connected accounts</a>')) : ui.empty('lock', 'Analytics isn’t available for your role', ui.esc(store.why('analytics.view') || ''))) + '</div></div>';
    h += '<div class="card"><div class="card__h"><h3>' + ui.icon('shield', 16) + 'Account health</h3><a class="link" href="#/settings?tab=accounts">Manage</a></div><div class="card__b card__b--flush">' + (accts.length ? accts.map(function (a) { return '<div class="lrow">' + ui.accChip(a, 15) + '<span class="lrow__m"><span class="lrow__t">' + ui.esc(a.handle) + '</span><span class="lrow__s">' + ui.esc(store.brand(a.brandId).name) + ' · ' + (a.status === 'expired' ? 'Last synced ' + T.rel(a.lastSync) : ui.short(a.followers) + ' followers') + '</span></span>' + ui.pill(a.status) + '</div>'; }).join('') : ui.empty('plug', 'No accounts yet', brand ? ui.esc(brand.name) + ' is still being onboarded.' : '')) + '</div></div></div>';

    // review queue + activity + quick actions
    h += '<div class="grid g-3" style="margin-top:16px"><div class="card"><div class="card__h"><h3>' + ui.icon('approve', 16) + 'Awaiting review</h3><a class="link" href="#/approvals">All</a></div><div class="card__b card__b--flush" data-rows>' + (review.length ? review.slice(0, 4).map(function (p) { var st = store.stages(p.brandId)[p.stage || 0]; return pc.row(p, { sub: (st ? st.name : 'Review') + ' · submitted ' + T.rel(p.submittedAt || p.updatedAt), noStatus: true }); }).join('') : ui.empty('approve', 'Review queue is empty', '')) + '</div></div>';
    var acts = S.activity.filter(function (a) { return !a.brandId || store.inScope(a.brandId); }).slice(0, 7);
    h += '<div class="card"><div class="card__h"><h3>' + ui.icon('clock', 16) + 'Recent activity</h3></div><div class="card__b"><div class="feed">' + (acts.length ? acts.map(function (a) { var u = a.userId && store.user(a.userId); return '<div class="feed__i">' + ui.userAv(u, 'xs') + '<span><b>' + ui.esc(u ? u.name : 'ORBIT') + '</b> ' + ui.esc(a.text) + '<em>' + T.rel(a.at) + '</em></span></div>'; }).join('') : '<p class="muted">No activity yet.</p>') + '</div></div></div>';
    var q = [['pen', 'Create a post', '#/compose', 'content.edit'], ['cal', 'Plan the week', '#/calendar?view=week', null], ['upload', 'Upload media', '#/library?upload=1', 'content.edit'], ['inbox', 'Answer messages', '#/inbox', 'inbox.view'], ['download', 'Export a report', '#/analytics', 'analytics.view'], ['users', 'Invite a teammate', '#/team?invite=1', 'team.invite']];
    h += '<div class="card"><div class="card__h"><h3>' + ui.icon('zap', 16) + 'Quick actions</h3></div><div class="card__b"><div class="qa">' + q.map(function (x) { var ok = !x[3] || store.can(x[3], brand ? brand.id : null) || (!brand && store.brands().some(function (b) { return store.can(x[3], b.id); })); return '<a class="qa__i' + (ok ? '' : ' qa__i--off') + '" href="' + x[2] + '"' + (ok ? '' : ' title="Not available for your role"') + '><span class="ico-c ico-c--acc">' + ui.icon(ok ? x[0] : 'lock', 16) + '</span>' + x[1] + '</a>'; }).join('') + '</div></div></div></div>';

    return {
      title: 'Overview', html: h,
      mount: function (root) {
        root.querySelectorAll('[data-range]').forEach(function (b) { b.onclick = function () { store.setPref('range', b.getAttribute('data-range')); app.refresh(); }; });
        root.addEventListener('click', function (e) { var r = e.target.closest('[data-post]'); if (r) pc.drawer(r.getAttribute('data-post')); });
        var el = root.querySelector('#ovchart');
        if (el && series.length) C.line(el, { labels: series.map(function (r) { var p = T.keyToParts(r.day); return p.d + ' ' + T.MON[p.m - 1]; }), height: 230, aria: 'Reach and engagement over time (sample data)',
          series: [{ name: 'Reach', values: series.map(function (r) { return r.reach; }), color: 'var(--acc)' }, { name: 'Engagements × 10', values: series.map(function (r) { return r.engagements * 10; }), color: 'var(--blue)', area: false }],
          fmt: ui.num });
      }
    };
  });
})();
