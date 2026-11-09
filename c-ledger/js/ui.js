/* ============================================================
   C-Ledger — UI kit: formatting, icons, components, charts
   ============================================================ */
(function () {
  'use strict';
  var CL = window.CL = window.CL || {};
  var esc = CL.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  /* ---------------- formatting ---------------- */
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var f = CL.fmt = {
    MON: MON, MONTH: MONTH,
    cur: function () { return (CL.store && CL.store.S.settings.currency) || 'KES'; },
    /** 1234567 (cents) → "12,345.67" ; neg → "(12,345.67)" in accounting style when acct=true */
    num: function (c, acct) {
      if (c == null || isNaN(c)) return '—';
      var neg = c < 0; c = Math.abs(Math.round(c));
      var s = Math.floor(c / 100).toLocaleString('en-US') + '.' + (c % 100 < 10 ? '0' : '') + (c % 100);
      return neg ? (acct ? '(' + s + ')' : '−' + s) : s;
    },
    money: function (c, acct) { return f.cur() + ' ' + f.num(c, acct); },
    /** compact: KES 3.93M / KES 845K */
    short: function (c, noCur) {
      var v = c / 100, a = Math.abs(v), s;
      if (a >= 1e9) s = (v / 1e9).toFixed(2) + 'B'; else if (a >= 1e6) s = (v / 1e6).toFixed(a >= 1e8 ? 0 : 2) + 'M'; else if (a >= 1e4) s = Math.round(v / 1e3) + 'K'; else s = Math.round(v).toLocaleString('en-US');
      s = s.replace('-', '−'); return noCur ? s : f.cur() + ' ' + s;
    },
    date: function (s) { if (!s) return '—'; var d = new Date(String(s).slice(0, 10) + 'T00:00:00'); return d.getDate() + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear(); },
    dshort: function (s) { var d = new Date(String(s).slice(0, 10) + 'T00:00:00'); return d.getDate() + ' ' + MON[d.getMonth()]; },
    month: function (k) { return MON[+k.slice(5, 7) - 1] + ' ' + k.slice(2, 4); },
    monthLong: function (k) { return MONTH[+k.slice(5, 7) - 1] + ' ' + k.slice(0, 4); },
    time: function (iso) { var d = new Date(iso); return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); },
    ago: function (iso) {
      var d = new Date(iso), s = (Date.now() - d) / 1000;
      if (s < 60) return 'just now'; if (s < 3600) return Math.floor(s / 60) + ' min ago'; if (s < 86400) return Math.floor(s / 3600) + ' h ago';
      if (s < 86400 * 7) return Math.floor(s / 86400) + ' d ago'; return f.date(iso);
    },
    pct: function (x, d) { return (x * 100).toFixed(d == null ? 0 : d) + '%'; },
    /** "1,234.5" → 123450 cents ; returns NaN when invalid; refuses more than 2 decimals */
    parse: function (s) { s = String(s == null ? '' : s).replace(/[,\s]/g, '').replace(/^KES/i, ''); if (s === '') return 0; if (!/^-?\d*(\.\d{0,2})?$/.test(s) || s === '-' || s === '.') return NaN; return Math.round(parseFloat(s) * 100); },
    input: function (c) { if (!c) return ''; return (c / 100).toFixed(2); },
    plural: function (n, w, p) { return n + ' ' + (n === 1 ? w : (p || w + 's')); }
  };

  /* ---------------- icons (1.75px line set) ---------------- */
  var P = {
    overview: '<rect x="3" y="3" width="7" height="8" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="15" width="7" height="6" rx="2"/>',
    ledger: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M8 7h8M8 11h6"/>',
    journal: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6M9 9h1"/>',
    coa: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
    bank: '<path d="M3 21h18M5 21V10M19 21V10M9 21V10M15 21V10"/><path d="m12 3 9 5H3z"/>',
    invoice: '<path d="M6 2h9l5 5v15l-2.5-1.5L15 22l-2.5-1.5L10 22l-2.5-1.5L5 22V3a1 1 0 0 1 1-1z"/><path d="M9 9h6M9 13h6M9 17h3"/>',
    bill: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/><path d="M15.5 16h.5"/>',
    expense: '<path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h14a1 1 0 0 1 1 1v3h-3a2 2 0 0 0 0 4h3v3a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V5"/><path d="M17 13h.01"/>',
    customers: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    suppliers: '<path d="M10 17h4V5H2v12h3"/><path d="M14 9h4l4 4v4h-2"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
    reports: '<path d="M3 3v18h18"/><path d="M7 15v2M11 11v6M15 7v10M19 12v5"/>',
    recon: '<path d="M20 6 9 17l-5-5"/><path d="M14 4h6v6"/>',
    team: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    settings: '<path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
    down: '<path d="m6 9 6 6 6-6"/>', up: '<path d="m18 15-6-6-6 6"/>', right: '<path d="m9 18 6-6-6-6"/>', left: '<path d="m15 18-6-6 6-6"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>', check: '<path d="M20 6 9 17l-5-5"/>',
    out: '<path d="M7 17 17 7M8 7h9v9"/>', arrowUp: '<path d="M12 19V5M5 12l7-7 7 7"/>', arrowDown: '<path d="M12 5v14M19 12l-7 7-7-7"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>', upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    filter: '<path d="M22 3H2l8 9.46V19l4 2v-8.54z"/>', more: '<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>', trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>', unlock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.9-1"/>',
    reverse: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/>', alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>', calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', print: '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>', phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>', link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>', panel: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/>',
    building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>',
    transfer: '<path d="M17 3l4 4-4 4"/><path d="M21 7H9"/><path d="M7 21l-4-4 4-4"/><path d="M3 17h12"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>', palette: '<circle cx="13.5" cy="6.5" r="1"/><circle cx="17.5" cy="10.5" r="1"/><circle cx="8.5" cy="7.5" r="1"/><circle cx="6.5" cy="12.5" r="1"/><path d="M12 2a10 10 0 0 0 0 20c.9 0 1.6-.7 1.6-1.6 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.9.7-1.6 1.6-1.6H16a6 6 0 0 0 6-6c0-4.9-4.5-8.6-10-8.6z"/>',
    percent: '<path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>', hash: '<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>',
    trendUp: '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>', trendDown: '<path d="m22 17-8.5-8.5-5 5L2 7"/><path d="M16 17h6v-6"/>',
    archive: '<rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4"/>', clip: '<path d="m21.4 11-8.5 8.5a6 6 0 0 1-8.5-8.5l8.5-8.5a4 4 0 0 1 5.7 5.7l-8.6 8.5a2 2 0 0 1-2.8-2.8l7.9-7.9"/>',
    cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>', card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
    phoneMoney: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>', refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
    doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>', copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z"/><path d="M2 21c0-3 1.9-5.4 5.1-6"/>',
    logo: '<path d="M4 20V6a2 2 0 0 1 2-2h4"/><path d="M14 4h4a2 2 0 0 1 2 2v14"/><path d="M4 20h16"/><path d="M9 15l3-3 3 3"/><path d="M12 12v8"/>',
    sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>', key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>', userPlus: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',
    sort: '<path d="m7 15 5 5 5-5M7 9l5-5 5 5"/>', ext: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"/>'
  };
  var icon = CL.icon = function (n, s, cls) { return '<svg class="ic' + (cls ? ' ' + cls : '') + '" width="' + (s || 18) + '" height="' + (s || 18) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[n] || P.info) + '</svg>'; };

  /* ---------------- small components ---------------- */
  CL.av = function (u, s) { u = u || {}; var ini = u.initials || String(u.name || '?').split(/\s+/).map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase(); return '<span class="av av--' + (u.tone || 'g') + '" style="--s:' + (s || 30) + 'px" title="' + esc(u.name || '') + '">' + esc(ini) + '</span>'; };
  CL.cav = function (c, s) { if (!c) return ''; var tones = ['g', 'b', 'p', 'a', 'r', 'n'], h = 0; for (var i = 0; i < c.name.length; i++) h = (h * 31 + c.name.charCodeAt(i)) >>> 0; return CL.av({ name: c.name, tone: tones[h % tones.length] }, s); };
  var PILL = {
    draft: ['Draft', 'n'], issued: ['Issued', 'b'], partial: ['Partially paid', 'a'], paid: ['Paid', 'g'], overdue: ['Overdue', 'r'], void: ['Void', 'n'],
    approved: ['Approved', 'b'], posted: ['Posted', 'g'], submitted: ['Awaiting approval', 'a'], rejected: ['Rejected', 'r'], reversed: ['Reversed', 'n'],
    open: ['Open', 'g'], closed: ['Closed', 'n'], active: ['Active', 'g'], archived: ['Archived', 'n'], invited: ['Invited', 'a'], in_progress: ['In progress', 'a'], completed: ['Reconciled', 'g']
  };
  CL.pill = function (text, tone, ic) { return '<span class="pill pill--' + (tone || 'n') + '">' + (ic ? icon(ic, 12) : '') + esc(text) + '</span>'; };
  CL.status = function (k) { var p = PILL[k] || [k, 'n']; return CL.pill(p[0], p[1]); };
  CL.delta = function (cur, prev, goodUp) {
    if (goodUp == null) goodUp = true;
    if (!prev) return cur ? '<span class="dl dl--n">New this period</span>' : '<span class="dl dl--n">No change</span>';
    var ch = (cur - prev) / Math.abs(prev), up = ch >= 0, good = up === goodUp;
    if (Math.abs(ch) < 0.0005) return '<span class="dl dl--n">No change</span>';
    return '<span class="dl dl--' + (good ? 'up' : 'dn') + '">' + icon(up ? 'trendUp' : 'trendDown', 13) + (up ? '+' : '−') + (Math.abs(ch) * 100).toFixed(Math.abs(ch) < 0.1 ? 1 : 0) + '%</span>';
  };
  CL.empty = function (ic, title, text, action) { return '<div class="empty">' + icon(ic, 26) + '<b>' + esc(title) + '</b>' + (text ? '<p>' + esc(text) + '</p>' : '') + (action || '') + '</div>'; };

  /* ---------------- toasts ---------------- */
  CL.toast = function (msg, tone, opts) {
    opts = opts || {};
    var box = document.getElementById('toasts'); if (!box) { box = document.createElement('div'); box.id = 'toasts'; box.className = 'toasts'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
    var t = document.createElement('div'); t.className = 'toast toast--' + (tone || 'ok');
    t.innerHTML = icon(tone === 'err' ? 'alert' : tone === 'info' ? 'info' : 'check', 16) + '<span>' + esc(msg) + '</span>' + (opts.action ? '<button class="toast__a">' + esc(opts.action.label) + '</button>' : '');
    if (opts.action) t.querySelector('.toast__a').onclick = function () { opts.action.fn(); t.remove(); };
    box.appendChild(t); requestAnimationFrame(function () { t.classList.add('is-in'); });
    setTimeout(function () { t.classList.remove('is-in'); setTimeout(function () { t.remove(); }, 300); }, opts.ms || (tone === 'err' ? 5200 : 3200));
  };
  /** Run an action; show its error in a toast (or the form) instead of throwing. */
  CL.try = function (fn, ok, form) {
    try { var r = fn(); if (ok) CL.toast(typeof ok === 'function' ? ok(r) : ok); return r === undefined ? true : r; }
    catch (e) {
      if (!e.userFacing) { console.error(e); CL.toast('Something went wrong. Nothing was saved.', 'err'); return false; }
      if (form) { var box = form.querySelector('.form-err'); if (box) { box.innerHTML = icon('alert', 15) + '<span>' + esc(e.message) + '</span>' + (e.problems ? '<ul>' + e.problems.slice(0, 8).map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>' : ''); box.hidden = false; box.scrollIntoView({ block: 'nearest' }); } if (e.field) { var fld = form.querySelector('[name="' + e.field + '"]'); if (fld) { fld.setAttribute('aria-invalid', 'true'); fld.focus(); } } }
      else CL.toast(e.message, 'err');
      return false;
    }
  };

  /* ---------------- overlays: modal / drawer ---------------- */
  var stack = [];
  CL.open = function (kind, html, o) {
    o = o || {};
    var ov = document.createElement('div'); ov.className = 'ovl ovl--' + kind + (o.cls ? ' ' + o.cls : '');
    ov.innerHTML = '<div class="ovl__bg" data-close></div><div class="ovl__panel" role="dialog" aria-modal="true" aria-label="' + esc(o.label || 'Dialog') + '" tabindex="-1">' + html + '</div>';
    document.body.appendChild(ov); var prev = document.activeElement; stack.push({ el: ov, prev: prev, onClose: o.onClose });
    document.documentElement.classList.add('has-ovl');
    requestAnimationFrame(function () { ov.classList.add('is-in'); var fo = ov.querySelector('[autofocus]') || ov.querySelector('.ovl__panel'); fo.focus({ preventScroll: true }); });
    ov.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) CL.close(); });
    return ov.querySelector('.ovl__panel');
  };
  CL.close = function () {
    var top = stack.pop(); if (!top) return; top.el.classList.remove('is-in');
    setTimeout(function () { top.el.remove(); if (!stack.length) document.documentElement.classList.remove('has-ovl'); }, 220);
    if (top.onClose) top.onClose(); if (top.prev && top.prev.focus) top.prev.focus({ preventScroll: true });
  };
  CL.closeAll = function () { while (stack.length) CL.close(); };
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && stack.length) { e.preventDefault(); CL.close(); }
    if (e.key === 'Tab' && stack.length) { var p = stack[stack.length - 1].el.querySelector('.ovl__panel'), fs = p.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex="0"]'); if (!fs.length) return; var a = fs[0], z = fs[fs.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
  });
  CL.head = function (title, sub, ic) { return '<header class="ovl__h">' + (ic ? '<span class="ovl__ic">' + icon(ic, 18) + '</span>' : '') + '<div><h2>' + esc(title) + '</h2>' + (sub ? '<p>' + sub + '</p>' : '') + '</div><button class="ib" data-close aria-label="Close">' + icon('x', 18) + '</button></header>'; };
  /** Confirmation dialog. o: {title, text, ok, tone, icon, input:{label,placeholder,required}, onOk(panel)} */
  CL.confirm = function (o) {
    var p = CL.open('modal', '<div class="cf">' + '<span class="cf__ic cf__ic--' + (o.tone || 'g') + '">' + icon(o.icon || 'check', 22) + '</span><h2>' + esc(o.title) + '</h2>' + (o.text ? '<p>' + o.text + '</p>' : '') +
      (o.input ? '<label class="fld"><span>' + esc(o.input.label) + '</span><' + (o.input.area ? 'textarea rows="3"' : 'input') + ' name="cfIn" placeholder="' + esc(o.input.placeholder || '') + '" autofocus>' + (o.input.area ? '</textarea>' : '') + '</label>' : '') +
      (o.extra || '') + '<div class="form-err" hidden></div><div class="cf__a"><button class="btn" data-close>Cancel</button><button class="btn btn--' + (o.tone === 'r' ? 'danger' : 'p') + '" data-ok' + (o.input ? '' : ' autofocus') + '>' + esc(o.ok || 'Confirm') + '</button></div></div>', { label: o.title, cls: 'ovl--sm' });
    p.querySelector('[data-ok]').onclick = function () {
      var v = o.input ? p.querySelector('[name=cfIn]').value.trim() : null;
      if (o.input && o.input.required && !v) { var fe = p.querySelector('.form-err'); fe.hidden = false; fe.innerHTML = icon('alert', 15) + '<span>' + esc(o.input.label) + ' is required.</span>'; return; }
      var r = o.onOk ? o.onOk(v, p) : true; if (r !== false) CL.close();
    };
    return p;
  };
  /** Popover menu anchored to an element. items: [{label, icon, fn, danger, disabled}] or '-' */
  CL.menu = function (anchor, items) {
    document.querySelectorAll('.menu').forEach(function (m) { m.remove(); });
    var m = document.createElement('div'); m.className = 'menu'; m.setAttribute('role', 'menu');
    m.innerHTML = items.map(function (it, i) { return it === '-' ? '<hr>' : '<button role="menuitem" data-i="' + i + '"' + (it.disabled ? ' disabled' : '') + ' class="' + (it.danger ? 'is-danger' : '') + '">' + (it.icon ? icon(it.icon, 15) : '') + '<span>' + esc(it.label) + '</span>' + (it.hint ? '<em>' + esc(it.hint) + '</em>' : '') + '</button>'; }).join('');
    document.body.appendChild(m);
    var r = anchor.getBoundingClientRect(), w = m.offsetWidth, h = m.offsetHeight, x = Math.min(innerWidth - w - 8, Math.max(8, r.right - w)), y = r.bottom + 6; if (y + h > innerHeight - 8) y = Math.max(8, r.top - h - 6);
    m.style.left = x + 'px'; m.style.top = y + 'px'; requestAnimationFrame(function () { m.classList.add('is-in'); var b = m.querySelector('button:not([disabled])'); if (b) b.focus(); });
    function off(e) { if (!m.contains(e.target) && e.target !== anchor) { m.remove(); document.removeEventListener('mousedown', off, true); } }
    document.addEventListener('mousedown', off, true);
    m.addEventListener('keydown', function (e) { if (e.key === 'Escape') { m.remove(); anchor.focus(); } if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); var bs = [].slice.call(m.querySelectorAll('button:not([disabled])')), i = bs.indexOf(document.activeElement); (bs[(i + (e.key === 'ArrowDown' ? 1 : -1) + bs.length) % bs.length]).focus(); } });
    m.addEventListener('click', function (e) { var b = e.target.closest('button[data-i]'); if (!b) return; m.remove(); document.removeEventListener('mousedown', off, true); items[+b.dataset.i].fn(); });
  };

  /* ---------------- forms ---------------- */
  CL.field = function (label, control, hint, cls) { return '<label class="fld' + (cls ? ' ' + cls : '') + '"><span>' + label + '</span>' + control + (hint ? '<em>' + hint + '</em>' : '') + '</label>'; };
  CL.select = function (name, opts, val, attrs) { return '<select name="' + name + '"' + (attrs || '') + '>' + opts.map(function (o) { if (o.group) return '<optgroup label="' + esc(o.group) + '">' + o.items.map(function (x) { return '<option value="' + esc(x.v) + '"' + (String(x.v) === String(val) ? ' selected' : '') + (x.d ? ' disabled' : '') + '>' + esc(x.l) + '</option>'; }).join('') + '</optgroup>'; return '<option value="' + esc(o.v) + '"' + (String(o.v) === String(val) ? ' selected' : '') + (o.d ? ' disabled' : '') + '>' + esc(o.l) + '</option>'; }).join('') + '</select>'; };
  /** Grouped account picker. filter(a) optional. */
  CL.accountOptions = function (filter, includeBlank) {
    var E = CL.store.E, groups = [['asset', 'Assets'], ['liability', 'Liabilities'], ['equity', 'Equity'], ['income', 'Income'], ['expense', 'Expenses']].map(function (g) { return { group: g[1], items: E.accountsByType(g[0]).filter(function (a) { return a.status === 'active' && (!filter || filter(a)); }).map(function (a) { return { v: a.id, l: a.code + ' · ' + a.name }; }) }; }).filter(function (g) { return g.items.length; });
    return (includeBlank ? [{ v: '', l: includeBlank }] : []).concat(groups);
  };
  CL.formData = function (form) { var o = {}; [].forEach.call(form.elements, function (el) { if (!el.name || el.disabled) return; if (el.type === 'checkbox') o[el.name] = el.checked; else if (el.type === 'radio') { if (el.checked) o[el.name] = el.value; } else o[el.name] = el.value; }); return o; };
  CL.moneyInput = function (name, val, attrs) { return '<span class="minp"><i>' + f.cur() + '</i><input name="' + name + '" inputmode="decimal" autocomplete="off" value="' + esc(val ? f.input(val) : '') + '"' + (attrs || '') + '></span>'; };

  /* ---------------- CSV ---------------- */
  CL.csv = function (name, rows) {
    var s = rows.map(function (r) { return r.map(function (c) { c = c == null ? '' : String(c); return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(','); }).join('\r\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + s], { type: 'text/csv;charset=utf-8' })); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 400); CL.toast('Exported ' + name);
  };
  CL.csvMoney = function (c) { return c == null ? '' : (c / 100).toFixed(2); };

  /* ---------------- table helper: sort + paginate ---------------- */
  /** cols: [{k, label, cls, sort:(row)=>value, cell:(row)=>html}] ; st: {sort, dir, page} persisted by caller */
  CL.table = function (rows, cols, st, o) {
    o = o || {}; st.page = st.page || 1; var per = o.per || 25;
    if (st.sort) { var c = cols.filter(function (x) { return x.k === st.sort; })[0]; if (c && c.sort) rows = rows.slice().sort(function (a, b) { var x = c.sort(a), y = c.sort(b); return (x < y ? -1 : x > y ? 1 : 0) * (st.dir === 'desc' ? -1 : 1); }); }
    var pages = Math.max(1, Math.ceil(rows.length / per)); if (st.page > pages) st.page = pages;
    var view = o.all ? rows : rows.slice((st.page - 1) * per, st.page * per);
    var h = '<div class="t-wrap"><table class="t t--cards' + (o.cls ? ' ' + o.cls : '') + '"><thead><tr>' + cols.map(function (c) { var on = st.sort === c.k; return '<th class="' + (c.cls || '') + '"' + (c.sort ? ' aria-sort="' + (on ? (st.dir === 'desc' ? 'descending' : 'ascending') : 'none') + '"' : '') + '>' + (c.sort ? '<button class="th-s' + (on ? ' is-on' : '') + '" data-sort="' + c.k + '">' + esc(c.label) + icon(on ? (st.dir === 'desc' ? 'down' : 'up') : 'sort', 12) + '</button>' : esc(c.label)) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      (view.length ? view.map(function (r, i) { return '<tr' + (o.rowAttr ? ' ' + o.rowAttr(r) : '') + '>' + cols.map(function (c) { return '<td class="' + (c.cls || '') + '" data-l="' + esc(c.label || '') + '">' + c.cell(r, i) + '</td>'; }).join('') + '</tr>'; }).join('') : '<tr class="t-empty"><td colspan="' + cols.length + '">' + (o.empty || 'Nothing matches these filters.') + '</td></tr>') +
      '</tbody>' + (o.foot ? '<tfoot>' + o.foot + '</tfoot>' : '') + '</table></div>';
    if (!o.all && rows.length > per) h += '<div class="pager"><span>' + ((st.page - 1) * per + 1) + '–' + Math.min(rows.length, st.page * per) + ' of ' + rows.length + '</span><button class="ib ib--sm" data-page="' + (st.page - 1) + '"' + (st.page <= 1 ? ' disabled' : '') + ' aria-label="Previous page">' + icon('left', 16) + '</button><b>' + st.page + ' / ' + pages + '</b><button class="ib ib--sm" data-page="' + (st.page + 1) + '"' + (st.page >= pages ? ' disabled' : '') + ' aria-label="Next page">' + icon('right', 16) + '</button></div>';
    return h;
  };
  /** Label hand-built tables (4+ columns) so phones can show them as stacked cards (see .t--cards in app.css). */
  CL.cardify = function (root) {
    (root || document).querySelectorAll('table.t:not(.t--cards):not(.jl):not(.t--keep)').forEach(function (t) {
      var labels = [];
      [].forEach.call(t.querySelectorAll('thead th'), function (th) { for (var i = 0, n = +th.getAttribute('colspan') || 1; i < n; i++) labels.push(th.textContent.trim()); });
      if (labels.length < 4) return;
      t.classList.add('t--cards');
      t.querySelectorAll('tbody tr, tfoot tr').forEach(function (tr) {
        var c = 0;
        [].forEach.call(tr.children, function (td) { var n = +td.getAttribute('colspan') || 1; if (n === 1 && !td.hasAttribute('data-l')) td.setAttribute('data-l', labels[c] || ''); c += n; });
      });
    });
  };
  (function () {
    function watch() { CL.cardify(document); new MutationObserver(function () { CL.cardify(document); }).observe(document.body, { childList: true, subtree: true }); }
    if (document.body) watch(); else document.addEventListener('DOMContentLoaded', watch);
  })();
  /** Wire sort/page clicks inside root; call rerender() after state change. */
  CL.tableEvents = function (root, st, rerender) {
    root.addEventListener('click', function (e) {
      var s = e.target.closest('[data-sort]'); if (s) { var k = s.dataset.sort; if (st.sort === k) st.dir = st.dir === 'desc' ? 'asc' : 'desc'; else { st.sort = k; st.dir = 'asc'; } st.page = 1; rerender(); return; }
      var p = e.target.closest('[data-page]'); if (p && !p.disabled) { st.page = +p.dataset.page; rerender(); var top = root.querySelector('.t-wrap'); if (top && top.getBoundingClientRect().top < 0) top.scrollIntoView({ block: 'start' }); }
    });
  };

  /* ---------------- charts ---------------- */
  var C = CL.chart = {};
  C.niceMax = function (v) { if (v <= 0) return 1; var p = Math.pow(10, Math.floor(Math.log10(v))), n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; };
  function ticks(min, max, n) { var out = []; for (var i = 0; i <= n; i++) out.push(min + (max - min) * i / n); return out; }
  /** Round axis: about n steps of 1/2/2.5/5 × 10^k that cover [lo, hi] and include zero. */
  function scale(lo, hi, n) {
    lo = Math.min(0, lo); hi = Math.max(0, hi); if (hi === lo) hi = lo + 1;
    var raw = (hi - lo) / (n || 4), p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p, step = (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
    var a = Math.floor(lo / step) * step, b = Math.ceil(hi / step) * step, t = []; for (var v = a; v <= b + step / 2; v += step) t.push(Math.abs(v) < step / 1e6 ? 0 : v);
    return { min: a, max: b, ticks: t };
  }
  C.scale = scale;
  function smooth(pts) {
    if (pts.length < 2) return ''; var d = 'M' + pts[0][0].toFixed(1) + ',' + pts[0][1].toFixed(1), n = pts.length, m = [], dx = [], dy = [], s = [];
    for (var i = 0; i < n - 1; i++) { dx[i] = pts[i + 1][0] - pts[i][0]; dy[i] = pts[i + 1][1] - pts[i][1]; s[i] = dy[i] / dx[i]; }
    m[0] = s[0]; m[n - 1] = s[n - 2]; for (i = 1; i < n - 1; i++) m[i] = s[i - 1] * s[i] <= 0 ? 0 : (s[i - 1] + s[i]) / 2;
    for (i = 0; i < n - 1; i++) { if (s[i] === 0) { m[i] = m[i + 1] = 0; continue; } var a = m[i] / s[i], b = m[i + 1] / s[i], h = a * a + b * b; if (h > 9) { var t = 3 / Math.sqrt(h); m[i] = t * a * s[i]; m[i + 1] = t * b * s[i]; } }
    for (i = 0; i < n - 1; i++) d += 'C' + (pts[i][0] + dx[i] / 3).toFixed(1) + ',' + (pts[i][1] + m[i] * dx[i] / 3).toFixed(1) + ' ' + (pts[i + 1][0] - dx[i] / 3).toFixed(1) + ',' + (pts[i + 1][1] - m[i + 1] * dx[i] / 3).toFixed(1) + ' ' + pts[i + 1][0].toFixed(1) + ',' + pts[i + 1][1].toFixed(1);
    return d;
  }
  C.smooth = smooth;
  var gid = 0;
  /** Paired pill bars. o: {labels, a:{name,values}, b:{name,values}, h} — a solid accent, b hatched. */
  C.pills = function (o) {
    var W = o.w || 640, H = o.h || 240, padL = 46, padB = 26, padT = 12, n = o.labels.length, all = o.a.values.concat(o.b ? o.b.values : []);
    var sc = scale(0, Math.max.apply(null, all.concat([1])), 4), max = sc.max, cw = (W - padL - 6) / n, bw = Math.min(26, cw * (o.b ? 0.32 : 0.56)), id = 'h' + (++gid);
    var y = function (v) { return padT + (H - padT - padB) * (1 - v / max); };
    var s = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img" aria-label="' + esc(o.aria || '') + '"><defs><pattern id="' + id + '" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" class="ch-hbg"/><line x1="0" y1="0" x2="0" y2="7" class="ch-hl"/></pattern></defs>';
    sc.ticks.forEach(function (t) { s += '<line x1="' + padL + '" x2="' + W + '" y1="' + y(t).toFixed(1) + '" y2="' + y(t).toFixed(1) + '" class="ch-grid"/><text x="' + (padL - 8) + '" y="' + (y(t) + 4).toFixed(1) + '" class="ch-ax" text-anchor="end">' + f.short(t, true) + '</text>'; });
    var lstep = Math.max(1, Math.ceil(n / Math.max(3, Math.floor((W - padL) / 40))));
    o.labels.forEach(function (l, i) {
      var cx = padL + cw * i + cw / 2, va = o.a.values[i], vb = o.b ? o.b.values[i] : null, g = o.b ? 3 : 0;
      var x1 = o.b ? cx - bw - g / 2 : cx - bw / 2, ha = Math.max(2, (H - padT - padB) * va / max);
      s += '<rect x="' + x1.toFixed(1) + '" y="' + (H - padB - ha).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + ha.toFixed(1) + '" rx="' + (bw / 2).toFixed(1) + '" class="ch-pa' + (o.hi === i ? ' is-hi' : '') + '"/>';
      if (o.b) { var hb = Math.max(2, (H - padT - padB) * vb / max); s += '<rect x="' + (cx + g / 2).toFixed(1) + '" y="' + (H - padB - hb).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + hb.toFixed(1) + '" rx="' + (bw / 2).toFixed(1) + '" fill="url(#' + id + ')" class="ch-pb"/>'; }
      if (i % lstep === 0) s += '<text x="' + cx.toFixed(1) + '" y="' + (H - 7) + '" class="ch-ax" text-anchor="middle">' + esc(l) + '</text>';
      s += '<rect class="ch-hit" x="' + (padL + cw * i).toFixed(1) + '" y="0" width="' + cw.toFixed(1) + '" height="' + H + '" data-i="' + i + '"/>';
    });
    return s + '</svg>';
  };
  /** Smooth area line with optional dashed comparison series and zero line. o: {labels, series:[{name, values, dashed}], h, zero} */
  C.line = function (o) {
    var W = o.w || 640, H = o.h || 240, padL = 50, padB = 26, padT = 14, n = o.labels.length, all = [];
    o.series.forEach(function (s) { all = all.concat(s.values); });
    var sc = scale(Math.min.apply(null, all.concat([0])), Math.max.apply(null, all.concat([0])), 4), max = sc.max, min = sc.min;
    var x = function (i) { return padL + (W - padL - 8) * (n === 1 ? 0.5 : i / (n - 1)); }, y = function (v) { return padT + (H - padT - padB) * (1 - (v - min) / (max - min)); };
    var id = 'g' + (++gid), s = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img" aria-label="' + esc(o.aria || '') + '"><defs><linearGradient id="' + id + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" class="ch-g0"/><stop offset="1" class="ch-g1"/></linearGradient></defs>';
    sc.ticks.forEach(function (t) { s += '<line x1="' + padL + '" x2="' + W + '" y1="' + y(t).toFixed(1) + '" y2="' + y(t).toFixed(1) + '" class="ch-grid' + (t === 0 && min < 0 ? ' ch-zero' : '') + '"/><text x="' + (padL - 8) + '" y="' + (y(t) + 4).toFixed(1) + '" class="ch-ax" text-anchor="end">' + f.short(t, true) + '</text>'; });
    var step = Math.max(1, Math.ceil(n / Math.min(o.maxLabels || 12, Math.max(3, Math.floor((W - padL) / 44)))));
    o.labels.forEach(function (l, i) { if (i % step === 0 || i === n - 1) s += '<text x="' + x(i).toFixed(1) + '" y="' + (H - 7) + '" class="ch-ax" text-anchor="' + (i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle') + '">' + esc(l) + '</text>'; });
    o.series.forEach(function (sr, k) {
      var pts = sr.values.map(function (v, i) { return [x(i), y(v)]; }), d = smooth(pts);
      if (!sr.dashed && k === 0) s += '<path d="' + d + ' L' + x(n - 1).toFixed(1) + ',' + y(Math.max(min, 0)).toFixed(1) + ' L' + x(0).toFixed(1) + ',' + y(Math.max(min, 0)).toFixed(1) + 'Z" fill="url(#' + id + ')"/>';
      s += '<path d="' + d + '" class="ch-l' + (sr.dashed ? ' ch-l--d' : '') + (sr.tone ? ' ch-l--' + sr.tone : '') + '"/>';
    });
    s += '<line class="ch-cur" x1="0" x2="0" y1="' + padT + '" y2="' + (H - padB) + '" style="opacity:0"/>';
    o.series.forEach(function (sr, k) { s += '<circle class="ch-dot' + (sr.dashed ? ' ch-dot--d' : '') + '" r="5" cx="0" cy="0" style="opacity:0" data-s="' + k + '"/>'; });
    for (var i = 0; i < n; i++) { var x0 = i === 0 ? padL : (x(i - 1) + x(i)) / 2, x1 = i === n - 1 ? W : (x(i) + x(i + 1)) / 2; s += '<rect class="ch-hit" x="' + x0.toFixed(1) + '" y="0" width="' + (x1 - x0).toFixed(1) + '" height="' + H + '" data-i="' + i + '" data-x="' + x(i).toFixed(1) + '" data-y="' + o.series.map(function (sr) { return y(sr.values[i]).toFixed(1); }).join(',') + '"/>'; }
    return s + '</svg>';
  };
  /** Up/down bars (cash in above zero, out below) with a closing-balance line. */
  C.flow = function (o) {
    var W = o.w || 640, H = o.h || 240, padL = 50, padB = 26, padT = 12, n = o.labels.length;
    var sc = scale(-Math.max.apply(null, o.outflow.concat([1])), Math.max.apply(null, o.inflow.concat(o.balance || [], [1])), 4), max = sc.max, min = sc.min, y = function (v) { return padT + (H - padT - padB) * (1 - (v - min) / (max - min)); };
    var cw = (W - padL - 6) / n, bw = Math.min(22, cw * 0.46), s = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img" aria-label="' + esc(o.aria || '') + '">';
    sc.ticks.forEach(function (t) { s += '<line x1="' + padL + '" x2="' + W + '" y1="' + y(t).toFixed(1) + '" y2="' + y(t).toFixed(1) + '" class="ch-grid' + (Math.abs(t) < 1 ? ' ch-zero' : '') + '"/><text x="' + (padL - 8) + '" y="' + (y(t) + 4).toFixed(1) + '" class="ch-ax" text-anchor="end">' + f.short(t, true) + '</text>'; });
    var pts = [], lstep = Math.max(1, Math.ceil(n / Math.max(3, Math.floor((W - padL) / 40))));
    o.labels.forEach(function (l, i) {
      var cx = padL + cw * i + cw / 2, z = y(0), hi = Math.max(1.5, z - y(o.inflow[i])), ho = Math.max(1.5, y(-o.outflow[i]) - z);
      s += '<rect x="' + (cx - bw / 2).toFixed(1) + '" y="' + (z - hi).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + hi.toFixed(1) + '" rx="4" class="ch-in"/>';
      s += '<rect x="' + (cx - bw / 2).toFixed(1) + '" y="' + (z + 1).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + ho.toFixed(1) + '" rx="4" class="ch-out"/>';
      if (i % lstep === 0) s += '<text x="' + cx.toFixed(1) + '" y="' + (H - 7) + '" class="ch-ax" text-anchor="middle">' + esc(l) + '</text>';
      if (o.balance) pts.push([cx, y(o.balance[i])]);
      s += '<rect class="ch-hit" x="' + (padL + cw * i).toFixed(1) + '" y="0" width="' + cw.toFixed(1) + '" height="' + H + '" data-i="' + i + '"/>';
    });
    if (pts.length) s += '<path d="' + smooth(pts) + '" class="ch-l ch-l--ink"/>' + pts.map(function (p) { return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="2.6" class="ch-pt"/>'; }).join('');
    return s + '</svg>';
  };
  /** Donut. o: {items:[{label, value, tone}], size, center:{value,label}} */
  C.donut = function (o) {
    var R = 70, r = 50, cx = 80, cy = 80, total = o.items.reduce(function (t, x) { return t + x.value; }, 0) || 1, a0 = -Math.PI / 2, s = '<svg class="donut" viewBox="0 0 160 160" role="img" aria-label="' + esc(o.aria || '') + '">';
    o.items.forEach(function (it, i) {
      var a1 = a0 + Math.PI * 2 * it.value / total - (o.items.length > 1 ? 0.025 : 0), large = a1 - a0 > Math.PI ? 1 : 0;
      if (a1 - a0 > 0.001) s += '<path data-i="' + i + '" class="dn-seg dn-' + (it.tone || i) + '" d="M' + (cx + R * Math.cos(a0)).toFixed(2) + ',' + (cy + R * Math.sin(a0)).toFixed(2) + ' A' + R + ',' + R + ' 0 ' + large + ' 1 ' + (cx + R * Math.cos(a1)).toFixed(2) + ',' + (cy + R * Math.sin(a1)).toFixed(2) + ' L' + (cx + r * Math.cos(a1)).toFixed(2) + ',' + (cy + r * Math.sin(a1)).toFixed(2) + ' A' + r + ',' + r + ' 0 ' + large + ' 0 ' + (cx + r * Math.cos(a0)).toFixed(2) + ',' + (cy + r * Math.sin(a0)).toFixed(2) + 'Z"/>';
      a0 = a1 + (o.items.length > 1 ? 0.025 : 0);
    });
    if (o.center) s += '<text x="80" y="78" text-anchor="middle" class="dn-v">' + esc(o.center.value) + '</text><text x="80" y="96" text-anchor="middle" class="dn-l">' + esc(o.center.label) + '</text>';
    return s + '</svg>';
  };
  /** Half-donut gauge (reference: "Project progress"). o: {value 0..1, label, sub, parts:[a,b,c]} */
  C.gauge = function (o) {
    var cx = 120, cy = 112, R = 92, r = 62, id = 'gh' + (++gid);
    function arc(a, b, cls, fill) { var x0 = cx + R * Math.cos(a), y0 = cy + R * Math.sin(a), x1 = cx + R * Math.cos(b), y1 = cy + R * Math.sin(b), large = b - a > Math.PI ? 1 : 0; return '<path class="' + cls + '"' + (fill ? ' fill="' + fill + '"' : '') + ' d="M' + x0.toFixed(2) + ',' + y0.toFixed(2) + ' A' + R + ',' + R + ' 0 ' + large + ' 1 ' + x1.toFixed(2) + ',' + y1.toFixed(2) + ' L' + (cx + r * Math.cos(b)).toFixed(2) + ',' + (cy + r * Math.sin(b)).toFixed(2) + ' A' + r + ',' + r + ' 0 ' + large + ' 0 ' + (cx + r * Math.cos(a)).toFixed(2) + ',' + (cy + r * Math.sin(a)).toFixed(2) + 'Z"/>'; }
    var parts = o.parts || [o.value, 0, 1 - o.value], a = Math.PI, s = '<svg class="gauge" viewBox="0 0 240 132" role="img" aria-label="' + esc(o.aria || '') + '"><defs><pattern id="' + id + '" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" class="ch-hbg"/><line x1="0" y1="0" x2="0" y2="6" class="ch-hl"/></pattern></defs>';
    var cls = ['gg-a', 'gg-b', 'gg-c'];
    parts.forEach(function (p, i) { if (p <= 0) return; var b = a + Math.PI * p; s += arc(a + (i ? 0.02 : 0), Math.min(2 * Math.PI, b) - (i < parts.length - 1 ? 0.02 : 0), cls[i], i === 2 ? 'url(#' + id + ')' : null); a = b; });
    return s + '<text x="120" y="104" text-anchor="middle" class="gg-v">' + esc(o.label) + '</text><text x="120" y="124" text-anchor="middle" class="gg-l">' + esc(o.sub || '') + '</text></svg>';
  };
  /** Tooltip wiring for pills/line/flow charts. tip(i) returns html. */
  C.bind = function (wrap, tip) {
    var svg = wrap.querySelector('svg'); if (!svg) return; var tt = document.createElement('div'); tt.className = 'ch-tip'; tt.hidden = true; wrap.appendChild(tt);
    var cur = svg.querySelector('.ch-cur'), dots = svg.querySelectorAll('.ch-dot'), bars = svg.querySelectorAll('.ch-pa, .ch-in');
    function show(r) {
      var i = +r.dataset.i; tt.innerHTML = tip(i); tt.hidden = false;
      var b = svg.getBoundingClientRect(), wb = wrap.getBoundingClientRect(), sx = b.width / svg.viewBox.baseVal.width, sy = b.height / svg.viewBox.baseVal.height;
      var px = (r.dataset.x ? +r.dataset.x : +r.getAttribute('x') + +r.getAttribute('width') / 2) * sx + (b.left - wb.left);
      if (cur && r.dataset.x) { cur.setAttribute('x1', r.dataset.x); cur.setAttribute('x2', r.dataset.x); cur.style.opacity = 1; var ys = r.dataset.y.split(','); dots.forEach(function (d, k) { d.setAttribute('cx', r.dataset.x); d.setAttribute('cy', ys[k]); d.style.opacity = 1; }); }
      bars.forEach(function (bb, k) { bb.classList.toggle('is-dim', Math.floor(k / (bars.length / svg.querySelectorAll('.ch-hit').length)) !== i); });
      var w = tt.offsetWidth, left = Math.max(4, Math.min(wb.width - w - 4, px - w / 2)); tt.style.left = left + 'px'; tt.style.top = Math.max(0, (b.top - wb.top) + 4) + 'px';
    }
    function hide() { tt.hidden = true; if (cur) cur.style.opacity = 0; dots.forEach(function (d) { d.style.opacity = 0; }); bars.forEach(function (bb) { bb.classList.remove('is-dim'); }); }
    svg.querySelectorAll('.ch-hit').forEach(function (r) { r.addEventListener('pointerenter', function () { show(r); }); r.addEventListener('pointermove', function () { show(r); }); r.addEventListener('click', function () { show(r); }); });
    svg.addEventListener('pointerleave', hide);
  };
  /** Render a chart at the container's real width (so text never shrinks), re-rendering on resize. */
  C.mount = function (wrap, make, tip) {
    if (!wrap) return;
    function draw() { var w = Math.max(280, Math.round(wrap.clientWidth || 640)); if (wrap._w === w) return; wrap._w = w; var t = wrap.querySelector('.ch-tip'); wrap.innerHTML = make(w); if (tip) C.bind(wrap, tip); }
    draw();
    if ('ResizeObserver' in window) { var ro = new ResizeObserver(function () { draw(); }); ro.observe(wrap); }
  };
  CL.legend = function (items) { return '<div class="lg">' + items.map(function (x) { return '<span><i class="lg-' + x[1] + '"></i>' + esc(x[0]) + '</span>'; }).join('') + '</div>'; };
  CL.spark = function (vals, tone) { var W = 120, H = 34, mx = Math.max.apply(null, vals), mn = Math.min.apply(null, vals), rg = mx - mn || 1; var pts = vals.map(function (v, i) { return [i * W / (vals.length - 1), H - 3 - (H - 6) * (v - mn) / rg]; }); return '<svg class="spark spark--' + (tone || 'g') + '" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true"><path d="' + smooth(pts) + '"/></svg>'; };
})();
