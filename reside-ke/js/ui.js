/* ============================================================
   Reside Ke — UI kit: formatting, icons, overlays, charts
   ============================================================ */
(function () {
  'use strict';
  var DAY = 864e5;

  /* ---------------- formatting ---------------- */
  var nf = new Intl.NumberFormat('en-KE');
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var fmt = ES.fmt = {
    n: function (v) { return nf.format(Math.round(v || 0)); },
    money: function (v, short) {
      v = Math.round(v || 0);
      if (short) {
        var a = Math.abs(v);
        if (a >= 1e9) return 'KES ' + trim(v / 1e9, 2) + 'B';
        if (a >= 1e6) return 'KES ' + trim(v / 1e6, a >= 1e8 ? 1 : 2) + 'M';
        if (a >= 1e4) return 'KES ' + trim(v / 1e3, 1) + 'K';
      }
      return 'KES ' + nf.format(v);
    },
    compact: function (v) { var a = Math.abs(v); if (a >= 1e9) return trim(v / 1e9, 1) + 'B'; if (a >= 1e6) return trim(v / 1e6, 1) + 'M'; if (a >= 1e3) return trim(v / 1e3, 0) + 'K'; return String(Math.round(v)); },
    pct: function (v, d) { return (v > 0 ? '+' : '') + trim(v, d == null ? 1 : d) + '%'; },
    date: function (d) { d = new Date(d); return d.getDate() + ' ' + MON[d.getMonth()] + (d.getFullYear() !== new Date().getFullYear() ? ' ' + d.getFullYear() : ''); },
    dateLong: function (d) { d = new Date(d); return d.getDate() + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear(); },
    time: function (d) { d = new Date(d); var h = d.getHours(), m = d.getMinutes(); return (h % 12 || 12) + ':' + (m < 10 ? '0' : '') + m + ' ' + (h < 12 ? 'AM' : 'PM'); },
    dt: function (d) { return fmt.day(d) + ', ' + fmt.time(d); },
    day: function (d) {
      d = new Date(d); var t = new Date(); t.setHours(0, 0, 0, 0);
      var diff = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - t) / DAY);
      if (diff === 0) return 'Today'; if (diff === 1) return 'Tomorrow'; if (diff === -1) return 'Yesterday';
      if (diff > 1 && diff < 7) return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
      return fmt.date(d);
    },
    ago: function (d) {
      var s = (Date.now() - new Date(d)) / 1000;
      if (s < 60) return 'just now'; if (s < 3600) return Math.floor(s / 60) + 'm ago'; if (s < 86400) return Math.floor(s / 3600) + 'h ago';
      if (s < 86400 * 7) return Math.floor(s / 86400) + 'd ago'; return fmt.date(d);
    },
    mon: function (d) { return MON[new Date(d).getMonth()]; },
    status: function (s) { return ({ active: 'Active', under_offer: 'Under offer', sold: 'Sold', let: 'Let', draft: 'Draft', withdrawn: 'Withdrawn' })[s] || s; },
    initials: function (n) { return (n || '?').replace(/[^A-Za-z ]/g, '').split(' ').filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase(); },
    esc: esc, MON: MON
  };
  function trim(v, d) { var s = (Math.round(v * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d); return s.indexOf('.') > -1 ? s.replace(/0+$/, '').replace(/\.$/, '') : s; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ---------------- icons ---------------- */
  var P = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/><path d="M10 20v-6h4v6"/>',
    building: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1M10 21v-3h4v3"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="m10.8 12.2 8.7-8.7M17 6l2 2M14.5 8.5l2 2"/>',
    tag: '<path d="M3 12V4.5A1.5 1.5 0 0 1 4.5 3H12l9 9-9 9-9-9Z"/><circle cx="7.5" cy="7.5" r="1.3"/>',
    trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4.5a2.5 2.5 0 0 0 2.5 4M17 6h2.5a2.5 2.5 0 0 1-2.5 4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
    bell: '<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Z"/><path d="M10 21h4"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 1 1 3.4 2.4c-.6.3-1 .8-1 1.5v.6M12 17h.01"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    more: '<circle cx="5" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="19" cy="12" r="1.4" fill="currentColor"/>',
    out: '<path d="M7 17 17 7M8 7h9v9"/>',
    left: '<path d="m15 6-6 6 6 6"/>', right: '<path d="m9 6 6 6-6 6"/>', down: '<path d="m6 9 6 6 6-6"/>', up: '<path d="m6 15 6-6 6 6"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>', check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
    chart: '<path d="M4 20V4M4 20h16"/><path d="m7 15 4-4 3 3 5-6"/>',
    bars: '<path d="M5 20V10M10 20V4M15 20v-7M20 20v-4"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12Z"/>',
    send: '<path d="m21 3-9.5 9.5M21 3l-6.5 18-3-8.5L3 9.5 21 3Z"/>',
    clip: '<path d="m20.5 11.5-8.4 8.4a5 5 0 0 1-7.1-7.1l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7l-8.5 8.5a1.7 1.7 0 0 1-2.4-2.4l7.8-7.8"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
    filter: '<path d="M3.5 5h17l-6.5 8v6l-4-2v-4L3.5 5Z"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
    pin: '<path d="M12 21s7-6.2 7-11.5a7 7 0 1 0-14 0C5 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
    bed: '<path d="M3 18V7M3 13h18v5M21 13a3 3 0 0 0-3-3h-7v3"/><circle cx="7" cy="11" r="1.6"/>',
    bath: '<path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3ZM6 12V6a2 2 0 0 1 4 0M7 19l-1 2M17 19l1 2"/>',
    area: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9h4M4 14h2M9 4v4M14 4v2"/>',
    car: '<path d="M5 16H4a1 1 0 0 1-1-1v-3l2-5h14l2 5v3a1 1 0 0 1-1 1h-1M8 16h8"/><circle cx="7" cy="16.5" r="1.8"/><circle cx="17" cy="16.5" r="1.8"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="m21 16-5-5-9 9"/>',
    star: '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5Z"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>',
    share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>', upload: '<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>',
    print: '<path d="M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><rect x="7" y="14" width="10" height="7"/>',
    phone: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2Z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6 8.5-6"/>',
    trend: '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    wallet: '<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H18v4"/><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M16 14h.01"/>',
    brief: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 13h18"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    play: '<path d="M8 5.5v13l10.5-6.5L8 5.5Z" fill="currentColor"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>',
    alert: '<path d="M12 3 2 20h20L12 3Z"/><path d="M12 10v4M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
    board: '<rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="10" y="4" width="5" height="10" rx="1.5"/><rect x="17" y="4" width="4" height="13" rx="1.5"/>',
    percent: '<path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    task: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    wrench: '<path d="M14.7 6.3a4 4 0 0 0 5 5L21 13l-8 8-3-3 6.2-6.2a4 4 0 0 1-5-5L13 5l1.7 1.3Z"/>',
    expand: '<path d="m5 13 7 7 7-7M5 4l7 7 7-7"/>', collapse: '<path d="m13 5 7 7-7 7M4 5l7 7-7 7"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/>',
    smile: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0M9 9.5h.01M15 9.5h.01"/>',
    plan: '<rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 12h7v9M10 12V3M14 12h7M14 12v4"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    logo: '<path d="M4 20V9.5L12 4l8 5.5V20"/><path d="M9 20v-6a3 3 0 0 1 6 0v6"/>'
  };
  ES.icon = function (n, s, cls) { return '<svg class="ic' + (cls ? ' ' + cls : '') + '" width="' + (s || 16) + '" height="' + (s || 16) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[n] || '') + '</svg>'; };
  var I = ES.icon;

  /* ---------------- small components ---------------- */
  ES.av = function (u, size, extra) {
    if (!u) return '';
    size = size || 28;
    var img = u.avatar ? '<img src="' + u.avatar + '" alt="" width="' + size + '" height="' + size + '" loading="lazy">' : '<span>' + fmt.initials(u.name) + '</span>';
    return '<span class="av' + (extra ? ' ' + extra : '') + '" style="--s:' + size + 'px" title="' + esc(u.name) + '">' + img + '</span>';
  };
  ES.cav = function (c, size) { // contact avatar: initials on tinted disc
    if (!c) return '';
    var hues = [228, 162, 28, 268, 198, 340, 120], h = hues[(c.name.charCodeAt(0) + c.name.length) % hues.length];
    return '<span class="av av--c" style="--s:' + (size || 28) + 'px;--h:' + h + '" title="' + esc(c.name) + '"><span>' + fmt.initials(c.name) + '</span></span>';
  };
  ES.pill = function (txt, tone) { return '<span class="pill pill--' + (tone || 'grey') + '">' + esc(txt) + '</span>'; };
  ES.statusPill = function (s) { var t = { active: 'blue', under_offer: 'amber', sold: 'green', let: 'green', draft: 'grey', withdrawn: 'grey' }[s]; return ES.pill(fmt.status(s), t); };
  ES.delta = function (v, invert) { var good = invert ? v < 0 : v > 0; return '<span class="delta ' + (Math.abs(v) < 0.05 ? 'is-flat' : good ? 'is-up' : 'is-down') + '">' + fmt.pct(v) + '</span>'; };
  ES.empty = function (icon, title, text, action) { return '<div class="empty">' + I(icon, 22) + '<b>' + esc(title) + '</b><p>' + esc(text || '') + '</p>' + (action || '') + '</div>'; };

  /* ---------------- toast ---------------- */
  var toastWrap;
  ES.toast = function (msg, tone, undo) {
    if (!toastWrap) { toastWrap = document.createElement('div'); toastWrap.className = 'toasts'; toastWrap.setAttribute('aria-live', 'polite'); document.body.appendChild(toastWrap); }
    var t = document.createElement('div'); t.className = 'toast toast--' + (tone || 'ok');
    t.innerHTML = I(tone === 'err' ? 'alert' : tone === 'info' ? 'info' : 'check', 15) + '<span>' + esc(msg) + '</span>';
    toastWrap.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('is-in'); });
    setTimeout(function () { t.classList.remove('is-in'); setTimeout(function () { t.remove(); }, 300); }, tone === 'err' ? 4200 : 2800);
  };
  ES.try = function (fn, okMsg) { try { var r = fn(); if (okMsg) ES.toast(okMsg); return r || true; } catch (e) { if (e.userFacing) ES.toast(e.message, 'err'); else { console.error(e); ES.toast('Something went wrong.', 'err'); } return false; } };

  /* ---------------- overlays ---------------- */
  var lastFocus = null;
  function trap(el) {
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.stopPropagation(); ES.close(); }
      if (e.key !== 'Tab') return;
      var f = el.querySelectorAll('button:not([disabled]),[href],input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])');
      if (!f.length) return;
      var a = f[0], b = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); b.focus(); }
      else if (!e.shiftKey && document.activeElement === b) { e.preventDefault(); a.focus(); }
    });
  }
  ES.close = function () {
    var o = document.querySelector('.ovl');
    if (!o) return;
    o.classList.remove('is-in');
    setTimeout(function () { o.remove(); }, 220);
    document.documentElement.classList.remove('is-locked');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  };
  // kind: 'modal' | 'drawer'
  ES.open = function (kind, html, opts) {
    opts = opts || {};
    var existing = document.querySelector('.ovl'); if (existing) existing.remove();
    lastFocus = document.activeElement;
    var o = document.createElement('div');
    o.className = 'ovl ovl--' + kind + (opts.wide ? ' ovl--wide' : '') + (opts.cls ? ' ' + opts.cls : '');
    o.innerHTML = '<div class="ovl__bg" data-close></div><div class="ovl__panel" role="dialog" aria-modal="true" aria-label="' + esc(opts.label || '') + '">' + html + '</div>';
    document.body.appendChild(o);
    document.documentElement.classList.add('is-locked');
    trap(o);
    o.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) ES.close(); });
    requestAnimationFrame(function () {
      o.classList.add('is-in');
      var f = o.querySelector('[autofocus]') || o.querySelector('input,select,textarea,button:not([data-close])');
      if (f) try { f.focus({ preventScroll: true }); } catch (e) { }
    });
    return o.querySelector('.ovl__panel');
  };
  ES.head = function (title, sub) { return '<div class="ovl__head"><div><h2>' + esc(title) + '</h2>' + (sub ? '<p>' + sub + '</p>' : '') + '</div><button class="ib" data-close aria-label="Close">' + I('x', 18) + '</button></div>'; };
  ES.confirm = function (o) {
    var p = ES.open('modal', '<div class="cf"><div class="cf__ic cf__ic--' + (o.tone || 'blue') + '">' + I(o.icon || 'info', 20) + '</div><h2>' + esc(o.title) + '</h2><p>' + (o.html || esc(o.text || '')) + '</p>' + (o.field || '') + '<div class="cf__acts"><button class="btn" data-close>Cancel</button><button class="btn ' + (o.tone === 'red' ? 'btn--danger' : 'btn--p') + '" data-ok>' + esc(o.ok || 'Confirm') + '</button></div></div>', { label: o.title, cls: 'ovl--sm' });
    p.querySelector('[data-ok]').addEventListener('click', function () { var r = o.onOk(p); if (r !== false) ES.close(); });
  };

  // popover menu anchored to a button
  ES.menu = function (anchor, items, onPick) {
    ES.closeMenu();
    var m = document.createElement('div'); m.className = 'menu'; m.setAttribute('role', 'menu');
    m.innerHTML = items.map(function (it, i) { return it === '-' ? '<hr>' : '<button role="menuitem" data-i="' + i + '"' + (it.disabled ? ' disabled' : '') + ' class="' + (it.tone ? 'is-' + it.tone : '') + (it.on ? ' is-on' : '') + '">' + (it.icon ? I(it.icon, 15) : '') + '<span>' + esc(it.label) + '</span>' + (it.on ? I('check', 14, 'menu__on') : '') + '</button>'; }).join('');
    document.body.appendChild(m);
    var r = anchor.getBoundingClientRect(), w = m.offsetWidth, h = m.offsetHeight;
    var left = Math.min(Math.max(8, r.right - w), innerWidth - w - 8), top = r.bottom + 6;
    if (top + h > innerHeight - 8) top = Math.max(8, r.top - h - 6);
    m.style.left = left + 'px'; m.style.top = top + 'px';
    m.addEventListener('click', function (e) { var b = e.target.closest('[data-i]'); if (!b) return; ES.closeMenu(); onPick(items[+b.dataset.i]); });
    setTimeout(function () { var f = m.querySelector('button:not([disabled])'); if (f) f.focus(); document.addEventListener('pointerdown', outside, true); }, 0);
    m.addEventListener('keydown', function (e) {
      var bs = [].slice.call(m.querySelectorAll('button:not([disabled])')), i = bs.indexOf(document.activeElement);
      if (e.key === 'Escape') { ES.closeMenu(); anchor.focus(); }
      if (e.key === 'ArrowDown') { e.preventDefault(); bs[(i + 1) % bs.length].focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); bs[(i - 1 + bs.length) % bs.length].focus(); }
    });
    function outside(e) { if (!m.contains(e.target)) ES.closeMenu(); }
    m._off = function () { document.removeEventListener('pointerdown', outside, true); };
  };
  ES.closeMenu = function () { var m = document.querySelector('.menu'); if (m) { m._off && m._off(); m.remove(); } };

  /* ---------------- forms ---------------- */
  ES.field = function (label, input, hint, cls) { return '<label class="fld' + (cls ? ' ' + cls : '') + '"><span class="fld__l">' + label + '</span>' + input + (hint ? '<span class="fld__h">' + hint + '</span>' : '') + '</label>'; };
  ES.select = function (name, opts, val, extra) { return '<select name="' + name + '" ' + (extra || '') + '>' + opts.map(function (o) { var v = typeof o === 'object' ? o.v : o, l = typeof o === 'object' ? o.l : o; return '<option value="' + esc(v) + '"' + (String(v) === String(val) ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('') + '</select>'; };
  ES.formData = function (form) {
    var o = {};
    [].forEach.call(form.elements, function (el) {
      if (!el.name) return;
      if (el.type === 'checkbox') { if (el.dataset.multi) { o[el.name] = o[el.name] || []; if (el.checked) o[el.name].push(el.value); } else o[el.name] = el.checked; }
      else if (el.type === 'radio') { if (el.checked) o[el.name] = el.value; }
      else if (el.dataset.num != null) o[el.name] = el.value === '' ? 0 : Number(String(el.value).replace(/[^0-9.]/g, ''));
      else o[el.name] = el.value.trim();
    });
    return o;
  };
  ES.localInput = function (d) { d = new Date(d); var p = function (n) { return (n < 10 ? '0' : '') + n; }; return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes()); };

  ES.csv = function (name, rows) {
    var s = rows.map(function (r) { return r.map(function (c) { c = c == null ? '' : String(c); return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(','); }).join('\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + s], { type: 'text/csv' })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    ES.toast('Exported ' + name);
  };

  /* ---------------- charts ---------------- */
  var C = ES.chart = {};
  function niceMax(v) { if (v <= 0) return 1; var p = Math.pow(10, Math.floor(Math.log10(v))), n = v / p, steps = [1, 1.2, 1.6, 2, 2.4, 3, 4, 5, 6, 8, 10]; for (var i = 0; i < steps.length; i++) if (n <= steps[i]) return steps[i] * p; return 10 * p; }
  // monotone cubic (Fritsch–Carlson): smooth without overshooting the data
  function smooth(pts) {
    var n = pts.length; if (n < 2) return '';
    if (n === 2) return 'M' + pts[0][0] + ' ' + pts[0][1] + ' L' + pts[1][0] + ' ' + pts[1][1];
    var dx = [], dy = [], m = [], t = [];
    for (var i = 0; i < n - 1; i++) { dx[i] = pts[i + 1][0] - pts[i][0]; dy[i] = pts[i + 1][1] - pts[i][1]; m[i] = dy[i] / dx[i]; }
    t[0] = m[0]; t[n - 1] = m[n - 2];
    for (i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : 3 * (dx[i - 1] + dx[i]) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i]);
    var d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (i = 0; i < n - 1; i++) {
      var h = dx[i] / 3;
      d += ' C' + (pts[i][0] + h).toFixed(1) + ' ' + (pts[i][1] + t[i] * h).toFixed(1) + ' ' + (pts[i + 1][0] - h).toFixed(1) + ' ' + (pts[i + 1][1] - t[i + 1] * h).toFixed(1) + ' ' + pts[i + 1][0].toFixed(1) + ' ' + pts[i + 1][1].toFixed(1);
    }
    return d;
  }
  C.niceMax = niceMax; C.smooth = smooth;

  // Area/line chart. series: [{values:[], color, dash, label, area}], labels: [...]
  C.line = function (el, o) {
    var W = el.clientWidth || 600, H = o.h || 220, pl = o.pl || 44, pr = 10, pt = 10, pb = 24;
    var all = []; o.series.forEach(function (s) { all = all.concat(s.values); }); if (o.target) all.push(o.target);
    var max = niceMax(Math.max.apply(null, all) * 1.08), n = o.labels.length;
    var x = function (i) { return pl + (W - pl - pr) * (n === 1 ? .5 : i / (n - 1)); }, y = function (v) { return pt + (H - pt - pb) * (1 - v / max); };
    var g = '';
    for (var k = 0; k <= 4; k++) { var v = max * k / 4; g += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y(v) + '" y2="' + y(v) + '" class="ch-grid"/><text x="' + (pl - 8) + '" y="' + (y(v) + 4) + '" class="ch-ax" text-anchor="end">' + (o.yfmt ? o.yfmt(v) : fmt.compact(v)) + '</text>'; }
    var step = Math.ceil(n / (W < 420 ? 4 : 8));
    o.labels.forEach(function (l, i) { if (i % step === 0 || i === n - 1) g += '<text x="' + x(i) + '" y="' + (H - 6) + '" class="ch-ax" text-anchor="middle">' + esc(l) + '</text>'; });
    if (o.target) g += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y(o.target) + '" y2="' + y(o.target) + '" class="ch-target"/>';
    var id = 'g' + Math.random().toString(36).slice(2, 7);
    o.series.forEach(function (s) {
      var pts = s.values.map(function (v, i) { return [x(i), y(v)]; }), d = smooth(pts);
      if (s.area !== false && !s.dash) g += '<defs><linearGradient id="' + id + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="' + s.color + '" stop-opacity=".18"/><stop offset="1" stop-color="' + s.color + '" stop-opacity="0"/></linearGradient></defs><path d="' + d + ' L' + x(n - 1) + ' ' + y(0) + ' L' + x(0) + ' ' + y(0) + 'Z" fill="url(#' + id + ')"/>';
      g += '<path d="' + d + '" fill="none" stroke="' + s.color + '" stroke-width="' + (s.dash ? 1.5 : 2.25) + '"' + (s.dash ? ' stroke-dasharray="4 4"' : '') + ' stroke-linecap="round" class="ch-path"/>';
    });
    el.innerHTML = '<div class="ch"><svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">' + g + '<line class="ch-cur" y1="' + pt + '" y2="' + (H - pb) + '" style="opacity:0"/><g class="ch-dots"></g><rect x="' + pl + '" y="0" width="' + (W - pl - pr) + '" height="' + H + '" fill="transparent" class="ch-hit"/></svg><div class="ch-tip" hidden></div></div>';
    var svg = el.querySelector('svg'), tip = el.querySelector('.ch-tip'), cur = el.querySelector('.ch-cur'), dots = el.querySelector('.ch-dots');
    function show(i) {
      cur.setAttribute('x1', x(i)); cur.setAttribute('x2', x(i)); cur.style.opacity = 1;
      dots.innerHTML = o.series.map(function (s) { return s.dash ? '' : '<circle cx="' + x(i) + '" cy="' + y(s.values[i]) + '" r="4.5" fill="#fff" stroke="' + s.color + '" stroke-width="2.25"/>'; }).join('');
      tip.innerHTML = '<b>' + esc(o.tipLabels ? o.tipLabels[i] : o.labels[i]) + '</b>' + o.series.map(function (s) { return '<span><i style="background:' + s.color + '"></i>' + esc(s.label) + '<em>' + (o.vfmt ? o.vfmt(s.values[i]) : fmt.n(s.values[i])) + '</em></span>'; }).join('') + (o.target ? '<span><i class="is-dash"></i>Target<em>' + (o.vfmt ? o.vfmt(o.target) : fmt.n(o.target)) + '</em></span>' : '');
      tip.hidden = false;
      var tx = x(i) + 12; if (tx + tip.offsetWidth > W) tx = x(i) - tip.offsetWidth - 12;
      tip.style.left = tx + 'px'; tip.style.top = Math.max(0, y(o.series[0].values[i]) - tip.offsetHeight - 8) + 'px';
    }
    function hide() { tip.hidden = true; cur.style.opacity = 0; dots.innerHTML = ''; }
    function at(e) { var r = svg.getBoundingClientRect(), px = (e.touches ? e.touches[0].clientX : e.clientX) - r.left; return Math.max(0, Math.min(n - 1, Math.round((px - pl) / ((W - pl - pr) / Math.max(1, n - 1))))); }
    var hit = el.querySelector('.ch-hit');
    hit.addEventListener('pointermove', function (e) { show(at(e)); });
    hit.addEventListener('pointerleave', hide);
    hit.addEventListener('touchstart', function (e) { show(at(e)); }, { passive: true });
    if (o.focus != null) show(o.focus);
  };

  // horizontal bars: rows [{label, value, sub, color}]
  C.hbars = function (rows, o) {
    o = o || {};
    var max = Math.max.apply(null, rows.map(function (r) { return r.value; }).concat([1]));
    return '<div class="hb">' + rows.map(function (r) { return '<div class="hb__r"><span class="hb__l">' + (r.html || esc(r.label)) + '</span><span class="hb__t"><i style="width:' + Math.max(2, r.value / max * 100) + '%;background:' + (r.color || 'var(--blue)') + '"></i></span><span class="hb__v">' + (o.vfmt ? o.vfmt(r.value) : fmt.n(r.value)) + (r.sub ? '<em>' + esc(r.sub) + '</em>' : '') + '</span></div>'; }).join('') + '</div>';
  };
  // vertical bars
  C.vbars = function (el, o) {
    var W = el.clientWidth || 500, H = o.h || 180, pl = 46, pb = 22, pt = 8, n = o.values.length;
    var max = niceMax(Math.max.apply(null, o.values.concat([1])) * 1.05), bw = Math.min(28, (W - pl) / n * .55);
    var g = '';
    for (var k = 0; k <= 4; k++) { var v = max * k / 4, yy = pt + (H - pt - pb) * (1 - v / max); g += '<line x1="' + pl + '" x2="' + W + '" y1="' + yy + '" y2="' + yy + '" class="ch-grid"/><text x="' + (pl - 6) + '" y="' + (yy + 4) + '" class="ch-ax" text-anchor="end">' + (o.yfmt ? o.yfmt(v) : fmt.compact(v)) + '</text>'; }
    o.values.forEach(function (v, i) {
      var cx = pl + (W - pl) * (i + .5) / n, h = (H - pt - pb) * v / max;
      g += '<rect x="' + (cx - bw / 2) + '" y="' + (H - pb - h) + '" width="' + bw + '" height="' + Math.max(0, h) + '" rx="5" fill="' + (o.colors ? o.colors[i] : o.color || 'var(--blue)') + '" class="ch-bar"><title>' + esc(o.labels[i] + ': ' + (o.vfmt ? o.vfmt(v) : fmt.n(v))) + '</title></rect><text x="' + cx + '" y="' + (H - 6) + '" class="ch-ax" text-anchor="middle">' + esc(o.labels[i]) + '</text>';
    });
    el.innerHTML = '<svg width="' + W + '" height="' + H + '">' + g + '</svg>';
  };
  // donut: parts [{label,value,color}]
  C.donut = function (parts, o) {
    o = o || {}; var size = o.size || 150, r = size / 2 - 10, c = 2 * Math.PI * r, tot = parts.reduce(function (a, p) { return a + p.value; }, 0) || 1, off = 0;
    var arcs = parts.map(function (p) { var len = p.value / tot * c, gap = parts.length > 1 ? 2 : 0, s = '<circle r="' + r + '" cx="' + size / 2 + '" cy="' + size / 2 + '" fill="none" stroke="' + p.color + '" stroke-width="' + (o.stroke || 16) + '" stroke-dasharray="' + Math.max(0, len - gap) + ' ' + (c - Math.max(0, len - gap)) + '" stroke-dashoffset="' + (-off) + '" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')"><title>' + esc(p.label + ': ' + fmt.n(p.value)) + '</title></circle>'; off += len; return s; }).join('');
    return '<div class="donut"><svg width="' + size + '" height="' + size + '">' + arcs + '</svg><div class="donut__c"><b>' + (o.center || '') + '</b><span>' + (o.sub || '') + '</span></div></div>';
  };
  ES.spark = function (vals, color, w, h) {
    w = w || 80; h = h || 26; var max = Math.max.apply(null, vals), min = Math.min.apply(null, vals), rng = max - min || 1;
    var pts = vals.map(function (v, i) { return [i / (vals.length - 1) * w, h - 3 - (v - min) / rng * (h - 6)]; });
    return '<svg width="' + w + '" height="' + h + '" class="spark"><path d="' + smooth(pts) + '" fill="none" stroke="' + color + '" stroke-width="1.6" stroke-linecap="round"/></svg>';
  };

  /* ---------------- price gauge ---------------- */
  // Semicircular gauge (240° sweep) used by the pricing tool.
  ES.gauge = function (o) {
    var S = 300, cx = 150, cy = 158, r = 118, a0 = 210, a1 = -30; // degrees, clockwise from left
    function pt(a, rr) { var t = a * Math.PI / 180; return [cx + rr * Math.cos(t), cy - rr * Math.sin(t)]; }
    function arc(fa, ta, rr) { var p0 = pt(fa, rr), p1 = pt(ta, rr), large = Math.abs(fa - ta) > 180 ? 1 : 0; return 'M' + p0[0].toFixed(1) + ' ' + p0[1].toFixed(1) + ' A' + rr + ' ' + rr + ' 0 ' + large + ' 1 ' + p1[0].toFixed(1) + ' ' + p1[1].toFixed(1); }
    var ang = function (f) { return a0 - (a0 - a1) * Math.max(0, Math.min(1, f)); };
    var ticks = '';
    for (var i = 0; i <= 48; i++) { var a = ang(i / 48), big = i % 6 === 0, p0 = pt(a, r + 12), p1 = pt(a, r + (big ? 22 : 18)); ticks += '<line x1="' + p0[0].toFixed(1) + '" y1="' + p0[1].toFixed(1) + '" x2="' + p1[0].toFixed(1) + '" y2="' + p1[1].toFixed(1) + '" class="g-tick' + (big ? ' is-big' : '') + '"/>'; }
    var fe = o.fe, ft = o.ft, aE = ang(fe), aT = ang(ft);
    var base = '<path d="' + arc(a0, a1, r) + '" class="g-track"/>';
    var main = '<path d="' + arc(a0, Math.max(aT, aE), r) + '" class="g-main"/>';
    var over = ft > fe ? '<path d="' + arc(aE, aT, r) + '" class="g-over g-over--' + o.tone + '"/>' : '';
    var knob = pt(aT, r), mk0 = pt(aE, r - 16), mk1 = pt(aE, r + 26), lbl = pt(aE, r + 44);
    return '<svg class="gauge" viewBox="0 0 ' + S + ' 230" role="img" aria-label="Price position gauge">' + ticks + base + main + over +
      '<line x1="' + mk0[0].toFixed(1) + '" y1="' + mk0[1].toFixed(1) + '" x2="' + mk1[0].toFixed(1) + '" y2="' + mk1[1].toFixed(1) + '" class="g-mark"/>' +
      '<text x="' + lbl[0].toFixed(1) + '" y="' + (lbl[1] + 4).toFixed(1) + '" text-anchor="middle" class="g-mark-l">' + esc(o.diffLabel) + '</text>' +
      '<circle cx="' + knob[0].toFixed(1) + '" cy="' + knob[1].toFixed(1) + '" r="11" class="g-knob"/><circle cx="' + knob[0].toFixed(1) + '" cy="' + knob[1].toFixed(1) + '" r="4.5" class="g-knob-i"/></svg>';
  };
})();
