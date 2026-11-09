/* ============================================================
   CIEL SHOP — Suppliers, Purchase orders, Settings
   ============================================================ */
(function () {
  'use strict';
  var ui = CS.ui, store = CS.store, app = CS.app;
  function S() { return store.state; }
  var st = app.state = app.state || {};
  st.po = st.po || { tab: 'open', q: '' };
  function poValue(po) { return po.lines.reduce(function (t, l) { return t + l.qty * l.unitCost; }, 0); }
  function poUnits(po) { return po.lines.reduce(function (t, l) { return t + l.qty; }, 0); }
  function poRec(po) { return po.lines.reduce(function (t, l) { return t + (l.received || 0); }, 0); }
  function supTabs(active) { return app.tabs([['suppliers', 'Suppliers', '#/suppliers', S().suppliers.length], ['pos', 'Purchase orders', '#/purchase-orders', S().purchaseOrders.filter(function (p) { return ['draft', 'ordered', 'partial'].indexOf(p.status) >= 0; }).length]], active); }

  /* ================= SUPPLIERS ================= */
  function supForm(s) {
    s = s || {};
    ui.modal({
      title: s.id ? 'Edit supplier' : 'Add supplier', size: 'wide',
      body: '<div class="fgrid">' + ui.field('Business name', ui.input('name', s.name), { req: true }) + ui.field('Contact person', ui.input('contact', s.contact)) + ui.field('Email', ui.input('email', s.email, { type: 'email' })) + ui.field('Phone', ui.input('phone', s.phone)) + ui.field('City', ui.input('city', s.city)) + ui.field('Payment terms', ui.input('terms', s.terms || 'Net 30')) + ui.field('Lead time (days)', ui.input('leadDays', s.leadDays != null ? s.leadDays : 7, { type: 'number', min: 0 }), { hint: 'Used to set expected delivery on new POs' }) + ui.field('Status', ui.select('status', [{ value: 'active', label: 'Active' }, { value: 'on_hold', label: 'On hold' }, { value: 'inactive', label: 'Inactive' }], s.status || 'active')) + '</div>',
      ok: s.id ? 'Save' : 'Add supplier',
      onOk: function (m) { var r = ui.run(function () { return store.saveSupplier(s.id, ui.read(m.el)); }, s.id ? 'Supplier updated' : 'Supplier added'); if (r && !s.id) app.go('#/suppliers/' + r.id); return r ? undefined : false; }
    });
  }
  CS.route('/suppliers', function () {
    var rows = S().suppliers.map(function (s) {
      var pos = S().purchaseOrders.filter(function (p) { return p.supplierId === s.id; });
      var out = pos.filter(function (p) { return p.status === 'ordered' || p.status === 'partial'; });
      var yr = pos.filter(function (p) { return p.status !== 'cancelled' && p.status !== 'draft' && Date.now() - new Date(p.createdAt) < 365 * 864e5; });
      return { id: s.id, s: s, products: S().products.filter(function (p) { return p.supplierId === s.id && p.status !== 'archived'; }).length, outstanding: out.length, outValue: out.reduce(function (t, p) { return t + poValue(p); }, 0), spend: yr.reduce(function (t, p) { return t + p.lines.reduce(function (a, l) { return a + (l.received || 0) * l.unitCost; }, 0); }, 0), last: pos.length ? pos[pos.length - 1].createdAt : null };
    });
    var html = app.ph('Suppliers', 'Who you buy from, what they supply, and what’s still on order.', '<a class="btn" href="#/purchase-orders/new">' + ui.icon('receipt', 15) + 'New purchase order</a><button class="btn btn--p" id="sadd">' + ui.icon('plus', 15) + 'Add supplier</button>');
    html += supTabs('suppliers');
    html += '<div class="card card--flush"><div class="tbar"><div class="search-inp">' + ui.icon('search', 15) + '<input class="inp inp--sm" id="sq" placeholder="Supplier, contact or city…" aria-label="Search suppliers"></div>' + ui.select('sst', [{ value: '', label: 'Any status' }, { value: 'active', label: 'Active' }, { value: 'on_hold', label: 'On hold' }, { value: 'inactive', label: 'Inactive' }], '', { cls: 'sel--sm', attr: ' style="width:auto" aria-label="Status"' }) + '<span class="tbar__sp"></span></div><div id="stb"></div></div>';
    return {
      title: 'Suppliers', html: html,
      mount: function (el) {
        var t = ui.table(el.querySelector('#stb'), {
          rows: rows, pageSize: 20, initialSort: { key: 'spend', dir: 'desc' }, onRowClick: function (x) { app.go('#/suppliers/' + x.s.id); },
          columns: [
            { key: 'name', label: 'Supplier', sort: function (x) { return x.s.name; }, render: function (x) { return '<div class="pcell"><span class="ico-c">' + ui.icon('truck', 15) + '</span><div><div class="pcell__t">' + ui.esc(x.s.name) + '</div><div class="pcell__s">' + ui.esc(x.s.contact) + ' · ' + ui.esc(x.s.city) + '</div></div></div>'; } },
            { key: 'contact', label: 'Contact', sort: function (x) { return x.s.email; }, render: function (x) { return '<span class="muted">' + ui.esc(x.s.email) + '</span><div class="pcell__s">' + ui.esc(x.s.phone) + '</div>'; } },
            { key: 'products', label: 'Products', align: 'r', defaultDir: 'desc', render: function (x) { return '<span class="num">' + x.products + '</span>'; } },
            { key: 'lead', label: 'Lead time', align: 'r', sort: function (x) { return x.s.leadDays; }, render: function (x) { return '<span class="num">' + x.s.leadDays + 'd</span>'; } },
            { key: 'outstanding', label: 'Open POs', align: 'r', defaultDir: 'desc', render: function (x) { return x.outstanding ? '<b class="num">' + x.outstanding + '</b><div class="pcell__s">' + ui.moneyShort(x.outValue) + '</div>' : '<span class="muted">—</span>'; } },
            { key: 'spend', label: 'Received (12 mo)', align: 'r', defaultDir: 'desc', render: function (x) { return '<span class="num">' + ui.money(x.spend) + '</span>'; } },
            { key: 'terms', label: 'Terms', sort: function (x) { return x.s.terms; }, render: function (x) { return '<span class="muted">' + ui.esc(x.s.terms) + '</span>'; } },
            { key: 'status', label: 'Status', sort: function (x) { return x.s.status; }, render: function (x) { return ui.pill(x.s.status); } }
          ]
        });
        function filt() { var q = el.querySelector('#sq').value.toLowerCase(), s2 = el.querySelector('[name=sst]').value; t.setRows(rows.filter(function (x) { return (!s2 || x.s.status === s2) && (!q || (x.s.name + ' ' + x.s.contact + ' ' + x.s.city).toLowerCase().indexOf(q) >= 0); })); }
        el.querySelector('#sq').addEventListener('input', ui.debounce(filt, 120)); el.querySelector('[name=sst]').onchange = filt;
        el.querySelector('#sadd').onclick = function () { supForm(); };
      }
    };
  });
  CS.route('/suppliers/:id', function (prm) {
    var s = store.supplier(prm.id); if (!s) return null;
    var pos = S().purchaseOrders.filter(function (p) { return p.supplierId === s.id; }).slice().reverse();
    var prods = S().products.filter(function (p) { return p.supplierId === s.id; });
    var snap = store.snapshot();
    var received = pos.filter(function (p) { return p.receivedAt; });
    var onTime = received.filter(function (p) { return new Date(p.receivedAt) <= new Date(new Date(p.expectedAt).getTime() + 864e5); }).length;
    var html = '<div class="dhead"><span class="ico-c ico-c--acc" style="width:52px;height:52px;border-radius:14px">' + ui.icon('truck', 24) + '</span><div class="dhead__m"><h1>' + ui.esc(s.name) + '</h1><div class="meta">' + ui.pill(s.status) + '<span>' + ui.esc(s.city) + '</span>·<span>Supplier since ' + ui.dateLong(s.since) + '</span></div></div><div class="ph__acts"><button class="btn" id="sed">' + ui.icon('edit', 15) + 'Edit</button><a class="btn btn--p" href="#/purchase-orders/new?supplier=' + s.id + '">' + ui.icon('plus', 15) + 'New purchase order</a></div></div>';
    if (s.status !== 'active') html += '<div class="note" style="margin-bottom:16px">' + ui.icon('alert', 15) + '<span>This supplier is ' + (s.status === 'on_hold' ? 'on hold' : 'inactive') + '.' + (s.status === 'inactive' ? ' New purchase orders are blocked until you reactivate them.' : '') + '</span></div>';
    html += '<div class="grid g-4" style="margin-bottom:16px">' + [['Products supplied', String(prods.length)], ['Purchase orders', String(pos.length)], ['Received (all time)', '<small>KES</small>' + ui.num(pos.reduce(function (t, p) { return t + p.lines.reduce(function (a, l) { return a + (l.received || 0) * l.unitCost; }, 0); }, 0))], ['On-time delivery', received.length ? ui.pct(onTime / received.length, 0) : '—']].map(function (k) { return '<div class="card kpi"><div class="kpi__l">' + k[0] + '</div><div class="kpi__v num">' + k[1] + '</div></div>'; }).join('') + '</div>';
    html += '<div class="grid g-side"><div class="stack"><div class="card card--flush"><div class="card__h"><h3>Purchase history</h3></div><div class="card__b" style="padding-top:10px" id="spo"></div></div>' +
      '<div class="card card--flush"><div class="card__h"><h3>Products supplied</h3></div><div class="card__b" style="padding-top:8px">' + (prods.length ? prods.map(function (p) { var x = snap.get(p.id); return '<a class="lrow" href="#/products/' + p.id + '">' + ui.thumb(p, 32) + '<div class="lrow__m"><div class="lrow__t">' + ui.esc(p.name) + '</div><div class="lrow__s">' + p.sku + ' · cost ' + ui.money(p.cost) + '</div></div><div class="lrow__r">' + (p.status === 'active' ? ui.pill(store.stockStatus(p), x.available + ' avail.') : ui.pill(p.status)) + '</div></a>'; }).join('') : ui.empty('box', 'No products linked', 'Set this supplier as preferred on a product.')) + '</div></div></div>' +
      '<div class="stack"><div class="card"><div class="card__h"><h3>Contact</h3></div><div class="card__b"><dl class="kv"><dt>Contact</dt><dd>' + ui.esc(s.contact) + '</dd><dt>Email</dt><dd>' + ui.esc(s.email) + '</dd><dt>Phone</dt><dd>' + ui.esc(s.phone) + '</dd><dt>City</dt><dd>' + ui.esc(s.city) + '</dd><dt>Terms</dt><dd>' + ui.esc(s.terms) + '</dd><dt>Lead time</dt><dd>' + s.leadDays + ' days</dd></dl></div></div></div></div>';
    return {
      title: s.name, crumbs: [['Suppliers', '#/suppliers']], html: html,
      mount: function (el) {
        el.querySelector('#sed').onclick = function () { supForm(s); };
        ui.table(el.querySelector('#spo'), { rows: pos, pageSize: 8, showCount: true, compact: true, onRowClick: function (p) { app.go('#/purchase-orders/' + p.id); }, empty: ui.empty('receipt', 'No purchase orders yet', ''), columns: poCols(false) });
      }
    };
  });

  /* ================= PURCHASE ORDERS ================= */
  function poCols(withSup) {
    var c = [{ key: 'number', label: 'PO', render: function (p) { return '<b>' + p.number + '</b>'; } }];
    if (withSup) c.push({ key: 'sup', label: 'Supplier', sort: function (p) { return store.supplier(p.supplierId).name; }, render: function (p) { return ui.esc(store.supplier(p.supplierId).name); } });
    return c.concat([
      { key: 'created', label: 'Created', defaultDir: 'desc', sort: function (p) { return p.createdAt; }, render: function (p) { return '<span class="muted">' + ui.date(p.createdAt) + '</span>'; } },
      { key: 'exp', label: 'Expected', sort: function (p) { return p.expectedAt || ''; }, render: function (p) { var late = (p.status === 'ordered' || p.status === 'partial') && p.expectedAt && new Date(p.expectedAt) < new Date(); return p.expectedAt ? '<span style="' + (late ? 'color:var(--red);font-weight:600' : '') + '">' + ui.date(p.expectedAt) + (late ? ' · late' : '') + '</span>' : '<span class="muted">—</span>'; } },
      { key: 'wh', label: 'Deliver to', sort: function (p) { return p.warehouseId; }, render: function (p) { return store.warehouse(p.warehouseId).code; } },
      { key: 'units', label: 'Received', align: 'r', sort: poRec, render: function (p) { return '<span class="num">' + poRec(p) + ' / ' + poUnits(p) + '</span>'; } },
      { key: 'value', label: 'Value', align: 'r', defaultDir: 'desc', sort: poValue, render: function (p) { return '<b class="num">' + ui.money(poValue(p)) + '</b>'; } },
      { key: 'status', label: 'Status', sort: function (p) { return ['draft', 'ordered', 'partial', 'received', 'cancelled'].indexOf(p.status); }, render: function (p) { return ui.pill(p.status, p.status === 'cancelled' ? 'Cancelled' : p.closedShort ? 'Closed short' : null); } }
    ]);
  }
  CS.route('/purchase-orders', function () {
    var f = st.po, all = S().purchaseOrders.slice().reverse();
    var TABS = [['open', 'Open', function (p) { return ['draft', 'ordered', 'partial'].indexOf(p.status) >= 0; }], ['draft', 'Drafts', function (p) { return p.status === 'draft'; }], ['ordered', 'Awaiting receipt', function (p) { return p.status === 'ordered' || p.status === 'partial'; }], ['received', 'Received', function (p) { return p.status === 'received'; }], ['all', 'All', function () { return true; }]];
    var html = app.ph('Purchase orders', 'Receiving a purchase order creates batches and updates stock in the destination warehouse.', '<a class="btn btn--p" href="#/purchase-orders/new">' + ui.icon('plus', 15) + 'New purchase order</a>');
    html += supTabs('pos');
    var openVal = all.filter(TABS[2][2]).reduce(function (t, p) { return t + poValue(p) - p.lines.reduce(function (a, l) { return a + (l.received || 0) * l.unitCost; }, 0); }, 0);
    html += '<div class="row wrap" style="margin-bottom:12px;gap:8px" id="potabs">' + TABS.map(function (t) { return '<button class="btn btn--sm' + (f.tab === t[0] ? ' btn--dark' : '') + '" data-t="' + t[0] + '">' + t[1] + ' · ' + all.filter(t[2]).length + '</button>'; }).join('') + '<span class="tbar__sp" style="flex:1"></span><span class="muted">' + ui.money(openVal) + ' still to arrive</span></div>';
    html += '<div class="card card--flush"><div id="pot"></div></div>';
    return {
      title: 'Purchase orders', crumbs: [['Suppliers', '#/suppliers']], html: html,
      mount: function (el) {
        var tab = TABS.filter(function (t) { return t[0] === f.tab; })[0] || TABS[0];
        ui.table(el.querySelector('#pot'), { rows: all.filter(tab[2]), pageSize: 20, showCount: true, initialSort: { key: 'created', dir: 'desc' }, onRowClick: function (p) { app.go('#/purchase-orders/' + p.id); }, columns: poCols(true), empty: ui.empty('receipt', 'No purchase orders here', '') });
        el.querySelector('#potabs').onclick = function (e) { var b = e.target.closest('[data-t]'); if (!b) return; f.tab = b.getAttribute('data-t'); app.render(true); };
      }
    };
  });
  CS.route('/purchase-orders/:id', function (prm, q) {
    if (prm.id === 'new') return poForm(null, q);
    var po = store.po(prm.id); if (!po) return null;
    var sup = store.supplier(po.supplierId), w = store.warehouse(po.warehouseId);
    var batches = S().batches.filter(function (b) { return b.poId === po.id && !b.transferredFrom; });
    var html = '<div class="dhead"><div class="dhead__m"><h1>' + po.number + '</h1><div class="meta">' + ui.pill(po.status, po.status === 'cancelled' ? 'Cancelled' : po.closedShort ? 'Closed short' : null) + '<a class="link" href="#/suppliers/' + sup.id + '">' + ui.esc(sup.name) + '</a>·<span>to ' + w.name + '</span></div></div><div class="ph__acts">';
    if (po.status === 'draft') html += '<a class="btn" href="#/purchase-orders/' + po.id + '/edit">' + ui.icon('edit', 15) + 'Edit</a><button class="btn btn--p" id="place">' + ui.icon('check', 15) + 'Place order</button>';
    if (po.status === 'ordered' || po.status === 'partial') html += '<button class="btn btn--p" id="rcv">' + ui.icon('receive', 15) + 'Receive goods</button>';
    if (['draft', 'ordered', 'partial'].indexOf(po.status) >= 0) html += '<button class="btn btn--danger" id="cancel">' + (po.status === 'partial' ? 'Close short' : 'Cancel') + '</button>';
    html += '</div></div>';
    if (po.status === 'draft') html += '<div class="note note--info" style="margin-bottom:16px">' + ui.icon('info', 15) + '<span>This is a draft. Placing it marks it as ordered and counts it as incoming stock. In the template nothing is sent to the supplier.</span></div>';
    var late = (po.status === 'ordered' || po.status === 'partial') && po.expectedAt && new Date(po.expectedAt) < new Date();
    if (late) html += '<div class="note" style="margin-bottom:16px">' + ui.icon('clock', 15) + '<span>Expected ' + ui.rel(po.expectedAt) + ' — chase ' + ui.esc(sup.contact) + ' on ' + ui.esc(sup.phone) + '.</span></div>';
    html += '<div class="grid g-side"><div class="stack"><div class="card card--flush"><div class="card__h"><h3>Lines</h3></div><div class="card__b" style="padding-top:10px"><div class="tscroll"><table class="t"><thead><tr><th>Product</th><th class="r">Ordered</th><th class="r">Received</th><th class="r">Unit cost</th><th class="r">Line total</th><th style="width:120px">Progress</th></tr></thead><tbody>' +
      po.lines.map(function (l) { var p = store.product(l.productId); return '<tr><td><div class="pcell">' + ui.thumb(p, 32) + '<div><a class="pcell__t" href="#/products/' + p.id + '" style="display:block">' + ui.esc(p.name) + '</a><div class="pcell__s">' + p.sku + (p.tracksExpiry ? ' · expiry tracked' : '') + '</div></div></div></td><td class="r num">' + l.qty + '</td><td class="r num"><b>' + (l.received || 0) + '</b></td><td class="r num">' + ui.money(l.unitCost) + '</td><td class="r num">' + ui.money(l.qty * l.unitCost) + '</td><td><div class="bar"><i style="width:' + Math.min(100, (l.received || 0) / l.qty * 100) + '%;background:var(--green)"></i></div></td></tr>'; }).join('') + '</tbody></table></div><div class="totals"><div class="grand"><span>Total</span><span class="num">' + ui.money(poValue(po)) + '</span></div></div></div></div>' +
      (batches.length ? '<div class="card card--flush"><div class="card__h"><h3>Batches created</h3></div><div class="card__b" style="padding-top:8px">' + batches.map(function (b) { var p = store.product(b.productId); return '<a class="lrow" href="#/batches/' + b.id + '"><span class="ico-c ico-c--green">' + ui.icon('tag', 15) + '</span><div class="lrow__m"><div class="lrow__t mono">' + b.number + '</div><div class="lrow__s">' + ui.esc(p.name) + ' · ' + b.qtyReceived + ' received ' + ui.date(b.receivedAt) + (b.expiryDate ? ' · expires ' + ui.date(b.expiryDate) : '') + '</div></div>' + ui.pill(store.batchStatus(b)) + '</a>'; }).join('') + '</div></div>' : '') +
      '</div><div class="stack"><div class="card"><div class="card__h"><h3>Details</h3></div><div class="card__b"><dl class="kv"><dt>Supplier</dt><dd>' + ui.esc(sup.name) + '</dd><dt>Terms</dt><dd>' + ui.esc(sup.terms) + '</dd><dt>Deliver to</dt><dd>' + w.name + '</dd><dt>Created</dt><dd>' + ui.dateTime(po.createdAt) + '</dd><dt>Ordered</dt><dd>' + (po.orderedAt ? ui.date(po.orderedAt) : '—') + '</dd><dt>Expected</dt><dd>' + (po.expectedAt ? ui.date(po.expectedAt) : '—') + '</dd><dt>Received</dt><dd>' + (po.receivedAt ? ui.dateTime(po.receivedAt) : '—') + '</dd><dt>Raised by</dt><dd>' + ui.esc(app.userName(po.by)) + '</dd></dl>' + (po.notes ? '<div class="note note--plain" style="margin-top:12px">' + ui.icon('info', 15) + '<span>' + ui.esc(po.notes) + '</span></div>' : '') + '</div></div></div></div>';
    return {
      title: po.number, crumbs: [['Purchase orders', '#/purchase-orders']], html: html,
      mount: function (el) {
        var pl = el.querySelector('#place'); if (pl) pl.onclick = function () { ui.confirm({ title: 'Place ' + po.number + '?', body: 'It will be marked as ordered with ' + ui.esc(sup.name) + ' and counted as incoming stock. (Template — nothing is emailed.)', ok: 'Place order' }).then(function (ok) { if (ok) ui.run(function () { store.placePO(po.id); }, po.number + ' placed'); }); };
        var rc = el.querySelector('#rcv'); if (rc) rc.onclick = function () { receiveDialog(po); };
        var cn = el.querySelector('#cancel'); if (cn) cn.onclick = function () { ui.confirm({ title: (po.status === 'partial' ? 'Close ' : 'Cancel ') + po.number + '?', body: po.status === 'partial' ? 'Outstanding quantities will no longer count as incoming. Received stock stays.' : 'The purchase order will be cancelled and stop counting as incoming stock.', ok: po.status === 'partial' ? 'Close short' : 'Cancel PO', danger: true }).then(function (ok) { if (ok) ui.run(function () { store.cancelPO(po.id); }, po.number + ' updated'); }); };
      }
    };
  });
  function receiveDialog(po) {
    var body = '<p class="muted" style="margin-bottom:12px">Enter what actually arrived. Each line becomes a batch in ' + store.warehouse(po.warehouseId).name + '. Leave a line at 0 if it hasn’t arrived yet.</p>' + po.lines.map(function (l, i) {
      var p = store.product(l.productId), out = l.qty - (l.received || 0); if (out <= 0) return '';
      return '<div class="card" style="padding:12px;margin-bottom:10px" data-line="' + i + '"><div class="pcell" style="margin-bottom:10px">' + ui.thumb(p, 30) + '<div><div class="pcell__t">' + ui.esc(p.name) + '</div><div class="pcell__s">' + out + ' outstanding of ' + l.qty + '</div></div></div><div class="fgrid ' + (p.tracksExpiry ? 'fgrid--3' : '') + '">' + ui.field('Quantity received', '<input class="inp inp--sm" type="number" min="0" max="' + out + '" value="' + out + '" data-k="qty" aria-label="Quantity received">') + ui.field('Batch number', '<input class="inp inp--sm mono" data-k="batchNumber" placeholder="Auto" aria-label="Batch number">') + (p.tracksExpiry ? ui.field('Expiry date', '<input class="inp inp--sm" type="date" data-k="expiryDate" value="' + ui.today(p.shelfLifeDays) + '" aria-label="Expiry date">', { req: true }) : '') + '</div></div>';
    }).join('');
    ui.modal({
      title: 'Receive ' + po.number, size: 'wide', body: body, ok: 'Receive into stock',
      onOk: function (m) {
        var rows = Array.prototype.map.call(m.el.querySelectorAll('[data-line]'), function (c) { var g = function (k) { var x = c.querySelector('[data-k=' + k + ']'); return x ? x.value : ''; }; return { lineIndex: +c.getAttribute('data-line'), qty: g('qty'), batchNumber: g('batchNumber'), expiryDate: g('expiryDate') }; });
        return ui.run(function () { store.receivePO(po.id, rows); }, function () { return po.status === 'received' ? po.number + ' received — stock updated' : 'Part-receipt recorded — stock updated'; }) ? undefined : false;
      }
    });
  }
  CS.route('/purchase-orders/:id/edit', function (prm) { var po = store.po(prm.id); if (!po) return null; if (po.status !== 'draft') return { title: 'Can’t edit', html: ui.empty('alert', 'Only draft purchase orders can be edited', '', '<a class="btn btn--sm" href="#/purchase-orders/' + po.id + '">Back</a>') }; return poForm(po); });
  function poForm(po, q) {
    var isNew = !po; q = q || {};
    var supId = po ? po.supplierId : q.supplier || (q.product ? (store.product(q.product) || {}).supplierId : '') || '';
    var lines = po ? po.lines.map(function (l) { return { productId: l.productId, qty: l.qty, unitCost: l.unitCost }; }) : [];
    if (isNew && q.product) { var pp = store.product(q.product); if (pp) lines.push({ productId: pp.id, qty: pp.reorderQty, unitCost: pp.cost }); }
    var html = app.ph(isNew ? 'New purchase order' : 'Edit ' + po.number, 'Draft it, check the costs, then place it. Placed orders count as incoming stock.', '<a class="btn" href="' + (isNew ? '#/purchase-orders' : '#/purchase-orders/' + po.id) + '">Cancel</a><button class="btn" id="sdraft">Save draft</button>' + (isNew ? '<button class="btn btn--p" id="splace">' + ui.icon('check', 15) + 'Place order</button>' : ''));
    html += '<form id="pof" class="grid g-side" novalidate><div class="stack"><div class="card"><div class="card__h"><h3>Products</h3><button type="button" class="btn btn--sm" id="sugg">' + ui.icon('sparkle', 14) + 'Add low-stock items</button></div><div class="card__b"><div id="pl"></div><button type="button" class="btn btn--sm" id="addl" style="margin-top:10px">' + ui.icon('plus', 14) + 'Add product</button></div><div class="totals" id="ptot"></div></div></div>' +
      '<div class="stack"><div class="card"><div class="card__h"><h3>Order details</h3></div><div class="card__b"><div class="stack" style="gap:12px">' + ui.field('Supplier', ui.select('supplierId', S().suppliers.filter(function (s) { return s.status !== 'inactive' || s.id === supId; }).map(function (s) { return { value: s.id, label: s.name + (s.status === 'on_hold' ? ' (on hold)' : '') }; }), supId, { placeholder: 'Choose a supplier…' }), { req: true }) + ui.field('Deliver to', ui.select('warehouseId', app.whOptions(), po ? po.warehouseId : 'wh-nbo')) + ui.field('Expected delivery', ui.input('expectedAt', po && po.expectedAt ? po.expectedAt.slice(0, 10) : '', { type: 'date' }), { hint: '<span id="lead"></span>' }) + ui.field('Notes', '<textarea class="ta" name="notes" rows="3">' + ui.esc(po ? po.notes : '') + '</textarea>') + '</div></div></div></div></form>';
    return {
      title: isNew ? 'New purchase order' : 'Edit', crumbs: [['Purchase orders', '#/purchase-orders']], html: html, static: true,
      mount: function (el) {
        var f = el.querySelector('#pof'), pl = el.querySelector('#pl');
        function prods() { var sid = f.supplierId.value; return S().products.filter(function (p) { return p.status !== 'archived'; }).sort(function (a, b) { var x = (a.supplierId === sid ? 0 : 1) - (b.supplierId === sid ? 0 : 1); return x || a.name.localeCompare(b.name); }); }
        function row(l, i) { var ps = prods(), sid = f.supplierId.value; return '<div class="line-ed" data-i="' + i + '" style="grid-template-columns:minmax(0,2.6fr) 90px 130px 110px 32px"><div><select class="sel sel--sm" data-k="productId" aria-label="Product"><option value="">Choose a product…</option>' + ps.map(function (p) { return '<option value="' + p.id + '"' + (p.id === l.productId ? ' selected' : '') + '>' + ui.esc(p.name) + (sid && p.supplierId !== sid ? ' (other supplier)' : '') + '</option>'; }).join('') + '</select><div class="sub" data-info></div></div><input class="inp inp--sm" type="number" min="1" data-k="qty" value="' + (l.qty || '') + '" aria-label="Quantity"><div class="addon"><span style="height:30px;border-radius:8px 0 0 8px">KES</span><input class="inp inp--sm" type="number" min="0" data-k="unitCost" value="' + (l.unitCost != null ? l.unitCost : '') + '" aria-label="Unit cost" style="border-radius:0 8px 8px 0"></div><div class="num" style="text-align:right;font-weight:600" data-lt>—</div><button type="button" class="btn btn--ghost btn--sm btn--icon" data-rm aria-label="Remove">' + ui.icon('trash', 14) + '</button></div>'; }
        function read() { lines = Array.prototype.map.call(pl.querySelectorAll('.line-ed'), function (r) { return { productId: r.querySelector('[data-k=productId]').value, qty: r.querySelector('[data-k=qty]').value, unitCost: r.querySelector('[data-k=unitCost]').value }; }); }
        function draw() { if (!lines.length) lines.push({ productId: '', qty: '', unitCost: '' }); pl.innerHTML = lines.map(row).join(''); calc(); }
        function calc() {
          read(); var tot = 0;
          pl.querySelectorAll('.line-ed').forEach(function (r, i) { var l = lines[i], p = store.product(l.productId); var t = (+l.qty || 0) * (+l.unitCost || 0); tot += t; r.querySelector('[data-lt]').textContent = p ? ui.money(t) : '—'; r.querySelector('[data-info]').textContent = p ? store.available(p.id) + ' available · reorder point ' + p.reorderPoint + ' · last cost ' + ui.money(p.cost) : ''; });
          el.querySelector('#ptot').innerHTML = '<div class="grand"><span>Total</span><span class="num">' + ui.money(tot) + '</span></div>';
          var s = store.supplier(f.supplierId.value); el.querySelector('#lead').textContent = s ? s.name + ' usually delivers in ' + s.leadDays + ' days' : '';
        }
        draw();
        pl.addEventListener('change', function (e) { if (e.target.matches('[data-k=productId]')) { var r = e.target.closest('.line-ed'), p = store.product(e.target.value); if (p) { var q2 = r.querySelector('[data-k=qty]'), c = r.querySelector('[data-k=unitCost]'); if (!q2.value) q2.value = p.reorderQty; if (!c.value) c.value = p.cost; } } calc(); });
        pl.addEventListener('input', calc);
        pl.addEventListener('click', function (e) { if (e.target.closest('[data-rm]')) { read(); lines.splice(+e.target.closest('.line-ed').getAttribute('data-i'), 1); draw(); } });
        el.querySelector('#addl').onclick = function () { read(); lines.push({ productId: '', qty: '', unitCost: '' }); draw(); };
        f.supplierId.onchange = function () { read(); draw(); var s = store.supplier(f.supplierId.value); if (s && !f.expectedAt.value) f.expectedAt.value = ui.today(s.leadDays); };
        el.querySelector('#sugg').onclick = function () {
          read(); var sid = f.supplierId.value; if (!sid) { ui.toast('Choose a supplier first', 'info'); return; }
          var have = {}; lines.forEach(function (l) { have[l.productId] = 1; });
          var add = store.lowStock().filter(function (x) { return x.p.supplierId === sid && !have[x.p.id]; });
          if (!add.length) { ui.toast('No low-stock products from this supplier', 'info'); return; }
          lines = lines.filter(function (l) { return l.productId; }).concat(add.map(function (x) { return { productId: x.p.id, qty: x.p.reorderQty, unitCost: x.p.cost }; }));
          draw(); ui.toast('Added ' + add.length + ' low-stock product' + (add.length > 1 ? 's' : ''));
        };
        if (isNew && supId && !f.expectedAt.value) { var s0 = store.supplier(supId); if (s0) f.expectedAt.value = ui.today(s0.leadDays); }
        function submit(place) {
          read(); var d = ui.read(f); d.lines = lines.filter(function (l) { return l.productId; }); d.status = place ? 'ordered' : 'draft';
          var r = ui.run(function () { return isNew ? store.createPO(d) : (store.updatePO(po.id, d), po); });
          if (r) { ui.toast(isNew ? r.number + (place ? ' placed' : ' saved as draft') : 'Draft saved'); app.go('#/purchase-orders/' + r.id); }
        }
        el.querySelector('#sdraft').onclick = function () { submit(false); };
        var sp = el.querySelector('#splace'); if (sp) sp.onclick = function () { submit(true); };
      }
    };
  }

  /* ================= SETTINGS ================= */
  CS.route('/settings', function () {
    var b = S().business, s = S().settings;
    var html = app.ph('Settings', 'Business details, inventory rules and your team.', '<button class="btn btn--p" id="ssave">' + ui.icon('check', 15) + 'Save changes</button>');
    html += '<div class="grid g-side"><form id="sf" class="stack" novalidate><div class="card"><div class="card__b" style="padding:20px">' +
      '<div class="fsec"><h3>Business</h3><p>Shown on packing slips and reports.</p><div class="fgrid">' + ui.field('Business name', ui.input('name', b.name), { req: true }) + ui.field('Email', ui.input('email', b.email, { type: 'email' })) + ui.field('Phone', ui.input('phone', b.phone)) + ui.field('Address', ui.input('address', b.address)) + ui.field('Currency', '<div class="inp" style="display:flex;align-items:center;background:var(--bg)">KES — Kenyan shilling</div>') + ui.field('VAT rate', '<div class="addon"><span>%</span>' + ui.input('vatRate', Math.round(b.vatRate * 100), { type: 'number', min: 0, max: 50 }) + '</div>', { hint: 'Prices include VAT' }) + '</div></div>' +
      '<div class="fsec"><h3>Inventory</h3><p>How stock is picked and when you’re warned.</p><div class="stack" style="gap:14px"><label class="switch"><input type="checkbox" name="fefo"' + (s.fefo ? ' checked' : '') + '><i></i><span><b>First-expiry-first-out (FEFO)</b><br><span class="muted" style="font-weight:400">Ship the batch that expires soonest. When off, the oldest receipt ships first (FIFO).</span></span></label><label class="switch"><input type="checkbox" name="lowStockEmail"' + (s.lowStockEmail ? ' checked' : '') + '><i></i><span><b>Daily low-stock summary</b><br><span class="muted" style="font-weight:400">Email digest of products at or below their reorder point. (Not sent from the template.)</span></span></label><div class="fgrid">' + ui.field('Expiry warning window', '<div class="addon"><span>days</span>' + ui.input('expiryWarnDays', s.expiryWarnDays, { type: 'number', min: 1, max: 365 }) + '</div>', { hint: 'Batches expiring within this window are flagged' }) + ui.field('Order number prefix', ui.input('orderPrefix', s.orderPrefix), { hint: 'Applies to new orders' }) + '</div></div></div>' +
      '<div class="fsec"><h3>Categories</h3><p>Used for filters and reporting.</p><div class="row wrap" style="gap:6px;margin-bottom:10px">' + S().categories.map(function (c) { return '<span class="tag">' + ui.esc(c) + '</span>'; }).join('') + '</div><div class="row"><input class="inp inp--sm" id="newcat" placeholder="New category" style="max-width:240px" aria-label="New category"><button type="button" class="btn btn--sm" id="addcat">Add</button></div></div>' +
      '</div></div></form><div class="stack"><div class="card card--flush"><div class="card__h"><h3>Team</h3><button class="btn btn--sm" id="inv">' + ui.icon('plus', 14) + 'Add member</button></div><div class="card__b" style="padding-top:8px">' + S().team.map(function (u) { return '<div class="lrow">' + ui.avatar(u.name, true) + '<div class="lrow__m"><div class="lrow__t">' + ui.esc(u.name) + (u.id === S().currentUserId ? ' <span class="tag">you</span>' : '') + '</div><div class="lrow__s">' + ui.esc(u.role) + ' · ' + ui.esc(u.email) + (u.invited ? ' · invited' : '') + '</div></div>' + (u.id !== S().currentUserId ? '<button class="btn btn--ghost btn--sm btn--icon" data-rm="' + u.id + '" aria-label="Remove ' + ui.esc(u.name) + '">' + ui.icon('x', 14) + '</button>' : '') + '</div>'; }).join('') + '<div class="lrow" style="font-size:12px;color:var(--ink-3)">In the template, team members are sample people. Use the account menu to act as one of them — their name is recorded on every change.</div></div></div>' +
      '<div class="card"><div class="card__h"><h3>Template data</h3></div><div class="card__b"><p class="muted" style="font-size:12.5px;margin-bottom:12px">Everything you change is stored in this browser only, separate from any real Ciel Shop workspace. Seeded ' + ui.rel(S().seededAt) + '.</p><dl class="kv" style="margin-bottom:14px"><dt>Products</dt><dd>' + S().products.length + '</dd><dt>Orders</dt><dd>' + ui.num(S().orders.length) + '</dd><dt>Batches</dt><dd>' + S().batches.length + '</dd><dt>Stock movements</dt><dd>' + ui.num(S().movements.length) + '</dd></dl><p class="muted" style="font-size:12.5px;margin-bottom:12px">Sample product photos from Unsplash. <button class="link" id="credits" type="button">Photo credits</button></p><button class="btn btn--danger" id="reset" style="width:100%">' + ui.icon('refresh', 15) + 'Reset template data</button></div></div>' +
      '<div class="card"><div class="card__h"><h3>Integrations</h3></div><div class="card__b"><p class="muted" style="font-size:12.5px;margin-bottom:10px">Connected per customer during deployment. None are live in the template.</p>' + ['M-Pesa (Daraja)', 'Card payments', 'Courier booking', 'Online store sync', 'Accounting export'].map(function (n) { return '<div class="row row--between" style="padding:7px 0;border-top:1px solid var(--line)"><span>' + n + '</span><span class="pill pill--grey pill--plain">Not connected</span></div>'; }).join('') + '</div></div></div></div>';
    return {
      title: 'Settings', html: html, static: true,
      mount: function (el) {
        el.querySelector('#ssave').onclick = function () { ui.run(function () { store.saveSettings(ui.read(el.querySelector('#sf'))); }, 'Settings saved'); };
        el.querySelector('#addcat').onclick = function () { var i = el.querySelector('#newcat'); if (ui.run(function () { store.addCategory(i.value); }, 'Category added')) app.render(true); };
        el.querySelector('#reset').onclick = function () { app.reset(); };
        el.querySelector('#credits').onclick = function () { ui.modal({ title: 'Photo credits', sub: 'Sample product photos are from Unsplash and used under the Unsplash License.', size: 'wide', foot: '<span class="sp"></span><button class="btn" data-x>Close</button>', body: '<div class="grid g-2" style="gap:2px 18px">' + (CS.photoCredits || []).map(function (c) { var p = store.state.products.filter(function (x) { return x.code === c[0]; })[0]; return '<div class="lrow" style="padding:8px 0;border:0">' + (p ? ui.thumb(p, 32) : '') + '<div class="lrow__m"><div class="lrow__t">' + ui.esc(p ? p.name : c[0]) + '</div><div class="lrow__s">Photo by <a class="link" target="_blank" rel="noopener" href="https://unsplash.com/@' + c[2] + '?utm_source=ciel_shop&utm_medium=referral">' + ui.esc(c[1]) + '</a> on <a class="link" target="_blank" rel="noopener" href="https://unsplash.com/photos/' + c[3] + '?utm_source=ciel_shop&utm_medium=referral">Unsplash</a></div></div></div>'; }).join('') + '</div>' }); };
        el.querySelector('#inv').onclick = function () { ui.modal({ title: 'Add a team member', sub: 'Template — no invitation email is sent.', body: '<div class="fgrid">' + ui.field('Name', ui.input('name', ''), { req: true }) + ui.field('Email', ui.input('email', '', { type: 'email' }), { req: true }) + ui.field('Role', ui.select('role', ['Staff', 'Warehouse lead', 'Sales', 'Operations manager', 'Accountant'], 'Staff'), { full: true }) + '</div>', ok: 'Add member', onOk: function (m) { var r = ui.run(function () { store.inviteMember(ui.read(m.el)); }, 'Team member added'); if (r) app.render(true); return r ? undefined : false; } }); };
        el.querySelectorAll('[data-rm]').forEach(function (b) { b.onclick = function () { var u = store.user(b.getAttribute('data-rm')); ui.confirm({ title: 'Remove ' + u.name + '?', body: 'They’ll lose access. Their past activity stays in the records.', ok: 'Remove', danger: true }).then(function (ok) { if (ok && ui.run(function () { store.removeMember(u.id); }, u.name + ' removed')) app.render(true); }); }; });
      }
    };
  });
})();
