/* ==========================================================================
   CRÈME MOTION — the site
   Reads CREME.config (config/site.config.js), the menu (data/menu.js), the
   cake designer options (data/designer.js) and editorial content
   (data/content.js), then builds every section. No brand content lives here.
   ========================================================================== */
(function () {
  'use strict';
  var C = CREME.config, P = CREME.products, CATS = CREME.categories, DZ = CREME.designer || null;
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MOBILE = window.matchMedia('(max-width: 900px)');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var money = function (n) { return (C.currency.prefix || '') + Math.round(Number(n)).toLocaleString(C.currency.locale || undefined); };
  var pic = function (src, w) { return 'img/p/' + src + '-' + (w || 800) + '.webp'; };
  var srcset = function (src) { return pic(src, 800) + ' 800w, ' + pic(src, 1600) + ' 1600w'; };
  var byId = function (id) { for (var i = 0; i < P.length; i++) if (P[i].id === id) return P[i]; return null; };
  var catLabel = function (id) { for (var i = 0; i < CATS.length; i++) if (CATS[i].id === id) return CATS[i].label; return ''; };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var phoneHref = function (p) { return 'tel:' + String(p).replace(/[^\d+]/g, ''); };
  var CH = C.order || {};               /* ordering channels */
  var hasPhone = !!(C.contact && C.contact.phone);

  var I = {
    wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2s.2-1.1.1-1.2-.2-.2-.4-.3z"/></svg>',
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 8h14l-1.2 12.1a1 1 0 0 1-1 .9H7.2a1 1 0 0 1-1-.9L5 8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>',
    l: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    r: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
    replay: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5"/><path d="M4 4v4.5h4.5"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 12l16-8-6 16-2.5-6.5L4 12z"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    brush: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M14 4l6 6-8.5 8.5a3 3 0 0 1-4.2 0l-1.8-1.8a3 3 0 0 1 0-4.2L14 4z"/><path d="M4 20c2 0 3-1 3-3"/></svg>'
  };

  /* ---------------- theme, fonts, meta ---------------- */
  (function theme() {
    var r = document.documentElement.style, t = C.theme || {};
    Object.keys(t).forEach(function (k) { r.setProperty('--' + k, t[k]); });
    if (C.fonts) {
      if (C.fonts.display) r.setProperty('--display', C.fonts.display);
      if (C.fonts.body) r.setProperty('--body', C.fonts.body);
      if (C.fonts.href) { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = C.fonts.href; document.head.appendChild(l); }
    }
    if (C.brand.logoHeight) r.setProperty('--logo-h', C.brand.logoHeight + 'px');
    if (C.hero && C.hero.background) r.setProperty('--hero-bg', C.hero.background);
    if (C.seo) { document.title = C.seo.title; var d = $('meta[name="description"]'); if (d) d.content = C.seo.description; }
    var fi = $('link[rel="icon"]'); if (fi && C.brand.favicon) fi.href = C.brand.favicon;
    if (RM) document.documentElement.classList.add('rm-all');
  })();
  function logoHTML() {
    if (C.brand.logo) return '<img src="' + esc(C.brand.logo) + '" alt="' + esc(C.brand.name) + '">';
    return esc(C.brand.name).replace(/ (&amp;|and) /, ' <i>$1</i> ');
  }

  /* ---------------- toast ---------------- */
  var toastEl, toastT;
  function toast(msg, action, fn) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); toastEl.setAttribute('aria-live', 'polite'); document.body.appendChild(toastEl); }
    toastEl.innerHTML = '<span>' + esc(msg) + '</span>' + (action ? '<button type="button">' + esc(action) + '</button>' : '');
    if (action) toastEl.querySelector('button').onclick = function () { toastEl.classList.remove('on'); fn(); };
    toastEl.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('on'); }, 4500);
  }

  /* ---------------- dialogs ---------------- */
  function openDlg(d) { if (!d.open) { d.showModal(); document.body.classList.add('lock'); } }
  function closeDlg(d, cb) {
    if (!d.open) { if (cb) cb(); return; }
    var done = function () { d.classList.remove('closing'); d.close(); if (!$$('dialog[open]').length) document.body.classList.remove('lock'); if (cb) cb(); };
    if (RM || !(d.classList.contains('sheet') || d.classList.contains('drawer'))) return done();
    d.classList.add('closing'); setTimeout(done, 330);
  }
  function wireDlg(d, onClose) {
    d.addEventListener('cancel', function (e) { e.preventDefault(); onClose ? onClose() : closeDlg(d); });
    d.addEventListener('click', function (e) { if (e.target === d) onClose ? onClose() : closeDlg(d); });
  }

  /* ---------------- sending: WhatsApp, email, call, form endpoint ---------------- */
  var WA_NUM = String((C.whatsapp && C.whatsapp.number) || '').replace(/\D/g, '');
  function waURL(text) { return 'https://wa.me/' + WA_NUM + '?text=' + encodeURIComponent(text); }
  var waDlg;
  function sendWA(text) {
    if (WA_NUM || !C.demo) { window.open(waURL(text), '_blank', 'noopener'); return; }
    if (!waDlg) {
      waDlg = document.createElement('dialog'); waDlg.className = 'wa-prev'; waDlg.setAttribute('aria-labelledby', 'waT');
      waDlg.innerHTML = '<h2 id="waT">Your WhatsApp message</h2><p>Template preview: this is the message your customer sends. Add the bakery’s number in <b>config/site.config.js</b> and the button opens that chat straight away.</p><div class="bubble"></div><div class="row"><a class="btn wa" target="_blank" rel="noopener">' + I.wa + 'Open WhatsApp</a><button type="button" class="btn ghost" data-copy>Copy message</button></div><button type="button" class="x" aria-label="Close">' + I.x + '</button>';
      document.body.appendChild(waDlg); wireDlg(waDlg);
      waDlg.querySelector('.x').onclick = function () { closeDlg(waDlg); };
      waDlg.querySelector('[data-copy]').onclick = function () {
        var t = waDlg.querySelector('.bubble').textContent;
        (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { toast('Message copied'); }, function () { toast('Select the text to copy it'); });
      };
      waDlg.querySelector('a').addEventListener('click', function () { setTimeout(function () { closeDlg(waDlg); }, 200); });
    }
    waDlg.querySelector('.bubble').textContent = text;
    waDlg.querySelector('a').href = waURL(text);
    openDlg(waDlg);
  }
  /* order request: POST to the configured endpoint, or open an email */
  function sendRequest(subject, text, extra, file) {
    var ep = C.orders && C.orders.endpoint;
    if (ep) {
      var d = new FormData(); d.append('subject', subject); d.append('summary', text);
      Object.keys(extra || {}).forEach(function (k) { d.append(k, extra[k]); }); if (file) d.append('reference', file);
      return fetch(ep, { method: 'POST', body: d, headers: { Accept: 'application/json' } }).then(function (r) { if (!r.ok) throw new Error(r.status); return 'post'; });
    }
    var to = (C.contact && C.contact.email) || '';
    location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(text);
    return Promise.resolve('mail');
  }

  /* ---------------- pricing ---------------- */
  function sizesOf(p) { return p.flavorTable ? CREME.flavorTables[p.flavorTable].sizes.map(function (s) { return s; }) : (p.sizes || []); }
  function flavorsOf(p) {
    var list = p.flavorTable ? CREME.flavorTables[p.flavorTable].flavors : (p.flavors || []);
    return list.map(function (f) { return typeof f === 'string' ? { name: f } : f; });
  }
  function optionsOf(p) { return (p.options || []).map(function (o) { return o === 'frosting' ? CREME.frosting : o; }); }
  function basePrice(p, si, fi) {
    var s = sizesOf(p)[si] || {}, f = flavorsOf(p)[fi];
    if (f && f.prices) return f.prices[si];
    var b = s.price || 0;
    if (f && f.extra) b += Array.isArray(f.extra) ? (f.extra[si] || 0) : f.extra;
    return b;
  }
  function minPrice(p) { var n = sizesOf(p).length, fl = flavorsOf(p), m = Infinity; for (var i = 0; i < n; i++) { if (fl.length) fl.forEach(function (f, j) { m = Math.min(m, basePrice(p, i, j)); }); else m = Math.min(m, basePrice(p, i, -1)); } return m; }
  function hasRange(p) { var n = sizesOf(p).length, fl = flavorsOf(p); return n > 1 || fl.some(function (f) { return f.prices || f.extra; }) || (p.options && p.options.length) || p.addons; }
  function addonPrice(name) { for (var i = 0; i < CREME.addons.length; i++) if (CREME.addons[i].name === name) return CREME.addons[i].price || 0; return 0; }
  function lineTotal(l) {
    var p = byId(l.id); if (!p) return 0;
    var t = basePrice(p, l.si, l.fi);
    optionsOf(p).forEach(function (o, k) { var c = o.choices[(l.oi || [])[k] || 0]; if (c && c.price) t += c.price; });
    (l.addons || []).forEach(function (a) { t += addonPrice(a); });
    if (l.custom) t = l.custom.total;
    return t * (l.qty || 1);
  }
  function lineDesc(l) {
    if (l.custom) return l.custom.lines;
    var p = byId(l.id), out = [], s = sizesOf(p)[l.si], f = flavorsOf(p)[l.fi];
    if (s && sizesOf(p).length > 1 || (s && !p.unit)) out.push('Size: ' + s.label);
    if (f) out.push('Flavour: ' + (f.short || f.name));
    if (l.picks && l.picks.length) out.push('Flavours: ' + l.picks.join(', '));
    optionsOf(p).forEach(function (o, k) { var c = o.choices[(l.oi || [])[k] || 0]; if (c && k >= 0 && ((l.oi || [])[k] || c.price)) out.push(o.label + ': ' + c.name); });
    if (l.addons && l.addons.length) out.push('Add-ons: ' + l.addons.join(', '));
    if (l.msg) out.push('Message on the cake: “' + l.msg + '”');
    if (l.note) out.push('Note: ' + l.note);
    if (p.unit && l.qty > 1) out.push(p.qtyLabel + ': ' + l.qty);
    else if (l.qty > 1) out.push('Quantity: ' + l.qty);
    return out;
  }
  function productMsg(l) {
    var w = C.whatsapp || {}, p = byId(l.id) || { name: 'custom cake' };
    var bits = lineDesc(l);
    return (w.greeting || "Hello! I'd like to order") + ' the ' + (l.custom ? 'custom cake I designed' : p.name) + '.' + (bits.length ? ' ' + bits.join('. ') + '.' : '') + ' Estimated total: ' + money(lineTotal(l)) + '. ' + (w.closing || 'Please confirm availability.');
  }

  /* ---------------- order list ---------------- */
  var BAG_KEY = 'creme-order-' + (C.brand.short || 'site');
  var bag = [];
  try { bag = JSON.parse(localStorage.getItem(BAG_KEY) || '[]').filter(function (l) { return l.custom || byId(l.id); }); } catch (e) { bag = []; }
  function saveBag() { try { localStorage.setItem(BAG_KEY, JSON.stringify(bag)); } catch (e) {} renderBagCount(); }
  function addToBag(l) {
    var key = JSON.stringify([l.id, l.si, l.fi, l.oi, l.addons, l.picks, l.msg, l.note, l.custom && l.custom.lines]);
    var ex = bag.filter(function (b) { return b.key === key; })[0];
    if (ex) ex.qty += l.qty; else { l.key = key; bag.push(l); }
    saveBag(); $$('.bag .n, .mbar .n').forEach(function (n) { n.classList.remove('pop'); void n.offsetWidth; n.classList.add('pop'); });
  }
  function bagCount() { return bag.reduce(function (a, l) { return a + (l.qty || 1); }, 0); }
  function renderBagCount() {
    var c = bagCount();
    $$('.bag .n, .mbar .n').forEach(function (n) { n.textContent = c; n.hidden = !c && n.closest('.mbar'); });
    $$('.bag, .mbar-bag').forEach(function (b) { b.setAttribute('aria-label', 'Your order, ' + c + ' item' + (c === 1 ? '' : 's')); });
  }

  /* ---------------- nav, menu, hero ---------------- */
  var app = $('#app');
  function navHTML() {
    var links = C.nav.map(function (n) { return '<li><a href="' + n.href + '">' + esc(n.label) + '</a></li>'; }).join('');
    return '<header class="nav on-hero" id="nav"><div class="wrap">' +
      '<a class="logo" href="#top" aria-label="' + esc(C.brand.name) + ', home">' + logoHTML() + '</a>' +
      '<nav aria-label="Main"><ul class="nav-links">' + links + '</ul></nav>' +
      '<div class="nav-act"><button type="button" class="nav-wa" data-wa-general>' + I.wa + '<span>Order on WhatsApp</span></button><button type="button" class="bag" data-bag aria-label="Your order">' + I.bag + '<span class="t">Your order</span><span class="n">0</span></button>' +
      '<button type="button" class="burger" aria-label="Open menu" aria-expanded="false" aria-controls="menu"><span></span><span></span></button></div>' +
      '</div></header>' +
      '<div class="menu" id="menu" aria-hidden="true"><div class="menu-in"><ol>' + C.nav.map(function (n, i) { return '<li><a href="' + n.href + '" style="--i:' + i + '" tabindex="-1">' + esc(n.label) + '</a></li>'; }).join('') + '</ol>' +
      '<div class="menu-cta"><button type="button" class="btn wa" data-wa-general tabindex="-1">' + I.wa + 'Order on WhatsApp</button>' + (hasPhone ? '<a class="btn light" href="' + phoneHref(C.contact.phone) + '" tabindex="-1">' + I.phone + 'Call to order</a>' : '') + '</div>' +
      '<div class="menu-foot">' + (hasPhone ? '<span>' + esc(C.contact.phone) + '</span>' : '') + (C.contact.email ? '<span>' + esc(C.contact.email) + '</span>' : '') + '</div></div></div>';
  }
  /* The hero is a photograph. With hero.reveal set it opens with a line of light that parts the frame, then the
     camera eases back from the cake's layers to the whole scene. With hero.video set, a film plays instead. */
  function heroHTML() {
    var h = C.hero, wi = 0, R = h.reveal;
    var lines = h.headline.map(function (ln) { return '<span class="ln">' + ln.split(' ').map(function (w) { return '<span class="w" style="--i:' + (wi++) + '">' + esc(w) + '</span>'; }).join(' ') + '</span>'; }).join('');
    var media = R ? '<div class="hero-img"><picture>' + (R.image.mobile ? '<source media="(max-width: 700px) and (orientation: portrait)" srcset="' + R.image.mobile + '">' : '') +
        '<img src="' + R.image.desktop + '"' + (R.image.tablet ? ' srcset="' + R.image.tablet + ' 1500w, ' + R.image.desktop + ' 2600w" sizes="100vw"' : '') + ' alt="' + esc(h.alt) + '" fetchpriority="high" decoding="async"></picture></div>' +
        '<i class="hero-cur l" aria-hidden="true"></i><i class="hero-cur r" aria-hidden="true"></i><i class="hero-line" aria-hidden="true"></i>'
      : '<video muted playsinline preload="auto" aria-hidden="true" tabindex="-1"></video><img class="still" alt="' + esc(h.alt) + '">';
    return '<section class="hero' + (R ? ' is-reveal' : ' is-video') + '" id="top" aria-label="Welcome">' +
      '<div class="hero-media" data-hero-media>' + media + '<div class="hero-shade" aria-hidden="true"></div></div>' +
      '<div class="hero-copy"><div class="wrap"><div class="inner">' +
      '<span class="kicker">' + esc(h.kicker) + '</span>' +
      '<h1 aria-label="' + esc(h.headline.join(' ')) + '">' + lines + '</h1>' +
      '<p class="lead">' + esc(h.text) + '</p>' +
      '<div class="cta"><a class="btn light" href="' + h.primary.href + '">' + esc(h.primary.label) + '</a><a class="btn ghost-light" href="' + h.secondary.href + '">' + esc(h.secondary.label) + '</a></div>' +
      '</div></div></div>' +
      '<div class="hero-meta"><button type="button" class="replay" hidden>' + I.replay + '<span>Replay</span></button><a class="scroll-cue" href="#collection"><i></i>Scroll</a></div>' +
      '</section>';
  }
  function howHTML() {
    var steps = (CREME.ordering && CREME.ordering.steps) || [];
    return '<section class="how" aria-label="How to order"><div class="wrap"><ol class="how-steps">' +
      steps.map(function (s, i) { return '<li><b>' + pad(i + 1) + '</b><div><h3>' + esc(s.title) + '</h3><p>' + esc(s.text) + '</p></div></li>'; }).join('') +
      '</ol></div></section>';
  }

  /* ---------------- collection (the menu) ---------------- */
  function cardHTML(p) {
    var a = p.images[0], b = p.images[1], from = hasRange(p);
    return '<article class="card" data-id="' + p.id + '" data-c="' + p.category + '">' +
      '<button type="button" class="card-fig" data-open="' + p.id + '" aria-label="' + esc(p.name) + ': choose size, flavour and extras">' +
      '<img src="' + pic(a.src) + '" srcset="' + srcset(a.src) + '" sizes="(max-width: 640px) 48vw, (max-width: 1100px) 46vw, 30vw" alt="' + esc(a.alt) + '" loading="lazy" decoding="async"' + (a.pos ? ' style="object-position:' + a.pos + '"' : '') + '>' +
      (b ? '<img class="alt" src="' + pic(b.src) + '" alt="" loading="lazy" decoding="async"' + (b.pos ? ' style="object-position:' + b.pos + '"' : '') + '>' : '') +
      '<span class="card-view" aria-hidden="true">View & order</span></button>' +
      '<div class="card-body"><div class="card-top"><h3><a href="#product/' + p.id + '" data-open="' + p.id + '">' + esc(p.name) + '</a></h3>' +
      '<p class="price">' + (from ? '<small>from</small>' : '') + money(minPrice(p)) + (p.unit ? '<small>per ' + esc(p.unit) + '</small>' : '') + '</p></div>' +
      '<p class="card-sub">' + esc(p.short) + '</p>' +
      '<div class="card-act"><button type="button" class="card-ord" data-open="' + p.id + '">Choose options<i aria-hidden="true">' + I.r + '</i></button>' +
      '<button type="button" class="card-wa" data-wa="' + p.id + '" aria-label="Ask about ' + esc(p.name) + ' on WhatsApp">' + I.wa + '</button></div></div>' +
      '</article>';
  }
  function promoHTML() {
    if (!DZ) return '';
    var img = (DZ.previewPath || 'img/studio/') + ((DZ.previews && DZ.previews[1] && DZ.previews[1].image) || 'round-vintage') + '.webp';
    return '<article class="card promo"><a class="promo-in" href="#design"><img src="' + img + '" alt="" loading="lazy" decoding="async">' +
      '<span class="promo-t"><span class="kicker">Made for you</span><b>Design your own cake</b><span>Choose the shape, colour and finish and see the price as you go.</span><span class="promo-go">Open the cake studio' + I.r + '</span></span></a></article>';
  }
  function collectionHTML() {
    var counts = {}; P.forEach(function (p) { counts[p.category] = (counts[p.category] || 0) + 1; });
    var idx = '<button type="button" class="ci" data-cat="all" aria-pressed="true"><span>All cakes</span><sup>' + P.length + '</sup></button>' +
      CATS.filter(function (c) { return counts[c.id]; }).map(function (c) { return '<button type="button" class="ci" data-cat="' + c.id + '" aria-pressed="false"><span>' + esc(c.label) + '</span><sup>' + counts[c.id] + '</sup></button>'; }).join('');
    var cards = P.map(cardHTML); cards.splice(Math.min(5, cards.length), 0, promoHTML());
    return '<section class="sec coll" id="collection" aria-labelledby="collT"><div class="wrap">' +
      '<div class="sec-head"><div><div class="chap rv"><b>01</b><span class="kicker">The menu</span></div><h2 class="h-sec split" id="collT">Baked to be <em>remembered.</em></h2></div>' +
      '<p class="lead rv">Choose a cake, then its size, flavour and finishing touches. The price updates as you go, and you send the order on WhatsApp, as an order request or by phone.</p></div>' +
      '<div class="ci-bar"><div class="ci-row" role="group" aria-label="Filter the menu">' + idx + '</div></div>' +
      '<div class="grid" id="grid">' + cards.join('') + '</div>' +
      '</div></section>';
  }
  function filterGrid(cat) {
    var apply = function () {
      $$('.ci').forEach(function (t) { t.setAttribute('aria-pressed', t.dataset.cat === cat ? 'true' : 'false'); });
      var k = 0;
      $$('#grid .card').forEach(function (c) {
        var show = c.classList.contains('promo') ? cat === 'all' : (cat === 'all' || c.dataset.c === cat);
        c.classList.toggle('hidden', !show); c.classList.remove('enter');
        if (show && !RM) { void c.offsetWidth; c.style.setProperty('--k', k++); c.classList.add('enter'); }
      });
    };
    if (document.startViewTransition && !RM) document.startViewTransition(apply); else apply();
    var bar = $('.ci-bar'), g = $('#grid'), top = g.getBoundingClientRect().top;
    if (top < 0 || top > window.innerHeight * 0.6) window.scrollTo({ top: window.scrollY + bar.getBoundingClientRect().top - navH() + 1, behavior: RM ? 'auto' : 'smooth' });
    var act = $('.ci[data-cat="' + cat + '"]'), row = $('.ci-row');
    if (act && row) row.scrollTo({ left: act.offsetLeft - row.clientWidth / 2 + act.offsetWidth / 2, behavior: RM ? 'auto' : 'smooth' });
  }
  function navH() { var n = $('#nav'); return n ? n.getBoundingClientRect().bottom : 70; }

  /* ---------------- product sheet ---------------- */
  var sheet, cur = null, sel = {};
  function sheetShell() { sheet = document.createElement('dialog'); sheet.className = 'sheet'; sheet.id = 'sheet'; sheet.setAttribute('aria-labelledby', 'pName'); document.body.appendChild(sheet); wireDlg(sheet, closeProduct); }
  function chipGroup(name, items, checked, type) {
    return '<div class="chips">' + items.map(function (it, i) { return '<label class="chip"><input type="' + (type || 'radio') + '" name="' + name + '" value="' + i + '"' + (i === checked ? ' checked' : '') + '><span>' + it + '</span></label>'; }).join('') + '</div>';
  }
  function openProduct(id, push) {
    var p = byId(id); if (!p) return;
    var sizes = sizesOf(p), fls = flavorsOf(p), opts = optionsOf(p);
    cur = p; sel = { si: 0, fi: fls.length ? 0 : -1, oi: opts.map(function () { return 0; }), addons: [], picks: [], qty: 1, msg: '', note: '', img: 0 };
    var opener = document.activeElement;
    var flavHTML = '';
    if (fls.length) {
      if (fls.length > 8) flavHTML = '<div class="opt"><label class="lab" for="pFl">Flavour</label><select id="pFl" class="sel">' + fls.map(function (f, i) { return '<option value="' + i + '">' + esc(f.name) + '</option>'; }).join('') + '</select></div>';
      else flavHTML = '<fieldset class="opt"><legend>Flavour</legend>' + chipGroup('flv', fls.map(function (f) { return esc(f.name) + (f.extra && !Array.isArray(f.extra) ? '<small>+' + money(f.extra) + '</small>' : ''); }), 0) + '</fieldset>';
    }
    var addonHTML = '';
    if (p.addons) {
      var groups = {}; CREME.addons.forEach(function (a, i) { (groups[a.group] = groups[a.group] || []).push(i); });
      addonHTML = '<details class="opt addons"><summary><span>Add toppers & extras</span><small data-addc>Optional</small><i aria-hidden="true"></i></summary>' +
        Object.keys(groups).map(function (g) { return '<p class="lab">' + esc(g) + '</p><div class="chips">' + groups[g].map(function (i) { var a = CREME.addons[i]; return '<label class="chip"><input type="checkbox" name="add" value="' + esc(a.name) + '"><span>' + esc(a.name) + '<small>+' + money(a.price) + '</small></span></label>'; }).join('') + '</div>'; }).join('') + '</details>';
    }
    sheet.innerHTML = '<div class="sheet-in">' +
      '<div class="gal"><div class="gal-main" data-gal>' + p.images.map(function (im, i) { return '<img ' + (i === 0 ? 'class="on" ' : '') + 'src="' + pic(im.src, 1600) + '" srcset="' + srcset(im.src) + '" sizes="(max-width: 900px) 100vw, 56vw" alt="' + esc(im.alt) + '"' + (im.pos ? ' style="object-position:' + im.pos + '"' : '') + '>'; }).join('') +
      (p.images.length > 1 ? '<span class="gal-count" aria-hidden="true">01 / ' + pad(p.images.length) + '</span><div class="gal-nav"><button type="button" data-g="-1" aria-label="Previous photo">' + I.l + '</button><button type="button" data-g="1" aria-label="Next photo">' + I.r + '</button></div>' : '') + '</div>' +
      (p.images.length > 1 ? '<div class="thumbs" role="group" aria-label="Photos">' + p.images.map(function (im, i) { return '<button type="button" data-t="' + i + '" aria-label="Photo ' + (i + 1) + '"' + (i === 0 ? ' aria-current="true"' : '') + '><img src="' + pic(im.src) + '" alt=""></button>'; }).join('') + '</div>' : '') +
      '</div>' +
      '<div class="info">' +
      '<span class="kicker">' + esc(catLabel(p.category)) + '</span>' +
      '<h2 id="pName">' + esc(p.name) + '</h2>' +
      '<p class="desc">' + esc(p.description) + '</p>' +
      (sizes.length > 1 ? '<fieldset class="opt"><legend>Size</legend>' + chipGroup('size', sizes.map(function (s) { return esc(s.label) + (s.serves ? '<small>Serves ' + esc(s.serves) + '</small>' : ''); }), 0) + '</fieldset>' : (sizes[0] ? '<p class="one-size">' + esc(sizes[0].label) + (sizes[0].serves ? ' · serves ' + esc(sizes[0].serves) : '') + '</p>' : '')) +
      flavHTML +
      (p.pick ? '<fieldset class="opt" data-pick="' + p.pick.count + '"><legend>' + esc(p.pick.label) + ' <small data-pickc>0 of ' + p.pick.count + '</small></legend>' + '<div class="chips">' + p.pick.from.map(function (f) { return '<label class="chip"><input type="checkbox" name="pick" value="' + esc(f) + '"><span>' + esc(f) + '</span></label>'; }).join('') + '</div></fieldset>' : '') +
      opts.map(function (o, k) { return '<fieldset class="opt"><legend>' + esc(o.label) + '</legend>' + chipGroup('opt' + k, o.choices.map(function (c) { return esc(c.name) + (c.price ? '<small>+' + money(c.price) + '</small>' : ''); }), 0) + '</fieldset>'; }).join('') +
      addonHTML +
      (p.message ? '<div class="opt"><label class="lab" for="pMsg">Message on the cake <small>(optional)</small></label><input class="note-in" id="pMsg" maxlength="40" placeholder="e.g. Happy 21st, Amani"></div>' : '') +
      (p.upload ? '<p class="hint">' + I.up + 'You can send your photos or logo in the WhatsApp chat after ordering.</p>' : '') +
      '<div class="opt"><label class="lab" for="pNote">Anything else? <small>(optional)</small></label><input class="note-in" id="pNote" maxlength="160" placeholder="Colours, theme, allergies, delivery time…"></div>' +
      (p.details && p.details.length ? '<dl class="det">' + (p.lead ? '<div><dt>Order ahead</dt><dd>' + esc(p.lead) + '</dd></div>' : '') + p.details.map(function (d) { return '<div><dt>' + esc(d[0]) + '</dt><dd>' + esc(d[1]) + '</dd></div>'; }).join('') + '</dl>' : '') +
      '<div class="buybar"><div class="bb-top"><div class="qty" role="group" aria-label="' + esc(p.qtyLabel || 'Quantity') + '"><button type="button" data-q="-1" aria-label="One less">−</button><output aria-live="polite">1</output><button type="button" data-q="1" aria-label="One more">+</button></div>' +
      '<div class="bb-price"><small>Estimated total</small><b data-price>' + money(minPrice(p)) + '</b></div></div>' +
      '<div class="bb-btns"><button type="button" class="btn wa" data-sheet-wa>' + I.wa + 'Order on WhatsApp</button><button type="button" class="btn ghost" data-sheet-add>' + I.plus + 'Add to my order</button></div></div>' +
      '</div></div><button type="button" class="x" aria-label="Close">' + I.x + '</button>';
    sheet._opener = opener;
    updatePrice();
    openDlg(sheet);
    var h2 = sheet.querySelector('#pName'); h2.tabIndex = -1; h2.focus({ preventScroll: true });
    sheet.querySelector('.info').scrollTop = 0; sheet.querySelector('.sheet-in').scrollTop = 0;
    if (push !== false) history.pushState({ p: id }, '', location.pathname + location.search + '#product/' + id);
    bindSheet(p);
  }
  function curLine() { return { id: cur.id, si: sel.si, fi: sel.fi, oi: sel.oi.slice(), addons: sel.addons.slice(), picks: sel.picks.slice(), msg: sel.msg.trim(), note: sel.note.trim(), qty: sel.qty }; }
  function updatePrice() {
    sheet.querySelector('[data-price]').textContent = money(lineTotal(curLine()));
    var o = sheet.querySelector('.buybar output'); if (o) o.textContent = sel.qty;
    var ac = sheet.querySelector('[data-addc]'); if (ac) ac.textContent = sel.addons.length ? sel.addons.length + ' added' : 'Optional';
  }
  function setImg(n) {
    var imgs = $$('.gal-main img', sheet); if (imgs.length < 2) return;
    sel.img = (n + imgs.length) % imgs.length;
    imgs.forEach(function (im, i) { im.classList.toggle('on', i === sel.img); });
    $$('.thumbs button', sheet).forEach(function (b, i) { b.setAttribute('aria-current', i === sel.img ? 'true' : 'false'); });
    var c = $('.gal-count', sheet); if (c) c.textContent = pad(sel.img + 1) + ' / ' + pad(imgs.length);
  }
  function bindSheet(p) {
    sheet.querySelector('.x').onclick = closeProduct;
    $$('input[name="size"]', sheet).forEach(function (r) { r.onchange = function () { sel.si = +r.value; updatePrice(); }; });
    $$('input[name="flv"]', sheet).forEach(function (r) { r.onchange = function () { sel.fi = +r.value; updatePrice(); }; });
    var fs = $('#pFl', sheet); if (fs) fs.onchange = function () { sel.fi = +fs.value; updatePrice(); };
    optionsOf(p).forEach(function (o, k) { $$('input[name="opt' + k + '"]', sheet).forEach(function (r) { r.onchange = function () { sel.oi[k] = +r.value; updatePrice(); }; }); });
    $$('input[name="add"]', sheet).forEach(function (c) { c.onchange = function () { sel.addons = $$('input[name="add"]:checked', sheet).map(function (x) { return x.value; }); updatePrice(); }; });
    var pk = $('[data-pick]', sheet);
    if (pk) $$('input[name="pick"]', pk).forEach(function (c) { c.onchange = function () {
      var on = $$('input[name="pick"]:checked', pk), max = +pk.dataset.pick;
      if (on.length > max) { c.checked = false; toast('Choose up to ' + max + ' flavours'); on = $$('input[name="pick"]:checked', pk); }
      sel.picks = on.map(function (x) { return x.value; }); pk.querySelector('[data-pickc]').textContent = sel.picks.length + ' of ' + max;
    }; });
    $$('[data-q]', sheet).forEach(function (b) { b.onclick = function () { sel.qty = Math.max(1, Math.min(50, sel.qty + +b.dataset.q)); updatePrice(); }; });
    var m = $('#pMsg', sheet); if (m) m.oninput = function () { sel.msg = m.value; };
    $('#pNote', sheet).oninput = function (e) { sel.note = e.target.value; };
    $$('[data-g]', sheet).forEach(function (b) { b.onclick = function () { setImg(sel.img + +b.dataset.g); }; });
    $$('[data-t]', sheet).forEach(function (b) { b.onclick = function () { setImg(+b.dataset.t); }; });
    swipe($('[data-gal]', sheet), function (d) { setImg(sel.img + d); });
    var ok = function () { if (p.pick && sel.picks.length < p.pick.count) { toast('Please choose ' + p.pick.count + ' flavours'); var f = $('[data-pick]', sheet); f.scrollIntoView({ block: 'center', behavior: RM ? 'auto' : 'smooth' }); return false; } return true; };
    sheet.querySelector('[data-sheet-wa]').onclick = function () { if (ok()) sendWA(productMsg(curLine())); };
    sheet.querySelector('[data-sheet-add]').onclick = function () { if (!ok()) return; addToBag(curLine()); closeProduct(); toast(p.name + ' added to your order', 'View order', openBag); };
    sheet.onkeydown = function (e) { if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return; if (e.key === 'ArrowLeft') setImg(sel.img - 1); if (e.key === 'ArrowRight') setImg(sel.img + 1); };
  }
  function closeProduct(fromPop) {
    var op = sheet._opener;
    closeDlg(sheet, function () { if (op && op.focus && document.contains(op)) op.focus({ preventScroll: true }); });
    if (fromPop !== true && /^#product\//.test(location.hash)) { if (history.state && history.state.p) history.back(); else history.replaceState(null, '', location.pathname + location.search + '#collection'); }
  }
  window.addEventListener('popstate', function () { route(); });
  function route() {
    var m = location.hash.match(/^#product\/([\w-]+)/);
    if (m && byId(m[1])) { if (!sheet.open || !cur || cur.id !== m[1]) openProduct(m[1], false); }
    else if (sheet && sheet.open) closeProduct(true);
  }
  function swipe(el, fn) {
    if (!el) return; var x0 = null, y0 = 0;
    el.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse') return; x0 = e.clientX; y0 = e.clientY; });
    el.addEventListener('pointerup', function (e) { if (x0 == null) return; var dx = e.clientX - x0, dy = e.clientY - y0; x0 = null; if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) fn(dx < 0 ? 1 : -1); });
    el.addEventListener('pointercancel', function () { x0 = null; });
  }

  /* ---------------- experience ---------------- */
  function experienceHTML() {
    var E = CREME.experience;
    return '<section class="sec exp" id="experience" aria-labelledby="expT"><div class="wrap"><div class="exp-grid">' +
      '<div class="exp-stick" aria-hidden="true"><div class="exp-frame">' + E.chapters.map(function (c, i) { return '<figure class="' + (i === 0 ? 'on' : '') + '"><img src="' + pic(c.image, 1600) + '" srcset="' + srcset(c.image) + '" sizes="50vw" alt="" loading="lazy" decoding="async"' + (c.pos ? ' style="object-position:' + c.pos + '"' : '') + '></figure>'; }).join('') +
      '<div class="exp-num"><span>01</span></div><div class="exp-bar"><i></i></div></div></div>' +
      '<div><div class="exp-head"><div class="chap rv"><b>02</b><span class="kicker">' + esc(E.kicker) + '</span></div><h2 class="h-sec split" id="expT">' + esc(E.title).replace(/ in layers\.$/, ' in <em>layers.</em>') + '</h2></div>' +
      E.chapters.map(function (c, i) { return '<article class="ch' + (i === 0 ? ' on' : '') + '" data-ch="' + i + '"><div class="m-img rv-img"><img src="' + pic(c.image) + '" srcset="' + srcset(c.image) + '" sizes="92vw" alt="' + esc(c.alt) + '" loading="lazy" decoding="async"' + (c.pos ? ' style="object-position:' + c.pos + '"' : '') + '></div><span class="n">' + pad(i + 1) + ' / ' + pad(E.chapters.length) + '</span><h3>' + esc(c.title) + '</h3><p>' + esc(c.text) + '</p></article>'; }).join('') +
      '</div></div></div></section>';
  }
  function bindExperience() {
    var figs = $$('.exp-frame figure'), chs = $$('.ch'), num = $('.exp-num span'), bar = $('.exp-bar i'), last = 0;
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; var i = +e.target.dataset.ch; if (i === last) return;
        chs.forEach(function (c, k) { c.classList.toggle('on', k === i); });
        figs.forEach(function (f, k) { f.classList.remove('was'); if (k === last) f.classList.add('was'); f.classList.toggle('on', k === i); });
        last = i; num.textContent = pad(i + 1); bar.style.height = ((i + 1) / chs.length * 100) + '%';
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    chs.forEach(function (c) { io.observe(c); }); bar.style.height = (1 / chs.length * 100) + '%';
  }

  /* ---------------- the cake studio (designer) ----------------
     Five short steps beside a photographic preview. The preview is a real reference photograph chosen by shape and
     piping style (data/designer.js → previews); its frosting is recoloured to the chosen colour in the browser,
     keeping the photo's own light and texture. Prices come only from the configured rules. */
  var dz = { shape: 0, size: 1, flavor: 0, frost: 0, colour: 0, pipe: 1, pipeColour: 2, msg: '', toppers: [], occasion: '', file: null, step: 0 };
  var STEPS = ['Shape & size', 'Flavour', 'Finish', 'Message & toppers', 'Review & send'];
  function dzTable() { return CREME.flavorTables.cake; }
  function dzSizes() { var sh = DZ.shapes[dz.shape].id; return DZ.sizes.map(function (s, i) { return { s: s, i: i }; }).filter(function (x) { return x.s.shapes.indexOf(sh) >= 0; }); }
  function dzBase(o) {
    o = o || dz; var f = dzTable().flavors[o.flavor], s = DZ.sizes[o.size];
    var b = s.table != null ? f.prices[s.table] : f.prices[0] * s.factor;
    return Math.round(b / 50) * 50;
  }
  function dzTotal(o) {
    o = o || dz; var t = dzBase(o), sh = DZ.shapes[o.shape], fr = DZ.frosting[o.frost], c = DZ.colours[o.colour], pp = DZ.piping[o.pipe];
    t += (sh.price || 0) + (fr.price || 0) + (c.price || 0) + (pp.price || 0) + (sh.id === 'tiers' ? DZ.tierExtra : 0);
    o.toppers.forEach(function (n) { t += addonPrice(n); });
    return t;
  }
  function withDz(ch) { var o = {}; for (var k in dz) o[k] = dz[k]; for (var j in ch) o[j] = ch[j]; return o; }
  function dzLines() {
    var s = DZ.sizes[dz.size], out = [];
    if (dz.occasion) out.push('Occasion: ' + dz.occasion);
    out.push('Shape: ' + DZ.shapes[dz.shape].label, 'Size: ' + s.label + ' (serves ' + s.serves + ')', 'Flavour: ' + (dzTable().flavors[dz.flavor].short || dzTable().flavors[dz.flavor].name), 'Frosting: ' + DZ.frosting[dz.frost].name + ', ' + DZ.colours[dz.colour].name.toLowerCase(), 'Piping: ' + DZ.piping[dz.pipe].label + (DZ.piping[dz.pipe].id !== 'smooth' ? ' in ' + DZ.colours[dz.pipeColour].name.toLowerCase() : ''));
    if (dz.msg) out.push('Message: “' + dz.msg + '”');
    if (dz.toppers.length) out.push('Toppers: ' + dz.toppers.join(', '));
    return out;
  }
  function opts(list, ph) { return '<option value="">' + esc(ph) + '</option>' + list.map(function (o) { return '<option>' + esc(o) + '</option>'; }).join(''); }
  function minDate() { var d = new Date(); d.setDate(d.getDate() + ((C.orders && C.orders.leadDays) || 0)); return d.toISOString().slice(0, 10); }
  function prevFor(shapeId, pipeId) {
    var L = DZ.previews || [], exact = null, near = null;
    L.forEach(function (p) { if (p.shape === shapeId) { if (!near) near = p; if (p.piping.indexOf(pipeId) >= 0 && !exact) exact = p; } });
    return { ref: exact || near || L[0], exact: !!exact && (exact.exact !== false) };
  }
  function thumb(name) { return (DZ.previewPath || 'img/studio/') + name + '-240.webp'; }
  function sw(name, sel, small) { return '<div class="sw' + (small ? ' sm' : '') + '" role="radiogroup">' + DZ.colours.map(function (c, i) { return '<label class="swc"><input type="radio" name="' + name + '" value="' + i + '"' + (i === sel ? ' checked' : '') + '><span class="dot" style="--c:' + c.hex + '"></span><span class="nm">' + esc(c.name) + (c.price ? '<small>+' + money(c.price) + '</small>' : '') + '</span></label>'; }).join('') + '</div>'; }

  function designerHTML() {
    if (!DZ) return '';
    var F = C.customForm || {}, groups = {}; CREME.addons.forEach(function (a) { (groups[a.group] = groups[a.group] || []).push(a); });
    var shapeThumb = function (s) { var r = prevFor(s.id, s.id === 'tiers' ? 'smooth' : (s.id === 'heart' ? 'vintage' : 'smooth')).ref; return r ? thumb(r.image) : ''; };
    var pipeThumb = function (p) { var r = prevFor('round', p.id).ref; return r ? thumb(r.image) : ''; };
    var steps = [
      '<div class="st-blk"><p class="st-lab">Shape</p><div class="st-cards three" role="radiogroup" aria-label="Shape">' + DZ.shapes.map(function (s, i) { return '<label class="pick"><input type="radio" name="dzShape" value="' + i + '"' + (i === dz.shape ? ' checked' : '') + '><span class="oc"><img src="' + shapeThumb(s) + '" alt="" loading="lazy"><b>' + esc(s.label) + '</b><small>' + (s.price ? '+' + money(s.price) : (s.id === 'tiers' ? 'From ' + DZ.sizes.filter(function (z) { return z.shapes.indexOf('tiers') >= 0; })[0].label : 'Included')) + '</small></span></label>'; }).join('') + '</div></div>' +
      '<div class="st-blk"><p class="st-lab">Size <small>Price shown with your current choices</small></p><div class="st-list" id="dzSizes" role="radiogroup" aria-label="Size"></div></div>',
      '<div class="st-blk"><p class="st-lab">Flavour</p><div class="st-list two" id="dzFlavors" role="radiogroup" aria-label="Flavour"></div></div>' +
      '<div class="st-blk"><p class="st-lab">Frosting</p><div class="st-cards two" role="radiogroup" aria-label="Frosting">' + DZ.frosting.map(function (f, i) { return '<label class="pick plain"><input type="radio" name="dzFrost" value="' + i + '"' + (i === dz.frost ? ' checked' : '') + '><span class="oc"><b>' + esc(f.name) + '</b><small>' + (f.price ? '+' + money(f.price) : 'Included') + '</small></span></label>'; }).join('') + '</div></div>',
      '<div class="st-blk"><p class="st-lab">Frosting colour <small id="dzColName"></small></p>' + sw('dzColour', dz.colour) + '</div>' +
      '<div class="st-blk"><p class="st-lab">Piping style</p><div class="st-cards five" role="radiogroup" aria-label="Piping style">' + DZ.piping.map(function (p, i) { return '<label class="pick"><input type="radio" name="dzPipe" value="' + i + '"' + (i === dz.pipe ? ' checked' : '') + '><span class="oc"><img src="' + pipeThumb(p) + '" alt="" loading="lazy"><b>' + esc(p.label) + '</b><small>' + (p.price ? '+' + money(p.price) : 'Included') + '</small></span></label>'; }).join('') + '</div></div>' +
      '<div class="st-blk" id="dzPipeCBlk"><p class="st-lab">Piping colour</p>' + sw('dzPipeC', dz.pipeColour, true) + '</div>',
      '<div class="st-blk"><label class="st-lab" for="dzMsg">Message on the cake <small><span id="dzMsgN">0</span> / ' + (DZ.messageMax || 30) + '</small></label><input id="dzMsg" class="st-in" maxlength="' + (DZ.messageMax || 30) + '" placeholder="e.g. Happy 30th, Zawadi" autocomplete="off"></div>' +
      '<div class="st-blk"><p class="st-lab">Toppers & extras <small id="dzTopC">None added</small></p>' + Object.keys(groups).map(function (g) { return '<p class="st-sub">' + esc(g) + '</p><div class="chips">' + groups[g].map(function (a) { return '<label class="chip"><input type="checkbox" name="dzTop" value="' + esc(a.name) + '"><span>' + esc(a.name) + '<small>+' + money(a.price) + '</small></span></label>'; }).join('') + '</div>'; }).join('') + '</div>',
      '<div class="st-blk"><p class="st-lab">Your cake</p><dl class="st-review" id="dzReview"></dl></div>' +
      '<div class="st-blk"><p class="st-lab">Your details</p><div class="form">' +
      '<div class="f"><label for="cOcc">Occasion</label><select id="cOcc" name="occasion">' + opts(F.occasions || [], 'Choose an occasion') + '</select></div>' +
      '<div class="f"><label for="cDate">Date needed <i>*</i></label><input id="cDate" name="date" type="date" required min="' + minDate() + '"><span class="err" aria-live="polite"></span></div>' +
      '<div class="f full"><span class="lab" id="cMethL">Delivery or collection</span><div class="seg" role="radiogroup" aria-labelledby="cMethL">' + C.delivery.options.map(function (o, i) { return '<label><input type="radio" name="method" value="' + esc(o.label) + '"' + (i === 0 ? ' checked' : '') + '><span>' + esc(o.label) + '</span></label>'; }).join('') + '</div></div>' +
      '<div class="f full" id="cAddrF"><label for="cAddr">Delivery area or address</label><input id="cAddr" name="address" autocomplete="street-address" placeholder="Where should we deliver?"></div>' +
      '<div class="f"><label for="cName">Your name <i>*</i></label><input id="cName" name="name" autocomplete="name" required><span class="err" aria-live="polite"></span></div>' +
      '<div class="f"><label for="cPhone">Phone / WhatsApp <i>*</i></label><input id="cPhone" name="phone" type="tel" autocomplete="tel" inputmode="tel" required><span class="err" aria-live="polite"></span></div>' +
      '<div class="f full"><span class="lab" id="cRefL">Inspiration photo <small>(optional)</small></span><div class="drop" id="cDrop">' + I.up + '<p><b>Add a photo</b> of a cake you love · up to ' + ((C.orders && C.orders.maxImageMB) || 8) + ' MB</p><input id="cRef" type="file" accept="image/*" aria-labelledby="cRefL"></div>' +
      '<div class="preview" id="cPrev"><img alt="Your inspiration photo"><div class="meta"><b></b><span></span></div><button type="button">Remove</button></div><span class="err" aria-live="polite"></span></div>' +
      '<div class="f full"><label for="cNotes">Anything else?</label><textarea id="cNotes" name="instructions" rows="3" placeholder="Theme, allergies, the time you need it…"></textarea></div>' +
      '</div></div>' +
      '<div class="st-send"><button type="submit" class="btn wa" data-via="wa">' + I.wa + 'Send on WhatsApp</button><button type="submit" class="btn ghost" data-via="req">' + I.send + 'Send as order request</button><button type="button" class="link" id="dzAdd">' + I.plus + 'Add to my order instead</button></div>'
    ];
    return '<section class="sec studio" id="design" aria-labelledby="dzT"><div class="wrap">' +
      '<div class="sec-head"><div><div class="chap rv"><b>03</b><span class="kicker">The cake studio</span></div><h2 class="h-sec split" id="dzT">Your idea, <em>our oven.</em></h2></div><p class="lead rv">' + esc(DZ.intro) + '</p></div>' +
      '<div class="st-grid">' +
      '<div class="st-view"><figure class="st-photo"><canvas id="dzA" aria-hidden="true"></canvas><canvas id="dzB" aria-hidden="true"></canvas>' +
      '<figcaption id="dzCap"></figcaption></figure>' +
      '<div class="st-sum"><div class="st-price"><small>Estimated price</small><b id="dzPrice"></b><span id="dzServes"></span></div><dl id="dzSum"></dl></div></div>' +
      '<form class="st-panel" id="dzForm" novalidate>' +
      '<ol class="st-tabs" role="tablist">' + STEPS.map(function (s, i) { return '<li><button type="button" role="tab" id="dzTab' + i + '" aria-controls="dzStep' + i + '" aria-selected="' + (i === 0) + '" data-step="' + i + '"><b>' + pad(i + 1) + '</b><span>' + esc(s) + '</span></button></li>'; }).join('') + '</ol>' +
      steps.map(function (h, i) { return '<div class="st-step" role="tabpanel" id="dzStep' + i + '" aria-labelledby="dzTab' + i + '"' + (i ? ' hidden' : '') + '><h3 class="st-h"><span>Step ' + (i + 1) + ' of ' + STEPS.length + '</span>' + esc(STEPS[i]) + '</h3>' + h + '</div>'; }).join('') +
      '<div class="st-nav"><button type="button" class="btn ghost" id="dzBack">' + I.l + 'Back</button><div class="st-navp"><small>Estimated</small><b id="dzPrice2"></b></div><button type="button" class="btn" id="dzNext">Next' + I.r + '</button></div>' +
      '</form></div>' +
      '<div class="done" id="cDone" tabindex="-1" aria-live="polite"><span class="kicker">Thank you</span><h3>Your cake is on its way to us.</h3><p></p><button type="button" class="btn" id="cAgain">Design another cake</button></div>' +
      '</div></section>';
  }

  /* photographic recolouring: keep each pixel's lightness (relative to the frosting's own tone) and give it the
     chosen colour's hue and chroma, in OKLab, only where the mask says "frosting" */
  var REC = { cache: {}, front: null, ver: 0 };
  var S2L = new Float32Array(256); for (var _i = 0; _i < 256; _i++) { var _c = _i / 255; S2L[_i] = _c <= 0.04045 ? _c / 12.92 : Math.pow((_c + 0.055) / 1.055, 2.4); }
  function l2s(x) { x = x <= 0 ? 0 : x >= 1 ? 1 : x; return x <= 0.0031308 ? x * 12.92 : 1.055 * Math.pow(x, 1 / 2.4) - 0.055; }
  function toLab(r, g, b) {
    var l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s, 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
  }
  function loadImg(src) { return new Promise(function (ok, no) { var im = new Image(); im.decoding = 'async'; im.onload = function () { ok(im); }; im.onerror = no; im.src = src; }); }
  function loadRef(name) {
    if (REC.cache[name]) return REC.cache[name];
    var base = (DZ.previewPath || 'img/studio/') + name;
    REC.cache[name] = Promise.all([loadImg(base + '.webp'), loadImg(base + '-mask.png')]).then(function (ims) {
      var W = MOBILE.matches ? 720 : 960, H = Math.round(W * 1.25), cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      var cx = cv.getContext('2d', { willReadFrequently: true });
      cx.drawImage(ims[1], 0, 0, W, H); var md = cx.getImageData(0, 0, W, H).data;
      cx.drawImage(ims[0], 0, 0, W, H); var img = cx.getImageData(0, 0, W, H);
      var n = W * H, mask = new Float32Array(n), Lc = new Float32Array(n), idx = [], hist = new Uint32Array(256), cnt = 0;
      for (var i = 0; i < n; i++) {
        var m = md[i * 4] / 255; mask[i] = m; if (m < 0.004) continue;
        idx.push(i); var d = img.data, lab = toLab(S2L[d[i * 4]], S2L[d[i * 4 + 1]], S2L[d[i * 4 + 2]]); Lc[i] = lab[0];
        if (m > 0.5) { hist[Math.min(255, Math.round(lab[0] * 255))]++; cnt++; }
      }
      var acc = 0, Lref = 0.85; for (var k = 0; k < 256; k++) { acc += hist[k]; if (acc >= cnt * 0.7) { Lref = k / 255; break; } }
      return { W: W, H: H, img: img, mask: mask, L: Lc, idx: Int32Array.from(idx), Lref: Lref };
    });
    return REC.cache[name];
  }
  function paint(ref, hex, canvas) {
    var c = parseInt(hex.slice(1), 16), t = toLab(S2L[c >> 16], S2L[(c >> 8) & 255], S2L[c & 255]);
    var k = 0.75 + 0.45 * (1 - t[0]);
    canvas.width = ref.W; canvas.height = ref.H;
    var cx = canvas.getContext('2d'), out = cx.createImageData(ref.W, ref.H), o = out.data, src = ref.img.data;
    o.set(src);
    for (var j = 0; j < ref.idx.length; j++) {
      var i = ref.idx[j], m = ref.mask[i], L = ref.L[i];
      var Lo = t[0] + (L - ref.Lref) * k, hl = Math.min(1, Math.max(0, (L - ref.Lref) / 0.12)) * (1 - t[0]) * 0.35, a = t[1] * (1 - hl), b = t[2] * (1 - hl);
      var l_ = Lo + 0.3963377774 * a + 0.2158037573 * b, m_ = Lo - 0.1055613458 * a - 0.0638541728 * b, s_ = Lo - 0.0894841775 * a - 1.2914855480 * b;
      l_ = l_ * l_ * l_; m_ = m_ * m_ * m_; s_ = s_ * s_ * s_;
      var r = l2s(4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_), g = l2s(-1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_), bl = l2s(-0.0041960863 * l_ - 0.7034186147 * m_ + 1.7076147010 * s_);
      var p = i * 4; o[p] = src[p] + (r * 255 - src[p]) * m; o[p + 1] = src[p + 1] + (g * 255 - src[p + 1]) * m; o[p + 2] = src[p + 2] + (bl * 255 - src[p + 2]) * m;
    }
    cx.putImageData(out, 0, 0);
  }
  function renderPreview() {
    var shape = DZ.shapes[dz.shape], pipe = DZ.piping[dz.pipe], pick = prevFor(shape.id, pipe.id), col = DZ.colours[dz.colour], v = ++REC.ver;
    var cap = $('#dzCap'); if (cap) cap.innerHTML = '<span>' + esc(col.name) + ' · ' + esc(shape.label) + (pick.exact ? ' · ' + esc(pipe.label) : '') + '</span>' + '<small>' + (pick.exact ? 'Reference photograph, tinted to your colour' : 'Closest reference photograph, tinted to your colour') + '</small>';
    if (!pick.ref) return;
    $('.st-photo').classList.add('busy');
    loadRef(pick.ref.image).then(function (ref) {
      if (v !== REC.ver) return;
      var a = $('#dzA'), b = $('#dzB'), back = REC.front === a ? b : a;
      paint(ref, col.hex, back);
      back.classList.add('on'); if (REC.front && REC.front !== back) REC.front.classList.remove('on');
      REC.front = back; $('.st-photo').classList.remove('busy');
    }).catch(function () { $('.st-photo').classList.remove('busy'); });
  }
  function renderSizes() {
    var list = dzSizes();
    if (!list.some(function (x) { return x.i === dz.size; })) { var kg = DZ.sizes[dz.size].kg; dz.size = list.reduce(function (a, x) { return Math.abs(x.s.kg - kg) < Math.abs(a.s.kg - kg) ? x : a; }).i; }
    $('#dzSizes').innerHTML = list.map(function (x) { return '<label class="row"><input type="radio" name="dzSize" value="' + x.i + '"' + (x.i === dz.size ? ' checked' : '') + '><span><b>' + esc(x.s.label) + '</b><em>Serves ' + esc(x.s.serves) + '</em><i>' + money(dzTotal(withDz({ size: x.i }))) + '</i></span></label>'; }).join('');
  }
  function renderFlavors() {
    $('#dzFlavors').innerHTML = dzTable().flavors.map(function (f, i) { return '<label class="row"><input type="radio" name="dzFlavor" value="' + i + '"' + (i === dz.flavor ? ' checked' : '') + '><span><b>' + esc(f.name) + '</b><i>' + money(dzTotal(withDz({ flavor: i }))) + '</i></span></label>'; }).join('');
  }
  function renderSummary() {
    var s = DZ.sizes[dz.size], tot = money(dzTotal());
    $('#dzPrice').textContent = tot; $('#dzPrice2').textContent = tot;
    $('#dzServes').textContent = DZ.shapes[dz.shape].label + ' · ' + s.label + ' · serves ' + s.serves;
    var rows = [['Flavour', dzTable().flavors[dz.flavor].name], ['Frosting', DZ.frosting[dz.frost].name + ', ' + DZ.colours[dz.colour].name.toLowerCase()], ['Piping', DZ.piping[dz.pipe].label + (DZ.piping[dz.pipe].id !== 'smooth' ? ', ' + DZ.colours[dz.pipeColour].name.toLowerCase() : '')]];
    if (dz.msg) rows.push(['Message', '“' + dz.msg + '”']);
    if (dz.toppers.length) rows.push(['Toppers', dz.toppers.join(', ')]);
    $('#dzSum').innerHTML = rows.map(function (r) { return '<div><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>'; }).join('');
    var all = [['Shape & size', DZ.shapes[dz.shape].label + ', ' + s.label + ' (serves ' + s.serves + ')', 0]].concat(rows.map(function (r) { return [r[0], r[1], r[0] === 'Flavour' ? 1 : r[0] === 'Message' || r[0] === 'Toppers' ? 3 : 2]; }));
    $('#dzReview').innerHTML = all.map(function (r) { return '<div><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd><button type="button" class="link" data-goto="' + r[2] + '">Change</button></div>'; }).join('') + '<div class="tot"><dt>Estimated price</dt><dd>' + tot + '</dd></div>';
    var cn = $('#dzColName'); if (cn) cn.textContent = DZ.colours[dz.colour].name;
    var pc = $('#dzPipeCBlk'); if (pc) pc.hidden = DZ.piping[dz.pipe].id === 'smooth';
    $('#dzTopC').textContent = dz.toppers.length ? dz.toppers.length + ' added' : 'None added';
  }
  function refresh(previewToo) { renderSizes(); renderFlavors(); renderSummary(); if (previewToo) renderPreview(); }
  function goStep(n, focus) {
    n = Math.max(0, Math.min(STEPS.length - 1, n)); dz.step = n;
    $$('.st-step').forEach(function (s, i) { s.hidden = i !== n; });
    $$('.st-tabs button').forEach(function (b, i) { b.setAttribute('aria-selected', i === n ? 'true' : 'false'); b.classList.toggle('done', i < n); });
    $('#dzBack').disabled = n === 0;
    var nx = $('#dzNext'); nx.innerHTML = n === STEPS.length - 1 ? I.wa + '<span>Send</span>' : 'Next' + I.r; nx.classList.toggle('wa', n === STEPS.length - 1);
    $('.studio').dataset.step = n;
    if (focus) {
      var top = $('.st-grid').getBoundingClientRect().top + window.scrollY - navH() - 12;
      if (MOBILE.matches || $('.st-panel').getBoundingClientRect().top < navH()) window.scrollTo({ top: MOBILE.matches ? top : $('.st-panel').getBoundingClientRect().top + window.scrollY - navH() - 12, behavior: RM ? 'auto' : 'smooth' });
      var h = $('#dzStep' + n + ' .st-h'); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
    }
  }
  function bindDesigner() {
    if (!DZ) return;
    var f = $('#dzForm');
    refresh(true); goStep(0);
    f.addEventListener('change', function (e) {
      var t = e.target, v = +t.value;
      if (t.name === 'dzShape') { dz.shape = v; refresh(true); }
      else if (t.name === 'dzSize') { dz.size = v; refresh(); }
      else if (t.name === 'dzFlavor') { dz.flavor = v; refresh(); }
      else if (t.name === 'dzFrost') { dz.frost = v; refresh(); }
      else if (t.name === 'dzColour') { dz.colour = v; refresh(true); }
      else if (t.name === 'dzPipe') { dz.pipe = v; refresh(true); }
      else if (t.name === 'dzPipeC') { dz.pipeColour = v; refresh(); }
      else if (t.name === 'dzTop') { dz.toppers = $$('input[name="dzTop"]:checked', f).map(function (x) { return x.value; }); refresh(); }
      else if (t.id === 'cOcc') dz.occasion = t.value;
    });
    $('#dzMsg').addEventListener('input', function (e) { dz.msg = e.target.value.trim(); $('#dzMsgN').textContent = e.target.value.length; renderSummary(); });
    $$('.st-tabs button').forEach(function (b) { b.onclick = function () { goStep(+b.dataset.step, true); }; });
    f.addEventListener('click', function (e) { var g = e.target.closest('[data-goto]'); if (g) goStep(+g.dataset.goto, true); });
    $('#dzBack').onclick = function () { goStep(dz.step - 1, true); };
    $('#dzNext').onclick = function () { if (dz.step < STEPS.length - 1) goStep(dz.step + 1, true); else { via = 'wa'; f.requestSubmit ? f.requestSubmit() : f.dispatchEvent(new Event('submit', { cancelable: true })); } };
    // inspiration photo
    var file = $('#cRef'), drop = $('#cDrop'), prev = $('#cPrev'), maxMB = (C.orders && C.orders.maxImageMB) || 8;
    var setErr = function (el, msg) { var w = el.closest('.f'); w.classList.toggle('bad', !!msg); var e = w.querySelector('.err'); if (e) e.textContent = msg || ''; if (msg) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid'); };
    function showFile(fl) {
      setErr(file, '');
      if (!fl) { dz.file = null; prev.classList.remove('on'); drop.style.display = ''; file.value = ''; return; }
      if (!/^image\//.test(fl.type) && !/\.(heic|heif)$/i.test(fl.name)) { setErr(file, 'Please choose an image file.'); file.value = ''; return; }
      if (fl.size > maxMB * 1048576) { setErr(file, 'That photo is larger than ' + maxMB + ' MB.'); file.value = ''; return; }
      dz.file = fl; try { prev.querySelector('img').src = URL.createObjectURL(fl); } catch (e) {}
      prev.querySelector('b').textContent = fl.name; prev.querySelector('span').textContent = (fl.size / 1048576).toFixed(1) + ' MB'; prev.classList.add('on'); drop.style.display = 'none';
    }
    file.addEventListener('change', function () { showFile(file.files[0]); });
    ['dragenter', 'dragover'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
    ['dragleave', 'drop'].forEach(function (t) { drop.addEventListener(t, function () { drop.classList.remove('over'); }); });
    drop.addEventListener('drop', function (e) { e.preventDefault(); var fl = e.dataTransfer.files[0]; if (fl) showFile(fl); });
    prev.querySelector('button').onclick = function () { showFile(null); file.focus(); };
    $$('input[name="method"]', f).forEach(function (r) { r.addEventListener('change', function () { $('#cAddrF').style.display = /deliver/i.test(r.value) ? '' : 'none'; }); });
    function validate(el) {
      var v = (el.value || '').trim();
      if (el.required && !v) { setErr(el, 'Please fill this in.'); return false; }
      if (el.type === 'tel' && v && v.replace(/\D/g, '').length < 9) { setErr(el, 'Please enter a number we can reach on WhatsApp.'); return false; }
      if (el.type === 'date' && v && v < el.min) { setErr(el, 'Please choose a later date.'); return false; }
      setErr(el, ''); return true;
    }
    ['cDate', 'cName', 'cPhone'].forEach(function (id) { $('#' + id).addEventListener('change', function (e) { if (e.target.closest('.f.bad')) validate(e.target); }); });
    var via = 'wa';
    $$('[data-via]', f).forEach(function (b) { b.addEventListener('click', function () { via = b.dataset.via; }); });
    function summary() {
      var g = function (id) { return ($('#' + id).value || '').trim(); }, L = [(C.whatsapp && C.whatsapp.customIntro) || "Hello! I'd like to order a custom cake.", ''].concat(dzLines());
      L.push('Estimated price: ' + money(dzTotal()));
      if (g('cDate')) L.push('Date needed: ' + new Date(g('cDate') + 'T12:00').toLocaleDateString(C.currency.locale, { weekday: 'long', day: 'numeric', month: 'long' }));
      var m = $('input[name="method"]:checked', f).value; L.push(m + (/deliver/i.test(m) && g('cAddr') ? ': ' + g('cAddr') : ''));
      if (g('cNotes')) L.push('Notes: ' + g('cNotes'));
      if (dz.file) L.push('Inspiration photo: ' + (C.orders && C.orders.endpoint && via === 'req' ? 'attached' : 'I will send it in this chat.'));
      L.push('', 'Name: ' + g('cName'), 'Phone: ' + g('cPhone'));
      return L.join('\n');
    }
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (dz.step !== STEPS.length - 1) { goStep(STEPS.length - 1, true); return; }
      var bad = ['cDate', 'cName', 'cPhone'].map(function (id) { return $('#' + id); }).filter(function (el) { return !validate(el); });
      if (bad.length) { bad[0].focus(); toast('Please add the date, your name and phone'); return; }
      var text = summary();
      var finish = function (how) {
        $('.st-grid').style.display = 'none'; var dn = $('#cDone'); dn.classList.add('on');
        dn.querySelector('p').textContent = how === 'post' ? 'Thank you, ' + $('#cName').value.trim() + '. We will be in touch on ' + $('#cPhone').value.trim() + ' to confirm your design and price.' : how === 'mail' ? 'Your email app has opened with the order. Send it to finish' + (dz.file ? ' and attach your inspiration photo' : '') + '.' : 'Send the message in WhatsApp to finish' + (dz.file ? ', and attach your inspiration photo in the chat' : '') + '. We will confirm the design and price.';
        document.body.classList.remove('in-studio');
        dn.focus({ preventScroll: true }); dn.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' });
      };
      if (via === 'req') sendRequest('Custom cake order: ' + $('#cName').value.trim(), text, { name: $('#cName').value, phone: $('#cPhone').value, date: $('#cDate').value, total: dzTotal() }, dz.file).then(finish, function () { toast('We could not send it. Try WhatsApp instead?', 'WhatsApp', function () { sendWA(text); finish('wa'); }); });
      else { sendWA(text); finish('wa'); }
    });
    $('#dzAdd').onclick = function () { addToBag({ id: 'custom', custom: { lines: dzLines(), total: dzTotal(), name: 'Custom ' + DZ.shapes[dz.shape].label.toLowerCase() + ' cake' }, qty: 1 }); toast('Your cake was added to your order', 'View order', openBag); };
    $('#cAgain').onclick = function () { f.reset(); showFile(null); dz = { shape: 0, size: 1, flavor: 0, frost: 0, colour: 0, pipe: 1, pipeColour: 2, msg: '', toppers: [], occasion: '', file: null, step: 0 }; $('#dzMsgN').textContent = '0'; refresh(true); goStep(0); $('.st-grid').style.display = ''; $('#cDone').classList.remove('on'); $('#cAddrF').style.display = ''; $('#dzT').scrollIntoView({ behavior: RM ? 'auto' : 'smooth' }); };
  }

  /* ---------------- about, reviews, gallery ---------------- */
  function aboutHTML() {
    var A = C.about, im = A.images || [];
    var fig = function (cls, src, par) { return src ? '<figure class="' + cls + ' rv-img" data-par="' + par + '"><img src="' + pic(src) + '" srcset="' + srcset(src) + '" sizes="(max-width: 900px) 70vw, 30vw" alt="" loading="lazy" decoding="async"></figure>' : ''; };
    return '<section class="sec about" id="about" aria-labelledby="aboutT"><div class="wrap">' +
      '<div class="about-grid"><div class="collage" aria-hidden="true">' + fig('c1', im[0], '0.04') + fig('c2', im[1], '-0.08') + fig('c3', im[2], '0.12') + '</div>' +
      '<div><div class="chap rv"><b>04</b><span class="kicker">' + esc(A.kicker) + '</span></div><h2 class="split" id="aboutT">' + esc(A.title) + '</h2>' + A.paragraphs.map(function (p, i) { return '<p class="rv" style="--d:' + (i * 0.1) + 's">' + esc(p) + '</p>'; }).join('') + '</div></div>' +
      '<figure class="quote"><blockquote class="split">' + esc(A.quote) + '</blockquote><cite class="rv">' + esc(A.quoteBy) + '</cite></figure>' +
      '<div class="values">' + A.values.map(function (v, i) { return '<div class="rv" style="--d:' + (i * 0.1) + 's"><h3>' + esc(v.title) + '</h3><p>' + esc(v.text) + '</p></div>'; }).join('') + '</div>' +
      '</div></section>';
  }
  function reviewsHTML() {
    var T = CREME.testimonials || []; if (!T.length) return '';
    return '<section class="sec reviews" id="reviews" aria-roledescription="carousel" aria-labelledby="revT"><div class="wrap">' +
      '<div class="chap rv"><span class="kicker" id="revT">Kind words</span></div>' +
      '<div class="rev-stage">' + T.map(function (t, i) { var wi = 0;
        return '<figure class="rev' + (i === 0 ? ' on' : '') + '" role="group" aria-roledescription="slide" aria-label="' + (i + 1) + ' of ' + T.length + '"' + (i ? ' aria-hidden="true"' : '') + '><q>' + esc(t.quote).split(' ').map(function (w) { return '<span class="w" style="--i:' + (wi++) + '">' + w + '</span>'; }).join(' ') + '</q>' +
          '<footer><b>' + esc(t.name) + '</b><span>' + esc(t.occasion) + '</span>' + (C.demo ? '<em>Sample review</em>' : '') + '</footer></figure>'; }).join('') + '</div>' +
      '<div class="rev-ctrl"><button type="button" class="arr" data-rv="-1" aria-label="Previous review">' + I.l + '</button><button type="button" class="arr" data-rv="1" aria-label="Next review">' + I.r + '</button>' +
      '<div class="dots">' + T.map(function (t, i) { return '<button type="button" data-rd="' + i + '" aria-label="Review ' + (i + 1) + '"' + (i === 0 ? ' aria-current="true"' : '') + '></button>'; }).join('') + '</div></div>' +
      '</div></section>';
  }
  function bindReviews() {
    var sec = $('#reviews'); if (!sec) return;
    var rs = $$('.rev', sec), ds = $$('[data-rd]', sec), i = 0, t, DUR = 7000, paused = RM;
    function go(n) { i = (n + rs.length) % rs.length; rs.forEach(function (r, k) { r.classList.toggle('on', k === i); if (k === i) r.removeAttribute('aria-hidden'); else r.setAttribute('aria-hidden', 'true'); }); ds.forEach(function (d, k) { d.setAttribute('aria-current', k === i ? 'true' : 'false'); }); sched(); }
    function sched() { clearTimeout(t); if (!paused) t = setTimeout(function () { go(i + 1); }, DUR); }
    sec.style.setProperty('--dur', DUR / 1000 + 's');
    $$('[data-rv]', sec).forEach(function (b) { b.onclick = function () { go(i + +b.dataset.rv); }; });
    ds.forEach(function (d) { d.onclick = function () { go(+d.dataset.rd); }; });
    var pause = function (v) { if (RM) return; paused = v; sec.classList.toggle('paused', v); if (v) clearTimeout(t); else sched(); };
    sec.addEventListener('mouseenter', function () { pause(true); }); sec.addEventListener('mouseleave', function () { pause(false); });
    sec.addEventListener('focusin', function () { pause(true); }); sec.addEventListener('focusout', function () { pause(false); });
    swipe($('.rev-stage', sec), function (d) { go(i + d); });
    if (RM) sec.classList.add('paused');
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { es.forEach(function (e) { if (RM) return; if (e.isIntersecting) { if (!sec.classList.contains('paused')) { paused = false; sched(); } } else clearTimeout(t); }); }).observe(sec);
  }
  function galleryHTML() {
    var G = CREME.gallery;
    return '<section class="sec" id="gallery" aria-labelledby="galT"><div class="wrap">' +
      '<div class="sec-head"><div><div class="chap rv"><b>05</b><span class="kicker">Gallery</span></div><h2 class="h-sec split" id="galT">From our <em>table.</em></h2></div>' +
      '<div class="tabs" role="group" aria-label="Filter the gallery">' + G.filters.map(function (f, i) { return '<button type="button" class="tab" data-gf="' + f.id + '" aria-pressed="' + (i === 0) + '">' + esc(f.label) + '</button>'; }).join('') + '</div></div>' +
      '<div class="masonry">' + G.items.map(function (g, i) { return '<figure class="g-item rv" data-tag="' + g.tag + '" style="--d:' + ((i % 4) * 0.08) + 's"><button type="button" data-lb="' + i + '" aria-label="Open photo: ' + esc(g.caption || g.alt) + '"><img src="' + pic(g.image) + '" alt="' + esc(g.alt) + '" loading="lazy" decoding="async"></button><figcaption>' + esc(g.caption) + '</figcaption></figure>'; }).join('') + '</div>' +
      '</div></section>';
  }
  var lb, lbI = 0;
  function bindGallery() {
    var G = CREME.gallery.items;
    $$('[data-gf]').forEach(function (b) { b.onclick = function () { var f = b.dataset.gf; var apply = function () { $$('[data-gf]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); $$('.g-item').forEach(function (it) { it.classList.toggle('hide', f !== 'all' && it.dataset.tag !== f); it.classList.add('in'); }); }; if (document.startViewTransition && !RM) document.startViewTransition(apply); else apply(); }; });
    lb = document.createElement('dialog'); lb.className = 'lb'; lb.setAttribute('aria-label', 'Photo viewer');
    lb.innerHTML = '<div class="lb-stage"></div><button type="button" class="lb-arr lb-prev" aria-label="Previous photo">' + I.l + '</button><button type="button" class="lb-arr lb-next" aria-label="Next photo">' + I.r + '</button><p class="lb-cap" aria-live="polite"></p><button type="button" class="x" aria-label="Close">' + I.x + '</button>';
    document.body.appendChild(lb); wireDlg(lb);
    var visible = function () { return $$('.g-item').filter(function (it) { return !it.classList.contains('hide'); }).map(function (it) { return +it.querySelector('[data-lb]').dataset.lb; }); };
    function show(n) { var v = visible(), pos = v.indexOf(n); if (pos < 0) return; lbI = n; var g = G[n]; lb.querySelector('.lb-stage').innerHTML = '<img src="' + pic(g.image, 1600) + '" alt="' + esc(g.alt) + '">'; lb.querySelector('.lb-cap').innerHTML = esc(g.caption) + '<small>' + pad(pos + 1) + ' / ' + pad(v.length) + '</small>'; }
    var step = function (d) { var v = visible(), p = v.indexOf(lbI); show(v[(p + d + v.length) % v.length]); };
    $$('[data-lb]').forEach(function (b) { b.onclick = function () { lb._opener = b; show(+b.dataset.lb); openDlg(lb); }; });
    lb.querySelector('.lb-prev').onclick = function () { step(-1); }; lb.querySelector('.lb-next').onclick = function () { step(1); };
    lb.querySelector('.x').onclick = function () { closeDlg(lb); };
    lb.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') step(-1); if (e.key === 'ArrowRight') step(1); });
    lb.addEventListener('close', function () { if (lb._opener) lb._opener.focus(); });
    swipe(lb.querySelector('.lb-stage'), step);
  }

  /* ---------------- contact ---------------- */
  function contactHTML() {
    var O = CREME.ordering, D = C.delivery, K = C.contact, soc = (C.social || []).filter(function (s) { return s.url; });
    var ways = [
      '<button type="button" class="way" data-wa-general>' + I.wa + '<b>WhatsApp</b><span>Fastest. Your order is written for you.</span></button>',
      hasPhone ? '<a class="way" href="' + phoneHref(K.phone) + '">' + I.phone + '<b>Call us</b><span>' + esc(K.phone) + '</span></a>' : '',
      '<a class="way" href="#collection">' + I.bag + '<b>Order online</b><span>Choose cakes, then send an order request.</span></a>',
      '<a class="way" href="#design">' + I.brush + '<b>Design a cake</b><span>Build it and see the price.</span></a>',
      K.email ? '<a class="way" href="mailto:' + esc(K.email) + '">' + I.mail + '<b>Email</b><span>' + esc(K.email) + '</span></a>' : ''
    ].join('');
    return '<section class="sec" id="contact" aria-labelledby="conT"><div class="wrap">' +
      '<div class="contact-hero"><div><div class="chap rv"><b>06</b><span class="kicker">Contact & ordering</span></div><h2 class="h-sec split" id="conT">Let’s make it <em>sweet.</em></h2></div>' +
      '<p class="lead rv" style="margin:0">Ask about availability, request a custom cake or place an order however suits you. ' + esc((C.order && C.order.replyTime) || '') + '</p></div>' +
      '<div class="ways rv">' + ways + '</div>' +
      '<ol class="steps">' + O.steps.map(function (s, i) { return '<li class="rv" style="--d:' + (i * 0.1) + 's"><h3>' + esc(s.title) + '</h3><p>' + esc(s.text) + '</p></li>'; }).join('') + '</ol>' +
      '<div class="info-grid">' +
      '<div class="rv"><h3>Delivery & collection</h3><p style="margin:0 0 18px">' + esc(D.intro) + '</p>' + D.options.map(function (o) { return '<div class="opt-card"><b>' + esc(o.label) + '</b><p>' + esc(o.text) + '</p></div>'; }).join('') +
      (D.zones && D.zones.length ? '<table class="zones"><caption class="sr">Delivery fees</caption><tbody>' + D.zones.map(function (z) { return '<tr><td>' + esc(z[0]) + '</td><td>' + esc(z[1]) + '</td></tr>'; }).join('') + '</tbody></table>' + (C.demo && D.note ? '<p class="small-note">' + esc(D.note) + '</p>' : '') : '') + '</div>' +
      '<div class="rv" style="--d:.1s"><h3>Opening hours</h3><ul class="hours">' + K.hours.map(function (h) { return '<li><span>' + esc(h[0]) + '</span><span>' + esc(h[1]) + '</span></li>'; }).join('') + '</ul>' + (C.order && C.order.payment ? '<h3 style="margin-top:30px">Payment</h3><p>' + esc(C.order.payment) + '</p>' : '') + '</div>' +
      '<div class="rv" style="--d:.2s"><h3>Find us</h3><ul class="clist">' + (K.address ? '<li>' + (K.mapUrl ? '<a href="' + esc(K.mapUrl) + '" target="_blank" rel="noopener">' + esc(K.address) + '</a>' : esc(K.address)) + '</li>' : '') + (hasPhone ? '<li><a href="' + phoneHref(K.phone) + '">' + esc(K.phone) + '</a></li>' : '') + (K.email ? '<li><a href="mailto:' + esc(K.email) + '">' + esc(K.email) + '</a></li>' : '') + '</ul>' +
      (soc.length ? '<div class="socials">' + soc.map(function (s) { return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.label) + '</a>'; }).join('') + '</div>' : '') + '</div>' +
      '</div>' +
      '<div class="faq"><h2 class="split">Good to <em>know.</em></h2><div>' + O.faq.map(function (q) { return '<details class="rv"><summary>' + esc(q.q) + '<i aria-hidden="true"></i></summary><div class="ans"><p>' + esc(q.a) + '</p></div></details>'; }).join('') + '</div></div>' +
      '</div></section>';
  }

  /* ---------------- footer, drawer, mobile bar ---------------- */
  function footerHTML() {
    var soc = (C.social || []).filter(function (s) { return s.url; });
    return '<footer class="foot"><div class="wrap">' +
      '<p class="foot-big" aria-hidden="true">' + logoHTML().replace(/<img[^>]*>/, esc(C.brand.name)) + '</p>' +
      '<div class="foot-grid"><div><h4>' + esc(C.brand.name) + '</h4><p>' + esc(C.brand.tagline) + '</p><button type="button" class="btn light sm" data-wa-general>' + I.wa + 'Order on WhatsApp</button></div>' +
      '<div><h4>Explore</h4><ul>' + C.nav.map(function (n) { return '<li><a href="' + n.href + '">' + esc(n.label) + '</a></li>'; }).join('') + '<li><a href="#gallery">Gallery</a></li></ul></div>' +
      '<div><h4>Cakes</h4><ul>' + CATS.map(function (c) { return '<li><a href="#collection" data-jump="' + c.id + '">' + esc(c.label) + '</a></li>'; }).join('') + '</ul></div>' +
      '<div><h4>Visit</h4><ul>' + (C.contact.address ? '<li>' + esc(C.contact.address) + '</li>' : '') + (C.contact.email ? '<li><a href="mailto:' + esc(C.contact.email) + '">' + esc(C.contact.email) + '</a></li>' : '') + (hasPhone ? '<li><a href="' + phoneHref(C.contact.phone) + '">' + esc(C.contact.phone) + '</a></li>' : '') + soc.map(function (s) { return '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.label) + '</a></li>'; }).join('') + '</ul></div></div>' +
      '<div class="foot-base"><span>© ' + new Date().getFullYear() + ' ' + esc(C.brand.name) + '</span><span>CRÈME MOTION template by <a href="../index.html">Ciel Africa</a> · <a href="credits.html">Photo credits</a></span></div>' +
      '</div></footer>';
  }
  function mbarHTML() {
    return '<div class="mbar" role="region" aria-label="Order" style="grid-template-columns:' + (hasPhone ? '1.3fr 1fr 1fr' : '1.4fr 1fr') + '">' +
      '<button type="button" class="mbar-wa" data-wa-general>' + I.wa + '<span>WhatsApp</span></button>' +
      (hasPhone ? '<a class="mbar-bag" href="' + phoneHref(C.contact.phone) + '">' + I.phone + '<span>Call</span></a>' : '') +
      '<button type="button" class="mbar-bag" data-bag>' + I.bag + '<span>My order</span><i class="n" hidden>0</i></button></div>';
  }
  var drawer, step = 'list';
  function drawerShell() { drawer = document.createElement('dialog'); drawer.className = 'drawer'; drawer.setAttribute('aria-labelledby', 'drT'); document.body.appendChild(drawer); wireDlg(drawer); }
  function openBag() { step = 'list'; renderDrawer(); openDlg(drawer); }
  function orderText(d) {
    var w = C.whatsapp || {}, L = [(w.greeting || "Hello! I'd like to order") + ':', ''];
    bag.forEach(function (l, i) { var p = byId(l.id), nm = l.custom ? l.custom.name : p.name; L.push((i + 1) + '. ' + nm + (l.qty > 1 && !(p && p.unit) ? ' × ' + l.qty : '') + ' — ' + money(lineTotal(l))); lineDesc(l).forEach(function (x) { L.push('   ' + x); }); });
    L.push('', 'Estimated total: ' + money(bag.reduce(function (a, l) { return a + lineTotal(l); }, 0)));
    if (d) { if (d.date) L.push('Date needed: ' + new Date(d.date + 'T12:00').toLocaleDateString(C.currency.locale, { weekday: 'long', day: 'numeric', month: 'long' })); L.push(d.method + (d.address && /deliver/i.test(d.method) ? ': ' + d.address : '')); if (d.note) L.push('Notes: ' + d.note); if (d.name) L.push('', 'Name: ' + d.name); if (d.phone) L.push('Phone: ' + d.phone); }
    L.push('', w.closing || 'Please confirm availability.');
    return L.join('\n');
  }
  function renderDrawer() {
    var total = bag.reduce(function (a, l) { return a + lineTotal(l); }, 0);
    var head = '<div class="dr-head"><h2 id="drT">' + (step === 'list' ? 'Your order' : 'Checkout') + '</h2><button type="button" class="x" aria-label="Close">' + I.x + '</button></div>';
    var body;
    if (!bag.length) body = '<div class="dr-body"><div class="dr-empty"><b>Nothing here yet.</b>Choose cakes from the collection or design your own, then send everything in one go.<br><br><a class="btn sm" href="#collection" data-close>Browse cakes</a> <a class="btn ghost sm" href="#design" data-close>Design a cake</a></div></div>';
    else if (step === 'list') body = '<div class="dr-body">' + bag.map(function (l, i) {
        var p = byId(l.id), img = l.custom ? '' : '<img src="' + pic(p.images[0].src) + '" alt="">';
        return '<div class="line">' + (img || '<span class="line-ic">' + I.brush + '</span>') + '<div><h3>' + esc(l.custom ? l.custom.name : p.name) + '</h3><div class="o">' + esc(lineDesc(l).join(' · ')) + '</div><button type="button" class="rm" data-rm="' + i + '">Remove</button></div>' +
          '<div class="r"><span>' + money(lineTotal(l)) + '</span><div class="qty" role="group" aria-label="Quantity"><button type="button" data-lq="' + i + '" data-d="-1" aria-label="One less">−</button><output>' + l.qty + '</output><button type="button" data-lq="' + i + '" data-d="1" aria-label="One more">+</button></div></div></div>';
      }).join('') + '</div><div class="dr-foot"><div class="dr-total"><span>Estimated total</span><b>' + money(total) + '</b></div><button type="button" class="btn block" data-next>Continue to checkout</button><button type="button" class="btn wa block" data-quick>' + I.wa + 'Send this order on WhatsApp</button><p>Prices are confirmed by the bakery. Delivery is quoted separately.</p></div>';
    else body = '<form class="dr-body co" id="coForm" novalidate>' +
        '<div class="f"><label for="dDate">Date needed <i>*</i></label><input id="dDate" type="date" required min="' + minDate() + '" class="note-in"><span class="err"></span></div>' +
        '<div class="f"><span class="lab">Delivery or collection</span><div class="seg dark" role="radiogroup">' + C.delivery.options.map(function (o, i) { return '<label><input type="radio" name="dMeth" value="' + esc(o.label) + '"' + (i === 0 ? ' checked' : '') + '><span>' + esc(o.label) + '</span></label>'; }).join('') + '</div></div>' +
        '<div class="f" id="dAddrF"><label for="dAddr">Delivery address</label><input id="dAddr" class="note-in" autocomplete="street-address"></div>' +
        '<div class="f"><label for="dName">Your name <i>*</i></label><input id="dName" class="note-in" required autocomplete="name"><span class="err"></span></div>' +
        '<div class="f"><label for="dPhone">Phone / WhatsApp <i>*</i></label><input id="dPhone" class="note-in" type="tel" required autocomplete="tel" inputmode="tel"><span class="err"></span></div>' +
        '<div class="f"><label for="dNote">Notes</label><textarea id="dNote" class="note-in" rows="2"></textarea></div>' +
        '<div class="dr-total"><span>Estimated total</span><b>' + money(total) + '</b></div>' +
        '<div class="co-btns"><button type="submit" class="btn wa block" data-via="wa">' + I.wa + 'Send order on WhatsApp</button><button type="submit" class="btn block" data-via="req">' + I.send + 'Send order request</button>' + (hasPhone ? '<a class="btn ghost block" href="' + phoneHref(C.contact.phone) + '">' + I.phone + 'Call to order</a>' : '') + '<button type="button" class="link back" data-back>← Back to your order</button></div>' +
        (C.order && C.order.payment ? '<p class="co-note">' + esc(C.order.payment) + '</p>' : '') + '</form>';
    drawer.innerHTML = head + body;
    drawer.querySelector('.x').onclick = function () { closeDlg(drawer); };
    $$('[data-close]', drawer).forEach(function (a) { a.addEventListener('click', function () { closeDlg(drawer); }); });
    $$('[data-rm]', drawer).forEach(function (b) { b.onclick = function () { bag.splice(+b.dataset.rm, 1); saveBag(); renderDrawer(); }; });
    $$('[data-lq]', drawer).forEach(function (b) { b.onclick = function () { var l = bag[+b.dataset.lq]; l.qty = Math.max(1, Math.min(50, l.qty + +b.dataset.d)); saveBag(); renderDrawer(); var nb = drawer.querySelector('[data-lq="' + b.dataset.lq + '"][data-d="' + b.dataset.d + '"]'); if (nb) nb.focus(); }; });
    var nx = drawer.querySelector('[data-next]'); if (nx) nx.onclick = function () { step = 'checkout'; renderDrawer(); var d = $('#dDate', drawer); if (d) d.focus(); };
    var qk = drawer.querySelector('[data-quick]'); if (qk) qk.onclick = function () { sendWA(orderText()); };
    var bk = drawer.querySelector('[data-back]'); if (bk) bk.onclick = function () { step = 'list'; renderDrawer(); };
    var co = $('#coForm', drawer);
    if (co) {
      var via = 'wa'; $$('[data-via]', co).forEach(function (b) { b.addEventListener('click', function () { via = b.dataset.via; }); });
      $$('input[name="dMeth"]', co).forEach(function (r) { r.onchange = function () { $('#dAddrF', co).style.display = /deliver/i.test(r.value) ? '' : 'none'; }; });
      co.addEventListener('submit', function (e) {
        e.preventDefault();
        var bad = ['dDate', 'dName', 'dPhone'].map(function (id) { return $('#' + id, co); }).filter(function (el) {
          var v = el.value.trim(), msg = !v ? 'Please fill this in.' : (el.type === 'tel' && v.replace(/\D/g, '').length < 9 ? 'Please enter a number we can reach.' : '');
          var w = el.closest('.f'); w.classList.toggle('bad', !!msg); w.querySelector('.err').textContent = msg; return !!msg;
        });
        if (bad.length) { bad[0].focus(); return; }
        var d = { date: $('#dDate', co).value, method: $('input[name="dMeth"]:checked', co).value, address: $('#dAddr', co).value.trim(), name: $('#dName', co).value.trim(), phone: $('#dPhone', co).value.trim(), note: $('#dNote', co).value.trim() };
        var text = orderText(d);
        var done = function (how) { bag = []; saveBag(); drawer.innerHTML = head + '<div class="dr-body"><div class="dr-empty"><b>Thank you, ' + esc(d.name) + '!</b>' + (how === 'post' ? 'Your order request has been sent. We will contact you on ' + esc(d.phone) + ' to confirm.' : how === 'mail' ? 'Your email app has opened with your order. Send it to finish.' : 'Send the message in WhatsApp to finish. We will confirm availability and the total.') + '<br><br><button type="button" class="btn sm" data-x>Close</button></div></div>'; drawer.querySelector('.x').onclick = drawer.querySelector('[data-x]').onclick = function () { closeDlg(drawer); }; };
        if (via === 'req') sendRequest('Cake order: ' + d.name, text, d).then(done, function () { toast('We could not send it. Try WhatsApp instead?', 'WhatsApp', function () { sendWA(text); done('wa'); }); });
        else { sendWA(text); done('wa'); }
      });
    }
  }

  /* ---------------- build ---------------- */
  $('#hdr').innerHTML = navHTML();
  app.innerHTML = heroHTML() + howHTML() + collectionHTML() + experienceHTML() + designerHTML() + aboutHTML() + reviewsHTML() + galleryHTML() + contactHTML();
  $('#ftr').innerHTML = footerHTML() + mbarHTML();
  sheetShell(); drawerShell();
  renderBagCount();
  bindExperience(); bindDesigner(); bindReviews(); bindGallery();

  /* in-page links: scroll without leaving the page (a <base> tag may be set) */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]'); if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
    var h = a.getAttribute('href'); if (h.indexOf('#product/') === 0) return;
    var el = h === '#' || h === '#top' ? document.body : document.getElementById(h.slice(1)); if (!el) return;
    e.preventDefault(); closeMenu();
    if (h === '#top' || h === '#') window.scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' }); else el.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });
    if (h === '#app') el.focus({ preventScroll: true });
    history.replaceState(history.state, '', location.pathname + location.search + (h === '#top' ? '' : h));
  });
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-open],[data-wa],[data-wa-general],[data-bag],[data-cat],[data-jump]'); if (!t) return;
    if (t.hasAttribute('data-open')) { e.preventDefault(); openProduct(t.dataset.open); }
    else if (t.hasAttribute('data-wa')) { var p = byId(t.dataset.wa); sendWA((C.whatsapp.greeting || "Hello! I'd like to order") + ' the ' + p.name + '. Please share the sizes, flavours and prices available. ' + (C.whatsapp.closing || '')); }
    else if (t.hasAttribute('data-wa-general')) { closeMenu(); sendWA((C.whatsapp && C.whatsapp.general) || "Hello! I'd like to order a cake. Please share what is available."); }
    else if (t.hasAttribute('data-bag')) { closeMenu(); openBag(); }
    else if (t.dataset.cat) filterGrid(t.dataset.cat);
    else if (t.hasAttribute('data-jump')) setTimeout(function () { filterGrid(t.dataset.jump); }, 10);
  });

  /* ---------------- mobile menu ---------------- */
  var burger = $('.burger'), menu = $('#menu');
  function setMenu(open) {
    document.body.classList.toggle('menu-open', open); document.body.classList.toggle('lock', open);
    burger.setAttribute('aria-expanded', open); burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); menu.setAttribute('aria-hidden', !open);
    $$('a, button', menu).forEach(function (a) { a.tabIndex = open ? 0 : -1; });
    if (open) setTimeout(function () { var a = menu.querySelector('a'); if (a) a.focus({ preventScroll: true }); }, 350);
  }
  function closeMenu() { if (document.body.classList.contains('menu-open')) setMenu(false); }
  burger.onclick = function () { setMenu(!document.body.classList.contains('menu-open')); };
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) { setMenu(false); burger.focus(); } });
  if (MOBILE.addEventListener) MOBILE.addEventListener('change', closeMenu);

  /* ---------------- hero ---------------- */
  (function hero() {
    var H = C.hero, sec = $('.hero'), rep = $('.replay', sec), R = H.reveal, timers = [];
    var reveal = function () { sec.classList.add('in'); timers.push(setTimeout(function () { sec.classList.add('settled'); }, RM ? 0 : 1800)); };
    if (R) {
      var img = $('.hero-img img', sec), box = $('.hero-img', sec);
      var portrait = function () { return window.matchMedia('(max-width: 700px) and (orientation: portrait)').matches; };
      // put the zoom origin (and the line of light) on the cake's layers, wherever object-fit places them
      var place = function () {
        var W = box.clientWidth, Hh = box.clientHeight, iw = img.naturalWidth || 1, ih = img.naturalHeight || 1, mob = portrait() && R.image.mobile;
        var f = (mob ? R.focus.mobile : R.focus.desktop) || [0.5, 0.5], pos = ((mob ? R.position.mobile : R.position.desktop) || '50% 50%').split(' ').map(parseFloat);
        img.style.objectPosition = pos[0] + '% ' + pos[1] + '%';
        var s = Math.max(W / iw, Hh / ih), dw = iw * s, dh = ih * s, ox = (W - dw) * pos[0] / 100, oy = (Hh - dh) * pos[1] / 100;
        var fx = Math.round(ox + f[0] * dw), fy = Math.round(oy + f[1] * dh);
        sec.style.setProperty('--fx', fx + 'px'); sec.style.setProperty('--fy', fy + 'px'); sec.style.setProperty('--z', R.zoom || 2.2);
      };
      var play = function () {
        timers.forEach(clearTimeout); timers = []; place();
        sec.classList.remove('h-line', 'h-open', 'h-dolly', 'h-drift', 'in', 'settled', 'h-fin'); void sec.offsetWidth;
        if (RM) { sec.classList.add('h-fin', 'h-open', 'h-dolly'); reveal(); return; }
        timers.push(setTimeout(function () { sec.classList.add('h-line'); }, 250));     // a line of light draws down through the cake
        timers.push(setTimeout(function () { sec.classList.add('h-open', 'h-dolly'); }, 1150));  // the frame parts and the camera eases back
        timers.push(setTimeout(reveal, 2900));
        timers.push(setTimeout(function () { sec.classList.add('h-fin', 'h-drift'); rep.hidden = false; }, 5000));
      };
      if (img.complete && img.naturalWidth) play(); else { img.addEventListener('load', play, { once: true }); img.addEventListener('error', function () { sec.classList.add('h-fin', 'h-open'); reveal(); }, { once: true }); }
      window.addEventListener('resize', place);
      rep.onclick = function () { window.scrollTo({ top: 0, behavior: 'auto' }); rep.hidden = true; play(); };
      return;
    }
    // film (a client's own footage)
    var v = $('video', sec), still = $('.still', sec), shown = false, k = window.matchMedia('(max-width: 599px)').matches ? 'mobile' : 'desktop';
    var rv = function () { if (!shown) { shown = true; reveal(); } };
    if (H.still) still.src = H.still[k];
    if (RM || !H.video || !H.video[k]) { sec.classList.add('rm'); rv(); v.remove(); return; }
    if (H.poster) v.poster = H.poster[k];
    [[H.videoWebm && H.videoWebm[k], 'video/webm'], [H.video[k], 'video/mp4']].forEach(function (s) { if (!s[0]) return; var so = document.createElement('source'); so.src = s[0]; so.type = s[1]; v.appendChild(so); });
    v.load(); v.addEventListener('timeupdate', function () { if (v.currentTime >= (H.revealAt || 0)) rv(); });
    v.addEventListener('ended', function () { rv(); rep.hidden = false; });
    var tp = v.play(); if (tp && tp.catch) tp.catch(function () { sec.classList.add('rm'); rv(); });
    setTimeout(rv, ((H.revealAt || 0) + 2.5) * 1000);
    rep.onclick = function () { sec.classList.remove('rm'); rep.hidden = true; v.currentTime = 0; v.play(); };
  })();

  /* ---------------- scroll: nav, parallax, mobile bar ---------------- */
  var nav = $('#nav'), media = $('[data-hero-media]'), copy = $('.hero-copy'), mbar = $('.mbar'), pars = $$('[data-par]'), ticking = false;
  var stripH = (function () { var s = $('.cstrip'); return s ? s.offsetHeight : 0; })(), studio = $('#design'), typing = false;
  document.documentElement.style.setProperty('--strip0', stripH + 'px');   /* the hero fills the screen below any strip above the site */
  function onScroll() {
    ticking = false;
    var y = window.scrollY, vh = window.innerHeight, heroH = $('.hero').offsetHeight;
    document.documentElement.style.setProperty('--strip', Math.max(0, stripH - y) + 'px');
    nav.classList.toggle('solid', y > 30); nav.classList.toggle('on-hero', y < heroH - 80);
    // the studio has its own action bar; the order bar steps aside there, and whenever the keyboard is open
    var inStudio = false;
    if (studio) { var r = studio.getBoundingClientRect(); inStudio = r.top < vh * 0.6 && r.bottom > vh * 0.4; }
    document.body.classList.toggle('in-studio', inStudio && !$('#cDone.on'));
    if (mbar) mbar.classList.toggle('on', y > vh * 0.55 && !inStudio && !typing);
    if (RM) return;
    if (y < vh * 1.2) { media.style.transform = 'translate3d(0,' + (y * 0.18).toFixed(1) + 'px,0)'; copy.style.transform = 'translate3d(0,' + (-y * 0.1).toFixed(1) + 'px,0)'; copy.style.opacity = Math.max(0, 1 - y / (vh * .7)).toFixed(3); }
    pars.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.bottom < -100 || r.top > vh + 100) return; var c = (r.top + r.height / 2 - vh / 2); el.style.transform = 'translate3d(0,' + (c * -(+el.dataset.par)).toFixed(1) + 'px,0)'; });
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener('resize', function () { var s = $('.cstrip'); stripH = s ? s.offsetHeight : 0; onScroll(); });
  // a text field has focus (the phone keyboard is likely open): keep fixed bars out of the way
  document.addEventListener('focusin', function (e) { if (e.target.matches('input:not([type=radio]):not([type=checkbox]):not([type=file]), textarea, select')) { typing = true; document.body.classList.add('typing'); onScroll(); } });
  document.addEventListener('focusout', function () { setTimeout(function () { var a = document.activeElement; typing = !!(a && a.matches && a.matches('input:not([type=radio]):not([type=checkbox]):not([type=file]), textarea, select')); document.body.classList.toggle('typing', typing); onScroll(); }, 60); });
  onScroll();
  if ('IntersectionObserver' in window) {
    var links = $$('.nav-links a');
    var navIO = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) links.forEach(function (a) { a.setAttribute('aria-current', a.getAttribute('href') === '#' + e.target.id ? 'true' : 'false'); }); }); }, { rootMargin: '-50% 0px -49% 0px' });
    $$('main > section').forEach(function (s) { navIO.observe(s); });
  }

  /* ---------------- reveals (headlines settle fully visible) ---------------- */
  $$('.split').forEach(function (el) {
    var i = 0;
    (function walk(n) { Array.prototype.slice.call(n.childNodes).forEach(function (c) {
      if (c.nodeType === 3) { var frag = document.createDocumentFragment(); c.textContent.split(/(\s+)/).forEach(function (w) { if (!w) return; if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(' ')); return; } var s = document.createElement('span'); s.className = 'w'; var inn = document.createElement('span'); inn.textContent = w; inn.style.setProperty('--i', i++); s.appendChild(inn); frag.appendChild(s); }); n.replaceChild(frag, c); }
      else if (c.nodeType === 1 && !c.classList.contains('w')) walk(c); }); })(el);
    el.dataset.words = i;
  });
  var settle = function (el) { if (el.classList.contains('split')) setTimeout(function () { el.classList.add('settled'); }, RM ? 0 : 1100 + (+el.dataset.words || 0) * 50); };
  var rvs = $$('.rv, .rv-img, .split');
  if (RM || !('IntersectionObserver' in window)) rvs.forEach(function (el) { el.classList.add('in'); settle(el); });
  else { var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); settle(e.target); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 }); rvs.forEach(function (el) { io.observe(el); }); }

  route();
})();
