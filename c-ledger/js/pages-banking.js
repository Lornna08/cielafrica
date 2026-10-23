/* ============================================================
   C-Ledger — Banking, transfers, bank reconciliation
   ============================================================ */
(function () {
  'use strict';
  var CL = window.CL, I = CL.icon, esc = CL.esc, f = CL.fmt, st = CL.store;
  function U(k, d) { st.ui[k] = st.ui[k] || d; return st.ui[k]; }
  function key() { return 'k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  var KIND_IC = { bank: 'bank', cash: 'cash' };

  /* =================== BANKING =================== */
  CL.pages.banking = {
    render: function (v) {
      var E = st.E, S = st.S, T = st.today(), accts = E.cashAccounts(), total = accts.reduce(function (t, a) { return t + E.balance(a.id); }, 0);
      var m0 = T.slice(0, 8) + '01', inM = 0, outM = 0;
      var ids = {}; accts.forEach(function (a) { ids[a.id] = 1; });
      E.postedLines().forEach(function (l) { if (ids[l.accountId] && l.date >= m0 && l.j.kind !== 'transfer') { inM += l.debit; outM += l.credit; } });
      var recent = E.postedLines().filter(function (l) { return ids[l.accountId]; }).slice(-14).reverse();
      v.innerHTML = '<header class="ph"><div><h1>Banking</h1><p>Bank, mobile money and cash accounts. Balances come from posted entries and opening balances.</p></div><div class="ph__a"><a class="btn" href="#/reconciliation">' + I('recon', 16) + 'Reconcile</a><button class="btn" data-x="tr" data-need="post">' + I('transfer', 16) + 'Transfer</button><button class="btn btn--p" data-x="new" data-need="post">' + I('plus', 16) + 'New transaction</button></div></header>' +
        '<div class="note mb">' + I('shield', 15) + '<span>Demo accounts are fictional and are not connected to any bank. C-Ledger never asks for banking passwords; production deployments import statements or use bank-approved feeds.</span></div>' +
        '<div class="ss"><div class="st st--g"><span>Total cash & bank</span><b>' + f.money(total) + '</b></div><div class="st"><span>Money in this month</span><b>' + f.money(inM) + '</b><em>excluding transfers between accounts</em></div><div class="st"><span>Money out this month</span><b>' + f.money(outM) + '</b></div><div class="st"><span>Net this month</span><b class="' + (inM - outM < 0 ? 'neg' : '') + '">' + f.money(inM - outM, true) + '</b></div></div>' +
        '<div class="g g4 mb">' + accts.map(function (a) {
          var bal = E.balance(a.id), last = E.lastReconciliation(a.id), ip = S.recs.filter(function (r) { return r.accountId === a.id && r.status === 'in_progress'; })[0];
          var sp = st.months(6).map(function (m) { return E.balance(a.id, m.to); });
          return '<a class="card" href="#/banking/' + a.id + '" style="display:flex;flex-direction:column;gap:8px"><div style="display:flex;justify-content:space-between;align-items:center"><span class="lr__ic lr__ic--g">' + I(KIND_IC[a.sub] || 'bank', 16) + '</span>' + (ip ? CL.status('in_progress') : last && CL.daysBetween(last.end, T) <= 45 ? CL.pill('Reconciled', 'g', 'check') : a.sub === 'cash' ? CL.pill('Cash', 'n') : CL.pill('Behind', 'a')) + '</div><b style="font-size:14px">' + esc(a.name) + '</b><span class="mono muted small">' + a.code + (a.sub === 'cash' ? ' · cash' : ' · demo account') + '</span><span class="kpi__v" style="font-size:21px"><small>' + f.cur() + '</small>' + f.num(bal) + '</span>' + CL.spark(sp) + '<span class="muted small">' + (last ? 'Reconciled to ' + f.date(last.end) : 'Not reconciled') + '</span></a>';
        }).join('') + '</div>' +
        '<article class="card"><header class="card__h"><span class="card__t">' + I('clock', 16) + 'Recent bank and cash transactions</span></header>' +
        CL.table(recent, [
          { k: 'd', label: 'Date', cell: function (l) { return '<span class="nowrap">' + f.date(l.date) + '</span>'; } },
          { k: 'a', label: 'Account', cell: function (l) { return esc(E.account(l.accountId).name); } },
          { k: 'x', label: 'Description', cell: function (l) { return esc(l.j.desc) + '<span class="sub">' + esc(E.JOURNAL_KINDS[l.j.kind]) + '</span>'; } },
          { k: 'r', label: 'Reference', cell: function (l) { return '<a class="ref" href="#/journal/' + l.j.id + '">' + l.j.ref + '</a>'; } },
          { k: 'in', label: 'In', cls: 'r', cell: function (l) { return l.debit ? '<span class="pos">' + f.num(l.debit) + '</span>' : ''; } },
          { k: 'out', label: 'Out', cls: 'r', cell: function (l) { return l.credit ? f.num(l.credit) : ''; } },
          { k: 'rc', label: 'Reconciled', cell: function (l) { return st.S.recLines[l.key] ? CL.pill('Yes', 'g', 'check') : '<span class="muted small">Not yet</span>'; } }
        ], {}, { all: true, rowAttr: function (l) { return 'data-href="#/journal/' + l.j.id + '"'; } }) + '</article>';
      v.onclick = function (e) {
        var x = e.target.closest('[data-x]');
        if (x && x.dataset.x === 'tr') { CL.transferModal(); return; }
        if (x && x.dataset.x === 'new') { CL.newMenu(x); return; }
        var tr = e.target.closest('tr[data-href]'); if (tr && !e.target.closest('a,button')) location.hash = tr.dataset.href;
      };
    }
  };

  /* =================== BANK ACCOUNT STATEMENT =================== */
  CL.pages.bankAccount = {
    render: function (v, p) {
      var E = st.E, a = E.account(p[0]); if (!a || E.cashAccounts().indexOf(a) < 0) { v.innerHTML = CL.empty('bank', 'Not a bank or cash account', '', '<a class="btn" href="#/banking">Banking</a>'); return; }
      var T = st.today(), F = U('bank:' + a.id, { from: CL.addDays(T, -60), to: T, q: '', dir: '', page: 1 });
      var open = E.balance(a.id, CL.addDays(F.from, -1)), run = open, s = F.q.trim().toLowerCase();
      var rows = E.bankLines(a.id, F.from, F.to).map(function (b) { run += b.amount; return Object.assign({ bal: run }, b); });
      var shown = rows.filter(function (b) { if (F.dir === 'in' && b.amount < 0) return false; if (F.dir === 'out' && b.amount > 0) return false; if (s && (b.desc + ' ' + b.ref).toLowerCase().indexOf(s) < 0) return false; return true; }).reverse();
      var ins = rows.reduce(function (t, b) { return t + (b.amount > 0 ? b.amount : 0); }, 0), outs = rows.reduce(function (t, b) { return t + (b.amount < 0 ? -b.amount : 0); }, 0);
      var months = st.months(12), vals = months.map(function (m) { return E.balance(a.id, m.to); });
      v.innerHTML = '<a class="crumb" href="#/banking">' + I('left', 14) + 'Banking</a><div class="dh"><div><h1>' + esc(a.name) + '</h1><div class="dh__s"><span>' + a.code + '</span><span>' + (a.sub === 'cash' ? 'Cash account' : 'Demo bank account — fictional') + '</span></div></div><div class="dh__a"><button class="btn" data-x="csv">' + I('download', 16) + 'Statement CSV</button><a class="btn" href="#/reconciliation?account=' + a.id + '">' + I('recon', 16) + 'Reconcile</a><button class="btn btn--p" data-x="tr" data-need="post">' + I('transfer', 16) + 'Transfer</button></div></div>' +
        '<div class="ss"><div class="st"><span>Opening ' + f.date(F.from) + '</span><b>' + f.num(open, true) + '</b></div><div class="st"><span>Money in</span><b class="pos">' + f.num(ins) + '</b></div><div class="st"><span>Money out</span><b>' + f.num(outs) + '</b></div><div class="st st--g"><span>Closing ' + f.date(F.to) + '</span><b>' + f.num(run, true) + '</b></div></div>' +
        '<article class="card mb"><header class="card__h"><span class="card__t">' + I('trendUp', 16) + 'Month-end balance</span></header><div class="chart-w" id="chB"></div></article>' +
        '<div class="fb"><label class="s">' + I('search', 16) + '<input name="q" value="' + esc(F.q) + '" placeholder="Search description or reference"></label><label class="sel">' + CL.select('dir', [{ v: '', l: 'In and out' }, { v: 'in', l: 'Money in' }, { v: 'out', l: 'Money out' }], F.dir) + I('down', 15) + '</label><input type="date" name="from" value="' + F.from + '" aria-label="From"><input type="date" name="to" value="' + F.to + '" aria-label="To"></div>' +
        CL.table(shown, [
          { k: 'd', label: 'Date', cell: function (b) { return '<span class="nowrap">' + f.date(b.date) + '</span>'; } },
          { k: 'x', label: 'Description', cell: function (b) { return esc(b.desc) + '<span class="sub">' + esc(E.JOURNAL_KINDS[b.kind]) + '</span>'; } },
          { k: 'r', label: 'Reference', cell: function (b) { return '<a class="ref" href="#/journal/' + b.journalId + '">' + b.ref + '</a>'; } },
          { k: 'in', label: 'In', cls: 'r', cell: function (b) { return b.amount > 0 ? '<span class="pos">' + f.num(b.amount) + '</span>' : ''; } },
          { k: 'out', label: 'Out', cls: 'r', cell: function (b) { return b.amount < 0 ? f.num(-b.amount) : ''; } },
          { k: 'bal', label: 'Balance', cls: 'r', cell: function (b) { return f.num(b.bal, true); } },
          { k: 'rc', label: 'Reconciled', cell: function (b) { return b.rec ? CL.pill('Yes', 'g', 'check') : '<span class="muted small">Not yet</span>'; } }
        ], F, { per: 40, rowAttr: function (b) { return 'data-href="#/journal/' + b.journalId + '"'; }, empty: 'No transactions in this period.' });
      CL.chart.mount(v.querySelector('#chB'), function (w) { return CL.chart.line({ w: w, h: 190, labels: months.map(function (m) { return f.MON[+m.key.slice(5) - 1]; }), series: [{ values: vals }] }); }, function (i) { return '<b>' + f.monthLong(months[i].key) + '</b><span>Balance <i>' + f.money(vals[i]) + '</i></span>'; });
      CL.tableEvents(v, F, function () { CL.pages.bankAccount.render(v, p); });
      v.querySelectorAll('.fb select, .fb input[type=date]').forEach(function (el) { el.onchange = function () { F[el.name] = el.value; F.page = 1; CL.pages.bankAccount.render(v, p); }; });
      var qi = v.querySelector('[name=q]'), tmr; qi.oninput = function () { clearTimeout(tmr); tmr = setTimeout(function () { F.q = qi.value; F.page = 1; CL.pages.bankAccount.render(v, p); var n = v.querySelector('[name=q]'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 200); };
      v.onclick = function (e) {
        var x = e.target.closest('[data-x]');
        if (x && x.dataset.x === 'tr') { CL.transferModal(a.id); return; }
        if (x && x.dataset.x === 'csv') { var r2 = open; CL.csv('statement-' + a.code + '-' + F.from + '-to-' + F.to + '.csv', [['Date', 'Description', 'Reference', 'Money in', 'Money out', 'Balance', 'Reconciled']].concat([[F.from, 'Opening balance', '', '', '', CL.csvMoney(open), '']], rows.map(function (b) { r2 += b.amount; return [b.date, b.desc, b.ref, b.amount > 0 ? CL.csvMoney(b.amount) : '', b.amount < 0 ? CL.csvMoney(-b.amount) : '', CL.csvMoney(r2), b.rec ? 'Yes' : 'No']; }))); return; }
        var tr = e.target.closest('tr[data-href]'); if (tr && !e.target.closest('a,button')) location.hash = tr.dataset.href;
      };
    }
  };

  CL.transferModal = function (fromId) {
    var E = st.E, T = st.today(), accts = E.cashAccounts(), k = key();
    var opts = accts.map(function (a) { return { v: a.id, l: a.name + ' · ' + f.short(E.balance(a.id)) }; });
    var p = CL.open('modal', CL.head('Transfer between accounts', 'Moves money between your own accounts — not income or expense.', 'transfer') +
      '<form class="ovl__body" id="tf" novalidate><div class="fg">' + CL.field('From *', CL.select('fromId', opts, fromId || E.def('bank').id)) + CL.field('To *', CL.select('toId', opts, accts.filter(function (a) { return a.id !== (fromId || E.def('bank').id); })[0].id)) +
      CL.field('Amount *', CL.moneyInput('amount', 0, ' autofocus')) + '<label class="fld"><span>Date *</span><input type="date" name="date" value="' + T + '"></label>' + CL.field('Memo', '<input name="memo" placeholder="e.g. Petty cash top-up">', '', 'full') + '</div><div id="tprev"></div><div class="form-err" hidden></div></form>' +
      '<div class="ovl__f"><button class="btn" data-close>Cancel</button><button class="btn btn--p" data-x="ok">' + I('check', 16) + 'Record transfer</button></div>', { label: 'Transfer' });
    var form = p.querySelector('#tf');
    function upd() { var amt = f.parse(form.amount.value), a = E.account(form.fromId.value), b = E.account(form.toId.value); p.querySelector('#tprev').innerHTML = !amt || isNaN(amt) ? '' : a === b ? '<div class="note note--r">' + I('alert', 15) + '<span>Choose two different accounts.</span></div>' : '<div class="note note--g">' + I('ledger', 15) + '<span>Posts <b>Dr ' + esc(b.name) + '</b> / <b>Cr ' + esc(a.name) + '</b> for ' + f.num(amt) + '. Total cash is unchanged and nothing reaches the profit and loss.' + (E.balance(a.id) < amt ? ' <b>' + esc(a.name) + ' would go overdrawn.</b>' : '') + '</span></div>'; }
    form.addEventListener('input', upd); form.addEventListener('change', upd);
    p.querySelector('[data-x=ok]').onclick = function (ev) { var btn = ev.currentTarget; if (btn.disabled) return; var d = CL.formData(form); d.amount = f.parse(d.amount); d.key = k; if (isNaN(d.amount)) { CL.toast('Enter the amount with at most 2 decimals.', 'err'); return; } btn.disabled = true; var r = st.act(function () { return E.transfer(d); }, function (t) { return t.no + ' recorded — ' + f.money(t.amount) + ' moved'; }, form); btn.disabled = false; if (r) CL.close(); };
  };

  /* =================== RECONCILIATION =================== */
  CL.pages.reconciliation = {
    render: function (v, p, q) {
      var E = st.E, S = st.S, T = st.today(), accts = E.cashAccounts();
      var hist = S.recs.slice().sort(function (a, b) { return a.end < b.end ? 1 : -1; });
      v.innerHTML = '<header class="ph"><div><h1>Bank reconciliation</h1><p>Match your bank statement to the books. A reconciliation can only be completed when every statement line is matched and the difference is zero.</p></div><div class="ph__a"><button class="btn btn--p" data-x="start" data-need="post">' + I('plus', 16) + 'Start reconciliation</button></div></header>' +
        '<div class="g g4 mb">' + accts.map(function (a) {
          var last = E.lastReconciliation(a.id), ip = S.recs.filter(function (r) { return r.accountId === a.id && r.status === 'in_progress'; })[0], un = E.bankLines(a.id).filter(function (b) { return !b.rec; }).length;
          return '<article class="card" style="display:flex;flex-direction:column;gap:8px"><div style="display:flex;justify-content:space-between;align-items:center"><b>' + esc(a.name) + '</b>' + (ip ? CL.status('in_progress') : '') + '</div><span class="muted small">Book balance ' + f.money(E.balance(a.id)) + '</span><span class="small">' + (last ? 'Last reconciled to <b>' + f.date(last.end) + '</b>' : '<b>Never reconciled</b>') + '</span><span class="small muted">' + un + ' transaction' + (un === 1 ? '' : 's') + ' not yet reconciled</span>' +
            (ip ? '<a class="btn btn--soft btn--sm" href="#/reconciliation/' + ip.id + '">Continue ' + I('right', 14) + '</a>' : '<button class="btn btn--sm" data-start="' + a.id + '" data-need="post">Start</button>') + '</article>';
        }).join('') + '</div>' +
        '<article class="card"><header class="card__h"><span class="card__t">' + I('clock', 16) + 'History</span></header>' + CL.table(hist, [
          { k: 'a', label: 'Account', cell: function (r) { return '<b>' + esc(E.account(r.accountId).name) + '</b>'; } },
          { k: 'p', label: 'Statement period', cell: function (r) { return '<span class="nowrap">' + (r.start ? f.date(r.start) + ' – ' : 'to ') + f.date(r.end) + '</span>'; } },
          { k: 'o', label: 'Opening', cls: 'r', cell: function (r) { return f.num(r.opening); } },
          { k: 'c', label: 'Closing', cls: 'r', cell: function (r) { return f.num(r.closing); } },
          { k: 'n', label: 'Lines', cls: 'r', cell: function (r) { return r.lines.length; } },
          { k: 'b', label: 'Completed', cell: function (r) { return r.status === 'completed' ? '<span class="nowrap">' + f.date(r.completedAt) + '</span><span class="sub">' + esc(r.completedBy || '') + '</span>' : '<span class="muted">—</span>'; } },
          { k: 's', label: 'Status', cell: function (r) { return CL.status(r.status); } }
        ], U('recH', { page: 1 }), { per: 12, rowAttr: function (r) { return 'data-href="#/reconciliation/' + r.id + '"'; } }) + '</article>';
      CL.tableEvents(v, st.ui.recH, function () { CL.pages.reconciliation.render(v, p, q); });
      v.onclick = function (e) {
        var s = e.target.closest('[data-start]'), x = e.target.closest('[data-x=start]');
        if (s || x) { startModal(s ? s.dataset.start : null); return; }
        var tr = e.target.closest('tr[data-href]'); if (tr && !e.target.closest('a,button')) location.hash = tr.dataset.href;
      };
      if (q.account) setTimeout(function () { var ip = S.recs.filter(function (r) { return r.accountId === q.account && r.status === 'in_progress'; })[0]; if (ip) location.hash = '#/reconciliation/' + ip.id; else startModal(q.account); }, 30);
    }
  };
  function startModal(accountId) {
    var E = st.E, S = st.S, T = st.today(), accts = E.cashAccounts().filter(function (a) { return !S.recs.some(function (r) { return r.accountId === a.id && r.status === 'in_progress'; }); });
    if (!accts.length) { CL.toast('Every account already has a reconciliation in progress.', 'info'); return; }
    var acc = E.account(accountId) || accts[0]; if (accts.indexOf(acc) < 0) acc = accts[0];
    var lines = null;
    var p = CL.open('modal', CL.head('Start a reconciliation', 'Enter the figures from your bank statement, then import its lines.', 'recon') +
      '<form class="ovl__body" id="sf" novalidate><div class="fg">' + CL.field('Account *', CL.select('accountId', accts.map(function (a) { return { v: a.id, l: a.name }; }), acc.id), '', 'full') +
      '<label class="fld"><span>Statement start</span><input type="date" name="start"></label><label class="fld"><span>Statement end *</span><input type="date" name="end" value="' + CL.addDays(T, -1) + '"></label>' +
      CL.field('Opening balance on statement *', CL.moneyInput('opening', 0)) + CL.field('Closing balance on statement *', CL.moneyInput('closing', 0)) + '</div>' +
      '<label class="drop" id="sdrop">' + I('upload', 22) + '<div><b>Import statement CSV</b>Columns: Date, Description, Amount — or Date, Description, Debit, Credit. Dates as YYYY-MM-DD or DD/MM/YYYY.</div><input type="file" accept=".csv,text/csv" hidden name="file"></label>' +
      '<div id="sres"></div><p class="muted small">No file? <button type="button" class="lk" data-x="sample">Load a sample statement</button> generated from the books for this period, with one bank charge that is not recorded yet.</p><div class="form-err" hidden></div></form>' +
      '<div class="ovl__f"><button class="btn" data-close>Cancel</button><button class="btn btn--p" data-x="ok">' + I('check', 16) + 'Start matching</button></div>', { label: 'Start reconciliation' });
    var form = p.querySelector('#sf');
    function defaults() { var a = E.account(form.accountId.value), last = E.lastReconciliation(a.id); form.start.value = last ? CL.addDays(last.end, 1) : ''; form.opening.value = f.input(last ? last.closing : E.balance(a.id, CL.addDays(form.start.value || T, -1))); lines = null; p.querySelector('#sres').innerHTML = ''; }
    form.accountId.onchange = defaults; defaults();
    function setLines(ls, label) { lines = ls; var sum = ls.reduce(function (t, l) { return t + l.amount; }, 0); var op = f.parse(form.opening.value); if (!form.closing.value || f.parse(form.closing.value) === 0) form.closing.value = f.input(op + sum); p.querySelector('#sres').innerHTML = '<div class="note note--g">' + I('check', 15) + '<span><b>' + ls.length + ' statement lines</b> read from ' + esc(label) + ' — net movement ' + f.num(sum, true) + '. Check that the closing balance matches your statement.</span></div>'; }
    var fi = form.querySelector('[name=file]'), drop = p.querySelector('#sdrop');
    function read(fl) { if (!fl) return; if (fl.size > 5 * 1024 * 1024) { CL.toast('Statement files must be under 5 MB', 'err'); return; } var r = new FileReader(); r.onload = function () { form.querySelector('.form-err').hidden = true; CL.try(function () { setLines(E.parseStatementCSV(r.result), fl.name); }, null, form); }; r.readAsText(fl); }
    fi.onchange = function () { read(fi.files[0]); fi.value = ''; };
    ['dragover', 'dragenter'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('is-over'); }); }); ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('is-over'); if (ev === 'drop') read(e.dataTransfer.files[0]); }); });
    p.addEventListener('click', function (e) {
      if (e.target.closest('[data-x=sample]')) {
        var a = E.account(form.accountId.value), from = form.start.value || CL.addDays(T, -30), to = form.end.value || T;
        var bl = E.bankLines(a.id, from, to).filter(function (b) { return !b.rec; });
        var ls = bl.map(function (b) { return { date: b.date, desc: b.desc.toUpperCase().slice(0, 40), amount: b.amount }; }); ls.push({ date: to, desc: 'MONTHLY LEDGER FEE', amount: -95000 });
        setLines(ls, 'the sample statement'); form.closing.value = f.input(f.parse(form.opening.value) + ls.reduce(function (t, l) { return t + l.amount; }, 0));
      }
    });
    p.querySelector('[data-x=ok]').onclick = function () {
      var d = CL.formData(form); d.opening = f.parse(d.opening); d.closing = f.parse(d.closing); d.lines = lines || [];
      if (isNaN(d.opening) || isNaN(d.closing)) { CL.toast('Enter both statement balances.', 'err'); return; }
      var r = st.act(function () { return E.startReconciliation(d); }, 'Reconciliation started', form); if (r) { CL.close(); location.hash = '#/reconciliation/' + r.id; }
    };
  }

  CL.pages.rec = {
    render: function (v, p) {
      var E = st.E, S = st.S, r; try { r = E.rec(p[0]); } catch (e) { v.innerHTML = CL.empty('recon', 'Reconciliation not found', '', '<a class="btn" href="#/reconciliation">Back</a>'); return; }
      var a = E.account(r.accountId), sm = E.recSummary(r.id), done = r.status === 'completed', sug = done ? {} : E.suggest(r.id), book = done ? [] : E.unreconciledBook(r.id);
      var bookBy = {}; E.bankLines(a.id).forEach(function (b) { bookBy[b.key] = b; });
      var F = U('rec:' + r.id, { show: 'all', pick: null });
      var lines = r.lines.slice().sort(function (x, y) { return x.date < y.date ? -1 : 1; }).filter(function (l) { return F.show === 'all' || (F.show === 'un' ? !l.match : !!l.match); });
      var ok = sm.difference === 0 && sm.unmatched === 0 && sm.statementCheck === 0;
      v.innerHTML = '<a class="crumb" href="#/reconciliation">' + I('left', 14) + 'Reconciliation</a><div class="dh"><div><h1>' + esc(a.name) + ' ' + CL.status(r.status) + '</h1><div class="dh__s"><span>Statement ' + (r.start ? f.date(r.start) + ' – ' : 'to ') + f.date(r.end) + '</span><span>Book balance at ' + f.date(r.end) + ': ' + f.money(sm.bookBalance) + '</span></div></div>' +
        '<div class="dh__a">' + (!done ? '<button class="btn" data-x="cancel">' + I('trash', 16) + 'Discard</button><button class="btn" data-x="import">' + I('upload', 16) + 'Import more lines</button>' + (Object.keys(sug).length ? '<button class="btn btn--soft" data-x="auto">' + I('sparkle', 16) + 'Review ' + Object.keys(sug).length + ' suggested match' + (Object.keys(sug).length > 1 ? 'es' : '') + '</button>' : '') + '<button class="btn btn--p" data-x="done"' + (ok ? '' : ' disabled title="Match every line first — the difference must be zero"') + '>' + I('check', 16) + 'Complete reconciliation</button>' : '') + '</div></div>' +
        '<div class="rc-sum"><div class="st"><span>Statement opening</span><b>' + f.num(sm.opening) + '</b></div><div class="st"><span>Cleared (matched)</span><b>' + f.num(sm.cleared, true) + '</b><em>' + sm.matched + ' of ' + sm.total + ' lines</em></div><div class="st"><span>Statement closing</span><b>' + f.num(sm.closing) + '</b></div><div class="st ' + (sm.difference ? 'st--r' : 'st--g') + '"><span>Difference</span><b>' + f.num(sm.difference, true) + '</b><em>closing − (opening + cleared)</em></div><div class="st"><span>Uncleared in books</span><b>' + f.num(sm.outstandingTotal, true) + '</b><em>' + sm.outstanding.length + ' items — e.g. payments not yet on the statement</em></div></div>' +
        (sm.statementCheck ? '<div class="note note--r mb">' + I('alert', 15) + '<span>The statement lines add up to ' + f.num(sm.statementMovement, true) + ', but closing − opening is ' + f.num(sm.closing - sm.opening, true) + '. Check the balances you entered or the import (off by ' + f.num(sm.statementCheck, true) + ').</span></div>' : '') +
        (done ? '<div class="note note--g mb">' + I('check', 15) + '<span>Completed ' + f.date(r.completedAt) + ' by ' + esc(r.completedBy || '') + '. Every statement line was matched and the difference was zero.</span></div>' : ok ? '<div class="note note--g mb">' + I('check', 15) + '<span>Everything is matched and the difference is zero — you can complete the reconciliation.</span></div>' : '<div class="note mb">' + I('info', 15) + '<span>Select a statement line, then the matching transaction on the right. Amounts must match exactly. For items only on the statement (bank fees, interest), use <b>Record</b> to post them.</span></div>') +
        '<div class="chips">' + [['all', 'All lines'], ['un', 'Unmatched (' + sm.unmatched + ')'], ['m', 'Matched (' + sm.matched + ')']].map(function (c) { return '<button class="chip' + (F.show === c[0] ? ' is-on' : '') + '" data-sh="' + c[0] + '">' + c[1] + '</button>'; }).join('') + '</div>' +
        '<div class="rc"><article class="card"><header class="card__h"><span class="card__t">' + I('doc', 16) + 'Bank statement</span><span class="muted small">' + r.lines.length + ' lines</span></header><div class="rl">' +
          (lines.length ? lines.map(function (l) { var bk = l.match ? bookBy[l.match] : null, sg = sug[l.id], sel = F.pick === l.id; return '<div class="rl__i' + (l.match ? ' is-m' : '') + (sel ? ' is-s' : '') + '" data-line="' + l.id + '"><span class="rl__d">' + f.dshort(l.date) + '</span><span class="rl__t">' + esc(l.desc) + (bk ? '<em>' + I('link', 11) + ' ' + esc(bk.ref) + ' · ' + esc(bk.desc) + '</em>' : '') + '</span><span class="rl__v ' + (l.amount > 0 ? 'pos' : '') + '">' + (l.amount > 0 ? '+' : '−') + f.num(Math.abs(l.amount)) + '</span>' +
            (!done ? '<span class="rl__a">' + (l.match ? '<button class="btn btn--sm btn--ghost" data-un="' + l.id + '">' + I('x', 13) + 'Unmatch</button>' : (sg ? '<button class="btn btn--sm btn--soft" data-acc="' + l.id + '">' + I('check', 13) + 'Match ' + esc(bookBy[sg.key].ref) + '</button><span class="rl__b">' + esc(sg.basis) + '</span>' : '<button class="btn btn--sm' + (sel ? ' btn--p' : '') + '" data-pick="' + l.id + '">' + (sel ? 'Now choose a transaction →' : 'Find match') + '</button>') + '<button class="btn btn--sm btn--ghost" data-rec="' + l.id + '" data-need="post">' + I('plus', 13) + 'Record</button>') + '</span>' : '') + '</div>'; }).join('') : CL.empty('doc', 'No statement lines', 'Import a CSV statement to begin.')) + '</div></article>' +
          '<article class="card"><header class="card__h"><span class="card__t">' + I('ledger', 16) + 'Transactions in C-Ledger</span><span class="muted small">Not yet reconciled, up to ' + f.dshort(r.end) + '</span></header><div class="rl">' +
          (done ? '<p class="muted small">Completed reconciliations are locked.</p>' : book.length ? book.slice().reverse().map(function (b) { var pickL = F.pick ? r.lines.filter(function (l) { return l.id === F.pick; })[0] : null, fits = pickL && pickL.amount === b.amount; return '<div class="rl__i' + (fits ? ' is-s' : '') + '"><span class="rl__d">' + f.dshort(b.date) + '</span><span class="rl__t">' + esc(b.desc) + '<em>' + esc(b.ref) + ' · ' + esc(E.JOURNAL_KINDS[b.kind]) + '</em></span><span class="rl__v ' + (b.amount > 0 ? 'pos' : '') + '">' + (b.amount > 0 ? '+' : '−') + f.num(Math.abs(b.amount)) + '</span>' + (pickL ? '<span class="rl__a"><button class="btn btn--sm' + (fits ? ' btn--p' : '') + '" data-to="' + b.key + '"' + (fits ? '' : ' disabled title="Amounts differ"') + '>' + (fits ? 'Match to selected line' : 'Amount differs') + '</button></span>' : '') + '</div>'; }).join('') : CL.empty('check', 'Nothing left to match')) + '</div></article></div>';
      var rerender = function () { CL.pages.rec.render(v, p); };
      v.onclick = function (e) {
        var t = e.target.closest('button'); if (!t) return; var d = t.dataset;
        if (d.sh) { F.show = d.sh; rerender(); return; }
        if (d.pick) { F.pick = F.pick === d.pick ? null : d.pick; rerender(); return; }
        if (d.to) { var lid = F.pick; F.pick = null; st.act(function () { E.match(r.id, lid, d.to); }, 'Matched'); return; }
        if (d.acc) { st.act(function () { E.match(r.id, d.acc, sug[d.acc].key); }, 'Matched'); return; }
        if (d.un) { st.act(function () { E.match(r.id, d.un, null); }, 'Unmatched'); return; }
        if (d.rec) { recordLine(r, d.rec); return; }
        if (d.x === 'auto') { var keys = Object.keys(sug); CL.confirm({ title: 'Accept ' + keys.length + ' suggested matches?', text: 'Each suggestion pairs a statement line with a ledger transaction of exactly the same amount, dated within 5 days:<ul style="text-align:left;margin:10px 0 0 18px;font-size:12.5px;max-height:200px;overflow:auto">' + keys.map(function (k) { var l = r.lines.filter(function (x) { return x.id === k; })[0]; return '<li>' + esc(l.desc) + ' ↔ ' + esc(bookBy[sug[k].key].ref) + ' — ' + esc(sug[k].basis) + '</li>'; }).join('') + '</ul>', ok: 'Accept all', icon: 'sparkle', onOk: function () { st.act(function () { keys.forEach(function (k) { E.match(r.id, k, sug[k].key); }); }, keys.length + ' lines matched'); } }); return; }
        if (d.x === 'done') CL.confirm({ title: 'Complete this reconciliation?', text: 'All ' + sm.total + ' statement lines are matched and the difference is zero. The matched transactions are marked as reconciled.', ok: 'Complete', icon: 'check', onOk: function () { st.act(function () { E.completeReconciliation(r.id); }, a.name + ' reconciled to ' + f.date(r.end)); } });
        if (d.x === 'cancel') CL.confirm({ title: 'Discard this reconciliation?', text: 'Matches are discarded. Transactions you recorded from the statement stay in the ledger.', ok: 'Discard', tone: 'r', icon: 'trash', onOk: function () { if (st.act(function () { E.cancelReconciliation(r.id); }, 'Reconciliation discarded') !== false) location.hash = '#/reconciliation'; } });
        if (d.x === 'import') importMore(r);
      };
    }
  };
  function recordLine(r, lineId) {
    var E = st.E, l = r.lines.filter(function (x) { return x.id === lineId; })[0], inflow = l.amount > 0;
    var guess = /fee|charge|commission|excise|ledger/i.test(l.desc) ? E.accountByCode('6500').id : /interest/i.test(l.desc) ? E.accountByCode('4900').id : '';
    var p = CL.open('modal', CL.head('Record from the statement', esc(l.desc) + ' · ' + f.money(l.amount, true), 'plus') + '<form class="ovl__body" id="rl" novalidate>' +
      CL.field('Account *', CL.select('accountId', CL.accountOptions(function (a) { return !(E.cashAccounts().indexOf(a) >= 0 && a.id === r.accountId) && !a.system; }, 'Choose account…'), guess), inflow ? 'Where does this money come from? (e.g. Other Income for interest)' : 'What was this money spent on? (e.g. Bank Charges)') +
      CL.field('Description', '<input name="desc" value="' + esc(l.desc) + '">') +
      '<div class="note note--g">' + I('ledger', 15) + '<span>Posts a ' + f.date(l.date) + ' entry for ' + f.num(Math.abs(l.amount)) + ' to ' + esc(E.account(r.accountId).name) + ' and matches it to this line.</span></div><div class="form-err" hidden></div></form>' +
      '<div class="ovl__f"><button class="btn" data-close>Cancel</button><button class="btn btn--p" data-x="ok">' + I('check', 16) + 'Post and match</button></div>', { label: 'Record statement line' });
    p.querySelector('[data-x=ok]').onclick = function () { var form = p.querySelector('#rl'), d = CL.formData(form); if (st.act(function () { return E.createFromStatement(r.id, lineId, d.accountId, d.desc); }, function (j) { return j.ref + ' posted and matched'; }, form)) CL.close(); };
  }
  function importMore(r) {
    var E = st.E, p = CL.open('modal', CL.head('Import statement lines', 'Adds lines to this reconciliation.', 'upload') + '<form class="ovl__body" id="im"><label class="drop">' + I('upload', 22) + '<div><b>Choose a CSV file</b>Date, Description, Amount — or Date, Description, Debit, Credit.</div><input type="file" accept=".csv,text/csv" hidden name="file"></label><div class="form-err" hidden></div></form>', { label: 'Import' });
    var form = p.querySelector('#im');
    form.file.onchange = function () { var fl = form.file.files[0]; if (!fl) return; var rd = new FileReader(); rd.onload = function () { var ls = CL.try(function () { return E.parseStatementCSV(rd.result); }, null, form); if (ls) { st.act(function () { E.addStatementLines(r.id, ls); }, ls.length + ' lines imported'); CL.close(); } }; rd.readAsText(fl); };
  }
})();
