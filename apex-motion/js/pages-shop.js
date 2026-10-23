/* APEX MOTION — catalogue listing, collections, performance, search, product page */
(function () {
  var A = APEX, C = A.config, U = A.u, db = A.db, ui = A.ui, i = U.i, esc = U.esc, H = A.href;
  var PAGE = 12;
  var perfCats = ['performance', 'suspension', 'brakes', 'exterior', 'interior'];

  /* ---------- listing (shared by every collection-like route) ---------- */
  function listing(opt) {
    var q = A.query();
    var f = {
      cats: q.get('cat') ? q.get('cat').split(',') : [], brands: q.get('brand') ? q.get('brand').split(',') : [],
      min: q.get('min') || '', max: q.get('max') || '', stock: q.get('stock') === '1', fit: q.get('fit') !== '0',
      sort: q.get('sort') || (opt.search ? 'rel' : 'pop'), view: q.get('view') || 'grid', q: q.get('q') || '', n: PAGE
    };
    var base = opt.base();
    var dark = !!opt.dark;
    var main = U.$('#main');
    var catChoices = A.categories.filter(function (c) { return base.some(function (p) { return p.category === c.id; }); });
    var brandChoices = A.brands.filter(function (b) { return base.some(function (p) { return p.brand === b.id; }); });

    main.innerHTML = '<div class="view' + (dark ? ' dark-sec' : '') + '">' +
      '<header class="ph' + (dark ? ' ph--dark' : '') + '"><div class="wrap" style="position:relative;z-index:2">' + ui.crumbs(opt.crumbs) +
        (opt.kicker ? '<div class="kicker' + (dark ? ' kicker--acc' : '') + '" style="margin-top:18px">' + esc(opt.kicker) + '</div>' : '') +
        '<h1' + (opt.kicker ? ' style="margin-top:8px"' : '') + '>' + esc(opt.title) + '</h1>' + (opt.lead ? '<p>' + esc(opt.lead) + '</p>' : '') + (opt.extra || '') + '</div></header>' +
      '<div class="wrap" style="' + (dark ? 'padding-top:28px' : '') + '"><div class="shop">' +
        '<aside class="filters" id="filters" aria-label="Filters"><div class="drawer__h" style="padding:0 0 12px;border:0;display:none" id="fhead"><h3>Filters</h3><button class="icon-btn" data-close aria-label="Close filters">' + i('x') + '</button></div>' +
          '<div class="fitbox"><h4 class="fgrp" style="margin:0 0 10px;font-size:11px;letter-spacing:.18em;text-transform:uppercase;font-weight:600">My vehicle</h4>' +
            '<label class="sr" for="vsel">Select vehicle</label><select id="vsel"><option value="">Select a vehicle…</option>' + A.vehicles.map(function (v) { return '<option value="' + v.id + '">' + esc(v.make + ' ' + v.model + ' · ' + v.years.join('–')) + '</option>'; }).join('') + '</select>' +
            '<p>Matches use sample fitment data. Confirm with our team before ordering.</p></div>' +
          (opt.search ? '' : '<div class="fgrp"><h4>Search within</h4><div class="range"><input id="fq" placeholder="e.g. R19, titanium" value="' + esc(f.q) + '" aria-label="Search within results"></div></div>') +
          (catChoices.length > 1 ? '<div class="fgrp"><h4>Category <button data-clear="cats">Clear</button></h4>' + catChoices.map(function (c) { return chk('cat', c.id, c.name, base.filter(function (p) { return p.category === c.id; }).length, f.cats.indexOf(c.id) >= 0); }).join('') + '</div>' : '') +
          '<div class="fgrp"><h4>Brand <button data-clear="brands">Clear</button></h4>' + brandChoices.map(function (b) { return chk('brand', b.id, b.name, base.filter(function (p) { return p.brand === b.id; }).length, f.brands.indexOf(b.id) >= 0); }).join('') + '</div>' +
          '<div class="fgrp"><h4>Price (' + C.currency.code + ')</h4><div class="range"><input id="fmin" inputmode="numeric" placeholder="Min" value="' + esc(f.min) + '" aria-label="Minimum price"><span class="muted">–</span><input id="fmax" inputmode="numeric" placeholder="Max" value="' + esc(f.max) + '" aria-label="Maximum price"></div></div>' +
          '<div class="fgrp"><h4>Availability</h4>' + chk('stock', '1', 'In stock only', null, f.stock) + '</div>' +
          '<button class="btn btn--line btn--sm" id="fclear">Clear all filters</button>' +
        '</aside>' +
        '<section aria-label="Products"><div class="toolbar"><button class="btn btn--line btn--sm fbtn" id="fopen">' + i('filter', 16) + ' Filters</button><span class="muted" id="rcount" style="font-size:13px" aria-live="polite"></span><span class="sp"></span>' +
          '<label class="sr" for="fsort">Sort by</label><select class="sel" id="fsort">' + (opt.search ? '<option value="rel">Best match</option>' : '') + '<option value="pop">Most popular</option><option value="new">Newest</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="rating">Top rated (sample)</option></select>' +
          '<div class="seg" role="group" aria-label="View"><button data-view="grid" aria-label="Grid view">' + i('grid', 16) + '</button><button data-view="list" aria-label="List view">' + i('list', 16) + '</button></div></div>' +
          '<div id="fitn"></div><div class="active-f" id="afil"></div><div id="plist"></div><div class="more" id="pmore"></div></section>' +
      '</div></div></div>';

    function chk(name, val, label, n, on) { return '<label class="chk"><input type="checkbox" data-f="' + name + '" value="' + val + '"' + (on ? ' checked' : '') + '><span>' + esc(label) + '</span>' + (n != null ? '<em>' + n + '</em>' : '') + '</label>'; }

    var vsel = U.$('#vsel'); vsel.value = db.state().vehicle || '';
    U.$('#fsort').value = f.sort;

    var sync = function () {
      var p = new URLSearchParams();
      if (opt.search) p.set('q', f.q); else if (f.q) p.set('q', f.q);
      if (f.cats.length) p.set('cat', f.cats.join(',')); if (f.brands.length) p.set('brand', f.brands.join(','));
      if (f.min) p.set('min', f.min); if (f.max) p.set('max', f.max); if (f.stock) p.set('stock', '1');
      if (!f.fit) p.set('fit', '0');
      if (f.sort !== (opt.search ? 'rel' : 'pop')) p.set('sort', f.sort); if (f.view !== 'grid') p.set('view', f.view);
      A.setQuery(p);
    };
    var apply = function () {
      var v = db.vehicle(), list = base.slice();
      if (f.q && !opt.search) { var sr = A.searchAll(f.q).products.map(function (p) { return p.id; }); list = list.filter(function (p) { return sr.indexOf(p.id) >= 0; }); }
      if (f.cats.length) list = list.filter(function (p) { return f.cats.indexOf(p.category) >= 0; });
      if (f.brands.length) list = list.filter(function (p) { return f.brands.indexOf(p.brand) >= 0; });
      var mn = parseFloat(f.min), mx = parseFloat(f.max);
      if (!isNaN(mn)) list = list.filter(function (p) { return p.price >= mn; });
      if (!isNaN(mx)) list = list.filter(function (p) { return p.price <= mx; });
      if (f.stock) list = list.filter(function (p) { return db.stockOf(p.id) > 0; });
      var hidden = 0;
      if (v && f.fit) { var before = list.length; list = list.filter(function (p) { return A.fits(p, v) !== false; }); hidden = before - list.length; }
      var srt = { pop: function (a, b) { return b.pop - a.pop; }, 'new': function (a, b) { return a.created - b.created; }, 'price-asc': function (a, b) { return a.price - b.price; }, 'price-desc': function (a, b) { return b.price - a.price; }, rating: function (a, b) { return b.rating - a.rating || b.reviews - a.reviews; } }[f.sort];
      if (srt) list.sort(srt);
      /* fitment note */
      U.$('#fitn').innerHTML = v ? '<div class="fitnote">' + i('car', 18) + '<span>Showing parts for <b>' + esc(v.make + ' ' + v.model) + '</b>' + (f.fit && hidden ? ' · ' + hidden + ' that don\'t match are hidden' : '') + ' · <span class="muted">sample fitment data</span></span><span class="sp"></span><button class="link" id="fittog">' + (f.fit ? 'Show all' : 'Only matching') + '</button><button class="link" id="fitclr">Change</button></div>' : '';
      if (v) { U.$('#fittog').onclick = function () { f.fit = !f.fit; f.n = PAGE; sync(); apply(); }; U.$('#fitclr').onclick = function () { db.setVehicle(null); vsel.value = ''; apply(); }; }
      /* active chips */
      var chips = [];
      f.cats.forEach(function (c) { chips.push(['cat', c, A.catById[c].name]); }); f.brands.forEach(function (b) { chips.push(['brand', b, A.brandById[b].name]); });
      if (f.min || f.max) chips.push(['price', '', (f.min ? U.money(f.min) : 'Any') + ' – ' + (f.max ? U.money(f.max) : 'Any')]);
      if (f.stock) chips.push(['stock', '', 'In stock']); if (f.q && !opt.search) chips.push(['q', '', '“' + f.q + '”']);
      U.$('#afil').innerHTML = chips.map(function (c) { return '<button class="chip" data-rmf="' + c[0] + '" data-v="' + esc(c[1]) + '">' + esc(c[2]) + ' ' + i('x', 13) + '</button>'; }).join('');
      U.$('#rcount').textContent = list.length + ' product' + (list.length === 1 ? '' : 's');
      var shown = list.slice(0, f.n);
      U.$('#plist').innerHTML = list.length ? '<div class="pgrid' + (f.view === 'list' ? ' plist' : '') + '">' + shown.map(ui.card).join('') + '</div>'
        : '<div class="empty"><h3>No parts match</h3><p>' + (v && f.fit ? 'Nothing in this selection is listed for your ' + esc(v.make + ' ' + v.model) + '. ' : '') + 'Try removing a filter or widening the price range.</p><button class="btn btn--ink" id="eclear">Clear filters</button></div>';
      U.$('#pmore').innerHTML = list.length > f.n ? '<span>Showing ' + shown.length + ' of ' + list.length + '</span><button class="btn btn--line" id="lmore">Load more</button>' : (list.length > PAGE ? '<span>Showing all ' + list.length + '</span>' : '');
      if (U.$('#lmore')) U.$('#lmore').onclick = function () { f.n += PAGE; apply(); };
      if (U.$('#eclear')) U.$('#eclear').onclick = clearAll;
      U.$$('[data-view]', main).forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-view') === f.view); });
    };
    var clearAll = function () { f.cats = []; f.brands = []; f.min = f.max = ''; f.stock = false; f.q = opt.search ? f.q : ''; f.n = PAGE; U.$$('[data-f]', main).forEach(function (c) { c.checked = false; }); if (U.$('#fq')) U.$('#fq').value = ''; U.$('#fmin').value = U.$('#fmax').value = ''; sync(); apply(); };

    main.firstElementChild.addEventListener('change', function (e) {
      var t = e.target;
      if (t.matches('[data-f]')) {
        var k = t.getAttribute('data-f');
        if (k === 'stock') f.stock = t.checked;
        else { var arr = k === 'cat' ? f.cats : f.brands; var ix = arr.indexOf(t.value); if (t.checked && ix < 0) arr.push(t.value); if (!t.checked && ix >= 0) arr.splice(ix, 1); }
        f.n = PAGE; sync(); apply();
      }
    });
    var deb; var priceIn = function () { clearTimeout(deb); deb = setTimeout(function () { f.min = U.$('#fmin').value.replace(/[^\d.]/g, ''); f.max = U.$('#fmax').value.replace(/[^\d.]/g, ''); f.n = PAGE; sync(); apply(); }, 350); };
    U.$('#fmin').oninput = U.$('#fmax').oninput = priceIn;
    if (U.$('#fq')) U.$('#fq').oninput = function (e) { clearTimeout(deb); deb = setTimeout(function () { f.q = e.target.value.trim(); f.n = PAGE; sync(); apply(); }, 300); };
    U.$('#fsort').onchange = function (e) { f.sort = e.target.value; sync(); apply(); };
    U.$$('[data-view]', main).forEach(function (b) { b.onclick = function () { f.view = b.getAttribute('data-view'); sync(); apply(); }; });
    vsel.onchange = function () { db.setVehicle(vsel.value); f.fit = true; f.n = PAGE; sync(); apply(); };
    U.$('#fclear').onclick = clearAll;
    U.$$('[data-clear]', main).forEach(function (b) { b.onclick = function () { var k = b.getAttribute('data-clear'); f[k] = []; U.$$('[data-f="' + (k === 'cats' ? 'cat' : 'brand') + '"]', main).forEach(function (c) { c.checked = false; }); sync(); apply(); }; });
    U.$('#afil').onclick = function (e) {
      var c = e.target.closest('[data-rmf]'); if (!c) return; var k = c.getAttribute('data-rmf'), v = c.getAttribute('data-v');
      if (k === 'cat') f.cats.splice(f.cats.indexOf(v), 1); if (k === 'brand') f.brands.splice(f.brands.indexOf(v), 1);
      if (k === 'price') { f.min = f.max = ''; U.$('#fmin').value = U.$('#fmax').value = ''; } if (k === 'stock') f.stock = false; if (k === 'q') { f.q = ''; U.$('#fq').value = ''; }
      U.$$('[data-f]', main).forEach(function (x) { var kk = x.getAttribute('data-f'); x.checked = kk === 'stock' ? f.stock : (kk === 'cat' ? f.cats : f.brands).indexOf(x.value) >= 0; });
      sync(); apply();
    };
    var fl = U.$('#filters');
    U.$('#fopen').onclick = function () { U.$('#fhead').style.display = 'flex'; fl.classList.add('on'); U.$('#scrim').classList.add('on'); document.body.style.overflow = 'hidden'; };
    apply();
    ui.setNav(opt.nav || 'shop', dark);
    ui.meta(opt.title.charAt(0) + opt.title.slice(1).toLowerCase(), opt.lead);
  }
  A.listing = listing;

  A.route('/shop', function () {
    listing({ title: 'The catalogue', kicker: 'Shop', lead: 'Every wheel, tyre and performance part in the store. Add your vehicle to narrow the list.', crumbs: [['Shop']], base: function () { return A.products; }, nav: 'shop' });
  });
  A.route('/shop/:cat', function (p) {
    var c = A.catById[p.cat]; if (!c) return A.notFound();
    var dark = perfCats.indexOf(c.id) >= 0;
    listing({ title: c.name, kicker: dark ? 'Performance parts' : 'Shop', lead: c.blurb, crumbs: [['Shop', 'shop'], [c.name]], dark: dark, nav: c.id === 'wheels' ? 'shop/wheels' : c.id === 'tyres' ? 'shop/tyres' : dark ? 'performance' : 'shop',
      extra: dark ? subcats(c.id) : '', base: function () { return A.products.filter(function (x) { return x.category === c.id; }); } });
  });
  A.route('/collections/:id', function (p) {
    var c = A.collections.filter(function (x) { return x.id === p.id; })[0]; if (!c) return A.notFound();
    listing({ title: c.name, kicker: 'Collection · ' + c.count + ' parts', lead: c.blurb, crumbs: [['Collections', '#collections'], [c.name]], base: function () { return A.products.filter(function (x) { return (x.tags || []).indexOf(c.tag) >= 0; }); } });
  });
  function subcats(active) {
    return '<div class="subcats">' + perfCats.map(function (id) { var c = A.catById[id], pr = A.products.filter(function (p) { return p.category === id; })[0]; return '<a href="' + H('shop/' + id) + '" class="' + (id === active ? 'on' : '') + '"><img src="' + pr.image + '" alt="">' + esc(c.name) + '</a>'; }).join('') + '</div>';
  }
  A.route('/performance', function () {
    listing({ title: 'Performance parts', kicker: 'Technical', lead: 'Brakes, suspension, intake and exhaust, lighting and interior upgrades. Specified for the road, proven on track.', dark: true, nav: 'performance',
      crumbs: [['Performance']], extra: subcats(''), base: function () { return A.products.filter(function (x) { return perfCats.indexOf(x.category) >= 0; }); } });
  });
  A.route('/search', function () {
    var q = A.query().get('q') || '';
    listing({ title: q ? 'Results for “' + q + '”' : 'Search', lead: q ? '' : 'Search by name, brand, size or bolt pattern.', crumbs: [['Search']], search: true,
      base: function () { return q ? A.searchAll(q).products : A.products; } });
  });

  /* ---------- product page ---------- */
  A.route('/product/:slug', function (prm) {
    var p = A.bySlug[prm.slug]; if (!p) return A.notFound();
    var b = A.brandById[p.brand], c = A.catById[p.category], s = db.stockOf(p.id), v = db.vehicle();
    var st = { size: p.sizes ? p.sizes[0] : '', finish: p.finishes ? p.finishes[0].n : '', qty: 1, img: 0 };
    var views = [{ z: 1, x: 50, y: 50, l: 'Main view' }, { z: 1.7, x: 50, y: 45, l: 'Detail' }, { z: 2.3, x: 30, y: 60, l: 'Close-up' }, { z: 1.4, x: 75, y: 35, l: 'Angle' }];
    var related = A.products.filter(function (x) { return x.id !== p.id && (x.category === p.category || (x.tags || []).some(function (t) { return (p.tags || []).indexOf(t) >= 0; })); }).sort(function (a, b2) { return (b2.category === p.category) - (a.category === p.category) || b2.pop - a.pop; }).slice(0, 8);
    var reviews = sampleReviews(p);
    var main = U.$('#main');
    var isWheel = p.category === 'wheels', isTyre = p.category === 'tyres';
    main.innerHTML = '<div class="view"><div class="wrap"><div class="ph" style="padding-bottom:18px">' + ui.crumbs([['Shop', 'shop'], [c.name, 'shop/' + c.id], [p.name]]) + '</div>' +
      '<div class="pdp"><div class="gal"><div class="gal__main" id="gmain" aria-roledescription="carousel" aria-label="Product images"><div class="gal__track" id="gtrack">' + views.map(function (w, k) { return '<figure><img src="' + p.image + '" alt="' + esc(p.name + ' — ' + w.l.toLowerCase()) + '" style="--z:' + w.z + ';--ox:' + w.x + '%;--oy:' + w.y + '%"' + (k ? ' loading="lazy"' : '') + '></figure>'; }).join('') + '</div>' +
        '<div class="gal__nav"><button class="round round--l" data-g="-1" aria-label="Previous image">' + i('arrowL', 18) + '</button><button class="round round--l" data-g="1" aria-label="Next image">' + i('arrow', 18) + '</button></div></div>' +
        '<div class="gal__thumbs">' + views.map(function (w, k) { return '<button class="' + (k ? '' : 'on') + '" data-gt="' + k + '" aria-label="Show ' + w.l.toLowerCase() + '"><img src="' + p.image + '" alt="" style="transform:scale(' + w.z + ');transform-origin:' + w.x + '% ' + w.y + '%"></button>'; }).join('') + '</div></div>' +
      '<div class="pi"><div class="pi__top"><a href="' + H('shop?brand=' + b.id) + '">' + esc(b.name) + '</a><span>' + esc(c.name) + '</span>' + U.stars(p.rating) + '<a href="#reviews" style="font-weight:500;color:var(--muted)">' + p.reviews + ' reviews (sample)</a></div>' +
        '<h1>' + esc(p.name) + '</h1>' + ui.stockHtml(p) +
        '<div class="pi__price"><span class="price num">' + U.money(p.price) + '</span><small>' + esc(p.unit || '') + (isWheel ? ' · sets of four ship free' : '') + '</small></div>' +
        '<p class="pi__desc">' + esc(p.desc) + '</p>' +
        (p.sizes ? '<div class="opt"><h4>' + (isWheel ? 'Size & offset' : isTyre ? 'Tyre size' : 'Option') + ' <span id="psz">' + esc(st.size) + '</span></h4><div class="sizes" id="sizes">' + p.sizes.map(function (z, k) { return '<button class="' + (k ? '' : 'on') + '" data-v="' + esc(z) + '">' + esc(z) + '</button>'; }).join('') + '</div></div>' : '') +
        (p.finishes ? '<div class="opt"><h4>Finish <span id="pfn">' + esc(st.finish) + '</span></h4><div class="swatches" id="fins">' + p.finishes.map(function (f, k) { return '<button class="' + (k ? '' : 'on') + '" style="background:' + f.c + '" data-v="' + esc(f.n) + '" aria-label="' + esc(f.n) + '"></button>'; }).join('') + '</div></div>' : '') +
        fitHtml(p, v) +
        '<div class="buy"><div class="qty"><button id="qm" aria-label="Decrease quantity">−</button><input id="qv" class="num" value="1" inputmode="numeric" aria-label="Quantity"><button id="qp" aria-label="Increase quantity">+</button></div>' +
          '<button class="btn btn--ink" id="addb"' + (s ? '' : ' disabled') + '>' + (s ? 'Add to bag · <span id="addp" class="num">' + U.money(p.price) + '</span>' : 'Out of stock') + '</button>' +
          '<button class="icon-btn' + (db.isWish(p.id) ? ' on' : '') + '" data-wish="' + p.id + '" aria-label="Save to wishlist">' + i('heart', 20) + '</button></div>' +
        '<div class="perks"><div class="perk">' + i('truck', 20) + '<div><b>Delivery</b>Free standard delivery over ' + U.money(C.shipping.freeOver) + '. Express available.</div></div><div class="perk">' + i('returns', 20) + '<div><b>30-day returns</b>On unused, unfitted parts.</div></div><div class="perk">' + i('shield', 20) + '<div><b>Warranty</b>' + (isWheel ? 'Two-year structural warranty.' : 'Manufacturer warranty applies.') + '</div></div><div class="perk">' + i('info', 20) + '<div><b>Fitment help</b>Our team will check fitment before dispatch.</div></div></div>' +
        '<div class="acc"><details open><summary>Specifications</summary><div class="acc__b"><table class="spec-t">' + Object.keys(p.specs || {}).map(function (k) { return '<tr><th>' + esc(k) + '</th><td>' + esc(p.specs[k]) + '</td></tr>'; }).join('') + '</table></div></details>' +
          '<details><summary>Delivery information</summary><div class="acc__b">' + C.shipping.methods.map(function (m) { return '<p><b>' + esc(m.name) + '</b> — ' + (m.price ? U.money(m.price) : 'Free') + ' · ' + esc(m.eta) + '</p>'; }).join('') + '<p style="margin-top:8px">' + esc(C.shipping.heavyItemNote) + '</p></div></details>' +
          '<details><summary>Returns</summary><div class="acc__b">' + esc(C.policies.returns) + '</div></details>' +
          '<details><summary>Fitment notes</summary><div class="acc__b">' + esc(C.policies.fitment) + '</div></details></div>' +
      '</div></div>' +
      '<section class="sec" id="reviews" style="padding-top:30px" aria-labelledby="rvh"><div class="rail-h"><h3 id="rvh">Reviews <span class="tag-demo">Demo reviews</span></h3></div><div class="reviews"><div class="rv__sum"><b class="num">' + p.rating.toFixed(1) + '</b>' + U.stars(p.rating) + '<p class="muted" style="font-size:13px;margin-top:8px">' + p.reviews + ' sample ratings. These reviews are demonstration content for this template, not real customer reviews.</p></div><div>' +
        reviews.map(function (r) { return '<div class="rv">' + U.stars(r.s) + '<h5>' + esc(r.t) + '</h5><p>' + esc(r.b) + '</p><small>Demo reviewer · ' + esc(r.car) + '</small></div>'; }).join('') + '</div></div></section>' +
      '<section style="padding-bottom:90px" aria-labelledby="relh"><div class="rail-h"><h3 id="relh">You may also like</h3><span class="sp"></span><button class="round round--line" data-rail="-1" aria-label="Previous">' + i('arrowL', 18) + '</button><button class="round" data-rail="1" aria-label="Next">' + i('arrow', 18) + '</button></div><div class="rail" id="rail">' + related.map(ui.card).join('') + '</div></section>' +
    '</div></div>';

    /* gallery */
    var gm = U.$('#gmain'), gt = U.$('#gtrack');
    var setImg = function (k) { st.img = (k + views.length) % views.length; gt.style.transform = 'translateX(' + (-100 * st.img) + '%)'; U.$$('[data-gt]', main).forEach(function (b, j) { b.classList.toggle('on', j === st.img); }); gm.classList.remove('zoom'); };
    U.$$('[data-g]', main).forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); setImg(st.img + (+b.getAttribute('data-g'))); }; });
    U.$$('[data-gt]', main).forEach(function (b) { b.onclick = function () { setImg(+b.getAttribute('data-gt')); }; });
    gm.onclick = function (e) { if (e.target.closest('button')) return; gm.classList.toggle('zoom'); };
    var sx = null; gm.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    gm.addEventListener('touchend', function (e) { if (sx == null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) setImg(st.img + (dx < 0 ? 1 : -1)); sx = null; });
    /* options */
    var sz = U.$('#sizes'), fn = U.$('#fins');
    if (sz) sz.onclick = function (e) { var x = e.target.closest('button'); if (!x) return; U.$$('button', sz).forEach(function (y) { y.classList.toggle('on', y === x); }); st.size = x.getAttribute('data-v'); U.$('#psz').textContent = st.size; };
    if (fn) fn.onclick = function (e) { var x = e.target.closest('button'); if (!x) return; U.$$('button', fn).forEach(function (y) { y.classList.toggle('on', y === x); }); st.finish = x.getAttribute('data-v'); U.$('#pfn').textContent = st.finish; };
    /* qty */
    var qv = U.$('#qv'), maxQ = function () { return Math.max(1, db.stockOf(p.id) - db.inCart(p.id)); };
    var setQ = function (n) { st.qty = Math.min(Math.max(1, n | 0), maxQ()); qv.value = st.qty; if (U.$('#addp')) U.$('#addp').textContent = U.money(p.price * st.qty); };
    U.$('#qm').onclick = function () { setQ(st.qty - 1); }; U.$('#qp').onclick = function () { setQ(st.qty + 1); if (st.qty >= maxQ()) ui.toast('That\'s all the stock we have'); };
    qv.onchange = function () { setQ(parseInt(qv.value, 10) || 1); };
    U.$('#addb').onclick = function () { var r = ui.add(p.id, st.qty, { size: st.size, finish: st.finish }); if (r.ok) setQ(1); };
    /* fitment checker */
    var fsel = U.$('#pfit');
    if (fsel) fsel.onchange = function () { db.setVehicle(fsel.value); U.$('#fitres').outerHTML = fitRes(p, db.vehicle()); };
    U.$$('[data-rail]', main).forEach(function (b2) { b2.onclick = function () { var r = U.$('#rail'); r.scrollBy({ left: (+b2.getAttribute('data-rail')) * r.clientWidth * 0.75, behavior: U.reduce ? 'auto' : 'smooth' }); }; });

    ui.setNav(c.id === 'wheels' ? 'shop/wheels' : c.id === 'tyres' ? 'shop/tyres' : perfCats.indexOf(c.id) >= 0 ? 'performance' : 'shop', false);
    ui.meta(p.name, p.desc);
    ui.ld({ '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: p.desc, brand: { '@type': 'Brand', name: b.name }, category: c.name,
      offers: { '@type': 'Offer', price: p.price, priceCurrency: C.currency.code, availability: s ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' } });
  });

  function fitHtml(p, v) {
    var isWheel = p.category === 'wheels', isTyre = p.category === 'tyres';
    var vehicleSpecific = isWheel || isTyre || (p.fit && p.fit.vehicles && p.fit.vehicles.length);
    var grid = isWheel ? '<div class="fit__grid"><div><span>Diameter</span><b>' + p.fit.diameter + '″</b></div><div><span>Bolt pattern</span><b>' + p.fit.bolts.length + ' options</b></div><div><span>Centre bore</span><b>' + p.fit.cb + '</b></div><div><span>Weight</span><b>' + esc(p.fit.weight) + '</b></div></div>' : '';
    if (!vehicleSpecific) return '<div class="fit"><div class="fit__h">' + i('info', 18) + 'Not vehicle-specific</div><p class="muted" style="font-size:13px;margin-top:6px">This item isn\'t matched to particular vehicles. Check the notes in the specifications.</p></div>';
    return '<div class="fit"><div class="fit__h">' + i('car', 20) + 'Check fitment</div>' + grid +
      '<div class="fit__row"><label class="sr" for="pfit">Your vehicle</label><select id="pfit"><option value="">Select your vehicle…</option>' + A.vehicles.map(function (x) { return '<option value="' + x.id + '"' + (v && v.id === x.id ? ' selected' : '') + '>' + esc(x.make + ' ' + x.model + ' · ' + x.years.join('–')) + '</option>'; }).join('') + '</select></div>' + fitRes(p, v) + '</div>';
  }
  function fitRes(p, v) {
    if (!v) return '<div class="fit__res na" id="fitres">' + i('info', 16) + '<span>Select a vehicle to check this part against our sample fitment data.</span></div>';
    var ok = A.fits(p, v);
    if (ok === null) return '<div class="fit__res na" id="fitres">' + i('info', 16) + '<span>No fitment data for this part.</span></div>';
    var extra = p.category === 'wheels' ? ' Hub: ' + v.bolt + ', ' + v.cb + ' mm.' : '';
    return ok ? '<div class="fit__res ok" id="fitres">' + i('check', 16) + '<span><b>Listed for your ' + esc(v.make + ' ' + v.model) + '.</b>' + extra + (p.fit.minWheel ? ' Needs ' + p.fit.minWheel + '-inch wheels or larger.' : '') + ' Based on sample data — confirm brake clearance, offset and load rating before fitting.</span></div>'
      : '<div class="fit__res no" id="fitres">' + i('x', 16) + '<span><b>Not listed for your ' + esc(v.make + ' ' + v.model) + '</b> — ' + esc(A.fitReason(p, v)) + '. <a href="' + H('shop/' + p.category) + '" style="text-decoration:underline">See matching ' + esc(A.catById[p.category].name.toLowerCase()) + '</a>.</span></div>';
  }
  function sampleReviews(p) {
    var bank = {
      wheels: [['Transformed the car', 'Turn-in feels sharper and the finish is even better in person. Fitment was exactly as listed.'], ['Great finish, easy to clean', 'Brake dust wipes off without fuss. Took the hub-centric rings supplied.'], ['Checked fitment first', 'The team confirmed clearance for my brakes before shipping, which I appreciated.']],
      tyres: [['Grip from the first lap', 'Up to temperature quickly and consistent through the session.'], ['Quiet on the motorway', 'Much quieter than my last set and steering feels more precise.'], ['Good wet grip', 'Felt planted in heavy rain.']],
      def: [['Quality part', 'Packaging and hardware were excellent. Fitted without surprises.'], ['Does what it says', 'Clear instructions and a noticeable improvement.'], ['Fast dispatch', 'Arrived in two days, well packed.']]
    };
    var b = bank[p.category] || bank.def, cars = ['BMW M3', 'GR Supra', 'Civic Type R'];
    return b.map(function (r, k) { return { t: r[0], b: r[1], s: k === 2 ? 4 : 5, car: cars[k] }; });
  }
})();
