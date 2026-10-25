/* ============================================================
   KINTRA — roles, permissions and location scope.
   UMD: the same file runs in the browser and in Node, so a server
   can enforce exactly the rules the interface shows.
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.KT = root.KT || {}; root.KT.policy = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var PERMS = [
    ['employees.view', 'View employee directory', 'People'],
    ['employees.edit', 'Create and edit employee records', 'People'],
    ['employees.sensitive', 'See personal details and pay rates', 'People'],
    ['schedule.edit', 'Create, edit and move shifts', 'Scheduling'],
    ['schedule.publish', 'Publish schedules', 'Scheduling'],
    ['attendance.view', 'View team attendance', 'Attendance'],
    ['attendance.correct', 'Correct clock records', 'Attendance'],
    ['attendance.approve', 'Approve timesheets', 'Attendance'],
    ['timeoff.approve', 'Approve or decline time off', 'Time off'],
    ['hiring.view', 'View jobs and candidates', 'Hiring'],
    ['hiring.edit', 'Move candidates and record updates', 'Hiring'],
    ['hiring.jobs', 'Create and edit job openings', 'Hiring'],
    ['payroll.view', 'View payroll', 'Payroll'],
    ['payroll.run', 'Calculate payroll and record payment', 'Payroll'],
    ['payroll.approve', 'Approve payroll', 'Payroll'],
    ['reports.view', 'View reports', 'Reports'],
    ['reports.cost', 'See labour cost figures', 'Reports'],
    ['org.settings', 'Change organisation settings', 'Administration'],
    ['users.manage', 'Manage users, roles and access', 'Administration']
  ];
  var ALL = PERMS.map(function (p) { return p[0]; });
  function except(list) { return ALL.filter(function (p) { return list.indexOf(p) < 0; }); }

  var ROLES = {
    owner: { name: 'Organisation Owner', desc: 'Full access, including payroll approval and billing decisions.', perms: ALL.slice() },
    admin: { name: 'Administrator', desc: 'Runs the workspace: settings, users and every module except payroll approval.', perms: except(['payroll.approve']) },
    hr: { name: 'HR Manager', desc: 'People records, time off, attendance review and hiring. Can view payroll.', perms: ['employees.view', 'employees.edit', 'employees.sensitive', 'attendance.view', 'attendance.correct', 'attendance.approve', 'timeoff.approve', 'hiring.view', 'hiring.edit', 'hiring.jobs', 'payroll.view', 'reports.view'] },
    ops: { name: 'Operations Manager', desc: 'Schedules, attendance and time off across their locations, with labour cost reports.', perms: ['employees.view', 'schedule.edit', 'schedule.publish', 'attendance.view', 'attendance.correct', 'attendance.approve', 'timeoff.approve', 'hiring.view', 'reports.view', 'reports.cost'] },
    locmgr: { name: 'Location Manager', desc: 'Runs one or more locations: shifts, attendance and time off for their teams.', perms: ['employees.view', 'schedule.edit', 'schedule.publish', 'attendance.view', 'attendance.correct', 'attendance.approve', 'timeoff.approve', 'hiring.view', 'reports.view'] },
    recruiter: { name: 'Recruiter', desc: 'Job openings, candidates and the hiring pipeline.', perms: ['employees.view', 'hiring.view', 'hiring.edit', 'hiring.jobs'] },
    payroll: { name: 'Payroll Manager', desc: 'Calculates payroll, reviews exceptions and records payment.', perms: ['employees.view', 'employees.sensitive', 'attendance.view', 'attendance.approve', 'payroll.view', 'payroll.run', 'payroll.approve', 'reports.view', 'reports.cost'] },
    employee: { name: 'Employee', desc: 'Their own schedule, time clock, time off and profile.', perms: [] }
  };
  var ROLE_ORDER = ['owner', 'admin', 'hr', 'ops', 'locmgr', 'recruiter', 'payroll', 'employee'];
  // permissions that are meaningful per location (others are organisation-wide)
  var LOCATION_SCOPED = ['employees.view', 'employees.edit', 'schedule.edit', 'schedule.publish', 'attendance.view', 'attendance.correct', 'attendance.approve', 'timeoff.approve', 'reports.view', 'reports.cost'];

  function hasLoc(user, locId) {
    if (!user) return false;
    if (user.locationIds === 'all') return true;
    if (!locId) return true; // org-wide question: any location counts
    return (user.locationIds || []).indexOf(locId) >= 0;
  }
  function has(user, perm, locId) {
    if (!user || user.status !== 'active') return false;
    var r = ROLES[user.role];
    if (!r || r.perms.indexOf(perm) < 0) return false;
    if (LOCATION_SCOPED.indexOf(perm) >= 0 && locId) return hasLoc(user, locId);
    return true;
  }
  function why(user, perm, locId) {
    if (!user) return 'You are not signed in.';
    if (user.status !== 'active') return 'This account is not active.';
    var r = ROLES[user.role];
    var label = (PERMS.filter(function (p) { return p[0] === perm; })[0] || [perm, perm])[1];
    if (!r || r.perms.indexOf(perm) < 0) return 'Your role (' + (r ? r.name : user.role) + ') can’t ' + label.charAt(0).toLowerCase() + label.slice(1) + '.';
    if (LOCATION_SCOPED.indexOf(perm) >= 0 && locId && !hasLoc(user, locId)) return 'You don’t have access to this location.';
    return '';
  }
  function assert(user, perm, locId) {
    var w = has(user, perm, locId) ? '' : why(user, perm, locId);
    if (w) { var e = new Error(w); e.userFacing = true; e.code = 'forbidden'; throw e; }
  }
  // Can this user see this employee's record? Self is always allowed.
  function canSeeEmployee(user, emp) {
    if (!user || !emp) return false;
    if (user.employeeId === emp.id) return true;
    return has(user, 'employees.view', emp.locationId);
  }
  function canSeeSensitive(user, emp) {
    if (!user || !emp) return false;
    if (user.employeeId === emp.id) return true;
    return has(user, 'employees.sensitive', emp.locationId);
  }

  return {
    PERMS: PERMS, ROLES: ROLES, ROLE_ORDER: ROLE_ORDER, LOCATION_SCOPED: LOCATION_SCOPED,
    roleName: function (r) { return (ROLES[r] || { name: r }).name; },
    has: has, why: why, assert: assert, hasLoc: hasLoc, canSeeEmployee: canSeeEmployee, canSeeSensitive: canSeeSensitive
  };
});
