/* ============================================================
   C-Ledger — template workspace generator
   Builds a fictional company's last 12 months by running real operations
   through the engine (issue invoice, record receipt, post bill …), so every
   figure in the template is derived from posted, balanced journal entries.
   Deterministic: the same "today" always gives the same workspace.
   ============================================================ */
(function (root) {
  'use strict';
  var CL = (typeof module !== 'undefined' && module.exports) ? require('./engine.js') : root.CL;
  var iso = CL.iso, addDays = CL.addDays, pad = CL.pad;

  function rng(seed) { var s = seed >>> 0; return function () { s += 0x6D2B79F5; var t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var KES = function (n) { return Math.round(n * 100); };

  var TEAM = [
    { id: 'u1', name: 'Wanjiku Mwangi', role: 'owner', title: 'Managing Director', email: 'wanjiku@kilele.example', initials: 'WM', tone: 'g' },
    { id: 'u2', name: 'David Otieno', role: 'accountant', title: 'Senior Accountant', email: 'david@kilele.example', initials: 'DO', tone: 'b' },
    { id: 'u3', name: 'Faith Njeri', role: 'finance_manager', title: 'Finance Manager', email: 'faith@kilele.example', initials: 'FN', tone: 'p' },
    { id: 'u4', name: 'Brian Kiprop', role: 'bookkeeper', title: 'Bookkeeper', email: 'brian@kilele.example', initials: 'BK', tone: 'a' },
    { id: 'u5', name: 'Amina Hassan', role: 'approver', title: 'Operations Director', email: 'amina@kilele.example', initials: 'AH', tone: 'r' },
    { id: 'u6', name: 'Kevin Mutua', role: 'viewer', title: 'External auditor', email: 'kevin@audit.example', initials: 'KM', tone: 'n' }
  ];

  var ACCOUNTS = [
    ['1000', 'Petty Cash', 'asset', 'cash', 'Cash float kept at the studio for small purchases.'],
    ['1010', 'Operating Account', 'asset', 'bank', 'Main current account for receipts and supplier payments (template account — fictional).'],
    ['1020', 'Reserve Savings Account', 'asset', 'bank', 'Interest-earning reserve (template account — fictional).'],
    ['1030', 'Mobile Money Float', 'asset', 'bank', 'Business till float for customer mobile payments (template — fictional).'],
    ['1100', 'Accounts Receivable', 'asset', 'ar', 'Amounts owed by customers on issued invoices. Control account.'],
    ['1200', 'Inventory — Materials', 'asset', 'inventory', 'Finishing materials held for fit-out projects.'],
    ['1250', 'Prepayments', 'asset', 'current', 'Expenses paid in advance.'],
    ['1500', 'Office Equipment', 'asset', 'fixed', 'Computers, plotters and studio equipment.'],
    ['1510', 'Furniture & Fittings', 'asset', 'fixed', 'Studio furniture and showroom fittings.'],
    ['1520', 'Motor Vehicle', 'asset', 'fixed', 'Site van.'],
    ['1590', 'Accumulated Depreciation', 'asset', 'fixed', 'Contra-asset: depreciation charged to date (credit balance).'],
    ['2000', 'Accounts Payable', 'liability', 'ap', 'Amounts owed to suppliers on posted bills. Control account.'],
    ['2100', 'Tax Payable — VAT', 'liability', 'tax', 'Output VAT less input VAT. Paid monthly.'],
    ['2150', 'PAYE & Statutory Deductions', 'liability', 'statutory', 'Payroll deductions withheld and due for remittance.'],
    ['2200', 'Customer Credits', 'liability', 'custcredit', 'Customer overpayments held on account.'],
    ['2300', 'Accrued Expenses', 'liability', 'current', 'Expenses incurred but not yet billed.'],
    ['2500', 'Loans Payable', 'liability', 'loan', 'Equipment term loan (template — fictional lender).'],
    ['3000', "Owner's Capital", 'equity', 'capital', 'Capital contributed by the owners.'],
    ['3100', 'Retained Earnings', 'equity', 'retained', 'Accumulated profits from earlier years.'],
    ['4000', 'Service Revenue — Design', 'income', 'revenue', 'Interior design and consultancy fees.'],
    ['4100', 'Sales Revenue — Fit-out Works', 'income', 'revenue', 'Fit-out and installation contracts.'],
    ['4200', 'Sales Revenue — Furniture', 'income', 'revenue', 'Furniture and décor supplied to clients.'],
    ['4900', 'Other Income', 'income', 'other', 'Interest and sundry income.'],
    ['5000', 'Materials & Subcontractors', 'expense', 'cogs', 'Direct costs of fit-out and furniture jobs.'],
    ['6000', 'Rent', 'expense', 'opex', 'Studio and workshop rent.'],
    ['6100', 'Salaries & Wages', 'expense', 'payroll', 'Gross salaries.'],
    ['6200', 'Utilities', 'expense', 'opex', 'Electricity, water and internet.'],
    ['6300', 'Transport & Fuel', 'expense', 'opex', 'Site visits, fuel and deliveries.'],
    ['6400', 'Marketing', 'expense', 'opex', 'Advertising, print and photography.'],
    ['6500', 'Bank Charges', 'expense', 'opex', 'Bank and mobile money fees.'],
    ['6600', 'Software & Subscriptions', 'expense', 'opex', 'Design software and cloud tools.'],
    ['6700', 'Professional Fees', 'expense', 'opex', 'Legal, audit and advisory fees.'],
    ['6800', 'Office Supplies', 'expense', 'opex', 'Stationery, samples and consumables.'],
    ['6900', 'Depreciation', 'expense', 'opex', 'Monthly depreciation of fixed assets.'],
    ['6950', 'Loan Interest', 'expense', 'opex', 'Interest on the equipment loan.'],
    ['6990', 'Repairs & Maintenance', 'expense', 'opex', 'Studio and vehicle repairs.']
  ];

  var CUSTOMERS = [
    ['Amani Boutique Hotel', 'Grace Achieng', 'Westlands, Nairobi', 30, 0.9],
    ['Baraka Dental Clinic', 'Dr. Peter Kamau', 'Kilimani, Nairobi', 30, 0.95],
    ['Jacaranda Co-working', 'Lucy Wairimu', 'Upper Hill, Nairobi', 14, 0.85],
    ['Kifaru Logistics Ltd', 'Samuel Odhiambo', 'Industrial Area, Nairobi', 30, 0.7],
    ['Lakeview Apartments Management', 'Ruth Chebet', 'Naivasha', 30, 0.8],
    ['Mvua Café & Bakery', 'Joseph Mutiso', 'Karen, Nairobi', 14, 0.9],
    ['Nyota Academy', 'Mary Wambui', 'Ruiru', 30, 0.75],
    ['Pwani Homes Ltd', 'Ali Abdalla', 'Nyali, Mombasa', 45, 0.6],
    ['Sokoni Fresh Markets', 'Esther Moraa', 'Kileleshwa, Nairobi', 30, 0.85],
    ['Tausi Wellness Spa', 'Naomi Atieno', 'Lavington, Nairobi', 30, 0.95],
    ['Umoja Family Clinic', 'Dr. James Kiprono', 'Eastleigh, Nairobi', 30, 0.8],
    ['Zuri Fashion House', 'Wendy Nyambura', 'Gigiri, Nairobi', 14, 0.9],
    ['Ndege Travel Ltd', 'Collins Were', 'CBD, Nairobi', 30, 0.85],
    ['Twiga Capital Advisors', 'Irene Kariuki', 'Riverside, Nairobi', 30, 1]
  ];
  var SUPPLIERS = [
    ['Upande Properties', 'Lease office', 'Westlands, Nairobi', 7, 'rent'],
    ['City Utilities Co.', 'Billing desk', 'Nairobi', 14, 'utilities'],
    ['Mahogany Timber Yard', 'Peter Ndungu', 'Industrial Area, Nairobi', 30, 'materials'],
    ['Brightline Electricals', 'Hassan Omar', 'Ngara, Nairobi', 30, 'materials'],
    ['Savanna Paints Ltd', 'Sales office', 'Mombasa Road, Nairobi', 30, 'materials'],
    ['Glassworks & Mirrors', 'Daniel Kimani', 'Kariobangi, Nairobi', 30, 'materials'],
    ['Kazi Office Supplies', 'Accounts', 'CBD, Nairobi', 14, 'supplies'],
    ['Pixel & Print Studio', 'Rose Akinyi', 'Kilimani, Nairobi', 14, 'marketing'],
    ['CloudDesk Software', 'Billing', 'Online', 7, 'software'],
    ['Otieno & Partners Advocates', 'Accounts', 'Upper Hill, Nairobi', 30, 'professional'],
    ['SwiftMoves Couriers', 'Dispatch', 'Industrial Area, Nairobi', 14, 'transport'],
    ['Techhub Computers', 'Sales', 'Moi Avenue, Nairobi', 30, 'equipment']
  ];

  function seed(todayStr) {
    var T = todayStr || iso(new Date()), R = rng(20261023);
    var rnd = function (a, b) { return a + R() * (b - a); }, pick = function (arr) { return arr[Math.floor(R() * arr.length)]; }, chance = function (p) { return R() < p; };
    var tDate = new Date(T + 'T00:00:00');
    var start = new Date(tDate.getFullYear(), tDate.getMonth() - 11, 1), startStr = iso(start);

    var S = {
      v: 1, rev: 0, seededFor: T, seq: {},
      settings: {
        company: { name: 'Kilele Design Studio Ltd', short: 'Kilele Design', pin: 'P05XXXXXXXX (template)', email: 'accounts@kilele.example', phone: '+254 700 000 123', address: '4th Floor, Fictional Plaza, Westlands, Nairobi', initials: 'KD', website: 'kilele.example', bankNote: 'Operating Account — template details only' },
        currency: 'KES', fyStartMonth: 1, dateFormat: 'd MMM yyyy', numberFormat: '1,234.56', theme: 'forest', weekStart: 'mon',
        taxRates: [{ id: 'vat16', name: 'VAT 16%', rate: 16 }, { id: 'zero', name: 'Zero-rated 0%', rate: 0 }, { id: 'exempt', name: 'Exempt', rate: 0 }, { id: 'none', name: 'No tax', rate: 0 }],
        numbering: { journal: { prefix: 'JE-', next: 1, pad: 4 }, invoice: { prefix: 'INV-', next: 1041, pad: 4 }, receipt: { prefix: 'RCT-', next: 1, pad: 4 }, bill: { prefix: 'BILL-', next: 1, pad: 4 }, payment: { prefix: 'PAY-', next: 1, pad: 4 }, expense: { prefix: 'EXP-', next: 1, pad: 4 }, transfer: { prefix: 'TRF-', next: 1, pad: 4 }, customer: { prefix: 'CUS-', next: 1, pad: 3 }, supplier: { prefix: 'SUP-', next: 1, pad: 3 } },
        defaults: {}, invoice: { terms: 30, footer: 'Thank you for your business. Payment details are on file with your accounts team (template).', accent: true },
        ageing: [30, 60, 90], notifications: { overdue: true, billsDue: true, reconciliation: true, weekly: false }, decimals: 2
      },
      accounts: [], contacts: [], journals: [], invoices: [], receipts: [], bills: [], payments: [], expenses: [], transfers: [], recs: [], recLines: {}, periods: [], audit: [], opKeys: {},
      team: TEAM.map(function (u) { return Object.assign({ status: u.role === 'viewer' ? 'invited' : 'active', lastActive: null }, u); }),
      me: 'u1'
    };

    // periods: from the first seeded month to the end of the current financial year
    var pm = new Date(start), fyEnd = new Date(tDate.getFullYear(), 11, 31);
    while (pm <= fyEnd) { var k = pm.getFullYear() + '-' + pad(pm.getMonth() + 1, 2); S.periods.push({ key: k, label: pm.toLocaleString('en-GB', { month: 'long', year: 'numeric' }), status: 'open' }); pm = new Date(pm.getFullYear(), pm.getMonth() + 1, 1); }

    var clockDate = startStr, clockTime = 9 * 60, who = TEAM[1];
    var E = CL.Engine(S, { today: function () { return clockDate < T ? clockDate : T; }, now: function () { var m = clockTime; return clockDate + 'T' + pad(Math.floor(m / 60) % 24, 2) + ':' + pad(m % 60, 2) + ':00'; }, actor: function () { return who; } });
    function at(date, u, minutes) { clockDate = date; clockTime = minutes != null ? minutes : 8 * 60 + Math.floor(R() * 9 * 60); who = u || TEAM[1]; }

    ACCOUNTS.forEach(function (a, i) { S.accounts.push({ id: 'a' + a[0], code: a[0], name: a[1], type: a[2], sub: a[3], parentId: null, desc: a[4], status: 'active', system: ['ar', 'ap', 'tax', 'custcredit'].indexOf(a[3]) >= 0 }); });
    var A = function (code) { return 'a' + code; };
    S.settings.defaults = { ar: A('1100'), ap: A('2000'), vat: A('2100'), custCredit: A('2200'), bank: A('1010'), revenue: A('4000'), expense: A('6800'), retained: A('3100') };
    S.rev++;

    at(startStr, TEAM[1], 8 * 60);
    CUSTOMERS.forEach(function (c, i) { var slug = c[0].toLowerCase().replace(/[^a-z]+/g, '').slice(0, 14); var x = E.saveContact({ sys: true, kind: 'customer', name: c[0], contact: c[1], address: c[2], terms: c[3], email: 'accounts@' + slug + '.example', phone: '+254 7' + pad(10 + i * 7, 2) + ' 000 ' + pad(100 + i * 37, 3), notes: i === 7 ? 'Slow payer — call before the due date.' : '' }); x.reliability = c[4]; x.since = addDays(startStr, -Math.floor(rnd(60, 900))); });
    SUPPLIERS.forEach(function (c, i) { var slug = c[0].toLowerCase().replace(/[^a-z]+/g, '').slice(0, 14); var x = E.saveContact({ sys: true, kind: 'supplier', name: c[0], contact: c[1], address: c[2], terms: c[3], email: 'billing@' + slug + '.example', phone: '+254 7' + pad(20 + i * 5, 2) + ' 111 ' + pad(200 + i * 41, 3) }); x.category = c[4]; x.since = addDays(startStr, -Math.floor(rnd(60, 900))); });
    var cust = S.contacts.filter(function (c) { return c.kind === 'customer'; }), sup = {}; S.contacts.filter(function (c) { return c.kind === 'supplier'; }).forEach(function (s) { (sup[s.category] = sup[s.category] || []).push(s); });

    // opening balances (carried in from the previous year's books)
    var ob = [['1010', 4200000], ['1020', 2500000], ['1000', 30000], ['1030', 150000], ['1200', 650000], ['1500', 1800000], ['1510', 1200000], ['1520', 3400000], ['1590', -1150000], ['2500', -3000000], ['3000', -5000000]];
    var obLines = ob.map(function (o) { return { accountId: A(o[0]), debit: o[1] > 0 ? KES(o[1]) : 0, credit: o[1] < 0 ? KES(-o[1]) : 0, memo: 'Opening balance' }; });
    var obD = CL.sum(obLines, function (l) { return l.debit; }), obC = CL.sum(obLines, function (l) { return l.credit; });
    obLines.push({ accountId: A('3100'), debit: 0, credit: obD - obC, memo: 'Opening retained earnings' });
    var jOB = E.saveJournal({ date: startStr, desc: 'Opening balances brought forward', kind: 'opening', lines: obLines, notes: 'Balances carried forward from the previous system at ' + startStr + '.' }); E.post(jOB.id);
    // opening bank balances are the starting point of the first statement, so they count as reconciled
    jOB.lines.forEach(function (l, i) { var ac = E.account(l.accountId); if (ac.sub === 'bank' || ac.sub === 'cash') S.recLines[jOB.id + ':' + i] = 'opening'; });

    var loan = KES(3000000), events = [];
    function journal(date, desc, kind, lines, u) { at(date, u || TEAM[1]); var j = E.saveJournal({ date: date, desc: desc, kind: kind, lines: lines }); E.post(j.id); return j; }
    function dr(code, amt, memo) { return { accountId: A(code), debit: amt, credit: 0, memo: memo || '' }; }
    function cr(code, amt, memo) { return { accountId: A(code), debit: 0, credit: amt, memo: memo || '' }; }
    function clampDay(y, m, d) { var last = new Date(y, m + 1, 0).getDate(); return iso(new Date(y, m, Math.min(d, last))); }

    var invoicesToPay = [], billsToPay = [];
    for (var mo = 0; mo < 12; mo++) {
      var y = start.getFullYear(), mIdx = start.getMonth() + mo, first = new Date(y, mIdx, 1), Y = first.getFullYear(), M = first.getMonth();
      var mStart = iso(first), mEnd = iso(new Date(Y, M + 1, 0)), isCurrent = mStart <= T && mEnd >= T;
      var season = 1 + 0.18 * Math.sin((M + 2) / 12 * Math.PI * 2) + mo * 0.012;
      var day = function (d) { return clampDay(Y, M, d); };
      var ok = function (d) { return d <= T; };

      // rent bill on the 1st, paid within a week
      if (ok(day(1))) { at(day(1), TEAM[3]); var b = E.saveBill({ sys: true, contactId: sup.rent[0].id, ref: 'UP/' + Y + '/' + pad(M + 1, 2), issue: day(1), due: day(7), desc: 'Studio rent ' + first.toLocaleString('en-GB', { month: 'long' }), lines: [{ desc: 'Studio & workshop rent', accountId: A('6000'), amount: KES(280000), taxId: 'vat16' }] }); at(day(1), TEAM[4]); E.approveBill(b.id); at(day(1), TEAM[1]); E.postBill(b.id); billsToPay.push({ b: b, pay: day(5) }); }
      // software subscription
      if (ok(day(3))) { at(day(3), TEAM[3]); var b2 = E.saveBill({ sys: true, contactId: sup.software[0].id, ref: 'CD-' + (88000 + mo), issue: day(3), due: day(10), desc: 'Design suite licences', lines: [{ desc: 'Design suite — 9 seats', accountId: A('6600'), amount: KES(Math.round(rnd(39000, 46000))), taxId: 'vat16' }] }); at(day(3), TEAM[2]); E.approveBill(b2.id); at(day(3), TEAM[1]); E.postBill(b2.id); billsToPay.push({ b: b2, pay: day(8) }); }

      // customer invoices
      var nInv = Math.round(rnd(5, 8) * (isCurrent ? T.slice(8, 10) / 31 : 1));
      for (var k = 0; k < nInv; k++) {
        var d = day(Math.floor(rnd(2, 27))); if (!ok(d)) continue;
        var c = cust[Math.floor(R() * cust.length)], kind = R(), lines = [];
        if (kind < 0.42) lines.push({ desc: pick(['Concept design & mood boards', 'Space planning and layouts', 'Interior design — detailed drawings', 'Design consultancy (' + Math.round(rnd(6, 20)) + ' hrs)']), accountId: A('4000'), qty: 1, price: KES(Math.round(rnd(120, 620)) * 1000 * season), disc: 0, taxId: 'vat16' });
        else if (kind < 0.8) { lines.push({ desc: pick(['Reception fit-out', 'Office partitioning & ceilings', 'Kitchen joinery installation', 'Showroom fit-out — stage ' + Math.ceil(rnd(1, 3)), 'Treatment room fit-out']), accountId: A('4100'), qty: 1, price: KES(Math.round(rnd(450, 2400)) * 1000 * season), disc: chance(0.25) ? 5 : 0, taxId: 'vat16' }); if (chance(0.5)) lines.push({ desc: 'Project management', accountId: A('4000'), qty: Math.round(rnd(4, 12)), price: KES(9500), disc: 0, taxId: 'vat16' }); }
        else lines.push({ desc: pick(['Lounge chairs — walnut', 'Reception desk — custom', 'Pendant lights', 'Meeting table — 10 seater', 'Bar stools', 'Display shelving']), accountId: A('4200'), qty: Math.round(rnd(2, 12)), price: KES(Math.round(rnd(18, 95)) * 1000), disc: 0, taxId: 'vat16' });
        lines.forEach(function (l) { l.price = Math.round(l.price / 100) * 100; });
        at(d, TEAM[3]); var inv = E.saveInvoice({ sys: true, contactId: c.id, issue: d, due: addDays(d, c.terms), lines: lines, ref: chance(0.4) ? 'PO-' + Math.round(rnd(1000, 9999)) : '' });
        at(d, TEAM[1]); E.issueInvoice(inv.id);
        // payment behaviour
        var lag = Math.round(c.terms * rnd(0.3, 1.25) + (1 - c.reliability) * rnd(5, 45));
        invoicesToPay.push({ inv: inv, c: c, at: addDays(d, lag), partial: chance(0.14) });
        // materials for fit-out and furniture
        if (kind >= 0.42) { var costShare = rnd(0.32, 0.46), net = E.invoiceTotals(inv).net, md = addDays(d, -Math.round(rnd(2, 12))); if (md < mStart) md = mStart; if (ok(md)) { var s = pick(sup.materials); at(md, TEAM[3]); var bm = E.saveBill({ sys: true, contactId: s.id, ref: s.name.slice(0, 3).toUpperCase() + '-' + Math.round(rnd(10000, 99999)), issue: md, due: addDays(md, s.terms), desc: 'Materials for ' + inv.no, lines: [{ desc: pick(['Hardwood & board', 'Electrical fittings', 'Paint & finishes', 'Glass & mirrors', 'Ironmongery']) + ' — ' + c.name, accountId: A('5000'), amount: Math.round(net * costShare / 100) * 100, taxId: 'vat16' }] }); at(md, TEAM[2]); E.approveBill(bm.id); at(md, TEAM[1]); E.postBill(bm.id); billsToPay.push({ b: bm, pay: addDays(md, Math.round(s.terms * rnd(0.6, 1.3))) }); } }
      }

      // utilities, marketing, professional fees, courier
      if (ok(day(12))) { at(day(12), TEAM[3]); var bu = E.saveBill({ sys: true, contactId: sup.utilities[0].id, ref: 'CU-' + Y + pad(M + 1, 2), issue: day(12), due: day(26), desc: 'Power, water and fibre', lines: [{ desc: 'Electricity', accountId: A('6200'), amount: KES(Math.round(rnd(21000, 31000))), taxId: 'vat16' }, { desc: 'Water', accountId: A('6200'), amount: KES(Math.round(rnd(3500, 5200))), taxId: 'exempt' }, { desc: 'Fibre internet', accountId: A('6200'), amount: KES(9900), taxId: 'vat16' }] }); at(day(12), TEAM[2]); E.approveBill(bu.id); at(day(12), TEAM[1]); E.postBill(bu.id); billsToPay.push({ b: bu, pay: day(24) }); }
      if (mo % 2 === 1 && ok(day(16))) { at(day(16), TEAM[3]); var bk = E.saveBill({ sys: true, contactId: sup.marketing[0].id, ref: 'PP-' + Math.round(rnd(300, 900)), issue: day(16), due: day(30), desc: pick(['Project photography', 'Brochure print run', 'Social media campaign']), lines: [{ desc: 'Marketing services', accountId: A('6400'), amount: KES(Math.round(rnd(45, 120)) * 1000), taxId: 'vat16' }] }); at(day(16), TEAM[2]); E.approveBill(bk.id); at(day(16), TEAM[1]); E.postBill(bk.id); billsToPay.push({ b: bk, pay: addDays(day(16), Math.round(rnd(10, 30))) }); }
      if (mo % 3 === 2 && ok(day(20))) { at(day(20), TEAM[3]); var bp = E.saveBill({ sys: true, contactId: sup.professional[0].id, ref: 'OPA/' + Math.round(rnd(100, 400)), issue: day(20), due: addDays(day(20), 30), desc: 'Contract reviews', lines: [{ desc: 'Legal review of client contracts', accountId: A('6700'), amount: KES(Math.round(rnd(60, 140)) * 1000), taxId: 'vat16' }] }); at(day(20), TEAM[2]); E.approveBill(bp.id); at(day(20), TEAM[1]); E.postBill(bp.id); billsToPay.push({ b: bp, pay: addDays(day(20), Math.round(rnd(20, 45))) }); }
      if (ok(day(18))) { at(day(18), TEAM[3]); var bc = E.saveBill({ sys: true, contactId: sup.transport[0].id, ref: 'SM-' + Math.round(rnd(1000, 9999)), issue: day(18), due: addDays(day(18), 14), desc: 'Deliveries to site', lines: [{ desc: 'Furniture & materials deliveries', accountId: A('6300'), amount: KES(Math.round(rnd(14, 38)) * 1000), taxId: 'vat16' }] }); at(day(18), TEAM[2]); E.approveBill(bc.id); at(day(18), TEAM[1]); E.postBill(bc.id); billsToPay.push({ b: bc, pay: addDays(day(18), Math.round(rnd(8, 20))) }); }
      if (mo === 4 && ok(day(9))) { at(day(9), TEAM[3]); var be = E.saveBill({ sys: true, contactId: sup.equipment[0].id, ref: 'TH-55102', issue: day(9), due: addDays(day(9), 30), desc: 'Two design workstations', lines: [{ desc: 'Workstation laptops ×2', accountId: A('1500'), amount: KES(468000), taxId: 'vat16' }] }); at(day(9), TEAM[0]); E.approveBill(be.id); at(day(9), TEAM[1]); E.postBill(be.id); billsToPay.push({ b: be, pay: addDays(day(9), 28) }); }

      // paid-now expenses (fuel, supplies, meals with clients…)
      var nx = Math.round(rnd(5, 9) * (isCurrent ? T.slice(8, 10) / 31 : 1));
      for (var q = 0; q < nx; q++) {
        var xd = day(Math.floor(rnd(1, 28))); if (!ok(xd)) continue;
        var tpl = pick([['Fuel — site van', '6300', 'Petrol station', 'none', 3500, 9000, '1000', 'Cash'], ['Ride to site meeting', '6300', 'Ride-hailing', 'none', 600, 2400, '1030', 'Mobile money'], ['Printing & stationery', '6800', 'Kazi Office Supplies', 'vat16', 2500, 14000, '1010', 'Card'], ['Material samples', '6800', 'Savanna Paints Ltd', 'vat16', 3000, 18000, '1010', 'Card'], ['Van service', '6990', 'Auto garage', 'vat16', 9000, 32000, '1010', 'Card'], ['Client lunch', '6400', 'Restaurant', 'vat16', 4000, 11000, '1010', 'Card'], ['Parking & tolls', '6300', 'County parking', 'none', 300, 1500, '1000', 'Cash'], ['Studio cleaning supplies', '6800', 'Supermarket', 'vat16', 1500, 6000, '1000', 'Cash']]);
        var who2 = chance(0.5) ? TEAM[3] : TEAM[2];
        at(xd, who2); var xe = E.saveExpense({ sys: true, date: xd, payee: tpl[2], desc: tpl[0], accountId: A(tpl[1]), payAccountId: A(tpl[6]), method: tpl[7], amount: KES(Math.round(rnd(tpl[4], tpl[5]) / 10) * 10), taxId: tpl[3], by: who2.name, receipt: chance(0.8) ? { name: 'receipt-' + (q + 1) + '.jpg', size: Math.round(rnd(80, 900)) * 1000 } : null });
        if (!isCurrent || xd < addDays(T, -6)) { at(xd, TEAM[4]); E.approveExpense(xe.id); }
        else { E.submitExpense(xe.id); }
      }

      // loan repayment on the 15th: principal + 1.1% monthly interest
      if (ok(day(15)) && loan > 0) { var interest = Math.round(loan * 0.011 / 100) * 100, principal = Math.min(KES(125000), loan); loan -= principal; journal(day(15), 'Loan repayment — instalment ' + (mo + 1), 'general', [dr('2500', principal, 'Principal'), dr('6950', interest, 'Interest'), cr('1010', principal + interest, 'Loan instalment')]); }
      // statutory remittance for last month's payroll on the 9th
      if (mo > 0 && ok(day(9))) { var st = E.balance(A('2150'), addDays(mStart, -1)); if (st > 0) journal(day(9), 'PAYE, NSSF & SHIF remittance — ' + new Date(Y, M - 1, 1).toLocaleString('en-GB', { month: 'long' }), 'general', [dr('2150', st, 'Statutory remittance'), cr('1010', st, 'KRA & statutory bodies')]); }
      // VAT for last month on the 20th
      if (mo > 0 && ok(day(20))) { var vat = E.balance(A('2100'), addDays(mStart, -1)); if (vat > 0) journal(day(20), 'VAT return — ' + new Date(Y, M - 1, 1).toLocaleString('en-GB', { month: 'long' }) + ' (paid to KRA)', 'general', [dr('2100', vat, 'VAT settled'), cr('1010', vat, 'KRA payment')]); }
      // petty cash top-up & mobile money sweep
      if (ok(day(4))) { var pc = E.balance(A('1000'), day(4)), top = Math.max(0, Math.round((KES(45000) - pc) / 100000) * 100000); if (top >= KES(5000)) { at(day(4), TEAM[1]); E.transfer({ date: day(4), fromId: A('1010'), toId: A('1000'), amount: top, memo: 'Petty cash top-up' }); } }
      if (mo % 4 === 1 && ok(day(26))) { at(day(26), TEAM[0]); E.transfer({ date: day(26), fromId: A('1010'), toId: A('1020'), amount: KES(500000), memo: 'Move to reserve' }); }
      // month-end: payroll, depreciation, bank charges, interest
      if (ok(mEnd) || (isCurrent && false)) {
        var gross = KES(Math.round(1580 + mo * 6) * 1000), statutory = Math.round(gross * 0.226 / 100) * 100;
        journal(day(27), 'Payroll — ' + first.toLocaleString('en-GB', { month: 'long', year: 'numeric' }), 'general', [dr('6100', gross, 'Gross salaries'), cr('1010', gross - statutory, 'Net pay'), cr('2150', statutory, 'PAYE, NSSF, SHIF & housing levy')], TEAM[2]);
        journal(mEnd, 'Depreciation — ' + first.toLocaleString('en-GB', { month: 'long', year: 'numeric' }), 'depreciation', [dr('6900', KES(Math.round(rnd(94, 99)) * 1000), 'Straight-line'), cr('1590', 0, '')].map(function (l, i, arr) { if (i === 1) l.credit = arr[0].debit; return l; }));
        var ch = KES(Math.round(rnd(1800, 3400))); journal(mEnd, 'Bank charges — Operating Account', 'bank', [dr('6500', ch, 'Monthly charges'), cr('1010', ch, 'Bank charges')]);
        var ir = Math.round(E.balance(A('1020'), mEnd) * 0.006 / 100) * 100; if (ir > 0) journal(mEnd, 'Interest earned — Reserve Savings', 'bank', [dr('1020', ir, 'Interest'), cr('4900', ir, 'Interest income')]);
      }
    }

    // receipts & payments, in date order
    invoicesToPay.sort(function (a, b) { return a.at < b.at ? -1 : 1; }).forEach(function (p) {
      if (p.at > T) return; var out = E.invoiceOutstanding(p.inv); if (out <= 0) return;
      var amt = p.partial ? Math.round(out * 0.5 / 100) * 100 : out, acc = chance(0.18) ? A('1030') : A('1010');
      at(p.at, TEAM[3]); E.recordReceipt({ invoiceId: p.inv.id, date: p.at, amount: amt, accountId: acc, method: acc === A('1030') ? 'Mobile money' : pick(['Bank transfer', 'Bank transfer', 'Cheque', 'RTGS']), reference: 'TX' + Math.round(rnd(100000, 999999)) });
      if (p.partial) { var later = addDays(p.at, Math.round(rnd(12, 40))); if (later <= T && chance(0.6)) { at(later, TEAM[3]); E.recordReceipt({ invoiceId: p.inv.id, date: later, amount: E.invoiceOutstanding(p.inv), accountId: A('1010'), method: 'Bank transfer', reference: 'TX' + Math.round(rnd(100000, 999999)) }); } }
    });
    billsToPay.sort(function (a, b) { return a.pay < b.pay ? -1 : 1; }).forEach(function (p) {
      if (p.pay > T || p.pay > addDays(T, -2)) return; var out = E.billOutstanding(p.b); if (out <= 0) return;
      at(p.pay, TEAM[1]); E.payBill({ billId: p.b.id, date: p.pay, amount: out, accountId: A('1010'), method: 'Bank transfer', reference: 'EFT' + Math.round(rnd(10000, 99999)) });
    });

    // mobile money sweeps, after receipts exist (keeps a working float of ~KES 120,000)
    for (var sw = 0; sw < 12; sw++) {
      var sd = iso(new Date(start.getFullYear(), start.getMonth() + sw, 25)); if (sd > addDays(T, -1)) break;
      var mmb = E.balance(A('1030'), sd); if (mmb > KES(250000)) { at(sd, TEAM[1]); E.transfer({ date: sd, fromId: A('1030'), toId: A('1010'), amount: Math.floor((mmb - KES(120000)) / 100000) * 100000, memo: 'Mobile money sweep' }); }
    }

    // last month: an accrual for the audit fee, reversed on the first of this month
    var lmStart = iso(new Date(tDate.getFullYear(), tDate.getMonth() - 1, 1)), lmEnd = addDays(iso(new Date(tDate.getFullYear(), tDate.getMonth(), 1)), -1), cmStart = addDays(lmEnd, 1);
    var acr = journal(lmEnd, 'Accrued audit fee — ' + new Date(lmStart + 'T00:00:00').toLocaleString('en-GB', { month: 'long' }), 'accrual', [dr('6700', KES(85000), 'Audit fee accrual'), cr('2300', KES(85000), 'Accrued — not yet billed')], TEAM[1]);
    at(cmStart, TEAM[1]); E.reverse(acr.id, cmStart, 'Auto-reversal of month-end accrual');
    // a posting error corrected by reversal
    var errD = addDays(lmStart, 13); var wrong = journal(errD, 'Reclassify van service to marketing', 'adjusting', [dr('6400', KES(18500), 'Reclass'), cr('6990', KES(18500), 'Reclass')], TEAM[3]);
    at(addDays(errD, 2), TEAM[1]); E.reverse(wrong.id, addDays(errD, 2), 'Posted in error — the van service was correctly classified');

    // reconciliations: Operating Account each month up to the end of last month; Reserve too
    function reconcileMonth(code, mS, mE) {
      var lines = E.bankLines(A(code), mS, mE); if (!lines.length) return;
      var last = E.lastReconciliation(A(code)), opening = last ? last.closing : E.balance(A(code), addDays(mS, -1)), closing = opening + CL.sum(lines, function (l) { return l.amount; });
      at(addDays(mE, Math.round(rnd(3, 9))), TEAM[3]);
      var r = E.startReconciliation({ accountId: A(code), start: mS, end: mE, opening: opening, closing: closing, lines: lines.map(function (l) { return { date: addDays(l.date, l.kind === 'payment' ? 1 : 0) > mE ? l.date : addDays(l.date, l.kind === 'payment' ? 1 : 0), desc: statementText(l), amount: l.amount }; }) });
      r.lines.forEach(function (s, i) { s.match = lines[i].key; });
      E.completeReconciliation(r.id);
    }
    function statementText(l) {
      var j = E.journal(l.journalId); if (!j) return l.desc;
      var c = j.contactId ? E.contact(j.contactId) : null;
      if (j.kind === 'receipt') return 'INCOMING TRF ' + (c ? c.name.toUpperCase().slice(0, 22) : '') + ' ' + j.ref;
      if (j.kind === 'payment') return 'EFT OUT ' + (c ? c.name.toUpperCase().slice(0, 22) : '') + ' ' + j.ref;
      if (j.kind === 'transfer') return 'INTERNAL TRF ' + j.ref;
      if (j.kind === 'expense') return 'CARD POS ' + (j.lines[j.lines.length - 1].memo || '').toUpperCase().slice(0, 26);
      if (/Payroll/.test(j.desc)) return 'BULK SALARY PAYMENT';
      if (/VAT/.test(j.desc)) return 'KRA iTAX PAYMENT VAT';
      if (/PAYE/.test(j.desc)) return 'KRA iTAX PAYMENT PAYE / STATUTORY';
      if (/Loan/.test(j.desc)) return 'LOAN INSTALMENT DEBIT';
      if (/charges/i.test(j.desc)) return 'LEDGER FEES & CHARGES';
      if (/Interest/.test(j.desc)) return 'CREDIT INTEREST';
      if (j.kind === 'opening') return 'BALANCE B/F';
      return j.desc.toUpperCase().slice(0, 34);
    }
    var mcur = new Date(start); while (true) { var ms = iso(mcur), me = iso(new Date(mcur.getFullYear(), mcur.getMonth() + 1, 0)); if (me > lmEnd) break; reconcileMonth('1010', ms === startStr ? addDays(ms, 1) : ms, me); reconcileMonth('1020', ms === startStr ? addDays(ms, 1) : ms, me); mcur = new Date(mcur.getFullYear(), mcur.getMonth() + 1, 1); }
    // mobile money reconciled only until three months ago (shows as behind on the dashboard)
    mcur = new Date(start); while (true) { var ms2 = iso(mcur), me2 = iso(new Date(mcur.getFullYear(), mcur.getMonth() + 1, 0)); if (me2 > addDays(iso(new Date(tDate.getFullYear(), tDate.getMonth() - 2, 1)), -1)) break; reconcileMonth('1030', ms2 === startStr ? addDays(ms2, 1) : ms2, me2); mcur = new Date(mcur.getFullYear(), mcur.getMonth() + 1, 1); }

    // current month: statement imported, partly matched, with a bank charge not yet in the books
    var curLines = E.bankLines(A('1010'), cmStart, addDays(T, -2));
    if (curLines.length) {
      var lastR = E.lastReconciliation(A('1010')), op = lastR ? lastR.closing : E.balance(A('1010'), lmEnd);
      var stmt = curLines.filter(function (l, i) { return !(l.kind === 'payment' && i === curLines.length - 1); }).map(function (l) { return { date: l.date, desc: statementText(l), amount: l.amount, key: l.key }; });
      var fee = KES(1150); stmt.push({ date: addDays(T, -3) < cmStart ? cmStart : addDays(T, -3), desc: 'RTGS COMMISSION & EXCISE DUTY', amount: -fee });
      stmt.sort(function (a, b) { return a.date < b.date ? -1 : 1; });
      at(addDays(T, -1), TEAM[3]);
      var rc = E.startReconciliation({ accountId: A('1010'), start: cmStart, end: addDays(T, -2) < cmStart ? cmStart : addDays(T, -2), opening: op, closing: op + CL.sum(stmt, function (s) { return s.amount; }), lines: stmt });
      rc.lines.forEach(function (s, i) { if (stmt[i].key && i < Math.ceil(stmt.length * 0.6)) s.match = stmt[i].key; });
    }

    // drafts & pending work for the template
    at(T, TEAM[3]);
    var dInv = E.saveInvoice({ contactId: cust[3].id, issue: T, due: addDays(T, 30), lines: [{ desc: 'Warehouse office fit-out — deposit', accountId: A('4100'), qty: 1, price: KES(850000), disc: 0, taxId: 'vat16' }, { desc: 'Design development', accountId: A('4000'), qty: 1, price: KES(180000), disc: 0, taxId: 'vat16' }], ref: 'PO-7781', notes: 'Deposit of 40% before mobilisation.' });
    var dBill = E.saveBill({ contactId: sup.materials[1].id, ref: 'BRI-40912', issue: addDays(T, -1), due: addDays(T, 29), desc: 'Lighting for Amani Boutique Hotel', lines: [{ desc: 'LED pendants & drivers', accountId: A('5000'), amount: KES(186400), taxId: 'vat16' }] });
    var aBill = E.saveBill({ contactId: sup.supplies[0].id, ref: 'KOS-2291', issue: addDays(T, -2), due: addDays(T, 12), desc: 'Sample boards & stationery', lines: [{ desc: 'Sample boards', accountId: A('6800'), amount: KES(23800), taxId: 'vat16' }] }); at(T, TEAM[4]); E.approveBill(aBill.id);
    at(T, TEAM[1]);
    var dj = E.saveJournal({ date: T, desc: 'Provision for staff bonuses (draft — awaiting MD approval)', kind: 'accrual', lines: [{ accountId: A('6100'), debit: KES(240000), credit: 0, memo: 'Q4 bonus provision' }, { accountId: A('2300'), debit: 0, credit: KES(220000), memo: 'Accrued bonuses' }], notes: 'Amount under discussion — the entry is intentionally unbalanced until agreed.' });
    // expenses waiting for approval, and one sent back
    [[1, 'Site visit — fuel', '6300', 'Petrol station', 'none', 6400, '1000', 'Cash', TEAM[3]], [1, 'Tile samples for Tausi Spa', '6800', 'Savanna Paints Ltd', 'vat16', 8120, '1010', 'Card', TEAM[2]], [2, 'Client lunch — Pwani Homes', '6400', 'Restaurant', 'vat16', 9860, '1010', 'Card', TEAM[0]], [3, 'Courier — drawings to Mombasa', '6300', 'SwiftMoves Couriers', 'vat16', 3480, '1030', 'Mobile money', TEAM[3]], [4, 'Taxi to Gigiri site', '6300', 'Ride-hailing', 'none', 1850, '1030', 'Mobile money', TEAM[3]]].forEach(function (p, i) {
      var dt = addDays(T, -p[0]); if (dt < cmStart) dt = T; at(dt, p[8]);
      var e = E.saveExpense({ date: dt, payee: p[3], desc: p[1], accountId: A(p[2]), payAccountId: A(p[6]), method: p[7], amount: KES(p[5]), taxId: p[4], by: p[8].name, receipt: i === 4 ? null : { name: 'receipt-' + (i + 1) + '.jpg', size: 240000 + i * 61000 } });
      E.submitExpense(e.id);
      if (i === 4) { at(T, TEAM[4]); E.rejectExpense(e.id, 'No receipt attached — please upload it and resubmit.'); }
    });

    // close all periods up to two months ago
    at(addDays(lmStart, 6), TEAM[1]);
    S.periods.forEach(function (p) { if (p.key < lmStart.slice(0, 7)) { E.closePeriod(p.key); } });

    // keep the audit trail to the recent past so the template stays light
    var cut = addDays(T, -75); S.audit = S.audit.filter(function (a) { return a.at.slice(0, 10) >= cut; });
    S.team.forEach(function (u) { var last = S.audit.filter(function (a) { return a.actor.id === u.id; }).pop(); u.lastActive = last ? last.at : null; });
    S.seededAt = T; S.rev++;
    return S;
  }

  var api = { seed: seed, TEAM: TEAM };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.CL = root.CL || {}; root.CL.seed = seed; root.CL.TEAM = TEAM; }
})(typeof window !== 'undefined' ? window : this);
