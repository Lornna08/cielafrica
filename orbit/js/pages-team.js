/* ============================================================
   ORBIT SOCIAL — Team & Roles
   ============================================================ */
(function () {
  'use strict';
  var ui = OS.ui, store = OS.store, T = OS.time, app = OS.app, policy = OS.policy;

  OS.route('/team', function (params, q) {
    var S = store.state, me = store.me(), tab = q.tab || 'members';
    var canInvite = store.can('team.invite'), canSet = store.can('settings.manage');
    var h = app.ph('Team & Roles', S.users.filter(function (u) { return u.status !== 'suspended'; }).length + ' people in ' + ui.esc(S.workspace.name) + ' · roles decide what each person can do, per brand.', (canInvite ? '<button class="btn btn--p" data-invite>' + ui.icon('plus', 15) + 'Invite member</button>' : ''));
    h += app.tabs([['members', 'Members', '#/team?tab=members', S.users.length], ['roles', 'Roles & permissions', '#/team?tab=roles', null]], tab);
    h += '<div class="note note--info" style="margin-bottom:14px">' + ui.icon('users', 15) + '<span><b>Try the permissions:</b> switch to another member from the account menu (top right). The same checks run for every action, not just the buttons you see. In production they run on the server.</span><button class="btn btn--xs" data-switchu style="margin-left:auto">Switch user</button></div>';

    if (tab === 'members') {
      h += '<div class="card card--flush"><div class="tbar"><div class="search-inp">' + ui.icon('search', 15) + '<input class="inp" data-mq placeholder="Search people" aria-label="Search people"></div>' + ui.select('role', [{ value: '', label: 'All roles' }].concat(policy.ROLES.map(function (r) { return { value: r.id, label: r.name }; })), '', { cls: 'sel--sm sel--pill', attr: ' data-mrole aria-label="Role"' }) + '</div><div data-members></div></div>';
    } else {
      var M = S.workspace.matrix, groups = {};
      policy.PERMS.forEach(function (p) { (groups[p.group] = groups[p.group] || []).push(p); });
      h += '<div class="card card--flush"><div class="card__h" style="padding-bottom:12px"><h3>' + ui.icon('shield', 16) + 'Permissions matrix</h3><div class="row">' + (canSet ? '<span class="sub hide-sm">Changes save immediately</span>' + (me.role === 'owner' ? '<button class="btn btn--xs" data-resetm>Restore defaults</button>' : '') : '<span class="sub">' + ui.icon('lock', 12) + ' Read only for your role</span>') + '</div></div><div class="tscroll"><table class="t matrix"><thead><tr><th>Permission</th>' + policy.ROLES.map(function (r) { return '<th class="c" title="' + ui.esc(r.desc) + '">' + r.name + '</th>'; }).join('') + '</tr></thead><tbody>' +
        Object.keys(groups).map(function (g) { return '<tr class="matrix__g"><td colspan="' + (policy.ROLES.length + 1) + '">' + g + '</td></tr>' + groups[g].map(function (p) { return '<tr><td>' + p.name + '</td>' + policy.ROLES.map(function (r) { var on = r.id === 'owner' || (M[r.id] && M[r.id][p.id]); var locked = r.id === 'owner' || !canSet || (r.id === 'admin' && me.role !== 'owner'); return '<td class="c"><label class="mchk' + (locked ? ' locked' : '') + '"><input type="checkbox" data-perm="' + r.id + '|' + p.id + '"' + (on ? ' checked' : '') + (locked ? ' disabled' : '') + ' aria-label="' + ui.esc(r.name + ': ' + p.name) + '"><i>' + ui.icon('check', 12, 3) + '</i></label></td>'; }).join('') + '</tr>'; }).join(''); }).join('') + '</tbody></table></div></div>';
      h += '<div class="grid g-3" style="margin-top:16px">' + policy.ROLES.map(function (r) { var n = S.users.filter(function (u) { return u.role === r.id; }).length; return '<div class="card rolecard"><div class="card__b"><div class="row row--between"><b>' + r.name + '</b><span class="pill pill--grey pill--plain">' + n + ' ' + (n === 1 ? 'person' : 'people') + '</span></div><p>' + ui.esc(r.desc) + '</p>' + (r.id === 'client' ? '<p class="hint">Clients see only their own brand and can give the final approval.</p>' : '') + '</div></div>'; }).join('') + '</div>';
      h += '<div class="card" style="margin-top:16px"><div class="card__h"><h3>' + ui.icon('approve', 16) + 'Approval steps</h3><a class="link" href="#/settings?tab=approvals">Edit workflow</a></div><div class="card__b"><div class="track">' + (S.workspace.approval.stages || []).filter(function (s) { return s.enabled !== false; }).map(function (s, i) { return '<div class="track__s"><i>' + (i + 1) + '</i><span><b>' + ui.esc(s.name) + '</b><em>' + s.roles.map(policy.roleName).join(', ') + '</em></span></div>'; }).join('') + '</div><p class="hint" style="margin-top:10px">' + (S.workspace.approval.allowSelfApproval ? 'Authors may approve their own posts.' : 'Nobody can approve a post they wrote, regardless of role.') + ' Each person can sign off only one step of a version.</p></div></div>';
    }

    return {
      title: 'Team & Roles', html: h,
      mount: function (root) {
        var sw = root.querySelector('[data-switchu]'); if (sw) sw.onclick = function () { document.getElementById('userbtn').click(); };
        var inv = root.querySelector('[data-invite]'); if (inv) inv.onclick = inviteDialog;
        if (q.invite && canInvite) inviteDialog();
        if (tab === 'members') {
          var host = root.querySelector('[data-members]'), f = { q: '', role: '' };
          var draw = function () {
            var rows = store.state.users.filter(function (u) { return (!f.role || u.role === f.role) && (!f.q || (u.name + ' ' + u.email + ' ' + (u.title || '')).toLowerCase().indexOf(f.q) >= 0); });
            ui.table(host, { rows: rows, pageSize: 25, columns: [
              { key: 'name', label: 'Member', render: function (u) { return '<div class="pcell">' + ui.avatar(u.name) + '<div><div class="pcell__t">' + ui.esc(u.name) + (u.id === me.id ? ' <span class="muted">(you)</span>' : '') + '</div><div class="pcell__s">' + ui.esc(u.email) + (u.title ? ' · ' + ui.esc(u.title) : '') + '</div></div></div>'; } },
              { key: 'role', label: 'Role', sort: function (u) { return policy.ROLES.map(function (r) { return r.id; }).indexOf(u.role); }, render: function (u) { var lock = !canInvite || u.role === 'owner' || u.id === me.id || ((u.role === 'admin') && me.role !== 'owner'); return lock ? '<span class="rolebadge rolebadge--' + u.role + '">' + policy.roleName(u.role) + '</span>' : ui.select('r', policy.ROLES.filter(function (r) { return r.id !== 'owner' && (r.id !== 'admin' || me.role === 'owner'); }).map(function (r) { return { value: r.id, label: r.name }; }), u.role, { cls: 'sel--sm', attr: ' data-role="' + u.id + '" aria-label="Role for ' + ui.esc(u.name) + '"' }); } },
              { key: 'brands', label: 'Brands', sort: false, render: function (u) { if (u.role === 'owner' || u.role === 'admin' || u.brands === 'all') return '<span class="muted">All brands</span>'; return '<span class="bchips">' + (u.brands || []).map(function (id) { var b = store.brand(id); return b ? '<span class="bchip">' + ui.brandDot(b) + ui.esc(b.name) + '</span>' : ''; }).join('') + '</span>'; } },
              { key: 'status', label: 'Status', render: function (u) { return ui.pill(u.status); } },
              { key: 'lastActive', label: 'Last active', sort: function (u) { return u.lastActive || ''; }, render: function (u) { return u.lastActive ? T.rel(u.lastActive) : '<span class="muted">' + (u.status === 'invited' ? 'Invite pending' : '—') + '</span>'; } },
              { key: 'act', label: '', sort: false, align: 'r', render: function (u) { return canInvite && u.role !== 'owner' && u.id !== me.id ? '<button class="btn btn--sm btn--ghost btn--icon" data-mact="' + u.id + '" aria-label="Actions for ' + ui.esc(u.name) + '">' + ui.icon('more', 16) + '</button>' : ''; } }
            ] });
          };
          draw();
          root.querySelector('[data-mq]').addEventListener('input', ui.debounce(function (e) { f.q = e.target.value.trim().toLowerCase(); draw(); }, 120));
          root.querySelector('[data-mrole]').onchange = function (e) { f.role = e.target.value; draw(); };
          host.addEventListener('change', function (e) { var s = e.target.closest('[data-role]'); if (!s) return; var id = s.getAttribute('data-role'); if (!ui.run(function () { return store.updateMember(id, { role: s.value }); }, 'Role updated to ' + policy.roleName(s.value))) draw(); });
          host.addEventListener('click', function (e) {
            var b = e.target.closest('[data-mact]'); if (!b) return;
            var u = store.user(b.getAttribute('data-mact'));
            ui.menu(b, [
              { label: 'Brand access…', icon: 'layers', disabled: u.role === 'admin' ? 'Administrators see every brand' : false, fn: function () { brandsDialog(u); } },
              u.status === 'suspended' ? { label: 'Reactivate', icon: 'undo', fn: function () { ui.run(function () { return store.updateMember(u.id, { status: 'active' }); }, u.name + ' reactivated'); } } : { label: u.status === 'invited' ? 'Cancel invite' : 'Suspend', icon: 'lock', fn: function () { if (u.status === 'invited') { ui.run(function () { store.removeMember(u.id); }, 'Invite cancelled'); } else ui.confirm({ title: 'Suspend ' + u.name + '?', body: 'They lose access immediately. Their posts, comments and approvals stay in the record.', ok: 'Suspend' }).then(function (ok) { if (ok) ui.run(function () { return store.updateMember(u.id, { status: 'suspended' }); }, u.name + ' suspended'); }); } },
              '-', { label: 'Remove from workspace', icon: 'trash', danger: true, fn: function () { ui.confirm({ title: 'Remove ' + u.name + '?', body: 'They lose access and are removed from the team list. Their past activity stays attributed to them.', ok: 'Remove', danger: true }).then(function (ok) { if (ok) ui.run(function () { store.removeMember(u.id); }, u.name + ' removed'); }); } }
            ]);
          });
          if (q.open) { var u0 = store.user(q.open); if (u0) setTimeout(function () { var row = host.querySelector('tr[data-id="' + u0.id + '"]'); if (row) { row.classList.add('sel'); row.scrollIntoView({ block: 'center' }); } }, 50); }
        } else {
          root.addEventListener('change', function (e) {
            var c = e.target.closest('[data-perm]'); if (!c) return;
            var x = c.getAttribute('data-perm').split('|');
            if (!ui.run(function () { store.setPermission(x[0], x[1], c.checked); }, (c.checked ? 'Allowed' : 'Removed') + ' for ' + policy.roleName(x[0]) + 's')) c.checked = !c.checked;
          });
          var rm = root.querySelector('[data-resetm]'); if (rm) rm.onclick = function () { ui.confirm({ title: 'Restore default permissions?', body: 'Every role goes back to ORBIT’s default permissions.', ok: 'Restore defaults' }).then(function (ok) { if (ok) ui.run(function () { store.resetPermissions(); }, 'Default permissions restored'); }); };
        }
      }
    };
  });

  function brandChecks(sel, role) {
    return '<div class="bcheck">' + store.state.brands.filter(function (b) { return !b.archived; }).map(function (b) { var on = sel === 'all' || (sel || []).indexOf(b.id) >= 0; return '<label class="bcheck__i"><input type="checkbox" class="chk" name="b-' + b.id + '"' + (on ? ' checked' : '') + '>' + ui.brandMark(b, 22) + ui.esc(b.name) + '</label>'; }).join('') + '</div>';
  }
  function readBrands(el) { return store.state.brands.filter(function (b) { var c = el.querySelector('[name="b-' + b.id + '"]'); return c && c.checked; }).map(function (b) { return b.id; }); }
  function inviteDialog() {
    var me = store.me();
    var roles = policy.ROLES.filter(function (r) { return r.id !== 'owner' && (r.id !== 'admin' || me.role === 'owner'); });
    ui.modal({ title: 'Invite a team member', ok: 'Send invite', size: 'wide',
      body: '<div class="fgrid">' + ui.field('Email', ui.input('email', '', { type: 'email', ph: 'name@company.com', req: true }), { req: true }) + ui.field('Name', ui.input('name', '', { ph: 'Optional' })) + ui.field('Role', ui.select('role', roles.map(function (r) { return { value: r.id, label: r.name }; }), 'creator')) + ui.field('Job title', ui.input('title', '', { ph: 'Optional, e.g. Copywriter' })) + '</div><p class="hint" data-rdesc style="margin:8px 0 14px"></p><div class="f"><label>Brand access</label>' + brandChecks([], 'creator') + '</div><div class="note note--plain" style="margin-top:14px">' + ui.icon('mail', 14) + '<span>No email is sent in this template. In production the invite link is emailed and expires after 7 days.</span></div><p class="ferr" data-err></p>',
      onOpen: function (el) { var s = el.querySelector('[name=role]'), d = el.querySelector('[data-rdesc]'); function upd() { var r = policy.ROLES.filter(function (x) { return x.id === s.value; })[0]; d.textContent = r.desc + (r.id === 'admin' ? ' Administrators can see every brand.' : ''); el.querySelector('.bcheck').style.opacity = r.id === 'admin' ? .5 : 1; } s.onchange = upd; upd(); },
      onOk: function (api) { var v = ui.read(api.el); v.brands = readBrands(api.el); var u = ui.run(function () { return store.invite(v); }, function (u) { return 'Invite created for ' + u.email + ' (no email sent)'; }); if (!u) return false; } });
  }
  function brandsDialog(u) {
    ui.modal({ title: 'Brand access for ' + u.name, ok: 'Save', body: '<p class="muted" style="margin-bottom:12px">' + ui.esc(policy.roleName(u.role)) + 's only see content, analytics and conversations for these brands.</p>' + brandChecks(u.brands, u.role),
      onOk: function (api) { var b = readBrands(api.el); if (!ui.run(function () { return store.updateMember(u.id, { brands: b }); }, 'Brand access updated')) return false; } });
  }
})();
