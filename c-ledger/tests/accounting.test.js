/* C-Ledger accounting rules — run with:  node --test c-ledger/tests/
   Each test starts from a small, known set of transactions so expected
   figures can be worked out by hand. */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const CL = require('../js/engine.js');
const { seed } = require('../js/seed.js');

const TODAY = '2026-03-20';
const owner = { id: 'u1', name: 'Test Owner', role: 'owner' };
let actor = owner;

function blank() {
  const acc = (code, name, type, sub) => ({ id: 'a' + code, code, name, type, sub, parentId: null, desc: '', status: 'active', system: ['ar', 'ap', 'tax', 'custcredit'].includes(sub) });
  const S = {
    v: 1, rev: 0, seq: {}, recLines: {}, opKeys: {}, audit: [], journals: [], invoices: [], receipts: [], bills: [], payments: [], expenses: [], transfers: [], recs: [], contacts: [],
    periods: [{ key: '2026-01', label: 'January 2026', status: 'open' }, { key: '2026-02', label: 'February 2026', status: 'open' }, { key: '2026-03', label: 'March 2026', status: 'open' }],
    settings: { currency: 'KES', fyStartMonth: 1, taxRates: [{ id: 'vat16', name: 'VAT 16%', rate: 16 }, { id: 'none', name: 'No tax', rate: 0 }],
      numbering: { journal: { prefix: 'JE-', next: 1, pad: 4 }, invoice: { prefix: 'INV-', next: 1, pad: 4 }, receipt: { prefix: 'RCT-', next: 1, pad: 4 }, bill: { prefix: 'BILL-', next: 1, pad: 4 }, payment: { prefix: 'PAY-', next: 1, pad: 4 }, expense: { prefix: 'EXP-', next: 1, pad: 4 }, transfer: { prefix: 'TRF-', next: 1, pad: 4 }, customer: { prefix: 'CUS-', next: 1, pad: 3 }, supplier: { prefix: 'SUP-', next: 1, pad: 3 } },
      defaults: { ar: 'a1100', ap: 'a2000', vat: 'a2100', custCredit: 'a2200', bank: 'a1010' } },
    accounts: [acc('1000', 'Cash on Hand', 'asset', 'cash'), acc('1010', 'Bank', 'asset', 'bank'), acc('1020', 'Savings', 'asset', 'bank'), acc('1100', 'Accounts Receivable', 'asset', 'ar'), acc('1500', 'Equipment', 'asset', 'fixed'),
      acc('2000', 'Accounts Payable', 'liability', 'ap'), acc('2100', 'VAT', 'liability', 'tax'), acc('2200', 'Customer Credits', 'liability', 'custcredit'),
      acc('3000', "Owner's Capital", 'equity', 'capital'), acc('3100', 'Retained Earnings', 'equity', 'retained'),
      acc('4000', 'Sales Revenue', 'income', 'revenue'), acc('4100', 'Service Revenue', 'income', 'revenue'),
      acc('6000', 'Rent', 'expense', 'opex'), acc('6300', 'Transport', 'expense', 'opex'), acc('6500', 'Bank Charges', 'expense', 'opex')]
  };
  actor = owner;
  const E = CL.Engine(S, { today: () => TODAY, actor: () => actor });
  return { S, E };
}
const K = n => Math.round(n * 100);
function capital(E, amt = 100000, date = '2026-01-02') { const j = E.saveJournal({ date, desc: 'Capital introduced', lines: [{ accountId: 'a1010', debit: K(amt) }, { accountId: 'a3000', credit: K(amt) }] }); E.post(j.id); return j; }
function customer(E, name = 'Acme Ltd') { return E.saveContact({ kind: 'customer', name }); }
function supplier(E, name = 'Landlord Ltd') { return E.saveContact({ kind: 'supplier', name }); }

