/* ============================================================
   C-Ledger — Invoices (receivables), receipts, customers
   ============================================================ */
(function () {
  'use strict';
  var CL = window.CL, I = CL.icon, esc = CL.esc, f = CL.fmt, st = CL.store;
  function U(k, d) { st.ui[k] = st.ui[k] || d; return st.ui[k]; }
  function key() { return 'k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  /* =================== INVOICES LIST =================== */
  CL.pages.invoices = {
    render: function (v, p, q) {
      var E = st.E, S = st.S, T = st.today(), F = U('invoices', { q: '', status: 'all', cust: '', sort: 'issue', dir: 'desc', page: 1 });
      if (q.status) { F.status = q.status; F.page = 1; }
      var all = S.invoices.map(function (i) { return { i: i, s: E.invoiceStatus(i, T), t: E.invoiceTotals(i).total, out: E.invoiceOutstanding(i), c: E.contact(i.contactId) }; });
      var cnt = { all: all.length, open: 0, draft: 0, overdue: 0, paid: 0, void: 0 };
      all.forEach(function (r) { if (r.s === 'issued' || r.s === 'partial' || r.s === 'overdue') cnt.open++; if (cnt[r.s] != null) cnt[r.s]++; });
      var s = F.q.trim().toLowerCase();
      var rows = all.filter(function (r) {
        if (F.status === 'open' && !(r.s === 'issued' || r.s === 'partial' || r.s === 'overdue')) return false;
        if (['draft', 'overdue', 'paid', 'void'].indexOf(F.status) >= 0 && r.s !== F.status) return false;
        if (F.cust && r.i.contactId !== F.cust) return false;
        if (s && (r.i.no + ' ' + r.c.name + ' ' + (r.i.ref || '') + ' ' + r.i.lines.map(function (l) { return l.desc; }).join(' ')).toLowerCase().indexOf(s) < 0) return false;
        return true;
      });
      var outAll = all.reduce(function (t, r) { return t + r.out; }, 0), odAll = all.filter(function (r) { return r.s === 'overdue'; }).reduce(function (t, r) { return t + r.out; }, 0);
      var m0 = T.slice(0, 8) + '01', paidM = S.receipts.filter(function (r) { return !r.voided && r.date >= m0; }).reduce(function (t, r) { return t + r.amount; }, 0);
      var issuedM = all.filter(function (r) { return r.i.status !== 'draft' && r.i.status !== 'void' && r.i.issue >= m0; }).reduce(function (t, r) { return t + r.t; }, 0);
      v.innerHTML = '<header class="ph"><div><h1>Invoices</h1><p>Issuing an invoice posts Dr Accounts Receivable / Cr Revenue (and VAT). Receipts clear the receivable — revenue is never counted twice.</p></div><div class="ph__a"><button class="btn" data-x="csv">' + I('download', 16) + 'Export CSV</button><button class="btn" data-x="rcpt" data-need="post">' + I('arrowDown', 16) + 'Record receipt</button><a class="btn btn--p" href="#/invoice/new" data-need="draft">' + I('plus', 16) + 'New invoice</a></div></header>' +
        '<div class="ss"><div class="st st--g"><span>Outstanding (= Accounts Receivable)</span><b>' + f.money(outAll) + '</b><em>' + cnt.open + ' open invoices</em></div><div class="st st--r"><span>Overdue</span><b>' + f.money(odAll) + '</b><em>' + cnt.overdue + ' invoices</em></div><div class="st"><span>Issued this month</span><b>' + f.money(issuedM) + '</b></div><div class="st"><span>Received this month</span><b>' + f.money(paidM) + '</b></div></div>' +
        '<div class="chips">' + [['all', 'All'], ['open', 'Open'], ['overdue', 'Overdue'], ['draft', 'Drafts'], ['paid', 'Paid'], ['void', 'Void']].map(function (c) { return '<button class="chip' + (F.status === c[0] ? ' is-on' : '') + '" data-st="' + c[0] + '">' + c[1] + ' <b>' + cnt[c[0]] + '</b></button>'; }).join('') + '</div>' +
        '<div class="fb"><label class="s">' + I('search', 16) + '<input name="q" placeholder="Search number, customer, PO or line" value="' + esc(F.q) + '"></label><label class="sel">' + CL.select('cust', [{ v: '', l: 'All customers' }].concat(S.contacts.filter(function (c) { return c.kind === 'customer'; }).map(function (c) { return { v: c.id, l: c.name }; })), F.cust) + I('down', 15) + '</label></div>' +
        CL.table(rows, [
          { k: 'no', label: 'Invoice', sort: function (r) { return r.i.no; }, cell: function (r) { return '<a class="ref" href="#/invoice/' + r.i.id + '">' + r.i.no + '</a>' + (r.i.ref ? '<span class="sub">' + esc(r.i.ref) + '</span>' : ''); } },
          { k: 'cust', label: 'Customer', sort: function (r) { return r.c.name; }, cell: function (r) { return '<span class="t-who">' + CL.cav(r.c, 26) + '<span>' + esc(r.c.name) + '</span></span>'; } },
          { k: 'issue', label: 'Issued', sort: function (r) { return r.i.issue; }, cell: function (r) { return '<span class="nowrap">' + f.date(r.i.issue) + '</span>'; } },
          { k: 'due', label: 'Due', sort: function (r) { return r.i.due; }, cell: function (r) { var d = CL.daysBetween(T, r.i.due); return '<span class="nowrap">' + f.date(r.i.due) + '</span>' + (r.s === 'overdue' ? '<span class="sub neg">' + Math.abs(d) + ' days late</span>' : ''); } },
          { k: 't', label: 'Total', cls: 'r', sort: function (r) { return r.t; }, cell: function (r) { return f.num(r.t); } },
          { k: 'out', label: 'Outstanding', cls: 'r', sort: function (r) { return r.out; }, cell: function (r) { return r.out ? '<b>' + f.num(r.out) + '</b>' : '<span class="muted">—</span>'; } },
          { k: 's', label: 'Status', sort: function (r) { return r.s; }, cell: function (r) { return CL.status(r.s); } }
        ], F, { per: 25, rowAttr: function (r) { return 'data-href="#/invoice/' + r.i.id + '"'; } });
      CL.tableEvents(v, F, function () { CL.pages.invoices.render(v, p, {}); });
      v.querySelector('[name=cust]').onchange = function (e) { F.cust = e.target.value; F.page = 1; CL.pages.invoices.render(v, p, {}); };
      var qi = v.querySelector('[name=q]'), tmr; qi.oninput = function () { clearTimeout(tmr); tmr = setTimeout(function () { F.q = qi.value; F.page = 1; CL.pages.invoices.render(v, p, {}); var n = v.querySelector('[name=q]'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 200); };
      v.onclick = function (e) {
        var c = e.target.closest('[data-st]'); if (c) { F.status = c.dataset.st; F.page = 1; history.replaceState(null, '', '#/invoices'); CL.pages.invoices.render(v, p, {}); return; }
        if (e.target.closest('[data-x=rcpt]')) { CL.receiptModal(); return; }
        if (e.target.closest('[data-x=csv]')) { CL.csv('c-ledger-invoices.csv', [['Invoice', 'Customer', 'Reference', 'Issued', 'Due', 'Net', 'VAT', 'Total', 'Paid', 'Outstanding', 'Status']].concat(rows.map(function (r) { var t = E.invoiceTotals(r.i); return [r.i.no, r.c.name, r.i.ref, r.i.issue, r.i.due, CL.csvMoney(t.net), CL.csvMoney(t.tax), CL.csvMoney(t.total), CL.csvMoney(E.invoicePaid(r.i)), CL.csvMoney(r.out), r.s]; }))); return; }
        var tr = e.target.closest('tr[data-href]'); if (tr && !e.target.closest('a,button')) location.hash = tr.dataset.href;
      };
    }
  };

  /* =================== INVOICE DETAIL / EDITOR =================== */
  CL.pages.invoice = {
    render: function (v, p, q) {
      var E = st.E, id = p[0];
      if (id === 'new' || q.edit) return editor(v, id === 'new' ? null : E.invoice(id), q);
      var inv = E.invoice(id); if (!inv) { v.innerHTML = CL.empty('invoice', 'Invoice not found', '', '<a class="btn" href="#/invoices">All invoices</a>'); return; }
      var T = st.today(), s = E.invoiceStatus(inv, T), t = E.invoiceTotals(inv), c = E.contact(inv.contactId), paid = E.invoicePaid(inv), out = E.invoiceOutstanding(inv);
      var rcpts = st.S.receipts.filter(function (r) { return r.invoiceId === inv.id; });
      var jn = inv.journalId ? E.journal(inv.journalId) : null, trail = st.S.audit.filter(function (a) { return a.recordId === inv.id || rcpts.some(function (r) { return r.id === a.recordId; }); });
      v.innerHTML = '<a class="crumb no-print" href="#/invoices">' + I('left', 14) + 'Invoices</a>' +
        '<div class="dh"><div><h1>' + inv.no + ' ' + CL.status(s) + '</h1><div class="dh__s"><a class="lk" href="#/customer/' + c.id + '">' + esc(c.name) + '</a><span>Issued ' + f.date(inv.issue) + '</span><span>Due ' + f.date(inv.due) + '</span>' + (jn ? '<span>Posted as <a class="lk" href="#/journal/' + jn.id + '">' + jn.ref + '</a></span>' : '') + '</div></div>' +
        '<div class="dh__a">' +
          (inv.status === 'draft' ? '<button class="btn" data-x="void" data-need="draft">' + I('trash', 16) + 'Discard</button><a class="btn" href="#/invoice/' + inv.id + '?edit=1" data-need="draft">' + I('edit', 16) + 'Edit</a><button class="btn btn--p" data-x="issue" data-need="post">' + I('check', 16) + 'Issue invoice</button>' : '') +
          (out > 0 ? '<button class="btn btn--p" data-x="pay" data-need="post">' + I('arrowDown', 16) + 'Record receipt</button>' : '') +
          (inv.status !== 'draft' && inv.status !== 'void' && !paid ? '<button class="btn" data-x="void" data-need="post">' + I('x', 16) + 'Void</button>' : '') +
          '<button class="btn" onclick="print()">' + I('print', 16) + 'Print / PDF</button>' +
        '</div></div>' +
        (inv.status === 'draft' ? '<div class="note note--a mb no-print">' + I('info', 15) + '<span>Draft — not in the ledger yet. Issuing it posts <b>Dr Accounts Receivable ' + f.num(t.total) + '</b>, <b>Cr revenue ' + f.num(t.net) + '</b>' + (t.tax ? ' and <b>Cr VAT ' + f.num(t.tax) + '</b>' : '') + '.</span></div>' : '') +
        (s === 'overdue' ? '<div class="note note--r mb no-print">' + I('alert', 15) + '<span>' + CL.daysBetween(inv.due, T) + ' days overdue — ' + f.money(out) + ' outstanding. ' + esc(c.contact || '') + (c.phone ? ' · ' + esc(c.phone) : '') + '</span></div>' : '') +
        '<div class="g" style="grid-template-columns:minmax(0,1fr) 320px;align-items:start" id="ig">' + paper(inv) +
        '<aside class="g no-print"><article class="card"><header class="card__h"><span class="card__t">' + I('cash', 16) + 'Payment</span></header><div class="tot" style="width:100%"><div><span>Total</span><b>' + f.num(t.total) + '</b></div><div><span>Received</span><b>' + f.num(paid) + '</b></div><div class="tot__g"><span>Outstanding</span><b>' + f.money(out) + '</b></div></div>' +
          (rcpts.length ? '<h3 class="sub-h" style="margin-top:12px">Receipts</h3>' + rcpts.map(function (r) { return '<div class="lr"><span class="lr__ic lr__ic--' + (r.voided ? 'n' : 'g') + '">' + I(r.voided ? 'reverse' : 'arrowDown', 14) + '</span><span class="lr__m"><a class="lr__t lk" href="#/journal/' + r.journalId + '">' + r.no + (r.voided ? ' (reversed)' : '') + '</a><span class="lr__s">' + f.date(r.date) + ' · ' + esc(r.method) + ' · ' + esc(E.account(r.accountId).name) + (r.excess ? ' · ' + f.num(r.excess) + ' to customer credit' : '') + '</span></span><span class="lr__v">' + f.num(r.amount) + (!r.voided ? '<em><button class="lk" data-rr="' + r.id + '" data-need="post" style="font-size:11.5px">Reverse</button></em>' : '') + '</span></div>'; }).join('') : '') + '</article>' +
          '<article class="card"><header class="card__h"><span class="card__t">' + I('clock', 16) + 'History</span></header>' + (trail.length ? '<div class="tl">' + trail.map(function (a) { return '<div class="tl__i"><span class="tl__d">' + I(a.action.indexOf('receipt') >= 0 ? 'cash' : a.action.indexOf('issue') >= 0 ? 'check' : a.action.indexOf('void') >= 0 ? 'x' : 'edit', 14) + '</span><span><b>' + esc(a.summary) + '</b><em>' + esc(a.actor.name) + ' · ' + f.date(a.at) + '</em></span></div>'; }).join('') + '</div>' : '<p class="muted small">Created ' + f.date(inv.issue) + ' — before the demo’s audit window.</p>') + '</article></aside></div>';
      if (innerWidth < 1180) v.querySelector('#ig').style.gridTemplateColumns = 'minmax(0,1fr)';
      v.onclick = function (e) {
        var x = e.target.closest('[data-x]'), rr = e.target.closest('[data-rr]');
        if (rr) { var r = st.S.receipts.filter(function (z) { return z.id === rr.dataset.rr; })[0]; CL.confirm({ title: 'Reverse ' + r.no + '?', text: 'Posts Dr Accounts Receivable / Cr ' + esc(E.account(r.accountId).name) + ' for ' + f.money(r.amount) + ' — for a bounced payment or a receipt recorded in error. The invoice becomes open again.', ok: 'Reverse receipt', icon: 'reverse', tone: 'a', input: { label: 'Reason', required: true, placeholder: 'e.g. Cheque returned unpaid' }, onOk: function (reason, panel) { return st.act(function () { E.reverseReceipt(r.id, reason); }, r.no + ' reversed', panel) !== false; } }); return; }
        if (!x) return;
        if (x.dataset.x === 'issue') CL.confirm({ title: 'Issue ' + inv.no + '?', text: 'This posts <b>' + f.money(t.total) + '</b> to Accounts Receivable for ' + esc(c.name) + ', dated ' + f.date(inv.issue) + '. Issued invoices cannot be edited — only voided.', ok: 'Issue and post', icon: 'invoice', onOk: function () { return st.act(function () { E.issueInvoice(inv.id); }, inv.no + ' issued and posted') !== false; } });
        if (x.dataset.x === 'pay') CL.receiptModal(inv.id);
        if (x.dataset.x === 'void') { if (inv.status === 'draft') CL.confirm({ title: 'Discard draft ' + inv.no + '?', text: 'The number stays used so the sequence has no gaps; the invoice is marked void.', ok: 'Discard', tone: 'r', icon: 'trash', onOk: function () { st.act(function () { E.voidInvoice(inv.id); }, inv.no + ' voided'); } }); else CL.confirm({ title: 'Void ' + inv.no + '?', text: 'C-Ledger posts a reversal of the invoice entry, removing the receivable and the revenue. The invoice stays on file, marked void.', ok: 'Void invoice', tone: 'r', icon: 'x', input: { label: 'Reason', required: true, placeholder: 'e.g. Issued to the wrong customer' }, onOk: function (reason, panel) { return st.act(function () { E.voidInvoice(inv.id, reason); }, inv.no + ' voided', panel) !== false; } }); }
      };
    }
  };
  function paper(inv) {
    var E = st.E, co = st.S.settings.company, c = E.contact(inv.contactId), t = E.invoiceTotals(inv), s = E.invoiceStatus(inv, st.today()), out = E.invoiceOutstanding(inv);
    var taxBy = {}; inv.lines.forEach(function (l, i) { var r = E.taxRate(l.taxId); if (t.lines[i].tax) taxBy[r.name] = (taxBy[r.name] || 0) + t.lines[i].tax; });
    return '<article class="paper"><div class="paper__h"><div class="paper__co"><span class="paper__lg">' + esc(co.initials) + '</span><div><b style="font-size:16px">' + esc(co.name) + '</b><div class="muted">' + esc(co.address) + '<br>PIN ' + esc(co.pin) + ' · ' + esc(co.email) + '</div></div></div>' +
      '<div style="text-align:right"><h2>Invoice</h2><div class="muted">' + inv.no + '</div>' + (s === 'paid' ? '<div style="margin-top:8px"><span class="stamp">Paid</span></div>' : s === 'void' ? '<div style="margin-top:8px"><span class="stamp stamp--n">Void</span></div>' : s === 'draft' ? '<div style="margin-top:8px"><span class="stamp stamp--n">Draft</span></div>' : s === 'overdue' ? '<div style="margin-top:8px"><span class="stamp stamp--r">Overdue</span></div>' : '') + '</div></div>' +
      '<div class="paper__meta"><div><b>Bill to</b>' + esc(c.name) + '<br><span class="muted">' + esc(c.contact || '') + '<br>' + esc(c.address || '') + '</span></div><div><b>Issue date</b>' + f.date(inv.issue) + '<br><b style="margin-top:8px">Due date</b>' + f.date(inv.due) + '</div><div><b>Customer ref</b>' + esc(c.ref) + (inv.ref ? '<br><b style="margin-top:8px">Your reference</b>' + esc(inv.ref) : '') + '</div></div>' +
      '<div style="overflow-x:auto"><table><thead><tr><th>Description</th><th class="r">Qty</th><th class="r">Unit price</th><th class="r pp-o">Disc.</th><th class="r pp-o">Tax</th><th class="r">Amount</th></tr></thead><tbody>' +
      inv.lines.map(function (l, i) { return '<tr><td>' + esc(l.desc) + '</td><td class="r">' + (+l.qty) + '</td><td class="r">' + f.num(+l.price) + '</td><td class="r pp-o">' + (+l.disc ? l.disc + '%' : '—') + '</td><td class="r pp-o">' + esc(E.taxRate(l.taxId).name) + '</td><td class="r">' + f.num(t.lines[i].net) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
      '<div class="tot"><div><span>Subtotal</span><b>' + f.num(t.subtotal) + '</b></div>' + (t.discount ? '<div><span>Discount</span><b>−' + f.num(t.discount) + '</b></div>' : '') + Object.keys(taxBy).map(function (k) { return '<div><span>' + esc(k) + '</span><b>' + f.num(taxBy[k]) + '</b></div>'; }).join('') + '<div class="tot__g"><span>Total ' + f.cur() + '</span><b>' + f.num(t.total) + '</b></div>' + (inv.status !== 'draft' && inv.status !== 'void' ? '<div><span>Paid</span><b>' + f.num(E.invoicePaid(inv)) + '</b></div><div style="font-weight:800"><span>Balance due</span><b>' + f.num(out) + '</b></div>' : '') + '</div>' +
      (inv.notes ? '<p style="margin-top:16px;font-size:13px">' + esc(inv.notes) + '</p>' : '') +
      '<div class="paper__f">' + esc(st.S.settings.invoice.footer) + '<br>Sample invoice generated by the C-Ledger demo — fictional company and customer.</div></article>';
  }

  function editor(v, inv, q) {
    var E = st.E, S = st.S, T = st.today();
    if (inv && inv.status !== 'draft') { location.hash = '#/invoice/' + inv.id; return; }
    var custs = S.contacts.filter(function (c) { return c.kind === 'customer' && c.status === 'active'; });
    var d = inv ? JSON.parse(JSON.stringify({ contactId: inv.contactId, issue: inv.issue, due: inv.due, ref: inv.ref, notes: inv.notes, lines: inv.lines })) : { contactId: q.customer || '', issue: T, due: CL.addDays(T, S.settings.invoice.terms), ref: '', notes: '', lines: [{ desc: '', accountId: E.def('revenue').id, qty: 1, price: 0, disc: 0, taxId: 'vat16' }] };
    var revOpts = function (val) { return CL.select('acc', CL.accountOptions(function (a) { return a.type === 'income'; }), val, ' class="cell-in" aria-label="Revenue account"'); };
    var taxOpts = function (val) { return CL.select('tax', S.settings.taxRates.map(function (r) { return { v: r.id, l: r.name }; }), val, ' class="cell-in" aria-label="Tax"'); };
    function rowH(l, i) { return '<tr data-i="' + i + '"><td style="min-width:200px"><input class="cell-in" name="desc" value="' + esc(l.desc) + '" placeholder="Description" aria-label="Description"></td><td style="min-width:180px">' + revOpts(l.accountId) + '</td><td class="num" data-l="Qty" style="width:80px"><input class="cell-in" name="qty" inputmode="decimal" value="' + (l.qty || '') + '" aria-label="Quantity"></td><td class="num" data-l="Unit price" style="width:130px"><input class="cell-in" name="price" inputmode="decimal" value="' + (l.price ? f.input(l.price) : '') + '" placeholder="0.00" aria-label="Unit price"></td><td class="num" data-l="Disc. %" style="width:76px"><input class="cell-in" name="disc" inputmode="decimal" value="' + (l.disc || '') + '" placeholder="0" aria-label="Discount %"></td><td class="num" data-l="Tax" style="width:130px">' + taxOpts(l.taxId) + '</td><td class="num" data-l="Amount" style="width:120px;text-align:right;font-weight:700;padding-right:8px" data-amt>—</td><td class="x"><button type="button" class="ib ib--sm" data-x="rm" aria-label="Remove line"' + (d.lines.length <= 1 ? ' disabled' : '') + '>' + I('x', 15) + '</button></td></tr>'; }
    v.innerHTML = '<a class="crumb" href="' + (inv ? '#/invoice/' + inv.id : '#/invoices') + '">' + I('left', 14) + (inv ? inv.no : 'Invoices') + '</a><header class="ph"><div><h1>' + (inv ? 'Edit ' + inv.no : 'New invoice') + '</h1><p>Save as a draft, or issue it now to post it to the ledger.</p></div></header>' +
      '<form class="je" id="ivf" novalidate><div class="g"><article class="card"><div class="fg3">' +
        CL.field('Customer *', CL.select('contactId', [{ v: '', l: 'Choose customer…' }].concat(custs.map(function (c) { return { v: c.id, l: c.name }; })), d.contactId)) +
        '<label class="fld"><span>Issue date *</span><input type="date" name="issue" value="' + d.issue + '"></label><label class="fld"><span>Due date *</span><input type="date" name="due" value="' + d.due + '"></label>' +
        CL.field('Customer reference / PO', '<input name="ref" value="' + esc(d.ref || '') + '" placeholder="Optional">', '', 'full') + '</div><div id="custNote"></div></article>' +
        '<article class="card"><header class="card__h"><span class="card__t">' + I('invoice', 16) + 'Line items</span></header><div style="overflow-x:auto"><table class="jl"><thead><tr><th>Description</th><th>Revenue account</th><th style="text-align:right">Qty</th><th style="text-align:right">Unit price</th><th style="text-align:right">Disc. %</th><th>Tax</th><th style="text-align:right">Amount</th><th></th></tr></thead><tbody id="ilb">' + d.lines.map(rowH).join('') + '</tbody></table></div><button type="button" class="btn btn--soft btn--sm" data-x="add" style="margin-top:8px">' + I('plus', 15) + 'Add line</button></article>' +
        '<article class="card">' + CL.field('Notes on the invoice', '<textarea name="notes" rows="2" placeholder="e.g. Deposit of 40% before work starts">' + esc(d.notes || '') + '</textarea>') + '</article></div>' +
        '<aside class="jt"><article class="card"><header class="card__h"><span class="card__t">' + I('cash', 16) + 'Summary</span></header><div id="itot"></div><div class="form-err" hidden></div>' +
        '<div class="g" style="gap:8px;margin-top:12px"><button type="button" class="btn btn--p" data-x="issue" data-need="post">' + I('check', 16) + 'Save and issue</button><button type="button" class="btn" data-x="save">' + I('edit', 16) + 'Save draft</button><a class="btn btn--ghost" href="' + (inv ? '#/invoice/' + inv.id : '#/invoices') + '">Cancel</a></div></article>' +
        '<div class="note" style="margin-top:12px">' + I('info', 15) + '<span>Line amounts are rounded once, to the cent, after quantity and discount; VAT is then calculated per line.</span></div></aside></form>';
    var form = v.querySelector('#ivf');
    function read() {
      d.contactId = form.contactId.value; d.issue = form.issue.value; d.due = form.due.value; d.ref = form.ref.value; d.notes = form.notes.value; var bad = false;
      v.querySelectorAll('#ilb tr').forEach(function (tr, i) {
        var l = d.lines[i], qty = parseFloat(tr.querySelector('[name=qty]').value), price = f.parse(tr.querySelector('[name=price]').value), disc = parseFloat(tr.querySelector('[name=disc]').value || 0);
        l.desc = tr.querySelector('[name=desc]').value; l.accountId = tr.querySelector('[name=acc]').value; l.taxId = tr.querySelector('[name=tax]').value;
        l.qty = isNaN(qty) ? 0 : qty; l.price = isNaN(price) ? 0 : price; l.disc = isNaN(disc) ? 0 : disc;
        tr.querySelector('[name=price]').setAttribute('aria-invalid', isNaN(price) ? 'true' : 'false'); if (isNaN(price)) bad = true;
      });
      return bad;
    }
    function tot() {
      read(); var t = E.invoiceTotals({ lines: d.lines });
      v.querySelectorAll('#ilb tr').forEach(function (tr, i) { tr.querySelector('[data-amt]').textContent = f.num(t.lines[i].net); });
      v.querySelector('#itot').innerHTML = '<div class="jt__row"><span>Subtotal</span><b>' + f.num(t.subtotal) + '</b></div>' + (t.discount ? '<div class="jt__row"><span>Discount</span><b>−' + f.num(t.discount) + '</b></div>' : '') + '<div class="jt__row"><span>VAT</span><b>' + f.num(t.tax) + '</b></div><div class="jt__row" style="font-size:16px"><span style="color:var(--ink)">Total</span><b>' + f.money(t.total) + '</b></div>';
      var c = d.contactId ? E.contact(d.contactId) : null, cn = v.querySelector('#custNote');
      if (c) { var bal = E.customerBalance(c.id), od = S.invoices.filter(function (i) { return i.contactId === c.id && E.invoiceStatus(i, T) === 'overdue'; }); cn.innerHTML = '<div class="note' + (od.length ? ' note--a' : '') + '" style="margin-top:12px">' + I(od.length ? 'alert' : 'info', 15) + '<span>' + esc(c.name) + ' currently owes ' + f.money(bal) + (od.length ? ' — ' + od.length + ' invoice' + (od.length > 1 ? 's' : '') + ' overdue' : '') + '. Terms: ' + c.terms + ' days.</span></div>'; } else cn.innerHTML = '';
    }
    form.addEventListener('input', tot);
    form.contactId.addEventListener('change', function () { var c = E.contact(form.contactId.value); if (c && !inv) form.due.value = CL.addDays(form.issue.value || T, c.terms); tot(); });
    form.addEventListener('click', function (e) {
      var x = e.target.closest('[data-x]'); if (!x) return;
      if (x.dataset.x === 'add') { read(); d.lines.push({ desc: '', accountId: E.def('revenue').id, qty: 1, price: 0, disc: 0, taxId: 'vat16' }); v.querySelector('#ilb').innerHTML = d.lines.map(rowH).join(''); tot(); }
      if (x.dataset.x === 'rm') { read(); d.lines.splice(+x.closest('tr').dataset.i, 1); v.querySelector('#ilb').innerHTML = d.lines.map(rowH).join(''); tot(); }
      if (x.dataset.x === 'save' || x.dataset.x === 'issue') {
        if (read()) { CL.toast('Fix the highlighted prices first.', 'err'); return; }
        form.querySelector('.form-err').hidden = true;
        var data = JSON.parse(JSON.stringify(d));
        if (x.dataset.x === 'save') { var sv = st.act(function () { return E.saveInvoice(data, inv && inv.id); }, inv ? 'Draft updated' : 'Draft invoice saved', form); if (sv) location.hash = '#/invoice/' + sv.id; return; }
        var tt = E.invoiceTotals({ lines: data.lines });
        CL.confirm({ title: 'Issue this invoice?', text: 'Posts <b>' + f.money(tt.total) + '</b> to Accounts Receivable. Issued invoices cannot be edited.', ok: 'Issue and post', icon: 'invoice', onOk: function () {
          var r = st.act(function () { var x2 = E.saveInvoice(data, inv && inv.id); try { E.issueInvoice(x2.id); } catch (er) { if (!inv) { S.invoices.splice(S.invoices.indexOf(x2), 1); S.settings.numbering.invoice.next--; S.rev++; } throw er; } return x2; }, function (x2) { return x2.no + ' issued and posted'; }, form);
          if (r) location.hash = '#/invoice/' + r.id; else CL.close();
        } });
      }
    });
    tot();
  }

  /* =================== RECEIPT MODAL =================== */
  CL.receiptModal = function (invoiceId) {
    var E = st.E, S = st.S, T = st.today();
    var open = S.invoices.filter(function (i) { return E.invoiceOutstanding(i) > 0; }).sort(function (a, b) { return a.due < b.due ? -1 : 1; });
    if (!open.length) { CL.toast('No open invoices to receive against.', 'info'); return; }
    var inv = invoiceId ? E.invoice(invoiceId) : open[0], k = key();
    var p = CL.open('modal', CL.head('Record a receipt', 'Money received from a customer against an invoice.', 'arrowDown') +
      '<form class="ovl__body" id="rf" novalidate><div class="fg">' +
      CL.field('Invoice *', CL.select('invoiceId', open.map(function (i) { return { v: i.id, l: i.no + ' · ' + E.contact(i.contactId).name + ' · ' + f.num(E.invoiceOutstanding(i)) + ' due' }; }), inv.id), '', 'full') +
      CL.field('Amount received *', CL.moneyInput('amount', E.invoiceOutstanding(inv), ' autofocus')) +
      '<label class="fld"><span>Date received *</span><input type="date" name="date" value="' + T + '"></label>' +
      CL.field('Deposited to *', CL.select('accountId', E.cashAccounts().map(function (a) { return { v: a.id, l: a.name }; }), E.def('bank').id)) +
      CL.field('Method', CL.select('method', ['Bank transfer', 'RTGS', 'Cheque', 'Mobile money', 'Cash', 'Card'].map(function (m) { return { v: m, l: m }; }), 'Bank transfer')) +
      CL.field('Reference', '<input name="reference" placeholder="e.g. bank transaction code">', '', 'full') +
      '<label class="chk full" id="ovc" hidden><input type="checkbox" name="asCredit"><span><b>Record the excess as a customer credit</b><em>The difference is held in Customer Credits (a liability) until refunded or applied.</em></span></label>' +
      '</div><div id="rprev"></div><div class="form-err" hidden></div></form><div class="ovl__f"><button class="btn" data-close>Cancel</button><button class="btn btn--p" data-x="ok">' + I('check', 16) + 'Record receipt</button></div>', { label: 'Record receipt' });
    var form = p.querySelector('#rf');
    function upd(e) {
      var i = E.invoice(form.invoiceId.value), out = E.invoiceOutstanding(i), amt = f.parse(form.amount.value), bank = E.account(form.accountId.value);
      if (e && e.target.name === 'invoiceId') { form.amount.value = f.input(out); amt = out; }
      var ex = amt > out ? amt - out : 0; p.querySelector('#ovc').hidden = !ex;
      p.querySelector('#rprev').innerHTML = isNaN(amt) || amt <= 0 ? '' : '<div class="note note--g">' + I('ledger', 15) + '<span>Posts <b>Dr ' + esc(bank.name) + ' ' + f.num(amt) + '</b> / <b>Cr Accounts Receivable ' + f.num(Math.min(amt, out)) + '</b>' + (ex ? ' / <b>Cr Customer Credits ' + f.num(ex) + '</b>' : '') + '. Revenue was recorded when the invoice was issued, so it is not touched. ' + (amt < out ? 'Leaves ' + f.num(out - amt) + ' outstanding.' : ex ? '' : 'Clears the invoice.') + '</span></div>';
    }
    form.addEventListener('input', upd); form.addEventListener('change', upd); upd();
    p.querySelector('[data-x=ok]').onclick = function (ev) {
      var btn = ev.currentTarget; if (btn.disabled) return; var d = CL.formData(form); d.amount = f.parse(d.amount); d.key = k;
      if (isNaN(d.amount)) { CL.try(function () { var er = new Error('Enter the amount with at most 2 decimals.'); er.userFacing = true; er.field = 'amount'; throw er; }, null, form); return; }
      btn.disabled = true; var r = st.act(function () { return E.recordReceipt(d); }, function (r) { return r.no + ' recorded — ' + f.money(r.amount); }, form); btn.disabled = false; if (r) CL.close();
    };
  };

  /* =================== CUSTOMERS & SUPPLIERS (shared) =================== */
  function directory(kind) {
    return {
      render: function (v, p, q) {
        var E = st.E, S = st.S, T = st.today(), F = U(kind + 's', { q: '', filter: 'all', sort: 'name', dir: 'asc', page: 1 }), isC = kind === 'customer';
        var list = S.contacts.filter(function (c) { return c.kind === kind; }).map(function (c) {
          var bal = isC ? E.customerBalance(c.id) : E.supplierBalance(c.id), docs = isC ? S.invoices.filter(function (i) { return i.contactId === c.id; }) : S.bills.filter(function (b) { return b.contactId === c.id; });
          var od = docs.filter(function (d) { return (isC ? E.invoiceStatus(d, T) : E.billStatus(d, T)) === 'overdue'; }).length;
          var fyS = E.fyOf(T).start, vol = docs.filter(function (d) { return d.status !== 'draft' && d.status !== 'void' && d.issue >= fyS; }).reduce(function (t, d) { return t + (isC ? E.invoiceTotals(d).total : E.billTotals(d).total); }, 0);
          var last = docs.filter(function (d) { return d.status !== 'draft'; }).sort(function (a, b) { return a.issue < b.issue ? 1 : -1; })[0];
          return { c: c, bal: bal, od: od, vol: vol, last: last ? last.issue : '' };
        });
        var s = F.q.trim().toLowerCase();
        var rows = list.filter(function (r) { if (F.filter === 'owing' && r.bal <= 0) return false; if (F.filter === 'overdue' && !r.od) return false; if (F.filter === 'archived' ? r.c.status !== 'archived' : r.c.status === 'archived' && F.filter !== 'all') return false; if (s && (r.c.name + ' ' + r.c.ref + ' ' + r.c.contact + ' ' + r.c.email + ' ' + r.c.address).toLowerCase().indexOf(s) < 0) return false; return true; });
        var tot = list.reduce(function (t, r) { return t + r.bal; }, 0);
        v.innerHTML = '<header class="ph"><div><h1>' + (isC ? 'Customers' : 'Suppliers') + '</h1><p>Balances are calculated from ' + (isC ? 'Accounts Receivable' : 'Accounts Payable') + ' lines tagged to each ' + kind + ' — total ' + f.money(tot) + '.</p></div><div class="ph__a"><button class="btn" data-x="csv">' + I('download', 16) + 'Export CSV</button><button class="btn btn--p" data-x="new" data-need="draft">' + I('plus', 16) + 'New ' + kind + '</button></div></header>' +
          '<div class="chips">' + [['all', 'All'], ['owing', isC ? 'Owes you' : 'You owe'], ['overdue', 'Overdue']].map(function (c) { return '<button class="chip' + (F.filter === c[0] ? ' is-on' : '') + '" data-f="' + c[0] + '">' + c[1] + '</button>'; }).join('') + '</div>' +
          '<div class="fb"><label class="s">' + I('search', 16) + '<input name="q" placeholder="Search name, contact, email or reference" value="' + esc(F.q) + '"></label></div>' +
          CL.table(rows, [
            { k: 'name', label: isC ? 'Customer' : 'Supplier', sort: function (r) { return r.c.name.toLowerCase(); }, cell: function (r) { return '<span class="t-who">' + CL.cav(r.c, 30) + '<span><a class="lk" href="#/' + kind + '/' + r.c.id + '">' + esc(r.c.name) + '</a><span class="sub">' + esc(r.c.ref) + ' · ' + esc(r.c.contact || '') + '</span></span></span>'; } },
            { k: 'email', label: 'Contact', cell: function (r) { return '<span class="nowrap">' + esc(r.c.phone) + '</span><span class="sub">' + esc(r.c.email) + '</span>'; } },
            { k: 'terms', label: 'Terms', sort: function (r) { return r.c.terms; }, cell: function (r) { return r.c.terms + ' days'; } },
            { k: 'vol', label: (isC ? 'Invoiced' : 'Billed') + ' (FY)', cls: 'r', sort: function (r) { return r.vol; }, cell: function (r) { return f.num(r.vol); } },
            { k: 'last', label: 'Last ' + (isC ? 'invoice' : 'bill'), sort: function (r) { return r.last; }, cell: function (r) { return r.last ? '<span class="nowrap">' + f.date(r.last) + '</span>' : '<span class="muted">—</span>'; } },
            { k: 'bal', label: 'Balance', cls: 'r', sort: function (r) { return r.bal; }, cell: function (r) { return (r.bal ? '<b>' + f.num(r.bal, true) + '</b>' : '<span class="muted">0.00</span>') + (r.od ? '<span class="sub neg">' + r.od + ' overdue</span>' : ''); } }
          ], F, { per: 25, rowAttr: function (r) { return 'data-href="#/' + kind + '/' + r.c.id + '"'; } });
        CL.tableEvents(v, F, function () { CL.pages[kind + 's'].render(v, p, q); });
        var qi = v.querySelector('[name=q]'), tmr; qi.oninput = function () { clearTimeout(tmr); tmr = setTimeout(function () { F.q = qi.value; F.page = 1; CL.pages[kind + 's'].render(v, p, q); var n = v.querySelector('[name=q]'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 200); };
        v.onclick = function (e) {
          var c = e.target.closest('[data-f]'); if (c) { F.filter = c.dataset.f; F.page = 1; CL.pages[kind + 's'].render(v, p, q); return; }
          if (e.target.closest('[data-x=new]')) { CL.contactForm(kind); return; }
          if (e.target.closest('[data-x=csv]')) { CL.csv('c-ledger-' + kind + 's.csv', [['Reference', 'Name', 'Contact person', 'Email', 'Phone', 'Address', 'Terms (days)', 'Balance', 'Overdue documents']].concat(rows.map(function (r) { return [r.c.ref, r.c.name, r.c.contact, r.c.email, r.c.phone, r.c.address, r.c.terms, CL.csvMoney(r.bal), r.od]; }))); return; }
          var tr = e.target.closest('tr[data-href]'); if (tr && !e.target.closest('a,button')) location.hash = tr.dataset.href;
        };
      }
    };
  }
  CL.pages.customers = directory('customer');
  CL.pages.suppliers = directory('supplier');

  CL.contactForm = function (kind, c) {
    var E = st.E;
    var p = CL.open('modal', CL.head(c ? 'Edit ' + kind : 'New ' + kind, c ? esc(c.ref) : 'Details used on ' + (kind === 'customer' ? 'invoices' : 'bills') + ' and statements.', kind === 'customer' ? 'customers' : 'suppliers') +
      '<form class="ovl__body" id="cf" novalidate><div class="fg">' + CL.field('Name *', '<input name="name" value="' + esc(c ? c.name : '') + '" autofocus>', '', 'full') + CL.field('Contact person', '<input name="contact" value="' + esc(c ? c.contact : '') + '">') + CL.field('Payment terms (days)', '<input name="terms" inputmode="numeric" value="' + (c ? c.terms : 30) + '">') +
      CL.field('Email', '<input name="email" type="email" value="' + esc(c ? c.email : '') + '">') + CL.field('Phone', '<input name="phone" value="' + esc(c ? c.phone : '') + '">') + CL.field('Address', '<input name="address" value="' + esc(c ? c.address : '') + '">', '', 'full') + CL.field('Tax PIN', '<input name="pin" value="' + esc(c ? c.pin || '' : '') + '">') + CL.field('Notes', '<textarea name="notes" rows="2">' + esc(c ? c.notes : '') + '</textarea>', '', 'full') + '</div><div class="form-err" hidden></div></form>' +
      '<div class="ovl__f"><button class="btn" data-close>Cancel</button><button class="btn btn--p" data-x="ok">' + I('check', 16) + (c ? 'Save' : 'Add ' + kind) + '</button></div>', { label: kind });
    p.querySelector('[data-x=ok]').onclick = function () { var form = p.querySelector('#cf'), d = CL.formData(form); d.kind = kind; var r = st.act(function () { return E.saveContact(d, c && c.id); }, c ? 'Saved' : d.name + ' added', form); if (r) { CL.close(); if (!c) location.hash = '#/' + kind + '/' + r.id; } };
  };

  function contactDetail(kind) {
    return {
      render: function (v, p) {
        var E = st.E, S = st.S, T = st.today(), c = E.contact(p[0]), isC = kind === 'customer';
        if (!c) { v.innerHTML = CL.empty('customers', 'Not found', '', '<a class="btn" href="#/' + kind + 's">Back</a>'); return; }
        var docs = (isC ? S.invoices : S.bills).filter(function (d) { return d.contactId === c.id; }).sort(function (a, b) { return a.issue < b.issue ? 1 : -1; });
        var pays = (isC ? S.receipts : S.payments).filter(function (x) { return x.contactId === c.id; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
        var bal = isC ? E.customerBalance(c.id) : E.supplierBalance(c.id), od = docs.filter(function (d) { return (isC ? E.invoiceStatus(d, T) : E.billStatus(d, T)) === 'overdue'; });
        var fyS = E.fyOf(T).start, vol = docs.filter(function (d) { return d.status !== 'draft' && d.status !== 'void' && d.issue >= fyS; }).reduce(function (t, d) { return t + (isC ? E.invoiceTotals(d).total : E.billTotals(d).total); }, 0);
        var paidOnTime = isC ? pays.filter(function (r) { var i = E.invoice(r.invoiceId); return i && r.date <= i.due; }).length : 0;
        var credit = isC ? E.postedLines().filter(function (l) { return l.accountId === E.def('custCredit').id && l.contactId === c.id; }).reduce(function (t, l) { return t + l.credit - l.debit; }, 0) : 0;
        v.innerHTML = '<a class="crumb" href="#/' + kind + 's">' + I('left', 14) + (isC ? 'Customers' : 'Suppliers') + '</a>' +
          '<div class="dh"><div style="display:flex;gap:14px;align-items:center">' + CL.cav(c, 52) + '<div><h1>' + esc(c.name) + '</h1><div class="dh__s"><span>' + esc(c.ref) + '</span><span>' + esc(c.contact || '') + '</span><span>' + c.terms + '-day terms</span></div></div></div>' +
          '<div class="dh__a"><button class="btn" data-x="edit" data-need="draft">' + I('edit', 16) + 'Edit</button><button class="btn" data-x="stmt">' + I('download', 16) + 'Statement CSV</button>' + (isC ? '<a class="btn btn--p" href="#/invoice/new?customer=' + c.id + '" data-need="draft">' + I('plus', 16) + 'New invoice</a>' : '<a class="btn btn--p" href="#/bill/new?supplier=' + c.id + '" data-need="draft">' + I('plus', 16) + 'New bill</a>') + '</div></div>' +
          '<div class="ss"><div class="st st--g"><span>' + (isC ? 'Owes you' : 'You owe') + '</span><b>' + f.money(bal, true) + '</b><em>from posted ledger lines</em></div><div class="st' + (od.length ? ' st--r' : '') + '"><span>Overdue</span><b>' + f.money(od.reduce(function (t, d) { return t + (isC ? E.invoiceOutstanding(d) : E.billOutstanding(d)); }, 0)) + '</b><em>' + f.plural(od.length, isC ? 'invoice' : 'bill') + '</em></div><div class="st"><span>' + (isC ? 'Invoiced' : 'Billed') + ' this FY</span><b>' + f.money(vol) + '</b></div><div class="st"><span>' + (isC ? 'Paid on time' : 'Payments made') + '</span><b>' + (isC ? (pays.length ? Math.round(paidOnTime / pays.length * 100) + '%' : '—') : pays.length) + '</b>' + (credit ? '<em>Credit on account ' + f.money(credit) + '</em>' : '') + '</div></div>' +
          '<div class="g" style="grid-template-columns:minmax(0,1fr) 320px;align-items:start" id="cg"><div class="g">' +
            '<article class="card"><header class="card__h"><span class="card__t">' + I(isC ? 'invoice' : 'bill', 16) + (isC ? 'Invoices' : 'Bills') + '</span></header>' + CL.table(docs, [
              { k: 'no', label: 'Number', cell: function (d) { return '<a class="ref" href="#/' + (isC ? 'invoice' : 'bill') + '/' + d.id + '">' + d.no + '</a>'; } },
              { k: 'i', label: 'Issued', cell: function (d) { return '<span class="nowrap">' + f.date(d.issue) + '</span>'; } },
              { k: 'd', label: 'Due', cell: function (d) { return '<span class="nowrap">' + f.date(d.due) + '</span>'; } },
              { k: 't', label: 'Total', cls: 'r', cell: function (d) { return f.num(isC ? E.invoiceTotals(d).total : E.billTotals(d).total); } },
              { k: 'o', label: 'Outstanding', cls: 'r', cell: function (d) { var o = isC ? E.invoiceOutstanding(d) : E.billOutstanding(d); return o ? '<b>' + f.num(o) + '</b>' : '<span class="muted">—</span>'; } },
              { k: 's', label: 'Status', cell: function (d) { return CL.status(isC ? E.invoiceStatus(d, T) : E.billStatus(d, T)); } }
            ], {}, { all: true, rowAttr: function (d) { return 'data-href="#/' + (isC ? 'invoice' : 'bill') + '/' + d.id + '"'; }, empty: 'No ' + (isC ? 'invoices' : 'bills') + ' yet.' }) + '</article>' +
            '<article class="card"><header class="card__h"><span class="card__t">' + I('cash', 16) + 'Payment history</span></header>' + CL.table(pays, [
              { k: 'no', label: 'Reference', cell: function (x) { return '<a class="ref" href="#/journal/' + x.journalId + '">' + x.no + '</a>' + (x.voided ? ' ' + CL.status('reversed') : ''); } },
              { k: 'd', label: 'Date', cell: function (x) { return '<span class="nowrap">' + f.date(x.date) + '</span>'; } },
              { k: 'doc', label: isC ? 'Invoice' : 'Bill', cell: function (x) { var d = isC ? E.invoice(x.invoiceId) : E.bill(x.billId); return d ? '<a class="lk" href="#/' + (isC ? 'invoice' : 'bill') + '/' + d.id + '">' + d.no + '</a>' : '—'; } },
              { k: 'm', label: 'Method', cell: function (x) { return esc(x.method) + '<span class="sub">' + esc(E.account(x.accountId).name) + '</span>'; } },
              { k: 'a', label: 'Amount', cls: 'r', cell: function (x) { return f.num(x.amount); } }
            ], {}, { all: true, empty: 'No payments recorded.' }) + '</article></div>' +
          '<aside class="g"><article class="card"><header class="card__h"><span class="card__t">' + I('info', 16) + 'Details</span></header><dl class="kv"><dt>Email</dt><dd><a class="lk" href="mailto:' + esc(c.email) + '">' + esc(c.email || '—') + '</a></dd><dt>Phone</dt><dd>' + esc(c.phone || '—') + '</dd><dt>Address</dt><dd>' + esc(c.address || '—') + '</dd><dt>Tax PIN</dt><dd>' + esc(c.pin || '—') + '</dd><dt>Since</dt><dd>' + f.date(c.since) + '</dd><dt>Status</dt><dd>' + CL.status(c.status) + '</dd></dl>' + (c.notes ? '<div class="note" style="margin-top:12px">' + I('info', 15) + '<span>' + esc(c.notes) + '</span></div>' : '') + '</article></aside></div>' +
          '<p class="muted small" style="margin-top:12px">' + I('info', 12) + ' Sample contact — fictional name, phone and email.</p>';
        if (innerWidth < 1180) v.querySelector('#cg').style.gridTemplateColumns = 'minmax(0,1fr)';
        v.onclick = function (e) {
          var x = e.target.closest('[data-x]');
          if (x && x.dataset.x === 'edit') { CL.contactForm(kind, c); return; }
          if (x && x.dataset.x === 'stmt') {
            var ctl = isC ? E.def('ar').id : E.def('ap').id, run = 0, lines = E.postedLines().filter(function (l) { return l.accountId === ctl && l.contactId === c.id; });
            CL.csv('statement-' + c.ref + '.csv', [['Date', 'Reference', 'Description', isC ? 'Charges' : 'Bills', 'Payments', 'Balance']].concat(lines.map(function (l) { var amt = isC ? l.debit - l.credit : l.credit - l.debit; run += amt; return [l.date, l.j.ref, l.j.desc, amt > 0 ? CL.csvMoney(amt) : '', amt < 0 ? CL.csvMoney(-amt) : '', CL.csvMoney(run)]; }))); return;
          }
          var tr = e.target.closest('tr[data-href]'); if (tr && !e.target.closest('a,button')) location.hash = tr.dataset.href;
        };
      }
    };
  }
  CL.pages.customer = contactDetail('customer');
  CL.pages.supplier = contactDetail('supplier');
})();
