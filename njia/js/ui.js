/* ==========================================================================
   NJIA — shared UI: header, menu, search, footer, product cards, quick view,
   modal/drawer helpers, mini bag, size guide, toasts
   ========================================================================== */
(function () {
  var N = window.NJIA, C = N.config, U = N.u, esc = U.esc, i = U.i;

  /* ---------- modal & drawer (focus trap, Esc, scroll lock, focus return) ---------- */
  var stack = [];
  function lock() { document.documentElement.classList.toggle('is-locked', stack.length > 0); }
  N.layer = function (html, o) {
    o = o || {};
    var back = document.activeElement, el = document.createElement('div');
    el.className = 'layer ' + (o.cls || 'layer--modal');
    el.innerHTML = '<div class="layer__scrim" data-close></div><div class="layer__box" role="dialog" aria-modal="true" aria-label="' + esc(o.label || 'Dialog') + '" tabindex="-1">' +
      '<button class="layer__x" type="button" data-close aria-label="Close">' + i('x', 22) + '</button>' + html + '</div>';
    document.body.appendChild(el);
    var box = el.querySelector('.layer__box');
    function focusables() { return U.$$('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex="0"]', box).filter(function (x) { return x.offsetParent !== null; }); }
    function close() {
      if (!el.parentNode) return;
      el.classList.remove('is-open'); stack.splice(stack.indexOf(api), 1); lock();
      document.removeEventListener('keydown', key);
      setTimeout(function () { el.remove(); }, U.reduce ? 0 : 260);
      if (back && back.focus && document.contains(back)) back.focus();
      o.onClose && o.onClose();
    }
    function key(e) {
      if (stack[stack.length - 1] !== api) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      if (e.key === 'Tab') {
        var f = focusables(); if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    }
    el.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) close(); });
    document.addEventListener('keydown', key);
    var api = { el: el, box: box, close: close };
    stack.push(api); lock();
    requestAnimationFrame(function () { el.classList.add('is-open'); var f = box.querySelector('[data-focus]') || box; f.focus({ preventScroll: true }); });
    o.onOpen && o.onOpen(api);
    return api;
  };
  N.closeLayers = function () { stack.slice().forEach(function (l) { l.close(); }); };

  N.toast = function (msg, kind) {
    var w = U.$('.toasts') || document.body.appendChild(Object.assign(document.createElement('div'), { className: 'toasts' }));
    w.setAttribute('role', 'status'); w.setAttribute('aria-live', 'polite');
    var t = document.createElement('div'); t.className = 'toast' + (kind ? ' toast--' + kind : ''); t.textContent = msg;
    w.innerHTML = ''; w.appendChild(t);
    setTimeout(function () { t.classList.add('is-in'); }, 10);
    setTimeout(function () { t.classList.remove('is-in'); setTimeout(function () { t.remove(); }, 300); }, 3200);
  };

  /* ---------- header ---------- */
  N.header = function () {
    var h = U.$('#hdr');
    h.innerHTML = '<header class="hd"><div class="hd__in wrap">' +
      '<button class="hd__btn hd__burger" type="button" aria-label="Open menu" data-menu>' + i('menu', 22) + '</button>' +
      '<a class="logo" href="' + N.href('') + '" aria-label="NJIA home">' + U.logo() + '</a>' +
      '<nav class="hd__nav" aria-label="Main">' + C.nav.map(function (n) { return '<a href="' + N.href(n[1]) + '" data-nav="' + n[1] + '">' + esc(n[0]) + '</a>'; }).join('') + '</nav>' +
      '<div class="hd__tools">' +
        '<button class="hd__btn" type="button" aria-label="Search" data-search>' + i('search', 21) + '</button>' +
        '<a class="hd__btn hd__acct" href="' + N.href('account') + '" aria-label="Account">' + i('user', 21) + '</a>' +
        '<a class="hd__btn hd__bag" href="' + N.href('bag') + '" aria-label="Shopping bag">' + i('bag', 21) + '<span class="hd__count" data-count hidden>0</span></a>' +
      '</div></div></header>';
    h.addEventListener('click', function (e) {
      if (e.target.closest('[data-menu]')) N.menu();
      if (e.target.closest('[data-search]')) N.searchPanel();
    });
    N.syncCount();
  };
  N.syncCount = function () {
    var n = N.db.count();
    U.$$('[data-count]').forEach(function (c) { c.textContent = n > 99 ? '99+' : n; c.hidden = !n; });
    var b = U.$('.hd__bag'); if (b) b.setAttribute('aria-label', 'Shopping bag, ' + U.plural(n, 'item'));
  };
  N.markNav = function (path) {
    U.$$('[data-nav]').forEach(function (a) { var on = path === a.getAttribute('data-nav'); a.classList.toggle('is-on', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  };

  N.menu = function () {
    N.layer('<div class="menu"><a class="logo menu__logo" href="' + N.href('') + '" data-close>' + U.logo() + '</a>' +
      '<nav class="menu__nav" aria-label="Menu">' + C.nav.map(function (n) { return '<a href="' + N.href(n[1]) + '" data-close>' + esc(n[0]) + i('right', 18) + '</a>'; }).join('') + '</nav>' +
      '<div class="menu__more"><a href="' + N.href('shop/essentials') + '" data-close>Everyday Essentials</a><a href="' + N.href('shop/statement') + '" data-close>Statement Pieces</a><a href="' + N.href('shop/sale') + '" data-close>Sale</a></div>' +
      '<div class="menu__foot"><a href="' + N.href('account') + '" data-close>' + i('user', 18) + 'Account</a><a href="' + N.href('help/contact') + '" data-close>' + i('mail', 18) + 'Contact</a></div></div>',
      { cls: 'layer--left', label: 'Menu' });
  };

  /* ---------- search ---------- */
  N.searchPanel = function (q) {
    var L = N.layer('<div class="srch"><form class="srch__form" role="search"><label class="sr" for="srchq">Search the store</label>' + i('search', 22) +
      '<input id="srchq" name="q" type="search" placeholder="Search tees, denim, jackets…" autocomplete="off" data-focus value="' + esc(q || '') + '"><button class="btn btn--ink btn--sm" type="submit">Search</button></form>' +
      '<div class="srch__body" aria-live="polite"></div></div>', { cls: 'layer--top', label: 'Search' });
    var input = U.$('#srchq', L.box), body = U.$('.srch__body', L.box);
    function draw() {
      var v = input.value.trim();
      if (!v) {
        body.innerHTML = '<p class="eyebrow">Popular searches</p><div class="chips">' + C.popularSearches.map(function (s) { return '<button type="button" class="chip" data-q="' + esc(s) + '">' + esc(s) + '</button>'; }).join('') + '</div>' +
          '<p class="eyebrow" style="margin-top:28px">Shop by category</p><div class="srch__cats">' + ['New In:shop/new-in', 'Denim:shop/denim', 'Tops:shop/tops', 'Jackets:shop/jackets', 'Accessories:shop/accessories'].map(function (x) { x = x.split(':'); return '<a href="' + N.href(x[1]) + '" data-close>' + x[0] + i('arrow', 16) + '</a>'; }).join('') + '</div>';
        return;
      }
      var r = N.search(v);
      body.innerHTML = r.length
        ? '<div class="srch__head"><p class="eyebrow">' + U.plural(r.length, 'result') + '</p><a class="link" href="' + N.href('search?q=' + encodeURIComponent(v)) + '" data-close>See all results</a></div>' +
          '<div class="srch__grid">' + r.slice(0, 4).map(function (p) { return '<a class="srch__item" href="' + N.href('product/' + p.slug) + '" data-close><span class="srch__img">' + U.img(p.imgs[0], { widths: [200, 360], sizes: '120px', alt: p.name, pos: p.pos && p.pos[0] }) + '</span><span><b>' + esc(p.name) + '</b><small>' + U.money(p.price) + '</small></span></a>'; }).join('') + '</div>'
        : '<p class="srch__none">No pieces match “' + esc(v) + '”. Try “tee”, “denim” or “jacket”.</p>';
    }
    input.addEventListener('input', draw);
    body.addEventListener('click', function (e) { var c = e.target.closest('[data-q]'); if (c) { input.value = c.getAttribute('data-q'); draw(); input.focus(); } });
    U.$('form', L.box).addEventListener('submit', function (e) { e.preventDefault(); var v = input.value.trim(); if (!v) return; L.close(); N.go('search?q=' + encodeURIComponent(v)); });
    draw();
  };

  /* ---------- footer ---------- */
  N.footer = function () {
    var c = C.contact, f = U.$('#ftr'), g = function (t, links) { return '<div class="ft__col"><h3>' + t + '</h3>' + links.map(function (l) { return '<a href="' + (/^(https?:|#|mailto:)/.test(l[1]) ? l[1] : N.href(l[1])) + '"' + (/^https?:/.test(l[1]) ? ' target="_blank" rel="noopener"' : '') + '>' + l[0] + '</a>'; }).join('') + '</div>'; };
    f.innerHTML = '<footer class="ft"><div class="wrap">' +
      '<div class="ft__top"><div class="ft__brand"><a class="logo logo--light" href="' + N.href('') + '" aria-label="NJIA home">' + U.logo() + '</a><p>' + esc(C.store.description) + '</p>' +
        (c.email ? '<a class="ft__mail" href="mailto:' + esc(c.email) + '">' + i('mail', 17) + esc(c.email) + '</a>' : '') + '</div>' +
        g('Shop', [['New Arrivals', 'shop/new-in'], ['Women', 'shop/women'], ['Men', 'shop/men'], ['Denim', 'shop/denim'], ['Tops', 'shop/tops'], ['Jackets', 'shop/jackets'], ['Custom Made', 'custom-made']]) +
        g('Customer care', [['Contact', 'help/contact'], ['FAQs', 'help/faq'], ['Shipping', 'help/shipping'], ['Returns', 'help/returns'], ['Size guide', 'help/size-guide']]) +
        g('Brand', [['Our story', 'help/story'], ['Lookbook', 'lookbook'], ['Instagram', c.instagram || '#'], ['Photo credits', 'credits']]) +
      '</div>' +
      '<div class="ft__bot"><span>© 2026 NJIA. A store template by Ciel Africa.</span><span class="ft__pay">' + i('lock', 15) + 'Secure checkout with M-Pesa</span><span><a href="' + N.href('help/terms') + '">Terms</a><a href="' + N.href('help/privacy') + '">Privacy</a></span></div>' +
      '</div></footer>';
  };

  /* ---------- product card ---------- */
  N.priceHtml = function (p) { return p.was ? '<span class="pr pr--sale">' + U.money(p.price) + '</span> <s class="pr pr--was">' + U.money(p.was) + '</s>' : '<span class="pr">' + U.money(p.price) + '</span>'; };
  N.card = function (p, o) {
    o = o || {};
    var lab = N.label(p), alt = p.imgs[1] && p.colors.length < 2 ? p.imgs[1] : null, sizes = o.sizes || '(max-width: 760px) 50vw, (max-width: 1100px) 33vw, 25vw';
    return '<article class="pc' + (lab && lab.c === 'out' ? ' pc--out' : '') + '" data-id="' + p.id + '">' +
      '<div class="pc__media"><a class="pc__img" href="' + N.href('product/' + p.slug) + '" tabindex="-1" aria-hidden="true">' +
        U.img(p.imgs[0], { alt: '', pos: p.pos && p.pos[0], sizes: sizes, cls: 'pc__a' }) + (alt ? U.img(alt, { alt: '', pos: p.pos && p.pos[1], sizes: sizes, cls: 'pc__b' }) : '') + '</a>' +
        (lab ? '<span class="tag tag--' + lab.c + '">' + lab.t + '</span>' : '') +
        '<button class="pc__qv" type="button" data-qv="' + p.id + '" aria-label="Quick view: ' + esc(p.name) + '"><span>Quick view</span>' + i('plus', 18) + '</button></div>' +
      '<div class="pc__info"><a class="pc__name" href="' + N.href('product/' + p.slug) + '">' + esc(p.name) + '</a>' +
        '<div class="pc__price">' + N.priceHtml(p) + '</div>' +
        '<div class="pc__meta">' + (p.colors.length > 1 ? '<span class="dots">' + p.colors.map(function (c, k) { return '<button type="button" class="dot' + (k ? '' : ' is-on') + '" style="--c:' + c.hex + '" data-swap="' + p.id + ':' + c.img + '" aria-label="' + esc(c.n) + '"></button>'; }).join('') + '</span>' : '<span class="pc__col">' + esc(p.colors[0].n) + '</span>') + '</div>' +
      '</div></article>';
  };
  N.grid = function (list, o) { return '<div class="grid' + (o && o.cls ? ' ' + o.cls : '') + '">' + list.map(function (p) { return N.card(p, o); }).join('') + '</div>'; };

  document.addEventListener('click', function (e) {
    var qv = e.target.closest('[data-qv]'); if (qv) { e.preventDefault(); N.quickView(qv.getAttribute('data-qv')); return; }
    var sw = e.target.closest('[data-swap]');
    if (sw) {
      var a = sw.getAttribute('data-swap').split(':'), p = N.byId[a[0]], card = sw.closest('.pc'), img = card && U.$('.pc__a', card);
      if (img) { var id = p.imgs[+a[1]]; img.srcset = U.sizesOf(id).map(function (w) { return U.src(id, w) + ' ' + w + 'w'; }).join(', '); img.src = U.src(id, 600); img.style.objectPosition = (p.pos && p.pos[+a[1]]) || ''; }
      U.$$('.dot', sw.parentNode).forEach(function (d) { d.classList.toggle('is-on', d === sw); });
    }
  });

  /* ---------- size & colour pickers (shared by quick view and product page) ---------- */
  N.picker = function (p, st) {
    var stock = N.db.stock(p);
    return '<div class="opt"><div class="opt__head"><span class="opt__t">Colour</span><span class="opt__v" data-colv>' + esc(st.color) + '</span></div>' +
      '<div class="sws">' + p.colors.map(function (c) { return '<button type="button" class="sw' + (c.n === st.color ? ' is-on' : '') + '" style="--c:' + c.hex + '" data-col="' + esc(c.n) + '" aria-label="' + esc(c.n) + '" aria-pressed="' + (c.n === st.color) + '"></button>'; }).join('') + '</div></div>' +
      '<div class="opt"><div class="opt__head"><span class="opt__t">Size</span>' + (p.cat !== 'accessories' ? '<button type="button" class="link link--sm" data-sizeguide="' + p.id + '">' + i('ruler', 15) + 'Size guide</button>' : '') + '</div>' +
      '<div class="sizes" role="group" aria-label="Size">' + p.sizes.map(function (s) { var out = !stock[s]; return '<button type="button" class="size' + (s === st.size ? ' is-on' : '') + (out ? ' is-out' : '') + '" data-size="' + esc(s) + '"' + (out ? ' aria-disabled="true" title="Sold out"' : '') + ' aria-pressed="' + (s === st.size) + '">' + esc(s) + (out ? '<span class="sr"> (sold out)</span>' : '') + '</button>'; }).join('') + '</div>' +
      '<p class="opt__err" data-err role="alert" hidden></p><p class="opt__stock" data-stock>' + N.stockNote(p, st.size) + '</p></div>';
  };
  N.stockNote = function (p, size) {
    if (!N.inStock(p)) return 'Sold out in every size.';
    if (!size) return p.sizes.length > 1 ? 'Select a size to see availability.' : '';
    var n = N.db.stock(p)[size] || 0;
    return n <= 0 ? 'Size ' + esc(size) + ' is sold out.' : n <= 3 ? '<b class="warn">Only ' + n + ' left</b> in ' + esc(size) + '.' : '<span class="ok">' + i('check', 15) + 'In stock</span>, ready to dispatch.';
  };
  N.qtyHtml = function (v, max) { return '<div class="qty" data-qtybox><button type="button" data-q="-1" aria-label="Decrease quantity">' + i('minus', 16) + '</button><input type="number" inputmode="numeric" min="1" max="' + (max || 10) + '" value="' + (v || 1) + '" aria-label="Quantity" data-qty><button type="button" data-q="1" aria-label="Increase quantity">' + i('plus', 16) + '</button></div>'; };

  /* wires a picker block; st = {color,size,qty}; onAdd(result) */
  N.wirePicker = function (root, p, st, o) {
    o = o || {};
    root.addEventListener('click', function (e) {
      var c = e.target.closest('[data-col]'), s = e.target.closest('[data-size]'), q = e.target.closest('[data-q]'), g = e.target.closest('[data-sizeguide]');
      if (c) {
        st.color = c.getAttribute('data-col');
        U.$$('[data-col]', root).forEach(function (b) { var on = b === c; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on); });
        U.$('[data-colv]', root).textContent = st.color;
        var col = p.colors.filter(function (x) { return x.n === st.color; })[0]; o.onColor && o.onColor(col);
      }
      if (s) {
        if (s.getAttribute('aria-disabled') === 'true') { N.pickerError(root, 'Size ' + s.getAttribute('data-size') + ' is sold out.'); return; }
        st.size = s.getAttribute('data-size');
        U.$$('[data-size]', root).forEach(function (b) { var on = b === s; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on); });
        U.$('[data-err]', root).hidden = true; U.$('[data-stock]', root).innerHTML = N.stockNote(p, st.size);
      }
      if (q) { var inp = U.$('[data-qty]', root); inp.value = Math.max(1, Math.min(+inp.max || 10, (+inp.value || 1) + (+q.getAttribute('data-q')))); st.qty = +inp.value; }
      if (g) N.sizeGuide(N.byId[g.getAttribute('data-sizeguide')]);
    });
    var inp = U.$('[data-qty]', root); if (inp) inp.addEventListener('change', function () { inp.value = Math.max(1, Math.min(+inp.max || 10, Math.round(+inp.value) || 1)); st.qty = +inp.value; });
  };
  N.pickerError = function (root, msg) { var e = U.$('[data-err]', root); e.textContent = msg; e.hidden = false; };
  N.tryAdd = function (root, p, st) {
    if (!st.size) { N.pickerError(root, 'Please select a size.'); var f = U.$('.size:not(.is-out)', root); f && f.focus(); return null; }
    var r = N.db.add(p.id, { size: st.size, color: st.color, qty: st.qty || 1 });
    if (!r.ok) { N.pickerError(root, r.msg); return null; }
    U.$('[data-stock]', root).innerHTML = N.stockNote(p, st.size);
    return r;
  };
  N.firstSize = function (p) { return p.sizes.length === 1 && N.inStock(p, p.sizes[0]) ? p.sizes[0] : null; };

  /* ---------- quick view ---------- */
  N.quickView = function (id) {
    var p = N.byId[id]; if (!p) return;
    var st = { color: p.colors[0].n, size: N.firstSize(p), qty: 1 }, k = 0, out = !N.inStock(p);
    var L = N.layer('<div class="qv"><div class="qv__media"><div class="qv__img" data-qvimg>' + U.img(p.imgs[0], { widths: [500, 800, 1100], sizes: '(max-width: 760px) 100vw, 50vw', alt: p.name, pos: p.pos && p.pos[0] }) + '</div>' +
        (p.imgs.length > 1 ? '<div class="qv__nav"><button type="button" class="qv__arr" data-step="-1" aria-label="Previous image">' + i('left', 20) + '</button><span data-qvn>1 / ' + p.imgs.length + '</span><button type="button" class="qv__arr" data-step="1" aria-label="Next image">' + i('right', 20) + '</button></div>' : '') + '</div>' +
      '<div class="qv__info"><p class="eyebrow eyebrow--accent">' + esc(p.type) + '</p><h2 class="qv__t" id="qvt">' + esc(p.name) + '</h2><div class="qv__price">' + N.priceHtml(p) + '</div>' +
        '<p class="qv__d">' + esc(p.desc) + '</p>' + N.picker(p, st) +
        '<div class="buy">' + N.qtyHtml(1, 10) + '<button type="button" class="btn btn--accent btn--block" data-add' + (out ? ' disabled' : '') + '>' + (out ? 'Sold out' : 'Add to bag — ' + U.money(p.price)) + '</button></div>' +
        '<a class="link" href="' + N.href('product/' + p.slug) + '" data-close>View full details' + i('arrow', 16) + '</a></div></div>',
      { label: 'Quick view: ' + p.name });
    var box = L.box;
    function show(n) {
      k = (n + p.imgs.length) % p.imgs.length;
      U.$('[data-qvimg]', box).innerHTML = U.img(p.imgs[k], { widths: [500, 800, 1100], sizes: '(max-width: 760px) 100vw, 50vw', alt: p.name, pos: p.pos && p.pos[k] });
      var c = U.$('[data-qvn]', box); if (c) c.textContent = (k + 1) + ' / ' + p.imgs.length;
    }
    box.addEventListener('click', function (e) {
      var s = e.target.closest('[data-step]'); if (s) show(k + +s.getAttribute('data-step'));
      if (e.target.closest('[data-add]')) {
        var r = N.tryAdd(box, p, st); if (!r) return;
        L.close(); N.added(p, r);
      }
    });
    N.wirePicker(box, p, st, { onColor: function (c) { if (c && p.imgs[c.img]) show(c.img); } });
  };

  /* ---------- mini bag after adding ---------- */
  N.added = function (p, r) {
    var l = r.line, tt = N.db.totals();
    N.layer('<div class="mini"><p class="mini__h">' + i('check', 18) + 'Added to your bag</p>' +
      '<div class="mini__row"><span class="mini__img">' + U.img(p.imgs[(p.colors.filter(function (c) { return c.n === l.color; })[0] || {}).img || 0], { widths: [200, 360], sizes: '96px', alt: '', pos: p.pos && p.pos[0] }) + '</span>' +
      '<div><b>' + esc(p.name) + '</b><small>' + esc(l.color) + ' · Size ' + esc(l.size) + ' · Qty ' + r.qty + '</small><span>' + U.money(p.price * r.qty) + '</span></div></div>' +
      (r.capped ? '<p class="note">We added the last ' + r.qty + ' available in this size.</p>' : '') +
      '<div class="mini__sum"><span>Bag subtotal (' + U.plural(N.db.count(), 'item') + ')</span><b>' + U.money(tt.sub) + '</b></div>' +
      (tt.toFree > 0 ? '<p class="mini__free">Add ' + U.money(tt.toFree) + ' more for free delivery.</p>' : '<p class="mini__free mini__free--ok">' + i('truck', 16) + 'Your order qualifies for free delivery.</p>') +
      '<a class="btn btn--accent btn--block" href="' + N.href('checkout') + '" data-close data-focus>Checkout</a><a class="btn btn--line btn--block" href="' + N.href('bag') + '" data-close>View bag</a>' +
      '<button type="button" class="link mini__cont" data-close>Continue shopping</button></div>', { cls: 'layer--right', label: 'Added to bag' });
  };

  /* ---------- size guide ---------- */
  N.sizeGuide = function (p) {
    var g = p && p.sizes[0] === '28' ? N.sizeGuide.jeans() : N.sizeGuide.tops();
    N.layer('<div class="sg"><p class="eyebrow">Size guide</p><h2>' + (p ? esc(p.name) : 'Find your size') + '</h2>' + g +
      '<p class="sg__note">Body measurements in centimetres. ' + (p ? esc(p.fit) : '') + '</p>' +
      '<p class="sg__note">Between sizes? Take the larger size for a relaxed fit, or <a class="link" href="' + N.href('custom-made') + '" data-close>ask about a custom fit</a>.</p></div>', { label: 'Size guide' });
  };
  function table(t) { return '<div class="tbl"><table><thead><tr>' + t.head.map(function (h) { return '<th scope="col">' + h + '</th>'; }).join('') + '</tr></thead><tbody>' + t.rows.map(function (r) { return '<tr>' + r.map(function (c, k) { return k ? '<td>' + c + '</td>' : '<th scope="row">' + c + '</th>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>'; }
  N.sizeGuide.tops = function () { return '<h3 class="sg__h">Tops, jackets & trousers</h3>' + table(N.sizeData.tops); };
  N.sizeGuide.jeans = function () { return '<h3 class="sg__h">Jeans</h3>' + table(N.sizeData.jeans); };

  /* ---------- accordions ---------- */
  N.acc = function (items) { return '<div class="acc">' + items.map(function (it) { return '<details class="acc__i"' + (it.open ? ' open' : '') + '><summary>' + esc(it.t) + i('plus', 18) + '</summary><div class="acc__b">' + it.b + '</div></details>'; }).join('') + '</div>'; };

  /* ---------- breadcrumbs ---------- */
  N.crumbs = function (items) { return '<nav class="crumbs" aria-label="Breadcrumb"><ol>' + items.map(function (c, k) { return '<li>' + (c[1] != null && k < items.length - 1 ? '<a href="' + N.href(c[1]) + '">' + esc(c[0]) + '</a>' : '<span aria-current="page">' + esc(c[0]) + '</span>') + '</li>'; }).join('') + '</ol></nav>'; };
})();