test('journal validation: unbalanced, single-line, both sides, negative and fractional amounts are refused', () => {
  const { E } = blank();
  const j = E.saveJournal({ date: '2026-03-01', desc: 'Test', lines: [{ accountId: 'a1010', debit: K(100) }, { accountId: 'a3000', credit: K(90) }] });
  assert.match(E.validate(j).join(' '), /differ by KES 10\.00/);
  assert.throws(() => E.post(j.id), /differ/);
  assert.equal(E.journal(j.id).status, 'draft');
  const one = E.saveJournal({ date: '2026-03-01', desc: 'One line', lines: [{ accountId: 'a1010', debit: K(5) }] });
  assert.match(E.validate(one).join(' '), /at least two lines/);
  const both = E.saveJournal({ date: '2026-03-01', desc: 'Both', lines: [{ accountId: 'a1010', debit: K(5), credit: K(5) }, { accountId: 'a3000', credit: K(5) }] });
  assert.match(E.validate(both).join(' '), /not both/);
  const frac = E.saveJournal({ date: '2026-03-01', desc: 'Frac', lines: [{ accountId: 'a1010', debit: 10.5 }, { accountId: 'a3000', credit: 10.5 }] });
  assert.match(E.validate(frac).join(' '), /at most 2 decimals/);
  const noDesc = E.saveJournal({ date: '2026-03-01', desc: '', lines: [{ accountId: 'a1010', debit: 5 }, { accountId: 'a3000', credit: 5 }] });
  assert.match(E.validate(noDesc).join(' '), /Description is required/);
});

test('drafts do not affect balances; posting does; posted entries cannot be edited', () => {
  const { E } = blank();
  const j = E.saveJournal({ date: '2026-03-01', desc: 'Capital', lines: [{ accountId: 'a1010', debit: K(500) }, { accountId: 'a3000', credit: K(500) }] });
  assert.equal(E.balance('a1010'), 0);
  E.post(j.id);
  assert.equal(E.balance('a1010'), K(500));
  assert.equal(E.balance('a3000'), K(500), 'equity is credit-normal, so a credit increases it');
  assert.throws(() => E.saveJournal({ date: '2026-03-02', desc: 'x', lines: [] }, j.id), /cannot be edited/);
  assert.throws(() => E.post(j.id), /already posted/);
  assert.throws(() => E.deleteDraft(j.id), /Only drafts/);
});

test('debit-normal and credit-normal balances by account type', () => {
  const { E } = blank();
  capital(E, 1000);
  const j = E.saveJournal({ date: '2026-03-03', desc: 'Rent paid', lines: [{ accountId: 'a6000', debit: K(300) }, { accountId: 'a1010', credit: K(300) }] }); E.post(j.id);
  const s = E.saveJournal({ date: '2026-03-04', desc: 'Cash sale', lines: [{ accountId: 'a1000', debit: K(200) }, { accountId: 'a4000', credit: K(200) }] }); E.post(s.id);
  assert.equal(E.balance('a1010'), K(700));   // asset: Dr 1000 − Cr 300
  assert.equal(E.balance('a6000'), K(300));   // expense: debit-normal
  assert.equal(E.balance('a4000'), K(200));   // income: credit-normal, positive
  assert.equal(E.netIncome(null, TODAY), K(-100));
});

test('reversal creates an equal and opposite posted entry, is audited, and cannot be repeated', () => {
  const { S, E } = blank();
  capital(E, 1000);
  const j = E.saveJournal({ date: '2026-03-05', desc: 'Wrong rent', lines: [{ accountId: 'a6000', debit: K(250) }, { accountId: 'a1010', credit: K(250) }] }); E.post(j.id);
  const r = E.reverse(j.id, '2026-03-06', 'Posted in error');
  assert.equal(r.status, 'posted'); assert.equal(r.reverses, j.id); assert.equal(E.journal(j.id).reversedBy, r.id);
  assert.equal(E.balance('a6000'), 0); assert.equal(E.balance('a1010'), K(1000));
  assert.throws(() => E.reverse(j.id), /already been reversed/);
  assert.throws(() => E.reverse(r.id), /itself a reversal/);
  assert.ok(S.audit.some(a => a.action === 'journal.reverse' && a.recordId === j.id));
  assert.throws(() => E.reverse(j.id, '2026-03-01'), /already been reversed/);
});

