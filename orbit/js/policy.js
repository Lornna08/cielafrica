/* ============================================================
   ORBIT SOCIAL — authorisation policy
   One source of truth for "who can do what". Written as a plain
   UMD module with no DOM access so the SAME file can run on a
   server (Node) in production. Every write in the template's
   service layer (store.js) calls policy.assert() before it changes
   anything — the UI only hides buttons as a convenience.
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.OS = root.OS || {}; root.OS.policy = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var ROLES = [
    { id: 'owner', name: 'Owner', desc: 'Full control, billing and ownership. Cannot be restricted.' },
    { id: 'admin', name: 'Administrator', desc: 'Manages the workspace, team, brands and connections.' },
    { id: 'manager', name: 'Manager', desc: 'Runs content for their brands: reviews, schedules and publishes.' },
    { id: 'creator', name: 'Content Creator', desc: 'Writes and designs posts and submits them for review.' },
    { id: 'approver', name: 'Approver', desc: 'Reviews and approves content. Does not publish.' },
    { id: 'analyst', name: 'Analyst', desc: 'Reads performance data and exports reports.' },
    { id: 'client', name: 'Client reviewer', desc: 'Gives final approval on their own brand. Read-only otherwise.' }
  ];

  var PERMS = [
    { id: 'content.view', name: 'View content', group: 'Content' },
    { id: 'content.edit', name: 'Create and edit drafts', group: 'Content' },
    { id: 'content.submit', name: 'Submit for approval', group: 'Content' },
    { id: 'content.approve', name: 'Approve or request changes', group: 'Content' },
    { id: 'content.schedule', name: 'Schedule posts', group: 'Publishing' },
    { id: 'content.publish', name: 'Publish posts', group: 'Publishing' },
    { id: 'inbox.view', name: 'See the inbox and internal notes', group: 'Engagement' },
    { id: 'inbox.reply', name: 'Reply in the inbox', group: 'Engagement' },
    { id: 'analytics.view', name: 'Access analytics', group: 'Insights' },
    { id: 'accounts.manage', name: 'Manage social accounts', group: 'Workspace' },
    { id: 'team.invite', name: 'Invite and manage members', group: 'Workspace' },
    { id: 'settings.manage', name: 'Change workspace settings', group: 'Workspace' }
  ];

  var Y = true, N = false;
  // default matrix — workspace admins can change everything except the owner row
  var DEFAULT_MATRIX = {
    owner: { 'content.view': Y, 'content.edit': Y, 'content.submit': Y, 'content.approve': Y, 'content.schedule': Y, 'content.publish': Y, 'inbox.view': Y, 'inbox.reply': Y, 'analytics.view': Y, 'accounts.manage': Y, 'team.invite': Y, 'settings.manage': Y },
    admin: { 'content.view': Y, 'content.edit': Y, 'content.submit': Y, 'content.approve': Y, 'content.schedule': Y, 'content.publish': Y, 'inbox.view': Y, 'inbox.reply': Y, 'analytics.view': Y, 'accounts.manage': Y, 'team.invite': Y, 'settings.manage': Y },
    manager: { 'content.view': Y, 'content.edit': Y, 'content.submit': Y, 'content.approve': Y, 'content.schedule': Y, 'content.publish': Y, 'inbox.view': Y, 'inbox.reply': Y, 'analytics.view': Y, 'accounts.manage': N, 'team.invite': N, 'settings.manage': N },
    creator: { 'content.view': Y, 'content.edit': Y, 'content.submit': Y, 'content.approve': N, 'content.schedule': N, 'content.publish': N, 'inbox.view': Y, 'inbox.reply': Y, 'analytics.view': N, 'accounts.manage': N, 'team.invite': N, 'settings.manage': N },
    approver: { 'content.view': Y, 'content.edit': N, 'content.submit': N, 'content.approve': Y, 'content.schedule': N, 'content.publish': N, 'inbox.view': Y, 'inbox.reply': N, 'analytics.view': Y, 'accounts.manage': N, 'team.invite': N, 'settings.manage': N },
    analyst: { 'content.view': Y, 'content.edit': N, 'content.submit': N, 'content.approve': N, 'content.schedule': N, 'content.publish': N, 'inbox.view': Y, 'inbox.reply': N, 'analytics.view': Y, 'accounts.manage': N, 'team.invite': N, 'settings.manage': N },
    client: { 'content.view': Y, 'content.edit': N, 'content.submit': N, 'content.approve': Y, 'content.schedule': N, 'content.publish': N, 'inbox.view': N, 'inbox.reply': N, 'analytics.view': Y, 'accounts.manage': N, 'team.invite': N, 'settings.manage': N }
  };

  function Denied(msg) { var e = new Error(msg); e.userFacing = true; e.code = 'forbidden'; return e; }

  function matrix(ws) { return (ws && ws.matrix) || DEFAULT_MATRIX; }
  function roleName(id) { var r = ROLES.filter(function (x) { return x.id === id; })[0]; return r ? r.name : id; }
  function permName(id) { var p = PERMS.filter(function (x) { return x.id === id; })[0]; return p ? p.name.toLowerCase() : id; }

  function hasBrand(user, brandId) {
    if (!brandId) return true;
    if (user.role === 'owner' || user.role === 'admin') return true;
    return user.brands === 'all' || (user.brands || []).indexOf(brandId) >= 0;
  }

  // has(ws, user, perm, brandId) -> boolean
  function has(ws, user, perm, brandId) {
    if (!user || user.status !== 'active') return false;
    if (user.role === 'owner') return true;
    var m = matrix(ws)[user.role] || {};
    return !!m[perm] && hasBrand(user, brandId);
  }

  // why(...) -> null when allowed, otherwise a human explanation
  function why(ws, user, perm, brandId) {
    if (!user) return 'You need to be signed in.';
    if (user.status !== 'active') return 'This account is ' + user.status + '.';
    if (!hasBrand(user, brandId)) return 'You don’t have access to this brand.';
    if (!has(ws, user, perm, brandId)) return roleName(user.role) + 's can’t ' + permName(perm) + ' in this workspace.';
    return null;
  }

  function assert(ws, user, perm, brandId) { var w = why(ws, user, perm, brandId); if (w) throw Denied(w); }

  /* ---------- approval rules ----------
     stages: [{id, name, roles:[roleIds]}]  (configured per workspace,
     a brand can switch the client stage off).
     A reviewer may act on a post only when: they have content.approve,
     their role is allowed on the CURRENT stage, they did not write the
     post (unless the workspace explicitly allows self-approval), and they
     have not already signed off an earlier stage of this version. */
  function stagesFor(ws, brand) {
    var st = (ws.approval && ws.approval.stages) || [];
    return st.filter(function (s) { return s.enabled !== false && !(s.id === 'client' && brand && brand.clientApproval === false); });
  }
  function reviewBlock(ws, user, post, brand) {
    var w = why(ws, user, 'content.approve', post.brandId);
    if (w) return w;
    if (post.status !== 'in_review') return 'This post isn’t waiting for review.';
    var stages = stagesFor(ws, brand), stage = stages[post.stage || 0];
    if (!stage) return 'This post has no review stage left.';
    if (stage.roles.indexOf(user.role) < 0 && user.role !== 'owner') return 'The “' + stage.name + '” step is for ' + stage.roles.map(roleName).join(', ') + '.';
    if (post.authorId === user.id && !(ws.approval && ws.approval.allowSelfApproval)) return 'You can’t approve your own post. Ask a teammate to review it.';
    var signed = (post.approvals || []).filter(function (a) { return a.version === post.version && a.userId === user.id && a.decision === 'approved'; });
    if (signed.length) return 'You already approved an earlier step of this version.';
    return null;
  }

  return { ROLES: ROLES, PERMS: PERMS, DEFAULT_MATRIX: DEFAULT_MATRIX, has: has, why: why, assert: assert, hasBrand: hasBrand, stagesFor: stagesFor, reviewBlock: reviewBlock, roleName: roleName, Denied: Denied };
}));
