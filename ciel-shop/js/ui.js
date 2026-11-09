/* ============================================================
   CIEL SHOP — UI kit: formatting, icons, tables, dialogs, toasts
   ============================================================ */
window.CS = window.CS || {};
(function () {
  'use strict';
  var ui = CS.ui = {};

  /* ---------- formatting ---------- */
  var nf = new Intl.NumberFormat('en-US');
  ui.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  ui.num = function (n) { return nf.format(Math.round(n || 0)); };
  ui.money = function (n) { return 'KES ' + nf.format(Math.round(n || 0)); };
  ui.moneyShort = function (n) {
    var a = Math.abs(n || 0), s = n < 0 ? '−' : '';
    if (a >= 1e6) return s + 'KES ' + (a / 1e6).toFixed(a >= 1e7 ? 1 : 2).replace(/\.0+$/, '') + 'M';
    if (a >= 1e4) return s + 'KES ' + (a / 1e3).toFixed(a >= 1e5 ? 0 : 1).replace(/\.0$/, '') + 'K';
    return s + 'KES ' + nf.format(Math.round(a));
  };
  ui.short = function (n) { var a = Math.abs(n); if (a >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M'; if (a >= 1e3) return (n / 1e3).toFixed(a >= 1e4 ? 0 : 1).replace(/\.0$/, '') + 'K'; return String(Math.round(n)); };
  ui.pct = function (x, d) { return (x * 100).toFixed(d == null ? 1 : d) + '%'; };
  ui.date = function (s) { if (!s) return '—'; var d = new Date(s.length === 10 ? s + 'T12:00:00' : s); return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined }); };
  ui.dateLong = function (s) { if (!s) return '—'; var d = new Date(s.length === 10 ? s + 'T12:00:00' : s); return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); };
  ui.dateTime = function (s) { if (!s) return '—'; var d = new Date(s); return ui.date(s) + ', ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); };
  ui.rel = function (s) {
    if (!s) return '—';
    var diff = (Date.now() - new Date(s).getTime()) / 1000;
    if (diff < 0) { var f = -diff; if (f < 86400) return 'in ' + Math.round(f / 3600) + 'h'; return 'in ' + Math.round(f / 86400) + 'd'; }
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    if (diff < 86400 * 7) return Math.floor(diff / 86400) + 'd ago';
    return ui.date(s);
  };
  ui.today = function (offsetDays) { var d = new Date(Date.now() + (offsetDays || 0) * 864e5); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  ui.initials = function (n) { return String(n || '?').split(/\s+/).map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase(); };
  var AV = ['#C4532B', '#2F62B8', '#2F8A57', '#6E4FB0', '#B7791F', '#1A1916', '#A8441F', '#3F7A8A'];
  ui.avatar = function (name, sm) { var h = 0; String(name).split('').forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) | 0; }); return '<span class="avatar' + (sm ? ' avatar--sm' : '') + '" style="background:' + AV[Math.abs(h) % AV.length] + '">' + ui.esc(ui.initials(name)) + '</span>'; };
  ui.delta = function (cur, prev, invert) {
    if (!prev && !cur) return '<span class="delta delta--flat">0%</span>';
    if (!prev) return '<span class="delta delta--flat">new</span>';
    var ch = (cur - prev) / Math.abs(prev), up = ch >= 0, good = invert ? !up : up;
    if (Math.abs(ch) < 0.005) return '<span class="delta delta--flat">0%</span>';
    return '<span class="delta delta--' + (good ? 'up' : 'down') + '">' + (up ? '↑' : '↓') + ' ' + Math.abs(ch * 100).toFixed(Math.abs(ch) < 0.1 ? 1 : 0) + '%</span>';
  };
  ui.debounce = function (fn, ms) { var t; return function () { var a = arguments, s = this; clearTimeout(t); t = setTimeout(function () { fn.apply(s, a); }, ms); }; };

  /* ---------- icons (Lucide-style line icons) ---------- */
  var P = {
    grid: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    box: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
    layers: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
    cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
    kanban: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 7v7"/><path d="M12 7v4"/><path d="M16 7v9"/>',
    tag: '<path d="M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.42l8.7 8.7a2.43 2.43 0 0 0 3.42 0l6.58-6.58a2.43 2.43 0 0 0 0-3.42Z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
    warehouse: '<path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z"/><path d="M6 18h12"/><path d="M6 14h12"/><rect x="6" y="10" width="12" height="12"/>',
    truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    chart: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
    file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    minus: '<path d="M5 12h14"/>',
    chevD: '<path d="m6 9 6 6 6-6"/>', chevR: '<path d="m9 18 6-6-6-6"/>', chevL: '<path d="m15 18-6-6 6-6"/>', chevsL: '<path d="m11 17-5-5 5-5"/><path d="m18 17-5-5 5-5"/>',
    filter: '<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
    more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    up: '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>', down: '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
    edit: '<path d="M12 20h9"/><path d="M16.38 3.62a1 1 0 0 1 3 3L7.37 18.64a2 2 0 0 1-.86.5l-2.87.84a.5.5 0 0 1-.62-.62l.84-2.87a2 2 0 0 1 .5-.86z"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    archive: '<rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
    list: '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>',
    tiles: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
    menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
    collapse: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="m16 15-3-3 3-3"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    cal: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    ext: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    arrowR: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>', arrowL: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    swap: '<path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/>',
    adjust: '<path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>',
    broken: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    receive: '<path d="M12 3v12"/><path d="m8 11 4 4 4-4"/><path d="M8 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4"/>',
    wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
    trend: '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
    coins: '<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/>',
    percent: '<path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
    receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/>',
    sparkle: '<path d="M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.14-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.14a.5.5 0 0 1 .96 0L14.06 8.5A2 2 0 0 0 15.5 9.94l6.14 1.58a.5.5 0 0 1 0 .96L15.5 14.06a2 2 0 0 0-1.44 1.44l-1.58 6.14a.5.5 0 0 1-.96 0z"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    printer: '<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect x="6" y="14" width="12" height="8" rx="1"/>',
    drag: '<circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'
  };
  ui.icon = function (name, size, sw) { return '<svg width="' + (size || 16) + '" height="' + (size || 16) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (sw || 1.9) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[name] || '') + '</svg>'; };

  /* ---------- product thumbnails (category glyphs, no stock photos) ---------- */
  var G = {
    'Pantry': '<path d="M14 18h20v4a10 10 0 0 1-10 10h0a10 10 0 0 1-10-10z" /><path d="M34 21h2a3 3 0 0 1 0 6h-3"/><path d="M19 13c0-2 2-2 2-4M25 13c0-2 2-2 2-4"/>',
    'Personal Care': '<rect x="18" y="16" width="12" height="18" rx="3"/><path d="M21 16v-4h6v4M24 12V9h5"/>',
    'Textiles': '<path d="M12 14h24v20H12z"/><path d="M12 20h24M12 26h24M18 14v20M24 14v20M30 14v20" opacity=".55"/>',
    'Kitchen & Dining': '<ellipse cx="24" cy="24" rx="12" ry="5"/><path d="M12 24c0 6 5 10 12 10s12-4 12-10"/>',
    'Home Décor': '<path d="M16 32h16l-2-14H18z"/><path d="M20 18c0-4 2-6 4-8 2 2 4 4 4 8"/>',
    'Stationery': '<rect x="15" y="11" width="18" height="24" rx="2"/><path d="M19 17h10M19 21h10M19 25h6"/>'
  };
  ui.thumb = function (p, size) {
    size = size || 36;
    var a = p.art || { bg: '#EEE', fg: '#555', glyph: p.category };
    var hash = 0; String(p.id).split('').forEach(function (c) { hash = (hash * 17 + c.charCodeAt(0)) | 0; });
    var rot = Math.abs(hash) % 40 - 20;
    return '<span class="thumb" style="width:' + size + 'px;height:' + size + 'px;background:' + a.bg + '"><svg width="' + size + '" height="' + size + '" viewBox="0 0 48 48" fill="none" stroke="' + a.fg + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="40" cy="8" r="14" fill="' + a.fg + '" opacity=".07" stroke="none" transform="rotate(' + rot + ' 24 24)"/>' + (G[a.glyph] || G['Home Décor']) + '</svg></span>';
  };

  /* ---------- status pills ---------- */
  var PILL = {
    // fulfilment
    draft: 'grey', new: 'blue', processing: 'violet', packing: 'amber', ready: 'acc', shipped: 'blue', delivered: 'green', cancelled: 'grey', returned: 'red',
    // payment
    pending: 'amber', paid: 'green', refunded: 'grey', partially_refunded: 'amber',
    // stock
    in: 'green', low: 'amber', out: 'red', active: 'green', archived: 'grey',
    // batch
    expiring: 'amber', expired: 'red', depleted: 'grey',
    // po
    ordered: 'blue', partial: 'amber', received: 'green',
    // supplier
    on_hold: 'amber', inactive: 'grey'
  };
  var LBL = { in: 'In stock', low: 'Low stock', out: 'Out of stock', active: 'Active', archived: 'Archived', draft: 'Draft', expiring: 'Expiring soon', expired: 'Expired', depleted: 'Depleted', ordered: 'Ordered', partial: 'Part received', received: 'Received', on_hold: 'On hold', inactive: 'Inactive' };
  ui.pill = function (status, label) {
    var text = label || LBL[status] || (CS.store.statusLabel ? CS.store.statusLabel(status) : status);
    return '<span class="pill pill--' + (PILL[status] || 'grey') + '">' + ui.esc(text) + '</span>';
  };
  ui.statusColor = function (s) { return { blue: 'var(--blue)', violet: 'var(--violet)', amber: 'var(--amber)', acc: 'var(--acc)', green: 'var(--green)', grey: 'var(--ink-4)', red: 'var(--red)' }[PILL[s] || 'grey']; };

  /* ---------- toast ---------- */
  var tbox;
  ui.toast = function (msg, kind, action) {
    if (!tbox) { tbox = document.createElement('div'); tbox.className = 'toasts'; tbox.setAttribute('role', 'status'); tbox.setAttribute('aria-live', 'polite'); document.body.appendChild(tbox); }
    var t = document.createElement('div');
    t.className = 'toast toast--' + (kind || 'ok');
    t.innerHTML = ui.icon(kind === 'err' ? 'alert' : kind === 'info' ? 'info' : 'check', 16, 2.2) + '<span>' + ui.esc(msg) + '</span>' + (action ? '<button type="button">' + ui.esc(action.label) + '</button>' : '');
    if (action) t.querySelector('button').onclick = function () { action.fn(); kill(); };
    tbox.appendChild(t);
    function kill() { t.classList.add('out'); setTimeout(function () { t.remove(); }, 260); }
    setTimeout(kill, kind === 'err' ? 5200 : 3400);
  };
  // wrap an action: shows its error as a toast, returns true on success
  ui.run = function (fn, okMsg) {
    try { var r = fn(); if (okMsg) ui.toast(typeof okMsg === 'function' ? okMsg(r) : okMsg); return r === undefined ? true : r; }
    catch (e) { if (!e.userFacing) console.error(e); ui.toast(e.userFacing ? e.message : 'Something went wrong — ' + e.message, 'err'); return false; }
  };

  /* ---------- modal / drawer / confirm ---------- */
  var openStack = [];
  ui.modal = function (o) {
    var ov = document.createElement('div');
    ov.className = 'ov' + (o.drawer ? ' ov--drawer' : '');
    var box = document.createElement('div');
    box.className = o.drawer ? 'drawer' : 'modal' + (o.size ? ' modal--' + o.size : '');
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
    box.innerHTML = '<div class="modal__h"><div><h2>' + ui.esc(o.title) + '</h2>' + (o.sub ? '<p>' + o.sub + '</p>' : '') + '</div><button class="btn btn--ghost btn--sm btn--icon" data-x aria-label="Close">' + ui.icon('x') + '</button></div>' +
      '<div class="modal__b">' + (o.body || '') + '</div>' + (o.foot !== false ? '<div class="modal__f">' + (o.foot || '<span class="sp"></span><button class="btn" data-x>Cancel</button>' + (o.ok ? '<button class="btn ' + (o.danger ? 'btn--danger-p' : 'btn--p') + '" data-ok>' + ui.esc(o.ok) + '</button>' : '')) + '</div>' : '');
    ov.appendChild(box);
    document.body.appendChild(ov);
    var prevFocus = document.activeElement;
    function close() { ov.remove(); openStack.pop(); if (prevFocus && prevFocus.focus) prevFocus.focus(); if (o.onClose) o.onClose(); }
    var api = { el: box, close: close };
    openStack.push(api);
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) close(); });
    box.querySelectorAll('[data-x]').forEach(function (b) { b.onclick = close; });
    var okb = box.querySelector('[data-ok]');
    if (okb && o.onOk) okb.onclick = function () { if (o.onOk(api) !== false) close(); };
    box.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && okb && o.onOk && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox') { e.preventDefault(); okb.click(); }
    });
    if (o.onOpen) o.onOpen(box, api);
    setTimeout(function () { var f = box.querySelector('[autofocus]') || box.querySelector('input:not([type=checkbox]):not([type=hidden]),select,textarea'); if (f) f.focus(); else (okb || box.querySelector('[data-x]')).focus(); }, 30);
    return api;
  };
  ui.closeTop = function () { var t = openStack[openStack.length - 1]; if (t) { t.close(); return true; } return false; };
  ui.confirm = function (o) {
    return new Promise(function (res) {
      var done = false;
      ui.modal({ title: o.title, body: '<p style="color:var(--ink-2)">' + o.body + '</p>', ok: o.ok || 'Confirm', danger: o.danger, onOk: function () { done = true; res(true); }, onClose: function () { if (!done) res(false); } });
    });
  };

  /* ---------- popover menu ---------- */
  var openPop = null;
  ui.closePop = function () { if (openPop) { openPop.remove(); openPop = null; } };
  ui.pop = function (anchor, html, opts) {
    ui.closePop();
    opts = opts || {};
    var p = document.createElement('div');
    p.className = 'pop ' + (opts.cls || '');
    p.innerHTML = html;
    document.body.appendChild(p);
    var r = anchor.getBoundingClientRect(), w = p.offsetWidth, h = p.offsetHeight;
    var left = opts.alignLeft ? r.left : r.right - w; left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
    var top = r.bottom + 6; if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 6);
    p.style.left = left + 'px'; p.style.top = top + 'px';
    openPop = p;
    setTimeout(function () { document.addEventListener('mousedown', outside); }, 0);
    function outside(e) { if (!p.contains(e.target) && e.target !== anchor && !anchor.contains(e.target)) { ui.closePop(); document.removeEventListener('mousedown', outside); } }
    return p;
  };
  ui.menu = function (anchor, items) {
    var html = items.map(function (it, i) {
      if (it === '-') return '<div class="msep"></div>';
      if (it.label && it.header) return '<div class="mlabel">' + ui.esc(it.label) + '</div>';
      return '<button class="mi' + (it.danger ? ' mi--danger' : '') + (it.on ? ' on' : '') + '" data-i="' + i + '"' + (it.disabled ? ' disabled title="' + ui.esc(it.disabled === true ? '' : it.disabled) + '"' : '') + '>' + (it.icon ? ui.icon(it.icon, 15) : '') + ui.esc(it.label) + (it.on ? '<span style="margin-left:auto">' + ui.icon('check', 14) + '</span>' : '') + '</button>';
    }).join('');
    var p = ui.pop(anchor, html);
    p.addEventListener('click', function (e) { var b = e.target.closest('[data-i]'); if (!b || b.disabled) return; ui.closePop(); items[+b.getAttribute('data-i')].fn(); });
  };

  /* ---------- forms ---------- */
  ui.field = function (label, control, opts) {
    opts = opts || {};
    return '<div class="f' + (opts.full ? ' f--full' : '') + '"' + (opts.attr || '') + '>' + (label ? '<label' + (opts.for ? ' for="' + opts.for + '"' : '') + '>' + label + (opts.req ? ' <span style="color:var(--acc)">*</span>' : '') + '</label>' : '') + control + (opts.hint ? '<span class="hint">' + opts.hint + '</span>' : '') + '</div>';
  };
  ui.input = function (name, val, opts) {
    opts = opts || {};
    return '<input class="inp' + (opts.cls ? ' ' + opts.cls : '') + '" name="' + name + '" id="f-' + name + '" value="' + ui.esc(val == null ? '' : val) + '"' + (opts.type ? ' type="' + opts.type + '"' : '') + (opts.ph ? ' placeholder="' + ui.esc(opts.ph) + '"' : '') + (opts.min != null ? ' min="' + opts.min + '"' : '') + (opts.max != null ? ' max="' + opts.max + '"' : '') + (opts.step ? ' step="' + opts.step + '"' : '') + (opts.req ? ' required' : '') + (opts.attr || '') + '>';
  };
  ui.select = function (name, options, val, opts) {
    opts = opts || {};
    return '<select class="sel' + (opts.cls ? ' ' + opts.cls : '') + '" name="' + name + '" id="f-' + name + '"' + (opts.attr || '') + '>' + (opts.placeholder ? '<option value="">' + ui.esc(opts.placeholder) + '</option>' : '') + options.map(function (o) {
      var v = typeof o === 'object' ? o.value : o, l = typeof o === 'object' ? o.label : o;
      return '<option value="' + ui.esc(v) + '"' + (String(v) === String(val) ? ' selected' : '') + (o.disabled ? ' disabled' : '') + '>' + ui.esc(l) + '</option>';
    }).join('') + '</select>';
  };
  ui.read = function (root) {
    var o = {};
    root.querySelectorAll('[name]').forEach(function (el) {
      if (el.type === 'checkbox') o[el.name] = el.checked;
      else if (el.type === 'radio') { if (el.checked) o[el.name] = el.value; }
      else o[el.name] = el.value;
    });
    return o;
  };

  /* ---------- CSV ---------- */
  ui.csv = function (filename, cols, rows) {
    function cell(v) { v = v == null ? '' : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
    var out = [cols.map(function (c) { return cell(c.label); }).join(',')].concat(rows.map(function (r) { return cols.map(function (c) { return cell(c.csv ? c.csv(r) : r[c.key]); }).join(','); })).join('\r\n');
    var blob = new Blob(['﻿' + out], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    ui.toast('Exported ' + rows.length + ' row' + (rows.length === 1 ? '' : 's') + ' to ' + filename);
  };

  /* ---------- data table ---------- */
  // opts: columns[{key,label,render(row),sort(row)->value,align,cls,csv}], rows, pageSize, selectable, onRowClick(row), empty, initialSort {key,dir}, onSelect(ids), rowId(row)
  ui.table = function (host, opts) {
    var st = { sort: opts.initialSort || null, page: 0, sel: {} };
    var rowId = opts.rowId || function (r) { return r.id; };
    function sorted() {
      var rows = opts.rows.slice();
      if (st.sort) {
        var col = opts.columns.filter(function (c) { return c.key === st.sort.key; })[0];
        var f = col && (col.sort || function (r) { return r[col.key]; });
        if (f) rows.sort(function (a, b) { var x = f(a), y = f(b); if (typeof x === 'string') { x = x.toLowerCase(); y = String(y).toLowerCase(); } return (x < y ? -1 : x > y ? 1 : 0) * (st.sort.dir === 'desc' ? -1 : 1); });
      }
      return rows;
    }
    function render() {
      var rows = sorted(), ps = opts.pageSize || 25, pages = Math.max(1, Math.ceil(rows.length / ps));
      if (st.page >= pages) st.page = pages - 1;
      var view = rows.slice(st.page * ps, st.page * ps + ps);
      var selIds = Object.keys(st.sel).filter(function (k) { return st.sel[k]; });
      var allOn = view.length && view.every(function (r) { return st.sel[rowId(r)]; });
      var h = '';
      if (opts.selectable && selIds.length && opts.bulk) h += '<div class="bulk"><span>' + selIds.length + ' selected</span><span style="flex:1"></span>' + opts.bulk(selIds) + '<button class="btn btn--sm" data-clear>Clear</button></div>';
      h += '<div class="tscroll"><table class="t' + (opts.compact ? ' t-compact' : '') + '"><thead><tr>';
      if (opts.selectable) h += '<th class="w-chk"><input type="checkbox" class="chk" data-all aria-label="Select all on page"' + (allOn ? ' checked' : '') + '></th>';
      opts.columns.forEach(function (c) {
        var sortable = c.sort !== false && c.label;
        var on = st.sort && st.sort.key === c.key;
        h += '<th class="' + (c.align || '') + (sortable ? ' sortable' : '') + (on ? ' sorted' : '') + '"' + (sortable ? ' data-sort="' + c.key + '"' : '') + (c.width ? ' style="width:' + c.width + '"' : '') + '>' + (c.label || '') + (sortable ? '<span class="arr">' + (on ? (st.sort.dir === 'desc' ? '▼' : '▲') : '▲') + '</span>' : '') + '</th>';
      });
      h += '</tr></thead><tbody>';
      if (!view.length) h += '<tr><td colspan="' + (opts.columns.length + (opts.selectable ? 1 : 0)) + '">' + (opts.empty || ui.empty('inbox', 'Nothing here yet', 'Try changing the filters.')) + '</td></tr>';
      view.forEach(function (r) {
        var id = rowId(r);
        h += '<tr data-id="' + ui.esc(id) + '" class="' + (opts.onRowClick ? 'clk' : '') + (st.sel[id] ? ' sel' : '') + '">';
        if (opts.selectable) h += '<td class="w-chk"><input type="checkbox" class="chk" data-chk="' + ui.esc(id) + '" aria-label="Select row"' + (st.sel[id] ? ' checked' : '') + '></td>';
        opts.columns.forEach(function (c) { h += '<td class="' + (c.align || '') + ' ' + (c.cls || '') + '">' + (c.render ? c.render(r) : ui.esc(r[c.key])) + '</td>'; });
        h += '</tr>';
      });
      h += '</tbody></table></div>';
      if (rows.length > ps || opts.showCount) {
        h += '<div class="pager"><span>' + (rows.length ? (st.page * ps + 1) + '–' + Math.min(rows.length, st.page * ps + ps) + ' of ' + ui.num(rows.length) : '0 results') + '</span><div class="row"><button class="btn btn--sm btn--icon" data-pg="-1" aria-label="Previous page"' + (st.page === 0 ? ' disabled' : '') + '>' + ui.icon('chevL') + '</button><span>Page ' + (st.page + 1) + ' of ' + pages + '</span><button class="btn btn--sm btn--icon" data-pg="1" aria-label="Next page"' + (st.page >= pages - 1 ? ' disabled' : '') + '>' + ui.icon('chevR') + '</button></div></div>';
      }
      host.innerHTML = h;
    }
    host.addEventListener('click', function (e) {
      var s = e.target.closest('[data-sort]');
      if (s) { var key = s.getAttribute('data-sort'); st.sort = st.sort && st.sort.key === key ? { key: key, dir: st.sort.dir === 'asc' ? 'desc' : 'asc' } : { key: key, dir: (opts.columns.filter(function (c) { return c.key === key; })[0].defaultDir || 'asc') }; render(); return; }
      var pg = e.target.closest('[data-pg]'); if (pg) { st.page += +pg.getAttribute('data-pg'); render(); host.scrollIntoView({ block: 'nearest' }); return; }
      if (e.target.closest('[data-clear]')) { st.sel = {}; render(); if (opts.onSelect) opts.onSelect([]); return; }
      if (e.target.matches('[data-chk],[data-all]') || e.target.closest('a,button,select,input,label')) return;
      var tr = e.target.closest('tr[data-id]');
      if (tr && opts.onRowClick) { var id = tr.getAttribute('data-id'); var row = opts.rows.filter(function (r) { return String(rowId(r)) === id; })[0]; if (row) opts.onRowClick(row, e); }
    });
    host.addEventListener('change', function (e) {
      if (e.target.matches('[data-chk]')) { st.sel[e.target.getAttribute('data-chk')] = e.target.checked; render(); }
      if (e.target.matches('[data-all]')) { var ps = opts.pageSize || 25; sorted().slice(st.page * ps, st.page * ps + ps).forEach(function (r) { st.sel[rowId(r)] = e.target.checked; }); render(); }
      if (opts.onSelect && e.target.matches('[data-chk],[data-all]')) opts.onSelect(Object.keys(st.sel).filter(function (k) { return st.sel[k]; }));
    });
    render();
    return {
      setRows: function (rows) { opts.rows = rows; st.page = 0; var ids = {}; rows.forEach(function (r) { ids[rowId(r)] = 1; }); Object.keys(st.sel).forEach(function (k) { if (!ids[k]) delete st.sel[k]; }); render(); },
      selected: function () { return Object.keys(st.sel).filter(function (k) { return st.sel[k]; }); },
      clear: function () { st.sel = {}; render(); },
      rows: function () { return sorted(); },
      render: render
    };
  };

  ui.empty = function (icon, title, text, action) {
    return '<div class="empty"><span class="ico-c">' + ui.icon(icon || 'inbox', 20) + '</span><b>' + ui.esc(title) + '</b>' + (text ? '<span>' + text + '</span>' : '') + (action || '') + '</div>';
  };
  ui.stockBar = function (avail, rp) {
    var max = Math.max(rp * 3, avail, 1), pct = Math.max(0, Math.min(100, avail / max * 100));
    var col = avail <= 0 ? 'var(--red)' : avail <= rp ? 'var(--amber)' : 'var(--green)';
    return '<div class="bar"><i style="width:' + pct + '%;background:' + col + '"></i></div>';
  };
})();
