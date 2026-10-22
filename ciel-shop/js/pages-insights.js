/* ============================================================
   CIEL SHOP — Dashboard, Analytics, Reports
   ============================================================ */
(function () {
  'use strict';
  var ui = CS.ui, store = CS.store, app = CS.app, charts = CS.charts;
  var COL = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)', 'var(--c6)'];
  var HEX = ['#C4532B', '#2F62B8', '#2F8A57', '#B7791F', '#6E4FB0', '#8C8A82'];
  function S() { return store.state; }
  function greeting() { var h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; }
  function kpi(label, icon, value, deltaHtml, foot, spark, href) {
    return '<' + (href ? 'a href="' + href + '"' : 'div') + ' class="card kpi">' + (spark || '') + '<div class="kpi__l">' + ui.icon(icon, 14) + label + '</div><div class="kpi__v num">' + value + '</div><div class="kpi__f">' + (deltaHtml || '') + '<span>' + foot + '</span></div></' + (href ? 'a' : 'div') + '>';
  }
  function money(v) { return '<small>KES</small>' + ui.num(v); }
  function movLabel(t) { return { receipt: 'Received', sale: 'Shipped', transfer_in: 'Transfer in', transfer_out: 'Transfer out', adjustment: 'Adjustment', damage: 'Damaged', return: 'Returned', return_damaged: 'Return (damaged)', expired: 'Expired', disposed: 'Disposed' }[t] || t; }
  app.movLabel = movLabel;

  /* ================= DASHBOARD ================= */
  CS.route('/dashboard', function () {
    var r = store.periodRange(app.period), pr = store.periodRange(app.period, 1);
    var m = store.metrics(r), pm = store.metrics(pr);
    var ser = store.salesSeries(r), pser = store.salesSeries(pr);
    var restock = store.lowStock(), invVal = store.stockValue(), invPrev = store.inventoryValueAt(r.start), restockPrev = store.restockCountAt(r.start);
    var me = store.me(), biz = S().business;
    var outCount = restock.filter(function (x) { return x.s.available <= 0; }).length;
    var html = '<div class="welcome"><div><h1>' + greeting() + ', ' + ui.esc(me.name.split(' ')[0]) + '</h1><p>Here’s how ' + ui.esc(biz.name) + ' is doing over ' + app.periodLabel() + '.</p></div><div class="ph__acts"><a class="btn" href="#/inventory?do=receive">' + ui.icon('receive', 15) + 'Receive stock</a><a class="btn btn--p" href="#/orders/new">' + ui.icon('plus', 15) + 'Create order</a></div></div>';
    html += '<div class="grid g-kpi">' +
      kpi('Net sales', 'coins', money(m.net), ui.delta(m.net, pm.net), app.prevLabel(), '<span class="kpi__spark">' + charts.spark(ser.map(function (b) { return b.sales; }), HEX[0]) + '</span>', '#/analytics') +
      kpi('Orders', 'cart', ui.num(m.orders), ui.delta(m.orders, pm.orders), ui.num(m.units) + ' units sold', '<span class="kpi__spark">' + charts.spark(ser.map(function (b) { return b.orders; }), HEX[1]) + '</span>', '#/orders') +
      kpi('Avg. order value', 'receipt', money(m.aov), ui.delta(m.aov, pm.aov), 'after discounts', '', '#/analytics') +
      kpi('Gross profit', 'percent', money(m.profit), ui.delta(m.profit, pm.profit), ui.pct(m.margin) + ' margin, ex-VAT', '', '#/analytics') +
      kpi('Need restocking', 'alert', String(restock.length), ui.delta(restock.length, restockPrev, true), outCount + ' out of stock', '', '#/inventory?status=low') +
      kpi('Inventory value', 'layers', money(invVal), ui.delta(invVal, invPrev), 'at cost, all warehouses', '', '#/inventory') + '</div>';

    html += '<div class="grid g-main" style="margin-top:16px"><div class="card"><div class="card__h"><h3>Sales over time</h3><div class="row"><div class="legend" id="dl"></div><div class="seg" id="sm"><button data-m="sales" class="on">Sales</button><button data-m="orders">Orders</button></div></div></div><div class="card__b"><div id="c-sales"></div></div></div>' +
      '<div class="card"><div class="card__h"><h3>Sales by channel</h3><a class="link" href="#/analytics">Details ' + ui.icon('arrowR', 13) + '</a></div><div class="card__b" id="c-chan"></div></div></div>';

    var cats = store.byCategory(r), top = store.topProducts(r, 5), ful = store.fulfilment(r), pful = store.fulfilment(pr);
    html += '<div class="grid g-3" style="margin-top:16px">' +
      '<div class="card"><div class="card__h"><h3>Revenue by category</h3><span class="sub">' + ui.esc(app.periodLabel()) + '</span></div><div class="card__b">' + (cats.length ? charts.hbars(cats.map(function (c, i) { return { label: c.label, value: c.value, color: COL[i % 6] }; }), { fmt: ui.moneyShort }) : ui.empty('chart', 'No sales in this period', 'Try a longer period.')) + '</div></div>' +
      '<div class="card card--flush"><div class="card__h"><h3>Best-selling products</h3><a class="link" href="#/analytics?tab=products">All ' + ui.icon('arrowR', 13) + '</a></div><div class="card__b" style="padding-top:8px">' + (top.length ? top.map(function (t, i) { var p = store.product(t.productId); return '<a class="lrow" href="#/products/' + p.id + '">' + ui.thumb(p, 34) + '<div class="lrow__m"><div class="lrow__t">' + ui.esc(p.name) + '</div><div class="lrow__s">' + ui.num(t.units) + ' units · ' + p.category + '</div></div><div class="lrow__r"><b class="num">' + ui.moneyShort(t.revenue) + '</b></div></a>'; }).join('') : ui.empty('box', 'No products sold yet', '')) + '</div></div>' +
      '<div class="card"><div class="card__h"><h3>Fulfilment performance</h3><a class="link" href="#/board">Board ' + ui.icon('arrowR', 13) + '</a></div><div class="card__b"><div class="grid g-2" style="gap:10px">' +
      '<div style="background:var(--bg);border-radius:12px;padding:12px"><div class="kpi__l">Shipped within 48h</div><div class="kpi__v num" style="font-size:22px">' + (ful.shipped ? ui.pct(ful.within48, 0) : '—') + '</div><div class="kpi__f">' + (ful.shipped && pful.shipped ? ui.delta(ful.within48, pful.within48) : '') + '</div></div>' +
      '<div style="background:var(--bg);border-radius:12px;padding:12px"><div class="kpi__l">Avg. time to ship</div><div class="kpi__v num" style="font-size:22px">' + (ful.shipped ? ful.avgHours.toFixed(0) + 'h' : '—') + '</div><div class="kpi__f">' + (ful.shipped && pful.shipped ? ui.delta(ful.avgHours, pful.avgHours, true) : '') + '</div></div></div>' +
      '<div class="kv" style="margin-top:14px"><dt>Orders shipped</dt><dd class="num">' + ui.num(ful.shipped) + '</dd><dt>Orders delivered</dt><dd class="num">' + ui.num(ful.delivered) + '</dd><dt>Excludes</dt><dd>store pickups</dd></div></div></div></div>';

    var recent = S().orders.filter(function (o) { return o.fulfilment !== 'draft'; }).slice(-7).reverse();
    var alerts = store.notifications().filter(function (n) { return n.kind !== 'info'; }).slice(0, 6);
    html += '<div class="grid g-main" style="margin-top:16px"><div class="card card--flush"><div class="card__h"><h3>Recent orders</h3><a class="link" href="#/orders">View all ' + ui.icon('arrowR', 13) + '</a></div><div class="card__b" style="padding-top:10px"><div class="tscroll"><table class="t t-compact"><thead><tr><th>Order</th><th>Customer</th><th>Channel</th><th>Payment</th><th>Fulfilment</th><th class="r">Total</th></tr></thead><tbody>' +
      (recent.length ? recent.map(function (o) { var c = store.customer(o.customerId); return '<tr class="clk" data-href="#/orders/' + o.id + '"><td><b>' + o.number + '</b><div class="pcell__s">' + ui.rel(o.createdAt) + '</div></td><td>' + ui.esc(c ? c.name : '—') + '</td><td class="muted">' + o.channel + '</td><td>' + ui.pill(o.payment.status) + '</td><td>' + ui.pill(o.fulfilment) + '</td><td class="r num"><b>' + ui.money(store.total(o)) + '</b></td></tr>'; }).join('') : '<tr><td colspan="6">' + ui.empty('cart', 'No orders yet', '') + '</td></tr>') + '</tbody></table></div></div></div>' +
      '<div class="card card--flush"><div class="card__h"><h3>Operational alerts</h3><span class="sub">' + alerts.length + ' need attention</span></div><div class="card__b" style="padding-top:8px">' + (alerts.length ? alerts.map(function (n) { return '<a class="lrow" href="' + n.link + '"><span class="ico-c ' + (n.kind === 'danger' ? 'ico-c--red' : 'ico-c--amber') + '">' + ui.icon(n.icon, 15) + '</span><div class="lrow__m"><div class="lrow__t">' + ui.esc(n.title) + '</div><div class="lrow__s">' + ui.esc(n.body) + '</div></div>' + ui.icon('chevR', 14) + '</a>'; }).join('') : ui.empty('check', 'Nothing needs attention', 'Stock, orders and batches all look healthy.')) + '</div></div></div>';

    var counts = {}; ['new', 'processing', 'packing', 'ready', 'shipped'].forEach(function (s) { counts[s] = S().orders.filter(function (o) { return o.fulfilment === s; }).length; });
    var pendingPay = S().orders.filter(function (o) { return o.payment.status === 'pending' && o.fulfilment !== 'cancelled' && o.fulfilment !== 'draft'; }).length;
    var moves = S().movements.slice(-7).reverse();
    html += '<div class="grid g-3" style="margin-top:16px">' +
      '<div class="card card--flush"><div class="card__h"><h3>Low stock</h3><a class="link" href="#/inventory?status=low">Inventory ' + ui.icon('arrowR', 13) + '</a></div><div class="card__b" style="padding-top:8px">' + (restock.length ? restock.slice(0, 5).map(function (x) { return '<a class="lrow" href="#/products/' + x.p.id + '">' + ui.thumb(x.p, 32) + '<div class="lrow__m"><div class="lrow__t">' + ui.esc(x.p.name) + '</div><div class="lrow__s">Reorder at ' + x.p.reorderPoint + (x.s.incoming ? ' · ' + x.s.incoming + ' incoming' : ' · nothing on order') + '</div></div><div class="lrow__r">' + ui.pill(x.s.available <= 0 ? 'out' : 'low', x.s.available + ' left') + '</div></a>'; }).join('') : ui.empty('check', 'Everything is well stocked', '')) + '</div></div>' +
      '<div class="card card--flush"><div class="card__h"><h3>Pending fulfilment</h3><a class="link" href="#/board">Order board ' + ui.icon('arrowR', 13) + '</a></div><div class="card__b" style="padding-top:8px">' +
      [['new', 'Confirm new orders', 'inbox'], ['processing', 'Start picking', 'list'], ['packing', 'Finish packing', 'box'], ['ready', 'Hand to courier', 'truck'], ['shipped', 'Awaiting delivery', 'pin']].map(function (x) { return '<a class="lrow" href="#/board"><span class="ico-c" style="color:' + ui.statusColor(x[0]) + '">' + ui.icon(x[2], 15) + '</span><div class="lrow__m"><div class="lrow__t">' + x[1] + '</div><div class="lrow__s">' + store.statusLabel(x[0]) + '</div></div><b class="num">' + counts[x[0]] + '</b></a>'; }).join('') +
      '<a class="lrow" href="#/orders?pay=pending"><span class="ico-c ico-c--amber">' + ui.icon('wallet', 15) + '</span><div class="lrow__m"><div class="lrow__t">Collect payment</div><div class="lrow__s">Pay on delivery & invoices</div></div><b class="num">' + pendingPay + '</b></a></div></div>' +
      '<div class="card card--flush"><div class="card__h"><h3>Recent inventory activity</h3><a class="link" href="#/inventory?tab=movements">Movements ' + ui.icon('arrowR', 13) + '</a></div><div class="card__b" style="padding-top:8px">' + moves.map(function (mv) { var p = store.product(mv.productId); var w = store.warehouse(mv.warehouseId); var q = mv.qty || mv.damagedQty || 0; return '<a class="lrow" href="#/products/' + p.id + '"><span class="ico-c ' + (q > 0 && mv.type !== 'return_damaged' ? 'ico-c--green' : mv.type === 'sale' ? 'ico-c--blue' : 'ico-c--amber') + '">' + ui.icon(q > 0 ? 'down' : 'up', 14) + '</span><div class="lrow__m"><div class="lrow__t">' + ui.esc(p.name) + '</div><div class="lrow__s">' + movLabel(mv.type) + ' · ' + (w ? w.code : '') + ' · ' + ui.rel(mv.at) + '</div></div><b class="num" style="color:' + (mv.qty > 0 ? 'var(--green)' : 'var(--ink)') + '">' + (mv.qty > 0 ? '+' : '') + (mv.qty || (mv.damagedQty ? mv.damagedQty + ' dmg' : 0)) + '</b></a>'; }).join('') + '</div></div></div>';

    html += '<div class="card" style="margin-top:16px"><div class="card__h"><h3>Stock movement &amp; inventory value</h3><div class="legend"><span><i style="background:' + HEX[2] + '"></i>Units in</span><span><i style="background:' + HEX[0] + '"></i>Units out</span></div></div><div class="card__b"><div class="grid g-main" style="gap:24px;align-items:center"><div id="c-mv"></div><div id="c-iv"></div></div></div></div>';

    return {
      title: 'Dashboard', crumbs: [], period: true, html: html,
      mount: function (el) {
        var mode = 'sales';
        function drawSales() {
          var cur = ser.map(function (b) { return mode === 'sales' ? b.sales : b.orders; }), prev = ser.map(function (b, i) { var p = pser[i]; return p ? (mode === 'sales' ? p.sales : p.orders) : 0; });
          charts.line(el.querySelector('#c-sales'), { labels: ser.map(function (b) { return b.label; }), height: 250, fmt: mode === 'sales' ? ui.money : ui.num, series: [{ name: 'This period', values: cur, color: HEX[0] }, { name: 'Previous period', values: prev, color: '#A8A49A', dashed: true }], aria: 'Sales over time' });
          el.querySelector('#dl').innerHTML = '<span><i style="background:' + HEX[0] + '"></i>This period</span><span><i class="dash"></i>Previous</span>';
        }
        drawSales();
        el.querySelector('#sm').addEventListener('click', function (e) { var b = e.target.closest('[data-m]'); if (!b) return; mode = b.getAttribute('data-m'); el.querySelectorAll('#sm button').forEach(function (x) { x.classList.toggle('on', x === b); }); drawSales(); });
        var ch = store.byChannel(r);
        charts.donut(el.querySelector('#c-chan'), { items: ch.map(function (c, i) { return { label: c.label, value: c.value, color: HEX[i % 6] }; }), fmt: ui.moneyShort, centerSub: 'net sales' });
        el.querySelectorAll('tr[data-href]').forEach(function (tr) { tr.addEventListener('click', function () { app.go(tr.getAttribute('data-href')); }); });
        // stock in/out per bucket + inventory value line
        var bks = store.buckets(r), inn = bks.map(function () { return 0; }), out = bks.map(function () { return 0; });
        S().movements.forEach(function (mv) {
          var t = new Date(mv.at).getTime(); if (t < r.start.getTime() || mv.type === 'transfer_in' || mv.type === 'transfer_out') return;
          for (var i = 0; i < bks.length; i++) if (t >= bks[i].start.getTime() && t < bks[i].end.getTime()) { if (mv.qty > 0) inn[i] += mv.qty; else out[i] += mv.qty; break; }
        });
        charts.bars(el.querySelector('#c-mv'), { labels: bks.map(function (b) { return b.label; }), diverging: true, height: 200, series: [{ name: 'Units in', values: inn, color: HEX[2] }, { name: 'Units out', values: out, color: HEX[0] }], aria: 'Units in and out' });
        var vals = bks.map(function (b) { return store.inventoryValueAt(b.end); });
        charts.line(el.querySelector('#c-iv'), { labels: bks.map(function (b) { return b.label; }), height: 200, fmt: ui.money, yFmt: ui.short, series: [{ name: 'Inventory value', values: vals, color: HEX[1] }], aria: 'Inventory value at cost' });
      }
    };
  });

  /* ================= ANALYTICS ================= */
  CS.route('/analytics', function (p, q) {
    var tab = q.tab || 'sales';
    var r = store.periodRange(app.period), pr = store.periodRange(app.period, 1);
    var m = store.metrics(r), pm = store.metrics(pr);
    var html = app.ph('Analytics', 'Every figure is calculated from the same order, return and stock records — compared ' + app.prevLabel().replace('vs ', 'with the ') + '.', '<button class="btn" id="exp">' + ui.icon('download', 15) + 'Export CSV</button>');
    html += app.tabs([['sales', 'Sales', '#/analytics?tab=sales'], ['products', 'Products', '#/analytics?tab=products'], ['inventory', 'Inventory', '#/analytics?tab=inventory'], ['returns', 'Returns', '#/analytics?tab=returns']], tab);
    var exporter = null, mount = null;

    if (tab === 'sales') {
      html += '<div class="grid g-4">' +
        kpi('Gross sales', 'coins', money(m.gross), ui.delta(m.gross, pm.gross), 'merchandise after discounts', '') +
        kpi('Refunds', 'undo', money(m.refunds), ui.delta(m.refunds, pm.refunds, true), 'returns & goodwill', '') +
        kpi('Net sales', 'wallet', money(m.net), ui.delta(m.net, pm.net), 'incl. 16% VAT', '') +
        kpi('Gross profit', 'percent', money(m.profit), ui.delta(m.profit, pm.profit), ui.pct(m.margin) + ' margin (ex-VAT)', '') +
        kpi('Orders', 'cart', ui.num(m.orders), ui.delta(m.orders, pm.orders), 'excl. drafts & cancelled', '') +
        kpi('Avg. order value', 'receipt', money(m.aov), ui.delta(m.aov, pm.aov), 'gross sales ÷ orders', '') +
        kpi('Units sold', 'box', ui.num(m.units), ui.delta(m.units, pm.units), 'across all products', '') +
        kpi('Cost of goods', 'layers', money(m.cogs), ui.delta(m.cogs, pm.cogs, true), 'net of restocked returns', '') + '</div>';
      html += '<div class="grid g-2" style="margin-top:16px"><div class="card"><div class="card__h"><h3>Revenue trend</h3><div class="legend"><span><i style="background:' + HEX[0] + '"></i>This period</span><span><i class="dash"></i>Previous</span></div></div><div class="card__b"><div id="a-rev"></div></div></div>' +
        '<div class="card"><div class="card__h"><h3>Order volume</h3><div class="legend"><span><i style="background:' + HEX[1] + '"></i>Orders</span></div></div><div class="card__b"><div id="a-ord"></div></div></div>' +
        '<div class="card"><div class="card__h"><h3>Average order value</h3></div><div class="card__b"><div id="a-aov"></div></div></div>' +
        '<div class="card"><div class="card__h"><h3>Sales by category</h3></div><div class="card__b"><div id="a-cat"></div></div></div></div>';
      var chs = store.byChannel(r), pchs = store.byChannel(pr), tot = chs.reduce(function (t, c) { return t + c.value; }, 0);
      html += '<div class="card card--flush" style="margin-top:16px"><div class="card__h"><h3>Sales by channel</h3></div><div class="card__b" style="padding-top:10px"><div class="tscroll"><table class="t"><thead><tr><th>Channel</th><th class="r">Orders</th><th class="r">Net sales</th><th class="r">AOV</th><th>Share</th><th class="r">Change</th></tr></thead><tbody>' +
        chs.map(function (c, i) { var pc = pchs.filter(function (x) { return x.label === c.label; })[0] || { value: 0 }; return '<tr><td><span class="row"><i style="width:9px;height:9px;border-radius:3px;background:' + HEX[i % 6] + '"></i><b>' + c.label + '</b></span></td><td class="r num">' + ui.num(c.orders) + '</td><td class="r num">' + ui.money(c.value) + '</td><td class="r num">' + (c.orders ? ui.money(c.value / c.orders) : '—') + '</td><td style="min-width:140px"><div class="row"><div class="bar" style="flex:1"><i style="width:' + (tot ? c.value / tot * 100 : 0) + '%;background:' + HEX[i % 6] + '"></i></div><span class="muted num" style="width:38px;text-align:right">' + (tot ? Math.round(c.value / tot * 100) : 0) + '%</span></div></td><td class="r">' + ui.delta(c.value, pc.value) + '</td></tr>'; }).join('') + '</tbody></table></div></div></div>';
      exporter = function () {
        var s = store.salesSeries(r);
        ui.csv('ciel-shop-sales-' + app.period + '.csv', [{ label: 'Period start', csv: function (b) { return b.start.toISOString().slice(0, 10); } }, { label: 'Orders', key: 'orders' }, { label: 'Gross sales (KES)', csv: function (b) { return Math.round(b.sales); } }, { label: 'AOV (KES)', csv: function (b) { return b.orders ? Math.round(b.sales / b.orders) : 0; } }], s);
      };
      mount = function (el) {
        var s = store.salesSeries(r), ps = store.salesSeries(pr), labels = s.map(function (b) { return b.label; });
        charts.line(el.querySelector('#a-rev'), { labels: labels, fmt: ui.money, series: [{ name: 'This period', values: s.map(function (b) { return b.sales; }), color: HEX[0] }, { name: 'Previous', values: s.map(function (b, i) { return ps[i] ? ps[i].sales : 0; }), color: '#A8A49A', dashed: true }] });
        charts.bars(el.querySelector('#a-ord'), { labels: labels, height: 240, series: [{ name: 'Orders', values: s.map(function (b) { return b.orders; }), color: HEX[1] }] });
        charts.line(el.querySelector('#a-aov'), { labels: labels, fmt: ui.money, height: 220, series: [{ name: 'AOV', values: s.map(function (b) { return b.orders ? b.sales / b.orders : 0; }), color: HEX[4] }] });
        var cats = store.byCategory(r);
        charts.donut(el.querySelector('#a-cat'), { items: cats.map(function (c, i) { return { label: c.label, value: c.value, color: HEX[i % 6] }; }), fmt: ui.moneyShort, size: 170, centerSub: 'merchandise' });
      };
    }

    if (tab === 'products') {
      var top = store.topProducts(r, 200), ptop = {}; store.topProducts(pr, 200).forEach(function (t) { ptop[t.productId] = t; });
      var vat = 1 + (S().business.vatRate || 0);
      var rows = top.map(function (t) { var p = store.product(t.productId); var gp = t.revenue / vat - t.cost; return { id: p.id, p: p, units: t.units, revenue: t.revenue, profit: gp, margin: t.revenue ? gp / (t.revenue / vat) : 0, prev: ptop[p.id] ? ptop[p.id].revenue : 0 }; });
      html += '<div class="grid g-main"><div class="card"><div class="card__h"><h3>Top 10 by revenue</h3></div><div class="card__b">' + (rows.length ? charts.hbars(rows.slice(0, 10).map(function (x) { return { label: x.p.name, value: x.revenue, sub: ui.num(x.units) + ' units' }; }), { fmt: ui.moneyShort }) : ui.empty('box', 'No sales in this period', '')) + '</div></div>' +
        '<div class="card"><div class="card__h"><h3>Sell-through by category</h3></div><div class="card__b">' + charts.hbars(store.byCategory(r).map(function (c, i) { return { label: c.label, value: c.value, color: COL[i % 6] }; }), { fmt: ui.moneyShort }) + '</div></div></div>';
      html += '<div class="card card--flush" style="margin-top:16px"><div class="card__h"><h3>Product performance</h3><span class="sub">' + rows.length + ' products sold</span></div><div class="card__b" style="padding-top:10px" id="pt"></div></div>';
      exporter = function () { ui.csv('ciel-shop-product-performance-' + app.period + '.csv', [{ label: 'Product', csv: function (x) { return x.p.name; } }, { label: 'SKU', csv: function (x) { return x.p.sku; } }, { label: 'Category', csv: function (x) { return x.p.category; } }, { label: 'Units', key: 'units' }, { label: 'Revenue (KES)', csv: function (x) { return Math.round(x.revenue); } }, { label: 'Gross profit ex-VAT (KES)', csv: function (x) { return Math.round(x.profit); } }, { label: 'Margin %', csv: function (x) { return (x.margin * 100).toFixed(1); } }], rows); };
      mount = function (el) {
        ui.table(el.querySelector('#pt'), {
          rows: rows, pageSize: 15, initialSort: { key: 'revenue', dir: 'desc' }, onRowClick: function (x) { app.go('#/products/' + x.p.id); },
          columns: [
            { key: 'name', label: 'Product', sort: function (x) { return x.p.name; }, render: function (x) { return '<div class="pcell">' + ui.thumb(x.p, 32) + '<div><div class="pcell__t">' + ui.esc(x.p.name) + '</div><div class="pcell__s">' + x.p.sku + '</div></div></div>'; } },
            { key: 'cat', label: 'Category', sort: function (x) { return x.p.category; }, render: function (x) { return '<span class="muted">' + x.p.category + '</span>'; } },
            { key: 'units', label: 'Units', align: 'r', defaultDir: 'desc', render: function (x) { return '<span class="num">' + ui.num(x.units) + '</span>'; } },
            { key: 'revenue', label: 'Revenue', align: 'r', defaultDir: 'desc', render: function (x) { return '<b class="num">' + ui.money(x.revenue) + '</b>'; } },
            { key: 'profit', label: 'Gross profit', align: 'r', defaultDir: 'desc', render: function (x) { return '<span class="num">' + ui.money(x.profit) + '</span>'; } },
            { key: 'margin', label: 'Margin', align: 'r', defaultDir: 'desc', render: function (x) { return '<span class="num">' + ui.pct(x.margin) + '</span>'; } },
            { key: 'prev', label: 'vs previous', align: 'r', sort: function (x) { return x.prev ? (x.revenue - x.prev) / x.prev : 9; }, render: function (x) { return ui.delta(x.revenue, x.prev); } }
          ]
        });
      };
    }

    if (tab === 'inventory') {
      var snap = store.snapshot(), days = Math.max(1, Math.round((r.end - r.start) / 864e5));
      var unitsSold = {}; store.ordersIn(r).forEach(function (o) { o.lines.forEach(function (l) { unitsSold[l.productId] = (unitsSold[l.productId] || 0) + l.qty; }); });
      var cogsByCat = {}, valByCat = {}, startValByCat = {};
      var startDelta = {}; for (var i = S().movements.length - 1; i >= 0; i--) { var mv = S().movements[i]; if (new Date(mv.at) < r.start) break; startDelta[mv.productId] = (startDelta[mv.productId] || 0) + mv.qty; }
      var invRows = S().products.filter(function (p) { return p.status !== 'archived' || snap.get(p.id).onHand > 0; }).map(function (p) {
        var s = snap.get(p.id), avg = s.onHand ? s.value / s.onHand : p.cost, sold = unitsSold[p.id] || 0, daily = sold / days;
        var startOH = Math.max(0, s.onHand - (startDelta[p.id] || 0));
        cogsByCat[p.category] = (cogsByCat[p.category] || 0) + sold * p.cost;
        valByCat[p.category] = (valByCat[p.category] || 0) + s.value;
        startValByCat[p.category] = (startValByCat[p.category] || 0) + startOH * avg;
        return { id: p.id, p: p, s: s, sold: sold, daily: daily, cover: daily ? s.available / daily : Infinity };
      });
      var totalVal = invRows.reduce(function (t, x) { return t + x.s.value; }, 0);
      var turnRows = Object.keys(valByCat).map(function (c) { var avgInv = (valByCat[c] + startValByCat[c]) / 2; var turns = avgInv ? cogsByCat[c] / avgInv : 0; return { c: c, value: valByCat[c], cogs: cogsByCat[c], turns: turns, annual: turns * 365 / days }; }).sort(function (a, b) { return b.value - a.value; });
      var whVals = S().warehouses.map(function (w, i) { return { label: w.name, value: store.stockValue(null, w.id), color: HEX[i % 6] }; });
      html += '<div class="grid g-4">' + kpi('Stock valuation', 'layers', money(totalVal), ui.delta(totalVal, store.inventoryValueAt(r.start)), 'at batch cost', '') +
        kpi('Units on hand', 'box', ui.num(invRows.reduce(function (t, x) { return t + x.s.onHand; }, 0)), '', ui.num(invRows.reduce(function (t, x) { return t + x.s.reserved; }, 0)) + ' reserved', '') +
        kpi('Inventory turnover', 'refresh', (turnRows.reduce(function (t, x) { return t + x.cogs; }, 0) / Math.max(1, (totalVal + store.inventoryValueAt(r.start)) / 2)).toFixed(2) + '×', '', 'COGS ÷ avg. inventory, this period', '') +
        kpi('Low / out of stock', 'alert', store.lowStock().length + ' / ' + invRows.filter(function (x) { return x.p.status === 'active' && x.s.available <= 0; }).length, '', 'active products', '', '#/inventory?status=low') + '</div>';
      html += '<div class="grid g-main" style="margin-top:16px"><div class="card card--flush"><div class="card__h"><h3>Turnover by category</h3><span class="sub">annualised from ' + app.periodLabel() + '</span></div><div class="card__b" style="padding-top:10px"><div class="tscroll"><table class="t"><thead><tr><th>Category</th><th class="r">Stock value</th><th class="r">COGS</th><th class="r">Turns</th><th class="r">Annualised</th></tr></thead><tbody>' +
        turnRows.map(function (x) { return '<tr><td><b>' + x.c + '</b></td><td class="r num">' + ui.money(x.value) + '</td><td class="r num">' + ui.money(x.cogs) + '</td><td class="r num">' + x.turns.toFixed(2) + '×</td><td class="r num">' + x.annual.toFixed(1) + '×</td></tr>'; }).join('') + '</tbody></table></div></div></div>' +
        '<div class="card"><div class="card__h"><h3>Valuation by warehouse</h3></div><div class="card__b" id="a-wh"></div></div></div>';
      html += '<div class="card card--flush" style="margin-top:16px"><div class="card__h"><h3>Low-stock analysis</h3><span class="sub">days of cover = available ÷ average daily units sold</span></div><div class="card__b" style="padding-top:10px" id="lt"></div></div>';
      var lowRows = invRows.filter(function (x) { return x.p.status === 'active'; });
      exporter = function () { ui.csv('ciel-shop-inventory-analysis.csv', [{ label: 'Product', csv: function (x) { return x.p.name; } }, { label: 'SKU', csv: function (x) { return x.p.sku; } }, { label: 'On hand', csv: function (x) { return x.s.onHand; } }, { label: 'Reserved', csv: function (x) { return x.s.reserved; } }, { label: 'Available', csv: function (x) { return x.s.available; } }, { label: 'Incoming', csv: function (x) { return x.s.incoming; } }, { label: 'Units sold (period)', key: 'sold' }, { label: 'Days of cover', csv: function (x) { return isFinite(x.cover) ? x.cover.toFixed(1) : ''; } }, { label: 'Stock value (KES)', csv: function (x) { return Math.round(x.s.value); } }], lowRows); };
      mount = function (el) {
        charts.donut(el.querySelector('#a-wh'), { items: whVals, fmt: ui.moneyShort, centerSub: 'at cost' });
        ui.table(el.querySelector('#lt'), {
          rows: lowRows, pageSize: 12, initialSort: { key: 'cover', dir: 'asc' }, onRowClick: function (x) { app.go('#/products/' + x.p.id); },
          columns: [
            { key: 'name', label: 'Product', sort: function (x) { return x.p.name; }, render: function (x) { return '<div class="pcell">' + ui.thumb(x.p, 30) + '<div><div class="pcell__t">' + ui.esc(x.p.name) + '</div><div class="pcell__s">' + x.p.sku + '</div></div></div>'; } },
            { key: 'avail', label: 'Available', align: 'r', sort: function (x) { return x.s.available; }, render: function (x) { return '<b class="num">' + ui.num(x.s.available) + '</b>'; } },
            { key: 'rp', label: 'Reorder point', align: 'r', sort: function (x) { return x.p.reorderPoint; }, render: function (x) { return '<span class="num muted">' + x.p.reorderPoint + '</span>'; } },
            { key: 'inc', label: 'Incoming', align: 'r', sort: function (x) { return x.s.incoming; }, render: function (x) { return x.s.incoming ? '<span class="num">' + x.s.incoming + '</span>' : '<span class="muted">—</span>'; } },
            { key: 'daily', label: 'Avg. daily sales', align: 'r', render: function (x) { return '<span class="num">' + x.daily.toFixed(1) + '</span>'; } },
            { key: 'cover', label: 'Days of cover', align: 'r', render: function (x) { var c = x.cover; return isFinite(c) ? '<span class="pill pill--' + (c < 7 ? 'red' : c < 21 ? 'amber' : 'green') + ' pill--plain num">' + c.toFixed(0) + ' days</span>' : '<span class="muted">no recent sales</span>'; } },
            { key: 'status', label: 'Status', sort: function (x) { return store.stockStatus(x.p); }, render: function (x) { return ui.pill(store.stockStatus(x.p)); } }
          ]
        });
      };
    }

    if (tab === 'returns') {
      var rets = S().returns.filter(function (x) { return store.inRange(x.createdAt, r); }), prets = S().returns.filter(function (x) { return store.inRange(x.createdAt, pr); });
      var units = rets.reduce(function (t, x) { return t + x.lines.reduce(function (a, l) { return a + l.qty; }, 0); }, 0);
      var punits = prets.reduce(function (t, x) { return t + x.lines.reduce(function (a, l) { return a + l.qty; }, 0); }, 0);
      var refunded = rets.reduce(function (t, x) { return t + (x.refund.amount || 0); }, 0), prefunded = prets.reduce(function (t, x) { return t + (x.refund.amount || 0); }, 0);
      var reasons = {}, byProd = {}; rets.forEach(function (x) { x.lines.forEach(function (l) { reasons[l.reason] = (reasons[l.reason] || 0) + l.qty; byProd[l.productId] = (byProd[l.productId] || 0) + l.qty; }); });
      var restocked = rets.reduce(function (t, x) { return t + x.lines.filter(function (l) { return l.condition === 'resellable'; }).reduce(function (a, l) { return a + l.qty; }, 0); }, 0);
      html += '<div class="grid g-4">' + kpi('Returns', 'undo', ui.num(rets.length), ui.delta(rets.length, prets.length, true), ui.num(units) + ' units', '', '#/returns') +
        kpi('Return rate', 'percent', m.units ? ui.pct(units / m.units) : '—', pm.units ? ui.delta(units / Math.max(1, m.units), punits / Math.max(1, pm.units), true) : '', 'returned ÷ sold units', '') +
        kpi('Refunded on returns', 'wallet', money(refunded), ui.delta(refunded, prefunded, true), 'recorded, not processed', '') +
        kpi('Restocked', 'receive', ui.num(restocked) + ' / ' + ui.num(units), '', 'resellable units put back', '') + '</div>';
      html += '<div class="grid g-2" style="margin-top:16px"><div class="card"><div class="card__h"><h3>Return reasons</h3></div><div class="card__b">' + (Object.keys(reasons).length ? charts.hbars(Object.keys(reasons).map(function (k2) { return { label: k2, value: reasons[k2] }; }).sort(function (a, b) { return b.value - a.value; }), { fmt: function (v) { return v + ' units'; }, color: 'var(--c2)' }) : ui.empty('check', 'No returns in this period', '')) + '</div></div>' +
        '<div class="card"><div class="card__h"><h3>Most returned products</h3></div><div class="card__b">' + (Object.keys(byProd).length ? charts.hbars(Object.keys(byProd).map(function (k2) { return { label: store.product(k2).name, value: byProd[k2] }; }).sort(function (a, b) { return b.value - a.value; }).slice(0, 8), { fmt: function (v) { return v + ' units'; }, color: 'var(--c5)' }) : ui.empty('check', 'No returns in this period', '')) + '</div></div></div>';
      exporter = function () { ui.csv('ciel-shop-returns-' + app.period + '.csv', [{ label: 'Return', key: 'number' }, { label: 'Date', csv: function (x) { return x.createdAt.slice(0, 10); } }, { label: 'Order', csv: function (x) { var o = store.order(x.orderId); return o ? o.number : ''; } }, { label: 'Items', csv: function (x) { return x.lines.map(function (l) { return l.qty + ' x ' + l.name + ' (' + l.reason + ', ' + l.condition + ')'; }).join('; '); } }, { label: 'Refund (KES)', csv: function (x) { return x.refund.amount || 0; } }], rets); };
    }

    return {
      title: 'Analytics', period: true, html: html,
      mount: function (el) { el.querySelector('#exp').onclick = function () { if (exporter) exporter(); else ui.toast('Nothing to export on this tab', 'info'); }; if (mount) mount(el); }
    };
  });

  /* ================= REPORTS ================= */
  var REPORTS = [
    { id: 'sales-daily', name: 'Sales by day', icon: 'coins', desc: 'Orders, gross sales, discounts, shipping and refunds for each day.', period: true },
    { id: 'orders', name: 'Order export', icon: 'cart', desc: 'Every order with customer, channel, statuses and totals.', period: true },
    { id: 'valuation', name: 'Inventory valuation', icon: 'layers', desc: 'On-hand, reserved and value at cost per product and warehouse.' },
    { id: 'movements', name: 'Stock movement ledger', icon: 'swap', desc: 'Every receipt, sale, transfer, adjustment and write-off.', period: true },
    { id: 'expiry', name: 'Batch expiry report', icon: 'clock', desc: 'Dated batches with remaining quantity, sorted by expiry.' },
    { id: 'purchasing', name: 'Purchase orders', icon: 'truck', desc: 'Purchase orders with supplier, status, value and receipt progress.', period: true },
    { id: 'refunds', name: 'Returns & refunds', icon: 'undo', desc: 'Returned items, reasons, condition and refunds recorded.', period: true },
    { id: 'customers', name: 'Customer list', icon: 'users', desc: 'Customers with order count, lifetime spend and last order.' }
  ];
  function reportData(id, r) {
    var st = S();
    if (id === 'sales-daily') {
      var bks = store.buckets({ start: r.start, end: r.end }), rows = [];
      if (bks.length && (r.end - r.start) / 864e5 > 45) { bks = []; for (var t = new Date(r.start.getFullYear(), r.start.getMonth(), r.start.getDate() + 1).getTime(); t <= r.end.getTime(); t += 864e5) bks.push({ start: new Date(t), end: new Date(t + 864e5) }); }
      bks.forEach(function (b) {
        var rr = { start: b.start, end: b.end }, os = store.ordersIn(rr), ref = 0;
        st.orders.forEach(function (o) { if (store.counted(o)) (o.refunds || []).forEach(function (f) { if (store.inRange(f.at, rr)) ref += f.amount; }); });
        rows.push({ id: b.start.toISOString(), date: b.start.toISOString().slice(0, 10), orders: os.length, gross: os.reduce(function (t2, o) { return t2 + store.subtotal(o); }, 0), discount: os.reduce(function (t2, o) { return t2 + (o.discount || 0); }, 0), shipping: os.reduce(function (t2, o) { return t2 + (o.shipping || 0); }, 0), refunds: ref });
      });
      rows.forEach(function (x) { x.net = x.gross - x.discount - x.refunds; });
      return { rows: rows.reverse(), cols: [{ key: 'date', label: 'Date', render: function (x) { return ui.dateLong(x.date); } }, { key: 'orders', label: 'Orders', align: 'r' }, { key: 'gross', label: 'Gross', align: 'r', money: 1 }, { key: 'discount', label: 'Discounts', align: 'r', money: 1 }, { key: 'refunds', label: 'Refunds', align: 'r', money: 1 }, { key: 'net', label: 'Net sales', align: 'r', money: 1, strong: 1 }, { key: 'shipping', label: 'Shipping charged', align: 'r', money: 1 }] };
    }
    if (id === 'orders') {
      return { rows: st.orders.filter(function (o) { return store.inRange(o.createdAt, r); }).slice().reverse().map(function (o) { var c = store.customer(o.customerId); return { id: o.id, link: '#/orders/' + o.id, number: o.number, date: o.createdAt, customer: c ? c.name : '', channel: o.channel, payment: store.statusLabel(o.payment.status), fulfilment: store.statusLabel(o.fulfilment), items: o.lines.reduce(function (t2, l) { return t2 + l.qty; }, 0), total: store.total(o), refunded: store.refunded(o), warehouse: (store.warehouse(o.warehouseId) || {}).code }; }),
        cols: [{ key: 'number', label: 'Order', strong: 1 }, { key: 'date', label: 'Date', render: function (x) { return ui.dateTime(x.date); }, csv: function (x) { return x.date.slice(0, 16).replace('T', ' '); } }, { key: 'customer', label: 'Customer' }, { key: 'channel', label: 'Channel' }, { key: 'payment', label: 'Payment' }, { key: 'fulfilment', label: 'Fulfilment' }, { key: 'warehouse', label: 'Warehouse' }, { key: 'items', label: 'Items', align: 'r' }, { key: 'total', label: 'Total', align: 'r', money: 1 }, { key: 'refunded', label: 'Refunded', align: 'r', money: 1 }] };
    }
    if (id === 'valuation') {
      var snap = store.snapshot(), rows2 = [];
      st.products.forEach(function (p) { st.warehouses.forEach(function (w) { var s = snap.get(p.id, w.id); if (!s.onHand && !s.reserved && !s.incoming) return; rows2.push({ id: p.id + w.id, link: '#/products/' + p.id, product: p.name, sku: p.sku, category: p.category, warehouse: w.name, onHand: s.onHand, reserved: s.reserved, available: s.available, incoming: s.incoming, avgCost: s.onHand ? s.value / s.onHand : p.cost, value: s.value }); }); });
      return { rows: rows2, total: 'value', cols: [{ key: 'product', label: 'Product', strong: 1 }, { key: 'sku', label: 'SKU' }, { key: 'category', label: 'Category' }, { key: 'warehouse', label: 'Warehouse' }, { key: 'onHand', label: 'On hand', align: 'r' }, { key: 'reserved', label: 'Reserved', align: 'r' }, { key: 'available', label: 'Available', align: 'r' }, { key: 'incoming', label: 'Incoming', align: 'r' }, { key: 'avgCost', label: 'Avg. cost', align: 'r', money: 1 }, { key: 'value', label: 'Value', align: 'r', money: 1, strong: 1 }] };
    }
    if (id === 'movements') {
      return { rows: st.movements.filter(function (m) { return store.inRange(m.at, r); }).slice().reverse().map(function (m) { var p = store.product(m.productId); return { id: m.id, link: '#/products/' + p.id, date: m.at, product: p.name, sku: p.sku, type: movLabel(m.type), qty: m.qty, damaged: m.damagedQty || 0, batch: m.batchNumber || '', warehouse: (store.warehouse(m.warehouseId) || {}).code, ref: m.ref || '', reason: m.reason || '', by: app.userName(m.by) }; }),
        cols: [{ key: 'date', label: 'When', render: function (x) { return ui.dateTime(x.date); }, csv: function (x) { return x.date.slice(0, 16).replace('T', ' '); } }, { key: 'product', label: 'Product', strong: 1 }, { key: 'sku', label: 'SKU' }, { key: 'type', label: 'Type' }, { key: 'qty', label: 'Qty', align: 'r', render: function (x) { return '<span class="num" style="color:' + (x.qty > 0 ? 'var(--green)' : 'inherit') + '">' + (x.qty > 0 ? '+' : '') + x.qty + '</span>'; } }, { key: 'warehouse', label: 'Warehouse' }, { key: 'batch', label: 'Batch' }, { key: 'ref', label: 'Reference' }, { key: 'reason', label: 'Reason' }, { key: 'by', label: 'By' }] };
    }
    if (id === 'expiry') {
      return { rows: st.batches.filter(function (b) { return b.expiryDate && b.qtyRemaining > 0; }).sort(function (a, b) { return a.expiryDate < b.expiryDate ? -1 : 1; }).map(function (b) { var p = store.product(b.productId); return { id: b.id, link: '#/batches/' + b.id, batch: b.number, product: p.name, warehouse: store.warehouse(b.warehouseId).name, remaining: b.qtyRemaining, expiry: b.expiryDate, days: store.daysToExpiry(b), value: b.qtyRemaining * b.unitCost, status: store.batchStatus(b) }; }),
        cols: [{ key: 'batch', label: 'Batch', strong: 1 }, { key: 'product', label: 'Product' }, { key: 'warehouse', label: 'Warehouse' }, { key: 'remaining', label: 'Remaining', align: 'r' }, { key: 'expiry', label: 'Expires', render: function (x) { return ui.dateLong(x.expiry); } }, { key: 'days', label: 'Days left', align: 'r' }, { key: 'value', label: 'Value at cost', align: 'r', money: 1 }, { key: 'status', label: 'Status', render: function (x) { return ui.pill(x.status); } }] };
    }
    if (id === 'purchasing') {
      return { rows: st.purchaseOrders.filter(function (po) { return store.inRange(po.createdAt, r); }).slice().reverse().map(function (po) { var q = po.lines.reduce(function (t2, l) { return t2 + l.qty; }, 0), rec = po.lines.reduce(function (t2, l) { return t2 + (l.received || 0); }, 0); return { id: po.id, link: '#/purchase-orders/' + po.id, number: po.number, supplier: store.supplier(po.supplierId).name, created: po.createdAt, expected: po.expectedAt, status: po.status, units: q, received: rec, value: po.lines.reduce(function (t2, l) { return t2 + l.qty * l.unitCost; }, 0) }; }),
        cols: [{ key: 'number', label: 'PO', strong: 1 }, { key: 'supplier', label: 'Supplier' }, { key: 'created', label: 'Created', render: function (x) { return ui.date(x.created); }, csv: function (x) { return x.created.slice(0, 10); } }, { key: 'expected', label: 'Expected', render: function (x) { return ui.date(x.expected); }, csv: function (x) { return x.expected ? x.expected.slice(0, 10) : ''; } }, { key: 'status', label: 'Status', render: function (x) { return ui.pill(x.status); } }, { key: 'units', label: 'Units', align: 'r' }, { key: 'received', label: 'Received', align: 'r' }, { key: 'value', label: 'Value', align: 'r', money: 1, strong: 1 }] };
    }
    if (id === 'refunds') {
      return { rows: st.returns.filter(function (x) { return store.inRange(x.createdAt, r); }).slice().reverse().map(function (x) { var o = store.order(x.orderId); return { id: x.id, link: '#/orders/' + x.orderId, number: x.number, date: x.createdAt, order: o ? o.number : '', items: x.lines.map(function (l) { return l.qty + ' × ' + l.name; }).join(', '), reason: x.lines.map(function (l) { return l.reason; }).join(', '), condition: x.lines.map(function (l) { return l.condition; }).join(', '), restocked: x.restocked ? 'Yes' : 'No', refund: x.refund.amount || 0 }; }),
        cols: [{ key: 'number', label: 'Return', strong: 1 }, { key: 'date', label: 'Date', render: function (x) { return ui.date(x.date); }, csv: function (x) { return x.date.slice(0, 10); } }, { key: 'order', label: 'Order' }, { key: 'items', label: 'Items', wrap: 1 }, { key: 'reason', label: 'Reason' }, { key: 'condition', label: 'Condition' }, { key: 'restocked', label: 'Restocked' }, { key: 'refund', label: 'Refund', align: 'r', money: 1, strong: 1 }] };
    }
    if (id === 'customers') {
      var agg = {}; st.orders.forEach(function (o) { if (!store.counted(o)) return; var a = agg[o.customerId] = agg[o.customerId] || { n: 0, spend: 0, last: null }; a.n++; a.spend += store.orderNet(o) - store.refunded(o); if (!a.last || o.createdAt > a.last) a.last = o.createdAt; });
      return { rows: st.customers.map(function (c) { var a = agg[c.id] || { n: 0, spend: 0, last: null }; return { id: c.id, link: '#/customers/' + c.id, name: c.name, email: c.email, phone: c.phone, city: c.city, type: c.type, orders: a.n, spend: a.spend, last: a.last }; }).sort(function (a, b) { return b.spend - a.spend; }),
        cols: [{ key: 'name', label: 'Customer', strong: 1 }, { key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone' }, { key: 'city', label: 'City' }, { key: 'type', label: 'Type' }, { key: 'orders', label: 'Orders', align: 'r' }, { key: 'spend', label: 'Net spend', align: 'r', money: 1, strong: 1 }, { key: 'last', label: 'Last order', render: function (x) { return x.last ? ui.date(x.last) : '—'; }, csv: function (x) { return x.last ? x.last.slice(0, 10) : ''; } }] };
    }
  }
  CS.route('/reports', function () {
    var html = app.ph('Reports', 'Ready-made reports you can preview, filter by period and export to CSV for your accountant or spreadsheet.');
    html += '<div class="grid g-4">' + REPORTS.map(function (rp) { return '<a class="card" href="#/reports/' + rp.id + '" style="padding:18px;display:flex;flex-direction:column;gap:10px"><span class="ico-c ico-c--acc">' + ui.icon(rp.icon, 17) + '</span><div><b style="font-size:14px">' + rp.name + '</b><p class="muted" style="margin-top:3px;font-size:12.5px">' + rp.desc + '</p></div><span class="link" style="margin-top:auto">Open report ' + ui.icon('arrowR', 13) + '</span></a>'; }).join('') + '</div>';
    return { title: 'Reports', html: html };
  });
  CS.route('/reports/:id', function (p) {
    var rp = REPORTS.filter(function (x) { return x.id === p.id; })[0]; if (!rp) return null;
    var r = store.periodRange(app.period), d = reportData(rp.id, r);
    var html = app.ph(rp.name, rp.desc + (rp.period ? ' Showing ' + app.periodLabel() + '.' : ' Current position.'), '<button class="btn" id="print">' + ui.icon('printer', 15) + 'Print</button><button class="btn btn--p" id="csv">' + ui.icon('download', 15) + 'Export CSV</button>');
    if (d.total) html += '<div class="note note--plain" style="margin-bottom:14px">' + ui.icon('info', 15) + '<span>Total ' + ui.money(d.rows.reduce(function (t, x) { return t + x[d.total]; }, 0)) + ' across ' + d.rows.length + ' rows.</span></div>';
    html += '<div class="card card--flush"><div class="tbar"><div class="search-inp">' + ui.icon('search', 15) + '<input class="inp inp--sm" id="rq" placeholder="Filter rows…" aria-label="Filter rows"></div><span class="tbar__sp"></span><span class="muted" id="rc"></span></div><div id="rt"></div></div>';
    return {
      title: rp.name, crumbs: [['Reports', '#/reports']], period: !!rp.period, html: html,
      mount: function (el) {
        var cols = d.cols.map(function (c) { return { key: c.key, label: c.label, align: c.align, cls: c.wrap ? 'wrap-cell' : '', render: c.render || function (x) { var v = x[c.key]; v = c.money ? ui.money(v) : (typeof v === 'number' ? ui.num(v) : ui.esc(v)); return c.strong ? '<b class="num">' + v + '</b>' : '<span class="num">' + v + '</span>'; }, csv: c.csv || function (x) { var v = x[c.key]; return c.money ? Math.round(v) : v; } }; });
        var t = ui.table(el.querySelector('#rt'), { rows: d.rows, columns: cols, pageSize: 25, showCount: true, onRowClick: function (x) { if (x.link) app.go(x.link); }, empty: ui.empty('file', 'No rows for this period', 'Try a longer period from the selector above.') });
        function filt() { var q = el.querySelector('#rq').value.trim().toLowerCase(); var rows = q ? d.rows.filter(function (x) { return JSON.stringify(x).toLowerCase().indexOf(q) >= 0; }) : d.rows; t.setRows(rows); el.querySelector('#rc').textContent = ui.num(rows.length) + ' rows'; }
        el.querySelector('#rq').addEventListener('input', ui.debounce(filt, 120)); filt();
        el.querySelector('#csv').onclick = function () { ui.csv('ciel-shop-' + rp.id + (rp.period ? '-' + app.period : '') + '.csv', cols, t.rows()); };
        el.querySelector('#print').onclick = function () { window.print(); };
      }
    };
  });
})();
