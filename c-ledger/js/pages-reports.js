/* ============================================================
   C-Ledger — Financial reports (all derived from posted ledger lines)
   ============================================================ */
(function () {
  'use strict';
  var CL = window.CL, I = CL.icon, esc = CL.esc, f = CL.fmt, st = CL.store;
  var LIST = [
    ['profit-loss', 'Profit and loss', 'Income, cost of sales, expenses and net profit for a period.', 'trendUp'],
    ['balance-sheet', 'Balance sheet', 'Assets, liabilities and equity at a date — always in balance.', 'coa'],
    ['trial-balance', 'Trial balance', 'Every account’s debit or credit balance. Debits equal credits.', 'ledger'],
    ['cash-flow', 'Cash flow', 'Cash in and out by activity, from bank and cash transactions.', 'cash'],
    ['general-ledger', 'General ledger report', 'Account-by-account history with running balances.', 'journal'],
    ['ar-ageing', 'Receivables ageing', 'What customers owe, grouped by days past due.', 'customers'],
    ['ap-ageing', 'Payables ageing', 'What you owe suppliers, grouped by days past due.', 'suppliers'],
    ['expense-analysis', 'Expense analysis', 'Expenses by category and month.', 'expense']
  ];

  CL.pages.reports = {
    render: function (v) {
      var E = st.E, T = st.today(), tb = E.trialBalance(T), bs = E.balanceSheet(T);
      v.innerHTML = '<header class="ph"><div><h1>Financial reports</h1><p>Generated live from posted journal lines — nothing is typed in or stored separately.</p></div></header>' +
        '<div class="g g3 mb"><div class="st ' + (tb.diff ? 'st--r' : 'st--g') + '"><span>Trial balance</span><b>' + (tb.diff ? 'Off by ' + f.num(tb.diff) : 'Balanced') + '</b><em>' + f.money(tb.debit) + ' debits = credits</em></div><div class="st ' + (bs.check ? 'st--r' : 'st--g') + '"><span>Accounting equation</span><b>' + (bs.check ? 'Off by ' + f.num(bs.check) : 'Assets = Liabilities + Equity') + '</b><em>' + f.short(bs.totalAssets) + ' = ' + f.short(bs.totalLiabilities) + ' + ' + f.short(bs.totalEquity) + '</em></div><div class="st"><span>Posted entries</span><b>' + st.S.journals.filter(function (j) { return j.status === 'posted'; }).length + '</b><em>drafts excluded</em></div></div>' +
        '<div class="rcards">' + LIST.map(function (r) { return '<a class="rcard" href="#/reports/' + r[0] + '"><span class="lr__ic lr__ic--g">' + I(r[3], 18) + '</span><b>' + r[1] + '</b><p>' + r[2] + '</p><span class="lnk" style="margin-top:auto">Open ' + I('right', 14) + '</span></a>'; }).join('') + '</div>';
    }
  };

  function periodBar(R, o) {
    o = o || {};
    return '<div class="fb no-print"><label class="sel">' + CL.select('preset', st.PERIODS.map(function (p) { return { v: p[0], l: p[1] }; }).concat([{ v: 'custom', l: 'Custom dates' }]), R.id || 'custom') + I('down', 15) + '</label>' +
      (o.asOf ? '<span class="muted small" style="font-weight:700">As of</span><input type="date" name="to" value="' + R.to + '" aria-label="As of date">' : '<input type="date" name="from" value="' + R.from + '" aria-label="From"><span class="muted">–</span><input type="date" name="to" value="' + R.to + '" aria-label="To">') +
      (o.extra || '') + '<span class="fb__r"><button class="btn" onclick="print()">' + I('print', 16) + 'Print</button><button class="btn" data-x="csv">' + I('download', 16) + 'Export CSV</button></span></div>';
  }
  function head(title, sub, badge) { var co = st.S.settings.company; return '<div class="rp__h"><div><p style="font-weight:700;color:var(--ink-2)">' + esc(co.name) + '</p><h2>' + title + '</h2><p>' + sub + '</p></div>' + (badge || '') + '</div>'; }
  function money(c, cls) { return '<td class="r' + (cls ? ' ' + cls : '') + '">' + f.num(c, true) + '</td>'; }
  function okBadge(diff, okText, badText) { return diff ? '<span class="rp__ok rp__ok--r">' + I('alert', 14) + esc(badText) + ' ' + f.num(diff) + '</span>' : '<span class="rp__ok rp__ok--g">' + I('check', 14) + esc(okText) + '</span>'; }
  function accLink(a) { return a.id && a.id.charAt(0) !== '_' ? '<a class="lk" href="#/account/' + a.id + '">' + (a.code ? a.code + ' · ' : '') + esc(a.name) + '</a>' : esc(a.name); }

  CL.pages.report = {
    render: function (v, p, q) {
      var id = p[0], E = st.E, meta = LIST.filter(function (r) { return r[0] === id; })[0];
      if (!meta) { v.innerHTML = CL.empty('reports', 'Unknown report', '', '<a class="btn" href="#/reports">All reports</a>'); return; }
      var S0 = st.ui['rep:' + id] = st.ui['rep:' + id] || { preset: q.p || (id === 'balance-sheet' || id === 'trial-balance' || id.indexOf('ageing') > 0 ? 'month' : 'fy') };
      var R = S0.preset === 'custom' ? { from: S0.from, to: S0.to, id: 'custom' } : st.range(S0.preset);
      if (S0.preset === 'custom' && (!S0.from || !S0.to)) { var d = st.range('fy'); R = { from: S0.from || d.from, to: S0.to || d.to, id: 'custom' }; }
      var out = { csv: [] }, body = '';
      var crumb = '<a class="crumb no-print" href="#/reports">' + I('left', 14) + 'Financial reports</a>';

      if (id === 'profit-loss') {
        var pl = E.profitAndLoss(R.from, R.to), cmp = R.prev ? E.profitAndLoss(R.prev.from, R.prev.to) : null;
        var pv = function (rows, a) { if (!cmp) return 0; var r = rows.filter(function (x) { return x.account.id === a.id; })[0]; return r ? r.amount : 0; };
        var sec = function (title, rows, crow, tot, ctot) { return '<tr class="is-grp"><td>' + title + '</td><td></td>' + (cmp ? '<td></td>' : '') + '</tr>' + rows.map(function (r) { out.csv.push([title, r.account.code, r.account.name, CL.csvMoney(r.amount), cmp ? CL.csvMoney(pv(crow, r.account)) : '']); return '<tr><td class="ind">' + accLink(r.account) + '</td>' + money(r.amount) + (cmp ? money(pv(crow, r.account), 'muted') : '') + '</tr>'; }).join('') + '<tr class="is-total"><td>Total ' + title.toLowerCase() + '</td>' + money(tot) + (cmp ? money(ctot, 'muted') : '') + '</tr>'; };
        body = head('Profit and loss', f.date(R.from) + ' to ' + f.date(R.to) + (cmp ? ' · compared with ' + esc(R.prev.label) : ''), '<span class="rp__ok rp__ok--' + (pl.net >= 0 ? 'g' : 'r') + '">' + (pl.net >= 0 ? 'Net profit ' : 'Net loss ') + f.money(Math.abs(pl.net)) + '</span>') +
          '<div class="t-wrap"><table class="t' + (cmp ? ' t--cmp' : '') + '"><thead><tr><th>Account</th><th class="r">' + esc(R.label || 'Selected period') + '</th>' + (cmp ? '<th class="r">' + esc(R.prev.label) + '</th>' : '') + '</tr></thead><tbody>' +
          sec('Income', pl.income, cmp && cmp.income, pl.totalIncome, cmp && cmp.totalIncome) + sec('Cost of sales', pl.cogs, cmp && cmp.cogs, pl.totalCogs, cmp && cmp.totalCogs) +
          '<tr class="is-total"><td>Gross profit' + (pl.totalIncome ? ' <span class="muted small">(' + f.pct(pl.grossProfit / pl.totalIncome) + ' margin)</span>' : '') + '</td>' + money(pl.grossProfit) + (cmp ? money(cmp.grossProfit, 'muted') : '') + '</tr>' +
          sec('Operating expenses', pl.opex, cmp && cmp.opex, pl.totalOpex, cmp && cmp.totalOpex) + '</tbody><tfoot><tr><td>Net ' + (pl.net >= 0 ? 'profit' : 'loss') + '</td>' + money(pl.net) + (cmp ? money(cmp.net) : '') + '</tr></tfoot></table></div>';
        out.csv.unshift(['Section', 'Code', 'Account', 'Amount', 'Comparison']); out.csv.push(['Net profit', '', '', CL.csvMoney(pl.net), cmp ? CL.csvMoney(cmp.net) : '']);
        out.name = 'profit-and-loss-' + R.from + '-to-' + R.to + '.csv';
      }
      else if (id === 'balance-sheet') {
        var bs = E.balanceSheet(R.to);
        var sec2 = function (t, rows, tot) { return '<tr class="is-grp"><td>' + t + '</td><td></td></tr>' + rows.map(function (r) { out.csv.push([t, r.account.code, r.account.name, CL.csvMoney(r.amount)]); return '<tr><td class="ind">' + accLink(r.account) + (r.computed ? ' <span class="muted small">calculated</span>' : '') + '</td>' + money(r.amount) + '</tr>'; }).join('') + '<tr class="is-total"><td>Total ' + t.toLowerCase() + '</td>' + money(tot) + '</tr>'; };
        body = head('Balance sheet', 'As of ' + f.date(R.to), okBadge(bs.check, 'Assets = Liabilities + Equity', 'Out of balance by')) +
          '<div class="t-wrap"><table class="t"><thead><tr><th>Account</th><th class="r">' + f.date(R.to) + '</th></tr></thead><tbody>' + sec2('Assets', bs.assets, bs.totalAssets) + sec2('Liabilities', bs.liabilities, bs.totalLiabilities) + sec2('Equity', bs.equity, bs.totalEquity) + '</tbody><tfoot><tr><td>Liabilities + equity</td>' + money(bs.totalLiabilities + bs.totalEquity) + '</tr></tfoot></table></div>' +
          '<p class="muted small" style="padding:12px 22px">' + I('info', 12) + ' Income and expense accounts are not closed with entries. Earnings from earlier financial years appear as retained earnings; this year’s as current year earnings.</p>';
        out.csv.unshift(['Section', 'Code', 'Account', 'Amount']); out.csv.push(['Check', '', 'Assets − (Liabilities + Equity)', CL.csvMoney(bs.check)]);
        out.name = 'balance-sheet-' + R.to + '.csv';
      }
      else if (id === 'trial-balance') {
        var tb = E.trialBalance(R.to);
        body = head('Trial balance', 'As of ' + f.date(R.to) + ' · posted entries only', okBadge(tb.diff, 'Debits equal credits', 'Out of balance by')) +
          '<div class="t-wrap"><table class="t"><thead><tr><th>Code</th><th>Account</th><th>Type</th><th class="r">Debit</th><th class="r">Credit</th></tr></thead><tbody>' + tb.rows.map(function (r) { out.csv.push([r.account.code, r.account.name, CL.TYPE_LABEL[r.account.type], r.debit ? CL.csvMoney(r.debit) : '', r.credit ? CL.csvMoney(r.credit) : '']); return '<tr><td class="mono">' + r.account.code + '</td><td>' + accLink({ id: r.account.id, name: r.account.name }) + '</td><td>' + CL.TYPE_LABEL[r.account.type] + '</td><td class="r">' + (r.debit ? f.num(r.debit) : '') + '</td><td class="r">' + (r.credit ? f.num(r.credit) : '') + '</td></tr>'; }).join('') + '</tbody><tfoot><tr><td colspan="3">Totals</td><td class="r">' + f.num(tb.debit) + '</td><td class="r">' + f.num(tb.credit) + '</td></tr></tfoot></table></div>';
        out.csv.unshift(['Code', 'Account', 'Type', 'Debit', 'Credit']); out.csv.push(['', 'Totals', '', CL.csvMoney(tb.debit), CL.csvMoney(tb.credit)]);
        out.name = 'trial-balance-' + R.to + '.csv';
      }
      else if (id === 'cash-flow') {
        var cf = E.cashFlow(R.from, R.to);
        var sec3 = function (t, s) { return '<tr class="is-grp"><td>' + t + '</td><td></td></tr>' + (s.rows.length ? s.rows.map(function (r) { out.csv.push([t, r.name, CL.csvMoney(r.amount)]); return '<tr><td class="ind">' + esc(r.name) + '</td>' + money(r.amount) + '</tr>'; }).join('') : '<tr><td class="ind muted">No cash movement</td><td></td></tr>') + '<tr class="is-total"><td>Net cash from ' + t.toLowerCase().replace(' activities', '') + ' activities</td>' + money(s.total) + '</tr>'; };
        body = head('Cash flow statement', f.date(R.from) + ' to ' + f.date(R.to) + ' · direct method', okBadge(cf.check, 'Reconciles to bank balances', 'Does not reconcile by')) +
          '<div class="t-wrap"><table class="t"><thead><tr><th>Activity</th><th class="r">Amount</th></tr></thead><tbody>' + sec3('Operating activities', cf.operating) + sec3('Investing activities', cf.investing) + sec3('Financing activities', cf.financing) +
          '<tr class="is-total"><td>Net change in cash</td>' + money(cf.net) + '</tr><tr><td>Cash and bank at ' + f.date(CL.addDays(R.from, -1)) + '</td>' + money(cf.opening) + '</tr></tbody><tfoot><tr><td>Cash and bank at ' + f.date(R.to) + '</td>' + money(cf.closing) + '</tr></tfoot></table></div>' +
          '<p class="muted small" style="padding:12px 22px">' + I('info', 12) + ' Method: every posted entry that changes a bank or cash account is classified by its other accounts (split in proportion when an entry has several). Transfers between your own accounts cancel out and are excluded.</p>';
        out.csv.unshift(['Section', 'Line', 'Amount']); out.csv.push(['', 'Net change in cash', CL.csvMoney(cf.net)], ['', 'Opening cash', CL.csvMoney(cf.opening)], ['', 'Closing cash', CL.csvMoney(cf.closing)]);
        out.name = 'cash-flow-' + R.from + '-to-' + R.to + '.csv';
      }
      else if (id === 'general-ledger') {
        var acc = E.account(S0.account) || E.def('bank'), gl = E.generalLedger(acc.id, R.from, R.to);
        body = head('General ledger — ' + esc(acc.code + ' ' + acc.name), f.date(R.from) + ' to ' + f.date(R.to)) +
          '<div class="t-wrap"><table class="t"><thead><tr><th>Date</th><th>Reference</th><th>Description</th><th class="r">Debit</th><th class="r">Credit</th><th class="r">Balance</th></tr></thead><tbody><tr class="is-muted"><td>' + f.date(R.from) + '</td><td></td><td>Opening balance</td><td></td><td></td>' + money(gl.opening) + '</tr>' +
          gl.rows.map(function (r) { out.csv.push([r.line.date, r.line.j.ref, r.line.j.desc, CL.csvMoney(r.line.debit || null), CL.csvMoney(r.line.credit || null), CL.csvMoney(r.balance)]); return '<tr><td class="nowrap">' + f.date(r.line.date) + '</td><td><a class="ref" href="#/journal/' + r.line.j.id + '">' + r.line.j.ref + '</a></td><td>' + esc(r.line.j.desc) + '</td><td class="r">' + (r.line.debit ? f.num(r.line.debit) : '') + '</td><td class="r">' + (r.line.credit ? f.num(r.line.credit) : '') + '</td>' + money(r.balance) + '</tr>'; }).join('') + '</tbody><tfoot><tr><td colspan="5">Closing balance</td>' + money(gl.closing) + '</tr></tfoot></table></div>';
        out.csv.unshift(['Date', 'Reference', 'Description', 'Debit', 'Credit', 'Balance'], ['', '', 'Opening balance', '', '', CL.csvMoney(gl.opening)]);
        out.name = 'general-ledger-' + acc.code + '-' + R.from + '-to-' + R.to + '.csv';
        out.extra = '<label class="sel">' + CL.select('account', CL.accountOptions(), acc.id) + I('down', 15) + '</label>';
      }
      else if (id === 'ar-ageing' || id === 'ap-ageing') {
        var isAR = id === 'ar-ageing', ag = E.ageing(isAR ? 'ar' : 'ap', R.to, st.S.settings.ageing), ctl = E.balance(E.def(isAR ? 'ar' : 'ap').id, R.to);
        body = head(isAR ? 'Receivables ageing' : 'Payables ageing', 'As of ' + f.date(R.to) + ' · by days past the due date', okBadge(ag.total - ctl, 'Agrees with ' + (isAR ? 'Accounts Receivable' : 'Accounts Payable'), 'Differs from the control account by')) +
          '<div class="t-wrap"><table class="t"><thead><tr><th>' + (isAR ? 'Customer' : 'Supplier') + '</th>' + ag.labels.map(function (l) { return '<th class="r">' + esc(l) + '</th>'; }).join('') + '<th class="r">Total</th></tr></thead><tbody>' +
          (ag.rows.length ? ag.rows.map(function (r) { out.csv.push([r.contact.name].concat(r.amounts.map(CL.csvMoney), [CL.csvMoney(r.total)])); return '<tr><td><a class="lk" href="#/' + (isAR ? 'customer' : 'supplier') + '/' + r.contact.id + '">' + esc(r.contact.name) + '</a><span class="sub">' + r.docs.map(function (d) { return d.doc.no; }).join(', ') + '</span></td>' + r.amounts.map(function (x, i) { return '<td class="r' + (x && i >= 2 ? ' neg' : '') + '">' + (x ? f.num(x) : '') + '</td>'; }).join('') + '<td class="r"><b>' + f.num(r.total) + '</b></td></tr>'; }).join('') : '<tr class="t-empty"><td colspan="' + (ag.labels.length + 2) + '">Nothing outstanding.</td></tr>') +
          '</tbody><tfoot><tr><td>Total</td>' + ag.totals.map(function (x) { return '<td class="r">' + f.num(x) + '</td>'; }).join('') + '<td class="r">' + f.num(ag.total) + '</td></tr></tfoot></table></div>' +
          '<p class="muted small" style="padding:12px 22px">' + I('info', 12) + ' Ageing periods (' + st.S.settings.ageing.join(' / ') + ' days) are set in <a class="lk" href="#/settings/accounting">Settings</a>.</p>';
        out.csv.unshift([isAR ? 'Customer' : 'Supplier'].concat(ag.labels, ['Total'])); out.csv.push(['Total'].concat(ag.totals.map(CL.csvMoney), [CL.csvMoney(ag.total)]));
        out.name = (isAR ? 'receivables' : 'payables') + '-ageing-' + R.to + '.csv';
      }
      else if (id === 'expense-analysis') {
        var ea = E.expenseAnalysis(R.from, R.to), mx = Math.max.apply(null, ea.totals.concat([1]));
        body = head('Expense analysis', f.date(R.from) + ' to ' + f.date(R.to) + ' · ' + f.money(ea.total) + ' in total') +
          '<div style="padding:16px 22px 4px" class="chart-w" id="chEA"></div>' +
          '<div class="t-wrap"><table class="t"><thead><tr><th>Category</th>' + ea.months.map(function (m) { return '<th class="r">' + f.month(m) + '</th>'; }).join('') + '<th class="r">Total</th><th class="r">Share</th></tr></thead><tbody>' +
          ea.rows.map(function (r) { out.csv.push([r.account.code, r.account.name].concat(r.values.map(CL.csvMoney), [CL.csvMoney(r.total)])); return '<tr><td>' + accLink(r.account) + '</td>' + r.values.map(function (x) { return '<td class="r">' + (x ? f.short(x, true) : '<span class="muted">—</span>') + '</td>'; }).join('') + '<td class="r"><b>' + f.num(r.total) + '</b></td><td class="r">' + f.pct(r.total / (ea.total || 1)) + '</td></tr>'; }).join('') +
          '</tbody><tfoot><tr><td>Total</td>' + ea.totals.map(function (x) { return '<td class="r">' + f.short(x, true) + '</td>'; }).join('') + '<td class="r">' + f.num(ea.total) + '</td><td class="r">100%</td></tr></tfoot></table></div>';
        out.csv.unshift(['Code', 'Category'].concat(ea.months, ['Total'])); out.name = 'expense-analysis-' + R.from + '-to-' + R.to + '.csv';
        out.after = function () { CL.chart.mount(v.querySelector('#chEA'), function (w) { return CL.chart.pills({ w: w, h: 200, labels: ea.months.map(function (m) { return f.MON[+m.slice(5) - 1]; }), a: { values: ea.totals } }); }, function (i) { var top = ea.rows.slice().sort(function (a, b) { return b.values[i] - a.values[i]; }).slice(0, 3); return '<b>' + f.monthLong(ea.months[i]) + '</b><span>Total <i>' + f.short(ea.totals[i]) + '</i></span>' + top.map(function (r) { return '<span>' + esc(r.account.name) + ' <i>' + f.short(r.values[i]) + '</i></span>'; }).join(''); }); };
      }
      var asOf = id === 'balance-sheet' || id === 'trial-balance' || id.indexOf('ageing') > 0;
      v.innerHTML = crumb + '<header class="ph no-print"><div><h1>' + meta[1] + '</h1><p>' + meta[2] + '</p></div></header>' + periodBar(R, { asOf: asOf, extra: out.extra }) + '<section class="rp">' + body + '</section>' + '<p class="muted small" style="margin-top:10px">Generated ' + f.date(st.today()) + ' from posted entries. Sample data — fictional company.</p>';
      if (out.after) out.after();
      v.querySelector('[name=preset]').onchange = function (e) { S0.preset = e.target.value; if (S0.preset === 'custom') { S0.from = R.from; S0.to = R.to; } CL.pages.report.render(v, p, {}); };
      v.querySelectorAll('.fb input[type=date]').forEach(function (el) { el.onchange = function () { S0.preset = 'custom'; S0.from = S0.from || R.from; S0.to = S0.to || R.to; S0[el.name] = el.value; if (asOf) S0.from = CL.addDays(el.value, -30); CL.pages.report.render(v, p, {}); }; });
      var ac = v.querySelector('[name=account]'); if (ac) ac.onchange = function () { S0.account = ac.value; CL.pages.report.render(v, p, {}); };
      v.querySelector('[data-x=csv]').onclick = function () { CL.csv(out.name, out.csv); };
    }
  };
})();
