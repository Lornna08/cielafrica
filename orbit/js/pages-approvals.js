/* ============================================================
   ORBIT SOCIAL — Approvals
   Multi-stage review: internal review, then client approval (per
   brand). Who may act on each stage is decided by policy.js —
   the buttons only reflect that decision.
   ============================================================ */
(function () {
  'use strict';
  var ui = OS.ui, store = OS.store, T = OS.time, app = OS.app, pc = OS.pc, policy = OS.policy;

  OS.route('/approvals', function (params, q) {
    var all = store.postsInScope();
    var review = all.filter(function (p) { return p.status === 'in_review'; });
    var mine = review.filter(function (p) { return !store.reviewBlock(p); });
    var changes = all.filter(function (p) { return p.status === 'changes_requested'; });
    var approved = all.filter(function (p) { return p.status === 'approved'; });
    var tab = q.tab || (q.filter === 'mine' ? 'mine' : (mine.length ? 'mine' : 'review'));
    var history = [];
    all.forEach(function (p) { (p.approvals || []).forEach(function (a) { history.push({ p: p, a: a }); }); });
    history.sort(function (x, y) { return x.a.at < y.a.at ? 1 : -1; });
    var me = store.me();
    var wsA = store.state.workspace.approval;
    var flow = (wsA.stages || []).filter(function (s) { return s.enabled !== false; });

    var h = app.ph('Approvals', 'Review content before it goes live. ' + (flow.length ? 'Workflow: ' + flow.map(function (s) { return ui.esc(s.name); }).join(' → ') + ' → schedule.' : 'No review steps are configured.'), store.can('settings.manage') ? '<a class="btn btn--sm" href="#/settings?tab=approvals">' + ui.icon('sliders', 14) + 'Workflow settings</a>' : '');
    h += app.tabs([['mine', 'Waiting on me', '#/approvals?tab=mine', mine.length], ['review', 'All in review', '#/approvals?tab=review', review.length], ['changes', 'Changes requested', '#/approvals?tab=changes', changes.length], ['approved', 'Approved', '#/approvals?tab=approved', approved.length], ['history', 'History', '#/approvals?tab=history', null]], tab);

    function card(p) {
      var b = store.brand(p.brandId), author = store.user(p.authorId), block = p.status === 'in_review' ? store.reviewBlock(p) : null;
      var st = store.stages(p.brandId)[p.stage || 0];
      var fb = p.status === 'changes_requested' ? (p.comments || []).filter(function (c) { return c.kind === 'feedback'; }).pop() : null;
      var nC = (p.comments || []).filter(function (c) { return c.kind !== 'system'; }).length;
      var acts = '';
      if (p.status === 'in_review') acts = block ? '<span class="why">' + ui.icon('lock', 13) + ui.esc(block) + '</span>' : '<button class="btn btn--sm btn--p" data-ap="' + p.id + '">' + ui.icon('check', 14) + 'Approve' + (st && store.stages(p.brandId).length > (p.stage || 0) + 1 ? ' & send to ' + ui.esc(store.stages(p.brandId)[(p.stage || 0) + 1].name.toLowerCase()) : '') + '</button><button class="btn btn--sm" data-ch="' + p.id + '">' + ui.icon('reply', 14) + 'Request changes</button>';
      if (p.status === 'changes_requested') acts = p.authorId === me.id || store.can('content.edit', p.brandId) ? '<a class="btn btn--sm btn--p" href="#/compose/' + p.id + '">' + ui.icon('edit', 14) + 'Make changes</a>' : '';
      if (p.status === 'approved') acts = store.can('content.schedule', p.brandId) ? '<button class="btn btn--sm btn--p" data-sch="' + p.id + '">' + ui.icon('cal', 14) + 'Schedule</button>' : '<span class="why">' + ui.icon('lock', 13) + 'A manager will schedule this.</span>';
      return '<article class="acard2" data-card="' + p.id + '"><button type="button" class="acard2__media" data-open="' + p.id + '" aria-label="Open ' + ui.esc(store.title(p)) + '">' + pc.thumb(p, 'mthumb--fill') + '<span class="acard2__plats">' + pc.accIcons(p, 20) + '</span></button>' +
        '<div class="acard2__b"><div class="acard2__top">' + ui.brandMark(b, 22) + '<b>' + ui.esc(b.name) + '</b>' + ui.pill(p.status) + '</div>' +
        '<p class="acard2__cap">' + ui.esc((p.caption || '').slice(0, 220)) + ((p.caption || '').length > 220 ? '…' : '') + '</p>' +
        (fb ? '<div class="fbq">' + ui.userAv(store.user(fb.userId), 'xs') + '<span><b>' + ui.esc(app.userName(fb.userId)) + '</b> ' + ui.esc(fb.body) + '</span></div>' : '') +
        '<div class="acard2__meta"><span>' + ui.userAv(author, 'xs') + ui.esc(author ? author.name : '—') + '</span><span>' + ui.icon('clock', 12) + (p.status === 'in_review' ? 'Submitted ' + T.rel(p.submittedAt || p.updatedAt) : 'Updated ' + T.rel(p.updatedAt)) + '</span><span>' + ui.icon('cal', 12) + (p.scheduledAt ? T.dateTime(p.scheduledAt) : 'No date') + '</span><span>' + ui.icon('message', 12) + nC + '</span><span class="muted">v' + p.version + '</span></div>' +
        (p.status === 'in_review' || p.status === 'changes_requested' ? pc.track(p) : '') +
        '<div class="acard2__acts">' + acts + '<button class="btn btn--sm btn--ghost" data-open="' + p.id + '">Open</button></div></div></article>';
    }

    var list = tab === 'mine' ? mine : tab === 'review' ? review : tab === 'changes' ? changes : tab === 'approved' ? approved : null;
    if (list) {
      list = list.slice().sort(function (a, b) { var x = a.scheduledAt || '9999', y = b.scheduledAt || '9999'; return x < y ? -1 : 1; });
      h += list.length ? '<div class="alist">' + list.map(card).join('') + '</div>' : '<div class="card">' + ui.empty(tab === 'mine' ? 'approve' : 'inbox', tab === 'mine' ? 'Nothing is waiting on you' : 'Nothing here', tab === 'mine' ? (store.can('content.approve') ? 'Posts appear here when they reach a review step you can act on.' : ui.esc(store.why('content.approve') || '')) : '') + '</div>';
    } else {
      h += '<div class="card card--flush">' + (history.length ? history.slice(0, 60).map(function (x) { var u = store.user(x.a.userId); return '<button type="button" class="lrow lrow--btn" data-open="' + x.p.id + '">' + ui.userAv(u, 'sm') + '<span class="lrow__m"><span class="lrow__t">' + ui.esc(u ? u.name : 'Former member') + ' <span class="muted" style="font-weight:500">' + (x.a.decision === 'approved' ? 'approved' : 'requested changes on') + ' the ' + ui.esc(x.a.stageName.toLowerCase()) + '</span></span><span class="lrow__s">' + ui.esc(store.title(x.p)) + ' · v' + x.a.version + (x.a.note ? ' · “' + ui.esc(x.a.note.slice(0, 80)) + (x.a.note.length > 80 ? '…' : '') + '”' : '') + '</span></span><span class="lrow__r"><span class="pill ' + (x.a.decision === 'approved' ? 'pill--green' : 'pill--amber') + ' pill--plain">' + (x.a.decision === 'approved' ? 'Approved' : 'Changes') + '</span><div class="muted" style="font-size:11.5px;margin-top:3px">' + T.dateTime(x.a.at) + '</div></span></button>'; }).join('') : ui.empty('clock', 'No decisions yet', '')) + '</div>';
    }

    return {
      title: 'Approvals', html: h,
      mount: function (root) {
        root.addEventListener('click', function (e) {
          var t;
          if ((t = e.target.closest('[data-open]'))) { pc.drawer(t.getAttribute('data-open')); return; }
          if ((t = e.target.closest('[data-ap]'))) { var id = t.getAttribute('data-ap'); ui.run(function () { return store.approve(id); }, function (r) { return r.status === 'in_review' ? 'Approved. Sent to ' + store.stages(r.brandId)[r.stage].name.toLowerCase() + '.' : r.status === 'scheduled' ? 'Approved and scheduled for ' + T.dateTime(r.scheduledAt) : 'Approved. Ready to schedule.'; }); return; }
          if ((t = e.target.closest('[data-ch]'))) { pc.changesDialog(t.getAttribute('data-ch')); return; }
          if ((t = e.target.closest('[data-sch]'))) { var sid = t.getAttribute('data-sch'), p = store.post(sid); pc.pickTime({ title: 'Schedule post', ok: 'Schedule', iso: p.scheduledAt && new Date(p.scheduledAt) > new Date() ? p.scheduledAt : null, help: 'The simulated scheduler marks it as published at this time. Nothing reaches real networks.', onOk: function (iso) { var r = store.schedule(sid, iso); ui.toast('Scheduled for ' + T.dateTime(iso)); return r; } }); }
        });
        if (q.open) pc.drawer(q.open);
      }
    };
  });
})();
