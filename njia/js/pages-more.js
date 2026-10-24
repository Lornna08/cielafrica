/* ==========================================================================
   NJIA — bag, checkout, order confirmation, account, lookbook, custom made,
   help pages, credits, 404, boot
   ========================================================================== */
(function () {
  var N = window.NJIA, C = N.config, U = N.u, esc = U.esc, i = U.i, E = N.editorial;
  var app = function () { return U.$('#app'); };
  var TPL = C.store.demo;

  function thumb(p, color, w) { var c = p.colors.filter(function (x) { return x.n === color; })[0], k = c ? c.img : 0; return U.img(p.imgs[k] || p.imgs[0], { widths: [200, 360], sizes: (w || 96) + 'px', alt: '', pos: p.pos && p.pos[k] }); }
  function row(label, val, cls) { return '<div class="sum__r' + (cls ? ' ' + cls : '') + '"><span>' + label + '</span><span>' + val + '</span></div>'; }

  /* ================= BAG ================= */
  N.route(/^bag$/, function () {
    N.meta('Your bag');
    function draw() {
      var lines = N.db.lines(), tt = N.db.totals(), n = N.db.count();
      if (!lines.length) {
        app().innerHTML = '<div class="wrap bag"><h1 class="h1">Your bag</h1><div class="empty empty--bag">' + i('bag', 40) + '<p class="h3">Your bag is empty.</p><p>Start with the new arrivals or the pieces people come back for.</p>' +
          '<div class="empty__acts"><a class="btn btn--ink" href="' + N.href('shop/new-in') + '">Shop New In</a><a class="btn btn--line" href="' + N.href('shop/essentials') + '">Everyday essentials</a></div></div></div>';
        return;
      }
      app().innerHTML = '<div class="wrap bag"><div class="bag__head"><h1 class="h1">Your bag</h1><span>' + U.plural(n, 'item') + '</span></div><div class="bag__grid"><div>' +
        '<div class="bag__cols" aria-hidden="true"><span>Product</span><span>Quantity</span><span>Total</span></div><ul class="lines">' + lines.map(function (x) {
          var max = N.db.maxFor(x.l);
          return '<li class="line" data-key="' + x.l.key + '"><a class="line__img" href="' + N.href('product/' + x.p.slug) + '" tabindex="-1" aria-hidden="true">' + thumb(x.p, x.l.color, 110) + '</a>' +
            '<div class="line__info"><a class="line__n" href="' + N.href('product/' + x.p.slug) + '">' + esc(x.p.name) + '</a><span>' + esc(x.l.color) + ' · Size ' + esc(x.l.size) + '</span><span>' + U.money(x.p.price) + (x.p.was ? ' <s>' + U.money(x.p.was) + '</s>' : '') + '</span>' +
            (x.l.qty >= max ? '<span class="warn">Last ' + (max === 1 ? 'one' : max) + ' in this size</span>' : '') + '</div>' +
            '<div class="line__q">' + N.qtyHtml(x.l.qty, max).replace('aria-label="Quantity"', 'aria-label="Quantity for ' + esc(x.p.name) + '"') + '<button type="button" class="link link--sm" data-rm>Remove</button></div>' +
            '<div class="line__t">' + U.money(x.total) + '</div></li>';
        }).join('') + '</ul><a class="link" href="' + N.href('shop/all') + '">' + i('left', 16) + 'Continue shopping</a></div>' +
        '<aside class="sum" aria-label="Order summary"><h2 class="h3">Summary</h2>' +
          row('Subtotal', U.money(tt.sub)) +
          (tt.code ? row('Discount (' + esc(tt.code) + ') <button type="button" class="link link--sm" data-uncode>Remove</button>', '− ' + U.money(tt.disc), 'sum__r--disc') : '') +
          row('Delivery', tt.free ? 'Free' : 'From ' + U.money(C.shipping.methods[0].price)) +
          (tt.toFree > 0 ? '<p class="sum__free">Add ' + U.money(tt.toFree) + ' more for free delivery.<span class="more__bar"><span style="width:' + Math.min(100, (tt.sub - tt.disc) / C.shipping.freeOver * 100) + '%"></span></span></p>' : '') +
          row('Total', U.money(tt.sub - tt.disc), 'sum__r--tot') + '<p class="sum__vat">Prices include VAT. Delivery is calculated at checkout.</p>' +
          (tt.code ? '' : '<form class="code" novalidate><label class="sr" for="code">Discount code</label><input id="code" placeholder="Discount code" autocomplete="off"><button class="btn btn--line btn--sm" type="submit">Apply</button><p class="code__m" role="status"></p></form>') +
          '<a class="btn btn--accent btn--block" href="' + N.href('checkout') + '">Checkout' + i('arrow', 18) + '</a>' +
          '<p class="sum__pay">' + i('lock', 15) + 'Secure checkout · Pay with M-Pesa</p></aside></div></div>';
    }
    draw();
    var root = app();
    root.addEventListener('click', function (e) {
      var li = e.target.closest('[data-key]'), key = li && li.getAttribute('data-key');
      var q = e.target.closest('[data-q]');
      if (q && li) { var inp = U.$('[data-qty]', li); N.db.setQty(key, (+inp.value || 1) + +q.getAttribute('data-q')); refocus(key, q.getAttribute('data-q')); }
      if (e.target.closest('[data-rm]') && li) { var p = N.byId[N.db.state().cart.filter(function (l) { return l.key === key; })[0].id]; N.db.remove(key); draw(); N.toast(p.name + ' removed from your bag.'); var h = U.$('h1', root); h && h.focus && (h.tabIndex = -1, h.focus()); }
      if (e.target.closest('[data-uncode]')) { N.db.clearCode(); draw(); }
    });
    root.addEventListener('change', function (e) { var inp = e.target.closest('[data-qty]'); if (inp) { var key = inp.closest('[data-key]').getAttribute('data-key'); N.db.setQty(key, Math.round(+inp.value) || 1); refocus(key); } });
    root.addEventListener('submit', function (e) {
      if (!e.target.matches('.code')) return; e.preventDefault();
      var r = N.db.applyCode(U.$('#code', root).value);
      if (r.ok) { draw(); N.toast('Code applied: ' + r.msg); } else { var m = U.$('.code__m', root); m.textContent = r.msg; m.className = 'code__m is-err'; }
    });
    function refocus(key, dir) { draw(); var li = U.$('[data-key="' + key + '"]', root); if (li) { var b = dir ? U.$('[data-q="' + dir + '"]', li) : U.$('[data-qty]', li); b && b.focus(); } }
  });

  /* ================= CHECKOUT ================= */
  var PHONE = /^(?:\+?254|0)?\s*([17]\d{2})\s*(\d{3})\s*(\d{3})$/;
  function normPhone(v) { var m = String(v || '').replace(/[\s-]/g, '').match(/^(?:\+?254|0)?([17]\d{8})$/); return m ? '0' + m[1] : null; }
  N.route(/^checkout$/, function () {
    N.meta('Checkout');
    if (!N.db.lines().length) { app().innerHTML = '<div class="wrap bag"><h1 class="h1">Checkout</h1><div class="empty empty--bag">' + i('bag', 40) + '<p class="h3">Your bag is empty.</p><a class="btn btn--ink" href="' + N.href('shop/new-in') + '">Shop New In</a></div></div>'; return; }
    var S = N.db.state(), acc = S.account || {}, ad = S.addresses[0] || {}, method = 'nairobi';
    var f = function (id, label, o) {
      o = o || {};
      return '<div class="fld' + (o.half ? ' fld--h' : '') + '"><label for="' + id + '">' + label + (o.opt ? ' <small>(optional)</small>' : '') + '</label>' +
        (o.select ? '<div class="sel sel--f"><select id="' + id + '" name="' + id + '"' + (o.opt ? '' : ' required') + '>' + o.select + '</select>' + i('down', 16) + '</div>' :
        '<input id="' + id + '" name="' + id + '" type="' + (o.type || 'text') + '"' + (o.ac ? ' autocomplete="' + o.ac + '"' : '') + (o.im ? ' inputmode="' + o.im + '"' : '') + (o.ph ? ' placeholder="' + o.ph + '"' : '') + ' value="' + esc(o.v || '') + '"' + (o.opt ? '' : ' required') + ' aria-describedby="' + id + '-e">') +
        '<p class="fld__e" id="' + id + '-e" hidden></p></div>';
    };
    var counties = N.counties.slice().sort().map(function (c) { return '<option' + (c === (ad.county || 'Nairobi') ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('');
    app().innerHTML = '<div class="wrap cko"><div class="ck__top">' + N.crumbs([['Bag', 'bag'], ['Checkout']]) + '<h1 class="h1">Checkout</h1></div>' +
      (TPL ? '<p class="tplnote">' + i('lock', 16) + '<span><b>Template checkout.</b> No real payment is requested and nothing is charged. Connect your M-Pesa back end to take live orders.</span></p>' : '') +
      '<div class="ck__grid"><form class="ck__form" novalidate>' +
        '<section class="step"><h2 class="step__h"><span>01</span>Contact</h2><div class="fgrid">' +
          f('email', 'Email', { type: 'email', ac: 'email', v: acc.email }) + f('phone', 'Phone', { type: 'tel', ac: 'tel', im: 'tel', ph: '07XX XXX XXX', v: acc.phone, half: true }) +
          '<label class="ck ck--line"><input type="checkbox" id="optin"' + (S.news ? ' checked' : '') + '><span class="ck__b">' + i('check', 13) + '</span>Email me about new drops</label></div></section>' +
        '<section class="step"><h2 class="step__h"><span>02</span>Delivery address</h2>' +
          (S.addresses.length > 1 ? '<div class="saved">' + S.addresses.map(function (a, k) { return '<label class="rad"><input type="radio" name="saved" value="' + a.id + '"' + (k ? '' : ' checked') + '><span class="rad__d"></span><span><b>' + esc(a.first + ' ' + a.last) + '</b><small>' + esc([a.street, a.area, a.town, a.county].filter(Boolean).join(', ')) + '</small></span></label>'; }).join('') + '</div>' : '') +
          '<div class="fgrid">' + f('first', 'First name', { ac: 'given-name', v: ad.first || (acc.name || '').split(' ')[0], half: true }) + f('last', 'Last name', { ac: 'family-name', v: ad.last || (acc.name || '').split(' ').slice(1).join(' '), half: true }) +
          f('street', 'Street, building & house number', { ac: 'address-line1', v: ad.street }) + f('area', 'Estate or area', { ac: 'address-line2', v: ad.area, opt: true, half: true }) +
          f('town', 'Town or city', { ac: 'address-level2', v: ad.town, half: true }) + f('county', 'County', { select: counties, half: true }) +
          f('notes', 'Delivery notes', { opt: true, ph: 'Gate code, landmark, best time to call', v: ad.notes }) + '</div></section>' +
        '<section class="step"><h2 class="step__h"><span>03</span>Delivery method</h2><div class="opts" role="radiogroup" aria-label="Delivery method">' + C.shipping.methods.map(function (m, k) {
          return '<label class="rad rad--card"><input type="radio" name="method" value="' + m.id + '"' + (k ? '' : ' checked') + '><span class="rad__d"></span><span class="rad__t"><b>' + esc(m.name) + '</b><small>' + esc(m.eta) + '</small></span><span class="rad__p" data-mp="' + m.id + '"></span></label>';
        }).join('') + '</div></section>' +
        '<section class="step"><h2 class="step__h"><span>04</span>Payment</h2><div class="opts">' +
          '<label class="rad rad--card rad--pay"><input type="radio" name="pay" value="mpesa" checked><span class="rad__d"></span><span class="rad__t"><b>M-Pesa</b><small>We’ll send a payment prompt to your phone</small></span><span class="mpesa" aria-hidden="true">M-PESA</span></label>' +
          '<div class="fgrid fgrid--pay">' + f('mpesa', 'M-Pesa number', { type: 'tel', im: 'tel', ac: 'tel', ph: '07XX XXX XXX', v: acc.phone }) + '</div>' +
          '<div class="rad rad--card rad--off" aria-disabled="true"><span class="rad__d"></span><span class="rad__t"><b>Card</b><small>Visa or Mastercard</small></span><span class="cards" aria-hidden="true"><i>VISA</i><i>MC</i></span></div>' +
        '</div></section>' +
        '<button class="btn btn--accent btn--block btn--lg" type="submit" data-pay></button>' +
        '<p class="ck__legal">By placing your order you agree to the <a class="link" href="' + N.href('help/terms') + '">terms</a> and <a class="link" href="' + N.href('help/returns') + '">returns policy</a>.</p>' +
      '</form>' +
      '<aside class="sum sum--ck" aria-label="Order summary"><h2 class="h3">Order summary</h2><ul class="mlines">' + N.db.lines().map(function (x) {
        return '<li><span class="mlines__img">' + thumb(x.p, x.l.color, 64) + '<b>' + x.l.qty + '</b></span><span class="mlines__n">' + esc(x.p.name) + '<small>' + esc(x.l.color) + ' · ' + esc(x.l.size) + '</small></span><span>' + U.money(x.total) + '</span></li>';
      }).join('') + '</ul><div data-tot></div><a class="link link--sm" href="' + N.href('bag') + '">Edit bag</a></aside></div></div>';

    var root = app(), form = U.$('.ck__form', root);
    function totals() {
      var tt = N.db.totals(method);
      U.$('[data-tot]', root).innerHTML = row('Subtotal', U.money(tt.sub)) + (tt.code ? row('Discount (' + esc(tt.code) + ')', '− ' + U.money(tt.disc), 'sum__r--disc') : '') +
        row('Delivery', tt.ship ? U.money(tt.ship) : 'Free') + row('Total', U.money(tt.total), 'sum__r--tot') + '<p class="sum__vat">Including VAT</p>';
      C.shipping.methods.forEach(function (m) { U.$('[data-mp="' + m.id + '"]', root).textContent = tt.free || !m.price ? 'Free' : U.money(m.price); });
      U.$('[data-pay]', root).textContent = 'Pay ' + U.money(tt.total) + ' with M-Pesa';
      return tt;
    }
    totals();
    form.addEventListener('change', function (e) {
      if (e.target.name === 'method') { method = e.target.value; totals(); }
      if (e.target.name === 'saved') { var a = S.addresses.filter(function (x) { return x.id === e.target.value; })[0]; if (a) ['first', 'last', 'street', 'area', 'town', 'county', 'notes'].forEach(function (k) { var el = U.$('#' + k, form); if (el && a[k] != null) el.value = a[k]; }); }
    });
    U.$('#phone', form).addEventListener('change', function () { var m = U.$('#mpesa', form); if (!m.value) m.value = this.value; });
    function err(id, msg) { var el = U.$('#' + id, form), e = U.$('#' + id + '-e', form); el.setAttribute('aria-invalid', msg ? 'true' : 'false'); e.textContent = msg || ''; e.hidden = !msg; return !msg; }
    function val(id) { return (U.$('#' + id, form).value || '').trim(); }
    form.addEventListener('input', function (e) { if (e.target.getAttribute('aria-invalid') === 'true') err(e.target.id, ''); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = [
        err('email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val('email')) ? '' : 'Enter a valid email address, like name@example.com.'),
        err('phone', normPhone(val('phone')) ? '' : 'Enter a Kenyan mobile number, like 0712 345 678.'),
        err('first', val('first') ? '' : 'Enter your first name.'), err('last', val('last') ? '' : 'Enter your last name.'),
        err('street', val('street') ? '' : 'Enter the street and building.'), err('town', val('town') ? '' : 'Enter the town or city.'),
        err('mpesa', normPhone(val('mpesa')) ? '' : 'Enter the Safaricom number that will pay, like 0712 345 678.')
      ];
      if (ok.indexOf(false) >= 0) { var first = U.$('[aria-invalid="true"]', form); first.focus(); first.scrollIntoView({ block: 'center', behavior: U.reduce ? 'auto' : 'smooth' }); return; }
      if (U.$('#optin', form).checked) N.db.subscribe();
      var tt = totals(), phone = normPhone(val('mpesa')), cancelled = false;
      var order = { contact: { email: val('email'), phone: normPhone(val('phone')) }, address: { first: val('first'), last: val('last'), street: val('street'), area: val('area'), town: val('town'), county: val('county'), notes: val('notes') }, method: method, pay: 'M-Pesa' };
      var L = N.layer('<div class="stk"><span class="stk__ic">' + i('phone', 30) + '</span><h2 class="h3">Check your phone</h2><p>We sent an M-Pesa request for <b>' + U.money(tt.total) + '</b> to <b>' + esc(phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')) + '</b>. Enter your M-Pesa PIN to pay.</p>' +
        '<div class="stk__bar" aria-hidden="true"><span></span></div><p class="stk__s" role="status">Waiting for confirmation…</p>' + (TPL ? '<p class="stk__tpl">Template: no request is sent and nothing is charged. This confirms on its own in a few seconds.</p>' : '') +
        '<button type="button" class="btn btn--line btn--block" data-close data-focus>Cancel</button></div>', { label: 'M-Pesa payment', onClose: function () { cancelled = true; } });
      N.pay.mpesa(phone, tt.total).then(function (r) {
        if (cancelled) { N.toast('Payment cancelled. Your bag is saved.'); return; }
        if (!r.ok) { U.$('.stk__s', L.box).textContent = 'The payment didn’t go through. Please try again.'; return; }
        order.receipt = r.receipt; cancelled = true; L.close();
        var o = N.db.placeOrder(order); N.go('order/' + o.ref);
      });
    });
  });

  /* ================= ORDER CONFIRMATION / DETAILS ================= */
  N.route(/^order\/([\w-]+)$/, function (m) {
    var o = N.db.order(m[1]);
    if (!o) return N.notFound();
    N.meta('Order ' + o.ref);
    var mt = C.shipping.methods.filter(function (x) { return x.id === o.method; })[0] || {}, a = o.address;
    app().innerHTML = '<div class="wrap conf"><div class="conf__head"><span class="conf__ic">' + i('check', 28) + '</span><p class="eyebrow">Order ' + esc(o.ref) + ' · ' + U.date(o.at) + '</p>' +
      '<h1 class="h1">Thank you, ' + esc(a.first) + '.</h1><p>Your order is confirmed and paid. A confirmation will go to <b>' + esc(o.contact.email) + '</b>' + (TPL ? ' (template: no email is sent)' : '') + '.</p></div>' +
      '<div class="conf__grid"><div class="conf__box"><h2 class="h3">What happens next</h2><ol class="tl"><li class="is-done"><b>Payment received</b><span>M-Pesa ref ' + esc(o.receipt || '') + '</span></li><li><b>Packing your order</b><span>We’ll message you when it’s on the way.</span></li><li><b>' + esc(mt.name || 'Delivery') + '</b><span>' + esc(mt.eta || '') + '</span></li></ol>' +
        '<h2 class="h3">Delivery to</h2><p class="addr">' + esc(a.first + ' ' + a.last) + '<br>' + esc([a.street, a.area].filter(Boolean).join(', ')) + '<br>' + esc(a.town + ', ' + a.county) + '<br>' + esc(o.contact.phone) + '</p></div>' +
      '<aside class="sum"><h2 class="h3">Your order</h2><ul class="mlines">' + o.lines.map(function (l) { var p = N.byId[l.id]; return '<li><span class="mlines__img">' + (p ? thumb(p, l.color, 64) : '') + '<b>' + l.qty + '</b></span><span class="mlines__n">' + esc(l.name) + '<small>' + esc(l.color) + ' · ' + esc(l.size) + '</small></span><span>' + U.money(l.price * l.qty) + '</span></li>'; }).join('') + '</ul>' +
        row('Subtotal', U.money(o.totals.sub)) + (o.totals.disc ? row('Discount', '− ' + U.money(o.totals.disc), 'sum__r--disc') : '') + row('Delivery', o.totals.ship ? U.money(o.totals.ship) : 'Free') + row('Paid', U.money(o.totals.total), 'sum__r--tot') + '</aside></div>' +
      '<div class="conf__acts"><a class="btn btn--ink" href="' + N.href('shop/all') + '">Continue shopping</a><a class="btn btn--line" href="' + N.href('account/orders') + '">Your orders</a></div></div>';
  });

  /* ================= ACCOUNT ================= */
  N.route(/^account(?:\/(orders|addresses|details))?$/, function (m) {
    var S = N.db.state(), tab = m[1] || 'orders';
    N.meta('Account');
    if (!S.account) {
      app().innerHTML = '<div class="wrap acct"><h1 class="h1">Account</h1>' + (TPL ? '<p class="tplnote">' + i('lock', 16) + '<span><b>Template account.</b> Details are kept in this browser only. Connect your store’s customer accounts to go live.</span></p>' : '') +
        '<div class="acct__auth"><form class="auth" data-auth="in" novalidate><h2 class="h3">Sign in</h2><div class="fld"><label for="ie">Email</label><input id="ie" type="email" autocomplete="email" required></div><div class="fld"><label for="ip">Password</label><input id="ip" type="password" autocomplete="current-password" required></div><p class="fld__e" role="alert" hidden></p><button class="btn btn--ink btn--block" type="submit">Sign in</button></form>' +
        '<form class="auth" data-auth="up" novalidate><h2 class="h3">Create an account</h2><p>Track orders, save addresses and check out faster.</p><div class="fld"><label for="un">Full name</label><input id="un" autocomplete="name" required></div><div class="fld"><label for="ue">Email</label><input id="ue" type="email" autocomplete="email" required></div><div class="fld"><label for="up">Password</label><input id="up" type="password" autocomplete="new-password" minlength="8" required></div><p class="fld__e" role="alert" hidden></p><button class="btn btn--line btn--block" type="submit">Create account</button></form></div>' +
        (S.orders.length ? '<p class="acct__guest">You have ' + U.plural(S.orders.length, 'order') + ' placed in this browser. Sign in to see them in your account, or <a class="link" href="' + N.href('order/' + S.orders[0].ref) + '">view the latest</a>.</p>' : '') + '</div>';
      U.$$('[data-auth]').forEach(function (fm) {
        fm.addEventListener('submit', function (e) {
          e.preventDefault(); var up = fm.getAttribute('data-auth') === 'up', em = U.$(up ? '#ue' : '#ie').value.trim(), pw = U.$(up ? '#up' : '#ip').value, er = U.$('.fld__e', fm);
          var msg = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em) ? 'Enter a valid email address.' : pw.length < (up ? 8 : 1) ? (up ? 'Use at least 8 characters for your password.' : 'Enter your password.') : up && !U.$('#un').value.trim() ? 'Enter your name.' : '';
          if (msg) { er.textContent = msg; er.hidden = false; return; }
          N.db.signIn({ email: em, name: up ? U.$('#un').value.trim() : '' }); N.render(); N.toast(up ? 'Account created.' : 'Signed in.');
        });
      });
      return;
    }
    var tabs = [['orders', 'Orders'], ['addresses', 'Addresses'], ['details', 'Details']], body = '';
    if (tab === 'orders') body = '<h2 class="h2">Orders</h2>' + (S.orders.length ? '<ul class="ords">' + S.orders.map(function (o) {
      return '<li class="ord"><div class="ord__h"><div><b>' + esc(o.ref) + '</b><span>' + U.date(o.at) + ' · ' + U.plural(o.lines.reduce(function (a, l) { return a + l.qty; }, 0), 'item') + ' · ' + U.money(o.totals.total) + '</span></div><span class="badge">' + esc(o.status) + '</span></div>' +
        '<div class="ord__imgs">' + o.lines.slice(0, 4).map(function (l) { var p = N.byId[l.id]; return p ? '<span>' + thumb(p, l.color, 56) + '</span>' : ''; }).join('') + '</div>' +
        '<div class="ord__a"><a class="btn btn--line btn--sm" href="' + N.href('order/' + o.ref) + '">View order</a><button type="button" class="btn btn--line btn--sm" data-again="' + o.ref + '">Buy again</button></div></li>';
    }).join('') + '</ul>' : '<div class="empty"><p class="h3">No orders yet.</p><a class="btn btn--ink" href="' + N.href('shop/new-in') + '">Shop New In</a></div>');
    if (tab === 'addresses') body = '<h2 class="h2">Addresses</h2><div class="addrs">' + S.addresses.map(function (a) {
      return '<div class="addrc"><p>' + esc(a.first + ' ' + a.last) + '<br>' + esc([a.street, a.area].filter(Boolean).join(', ')) + '<br>' + esc(a.town + ', ' + a.county) + '</p><div><button type="button" class="link link--sm" data-edit="' + a.id + '">Edit</button><button type="button" class="link link--sm" data-del="' + a.id + '">Remove</button></div></div>';
    }).join('') + '<button type="button" class="addrc addrc--new" data-edit="">' + i('plus', 20) + 'Add an address</button></div><div data-aform></div>';
    if (tab === 'details') body = '<h2 class="h2">Details</h2><form class="det" novalidate><div class="fgrid"><div class="fld"><label for="dn">Full name</label><input id="dn" autocomplete="name" value="' + esc(S.account.name) + '"></div><div class="fld fld--h"><label for="de">Email</label><input id="de" type="email" autocomplete="email" value="' + esc(S.account.email) + '"></div><div class="fld fld--h"><label for="dp">Phone</label><input id="dp" type="tel" autocomplete="tel" value="' + esc(S.account.phone) + '"></div></div>' +
      '<h3 class="h3 det__pw">Change password</h3><div class="fgrid"><div class="fld fld--h"><label for="pw1">New password</label><input id="pw1" type="password" autocomplete="new-password"></div><div class="fld fld--h"><label for="pw2">Confirm new password</label><input id="pw2" type="password" autocomplete="new-password"></div></div><p class="fld__e" role="alert" hidden></p><button class="btn btn--ink" type="submit">Save changes</button></form>';
    app().innerHTML = '<div class="wrap acct"><div class="acct__top"><p class="eyebrow">Account</p><h1 class="h1">Hello, ' + esc(S.account.name.split(' ')[0]) + '.</h1></div><div class="acct__grid"><nav class="acct__nav" aria-label="Account">' +
      tabs.map(function (t) { return '<a href="' + N.href('account/' + t[0]) + '"' + (t[0] === tab ? ' aria-current="page" class="is-on"' : '') + '>' + t[1] + '</a>'; }).join('') + '<button type="button" data-out>Sign out</button></nav><div class="acct__body">' + body + '</div></div></div>';
    var root = app();
    root.addEventListener('click', function (e) {
      if (e.target.closest('[data-out]')) { N.db.signOut(); N.go('account'); N.toast('Signed out.'); }
      var ag = e.target.closest('[data-again]');
      if (ag) { var o = N.db.order(ag.getAttribute('data-again')), n = 0; o.lines.forEach(function (l) { if (N.db.add(l.id, { size: l.size, color: l.color, qty: l.qty }).ok) n++; }); N.toast(n ? 'Added to your bag.' : 'Those sizes are sold out now.'); }
      var ed = e.target.closest('[data-edit]');
      if (ed) {
        var a = S.addresses.filter(function (x) { return x.id === ed.getAttribute('data-edit'); })[0] || { county: 'Nairobi' };
        U.$('[data-aform]', root).innerHTML = '<form class="aform" novalidate><h3 class="h3">' + (a.id ? 'Edit address' : 'New address') + '</h3><div class="fgrid">' +
          [['first', 'First name', 1], ['last', 'Last name', 1], ['street', 'Street, building & house number'], ['area', 'Estate or area', 1], ['town', 'Town or city', 1]].map(function (x) { return '<div class="fld' + (x[2] ? ' fld--h' : '') + '"><label for="a-' + x[0] + '">' + x[1] + '</label><input id="a-' + x[0] + '" value="' + esc(a[x[0]] || '') + '"' + (x[0] === 'area' ? '' : ' required') + '></div>'; }).join('') +
          '<div class="fld fld--h"><label for="a-county">County</label><div class="sel sel--f"><select id="a-county">' + N.counties.slice().sort().map(function (c) { return '<option' + (c === a.county ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</select>' + i('down', 16) + '</div></div></div>' +
          '<p class="fld__e" role="alert" hidden></p><div class="aform__a"><button class="btn btn--ink" type="submit">Save address</button><button class="btn btn--line" type="button" data-cancel>Cancel</button></div></form>';
        var fm = U.$('.aform', root); U.$('input', fm).focus();
        fm.addEventListener('submit', function (ev) {
          ev.preventDefault(); var o2 = { id: a.id }; ['first', 'last', 'street', 'area', 'town', 'county'].forEach(function (k) { o2[k] = U.$('#a-' + k, fm).value.trim(); });
          if (!o2.first || !o2.last || !o2.street || !o2.town) { var er = U.$('.fld__e', fm); er.textContent = 'Fill in name, street and town.'; er.hidden = false; return; }
          N.db.saveAddress(o2); N.render(); N.toast('Address saved.');
        });
        U.$('[data-cancel]', fm).addEventListener('click', function () { U.$('[data-aform]', root).innerHTML = ''; });
      }
      var dl = e.target.closest('[data-del]'); if (dl) { N.db.removeAddress(dl.getAttribute('data-del')); N.render(); N.toast('Address removed.'); }
    });
    var det = U.$('.det', root);
    if (det) det.addEventListener('submit', function (e) {
      e.preventDefault(); var er = U.$('.fld__e', det), em = U.$('#de').value.trim(), p1 = U.$('#pw1').value, p2 = U.$('#pw2').value;
      var msg = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em) ? 'Enter a valid email address.' : (p1 || p2) && p1.length < 8 ? 'Use at least 8 characters for your new password.' : p1 !== p2 ? 'The passwords don’t match.' : '';
      if (msg) { er.textContent = msg; er.hidden = false; return; }
      er.hidden = true; N.db.saveDetails({ name: U.$('#dn').value.trim() || S.account.name, email: em, phone: U.$('#dp').value.trim() }); U.$('#pw1').value = U.$('#pw2').value = ''; N.toast('Details saved.');
    });
  });

  /* ================= LOOKBOOK ================= */
  N.route(/^lookbook$/, function () {
    var LB = N.lookbook; N.meta('Lookbook', LB.intro);
    app().innerHTML = '<div class="lb"><header class="wrap lb__head"><p class="eyebrow eyebrow--accent">' + esc(LB.season) + '</p><h1 class="lb__t">' + esc(LB.title) + '</h1><p>' + esc(LB.intro) + '</p></header>' +
      '<div class="wrap lb__list">' + LB.looks.map(function (l, k) {
        return '<article class="look' + (k % 2 ? ' look--r' : '') + '" id="look-' + (k + 1) + '"><figure class="look__img">' + U.img(l.img, { widths: [600, 1000, 1400], sizes: '(max-width: 860px) 100vw, 58vw', alt: l.name, pos: l.pos, mono: true, eager: k === 0 }) + '</figure>' +
          '<div class="look__copy"><span class="look__n">' + (k < 9 ? '0' : '') + (k + 1) + '</span><h2 class="h2">' + esc(l.name) + '</h2><p>' + esc(l.caption) + '</p><p class="eyebrow">Shop the look</p><ul class="look__items">' + l.items.map(function (id) {
            var p = N.byId[id]; return p ? '<li><a href="' + N.href('product/' + p.slug) + '"><span class="look__th">' + U.img(p.imgs[0], { widths: [120, 240], sizes: '64px', alt: '', pos: p.pos && p.pos[0] }) + '</span><span><b>' + esc(p.name) + '</b><small>' + U.money(p.price) + '</small></span></a><button type="button" class="look__qv" data-qv="' + p.id + '" aria-label="Quick view: ' + esc(p.name) + '">' + i('plus', 18) + '</button></li>' : '';
          }).join('') + '</ul></div></article>';
      }).join('') + '</div><p class="wrap lb__note">Styling imagery from Unsplash. The linked pieces are the closest matches from the collection.</p></div>';
    if (location.hash && location.hash.indexOf('#look-') === 0) { var t = document.getElementById(location.hash.slice(1)); if (t) setTimeout(function () { t.scrollIntoView(); }, 30); }
  });

  /* ================= CUSTOM MADE ================= */
  N.route(/^custom-made$/, function () {
    N.meta('Custom Made', 'Custom pieces made to your measurements. Tell us the garment, fit and colour and we’ll come back with what’s possible.');
    var types = ['T-shirt', 'Shirt', 'Hoodie or sweat', 'Jacket', 'Jeans', 'Trousers', 'Two-piece set', 'Something else'];
    app().innerHTML = '<div class="cmp"><section class="cmp__hero"><div class="wrap cmp__in"><div class="cmp__copy"><p class="eyebrow eyebrow--accent">Custom Made</p><h1 class="hero__t hero__t--sm">Made to your <span>measure.</span></h1>' +
      '<p>Some pieces should only exist once. Tell us what you have in mind (the garment, the fit, the colour) and share a reference if you have one. We’ll reply with what’s possible, the price and how long it takes before anything is cut.</p><a class="btn btn--accent" href="#enquire" data-jump>Start an enquiry</a></div>' +
      '<figure class="cmp__img">' + U.img(E.customHero.img, { widths: [600, 1000, 1400], sizes: '(max-width: 860px) 100vw, 50vw', alt: E.customHero.alt, pos: E.customHero.pos, mono: true, eager: true }) + '</figure></div></section>' +
      '<section class="sec"><div class="wrap"><h2 class="h2">How it works</h2><ol class="steps">' + [
        ['Share the idea', 'Fill in the form below with the garment, colours and any references. Measurements help, but we can take them together.'],
        ['Fit & fabric', 'We confirm the details, fabric options, price and timeline with you. Nothing is made until you approve.'],
        ['Made for you', 'Your piece is cut and sewn to your measurements, then delivered or ready to collect.']
      ].map(function (s, k) { return '<li><span>0' + (k + 1) + '</span><b>' + s[0] + '</b><p>' + s[1] + '</p></li>'; }).join('') + '</ol></div></section>' +
      '<section class="sec sec--paper" id="enquire"><div class="wrap cmf"><div class="cmf__side"><h2 class="h2">Your enquiry</h2><p>We reply to every enquiry personally. Prices and timelines depend on the piece, so we confirm both before you commit.</p>' +
        '<figure class="cmf__img">' + U.img(E.customDetail.img, { widths: [400, 700], sizes: '(max-width: 860px) 100vw, 30vw', alt: E.customDetail.alt, pos: E.customDetail.pos, mono: true }) + '</figure></div>' +
        '<form class="cmf__form" novalidate><div class="fgrid">' +
          '<div class="fld fld--h"><label for="cn">Name</label><input id="cn" autocomplete="name" required aria-describedby="cn-e"><p class="fld__e" id="cn-e" hidden></p></div>' +
          '<div class="fld fld--h"><label for="cc">Phone or email</label><input id="cc" autocomplete="email" required aria-describedby="cc-e"><p class="fld__e" id="cc-e" hidden></p></div>' +
          '<div class="fld fld--h"><label for="ct">Garment</label><div class="sel sel--f"><select id="ct" required aria-describedby="ct-e"><option value="">Choose a garment</option>' + types.map(function (t) { return '<option>' + t + '</option>'; }).join('') + '</select>' + i('down', 16) + '</div><p class="fld__e" id="ct-e" hidden></p></div>' +
          '<div class="fld fld--h"><label for="cs">Size or measurements <small>(optional)</small></label><input id="cs" placeholder="e.g. M, or chest 98 cm"></div>' +
          '<div class="fld"><label for="ccol">Colour preferences <small>(optional)</small></label><input id="ccol" placeholder="e.g. washed black, cream stitching"></div>' +
          '<div class="fld"><label for="cd">Design notes</label><textarea id="cd" rows="5" required placeholder="Describe the piece: shape, length, details, fabric, the occasion…" aria-describedby="cd-e"></textarea><p class="fld__e" id="cd-e" hidden></p></div>' +
          '<div class="fld"><span class="fld__l">Reference images <small>(optional, up to 3)</small></span><label class="drop" for="cf">' + i('upload', 22) + '<span><b>Add images</b> JPG or PNG, up to 5 MB each</span></label><input id="cf" class="sr" type="file" accept="image/png,image/jpeg,image/webp" multiple><div class="drop__list" data-files></div></div>' +
        '</div><button class="btn btn--accent btn--block" type="submit">Send enquiry</button>' + (TPL && !C.customForm.endpoint ? '<p class="ck__legal">Template: enquiries are kept in this browser until you connect a form endpoint in the store config.</p>' : '') + '</form></div></section></div>';
    var root = app(), form = U.$('.cmf__form', root), files = [];
    U.$('[data-jump]', root).addEventListener('click', function (e) { e.preventDefault(); U.$('#enquire').scrollIntoView({ behavior: U.reduce ? 'auto' : 'smooth' }); setTimeout(function () { U.$('#cn').focus({ preventScroll: true }); }, U.reduce ? 0 : 450); });
    U.$('#cf', form).addEventListener('change', function (e) {
      Array.prototype.slice.call(e.target.files).forEach(function (f) { if (files.length < 3 && /^image\//.test(f.type) && f.size <= 5e6) files.push(f); else N.toast(f.size > 5e6 ? f.name + ' is larger than 5 MB.' : 'Up to 3 images.'); });
      e.target.value = ''; drawFiles();
    });
    function drawFiles() {
      U.$('[data-files]', form).innerHTML = files.map(function (f, k) { return '<span class="drop__f"><img src="' + URL.createObjectURL(f) + '" alt=""><span>' + esc(f.name) + '</span><button type="button" data-rmf="' + k + '" aria-label="Remove ' + esc(f.name) + '">' + i('x', 14) + '</button></span>'; }).join('');
    }
    form.addEventListener('click', function (e) { var b = e.target.closest('[data-rmf]'); if (b) { files.splice(+b.getAttribute('data-rmf'), 1); drawFiles(); } });
    function err(id, m) { var el = U.$('#' + id, form), e = U.$('#' + id + '-e', form); el.setAttribute('aria-invalid', m ? 'true' : 'false'); e.textContent = m; e.hidden = !m; return !m; }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = function (id) { return U.$('#' + id, form).value.trim(); }, c = v('cc');
      var ok = [err('cn', v('cn') ? '' : 'Enter your name.'), err('cc', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c) || normPhone(c) ? '' : 'Enter an email address or a Kenyan phone number.'), err('ct', v('ct') ? '' : 'Choose a garment.'), err('cd', v('cd').length >= 10 ? '' : 'Tell us a little about the piece (a sentence or two).')];
      if (ok.indexOf(false) >= 0) { U.$('[aria-invalid="true"]', form).focus(); return; }
      var data = { name: v('cn'), contact: c, garment: v('ct'), size: v('cs'), colours: v('ccol'), notes: v('cd'), images: files.map(function (f) { return f.name; }) };
      var btn = U.$('button[type=submit]', form); btn.disabled = true; btn.textContent = 'Sending…';
      var done = function (sent) {
        var en = N.db.enquire(data);
        U.$('.cmf', root).innerHTML = '<div class="cmf__done" tabindex="-1">' + i('check', 28) + '<h2 class="h2">Thank you, ' + esc(data.name.split(' ')[0]) + '.</h2><p>Your enquiry for a custom ' + esc(data.garment.toLowerCase()) + ' is in (ref ' + en.ref + '). ' + (sent ? 'We’ll reply to ' + esc(c) + ' soon.' : 'Template: it’s saved in this browser because no form endpoint is connected yet.') + '</p><a class="btn btn--line" href="' + N.href('shop/all') + '">Keep browsing</a></div>';
        U.$('.cmf__done', root).focus();
      };
      if (C.customForm.endpoint) {
        var fd = new FormData(); Object.keys(data).forEach(function (k) { if (k !== 'images') fd.append(k, data[k]); }); files.forEach(function (f) { fd.append('images', f); });
        fetch(C.customForm.endpoint, { method: 'POST', body: fd, headers: { Accept: 'application/json' } }).then(function (r) { if (!r.ok) throw 0; done(true); }).catch(function () { btn.disabled = false; btn.textContent = 'Send enquiry'; N.toast('We couldn’t send that just now. Please try again.', 'err'); });
      } else setTimeout(function () { done(false); }, 500);
    });
  });

  /* ================= HELP ================= */
  var c = C.contact, sh = C.shipping;
  var HELP = {
    shipping: ['Shipping', function () { return '<p>We deliver across Kenya. Orders placed before 1 pm on a working day are packed the same day.</p><div class="tbl"><table><thead><tr><th scope="col">Method</th><th scope="col">Time</th><th scope="col">Cost</th></tr></thead><tbody>' + sh.methods.map(function (m) { return '<tr><th scope="row">' + esc(m.name) + '</th><td>' + esc(m.eta) + '</td><td>' + (m.price ? U.money(m.price) : 'Free') + '</td></tr>'; }).join('') + '</tbody></table></div><p>Delivery is free on orders over ' + U.money(sh.freeOver) + '. You’ll get a message with your rider or courier details once your order is on the way.</p>'; }],
    returns: ['Returns & exchanges', function () { return '<p>Changed your mind? Return or exchange unworn pieces with their original tags within <b>14 days</b> of delivery.</p><ol class="olist"><li>Contact us with your order number and the pieces you’re returning.</li><li>Drop the parcel at the studio or send it back with a courier. We’ll share the address.</li><li>Once it arrives and is checked, we refund to your M-Pesa number or send your exchange.</li></ol><p>Custom Made pieces are made for you and can’t be returned unless they’re faulty. Sale pieces can be exchanged for another size.</p>'; }],
    'size-guide': ['Size guide', function () { return '<p>Body measurements in centimetres. Most tops are relaxed, so take your usual size, or size down for a closer fit.</p>' + N.sizeGuide.tops() + N.sizeGuide.jeans() + '<p>Between sizes, or need something specific? <a class="link" href="' + N.href('custom-made') + '">Ask about a custom fit</a>.</p>'; }],
    faq: ['FAQs', function () { return N.acc([
      { t: 'How do I pay?', b: '<p>With M-Pesa. At checkout we send a payment prompt to your phone; enter your PIN and the order is confirmed.</p>', open: true },
      { t: 'When will my order arrive?', b: '<p>Nairobi orders usually arrive the same or next working day; elsewhere in Kenya takes 2–4 working days. See <a class="link" href="' + N.href('help/shipping') + '">shipping</a>.</p>' },
      { t: 'How do I find my size?', b: '<p>Every product page has a size guide and fit notes. See the full <a class="link" href="' + N.href('help/size-guide') + '">size guide</a>.</p>' },
      { t: 'Can I return something?', b: '<p>Yes, within 14 days if it’s unworn with tags. See <a class="link" href="' + N.href('help/returns') + '">returns</a>.</p>' },
      { t: 'Do you make custom pieces?', b: '<p>Yes. Send a <a class="link" href="' + N.href('custom-made') + '">Custom Made enquiry</a> and we’ll come back with what’s possible, the price and the timeline.</p>' }
    ]); }],
    contact: ['Contact', function () { return '<p>Questions about an order, sizing or a custom piece? We’re here ' + esc(c.hours) + '.</p><ul class="clist">' + (c.email ? '<li>' + i('mail', 18) + '<a class="link" href="mailto:' + esc(c.email) + '">' + esc(c.email) + '</a></li>' : '') + (c.phone ? '<li>' + i('phone', 18) + '<a class="link" href="tel:' + esc(c.phone.replace(/\s/g, '')) + '">' + esc(c.phone) + '</a></li>' : '') + (c.instagram ? '<li>' + i('insta', 18) + '<a class="link" href="' + esc(c.instagram) + '">Instagram</a></li>' : '') + '</ul>' + (TPL ? '<p class="tplnote">' + i('info', 16) + '<span>Template: these are sample contact details. Replace them in the store config.</span></p>' : ''); }],
    story: ['Our story', function () { return '<p class="lead">NJIA means “path” in Swahili. We make clothes for people who take their own.</p><p>The collection is built on a few things done well: heavyweight tees that hold their shape, denim that gets better with wear, and jackets you’ll still reach for in ten years. Alongside it sit the statement pieces, and Custom Made for the ones that should only exist once.</p><p>Everything is designed for the way the city moves: early commutes, long afternoons and late nights.</p>'; }],
    terms: ['Terms', function () { return '<p>These are sample terms for the NJIA store template. Replace them with your own terms of sale before launch, covering pricing, payment, delivery, returns, custom orders and liability.</p>'; }],
    privacy: ['Privacy', function () { return '<p>This is a sample privacy notice for the NJIA store template. In template mode, your bag, orders and account details are stored only in this browser and are never sent anywhere. Replace this page with your own privacy policy before launch.</p>'; }]
  };
  N.route(/^help\/([\w-]+)$/, function (m) {
    var h = HELP[m[1]]; if (!h) return N.notFound();
    N.meta(h[0]);
    app().innerHTML = '<div class="wrap help">' + N.crumbs([['Home', ''], ['Help', 'help/faq'], [h[0]]]) + '<div class="help__grid"><nav class="help__nav" aria-label="Help">' +
      Object.keys(HELP).map(function (k) { return '<a href="' + N.href('help/' + k) + '"' + (k === m[1] ? ' aria-current="page" class="is-on"' : '') + '>' + HELP[k][0] + '</a>'; }).join('') + '</nav><article class="help__body"><h1 class="h1">' + h[0] + '</h1>' + h[1]() + '</article></div></div>';
  });

  /* ================= CREDITS ================= */
  N.route(/^credits$/, function () {
    N.meta('Photo credits');
    var who = N.credits || {}, ids = [];
    function add(x) { if (x && ids.indexOf(x) < 0) ids.push(x); }
    add(E.hero.img); E.tiles.forEach(function (t) { add(t.img); }); add(E.details.img); add(E.detailsInset.img); add(E.custom.img); add(E.customHero.img); add(E.customDetail.img);
    N.lookbook.looks.forEach(function (l) { add(l.img); }); N.products.forEach(function (p) { p.imgs.forEach(add); });
    app().innerHTML = '<div class="wrap help"><h1 class="h1">Photo credits</h1><p>All photography in this template comes from <a class="link" href="https://unsplash.com/?utm_source=njia_template&utm_medium=referral" target="_blank" rel="noopener">Unsplash</a> and is used under the Unsplash License. Product and lookbook images are styling placeholders: they are not photos of NJIA garments. Thank you to the photographers.</p><ul class="credits">' +
      ids.map(function (id) { var w = who[id] || []; return '<li><span class="credits__img">' + U.img(id, { widths: [120, 240], sizes: '56px', alt: '' }) + '</span><span>' + (w[0] ? 'Photo by <a class="link" href="https://unsplash.com/@' + esc(w[1]) + '?utm_source=njia_template&utm_medium=referral" target="_blank" rel="noopener">' + esc(w[0]) + '</a>' : 'Photo') + ' on <a class="link" href="https://unsplash.com/photos/' + esc(w[2] || '') + '?utm_source=njia_template&utm_medium=referral" target="_blank" rel="noopener">Unsplash</a></span></li>'; }).join('') + '</ul></div>';
  });

  /* ================= 404 + BOOT ================= */
  N.notFound = function () {
    N.meta('Page not found');
    app().innerHTML = '<div class="wrap empty empty--404"><p class="eyebrow eyebrow--accent">404</p><h1 class="h1">This lane doesn’t go anywhere.</h1><p>The page may have moved, or the piece may have sold out for good.</p><div class="empty__acts"><a class="btn btn--ink" href="' + N.href('') + '">Back home</a><a class="btn btn--line" href="' + N.href('shop/new-in') + '">Shop New In</a></div></div>';
  };
  N.afterRender = function (path) {
    var nav = path.indexOf('product/') === 0 ? null : path.split('?')[0];
    N.markNav(nav);
    var h = U.$('#app h1'); var main = U.$('#app'); if (main && N.booted) { main.focus({ preventScroll: true }); }
    N.booted = true;
  };

  N.header(); N.footer();
  N.db.on(N.syncCount);
  N.render({ keepScroll: true });
})();
