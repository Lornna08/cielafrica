/* ============================================================
   ORBIT SOCIAL — data & service layer
   The only module that changes data. Every write:
     1. checks permission through OS.policy (same rules a server
        would apply — see README "Moving to production"),
     2. validates input,
     3. records activity, then saves and notifies subscribers.
   Persistence in this template: the visitor's browser
   (localStorage for records, IndexedDB for uploaded files).
   ============================================================ */
window.OS = window.OS || {};
(function () {
  'use strict';
  var KEY = 'orbit:template:v1', PREF = 'orbit:template:prefs';
  var S = null, subs = [], persistOk = true, policy = OS.policy, PL = OS.platforms, T = OS.time;
  var store = OS.store = {};

  function err(msg) { var e = new Error(msg); e.userFacing = true; return e; }
  function uid(p) { return (p || 'x') + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function now() { return new Date().toISOString(); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /* ---------- persistence ---------- */
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); persistOk = true; }
    catch (e) { persistOk = false; }
  }
  function emit(what) { save(); subs.forEach(function (f) { try { f(what); } catch (e) { console.error(e); } }); }
  store.subscribe = function (f) { subs.push(f); };
  store.persistOk = function () { return persistOk; };
  store.init = function () {
    try { var raw = localStorage.getItem(KEY); if (raw) S = JSON.parse(raw); } catch (e) { persistOk = false; }
    if (!S || S.v !== 1) { S = OS.seed(); save(); }
    T.zone = S.workspace.timezone || 'Africa/Nairobi';
    store.state = S;
  };
  store.reset = function () { S = OS.seed(); store.state = S; T.zone = S.workspace.timezone; OS.media.clear(); emit('reset'); };
  store.prefs = (function () { try { return JSON.parse(localStorage.getItem(PREF) || '{}') || {}; } catch (e) { return {}; } })();
  store.setPref = function (k, v) { store.prefs[k] = v; try { localStorage.setItem(PREF, JSON.stringify(store.prefs)); } catch (e) { /* optional */ } };

  /* ---------- lookups ---------- */
  function by(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
  store.me = function () { return by(S.users, S.currentUserId) || S.users[0]; };
  store.user = function (id) { return by(S.users, id); };
  store.brand = function (id) { return by(S.brands, id); };
  store.account = function (id) { return by(S.accounts, id); };
  store.asset = function (id) { return by(S.assets, id); };
  store.post = function (id) { return by(S.posts, id); };
  store.campaign = function (id) { return by(S.campaigns, id); };
  store.conv = function (id) { return by(S.conversations, id); };
  store.can = function (perm, brandId) { return policy.has(S.workspace, store.me(), perm, brandId); };
  store.why = function (perm, brandId) { return policy.why(S.workspace, store.me(), perm, brandId); };
  function need(perm, brandId) { policy.assert(S.workspace, store.me(), perm, brandId); }
  store.brands = function () { var me = store.me(); return S.brands.filter(function (b) { return !b.archived && policy.hasBrand(me, b.id); }); };
  store.inScope = function (brandId) { var sel = store.prefs.brand; var me = store.me(); if (!policy.hasBrand(me, brandId)) return false; return !sel || sel === brandId; };
  store.scopeBrand = function () { var b = store.prefs.brand && store.brand(store.prefs.brand); return b && policy.hasBrand(store.me(), b.id) ? b : null; };
  store.accounts = function (brandId) { return S.accounts.filter(function (a) { return (brandId ? a.brandId === brandId : store.inScope(a.brandId)); }); };
  store.postsInScope = function () { return S.posts.filter(function (p) { return store.inScope(p.brandId); }); };
  store.platformsOf = function (p) { var out = []; (p.accountIds || []).forEach(function (id) { var a = store.account(id); if (a && out.indexOf(a.platform) < 0) out.push(a.platform); }); return out; };
  store.mediaOf = function (p) { return (p.mediaIds || []).map(store.asset).filter(Boolean); };
  store.stages = function (brandId) { return policy.stagesFor(S.workspace, store.brand(brandId)); };
  store.reviewBlock = function (p) { return policy.reviewBlock(S.workspace, store.me(), p, store.brand(p.brandId)); };
  store.title = function (p) { var t = (p.caption || '').split('\n')[0].trim(); if (!t) return p.mediaIds && p.mediaIds.length ? 'Untitled media post' : 'Untitled draft'; return t.length > 64 ? t.slice(0, 62).replace(/\s+\S*$/, '') + '…' : t; };

  /* ---------- activity & notifications ---------- */
  function log(type, text, brandId, postId, userId) {
    S.activity.unshift({ id: uid('ac'), at: now(), userId: userId === undefined ? store.me().id : userId, type: type, text: text, brandId: brandId || null, postId: postId || null });
    if (S.activity.length > 200) S.activity.length = 200;
  }
  function notify(userIds, n) {
    var me = store.me().id;
    var to = (userIds || []).filter(function (u) { return u && u !== me; });
    if (userIds && !to.length) return;
    S.notifications.unshift({ id: uid('n'), at: now(), read: false, userIds: userIds ? to : null, kind: n.kind || 'info', icon: n.icon || 'bell', title: n.title, body: n.body || '', link: n.link || '#/' });
    if (S.notifications.length > 80) S.notifications.length = 80;
  }
  store.notifications = function () { var me = store.me().id; return S.notifications.filter(function (n) { return !n.userIds || n.userIds.indexOf(me) >= 0; }); };
  store.markRead = function (id) { var n = by(S.notifications, id); if (n) { n.read = true; emit('notif'); } };
  store.markAllRead = function () { store.notifications().forEach(function (n) { n.read = true; }); emit('notif'); };
  function reviewersFor(p) {
    var st = store.stages(p.brandId)[p.stage || 0]; if (!st) return [];
    return S.users.filter(function (u) { return u.status === 'active' && st.roles.indexOf(u.role) >= 0 && policy.has(S.workspace, u, 'content.approve', p.brandId) && u.id !== p.authorId && u.role !== 'owner'; }).map(function (u) { return u.id; });
  }

  /* ---------- posts ---------- */
  var EDITABLE = ['caption', 'accountIds', 'mediaIds', 'options', 'campaignId', 'labels', 'captions'];
  function contentChanged(p, d) { return EDITABLE.some(function (k) { return d[k] !== undefined && JSON.stringify(d[k]) !== JSON.stringify(p[k]); }); }
  store.validatePost = function (p) {
    var out = { errors: [], byPlatform: {} }, media = store.mediaOf(p);
    if (!p.brandId) out.errors.push('Choose a brand.');
    if (!(p.accountIds || []).length) out.errors.push('Choose at least one account.');
    store.platformsOf(p).forEach(function (pid) { out.byPlatform[pid] = PL.validate(p, pid, media); });
    return out;
  };
  function assertPublishable(p) {
    var v = store.validatePost(p), msgs = v.errors.slice();
    Object.keys(v.byPlatform).forEach(function (pid) { v.byPlatform[pid].errors.forEach(function (e) { msgs.push(PL.P[pid].name + ': ' + e); }); });
    if (msgs.length) throw err(msgs[0] + (msgs.length > 1 ? ' (+' + (msgs.length - 1) + ' more)' : ''));
  }
  function future(iso, label) { if (!iso) throw err('Pick a date and time.'); if (new Date(iso).getTime() < Date.now() + 60000) throw err((label || 'That time') + ' is in the past. Pick a time at least a minute from now.'); }

  store.savePost = function (d) {
    var me = store.me(), p = d.id ? store.post(d.id) : null;
    var brandId = d.brandId || (p && p.brandId);
    need('content.edit', brandId);
    if (!brandId || !store.brand(brandId)) throw err('Choose a brand.');
    (d.accountIds || []).forEach(function (aid) { var a = store.account(aid); if (!a || a.brandId !== brandId) throw err('Every account must belong to the selected brand.'); });
    (d.mediaIds || []).forEach(function (mid) { if (!store.asset(mid)) throw err('One of the attached files no longer exists.'); });
    if (p && p.status === 'published') throw err('Published posts can’t be edited. Duplicate it to reuse the content.');
    if (d.scheduledAt && p && p.status === 'scheduled' && d.scheduledAt !== p.scheduledAt) future(d.scheduledAt, 'The new time');
    if (!p) {
      p = { id: uid('p'), brandId: brandId, caption: '', accountIds: [], mediaIds: [], options: {}, campaignId: null, labels: [], status: 'draft', stage: 0, version: 1, scheduledAt: null, publishedAt: null, authorId: me.id, createdAt: now(), updatedAt: now(), approvals: [], comments: [], results: {}, metrics: null };
      EDITABLE.concat(['scheduledAt']).forEach(function (k) { if (d[k] !== undefined) p[k] = clone(d[k]); });
      S.posts.push(p);
      log('created', 'created a draft “' + store.title(p) + '”', brandId, p.id);
      emit('post'); return p;
    }
    if (p.brandId !== brandId) { p.brandId = brandId; }
    var changed = contentChanged(p, d);
    EDITABLE.forEach(function (k) { if (d[k] !== undefined) p[k] = clone(d[k]); });
    if (d.scheduledAt !== undefined) p.scheduledAt = d.scheduledAt;
    if (changed && ['in_review', 'approved', 'scheduled'].indexOf(p.status) >= 0) {
      var was = p.status;
      p.status = 'draft'; p.stage = 0; p.version++;
      p.comments.push({ id: uid('c'), userId: null, body: 'Content edited by ' + me.name + ' after it was ' + (was === 'in_review' ? 'submitted' : was) + '. Approvals were reset; resubmit version ' + p.version + ' for review.', at: now(), version: p.version, kind: 'system' });
      log('edited', 'edited “' + store.title(p) + '”, approvals reset', p.brandId, p.id);
    } else if (changed && p.status === 'changes_requested' && p.approvals.some(function (a) { return a.version === p.version; })) {
      p.version++;
    }
    p.updatedAt = now();
    emit('post'); return p;
  };

  store.submit = function (id) {
    var p = store.post(id), me = store.me();
    if (!p) throw err('Post not found.');
    need('content.submit', p.brandId);
    if (['draft', 'changes_requested'].indexOf(p.status) < 0) throw err('Only drafts or posts with requested changes can be submitted.');
    assertPublishable(p);
    if (p.approvals.some(function (a) { return a.version === p.version; })) p.version++;
    var stages = store.stages(p.brandId);
    p.submittedAt = now(); p.updatedAt = now();
    if (!stages.length) { p.status = 'approved'; p.stage = 0; log('approved', 'marked “' + store.title(p) + '” approved (no review steps configured)', p.brandId, p.id); emit('post'); return p; }
    p.status = 'in_review'; p.stage = 0;
    p.comments.push({ id: uid('c'), userId: null, body: me.name + ' submitted version ' + p.version + ' for ' + stages[0].name.toLowerCase() + '.', at: now(), version: p.version, kind: 'system' });
    log('submitted', 'submitted “' + store.title(p) + '” for review', p.brandId, p.id);
    notify(reviewersFor(p), { title: 'New post to review', body: store.brand(p.brandId).name + ' · ' + store.title(p), link: '#/approvals?open=' + p.id, icon: 'check' });
    emit('post'); return p;
  };

  store.approve = function (id, note) {
    var p = store.post(id), me = store.me();
    if (!p) throw err('Post not found.');
    var block = store.reviewBlock(p); if (block) throw err(block);
    var stages = store.stages(p.brandId), st = stages[p.stage || 0];
    p.approvals.push({ stageId: st.id, stageName: st.name, userId: me.id, decision: 'approved', at: now(), version: p.version, note: note || '' });
    if (note) p.comments.push({ id: uid('c'), userId: me.id, body: note, at: now(), version: p.version, kind: 'comment' });
    p.updatedAt = now();
    if ((p.stage || 0) < stages.length - 1) {
      p.stage = (p.stage || 0) + 1;
      log('approved', 'approved the ' + st.name.toLowerCase() + ' of “' + store.title(p) + '”', p.brandId, p.id);
      notify(reviewersFor(p), { title: 'Ready for ' + stages[p.stage].name.toLowerCase(), body: store.title(p), link: '#/approvals?open=' + p.id, icon: 'check' });
    } else {
      p.status = 'approved';
      log('approved', 'gave final approval to “' + store.title(p) + '”', p.brandId, p.id);
      notify([p.authorId], { title: 'Your post was approved', body: store.title(p), link: '#/approvals?open=' + p.id, icon: 'check', kind: 'ok' });
      if (S.workspace.approval.autoSchedule !== false && p.scheduledAt && new Date(p.scheduledAt).getTime() > Date.now() + 60000) {
        p.status = 'scheduled';
        p.comments.push({ id: uid('c'), userId: null, body: 'Scheduled automatically for ' + T.dateTime(p.scheduledAt) + ' (workspace rule: schedule approved posts that have a date).', at: now(), version: p.version, kind: 'system' });
        log('scheduled', 'scheduled “' + store.title(p) + '” automatically after approval', p.brandId, p.id, null);
      }
    }
    emit('post'); return p;
  };

  store.requestChanges = function (id, note) {
    var p = store.post(id), me = store.me();
    if (!p) throw err('Post not found.');
    var block = store.reviewBlock(p); if (block) throw err(block);
    if (!note || note.trim().length < 3) throw err('Tell the author what to change.');
    var st = store.stages(p.brandId)[p.stage || 0];
    p.approvals.push({ stageId: st.id, stageName: st.name, userId: me.id, decision: 'changes', at: now(), version: p.version, note: note.trim() });
    p.comments.push({ id: uid('c'), userId: me.id, body: note.trim(), at: now(), version: p.version, kind: 'feedback' });
    p.status = 'changes_requested'; p.stage = 0; p.updatedAt = now();
    log('changes', 'requested changes on “' + store.title(p) + '”', p.brandId, p.id);
    notify([p.authorId], { title: me.name + ' requested changes', body: store.title(p), link: '#/approvals?open=' + p.id, icon: 'message', kind: 'warn' });
    emit('post'); return p;
  };

  store.comment = function (id, body) {
    var p = store.post(id), me = store.me();
    if (!p) throw err('Post not found.');
    need('content.view', p.brandId);
    body = (body || '').trim(); if (!body) throw err('Write a comment first.');
    p.comments.push({ id: uid('c'), userId: me.id, body: body, at: now(), version: p.version, kind: 'comment' });
    var mentioned = S.users.filter(function (u) { return body.toLowerCase().indexOf('@' + u.name.split(' ')[0].toLowerCase()) >= 0; }).map(function (u) { return u.id; });
    notify(mentioned.length ? mentioned : [p.authorId], { title: me.name + (mentioned.length ? ' mentioned you' : ' commented'), body: store.title(p), link: '#/approvals?open=' + p.id, icon: 'message' });
    emit('post'); return p;
  };

  store.schedule = function (id, iso) {
    var p = store.post(id);
    if (!p) throw err('Post not found.');
    need('content.schedule', p.brandId);
    if (p.status === 'published') throw err('This post is already published.');
    var ok = S.workspace.approval.requireBeforeSchedule ? ['approved', 'scheduled', 'failed'] : ['draft', 'changes_requested', 'approved', 'scheduled', 'failed'];
    if (ok.indexOf(p.status) < 0) throw err(p.status === 'in_review' ? 'This post is still in review. It can be scheduled once it’s approved.' : 'This workspace requires approval before scheduling.');
    assertPublishable(p);
    future(iso);
    var was = p.status;
    p.scheduledAt = iso; p.status = 'scheduled'; p.updatedAt = now(); p.results = {};
    log('scheduled', (was === 'scheduled' ? 'rescheduled' : 'scheduled') + ' “' + store.title(p) + '” for ' + T.dateTime(iso), p.brandId, p.id);
    emit('post'); return p;
  };
  // move a post's date (planned date for drafts; publish time for scheduled posts)
  store.reschedule = function (id, iso) {
    var p = store.post(id);
    if (!p) throw err('Post not found.');
    if (p.status === 'published') throw err('Published posts can’t be moved.');
    need(p.status === 'scheduled' ? 'content.schedule' : 'content.edit', p.brandId);
    future(iso, 'The new time');
    p.scheduledAt = iso; p.updatedAt = now();
    if (p.status === 'failed') p.status = 'approved';
    log('rescheduled', 'moved “' + store.title(p) + '” to ' + T.dateTime(iso), p.brandId, p.id);
    emit('post'); return p;
  };
  store.unschedule = function (id) {
    var p = store.post(id);
    if (!p) throw err('Post not found.');
    need('content.schedule', p.brandId);
    if (p.status !== 'scheduled') throw err('This post isn’t scheduled.');
    p.status = 'approved'; p.updatedAt = now();
    log('unscheduled', 'cancelled the schedule for “' + store.title(p) + '”', p.brandId, p.id);
    emit('post'); return p;
  };

  // Publish through each account's adapter. In this template every account
  // is a sample account, so results are marked simulated.
  function publish(p, system) {
    var okAny = false, errs = [];
    p.results = {};
    p.accountIds.forEach(function (aid) {
      var a = store.account(aid);
      var r = a ? PL.adapterFor(a).publish(p, a) : { ok: false, error: 'This account was disconnected.' };
      p.results[aid] = { ok: r.ok, simulated: !!r.simulated, error: r.error || null, at: now() };
      if (r.ok) okAny = true; else errs.push(r.error);
    });
    if (okAny) {
      p.status = 'published'; p.publishedAt = now(); p.simulated = true; p.metrics = null;
      log('published', (system ? 'Scheduler published' : 'published') + ' “' + store.title(p) + '” (simulated)' + (errs.length ? ' with ' + errs.length + ' failed account' + (errs.length > 1 ? 's' : '') : ''), p.brandId, p.id, system ? null : undefined);
    } else {
      p.status = 'failed'; p.failedAt = now();
      log('failed', '“' + store.title(p) + '” failed to publish: ' + errs[0], p.brandId, p.id, system ? null : undefined);
      notify(null, { title: 'Post failed to publish', body: store.brand(p.brandId).name + ' · ' + errs[0], link: '#/calendar?view=list&status=failed', icon: 'alert', kind: 'warn' });
    }
    p.updatedAt = now();
    return { ok: okAny, errors: errs };
  }
  store.publishNow = function (id) {
    var p = store.post(id);
    if (!p) throw err('Post not found.');
    need('content.publish', p.brandId);
    if (p.status === 'published') throw err('Already published.');
    if (S.workspace.approval.requireBeforeSchedule && ['approved', 'scheduled', 'failed'].indexOf(p.status) < 0) throw err(p.status === 'in_review' ? 'This post is still in review.' : 'This workspace requires approval before publishing.');
    assertPublishable(p);
    var r = publish(p, false); emit('post'); return r;
  };
  store.runScheduler = function () {
    var due = S.posts.filter(function (p) { return p.status === 'scheduled' && p.scheduledAt && new Date(p.scheduledAt).getTime() <= Date.now(); });
    due.forEach(function (p) { publish(p, true); });
    if (due.length) emit('post');
    return due.length;
  };

  store.duplicate = function (id) {
    var src = store.post(id);
    if (!src) throw err('Post not found.');
    need('content.edit', src.brandId);
    var p = clone(src);
    p.id = uid('p'); p.status = 'draft'; p.stage = 0; p.version = 1; p.scheduledAt = null; p.publishedAt = null; p.simulated = false; p.sample = false;
    p.authorId = store.me().id; p.createdAt = now(); p.updatedAt = now(); p.approvals = []; p.results = {}; p.metrics = null; p.failedAt = null; p.submittedAt = null;
    p.comments = [{ id: uid('c'), userId: null, body: 'Duplicated from “' + store.title(src) + '”.', at: now(), version: 1, kind: 'system' }];
    S.posts.push(p);
    log('created', 'duplicated “' + store.title(src) + '”', p.brandId, p.id);
    emit('post'); return p;
  };
  store.deletePost = function (id) {
    var p = store.post(id);
    if (!p) throw err('Post not found.');
    need('content.edit', p.brandId);
    if (p.status === 'published') throw err('Published posts stay in the record. Remove them on the network itself.');
    if (p.status === 'scheduled') need('content.schedule', p.brandId);
    S.posts = S.posts.filter(function (x) { return x.id !== id; }); store.state = S;
    log('deleted', 'deleted “' + store.title(p) + '”', p.brandId, null);
    emit('post'); return true;
  };

  /* ---------- library ---------- */
  store.addAsset = function (a) {
    need('content.edit', a.brandId);
    var x = { id: a.id || uid('m'), name: a.name, type: a.type, brandId: a.brandId, campaignId: a.campaignId || null, tags: a.tags || [], alt: a.alt || '', src: a.src, thumb: a.thumb, w: a.w, h: a.h, duration: a.duration || null, size: a.size, uploadedAt: now(), uploadedBy: store.me().id, local: !!a.local, credit: null };
    S.assets.unshift(x);
    log('uploaded', 'uploaded ' + x.name, x.brandId);
    emit('asset'); return x;
  };
  store.updateAsset = function (id, d) {
    var a = store.asset(id); if (!a) throw err('File not found.');
    need('content.edit', a.brandId);
    if (d.brandId && d.brandId !== a.brandId) need('content.edit', d.brandId);
    ['name', 'alt', 'tags', 'campaignId', 'brandId'].forEach(function (k) { if (d[k] !== undefined) a[k] = d[k]; });
    if (!String(a.name || '').trim()) throw err('A file name is required.');
    emit('asset'); return a;
  };
  store.duplicateAsset = function (id, brandId) {
    var a = store.asset(id); if (!a) throw err('File not found.');
    need('content.edit', brandId || a.brandId);
    var x = clone(a); x.id = uid('m'); x.brandId = brandId || a.brandId; x.name = a.name.replace(/(\.\w+)?$/, ' copy$1'); x.uploadedAt = now(); x.uploadedBy = store.me().id;
    if (x.brandId !== a.brandId) x.campaignId = null;
    S.assets.unshift(x); emit('asset'); return x;
  };
  store.assetUsage = function (id) { return S.posts.filter(function (p) { return (p.mediaIds || []).indexOf(id) >= 0; }); };
  store.deleteAsset = function (id) {
    var a = store.asset(id); if (!a) throw err('File not found.');
    need('content.edit', a.brandId);
    var used = store.assetUsage(id).filter(function (p) { return p.status !== 'published'; });
    if (used.length) throw err('Used in ' + used.length + ' upcoming post' + (used.length > 1 ? 's' : '') + '. Remove it from those posts first.');
    S.assets = S.assets.filter(function (x) { return x.id !== id; });
    if (a.local) OS.media.remove(a.id);
    emit('asset'); return true;
  };
  store.saveSnippet = function (d) {
    need('content.edit', d.brandId);
    if (!d.name || !d.body) throw err('A snippet needs a name and text.');
    var s = d.id && by(S.snippets, d.id);
    if (s) { s.name = d.name; s.body = d.body; s.kind = d.kind; s.brandId = d.brandId; } else { s = { id: uid('s'), name: d.name, body: d.body, kind: d.kind || 'caption', brandId: d.brandId }; S.snippets.push(s); }
    emit('snippet'); return s;
  };
  store.deleteSnippet = function (id) { var s = by(S.snippets, id); if (!s) return; need('content.edit', s.brandId); S.snippets = S.snippets.filter(function (x) { return x.id !== id; }); emit('snippet'); };

  store.saveCampaign = function (d) {
    need('content.schedule', d.brandId);
    if (!d.name || !d.name.trim()) throw err('Give the campaign a name.');
    if (!d.start || !d.end) throw err('Choose start and end dates.');
    if (d.end < d.start) throw err('The end date is before the start date.');
    var c = d.id && store.campaign(d.id);
    if (c) { if (c.brandId !== d.brandId) need('content.schedule', c.brandId); ['name', 'brandId', 'start', 'end', 'goal', 'color'].forEach(function (k) { if (d[k] !== undefined) c[k] = d[k]; }); }
    else { c = { id: uid('c'), brandId: d.brandId, name: d.name.trim(), start: d.start, end: d.end, goal: d.goal || '', color: d.color || '#0E7C6E' }; S.campaigns.push(c); }
    log('campaign', (d.id ? 'updated' : 'created') + ' the campaign ' + c.name, c.brandId);
    emit('campaign'); return c;
  };

  /* ---------- inbox ---------- */
  function convNeed(c, perm) { if (!c) throw err('Conversation not found.'); need(perm, c.brandId); }
  store.reply = function (id, body) {
    var c = store.conv(id); convNeed(c, 'inbox.reply');
    body = (body || '').trim(); if (!body) throw err('Write a reply first.');
    var a = store.account(c.accountId);
    if (a && a.status === 'expired') throw err('The ' + PL.P[a.platform].name + ' connection has expired. Reconnect it to reply.');
    c.messages.push({ id: uid('msg'), from: 'us', userId: store.me().id, body: body, at: now(), simulated: true });
    c.unread = false;
    log('replied', 'replied to ' + c.contact.name + ' (simulated, not delivered)', c.brandId);
    emit('inbox');
  };
  store.note = function (id, body) {
    var c = store.conv(id); convNeed(c, 'inbox.view');
    body = (body || '').trim(); if (!body) throw err('Write a note first.');
    c.messages.push({ id: uid('msg'), from: 'note', userId: store.me().id, body: body, at: now() });
    emit('inbox');
  };
  store.convUpdate = function (id, d) {
    var c = store.conv(id); convNeed(c, 'inbox.view');
    if (d.assigneeId !== undefined) {
      if (d.assigneeId) { var u = store.user(d.assigneeId); if (!u || !policy.has(S.workspace, u, 'inbox.view', c.brandId)) throw err('That person can’t see this brand’s inbox.'); }
      c.assigneeId = d.assigneeId || null;
      if (d.assigneeId && d.assigneeId !== store.me().id) notify([d.assigneeId], { title: store.me().name + ' assigned you a conversation', body: c.contact.name, link: '#/inbox?open=' + c.id, icon: 'inbox' });
    }
    if (d.status) c.status = d.status;
    if (d.unread !== undefined) c.unread = d.unread;
    if (d.tags) c.tags = d.tags;
    emit('inbox');
  };

  /* ---------- team ---------- */
  function onlyOwnerFor(role) { if ((role === 'owner' || role === 'admin') && store.me().role !== 'owner') throw err('Only the workspace owner can grant the ' + policy.roleName(role) + ' role.'); }
  store.invite = function (d) {
    need('team.invite');
    var email = (d.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw err('Enter a valid email address.');
    if (S.users.some(function (u) { return u.email.toLowerCase() === email; })) throw err('Someone with that email is already in the workspace.');
    if (d.role === 'owner') throw err('There can only be one owner. Transfer ownership instead.');
    onlyOwnerFor(d.role);
    if (d.role !== 'admin' && d.brands !== 'all' && !(d.brands || []).length) throw err('Give them access to at least one brand.');
    var u = { id: uid('u'), name: d.name || email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); }), email: email, title: d.title || '', role: d.role, brands: d.role === 'admin' ? 'all' : d.brands, status: 'invited', lastActive: null, joinedAt: now() };
    S.users.push(u);
    log('team', 'invited ' + email + ' as ' + policy.roleName(d.role), null);
    emit('team'); return u;
  };
  store.updateMember = function (id, d) {
    need('team.invite');
    var u = store.user(id), me = store.me();
    if (!u) throw err('Member not found.');
    if (u.role === 'owner') throw err('The owner’s access can’t be changed.');
    if (u.id === me.id && (d.role || d.status)) throw err('You can’t change your own role or status.');
    if (d.role) { if (d.role === 'owner') throw err('Use “Transfer ownership” to change the owner.'); onlyOwnerFor(d.role); if (u.role === 'admin') onlyOwnerFor('admin'); u.role = d.role; if (d.role === 'admin') u.brands = 'all'; }
    if (d.brands) { if (d.brands !== 'all' && !d.brands.length) throw err('Give them access to at least one brand.'); u.brands = d.brands; }
    if (d.status) { if (u.role === 'admin') onlyOwnerFor('admin'); u.status = d.status; }
    if (d.title !== undefined) u.title = d.title;
    log('team', 'updated ' + u.name + ' (' + policy.roleName(u.role) + (d.status ? ', ' + d.status : '') + ')', null);
    emit('team'); return u;
  };
  store.removeMember = function (id) {
    need('team.invite');
    var u = store.user(id); if (!u) return;
    if (u.role === 'owner') throw err('The owner can’t be removed.');
    if (u.id === store.me().id) throw err('You can’t remove yourself.');
    if (u.role === 'admin') onlyOwnerFor('admin');
    S.users = S.users.filter(function (x) { return x.id !== id; });
    S.conversations.forEach(function (c) { if (c.assigneeId === id) c.assigneeId = null; });
    log('team', 'removed ' + u.name + ' from the workspace', null);
    emit('team');
  };
  store.setPermission = function (role, perm, val) {
    need('settings.manage');
    if (role === 'owner') throw err('The owner always has every permission.');
    var me = store.me();
    if (role === me.role && perm === 'settings.manage' && !val) throw err('You’d lock yourself out of settings. Ask the owner to change this.');
    if (role === 'admin' && me.role !== 'owner') throw err('Only the owner can change administrator permissions.');
    S.workspace.matrix[role][perm] = !!val;
    log('settings', (val ? 'allowed ' : 'removed ') + policy.roleName(role) + 's ' + (val ? 'to ' : 'from ') + perm.replace('.', ' '), null);
    emit('settings');
  };
  store.resetPermissions = function () { need('settings.manage'); if (store.me().role !== 'owner') throw err('Only the owner can restore default permissions.'); S.workspace.matrix = clone(policy.DEFAULT_MATRIX); emit('settings'); };
  store.setCurrentUser = function (id) { var u = store.user(id); if (!u || u.status !== 'active') throw err('Only active members can be selected.'); S.currentUserId = id; if (store.prefs.brand && !policy.hasBrand(u, store.prefs.brand)) store.setPref('brand', ''); emit('user'); };

  /* ---------- accounts ---------- */
  store.addSampleAccount = function (d) {
    need('accounts.manage', d.brandId);
    var p = PL.P[d.platform]; if (!p) throw err('Choose a platform.');
    var h = (d.handle || '').trim(); if (!h) throw err('Enter the account name or handle.');
    if (S.accounts.some(function (a) { return a.brandId === d.brandId && a.platform === d.platform && a.handle.toLowerCase() === h.toLowerCase(); })) throw err('That account is already in this brand.');
    var a = { id: uid('a'), brandId: d.brandId, platform: d.platform, name: d.name || h.replace(/^@/, ''), handle: h, followers: 0, status: 'sample', connection: 'sample', connectedAt: now(), lastSync: now(), note: 'Sample account added in the template. Not connected to ' + p.name + '.' };
    S.accounts.push(a);
    log('accounts', 'added a sample ' + p.name + ' account (' + h + ')', d.brandId);
    emit('accounts'); return a;
  };
  store.reconnectSample = function (id) {
    var a = store.account(id); if (!a) throw err('Account not found.');
    need('accounts.manage', a.brandId);
    a.status = 'sample'; a.note = ''; a.lastSync = now();
    log('accounts', 'refreshed the sample connection for ' + a.handle + ' (no real sign-in)', a.brandId);
    emit('accounts'); return a;
  };
  store.disconnect = function (id) {
    var a = store.account(id); if (!a) throw err('Account not found.');
    need('accounts.manage', a.brandId);
    var affected = S.posts.filter(function (p) { return p.status !== 'published' && p.accountIds.indexOf(id) >= 0; });
    affected.forEach(function (p) { p.accountIds = p.accountIds.filter(function (x) { return x !== id; }); if (!p.accountIds.length && p.status === 'scheduled') p.status = 'approved'; });
    S.accounts = S.accounts.filter(function (x) { return x.id !== id; });
    log('accounts', 'disconnected ' + a.handle, a.brandId);
    emit('accounts'); return affected.length;
  };

  /* ---------- settings ---------- */
  store.updateWorkspace = function (d) {
    need('settings.manage');
    if (d.name !== undefined && !String(d.name).trim()) throw err('The workspace needs a name.');
    if (d.timezone && T.ZONES.indexOf(d.timezone) < 0) throw err('Choose a time zone from the list.');
    if (d.defaultTime && !/^\d\d:\d\d$/.test(d.defaultTime)) throw err('Use a time like 09:00.');
    ['name', 'timezone', 'weekStart', 'defaultTime', 'bestTimes'].forEach(function (k) { if (d[k] !== undefined) S.workspace[k] = d[k]; });
    if (d.approval) Object.keys(d.approval).forEach(function (k) { S.workspace.approval[k] = d.approval[k]; });
    T.zone = S.workspace.timezone;
    log('settings', 'updated workspace settings', null);
    emit('settings');
  };
  store.saveBrand = function (d) {
    need('settings.manage');
    if (!d.name || !d.name.trim()) throw err('The brand needs a name.');
    if (!/^#[0-9a-f]{6}$/i.test(d.color || '')) throw err('Choose a brand colour.');
    var b = d.id && store.brand(d.id);
    if (b) { b.name = d.name.trim(); b.color = d.color; b.handle = d.handle || ''; b.industry = d.industry || ''; b.clientApproval = !!d.clientApproval; }
    else { b = { id: uid('b'), key: null, name: d.name.trim(), color: d.color, handle: d.handle || '', industry: d.industry || '', clientApproval: !!d.clientApproval, createdAt: now() }; S.brands.push(b); }
    log('settings', (d.id ? 'updated' : 'added') + ' the brand ' + b.name, b.id);
    emit('settings'); return b;
  };
  store.archiveBrand = function (id) {
    need('settings.manage');
    var b = store.brand(id); if (!b) return;
    if (S.posts.some(function (p) { return p.brandId === id && p.status === 'scheduled'; })) throw err('Cancel this brand’s scheduled posts before archiving it.');
    b.archived = true; if (store.prefs.brand === id) store.setPref('brand', '');
    log('settings', 'archived the brand ' + b.name, id);
    emit('settings');
  };
  store.updateProfile = function (d) {
    var me = store.me();
    if (d.name !== undefined && !d.name.trim()) throw err('Your name can’t be empty.');
    if (d.email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) throw err('Enter a valid email address.');
    ['name', 'email', 'title'].forEach(function (k) { if (d[k] !== undefined) me[k] = d[k].trim(); });
    if (d.notify) me.notify = d.notify;
    emit('user');
  };

  /* ---------- search ---------- */
  store.search = function (q, limit) {
    q = q.toLowerCase(); limit = limit || 6;
    var out = [];
    S.posts.filter(function (p) { return store.inScope(p.brandId) && (p.caption || '').toLowerCase().indexOf(q) >= 0; }).slice(0, limit).forEach(function (p) { out.push({ type: 'Post', title: store.title(p), sub: store.brand(p.brandId).name + ' · ' + OS.ui.statusLabel(p.status), link: '#/compose/' + p.id, post: p }); });
    S.assets.filter(function (a) { return store.inScope(a.brandId) && (a.name + ' ' + a.tags.join(' ') + ' ' + a.alt).toLowerCase().indexOf(q) >= 0; }).slice(0, limit).forEach(function (a) { out.push({ type: 'File', title: a.name, sub: store.brand(a.brandId).name + ' · ' + a.type, link: '#/library?open=' + a.id, asset: a }); });
    if (store.can('inbox.view')) S.conversations.filter(function (c) { return store.inScope(c.brandId) && (c.contact.name + ' ' + c.contact.handle + ' ' + c.messages.map(function (m) { return m.body; }).join(' ')).toLowerCase().indexOf(q) >= 0; }).slice(0, limit).forEach(function (c) { out.push({ type: 'Conversation', title: c.contact.name, sub: store.brand(c.brandId).name + ' · ' + c.kind, link: '#/inbox?open=' + c.id }); });
    S.campaigns.filter(function (c) { return store.inScope(c.brandId) && c.name.toLowerCase().indexOf(q) >= 0; }).slice(0, limit).forEach(function (c) { out.push({ type: 'Campaign', title: c.name, sub: store.brand(c.brandId).name, link: '#/calendar?campaign=' + c.id }); });
    S.users.filter(function (u) { return u.name.toLowerCase().indexOf(q) >= 0; }).slice(0, limit).forEach(function (u) { out.push({ type: 'Person', title: u.name, sub: policy.roleName(u.role), link: '#/team?open=' + u.id }); });
    return out;
  };

  /* ---------- analytics (sample source) ----------
     Returns a series per day for the given accounts. When a real
     provider is connected, swap OS.sampleDaily for stored metrics
     pulled server-side; the shape stays the same. */
  store.daily = function (accounts, days) {
    var today = T.todayKey(), out = [];
    for (var i = days - 1; i >= 0; i--) {
      var k = T.addDaysKey(today, -i), row = { day: k, followers: 0, reach: 0, impressions: 0, engagements: 0, clicks: 0 };
      accounts.forEach(function (a) { var d = OS.sampleDaily(a, k, i); row.followers += d.followers; row.reach += d.reach; row.impressions += d.impressions; row.engagements += d.engagements; row.clicks += d.clicks; });
      out.push(row);
    }
    return out;
  };

  /* ---------- media files (IndexedDB) ---------- */
  OS.media = (function () {
    var DB = null, urls = {}, mem = {}, ok = !!window.indexedDB;
    function db() {
      return new Promise(function (res, rej) {
        if (DB) return res(DB);
        if (!ok) return rej(new Error('no idb'));
        var r = indexedDB.open('orbit-template-media', 1);
        r.onupgradeneeded = function () { r.result.createObjectStore('files'); };
        r.onsuccess = function () { DB = r.result; res(DB); };
        r.onerror = function () { ok = false; rej(r.error); };
      });
    }
    return {
      available: function () { return ok; },
      put: function (id, blob) {
        urls[id] = URL.createObjectURL(blob);
        return db().then(function (d) { return new Promise(function (res, rej) { var tx = d.transaction('files', 'readwrite'); tx.objectStore('files').put(blob, id); tx.oncomplete = function () { res(true); }; tx.onerror = function () { rej(tx.error); }; }); })
          .catch(function () { mem[id] = blob; return false; });
      },
      url: function (id) {
        if (urls[id]) return Promise.resolve(urls[id]);
        return db().then(function (d) { return new Promise(function (res) { var r = d.transaction('files').objectStore('files').get(id); r.onsuccess = function () { if (r.result) { urls[id] = URL.createObjectURL(r.result); res(urls[id]); } else res(null); }; r.onerror = function () { res(null); }; }); }).catch(function () { return null; });
      },
      cached: function (id) { return urls[id] || null; },
      remove: function (id) { delete urls[id]; db().then(function (d) { d.transaction('files', 'readwrite').objectStore('files').delete(id); }).catch(function () {}); },
      clear: function () { urls = {}; db().then(function (d) { d.transaction('files', 'readwrite').objectStore('files').clear(); }).catch(function () {}); }
    };
  })();
})();
