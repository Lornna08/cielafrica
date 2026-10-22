/* ============================================================
   CIEL SHOP — Central data layer
   One state object, one set of rules. Every screen reads through
   these selectors and writes through these actions, so stock,
   orders and reports can never drift apart.

   Demo persistence: the browser's localStorage under a dedicated
   key (cielshop:demo:v4). It never touches real customer data and
   is separate from anything a production deployment would use.
   ============================================================ */
window.CS = window.CS || {};

(function () {
  'use strict';
  var KEY = 'cielshop:demo:v4';
  var DAY = 864e5;
  var OPEN = ['new', 'processing', 'packing', 'ready'];
  var FLOW = ['new', 'processing', 'packing', 'ready', 'shipped', 'delivered'];
  var S = null, subs = [], saveTimer = null, persistOk = true;

  function iso(d) { return (d || new Date()).toISOString(); }
  function pad(n, l) { n = String(n); while (n.length < l) n = '0' + n; return n; }
  function dateOnly(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1, 2) + '-' + pad(d.getDate(), 2); }
  function ymd(d) { return String(d.getFullYear()).slice(2) + pad(d.getMonth() + 1, 2) + pad(d.getDate(), 2); }
  function k(pid, wid) { return pid + '|' + wid; }
  function fail(msg) { var e = new Error(msg); e.userFacing = true; throw e; }
  function int(v) { var n = Math.round(Number(v)); return isFinite(n) ? n : NaN; }

  /* ---------------- persistence ---------------- */
  function load() {
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { persistOk = false; }
    if (raw) {
      try {
        var parsed = JSON.parse(raw);
        var age = Date.now() - new Date(parsed.seededAt).getTime();
        if (parsed.version === 4 && (parsed.touched || age < 12 * 3600e3)) { S = parsed; return; }
      } catch (e) { /* fall through to a fresh dataset */ }
    }
    S = CS.generate(new Date());
    save(true);
  }
  function save(now) {
    clearTimeout(saveTimer);
    var run = function () { try { localStorage.setItem(KEY, JSON.stringify(S)); persistOk = true; } catch (e) { persistOk = false; } };
    if (now) run(); else saveTimer = setTimeout(run, 250);
  }
  function commit(activity) {
    S.touched = true;
    if (activity) {
      S.activity.unshift(Object.assign({ at: iso(), by: S.currentUserId }, activity));
      S.activity = S.activity.slice(0, 80);
    }
    save();
    subs.forEach(function (fn) { try { fn(); } catch (e) { console.error(e); } });
  }

  var store = CS.store = {
    get state() { return S; },
    persistOk: function () { return persistOk; },
    init: function () { load(); },
    subscribe: function (fn) { subs.push(fn); return function () { subs = subs.filter(function (f) { return f !== fn; }); }; },
    reset: function () { S = CS.generate(new Date()); save(true); subs.forEach(function (fn) { fn(); }); },
    OPEN: OPEN, FLOW: FLOW
  };

  /* ---------------- lookups ---------------- */
  function by(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
  store.product = function (id) { return by(S.products, id); };
  store.customer = function (id) { return by(S.customers, id); };
  store.warehouse = function (id) { return by(S.warehouses, id); };
  store.supplier = function (id) { return by(S.suppliers, id); };
  store.order = function (id) { return by(S.orders, id); };
  store.po = function (id) { return by(S.purchaseOrders, id); };
  store.ret = function (id) { return by(S.returns, id); };
  store.batch = function (id) { return by(S.batches, id); };
  store.user = function (id) { return by(S.team, id); };
  store.me = function () { return by(S.team, S.currentUserId); };
  store.subtotal = CS.orderSubtotal;
  store.total = CS.orderTotal;
  store.refunded = function (o) { return (o.refunds || []).reduce(function (t, r) { return t + r.amount; }, 0); };

  /* ---------------- stock selectors ---------------- */
  function whs(wid) { return wid ? [wid] : S.warehouses.map(function (w) { return w.id; }); }
  store.batchesFor = function (pid, wid) { return S.batches.filter(function (b) { return b.productId === pid && (!wid || b.warehouseId === wid); }); };
  store.onHand = function (pid, wid) {
    var t = 0; for (var i = 0; i < S.batches.length; i++) { var b = S.batches[i]; if (b.productId === pid && (!wid || b.warehouseId === wid)) t += b.qtyRemaining; } return t;
  };
  store.reserved = function (pid, wid) {
    var t = 0;
    S.orders.forEach(function (o) {
      if (OPEN.indexOf(o.fulfilment) < 0 || (wid && o.warehouseId !== wid)) return;
      o.lines.forEach(function (l) { if (l.productId === pid) t += l.qty; });
    });
    return t;
  };
  store.available = function (pid, wid) { return store.onHand(pid, wid) - store.reserved(pid, wid); };
  store.incoming = function (pid, wid) {
    var t = 0;
    S.purchaseOrders.forEach(function (po) {
      if ((po.status !== 'ordered' && po.status !== 'partial') || (wid && po.warehouseId !== wid)) return;
      po.lines.forEach(function (l) { if (l.productId === pid) t += Math.max(0, l.qty - (l.received || 0)); });
    });
    return t;
  };
  store.damagedQty = function (pid, wid) { return whs(wid).reduce(function (t, w) { return t + (S.damaged[k(pid, w)] || 0); }, 0); };
  store.stockValue = function (pid, wid) {
    var t = 0; S.batches.forEach(function (b) { if ((!pid || b.productId === pid) && (!wid || b.warehouseId === wid)) t += b.qtyRemaining * b.unitCost; }); return t;
  };
  store.stockStatus = function (p, wid) {
    if (p.status !== 'active') return p.status;
    var a = store.available(p.id, wid);
    if (a <= 0) return 'out';
    if (a <= (wid ? Math.ceil(p.reorderPoint / 2) : p.reorderPoint)) return 'low';
    return 'in';
  };
  // Fast bulk snapshot used by tables: one pass over batches and orders
  store.snapshot = function () {
    var m = {};
    function g(pid, wid) { var x = m[k(pid, wid)]; if (!x) x = m[k(pid, wid)] = { onHand: 0, reserved: 0, value: 0, incoming: 0 }; return x; }
    S.batches.forEach(function (b) { var x = g(b.productId, b.warehouseId); x.onHand += b.qtyRemaining; x.value += b.qtyRemaining * b.unitCost; });
    S.orders.forEach(function (o) { if (OPEN.indexOf(o.fulfilment) >= 0) o.lines.forEach(function (l) { g(l.productId, o.warehouseId).reserved += l.qty; }); });
    S.purchaseOrders.forEach(function (po) { if (po.status === 'ordered' || po.status === 'partial') po.lines.forEach(function (l) { g(l.productId, po.warehouseId).incoming += Math.max(0, l.qty - (l.received || 0)); }); });
    function sum(pid, wid) {
      var r = { onHand: 0, reserved: 0, value: 0, incoming: 0, damaged: 0 };
      whs(wid).forEach(function (w) { var x = m[k(pid, w)]; if (x) { r.onHand += x.onHand; r.reserved += x.reserved; r.value += x.value; r.incoming += x.incoming; } r.damaged += S.damaged[k(pid, w)] || 0; });
      r.available = r.onHand - r.reserved; return r;
    }
    return { get: sum };
  };
  store.lowStock = function (wid) {
    var snap = store.snapshot();
    return S.products.filter(function (p) { return p.status === 'active'; }).map(function (p) { var s = snap.get(p.id, wid); return { p: p, s: s }; })
      .filter(function (x) { return x.s.available <= (wid ? Math.ceil(x.p.reorderPoint / 2) : x.p.reorderPoint); })
      .sort(function (a, b) { return (a.s.available / (a.p.reorderPoint || 1)) - (b.s.available / (b.p.reorderPoint || 1)); });
  };
  store.batchStatus = function (b) {
    if (b.writtenOff) return 'expired';
    if (b.qtyRemaining <= 0) return 'depleted';
    if (b.expiryDate) {
      var days = Math.ceil((new Date(b.expiryDate + 'T23:59:59').getTime() - Date.now()) / DAY);
      if (days < 0) return 'expired';
      if (days <= S.settings.expiryWarnDays) return 'expiring';
    }
    return 'active';
  };
  store.daysToExpiry = function (b) { return b.expiryDate ? Math.ceil((new Date(b.expiryDate + 'T23:59:59').getTime() - Date.now()) / DAY) : null; };

  /* ---------------- reporting ---------------- */
  function counted(o) { return o.fulfilment !== 'cancelled' && o.fulfilment !== 'draft'; }
  store.counted = counted;
  store.orderNet = function (o) { return CS.orderSubtotal(o) - (o.discount || 0); };
  store.orderCost = function (o) { return o.lines.reduce(function (t, l) { return t + l.cost * l.qty; }, 0); };
  store.periodRange = function (period, offset) {
    var now = new Date(), end, start;
    var days = { today: 1, '7d': 7, '30d': 30, '90d': 90 }[period] || 30;
    if (period === 'today') { start = new Date(now.getFullYear(), now.getMonth(), now.getDate()); end = now; }
    else { end = now; start = new Date(now.getTime() - days * DAY); }
    if (offset) { var span = end.getTime() - start.getTime(); start = new Date(start.getTime() - span * offset); end = new Date(end.getTime() - span * offset); }
    return { start: start, end: end, days: days };
  };
  function inRange(ts, r) { var t = new Date(ts).getTime(); return t >= r.start.getTime() && t < r.end.getTime(); }
  store.inRange = inRange;
  store.ordersIn = function (r, filter) { return S.orders.filter(function (o) { return counted(o) && inRange(o.createdAt, r) && (!filter || filter(o)); }); };
  store.metrics = function (r) {
    var orders = store.ordersIn(r);
    var gross = 0, cogs = 0, units = 0;
    orders.forEach(function (o) { gross += store.orderNet(o); cogs += store.orderCost(o); o.lines.forEach(function (l) { units += l.qty; }); });
    var refunds = 0, returnedCost = 0;
    S.orders.forEach(function (o) {
      if (!counted(o)) return;
      (o.refunds || []).forEach(function (f) { if (inRange(f.at, r)) refunds += f.amount; });
    });
    S.returns.forEach(function (rt) {
      if (!inRange(rt.createdAt, r)) return;
      rt.lines.forEach(function (l) { var o = store.order(rt.orderId); var ol = o && o.lines.filter(function (x) { return x.productId === l.productId; })[0]; if (ol) returnedCost += ol.cost * l.qty; });
    });
    var net = gross - refunds;
    var vat = S.business.vatRate || 0;
    var netExVat = net / (1 + vat);
    var profit = netExVat - (cogs - returnedCost);
    return { orders: orders.length, gross: gross, refunds: refunds, net: net, aov: orders.length ? gross / orders.length : 0, cogs: cogs - returnedCost, profit: profit, margin: netExVat ? profit / netExVat : 0, units: units, list: orders };
  };
  // stock on hand per product at a moment in the past, by walking movements backwards
  store.onHandAt = function (when, pid, wid) {
    var t = new Date(when).getTime(), cur = pid ? store.onHand(pid, wid) : null;
    if (pid) {
      for (var i = S.movements.length - 1; i >= 0; i--) { var m = S.movements[i]; if (new Date(m.at).getTime() <= t) break; if (m.productId === pid && (!wid || m.warehouseId === wid)) cur -= m.qty; }
      return cur;
    }
  };
  store.inventoryValueAt = function (when) {
    var t = new Date(when).getTime(), snap = store.snapshot(), val = 0, delta = {};
    for (var i = S.movements.length - 1; i >= 0; i--) { var m = S.movements[i]; if (new Date(m.at).getTime() <= t) break; delta[m.productId] = (delta[m.productId] || 0) + m.qty; }
    S.products.forEach(function (p) {
      var s = snap.get(p.id), avg = s.onHand ? s.value / s.onHand : p.cost;
      val += Math.max(0, s.onHand - (delta[p.id] || 0)) * avg;
    });
    return val;
  };
  store.restockCountAt = function (when) {
    var t = new Date(when).getTime(), snap = store.snapshot(), delta = {}, n = 0;
    for (var i = S.movements.length - 1; i >= 0; i--) { var m = S.movements[i]; if (new Date(m.at).getTime() <= t) break; delta[m.productId] = (delta[m.productId] || 0) + m.qty; }
    S.products.forEach(function (p) { if (p.status !== 'active') return; if (snap.get(p.id).onHand - (delta[p.id] || 0) <= p.reorderPoint) n++; });
    return n;
  };
  // time buckets for charts
  store.buckets = function (r) {
    var out = [], days = Math.round((r.end - r.start) / DAY);
    if (days <= 1) { // hourly for "today"
      var s0 = new Date(r.start); for (var h = 0; h < 24; h++) { var a = new Date(s0.getTime() + h * 3600e3); out.push({ start: a, end: new Date(a.getTime() + 3600e3), label: pad(h, 2) + ':00' }); }
      return out;
    }
    var step = days > 45 ? 7 : 1;
    var first = new Date(r.start.getFullYear(), r.start.getMonth(), r.start.getDate() + 1);
    for (var t = first.getTime(); t <= r.end.getTime(); t += step * DAY) {
      var st = new Date(t), en = new Date(Math.min(t + step * DAY, r.end.getTime() + 1));
      out.push({ start: st, end: en, label: st.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) });
    }
    return out;
  };
  store.salesSeries = function (r) {
    var bks = store.buckets(r);
    var orders = store.ordersIn(r);
    bks.forEach(function (b) { b.sales = 0; b.orders = 0; b.profit = 0; });
    orders.forEach(function (o) {
      var t = new Date(o.createdAt).getTime();
      for (var i = 0; i < bks.length; i++) if (t >= bks[i].start.getTime() && t < bks[i].end.getTime()) { bks[i].sales += store.orderNet(o); bks[i].orders++; break; }
    });
    return bks;
  };
  store.byCategory = function (r) {
    var m = {}; store.ordersIn(r).forEach(function (o) { o.lines.forEach(function (l) { var p = store.product(l.productId); var c = p ? p.category : 'Other'; m[c] = (m[c] || 0) + l.price * l.qty; }); });
    return Object.keys(m).map(function (c) { return { label: c, value: m[c] }; }).sort(function (a, b) { return b.value - a.value; });
  };
  store.byChannel = function (r) {
    var m = {}; store.ordersIn(r).forEach(function (o) { var x = m[o.channel] = m[o.channel] || { label: o.channel, value: 0, orders: 0 }; x.value += store.orderNet(o); x.orders++; });
    return S.channels.map(function (c) { return m[c] || { label: c, value: 0, orders: 0 }; }).sort(function (a, b) { return b.value - a.value; });
  };
  store.topProducts = function (r, n) {
    var m = {}; store.ordersIn(r).forEach(function (o) { o.lines.forEach(function (l) { var x = m[l.productId] = m[l.productId] || { productId: l.productId, units: 0, revenue: 0, cost: 0 }; x.units += l.qty; x.revenue += l.price * l.qty; x.cost += l.cost * l.qty; }); });
    return Object.keys(m).map(function (id) { return m[id]; }).sort(function (a, b) { return b.revenue - a.revenue; }).slice(0, n || 10);
  };
  store.fulfilment = function (r) {
    var shipped = S.orders.filter(function (o) { return o.shippedAt && inRange(o.shippedAt, r) && o.deliveryMethod !== 'Store pickup'; });
    var hrs = shipped.map(function (o) { return (new Date(o.shippedAt) - new Date(o.createdAt)) / 3600e3; });
    var within = hrs.filter(function (h) { return h <= 48; }).length;
    var delivered = S.orders.filter(function (o) { return o.deliveredAt && inRange(o.deliveredAt, r); }).length;
    return { shipped: shipped.length, avgHours: hrs.length ? hrs.reduce(function (a, b) { return a + b; }, 0) / hrs.length : 0, within48: shipped.length ? within / shipped.length : 0, delivered: delivered };
  };

  /* ---------------- notifications (derived, never stale) ---------------- */
  store.notifications = function () {
    var out = [], now = Date.now();
    store.lowStock().forEach(function (x) {
      out.push({ id: 'low:' + x.p.id + ':' + (x.s.available <= 0 ? 'out' : 'low'), kind: x.s.available <= 0 ? 'danger' : 'warn', icon: 'box', title: x.s.available <= 0 ? x.p.name + ' is out of stock' : x.p.name + ' is running low', body: x.s.available + ' available · reorder point ' + x.p.reorderPoint + (x.s.incoming ? ' · ' + x.s.incoming + ' incoming' : ''), link: '#/products/' + x.p.id, at: null });
    });
    S.orders.filter(function (o) { return o.fulfilment === 'new' && now - new Date(o.createdAt) < 3 * DAY; }).forEach(function (o) {
      out.push({ id: 'new:' + o.id, kind: 'info', icon: 'cart', title: 'New order ' + o.number, body: (store.customer(o.customerId) || {}).name + ' · ' + CS.ui.money(CS.orderTotal(o)), link: '#/orders/' + o.id, at: o.createdAt });
    });
    var stale = S.orders.filter(function (o) { return (o.fulfilment === 'processing' || o.fulfilment === 'packing' || o.fulfilment === 'ready') && now - new Date(o.createdAt) > 48 * 3600e3; });
    if (stale.length) out.push({ id: 'pend:' + stale.map(function (o) { return o.id; }).join(','), kind: 'warn', icon: 'truck', title: stale.length + ' order' + (stale.length > 1 ? 's' : '') + ' waiting over 48h', body: 'Pending fulfilment: ' + stale.slice(0, 3).map(function (o) { return o.number; }).join(', ') + (stale.length > 3 ? '…' : ''), link: '#/board', at: null });
    var seen = {};
    S.batches.forEach(function (b) {
      var st = store.batchStatus(b); if (st !== 'expiring' || seen[b.number]) return; seen[b.number] = 1;
      var p = store.product(b.productId), qty = S.batches.filter(function (x) { return x.number === b.number && x.productId === b.productId; }).reduce(function (t, x) { return t + x.qtyRemaining; }, 0);
      out.push({ id: 'exp:' + b.number, kind: store.daysToExpiry(b) <= 14 ? 'danger' : 'warn', icon: 'clock', title: 'Batch ' + b.number + ' expires in ' + store.daysToExpiry(b) + ' days', body: p.name + ' · ' + qty + ' units left', link: '#/batches/' + b.id, at: null });
    });
    S.purchaseOrders.filter(function (po) { return po.status === 'ordered' || po.status === 'partial'; }).forEach(function (po) {
      var late = po.expectedAt && new Date(po.expectedAt).getTime() < now;
      out.push({ id: 'po:' + po.id + ':' + po.status, kind: late ? 'warn' : 'info', icon: 'inbox', title: po.number + (late ? ' is overdue' : ' awaiting receipt'), body: (store.supplier(po.supplierId) || {}).name + ' · expected ' + CS.ui.date(po.expectedAt), link: '#/purchase-orders/' + po.id, at: po.orderedAt });
    });
    out.forEach(function (n) { n.read = !!S.notifRead[n.id]; });
    var rank = { danger: 0, warn: 1, info: 2 };
    return out.sort(function (a, b) { return (a.read - b.read) || (rank[a.kind] - rank[b.kind]); });
  };
  store.markRead = function (id) { S.notifRead[id] = 1; commit(); };
  store.markAllRead = function () { store.notifications().forEach(function (n) { S.notifRead[n.id] = 1; }); commit(); };

  /* ================= ACTIONS ================= */
  function mv(o) { S.counters.mov++; o.id = 'm-' + S.counters.mov; o.at = o.at || iso(); o.by = o.by || S.currentUserId; S.movements.push(o); return o; }
  function newBatch(p, wid, qty, cost, opts) {
    opts = opts || {};
    S.counters.batch++;
    var when = new Date();
    var b = {
      id: 'b-' + S.counters.batch, number: opts.number || (p.code + '-' + ymd(when) + '-' + String.fromCharCode(65 + (S.counters.batch % 26))),
      productId: p.id, warehouseId: wid, supplierId: opts.supplierId || p.supplierId, qtyReceived: qty, qtyRemaining: qty, unitCost: cost,
      receivedAt: iso(when), poId: opts.poId || null,
      mfgDate: p.tracksExpiry ? (opts.mfgDate || null) : null,
      expiryDate: p.tracksExpiry ? (opts.expiryDate || dateOnly(new Date(when.getTime() + (p.shelfLifeDays || 180) * DAY))) : null
    };
    if (opts.transferredFrom) b.transferredFrom = opts.transferredFrom;
    S.batches.push(b);
    return b;
  }
  function fefo(p, wid) {
    return S.batches.filter(function (b) { return b.productId === p.id && b.warehouseId === wid && b.qtyRemaining > 0 && !b.writtenOff; }).sort(function (x, y) {
      if (p.tracksExpiry && S.settings.fefo && x.expiryDate && y.expiryDate && x.expiryDate !== y.expiryDate) return x.expiryDate < y.expiryDate ? -1 : 1;
      return x.receivedAt < y.receivedAt ? -1 : 1;
    });
  }
  function take(p, wid, qty, type, ref, reason, extra) {
    if (store.onHand(p.id, wid) < qty) fail('Only ' + store.onHand(p.id, wid) + ' units of ' + p.name + ' on hand at ' + store.warehouse(wid).name + '.');
    var list = fefo(p, wid), left = qty, used = [];
    for (var i = 0; i < list.length && left > 0; i++) {
      var q = Math.min(left, list[i].qtyRemaining);
      list[i].qtyRemaining -= q; left -= q;
      used.push({ batchId: list[i].id, number: list[i].number, qty: q, unitCost: list[i].unitCost, expiryDate: list[i].expiryDate, mfgDate: list[i].mfgDate, supplierId: list[i].supplierId, poId: list[i].poId });
      mv(Object.assign({ productId: p.id, warehouseId: wid, type: type, qty: -q, batchNumber: list[i].number, ref: ref || null, reason: reason || '' }, extra || {}));
    }
    return used;
  }
  function needProduct(id) { var p = store.product(id); if (!p) fail('Product not found.'); return p; }
  function needWh(id) { var w = store.warehouse(id); if (!w) fail('Choose a warehouse.'); return w; }
  function posInt(v, label) { var n = int(v); if (!(n > 0)) fail((label || 'Quantity') + ' must be a whole number above zero.'); return n; }

  /* ---- products ---- */
  function cleanProduct(d, existing) {
    var name = String(d.name || '').trim(); if (name.length < 2) fail('Give the product a name.');
    var sku = String(d.sku || '').trim().toUpperCase(); if (!sku) fail('SKU is required.');
    if (S.products.some(function (p) { return p.sku === sku && (!existing || p.id !== existing.id); })) fail('SKU ' + sku + ' is already used by another product.');
    var price = Number(d.price), cost = Number(d.cost);
    if (!(price > 0)) fail('Selling price must be above zero.');
    if (!(cost >= 0)) fail('Cost price can’t be negative.');
    if (S.categories.indexOf(d.category) < 0) fail('Choose a category.');
    var rp = int(d.reorderPoint); if (!(rp >= 0)) fail('Reorder point must be zero or more.');
    var tracks = !!d.tracksExpiry, shelf = tracks ? int(d.shelfLifeDays) : 0;
    if (tracks && !(shelf > 0)) fail('Shelf life is required when expiry tracking is on.');
    var variants = (d.variants || []).filter(function (v) { return String(v.name || '').trim(); }).map(function (v, i) {
      return { id: v.id || ((existing ? existing.id : 'new') + '-v' + Date.now().toString(36) + i), name: String(v.name).trim(), sku: String(v.sku || (sku + '-' + String(v.name).replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase())).toUpperCase(), priceDelta: Number(v.priceDelta) || 0 };
    });
    return {
      name: name, sku: sku, barcode: String(d.barcode || '').trim(), category: d.category, tags: (Array.isArray(d.tags) ? d.tags : String(d.tags || '').split(',')).map(function (t) { return t.trim(); }).filter(Boolean),
      desc: String(d.desc || '').trim(), price: Math.round(price), cost: Math.round(cost), taxable: d.taxable !== false, status: ['active', 'draft', 'archived'].indexOf(d.status) >= 0 ? d.status : 'active',
      reorderPoint: rp, reorderQty: int(d.reorderQty) > 0 ? int(d.reorderQty) : Math.max(rp * 3, 12), tracksExpiry: tracks, shelfLifeDays: shelf, supplierId: d.supplierId || null, variants: variants,
      image: d.image || (existing && existing.image) || null
    };
  }
  store.addProduct = function (d) {
    var c = cleanProduct(d, null);
    var init = d.initialStock ? int(d.initialStock) : 0;
    if (init < 0 || isNaN(init)) fail('Initial stock must be zero or more.');
    if (init > 0) needWh(d.warehouseId);
    S.counters.product++;
    var code = c.sku.replace(/^MW-/, '').replace(/[^A-Z]/g, '').slice(0, 2) || 'NP';
    var art = CS.seedConstants.ART[c.category] || ['#EEE', '#555'];
    var p = Object.assign({ id: 'p-n' + S.counters.product, code: code, art: { bg: art[0], fg: art[1], glyph: c.category }, createdAt: iso(), updatedAt: iso() }, c);
    S.products.unshift(p);
    if (init > 0) {
      var b = newBatch(p, d.warehouseId, init, p.cost, { expiryDate: d.expiryDate || null });
      mv({ productId: p.id, warehouseId: d.warehouseId, type: 'receipt', qty: init, batchNumber: b.number, ref: 'Initial stock', reason: 'Opening stock for new product' });
    }
    commit({ text: 'Added product ' + p.name, link: '#/products/' + p.id, kind: 'product' });
    return p;
  };
  store.updateProduct = function (id, d) {
    var p = needProduct(id), c = cleanProduct(d, p);
    if (p.tracksExpiry && !c.tracksExpiry && store.onHand(p.id) > 0) fail('Expiry tracking can’t be switched off while dated stock is on hand.');
    Object.assign(p, c, { updatedAt: iso() });
    commit({ text: 'Updated ' + p.name, link: '#/products/' + p.id, kind: 'product' });
    return p;
  };
  store.duplicateProduct = function (id) {
    var p = needProduct(id), n = 2, sku;
    do { sku = p.sku + '-C' + n; n++; } while (S.products.some(function (x) { return x.sku === sku; }));
    S.counters.product++;
    var copy = JSON.parse(JSON.stringify(p));
    Object.assign(copy, { id: 'p-n' + S.counters.product, name: p.name + ' (copy)', sku: sku, barcode: '', status: 'draft', createdAt: iso(), updatedAt: iso() });
    copy.variants.forEach(function (v, i) { v.id = copy.id + '-v' + i; v.sku = sku + '-' + v.name.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase(); });
    S.products.splice(S.products.indexOf(p) + 1, 0, copy);
    commit({ text: 'Duplicated ' + p.name, link: '#/products/' + copy.id, kind: 'product' });
    return copy;
  };
  store.setProductStatus = function (ids, status) {
    ids = [].concat(ids);
    if (status === 'archived') ids.forEach(function (id) { var p = needProduct(id); if (store.reserved(p.id) > 0) fail(p.name + ' has stock reserved for open orders and can’t be archived yet.'); });
    ids.forEach(function (id) { var p = needProduct(id); p.status = status; p.updatedAt = iso(); });
    commit({ text: (status === 'archived' ? 'Archived ' : status === 'active' ? 'Activated ' : 'Moved to draft ') + ids.length + ' product' + (ids.length > 1 ? 's' : ''), link: '#/products', kind: 'product' });
  };
  store.setCategory = function (ids, cat) {
    if (S.categories.indexOf(cat) < 0) fail('Unknown category.');
    ids.forEach(function (id) { var p = needProduct(id); p.category = cat; var a = CS.seedConstants.ART[cat]; if (a) p.art = { bg: a[0], fg: a[1], glyph: cat }; p.updatedAt = iso(); });
    commit({ text: 'Moved ' + ids.length + ' products to ' + cat, link: '#/products', kind: 'product' });
  };

  /* ---- inventory ---- */
  store.receiveStock = function (d) {
    var p = needProduct(d.productId); needWh(d.warehouseId);
    var qty = posInt(d.qty);
    var cost = d.unitCost === '' || d.unitCost == null ? p.cost : Number(d.unitCost);
    if (!(cost >= 0)) fail('Unit cost can’t be negative.');
    if (p.tracksExpiry) { if (!d.expiryDate) fail('Expiry date is required for ' + p.name + '.'); if (d.expiryDate <= dateOnly(new Date())) fail('Expiry date must be in the future.'); }
    var number = String(d.batchNumber || '').trim().toUpperCase() || null;
    if (number && S.batches.some(function (b) { return b.number === number && b.productId !== p.id; })) fail('Batch number ' + number + ' belongs to another product.');
    var b = newBatch(p, d.warehouseId, qty, Math.round(cost), { number: number, expiryDate: d.expiryDate, mfgDate: d.mfgDate, supplierId: d.supplierId });
    mv({ productId: p.id, warehouseId: d.warehouseId, type: 'receipt', qty: qty, batchNumber: b.number, ref: d.ref || 'Manual receipt', reason: d.reason || 'Stock received' });
    commit({ text: 'Received ' + qty + ' × ' + p.name + ' into ' + store.warehouse(d.warehouseId).name, link: '#/products/' + p.id, kind: 'stock' });
    return b;
  };
  store.adjustStock = function (d) {
    var p = needProduct(d.productId); needWh(d.warehouseId);
    var counted = int(d.counted); if (!(counted >= 0)) fail('Counted quantity must be zero or more.');
    var reason = String(d.reason || '').trim(); if (!reason) fail('Give a reason for the adjustment.');
    var current = store.onHand(p.id, d.warehouseId), res = store.reserved(p.id, d.warehouseId), delta = counted - current;
    if (delta === 0) fail('The count matches the system — nothing to adjust.');
    if (counted < res) fail(res + ' units are reserved for open orders here. Cancel or reassign those orders before counting below ' + res + '.');
    if (delta > 0) {
      var list = fefo(p, d.warehouseId), target = list[list.length - 1];
      if (target) { target.qtyRemaining += delta; target.qtyReceived += delta; mv({ productId: p.id, warehouseId: d.warehouseId, type: 'adjustment', qty: delta, batchNumber: target.number, ref: 'Stock count', reason: reason }); }
      else { var b = newBatch(p, d.warehouseId, delta, p.cost, {}); mv({ productId: p.id, warehouseId: d.warehouseId, type: 'adjustment', qty: delta, batchNumber: b.number, ref: 'Stock count', reason: reason }); }
    } else take(p, d.warehouseId, -delta, 'adjustment', 'Stock count', reason);
    commit({ text: 'Adjusted ' + p.name + ' at ' + store.warehouse(d.warehouseId).name + ' (' + (delta > 0 ? '+' : '') + delta + ')', link: '#/products/' + p.id, kind: 'stock' });
    return delta;
  };
  store.transferStock = function (d) {
    var p = needProduct(d.productId); needWh(d.from); needWh(d.to);
    if (d.from === d.to) fail('Pick two different warehouses.');
    var qty = posInt(d.qty), av = store.available(p.id, d.from);
    if (qty > av) fail('Only ' + av + ' units are available to transfer from ' + store.warehouse(d.from).name + '.');
    var ref = 'TR-' + ymd(new Date()) + '-' + store.warehouse(d.to).code;
    var used = take(p, d.from, qty, 'transfer_out', ref, d.note || 'Transfer to ' + store.warehouse(d.to).name, { to: d.to });
    used.forEach(function (u) {
      var ex = S.batches.filter(function (x) { return x.productId === p.id && x.warehouseId === d.to && x.number === u.number && !x.writtenOff; })[0];
      if (ex) { ex.qtyReceived += u.qty; ex.qtyRemaining += u.qty; }
      else newBatch(p, d.to, u.qty, u.unitCost, { number: u.number, expiryDate: u.expiryDate, mfgDate: u.mfgDate, supplierId: u.supplierId, poId: u.poId, transferredFrom: d.from });
      mv({ productId: p.id, warehouseId: d.to, type: 'transfer_in', qty: u.qty, batchNumber: u.number, ref: ref, reason: d.note || 'Transfer from ' + store.warehouse(d.from).name, from: d.from });
    });
    commit({ text: 'Transferred ' + qty + ' × ' + p.name + ' to ' + store.warehouse(d.to).name, link: '#/products/' + p.id, kind: 'stock' });
  };
  store.recordDamage = function (d) {
    var p = needProduct(d.productId); needWh(d.warehouseId);
    var qty = posInt(d.qty), av = store.available(p.id, d.warehouseId);
    if (qty > av) fail('Only ' + av + ' unreserved units are on hand here.');
    var reason = String(d.reason || '').trim() || 'Damaged';
    take(p, d.warehouseId, qty, 'damage', 'Damage report', reason);
    S.damaged[k(p.id, d.warehouseId)] = (S.damaged[k(p.id, d.warehouseId)] || 0) + qty;
    commit({ text: 'Recorded ' + qty + ' damaged × ' + p.name, link: '#/products/' + p.id, kind: 'stock' });
  };
  store.disposeDamaged = function (pid, wid) {
    var p = needProduct(pid), q = S.damaged[k(pid, wid)] || 0; if (!q) fail('Nothing to dispose.');
    S.damaged[k(pid, wid)] = 0;
    mv({ productId: pid, warehouseId: wid, type: 'disposed', qty: 0, damagedQty: -q, batchNumber: null, ref: 'Write-off', reason: 'Damaged stock disposed' });
    commit({ text: 'Disposed ' + q + ' damaged × ' + p.name, link: '#/inventory', kind: 'stock' });
  };
  store.setReorderPoint = function (pid, rp) {
    var p = needProduct(pid), n = int(rp); if (!(n >= 0)) fail('Reorder point must be zero or more.');
    p.reorderPoint = n; p.updatedAt = iso();
    commit({ text: 'Set reorder point for ' + p.name + ' to ' + n, link: '#/products/' + p.id, kind: 'stock' });
  };
  store.writeOffBatch = function (bid) {
    var b = store.batch(bid); if (!b) fail('Batch not found.');
    if (store.batchStatus(b) !== 'expired' && store.daysToExpiry(b) > 0) fail('Only expired batches can be written off here. Use a stock adjustment for anything else.');
    var p = store.product(b.productId), q = b.qtyRemaining; if (!q) fail('This batch is already empty.');
    var res = store.reserved(p.id, b.warehouseId), after = store.onHand(p.id, b.warehouseId) - q;
    if (after < res) fail('Writing this off would leave less stock than is reserved for open orders.');
    b.qtyRemaining = 0; b.writtenOff = true;
    mv({ productId: p.id, warehouseId: b.warehouseId, type: 'expired', qty: -q, batchNumber: b.number, ref: 'Expiry write-off', reason: 'Batch expired — written off' });
    commit({ text: 'Wrote off batch ' + b.number, link: '#/batches/' + b.id, kind: 'stock' });
  };

  /* ---- orders ---- */
  function tl(o, status, text) { o.timeline.push({ at: iso(), status: status, text: text, by: S.currentUserId }); }
  function buildLines(lines) {
    if (!lines || !lines.length) fail('Add at least one product.');
    var seen = {};
    return lines.map(function (l) {
      var p = needProduct(l.productId);
      if (p.status !== 'active') fail(p.name + ' isn’t active and can’t be sold.');
      var v = l.variantId ? p.variants.filter(function (x) { return x.id === l.variantId; })[0] : null;
      if (p.variants.length && !v) fail('Choose an option for ' + p.name + '.');
      var key = p.id + (v ? v.id : '');
      if (seen[key]) fail(p.name + ' is listed twice — combine the quantities.'); seen[key] = 1;
      return { productId: p.id, variantId: v ? v.id : null, name: p.name + (v ? ' — ' + v.name : ''), sku: v ? v.sku : p.sku, qty: posInt(l.qty, 'Quantity for ' + p.name), price: p.price + (v ? v.priceDelta : 0), cost: p.cost };
    });
  }
  function checkAvailability(lines, wid, ignoreOrder) {
    var need = {};
    lines.forEach(function (l) { need[l.productId] = (need[l.productId] || 0) + l.qty; });
    Object.keys(need).forEach(function (pid) {
      var av = store.available(pid, wid);
      if (ignoreOrder) ignoreOrder.lines.forEach(function (l) { if (l.productId === pid && OPEN.indexOf(ignoreOrder.fulfilment) >= 0 && ignoreOrder.warehouseId === wid) av += l.qty; });
      if (need[pid] > av) fail('Not enough ' + store.product(pid).name + ' at ' + store.warehouse(wid).name + ': ' + Math.max(0, av) + ' available, ' + need[pid] + ' requested.');
    });
  }
  store.createOrder = function (d) {
    var cust;
    if (d.newCustomer) cust = store.addCustomer(d.newCustomer, true);
    else { cust = store.customer(d.customerId); if (!cust) fail('Choose a customer.'); }
    needWh(d.warehouseId);
    if (S.channels.indexOf(d.channel) < 0) fail('Choose a sales channel.');
    if (S.deliveryMethods.indexOf(d.deliveryMethod) < 0) fail('Choose a delivery method.');
    var lines = buildLines(d.lines);
    var draft = !!d.draft;
    if (!draft) checkAvailability(lines, d.warehouseId);
    var sub = lines.reduce(function (t, l) { return t + l.price * l.qty; }, 0);
    var discount = Math.round(Number(d.discount) || 0), shipping = Math.round(Number(d.shipping) || 0);
    if (discount < 0 || discount > sub) fail('Discount must be between 0 and the subtotal.');
    if (shipping < 0) fail('Shipping can’t be negative.');
    S.counters.order++;
    var o = {
      id: 'o-' + S.counters.order, number: S.settings.orderPrefix + S.counters.order, customerId: cust.id, createdAt: iso(), channel: d.channel, deliveryMethod: d.deliveryMethod,
      warehouseId: d.warehouseId, lines: lines, discount: discount, shipping: shipping,
      payment: { status: draft ? 'pending' : (d.paid ? 'paid' : 'pending'), method: d.paymentMethod || 'M-Pesa', paidAt: !draft && d.paid ? iso() : null },
      fulfilment: draft ? 'draft' : 'new', timeline: [], notes: [], refunds: [], shippedAt: null, deliveredAt: null, tracking: null,
      shipTo: { name: cust.name, city: cust.city, line1: String(d.address || '').trim() || cust.city }, demo: true
    };
    tl(o, o.fulfilment, draft ? 'Draft order created' : 'Order created manually via ' + d.channel);
    if (o.payment.status === 'paid') tl(o, 'paid', 'Payment recorded (' + o.payment.method + ')');
    if (d.note) o.notes.push({ at: iso(), by: S.currentUserId, text: String(d.note) });
    S.orders.push(o);
    commit({ text: (draft ? 'Drafted order ' : 'Created order ') + o.number + ' for ' + cust.name, link: '#/orders/' + o.id, kind: 'order' });
    return o;
  };
  store.updateOrder = function (id, d) {
    var o = store.order(id); if (!o) fail('Order not found.');
    if (['draft', 'new'].indexOf(o.fulfilment) < 0) fail('Only draft or new orders can be edited. This one is already ' + store.statusLabel(o.fulfilment).toLowerCase() + '.');
    var lines = buildLines(d.lines), wid = d.warehouseId || o.warehouseId;
    if (o.fulfilment !== 'draft') checkAvailability(lines, wid, o);
    var sub = lines.reduce(function (t, l) { return t + l.price * l.qty; }, 0), discount = Math.round(Number(d.discount) || 0);
    if (discount < 0 || discount > sub) fail('Discount must be between 0 and the subtotal.');
    if (o.payment.status === 'paid' && sub - discount + (Number(d.shipping) || 0) !== CS.orderTotal(o)) {
      // allowed — but record the difference so the books stay honest
      tl(o, 'edit', 'Total changed after payment from ' + CS.ui.money(CS.orderTotal(o)) + ' — settle the difference with the customer');
    }
    o.lines = lines; o.discount = discount; o.shipping = Math.round(Number(d.shipping) || 0); o.warehouseId = wid;
    if (d.deliveryMethod) o.deliveryMethod = d.deliveryMethod;
    tl(o, 'edit', 'Order edited');
    commit({ text: 'Edited order ' + o.number, link: '#/orders/' + o.id, kind: 'order' });
  };
  // statuses setFulfilment() accepts from the current one
  store.options = function (o) {
    if (o.fulfilment === 'draft') return ['new', 'cancelled'];
    var fi = FLOW.indexOf(o.fulfilment);
    if (fi < 0) return [];
    if (o.fulfilment === 'shipped') return ['delivered'];
    if (o.fulfilment === 'delivered') return [];
    return FLOW.filter(function (s) { return s !== o.fulfilment; }).concat(['cancelled']);
  };
  store.statusLabel = function (s) {
    return { draft: 'Draft', new: 'New', processing: 'Processing', packing: 'Packing', ready: 'Ready to ship', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled', returned: 'Returned', pending: 'Pending payment', paid: 'Paid', refunded: 'Refunded', partially_refunded: 'Part refunded' }[s] || s;
  };
  store.setFulfilment = function (id, to, opts) {
    opts = opts || {};
    var o = store.order(id); if (!o) fail('Order not found.');
    if (o.fulfilment === to) return;
    if (to === 'cancelled') return store.cancelOrder(id, opts.reason || 'Cancelled', opts.refund);
    if (o.fulfilment === 'draft') {
      if (to !== 'new') fail('Confirm the draft first — it then moves to New.');
      checkAvailability(o.lines, o.warehouseId);
      o.fulfilment = 'new'; tl(o, 'new', 'Draft confirmed — stock reserved');
      commit({ text: 'Confirmed order ' + o.number, link: '#/orders/' + o.id, kind: 'order' }); return;
    }
    var fi = FLOW.indexOf(o.fulfilment), ti = FLOW.indexOf(to);
    if (fi < 0 || ti < 0) fail('That change isn’t possible for a ' + store.statusLabel(o.fulfilment).toLowerCase() + ' order.');
    if (fi >= FLOW.indexOf('shipped') && ti < fi) fail('Stock has already left the warehouse. Use a return instead of moving this order back.');
    if (ti === FLOW.indexOf('delivered') && fi < FLOW.indexOf('shipped')) fail('Ship the order before marking it delivered.');
    if (ti >= FLOW.indexOf('shipped') && fi < FLOW.indexOf('shipped')) {
      // ship: consume batches from the order's warehouse
      o.lines.forEach(function (l) { if (store.onHand(l.productId, o.warehouseId) < l.qty) fail('Not enough ' + l.name + ' on hand at ' + store.warehouse(o.warehouseId).name + ' to ship.'); });
      o.lines.forEach(function (l) { l.batches = take(store.product(l.productId), o.warehouseId, l.qty, 'sale', o.number, 'Order shipped'); });
      o.shippedAt = iso(); o.tracking = o.deliveryMethod === 'Store pickup' ? null : (opts.tracking || 'TRK' + String(Date.now()).slice(-6));
      // record skipped intermediate steps for a complete timeline
      for (var i = fi + 1; i < FLOW.indexOf('shipped'); i++) tl(o, FLOW[i], store.statusLabel(FLOW[i]));
      o.fulfilment = 'shipped'; tl(o, 'shipped', o.deliveryMethod === 'Store pickup' ? 'Handed over at the store' : 'Dispatched via ' + o.deliveryMethod + (o.tracking ? ' · ' + o.tracking : ''));
      if (to === 'delivered') { o.fulfilment = 'delivered'; o.deliveredAt = iso(); tl(o, 'delivered', 'Marked as delivered'); }
    } else if (to === 'delivered') {
      o.fulfilment = 'delivered'; o.deliveredAt = iso(); tl(o, 'delivered', 'Marked as delivered');
    } else {
      o.fulfilment = to; tl(o, to, (ti < fi ? 'Moved back to ' : 'Moved to ') + store.statusLabel(to));
    }
    commit({ text: o.number + ' → ' + store.statusLabel(o.fulfilment), link: '#/orders/' + o.id, kind: 'order' });
  };
  store.markPaid = function (id, method) {
    var o = store.order(id); if (!o) fail('Order not found.');
    if (o.fulfilment === 'cancelled') fail('This order is cancelled.');
    if (o.payment.status !== 'pending') fail('This order is already ' + store.statusLabel(o.payment.status).toLowerCase() + '.');
    o.payment.status = 'paid'; o.payment.paidAt = iso(); if (method) o.payment.method = method;
    tl(o, 'paid', 'Payment recorded (' + o.payment.method + ') — demo only, no money moved');
    commit({ text: 'Marked ' + o.number + ' as paid', link: '#/orders/' + o.id, kind: 'order' });
  };
  store.cancelOrder = function (id, reason, refund) {
    var o = store.order(id); if (!o) fail('Order not found.');
    if (['shipped', 'delivered', 'returned', 'cancelled'].indexOf(o.fulfilment) >= 0) fail('A ' + store.statusLabel(o.fulfilment).toLowerCase() + ' order can’t be cancelled' + (o.fulfilment === 'cancelled' ? ' again.' : ' — create a return instead.'));
    o.fulfilment = 'cancelled';
    tl(o, 'cancelled', 'Order cancelled' + (reason ? ' — ' + reason : '') + '. Reserved stock released.');
    if (o.payment.status === 'paid' && refund) {
      var amt = CS.orderTotal(o) - store.refunded(o);
      o.refunds.push({ at: iso(), amount: amt, reason: 'Order cancelled', method: o.payment.method, by: S.currentUserId });
      o.payment.status = 'refunded'; tl(o, 'refund', 'Refund of ' + CS.ui.money(amt) + ' recorded (demo — no payment processed)');
    }
    commit({ text: 'Cancelled order ' + o.number, link: '#/orders/' + o.id, kind: 'order' });
  };
  store.recordRefund = function (id, amount, reason) {
    var o = store.order(id); if (!o) fail('Order not found.');
    if (o.payment.status === 'pending') fail('Nothing has been paid on this order yet.');
    var max = CS.orderTotal(o) - store.refunded(o), a = Math.round(Number(amount));
    if (!(a > 0)) fail('Refund amount must be above zero.');
    if (a > max) fail('You can refund at most ' + CS.ui.money(max) + ' on this order.');
    o.refunds.push({ at: iso(), amount: a, reason: String(reason || 'Goodwill refund'), method: o.payment.method, by: S.currentUserId });
    o.payment.status = a === max ? 'refunded' : 'partially_refunded';
    tl(o, 'refund', 'Refund of ' + CS.ui.money(a) + ' recorded — ' + (reason || 'goodwill') + ' (demo — no payment processed)');
    commit({ text: 'Recorded refund on ' + o.number, link: '#/orders/' + o.id, kind: 'order' });
  };
  store.addNote = function (id, text) {
    var o = store.order(id); if (!o) fail('Order not found.');
    text = String(text || '').trim(); if (!text) fail('Write a note first.');
    o.notes.push({ at: iso(), by: S.currentUserId, text: text });
    commit();
  };

  /* ---- returns ---- */
  store.returnable = function (o) {
    // shipped quantity minus anything already returned, per line
    return o.lines.map(function (l, i) {
      var back = S.returns.filter(function (r) { return r.orderId === o.id; }).reduce(function (t, r) { return t + r.lines.filter(function (x) { return x.lineIndex === i || (x.lineIndex == null && x.productId === l.productId); }).reduce(function (a, x) { return a + x.qty; }, 0); }, 0);
      return { index: i, line: l, max: l.qty - back };
    });
  };
  store.createReturn = function (d) {
    var o = store.order(d.orderId); if (!o) fail('Order not found.');
    if (['shipped', 'delivered', 'returned'].indexOf(o.fulfilment) < 0) fail('Only shipped or delivered orders can be returned. Cancel the order instead.');
    var avail = store.returnable(o), lines = [];
    (d.lines || []).forEach(function (x) {
      var q = int(x.qty); if (!(q > 0)) return;
      var a = avail[x.lineIndex]; if (!a) fail('Unknown order line.');
      if (q > a.max) fail('Only ' + a.max + ' × ' + a.line.name + ' can still be returned.');
      if (!x.reason) fail('Choose a return reason for ' + a.line.name + '.');
      lines.push({ lineIndex: x.lineIndex, productId: a.line.productId, name: a.line.name, qty: q, reason: x.reason, condition: x.condition === 'resellable' ? 'resellable' : 'damaged', price: a.line.price });
    });
    if (!lines.length) fail('Enter a quantity for at least one item.');
    var value = lines.reduce(function (t, l) { return t + l.price * l.qty; }, 0);
    var refundAmt = d.refund ? Math.round(Number(d.refundAmount != null ? d.refundAmount : value)) : 0;
    var maxRefund = CS.orderTotal(o) - store.refunded(o);
    if (d.refund && o.payment.status === 'pending') fail('The order hasn’t been paid, so there’s nothing to refund.');
    if (refundAmt < 0 || refundAmt > maxRefund) fail('Refund must be between 0 and ' + CS.ui.money(maxRefund) + '.');
    S.counters.ret++;
    var r = { id: 'r-' + S.counters.ret, number: 'RMA-' + pad(S.counters.ret, 4), orderId: o.id, createdAt: iso(), lines: lines, status: 'completed', restocked: false, refund: { status: refundAmt > 0 ? 'refunded' : (d.refund ? 'refunded' : 'not_refunded'), amount: refundAmt, at: refundAmt ? iso() : null }, by: S.currentUserId, note: String(d.note || '') };
    lines.forEach(function (l) {
      var p = store.product(l.productId);
      if (l.condition === 'resellable') {
        var src = (o.lines[l.lineIndex].batches || [])[0], b = src && store.batch(src.batchId);
        if (b && b.warehouseId === o.warehouseId && !b.writtenOff) { b.qtyRemaining += l.qty; }
        else { b = newBatch(p, o.warehouseId, l.qty, o.lines[l.lineIndex].cost, { number: src ? src.number : null, expiryDate: src ? src.expiryDate : null }); b.qtyReceived = l.qty; }
        mv({ productId: p.id, warehouseId: o.warehouseId, type: 'return', qty: l.qty, batchNumber: b.number, ref: r.number, reason: 'Returned — ' + l.reason.toLowerCase() + ' · restocked' });
        r.restocked = true;
      } else {
        S.damaged[k(p.id, o.warehouseId)] = (S.damaged[k(p.id, o.warehouseId)] || 0) + l.qty;
        mv({ productId: p.id, warehouseId: o.warehouseId, type: 'return_damaged', qty: 0, damagedQty: l.qty, batchNumber: null, ref: r.number, reason: 'Returned — ' + l.reason.toLowerCase() + ' · not resellable' });
      }
    });
    S.returns.push(r);
    o.returnIds = (o.returnIds || []).concat(r.id);
    tl(o, 'return', 'Return ' + r.number + ' — ' + lines.map(function (l) { return l.qty + ' × ' + l.name; }).join(', '));
    if (refundAmt > 0) {
      o.refunds.push({ at: iso(), amount: refundAmt, reason: 'Return ' + r.number, method: o.payment.method, by: S.currentUserId });
      o.payment.status = store.refunded(o) >= CS.orderTotal(o) ? 'refunded' : 'partially_refunded';
      tl(o, 'refund', 'Refund of ' + CS.ui.money(refundAmt) + ' recorded (demo — no payment processed)');
    }
    if (store.returnable(o).every(function (x) { return x.max <= 0; })) o.fulfilment = 'returned';
    commit({ text: 'Logged return ' + r.number + ' on ' + o.number, link: '#/returns', kind: 'return' });
    return r;
  };

  /* ---- purchase orders ---- */
  function cleanPOLines(lines) {
    if (!lines || !lines.length) fail('Add at least one product to the purchase order.');
    var seen = {};
    return lines.map(function (l) {
      var p = needProduct(l.productId);
      if (seen[p.id]) fail(p.name + ' is listed twice.'); seen[p.id] = 1;
      var c = Number(l.unitCost); if (!(c >= 0)) fail('Unit cost for ' + p.name + ' can’t be negative.');
      return { productId: p.id, qty: posInt(l.qty, 'Quantity for ' + p.name), unitCost: Math.round(c), received: 0 };
    });
  }
  store.createPO = function (d) {
    var sup = store.supplier(d.supplierId); if (!sup) fail('Choose a supplier.');
    if (sup.status === 'inactive') fail(sup.name + ' is inactive. Reactivate the supplier first.');
    needWh(d.warehouseId);
    var lines = cleanPOLines(d.lines), ordered = d.status === 'ordered';
    S.counters.po++;
    var po = { id: 'po-' + S.counters.po, number: 'PO-' + new Date().getFullYear() + '-' + pad(S.counters.po, 4), supplierId: sup.id, warehouseId: d.warehouseId, status: ordered ? 'ordered' : 'draft', createdAt: iso(), orderedAt: ordered ? iso() : null, expectedAt: d.expectedAt ? new Date(d.expectedAt + 'T12:00:00').toISOString() : (ordered ? iso(new Date(Date.now() + sup.leadDays * DAY)) : null), receivedAt: null, notes: String(d.notes || ''), by: S.currentUserId, lines: lines };
    S.purchaseOrders.push(po);
    commit({ text: (ordered ? 'Placed ' : 'Drafted ') + po.number + ' with ' + sup.name, link: '#/purchase-orders/' + po.id, kind: 'stock' });
    return po;
  };
  store.updatePO = function (id, d) {
    var po = store.po(id); if (!po) fail('Purchase order not found.');
    if (po.status !== 'draft') fail('Only draft purchase orders can be edited.');
    var sup = store.supplier(d.supplierId); if (!sup) fail('Choose a supplier.');
    needWh(d.warehouseId);
    Object.assign(po, { supplierId: sup.id, warehouseId: d.warehouseId, lines: cleanPOLines(d.lines), notes: String(d.notes || ''), expectedAt: d.expectedAt ? new Date(d.expectedAt + 'T12:00:00').toISOString() : null });
    commit({ text: 'Edited ' + po.number, link: '#/purchase-orders/' + po.id, kind: 'stock' });
  };
  store.placePO = function (id) {
    var po = store.po(id); if (!po) fail('Purchase order not found.');
    if (po.status !== 'draft') fail('This purchase order has already been placed.');
    var sup = store.supplier(po.supplierId);
    po.status = 'ordered'; po.orderedAt = iso(); if (!po.expectedAt) po.expectedAt = iso(new Date(Date.now() + sup.leadDays * DAY));
    commit({ text: 'Placed ' + po.number + ' with ' + sup.name + ' (demo — nothing was sent)', link: '#/purchase-orders/' + po.id, kind: 'stock' });
  };
  store.cancelPO = function (id) {
    var po = store.po(id); if (!po) fail('Purchase order not found.');
    if (po.status === 'received' || po.status === 'cancelled') fail('This purchase order is already ' + po.status + '.');
    if (po.lines.some(function (l) { return l.received > 0; })) { po.status = 'received'; po.closedShort = true; commit({ text: 'Closed ' + po.number + ' short', link: '#/purchase-orders/' + po.id, kind: 'stock' }); return; }
    po.status = 'cancelled';
    commit({ text: 'Cancelled ' + po.number, link: '#/purchase-orders/' + po.id, kind: 'stock' });
  };
  store.receivePO = function (id, rows) {
    var po = store.po(id); if (!po) fail('Purchase order not found.');
    if (po.status !== 'ordered' && po.status !== 'partial') fail(po.status === 'draft' ? 'Place the purchase order before receiving it.' : 'This purchase order is ' + po.status + '.');
    var any = false;
    rows.forEach(function (r) {
      var q = int(r.qty); if (!q) return;
      if (q < 0) fail('Received quantities can’t be negative.');
      var l = po.lines[r.lineIndex]; if (!l) fail('Unknown line.');
      var p = store.product(l.productId);
      if (q > l.qty - l.received) fail('Only ' + (l.qty - l.received) + ' × ' + p.name + ' are still outstanding.');
      if (p.tracksExpiry && !r.expiryDate) fail('Enter an expiry date for ' + p.name + '.');
      if (p.tracksExpiry && r.expiryDate <= dateOnly(new Date())) fail('Expiry date for ' + p.name + ' must be in the future.');
    });
    rows.forEach(function (r) {
      var q = int(r.qty); if (!q) return;
      var l = po.lines[r.lineIndex], p = store.product(l.productId);
      var b = newBatch(p, po.warehouseId, q, l.unitCost, { number: String(r.batchNumber || '').trim().toUpperCase() || null, expiryDate: r.expiryDate, mfgDate: r.mfgDate, supplierId: po.supplierId, poId: po.id });
      l.received += q; any = true;
      mv({ productId: p.id, warehouseId: po.warehouseId, type: 'receipt', qty: q, batchNumber: b.number, ref: po.number, reason: 'Purchase order received' });
    });
    if (!any) fail('Enter a received quantity for at least one line.');
    var done = po.lines.every(function (l) { return l.received >= l.qty; });
    po.status = done ? 'received' : 'partial';
    if (done) po.receivedAt = iso();
    commit({ text: (done ? 'Received ' : 'Part-received ') + po.number + ' into ' + store.warehouse(po.warehouseId).name, link: '#/purchase-orders/' + po.id, kind: 'stock' });
  };

  /* ---- customers, suppliers, warehouses ---- */
  function email(v) { v = String(v || '').trim(); if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) fail('That email address doesn’t look right.'); return v; }
  store.addCustomer = function (d, silent) {
    var name = String(d.name || '').trim(); if (name.length < 2) fail('Customer name is required.');
    var e = email(d.email);
    if (e && S.customers.some(function (c) { return c.email.toLowerCase() === e.toLowerCase(); })) fail('A customer with that email already exists.');
    S.counters.customer++;
    var c = { id: 'c-n' + S.counters.customer, name: name, email: e, phone: String(d.phone || '').trim(), city: String(d.city || 'Nairobi').trim(), type: d.type === 'Wholesale' ? 'Wholesale' : 'Retail', createdAt: iso(), tags: [], weight: 1, notes: String(d.notes || '') };
    S.customers.push(c);
    if (!silent) commit({ text: 'Added customer ' + c.name, link: '#/customers/' + c.id, kind: 'customer' });
    return c;
  };
  store.updateCustomer = function (id, d) {
    var c = store.customer(id); if (!c) fail('Customer not found.');
    var name = String(d.name || '').trim(); if (name.length < 2) fail('Customer name is required.');
    var e = email(d.email);
    if (e && S.customers.some(function (x) { return x.id !== id && x.email.toLowerCase() === e.toLowerCase(); })) fail('Another customer uses that email.');
    Object.assign(c, { name: name, email: e, phone: String(d.phone || '').trim(), city: String(d.city || '').trim(), type: d.type === 'Wholesale' ? 'Wholesale' : 'Retail', notes: String(d.notes || '') });
    commit({ text: 'Updated customer ' + c.name, link: '#/customers/' + c.id, kind: 'customer' });
  };
  store.saveSupplier = function (id, d) {
    var name = String(d.name || '').trim(); if (name.length < 2) fail('Supplier name is required.');
    var e = email(d.email), lead = int(d.leadDays); if (!(lead >= 0)) fail('Lead time must be zero or more days.');
    var data = { name: name, contact: String(d.contact || '').trim(), email: e, phone: String(d.phone || '').trim(), city: String(d.city || '').trim(), leadDays: lead, terms: String(d.terms || '').trim(), status: ['active', 'on_hold', 'inactive'].indexOf(d.status) >= 0 ? d.status : 'active' };
    var s;
    if (id) { s = store.supplier(id); if (!s) fail('Supplier not found.'); Object.assign(s, data); }
    else { s = Object.assign({ id: 'sp-n' + Date.now().toString(36), since: dateOnly(new Date()) }, data); S.suppliers.push(s); }
    commit({ text: (id ? 'Updated supplier ' : 'Added supplier ') + s.name, link: '#/suppliers/' + s.id, kind: 'supplier' });
    return s;
  };
  store.saveWarehouse = function (id, d) {
    var name = String(d.name || '').trim(); if (name.length < 2) fail('Warehouse name is required.');
    var code = String(d.code || '').trim().toUpperCase(); if (!/^[A-Z]{2,4}$/.test(code)) fail('Use a 2–4 letter code, e.g. NKR.');
    if (S.warehouses.some(function (w) { return w.code === code && w.id !== id; })) fail('That code is already used.');
    var data = { name: name, code: code, city: String(d.city || '').trim(), address: String(d.address || '').trim(), manager: d.manager || S.currentUserId };
    var w;
    if (id) { w = store.warehouse(id); Object.assign(w, data); } else { w = Object.assign({ id: 'wh-' + code.toLowerCase() + Date.now().toString(36).slice(-3) }, data); S.warehouses.push(w); }
    commit({ text: (id ? 'Updated ' : 'Added warehouse ') + w.name, link: '#/warehouses/' + w.id, kind: 'stock' });
    return w;
  };

  /* ---- settings & team ---- */
  store.saveSettings = function (d) {
    var b = S.business, s = S.settings;
    var name = String(d.name || '').trim(); if (name.length < 2) fail('Business name is required.');
    var warn = int(d.expiryWarnDays); if (!(warn >= 1 && warn <= 365)) fail('Expiry warning must be 1–365 days.');
    var vat = Number(d.vatRate); if (!(vat >= 0 && vat <= 50)) fail('VAT rate must be between 0 and 50%.');
    b.name = name; b.email = email(d.email); b.phone = String(d.phone || ''); b.address = String(d.address || ''); b.vatRate = vat / 100;
    s.fefo = !!d.fefo; s.expiryWarnDays = warn; s.lowStockEmail = !!d.lowStockEmail;
    var pre = String(d.orderPrefix || '').trim().toUpperCase(); if (!/^[A-Z]{1,4}-?$/.test(pre)) fail('Order prefix should be 1–4 letters, e.g. MW-'); s.orderPrefix = pre;
    commit({ text: 'Updated business settings', link: '#/settings', kind: 'settings' });
  };
  store.setUser = function (id) { var u = store.user(id); if (!u) fail('Unknown team member.'); S.currentUserId = id; commit(); };
  store.inviteMember = function (d) {
    var name = String(d.name || '').trim(); if (name.length < 2) fail('Enter a name.');
    var e = email(d.email); if (!e) fail('Enter an email address.');
    if (S.team.some(function (u) { return u.email.toLowerCase() === e.toLowerCase(); })) fail('That person is already on the team.');
    S.team.push({ id: 'u-' + Date.now().toString(36), name: name, email: e, role: d.role || 'Staff', invited: true });
    commit({ text: 'Added ' + name + ' to the team (demo — no email sent)', link: '#/settings', kind: 'settings' });
  };
  store.removeMember = function (id) {
    if (id === S.currentUserId) fail('You can’t remove yourself.');
    var u = store.user(id); if (!u) fail('Not found.');
    S.team = S.team.filter(function (x) { return x.id !== id; });
    commit({ text: 'Removed ' + u.name + ' from the team', link: '#/settings', kind: 'settings' });
  };
  store.addCategory = function (name) {
    name = String(name || '').trim(); if (name.length < 2) fail('Enter a category name.');
    if (S.categories.some(function (c) { return c.toLowerCase() === name.toLowerCase(); })) fail('That category already exists.');
    S.categories.push(name); commit({ text: 'Added category ' + name, link: '#/settings', kind: 'settings' });
  };

  /* ---------------- search ---------------- */
  store.search = function (q, limit) {
    q = String(q || '').trim().toLowerCase(); if (!q) return [];
    var out = [], n = limit || 6;
    function m(s) { return String(s || '').toLowerCase().indexOf(q) >= 0; }
    S.products.filter(function (p) { return m(p.name) || m(p.sku) || m(p.barcode) || p.variants.some(function (v) { return m(v.sku); }); }).slice(0, n).forEach(function (p) { out.push({ type: 'Product', title: p.name, sub: p.sku + ' · ' + p.category, link: '#/products/' + p.id, p: p }); });
    S.orders.filter(function (o) { var c = store.customer(o.customerId); return m(o.number) || m(c && c.name) || m(o.tracking); }).slice(-n).reverse().forEach(function (o) { out.push({ type: 'Order', title: o.number, sub: (store.customer(o.customerId) || {}).name + ' · ' + store.statusLabel(o.fulfilment), link: '#/orders/' + o.id }); });
    S.customers.filter(function (c) { return m(c.name) || m(c.email) || m(c.phone); }).slice(0, n).forEach(function (c) { out.push({ type: 'Customer', title: c.name, sub: c.email + ' · ' + c.city, link: '#/customers/' + c.id }); });
    var bseen = {};
    S.batches.filter(function (b) { if (bseen[b.number] || !m(b.number)) return false; bseen[b.number] = 1; return true; }).slice(0, n).forEach(function (b) { out.push({ type: 'Batch', title: b.number, sub: store.product(b.productId).name, link: '#/batches/' + b.id }); });
    S.suppliers.filter(function (s) { return m(s.name) || m(s.contact); }).slice(0, n).forEach(function (s) { out.push({ type: 'Supplier', title: s.name, sub: s.contact + ' · ' + s.city, link: '#/suppliers/' + s.id }); });
    S.purchaseOrders.filter(function (p) { return m(p.number); }).slice(0, n).forEach(function (p) { out.push({ type: 'Purchase order', title: p.number, sub: (store.supplier(p.supplierId) || {}).name, link: '#/purchase-orders/' + p.id }); });
    return out;
  };
})();