test('invoice issue posts Dr AR / Cr revenue / Cr VAT; receipts credit AR and never revenue', () => {
  const { S, E } = blank();
  const c = customer(E);
  const inv = E.saveInvoice({ contactId: c.id, issue: '2026-03-01', due: '2026-03-31', lines: [{ desc: 'Design', accountId: 'a4100', qty: 2, price: K(1000), disc: 10, taxId: 'vat16' }, { desc: 'Chairs', accountId: 'a4000', qty: 3, price: K(333.33), disc: 0, taxId: 'vat16' }] });
  const t = E.invoiceTotals(inv);
  // Design: 2 × 1,000 less 10% = 1,800.00 ; Chairs: 3 × 333.33 = 999.99 ; net 2,799.99 ; VAT 288.00 + 160.00 = 448.00
  assert.equal(t.net, K(2799.99)); assert.equal(t.tax, K(448.00)); assert.equal(t.total, K(3247.99)); assert.equal(t.discount, K(200));
  assert.equal(E.balance('a1100'), 0, 'draft invoice has no ledger effect');
  E.issueInvoice(inv.id);
  assert.equal(E.balance('a1100'), K(3247.99));
  assert.equal(E.balance('a4100'), K(1800)); assert.equal(E.balance('a4000'), K(999.99)); assert.equal(E.balance('a2100'), K(448));
  assert.equal(E.invoiceStatus(inv), 'issued');
  E.recordReceipt({ invoiceId: inv.id, date: '2026-03-10', amount: K(1000), accountId: 'a1010' });
  assert.equal(E.invoiceStatus(inv), 'partial'); assert.equal(E.invoiceOutstanding(inv), K(2247.99));
  E.recordReceipt({ invoiceId: inv.id, date: '2026-03-12', amount: K(2247.99), accountId: 'a1010' });
  assert.equal(E.invoiceStatus(inv), 'paid');
  assert.equal(E.balance('a1100'), 0); assert.equal(E.balance('a1010'), K(3247.99));
  assert.equal(E.typeTotal('income'), K(2799.99), 'revenue recognised once, at issue');
  assert.equal(E.customerBalance(c.id), 0);
  assert.equal(S.journals.filter(j => j.kind === 'receipt').length, 2);
});

test('receipts cannot exceed the outstanding balance unless recorded as a customer credit; duplicates are blocked', () => {
  const { E } = blank();
  const c = customer(E);
  const inv = E.saveInvoice({ contactId: c.id, issue: '2026-03-01', due: '2026-03-31', lines: [{ desc: 'Fee', accountId: 'a4100', qty: 1, price: K(1000), taxId: 'none' }] });
  E.issueInvoice(inv.id);
  assert.throws(() => E.recordReceipt({ invoiceId: inv.id, date: '2026-03-05', amount: K(1200), accountId: 'a1010' }), /more than the KES 1,000.00 outstanding/);
  const r = E.recordReceipt({ invoiceId: inv.id, date: '2026-03-05', amount: K(1200), accountId: 'a1010', asCredit: true, key: 'k1' });
  assert.equal(r.applied, K(1000)); assert.equal(r.excess, K(200));
  assert.equal(E.balance('a2200'), K(200)); assert.equal(E.balance('a1100'), 0); assert.equal(E.invoiceStatus(inv), 'paid');
  assert.throws(() => E.recordReceipt({ invoiceId: inv.id, date: '2026-03-05', amount: K(10), accountId: 'a1010', key: 'k1' }), /duplicate submission/);
  assert.throws(() => E.recordReceipt({ invoiceId: inv.id, date: '2026-02-01', amount: K(10), accountId: 'a1010' }), /fully paid|before the invoice/);
});

