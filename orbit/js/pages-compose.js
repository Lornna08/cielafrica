/* ============================================================
   ORBIT SOCIAL — Compose
   Left: accounts, caption, media. Centre: network options, plan,
   campaign, approvals and comments. Right: live previews and a
   per-network readiness check. Everything goes through store.js,
   so permissions and validation match the rest of the app.
   ============================================================ */
(function () {
  'use strict';
  var ui = OS.ui, store = OS.store, T = OS.time, PL = OS.platforms, app = OS.app, pc = OS.pc, policy = OS.policy;

  function draftKey(id) { return 'compose:' + (id || 'new'); }

  function page(params, q) {
    var editing = params.id ? store.post(params.id) : null;
    if (params.id && !editing) return null;
    var brands = store.brands().filter(function (b) { return store.can('content.edit', b.id); });
    var scope = store.scopeBrand();
    var startBrand = editing ? editing.brandId : (q.brand && store.brand(q.brand) ? q.brand : scope && store.can('content.edit', scope.id) ? scope.id : (brands[0] && brands[0].id));
    if (editing && !store.can('content.edit', editing.brandId)) {
      return { title: 'Edit post', crumbs: [['Calendar', '#/calendar']], html: app.ph('Edit post', ui.esc(store.title(editing))) + app.locked('You can’t edit this post', 'content.edit', editing.brandId), mount: app.bindLocked };
    }
    if (!editing && !brands.length) return { title: 'Compose', html: app.ph('Compose', '') + app.locked('You can’t create posts', 'content.edit'), mount: app.bindLocked };
    if (editing && editing.status === 'published') {
      return { title: 'Published post', crumbs: [['Calendar', '#/calendar']], html: app.ph('This post is published', 'Published posts can’t be edited. Duplicate it to reuse the content.', '<button class="btn btn--p" data-dup>' + ui.icon('copy', 15) + 'Duplicate as new draft</button><button class="btn" data-open>View details</button>'),
        mount: function (root) { root.querySelector('[data-dup]').onclick = function () { var np = ui.run(function () { return store.duplicate(editing.id); }); if (np) app.go('#/compose/' + np.id); }; root.querySelector('[data-open]').onclick = function () { pc.drawer(editing.id); }; } };
    }

    var d = editing ? JSON.parse(JSON.stringify({ id: editing.id, brandId: editing.brandId, caption: editing.caption, captions: editing.captions || {}, accountIds: editing.accountIds, mediaIds: editing.mediaIds, options: editing.options || {}, campaignId: editing.campaignId, labels: editing.labels || [], scheduledAt: editing.scheduledAt }))
      : { brandId: startBrand, caption: '', captions: {}, accountIds: [], mediaIds: [], options: {}, campaignId: null, labels: [], scheduledAt: null };
    if (!editing) {
      if (q.date) d.scheduledAt = T.iso(q.date, q.time || store.state.workspace.defaultTime);
      if (q.asset && store.asset(q.asset)) { var as = store.asset(q.asset); d.mediaIds = [as.id]; d.brandId = as.brandId; }
      if (!d.accountIds.length) d.accountIds = store.accounts(d.brandId).filter(function (a) { return a.platform === 'instagram' || a.platform === 'facebook'; }).map(function (a) { return a.id; }).slice(0, 2);
    }
    var ui$ = { tab: 'all', pv: null, perNet: Object.keys(d.captions || {}).length > 0, dirty: false, savedAt: editing ? editing.updatedAt : null, uploads: [] };
    var restored = null;
    try { restored = store.prefs[draftKey(params.id)]; } catch (e) { restored = null; }

    var h = '<div class="cmp" id="cmp"></div>';
    var root, el;

    function status() { var p = d.id && store.post(d.id); return p ? p.status : 'new'; }
    function cur() { return d.id ? store.post(d.id) : null; }
    function workingPost() { var p = cur() || {}; return Object.assign({}, p, d, { status: p.status || 'draft' }); }
    function brand() { return store.brand(d.brandId); }
    function accs() { return store.accounts(d.brandId); }
    function plats() { return store.platformsOf(d); }
    function capFor(pid) { return ui$.perNet && d.captions && d.captions[pid] != null ? d.captions[pid] : d.caption; }

    function markDirty() {
      ui$.dirty = true;
      store.setPref(draftKey(params.id), { at: new Date().toISOString(), d: d, perNet: ui$.perNet });
      paintSave(); paintCheck(); paintPreview(); paintActions();
    }

    function shell() {
      var p = cur(), b = brand(), st = status();
      var head = '<div class="cmp-head"><div class="cmp-head__l"><a class="btn btn--ghost btn--sm btn--icon" href="' + (editing ? '#/calendar' : '#/overview') + '" aria-label="Back">' + ui.icon('arrowL', 16) + '</a><div><h1>' + (editing ? 'Edit post' : 'Create a post') + '</h1><p class="cmp-sub">' + (p ? ui.pill(p.status) + ' <span class="muted">v' + p.version + ' · by ' + ui.esc(app.userName(p.authorId)) + '</span>' : '<span class="muted">New draft</span>') + ' <span id="saveState" class="savestate"></span></p></div></div>' +
        '<div class="cmp-head__r"><button class="btn btn--sm btn--ghost" data-export>' + ui.icon('download', 14) + '<span class="hide-sm">Export</span></button>' + (p ? '<button class="btn btn--sm btn--ghost" data-details>' + ui.icon('message', 14) + '<span class="hide-sm">Comments (' + (p.comments || []).filter(function (c) { return c.kind !== 'system'; }).length + ')</span></button>' : '') + '</div></div>';
      if (restored && restored.d && (!editing || restored.at > (editing.updatedAt || ''))) {
        head += '<div class="note note--info cmp-restore">' + ui.icon('info', 15) + '<span>You have unsaved changes from ' + T.rel(restored.at) + '.</span><button class="btn btn--xs" data-restore>Restore</button><button class="btn btn--xs btn--ghost" data-discard>Discard</button></div>';
      }
      if (p && ['in_review', 'approved', 'scheduled'].indexOf(p.status) >= 0) head += '<div class="note cmp-restore">' + ui.icon('alert', 15) + '<span>This post is <b>' + ui.esc(ui.statusLabel(p.status).toLowerCase()) + '</b>. Saving changes to the content will reset its approvals and it will need to be reviewed again. Changing only the date keeps approvals.</span></div>';
      root.innerHTML = head + '<div class="cmp-grid"><section class="cmp-col cmp-col--l" aria-label="Accounts, caption and media">' + leftHtml() + '</section><section class="cmp-col cmp-col--c" aria-label="Post settings">' + centreHtml() + '</section><aside class="cmp-col cmp-col--r" aria-label="Preview"><div class="cmp-sticky"><div id="pvBox"></div><div id="checkBox"></div></div></aside></div><div class="cmp-bar" id="actBar"></div>';
      paintSave(); paintPreview(); paintCheck(); paintActions(); paintCounts(); ui.hydrate(root);
    }

    /* ----- left: brand, accounts, caption, media ----- */
    function leftHtml() {
      var b = brand();
      var h = '<div class="card cmp-card"><div class="cmp-step"><span>1</span>Where should it go?</div>';
      if (brands.length > 1 && !editing) h += ui.field('Brand', ui.select('brand', brands.map(function (x) { return { value: x.id, label: x.name }; }), d.brandId, { attr: ' data-f="brand"' }));
      else h += '<div class="cmp-brand">' + ui.brandMark(b, 30) + '<div><b>' + ui.esc(b.name) + '</b><span>' + ui.esc(b.industry || '') + '</span></div></div>';
      var A = accs();
      h += '<div class="acclist" role="group" aria-label="Accounts">' + (A.length ? A.map(function (a) {
        var on = d.accountIds.indexOf(a.id) >= 0;
        return '<label class="accrow' + (on ? ' on' : '') + (a.status === 'expired' ? ' warn' : '') + '"><input type="checkbox" class="chk" data-acc="' + a.id + '"' + (on ? ' checked' : '') + '>' + ui.plat(a.platform, 22) + '<span class="accrow__m"><b>' + ui.esc(a.handle) + '</b><span>' + PL.P[a.platform].name + (a.status === 'expired' ? ' · <em class="t-red">reconnect needed</em>' : '') + '</span></span></label>';
      }).join('') : '<div class="note note--plain">' + ui.icon('plug', 15) + '<span>' + ui.esc(b.name) + ' has no connected accounts yet. You can still write and save a draft. <a class="link" href="#/settings?tab=accounts">Connect accounts</a></span></div>') + '</div></div>';

      h += '<div class="card cmp-card"><div class="cmp-step"><span>2</span>Caption</div>';
      var P = plats();
      h += '<div class="captabs" id="capTabs">' + capTabs() + '</div>';
      h += '<div class="capbox"><textarea class="ta cap-ta" id="capTa" rows="9" placeholder="Write your caption. Use #hashtags and @mentions as you would on the network." aria-label="Caption">' + ui.esc(ui$.tab === 'all' ? d.caption : capFor(ui$.tab)) + '</textarea>' +
        '<div class="captools"><button type="button" class="btn btn--xs btn--ghost" data-snip>' + ui.icon('hash', 13) + 'Hashtags & snippets</button><button type="button" class="btn btn--xs btn--ghost" data-emoji>' + ui.icon('smile', 13) + 'Emoji</button><span class="captools__sp"></span><label class="switch switch--sm"><input type="checkbox" data-pernet' + (ui$.perNet ? ' checked' : '') + (P.length < 2 ? ' disabled' : '') + '><i></i><span>Customise per network</span></label></div></div>';
      h += '<div class="capcounts" id="capCounts"></div></div>';

      h += '<div class="card cmp-card"><div class="cmp-step"><span>3</span>Media</div><div class="tray" id="tray">' + trayHtml() + '</div>' +
        '<div class="dropzone" id="drop" tabindex="0" role="button" aria-label="Upload files"><span class="ico-c ico-c--acc">' + ui.icon('upload', 18) + '</span><div><b>Drop images or video here</b><span>or <u>browse</u> · JPG, PNG, WebP, GIF, MP4 · up to ' + pc.MAX_MB + ' MB</span></div></div><input type="file" id="file" multiple accept="' + pc.TYPES.join(',') + '" hidden>' +
        '<button type="button" class="btn btn--sm" data-lib style="margin-top:10px">' + ui.icon('folder', 14) + 'Add from library</button><p class="hint" style="margin-top:8px">' + ui.icon('info', 12) + ' Uploads are stored in this browser only (template).</p></div>';
      return h;
    }
    function capTabs() {
      var P = plats();
      if (!ui$.perNet || P.length < 2) { ui$.tab = 'all'; return ''; }
      return '<button type="button" data-ctab="all" class="' + (ui$.tab === 'all' ? 'on' : '') + '">All networks</button>' + P.map(function (pid) { return '<button type="button" data-ctab="' + pid + '" class="' + (ui$.tab === pid ? 'on' : '') + '">' + ui.plat(pid, 14) + PL.P[pid].name + (d.captions[pid] != null ? '<i class="dot"></i>' : '') + '</button>'; }).join('');
    }
    function trayHtml() {
      var h = d.mediaIds.map(function (id, i) { var a = store.asset(id); if (!a) return ''; return '<div class="tray__i" draggable="true" data-mi="' + i + '">' + ui.media(a, { cls: 'mthumb--tray' }) + '<span class="tray__n">' + (i + 1) + '</span><button type="button" class="tray__x" data-rm="' + i + '" aria-label="Remove ' + ui.esc(a.name) + '">' + ui.icon('x', 12, 2.4) + '</button>' + (i > 0 ? '<button type="button" class="tray__mv" data-left="' + i + '" aria-label="Move earlier">' + ui.icon('chevL', 12, 2.4) + '</button>' : '') + '</div>'; }).join('');
      h += ui$.uploads.map(function (u) { return '<div class="tray__i tray__i--up' + (u.err ? ' err' : '') + '"><div class="up"><b>' + ui.esc(u.name) + '</b>' + (u.err ? '<em>' + ui.esc(u.err) + '</em>' : '<i><span style="width:' + u.pct + '%"></span></i><em>' + u.pct + '%</em>') + '</div>' + (u.err ? '<button type="button" class="tray__x" data-uperr="' + u.key + '" aria-label="Dismiss">' + ui.icon('x', 12, 2.4) + '</button>' : '') + '</div>'; }).join('');
      return h || '<p class="muted tray__empty">No media yet. Instagram, TikTok and YouTube need at least one file.</p>';
    }

    /* ----- centre: options, plan, approvals ----- */
    function centreHtml() {
      var b = brand(), p = cur();
      var h = '<div class="card cmp-card"><div class="cmp-step"><span>4</span>Network settings</div><div id="netOpts">' + netOptsHtml() + '</div></div>';
      var camps = store.state.campaigns.filter(function (c) { return c.brandId === d.brandId; });
      var dk = d.scheduledAt ? T.dayKey(d.scheduledAt) : '', tm = d.scheduledAt ? T.timeOf(d.scheduledAt) : '';
      h += '<div class="card cmp-card"><div class="cmp-step"><span>5</span>Plan</div><div class="fgrid">' +
        ui.field('Date', '<input class="inp" type="date" data-f="date" value="' + dk + '" min="' + T.todayKey() + '">') +
        ui.field('Time', '<input class="inp" type="time" data-f="time" step="300" value="' + tm + '">') +
        '</div><p class="hint" style="margin-top:6px">' + ui.icon('clock', 12) + ' ' + ui.esc(T.zoneLabel()) + ' · <span id="bestTimes"></span>' + (d.scheduledAt ? ' · <button type="button" class="link" data-cleardate>Clear date</button>' : '') + '</p>' +
        '<div class="fgrid" style="margin-top:12px">' + ui.field('Campaign', ui.select('campaign', [{ value: '', label: 'No campaign' }].concat(camps.map(function (c) { return { value: c.id, label: c.name }; })), d.campaignId || '', { attr: ' data-f="campaign"' })) +
        ui.field('Labels', '<input class="inp" data-f="labels" value="' + ui.esc((d.labels || []).join(', ')) + '" placeholder="e.g. launch, evergreen">', { hint: 'Separate with commas' }) + '</div></div>';
      var stages = store.stages(d.brandId), ws = store.state.workspace;
      h += '<div class="card cmp-card"><div class="cmp-step"><span>6</span>Approval</div>' + (stages.length ? (p && p.status !== 'draft' ? pc.track(p) : '<div class="track">' + stages.map(function (s, i) { return '<div class="track__s"><i>' + (i + 1) + '</i><span><b>' + ui.esc(s.name) + '</b><em>' + s.roles.filter(function (r) { return r !== 'owner'; }).map(policy.roleName).join(', ') + '</em></span></div>'; }).join('') + '</div>') +
        '<p class="hint" style="margin-top:10px">' + (ws.approval.requireBeforeSchedule ? 'Posts must be approved before they can be scheduled.' : 'Approval is optional in this workspace.') + (ws.approval.autoSchedule !== false ? ' Approved posts with a date are scheduled automatically.' : '') + '</p>' : '<p class="muted">No review steps for ' + ui.esc(b.name) + '. Posts can be scheduled once saved.</p>') + '</div>';
      return h;
    }
    function netOptsHtml() {
      var P = plats();
      if (!P.length) return '<p class="muted">Choose accounts to see options for each network.</p>';
      return P.map(function (pid) {
        var p = PL.P[pid], o = d.options[pid] || {}, h = '<div class="netopt"><div class="netopt__h">' + ui.plat(pid, 20) + '<b>' + p.name + '</b></div><div class="netopt__b">';
        if (p.types.length > 1) h += ui.field('Post type', '<div class="seg seg--sm">' + p.types.map(function (t) { var on = (o.type || p.types[0].id) === t.id; return '<button type="button" data-ptype="' + pid + ':' + t.id + '" class="' + (on ? 'on' : '') + '" aria-pressed="' + on + '">' + t.name + '</button>'; }).join('') + '</div>');
        if (p.firstComment) h += ui.field('First comment', '<input class="inp" data-opt="' + pid + ':firstComment" value="' + ui.esc(o.firstComment || '') + '" placeholder="Optional, e.g. extra hashtags">');
        if (p.title) h += ui.field('Video title', '<input class="inp" data-opt="' + pid + ':title" value="' + ui.esc(o.title || '') + '" maxlength="' + (p.title + 20) + '" placeholder="Required for YouTube">');
        if (p.privacy) h += ui.field('Who can view', ui.select('tt-privacy', [{ value: '', label: 'Choose…' }, { value: 'everyone', label: 'Everyone' }, { value: 'friends', label: 'Friends' }, { value: 'self', label: 'Only me' }], o.privacy || '', { attr: ' data-opt="' + pid + ':privacy"' }));
        h += '<p class="netopt__api">' + ui.icon('info', 12) + ' ' + ui.esc(p.notes[0]) + '</p></div></div>';
        return h;
      }).join('');
    }

    /* ----- right: preview + checks ----- */
    function paintPreview() {
      var box = root.querySelector('#pvBox'); if (!box) return;
      var P = plats();
      if (!P.length) { box.innerHTML = '<div class="card pvcard">' + ui.empty('eye', 'Preview', 'Choose an account to see how the post will look.') + '</div>'; return; }
      if (P.indexOf(ui$.pv) < 0) ui$.pv = P[0];
      var acc = accs().filter(function (a) { return a.platform === ui$.pv && d.accountIds.indexOf(a.id) >= 0; })[0];
      box.innerHTML = '<div class="card pvcard"><div class="pvtabs">' + P.map(function (pid) { return '<button type="button" data-pv="' + pid + '" class="' + (pid === ui$.pv ? 'on' : '') + '" aria-pressed="' + (pid === ui$.pv) + '" title="' + PL.P[pid].name + '">' + ui.plat(pid, 18) + '<span>' + PL.P[pid].name + '</span></button>'; }).join('') + '</div><div class="pvframe">' + pc.preview(workingPost(), ui$.pv, acc) + '</div><p class="pvnote">' + ui.icon('info', 12) + ' Approximate preview. Each network may crop or trim differently.</p></div>';
      ui.hydrate(box);
    }
    function paintCheck() {
      var box = root.querySelector('#checkBox'); if (!box) return;
      var v = store.validatePost(workingPost()), rows = '', total = v.errors.length;
      v.errors.forEach(function (e) { rows += '<li class="bad">' + ui.icon('x', 13, 2.6) + ui.esc(e) + '</li>'; });
      Object.keys(v.byPlatform).forEach(function (pid) {
        var r = v.byPlatform[pid]; total += r.errors.length;
        rows += '<li class="' + (r.errors.length ? 'bad' : r.warnings.length ? 'warn' : 'ok') + '">' + ui.plat(pid, 16) + '<span><b>' + PL.P[pid].name + '</b> ' + (r.errors.length ? ui.esc(r.errors.join(' ')) : r.warnings.length ? ui.esc(r.warnings.join(' ')) : 'Ready · ' + r.count + '/' + r.limit.toLocaleString()) + '</span></li>';
      });
      var acc = d.accountIds.map(store.account).filter(Boolean), exp = acc.filter(function (a) { return a.status === 'expired'; });
      exp.forEach(function (a) { rows += '<li class="warn">' + ui.icon('plug', 13) + '<span>' + ui.esc(a.handle) + ' needs reconnecting. It will fail if published.</span></li>'; });
      box.innerHTML = '<div class="card checkcard"><div class="card__h"><h3>' + (total ? ui.icon('alert', 15) + total + ' thing' + (total > 1 ? 's' : '') + ' to fix' : ui.icon('approve', 15) + 'Ready to submit') + '</h3></div><ul class="checks">' + rows + '</ul><div class="pubmode">' + ui.icon('flask', 13) + '<span><b>Publishing mode:</b> simulated. Sample accounts never reach a network.</span></div></div>';
    }
    function paintCounts() {
      var box = root.querySelector('#capCounts'); if (!box) return;
      box.innerHTML = plats().map(function (pid) { var p = PL.P[pid], n = PL.countChars(capFor(pid), p), over = n > p.caption, tags = p.hashtags ? PL.hashtags(capFor(pid)).length : null; return '<span class="cc' + (over ? ' over' : n > p.caption * .9 ? ' near' : '') + '">' + ui.plat(pid, 14) + n.toLocaleString() + '/' + p.caption.toLocaleString() + (tags != null ? ' · #' + tags + '/' + p.hashtags : '') + '</span>'; }).join('');
      var bt = root.querySelector('#bestTimes');
      if (bt) { var best = store.state.workspace.bestTimes || {}; var P = plats(); bt.innerHTML = P.length ? 'Suggested: ' + P.map(function (pid) { return best[pid] ? '<button type="button" class="link" data-best="' + best[pid] + '">' + PL.P[pid].name + ' ' + best[pid] + '</button>' : ''; }).filter(Boolean).slice(0, 3).join(', ') : ''; }
    }
    function paintSave() {
      var s = root.querySelector('#saveState'); if (!s) return;
      s.className = 'savestate' + (ui$.dirty ? ' dirty' : '');
      s.innerHTML = ui$.dirty ? ui.icon('edit', 12) + 'Unsaved changes' : ui$.savedAt ? ui.icon('check', 12, 2.4) + 'Saved ' + T.rel(ui$.savedAt) : '';
    }
    function paintActions() {
      var bar = root.querySelector('#actBar'); if (!bar) return;
      var p = cur(), st = p ? p.status : 'draft', br = d.brandId, ws = store.state.workspace;
      var canEdit = store.can('content.edit', br), canSubmit = store.can('content.submit', br), canSched = store.can('content.schedule', br), canPub = store.can('content.publish', br);
      var resets = p && ['in_review', 'approved', 'scheduled'].indexOf(st) >= 0 && ui$.dirty && contentDirty();
      var willStatus = resets ? 'draft' : st;
      var b = '<div class="cmp-bar__l">' + (p ? '<button class="btn btn--ghost btn--danger btn--sm" data-del>' + ui.icon('trash', 14) + '<span class="hide-sm">Delete</span></button>' : '') + '</div><div class="cmp-bar__r">';
      b += '<button class="btn" data-save' + (canEdit ? '' : ' disabled') + '>' + (willStatus === 'draft' || st === 'changes_requested' ? 'Save draft' : 'Save changes') + '</button>';
      if (willStatus === 'draft' || willStatus === 'changes_requested') {
        var stages = store.stages(br);
        if (stages.length) b += '<button class="btn btn--p" data-submit' + (canSubmit ? '' : ' disabled title="' + ui.esc(store.why('content.submit', br)) + '"') + '>' + ui.icon('send', 15) + (st === 'changes_requested' || resets ? 'Resubmit for review' : 'Submit for approval') + '</button>';
        if (!ws.approval.requireBeforeSchedule || !stages.length) b += '<button class="btn ' + (stages.length ? '' : 'btn--p') + '" data-schedule' + (canSched ? '' : ' disabled title="' + ui.esc(store.why('content.schedule', br)) + '"') + '>' + ui.icon('cal', 15) + 'Schedule</button>';
      } else if (willStatus === 'in_review') {
        b += '<span class="cmp-bar__msg">' + ui.icon('clock', 14) + 'In review</span>';
      } else if (willStatus === 'approved' || willStatus === 'failed' || willStatus === 'scheduled') {
        b += '<button class="btn btn--p" data-schedule' + (canSched ? '' : ' disabled title="' + ui.esc(store.why('content.schedule', br)) + '"') + '>' + ui.icon('cal', 15) + (willStatus === 'scheduled' ? 'Update schedule' : 'Schedule') + '</button>';
        b += '<button class="btn" data-publish' + (canPub ? '' : ' disabled title="' + ui.esc(store.why('content.publish', br)) + '"') + '>' + ui.icon('zap', 15) + 'Publish now</button>';
      }
      b += '</div>';
      bar.innerHTML = b;
    }
    function contentDirty() { var p = cur(); if (!p) return true; return ['caption', 'captions', 'accountIds', 'mediaIds', 'options', 'campaignId', 'labels'].some(function (k) { return JSON.stringify(p[k] || (k === 'captions' || k === 'options' ? {} : k === 'labels' ? [] : null)) !== JSON.stringify(d[k] || (k === 'captions' || k === 'options' ? {} : k === 'labels' ? [] : null)); }); }

    /* ----- saving ----- */
    function persist(silent) {
      var payload = JSON.parse(JSON.stringify(d));
      if (!ui$.perNet) payload.captions = {};
      var p = ui.run(function () { return store.savePost(payload); });
      if (!p) return null;
      d.id = p.id; ui$.dirty = false; ui$.savedAt = p.updatedAt;
      store.setPref(draftKey(params.id), null); store.setPref(draftKey(null), null);
      if (!params.id) { params.id = p.id; app.updateQuery({}); history.replaceState(null, '', '#/compose/' + p.id); }
      if (!silent) ui.toast(p.status === 'draft' && editing && editing.status !== 'draft' ? 'Saved. Approvals were reset; resubmit when ready.' : 'Saved');
      editing = p; restored = null;
      return p;
    }
    function rerender() { shell(); }

    /* ----- uploads ----- */
    function upload(files) {
      [].slice.call(files).forEach(function (f) {
        var u = { key: Math.random().toString(36).slice(2), name: f.name, pct: 0, err: null };
        ui$.uploads.push(u); paintTray();
        pc.ingest(f, d.brandId, function (pct) { u.pct = pct; paintTray(); }).then(function (a) {
          ui$.uploads = ui$.uploads.filter(function (x) { return x !== u; });
          d.mediaIds.push(a.id); paintTray(); markDirty();
          if (!a._persisted) ui.toast('Your browser couldn’t store “' + f.name + '”, so it will be lost when you leave the page.', 'info');
        }).catch(function (e) { u.err = e.message; paintTray(); });
      });
    }
    function paintTray() { var t = root.querySelector('#tray'); if (t) { t.innerHTML = trayHtml(); ui.hydrate(t); } }

    /* ----- library picker ----- */
    function libraryPicker() {
      var picked = {}, filt = { q: '', type: '' };
      var m = ui.modal({ title: 'Add from library', size: 'wide', sub: ui.esc(brand().name) + ' · choose one or more files', body: '<div class="row wrap" style="margin-bottom:12px"><div class="search-inp" style="flex:1;min-width:180px">' + ui.icon('search', 15) + '<input class="inp" data-q placeholder="Search name or tag"></div><div class="seg" data-type><button data-t="" class="on">All</button><button data-t="image">Images</button><button data-t="video">Video</button></div></div><div class="pick" data-grid></div>', ok: 'Add files',
        onOk: function () { var ids = Object.keys(picked).filter(function (k) { return picked[k]; }); ids.forEach(function (id) { if (d.mediaIds.indexOf(id) < 0) d.mediaIds.push(id); }); if (ids.length) { paintTray(); markDirty(); } } });
      function draw() {
        var list = store.state.assets.filter(function (a) { return a.brandId === d.brandId && (!filt.type || a.type === filt.type) && (!filt.q || (a.name + ' ' + a.tags.join(' ')).toLowerCase().indexOf(filt.q) >= 0); });
        m.el.querySelector('[data-grid]').innerHTML = list.length ? list.map(function (a) { var on = picked[a.id] || d.mediaIds.indexOf(a.id) >= 0; return '<button type="button" class="pick__i' + (on ? ' on' : '') + '" data-pick="' + a.id + '"' + (d.mediaIds.indexOf(a.id) >= 0 ? ' disabled title="Already attached"' : '') + '>' + ui.media(a) + '<span>' + ui.esc(a.name) + '</span><i>' + ui.icon('check', 12, 3) + '</i></button>'; }).join('') : ui.empty('folder', 'No files match', 'Upload files from the composer or the Content Library.');
        var n = Object.keys(picked).filter(function (k) { return picked[k]; }).length;
        m.el.querySelector('[data-ok]').textContent = n ? 'Add ' + n + ' file' + (n > 1 ? 's' : '') : 'Add files';
      }
      m.el.addEventListener('click', function (e) { var b = e.target.closest('[data-pick]'); if (b && !b.disabled) { var id = b.getAttribute('data-pick'); picked[id] = !picked[id]; draw(); } var t = e.target.closest('[data-t]'); if (t) { filt.type = t.getAttribute('data-t'); m.el.querySelectorAll('[data-t]').forEach(function (x) { x.classList.toggle('on', x === t); }); draw(); } });
      m.el.querySelector('[data-q]').addEventListener('input', ui.debounce(function (e) { filt.q = e.target.value.trim().toLowerCase(); draw(); }, 120));
      draw();
    }
    function snippetMenu(anchor) {
      var sn = store.state.snippets.filter(function (s) { return s.brandId === d.brandId; });
      var items = [{ label: 'Insert into caption', header: true }];
      sn.forEach(function (s) { items.push({ label: s.name, icon: s.kind === 'hashtags' ? 'hash' : 'note', fn: function () { insert((s.kind === 'hashtags' ? '\n\n' : '\n') + s.body); } }); });
      if (!sn.length) items.push({ label: 'No snippets for this brand yet', disabled: true, fn: function () {} });
      items.push('-', { label: 'Manage snippets', icon: 'settings', fn: function () { app.go('#/library?tab=snippets'); } });
      ui.menu(anchor, items, { alignLeft: true });
    }
    function insert(txt) {
      var ta = root.querySelector('#capTa'), s = ta.selectionStart, e = ta.selectionEnd;
      ta.value = ta.value.slice(0, s) + txt + ta.value.slice(e); ta.selectionStart = ta.selectionEnd = s + txt.length; ta.focus();
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    }
    function emojiMenu(anchor) {
      var E = ['☕️', '🔥', '✨', '🌊', '💪', '🤍', '🙌', '📍', '👉', '🎉', '☀️', '🌿', '🧪', '🐬', '📸', '⏰'];
      var pnl = ui.pop(anchor, '<div class="emoji">' + E.map(function (x) { return '<button type="button" data-em="' + x + '">' + x + '</button>'; }).join('') + '</div>', { alignLeft: true });
      pnl.addEventListener('click', function (e) { var b = e.target.closest('[data-em]'); if (b) { ui.closePop(); insert(b.getAttribute('data-em')); } });
    }
    function exportPost() {
      var lines = ['ORBIT Social export', 'Brand: ' + brand().name, 'Planned: ' + (d.scheduledAt ? T.dateTime(d.scheduledAt) + ' (' + T.zoneLabel() + ')' : 'not set'), ''];
      plats().forEach(function (pid) { lines.push('— ' + PL.P[pid].name + ' —'); var o = d.options[pid] || {}; if (o.title) lines.push('Title: ' + o.title); lines.push(capFor(pid)); if (o.firstComment) lines.push('First comment: ' + o.firstComment); lines.push(''); });
      if (!plats().length) lines.push(d.caption, '');
      lines.push('Media:'); d.mediaIds.forEach(function (id) { var a = store.asset(id); if (a) lines.push('· ' + a.name + (a.local ? ' (stored in this browser)' : ' — ' + new URL(a.src, location.href).href)); });
      var blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' }), a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = (brand().handle || 'post') + '-' + (d.scheduledAt ? T.dayKey(d.scheduledAt) : 'draft') + '.txt'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 400);
      ui.toast('Exported captions and media links for manual posting');
    }

    function beforeUnload(e) { if (ui$.dirty) { e.preventDefault(); e.returnValue = ''; } }

    return {
      title: editing ? 'Edit post' : 'Compose', wide: true, static: true, html: h,
      crumbs: [['Calendar', '#/calendar']],
      leave: function () { window.removeEventListener('beforeunload', beforeUnload); if (ui$.dirty) ui.toast('Unsaved changes were kept. Open Compose again to restore them.', 'info'); },
      onChange: function (what) { if (what === 'post' || what === 'asset') { var p = cur(); if (p) { ui$.savedAt = p.updatedAt; } paintActions(); paintSave(); } },
      mount: function (r) {
        root = r.querySelector('#cmp');
        window.addEventListener('beforeunload', beforeUnload);
        shell();
        root.addEventListener('click', function (e) {
          var t;
          if ((t = e.target.closest('[data-restore]'))) { d = restored.d; ui$.perNet = !!restored.perNet; ui$.dirty = true; restored = null; rerender(); return; }
          if ((t = e.target.closest('[data-discard]'))) { store.setPref(draftKey(params.id), null); restored = null; rerender(); return; }
          if ((t = e.target.closest('[data-pv]'))) { ui$.pv = t.getAttribute('data-pv'); paintPreview(); return; }
          if ((t = e.target.closest('[data-ctab]'))) { ui$.tab = t.getAttribute('data-ctab'); root.querySelector('#capTabs').innerHTML = capTabs(); root.querySelector('#capTa').value = ui$.tab === 'all' ? d.caption : capFor(ui$.tab); return; }
          if ((t = e.target.closest('[data-ptype]'))) { var x = t.getAttribute('data-ptype').split(':'); d.options[x[0]] = Object.assign({}, d.options[x[0]], { type: x[1] }); root.querySelector('#netOpts').innerHTML = netOptsHtml(); markDirty(); return; }
          if ((t = e.target.closest('[data-rm]'))) { d.mediaIds.splice(+t.getAttribute('data-rm'), 1); paintTray(); markDirty(); return; }
          if ((t = e.target.closest('[data-left]'))) { var i = +t.getAttribute('data-left'), m = d.mediaIds.splice(i, 1)[0]; d.mediaIds.splice(i - 1, 0, m); paintTray(); markDirty(); return; }
          if ((t = e.target.closest('[data-uperr]'))) { ui$.uploads = ui$.uploads.filter(function (u) { return u.key !== t.getAttribute('data-uperr'); }); paintTray(); return; }
          if (e.target.closest('#drop') && e.target.id !== 'file') { root.querySelector('#file').click(); return; }
          if (e.target.closest('[data-lib]')) { libraryPicker(); return; }
          if ((t = e.target.closest('[data-snip]'))) { snippetMenu(t); return; }
          if ((t = e.target.closest('[data-emoji]'))) { emojiMenu(t); return; }
          if (e.target.closest('[data-export]')) { exportPost(); return; }
          if (e.target.closest('[data-details]')) { pc.drawer(d.id); return; }
          if ((t = e.target.closest('[data-best]'))) { var dk = root.querySelector('[data-f=date]').value || T.addDaysKey(T.todayKey(), 1); root.querySelector('[data-f=date]').value = dk; root.querySelector('[data-f=time]').value = t.getAttribute('data-best'); d.scheduledAt = T.iso(dk, t.getAttribute('data-best')); markDirty(); return; }
          if (e.target.closest('[data-cleardate]')) { d.scheduledAt = null; root.querySelector('[data-f=date]').value = ''; root.querySelector('[data-f=time]').value = ''; markDirty(); return; }
          if (e.target.closest('[data-save]')) { persist(); rerender(); return; }
          if (e.target.closest('[data-submit]')) { var p = persist(true); if (p && ui.run(function () { return store.submit(p.id); }, 'Submitted for review')) { ui$.dirty = false; rerender(); } else if (p) rerender(); return; }
          if (e.target.closest('[data-schedule]')) {
            var p2 = cur();
            var go = function () { pc.pickTime({ title: 'Schedule post', ok: 'Schedule', iso: d.scheduledAt && new Date(d.scheduledAt) > new Date() ? d.scheduledAt : null, help: 'The simulated scheduler marks the post as published when its time comes. Nothing reaches real networks in this template.', onOk: function (iso) { var saved = persist(true); if (!saved) return false; var r = store.schedule(saved.id, iso); d.scheduledAt = iso; ui.toast('Scheduled for ' + T.dateTime(iso)); rerender(); return r; } }); };
            go(); return;
          }
          if (e.target.closest('[data-publish]')) { var p3 = persist(true); if (p3) pc.publishDialog(p3.id, rerender); return; }
          if (e.target.closest('[data-del]')) { ui.confirm({ title: 'Delete this post?', body: 'The post, its comments and approval history are removed. This can’t be undone.', ok: 'Delete post', danger: true }).then(function (ok) { if (ok && ui.run(function () { return store.deletePost(d.id); }, 'Post deleted')) { ui$.dirty = false; store.setPref(draftKey(params.id), null); app.go('#/calendar'); } }); return; }
        });
        root.addEventListener('keydown', function (e) { if (e.target.id === 'drop' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); root.querySelector('#file').click(); } });
        root.addEventListener('change', function (e) {
          var t = e.target;
          if (t.matches('[data-acc]')) { var id = t.getAttribute('data-acc'); if (t.checked) { if (d.accountIds.indexOf(id) < 0) d.accountIds.push(id); } else d.accountIds = d.accountIds.filter(function (x) { return x !== id; }); t.closest('.accrow').classList.toggle('on', t.checked); root.querySelector('#netOpts').innerHTML = netOptsHtml(); root.querySelector('#capTabs').innerHTML = capTabs(); var pn = root.querySelector('[data-pernet]'); if (pn) pn.disabled = plats().length < 2; paintCounts(); markDirty(); return; }
          if (t.matches('[data-f=brand]')) { if (!t.value) return; d.brandId = t.value; d.accountIds = []; d.mediaIds = d.mediaIds.filter(function (m) { var a = store.asset(m); return a && a.brandId === d.brandId; }); d.campaignId = null; d.options = {}; ui$.dirty = true; rerender(); return; }
          if (t.matches('[data-f=campaign]')) { d.campaignId = t.value || null; markDirty(); return; }
          if (t.matches('[data-f=labels]')) { d.labels = t.value.split(',').map(function (x) { return x.trim(); }).filter(Boolean); markDirty(); return; }
          if (t.matches('[data-f=date],[data-f=time]')) { var dv = root.querySelector('[data-f=date]').value, tv = root.querySelector('[data-f=time]').value || store.state.workspace.defaultTime; if (dv) { root.querySelector('[data-f=time]').value = tv; d.scheduledAt = T.iso(dv, tv); } else d.scheduledAt = null; markDirty(); return; }
          if (t.matches('[data-pernet]')) { ui$.perNet = t.checked; if (!t.checked) { d.captions = {}; ui$.tab = 'all'; root.querySelector('#capTa').value = d.caption; } root.querySelector('#capTabs').innerHTML = capTabs(); paintCounts(); markDirty(); return; }
          if (t.matches('[data-opt]') && t.tagName === 'SELECT') { var x = t.getAttribute('data-opt').split(':'); d.options[x[0]] = Object.assign({}, d.options[x[0]]); d.options[x[0]][x[1]] = t.value; markDirty(); return; }
          if (t.id === 'file') { upload(t.files); t.value = ''; }
        });
        root.addEventListener('input', function (e) {
          var t = e.target;
          if (t.id === 'capTa') { if (ui$.tab === 'all') d.caption = t.value; else { d.captions[ui$.tab] = t.value; root.querySelector('#capTabs').innerHTML = capTabs(); } paintCounts(); markDirty(); return; }
          if (t.matches('[data-opt]') && t.tagName === 'INPUT') { var x = t.getAttribute('data-opt').split(':'); d.options[x[0]] = Object.assign({}, d.options[x[0]]); d.options[x[0]][x[1]] = t.value; markDirty(); }
        });
        var dz;
        root.addEventListener('dragover', function (e) { if ((dz = e.target.closest('#drop')) && e.dataTransfer.types.indexOf('Files') >= 0) { e.preventDefault(); dz.classList.add('over'); } });
        root.addEventListener('dragleave', function (e) { var z = e.target.closest('#drop'); if (z) z.classList.remove('over'); });
        root.addEventListener('drop', function (e) { var z = e.target.closest('#drop'); if (z && e.dataTransfer.files.length) { e.preventDefault(); z.classList.remove('over'); upload(e.dataTransfer.files); } });
        // reorder tray by drag
        var dragI = null;
        root.addEventListener('dragstart', function (e) { var it = e.target.closest('[data-mi]'); if (it) { dragI = +it.getAttribute('data-mi'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', 'media'); } });
        root.addEventListener('dragover', function (e) { if (dragI != null && e.target.closest('[data-mi]')) e.preventDefault(); });
        root.addEventListener('drop', function (e) { var it = e.target.closest('[data-mi]'); if (dragI != null && it) { e.preventDefault(); var to = +it.getAttribute('data-mi'), m = d.mediaIds.splice(dragI, 1)[0]; d.mediaIds.splice(to, 0, m); dragI = null; paintTray(); markDirty(); } });
        root.addEventListener('dragend', function () { dragI = null; });
        pc.bindPreviews(root);
        if (q.upload) setTimeout(function () { var f = root.querySelector('#file'); if (f) f.click(); }, 200);
      }
    };
  }
  OS.route('/compose', function (p, q) { return page({}, q); });
  OS.route('/compose/:id', function (p, q) { return page(p, q); });
})();
