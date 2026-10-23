/* ============================================================
   C-Ledger — General ledger, journal entries, chart of accounts
   ============================================================ */
(function () {
  'use strict';
  var CL = window.CL, I = CL.icon, esc = CL.esc, f = CL.fmt, st = CL.store;
  var TYPE_LABEL = { asset: 'Asset', liability: 'Liability', equity: 'Equity', income: 'Income', expense: 'Expense' };
  CL.TYPE_LABEL = TYPE_LABEL;
  function U(k, d) { st.ui[k] = st.ui[k] || d; return st.ui[k]; }
  function srcLink(j) {
    if (!j.source) return '<span class="muted">Manual</span>';
    var s = j.source, E = st.E;
    if (s.type === 'invoice') { var i = E.invoice(s.id); return i ? '<a class="lk" href="#/invoice/' + i.id + '">' + i.no + '</a>' : '—'; }
    if (s.type === 'bill') { var b = E.bill(s.id); return b ? '<a class="lk" href="#/bill/' + b.id + '">' + b.no + '</a>' : '—'; }
    if (s.type === 'receipt') { var r = st.S.receipts.filter(function (x) { return x.id === s.id; })[0]; return r ? '<a class="lk" href="#/invoice/' + r.invoiceId + '">' + r.no + '</a>' : '—'; }
    if (s.type === 'payment') { var p = st.S.payments.filter(function (x) { return x.id === s.id; })[0]; return p ? '<a class="lk" href="#/bill/' + p.billId + '">' + p.no + '</a>' : '—'; }
    if (s.type === 'expense') { var x = st.S.expenses.filter(function (e) { return e.id === s.id; })[0]; return x ? '<a class="lk" href="#/expenses?open=' + x.id + '">' + x.no + '</a>' : '—'; }
    if (s.type === 'transfer') { var t = st.S.transfers.filter(function (e) { return e.id === s.id; })[0]; return t ? '<a class="lk" href="#/banking">' + t.no + '</a>' : '—'; }
    if (s.type === 'statement') return '<a class="lk" href="#/reconciliation">Bank statement</a>';
    return '—';
  }
  CL.srcLink = srcLink;
  function jStatus(j) { return j.status === 'draft' ? CL.status('draft') : j.reversedBy ? CL.pill('Reversed', 'n', 'reverse') : j.reverses ? CL.pill('Reversal', 'p', 'reverse') : CL.status('posted'); }
  CL.jStatus = jStatus;

  /* =================== GENERAL LEDGER =================== */
  CL.pages.ledger = {
    render: function (v, p, q) {
      var E = st.E, S = st.S, F = U('ledger', { q: '', account: '', from: '', to: '', kind: '', side: '', status: 'posted', sort: 'date', dir: 'desc', page: 1 });
      if (q.account) { F.account = q.account; F.page = 1; }
      var lines = [];
      S.journals.forEach(function (j) {
        if (F.status === 'posted' && j.status !== 'posted') return; if (F.status === 'draft' && j.status !== 'draft') return;
        j.lines.forEach(function (l, i) { lines.push({ j: j, i: i, date: j.date, accountId: l.accountId, debit: l.debit || 0, credit: l.credit || 0, memo: l.memo }); });
      });
      lines.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : (a.j.seq - b.j.seq) || (a.i - b.i); });
      // running balance per account (posted lines only — drafts never move balances)
      var run = {}; lines.forEach(function (l) { if (l.j.status !== 'posted') { l.bal = null; return; } var a = E.account(l.accountId), sign = E.normal(a.type) === 'debit' ? 1 : -1; run[a.id] = (run[a.id] || 0) + sign * (l.debit - l.credit); l.bal = run[a.id]; });
      var s = F.q.trim().toLowerCase();
      var rows = lines.filter(function (l) {
        var a = E.account(l.accountId);
        if (F.account && l.accountId !== F.account) return false; if (F.from && l.date < F.from) return false; if (F.to && l.date > F.to) return false;
        if (F.kind && l.j.kind !== F.kind) return false; if (F.side === 'dr' && !l.debit) return false; if (F.side === 'cr' && !l.credit) return false;
        if (s && (l.j.ref + ' ' + l.j.desc + ' ' + a.code + ' ' + a.name + ' ' + (l.memo || '')).toLowerCase().indexOf(s) < 0) return false;
        return true;
      });
      var td = rows.reduce(function (t, l) { return t + l.debit; }, 0), tc = rows.reduce(function (t, l) { return t + l.credit; }, 0);
      var acc = F.account ? E.account(F.account) : null;
      var cols = [
        { k: 'date', label: 'Date', sort: function (l) { return l.date + String(l.j.seq).padStart(6, '0') + l.i; }, cell: function (l) { return '<span class="nowrap">' + f.date(l.date) + '</span>'; } },
        { k: 'ref', label: 'Reference', sort: function (l) { return l.j.ref; }, cell: function (l) { return '<a class="ref" href="#/journal/' + l.j.id + '">' + esc(l.j.ref) + '</a>'; } },
        { k: 'code', label: 'Code', sort: function (l) { return E.account(l.accountId).code; }, cell: function (l) { return '<span class="mono muted">' + E.account(l.accountId).code + '</span>'; } },
        { k: 'acc', label: 'Account', sort: function (l) { return E.account(l.accountId).name; }, cell: function (l) { return '<a class="lk" href="#/account/' + l.accountId + '">' + esc(E.account(l.accountId).name) + '</a>'; } },
        { k: 'desc', label: 'Description', cell: function (l) { return esc(l.j.desc) + (l.memo && l.memo !== l.j.desc ? '<span class="sub">' + esc(l.memo) + '</span>' : ''); } },
        { k: 'dr', label: 'Debit', cls: 'r', sort: function (l) { return l.debit; }, cell: function (l) { return l.debit ? f.num(l.debit) : ''; } },
        { k: 'cr', label: 'Credit', cls: 'r', sort: function (l) { return l.credit; }, cell: function (l) { return l.credit ? f.num(l.credit) : ''; } },
        { k: 'bal', label: 'Running balance', cls: 'r', cell: function (l) { return l.bal == null ? '<span class="muted">—</span>' : f.num(l.bal, true); } },
        { k: 'src', label: 'Source', cell: function (l) { return srcLink(l.j); } },
        { k: 'st', label: 'Status', cell: function (l) { return jStatus(l.j); } }
      ];
      v.innerHTML = '<header class="ph"><div><h1>General ledger</h1><p>Every journal line, with balances derived from posted entries only.</p></div><div class="ph__a"><button class="btn" data-x="csv">' + I('download', 16) + 'Export CSV</button><a class="btn btn--p" href="#/journal/new" data-need="post">' + I('plus', 16) + 'Journal entry</a></div></header>' +
        (acc ? '<div class="ss"><div class="st st--g"><span>' + esc(acc.code + ' · ' + acc.name) + '</span><b>' + f.money(E.balance(acc.id), true) + '</b><em>' + TYPE_LABEL[acc.type] + ' · normally a ' + E.normal(acc.type) + ' balance</em></div><div class="st"><span>Debits shown</span><b>' + f.num(td) + '</b></div><div class="st"><span>Credits shown</span><b>' + f.num(tc) + '</b></div><div class="st"><span>Lines</span><b>' + rows.length + '</b></div></div>' : '') +
        '<div class="fb"><label class="s">' + I('search', 16) + '<input name="q" placeholder="Search reference, description, account…" value="' + esc(F.q) + '"></label>' +
        '<label class="sel">' + CL.select('account', CL.accountOptions(null, 'All accounts'), F.account) + I('down', 15) + '</label>' +
        '<label class="sel">' + CL.select('kind', [{ v: '', l: 'All types' }].concat(Object.keys(E.JOURNAL_KINDS).map(function (k) { return { v: k, l: E.JOURNAL_KINDS[k] }; })), F.kind) + I('down', 15) + '</label>' +
        '<label class="sel">' + CL.select('side', [{ v: '', l: 'Debits & credits' }, { v: 'dr', l: 'Debits only' }, { v: 'cr', l: 'Credits only' }], F.side) + I('down', 15) + '</label>' +
        '<label class="sel">' + CL.select('status', [{ v: 'posted', l: 'Posted' }, { v: 'draft', l: 'Drafts' }, { v: 'all', l: 'Posted & drafts' }], F.status) + I('down', 15) + '</label>' +
        '<input type="date" name="from" value="' + F.from + '" aria-label="From date"><input type="date" name="to" value="' + F.to + '" aria-label="To date">' +
        (F.q || F.account || F.kind || F.side || F.from || F.to || F.status !== 'posted' ? '<button class="btn btn--ghost btn--sm" data-x="clear">' + I('x', 14) + 'Clear</button>' : '') + '</div>' +
        '<div id="lt">' + CL.table(rows, cols, F, { per: 50, cls: 'wide', rowAttr: function (l) { return 'data-href="#/journal/' + l.j.id + '"' + (l.j.status === 'draft' ? ' class="is-muted"' : ''); }, foot: '<tr><td colspan="5">Totals for ' + rows.length + ' lines</td><td class="r">' + f.num(td) + '</td><td class="r">' + f.num(tc) + '</td><td colspan="3">' + (td === tc ? '<span class="pill pill--g">' + I('check', 12) + 'Balanced</span>' : '<span class="muted small">Filtered view — debits and credits differ because only some lines are shown</span>') + '</td></tr>', empty: 'No journal lines match these filters.' }) + '</div>';
      CL.tableEvents(v, F, function () { CL.pages.ledger.render(v, p, {}); });
      v.querySelectorAll('.fb select, .fb input[type=date]').forEach(function (el) { el.onchange = function () { F[el.name] = el.value; F.page = 1; CL.pages.ledger.render(v, p, {}); }; });
      var qi = v.querySelector('[name=q]'), tmr; qi.oninput = function () { clearTimeout(tmr); tmr = setTimeout(function () { F.q = qi.value; F.page = 1; CL.pages.ledger.render(v, p, {}); var n = v.querySelector('[name=q]'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 220); };
      v.onclick = function (e) {
        var x = e.target.closest('[data-x]');
        if (x && x.dataset.x === 'clear') { Object.assign(F, { q: '', account: '', from: '', to: '', kind: '', side: '', status: 'posted', page: 1 }); CL.pages.ledger.render(v, p, {}); return; }
        if (x && x.dataset.x === 'csv') { CL.csv('c-ledger-general-ledger.csv', [['Date', 'Reference', 'Account code', 'Account', 'Description', 'Memo', 'Debit', 'Credit', 'Running balance', 'Type', 'Status']].concat(rows.map(function (l) { var a = E.account(l.accountId); return [l.date, l.j.ref, a.code, a.name, l.j.desc, l.memo, CL.csvMoney(l.debit || null), CL.csvMoney(l.credit || null), l.bal == null ? '' : CL.csvMoney(l.bal), E.JOURNAL_KINDS[l.j.kind], l.j.status]; }))); return; }
        var tr = e.target.closest('tr[data-href]'); if (tr && !e.target.closest('a,button')) location.hash = tr.dataset.href;
      };
    }
  };

  /* =================== JOURNAL LIST =================== */
  CL.pages.journals = {
    render: function (v, p, q) {
      var E = st.E, S = st.S, F = U('journals', { q: '', status: 'all', kind: '', sort: 'date', dir: 'desc', page: 1 });
      if (q.status) F.status = q.status;
      var counts = { all: S.journals.length, draft: 0, posted: 0, reversed: 0 };
      S.journals.forEach(function (j) { if (j.status === 'draft') counts.draft++; else counts.posted++; if (j.reversedBy) counts.reversed++; });
      var s = F.q.trim().toLowerCase();
      var rows = S.journals.filter(function (j) {
        if (F.status === 'draft' && j.status !== 'draft') return false; if (F.status === 'posted' && j.status !== 'posted') return false; if (F.status === 'reversed' && !j.reversedBy) return false;
        if (F.kind && j.kind !== F.kind) return false;
        if (s && (j.ref + ' ' + j.desc + ' ' + j.lines.map(function (l) { var a = E.account(l.accountId); return a ? a.name : ''; }).join(' ')).toLowerCase().indexOf(s) < 0) return false;
        return true;
      });
      var cols = [
        { k: 'date', label: 'Date', sort: function (j) { return j.date + String(j.seq).padStart(6, '0'); }, cell: function (j) { return '<span class="nowrap">' + f.date(j.date) + '</span>'; } },
        { k: 'ref', label: 'Reference', sort: function (j) { return j.ref; }, cell: function (j) { return '<a class="ref" href="#/journal/' + j.id + '">' + esc(j.ref) + '</a>'; } },
        { k: 'desc', label: 'Description', cell: function (j) { return esc(j.desc) + '<span class="sub">' + j.lines.length + ' lines · ' + esc(j.lines.slice(0, 2).map(function (l) { var a = E.account(l.accountId); return a ? a.name : '?'; }).join(', ')) + (j.lines.length > 2 ? '…' : '') + '</span>'; } },
        { k: 'kind', label: 'Type', sort: function (j) { return j.kind; }, cell: function (j) { return '<span class="nowrap">' + esc(E.JOURNAL_KINDS[j.kind] || j.kind) + '</span>'; } },
        { k: 'amt', label: 'Amount', cls: 'r', sort: function (j) { return E.totals(j.lines).debit; }, cell: function (j) { var t = E.totals(j.lines); return f.num(t.debit) + (t.diff ? '<span class="sub neg">off by ' + f.num(Math.abs(t.diff)) + '</span>' : ''); } },
        { k: 'by', label: 'Created by', cell: function (j) { return '<span class="nowrap">' + esc(j.createdBy || '—') + '</span>'; } },
        { k: 'st', label: 'Status', cell: jStatus }
      ];
      v.innerHTML = '<header class="ph"><div><h1>Journal entries</h1><p>Drafts can be edited; posted entries are permanent and corrected by reversal.</p></div><div class="ph__a"><button class="btn" data-x="csv">' + I('download', 16) + 'Export CSV</button><a class="btn btn--p" href="#/journal/new" data-need="draft">' + I('plus', 16) + 'New journal entry</a></div></header>' +
        '<div class="chips">' + [['all', 'All'], ['draft', 'Drafts'], ['posted', 'Posted'], ['reversed', 'Reversed']].map(function (c) { return '<button class="chip' + (F.status === c[0] ? ' is-on' : '') + '" data-st="' + c[0] + '">' + c[1] + ' <b>' + counts[c[0]] + '</b></button>'; }).join('') + '</div>' +
        '<div class="fb"><label class="s">' + I('search', 16) + '<input name="q" placeholder="Search reference, description or account" value="' + esc(F.q) + '"></label><label class="sel">' + CL.select('kind', [{ v: '', l: 'All types' }].concat(Object.keys(E.JOURNAL_KINDS).map(function (k) { return { v: k, l: E.JOURNAL_KINDS[k] }; })), F.kind) + I('down', 15) + '</label></div>' +
        CL.table(rows, cols, F, { per: 30, rowAttr: function (j) { return 'data-href="#/journal/' + j.id + '"'; } });
      CL.tableEvents(v, F, function () { CL.pages.journals.render(v, p, {}); });
      v.querySelector('[name=kind]').onchange = function (e) { F.kind = e.target.value; F.page = 1; CL.pages.journals.render(v, p, {}); };
      var qi = v.querySelector('[name=q]'), tmr; qi.oninput = function () { clearTimeout(tmr); tmr = setTimeout(function () { F.q = qi.value; F.page = 1; CL.pages.journals.render(v, p, {}); var n = v.querySelector('[name=q]'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 220); };
      v.onclick = function (e) {
        var c = e.target.closest('[data-st]'); if (c) { F.status = c.dataset.st; F.page = 1; history.replaceState(null, '', '#/journals'); CL.pages.journals.render(v, p, {}); return; }
        if (e.target.closest('[data-x=csv]')) { CL.csv('c-ledger-journals.csv', [['Date', 'Reference', 'Description', 'Type', 'Status', 'Account code', 'Account', 'Memo', 'Debit', 'Credit']].concat([].concat.apply([], rows.map(function (j) { return j.lines.map(function (l) { var a = E.account(l.accountId) || {}; return [j.date, j.ref, j.desc, E.JOURNAL_KINDS[j.kind], j.status + (j.reversedBy ? ' (reversed)' : ''), a.code, a.name, l.memo, CL.csvMoney(l.debit || null), CL.csvMoney(l.credit || null)]; }); })))); return; }
        var tr = e.target.closest('tr[data-href]'); if (tr && !e.target.closest('a,button')) location.hash = tr.dataset.href;
      };
    }
  };

  /* =================== JOURNAL DETAIL / EDITOR =================== */
  CL.pages.journal = {
    render: function (v, p, q) {
      var E = st.E, id = p[0];
      if (id === 'new' || q.edit) return editor(v, id === 'new' ? null : E.journal(id), q);
      var j = E.journal(id); if (!j) { v.innerHTML = CL.empty('journal', 'Journal entry not found', 'It may have been deleted (drafts only) or the demo was reset.', '<a class="btn" href="#/journals">All journal entries</a>'); return; }
      var t = E.totals(j.lines), probs = j.status === 'draft' ? E.validate(j) : [], rev = j.reversedBy ? E.journal(j.reversedBy) : null, orig = j.reverses ? E.journal(j.reverses) : null;
      var trail = st.S.audit.filter(function (a) { return a.recordId === j.id || (a.recordType === 'journal' && rev && a.recordId === rev.id); });
      var per = E.periodOf(j.date);
      v.innerHTML = '<a class="crumb" href="#/journals">' + I('left', 14) + 'Journal entries</a>' +
        '<div class="dh"><div><h1>' + esc(j.ref) + ' ' + jStatus(j) + '</h1><div class="dh__s"><span>' + I('calendar', 13) + ' ' + f.date(j.date) + '</span><span>' + esc(E.JOURNAL_KINDS[j.kind] || j.kind) + '</span><span>Period: ' + (per ? esc(per.label) + ' (' + per.status + ')' : 'outside configured periods') + '</span><span>Source: ' + srcLink(j) + '</span></div></div>' +
        '<div class="dh__a">' +
          (j.status === 'draft' ? '<button class="btn" data-x="del" data-need="draft">' + I('trash', 16) + 'Delete draft</button><a class="btn" href="#/journal/' + j.id + '?edit=1" data-need="draft">' + I('edit', 16) + 'Edit</a><button class="btn btn--p" data-x="post" data-need="post"' + (probs.length ? ' disabled title="Fix the problems first"' : '') + '>' + I('check', 16) + 'Post to ledger</button>' : '') +
          (j.status === 'posted' && !j.reversedBy && !j.reverses ? '<button class="btn" data-x="copy" data-need="draft">' + I('copy', 16) + 'Duplicate as draft</button><button class="btn" data-x="rev" data-need="post">' + I('reverse', 16) + 'Reverse</button>' : '') +
          '<button class="btn" onclick="print()">' + I('print', 16) + 'Print</button>' +
        '</div></div>' +
        (rev ? '<div class="note mb">' + I('reverse', 15) + '<span>Reversed by <a class="lk" href="#/journal/' + rev.id + '">' + rev.ref + '</a> on ' + f.date(rev.date) + '. Both entries stay in the ledger so the history is complete; together they net to zero.</span></div>' : '') +
        (orig ? '<div class="note mb">' + I('reverse', 15) + '<span>This entry reverses <a class="lk" href="#/journal/' + orig.id + '">' + orig.ref + '</a>.</span></div>' : '') +
        (j.status === 'posted' ? '<div class="note note--g mb">' + I('lock', 15) + '<span>Posted ' + (j.postedAt ? f.date(j.postedAt) + ' at ' + f.time(j.postedAt) : '') + (j.postedBy ? ' by ' + esc(j.postedBy) : '') + '. Posted entries cannot be edited — reverse it, or post an adjusting entry.</span></div>' : '') +
        (probs.length ? '<div class="note note--r mb">' + I('alert', 15) + '<span><b>This draft cannot be posted yet.</b> ' + probs.map(esc).join(' ') + '</span></div>' : '') +
        '<div class="g" style="grid-template-columns:minmax(0,1fr) 320px;align-items:start" id="jg">' +
          '<article class="card"><header class="card__h"><span class="card__t">' + esc(j.desc) + '</span></header>' +
          '<div class="t-wrap"><table class="t lines-t"><thead><tr><th>Account</th><th>Memo</th><th class="r">Debit</th><th class="r">Credit</th></tr></thead><tbody>' +
          j.lines.map(function (l) { var a = E.account(l.accountId) || { name: 'Unknown', code: '' }, c = l.contactId ? E.contact(l.contactId) : null; return '<tr><td><a class="lk" href="#/account/' + l.accountId + '">' + a.code + ' · ' + esc(a.name) + '</a></td><td>' + esc(l.memo || '') + (c ? '<span class="sub">' + esc(c.name) + '</span>' : '') + '</td><td class="r">' + (l.debit ? f.num(l.debit) : '') + '</td><td class="r">' + (l.credit ? f.num(l.credit) : '') + '</td></tr>'; }).join('') +
          '</tbody><tfoot><tr><td colspan="2">Totals</td><td class="r">' + f.num(t.debit) + '</td><td class="r">' + f.num(t.credit) + '</td></tr></tfoot></table></div>' +
          (j.notes ? '<p class="muted" style="margin-top:12px">' + I('info', 13) + ' ' + esc(j.notes) + '</p>' : '') +
          (j.attachments && j.attachments.length ? '<div style="margin-top:12px" class="chips">' + j.attachments.map(function (a) { return '<span class="chip">' + I('clip', 13) + esc(a.name) + ' <b>' + Math.round(a.size / 1024) + ' KB</b></span>'; }).join('') + '</div>' : '') + '</article>' +
          '<aside class="g"><article class="card"><header class="card__h"><span class="card__t">' + I('info', 16) + 'Details</span></header><dl class="kv"><dt>Reference</dt><dd>' + esc(j.ref) + '</dd><dt>Created</dt><dd>' + (j.createdAt ? f.date(j.createdAt) : '—') + ' · ' + esc(j.createdBy || '—') + '</dd><dt>Status</dt><dd>' + (j.status === 'draft' ? 'Draft — no effect on balances' : 'Posted') + '</dd><dt>Balanced</dt><dd>' + (t.diff ? '<span class="neg">No — off by ' + f.num(Math.abs(t.diff)) + '</span>' : '<span class="pos">Yes</span>') + '</dd></dl></article>' +
          '<article class="card"><header class="card__h"><span class="card__t">' + I('clock', 16) + 'Audit trail</span></header>' + (trail.length ? '<div class="tl">' + trail.map(function (a) { return '<div class="tl__i"><span class="tl__d">' + I(a.action.indexOf('reverse') >= 0 ? 'reverse' : a.action.indexOf('post') >= 0 ? 'check' : 'edit', 14) + '</span><span><b>' + esc(a.summary) + '</b><em>' + esc(a.actor.name) + ' · ' + f.date(a.at) + ' ' + f.time(a.at) + '</em></span></div>'; }).join('') + '</div>' : '<p class="muted small">Created by the sample-data generator before the demo’s audit window.</p>') + '</article></aside>' +
        '</div>';
      if (innerWidth < 980) v.querySelector('#jg').style.gridTemplateColumns = 'minmax(0,1fr)';
      v.onclick = function (e) {
        var x = e.target.closest('[data-x]'); if (!x) return;
        if (x.dataset.x === 'post') CL.confirm({ title: 'Post ' + j.ref + '?', text: 'Debits and credits of <b>' + f.money(t.debit) + '</b> will be written to the general ledger. Posted entries cannot be edited.', ok: 'Post entry', icon: 'check', onOk: function () { return st.act(function () { E.post(j.id); }, j.ref + ' posted to the ledger') !== false; } });
        if (x.dataset.x === 'del') CL.confirm({ title: 'Delete draft ' + j.ref + '?', text: 'Drafts have no effect on the ledger, so nothing else changes.', ok: 'Delete draft', tone: 'r', icon: 'trash', onOk: function () { if (st.act(function () { E.deleteDraft(j.id); }, 'Draft deleted') !== false) location.hash = '#/journals'; } });
        if (x.dataset.x === 'rev') CL.confirm({ title: 'Reverse ' + j.ref + '?', text: 'C-Ledger posts an equal and opposite entry. The original stays in the ledger and both are linked in the audit trail.', ok: 'Post reversal', icon: 'reverse', tone: 'a', extra: CL.field('Reversal date', '<input type="date" name="rd" value="' + (st.today() < j.date ? j.date : st.today()) + '">'), input: { label: 'Reason', placeholder: 'e.g. Posted to the wrong account', required: true }, onOk: function (reason, panel) { var r = st.act(function () { return E.reverse(j.id, panel.querySelector('[name=rd]').value, reason); }, function (r) { return 'Reversed with ' + r.ref; }, panel); if (r === false) return false; } });
        if (x.dataset.x === 'copy') { var nj = st.act(function () { return E.saveJournal({ date: st.today(), desc: j.desc + ' (copy)', kind: j.kind === 'reversing' ? 'general' : j.kind, lines: j.lines.map(function (l) { return { accountId: l.accountId, debit: l.debit, credit: l.credit, memo: l.memo }; }), notes: 'Copied from ' + j.ref }); }, 'Draft created from ' + j.ref); if (nj) location.hash = '#/journal/' + nj.id + '?edit=1'; }
      };
    }
  };

  function editor(v, j, q) {
    var E = st.E, T = st.today();
    if (j && j.status !== 'draft') { location.hash = '#/journal/' + j.id; return; }
    var d = j ? { date: j.date, desc: j.desc, kind: j.kind, notes: j.notes, lines: j.lines.map(function (l) { return Object.assign({}, l); }), attachments: (j.attachments || []).slice() } :
      { date: T, desc: '', kind: q.kind || 'general', notes: '', lines: [{ accountId: '', debit: 0, credit: 0, memo: '' }, { accountId: '', debit: 0, credit: 0, memo: '' }], attachments: [] };
    var kinds = ['general', 'adjusting', 'opening', 'accrual', 'depreciation'];
    var templates = { depreciation: [['6900', 'debit'], ['1590', 'credit']], accrual: [['', 'debit'], ['2300', 'credit']], opening: [['', 'debit'], ['3100', 'credit']] };
    function acOpts(val) { return CL.select('acc', CL.accountOptions(function (a) { return !a.system || a.sub === 'tax'; }, 'Choose account…'), val, ' class="cell-in" aria-label="Account"'); }
    function rowH(l, i) {
      return '<tr data-i="' + i + '"><td style="min-width:220px">' + acOpts(l.accountId) + '</td><td style="min-width:160px"><input class="cell-in" name="memo" value="' + esc(l.memo || '') + '" placeholder="Line memo" aria-label="Memo"></td>' +
        '<td class="num" data-l="Debit" style="width:150px"><input class="cell-in" name="dr" inputmode="decimal" value="' + (l.debit ? f.input(l.debit) : '') + '" placeholder="0.00" aria-label="Debit"></td><td class="num" data-l="Credit" style="width:150px"><input class="cell-in" name="cr" inputmode="decimal" value="' + (l.credit ? f.input(l.credit) : '') + '" placeholder="0.00" aria-label="Credit"></td>' +
        '<td class="x"><button type="button" class="ib ib--sm" data-x="rm" aria-label="Remove line"' + (d.lines.length <= 2 ? ' disabled' : '') + '>' + I('x', 15) + '</button></td></tr>';
    }
    function draw() {
      v.innerHTML = '<a class="crumb" href="' + (j ? '#/journal/' + j.id : '#/journals') + '">' + I('left', 14) + (j ? j.ref : 'Journal entries') + '</a>' +
        '<header class="ph"><div><h1>' + (j ? 'Edit draft ' + esc(j.ref) : 'New journal entry') + '</h1><p>Enter at least two lines. It can only be posted when total debits equal total credits.</p></div></header>' +
        '<form class="je" id="jf" novalidate><div class="g">' +
          '<article class="card"><div class="fg3"><label class="fld"><span>Date *</span><input type="date" name="date" value="' + d.date + '" required></label>' +
          CL.field('Entry type', CL.select('kind', kinds.map(function (k) { return { v: k, l: E.JOURNAL_KINDS[k] }; }), d.kind)) +
          '<label class="fld"><span>Financial period</span><input name="per" readonly value=""></label>' +
          '<label class="fld full"><span>Description *</span><input name="desc" value="' + esc(d.desc) + '" placeholder="e.g. Monthly depreciation — studio equipment" required></label></div><div id="perNote"></div></article>' +
          '<article class="card"><header class="card__h"><span class="card__t">' + I('coa', 16) + 'Lines</span><span class="muted small">Amounts in ' + f.cur() + ', up to 2 decimals</span></header>' +
          '<div style="overflow-x:auto"><table class="jl"><thead><tr><th>Account</th><th>Memo</th><th class="r" style="text-align:right">Debit</th><th style="text-align:right">Credit</th><th></th></tr></thead><tbody id="jlb">' + d.lines.map(rowH).join('') + '</tbody></table></div>' +
          '<button type="button" class="btn btn--soft btn--sm" data-x="add" style="margin-top:8px">' + I('plus', 15) + 'Add line</button></article>' +
          '<article class="card"><div class="fg"><label class="fld full"><span>Supporting notes</span><textarea name="notes" rows="3" placeholder="Why this entry is needed, calculation basis, approvals…">' + esc(d.notes || '') + '</textarea></label>' +
          '<div class="full"><span class="small" style="font-weight:700;color:var(--ink-2)">Attachments</span><label class="drop" style="margin-top:6px">' + I('upload', 20) + '<div>Drop supporting files or <b>browse</b></div><input type="file" multiple hidden name="file"></label><div class="chips" id="atts" style="margin-top:8px"></div><p class="muted small">Demo: only the file name and size are kept, in this browser. Production stores files securely.</p></div></div></article>' +
        '</div>' +
        '<aside class="jt"><article class="card"><header class="card__h"><span class="card__t">' + I('ledger', 16) + 'Totals</span></header><div id="tots"></div>' +
          '<div class="form-err" hidden></div>' +
          '<div class="g" style="gap:8px;margin-top:12px"><button type="button" class="btn btn--p" data-x="post" data-need="post">' + I('check', 16) + 'Save and post</button><button type="button" class="btn" data-x="save">' + I('edit', 16) + 'Save as draft</button><a class="btn btn--ghost" href="' + (j ? '#/journal/' + j.id : '#/journals') + '">Cancel</a></div></article>' +
          '<div class="note" style="margin-top:12px">' + I('info', 15) + '<span>Drafts never affect balances or reports. Posting is permanent — mistakes are corrected by reversal.</span></div></aside>' +
        '</form>';
      var form = v.querySelector('#jf');
      form.addEventListener('input', onInput); form.addEventListener('change', onInput);
      form.addEventListener('click', onClick);
      var drop = form.querySelector('.drop'), fi = form.querySelector('[name=file]');
      fi.onchange = function () { addFiles(fi.files); fi.value = ''; };
      ['dragover', 'dragenter'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('is-over'); }); });
      ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('is-over'); if (ev === 'drop') addFiles(e.dataTransfer.files); }); });
      totals(); atts();
    }
    function addFiles(list) { [].forEach.call(list, function (fl) { if (fl.size > 10 * 1024 * 1024) { CL.toast(fl.name + ' is over 10 MB', 'err'); return; } d.attachments.push({ name: fl.name, size: fl.size }); }); atts(); }
    function atts() { var b = v.querySelector('#atts'); b.innerHTML = d.attachments.map(function (a, i) { return '<span class="chip">' + I('clip', 13) + esc(a.name) + '<button type="button" data-x="rmatt" data-i="' + i + '" aria-label="Remove ' + esc(a.name) + '">' + I('x', 12) + '</button></span>'; }).join(''); }
    function read() {
      var form = v.querySelector('#jf'), bad = [];
      d.date = form.date.value; d.desc = form.desc.value; d.kind = form.kind.value; d.notes = form.notes.value;
      v.querySelectorAll('#jlb tr').forEach(function (tr, i) {
        var l = d.lines[i], dr = f.parse(tr.querySelector('[name=dr]').value), cr = f.parse(tr.querySelector('[name=cr]').value);
        l.accountId = tr.querySelector('[name=acc]').value; l.memo = tr.querySelector('[name=memo]').value;
        tr.querySelector('[name=dr]').setAttribute('aria-invalid', isNaN(dr) || dr < 0 ? 'true' : 'false'); tr.querySelector('[name=cr]').setAttribute('aria-invalid', isNaN(cr) || cr < 0 ? 'true' : 'false');
        if (isNaN(dr) || isNaN(cr)) bad.push(i + 1);
        l.debit = isNaN(dr) ? 0 : dr; l.credit = isNaN(cr) ? 0 : cr;
      });
      return bad;
    }
    function totals() {
      var bad = read(), t = E.totals(d.lines), per = E.periodOf(d.date || T);
      v.querySelector('[name=per]').value = per ? per.label + (per.status === 'closed' ? ' — closed' : ' — open') : d.date ? 'No period configured' : '';
      var fy = d.date ? E.fyOf(T) : null, pn = v.querySelector('#perNote');
      pn.innerHTML = per && per.status === 'closed' ? '<div class="note note--r" style="margin-top:12px">' + I('lock', 15) + '<span>' + esc(per.label) + ' is closed. Choose a date in an open period, or ask an Owner or Accountant to reopen it.</span></div>' : d.date && fy && (d.date < fy.start || d.date > fy.end) ? '<div class="note note--a" style="margin-top:12px">' + I('alert', 15) + '<span>This date is outside the current financial year (' + esc(fy.label) + ').</span></div>' : d.date > T ? '<div class="note note--a" style="margin-top:12px">' + I('calendar', 15) + '<span>Future-dated entry — it will appear in reports from ' + f.date(d.date) + '.</span></div>' : '';
      v.querySelector('#tots').innerHTML = '<div class="jt__row"><span>Total debits</span><b>' + f.num(t.debit) + '</b></div><div class="jt__row"><span>Total credits</span><b>' + f.num(t.credit) + '</b></div><div class="jt__row"><span>Difference</span><b class="' + (t.diff ? 'neg' : '') + '">' + f.num(Math.abs(t.diff)) + '</b></div>' +
        (bad.length ? '<div class="bal-no">' + I('alert', 16) + 'Line ' + bad.join(', ') + ': amount must be a number with at most 2 decimals</div>' : t.debit === 0 ? '<div class="bal-no" style="background:var(--card-2);color:var(--ink-3)">' + I('info', 16) + 'Enter the amounts</div>' : t.diff ? '<div class="bal-no">' + I('alert', 16) + 'Unbalanced — ' + (t.diff > 0 ? 'credits' : 'debits') + ' are short by ' + f.num(Math.abs(t.diff)) + '</div>' : '<div class="bal-ok">' + I('check', 16) + 'Balanced</div>');
      var pb = v.querySelector('[data-x=post]'); pb.disabled = !!(bad.length || t.diff || !t.debit);
    }
    function onInput(e) {
      var tr = e.target.closest && e.target.closest('#jlb tr');
      if (tr && (e.target.name === 'dr' || e.target.name === 'cr') && e.type === 'input' && e.target.value) { var other = tr.querySelector('[name=' + (e.target.name === 'dr' ? 'cr' : 'dr') + ']'); if (other.value) other.value = ''; }
      if (e.target.name === 'kind' && e.type === 'change' && !j && templates[e.target.value] && d.lines.every(function (l) { return !l.accountId && !l.debit && !l.credit; })) { read(); d.lines = templates[e.target.value].map(function (x) { return { accountId: x[0] ? E.accountByCode(x[0]).id : '', debit: 0, credit: 0, memo: '' }; }); v.querySelector('#jlb').innerHTML = d.lines.map(rowH).join(''); }
      if (e.target.type === 'file') return;
      if (e.type === 'change' && (e.target.name === 'dr' || e.target.name === 'cr') && e.target.value) { var pv = f.parse(e.target.value); if (!isNaN(pv) && pv > 0) e.target.value = f.num(pv); }
      totals();
    }
    function onClick(e) {
      var x = e.target.closest('[data-x]'); if (!x) return;
      if (x.dataset.x === 'add') { read(); d.lines.push({ accountId: '', debit: 0, credit: 0, memo: '' }); v.querySelector('#jlb').innerHTML = d.lines.map(rowH).join(''); var last = v.querySelectorAll('#jlb tr'); last[last.length - 1].querySelector('select').focus(); totals(); }
      if (x.dataset.x === 'rm') { read(); var i = +x.closest('tr').dataset.i; d.lines.splice(i, 1); v.querySelector('#jlb').innerHTML = d.lines.map(rowH).join(''); totals(); }
      if (x.dataset.x === 'rmatt') { d.attachments.splice(+x.dataset.i, 1); atts(); }
      if (x.dataset.x === 'save' || x.dataset.x === 'post') {
        if (read().length) { CL.toast('Fix the highlighted amounts first.', 'err'); return; }
        var form = v.querySelector('#jf'); form.querySelector('.form-err').hidden = true;
        if (!d.desc.trim()) { CL.try(function () { var er = new Error('Description is required.'); er.userFacing = true; er.field = 'desc'; throw er; }, null, form); return; }
        var data = { date: d.date, desc: d.desc, kind: d.kind, notes: d.notes, lines: d.lines, attachments: d.attachments };
        if (x.dataset.x === 'save') { var saved = st.act(function () { return E.saveJournal(data, j && j.id); }, (j ? 'Draft updated' : 'Draft saved'), form); if (saved) location.hash = '#/journal/' + saved.id; return; }
        var t = E.totals(d.lines);
        CL.confirm({ title: 'Post this journal entry?', text: '<b>' + f.money(t.debit) + '</b> in debits and credits will be written to the ledger, dated ' + f.date(d.date) + '. Posted entries cannot be edited.', ok: 'Post entry', icon: 'check', onOk: function () {
          var key = 'post:' + (j ? j.id : 'new') + ':' + Date.now(); if (CL._posting) return false; CL._posting = key; // guards a double click
          var r = st.act(function () { var jj = E.saveJournal(data, j && j.id); try { E.post(jj.id); } catch (er) { if (!j) { E.deleteDraft(jj.id); } throw er; } return jj; }, function (jj) { return jj.ref + ' posted to the ledger'; }, form);
          CL._posting = null; if (r) location.hash = '#/journal/' + r.id; else CL.close();
        } });
      }
    }
    draw();
  }

  /* =================== CHART OF ACCOUNTS =================== */
  CL.pages.accounts = {
    render: function (v, p, q) {
      var E = st.E, S = st.S, F = U('coa', { q: '', type: '', status: 'active' });
      var asOf = st.today(), s = F.q.trim().toLowerCase();
      var groups = ['asset', 'liability', 'equity', 'income', 'expense'];
      var html = '<header class="ph"><div><h1>Chart of accounts</h1><p>' + S.accounts.filter(function (a) { return a.status === 'active'; }).length + ' active accounts · balances from posted entries as of ' + f.date(asOf) + '</p></div><div class="ph__a"><button class="btn" data-x="csv">' + I('download', 16) + 'Export CSV</button><button class="btn btn--p" data-x="new" data-need="settings">' + I('plus', 16) + 'New account</button></div></header>' +
        '<div class="ss">' + [['asset', 'Assets'], ['liability', 'Liabilities'], ['equity', 'Equity'], ['income', 'Income (FY)']].map(function (g) { var fy = E.fyOf(asOf), val = g[0] === 'income' ? E.typeTotal('income', asOf, fy.start) : E.typeTotal(g[0], asOf) + (g[0] === 'equity' ? E.netIncome(null, asOf) : 0); return '<div class="st' + (g[0] === 'asset' ? ' st--g' : '') + '"><span>' + g[1] + '</span><b>' + f.short(val) + '</b>' + (g[0] === 'equity' ? '<em>incl. earnings to date</em>' : '') + '</div>'; }).join('') + '</div>' +
        '<div class="chips">' + [['', 'All'], ['asset', 'Assets'], ['liability', 'Liabilities'], ['equity', 'Equity'], ['income', 'Income'], ['expense', 'Expenses']].map(function (c) { return '<button class="chip' + (F.type === c[0] ? ' is-on' : '') + '" data-ty="' + c[0] + '">' + c[1] + '</button>'; }).join('') + '</div>' +
        '<div class="fb"><label class="s">' + I('search', 16) + '<input name="q" placeholder="Search code or name" value="' + esc(F.q) + '"></label><label class="sel">' + CL.select('status', [{ v: 'active', l: 'Active accounts' }, { v: 'archived', l: 'Archived' }, { v: 'all', l: 'All statuses' }], F.status) + I('down', 15) + '</label></div>' +
        '<div class="t-wrap"><table class="t t--cards"><thead><tr><th>Code</th><th>Account</th><th>Type</th><th>Normal balance</th><th class="r">Balance</th><th>Status</th><th></th></tr></thead><tbody>';
      groups.forEach(function (g) {
        if (F.type && F.type !== g) return;
        var list = E.accountsByType(g).filter(function (a) { if (F.status !== 'all' && a.status !== F.status) return false; if (s && (a.code + ' ' + a.name + ' ' + a.desc).toLowerCase().indexOf(s) < 0) return false; return true; });
        if (!list.length) return;
        var tot = list.reduce(function (t, a) { return t + E.balance(a.id, asOf); }, 0);
        html += '<tr class="is-grp"><td colspan="4">' + { asset: 'Assets', liability: 'Liabilities', equity: 'Equity', income: 'Income', expense: 'Expenses' }[g] + '</td><td class="r" data-l="Total">' + f.num(tot, true) + '</td><td colspan="2"></td></tr>';
        list.forEach(function (a) {
          var b = E.balance(a.id, asOf), par = a.parentId ? E.account(a.parentId) : null;
          html += '<tr data-href="#/account/' + a.id + '"' + (a.status === 'archived' ? ' class="is-muted"' : '') + '><td class="mono" data-l="Code"><b>' + a.code + '</b></td><td data-l="Account"' + (par ? ' class="ind"' : '') + '><a class="lk" href="#/account/' + a.id + '">' + esc(a.name) + '</a>' + (a.system ? ' ' + CL.pill('Control', 'b', 'lock') : '') + '<span class="sub">' + esc(a.desc || '') + '</span></td><td data-l="Type">' + TYPE_LABEL[a.type] + '</td><td data-l="Normal balance">' + (E.normal(a.type) === 'debit' ? 'Debit' : 'Credit') + '</td><td class="r" data-l="Balance">' + f.num(b, true) + '</td><td data-l="Status">' + CL.status(a.status) + '</td><td class="r"><button class="ib ib--sm" data-menu="' + a.id + '" aria-label="Actions for ' + esc(a.name) + '">' + I('more', 16) + '</button></td></tr>';
        });
      });
      html += '</tbody></table></div><p class="muted small" style="margin-top:10px">' + I('info', 12) + ' Balances are shown in each account’s normal direction; figures in brackets run against it (for example accumulated depreciation, or VAT reclaimable exceeding VAT due).</p>';
      v.innerHTML = html;
      v.querySelector('[name=status]').onchange = function (e) { F.status = e.target.value; CL.pages.accounts.render(v, p, q); };
      var qi = v.querySelector('[name=q]'), tmr; qi.oninput = function () { clearTimeout(tmr); tmr = setTimeout(function () { F.q = qi.value; CL.pages.accounts.render(v, p, q); var n = v.querySelector('[name=q]'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 200); };
      v.onclick = function (e) {
        var c = e.target.closest('[data-ty]'); if (c) { F.type = c.dataset.ty; CL.pages.accounts.render(v, p, q); return; }
        if (e.target.closest('[data-x=new]')) { accountForm(); return; }
        if (e.target.closest('[data-x=csv]')) { CL.csv('c-ledger-chart-of-accounts.csv', [['Code', 'Name', 'Type', 'Normal balance', 'Parent', 'Description', 'Balance', 'Status']].concat(S.accounts.slice().sort(function (a, b) { return a.code < b.code ? -1 : 1; }).map(function (a) { return [a.code, a.name, TYPE_LABEL[a.type], E.normal(a.type), a.parentId ? E.account(a.parentId).code : '', a.desc, CL.csvMoney(E.balance(a.id)), a.status]; }))); return; }
        var m = e.target.closest('[data-menu]'); if (m) { acctMenu(m, E.account(m.dataset.menu)); return; }
        var tr = e.target.closest('tr[data-href]'); if (tr && !e.target.closest('a,button')) location.hash = tr.dataset.href;
      };
    }
  };
  function acctMenu(anchor, a) {
    var E = st.E;
    CL.menu(anchor, [
      { label: 'Open account', icon: 'eye', fn: function () { location.hash = '#/account/' + a.id; } },
      { label: 'View in ledger', icon: 'ledger', fn: function () { location.hash = '#/ledger?account=' + a.id; } },
      { label: 'Edit', icon: 'edit', disabled: !E.can('settings'), fn: function () { accountForm(a); } },
      '-',
      a.status === 'active' ? { label: 'Archive', icon: 'archive', disabled: !E.can('settings') || a.system, fn: function () { CL.confirm({ title: 'Archive ' + a.name + '?', text: 'Archived accounts keep their history and stay in reports, but cannot be used in new entries. An account must have a zero balance to be archived.', ok: 'Archive', icon: 'archive', tone: 'a', onOk: function () { st.act(function () { E.setAccountStatus(a.id, 'archived'); }, a.name + ' archived'); } }); } } : { label: 'Restore', icon: 'refresh', disabled: !E.can('settings'), fn: function () { st.act(function () { E.setAccountStatus(a.id, 'active'); }, a.name + ' restored'); } },
      { label: 'Delete', icon: 'trash', danger: true, disabled: !E.can('settings') || a.system, fn: function () { CL.confirm({ title: 'Delete ' + a.name + '?', text: 'Only accounts that have never been used can be deleted. Accounts with history are archived instead.', ok: 'Delete', tone: 'r', icon: 'trash', onOk: function () { st.act(function () { E.deleteAccount(a.id); }, 'Account deleted'); } }); } }
    ]);
  }
  function accountForm(a) {
    var E = st.E, used = a && E.hasPostings(a.id);
    var p = CL.open('modal', CL.head(a ? 'Edit account' : 'New account', a ? esc(a.code + ' · ' + a.name) : 'Add an account to the chart of accounts.', 'coa') +
      '<form class="ovl__body" id="af" novalidate><div class="fg">' +
        CL.field('Code *', '<input name="code" value="' + esc(a ? a.code : '') + '" inputmode="numeric" placeholder="e.g. 6450" autofocus>', '3–6 digits. Groups: 1 assets, 2 liabilities, 3 equity, 4 income, 5–6 expenses.') +
        CL.field('Type *', CL.select('type', [{ v: '', l: 'Choose…' }, { v: 'asset', l: 'Asset' }, { v: 'liability', l: 'Liability' }, { v: 'equity', l: 'Equity' }, { v: 'income', l: 'Income' }, { v: 'expense', l: 'Expense' }], a ? a.type : '', used ? ' disabled' : ''), used ? 'Locked — this account has posted transactions.' : '') +
        CL.field('Name *', '<input name="name" value="' + esc(a ? a.name : '') + '" placeholder="e.g. Training & Development">', '', 'full') +
        CL.field('Parent account', CL.select('parentId', [{ v: '', l: 'None — top level' }].concat(st.S.accounts.filter(function (x) { return !a || x.id !== a.id; }).sort(function (x, y) { return x.code < y.code ? -1 : 1; }).map(function (x) { return { v: x.id, l: x.code + ' · ' + x.name + ' (' + TYPE_LABEL[x.type] + ')' }; })), a ? a.parentId : ''), 'Must be the same type.', 'full') +
        CL.field('Description', '<textarea name="desc" rows="2">' + esc(a ? a.desc : '') + '</textarea>', '', 'full') +
      '</div>' + (!a ? '<div class="note">' + I('info', 15) + '<span>To give the account an opening balance, post an <a class="lk" href="#/journal/new?kind=opening">opening balance journal</a> once it is created — balances always come from journal entries.</span></div>' : '') + '<div class="form-err" hidden></div></form>' +
      '<div class="ovl__f"><button class="btn" data-close>Cancel</button><button class="btn btn--p" data-x="save">' + I('check', 16) + (a ? 'Save changes' : 'Create account') + '</button></div>', { label: 'Account' });
    p.querySelector('[data-x=save]').onclick = function () { var form = p.querySelector('#af'), d = CL.formData(form); if (used) d.type = a.type; if (st.act(function () { return E.saveAccount(d, a && a.id); }, a ? 'Account updated' : 'Account created', form) !== false) CL.close(); };
  }
  CL.accountForm = accountForm;

  /* =================== ACCOUNT DETAIL =================== */
  CL.pages.account = {
    render: function (v, p) {
      var E = st.E, a = E.account(p[0]); if (!a) { v.innerHTML = CL.empty('coa', 'Account not found'); return; }
      var F = U('acct:' + a.id, { from: E.fyOf(st.today()).start, to: st.today(), page: 1 });
      var gl = E.generalLedger(a.id, F.from, F.to), months = st.months(12), vals = months.map(function (m) { return E.balance(a.id, m.to); });
      var mov = gl.rows.reduce(function (t, r) { t.d += r.line.debit; t.c += r.line.credit; return t; }, { d: 0, c: 0 });
      v.innerHTML = '<a class="crumb" href="#/accounts">' + I('left', 14) + 'Chart of accounts</a>' +
        '<div class="dh"><div><h1>' + a.code + ' · ' + esc(a.name) + ' ' + CL.status(a.status) + (a.system ? ' ' + CL.pill('Control account', 'b', 'lock') : '') + '</h1><div class="dh__s"><span>' + TYPE_LABEL[a.type] + '</span><span>Normal balance: ' + E.normal(a.type) + '</span>' + (a.parentId ? '<span>Parent: ' + esc(E.account(a.parentId).name) + '</span>' : '') + '</div></div>' +
        '<div class="dh__a"><button class="btn" data-x="menu">' + I('more', 16) + 'Actions</button><a class="btn" href="#/ledger?account=' + a.id + '">' + I('ledger', 16) + 'Open in ledger</a><button class="btn" data-x="csv">' + I('download', 16) + 'Export</button></div></div>' +
        (a.desc ? '<p class="muted mb">' + esc(a.desc) + '</p>' : '') +
        '<div class="ss"><div class="st st--g"><span>Balance today</span><b>' + f.money(E.balance(a.id), true) + '</b></div><div class="st"><span>Opening ' + f.date(F.from) + '</span><b>' + f.num(gl.opening, true) + '</b></div><div class="st"><span>Debits / credits in period</span><b>' + f.short(mov.d, true) + ' / ' + f.short(mov.c, true) + '</b></div><div class="st"><span>Closing ' + f.date(F.to) + '</span><b>' + f.num(gl.closing, true) + '</b></div></div>' +
        '<article class="card mb"><header class="card__h"><span class="card__t">' + I('trendUp', 16) + 'Month-end balance</span></header><div class="chart-w" id="chA"></div></article>' +
        '<div class="fb"><span class="muted small" style="font-weight:700">Period</span><input type="date" name="from" value="' + F.from + '" aria-label="From"><input type="date" name="to" value="' + F.to + '" aria-label="To"></div>' +
        CL.table(gl.rows, [
          { k: 'd', label: 'Date', cell: function (r) { return '<span class="nowrap">' + f.date(r.line.date) + '</span>'; } },
          { k: 'r', label: 'Reference', cell: function (r) { return '<a class="ref" href="#/journal/' + r.line.j.id + '">' + esc(r.line.j.ref) + '</a>'; } },
          { k: 'x', label: 'Description', cell: function (r) { return esc(r.line.j.desc) + (r.line.memo ? '<span class="sub">' + esc(r.line.memo) + '</span>' : ''); } },
          { k: 'dr', label: 'Debit', cls: 'r', cell: function (r) { return r.line.debit ? f.num(r.line.debit) : ''; } },
          { k: 'cr', label: 'Credit', cls: 'r', cell: function (r) { return r.line.credit ? f.num(r.line.credit) : ''; } },
          { k: 'b', label: 'Balance', cls: 'r', cell: function (r) { return f.num(r.balance, true); } }
        ], F, { per: 40, rowAttr: function (r) { return 'data-href="#/journal/' + r.line.j.id + '"'; }, empty: 'No posted activity in this period.', foot: '<tr><td colspan="3">Opening ' + f.num(gl.opening, true) + ' → closing</td><td class="r" data-l="Debits">' + f.num(mov.d) + '</td><td class="r" data-l="Credits">' + f.num(mov.c) + '</td><td class="r" data-l="Closing">' + f.num(gl.closing, true) + '</td></tr>' });
      CL.chart.mount(v.querySelector('#chA'), function (w) { return CL.chart.line({ w: w, h: 200, labels: months.map(function (m) { return f.MON[+m.key.slice(5) - 1]; }), series: [{ values: vals }] }); }, function (i) { return '<b>' + f.monthLong(months[i].key) + '</b><span>Balance <i>' + f.money(vals[i], true) + '</i></span>'; });
      CL.tableEvents(v, F, function () { CL.pages.account.render(v, p); });
      v.querySelectorAll('input[type=date]').forEach(function (el) { el.onchange = function () { F[el.name] = el.value; F.page = 1; CL.pages.account.render(v, p); }; });
      v.onclick = function (e) {
        var x = e.target.closest('[data-x]');
        if (x && x.dataset.x === 'menu') { acctMenu(x, a); return; }
        if (x && x.dataset.x === 'csv') { CL.csv('c-ledger-' + a.code + '.csv', [['Date', 'Reference', 'Description', 'Memo', 'Debit', 'Credit', 'Balance']].concat([[F.from, '', 'Opening balance', '', '', '', CL.csvMoney(gl.opening)]], gl.rows.map(function (r) { return [r.line.date, r.line.j.ref, r.line.j.desc, r.line.memo, CL.csvMoney(r.line.debit || null), CL.csvMoney(r.line.credit || null), CL.csvMoney(r.balance)]; }))); return; }
        var tr = e.target.closest('tr[data-href]'); if (tr && !e.target.closest('a,button')) location.hash = tr.dataset.href;
      };
    }
  };
})();
