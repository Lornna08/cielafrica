/* ==========================================================================
   MOKARA — shop, product page, cart, checkout, order confirmation, credits
   ========================================================================== */
(function () {
  'use strict';
  var M = window.MOKARA, C = M.config, U = M.u, db = M.db, esc = U.esc, P = M.products;
  var app = function () { return U.$('#app'); };

  /* =============================== shop =============================== */
  var F = {
    roast: [['light', 'Light'], ['medium', 'Medium'], ['dark', 'Dark']],
    flavour: [['fruity', 'Fruity'], ['floral', 'Floral'], ['nutty', 'Nutty'], ['chocolatey', 'Chocolatey'], ['spicy', 'Spicy']],
    method: [['espresso', 'Espresso'], ['filter', 'Filter'], ['pourover', 'Pour-over'], ['press', 'French press'], ['aeropress', 'AeroPress']]
  };
  function band(p) { return p.roastLevel <= 2 ? 'light' : p.roastLevel === 3 ? 'medium' : 'dark'; }
  M.route(/^shop$/, function (m, q) {
    M.setTitle('Shop coffee');
    var st = { roast: q.get('roast') || '', flavour: q.get('flavour') || '', method: q.get('method') || '', sort: q.get('sort') || 'featured' };
    app().innerHTML = '<section class="pg shop"><div class="wrap"><div class="pg__h" data-rv><p class="ey">Shop</p><h1>All coffees</h1><p>Every coffee comes as whole bean or ground to order, in 250 g, 500 g and 1 kg. ' + esc(C.roastDays) + '</p></div>' +
      '<div class="flt" role="group" aria-label="Filter coffees">' + Object.keys(F).map(function (k) { return '<div class="flt__g"><span>' + { roast: 'Roast', flavour: 'Flavour', method: 'Brew method' }[k] + '</span><div class="chips">' + F[k].map(function (o) { return '<button type="button" class="chip chip--sm" data-f="' + k + '" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div></div>'; }).join('') +
      '<label class="flt__s">Sort <select id="sort"><option value="featured">Featured</option><option value="price-asc">Price, low to high</option><option value="price-desc">Price, high to low</option><option value="roast">Lightest roast first</option></select></label></div>' +
      '<p class="flt__n" id="fltN" aria-live="polite"></p><div class="pgrid" id="grid"></div></div></section>';
    var grid = U.$('#grid');
    function sync() {
      U.$$('[data-f]').forEach(function (c) { var on = st[c.dataset.f] === c.dataset.v; c.classList.toggle('on', on); c.setAttribute('aria-pressed', on); });
      U.$('#sort').value = st.sort;
      var list = P.filter(function (p) { return (!st.roast || band(p) === st.roast) && (!st.flavour || p.flavours.indexOf(st.flavour) >= 0) && (!st.method || p.methods.indexOf(st.method) >= 0); });
      var s = { 'price-asc': function (a, b) { return a.price - b.price; }, 'price-desc': function (a, b) { return b.price - a.price; }, roast: function (a, b) { return a.roastLevel - b.roastLevel; } }[st.sort];
      if (s) list = list.slice().sort(s);
      U.$('#fltN').innerHTML = U.plural(list.length, 'coffee') + (st.roast || st.flavour || st.method ? ' · <button type="button" class="lnk" id="clr">Clear filters</button>' : '');
      grid.innerHTML = list.length ? list.map(M.card).join('') : '<div class="empty"><p>No coffee matches all of those. Try removing a filter.</p></div>';
      U.reveal(grid);
      var qs = ['roast', 'flavour', 'method', 'sort'].filter(function (k) { return st[k] && !(k === 'sort' && st[k] === 'featured'); }).map(function (k) { return k + '=' + st[k]; }).join('&');
      if (location.protocol !== 'file:') history.replaceState({}, '', C.store.basePath + 'shop' + (qs ? '?' + qs : ''));
    }
    app().addEventListener('click', function h(e) {
      if (M.current !== 'shop') { app().removeEventListener('click', h); return; }
      var c = e.target.closest('[data-f]'); if (c) { st[c.dataset.f] = st[c.dataset.f] === c.dataset.v ? '' : c.dataset.v; sync(); return; }
      if (e.target.closest('#clr')) { st.roast = st.flavour = st.method = ''; sync(); }
    });
    U.$('#sort').addEventListener('change', function () { st.sort = this.value; sync(); });
    sync();
  });

  /* =============================== product =============================== */
  M.route(/^coffee\/([\w-]+)$/, function (m) {
    var p = M.byId[m[1]]; if (!p) return M.notFound();
    M.setTitle(p.title);
    var o = { size: '250g', format: 'whole', grind: 'filter', qty: 1 }, img = 0;
    var mine = db.myReviews(p.id), all = mine.concat(p.reviews), origin = p.origin && M.originById[p.origin];
    var views = [['hero', p.title + ' with roasted beans'], ['alt', p.title + ', side view'], ['front', p.title + ', front of pack'], ['pile', 'Roasted beans']];
    var gal = function (v, w) { return v === 'pile' ? 'img/p/pile-' + (p.roastLevel <= 2 ? 'light' : p.roastLevel >= 4 ? 'dark' : 'medium') + '-' + (w > 700 ? 1200 : 700) + '.webp' : U.render(p, v, v === 'hero' ? (w > 600 ? 1200 : 600) : (w > 480 ? 900 : 480)); };
    app().innerHTML = '<section class="pd" style="--pbg:' + p.bg + ';--pac:' + p.accent + ';--pink:' + p.ink + '"><div class="wrap"><nav class="crumbs" aria-label="Breadcrumb"><a href="' + M.href('') + '">Home</a><span>/</span><a href="' + M.href('shop') + '">Shop</a><span>/</span><span aria-current="page">' + esc(p.title) + '</span></nav>' +
      '<div class="pd__g"><div class="pd__gal"><div class="pd__main' + (p.dark ? ' dark' : '') + '" id="gMain">' + views.map(function (v, i) { return '<img class="' + (i === 0 ? 'on' : '') + (v[0] === 'pile' ? ' cover' : '') + '" src="' + gal(v[0], 600) + '" srcset="' + gal(v[0], 600) + ' 600w, ' + gal(v[0], 1200) + ' 1200w" sizes="(max-width: 860px) 92vw, 52vw" alt="' + esc(v[1]) + '"' + (i === 0 ? ' fetchpriority="high"' : ' loading="lazy"') + ' decoding="async">'; }).join('') + '</div>' +
        '<div class="pd__thumbs" role="group" aria-label="Product images">' + views.map(function (v, i) { return '<button type="button" class="' + (i === 0 ? 'on' : '') + (p.dark && v[0] !== 'pile' ? ' dark' : '') + '" data-img="' + i + '" aria-label="Show image ' + (i + 1) + ': ' + esc(v[1]) + '" aria-pressed="' + (i === 0) + '"><img src="' + gal(v[0], 400) + '" alt="" loading="lazy"></button>'; }).join('') + '</div></div>' +
      '<div class="pd__info"><p class="pd__kick">N° ' + p.no + ' · ' + (p.blend ? 'House blend' : 'Single origin') + '</p><h1>' + esc(p.title) + '</h1><p class="pd__o">' + esc(p.blend ? p.country : p.region + ', ' + p.country) + ' · ' + esc(p.roast) + '</p>' +
        '<a class="pd__rate" href="#reviews">' + U.stars(p.rating) + '<b>' + p.rating.toFixed(1) + '</b><span>' + all.length + ' sample reviews</span></a>' +
        '<p class="pd__short">' + esc(p.short) + '</p><ul class="notes">' + p.notes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>' +
        '<div class="opt"><span class="opt__l" id="lSize">Size</span><div class="chips" role="radiogroup" aria-labelledby="lSize">' + C.sizes.map(function (s) { return '<button type="button" class="chip" role="radio" data-o="size" data-v="' + s.id + '">' + s.label + '<small>' + U.money(M.priceFor(p, s.id)) + '</small></button>'; }).join('') + '</div></div>' +
        '<div class="opt"><span class="opt__l" id="lFmt">Format</span><div class="chips" role="radiogroup" aria-labelledby="lFmt">' + C.formats.map(function (f) { return '<button type="button" class="chip" role="radio" data-o="format" data-v="' + f.id + '">' + f.label + '</button>'; }).join('') + '</div></div>' +
        '<div class="opt" id="grindRow" hidden><label class="opt__l" for="grind">Grind for</label><select id="grind">' + C.grinds.map(function (g) { return '<option value="' + g.id + '">' + g.label + ' — ' + g.hint + '</option>'; }).join('') + '</select></div>' +
        '<div class="pd__buy"><div class="qty qty--lg"><button type="button" data-qd="-1" aria-label="Fewer">' + U.i('minus', 18) + '</button><span id="qN" aria-live="polite">1</span><button type="button" data-qd="1" aria-label="More">' + U.i('plus', 18) + '</button></div><button type="button" class="btn btn--ac btn--lg" id="pdAdd">Add to cart — <span id="pdP"></span></button></div>' +
        '<ul class="pd__ship"><li>' + U.i('flame', 18) + 'Roasted after you order. ' + esc(C.roastDays) + '</li><li>' + U.i('truck', 18) + 'Free delivery over ' + U.money(C.shipping.freeOver) + '</li></ul></div></div>' +
      '<div class="pd__more"><div class="tabs" role="tablist" aria-label="About this coffee">' + [['about', 'About'], ['taste', 'Tasting notes'], ['origin', 'Origin & process'], ['brew', 'Brewing']].map(function (t, i) { return '<button type="button" role="tab" id="pt-' + t[0] + '" aria-controls="pp-' + t[0] + '" aria-selected="' + (i === 0) + '" tabindex="' + (i === 0 ? 0 : -1) + '">' + t[1] + '</button>'; }).join('') + '</div>' +
        '<div class="tabp" id="pp-about" role="tabpanel" aria-labelledby="pt-about"><p class="lead">' + esc(p.story) + '</p></div>' +
        '<div class="tabp" id="pp-taste" role="tabpanel" aria-labelledby="pt-taste" hidden><div class="prof">' + [['Acidity', p.profile.acidity], ['Body', p.profile.body], ['Sweetness', p.profile.sweetness], ['Roast', p.roastLevel]].map(function (x) { return '<div class="prof__r"><span>' + x[0] + '</span><i>' + [1, 2, 3, 4, 5].map(function (k) { return '<b class="' + (k <= x[1] ? 'on' : '') + '"></b>'; }).join('') + '</i></div>'; }).join('') + '</div><p>In the cup: <b>' + p.notes.map(esc).join(', ') + '</b>.</p></div>' +
        '<div class="tabp" id="pp-origin" role="tabpanel" aria-labelledby="pt-origin" hidden><dl class="facts">' + [['Country', p.country], ['Region', p.region], ['Producer', p.producer], ['Altitude', p.altitude], ['Varietal', p.varietal], ['Process', p.process], ['Harvest', p.harvest]].map(function (f) { return '<div><dt>' + f[0] + '</dt><dd>' + esc(f[1]) + '</dd></div>'; }).join('') + '</dl>' + (origin ? '<div class="pd__og">' + U.photo(origin.id, { alt: 'Coffee country in ' + origin.name, sizes: '(max-width: 760px) 92vw, 40vw', widths: [480, 900] }) + '<p>' + esc(origin.text) + '</p><span class="og__c">' + U.credit(origin.id) + '</span></div>' : '') + '</div>' +
        '<div class="tabp" id="pp-brew" role="tabpanel" aria-labelledby="pt-brew" hidden><div class="brecs">' + M.methods.filter(function (mt) { return (M.methodBest[mt.id] || []).some(function (k) { return p.methods.indexOf(k) >= 0; }); }).map(function (mt) { return '<div class="brec"><h4>' + esc(mt.name) + '</h4><p>' + mt.dose + ' coffee · ' + mt.water + ' · ' + mt.grind.toLowerCase() + ' grind · ' + mt.temp + ' · ' + mt.time + '</p></div>'; }).join('') + '</div><a class="lnk" href="' + M.href('brew') + '">Full brew guides' + U.i('arrow', 16) + '</a></div></div>' +
      '<section class="rv" id="reviews"><div class="rv__h"><h2>Reviews</h2><div class="rv__s"><b>' + p.rating.toFixed(1) + '</b>' + U.stars(p.rating) + '<span>' + all.length + ' sample reviews</span></div></div><p class="muted sm">These reviews are demonstration content for this template, not real customer reviews. Reviews you add are saved only in this browser.</p>' +
        '<ul class="rv__l">' + all.map(function (r) { return '<li><div>' + U.stars(r.r) + '<b>' + esc(r.n) + '</b>' + (r.mine ? '<span class="tag">Your review</span>' : '<span class="tag">Sample</span>') + '</div><p>' + esc(r.t) + '</p></li>'; }).join('') + '</ul>' +
        '<details class="rv__w"><summary>Write a review</summary><form id="rvF" novalidate><fieldset class="rv__stars"><legend>Your rating</legend>' + [5, 4, 3, 2, 1].map(function (k) { return '<input type="radio" name="r" id="rr' + k + '" value="' + k + '"' + (k === 5 ? ' checked' : '') + '><label for="rr' + k + '" title="' + k + ' stars">★</label>'; }).join('') + '</fieldset><label class="fld"><span>Name</span><input name="n" maxlength="40" required autocomplete="given-name"></label><label class="fld"><span>Review</span><textarea name="t" rows="3" maxlength="400" required></textarea></label><button class="btn btn--d" type="submit">Post review</button><p class="err" id="rvE" role="alert"></p></form></details></section>' +
      '<section class="rel"><h2>You may also like</h2><div class="pgrid pgrid--3">' + P.filter(function (x) { return x !== p; }).sort(function (a, b) { return Math.abs(a.roastLevel - p.roastLevel) - Math.abs(b.roastLevel - p.roastLevel); }).slice(0, 3).map(M.card).join('') + '</div></section></div></section>' +
      '<div class="sbar" id="sbar"><span><b>' + esc(p.title) + '</b><small id="sbO"></small></span><button type="button" class="btn btn--ac" id="sbAdd">Add — <span id="sbP"></span></button></div>';
    function upd() {
      U.$$('[data-o]').forEach(function (c) { var on = o[c.dataset.o] === c.dataset.v; c.classList.toggle('on', on); c.setAttribute('aria-checked', on); });
      U.$('#grindRow').hidden = o.format !== 'ground'; U.$('#grind').value = o.grind;
      var price = M.priceFor(p, o.size) * o.qty; U.$('#pdP').textContent = U.money(price); U.$('#sbP').textContent = U.money(price); U.$('#qN').textContent = o.qty;
      U.$('#sbO').textContent = M.optLabel(o) + (o.qty > 1 ? ' · ×' + o.qty : '');
    }
    function add() { var r = db.add(p.id, o); if (r.ok) { U.added(p, r.line); [U.$('#pdAdd'), U.$('#sbAdd')].forEach(function (b) { b.classList.add('ok'); setTimeout(function () { b.classList.remove('ok'); }, 1200); }); } }
    var root = U.$('.pd');
    root.addEventListener('click', function (e) {
      var c = e.target.closest('[data-o]'); if (c) { o[c.dataset.o] = c.dataset.v; upd(); return; }
      var q = e.target.closest('[data-qd]'); if (q) { o.qty = Math.max(1, Math.min(20, o.qty + (+q.dataset.qd))); upd(); return; }
      var g = e.target.closest('[data-img]'); if (g) { img = +g.dataset.img; U.$$('#gMain img').forEach(function (im, i) { im.classList.toggle('on', i === img); }); U.$$('[data-img]').forEach(function (b, i) { b.classList.toggle('on', i === img); b.setAttribute('aria-pressed', i === img); }); U.$('#gMain').classList.toggle('dark', !!p.dark && img < 3); return; }
      if (e.target.closest('#pdAdd')) add();
    });
    U.$('#sbAdd').addEventListener('click', add);
    U.$('#grind').addEventListener('change', function () { o.grind = this.value; upd(); });
    // tabs
    var tabs = U.$$('[role=tab]', U.$('.tabs'));
    function tab(t, focus) { tabs.forEach(function (x) { var on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; U.$('#' + x.getAttribute('aria-controls')).hidden = !on; }); if (focus) t.focus(); }
    U.$('.tabs').addEventListener('click', function (e) { var t = e.target.closest('[role=tab]'); if (t) tab(t); });
    U.$('.tabs').addEventListener('keydown', function (e) { var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return; e.preventDefault(); var i = tabs.indexOf(document.activeElement); tab(tabs[(i + d + tabs.length) % tabs.length], true); });
    // swipe gallery on phones
    var sx = null; U.$('#gMain').addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    U.$('#gMain').addEventListener('touchend', function (e) { if (sx == null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) U.$$('[data-img]')[(img + (dx < 0 ? 1 : -1) + views.length) % views.length].click(); sx = null; });
    // sticky add bar on phones once the main button scrolls away
    if ('IntersectionObserver' in window) { var io = new IntersectionObserver(function (es) { U.$('#sbar').classList.toggle('on', !es[0].isIntersecting && es[0].boundingClientRect.top < 0); }); io.observe(U.$('#pdAdd')); M.onLeave = function () { io.disconnect(); }; }
    // review form
    U.$('#rvF').addEventListener('submit', function (e) {
      e.preventDefault(); var f = e.target, n = f.n.value.trim(), t = f.t.value.trim();
      if (!n || t.length < 3) { U.$('#rvE').textContent = 'Please add your name and a few words.'; return; }
      db.addReview(p.id, { n: n, r: +f.r.value, t: t }); M.render({ keepScroll: true }); setTimeout(function () { var r = document.getElementById('reviews'); if (r) r.scrollIntoView(); }, 30); U.toast('Thanks — your review is saved in this browser.');
    });
    var ld = { '@context': 'https://schema.org', '@type': 'Product', name: p.title, description: p.short, brand: { '@type': 'Brand', name: 'MOKARA' }, image: location.origin + C.store.basePath + U.render(p, 'hero', 1200), offers: { '@type': 'Offer', priceCurrency: C.currency.code, price: p.price, availability: 'https://schema.org/InStock' } };
    var s = document.createElement('script'); s.type = 'application/ld+json'; s.textContent = JSON.stringify(ld); app().appendChild(s);
    upd();
  });

  /* =============================== cart =============================== */
  M.route(/^cart$/, function () {
    M.setTitle('Cart');
    function draw() {
      if (M.current !== 'cart') return;
      var lines = db.lines(), t = db.totals();
      app().innerHTML = '<section class="pg"><div class="wrap wrap--md"><div class="pg__h"><p class="ey">Cart</p><h1>Your cart</h1></div>' + (!lines.length ? '<div class="empty"><p>Your cart is empty.</p><a class="btn btn--d" href="' + M.href('shop') + '">Shop coffee</a></div>' :
        '<div class="cart"><ul class="cl cl--lg" id="cartL">' + lines.map(U.lineHtml).join('') + '</ul><aside class="sum"><h2>Summary</h2><div class="row"><span>Subtotal</span><b>' + U.money(t.sub) + '</b></div>' + (t.disc ? '<div class="row"><span>Discount (' + esc(t.code) + ') <button type="button" class="lnk" id="rmCode">Remove</button></span><b>−' + U.money(t.disc) + '</b></div>' : '') +
        '<form class="code" id="codeF"><label class="sr" for="code">Discount code</label><input id="code" placeholder="Discount code" autocomplete="off"><button class="btn btn--g btn--sm" type="submit">Apply</button></form><p class="muted sm" id="codeM">Template code: FIRSTCUP</p>' +
        '<div class="ship">' + (t.toFree > 0 ? 'Add <b>' + U.money(t.toFree) + '</b> for free delivery' : '<b>Free delivery</b> unlocked') + '<i><b style="width:' + Math.min(100, Math.round((t.sub - t.disc) / C.shipping.freeOver * 100)) + '%"></b></i></div>' +
        '<a class="btn btn--d btn--full btn--lg" href="' + M.href('checkout') + '">Checkout</a></aside></div>') + '</div></section>';
    }
    db.on(draw); draw();
    app().addEventListener('click', function h(e) {
      if (M.current !== 'cart') { app().removeEventListener('click', h); return; }
      var b = e.target.closest('button[data-q]'); if (b) { var l = db.state().cart.filter(function (x) { return x.key === b.dataset.k; })[0]; if (l) db.setQty(l.key, l.qty + (+b.dataset.q)); return; }
      var r = e.target.closest('button[data-rm]'); if (r) { db.remove(r.dataset.rm); return; }
      if (e.target.closest('#rmCode')) db.clearCode();
    });
    app().addEventListener('submit', function h(e) {
      if (M.current !== 'cart') { app().removeEventListener('submit', h); return; }
      if (e.target.id === 'codeF') { e.preventDefault(); var r = db.applyCode(U.$('#code').value); if (!r.ok) U.$('#codeM').textContent = r.msg; else U.toast(esc(r.msg)); }
    });
  });

  /* =============================== checkout =============================== */
  M.route(/^checkout$/, function () {
    M.setTitle('Checkout');
    if (!db.lines().length) { app().innerHTML = '<section class="pg"><div class="wrap wrap--md"><div class="empty"><h1>Your cart is empty</h1><a class="btn btn--d" href="' + M.href('shop') + '">Shop coffee</a></div></div></section>'; return; }
    var st = { method: C.shipping.methods[0].id };
    app().innerHTML = '<section class="pg co"><div class="wrap"><div class="pg__h"><p class="ey">Checkout</p><h1>Almost there</h1></div>' +
      (C.store.demo ? '<p class="note">' + U.i('info', 18) + '<span><b>Template mode.</b> No payment is taken: the M-Pesa prompt is simulated and the order is saved only in this browser.</span></p>' : '') +
      '<div class="co__g"><form class="co__f" id="coF" novalidate>' +
      '<fieldset><legend>Contact</legend><div class="two"><label class="fld"><span>Full name</span><input name="name" autocomplete="name" required></label><label class="fld"><span>Phone (M-Pesa)</span><input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="07XX XXX XXX" required></label></div><label class="fld"><span>Email</span><input name="email" type="email" autocomplete="email" required></label></fieldset>' +
      '<fieldset><legend>Delivery</legend><div class="radios">' + C.shipping.methods.map(function (m, i) { return '<label class="rad"><input type="radio" name="method" value="' + m.id + '"' + (i === 0 ? ' checked' : '') + '><span><b>' + esc(m.name) + '</b><small>' + esc(m.eta) + '</small></span><em>' + (m.price ? U.money(m.price) : 'Free') + '</em></label>'; }).join('') + '</div>' +
      '<div id="addr"><label class="fld"><span>Address</span><input name="line" autocomplete="street-address" placeholder="Building, street, area" required></label><div class="two"><label class="fld"><span>Town / city</span><input name="city" autocomplete="address-level2" required></label><label class="fld"><span>Delivery notes <em>optional</em></span><input name="notes" maxlength="120"></label></div></div></fieldset>' +
      '<fieldset><legend>Payment</legend><label class="rad rad--pay"><input type="radio" name="pay" value="mpesa" checked><span><b>M-Pesa</b><small>You’ll get a prompt on your phone to enter your PIN.</small></span></label>' + (C.payments.card ? '' : '<label class="rad rad--off"><input type="radio" name="pay" value="card" disabled><span><b>Card</b><small>Not available in this template</small></span></label>') + '</fieldset>' +
      '<p class="err" id="coE" role="alert"></p><button class="btn btn--ac btn--lg btn--full" type="submit" id="coPay">' + U.i('lock', 18) + '<span>Pay with M-Pesa</span></button></form>' +
      '<aside class="sum sum--co" id="coSum"></aside></div></div></section>';
    var f = U.$('#coF');
    function sum() {
      var t = db.totals(st.method);
      U.$('#coSum').innerHTML = '<h2>Order summary</h2><ul class="mini">' + db.lines().map(function (x) { return '<li><span class="mini__img" style="background:' + x.p.bg + '"><img src="' + U.render(x.p, 'front', 480) + '" alt=""><i>' + x.l.qty + '</i></span><span><b>' + esc(x.p.title) + '</b><small>' + esc(M.optLabel(x.l)) + '</small></span><b>' + U.money(x.total) + '</b></li>'; }).join('') + '</ul>' +
        '<div class="row"><span>Subtotal</span><b>' + U.money(t.sub) + '</b></div>' + (t.disc ? '<div class="row"><span>Discount</span><b>−' + U.money(t.disc) + '</b></div>' : '') + '<div class="row"><span>Delivery</span><b>' + (t.ship ? U.money(t.ship) : 'Free') + '</b></div><div class="row row--t"><span>Total</span><b>' + U.money(t.total) + '</b></div>';
      U.$('#coPay span').textContent = 'Pay ' + U.money(t.total) + ' with M-Pesa';
    }
    f.addEventListener('change', function (e) { if (e.target.name === 'method') { st.method = e.target.value; U.$('#addr').hidden = st.method === 'pickup'; U.$$('#addr input[required]').forEach(function (i) { i.required = st.method !== 'pickup'; }); sum(); } });
    f.addEventListener('submit', function (e) {
      e.preventDefault(); var bad = U.$$('input[required]', f).filter(function (i) { return !i.closest('[hidden]') && !i.value.trim(); });
      var phone = f.phone.value.replace(/\D/g, ''), email = f.email.value.trim();
      U.$$('input', f).forEach(function (i) { i.removeAttribute('aria-invalid'); });
      if (!/^(?:254|0)?(7|1)\d{8}$/.test(phone)) bad.push(f.phone);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) bad.push(f.email);
      if (bad.length) { bad.forEach(function (i) { i.setAttribute('aria-invalid', 'true'); }); U.$('#coE').textContent = 'Please check the highlighted fields.'; bad[0].focus(); return; }
      U.$('#coE').textContent = '';
      var t = db.totals(st.method), modal = document.createElement('div'); modal.className = 'stk'; modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-label', 'M-Pesa payment');
      modal.innerHTML = '<div class="stk__b"><span class="stk__ic">' + U.i('phone', 28) + '</span><h2>Check your phone</h2><p>We’ve sent an M-Pesa prompt for <b>' + U.money(t.total) + '</b> to <b>' + esc(f.phone.value) + '</b>. Enter your PIN to pay.</p>' + (C.store.demo ? '<p class="muted sm">Template mode: this is simulated and nothing is charged.</p>' : '') + '<div class="spin" aria-hidden="true"></div></div>';
      document.body.appendChild(modal); U.$('#coPay').disabled = true;
      M.pay.mpesa(phone, t.total).then(function (r) {
        modal.remove();
        if (!r.ok) { U.$('#coE').textContent = 'The payment didn’t go through. Please try again.'; U.$('#coPay').disabled = false; return; }
        var order = db.placeOrder({ contact: { name: f.name.value.trim(), phone: f.phone.value.trim(), email: email }, address: st.method === 'pickup' ? null : { line: f.line.value.trim(), city: f.city.value.trim(), notes: f.notes.value.trim() }, method: st.method, receipt: r.receipt });
        M.go('order/' + order.ref, { replace: true });
      });
    });
    sum();
  });

  M.route(/^order\/([\w-]+)$/, function (m) {
    var o = db.order(m[1]); M.setTitle('Order ' + m[1]);
    if (!o) { app().innerHTML = '<section class="pg"><div class="wrap wrap--md"><div class="empty"><h1>Order not found</h1><p>Orders in this template are saved in the browser where they were placed.</p><a class="btn btn--d" href="' + M.href('') + '">Back to the shop</a></div></div></section>'; return; }
    var meth = C.shipping.methods.filter(function (x) { return x.id === o.method; })[0] || {};
    app().innerHTML = '<section class="pg ok"><div class="wrap wrap--md"><div class="ok__h"><span class="ok__ic">' + U.i('check', 30) + '</span><p class="ey">Order ' + esc(o.ref) + '</p><h1>Thank you, ' + esc(o.contact.name.split(' ')[0]) + '.</h1><p>Your coffee goes into the roaster on the next roast day. We’ll text ' + esc(o.contact.phone) + ' when it ships.</p>' + (C.store.demo ? '<p class="note">' + U.i('info', 18) + '<span>Template mode: no payment was taken and this order exists only in this browser.</span></p>' : '') + '</div>' +
      '<div class="sum"><ul class="mini">' + o.lines.map(function (l) { var p = M.byId[l.id]; return '<li><span class="mini__img" style="background:' + (p ? p.bg : '#eee') + '">' + (p ? '<img src="' + U.render(p, 'front', 480) + '" alt="">' : '') + '<i>' + l.qty + '</i></span><span><b>' + esc(l.name) + '</b><small>' + esc(l.opt) + '</small></span><b>' + U.money(l.price * l.qty) + '</b></li>'; }).join('') + '</ul>' +
      '<div class="row"><span>Delivery · ' + esc(meth.name || '') + '</span><b>' + (o.totals.ship ? U.money(o.totals.ship) : 'Free') + '</b></div><div class="row row--t"><span>Total</span><b>' + U.money(o.totals.total) + '</b></div><p class="muted sm">Reference ' + esc(o.receipt) + '</p></div>' +
      '<a class="btn btn--d" href="' + M.href('shop') + '">Continue shopping</a></div></section>';
  });

  /* =============================== credits / 404 =============================== */
  M.route(/^credits$/, function () {
    M.setTitle('Photo credits');
    var seen = {};
    app().innerHTML = '<section class="pg"><div class="wrap wrap--md"><div class="pg__h"><p class="ey">Credits</p><h1>Photo credits</h1><p>Product packshots, beans and the espresso set-up are original 3D renders made for this template. Landscape and brewing photographs are from Unsplash, shown under the Unsplash License. They are placeholders — replace them with your own photography before launch.</p></div><ul class="credits">' +
      Object.keys(M.photos).map(function (k) { var ph = M.photos[k]; if (seen[ph[4]]) return ''; seen[ph[4]] = 1; return '<li><a href="https://unsplash.com/@' + ph[4] + '?utm_source=mokara_template&utm_medium=referral" target="_blank" rel="noopener">' + esc(ph[3]) + '</a></li>'; }).join('') + '</ul></div></section>';
  });
  M.notFound = function () { M.setTitle('Not found'); app().innerHTML = '<section class="pg"><div class="wrap wrap--md"><div class="empty"><h1>This page has gone cold.</h1><p>We couldn’t find what you were looking for.</p><a class="btn btn--d" href="' + M.href('') + '">Back to the shop</a></div></div></section>'; };

  /* boot */
  M.render();
})();
