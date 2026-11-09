/* ============================================================
   C-Ledger — Overview dashboard (all figures derived from the ledger)
   ============================================================ */
(function () {
  'use strict';
  var CL = window.CL, I = CL.icon, esc = CL.esc, f = CL.fmt, st = CL.store;

  function kpi(o) {
    return '<a class="kpi' + (o.hero ? ' kpi--hero' : '') + '" href="' + o.href + '"><span class="kpi__l">' + esc(o.label) + '</span><span class="kpi__go">' + I('out', 14) + '</span>' +
      '<span class="kpi__v"><small>' + f.cur() + '</small>' + f.short(o.value, true) + '</span><span class="kpi__f">' + o.foot + '</span></a>';
  }

  CL.pages.overview = {
    render: function (v) {
      var E = st.E, S = st.S, T = st.today(), R = st.range(), P = R.prev;
      var cash = function (to) { return E.cashAccounts().reduce(function (t, a) { return t + E.balance(a.id, to); }, 0); };
      var inc = function (r) { return E.typeTotal('income', r.to, r.from); }, exp = function (r) { return E.typeTotal('expense', r.to, r.from); };
      var ar = E.def('ar').id, ap = E.def('ap').id;
      var od = S.invoices.filter(function (i) { return E.invoiceStatus(i, T) === 'overdue'; }).reduce(function (t, i) { return t + E.invoiceOutstanding(i); }, 0);
      var due7 = S.bills.filter(function (b) { var s = E.billStatus(b, T); return (s === 'posted' || s === 'partial' || s === 'overdue') && b.due <= CL.addDays(T, 7); }).reduce(function (t, b) { return t + E.billOutstanding(b); }, 0);
      var cI = inc(R), cE = exp(R), pI = inc(P), pE = exp(P);
      var months = st.months(12);
      var mInc = months.map(function (m) { return E.typeTotal('income', m.to, m.from); }), mExp = months.map(function (m) { return E.typeTotal('expense', m.to, m.from); });
      var mNet = mInc.map(function (x, i) { return x - mExp[i]; });
      var avg3 = mNet.map(function (x, i) { var s = mNet.slice(Math.max(0, i - 2), i + 1); return Math.round(s.reduce(function (a, b) { return a + b; }, 0) / s.length); });
      var cashIds = {}; E.cashAccounts().forEach(function (a) { cashIds[a.id] = 1; });
      var flowIn = [], flowOut = [], flowBal = [];
      months.forEach(function (m) { var i = 0, o = 0; E.postedLines().forEach(function (l) { if (!cashIds[l.accountId] || l.date < m.from || l.date > m.to || l.j.kind === 'transfer') return; i += l.debit; o += l.credit; }); flowIn.push(i); flowOut.push(o); flowBal.push(cash(m.to)); });

      // expense & revenue mix for the selected period
      var exRows = E.accountsByType('expense').map(function (a) { return { a: a, v: E.balance(a.id, R.to, R.from) }; }).filter(function (x) { return x.v > 0; }).sort(function (a, b) { return b.v - a.v; });
      var top = exRows.slice(0, 5), rest = exRows.slice(5).reduce(function (t, x) { return t + x.v; }, 0); if (rest) top.push({ a: { name: 'Other expenses', id: '' }, v: rest });
      var revRows = E.accountsByType('income').map(function (a) { return { a: a, v: E.balance(a.id, R.to, R.from) }; }).filter(function (x) { return x.v; }).sort(function (a, b) { return b.v - a.v; });
      var revMax = Math.max.apply(null, revRows.map(function (x) { return x.v; }).concat([1]));

      // ageing for AR vs AP
      var arA = E.ageing('ar', T, S.settings.ageing), apA = E.ageing('ap', T, S.settings.ageing), agMax = Math.max.apply(null, arA.totals.concat(apA.totals, [1]));

      // reconciliation status across bank accounts
      var banks = E.cashAccounts().filter(function (a) { return a.sub === 'bank'; }), recd = 0, inprog = 0, all = 0;
      banks.forEach(function (a) { var ls = E.bankLines(a.id); all += ls.length; ls.forEach(function (l) { if (l.rec) recd++; }); });
      S.recs.filter(function (r) { return r.status === 'in_progress'; }).forEach(function (r) { r.lines.forEach(function (l) { if (l.match) inprog++; }); });
      var share = all ? recd / all : 1;

      // this month summary
      var mS = T.slice(0, 8) + '01', thisM = { from: mS, to: T }, lastM = st.range('month').prev;
      var invoiced = S.invoices.filter(function (i) { return i.status !== 'draft' && i.status !== 'void' && i.issue >= mS && i.issue <= T; }).reduce(function (t, i) { return t + E.invoiceTotals(i).total; }, 0);
      var collected = S.receipts.filter(function (r) { return !r.voided && r.date >= mS && r.date <= T; }).reduce(function (t, r) { return t + r.amount; }, 0);
      var billed = S.bills.filter(function (b) { return b.status === 'posted' && b.issue >= mS && b.issue <= T; }).reduce(function (t, b) { return t + E.billTotals(b).total; }, 0);
      var paidOut = S.payments.filter(function (p) { return !p.voided && p.date >= mS && p.date <= T; }).reduce(function (t, p) { return t + p.amount; }, 0);
      var mNetNow = E.netIncome(thisM.from, thisM.to), mNetPrev = E.netIncome(lastM.from, lastM.to);

      var recent = E.postedLines().filter(function (l) { return cashIds[l.accountId]; }).slice(-7).reverse();
      var openInv = S.invoices.filter(function (i) { var s = E.invoiceStatus(i, T); return s === 'overdue' || s === 'issued' || s === 'partial'; }).sort(function (a, b) { return a.due < b.due ? -1 : 1; }).slice(0, 6);
      var dueBills = S.bills.filter(function (b) { var s = E.billStatus(b, T); return s === 'posted' || s === 'partial' || s === 'overdue'; }).sort(function (a, b) { return a.due < b.due ? -1 : 1; }).slice(0, 6);
      var recentJ = S.journals.filter(function (j) { return j.kind === 'general' || j.kind === 'adjusting' || j.kind === 'accrual' || j.kind === 'depreciation' || j.kind === 'reversing' || j.kind === 'opening' || j.status === 'draft'; }).slice(-6).reverse();
      var balAccts = E.cashAccounts().concat([E.def('ar'), E.def('ap'), E.def('vat'), E.accountByCode('2150'), E.accountByCode('2500')].filter(Boolean));
      var balMax = Math.max.apply(null, balAccts.map(function (a) { return Math.abs(E.balance(a.id, R.to)); }).concat([1]));
      var alerts = CL.alerts();
      var hi = months.map(function (m) { return m.key; }).indexOf(R.to.slice(0, 7));

      v.innerHTML =
        '<div class="ov-top"><div><h1 class="ph-t" style="font-size:27px;font-weight:800;letter-spacing:-.03em">Overview</h1><p class="muted">' + esc(S.settings.company.name) + ' · ' + esc(R.label) + ' <span class="small">(compared with ' + esc(P.label) + ')</span></p></div>' +
        '<div class="ph__a"><label class="sel" aria-label="Reporting period">' + CL.select('period', st.PERIODS.map(function (p) { return { v: p[0], l: p[1] }; }), R.id) + I('down', 15) + '</label>' +
        '<a class="btn" href="#/reports" data-need="">' + I('reports', 16) + 'Reports</a><a class="btn btn--p" href="#/journal/new" data-need="post">' + I('plus', 16) + 'Journal entry</a></div></div>' +
        '<div class="kpis">' +
          kpi({ hero: true, label: 'Cash and bank balances', value: cash(R.to), href: '#/banking', foot: CL.delta(cash(R.to), cash(P.to)) + '<span>vs ' + f.short(cash(P.to)) + '</span>' }) +
          kpi({ label: 'Total income', value: cI, href: '#/reports/profit-loss', foot: CL.delta(cI, pI) + '<span>' + esc(R.label.replace(' to date', '')) + '</span>' }) +
          kpi({ label: 'Total expenses', value: cE, href: '#/reports/expense-analysis', foot: CL.delta(cE, pE, false) + '<span>incl. cost of sales</span>' }) +
          kpi({ label: (cI - cE >= 0 ? 'Net profit' : 'Net loss'), value: cI - cE, href: '#/reports/profit-loss', foot: CL.delta(cI - cE, pI - pE) + '<span>' + (cI ? f.pct((cI - cE) / cI) + ' margin' : '—') + '</span>' }) +
          kpi({ label: 'Accounts receivable', value: E.balance(ar, R.to), href: '#/invoices', foot: (od ? '<span class="dl dl--dn">' + f.short(od) + ' overdue</span>' : '<span class="dl dl--up">Nothing overdue</span>') }) +
          kpi({ label: 'Accounts payable', value: E.balance(ap, R.to), href: '#/bills', foot: (due7 ? '<span class="dl dl--n">' + f.short(due7) + ' due in 7 days</span>' : '<span class="dl dl--n">Nothing due this week</span>') }) +
        '</div>' +
        '<div class="ov">' +
          '<article class="card"><header class="card__h"><span class="card__t">' + I('reports', 17) + 'Income vs expenses</span>' + CL.legend([['Income', 'a'], ['Expenses', 'b']]) + '</header><p class="card__s">Last 12 months · posted entries only</p><div class="chart-w" id="chIE">' + CL.chart.pills({ labels: months.map(function (m) { return f.MON[+m.key.slice(5) - 1]; }), a: { values: mInc }, b: { values: mExp }, hi: hi, aria: 'Monthly income and expenses' }) + '</div></article>' +
          '<article class="card dark"><header class="card__h"><span class="card__t">' + I('calendar', 17) + f.MONTH[+T.slice(5, 7) - 1] + ' so far</span><a class="lnk" style="color:#CDEBD9" href="#/reports/profit-loss?p=month">P&amp;L ' + I('right', 14) + '</a></header>' +
            '<p class="muted small">Net ' + (mNetNow >= 0 ? 'profit' : 'loss') + ' for ' + (+T.slice(8, 10)) + ' days</p><div class="big"><small>' + f.cur() + '</small>' + f.num(mNetNow) + '</div><p class="muted small" style="margin-top:4px">' + (mNetPrev ? (mNetNow >= mNetPrev ? '▲ ' : '▼ ') + f.short(Math.abs(mNetNow - mNetPrev)) + ' vs the same days last month' : '') + '</p>' +
            '<div class="ms"><div><span>Invoiced</span><b>' + f.short(invoiced) + '</b></div><div><span>Collected</span><b>' + f.short(collected) + '</b></div><div><span>Bills received</span><b>' + f.short(billed) + '</b></div><div><span>Paid to suppliers</span><b>' + f.short(paidOut) + '</b></div></div></article>' +
          '<article class="card"><header class="card__h"><span class="card__t">' + I('recon', 17) + 'Reconciliation status</span><a class="lnk" href="#/reconciliation">Open ' + I('right', 14) + '</a></header>' +
            CL.chart.gauge({ value: share, parts: [share, all ? inprog / all : 0, Math.max(0, 1 - share - (all ? inprog / all : 0))], label: Math.round(share * 100) + '%', sub: 'of bank lines reconciled', aria: 'Share of bank transactions reconciled' }) +
            '<div class="lg" style="justify-content:center;margin:6px 0 10px">' + '<span><i class="lg-a"></i>Reconciled</span><span><i style="background:var(--acc-d)"></i>Matched, in progress</span><span><i class="lg-b"></i>Not yet</span></div>' +
            banks.map(function (a) { var last = E.lastReconciliation(a.id), ip = S.recs.filter(function (r) { return r.accountId === a.id && r.status === 'in_progress'; })[0]; return '<a class="lr" href="' + (ip ? '#/reconciliation/' + ip.id : '#/reconciliation') + '"><span class="lr__m"><span class="lr__t">' + esc(a.name) + '</span><span class="lr__s">' + (last ? 'Reconciled to ' + f.date(last.end) : 'Not reconciled') + '</span></span>' + (ip ? CL.status('in_progress') : last && CL.daysBetween(last.end, T) <= 45 ? CL.pill('Up to date', 'g') : CL.pill('Behind', 'a')) + '</a>'; }).join('') + '</article>' +

          '<article class="card"><header class="card__h"><span class="card__t">' + I('cash', 17) + 'Cash flow</span>' + CL.legend([['Money in', 'a'], ['Money out', 'o'], ['Closing cash', 'ink']]) + '</header><p class="card__s">All bank and cash accounts · transfers between your own accounts excluded</p><div class="chart-w" id="chCF">' + CL.chart.flow({ labels: months.map(function (m) { return f.MON[+m.key.slice(5) - 1]; }), inflow: flowIn, outflow: flowOut, balance: flowBal, aria: 'Monthly cash in, out and closing balance' }) + '</div></article>' +
          '<article class="card"><header class="card__h"><span class="card__t">' + I('expense', 17) + 'Expenses by category</span><a class="lnk" href="#/reports/expense-analysis">Analysis ' + I('right', 14) + '</a></header><p class="card__s">' + esc(R.label) + '</p>' +
            (top.length ? '<div class="dl-w">' + CL.chart.donut({ items: top.map(function (x, i) { return { label: x.a.name, value: x.v, tone: i }; }), center: { value: f.short(cE, true), label: 'total ' + f.cur() }, aria: 'Expenses by category' }) + '<div class="dl-l">' + top.map(function (x, i) { return '<div><i class="dn-' + i + '" style="background:currentColor"></i><span>' + esc(x.a.name.replace(' & ', ' & ')) + '</span><b>' + f.pct(x.v / cE) + '</b></div>'; }).join('') + '</div></div>' : CL.empty('expense', 'No expenses in this period')) + '</article>' +
          '<article class="card"><header class="card__h"><span class="card__t">' + I('trendUp', 17) + 'Revenue by category</span><a class="lnk" href="#/reports/profit-loss">P&amp;L ' + I('right', 14) + '</a></header><p class="card__s">' + esc(R.label) + '</p>' +
            (revRows.length ? '<div class="hb">' + revRows.map(function (x) { return '<div><span>' + esc(x.a.name.replace(/^(Sales|Service) Revenue — /, '')) + '</span><b>' + f.short(x.v) + '</b><i><u style="width:' + Math.max(2, x.v / revMax * 100).toFixed(1) + '%"></u></i></div>'; }).join('') + '</div><p class="muted small" style="margin-top:12px">Total ' + f.money(cI) + '</p>' : CL.empty('trendUp', 'No income in this period')) + '</article>' +

          '<article class="card"><header class="card__h"><span class="card__t">' + I('trendUp', 17) + 'Net profit trend</span>' + CL.legend([['Monthly net profit', 'l'], ['3-month average', 'd']]) + '</header><p class="card__s">Income less expenses, by month</p><div class="chart-w" id="chNP">' + CL.chart.line({ labels: months.map(function (m) { return f.MON[+m.key.slice(5) - 1]; }), series: [{ name: 'Net profit', values: mNet }, { name: '3-month average', values: avg3, dashed: true }], aria: 'Net profit by month' }) + '</div></article>' +
          '<article class="card"><header class="card__h"><span class="card__t">' + I('clock', 17) + 'Receivables & payables</span>' + CL.legend([['Owed to you', 'a'], ['You owe', 'b']]) + '</header><p class="card__s">Outstanding today, by days past due</p>' +
            '<div class="ag">' + arA.labels.map(function (l, i) { return '<div><span class="ag__b"><u style="height:' + (arA.totals[i] / agMax * 100).toFixed(1) + '%" title="Receivable ' + f.money(arA.totals[i]) + '"></u><u style="height:' + (apA.totals[i] / agMax * 100).toFixed(1) + '%" title="Payable ' + f.money(apA.totals[i]) + '"></u></span><span>' + esc(l.replace(' days', 'd')) + '</span></div>'; }).join('') + '</div>' +
            '<div class="g g2" style="margin-top:12px;gap:10px"><a class="st st--g" href="#/reports/ar-ageing"><span>Receivable</span><b>' + f.short(arA.total) + '</b></a><a class="st" href="#/reports/ap-ageing"><span>Payable</span><b>' + f.short(apA.total) + '</b></a></div></article>' +
          '<article class="card"><header class="card__h"><span class="card__t">' + I('alert', 17) + 'Financial alerts</span><span class="pill pill--' + (alerts.length ? 'a' : 'g') + '">' + alerts.length + '</span></header>' +
            (alerts.length ? '<div class="al">' + alerts.slice(0, 5).map(function (x) { return '<a class="al__i al__i--' + x.tone + '" href="' + x.href + '"><span class="al__ic">' + I(x.icon, 15) + '</span><span><b>' + esc(x.title) + '</b><em>' + esc(x.text) + '</em></span></a>'; }).join('') + '</div>' + (alerts.length > 5 ? '<button class="lnk" style="margin-top:10px" data-act="notes">See all ' + alerts.length + ' ' + I('right', 14) + '</button>' : '') : CL.empty('check', 'Nothing needs attention')) + '</article>' +

          '<article class="card"><header class="card__h"><span class="card__t">' + I('bank', 17) + 'Recent transactions</span><a class="lnk" href="#/banking">Banking ' + I('right', 14) + '</a></header>' +
            recent.map(function (l) { var amt = l.debit - l.credit, a = E.account(l.accountId); return '<a class="lr" href="#/journal/' + l.j.id + '"><span class="lr__ic lr__ic--' + (amt > 0 ? 'g' : 'n') + '">' + I(amt > 0 ? 'arrowDown' : 'arrowUp', 15) + '</span><span class="lr__m"><span class="lr__t">' + esc(l.j.desc.replace(/^(Receipt|Payment|Expense|Transfer) [A-Z]+-\d+ — /, '')) + '</span><span class="lr__s">' + f.date(l.date) + ' · ' + esc(a.name) + '</span></span><span class="lr__v ' + (amt > 0 ? 'pos' : '') + '">' + (amt > 0 ? '+' : '−') + f.num(Math.abs(amt)) + '<em>' + esc(l.j.ref) + '</em></span></a>'; }).join('') + '</article>' +
          '<article class="card"><header class="card__h"><span class="card__t">' + I('invoice', 17) + 'Outstanding invoices</span><a class="lnk" href="#/invoices?status=open">All ' + I('right', 14) + '</a></header>' +
            (openInv.length ? openInv.map(function (i) { var s = E.invoiceStatus(i, T), c = E.contact(i.contactId); return '<a class="lr" href="#/invoice/' + i.id + '">' + CL.cav(c, 32) + '<span class="lr__m"><span class="lr__t">' + esc(c.name) + '</span><span class="lr__s">' + i.no + ' · due ' + f.date(i.due) + '</span></span><span class="lr__v">' + f.num(E.invoiceOutstanding(i)) + '<em>' + CL.status(s) + '</em></span></a>'; }).join('') : CL.empty('check', 'Every invoice is paid')) + '</article>' +
          '<article class="card"><header class="card__h"><span class="card__t">' + I('calendar', 17) + 'Upcoming bill due dates</span><a class="lnk" href="#/bills?status=open">All ' + I('right', 14) + '</a></header>' +
            (dueBills.length ? dueBills.map(function (b) { var s = E.billStatus(b, T), c = E.contact(b.contactId), dd = CL.daysBetween(T, b.due); return '<a class="lr" href="#/bill/' + b.id + '"><span class="lr__ic lr__ic--' + (dd < 0 ? 'r' : dd <= 7 ? 'a' : 'n') + '">' + I('bill', 15) + '</span><span class="lr__m"><span class="lr__t">' + esc(c.name) + '</span><span class="lr__s">' + b.no + ' · ' + (dd < 0 ? Math.abs(dd) + ' days overdue' : dd === 0 ? 'due today' : 'due in ' + dd + ' day' + (dd === 1 ? '' : 's')) + '</span></span><span class="lr__v">' + f.num(E.billOutstanding(b)) + '<em>' + f.date(b.due) + '</em></span></a>'; }).join('') : CL.empty('check', 'No unpaid bills')) + '</article>' +

          '<article class="card"><header class="card__h"><span class="card__t">' + I('journal', 17) + 'Recent journal entries</span><a class="lnk" href="#/journals">All ' + I('right', 14) + '</a></header>' +
            recentJ.map(function (j) { var t = E.totals(j.lines); return '<a class="lr" href="#/journal/' + j.id + '"><span class="lr__ic lr__ic--' + (j.status === 'draft' ? 'a' : j.reversedBy || j.reverses ? 'n' : 'g') + '">' + I(j.reverses ? 'reverse' : 'journal', 15) + '</span><span class="lr__m"><span class="lr__t">' + esc(j.desc) + '</span><span class="lr__s">' + j.ref + ' · ' + f.date(j.date) + ' · ' + esc(E.JOURNAL_KINDS[j.kind] || j.kind) + '</span></span><span class="lr__v">' + f.num(t.debit) + '<em>' + (j.status === 'draft' ? CL.status('draft') : j.reversedBy ? CL.status('reversed') : CL.status('posted')) + '</em></span></a>'; }).join('') + '</article>' +
          '<article class="card span2"><header class="card__h"><span class="card__t">' + I('coa', 17) + 'Account balances</span><a class="lnk" href="#/accounts">Chart of accounts ' + I('right', 14) + '</a></header><p class="card__s">As of ' + f.date(R.to) + '</p>' +
            '<div class="g g2" style="gap:0 28px">' + balAccts.map(function (a) { var b = E.balance(a.id, R.to); return '<a class="bal" href="#/account/' + a.id + '"><b>' + esc(a.name) + '</b><span class="num">' + f.money(b, true) + '</span><i><u style="width:' + Math.max(1.5, Math.abs(b) / balMax * 100).toFixed(1) + '%;' + (a.type === 'liability' ? 'background:var(--amber)' : '') + '"></u></i></a>'; }).join('') + '</div></article>' +
        '</div>';

      v.querySelector('[name=period]').onchange = function (e) { st.ui.period = e.target.value; CL.rerender(); };
      var lbl = months.map(function (m) { return f.monthLong(m.key); });
      var ML = months.map(function (m) { return f.MON[+m.key.slice(5) - 1]; });
      CL.chart.mount(v.querySelector('#chIE'), function (w) { return CL.chart.pills({ w: w, h: Math.round(Math.min(280, Math.max(200, w * 0.4))), labels: ML, a: { values: mInc }, b: { values: mExp }, hi: hi, aria: 'Monthly income and expenses' }); }, function (i) { return '<b>' + lbl[i] + '</b><span>Income <i>' + f.short(mInc[i]) + '</i></span><span>Expenses <i>' + f.short(mExp[i]) + '</i></span><span>Net <i>' + f.short(mInc[i] - mExp[i]) + '</i></span>'; });
      CL.chart.mount(v.querySelector('#chNP'), function (w) { return CL.chart.line({ w: w, h: 240, labels: ML, series: [{ name: 'Net profit', values: mNet }, { name: '3-month average', values: avg3, dashed: true }], aria: 'Net profit by month' }); }, function (i) { return '<b>' + lbl[i] + '</b><span>Net profit <i>' + f.short(mNet[i]) + '</i></span><span>3-month avg <i>' + f.short(avg3[i]) + '</i></span>'; });
      CL.chart.mount(v.querySelector('#chCF'), function (w) { return CL.chart.flow({ w: w, h: 240, labels: ML, inflow: flowIn, outflow: flowOut, balance: flowBal, aria: 'Monthly cash in, out and closing balance' }); }, function (i) { return '<b>' + lbl[i] + '</b><span>Money in <i>' + f.short(flowIn[i]) + '</i></span><span>Money out <i>' + f.short(flowOut[i]) + '</i></span><span>Closing cash <i>' + f.short(flowBal[i]) + '</i></span>'; });
    }
  };
})();
