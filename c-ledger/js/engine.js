/* ============================================================
   C-Ledger — accounting engine
   Pure double-entry logic with no DOM. Runs in the browser (window.CL.Engine)
   and in Node (module.exports) so the accounting rules can be tested.

   Conventions
   - Money is integer cents (KES 1,250.50 → 125050). Never floats.
   - Dates are ISO strings 'YYYY-MM-DD' and compare as strings.
   - Balances are always derived from POSTED journal lines. Drafts never count.
   - Posted journals are immutable; corrections are reversing / adjusting entries.
   ============================================================ */
(function (root) {
  'use strict';

  /* ---------------- helpers ---------------- */
  var TYPES = ['asset', 'liability', 'equity', 'income', 'expense'];
  var NORMAL = { asset: 'debit', expense: 'debit', liability: 'credit', equity: 'credit', income: 'credit' };
  function err(msg, field) { var e = new Error(msg); e.userFacing = true; if (field) e.field = field; return e; }
  function isInt(n) { return typeof n === 'number' && isFinite(n) && Math.floor(n) === n; }
  function roundHalfUp(x) { return x < 0 ? -Math.round(-x) : Math.round(x); }
  /** qty (may be decimal) × unit price (cents) less discount %, rounded once to whole cents. */
  function lineNet(qty, price, discPct) { return roundHalfUp(qty * price * (1 - (discPct || 0) / 100)); }
  function taxOf(net, rate) { return roundHalfUp(net * (rate || 0) / 100); }
  function iso(d) { d = new Date(d); var m = d.getMonth() + 1, day = d.getDate(); return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day; }
  function addDays(s, n) { var d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + n); return iso(d); }
  function daysBetween(a, b) { return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 864e5); }
  function monthKey(s) { return s.slice(0, 7); }
  function sum(arr, f) { var t = 0; for (var i = 0; i < arr.length; i++) t += f ? f(arr[i]) : arr[i]; return t; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function pad(n, w) { n = String(n); while (n.length < w) n = '0' + n; return n; }

  /* ---------------- engine ---------------- */
  function Engine(S, opts) {
    opts = opts || {};
    var E = {};
    var today = function () { return opts.today ? opts.today() : iso(new Date()); };
    var actor = function () { return opts.actor ? opts.actor() : { id: 'system', name: 'System', role: 'owner' }; };
    E.S = S;

    /* ---------- lookups ---------- */
    var idx = null;
    function index() {
      if (idx && idx.rev === S.rev) return idx;
      var acc = {}, con = {}, jn = {}, inv = {}, bill = {};
      S.accounts.forEach(function (a) { acc[a.id] = a; });
      S.contacts.forEach(function (c) { con[c.id] = c; });
      S.journals.forEach(function (j) { jn[j.id] = j; });
      S.invoices.forEach(function (x) { inv[x.id] = x; });
      S.bills.forEach(function (x) { bill[x.id] = x; });
      // posted lines, date-sorted, with a stable key for reconciliation
      var lines = [];
      S.journals.forEach(function (j) {
        if (j.status !== 'posted') return;
        j.lines.forEach(function (l, i) { lines.push({ key: j.id + ':' + i, j: j, i: i, date: j.date, accountId: l.accountId, debit: l.debit || 0, credit: l.credit || 0, memo: l.memo || '', contactId: l.contactId || j.contactId || null }); });
      });
      lines.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : (a.j.seq - b.j.seq) || (a.i - b.i); });
      idx = { rev: S.rev, acc: acc, con: con, jn: jn, inv: inv, bill: bill, lines: lines, memo: {} };
      return idx;
    }
    function touch() { S.rev = (S.rev || 0) + 1; }
    E.account = function (id) { return index().acc[id]; };
    E.accountByCode = function (code) { return S.accounts.filter(function (a) { return a.code === String(code); })[0]; };
    E.contact = function (id) { return index().con[id]; };
    E.journal = function (id) { return index().jn[id]; };
    E.invoice = function (id) { return index().inv[id]; };
    E.bill = function (id) { return index().bill[id]; };
    E.postedLines = function () { return index().lines; };
    E.normal = function (type) { return NORMAL[type]; };
    E.def = function (key) { var id = S.settings.defaults[key]; return E.account(id); };

    function nextNo(series) {
      var cfg = S.settings.numbering[series]; cfg.next = (cfg.next || 1);
      var n = cfg.prefix + pad(cfg.next, cfg.pad || 4); cfg.next++; return n;
    }
    function nid(p) { S.seq = S.seq || {}; S.seq[p] = (S.seq[p] || 0) + 1; return p + S.seq[p]; }

    /* ---------- audit ---------- */
    function audit(action, recordType, recordId, summary, before, after) {
      var a = actor();
      S.audit.push({ id: nid('au'), at: opts.now ? opts.now() : new Date().toISOString(), actor: { id: a.id, name: a.name, role: a.role, simulated: !!a.simulated }, action: action, recordType: recordType, recordId: recordId, summary: summary, before: before == null ? null : before, after: after == null ? null : after });
    }
    E.audit = audit;

    /* ---------- permissions ---------- */
    var PERMS = {
      owner: ['view', 'draft', 'post', 'reverse', 'approve', 'reconcile', 'reports', 'settings', 'periods', 'team'],
      accountant: ['view', 'draft', 'post', 'reverse', 'approve', 'reconcile', 'reports', 'periods'],
      finance_manager: ['view', 'draft', 'post', 'approve', 'reconcile', 'reports'],
      bookkeeper: ['view', 'draft', 'post', 'reconcile', 'reports'],
      approver: ['view', 'approve', 'reports'],
      viewer: ['view', 'reports']
    };
    E.PERMS = PERMS;
    E.can = function (perm, role) { return (PERMS[role || actor().role] || []).indexOf(perm) >= 0; };
    var sysDepth = 0; // system postings run under the permission check of the business action that triggered them
    function need(perm) { if (!sysDepth && !E.can(perm)) throw err('Your role (' + roleName(actor().role) + ') cannot ' + PERM_LABEL[perm] + '.'); }
    var PERM_LABEL = { draft: 'create drafts', post: 'post to the ledger', reverse: 'reverse posted entries', approve: 'approve bills or expenses', reconcile: 'reconcile accounts', settings: 'change accounting settings', periods: 'open or close periods', team: 'manage the team' };
    function roleName(r) { return { owner: 'Owner', accountant: 'Accountant', finance_manager: 'Finance manager', bookkeeper: 'Bookkeeper', approver: 'Approver', viewer: 'Read-only viewer' }[r] || r; }
    E.roleName = roleName;

    /* ---------- periods ---------- */
    E.periodOf = function (date) { var k = monthKey(date); return S.periods.filter(function (p) { return p.key === k; })[0] || null; };
    E.isClosed = function (date) { var p = E.periodOf(date); return !!(p && p.status === 'closed'); };
    E.fyOf = function (date) {
      var start = S.settings.fyStartMonth || 1, y = +date.slice(0, 4), m = +date.slice(5, 7);
      var fy = m >= start ? y : y - 1; var s = fy + '-' + pad(start, 2) + '-01';
      var e = addDays(iso(new Date(fy + 1, start - 1, 1)), -1);
      return { start: s, end: e, label: start === 1 ? 'FY ' + fy : 'FY ' + fy + '/' + String(fy + 1).slice(2) };
    };
    function checkDate(date, label) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) throw err((label || 'Date') + ' is required.', 'date');
      if (E.isClosed(date)) throw err('The period ' + E.periodOf(date).label + ' is closed. Reopen it (Owner or Accountant) or date the entry in an open period.', 'date');
    }
    E.closePeriod = function (key) {
      need('periods'); var p = S.periods.filter(function (x) { return x.key === key; })[0]; if (!p) throw err('Unknown period.');
      if (p.status === 'closed') return p;
      var drafts = S.journals.filter(function (j) { return j.status === 'draft' && monthKey(j.date) === key; });
      if (drafts.length) throw err(drafts.length + ' draft journal' + (drafts.length > 1 ? 's are' : ' is') + ' dated in ' + p.label + '. Post or delete ' + (drafts.length > 1 ? 'them' : 'it') + ' first.');
      var before = p.status; p.status = 'closed'; p.closedAt = today(); p.closedBy = actor().name; touch();
      audit('period.close', 'period', key, 'Closed ' + p.label, { status: before }, { status: 'closed' }); return p;
    };
    E.reopenPeriod = function (key, reason) {
      need('periods'); var p = S.periods.filter(function (x) { return x.key === key; })[0]; if (!p) throw err('Unknown period.');
      if (!reason || !reason.trim()) throw err('Give a reason for reopening the period.', 'reason');
      p.status = 'open'; p.reopenedAt = today(); touch();
      audit('period.reopen', 'period', key, 'Reopened ' + p.label + ' — ' + reason.trim(), { status: 'closed' }, { status: 'open' }); return p;
    };

    /* ---------- accounts ---------- */
    E.accountsByType = function (t) { return S.accounts.filter(function (a) { return a.type === t; }).sort(function (a, b) { return a.code < b.code ? -1 : 1; }); };
    E.hasPostings = function (accountId) { return index().lines.some(function (l) { return l.accountId === accountId; }); };
    E.saveAccount = function (data, id) {
      need('settings');
      var code = String(data.code || '').trim(), name = String(data.name || '').trim();
      if (!/^\d{3,6}$/.test(code)) throw err('Account code must be 3–6 digits.', 'code');
      if (!name) throw err('Account name is required.', 'name');
      if (TYPES.indexOf(data.type) < 0) throw err('Choose an account type.', 'type');
      var dup = S.accounts.filter(function (a) { return a.code === code && a.id !== id; })[0];
      if (dup) throw err('Code ' + code + ' is already used by ' + dup.name + '.', 'code');
      if (data.parentId) { var par = E.account(data.parentId); if (!par || par.type !== data.type) throw err('A parent account must be of the same type.', 'parentId'); if (par.id === id) throw err('An account cannot be its own parent.', 'parentId'); }
      if (id) {
        var a = E.account(id); var before = clone(a);
        if (a.type !== data.type && E.hasPostings(id)) throw err('This account has posted transactions, so its type cannot change. Archive it and create a new account instead.', 'type');
        a.code = code; a.name = name; a.type = data.type; a.sub = data.sub || a.sub || ''; a.parentId = data.parentId || null; a.desc = data.desc || '';
        touch(); audit('account.update', 'account', id, 'Updated ' + code + ' ' + name, before, clone(a)); return a;
      }
      var acc = { id: nid('a'), code: code, name: name, type: data.type, sub: data.sub || '', parentId: data.parentId || null, desc: data.desc || '', status: 'active', system: false };
      S.accounts.push(acc); touch(); audit('account.create', 'account', acc.id, 'Created ' + code + ' ' + name, null, clone(acc)); return acc;
    };
    E.setAccountStatus = function (id, status) {
      need('settings'); var a = E.account(id); if (!a) throw err('Unknown account.');
      if (a.system && status === 'archived') throw err(a.name + ' is a control account used by C-Ledger and cannot be archived.');
      if (status === 'archived' && E.balance(id) !== 0) throw err(a.name + ' still has a balance of ' + E.fmt(E.balance(id)) + '. Move the balance with a journal before archiving.');
      var before = a.status; a.status = status; touch(); audit('account.' + (status === 'archived' ? 'archive' : 'restore'), 'account', id, (status === 'archived' ? 'Archived ' : 'Restored ') + a.code + ' ' + a.name, { status: before }, { status: status }); return a;
    };
    E.deleteAccount = function (id) {
      need('settings'); var a = E.account(id);
      if (a.system) throw err('Control accounts cannot be deleted.');
      if (E.hasPostings(id) || S.journals.some(function (j) { return j.lines.some(function (l) { return l.accountId === id; }); })) throw err('This account is used in journal entries. Archive it instead — deleting would break the audit trail.');
      if (S.accounts.some(function (x) { return x.parentId === id; })) throw err('Move or delete its sub-accounts first.');
      S.accounts.splice(S.accounts.indexOf(a), 1); touch(); audit('account.delete', 'account', id, 'Deleted unused account ' + a.code + ' ' + a.name, clone(a), null);
    };

    /* ---------- balances ---------- */
    /** Signed balance in the account's normal direction, from posted lines in (from, to]. */
    E.balance = function (accountId, to, from) {
      var a = E.account(accountId); if (!a) return 0;
      var k = 'b|' + accountId + '|' + (to || '') + '|' + (from || ''); var m = index().memo; if (k in m) return m[k];
      var d = 0, c = 0; index().lines.forEach(function (l) { if (l.accountId !== accountId) return; if (to && l.date > to) return; if (from && l.date < from) return; d += l.debit; c += l.credit; });
      return (m[k] = NORMAL[a.type] === 'debit' ? d - c : c - d);
    };
    /** Includes sub-accounts. */
    E.balanceTree = function (accountId, to, from) {
      var t = E.balance(accountId, to, from);
      S.accounts.forEach(function (x) { if (x.parentId === accountId) t += E.balanceTree(x.id, to, from); });
      return t;
    };
    E.typeTotal = function (type, to, from) { return sum(S.accounts.filter(function (a) { return a.type === type; }), function (a) { return E.balance(a.id, to, from); }); };
    E.cashAccounts = function () { return S.accounts.filter(function (a) { return a.type === 'asset' && (a.sub === 'bank' || a.sub === 'cash'); }); };

    /* ---------- journals ---------- */
    E.JOURNAL_KINDS = { general: 'General journal', adjusting: 'Adjusting entry', opening: 'Opening balances', accrual: 'Accrual', depreciation: 'Depreciation', reversing: 'Reversing entry', invoice: 'Customer invoice', receipt: 'Customer receipt', bill: 'Supplier bill', payment: 'Supplier payment', expense: 'Expense', transfer: 'Transfer', bank: 'Bank transaction' };
    E.totals = function (lines) {
      var d = sum(lines, function (l) { return l.debit || 0; }), c = sum(lines, function (l) { return l.credit || 0; });
      return { debit: d, credit: c, diff: d - c };
    };
    /** Returns a list of problems; empty means the entry can be posted. */
    E.validate = function (j) {
      var p = [];
      if (!j.date || !/^\d{4}-\d{2}-\d{2}$/.test(j.date)) p.push('Date is required.');
      else if (E.isClosed(j.date)) p.push(E.periodOf(j.date).label + ' is closed.');
      if (!j.desc || !String(j.desc).trim()) p.push('Description is required.');
      var lines = (j.lines || []).filter(function (l) { return l.accountId || l.debit || l.credit; });
      if (lines.length < 2) p.push('A journal needs at least two lines.');
      lines.forEach(function (l, i) {
        var n = i + 1, a = E.account(l.accountId);
        if (!l.accountId) p.push('Line ' + n + ': choose an account.');
        else if (!a) p.push('Line ' + n + ': unknown account.');
        else if (a.status !== 'active') p.push('Line ' + n + ': ' + a.name + ' is archived.');
        var d = l.debit || 0, c = l.credit || 0;
        if (!isInt(d) || !isInt(c) || d < 0 || c < 0) p.push('Line ' + n + ': amounts must be positive with at most 2 decimals.');
        if (d && c) p.push('Line ' + n + ': enter a debit or a credit, not both.');
        if (!d && !c) p.push('Line ' + n + ': enter an amount.');
      });
      var t = E.totals(lines);
      if (t.debit !== t.credit) p.push('Debits (' + E.fmt(t.debit) + ') and credits (' + E.fmt(t.credit) + ') differ by ' + E.fmt(Math.abs(t.diff)) + '.');
      if (t.debit === 0) p.push('The journal has no amounts.');
      return p;
    };
    function cleanLines(lines) {
      return (lines || []).filter(function (l) { return l.accountId || l.debit || l.credit; }).map(function (l) { return { accountId: l.accountId, debit: l.debit || 0, credit: l.credit || 0, memo: l.memo || '', contactId: l.contactId || null }; });
    }
    /** Create (draft) or update a draft. System-generated journals pass sys:true. */
    E.saveJournal = function (data, id) {
      need('draft');
      if (id) {
        var j = E.journal(id); if (!j) throw err('Unknown journal.');
        if (j.status !== 'draft') throw err('Posted entries cannot be edited. Reverse it, or post an adjusting entry.');
        var before = clone(j);
        j.date = data.date; j.desc = (data.desc || '').trim(); j.kind = data.kind || j.kind; j.notes = data.notes || ''; j.lines = cleanLines(data.lines); j.attachments = data.attachments || j.attachments || [];
        touch(); audit('journal.update', 'journal', id, 'Edited draft ' + j.ref, before, clone(j)); return j;
      }
      if (data.date) checkDate(data.date);
      var jn = { id: nid('j'), seq: (S.seq.jseq = (S.seq.jseq || 0) + 1), ref: data.ref || nextNo('journal'), date: data.date, desc: (data.desc || '').trim(), kind: data.kind || 'general', status: 'draft', lines: cleanLines(data.lines), notes: data.notes || '', attachments: data.attachments || [], source: data.source || null, contactId: data.contactId || null, createdAt: opts.now ? opts.now() : new Date().toISOString(), createdBy: actor().name, postedAt: null, reversedBy: null, reverses: null };
      S.journals.push(jn); touch();
      if (!data.sys) audit('journal.create', 'journal', jn.id, 'Created draft ' + jn.ref + ' — ' + jn.desc, null, clone(jn));
      return jn;
    };
    E.deleteDraft = function (id) {
      var j = E.journal(id); if (!j) return; if (j.status !== 'draft') throw err('Only drafts can be deleted. Posted entries are reversed instead.');
      need('draft'); S.journals.splice(S.journals.indexOf(j), 1); touch(); audit('journal.delete', 'journal', id, 'Deleted draft ' + j.ref, clone(j), null);
    };
    /** Post a draft. Throws on any validation problem. */
    E.post = function (id, o) {
      o = o || {}; need('post'); var j = E.journal(id); if (!j) throw err('Unknown journal.');
      if (j.status === 'posted') throw err(j.ref + ' is already posted.');
      var probs = E.validate(j); if (probs.length) throw err(probs[0]);
      j.status = 'posted'; j.postedAt = opts.now ? opts.now() : new Date().toISOString(); j.postedBy = actor().name; touch();
      if (!o.silent) audit('journal.post', 'journal', id, 'Posted ' + j.ref + ' — ' + j.desc + ' (' + E.fmt(E.totals(j.lines).debit) + ')', { status: 'draft' }, { status: 'posted' });
      return j;
    };
    /** One-step create + post for system documents (invoice, receipt …). Rolls back on failure. */
    function postNew(data) {
      sysDepth++;
      try {
        var j = E.saveJournal(Object.assign({ sys: true }, data));
        try { E.post(j.id, { silent: true }); } catch (e) { S.journals.splice(S.journals.indexOf(j), 1); touch(); throw e; }
        return j;
      } finally { sysDepth--; }
    }
    E._postNew = postNew;
    /** Reverse a posted entry with an equal and opposite entry. */
    E.reverse = function (id, date, reason) {
      need('reverse'); var j = E.journal(id); if (!j) throw err('Unknown journal.');
      if (j.status !== 'posted') throw err('Only posted entries can be reversed.');
      if (j.reversedBy) throw err(j.ref + ' has already been reversed by ' + E.journal(j.reversedBy).ref + '.');
      if (j.reverses) throw err(j.ref + ' is itself a reversal. Post a new entry instead.');
      if (j.source && !o_allowSourceReverse(j)) throw err(j.ref + ' was created by ' + (j.source.type === 'invoice' ? 'an invoice' : j.source.type === 'bill' ? 'a bill' : 'a ' + j.source.type) + '. Void or correct it from that document so the document and the ledger stay in step.');
      date = date || today(); checkDate(date, 'Reversal date');
      if (date < j.date) throw err('A reversal cannot be dated before the original entry (' + j.date + ').');
      var r = E.saveJournal({ sys: true, date: date, desc: 'Reversal of ' + j.ref + (reason ? ' — ' + reason : ''), kind: 'reversing', lines: j.lines.map(function (l) { return { accountId: l.accountId, debit: l.credit, credit: l.debit, memo: l.memo, contactId: l.contactId }; }), notes: reason || '' });
      r.reverses = j.id; E.post(r.id, { silent: true }); j.reversedBy = r.id; touch();
      audit('journal.reverse', 'journal', j.id, 'Reversed ' + j.ref + ' with ' + r.ref + (reason ? ' — ' + reason : ''), { reversedBy: null }, { reversedBy: r.ref });
      return r;
    };
    var _allowSrc = false; function o_allowSourceReverse() { return _allowSrc; }
    function reverseSystem(j, date, reason) { _allowSrc = true; sysDepth++; try { return E.reverse(j.id, date, reason); } finally { _allowSrc = false; sysDepth--; } }

    /* ---------- tax ---------- */
    E.taxRate = function (id) { return S.settings.taxRates.filter(function (t) { return t.id === id; })[0] || { id: 'none', name: 'No tax', rate: 0 }; };

    /* ---------- invoices (receivables) ---------- */
    E.invoiceTotals = function (inv) {
      var lines = inv.lines.map(function (l) { var net = lineNet(+l.qty || 0, +l.price || 0, +l.disc || 0), gross = roundHalfUp((+l.qty || 0) * (+l.price || 0)); return { net: net, discount: gross - net, tax: taxOf(net, E.taxRate(l.taxId).rate) }; });
      var sub = sum(lines, function (x) { return x.net + x.discount; }), disc = sum(lines, function (x) { return x.discount; }), net = sum(lines, function (x) { return x.net; }), tax = sum(lines, function (x) { return x.tax; });
      return { lines: lines, subtotal: sub, discount: disc, net: net, tax: tax, total: net + tax };
    };
    E.invoicePaid = function (inv) { return sum(S.receipts.filter(function (r) { return r.invoiceId === inv.id && !r.voided; }), function (r) { return r.applied; }); };
    E.invoiceOutstanding = function (inv) { return inv.status === 'draft' || inv.status === 'void' ? 0 : E.invoiceTotals(inv).total - E.invoicePaid(inv); };
    E.invoiceStatus = function (inv, asOf) {
      if (inv.status === 'draft' || inv.status === 'void') return inv.status;
      var out = E.invoiceOutstanding(inv), paid = E.invoicePaid(inv);
      if (out <= 0) return 'paid';
      if (inv.due < (asOf || today())) return 'overdue';
      return paid > 0 ? 'partial' : 'issued';
    };
    function validateDoc(doc, kind) {
      if (!doc.contactId || !E.contact(doc.contactId)) throw err('Choose a ' + (kind === 'invoice' ? 'customer' : 'supplier') + '.', 'contactId');
      if (!doc.issue) throw err('Issue date is required.', 'issue');
      if (!doc.due) throw err('Due date is required.', 'due');
      if (doc.due < doc.issue) throw err('The due date cannot be before the issue date.', 'due');
      if (!doc.lines || !doc.lines.length) throw err('Add at least one line.');
      doc.lines.forEach(function (l, i) {
        var n = i + 1;
        if (!String(l.desc || '').trim()) throw err('Line ' + n + ': add a description.');
        if (!l.accountId || !E.account(l.accountId)) throw err('Line ' + n + ': choose an account.');
        if (kind === 'invoice') {
          if (!(+l.qty > 0)) throw err('Line ' + n + ': quantity must be more than zero.');
          if (!isInt(+l.price) || +l.price < 0) throw err('Line ' + n + ': enter a valid unit price.');
          if (+l.disc < 0 || +l.disc > 100) throw err('Line ' + n + ': discount must be between 0 and 100%.');
        } else if (!isInt(+l.amount) || +l.amount <= 0) throw err('Line ' + n + ': enter an amount.');
      });
    }
    E.saveInvoice = function (data, id) {
      need('draft'); validateDoc(data, 'invoice');
      if (id) {
        var inv = E.invoice(id); if (inv.status !== 'draft') throw err('Issued invoices cannot be edited. Void it and issue a new one, or raise a credit note.');
        var before = clone(inv); Object.assign(inv, { contactId: data.contactId, issue: data.issue, due: data.due, lines: data.lines, notes: data.notes || '', ref: data.ref || '' }); touch();
        audit('invoice.update', 'invoice', id, 'Edited draft ' + inv.no, before, clone(inv)); return inv;
      }
      var x = { id: nid('inv'), no: nextNo('invoice'), contactId: data.contactId, issue: data.issue, due: data.due, lines: data.lines, notes: data.notes || '', ref: data.ref || '', status: 'draft', journalId: null, createdAt: today() };
      S.invoices.push(x); touch(); if (!data.sys) audit('invoice.create', 'invoice', x.id, 'Created draft ' + x.no + ' for ' + E.contact(x.contactId).name, null, clone(x)); return x;
    };
    /** Issue: Dr Accounts Receivable (total) / Cr revenue per line (net) / Cr VAT (tax). */
    E.issueInvoice = function (id, o) {
      o = o || {}; need('post'); var inv = E.invoice(id); if (!inv) throw err('Unknown invoice.');
      if (inv.status !== 'draft') throw err(inv.no + ' has already been issued.');
      validateDoc(inv, 'invoice'); checkDate(inv.issue, 'Issue date');
      var t = E.invoiceTotals(inv), ar = E.def('ar'), vat = E.def('vat'), cust = E.contact(inv.contactId);
      if (t.total <= 0) throw err('The invoice total must be more than zero.');
      var byAcc = {}; inv.lines.forEach(function (l, i) { byAcc[l.accountId] = (byAcc[l.accountId] || 0) + t.lines[i].net; });
      var lines = [{ accountId: ar.id, debit: t.total, credit: 0, memo: inv.no + ' · ' + cust.name, contactId: cust.id }];
      Object.keys(byAcc).forEach(function (a) { if (byAcc[a]) lines.push({ accountId: a, debit: 0, credit: byAcc[a], memo: inv.no }); });
      if (t.tax) lines.push({ accountId: vat.id, debit: 0, credit: t.tax, memo: 'Output VAT · ' + inv.no });
      var j = postNew({ date: inv.issue, desc: 'Invoice ' + inv.no + ' — ' + cust.name, kind: 'invoice', lines: lines, source: { type: 'invoice', id: inv.id }, contactId: cust.id, ref: inv.no });
      inv.status = 'issued'; inv.journalId = j.id; inv.issuedAt = today(); touch();
      if (!o.silent) audit('invoice.issue', 'invoice', id, 'Issued ' + inv.no + ' to ' + cust.name + ' for ' + E.fmt(t.total) + ' — posted ' + j.ref, { status: 'draft' }, { status: 'issued', journal: j.ref });
      return inv;
    };
    E.voidInvoice = function (id, reason, date) {
      need('reverse'); var inv = E.invoice(id);
      if (inv.status === 'void') throw err(inv.no + ' is already void.');
      if (inv.status === 'draft') { inv.status = 'void'; touch(); audit('invoice.void', 'invoice', id, 'Voided draft ' + inv.no, { status: 'draft' }, { status: 'void' }); return inv; }
      if (E.invoicePaid(inv) > 0) throw err(inv.no + ' has receipts recorded against it. Reverse the receipts first.');
      if (!reason) throw err('Give a reason for voiding.', 'reason');
      var r = reverseSystem(E.journal(inv.journalId), date || (inv.issue > today() ? inv.issue : today()), 'Void ' + inv.no + ' — ' + reason);
      inv.status = 'void'; inv.voidJournalId = r.id; touch();
      audit('invoice.void', 'invoice', id, 'Voided ' + inv.no + ' — ' + reason + ' (reversal ' + r.ref + ')', { status: 'issued' }, { status: 'void' }); return inv;
    };
    /**
     * Receipt against an invoice: Dr Bank / Cr Accounts Receivable.
     * Revenue was recognised when the invoice was issued, so it is not touched here.
     * An amount above the outstanding balance is refused unless asCredit=true,
     * in which case the excess goes to Customer credits (a liability).
     */
    E.recordReceipt = function (data, o) {
      o = o || {}; need('post');
      if (data.key && S.opKeys[data.key]) throw err('This receipt was already recorded (duplicate submission blocked).');
      var inv = E.invoice(data.invoiceId); if (!inv || inv.status === 'draft' || inv.status === 'void') throw err('Receipts can only be recorded against issued invoices.');
      var amt = +data.amount; if (!isInt(amt) || amt <= 0) throw err('Enter the amount received.', 'amount');
      var bank = E.account(data.accountId); if (!bank || E.cashAccounts().indexOf(bank) < 0) throw err('Choose the bank or cash account that received the money.', 'accountId');
      checkDate(data.date, 'Receipt date'); if (data.date < inv.issue) throw err('A receipt cannot be dated before the invoice (' + inv.issue + ').', 'date');
      var out = E.invoiceOutstanding(inv);
      if (out <= 0) throw err(inv.no + ' is already fully paid.');
      var applied = Math.min(amt, out), excess = amt - applied;
      if (excess > 0 && !data.asCredit) throw err('That is ' + E.fmt(excess) + ' more than the ' + E.fmt(out) + ' outstanding. Reduce the amount, or tick "Record the excess as a customer credit".', 'amount');
      var cust = E.contact(inv.contactId), no = nextNo('receipt');
      var lines = [{ accountId: bank.id, debit: amt, credit: 0, memo: no + ' · ' + cust.name, contactId: cust.id }, { accountId: E.def('ar').id, debit: 0, credit: applied, memo: inv.no, contactId: cust.id }];
      if (excess) lines.push({ accountId: E.def('custCredit').id, debit: 0, credit: excess, memo: 'Overpayment on ' + inv.no, contactId: cust.id });
      var j = postNew({ date: data.date, desc: 'Receipt ' + no + ' — ' + cust.name + ' for ' + inv.no, kind: 'receipt', lines: lines, source: { type: 'receipt', id: no }, contactId: cust.id, ref: no });
      var r = { id: nid('r'), no: no, invoiceId: inv.id, contactId: cust.id, date: data.date, amount: amt, applied: applied, excess: excess, accountId: bank.id, method: data.method || 'Bank transfer', reference: data.reference || '', journalId: j.id, voided: false };
      S.receipts.push(r); j.source.id = r.id; if (data.key) S.opKeys[data.key] = r.id; touch();
      if (!o.silent) audit('receipt.record', 'receipt', r.id, 'Recorded ' + no + ' — ' + E.fmt(amt) + ' from ' + cust.name + ' against ' + inv.no + (excess ? ' (' + E.fmt(excess) + ' to customer credit)' : ''), null, { applied: applied, excess: excess, journal: j.ref });
      return r;
    };
    E.reverseReceipt = function (id, reason) {
      need('reverse'); var r = S.receipts.filter(function (x) { return x.id === id; })[0]; if (!r || r.voided) throw err('Unknown receipt.');
      if (!reason) throw err('Give a reason.', 'reason');
      if (r.reconciled) throw err(r.no + ' is reconciled to a bank statement. Undo the reconciliation first.');
      var j = reverseSystem(E.journal(r.journalId), r.date > today() ? r.date : today(), 'Reverse ' + r.no + ' — ' + reason);
      r.voided = true; r.voidJournalId = j.id; touch(); audit('receipt.reverse', 'receipt', id, 'Reversed ' + r.no + ' — ' + reason, { voided: false }, { voided: true }); return r;
    };

    /* ---------- bills (payables) ---------- */
    E.billTotals = function (b) {
      var lines = b.lines.map(function (l) { var net = +l.amount || 0; return { net: net, tax: taxOf(net, E.taxRate(l.taxId).rate) }; });
      var net = sum(lines, function (x) { return x.net; }), tax = sum(lines, function (x) { return x.tax; });
      return { lines: lines, net: net, tax: tax, total: net + tax };
    };
    E.billPaid = function (b) { return sum(S.payments.filter(function (p) { return p.billId === b.id && !p.voided; }), function (p) { return p.amount; }); };
    E.billOutstanding = function (b) { return b.status === 'posted' ? E.billTotals(b).total - E.billPaid(b) : 0; };
    E.billStatus = function (b, asOf) {
      if (b.status !== 'posted') return b.status; // draft | approved | void
      var out = E.billOutstanding(b), paid = E.billPaid(b);
      if (out <= 0) return 'paid'; if (b.due < (asOf || today())) return 'overdue'; return paid > 0 ? 'partial' : 'posted';
    };
    E.saveBill = function (data, id) {
      need('draft'); validateDoc(data, 'bill');
      if (id) {
        var b = E.bill(id); if (b.status !== 'draft') throw err('Only draft bills can be edited.');
        var before = clone(b); Object.assign(b, { contactId: data.contactId, ref: data.ref || '', issue: data.issue, due: data.due, desc: data.desc || '', lines: data.lines, notes: data.notes || '' }); touch();
        audit('bill.update', 'bill', id, 'Edited draft ' + b.no, before, clone(b)); return b;
      }
      var x = { id: nid('bl'), no: nextNo('bill'), contactId: data.contactId, ref: data.ref || '', issue: data.issue, due: data.due, desc: data.desc || '', lines: data.lines, notes: data.notes || '', status: 'draft', journalId: null };
      S.bills.push(x); touch(); if (!data.sys) audit('bill.create', 'bill', x.id, 'Entered draft ' + x.no + ' from ' + E.contact(x.contactId).name, null, clone(x)); return x;
    };
    E.approveBill = function (id, o) {
      o = o || {}; need('approve'); var b = E.bill(id); if (b.status !== 'draft') throw err('Only draft bills need approval.');
      b.status = 'approved'; b.approvedBy = actor().name; touch(); if (!o.silent) audit('bill.approve', 'bill', id, 'Approved ' + b.no, { status: 'draft' }, { status: 'approved' }); return b;
    };
    /** Post: Dr expense/asset per line (net) + Dr VAT (input tax) / Cr Accounts Payable (total). */
    E.postBill = function (id, o) {
      o = o || {}; need('post'); var b = E.bill(id);
      if (b.status === 'draft') throw err(b.no + ' must be approved before it is posted.');
      if (b.status !== 'approved') throw err(b.no + ' is already ' + b.status + '.');
      validateDoc(b, 'bill'); checkDate(b.issue, 'Bill date');
      var t = E.billTotals(b), sup = E.contact(b.contactId), byAcc = {};
      b.lines.forEach(function (l, i) { byAcc[l.accountId] = (byAcc[l.accountId] || 0) + t.lines[i].net; });
      var lines = Object.keys(byAcc).map(function (a) { return { accountId: a, debit: byAcc[a], credit: 0, memo: b.no + (b.ref ? ' · ' + b.ref : '') }; });
      if (t.tax) lines.push({ accountId: E.def('vat').id, debit: t.tax, credit: 0, memo: 'Input VAT · ' + b.no });
      lines.push({ accountId: E.def('ap').id, debit: 0, credit: t.total, memo: b.no + ' · ' + sup.name, contactId: sup.id });
      var j = postNew({ date: b.issue, desc: 'Bill ' + b.no + ' — ' + sup.name + (b.desc ? ' · ' + b.desc : ''), kind: 'bill', lines: lines, source: { type: 'bill', id: b.id }, contactId: sup.id, ref: b.no });
      b.status = 'posted'; b.journalId = j.id; touch();
      if (!o.silent) audit('bill.post', 'bill', id, 'Posted ' + b.no + ' from ' + sup.name + ' for ' + E.fmt(t.total) + ' — ' + j.ref, { status: 'approved' }, { status: 'posted', journal: j.ref });
      return b;
    };
    E.voidBill = function (id, reason) {
      need('reverse'); var b = E.bill(id); if (b.status === 'void') throw err('Already void.');
      if (b.status !== 'posted') { var bs = b.status; b.status = 'void'; touch(); audit('bill.void', 'bill', id, 'Voided ' + bs + ' ' + b.no, { status: bs }, { status: 'void' }); return b; }
      if (E.billPaid(b) > 0) throw err('Payments are recorded against ' + b.no + '. Reverse them first.');
      if (!reason) throw err('Give a reason for voiding.', 'reason');
      var r = reverseSystem(E.journal(b.journalId), b.issue > today() ? b.issue : today(), 'Void ' + b.no + ' — ' + reason);
      b.status = 'void'; b.voidJournalId = r.id; touch(); audit('bill.void', 'bill', id, 'Voided ' + b.no + ' — ' + reason, { status: 'posted' }, { status: 'void' }); return b;
    };
    /** Supplier payment: Dr Accounts Payable / Cr Bank. The expense was recognised on the bill. */
    E.payBill = function (data, o) {
      o = o || {}; need('post');
      if (data.key && S.opKeys[data.key]) throw err('This payment was already recorded (duplicate submission blocked).');
      var b = E.bill(data.billId); if (!b || b.status !== 'posted') throw err('Only posted bills can be paid.');
      var amt = +data.amount, out = E.billOutstanding(b);
      if (!isInt(amt) || amt <= 0) throw err('Enter the amount paid.', 'amount');
      if (amt > out) throw err('That is more than the ' + E.fmt(out) + ' outstanding on ' + b.no + '.', 'amount');
      var bank = E.account(data.accountId); if (!bank || E.cashAccounts().indexOf(bank) < 0) throw err('Choose the account the payment comes from.', 'accountId');
      checkDate(data.date, 'Payment date'); if (data.date < b.issue) throw err('A payment cannot be dated before the bill (' + b.issue + ').', 'date');
      var sup = E.contact(b.contactId), no = nextNo('payment');
      var j = postNew({ date: data.date, desc: 'Payment ' + no + ' — ' + sup.name + ' for ' + b.no, kind: 'payment', lines: [{ accountId: E.def('ap').id, debit: amt, credit: 0, memo: b.no, contactId: sup.id }, { accountId: bank.id, debit: 0, credit: amt, memo: no + ' · ' + sup.name, contactId: sup.id }], source: { type: 'payment', id: no }, contactId: sup.id, ref: no });
      var p = { id: nid('p'), no: no, billId: b.id, contactId: sup.id, date: data.date, amount: amt, accountId: bank.id, method: data.method || 'Bank transfer', reference: data.reference || '', journalId: j.id, voided: false };
      S.payments.push(p); j.source.id = p.id; if (data.key) S.opKeys[data.key] = p.id; touch();
      if (!o.silent) audit('payment.record', 'payment', p.id, 'Paid ' + E.fmt(amt) + ' to ' + sup.name + ' for ' + b.no + ' (' + no + ')', null, { journal: j.ref });
      return p;
    };

    /* ---------- expenses ---------- */
    E.expenseTotals = function (x) { var gross = +x.amount || 0, rate = E.taxRate(x.taxId).rate, net = rate ? roundHalfUp(gross * 100 / (100 + rate)) : gross; return { gross: gross, net: net, tax: gross - net }; };
    E.saveExpense = function (data, id) {
      need('draft');
      if (!data.date) throw err('Date is required.', 'date');
      if (!String(data.payee || '').trim()) throw err('Who was paid?', 'payee');
      if (!data.accountId || !E.account(data.accountId) || E.account(data.accountId).type !== 'expense' && E.account(data.accountId).type !== 'asset') throw err('Choose a category.', 'accountId');
      var amt = +data.amount; if (!isInt(amt) || amt <= 0) throw err('Enter the amount.', 'amount');
      if (!data.payAccountId || E.cashAccounts().indexOf(E.account(data.payAccountId)) < 0) throw err('Choose the account it was paid from.', 'payAccountId');
      var f = { date: data.date, payee: data.payee.trim(), contactId: data.contactId || null, desc: data.desc || '', accountId: data.accountId, payAccountId: data.payAccountId, method: data.method || 'Card', amount: amt, taxId: data.taxId || 'none', notes: data.notes || '', receipt: data.receipt || null, by: data.by || actor().name };
      if (id) { var x = S.expenses.filter(function (e) { return e.id === id; })[0]; if (['draft', 'submitted', 'rejected'].indexOf(x.status) < 0) throw err('Posted expenses cannot be edited.'); var before = clone(x); Object.assign(x, f, { status: x.status === 'rejected' ? 'draft' : x.status }); touch(); audit('expense.update', 'expense', id, 'Edited ' + x.no, before, clone(x)); return x; }
      var e = Object.assign({ id: nid('x'), no: nextNo('expense'), status: 'draft', journalId: null }, f);
      S.expenses.push(e); touch(); if (!data.sys) audit('expense.create', 'expense', e.id, 'Recorded ' + e.no + ' — ' + e.payee + ' ' + E.fmt(amt), null, clone(e)); return e;
    };
    E.submitExpense = function (id) { var x = S.expenses.filter(function (e) { return e.id === id; })[0]; if (x.status !== 'draft') throw err('Only drafts can be submitted.'); x.status = 'submitted'; touch(); audit('expense.submit', 'expense', id, 'Submitted ' + x.no + ' for approval', { status: 'draft' }, { status: 'submitted' }); return x; };
    E.rejectExpense = function (id, reason) { need('approve'); var x = S.expenses.filter(function (e) { return e.id === id; })[0]; if (x.status !== 'submitted') throw err('Only submitted expenses can be rejected.'); if (!reason) throw err('Give a reason.', 'reason'); x.status = 'rejected'; x.rejectReason = reason; touch(); audit('expense.reject', 'expense', id, 'Rejected ' + x.no + ' — ' + reason, { status: 'submitted' }, { status: 'rejected' }); return x; };
    /** Approve + post a paid expense: Dr category (net) + Dr VAT / Cr bank or cash (gross). */
    E.approveExpense = function (id, o) {
      o = o || {}; need('approve'); var x = S.expenses.filter(function (e) { return e.id === id; })[0];
      if (x.status !== 'submitted' && x.status !== 'draft') throw err(x.no + ' is already ' + x.status + '.');
      checkDate(x.date, 'Expense date');
      var t = E.expenseTotals(x), lines = [{ accountId: x.accountId, debit: t.net, credit: 0, memo: x.payee + (x.desc ? ' · ' + x.desc : ''), contactId: x.contactId }];
      if (t.tax) lines.push({ accountId: E.def('vat').id, debit: t.tax, credit: 0, memo: 'Input VAT · ' + x.no });
      lines.push({ accountId: x.payAccountId, debit: 0, credit: t.gross, memo: x.no + ' · ' + x.payee, contactId: x.contactId });
      var j = postNew({ date: x.date, desc: 'Expense ' + x.no + ' — ' + x.payee + (x.desc ? ' · ' + x.desc : ''), kind: 'expense', lines: lines, source: { type: 'expense', id: x.id }, contactId: x.contactId, ref: x.no });
      x.status = 'posted'; x.journalId = j.id; x.approvedBy = actor().name; touch();
      if (!o.silent) audit('expense.approve', 'expense', id, 'Approved and posted ' + x.no + ' — ' + E.fmt(t.gross) + ' (' + j.ref + ')', { status: 'submitted' }, { status: 'posted', journal: j.ref });
      return x;
    };

    /* ---------- transfers ---------- */
    /** Moves money between two of our own accounts: Dr destination / Cr source. Not income or expense. */
    E.transfer = function (data, o) {
      o = o || {}; need('post');
      if (data.key && S.opKeys[data.key]) throw err('This transfer was already recorded (duplicate submission blocked).');
      var from = E.account(data.fromId), to = E.account(data.toId), cash = E.cashAccounts();
      if (!from || cash.indexOf(from) < 0) throw err('Choose the account to move money from.', 'fromId');
      if (!to || cash.indexOf(to) < 0) throw err('Choose the account to move money to.', 'toId');
      if (from === to) throw err('Choose two different accounts.', 'toId');
      var amt = +data.amount; if (!isInt(amt) || amt <= 0) throw err('Enter the amount.', 'amount');
      checkDate(data.date, 'Transfer date');
      var no = nextNo('transfer');
      var j = postNew({ date: data.date, desc: 'Transfer ' + no + ' — ' + from.name + ' → ' + to.name + (data.memo ? ' · ' + data.memo : ''), kind: 'transfer', lines: [{ accountId: to.id, debit: amt, credit: 0, memo: 'From ' + from.name }, { accountId: from.id, debit: 0, credit: amt, memo: 'To ' + to.name }], source: { type: 'transfer', id: no }, ref: no });
      var t = { id: nid('t'), no: no, date: data.date, fromId: from.id, toId: to.id, amount: amt, memo: data.memo || '', journalId: j.id };
      S.transfers.push(t); j.source.id = t.id; if (data.key) S.opKeys[data.key] = t.id; touch();
      if (!o.silent) audit('transfer.record', 'transfer', t.id, 'Transferred ' + E.fmt(amt) + ' from ' + from.name + ' to ' + to.name + ' (' + j.ref + ')', null, { journal: j.ref });
      return t;
    };

    /* ---------- contacts ---------- */
    E.customerBalance = function (cid, asOf) {
      var ar = E.def('ar').id, t = 0; index().lines.forEach(function (l) { if (l.accountId === ar && l.contactId === cid && (!asOf || l.date <= asOf)) t += l.debit - l.credit; }); return t;
    };
    E.supplierBalance = function (cid, asOf) {
      var ap = E.def('ap').id, t = 0; index().lines.forEach(function (l) { if (l.accountId === ap && l.contactId === cid && (!asOf || l.date <= asOf)) t += l.credit - l.debit; }); return t;
    };
    E.saveContact = function (data, id) {
      need('draft'); var name = String(data.name || '').trim();
      if (!name) throw err('Name is required.', 'name');
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) throw err('That email address does not look right.', 'email');
      var dup = S.contacts.filter(function (c) { return c.kind === data.kind && c.id !== id && c.name.toLowerCase() === name.toLowerCase(); })[0];
      if (dup) throw err('A ' + data.kind + ' called ' + dup.name + ' already exists.', 'name');
      var f = { name: name, kind: data.kind, email: data.email || '', phone: data.phone || '', address: data.address || '', pin: data.pin || '', terms: +data.terms || 30, notes: data.notes || '', contact: data.contact || '' };
      if (id) { var c = E.contact(id), before = clone(c); Object.assign(c, f); touch(); audit('contact.update', data.kind, id, 'Updated ' + name, before, clone(c)); return c; }
      var series = data.kind === 'customer' ? 'customer' : 'supplier';
      var x = Object.assign({ id: nid('c'), ref: nextNo(series), status: 'active', since: today() }, f);
      S.contacts.push(x); touch(); if (!data.sys) audit('contact.create', data.kind, x.id, 'Added ' + data.kind + ' ' + name, null, clone(x)); return x;
    };

    /* ---------- bank statements & reconciliation ---------- */
    /** Book transactions on a bank/cash account (posted lines), newest first. */
    E.bankLines = function (accountId, from, to) {
      return index().lines.filter(function (l) { return l.accountId === accountId && (!from || l.date >= from) && (!to || l.date <= to); }).map(function (l) { return { key: l.key, date: l.date, amount: l.debit - l.credit, desc: l.j.desc, ref: l.j.ref, journalId: l.j.id, kind: l.j.kind, rec: (S.recLines[l.key] || null) }; });
    };
    /** Parse a CSV statement. Supports "Date,Description,Amount" or "Date,Description,Debit,Credit". */
    E.parseStatementCSV = function (text) {
      var rows = String(text || '').replace(/\r/g, '').split('\n').filter(function (r) { return r.trim(); });
      if (rows.length < 2) throw err('The file has no transactions. Expected a header row and at least one line.');
      function split(r) { var out = [], cur = '', q = false; for (var i = 0; i < r.length; i++) { var ch = r[i]; if (ch === '"') { if (q && r[i + 1] === '"') { cur += '"'; i++; } else q = !q; } else if (ch === ',' && !q) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out.map(function (s) { return s.trim(); }); }
      var h = split(rows[0]).map(function (s) { return s.toLowerCase(); });
      var iD = h.indexOf('date'), iDesc = h.findIndex(function (x) { return /desc|narrative|details|particulars/.test(x); }), iA = h.indexOf('amount'), iDr = h.findIndex(function (x) { return /^(debit|withdrawal|money out|paid out)/.test(x); }), iCr = h.findIndex(function (x) { return /^(credit|deposit|money in|paid in)/.test(x); });
      if (iD < 0 || iDesc < 0 || (iA < 0 && (iDr < 0 || iCr < 0))) throw err('Unrecognised columns. Use Date, Description and Amount — or Date, Description, Debit, Credit.');
      var out = [], problems = [];
      rows.slice(1).forEach(function (r, n) {
        var c = split(r), line = n + 2, d = c[iD] || '', date = null;
        if (/^\d{4}-\d{2}-\d{2}$/.test(d)) date = d; else { var m = d.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/); if (m) date = m[3] + '-' + pad(m[2], 2) + '-' + pad(m[1], 2); }
        if (!date || isNaN(new Date(date + 'T00:00:00')) || iso(new Date(date + 'T00:00:00')) !== date) { problems.push('Row ' + line + ': date "' + d + '" is not a valid date (use YYYY-MM-DD or DD/MM/YYYY).'); return; }
        function money(s) { s = String(s || '').replace(/[,\sA-Za-z]/g, ''); if (s === '') return 0; if (!/^-?\d+(\.\d{1,2})?$/.test(s)) return NaN; return Math.round(parseFloat(s) * 100); }
        var amt = iA >= 0 ? money(c[iA]) : money(c[iCr]) - money(c[iDr]);
        if (isNaN(amt)) { problems.push('Row ' + line + ': the amount is not a number.'); return; }
        if (!amt) { problems.push('Row ' + line + ': the amount is zero.'); return; }
        if (!(c[iDesc] || '').trim()) { problems.push('Row ' + line + ': description is missing.'); return; }
        out.push({ date: date, desc: c[iDesc], amount: amt });
      });
      if (problems.length) { var e = err(problems.length + ' row' + (problems.length > 1 ? 's' : '') + ' could not be read. Nothing was imported.'); e.problems = problems; throw e; }
      return out;
    };
    E.startReconciliation = function (data) {
      need('reconcile');
      var acc = E.account(data.accountId); if (!acc || E.cashAccounts().indexOf(acc) < 0) throw err('Choose a bank or cash account.');
      if (S.recs.some(function (r) { return r.accountId === acc.id && r.status === 'in_progress'; })) throw err('A reconciliation is already in progress for ' + acc.name + '.');
      if (!data.end) throw err('Choose the statement end date.', 'end');
      var last = E.lastReconciliation(acc.id);
      if (last && data.end <= last.end) throw err('The last completed reconciliation already covers up to ' + last.end + '.', 'end');
      if (!isInt(+data.opening) || !isInt(+data.closing)) throw err('Enter the statement opening and closing balances.');
      var r = { id: nid('rec'), accountId: acc.id, start: data.start || (last ? addDays(last.end, 1) : null), end: data.end, opening: +data.opening, closing: +data.closing, lines: (data.lines || []).map(function (l) { return { id: nid('sl'), date: l.date, desc: l.desc, amount: l.amount, match: null }; }), status: 'in_progress', createdAt: today() };
      S.recs.push(r); touch(); audit('reconciliation.start', 'reconciliation', r.id, 'Started reconciliation of ' + acc.name + ' to ' + r.end, null, { opening: r.opening, closing: r.closing, lines: r.lines.length }); return r;
    };
    E.lastReconciliation = function (accountId) { return S.recs.filter(function (r) { return r.accountId === accountId && r.status === 'completed'; }).sort(function (a, b) { return a.end < b.end ? 1 : -1; })[0] || null; };
    E.addStatementLines = function (recId, lines) { var r = rec(recId); lines.forEach(function (l) { r.lines.push({ id: nid('sl'), date: l.date, desc: l.desc, amount: l.amount, match: null }); }); touch(); audit('reconciliation.import', 'reconciliation', r.id, 'Imported ' + lines.length + ' statement lines', null, null); return r; };
    function rec(id) { var r = S.recs.filter(function (x) { return x.id === id; })[0]; if (!r) throw err('Unknown reconciliation.'); return r; }
    E.rec = rec;
    /** Book lines that could match: on this account, not reconciled elsewhere, dated on/before statement end. */
    E.unreconciledBook = function (recId) {
      var r = rec(recId), used = {}; r.lines.forEach(function (l) { if (l.match) used[l.match] = 1; });
      return E.bankLines(r.accountId, null, r.end).filter(function (b) { return !b.rec && !used[b.key]; });
    };
    /** Suggest matches: same amount, date within 5 days; ranked by date distance. Each suggestion states its basis. */
    E.suggest = function (recId) {
      var r = rec(recId), book = E.unreconciledBook(recId), taken = {}, out = {};
      r.lines.filter(function (l) { return !l.match; }).forEach(function (s) {
        var c = book.filter(function (b) { return !taken[b.key] && b.amount === s.amount && Math.abs(daysBetween(b.date, s.date)) <= 5; }).sort(function (a, b) { return Math.abs(daysBetween(a.date, s.date)) - Math.abs(daysBetween(b.date, s.date)); });
        if (c.length) { var dd = Math.abs(daysBetween(c[0].date, s.date)); taken[c[0].key] = 1; out[s.id] = { key: c[0].key, basis: 'Same amount (' + E.fmt(Math.abs(s.amount)) + ')' + (dd ? ', ' + dd + ' day' + (dd > 1 ? 's' : '') + ' apart' : ', same date') + (c.length > 1 ? ' · ' + (c.length - 1) + ' other candidate' + (c.length > 2 ? 's' : '') : '') }; }
      });
      return out;
    };
    E.match = function (recId, lineId, key) {
      need('reconcile'); var r = rec(recId); if (r.status !== 'in_progress') throw err('This reconciliation is complete.');
      var s = r.lines.filter(function (l) { return l.id === lineId; })[0]; if (!s) throw err('Unknown statement line.');
      if (key) {
        var b = E.bankLines(r.accountId).filter(function (x) { return x.key === key; })[0];
        if (!b) throw err('That transaction is not on this account.'); if (b.rec) throw err('That transaction is already reconciled.');
        if (r.lines.some(function (l) { return l.match === key && l.id !== lineId; })) throw err('That transaction is already matched to another statement line.');
        if (b.amount !== s.amount) throw err('Amounts differ: statement ' + E.fmt(s.amount) + ', ledger ' + E.fmt(b.amount) + '. Match only identical amounts — record the difference as a separate transaction.');
      }
      s.match = key || null; touch(); return s;
    };
    /** Record a statement-only item (e.g. bank charges) as a posted bank transaction, then match it. */
    E.createFromStatement = function (recId, lineId, accountId, desc) {
      need('post'); var r = rec(recId), s = r.lines.filter(function (l) { return l.id === lineId; })[0];
      var other = E.account(accountId); if (!other) throw err('Choose the account for this transaction.', 'accountId');
      var bank = E.account(r.accountId), amt = Math.abs(s.amount), inflow = s.amount > 0;
      var j = postNew({ date: s.date, desc: (desc || s.desc) + ' (from bank statement)', kind: 'bank', lines: inflow ? [{ accountId: bank.id, debit: amt, credit: 0, memo: s.desc }, { accountId: other.id, debit: 0, credit: amt, memo: s.desc }] : [{ accountId: other.id, debit: amt, credit: 0, memo: s.desc }, { accountId: bank.id, debit: 0, credit: amt, memo: s.desc }], source: { type: 'statement', id: s.id } });
      audit('bank.create', 'journal', j.id, 'Recorded ' + j.ref + ' from the ' + bank.name + ' statement — ' + s.desc + ' ' + E.fmt(s.amount), null, { journal: j.ref });
      s.match = j.id + ':0'; if (!inflow) s.match = j.id + ':1'; touch(); return j;
    };
    E.recSummary = function (recId) {
      var r = rec(recId), matched = r.lines.filter(function (l) { return l.match; }), cleared = sum(matched, function (l) { return l.amount; });
      var stmtTotal = sum(r.lines, function (l) { return l.amount; });
      var book = E.balance(r.accountId, r.end);
      var outstanding = E.unreconciledBook(recId);
      return {
        opening: r.opening, closing: r.closing, cleared: cleared, statementMovement: stmtTotal,
        // statement opening + movement must equal the statement's own closing figure
        statementCheck: r.opening + stmtTotal - r.closing,
        difference: r.closing - (r.opening + cleared),
        unmatched: r.lines.filter(function (l) { return !l.match; }).length,
        matched: matched.length, total: r.lines.length,
        bookBalance: book, outstanding: outstanding,
        outstandingTotal: sum(outstanding, function (b) { return b.amount; })
      };
    };
    E.completeReconciliation = function (recId) {
      need('reconcile'); var r = rec(recId), s = E.recSummary(recId);
      if (s.statementCheck !== 0) throw err('The statement lines do not add up: opening ' + E.fmt(r.opening) + ' plus lines ' + E.fmt(s.statementMovement) + ' is not the closing ' + E.fmt(r.closing) + '. Check the balances or the import.');
      if (s.unmatched) throw err(s.unmatched + ' statement line' + (s.unmatched > 1 ? 's are' : ' is') + ' not matched. Match ' + (s.unmatched > 1 ? 'them' : 'it') + ' or record ' + (s.unmatched > 1 ? 'them' : 'it') + ' as transactions.');
      if (s.difference !== 0) throw err('There is an unexplained difference of ' + E.fmt(s.difference) + '. The reconciliation cannot be completed.');
      r.lines.forEach(function (l) { S.recLines[l.match] = r.id; });
      r.status = 'completed'; r.completedAt = today(); r.completedBy = actor().name; touch();
      audit('reconciliation.complete', 'reconciliation', r.id, 'Reconciled ' + E.account(r.accountId).name + ' to ' + r.end + ' — ' + r.lines.length + ' lines, difference ' + E.fmt(0), { status: 'in_progress' }, { status: 'completed' });
      return r;
    };
    E.cancelReconciliation = function (recId) { need('reconcile'); var r = rec(recId); if (r.status !== 'in_progress') throw err('Only an in-progress reconciliation can be discarded.'); S.recs.splice(S.recs.indexOf(r), 1); touch(); audit('reconciliation.discard', 'reconciliation', recId, 'Discarded reconciliation of ' + E.account(r.accountId).name + ' to ' + r.end, null, null); };
    E.reconciledShare = function (accountId) { var all = E.bankLines(accountId); if (!all.length) return 1; return all.filter(function (b) { return b.rec; }).length / all.length; };

    /* ---------- reports ---------- */
    E.profitAndLoss = function (from, to) {
      function group(type, sub) { return S.accounts.filter(function (a) { return a.type === type && (sub == null || (sub === 'cogs' ? a.sub === 'cogs' : a.sub !== 'cogs')); }).map(function (a) { return { account: a, amount: E.balance(a.id, to, from) }; }).filter(function (r) { return r.amount !== 0; }).sort(function (a, b) { return a.account.code < b.account.code ? -1 : 1; }); }
      var income = group('income'), cogs = group('expense', 'cogs'), opex = group('expense', 'opex');
      var ti = sum(income, function (r) { return r.amount; }), tc = sum(cogs, function (r) { return r.amount; }), to_ = sum(opex, function (r) { return r.amount; });
      return { from: from, to: to, income: income, cogs: cogs, opex: opex, totalIncome: ti, totalCogs: tc, grossProfit: ti - tc, totalOpex: to_, totalExpenses: tc + to_, net: ti - tc - to_ };
    };
    E.netIncome = function (from, to) { return E.typeTotal('income', to, from) - E.typeTotal('expense', to, from); };
    E.balanceSheet = function (asOf) {
      var fy = E.fyOf(asOf), prior = addDays(fy.start, -1);
      function rows(type) { return S.accounts.filter(function (a) { return a.type === type; }).map(function (a) { return { account: a, amount: E.balance(a.id, asOf) }; }).filter(function (r) { return r.amount !== 0; }).sort(function (a, b) { return a.account.code < b.account.code ? -1 : 1; }); }
      var assets = rows('asset'), liabilities = rows('liability'), equity = rows('equity');
      // Income and expense accounts are not closed with entries: earnings before this financial
      // year roll into retained earnings, this year's are shown as current year earnings.
      var earlier = E.netIncome(null, prior), current = E.netIncome(fy.start, asOf);
      if (earlier) equity.push({ account: { id: '_re', code: '', name: 'Retained earnings — prior years (unclosed)', type: 'equity' }, amount: earlier, computed: true });
      equity.push({ account: { id: '_cye', code: '', name: 'Current year earnings (' + fy.label + ')', type: 'equity' }, amount: current, computed: true });
      var ta = sum(assets, function (r) { return r.amount; }), tl = sum(liabilities, function (r) { return r.amount; }), te = sum(equity, function (r) { return r.amount; });
      return { asOf: asOf, assets: assets, liabilities: liabilities, equity: equity, totalAssets: ta, totalLiabilities: tl, totalEquity: te, check: ta - (tl + te) };
    };
    E.trialBalance = function (asOf, from) {
      var rows = S.accounts.map(function (a) {
        var d = 0, c = 0; index().lines.forEach(function (l) { if (l.accountId === a.id && (!asOf || l.date <= asOf) && (!from || l.date >= from)) { d += l.debit; c += l.credit; } });
        var net = d - c; return { account: a, debit: net > 0 ? net : 0, credit: net < 0 ? -net : 0, movementDr: d, movementCr: c };
      }).filter(function (r) { return r.debit || r.credit; }).sort(function (a, b) { return a.account.code < b.account.code ? -1 : 1; });
      var td = sum(rows, function (r) { return r.debit; }), tc = sum(rows, function (r) { return r.credit; });
      return { rows: rows, debit: td, credit: tc, diff: td - tc };
    };
    /**
     * Direct-method cash flow. For every posted journal that touches a cash/bank account,
     * the net cash change is split across the journal's non-cash lines in proportion
     * to their amounts and classified by those accounts. Transfers between cash
     * accounts net to zero and are excluded.
     */
    E.cashFlow = function (from, to) {
      var cashIds = {}; E.cashAccounts().forEach(function (a) { cashIds[a.id] = 1; });
      var cats = {}, js = {};
      index().lines.forEach(function (l) { if (l.date < from || l.date > to) return; (js[l.j.id] = js[l.j.id] || []).push(l); });
      function bucket(a, j) {
        if (!a) return ['operating', 'Other operating'];
        if (j.kind === 'receipt' || a.sub === 'ar' || a.sub === 'custcredit') return ['operating', 'Receipts from customers'];
        if (j.kind === 'payment' || a.sub === 'ap') return ['operating', 'Payments to suppliers'];
        if (a.sub === 'payroll' || /salar|wage/i.test(a.name) || a.sub === 'statutory') return ['operating', 'Salaries and statutory deductions'];
        if (a.sub === 'tax') return ['operating', 'VAT paid to KRA'];
        if (a.type === 'income') return ['operating', 'Other income received'];
        if (a.type === 'expense') return ['operating', 'Operating expenses paid'];
        if (a.sub === 'fixed') return ['investing', 'Equipment and fixed assets'];
        if (a.sub === 'loan') return ['financing', 'Loan drawdowns and repayments'];
        if (a.type === 'equity') return ['financing', 'Owner capital and drawings'];
        return ['operating', 'Other working capital'];
      }
      var opening = sum(E.cashAccounts(), function (a) { return E.balance(a.id, addDays(from, -1)); });
      Object.keys(js).forEach(function (id) {
        var L = js[id], j = L[0].j, cashNet = 0, others = [];
        L.forEach(function (l) { if (cashIds[l.accountId]) cashNet += l.debit - l.credit; else others.push(l); });
        if (!cashNet) return;
        var base = sum(others, function (l) { return l.debit + l.credit; }), left = cashNet;
        others.forEach(function (l, i) {
          var share = i === others.length - 1 ? left : roundHalfUp(cashNet * (l.debit + l.credit) / base); left -= share;
          var b = bucket(E.account(l.accountId), j); cats[b[0]] = cats[b[0]] || {}; cats[b[0]][b[1]] = (cats[b[0]][b[1]] || 0) + share;
        });
      });
      function sec(k) { var o = cats[k] || {}; var rows = Object.keys(o).map(function (n) { return { name: n, amount: o[n] }; }).filter(function (r) { return r.amount; }).sort(function (a, b) { return Math.abs(b.amount) - Math.abs(a.amount); }); return { rows: rows, total: sum(rows, function (r) { return r.amount; }) }; }
      var op = sec('operating'), inv = sec('investing'), fin = sec('financing'), net = op.total + inv.total + fin.total;
      var closing = sum(E.cashAccounts(), function (a) { return E.balance(a.id, to); });
      return { from: from, to: to, operating: op, investing: inv, financing: fin, net: net, opening: opening, closing: closing, check: opening + net - closing };
    };
    E.generalLedger = function (accountId, from, to) {
      var a = E.account(accountId), sign = NORMAL[a.type] === 'debit' ? 1 : -1;
      var open = from ? E.balance(accountId, addDays(from, -1)) : 0, run = open;
      var rows = index().lines.filter(function (l) { return l.accountId === accountId && (!from || l.date >= from) && (!to || l.date <= to); }).map(function (l) { run += sign * (l.debit - l.credit); return { line: l, balance: run }; });
      return { account: a, opening: open, rows: rows, closing: run };
    };
    E.ageing = function (kind, asOf, buckets) {
      buckets = buckets || [30, 60, 90];
      var labels = ['Current'].concat(buckets.map(function (b, i) { return (i ? buckets[i - 1] + 1 : 1) + '–' + b + ' days'; })).concat([buckets[buckets.length - 1] + '+ days']);
      var docs = kind === 'ar' ? S.invoices.filter(function (i) { return i.status === 'issued' && i.issue <= asOf; }) : S.bills.filter(function (b) { return b.status === 'posted' && b.issue <= asOf; });
      var by = {};
      docs.forEach(function (d) {
        var total = kind === 'ar' ? E.invoiceTotals(d).total : E.billTotals(d).total;
        var paid = kind === 'ar' ? sum(S.receipts.filter(function (r) { return r.invoiceId === d.id && !r.voided && r.date <= asOf; }), function (r) { return r.applied; }) : sum(S.payments.filter(function (p) { return p.billId === d.id && !p.voided && p.date <= asOf; }), function (p) { return p.amount; });
        var out = total - paid; if (out <= 0) return;
        var late = daysBetween(d.due, asOf), bi = 0; if (late > 0) { bi = buckets.length + 1; for (var k = 0; k < buckets.length; k++) if (late <= buckets[k]) { bi = k + 1; break; } }
        var row = by[d.contactId] = by[d.contactId] || { contact: E.contact(d.contactId), amounts: labels.map(function () { return 0; }), total: 0, docs: [] };
        row.amounts[bi] += out; row.total += out; row.docs.push({ doc: d, outstanding: out, late: late, bucket: bi });
      });
      var rows = Object.keys(by).map(function (k) { return by[k]; }).sort(function (a, b) { return b.total - a.total; });
      var totals = labels.map(function (l, i) { return sum(rows, function (r) { return r.amounts[i]; }); });
      return { kind: kind, asOf: asOf, labels: labels, rows: rows, totals: totals, total: sum(totals) };
    };
    E.expenseAnalysis = function (from, to) {
      var months = [], d = from.slice(0, 7); while (d <= to.slice(0, 7)) { months.push(d); var y = +d.slice(0, 4), m = +d.slice(5, 7) + 1; if (m > 12) { m = 1; y++; } d = y + '-' + pad(m, 2); }
      var rows = E.accountsByType('expense').map(function (a) {
        var vals = months.map(function (mk) { var s = mk + '-01', e = addDays(iso(new Date(+mk.slice(0, 4), +mk.slice(5, 7), 1)), -1); return E.balance(a.id, e < to ? e : to, s > from ? s : from); });
        return { account: a, values: vals, total: sum(vals) };
      }).filter(function (r) { return r.total; }).sort(function (a, b) { return b.total - a.total; });
      return { months: months, rows: rows, totals: months.map(function (m, i) { return sum(rows, function (r) { return r.values[i]; }); }), total: sum(rows, function (r) { return r.total; }) };
    };
    /** Sanity checks used by the dashboard and the test-suite. */
    E.integrity = function (asOf) {
      var probs = [];
      S.journals.filter(function (j) { return j.status === 'posted'; }).forEach(function (j) { var t = E.totals(j.lines); if (t.debit !== t.credit) probs.push(j.ref + ' is unbalanced'); });
      var tb = E.trialBalance(asOf); if (tb.diff) probs.push('Trial balance differs by ' + E.fmt(tb.diff));
      var bs = E.balanceSheet(asOf || today()); if (bs.check) probs.push('Balance sheet differs by ' + E.fmt(bs.check));
      var arSub = sum(S.contacts.filter(function (c) { return c.kind === 'customer'; }), function (c) { return E.customerBalance(c.id, asOf); });
      if (arSub !== E.balance(E.def('ar').id, asOf)) probs.push('Customer balances do not agree with Accounts Receivable');
      var apSub = sum(S.contacts.filter(function (c) { return c.kind === 'supplier'; }), function (c) { return E.supplierBalance(c.id, asOf); });
      if (apSub !== E.balance(E.def('ap').id, asOf)) probs.push('Supplier balances do not agree with Accounts Payable');
      var invOut = sum(S.invoices, function (i) { return E.invoiceOutstanding(i); });
      if (!asOf && invOut !== E.balance(E.def('ar').id)) probs.push('Invoice balances do not agree with Accounts Receivable');
      var billOut = sum(S.bills, function (b) { return E.billOutstanding(b); });
      if (!asOf && billOut !== E.balance(E.def('ap').id)) probs.push('Bill balances do not agree with Accounts Payable');
      return probs;
    };

    /* ---------- formatting (engine-level, for messages) ---------- */
    E.fmt = function (c) { var neg = c < 0; c = Math.abs(c); var s = (Math.floor(c / 100)).toLocaleString('en-US') + '.' + pad(c % 100, 2); return (neg ? '−' : '') + (S.settings.currency || 'KES') + ' ' + s; };

    return E;
  }

  var api = { Engine: Engine, iso: iso, addDays: addDays, daysBetween: daysBetween, lineNet: lineNet, taxOf: taxOf, roundHalfUp: roundHalfUp, pad: pad, clone: clone, sum: sum, monthKey: monthKey, NORMAL: NORMAL };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.CL = root.CL || {}; Object.assign(root.CL, api); }
})(typeof window !== 'undefined' ? window : this);
