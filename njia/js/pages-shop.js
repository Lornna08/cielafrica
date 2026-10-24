/* ==========================================================================
   NJIA — home, collections (filters, sort, load more), search, product page
   ========================================================================== */
(function () {
  var N = window.NJIA, C = N.config, U = N.u, esc = U.esc, i = U.i, E = N.editorial;
  var app = function () { return U.$('#app'); };

  N.meta = function (title, desc) {
    document.title = title ? title + ' | NJIA' : 'NJIA | Made for your own lane';
    var m = U.$('meta[name="description"]'); if (m) m.setAttribute('content', desc || C.store.description);
    var ld = U.$('#ld'); if (ld) ld.remove();
  };
  N.sec = function (title, link, body, cls) {
    return '<section class="sec ' + (cls || '') + '"><div class="wrap"><div class="sec__head"><h2 class="h2">' + title + '</h2>' + (link ? '<a class="link" href="' + N.href(link[1]) + '">' + link[0] + i('arrow', 16) + '</a>' : '') + '</div>' + body + '</div></section>';
  };

  /* ================= HOME ================= */
  N.route(/^$/, function () {
    N.meta('', C.store.description);
    var fresh = N.products.filter(N.isNew).sort(N.sorts.newest).slice(0, 8);
    var best = N.products.filter(function (p) { return p.best; }).slice(0, 4);
    var looks = N.lookbook.looks.slice(0, 3);
    app().innerHTML =
      '<section class="hero"><div class="hero__in wrap">' +
        '<div class="hero__copy"><p class="eyebrow eyebrow--accent">' + esc(N.lookbook.season) + ' — ' + esc(N.lookbook.title) + '</p>' +
          '<h1 class="hero__t"><span>Made for</span> <span>your own</span> <span>lane.</span></h1>' +
          '<p class="hero__p">Streetwear, everyday essentials and statement pieces for the way you move.</p>' +
          '<div class="hero__cta"><a class="btn btn--accent" href="' + N.href('shop/new-in') + '">Shop New Arrivals</a><a class="btn btn--line" href="' + N.href('lookbook') + '">Explore the Lookbook</a></div></div>' +
        '<figure class="hero__media">' + U.img(E.hero.img, { widths: [600, 1000, 1500], sizes: '(max-width: 860px) 100vw, 55vw', alt: E.hero.alt, pos: E.hero.pos, mono: true, eager: true }) +
          '<figcaption><span>' + esc(N.lookbook.season) + '</span><a href="' + N.href('lookbook') + '">The lookbook' + i('arrow', 15) + '</a></figcaption></figure>' +
      '</div></section>' +

      '<section class="sec sec--tight"><div class="wrap"><div class="tiles" role="list">' + E.tiles.map(function (t) {
        return '<a class="tile" role="listitem" href="' + N.href(t.to) + '">' + U.img(t.img, { widths: [400, 700], sizes: '(max-width: 760px) 70vw, 25vw', alt: '', pos: t.pos, mono: true }) + '<span class="tile__l">' + esc(t.label) + i('arrow', 18) + '</span></a>';
      }).join('') + '</div></div></section>' +

      N.sec('New arrivals', ['View all', 'shop/new-in'], N.grid(fresh, { cls: 'grid--home' })) +

      '<section class="ed"><figure class="ed__media">' + U.img(E.details.img, { widths: [800, 1400, 2000], sizes: '100vw', alt: E.details.alt, pos: E.details.pos, mono: true }) + '</figure>' +
        '<div class="wrap ed__wrap"><div class="ed__card"><p class="eyebrow eyebrow--accent">Denim</p><h2 class="h1">The details matter.</h2>' +
        '<p>Bar-tacked pockets. Collars that stay flat. Denim that starts rigid and ends up shaped by the way you live in it. We sweat the small things so the clothes you reach for every day keep getting better.</p>' +
        '<div class="ed__row"><a class="btn btn--ink" href="' + N.href('shop/denim') + '">Shop denim</a><a class="link" href="' + N.href('shop/essentials') + '">Everyday essentials' + i('arrow', 16) + '</a></div></div>' +
        '<figure class="ed__inset">' + U.img(E.detailsInset.img, { widths: [300, 500], sizes: '220px', alt: E.detailsInset.alt, pos: E.detailsInset.pos, mono: true }) + '</figure></div></section>' +

      N.sec('Bestsellers', ['Shop all', 'shop/all'], N.grid(best)) +

      '<section class="sec sec--paper"><div class="wrap"><div class="sec__head"><div><p class="eyebrow">' + esc(N.lookbook.season) + '</p><h2 class="h2">' + esc(N.lookbook.title) + '</h2></div><a class="link" href="' + N.href('lookbook') + '">Explore the lookbook' + i('arrow', 16) + '</a></div>' +
        '<div class="lbt">' + looks.map(function (l, k) {
          return '<a class="lbt__i" href="' + N.href('lookbook') + '#look-' + (k + 1) + '"><span class="lbt__img">' + U.img(l.img, { widths: [400, 700], sizes: '(max-width: 760px) 75vw, 33vw', alt: l.name, pos: l.pos, mono: true }) + '</span><span class="lbt__n">0' + (k + 1) + '</span><b>' + esc(l.name) + '</b><small>' + esc(l.caption) + '</small></a>';
        }).join('') + '</div></div></section>' +

      '<section class="cm"><div class="wrap cm__in"><figure class="cm__media">' + U.img(E.custom.img, { widths: [600, 1000, 1400], sizes: '(max-width: 860px) 100vw, 50vw', alt: E.custom.alt, pos: E.custom.pos, mono: true }) + '</figure>' +
        '<div class="cm__copy"><p class="eyebrow eyebrow--accent">Custom Made</p><h2 class="h1">Yours, to measure.</h2><p>Have a piece in mind that isn’t on the rail? Tell us the garment, the fit and the colour, share a reference, and we’ll come back to you with what’s possible before anything is made.</p>' +
        '<a class="btn btn--accent" href="' + N.href('custom-made') + '">Start an enquiry</a></div></div></section>' +

      '<section class="prom"><div class="wrap prom__in">' + [
        ['truck', 'Delivery across Kenya', 'Free on orders over ' + U.money(C.shipping.freeOver) + '.'],
        ['returns', '14-day returns', 'Unworn, with tags. Easy exchanges.'],
        ['phone', 'Pay with M-Pesa', 'A secure STK prompt straight to your phone.'],
        ['needle', 'Custom pieces', 'Made to your measurements on request.']
      ].map(function (x) { return '<div class="prom__i">' + i(x[0], 22) + '<div><b>' + x[1] + '</b><span>' + x[2] + '</span></div></div>'; }).join('') + '</div></section>' +

      '<section class="news"><div class="wrap news__in"><div><h2 class="h2">First to the drop.</h2><p>New pieces, restocks and the occasional lookbook. No spam.</p></div>' +
        '<form class="news__f" novalidate><label class="sr" for="nemail">Email address</label><input id="nemail" type="email" placeholder="Your email address" autocomplete="email" required><button class="btn btn--accent" type="submit">Subscribe</button><p class="news__msg" role="status"></p></form></div></section>';

    var f = U.$('.news__f');
    f.addEventListener('submit', function (e) {
      e.preventDefault(); var v = U.$('#nemail').value.trim(), msg = U.$('.news__msg');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { msg.textContent = 'Please enter a valid email address.'; msg.className = 'news__msg is-err'; return; }
      N.db.subscribe(); msg.className = 'news__msg is-ok'; msg.textContent = 'You’re on the list. (Template: no email is sent.)'; U.$('#nemail').value = '';
    });
  });

  /* ================= COLLECTIONS ================= */
  var PAGE = 12;
  N.route(/^shop(?:\/([\w-]+))?$/, function (m, params) {
    var col = N.colById[m[1] || 'all'];
    if (!col) return N.notFound();
    N.meta(col.name, col.intro);
    var base = N.products.filter(function (p) { return N.inCollection(col, p); });
    var prices = base.map(function (p) { return p.price; }), lo = Math.floor(Math.min.apply(null, prices) / 100) * 100, hi = Math.ceil(Math.max.apply(null, prices) / 100) * 100;
    var types = [], sizes = [], colors = [];
    base.forEach(function (p) {
      if (types.indexOf(p.type) < 0) types.push(p.type);
      p.sizes.forEach(function (s) { if (sizes.indexOf(s) < 0) sizes.push(s); });
      p.colors.forEach(function (c) { if (!colors.some(function (x) { return x.n === c.n; })) colors.push(c); });
    });
    var ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38', 'S/M', 'L/XL', 'One size'];
    sizes.sort(function (a, b) { return ORDER.indexOf(a) - ORDER.indexOf(b); });
    var list = function (k) { var v = params.get(k); return v ? v.split(',').filter(Boolean) : []; };
    var st = { types: list('type'), sizes: list('size'), colors: list('colour'), min: +params.get('min') || lo, max: +params.get('max') || hi, stock: params.get('stock') === '1', sort: N.sorts[params.get('sort')] ? params.get('sort') : 'featured', shown: PAGE };
    st.min = Math.max(lo, Math.min(st.min, hi)); st.max = Math.min(hi, Math.max(st.max, st.min));

    function match(p, skip) {
      var stock = N.db.stock(p);
      return (skip === 'types' || !st.types.length || st.types.indexOf(p.type) >= 0) &&
        (skip === 'sizes' || !st.sizes.length || st.sizes.some(function (s) { return stock[s] > 0; })) &&
        (skip === 'colors' || !st.colors.length || p.colors.some(function (c) { return st.colors.indexOf(c.n) >= 0; })) &&
        p.price >= st.min && p.price <= st.max && (!st.stock || N.inStock(p));
    }
    function results() { return base.filter(function (p) { return match(p); }).sort(N.sorts[st.sort]); }
    function active() { return st.types.length + st.sizes.length + st.colors.length + (st.min > lo || st.max < hi ? 1 : 0) + (st.stock ? 1 : 0); }

    function filtersHtml(idp) {
      var cnt = function (key, fn) { return base.filter(function (p) { return match(p, key) && fn(p); }).length; };
      return '<div class="flt" data-flt>' +
        (types.length > 1 ? '<fieldset class="flt__g"><legend>Category</legend>' + types.map(function (t) {
          return '<label class="ck"><input type="checkbox" data-f="types" value="' + esc(t) + '"' + (st.types.indexOf(t) >= 0 ? ' checked' : '') + '><span class="ck__b">' + i('check', 13) + '</span>' + esc(t) + '<small data-c="types:' + esc(t) + '">' + cnt('types', function (p) { return p.type === t; }) + '</small></label>';
        }).join('') + '</fieldset>' : '') +
        '<fieldset class="flt__g"><legend>Size</legend><div class="flt__sizes">' + sizes.map(function (s) {
          return '<label class="szk' + (s.length > 4 ? ' szk--w' : '') + '"><input type="checkbox" data-f="sizes" value="' + esc(s) + '"' + (st.sizes.indexOf(s) >= 0 ? ' checked' : '') + '><span>' + esc(s) + '</span></label>';
        }).join('') + '</div></fieldset>' +
        '<fieldset class="flt__g"><legend>Colour</legend><div class="flt__cols">' + colors.map(function (c) {
          return '<label class="clk" title="' + esc(c.n) + '"><input type="checkbox" data-f="colors" value="' + esc(c.n) + '"' + (st.colors.indexOf(c.n) >= 0 ? ' checked' : '') + '><span class="clk__s" style="--c:' + c.hex + '"></span><span class="clk__n">' + esc(c.n) + '</span></label>';
        }).join('') + '</div></fieldset>' +
        '<fieldset class="flt__g"><legend>Price</legend><div class="rng" style="--lo:' + ((st.min - lo) / (hi - lo || 1) * 100) + '%;--hi:' + ((st.max - lo) / (hi - lo || 1) * 100) + '%">' +
          '<label class="sr" for="' + idp + 'pmin">Minimum price</label><input id="' + idp + 'pmin" type="range" min="' + lo + '" max="' + hi + '" step="100" value="' + st.min + '" data-f="min">' +
          '<label class="sr" for="' + idp + 'pmax">Maximum price</label><input id="' + idp + 'pmax" type="range" min="' + lo + '" max="' + hi + '" step="100" value="' + st.max + '" data-f="max"></div>' +
          '<p class="rng__v" data-rv>' + U.money(st.min) + ' – ' + U.money(st.max) + '</p></fieldset>' +
        '<fieldset class="flt__g"><legend>Availability</legend><label class="ck"><input type="checkbox" data-f="stock"' + (st.stock ? ' checked' : '') + '><span class="ck__b">' + i('check', 13) + '</span>In stock only</label></fieldset>' +
        '</div>';
    }

    app().innerHTML = '<div class="wrap col">' + N.crumbs([['Home', ''], ['Shop', 'shop/all'], [col.name]]) +
      '<header class="col__head"><div><h1 class="h1">' + esc(col.name) + '</h1><p class="col__intro">' + esc(col.intro) + '</p></div>' +
        '<div class="col__ctrl"><span class="col__count" data-count-res aria-live="polite"></span>' +
        '<button type="button" class="btn btn--line btn--sm col__fbtn" data-openf>' + i('filter', 17) + 'Filter<span class="col__fn" data-fn hidden></span></button>' +
        '<label class="sel"><span>Sort</span><select data-sort aria-label="Sort products">' + [['featured', 'Featured'], ['newest', 'Newest'], ['price-asc', 'Price: low to high'], ['price-desc', 'Price: high to low']].map(function (o) { return '<option value="' + o[0] + '"' + (st.sort === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>' + i('down', 16) + '</label></div></header>' +
      '<div class="col__body"><aside class="col__side" aria-label="Filters"><div class="col__sideh"><b>Filters</b><button type="button" class="link link--sm" data-clear hidden>Clear all</button></div>' + filtersHtml('d') + '</aside>' +
      '<div class="col__main"><div class="chips chips--act" data-chips></div><div data-res></div><div class="more" data-more></div></div></div></div>';

    var root = app();
    function sync(scope) {
      U.$$('[data-f]', scope).forEach(function (el) {
        var f = el.getAttribute('data-f');
        if (f === 'min') el.value = st.min; else if (f === 'max') el.value = st.max;
        else if (f === 'stock') el.checked = st.stock;
        else el.checked = st[f].indexOf(el.value) >= 0;
      });
      U.$$('.rng', scope).forEach(function (r) { r.style.setProperty('--lo', ((st.min - lo) / (hi - lo || 1) * 100) + '%'); r.style.setProperty('--hi', ((st.max - lo) / (hi - lo || 1) * 100) + '%'); });
      U.$$('[data-rv]', scope).forEach(function (v) { v.textContent = U.money(st.min) + ' – ' + U.money(st.max); });
      U.$$('[data-c]', scope).forEach(function (c) { var a = c.getAttribute('data-c').split(':'), k = a.shift(), v = a.join(':'); c.textContent = base.filter(function (p) { return match(p, k) && p.type === v; }).length; });
    }
    function url() {
      var q = new URLSearchParams();
      if (st.types.length) q.set('type', st.types.join(',')); if (st.sizes.length) q.set('size', st.sizes.join(',')); if (st.colors.length) q.set('colour', st.colors.join(','));
      if (st.min > lo) q.set('min', st.min); if (st.max < hi) q.set('max', st.max); if (st.stock) q.set('stock', '1'); if (st.sort !== 'featured') q.set('sort', st.sort);
      var s = q.toString();
      if (location.protocol !== 'file:') history.replaceState({}, '', C.store.basePath + 'shop/' + col.id + (s ? '?' + s : ''));
    }
    function draw() {
      var r = results(), n = active(), shown = r.slice(0, st.shown);
      U.$('[data-count-res]', root).textContent = U.plural(r.length, 'piece');
      var fn = U.$('[data-fn]', root); fn.textContent = n; fn.hidden = !n;
      U.$('[data-clear]', root).hidden = !n;
      var chips = [];
      st.types.forEach(function (v) { chips.push(['types', v, v]); }); st.sizes.forEach(function (v) { chips.push(['sizes', v, 'Size ' + v]); }); st.colors.forEach(function (v) { chips.push(['colors', v, v]); });
      if (st.min > lo || st.max < hi) chips.push(['price', '', U.money(st.min) + ' – ' + U.money(st.max)]);
      if (st.stock) chips.push(['stock', '', 'In stock']);
      U.$('[data-chips]', root).innerHTML = chips.map(function (c) { return '<button type="button" class="chip chip--on" data-rm="' + c[0] + ':' + esc(c[1]) + '" aria-label="Remove filter: ' + esc(c[2]) + '">' + esc(c[2]) + i('x', 14) + '</button>'; }).join('') + (chips.length ? '<button type="button" class="link link--sm" data-clear>Clear all</button>' : '');
      U.$('[data-res]', root).innerHTML = r.length ? N.grid(shown, { sizes: '(max-width: 760px) 50vw, (max-width: 1100px) 33vw, 26vw' }) :
        '<div class="empty"><p class="h3">No pieces match these filters.</p><p>Try removing a filter or two.</p><button type="button" class="btn btn--line" data-clear>Clear all filters</button></div>';
      U.$('[data-more]', root).innerHTML = r.length > st.shown ? '<p>Showing ' + shown.length + ' of ' + r.length + '</p><div class="more__bar"><span style="width:' + (shown.length / r.length * 100) + '%"></span></div><button type="button" class="btn btn--line" data-loadmore>Load more</button>' : (r.length > PAGE ? '<p>Showing all ' + r.length + '</p>' : '');
      sync(root); var dr = U.$('.layer--fl'); if (dr) { sync(dr); var sb = U.$('[data-showres]', dr); if (sb) sb.textContent = 'Show ' + U.plural(r.length, 'piece'); var dc = U.$('[data-clear]', dr); if (dc) dc.disabled = !n; }
      url();
    }
    function readInput(el) {
      var f = el.getAttribute('data-f');
      if (f === 'min') { st.min = Math.min(+el.value, st.max); } else if (f === 'max') { st.max = Math.max(+el.value, st.min); }
      else if (f === 'stock') st.stock = el.checked;
      else { var a = st[f], k = a.indexOf(el.value); if (el.checked && k < 0) a.push(el.value); if (!el.checked && k >= 0) a.splice(k, 1); }
      st.shown = PAGE; draw();
    }
    function clear() { st.types = []; st.sizes = []; st.colors = []; st.min = lo; st.max = hi; st.stock = false; st.shown = PAGE; draw(); }
    function bind(scope) {
      scope.addEventListener('change', function (e) { if (e.target.matches('[data-f]')) readInput(e.target); });
      scope.addEventListener('input', function (e) { if (e.target.matches('input[type=range][data-f]')) readInput(e.target); });
    }
    bind(U.$('.col__side', root));
    root.addEventListener('click', function (e) {
      if (e.target.closest('[data-clear]')) clear();
      var rm = e.target.closest('[data-rm]');
      if (rm) {
        var a = rm.getAttribute('data-rm').split(':'), k = a.shift(), v = a.join(':');
        if (k === 'price') { st.min = lo; st.max = hi; } else if (k === 'stock') st.stock = false; else st[k].splice(st[k].indexOf(v), 1);
        st.shown = PAGE; draw();
      }
      if (e.target.closest('[data-loadmore]')) {
        var before = st.shown; st.shown += PAGE; draw();
        var cards = U.$$('.pc', root); if (cards[before]) { var a2 = U.$('.pc__name', cards[before]); a2 && a2.focus(); }
      }
      if (e.target.closest('[data-openf]')) {
        var L = N.layer('<div class="fdr"><h2 class="h3">Filter</h2>' + filtersHtml('m') + '<div class="fdr__foot"><button type="button" class="btn btn--line" data-clear>Clear all</button><button type="button" class="btn btn--ink" data-close data-showres data-focus>Show</button></div></div>', { cls: 'layer--right layer--fl', label: 'Filter products' });
        bind(L.box); L.box.addEventListener('click', function (ev) { if (ev.target.closest('[data-clear]')) clear(); });
        draw();
      }
    });
    U.$('[data-sort]', root).addEventListener('change', function (e) { st.sort = e.target.value; draw(); });
    draw();
  });

  /* ================= SEARCH ================= */
  N.route(/^search$/, function (m, params) {
    var q = (params.get('q') || '').trim(), r = N.search(q);
    N.meta(q ? 'Search: ' + q : 'Search');
    app().innerHTML = '<div class="wrap col">' + N.crumbs([['Home', ''], ['Search']]) +
      '<header class="col__head"><div><h1 class="h1">' + (q ? 'Results for “' + esc(q) + '”' : 'Search') + '</h1><p class="col__intro">' + (q ? U.plural(r.length, 'piece') + ' found.' : 'Find tees, denim, jackets and more.') + '</p></div>' +
      '<form class="srchp" role="search"><label class="sr" for="sq">Search</label><input id="sq" type="search" value="' + esc(q) + '" placeholder="Search the store"><button class="btn btn--ink btn--sm" type="submit">Search</button></form></header>' +
      (r.length ? N.grid(r) : '<div class="empty"><p class="h3">' + (q ? 'Nothing matches that search.' : 'What are you looking for?') + '</p><div class="chips" style="justify-content:center">' + C.popularSearches.map(function (s) { return '<a class="chip" href="' + N.href('search?q=' + encodeURIComponent(s)) + '">' + esc(s) + '</a>'; }).join('') + '</div></div>') + '</div>';
    U.$('.srchp').addEventListener('submit', function (e) { e.preventDefault(); var v = U.$('#sq').value.trim(); if (v) N.go('search?q=' + encodeURIComponent(v)); });
  });

  /* ================= PRODUCT ================= */
  N.route(/^product\/([\w-]+)$/, function (m) {
    var p = N.bySlug[m[1]]; if (!p) return N.notFound();
    N.meta(p.name, p.desc);
    var cat = N.categories.filter(function (c) { return c.id === p.cat; })[0], out = !N.inStock(p);
    var st = { color: p.colors[0].n, size: N.firstSize(p), qty: 1 };
    var related = N.products.filter(function (x) { return x.id !== p.id && x.cat === p.cat; }).concat(N.products.filter(function (x) { return x.cat !== p.cat && x.best; })).slice(0, 4);
    var tt = C.shipping;
    app().innerHTML = '<div class="wrap pdp">' + N.crumbs([['Home', ''], [cat.name, 'shop/' + p.cat], [p.name]]) +
      '<div class="pdp__grid"><div class="gal">' +
        (p.imgs.length > 1 ? '<div class="gal__thumbs" role="tablist" aria-label="Product images">' + p.imgs.map(function (im, k) { return '<button type="button" class="gal__th' + (k ? '' : ' is-on') + '" data-th="' + k + '" role="tab" aria-selected="' + !k + '" aria-label="Image ' + (k + 1) + ' of ' + p.imgs.length + '">' + U.img(im, { widths: [120, 240], sizes: '72px', alt: '', pos: p.pos && p.pos[k] }) + '</button>'; }).join('') + '</div>' : '') +
        '<div class="gal__main"><div class="gal__track" data-track tabindex="0" aria-label="' + esc(p.name) + ' images">' + p.imgs.map(function (im, k) { return '<figure class="gal__s">' + U.img(im, { widths: [600, 1000, 1400], sizes: '(max-width: 860px) 100vw, 55vw', alt: p.name + (p.imgs.length > 1 ? ', image ' + (k + 1) : ''), pos: p.pos && p.pos[k], eager: !k }) + '</figure>'; }).join('') + '</div>' +
          (p.imgs.length > 1 ? '<button type="button" class="gal__arr gal__arr--l" data-gstep="-1" aria-label="Previous image">' + i('left', 22) + '</button><button type="button" class="gal__arr gal__arr--r" data-gstep="1" aria-label="Next image">' + i('right', 22) + '</button><div class="gal__dots" aria-hidden="true">' + p.imgs.map(function (x, k) { return '<i' + (k ? '' : ' class="is-on"') + '></i>'; }).join('') + '</div>' : '') +
          (N.label(p) ? '<span class="tag tag--' + N.label(p).c + '">' + N.label(p).t + '</span>' : '') + '</div></div>' +
      '<div class="pdp__info"><div class="pdp__stick">' +
        '<p class="eyebrow eyebrow--accent">' + esc(p.type) + (p.g === 'w' ? ' · Women' : p.g === 'm' ? ' · Men' : ' · Unisex') + '</p>' +
        '<h1 class="pdp__t">' + esc(p.name) + '</h1><div class="pdp__price">' + N.priceHtml(p) + (p.was ? '<span class="save">Save ' + U.money(p.was - p.price) + '</span>' : '') + '</div>' +
        '<p class="pdp__d">' + esc(p.desc) + '</p>' + N.picker(p, st) +
        '<div class="buy" data-buy>' + N.qtyHtml(1, 10) + '<button type="button" class="btn btn--accent btn--block" data-add' + (out ? ' disabled' : '') + '>' + (out ? 'Sold out' : 'Add to bag') + '</button></div>' +
        '<ul class="pdp__notes"><li>' + i('truck', 18) + '<span><b>Delivery across Kenya.</b> Free over ' + U.money(tt.freeOver) + '; Nairobi from ' + U.money(tt.methods[0].price) + '.</span></li><li>' + i('returns', 18) + '<span><b>14-day returns</b> on unworn pieces with tags.</span></li><li>' + i('phone', 18) + '<span><b>Pay with M-Pesa</b> at checkout.</span></li></ul>' +
        N.acc([
          { t: 'Details & fit', b: '<p>' + esc(p.fit) + '</p><p>Product code ' + p.id.toUpperCase() + '</p>', open: true },
          { t: 'Fabric & care', b: '<p>' + esc(p.fabric) + '</p>' },
          { t: 'Delivery', b: '<ul class="dl">' + tt.methods.map(function (x) { return '<li><b>' + esc(x.name) + '</b> — ' + (x.price ? U.money(x.price) : 'Free') + ', ' + esc(x.eta) + '</li>'; }).join('') + '<li>Free delivery on orders over ' + U.money(tt.freeOver) + '.</li></ul>' },
          { t: 'Returns & exchanges', b: '<p>Return or exchange unworn pieces with their tags within 14 days of delivery. Custom Made pieces are made for you and can’t be returned unless faulty. <a class="link" href="' + N.href('help/returns') + '">Returns policy</a></p>' }
        ]) +
      '</div></div></div>' +
      N.sec('You may also like', null, N.grid(related), 'sec--flush').replace('<section class="sec sec--flush"><div class="wrap">', '<section class="sec sec--flush"><div>') +
      '</div><div class="mbar" data-mbar aria-hidden="true"><div><b>' + esc(p.name) + '</b><span>' + U.money(p.price) + '</span></div><button type="button" class="btn btn--accent" data-madd tabindex="-1"' + (out ? ' disabled' : '') + '>' + (out ? 'Sold out' : 'Add to bag') + '</button></div>';

    var root = app(), info = U.$('.pdp__info', root), track = U.$('[data-track]', root), cur = 0;
    var ld = document.createElement('script'); ld.type = 'application/ld+json'; ld.id = 'ld';
    ld.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: p.desc, sku: p.id.toUpperCase(), brand: { '@type': 'Brand', name: 'NJIA' }, image: p.imgs.map(function (x) { return U.src(x, 1200); }),
      offers: { '@type': 'Offer', priceCurrency: 'KES', price: p.price, availability: out ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock' } });
    document.head.appendChild(ld);

    function goTo(k) { k = Math.max(0, Math.min(p.imgs.length - 1, k)); track.scrollTo({ left: k * track.clientWidth, behavior: U.reduce ? 'auto' : 'smooth' }); }
    function mark(k) {
      cur = k;
      U.$$('[data-th]', root).forEach(function (b, j) { b.classList.toggle('is-on', j === k); b.setAttribute('aria-selected', j === k); });
      U.$$('.gal__dots i', root).forEach(function (d, j) { d.classList.toggle('is-on', j === k); });
    }
    var tmr; track.addEventListener('scroll', function () { clearTimeout(tmr); tmr = setTimeout(function () { mark(Math.round(track.scrollLeft / track.clientWidth)); }, 60); });
    track.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); goTo(cur + 1); } if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(cur - 1); } });
    root.addEventListener('click', function (e) {
      var th = e.target.closest('[data-th]'); if (th) goTo(+th.getAttribute('data-th'));
      var gs = e.target.closest('[data-gstep]'); if (gs) goTo(cur + +gs.getAttribute('data-gstep'));
    });
    N.wirePicker(info, p, st, { onColor: function (c) { if (c && c.img) goTo(c.img); else if (c) goTo(0); } });
    function add() { var r = N.tryAdd(info, p, st); if (r) N.added(p, r); else info.querySelector('.sizes').scrollIntoView({ behavior: U.reduce ? 'auto' : 'smooth', block: 'center' }); }
    U.$('[data-add]', info).addEventListener('click', add);
    var mb = U.$('[data-mbar]', root);
    U.$('[data-madd]', mb).addEventListener('click', add);
    var buyEl = U.$('[data-buy]', info), ticking = false, shown = false;
    function onScroll() {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        ticking = false; var show = buyEl.getBoundingClientRect().bottom < 0;
        if (show !== shown) { shown = show; mb.classList.toggle('is-on', show); mb.setAttribute('aria-hidden', !show); U.$('[data-madd]', mb).tabIndex = show ? 0 : -1; }
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    N.onLeave = function () { window.removeEventListener('scroll', onScroll); };
  });
})();
