/* ============================================================
   CIEL ADMIN — Reports & exports, Email campaigns, Subscribers.
   Reports are worked out in the browser from the real records Ciel Admin
   already loads (orders, payments, leads, projects, tasks). Test orders
   never count as revenue. Subscribers and campaigns come from
   /api/hq?route=subs|camps; emails are sent by the server (Resend).
   ============================================================ */
(function () {
  'use strict';
  var H, R = { per: 'month', from: '', to: '', tests: false }, C = { tab: 'campaigns', q: '', st: 'all', subs: null, camps: null, info: {} };
  var esc = function (s) { return H.esc(s); }, money = function (n) { return H.money(n); };
  var KN = { photobook: ['Photo Books', '#ff5a1f'], shop: ['Shop', '#2563eb'], domain: ['Domains', '#7c3aed'], whatsapp: ['WhatsApp', '#16a34a'], invoice: ['Invoices', '#0f766e'] };
  var IC = {
    dl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V3"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/></svg>',
    desk: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>'
  };

  /* ---------- CSV ---------- */
  function csv(name, rows) {
    var s = '﻿' + rows.map(function (r) { return r.map(function (v) { v = v == null ? '' : String(v); return /[",\n\r]/.test(v) || /^[=+\-@]/.test(v) ? '"' + (/^[=+\-@]/.test(v) ? "'" : '') + v.replace(/"/g, '""') + '"' : v; }).join(','); }).join('\r\n');
    var a = document.createElement('a'), u = URL.createObjectURL(new Blob([s], { type: 'text/csv;charset=utf-8' }));
    a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 60000);
    H.toast('Downloaded ' + name + ' · ' + (rows.length - 1) + ' row' + (rows.length === 2 ? '' : 's'), 'ok');
  }
  var day = function (t) { return t ? new Date(t).toISOString().slice(0, 10) : ''; };
  var time = function (t) { return t ? new Date(t).toLocaleString('sv-SE', { timeZone: 'Africa/Nairobi' }).slice(0, 16) : ''; };
  var phone = function (p) { p = String(p || '').replace(/[^\d]/g, ''); return p ? '+' + p : ''; };

  /* ---------- the period ---------- */
  function range() {
    var d = new Date(), y = d.getFullYear(), m = d.getMonth(), now = Date.now();
    switch (R.per) {
      case 'month': return { a: new Date(y, m, 1).getTime(), b: now, label: d.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' }) };
      case 'last': return { a: new Date(y, m - 1, 1).getTime(), b: new Date(y, m, 1).getTime(), label: new Date(y, m - 1, 1).toLocaleDateString('en-KE', { month: 'long', year: 'numeric' }) };
      case 'quarter': var q = Math.floor(m / 3) * 3; return { a: new Date(y, q, 1).getTime(), b: now, label: 'Q' + (q / 3 + 1) + ' ' + y };
      case 'year': return { a: new Date(y, 0, 1).getTime(), b: now, label: String(y) };
      case '12m': return { a: new Date(y, m - 11, 1).getTime(), b: now, label: 'Last 12 months' };
      case 'custom': var a = R.from ? new Date(R.from + 'T00:00').getTime() : 0, b = R.to ? new Date(R.to + 'T23:59:59').getTime() : now; return { a: a, b: b, label: (R.from || 'Start') + ' → ' + (R.to || 'today') };
      default: return { a: 0, b: now, label: 'All time' };
    }
  }
  var REF = /refund/, FAIL = /fail|cancel/;
  function stOf(o) { return REF.test(o.status) ? 'refunded' : o.paid ? 'paid' : FAIL.test(o.status) ? 'failed' : 'pending'; }
  function payWhen(o) { return (o.raw && (o.raw.paidAt || o.raw.paid_at)) || o.at; }
  function method(o) { var r = o.raw || {}; if (o.kind === 'whatsapp') return 'WhatsApp (arranged by hand)'; if (r.payment && r.payment.method === 'paybill') return 'M-Pesa Paybill'; if (r.method === 'card' || r.provider === 'card') return 'Card'; return o.paid || /await/.test(o.status) ? 'M-Pesa' : ''; }
  function code(o) { var r = o.raw || {}; return (r.payment && r.payment.code) || r.mpesaReceipt || r.receiptNumber || r.mpesa_receipt || ''; }
  function inR(o, rg) { var t = o.at || 0; return t >= rg.a && t <= rg.b; }

  /* ---------- reports ---------- */
  function reports() {
    var S = H.S, rg = range(), all = S.orders.filter(function (o) { return R.tests || !o.test; });
    var inP = all.filter(function (o) { return inR(o, rg); });
    var paid = inP.filter(function (o) { return stOf(o) === 'paid'; }), refunded = inP.filter(function (o) { return stOf(o) === 'refunded'; });
    var sum = function (l) { return l.reduce(function (n, o) { return n + (o.total || 0); }, 0); };
    var rev = sum(paid), avg = paid.length ? rev / paid.length : 0;
    /* previous period of the same length, for comparison */
    var len = rg.b - rg.a, prevPaid = rg.a ? all.filter(function (o) { return (o.at || 0) >= rg.a - len && (o.at || 0) < rg.a && stOf(o) === 'paid'; }) : [];
    var cmp = function (a, b) { if (!rg.a || R.per === 'all') return ''; if (!b) return a ? '<em class="up">new</em>' : ''; var p = Math.round((a - b) / b * 100); return '<em class="' + (p >= 0 ? 'up' : 'down') + '">' + (p >= 0 ? '↑' : '↓') + ' ' + Math.abs(p) + '%</em> vs previous'; };
    /* revenue by month: the chosen period (at least the last 6 months on screen) */
    var start = rg.a ? new Date(rg.a) : (all.length ? new Date(Math.min.apply(null, all.map(function (o) { return o.at || Date.now(); }))) : new Date());
    var months = [], cur = new Date(start.getFullYear(), start.getMonth(), 1), endM = new Date(rg.b);
    if ((endM.getFullYear() - cur.getFullYear()) * 12 + endM.getMonth() - cur.getMonth() < 5) cur = new Date(endM.getFullYear(), endM.getMonth() - 5, 1);
    while (cur <= endM && months.length < 36) { months.push({ k: cur.getFullYear() + '-' + String(cur.getMonth() + 1).padStart(2, '0'), d: new Date(cur), by: {} }); cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1); }
    all.filter(function (o) { return stOf(o) === 'paid'; }).forEach(function (o) { var d = new Date(o.at), k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'), m = months.filter(function (x) { return x.k === k; })[0]; if (m) m.by[o.kind] = (m.by[o.kind] || 0) + (o.total || 0); });
    var mtot = function (m) { return Object.keys(m.by).reduce(function (n, k) { return n + m.by[k]; }, 0); };
    var mx = Math.max(1, Math.max.apply(null, months.map(mtot))), W = 640, Hh = 200, bw = W / months.length;
    var bars = months.map(function (m, i) { var y = Hh - 20, out = ''; ['photobook', 'shop', 'domain', 'whatsapp', 'invoice'].forEach(function (k) { var v = m.by[k] || 0; if (!v) return; var h = v / mx * (Hh - 34); y -= h; out += '<rect x="' + (i * bw + bw * .18) + '" y="' + y + '" width="' + bw * .64 + '" height="' + h + '" rx="3" fill="' + KN[k][1] + '"><title>' + m.d.toLocaleDateString('en-KE', { month: 'short', year: 'numeric' }) + ' · ' + KN[k][0] + ': ' + money(v) + '</title></rect>'; }); if (!mtot(m)) out = '<rect x="' + (i * bw + bw * .18) + '" y="' + (Hh - 23) + '" width="' + bw * .64 + '" height="3" rx="1.5" class="rp-z"/>'; return out; }).join('');
    var step = Math.ceil(months.length / 8), ticks = months.map(function (m, i) { return i % step ? '' : '<span style="left:' + ((i + .5) / months.length * 100) + '%">' + m.d.toLocaleDateString('en-KE', { month: 'short' }) + (m.d.getMonth() === 0 || i === 0 ? ' ’' + String(m.d.getFullYear()).slice(2) : '') + '</span>'; }).join('');
    /* by product type */
    var byK = {}; paid.forEach(function (o) { var x = byK[o.kind] || (byK[o.kind] = { n: 0, v: 0 }); x.n++; x.v += o.total || 0; });
    var kRows = Object.keys(byK).sort(function (a, b) { return byK[b].v - byK[a].v; });
    /* photo books */
    var books = []; paid.filter(function (o) { return o.kind === 'photobook'; }).forEach(function (o) { (o.raw.items || []).forEach(function (it) { books.push({ o: o, it: it }); }); });
    var prints = books.filter(function (b) { return b.it.product === 'print'; }), pdfs = books.filter(function (b) { return b.it.product !== 'print'; });
    var copies = prints.reduce(function (n, b) { return n + (b.it.qty || 1); }, 0), pages = books.reduce(function (n, b) { return n + (b.it.pages || 0) * (b.it.product === 'print' ? (b.it.qty || 1) : 1); }, 0);
    var covers = {}; books.forEach(function (b) { var k = b.it.name || 'Photo book'; covers[k] = (covers[k] || 0) + 1; });
    var topC = Object.keys(covers).sort(function (a, b) { return covers[b] - covers[a]; }).slice(0, 6), cmx = Math.max.apply(null, [1].concat(topC.map(function (k) { return covers[k]; })));
    /* customers & leads */
    var firstPaid = {}; all.filter(function (o) { return stOf(o) === 'paid' && !o.test; }).forEach(function (o) { var k = (o.customer.email || '').toLowerCase() || String(o.customer.phone || '').replace(/\D/g, '').slice(-9); if (!k) return; if (!firstPaid[k] || o.at < firstPaid[k]) firstPaid[k] = o.at; });
    var newCust = Object.keys(firstPaid).filter(function (k) { return firstPaid[k] >= rg.a && firstPaid[k] <= rg.b; }).length;
    var leads = S.inbox.filter(function (m) { return m.kind !== 'whatsapp' && (m.createdAt || 0) >= rg.a && (m.createdAt || 0) <= rg.b; });
    var won = leads.filter(function (m) { return /approved|in_progress|completed/.test(m.stage || ''); }).length;
    var costs = (S.expenses || []).filter(function (x) { var t = new Date((x.date || '') + 'T12:00').getTime(); return t >= rg.a && t <= rg.b; }), cost = costs.reduce(function (n, x) { return n + (x.amount || 0); }, 0), profit = rev - cost;
    var byCat = {}; costs.forEach(function (x) { byCat[x.category || 'Other'] = (byCat[x.category || 'Other'] || 0) + (x.amount || 0); }); var catK = Object.keys(byCat).sort(function (a, b) { return byCat[b] - byCat[a]; }), catMx = Math.max.apply(null, [1].concat(catK.map(function (k) { return byCat[k]; })));
    var printCost = (byCat.Printing || 0) + (byCat.Materials || 0), perBook = copies + pdfs.length ? printCost / Math.max(1, copies) : 0;
    var stuck = S.orders.filter(function (o) { return !o.test && o.kind === 'photobook' && (o.status === 'paid' || o.status === 'preparing'); }).length;

    var b = H.body(
      '<div class="rp-bar"><div class="tabs" id="rpPer">' + [['month', 'This month'], ['last', 'Last month'], ['quarter', 'This quarter'], ['year', 'This year'], ['12m', '12 months'], ['all', 'All time'], ['custom', 'Dates…']].map(function (x) { return '<button data-v="' + x[0] + '"' + (R.per === x[0] ? ' class="is-on"' : '') + '>' + x[1] + '</button>'; }).join('') + '</div>' +
      (R.per === 'custom' ? '<div class="row rp-dates"><input class="hq-in" type="date" id="rpF" value="' + esc(R.from) + '"><span class="muted">to</span><input class="hq-in" type="date" id="rpT" value="' + esc(R.to) + '"></div>' : '') +
      '<label class="check rp-tests"><input type="checkbox" id="rpTe"' + (R.tests ? ' checked' : '') + '> Include test orders</label></div>' +
      '<div class="kpis"><div class="card kpi kpi--o"><i class="kpi__i">' + H.I.card + '</i><span>Revenue · ' + esc(rg.label) + '</span><b>' + money(rev) + '</b><small>' + cmp(rev, sum(prevPaid)) + (R.tests ? ' · tests included' : ' · tests not counted') + '</small></div>' +
      '<div class="card kpi kpi--b"><i class="kpi__i">' + H.I.orders + '</i><span>Paid orders</span><b>' + paid.length + '</b><small>' + cmp(paid.length, prevPaid.length) + '</small></div>' +
      '<div class="card kpi kpi--g"><i class="kpi__i">' + H.I.chart + '</i><span>Profit after costs</span><b>' + money(profit) + '</b><small>' + money(cost) + ' costs · ' + (rev ? Math.round(profit / rev * 100) + '% margin · ' : '') + 'avg order ' + money(avg) + '</small></div>' +
      '<div class="card kpi kpi--p"><i class="kpi__i">' + H.I.people + '</i><span>New paying customers</span><b>' + newCust + '</b><small>' + leads.length + ' new enquir' + (leads.length === 1 ? 'y' : 'ies') + ' · ' + won + ' won</small></div></div>' +
      '<div class="ov"><div class="ov__main">' +
      '<div class="card"><div class="card__h"><h2>Revenue by month</h2><span class="rp-leg">' + ['photobook', 'shop', 'domain', 'whatsapp', 'invoice'].map(function (k) { return '<span><i style="background:' + KN[k][1] + '"></i>' + KN[k][0] + '</span>'; }).join('') + '</span></div><div class="card__b"><div class="an-cw"><svg class="an-chart rp-chart" viewBox="0 0 ' + W + ' ' + Hh + '" preserveAspectRatio="none"><line x1="0" x2="' + W + '" y1="' + (Hh - 20) + '" y2="' + (Hh - 20) + '" stroke="var(--line)" vector-effect="non-scaling-stroke"/>' + bars + '</svg><div class="an-ticks">' + ticks + '</div></div><p class="faint" style="font-size:.76rem;margin-top:.5rem">Paid orders by the month they were placed. Tap a bar for the amount.</p></div></div>' +
      '<div class="card"><div class="card__h"><h2>Sales by product</h2><span class="muted" style="font-size:.8rem">' + esc(rg.label) + '</span></div>' + (kRows.length ? '<table class="tbl rp-tbl"><thead><tr><th>Product</th><th>Orders</th><th>Revenue</th><th class="hide-m">Share</th></tr></thead><tbody>' + kRows.map(function (k) { var p = rev ? Math.round(byK[k].v / rev * 100) : 0; return '<tr><td><span class="kind"><i style="background:' + KN[k][1] + '"></i>' + KN[k][0] + '</span></td><td>' + byK[k].n + '</td><td><b>' + money(byK[k].v) + '</b></td><td class="hide-m"><div class="rp-share"><i style="width:' + p + '%;background:' + KN[k][1] + '"></i></div><small>' + p + '%</small></td></tr>'; }).join('') + '</tbody></table>' : '<p class="empty">No paid orders in this period.</p>') + '</div>' +
      '</div><div class="ov__rail">' +
      '<div class="card rp-pb"><div class="card__h"><h2>Photo Books</h2><a class="b b--sm" href="#photobooks">Open</a></div><div class="card__b"><div class="rp-mini"><div><b>' + books.length + '</b><span>books sold</span></div><div><b>' + copies + '</b><span>printed copies</span></div><div><b>' + pdfs.length + '</b><span>digital (PDF)</span></div><div><b>' + (books.length ? Math.round(books.reduce(function (n, x) { return n + (x.it.pages || 0); }, 0) / books.length) : 0) + '</b><span>avg pages</span></div></div>' +
      (topC.length ? '<p class="rp-sub">Most popular covers</p><div class="an-hb">' + topC.map(function (k) { return '<div><div class="an-hb__l"><span>' + esc(k) + '</span><b>' + covers[k] + '</b></div><div class="an-hb__t"><i style="width:' + (covers[k] / cmx * 100) + '%;background:linear-gradient(90deg,#ff5a1f,#ffb04a)"></i></div></div>'; }).join('') + '</div>' : '<p class="muted" style="font-size:.85rem">No books sold in this period yet.</p>') +
      '<p class="faint" style="font-size:.76rem;margin-top:.8rem">' + pages.toLocaleString('en-KE') + ' pages to print in this period' + (stuck ? ' · ' + stuck + ' paid book' + (stuck === 1 ? '' : 's') + ' still waiting for pages' : '') + '.</p></div></div>' +
      '<div class="card rp-costs"><div class="card__h"><h2>Costs &amp; profit</h2><button class="b b--sm b--p" id="rpCost">' + H.I.plus + '<span>Add a cost</span></button></div><div class="card__b">' +
      '<div class="rp-pl"><div><span>Revenue</span><b>' + money(rev) + '</b></div><div><span>Costs</span><b>− ' + money(cost) + '</b></div><div class="is-p"><span>Profit</span><b>' + money(profit) + '</b></div></div>' +
      (catK.length ? '<div class="an-hb" style="margin-top:.9rem">' + catK.map(function (k) { return '<div><div class="an-hb__l"><span>' + esc(k) + '</span><b>' + money(byCat[k]) + '</b></div><div class="an-hb__t"><i style="width:' + (byCat[k] / catMx * 100) + '%;background:#6a3fd1"></i></div></div>'; }).join('') + '</div>' : '<p class="muted" style="font-size:.84rem;margin-top:.8rem">Add what you spend (printing, delivery, ads…) and Reports shows what you actually keep.</p>') +
      (printCost && copies ? '<p class="faint" style="font-size:.76rem;margin-top:.7rem">Printing &amp; materials ≈ ' + money(perBook) + ' per printed book in this period.</p>' : '') +
      (costs.length ? '<ul class="list rp-cl">' + costs.slice().sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); }).slice(0, 6).map(function (x) { return '<li data-cost="' + esc(x.id) + '"><div><b>' + money(x.amount) + ' · ' + esc(x.category) + '</b><small>' + H.d2(x.date + 'T12:00') + (x.note ? ' · ' + esc(x.note) : '') + (x.ref ? ' · ' + esc(x.ref) : '') + '</small></div></li>'; }).join('') + '</ul>' : '') + '</div></div>' +
      '<div class="card rp-ex"><div class="card__h"><h2>Exports</h2><span class="chip chip--o">CSV</span></div><div class="card__b"><p class="muted" style="font-size:.82rem;margin-bottom:.7rem">Spreadsheet files (open in Excel, Numbers or Google Sheets). Orders and payments follow the period above.</p><div class="rp-exg">' +
      [['orders', 'Orders', H.I.orders], ['payments', 'Payments', H.I.card], ['books', 'Photo Book items', H.I.book], ['customers', 'Customers', H.I.people], ['leads', 'Leads & enquiries', H.I.target], ['subscribers', 'Subscribers', IC.users], ['invoices', 'Invoices', H.I.pen], ['expenses', 'Costs', H.I.chart], ['tasks', 'Tasks', H.I.tasks], ['events', 'Calendar events', H.I.cal]].map(function (x) { return '<button class="rp-exb" data-ex="' + x[0] + '">' + x[2] + '<span>' + x[1] + '</span>' + IC.dl + '</button>'; }).join('') + '</div></div></div>' +
      '</div></div>'
    );
    b.querySelectorAll('#rpPer [data-v]').forEach(function (x) { x.onclick = function () { R.per = x.getAttribute('data-v'); reports(); }; });
    var f = b.querySelector('#rpF'), t = b.querySelector('#rpT'); if (f) f.onchange = function () { R.from = f.value; reports(); }; if (t) t.onchange = function () { R.to = t.value; reports(); };
    b.querySelector('#rpTe').onchange = function () { R.tests = this.checked; reports(); };
    b.querySelectorAll('[data-ex]').forEach(function (x) { x.onclick = function () { exp(x.getAttribute('data-ex'), x); }; });
    b.querySelector('#rpCost').onclick = function () { if (window.HQMoney) HQMoney.costModal(null, reports); };
    b.querySelectorAll('[data-cost]').forEach(function (li) { li.onclick = function () { var x = (S.expenses || []).filter(function (y) { return y.id === li.getAttribute('data-cost'); })[0]; if (x && window.HQMoney) HQMoney.costModal(JSON.parse(JSON.stringify(x)), reports); }; });
  }
  function stamp() { var rg = range(); return (R.per === 'all' ? 'all-time' : day(rg.a) + '_to_' + day(rg.b)); }
  function exp(what, btn) {
    var S = H.S, rg = range(), list = S.orders.filter(function (o) { return (R.tests || !o.test) && inR(o, rg); });
    if (what === 'orders') return csv('ciel-orders_' + stamp() + '.csv', [['Order', 'Type', 'Placed (Nairobi)', 'Status', 'Paid', 'Total (KES)', 'Customer', 'Email', 'Phone', 'Items', 'Delivery', 'Test']].concat(list.map(function (o) { var r = o.raw || {}, a = r.address; return [o.ref, KN[o.kind][0], time(o.at), o.label, o.paid ? 'yes' : 'no', o.total || 0, o.customer.name, o.customer.email, phone(o.customer.phone), o.summary, a ? [a.line1, a.area, a.town, a.county].filter(Boolean).join(', ') : (r.delivery && (r.delivery.name || r.delivery)) || '', o.test ? 'TEST' : '']; })));
    if (what === 'payments') return csv('ciel-payments_' + stamp() + '.csv', [['Order', 'Type', 'Paid on (Nairobi)', 'Amount (KES)', 'Status', 'Method', 'M-Pesa code', 'Customer', 'Phone', 'Test']].concat(list.filter(function (o) { var s = stOf(o); return s === 'paid' || s === 'refunded'; }).map(function (o) { return [o.ref, KN[o.kind][0], time(payWhen(o)), o.total || 0, stOf(o) === 'refunded' ? 'Refunded' : 'Paid', method(o), code(o), o.customer.name, phone(o.customer.phone), o.test ? 'TEST' : '']; })));
    if (what === 'books') { var rows = [['Order', 'Placed (Nairobi)', 'Book', 'Format', 'Pages', 'Copies', 'Order status', 'Customer', 'Phone', 'Test']]; list.filter(function (o) { return o.kind === 'photobook'; }).forEach(function (o) { (o.raw.items || []).forEach(function (it) { rows.push([o.ref, time(o.at), it.name, it.product === 'print' ? 'Printed hardcover' : 'PDF', it.pages, it.product === 'print' ? it.qty || 1 : '', o.label, o.customer.name, phone(o.customer.phone), o.test ? 'TEST' : '']); }); }); return csv('ciel-photobooks_' + stamp() + '.csv', rows); }
    if (what === 'customers') { var ppl = window.HQCrm && HQCrm.people ? HQCrm.people() : []; return csv('ciel-customers_' + day(Date.now()) + '.csv', [['Name', 'Email', 'Phone', 'Orders', 'Paid orders', 'Spent (KES)', 'Enquiries', 'Projects', 'Last contact']].concat(ppl.map(function (x) { return [x.name, x.email, phone(x.phone), x.orders.length, x.orders.filter(function (o) { return o.paid; }).length, x.spent, x.leads.length, x.projects.length, day(x.last)]; }))); }
    if (what === 'leads') return csv('ciel-leads_' + stamp() + '.csv', [['Received (Nairobi)', 'Type', 'Stage', 'Priority', 'Name', 'Email', 'Phone', 'Subject', 'Follow up', 'Notes']].concat(S.inbox.filter(function (m) { return m.kind !== 'whatsapp' && (m.createdAt || 0) >= rg.a && (m.createdAt || 0) <= rg.b; }).map(function (m) { var c = m.customer || {}; return [time(m.createdAt), m.kind === 'brief' ? 'Project brief' : 'Message', m.stage || m.status, m.priority || 'normal', c.name, c.email, phone(c.phone), m.subject, m.followUp || '', (m.notes || []).map(function (n) { return n.text; }).join(' | ')]; })));
    if (what === 'expenses') return csv('ciel-costs_' + stamp() + '.csv', [['Date', 'Amount (KES)', 'Category', 'Note', 'Order']].concat((S.expenses || []).filter(function (x) { var t = new Date((x.date || '') + 'T12:00').getTime(); return t >= rg.a && t <= rg.b; }).sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); }).map(function (x) { return [x.date, x.amount, x.category, x.note, x.ref]; })));
    if (what === 'invoices') return csv('ciel-invoices_' + stamp() + '.csv', [['Invoice', 'Date', 'Due', 'Client', 'Email', 'Phone', 'Items', 'Total (KES)', 'Status', 'Paid on', 'Method', 'M-Pesa code']].concat((S.invoices || []).filter(function (v) { var t = new Date((v.date || '') + 'T12:00').getTime(); return t >= rg.a && t <= rg.b; }).map(function (v) { return [v.number, v.date, v.due, v.client, v.email, v.phone, (v.items || []).map(function (l) { return l.desc + ' x' + l.qty + ' @ ' + l.price; }).join(' | '), v.total, v.status, v.paidAt, v.method, v.code]; })));
    if (what === 'tasks') return csv('ciel-tasks_' + day(Date.now()) + '.csv', [['Task', 'Status', 'Priority', 'Due', 'Tag', 'Order', 'Notes', 'Created']].concat(S.tasks.map(function (t) { return [t.title, t.status, t.priority, t.due, t.tag, t.ref, t.notes, day(t.createdAt)]; })));
    if (what === 'events') return csv('ciel-calendar_' + day(Date.now()) + '.csv', [['Date', 'End', 'Start', 'Finish', 'Title', 'Type', 'Location', 'Client', 'Notes']].concat(S.events.slice().sort(function (a, b) { return (a.date || '').localeCompare(b.date || ''); }).map(function (e) { return [e.date, e.end, e.allDay ? 'all day' : e.start, e.finish, e.title, e.type, e.location, e.client, e.notes]; })));
    if (what === 'subscribers') { if (btn) btn.disabled = true; return loadSubs(true).then(function () { if (btn) btn.disabled = false; subsCsv(C.subs); }, function (e) { if (btn) btn.disabled = false; H.toast(e.message, 'err'); }); }
  }
  function subsCsv(l) { csv('ciel-subscribers_' + day(Date.now()) + '.csv', [['Email', 'First name', 'Status', 'Signed up on', 'Joined', 'Confirmed', 'Unsubscribed', 'Emails received']].concat(l.map(function (s) { return [s.email, s.name, s.status, ({ home: 'Homepage', photobooks: 'Photo Books' })[s.source] || 'Website', day(s.createdAt), day(s.confirmedAt), day(s.unsubscribedAt), s.received || 0]; }))); }

  /* ---------- subscribers & campaigns ---------- */
  function loadSubs(force) { if (C.subs && !force) return Promise.resolve(); return H.api('/api/hq?route=subs').then(function (r) { C.subs = r.items || []; C.info.storage = r.storage; C.info.email = r.email; }); }
  function loadCamps(force) { if (C.camps && !force) return Promise.resolve(); return H.api('/api/hq?route=camps').then(function (r) { C.camps = r.items || []; C.info.from = r.from; C.info.email = r.email; C.info.storage = r.storage; }); }
  var AUD = { all: 'All confirmed subscribers', home: 'Signed up on the homepage', photobooks: 'Signed up on Photo Books' };
  function audCount(a) { return (C.subs || []).filter(function (s) { return s.status === 'confirmed' && (a === 'all' || !a || s.source === a); }).length; }
  function campaigns(sub) {
    if (sub === 'subscribers') C.tab = 'subscribers'; else if (sub === 'new') C.tab = 'campaigns';
    if (!C.subs || !C.camps) { H.body('<div class="card"><div class="card__b"><div class="sk" style="height:18px;width:40%"></div><div class="sk" style="height:12px;width:70%;margin-top:.8rem"></div></div></div>'); Promise.all([loadSubs(), loadCamps()]).then(function () { campaigns(sub); }, function (e) { H.body('<div class="card"><div class="card__b"><p class="muted">Couldn’t load campaigns: ' + esc(e.message) + '</p></div></div>'); }); return; }
    if (sub && /^c-/.test(sub)) { var c = C.camps.filter(function (x) { return x.id === sub.slice(2); })[0]; if (c) return editor(c); }
    if (sub === 'new') return editor(null);
    var subs = C.subs, conf = subs.filter(function (s) { return s.status === 'confirmed'; }), pend = subs.filter(function (s) { return s.status === 'pending'; }), un = subs.filter(function (s) { return s.status === 'unsubscribed'; });
    var sent = C.camps.filter(function (c) { return c.status === 'sent'; }), delivered = C.camps.reduce(function (n, c) { return n + (c.delivered || 0); }, 0);
    var month0 = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime(), fresh = conf.filter(function (s) { return (s.confirmedAt || 0) >= month0; }).length;
    var warn = !C.info.storage ? 'Connect the private Blob store to keep subscribers.' : !C.info.email ? 'Sending isn’t set up: add <b>RESEND_API_KEY</b> in Vercel (the same key order emails use).' : '';
    var h = (warn ? '<div class="ws-warn">' + warn + '</div>' : '') +
      '<div class="kpis"><div class="card kpi kpi--o"><i class="kpi__i">' + IC.users + '</i><span>Subscribers</span><b>' + conf.length + '</b><small>' + (fresh ? '+' + fresh + ' this month' : 'confirmed by email') + '</small></div>' +
      '<div class="card kpi kpi--y"><i class="kpi__i">' + H.I.mail + '</i><span>Waiting to confirm</span><b>' + pend.length + '</b><small>they haven’t tapped the email link yet</small></div>' +
      '<div class="card kpi kpi--b"><i class="kpi__i">' + IC.send + '</i><span>Campaigns sent</span><b>' + sent.length + '</b><small>' + delivered.toLocaleString('en-KE') + ' emails delivered</small></div>' +
      '<div class="card kpi kpi--g"><i class="kpi__i">' + H.I.chart + '</i><span>Unsubscribed</span><b>' + un.length + '</b><small>' + (subs.length ? Math.round(un.length / subs.length * 100) : 0) + '% of everyone who signed up</small></div></div>' +
      '<div class="cm-top"><div class="tabs" id="cmTab"><button data-t="campaigns"' + (C.tab === 'campaigns' ? ' class="is-on"' : '') + '>Campaigns<i>' + C.camps.length + '</i></button><button data-t="subscribers"' + (C.tab === 'subscribers' ? ' class="is-on"' : '') + '>Subscribers<i>' + subs.length + '</i></button></div>' +
      '<div class="row" style="gap:.4rem">' + (C.tab === 'subscribers' ? '<button class="b b--sm" id="cmCsv">' + IC.dl + '<span>Export CSV</span></button>' : '') + '<button class="b b--p" id="cmNew">' + H.I.plus + '<span>New campaign</span></button></div></div>';
    if (C.tab === 'campaigns') {
      var W = C.welcome;
      h += '<button class="card cm-wel" id="cmWel"><span class="cm-wel__i">' + H.I.mail + '</span><span class="cm-wel__m"><b>Welcome email</b><small>' + (W ? (W.on ? 'On · new subscribers get “' + esc(W.subject) + '” as soon as they confirm' : 'Off · switch it on to greet every new subscriber automatically') : 'Loading…') + '</small></span><span class="chip chip--' + (W && W.on ? 'g' : '') + '">' + (W && W.on ? 'On' : 'Off') + '</span></button>';
      h += C.camps.length ? '<div class="cm-list">' + C.camps.map(function (c) { var st = c.status === 'sent' ? ['g', 'Sent'] : c.status === 'sending' ? ['y', 'Sending · paused'] : c.status === 'scheduled' ? ['b', 'Scheduled · ' + H.dt(c.sendAt)] : ['', 'Draft']; return '<button class="card cm-card" data-c="' + esc(c.id) + '"><span class="cm-card__pic"' + (c.image ? ' style="background-image:url(' + esc(c.image) + ')"' : '') + '>' + (c.image ? '' : '<b>‹</b>') + '</span><span class="cm-card__m"><span class="row" style="gap:.4rem"><span class="chip chip--' + st[0] + '">' + st[1] + '</span><small>' + esc(AUD[c.audience || 'all']) + '</small></span><b>' + esc(c.subject || 'Untitled campaign') + '</b><small>' + (c.status === 'sent' ? 'Sent ' + H.dt(c.sentAt) + ' · ' + (c.delivered || 0) + ' delivered' : c.status === 'sending' ? (c.delivered || 0) + ' of ' + (c.queued || 0) + ' sent · open to carry on' : 'Edited ' + H.dt(c.updatedAt)) + '</small></span></button>'; }).join('') + '</div>'
        : '<div class="card cm-empty"><div class="cm-empty__art">‹</div><h3>Your first campaign</h3><p>Tell subscribers about new covers, a seasonal offer or a website you just launched. Write it once, preview it on a phone, send yourself a test, then send it to everyone who confirmed.</p><button class="b b--p" id="cmNew2">' + H.I.plus + '<span>Write a campaign</span></button></div>';
      h += '<p class="faint" style="font-size:.78rem">People join with the sign-up boxes on the homepage, the Photo Books page and <a href="/subscribe" target="_blank" rel="noopener">cielafrica.com/subscribe</a>. Only people who confirmed by email get campaigns, and every email has a one-click unsubscribe link.</p>';
    } else {
      var q = C.q.toLowerCase(), list = subs.filter(function (s) { return (C.st === 'all' || s.status === C.st) && (!q || (s.email + ' ' + (s.name || '')).toLowerCase().indexOf(q) >= 0); });
      h += '<div class="card"><div class="card__h" style="flex-wrap:wrap;gap:.5rem"><div class="tabs" id="cmSt">' + [['all', 'Everyone'], ['confirmed', 'Confirmed'], ['pending', 'Waiting'], ['unsubscribed', 'Unsubscribed']].map(function (x) { return '<button data-s="' + x[0] + '"' + (C.st === x[0] ? ' class="is-on"' : '') + '>' + x[1] + '</button>'; }).join('') + '</div><input class="hq-in" id="cmQ" type="search" placeholder="Search email or name" value="' + esc(C.q) + '" style="max-width:260px;margin-left:auto"></div>' +
        (list.length ? '<table class="tbl cm-tbl"><thead><tr><th>Subscriber</th><th>Status</th><th class="hide-m">Signed up on</th><th class="hide-m">Joined</th><th></th></tr></thead><tbody>' + list.map(function (s) { var t = { confirmed: ['g', 'Confirmed'], pending: ['y', 'Waiting'], unsubscribed: ['', 'Unsubscribed'] }[s.status] || ['', s.status]; return '<tr data-id="' + esc(s.id) + '"><td><b>' + esc(s.email) + '</b><small>' + esc(s.name || '') + (s.received ? (s.name ? ' · ' : '') + s.received + ' email' + (s.received === 1 ? '' : 's') : '') + '</small></td><td><span class="chip chip--' + t[0] + '">' + t[1] + '</span></td><td class="hide-m"><small>' + esc(({ home: 'Homepage', photobooks: 'Photo Books' })[s.source] || 'Website') + '</small></td><td class="hide-m"><small>' + H.d2(s.createdAt) + '</small></td><td style="text-align:right"><button class="b b--sm b--ghost" data-sm="' + esc(s.id) + '" aria-label="More">•••</button></td></tr>'; }).join('') + '</tbody></table>' : '<p class="empty">' + (subs.length ? 'Nobody matches.' : 'No subscribers yet. They’ll appear here as soon as someone signs up on the website.') + '</p>') + '</div>';
    }
    var b = H.body(h);
    b.querySelectorAll('#cmTab [data-t]').forEach(function (x) { x.onclick = function () { C.tab = x.getAttribute('data-t'); history.replaceState(null, '', '#campaigns' + (C.tab === 'subscribers' ? '/subscribers' : '')); campaigns(); }; });
    var wl = b.querySelector('#cmWel'); if (wl) wl.onclick = welcome;
    if (!C.welcome) H.api('/api/hq?route=settings-get&k=welcome').then(function (r) { C.welcome = r.value; if ((location.hash || '#').indexOf('#campaigns') === 0 && document.getElementById('cmWel')) campaigns(); }, function () { });
    [b.querySelector('#cmNew'), b.querySelector('#cmNew2')].forEach(function (x) { if (x) x.onclick = function () { location.hash = '#campaigns/new'; }; });
    b.querySelectorAll('[data-c]').forEach(function (x) { x.onclick = function () { location.hash = '#campaigns/c-' + x.getAttribute('data-c'); }; });
    var cs = b.querySelector('#cmCsv'); if (cs) cs.onclick = function () { subsCsv(C.subs); };
    b.querySelectorAll('#cmSt [data-s]').forEach(function (x) { x.onclick = function () { C.st = x.getAttribute('data-s'); campaigns(); }; });
    var cq = b.querySelector('#cmQ'); if (cq) cq.oninput = function () { C.q = cq.value; var p = cq.selectionStart; campaigns(); var n = document.getElementById('cmQ'); n.focus(); n.setSelectionRange(p, p); };
    b.querySelectorAll('[data-sm]').forEach(function (x) { x.onclick = function (e) { e.stopPropagation(); subMenu(C.subs.filter(function (s) { return s.id === x.getAttribute('data-sm'); })[0]); }; });
  }
  function subMenu(s) {
    if (!s) return;
    var m = H.modal('<h2>' + esc(s.email) + '</h2><dl class="dl"><dt>Status</dt><dd>' + esc(s.status) + '</dd><dt>Name</dt><dd>' + esc(s.name || '—') + '</dd><dt>Signed up</dt><dd>' + H.dt(s.createdAt) + ' · ' + esc(({ home: 'Homepage', photobooks: 'Photo Books' })[s.source] || 'Website') + '</dd><dt>Confirmed</dt><dd>' + (s.confirmedAt ? H.dt(s.confirmedAt) : '—') + '</dd><dt>Emails sent</dt><dd>' + (s.received || 0) + '</dd></dl>' +
      '<div class="row" style="gap:.5rem;flex-wrap:wrap">' + (s.status !== 'unsubscribed' ? '<button class="b" data-op="unsubscribe">Unsubscribe them</button>' : '') + '<button class="b" data-op="delete" style="color:var(--r)">' + IC.trash + '<span>Delete their record</span></button><button class="b b--ghost" data-x>Close</button></div><p class="faint" style="font-size:.78rem">Delete removes the email address completely (for “please delete my data” requests). Unsubscribe keeps the record so they’re never emailed again.</p>');
    m.querySelectorAll('[data-op]').forEach(function (x) { x.onclick = function () {
      var op = x.getAttribute('data-op'); (op === 'delete' ? HQAsk.confirm('Delete ' + s.email + ' completely? This can’t be undone.') : Promise.resolve(true)).then(function (ok) { if (!ok) return; x.disabled = true; H.api('/api/hq?route=sub-admin', { id: s.id, op: op }).then(function (r) { m.remove(); if (op === 'delete') C.subs = C.subs.filter(function (y) { return y.id !== s.id; }); else C.subs = C.subs.map(function (y) { return y.id === s.id ? r.item : y; }); H.toast(op === 'delete' ? 'Deleted' : 'Unsubscribed', 'ok'); campaigns(); }, function (e) { x.disabled = false; H.toast(e.message, 'err'); }); });
}; });
  }
  var PICS = [['Safari spread', 'https://cielafrica.com/assets/img/pb-demo/sf1.webp?v=2'], ['Lion', 'https://cielafrica.com/assets/img/pb-demo/sf2.webp?v=2'], ['Maasai portrait', 'https://cielafrica.com/assets/img/pb-demo/sf4.webp?v=2'], ['Serengeti cover', 'https://cielafrica.com/assets/pbk/c/3/xl/kenya-serengeti-0.webp'], ['Zanzibar cover', 'https://cielafrica.com/assets/pbk/c/3/xl/travel-zanzibar.webp'], ['Our Story cover', 'https://cielafrica.com/assets/pbk/c/3/xl/couple-our-story-0.webp'], ['Ciel Africa banner', 'https://www.cielafrica.com/assets/img/og.png?v=20261025d']];
  function editor(c) {
    var draft = c ? JSON.parse(JSON.stringify(c)) : { subject: '', preheader: '', kicker: 'Ciel Africa', title: '', body: '', image: '', btnLabel: '', btnUrl: 'https://cielafrica.com/photobooks', audience: 'all', status: 'draft' };
    var locked = !/^(draft|scheduled)$/.test(draft.status), n = audCount(draft.audience || 'all');
    var f = function (k, lab, ph, max, area) { return '<label class="field"><span>' + lab + '</span>' + (area ? '<textarea class="hq-in cm-body" data-k="' + k + '" rows="9" placeholder="' + esc(ph) + '" maxlength="' + max + '"' + (locked ? ' disabled' : '') + '>' + esc(draft[k] || '') + '</textarea>' : '<input class="hq-in" data-k="' + k + '" value="' + esc(draft[k] || '') + '" placeholder="' + esc(ph) + '" maxlength="' + max + '"' + (locked ? ' disabled' : '') + '>') + '</label>'; };
    var b = H.body('<div class="cm-ed"><div class="cm-ed__f">' +
      '<div class="row" style="gap:.5rem"><a class="b b--sm" href="#campaigns">' + H.I.l + '<span>Campaigns</span></a><span class="ws-st' + (locked ? '' : ' is-draft') + '" id="cmSt2">' + (draft.status === 'sent' ? 'Sent ' + H.dt(draft.sentAt) : draft.status === 'sending' ? 'Sending paused' : draft.status === 'scheduled' ? 'Scheduled for ' + H.dt(draft.sendAt) : c ? 'Draft saved' : 'New draft') + '</span></div>' +
      (locked && draft.status === 'sent' ? '<div class="ws-warn">This campaign went out to ' + (draft.delivered || 0) + ' people. Duplicate it to send something similar.</div>' : '') +
      '<div class="card"><div class="card__h"><h2>The email</h2></div><div class="card__b cm-grid">' +
      f('subject', 'Subject line', 'e.g. New: Kenya covers are here', 140) + f('preheader', 'Preview text (shown after the subject in the inbox)', 'e.g. Nairobi, Mombasa and the Serengeti, ready for your photos', 160) +
      '<div class="g2">' + f('kicker', 'Small label at the top', 'Ciel Africa', 40) + f('title', 'Headline', 'e.g. Made for Kenya.', 140) + '</div>' +
      f('body', 'Message', 'Write it like a note to a friend.\n\nA blank line starts a new paragraph.\n- Lines that start with a dash become a list\n**Two stars** make words bold.', 12000, true) +
      '<p class="faint" style="font-size:.76rem;margin-top:-.3rem">Blank line = new paragraph · “- ” = list · **bold** · links are made clickable.</p></div></div>' +
      '<div class="card"><div class="card__h"><h2>Picture and button</h2></div><div class="card__b cm-grid">' +
      f('image', 'Picture (a link starting https://)', 'https://cielafrica.com/…', 500) +
      (locked ? '' : '<div class="cm-pics">' + PICS.map(function (p) { return '<button type="button" data-pic="' + esc(p[1]) + '" title="' + esc(p[0]) + '" style="background-image:url(' + esc(p[1].replace('https://cielafrica.com', '').replace('https://www.cielafrica.com', '')) + ')"></button>'; }).join('') + '<button type="button" data-pic="" class="cm-pics__none" title="No picture">None</button></div>') +
      '<div class="g2">' + f('btnLabel', 'Button text (optional)', 'e.g. See the Kenya covers', 60) + f('btnUrl', 'Button link', 'https://cielafrica.com/photobooks/kenya', 500) + '</div></div></div>' +
      '<div class="card"><div class="card__h"><h2>Who gets it</h2></div><div class="card__b cm-grid"><select class="hq-in" data-k="audience"' + (locked ? ' disabled' : '') + '>' + Object.keys(AUD).map(function (k) { return '<option value="' + k + '"' + ((draft.audience || 'all') === k ? ' selected' : '') + '>' + AUD[k] + ' (' + audCount(k) + ')</option>'; }).join('') + '</select>' +
      '<p class="muted" style="font-size:.8rem">Sent from ' + esc(C.info.from || 'Ciel Africa <hello@cielafrica.com>') + '. Replies go to hello@cielafrica.com.</p></div></div>' +
      '<div class="cm-acts">' + (locked && draft.status === 'sent' ? '<button class="b b--p" id="cmDup">' + IC.copy + '<span>Duplicate</span></button>' :
        (draft.status === 'sending' ? '<button class="b b--p" id="cmGo">' + IC.send + '<span>Carry on sending</span></button>' : '<button class="b" id="cmSave">Save draft</button><button class="b" id="cmTest">' + H.I.mail + '<span>Send me a test</span></button><button class="b" id="cmSch">' + H.I.cal + '<span>' + (draft.status === 'scheduled' ? 'Change time' : 'Schedule') + '</span></button>' + (draft.status === 'scheduled' ? '<button class="b b--ghost" id="cmUns">Unschedule</button>' : '') + '<button class="b b--p" id="cmGo">' + IC.send + '<span>Send now to <b id="cmN">' + n + '</b></span></button>')) +
      (c && draft.status !== 'sending' ? '<button class="b b--ghost" id="cmDel" style="margin-left:auto;color:var(--r)">' + IC.trash + '<span>Delete</span></button>' : '') + '</div>' +
      '<div class="cm-prog" id="cmProg" hidden><div class="cm-prog__t"><b id="cmPt">Sending…</b><span id="cmPn"></span></div><div class="cm-prog__b"><i id="cmPb"></i></div><p class="faint" style="font-size:.76rem">Keep this page open until it finishes. If it stops, open the campaign and tap Carry on sending: nobody gets it twice.</p></div>' +
      '</div><div class="cm-ed__pv"><div class="cm-pvbar"><b>' + IC.eye + ' Preview</b><div class="tabs" id="cmDev"><button data-w="phone" class="is-on">' + IC.phone + '</button><button data-w="desk">' + IC.desk + '</button></div></div><div class="cm-pvw is-phone" id="cmPvw"><iframe id="cmPv" title="Email preview" sandbox="allow-same-origin"></iframe></div></div></div>');
    var pv = b.querySelector('#cmPv'), timer;
    function grab() { b.querySelectorAll('[data-k]').forEach(function (x) { draft[x.getAttribute('data-k')] = x.value; }); return draft; }
    function preview() { clearTimeout(timer); timer = setTimeout(function () { H.api('/api/hq?route=camp-preview', grab()).then(function (r) { pv.srcdoc = r.html; }, function () { }); }, 350); }
    b.querySelectorAll('[data-k]').forEach(function (x) { x.addEventListener('input', function () { preview(); setSt('Unsaved changes', 'is-busy'); if (x.getAttribute('data-k') === 'audience') { var cn = b.querySelector('#cmN'); if (cn) cn.textContent = audCount(x.value); } }); x.addEventListener('change', preview); });
    b.querySelectorAll('[data-pic]').forEach(function (x) { x.onclick = function () { var i = b.querySelector('[data-k="image"]'); i.value = x.getAttribute('data-pic'); preview(); setSt('Unsaved changes', 'is-busy'); }; });
    b.querySelectorAll('#cmDev [data-w]').forEach(function (x) { x.onclick = function () { b.querySelectorAll('#cmDev button').forEach(function (y) { y.classList.toggle('is-on', y === x); }); b.querySelector('#cmPvw').className = 'cm-pvw is-' + x.getAttribute('data-w'); }; });
    function setSt(t, cls) { var s = b.querySelector('#cmSt2'); if (s) { s.textContent = t; s.className = 'ws-st ' + (cls || ''); } }
    function save() { setSt('Saving…', 'is-busy'); return H.api('/api/hq?route=camp-save', grab()).then(function (r) { draft = r.item; C.camps = [r.item].concat(C.camps.filter(function (x) { return x.id !== r.item.id; })); if (!c) { c = r.item; history.replaceState(null, '', '#campaigns/c-' + r.item.id); } setSt(r.item.status === 'scheduled' ? 'Scheduled for ' + H.dt(r.item.sendAt) : 'Draft saved', 'is-draft'); return r.item; }, function (e) { setSt('Not saved', 'is-err'); throw e; }); }
    var sv = b.querySelector('#cmSave'); if (sv) sv.onclick = function () { save().then(function () { H.toast('Draft saved', 'ok'); }, function (e) { H.toast(e.message, 'err'); }); };
    var ts = b.querySelector('#cmTest'); if (ts) ts.onclick = function () {
      HQAsk.prompt('Send a test to which email address?', localStorage.getItem('cm_test') || 'lorna@cielafrica.com').then(function (to) { if (!to) return;
      try { localStorage.setItem('cm_test', to); } catch (e) { }
      ts.disabled = true; save().then(function (it) { return H.api('/api/hq?route=camp-test', { id: it.id, to: to }); }).then(function () { ts.disabled = false; H.toast('Test sent to ' + to + '. Check the inbox (and Promotions).', 'ok'); }, function (e) { ts.disabled = false; H.toast(e.message, 'err'); }); }); };
    var go = b.querySelector('#cmGo'); if (go) go.onclick = function () {
      var count = draft.status === 'sending' ? (draft.queued || 0) - (draft.delivered || 0) : audCount(grab().audience);
      if (draft.status !== 'sending' && !count) return H.toast('Nobody in this audience has confirmed yet.', 'err');
      (draft.status === 'sending' ? Promise.resolve(true) : HQAsk.confirm('Send “' + (draft.subject || 'this campaign') + '” to ' + count + ' subscriber' + (count === 1 ? '' : 's') + ' now? This can’t be undone.', { title: 'Send campaign', ok: 'Send now', primary: true })).then(function (ok) {
        if (!ok) return;
        go.disabled = true; var p = b.querySelector('#cmProg'); p.hidden = false; b.querySelectorAll('.cm-acts .b').forEach(function (x) { x.disabled = true; });
        (draft.status === 'sending' ? Promise.resolve(draft) : save()).then(function (it) { loop(it.id); }, function (e) { go.disabled = false; H.toast(e.message, 'err'); });
      });
      function loop(id) {
        H.api('/api/hq?route=camp-send', { id: id }).then(function (r) {
          var tot = r.total || r.sent + r.remaining + r.failed, pc = tot ? Math.round((r.sent + r.failed) / tot * 100) : 100;
          b.querySelector('#cmPb').style.width = pc + '%'; b.querySelector('#cmPn').textContent = r.sent + ' of ' + tot + ' sent' + (r.failed ? ' · ' + r.failed + ' skipped (unsubscribed)' : '');
          C.camps = [r.camp].concat(C.camps.filter(function (x) { return x.id !== r.camp.id; }));
          if (r.done) { b.querySelector('#cmPt').textContent = 'Sent ✓'; H.toast('Campaign sent to ' + r.sent + ' people', 'ok'); setTimeout(function () { location.hash = '#campaigns'; }, 1400); return; }
          setTimeout(function () { loop(id); }, 600);
        }, function (e) { b.querySelector('#cmPt').textContent = 'Paused'; H.toast(e.message, 'err'); go.disabled = false; go.querySelector('span').textContent = 'Carry on sending'; draft.status = 'sending'; b.querySelectorAll('.cm-acts .b').forEach(function (x) { x.disabled = false; }); });
      }
    };
    var sch = b.querySelector('#cmSch'); if (sch) sch.onclick = function () {
      var d0 = draft.sendAt ? new Date(draft.sendAt) : new Date(Date.now() + 864e5), loc = function (d) { var z = function (n) { return String(n).padStart(2, '0'); }; return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()) + 'T' + z(d.getHours()) + ':' + z(d.getMinutes()); };
      if (!draft.sendAt) d0.setHours(9, 0, 0, 0);
      var m = H.modal('<h2>Schedule this campaign</h2><p class="muted" style="font-size:.86rem">It goes out at the first check after this time: Ciel Admin checks every few minutes while it’s open, and every morning at about 6:20 even when it’s closed.</p><label class="field"><span>Send on</span><input class="hq-in" type="datetime-local" id="scAt" min="' + loc(new Date()) + '" value="' + loc(d0) + '"></label><p class="faint" style="font-size:.78rem">To ' + audCount(grab().audience) + ' confirmed subscriber' + (audCount(grab().audience) === 1 ? '' : 's') + ' (anyone who confirms before then is included).</p><div class="row"><button class="b b--p" id="scOk">' + H.I.cal + '<span>Schedule</span></button><button class="b b--ghost" data-x>Cancel</button></div>');
      m.querySelector('#scOk').onclick = function () { var v = m.querySelector('#scAt').value; if (!v) return; var t = new Date(v); if (!(t.getTime() > Date.now() - 60000)) return H.toast('Pick a time in the future.', 'err'); save().then(function (it) { return H.api('/api/hq?route=camp-schedule', { id: it.id, at: t.toISOString() }); }).then(function (r) { m.remove(); C.camps = [r.item].concat(C.camps.filter(function (x) { return x.id !== r.item.id; })); H.toast('Scheduled for ' + H.dt(r.item.sendAt), 'ok'); location.hash = '#campaigns'; }, function (e) { H.toast(e.message, 'err'); }); };
    };
    var uns = b.querySelector('#cmUns'); if (uns) uns.onclick = function () { H.api('/api/hq?route=camp-schedule', { id: draft.id, at: null }).then(function (r) { C.camps = [r.item].concat(C.camps.filter(function (x) { return x.id !== r.item.id; })); H.toast('Back to draft', 'ok'); editor(r.item); }, function (e) { H.toast(e.message, 'err'); }); };
    var dp = b.querySelector('#cmDup'); if (dp) dp.onclick = function () { var d2 = { subject: draft.subject, preheader: draft.preheader, kicker: draft.kicker, title: draft.title, body: draft.body, image: draft.image, btnLabel: draft.btnLabel, btnUrl: draft.btnUrl, audience: draft.audience }; H.api('/api/hq?route=camp-save', d2).then(function (r) { C.camps = [r.item].concat(C.camps); location.hash = '#campaigns/c-' + r.item.id; }, function (e) { H.toast(e.message, 'err'); }); };
    var dl = b.querySelector('#cmDel'); if (dl) dl.onclick = function () { HQAsk.confirm('Delete this campaign' + (draft.status === 'sent' ? ' from the history' : '') + '?').then(function (ok) { if (!ok) return; H.api('/api/hq?route=camp-del', { id: c.id }).then(function () { C.camps = C.camps.filter(function (x) { return x.id !== c.id; }); location.hash = '#campaigns'; }, function (e) { H.toast(e.message, 'err'); }); }); };
    preview();
  }


  /* ---------- welcome email (sent once, when someone confirms) ---------- */
  function welcome() {
    var w = JSON.parse(JSON.stringify(C.welcome || {}));
    var f = function (k, lab, area) { return '<label class="field"><span>' + lab + '</span>' + (area ? '<textarea class="hq-in" data-w="' + k + '" rows="6">' + esc(w[k] || '') + '</textarea>' : '<input class="hq-in" data-w="' + k + '" value="' + esc(w[k] || '') + '">') + '</label>'; };
    var m = H.modal('<div class="row" style="justify-content:space-between"><h2>Welcome email</h2><button class="b b--sm b--ghost" data-x>' + H.I.x + '</button></div>' +
      '<label class="check wel-on"><input type="checkbox" id="wOn"' + (w.on ? ' checked' : '') + '> Send this to every new subscriber when they confirm</label>' +
      '<div class="wel-g"><div class="cm-grid">' + f('subject', 'Subject line') + f('title', 'Headline ({first} or {, first} adds their first name)') + f('body', 'Message', true) + '<div class="g2">' + f('btnLabel', 'Button text') + f('btnUrl', 'Button link') + '</div>' + f('image', 'Picture link (optional, https://…)') +
      '<p class="faint" style="font-size:.76rem">Want to offer a discount? Make a coupon in Photo Books → Prices &amp; pages, then mention the code here.</p><div class="row"><button class="b b--p" id="wS">Save</button></div></div>' +
      '<div class="wel-pv"><iframe id="wPv" title="Preview" sandbox="allow-same-origin"></iframe></div></div>');
    m.querySelector('.modal__p').classList.add('wel-modal');
    var t; function pv() { clearTimeout(t); t = setTimeout(function () { m.querySelectorAll('[data-w]').forEach(function (x) { w[x.getAttribute('data-w')] = x.value; }); var fill = function (s) { return String(s || '').replace(/\{, ?first\}/g, ', Amina').replace(/\{first\}/g, 'Amina'); }; H.api('/api/hq?route=camp-preview', { subject: fill(w.subject), kicker: w.kicker || 'Welcome', title: fill(w.title), body: fill(w.body), image: w.image, btnLabel: w.btnLabel, btnUrl: w.btnUrl }).then(function (r) { m.querySelector('#wPv').srcdoc = r.html; }, function () { }); }, 300); }
    m.querySelectorAll('[data-w]').forEach(function (x) { x.oninput = pv; }); pv();
    m.querySelector('#wS').onclick = function () { m.querySelectorAll('[data-w]').forEach(function (x) { w[x.getAttribute('data-w')] = x.value; }); w.on = m.querySelector('#wOn').checked; H.api('/api/hq?route=settings-save', { k: 'welcome', v: w }).then(function (r) { C.welcome = r.value; m.remove(); H.toast('Welcome email ' + (r.value.on ? 'is on' : 'saved (off)'), 'ok'); campaigns(); }, function (e) { H.toast(e.message, 'err'); }); };
  }

  /* ---------- reviews ---------- */
  var RV = { items: null, set: null, f: 'all' };
  function stars(n) { var s = ''; for (var i = 1; i <= 5; i++) s += '<i class="' + (i <= n ? 'on' : '') + '">★</i>'; return '<span class="rv-st">' + s + '</span>'; }
  function reviews() {
    if (!RV.items) { H.body('<div class="card"><div class="card__b"><div class="sk" style="height:18px;width:40%"></div></div></div>'); H.api('/api/hq?route=reviews').then(function (r) { RV.items = r.items || []; RV.set = r.settings || { auto: true, days: 3 }; reviews(); }, function (e) { H.body('<div class="card"><div class="card__b"><p class="muted">' + esc(e.message) + '</p></div></div>'); }); return; }
    var L = RV.items, avg = L.length ? L.reduce(function (n, r) { return n + r.stars; }, 0) / L.length : 0, wait = L.filter(function (r) { return r.status === 'new'; }), live = L.filter(function (r) { return r.status === 'approved'; });
    var vis = L.filter(function (r) { return RV.f === 'all' || (RV.f === 'new' ? r.status === 'new' : RV.f === 'live' ? r.status === 'approved' : r.status === 'hidden'); });
    var b = H.body('<div class="kpis"><div class="card kpi kpi--o"><i class="kpi__i">' + H.I.star + '</i><span>Average rating</span><b>' + (L.length ? avg.toFixed(1) + ' / 5' : '—') + '</b><small>' + L.length + ' review' + (L.length === 1 ? '' : 's') + '</small></div>' +
      '<div class="card kpi kpi--y"><i class="kpi__i">' + H.I.inbox + '</i><span>Waiting for you</span><b>' + wait.length + '</b><small>new, not shown yet</small></div>' +
      '<div class="card kpi kpi--g"><i class="kpi__i">' + H.I.globe + '</i><span>On the website</span><b>' + live.length + '</b><small>Photo Books page</small></div>' +
      '<div class="card kpi kpi--b"><i class="kpi__i">' + H.I.mail + '</i><span>Asking automatically</span><b>' + (RV.set.auto ? 'On' : 'Off') + '</b><small>' + (RV.set.auto ? RV.set.days + ' days after delivery' : 'ask from each order') + '</small></div></div>' +
      '<div class="card"><div class="card__h" style="flex-wrap:wrap;gap:.5rem"><div class="tabs" id="rvF">' + [['all', 'All'], ['new', 'New'], ['live', 'On the website'], ['hidden', 'Hidden']].map(function (x) { return '<button data-f="' + x[0] + '"' + (RV.f === x[0] ? ' class="is-on"' : '') + '>' + x[1] + '</button>'; }).join('') + '</div>' +
      '<div class="row rv-set" style="margin-left:auto"><label class="check"><input type="checkbox" id="rvA"' + (RV.set.auto ? ' checked' : '') + '> Ask by email</label><select class="hq-in" id="rvD" style="width:auto">' + [1, 2, 3, 5, 7, 14].map(function (d) { return '<option value="' + d + '"' + (RV.set.days === d ? ' selected' : '') + '>' + d + ' day' + (d === 1 ? '' : 's') + ' after delivery</option>'; }).join('') + '</select></div></div>' +
      (vis.length ? '<div class="rv-list">' + vis.map(function (r) { return '<div class="rv"><div class="rv__t">' + stars(r.stars) + '<span class="chip chip--' + (r.status === 'approved' ? 'g' : r.status === 'hidden' ? '' : 'y') + '">' + (r.status === 'approved' ? 'On the website' : r.status === 'hidden' ? 'Hidden' : 'New') + '</span>' + (r.publish ? '<span class="chip">May be shown</span>' : '<span class="chip chip--k">Private: don’t show</span>') + '<small>' + H.dt(r.at) + '</small></div>' +
        (r.text ? '<p class="rv__x">“' + esc(r.text) + '”</p>' : '<p class="rv__x muted">No words, just stars.</p>') + '<div class="rv__f"><b>' + esc(r.name || 'No name') + '</b>' + (r.town ? ' · ' + esc(r.town) : '') + ' · ' + esc(r.kind) + ' · <a href="#orders/' + esc(r.ref) + '">' + esc(r.ref) + '</a></div>' +
        '<div class="row" style="gap:.4rem">' + (r.status !== 'approved' && r.publish ? '<button class="b b--sm b--p" data-ro="approve" data-id="' + esc(r.id) + '">Show on website</button>' : '') + (r.status !== 'hidden' ? '<button class="b b--sm" data-ro="hide" data-id="' + esc(r.id) + '">' + (r.status === 'approved' ? 'Take off website' : 'Hide') + '</button>' : '') + '<button class="b b--sm b--ghost" data-ro="delete" data-id="' + esc(r.id) + '" style="color:var(--r)">Delete</button></div></div>'; }).join('') + '</div>'
        : '<div class="cm-empty"><div class="cm-empty__art">‹</div><h3>' + (L.length ? 'Nothing here' : 'No reviews yet') + '</h3><p>' + (L.length ? 'Try another filter.' : 'A few days after an order is marked delivered, the customer gets one email asking how it went. You can also ask from any order (Ask for a review), or send the link on WhatsApp with the “Delivered + review” quick reply. Only reviews you approve, from people who agreed, appear on the Photo Books page.') + '</p></div>') + '</div>');
    b.querySelectorAll('#rvF [data-f]').forEach(function (x) { x.onclick = function () { RV.f = x.getAttribute('data-f'); reviews(); }; });
    var saveSet = function () { H.api('/api/hq?route=settings-save', { k: 'reviews', v: { auto: b.querySelector('#rvA').checked, days: +b.querySelector('#rvD').value } }).then(function (r) { RV.set = r.value; H.toast('Saved', 'ok'); reviews(); }, function (e) { H.toast(e.message, 'err'); }); };
    b.querySelector('#rvA').onchange = saveSet; b.querySelector('#rvD').onchange = saveSet;
    b.querySelectorAll('[data-ro]').forEach(function (x) { x.onclick = function () {
      var op = x.getAttribute('data-ro'), id = x.getAttribute('data-id');
      (op === 'delete' ? HQAsk.confirm('Delete this review? This can’t be undone.') : Promise.resolve(true)).then(function (ok) {
        if (!ok) return; x.disabled = true;
        H.api('/api/hq?route=review-admin', { id: id, op: op }).then(function (r) { RV.items = op === 'delete' ? RV.items.filter(function (y) { return y.id !== id; }) : RV.items.map(function (y) { return y.id === id ? r.item : y; }); H.toast(op === 'approve' ? 'Now on the website' : op === 'hide' ? 'Hidden' : 'Deleted', 'ok'); reviews(); }, function (e) { x.disabled = false; H.toast(e.message, 'err'); });
      });
    }; });
  }
  /* scheduled campaigns: while Ciel Admin is open, send the ones that are due */
  function due() { if (document.hidden) return; H.api('/api/hq?route=camp-due', {}).then(function (r) { if (r.due) { C.camps = null; H.toast('Scheduled campaign sent' + (r.sent ? ' to ' + r.sent + ' people' : ''), 'ok'); if ((location.hash || '').indexOf('#campaigns') === 0) campaigns(); } }, function () { }); }
  window.HQGrow = { init: function (h) { H = h; setTimeout(due, 20000); setInterval(due, 600000); }, reports: reports, campaigns: campaigns, reviews: reviews, refresh: function () { C.subs = null; C.camps = null; RV.items = null; } };
})();
