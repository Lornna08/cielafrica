/* ============================================================
   ORBIT SOCIAL — Inbox
   Comments, messages and mentions in one place. This is a SAMPLE
   inbox: replies are saved here and marked "not delivered".
   Internal notes are visible to the team only, never to customers.
   ============================================================ */
(function () {
  'use strict';
  var ui = OS.ui, store = OS.store, T = OS.time, PL = OS.platforms, app = OS.app, pc = OS.pc;

  OS.route('/inbox', function (params, q) {
    var brand = store.scopeBrand();
    var vis = store.brands().filter(function (b) { return store.can('inbox.view', b.id) && store.inScope(b.id); });
    if (!vis.length) return { title: 'Inbox', html: app.ph('Inbox', '') + app.locked('The inbox isn’t available for your role', 'inbox.view', brand ? brand.id : null), mount: app.bindLocked };
    var me = store.me();
    var f = { filter: q.filter || 'open', kind: q.kind || '', account: q.account || '', q: q.q || '' };
    var openId = q.open || null;
    var mode = 'reply';

    function convs() {
      return store.state.conversations.filter(function (c) {
        if (!vis.some(function (b) { return b.id === c.brandId; })) return false;
        if (f.filter === 'open' && c.status !== 'open') return false;
        if (f.filter === 'unread' && !(c.unread && c.status === 'open')) return false;
        if (f.filter === 'mine' && c.assigneeId !== me.id) return false;
        if (f.filter === 'unassigned' && (c.assigneeId || c.status !== 'open')) return false;
        if (f.filter === 'resolved' && c.status !== 'resolved') return false;
        if (f.kind && c.kind !== f.kind) return false;
        if (f.account && c.accountId !== f.account) return false;
        if (f.q) { var hay = (c.contact.name + ' ' + c.contact.handle + ' ' + c.messages.map(function (m) { return m.body; }).join(' ') + ' ' + c.tags.join(' ')).toLowerCase(); if (hay.indexOf(f.q.toLowerCase()) < 0) return false; }
        return true;
      }).sort(function (a, b) { var x = a.messages[a.messages.length - 1].at, y = b.messages[b.messages.length - 1].at; return x < y ? 1 : -1; });
    }
    var KIND = { comment: ['Comment', 'message'], dm: ['Message', 'mail'], mention: ['Mention', 'at'] };

    var h = '<div class="inbox"><div class="ibx-list"><div class="ibx-list__h"><div class="row row--between"><h1>Inbox</h1><span class="pill pill--grey pill--plain" title="Sample conversations. Replies are not delivered to any network.">' + ui.icon('flask', 11) + 'Sample inbox</span></div>' +
      '<div class="search-inp">' + ui.icon('search', 15) + '<input class="inp inp--sm" data-iq placeholder="Search conversations" value="' + ui.esc(f.q) + '" aria-label="Search conversations"></div>' +
      '<div class="ibx-filt" role="tablist">' + [['open', 'Open'], ['unread', 'Unread'], ['mine', 'Mine'], ['unassigned', 'Unassigned'], ['resolved', 'Done']].map(function (x) { return '<button role="tab" data-if="' + x[0] + '" class="' + (f.filter === x[0] ? 'on' : '') + '" aria-selected="' + (f.filter === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div>' +
      '<div class="row" style="gap:6px">' + ui.select('kind', [{ value: '', label: 'All types' }, { value: 'comment', label: 'Comments' }, { value: 'dm', label: 'Messages' }, { value: 'mention', label: 'Mentions' }], f.kind, { cls: 'sel--sm', attr: ' data-ik aria-label="Type"' }) + ui.select('acc', [{ value: '', label: 'All accounts' }].concat(store.state.accounts.filter(function (a) { return vis.some(function (b) { return b.id === a.brandId; }); }).map(function (a) { return { value: a.id, label: a.handle + ' · ' + PL.P[a.platform].short }; })), f.account, { cls: 'sel--sm', attr: ' data-ia aria-label="Account"' }) + '</div></div><div class="ibx-items" data-items role="listbox" aria-label="Conversations"></div></div>' +
      '<div class="ibx-thread" data-thread></div><aside class="ibx-side" data-side aria-label="Conversation details"></aside></div>';

    return {
      title: 'Inbox', full: true, html: h,
      onChange: function () { if (this.repaint) this.repaint(); },
      mount: function (root) {
        var items = root.querySelector('[data-items]'), thread = root.querySelector('[data-thread]'), side = root.querySelector('[data-side]'), box = root.querySelector('.inbox');
        function sync() { app.updateQuery({ filter: f.filter === 'open' ? '' : f.filter, kind: f.kind, account: f.account, q: f.q, open: openId || '' }); }
        function paintList() {
          var list = convs();
          if (openId && !store.conv(openId)) openId = null;
          items.innerHTML = list.length ? list.map(function (c) {
            var last = c.messages[c.messages.length - 1], a = store.account(c.accountId), b = store.brand(c.brandId), as = c.assigneeId && store.user(c.assigneeId);
            return '<button type="button" class="ibx-i' + (c.id === openId ? ' on' : '') + (c.unread && c.status === 'open' ? ' unread' : '') + '" data-conv="' + c.id + '" role="option" aria-selected="' + (c.id === openId) + '"><span class="ibx-i__av">' + ui.avatar(c.contact.name) + (a ? ui.plat(a.platform, 16) : '') + '</span><span class="ibx-i__m"><span class="ibx-i__t"><b>' + ui.esc(c.contact.name) + '</b><em>' + T.rel(last.at) + '</em></span><span class="ibx-i__s">' + ui.icon(KIND[c.kind][1], 12) + KIND[c.kind][0] + ' · ' + ui.esc(b.name) + '</span><span class="ibx-i__p">' + (last.from === 'note' ? '<i>Note:</i> ' : last.from === 'us' ? 'You: ' : '') + ui.esc(last.body) + '</span>' + (as || c.tags.length ? '<span class="ibx-i__tags">' + (as ? ui.avatar(as.name, 'xs', true) : '') + c.tags.map(function (t) { return '<span class="tag">' + ui.esc(t) + '</span>'; }).join('') + '</span>' : '') + '</span>' + (c.unread && c.status === 'open' ? '<i class="ibx-dot" aria-label="Unread"></i>' : '') + '</button>';
          }).join('') : ui.empty('inbox', f.filter === 'unread' ? 'You’re all caught up' : 'No conversations', f.q ? 'Nothing matches “' + ui.esc(f.q) + '”.' : 'Comments, messages and mentions from connected accounts appear here.');
        }
        function paintThread() {
          var c = openId && store.conv(openId);
          box.classList.toggle('has-open', !!c);
          if (!c) { thread.innerHTML = '<div class="ibx-empty">' + ui.empty('message', 'Select a conversation', 'Reply to customers, leave internal notes for the team and assign owners.') + '</div>'; side.innerHTML = ''; return; }
          var a = store.account(c.accountId), b = store.brand(c.brandId), post = c.postId && store.post(c.postId);
          var canReply = store.can('inbox.reply', c.brandId), expired = a && a.status === 'expired';
          var th = '<div class="ibx-th"><button class="btn btn--ghost btn--sm btn--icon ibx-back" data-back aria-label="Back to list">' + ui.icon('arrowL', 16) + '</button>' + ui.avatar(c.contact.name) + '<div class="ibx-th__m"><b>' + ui.esc(c.contact.name) + '</b><span>' + ui.esc(c.contact.handle) + ' · ' + KIND[c.kind][0] + ' on ' + (a ? ui.esc(a.handle) + ' (' + PL.P[a.platform].name + ')' : 'a disconnected account') + '</span></div><div class="row">' + (c.status === 'open' ? '<button class="btn btn--sm" data-resolve>' + ui.icon('check', 14) + 'Resolve</button>' : '<button class="btn btn--sm" data-reopen>' + ui.icon('undo', 14) + 'Reopen</button>') + '<button class="btn btn--sm btn--ghost btn--icon" data-unread title="Mark as unread" aria-label="Mark as unread">' + ui.icon('mail', 15) + '</button><button class="btn btn--sm btn--ghost btn--icon ibx-info" data-info aria-label="Details">' + ui.icon('info', 15) + '</button></div></div>';
          if (post) th += '<button type="button" class="ibx-post" data-post="' + post.id + '">' + pc.thumb(post, 'mthumb--36') + '<span><em>' + (c.kind === 'comment' ? 'Comment on' : 'About') + '</em><b>' + ui.esc(store.title(post)) + '</b></span>' + ui.icon('chevR', 14) + '</button>';
          th += '<div class="ibx-msgs" data-msgs>' + c.messages.map(function (m) {
            var u = m.userId && store.user(m.userId);
            if (m.from === 'note') return '<div class="msg msg--note">' + ui.userAv(u, 'xs') + '<div><div class="msg__h"><b>' + ui.esc(u ? u.name : 'Team') + '</b><span class="pill pill--amber pill--plain">' + ui.icon('lock', 10) + 'Internal note</span><em>' + T.dateTime(m.at) + '</em></div><p>' + ui.esc(m.body) + '</p></div></div>';
            if (m.from === 'us') return '<div class="msg msg--us"><div><div class="msg__h"><em>' + T.dateTime(m.at) + '</em><b>' + ui.esc(u ? u.name : b.name) + '</b>' + (m.simulated ? ui.sim('Not delivered') : '') + '</div><p>' + ui.esc(m.body) + '</p></div>' + ui.userAv(u, 'xs') + '</div>';
            return '<div class="msg msg--them">' + ui.avatar(c.contact.name, 'xs') + '<div><div class="msg__h"><b>' + ui.esc(c.contact.name) + '</b><em>' + T.dateTime(m.at) + '</em></div><p>' + ui.esc(m.body) + '</p></div></div>';
          }).join('') + '</div>';
          th += '<form class="ibx-comp' + (mode === 'note' ? ' is-note' : '') + '" data-comp><div class="ibx-comp__tabs"><button type="button" data-mode="reply" class="' + (mode === 'reply' ? 'on' : '') + '"' + (canReply ? '' : ' disabled title="' + ui.esc(store.why('inbox.reply', c.brandId)) + '"') + '>' + ui.icon('reply', 13) + 'Reply</button><button type="button" data-mode="note" class="' + (mode === 'note' ? 'on' : '') + '">' + ui.icon('lock', 13) + 'Internal note</button></div>' +
            '<textarea class="ta" name="body" rows="3" placeholder="' + (mode === 'note' ? 'Only your team sees notes. Use them for context and handovers.' : 'Write a reply to ' + ui.esc(c.contact.name) + '…') + '" aria-label="' + (mode === 'note' ? 'Internal note' : 'Reply') + '"' + (mode === 'reply' && (!canReply || expired) ? ' disabled' : '') + '></textarea>' +
            '<div class="ibx-comp__f"><span class="hint">' + (mode === 'note' ? ui.icon('lock', 12) + ' Visible to your team only' : expired ? ui.icon('plug', 12) + ' This account needs reconnecting before you can reply.' : !canReply ? ui.icon('lock', 12) + ' ' + ui.esc(store.why('inbox.reply', c.brandId)) : ui.icon('flask', 12) + ' Sample inbox: your reply is saved here and marked not delivered.') + '</span><button class="btn btn--sm ' + (mode === 'note' ? '' : 'btn--p') + '" type="submit"' + (mode === 'reply' && (!canReply || expired) ? ' disabled' : '') + '>' + ui.icon(mode === 'note' ? 'note' : 'send', 14) + (mode === 'note' ? 'Add note' : 'Send reply') + '</button></div></form>';
          var keep = thread.querySelector('[data-comp] textarea'), kept = keep && keep.getAttribute('data-for') === c.id + mode ? keep.value : '';
          thread.innerHTML = th;
          var nta = thread.querySelector('[data-comp] textarea'); nta.setAttribute('data-for', c.id + mode); if (kept) nta.value = kept;
          var ms = thread.querySelector('[data-msgs]'); ms.scrollTop = ms.scrollHeight;
          var team = store.state.users.filter(function (u) { return u.status === 'active' && OS.policy.has(store.state.workspace, u, 'inbox.view', c.brandId); });
          side.innerHTML = '<div class="ibx-side__h"><b>Details</b><button class="btn btn--ghost btn--sm btn--icon ibx-side__x" data-info aria-label="Close details">' + ui.icon('x', 15) + '</button></div><div class="ibx-contact">' + ui.avatar(c.contact.name, 'lg') + '<b>' + ui.esc(c.contact.name) + '</b><span>' + ui.esc(c.contact.handle) + '</span></div>' +
            '<dl class="kv"><dt>Brand</dt><dd>' + ui.brandDot(b) + ' ' + ui.esc(b.name) + '</dd><dt>Account</dt><dd>' + (a ? ui.esc(a.handle) : '—') + '</dd><dt>Type</dt><dd>' + KIND[c.kind][0] + '</dd><dt>Status</dt><dd>' + ui.pill(c.status) + '</dd></dl>' +
            ui.field('Assigned to', ui.select('assignee', [{ value: '', label: 'Unassigned' }].concat(team.map(function (u) { return { value: u.id, label: u.name + (u.id === me.id ? ' (you)' : '') }; })), c.assigneeId || '', { attr: ' data-assign' })) +
            '<div class="f" style="margin-top:12px"><label>Tags</label><div class="tagedit">' + c.tags.map(function (t) { return '<span class="tag">' + ui.esc(t) + '<button type="button" data-rmtag="' + ui.esc(t) + '" aria-label="Remove tag ' + ui.esc(t) + '">×</button></span>'; }).join('') + '<input class="inp inp--sm" data-addtag placeholder="Add tag + Enter" aria-label="Add tag"></div></div>' +
            '<div class="note note--plain" style="margin-top:14px">' + ui.icon('info', 14) + '<span>In production, ORBIT syncs comments and messages through each network’s API where it’s allowed (for example Instagram and Facebook messaging require Meta app review) and sends replies from the server.</span></div>';
          if (c.unread) store.convUpdate(c.id, { unread: false });
        }
        this.repaint = function () { paintList(); paintThread(); };
        paintList(); paintThread();
        root.addEventListener('click', function (e) {
          var t;
          if ((t = e.target.closest('[data-conv]'))) { openId = t.getAttribute('data-conv'); box.classList.remove('show-side'); sync(); paintList(); paintThread(); var ta = thread.querySelector('textarea'); if (ta && window.innerWidth > 900) ta.focus(); return; }
          if ((t = e.target.closest('[data-if]'))) { f.filter = t.getAttribute('data-if'); root.querySelectorAll('[data-if]').forEach(function (x) { x.classList.toggle('on', x === t); x.setAttribute('aria-selected', x === t); }); sync(); paintList(); return; }
          if (e.target.closest('[data-back]')) { openId = null; sync(); paintList(); paintThread(); return; }
          if (e.target.closest('[data-info]')) { box.classList.toggle('show-side'); return; }
          if ((t = e.target.closest('[data-mode]'))) { if (t.disabled) return; mode = t.getAttribute('data-mode'); paintThread(); var ta2 = thread.querySelector('textarea'); if (ta2) ta2.focus(); return; }
          if (e.target.closest('[data-resolve]')) { ui.run(function () { store.convUpdate(openId, { status: 'resolved', unread: false }); }, 'Resolved'); return; }
          if (e.target.closest('[data-reopen]')) { ui.run(function () { store.convUpdate(openId, { status: 'open' }); }, 'Reopened'); return; }
          if (e.target.closest('[data-unread]')) { var cid = openId; openId = null; ui.run(function () { store.convUpdate(cid, { unread: true }); }, 'Marked as unread'); sync(); return; }
          if ((t = e.target.closest('[data-rmtag]'))) { var c = store.conv(openId); ui.run(function () { store.convUpdate(openId, { tags: c.tags.filter(function (x) { return x !== t.getAttribute('data-rmtag'); }) }); }); return; }
          if ((t = e.target.closest('[data-post]'))) { pc.drawer(t.getAttribute('data-post')); }
        });
        root.addEventListener('change', function (e) {
          if (e.target.matches('[data-assign]')) { var v = e.target.value; ui.run(function () { store.convUpdate(openId, { assigneeId: v }); }, v ? 'Assigned to ' + app.userName(v) : 'Unassigned'); }
          if (e.target.matches('[data-ik]')) { f.kind = e.target.value; sync(); paintList(); }
          if (e.target.matches('[data-ia]')) { f.account = e.target.value; sync(); paintList(); }
        });
        root.addEventListener('keydown', function (e) {
          if (e.target.matches('[data-addtag]') && e.key === 'Enter') { e.preventDefault(); var v = e.target.value.trim().toLowerCase(); if (!v) return; var c = store.conv(openId); if (c.tags.indexOf(v) < 0) ui.run(function () { store.convUpdate(openId, { tags: c.tags.concat([v]) }); }); }
          if (e.target.matches('[data-comp] textarea') && e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); e.target.form.requestSubmit(); }
        });
        root.addEventListener('submit', function (e) {
          if (!e.target.matches('[data-comp]')) return; e.preventDefault();
          var body = e.target.querySelector('textarea').value;
          var ta = e.target.querySelector('textarea');
          if (ui.run(function () { if (mode === 'note') store.note(openId, body); else store.reply(openId, body); }, mode === 'note' ? 'Note added (team only)' : 'Reply saved. Not delivered: sample account.')) { var n = thread.querySelector('[data-comp] textarea'); if (n) n.value = ''; }
        });
        root.querySelector('[data-iq]').addEventListener('input', ui.debounce(function (e) { f.q = e.target.value.trim(); sync(); paintList(); }, 150));
      }
    };
  });
})();