test('void: issued invoice with no receipts is reversed; with receipts it is refused', () => {
  const { E } = blank();
  const c = customer(E);
  const a = E.saveInvoice({ contactId: c.id, issue: '2026-03-01', due: '2026-03-31', lines: [{ desc: 'Fee', accountId: 'a4100', qty: 1, price: K(500), taxId: 'vat16' }] }); E.issueInvoice(a.id);
  E.voidInvoice(a.id, 'Raised to the wrong customer', '2026-03-02');
  assert.equal(a.status, 'void'); assert.equal(E.balance('a1100'), 0); assert.equal(E.balance('a4100'), 0); assert.equal(E.balance('a2100'), 0);
  const b = E.saveInvoice({ contactId: c.id, issue: '2026-03-01', due: '2026-03-31', lines: [{ desc: 'Fee', accountId: 'a4100', qty: 1, price: K(500), taxId: 'none' }] }); E.issueInvoice(b.id);
  E.recordReceipt({ invoiceId: b.id, date: '2026-03-03', amount: K(100), accountId: 'a1010' });
  assert.throws(() => E.voidInvoice(b.id, 'x'), /receipts recorded/);
  assert.throws(() => E.reverse(b.journalId), /Void or correct it from that document/);
});

test('bills: approval required, Dr expense + VAT / Cr AP; payment Dr AP / Cr bank without duplicating the expense', () => {
  const { E } = blank();
  capital(E, 10000);
  const s = supplier(E);
  const b = E.saveBill({ contactId: s.id, ref: 'R-1', issue: '2026-03-01', due: '2026-03-10', lines: [{ desc: 'Rent', accountId: 'a6000', amount: K(2000), taxId: 'vat16' }] });
  assert.throws(() => E.postBill(b.id), /must be approved/);
  E.approveBill(b.id); E.postBill(b.id);
  assert.equal(E.balance('a6000'), K(2000)); assert.equal(E.balance('a2100'), K(-320), 'input VAT reduces the VAT liability'); assert.equal(E.balance('a2000'), K(2320));
  assert.throws(() => E.payBill({ billId: b.id, date: '2026-03-05', amount: K(3000), accountId: 'a1010' }), /more than/);
  E.payBill({ billId: b.id, date: '2026-03-05', amount: K(1000), accountId: 'a1010' });
  assert.equal(E.billStatus(b, '2026-03-06'), 'partial');
  E.payBill({ billId: b.id, date: '2026-03-08', amount: K(1320), accountId: 'a1010' });
  assert.equal(E.billStatus(b), 'paid'); assert.equal(E.balance('a2000'), 0);
  assert.equal(E.balance('a6000'), K(2000), 'expense recognised once, on the bill');
  assert.equal(E.balance('a1010'), K(10000 - 2320));
  assert.equal(E.supplierBalance(s.id), 0);
});

test('paid-now expense: Dr category (net) + Dr VAT / Cr bank (gross); approvers can approve but not post journals', () => {
  const { E } = blank();
  capital(E, 1000);
  const x = E.saveExpense({ date: '2026-03-04', payee: 'Fuel station', desc: 'Fuel', accountId: 'a6300', payAccountId: 'a1010', amount: K(116), taxId: 'vat16' });
  E.submitExpense(x.id);
  actor = { id: 'u5', name: 'Approver', role: 'approver' };
  E.approveExpense(x.id);
  assert.equal(E.balance('a6300'), K(100)); assert.equal(E.balance('a2100'), K(-16)); assert.equal(E.balance('a1010'), K(884));
  assert.throws(() => E.saveJournal({ date: '2026-03-05', desc: 'x', lines: [] }), /cannot create drafts/);
  actor = { id: 'u6', name: 'Viewer', role: 'viewer' };
  assert.throws(() => E.transfer({ date: '2026-03-05', fromId: 'a1010', toId: 'a1000', amount: K(10) }), /cannot post/);
});

