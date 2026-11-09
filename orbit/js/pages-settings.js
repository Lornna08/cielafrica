/* ============================================================
   ORBIT SOCIAL — Settings & connected accounts
   ============================================================ */
(function () {
  'use strict';
  var ui = OS.ui, store = OS.store, T = OS.time, PL = OS.platforms, app = OS.app, policy = OS.policy;

  var TABS = [['workspace', 'Workspace', 'building'], ['brands', 'Brands', 'palette'], ['accounts', 'Connected accounts', 'plug'], ['approvals', 'Approval workflow', 'approve'], ['scheduling', 'Time & scheduling', 'clock'], ['notifications', 'Notifications', 'bell'], ['profile', 'Your profile', 'user'], ['data', 'Data & template', 'archive']];

  OS.route('/settings', function (params, q) {
    var tab = q.tab || 'workspace', S = store.state, ws = S.workspace, me = store.me();
    var canSet = store.can('settings.manage');
    var dis = canSet ? '' : ' disabled';
    var readonly = canSet ? '' : '<div class="note note--plain" style="margin-bottom:14px">' + ui.icon('lock', 14) + '<span>' + ui.esc(store.why('settings.manage') || '') + ' You can view these settings but not change them.</span></div>';
    var body = '';

    if (tab === 'workspace') {
      body = readonly + '<form class="card set" data-form="workspace"><div class="card__b"><div class="fsec"><h3>Workspace details</h3><p>Shown to your team and on client invites.</p><div class="fgrid">' + ui.field('Workspace name', ui.input('name', ws.name, { attr: dis, req: true }), { req: true }) + ui.field('Plan', '<input class="inp" value="' + ui.esc(ws.plan) + ' (template)" disabled>') + '</div></div>' +
        '<div class="fsec"><h3>At a glance</h3><div class="mini3"><div><b>' + store.brands().length + '</b><span>Brands</span></div><div><b>' + S.accounts.length + '</b><span>Accounts</span></div><div><b>' + S.users.filter(function (u) { return u.status === 'active'; }).length + '</b><span>Active members</span></div><div><b>' + S.posts.length + '</b><span>Posts</span></div></div></div></div>' + (canSet ? '<div class="card__f"><span class="hint">Saved to this browser</span><button class="btn btn--p" type="submit">Save changes</button></div>' : '') + '</form>';
    } else if (tab === 'brands') {
      body = readonly + '<div class="card card--flush">' + S.brands.filter(function (b) { return !b.archived; }).map(function (b) {
        var n = S.accounts.filter(function (a) { return a.brandId === b.id; }).length, cl = S.users.filter(function (u) { return u.role === 'client' && (u.brands || []).indexOf(b.id) >= 0; });
        return '<div class="lrow">' + ui.brandMark(b, 36) + '<span class="lrow__m"><span class="lrow__t">' + ui.esc(b.name) + (b.handle ? ' <span class="muted" style="font-weight:500">@' + ui.esc(b.handle) + '</span>' : '') + '</span><span class="lrow__s">' + ui.esc(b.industry || '') + ' · ' + n + ' account' + (n === 1 ? '' : 's') + ' · client approval ' + (b.clientApproval ? 'on' : 'off') + (cl.length ? ' · ' + cl.map(function (u) { return u.name; }).join(', ') : '') + '</span></span>' + (canSet ? '<span class="row"><button class="btn btn--sm" data-ebrand="' + b.id + '">' + ui.icon('edit', 14) + 'Edit</button><button class="btn btn--sm btn--ghost btn--icon" data-abrand="' + b.id + '" aria-label="Archive ' + ui.esc(b.name) + '">' + ui.icon('archive', 15) + '</button></span>' : '') + '</div>';
      }).join('') + '</div>' + (canSet ? '<button class="btn" data-ebrand="" style="margin-top:12px">' + ui.icon('plus', 15) + 'Add brand</button>' : '') + '<p class="hint" style="margin-top:12px">Each brand has its own accounts, calendar, library, team access, approval settings, analytics and campaigns.</p>';
    } else if (tab === 'accounts') {
      var bs = store.brands();
      body = '<div class="note note--info" style="margin-bottom:14px">' + ui.icon('shield', 15) + '<span><b>Sample connections.</b> Every account in this template is a sample: ORBIT never signed in to these networks and holds no tokens. Real connections use each network’s official OAuth flow on ORBIT’s server, where tokens are encrypted and never sent to the browser.</span></div>';
      body += bs.map(function (b) {
        var as = S.accounts.filter(function (a) { return a.brandId === b.id; }), can = store.can('accounts.manage', b.id);
        return '<div class="card card--flush" style="margin-bottom:14px"><div class="card__h" style="padding-bottom:12px"><h3>' + ui.brandMark(b, 24) + ui.esc(b.name) + '</h3>' + (can ? '<button class="btn btn--sm" data-connect="' + b.id + '">' + ui.icon('plus', 14) + 'Connect account</button>' : '<span class="sub">' + ui.icon('lock', 12) + ' Managed by admins</span>') + '</div>' +
          (as.length ? as.map(function (a) { var P = PL.P[a.platform]; return '<div class="lrow lrow--acc">' + ui.plat(a.platform, 30) + '<span class="lrow__m"><span class="lrow__t">' + ui.esc(a.handle) + ' <span class="muted" style="font-weight:500">· ' + P.name + '</span></span><span class="lrow__s">' + (a.status === 'expired' ? '<span class="t-red">' + ui.esc(a.note) + '</span>' : (a.followers ? ui.num(a.followers) + ' followers · ' : '') + 'Last sync ' + T.rel(a.lastSync) + ' · added ' + T.date(a.connectedAt)) + '</span></span>' + ui.pill(a.status) + (can ? '<span class="row">' + (a.status === 'expired' ? '<button class="btn btn--sm btn--p" data-recon="' + a.id + '">' + ui.icon('refresh', 14) + 'Reconnect</button>' : '') + '<button class="btn btn--sm btn--ghost" data-disc="' + a.id + '">Disconnect</button></span>' : '') + '</div>'; }).join('') : '<div class="card__b">' + ui.empty('plug', 'No accounts yet', ui.esc(b.name) + ' isn’t connected to any network.', can ? '<button class="btn btn--sm btn--p" data-connect="' + b.id + '" style="margin-top:6px">' + ui.icon('plus', 14) + 'Connect account</button>' : '') + '</div>') + '</div>';
      }).join('');
      body += '<details class="card defs"><summary>' + ui.icon('info', 15) + 'What each network supports</summary><div class="caps">' + PL.list.map(function (p) { return '<div class="caps__i">' + ui.plat(p.id, 26) + '<div><b>' + p.name + '</b><p>' + ui.esc(p.api) + '</p><p class="muted">Caption up to ' + p.caption.toLocaleString() + ' characters · ' + p.types.map(function (t) { return t.name; }).join(', ') + (p.needsVideo ? ' · video required' : p.needsMedia ? ' · media required' : '') + '</p><p class="muted">Scopes: ' + p.scopes.join(', ') + '</p></div></div>'; }).join('') + '</div></details>';
    } else if (tab === 'approvals') {
      var A = ws.approval;
      body = readonly + '<form class="card set" data-form="approvals"><div class="card__b"><div class="fsec"><h3>Review steps</h3><p>Posts move through these steps in order. A brand can switch off the client step in Brands.</p>' + A.stages.map(function (s) { return '<div class="stage"><label class="switch"><input type="checkbox" name="st-' + s.id + '"' + (s.enabled !== false ? ' checked' : '') + dis + '><i></i><b>' + ui.esc(s.name) + '</b></label><div class="stage__roles">' + policy.ROLES.filter(function (r) { return r.id !== 'owner'; }).map(function (r) { return '<label class="rchk"><input type="checkbox" class="chk" name="sr-' + s.id + '-' + r.id + '"' + (s.roles.indexOf(r.id) >= 0 ? ' checked' : '') + dis + '>' + r.name + '</label>'; }).join('') + '</div></div>'; }).join('') + '<p class="hint">The owner can act on any step.</p></div>' +
        '<div class="fsec"><h3>Rules</h3><label class="switch"><input type="checkbox" name="requireBeforeSchedule"' + (A.requireBeforeSchedule ? ' checked' : '') + dis + '><i></i>Content must be approved before it can be scheduled or published</label><br><br><label class="switch"><input type="checkbox" name="autoSchedule"' + (A.autoSchedule !== false ? ' checked' : '') + dis + '><i></i>When a post with a date is approved, schedule it automatically</label><br><br><label class="switch"><input type="checkbox" name="allowSelfApproval"' + (A.allowSelfApproval ? ' checked' : '') + dis + '><i></i>Allow authors to approve their own posts <span class="muted">(not recommended)</span></label></div></div>' + (canSet ? '<div class="card__f"><span class="hint">Changes apply to posts submitted from now on</span><button class="btn btn--p" type="submit">Save workflow</button></div>' : '') + '</form>';
    } else if (tab === 'scheduling') {
      var bt = ws.bestTimes || {};
      body = readonly + '<form class="card set" data-form="scheduling"><div class="card__b"><div class="fsec"><h3>Time zone</h3><p>Every date in ORBIT is shown in this time zone. Posts keep their exact moment in time if you change it.</p><div class="fgrid">' + ui.field('Workspace time zone', ui.select('timezone', T.ZONES.map(function (z) { return { value: z, label: T.zoneLabel(z) }; }), ws.timezone, { attr: dis })) + ui.field('Week starts on', ui.select('weekStart', [{ value: '1', label: 'Monday' }, { value: '0', label: 'Sunday' }, { value: '6', label: 'Saturday' }], String(ws.weekStart), { attr: dis })) + ui.field('Default post time', '<input class="inp" type="time" name="defaultTime" value="' + ws.defaultTime + '"' + dis + '>', { hint: 'Used when you create a post from a calendar day.' }) + '</div></div>' +
        '<div class="fsec"><h3>Suggested times</h3><p>Shown in the composer as one-click suggestions.</p><div class="fgrid fgrid--3">' + PL.list.map(function (p) { return ui.field(ui.plat(p.id, 16) + ' ' + p.name, '<input class="inp" type="time" name="bt-' + p.id + '" value="' + (bt[p.id] || '') + '"' + dis + '>'); }).join('') + '</div></div>' +
        '<div class="fsec"><h3>How publishing works</h3><p class="muted" style="margin:0">In this template a <b>simulated scheduler</b> runs in your browser every 30 seconds and marks due posts as published, without contacting any network. In production a server-side job queue publishes at the scheduled moment, even when nobody has ORBIT open, retries failures and records each network’s response.</p></div></div>' + (canSet ? '<div class="card__f"><span class="hint">Current time: ' + T.dateTime(new Date()) + '</span><button class="btn btn--p" type="submit">Save</button></div>' : '') + '</form>';
    } else if (tab === 'notifications') {
      var N = me.notify || ws.notifications;
      var EV = [['submitted', 'A post is waiting for my review'], ['approved', 'My post was approved'], ['changes', 'Changes were requested on my post'], ['failed', 'A post failed to publish'], ['mention', 'Someone mentioned me'], ['inbox', 'A conversation was assigned to me']];
      body = '<form class="card set" data-form="notifications"><div class="card__b"><div class="fsec"><h3>Your notifications</h3><p>These preferences are yours only.</p><table class="t ntable"><thead><tr><th>Event</th><th class="c">In ORBIT</th><th class="c">Email</th></tr></thead><tbody>' + EV.map(function (e) { var v = N[e[0]] || {}; return '<tr><td>' + e[1] + '</td><td class="c"><input type="checkbox" class="chk" name="n-' + e[0] + '-app"' + (v.app ? ' checked' : '') + ' aria-label="' + e[1] + ' in ORBIT"></td><td class="c"><input type="checkbox" class="chk" name="n-' + e[0] + '-email"' + (v.email ? ' checked' : '') + ' aria-label="' + e[1] + ' by email"></td></tr>'; }).join('') + '</tbody></table></div><div class="fsec"><h3>Summary email</h3><div class="fgrid">' + ui.field('Send me a summary', ui.select('digest', [{ value: 'off', label: 'Never' }, { value: 'daily', label: 'Daily at 8:00' }, { value: 'weekly', label: 'Weekly on Monday' }], N.digest || 'weekly')) + '</div><p class="hint">Emails aren’t sent from this template.</p></div></div><div class="card__f"><span></span><button class="btn btn--p" type="submit">Save preferences</button></div></form>';
    } else if (tab === 'profile') {
      body = '<form class="card set" data-form="profile"><div class="card__b"><div class="fsec"><div class="row" style="gap:14px;margin-bottom:14px">' + ui.avatar(me.name, 'lg') + '<div><b>' + ui.esc(me.name) + '</b><div class="muted">' + policy.roleName(me.role) + ' · ' + (me.role === 'owner' || me.role === 'admin' || me.brands === 'all' ? 'all brands' : (me.brands || []).map(function (id) { return store.brand(id).name; }).join(', ')) + '</div></div></div><div class="fgrid">' + ui.field('Name', ui.input('name', me.name, { req: true }), { req: true }) + ui.field('Email', ui.input('email', me.email, { type: 'email', req: true }), { req: true }) + ui.field('Job title', ui.input('title', me.title || '')) + '</div></div><div class="fsec"><h3>Password &amp; sign-in</h3><p class="muted" style="margin:0">Sign-in isn’t part of this template. In production ORBIT uses email + password with two-factor authentication, or your company’s single sign-on.</p></div></div><div class="card__f"><span></span><button class="btn btn--p" type="submit">Save profile</button></div></form>';
    } else {
      body = '<div class="card"><div class="card__b"><div class="fsec"><h3>Where your data lives</h3><p class="muted">This template keeps everything in this browser: records in localStorage and uploaded files in IndexedDB. It isn’t shared with teammates or other devices, and clearing your browser data removes it. A production ORBIT stores data in a database, files in object storage and enforces permissions on the server.</p></div><div class="fsec"><h3>Export</h3><p>Download the whole workspace as JSON (uploaded files are referenced, not included).</p><button class="btn" data-exportjson>' + ui.icon('download', 15) + 'Export workspace JSON</button></div><div class="fsec"><h3>Start over</h3><p>Restore the original sample workspace.</p><button class="btn btn--danger" data-resetall>' + ui.icon('refresh', 15) + 'Reset template data</button></div></div></div>';
    }

    var h = app.ph('Settings', ui.esc(ws.name)) + '<div class="setgrid"><nav class="setnav" aria-label="Settings sections">' + TABS.map(function (t) { return '<a href="#/settings?tab=' + t[0] + '" class="' + (t[0] === tab ? 'on' : '') + '"' + (t[0] === tab ? ' aria-current="page"' : '') + '>' + ui.icon(t[2], 16) + t[1] + '</a>'; }).join('') + '</nav><div class="setbody">' + body + '</div></div>';

    return {
      title: 'Settings', html: h,
      mount: function (root) {
        root.addEventListener('submit', function (e) {
          var f = e.target.closest('[data-form]'); if (!f) return; e.preventDefault();
          var kind = f.getAttribute('data-form'), v = ui.read(f), ok;
          if (kind === 'workspace') ok = ui.run(function () { store.updateWorkspace({ name: v.name.trim() }); }, 'Workspace saved');
          if (kind === 'approvals') ok = ui.run(function () {
            var stages = ws.approval.stages.map(function (s) { return { id: s.id, name: s.name, enabled: !!v['st-' + s.id], roles: ['owner'].concat(policy.ROLES.filter(function (r) { return r.id !== 'owner' && v['sr-' + s.id + '-' + r.id]; }).map(function (r) { return r.id; })) }; });
            stages.forEach(function (s) { if (s.enabled && s.roles.length < 2) throw OS.policy.Denied('Choose at least one role for “' + s.name + '”.'); });
            store.updateWorkspace({ approval: { stages: stages, requireBeforeSchedule: !!v.requireBeforeSchedule, autoSchedule: !!v.autoSchedule, allowSelfApproval: !!v.allowSelfApproval } });
          }, 'Workflow saved');
          if (kind === 'scheduling') ok = ui.run(function () { var bt = {}; PL.ORDER.forEach(function (p) { if (v['bt-' + p]) bt[p] = v['bt-' + p]; }); store.updateWorkspace({ timezone: v.timezone, weekStart: +v.weekStart, defaultTime: v.defaultTime, bestTimes: bt }); }, 'Saved. Times now show in ' + T.zoneLabel(v.timezone));
          if (kind === 'notifications') ok = ui.run(function () { var n = { digest: v.digest }; ['submitted', 'approved', 'changes', 'failed', 'mention', 'inbox'].forEach(function (k) { n[k] = { app: !!v['n-' + k + '-app'], email: !!v['n-' + k + '-email'] }; }); store.updateProfile({ notify: n }); }, 'Preferences saved');
          if (kind === 'profile') ok = ui.run(function () { store.updateProfile({ name: v.name, email: v.email.trim(), title: v.title }); }, 'Profile saved');
        });
        root.addEventListener('click', function (e) {
          var t;
          if ((t = e.target.closest('[data-ebrand]'))) brandDialog(t.getAttribute('data-ebrand'));
          if ((t = e.target.closest('[data-abrand]'))) { var b = store.brand(t.getAttribute('data-abrand')); ui.confirm({ title: 'Archive ' + b.name + '?', body: 'The brand disappears from the switcher and lists. Its posts and files are kept.', ok: 'Archive brand' }).then(function (ok) { if (ok) ui.run(function () { store.archiveBrand(b.id); }, b.name + ' archived'); }); }
          if ((t = e.target.closest('[data-connect]'))) connectDialog(t.getAttribute('data-connect'));
          if ((t = e.target.closest('[data-recon]'))) reconnectDialog(t.getAttribute('data-recon'));
          if ((t = e.target.closest('[data-disc]'))) { var a = store.account(t.getAttribute('data-disc')); ui.confirm({ title: 'Disconnect ' + a.handle + '?', body: 'Upcoming posts lose this account. Scheduled posts with no accounts left go back to Approved. Published posts keep their record.', ok: 'Disconnect', danger: true }).then(function (ok) { if (ok) ui.run(function () { return store.disconnect(a.id); }, function (n) { return a.handle + ' disconnected' + (n ? '. ' + n + ' post' + (n > 1 ? 's' : '') + ' updated.' : ''); }); }); }
          if (e.target.closest('[data-exportjson]')) { var blob = new Blob([JSON.stringify(store.state, null, 2)], { type: 'application/json' }), l = document.createElement('a'); l.href = URL.createObjectURL(blob); l.download = 'orbit-workspace-' + T.todayKey() + '.json'; document.body.appendChild(l); l.click(); setTimeout(function () { URL.revokeObjectURL(l.href); l.remove(); }, 400); ui.toast('Workspace exported'); }
          if (e.target.closest('[data-resetall]')) app.reset();
        });
      }
    };
  });

  function brandDialog(id) {
    var b = id ? store.brand(id) : null;
    ui.modal({ title: b ? 'Edit ' + b.name : 'Add a brand', ok: 'Save brand',
      body: '<div class="fgrid">' + ui.field('Brand name', ui.input('name', b ? b.name : '', { req: true, ph: 'e.g. Mtaa Bakery' }), { req: true }) + ui.field('Handle', ui.input('handle', b ? b.handle : '', { ph: 'without @' })) + ui.field('Description', ui.input('industry', b ? b.industry : '', { ph: 'e.g. Neighbourhood bakery · Nairobi' }), { full: true }) + ui.field('Brand colour', '<input class="inp" type="color" name="color" value="' + (b ? b.color : '#0E7C6E') + '">') + '<div class="f"><label>Client approval</label><label class="switch"><input type="checkbox" name="clientApproval"' + (!b || b.clientApproval ? ' checked' : '') + '><i></i>Posts need the client’s final approval</label></div></div>',
      onOk: function (api) { var v = ui.read(api.el); v.id = b && b.id; if (!ui.run(function () { return store.saveBrand(v); }, 'Brand saved')) return false; } });
  }

  function connectDialog(brandId) {
    var b = store.brand(brandId);
    var m = ui.modal({ title: 'Connect an account to ' + b.name, size: 'wide',
      body: '<p class="muted" style="margin-bottom:12px">Choose a network. ORBIT connects through each network’s official sign-in (OAuth) on the server.</p><div class="netpick">' + PL.list.map(function (p) { return '<button type="button" class="netpick__i" data-net="' + p.id + '">' + ui.plat(p.id, 34) + '<b>' + p.name + '</b><span>' + ui.esc(p.types.map(function (t) { return t.name; }).join(' · ')) + '</span></button>'; }).join('') + '</div><div data-step></div>', foot: false });
    m.el.addEventListener('click', function (e) {
      var t = e.target.closest('[data-net]'); if (!t) return;
      var p = PL.P[t.getAttribute('data-net')];
      m.el.querySelectorAll('[data-net]').forEach(function (x) { x.classList.toggle('on', x === t); });
      var res = PL.adapterFor({ connection: 'sample' }).connect();
      m.el.querySelector('[data-step]').innerHTML = '<div class="connect"><div class="note">' + ui.icon('lock', 15) + '<span><b>Real ' + p.name + ' sign-in isn’t available in this template.</b> ' + ui.esc(res.error) + '</span></div><h4 class="dr-h">What a production connection needs</h4><ul class="needs"><li>' + ui.esc(p.api) + '</li><li>OAuth scopes: <code>' + p.scopes.join('</code> <code>') + '</code></li><li>App ID and secret stored as server environment variables, never in the browser</li><li>Encrypted token storage, refresh before expiry, and a reconnect prompt when access is revoked</li></ul>' +
        '<h4 class="dr-h">Or add a sample account</h4><p class="muted">Clearly labelled as a sample. You can write, schedule and simulate publishing to it.</p><form data-sample class="fgrid">' + ui.field('Account name or handle', ui.input('handle', '', { ph: p.id === 'facebook' || p.id === 'linkedin' || p.id === 'youtube' ? b.name : '@' + (b.handle || 'brand'), req: true })) + '<div class="f" style="justify-content:flex-end"><button class="btn btn--p" type="submit">' + ui.icon('plus', 14) + 'Add sample ' + p.name + ' account</button></div></form></div>';
      m.el.querySelector('[data-sample]').onsubmit = function (ev) { ev.preventDefault(); var v = ui.read(ev.target); var a = ui.run(function () { return store.addSampleAccount({ brandId: brandId, platform: p.id, handle: v.handle }); }, 'Sample account added (not connected to ' + p.name + ')'); if (a) m.close(); };
    });
  }
  function reconnectDialog(id) {
    var a = store.account(id), p = PL.P[a.platform];
    ui.modal({ title: 'Reconnect ' + a.handle, ok: 'Refresh sample connection',
      body: '<p>In production this opens ' + p.name + '’s sign-in so the account owner can grant access again. ORBIT then stores the new token on the server and retries any failed posts you choose.</p><div class="note note--info" style="margin-top:12px">' + ui.icon('flask', 15) + '<span>This is a sample account, so the template can only refresh its sample status. No real sign-in happens.</span></div>',
      onOk: function () { if (!ui.run(function () { return store.reconnectSample(id); }, a.handle + ' is back to a working sample connection. Retry failed posts from the calendar.')) return false; } });
  }
})();
