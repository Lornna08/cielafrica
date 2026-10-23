/* ==========================================================================
   APEX MOTION — shared components: header, footer, product card, drawers,
   quick view, search, toasts, reveal-on-scroll
   ========================================================================== */
(function () {
  var A = APEX, C = A.config, U = A.u, db = A.db, i = U.i, esc = U.esc, H = A.href;
  var ui = A.ui = {};

  /* ---------- shell ---------- */
  var navItems = [['shop', 'Shop'], ['shop/wheels', 'Wheels'], ['shop/tyres', 'Tyres'], ['performance', 'Performance Parts'], ['brands', 'Brands'], ['|'], ['journal', 'Journal'], ['gallery', 'Gallery']];
  ui.shell = function () {
    var strip = document.querySelector('.cstrip');
    (strip || document.body).insertAdjacentHTML(strip ? 'afterend' : 'afterbegin',
      '<a class="skip" href="#main">Skip to content</a>' +
      '<header class="hdr" id="hdr"><div class="wrap hdr__in">' +
        '<button class="icon-btn burger" id="burger" aria-label="Open menu">' + i('menu', 22) + '</button>' +
        '<a class="logo" href="' + H('') + '" aria-label="' + esc(C.store.name) + ' home">' + U.logo() + '</a>' +
        '<nav class="nav" aria-label="Main">' + navItems.map(function (n) { return n[0] === '|' ? '<i aria-hidden="true"></i>' : '<a href="' + H(n[0]) + '" data-nav="' + n[0] + '">' + n[1] + '</a>'; }).join('') + '</nav>' +
        '<div class="hdr__tools">' +
          '<button class="search-pill" data-search aria-label="Search the catalogue"><span>Search parts</span><em>' + i('search', 15) + '</em></button>' +
          '<a class="icon-btn hide-m" href="' + H('account') + '" aria-label="Account">' + i('user') + '</a>' +
          '<a class="icon-btn" href="' + H('wishlist') + '" aria-label="Wishlist">' + i('heart') + '<span class="count" data-wcount hidden></span></a>' +
          '<button class="icon-btn" data-cart aria-label="Open bag">' + i('bag') + '<span class="count" data-ccount hidden></span></button>' +
        '</div></div></header>' +
      '<main id="main" tabindex="-1"></main><footer class="ftr" id="ftr"></footer>' +
      '<div class="scrim" id="scrim"></div>' +
      '<aside class="drawer left" id="mnav" aria-label="Menu"><div class="drawer__h"><a class="logo" href="' + H('') + '">' + U.logo() + '</a><button class="icon-btn" data-close aria-label="Close menu">' + i('x') + '</button></div><div class="drawer__b"><nav class="mnav">' +
        [['shop', 'Shop', 'All parts'], ['shop/wheels', 'Wheels', ''], ['shop/tyres', 'Tyres', ''], ['performance', 'Performance', 'Brakes, suspension, exhaust'], ['brands', 'Brands', ''], ['journal', 'Journal', ''], ['gallery', 'Gallery', ''], ['account', 'Account', ''], ['wishlist', 'Wishlist', '']].map(function (n) { return '<a href="' + H(n[0]) + '">' + n[1] + '<small>' + n[2] + '</small></a>'; }).join('') +
      '</nav></div></aside>' +
      '<aside class="drawer" id="cartd" aria-label="Shopping bag"></aside>' +
      '<div class="search-ov" id="sov" role="dialog" aria-modal="true" aria-label="Search"></div>' +
      '<div class="modal" id="modal" role="dialog" aria-modal="true"><div class="modal__bg" data-close></div><div class="modal__card" id="modalc"></div></div>' +
      '<div class="toast-wrap" id="toasts" aria-live="polite"></div>');
    ui.footer();
    var hdr = U.$('#hdr');
    var onScroll = function () { hdr.classList.toggle('is-scrolled', scrollY > 10); };
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
    U.$('#burger').onclick = function () { ui.open('mnav'); };
    U.$('#scrim').onclick = ui.closeAll;
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) ui.closeAll();
      if (e.target.closest('[data-search]')) { e.preventDefault(); ui.search(); }
      if (e.target.closest('[data-cart]')) { e.preventDefault(); ui.cart(); }
      var w = e.target.closest('[data-wish]'); if (w) { e.preventDefault(); ui.wish(w.getAttribute('data-wish'), w); }
      var ad = e.target.closest('[data-add]'); if (ad) { e.preventDefault(); ui.add(ad.getAttribute('data-add'), 1); }
      var qv = e.target.closest('[data-qv]'); if (qv) { e.preventDefault(); ui.quick(qv.getAttribute('data-qv')); }
      if (e.target.closest('#mnav a')) ui.closeAll();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') ui.closeAll();
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))) { e.preventDefault(); ui.search(); }
    });
    db.on(ui.counts); ui.counts();
  };
  ui.counts = function () {
    var c = db.count(), w = db.state().wish.length;
    U.$$('[data-ccount]').forEach(function (e) { e.textContent = c; e.hidden = !c; });
    U.$$('[data-wcount]').forEach(function (e) { e.textContent = w; e.hidden = !w; });
  };
  ui.setNav = function (key, dark) {
    U.$$('[data-nav]').forEach(function (a) { a.classList.toggle('on', a.getAttribute('data-nav') === key); });
    U.$('#hdr').classList.toggle('is-dark', !!dark);
  };
  var lastFocus = null;
  ui.open = function (id) { lastFocus = document.activeElement; ui.closeAll(true); U.$('#' + id).classList.add('on'); if (id !== 'sov' && id !== 'modal') U.$('#scrim').classList.add('on'); document.body.style.overflow = 'hidden'; var f = (id === 'sov' && U.$('#sin')) || U.$('#' + id + ' input, #' + id + ' button, #' + id + ' a'); if (f) setTimeout(function () { f.focus(); }, 80); };
  ui.closeAll = function (silent) {
    U.$$('.drawer.on,.search-ov.on,.modal.on,.filters.on').forEach(function (e) { e.classList.remove('on'); });
    U.$('#scrim').classList.remove('on'); document.body.style.overflow = '';
    if (!silent && lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
  };
  ui.toast = function (html) {
    var t = document.createElement('div'); t.className = 'toast'; t.innerHTML = html;
    U.$('#toasts').appendChild(t); setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(function () { t.remove(); }, 300); }, 2800);
  };

  /* ---------- footer ---------- */
  ui.footer = function () {
    var col = function (h, links) { return '<div class="ftr__col"><h4>' + h + '</h4>' + links.map(function (l) { return '<a href="' + H(l[0]) + '">' + l[1] + '</a>'; }).join('') + '</div>'; };
    U.$('#ftr').innerHTML = '<div class="wrap"><div class="ftr__top">' +
      '<div><a class="logo" href="' + H('') + '">' + U.logo(true) + '</a><p class="ftr__tag">' + esc(C.store.tagline) + ' Join the drop list for new arrivals and track-day offers.</p>' +
        '<form class="news" id="newsf" novalidate><label class="sr" for="newsin">Email address</label><input id="newsin" type="email" placeholder="Your email for the drop list" autocomplete="email" required><button class="btn btn--acc btn--sm">Join</button></form>' +
        '<p id="newsmsg" style="font-size:12px;margin-top:8px;min-height:16px;color:rgba(255,255,255,.55)"></p></div>' +
      col('Shop', [['shop/wheels', 'Wheels'], ['shop/tyres', 'Tyres'], ['performance', 'Performance Parts'], ['shop/accessories', 'Accessories'], ['shop?sort=new', 'New Arrivals']]) +
      col('My account', [['account/orders', 'Orders'], ['wishlist', 'Wishlist'], ['account', 'Account Settings'], ['info/delivery', 'Delivery Information']]) +
      col('Customer service', [['info/contact', 'Contact'], ['info/faq', 'FAQs'], ['info/shipping', 'Shipping'], ['info/returns', 'Returns'], ['info/fitment', 'Fitment Support']]) +
      col('Company', [['info/about', 'About'], ['journal', 'Journal'], ['gallery', 'Gallery'], ['info/privacy', 'Privacy Policy'], ['info/terms', 'Terms and Conditions']]) +
      '</div><div class="ftr__word" aria-hidden="true">' + esc(C.store.name) + '</div>' +
      '<div class="ftr__bot"><span>© ' + new Date().getFullYear() + ' ' + esc(C.store.name) + '. Demo store with sample products and prices.</span>' +
        '<nav>' + C.contact.social.map(function (s) { return '<a href="' + s.url + '">' + s.name + '</a>'; }).join('') + '<button id="resetd" style="text-decoration:underline;text-underline-offset:2px;font-size:12.5px">Reset demo</button></nav>' +
        '<span class="credit">' + esc(C.credit.text) + ' <a href="' + C.credit.url + '" target="_blank" rel="noopener">' + esc(C.credit.name) + '</a></span></div></div>';
    U.$('#newsf').onsubmit = function (e) {
      e.preventDefault(); var v = U.$('#newsin').value.trim(), m = U.$('#newsmsg');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { m.textContent = 'Enter a valid email address.'; return; }
      db.subscribe(); U.$('#newsin').value = ''; m.textContent = 'Thanks — in this demo your email is not stored or sent anywhere.';
    };
    U.$('#resetd').onclick = function () { if (confirm('Reset the demo? This clears your bag, wishlist, demo account and demo orders in this browser.')) { db.reset(); ui.toast('Demo reset'); A.go(''); } };
  };

  /* ---------- product card ---------- */
  ui.stockHtml = function (p) {
    var s = db.stockOf(p.id);
    if (!s) return '<span class="stock out">Out of stock</span>';
    if (s <= 6) return '<span class="stock low">Only ' + s + ' left</span>';
    return '<span class="stock">In stock</span>';
  };
  ui.card = function (p) {
    var s = db.stockOf(p.id), w = db.isWish(p.id), b = A.brandById[p.brand];
    var badge = !s ? '<span class="pc__badge pc__badge--out">Sold out</span>' : (p.badge ? '<span class="pc__badge' + (p.badge === 'New' ? '' : ' pc__badge--acc') + '">' + esc(p.badge) + '</span>' : '');
    return '<article class="pc">' +
      '<a class="pc__m" href="' + H('product/' + p.slug) + '" aria-label="' + esc(p.name) + '"><img src="' + p.image + '" alt="' + esc(p.name) + ' — ' + esc(A.catById[p.category].name.toLowerCase()) + '" loading="lazy" decoding="async" width="600" height="600"></a>' + badge +
      '<button class="pc__wish' + (w ? ' on' : '') + '" data-wish="' + p.id + '" aria-pressed="' + w + '" aria-label="' + (w ? 'Remove from' : 'Save to') + ' wishlist">' + i('heart', 17) + '</button>' +
      '<button class="pc__qv" data-qv="' + p.id + '">Quick view</button>' +
      '<div class="pc__b"><div class="pc__meta">' + U.stars(p.rating) + '<span>' + p.reviews + '</span><span class="pc__brand">' + esc(b.name) + '</span></div>' +
        '<a class="pc__t" href="' + H('product/' + p.slug) + '">' + esc(p.name) + '</a>' +
        '<div class="pc__s">' + esc(A.catById[p.category].name) + ' · ' + ui.stockHtml(p) + '</div>' +
        '<div class="pc__f"><span class="price num">' + U.money(p.price) + '<small>' + esc(p.unit || '') + '</small></span>' +
        '<button class="pc__add" data-add="' + p.id + '"' + (s ? '' : ' disabled') + ' aria-label="Add ' + esc(p.name) + ' to bag">' + i('bag', 18) + '</button></div></div></article>';
  };

  ui.add = function (id, qty, opts) {
    var r = db.add(id, qty, opts), p = A.byId[id];
    if (!r.ok) { ui.toast(esc(r.msg)); return r; }
    ui.toast(i('check', 16) + ' ' + esc(p.name) + (r.capped ? ' (limited to available stock)' : '') + ' added · <a href="#" data-cart>View bag</a>');
    return r;
  };
  ui.wish = function (id, el) {
    var on = db.toggleWish(id);
    U.$$('[data-wish="' + id + '"]').forEach(function (b) { b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    ui.toast(on ? i('heart', 16) + ' Saved to your wishlist · <a href="' + H('wishlist') + '">View</a>' : 'Removed from your wishlist');
    if (A.path() === '/wishlist') A.render();
  };

  /* ---------- cart drawer ---------- */
  ui.lineHtml = function (x, compact) {
    var p = x.p, l = x.l, max = db.stockOf(p.id);
    return '<div class="ci" data-line="' + l.key + '"><img src="' + p.image + '" alt="" width="72" height="72"><div><a href="' + H('product/' + p.slug) + '"><b>' + esc(p.name) + '</b></a><small>' + esc([l.size, l.finish].filter(Boolean).join(' · ')) + '</small><small>' + U.money(p.price) + ' ' + esc(p.unit || '') + '</small></div>' +
      '<div class="ci__r"><b class="num">' + U.money(x.total) + '</b><div class="qty qty--sm"><button data-q="-1" aria-label="Decrease quantity">−</button><input class="num" value="' + l.qty + '" inputmode="numeric" aria-label="Quantity" data-qin><button data-q="1" aria-label="Increase quantity"' + (db.inCart(p.id) >= max ? ' disabled style="opacity:.35"' : '') + '>+</button></div><button class="ci__x" data-rm>Remove</button></div></div>';
  };
  ui.bindLines = function (root, after) {
    U.$$('[data-line]', root).forEach(function (row) {
      var key = row.getAttribute('data-line'), l = db.state().cart.filter(function (x) { return x.key === key; })[0]; if (!l) return;
      U.$$('[data-q]', row).forEach(function (b) { b.onclick = function () { db.setQty(key, l.qty + (+b.getAttribute('data-q'))); after(); }; });
      U.$('[data-qin]', row).onchange = function (e) { db.setQty(key, parseInt(e.target.value, 10) || 0); after(); };
      U.$('[data-rm]', row).onclick = function () { db.remove(key); ui.toast('Removed from your bag'); after(); };
    });
  };
  ui.shipBar = function (t) {
    var left = C.shipping.freeOver - (t.sub - t.disc);
    return '<div class="ship-bar">' + (left > 0 ? 'Add <b>' + U.money(left) + '</b> for free standard delivery' : '<b>Free standard delivery</b> unlocked') + '<i><em style="width:' + Math.min(100, (t.sub - t.disc) / C.shipping.freeOver * 100) + '%"></em></i></div>';
  };
  ui.cart = function () {
    var d = U.$('#cartd');
    var draw = function () {
      var lines = db.lines(), t = db.totals();
      d.innerHTML = '<div class="drawer__h"><h3>Your bag <span class="muted" style="font-family:var(--ft);font-size:14px;font-weight:500;text-transform:none">(' + db.count() + ')</span></h3><button class="icon-btn" data-close aria-label="Close bag">' + i('x') + '</button></div>' +
        (lines.length ? '<div class="drawer__b">' + ui.shipBar(t) + lines.map(function (x) { return ui.lineHtml(x); }).join('') + '</div>' +
          '<div class="drawer__f"><div class="sum"><div><span>Subtotal</span><b class="num">' + U.money(t.sub) + '</b></div>' + (t.disc ? '<div class="disc"><span>Discount (' + t.code.code + ')</span><b class="num">−' + U.money(t.disc) + '</b></div>' : '') + '<div class="muted" style="font-size:12.5px"><span>Shipping and codes are applied at checkout</span></div></div>' +
          '<a class="btn btn--ink btn--block" href="' + H('checkout') + '" data-close>Checkout · ' + U.money(t.sub - t.disc) + '</a><a class="btn btn--line btn--block" href="' + H('cart') + '" data-close>View bag</a></div>'
        : '<div class="drawer__b"><div class="empty" style="margin-top:20px"><h3>Your bag is empty</h3><p>Wheels, tyres and performance parts, fitted right.</p><a class="btn btn--ink" href="' + H('shop') + '" data-close>Shop the catalogue</a></div></div>');
      ui.bindLines(d, draw);
    };
    draw(); ui.open('cartd');
  };

  /* ---------- quick view ---------- */
  ui.quick = function (id) {
    var p = A.byId[id], s = db.stockOf(id), b = A.brandById[p.brand];
    var st = { size: p.sizes ? p.sizes[0] : '', finish: p.finishes ? p.finishes[0].n : '', qty: 1 };
    var c = U.$('#modalc');
    c.innerHTML = '<button class="icon-btn modal__x" data-close aria-label="Close">' + i('x') + '</button><div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr)" class="qv">' +
      '<div style="background:#EDEAE2;aspect-ratio:1"><img src="' + p.image + '" alt="' + esc(p.name) + '" style="width:100%;height:100%;object-fit:cover"></div>' +
      '<div style="padding:28px;display:flex;flex-direction:column;gap:12px"><div class="pi__top"><a href="' + H('brands#' + b.id) + '" data-close>' + esc(b.name) + '</a>' + U.stars(p.rating) + '<span>' + p.reviews + ' sample reviews</span></div>' +
      '<h2 class="disp" style="font-size:40px" id="qvh">' + esc(p.name) + '</h2><div class="price num" style="font-size:32px">' + U.money(p.price) + ' <small style="display:inline;font-size:12px">' + esc(p.unit || '') + '</small></div>' + ui.stockHtml(p) +
      '<p style="font-size:13.5px;color:var(--soft)">' + esc(p.desc) + '</p>' +
      (p.sizes ? '<div class="opt"><h4>Size <span data-qs>' + esc(st.size) + '</span></h4><div class="sizes" data-sz>' + p.sizes.map(function (z, k) { return '<button class="' + (k ? '' : 'on') + '" data-v="' + esc(z) + '">' + esc(z) + '</button>'; }).join('') + '</div></div>' : '') +
      (p.finishes ? '<div class="opt"><h4>Finish <span data-qf>' + esc(st.finish) + '</span></h4><div class="swatches" data-fn>' + p.finishes.map(function (f, k) { return '<button class="' + (k ? '' : 'on') + '" style="background:' + f.c + '" data-v="' + esc(f.n) + '" aria-label="' + esc(f.n) + '"></button>'; }).join('') + '</div></div>' : '') +
      '<div class="buy" style="margin:6px 0 0"><button class="btn btn--ink" data-qadd' + (s ? '' : ' disabled') + '>' + (s ? 'Add to bag' : 'Out of stock') + '</button><a class="btn btn--line" href="' + H('product/' + p.slug) + '" data-close>Full details</a></div></div></div>';
    c.setAttribute('aria-labelledby', 'qvh');
    var sz = U.$('[data-sz]', c), fn = U.$('[data-fn]', c);
    if (sz) sz.onclick = function (e) { var b = e.target.closest('button'); if (!b) return; U.$$('button', sz).forEach(function (x) { x.classList.toggle('on', x === b); }); st.size = b.getAttribute('data-v'); U.$('[data-qs]', c).textContent = st.size; };
    if (fn) fn.onclick = function (e) { var b = e.target.closest('button'); if (!b) return; U.$$('button', fn).forEach(function (x) { x.classList.toggle('on', x === b); }); st.finish = b.getAttribute('data-v'); U.$('[data-qf]', c).textContent = st.finish; };
    U.$('[data-qadd]', c).onclick = function () { var r = ui.add(id, 1, st); if (r.ok) ui.closeAll(); };
    if (matchMedia('(max-width:700px)').matches) U.$('.qv', c).style.gridTemplateColumns = '1fr';
    ui.open('modal');
  };

  /* ---------- search ---------- */
  A.searchAll = function (q) {
    q = q.toLowerCase().trim(); if (!q) return { products: [], cols: [], arts: [] };
    var terms = q.split(/\s+/);
    var hay = function (p) { return [p.name, A.brandById[p.brand].name, A.catById[p.category].name, p.desc, (p.tags || []).join(' '), (p.sizes || []).join(' '), JSON.stringify(p.specs || {}), p.fit && p.fit.bolts ? p.fit.bolts.join(' ') : ''].join(' ').toLowerCase().replace(/×/g, 'x'); };
    var products = A.products.map(function (p) { var h = hay(p), sc = 0; terms.forEach(function (t) { t = t.replace(/×/g, 'x'); if (h.indexOf(t) >= 0) sc += 1; if (p.name.toLowerCase().indexOf(t) >= 0) sc += 2; }); return { p: p, sc: sc }; })
      .filter(function (x) { return x.sc >= terms.length; }).sort(function (a, b) { return b.sc - a.sc || b.p.pop - a.p.pop; }).map(function (x) { return x.p; });
    var cols = A.categories.filter(function (c) { return terms.some(function (t) { return c.name.toLowerCase().indexOf(t) >= 0; }); }).map(function (c) { return { href: 'shop/' + c.id, name: c.name, kind: 'Category' }; })
      .concat(A.collections.filter(function (c) { return terms.some(function (t) { return c.name.toLowerCase().indexOf(t) >= 0; }); }).map(function (c) { return { href: 'collections/' + c.id, name: c.name, kind: 'Collection' }; }))
      .concat(A.brands.filter(function (b) { return terms.some(function (t) { return b.name.toLowerCase().indexOf(t) >= 0; }); }).map(function (b) { return { href: 'shop?brand=' + b.id, name: b.name, kind: 'Brand' }; }));
    var arts = A.articles.filter(function (a) { var h = (a.title + ' ' + a.excerpt + ' ' + a.cat).toLowerCase(); return terms.every(function (t) { return h.indexOf(t) >= 0; }); });
    return { products: products, cols: cols, arts: arts };
  };
  ui.search = function (initial) {
    var o = U.$('#sov');
    o.innerHTML = '<div class="search-ov__in"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><span class="kicker">Search the catalogue</span><button class="icon-btn" data-close aria-label="Close search">' + i('x') + '</button></div>' +
      '<form class="search-ov__bar" id="sform" role="search">' + i('search', 28) + '<label class="sr" for="sin">Search</label><input id="sin" autocomplete="off" placeholder="Wheels, 5x112, brakes…" value="' + esc(initial || '') + '"></form><div id="sres"></div></div>';
    var inp = U.$('#sin', o), res = U.$('#sres', o);
    var draw = function () {
      var q = inp.value, r = A.searchAll(q);
      if (!q.trim()) { res.innerHTML = '<div style="margin-top:26px"><h4 class="kicker" style="margin-bottom:12px">Popular searches</h4><div class="chips">' + ['Forged', '5x112', 'Semi-slick', 'Coilovers', 'Big brake', 'Titanium', 'R20'].map(function (s) { return '<button class="chip" data-s="' + s + '">' + s + '</button>'; }).join('') + '</div></div>'; return; }
      res.innerHTML = '<div class="sres"><div><h4>Products (' + r.products.length + ')</h4>' + (r.products.length ? r.products.slice(0, 6).map(function (p) { return '<a class="sres__p" href="' + H('product/' + p.slug) + '" data-close><img src="' + p.image + '" alt=""><div><b>' + esc(p.name) + '</b><span>' + esc(A.brandById[p.brand].name + ' · ' + A.catById[p.category].name) + '</span></div><em class="num">' + U.money(p.price) + '</em></a>'; }).join('') + (r.products.length > 6 ? '<a class="link" style="margin-top:10px" href="' + H('search?q=' + encodeURIComponent(q)) + '" data-close>See all ' + r.products.length + ' results ' + i('arrow', 16) + '</a>' : '') : '<p class="muted" style="font-size:14px">No products match “' + esc(q) + '”. Try a size such as R19, a bolt pattern such as 5x112, or a category.</p>') +
        '</div><div class="sres__l"><h4>Collections & brands</h4>' + (r.cols.length ? r.cols.map(function (c) { return '<a href="' + H(c.href) + '" data-close>' + esc(c.name) + ' <span class="muted">· ' + c.kind + '</span></a>'; }).join('') : '<p class="muted" style="font-size:13px">—</p>') +
        '<h4 style="margin-top:22px">Journal</h4>' + (r.arts.length ? r.arts.slice(0, 4).map(function (a) { return '<a href="' + H('journal/' + a.slug) + '" data-close>' + esc(a.title) + '</a>'; }).join('') : '<p class="muted" style="font-size:13px">—</p>') + '</div></div>';
    };
    inp.oninput = draw;
    res.onclick = function (e) { var c = e.target.closest('[data-s]'); if (c) { inp.value = c.getAttribute('data-s'); draw(); inp.focus(); } };
    U.$('#sform', o).onsubmit = function (e) { e.preventDefault(); if (inp.value.trim()) { ui.closeAll(true); A.go('search?q=' + encodeURIComponent(inp.value.trim())); } };
    draw(); ui.open('sov');
  };

  /* ---------- reveal on scroll ---------- */
  ui.reveal = function (root) {
    var els = U.$$('[data-rv]:not(.in)', root);
    if (U.reduce || !('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (e) { io.observe(e); });
  };

  ui.crumbs = function (items) { return '<nav class="crumbs" aria-label="Breadcrumb"><a href="' + H('') + '">Home</a>' + items.map(function (c) { return '<i>/</i>' + (c[1] ? '<a href="' + H(c[1]) + '">' + esc(c[0]) + '</a>' : '<span aria-current="page">' + esc(c[0]) + '</span>'); }).join('') + '</nav>'; };
  ui.meta = function (title, desc, img) {
    document.title = title ? title + ' · ' + C.store.name : C.store.name + ' — Performance wheels, tyres & parts';
    var set = function (sel, attr, v) { var e = U.$(sel); if (e) e.setAttribute(attr, v); };
    set('meta[name="description"]', 'content', desc || C.store.description);
    set('meta[property="og:title"]', 'content', document.title);
    set('meta[property="og:description"]', 'content', desc || C.store.description);
    var ld = U.$('#ld'); if (ld) ld.remove();
  };
  ui.ld = function (obj) { var s = document.createElement('script'); s.type = 'application/ld+json'; s.id = 'ld'; s.textContent = JSON.stringify(obj); document.head.appendChild(s); };
})();