test('transfers move money between own accounts without touching income or expenses', () => {
  const { E } = blank();
  capital(E, 5000);
  const before = E.netIncome(null, TODAY);
  E.transfer({ date: '2026-03-06', fromId: 'a1010', toId: 'a1020', amount: K(1500), key: 't1' });
  assert.equal(E.balance('a1010'), K(3500)); assert.equal(E.balance('a1020'), K(1500));
  assert.equal(E.netIncome(null, TODAY), before);
  assert.throws(() => E.transfer({ date: '2026-03-06', fromId: 'a1010', toId: 'a1020', amount: K(1500), key: 't1' }), /duplicate/);
  assert.throws(() => E.transfer({ date: '2026-03-06', fromId: 'a1010', toId: 'a1010', amount: K(1) }), /two different/);
  const cf = E.cashFlow('2026-03-01', '2026-03-31');
  assert.equal(cf.net, 0, 'a transfer is not a cash inflow or outflow for the business'); assert.equal(cf.check, 0);
});

test('closed periods block posting until reopened with a reason (audited)', () => {
  const { S, E } = blank();
  capital(E, 100, '2026-01-05');
  E.closePeriod('2026-01');
  const j = E.saveJournal({ date: '2026-02-01', desc: 'ok', lines: [{ accountId: 'a6000', debit: K(1) }, { accountId: 'a1010', credit: K(1) }] });
  j.date = '2026-01-15';
  assert.throws(() => E.post(j.id), /January 2026 is closed/);
  actor = { id: 'u4', name: 'Bookkeeper', role: 'bookkeeper' };
  assert.throws(() => E.reopenPeriod('2026-01', 'fix'), /cannot open or close periods/);
  actor = owner;
  assert.throws(() => E.reopenPeriod('2026-01', ''), /reason/);
  E.reopenPeriod('2026-01', 'Late supplier invoice');
  E.post(j.id);
  assert.ok(S.audit.some(a => a.action === 'period.reopen'));
});

test('bank reconciliation: CSV validation, matching rules, and no completion while a difference remains', () => {
  const { E } = blank();
  capital(E, 1000, '2026-03-01');
  const t = E.saveJournal({ date: '2026-03-03', desc: 'Rent', lines: [{ accountId: 'a6000', debit: K(200) }, { accountId: 'a1010', credit: K(200) }] }); E.post(t.id);
  assert.throws(() => E.parseStatementCSV('Date,Description,Amount\n31/02/2026,Bad,10\n2026-03-03,x,abc'), e => e.problems.length === 2);
  const lines = E.parseStatementCSV('Date,Description,Debit,Credit\n01/03/2026,Capital,,1000.00\n03/03/2026,"Rent, March",200.00,\n05/03/2026,Bank charges,15.50,');
  assert.deepEqual(lines.map(l => l.amount), [K(1000), K(-200), K(-15.5)]);
  const r = E.startReconciliation({ accountId: 'a1010', start: '2026-03-01', end: '2026-03-31', opening: 0, closing: K(784.5), lines });
  const sug = E.suggest(r.id);
  assert.equal(Object.keys(sug).length, 2, 'capital and rent match on amount and date'); assert.match(Object.values(sug)[0].basis, /Same amount/);
  Object.entries(sug).forEach(([lid, s]) => E.match(r.id, lid, s.key));
  assert.throws(() => E.completeReconciliation(r.id), /not matched/);
  const fee = r.lines.find(l => !l.match);
  assert.throws(() => E.match(r.id, fee.id, t.id + ':1'), /already matched|Amounts differ/);
  E.createFromStatement(r.id, fee.id, 'a6500');
  const s = E.recSummary(r.id); assert.equal(s.difference, 0); assert.equal(s.unmatched, 0);
  E.completeReconciliation(r.id);
  assert.equal(E.balance('a1010'), K(784.5)); assert.equal(E.balance('a6500'), K(15.5));
  assert.equal(E.reconciledShare('a1010'), 1);
});

