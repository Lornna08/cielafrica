/* ============================================================
   CIEL SHOP — Products, Inventory, Batches, Warehouses
   ============================================================ */
(function () {
  'use strict';
  var ui = CS.ui, store = CS.store, app = CS.app, charts = CS.charts;
  function S() { return store.state; }
  var st = app.state = app.state || {};
  st.products = st.products || { q: '', cat: '', stock: '', status: 'active', view: app.ui.pview || 'table' };
  st.inv = st.inv || { q: '', wh: '', status: '', cat: '' };
  st.mov = st.mov || { q: '', type: '', wh: '', range: '30' };
  st.batches = st.batches || { q: '', status: 'live', wh: '', dated: false };

  // product thumbnail: uploaded image wins over the generated glyph
  var baseThumb = ui.thumb;
  ui.thumb = function (p, size) { if (p && p.image) return '<span class="thumb" style="width:' + (size || 36) + 'px;height:' + (size || 36) + 'px"><img src="' + p.image + '" alt="" style="width:100%;height:100%;object-fit:cover"></span>'; return baseThumb(p, size); };

  function productOptions(filter, selected) {
    return S().products.filter(filter || function (p) { return p.status === 'active'; }).slice().sort(function (a, b) { return a.name.localeCompare(b.name); }).map(function (p) { return { value: p.id, label: p.name + ' · ' + p.sku, selected: p.id === selected }; });
  }

  /* ============ inventory action dialogs (shared) ============ */
  var A = CS.actions = {};
  A.receive = function (pre) {
    pre = pre || {};
    var body = '<div class="fgrid">' +
      ui.field('Product', ui.select('productId', productOptions(function (p) { return p.status !== 'archived'; }), pre.productId, { placeholder: 'Choose a product…' }), { full: true, req: true }) +
      ui.field('Warehouse', ui.select('warehouseId', app.whOptions(), pre.warehouseId || 'wh-nbo'), { req: true }) +
      ui.field('Quantity received', ui.input('qty', pre.qty || '', { type: 'number', min: 1, ph: 'e.g. 24' }), { req: true }) +
      ui.field('Unit cost', '<div class="addon"><span>KES</span>' + ui.input('unitCost', '', { type: 'number', min: 0 }) + '</div>', { hint: 'Defaults to the product’s cost price.' }) +
      ui.field('Supplier', ui.select('supplierId', S().suppliers.map(function (s) { return { value: s.id, label: s.name }; }), '', { placeholder: 'Product default' })) +
      ui.field('Batch number', ui.input('batchNumber', '', { ph: 'Auto-generated if blank' })) +
      ui.field('Reference', ui.input('ref', '', { ph: 'Delivery note, invoice…' })) +
      '<div class="f" data-exp style="display:none">' + '<label>Manufactured</label>' + ui.input('mfgDate', '', { type: 'date' }) + '</div>' +
      '<div class="f" data-exp style="display:none">' + '<label>Expiry date <span style="color:var(--acc)">*</span></label>' + ui.input('expiryDate', '', { type: 'date' }) + '<span class="hint" data-shelf></span></div></div>';
    ui.modal({
      title: 'Receive stock', sub: 'Creates a new batch and a receipt in the movement ledger.', size: 'wide', body: body, ok: 'Receive stock',
      onOpen: function (el) {
        var sel = el.querySelector('[name=productId]');
        function sync() {
          var p = store.product(sel.value);
          el.querySelector('[name=unitCost]').placeholder = p ? String(p.cost) : '';
          el.querySelectorAll('[data-exp]').forEach(function (x) { x.style.display = p && p.tracksExpiry ? '' : 'none'; });
          if (p && p.tracksExpiry) { var ex = el.querySelector('[name=expiryDate]'); if (!ex.value) ex.value = ui.today(p.shelfLifeDays); el.querySelector('[data-shelf]').textContent = 'Shelf life ' + p.shelfLifeDays + ' days'; }
        }
        sel.addEventListener('change', sync); sync();
      },
      onOk: function (m) { var d = ui.read(m.el); return ui.run(function () { var b = store.receiveStock(d); return b; }, function (b) { return 'Received into batch ' + b.number; }) ? undefined : false; }
    });
  };
  A.adjust = function (pre) {
    pre = pre || {};
    var body = '<div class="fgrid">' + ui.field('Product', ui.select('productId', productOptions(function (p) { return p.status !== 'archived'; }), pre.productId, { placeholder: 'Choose a product…' }), { full: true, req: true }) +
      ui.field('Warehouse', ui.select('warehouseId', app.whOptions(), pre.warehouseId || 'wh-nbo'), { req: true }) +
      ui.field('Counted quantity', ui.input('counted', '', { type: 'number', min: 0 }), { req: true, hint: '<span data-sys></span>' }) +
      ui.field('Reason', ui.select('reason', ['Cycle count', 'Found during stocktake', 'Miscount at receipt', 'Theft or loss', 'System correction'], 'Cycle count'), { full: true }) + '</div><div data-var style="margin-top:12px"></div>';
    ui.modal({
      title: 'Adjust stock', sub: 'Record a physical count. The difference is written to the ledger as an adjustment.', body: body, ok: 'Save adjustment', size: 'wide',
      onOpen: function (el) {
        function sync() {
          var pid = el.querySelector('[name=productId]').value, wid = el.querySelector('[name=warehouseId]').value, c = el.querySelector('[name=counted]').value;
          if (!pid) { el.querySelector('[data-sys]').textContent = ''; el.querySelector('[data-var]').innerHTML = ''; return; }
          var oh = store.onHand(pid, wid), res = store.reserved(pid, wid);
          el.querySelector('[data-sys]').textContent = 'System shows ' + oh + ' on hand · ' + res + ' reserved';
          if (c !== '') { var d = +c - oh; el.querySelector('[data-var]').innerHTML = d === 0 ? '<div class="note note--plain">' + ui.icon('check', 15) + 'Count matches the system.</div>' : '<div class="note' + (d < 0 ? '' : ' note--info') + '">' + ui.icon(d < 0 ? 'alert' : 'info', 15) + '<span>Discrepancy of <b>' + (d > 0 ? '+' : '') + d + '</b> units (' + ui.money(Math.abs(d) * (store.product(pid).cost)) + ' at cost).' + (+c < res ? ' <b>That’s below the ' + res + ' units reserved for open orders.</b>' : '') + '</span></div>'; }
          else el.querySelector('[data-var]').innerHTML = '';
        }
        el.addEventListener('input', sync); el.addEventListener('change', sync); sync();
      },
      onOk: function (m) { return ui.run(function () { return store.adjustStock(ui.read(m.el)); }, function (d) { return 'Stock adjusted (' + (d > 0 ? '+' : '') + d + ')'; }) ? undefined : false; }
    });
  };
  A.transfer = function (pre) {
    pre = pre || {};
    var body = '<div class="fgrid">' + ui.field('Product', ui.select('productId', productOptions(), pre.productId, { placeholder: 'Choose a product…' }), { full: true, req: true }) +
      ui.field('From', ui.select('from', app.whOptions(), pre.from || 'wh-nbo')) + ui.field('To', ui.select('to', app.whOptions(), pre.to || 'wh-mba')) +
      ui.field('Quantity', ui.input('qty', '', { type: 'number', min: 1 }), { req: true, hint: '<span data-av></span>' }) + ui.field('Note', ui.input('note', '', { ph: 'Optional' })) + '</div>' +
      '<div class="note note--plain" style="margin-top:12px">' + ui.icon('info', 15) + '<span>Batches move with their numbers and expiry dates, oldest expiry first.</span></div>';
    ui.modal({
      title: 'Transfer stock', body: body, ok: 'Transfer', size: 'wide',
      onOpen: function (el) { function sync() { var pid = el.querySelector('[name=productId]').value, f = el.querySelector('[name=from]').value; el.querySelector('[data-av]').textContent = pid ? store.available(pid, f) + ' available at ' + store.warehouse(f).name : ''; } el.addEventListener('change', sync); sync(); },
      onOk: function (m) { return ui.run(function () { store.transferStock(ui.read(m.el)); }, 'Transfer recorded') ? undefined : false; }
    });
  };
  A.damage = function (pre) {
    pre = pre || {};
    var body = '<div class="fgrid">' + ui.field('Product', ui.select('productId', productOptions(), pre.productId, { placeholder: 'Choose a product…' }), { full: true, req: true }) +
      ui.field('Warehouse', ui.select('warehouseId', app.whOptions(), pre.warehouseId || 'wh-nbo')) + ui.field('Quantity damaged', ui.input('qty', '', { type: 'number', min: 1 }), { req: true }) +
      ui.field('What happened?', ui.select('reason', ['Broken in storage', 'Water damage', 'Packaging crushed', 'Pest damage', 'Quality issue from supplier'], 'Broken in storage'), { full: true }) + '</div>';
    ui.modal({ title: 'Record damaged stock', sub: 'Damaged units leave available stock and are held for disposal.', body: body, ok: 'Record damage', danger: true, onOk: function (m) { return ui.run(function () { store.recordDamage(ui.read(m.el)); }, 'Damage recorded') ? undefined : false; } });
  };
  A.reorder = function (pid) {
    var p = store.product(pid);
    ui.modal({ title: 'Reorder point', sub: ui.esc(p.name), body: ui.field('Alert me when available stock falls to', ui.input('rp', p.reorderPoint, { type: 'number', min: 0 }), { hint: 'Currently ' + store.available(pid) + ' available across all warehouses.' }), ok: 'Save', onOk: function (m) { return ui.run(function () { store.setReorderPoint(pid, m.el.querySelector('[name=rp]').value); }, 'Reorder point updated') ? undefined : false; } });
  };
  function stockMenu(anchor, pid, wid) {
    ui.menu(anchor, [
      { label: 'Receive stock', icon: 'receive', fn: function () { A.receive({ productId: pid, warehouseId: wid }); } },
      { label: 'Adjust / count', icon: 'adjust', fn: function () { A.adjust({ productId: pid, warehouseId: wid }); } },
      { label: 'Transfer', icon: 'swap', fn: function () { A.transfer({ productId: pid, from: wid || 'wh-nbo' }); } },
      { label: 'Record damage', icon: 'broken', fn: function () { A.damage({ productId: pid, warehouseId: wid }); } },
      '-', { label: 'Set reorder point', icon: 'alert', fn: function () { A.reorder(pid); } },
      { label: 'Open product', icon: 'eye', fn: function () { app.go('#/products/' + pid); } }
    ]);
  }
  app.stockMenu = stockMenu;

  /* ================= PRODUCTS ================= */
  function productRows() {
    var f = st.products, snap = store.snapshot(), q = f.q.toLowerCase();
    return S().products.filter(function (p) {
      if (f.status && f.status !== 'all' && p.status !== f.status) return false;
      if (f.cat && p.category !== f.cat) return false;
      if (q && (p.name + ' ' + p.sku + ' ' + p.barcode + ' ' + p.tags.join(' ') + ' ' + p.variants.map(function (v) { return v.sku + ' ' + v.name; }).join(' ')).toLowerCase().indexOf(q) < 0) return false;
      var s = store.stockStatus(p);
      if (f.stock && s !== f.stock) return false;
      return true;
    }).map(function (p) { var s = snap.get(p.id); return { id: p.id, p: p, s: s, status: store.stockStatus(p) }; });
  }
  var PCOLS = [
    { key: 'name', label: 'Product', sort: function (x) { return x.p.name; }, render: function (x) { return '<div class="pcell">' + ui.thumb(x.p, 38) + '<div style="min-width:0"><div class="pcell__t">' + ui.esc(x.p.name) + '</div><div class="pcell__s">' + x.p.sku + '</div></div></div>'; } },
    { key: 'cat', label: 'Category', sort: function (x) { return x.p.category; }, render: function (x) { return '<span class="muted">' + ui.esc(x.p.category) + '</span>'; } },
    { key: 'pstatus', label: 'Status', sort: function (x) { return x.p.status; }, render: function (x) { return ui.pill(x.p.status); } },
    { key: 'price', label: 'Price', align: 'r', sort: function (x) { return x.p.price; }, render: function (x) { return '<span class="num">' + ui.money(x.p.price) + '</span>'; } },
    { key: 'avail', label: 'Available', align: 'r', defaultDir: 'desc', sort: function (x) { return x.s.available; }, render: function (x) { return '<div class="stockcell" style="align-items:flex-end"><b class="num">' + ui.num(x.s.available) + '</b>' + ui.stockBar(x.s.available, x.p.reorderPoint) + '</div>'; } },
    { key: 'stock', label: 'Stock', sort: function (x) { return ['out', 'low', 'in', 'draft', 'archived'].indexOf(x.status); }, render: function (x) { return x.p.status === 'active' ? ui.pill(x.status) : '<span class="muted">—</span>'; } },
    { key: 'var', label: 'Variants', align: 'c', sort: function (x) { return x.p.variants.length; }, render: function (x) { return x.p.variants.length ? '<span class="tag">' + x.p.variants.length + '</span>' : '<span class="muted">—</span>'; } },
    { key: 'upd', label: 'Updated', sort: function (x) { return x.p.updatedAt || x.p.createdAt; }, defaultDir: 'desc', render: function (x) { return '<span class="muted">' + ui.rel(x.p.updatedAt || x.p.createdAt) + '</span>'; } },
    { key: 'act', label: '', sort: false, render: function (x) { return '<button class="btn btn--ghost btn--sm btn--icon" data-more="' + x.p.id + '" aria-label="Actions for ' + ui.esc(x.p.name) + '">' + ui.icon('more') + '</button>'; } }
  ];
  function productMenu(anchor, pid) {
    var p = store.product(pid);
    ui.menu(anchor, [
      { label: 'Edit', icon: 'edit', fn: function () { app.go('#/products/' + pid + '/edit'); } },
      { label: 'Duplicate', icon: 'copy', fn: function () { var c = ui.run(function () { return store.duplicateProduct(pid); }); if (c) { ui.toast('Created ' + c.name + ' as a draft'); app.go('#/products/' + c.id + '/edit'); } } },
      { label: 'Receive stock', icon: 'receive', fn: function () { A.receive({ productId: pid }); } },
      { label: 'Adjust stock', icon: 'adjust', fn: function () { A.adjust({ productId: pid }); } },
      '-',
      p.status === 'archived' ? { label: 'Restore to active', icon: 'refresh', fn: function () { ui.run(function () { store.setProductStatus(pid, 'active'); }, p.name + ' restored'); } } :
        { label: 'Archive', icon: 'archive', danger: true, fn: function () { ui.confirm({ title: 'Archive ' + p.name + '?', body: 'Archived products are hidden from new orders and reports of active stock. You can restore it later. Stock on hand stays where it is.', ok: 'Archive', danger: true }).then(function (ok) { if (ok) ui.run(function () { store.setProductStatus(pid, 'archived'); }, p.name + ' archived'); }); } }
    ]);
  }
  CS.route('/products', function () {
    var f = st.products, counts = { all: S().products.length };
    S().products.forEach(function (p) { counts[p.status] = (counts[p.status] || 0) + 1; });
    var html = app.ph('Products', S().products.length + ' products in your catalogue', '<button class="btn" id="pexp">' + ui.icon('download', 15) + 'Export CSV</button><a class="btn btn--p" href="#/products/new">' + ui.icon('plus', 15) + 'Add product</a>');
    html += '<div class="tabs" id="ptabs">' + [['active', 'Active'], ['draft', 'Draft'], ['archived', 'Archived'], ['all', 'All']].map(function (t) { return '<button class="tab' + (f.status === t[0] ? ' on' : '') + '" data-s="' + t[0] + '">' + t[1] + ' <span class="cnt">' + (counts[t[0]] || 0) + '</span></button>'; }).join('') + '</div>';
    html += '<div class="card card--flush"><div class="tbar"><div class="search-inp">' + ui.icon('search', 15) + '<input class="inp inp--sm" id="pq" placeholder="Search name, SKU, barcode, tag…" value="' + ui.esc(f.q) + '" aria-label="Search products"></div>' +
      ui.select('pcat', [{ value: '', label: 'All categories' }].concat(S().categories), f.cat, { cls: 'sel--sm', attr: ' style="width:auto" aria-label="Category"' }) +
      ui.select('pstock', [{ value: '', label: 'Any stock status' }, { value: 'in', label: 'In stock' }, { value: 'low', label: 'Low stock' }, { value: 'out', label: 'Out of stock' }], f.stock, { cls: 'sel--sm', attr: ' style="width:auto" aria-label="Stock status"' }) +
      '<span class="tbar__sp"></span><span class="muted" id="pcount"></span><div class="seg" id="pview"><button data-v="table" class="' + (f.view === 'table' ? 'on' : '') + '" aria-label="Table view">' + ui.icon('list', 15) + '</button><button data-v="grid" class="' + (f.view === 'grid' ? 'on' : '') + '" aria-label="Grid view">' + ui.icon('tiles', 15) + '</button></div></div><div id="pt"></div></div>';
    return {
      title: 'Products', html: html,
      mount: function (el) {
        var tbl = null, rows = productRows(), host = el.querySelector('#pt');
        function draw() {
          rows = productRows();
          el.querySelector('#pcount').textContent = rows.length + ' shown';
          if (f.view === 'grid') {
            tbl = null;
            host.innerHTML = rows.length ? '<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(210px,1fr));padding:16px">' + rows.map(function (x) { return '<a class="card" href="#/products/' + x.p.id + '" style="overflow:hidden;display:flex;flex-direction:column"><div style="display:grid;place-items:center;padding:18px;background:' + (x.p.image ? 'var(--bg)' : x.p.art.bg) + '">' + ui.thumb(x.p, 96) + '</div><div style="padding:12px 14px;display:flex;flex-direction:column;gap:6px;flex:1"><div class="pcell__t" style="white-space:normal">' + ui.esc(x.p.name) + '</div><div class="pcell__s">' + x.p.sku + ' · ' + x.p.category + '</div><div class="row row--between" style="margin-top:auto;padding-top:6px"><b class="num">' + ui.money(x.p.price) + '</b>' + (x.p.status === 'active' ? ui.pill(x.status, x.s.available + ' avail.') : ui.pill(x.p.status)) + '</div></div></a>'; }).join('') + '</div>' : ui.empty('search', 'No products match', 'Clear the search or filters to see everything.');
          } else if (!tbl) {
            tbl = ui.table(host, { rows: rows, columns: PCOLS, selectable: true, pageSize: 20, showCount: true, onRowClick: function (x) { app.go('#/products/' + x.p.id); },
              bulk: function (ids) { return '<button class="btn" data-b="active">Set active</button><button class="btn" data-b="draft">Move to draft</button><button class="btn" data-b="cat">Change category</button><button class="btn" data-b="csv">Export</button><button class="btn" data-b="archived">Archive</button>'; } });
          } else tbl.setRows(rows);
        }
        draw();
        el.querySelector('#pq').addEventListener('input', ui.debounce(function (e) { f.q = e.target.value; draw(); }, 120));
        el.querySelector('[name=pcat]').onchange = function (e) { f.cat = e.target.value; draw(); };
        el.querySelector('[name=pstock]').onchange = function (e) { f.stock = e.target.value; draw(); };
        el.querySelector('#ptabs').onclick = function (e) { var b = e.target.closest('[data-s]'); if (!b) return; f.status = b.getAttribute('data-s'); app.render(true); };
        el.querySelector('#pview').onclick = function (e) { var b = e.target.closest('[data-v]'); if (!b) return; f.view = b.getAttribute('data-v'); app.savePref('pview', f.view); app.render(true); };
        host.addEventListener('click', function (e) {
          var m = e.target.closest('[data-more]'); if (m) { e.stopPropagation(); productMenu(m, m.getAttribute('data-more')); return; }
          var b = e.target.closest('[data-b]'); if (!b || !tbl) return;
          var ids = tbl.selected(), act = b.getAttribute('data-b');
          if (act === 'csv') { exportProducts(rows.filter(function (x) { return ids.indexOf(x.id) >= 0; })); return; }
          if (act === 'cat') { ui.modal({ title: 'Change category', sub: ids.length + ' products', body: ui.field('Category', ui.select('cat', S().categories, '')), ok: 'Apply', onOk: function (m2) { return ui.run(function () { store.setCategory(ids, m2.el.querySelector('[name=cat]').value); }, 'Category updated') ? undefined : false; } }); return; }
          var go = function () { if (ui.run(function () { store.setProductStatus(ids, act); }, ids.length + ' product' + (ids.length > 1 ? 's' : '') + ' updated')) tbl.clear(); };
          if (act === 'archived') ui.confirm({ title: 'Archive ' + ids.length + ' products?', body: 'They’ll be hidden from new orders. You can restore them later.', ok: 'Archive', danger: true }).then(function (ok) { if (ok) go(); }); else go();
        });
        el.querySelector('#pexp').onclick = function () { exportProducts(rows); };
      }
    };
  });
  function exportProducts(rows) {
    ui.csv('ciel-shop-products.csv', [{ label: 'Name', csv: function (x) { return x.p.name; } }, { label: 'SKU', csv: function (x) { return x.p.sku; } }, { label: 'Barcode', csv: function (x) { return x.p.barcode; } }, { label: 'Category', csv: function (x) { return x.p.category; } }, { label: 'Status', csv: function (x) { return x.p.status; } }, { label: 'Price (KES)', csv: function (x) { return x.p.price; } }, { label: 'Cost (KES)', csv: function (x) { return x.p.cost; } }, { label: 'On hand', csv: function (x) { return x.s.onHand; } }, { label: 'Reserved', csv: function (x) { return x.s.reserved; } }, { label: 'Available', csv: function (x) { return x.s.available; } }, { label: 'Reorder point', csv: function (x) { return x.p.reorderPoint; } }, { label: 'Variants', csv: function (x) { return x.p.variants.map(function (v) { return v.name + ' (' + v.sku + ')'; }).join('; '); } }], rows);
  }

  /* ---------- product workspace ---------- */
  CS.route('/products/:id', function (prm) {
    if (prm.id === 'new') return productForm(null);
    var p = store.product(prm.id); if (!p) return null;
    var snap = store.snapshot(), s = snap.get(p.id);
    var r30 = store.periodRange('30d'), sold30 = 0, rev30 = 0, orders30 = [];
    store.ordersIn(r30).forEach(function (o) { o.lines.forEach(function (l) { if (l.productId === p.id) { sold30 += l.qty; rev30 += l.price * l.qty; orders30.push(o); } }); });
    var sup = store.supplier(p.supplierId), status = store.stockStatus(p);
    var margin = p.price ? ((p.price / (1 + S().business.vatRate)) - p.cost) / (p.price / (1 + S().business.vatRate)) : 0;
    var html = '<div class="dhead"><div class="pw-hero">' + ui.thumb(p, 68) + '<div class="dhead__m"><h1>' + ui.esc(p.name) + '</h1><div class="meta"><span class="mono">' + p.sku + '</span>·<span>' + ui.esc(p.category) + '</span>' + ui.pill(p.status) + (p.status === 'active' ? ui.pill(status) : '') + (p.tracksExpiry ? '<span class="pill pill--violet pill--plain">' + ui.icon('clock', 12) + 'Expiry tracked</span>' : '') + '</div></div></div><div class="ph__acts"><a class="btn" href="#/products/' + p.id + '/edit">' + ui.icon('edit', 15) + 'Edit</a><button class="btn btn--p" id="rcv">' + ui.icon('receive', 15) + 'Receive stock</button><button class="btn btn--icon" id="pmore" aria-label="More actions">' + ui.icon('more') + '</button></div></div>';
    if (p.status === 'archived') html += '<div class="note" style="margin-bottom:16px">' + ui.icon('archive', 15) + '<span>This product is archived and can’t be added to new orders.</span></div>';
    html += '<div class="grid g-kpi">' + [['Available', s.available, 'across all warehouses'], ['On hand', s.onHand, 'physically in stock'], ['Reserved', s.reserved, 'for open orders'], ['Incoming', s.incoming, 'on purchase orders'], ['Units sold', sold30, 'last 30 days'], ['Stock value', null, 'at batch cost']].map(function (k) { return '<div class="card kpi"><div class="kpi__l">' + k[0] + '</div><div class="kpi__v num">' + (k[1] == null ? '<small>KES</small>' + ui.num(s.value) : ui.num(k[1])) + '</div><div class="kpi__f">' + k[2] + '</div></div>'; }).join('') + '</div>';
    html += '<div class="grid g-side" style="margin-top:16px"><div class="stack">';
    html += '<div class="card card--flush"><div class="card__h"><h3>Stock by warehouse</h3><button class="btn btn--sm" id="tr">' + ui.icon('swap', 14) + 'Transfer</button></div><div class="card__b" style="padding-top:10px"><div class="tscroll"><table class="t"><thead><tr><th>Warehouse</th><th class="r">On hand</th><th class="r">Reserved</th><th class="r">Available</th><th class="r">Incoming</th><th class="r">Damaged</th><th class="r">Value</th><th></th></tr></thead><tbody>' +
      S().warehouses.map(function (w) { var x = snap.get(p.id, w.id); return '<tr><td><b>' + w.name + '</b><div class="pcell__s">' + w.city + '</div></td><td class="r num">' + x.onHand + '</td><td class="r num">' + (x.reserved || '<span class="muted">0</span>') + '</td><td class="r num"><b>' + x.available + '</b></td><td class="r num">' + (x.incoming || '<span class="muted">—</span>') + '</td><td class="r num">' + (x.damaged ? '<span style="color:var(--red)">' + x.damaged + '</span>' : '<span class="muted">—</span>') + '</td><td class="r num">' + ui.money(x.value) + '</td><td class="r"><button class="btn btn--ghost btn--sm btn--icon" data-wm="' + w.id + '" aria-label="Stock actions for ' + w.name + '">' + ui.icon('more') + '</button></td></tr>'; }).join('') + '</tbody></table></div></div></div>';
    html += '<div class="card"><div class="card__h"><h3>Stock history</h3><div class="legend"><span><i style="background:#2F62B8"></i>On hand, all warehouses</span><span><i style="background:#C4532B"></i>Units sold per day</span></div></div><div class="card__b"><div class="grid g-2" style="gap:20px"><div id="sh"></div><div id="ss"></div></div></div></div>';
    var batches = store.batchesFor(p.id).filter(function (b) { return b.qtyRemaining > 0; }).sort(function (a, b) { return (a.expiryDate || a.receivedAt) < (b.expiryDate || b.receivedAt) ? -1 : 1; });
    html += '<div class="card card--flush"><div class="card__h"><h3>Batches in stock</h3><a class="link" href="#/batches?q=' + encodeURIComponent(p.code + '-') + '">All batches ' + ui.icon('arrowR', 13) + '</a></div><div class="card__b" style="padding-top:10px">' + (batches.length ? '<div class="tscroll"><table class="t t-compact"><thead><tr><th>Batch</th><th>Warehouse</th><th class="r">Remaining</th><th>Received</th>' + (p.tracksExpiry ? '<th>Expires</th>' : '') + '<th>Status</th></tr></thead><tbody>' + batches.map(function (b, i) { return '<tr class="clk" data-href="#/batches/' + b.id + '"><td><b class="mono">' + b.number + '</b>' + (i === 0 && p.tracksExpiry && S().settings.fefo ? ' <span class="tag">picks first</span>' : '') + '</td><td>' + store.warehouse(b.warehouseId).code + '</td><td class="r num">' + b.qtyRemaining + ' / ' + b.qtyReceived + '</td><td class="muted">' + ui.date(b.receivedAt) + '</td>' + (p.tracksExpiry ? '<td>' + ui.date(b.expiryDate) + ' <span class="muted">(' + store.daysToExpiry(b) + 'd)</span></td>' : '') + '<td>' + ui.pill(store.batchStatus(b)) + '</td></tr>'; }).join('') + '</tbody></table></div>' : ui.empty('tag', 'No stock on hand', 'Receive stock to create a batch.')) + '</div></div>';
    var mv = S().movements.filter(function (m) { return m.productId === p.id; }).slice(-12).reverse();
    html += '<div class="card card--flush"><div class="card__h"><h3>Recent activity</h3><a class="link" href="#/inventory?tab=movements&q=' + encodeURIComponent(p.sku) + '">Full ledger ' + ui.icon('arrowR', 13) + '</a></div><div class="card__b" style="padding-top:10px"><div class="tscroll"><table class="t t-compact"><thead><tr><th>When</th><th>Type</th><th class="r">Qty</th><th>Warehouse</th><th>Batch</th><th>Reference</th><th>By</th></tr></thead><tbody>' + (mv.length ? mv.map(function (m) { return '<tr><td class="muted">' + ui.dateTime(m.at) + '</td><td>' + app.movLabel(m.type) + '</td><td class="r num" style="color:' + (m.qty > 0 ? 'var(--green)' : 'inherit') + '"><b>' + (m.qty > 0 ? '+' : '') + (m.qty || (m.damagedQty ? m.damagedQty + ' dmg' : 0)) + '</b></td><td>' + (store.warehouse(m.warehouseId) || {}).code + '</td><td class="mono">' + (m.batchNumber || '—') + '</td><td class="muted">' + ui.esc(m.ref || '') + '</td><td class="muted">' + ui.esc(app.userName(m.by)) + '</td></tr>'; }).join('') : '<tr><td colspan="7">' + ui.empty('swap', 'No stock movements yet', '') + '</td></tr>') + '</tbody></table></div></div></div>';
    html += '</div><div class="stack">';
    html += '<div class="card"><div class="card__h"><h3>Details</h3></div><div class="card__b"><dl class="kv"><dt>Selling price</dt><dd class="num">' + ui.money(p.price) + '</dd><dt>Cost price</dt><dd class="num">' + ui.money(p.cost) + '</dd><dt>Gross margin</dt><dd>' + ui.pct(margin) + ' <span class="muted">ex-VAT</span></dd><dt>Tax</dt><dd>' + (p.taxable ? 'VAT ' + Math.round(S().business.vatRate * 100) + '% incl.' : 'Exempt') + '</dd><dt>Barcode</dt><dd class="mono">' + (p.barcode || '—') + '</dd><dt>Reorder point</dt><dd><button class="link" id="rp">' + p.reorderPoint + ' units ' + ui.icon('edit', 12) + '</button></dd><dt>Reorder quantity</dt><dd>' + p.reorderQty + ' units</dd><dt>Expiry tracking</dt><dd>' + (p.tracksExpiry ? p.shelfLifeDays + '-day shelf life' : 'Not tracked') + '</dd><dt>Supplier</dt><dd>' + (sup ? '<a class="link" href="#/suppliers/' + sup.id + '">' + ui.esc(sup.name) + '</a>' : '—') + '</dd><dt>Revenue (30d)</dt><dd class="num">' + ui.money(rev30) + '</dd></dl>' + (p.tags.length ? '<div class="row wrap" style="margin-top:14px;gap:6px">' + p.tags.map(function (t) { return '<span class="tag">' + ui.esc(t) + '</span>'; }).join('') + '</div>' : '') + (p.desc ? '<p class="muted" style="margin-top:14px">' + ui.esc(p.desc) + '</p>' : '') + '</div></div>';
    html += '<div class="card card--flush"><div class="card__h"><h3>Variants</h3><span class="sub">' + (p.variants.length || 'None') + '</span></div><div class="card__b" style="padding-top:8px">' + (p.variants.length ? p.variants.map(function (v) { var vs = 0; orders30.forEach(function (o) { o.lines.forEach(function (l) { if (l.variantId === v.id) vs += l.qty; }); }); return '<div class="lrow"><div class="lrow__m"><div class="lrow__t">' + ui.esc(v.name) + '</div><div class="lrow__s mono">' + v.sku + '</div></div><div class="lrow__r"><b class="num">' + ui.money(p.price + v.priceDelta) + '</b><div class="lrow__s">' + vs + ' sold (30d)</div></div></div>'; }).join('') + '<div class="lrow" style="font-size:12px;color:var(--ink-3)">Stock is tracked at product level and shared by all options.</div>' : '<div class="lrow muted">This product is sold as a single item.</div>') + '</div></div>';
    var recentOrders = S().orders.filter(function (o) { return o.lines.some(function (l) { return l.productId === p.id; }); }).slice(-6).reverse();
    html += '<div class="card card--flush"><div class="card__h"><h3>Recent orders</h3></div><div class="card__b" style="padding-top:8px">' + (recentOrders.length ? recentOrders.map(function (o) { var l = o.lines.filter(function (x) { return x.productId === p.id; })[0]; return '<a class="lrow" href="#/orders/' + o.id + '"><div class="lrow__m"><div class="lrow__t">' + o.number + ' · ' + ui.esc((store.customer(o.customerId) || {}).name) + '</div><div class="lrow__s">' + l.qty + ' × ' + ui.esc(l.name) + ' · ' + ui.rel(o.createdAt) + '</div></div>' + ui.pill(o.fulfilment) + '</a>'; }).join('') : ui.empty('cart', 'Not ordered yet', '')) + '</div></div>';
    html += '</div></div>';
    return {
      title: p.name, crumbs: [['Products', '#/products']], html: html,
      mount: function (el) {
        el.querySelector('#rcv').onclick = function () { A.receive({ productId: p.id }); };
        el.querySelector('#tr').onclick = function () { A.transfer({ productId: p.id }); };
        el.querySelector('#rp').onclick = function () { A.reorder(p.id); };
        el.querySelector('#pmore').onclick = function (e) { productMenu(e.currentTarget, p.id); };
        el.querySelectorAll('[data-wm]').forEach(function (b) { b.onclick = function () { stockMenu(b, p.id, b.getAttribute('data-wm')); }; });
        el.querySelectorAll('tr[data-href]').forEach(function (tr) { tr.onclick = function () { app.go(tr.getAttribute('data-href')); }; });
        // stock history: on-hand at end of each of the last 60 days, from the movement ledger
        var labels = [], vals = [], sold = [], now = new Date(), days = 60;
        var dayEnd = function (i) { return new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1); };
        for (var i = days - 1; i >= 0; i--) { var e = i === 0 ? now : dayEnd(i); labels.push(new Date(e.getTime() - 1).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })); vals.push(store.onHandAt(e, p.id)); sold.push(0); }
        S().movements.forEach(function (m) { if (m.productId !== p.id || m.type !== 'sale') return; var d = Math.floor((dayEnd(0) - new Date(m.at)) / 864e5); if (d >= 0 && d < days) sold[days - 1 - d] += -m.qty; });
        charts.line(el.querySelector('#sh'), { labels: labels, height: 200, series: [{ name: 'On hand', values: vals, color: '#2F62B8' }] });
        charts.bars(el.querySelector('#ss'), { labels: labels, height: 200, series: [{ name: 'Units shipped', values: sold, color: '#C4532B' }] });
      }
    };
  });

  /* ---------- product form ---------- */
  CS.route('/products/:id/edit', function (prm) { var p = store.product(prm.id); return p ? productForm(p) : null; });
  function productForm(p) {
    var isNew = !p;
    p = p || { name: '', sku: 'MW-', barcode: '', category: '', tags: [], desc: '', price: '', cost: '', taxable: true, status: 'active', reorderPoint: S().settings.defaultReorderPoint, reorderQty: '', tracksExpiry: false, shelfLifeDays: '', supplierId: '', variants: [] };
    var html = app.ph(isNew ? 'Add product' : 'Edit ' + ui.esc(p.name), isNew ? 'Create a catalogue item. Fields marked * are required.' : 'Changes apply to new orders. Existing orders keep the price they were sold at.', '<a class="btn" href="' + (isNew ? '#/products' : '#/products/' + p.id) + '">Cancel</a><button class="btn btn--p" id="save">' + ui.icon('check', 15) + (isNew ? 'Create product' : 'Save changes') + '</button>');
    html += '<form id="pf" class="grid g-side" novalidate><div class="stack"><div class="card"><div class="card__b" style="padding:20px">';
    html += '<div class="fsec"><h3>Basics</h3><p>What customers and your team see.</p><div class="fgrid">' + ui.field('Product name', ui.input('name', p.name, { ph: 'e.g. Raw Forest Honey 1kg' }), { full: true, req: true }) + ui.field('Description', '<textarea class="ta" name="desc" rows="3">' + ui.esc(p.desc) + '</textarea>', { full: true }) + ui.field('Category', ui.select('category', S().categories, p.category, { placeholder: 'Choose…' }), { req: true }) + ui.field('Tags', ui.input('tags', p.tags.join(', '), { ph: 'gift, bestseller' }), { hint: 'Separate with commas' }) + '</div></div>';
    html += '<div class="fsec"><h3>Pricing</h3><p>Prices include VAT. Margin is calculated ex-VAT.</p><div class="fgrid fgrid--3">' + ui.field('Selling price', '<div class="addon"><span>KES</span>' + ui.input('price', p.price, { type: 'number', min: 0 }) + '</div>', { req: true }) + ui.field('Cost price', '<div class="addon"><span>KES</span>' + ui.input('cost', p.cost, { type: 'number', min: 0 }) + '</div>', { req: true }) + ui.field('Margin', '<div class="inp" id="mg" style="display:flex;align-items:center;background:var(--bg);font-weight:600">—</div>') + '<div class="f f--full"><label class="switch"><input type="checkbox" name="taxable"' + (p.taxable ? ' checked' : '') + '><i></i>Charge VAT on this product</label></div></div></div>';
    html += '<div class="fsec"><h3>Identification</h3><p>SKUs must be unique across the catalogue.</p><div class="fgrid">' + ui.field('SKU', ui.input('sku', p.sku), { req: true }) + ui.field('Barcode (EAN/UPC)', ui.input('barcode', p.barcode, { ph: 'Optional' })) + '</div></div>';
    html += '<div class="fsec"><h3>Variants</h3><p>Options like size or colour. Each gets its own SKU and can change the price. Stock is shared across options.</p><div class="variants" id="vars"></div><button type="button" class="btn btn--sm" id="addv" style="margin-top:10px">' + ui.icon('plus', 14) + 'Add option</button></div>';
    html += '<div class="fsec"><h3>Inventory rules</h3><p>When to warn you, and how this product’s batches are handled.</p><div class="fgrid">' + ui.field('Reorder point', ui.input('reorderPoint', p.reorderPoint, { type: 'number', min: 0 }), { req: true, hint: 'Alert when available stock falls to this level' }) + ui.field('Reorder quantity', ui.input('reorderQty', p.reorderQty, { type: 'number', min: 0, ph: 'Suggested PO quantity' })) + ui.field('Preferred supplier', ui.select('supplierId', S().suppliers.filter(function (s) { return s.status !== 'inactive' || s.id === p.supplierId; }).map(function (s) { return { value: s.id, label: s.name }; }), p.supplierId, { placeholder: 'None' })) +
      '<div class="f"><label>&nbsp;</label><label class="switch"><input type="checkbox" name="tracksExpiry"' + (p.tracksExpiry ? ' checked' : '') + '><i></i>Track expiry dates (FEFO)</label></div>' + ui.field('Shelf life (days)', ui.input('shelfLifeDays', p.shelfLifeDays || '', { type: 'number', min: 1 }), { attr: ' data-shelf' + (p.tracksExpiry ? '' : ' style="display:none"'), hint: 'Used to suggest an expiry date when stock is received' }) + '</div></div>';
    if (isNew) html += '<div class="fsec"><h3>Opening stock</h3><p>Optional. Creates the first batch and a receipt in the ledger.</p><div class="fgrid fgrid--3">' + ui.field('Quantity', ui.input('initialStock', '', { type: 'number', min: 0, ph: '0' })) + ui.field('Warehouse', ui.select('warehouseId', app.whOptions(), 'wh-nbo')) + ui.field('Expiry date', ui.input('expiryDate', '', { type: 'date' }), { attr: ' data-shelf style="display:none"' }) + '</div></div>';
    html += '</div></div></div><div class="stack"><div class="card"><div class="card__h"><h3>Status</h3></div><div class="card__b">' + ui.select('status', [{ value: 'active', label: 'Active — available to sell' }, { value: 'draft', label: 'Draft — hidden from orders' }, { value: 'archived', label: 'Archived' }], p.status) + '</div></div>' +
      '<div class="card"><div class="card__h"><h3>Image</h3></div><div class="card__b"><div id="imgp" style="display:grid;place-items:center;padding:14px;background:var(--bg);border-radius:12px;margin-bottom:10px">' + ui.thumb(p.id ? p : { id: 'new', category: p.category, art: { bg: '#EFECE5', fg: '#86837B', glyph: 'Home Décor' }, image: p.image }, 120) + '</div><label class="btn btn--sm" style="width:100%">' + ui.icon('upload', 14) + 'Upload photo<input type="file" accept="image/*" id="img" class="sr"></label><p class="muted" style="font-size:12px;margin-top:8px">Resized in your browser and kept with the demo data. Without a photo, a category icon is shown.</p><input type="hidden" name="image" value=""></div></div>' +
      (isNew ? '' : '<div class="card"><div class="card__b"><dl class="kv"><dt>Created</dt><dd>' + ui.date(p.createdAt) + '</dd><dt>Last updated</dt><dd>' + ui.rel(p.updatedAt || p.createdAt) + '</dd><dt>On hand</dt><dd>' + store.onHand(p.id) + ' units</dd></dl></div></div>') + '</div></form>';
    return {
      title: isNew ? 'Add product' : 'Edit', crumbs: isNew ? [['Products', '#/products']] : [['Products', '#/products'], [p.name, '#/products/' + p.id]], html: html, static: true,
      mount: function (el) {
        var f = el.querySelector('#pf'), vars = el.querySelector('#vars'), imgData = p.image || '';
        function vrow(v) { return '<div class="vrow" data-vid="' + (v.id || '') + '"><input class="inp inp--sm" data-k="name" placeholder="Option, e.g. Large" value="' + ui.esc(v.name || '') + '" aria-label="Option name"><input class="inp inp--sm mono" data-k="sku" placeholder="SKU (auto)" value="' + ui.esc(v.sku || '') + '" aria-label="Option SKU"><div class="addon"><span style="height:30px;border-radius:8px 0 0 8px">±</span><input class="inp inp--sm" data-k="priceDelta" type="number" value="' + (v.priceDelta || 0) + '" aria-label="Price change" style="border-radius:0 8px 8px 0"></div><button type="button" class="btn btn--ghost btn--sm btn--icon" data-rmv aria-label="Remove option">' + ui.icon('trash', 14) + '</button></div>'; }
        vars.innerHTML = p.variants.map(vrow).join('');
        el.querySelector('#addv').onclick = function () { vars.insertAdjacentHTML('beforeend', vrow({})); vars.lastChild.querySelector('input').focus(); };
        vars.addEventListener('click', function (e) { var b = e.target.closest('[data-rmv]'); if (b) b.parentNode.remove(); });
        function mg() { var pr = +f.price.value, c = +f.cost.value, ex = pr / (1 + S().business.vatRate); el.querySelector('#mg').textContent = pr > 0 && f.cost.value !== '' ? ui.pct((ex - c) / ex) + '  ·  ' + ui.money(ex - c) + ' / unit' : '—'; el.querySelector('#mg').style.color = pr > 0 && (ex - c) < 0 ? 'var(--red)' : ''; }
        f.price.oninput = f.cost.oninput = mg; mg();
        f.tracksExpiry.onchange = function () { el.querySelectorAll('[data-shelf]').forEach(function (x) { x.style.display = f.tracksExpiry.checked ? '' : 'none'; }); };
        if (isNew) f.name.addEventListener('input', function () { if (f.sku.value === 'MW-' || f.sku.dataset.auto) { var code = f.name.value.replace(/[^A-Za-z ]/g, '').split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase(); f.sku.value = 'MW-' + code + '-' + String(300 + S().products.length); f.sku.dataset.auto = 1; } });
        f.sku.addEventListener('input', function () { delete f.sku.dataset.auto; });
        el.querySelector('#img').onchange = function (e) {
          var file = e.target.files[0]; if (!file) return;
          if (!/^image\//.test(file.type)) { ui.toast('Choose an image file', 'err'); return; }
          var rd = new FileReader();
          rd.onload = function () { var im = new Image(); im.onload = function () { var c = document.createElement('canvas'), s2 = 320, k = Math.min(1, s2 / Math.max(im.width, im.height)); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); imgData = c.toDataURL('image/jpeg', .82); el.querySelector('#imgp').innerHTML = '<img src="' + imgData + '" alt="" style="width:120px;height:120px;object-fit:cover;border-radius:14px">'; }; im.onerror = function () { ui.toast('That image couldn’t be read', 'err'); }; im.src = rd.result; };
          rd.readAsDataURL(file);
        };
        function submit() {
          el.querySelectorAll('.err').forEach(function (x) { x.classList.remove('err'); });
          var d = ui.read(f);
          d.variants = Array.prototype.map.call(vars.querySelectorAll('.vrow'), function (r) { return { id: r.getAttribute('data-vid') || null, name: r.querySelector('[data-k=name]').value, sku: r.querySelector('[data-k=sku]').value, priceDelta: r.querySelector('[data-k=priceDelta]').value }; });
          d.image = imgData || null;
          ['name', 'sku', 'price', 'cost', 'category'].forEach(function (k) { if (!String(d[k] || '').trim() || (k === 'sku' && d.sku === 'MW-')) f[k].classList.add('err'); });
          var res = ui.run(function () { return isNew ? store.addProduct(d) : store.updateProduct(p.id, d); });
          if (res) { ui.toast(isNew ? res.name + ' created' : 'Changes saved'); app.go('#/products/' + res.id); }
          else { var first = el.querySelector('.err'); if (first) first.focus(); }
        }
        el.querySelector('#save').onclick = submit;
        f.addEventListener('submit', function (e) { e.preventDefault(); submit(); });
      }
    };
  }

  /* ================= INVENTORY ================= */
  CS.route('/inventory', function (prm, q) {
    var tab = q.tab || 'stock';
    if (q.status) st.inv.status = q.status;
    if (q.q && tab === 'movements') st.mov.q = q.q;
    var snap = store.snapshot();
    var tot = { oh: 0, res: 0, inc: 0, val: 0, dmg: 0 };
    S().products.forEach(function (p) { var s = snap.get(p.id, st.inv.wh || null); tot.oh += s.onHand; tot.res += s.reserved; tot.inc += s.incoming; tot.val += s.value; tot.dmg += s.damaged; });
    // ledger reconciliation: movements must sum to batch stock for every product
    var led = {}; S().movements.forEach(function (m) { led[m.productId] = (led[m.productId] || 0) + m.qty; });
    var off = S().products.filter(function (p) { return (led[p.id] || 0) !== snap.get(p.id).onHand; });
    var html = app.ph('Inventory', 'Available = on hand − reserved for open orders. Every change is written to the movement ledger.', '<button class="btn" data-a="transfer">' + ui.icon('swap', 15) + 'Transfer</button><button class="btn" data-a="adjust">' + ui.icon('adjust', 15) + 'Adjust</button><button class="btn btn--p" data-a="receive">' + ui.icon('receive', 15) + 'Receive stock</button>');
    html += '<div class="grid g-kpi" style="margin-bottom:16px">' + [['Stock value', '<small>KES</small>' + ui.num(tot.val), 'at batch cost'], ['On hand', ui.num(tot.oh), 'units'], ['Reserved', ui.num(tot.res), 'for open orders'], ['Available', ui.num(tot.oh - tot.res), 'ready to sell'], ['Incoming', ui.num(tot.inc), 'on purchase orders'], ['Damaged', ui.num(tot.dmg), 'awaiting disposal']].map(function (k) { return '<div class="card kpi"><div class="kpi__l">' + k[0] + '</div><div class="kpi__v num">' + k[1] + '</div><div class="kpi__f">' + k[2] + (k[0] === 'Stock value' ? '' : '') + '</div></div>'; }).join('') + '</div>';
    html += '<div class="note ' + (off.length ? '' : 'note--plain') + '" style="margin-bottom:16px">' + ui.icon(off.length ? 'alert' : 'check', 15) + '<span>' + (off.length ? '<b>' + off.length + ' products</b> don’t reconcile with the ledger.' : '<b>Ledger check passed.</b> Stock movements reconcile with on-hand stock for all ' + S().products.length + ' products.') + ' Count discrepancies are recorded as adjustments.</span></div>';
    html += app.tabs([['stock', 'Stock levels', '#/inventory'], ['movements', 'Movement ledger', '#/inventory?tab=movements', S().movements.length], ['damaged', 'Damaged', '#/inventory?tab=damaged', Object.keys(S().damaged).filter(function (k) { return S().damaged[k] > 0; }).length]], tab);
    var mount;
    if (tab === 'stock') {
      var f = st.inv;
      html += '<div class="card card--flush"><div class="tbar"><div class="search-inp">' + ui.icon('search', 15) + '<input class="inp inp--sm" id="iq" placeholder="Search products or SKUs…" value="' + ui.esc(f.q) + '" aria-label="Search"></div>' + ui.select('iwh', app.whOptions(true), f.wh, { cls: 'sel--sm', attr: ' style="width:auto" aria-label="Warehouse"' }) + ui.select('icat', [{ value: '', label: 'All categories' }].concat(S().categories), f.cat, { cls: 'sel--sm', attr: ' style="width:auto" aria-label="Category"' }) + ui.select('ist', [{ value: '', label: 'Any status' }, { value: 'low', label: 'Low or out' }, { value: 'out', label: 'Out of stock' }, { value: 'in', label: 'In stock' }], f.status, { cls: 'sel--sm', attr: ' style="width:auto" aria-label="Status"' }) + '<span class="tbar__sp"></span><button class="btn btn--sm" id="iexp">' + ui.icon('download', 14) + 'CSV</button></div><div id="it"></div></div>';
      mount = function (el) {
        function rows() {
          var qq = f.q.toLowerCase();
          return S().products.filter(function (p) { return p.status === 'active' || snap.get(p.id).onHand > 0; }).map(function (p) { var s = snap.get(p.id, f.wh || null); return { id: p.id, p: p, s: s, status: p.status !== 'active' ? p.status : s.available <= 0 ? 'out' : s.available <= (f.wh ? Math.ceil(p.reorderPoint / 2) : p.reorderPoint) ? 'low' : 'in' }; })
            .filter(function (x) { if (qq && (x.p.name + ' ' + x.p.sku).toLowerCase().indexOf(qq) < 0) return false; if (f.cat && x.p.category !== f.cat) return false; if (f.status === 'low') return x.status === 'low' || x.status === 'out'; if (f.status) return x.status === f.status; return true; });
        }
        var t = ui.table(el.querySelector('#it'), {
          rows: rows(), pageSize: 20, showCount: true, initialSort: { key: 'status', dir: 'asc' }, onRowClick: function (x) { app.go('#/products/' + x.p.id); },
          columns: [
            { key: 'name', label: 'Product', sort: function (x) { return x.p.name; }, render: function (x) { return '<div class="pcell">' + ui.thumb(x.p, 34) + '<div><div class="pcell__t">' + ui.esc(x.p.name) + '</div><div class="pcell__s">' + x.p.sku + '</div></div></div>'; } },
            { key: 'oh', label: 'On hand', align: 'r', defaultDir: 'desc', sort: function (x) { return x.s.onHand; }, render: function (x) { return '<span class="num">' + ui.num(x.s.onHand) + '</span>'; } },
            { key: 'res', label: 'Reserved', align: 'r', defaultDir: 'desc', sort: function (x) { return x.s.reserved; }, render: function (x) { return x.s.reserved ? '<span class="num">' + x.s.reserved + '</span>' : '<span class="muted">0</span>'; } },
            { key: 'av', label: 'Available', align: 'r', defaultDir: 'desc', sort: function (x) { return x.s.available; }, render: function (x) { return '<div class="stockcell" style="align-items:flex-end"><b class="num">' + ui.num(x.s.available) + '</b>' + ui.stockBar(x.s.available, f.wh ? Math.ceil(x.p.reorderPoint / 2) : x.p.reorderPoint) + '</div>'; } },
            { key: 'inc', label: 'Incoming', align: 'r', defaultDir: 'desc', sort: function (x) { return x.s.incoming; }, render: function (x) { return x.s.incoming ? '<span class="num" style="color:var(--blue)">+' + x.s.incoming + '</span>' : '<span class="muted">—</span>'; } },
            { key: 'dmg', label: 'Damaged', align: 'r', defaultDir: 'desc', sort: function (x) { return x.s.damaged; }, render: function (x) { return x.s.damaged ? '<span class="num" style="color:var(--red)">' + x.s.damaged + '</span>' : '<span class="muted">—</span>'; } },
            { key: 'rp', label: 'Reorder at', align: 'r', sort: function (x) { return x.p.reorderPoint; }, render: function (x) { return '<span class="num muted">' + (f.wh ? Math.ceil(x.p.reorderPoint / 2) : x.p.reorderPoint) + '</span>'; } },
            { key: 'val', label: 'Value', align: 'r', defaultDir: 'desc', sort: function (x) { return x.s.value; }, render: function (x) { return '<span class="num">' + ui.money(x.s.value) + '</span>'; } },
            { key: 'status', label: 'Status', sort: function (x) { return ['out', 'low', 'in', 'draft', 'archived'].indexOf(x.status); }, render: function (x) { return ui.pill(x.status); } },
            { key: 'act', label: '', sort: false, render: function (x) { return '<button class="btn btn--ghost btn--sm btn--icon" data-sm="' + x.p.id + '" aria-label="Stock actions">' + ui.icon('more') + '</button>'; } }
          ]
        });
        function redraw() { t.setRows(rows()); }
        el.querySelector('#iq').addEventListener('input', ui.debounce(function (e) { f.q = e.target.value; redraw(); }, 120));
        el.querySelector('[name=iwh]').onchange = function (e) { f.wh = e.target.value; app.render(true); };
        el.querySelector('[name=icat]').onchange = function (e) { f.cat = e.target.value; redraw(); };
        el.querySelector('[name=ist]').onchange = function (e) { f.status = e.target.value; redraw(); };
        el.querySelector('#it').addEventListener('click', function (e) { var b = e.target.closest('[data-sm]'); if (b) stockMenu(b, b.getAttribute('data-sm'), f.wh || null); });
        el.querySelector('#iexp').onclick = function () { ui.csv('ciel-shop-stock-levels' + (f.wh ? '-' + store.warehouse(f.wh).code : '') + '.csv', [{ label: 'Product', csv: function (x) { return x.p.name; } }, { label: 'SKU', csv: function (x) { return x.p.sku; } }, { label: 'On hand', csv: function (x) { return x.s.onHand; } }, { label: 'Reserved', csv: function (x) { return x.s.reserved; } }, { label: 'Available', csv: function (x) { return x.s.available; } }, { label: 'Incoming', csv: function (x) { return x.s.incoming; } }, { label: 'Damaged', csv: function (x) { return x.s.damaged; } }, { label: 'Value (KES)', csv: function (x) { return Math.round(x.s.value); } }, { label: 'Status', key: 'status' }], t.rows()); };
      };
    }
    if (tab === 'movements') {
      var g = st.mov, TYPES = ['receipt', 'sale', 'transfer_in', 'transfer_out', 'adjustment', 'damage', 'return', 'return_damaged', 'expired', 'disposed'];
      html += '<div class="card card--flush"><div class="tbar"><div class="search-inp">' + ui.icon('search', 15) + '<input class="inp inp--sm" id="mq" placeholder="Product, SKU, batch, reference…" value="' + ui.esc(g.q) + '" aria-label="Search movements"></div>' + ui.select('mtype', [{ value: '', label: 'All types' }].concat(TYPES.map(function (t) { return { value: t, label: app.movLabel(t) }; })), g.type, { cls: 'sel--sm', attr: ' style="width:auto" aria-label="Type"' }) + ui.select('mwh', app.whOptions(true), g.wh, { cls: 'sel--sm', attr: ' style="width:auto" aria-label="Warehouse"' }) +
        ui.select('mrange', [{ value: '1', label: 'Today' }, { value: '7', label: 'Last 7 days' }, { value: '30', label: 'Last 30 days' }, { value: '90', label: 'Last 90 days' }, { value: 'all', label: 'All time' }], g.range, { cls: 'sel--sm', attr: ' style="width:auto" aria-label="Date range"' }) + '<span class="tbar__sp"></span><button class="btn btn--sm" id="mexp">' + ui.icon('download', 14) + 'CSV</button></div><div id="mt"></div></div>';
      mount = function (el) {
        function rows() {
          var qq = g.q.toLowerCase(), since = g.range === 'all' ? 0 : (g.range === '1' ? new Date(new Date().setHours(0, 0, 0, 0)).getTime() : Date.now() - (+g.range) * 864e5);
          return S().movements.filter(function (m) {
            if (new Date(m.at).getTime() < since) return false;
            if (g.type && m.type !== g.type) return false; if (g.wh && m.warehouseId !== g.wh) return false;
            if (qq) { var p = store.product(m.productId); if ((p.name + ' ' + p.sku + ' ' + (m.batchNumber || '') + ' ' + (m.ref || '') + ' ' + (m.reason || '')).toLowerCase().indexOf(qq) < 0) return false; }
            return true;
          });
        }
        var t = ui.table(el.querySelector('#mt'), {
          rows: rows(), pageSize: 25, showCount: true, compact: true, initialSort: { key: 'at', dir: 'desc' }, onRowClick: function (m) { app.go('#/products/' + m.productId); },
          columns: [
            { key: 'at', label: 'When', defaultDir: 'desc', render: function (m) { return '<span class="muted">' + ui.dateTime(m.at) + '</span>'; } },
            { key: 'p', label: 'Product', sort: function (m) { return store.product(m.productId).name; }, render: function (m) { var p = store.product(m.productId); return '<div class="pcell">' + ui.thumb(p, 26) + '<div><div class="pcell__t">' + ui.esc(p.name) + '</div><div class="pcell__s">' + p.sku + '</div></div></div>'; } },
            { key: 'type', label: 'Type', render: function (m) { return app.movLabel(m.type); } },
            { key: 'qty', label: 'Qty', align: 'r', render: function (m) { return '<b class="num" style="color:' + (m.qty > 0 ? 'var(--green)' : m.qty < 0 ? 'var(--ink)' : 'var(--red)') + '">' + (m.qty > 0 ? '+' : '') + (m.qty || (m.damagedQty ? m.damagedQty + ' dmg' : '0')) + '</b>'; } },
            { key: 'wh', label: 'Location', sort: function (m) { return m.warehouseId; }, render: function (m) { var w = store.warehouse(m.warehouseId); return (w ? w.code : '') + (m.to ? ' → ' + store.warehouse(m.to).code : m.from ? ' ← ' + store.warehouse(m.from).code : ''); } },
            { key: 'batchNumber', label: 'Batch', render: function (m) { return '<span class="mono">' + (m.batchNumber || '—') + '</span>'; } },
            { key: 'ref', label: 'Reference', render: function (m) { return '<span class="muted">' + ui.esc(m.ref || '') + '</span>'; } },
            { key: 'reason', label: 'Reason', cls: 'wrap-cell', render: function (m) { return '<span class="muted">' + ui.esc(m.reason || '') + '</span>'; } },
            { key: 'by', label: 'By', render: function (m) { return ui.esc(app.userName(m.by)); } }
          ]
        });
        function redraw() { t.setRows(rows()); }
        el.querySelector('#mq').addEventListener('input', ui.debounce(function (e) { g.q = e.target.value; redraw(); }, 150));
        ['mtype', 'mwh', 'mrange'].forEach(function (n) { el.querySelector('[name=' + n + ']').onchange = function (e) { g[{ mtype: 'type', mwh: 'wh', mrange: 'range' }[n]] = e.target.value; redraw(); }; });
        el.querySelector('#mexp').onclick = function () { ui.csv('ciel-shop-stock-movements.csv', [{ label: 'When', csv: function (m) { return m.at.slice(0, 16).replace('T', ' '); } }, { label: 'Product', csv: function (m) { return store.product(m.productId).name; } }, { label: 'SKU', csv: function (m) { return store.product(m.productId).sku; } }, { label: 'Type', csv: function (m) { return app.movLabel(m.type); } }, { label: 'Quantity', key: 'qty' }, { label: 'Damaged qty', csv: function (m) { return m.damagedQty || ''; } }, { label: 'Warehouse', csv: function (m) { return store.warehouse(m.warehouseId).code; } }, { label: 'Batch', key: 'batchNumber' }, { label: 'Reference', key: 'ref' }, { label: 'Reason', key: 'reason' }, { label: 'By', csv: function (m) { return app.userName(m.by); } }], t.rows()); };
      };
    }
    if (tab === 'damaged') {
      var drows = Object.keys(S().damaged).filter(function (k) { return S().damaged[k] > 0; }).map(function (k) { var a = k.split('|'); var p = store.product(a[0]); return { id: k, p: p, w: store.warehouse(a[1]), qty: S().damaged[k] }; });
      html += '<div class="card card--flush"><div class="card__b" style="padding-top:0" id="dt"></div></div>';
      mount = function (el) {
        ui.table(el.querySelector('#dt'), {
          rows: drows, pageSize: 20, empty: ui.empty('check', 'No damaged stock', 'Damaged items from returns or damage reports wait here until you dispose of them.'),
          columns: [
            { key: 'p', label: 'Product', sort: function (x) { return x.p.name; }, render: function (x) { return '<div class="pcell">' + ui.thumb(x.p, 32) + '<div><div class="pcell__t">' + ui.esc(x.p.name) + '</div><div class="pcell__s">' + x.p.sku + '</div></div></div>'; } },
            { key: 'w', label: 'Warehouse', sort: function (x) { return x.w.name; }, render: function (x) { return x.w.name; } },
            { key: 'qty', label: 'Damaged units', align: 'r', render: function (x) { return '<b class="num" style="color:var(--red)">' + x.qty + '</b>'; } },
            { key: 'val', label: 'Value at cost', align: 'r', sort: function (x) { return x.qty * x.p.cost; }, render: function (x) { return '<span class="num">' + ui.money(x.qty * x.p.cost) + '</span>'; } },
            { key: 'act', label: '', sort: false, align: 'r', render: function (x) { return '<button class="btn btn--sm btn--danger" data-dispose="' + x.id + '">' + ui.icon('trash', 14) + 'Dispose</button>'; } }
          ]
        });
        el.querySelector('#dt').addEventListener('click', function (e) { var b = e.target.closest('[data-dispose]'); if (!b) return; var a = b.getAttribute('data-dispose').split('|'); ui.confirm({ title: 'Dispose of damaged stock?', body: 'This writes the units off permanently and records the disposal in the ledger.', ok: 'Dispose', danger: true }).then(function (ok) { if (ok) ui.run(function () { store.disposeDamaged(a[0], a[1]); }, 'Damaged stock disposed'); }); });
      };
    }
    return {
      title: 'Inventory', html: html,
      mount: function (el) {
        el.querySelectorAll('[data-a]').forEach(function (b) { b.onclick = function () { A[b.getAttribute('data-a')]({ warehouseId: st.inv.wh || undefined }); }; });
        if (mount) mount(el);
        if (q.do === 'receive' && !app._didReceive) { app._didReceive = true; history.replaceState(null, '', '#/inventory'); A.receive(); setTimeout(function () { app._didReceive = false; }, 500); }
      }
    };
  });

  /* ================= BATCHES ================= */
  CS.route('/batches', function (prm, q) {
    var f = st.batches; if (q.status) f.status = q.status; if (q.q != null) f.q = q.q;
    var all = S().batches, cnt = { live: 0, expiring: 0, expired: 0, depleted: 0 };
    all.forEach(function (b) { var s = store.batchStatus(b); if (s === 'active' || s === 'expiring') cnt.live++; cnt[s] = (cnt[s] || 0) + 1; });
    var html = app.ph('Batches', 'Every receipt creates a batch. Perishable batches carry expiry dates and are picked first-expiry-first-out' + (S().settings.fefo ? '' : ' (FEFO is currently off in Settings)') + '.', '<button class="btn" id="bexp">' + ui.icon('download', 15) + 'Export CSV</button><button class="btn btn--p" id="brcv">' + ui.icon('receive', 15) + 'Receive batch</button>');
    html += '<div class="tabs" id="btabs">' + [['live', 'In stock', cnt.live], ['expiring', 'Expiring soon', cnt.expiring], ['expired', 'Expired', cnt.expired], ['depleted', 'Depleted', cnt.depleted], ['all', 'All', all.length]].map(function (t) { return '<button class="tab' + (f.status === t[0] ? ' on' : '') + '" data-s="' + t[0] + '">' + t[1] + ' <span class="cnt">' + t[2] + '</span></button>'; }).join('') + '</div>';
    if (cnt.expiring) html += '<div class="note" style="margin-bottom:14px">' + ui.icon('clock', 15) + '<span><b>' + cnt.expiring + ' batch' + (cnt.expiring > 1 ? 'es' : '') + '</b> expire within ' + S().settings.expiryWarnDays + ' days. With FEFO on, these are picked first for new orders.</span></div>';
    html += '<div class="card card--flush"><div class="tbar"><div class="search-inp">' + ui.icon('search', 15) + '<input class="inp inp--sm" id="bq" placeholder="Batch number, product, SKU…" value="' + ui.esc(f.q) + '" aria-label="Search batches"></div>' + ui.select('bwh', app.whOptions(true), f.wh, { cls: 'sel--sm', attr: ' style="width:auto" aria-label="Warehouse"' }) + '<label class="switch" style="font-size:12.5px"><input type="checkbox" id="bdated"' + (f.dated ? ' checked' : '') + '><i></i>Dated stock only</label><span class="tbar__sp"></span></div><div id="bt"></div></div>';
    return {
      title: 'Batches', html: html,
      mount: function (el) {
        function rows() {
          var qq = f.q.toLowerCase();
          return all.filter(function (b) {
            var s = store.batchStatus(b), p = store.product(b.productId);
            if (f.status === 'live' && !(s === 'active' || s === 'expiring')) return false;
            if (f.status !== 'live' && f.status !== 'all' && s !== f.status) return false;
            if (f.wh && b.warehouseId !== f.wh) return false;
            if (f.dated && !b.expiryDate) return false;
            if (qq && (b.number + ' ' + p.name + ' ' + p.sku).toLowerCase().indexOf(qq) < 0) return false;
            return true;
          });
        }
        var t = ui.table(el.querySelector('#bt'), {
          rows: rows(), pageSize: 20, showCount: true, initialSort: { key: 'exp', dir: 'asc' }, onRowClick: function (b) { app.go('#/batches/' + b.id); },
          columns: [
            { key: 'number', label: 'Batch', render: function (b) { return '<b class="mono">' + b.number + '</b>'; } },
            { key: 'p', label: 'Product', sort: function (b) { return store.product(b.productId).name; }, render: function (b) { var p = store.product(b.productId); return '<div class="pcell">' + ui.thumb(p, 28) + '<div><div class="pcell__t">' + ui.esc(p.name) + '</div><div class="pcell__s">' + p.sku + '</div></div></div>'; } },
            { key: 'wh', label: 'Warehouse', sort: function (b) { return b.warehouseId; }, render: function (b) { return store.warehouse(b.warehouseId).code; } },
            { key: 'sup', label: 'Supplier', sort: function (b) { return (store.supplier(b.supplierId) || {}).name || ''; }, render: function (b) { return '<span class="muted">' + ui.esc((store.supplier(b.supplierId) || {}).name || '—') + '</span>'; } },
            { key: 'rem', label: 'Remaining', align: 'r', sort: function (b) { return b.qtyRemaining; }, render: function (b) { return '<div class="stockcell" style="align-items:flex-end"><span class="num"><b>' + b.qtyRemaining + '</b> <span class="muted">/ ' + b.qtyReceived + '</span></span><div class="bar" style="width:70px"><i style="width:' + (b.qtyReceived ? b.qtyRemaining / b.qtyReceived * 100 : 0) + '%;background:var(--c2)"></i></div></div>'; } },
            { key: 'rec', label: 'Received', sort: function (b) { return b.receivedAt; }, render: function (b) { return '<span class="muted">' + ui.date(b.receivedAt) + '</span>'; } },
            { key: 'exp', label: 'Expires', sort: function (b) { return b.expiryDate || '9999'; }, render: function (b) { if (!b.expiryDate) return '<span class="muted" title="This product doesn’t expire">n/a</span>'; var d = store.daysToExpiry(b); return ui.date(b.expiryDate) + ' <span class="muted">(' + (d < 0 ? Math.abs(d) + 'd ago' : d + 'd') + ')</span>'; } },
            { key: 'cost', label: 'Value', align: 'r', sort: function (b) { return b.qtyRemaining * b.unitCost; }, render: function (b) { return '<span class="num">' + ui.money(b.qtyRemaining * b.unitCost) + '</span><div class="pcell__s">' + ui.money(b.unitCost) + ' / unit</div>'; } },
            { key: 'st', label: 'Status', sort: function (b) { return ['expired', 'expiring', 'active', 'depleted'].indexOf(store.batchStatus(b)); }, render: function (b) { return ui.pill(store.batchStatus(b)); } }
          ]
        });
        function redraw() { t.setRows(rows()); }
        el.querySelector('#btabs').onclick = function (e) { var b = e.target.closest('[data-s]'); if (!b) return; f.status = b.getAttribute('data-s'); history.replaceState(null, '', '#/batches'); app.render(true); };
        el.querySelector('#bq').addEventListener('input', ui.debounce(function (e) { f.q = e.target.value; redraw(); }, 120));
        el.querySelector('[name=bwh]').onchange = function (e) { f.wh = e.target.value; redraw(); };
        el.querySelector('#bdated').onchange = function (e) { f.dated = e.target.checked; redraw(); };
        el.querySelector('#brcv').onclick = function () { A.receive(); };
        el.querySelector('#bexp').onclick = function () { ui.csv('ciel-shop-batches.csv', [{ label: 'Batch', key: 'number' }, { label: 'Product', csv: function (b) { return store.product(b.productId).name; } }, { label: 'SKU', csv: function (b) { return store.product(b.productId).sku; } }, { label: 'Warehouse', csv: function (b) { return store.warehouse(b.warehouseId).code; } }, { label: 'Supplier', csv: function (b) { return (store.supplier(b.supplierId) || {}).name || ''; } }, { label: 'Received qty', key: 'qtyReceived' }, { label: 'Remaining', key: 'qtyRemaining' }, { label: 'Unit cost', key: 'unitCost' }, { label: 'Received', csv: function (b) { return b.receivedAt.slice(0, 10); } }, { label: 'Manufactured', key: 'mfgDate' }, { label: 'Expiry', key: 'expiryDate' }, { label: 'Status', csv: function (b) { return store.batchStatus(b); } }], t.rows()); };
      }
    };
  });
  CS.route('/batches/:id', function (prm) {
    var b = store.batch(prm.id); if (!b) return null;
    var p = store.product(b.productId), status = store.batchStatus(b), sup = store.supplier(b.supplierId), po = b.poId && store.po(b.poId);
    var siblings = S().batches.filter(function (x) { return x.number === b.number && x.productId === b.productId; });
    var mv = S().movements.filter(function (m) { return m.batchNumber === b.number && m.productId === b.productId; }).slice().reverse();
    var queue = store.batchesFor(p.id, b.warehouseId).filter(function (x) { return x.qtyRemaining > 0 && !x.writtenOff; }).sort(function (x, y) { if (p.tracksExpiry && S().settings.fefo && x.expiryDate !== y.expiryDate) return x.expiryDate < y.expiryDate ? -1 : 1; return x.receivedAt < y.receivedAt ? -1 : 1; });
    var pos = queue.indexOf(b);
    var html = '<div class="dhead"><div class="pw-hero">' + ui.thumb(p, 56) + '<div class="dhead__m"><h1 class="mono" style="font-family:var(--fd)">' + b.number + '</h1><div class="meta"><a class="link" href="#/products/' + p.id + '">' + ui.esc(p.name) + '</a>·<span>' + store.warehouse(b.warehouseId).name + '</span>' + ui.pill(status) + '</div></div></div><div class="ph__acts">' +
      (status === 'expired' && b.qtyRemaining > 0 ? '<button class="btn btn--danger" id="wo">' + ui.icon('trash', 15) + 'Write off ' + b.qtyRemaining + ' units</button>' : '') + (b.qtyRemaining > 0 && status !== 'expired' ? '<button class="btn" id="btr">' + ui.icon('swap', 15) + 'Transfer</button><button class="btn" id="badj">' + ui.icon('adjust', 15) + 'Count</button>' : '') + '</div></div>';
    if (status === 'expiring') html += '<div class="note" style="margin-bottom:16px">' + ui.icon('clock', 15) + '<span>Expires in <b>' + store.daysToExpiry(b) + ' days</b>. Consider a promotion or transferring it to where it sells fastest.</span></div>';
    if (status === 'expired' && b.qtyRemaining > 0) html += '<div class="note" style="margin-bottom:16px;background:var(--red-soft);border-color:#EFC3BE;color:#7A1F18">' + ui.icon('alert', 15) + '<span>This batch is past its expiry date. It is excluded from picking — write it off to remove it from stock.</span></div>';
    html += '<div class="grid g-side"><div class="stack"><div class="card"><div class="stat-row" style="border-top:0"><div><div class="l">Remaining</div><div class="v num">' + b.qtyRemaining + ' <span class="muted" style="font-size:13px">/ ' + b.qtyReceived + '</span></div></div><div><div class="l">Value at cost</div><div class="v num">' + ui.money(b.qtyRemaining * b.unitCost) + '</div></div><div><div class="l">' + (b.expiryDate ? 'Days to expiry' : 'Expiry') + '</div><div class="v num">' + (b.expiryDate ? store.daysToExpiry(b) : 'n/a') + '</div></div><div><div class="l">Pick order</div><div class="v num">' + (pos >= 0 ? '#' + (pos + 1) + ' of ' + queue.length : '—') + '</div></div></div></div>';
    html += '<div class="card card--flush"><div class="card__h"><h3>Movement history</h3><span class="sub">every change to this batch number</span></div><div class="card__b" style="padding-top:10px"><div class="tscroll"><table class="t t-compact"><thead><tr><th>When</th><th>Type</th><th class="r">Qty</th><th>Warehouse</th><th>Reference</th><th>By</th></tr></thead><tbody>' + mv.map(function (m) { return '<tr><td class="muted">' + ui.dateTime(m.at) + '</td><td>' + app.movLabel(m.type) + '</td><td class="r num" style="color:' + (m.qty > 0 ? 'var(--green)' : 'inherit') + '"><b>' + (m.qty > 0 ? '+' : '') + m.qty + '</b></td><td>' + store.warehouse(m.warehouseId).code + '</td><td>' + (/^MW-/.test(m.ref || '') ? '<a class="link" href="#/orders/' + ((S().orders.filter(function (o) { return o.number === m.ref; })[0] || {}).id) + '">' + m.ref + '</a>' : /^PO-/.test(m.ref || '') ? '<a class="link" href="#/purchase-orders/' + ((S().purchaseOrders.filter(function (x) { return x.number === m.ref; })[0] || {}).id) + '">' + m.ref + '</a>' : '<span class="muted">' + ui.esc(m.ref || '') + '</span>') + '</td><td class="muted">' + ui.esc(app.userName(m.by)) + '</td></tr>'; }).join('') + '</tbody></table></div></div></div>';
    if (siblings.length > 1) html += '<div class="card card--flush"><div class="card__h"><h3>Same batch in other locations</h3></div><div class="card__b" style="padding-top:8px">' + siblings.filter(function (x) { return x.id !== b.id; }).map(function (x) { return '<a class="lrow" href="#/batches/' + x.id + '"><span class="ico-c">' + ui.icon('warehouse', 15) + '</span><div class="lrow__m"><div class="lrow__t">' + store.warehouse(x.warehouseId).name + '</div><div class="lrow__s">' + (x.transferredFrom ? 'Transferred from ' + store.warehouse(x.transferredFrom).code : 'Received directly') + '</div></div><b class="num">' + x.qtyRemaining + ' left</b></a>'; }).join('') + '</div></div>';
    html += '</div><div class="stack"><div class="card"><div class="card__h"><h3>Batch details</h3></div><div class="card__b"><dl class="kv"><dt>Product</dt><dd>' + ui.esc(p.name) + '</dd><dt>SKU</dt><dd class="mono">' + p.sku + '</dd><dt>Supplier</dt><dd>' + (sup ? '<a class="link" href="#/suppliers/' + sup.id + '">' + ui.esc(sup.name) + '</a>' : '—') + '</dd><dt>Purchase order</dt><dd>' + (po ? '<a class="link" href="#/purchase-orders/' + po.id + '">' + po.number + '</a>' : '—') + '</dd><dt>Received</dt><dd>' + ui.dateTime(b.receivedAt) + '</dd><dt>Manufactured</dt><dd>' + (b.mfgDate ? ui.dateLong(b.mfgDate) : '—') + '</dd><dt>Expiry date</dt><dd>' + (b.expiryDate ? ui.dateLong(b.expiryDate) : 'Not applicable') + '</dd><dt>Unit cost</dt><dd class="num">' + ui.money(b.unitCost) + '</dd><dt>Location</dt><dd>' + store.warehouse(b.warehouseId).name + '</dd></dl></div></div>' +
      (p.tracksExpiry ? '<div class="card"><div class="card__h"><h3>Pick queue at ' + store.warehouse(b.warehouseId).code + '</h3><span class="sub">' + (S().settings.fefo ? 'FEFO' : 'FIFO') + '</span></div><div class="card__b">' + queue.map(function (x, i) { return '<div class="row" style="padding:6px 0;' + (x.id === b.id ? 'font-weight:700' : '') + '"><span class="tag">' + (i + 1) + '</span><span class="mono" style="flex:1">' + x.number + '</span><span class="muted">' + ui.date(x.expiryDate) + '</span><b class="num">' + x.qtyRemaining + '</b></div>'; }).join('') + '</div></div>' : '') + '</div></div>';
    return {
      title: b.number, crumbs: [['Batches', '#/batches']], html: html,
      mount: function (el) {
        var wo = el.querySelector('#wo'); if (wo) wo.onclick = function () { ui.confirm({ title: 'Write off batch ' + b.number + '?', body: b.qtyRemaining + ' expired units (' + ui.money(b.qtyRemaining * b.unitCost) + ' at cost) will be removed from stock and recorded in the ledger.', ok: 'Write off', danger: true }).then(function (ok) { if (ok) ui.run(function () { store.writeOffBatch(b.id); }, 'Batch written off'); }); };
        var t = el.querySelector('#btr'); if (t) t.onclick = function () { A.transfer({ productId: p.id, from: b.warehouseId, to: b.warehouseId === 'wh-nbo' ? 'wh-mba' : 'wh-nbo' }); };
        var a = el.querySelector('#badj'); if (a) a.onclick = function () { A.adjust({ productId: p.id, warehouseId: b.warehouseId }); };
      }
    };
  });

  /* ================= WAREHOUSES ================= */
  function whForm(w) {
    w = w || {};
    ui.modal({
      title: w.id ? 'Edit warehouse' : 'Add warehouse', size: 'wide',
      body: '<div class="fgrid">' + ui.field('Name', ui.input('name', w.name, { ph: 'e.g. Nakuru Depot' }), { req: true }) + ui.field('Code', ui.input('code', w.code, { ph: 'NKR' }), { req: true, hint: '2–4 letters, used on labels and transfers' }) + ui.field('City', ui.input('city', w.city)) + ui.field('Manager', ui.select('manager', S().team.map(function (u) { return { value: u.id, label: u.name }; }), w.manager || S().currentUserId)) + ui.field('Address', ui.input('address', w.address), { full: true }) + '</div>',
      ok: w.id ? 'Save' : 'Add warehouse',
      onOk: function (m) { var r = ui.run(function () { return store.saveWarehouse(w.id, ui.read(m.el)); }, w.id ? 'Warehouse updated' : 'Warehouse added'); if (r && !w.id) app.go('#/warehouses/' + r.id); return r ? undefined : false; }
    });
  }
  CS.route('/warehouses', function () {
    var snap = store.snapshot();
    var html = app.ph('Warehouses', S().warehouses.length + ' stock locations', '<button class="btn" id="wtr">' + ui.icon('swap', 15) + 'Transfer stock</button><button class="btn btn--p" id="wadd">' + ui.icon('plus', 15) + 'Add warehouse</button>');
    html += '<div class="grid g-3">' + S().warehouses.map(function (w) {
      var val = 0, units = 0, skus = 0, low = 0, res = 0;
      S().products.forEach(function (p) { var s = snap.get(p.id, w.id); val += s.value; units += s.onHand; res += s.reserved; if (s.onHand > 0) skus++; if (p.status === 'active' && s.onHand + s.incoming > 0 && s.available <= Math.ceil(p.reorderPoint / 2)) low++; });
      var open = S().orders.filter(function (o) { return o.warehouseId === w.id && store.OPEN.indexOf(o.fulfilment) >= 0; }).length;
      return '<a class="card wh-card" href="#/warehouses/' + w.id + '"><div class="row row--between"><div class="row"><span class="ico-c ico-c--acc">' + ui.icon('warehouse', 17) + '</span><div><h3>' + ui.esc(w.name) + '</h3><div class="muted" style="font-size:12px">' + ui.esc(w.address || w.city) + '</div></div></div><span class="tag">' + w.code + '</span></div>' +
        '<div class="mini-kv"><div><div class="l">Stock value</div><div class="v num">' + ui.moneyShort(val).replace('KES ', '') + '</div></div><div><div class="l">Units</div><div class="v num">' + ui.num(units) + '</div></div><div><div class="l">SKUs</div><div class="v num">' + skus + '</div></div></div>' +
        '<div class="row wrap" style="margin-top:12px;gap:6px">' + (low ? ui.pill('low', low + ' low here') : ui.pill('in', 'Healthy')) + '<span class="pill pill--blue">' + open + ' open orders</span><span class="pill pill--grey pill--plain">' + res + ' reserved</span></div>' +
        '<div class="row" style="margin-top:14px;padding-top:12px;border-top:1px solid var(--line)">' + ui.avatar(app.userName(w.manager), true) + '<span class="muted" style="font-size:12.5px">Managed by <b style="color:var(--ink-2)">' + ui.esc(app.userName(w.manager)) + '</b></span></div></a>';
    }).join('') + '</div>';
    return { title: 'Warehouses', html: html, mount: function (el) { el.querySelector('#wadd').onclick = function () { whForm(); }; el.querySelector('#wtr').onclick = function () { A.transfer(); }; } };
  });
  CS.route('/warehouses/:id', function (prm) {
    var w = store.warehouse(prm.id); if (!w) return null;
    var snap = store.snapshot(), rows = S().products.map(function (p) { return { id: p.id, p: p, s: snap.get(p.id, w.id) }; }).filter(function (x) { return x.s.onHand || x.s.reserved || x.s.incoming || (x.p.status === 'active' && x.p.reorderPoint); });
    var val = rows.reduce(function (t, x) { return t + x.s.value; }, 0), units = rows.reduce(function (t, x) { return t + x.s.onHand; }, 0), res = rows.reduce(function (t, x) { return t + x.s.reserved; }, 0);
    var low = rows.filter(function (x) { return x.p.status === 'active' && x.s.available <= Math.ceil(x.p.reorderPoint / 2) && (x.s.onHand || x.s.incoming || w.primary); });
    var mv = S().movements.filter(function (m) { return m.warehouseId === w.id; }).slice(-10).reverse();
    var html = '<div class="dhead"><span class="ico-c ico-c--acc" style="width:52px;height:52px;border-radius:14px">' + ui.icon('warehouse', 24) + '</span><div class="dhead__m"><h1>' + ui.esc(w.name) + '</h1><div class="meta"><span class="tag">' + w.code + '</span><span>' + ui.esc(w.address || '') + (w.city ? ', ' + ui.esc(w.city) : '') + '</span>' + (w.primary ? '<span class="pill pill--acc pill--plain">Receiving hub</span>' : '') + '</div></div><div class="ph__acts"><button class="btn" id="wed">' + ui.icon('edit', 15) + 'Edit</button><button class="btn" id="wtr">' + ui.icon('swap', 15) + 'Transfer</button><button class="btn btn--p" id="wrc">' + ui.icon('receive', 15) + 'Receive</button></div></div>';
    html += '<div class="grid g-4" style="margin-bottom:16px">' + [['Stock value', '<small>KES</small>' + ui.num(val)], ['Units on hand', ui.num(units)], ['Reserved', ui.num(res)], ['Low stock here', String(low.length)]].map(function (k) { return '<div class="card kpi"><div class="kpi__l">' + k[0] + '</div><div class="kpi__v num">' + k[1] + '</div></div>'; }).join('') + '</div>';
    html += '<div class="grid g-side"><div class="card card--flush"><div class="card__h"><h3>Stock at this location</h3></div><div class="card__b" style="padding-top:10px" id="wt"></div></div><div class="stack"><div class="card card--flush"><div class="card__h"><h3>Low stock here</h3><span class="sub">below half the reorder point</span></div><div class="card__b" style="padding-top:8px">' + (low.length ? low.slice(0, 8).map(function (x) { return '<div class="lrow">' + ui.thumb(x.p, 30) + '<div class="lrow__m"><div class="lrow__t">' + ui.esc(x.p.name) + '</div><div class="lrow__s">' + x.s.available + ' available' + (x.s.incoming ? ' · ' + x.s.incoming + ' incoming' : '') + '</div></div><button class="btn btn--xs" data-top="' + x.p.id + '">' + (w.primary ? 'Reorder' : 'Top up') + '</button></div>'; }).join('') : ui.empty('check', 'All stocked up', '')) + '</div></div>' +
      '<div class="card card--flush"><div class="card__h"><h3>Recent activity</h3></div><div class="card__b" style="padding-top:8px">' + (mv.length ? mv.map(function (m) { var p = store.product(m.productId); return '<div class="lrow"><div class="lrow__m"><div class="lrow__t">' + ui.esc(p.name) + '</div><div class="lrow__s">' + app.movLabel(m.type) + ' · ' + ui.rel(m.at) + '</div></div><b class="num" style="color:' + (m.qty > 0 ? 'var(--green)' : 'inherit') + '">' + (m.qty > 0 ? '+' : '') + (m.qty || (m.damagedQty || 0) + ' dmg') + '</b></div>'; }).join('') : ui.empty('swap', 'No activity yet', 'Transfer or receive stock here to get started.')) + '</div></div></div></div>';
    return {
      title: w.name, crumbs: [['Warehouses', '#/warehouses']], html: html,
      mount: function (el) {
        el.querySelector('#wed').onclick = function () { whForm(w); };
        el.querySelector('#wtr').onclick = function () { A.transfer({ from: w.id, to: w.id === 'wh-nbo' ? 'wh-mba' : 'wh-nbo' }); };
        el.querySelector('#wrc').onclick = function () { A.receive({ warehouseId: w.id }); };
        el.querySelectorAll('[data-top]').forEach(function (b) { b.onclick = function () { var pid = b.getAttribute('data-top'); if (w.primary) app.go('#/purchase-orders/new?product=' + pid); else A.transfer({ productId: pid, from: 'wh-nbo', to: w.id }); }; });
        ui.table(el.querySelector('#wt'), {
          rows: rows, pageSize: 15, showCount: true, initialSort: { key: 'val', dir: 'desc' }, onRowClick: function (x) { app.go('#/products/' + x.p.id); },
          columns: [
            { key: 'name', label: 'Product', sort: function (x) { return x.p.name; }, render: function (x) { return '<div class="pcell">' + ui.thumb(x.p, 30) + '<div><div class="pcell__t">' + ui.esc(x.p.name) + '</div><div class="pcell__s">' + x.p.sku + '</div></div></div>'; } },
            { key: 'oh', label: 'On hand', align: 'r', defaultDir: 'desc', sort: function (x) { return x.s.onHand; }, render: function (x) { return '<span class="num">' + x.s.onHand + '</span>'; } },
            { key: 'res', label: 'Reserved', align: 'r', sort: function (x) { return x.s.reserved; }, render: function (x) { return '<span class="num">' + (x.s.reserved || '—') + '</span>'; } },
            { key: 'av', label: 'Available', align: 'r', sort: function (x) { return x.s.available; }, render: function (x) { return '<b class="num">' + x.s.available + '</b>'; } },
            { key: 'val', label: 'Value', align: 'r', defaultDir: 'desc', sort: function (x) { return x.s.value; }, render: function (x) { return '<span class="num">' + ui.money(x.s.value) + '</span>'; } },
            { key: 'act', label: '', sort: false, render: function (x) { return '<button class="btn btn--ghost btn--sm btn--icon" data-sm="' + x.p.id + '" aria-label="Stock actions">' + ui.icon('more') + '</button>'; } }
          ]
        });
        el.querySelector('#wt').addEventListener('click', function (e) { var b = e.target.closest('[data-sm]'); if (b) stockMenu(b, b.getAttribute('data-sm'), w.id); });
      }
    };
  });
})();
