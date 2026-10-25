/* ============================================================
   KINTRA — demo organisation (fictional).
   KT.seed(today, nowMin) builds one coherent data set relative to
   today: shifts reference real employees, attendance follows those
   shifts, approved leave removes shifts, payroll history is computed
   from approved timesheets with the same engine the app uses.
   Every person, company and number here is invented demo data.
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./rules.js'), require('./policy.js'));
  else { root.KT = root.KT || {}; root.KT.seed = factory(root.KT.rules, root.KT.policy); }
})(typeof self !== 'undefined' ? self : this, function (R, policy) {
  'use strict';

  function easter(y) { var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1; return y + '-' + R.pad(mo) + '-' + R.pad(da); }
  function holidays(y) {
    var es = easter(y);
    return [
      { date: y + '-01-01', name: 'New Year’s Day' }, { date: R.addDays(es, -2), name: 'Good Friday' }, { date: R.addDays(es, 1), name: 'Easter Monday' },
      { date: y + '-05-01', name: 'Labour Day' }, { date: y + '-06-01', name: 'Madaraka Day' }, { date: y + '-10-10', name: 'Mazingira Day' },
      { date: y + '-10-20', name: 'Mashujaa Day' }, { date: y + '-12-12', name: 'Jamhuri Day' }, { date: y + '-12-25', name: 'Christmas Day' }, { date: y + '-12-26', name: 'Boxing Day' }
    ];
  }

  // ---------- reference data ----------
  var LOCATIONS = [
    { id: 'loc-wl', name: 'Westlands', type: 'Restaurant & bar', area: 'Westlands, Nairobi', open: '07:00', close: '00:00', rules: {} },
    { id: 'loc-kl', name: 'Kilimani', type: 'Café', area: 'Kilimani, Nairobi', open: '06:30', close: '20:00', rules: { maxShiftHours: 10 } },
    { id: 'loc-kr', name: 'Karen', type: 'Garden restaurant', area: 'Karen, Nairobi', open: '08:00', close: '22:00', rules: {} },
    { id: 'loc-kc', name: 'Central Kitchen', type: 'Production, delivery & head office', area: 'Industrial Area, Nairobi', open: '05:00', close: '22:00', rules: { minRestHours: 11 } }
  ];
  var DEPTS = [
    { id: 'd-kit', name: 'Kitchen' }, { id: 'd-foh', name: 'Front of House' }, { id: 'd-bar', name: 'Bar & Beverage' },
    { id: 'd-del', name: 'Delivery' }, { id: 'd-ops', name: 'Operations' }
  ];
  var ROLES = [
    { id: 'jr-headchef', name: 'Head Chef', deptId: 'd-kit', rate: 0 },
    { id: 'jr-cook', name: 'Line Cook', deptId: 'd-kit', rate: 260 },
    { id: 'jr-prep', name: 'Prep Cook', deptId: 'd-kit', rate: 210 },
    { id: 'jr-kp', name: 'Kitchen Porter', deptId: 'd-kit', rate: 180 },
    { id: 'jr-server', name: 'Server', deptId: 'd-foh', rate: 200 },
    { id: 'jr-host', name: 'Host', deptId: 'd-foh', rate: 190 },
    { id: 'jr-sup', name: 'Shift Supervisor', deptId: 'd-foh', rate: 320 },
    { id: 'jr-barista', name: 'Barista', deptId: 'd-bar', rate: 220 },
    { id: 'jr-bartender', name: 'Bartender', deptId: 'd-bar', rate: 240 },
    { id: 'jr-rider', name: 'Delivery Rider', deptId: 'd-del', rate: 210 },
    { id: 'jr-dispatch', name: 'Dispatcher', deptId: 'd-del', rate: 240 },
    { id: 'jr-locmgr', name: 'Location Manager', deptId: 'd-ops', rate: 0 },
    { id: 'jr-opsmgr', name: 'Operations Manager', deptId: 'd-ops', rate: 0 },
    { id: 'jr-hr', name: 'HR Manager', deptId: 'd-ops', rate: 0 },
    { id: 'jr-payroll', name: 'Payroll Manager', deptId: 'd-ops', rate: 0 },
    { id: 'jr-recruiter', name: 'Recruiter', deptId: 'd-ops', rate: 0 }
  ];
  var TEAMS = [
    { id: 't-wl-kit', name: 'Westlands Kitchen', locationId: 'loc-wl', deptId: 'd-kit' },
    { id: 't-wl-floor', name: 'Westlands Floor & Bar', locationId: 'loc-wl', deptId: 'd-foh' },
    { id: 't-kl-cafe', name: 'Kilimani Café', locationId: 'loc-kl', deptId: 'd-bar' },
    { id: 't-kr-garden', name: 'Karen Garden', locationId: 'loc-kr', deptId: 'd-foh' },
    { id: 't-kc-prod', name: 'Production Kitchen', locationId: 'loc-kc', deptId: 'd-kit' },
    { id: 't-kc-del', name: 'Delivery Fleet', locationId: 'loc-kc', deptId: 'd-del' },
    { id: 't-office', name: 'Head Office', locationId: 'loc-kc', deptId: 'd-ops' }
  ];

  // slot = [start, end, breakMin]
  var S = {
    office: [['08:30', '17:00', 60]],
    wlMgr: [['09:00', '17:30', 30], ['14:00', '22:30', 30]], wlChef: [['09:00', '18:00', 60]],
    wlCook: [['07:00', '15:00', 30], ['15:00', '23:00', 30]], wlPrep: [['06:30', '14:30', 30]], wlKp: [['10:00', '18:00', 30], ['16:00', '00:00', 30]],
    wlServer: [['10:00', '18:00', 30], ['15:30', '23:30', 30]], wlHost: [['11:00', '19:00', 30], ['16:00', '23:00', 30]],
    wlBar: [['16:00', '00:00', 30]], wlSup: [['09:00', '17:00', 30], ['15:00', '23:00', 30]],
    klMgr: [['08:00', '16:30', 30]], klBarista: [['06:30', '14:30', 30], ['12:00', '20:00', 30]], klServer: [['07:00', '15:00', 30], ['12:00', '20:00', 30]], klCook: [['06:30', '14:30', 30]], klSup: [['08:00', '16:00', 30]],
    krSup: [['09:00', '17:00', 30], ['14:00', '22:00', 30]], krCook: [['08:00', '16:00', 30], ['14:00', '22:00', 30]], krServer: [['09:00', '17:00', 30], ['14:00', '22:00', 30]],
    krHost: [['11:00', '19:00', 30]], krBar: [['14:00', '22:00', 30]], krKp: [['12:00', '20:00', 30]],
    kcChef: [['05:00', '14:00', 60]], kcPrep: [['05:00', '13:00', 30], ['10:00', '18:00', 30]], kcCook: [['05:00', '13:00', 30]],
    kcRider: [['10:00', '18:00', 30], ['14:00', '22:00', 30]], kcDispatch: [['09:00', '17:00', 30], ['14:00', '22:00', 30]]
  };

  // id, first, last, role, location, pay ('h' rate | 's' salary), slot set, weekly pattern Mon→Sun (A/B = slot, - = day off), extra: { skills, locs, startOffset, endOffset, allowance }
  var PEOPLE = [
    ['e01', 'Brian', 'Mutua', 'jr-locmgr', 'loc-wl', ['s', 140000], 'wlMgr', 'AAB-AA-'],
    ['e02', 'Joyce', 'Wambugu', 'jr-headchef', 'loc-wl', ['s', 125000], 'wlChef', '--AAAAA'],
    ['e03', 'Kevin', 'Otieno', 'jr-cook', 'loc-wl', ['h', 260], 'wlCook', 'A--AAAA', { skills: ['jr-prep'] }],
    ['e04', 'Samuel', 'Kariuki', 'jr-cook', 'loc-wl', ['h', 270], 'wlCook', 'BAA--BB', { skills: ['jr-prep'] }],
    ['e05', 'Esther', 'Chebet', 'jr-cook', 'loc-wl', ['h', 255], 'wlCook', '-BBBBBB', { skills: ['jr-prep'] }],
    ['e06', 'Moses', 'Ouma', 'jr-prep', 'loc-wl', ['h', 210], 'wlPrep', 'AA-AAA-'],
    ['e07', 'John', 'Kamau', 'jr-kp', 'loc-wl', ['h', 180], 'wlKp', 'A-BAB-B'],
    ['e08', 'Grace', 'Akinyi', 'jr-server', 'loc-wl', ['h', 205], 'wlServer', 'AA--BBA', { skills: ['jr-host'] }],
    ['e09', 'Mercy', 'Wanjiku', 'jr-server', 'loc-wl', ['h', 200], 'wlServer', 'B-AAAB-', { skills: ['jr-host'] }],
    ['e10', 'Collins', 'Kiplagat', 'jr-server', 'loc-wl', ['h', 200], 'wlServer', 'BBB-BAB'],
    ['e11', 'Lucy', 'Mueni', 'jr-host', 'loc-wl', ['h', 190], 'wlHost', '-A-ABBB', { skills: ['jr-server'] }],
    ['e12', 'Victor', 'Omondi', 'jr-bartender', 'loc-wl', ['h', 245], 'wlBar', '-AAAAAA'],
    ['e13', 'Nancy', 'Achieng', 'jr-bartender', 'loc-wl', ['h', 240], 'wlBar', 'AAA--AA', { skills: ['jr-barista'] }],
    ['e14', 'Dennis', 'Waweru', 'jr-sup', 'loc-wl', ['h', 320], 'wlSup', 'AB--BAB', { skills: ['jr-server', 'jr-host'] }],
    ['e15', 'Amina', 'Hassan', 'jr-locmgr', 'loc-kl', ['s', 135000], 'klMgr', 'AAAAA--', { locs: ['loc-kr'] }],
    ['e16', 'Ian', 'Mwenda', 'jr-barista', 'loc-kl', ['h', 225], 'klBarista', 'AAA--AA', { skills: ['jr-server'] }],
    ['e17', 'Purity', 'Nyambura', 'jr-barista', 'loc-kl', ['h', 220], 'klBarista', 'B--AABB', { skills: ['jr-server'] }],
    ['e18', 'Halima', 'Abdi', 'jr-server', 'loc-kl', ['h', 200], 'klServer', 'AA-AA-A', { skills: ['jr-barista'] }],
    ['e19', 'George', 'Njoroge', 'jr-server', 'loc-kl', ['h', 200], 'klServer', 'B-ABBA-'],
    ['e20', 'Sharon', 'Atieno', 'jr-cook', 'loc-kl', ['h', 250], 'klCook', 'AA-AAA-', { startOffset: -35, skills: ['jr-prep'] }],
    ['e21', 'Felix', 'Kibet', 'jr-sup', 'loc-kl', ['h', 310], 'klSup', 'AA--AAA', { skills: ['jr-barista', 'jr-server'] }],
    ['e22', 'Rose', 'Wanjiru', 'jr-sup', 'loc-kr', ['h', 315], 'krSup', 'AB-BA-B', { skills: ['jr-server', 'jr-host'] }],
    ['e23', 'Tom', 'Odhiambo', 'jr-cook', 'loc-kr', ['h', 260], 'krCook', 'AAA-A-A', { locs: ['loc-wl'], skills: ['jr-prep'] }],
    ['e24', 'Caroline', 'Muthoni', 'jr-cook', 'loc-kr', ['h', 255], 'krCook', 'BB-A-AB', { skills: ['jr-prep'] }],
    ['e25', 'Erick', 'Barasa', 'jr-server', 'loc-kr', ['h', 200], 'krServer', 'BB-BB-B'],
    ['e26', 'Diana', 'Kerubo', 'jr-server', 'loc-kr', ['h', 200], 'krServer', 'A-B-ABA', { skills: ['jr-host'] }],
    ['e27', 'Allan', 'Kimani', 'jr-host', 'loc-kr', ['h', 190], 'krHost', 'A-A-AAA', { skills: ['jr-server'] }],
    ['e28', 'Beatrice', 'Nafula', 'jr-bartender', 'loc-kr', ['h', 235], 'krBar', '--AAAAA'],
    ['e29', 'Paul', 'Mutiso', 'jr-kp', 'loc-kr', ['h', 180], 'krKp', 'AAA--AA'],
    ['e30', 'Stephen', 'Gitau', 'jr-headchef', 'loc-kc', ['s', 130000], 'kcChef', 'AA-AAA-'],
    ['e31', 'Agnes', 'Moraa', 'jr-prep', 'loc-kc', ['h', 210], 'kcPrep', 'AAAAA--'],
    ['e32', 'Hassan', 'Juma', 'jr-prep', 'loc-kc', ['h', 215], 'kcPrep', 'BB-B-AA'],
    ['e33', 'Wycliffe', 'Onyango', 'jr-cook', 'loc-kc', ['h', 255], 'kcCook', 'AAAA-A-', { skills: ['jr-prep'] }],
    ['e34', 'Kelvin', 'Mwangi', 'jr-rider', 'loc-kc', ['h', 210], 'kcRider', 'AAAAAA-', { allowance: 1500 }],
    ['e35', 'Abdi', 'Noor', 'jr-rider', 'loc-kc', ['h', 210], 'kcRider', 'B-A-BAA', { allowance: 1500 }],
    ['e36', 'Brenda', 'Chepkoech', 'jr-rider', 'loc-kc', ['h', 215], 'kcRider', '-BBB-BA', { allowance: 1500 }],
    ['e37', 'Martin', 'Ndirangu', 'jr-dispatch', 'loc-kc', ['h', 240], 'kcDispatch', 'ABAB-A-'],
    ['e38', 'Daniel', 'Ochieng', 'jr-opsmgr', 'loc-kc', ['s', 230000], null, null, { locs: ['loc-wl', 'loc-kl', 'loc-kr'] }],
    ['e39', 'Faith', 'Njeri', 'jr-hr', 'loc-kc', ['s', 185000], null, null],
    ['e40', 'Peter', 'Kiprono', 'jr-payroll', 'loc-kc', ['s', 160000], null, null],
    ['e41', 'Lilian', 'Wambui', 'jr-recruiter', 'loc-kc', ['s', 115000], null, null],
    ['e42', 'Mark', 'Kiprotich', 'jr-server', 'loc-kr', ['h', 195], 'krServer', 'AABBA--', { endOffset: -36 }]
  ];
  var START_DATES = { e01: '2021-03-01', e02: '2019-08-12', e03: '2023-02-06', e04: '2022-06-13', e05: '2024-01-15', e06: '2023-09-04', e07: '2025-05-19', e08: '2024-03-04', e09: '2022-11-07', e10: '2025-02-10', e11: '2024-07-22', e12: '2021-10-04', e13: '2023-05-15', e14: '2020-04-06', e15: '2020-09-01', e16: '2023-03-13', e17: '2024-10-07', e18: '2025-01-13', e19: '2025-08-04', e21: '2022-02-14', e22: '2021-06-07', e23: '2022-03-21', e24: '2024-05-06', e25: '2023-11-13', e26: '2025-03-17', e27: '2024-09-02', e28: '2023-07-10', e29: '2025-06-23', e30: '2019-01-07', e31: '2022-08-01', e32: '2024-02-19', e33: '2023-04-24', e34: '2024-06-03', e35: '2025-04-07', e36: '2025-09-15', e37: '2023-01-16', e38: '2019-05-06', e39: '2020-02-03', e40: '2021-01-11', e41: '2024-04-08', e42: '2024-02-05' };

  function seed(today, nowMin) {
    var rnd = R.rng(20261025);
    function pick(a) { return a[Math.floor(rnd() * a.length)]; }
    function ri(a, b) { return a + Math.floor(rnd() * (b - a + 1)); }
    var nowAbs = R.epochDay(today) * 1440 + nowMin;
    var curMon = R.weekStart(today, 1), D0 = R.addDays(curMon, -56), D1 = R.addDays(curMon, 13);
    var year = +today.slice(0, 4);
    var hol = holidays(year).concat(holidays(year + 1)).filter(function (h) { return h.date >= R.addDays(today, -400); });
    function ago(mins) { return R.fromAbs(nowAbs - mins); }
    var idn = 0; function id(p) { idn++; return p + '-' + idn.toString(36); }

    var org = {
      id: 'org-kh', name: 'Kijani Hearth Hospitality', legalName: 'Kijani Hearth Hospitality (demo)', industry: 'Restaurants & hospitality', country: 'Kenya',
      timezone: 'Africa/Nairobi', currency: 'KES', weekStart: 1, demo: true,
      scheduling: { maxShiftHours: 12, minShiftHours: 3, minRestHours: 10, weeklyHoursLimit: 45, breakAfterHours: 5, minBreakMin: 30 },
      attendance: { graceMin: 5, earlyGraceMin: 10 },
      leave: { countMode: 'mon_sat' },
      approvals: { timeoff: 'manager', payroll: 'separate' },
      payroll: {
        frequency: 'fortnightly', anchor: R.addDays(curMon, -56), payDateOffset: 12, approvalLeadDays: 3, hoursPerDay: 8,
        overtimeAfterWeekly: 45, overtimeMultiplier: 1.5, holidayMultiplier: 2,
        rules: [
          { id: 'pr-pension', name: 'Pension (example)', method: 'percent', rate: 5, employerRate: 5, max: 2500, pretax: true, active: true, appliesTo: 'all' },
          { id: 'pr-health', name: 'Health insurance (example)', method: 'percent', rate: 2.75, min: 150, base: 'gross', active: true, appliesTo: 'all' },
          { id: 'pr-housing', name: 'Housing levy (example)', method: 'percent', rate: 1.5, employerRate: 1.5, base: 'gross', active: true, appliesTo: 'all' },
          { id: 'pr-tax', name: 'Income tax (example bands)', method: 'bands', base: 'taxable', relief: 28800, active: true, appliesTo: 'all', bands: [{ upTo: 288000, rate: 10 }, { upTo: 388000, rate: 25 }, { upTo: 6000000, rate: 30 }, { upTo: 9600000, rate: 32.5 }, { upTo: '', rate: 35 }] }
        ]
      },
      hiring: { stages: [{ id: 'applied', name: 'Applied' }, { id: 'screening', name: 'Screening' }, { id: 'interview', name: 'Interview' }, { id: 'assessment', name: 'Trial shift' }, { id: 'offer', name: 'Offer' }, { id: 'hired', name: 'Hired', fixed: true }, { id: 'rejected', name: 'Rejected', fixed: true }] },
      holidays: hol
    };
    var leaveTypes = [
      { id: 'lt-annual', name: 'Annual leave', paid: true, allowance: 21, color: 'teal', note: false },
      { id: 'lt-sick', name: 'Sick leave', paid: true, allowance: 14, color: 'amber', note: true },
      { id: 'lt-personal', name: 'Personal leave', paid: true, allowance: 3, color: 'blue', note: false },
      { id: 'lt-unpaid', name: 'Unpaid leave', paid: false, allowance: null, color: 'grey', note: false }
    ];

    // ---------- employees ----------
    var employees = PEOPLE.map(function (p, i) {
      var x = p[8] || {}, role = ROLES.filter(function (r) { return r.id === p[3]; })[0];
      var start = START_DATES[p[0]] || R.addDays(curMon, x.startOffset || 0);
      if (x.startOffset) start = R.addDays(curMon, x.startOffset);
      var slug = (p[1] + '.' + p[2]).toLowerCase();
      var e = {
        id: p[0], first: p[1], last: p[2], jobRoleId: p[3], deptId: role.deptId, locationId: p[4], locationIds: [p[4]].concat(x.locs || []),
        skills: [p[3]].concat(x.skills || []), teamId: null, managerId: null,
        status: 'active', type: p[5][0] === 's' ? 'Full-time' : (i % 5 === 4 ? 'Part-time' : 'Full-time'),
        payType: p[5][0] === 's' ? 'salaried' : 'hourly', rate: p[5][0] === 'h' ? p[5][1] : 0, salary: p[5][0] === 's' ? p[5][1] : 0, allowance: x.allowance || 0,
        otEligible: p[5][0] === 'h', payMethod: i % 3 === 0 ? 'Mobile money' : 'Bank transfer',
        start: start, end: x.endOffset ? R.addDays(curMon, x.endOffset) : null,
        workEmail: slug + '@kijanihearth.example', workPhone: '+254 000 100 ' + (100 + i),
        personal: { email: slug + '@mail.example', phone: '+254 000 200 ' + (100 + i), dob: (1984 + (i * 7) % 18) + '-' + R.pad(1 + (i * 5) % 12) + '-' + R.pad(1 + (i * 11) % 27), idLast4: String(1000 + (i * 7919) % 9000), address: ['Kileleshwa', 'Ruaka', 'South B', 'Kasarani', 'Rongai', 'Embakasi', 'Ngong Road', 'Kawangware'][i % 8] + ', Nairobi', emergency: { name: ['Jane', 'Paul', 'Ruth', 'Samuel', 'Esther', 'James'][i % 6] + ' ' + p[2], relation: ['Spouse', 'Parent', 'Sibling'][i % 3], phone: '+254 000 300 ' + (100 + i) } },
        slots: p[6], pattern: p[7],
        onboarding: null, docs: [], notes: ''
      };
      if (e.end) e.status = 'terminated';
      return e;
    });
    var E = {}; employees.forEach(function (e) { E[e.id] = e; });
    // managers & teams
    employees.forEach(function (e) {
      var L = e.locationId, d = e.deptId;
      e.teamId = L === 'loc-wl' ? (d === 'd-kit' ? 't-wl-kit' : 't-wl-floor') : L === 'loc-kl' ? 't-kl-cafe' : L === 'loc-kr' ? 't-kr-garden' : d === 'd-kit' ? 't-kc-prod' : d === 'd-del' ? 't-kc-del' : 't-office';
      e.managerId = { 'loc-wl': 'e01', 'loc-kl': 'e15', 'loc-kr': 'e15', 'loc-kc': 'e30' }[L];
      if (d === 'd-del') e.managerId = 'e37';
      if (d === 'd-ops' || e.id === 'e30' || e.id === 'e37') e.managerId = 'e38';
      if (e.id === 'e38') e.managerId = null;
    });
    var teams = TEAMS.map(function (t) { var c = {}; for (var k in t) c[k] = t[k]; c.leadId = { 't-wl-kit': 'e02', 't-wl-floor': 'e14', 't-kl-cafe': 'e21', 't-kr-garden': 'e22', 't-kc-prod': 'e30', 't-kc-del': 'e37', 't-office': 'e38' }[t.id]; return c; });

    // ---------- users ----------
    var all = 'all';
    var users = [
      { id: 'u-owner', name: 'Wairimu Kamau', email: 'wairimu.kamau@kijanihearth.example', role: 'owner', employeeId: null, locationIds: all },
      { id: 'u-admin', name: 'Joseph Mwangi', email: 'joseph.mwangi@kijanihearth.example', role: 'admin', employeeId: null, locationIds: all },
      { id: 'u-hr', name: 'Faith Njeri', email: E.e39.workEmail, role: 'hr', employeeId: 'e39', locationIds: all },
      { id: 'u-ops', name: 'Daniel Ochieng', email: E.e38.workEmail, role: 'ops', employeeId: 'e38', locationIds: ['loc-wl', 'loc-kl', 'loc-kr', 'loc-kc'] },
      { id: 'u-wl', name: 'Brian Mutua', email: E.e01.workEmail, role: 'locmgr', employeeId: 'e01', locationIds: ['loc-wl'] },
      { id: 'u-kl', name: 'Amina Hassan', email: E.e15.workEmail, role: 'locmgr', employeeId: 'e15', locationIds: ['loc-kl', 'loc-kr'] },
      { id: 'u-kc', name: 'Stephen Gitau', email: E.e30.workEmail, role: 'locmgr', employeeId: 'e30', locationIds: ['loc-kc'] },
      { id: 'u-rec', name: 'Lilian Wambui', email: E.e41.workEmail, role: 'recruiter', employeeId: 'e41', locationIds: all },
      { id: 'u-pay', name: 'Peter Kiprono', email: E.e40.workEmail, role: 'payroll', employeeId: 'e40', locationIds: all },
      { id: 'u-kevin', name: 'Kevin Otieno', email: E.e03.workEmail, role: 'employee', employeeId: 'e03', locationIds: ['loc-wl'] },
      { id: 'u-grace', name: 'Grace Akinyi', email: E.e08.workEmail, role: 'employee', employeeId: 'e08', locationIds: ['loc-wl'] }
    ].map(function (u) { u.status = 'active'; u.lastActive = ago(ri(20, 4000)); u.notify = { timeoff: true, schedule: true, attendance: true, hiring: true, payroll: true }; return u; });

    // ---------- leave (before shifts: approved leave removes shifts) ----------
    var leave = [];
    function L(emp, type, s, e, status, o) {
      o = o || {};
      var r = { id: id('lv'), employeeId: emp, typeId: type, start: s, end: e, half: !!o.half, days: R.leaveDays(s, e, org.leave.countMode, hol, o.half), note: o.note || '', status: status, createdAt: o.created || R.addDays(s, -ri(6, 20)) + 'T' + R.pad(ri(8, 18)) + ':' + R.pad(ri(0, 59)), decidedBy: null, decidedAt: null, reason: o.reason || '' };
      if (status === 'approved' || status === 'declined') { r.decidedBy = o.by || (E[emp].locationId === 'loc-wl' ? 'u-wl' : E[emp].locationId === 'loc-kc' ? 'u-kc' : 'u-kl'); r.decidedAt = R.addDays(r.createdAt.slice(0, 10), 1) + 'T10:' + R.pad(ri(10, 50)); }
      leave.push(r); return r;
    }
    var w = function (n, d) { return R.addDays(curMon, n * 7 + d); }; // week offset, day offset (0 = Monday)
    L('e06', 'lt-annual', w(-7, 0), w(-7, 4), 'approved', { note: 'Family visit upcountry' });
    L('e17', 'lt-sick', w(-6, 2), w(-6, 3), 'approved', { note: 'Flu. Clinic note given to Amina.', created: w(-6, 2) + 'T06:10' });
    L('e25', 'lt-annual', w(-5, 1), w(-5, 5), 'approved');
    L('e33', 'lt-personal', w(-4, 4), w(-4, 4), 'approved', { note: 'Graduation ceremony' });
    L('e09', 'lt-sick', w(-3, 1), w(-3, 1), 'approved', { created: w(-3, 1) + 'T07:02' });
    L('e35', 'lt-annual', w(-3, 0), w(-3, 5), 'approved');
    L('e12', 'lt-annual', w(-2, 2), w(-2, 6), 'approved', { note: 'Wedding in Kisumu' });
    L('e31', 'lt-sick', w(-2, 4), w(-2, 5), 'approved');
    L('e19', 'lt-unpaid', w(-1, 3), w(-1, 4), 'approved', { note: 'Exams' });
    L('e04', 'lt-annual', w(-1, 1), w(-1, 3), 'approved');
    L('e24', 'lt-sick', w(0, 1), w(0, 3), 'approved', { note: 'Back injury, doctor’s note attached', created: w(0, 1) + 'T06:40' });
    L('e28', 'lt-annual', w(1, 0), w(1, 4), 'approved', { note: 'Annual leave as discussed in September' });
    L('e16', 'lt-annual', w(3, 0), w(3, 6), 'approved');
    L('e03', 'lt-annual', w(-6, 0), w(-6, 2), 'approved');
    L('e10', 'lt-personal', w(-1, 6), w(-1, 6), 'declined', { reason: 'Sunday is fully booked for the brunch event. Please pick another day.', by: 'u-wl' });
    L('e26', 'lt-annual', w(2, 3), w(2, 5), 'cancelled', { note: 'Plans changed' });
    // pending
    var pend1 = L('e09', 'lt-annual', w(1, 3), w(1, 5), 'pending', { note: 'Sister’s wedding in Nakuru', created: ago(26 * 60) });
    L('e10', 'lt-annual', w(1, 4), w(1, 6), 'pending', { note: '', created: ago(5 * 60 + 12) });
    L('e34', 'lt-sick', R.addDays(today, -1), R.addDays(today, -1), 'pending', { note: 'Stomach bug, stayed home. Can bring a note.', created: ago(16 * 60) });
    L('e17', 'lt-personal', w(2, 2), w(2, 2), 'pending', { note: 'Moving house', created: ago(2 * 1440 + 90) });
    L('e03', 'lt-annual', w(3, 1), w(3, 3), 'pending', { note: 'Long weekend with family', created: ago(3 * 1440 + 200) });
    void pend1;
    function onLeave(emp, d) { return leave.some(function (l) { return l.employeeId === emp && l.status === 'approved' && R.inRange(d, l.start, l.end); }); }

    // ---------- shifts ----------
    var shifts = [];
    function addShift(o) {
      var sh = { id: id('sh'), employeeId: o.employeeId || null, date: o.date, start: o.start, end: o.end, breakMin: o.breakMin == null ? 30 : o.breakMin, jobRoleId: o.jobRoleId, locationId: o.locationId, status: o.status || 'published' };
      if (o.notes) sh.notes = o.notes;
      shifts.push(sh); return sh;
    }
    var draftLocs = { 'loc-wl': 1, 'loc-kr': 1 };
    employees.forEach(function (e, idx) {
      if (!e.slots) return;
      var slots = S[e.slots];
      R.range(D0, D1).forEach(function (d) {
        if (d < e.start || (e.end && d > e.end)) return;
        var dw = R.dow(d), ch = e.pattern.charAt((dw + 6) % 7);
        if (ch === '-') return;
        if (onLeave(e.id, d)) return;
        var sl = slots[Math.min(slots.length - 1, ch === 'B' ? 1 : 0)];
        var st = sl[0], en = sl[1];
        if (e.slots === 'wlBar' && (dw === 5 || dw === 6)) { st = '17:00'; en = '01:00'; }
        var status = d >= R.addDays(curMon, 7) && draftLocs[e.locationId] ? 'draft' : 'published';
        addShift({ employeeId: e.id, date: d, start: st, end: en, breakMin: sl[2], jobRoleId: e.jobRoleId, locationId: e.locationId, status: status });
      });
    });
    // open shifts are created further down, after the staffing requirements, for real gaps in the coming days
    // salaried managers' extra notes
    shifts.filter(function (s) { return s.employeeId === 'e14' && s.date === w(0, 4); }).forEach(function (s) { s.notes = 'Stock count after close'; });
    shifts.filter(function (s) { return s.employeeId === 'e21' && s.date === w(1, 0); }).forEach(function (s) { s.notes = 'Train new barista on opening checklist'; });

    var requirements = [
      { locationId: 'loc-wl', jobRoleId: 'jr-cook', start: '07:00', end: '15:00', count: 1, days: [0, 1, 2, 3, 4, 5, 6] },
      { locationId: 'loc-wl', jobRoleId: 'jr-cook', start: '15:00', end: '23:00', count: 1, days: [0, 1, 2, 3, 4, 5, 6] },
      { locationId: 'loc-wl', jobRoleId: 'jr-server', start: '11:00', end: '17:00', count: 1, days: [0, 1, 2, 3, 4, 5, 6] },
      { locationId: 'loc-wl', jobRoleId: 'jr-server', start: '18:00', end: '23:00', count: 2, days: [5, 6, 0] },
      { locationId: 'loc-wl', jobRoleId: 'jr-bartender', start: '17:00', end: '23:30', count: 1, days: [0, 1, 2, 3, 4, 5, 6] },
      { locationId: 'loc-kl', jobRoleId: 'jr-barista', start: '07:00', end: '14:00', count: 1, days: [0, 1, 2, 3, 4, 5, 6] },
      { locationId: 'loc-kl', jobRoleId: 'jr-server', start: '08:00', end: '14:00', count: 1, days: [0, 1, 2, 3, 4, 5, 6] },
      { locationId: 'loc-kr', jobRoleId: 'jr-cook', start: '08:00', end: '16:00', count: 1, days: [0, 1, 2, 3, 4, 5, 6] },
      { locationId: 'loc-kr', jobRoleId: 'jr-server', start: '14:00', end: '20:00', count: 1, days: [0, 1, 2, 3, 4, 5, 6] },
      { locationId: 'loc-kr', jobRoleId: 'jr-bartender', start: '16:00', end: '21:00', count: 1, days: [5, 6, 0] },
      { locationId: 'loc-kc', jobRoleId: 'jr-prep', start: '05:00', end: '13:00', count: 1, days: [1, 2, 3, 4, 5, 6] },
      { locationId: 'loc-kc', jobRoleId: 'jr-rider', start: '12:00', end: '17:00', count: 1, days: [1, 2, 3, 4, 5] },
      { locationId: 'loc-kc', jobRoleId: 'jr-rider', start: '12:00', end: '17:00', count: 2, days: [0, 6] }
    ].map(function (q) { q.id = id('rq'); return q; });
    // open shifts for the first few gaps in the coming days; the rest stay visible as gaps
    var made = 0, NOTES = { 'jr-cook': 'Cover while a cook is on leave', 'jr-bartender': 'Bar cover during annual leave', 'jr-server': 'Busy evening, extra server needed', 'jr-rider': 'Weekend delivery peak' };
    R.range(R.addDays(today, 1), R.addDays(curMon, 13)).forEach(function (d) {
      LOCATIONS.forEach(function (l) {
        R.coverage(d, l.id, shifts, requirements).forEach(function (c) {
          if (c.ok || made >= 4) return;
          var q = c.req, role = q.jobRoleId, slot = { 'jr-cook': ['08:00', '16:00'], 'jr-bartender': ['14:00', '22:00'], 'jr-server': q.start >= '17:00' ? ['17:00', '23:30'] : ['14:00', '22:00'], 'jr-rider': ['10:00', '18:00'], 'jr-barista': ['06:30', '14:30'], 'jr-prep': ['05:00', '13:00'] }[role] || [q.start, q.end];
          if (l.id === 'loc-wl' && role === 'jr-cook') slot = q.start < '12:00' ? ['07:00', '15:00'] : ['15:00', '23:00'];
          var draft = d >= R.addDays(curMon, 7) && draftLocs[l.id];
          for (var n = c.scheduled; n < c.required && made < 4; n++) { addShift({ date: d, start: slot[0], end: slot[1], jobRoleId: role, locationId: l.id, status: draft ? 'draft' : 'published', notes: NOTES[role] || '' }); made++; }
        });
      });
    });

    // ---------- payroll periods ----------
    var periods = [];
    for (var k = -4; k <= 0; k++) {
      var ps = R.addDays(curMon, k * 14), pe = R.addDays(ps, 13);
      periods.push({ id: 'pp-' + ps, start: ps, end: pe, payDate: R.addDays(pe, org.payroll.payDateOffset), status: 'open', records: null, history: [] });
    }
    function periodOf(d) { return periods.filter(function (p) { return R.inRange(d, p.start, p.end); })[0]; }
    var P1 = periods[3], P0 = periods[4];

    // ---------- attendance ----------
    var entries = [], audit = [];
    var notInId = null, breakId = null;
    shifts.slice().sort(function (a, b) { return R.span(a).s - R.span(b).s; }).forEach(function (sh) {
      if (!sh.employeeId) return;
      var sp = R.span(sh);
      if (sp.s > nowAbs) return;
      var r = rnd(), per = periodOf(sh.date), isPast = sp.e <= nowAbs;
      // one person today hasn't clocked in yet
      if (!isPast && !notInId && sp.s < nowAbs - 20 && sh.date === today) { notInId = sh.id; return; }
      if (isPast && r < 0.022 && sh.date !== today) return; // absent
      if (leave.some(function (l) { return l.employeeId === sh.employeeId && l.status === 'pending' && l.typeId === 'lt-sick' && R.inRange(sh.date, l.start, l.end); })) return; // off sick, request not yet approved
      var ci = r < 0.085 ? sp.s + ri(6, 26) : sp.s - ri(0, 12) + (rnd() < 0.3 ? ri(0, 4) : 0);
      if (!isPast && ci > nowAbs) ci = nowAbs - 1;
      var en = { id: id('te'), employeeId: sh.employeeId, shiftId: sh.id, date: sh.date, locationId: sh.locationId, in: R.fromAbs(ci), out: null, breaks: [], status: 'pending' };
      var r2 = rnd();
      if (isPast) {
        var missingOut = r2 < 0.015 && per && (per === P1 || per === P0) && sh.date !== today;
        if (!missingOut) {
          var co = r2 < 0.045 ? sp.e - ri(15, 55) : sp.e - ri(0, 3) + ri(0, 14);
          en.out = R.fromAbs(co);
          if (sh.breakMin) { var bs = sp.s + Math.floor((sp.e - sp.s) / 2) - 15 + ri(-20, 20); en.breaks.push({ s: R.fromAbs(bs), e: R.fromAbs(bs + sh.breakMin + ri(-4, 8)) }); }
        }
      } else if (sh.breakMin && nowAbs - sp.s > (sp.e - sp.s) / 2 + 20) {
        var bs2 = sp.s + Math.floor((sp.e - sp.s) / 2) - 20;
        if (!breakId && nowAbs - bs2 < sh.breakMin) { breakId = en.id; en.breaks.push({ s: R.fromAbs(bs2), e: null }); }
        else en.breaks.push({ s: R.fromAbs(bs2), e: R.fromAbs(Math.min(nowAbs - 1, bs2 + sh.breakMin)) });
      }
      // approval status
      var ev = R.evaluate(sh, en, { now: nowAbs, graceMin: 5, earlyGraceMin: 10 });
      if (per && per !== P1 && per !== P0) en.status = 'approved';
      else if (per === P1) en.status = ev.flags.length && rnd() < 0.55 ? 'pending' : (en.out ? 'approved' : 'pending');
      else en.status = en.out && sh.date < R.addDays(curMon, 3) && !ev.flags.length && today >= R.addDays(curMon, 3) ? 'approved' : 'pending';
      if (en.status === 'approved') { en.approvedBy = sh.locationId === 'loc-wl' ? 'u-wl' : sh.locationId === 'loc-kc' ? 'u-kc' : 'u-kl'; en.approvedAt = R.addDays(sh.date, 2) + 'T09:30'; }
      entries.push(en);
    });
    // an unscheduled shift that needs review: a server covered a lunch rush at Westlands
    var ex = R.addDays(P1.start, 2);
    entries.push({ id: id('te'), employeeId: 'e11', shiftId: null, date: ex, locationId: 'loc-wl', in: ex + 'T11:58', out: ex + 'T16:04', breaks: [], status: 'pending', note: 'Called in for a private lunch booking' });
    // a corrected record (manager fixed a forgotten clock-out), with its audit trail
    var fix = entries.filter(function (e) { return e.date >= P1.start && e.date <= P1.end && e.out && e.status === 'approved' && E[e.employeeId].locationId === 'loc-kc'; })[3];
    if (fix) {
      var oldOut = '(none)'; var sh0 = shifts.filter(function (s) { return s.id === fix.shiftId; })[0];
      fix.out = R.fromAbs(R.span(sh0).e + 4);
      fix.corrections = [];
      fix.corrections.push({ at: R.addDays(fix.date, 1) + 'T08:12', by: 'u-kc', field: 'Clock-out', from: oldOut, to: fix.out.slice(11), reason: 'Forgot to clock out; confirmed with dispatch log' });
      fix.source = 'manual';
      audit.push({ id: id('au'), at: R.addDays(fix.date, 1) + 'T08:12', by: 'u-kc', entity: 'entry', entityId: fix.id, empId: fix.employeeId, locationId: fix.locationId, action: 'corrected', text: 'Corrected clock-out for ' + E[fix.employeeId].first + ' ' + E[fix.employeeId].last + ' on ' + fix.date, reason: 'Forgot to clock out; confirmed with dispatch log' });
    }

    // ---------- payroll history (computed by the same engine) ----------
    function compute(p) {
      return employees.filter(function (e) { return e.start <= p.end && (!e.end || e.end >= p.start); }).map(function (e) {
        return R.calcRecord(e, p, { entries: entries.filter(function (x) { return x.employeeId === e.id; }), leave: leave.filter(function (l) { return l.employeeId === e.id; }), leaveTypes: leaveTypes, holidays: hol, payroll: org.payroll, weekStart: 1, leaveMode: org.leave.countMode });
      });
    }
    periods.slice(0, 3).forEach(function (p) {
      p.records = compute(p);
      p.status = 'paid';
      var calcAt = R.addDays(p.end, 3) + 'T10:15', apprAt = R.addDays(p.end, 5) + 'T15:40', paidAt = R.addDays(p.payDate, 0);
      p.calculatedAt = calcAt; p.calculatedBy = 'u-pay'; p.approvedAt = apprAt; p.approvedBy = 'u-owner';
      p.paid = { date: paidAt, reference: 'Bank batch ' + p.end.replace(/-/g, '').slice(2), recordedBy: 'u-pay', recordedAt: paidAt + 'T16:05' };
      p.history = [{ at: calcAt, by: 'u-pay', action: 'Calculated payroll' }, { at: apprAt, by: 'u-owner', action: 'Approved payroll' }, { at: paidAt + 'T16:05', by: 'u-pay', action: 'Recorded payment', note: p.paid.reference }];
    });

    // ---------- hiring ----------
    var jobs = [
      { id: 'job-cook-wl', title: 'Line Cook', deptId: 'd-kit', locationId: 'loc-wl', type: 'Full-time', status: 'open', openings: 2, pay: 'KES 240–280 per hour', posted: R.addDays(today, -24), recruiterId: 'u-rec', managerId: 'e01', summary: 'Cook on the grill and sauté stations for lunch and dinner service in a busy restaurant and bar.', requirements: ['2+ years on a commercial line', 'Food handler’s certificate', 'Available for evening and weekend shifts'] },
      { id: 'job-barista-kl', title: 'Barista', deptId: 'd-bar', locationId: 'loc-kl', type: 'Full-time', status: 'open', openings: 1, pay: 'KES 210–230 per hour', posted: R.addDays(today, -12), recruiterId: 'u-rec', managerId: 'e15', summary: 'Make espresso drinks and keep the bar moving through the morning rush at our café.', requirements: ['1+ year as a barista', 'Milk texturing and latte art', 'Early starts from 06:30'] },
      { id: 'job-rider-kc', title: 'Delivery Rider', deptId: 'd-del', locationId: 'loc-kc', type: 'Part-time', status: 'open', openings: 3, pay: 'KES 210 per hour + transport allowance', posted: R.addDays(today, -9), recruiterId: 'u-rec', managerId: 'e37', summary: 'Deliver orders from the Central Kitchen across Nairobi on a company motorbike.', requirements: ['Valid motorcycle licence', 'Knows Nairobi’s main routes', 'Weekend availability'] },
      { id: 'job-sup-kr', title: 'Shift Supervisor', deptId: 'd-foh', locationId: 'loc-kr', type: 'Full-time', status: 'open', openings: 1, pay: 'KES 300–340 per hour', posted: R.addDays(today, -31), recruiterId: 'u-hr', managerId: 'e15', summary: 'Lead the floor team at our garden restaurant, own the opening and closing checklists and look after guests.', requirements: ['2+ years supervising in hospitality', 'Cash handling and end-of-day reports', 'Calm under pressure'] },
      { id: 'job-pastry-kc', title: 'Pastry Chef', deptId: 'd-kit', locationId: 'loc-kc', type: 'Full-time', status: 'draft', openings: 1, pay: 'To be confirmed', posted: null, recruiterId: 'u-rec', managerId: 'e30', summary: 'Run pastry production for all three outlets.', requirements: ['Laminated doughs and viennoiserie', 'Batch production planning'] },
      { id: 'job-cook-kl', title: 'Line Cook', deptId: 'd-kit', locationId: 'loc-kl', type: 'Full-time', status: 'closed', openings: 1, pay: 'KES 240–260 per hour', posted: R.addDays(curMon, -70), recruiterId: 'u-rec', managerId: 'e15', summary: 'Breakfast and lunch line at the café.', requirements: ['Breakfast service experience'] },
      { id: 'job-host-wl', title: 'Host', deptId: 'd-foh', locationId: 'loc-wl', type: 'Part-time', status: 'paused', openings: 1, pay: 'KES 190 per hour', posted: R.addDays(today, -40), recruiterId: 'u-rec', managerId: 'e01', summary: 'Welcome guests, manage the booking book and seat the floor on weekend evenings.', requirements: ['Friendly and organised', 'Weekend evenings'] }
    ];
    var CN = [
      // first, last, job, stage, daysAgo, source, recruiter, skills, summary, extras
      ['Naomi', 'Chelimo', 'job-cook-wl', 'hired', 19, 'Referral', 'u-rec', ['Grill', 'Sauté', 'Food safety'], '4 years on the line at a hotel restaurant in Nakuru; strong on grill.', { hire: true }],
      ['Joseph', 'Mutinda', 'job-cook-wl', 'offer', 15, 'Careers page', 'u-rec', ['Sauté', 'Prep', 'Stock management'], '3 years at a busy Westlands burger bar.', { interviewDone: 2 }],
      ['Winnie', 'Adhiambo', 'job-cook-wl', 'assessment', 11, 'Job board', 'u-rec', ['Pastry', 'Prep'], 'Culinary diploma, 1 year in a hotel kitchen.', { trial: 2 }],
      ['Elvis', 'Kirui', 'job-cook-wl', 'interview', 8, 'Careers page', 'u-rec', ['Grill', 'Line'], '2 years at a nyama choma restaurant.', { interview: 1 }],
      ['Mary', 'Wangari', 'job-cook-wl', 'screening', 4, 'Job board', 'u-rec', ['Breakfast', 'Line'], 'Breakfast cook at a café chain for 18 months.'],
      ['Brian', 'Ngugi', 'job-cook-wl', 'applied', 1, 'Careers page', 'u-rec', ['Line'], 'Recently finished a culinary certificate.'],
      ['Fatuma', 'Ali', 'job-cook-wl', 'rejected', 17, 'Job board', 'u-rec', ['Prep'], 'Prep experience only.', { reason: 'Not available for evening shifts' }],
      ['Cynthia', 'Moraa', 'job-barista-kl', 'interview', 6, 'Careers page', 'u-rec', ['Latte art', 'Espresso', 'Customer service'], '2 years at a specialty coffee shop in Kilimani.', { interview: 2 }],
      ['Dan', 'Kiptoo', 'job-barista-kl', 'screening', 3, 'Referral', 'u-rec', ['Espresso', 'Cash handling'], 'Barista at a hotel lobby café.'],
      ['Sheila', 'Wekesa', 'job-barista-kl', 'applied', 0, 'Careers page', 'u-rec', ['Espresso'], 'Coffee enthusiast, completed a barista course.'],
      ['Ivy', 'Jeptoo', 'job-barista-kl', 'applied', 2, 'Job board', 'u-rec', ['Latte art'], '1 year as a barista.'],
      ['Hassan', 'Omar', 'job-rider-kc', 'assessment', 7, 'Walk-in', 'u-rec', ['Motorbike licence', 'Nairobi routes'], '3 years delivering for a courier company.', { trial: 1 }],
      ['Moses', 'Langat', 'job-rider-kc', 'interview', 5, 'Referral', 'u-rec', ['Motorbike licence'], 'Boda boda rider for 4 years, knows Industrial Area well.', { interview: 3 }],
      ['Kennedy', 'Otieno', 'job-rider-kc', 'screening', 4, 'Careers page', 'u-rec', ['Motorbike licence', 'Smartphone navigation'], 'Delivery rider for a grocery app.'],
      ['Salim', 'Mohamed', 'job-rider-kc', 'applied', 1, 'Walk-in', 'u-rec', ['Motorbike licence'], 'Looking for weekend work.'],
      ['Peter', 'Macharia', 'job-rider-kc', 'applied', 0, 'Careers page', 'u-rec', [], 'No delivery experience yet; has a licence.'],
      ['Lucy', 'Njoki', 'job-rider-kc', 'rejected', 6, 'Job board', 'u-rec', [], 'No licence.', { reason: 'Doesn’t hold a motorcycle licence' }],
      ['Rachel', 'Owino', 'job-sup-kr', 'offer', 20, 'Referral', 'u-hr', ['Team leadership', 'Cash handling', 'POS'], 'Supervisor at a lakeside resort for 3 years.', { interviewDone: 2 }],
      ['Samuel', 'Kipchumba', 'job-sup-kr', 'interview', 12, 'Job board', 'u-hr', ['Team leadership', 'Inventory'], 'Assistant manager at a fast-casual restaurant.', { interview: 1 }],
      ['Gladys', 'Mumbi', 'job-sup-kr', 'rejected', 25, 'Careers page', 'u-hr', ['Customer service'], 'Senior server, no supervisory experience.', { reason: 'Looking for more supervisory experience' }],
      ['Anthony', 'Kiprop', 'job-host-wl', 'screening', 21, 'Careers page', 'u-rec', ['Reservations'], 'Front desk at a guest house.'],
      ['Sharon', 'Atieno', 'job-cook-kl', 'hired', 55, 'Job board', 'u-rec', ['Breakfast', 'Line'], 'Hired as Line Cook at Kilimani.', { hiredEmp: 'e20' }]
    ];
    var stageOrder = org.hiring.stages.map(function (s) { return s.id; });
    var candidates = CN.map(function (c, i) {
      var applied = R.addDays(today, -c[4]), x = c[9] || {};
      var cd = { id: 'cand-' + (i + 1), first: c[0], last: c[1], jobId: c[2], stage: c[3], appliedAt: applied + 'T' + R.pad(8 + i % 10) + ':' + R.pad((i * 13) % 60), source: c[5], recruiterId: c[6], skills: c[7], summary: c[8], email: (c[0] + '.' + c[1]).toLowerCase() + '@mail.example', phone: '+254 000 400 ' + (100 + i), resume: { name: c[0] + '-' + c[1] + '-CV.pdf', size: 84000 + i * 3100, demo: true }, interviews: [], notes: [], rating: c[3] === 'applied' ? 0 : 2 + (i % 4), reason: x.reason || '', employeeId: x.hiredEmp || null, starred: false };
      var stIdx = stageOrder.indexOf(c[3]), path = c[3] === 'rejected' ? ['applied', 'screening'] : stageOrder.slice(0, stIdx + 1).filter(function (s) { return s !== 'rejected'; });
      if (c[3] === 'rejected') path.push('rejected');
      var t = R.epochDay(applied) * 1440 + 9 * 60;
      for (var j = 1; j < path.length; j++) {
        t += 1440 * Math.max(1, Math.floor(c[4] / path.length));
        if (t > nowAbs) t = nowAbs - (path.length - j) * 120;
        audit.push({ id: id('au'), at: R.fromAbs(t), by: c[6], entity: 'candidate', entityId: cd.id, action: 'stage', from: path[j - 1], to: path[j], text: 'Moved ' + c[0] + ' ' + c[1] + ' to ' + org.hiring.stages[stageOrder.indexOf(path[j])].name, reason: path[j] === 'rejected' ? x.reason : '' });
      }
      if (x.interview) { var idt = R.addDays(today, x.interview); cd.interviews.push({ id: id('iv'), date: idt, time: ['10:00', '11:30', '14:00'][i % 3], type: 'In person', with: c[6] === 'u-hr' ? 'Faith Njeri, Amina Hassan' : 'Lilian Wambui', location: 'Central Kitchen office', outcome: '', notes: '' }); }
      if (x.interviewDone) { cd.interviews.push({ id: id('iv'), date: R.addDays(today, -Math.max(2, c[4] - 6)), time: '11:00', type: 'In person', with: 'Lilian Wambui', location: 'Westlands', outcome: 'Strong', notes: 'Good knife skills and calm under pressure. Happy with the evening rota.' }); }
      if (x.trial) { cd.interviews.push({ id: id('iv'), date: R.addDays(today, x.trial), time: '15:00', type: 'Trial shift', with: c[2] === 'job-rider-kc' ? 'Martin Ndirangu' : 'Joyce Wambugu', location: c[2] === 'job-rider-kc' ? 'Central Kitchen' : 'Westlands kitchen', outcome: '', notes: '' }); }
      if (c[3] !== 'applied') cd.notes.push({ id: id('nt'), at: R.addDays(applied, 1) + 'T09:40', by: c[6], text: ['Phone screen done. Available immediately, expects the advertised rate.', 'Good references from previous employer.', 'Lives close to the location, flexible with weekends.', 'Asked about growth into a senior role.'][i % 4] });
      return cd;
    });
    // the accepted offer becomes an onboarding employee starting next Monday
    var naomi = candidates[0], nStart = R.addDays(curMon, 7);
    var ne = { id: 'e43', first: 'Naomi', last: 'Chelimo', jobRoleId: 'jr-cook', deptId: 'd-kit', locationId: 'loc-wl', locationIds: ['loc-wl'], skills: ['jr-cook', 'jr-prep'], teamId: 't-wl-kit', managerId: 'e01', status: 'onboarding', type: 'Full-time', payType: 'hourly', rate: 260, salary: 0, allowance: 0, otEligible: true, payMethod: 'Bank transfer', start: nStart, end: null, workEmail: 'naomi.chelimo@kijanihearth.example', workPhone: '+254 000 100 143', personal: { email: naomi.email, phone: naomi.phone, dob: '1997-04-18', idLast4: '5521', address: 'Lavington, Nairobi', emergency: { name: 'Ruth Chelimo', relation: 'Parent', phone: '+254 000 300 143' } }, slots: null, pattern: null, docs: [], notes: '',
      onboarding: [{ task: 'Signed employment contract', done: true }, { task: 'ID and tax PIN copies received', done: true }, { task: 'Bank details captured by payroll', done: false }, { task: 'Food handler’s certificate checked', done: true }, { task: 'Uniform and locker assigned', done: false }, { task: 'First-week shifts scheduled', done: true }] };
    employees.push(ne); E.e43 = ne; naomi.employeeId = 'e43';
    [['07:00', '15:00', 1], ['07:00', '15:00', 2], ['15:00', '23:00', 4], ['15:00', '23:00', 5], ['07:00', '15:00', 6]].forEach(function (x) { addShift({ employeeId: 'e43', date: R.addDays(nStart, x[2] - 1), start: x[0], end: x[1], jobRoleId: 'jr-cook', locationId: 'loc-wl', status: 'draft', notes: x[2] === 1 ? 'First day: shadow Kevin' : '' }); });
    audit.push({ id: id('au'), at: ago(2 * 1440 + 300), by: 'u-hr', entity: 'employee', entityId: 'e43', empId: 'e43', locationId: 'loc-wl', action: 'created', text: 'Created an employee record for Naomi Chelimo from her accepted offer' });
    E.e20.onboarding = [{ task: 'Signed employment contract', done: true }, { task: 'ID and tax PIN copies received', done: true }, { task: 'Bank details captured by payroll', done: true }, { task: 'Food handler’s certificate checked', done: true }];
    E.e42.notes = 'Resigned to relocate to Mombasa. Final pay processed.';
    // documents (metadata only for seeded people)
    employees.forEach(function (e, i) {
      if (e.status === 'terminated') return;
      e.docs.push({ id: id('doc'), name: 'Employment contract.pdf', kind: 'Contract', size: 182000 + i * 911, at: e.start + 'T09:00', by: 'u-hr', demo: true });
      if (e.deptId === 'd-kit') e.docs.push({ id: id('doc'), name: 'Food handler certificate.pdf', kind: 'Certificate', size: 96000 + i * 377, at: e.start + 'T09:05', by: 'u-hr', demo: true, expires: R.addDays(today, 40 + i * 9) });
      if (e.deptId === 'd-del') e.docs.push({ id: id('doc'), name: 'Motorcycle licence.pdf', kind: 'Licence', size: 71000 + i * 211, at: e.start + 'T09:05', by: 'u-hr', demo: true, expires: R.addDays(today, i === 34 ? 18 : 300) });
    });

    // ---------- audit: schedule activity ----------
    var publishedAt = R.fromAbs(R.epochDay(R.addDays(curMon, -4)) * 1440 + 16 * 60);
    ['loc-wl', 'loc-kl', 'loc-kr', 'loc-kc'].forEach(function (l, i) {
      audit.push({ id: id('au'), at: R.fromAbs(R.abs(publishedAt) + i * 7), by: l === 'loc-wl' ? 'u-wl' : l === 'loc-kc' ? 'u-kc' : 'u-kl', entity: 'schedule', entityId: l, locationId: l, action: 'published', text: 'Published the week of ' + curMon + ' at ' + LOCATIONS[i].name });
    });
    shifts.filter(function (s) { return !s.employeeId && s.date >= curMon; }).forEach(function (s, i) {
      audit.push({ id: id('au'), at: ago(1440 * (i % 3) + 60 * (i + 2)), by: s.locationId === 'loc-wl' ? 'u-wl' : s.locationId === 'loc-kc' ? 'u-kc' : 'u-kl', entity: 'shift', entityId: s.id, locationId: s.locationId, action: 'created', text: 'Added an open ' + ROLES.filter(function (r) { return r.id === s.jobRoleId; })[0].name + ' shift on ' + s.date + ' ' + s.start + '–' + s.end });
    });
    leave.filter(function (l) { return l.status === 'approved' || l.status === 'declined'; }).forEach(function (l) {
      audit.push({ id: id('au'), at: l.decidedAt, by: l.decidedBy, entity: 'leave', entityId: l.id, empId: l.employeeId, locationId: E[l.employeeId].locationId, action: l.status, text: (l.status === 'approved' ? 'Approved ' : 'Declined ') + E[l.employeeId].first + ' ' + E[l.employeeId].last + '’s ' + leaveTypes.filter(function (t) { return t.id === l.typeId; })[0].name.toLowerCase(), reason: l.reason });
    });
    leave.forEach(function (l) { audit.push({ id: id('au'), at: l.createdAt, by: (users.filter(function (u) { return u.employeeId === l.employeeId; })[0] || {}).id || null, empId: l.employeeId, entity: 'leave', entityId: l.id, locationId: E[l.employeeId].locationId, action: 'requested', text: E[l.employeeId].first + ' ' + E[l.employeeId].last + ' requested ' + leaveTypes.filter(function (t) { return t.id === l.typeId; })[0].name.toLowerCase() + ' (' + l.days + ' day' + (l.days === 1 ? '' : 's') + ')' }); });
    periods.forEach(function (p) { p.history.forEach(function (h) { audit.push({ id: id('au'), at: h.at, by: h.by, entity: 'payroll', entityId: p.id, action: h.action.toLowerCase().replace(/ .*/, ''), text: h.action + ' for ' + p.start + ' to ' + p.end }); }); });
    candidates.forEach(function (c) { if (c.stage === 'applied' && R.epochDay(c.appliedAt.slice(0, 10)) >= R.epochDay(today) - 2) audit.push({ id: id('au'), at: c.appliedAt, by: null, entity: 'candidate', entityId: c.id, action: 'applied', text: c.first + ' ' + c.last + ' applied for ' + jobs.filter(function (j) { return j.id === c.jobId; })[0].title }); });
    audit = audit.filter(function (a) { return a.at && R.abs(a.at) <= nowAbs; }).sort(function (a, b) { return a.at < b.at ? 1 : -1; });

    // ---------- notifications (each one points at a record that exists) ----------
    var notifications = [];
    function N(userIds, kind, icon, title, body, link, mins, cat) { notifications.push({ id: id('n'), at: ago(mins), userIds: userIds, read: false, kind: kind, icon: icon, title: title, body: body, link: link, cat: cat }); }
    function approversFor(locId) { return users.filter(function (u) { return policy.has(u, 'timeoff.approve', locId); }).map(function (u) { return u.id; }); }
    leave.filter(function (l) { return l.status === 'pending'; }).forEach(function (l) {
      var e = E[l.employeeId];
      N(approversFor(e.locationId), 'info', 'plane', 'Time-off request from ' + e.first + ' ' + e.last, leaveTypes.filter(function (t) { return t.id === l.typeId; })[0].name + ', ' + l.days + ' day' + (l.days === 1 ? '' : 's') + ' from ' + l.start, '#/time-off?req=' + l.id, Math.max(5, Math.round((nowAbs - R.abs(l.createdAt)))), 'timeoff');
    });
    var openThisWeek = shifts.filter(function (s) { return !s.employeeId && s.date >= today && s.date <= R.addDays(curMon, 6); });
    if (openThisWeek.length) N(users.filter(function (u) { return policy.has(u, 'schedule.edit'); }).map(function (u) { return u.id; }), 'warn', 'alert', openThisWeek.length + ' open shift' + (openThisWeek.length > 1 ? 's' : '') + ' this week', 'Unassigned shifts still need someone. Open the schedule to fill them.', '#/schedule?filter=open', 95, 'schedule');
    if (notInId) { var nsh = shifts.filter(function (s) { return s.id === notInId; })[0], ne2 = E[nsh.employeeId]; N(users.filter(function (u) { return policy.has(u, 'attendance.view', nsh.locationId) && u.role !== 'payroll' && u.role !== 'hr'; }).map(function (u) { return u.id; }), 'warn', 'clock', ne2.first + ' ' + ne2.last + ' hasn’t clocked in', 'Shift started at ' + nsh.start + ' at ' + LOCATIONS.filter(function (l) { return l.id === nsh.locationId; })[0].name, '#/attendance?date=' + today + '&exc=missed_in', Math.max(3, nowAbs - R.span(nsh).s - 6), 'attendance'); }
    var newApps = candidates.filter(function (c) { return c.stage === 'applied' && c.appliedAt.slice(0, 10) >= R.addDays(today, -1); });
    newApps.forEach(function (c) { N(['u-rec', 'u-hr'], 'info', 'user', 'New application: ' + c.first + ' ' + c.last, jobs.filter(function (j) { return j.id === c.jobId; })[0].title + ' · ' + LOCATIONS.filter(function (l) { return l.id === jobs.filter(function (j) { return j.id === c.jobId; })[0].locationId; })[0].name, '#/hiring/c/' + c.id, Math.max(10, nowAbs - R.abs(c.appliedAt)), 'hiring'); });
    N(users.filter(function (u) { return policy.has(u, 'payroll.run'); }).map(function (u) { return u.id; }), 'info', 'wallet', 'Pay period ' + P1.start + ' to ' + P1.end + ' has ended', 'Review timesheets, then calculate payroll before ' + R.addDays(P1.payDate, -org.payroll.approvalLeadDays) + '.', '#/payroll/' + P1.id, Math.max(30, nowAbs - (R.epochDay(R.addDays(P1.end, 1)) * 1440 + 7 * 60)), 'payroll');
    notifications.sort(function (a, b) { return a.at < b.at ? 1 : -1; });
    // the older ones have been read
    notifications.forEach(function (n) { n.readBy = R.abs(n.at) < nowAbs - 3 * 1440 ? n.userIds.slice() : []; delete n.read; });

    employees.forEach(function (e) { delete e.slots; delete e.pattern; });
    return {
      v: 1, meta: { seededOn: today, seededAt: R.fromAbs(nowAbs), dirty: false },
      org: org, locations: LOCATIONS.map(function (l) { return JSON.parse(JSON.stringify(l)); }), departments: DEPTS.slice(), jobRoles: ROLES.map(function (r) { return { id: r.id, name: r.name, deptId: r.deptId, rate: r.rate }; }), teams: teams,
      employees: employees, users: users, currentUserId: 'u-owner',
      shifts: shifts, requirements: requirements, entries: entries, leaveTypes: leaveTypes, leave: leave,
      jobs: jobs, candidates: candidates, periods: periods, notifications: notifications, audit: audit
    };
  }
  return seed;
});
