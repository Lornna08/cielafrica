/* APEX MOTION — bag, checkout, confirmation, account, wishlist, brands, journal, gallery, info pages, boot */
(function () {
  var A = APEX, C = A.config, U = A.u, db = A.db, ui = A.ui, i = U.i, esc = U.esc, H = A.href;
  var main = function () { return U.$('#main'); };
  var demoNote = function (t) { return '<div class="demo-note">' + i('info', 18) + '<span>' + t + '</span></div>'; };
  var page = function (title, crumbs, lead, body) {
    return '<div class="view"><header class="ph"><div class="wrap">' + ui.crumbs(crumbs) + '<h1>' + esc(title) + '</h1>' + (lead ? '<p>' + lead + '</p>' : '') + '</div></header><div class="wrap">' + body + '</div></div>';
  };

  /* ---------- bag ---------- */
  A.route('/cart', function () {
    var draw = function () {
      var lines = db.lines(), t = db.totals();
      main().innerHTML = page('Your bag', [['Bag']], lines.length ? db.count() + ' item' + (db.count() === 1 ? '' : 's') : '', lines.length ?
        '<div class="cart-page"><div><div id="lines">' + lines.map(function (x) { return ui.lineHtml(x); }).join('') + '</div><a class="link" style="margin-top:18px" href="' + H('shop') + '">' + i('arrowL', 16) + ' Continue shopping</a></div>' +
        '<aside class="panel"><h3>Summary</h3>' + ui.shipBar(t) +
          '<form class="code" id="codef" style="margin:16px 0"><label class="sr" for="codein">Discount code</label><input id="codein" placeholder="Discount code" value="' + esc(t.code ? t.code.code : '') + '"><button class="btn btn--line btn--sm">' + (t.code ? 'Remove' : 'Apply') + '</button></form>' +
          '<p class="muted" style="font-size:12px;margin:-8px 0 14px">Demo codes: APEX10 (10% off), TRACKDAY ($25 off over $200)</p>' +
          '<div class="sum"><div><span>Subtotal</span><b class="num">' + U.money(t.sub) + '</b></div>' + (t.disc ? '<div class="disc"><span>Discount · ' + t.code.code + '</span><b class="num">−' + U.money(t.disc) + '</b></div>' : '') + (t.note ? '<div class="muted" style="font-size:12.5px">' + esc(t.note) + '</div>' : '') +
          '<div><span>Estimated shipping</span><b class="num">' + (t.ship ? U.money(t.ship) : 'Free') + '</b></div><div class="tot"><span>Total</span><b class="num">' + U.money(t.total) + '</b></div></div>' +
          '<a class="btn btn--ink btn--block" style="margin-top:18px" href="' + H('checkout') + '">Checkout</a><p class="muted" style="font-size:12px;margin-top:10px;text-align:center">Standard shipping estimated · change it at checkout</p></aside></div>'
        : '<div class="empty" style="margin-bottom:90px"><h3>Your bag is empty</h3><p>Start with wheels, tyres or a performance upgrade.</p><a class="btn btn--ink" href="' + H('shop') + '">Shop the catalogue</a></div>');
      ui.bindLines(main(), draw);
      var cf = U.$('#codef'); if (cf) cf.onsubmit = function (e) {
        e.preventDefault(); if (db.totals().code) { db.clearCode(); draw(); return; }
        var r = db.applyCode(U.$('#codein').value); if (!r.ok) ui.toast(esc(r.msg)); else ui.toast(i('check', 16) + ' ' + esc(r.d.label)); draw();
      };
    };
    draw(); ui.setNav('', false); ui.meta('Your bag');
  });

  /* ---------- checkout ---------- */
  A.route('/checkout', function () {
    if (!db.count()) { A.go('cart', true); return; }
    var acc = db.state().account, addr = db.state().addresses[0] || {};
    var st = { ship: 'standard', pay: 'card' };
    var fld = function (id, label, val, type, full, auto, extra) { return '<div class="fld' + (full ? ' full' : '') + '"><label for="' + id + '">' + label + '</label><input id="' + id + '" name="' + id + '" type="' + (type || 'text') + '" value="' + esc(val || '') + '"' + (auto ? ' autocomplete="' + auto + '"' : '') + (extra || '') + '><div class="em">' + (type === 'email' ? 'Enter a valid email address' : 'This field is required') + '</div></div>'; };
    main().innerHTML = page('Checkout', [['Bag', 'cart'], ['Checkout']], '', '<div style="margin-bottom:18px">' + demoNote('<b>Demo checkout.</b> No payment is taken and no card details are collected. Placing an order creates a sample order stored only in this browser.') + '</div>' +
      '<form class="co" id="cof" novalidate><div>' +
        '<div class="co__step"><h3><i>1</i>Contact</h3><div class="fgrid">' + fld('name', 'Full name', acc && acc.name, 'text', true, 'name') + fld('email', 'Email', acc && acc.email, 'email', false, 'email') + fld('phone', 'Phone', '', 'tel', false, 'tel') + '</div></div>' +
        '<div class="co__step"><h3><i>2</i>Delivery address</h3><div class="fgrid">' + fld('line1', 'Address', addr.line1, 'text', true, 'address-line1') + fld('city', 'City', addr.city, 'text', false, 'address-level2') + fld('postcode', 'Postcode', addr.postcode, 'text', false, 'postal-code') +
          '<div class="fld full"><label for="country">Country</label><select id="country" name="country" autocomplete="country-name">' + ['Kenya', 'United Kingdom', 'United States', 'South Africa', 'United Arab Emirates', 'Germany', 'Other'].map(function (c) { return '<option' + (addr.country === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></div></div></div>' +
        '<div class="co__step"><h3><i>3</i>Shipping method</h3><div class="radio-c" id="shipc"></div></div>' +
        '<div class="co__step"><h3><i>4</i>Payment</h3><div class="radio-c">' +
          [['card', 'Card (demo)', 'No card details are requested in this demo'], ['paypal', 'PayPal (demo)', 'Simulated — you won\'t be redirected'], ['cod', 'Pay on collection or delivery', 'Settle when your parts arrive']].map(function (m, k) { return '<label class="rc"><input type="radio" name="pay" value="' + m[0] + '"' + (k ? '' : ' checked') + '><div><b>' + m[1] + '</b><span>' + m[2] + '</span></div></label>'; }).join('') +
          '</div><p class="muted" style="font-size:12px;margin-top:12px">' + i('lock', 13, ' style="display:inline;vertical-align:-2px"') + ' A production store connects a payment provider here. Nothing is charged in this demo.</p></div>' +
      '</div><aside><div class="panel" style="position:sticky;top:calc(var(--head) + 16px)"><h3>Order summary</h3><div id="cosum"></div><button class="btn btn--acc btn--block" style="margin-top:16px;height:52px" id="place">Place demo order</button><p class="muted" style="font-size:11.5px;margin-top:10px;text-align:center">By placing this demo order you agree to the sample <a href="' + H('info/terms') + '" style="text-decoration:underline">terms</a>.</p></div></aside></form>');
    var drawShip = function () {
      var t = db.totals(st.ship);
      U.$('#shipc').innerHTML = C.shipping.methods.map(function (m) {
        var price = m.id === 'standard' && t.sub - t.disc >= C.shipping.freeOver ? 0 : m.price;
        return '<label class="rc"><input type="radio" name="ship" value="' + m.id + '"' + (m.id === st.ship ? ' checked' : '') + '><div><b>' + esc(m.name) + '</b><span>' + esc(m.eta) + '</span></div><em class="num">' + (price ? U.money(price) : 'Free') + '</em></label>';
      }).join('');
      U.$('#cosum').innerHTML = db.lines().map(function (x) { return '<div class="mini"><div class="mini__q"><img src="' + x.p.image + '" alt=""><span>' + x.l.qty + '</span></div><div><b>' + esc(x.p.name) + '</b><small>' + esc([x.l.size, x.l.finish].filter(Boolean).join(' · ')) + '</small></div><b class="num" style="font-size:13px">' + U.money(x.total) + '</b></div>'; }).join('') +
        '<div class="sum" style="margin-top:12px;border-top:1px solid var(--line);padding-top:12px"><div><span>Subtotal</span><b class="num">' + U.money(t.sub) + '</b></div>' + (t.disc ? '<div class="disc"><span>Discount · ' + t.code.code + '</span><b class="num">−' + U.money(t.disc) + '</b></div>' : '') + '<div><span>Shipping · ' + esc(t.method.name) + '</span><b class="num">' + (t.ship ? U.money(t.ship) : 'Free') + '</b></div><div class="tot"><span>Total</span><b class="num">' + U.money(t.total) + '</b></div></div>';
    };
    drawShip();
    U.$('#shipc').onchange = function (e) { st.ship = e.target.value; drawShip(); };
    U.$('#cof').onsubmit = function (e) {
      e.preventDefault(); var f = e.target, bad = null;
      ['name', 'email', 'phone', 'line1', 'city', 'postcode'].forEach(function (k) {
        var el = f[k], v = el.value.trim(), ok = v.length > 1 && (k !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) && (k !== 'phone' || /^[+\d][\d\s()-]{6,}$/.test(v));
        el.parentNode.classList.toggle('err', !ok); el.setAttribute('aria-invalid', !ok); if (!ok && !bad) bad = el;
      });
      if (bad) { bad.focus(); ui.toast('Please complete the highlighted fields'); return; }
      var pay = f.querySelector('input[name=pay]:checked').value;
      var r = db.placeOrder({ ship: st.ship, pay: { card: 'Card (demo)', paypal: 'PayPal (demo)', cod: 'Pay on delivery' }[pay], name: f.name.value.trim(), email: f.email.value.trim(), phone: f.phone.value.trim(),
        address: { line1: f.line1.value.trim(), city: f.city.value.trim(), postcode: f.postcode.value.trim(), country: f.country.value } });
      if (!r.ok) { ui.toast(esc(r.msg)); return; }
      A.go('order/' + r.order.id, true); scrollTo(0, 0);
    };
    U.$('#place').onclick = function () {};
    ui.setNav('', false); ui.meta('Checkout');
  });

  /* ---------- confirmation ---------- */
  A.route('/order/:id', function (p) {
    var o = db.order(p.id); if (!o) return A.notFound();
    main().innerHTML = '<div class="view"><div class="wrap"><div class="conf"><div class="conf__ic">' + i('check', 32) + '</div><span class="kicker">Demo order ' + esc(o.id) + '</span><h1 style="margin-top:10px">Order<br>confirmed</h1>' +
      '<p style="color:var(--soft);margin-top:14px">Thanks, ' + esc(o.contact.name.split(' ')[0]) + '. This is a <b>simulated order</b>: no payment was taken and no email was sent. It\'s saved in this browser under your demo account\'s order history.</p>' +
      '<div class="panel"><div class="fgrid" style="margin-bottom:16px;font-size:13.5px"><div><b>Delivery to</b><br>' + esc(o.address.line1) + '<br>' + esc(o.address.city + ' ' + o.address.postcode) + '<br>' + esc(o.address.country) + '</div><div><b>Shipping</b><br>' + esc(o.method) + '<br><br><b>Payment</b><br>' + esc(o.pay) + '</div></div>' +
        o.lines.map(function (l) { var pr = A.byId[l.id]; return '<div class="mini"><div class="mini__q"><img src="' + pr.image + '" alt=""><span>' + l.qty + '</span></div><div><b>' + esc(l.name) + '</b><small>' + esc([l.size, l.finish].filter(Boolean).join(' · ')) + '</small></div><b class="num" style="font-size:13px">' + U.money(l.price * l.qty) + '</b></div>'; }).join('') +
        '<div class="sum" style="margin-top:12px;border-top:1px solid var(--line);padding-top:12px"><div><span>Subtotal</span><b class="num">' + U.money(o.sub) + '</b></div>' + (o.disc ? '<div class="disc"><span>Discount · ' + o.code + '</span><b class="num">−' + U.money(o.disc) + '</b></div>' : '') + '<div><span>Shipping</span><b class="num">' + (o.ship ? U.money(o.ship) : 'Free') + '</b></div><div class="tot"><span>Total</span><b class="num">' + U.money(o.total) + '</b></div></div></div>' +
      '<div style="display:flex;gap:10px;justify-content:center;margin-top:24px;flex-wrap:wrap"><a class="btn btn--ink" href="' + H('shop') + '">Keep shopping</a><a class="btn btn--line" href="' + H('account/orders') + '">View order history</a></div></div></div></div>';
    ui.setNav('', false); ui.meta('Order ' + o.id);
  });

  /* ---------- account (browser-only demo) ---------- */
  var acctView = function (tab) {
    var s = db.state(), acc = s.account;
    var nav = [['account', 'Overview'], ['account/orders', 'Orders'], ['account/addresses', 'Addresses'], ['wishlist', 'Wishlist']];
    var body;
    if (!acc) {
      body = '<div class="acct" style="grid-template-columns:1fr"><div style="max-width:520px">' + demoNote('<b>Demo account.</b> Signing in here only saves a name and email in this browser. No real account is created and no password is used.') +
        '<form class="panel" id="signin" style="margin-top:16px" novalidate><h3>Sign in or create an account</h3><div class="fgrid"><div class="fld full"><label for="an">Name</label><input id="an" autocomplete="name"><div class="em">Enter your name</div></div><div class="fld full"><label for="ae">Email</label><input id="ae" type="email" autocomplete="email"><div class="em">Enter a valid email address</div></div></div>' +
        '<button class="btn btn--ink btn--block" style="margin-top:16px">Continue to demo account</button></form>' +
        (s.orders.length ? '<p class="muted" style="font-size:13px;margin-top:14px">You have ' + s.orders.length + ' demo order' + (s.orders.length > 1 ? 's' : '') + ' in this browser. Sign in to see them.</p>' : '') + '</div></div>';
    } else {
      var content = '';
      if (tab === 'orders') content = '<div class="panel"><h3>Order history</h3>' + (s.orders.length ? '<div style="overflow-x:auto"><table class="otable"><thead><tr><th>Order</th><th>Date</th><th>Items</th><th>Status</th><th>Total</th></tr></thead><tbody>' + s.orders.map(function (o) { return '<tr><td><a href="' + H('order/' + o.id) + '" style="font-weight:600;text-decoration:underline">' + esc(o.id) + '</a></td><td>' + U.date(o.date.slice(0, 10)) + '</td><td>' + o.lines.reduce(function (a, l) { return a + l.qty; }, 0) + '</td><td><span class="status">' + esc(o.status) + '</span></td><td class="num">' + U.money(o.total) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<p class="muted">No demo orders yet. <a href="' + H('shop') + '" style="text-decoration:underline">Start shopping</a>.</p>') + '</div>';
      else if (tab === 'addresses') content = '<div class="panel"><h3>Saved addresses</h3>' + (s.addresses.length ? s.addresses.map(function (a) { return '<div style="display:flex;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid var(--line);font-size:14px"><span>' + i('pin', 16, ' style="display:inline;vertical-align:-3px"') + ' ' + esc([a.line1, a.city, a.postcode, a.country].join(', ')) + '</span><button class="ci__x" data-rmaddr="' + a.id + '">Remove</button></div>'; }).join('') : '<p class="muted" style="font-size:14px">No saved addresses.</p>') +
        '<form id="addrf" style="margin-top:18px" novalidate><div class="fgrid"><div class="fld full"><label for="l1">Address</label><input id="l1"><div class="em">Required</div></div><div class="fld"><label for="ct">City</label><input id="ct"><div class="em">Required</div></div><div class="fld"><label for="pc">Postcode</label><input id="pc"><div class="em">Required</div></div><div class="fld full"><label for="co">Country</label><input id="co" value="Kenya"></div></div><button class="btn btn--line" style="margin-top:14px">Save address</button></form></div>';
      else content = '<div class="panel"><h3>Hello, ' + esc(acc.name.split(' ')[0]) + '</h3><p style="font-size:14px;color:var(--soft)">' + esc(acc.email) + ' · demo account since ' + U.date(acc.since) + '</p>' +
        '<div class="fgrid" style="margin-top:18px"><a class="perk" href="' + H('account/orders') + '">' + i('bag', 20) + '<div><b>' + s.orders.length + ' orders</b>View history</div></a><a class="perk" href="' + H('wishlist') + '">' + i('heart', 20) + '<div><b>' + s.wish.length + ' saved</b>Your wishlist</div></a><a class="perk" href="' + H('account/addresses') + '">' + i('pin', 20) + '<div><b>' + s.addresses.length + ' addresses</b>Manage</div></a><div class="perk">' + i('car', 20) + '<div><b>My vehicle</b>' + (db.vehicle() ? esc(db.vehicle().make + ' ' + db.vehicle().model) : 'Not set — choose one in the shop') + '</div></div></div>' +
        '<div style="display:flex;gap:10px;margin-top:18px;flex-wrap:wrap"><button class="btn btn--line btn--sm" id="signout">Sign out</button><button class="btn btn--line btn--sm" id="reset2">' + i('reset', 15) + ' Reset demo data</button></div></div>' + '<div style="margin-top:14px">' + demoNote('This account exists only in this browser. A production store would connect real authentication here.') + '</div>';
      body = '<div class="acct"><nav class="acct__nav" aria-label="Account">' + nav.map(function (n) { var on = (tab ? 'account/' + tab : 'account') === n[0]; return '<a href="' + H(n[0]) + '" class="' + (on ? 'on' : '') + '">' + n[1] + '</a>'; }).join('') + '</nav><div>' + content + '</div></div>';
    }
    main().innerHTML = page(acc ? 'Account' : 'Sign in', [['Account']], '', body);
    var si = U.$('#signin'); if (si) si.onsubmit = function (e) {
      e.preventDefault(); var n = U.$('#an'), em = U.$('#ae'); var okN = n.value.trim().length > 1, okE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em.value.trim());
      n.parentNode.classList.toggle('err', !okN); em.parentNode.classList.toggle('err', !okE); if (!okN || !okE) return;
      db.signIn(n.value.trim(), em.value.trim()); ui.toast('Signed in to your demo account'); acctView(tab);
    };
    if (U.$('#signout')) U.$('#signout').onclick = function () { db.signOut(); ui.toast('Signed out'); acctView(); };
    if (U.$('#reset2')) U.$('#reset2').onclick = function () { if (confirm('Reset all demo data in this browser?')) { db.reset(); ui.toast('Demo reset'); acctView(); } };
    var af = U.$('#addrf'); if (af) af.onsubmit = function (e) {
      e.preventDefault(); var ok = true; ['l1', 'ct', 'pc'].forEach(function (k) { var el = U.$('#' + k), g = el.value.trim().length > 1; el.parentNode.classList.toggle('err', !g); ok = ok && g; }); if (!ok) return;
      db.addAddress({ line1: U.$('#l1').value.trim(), city: U.$('#ct').value.trim(), postcode: U.$('#pc').value.trim(), country: U.$('#co').value.trim() }); ui.toast('Address saved'); acctView('addresses');
    };
    U.$$('[data-rmaddr]').forEach(function (b) { b.onclick = function () { db.removeAddress(b.getAttribute('data-rmaddr')); acctView('addresses'); }; });
    ui.setNav('', false); ui.meta('Account');
  };
  A.route('/account', function () { acctView(); });
  A.route('/account/:tab', function (p) { acctView(p.tab); });

  /* ---------- wishlist ---------- */
  A.route('/wishlist', function () {
    var ps = db.state().wish.map(function (id) { return A.byId[id]; }).filter(Boolean);
    main().innerHTML = page('Wishlist', [['Wishlist']], ps.length ? ps.length + ' saved part' + (ps.length > 1 ? 's' : '') + ' · stored in this browser' : '', ps.length ? '<div class="pgrid" style="padding-bottom:90px">' + ps.map(ui.card).join('') + '</div>' : '<div class="empty" style="margin-bottom:90px"><h3>Nothing saved yet</h3><p>Tap the heart on any part to keep it here for later.</p><a class="btn btn--ink" href="' + H('shop') + '">Browse the catalogue</a></div>');
    ui.setNav('', false); ui.meta('Wishlist');
  });

  /* ---------- brands ---------- */
  A.route('/brands', function () {
    main().innerHTML = page('Brands', [['Brands']], 'The makers we stock. All brands in this demo store are fictional.', '<div class="brand-grid">' + A.brands.map(function (b) { var n = A.products.filter(function (p) { return p.brand === b.id; }).length; return '<a class="bc" id="' + b.id + '" href="' + H('shop?brand=' + b.id) + '"><span class="bc__mono">' + esc(b.name.charAt(0)) + '</span><h3>' + esc(b.name) + '</h3><small>' + esc(b.origin) + ' · ' + n + ' product' + (n > 1 ? 's' : '') + '</small><p>' + esc(b.blurb) + '</p><span class="link">Shop ' + esc(b.name) + ' ' + i('arrow', 15) + '</span></a>'; }).join('') + '</div>');
    ui.setNav('brands', false); ui.meta('Brands');
  });

  /* ---------- journal ---------- */
  A.route('/journal', function () {
    main().innerHTML = page('Journal', [['Journal']], 'Guides and build stories from the bench. General guidance only — always follow the specifications for your vehicle.', '<div class="jgrid" style="padding-bottom:90px">' + A.articles.map(function (a, k) { return ui.article(a, k === 0 ? 'jc--lead' : ''); }).join('') + '</div>');
    ui.setNav('journal', false); ui.reveal(main()); ui.meta('Journal');
  });
  A.route('/journal/:slug', function (p) {
    var a = A.articles.filter(function (x) { return x.slug === p.slug; })[0]; if (!a) return A.notFound();
    var body = a.body.map(function (b) { if (b.indexOf('## ') === 0) return '<h2>' + esc(b.slice(3)) + '</h2>'; if (b.indexOf('> ') === 0) return '<blockquote>' + esc(b.slice(2)) + '</blockquote>'; return '<p>' + esc(b) + '</p>'; }).join('');
    var more = A.articles.filter(function (x) { return x.slug !== a.slug; }).slice(0, 3);
    var rel = A.products.filter(function (x) { return x.category === ({ Wheels: 'wheels', Tyres: 'tyres', Brakes: 'brakes' }[a.cat] || 'suspension'); }).slice(0, 4);
    main().innerHTML = '<div class="view"><article class="wrap"><header class="ph" style="text-align:center;max-width:860px;margin:0 auto">' + ui.crumbs([['Journal', 'journal'], [a.title]]).replace('class="crumbs"', 'class="crumbs" style="justify-content:center"') +
      '<div class="jc__meta" style="justify-content:center;margin-top:18px"><span>' + U.date(a.date) + '</span><b>' + esc(a.cat) + '</b><span>' + a.read + ' min read</span></div><h1>' + esc(a.title) + '</h1><p style="margin:14px auto 0">' + esc(a.excerpt) + '</p></header>' +
      '<div class="art-hero"><img src="' + a.image + '" alt=""></div><div class="prose">' + body + '<p class="muted" style="font-size:13px;border-top:1px solid var(--line);padding-top:16px">Editorial guidance for general information. It isn\'t vehicle-specific advice; follow the vehicle and parts manufacturer\'s instructions and consult a qualified technician for safety-critical work.</p></div></article>' +
      '<section class="wrap sec" style="padding-bottom:30px"><div class="rail-h"><h3>Shop the story</h3></div><div class="pgrid">' + rel.map(ui.card).join('') + '</div></section>' +
      '<section class="wrap" style="padding-bottom:90px"><div class="rail-h"><h3>More from the bench</h3></div><div class="jgrid jgrid--3">' + more.map(function (x) { return ui.article(x); }).join('') + '</div></section></div>';
    ui.setNav('journal', false); ui.reveal(main()); ui.meta(a.title, a.excerpt);
    ui.ld({ '@context': 'https://schema.org', '@type': 'Article', headline: a.title, datePublished: a.date, description: a.excerpt });
  });

  /* ---------- gallery ---------- */
  A.route('/gallery', function () {
    main().innerHTML = page('Gallery', [['Gallery']], 'Builds, details and late nights in the workshop.', '<div class="masonry" style="padding-bottom:90px">' + A.gallery.map(function (g) { return '<figure class="' + g.h + '" data-rv><img src="' + g.img + '" alt="' + esc(g.alt) + '" loading="lazy"></figure>'; }).join('') + '</div>');
    ui.setNav('gallery', false); ui.reveal(main()); ui.meta('Gallery');
  });

  /* ---------- info pages ---------- */
  var ct = C.contact;
  var INFO = {
    shipping: ['Shipping', '<p>We ship from the workshop on working days. Most in-stock orders leave within 48 hours.</p>' + C.shipping.methods.map(function (m) { return '<p><b>' + esc(m.name) + '</b> — ' + (m.price ? U.money(m.price) : 'Free') + '. ' + esc(m.eta) + '.</p>'; }).join('') + '<p>Standard delivery is free on orders over ' + U.money(C.shipping.freeOver) + ' after discounts. ' + esc(C.shipping.heavyItemNote) + '</p><blockquote>Demo store: delivery rules are sample values you can change in the store configuration.</blockquote>'],
    delivery: ['Delivery information', '<p>Track your demo orders under <a href="' + H('account/orders') + '">Account → Orders</a>.</p><p>Wheels and tyres are packed in protective boxes; sets of four travel on a pallet service and need a signature on delivery.</p><p>' + esc(C.shipping.heavyItemNote) + '</p>'],
    returns: ['Returns', '<p>' + esc(C.policies.returns) + '</p><p>To start a return, contact us with your order number. Refunds go back to the original payment method once the item is inspected.</p><h2>Warranty</h2><p>' + esc(C.policies.warranty) + '</p>'],
    fitment: ['Fitment support', '<p>' + esc(C.policies.fitment) + '</p><h2>What we need</h2><p>Your vehicle make, model, year and trim; current wheel and tyre sizes; and any brake or suspension upgrades. Photos of the brakes help when checking clearance.</p><h2>Our fitment data</h2><p>The vehicle finder in this demo uses a small sample dataset. A match is a starting point, not a guarantee — we confirm every wheel and brake order before dispatch.</p><p>Read our guides to <a href="' + H('journal/choosing-the-right-wheel-fitment') + '">wheel fitment</a> and <a href="' + H('journal/understanding-wheel-offset') + '">offset</a>.</p>'],
    faq: ['FAQs', '<div class="faq">' + [['Are the products and prices real?', 'No. This is a demonstration store for a Ciel Africa template. Brands, products, prices, ratings and reviews are sample data.'], ['Will I be charged if I place an order?', 'No. Checkout is simulated: no payment is taken and no card details are requested.'], ['How do you check fitment?', 'In a production store our team checks every wheel and brake order against your vehicle before dispatch. The finder in this demo uses sample data.'], ['Do wheels come with hub-centric rings?', 'Where the wheel\'s centre bore is larger than the hub, rings are included for common sizes.'], ['Can I collect from the workshop?', 'Yes — choose "Collect from the workshop" at checkout.'], ['How do I reset the demo?', 'Use "Reset demo" in the footer or on your account page. It clears your bag, wishlist, demo account and demo orders in this browser.']].map(function (q) { return '<details><summary>' + esc(q[0]) + '</summary><p>' + esc(q[1]) + '</p></details>'; }).join('') + '</div>'],
    contact: ['Contact', '<p>Talk to people who fit parts for a living.</p><p><b>Email</b> — ' + esc(ct.email) + '<br><b>Phone</b> — ' + esc(ct.phone) + '<br><b>Hours</b> — ' + esc(ct.hours) + '<br><b>Workshop</b> — ' + esc(ct.address.join(', ')) + '</p><blockquote>These are sample contact details for the demo store.</blockquote>' +
      '<form id="contf" class="panel" style="margin-top:20px" novalidate><div class="fgrid"><div class="fld"><label for="cn">Name</label><input id="cn"><div class="em">Required</div></div><div class="fld"><label for="cem">Email</label><input id="cem" type="email"><div class="em">Enter a valid email</div></div><div class="fld full"><label for="cm">Message</label><textarea id="cm"></textarea><div class="em">Required</div></div></div><button class="btn btn--ink" style="margin-top:14px">Send message</button><p id="contmsg" class="muted" style="font-size:13px;margin-top:10px"></p></form>'],
    about: ['About', '<p>' + esc(C.store.name) + ' is a demonstration storefront built by Ciel Africa: a premium automotive e-commerce template with a working catalogue, fitment finder, bag, wishlist, demo checkout and journal.</p><p>Everything brand-specific — name, colours, fonts, currency, shipping rules, banners and policies — is set in one configuration file, and the catalogue lives in a separate data file, so the template can be adapted for another retailer quickly.</p><p><a href="https://cielafrica.com/templates" target="_blank" rel="noopener">See it on Ciel Africa</a>.</p>'],
    privacy: ['Privacy policy', '<p>This demo stores your bag, wishlist, demo account, addresses and demo orders in your browser\'s local storage only. Nothing is sent to a server, and no analytics or advertising trackers are used by the demo.</p><p>Clear it at any time with "Reset demo" or by clearing your browser\'s site data.</p><blockquote>A production store replaces this page with its own privacy policy.</blockquote>'],
    terms: ['Terms and conditions', '<p>This website is a demonstration. Products, prices, availability and orders are simulated and no contract of sale is formed.</p><p>Product photography is from Unsplash, used under the Unsplash License. Brands shown are fictional.</p><blockquote>A production store replaces this page with its own terms of sale.</blockquote>']
  };
  A.route('/info/:page', function (p) {
    var d = INFO[p.page]; if (!d) return A.notFound();
    main().innerHTML = page(d[0], [['Help'], [d[0]]], '', '<div class="info"><aside><nav class="acct__nav">' + Object.keys(INFO).map(function (k) { return '<a href="' + H('info/' + k) + '" class="' + (k === p.page ? 'on' : '') + '">' + INFO[k][0] + '</a>'; }).join('') + '</nav></aside><div class="prose" style="margin:0">' + d[1] + '</div></div>');
    var cf = U.$('#contf'); if (cf) cf.onsubmit = function (e) {
      e.preventDefault(); var ok = true; [['cn', 1], ['cem', 2], ['cm', 1]].forEach(function (x) { var el = U.$('#' + x[0]), v = el.value.trim(), g = x[1] === 2 ? /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) : v.length > 1; el.parentNode.classList.toggle('err', !g); ok = ok && g; });
      if (ok) { cf.reset(); U.$('#contmsg').textContent = 'Thanks. In this demo, messages are not sent anywhere.'; }
    };
    ui.setNav('', false); ui.meta(d[0]);
  });

  /* ---------- 404 ---------- */
  A.notFound = function () {
    main().innerHTML = '<div class="view"><div class="wrap"><div class="empty" style="margin:60px 0 90px"><span class="kicker">404</span><h1 style="font-family:var(--fd);font-weight:800;text-transform:uppercase;font-size:56px;line-height:.95;margin:8px 0 10px">Wrong turn</h1><p>We couldn\'t find that page. It may have moved.</p><a class="btn btn--ink" href="' + H('') + '">Back to the start</a> <a class="btn btn--line" href="' + H('shop') + '">Shop the catalogue</a></div></div></div>';
    ui.setNav('', false); ui.meta('Page not found');
  };

  /* ---------- boot ---------- */
  var render = A.render;
  A.render = function () {
    A.cleanup(); ui.closeAll(true); render();
    if (!/^#/.test(location.hash) || location.hash.indexOf('#/') === 0) scrollTo(0, 0);
    U.$('#main').focus({ preventScroll: true });
  };
  ui.shell();
  A.render();
})();
