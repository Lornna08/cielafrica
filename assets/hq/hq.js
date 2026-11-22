/* ============================================================
   CIEL HQ — the   (/admin)
   Overview · Orders (photo books, shop, domains) · Calendar · Tasks ·
   Customers · Website. Sign-in is checked on the server.
   ============================================================ */
(function () {
  'use strict';
  var root = document.getElementById('hq');
  /* questions are asked in the page (the phone's own pop-ups are blocked or silent in many app views) */
  window.HQAsk = {
    confirm: function (t, o) { o = o || {}; var m = /^(Delete|Remove|Discard)\b/.exec(t); if (m && !o.ok) { o.ok = m[1]; o.danger = true; } if (!o.ok) { o.ok = 'Yes'; o.primary = true; } return window.PBKAsk ? PBKAsk.confirm(t, o) : Promise.resolve(window.confirm(t)); },
    prompt: function (t, v, o) { o = o || {}; if (!o.ok) { o.ok = 'OK'; o.primary = true; } return window.PBKAsk ? PBKAsk.prompt(t, v, o) : Promise.resolve(window.prompt(t, v)); },
    alert: function (t, o) { return window.PBKAsk ? PBKAsk.alert(t, o) : Promise.resolve(window.alert(t)); }
  };
  var CFG = (window.CIEL && CIEL.photobooks) || {};
  var S = { view: 'overview', orders: [], inbox: [], sources: {}, tasks: [], events: [], notes: [], projects: [], loaded: false, pulse: null, filt: { kind: 'all', q: '', st: 'open' }, cal: null };

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function money(n) { return n == null ? '—' : 'KES ' + Math.round(n).toLocaleString('en-KE'); }
  function d2(t) { return t ? new Date(t).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }) : ''; }
  function dt(t) { return t ? new Date(t).toLocaleString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''; }
  function iso(d) { var z = function (n) { return String(n).padStart(2, '0'); }; return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()); }
  function today() { return iso(new Date()); }
  var inflight = 0;
  function prog(d) { var p = document.getElementById('prog'); if (!p) return; inflight = Math.max(0, inflight + d); if (inflight) { p.className = 'hq-prog'; void p.offsetWidth; p.className = 'hq-prog is-on'; } else { p.className = 'hq-prog is-done'; } }
  function api(url, body) {
    var get = body === undefined, quiet = /route=(pulse|mail-unread|camp-due)\b/.test(url);
    if (!quiet) { prog(1); return api0(url, body, get).then(function (r) { prog(-1); return r; }, function (e) { prog(-1); throw e; }); }
    return api0(url, body, get);
  }
  function api0(url, body, get) {
    return fetch(url, { method: get ? 'GET' : 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'ciel' }, body: get ? undefined : JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return { ok: false, error: 'Unexpected response (' + r.status + ')' }; }).then(function (j) { if (!r.ok || j.ok === false) { var e = new Error(j.error || 'Request failed'); e.status = r.status; e.code = j.code; throw e; } return j; }); });
  }
  var toastT;
  function toast(m, kind) { if (window.CielNote) return CielNote(m, kind ? { kind: kind } : null); var t = document.querySelector('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); } t.textContent = m; t.classList.add('is-on'); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('is-on'); }, 2600); }
  /* icons: Lucide (ISC licence), one consistent 24px line set */
  var I = {
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M9 12h6M9 16h4"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>',
    orders: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
    card: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/></svg>',
    box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>',
    web: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="7" x="3" y="3" rx="1"/><rect width="9" height="7" x="3" y="14" rx="1"/><rect width="5" height="7" x="16" y="14" rx="1"/></svg>',
    inbox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>',
    target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
    people: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>',
    image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>',
    tasks: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/></svg>',
    act: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M12 5v14"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
    ref: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>',
    l: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',
    r: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
    pie: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z"/><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/></svg>',
    ig: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><path d="M17.5 6.5h.01"/></svg>',
    receipt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>',
    ucog: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="10" cy="8" r="5"/><path d="M2 21a8 8 0 0 1 10.434-7.62"/><circle cx="18" cy="18" r="3"/><path d="m19.5 14.3-.4.9"/><path d="m16.9 20.8-.4.9"/><path d="m21.7 19.5-.9-.4"/><path d="m15.2 16.9-.9-.4"/><path d="m21.7 16.5-.9.4"/><path d="m15.2 19.1-.9.4"/><path d="m19.5 21.7-.4-.9"/><path d="m16.9 15.2-.4-.9"/></svg>',
    out: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>',
    monitor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="7" height="7" x="3" y="3" rx="1.5"/><rect width="7" height="7" x="14" y="3" rx="1.5"/><rect width="7" height="7" x="14" y="14" rx="1.5"/><rect width="7" height="7" x="3" y="14" rx="1.5"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></svg>'
  };
  /* the menu: what's used most comes first; each item has its own colour (the tinted icon square) */
  var NAV = [['overview', 'Overview', I.home, 'Today', 'blue'], ['leads', 'Leads', I.target, 0, 'red'], ['inbox', 'Inbox', I.inbox, 0, 'violet'], ['orders', 'Orders', I.orders, 0, 'amber'], ['invoices', 'Invoices & receipts', I.receipt, 0, 'teal'], ['instagram', 'Instagram', I.ig, 0, 'pink'],
    ['projects', 'Projects', I.folder, 'Work', 'indigo'], ['tasks', 'Tasks', I.tasks, 0, 'green'], ['calendar', 'Calendar', I.cal, 0, 'orange'], ['customers', 'Customers', I.people, 0, 'cyan'],
    ['photobooks', 'Photo Books', I.book, 'Sell', 'orange'], ['payments', 'Payments', I.card, 0, 'green'], ['products', 'Products', I.box, 0, 'blue'], ['templates', 'Website templates', I.web, 0, 'violet'], ['campaigns', 'Email campaigns', I.send, 0, 'cyan'], ['reviews', 'Reviews', I.star, 0, 'amber'],
    ['website', 'Website editor', I.globe, 'Website', 'blue'], ['content', 'Content library', I.image, 0, 'pink'], ['policies', 'Policies', I.shield, 0, 'slate'],
    ['analytics', 'Analytics', I.chart, 'Insights', 'violet'], ['reports', 'Reports & exports', I.pie, 0, 'teal'],
    ['team', 'Team & access', I.ucog, 'System', 'indigo'], ['activity', 'Activity log', I.act, 0, 'slate'], ['settings', 'Setup', I.gear, 0, 'slate']];

  /* ---------- order sources, normalised ---------- */
  var KIND = { photobook: ['Photo book', 'var(--k-pb)'], shop: ['Shop', 'var(--k-shop)'], domain: ['Domain', 'var(--k-dom)'], whatsapp: ['WhatsApp', 'var(--k-wa)'], invoice: ['Invoice', 'var(--k-inv)'] };
  var WA_SET = ['pending', 'contacted', 'confirmed', 'paid', 'done', 'cancelled'];
  var WA_LABEL = { pending: 'Pending', contacted: 'Contacted', confirmed: 'Confirmed', paid: 'Paid', done: 'Delivered', cancelled: 'Cancelled', new: 'New' };
  var PB_LABEL = { awaiting_payment: 'Awaiting payment', awaiting_confirmation: 'Paybill: confirm payment', whatsapp_request: 'WhatsApp request', payment_failed: 'Payment failed', paid: 'Waiting for pages', preparing: 'Waiting for pages', ready: 'Pages received', printing: 'Printing', ready_collection: 'Ready to collect', dispatched: 'Dispatched', delivered: 'Delivered', cancelled: 'Cancelled', refunded: 'Refunded' };
  var PB_SET = ['paid', 'ready', 'printing', 'ready_collection', 'dispatched', 'delivered', 'cancelled', 'refunded'];
  var SHOP_SET = ['paid', 'processing', 'fulfilled', 'delivered', 'cancelled', 'refunded'];
  var CLOSED = /^(delivered|cancelled|refunded|payment_failed|registered|unavailable|failed|fulfilled|done)$/;
  function tone(st) { return /deliver|registered|fulfilled/.test(st) ? 'g' : /print|ready|processing|progress|dispatch/.test(st) ? 'b' : /await|pending|paid|prepar|checking/.test(st) ? 'y' : /fail|cancel|refund|unavail/.test(st) ? 'r' : ''; }
  function fromPB(o) { return { kind: 'photobook', ref: o.ref, at: o.createdAt, paid: !!o.paidAt, test: !!o.test, customer: o.customer || {}, total: o.total, status: o.status, label: PB_LABEL[o.status] || o.status, summary: (o.items || []).map(function (i) { return i.name + ' · ' + (i.product === 'print' ? 'Print ×' + i.qty : 'PDF') + ' · ' + i.pages + 'p'; }).join(', '), raw: o }; }
  function fromShop(o) { return { kind: 'shop', ref: o.ref || o.id, at: o.createdAt, paid: !/^(awaiting_payment|payment_failed)$/.test(o.status), customer: o.customer || {}, total: o.total, status: o.status, label: ({ awaiting_payment: 'Awaiting payment', payment_failed: 'Payment failed' })[o.status] || o.status.charAt(0).toUpperCase() + o.status.slice(1), summary: o.order || '', raw: o }; }
  function fromDomain(o, labels) { var c = o.customer || {}; return { kind: 'domain', ref: o.ref, at: o.createdAt, paid: /registered|pending_registration|registration_in_progress|refund/.test(o.status), customer: { name: c.name || o.name, email: c.email || o.email, phone: c.phone || o.phone }, total: o.amount, status: o.status, label: (labels && labels[o.status]) || o.status, summary: o.domain + ' · ' + o.years + ' yr', raw: o }; }
  function fromWA(o) { return { kind: 'whatsapp', ref: o.ref, id: o.id, at: o.createdAt, paid: /^(paid|done)$/.test(o.status), customer: o.customer || {}, total: o.total, status: o.status, label: WA_LABEL[o.status] || o.status, summary: (o.text || o.page || '').replace(/\s+/g, ' ').slice(0, 140), raw: o }; }
  function loadInbox() {
    return api('/api/hq?route=inbox').then(function (r) { S.inbox = r.items || []; S.sources.inbox = r.storage ? 'ok' : 'Blob storage not connected'; }, function (e) { S.inbox = []; S.sources.inbox = e.message; });
  }
  function loadOrders() {
    S.sources = {};
    return Promise.all([
      api('/api/photobooks?route=pbk-admin-orders').then(function (r) { S.sources.photobook = r.storage ? 'ok' : 'Blob storage not connected'; return (r.orders || []).map(fromPB); }, function (e) { S.sources.photobook = e.message; return []; }),
      api('/api/hq?route=shop-orders').then(function (r) { S.sources.shop = r.storage ? 'ok' : 'Blob storage not connected'; return (r.orders || []).map(fromShop); }, function (e) { S.sources.shop = e.message; return []; }),
      api('/api/domains/admin/orders?filter=all').then(function (r) { S.sources.domain = 'ok'; return (r.orders || []).map(function (o) { return fromDomain(o, r.labels); }); }, function (e) { S.sources.domain = e.code === 'store' ? 'Domains database not connected' : e.message; return []; })
    ]).then(function (r) { S.base = r[0].concat(r[1], r[2]); mergeOrders(); });
  }
  function mergeOrders() {
    S.orders = (S.base || []).concat(S.inbox.filter(function (x) { return x.kind === 'whatsapp'; }).map(fromWA), window.HQMoney ? (S.invoices || []).map(HQMoney.invToOrder) : []).sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
  }
  function loadLists() {
    return Promise.all(['tasks', 'events', 'notes', 'projects', 'invoices', 'expenses'].map(function (c) { return api('/api/hq?route=list&c=' + c).then(function (r) { S[c] = r.items || []; }, function (e) { S[c] = []; S.listErr = e.message; }); }).concat(api('/api/hq?route=attn').then(function (r) { S.attnOff = r.off || {}; }, function () { S.attnOff = S.attnOff || {}; })));
  }
  function saveItem(c, item) { return api('/api/hq?route=save', { c: c, item: item }).then(function (r) { var l = S[c], i = l.findIndex(function (x) { return x.id === r.item.id; }); if (i >= 0) l[i] = r.item; else l.push(r.item); return r.item; }); }
  function delItem(c, id) { return api('/api/hq?route=save', { c: c, op: 'delete', id: id }).then(function () { S[c] = S[c].filter(function (x) { return x.id !== id; }); }); }

  /* ---------- start ---------- */
  /* opening Ciel Admin clears the dot on its app icon */
  function clearBadge() { try { if (navigator.clearAppBadge && document.visibilityState === 'visible') navigator.clearAppBadge().catch(function () { }); } catch (e) { } }
  document.addEventListener('visibilitychange', clearBadge);
  function start() {
    clearBadge();
    var known = false; try { known = localStorage.getItem('pbk_admin') === '1'; S.me = JSON.parse(localStorage.getItem('ca_me') || 'null'); } catch (e) { }
    if (known) boot();
    api('/api/hq?route=me').then(function (m) {
      S.setup = m.setup;
      if (!m.signedIn) { forget(); return login(m.setup); }
      var was = JSON.stringify(S.me || null); setMe(m.user);
      if (!known) boot(); else if (was !== JSON.stringify(S.me)) { paintMe(); navs(); route(true); } else paintMe();
    }, function () { if (!known) login({}); });
  }
  /* the signed-in person (owner or team member): name, picture and what they may open */
  function setMe(u) { S.me = u || null; try { localStorage.setItem('ca_me', JSON.stringify(S.me)); } catch (e) { } }
  function can(id) { if (id === 'team') return !!(S.me && S.me.role === 'owner'); return !S.me || S.me.role === 'owner' || (S.me.perms || []).indexOf(id) >= 0; }
  function firstName() { return ((S.me && S.me.name) || 'Lorna').split(/\s+/)[0]; }
  function avatarHtml(u, cls) { u = u || {}; var n = (u.name || '?').trim(), ini = n.split(/\s+/).map(function (w) { return w.charAt(0); }).join('').slice(0, 2).toUpperCase(); return '<span class="av ' + (cls || '') + '">' + (u.avatar ? '<img src="' + esc(u.avatar) + '" alt="">' : '<b>' + esc(ini) + '</b>') + '</span>'; }
  function paintMe() { var b = document.getElementById('meB'); if (b) { b.innerHTML = avatarHtml(S.me, 'av--sm'); b.title = (S.me && S.me.name) || 'Your profile'; } var t = document.querySelector('.hq-side__tag'); if (t) t.textContent = S.me && S.me.role === 'member' ? (S.me.title || 'Team') : 'Admin'; }
  /* signing out (or a session that ended) leaves nothing of the last person behind on this device */
  function forget() { try { ['pbk_admin', 'ca_me', 'ca_snap'].forEach(function (k) { localStorage.removeItem(k); }); } catch (e) { } }
  /* the logo: dark artwork on light screens, the white one on dark screens (never a colour-inverted copy) */
  /* the logo (the same artwork, small copies kept inside the app so it shows instantly, no download) */
  var LOGO_D = 'data:image/webp;base64,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', LOGO_L = 'data:image/webp;base64,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';
  var LOGO = '<img class="lg lg--d" src="' + LOGO_D + '" alt="Ciel Africa" width="80" height="40"><img class="lg lg--l" src="' + LOGO_L + '" alt="" aria-hidden="true" width="85" height="40">';
  function login(setup) {
    root.className = '';
    var eye = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
    var eyeOff = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18M10.6 5.1A10.8 10.8 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7a9.8 9.8 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';
    root.innerHTML = '<div class="hq-login"><div class="hq-login__card"><div class="hq-login__logo">' + LOGO + '</div>' +
      '<h1 class="hq-login__h">Welcome back</h1><p class="hq-login__sub">Sign in to Ciel Admin to manage orders, Photo Books, messages and the website.</p>' +
      (setup && setup.adminPassword === false ? '<div class="hq-setup"><b>Set your admin password first.</b><br>In Vercel open the cielafrica project → Settings → Environment Variables → add <b>ADMIN_PASSWORD</b> with a strong password → Save → Deployments → Redeploy. Then sign in here with it.</div>' : '') +
      '<form id="lf" class="hq-login__form" novalidate><div class="hq-login__em" id="emW" hidden><label class="hq-login__lab" for="em">Email</label><input type="email" id="em" class="hq-login__in" autocomplete="username" placeholder="you@cielafrica.com"></div><label class="hq-login__lab" for="pw">Password</label><div class="hq-login__pw"><input type="password" id="pw" autocomplete="current-password" required autofocus><button type="button" id="pwv" aria-label="Show password" title="Show password">' + eye + '</button></div>' +
      '<button class="hq-login__go" id="lgo" type="submit">Sign in</button><p class="hq-err" id="le" role="alert"></p></form>' +
      '<p class="hq-login__note">You’ll stay signed in on this device for 30 days.</p><button type="button" class="hq-login__sw" id="lsw">Team member? Sign in with your email</button></div>' +
      '<a class="hq-login__back" href="/">← Back to cielafrica.com</a></div>';
    var pw = document.getElementById('pw'), pv = document.getElementById('pwv'), go = document.getElementById('lgo'), emW = document.getElementById('emW'), em = document.getElementById('em'), sw = document.getElementById('lsw');
    var team = false; try { team = localStorage.getItem('ca_lmode') === 'team'; } catch (e) { }
    var mode = function (t) { team = t; emW.hidden = !t; sw.textContent = t ? 'Admin? Sign in with the admin password' : 'Team member? Sign in with your email'; try { localStorage.setItem('ca_lmode', t ? 'team' : 'owner'); } catch (e) { } (t && !em.value ? em : pw).focus(); };
    sw.onclick = function () { mode(!team); }; if (team) mode(true);
    pv.onclick = function () { var show = pw.type === 'password'; pw.type = show ? 'text' : 'password'; pv.innerHTML = show ? eyeOff : eye; pv.setAttribute('aria-label', show ? 'Hide password' : 'Show password'); pw.focus(); };
    document.getElementById('lf').onsubmit = function (e) {
      e.preventDefault(); var le = document.getElementById('le'); le.textContent = '';
      if (team && !em.value.trim()) { le.textContent = 'Enter your email.'; em.focus(); return; }
      if (!pw.value) { le.textContent = 'Enter your password.'; pw.focus(); return; }
      go.disabled = true; go.textContent = 'Signing in…';
      api('/api/hq?route=login', team ? { email: em.value.trim(), password: pw.value } : { password: pw.value }).then(function () { forget(); return api('/api/hq?route=me'); }).then(function (m) { setMe(m.user); S.setup = m.setup; try { localStorage.setItem('pbk_admin', '1'); } catch (er) { } boot(); }, function (er) { go.disabled = false; go.textContent = 'Sign in'; le.textContent = er.message; pw.select(); });
    };
  }
  function boot() {
    try { localStorage.setItem('pbk_admin', '1'); } catch (e) { }
    root.className = 'hq';
    root.innerHTML = '<aside class="hq-side"><div class="hq-side__brand">' + LOGO + '<span class="hq-side__tag">Admin</span><button type="button" class="hq-col" id="colB" title="Collapse menu" aria-label="Collapse menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="m16 15-3-3 3-3"/></svg></button></div>' + themeSwitch() + '<nav class="hq-nav" id="nav"></nav><div class="hq-side__foot"><a href="/" target="_blank" rel="noopener">cielafrica.com ↗</a><button id="lo">Sign out</button></div></aside>' +
      '<div class="hq-main"><header class="hq-top"><button class="hq-burger" id="burger" aria-label="Open menu">' + I.menu + '</button><button class="hq-srch" id="sk" title="Search (Ctrl+K)">' + I.search + '<span>Search everything…</span><kbd>Ctrl K</kbd></button><span class="hq-live" id="lv" title="Live">Live</span><button class="b b--sm" id="inst" hidden>Install app</button><button class="b b--sm" id="thm" title="Light or dark"></button><button class="b b--sm hq-bell" id="nb" title="Notifications">' + I.bell + '<i id="nbc" hidden></i></button><button class="b b--sm" id="rf" title="Refresh">' + I.ref + '<span>Refresh</span></button><button class="hq-me" id="meB" type="button" aria-label="Your profile">' + avatarHtml(S.me, 'av--sm') + '</button></header><div class="hq-ph"><h1 id="ttl"></h1><div id="topx"></div></div><main class="hq-body" id="body">' + skel() + '</main></div><nav class="hq-mnav" id="mnav"></nav>';
    document.getElementById('lo').onclick = signOut;
    /* computer: shrink the menu to icons, remembered on this device */
    var mini = function (on) { root.classList.toggle('is-mini', on); var cb = document.getElementById('colB'); cb.title = on ? 'Expand menu' : 'Collapse menu'; cb.setAttribute('aria-label', cb.title); try { localStorage.setItem('ca_mini', on ? '1' : ''); } catch (e) { } };
    try { if (localStorage.getItem('ca_mini') === '1') mini(true); } catch (e) { }
    document.getElementById('colB').onclick = function () { mini(!root.classList.contains('is-mini')); };
    document.getElementById('meB').onclick = meMenu; paintMe();
    document.getElementById('rf').onclick = function () { if (window.HQGrow) HQGrow.refresh(); refresh(true); };
    /* phone & tablet: the sidebar slides in from the left */
    var side = root.querySelector('.hq-side'), scrim = document.createElement('div'); scrim.className = 'hq-scrim'; root.appendChild(scrim);
    var setNav = function (on) { root.classList.toggle('nav-open', on); document.body.style.overflow = on ? 'hidden' : ''; };
    document.getElementById('burger').onclick = function () { setNav(true); };
    scrim.onclick = function () { setNav(false); };
    side.addEventListener('click', function (e) { if (e.target.closest('a[href^="#"]')) setNav(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setNav(false); });
    /* swipe in from the left edge to open, swipe left to close */
    var sx = null, sy = 0;
    document.addEventListener('touchstart', function (e) { var t = e.touches[0]; sx = (t.clientX < 24 || root.classList.contains('nav-open')) ? t.clientX : null; sy = t.clientY; }, { passive: true });
    document.addEventListener('touchend', function (e) { if (sx == null) return; var t = e.changedTouches[0], dx = t.clientX - sx; if (Math.abs(t.clientY - sy) < 60) { if (dx > 50) setNav(true); else if (dx < -50) setNav(false); } sx = null; }, { passive: true });
    /* light (the default), dark, or follow the phone/computer's own setting */
    var th = document.getElementById('thm'), dark = function () { return document.documentElement.getAttribute('data-theme') === 'dark'; };
    var paintTh = function () { th.innerHTML = dark() ? I.sun : I.moon; th.title = dark() ? 'Switch to light' : 'Switch to dark'; var m = themeMode(); document.querySelectorAll('[data-tm]').forEach(function (x) { var on = x.getAttribute('data-tm') === m; x.classList.toggle('is-on', on); x.setAttribute('aria-checked', on ? 'true' : 'false'); }); };
    paintTh(); th.onclick = function () { setTheme(dark() ? 'light' : 'dark'); };
    window.__paintTh = paintTh;
    root.querySelectorAll('[data-tm]').forEach(function (x) { x.onclick = function () { setTheme(x.getAttribute('data-tm')); }; });
    try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { if (themeMode() === 'system') setTheme('system'); }); } catch (e) { }
    document.getElementById('inst').onclick = install; if (installEv) document.getElementById('inst').hidden = false;
    var nb = document.getElementById('nb');
    nb.onclick = function () { if (window.HQTools) HQTools.notifs(nb); };
    document.getElementById('sk').onclick = function () { if (window.HQTools) HQTools.palette(); };
    window.addEventListener('hashchange', function () { S.hops = (S.hops || 0) + 1; route(); });
    /* open straight away with what this device saw last time, then bring it up to date */
    if (snapLoad()) { route(); refresh(false, true); } else refresh(false);
    live();
  }
  /* while the first numbers load: the page's shape, softly pulsing (never a blank page or a bare "Loading…") */
  function skel() { return '<div class="sk4"><div class="sk sk4__h"></div><div class="sk4__k"><div class="sk"></div><div class="sk"></div><div class="sk"></div><div class="sk"></div></div><div class="sk4__g"><div class="sk"></div><div class="sk"></div></div></div>'; }
  var SNAP = ['base', 'inbox', 'tasks', 'events', 'notes', 'projects', 'invoices', 'expenses', 'attnOff'];
  function snapSave() { try { var o = { at: Date.now(), who: S.me ? (S.me.id || S.me.role) : '' }; SNAP.forEach(function (k) { o[k] = S[k]; }); localStorage.setItem('ca_snap', JSON.stringify(o)); } catch (e) { try { localStorage.removeItem('ca_snap'); } catch (x) { } } }
  function snapLoad() { try { var o = JSON.parse(localStorage.getItem('ca_snap') || 'null'); if (!o || Date.now() - o.at > 7 * 864e5 || o.who !== (S.me ? (S.me.id || S.me.role) : '')) return false; SNAP.forEach(function (k) { if (o[k]) S[k] = o[k]; }); mergeOrders(); S.loaded = true; return true; } catch (e) { return false; } }
  function dataSig() { var t = JSON.stringify([S.orders.map(function (o) { return [o.ref, o.status, o.paid, o.total]; }), S.inbox.map(function (m) { return [m.id, m.stage, m.status, m.priority, m.project, (m.notes || []).length]; }), ['tasks', 'events', 'projects', 'invoices', 'expenses'].map(function (c) { return (S[c] || []).map(function (x) { return [x.id, x.updatedAt]; }); })]), h = 0; for (var i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0; return t.length + ':' + h; }
  function refresh(note, quiet) {
    return Promise.all([loadOrders(), loadInbox(), loadLists()]).then(function () {
      mergeOrders(); S.loaded = true; snapSave();
      /* a background check that found nothing new leaves the page alone (no redraw under your finger) */
      var sig = dataSig(); if (quiet && sig === S.sig && S.view !== 'overview') { S.sig = sig; navs(); return; } S.sig = sig;
      if (quiet && (document.querySelector('.drawer,.modal') || S.view === 'campaigns' || S.view === 'website' || /^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName || ''))) navs(); else route(true);
      if (note) toast('Up to date');
      document.getElementById('lv').title = 'Live · updated ' + new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
    });
  }

  /* ---------- live: check for news every 30 s while open, and when a notification arrives ---------- */
  /* ---------- always the newest Ciel Admin: when a new version is published, the open app (computer or
     the phone's home-screen app) picks it up by itself, without closing and reopening it ---------- */
  var BUILD = null, hiddenAt = 0;
  /* the version stamps (?v=) of the files admin.html loads itself; scripts added later are ignored */
  function build(doc) { return [].map.call(doc.querySelectorAll('script[src*="/assets/hq/"],script[src^="/data/"],script[src*="/assets/js/notes"],link[href*="/assets/hq/"]'), function (x) { return x.getAttribute('src') || x.getAttribute('href'); }).filter(function (u) { return /\?v=/.test(u); }).sort().join('|'); }
  function busy() { return !!document.querySelector('.drawer,.modal,.hq-frame,.cp,.np') || /^(campaigns|website)$/.test(S.view) || /^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName || ''); }
  function checkUpdate() {
    if (BUILD === null) BUILD = build(document);
    return fetch('/admin?u=' + Date.now(), { cache: 'no-store', credentials: 'same-origin' }).then(function (r) { return r.ok ? r.text() : ''; }).then(function (h) {
      if (!h) return; var nb = build(new DOMParser().parseFromString(h, 'text/html'));
      if (!nb || nb === BUILD) return;
      var last = 0; try { last = +sessionStorage.getItem('hq_upd_at') || 0; } catch (e) { }
      /* hand the new version to the app's offline copy, so the reload opens it */
      var put = (window.caches ? caches.open('hq-shell-v1').then(function (c) { return c.put('/admin', new Response(h, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })); }) : Promise.resolve()).catch(function () { });
      if (!busy() && Date.now() - last > 120000) { put.then(function () { try { sessionStorage.setItem('hq_updated', '1'); sessionStorage.setItem('hq_upd_at', String(Date.now())); } catch (e) { } location.reload(); }); return; }
      if (document.getElementById('hqUpd')) return;
      var u = document.createElement('button'); u.id = 'hqUpd'; u.className = 'hq-upd'; u.innerHTML = I.ref + '<span>Ciel Admin was updated · tap to load it</span>'; u.onclick = function () { put.then(function () { location.reload(); }); }; document.body.appendChild(u);
    }).catch(function () { });
  }
  function live() {
    BUILD = build(document);
    try { if (sessionStorage.getItem('hq_updated')) { sessionStorage.removeItem('hq_updated'); setTimeout(function () { toast('Ciel Admin is up to date', 'ok'); }, 800); } } catch (e) { }
    setTimeout(checkUpdate, 4000);
    setInterval(function () { if (!document.hidden) checkUpdate(); }, 180000);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { hiddenAt = Date.now(); return; }
      checkUpdate();
      /* back in the app after a while: load the latest orders and messages straight away */
      if (hiddenAt && Date.now() - hiddenAt > 60000) refresh(false, true);
    });
    window.addEventListener('pageshow', function (e) { if (e.persisted) { checkUpdate(); refresh(false, true); } });
    /* keeps going when the window is in the background (a slower check, once a minute) and catches up by itself
       after the computer sleeps or the browser pauses the page overnight */
    var lastOk = Date.now(), lastTry = 0;
    function tick() {
      var now = Date.now();
      if (document.hidden && now - lastTry < 55000) return;
      lastTry = now;
      var stale = now - lastOk > 90000;
      api('/api/hq?route=pulse').then(function (p) {
        var lv = document.getElementById('lv'); if (lv) lv.classList.remove('is-off');
        lastOk = Date.now();
        if (stale && S.pulse !== null && p.v === S.pulse) refresh(false, true);
        S.pitems = p.items || []; if (window.HQTools) HQTools.bell();
        if (S.pulse === null) { S.pulse = p.v; popAway(p.items || []); return; }
        if (p.v !== S.pulse) {
          var fresh = (p.items || []).slice(0, Math.min(5, p.v - S.pulse));
          S.pulse = p.v;
          refresh(false, true).then(function () { if (fresh.length && popMany(fresh)) ping(); });
          if (document.hasFocus && !document.hasFocus() && 'Notification' in window && Notification.permission === 'granted' && !S.pushOn) fresh.forEach(function (x) { try { new Notification(x.title, { body: x.body, icon: '/assets/img/icon-192.png' }); } catch (e) { } });
        }
      }, function (e) { var lv = document.getElementById('lv'); if (lv) lv.classList.add('is-off'); if (e.status === 401) login(S.setup || {}); });
    }
    tick(); setInterval(tick, 15000);   /* the open app checks every 15 s; a phone alert makes it check at once */
    var mailOn = S.setup && S.setup.mail && S.setup.mail.some(function (a) { return a.configured; });
    if (mailOn && window.HQMail) { var mp = function () { if (!document.hidden) HQMail.poll(function () { navs(); }); }; mp(); setInterval(mp, 120000); }
    document.addEventListener('visibilitychange', function () { if (!document.hidden) tick(); });
    ['focus', 'online', 'pageshow'].forEach(function (ev) { window.addEventListener(ev, function () { lastTry = 0; tick(); }); });
    document.addEventListener('resume', function () { lastTry = 0; tick(); });
    if (navigator.serviceWorker) navigator.serviceWorker.addEventListener('message', function (e) { if (e.data && e.data.type === 'hq-push') tick(); });
  }
  /* ---------- pop-ups: a small card with an X for new orders, briefs and messages ---------- */
  var POP_TYPES = [['order', 'New orders and payments', 'Photo books, shop, domains, WhatsApp and Paybill', 1], ['brief', 'Project briefs', 'Someone sent the Start a project form', 1], ['message', 'Website messages', 'The contact form and other enquiries', 1], ['task', 'Task reminders', 'A lead, order or task has waited too long', 1], ['pages', 'Photo book pages received', 'A customer sent or changed their pages', 1], ['review', 'New reviews', 'A customer left a review', 1], ['renewal', 'Domain renewals', 'A domain is due or renewed', 1], ['subscriber', 'New email subscribers', '', 0], ['instagram', 'Instagram activity', 'Comments, messages and posts', 0], ['printer', 'Printer updates', '', 0]];
  function popPrefs() { var d = { on: true, t: {} }; try { d = Object.assign(d, JSON.parse(localStorage.getItem('ca_pops')) || {}); } catch (e) { } POP_TYPES.forEach(function (x) { if (typeof d.t[x[0]] !== 'boolean') d.t[x[0]] = !!x[3]; }); return d; }
  function popSave(d) { try { localStorage.setItem('ca_pops', JSON.stringify(d)); } catch (e) { } }
  function popType(x) { var k = x.kind; if (k === 'whatsapp') return 'order'; if (k === 'lead') return /^project brief/i.test(x.body || '') ? 'brief' : 'message'; return k; }
  var POP_LOOK = { order: ['New order', I.orders, 'o'], brief: ['Project brief', I.target, 'v'], message: ['New message', I.inbox, 'b'], pages: ['Pages received', I.box, 't'], review: ['New review', I.star || I.target, 'y'], renewal: ['Domain', I.web, 'b'], subscriber: ['Subscriber', I.people, 'g'], instagram: ['Instagram', I.inbox, 'p'], printer: ['Printer', I.box, 's'], task: ['Reminder', I.tasks, 'y'] };
  function popMany(list) { var pr = popPrefs(); if (!pr.on) return 0; var ok = list.filter(function (x) { return pr.t[popType(x)] !== false && (!x.kind || can(popSection(x))); }); ok.slice(0, 3).reverse().forEach(pop); if (ok.length > 3) popMore(ok.length - 3); try { localStorage.setItem('ca_pop_at', String(Date.now())); } catch (e) { } return ok.length; }
  function popSection(x) { var t = popType(x); return t === 'order' ? 'orders' : t === 'brief' || t === 'message' ? 'leads' : t === 'pages' ? 'photobooks' : t === 'review' ? 'reviews' : t === 'instagram' ? 'instagram' : t === 'task' ? 'tasks' : 'overview'; }
  /* opening the app: what arrived while it was closed (last 24 hours, newest three) */
  function popAway(items) { var last = 0; try { last = +localStorage.getItem('ca_pop_at') || 0; } catch (e) { } if (!last) { try { localStorage.setItem('ca_pop_at', String(Date.now())); } catch (e) { } return; } var since = Math.max(last, Date.now() - 864e5), list = items.filter(function (x) { return x.at > since; }); if (list.length) setTimeout(function () { popMany(list); }, 900); else try { localStorage.setItem('ca_pop_at', String(Date.now())); } catch (e) { } }
  function popBox() { var b = document.querySelector('.pop4-box'); if (!b) { b = document.createElement('div'); b.className = 'pop4-box'; b.setAttribute('aria-live', 'polite'); document.body.appendChild(b); } return b; }
  function popClose(n) { if (!n || n._gone) return; n._gone = 1; n.classList.remove('is-on'); setTimeout(function () { n.remove(); }, 220); }
  function pop(x) {
    var t = popType(x), L = POP_LOOK[t] || POP_LOOK.message, b = popBox(), n = document.createElement('div');
    var url = x.url && x.url.indexOf('/admin') === 0 ? x.url.slice(6) || '#overview' : '#overview';
    var title = String(x.title || '');
    n.className = 'pop4 pop4--' + L[2]; n.setAttribute('role', 'status');
    n.innerHTML = '<span class="pop4__i">' + L[1] + '</span><div class="pop4__t"><small>' + esc(L[0]) + ' · ' + new Date(x.at || Date.now()).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }) + '</small><b></b><p></p><a class="pop4__go" href="' + esc(url) + '">Open</a></div><button type="button" class="pop4__x" aria-label="Close">' + I.x + '</button>';
    n.querySelector('b').textContent = title; n.querySelector('p').textContent = x.body || ''; if (!x.body) n.querySelector('p').remove();
    n.querySelector('.pop4__x').onclick = function () { popClose(n); };
    n.querySelector('.pop4__go').onclick = function () { popClose(n); };
    b.insertBefore(n, b.firstChild);
    while (b.querySelectorAll('.pop4:not(.pop4--more)').length > (innerWidth < 700 ? 2 : 3)) popClose([].slice.call(b.querySelectorAll('.pop4:not(.pop4--more)')).pop());
    requestAnimationFrame(function () { n.classList.add('is-on'); });
    /* stays until closed; tidies itself away after a few minutes */
    setTimeout(function () { popClose(n); }, 300000);
  }
  function popMore(k) { var b = popBox(), n = document.createElement('button'); n.type = 'button'; n.className = 'pop4 pop4--more is-on'; n.textContent = '+' + k + ' more in notifications'; n.onclick = function () { popClose(n); var bl = document.getElementById('nb'); if (bl) bl.click(); }; b.appendChild(n); setTimeout(function () { popClose(n); }, 60000); }

  function ping() { try { var a = new (window.AudioContext || window.webkitAudioContext)(), o = a.createOscillator(), g = a.createGain(); o.frequency.value = 880; g.gain.setValueAtTime(0.08, a.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.35); o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + 0.36); } catch (e) { } }

  /* ---------- app install + phone notifications ---------- */
  var installEv = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); installEv = e; var b = document.getElementById('inst'); if (b) b.hidden = false; });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/hq-sw.js', { scope: '/admin' }).catch(function () { });
  if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', function (ev) { var d = ev.data || {}; if (d.type === 'hq-go' && d.url) { var h = d.url.split('#')[1]; if (h) { if (location.hash === '#' + h) route(); else location.hash = h; } else location.hash = 'overview'; } });
  function standalone() { return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone; }
  function isIOS() { return /iphone|ipad|ipod/i.test(navigator.userAgent); }
  function b64u(s) { var p = '='.repeat((4 - s.length % 4) % 4), b = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')), a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }
  /* Needs attention: long-press (phone) or right-click (computer) an item to remove it; Undo puts it back */
  function attnSet(k, off) {
    S.attnOff = S.attnOff || {}; if (off) S.attnOff[k] = Date.now(); else delete S.attnOff[k];
    if (S.view === 'overview') route(true);
    return api('/api/hq?route=attn-set', { key: k, off: !!off }).then(function (r) { S.attnOff = r.off || S.attnOff; }, function (e) { toast(e.message || 'Couldn’t save that.', 'err'); if (off) delete S.attnOff[k]; else S.attnOff[k] = Date.now(); if (S.view === 'overview') route(true); });
  }
  function attnMenu(li, x, y) {
    document.querySelectorAll('.attn-menu').forEach(function (m) { m.remove(); });
    var k = li.getAttribute('data-k'), m = document.createElement('div'); m.className = 'attn-menu'; m.setAttribute('role', 'menu');
    m.innerHTML = '<button type="button" role="menuitem" data-rm>Remove from Needs attention</button><button type="button" role="menuitem" data-cn>Cancel</button>';
    document.body.appendChild(m);
    var r = m.getBoundingClientRect(); m.style.left = Math.max(8, Math.min(x, innerWidth - r.width - 8)) + 'px'; m.style.top = Math.max(8, Math.min(y, innerHeight - r.height - 8)) + 'px';
    li.classList.add('is-held');
    var done = function () { m.remove(); li.classList.remove('is-held'); document.removeEventListener('pointerdown', away, true); };
    var away = function (e) { if (!m.contains(e.target)) done(); };
    setTimeout(function () { document.addEventListener('pointerdown', away, true); }, 0);
    m.querySelector('[data-cn]').onclick = done;
    m.querySelector('[data-rm]').onclick = function () {
      done(); attnSet(k, true);
      var n = window.CielNote ? CielNote('Removed from Needs attention', { kind: 'ok', ms: 6000 }) : null;
      if (n && n.querySelector) { var u = document.createElement('button'); u.type = 'button'; u.className = 'cnote__undo'; u.textContent = 'Undo'; u.onclick = function () { attnSet(k, false); n.remove(); }; n.insertBefore(u, n.querySelector('.cnote__x')); } else toast('Removed from Needs attention');
    };
    m.querySelector('[data-rm]').focus();
  }
  function attnWire() {
    var ul = document.getElementById('attn'); if (!ul) return;
    var more = document.getElementById('attnMore'); if (more) more.onclick = function () { ul.querySelectorAll('.is-more').forEach(function (x) { x.hidden = false; }); more.parentNode.remove(); };
    var t = null, sx = 0, sy = 0, fired = false;
    ul.addEventListener('contextmenu', function (e) { var li = e.target.closest('li[data-k]'); if (!li) return; e.preventDefault(); attnMenu(li, e.clientX, e.clientY); });
    ul.addEventListener('pointerdown', function (e) {
      var li = e.target.closest('li[data-k]'); if (!li || e.pointerType === 'mouse') return;
      fired = false; sx = e.clientX; sy = e.clientY; clearTimeout(t);
      t = setTimeout(function () { fired = true; if (navigator.vibrate) navigator.vibrate(15); attnMenu(li, sx, sy); }, 550);
    });
    ul.addEventListener('pointermove', function (e) { if (t && (Math.abs(e.clientX - sx) > 10 || Math.abs(e.clientY - sy) > 10)) { clearTimeout(t); t = null; } });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) { ul.addEventListener(ev, function () { clearTimeout(t); t = null; }); });
    ul.addEventListener('click', function (e) { if (fired) { e.preventDefault(); e.stopPropagation(); fired = false; } }, true);
  }
  /* on Overview: new website leads sit at the very top until opened or moved on in Leads */
  function leadStrip() {
    var host = document.getElementById('body'); if (!host) return;
    var L = S.inbox.filter(function (m) { return m.kind !== 'whatsapp' && (m.stage || (m.status === 'new' ? 'new' : '')) === 'new' && !(S.attnOff || {})['lead:' + m.id]; }).sort(function (a, c) { return c.createdAt - a.createdAt; });
    if (!L.length) return;
    var since = function (t) { var mn = Math.round((Date.now() - t) / 6e4); return mn < 60 ? Math.max(1, mn) + ' min' : mn < 1440 ? Math.round(mn / 60) + ' h' : Math.round(mn / 1440) + ' day' + (mn < 2880 ? '' : 's'); };
    var seen = ''; try { seen = localStorage.getItem('ca_leadsX') || ''; } catch (e) { }
    if (seen && L.every(function (m) { return seen.indexOf(m.id) >= 0; })) return;
    var d = document.createElement('div'); d.className = 'ov-leads';
    d.innerHTML = '<b class="ov-leads__h">' + (L.length === 1 ? 'New lead waiting' : L.length + ' new leads waiting') + '</b>' + L.slice(0, 3).map(function (m) { var c = m.customer || {}; return '<a class="ov-leads__i" href="#leads/' + esc(m.id) + '"><span><b>' + esc(c.name || c.email || 'Visitor') + '</b><small>' + (m.kind === 'brief' ? 'Project brief' : 'Enquiry') + ' · waiting ' + since(m.createdAt) + '</small></span><span class="b b--p b--sm">Open</span></a>'; }).join('') + (L.length > 3 ? '<a class="ov-leads__all" href="#leads">See all ' + L.length + '</a>' : '');
    d.insertAdjacentHTML('afterbegin', '<button class="ov-x" type="button" aria-label="Hide" title="Hide until the next new lead">' + I.x + '</button>');
    d.querySelector('.ov-x').onclick = function () { try { localStorage.setItem('ca_leadsX', L.map(function (m) { return m.id; }).join(',')); } catch (e) { } d.remove(); };
    var hero = host.querySelector('.ov4h'); if (hero) hero.after(d); else host.insertBefore(d, host.firstChild);
  }
  /* on Overview: say plainly when this phone or computer won't get alerts for new leads and orders */
  /* after a theme change: the browser bar colour and anything drawn with theme colours (charts) */
  function themeMode() { var t = null; try { t = localStorage.getItem('ca_theme'); } catch (e) { } return t === 'dark' || t === 'system' ? t : 'light'; }
  function setTheme(m) {
    try { localStorage.setItem('ca_theme', m); } catch (e) { }
    var d = m === 'dark' || (m === 'system' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
    if (d) document.documentElement.setAttribute('data-theme', 'dark'); else document.documentElement.removeAttribute('data-theme');
    if (window.__paintTh) window.__paintTh(); themeChanged();
  }
  function themeSwitch() { return '<div class="tm3" role="radiogroup" aria-label="Theme">' + [['light', I.sun, 'Light'], ['dark', I.moon, 'Dark'], ['system', I.monitor, 'Device']].map(function (x) { return '<button type="button" role="radio" data-tm="' + x[0] + '" title="' + x[2] + (x[0] === 'system' ? ': match this phone or computer' : '') + '" aria-label="' + x[2] + '">' + x[1] + '</button>'; }).join('') + '</div>'; }
  function themeChanged() {
    var dk = document.documentElement.getAttribute('data-theme') === 'dark', m = document.querySelector('meta[name=theme-color]');
    if (m) m.setAttribute('content', innerWidth <= 900 ? (dk ? '#0a0e18' : '#0f1729') : (dk ? '#0b0f19' : '#f1f3f8'));
    document.querySelectorAll('iframe.hq-embed').forEach(function (f) { try { var r = f.contentDocument.documentElement; if (dk) r.setAttribute('data-theme', 'dark'); else r.removeAttribute('data-theme'); } catch (e) { } });
    if (window.HQ && S.view === 'overview') route(true);
    if (window.HQ && S.view === 'instagram') { var ig = document.querySelector('body'); ig.classList.toggle('ig-dark', dk); }
  }
  function paintTheme() { if (window.__paintTh) window.__paintTh(); themeChanged(); }
  function pushNudge() {
    pushState().then(function (st) {
      if (st === 'on' || S.view !== 'overview' || document.getElementById('ovPush')) return;
      try { var hid = JSON.parse(localStorage.getItem('ca_pushX') || 'null'); if (hid && hid.st === st && Date.now() - hid.at < 14 * 864e5) return; } catch (e) { }
      var host = document.getElementById('body'); if (!host) return;
      var msg = st === 'denied' ? 'Notifications are blocked for cielafrica.com on this device, so new leads and orders won’t alert you. Allow them in the browser or phone settings.' : st === 'ios' ? 'To get alerts for new leads on iPhone, add Ciel Admin to the Home Screen (Share → Add to Home Screen), then open it from there.' : st === 'none' ? 'This browser can’t show alerts. Open Ciel Admin in Chrome or the installed app to be alerted about new leads.' : 'Alerts for new leads and orders are off on this device.';
      var d = document.createElement('div'); d.className = 'ov-push'; d.id = 'ovPush';
      d.innerHTML = '<span>' + esc(msg) + '</span>' + (st === 'off' ? '<button class="b b--p b--sm">Turn on alerts</button>' : st === 'denied' ? '<button class="b b--p b--sm" data-help>Show me how</button>' : '');
      d.insertAdjacentHTML('beforeend', '<button class="ov-x" type="button" aria-label="Hide" title="Hide for two weeks">' + I.x + '</button>');
      d.querySelector('.ov-x').onclick = function () { try { localStorage.setItem('ca_pushX', JSON.stringify({ st: st, at: Date.now() })); } catch (e) { } d.remove(); };
      var after = host.querySelector('.ov-leads') || host.querySelector('.ov4h'); if (after) after.after(d); else host.insertBefore(d, host.firstChild);
      var hb = d.querySelector('[data-help]'); if (hb) { hb.onclick = function () { pushHelp('denied'); }; }
      var bt = d.querySelector('button:not([data-help]):not(.ov-x)'); if (bt) bt.onclick = function () { enablePush().then(function () { pushState().then(function (x) { if (x === 'on') d.remove(); }); }); };
    }, function () { });
  }
  function pushState() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return Promise.resolve(isIOS() && !standalone() ? 'ios' : 'none');
    if (Notification.permission === 'denied') return Promise.resolve('denied');
    return navigator.serviceWorker.ready.then(function (r) { return r.pushManager.getSubscription(); }).then(function (sub) { S.pushOn = !!sub; return sub ? 'on' : 'off'; });
  }
  function enablePush() {
    if (isIOS() && !standalone()) { toast('On iPhone: tap Share → Add to Home Screen, open Ciel Admin from there, then turn notifications on.'); return Promise.resolve(); }
    if (!('PushManager' in window)) { toast('This browser can’t receive notifications.'); return Promise.resolve(); }
    S.wantPush = true;
    if (Notification.permission === 'denied') { pushHelp('denied'); return Promise.resolve(); }
    return Notification.requestPermission().then(function (perm) {
      if (perm !== 'granted') { pushHelp(perm); var e0 = new Error(''); e0.quiet = true; throw e0; }
      return Promise.all([api('/api/hq?route=push-key'), navigator.serviceWorker.ready]);
    }).then(function (x) {
      return x[1].pushManager.getSubscription().then(function (old) { return old || x[1].pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64u(x[0].key) }); });
    }).then(function (sub) {
      return api('/api/hq?route=push-sub', { sub: sub.toJSON(), label: (isIOS() ? 'iPhone' : /android/i.test(navigator.userAgent) ? 'Android' : 'Computer') + ' · ' + new Date().toLocaleDateString('en-KE') });
    }).then(function () { S.pushOn = true; return api('/api/hq?route=push-test', {}); }).then(function () { S.wantPush = false; toast('Alerts are on. A test one is on its way.'); }, function (e) { if (!e.quiet) toast(e.message || 'Couldn’t turn alerts on.'); });
  }
  /* when the browser or the computer blocks alerts: the exact steps for this browser and system, and Ciel Admin
     finishes turning them on by itself as soon as they are allowed */
  function browserName() { var u = navigator.userAgent; return /Edg\//.test(u) ? 'Edge' : /OPR\//.test(u) ? 'Opera' : /Firefox\//.test(u) ? 'Firefox' : /Chrome\//.test(u) ? 'Chrome' : /Safari\//.test(u) ? 'Safari' : 'your browser'; }
  function pushHelp(st) {
    var br = browserName(), win = /Windows/.test(navigator.userAgent), mac = /Macintosh/.test(navigator.userAgent) && !isIOS(), and = /android/i.test(navigator.userAgent);
    var site = br === 'Firefox' ? 'Click the icon just left of the address (cielafrica.com) → find <b>Send notifications</b> → remove the block (×), then press Turn on again.'
      : br === 'Safari' ? 'Safari menu → <b>Settings → Websites → Notifications</b> → set cielafrica.com to <b>Allow</b>.'
      : and ? 'Tap ⋮ → <b>Settings → Site settings → Notifications</b> → cielafrica.com → <b>Allow</b>. If you use the installed app: long-press its icon → App info → Notifications → on.'
      : 'Click the icon just left of the address (cielafrica.com) → <b>Site settings</b> → <b>Notifications</b> → choose <b>Allow</b>. If you see a bell with a line through it in the address bar, click it and choose <b>Allow</b>.';
    var sys = win ? 'Windows: Start → <b>Settings → System → Notifications</b> → turn on <b>' + (br === 'Edge' ? 'Microsoft Edge' : br === 'Firefox' ? 'Firefox' : 'Google Chrome') + '</b>. Click it and turn on <b>Show notification banners</b>, then set <b>Priority</b> to <b>Top</b>. Turn off <b>Do not disturb</b> (or Focus) while you work.'
      : mac ? 'Mac: Apple menu → <b>System Settings → Notifications</b> → <b>' + (br === 'Safari' ? 'Safari' : br === 'Edge' ? 'Microsoft Edge' : br === 'Firefox' ? 'Firefox' : 'Google Chrome') + '</b> → allow notifications and choose <b>Alerts</b>, so they stay until you close them. Check that Focus is off.'
      : and ? 'Android: long-press a Ciel Admin alert → Settings → set it to <b>Alerting</b> with <b>Pop on screen</b> on.' : '';
    var m = modal('<div class="ph"><div class="row" style="justify-content:space-between"><h2>Allow alerts on this ' + (and || isIOS() ? 'phone' : 'computer') + '</h2><button class="b b--sm b--ghost" data-x>' + I.x + '</button></div>' +
      '<p class="muted">' + (st === 'default' ? esc(br) + ' hid the permission request, so nothing was turned on.' : esc(br) + ' is set to block notifications from cielafrica.com. Only you can change that, in two places:') + '</p>' +
      '<ol class="ph__s"><li><b>Allow cielafrica.com in ' + esc(br) + '.</b><span>' + site + '</span></li>' + (sys ? '<li><b>Let ' + esc(br) + ' show alerts on your ' + (and ? 'phone' : 'computer') + '.</b><span>' + sys + '</span></li>' : '') + '</ol>' +
      '<p class="ph__w" id="phW">Waiting for you to allow it… this finishes by itself.</p><div class="row"><button class="b b--p" id="phT">Try again</button><button class="b b--ghost" data-x>Close</button></div></div>');
    m.querySelector('#phT').onclick = function () { m.remove(); enablePush(); };
    watchPerm(function () { if (document.body.contains(m)) { m.querySelector('#phW').textContent = 'Allowed. Finishing…'; setTimeout(function () { m.remove(); }, 600); } });
    return m;
  }
  var permWatch = false;
  function watchPerm(cb) {
    try { navigator.permissions.query({ name: 'notifications' }).then(function (ps) { ps.onchange = function () { if (ps.state === 'granted') { if (cb) cb(); enablePush(); } }; }, function () { }); } catch (e) { }
    if (permWatch) return; permWatch = true;
    /* some browsers don't report the change: check again whenever Ciel Admin comes back to the front */
    window.addEventListener('focus', function () { if ('Notification' in window && Notification.permission === 'granted' && !S.pushOn) pushState().then(function (x) { if (x === 'off' && S.wantPush) enablePush(); }); });
  }
  function disablePush() {
    return navigator.serviceWorker.ready.then(function (r) { return r.pushManager.getSubscription(); }).then(function (sub) { if (!sub) return; return api('/api/hq?route=push-sub', { op: 'remove', endpoint: sub.endpoint }).then(function () { return sub.unsubscribe(); }); }).then(function () { S.pushOn = false; toast('Notifications off on this device'); });
  }
  function install() {
    if (installEv) { installEv.prompt(); installEv.userChoice.then(function () { installEv = null; var b = document.getElementById('inst'); if (b) b.hidden = true; }); return; }
    toast(isIOS() ? 'On iPhone: tap Share → Add to Home Screen.' : 'Use your browser menu → Install app (or Add to Home screen).');
  }

  /* ---------- in-app windows (no new tabs: everything stays inside Ciel Admin) ---------- */
  function frame(title, url) {
    var d = document.createElement('div'); d.className = 'hq-frame';
    d.innerHTML = '<div class="hq-frame__h"><button class="b b--sm" data-x>' + I.l + '<span>Back</span></button><b>' + esc(title) + '</b><button class="b b--sm b--ghost" data-rl title="Reload">' + I.ref + '</button></div><iframe src="' + esc(url) + '" title="' + esc(title) + '"></iframe>';
    document.body.appendChild(d);
    d.querySelector('[data-x]').onclick = function () { d.remove(); refresh(false, true); };
    d.querySelector('[data-rl]').onclick = function () { var f = d.querySelector('iframe'); f.src = f.src; };
    return d;
  }
  /* Back: the page you came from inside Ciel Admin; otherwise up a level (a lead → Leads), then Overview */
  function goBack() {
    if (document.querySelector('.drawer,.modal')) { document.querySelectorAll('.drawer,.modal').forEach(function (x) { x.remove(); }); return; }
    var h = (location.hash || '#overview').slice(1).split('/');
    if (S.hops > 0) { S.hops -= 2; history.back(); return; }
    location.hash = h.length > 1 ? h[0] : 'overview';
  }
  function route(keep) {
    var sy = window.scrollY;
    var h = (location.hash || '#overview').slice(1).split('/'), v = h[0];
    if (!NAV.some(function (n) { return n[0] === v; })) v = 'overview';
    if (!can(v)) { var first = NAV.filter(function (n) { return can(n[0]); })[0]; if (!first) { body('<div class="card noacc"><h2>No sections yet</h2><p class="muted">Your account is ready, but nothing has been turned on for you yet. Ask Lorna to give you access.</p></div>'); document.getElementById('ttl').innerHTML = '<span class="hq-ttl">Welcome</span>'; navs(); return; } v = first[0]; if (location.hash.slice(1).split('/')[0] !== v) { history.replaceState(null, '', '#' + v); } h = [v]; }
    document.querySelectorAll('.drawer,.modal').forEach(function (x) { x.remove(); });
    S.view = v; navs(); root.classList.toggle('is-ov', v === 'overview'); root.classList.toggle('is-ig', v === 'instagram');
    var titles = { overview: 'Good ' + (new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening') + ', ' + firstName(), orders: 'Orders', calendar: 'Calendar', tasks: 'Tasks', customers: 'Customers', website: 'Website', settings: 'Setup', inbox: 'Inbox', content: 'Content library', policies: 'Policies', activity: 'Activity log', payments: 'Payments', products: 'Products', templates: 'Website templates', photobooks: 'Photo Books', leads: 'Leads', projects: 'Projects', analytics: 'Analytics', reports: 'Reports & exports', campaigns: 'Email campaigns', invoices: 'Invoices & receipts', reviews: 'Reviews', instagram: 'Instagram', team: 'Team & access' };
    document.getElementById('ttl').innerHTML = (v === 'overview' ? '' : '<button class="hq-back" id="hqBack" type="button" aria-label="Back" title="Back">‹</button>') + '<span class="hq-ttl">' + esc(titles[v]) + '</span><small>' + new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + '</small>';
    document.getElementById('topx').innerHTML = v === 'calendar' ? '<button class="b b--p b--sm" data-newev>' + I.plus + '<span>Event</span></button>' : v === 'tasks' ? '<button class="b b--p b--sm" data-newtk>' + I.plus + '<span>Task</span></button>' : '';
    var bk = document.getElementById('hqBack'); if (bk) bk.onclick = goBack;
    var tb = document.querySelector('[data-newev]'); if (tb) tb.onclick = function () { eventModal({ date: today() }); };
    var tt = document.querySelector('[data-newtk]'); if (tt) tt.onclick = function () { taskModal({ status: 'todo' }); };
    if (v === 'website') { if (window.HQSite) HQSite.render(h[1] || 'home'); }
    else if (v === 'policies') { if (window.HQLegal) HQLegal.render(h[1]); }
    else if (v === 'products' || v === 'templates') { if (window.HQSite) HQSite.renderCatalog(v); }
    else if (v === 'leads' && window.HQCrm) { HQCrm.leads(); if (h[1]) HQCrm.open(h[1]); }
    else if (v === 'projects' && window.HQCrm) HQCrm.projects(h[1]);
    else if (v === 'customers' && window.HQCrm) HQCrm.customers();
    else if (v === 'analytics' && window.HQAnalytics) HQAnalytics.render();
    else if (v === 'reports' && window.HQGrow) HQGrow.reports();
    else if (v === 'campaigns' && window.HQGrow) HQGrow.campaigns(h[1]);
    else if (v === 'reviews' && window.HQGrow) HQGrow.reviews();
    else if (v === 'instagram' && window.HQIg) HQIg.render(h[1], h.slice(2).join('/'));
    else if (v === 'team') teamPage();
    else if (v === 'tasks') tasks(h[1]);
    else if (v === 'invoices' && window.HQMoney) { HQMoney.invoices(); if (h[1] === 'new') HQMoney.editInvoice(null, 'invoice'); }
    else if (v === 'photobooks' && h[1] === 'prices' && window.HQSite) HQSite.renderCatalog('photobooks');
    else if (v === 'photobooks') photobooks();
    else ({ overview: overview, orders: orders, inbox: inbox, calendar: calendar, tasks: tasks, customers: customers, content: content, activity: activity, payments: payments, settings: settings })[v]();
    if (v === 'overview') { attnWire(); leadStrip(); pushNudge(); }
    if (v === 'orders' && h[1]) { var o = S.orders.filter(function (x) { return x.ref === h[1]; })[0]; if (o) orderDrawer(o); }
    if (v === 'inbox' && h[1]) { S.itab = 'web'; inbox(); var m = S.inbox.filter(function (x) { return x.id === h[1]; })[0]; if (m) msgDrawer(m); }
    window.scrollTo(0, keep === true ? sy : 0);
  }
  function counts() {
    return { leads: S.inbox.filter(function (m) { return m.kind !== 'whatsapp' && (m.stage || (m.status === 'new' ? 'new' : '')) === 'new'; }).length, inbox: S.inbox.filter(function (m) { return m.kind !== 'whatsapp' && m.status === 'new'; }).length + (window.HQMail ? HQMail.unseen() : 0), orders: S.orders.filter(function (o) { return (o.paid || o.kind === 'whatsapp') && !CLOSED.test(o.status); }).length, tasks: S.tasks.filter(function (t) { return t.status !== 'done'; }).length, calendar: S.events.filter(function (e) { return e.date === today(); }).length };
  }
  function navs() {
    var c = counts();
    var lastH = null;
    document.getElementById('nav').innerHTML = NAV.filter(function (n) { return can(n[0]); }).map(function (n) { var h = n[3] || null; if (!h) { for (var k = NAV.indexOf(n); k >= 0 && !h; k--) h = NAV[k][3] || null; } var show = h && h !== lastH; lastH = h; return (show ? '<div class="hq-nav__h">' + h + '</div>' : '') + '<a href="#' + n[0] + '" class="nv--' + n[4] + (S.view === n[0] ? ' is-on' : '') + '" title="' + n[1] + '"><b class="nv-i">' + n[2] + '</b><span>' + n[1] + '</span>' + (c[n[0]] ? '<i' + (n[0] === 'leads' ? ' class="is-hot"' : '') + '>' + (c[n[0]] > 99 ? '99+' : c[n[0]]) + '</i>' : '') + '</a>'; }).join('');
    /* the number on the app icon: new leads + paid orders to handle + new website messages (not the email inbox, whose
       old unread emails made it run into the thousands) */
    try { var nb = (c.leads || 0) + (c.orders || 0) + S.inbox.filter(function (m) { return m.kind !== 'whatsapp' && m.kind !== 'brief' && m.status === 'new'; }).length; nb = Math.min(nb, 99); if (navigator.setAppBadge) { if (nb) navigator.setAppBadge(nb).catch(function () { }); else navigator.clearAppBadge().catch(function () { }); } } catch (e) { }
    document.getElementById('mnav').innerHTML = ['overview', 'leads', 'orders', 'inbox'].map(function (id) { var n = NAV.filter(function (x) { return x[0] === id; })[0]; return '<a href="#' + n[0] + '" class="' + (S.view === n[0] ? 'is-on' : '') + '">' + n[2] + '<span>' + (id === 'overview' ? 'Home' : n[1]) + '</span>' + (c[n[0]] ? '<i>' + (c[n[0]] > 99 ? '99+' : c[n[0]]) + '</i>' : '') + '</a>'; }).join('') +
      '<button type="button" class="' + (['overview', 'leads', 'orders', 'inbox'].indexOf(S.view) < 0 ? 'is-on' : '') + '" id="mnMore">' + I.grid + '<span>Menu</span></button>';
    var mm = document.getElementById('mnMore'); if (mm) mm.onclick = function () { root.classList.add('nav-open'); document.body.style.overflow = 'hidden'; };
  }
  function body(h) { document.getElementById('body').innerHTML = h; return document.getElementById('body'); }

  /* ---------- overview ---------- */
  function overview() {
    var now = new Date(), m0 = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    var real = S.orders.filter(function (o) { return o.paid && !o.test && !/cancel|refund/.test(o.status); });
    var month = real.filter(function (o) { return o.at >= m0; }), rev = month.reduce(function (s, o) { return s + (o.total || 0); }, 0);
    var todo = S.orders.filter(function (o) { return (o.paid || o.status === 'awaiting_confirmation' || o.status === 'whatsapp_request') && !CLOSED.test(o.status) && o.kind !== 'whatsapp'; });
    var pending = S.orders.filter(function (o) { return (o.kind === 'whatsapp' && !CLOSED.test(o.status) && o.status !== 'paid') || (o.kind !== 'whatsapp' && !o.paid && /await|pending_payment|payment_failed/.test(o.status) && Date.now() - o.at < 14 * 864e5); });
    var newMsgs = S.inbox.filter(function (m) { return m.kind !== 'whatsapp' && m.status === 'new'; });
    var open = S.tasks.filter(function (t) { return t.status !== 'done'; }), overdue = open.filter(function (t) { return t.due && t.due < today(); });
    var up = S.events.filter(function (e) { return (e.end || e.date) >= today(); }).sort(function (a, b) { return (a.date + (a.start || '')).localeCompare(b.date + (b.start || '')); });
    var week = up.filter(function (e) { return e.date <= iso(new Date(Date.now() + 6 * 864e5)); });
    /* revenue: the last 30 days, the last 12 months, and where it came from (last 90 days) */
    var days = []; for (var i = 29; i >= 0; i--) { var d = new Date(Date.now() - i * 864e5); days.push({ k: iso(d), v: 0, d: d }); }
    var months = []; for (var mi = 11; mi >= 0; mi--) { var md = new Date(now.getFullYear(), now.getMonth() - mi, 1); months.push({ y: md.getFullYear(), m: md.getMonth(), v: 0, d: md }); }
    var src = {}, t90 = Date.now() - 90 * 864e5;
    real.forEach(function (o) {
      var k = iso(new Date(o.at)), x = days.filter(function (y) { return y.k === k; })[0]; if (x) x.v += o.total || 0;
      var od = new Date(o.at), mo = months.filter(function (y) { return y.y === od.getFullYear() && y.m === od.getMonth(); })[0]; if (mo) mo.v += o.total || 0;
      if (o.at >= t90) src[o.kind] = (src[o.kind] || 0) + (o.total || 0);
    });
    var attention = [];
    S.orders.forEach(function (o) {
      var tg = o.test ? 'TEST · ' : '';
      if (o.paid && !CLOSED.test(o.status) && Date.now() - o.at < 2 * 864e5 && !(o.kind === 'photobook' && o.status === 'ready')) attention.push(['o', tg + 'New ' + KIND[o.kind][0].toLowerCase() + ' order ' + o.ref + ' · ' + money(o.total), (o.customer.name || '') + ' · ' + o.label + ' · ' + dt(o.at), '#orders/' + o.ref]);
      if (o.status === 'whatsapp_request') attention.push(['o', tg + 'WhatsApp order request · ' + o.ref + ' · ' + money(o.total), (o.customer.name || '') + (o.customer.phone ? ' · +' + o.customer.phone : '') + ' · reply on WhatsApp · ' + dt(o.at), '#orders/' + o.ref]);
      if (o.status === 'awaiting_confirmation') attention.push(['o', tg + 'Paybill payment to confirm · ' + o.ref + ' · ' + money(o.total), (o.customer.name || '') + ' · check M-Pesa, then confirm · ' + dt(o.at), '#orders/' + o.ref]);
      if (o.kind === 'invoice' && o.status === 'overdue') attention.push(['r', 'Invoice ' + o.ref + ' is overdue · ' + money(o.total), (o.customer.name || '') + (o.raw.due ? ' · was due ' + d2(o.raw.due + 'T12:00') : ''), '#orders/' + o.ref]);
      if (o.kind === 'whatsapp' && o.status === 'pending') attention.push(['g', 'WhatsApp order ' + o.ref + (o.customer.name ? ' · ' + o.customer.name : ''), o.summary.slice(0, 80) || 'Reply on WhatsApp', '#orders/' + o.ref]);
      if (o.test && o.kind === 'photobook' && o.status === 'ready') attention.push(['b', tg + o.ref + ' pages received', 'Test only: don’t print', '#orders/' + o.ref]);
      if (o.test) return;
      if (o.kind === 'photobook' && (o.status === 'paid' || o.status === 'preparing') && Date.now() - o.at > 864e5) attention.push(['y', o.ref + ': paid ' + d2(o.at) + ', pages not received yet', 'Ask ' + (o.customer.name || 'the customer') + ' to open My books → Send now', '#orders/' + o.ref]);
      if (o.kind === 'photobook' && o.status === 'ready') attention.push(['b', o.ref + ' is ready to print', o.summary, '#orders/' + o.ref]);
      if (o.kind === 'shop' && o.status === 'paid') attention.push(['b', o.ref + ': new shop order', o.summary.slice(0, 80), '#orders/' + o.ref]);
      if (o.kind === 'domain' && o.status === 'pending_registration') attention.push(['b', o.ref + ': register ' + (o.raw.domain || ''), 'Paid, waiting for registration', '#orders/' + o.ref]);
    });
    S.inbox.forEach(function (m) { if (m.followUp && m.followUp <= today() && !/completed|declined|archived/.test(m.stage || '')) attention.push(['y', 'Follow up: ' + (m.customer.name || m.customer.email || 'lead'), (m.subject || '').slice(0, 80), '#leads/' + m.id, 'fu:' + m.id + ':' + m.followUp]); });
    /* new website leads go to the top until they are opened or moved on in Leads */
    var since = function (t) { var mn = Math.round((Date.now() - t) / 6e4); return mn < 60 ? Math.max(1, mn) + ' min' : mn < 1440 ? Math.round(mn / 60) + ' h' : Math.round(mn / 1440) + ' day' + (mn < 2880 ? '' : 's'); };
    var lf = function (m) { return (m.fields || []).filter(function (f) { return /service|need|project|budget|message/i.test(f[0]); }).map(function (f) { return String(f[1]).replace(/\s+/g, ' '); }).join(' · ').slice(0, 80); };
    /* every open website enquiry and every active project stays here until it is closed, or removed with a long press / right-click */
    var SL = { reviewing: 'Reviewing', awaiting: 'Awaiting response', discovery: 'Discovery', proposal_prep: 'Preparing proposal', proposal_sent: 'Proposal sent', negotiation: 'Negotiation', approved: 'Approved', in_progress: 'In progress' };
    var lst = function (m) { return m.stage || (m.status === 'new' ? 'new' : m.status === 'done' ? 'archived' : 'reviewing'); };
    var openLeads = S.inbox.filter(function (m) { return m.kind !== 'whatsapp' && !/^(completed|declined|archived)$/.test(lst(m)); }).sort(function (a, c) { return c.createdAt - a.createdAt; });
    var leadAtt = openLeads.map(function (m) {
      var st = lst(m), who = m.customer.name || m.customer.email || 'a visitor';
      return st === 'new' ? ['r', 'New lead · ' + who + (m.kind === 'brief' ? ' · project brief' : ''), 'Waiting ' + since(m.createdAt) + (lf(m) ? ' · ' + lf(m) : ''), '#leads/' + m.id, 'lead:' + m.id]
        : ['o', (m.kind === 'brief' ? 'Project brief · ' : 'Enquiry · ') + who, (SL[st] || 'Open') + ' · since ' + d2(m.createdAt) + (lf(m) ? ' · ' + lf(m) : ''), '#leads/' + m.id, 'lead:' + m.id];
    });
    var projAtt = (S.projects || []).filter(function (p) { return p.status !== 'completed'; }).map(function (p) {
      var late = p.deadline && p.deadline < today(), PS = { planning: 'Planning', in_progress: 'In progress', review: 'Client review', on_hold: 'On hold' };
      return [late ? 'r' : 'b', 'Project · ' + (p.name || 'Untitled'), (PS[p.status] || 'Planning') + (p.client ? ' · ' + p.client : '') + (p.deadline ? (late ? ' · was due ' : ' · due ') + d2(p.deadline + 'T12:00') : ''), '#projects/' + p.id, 'project:' + p.id];
    });
    attention = leadAtt.concat(attention, projAtt);
    overdue.forEach(function (t) { attention.push(['r', 'Overdue: ' + t.title, 'Was due ' + d2(t.due + 'T12:00'), '#tasks']); });
    /* domains to renew in the next 60 days (customers are emailed at 60, 30 and 7 days and on the day) */
    if (S.renewals == null) { S.renewals = []; api('/api/domains?route=admin/renewals').then(function (x) { S.renewals = (x.renewals || []).filter(function (r) { return r.days != null && r.days <= 60; }); if (S.renewals.length && (location.hash || '#overview') === '#overview') overview(); }, function () { }); }
    S.renewals.forEach(function (r) { attention.push([r.days <= 7 ? 'r' : 'o', 'Renew ' + r.domain + (r.days > 0 ? ' · ' + r.days + ' days left' : r.days === 0 ? ' · expires today' : ' · expired ' + (-r.days) + ' days ago'), 'Expires ' + r.expiresAt + (r.estimated ? ' (estimated)' : '') + ' · ' + ((r.customer && (r.customer.name || r.customer.email)) || ''), '#content']); });
    attention.forEach(function (x) { if (!x[4]) x[4] = x[3] + '|' + String(x[1]).replace(/\d+/g, '#'); });
    attention = attention.filter(function (x) { return !(S.attnOff || {})[x[4]]; });
    var hr = now.getHours(), greet = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening', urgent = attention.length;
    var sum = function (l) { return l.reduce(function (s, x) { return s + x.v; }, 0); };
    var prevM = months[10].v, chg = prevM ? Math.round((rev - prevM) / prevM * 100) : null;
    var newLeads = openLeads.filter(function (m) { return lst(m) === 'new'; }), mLeads = S.inbox.filter(function (m) { return m.kind !== 'whatsapp' && m.createdAt >= m0; });
    var dueSoon = open.filter(function (t) { return t.due && t.due <= iso(new Date(Date.now() + 2 * 864e5)); });
    var mname = now.toLocaleDateString('en-KE', { month: 'long' });
    /* the revenue chart: 30 days or 12 months */
    var rv30 = barChart(days.map(function (x, j) { return { v: x.v, t: d2(x.d), l: j % 7 === 1 ? d2(x.d) : j === 29 ? 'Today' : '' }; }));
    var rv12 = barChart(months.map(function (x) { return { v: x.v, t: x.d.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' }), l: x.d.toLocaleDateString('en-KE', { month: 'short' }) }; }));
    /* where the money came from */
    var sk = Object.keys(src).filter(function (k) { return src[k] > 0; }).sort(function (x, y) { return src[y] - src[x]; }), st = sk.reduce(function (s, k) { return s + src[k]; }, 0);
    var donut = donutChart(sk.map(function (k) { return { v: src[k], c: KIND[k][1] }; }), st ? '<b>' + kshort(st) + '</b><span>KES · 90 days</span>' : '<b>0</b><span>no sales yet</span>');
    var srcLeg = sk.length ? '<ul class="lg4">' + sk.map(function (k) { return '<li><i style="background:' + KIND[k][1] + '"></i><span>' + KIND[k][0] + '</span><b>' + money(src[k]) + '</b><em>' + Math.round(src[k] / st * 100) + '%</em></li>'; }).join('') + '</ul>' : '<p class="muted" style="font-size:.82rem">Paid orders and invoices from the last 90 days show here, split by where they came from.</p>';
    /* the lead pipeline */
    var allL = S.inbox.filter(function (m) { return m.kind !== 'whatsapp' && lst(m) !== 'archived'; });
    var PIPE = [['New', /^new$/, 'var(--r)'], ['Talking', /^(reviewing|awaiting|discovery)$/, 'var(--y)'], ['Proposal', /^(proposal_prep|proposal_sent|negotiation)$/, 'var(--p)'], ['Won', /^(approved|in_progress|completed)$/, 'var(--g)'], ['Declined', /^declined$/, 'var(--faint)']].map(function (p) { return [p[0], allL.filter(function (m) { return p[1].test(lst(m)); }).length, p[2]]; });
    var pmx = Math.max.apply(null, PIPE.map(function (p) { return p[1]; }).concat([1])), won = PIPE[3][1], closed = PIPE[3][1] + PIPE[4][1];
    var pipe = '<div class="pp4">' + PIPE.map(function (p) { return '<a class="pp4__r" href="#leads"><span>' + p[0] + '</span><span class="pp4__t"><i style="width:' + (p[1] ? Math.max(4, p[1] / pmx * 100) : 0) + '%;background:' + p[2] + '"></i></span><b>' + p[1] + '</b></a>'; }).join('') + '</div>' +
      '<p class="pp4__f">' + (closed ? '<b>' + Math.round(won / closed * 100) + '%</b> of decided leads won' : 'Win rate shows once leads are won or declined') + ' · ' + mLeads.length + ' new in ' + mname + '</p>';
    /* work in progress: tasks done and active projects */
    var tAll = S.tasks.length, tDone = S.tasks.filter(function (t) { return t.status === 'done'; }).length, tDoing = S.tasks.filter(function (t) { return t.status === 'doing'; }).length;
    var projs = (S.projects || []).filter(function (p) { return p.status !== 'completed'; });
    var work = '<div class="wk4">' + ringChart(tAll ? tDone / tAll : 0, '<b>' + (tAll ? Math.round(tDone / tAll * 100) : 0) + '%</b><span>tasks done</span>') +
      '<ul class="wk4__l"><li><i style="background:var(--g)"></i>Done<b>' + tDone + '</b></li><li><i style="background:var(--o)"></i>In progress<b>' + tDoing + '</b></li><li><i style="background:var(--line)"></i>To do<b>' + (tAll - tDone - tDoing) + '</b></li>' + (overdue.length ? '<li class="is-r"><i style="background:var(--r)"></i>Overdue<b>' + overdue.length + '</b></li>' : '') + '<li><i style="background:var(--k-dom)"></i>Active projects<b>' + projs.length + '</b></li></ul></div>';
    /* orders and enquiries per week (12 weeks, every order placed, paid or not) */
    var wk0 = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7)).getTime(), weeks = [];
    for (var wi = 11; wi >= 0; wi--) weeks.push({ t: wk0 - wi * 7 * 864e5, o: 0, l: 0 });
    var wkOf = function (t) { for (var k = weeks.length - 1; k >= 0; k--) if (t >= weeks[k].t) return t < weeks[k].t + 7 * 864e5 ? weeks[k] : null; return null; };
    S.orders.forEach(function (o) { if (o.test || !o.at) return; var w = wkOf(o.at); if (w) w.o++; });
    S.inbox.forEach(function (m) { if (!m.createdAt) return; var w = wkOf(m.createdAt); if (w) w.l++; });
    var flow = lineChart([{ n: 'Enquiries', c: 'var(--p)', v: weeks.map(function (w) { return w.l; }) }, { n: 'Orders', c: 'var(--k-pb)', v: weeks.map(function (w) { return w.o; }) }], weeks.map(function (w, j) { return j % 3 === 2 || j === 11 ? d2(w.t) : ''; }), weeks.map(function (w) { return 'Week of ' + d2(w.t); }), function (n) { return String(n); });
    /* orders by where they stand */
    var ST = [['To handle', 'var(--o)', 0], ['Awaiting payment', 'var(--y)', 0], ['Completed', 'var(--g)', 0], ['Cancelled or failed', 'var(--r)', 0]];
    S.orders.forEach(function (o) { if (o.test) return; var i = /cancel|refund|fail|unavail/.test(o.status) ? 3 : CLOSED.test(o.status) ? 2 : (o.paid || o.status === 'awaiting_confirmation' || o.status === 'whatsapp_request') ? 0 : 1; ST[i][2]++; });
    var stT = ST.reduce(function (n, x) { return n + x[2]; }, 0);
    var stDonut = donutChart(ST.filter(function (x) { return x[2]; }).map(function (x) { return { v: x[2], c: x[1] }; }), '<b>' + stT + '</b><span>orders</span>') + '<ul class="lg4">' + ST.map(function (x) { return '<li><i style="background:' + x[1] + '"></i><span>' + x[0] + '</span><b>' + x[2] + ' order' + (x[2] === 1 ? '' : 's') + '</b><em>' + (stT ? Math.round(x[2] / stT * 100) : 0) + '%</em></li>'; }).join('') + '</ul>';
    /* what people ask for (the "Looking for" / service answers on enquiries) */
    var ask = {}; S.inbox.forEach(function (m) { if (m.kind === 'whatsapp') return; (m.fields || []).forEach(function (f) { if (/looking|service|need|project type|interested/i.test(f[0])) String(f[1] || '').split(/\s*[,;·]\s*/).forEach(function (x) { x = x.trim(); if (x && x.length < 40) ask[x] = (ask[x] || 0) + 1; }); }); });
    var PAL = ['var(--o)', 'var(--p)', 'var(--k-pb)', 'var(--g)', 'var(--k-inv)', 'var(--r)', 'var(--y)', 'var(--faint)'];
    var ak = Object.keys(ask).sort(function (a, c) { return ask[c] - ask[a]; }), akT = ak.reduce(function (n, k) { return n + ask[k]; }, 0);
    if (ak.length > 7) { var rest = ak.slice(6).reduce(function (n, k) { return n + ask[k]; }, 0); ak = ak.slice(0, 6); ask['Other'] = rest; ak.push('Other'); }
    var askDonut = ak.length ? donutChart(ak.map(function (k, i) { return { v: ask[k], c: PAL[i % PAL.length] }; }), '<b>' + akT + '</b><span>requests</span>') + '<ul class="lg4">' + ak.map(function (k, i) { return '<li><i style="background:' + PAL[i % PAL.length] + '"></i><span>' + esc(k) + '</span><b>' + ask[k] + '</b><em>' + Math.round(ask[k] / akT * 100) + '%</em></li>'; }).join('') + '</ul>' : '<p class="muted" style="font-size:.82rem">The services people pick on the Start a project form show here.</p>';
    var spark = sparkLine(days.slice(-14).map(function (x) { return x.v; }));
    var b = body(
      '<section class="ov4h"><div class="ov4h__in"><div class="ov4h__l"><p class="ov4h__k">' + now.toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long' }) + '</p>' +
      '<h1 class="ov4h__t">' + greet + ', ' + esc(firstName()) + '.</h1>' +
      '<p class="ov4h__s">' + (urgent ? '<b>' + urgent + ' thing' + (urgent === 1 ? '' : 's') + '</b> need' + (urgent === 1 ? 's' : '') + ' you' : 'All clear. Nothing is waiting on you') + (rev ? ' · <b>' + money(rev) + '</b> in ' + mname : '') + '</p></div>' +
      '<div class="ov4h__st"><a href="#leads"><b>' + newLeads.length + '</b><span>new lead' + (newLeads.length === 1 ? '' : 's') + '</span></a><a href="#orders"><b>' + todo.length + '</b><span>order' + (todo.length === 1 ? '' : 's') + ' to handle</span></a><a href="#tasks"><b>' + dueSoon.length + '</b><span>task' + (dueSoon.length === 1 ? '' : 's') + ' due soon</span></a></div></div>' +
      '<div class="ov4h__go"><a class="ov4h__b ov4h__b--p" href="#leads">' + I.target + '<span>Leads' + (newLeads.length ? ' · ' + newLeads.length : '') + '</span></a><a class="ov4h__b" href="#orders">' + I.orders + '<span>Orders</span></a><a class="ov4h__b" href="#inbox">' + I.inbox + '<span>Inbox' + (newMsgs.length ? ' · ' + newMsgs.length : '') + '</span></a><a class="ov4h__b" href="#invoices/new">' + I.receipt + '<span>New invoice</span></a><a class="ov4h__b ovh__b--ig" href="#instagram">' + I.ig + '<span>Instagram</span></a><a class="ov4h__b" href="#reports">' + I.pie + '<span>Reports</span></a></div></section>' +
      '<div class="kpis kp4"><a href="#reports" class="card kpi kp4--blue"><span class="kp4__h"><i class="kpi__i">' + I.card + '</i><span>Revenue · ' + mname + '</span></span><b>' + money(rev) + '</b><small>' + (chg == null ? month.length + ' paid order' + (month.length === 1 ? '' : 's') : '<em class="' + (chg >= 0 ? 'is-up' : 'is-dn') + '">' + (chg >= 0 ? I.up : I.down) + Math.abs(chg) + '%</em> vs last month') + '</small>' + spark + '</a>' +
      '<a href="#orders" class="card kpi kp4--amber"><span class="kp4__h"><i class="kpi__i">' + I.orders + '</i><span>Orders to handle</span></span><b>' + todo.length + '</b><small>' + pending.length + ' waiting on payment or reply</small></a>' +
      '<a href="#leads" class="card kpi kp4--red"><span class="kp4__h"><i class="kpi__i">' + I.target + '</i><span>Open leads</span></span><b>' + openLeads.length + '</b><small>' + newLeads.length + ' new · ' + mLeads.length + ' this month</small></a>' +
      '<a href="#tasks" class="card kpi kp4--green"><span class="kp4__h"><i class="kpi__i">' + I.tasks + '</i><span>Open tasks</span></span><b>' + open.length + '</b><small>' + (overdue.length ? overdue.length + ' overdue · ' : '') + newMsgs.length + ' new message' + (newMsgs.length === 1 ? '' : 's') + '</small></a></div>' +
      '<div class="ov"><div class="ov__main">' +
      '<div class="card ch4" id="ovWeb"><div class="card__h"><div><h2>Website visitors</h2><p class="ch4__v">… <span>last 30 days</span></p></div></div><div class="card__b"><div class="sk" style="height:200px"></div></div></div>' +
      '<div class="card ch4"><div class="card__h"><div><h2>Revenue</h2><p class="ch4__v" id="rvV">' + money(sum(days)) + ' <span>last 30 days</span></p></div><div class="tabs" id="rvT"><button type="button" class="is-on" data-rv="30">30 days</button><button type="button" data-rv="12">12 months</button></div></div><div class="card__b"><div id="rvC">' + rv30 + '</div></div></div>' +
      '<div class="an4"><div class="card ch4"><div class="card__h"><h2>Orders by status</h2><a class="b b--sm" href="#orders">Orders</a></div><div class="card__b dn4">' + stDonut + '</div></div>' +
      '<div class="card ch4"><div class="card__h"><h2>Where sales come from</h2></div><div class="card__b dn4">' + donut + srcLeg + '</div></div></div>' +
      '<div class="an4"><div class="card ch4"><div class="card__h"><div><h2>Enquiries & orders</h2><p class="ch4__s">per week, last 12 weeks</p></div><span class="lc4__lg"><span><i style="background:var(--p)"></i>Enquiries</span><span><i style="background:var(--k-pb)"></i>Orders</span></span></div><div class="card__b">' + flow + '</div></div>' +
      '<div class="card ch4"><div class="card__h"><h2>Lead pipeline</h2><a class="b b--sm" href="#leads">Open</a></div><div class="card__b">' + pipe + '</div></div></div>' +
      '<div class="an4"><div class="card ch4" id="ovDev"><div class="card__h"><h2>Visitors by device</h2></div><div class="card__b"><div class="sk" style="height:140px"></div></div></div>' +
      '<div class="card ch4"><div class="card__h"><h2>What people ask for</h2><a class="b b--sm" href="#leads">Leads</a></div><div class="card__b dn4 dn4--s">' + askDonut + '</div></div></div>' +
      '<div class="card"><div class="card__h"><h2>Recent orders</h2><a class="b b--sm" href="#orders">All orders</a></div>' + orderTable(S.orders.slice(0, 6), true) +
      '<div class="card__h" style="border-top:1px solid var(--line)"><h2>Pending orders</h2><span class="muted" style="font-size:.8rem">WhatsApp and unpaid</span></div>' + orderTable(pending.slice(0, 6), true) + '</div>' +
      '</div><div class="ov__rail">' +
      '<div class="card"><div class="card__h"><h2>Needs attention</h2><span class="chip' + (attention.length ? ' chip--r' : ' chip--g') + '">' + attention.length + '</span></div><ul class="list" id="attn">' + (attention.length ? attention.map(function (a, i) { return '<li data-k="' + esc(a[4]) + '"' + (i >= 8 ? ' class="is-more" hidden' : '') + '><span class="dot" style="background:var(--' + a[0] + ')"></span><div><b>' + esc(a[1]) + '</b><small>' + esc(a[2]) + '</small></div><a class="b b--sm" href="' + a[3] + '">Open</a></li>'; }).join('') + (attention.length > 8 ? '<li class="attn-more"><button class="b b--sm" type="button" id="attnMore">Show all ' + attention.length + '</button></li>' : '') : '<li class="empty">All clear. Nothing waiting on you.</li>') + '</ul>' + (attention.length ? '<p class="attn-tip">Long-press or right-click an item to remove it.</p>' : '') + '</div>' +
      '<div class="card ch4" id="ovPg"><div class="card__h"><h2>Most visited pages</h2><a class="b b--sm" href="#analytics">Analytics</a></div><div class="card__b"><div class="sk" style="height:140px"></div></div></div>' +
      '<div class="card ch4"><div class="card__h"><h2>Work in progress</h2><a class="b b--sm" href="#projects">Projects</a></div><div class="card__b">' + work + '</div></div>' +
      '<div class="card"><div class="card__h"><h2>Coming up</h2><a class="b b--sm" href="#calendar">Calendar</a></div><ul class="list">' + (up.length ? up.slice(0, 6).map(evRow).join('') : '<li class="empty">No upcoming events. <a href="#calendar">Plan one</a>.</li>') + '</ul>' +
      '<div class="card__h" style="border-top:1px solid var(--line)"><h2>Tasks due soon</h2><a class="b b--sm" href="#tasks">Board</a></div><ul class="list">' + (open.length ? open.slice().sort(function (a, c) { return (a.due || '9').localeCompare(c.due || '9'); }).slice(0, 5).map(function (t) { return '<li><span class="dot" style="background:' + ({ high: 'var(--r)', med: 'var(--y)', low: 'var(--g)' }[t.priority] || 'var(--faint)') + '"></span><div><b>' + esc(t.title) + '</b><small>' + (t.due ? 'Due ' + d2(t.due + 'T12:00') : 'No due date') + (t.status === 'doing' ? ' · in progress' : '') + '</small></div></li>'; }).join('') : '<li class="empty">No open tasks.</li>') + '</ul></div></div></div>'
    );
    b.querySelectorAll('[data-rv]').forEach(function (x) { x.onclick = function () { var y = x.getAttribute('data-rv') === '12'; b.querySelectorAll('[data-rv]').forEach(function (z) { z.classList.toggle('is-on', z === x); }); document.getElementById('rvC').innerHTML = y ? rv12 : rv30; document.getElementById('rvV').innerHTML = money(y ? sum(months) : sum(days)) + ' <span>' + (y ? 'last 12 months' : 'last 30 days') + '</span>'; }; });
    bindOrderRows(b);
    webPanels(b);
  }
  /* website visitors (Vercel Web Analytics), kept for 10 minutes */
  function webRows(j) { var l = (j && (j.data || j.rows || j.groups || j.items)) || (Array.isArray(j) ? j : []); return l.map(function (x) { var label = '', v = 0, vis = 0; Object.keys(x).forEach(function (k) { var val = x[k]; if (typeof val === 'string' && !label) label = val; if (typeof val === 'number') { if (/visitor/i.test(k)) vis = val; else if (/view|total|count|value/i.test(k) || !v) v = val; } }); return { label: label, views: v, visitors: vis }; }); }
  function webPanels(b) {
    var W = document.getElementById('ovWeb'), D = document.getElementById('ovDev'), P = document.getElementById('ovPg');
    if (!can('analytics') && !can('overview')) { [W, D, P].forEach(function (x) { if (x) x.remove(); }); return; }
    var draw = function (w) {
      if (!W || !W.isConnected) return;
      if (!w || !w.configured) { W.querySelector('.card__b').innerHTML = '<p class="muted" style="font-size:.84rem">Visitor numbers appear here once Vercel Web Analytics is on (see Analytics).</p>'; if (D) D.remove(); if (P) P.remove(); return; }
      var day = webRows(w.day).filter(function (x) { return x.label; });
      var map = {}; day.forEach(function (x) { map[x.label.slice(0, 10)] = x; });
      var pts = []; for (var i = 29; i >= 0; i--) { var dd = new Date(Date.now() - i * 864e5), k = iso(dd), x = map[k] || { views: 0, visitors: 0 }; pts.push({ d: dd, v: x.views, u: x.visitors }); }
      var tv = pts.reduce(function (n, x) { return n + x.v; }, 0), tu = pts.reduce(function (n, x) { return n + x.u; }, 0), hasU = tu > 0;
      var ser = [{ n: 'Page views', c: 'var(--o)', v: pts.map(function (x) { return x.v; }) }]; if (hasU) ser.push({ n: 'Visitors', c: 'var(--g)', v: pts.map(function (x) { return x.u; }) });
      /* one clear picture: daily visitors as bars, with the headline numbers beside them */
      var key = hasU ? 'u' : 'v', top4 = webRows(w.countries).filter(function (x) { return x.label; })[0];
      var devs = webRows(w.devices).filter(function (x) { return x.label; }), dvT = devs.reduce(function (n, x) { return n + x.views; }, 0), ph = devs.filter(function (x) { return /mobile/i.test(x.label); })[0];
      var best = pts.reduce(function (m, x) { return x[key] > m[key] ? x : m; }, pts[0]);
      var stat = function (v, l, c) { return '<div class="wv4__s" style="--sc:' + c + '"><b>' + v + '</b><span>' + l + '</span></div>'; };
      W.innerHTML = '<div class="card__h"><div><h2>Website visitors</h2><p class="ch4__s">cielafrica.com · last 30 days</p></div><a class="b b--sm" href="#analytics">Analytics</a></div><div class="card__b wv4">' +
        '<div class="wv4__k">' + stat((hasU ? tu : tv).toLocaleString('en-KE'), hasU ? 'visitors' : 'page views', 'var(--o)') + (hasU ? stat(tv.toLocaleString('en-KE'), 'page views', 'var(--p)') : stat(Math.round(tv / 30).toLocaleString('en-KE'), 'a day on average', 'var(--p)')) + (hasU ? stat((tv / Math.max(1, tu)).toFixed(1), 'pages per visit', 'var(--k-inv)') : top4 ? stat(esc(top4.label), 'top country', 'var(--k-inv)') : '') + (ph && dvT ? stat(Math.round(ph.views / dvT * 100) + '%', 'on phones', 'var(--k-pb)') : '') + '</div>' +
        '<div class="wv4__c">' + barChart(pts.map(function (x, j) { return { v: x[key], t: d2(x.d), l: j % 7 === 1 ? d2(x.d) : j === 29 ? 'Today' : '' }; }), function (n) { return n.toLocaleString('en-KE') + (hasU ? ' visitors' : ' views'); }) + (best[key] ? '<p class="wv4__f">Busiest day: <b>' + d2(best.d) + '</b> · ' + best[key].toLocaleString('en-KE') + (hasU ? ' visitors' : ' views') + '</p>' : '') + '</div></div>';
      var dev = webRows(w.devices).filter(function (x) { return x.label; }), dT = dev.reduce(function (n, x) { return n + x.views; }, 0), DC = ['var(--o)', 'var(--k-pb)', 'var(--p)', 'var(--g)'];
      var nice = function (l) { l = String(l); return /mobile/i.test(l) ? 'Phones' : /desktop/i.test(l) ? 'Computers' : /tablet/i.test(l) ? 'Tablets' : l.charAt(0).toUpperCase() + l.slice(1); };
      if (D) { var db = D.querySelector('.card__b'); db.className = 'card__b dn4 dn4--s'; db.innerHTML = dT ? donutChart(dev.map(function (x, i) { return { v: x.views, c: DC[i % 4] }; }), '<b>' + kshort(dT) + '</b><span>views</span>') + '<ul class="lg4">' + dev.map(function (x, i) { return '<li><i style="background:' + DC[i % 4] + '"></i><span>' + esc(nice(x.label)) + '</span><b>' + x.views.toLocaleString('en-KE') + ' views</b><em>' + Math.round(x.views / dT * 100) + '%</em></li>'; }).join('') + '</ul>' : '<p class="muted" style="font-size:.82rem">No visits recorded yet.</p>'; }
      var pg = webRows(w.pages).filter(function (x) { return x.label; }).slice(0, 6), pm = Math.max.apply(null, pg.map(function (x) { return x.views; }).concat([1]));
      if (P) P.querySelector('.card__b').innerHTML = pg.length ? '<div class="tp4">' + pg.map(function (x) { return '<div class="tp4__r"><span>' + esc(x.label === '/' ? 'Home' : x.label) + '</span><b>' + x.views.toLocaleString('en-KE') + '</b><i style="width:' + Math.max(3, x.views / pm * 100) + '%"></i></div>'; }).join('') + '</div>' : '<p class="muted" style="font-size:.82rem">No visits recorded yet.</p>';
    };
    if (S.web && Date.now() - S.web.at < 6e5) return draw(S.web.w);
    if (S.web) draw(S.web.w);
    api('/api/hq?route=web-analytics&days=30').then(function (w) { S.web = { at: Date.now(), w: w }; draw(w); }, function (e) { if (!W || !W.isConnected) return; W.querySelector('.card__b').innerHTML = '<p class="muted" style="font-size:.84rem">' + esc(e.message) + '</p>'; if (D) D.remove(); if (P) P.remove(); });
  }
  /* a line chart: one or more series over the same days or weeks, with a hover read-out */
  function lineChart(series, xl, tips, fmt) {
    var n = series[0].v.length, mx = 0; series.forEach(function (s) { s.v.forEach(function (x) { if (x > mx) mx = x; }); });
    var top = niceMax(mx || 1), X = function (i) { return n === 1 ? 50 : i / (n - 1) * 100; }, Y = function (v) { return 100 - v / top * 100; };
    var path = function (v) { var p = 'M' + X(0).toFixed(2) + ',' + Y(v[0]).toFixed(2); for (var i = 1; i < n; i++) { var x0 = X(i - 1), y0 = Y(v[i - 1]), x1 = X(i), y1 = Y(v[i]), cx = (x0 + x1) / 2; p += ' C' + cx.toFixed(2) + ',' + y0.toFixed(2) + ' ' + cx.toFixed(2) + ',' + y1.toFixed(2) + ' ' + x1.toFixed(2) + ',' + y1.toFixed(2); } return p; };
    var id = 'lg' + Math.random().toString(36).slice(2, 7);
    var svg = '<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><defs>' + series.map(function (s, k) { return '<linearGradient id="' + id + k + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:' + s.c + ';stop-opacity:.22"/><stop offset="1" style="stop-color:' + s.c + ';stop-opacity:0"/></linearGradient>'; }).join('') + '</defs>' +
      series.map(function (s, k) { var d = path(s.v); return '<path d="' + d + ' L100,100 L0,100 Z" fill="url(#' + id + k + ')"/><path d="' + d + '" fill="none" style="stroke:' + s.c + '" stroke-width="2.4" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"/>'; }).join('') + '</svg>';
    var hov = '<div class="lc4__h" style="--n:' + n + '">' + series[0].v.map(function (x, i) { return '<span data-v="' + esc(tips[i] + ' · ' + series.map(function (s) { return s.n + ' ' + fmt(s.v[i]); }).join(' · ')) + '">' + series.map(function (s) { return '<i style="top:' + Y(s.v[i]).toFixed(1) + '%;background:' + s.c + '"></i>'; }).join('') + '</span>'; }).join('') + '</div>';
    return '<div class="bc4 lc4"><div class="bc4__y"><span>' + kshort(top) + '</span><span>' + kshort(top / 2) + '</span><span>0</span></div><div class="bc4__p"><div class="lc4__a">' + svg + hov + '</div><div class="bc4__x" style="--n:' + n + '">' + xl.map(function (l) { return '<span>' + esc(l || '') + '</span>'; }).join('') + '</div></div></div>';
  }

  /* ---------- you: the picture top right ---------- */
  function signOut() { api('/api/hq?route=logout', {}).then(function () { forget(); S.me = null; location.hash = ''; login(S.setup || {}); }, function () { forget(); login({}); }); }
  function meMenu(e) {
    var old = document.getElementById('meM'); if (old) { old.remove(); return; }
    var u = S.me || {}, m = document.createElement('div'); m.id = 'meM'; m.className = 'me-m';
    m.innerHTML = '<div class="me-m__h">' + avatarHtml(u, 'av--lg') + '<div><b>' + esc(u.name || 'You') + '</b><small>' + esc(u.role === 'owner' ? (u.title || 'Lead Developer & Creative Director') : (u.title || 'Team member')) + (u.email ? ' · ' + esc(u.email) : '') + '</small></div></div>' +
      '<button type="button" data-a="profile">' + I.user + '<span>Profile & picture</span></button>' + (can('team') ? '<button type="button" data-a="team">' + I.ucog + '<span>Team & access</span></button>' : '') +
      '<div class="me-m__t"><small>Theme</small>' + themeSwitch() + '</div><button type="button" data-a="out" class="is-out">' + I.out + '<span>Sign out</span></button>';
    document.body.appendChild(m);
    var close = function (ev) { if (!m.contains(ev.target) && ev.target.closest('#meB') == null) { m.remove(); document.removeEventListener('click', close, true); } };
    setTimeout(function () { document.addEventListener('click', close, true); }, 0);
    m.querySelectorAll('[data-tm]').forEach(function (x) { x.onclick = function () { setTheme(x.getAttribute('data-tm')); }; }); if (window.__paintTh) window.__paintTh();
    m.onclick = function (ev) { var b = ev.target.closest('[data-a]'); if (!b) return; var a = b.getAttribute('data-a'); m.remove(); document.removeEventListener('click', close, true);
      if (a === 'profile') profileModal(); else if (a === 'team') location.hash = '#team'; else if (a === 'theme') document.getElementById('thm').click(); else if (a === 'out') signOut(); };
  }
  /* a picture from the phone or computer, made small and square (centre crop) */
  function pickPic(cb) {
    var f = document.createElement('input'); f.type = 'file'; f.accept = 'image/*';
    f.onchange = function () { var file = f.files && f.files[0]; if (!file) return; var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () { var n = 192, c = document.createElement('canvas'); c.width = c.height = n; var x = c.getContext('2d'), z = Math.min(img.width, img.height); x.drawImage(img, (img.width - z) / 2, (img.height - z) / 2, z, z, 0, 0, n, n); URL.revokeObjectURL(url); cb(c.toDataURL('image/jpeg', .86)); };
      img.onerror = function () { toast('That file isn’t a picture we can use.', 'err'); }; img.src = url; };
    f.click();
  }
  function profileModal() {
    var u = Object.assign({}, S.me || {}), pic = u.avatar || '';
    var m = modal('<div class="pf-m"><div class="row" style="justify-content:space-between"><h2>Your profile</h2><button class="b b--sm b--ghost" data-x>' + I.x + '</button></div>' +
      '<div class="pf-pic"><span id="pfAv">' + avatarHtml({ name: u.name, avatar: pic }, 'av--xl') + '</span><div class="pf-pic__a"><button class="b b--sm" type="button" id="pfUp">' + I.image + '<span>Choose a picture</span></button><button class="b b--sm b--ghost" type="button" id="pfRm"' + (pic ? '' : ' hidden') + '>Remove</button><small class="muted">Shows top right, in the menu and on your team card.</small></div></div>' +
      '<label class="field"><span>Your name</span><input class="hq-in" id="pfN" value="' + esc(u.name || '') + '" maxlength="80"></label>' +
      (u.role === 'owner' ? '<label class="field"><span>Your title</span><input class="hq-in" id="pfT" value="' + esc(u.title || 'Lead Developer & Creative Director') + '" maxlength="80"></label>' : '') +
      (u.role === 'member' ? '<details class="pf-pw"><summary>Change your password</summary><div class="g2"><label class="field"><span>Current password</span><input class="hq-in" id="pfO" type="password" autocomplete="current-password"></label><label class="field"><span>New password (8+ characters)</span><input class="hq-in" id="pfP" type="password" autocomplete="new-password"></label></div></details>' : '<p class="muted" style="font-size:.8rem">Your admin password is set in Vercel (ADMIN_PASSWORD).</p>') +
      '<div class="row"><button class="b b--p" id="pfS">Save profile</button></div></div>');
    m.querySelector('.modal__p').classList.add('pf-modal');
    var paint = function () { m.querySelector('#pfAv').innerHTML = avatarHtml({ name: m.querySelector('#pfN').value, avatar: pic }, 'av--xl'); m.querySelector('#pfRm').hidden = !pic; };
    m.querySelector('#pfN').oninput = paint;
    m.querySelector('#pfUp').onclick = function () { pickPic(function (d) { pic = d; paint(); }); };
    m.querySelector('#pfRm').onclick = function () { pic = ''; paint(); };
    m.querySelector('#pfS').onclick = function () {
      var bt = this, b = { name: m.querySelector('#pfN').value.trim(), avatar: pic }, np = m.querySelector('#pfP'), pt = m.querySelector('#pfT'); if (pt) b.title = pt.value.trim();
      if (!b.name) { toast('Add your name', 'err'); return; }
      if (np && np.value) { b.newPassword = np.value; b.password = m.querySelector('#pfO').value; }
      bt.disabled = true;
      api('/api/hq?route=profile-save', b).then(function () { setMe(Object.assign({}, S.me, { name: b.name, avatar: pic }, b.title !== undefined ? { title: b.title } : {})); paintMe(); m.remove(); toast('Profile saved', 'ok'); if (S.view === 'overview' || S.view === 'team') route(true); }, function (e) { bt.disabled = false; toast(e.message, 'err'); });
    };
  }

  /* ---------- Team & access (main admin only) ---------- */
  var SEC_GROUPS = [['Today', ['overview', 'leads', 'inbox', 'orders', 'invoices', 'instagram']], ['Work', ['projects', 'tasks', 'calendar', 'customers']], ['Sell', ['photobooks', 'payments', 'products', 'templates', 'campaigns', 'reviews']], ['Website', ['website', 'content', 'policies']], ['Insights', ['analytics', 'reports']], ['System', ['activity', 'settings']]];
  function navName(id) { var n = NAV.filter(function (x) { return x[0] === id; })[0]; return n ? n[1] : id; }
  function teamPage() {
    var b = body('<div class="tm"><div class="tm-top"><p class="muted">Give people on your team their own sign-in. Tick what each person can see and use; everything else stays hidden from them, on screen and on the server.</p><button class="b b--p" id="tmAdd">' + I.plus + '<span>Add a team member</span></button></div><div id="tmL"><div class="sk" style="height:120px"></div></div></div>');
    b.querySelector('#tmAdd').onclick = function () { memberModal(null); };
    api('/api/hq?route=team').then(function (r) {
      S.team = r;
      var me = S.me || {}, L = r.members || [];
      b.querySelector('#tmL').innerHTML = '<div class="tm-g"><div class="card tm-c tm-c--o">' + avatarHtml({ name: r.owner.name, avatar: r.owner.avatar }, 'av--lg') + '<div class="tm-c__m"><b>' + esc(r.owner.name) + '</b><small>' + esc(r.owner.title || 'Lead Developer & Creative Director') + ' · everything</small></div><span class="chip chip--b">Owner</span></div>' +
        L.map(function (u) { var n = (u.perms || []).length; return '<button type="button" class="card tm-c' + (u.active ? '' : ' is-off') + '" data-id="' + esc(u.id) + '">' + avatarHtml(u, 'av--lg') + '<div class="tm-c__m"><b>' + esc(u.name) + '</b><small>' + esc(u.title || 'Team member') + ' · ' + esc(u.email) + '</small><span class="tm-c__p">' + (n ? (n === SEC_GROUPS.reduce(function (s, g) { return s + g[1].length; }, 0) ? 'Everything' : (u.perms || []).slice(0, 4).map(navName).join(', ') + (n > 4 ? ' +' + (n - 4) : '')) : 'No access yet') + '</span></div><span class="chip' + (u.active ? ' chip--g' : '') + '">' + (u.active ? 'Active' : 'Off') + '</span></button>'; }).join('') +
        '</div>' + (L.length ? '' : '<div class="card tm-empty"><b>No team members yet</b><p class="muted">Add someone, give them a password, and tick what they can open. They sign in at cielafrica.com/admin with “Team member? Sign in with your email”.</p></div>');
      b.querySelectorAll('.tm-c[data-id]').forEach(function (x) { x.onclick = function () { memberModal(L.filter(function (u) { return u.id === x.getAttribute('data-id'); })[0]); }; });
    }, function (e) { b.querySelector('#tmL').innerHTML = '<p class="muted">' + esc(e.message) + '</p>'; });
  }
  function genPw() { var c = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789', a = new Uint32Array(12); crypto.getRandomValues(a); return [].map.call(a, function (x) { return c[x % c.length]; }).join(''); }
  function memberModal(u) {
    var isNew = !u; u = u || { perms: ['overview'], active: true }; var pic = u.avatar || '', P = {}; (u.perms || []).forEach(function (p) { P[p] = 1; });
    var m = modal('<div class="tmm"><div class="row" style="justify-content:space-between"><h2>' + (isNew ? 'Add a team member' : esc(u.name)) + '</h2><button class="b b--sm b--ghost" data-x>' + I.x + '</button></div>' +
      '<div class="pf-pic"><span id="tmAv">' + avatarHtml({ name: u.name, avatar: pic }, 'av--xl') + '</span><div class="pf-pic__a"><button class="b b--sm" type="button" id="tmUp">' + I.image + '<span>Picture</span></button><button class="b b--sm b--ghost" type="button" id="tmRm"' + (pic ? '' : ' hidden') + '>Remove</button></div></div>' +
      '<div class="g2"><label class="field"><span>Name</span><input class="hq-in" id="tmN" value="' + esc(u.name || '') + '" maxlength="80"></label><label class="field"><span>Role (shown on their card)</span><input class="hq-in" id="tmT" value="' + esc(u.title || '') + '" maxlength="60" placeholder="e.g. Designer, Sales"></label>' +
      '<label class="field"><span>Email (they sign in with it)</span><input class="hq-in" id="tmE" type="email" value="' + esc(u.email || '') + '" maxlength="160"></label><label class="field"><span>' + (isNew ? 'Password' : 'New password (leave empty to keep)') + '</span><span class="tmm-pw"><input class="hq-in" id="tmP" type="text" autocomplete="off" placeholder="' + (isNew ? '8+ characters' : '••••••••') + '"><button class="b b--sm" type="button" id="tmG">Make one</button></span></label></div>' +
      '<div class="tmm-acc"><div class="tmm-acc__h"><b>What they can see and use</b><span><button class="b b--sm b--ghost" type="button" data-all="1">Everything</button><button class="b b--sm b--ghost" type="button" data-all="0">Nothing</button></span></div>' +
      SEC_GROUPS.map(function (g, gi) { return '<div class="tmm-g"><div class="tmm-g__h"><b>' + g[0] + '</b><button type="button" class="tmm-g__t" data-g="' + gi + '">Tick all</button></div><div class="tmm-g__l">' + g[1].map(function (id) { var n = NAV.filter(function (x) { return x[0] === id; })[0]; return '<label class="tmm-o nv--' + n[4] + '"><input type="checkbox" data-p="' + id + '"' + (P[id] ? ' checked' : '') + '><b class="nv-i">' + n[2] + '</b><span>' + esc(n[1]) + '</span></label>'; }).join('') + '</div></div>'; }).join('') + '</div>' +
      '<label class="check tmm-on"><input type="checkbox" id="tmA"' + (u.active !== false ? ' checked' : '') + '> Account is on (they can sign in)</label>' +
      '<div class="row"><button class="b b--p" id="tmS">' + (isNew ? 'Create account' : 'Save changes') + '</button>' + (isNew ? '' : '<button class="b b--ghost tmm-del" id="tmD">Remove from team</button>') + '</div>' +
      '<p class="muted tmm-note">Share the email and password with them yourself (WhatsApp or in person). They can change the password and add a picture from their profile.</p></div>');
    m.querySelector('.modal__p').classList.add('tmm-modal');
    var paint = function () { m.querySelector('#tmAv').innerHTML = avatarHtml({ name: m.querySelector('#tmN').value, avatar: pic }, 'av--xl'); m.querySelector('#tmRm').hidden = !pic; };
    m.querySelector('#tmN').oninput = paint;
    m.querySelector('#tmUp').onclick = function () { pickPic(function (d) { pic = d; paint(); }); };
    m.querySelector('#tmRm').onclick = function () { pic = ''; paint(); };
    m.querySelector('#tmG').onclick = function () { m.querySelector('#tmP').value = genPw(); };
    m.querySelectorAll('[data-all]').forEach(function (x) { x.onclick = function () { var on = x.getAttribute('data-all') === '1'; m.querySelectorAll('[data-p]').forEach(function (c) { c.checked = on; }); }; });
    m.querySelectorAll('[data-g]').forEach(function (x) { x.onclick = function () { var l = x.closest('.tmm-g').querySelectorAll('[data-p]'), all = [].every.call(l, function (c) { return c.checked; }); l.forEach(function (c) { c.checked = !all; }); }; });
    m.querySelector('#tmS').onclick = function () {
      var bt = this, b = { id: isNew ? undefined : u.id, name: m.querySelector('#tmN').value.trim(), title: m.querySelector('#tmT').value.trim(), email: m.querySelector('#tmE').value.trim(), active: m.querySelector('#tmA').checked, avatar: pic, perms: [].filter.call(m.querySelectorAll('[data-p]'), function (c) { return c.checked; }).map(function (c) { return c.getAttribute('data-p'); }) };
      var pw = m.querySelector('#tmP').value; if (pw) b.password = pw;
      bt.disabled = true;
      api('/api/hq?route=team-save', b).then(function () { m.remove(); toast(isNew ? 'Account created for ' + b.name : 'Saved', 'ok'); teamPage(); }, function (e) { bt.disabled = false; toast(e.message, 'err'); });
    };
    var del = m.querySelector('#tmD'); if (del) del.onclick = function () { HQAsk.confirm('Remove ' + u.name + ' from the team? They won’t be able to sign in any more.').then(function (ok) { if (!ok) return; api('/api/hq?route=team-del', { id: u.id }).then(function () { m.remove(); toast('Removed', 'ok'); teamPage(); }, function (e) { toast(e.message, 'err'); }); }); };
  }

  /* ---------- small charts, drawn in the theme's colours ---------- */
  function kshort(n) { n = Math.round(n || 0); var a = Math.abs(n); return a >= 1e6 ? +(n / 1e6).toFixed(a >= 1e7 ? 0 : 1) + 'M' : a >= 1e3 ? +(n / 1e3).toFixed(a >= 1e4 ? 0 : 1) + 'k' : String(n); }
  function niceMax(v) { if (v <= 0) return 1; var e = Math.pow(10, Math.floor(Math.log10(v))), f = v / e; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * e; }
  function barChart(pts, fmt) {
    fmt = fmt || money;
    var top = niceMax(Math.max.apply(null, pts.map(function (p) { return p.v; }).concat([0])));
    return '<div class="bc4"><div class="bc4__y"><span>' + kshort(top) + '</span><span>' + kshort(top / 2) + '</span><span>0</span></div><div class="bc4__p"><div class="bc4__b" style="--n:' + pts.length + '">' +
      pts.map(function (p) { var h = p.v / top * 100; return '<span class="bc4__c' + (p.v ? '' : ' is-0') + '" data-v="' + esc(p.t + ' · ' + fmt(p.v)) + '"><i style="height:' + (p.v ? Math.max(2, h) : 0) + '%"></i></span>'; }).join('') +
      '</div><div class="bc4__x" style="--n:' + pts.length + '">' + pts.map(function (p) { return '<span>' + esc(p.l || '') + '</span>'; }).join('') + '</div></div></div>';
  }
  function donutChart(parts, mid) {
    var t = parts.reduce(function (s, p) { return s + p.v; }, 0), C = 2 * Math.PI * 42, off = 0;
    var seg = t ? parts.map(function (p) { var l = p.v / t * C, gap = parts.length > 1 ? Math.min(2.5, l / 3) : 0, r = '<circle cx="50" cy="50" r="42" fill="none" style="stroke:' + p.c + '" stroke-width="12" stroke-dasharray="' + Math.max(0, l - gap).toFixed(2) + ' ' + C.toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '" stroke-linecap="butt"/>'; off += l; return r; }).join('') : '';
    return '<div class="dn4__c"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="42" fill="none" style="stroke:var(--line2)" stroke-width="12"/><g transform="rotate(-90 50 50)">' + seg + '</g></svg><div class="dn4__m">' + mid + '</div></div>';
  }
  function ringChart(f, mid) {
    var C = 2 * Math.PI * 42;
    return '<div class="dn4__c dn4__c--s"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="42" fill="none" style="stroke:var(--line2)" stroke-width="10"/><circle cx="50" cy="50" r="42" fill="none" style="stroke:var(--g)" stroke-width="10" stroke-linecap="round" stroke-dasharray="' + (f > 0 ? Math.max(1, f * C) : 0).toFixed(2) + ' ' + C.toFixed(2) + '" transform="rotate(-90 50 50)"/></svg><div class="dn4__m">' + mid + '</div></div>';
  }
  function sparkLine(v) {
    var mx = Math.max.apply(null, v.concat([0])); if (!mx) return '';
    var pts = v.map(function (x, i) { return (i / (v.length - 1) * 100).toFixed(1) + ',' + (30 - x / mx * 26).toFixed(1); }).join(' ');
    return '<svg class="kp4__sp" viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true"><polyline points="0,32 ' + pts + ' 100,32" style="fill:var(--kc-soft)" stroke="none"/><polyline points="' + pts + '" fill="none" style="stroke:var(--kc)" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>';
  }
  function evRow(e) { var d = new Date(e.date + 'T12:00'); return '<li><span class="date-b"><b>' + d.getDate() + '</b><small>' + d.toLocaleDateString('en-KE', { month: 'short' }) + '</small></span><div><b>' + esc(e.title) + '</b><small>' + (e.allDay || !e.start ? 'All day' : esc(e.start) + (e.finish ? '–' + esc(e.finish) : '')) + (e.location ? ' · ' + esc(e.location) : '') + '</small></div><span class="chip chip--' + ({ meeting: 'b', shoot: 'p', deadline: 'r', delivery: 'g' }[e.type] || 'o') + '">' + esc(EVT[e.type] || 'Event') + '</span></li>'; }

  /* ---------- orders ---------- */
  function orderTable(list, compact) {
    if (!list.length) return '<p class="empty">No orders yet.</p>';
    return '<table class="tbl otbl"><thead><tr><th>Order</th><th>Customer</th><th class="hide-m">Items</th><th>Total</th><th>Status</th></tr></thead><tbody>' + list.map(function (o) {
      var k = KIND[o.kind];
      return '<tr data-ref="' + esc(o.ref) + '"><td><div class="otd">' + thumb(o) + '<div><b>' + esc(o.ref) + '</b>' + (o.test ? ' <span class="chip chip--k">TEST</span>' : '') + '<small><span class="kind"><i style="background:' + k[1] + '"></i>' + k[0] + '</span> · ' + d2(o.at) + '</small></div></div></td><td>' + esc(o.customer.name || '—') + '<small>' + esc(o.customer.phone ? '+' + String(o.customer.phone).replace(/^\+/, '') : o.customer.email || '') + '</small></td>' +
        (compact ? '<td class="hide-m"><small>' + esc((o.summary || '').slice(0, 60)) + '</small></td>' : '<td class="hide-m"><small>' + esc((o.summary || '').slice(0, 90)) + '</small></td>') + '<td><b>' + money(o.total) + '</b></td><td><span class="chip chip--' + tone(o.status) + '">' + esc(o.label) + '</span></td></tr>';
    }).join('') + '</tbody></table>' +
      /* phones: one box per order, going down */
      '<div class="ocards">' + list.map(function (o) {
        var k = KIND[o.kind], c = o.customer || {}, name = c.name || (o.kind === 'whatsapp' ? 'WhatsApp customer' : 'No name given');
        var ph = c.phone ? '+' + String(c.phone).replace(/^\+/, '') : c.email || '';
        return '<a class="ocard" href="#orders/' + esc(o.ref) + '" data-ref="' + esc(o.ref) + '">' + thumb(o) +
          '<span class="ocard__m"><span class="ocard__t"><b>' + esc(name) + '</b>' + (o.total ? '<b class="ocard__amt">' + money(o.total) + '</b>' : '') + '</span>' +
          '<span class="ocard__s"><span class="kind"><i style="background:' + k[1] + '"></i>' + k[0] + '</span> · ' + esc(o.ref) + ' · ' + d2(o.at) + '</span>' +
          (o.summary ? '<span class="ocard__x">' + esc(o.summary.slice(0, 90)) + '</span>' : '') +
          '<span class="ocard__f"><span class="chip chip--' + tone(o.status) + '">' + esc(o.label) + '</span>' + (o.test ? '<span class="chip chip--k">TEST</span>' : '') + (ph ? '<span class="ocard__ph">' + esc(ph) + '</span>' : '') + '</span></span></a>';
      }).join('') + '</div>';
  }
  /* the book's front cover for photo book orders (an icon for everything else, or while it loads) */
  var K_IC = { photobook: 'book', shop: 'box', domain: 'globe', whatsapp: 'wa', invoice: 'pen' };
  function thumb(o) {
    var it = o.kind === 'photobook' && o.raw && (o.raw.items || [])[0], f = function (p) { return '/api/photobooks?route=pbk-admin-file&path=' + encodeURIComponent('orders/' + o.ref + '/' + p); }, src = '', alt = '';
    if (o.kind === 'photobook' && /^PB-[0-9A-Z]{8}$/.test(o.ref)) {
      src = f('cover.jpg'); /* saved with every order and kept when page files are cleaned up */
      if (it && /^[A-Za-z0-9_-]{1,40}$/.test(it.projectId || '') && !(o.raw.purged && o.raw.purged.what === 'all')) alt = f(it.projectId + '/view/000.jpg');
    }
    return '<span class="othumb othumb--' + o.kind + '">' + (I[K_IC[o.kind]] || I.orders) + (src ? '<img loading="lazy" alt="" src="' + src + '"' + (alt ? ' data-alt="' + alt + '"' : '') + '>' : '') + '</span>';
  }
  function bindOrderRows(el) {
    el.querySelectorAll('tr[data-ref]').forEach(function (tr) { tr.onclick = function () { location.hash = '#orders/' + tr.getAttribute('data-ref'); }; });
    el.querySelectorAll('.othumb img').forEach(function (im) {
      var gone = function () { var a = im.getAttribute('data-alt'); if (a) { im.removeAttribute('data-alt'); im.src = a; } else im.remove(); };
      im.addEventListener('error', gone); im.addEventListener('load', function () { if (im.parentNode) im.parentNode.classList.add('is-img'); });
    });
  }
  function orders() {
    var f = S.filt, q = f.q.toLowerCase();
    var list = S.orders.filter(function (o) {
      if (f.kind !== 'all' && o.kind !== f.kind) return false;
      if (f.st === 'open' && (CLOSED.test(o.status) || (!o.paid && o.kind !== 'whatsapp' && o.status !== 'awaiting_confirmation' && o.status !== 'whatsapp_request'))) return false;
      if (f.st === 'unpaid' && o.paid) return false;
      if (f.st === 'done' && !CLOSED.test(o.status)) return false;
      return !q || (o.ref + ' ' + o.customer.name + ' ' + o.customer.email + ' ' + o.customer.phone + ' ' + o.summary).toLowerCase().indexOf(q) >= 0;
    });
    var n = function (k) { return S.orders.filter(function (o) { return k === 'all' || o.kind === k; }).length; };
    var src = Object.keys(S.sources).filter(function (k) { return S.sources[k] !== 'ok'; });
    var b = body('<div class="card"><div class="card__h" style="flex-wrap:wrap;gap:.7rem"><div class="tabs" id="kt">' + [['all', 'All'], ['photobook', 'Photo books'], ['shop', 'Shop'], ['whatsapp', 'WhatsApp'], ['domain', 'Domains']].map(function (k) { return '<button data-k="' + k[0] + '"' + (f.kind === k[0] ? ' class="is-on"' : '') + '>' + k[1] + '<i>' + n(k[0]) + '</i></button>'; }).join('') + '</div><div class="bar" style="margin-left:auto"><input class="hq-in" id="oq" type="search" placeholder="Search name, phone, order…" value="' + esc(f.q) + '"><select class="hq-in" id="os" style="width:auto">' + [['open', 'To handle'], ['all', 'All'], ['unpaid', 'Pending / not paid'], ['done', 'Done']].map(function (s) { return '<option value="' + s[0] + '"' + (f.st === s[0] ? ' selected' : '') + '>' + s[1] + '</option>'; }).join('') + '</select></div></div>' +
      (src.length ? '<div class="card__b" style="border-bottom:1px solid var(--line)">' + src.map(function (k) { return '<p class="muted" style="font-size:.82rem">' + KIND[k][0] + ' orders: ' + esc(S.sources[k]) + '</p>'; }).join('') + '</div>' : '') + orderTable(list) + '</div>' +
      '<p class="faint" style="font-size:.8rem">Shop orders are recorded when M-Pesa confirms a payment on the website. WhatsApp orders are recorded when someone taps a WhatsApp order button on the website (what they then send in WhatsApp isn’t visible here). Updates arrive live.</p>');
    b.querySelectorAll('#kt [data-k]').forEach(function (x) { x.onclick = function () { f.kind = x.getAttribute('data-k'); orders(); }; });
    var oq = b.querySelector('#oq'); oq.oninput = function () { f.q = oq.value; var pos = oq.selectionStart; orders(); var n2 = document.getElementById('oq'); n2.focus(); n2.setSelectionRange(pos, pos); };
    b.querySelector('#os').onchange = function () { f.st = this.value; orders(); };
    bindOrderRows(b);
  }
  function drawer(title, html, onClose) {
    var d = document.createElement('div'); d.className = 'drawer';
    d.innerHTML = '<div class="drawer__p"><div class="drawer__h"><button class="drawer__bk" type="button" data-x aria-label="Back">‹<span>Back</span></button><h2>' + title + '</h2><button class="b b--sm b--ghost" data-x>' + I.x + '</button></div><div class="drawer__b">' + html + '</div></div>';
    document.body.appendChild(d);
    function close() { d.remove(); var h = location.hash.slice(1).split('/'); if (h.length > 1 && /^(leads|orders|inbox)$/.test(h[0])) history.replaceState(null, '', '#' + h[0]); if (onClose) onClose(); }
    d.addEventListener('click', function (e) { if (e.target === d || e.target.closest('[data-x]')) close(); });
    document.addEventListener('keydown', function k(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', k); } });
    return d;
  }
  function orderDrawer(o) {
    if (o.kind === 'invoice' && window.HQMoney) return HQMoney.editInvoice(o.raw);
    var r = o.raw, c = o.customer, set = o.kind === 'photobook' ? PB_SET : o.kind === 'shop' ? SHOP_SET : o.kind === 'whatsapp' ? WA_SET : null;
    var a = r.address, g = r.gift, addr = a ? [a.line1, a.area, a.town, a.county].filter(Boolean).join(', ') + (a.notes ? ' (' + a.notes + ')' : '') : '';
    var labels = o.kind === 'photobook' ? PB_LABEL : o.kind === 'whatsapp' ? WA_LABEL : null;
    var h = '<div class="row"><span class="kind"><i style="background:' + KIND[o.kind][1] + '"></i>' + KIND[o.kind][0] + '</span><span class="chip chip--' + tone(o.status) + '">' + esc(o.label) + '</span>' + (o.test ? '<span class="chip chip--k">TEST · not printed</span>' : '') + '</div>' +
      '<dl class="dl"><dt>Placed</dt><dd>' + dt(o.at) + '</dd><dt>Total</dt><dd><b>' + money(o.total) + '</b></dd><dt>Customer</dt><dd>' + esc(c.name || '—') + (c.phone ? '<br><a href="tel:+' + esc(String(c.phone).replace(/^\+/, '')) + '">+' + esc(String(c.phone).replace(/^\+/, '')) + '</a> · <a target="_blank" rel="noopener" href="https://wa.me/' + esc(String(c.phone).replace(/\D/g, '')) + '">WhatsApp</a>' : '') + (c.email ? '<br><a href="mailto:' + esc(c.email) + '">' + esc(c.email) + '</a>' : '') + '</dd>' +
      (o.kind === 'domain' ? '<dt>Domain</dt><dd>' + esc(r.domain) + ' · ' + esc(r.years) + ' year(s)</dd>' : '') +
      (r.delivery ? '<dt>Delivery</dt><dd>' + esc(r.delivery.name || r.delivery) + '</dd>' : '') + (addr ? '<dt>Address</dt><dd>' + esc(addr) + '</dd>' : '') +
      (g ? '<dt>Gift</dt><dd>For ' + esc(g.to || '—') + (g.phone ? ' · ' + esc(g.phone) : '') + (g.note ? '<br>“' + esc(g.note) + '”' : '') + '</dd>' : '') +
      '<dt>Items</dt><dd>' + (r.lines ? r.lines.map(function (l) { return esc(l.label) + (l.qty > 1 ? ' × ' + l.qty : '') + ' — ' + money(l.amount * (l.qty || 1)); }).join('<br>') : esc(o.summary)) + '</dd></dl>' +
      (o.kind === 'whatsapp' ? '<dl class="dl"><dt>Page</dt><dd>' + esc(r.page || '—') + '</dd><dt>Message</dt><dd style="white-space:pre-wrap">' + esc(r.text || '—') + '</dd></dl>' : '') +
      (r.payment && r.payment.method === 'paybill' ? '<div class="card" style="padding:1rem;display:grid;gap:.5rem' + (o.status === 'awaiting_confirmation' ? ';border-color:#ff5a1f' : '') + '"><b>' + (o.status === 'awaiting_confirmation' ? 'Check this Paybill payment' : 'Paid by Paybill') + '</b><span class="muted">Paybill ' + esc(r.payment.paybill) + ' · account ' + esc(r.payment.account) + ' · code <b>' + esc(r.payment.code) + '</b></span><div style="white-space:pre-wrap;font-size:.85rem;background:var(--side2,#f6f2ea);border-radius:8px;padding:.6rem">' + esc(r.payment.message) + '</div>' + (o.status === 'awaiting_confirmation' ? '<div class="row" style="gap:.5rem"><button class="b b--p" id="pyok">Confirm payment</button><button class="b" id="pyno">Not received</button></div>' : '') + '</div>' : '') +
      (o.kind === 'photobook' ? '<button class="b b--d" id="dpf">' + I.book + '<span>Book preview, pages &amp; print PDF</span></button>' : '') +
      (o.kind === 'domain' ? '<button class="b b--d" id="ddm">' + I.globe + '<span>Register, check or refund</span></button>' : '') +
      (o.kind === 'whatsapp' && c.phone ? '<a class="b b--d" target="_blank" rel="noopener" href="https://wa.me/' + esc(String(c.phone).replace(/\D/g, '').replace(/^0/, '254')) + '">' + I.wa + '<span>Reply on WhatsApp</span></a>' : '') +
      (o.kind === 'whatsapp' ? '<label class="field"><span>Order total (KES)</span><input class="hq-in" id="dtot" type="number" min="0" value="' + esc(o.total || '') + '" placeholder="e.g. 4500"></label>' : '') +
      (set ? '<div class="card" style="padding:1rem;display:grid;gap:.7rem"><b>Update status</b><select class="hq-in" id="ds">' + set.map(function (s) { return '<option value="' + s + '"' + (o.status === s ? ' selected' : '') + '>' + esc(labels ? labels[s] : s.charAt(0).toUpperCase() + s.slice(1)) + '</option>'; }).join('') + '</select><textarea class="hq-in" id="dn" rows="2" placeholder="Note (optional)"></textarea>' + (o.kind === 'photobook' ? '<label class="check"><input type="checkbox" id="de" checked> Email the customer about this update</label><label class="check"><input type="checkbox" id="dp"> Include my note in the email</label>' : '') + '<button class="b b--p" id="db" style="justify-content:center">Save</button></div>' : '') +
      (r.history && r.history.length ? '<b>History</b><ul class="hist">' + r.history.slice().reverse().map(function (x) { return '<li><b>' + esc((labels && labels[x.status]) || x.status) + '</b> · ' + dt(x.at) + (x.note ? '<br><span class="muted">' + esc(x.note) + '</span>' : '') + '</li>'; }).join('') + '</ul>' : '') +
      (o.kind === 'shop' && o.paid ? '<div class="card" style="padding:1rem;display:grid;gap:.6rem"><b>Download link</b><span class="muted" id="dlS">' + (r.dl ? 'Valid until ' + d2(r.dl.until) + (r.verified ? '' : '') : r.verified === false ? 'The amount paid didn’t match the published prices, so no link was sent automatically. Check the payment, then make one.' : (r.lines || []).length ? 'No link yet.' : 'This order was placed before automatic downloads, so send its files by email.') + '</span><div class="row" style="flex-wrap:wrap;gap:.4rem">' + ((r.lines || []).length ? '<button class="b b--sm" data-dl="copy">' + (r.dl ? 'Copy link' : 'Make a link') + '</button><button class="b b--sm" data-dl="email"' + (c.email ? '' : ' disabled') + '>Email it to the customer</button>' + (r.dl ? '<button class="b b--sm b--ghost" data-dl="renew">New link (old one stops)</button>' : '') : '') + '</div></div>' : '') +
      '<button class="b" id="dtask">' + I.tasks + '<span>Make a task for this order</span></button>';
    var d = drawer(esc(o.ref), h, function () { if (location.hash.indexOf('#orders/') === 0) history.replaceState(null, '', '#orders'); });
    if (window.HQMoney) { try { HQMoney.extras(o, d); } catch (e) { console.error(e); } }
    var pyok = d.querySelector('#pyok'), pyno = d.querySelector('#pyno');
    function pyDone(x) { var n = fromPB(x.order); S.orders = S.orders.map(function (y) { return y.ref === n.ref ? n : y; }); d.remove(); orderDrawer(n); }
    if (pyok) pyok.onclick = function () { HQAsk.confirm('Confirm that ' + money(o.total) + ' (code ' + r.payment.code + ') reached Paybill ' + r.payment.paybill + '?').then(function (ok) { if (!ok) return; pyok.disabled = true; api('/api/photobooks?route=pbk-admin-confirm', { ref: o.ref, ok: true }).then(function (x) { toast('Payment confirmed: customer emailed'); pyDone(x); }, function (e) { pyok.disabled = false; toast(e.message); }); }); };
    if (pyno) pyno.onclick = function () { HQAsk.prompt('Payment not found. A short note for the customer (optional):', '').then(function (note) { if (note === null) return; api('/api/photobooks?route=pbk-admin-confirm', { ref: o.ref, ok: false, note: note }).then(function (x) { toast('Order put on hold: customer emailed'); pyDone(x); }, function (e) { toast(e.message); }); }); };
    d.querySelectorAll('[data-dl]').forEach(function (b) { b.onclick = function () {
      var op = b.getAttribute('data-dl'); (op === 'renew' ? HQAsk.confirm('Make a new link? The old one stops working.') : Promise.resolve(true)).then(function (ok) { if (!ok) return; b.disabled = true;
      api('/api/hq?route=shop-link', { id: r.id, op: op }).then(function (x) {
        if (op !== 'email' && navigator.clipboard) navigator.clipboard.writeText(x.url).catch(function () { });
        toast(op === 'email' ? (x.emailed ? 'Emailed to ' + c.email : 'The email couldn’t be sent. The link is copied instead.') : 'Link copied'); if (op === 'email' && !x.emailed && navigator.clipboard) navigator.clipboard.writeText(x.url).catch(function () { });
        var n = fromShop(x.order); S.orders = S.orders.map(function (y) { return y.ref === n.ref ? n : y; }); d.remove(); orderDrawer(n);
      }, function (e) { b.disabled = false; toast(e.message); }); });
}; });
    var sb = d.querySelector('#db');
    if (sb) sb.onclick = function () {
      sb.disabled = true; var st = d.querySelector('#ds').value, note = d.querySelector('#dn').value;
      var p = o.kind === 'photobook' ? api('/api/photobooks?route=pbk-admin-status', { ref: o.ref, status: st, note: note, notify: d.querySelector('#de').checked, public: d.querySelector('#dp').checked }).then(function (x) { toast(x.emailed ? 'Saved and emailed to the customer' : 'Saved'); return fromPB(x.order); })
        : o.kind === 'whatsapp' ? api('/api/hq?route=inbox-status', { id: r.id, status: st, note: note, total: d.querySelector('#dtot').value }).then(function (x) { toast('Saved'); S.inbox = S.inbox.map(function (m) { return m.id === x.item.id ? x.item : m; }); return fromWA(x.item); })
        : api('/api/hq?route=shop-status', { id: r.id, status: st, note: note }).then(function (x) { toast('Saved'); return fromShop(x.order); });
      p.then(function (n) { S.orders = S.orders.map(function (y) { return y.ref === n.ref ? n : y; }); d.remove(); history.replaceState(null, '', '#orders'); route(); }, function (e) { sb.disabled = false; toast(e.message); });
    };
    var pf = d.querySelector('#dpf'); if (pf) pf.onclick = function () { frame(o.ref + ' · book and print files', '/photobooks/orders?embed=1#' + o.ref); };
    var dm = d.querySelector('#ddm'); if (dm) dm.onclick = function () { frame('Ciel Domains', '/domains/admin?embed=1'); };
    d.querySelector('#dtask').onclick = function () { taskModal({ status: 'todo', ref: o.ref, title: 'Follow up ' + o.ref + (c.name ? ' (' + c.name + ')' : '') }); };
  }

  /* ---------- calendar ---------- */
  var EVT = { meeting: 'Meeting', shoot: 'Shoot', event: 'Event', deadline: 'Deadline', delivery: 'Delivery', personal: 'Personal' };
  function calendar() {
    var c = S.cal || (S.cal = new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    var first = new Date(c.getFullYear(), c.getMonth(), 1), start = new Date(first); start.setDate(1 - ((first.getDay() + 6) % 7));
    var cells = []; for (var i = 0; i < 42; i++) { var d = new Date(start); d.setDate(start.getDate() + i); cells.push(d); }
    if (cells[35].getMonth() !== c.getMonth()) cells = cells.slice(0, 35);
    var t = today();
    function evOn(k) { return S.events.filter(function (e) { return k >= e.date && k <= (e.end || e.date); }).sort(function (a, b) { return (a.start || '').localeCompare(b.start || ''); }); }
    var up = S.events.filter(function (e) { return (e.end || e.date) >= t; }).sort(function (a, b) { return (a.date + (a.start || '')).localeCompare(b.date + (b.start || '')); });
    var b = body('<div class="grid2"><div class="card"><div class="card__h cal__h"><h2>' + c.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' }) + '</h2><button class="b b--sm" data-m="-1">' + I.l + '</button><button class="b b--sm" data-m="0">Today</button><button class="b b--sm" data-m="1">' + I.r + '</button></div>' +
      '<div class="cal">' + ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(function (x) { return '<div class="cal__dow">' + x + '</div>'; }).join('') + cells.map(function (d) {
        var k = iso(d), l = evOn(k);
        return '<div class="cal__d' + (d.getMonth() !== c.getMonth() ? ' is-out' : '') + (k === t ? ' is-today' : '') + '" data-day="' + k + '"><span class="cal__n">' + d.getDate() + '</span>' + l.slice(0, 3).map(function (e) { return '<button class="ev ev--' + esc(e.type || 'event') + '" data-ev="' + e.id + '" title="' + esc(e.title) + '">' + (e.start && !e.allDay ? esc(e.start) + ' ' : '') + esc(e.title) + '</button>'; }).join('') + (l.length > 3 ? '<span class="cal__more">+' + (l.length - 3) + ' more</span>' : '') + '</div>';
      }).join('') + '</div></div>' +
      '<div class="card"><div class="card__h"><h2>Agenda</h2><button class="b b--p b--sm" data-new>' + I.plus + '<span>New event</span></button></div><ul class="list">' + (up.length ? up.slice(0, 14).map(function (e) { return evRow(e).replace('<li>', '<li data-ev="' + e.id + '" style="cursor:pointer">'); }).join('') : '<li class="empty">Nothing planned yet. Tap a day to add an event.</li>') + '</ul></div></div>');
    b.querySelectorAll('[data-m]').forEach(function (x) { x.onclick = function () { var m = +x.getAttribute('data-m'); S.cal = m === 0 ? new Date(new Date().getFullYear(), new Date().getMonth(), 1) : new Date(c.getFullYear(), c.getMonth() + m, 1); calendar(); }; });
    b.querySelector('[data-new]').onclick = function () { eventModal({ date: t }); };
    b.addEventListener('click', function (e) {
      var ev = e.target.closest('[data-ev]'); if (ev) { e.stopPropagation(); eventModal(S.events.filter(function (x) { return x.id === ev.getAttribute('data-ev'); })[0]); return; }
      var day = e.target.closest('[data-day]'); if (day) eventModal({ date: day.getAttribute('data-day') });
    });
  }
  function modal(html) {
    var m = document.createElement('div'); m.className = 'modal'; m.innerHTML = '<div class="modal__p">' + html + '</div>'; document.body.appendChild(m);
    m.addEventListener('click', function (e) { if (e.target === m || e.target.closest('[data-x]')) m.remove(); });
    return m;
  }
  function eventModal(e) {
    e = e || {};
    var m = modal('<h2>' + (e.id ? 'Edit event' : 'New event') + '</h2><label class="field"><span>Title</span><input class="hq-in" id="et" value="' + esc(e.title || '') + '" placeholder="e.g. Wedding shoot, client meeting" maxlength="120"></label>' +
      '<div class="g2"><label class="field"><span>Date</span><input class="hq-in" type="date" id="ed" value="' + esc(e.date || today()) + '"></label><label class="field"><span>Type</span><select class="hq-in" id="ey">' + Object.keys(EVT).map(function (k) { return '<option value="' + k + '"' + ((e.type || 'event') === k ? ' selected' : '') + '>' + EVT[k] + '</option>'; }).join('') + '</select></label></div>' +
      '<label class="check"><input type="checkbox" id="ea"' + (e.allDay || (!e.start && e.id) ? ' checked' : '') + '> All day</label>' +
      '<div class="g2" id="etimes"><label class="field"><span>Starts</span><input class="hq-in" type="time" id="es" value="' + esc(e.start || '09:00') + '"></label><label class="field"><span>Ends</span><input class="hq-in" type="time" id="ef" value="' + esc(e.finish || '10:00') + '"></label></div>' +
      '<div class="g2"><label class="field"><span>Until (optional, for multi-day)</span><input class="hq-in" type="date" id="ee" value="' + esc(e.end || '') + '"></label><label class="field"><span>Client</span><input class="hq-in" id="ec" value="' + esc(e.client || '') + '" maxlength="120"></label></div>' +
      '<label class="field"><span>Location</span><input class="hq-in" id="el" value="' + esc(e.location || '') + '" maxlength="160"></label><label class="field"><span>Notes</span><textarea class="hq-in" id="en" rows="3">' + esc(e.notes || '') + '</textarea></label>' +
      '<div class="row" style="justify-content:flex-end">' + (e.id ? '<button class="b" data-del style="margin-right:auto;color:var(--r)">Delete</button>' : '') + '<button class="b" data-x>Cancel</button><button class="b b--p" data-save>Save</button></div>');
    var tg = function () { m.querySelector('#etimes').style.display = m.querySelector('#ea').checked ? 'none' : ''; }; m.querySelector('#ea').onchange = tg; tg();
    m.querySelector('[data-save]').onclick = function () {
      var all = m.querySelector('#ea').checked;
      var it = { id: e.id, title: m.querySelector('#et').value, date: m.querySelector('#ed').value, type: m.querySelector('#ey').value, allDay: all, start: all ? '' : m.querySelector('#es').value, finish: all ? '' : m.querySelector('#ef').value, end: m.querySelector('#ee').value > m.querySelector('#ed').value ? m.querySelector('#ee').value : '', client: m.querySelector('#ec').value, location: m.querySelector('#el').value, notes: m.querySelector('#en').value, ref: e.ref };
      saveItem('events', it).then(function () { m.remove(); toast('Event saved'); route(); }, function (er) { toast(er.message); });
    };
    var del = m.querySelector('[data-del]'); if (del) del.onclick = function () { HQAsk.confirm('Delete this event?').then(function (ok) { if (!ok) return; delItem('events', e.id).then(function () { m.remove(); toast('Deleted'); route(); }); }); };
    setTimeout(function () { m.querySelector('#et').focus(); }, 50);
  }

  /* ---------- tasks: every lead, order and message lands here, plus your own ---------- */
  var COLS = [['todo', 'To do'], ['doing', 'In progress'], ['waiting', 'Waiting on client'], ['done', 'Done']];
  var TSRC = { lead: ['Lead', 'r'], message: ['Message', 'b'], order: ['Order', 'o'], whatsapp: ['WhatsApp order', 'g'], pages: ['Photo Books', 'p'] };
  var TPRI = [['high', 'High'], ['med', 'Medium'], ['low', 'Low']];
  var TREM = [['', 'No reminders'], ['1h', 'After 1 hour'], ['3h', 'After 3 hours'], ['1d', 'After a day']];
  function since(t) { var m = Math.max(0, Math.floor((Date.now() - (t || Date.now())) / 60000)); return m < 60 ? m + ' min' : m < 1440 ? Math.floor(m / 60) + ' h' : Math.floor(m / 1440) + ' d'; }
  function stepsOf(t) { return String(t.steps || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean).map(function (x) { return { done: /^\[x\]/i.test(x), text: x.replace(/^\[[ x]\]\s*/i, '') }; }); }
  function stepsStr(a) { return a.filter(function (x) { return x.text; }).map(function (x) { return (x.done ? '[x] ' : '[ ] ') + x.text; }).join('\n'); }
  function tkWait(t) { if (t.status === 'done' || t.status === 'waiting' || !t.src) return ''; var g = { '1h': 36e5, '3h': 108e5, '1d': 864e5 }[t.remind] || 36e5, age = Date.now() - (t.resumedAt || t.createdAt || Date.now()); return age > g ? 'late' : 'ok'; }
  function tkProj(t) { return t.ref ? (S.projects || []).filter(function (p) { return p.id === t.ref; })[0] : null; }
  function tkCard(t, ci) {
    var src = TSRC[t.src], st = stepsOf(t), sd = st.filter(function (x) { return x.done; }).length, over = t.due && t.due < today() && t.status !== 'done', w = tkWait(t), pj = tkProj(t);
    return '<div class="tk tk2' + (t.status === 'done' ? ' is-done' : '') + '" draggable="true" data-tk="' + t.id + '"><div class="tk2__top">' + (src ? '<span class="tk2__src tk2__src--' + src[1] + '">' + src[0] + '</span>' : '<span class="tk2__src">' + esc(t.tag || 'Task') + '</span>') + '<i class="tk2__p tk2__p--' + (t.priority || 'med') + '" title="' + ({ high: 'High', med: 'Medium', low: 'Low' }[t.priority || 'med']) + ' priority"></i></div>' +
      '<b class="tk2__t">' + esc(t.title) + '</b>' + (t.contact ? '<span class="tk2__c">' + esc(t.contact) + '</span>' : '') +
      '<div class="tk__m">' + (w ? '<span class="chip' + (w === 'late' ? ' chip--r' : '') + '">' + (w === 'late' ? 'Waiting ' : '') + since(t.resumedAt || t.createdAt) + (w === 'late' ? '' : ' ago') + '</span>' : '') + (t.status === 'waiting' ? '<span class="chip chip--y">Paused · no reminders</span>' : '') + (t.due && t.status !== 'done' ? '<span class="chip' + (over ? ' chip--r' : '') + '">' + (over ? 'Overdue · ' : 'Due ') + d2(t.due + 'T12:00') + '</span>' : '') + (st.length ? '<span class="tk2__st"><i style="width:' + Math.round(sd / st.length * 100) + '%"></i></span><span>' + sd + '/' + st.length + '</span>' : '') + (pj ? '<span class="chip chip--p">' + esc(pj.name.slice(0, 28)) + '</span>' : (t.ref ? '<span class="chip chip--p">' + esc(t.ref) + '</span>' : '')) + (t.assignee ? '<span>· ' + esc(t.assignee) + '</span>' : '') + '</div>' +
      '<div class="tk__mv">' + (ci > 0 ? '<button class="b b--sm" data-mv="' + COLS[ci - 1][0] + '">' + I.l + COLS[ci - 1][1] + '</button>' : '') + (ci < COLS.length - 1 ? '<button class="b b--sm" data-mv="' + COLS[ci + 1][0] + '">' + COLS[ci + 1][1] + I.r + '</button>' : '') + '</div></div>';
  }
  /* leads and orders from before tasks were automatic: offer to put them on the board (once each) */
  function tkMissing() {
    var have = {}; S.tasks.forEach(function (t) { if (t.key) have[t.key] = 1; if (t.link) have[t.link] = 1; });
    var out = [];
    S.inbox.forEach(function (m) {
      if (m.kind === 'whatsapp' || /^(completed|declined|archived)$/.test(m.stage || '') || m.status === 'done') return;
      var link = '/admin#leads/' + m.id; if (have[link] || have['lead:lead-' + m.id]) return;
      var c = m.customer || {}, brief = m.kind === 'brief';
      out.push({ title: (brief ? 'Respond to ' : 'Reply to ') + (c.name || c.email || c.phone || 'a lead') + (brief ? ' · project brief' : ' · message'), src: brief ? 'lead' : 'message', tag: brief ? 'Lead' : 'Message', link: link, key: 'lead:lead-' + m.id, contact: [c.name, c.phone, c.email].filter(Boolean).join(' · '), phone: c.phone || '', email: c.email || '', ref: m.project || '', notes: m.subject || '', steps: brief ? '[ ] Read the brief\n[ ] Reply (WhatsApp, call or email)\n[ ] Book a discovery call\n[ ] Send a proposal' : '[ ] Read the message\n[ ] Reply', status: 'todo', priority: 'high', remind: '1h' });
    });
    S.orders.forEach(function (o) {
      if (o.test || !o.paid || CLOSED.test(o.status || '')) return;
      var link = '/admin#orders/' + o.ref; if (have[link] || have['order:' + o.ref]) return;
      var c = o.customer || {};
      out.push({ title: 'Fulfil ' + (KIND[o.kind] ? KIND[o.kind][0].toLowerCase() : 'order') + ' · ' + o.ref, src: 'order', tag: 'Order', link: link, key: 'order:' + o.ref, contact: [c.name, c.phone, c.email].filter(Boolean).join(' · '), phone: c.phone || '', email: c.email || '', notes: o.summary || '', steps: '[ ] Check the payment\n[ ] Prepare the order\n[ ] Deliver and let the customer know', status: 'todo', priority: 'high', remind: '3h' });
    });
    return out;
  }
  function tasks(openId) {
    var f = S.tkf || 'all', miss = tkMissing();
    var keep = function (t) { return f === 'all' || (f === 'mine' ? !t.src : f === 'order' ? /order|whatsapp|pages/.test(t.src || '') : t.src === f); };
    var L = S.tasks.filter(keep), open = S.tasks.filter(function (t) { return t.status !== 'done'; });
    var late = open.filter(function (t) { return tkWait(t) === 'late' || (t.due && t.due < today()); }).length;
    var b = body('<div class="tk2-bar"><div class="tabs" id="tkF">' + [['all', 'All'], ['lead', 'Leads'], ['order', 'Orders'], ['message', 'Messages'], ['mine', 'My tasks']].map(function (x) { var n = x[0] === 'all' ? open.length : open.filter(function (t) { return x[0] === 'mine' ? !t.src : x[0] === 'order' ? /order|whatsapp|pages/.test(t.src || '') : t.src === x[0]; }).length; return '<button data-f="' + x[0] + '"' + (f === x[0] ? ' class="is-on"' : '') + '>' + x[1] + (n ? ' <i>' + n + '</i>' : '') + '</button>'; }).join('') + '</div>' + (late ? '<span class="chip chip--r">' + late + ' waiting too long</span>' : '<span class="faint" style="font-size:.8rem">Every lead, order and message lands here. Move one to “Waiting on client” to pause its reminders.</span>') + '</div>' +
      (miss.length ? '<div class="tk2-miss"><span>' + miss.length + ' open lead' + (miss.length === 1 ? '' : 's') + ' and order' + (miss.length === 1 ? '' : 's') + ' from before aren’t on the board yet.</span><button class="b b--p b--sm" id="tkMiss">Add them as tasks</button></div>' : '') +
      '<div class="board board--4">' + COLS.map(function (c, ci) {
        var l = L.filter(function (t) { return (t.status || 'todo') === c[0]; });
        if (c[0] === 'done') l.sort(function (a, z) { return (z.doneAt || z.updatedAt || 0) - (a.doneAt || a.updatedAt || 0); });
        else l.sort(function (a, z) { return ({ high: 0, med: 1, low: 2 }[a.priority] || 1) - ({ high: 0, med: 1, low: 2 }[z.priority] || 1) || (a.due || '9').localeCompare(z.due || '9') || (a.createdAt || 0) - (z.createdAt || 0); });
        var more = c[0] === 'done' && l.length > 12 && !S.tkAll;
        return '<div class="col" data-col="' + c[0] + '"><div class="col__h"><span>' + c[1] + '</span><i>' + l.length + '</i></div>' + (more ? l.slice(0, 12) : l).map(function (t) { return tkCard(t, ci); }).join('') + (more ? '<button class="b b--sm b--ghost" data-allone style="width:100%">Show all ' + l.length + '</button>' : '') +
          (c[0] === 'todo' ? '<form class="addtask" data-add><input class="hq-in" placeholder="Add a task…" maxlength="120"><button class="b b--p b--sm" aria-label="Add">' + I.plus + '</button></form>' : '') + '</div>';
      }).join('') + '</div>');
    b.querySelectorAll('#tkF [data-f]').forEach(function (x) { x.onclick = function () { S.tkf = x.getAttribute('data-f'); tasks(); }; });
    var mb = b.querySelector('#tkMiss'); if (mb) mb.onclick = function () { mb.disabled = true; mb.textContent = 'Adding…'; var q = miss.slice(); (function next() { var t = q.shift(); if (!t) { toast(miss.length + ' tasks added', 'ok'); tasks(); navs(); return; } saveItem('tasks', t).then(next, function (er) { toast(er.message); tasks(); }); })(); };
    var al = b.querySelector('[data-allone]'); if (al) al.onclick = function () { S.tkAll = 1; tasks(); };
    b.querySelector('[data-add]').onsubmit = function (e) { e.preventDefault(); var v = this.querySelector('input').value.trim(); if (!v) return; saveItem('tasks', { title: v, status: 'todo', priority: 'med' }).then(function () { tasks(); navs(); }, function (er) { toast(er.message); }); };
    b.addEventListener('click', function (e) {
      var mv = e.target.closest('[data-mv]'); if (mv) { e.stopPropagation(); var t = S.tasks.filter(function (x) { return x.id === mv.closest('[data-tk]').getAttribute('data-tk'); })[0]; t.status = mv.getAttribute('data-mv'); saveItem('tasks', t).then(function () { tasks(); navs(); }); return; }
      var tk = e.target.closest('[data-tk]'); if (tk) taskDrawer(S.tasks.filter(function (x) { return x.id === tk.getAttribute('data-tk'); })[0]);
    });
    var drag = null;
    b.querySelectorAll('[data-tk]').forEach(function (el) { el.addEventListener('dragstart', function (e) { drag = el.getAttribute('data-tk'); el.classList.add('is-dragging'); e.dataTransfer.setData('text/plain', drag); }); el.addEventListener('dragend', function () { el.classList.remove('is-dragging'); }); });
    b.querySelectorAll('[data-col]').forEach(function (col) {
      col.addEventListener('dragover', function (e) { e.preventDefault(); col.classList.add('is-drop'); });
      col.addEventListener('dragleave', function () { col.classList.remove('is-drop'); });
      col.addEventListener('drop', function (e) { e.preventDefault(); col.classList.remove('is-drop'); var t = S.tasks.filter(function (x) { return x.id === drag; })[0]; if (!t || t.status === col.getAttribute('data-col')) return; t.status = col.getAttribute('data-col'); tasks(); saveItem('tasks', t).then(navs, function (er) { toast(er.message); }); });
    });
    if (openId) { var ot = S.tasks.filter(function (x) { return x.id === openId; })[0]; if (ot) taskDrawer(ot); }
  }
  /* the task, read and act on it: contact buttons, checklist, status, reminders */
  function taskDrawer(t) {
    if (!t) return;
    var src = TSRC[t.src], st = stepsOf(t), pj = tkProj(t), ph = String(t.phone || '').replace(/\D/g, '').replace(/^0/, '254');
    var link = t.link && t.link.indexOf('/admin') === 0 ? t.link.slice(6) : '';
    var h = '<div class="tkd">' +
      '<div class="tkd__chips">' + (src ? '<span class="tk2__src tk2__src--' + src[1] + '">' + src[0] + '</span>' : '<span class="tk2__src">' + esc(t.tag || 'Task') + '</span>') + '<span class="chip">' + ({ high: 'High', med: 'Medium', low: 'Low' }[t.priority || 'med']) + ' priority</span><span class="faint">Added ' + since(t.createdAt) + ' ago</span></div>' +
      '<div class="seg4" id="tdS">' + COLS.map(function (c) { return '<button type="button" data-s="' + c[0] + '"' + ((t.status || 'todo') === c[0] ? ' class="is-on"' : '') + '>' + c[1] + '</button>'; }).join('') + '</div>' +
      (t.status === 'waiting' ? '<p class="tkd__pause">' + I.clock + '<span>Paused while you wait for the client. No reminders until you move it on.</span></p>' : '') +
      (t.contact || ph || t.email ? '<div class="tkd__who"><div><b>' + esc((t.contact || '').split(' · ')[0] || 'Contact') + '</b><small>' + esc([t.phone, t.email].filter(Boolean).join(' · ')) + '</small></div><div class="row">' + (ph ? '<a class="b b--sm" href="tel:+' + esc(ph) + '">' + I.phone + '<span>Call</span></a><a class="b b--sm" target="_blank" rel="noopener" href="https://wa.me/' + esc(ph) + '">' + I.wa + '<span>WhatsApp</span></a>' : '') + (t.email ? '<button class="b b--sm" type="button" id="tdM">' + I.mail + '<span>Email</span></button>' : '') + '</div></div>' : '') +
      '<div class="tkd__sec"><div class="row" style="justify-content:space-between"><b>Checklist</b><span class="faint" id="tdC">' + st.filter(function (x) { return x.done; }).length + ' of ' + st.length + '</span></div><ul class="tkd__steps" id="tdL">' + st.map(function (x, i) { return '<li><label><input type="checkbox" data-i="' + i + '"' + (x.done ? ' checked' : '') + '><span>' + esc(x.text) + '</span></label></li>'; }).join('') + '</ul><form class="addtask" id="tdA"><input class="hq-in" placeholder="Add a step…" maxlength="120"><button class="b b--sm" aria-label="Add step">' + I.plus + '</button></form></div>' +
      (t.notes ? '<div class="tkd__sec"><b>Details</b><p class="tkd__notes">' + esc(t.notes) + '</p></div>' : '') +
      '<dl class="dl"><dt>Due</dt><dd>' + (t.due ? d2(t.due + 'T12:00') : '—') + '</dd><dt>Reminders</dt><dd><select class="hq-in" id="tdR">' + TREM.map(function (r) { return '<option value="' + r[0] + '"' + ((t.remind || '') === r[0] ? ' selected' : '') + '>' + r[1] + '</option>'; }).join('') + '</select></dd>' + (t.assignee ? '<dt>Who</dt><dd>' + esc(t.assignee) + '</dd>' : '') + (pj ? '<dt>Project</dt><dd><a href="#projects/' + esc(pj.id) + '">' + esc(pj.name) + '</a></dd>' : '') + (t.doneAt ? '<dt>Done</dt><dd>' + dt(t.doneAt) + '</dd>' : '') + '</dl>' +
      '<div class="row" style="border-top:1px solid var(--line);padding-top:12px">' + (link ? '<a class="b b--d" href="' + esc(link) + '">Open ' + (src ? src[0].toLowerCase() : 'it') + '</a>' : '') + '<button class="b" id="tdE">' + I.pen + '<span>Edit</span></button><button class="b b--ghost" id="tdX" style="margin-left:auto;color:var(--r)">Delete</button></div></div>';
    var d = drawer(esc(t.title), h, function () { if (location.hash.indexOf('#tasks/') === 0) history.replaceState(null, '', '#tasks'); });
    var put = function (patch, msg) { Object.assign(t, patch); return saveItem('tasks', t).then(function (n) { t = n; if (msg) toast(msg, 'ok'); if (S.view === 'tasks') tasks(); navs(); }, function (er) { toast(er.message); }); };
    d.querySelectorAll('#tdS [data-s]').forEach(function (x) { x.onclick = function () { var v = x.getAttribute('data-s'); put({ status: v }, v === 'waiting' ? 'Paused until the client answers' : v === 'done' ? 'Done' : 'Moved').then(function () { d.remove(); taskDrawer(t); }); }; });
    d.querySelector('#tdL').onchange = function (e) { var i = +e.target.getAttribute('data-i'); st[i].done = e.target.checked; d.querySelector('#tdC').textContent = st.filter(function (x) { return x.done; }).length + ' of ' + st.length; put({ steps: stepsStr(st) }); };
    d.querySelector('#tdA').onsubmit = function (e) { e.preventDefault(); var v = this.querySelector('input').value.trim(); if (!v) return; st.push({ done: false, text: v }); put({ steps: stepsStr(st) }).then(function () { d.remove(); taskDrawer(t); }); };
    d.querySelector('#tdR').onchange = function () { put({ remind: this.value }, 'Reminders updated'); };
    d.querySelector('#tdE').onclick = function () { d.remove(); taskModal(t); };
    d.querySelector('#tdX').onclick = function () { HQAsk.confirm('Delete this task?').then(function (ok) { if (!ok) return; delItem('tasks', t.id).then(function () { d.remove(); if (S.view === 'tasks') tasks(); navs(); }); }); };
    var tm = d.querySelector('#tdM'); if (tm) tm.onclick = function () { if (window.HQMail) HQMail.compose({ to: t.email, subject: 'Your enquiry to Ciel Africa' }); else location.href = 'mailto:' + t.email; };
  }
  function taskModal(t) {
    t = t || {};
    var st = stepsOf(t), when = function (n) { var x = new Date(Date.now() + 3 * 36e5 + n * 864e5); return x.toISOString().slice(0, 10); };
    var seg = function (id, list, cur) { return '<div class="seg4" id="' + id + '">' + list.map(function (c) { return '<button type="button" data-v="' + c[0] + '"' + (cur === c[0] ? ' class="is-on"' : '') + '>' + c[1] + '</button>'; }).join('') + '</div>'; };
    var P = (S.projects || []).filter(function (p) { return p.status !== 'completed' || p.id === t.ref; });
    var team = ((S.team && S.team.members) || []).filter(function (u) { return u.active !== false; }).map(function (u) { return u.name; });
    var m = modal('<div class="tkf"><h2>' + (t.id ? 'Edit task' : 'New task') + '</h2>' +
      '<input class="hq-in tkf__t" id="tt" value="' + esc(t.title || '') + '" maxlength="120" placeholder="What needs doing?">' +
      '<label class="field"><span>Details</span><textarea class="hq-in" id="tn" rows="3" placeholder="Context, what the client asked, links…">' + esc(t.notes || '') + '</textarea></label>' +
      '<div class="field"><span>Status</span>' + seg('ts', COLS, t.status || 'todo') + '</div>' +
      '<div class="g2"><div class="field"><span>Priority</span>' + seg('tp', TPRI, t.priority || 'med') + '</div><label class="field"><span>Remind me</span><select class="hq-in" id="tr">' + TREM.map(function (r) { return '<option value="' + r[0] + '"' + ((t.remind || '') === r[0] ? ' selected' : '') + '>' + r[1] + '</option>'; }).join('') + '</select></label></div>' +
      '<div class="field"><span>Due</span><div class="tkf__due"><input class="hq-in" type="date" id="td" value="' + esc(t.due || '') + '"><button type="button" class="b b--sm" data-d="0">Today</button><button type="button" class="b b--sm" data-d="1">Tomorrow</button><button type="button" class="b b--sm" data-d="7">Next week</button></div></div>' +
      '<div class="g2"><label class="field"><span>Project</span><select class="hq-in" id="tj"><option value="">None</option>' + P.map(function (p) { return '<option value="' + esc(p.id) + '"' + (t.ref === p.id ? ' selected' : '') + '>' + esc(p.name) + '</option>'; }).join('') + (t.ref && !P.some(function (p) { return p.id === t.ref; }) ? '<option value="' + esc(t.ref) + '" selected>' + esc(t.ref) + '</option>' : '') + '</select></label>' +
      '<label class="field"><span>Who</span><input class="hq-in" id="ta" value="' + esc(t.assignee || '') + '" maxlength="60" list="tkTeam" placeholder="Me"><datalist id="tkTeam">' + team.map(function (n) { return '<option value="' + esc(n) + '">'; }).join('') + '</datalist></label></div>' +
      '<div class="g2"><label class="field"><span>Contact</span><input class="hq-in" id="tc" value="' + esc(t.contact || '') + '" maxlength="160" placeholder="Name"></label><label class="field"><span>Phone</span><input class="hq-in" id="tph" value="' + esc(t.phone || '') + '" maxlength="30" inputmode="tel"></label></div>' +
      '<label class="field"><span>Label</span><input class="hq-in" id="tg" value="' + esc(t.tag || '') + '" placeholder="e.g. Client, Photo Books" maxlength="40"></label>' +
      '<div class="field"><span>Checklist</span><ul class="tkd__steps tkf__steps" id="tkS"></ul><div class="addtask"><input class="hq-in" id="tkSi" placeholder="Add a step…" maxlength="120"><button type="button" class="b b--sm" id="tkSa" aria-label="Add step">' + I.plus + '</button></div></div>' +
      '<div class="row tkf__acts">' + (t.id ? '<button class="b" data-del style="margin-right:auto;color:var(--r)">Delete</button>' : '') + '<button class="b" data-x>Cancel</button><button class="b b--p" data-save>Save task</button></div></div>');
    m.classList.add('modal--wide');
    var drawSteps = function () { m.querySelector('#tkS').innerHTML = st.map(function (x, i) { return '<li><label><input type="checkbox" data-i="' + i + '"' + (x.done ? ' checked' : '') + '><span>' + esc(x.text) + '</span></label><button type="button" class="tkf__rm" data-rm="' + i + '" aria-label="Remove">' + I.x + '</button></li>'; }).join(''); };
    drawSteps();
    m.querySelector('#tkS').onchange = function (e) { var i = e.target.getAttribute('data-i'); if (i != null) st[+i].done = e.target.checked; };
    m.querySelector('#tkS').onclick = function (e) { var r = e.target.closest('[data-rm]'); if (r) { st.splice(+r.getAttribute('data-rm'), 1); drawSteps(); } };
    var addStep = function () { var i = m.querySelector('#tkSi'), v = i.value.trim(); if (!v) return; st.push({ done: false, text: v }); i.value = ''; drawSteps(); i.focus(); };
    m.querySelector('#tkSa').onclick = addStep; m.querySelector('#tkSi').onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); addStep(); } };
    m.querySelectorAll('.seg4').forEach(function (g) { g.onclick = function (e) { var x = e.target.closest('[data-v]'); if (!x) return; g.querySelectorAll('[data-v]').forEach(function (y) { y.classList.toggle('is-on', y === x); }); }; });
    m.querySelectorAll('[data-d]').forEach(function (x) { x.onclick = function () { m.querySelector('#td').value = when(+x.getAttribute('data-d')); }; });
    var segv = function (id) { var o = m.querySelector('#' + id + ' .is-on'); return o ? o.getAttribute('data-v') : ''; };
    m.querySelector('[data-save]').onclick = function () {
      var it = Object.assign({}, t, { title: m.querySelector('#tt').value, status: segv('ts') || 'todo', priority: segv('tp') || 'med', due: m.querySelector('#td').value, remind: m.querySelector('#tr').value, tag: m.querySelector('#tg').value, assignee: m.querySelector('#ta').value, ref: m.querySelector('#tj').value, notes: m.querySelector('#tn').value, contact: m.querySelector('#tc').value, phone: m.querySelector('#tph').value, steps: stepsStr(st) });
      saveItem('tasks', it).then(function () { m.remove(); toast('Task saved', 'ok'); if (S.view === 'tasks') tasks(); else route(); navs(); }, function (er) { toast(er.message); });
    };
    var del = m.querySelector('[data-del]'); if (del) del.onclick = function () { HQAsk.confirm('Delete this task?').then(function (ok) { if (!ok) return; delItem('tasks', t.id).then(function () { m.remove(); route(); }); }); };
    setTimeout(function () { if (!t.id) m.querySelector('#tt').focus(); }, 50);
  }


  /* ---------- customers (built from every order) ---------- */
  function customers() {
    var map = {};
    S.orders.forEach(function (o) {
      if (o.test) return;
      var c = o.customer, k = (c.email || '').toLowerCase() || String(c.phone || '').replace(/\D/g, '').slice(-9) || c.name; if (!k) return;
      var x = map[k] || (map[k] = { key: k, name: c.name, email: c.email, phone: c.phone, orders: 0, spent: 0, last: 0, kinds: {} });
      x.orders++; if (o.paid && !/cancel|refund/.test(o.status)) x.spent += o.total || 0; x.last = Math.max(x.last, o.at || 0); x.kinds[o.kind] = 1; if (!x.name && c.name) x.name = c.name; if (!x.phone && c.phone) x.phone = c.phone;
    });
    var list = Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) { return b.last - a.last; });
    var q = (S.cq || '').toLowerCase(), shown = list.filter(function (x) { return !q || ((x.name || '') + ' ' + (x.email || '') + ' ' + (x.phone || '')).toLowerCase().indexOf(q) >= 0; });
    var b = body('<div class="card"><div class="card__h"><h2>' + list.length + ' customer' + (list.length === 1 ? '' : 's') + '</h2><input class="hq-in" id="cq" type="search" placeholder="Search customers" value="' + esc(S.cq || '') + '" style="max-width:280px"></div>' +
      (shown.length ? '<table class="tbl"><thead><tr><th>Customer</th><th>Contact</th><th>Orders</th><th>Spent</th><th class="hide-m">Last order</th></tr></thead><tbody>' + shown.map(function (x) { return '<tr data-c="' + esc(x.key) + '"><td><b>' + esc(x.name || '—') + '</b><small>' + Object.keys(x.kinds).map(function (k) { return KIND[k][0]; }).join(' · ') + '</small></td><td>' + esc(x.phone ? '+' + String(x.phone).replace(/^\+/, '') : '') + '<small>' + esc(x.email || '') + '</small></td><td>' + x.orders + '</td><td><b>' + money(x.spent) + '</b></td><td class="hide-m">' + d2(x.last) + '</td></tr>'; }).join('') + '</tbody></table>' : '<p class="empty">Customers appear here as orders come in.</p>') + '</div>');
    var cq = b.querySelector('#cq'); cq.oninput = function () { S.cq = cq.value; var p = cq.selectionStart; customers(); var n = document.getElementById('cq'); n.focus(); n.setSelectionRange(p, p); };
    b.querySelectorAll('[data-c]').forEach(function (tr) {
      tr.onclick = function () {
        var x = map[tr.getAttribute('data-c')], note = S.notes.filter(function (n) { return n.key === x.key; })[0] || { key: x.key, text: '' };
        var os = S.orders.filter(function (o) { var c = o.customer; return (c.email || '').toLowerCase() === x.key || String(c.phone || '').replace(/\D/g, '').slice(-9) === x.key || c.name === x.key; });
        var d = drawer(esc(x.name || 'Customer'), '<dl class="dl"><dt>Phone</dt><dd>' + (x.phone ? '<a href="tel:+' + esc(String(x.phone).replace(/^\+/, '')) + '">+' + esc(String(x.phone).replace(/^\+/, '')) + '</a> · <a target="_blank" rel="noopener" href="https://wa.me/' + esc(String(x.phone).replace(/\D/g, '')) + '">WhatsApp</a>' : '—') + '</dd><dt>Email</dt><dd>' + (x.email ? '<a href="mailto:' + esc(x.email) + '">' + esc(x.email) + '</a>' : '—') + '</dd><dt>Spent</dt><dd><b>' + money(x.spent) + '</b> over ' + x.orders + ' order' + (x.orders === 1 ? '' : 's') + '</dd></dl>' +
          '<label class="field"><span>Notes about this customer</span><textarea class="hq-in" id="cn" rows="4" placeholder="Preferences, follow-ups, birthdays…">' + esc(note.text) + '</textarea></label><button class="b b--p" id="cs" style="justify-self:start">Save notes</button><b>Orders</b>' + orderTable(os, true));
        d.querySelector('#cs').onclick = function () { note.text = d.querySelector('#cn').value; saveItem('notes', note).then(function () { toast('Notes saved'); }, function (er) { toast(er.message); }); };
        d.querySelectorAll('tr[data-ref]').forEach(function (r2) { r2.onclick = function () { d.remove(); location.hash = '#orders/' + r2.getAttribute('data-ref'); }; });
      };
    });
  }

  /* ---------- inbox: website messages, project briefs and WhatsApp orders ---------- */
  var MK = { message: ['Message', 'b'], brief: ['Project brief', 'p'], whatsapp: ['WhatsApp order', 'g'] };
  function itabs() { return '<div class="tabs" id="itb" style="margin-bottom:2px">' + [['email', 'Email'], ['web', 'Website messages & WhatsApp']].map(function (t) { return '<button data-t="' + t[0] + '"' + ((S.itab || 'email') === t[0] ? ' class="is-on"' : '') + '>' + t[1] + '</button>'; }).join('') + '</div>'; }
  function bindItabs(b) { b.querySelectorAll('#itb [data-t]').forEach(function (x) { x.onclick = function () { S.itab = x.getAttribute('data-t'); inbox(); }; }); }
  function inbox() {
    if ((S.itab || 'email') === 'email' && window.HQMail) { var bb = body(itabs() + '<div id="mxBox"></div>'); bindItabs(bb); HQMail.render(bb.querySelector('#mxBox')); return; }
    var f = S.ifilt || (S.ifilt = 'all'), list = S.inbox.filter(function (m) { return f === 'all' || (f === 'new' ? m.status === 'new' || (m.kind === 'whatsapp' && m.status === 'pending') : m.kind === f); });
    var b = body(itabs() + '<div class="card"><div class="card__h" style="flex-wrap:wrap;gap:.7rem"><div class="tabs" id="ik">' + [['all', 'All'], ['new', 'New'], ['message', 'Messages'], ['brief', 'Briefs'], ['whatsapp', 'WhatsApp']].map(function (k) { return '<button data-k="' + k[0] + '"' + (f === k[0] ? ' class="is-on"' : '') + '>' + k[1] + '</button>'; }).join('') + '</div></div>' +
      (S.sources.inbox && S.sources.inbox !== 'ok' ? '<p class="muted card__b">' + esc(S.sources.inbox) + '</p>' : '') +
      (list.length ? '<ul class="list inbox">' + list.map(function (m) { var k = MK[m.kind] || MK.message, unread = m.status === 'new' || (m.kind === 'whatsapp' && m.status === 'pending'); return '<li data-m="' + esc(m.id) + '" class="' + (unread ? 'is-new' : '') + '"><span class="dot" style="background:var(--' + (unread ? 'o' : 'line') + ')"></span><div><b>' + esc(m.customer && (m.customer.name || m.customer.email || m.customer.phone) || (m.kind === 'whatsapp' ? 'WhatsApp visitor' : 'Visitor')) + '</b><small>' + esc((m.kind === 'whatsapp' ? (m.text || m.page) : m.subject || '').replace(/\s+/g, ' ').slice(0, 120)) + '</small></div><span class="chip chip--' + k[1] + '">' + k[0] + '</span><small class="muted hide-m" style="white-space:nowrap">' + dt(m.createdAt) + '</small></li>'; }).join('') + '</ul>' : '<p class="empty">Messages from the website forms and WhatsApp order taps appear here, live.</p>') + '</div>' +
      '<div class="card card__b"><b>Emails to hello@ and lorna@cielafrica.com</b><p class="muted" style="font-size:.86rem;margin-top:.3rem">Those mailboxes live with your email provider, so Ciel Admin can’t read them yet. Website form messages are already here. Showing the mailboxes too needs a connection to the mail provider that hosts cielafrica.com email (IMAP or its API).</p></div>');
    bindItabs(b);
    b.querySelectorAll('#ik [data-k]').forEach(function (x) { x.onclick = function () { S.ifilt = x.getAttribute('data-k'); inbox(); }; });
    b.querySelectorAll('[data-m]').forEach(function (li) { li.onclick = function () { location.hash = '#inbox/' + li.getAttribute('data-m'); }; });
  }
  function msgDrawer(m) {
    if (m.kind === 'whatsapp') { var o = S.orders.filter(function (x) { return x.id === m.id; })[0]; if (o) return orderDrawer(o); }
    var c = m.customer || {}, ph = String(c.phone || ((m.fields || []).filter(function (f) { return /phone|whatsapp/i.test(f[0]); })[0] || [])[1] || '').replace(/\D/g, '').replace(/^0/, '254');
    var h = '<div class="row"><span class="chip chip--' + (MK[m.kind] || MK.message)[1] + '">' + (MK[m.kind] || MK.message)[0] + '</span><span class="muted">' + dt(m.createdAt) + '</span></div>' +
      '<dl class="dl"><dt>From</dt><dd>' + esc(c.name || '—') + (c.email ? '<br><a href="mailto:' + esc(c.email) + '?subject=' + encodeURIComponent('Re: ' + (m.subject || 'your message')) + '">' + esc(c.email) + '</a>' : '') + (ph ? '<br><a target="_blank" rel="noopener" href="https://wa.me/' + esc(ph) + '">WhatsApp +' + esc(ph) + '</a>' : '') + '</dd>' +
      (m.fields || []).map(function (f) { return '<dt>' + esc(f[0]) + '</dt><dd style="white-space:pre-wrap">' + esc(f[1]) + '</dd>'; }).join('') + '</dl>' +
      '<div class="row">' + (c.email ? '<a class="b b--p" href="mailto:' + esc(c.email) + '?subject=' + encodeURIComponent('Re: ' + (m.subject || 'your message')) + '">' + I.mail + '<span>Reply by email</span></a>' : '') + '<select class="hq-in" id="ms" style="width:auto">' + [['new', 'New'], ['contacted', 'Replied'], ['done', 'Done']].map(function (x) { return '<option value="' + x[0] + '"' + (m.status === x[0] ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select></div>' +
      '<button class="b" id="mt">' + I.tasks + '<span>Make a task</span></button><button class="b b--ghost" id="md" style="color:var(--r)">Delete</button>';
    var d = drawer('Message', h, function () { if (location.hash.indexOf('#inbox/') === 0) history.replaceState(null, '', '#inbox'); });
    function set(st) { return api('/api/hq?route=inbox-status', { id: m.id, status: st }).then(function (x) { S.inbox = S.inbox.map(function (y) { return y.id === m.id ? x.item : y; }); m = x.item; navs(); }); }
    if (m.status === 'new') set('contacted').then(function () { d.querySelector('#ms').value = 'contacted'; }, function () { });
    d.querySelector('#ms').onchange = function () { set(this.value).then(function () { toast('Saved'); }, function (e) { toast(e.message); }); };
    d.querySelector('#mt').onclick = function () { taskModal({ status: 'todo', title: 'Reply to ' + (c.name || c.email || 'message') }); };
    d.querySelector('#md').onclick = function () { HQAsk.confirm('Delete this message?').then(function (ok) { if (!ok) return; api('/api/hq?route=inbox-status', { id: m.id, op: 'delete' }).then(function () { S.inbox = S.inbox.filter(function (y) { return y.id !== m.id; }); d.remove(); history.replaceState(null, '', '#inbox'); route(); }, function (e) { toast(e.message); }); }); };
  }

  /* ---------- website & setup ---------- */
  /* ---------- payments: every M-Pesa payment across the shop, Photo Books, domains and WhatsApp ---------- */
  function payments() {
    var P = S.pay || (S.pay = { per: 'month', kind: 'all', st: 'paid', q: '', tests: false });
    var now = new Date(), from = { today: new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime(), week: Date.now() - 7 * 864e5, month: new Date(now.getFullYear(), now.getMonth(), 1).getTime(), year: new Date(now.getFullYear(), 0, 1).getTime(), all: 0 }[P.per];
    var REF = /refund/, FAIL = /fail|cancel/;
    function stOf(o) { return REF.test(o.status) ? 'refunded' : o.paid ? 'paid' : FAIL.test(o.status) ? 'failed' : 'pending'; }
    var base = S.orders.filter(function (o) { return (P.tests || !o.test) && (o.at || 0) >= from && (P.kind === 'all' || o.kind === P.kind); });
    var list = base.filter(function (o) { return (P.st === 'all' || stOf(o) === P.st) && (!P.q || (o.ref + ' ' + (o.customer.name || '') + ' ' + (o.customer.phone || '') + ' ' + (o.raw.receipt || '')).toLowerCase().indexOf(P.q.toLowerCase()) >= 0); });
    var sum = function (l) { return l.reduce(function (n, o) { return n + (o.total || 0); }, 0); };
    var paid = base.filter(function (o) { return stOf(o) === 'paid'; }), refd = base.filter(function (o) { return stOf(o) === 'refunded'; }), pend = base.filter(function (o) { return stOf(o) === 'pending'; }), fail = base.filter(function (o) { return stOf(o) === 'failed'; });
    var byKind = {}; paid.forEach(function (o) { byKind[o.kind] = (byKind[o.kind] || 0) + (o.total || 0); }); var mx = Math.max.apply(null, [1].concat(Object.keys(byKind).map(function (k) { return byKind[k]; })));
    var b = body('<div class="row" style="gap:.5rem"><div class="tabs" id="pPer">' + [['today', 'Today'], ['week', '7 days'], ['month', 'This month'], ['year', 'This year'], ['all', 'All time']].map(function (x) { return '<button data-v="' + x[0] + '"' + (P.per === x[0] ? ' class="is-on"' : '') + '>' + x[1] + '</button>'; }).join('') + '</div><select class="hq-in" id="pKind" style="width:auto">' + [['all', 'All products'], ['photobook', 'Photo books'], ['shop', 'Shop'], ['domain', 'Domains'], ['whatsapp', 'WhatsApp']].map(function (x) { return '<option value="' + x[0] + '"' + (P.kind === x[0] ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select><label class="check" style="margin-left:auto"><input type="checkbox" id="pTest"' + (P.tests ? ' checked' : '') + '> Include test orders</label><button class="b b--sm" id="pCsv">Export CSV</button></div>' +
      '<div class="kpis"><div class="card kpi"><span>Paid (gross)</span><b>' + money(sum(paid)) + '</b><small>' + paid.length + ' payment' + (paid.length === 1 ? '' : 's') + ' · avg ' + money(paid.length ? sum(paid) / paid.length : 0) + '</small></div><div class="card kpi"><span>Refunded</span><b>' + money(sum(refd)) + '</b><small>' + refd.length + ' refund' + (refd.length === 1 ? '' : 's') + '</small></div><div class="card kpi"><span>Net</span><b>' + money(sum(paid) - 0) + '</b><small>M-Pesa fees not included</small></div><div class="card kpi"><span>Not paid</span><b>' + money(sum(pend)) + '</b><small>' + pend.length + ' waiting · ' + fail.length + ' failed</small></div></div>' +
      '<div class="ov"><div class="ov__main"><div class="card"><div class="card__h"><div class="tabs" id="pSt">' + [['paid', 'Paid'], ['pending', 'Waiting'], ['failed', 'Failed'], ['refunded', 'Refunded'], ['all', 'All']].map(function (x) { return '<button data-v="' + x[0] + '"' + (P.st === x[0] ? ' class="is-on"' : '') + '>' + x[1] + '</button>'; }).join('') + '</div><input class="hq-in" id="pQ" type="search" placeholder="Order, name, phone, receipt" value="' + esc(P.q) + '" style="max-width:240px;margin-left:auto"></div>' +
      (list.length ? '<table class="tbl"><thead><tr><th>Date</th><th>Order</th><th class="hide-m">Customer</th><th>Amount</th><th>Status</th></tr></thead><tbody>' + list.slice(0, 300).map(function (o) { var st = stOf(o); return '<tr data-ref="' + esc(o.ref) + '"><td>' + dt(o.at) + '</td><td><b>' + esc(o.ref) + '</b>' + (o.test ? ' <span class="chip">TEST</span>' : '') + '<small><span class="kind"><i style="background:' + KIND[o.kind][1] + '"></i>' + KIND[o.kind][0] + '</span> · M-Pesa' + (o.raw.receipt ? ' · ' + esc(o.raw.receipt) : '') + '</small></td><td class="hide-m">' + esc(o.customer.name || '—') + '<small>' + esc(o.customer.phone || o.customer.email || '') + '</small></td><td><b>' + money(o.total) + '</b><small>KES</small></td><td><span class="chip chip--' + ({ paid: 'g', pending: 'y', failed: 'r', refunded: 'p' }[st]) + '">' + st.charAt(0).toUpperCase() + st.slice(1) + '</span></td></tr>'; }).join('') + '</tbody></table>' : '<p class="empty">No payments in this view.</p>') + '</div></div>' +
      '<div class="ov__rail"><div class="card"><div class="card__h"><h2>Paid by product</h2></div><div class="card__b" style="display:grid;gap:.7rem">' + (Object.keys(byKind).length ? Object.keys(byKind).sort(function (a, c) { return byKind[c] - byKind[a]; }).map(function (k) { return '<div><div class="row" style="justify-content:space-between;font-size:.84rem"><span>' + KIND[k][0] + '</span><b>' + money(byKind[k]) + '</b></div><div style="height:6px;border-radius:6px;background:var(--line2);margin-top:5px"><div style="height:100%;width:' + Math.round(byKind[k] / mx * 100) + '%;border-radius:6px;background:' + KIND[k][1] + '"></div></div></div>'; }).join('') : '<p class="muted" style="font-size:.84rem">No paid orders in this period.</p>') + '</div></div>' +
      '<div class="card card__b"><b style="font-size:.86rem">About these numbers</b><p class="muted" style="font-size:.8rem;margin-top:.3rem">Payments are confirmed by M-Pesa on the server, never by a customer returning to a page. All amounts are in KES (the only currency the checkout takes). Unpaid orders are never counted as revenue.</p></div></div></div>');
    b.querySelectorAll('#pPer [data-v]').forEach(function (x) { x.onclick = function () { P.per = x.getAttribute('data-v'); payments(); }; });
    b.querySelectorAll('#pSt [data-v]').forEach(function (x) { x.onclick = function () { P.st = x.getAttribute('data-v'); payments(); }; });
    b.querySelector('#pKind').onchange = function () { P.kind = this.value; payments(); };
    b.querySelector('#pTest').onchange = function () { P.tests = this.checked; payments(); };
    var pq = b.querySelector('#pQ'); pq.oninput = function () { P.q = pq.value; var c = pq.selectionStart; payments(); var n = document.getElementById('pQ'); n.focus(); n.setSelectionRange(c, c); };
    b.querySelector('#pCsv').onclick = function () {
      var rows = [['Date', 'Order', 'Product', 'Customer', 'Phone', 'Email', 'Amount (KES)', 'Status', 'M-Pesa receipt', 'Test']].concat(list.map(function (o) { return [new Date(o.at).toISOString(), o.ref, KIND[o.kind][0], o.customer.name || '', o.customer.phone || '', o.customer.email || '', o.total || 0, stOf(o), o.raw.receipt || '', o.test ? 'yes' : '']; }));
      var csv = rows.map(function (r) { return r.map(function (v) { v = String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(','); }).join('\n');
      var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'ciel-payments-' + P.per + '-' + today() + '.csv'; a.click();
    };
    bindOrderRows(b);
  }
  function content() {
    /* the old Site content tool is retired: products, templates and services are edited under Products, pages under Website editor */
    var tabs = [['/photobooks/orders?embed=1', 'Photo Book files'], ['/domains/admin?embed=1', 'Domains']];
    var cur = Math.min(S.ctab || 0, 1);
    var b = body('<div class="tabs ct-tabs" id="ct">' + tabs.map(function (t, i) { return '<button data-i="' + i + '"' + (i === cur ? ' class="is-on"' : '') + '>' + t[1] + '</button>'; }).join('') + '</div><iframe class="hq-embed" src="' + tabs[cur][0] + '" title="' + tabs[cur][1] + '"></iframe>');
    b.querySelectorAll('#ct [data-i]').forEach(function (x) { x.onclick = function () { S.ctab = +x.getAttribute('data-i'); content(); }; });
  }
  function activity() {
    var b = body('<div class="card"><div class="card__h"><h2>Activity log</h2><span class="muted" style="font-size:.8rem">Sign-ins and website publishing</span></div><div id="al"><p class="empty">Loading…</p></div></div>');
    api('/api/hq?route=activity').then(function (r) { b.querySelector('#al').innerHTML = r.items.length ? '<table class="tbl"><thead><tr><th>When</th><th>What</th><th>Details</th></tr></thead><tbody>' + r.items.map(function (x) { return '<tr><td>' + dt(x.at) + '</td><td><b>' + esc(x.action) + '</b>' + (x.by ? '<small>by ' + esc(x.by) + '</small>' : '') + '</td><td><small>' + esc(x.detail || '') + '</small></td></tr>'; }).join('') + '</tbody></table>' : '<p class="empty">Nothing recorded yet.</p>'; }, function (e) { b.querySelector('#al').innerHTML = '<p class="empty">' + esc(e.message) + '</p>'; });
  }
  /* ---------- Photo Books: orders, the customer side (editor, My books), prices ---------- */
  function photobooks() {
    var pb = S.orders.filter(function (o) { return o.kind === 'photobook'; }).sort(function (a, b) { return b.at - a.at; });
    var real = pb.filter(function (o) { return !o.test; }), tests = pb.filter(function (o) { return o.test; });
    var open = real.filter(function (o) { return o.paid && !CLOSED.test(o.status); });
    var waiting = real.filter(function (o) { return o.paid && /^(paid|preparing)$/.test(o.status); });
    var ready = real.filter(function (o) { return o.status === 'ready'; });
    var tiles = [
      ['frame', I.book, 'Orders & print files', 'Every page at print size, the spine as PNG, the print and cover PDFs (with a preview first), corrections and storage clean-up.', '/photobooks/orders?embed=1'],
      ['tab', I.pen, 'Make a book as a customer', 'Opens the Photo Books store the way customers see it: pick a cover, add photos, let it arrange the pages, edit and order.', '/photobooks'],
      ['tab', I.folder, 'My books', 'Books saved on this device, orders placed from it, and the Serengeti and Dubai test books (Test books → Add).', '/photobooks/my-books'],
      ['prices', I.card, 'Prices & pages', 'Book prices by page count, the price of each additional page and delivery.', '#photobooks/prices'],
      ['tab', I.globe, 'Track an order', 'The page customers use to follow their order with its code.', '/photobooks/track']
    ];
    var row = function (o) { return '<tr data-o="' + esc(o.ref) + '" style="cursor:pointer"><td><b>' + esc(o.ref) + '</b>' + (o.test ? ' <span class="chip">TEST</span>' : '') + '<br><small class="muted">' + dt(o.at) + '</small></td><td>' + esc(o.customer.name || '') + '<br><small class="muted">' + esc(o.summary) + '</small></td><td><b>' + (o.test ? '<span class="muted">not paid</span>' : money(o.total)) + '</b></td><td><span class="chip">' + esc(o.label) + '</span></td></tr>'; };
    var b = body(
      '<div class="kpis"><div class="card kpi"><span>Open orders</span><b>' + open.length + '</b><small>paid and not delivered yet</small></div>' +
      '<div class="card kpi"><span>Waiting for pages</span><b>' + waiting.length + '</b><small>paid, pages still uploading</small></div>' +
      '<div class="card kpi"><span>Ready to print</span><b>' + ready.length + '</b><small>pages received</small></div>' +
      '<div class="card kpi"><span>Test orders</span><b>' + tests.length + '</b><small>no payment · never counted</small></div></div>' +
      '<div class="cards3" style="margin-top:1rem">' + tiles.map(function (t, i) { return '<button class="card tile" data-t="' + i + '"><span class="ico">' + t[1] + '</span><h3>' + t[2] + (t[0] === 'tab' ? ' <small class="muted" style="font-weight:500">↗</small>' : '') + '</h3><p>' + t[3] + '</p></button>'; }).join('') + '</div>' +
      '<div class="card" style="margin-top:1rem"><div class="card__h"><h2>Try it as a customer</h2></div><div class="card__b" style="display:grid;gap:.55rem;line-height:1.55">' +
      '<p>1. Open <b>Make a book as a customer</b>. Everything works as it does for a customer: covers, adding photos, automatic arranging, the editor and checkout.</p>' +
      '<p>2. Your books are saved in this browser and appear in <b>My books</b> on this device. The Serengeti and Dubai test books are in <b>My books → Test books</b>: tap <b>Add “Serengeti”</b> or <b>Add “Dubai”</b> and the full book (24 pages, all photos) is added to this device and opens in the editor. This box only shows on a phone or computer where you’re signed in to Ciel Admin.</p>' +
      '<p>3. At checkout you’ll see <b>Place test order (no payment)</b>, because you’re signed in to Ciel Admin on this device. It creates a real order code, uploads the pages and shows up here and in Orders marked <b>TEST</b>. No money is taken and it never counts as revenue.</p>' +
      '<p class="muted">Customers never see the test-order button. To pay for real you’d go through M-Pesa like any customer.</p></div></div>' +
      '<div class="card" style="margin-top:1rem"><div class="card__h"><h2>Photo Book orders</h2><a class="b b--sm" href="#orders">All orders</a></div>' +
      (pb.length ? '<div style="overflow:auto"><table class="tbl"><thead><tr><th>Order</th><th>Customer · book</th><th>Total</th><th>Status</th></tr></thead><tbody>' + pb.slice(0, 30).map(row).join('') + '</tbody></table></div>' : '<p class="empty">' + (S.sources && S.sources.photobook && S.sources.photobook !== 'ok' ? esc(S.sources.photobook) : 'No Photo Book orders yet.') + '</p>') + '</div>'
    );
    b.querySelectorAll('[data-t]').forEach(function (x) {
      x.onclick = function () {
        var t = tiles[+x.getAttribute('data-t')];
        if (t[0] === 'frame') frame(t[2], t[4]);
        else if (t[0] === 'prices') location.hash = t[4];
        else window.open(t[4], '_blank', 'noopener');
      };
    });
    b.querySelectorAll('[data-o]').forEach(function (x) { x.onclick = function () { location.hash = '#orders/' + x.getAttribute('data-o'); }; });
  }
  function website() {
    var tiles = [
      [I.pen, 'Products & prices', 'Products, templates, services and domain prices on cielafrica.com.', '/admin#products'],
      [I.book, 'Photo Books orders', 'Every page at print size, the book preview and the print PDF for each photo book order.', '/photobooks/orders'],
      [I.globe, 'Ciel Domains', 'Domain orders: check, register, refund.', '/domains/admin'],
      [I.orders, 'Shop', 'The products customers buy on cielafrica.com.', '/products.html'],
      [I.book, 'Photo Books store', 'What customers see: covers, the editor and checkout.', '/photobooks'],
      [I.web, 'cielafrica.com', 'The public website.', '/']
    ];
    var b = body('<div class="cards3">' + tiles.map(function (t, i) { return '<button class="card tile" data-t="' + i + '"><span class="ico">' + t[0] + '</span><h3>' + t[1] + '</h3><p>' + t[2] + '</p></button>'; }).join('') + '</div>');
    b.querySelectorAll('[data-t]').forEach(function (x) { x.onclick = function () { var t = tiles[+x.getAttribute('data-t')]; frame(t[1], t[3] + (/admin|orders/.test(t[3]) ? '?embed=1' : '')); }; });
  }
  function settings() {
    var s = S.setup || {};
    var rows = [
      [s.adminPassword, 'Admin password', 'ADMIN_PASSWORD in Vercel. One password for Ciel Admin, Photo Book orders, Domains and website content.'],
      [s.storage, 'Private file storage', 'Vercel Blob (cielafrica-photobooks): orders, print files, tasks and calendar.'],
      [s.payments, 'M-Pesa payments', 'Daraja keys in Vercel. Mode: ' + esc(s.mpesaEnv || 'sandbox') + '.'],
      [s.email, 'Automatic emails', 'RESEND_API_KEY in Vercel: receipts, order updates and reminders to customers, alerts to you.'],
      [!!(s.mail && s.mail.every(function (a) { return a.configured; })), 'Email in Ciel Admin', (s.mail || []).map(function (a) { return a.email + (a.alias ? ' (alias)' : '') + (a.configured ? ' ✓' : ' · not connected'); }).join(' · ') + '. lorna@ is the mailbox (MAIL_LORNA_PASSWORD in Vercel); hello@ is an alias that arrives in it and can be chosen as the sender.'],
      [s.publish, 'Website publishing', 'GITHUB_TOKEN in Vercel lets the Website editor publish to cielafrica.com. Create it on GitHub: Settings → Developer settings → Fine-grained tokens → Generate. Repository access: only Lornna08/cielafrica. Permissions: Contents → Read and write. Copy the token, add it in Vercel as GITHUB_TOKEN, then redeploy.'],
      [s.domainsDb, 'Orders database', 'Ciel Domains and shop orders are kept in the private Blob store (or Upstash Redis if you add it later).']
    ];
    var b = body('<div class="card"><div class="card__h"><h2>This device</h2></div><ul class="list setup"><li><span class="st" id="sp">…</span><div><b>Phone notifications</b><p id="spt">New orders, WhatsApp orders, pages received and website messages, even when Ciel Admin is closed.</p></div><button class="b b--sm b--p" id="spb">Turn on</button></li>' +
      '<li><span class="st' + (standalone() ? '' : ' no') + '">' + (standalone() ? '✓' : '') + '</span><div><b>Ciel Admin app</b><p>' + (standalone() ? 'Installed and running as an app.' : isIOS() ? 'On iPhone: open cielafrica.com/admin in Safari → Share → Add to Home Screen. Notifications on iPhone work only from the installed app.' : 'Install it on this phone or computer: it opens like an app and stays signed in.') + '</p></div>' + (standalone() ? '' : '<button class="b b--sm" id="spi">Install</button>') + '</li></ul></div>' +
      '<div class="card" id="popC"></div>' +
      '<div class="card"><div class="card__h"><h2>Setup checklist</h2></div><ul class="list setup">' + rows.map(function (r) { return '<li><span class="st' + (r[0] === 'opt' ? ' opt' : r[0] ? '' : ' no') + '">' + (r[0] === true ? '✓' : r[0] === 'opt' ? '–' : '') + '</span><div><b>' + r[1] + '</b><p>' + r[2] + '</p></div></li>'; }).join('') + '</ul></div><p class="faint" style="font-size:.82rem">Change any of these in Vercel → cielafrica → Settings → Environment Variables, then redeploy.</p>');
    function upd() { pushState().then(function (st) { var on = st === 'on'; b.querySelector('#sp').className = 'st' + (on ? '' : ' no'); b.querySelector('#sp').textContent = on ? '✓' : ''; var bt = b.querySelector('#spb'); bt.textContent = on ? 'Turn off' : 'Turn on'; bt.className = 'b b--sm' + (on ? '' : ' b--p'); if (st === 'denied') b.querySelector('#spt').textContent = 'Blocked in this browser’s settings. Allow notifications for cielafrica.com, then try again.'; if (st === 'ios') b.querySelector('#spt').textContent = 'On iPhone, install Ciel Admin first (Share → Add to Home Screen), then turn notifications on from the app.'; }); }
    upd();
    b.querySelector('#spb').onclick = function () { pushState().then(function (st) { return st === 'on' ? disablePush() : enablePush(); }).then(upd); };
    var si = b.querySelector('#spi'); if (si) si.onclick = install;
    popCard(b.querySelector('#popC'));
    if (window.HQMoney) HQMoney.setupCards(b);
  }
  function popCard(c) {
    var d = popPrefs();
    c.innerHTML = '<div class="card__h"><h2>Pop-ups</h2><label class="sw4" title="Show pop-ups"><input type="checkbox" id="popOn"' + (d.on ? ' checked' : '') + '><i></i><span>' + (d.on ? 'On' : 'Off') + '</span></label></div>' +
      '<p class="pop4-set__d">A small card in the corner when something new comes in, with an X to close it. Choose what pops up on this device.</p>' +
      '<div class="pop4-set' + (d.on ? '' : ' is-off') + '">' + POP_TYPES.map(function (x) { return '<label class="pop4-set__r"><input type="checkbox" data-pt="' + x[0] + '"' + (d.t[x[0]] ? ' checked' : '') + (d.on ? '' : ' disabled') + '><span><b>' + x[1] + '</b>' + (x[2] ? '<small>' + x[2] + '</small>' : '') + '</span></label>'; }).join('') + '</div>' +
      '<div class="pop4-set__f"><button type="button" class="b b--sm" id="popT"' + (d.on ? '' : ' disabled') + '>Show a sample</button><span class="faint">Phone notifications are chosen separately, under the bell.</span></div>';
    c.onchange = function (e) {
      var t = e.target;
      if (t.id === 'popOn') { d.on = t.checked; popSave(d); popCard(c); toast(d.on ? 'Pop-ups on' : 'Pop-ups off', 'ok'); return; }
      var k = t.getAttribute('data-pt'); if (k) { d.t[k] = t.checked; popSave(d); toast('Saved', 'ok'); }
    };
    c.querySelector('#popT').onclick = function () { pop({ kind: 'order', title: 'Sample · New order', body: 'This is how a new order looks. Nothing was ordered.', url: '/admin#orders', at: Date.now() }); };
  }

  window.HQ = { setTheme: setTheme, themeMode: themeMode, can: can, me: function () { return S.me; }, paintTheme: paintTheme, back: goBack, pushHelp: pushHelp, pushState: pushState, enablePush: enablePush, disablePush: disablePush, I: I, NAV: NAV, KIND: KIND, orderDrawer: orderDrawer, api: api, toast: toast, esc: esc, dt: dt, d2: d2, money: money, today: today, body: body, modal: modal, drawer: drawer, S: S, navs: navs, route: route, saveItem: saveItem, delItem: delItem, taskModal: taskModal, taskDrawer: taskDrawer, eventModal: eventModal };
  if (window.HQCrm) HQCrm.init(window.HQ);
  if (window.HQSite) HQSite.init(window.HQ);
  if (window.HQMail) HQMail.init(window.HQ);
  if (window.HQAnalytics) HQAnalytics.init(window.HQ);
  if (window.HQTools) HQTools.init(window.HQ);
  window.HQ.refreshOrders = function () { mergeOrders(); navs(); };
  if (window.HQGrow) HQGrow.init(window.HQ);
  if (window.HQMoney) HQMoney.init(window.HQ);
  if (window.HQLegal) HQLegal.init(window.HQ);
  if (window.HQIg) HQIg.init(window.HQ);
  start();
})();
