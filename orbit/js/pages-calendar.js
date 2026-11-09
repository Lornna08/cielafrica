/* ============================================================
   ORBIT SOCIAL — Calendar (month · week · list)
   Every cell is computed in the workspace time zone from the same
   UTC timestamps, so a post sits on the same day and time in every
   view. Drag to reschedule (month/week), or open a post and use
   "Reschedule" for a keyboard-friendly alternative.
   ============================================================ */
(function () {
  'use strict';
  var ui = OS.ui, store = OS.store, T = OS.time, PL = OS.platforms, app = OS.app, pc = OS.pc;
  var STATUSES = ['draft', 'in_review', 'changes_requested', 'approved', 'scheduled', 'published', 'failed'];

  OS.route('/calendar', function (params, q) {
    var view = q.view || store.prefs.calView || (window.innerWidth < 640 ? 'list' : 'month');
    if (['month', 'week', 'list'].indexOf(view) < 0) view = 'month';
    var anchor = q.date && /^\d{4}-\d\d-\d\d$/.test(q.date) ? q.date : T.todayKey();
    var f = { status: q.status || '', platform: q.platform || '', account: q.account || '', campaign: q.campaign || '', past: q.past === '1' };
    var ws = store.state.workspace;

    function posts() {
      return store.postsInScope().filter(function (p) {
        if (f.status && p.status !== f.status) return false;
        if (f.account && p.accountIds.indexOf(f.account) < 0) return false;
        if (f.platform && store.platformsOf(p).indexOf(f.platform) < 0) return false;
        if (f.campaign && p.campaignId !== f.campaign) return false;
        return true;
      });
    }
    function dateOf(p) { return p.status === 'published' ? p.publishedAt : p.scheduledAt; }
    function chip(p, compact) {
      var drag = canMove(p);
      var a = p.accountIds.map(store.account).filter(Boolean)[0];
      return '<button type="button" class="cchip cchip--' + p.status + '" data-post="' + p.id + '"' + (drag ? ' draggable="true"' : '') + ' title="' + ui.esc(store.title(p) + ' · ' + ui.statusLabel(p.status) + ' · ' + (dateOf(p) ? T.hm(dateOf(p)) : 'no date')) + '"><span class="cchip__bar" style="background:' + ui.statusColor(p.status) + '"></span>' + (compact ? '' : pc.thumb(p, 'mthumb--26')) + '<span class="cchip__m"><span class="cchip__t"><b>' + (dateOf(p) ? T.hm(dateOf(p)).replace(' ', '') : 'No date') + '</b>' + pc.accIcons(p, 13) + '</span><span class="cchip__x">' + ui.esc(store.title(p)) + '</span></span></button>';
    }
    function canMove(p) { if (p.status === 'published') return false; return store.can(p.status === 'scheduled' ? 'content.schedule' : 'content.edit', p.brandId); }
    function weekStart(k) { var dow = T.dowOfKey(k), diff = (dow - (ws.weekStart || 1) + 7) % 7; return T.addDaysKey(k, -diff); }
    function nav(delta) {
      var p = T.keyToParts(anchor), k;
      if (view === 'month') { var m = new Date(Date.UTC(p.y, p.m - 1 + delta, 1)); k = m.getUTCFullYear() + '-' + T.pad(m.getUTCMonth() + 1) + '-01'; }
      else k = T.addDaysKey(anchor, delta * 7);
      return k;
    }
    function link(o) { var x = Object.assign({ view: view, date: anchor, status: f.status, platform: f.platform, account: f.account, campaign: f.campaign, past: f.past ? '1' : '' }, o || {}); return '#/calendar?' + Object.keys(x).filter(function (k) { return x[k]; }).map(function (k) { return k + '=' + encodeURIComponent(x[k]); }).join('&'); }

    function head() {
      var p = T.keyToParts(anchor), title;
      if (view === 'month') title = T.MONL[p.m - 1] + ' ' + p.y;
      else if (view === 'week') { var s = weekStart(anchor), e = T.addDaysKey(s, 6), sp = T.keyToParts(s), ep = T.keyToParts(e); title = sp.d + ' ' + T.MON[sp.m - 1] + ' – ' + ep.d + ' ' + T.MON[ep.m - 1] + ' ' + ep.y; }
      else title = f.status ? ui.statusLabel(f.status) + ' posts' : 'Upcoming' + (f.past ? ' & recent' : '');
      var accs = store.accounts(), camps = store.state.campaigns.filter(function (c) { return store.inScope(c.brandId); });
      var plats = []; accs.forEach(function (a) { if (plats.indexOf(a.platform) < 0) plats.push(a.platform); });
      var h = '<div class="calbar"><div class="calbar__l">' + (view !== 'list' ? '<div class="row"><a class="btn btn--sm btn--icon" href="' + link({ date: nav(-1) }) + '" aria-label="Previous">' + ui.icon('chevL', 16) + '</a><a class="btn btn--sm" href="' + link({ date: T.todayKey() }) + '">Today</a><a class="btn btn--sm btn--icon" href="' + link({ date: nav(1) }) + '" aria-label="Next">' + ui.icon('chevR', 16) + '</a></div>' : '') + '<h1 class="caltitle">' + title + '</h1><span class="muted caltz">' + ui.icon('clock', 12) + ui.esc(T.zoneLabel()) + '</span></div>' +
        '<div class="calbar__r"><div class="seg" role="group" aria-label="Calendar view">' + [['month', 'Month', 'cal'], ['week', 'Week', 'week'], ['list', 'List', 'list']].map(function (v) { return '<a href="' + link({ view: v[0] }) + '" class="segl' + (view === v[0] ? ' on' : '') + '" aria-current="' + (view === v[0]) + '">' + ui.icon(v[2], 14) + '<span>' + v[1] + '</span></a>'; }).join('') + '</div>' +
        (store.can('content.edit') || store.brands().some(function (b) { return store.can('content.edit', b.id); }) ? '<a class="btn btn--p btn--sm" href="#/compose' + (view === 'list' ? '' : '?date=' + (anchor >= T.todayKey() ? anchor : T.todayKey())) + '">' + ui.icon('plus', 15) + 'New post</a>' : '') + '</div></div>';
      h += '<div class="filters">' + ui.icon('filter', 14) +
        ui.select('f-platform', [{ value: '', label: 'All networks' }].concat(plats.map(function (p) { return { value: p, label: PL.P[p].name }; })), f.platform, { cls: 'sel--sm sel--pill', attr: ' data-flt="platform" aria-label="Network"' }) +
        ui.select('f-account', [{ value: '', label: 'All accounts' }].concat(accs.map(function (a) { return { value: a.id, label: a.handle + ' · ' + PL.P[a.platform].name }; })), f.account, { cls: 'sel--sm sel--pill', attr: ' data-flt="account" aria-label="Account"' }) +
        ui.select('f-status', [{ value: '', label: 'All statuses' }].concat(STATUSES.map(function (s) { return { value: s, label: ui.statusLabel(s) }; })), f.status, { cls: 'sel--sm sel--pill', attr: ' data-flt="status" aria-label="Status"' }) +
        ui.select('f-campaign', [{ value: '', label: 'All campaigns' }].concat(camps.map(function (c) { return { value: c.id, label: c.name }; })), f.campaign, { cls: 'sel--sm sel--pill', attr: ' data-flt="campaign" aria-label="Campaign"' }) +
        (f.status || f.platform || f.account || f.campaign ? '<a class="link" href="' + link({ status: '', platform: '', account: '', campaign: '' }) + '">Clear filters</a>' : '') +
        '<span class="filters__sp"></span><span class="legend legend--status">' + ['draft', 'in_review', 'approved', 'scheduled', 'published', 'failed'].map(function (s) { return '<span><i style="background:' + ui.statusColor(s) + '"></i>' + ui.statusLabel(s) + '</span>'; }).join('') + '</span></div>';
      return h;
    }

    function month(list) {
      var p = T.keyToParts(anchor), first = p.y + '-' + T.pad(p.m) + '-01', start = weekStart(first), today = T.todayKey();
      var byDay = {}; list.forEach(function (x) { var d = dateOf(x); if (d) { var k = T.dayKey(d); (byDay[k] = byDay[k] || []).push(x); } });
      Object.keys(byDay).forEach(function (k) { byDay[k].sort(function (a, b) { return dateOf(a) < dateOf(b) ? -1 : 1; }); });
      var dows = []; for (var i = 0; i < 7; i++) dows.push(T.DOW[(i + (ws.weekStart || 1)) % 7]);
      var h = '<div class="month" role="grid" aria-label="Month"><div class="month__h" role="row">' + dows.map(function (d) { return '<div role="columnheader">' + d + '</div>'; }).join('') + '</div><div class="month__b">';
      for (var w = 0; w < 6; w++) {
        var rowStart = T.addDaysKey(start, w * 7);
        if (w >= 4 && T.keyToParts(rowStart).m !== p.m) break;
        h += '<div class="month__r" role="row">';
        for (var dd = 0; dd < 7; dd++) {
          var k = T.addDaysKey(rowStart, dd), kp = T.keyToParts(k), items = byDay[k] || [], past = k < today;
          h += '<div class="mcell' + (kp.m !== p.m ? ' out' : '') + (k === today ? ' today' : '') + (past ? ' past' : '') + '" data-day="' + k + '" role="gridcell" aria-label="' + T.dayLabel(k) + ', ' + items.length + ' posts"><div class="mcell__h"><span class="mcell__n">' + kp.d + '</span>' + (!past ? '<a class="mcell__add" href="#/compose?date=' + k + '" aria-label="New post on ' + T.dayLabel(k) + '">' + ui.icon('plus', 13, 2.4) + '</a>' : '') + '</div><div class="mcell__b">' + items.slice(0, 3).map(function (x) { return chip(x, true); }).join('') + (items.length > 3 ? '<button type="button" class="mcell__more" data-moreday="' + k + '">+' + (items.length - 3) + ' more</button>' : '') + '</div></div>';
        }
        h += '</div>';
      }
      return h + '</div></div>';
    }

    function week(list) {
      var s = weekStart(anchor), today = T.todayKey(), H0 = 6, H1 = 23;
      var cells = {}; list.forEach(function (x) { var d = dateOf(x); if (!d) return; var k = T.dayKey(d), hr = Math.max(H0, Math.min(H1, T.parts(d).h)); (cells[k + '|' + hr] = cells[k + '|' + hr] || []).push(x); });
      var h = '<div class="week"><div class="week__scroll"><div class="week__g"><div class="week__corner"></div>';
      for (var i = 0; i < 7; i++) { var k = T.addDaysKey(s, i), kp = T.keyToParts(k); h += '<div class="week__dh' + (k === today ? ' today' : '') + '"><span>' + T.DOW[T.dowOfKey(k)] + '</span><b>' + kp.d + '</b></div>'; }
      for (var hr = H0; hr <= H1; hr++) {
        h += '<div class="week__hl">' + (hr % 12 || 12) + (hr < 12 ? ' am' : ' pm') + '</div>';
        for (var j = 0; j < 7; j++) {
          var dk = T.addDaysKey(s, j), items = (cells[dk + '|' + hr] || []).sort(function (a, b) { return dateOf(a) < dateOf(b) ? -1 : 1; });
          var slotPast = T.at(dk, T.pad(hr) + ':59').getTime() < Date.now();
          h += '<div class="wslot' + (slotPast ? ' past' : '') + (dk === today ? ' today' : '') + '" data-day="' + dk + '" data-hour="' + hr + '">' + items.map(function (x) { return chip(x, false); }).join('') + (!slotPast && !items.length ? '<a class="wslot__add" href="#/compose?date=' + dk + '&time=' + T.pad(hr) + ':00" aria-label="New post ' + T.dayLabel(dk) + ' at ' + hr + ':00">' + ui.icon('plus', 13, 2.4) + '</a>' : '') + '</div>';
        }
      }
      return h + '</div></div></div>';
    }

    function listView(list) {
      var now = Date.now(), from = f.past ? now - 21 * 864e5 : now - 864e5 / 2;
      var rows = list.filter(function (p) { var d = dateOf(p); if (f.status) return true; return d && new Date(d).getTime() >= from; }).sort(function (a, b) { var x = dateOf(a) || '9999', y = dateOf(b) || '9999'; return x < y ? -1 : 1; });
      if (!f.status && !f.past) rows = rows.filter(function (p) { return new Date(dateOf(p) || 0).getTime() <= now + 45 * 864e5; });
      var groups = {}, order = [];
      rows.forEach(function (p) { var d = dateOf(p), k = d ? T.dayKey(d) : 'none'; if (!groups[k]) { groups[k] = []; order.push(k); } groups[k].push(p); });
      var h = '<div class="row" style="margin:0 0 12px;gap:12px"><label class="switch"><input type="checkbox" data-past' + (f.past ? ' checked' : '') + '><i></i>Include the last 3 weeks</label><span class="muted">' + rows.length + ' post' + (rows.length === 1 ? '' : 's') + '</span></div>';
      if (!rows.length) return h + '<div class="card">' + ui.empty('cal', 'Nothing here', f.status ? 'No posts with this status in the brands you’re viewing.' : 'No posts in this period. Try including past posts or clearing filters.') + '</div>';
      h += '<div class="agenda">' + order.map(function (k) { return '<div class="agenda__d"><div class="agenda__h">' + (k === 'none' ? 'No date' : T.dayLabel(k) + (k.slice(0, 4) !== T.todayKey().slice(0, 4) ? ' ' + k.slice(0, 4) : '')) + '<span>' + groups[k].length + '</span></div><div class="card card--flush">' + groups[k].map(function (p) { return pc.row(p, { sub: (dateOf(p) ? T.hm(dateOf(p)) + ' · ' : '') + (p.accountIds.map(store.account).filter(Boolean).map(function (a) { return a.handle; }).join(', ') || 'No accounts') }); }).join('') + '</div></div>'; }).join('') + '</div>';
      return h;
    }

    function undated(list) {
      var items = list.filter(function (p) { return !p.scheduledAt && p.status !== 'published'; });
      if (!items.length) return '';
      return '<div class="card undated"><div class="card__h"><h3>' + ui.icon('note', 15) + 'No date yet <span class="cnt-b">' + items.length + '</span></h3><span class="sub">Drag onto a day to plan it</span></div><div class="undated__b">' + items.map(function (p) { return chip(p, false); }).join('') + '</div></div>';
    }

    var list = posts();
    var body = view === 'month' ? month(list) : view === 'week' ? week(list) : listView(list);
    var html = head() + (view !== 'list' ? undated(list) : '') + '<div class="calwrap" data-view="' + view + '">' + body + '</div>' + (view !== 'list' ? '<p class="hint" style="margin-top:10px">' + ui.icon('info', 12) + ' Drag a post to another ' + (view === 'month' ? 'day (it keeps its time)' : 'day or hour') + '. Prefer the keyboard? Open a post and choose Reschedule.</p>' : '');

    return {
      title: 'Calendar', wide: true, html: html,
      mount: function (root) {
        store.setPref('calView', view);
        root.querySelectorAll('[data-flt]').forEach(function (s) { s.onchange = function () { var o = {}; o[s.getAttribute('data-flt')] = s.value; app.go(link(o)); }; });
        var past = root.querySelector('[data-past]'); if (past) past.onchange = function () { app.go(link({ past: past.checked ? '1' : '' })); };
        root.addEventListener('click', function (e) {
          var c = e.target.closest('[data-post]'); if (c) { pc.drawer(c.getAttribute('data-post')); return; }
          var m = e.target.closest('[data-moreday]'); if (m) { dayPop(m, m.getAttribute('data-moreday')); }
        });
        function dayPop(anchorEl, k) {
          var items = list.filter(function (p) { var d = dateOf(p); return d && T.dayKey(d) === k; }).sort(function (a, b) { return dateOf(a) < dateOf(b) ? -1 : 1; });
          var p = ui.pop(anchorEl, '<div class="daypop"><b>' + T.dayLabel(k) + '</b>' + items.map(function (x) { return chip(x, false); }).join('') + '</div>', { cls: 'pop--day', alignLeft: true });
          p.addEventListener('click', function (e) { var c = e.target.closest('[data-post]'); if (c) { ui.closePop(); pc.drawer(c.getAttribute('data-post')); } });
        }
        // drag & drop rescheduling
        var dragId = null;
        root.addEventListener('dragstart', function (e) { var c = e.target.closest('[data-post][draggable]'); if (!c) return; dragId = c.getAttribute('data-post'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', dragId); c.classList.add('dragging'); root.querySelector('.calwrap').classList.add('is-dragging'); });
        root.addEventListener('dragend', function (e) { var c = e.target.closest('[data-post]'); if (c) c.classList.remove('dragging'); dragId = null; root.querySelectorAll('.drop').forEach(function (x) { x.classList.remove('drop'); }); var w = root.querySelector('.calwrap'); if (w) w.classList.remove('is-dragging'); });
        root.addEventListener('dragover', function (e) { if (!dragId) return; var t = e.target.closest('[data-day]'); if (!t || t.classList.contains('past')) return; e.preventDefault(); root.querySelectorAll('.drop').forEach(function (x) { if (x !== t) x.classList.remove('drop'); }); t.classList.add('drop'); });
        root.addEventListener('drop', function (e) {
          var t = e.target.closest('[data-day]'); if (!dragId || !t) return; e.preventDefault();
          var p = store.post(dragId), k = t.getAttribute('data-day'), hr = t.getAttribute('data-hour');
          var time = p.scheduledAt ? T.timeOf(p.scheduledAt) : ws.defaultTime;
          if (hr != null) time = T.pad(+hr) + ':' + (p.scheduledAt ? T.pad(T.parts(p.scheduledAt).mi) : '00');
          var iso = T.iso(k, time);
          if (p.scheduledAt && iso === p.scheduledAt) return;
          if (ui.run(function () { return store.reschedule(dragId, iso); })) ui.toast('Moved to ' + T.dateTime(iso), 'ok', { label: 'Undo', fn: function () { if (p.scheduledAt) ui.run(function () { return store.reschedule(p.id, prevIso); }); } });
        });
        var prevIso = null;
        root.addEventListener('dragstart', function () { var p = dragId && store.post(dragId); prevIso = p ? p.scheduledAt : null; });
        if (view === 'week') { var sc = root.querySelector('.week__scroll'); var slot = root.querySelector('.wslot[data-hour="8"]'); if (sc && slot) sc.scrollTop = slot.getBoundingClientRect().top - sc.getBoundingClientRect().top - 44; }
        if (q.open) pc.drawer(q.open);
      }
    };
  });
})();
