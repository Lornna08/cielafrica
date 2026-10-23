/* ============================================================
   C-Ledger — Bills & payables, supplier payments, expenses
   ============================================================ */
(function () {
  'use strict';
  var CL = window.CL, I = CL.icon, esc = CL.esc, f = CL.fmt, st = CL.store;
  function U(k, d) { st.ui[k] = st.ui[k] || d; return st.ui[k]; }
  function key() { return 'k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  /* =================== BILLS LIST =================== */
  CL.pages.bills = {
    render: function (v, p, q) {
      var E = st.E, S = st.S, T = st.today(), F = U('bills', { q: '', status: 'all', sup: '', sort: 'issue', dir: 'desc', page: 1 });
      if (q.status) { F.status = q.status; F.page = 1; }
      var all = S.bills.map(function (b) { return { b: b, s: E.billStatus(b, T), t: E.billTotals(b).total, out: E.billOutstanding(b), c: E.contact(b.contactId) }; });
      var cnt = { all: all.length, unposted: 0, open: 0, due: 0, overdue: 0, paid: 0 };
      all.forEach(function (r) { if (r.s === 'draft' || r.s === 'approved') cnt.unposted++; if (r.out > 0) cnt.open++; if (r.out > 0 && r.b.due <= CL.addDays(T, 7)) cnt.due++; if (r.s === 'overdue') cnt.overdue++; if (r.s === 'paid') cnt.paid++; });
      var s = F.q.trim().toLowerCase();
      var rows = all.filter(function (r) {
        if (F.status === 'unposted' && !(r.s === 'draft' || r.s === 'approved')) return false; if (F.status === 'open' && !(r.out > 0)) return false; if (F.status === 'due' && !(r.out > 0 && r.b.due <= CL.addDays(T, 7))) return false;
        if ((F.status === 'overdue' || F.status === 'paid') && r.s !== F.status) return false; if (F.sup && r.b.contactId !== F.sup) return false;
        if (s && (r.b.no + ' ' + r.c.name + ' ' + r.b.ref + ' ' + r.b.desc).toLowerCase().indexOf(s) < 0) return false; return true;
      });
      var outAll = all.reduce(function (t, r) { return t + r.out; }, 0);
      v.innerHTML = '<header class="ph"><div><h1>Bills & payables</h1><p>Posting a bill records the expense and the amount owed (Dr expense / Cr Accounts Payable). Paying it clears the payable — the expense is never recorded twice.</p></div><div class="ph__a"><button class="btn" data-x="csv">' + I('download', 16) + 'Export CSV</button><button class="btn" data-x="pay" data-need="post">' + I('arrowUp', 16) + 'Pay a bill</button><a class="btn btn--p" href="#/bill/new" data-need="draft">' + I('plus', 16) + 'Enter bill</a></div></header>' +
        '<div class="ss"><div class="st st--g"><span>Outstanding (= Accounts Payable)</span><b>' + f.money(outAll) + '</b><em>' + cnt.open + ' unpaid bills</em></div><div class="st st--a"><span>Due in the next 7 days</span><b>' + f.money(all.filter(function (r) { return r.out > 0 && r.b.due <= CL.addDays(T, 7); }).reduce(function (t, r) { return t + r.out; }, 0)) + '</b></div><div class="st st--r"><span>Overdue</span><b>' + f.money(all.filter(function (r) { return r.s === 'overdue'; }).reduce(function (t, r) { return t + r.out; }, 0)) + '</b></div><div class="st"><span>Waiting to be posted</span><b>' + cnt.unposted + '</b><em>drafts and approved bills</em></div></div>' +
        '<div class="chips">' + [['all', 'All'], ['unposted', 'Not posted'], ['open', 'Unpaid'], ['due', 'Due this week'], ['overdue', 'Overdue'], ['paid', 'Paid']].map(function (c) { return '<button class="chip' + (F.status === c[0] ? ' is-on' : '') + '" data-st="' + c[0] + '">' + c[1] + ' <b>' + cnt[c[0]] + '</b></button>'; }).join('') + '</div>' +
        '<div class="fb"><label class="s">' + I('search', 16) + '<input name="q" placeholder="Search number, supplier, reference" value="' + esc(F.q) + '"></label><label class="sel">' + CL.select('sup', [{ v: '', l: 'All suppliers' }].concat(S.contacts.filter(function (c) { return c.kind === 'supplier'; }).map(function (c) { return { v: c.id, l: c.name }; })), F.sup) + I('down', 15) + '</label></div>' +
        CL.table(rows, [
          { k: 'no', label: 'Bill', sort: function (r) { return r.b.no; }, cell: function (r) { return '<a class="ref" href="#/bill/' + r.b.id + '">' + r.b.no + '</a><span class="sub">' + esc(r.b.ref || '') + '</span>'; } },
          { k: 'sup', label: 'Supplier', sort: function (r) { return r.c.name; }, cell: function (r) { return '<span class="t-who">' + CL.cav(r.c, 26) + '<span>' + esc(r.c.name) + '<span class="sub">' + esc(r.b.desc) + '</span></span></span>'; } },
          { k: 'issue', label: 'Bill date', sort: function (r) { return r.b.issue; }, cell: function (r) { return '<span class="nowrap">' + f.date(r.b.issue) + '</span>'; } },
          { k: 'due', label: 'Due', sort: function (r) { return r.b.due; }, cell: function (r) { var d = CL.daysBetween(T, r.b.due); return '<span class="nowrap">' + f.date(r.b.due) + '</span>' + (r.out > 0 ? '<span class="sub' + (d < 0 ? ' neg' : '') + '">' + (d < 0 ? Math.abs(d) + ' days late' : d === 0 ? 'today' : 'in ' + d + ' days') + '</span>' : ''); } },
          { k: 't', label: 'Total', cls: 'r', sort: function (r) { return r.t; }, cell: function (r) { return f.num(r.t); } },
          { k: 'out', label: 'Outstanding', cls: 'r', sort: function (r) { return r.out; }, cell: function (r) { return r.out ? '<b>' + f.num(r.out) + '</b>' : '<span class="muted">—</span>'; } },
          { k: 's', label: 'Status', sort: function (r) { return r.s; }, cell: function (r) { return CL.status(r.s === 'posted' ? 'posted' : r.s); } }
        ], F, { per: 25, rowAttr: function (r) { return 'data-href="#/bill/' + r.b.id + '"'; } });
      CL.tableEvents(v, F, function () { CL.pages.bills.render(v, p, {}); });
      v.querySelector('[name=sup]').onchange = function (e) { F.sup = e.target.value; F.page = 1; CL.pages.bills.render(v, p, {}); };
      var qi = v.querySelector('[name=q]'), tmr; qi.oninput = function () { clearTimeout(tmr); tmr = setTimeout(function () { F.q = qi.value; F.page = 1; CL.pages.bills.render(v, p, {}); var n = v.querySelector('[name=q]'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 200); };
      v.onclick = function (e) {
        var c = e.target.closest('[data-st]'); if (c) { F.status = c.dataset.st; F.page = 1; history.replaceState(null, '', '#/bills'); CL.pages.bills.render(v, p, {}); return; }
        if (e.target.closest('[data-x=pay]')) { CL.payModal(); return; }
        if (e.target.closest('[data-x=csv]')) { CL.csv('c-ledger-bills.csv', [['Bill', 'Supplier', 'Supplier ref', 'Description', 'Bill date', 'Due', 'Net', 'VAT', 'Total', 'Paid', 'Outstanding', 'Status']].concat(rows.map(function (r) { var t = E.billTotals(r.b); return [r.b.no, r.c.name, r.b.ref, r.b.desc, r.b.issue, r.b.due, CL.csvMoney(t.net), CL.csvMoney(t.tax), CL.csvMoney(t.total), CL.csvMoney(E.billPaid(r.b)), CL.csvMoney(r.out), r.s]; }))); return; }
        var tr = e.target.closest('tr[data-href]'); if (tr && !e.target.closest('a,button')) location.hash = tr.dataset.href;
      };
    }
  };

  /* =================== BILL DETAIL / EDITOR =================== */
  CL.pages.bill = {
    render: function (v, p, q) {
      var E = st.E, id = p[0];
      if (id === 'new' || q.edit) return editor(v, id === 'new' ? null : E.bill(id), q);
      var b = E.bill(id); if (!b) { v.innerHTML = CL.empty('bill', 'Bill not found', '', '<a class="btn" href="#/bills">All bills</a>'); return; }
      var T = st.today(), s = E.billStatus(b, T), t = E.billTotals(b), c = E.contact(b.contactId), paid = E.billPaid(b), out = E.billOutstanding(b);
      var pays = st.S.payments.filter(function (x) { return x.billId === b.id; }), jn = b.journalId ? E.journal(b.journalId) : null;
      var trail = st.S.audit.filter(function (a) { return a.recordId === b.id || pays.some(function (x) { return x.id === a.recordId; }); });
      var steps = [['draft', 'Entered'], ['approved', 'Approved'], ['posted', 'Posted'], ['paid', 'Paid']], idx = { draft: 0, approved: 1, posted: 2, partial: 2, overdue: 2, paid: 3, void: -1 }[s];
      v.innerHTML = '<a class="crumb" href="#/bills">' + I('left', 14) + 'Bills & payables</a>' +
        '<div class="dh"><div><h1>' + b.no + ' ' + CL.status(s) + '</h1><div class="dh__s"><a class="lk" href="#/supplier/' + c.id + '">' + esc(c.name) + '</a><span>Supplier ref ' + esc(b.ref || '—') + '</span><span>Bill date ' + f.date(b.issue) + '</span><span>Due ' + f.date(b.due) + '</span>' + (jn ? '<span>Posted as <a class="lk" href="#/journal/' + jn.id + '">' + jn.ref + '</a></span>' : '') + '</div></div>' +
        '<div class="dh__a">' +
          (b.status === 'draft' ? '<a class="btn" href="#/bill/' + b.id + '?edit=1" data-need="draft">' + I('edit', 16) + 'Edit</a><button class="btn btn--p" data-x="approve">' + I('check', 16) + 'Approve</button>' : '') +
          (b.status === 'approved' ? '<button class="btn btn--p" data-x="post" data-need="post">' + I('ledger', 16) + 'Post to ledger</button>' : '') +
          (out > 0 ? '<button class="btn btn--p" data-x="pay" data-need="post">' + I('arrowUp', 16) + 'Record payment</button>' : '') +
          (b.status !== 'void' && !paid ? '<button class="btn" data-x="void">' + I('x', 16) + 'Void</button>' : '') +
        '</div></div>' +
        (idx >= 0 ? '<div class="chips mb">' + steps.map(function (x, i) { return '<span class="chip' + (i <= idx ? ' is-on' : '') + '">' + (i <= idx ? I('check', 13) : '') + x[1] + '</span>'; }).join('') + '</div>' : '') +
        (b.status === 'approved' || b.status === 'draft' ? '<div class="note note--a mb">' + I('info', 15) + '<span>Not in the ledger yet. Posting records <b>Dr expense ' + f.num(t.net) + '</b>' + (t.tax ? ' + <b>Dr VAT ' + f.num(t.tax) + '</b>' : '') + ' / <b>Cr Accounts Payable ' + f.num(t.total) + '</b>.</span></div>' : '') +
        '<div class="g" style="grid-template-columns:minmax(0,1fr) 320px;align-items:start" id="bg"><article class="card"><header class="card__h"><span class="card__t">' + esc(b.desc || 'Bill lines') + '</span></header>' +
          '<div class="t-wrap"><table class="t lines-t"><thead><tr><th>Description</th><th>Account</th><th>Tax</th><th class="r">Net</th><th class="r">VAT</th></tr></thead><tbody>' + b.lines.map(function (l, i) { var a = E.account(l.accountId); return '<tr><td>' + esc(l.desc) + '</td><td><a class="lk" href="#/account/' + a.id + '">' + a.code + ' · ' + esc(a.name) + '</a></td><td>' + esc(E.taxRate(l.taxId).name) + '</td><td class="r">' + f.num(t.lines[i].net) + '</td><td class="r">' + f.num(t.lines[i].tax) + '</td></tr>'; }).join('') + '</tbody><tfoot><tr><td colspan="3">Total ' + f.cur() + '</td><td class="r">' + f.num(t.net) + '</td><td class="r">' + f.num(t.tax) + '</td></tr></tfoot></table></div>' +
          '<div class="tot" style="margin-top:14px"><div class="tot__g"><span>Bill total</span><b>' + f.money(t.total) + '</b></div><div><span>Paid</span><b>' + f.num(paid) + '</b></div><div style="font-weight:800"><span>Outstanding</span><b>' + f.num(out) + '</b></div></div>' + (b.notes ? '<p class="muted" style="margin-top:12px">' + esc(b.notes) + '</p>' : '') + '</article>' +
          '<aside class="g"><article class="card"><header class="card__h"><span class="card__t">' + I('cash', 16) + 'Payments</span></header>' + (pays.length ? pays.map(function (x) { return '<div class="lr"><span class="lr__ic lr__ic--n">' + I('arrowUp', 14) + '</span><span class="lr__m"><a class="lr__t lk" href="#/journal/' + x.journalId + '">' + x.no + '</a><span class="lr__s">' + f.date(x.date) + ' · ' + esc(x.method) + ' · ' + esc(E.account(x.accountId).name) + '</span></span><span class="lr__v">' + f.num(x.amount) + '</span></div>'; }).join('') : '<p class="muted small">No payments yet.</p>') + '</article>' +
          '<article class="card"><header class="card__h"><span class="card__t">' + I('clock', 16) + 'History</span></header>' + (trail.length ? '<div class="tl">' + trail.map(function (a) { return '<div class="tl__i"><span class="tl__d">' + I(a.action.indexOf('payment') >= 0 ? 'cash' : a.action.indexOf('approve') >= 0 ? 'check' : a.action.indexOf('post') >= 0 ? 'ledger' : 'edit', 14) + '</span><span><b>' + esc(a.summary) + '</b><em>' + esc(a.actor.name) + ' · ' + f.date(a.at) + '</em></span></div>'; }).join('') + '</div>' : '<p class="muted small">Entered before the demo’s audit window.</p>') + '</article></aside></div>';
      if (innerWidth < 1180) v.querySelector('#bg').style.gridTemplateColumns = 'minmax(0,1fr)';
      v.onclick = function (e) {
        var x = e.target.closest('[data-x]'); if (!x) return;
        if (x.dataset.x === 'approve') st.act(function () { E.approveBill(b.id); }, b.no + ' approved');
        if (x.dataset.x === 'post') CL.confirm({ title: 'Post ' + b.no + '?', text: 'Records ' + f.money(t.total) + ' owed to ' + esc(c.name) + ', dated ' + f.date(b.issue) + '.', ok: 'Post bill', icon: 'ledger', onOk: function () { return st.act(function () { E.postBill(b.id); }, b.no + ' posted') !== false; } });
        if (x.dataset.x === 'pay') CL.payModal(b.id);
        if (x.dataset.x === 'void') CL.confirm({ title: 'Void ' + b.no + '?', text: b.status === 'posted' ? 'Posts a reversal that removes the expense and the payable.' : 'The bill has not been posted, so nothing changes in the ledger.', ok: 'Void bill', tone: 'r', icon: 'x', input: b.status === 'posted' ? { label: 'Reason', required: true, placeholder: 'e.g. Duplicate of BILL-0042' } : null, onOk: function (reason, panel) { return st.act(function () { E.voidBill(b.id, reason); }, b.no + ' voided', panel) !== false; } });
      };
    }
  };
  function editor(v, b, q) {
    var E = st.E, S = st.S, T = st.today();
    if (b && b.status !== 'draft') { location.hash = '#/bill/' + b.id; return; }
    var sups = S.contacts.filter(function (c) { return c.kind === 'supplier' && c.status === 'active'; });
    var d = b ? JSON.parse(JSON.stringify({ contactId: b.contactId, ref: b.ref, issue: b.issue, due: b.due, desc: b.desc, notes: b.notes, lines: b.lines })) : { contactId: q.supplier || '', ref: '', issue: T, due: CL.addDays(T, 30), desc: '', notes: '', lines: [{ desc: '', accountId: '', amount: 0, taxId: 'vat16' }] };
    var accO = function (val) { return CL.select('acc', CL.accountOptions(function (a) { return a.type === 'expense' || (a.type === 'asset' && (a.sub === 'fixed' || a.sub === 'inventory' || a.sub === 'current')); }, 'Choose account…'), val, ' class="cell-in" aria-label="Account"'); };
    function rowH(l, i) { return '<tr data-i="' + i + '"><td style="min-width:200px"><input class="cell-in" name="desc" value="' + esc(l.desc) + '" placeholder="Description" aria-label="Description"></td><td style="min-width:200px">' + accO(l.accountId) + '</td><td class="num" data-l="Net amount" style="width:140px"><input class="cell-in" name="amount" inputmode="decimal" value="' + (l.amount ? f.input(l.amount) : '') + '" placeholder="0.00" aria-label="Net amount"></td><td class="num" data-l="Tax" style="width:140px">' + CL.select('tax', S.settings.taxRates.map(function (r) { return { v: r.id, l: r.name }; }), l.taxId, ' class="cell-in" aria-label="Tax"') + '</td><td class="x"><button type="button" class="ib ib--sm" data-x="rm" aria-label="Remove line"' + (d.lines.length <= 1 ? ' disabled' : '') + '>' + I('x', 15) + '</button></td></tr>'; }
    v.innerHTML = '<a class="crumb" href="' + (b ? '#/bill/' + b.id : '#/bills') + '">' + I('left', 14) + (b ? b.no : 'Bills & payables') + '</a><header class="ph"><div><h1>' + (b ? 'Edit ' + b.no : 'Enter a supplier bill') + '</h1><p>Bills are saved as drafts, approved, then posted to the ledger.</p></div></header>' +
      '<form class="je" id="bf" novalidate><div class="g"><article class="card"><div class="fg3">' + CL.field('Supplier *', CL.select('contactId', [{ v: '', l: 'Choose supplier…' }].concat(sups.map(function (c) { return { v: c.id, l: c.name }; })), d.contactId)) + CL.field('Supplier’s bill number', '<input name="ref" value="' + esc(d.ref) + '">') + CL.field('Description', '<input name="bdesc" value="' + esc(d.desc) + '" placeholder="e.g. October rent">') +
        '<label class="fld"><span>Bill date *</span><input type="date" name="issue" value="' + d.issue + '"></label><label class="fld"><span>Due date *</span><input type="date" name="due" value="' + d.due + '"></label></div></article>' +
        '<article class="card"><header class="card__h"><span class="card__t">' + I('bill', 16) + 'Lines</span><span class="muted small">Enter amounts before VAT</span></header><div style="overflow-x:auto"><table class="jl"><thead><tr><th>Description</th><th>Expense or asset account</th><th style="text-align:right">Net amount</th><th>Tax</th><th></th></tr></thead><tbody id="blb">' + d.lines.map(rowH).join('') + '</tbody></table></div><button type="button" class="btn btn--soft btn--sm" data-x="add" style="margin-top:8px">' + I('plus', 15) + 'Add line</button></article>' +
        '<article class="card">' + CL.field('Notes', '<textarea name="notes" rows="2">' + esc(d.notes || '') + '</textarea>') + '</article></div>' +
        '<aside class="jt"><article class="card"><header class="card__h"><span class="card__t">' + I('cash', 16) + 'Summary</span></header><div id="btot"></div><div class="form-err" hidden></div><div class="g" style="gap:8px;margin-top:12px"><button type="button" class="btn btn--p" data-x="save">' + I('check', 16) + 'Save draft</button><a class="btn btn--ghost" href="' + (b ? '#/bill/' + b.id : '#/bills') + '">Cancel</a></div></article>' +
        '<div class="note" style="margin-top:12px">' + I('info', 15) + '<span>If the bill was already paid at the time of purchase, record it as an <a class="lk" href="#/expenses">expense</a> instead, so the payment is not recorded twice.</span></div></aside></form>';
    var form = v.querySelector('#bf');
    function read() { d.contactId = form.contactId.value; d.ref = form.ref.value; d.desc = form.bdesc.value; d.issue = form.issue.value; d.due = form.due.value; d.notes = form.notes.value; var bad = false; v.querySelectorAll('#blb tr').forEach(function (tr, i) { var l = d.lines[i], a = f.parse(tr.querySelector('[name=amount]').value); l.desc = tr.querySelector('[name=desc]').value; l.accountId = tr.querySelector('[name=acc]').value; l.taxId = tr.querySelector('[name=tax]').value; l.amount = isNaN(a) ? 0 : a; tr.querySelector('[name=amount]').setAttribute('aria-invalid', isNaN(a) ? 'true' : 'false'); if (isNaN(a)) bad = true; }); return bad; }
    function tot() { read(); var t = E.billTotals({ lines: d.lines }); v.querySelector('#btot').innerHTML = '<div class="jt__row"><span>Net</span><b>' + f.num(t.net) + '</b></div><div class="jt__row"><span>VAT (input tax)</span><b>' + f.num(t.tax) + '</b></div><div class="jt__row" style="font-size:16px"><span style="color:var(--ink)">Total</span><b>' + f.money(t.total) + '</b></div>'; }
    form.addEventListener('input', tot);
    form.contactId.addEventListener('change', function () { var c = E.contact(form.contactId.value); if (c && !b) form.due.value = CL.addDays(form.issue.value || T, c.terms); });
    form.addEventListener('click', function (e) {
      var x = e.target.closest('[data-x]'); if (!x) return;
      if (x.dataset.x === 'add') { read(); d.lines.push({ desc: '', accountId: '', amount: 0, taxId: 'vat16' }); v.querySelector('#blb').innerHTML = d.lines.map(rowH).join(''); tot(); }
      if (x.dataset.x === 'rm') { read(); d.lines.splice(+x.closest('tr').dataset.i, 1); v.querySelector('#blb').innerHTML = d.lines.map(rowH).join(''); tot(); }
      if (x.dataset.x === 'save') { if (read()) { CL.toast('Fix the highlighted amounts first.', 'err'); return; } form.querySelector('.form-err').hidden = true; var r = st.act(function () { return E.saveBill(JSON.parse(JSON.stringify(d)), b && b.id); }, b ? 'Bill updated' : 'Bill saved as draft — approve it next', form); if (r) location.hash = '#/bill/' + r.id; }
    });
    tot();
  }

  CL.payModal = function (billId) {
    var E = st.E, S = st.S, T = st.today();
    var open = S.bills.filter(function (b) { return E.billOutstanding(b) > 0; }).sort(function (a, b) { return a.due < b.due ? -1 : 1; });
    if (!open.length) { CL.toast('No posted bills are waiting for payment.', 'info'); return; }
    var b = billId ? E.bill(billId) : open[0], k = key();
    var p = CL.open('modal', CL.head('Pay a supplier bill', 'Records money paid out against a posted bill.', 'arrowUp') +
      '<form class="ovl__body" id="pf" novalidate><div class="fg">' + CL.field('Bill *', CL.select('billId', open.map(function (x) { return { v: x.id, l: x.no + ' · ' + E.contact(x.contactId).name + ' · ' + f.num(E.billOutstanding(x)) + ' due ' + f.dshort(x.due) }; }), b.id), '', 'full') +
      CL.field('Amount paid *', CL.moneyInput('amount', E.billOutstanding(b), ' autofocus')) + '<label class="fld"><span>Payment date *</span><input type="date" name="date" value="' + T + '"></label>' +
      CL.field('Paid from *', CL.select('accountId', E.cashAccounts().map(function (a) { return { v: a.id, l: a.name + ' · ' + f.short(E.balance(a.id)) }; }), E.def('bank').id)) + CL.field('Method', CL.select('method', ['Bank transfer', 'RTGS', 'Cheque', 'Mobile money', 'Cash'].map(function (m) { return { v: m, l: m }; }), 'Bank transfer')) +
      CL.field('Reference', '<input name="reference" placeholder="e.g. EFT reference">', '', 'full') + '</div><div id="pprev"></div><div class="form-err" hidden></div></form><div class="ovl__f"><button class="btn" data-close>Cancel</button><button class="btn btn--p" data-x="ok">' + I('check', 16) + 'Record payment</button></div>', { label: 'Pay bill' });
    var form = p.querySelector('#pf');
    function upd(e) { var x = E.bill(form.billId.value), out = E.billOutstanding(x), amt = f.parse(form.amount.value), bank = E.account(form.accountId.value); if (e && e.target.name === 'billId') { form.amount.value = f.input(out); amt = out; } p.querySelector('#pprev').innerHTML = isNaN(amt) || amt <= 0 ? '' : amt > out ? '<div class="note note--r">' + I('alert', 15) + '<span>More than the ' + f.num(out) + ' outstanding.</span></div>' : '<div class="note note--g">' + I('ledger', 15) + '<span>Posts <b>Dr Accounts Payable ' + f.num(amt) + '</b> / <b>Cr ' + esc(bank.name) + ' ' + f.num(amt) + '</b>. The expense was recorded when the bill was posted. ' + (amt < out ? 'Leaves ' + f.num(out - amt) + ' to pay.' : 'Clears the bill.') + (E.balance(bank.id) < amt ? ' <b>Note: ' + esc(bank.name) + ' would go overdrawn.</b>' : '') + '</span></div>'; }
    form.addEventListener('input', upd); form.addEventListener('change', upd); upd();
    p.querySelector('[data-x=ok]').onclick = function (ev) { var btn = ev.currentTarget; if (btn.disabled) return; var d = CL.formData(form); d.amount = f.parse(d.amount); d.key = k; if (isNaN(d.amount)) { CL.toast('Enter the amount with at most 2 decimals.', 'err'); return; } btn.disabled = true; var r = st.act(function () { return E.payBill(d); }, function (r) { return r.no + ' recorded — ' + f.money(r.amount) + ' paid'; }, form); btn.disabled = false; if (r) CL.close(); };
  };

  /* =================== EXPENSES =================== */
  CL.pages.expenses = {
    render: function (v, p, q) {
      var E = st.E, S = st.S, T = st.today(), F = U('expenses', { q: '', status: 'all', cat: '', from: '', to: '', sort: 'date', dir: 'desc', page: 1 });
      if (q.status) { F.status = q.status; F.page = 1; }
      var cnt = { all: S.expenses.length, submitted: 0, posted: 0, draft: 0, rejected: 0 }; S.expenses.forEach(function (x) { cnt[x.status] = (cnt[x.status] || 0) + 1; });
      var s = F.q.trim().toLowerCase();
      var rows = S.expenses.filter(function (x) { if (F.status !== 'all' && x.status !== F.status) return false; if (F.cat && x.accountId !== F.cat) return false; if (F.from && x.date < F.from) return false; if (F.to && x.date > F.to) return false; if (s && (x.no + ' ' + x.payee + ' ' + x.desc + ' ' + x.by).toLowerCase().indexOf(s) < 0) return false; return true; });
      var m0 = T.slice(0, 8) + '01', mTot = S.expenses.filter(function (x) { return x.status === 'posted' && x.date >= m0; }).reduce(function (t, x) { return t + x.amount; }, 0);
      var byCat = {}; S.expenses.filter(function (x) { return x.status === 'posted' && x.date >= m0; }).forEach(function (x) { byCat[x.accountId] = (byCat[x.accountId] || 0) + E.expenseTotals(x).net; });
      var topCat = Object.keys(byCat).sort(function (a, b) { return byCat[b] - byCat[a]; })[0];
      v.innerHTML = '<header class="ph"><div><h1>Expenses</h1><p>Costs paid immediately — by card, cash or mobile money. Unpaid supplier invoices belong in <a class="lk" href="#/bills">Bills</a>.</p></div><div class="ph__a"><button class="btn" data-x="csv">' + I('download', 16) + 'Export CSV</button><button class="btn btn--p" data-x="new" data-need="draft">' + I('plus', 16) + 'Record expense</button></div></header>' +
        '<div class="ss"><div class="st st--g"><span>Paid this month</span><b>' + f.money(mTot) + '</b><em>approved and posted, incl. VAT</em></div><div class="st st--a"><span>Awaiting approval</span><b>' + (cnt.submitted || 0) + '</b><em>' + f.money(S.expenses.filter(function (x) { return x.status === 'submitted'; }).reduce(function (t, x) { return t + x.amount; }, 0)) + '</em></div><div class="st"><span>Largest category this month</span><b style="font-size:15px">' + (topCat ? esc(E.account(topCat).name) : '—') + '</b><em>' + (topCat ? f.money(byCat[topCat]) + ' before VAT' : '') + '</em></div><div class="st"><span>Missing receipts</span><b>' + S.expenses.filter(function (x) { return !x.receipt && x.status !== 'rejected'; }).length + '</b></div></div>' +
        '<div class="chips">' + [['all', 'All'], ['submitted', 'Awaiting approval'], ['posted', 'Approved & posted'], ['draft', 'Drafts'], ['rejected', 'Rejected']].map(function (c) { return '<button class="chip' + (F.status === c[0] ? ' is-on' : '') + '" data-st="' + c[0] + '">' + c[1] + ' <b>' + (cnt[c[0]] || 0) + '</b></button>'; }).join('') + '</div>' +
        '<div class="fb"><label class="s">' + I('search', 16) + '<input name="q" placeholder="Search payee, description or person" value="' + esc(F.q) + '"></label><label class="sel">' + CL.select('cat', [{ v: '', l: 'All categories' }].concat(E.accountsByType('expense').map(function (a) { return { v: a.id, l: a.name }; })), F.cat) + I('down', 15) + '</label><input type="date" name="from" value="' + F.from + '" aria-label="From"><input type="date" name="to" value="' + F.to + '" aria-label="To"></div>' +
        CL.table(rows, [
          { k: 'date', label: 'Date', sort: function (x) { return x.date + x.no; }, cell: function (x) { return '<span class="nowrap">' + f.date(x.date) + '</span><span class="sub">' + x.no + '</span>'; } },
          { k: 'payee', label: 'Payee', sort: function (x) { return x.payee; }, cell: function (x) { return '<b>' + esc(x.payee) + '</b><span class="sub">' + esc(x.desc) + '</span>'; } },
          { k: 'cat', label: 'Category', sort: function (x) { return E.account(x.accountId).name; }, cell: function (x) { return esc(E.account(x.accountId).name); } },
          { k: 'paid', label: 'Paid from', cell: function (x) { return esc(x.method) + '<span class="sub">' + esc(E.account(x.payAccountId).name) + '</span>'; } },
          { k: 'by', label: 'By', cell: function (x) { return '<span class="nowrap">' + esc(x.by) + '</span>' + (x.receipt ? '<span class="sub">' + I('clip', 11) + ' receipt</span>' : '<span class="sub neg">no receipt</span>'); } },
          { k: 'amt', label: 'Amount', cls: 'r', sort: function (x) { return x.amount; }, cell: function (x) { var t = E.expenseTotals(x); return f.num(x.amount) + (t.tax ? '<span class="sub">VAT ' + f.num(t.tax) + '</span>' : ''); } },
          { k: 's', label: 'Status', sort: function (x) { return x.status; }, cell: function (x) { return CL.status(x.status); } },
          { k: 'a', label: '', cls: 'r', cell: function (x) { return x.status === 'submitted' ? '<span class="nowrap"><button class="btn btn--sm" data-rj="' + x.id + '" data-need="approve">Reject</button> <button class="btn btn--sm btn--p" data-ap="' + x.id + '">Approve</button></span>' : '<button class="ib ib--sm" data-op="' + x.id + '" aria-label="Open ' + x.no + '">' + I('right', 16) + '</button>'; } }
        ], F, { per: 25, rowAttr: function (x) { return 'data-op-row="' + x.id + '"'; } });
      CL.tableEvents(v, F, function () { CL.pages.expenses.render(v, p, {}); });
      v.querySelectorAll('.fb select, .fb input[type=date]').forEach(function (el) { el.onchange = function () { F[el.name] = el.value; F.page = 1; CL.pages.expenses.render(v, p, {}); }; });
      var qi = v.querySelector('[name=q]'), tmr; qi.oninput = function () { clearTimeout(tmr); tmr = setTimeout(function () { F.q = qi.value; F.page = 1; CL.pages.expenses.render(v, p, {}); var n = v.querySelector('[name=q]'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 200); };
      v.onclick = function (e) {
        var c = e.target.closest('[data-st]'); if (c) { F.status = c.dataset.st; F.page = 1; history.replaceState(null, '', '#/expenses'); CL.pages.expenses.render(v, p, {}); return; }
        if (e.target.closest('[data-x=new]')) { CL.expenseModal(); return; }
        if (e.target.closest('[data-x=csv]')) { CL.csv('c-ledger-expenses.csv', [['Number', 'Date', 'Payee', 'Description', 'Category', 'Paid from', 'Method', 'Net', 'VAT', 'Gross', 'Status', 'Recorded by']].concat(rows.map(function (x) { var t = E.expenseTotals(x); return [x.no, x.date, x.payee, x.desc, E.account(x.accountId).name, E.account(x.payAccountId).name, x.method, CL.csvMoney(t.net), CL.csvMoney(t.tax), CL.csvMoney(t.gross), x.status, x.by]; }))); return; }
        var ap = e.target.closest('[data-ap]'); if (ap) { approve(ap.dataset.ap); return; }
        var rj = e.target.closest('[data-rj]'); if (rj) { reject(rj.dataset.rj); return; }
        var op = e.target.closest('[data-op]') || (!e.target.closest('a,button') && e.target.closest('[data-op-row]')); if (op) { detail(op.dataset.op || op.dataset.opRow); }
      };
      if (q.open) setTimeout(function () { detail(q.open); history.replaceState(null, '', '#/expenses'); }, 30);
    }
  };
  function approve(id) { var E = st.E, x = st.S.expenses.filter(function (e) { return e.id === id; })[0], t = E.expenseTotals(x); CL.confirm({ title: 'Approve ' + x.no + '?', text: 'Posts <b>Dr ' + esc(E.account(x.accountId).name) + ' ' + f.num(t.net) + '</b>' + (t.tax ? ' + <b>Dr VAT ' + f.num(t.tax) + '</b>' : '') + ' / <b>Cr ' + esc(E.account(x.payAccountId).name) + ' ' + f.num(t.gross) + '</b>, dated ' + f.date(x.date) + '.', ok: 'Approve and post', icon: 'check', onOk: function () { return st.act(function () { E.approveExpense(id); }, x.no + ' approved and posted') !== false; } }); }
  function reject(id) { var E = st.E, x = st.S.expenses.filter(function (e) { return e.id === id; })[0]; CL.confirm({ title: 'Reject ' + x.no + '?', text: esc(x.by) + ' can correct and resubmit it. Nothing is posted.', ok: 'Reject', tone: 'r', icon: 'x', input: { label: 'Reason', required: true, placeholder: 'e.g. Please attach the receipt' }, onOk: function (reason, panel) { return st.act(function () { E.rejectExpense(id, reason); }, x.no + ' sent back', panel) !== false; } }); }
  function detail(id) {
    var E = st.E, x = st.S.expenses.filter(function (e) { return e.id === id; })[0]; if (!x) return; var t = E.expenseTotals(x), j = x.journalId ? E.journal(x.journalId) : null;
    var p = CL.open('drawer', CL.head(x.no + ' · ' + x.payee, CL.status(x.status) + ' &nbsp;' + f.date(x.date), 'expense') + '<div class="ovl__body">' +
      (x.status === 'rejected' ? '<div class="note note--r">' + I('alert', 15) + '<span><b>Rejected:</b> ' + esc(x.rejectReason || '') + '</span></div>' : '') +
      '<dl class="kv"><dt>Description</dt><dd>' + esc(x.desc || '—') + '</dd><dt>Category</dt><dd>' + esc(E.account(x.accountId).code + ' · ' + E.account(x.accountId).name) + '</dd><dt>Paid from</dt><dd>' + esc(E.account(x.payAccountId).name) + ' · ' + esc(x.method) + '</dd><dt>Tax</dt><dd>' + esc(E.taxRate(x.taxId).name) + '</dd><dt>Net</dt><dd>' + f.money(t.net) + '</dd><dt>VAT</dt><dd>' + f.money(t.tax) + '</dd><dt>Total paid</dt><dd>' + f.money(t.gross) + '</dd><dt>Recorded by</dt><dd>' + esc(x.by) + '</dd>' + (x.approvedBy ? '<dt>Approved by</dt><dd>' + esc(x.approvedBy) + '</dd>' : '') + '<dt>Receipt</dt><dd>' + (x.receipt ? I('clip', 13) + ' ' + esc(x.receipt.name) + ' (' + Math.round(x.receipt.size / 1024) + ' KB)' : '<span class="neg">Not attached</span>') + '</dd>' + (j ? '<dt>Journal</dt><dd><a class="lk" href="#/journal/' + j.id + '">' + j.ref + '</a></dd>' : '') + '</dl>' +
      (x.notes ? '<p class="muted">' + esc(x.notes) + '</p>' : '') +
      '<div class="g g2" style="gap:8px">' + (x.status === 'submitted' ? '<button class="btn" data-x="rj">Reject</button><button class="btn btn--p" data-x="ap">' + I('check', 16) + 'Approve</button>' : '') + (x.status === 'draft' || x.status === 'rejected' ? '<button class="btn" data-x="ed">' + I('edit', 16) + 'Edit</button><button class="btn btn--p" data-x="sb">Submit for approval</button>' : '') + '</div></div>', { label: x.no, cls: 'ovl--right' });
    p.onclick = function (e) { var b = e.target.closest('[data-x]'); if (!b) return; var a = b.dataset.x; CL.close(); if (a === 'ap') approve(id); if (a === 'rj') reject(id); if (a === 'ed') CL.expenseModal(x); if (a === 'sb') st.act(function () { if (x.status === 'rejected') E.saveExpense(x, x.id); E.submitExpense(x.id); }, x.no + ' submitted for approval'); };
  }

  CL.expenseModal = function (x) {
    var E = st.E, S = st.S, T = st.today(), me = st.me(), receipt = x ? x.receipt : null;
    var canApprove = E.can('approve');
    var p = CL.open('modal', CL.head(x ? 'Edit ' + x.no : 'Record an expense', 'For costs already paid. If you still owe the supplier, enter a bill instead.', 'expense') +
      '<form class="ovl__body" id="xf" novalidate><div class="fg">' + CL.field('Paid to *', '<input name="payee" value="' + esc(x ? x.payee : '') + '" placeholder="e.g. Fuel station" autofocus list="payees"><datalist id="payees">' + S.contacts.filter(function (c) { return c.kind === 'supplier'; }).map(function (c) { return '<option value="' + esc(c.name) + '">'; }).join('') + '</datalist>') +
      '<label class="fld"><span>Date *</span><input type="date" name="date" value="' + (x ? x.date : T) + '"></label>' +
      CL.field('Category *', CL.select('accountId', CL.accountOptions(function (a) { return a.type === 'expense'; }, 'Choose category…'), x ? x.accountId : '')) + CL.field('Amount paid (incl. VAT) *', CL.moneyInput('amount', x ? x.amount : 0)) +
      CL.field('Paid from *', CL.select('payAccountId', E.cashAccounts().map(function (a) { return { v: a.id, l: a.name }; }), x ? x.payAccountId : E.def('bank').id)) + CL.field('Method', CL.select('method', ['Card', 'Cash', 'Mobile money', 'Bank transfer'].map(function (m) { return { v: m, l: m }; }), x ? x.method : 'Card')) +
      CL.field('Tax', CL.select('taxId', S.settings.taxRates.map(function (r) { return { v: r.id, l: r.name }; }), x ? x.taxId : 'vat16')) + CL.field('Description', '<input name="desc" value="' + esc(x ? x.desc : '') + '">') +
      '<div class="full"><label class="drop" id="xdrop">' + I('upload', 20) + '<div id="xrc">' + (receipt ? esc(receipt.name) : 'Attach the receipt — drop it here or <b>browse</b>') + '</div><input type="file" accept="image/*,.pdf" hidden name="file"></label></div>' +
      CL.field('Notes', '<textarea name="notes" rows="2">' + esc(x ? x.notes : '') + '</textarea>', '', 'full') + '</div><div id="xprev"></div><div class="form-err" hidden></div></form>' +
      '<div class="ovl__f"><button class="btn" data-close>Cancel</button><button class="btn" data-x="draft">Save draft</button><button class="btn btn--p" data-x="submit">' + I('check', 16) + (canApprove && !x ? 'Save, approve & post' : 'Submit for approval') + '</button></div>', { label: 'Expense' });
    var form = p.querySelector('#xf'), fi = form.querySelector('[name=file]'), drop = p.querySelector('#xdrop');
    function setFile(fl) { if (!fl) return; if (fl.size > 25 * 1024 * 1024) { CL.toast('Receipts must be under 25 MB', 'err'); return; } if (!/^image\/|pdf$/.test(fl.type || '') && !/\.(pdf|jpe?g|png|heic|webp)$/i.test(fl.name)) { CL.toast('Attach an image or a PDF', 'err'); return; } receipt = { name: fl.name, size: fl.size }; p.querySelector('#xrc').innerHTML = I('clip', 13) + ' ' + esc(fl.name) + ' · ' + Math.round(fl.size / 1024) + ' KB'; }
    fi.onchange = function () { setFile(fi.files[0]); };
    ['dragover', 'dragenter'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('is-over'); }); }); ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('is-over'); if (ev === 'drop') setFile(e.dataTransfer.files[0]); }); });
    function upd() { var amt = f.parse(form.amount.value), acc = E.account(form.accountId.value), pay = E.account(form.payAccountId.value); if (isNaN(amt) || !amt || !acc) { p.querySelector('#xprev').innerHTML = ''; return; } var t = E.expenseTotals({ amount: amt, taxId: form.taxId.value }); p.querySelector('#xprev').innerHTML = '<div class="note note--g">' + I('ledger', 15) + '<span>When approved: <b>Dr ' + esc(acc.name) + ' ' + f.num(t.net) + '</b>' + (t.tax ? ' + <b>Dr VAT ' + f.num(t.tax) + '</b>' : '') + ' / <b>Cr ' + esc(pay.name) + ' ' + f.num(t.gross) + '</b>. VAT is worked out from the total paid.</span></div>'; }
    form.addEventListener('input', upd); form.addEventListener('change', upd); upd();
    p.querySelector('.ovl__f').onclick = function (e) {
      var b = e.target.closest('[data-x]'); if (!b) return; var d = CL.formData(form); d.amount = f.parse(d.amount); d.receipt = receipt; d.by = x ? x.by : me.name;
      var supplier = S.contacts.filter(function (c) { return c.kind === 'supplier' && c.name === d.payee; })[0]; if (supplier) d.contactId = supplier.id;
      if (isNaN(d.amount)) { CL.toast('Enter the amount with at most 2 decimals.', 'err'); return; }
      var r = st.act(function () { var ex = E.saveExpense(d, x && x.id); if (b.dataset.x === 'submit') { if (canApprove && !x) E.approveExpense(ex.id); else E.submitExpense(ex.id); } return ex; }, function (ex) { return b.dataset.x === 'draft' ? ex.no + ' saved as draft' : ex.status === 'posted' ? ex.no + ' approved and posted' : ex.no + ' submitted for approval'; }, form);
      if (r) CL.close();
    };
  };
})();
