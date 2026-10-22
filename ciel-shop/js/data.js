/* ============================================================
   CIEL SHOP — Demo dataset
   Everything here is synthetic. The demo business ("Mawe Home &
   Pantry"), its customers, suppliers and orders are invented.

   Rather than hard-coding numbers, the dataset is produced by a
   small day-by-day simulation of ~200 days of trading. Orders
   reserve stock, shipments consume batches first-expiry-first-out,
   purchase orders create batches when received, and every change
   writes a stock movement. The result is internally consistent:
   on-hand stock always equals the sum of batch remainders, and
   every chart is computed from the same records.
   ============================================================ */
window.CS = window.CS || {};

(function () {
  'use strict';

  var DAY = 864e5;

  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* ---------- static catalogue ---------- */
  var WAREHOUSES = [
    { id: 'wh-nbo', code: 'NBO', name: 'Nairobi Central', city: 'Nairobi', address: 'Baba Dogo Rd, Ruaraka', manager: 'u-grace', primary: true },
    { id: 'wh-mba', code: 'MBA', name: 'Mombasa Coast', city: 'Mombasa', address: 'Changamwe Industrial Park', manager: 'u-brian' },
    { id: 'wh-ksm', code: 'KSM', name: 'Kisumu Lakeside', city: 'Kisumu', address: 'Mamboleo Business Centre', manager: 'u-brian' }
  ];

  var SUPPLIERS = [
    { id: 'sp-1', name: 'Highland Growers Co-op', contact: 'Peter Kamau', city: 'Nyeri', leadDays: 6, terms: 'Net 30' },
    { id: 'sp-2', name: 'Kilifi Naturals', contact: 'Halima Said', city: 'Kilifi', leadDays: 8, terms: 'Net 14' },
    { id: 'sp-3', name: 'Machakos Weavers Collective', contact: 'Ruth Mwende', city: 'Machakos', leadDays: 10, terms: 'Net 30' },
    { id: 'sp-4', name: 'Rift Clayworks', contact: 'Daniel Cheruiyot', city: 'Nakuru', leadDays: 9, terms: 'Net 30' },
    { id: 'sp-5', name: 'Coast Wood Studio', contact: 'Omar Bakari', city: 'Malindi', leadDays: 12, terms: '50% upfront' },
    { id: 'sp-6', name: 'Lakeside Apiaries', contact: 'Jane Achieng', city: 'Kisumu', leadDays: 7, terms: 'Net 14' },
    { id: 'sp-7', name: 'Nairobi Paper Mill', contact: 'Samuel Njoroge', city: 'Nairobi', leadDays: 4, terms: 'Net 30' },
    { id: 'sp-8', name: 'Kitenge House', contact: 'Esther Wambui', city: 'Nairobi', leadDays: 5, terms: 'Net 30' }
  ];

  var CATEGORIES = ['Pantry', 'Personal Care', 'Textiles', 'Kitchen & Dining', 'Home Décor', 'Stationery'];

  // [code, name, category, price, cost, supplier, demandWeight, reorderPoint, reorderQty, shelfLifeDays|0, variants, tags, desc]
  var PRODUCTS = [
    ['CF', 'AA Highland Coffee Beans 500g', 'Pantry', 1450, 720, 'sp-1', 10, 40, 160, 300, [], ['bestseller', 'gift'], 'Single-origin AA beans from the slopes of Mt Kenya, medium roast with blackcurrant and citrus notes.'],
    ['TE', 'Highland Black Tea 250g', 'Pantry', 650, 290, 'sp-1', 8, 40, 150, 360, [], ['everyday'], 'Strong, bright CTC black tea grown above 2,000m. Brews a deep, malty cup.'],
    ['HN', 'Raw Forest Honey 500g', 'Pantry', 980, 520, 'sp-6', 7, 30, 120, 540, [], ['bestseller'], 'Unfiltered honey from Lake Victoria basin apiaries. Naturally crystallises over time.'],
    ['MB', 'Macadamia Nut Butter 340g', 'Pantry', 1150, 610, 'sp-2', 5, 24, 90, 210, [], ['new'], 'Stone-ground roasted macadamias with a pinch of sea salt. Nothing else added.'],
    ['BP', 'Baobab Fruit Powder 200g', 'Pantry', 890, 410, 'sp-2', 3, 20, 70, 240, [], [], 'Tangy, vitamin-rich baobab pulp. Stir into porridge, juice or smoothies.'],
    ['MO', 'Moringa Leaf Powder 150g', 'Pantry', 760, 330, 'sp-2', 1.6, 18, 60, 170, [], [], 'Shade-dried moringa leaves, finely milled.'],
    ['CS', 'Pili Pili Chilli Sauce 250ml', 'Pantry', 540, 230, 'sp-2', 4, 30, 110, 270, [['Mild', 0], ['Hot', 0], ['Extra hot', 40]], ['bestseller'], 'Bird\'s eye chillies, lime and garlic, bottled in Kilifi.'],
    ['DM', 'Dried Mango Slices 200g', 'Pantry', 480, 210, 'sp-2', 4.5, 30, 120, 150, [], [], 'Sun-dried Apple mangoes with no added sugar.'],
    ['SB', 'Shea Body Butter 200ml', 'Personal Care', 1350, 560, 'sp-2', 5, 24, 90, 540, [['Unscented', 0], ['Lemongrass', 0], ['Rose geranium', 100]], ['bestseller'], 'Whipped raw shea with coconut oil. Rich but fast-absorbing.'],
    ['FO', 'Baobab Face Oil 30ml', 'Personal Care', 1850, 820, 'sp-2', 1.8, 15, 50, 160, [], ['premium'], 'Cold-pressed baobab seed oil, lightweight and non-greasy.'],
    ['BS', 'Black Soap Bar 120g', 'Personal Care', 420, 160, 'sp-2', 5, 40, 140, 720, [['Charcoal', 0], ['Oat & honey', 0]], [], 'Hand-cut cold-process soap, cured for six weeks.'],
    ['HW', 'Lemongrass Hand Wash 300ml', 'Personal Care', 690, 280, 'sp-2', 3.5, 24, 90, 540, [], [], 'Gentle plant-based hand wash with lemongrass essential oil.'],
    ['ST', 'Maasai Shuka Throw', 'Textiles', 2400, 1150, 'sp-8', 3.5, 15, 50, 0, [['Red check', 0], ['Blue check', 0], ['Ochre', 0]], ['bestseller'], 'Heavy acrylic-cotton throw in the classic shuka check. 150 × 200cm.'],
    ['KT', 'Kikoi Beach Towel', 'Textiles', 1900, 880, 'sp-8', 3, 15, 50, 0, [['Sunset', 0], ['Ocean', 0]], [], 'Lightweight, quick-drying cotton kikoi with fringed ends.'],
    ['KC', 'Kitenge Cushion Cover 45cm', 'Textiles', 1250, 520, 'sp-8', 4, 20, 80, 0, [['Indigo', 0], ['Terracotta', 0], ['Mustard', 0]], ['new'], 'Wax-print cotton cover with hidden zip. Insert sold separately.'],
    ['TR', 'Linen Table Runner', 'Textiles', 1650, 700, 'sp-3', 1.8, 10, 30, 0, [], [], 'Stonewashed linen runner, 40 × 200cm.'],
    ['BM', 'Woven Bath Mat', 'Textiles', 1450, 640, 'sp-3', 2, 12, 40, 0, [], [], 'Thick cotton loop weave, handloomed in Machakos.'],
    ['OB', 'Olivewood Serving Board', 'Kitchen & Dining', 2800, 1250, 'sp-5', 2.6, 10, 30, 0, [['Medium', 0], ['Large', 600]], ['gift'], 'Each board is unique, cut from fallen olivewood and oiled by hand.'],
    ['SW', 'Soapstone Bowl Set (3)', 'Kitchen & Dining', 2200, 950, 'sp-4', 2.4, 10, 36, 0, [], ['gift'], 'Carved Kisii soapstone nesting bowls with a natural finish.'],
    ['CJ', 'Clay Water Jug 1.5L', 'Kitchen & Dining', 1700, 720, 'sp-4', 2, 10, 30, 0, [], [], 'Unglazed clay keeps water naturally cool.'],
    ['EM', 'Enamel Camp Mug', 'Kitchen & Dining', 650, 260, 'sp-4', 5.5, 30, 120, 0, [['White', 0], ['Speckled blue', 0]], ['bestseller'], 'Classic enamel mug with a rolled rim. 350ml.'],
    ['PL', 'Banana Leaf Placemats (4)', 'Kitchen & Dining', 1200, 480, 'sp-3', 2.4, 12, 40, 0, [], [], 'Woven banana fibre placemats, set of four.'],
    ['SS', 'Jacaranda Salad Servers', 'Kitchen & Dining', 950, 380, 'sp-5', 2.2, 12, 40, 0, [], [], 'Hand-carved jacaranda wood servers, food-safe oil finish.'],
    ['SK', 'Sisal Storage Basket', 'Home Décor', 1800, 760, 'sp-3', 4, 15, 60, 0, [['Small', -400], ['Medium', 0], ['Large', 700]], ['bestseller'], 'Tightly woven sisal with leather handles.'],
    ['GV', 'Recycled Glass Vase', 'Home Décor', 1550, 640, 'sp-4', 2.2, 10, 36, 0, [['Clear', 0], ['Green', 0]], [], 'Mouth-blown from recycled bottles. Small bubbles are part of the charm.'],
    ['CH', 'Brass Candle Holder', 'Home Décor', 1350, 590, 'sp-5', 1.6, 8, 24, 0, [], [], 'Solid brass, hand-polished.'],
    ['WH', 'Beaded Wall Hanging', 'Home Décor', 3200, 1450, 'sp-3', 1, 6, 16, 0, [], ['premium'], 'Glass-bead and leather wall piece, made by a women\'s collective.'],
    ['KB', 'Kiondo Market Basket', 'Home Décor', 2600, 1100, 'sp-3', 2.6, 12, 40, 0, [['Natural', 0], ['Dyed', 200]], ['gift'], 'Traditional sisal kiondo with leather straps.'],
    ['JR', 'Recycled Paper Journal A5', 'Stationery', 750, 280, 'sp-7', 3.6, 25, 100, 0, [['Lined', 0], ['Plain', 0], ['Dotted', 0]], [], '160 pages of handmade recycled paper with a kitenge cover.'],
    ['GC', 'Batik Greeting Cards (6)', 'Stationery', 600, 220, 'sp-7', 3, 25, 100, 0, [], [], 'Six hand-printed batik cards with envelopes.'],
    ['DP', 'Desk Planner 2027', 'Stationery', 1100, 430, 'sp-7', 2.4, 15, 60, 0, [], ['new', 'seasonal'], 'Week-to-view planner, lay-flat binding.'],
    ['NB', 'Pocket Notebook Trio', 'Stationery', 540, 200, 'sp-7', 2.4, 20, 80, 0, [], [], 'Three slim notebooks for bags and pockets.']
  ];

  var ART = {
    'Pantry': ['#F3E3D3', '#B4572E'], 'Personal Care': ['#E5EDE3', '#3F7A4A'], 'Textiles': ['#EADFF0', '#7A4C93'],
    'Kitchen & Dining': ['#E2E9F1', '#2D5B86'], 'Home Décor': ['#F2E9D8', '#9A6B1E'], 'Stationery': ['#E9E7E1', '#4A4A44']
  };

  var FIRST = ['Amani', 'Wanjiku', 'Otieno', 'Achieng', 'Mwangi', 'Njeri', 'Kiprono', 'Chebet', 'Mutua', 'Mwikali', 'Omondi', 'Atieno', 'Kamau', 'Wairimu', 'Barasa', 'Nafula', 'Kariuki', 'Muthoni', 'Juma', 'Zawadi', 'Kibet', 'Jepkosgei', 'Ochieng', 'Akinyi', 'Njoroge', 'Wangari', 'Said', 'Fatuma', 'Musyoka', 'Ndinda', 'David', 'Sarah', 'Brian', 'Faith', 'Kevin', 'Mercy', 'Dennis', 'Joy', 'Collins', 'Lilian'];
  var LAST = ['Kamau', 'Otieno', 'Wanjiru', 'Mwangi', 'Odhiambo', 'Kiprop', 'Mutiso', 'Njoroge', 'Achieng', 'Wekesa', 'Chege', 'Onyango', 'Kimani', 'Rotich', 'Ndegwa', 'Ouma', 'Mbugua', 'Kilonzo', 'Wambui', 'Ali', 'Hassan', 'Nyambura', 'Korir', 'Gitau', 'Owino'];
  var CITIES = [['Nairobi', 62], ['Mombasa', 14], ['Kisumu', 9], ['Nakuru', 6], ['Eldoret', 4], ['Thika', 3], ['Malindi', 2]];
  var WHOLESALE = [['Nyota Concept Store', 'Nairobi'], ['Tamu Café & Deli', 'Nairobi'], ['Pwani Boutique Hotel', 'Mombasa'], ['Lakeview Gift Shop', 'Kisumu'], ['Savanna Lodge Shop', 'Nakuru']];

  var CHANNELS = ['Online store', 'Instagram', 'WhatsApp', 'Westlands store', 'Wholesale'];
  var DELIVERY = ['Same-day rider', 'Courier', 'Store pickup', 'Freight'];

  var TEAM = [
    { id: 'u-amina', name: 'Amina Wanjiru', role: 'Owner', email: 'amina@mawe.example' },
    { id: 'u-brian', name: 'Brian Otieno', role: 'Operations manager', email: 'brian@mawe.example' },
    { id: 'u-grace', name: 'Grace Muthoni', role: 'Warehouse lead', email: 'grace@mawe.example' },
    { id: 'u-kevin', name: 'Kevin Kiprop', role: 'Sales', email: 'kevin@mawe.example' }
  ];

  CS.seedConstants = { CATEGORIES: CATEGORIES, CHANNELS: CHANNELS, DELIVERY: DELIVERY, ART: ART };

  /* ---------- simulation ---------- */
  CS.generate = function (now) {
    var R = rng(20261022);
    function rnd(a, b) { return a + R() * (b - a); }
    function ri(a, b) { return Math.floor(rnd(a, b + 1)); }
    function pick(arr) { return arr[Math.floor(R() * arr.length)]; }
    function wpick(arr, wfn) { var t = 0, i; for (i = 0; i < arr.length; i++) t += wfn(arr[i]); var x = R() * t; for (i = 0; i < arr.length; i++) { x -= wfn(arr[i]); if (x <= 0) return arr[i]; } return arr[arr.length - 1]; }
    function pad(n, l) { n = String(n); while (n.length < l) n = '0' + n; return n; }

    now = now || new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var DAYS = 200;
    var start = new Date(today.getTime() - DAYS * DAY);
    function at(dayIdx, hour, min) { var d = new Date(start.getTime() + dayIdx * DAY); d.setHours(hour || 9, min || 0, 0, 0); return d; }
    function iso(d) { return d.toISOString(); }
    function ymd(d) { return String(d.getFullYear()).slice(2) + pad(d.getMonth() + 1, 2) + pad(d.getDate(), 2); }
    function dateOnly(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1, 2) + '-' + pad(d.getDate(), 2); }
    var nowTs = now.getTime();

    var S = {
      version: 3,
      seededAt: iso(now),
      business: { name: 'Mawe Home & Pantry', legalName: 'Mawe Retail Ltd', currency: 'KES', vatRate: 0.16, pricesIncludeVat: true, email: 'hello@mawe.example', phone: '+254 700 000 000', address: 'Westlands, Nairobi' },
      settings: { fefo: true, expiryWarnDays: 45, defaultReorderPoint: 20, lowStockEmail: true, orderPrefix: 'MW-', allowNegativeStock: false },
      team: TEAM, currentUserId: 'u-amina',
      categories: CATEGORIES.slice(), channels: CHANNELS.slice(), deliveryMethods: DELIVERY.slice(),
      warehouses: WAREHOUSES.map(function (w) { return Object.assign({}, w); }),
      suppliers: [], products: [], batches: [], damaged: {}, customers: [], orders: [], movements: [],
      purchaseOrders: [], returns: [], notifRead: {}, activity: [],
      counters: { order: 10380, po: 140, ret: 20, mov: 0, batch: 0, product: 0, customer: 0 }
    };

    SUPPLIERS.forEach(function (s, i) {
      var slug = s.name.toLowerCase().replace(/[^a-z]+/g, '');
      S.suppliers.push(Object.assign({}, s, { email: 'orders@' + slug.slice(0, 14) + '.example', phone: '+254 7' + pad(10 + i * 7, 2) + ' 555 ' + pad(100 + i * 37, 3), status: i === 7 ? 'on_hold' : 'active', since: dateOnly(new Date(start.getTime() - (400 + i * 90) * DAY)) }));
    });
    S.suppliers[7].status = 'active';
    S.suppliers.push({ id: 'sp-9', name: 'Mara Leatherworks', contact: 'Joseph Sankale', city: 'Narok', leadDays: 14, terms: 'Net 30', email: 'hello@maraleather.example', phone: '+254 711 555 902', status: 'inactive', since: dateOnly(new Date(start.getTime() - 700 * DAY)) });

    var popularity = {};
    PRODUCTS.forEach(function (p, i) {
      var id = 'p-' + p[0].toLowerCase();
      var sku = 'MW-' + p[0] + '-' + pad(100 + i * 3, 3);
      var art = ART[p[2]];
      var variants = (p[10] || []).map(function (v, vi) { return { id: id + '-v' + vi, name: v[0], sku: sku + '-' + v[0].replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase(), priceDelta: v[1] }; });
      S.products.push({
        id: id, code: p[0], name: p[1], sku: sku, barcode: '61640' + pad(31000 + i * 137, 8), category: p[2], tags: p[11], desc: p[12],
        price: p[3], cost: p[4], taxable: true, status: 'active', reorderPoint: p[7], reorderQty: p[8],
        tracksExpiry: p[9] > 0, shelfLifeDays: p[9], supplierId: p[5], variants: variants,
        art: { bg: art[0], fg: art[1], glyph: p[2] }, createdAt: iso(new Date(start.getTime() - ri(60, 500) * DAY)), updatedAt: null
      });
      popularity[id] = p[6];
    });
    S.counters.product = S.products.length;
    // one draft and one archived product so filters have something to show
    S.products.push({ id: 'p-ln', code: 'LN', name: 'Leather Notebook Cover', sku: 'MW-LN-210', barcode: '6164000099120', category: 'Stationery', tags: ['draft'], desc: 'Vegetable-tanned leather cover for A5 notebooks. Awaiting photography.', price: 2100, cost: 900, taxable: true, status: 'draft', reorderPoint: 8, reorderQty: 24, tracksExpiry: false, shelfLifeDays: 0, supplierId: 'sp-9', variants: [], art: { bg: ART.Stationery[0], fg: ART.Stationery[1], glyph: 'Stationery' }, createdAt: iso(new Date(today.getTime() - 6 * DAY)), updatedAt: null });
    S.products.push({ id: 'p-xm', code: 'XM', name: 'Festive Ornament Set', sku: 'MW-XM-090', barcode: '6164000099137', category: 'Home Décor', tags: ['seasonal'], desc: 'Beaded tree ornaments. Discontinued after last season.', price: 1500, cost: 610, taxable: true, status: 'archived', reorderPoint: 0, reorderQty: 0, tracksExpiry: false, shelfLifeDays: 0, supplierId: 'sp-3', variants: [], art: { bg: ART['Home Décor'][0], fg: ART['Home Décor'][1], glyph: 'Home Décor' }, createdAt: iso(new Date(start.getTime() - 300 * DAY)), updatedAt: iso(new Date(start.getTime() - 20 * DAY)) });
    S.counters.product = S.products.length;
    var prodById = {}; S.products.forEach(function (p) { prodById[p.id] = p; });
    var active = S.products.filter(function (p) { return p.status === 'active'; });

    // customers
    var used = {};
    for (var c = 0; c < 78; c++) {
      var fn, ln, ukey;
      do { fn = pick(FIRST); ln = pick(LAST); ukey = fn + ln; } while (used[ukey]);
      used[ukey] = 1;
      var city = wpick(CITIES, function (x) { return x[1]; })[0];
      S.customers.push({ id: 'c-' + (c + 1), name: fn + ' ' + ln, email: (fn + '.' + ln).toLowerCase() + '@example.com', phone: '+254 7' + ri(10, 99) + ' ' + ri(100, 999) + ' ' + ri(100, 999), city: city, type: 'Retail', createdAt: iso(new Date(start.getTime() + ri(-200, DAYS - 5) * DAY)), tags: [], weight: R() < 0.2 ? 6 : (R() < 0.5 ? 2 : 1), notes: '' });
    }
    WHOLESALE.forEach(function (w, i) {
      S.customers.push({ id: 'c-w' + (i + 1), name: w[0], email: 'buying@' + w[0].toLowerCase().replace(/[^a-z]+/g, '').slice(0, 12) + '.example', phone: '+254 72' + i + ' 444 ' + (300 + i * 11), city: w[1], type: 'Wholesale', createdAt: iso(new Date(start.getTime() - ri(30, 300) * DAY)), tags: ['wholesale'], weight: 1, notes: 'Invoice on delivery, 14-day terms.' });
    });
    S.counters.customer = S.customers.length;
    var retailCustomers = S.customers.filter(function (x) { return x.type === 'Retail'; });
    var wholesaleCustomers = S.customers.filter(function (x) { return x.type === 'Wholesale'; });
    var custById = {}; S.customers.forEach(function (x) { custById[x.id] = x; });

    /* ---- stock helpers (sim-local indexes) ---- */
    var batchIdx = {}; // pid|wid -> [batch]
    function key(pid, wid) { return pid + '|' + wid; }
    function onHand(pid, wid) { var a = batchIdx[key(pid, wid)] || [], t = 0; for (var i = 0; i < a.length; i++) t += a[i].qtyRemaining; return t; }
    var reserved = {};
    function avail(pid, wid) { return onHand(pid, wid) - (reserved[key(pid, wid)] || 0); }
    function mv(o) { S.counters.mov++; o.id = 'm-' + S.counters.mov; S.movements.push(o); return o; }
    function newBatch(p, wid, qty, cost, when, supplierId, poId, number, expiry, mfg) {
      S.counters.batch++;
      var b = {
        id: 'b-' + S.counters.batch, number: number || (p.code + '-' + ymd(when) + '-' + String.fromCharCode(65 + (S.counters.batch % 26))), productId: p.id, warehouseId: wid,
        supplierId: supplierId || p.supplierId, qtyReceived: qty, qtyRemaining: qty, unitCost: cost, receivedAt: iso(when), poId: poId || null,
        mfgDate: p.tracksExpiry ? (mfg || dateOnly(new Date(when.getTime() - ri(7, 25) * DAY))) : null,
        expiryDate: p.tracksExpiry ? (expiry || dateOnly(new Date(when.getTime() + p.shelfLifeDays * DAY))) : null
      };
      S.batches.push(b);
      (batchIdx[key(p.id, wid)] = batchIdx[key(p.id, wid)] || []).push(b);
      return b;
    }
    function consumeOrder(p, wid) {
      var a = (batchIdx[key(p.id, wid)] || []).filter(function (b) { return b.qtyRemaining > 0; });
      a.sort(function (x, y) {
        if (p.tracksExpiry && S.settings.fefo) return x.expiryDate < y.expiryDate ? -1 : x.expiryDate > y.expiryDate ? 1 : 0;
        return x.receivedAt < y.receivedAt ? -1 : 1;
      });
      return a;
    }
    function take(p, wid, qty, when, type, ref, reason, by, extra) {
      var list = consumeOrder(p, wid), left = qty, used = [];
      for (var i = 0; i < list.length && left > 0; i++) {
        var q = Math.min(left, list[i].qtyRemaining);
        list[i].qtyRemaining -= q; left -= q;
        used.push({ batchId: list[i].id, number: list[i].number, qty: q, unitCost: list[i].unitCost, expiryDate: list[i].expiryDate });
        mv(Object.assign({ at: iso(when), productId: p.id, warehouseId: wid, type: type, qty: -q, batchNumber: list[i].number, ref: ref || null, reason: reason || '', by: by || 'u-grace' }, extra || {}));
      }
      return used;
    }

    // opening stock (received before the window opens)
    active.forEach(function (p) {
      var pop = popularity[p.id];
      var nboQty = Math.round(p.reorderQty * rnd(1.1, 1.6));
      var when = new Date(start.getTime() - ri(4, 30) * DAY); when.setHours(10);
      var b = newBatch(p, 'wh-nbo', nboQty, p.cost, when, p.supplierId, null);
      mv({ at: iso(when), productId: p.id, warehouseId: 'wh-nbo', type: 'receipt', qty: nboQty, batchNumber: b.number, ref: 'Opening stock', reason: 'Opening balance', by: 'u-grace' });
      if (pop >= 2) {
        ['wh-mba', 'wh-ksm'].forEach(function (wid, k) {
          var q = Math.round(p.reorderQty * (k === 0 ? 0.35 : 0.22));
          var b2 = newBatch(p, wid, q, p.cost, when, p.supplierId, null, b.number, b.expiryDate, b.mfgDate);
          mv({ at: iso(when), productId: p.id, warehouseId: wid, type: 'receipt', qty: q, batchNumber: b2.number, ref: 'Opening stock', reason: 'Opening balance', by: 'u-brian' });
        });
      }
    });

    var openOrders = [];
    var openPOs = [];
    var starved = { 'p-kc': 1, 'p-fo': 1, 'p-ch': 1, 'p-st': 1, 'p-wh': 1, 'p-bm': 1, 'p-gv': 1 };

    function cityWarehouse(city) { return city === 'Mombasa' || city === 'Malindi' ? 'wh-mba' : city === 'Kisumu' ? 'wh-ksm' : 'wh-nbo'; }
    function addTimeline(o, when, status, text, by) { o.timeline.push({ at: iso(when), status: status, text: text, by: by || null }); }
    function receivePO(po, when) {
      po.status = 'received'; po.receivedAt = iso(when);
      po.lines.forEach(function (l) {
        var p = prodById[l.productId];
        var b = newBatch(p, po.warehouseId, l.qty, l.unitCost, when, po.supplierId, po.id);
        l.received = l.qty;
        mv({ at: iso(when), productId: p.id, warehouseId: po.warehouseId, type: 'receipt', qty: l.qty, batchNumber: b.number, ref: po.number, reason: 'Purchase order received', by: 'u-grace' });
      });
    }

    var TXT = { processing: 'Order confirmed and sent to the warehouse', packing: 'Picking and packing started', ready: 'Packed — ready for dispatch' };
    function advance(o, limit) {
      while (o._sched.length && o._sched[0].at <= limit) {
        var st = o._sched.shift(), when = new Date(st.at);
        if (st.s === 'paid') { o.payment.status = 'paid'; o.payment.paidAt = iso(when); addTimeline(o, when, 'paid', 'Payment received via ' + o.payment.method, null); continue; }
        if (st.s === 'cancelled') {
          o.lines.forEach(function (l) { reserved[key(l.productId, o.warehouseId)] -= l.qty; });
          o.fulfilment = 'cancelled'; addTimeline(o, when, 'cancelled', 'Order cancelled — ' + o._cancelReason, 'u-kevin');
          if (o.payment.status === 'paid') { o.refunds.push({ at: iso(when), amount: CS.orderTotal(o), reason: 'Order cancelled', method: o.payment.method, by: 'u-amina' }); o.payment.status = 'refunded'; addTimeline(o, when, 'refund', 'Refund recorded', 'u-amina'); }
          o._sched = []; return false;
        }
        if (st.s === 'shipped') {
          o.lines.forEach(function (l) {
            reserved[key(l.productId, o.warehouseId)] -= l.qty;
            l.batches = take(prodById[l.productId], o.warehouseId, l.qty, when, 'sale', o.number, 'Order shipped', 'u-grace');
          });
          o.shippedAt = iso(when);
          o.tracking = o.deliveryMethod === 'Store pickup' ? null : 'TRK' + ri(100000, 999999);
        }
        if (st.s === 'delivered') o.deliveredAt = iso(when);
        o.fulfilment = st.s;
        var pickup = o.deliveryMethod === 'Store pickup';
        var txt = TXT[st.s] || (st.s === 'shipped' ? (pickup ? 'Handed to customer at the store' : 'Dispatched via ' + o.deliveryMethod) : (pickup ? 'Collected by customer' : 'Delivered to customer'));
        addTimeline(o, when, st.s, txt, st.s === 'delivered' ? null : (st.s === 'processing' ? 'u-brian' : 'u-grace'));
      }
      if (o.fulfilment === 'delivered' && o.payment.status === 'paid') return false;
      return o._sched.length > 0 || o.fulfilment !== 'delivered';
    }

    for (var d = 0; d <= DAYS; d++) {
      var dayStart = at(d, 0);
      var isLast = d >= DAYS - 1;
      var dow = dayStart.getDay();

      // 1. receive purchase orders due today
      openPOs = openPOs.filter(function (po) {
        if (new Date(po.expectedAt).getTime() <= dayStart.getTime() + DAY && new Date(po.expectedAt).getTime() <= nowTs - 3600e3 * 2) { receivePO(po, at(d, ri(9, 15), ri(0, 59))); return false; }
        return true;
      });

      // 2. advance open orders through their schedule
      openOrders = openOrders.filter(function (o) { return advance(o, Math.min(dayStart.getTime() + DAY, nowTs)); });

      // 3. new orders
      var growth = 1 + 0.9 * (d / DAYS) + (d > DAYS - 6 ? 0.6 : 0);
      var base = 2.6 * growth * (dow === 0 || dow === 6 ? 1.3 : 1) * (d % 30 > 26 ? 1.25 : 1);
      var n = Math.max(0, Math.round(base + rnd(-1.4, 1.6)));
      for (var k = 0; k < n; k++) {
        var hour = ri(7, 21), when = at(d, hour, ri(0, 59));
        if (when.getTime() > nowTs - 600e3) continue;
        var channel = wpick([['Online store', 44], ['Instagram', 18], ['WhatsApp', 17], ['Westlands store', 17], ['Wholesale', 1.6]], function (x) { return x[1]; })[0];
        var cust = channel === 'Wholesale' ? pick(wholesaleCustomers) : wpick(retailCustomers, function (x) { return x.weight; });
        var wid = channel === 'Westlands store' ? 'wh-nbo' : cityWarehouse(cust.city);
        var nLines = channel === 'Wholesale' ? ri(2, 3) : wpick([[1, 55], [2, 30], [3, 12], [4, 3]], function (x) { return x[1]; })[0];
        var lines = [], seen = {};
        for (var li = 0; li < nLines; li++) {
          var p = wpick(active, function (x) { return popularity[x.id]; });
          if (seen[p.id]) continue; seen[p.id] = 1;
          var qty = channel === 'Wholesale' ? ri(4, 10) : (R() < 0.82 ? 1 : ri(2, 3));
          var w = wid;
          if (avail(p.id, w) < qty) { if (w !== 'wh-nbo' && avail(p.id, 'wh-nbo') >= qty) w = 'wh-nbo'; else { qty = Math.min(qty, avail(p.id, w)); } }
          if (qty <= 0) continue;
          if (w !== wid && lines.length) continue; // keep one warehouse per order
          wid = w;
          var v = p.variants.length ? pick(p.variants) : null;
          lines.push({ productId: p.id, variantId: v ? v.id : null, name: p.name + (v ? ' — ' + v.name : ''), sku: v ? v.sku : p.sku, qty: qty, price: p.price + (v ? v.priceDelta : 0), cost: p.cost });
        }
        if (!lines.length) continue;
        S.counters.order++;
        var o = {
          id: 'o-' + S.counters.order, number: S.settings.orderPrefix + S.counters.order, customerId: cust.id, createdAt: iso(when), channel: channel,
          deliveryMethod: channel === 'Westlands store' ? 'Store pickup' : channel === 'Wholesale' ? 'Freight' : (cust.city === 'Nairobi' ? (R() < 0.7 ? 'Same-day rider' : 'Store pickup') : 'Courier'),
          warehouseId: wid, lines: lines, discount: 0, shipping: 0,
          payment: { status: 'pending', method: channel === 'Westlands store' ? pick(['M-Pesa', 'Card', 'Cash']) : channel === 'Wholesale' ? 'Bank transfer' : (R() < 0.8 ? 'M-Pesa' : 'Card'), paidAt: null },
          fulfilment: 'new', timeline: [], notes: [], refunds: [], shippedAt: null, deliveredAt: null, tracking: null,
          shipTo: { name: cust.name, city: cust.city, line1: cust.city === 'Nairobi' ? pick(['Kileleshwa', 'Kilimani', 'Lavington', 'South B', 'Runda', 'Karen', 'Parklands', 'Embakasi']) : 'Town centre' }
        };
        var sub = CS.orderSubtotal(o);
        if (R() < 0.12 && channel !== 'Wholesale') o.discount = Math.round(sub * pick([0.05, 0.1, 0.15]) / 10) * 10;
        if (channel === 'Wholesale') o.discount = Math.round(sub * 0.2 / 10) * 10;
        o.shipping = o.deliveryMethod === 'Same-day rider' ? 300 : o.deliveryMethod === 'Courier' ? 450 : o.deliveryMethod === 'Freight' ? 1200 : 0;
        addTimeline(o, when, 'new', 'Order placed via ' + channel, channel === 'Westlands store' ? 'u-kevin' : null);
        lines.forEach(function (l) { reserved[key(l.productId, wid)] = (reserved[key(l.productId, wid)] || 0) + l.qty; });
        var t = when.getTime(), sched = [];
        var payNow = channel !== 'Wholesale' && !(channel === 'WhatsApp' && R() < 0.35);
        if (payNow) sched.push({ s: 'paid', at: t + ri(1, 25) * 60e3 });
        if (channel === 'Westlands store') {
          sched.push({ s: 'processing', at: t + 2 * 60e3 }, { s: 'packing', at: t + 4 * 60e3 }, { s: 'ready', at: t + 6 * 60e3 }, { s: 'shipped', at: t + 8 * 60e3 }, { s: 'delivered', at: t + 10 * 60e3 });
        } else if (R() < 0.03) {
          o._cancelReason = pick(['customer changed their mind', 'duplicate order', 'payment not completed']);
          sched.push({ s: 'cancelled', at: t + ri(2, 30) * 3600e3 });
        } else {
          var slow = (nowTs - t) < 4 * DAY ? rnd(1.5, 4) : 1;
          if (nowTs - t < 20 * 3600e3) slow = 7;
          var p1 = t + rnd(0.5, 14) * slow * 3600e3, p2 = p1 + rnd(1, 18) * slow * 3600e3, p3 = p2 + rnd(1, 10) * slow * 3600e3, p4 = p3 + rnd(2, 30) * slow * 3600e3, p5 = p4 + rnd(10, channel === 'Wholesale' ? 120 : 72) * slow * 3600e3;
          sched.push({ s: 'processing', at: p1 }, { s: 'packing', at: p2 }, { s: 'ready', at: p3 }, { s: 'shipped', at: p4 }, { s: 'delivered', at: p5 });
          if (!payNow) sched.push({ s: 'paid', at: channel === 'Wholesale' ? p5 + ri(2, 14) * DAY : p5 + 600e3 });
        }
        sched.sort(function (a, b) { return a.at - b.at; });
        o._sched = sched;
        S.orders.push(o); openOrders.push(o);
        if (channel === 'Westlands store') { /* processed in next pass */ }
      }
      // let same-day schedule items (store sales) run immediately
      openOrders = openOrders.filter(function (o) { return advance(o, Math.min(dayStart.getTime() + DAY, nowTs)); });

      // 4. returns on recently delivered orders
      if (R() < 0.09 && d > 10) {
        var cands = S.orders.filter(function (o) { return o.fulfilment === 'delivered' && !o.returnId && o.channel !== 'Westlands store' && new Date(o.deliveredAt).getTime() > dayStart.getTime() - 9 * DAY && new Date(o.deliveredAt).getTime() < dayStart.getTime(); });
        if (cands.length) {
          var ro = pick(cands), rl = pick(ro.lines), rq = Math.min(rl.qty, ri(1, 2));
          var reason = pick(['Damaged in transit', 'Not as described', 'Changed mind', 'Wrong item sent', 'Wrong size or colour']);
          var cond = reason === 'Damaged in transit' ? 'damaged' : 'resellable';
          var rwhen = at(d, ri(10, 17), ri(0, 59));
          S.counters.ret++;
          var amount = Math.round(rl.price * rq);
          var ret = { id: 'r-' + S.counters.ret, number: 'RMA-' + pad(S.counters.ret, 4), orderId: ro.id, createdAt: iso(rwhen), lines: [{ productId: rl.productId, name: rl.name, qty: rq, reason: reason, condition: cond, price: rl.price }], status: 'completed', restocked: cond === 'resellable', refund: { status: 'refunded', amount: amount, at: iso(new Date(rwhen.getTime() + 3 * 3600e3)) }, by: 'u-brian', note: '' };
          S.returns.push(ret);
          ro.returnId = ret.id; ro.returnIds = [ret.id];
          if (cond === 'resellable') {
            var src = (rl.batches && rl.batches[0]) ? S.batches.filter(function (b) { return b.id === rl.batches[0].batchId; })[0] : null;
            if (src) { src.qtyRemaining += rq; mv({ at: iso(rwhen), productId: rl.productId, warehouseId: ro.warehouseId, type: 'return', qty: rq, batchNumber: src.number, ref: ret.number, reason: 'Returned — resellable', by: 'u-grace' }); }
          } else {
            var dk = key(rl.productId, ro.warehouseId); S.damaged[dk] = (S.damaged[dk] || 0) + rq;
            mv({ at: iso(rwhen), productId: rl.productId, warehouseId: ro.warehouseId, type: 'return_damaged', qty: 0, damagedQty: rq, batchNumber: null, ref: ret.number, reason: 'Returned damaged — not restocked', by: 'u-grace' });
          }
          ro.refunds.push({ at: ret.refund.at, amount: amount, reason: 'Return ' + ret.number, method: ro.payment.method, by: 'u-amina' });
          var full = ro.lines.length === 1 && rq === rl.qty;
          ro.payment.status = full ? 'refunded' : 'partially_refunded';
          if (full) ro.fulfilment = 'returned';
          addTimeline(ro, rwhen, 'return', 'Return ' + ret.number + ' opened — ' + reason.toLowerCase(), 'u-brian');
          addTimeline(ro, new Date(rwhen.getTime() + 3 * 3600e3), 'refund', 'Refund of KES ' + amount.toLocaleString('en-US') + ' recorded', 'u-amina');
        }
      }

      // 5. occasional damage found during cycle counts
      if (d % 23 === 11) {
        var dp = pick(active.filter(function (p) { return onHand(p.id, 'wh-nbo') > 5; }));
        if (dp) {
          var dq = ri(1, 3), dwhen = at(d, 16, 20);
          take(dp, 'wh-nbo', dq, dwhen, 'damage', 'Cycle count', pick(['Broken in storage', 'Water damage', 'Packaging crushed']), 'u-grace');
          var dk2 = key(dp.id, 'wh-nbo'); S.damaged[dk2] = (S.damaged[dk2] || 0) + dq;
        }
      }

      // 6. write off expired batches
      active.forEach(function (p) {
        if (!p.tracksExpiry) return;
        S.warehouses.forEach(function (w) {
          (batchIdx[key(p.id, w.id)] || []).forEach(function (b) {
            if (b.qtyRemaining > 0 && new Date(b.expiryDate).getTime() < dayStart.getTime()) {
              mv({ at: iso(at(d, 8, 5)), productId: p.id, warehouseId: w.id, type: 'expired', qty: -b.qtyRemaining, batchNumber: b.number, ref: 'Expiry check', reason: 'Batch expired — written off', by: 'u-grace' });
              b.qtyRemaining = 0; b.writtenOff = true;
            }
          });
        });
      });

      // 7. replenishment (purchase orders) — Nairobi is the receiving hub
      if (dow !== 0) {
        var bySupplier = {};
        active.forEach(function (p) {
          if (starved[p.id] && d > DAYS - 100) return;
          var incoming = openPOs.reduce(function (t, po) { return t + po.lines.filter(function (l) { return l.productId === p.id; }).reduce(function (a, l) { return a + l.qty; }, 0); }, 0);
          if (avail(p.id, 'wh-nbo') + incoming <= p.reorderPoint * 1.4) (bySupplier[p.supplierId] = bySupplier[p.supplierId] || []).push(p);
        });
        Object.keys(bySupplier).forEach(function (sid) {
          var sup = S.suppliers.filter(function (s) { return s.id === sid; })[0];
          var cwhen = at(d, ri(9, 12), ri(0, 59));
          if (cwhen.getTime() > nowTs) return;
          S.counters.po++;
          var po = { id: 'po-' + S.counters.po, number: 'PO-' + now.getFullYear() + '-' + pad(S.counters.po, 4), supplierId: sid, warehouseId: 'wh-nbo', status: 'ordered', createdAt: iso(cwhen), orderedAt: iso(cwhen), expectedAt: iso(new Date(cwhen.getTime() + (sup.leadDays + ri(-1, 2)) * DAY)), receivedAt: null, notes: '', by: 'u-brian', lines: bySupplier[sid].map(function (p) { return { productId: p.id, qty: p.reorderQty, unitCost: Math.round(p.cost * rnd(0.97, 1.05)), received: 0 }; }) };
          S.purchaseOrders.push(po); openPOs.push(po);
        });
      }

      // 8. fortnightly transfers to regional warehouses
      if (d % 14 === 3 && d < DAYS - 2) {
        var twhen = at(d, 11, 30);
        ['wh-mba', 'wh-ksm'].forEach(function (wid, k) {
          active.forEach(function (p) {
            if (popularity[p.id] < 2) return;
            var target = Math.round(p.reorderQty * (k === 0 ? 0.35 : 0.22));
            var need = target - avail(p.id, wid);
            if (need < Math.max(3, target * 0.4)) return;
            need = Math.min(need, avail(p.id, 'wh-nbo') - p.reorderPoint);
            if (need <= 0) return;
            var ref = 'TR-' + ymd(twhen) + '-' + (k ? 'KSM' : 'MBA');
            var used = take(p, 'wh-nbo', need, twhen, 'transfer_out', ref, 'Transfer to ' + (k ? 'Kisumu' : 'Mombasa'), 'u-grace', { to: wid });
            used.forEach(function (u) {
              var src = S.batches.filter(function (b) { return b.id === u.batchId; })[0];
              var ex = (batchIdx[key(p.id, wid)] || []).filter(function (x) { return x.number === src.number && !x.writtenOff; })[0];
              if (ex) { ex.qtyReceived += u.qty; ex.qtyRemaining += u.qty; }
              else { var nb = newBatch(p, wid, u.qty, u.unitCost, new Date(twhen.getTime() + DAY), src.supplierId, src.poId, src.number, src.expiryDate, src.mfgDate); nb.receivedAt = iso(new Date(twhen.getTime() + DAY)); nb.transferredFrom = 'wh-nbo'; }
              mv({ at: iso(new Date(twhen.getTime() + DAY)), productId: p.id, warehouseId: wid, type: 'transfer_in', qty: u.qty, batchNumber: src.number, ref: ref, reason: 'Transfer from Nairobi', by: 'u-brian', from: 'wh-nbo' });
            });
          });
        });
      }
    }

    // a couple of draft POs and one cancelled, for workflow variety
    S.counters.po++;
    S.purchaseOrders.push({ id: 'po-' + S.counters.po, number: 'PO-' + now.getFullYear() + '-' + pad(S.counters.po, 4), supplierId: 'sp-2', warehouseId: 'wh-nbo', status: 'draft', createdAt: iso(new Date(nowTs - 5 * 3600e3)), orderedAt: null, expectedAt: null, receivedAt: null, notes: 'Top up face oil and baobab before the holiday season.', by: 'u-brian', lines: [{ productId: 'p-fo', qty: 50, unitCost: 820, received: 0 }, { productId: 'p-bp', qty: 70, unitCost: 410, received: 0 }] });
    S.counters.po++;
    S.purchaseOrders.push({ id: 'po-' + S.counters.po, number: 'PO-' + now.getFullYear() + '-' + pad(S.counters.po, 4), supplierId: 'sp-3', warehouseId: 'wh-nbo', status: 'ordered', createdAt: iso(new Date(nowTs - 2 * DAY)), orderedAt: iso(new Date(nowTs - 2 * DAY)), expectedAt: iso(new Date(nowTs + 5 * DAY)), receivedAt: null, notes: 'Wall hangings for the December window display.', by: 'u-amina', lines: [{ productId: 'p-wh', qty: 16, unitCost: 1450, received: 0 }, { productId: 'p-tr', qty: 30, unitCost: 700, received: 0 }] });

    // make sure a few perishable batches sit inside the expiry warning window
    [['p-mb', 9], ['p-dm', 26], ['p-bp', 38]].forEach(function (x) {
      var live = S.batches.filter(function (b) { return b.productId === x[0] && b.qtyRemaining > 0; }).sort(function (a, b) { return a.expiryDate < b.expiryDate ? -1 : 1; });
      if (!live.length) return;
      var num = live[0].number, exp = dateOnly(new Date(today.getTime() + x[1] * DAY));
      S.batches.forEach(function (b) { if (b.number === num && b.productId === x[0] && exp < b.expiryDate) b.expiryDate = exp; });
    });

    S.orders.forEach(function (o) { delete o._sched; delete o._cancelReason; });
    S.orders.sort(function (a, b) { return a.createdAt < b.createdAt ? -1 : 1; });
    S.movements.sort(function (a, b) { return a.at < b.at ? -1 : a.at > b.at ? 1 : 0; });

    // seed activity feed from the most recent events
    var recent = [];
    S.orders.slice(-14).forEach(function (o) { recent.push({ at: o.createdAt, by: null, text: 'New order ' + o.number + ' from ' + custById[o.customerId].name, link: '#/orders/' + o.id, kind: 'order' }); });
    S.purchaseOrders.filter(function (p) { return p.receivedAt; }).slice(-4).forEach(function (p) { recent.push({ at: p.receivedAt, by: 'u-grace', text: p.number + ' received into Nairobi Central', link: '#/purchase-orders/' + p.id, kind: 'stock' }); });
    S.returns.slice(-3).forEach(function (r) { recent.push({ at: r.createdAt, by: 'u-brian', text: 'Return ' + r.number + ' logged', link: '#/returns', kind: 'return' }); });
    recent.sort(function (a, b) { return a.at < b.at ? 1 : -1; });
    S.activity = recent.slice(0, 30);
    return S;
  };

  /* money helpers shared with the store */
  CS.orderSubtotal = function (o) { return o.lines.reduce(function (t, l) { return t + l.price * l.qty; }, 0); };
  CS.orderTotal = function (o) { return CS.orderSubtotal(o) - (o.discount || 0) + (o.shipping || 0); };
})();