test('reports: trial balance balances, balance sheet satisfies A = L + E, P&L and cash flow agree with the ledger', () => {
  const { E } = blank();
  capital(E, 50000);
  const c = customer(E), s = supplier(E);
  const inv = E.saveInvoice({ contactId: c.id, issue: '2026-02-01', due: '2026-02-15', lines: [{ desc: 'Fee', accountId: 'a4100', qty: 1, price: K(10000), taxId: 'vat16' }] }); E.issueInvoice(inv.id);
  E.recordReceipt({ invoiceId: inv.id, date: '2026-02-10', amount: K(6000), accountId: 'a1010' });
  const b = E.saveBill({ contactId: s.id, issue: '2026-02-02', due: '2026-02-20', lines: [{ desc: 'Rent', accountId: 'a6000', amount: K(3000), taxId: 'vat16' }] }); E.approveBill(b.id); E.postBill(b.id);
  E.payBill({ billId: b.id, date: '2026-02-18', amount: K(3480), accountId: 'a1010' });
  const tb = E.trialBalance(TODAY); assert.equal(tb.diff, 0); assert.equal(tb.debit, tb.credit);
  const pl = E.profitAndLoss('2026-01-01', TODAY); assert.equal(pl.totalIncome, K(10000)); assert.equal(pl.totalExpenses, K(3000)); assert.equal(pl.net, K(7000));
  const bs = E.balanceSheet(TODAY); assert.equal(bs.check, 0);
  // assets: bank 50,000 + 6,000 − 3,480 = 52,520 ; AR 5,600 ; liabilities: VAT 1,600 − 480 = 1,120 ; equity: 50,000 + 7,000
  assert.equal(bs.totalAssets, K(58120)); assert.equal(bs.totalLiabilities, K(1120)); assert.equal(bs.totalEquity, K(57000));
  const cf = E.cashFlow('2026-02-01', '2026-02-28'); assert.equal(cf.net, K(2520)); assert.equal(cf.check, 0);
  const ar = E.ageing('ar', '2026-03-20'); assert.equal(ar.total, K(5600)); assert.equal(ar.rows[0].amounts[2], K(5600), '33 days late → 31–60 bucket');
  assert.deepEqual(E.integrity(), []);
});

test('accounts: codes unique, type locked once used, archiving needs a zero balance, used accounts cannot be deleted', () => {
  const { E } = blank();
  assert.throws(() => E.saveAccount({ code: '1010', name: 'Dup', type: 'asset' }), /already used/);
  capital(E, 10);
  assert.throws(() => E.saveAccount({ code: '1010', name: 'Bank', type: 'expense' }, 'a1010'), /type cannot change/);
  assert.throws(() => E.setAccountStatus('a1010', 'archived'), /still has a balance/);
  assert.throws(() => E.deleteAccount('a1010'), /Archive it instead/);
  assert.throws(() => E.setAccountStatus('a1100', 'archived'), /control account/);
  const n = E.saveAccount({ code: '6900', name: 'Training', type: 'expense' }); E.deleteAccount(n.id);
  assert.equal(E.account(n.id), undefined);
});

test('demo workspace: every posted entry balances and every report agrees, for several "today" dates', () => {
  for (const day of ['2026-10-23', '2026-01-05', '2027-03-31', '2026-07-01']) {
    const S = seed(day); const E = CL.Engine(S, { today: () => day });
    assert.deepEqual(E.integrity(), [], 'integrity on ' + day);
    assert.deepEqual(E.integrity(day), [], 'integrity as of ' + day);
    assert.ok(S.journals.filter(j => j.status === 'posted').every(j => { const t = E.totals(j.lines); return t.debit === t.credit; }));
    const fy = E.fyOf(day); assert.equal(E.cashFlow(fy.start, day).check, 0, 'cash flow ties on ' + day);
    // every cash/bank account balance equals the sum of its posted lines
    E.cashAccounts().forEach(a => { const s = E.postedLines().filter(l => l.accountId === a.id).reduce((t, l) => t + l.debit - l.credit, 0); assert.equal(E.balance(a.id), s); });
    // invoice and bill balances agree with their payments
    S.invoices.forEach(i => { if (i.status === 'issued') assert.equal(E.invoiceOutstanding(i), E.invoiceTotals(i).total - E.invoicePaid(i)); });
    S.recs.filter(r => r.status === 'completed').forEach(r => assert.equal(E.recSummary(r.id).difference, 0));
  }
});
