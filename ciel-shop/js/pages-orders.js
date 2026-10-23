/* ============================================================
   CIEL SHOP — Orders, Order board, Returns, Customers
   ============================================================ */
(function () {
  'use strict';
  var ui = CS.ui, store = CS.store, app = CS.app;
  function S() { return store.state; }
  var st = app.state = app.state || {};
  st.orders = st.orders || { q: '', tab: 'all', channel: '', wh: '', range: '30' };
  st.board = st.board || { q: '', channel: '', wh: '', range: '14' };
  st.customers = st.customers || { q: '', type: '' };
  var RETURN_REASONS = ['Damaged in transit', 'Not as described', 'Changed mind', 'Wrong item sent', 'Wrong size or colour', 'Arrived late', 'Quality issue'];
  var PAY_METHODS = ['M-Pesa', 'Card', 'Cash', 'Bank transfer'];

  function custName(o) { var c = store.customer(o.customerId); return c ? c.name : 'Unknown customer'; }
  function itemsCount(o) { return o.lines.reduce(function (t, l) { return t + l.qty; }, 0); }

  /* ================= ORDERS LIST ================= */
  var TABS = [
    ['all', 'All', function (o) { return o.fulfilment !== 'draft'; }],
    ['open', 'To fulfil', function (o) { return store.OPEN.indexOf(o.fulfilment) >= 0; }],
    ['unpaid', 'Unpaid', function (o) { return o.payment.status === 'pending' && o.fulfilment !== 'cancelled' && o.fulfilment !== 'draft'; }],
    ['shipped', 'In transit', function (o) { return o.fulfilment === 'shipped'; }],
    ['delivered', 'Completed', function (o) { return o.fulfilment === 'delivered'; }],
    ['closed', 'Cancelled & returned', function (o) { return o.fulfilment === 'cancelled' || o.fulfilment === 'returned'; }],
    ['draft', 'Drafts', function (o) { return o.fulfilment === 'draft'; }],
    ['returns', 'Returns', null]
  ];
  CS.route('/orders', function (prm, q) {
    var f = st.orders; if (q.pay === 'pending') { f.tab = 'unpaid'; f.range = 'all'; }
    if (q.tab) f.tab = q.tab;
    if (f.tab === 'returns') { f.tab = 'all'; return CS.returnsPage(); }
    var since = f.range === 'all' ? 0 : Date.now() - (+f.range) * 864e5;
    var inRange = S().orders.filter(function (o) { return new Date(o.createdAt).getTime() >= since || o.fulfilment === 'draft' || store.OPEN.indexOf(o.fulfilment) >= 0 || (o.payment.status === 'pending' && o.fulfilment !== 'cancelled'); });
    var html = app.ph('Orders', 'Payment and fulfilment are tracked separately — a paid order can still be waiting to ship.', '<button class="btn" id="oexp">' + ui.icon('download', 15) + 'Export CSV</button><a class="btn btn--p" href="#/orders/new">' + ui.icon('plus', 15) + 'Create order</a>');
    html += '<div class="tabs" id="otabs">' + TABS.map(function (t) { return t[0] === 'returns' ? '<a class="tab" href="#/returns">Returns <span class="cnt">' + S().returns.length + '</span></a>' : '<button class="tab' + (f.tab === t[0] ? ' on' : '') + '" data-t="' + t[0] + '">' + t[1] + ' <span class="cnt">' + inRange.filter(t[2]).length + '</span></button>'; }).join('') + '</div>';
    html += '<div class="card card--flush"><div class="tbar"><div class="search-inp">' + ui.icon('search', 15) + '<input class="inp inp--sm" id="oq" placeholder="Order number, customer, product, tracking…" value="' + ui.esc(f.q) + '" aria-label="Search orders"></div>' +
      ui.select('och', [{ value: '', label: 'All channels' }].concat(S().channels), f.channel, { cls: 'sel--sm', attr: ' style="width:auto" aria-label="Channel"' }) + ui.select('owh', app.whOptions(true), f.wh, { cls: 'sel--sm', attr: ' style="width:auto" aria-label="Warehouse"' }) +
      ui.select('orange', [{ value: '1', label: 'Last 24 hours' }, { value: '7', label: 'Last 7 days' }, { value: '30', label: 'Last 30 days' }, { value: '90', label: 'Last 90 days' }, { value: 'all', label: 'All time' }], f.range, { cls: 'sel--sm', attr: ' style="width:auto" aria-label="Date range"' }) + '<span class="tbar__sp"></span><span class="muted" id="ocount"></span></div><div id="ot"></div></div>';
    html += '<p class="muted" style="margin-top:10px;font-size:12px">Open, unpaid and draft orders are always shown, whatever the date range.</p>';
    return {
      title: 'Orders', html: html,
      mount: function (el) {
        function rows() {
          var tab = TABS.filter(function (t) { return t[0] === f.tab; })[0] || TABS[0], qq = f.q.toLowerCase();
          return inRange.filter(tab[2]).filter(function (o) {
            if (f.channel && o.channel !== f.channel) return false; if (f.wh && o.warehouseId !== f.wh) return false;
            if (qq && (o.number + ' ' + custName(o) + ' ' + (o.tracking || '') + ' ' + o.lines.map(function (l) { return l.name + ' ' + l.sku; }).join(' ')).toLowerCase().indexOf(qq) < 0) return false;
            return true;
          });
        }
        var t = ui.table(el.querySelector('#ot'), {
          rows: rows(), pageSize: 20, showCount: true, initialSort: { key: 'date', dir: 'desc' }, onRowClick: function (o) { app.go('#/orders/' + o.id); },
          columns: [
            { key: 'number', label: 'Order', render: function (o) { return '<b>' + o.number + '</b>'; } },
            { key: 'date', label: 'Date', defaultDir: 'desc', sort: function (o) { return o.createdAt; }, render: function (o) { return '<span title="' + ui.dateTime(o.createdAt) + '">' + ui.date(o.createdAt) + '</span><div class="pcell__s">' + new Date(o.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + '</div>'; } },
            { key: 'cust', label: 'Customer', sort: custName, render: function (o) { var c = store.customer(o.customerId); return '<div class="pcell">' + ui.avatar(custName(o), true) + '<div><div class="pcell__t">' + ui.esc(custName(o)) + '</div><div class="pcell__s">' + ui.esc(c ? c.city : '') + '</div></div></div>'; } },
            { key: 'items', label: 'Items', align: 'r', sort: itemsCount, render: function (o) { return '<span class="num">' + itemsCount(o) + '</span>'; } },
            { key: 'total', label: 'Total', align: 'r', defaultDir: 'desc', sort: store.total, render: function (o) { return '<b class="num">' + ui.money(store.total(o)) + '</b>' + (store.refunded(o) ? '<div class="pcell__s" style="color:var(--red)">−' + ui.money(store.refunded(o)) + '</div>' : ''); } },
            { key: 'pay', label: 'Payment', sort: function (o) { return o.payment.status; }, render: function (o) { return ui.pill(o.payment.status); } },
            { key: 'ful', label: 'Fulfilment', sort: function (o) { return store.FLOW.indexOf(o.fulfilment); }, render: function (o) { return ui.pill(o.fulfilment); } },
            { key: 'channel', label: 'Channel', render: function (o) { return '<span class="muted">' + o.channel + '</span>'; } },
            { key: 'del', label: 'Delivery', sort: function (o) { return o.deliveryMethod; }, render: function (o) { return '<span class="muted">' + o.deliveryMethod + '</span><div class="pcell__s">' + (store.warehouse(o.warehouseId) || {}).code + '</div>'; } }
          ]
        });
        function redraw() { var r = rows(); t.setRows(r); el.querySelector('#ocount').textContent = r.length + ' orders'; }
        redraw();
        el.querySelector('#otabs').onclick = function (e) { var b = e.target.closest('[data-t]'); if (!b) return; f.tab = b.getAttribute('data-t'); history.replaceState(null, '', '#/orders'); app.render(true); };
        el.querySelector('#oq').addEventListener('input', ui.debounce(function (e) { f.q = e.target.value; redraw(); }, 120));
        el.querySelector('[name=och]').onchange = function (e) { f.channel = e.target.value; redraw(); };
        el.querySelector('[name=owh]').onchange = function (e) { f.wh = e.target.value; redraw(); };
        el.querySelector('[name=orange]').onchange = function (e) { f.range = e.target.value; app.render(true); };
        el.querySelector('#oexp').onclick = function () { ui.csv('ciel-shop-orders.csv', [{ label: 'Order', key: 'number' }, { label: 'Date', csv: function (o) { return o.createdAt.slice(0, 16).replace('T', ' '); } }, { label: 'Customer', csv: custName }, { label: 'Channel', key: 'channel' }, { label: 'Delivery', key: 'deliveryMethod' }, { label: 'Warehouse', csv: function (o) { return (store.warehouse(o.warehouseId) || {}).code; } }, { label: 'Items', csv: itemsCount }, { label: 'Subtotal', csv: store.subtotal }, { label: 'Discount', key: 'discount' }, { label: 'Shipping', key: 'shipping' }, { label: 'Total', csv: store.total }, { label: 'Refunded', csv: store.refunded }, { label: 'Payment', csv: function (o) { return store.statusLabel(o.payment.status); } }, { label: 'Fulfilment', csv: function (o) { return store.statusLabel(o.fulfilment); } }], t.rows()); };
      }
    };
  });

  /* ================= ORDER DETAIL ================= */
  var TL_ICON = { new: ['inbox', 'acc'], draft: ['edit', ''], paid: ['wallet', 'green'], processing: ['list', ''], packing: ['box', ''], ready: ['check', ''], shipped: ['truck', 'acc'], delivered: ['pin', 'green'], cancelled: ['x', 'red'], refund: ['undo', 'red'], return: ['undo', 'red'], edit: ['edit', ''] };
  CS.route('/orders/:id', function (prm, q) {
    if (prm.id === 'new') return orderForm(null, q);
    var o = store.order(prm.id); if (!o) return null;
    var c = store.customer(o.customerId), w = store.warehouse(o.warehouseId), opts = store.options(o);
    var sub = store.subtotal(o), total = store.total(o), refunded = store.refunded(o), vat = S().business.vatRate;
    var stepIdx = store.FLOW.indexOf(o.fulfilment);
    var canReturn = ['shipped', 'delivered', 'returned'].indexOf(o.fulfilment) >= 0 && store.returnable(o).some(function (x) { return x.max > 0; });
    var html = '<div class="dhead"><div class="dhead__m"><h1>Order ' + o.number + '</h1><div class="meta">' + ui.pill(o.payment.status) + ui.pill(o.fulfilment) + '<span>' + ui.dateTime(o.createdAt) + '</span>·<span>' + o.channel + '</span>' + (o.demo ? '<span class="tag">created in template</span>' : '') + '</div></div><div class="ph__acts">';
    if (o.fulfilment === 'draft') html += '<a class="btn" href="#/orders/' + o.id + '/edit">' + ui.icon('edit', 15) + 'Edit draft</a><button class="btn btn--p" data-to="new">' + ui.icon('check', 15) + 'Confirm order</button>';
    else {
      if (o.fulfilment === 'new') html += '<a class="btn" href="#/orders/' + o.id + '/edit">' + ui.icon('edit', 15) + 'Edit</a>';
      if (o.payment.status === 'pending' && o.fulfilment !== 'cancelled') html += '<button class="btn" id="pay">' + ui.icon('wallet', 15) + 'Mark as paid</button>';
      var next = { new: ['processing', 'Start processing'], processing: ['packing', 'Start packing'], packing: ['ready', 'Mark packed'], ready: ['shipped', o.deliveryMethod === 'Store pickup' ? 'Hand over' : 'Ship order'], shipped: ['delivered', 'Mark delivered'] }[o.fulfilment];
      if (next) html += '<button class="btn btn--p" data-to="' + next[0] + '">' + ui.icon(next[0] === 'shipped' ? 'truck' : 'arrowR', 15) + next[1] + '</button>';
      if (canReturn) html += '<button class="btn" id="ret">' + ui.icon('undo', 15) + 'Create return</button>';
    }
    html += '<button class="btn btn--icon" id="omore" aria-label="More actions">' + ui.icon('more') + '</button></div></div>';
    if (o.fulfilment !== 'cancelled' && o.fulfilment !== 'draft') {
      html += '<div class="card" style="margin-bottom:16px"><div class="card__b"><div class="steps">' + store.FLOW.map(function (s, i) { var done = stepIdx >= i || o.fulfilment === 'returned'; return '<div class="step' + (done ? ' done' : '') + (i === stepIdx ? ' cur' : '') + '"><i>' + (done ? ui.icon('check', 11, 3) : '') + '</i>' + store.statusLabel(s) + '</div>'; }).join('') + '</div></div></div>';
    }
    if (o.fulfilment === 'cancelled') html += '<div class="note note--plain" style="margin-bottom:16px">' + ui.icon('x', 15) + '<span>This order was cancelled. Reserved stock was released.' + (refunded ? ' ' + ui.money(refunded) + ' was refunded.' : '') + '</span></div>';
    if (o.payment.status === 'pending' && ['shipped', 'delivered'].indexOf(o.fulfilment) >= 0) html += '<div class="note" style="margin-bottom:16px">' + ui.icon('wallet', 15) + '<span>Goods have left the warehouse but payment hasn’t been recorded yet' + (o.payment.method === 'Bank transfer' ? ' (invoice terms).' : ' (pay on delivery).') + '</span></div>';
    html += '<div class="grid g-side"><div class="stack">';
    html += '<div class="card card--flush"><div class="card__h"><h3>Items</h3><span class="sub">' + itemsCount(o) + (itemsCount(o) === 1 ? ' unit' : ' units') + ' from ' + (w ? w.name : '—') + '</span></div><div class="card__b" style="padding-top:10px"><div class="tscroll"><table class="t lines-t"><thead><tr><th>Product</th><th class="r">Price</th><th class="r">Qty</th><th class="r">Total</th></tr></thead><tbody>' +
      o.lines.map(function (l) { var p = store.product(l.productId); return '<tr><td><div class="pcell">' + ui.thumb(p, 38) + '<div><a class="pcell__t" href="#/products/' + p.id + '" style="display:block">' + ui.esc(l.name) + '</a><div class="pcell__s mono">' + l.sku + (l.batches && l.batches.length ? ' · batch ' + l.batches.map(function (b) { return b.number + (l.batches.length > 1 ? ' ×' + b.qty : ''); }).join(', ') : '') + '</div></div></div></td><td class="r num">' + ui.money(l.price) + '</td><td class="r num">' + l.qty + '</td><td class="r num"><b>' + ui.money(l.price * l.qty) + '</b></td></tr>'; }).join('') + '</tbody></table></div>' +
      '<div class="totals"><div><span class="muted">Subtotal</span><span class="num">' + ui.money(sub) + '</span></div>' + (o.discount ? '<div><span class="muted">Discount</span><span class="num">−' + ui.money(o.discount) + '</span></div>' : '') + '<div><span class="muted">Shipping · ' + o.deliveryMethod + '</span><span class="num">' + (o.shipping ? ui.money(o.shipping) : 'Free') + '</span></div><div><span class="muted">Includes VAT (' + Math.round(vat * 100) + '%)</span><span class="num muted">' + ui.money((sub - o.discount) - (sub - o.discount) / (1 + vat)) + '</span></div><div class="grand"><span>Total</span><span class="num">' + ui.money(total) + '</span></div>' + (refunded ? '<div style="color:var(--red)"><span>Refunded</span><span class="num">−' + ui.money(refunded) + '</span></div><div><b>Net</b><b class="num">' + ui.money(total - refunded) + '</b></div>' : '') + '</div></div></div>';
    var rets = S().returns.filter(function (r) { return r.orderId === o.id; });
    if (rets.length) html += '<div class="card card--flush"><div class="card__h"><h3>Returns</h3></div><div class="card__b" style="padding-top:8px">' + rets.map(function (r) { return '<div class="lrow"><span class="ico-c ico-c--red">' + ui.icon('undo', 15) + '</span><div class="lrow__m"><div class="lrow__t">' + r.number + ' · ' + r.lines.map(function (l) { return l.qty + ' × ' + ui.esc(l.name); }).join(', ') + '</div><div class="lrow__s">' + r.lines.map(function (l) { return l.reason + ' — ' + (l.condition === 'resellable' ? 'restocked' : 'not resellable'); }).join('; ') + ' · ' + ui.date(r.createdAt) + '</div></div><b class="num">' + (r.refund.amount ? ui.money(r.refund.amount) : 'No refund') + '</b></div>'; }).join('') + '</div></div>';
    html += '<div class="card"><div class="card__h"><h3>Activity</h3></div><div class="card__b"><div class="timeline">' + o.timeline.slice().reverse().map(function (t) { var ic = TL_ICON[t.status] || ['info', '']; return '<div class="tl"><span class="tl__i ' + ic[1] + '">' + ui.icon(ic[0], 12, 2.2) + '</span><div><div class="tl__t">' + ui.esc(t.text) + '</div><div class="tl__s">' + ui.dateTime(t.at) + (t.by ? ' · ' + ui.esc(app.userName(t.by)) : '') + '</div></div></div>'; }).join('') + '</div></div></div>';
    html += '</div><div class="stack">';
    html += '<div class="card"><div class="card__h"><h3>Customer</h3>' + (c ? '<a class="link" href="#/customers/' + c.id + '">Profile ' + ui.icon('arrowR', 13) + '</a>' : '') + '</div><div class="card__b">' + (c ? '<div class="row" style="margin-bottom:12px">' + ui.avatar(c.name) + '<div><b>' + ui.esc(c.name) + '</b><div class="muted" style="font-size:12px">' + c.type + ' · ' + S().orders.filter(function (x) { return x.customerId === c.id && store.counted(x); }).length + ' orders</div></div></div><dl class="kv"><dt>' + ui.icon('mail', 14) + '</dt><dd>' + ui.esc(c.email) + '</dd><dt>' + ui.icon('phone', 14) + '</dt><dd>' + ui.esc(c.phone) + '</dd><dt>' + ui.icon('pin', 14) + '</dt><dd>' + ui.esc((o.shipTo && o.shipTo.line1 && o.shipTo.line1 !== c.city ? o.shipTo.line1 + ', ' : '') + c.city) + '</dd></dl>' : '—') + '</div></div>';
    html += '<div class="card"><div class="card__h"><h3>Payment</h3>' + ui.pill(o.payment.status) + '</div><div class="card__b"><dl class="kv"><dt>Method</dt><dd>' + o.payment.method + '</dd><dt>Paid</dt><dd>' + (o.payment.paidAt ? ui.dateTime(o.payment.paidAt) : '—') + '</dd><dt>Refunded</dt><dd class="num">' + (refunded ? ui.money(refunded) : '—') + '</dd></dl>' + (o.payment.status !== 'pending' && refunded < total && o.fulfilment !== 'cancelled' ? '<button class="btn btn--sm" id="refund" style="margin-top:12px;width:100%">' + ui.icon('undo', 14) + 'Record refund</button>' : '') + '</div></div>';
    html += '<div class="card"><div class="card__h"><h3>Fulfilment</h3></div><div class="card__b"><dl class="kv"><dt>Warehouse</dt><dd>' + (w ? '<a class="link" href="#/warehouses/' + w.id + '">' + w.name + '</a>' : '—') + '</dd><dt>Delivery</dt><dd>' + o.deliveryMethod + '</dd><dt>Ship to</dt><dd>' + ui.esc(o.shipTo ? o.shipTo.line1 + (o.shipTo.city && o.shipTo.line1 !== o.shipTo.city ? ', ' + o.shipTo.city : '') : '—') + '</dd><dt>Tracking</dt><dd class="mono">' + (o.tracking || '—') + '</dd><dt>Shipped</dt><dd>' + (o.shippedAt ? ui.dateTime(o.shippedAt) : '—') + '</dd><dt>Delivered</dt><dd>' + (o.deliveredAt ? ui.dateTime(o.deliveredAt) : '—') + '</dd></dl>' +
      (opts.length ? '<div class="f" style="margin-top:14px"><label for="mv">Move to</label><div class="row">' + ui.select('mv', [{ value: '', label: 'Choose status…' }].concat(opts.map(function (s) { return { value: s, label: store.statusLabel(s) }; })), '', { cls: 'sel--sm' }) + '<button class="btn btn--sm" id="mvgo">Apply</button></div></div>' : '') + '</div></div>';
    html += '<div class="card"><div class="card__h"><h3>Internal notes</h3></div><div class="card__b">' + (o.notes.length ? o.notes.map(function (n) { return '<div style="padding:8px 10px;background:var(--bg);border-radius:10px;margin-bottom:8px"><div>' + ui.esc(n.text) + '</div><div class="muted" style="font-size:11.5px;margin-top:3px">' + ui.esc(app.userName(n.by)) + ' · ' + ui.rel(n.at) + '</div></div>'; }).join('') : '<p class="muted" style="font-size:12.5px;margin-bottom:8px">Only your team sees these.</p>') + '<textarea class="ta" id="note" rows="2" placeholder="Add a note…" style="min-height:60px"></textarea><button class="btn btn--sm" id="addnote" style="margin-top:8px">Add note</button></div></div>';
    html += '</div></div>';
    return {
      title: o.number, crumbs: [['Orders', '#/orders']], html: html,
      mount: function (el) {
        el.querySelectorAll('[data-to]').forEach(function (b) { b.onclick = function () { move(o, b.getAttribute('data-to')); }; });
        var pay = el.querySelector('#pay'); if (pay) pay.onclick = function () { markPaid(o); };
        var ret = el.querySelector('#ret'); if (ret) ret.onclick = function () { returnDialog(o); };
        var rf = el.querySelector('#refund'); if (rf) rf.onclick = function () { refundDialog(o); };
        var mg = el.querySelector('#mvgo'); if (mg) mg.onclick = function () { var v = el.querySelector('[name=mv]').value; if (v) move(o, v); };
        el.querySelector('#addnote').onclick = function () { var t = el.querySelector('#note'); if (ui.run(function () { store.addNote(o.id, t.value); }, 'Note added')) t.value = ''; };
        el.querySelector('#omore').onclick = function (e) {
          var items = [];
          if (o.fulfilment === 'new' || o.fulfilment === 'draft') items.push({ label: 'Edit order', icon: 'edit', fn: function () { app.go('#/orders/' + o.id + '/edit'); } });
          items.push({ label: 'Duplicate as new order', icon: 'copy', fn: function () { app.go('#/orders/new?from=' + o.id); } });
          items.push({ label: 'Print packing slip', icon: 'printer', fn: function () { packingSlip(o); } });
          if (canReturn) items.push({ label: 'Create return', icon: 'undo', fn: function () { returnDialog(o); } });
          if (o.payment.status !== 'pending' && refunded < total && o.fulfilment !== 'cancelled') items.push({ label: 'Record refund', icon: 'wallet', fn: function () { refundDialog(o); } });
          if (['draft', 'new', 'processing', 'packing', 'ready'].indexOf(o.fulfilment) >= 0) items.push('-', { label: 'Cancel order', icon: 'x', danger: true, fn: function () { cancelDialog(o); } });
          ui.menu(e.currentTarget, items);
        };
      }
    };
  });

  /* ---------- order actions (shared with board) ---------- */
  function move(o, to) {
    if (to === 'cancelled') return cancelDialog(o);
    var ship = store.FLOW.indexOf(to) >= store.FLOW.indexOf('shipped') && store.FLOW.indexOf(o.fulfilment) < store.FLOW.indexOf('shipped');
    if (ship) {
      ui.confirm({ title: (o.deliveryMethod === 'Store pickup' ? 'Hand over ' : 'Ship ') + o.number + '?', body: itemsCount(o) + ' units will leave ' + store.warehouse(o.warehouseId).name + ', picked from the oldest-expiring batches first. This can’t be undone — use a return if goods come back.' + (o.payment.status === 'pending' ? '<br><br><b>Payment is still pending</b> — that’s fine for pay-on-delivery orders.' : ''), ok: o.deliveryMethod === 'Store pickup' ? 'Hand over' : 'Ship order' }).then(function (ok) { if (ok) ui.run(function () { store.setFulfilment(o.id, to); }, o.number + ' → ' + store.statusLabel(to)); });
      return;
    }
    if (o.fulfilment === 'draft') { ui.run(function () { store.setFulfilment(o.id, 'new'); }, o.number + ' confirmed — stock reserved'); return; }
    ui.run(function () { store.setFulfilment(o.id, to); }, o.number + ' → ' + store.statusLabel(to));
  }
  CS.orderMove = move;
  function markPaid(o) {
    ui.modal({ title: 'Record payment for ' + o.number, sub: 'Template only — no money is collected.', body: ui.field('Payment method', ui.select('m', PAY_METHODS, o.payment.method)) + '<div class="note note--plain" style="margin-top:12px">' + ui.icon('info', 15) + '<span>Amount: <b>' + ui.money(store.total(o)) + '</b></span></div>', ok: 'Mark as paid', onOk: function (m) { return ui.run(function () { store.markPaid(o.id, m.el.querySelector('[name=m]').value); }, o.number + ' marked as paid') ? undefined : false; } });
  }
  function cancelDialog(o) {
    var paid = o.payment.status === 'paid' || o.payment.status === 'partially_refunded';
    ui.modal({ title: 'Cancel ' + o.number + '?', body: '<p style="color:var(--ink-2);margin-bottom:12px">Reserved stock goes back to available. The order stays in your records as cancelled.</p>' + ui.field('Reason', ui.select('reason', ['Customer changed their mind', 'Out of stock', 'Payment not completed', 'Duplicate order', 'Fraud suspected', 'Other'], 'Customer changed their mind')) + (paid ? '<label class="switch" style="margin-top:14px"><input type="checkbox" name="refund" checked><i></i>Record a full refund of ' + ui.money(store.total(o) - store.refunded(o)) + '</label>' : ''), ok: 'Cancel order', danger: true,
      onOk: function (m) { var d = ui.read(m.el); return ui.run(function () { store.cancelOrder(o.id, d.reason, d.refund); }, o.number + ' cancelled') ? undefined : false; } });
  }
  function refundDialog(o) {
    var max = store.total(o) - store.refunded(o);
    ui.modal({ title: 'Record refund', sub: o.number + ' · up to ' + ui.money(max), body: '<div class="fgrid">' + ui.field('Amount', '<div class="addon"><span>KES</span>' + ui.input('amount', max, { type: 'number', min: 1, max: max }) + '</div>', { req: true }) + ui.field('Reason', ui.select('reason', ['Goodwill gesture', 'Late delivery', 'Price adjustment', 'Missing item', 'Other'], 'Goodwill gesture')) + '</div><div class="note note--plain" style="margin-top:12px">' + ui.icon('info', 15) + '<span>This records the refund. Stock isn’t changed — use <b>Create return</b> when goods come back.</span></div>', ok: 'Record refund',
      onOk: function (m) { var d = ui.read(m.el); return ui.run(function () { store.recordRefund(o.id, d.amount, d.reason); }, 'Refund recorded') ? undefined : false; } });
  }
  function returnDialog(o) {
    var rows = store.returnable(o).filter(function (x) { return x.max > 0; });
    if (!rows.length) { ui.toast('Everything on this order has already been returned', 'info'); return; }
    var body = '<p class="muted" style="margin-bottom:12px">Only items marked <b>resellable</b> go back into stock at ' + store.warehouse(o.warehouseId).name + '. Damaged items are held for disposal.</p>' + rows.map(function (x) {
      return '<div class="card" style="padding:12px;margin-bottom:10px" data-line="' + x.index + '"><div class="pcell" style="margin-bottom:10px">' + ui.thumb(store.product(x.line.productId), 32) + '<div><div class="pcell__t">' + ui.esc(x.line.name) + '</div><div class="pcell__s">' + x.max + ' returnable · ' + ui.money(x.line.price) + ' each</div></div></div><div class="fgrid fgrid--3">' +
        ui.field('Qty returned', '<input class="inp inp--sm" type="number" min="0" max="' + x.max + '" value="' + (rows.length === 1 ? x.max : 0) + '" data-k="qty" aria-label="Quantity returned">') + ui.field('Reason', '<select class="sel sel--sm" data-k="reason" aria-label="Reason">' + RETURN_REASONS.map(function (r) { return '<option>' + r + '</option>'; }).join('') + '</select>') + ui.field('Condition', '<select class="sel sel--sm" data-k="condition" aria-label="Condition"><option value="resellable">Resellable — restock</option><option value="damaged">Damaged — don’t restock</option></select>') + '</div></div>';
    }).join('') + (o.payment.status !== 'pending' ? '<div class="fgrid" style="margin-top:6px"><div class="f"><label>&nbsp;</label><label class="switch"><input type="checkbox" name="refund" checked><i></i>Record a refund</label></div>' + ui.field('Refund amount', '<div class="addon"><span>KES</span>' + ui.input('refundAmount', '', { type: 'number', min: 0 }) + '</div>', { hint: 'Defaults to the value of returned items' }) + '</div>' : '<div class="note" style="margin-top:6px">' + ui.icon('info', 15) + '<span>No payment was recorded on this order, so there’s nothing to refund.</span></div>') + ui.field('Note', ui.input('note', '', { ph: 'Optional' }), { attr: ' style="margin-top:12px"' });
    ui.modal({
      title: 'Return items from ' + o.number, size: 'wide', body: body, ok: 'Log return',
      onOpen: function (el) {
        function sync() { var v = 0; el.querySelectorAll('[data-line]').forEach(function (c) { var x = store.returnable(o)[+c.getAttribute('data-line')]; v += (+c.querySelector('[data-k=qty]').value || 0) * x.line.price; }); var ra = el.querySelector('[name=refundAmount]'); if (ra && !ra.dataset.touched) ra.value = Math.min(v, store.total(o) - store.refunded(o)); }
        el.addEventListener('input', function (e) { if (e.target.name === 'refundAmount') e.target.dataset.touched = 1; sync(); }); el.addEventListener('change', sync); sync();
      },
      onOk: function (m) {
        var lines = Array.prototype.map.call(m.el.querySelectorAll('[data-line]'), function (c) { return { lineIndex: +c.getAttribute('data-line'), qty: c.querySelector('[data-k=qty]').value, reason: c.querySelector('[data-k=reason]').value, condition: c.querySelector('[data-k=condition]').value }; });
        var d = ui.read(m.el);
        return ui.run(function () { return store.createReturn({ orderId: o.id, lines: lines, refund: !!d.refund, refundAmount: d.refundAmount === '' ? null : d.refundAmount, note: d.note }); }, function (r) { return 'Return ' + r.number + ' logged' + (r.restocked ? ' — stock updated' : ''); }) ? undefined : false;
      }
    });
  }
  CS.returnDialog = returnDialog;
  function packingSlip(o) {
    var c = store.customer(o.customerId), w = store.warehouse(o.warehouseId);
    ui.modal({ title: 'Packing slip · ' + o.number, size: 'wide', body: '<div id="slip" style="font-size:13px"><div class="row row--between" style="margin-bottom:16px"><div><b style="font-size:16px">' + ui.esc(S().business.name) + '</b><div class="muted">' + ui.esc(w.name + ', ' + w.address) + '</div></div><div style="text-align:right"><b>' + o.number + '</b><div class="muted">' + ui.dateLong(o.createdAt) + '</div></div></div><div class="note note--plain" style="margin-bottom:14px"><span><b>Ship to:</b> ' + ui.esc(c.name) + ' · ' + ui.esc(o.shipTo.line1 + (o.shipTo.line1 !== c.city ? ', ' + c.city : '')) + ' · ' + ui.esc(c.phone) + ' · ' + o.deliveryMethod + '</span></div><table class="t"><thead><tr><th>Pick</th><th>Item</th><th>SKU</th><th>Batch (FEFO)</th><th class="r">Qty</th></tr></thead><tbody>' + o.lines.map(function (l) { var p = store.product(l.productId), b = (l.batches && l.batches[0]) || CS.store.batchesFor(p.id, o.warehouseId).filter(function (x) { return x.qtyRemaining > 0; }).sort(function (a, z) { return (a.expiryDate || a.receivedAt) < (z.expiryDate || z.receivedAt) ? -1 : 1; })[0]; return '<tr><td>☐</td><td>' + ui.esc(l.name) + '</td><td class="mono">' + l.sku + '</td><td class="mono">' + (b ? b.number : '—') + '</td><td class="r"><b>' + l.qty + '</b></td></tr>'; }).join('') + '</tbody></table></div>', foot: '<span class="sp"></span><button class="btn" data-x>Close</button><button class="btn btn--p" id="pr">' + ui.icon('printer', 15) + 'Print</button>', onOpen: function (el) { el.querySelector('#pr').onclick = function () { window.print(); }; } });
  }

  /* ================= ORDER FORM ================= */
  CS.route('/orders/:id/edit', function (prm) { var o = store.order(prm.id); if (!o) return null; if (['draft', 'new'].indexOf(o.fulfilment) < 0) return { title: 'Can’t edit', crumbs: [['Orders', '#/orders'], [o.number, '#/orders/' + o.id]], html: ui.empty('alert', 'This order can no longer be edited', 'Only draft and new orders can be changed. Use returns or refunds for anything else.', '<a class="btn btn--sm" href="#/orders/' + o.id + '" style="margin-top:8px">Back to order</a>') }; return orderForm(o); });
  function orderForm(o, q) {
    var isNew = !o, from = q && q.from ? store.order(q.from) : null;
    var base = o || from;
    var d = {
      customerId: base ? base.customerId : (q && q.customer) || '', channel: base ? base.channel : 'Online store', deliveryMethod: base ? base.deliveryMethod : 'Same-day rider', warehouseId: base ? base.warehouseId : 'wh-nbo',
      lines: base ? base.lines.map(function (l) { return { productId: l.productId, variantId: l.variantId, qty: l.qty }; }) : (q && q.product ? [{ productId: q.product, qty: 1 }] : [{ productId: '', qty: 1 }]),
      discount: o ? o.discount : 0, shipping: o ? o.shipping : 300, address: o && o.shipTo ? o.shipTo.line1 : ''
    };
    var custOpts = S().customers.slice().sort(function (a, b) { return a.name.localeCompare(b.name); }).map(function (c) { return { value: c.id, label: c.name + ' — ' + c.city + (c.type === 'Wholesale' ? ' (wholesale)' : '') }; });
    var html = app.ph(isNew ? 'Create order' : 'Edit ' + o.number, isNew ? 'Stock is reserved as soon as the order is saved. Drafts don’t reserve anything.' : 'Changing items re-checks availability.', '<a class="btn" href="' + (isNew ? '#/orders' : '#/orders/' + o.id) + '">Cancel</a>' + (isNew ? '<button class="btn" id="draft">Save as draft</button>' : '') + '<button class="btn btn--p" id="save">' + ui.icon('check', 15) + (isNew ? 'Create order' : 'Save changes') + '</button>');
    html += '<form id="of" class="grid g-side" novalidate><div class="stack">';
    html += '<div class="card"><div class="card__h"><h3>Customer</h3>' + (isNew ? '<div class="seg" id="cmode"><button type="button" data-m="ex" class="on">Existing</button><button type="button" data-m="new">New customer</button></div>' : '') + '</div><div class="card__b"><div id="cex">' + ui.field('', ui.select('customerId', custOpts, d.customerId, { placeholder: 'Search or choose a customer…', attr: isNew ? '' : ' disabled' })) + '</div>' +
      (isNew ? '<div id="cnew" style="display:none"><div class="fgrid">' + ui.field('Full name', ui.input('nc_name', '', { ph: 'e.g. Wanjiru Kamau' }), { req: true }) + ui.field('Phone', ui.input('nc_phone', '', { ph: '+254 7…' })) + ui.field('Email', ui.input('nc_email', '', { type: 'email', ph: 'name@example.com' })) + ui.field('City', ui.input('nc_city', 'Nairobi')) + '</div></div>' : '') + '</div></div>';
    html += '<div class="card"><div class="card__h"><h3>Items</h3><span class="sub" id="avnote"></span></div><div class="card__b"><div id="lines"></div><button type="button" class="btn btn--sm" id="addl" style="margin-top:10px">' + ui.icon('plus', 14) + 'Add product</button></div>' +
      '<div class="totals" id="tot"></div></div>';
    html += '</div><div class="stack"><div class="card"><div class="card__h"><h3>Order details</h3></div><div class="card__b"><div class="stack" style="gap:12px">' +
      ui.field('Sales channel', ui.select('channel', S().channels, d.channel)) + ui.field('Fulfil from', ui.select('warehouseId', app.whOptions(), d.warehouseId)) + ui.field('Delivery method', ui.select('deliveryMethod', S().deliveryMethods, d.deliveryMethod)) + ui.field('Delivery address', ui.input('address', d.address, { ph: 'Estate, street or building' })) +
      ui.field('Shipping charge', '<div class="addon"><span>KES</span>' + ui.input('shipping', d.shipping, { type: 'number', min: 0 }) + '</div>') + ui.field('Discount', '<div class="addon"><span>KES</span>' + ui.input('discount', d.discount, { type: 'number', min: 0 }) + '</div>') + '</div></div></div>' +
      (isNew ? '<div class="card"><div class="card__h"><h3>Payment</h3></div><div class="card__b"><div class="stack" style="gap:12px">' + ui.field('Method', ui.select('paymentMethod', PAY_METHODS, 'M-Pesa')) + '<label class="switch"><input type="checkbox" name="paid" checked><i></i>Payment already received</label><p class="muted" style="font-size:12px">Template only — no payment is taken.</p></div></div></div>' +
        '<div class="card"><div class="card__h"><h3>Note</h3></div><div class="card__b"><textarea class="ta" name="note" rows="2" placeholder="Internal note (optional)"></textarea></div></div>' : '') + '</div></form>';
    return {
      title: isNew ? 'Create order' : 'Edit', crumbs: isNew ? [['Orders', '#/orders']] : [['Orders', '#/orders'], [o.number, '#/orders/' + o.id]], html: html, static: true,
      mount: function (el) {
        var f = el.querySelector('#of'), linesEl = el.querySelector('#lines'), mode = 'ex';
        var prods = S().products.filter(function (p) { return p.status === 'active'; }).sort(function (a, b) { return a.name.localeCompare(b.name); });
        function avail(pid) { var a = store.available(pid, f.warehouseId.value); if (o && o.fulfilment === 'new' && o.warehouseId === f.warehouseId.value) o.lines.forEach(function (l) { if (l.productId === pid) a += l.qty; }); return a; }
        function lineHtml(l, i) {
          var p = l.productId && store.product(l.productId);
          return '<div class="line-ed" data-i="' + i + '"><div><select class="sel sel--sm" data-k="productId" aria-label="Product"><option value="">Choose a product…</option>' + prods.map(function (x) { return '<option value="' + x.id + '"' + (x.id === l.productId ? ' selected' : '') + '>' + ui.esc(x.name) + '</option>'; }).join('') + '</select><div class="sub" data-av></div></div>' +
            '<div>' + (p && p.variants.length ? '<select class="sel sel--sm" data-k="variantId" aria-label="Option">' + p.variants.map(function (v) { return '<option value="' + v.id + '"' + (v.id === l.variantId ? ' selected' : '') + '>' + ui.esc(v.name) + (v.priceDelta ? ' (' + (v.priceDelta > 0 ? '+' : '−') + Math.abs(v.priceDelta) + ')' : '') + '</option>'; }).join('') + '</select>' : '<span class="sub">' + (p ? 'Single item' : '') + '</span>') + '</div>' +
            '<input class="inp inp--sm" type="number" min="1" value="' + (l.qty || 1) + '" data-k="qty" aria-label="Quantity"><div class="num" style="text-align:right;font-weight:600" data-lt>—</div><button type="button" class="btn btn--ghost btn--sm btn--icon" data-rm aria-label="Remove line">' + ui.icon('trash', 14) + '</button></div>';
        }
        function draw() { linesEl.innerHTML = d.lines.map(lineHtml).join(''); calc(); }
        function read() { d.lines = Array.prototype.map.call(linesEl.querySelectorAll('.line-ed'), function (r) { var v = r.querySelector('[data-k=variantId]'); return { productId: r.querySelector('[data-k=productId]').value, variantId: v ? v.value : null, qty: r.querySelector('[data-k=qty]').value }; }); }
        function calc() {
          read();
          var sub = 0, short = 0;
          linesEl.querySelectorAll('.line-ed').forEach(function (r, i) {
            var l = d.lines[i], p = l.productId && store.product(l.productId);
            if (!p) { r.querySelector('[data-lt]').textContent = '—'; r.querySelector('[data-av]').textContent = ''; return; }
            var v = l.variantId ? p.variants.filter(function (x) { return x.id === l.variantId; })[0] : (p.variants[0] || null);
            var price = p.price + (v ? v.priceDelta : 0), q2 = +l.qty || 0, a = avail(p.id);
            sub += price * q2;
            r.querySelector('[data-lt]').textContent = ui.money(price * q2);
            var av = r.querySelector('[data-av]'); av.textContent = a + ' available at ' + store.warehouse(f.warehouseId.value).code + ' · ' + ui.money(price) + ' each';
            av.style.color = q2 > a ? 'var(--red)' : ''; if (q2 > a) short++;
          });
          var disc = +f.discount.value || 0, ship = +f.shipping.value || 0, vat = S().business.vatRate;
          el.querySelector('#tot').innerHTML = '<div><span class="muted">Subtotal</span><span class="num">' + ui.money(sub) + '</span></div>' + (disc ? '<div><span class="muted">Discount</span><span class="num">−' + ui.money(disc) + '</span></div>' : '') + '<div><span class="muted">Shipping</span><span class="num">' + (ship ? ui.money(ship) : 'Free') + '</span></div><div><span class="muted">Includes VAT</span><span class="num muted">' + ui.money((sub - disc) - (sub - disc) / (1 + vat)) + '</span></div><div class="grand"><span>Total</span><span class="num">' + ui.money(sub - disc + ship) + '</span></div>';
          el.querySelector('#avnote').innerHTML = short ? '<span style="color:var(--red)">' + short + ' line' + (short > 1 ? 's' : '') + ' exceed available stock</span>' : '';
        }
        draw();
        linesEl.addEventListener('change', function (e) { if (e.target.matches('[data-k=productId]')) { read(); draw(); } else calc(); });
        linesEl.addEventListener('input', calc);
        linesEl.addEventListener('click', function (e) { if (e.target.closest('[data-rm]')) { read(); var i = +e.target.closest('.line-ed').getAttribute('data-i'); d.lines.splice(i, 1); if (!d.lines.length) d.lines.push({ productId: '', qty: 1 }); draw(); } });
        el.querySelector('#addl').onclick = function () { read(); d.lines.push({ productId: '', qty: 1 }); draw(); linesEl.lastChild.querySelector('select').focus(); };
        f.warehouseId.onchange = calc; f.discount.oninput = calc; f.shipping.oninput = calc;
        f.deliveryMethod.onchange = function () { f.shipping.value = { 'Same-day rider': 300, Courier: 450, 'Store pickup': 0, Freight: 1200 }[f.deliveryMethod.value]; calc(); };
        f.customerId.onchange = function () { var c = store.customer(f.customerId.value); if (!c) return; f.warehouseId.value = c.city === 'Mombasa' || c.city === 'Malindi' ? 'wh-mba' : c.city === 'Kisumu' ? 'wh-ksm' : 'wh-nbo'; if (c.type === 'Wholesale') { f.channel.value = 'Wholesale'; f.deliveryMethod.value = 'Freight'; f.shipping.value = 1200; } else if (c.city !== 'Nairobi' && f.deliveryMethod.value === 'Same-day rider') { f.deliveryMethod.value = 'Courier'; f.shipping.value = 450; } calc(); };
        if (isNew && !from && q && q.customer) f.customerId.onchange();
        var cm = el.querySelector('#cmode'); if (cm) cm.onclick = function (e) { var b = e.target.closest('[data-m]'); if (!b) return; mode = b.getAttribute('data-m'); cm.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); }); el.querySelector('#cex').style.display = mode === 'ex' ? '' : 'none'; el.querySelector('#cnew').style.display = mode === 'new' ? '' : 'none'; };
        function submit(draft) {
          read();
          var v = ui.read(f);
          var payload = { channel: v.channel, deliveryMethod: v.deliveryMethod, warehouseId: v.warehouseId, lines: d.lines.filter(function (l) { return l.productId; }), discount: v.discount, shipping: v.shipping, address: v.address, paid: v.paid, paymentMethod: v.paymentMethod, note: v.note, draft: draft };
          if (mode === 'new') payload.newCustomer = { name: v.nc_name, phone: v.nc_phone, email: v.nc_email, city: v.nc_city }; else payload.customerId = isNew ? v.customerId : o.customerId;
          var res = ui.run(function () { return isNew ? store.createOrder(payload) : (store.updateOrder(o.id, payload), o); });
          if (res) { ui.toast(isNew ? (draft ? 'Draft ' : 'Order ') + res.number + ' saved' + (draft ? '' : ' — stock reserved') : 'Order updated'); app.go('#/orders/' + res.id); }
        }
        el.querySelector('#save').onclick = function () { submit(false); };
        var dr = el.querySelector('#draft'); if (dr) dr.onclick = function () { submit(true); };
        f.addEventListener('submit', function (e) { e.preventDefault(); submit(false); });
      }
    };
  }

  /* ================= ORDER BOARD ================= */
  var COLS = [['new', 'New'], ['processing', 'Processing'], ['packing', 'Packing'], ['ready', 'Ready to ship'], ['shipped', 'Shipped'], ['delivered', 'Completed']];
  CS.route('/board', function () {
    var f = st.board;
    var html = app.ph('Order board', 'Drag cards between stages, or use the status menu on each card. Shipping takes stock out of the warehouse.', '<a class="btn btn--p" href="#/orders/new">' + ui.icon('plus', 15) + 'Create order</a>');
    html += '<div class="card" style="margin-bottom:14px"><div class="tbar" style="border:0"><div class="search-inp">' + ui.icon('search', 15) + '<input class="inp inp--sm" id="bq" placeholder="Order or customer…" value="' + ui.esc(f.q) + '" aria-label="Search board"></div>' + ui.select('bch', [{ value: '', label: 'All channels' }].concat(S().channels), f.channel, { cls: 'sel--sm', attr: ' style="width:auto" aria-label="Channel"' }) + ui.select('bwh', app.whOptions(true), f.wh, { cls: 'sel--sm', attr: ' style="width:auto" aria-label="Warehouse"' }) + ui.select('brange', [{ value: '3', label: 'Placed in last 3 days' }, { value: '7', label: 'Last 7 days' }, { value: '14', label: 'Last 14 days' }, { value: '30', label: 'Last 30 days' }], f.range, { cls: 'sel--sm', attr: ' style="width:auto" aria-label="Order date"' }) + '<span class="tbar__sp"></span><span class="muted" style="font-size:12px">Open orders always show; completed ones follow the date filter.</span></div></div>';
    html += '<div class="board" id="board"></div>';
    return {
      title: 'Order board', html: html, wide: true,
      mount: function (el) {
        var board = el.querySelector('#board');
        function list() {
          var since = Date.now() - (+f.range) * 864e5, qq = f.q.toLowerCase();
          return S().orders.filter(function (o) {
            if (COLS.map(function (c) { return c[0]; }).indexOf(o.fulfilment) < 0) return false;
            if ((o.fulfilment === 'delivered' || o.fulfilment === 'shipped') && new Date(o.createdAt).getTime() < since) return false;
            if (f.channel && o.channel !== f.channel) return false; if (f.wh && o.warehouseId !== f.wh) return false;
            if (qq && (o.number + ' ' + custName(o)).toLowerCase().indexOf(qq) < 0) return false;
            return true;
          });
        }
        function card(o) {
          var opts = store.options(o);
          var age = (Date.now() - new Date(o.createdAt)) / 3600e3, late = store.OPEN.indexOf(o.fulfilment) >= 0 && age > 48;
          return '<div class="ocard" draggable="true" data-id="' + o.id + '" tabindex="0" aria-label="Order ' + o.number + '"><div class="ocard__h"><span class="ocard__n">' + o.number + '</span>' + ui.pill(o.payment.status, o.payment.status === 'pending' ? 'Unpaid' : null) + '</div><div class="ocard__c">' + ui.esc(custName(o)) + '</div><div class="ocard__m"><span>' + itemsCount(o) + ' item' + (itemsCount(o) > 1 ? 's' : '') + '</span>·<span>' + o.channel + '</span>·<span>' + (store.warehouse(o.warehouseId) || {}).code + '</span></div><div class="ocard__m"><span style="' + (late ? 'color:var(--red);font-weight:600' : '') + '">' + ui.icon('clock', 12) + ' ' + ui.rel(o.createdAt) + (late ? ' · overdue' : '') + '</span><span>' + ui.icon('truck', 12) + ' ' + o.deliveryMethod + '</span></div>' +
            '<div class="ocard__f"><span class="ocard__t num">' + ui.money(store.total(o)) + '</span>' + (opts.length ? '<select class="sel" data-mv aria-label="Change status of ' + o.number + '"><option value="">Move…</option>' + opts.map(function (s) { return '<option value="' + s + '">' + store.statusLabel(s) + '</option>'; }).join('') + '</select>' : '<span class="muted" style="font-size:11.5px">Done</span>') + '</div></div>';
        }
        function draw() {
          var all = list();
          board.innerHTML = COLS.map(function (c) {
            var items = all.filter(function (o) { return o.fulfilment === c[0]; }).sort(function (a, b) { return a.createdAt < b.createdAt ? (c[0] === 'delivered' || c[0] === 'shipped' ? 1 : -1) : (c[0] === 'delivered' || c[0] === 'shipped' ? -1 : 1); });
            var val = items.reduce(function (t, o) { return t + store.total(o); }, 0), shown = items.slice(0, 40);
            return '<section class="col" data-col="' + c[0] + '" aria-label="' + c[1] + '"><div class="col__h"><span class="dot" style="background:' + ui.statusColor(c[0]) + '"></span>' + c[1] + ' <span class="n">' + items.length + '</span><span class="v">' + ui.moneyShort(val) + '</span></div><div class="col__b">' + (shown.length ? shown.map(card).join('') : '<div class="col__more">No orders</div>') + (items.length > shown.length ? '<a class="col__more link" href="#/orders">+' + (items.length - shown.length) + ' more in Orders</a>' : '') + '</div></section>';
          }).join('');
        }
        draw();
        function edge() { board.classList.toggle('has-more', board.scrollWidth - board.clientWidth - board.scrollLeft > 4); }
        board.addEventListener('scroll', edge, { passive: true }); window.addEventListener('resize', edge); edge();
        el.querySelector('#bq').addEventListener('input', ui.debounce(function (e) { f.q = e.target.value; draw(); }, 120));
        el.querySelector('[name=bch]').onchange = function (e) { f.channel = e.target.value; draw(); };
        el.querySelector('[name=bwh]').onchange = function (e) { f.wh = e.target.value; draw(); };
        el.querySelector('[name=brange]').onchange = function (e) { f.range = e.target.value; draw(); };
        board.addEventListener('change', function (e) { if (!e.target.matches('[data-mv]')) return; var id = e.target.closest('.ocard').getAttribute('data-id'), to = e.target.value; e.target.value = ''; if (to) move(store.order(id), to); });
        board.addEventListener('click', function (e) { if (e.target.closest('select')) return; var c = e.target.closest('.ocard'); if (c) app.go('#/orders/' + c.getAttribute('data-id')); });
        board.addEventListener('keydown', function (e) { var c = e.target.closest('.ocard'); if (c && e.key === 'Enter' && e.target === c) app.go('#/orders/' + c.getAttribute('data-id')); });
        // drag & drop
        var dragId = null;
        board.addEventListener('dragstart', function (e) {
          var c = e.target.closest('.ocard'); if (!c) return; dragId = c.getAttribute('data-id'); c.classList.add('dragging');
          e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', dragId); } catch (x) { /* some browsers restrict this */ }
          var o = store.order(dragId), ok = store.options(o);
          board.querySelectorAll('.col').forEach(function (col) { var s = col.getAttribute('data-col'); if (s !== o.fulfilment && ok.indexOf(s) < 0) col.classList.add('nodrop'); });
        });
        board.addEventListener('dragend', function () { board.querySelectorAll('.dragging,.drop,.nodrop').forEach(function (x) { x.classList.remove('dragging', 'drop', 'nodrop'); }); dragId = null; });
        board.addEventListener('dragover', function (e) { var col = e.target.closest('.col'); if (!col || !dragId || col.classList.contains('nodrop')) return; e.preventDefault(); board.querySelectorAll('.col.drop').forEach(function (x) { if (x !== col) x.classList.remove('drop'); }); col.classList.add('drop'); });
        board.addEventListener('dragleave', function (e) { var col = e.target.closest('.col'); if (col && !col.contains(e.relatedTarget)) col.classList.remove('drop'); });
        board.addEventListener('drop', function (e) {
          var col = e.target.closest('.col'); if (!col || !dragId) return; e.preventDefault();
          var to = col.getAttribute('data-col'), o = store.order(dragId);
          board.querySelectorAll('.drop,.nodrop').forEach(function (x) { x.classList.remove('drop', 'nodrop'); });
          if (o.fulfilment === to) return;
          if (store.options(o).indexOf(to) < 0) { ui.toast(o.fulfilment === 'shipped' ? 'Shipped orders can only move to Completed — use a return if goods come back.' : 'That move isn’t allowed from ' + store.statusLabel(o.fulfilment) + '.', 'err'); return; }
          move(o, to);
        });
      }
    };
  });

  /* ================= RETURNS ================= */
  CS.returnsPage = function () {
    var rets = S().returns.slice().reverse();
    var refunded = rets.reduce(function (t, r) { return t + (r.refund.amount || 0); }, 0), units = rets.reduce(function (t, r) { return t + r.lines.reduce(function (a, l) { return a + l.qty; }, 0); }, 0), restocked = rets.reduce(function (t, r) { return t + r.lines.filter(function (l) { return l.condition === 'resellable'; }).reduce(function (a, l) { return a + l.qty; }, 0); }, 0);
    var html = app.ph('Returns & refunds', 'Returned goods only go back into stock when they’re marked resellable. Refunds are records — no money moves in the template.', '<button class="btn btn--p" id="newret">' + ui.icon('plus', 15) + 'New return</button>');
    html += app.tabs(TABS.map(function (t) { return [t[0], t[1], t[0] === 'returns' ? '#/returns' : '#/orders?tab=' + t[0]]; }), 'returns');
    html += '<div class="grid g-4" style="margin-bottom:16px">' + [['Returns logged', ui.num(rets.length)], ['Units returned', ui.num(units)], ['Restocked', ui.num(restocked) + ' <small>units</small>'], ['Refunds recorded', '<small>KES</small>' + ui.num(refunded)]].map(function (k) { return '<div class="card kpi"><div class="kpi__l">' + k[0] + '</div><div class="kpi__v num">' + k[1] + '</div></div>'; }).join('') + '</div>';
    html += '<div class="card card--flush"><div id="rt"></div></div>';
    return {
      title: 'Returns', crumbs: [['Orders', '#/orders']], html: html,
      mount: function (el) {
        ui.table(el.querySelector('#rt'), {
          rows: rets, pageSize: 20, showCount: true, initialSort: { key: 'date', dir: 'desc' }, onRowClick: function (r) { app.go('#/orders/' + r.orderId); }, empty: ui.empty('undo', 'No returns yet', 'Open a delivered order and choose “Create return”.'),
          columns: [
            { key: 'number', label: 'Return', render: function (r) { return '<b>' + r.number + '</b>'; } },
            { key: 'date', label: 'Date', defaultDir: 'desc', sort: function (r) { return r.createdAt; }, render: function (r) { return ui.date(r.createdAt); } },
            { key: 'order', label: 'Order', sort: function (r) { return (store.order(r.orderId) || {}).number; }, render: function (r) { var o = store.order(r.orderId); return o ? o.number + '<div class="pcell__s">' + ui.esc(custName(o)) + '</div>' : '—'; } },
            { key: 'items', label: 'Items', cls: 'wrap-cell', sort: false, render: function (r) { return r.lines.map(function (l) { return l.qty + ' × ' + ui.esc(l.name); }).join('<br>'); } },
            { key: 'reason', label: 'Reason', sort: function (r) { return r.lines[0].reason; }, render: function (r) { return '<span class="muted">' + r.lines.map(function (l) { return l.reason; }).join(', ') + '</span>'; } },
            { key: 'cond', label: 'Condition', sort: function (r) { return r.restocked ? 0 : 1; }, render: function (r) { return r.lines.map(function (l) { return l.condition === 'resellable' ? '<span class="pill pill--green">Restocked</span>' : '<span class="pill pill--red">Damaged</span>'; }).join(' '); } },
            { key: 'refund', label: 'Refund', align: 'r', sort: function (r) { return r.refund.amount || 0; }, render: function (r) { return r.refund.amount ? '<b class="num">' + ui.money(r.refund.amount) + '</b>' : '<span class="muted">None</span>'; } },
            { key: 'by', label: 'Logged by', sort: function (r) { return app.userName(r.by); }, render: function (r) { return '<span class="muted">' + ui.esc(app.userName(r.by)) + '</span>'; } }
          ]
        });
        el.querySelector('#newret').onclick = function () {
          var elig = S().orders.filter(function (o) { return ['shipped', 'delivered'].indexOf(o.fulfilment) >= 0 && store.returnable(o).some(function (x) { return x.max > 0; }); }).slice(-60).reverse();
          ui.modal({ title: 'Start a return', sub: 'Choose the shipped or delivered order the goods came from.', body: ui.field('Order', ui.select('oid', elig.map(function (o) { return { value: o.id, label: o.number + ' — ' + custName(o) + ' — ' + ui.date(o.createdAt) }; }), '')), ok: 'Continue', onOk: function (m) { var o = store.order(m.el.querySelector('[name=oid]').value); if (o) setTimeout(function () { returnDialog(o); }, 50); } });
        };
      }
    };
  };
  CS.route('/returns', function () { return CS.returnsPage(); });

  /* ================= CUSTOMERS ================= */
  function custAgg() {
    var a = {};
    S().orders.forEach(function (o) { if (!store.counted(o)) return; var x = a[o.customerId] = a[o.customerId] || { n: 0, spend: 0, last: null, first: null }; x.n++; x.spend += store.orderNet(o) - store.refunded(o) + (o.fulfilment === 'cancelled' ? 0 : 0); if (!x.last || o.createdAt > x.last) x.last = o.createdAt; if (!x.first || o.createdAt < x.first) x.first = o.createdAt; });
    return a;
  }
  function custForm(c) {
    c = c || {};
    ui.modal({
      title: c.id ? 'Edit customer' : 'Add customer', size: 'wide',
      body: '<div class="fgrid">' + ui.field('Full name or business', ui.input('name', c.name), { req: true }) + ui.field('Type', ui.select('type', ['Retail', 'Wholesale'], c.type || 'Retail')) + ui.field('Email', ui.input('email', c.email, { type: 'email' })) + ui.field('Phone', ui.input('phone', c.phone, { ph: '+254 7…' })) + ui.field('City', ui.input('city', c.city || 'Nairobi')) + ui.field('Notes', ui.input('notes', c.notes, { ph: 'Delivery instructions, terms…' })) + '</div><p class="muted" style="font-size:12px;margin-top:12px">Template customers are synthetic. Don’t enter real people’s details.</p>',
      ok: c.id ? 'Save' : 'Add customer',
      onOk: function (m) { var d = ui.read(m.el); var r = ui.run(function () { return c.id ? (store.updateCustomer(c.id, d), c) : store.addCustomer(d); }, c.id ? 'Customer updated' : 'Customer added'); if (r && !c.id) app.go('#/customers/' + r.id); return r ? undefined : false; }
    });
  }
  CS.route('/customers', function () {
    var f = st.customers, agg = custAgg();
    var rows = S().customers.map(function (c) { var a = agg[c.id] || { n: 0, spend: 0, last: null }; return { id: c.id, c: c, n: a.n, spend: a.spend, last: a.last, aov: a.n ? a.spend / a.n : 0 }; });
    var active90 = rows.filter(function (x) { return x.last && Date.now() - new Date(x.last) < 90 * 864e5; }).length, repeat = rows.filter(function (x) { return x.n > 1; }).length;
    var html = app.ph('Customers', S().customers.length + ' customers · sample data, all names and contacts are fictional', '<button class="btn" id="cexp">' + ui.icon('download', 15) + 'Export CSV</button><button class="btn btn--p" id="cadd">' + ui.icon('plus', 15) + 'Add customer</button>');
    html += '<div class="grid g-4" style="margin-bottom:16px">' + [['Customers', ui.num(rows.length)], ['Active in 90 days', ui.num(active90)], ['Repeat customers', ui.pct(rows.length ? repeat / rows.length : 0, 0)], ['Avg. lifetime spend', '<small>KES</small>' + ui.num(rows.reduce(function (t, x) { return t + x.spend; }, 0) / Math.max(1, rows.filter(function (x) { return x.n; }).length))]].map(function (k) { return '<div class="card kpi"><div class="kpi__l">' + k[0] + '</div><div class="kpi__v num">' + k[1] + '</div></div>'; }).join('') + '</div>';
    html += '<div class="card card--flush"><div class="tbar"><div class="search-inp">' + ui.icon('search', 15) + '<input class="inp inp--sm" id="cq" placeholder="Name, email, phone, city…" value="' + ui.esc(f.q) + '" aria-label="Search customers"></div>' + ui.select('ctype', [{ value: '', label: 'All types' }, 'Retail', 'Wholesale'], f.type, { cls: 'sel--sm', attr: ' style="width:auto" aria-label="Customer type"' }) + '<span class="tbar__sp"></span></div><div id="ct"></div></div>';
    return {
      title: 'Customers', html: html,
      mount: function (el) {
        function filt() { var qq = f.q.toLowerCase(); return rows.filter(function (x) { if (f.type && x.c.type !== f.type) return false; return !qq || (x.c.name + ' ' + x.c.email + ' ' + x.c.phone + ' ' + x.c.city).toLowerCase().indexOf(qq) >= 0; }); }
        var t = ui.table(el.querySelector('#ct'), {
          rows: filt(), pageSize: 20, showCount: true, initialSort: { key: 'spend', dir: 'desc' }, onRowClick: function (x) { app.go('#/customers/' + x.c.id); },
          columns: [
            { key: 'name', label: 'Customer', sort: function (x) { return x.c.name; }, render: function (x) { return '<div class="pcell">' + ui.avatar(x.c.name, true) + '<div><div class="pcell__t">' + ui.esc(x.c.name) + '</div><div class="pcell__s">' + ui.esc(x.c.email) + '</div></div></div>'; } },
            { key: 'phone', label: 'Phone', sort: function (x) { return x.c.phone; }, render: function (x) { return '<span class="muted">' + ui.esc(x.c.phone) + '</span>'; } },
            { key: 'city', label: 'City', sort: function (x) { return x.c.city; }, render: function (x) { return ui.esc(x.c.city); } },
            { key: 'type', label: 'Type', sort: function (x) { return x.c.type; }, render: function (x) { return x.c.type === 'Wholesale' ? '<span class="pill pill--violet pill--plain">Wholesale</span>' : '<span class="muted">Retail</span>'; } },
            { key: 'n', label: 'Orders', align: 'r', defaultDir: 'desc', render: function (x) { return '<span class="num">' + x.n + '</span>'; } },
            { key: 'spend', label: 'Net spend', align: 'r', defaultDir: 'desc', render: function (x) { return '<b class="num">' + ui.money(x.spend) + '</b>'; } },
            { key: 'aov', label: 'Avg. order', align: 'r', defaultDir: 'desc', render: function (x) { return x.n ? '<span class="num">' + ui.money(x.aov) + '</span>' : '<span class="muted">—</span>'; } },
            { key: 'last', label: 'Last order', defaultDir: 'desc', sort: function (x) { return x.last || ''; }, render: function (x) { return x.last ? '<span class="muted">' + ui.rel(x.last) + '</span>' : '<span class="muted">Never</span>'; } }
          ]
        });
        el.querySelector('#cq').addEventListener('input', ui.debounce(function (e) { f.q = e.target.value; t.setRows(filt()); }, 120));
        el.querySelector('[name=ctype]').onchange = function (e) { f.type = e.target.value; t.setRows(filt()); };
        el.querySelector('#cadd').onclick = function () { custForm(); };
        el.querySelector('#cexp').onclick = function () { ui.csv('ciel-shop-customers.csv', [{ label: 'Name', csv: function (x) { return x.c.name; } }, { label: 'Email', csv: function (x) { return x.c.email; } }, { label: 'Phone', csv: function (x) { return x.c.phone; } }, { label: 'City', csv: function (x) { return x.c.city; } }, { label: 'Type', csv: function (x) { return x.c.type; } }, { label: 'Orders', key: 'n' }, { label: 'Net spend (KES)', csv: function (x) { return Math.round(x.spend); } }, { label: 'Last order', csv: function (x) { return x.last ? x.last.slice(0, 10) : ''; } }], t.rows()); };
      }
    };
  });
  CS.route('/customers/:id', function (prm) {
    var c = store.customer(prm.id); if (!c) return null;
    var orders = S().orders.filter(function (o) { return o.customerId === c.id; }).slice().reverse(), a = custAgg()[c.id] || { n: 0, spend: 0, last: null, first: null };
    var fav = {}; orders.forEach(function (o) { if (store.counted(o)) o.lines.forEach(function (l) { fav[l.productId] = (fav[l.productId] || 0) + l.qty; }); });
    var favs = Object.keys(fav).sort(function (x, y) { return fav[y] - fav[x]; }).slice(0, 5);
    var open = orders.filter(function (o) { return store.OPEN.indexOf(o.fulfilment) >= 0; }).length, rets = S().returns.filter(function (r) { var o = store.order(r.orderId); return o && o.customerId === c.id; }).length;
    var html = '<div class="dhead">' + ui.avatar(c.name).replace('class="avatar"', 'class="avatar" style="width:56px;height:56px;font-size:18px;background:' + ui.avatar(c.name).match(/background:([^"]+)/)[1] + '"') + '<div class="dhead__m"><h1>' + ui.esc(c.name) + '</h1><div class="meta">' + (c.type === 'Wholesale' ? '<span class="pill pill--violet pill--plain">Wholesale</span>' : '<span class="pill pill--grey pill--plain">Retail</span>') + '<span>' + ui.esc(c.city) + '</span>·<span>Customer since ' + ui.dateLong(c.createdAt) + '</span></div></div><div class="ph__acts"><button class="btn" id="ced">' + ui.icon('edit', 15) + 'Edit</button><a class="btn btn--p" href="#/orders/new?customer=' + c.id + '" id="cord">' + ui.icon('plus', 15) + 'New order</a></div></div>';
    html += '<div class="grid g-4" style="margin-bottom:16px">' + [['Orders', ui.num(a.n)], ['Net spend', '<small>KES</small>' + ui.num(a.spend)], ['Avg. order', '<small>KES</small>' + ui.num(a.n ? a.spend / a.n : 0)], ['Last order', a.last ? ui.rel(a.last) : 'Never']].map(function (k) { return '<div class="card kpi"><div class="kpi__l">' + k[0] + '</div><div class="kpi__v num">' + k[1] + '</div></div>'; }).join('') + '</div>';
    html += '<div class="grid g-side"><div class="card card--flush"><div class="card__h"><h3>Order history</h3><span class="sub">' + open + ' open · ' + rets + ' returns</span></div><div class="card__b" style="padding-top:10px" id="cot"></div></div><div class="stack"><div class="card"><div class="card__h"><h3>Contact</h3></div><div class="card__b"><dl class="kv"><dt>Email</dt><dd>' + ui.esc(c.email || '—') + '</dd><dt>Phone</dt><dd>' + ui.esc(c.phone || '—') + '</dd><dt>City</dt><dd>' + ui.esc(c.city) + '</dd><dt>First order</dt><dd>' + (a.first ? ui.date(a.first) : '—') + '</dd></dl>' + (c.notes ? '<div class="note note--plain" style="margin-top:12px">' + ui.icon('info', 15) + '<span>' + ui.esc(c.notes) + '</span></div>' : '') + '</div></div>' +
      '<div class="card card--flush"><div class="card__h"><h3>Favourite products</h3></div><div class="card__b" style="padding-top:8px">' + (favs.length ? favs.map(function (id) { var p = store.product(id); return '<a class="lrow" href="#/products/' + id + '">' + ui.thumb(p, 30) + '<div class="lrow__m"><div class="lrow__t">' + ui.esc(p.name) + '</div></div><b class="num">' + fav[id] + '×</b></a>'; }).join('') : ui.empty('box', 'No purchases yet', '')) + '</div></div></div></div>';
    return {
      title: c.name, crumbs: [['Customers', '#/customers']], html: html,
      mount: function (el) {
        el.querySelector('#ced').onclick = function () { custForm(c); };
        ui.table(el.querySelector('#cot'), { rows: orders, pageSize: 10, showCount: true, compact: true, onRowClick: function (o) { app.go('#/orders/' + o.id); }, empty: ui.empty('cart', 'No orders yet', ''),
          columns: [{ key: 'number', label: 'Order', render: function (o) { return '<b>' + o.number + '</b>'; } }, { key: 'date', label: 'Date', sort: function (o) { return o.createdAt; }, render: function (o) { return ui.date(o.createdAt); } }, { key: 'ch', label: 'Channel', sort: function (o) { return o.channel; }, render: function (o) { return '<span class="muted">' + o.channel + '</span>'; } }, { key: 'pay', label: 'Payment', sort: function (o) { return o.payment.status; }, render: function (o) { return ui.pill(o.payment.status); } }, { key: 'ful', label: 'Fulfilment', sort: function (o) { return o.fulfilment; }, render: function (o) { return ui.pill(o.fulfilment); } }, { key: 'total', label: 'Total', align: 'r', sort: store.total, render: function (o) { return '<b class="num">' + ui.money(store.total(o)) + '</b>'; } }] });
      }
    };
  });
})();
