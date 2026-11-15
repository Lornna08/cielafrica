/* ==========================================================================
   CRÈME MOTION — the site
   Reads CREME.config (config/site.config.js), CREME.products / categories
   (data/menu.js) and the editorial content (data/content.js) and builds every
   section. Brand content never lives in this file.
   ========================================================================== */
(function () {
  'use strict';
  var C = CREME.config, P = CREME.products, CATS = CREME.categories;
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MOBILE = window.matchMedia('(max-width: 900px)');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var money = function (n) { return (C.currency.prefix || '') + Number(n).toLocaleString(C.currency.locale || undefined); };
  var pic = function (src, w) { return 'img/p/' + src + '-' + (w || 800) + '.webp'; };
  var srcset = function (src) { return pic(src, 800) + ' 800w, ' + pic(src, 1600) + ' 1600w'; };
  var byId = function (id) { for (var i = 0; i < P.length; i++) if (P[i].id === id) return P[i]; return null; };
  var catLabel = function (id) { for (var i = 0; i < CATS.length; i++) if (CATS[i].id === id) return CATS[i].label; return ''; };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };

  var I = {
    wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2s.2-1.1.1-1.2-.2-.2-.4-.3z"/></svg>',
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 8h14l-1.2 12.1a1 1 0 0 1-1 .9H7.2a1 1 0 0 1-1-.9L5 8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>',
    l: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    r: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
    replay: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5"/><path d="M4 4v4.5h4.5"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/></svg>'
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
    if (C.seo) {
      document.title = C.seo.title;
      var d = $('meta[name="description"]'); if (d) d.content = C.seo.description;
    }
    var fi = $('link[rel="icon"]'); if (fi && C.brand.favicon) fi.href = C.brand.favicon;
    if (RM) document.documentElement.classList.add('rm-all');
  })();

  function logoHTML() {
    if (C.brand.logo) return '<img src="' + esc(C.brand.logo) + '" alt="' + esc(C.brand.name) + '">';
    var n = esc(C.brand.name);
    return n.replace(/ (&amp;|and) /, ' <i>$1</i> ');
  }

  /* ---------------- toast ---------------- */
  var toastEl, toastT;
  function toast(msg, action, fn) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); toastEl.setAttribute('aria-live', 'polite'); document.body.appendChild(toastEl); }
    toastEl.innerHTML = '<span>' + esc(msg) + '</span>' + (action ? '<button type="button">' + esc(action) + '</button>' : '');
    if (action) toastEl.querySelector('button').onclick = function () { toastEl.classList.remove('on'); fn(); };
    toastEl.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('on'); }, 4200);
  }

  /* ---------------- dialogs (open / animated close) ---------------- */
  function openDlg(d) { if (!d.open) { d.showModal(); document.body.classList.add('lock'); } }
  function closeDlg(d, cb) {
    if (!d.open) { if (cb) cb(); return; }
    var done = function () { d.classList.remove('closing'); d.close(); if (!$$('dialog[open]').length) document.body.classList.remove('lock'); if (cb) cb(); };
    if (RM || !d.classList.contains('sheet') && !d.classList.contains('drawer')) return done();
    d.classList.add('closing'); setTimeout(done, 330);
  }
  function wireDlg(d, onClose) {
    d.addEventListener('cancel', function (e) { e.preventDefault(); onClose ? onClose() : closeDlg(d); });
    d.addEventListener('click', function (e) { if (e.target === d) onClose ? onClose() : closeDlg(d); });
  }

  /* ---------------- WhatsApp ---------------- */
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
  function lineText(p, o) {
    var bits = [];
    if (o.size) bits.push('Size: ' + o.size);
    if (o.flavor) bits.push('Flavour: ' + o.flavor);
    if (o.qty > 1) bits.push('Quantity: ' + o.qty);
    if (o.note) bits.push('Note: ' + o.note);
    return bits;
  }
  function productMsg(p, o) {
    var w = C.whatsapp || {};
    var bits = lineText(p, o);
    return (w.greeting || "Hello! I'd like to order") + ' the ' + p.name + '.' + (bits.length ? ' ' + bits.join('. ') + '.' : '') + ' ' + (w.closing || 'Please confirm availability.');
  }

  /* ---------------- order list (bag) ---------------- */
  var BAG_KEY = 'creme-bag-' + (C.brand.short || 'site');
  var bag = [];
  try { bag = JSON.parse(localStorage.getItem(BAG_KEY) || '[]').filter(function (l) { return byId(l.id); }); } catch (e) { bag = []; }
  function saveBag() { try { localStorage.setItem(BAG_KEY, JSON.stringify(bag)); } catch (e) {} renderBagCount(); }
  function linePrice(l) { var p = byId(l.id), s = (p.sizes || [])[l.si] || {}; return (s.price || p.price) * l.qty; }
  function addToBag(p, o) {
    var key = [p.id, o.si, o.flavor || '', o.note || ''].join('|');
    var ex = bag.filter(function (l) { return l.key === key; })[0];
    if (ex) ex.qty += o.qty; else bag.push({ key: key, id: p.id, si: o.si, size: o.size, flavor: o.flavor, note: o.note, qty: o.qty });
    saveBag();
    var n = $('.bag .n'); if (n) { n.classList.remove('pop'); void n.offsetWidth; n.classList.add('pop'); }
  }
  function renderBagCount() {
    var c = bag.reduce(function (a, l) { return a + l.qty; }, 0);
    $$('.bag .n').forEach(function (n) { n.textContent = c; });
    $$('.bag').forEach(function (b) { b.setAttribute('aria-label', 'Order list, ' + c + ' item' + (c === 1 ? '' : 's')); });
  }

  /* ---------------- shell: nav, menu, hero ---------------- */
  var app = $('#app');
  function navHTML() {
    var links = C.nav.map(function (n) { return '<li><a href="' + n.href + '">' + esc(n.label) + '</a></li>'; }).join('');
    return '<header class="nav" id="nav"><div class="wrap">' +
      '<a class="logo" href="#top" aria-label="' + esc(C.brand.name) + ', home">' + logoHTML() + '</a>' +
      '<nav aria-label="Main"><ul class="nav-links">' + links + '</ul></nav>' +
      '<div class="nav-act"><button type="button" class="bag" data-bag aria-label="Order list">' + I.bag + '<span class="t">Order list</span><span class="n">0</span></button>' +
      '<button type="button" class="burger" aria-label="Open menu" aria-expanded="false" aria-controls="menu"><span></span><span></span></button></div>' +
      '</div></header>' +
      '<div class="menu" id="menu" aria-hidden="true"><ol>' + C.nav.map(function (n, i) { return '<li><a href="' + n.href + '" style="--i:' + i + '" tabindex="-1">' + esc(n.label) + '</a></li>'; }).join('') + '</ol>' +
      '<button type="button" class="btn wa" data-wa-general tabindex="-1">' + I.wa + 'Order on WhatsApp</button>' +
      '<div class="menu-foot">' + (C.contact.phone ? '<span>' + esc(C.contact.phone) + '</span>' : '') + (C.contact.email ? '<span>' + esc(C.contact.email) + '</span>' : '') + '<span>' + esc(C.brand.tagline) + '</span></div></div>';
  }
  function heroHTML() {
    var h = C.hero, wi = 0;
    var lines = h.headline.map(function (ln) {
      return '<span class="ln">' + ln.split(' ').map(function (w) { return '<span class="w" style="--i:' + (wi++) + '">' + esc(w) + '</span>'; }).join(' ') + '</span>';
    }).join('');
    return '<section class="hero" id="top" aria-label="Welcome">' +
      '<div class="hero-media" data-hero-media><video muted playsinline preload="auto" aria-hidden="true" tabindex="-1"></video><img class="still" alt="' + esc(h.alt) + '"></div>' +
      '<div class="hero-copy"><div class="wrap"><div class="inner">' +
      '<span class="kicker">' + esc(h.kicker) + '</span>' +
      '<h1 aria-label="' + esc(h.headline.join(' ')) + '">' + lines + '</h1>' +
      '<p class="lead">' + esc(h.text) + '</p>' +
      '<div class="cta"><a class="btn" href="' + h.primary.href + '">' + esc(h.primary.label) + '</a><a class="btn ghost" href="' + h.secondary.href + '">' + esc(h.secondary.label) + '</a></div>' +
      '</div></div></div>' +
      '<div class="hero-meta"><button type="button" class="replay" hidden>' + I.replay + 'Watch the cut again</button><a class="scroll-cue" href="#collection"><i></i>Scroll</a></div>' +
      '</section>';
  }
  function tickerHTML() {
    var items = CATS.map(function (c) { return '<span>' + esc(c.label) + '</span>'; }).join('');
    return '<div class="ticker" aria-hidden="true"><div class="track">' + items + items + '</div></div>';
  }

  /* ---------------- collection ---------------- */
  var LAYOUT = ['l', 's off', 's', 'm', 'm off', 'm', 's', 's off', 'l'];
  function cardHTML(p, i) {
    var a = p.images[0], b = p.images[1];
    var from = p.sizes && p.sizes.length > 1;
    return '<article class="card rv" data-id="' + p.id + '" data-cat="' + p.category + '">' +
      '<div class="card-media" style="position:relative">' +
      '<button type="button" class="card-fig" data-open="' + p.id + '" aria-label="View ' + esc(p.name) + '">' +
      '<img src="' + pic(a.src) + '" srcset="' + srcset(a.src) + '" sizes="(max-width: 640px) 92vw, (max-width: 1100px) 46vw, 40vw" alt="' + esc(a.alt) + '" loading="lazy" decoding="async"' + (a.pos ? ' style="object-position:' + a.pos + '"' : '') + '>' +
      (b ? '<img class="alt" src="' + pic(b.src) + '" alt="" loading="lazy" decoding="async"' + (b.pos ? ' style="object-position:' + b.pos + '"' : '') + '>' : '') +
      '<span class="no">No. ' + pad(i + 1) + '</span>' +
      '<span class="badge ' + p.availability + '">' + esc(CREME.availability[p.availability]) + '</span></button>' +
      '<div class="card-quick"><button type="button" class="btn wa sm" data-wa="' + p.id + '">' + I.wa + (p.availability === 'soldout' ? 'Ask on WhatsApp' : 'Order on WhatsApp') + '</button><button type="button" class="btn light sm ghost" data-open="' + p.id + '" tabindex="-1">Details</button></div>' +
      '</div>' +
      '<div class="card-body"><div><span class="cat">' + esc(catLabel(p.category)) + '</span><h3><a href="#product/' + p.id + '" data-open="' + p.id + '">' + esc(p.name) + '</a></h3><p>' + esc(p.short) + '</p></div>' +
      '<div class="price">' + (from ? '<small>From</small>' : '') + money(p.price) + '</div></div>' +
      '</article>';
  }
  function collectionHTML() {
    var tabs = '<button type="button" class="tab" data-cat="all" aria-pressed="true">All<sup>' + P.length + '</sup></button>' +
      CATS.map(function (c) { var n = P.filter(function (p) { return p.category === c.id; }).length; return n ? '<button type="button" class="tab" data-cat="' + c.id + '" aria-pressed="false">' + esc(c.label) + '<sup>' + n + '</sup></button>' : ''; }).join('');
    return '<section class="sec" id="collection" aria-labelledby="collT"><div class="wrap">' +
      '<div class="sec-head"><div><div class="chap rv"><b>01</b><span class="kicker">The signature collection</span></div><h2 class="h-sec split" id="collT">Baked to be <em>remembered.</em></h2></div>' +
      '<div class="coll-tabs-stick"><div class="tabs" role="group" aria-label="Filter by category">' + tabs + '</div></div></div>' +
      '<div class="grid" id="grid">' + P.map(cardHTML).join('') + '</div>' +
      '<div class="coll-foot rv"><a class="btn ghost" href="#custom">Can’t see your cake? Design your own</a></div>' +
      '</div></section>';
  }
  function layoutGrid() {
    var vis = $$('#grid .card').filter(function (c) { return !c.classList.contains('hidden'); });
    vis.forEach(function (c, i) {
      c.classList.remove('l', 's', 'm', 'off');
      var cls = vis.length < 3 ? 'm' : LAYOUT[i % LAYOUT.length];
      cls.split(' ').forEach(function (k) { if (k !== 'm') c.classList.add(k); });
      c.querySelector('.no').textContent = 'No. ' + pad(i + 1);
    });
  }
  function filterGrid(cat, btn) {
    var apply = function () {
      $$('.tab').forEach(function (t) { t.setAttribute('aria-pressed', t === btn ? 'true' : 'false'); });
      var k = 0;
      $$('#grid .card').forEach(function (c) {
        var show = cat === 'all' || c.dataset.cat === cat;
        c.classList.toggle('hidden', !show);
        c.classList.remove('enter');
        if (show) { c.classList.add('in'); if (!RM) { void c.offsetWidth; c.style.setProperty('--k', k++); c.classList.add('enter'); } }
      });
      layoutGrid();
    };
    if (document.startViewTransition && !RM) document.startViewTransition(apply); else apply();
    var g = $('#collection'); if (g.getBoundingClientRect().top < -200) g.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });
  }

  /* ---------------- product sheet ---------------- */
  var sheet, cur = null, sel = {};
  function sheetShell() {
    sheet = document.createElement('dialog'); sheet.className = 'sheet'; sheet.id = 'sheet'; sheet.setAttribute('aria-labelledby', 'pName');
    document.body.appendChild(sheet);
    wireDlg(sheet, closeProduct);
  }
  function openProduct(id, push) {
    var p = byId(id); if (!p) return;
    cur = p; sel = { si: 0, flavor: (p.flavors || [])[0] || '', qty: 1, note: '', img: 0 };
    var opener = document.activeElement;
    sheet.innerHTML = '<div class="sheet-in">' +
      '<div class="gal"><div class="gal-main" data-gal>' + p.images.map(function (im, i) { return '<img ' + (i === 0 ? 'class="on" ' : '') + 'src="' + pic(im.src, 1600) + '" srcset="' + srcset(im.src) + '" sizes="(max-width: 900px) 100vw, 56vw" alt="' + esc(im.alt) + '"' + (im.pos ? ' style="object-position:' + im.pos + '"' : '') + '>'; }).join('') +
      (p.images.length > 1 ? '<span class="gal-count" aria-hidden="true">01 / ' + pad(p.images.length) + '</span><div class="gal-nav"><button type="button" data-g="-1" aria-label="Previous photo">' + I.l + '</button><button type="button" data-g="1" aria-label="Next photo">' + I.r + '</button></div>' : '') + '</div>' +
      (p.images.length > 1 ? '<div class="thumbs" role="group" aria-label="Photos">' + p.images.map(function (im, i) { return '<button type="button" data-t="' + i + '" aria-label="Photo ' + (i + 1) + '"' + (i === 0 ? ' aria-current="true"' : '') + '><img src="' + pic(im.src) + '" alt=""></button>'; }).join('') + '</div>' : '') +
      '</div>' +
      '<div class="info">' +
      '<span class="kicker">' + esc(catLabel(p.category)) + '</span>' +
      '<h2 id="pName">' + esc(p.name) + '</h2>' +
      '<p class="p-price"><span data-price>' + money(p.price) + '</span><small data-serves></small></p>' +
      '<p class="desc">' + esc(p.description) + '</p>' +
      (p.sizes && p.sizes.length ? '<fieldset class="opt"><legend>' + (p.sizes.length > 1 ? 'Size' : 'Option') + '</legend><div class="chips">' + p.sizes.map(function (s, i) { return '<label class="chip"><input type="radio" name="size" value="' + i + '"' + (i === 0 ? ' checked' : '') + '><span>' + esc(s.label) + (s.serves ? '<small>Serves ' + esc(s.serves) + '</small>' : '') + '</span></label>'; }).join('') + '</div></fieldset>' : '') +
      (p.flavors && p.flavors.length ? '<fieldset class="opt"><legend>Flavour</legend><div class="chips">' + p.flavors.map(function (f, i) { return '<label class="chip"><input type="radio" name="flavor" value="' + esc(f) + '"' + (i === 0 ? ' checked' : '') + '><span>' + esc(f) + '</span></label>'; }).join('') + '</div></fieldset>' : '') +
      '<div class="opt" style="display:flex;flex-wrap:wrap;gap:18px 26px;align-items:center"><div><div class="sr" id="qL">Quantity</div><div class="qty" role="group" aria-labelledby="qL"><button type="button" data-q="-1" aria-label="One less">−</button><output aria-live="polite">1</output><button type="button" data-q="1" aria-label="One more">+</button></div></div>' +
      '<span class="avail ' + p.availability + '">' + esc(CREME.availability[p.availability]) + (p.lead ? ' · ' + esc(p.lead) + ' notice' : '') + '</span></div>' +
      '<div class="opt"><label class="sr" for="pNote">Message or note</label><input class="note-in" id="pNote" maxlength="140" placeholder="Message on the cake or a note (optional)"></div>' +
      (p.details && p.details.length ? '<dl class="det">' + p.details.map(function (d) { return '<div><dt>' + esc(d[0]) + '</dt><dd>' + esc(d[1]) + '</dd></div>'; }).join('') + '</dl>' : '') +
      '<div class="buybar">' + (p.availability === 'soldout' ? '<p class="soldout-note">Sold out for now. Message us to ask when it is back.</p>' : '') +
      '<button type="button" class="btn wa" data-sheet-wa>' + I.wa + (p.availability === 'soldout' ? 'Ask on WhatsApp' : 'Order on WhatsApp') + '</button>' +
      '<button type="button" class="btn ghost" data-sheet-add' + (p.availability === 'soldout' ? ' disabled' : '') + '>Add to order list</button></div>' +
      '</div></div><button type="button" class="x" aria-label="Close">' + I.x + '</button>';
    sheet._opener = opener;
    updatePrice();
    openDlg(sheet);
    var h2 = sheet.querySelector('#pName'); h2.tabIndex = -1; h2.focus({ preventScroll: true });
    sheet.querySelector('.info').scrollTop = 0; sheet.querySelector('.sheet-in').scrollTop = 0;
    if (push !== false) history.pushState({ p: id }, '', location.pathname + location.search + '#product/' + id);
    bindSheet(p);
  }
  function updatePrice() {
    var p = cur, s = (p.sizes || [])[sel.si] || {};
    sheet.querySelector('[data-price]').textContent = money((s.price || p.price) * sel.qty);
    sheet.querySelector('[data-serves]').textContent = s.serves ? 'Serves ' + s.serves + (sel.qty > 1 ? ' each' : '') : '';
    var o = sheet.querySelector('output'); if (o) o.textContent = sel.qty;
  }
  function curOpts() { var p = cur, s = (p.sizes || [])[sel.si]; return { si: sel.si, size: s ? s.label : '', flavor: sel.flavor, qty: sel.qty, note: sel.note.trim() }; }
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
    $$('input[name="flavor"]', sheet).forEach(function (r) { r.onchange = function () { sel.flavor = r.value; }; });
    $$('[data-q]', sheet).forEach(function (b) { b.onclick = function () { sel.qty = Math.max(1, Math.min(50, sel.qty + +b.dataset.q)); updatePrice(); }; });
    $('#pNote', sheet).oninput = function (e) { sel.note = e.target.value; };
    $$('[data-g]', sheet).forEach(function (b) { b.onclick = function () { setImg(sel.img + +b.dataset.g); }; });
    $$('[data-t]', sheet).forEach(function (b) { b.onclick = function () { setImg(+b.dataset.t); }; });
    swipe($('[data-gal]', sheet), function (d) { setImg(sel.img + d); });
    sheet.querySelector('[data-sheet-wa]').onclick = function () {
      sendWA(p.availability === 'soldout' ? 'Hello! Is the ' + p.name + ' available again? I would like to order one.' : productMsg(p, curOpts()));
    };
    var add = sheet.querySelector('[data-sheet-add]');
    if (add) add.onclick = function () { addToBag(p, curOpts()); closeProduct(); toast(p.name + ' added to your order list', 'View', openBag); };
    sheet.onkeydown = function (e) { if (e.target.tagName === 'INPUT' && e.target.type !== 'radio') return; if (e.key === 'ArrowLeft' && e.target.name !== 'size' && e.target.name !== 'flavor') setImg(sel.img - 1); if (e.key === 'ArrowRight' && e.target.name !== 'size' && e.target.name !== 'flavor') setImg(sel.img + 1); };
  }
  function closeProduct(fromPop) {
    var op = sheet._opener;
    closeDlg(sheet, function () { if (op && op.focus && document.contains(op)) op.focus({ preventScroll: true }); });
    if (fromPop !== true && /^#product\//.test(location.hash)) {
      if (history.state && history.state.p) history.back(); else history.replaceState(null, '', location.pathname + location.search + '#collection');
    }
  }
  window.addEventListener('popstate', function () { route(true); });
  function route(fromPop) {
    var m = location.hash.match(/^#product\/([\w-]+)/);
    if (m && byId(m[1])) { if (!sheet.open || !cur || cur.id !== m[1]) openProduct(m[1], false); }
    else if (sheet && sheet.open) closeProduct(true);
  }

  /* swipe helper (touch / pen) */
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
        if (!e.isIntersecting) return;
        var i = +e.target.dataset.ch; if (i === last) return;
        chs.forEach(function (c, k) { c.classList.toggle('on', k === i); });
        figs.forEach(function (f, k) { f.classList.remove('was'); if (k === last) f.classList.add('was'); f.classList.toggle('on', k === i); });
        last = i;
        num.textContent = pad(i + 1);
        bar.style.height = ((i + 1) / chs.length * 100) + '%';
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    chs.forEach(function (c) { io.observe(c); });
    bar.style.height = (1 / chs.length * 100) + '%';
  }

  /* ---------------- custom cake form ---------------- */
  function opts(list, ph) { return '<option value="">' + esc(ph) + '</option>' + list.map(function (o) { return '<option>' + esc(o) + '</option>'; }).join(''); }
  function minDate() { var d = new Date(); d.setDate(d.getDate() + ((C.orders && C.orders.leadDays) || 0)); return d.toISOString().slice(0, 10); }
  function customHTML() {
    var F = C.customForm;
    return '<section class="sec custom" id="custom" aria-labelledby="custT"><div class="wrap"><div class="custom-grid">' +
      '<aside class="custom-aside"><div class="chap rv"><b>03</b><span class="kicker">Custom cakes</span></div>' +
      '<h2 class="h-sec split" id="custT">Your idea, <em>our oven.</em></h2>' +
      '<p class="lead rv" style="margin-top:22px">Tell us the occasion, the size and the look you love. Add a photo for reference and we will reply with a design and a price.</p>' +
      '<ol class="steps-mini rv"><li>Fill in the details below</li><li>We reply with a design, price and date</li><li>Confirm with a deposit and we start baking</li></ol>' +
      '<figure class="rv-img" data-par="0.06"><img src="' + pic('gold-cherries', 1600) + '" srcset="' + srcset('gold-cherries') + '" sizes="40vw" alt="A celebration cake topped with gold cherries and piped pearls" loading="lazy" decoding="async"></figure></aside>' +
      '<div><form class="form" id="cform" novalidate>' +
      '<div class="f"><label for="cOcc">Occasion <i>*</i></label><select id="cOcc" name="occasion" required>' + opts(F.occasions, 'Choose an occasion') + '</select><span class="err" aria-live="polite"></span></div>' +
      '<div class="f"><label for="cSize">Cake size <i>*</i></label><select id="cSize" name="size" required>' + opts(F.sizes, 'Choose a size') + '</select><span class="err" aria-live="polite"></span></div>' +
      '<div class="f"><label for="cFlav">Flavour <i>*</i></label><select id="cFlav" name="flavor" required>' + opts(F.flavors, 'Choose a flavour') + '</select><span class="err" aria-live="polite"></span></div>' +
      '<div class="f"><label for="cServ">Number of servings</label><input id="cServ" name="servings" type="number" inputmode="numeric" min="1" max="' + (F.servingsMax || 300) + '" placeholder="e.g. 20"><span class="err" aria-live="polite"></span></div>' +
      '<fieldset class="f full" style="border:0;padding:0;margin:0"><legend class="lab" style="margin-bottom:10px">Preferred design</legend><div class="chips">' + F.designs.map(function (d, i) { return '<label class="chip"><input type="radio" name="design" value="' + esc(d) + '"' + (i === 0 ? ' checked' : '') + '><span>' + esc(d) + '</span></label>'; }).join('') + '</div></fieldset>' +
      '<div class="f full"><span class="lab" id="cRefL">Reference image</span>' +
      '<div class="drop" id="cDrop">' + I.up + '<p><b>Upload a photo</b> or drag it here<br>JPG, PNG or HEIC, up to ' + ((C.orders && C.orders.maxImageMB) || 8) + ' MB</p><input id="cRef" name="reference" type="file" accept="image/*" aria-labelledby="cRefL"></div>' +
      '<div class="preview" id="cPrev"><img alt="Your reference photo"><div class="meta"><b></b><span></span></div><button type="button">Remove</button></div><span class="err" aria-live="polite"></span></div>' +
      '<div class="f"><label for="cDate">Date needed <i>*</i></label><input id="cDate" name="date" type="date" required min="' + minDate() + '"><span class="err" aria-live="polite"></span></div>' +
      '<div class="f"><span class="lab" id="cMethL">Delivery or collection</span><div class="seg" role="radiogroup" aria-labelledby="cMethL">' + C.delivery.options.map(function (o, i) { return '<label><input type="radio" name="method" value="' + esc(o.label) + '"' + (i === 0 ? ' checked' : '') + '><span>' + esc(o.label) + '</span></label>'; }).join('') + '</div></div>' +
      '<div class="f full" id="cAddrF"><label for="cAddr">Delivery area or address</label><input id="cAddr" name="address" autocomplete="street-address" placeholder="Where should we deliver?"></div>' +
      '<div class="f full"><label for="cNotes">Additional instructions</label><textarea id="cNotes" name="instructions" placeholder="Colours, theme, a message on the cake, allergies…"></textarea></div>' +
      '<div class="f"><label for="cName">Your name <i>*</i></label><input id="cName" name="name" autocomplete="name" required><span class="err" aria-live="polite"></span></div>' +
      '<div class="f"><label for="cPhone">Phone / WhatsApp <i>*</i></label><input id="cPhone" name="phone" type="tel" autocomplete="tel" inputmode="tel" required placeholder="+254 7XX XXX XXX"><span class="err" aria-live="polite"></span></div>' +
      '<div class="f full"><label for="cEmail">Email (optional)</label><input id="cEmail" name="email" type="email" autocomplete="email"><span class="err" aria-live="polite"></span></div>' +
      '<div class="form-foot"><button type="submit" class="btn light" id="cSend">' + (C.orders && C.orders.endpoint ? 'Send my enquiry' : I.wa + 'Send on WhatsApp') + '</button><p>' + (C.orders && C.orders.endpoint ? 'We reply within one working day.' : 'Your enquiry opens in WhatsApp, ready to send. Attach your reference photo in the chat.') + '</p></div>' +
      '</form>' +
      '<div class="done" id="cDone" tabindex="-1" aria-live="polite"><span class="kicker">Thank you</span><h3>Your enquiry is on its way.</h3><p></p><button type="button" class="btn light" id="cAgain">Send another enquiry</button></div>' +
      '</div></div></div></section>';
  }
  function bindCustom() {
    var f = $('#cform'), file = $('#cRef'), drop = $('#cDrop'), prev = $('#cPrev'), maxMB = (C.orders && C.orders.maxImageMB) || 8, chosen = null;
    var setErr = function (el, msg) { var w = el.closest('.f'); w.classList.toggle('bad', !!msg); var e = w.querySelector('.err'); if (e) e.textContent = msg || ''; if (msg) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid'); };
    function showFile(fl) {
      setErr(file, '');
      if (!fl) { chosen = null; prev.classList.remove('on'); drop.style.display = ''; file.value = ''; return; }
      if (!/^image\//.test(fl.type) && !/\.(heic|heif)$/i.test(fl.name)) { setErr(file, 'Please choose an image file.'); file.value = ''; return; }
      if (fl.size > maxMB * 1048576) { setErr(file, 'That photo is larger than ' + maxMB + ' MB. Please choose a smaller one.'); file.value = ''; return; }
      chosen = fl;
      var im = prev.querySelector('img'); try { im.src = URL.createObjectURL(fl); } catch (e) {}
      prev.querySelector('b').textContent = fl.name; prev.querySelector('span').textContent = (fl.size / 1048576).toFixed(1) + ' MB';
      prev.classList.add('on'); drop.style.display = 'none';
    }
    file.addEventListener('change', function () { showFile(file.files[0]); });
    ['dragenter', 'dragover'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
    ['dragleave', 'drop'].forEach(function (t) { drop.addEventListener(t, function () { drop.classList.remove('over'); }); });
    drop.addEventListener('drop', function (e) { e.preventDefault(); var fl = e.dataTransfer.files[0]; if (fl) { try { var dt = new DataTransfer(); dt.items.add(fl); file.files = dt.files; } catch (x) {} showFile(fl); } });
    prev.querySelector('button').onclick = function () { showFile(null); file.focus(); };
    $$('input[name="method"]', f).forEach(function (r) { r.onchange = function () { $('#cAddrF').style.display = /deliver/i.test(r.value) ? '' : 'none'; }; });
    $$('select, input', f).forEach(function (el) { el.addEventListener('change', function () { if (el.closest('.f.bad')) validate(el); }); });
    function validate(el) {
      var v = (el.value || '').trim();
      if (el.required && !v) { setErr(el, 'Please fill this in.'); return false; }
      if (el.type === 'tel' && v && v.replace(/\D/g, '').length < 9) { setErr(el, 'Please enter a phone number we can reach on WhatsApp.'); return false; }
      if (el.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { setErr(el, 'Please check the email address.'); return false; }
      if (el.type === 'date' && v && v < el.min) { setErr(el, 'Please choose a date from ' + new Date(el.min).toLocaleDateString(C.currency.locale, { day: 'numeric', month: 'long' }) + '.'); return false; }
      if (el.type === 'number' && v && (+v < 1 || +v > +el.max)) { setErr(el, 'Please enter between 1 and ' + el.max + '.'); return false; }
      setErr(el, ''); return true;
    }
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = $$('select, input:not([type=radio]):not([type=file])', f).filter(function (el) { return !validate(el); });
      if (bad.length) { bad[0].focus(); toast('Please check the highlighted fields'); return; }
      var d = new FormData(f), g = function (k) { return (d.get(k) || '').toString().trim(); };
      var lines = [(C.whatsapp && C.whatsapp.customIntro) || "Hello! I'd like to request a custom cake.", '',
        'Occasion: ' + g('occasion'), 'Size: ' + g('size'), 'Flavour: ' + g('flavor'), 'Design: ' + g('design')];
      if (g('servings')) lines.push('Servings: ' + g('servings'));
      lines.push('Date needed: ' + new Date(g('date') + 'T12:00').toLocaleDateString(C.currency.locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
      lines.push(g('method') + (g('address') && /deliver/i.test(g('method')) ? ': ' + g('address') : ''));
      if (g('instructions')) lines.push('Instructions: ' + g('instructions'));
      if (chosen) lines.push('Reference photo: I will send it in this chat.');
      lines.push('', 'Name: ' + g('name'), 'Phone: ' + g('phone'));
      if (g('email')) lines.push('Email: ' + g('email'));
      var msg = lines.join('\n');
      var btn = $('#cSend');
      var finish = function (how) {
        f.style.display = 'none'; var dn = $('#cDone'); dn.classList.add('on');
        dn.querySelector('p').textContent = how === 'post' ? 'Thank you, ' + g('name') + '. We will reply within one working day on ' + g('phone') + '.' : 'Send the message in WhatsApp to finish' + (chosen ? ', and attach your reference photo in the chat' : '') + '. We will reply with a design and a price.';
        dn.focus({ preventScroll: true }); dn.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' });
      };
      if (C.orders && C.orders.endpoint) {
        btn.disabled = true; btn.textContent = 'Sending…';
        d.append('summary', msg);
        fetch(C.orders.endpoint, { method: 'POST', body: d, headers: { Accept: 'application/json' } }).then(function (r) {
          if (!r.ok) throw new Error(r.status); finish('post');
        }).catch(function () {
          toast('We could not send the form. Send it on WhatsApp instead?', 'WhatsApp', function () { sendWA(msg); finish('wa'); });
        }).then(function () { btn.disabled = false; btn.textContent = 'Send my enquiry'; });
      } else { sendWA(msg); finish('wa'); }
    });
    $('#cAgain').onclick = function () { f.reset(); showFile(null); $('#cAddrF').style.display = ''; f.style.display = ''; $('#cDone').classList.remove('on'); $('#cOcc').focus(); };
  }

  /* ---------------- about ---------------- */
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

  /* ---------------- reviews ---------------- */
  function reviewsHTML() {
    var T = CREME.testimonials || []; if (!T.length) return '';
    return '<section class="sec reviews" id="reviews" aria-roledescription="carousel" aria-labelledby="revT"><div class="wrap">' +
      '<div class="chap rv"><span class="kicker" id="revT">Kind words</span></div>' +
      '<div class="rev-stage">' + T.map(function (t, i) {
        var wi = 0;
        return '<figure class="rev' + (i === 0 ? ' on' : '') + '" role="group" aria-roledescription="slide" aria-label="' + (i + 1) + ' of ' + T.length + '"' + (i ? ' aria-hidden="true"' : '') + '><q>' + esc(t.quote).split(' ').map(function (w) { return '<span class="w" style="--i:' + (wi++) + '">' + w + '</span>'; }).join(' ') + '</q>' +
          '<footer><b>' + esc(t.name) + '</b><span>' + esc(t.occasion) + '</span>' + (C.demo ? '<em>Sample review</em>' : '') + '</footer></figure>';
      }).join('') + '</div>' +
      '<div class="rev-ctrl"><button type="button" class="arr" data-rv="-1" aria-label="Previous review">' + I.l + '</button><button type="button" class="arr" data-rv="1" aria-label="Next review">' + I.r + '</button>' +
      '<div class="dots">' + T.map(function (t, i) { return '<button type="button" data-rd="' + i + '" aria-label="Review ' + (i + 1) + '"' + (i === 0 ? ' aria-current="true"' : '') + '></button>'; }).join('') + '</div></div>' +
      '</div></section>';
  }
  function bindReviews() {
    var sec = $('#reviews'); if (!sec) return;
    var rs = $$('.rev', sec), ds = $$('[data-rd]', sec), i = 0, t, DUR = 7000, paused = RM;
    function go(n) {
      i = (n + rs.length) % rs.length;
      rs.forEach(function (r, k) { r.classList.toggle('on', k === i); if (k === i) r.removeAttribute('aria-hidden'); else r.setAttribute('aria-hidden', 'true'); });
      ds.forEach(function (d, k) { d.setAttribute('aria-current', k === i ? 'true' : 'false'); });
      sched();
    }
    function sched() { clearTimeout(t); if (!paused) t = setTimeout(function () { go(i + 1); }, DUR); }
    sec.style.setProperty('--dur', DUR / 1000 + 's');
    $$('[data-rv]', sec).forEach(function (b) { b.onclick = function () { go(i + +b.dataset.rv); }; });
    ds.forEach(function (d) { d.onclick = function () { go(+d.dataset.rd); }; });
    var pause = function (v) { if (RM) return; paused = v; sec.classList.toggle('paused', v); if (v) clearTimeout(t); else sched(); };
    sec.addEventListener('mouseenter', function () { pause(true); }); sec.addEventListener('mouseleave', function () { pause(false); });
    sec.addEventListener('focusin', function () { pause(true); }); sec.addEventListener('focusout', function () { pause(false); });
    swipe($('.rev-stage', sec), function (d) { go(i + d); });
    if (RM) sec.classList.add('paused');
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { es.forEach(function (e) { if (RM) return; if (e.isIntersecting) { if (!sec.classList.contains('paused')) { paused = false; sched(); } } else { clearTimeout(t); } }); }).observe(sec);
  }

  /* ---------------- gallery ---------------- */
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
    $$('[data-gf]').forEach(function (b) {
      b.onclick = function () {
        var f = b.dataset.gf;
        var apply = function () {
          $$('[data-gf]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
          $$('.g-item').forEach(function (it) { it.classList.toggle('hide', f !== 'all' && it.dataset.tag !== f); it.classList.add('in'); });
        };
        if (document.startViewTransition && !RM) document.startViewTransition(apply); else apply();
      };
    });
    lb = document.createElement('dialog'); lb.className = 'lb'; lb.setAttribute('aria-label', 'Photo viewer');
    lb.innerHTML = '<div class="lb-stage"></div><button type="button" class="lb-arr lb-prev" aria-label="Previous photo">' + I.l + '</button><button type="button" class="lb-arr lb-next" aria-label="Next photo">' + I.r + '</button><p class="lb-cap" aria-live="polite"></p><button type="button" class="x" aria-label="Close">' + I.x + '</button>';
    document.body.appendChild(lb); wireDlg(lb);
    var visible = function () { return $$('.g-item').filter(function (it) { return !it.classList.contains('hide'); }).map(function (it) { return +it.querySelector('[data-lb]').dataset.lb; }); };
    function show(n) {
      var v = visible(), pos = v.indexOf(n); if (pos < 0) return; lbI = n;
      var g = G[n];
      lb.querySelector('.lb-stage').innerHTML = '<img src="' + pic(g.image, 1600) + '" alt="' + esc(g.alt) + '">';
      lb.querySelector('.lb-cap').innerHTML = esc(g.caption) + '<small>' + pad(pos + 1) + ' / ' + pad(v.length) + '</small>';
    }
    var step = function (d) { var v = visible(), p = v.indexOf(lbI); show(v[(p + d + v.length) % v.length]); };
    $$('[data-lb]').forEach(function (b) { b.onclick = function () { lb._opener = b; show(+b.dataset.lb); openDlg(lb); }; });
    lb.querySelector('.lb-prev').onclick = function () { step(-1); };
    lb.querySelector('.lb-next').onclick = function () { step(1); };
    lb.querySelector('.x').onclick = function () { closeDlg(lb, function () { if (lb._opener) lb._opener.focus(); }); };
    lb.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') step(-1); if (e.key === 'ArrowRight') step(1); });
    lb.addEventListener('close', function () { if (lb._opener) lb._opener.focus(); });
    swipe(lb.querySelector('.lb-stage'), step);
  }

  /* ---------------- contact ---------------- */
  function contactHTML() {
    var O = CREME.ordering, D = C.delivery, K = C.contact;
    var soc = (C.social || []).filter(function (s) { return s.url; });
    return '<section class="sec" id="contact" aria-labelledby="conT"><div class="wrap">' +
      '<div class="contact-hero"><div><div class="chap rv"><b>06</b><span class="kicker">Contact & ordering</span></div><h2 class="h-sec split" id="conT">Let’s make it <em>sweet.</em></h2></div>' +
      '<div class="big-wa rv"><p class="lead" style="margin:0">Ask about availability, request a custom cake or place an order. We usually reply within a few hours during opening times.</p>' +
      '<div class="cta"><button type="button" class="btn wa" data-wa-general>' + I.wa + 'Chat on WhatsApp</button><a class="btn ghost" href="#custom">Request a custom cake</a></div></div></div>' +
      '<ol class="steps">' + O.steps.map(function (s, i) { return '<li class="rv" style="--d:' + (i * 0.1) + 's"><h3>' + esc(s.title) + '</h3><p>' + esc(s.text) + '</p></li>'; }).join('') + '</ol>' +
      '<div class="info-grid">' +
      '<div class="rv"><h3>Delivery & collection</h3><p style="margin:0 0 18px">' + esc(D.intro) + '</p>' + D.options.map(function (o) { return '<div class="opt-card"><b>' + esc(o.label) + '</b><p>' + esc(o.text) + '</p></div>'; }).join('') +
      (D.zones && D.zones.length ? '<table class="zones"><caption class="sr">Delivery fees</caption><tbody>' + D.zones.map(function (z) { return '<tr><td>' + esc(z[0]) + '</td><td>' + esc(z[1]) + '</td></tr>'; }).join('') + '</tbody></table>' + (C.demo && D.note ? '<p class="small-note">' + esc(D.note) + '</p>' : '') : '') + '</div>' +
      '<div class="rv" style="--d:.1s"><h3>Opening hours</h3><ul class="hours">' + K.hours.map(function (h) { return '<li><span>' + esc(h[0]) + '</span><span>' + esc(h[1]) + '</span></li>'; }).join('') + '</ul></div>' +
      '<div class="rv" style="--d:.2s"><h3>Find us</h3><ul class="clist">' +
      (K.address ? '<li>' + (K.mapUrl ? '<a href="' + esc(K.mapUrl) + '" target="_blank" rel="noopener">' + esc(K.address) + '</a>' : esc(K.address)) + '</li>' : '') +
      (K.phone ? '<li><a href="tel:' + esc(K.phone.replace(/[^\d+]/g, '')) + '">' + esc(K.phone) + '</a></li>' : '') +
      (K.email ? '<li><a href="mailto:' + esc(K.email) + '">' + esc(K.email) + '</a></li>' : '') +
      '<li><button type="button" class="link" data-wa-general style="border:0;background:none;padding:0 0 3px;font:inherit;font-weight:600;cursor:pointer">WhatsApp us</button></li></ul>' +
      (soc.length ? '<div class="socials">' + soc.map(function (s) { return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.label) + '</a>'; }).join('') + '</div>' : '') + '</div>' +
      '</div>' +
      '<div class="faq"><h2 class="split">Good to <em>know.</em></h2><div>' + O.faq.map(function (q) { return '<details class="rv"><summary>' + esc(q.q) + '<i aria-hidden="true"></i></summary><div class="ans"><p>' + esc(q.a) + '</p></div></details>'; }).join('') + '</div></div>' +
      '</div></section>';
  }

  /* ---------------- footer, drawer, fab ---------------- */
  function footerHTML() {
    var soc = (C.social || []).filter(function (s) { return s.url; });
    return '<footer class="foot"><div class="wrap">' +
      '<p class="foot-big" aria-hidden="true">' + logoHTML().replace(/<img[^>]*>/, esc(C.brand.name)) + '</p>' +
      '<div class="foot-grid"><div><h4>' + esc(C.brand.name) + '</h4><p>' + esc(C.brand.tagline) + '</p><button type="button" class="btn light sm" data-wa-general>' + I.wa + 'Order on WhatsApp</button></div>' +
      '<div><h4>Explore</h4><ul>' + C.nav.map(function (n) { return '<li><a href="' + n.href + '">' + esc(n.label) + '</a></li>'; }).join('') + '<li><a href="#gallery">Gallery</a></li></ul></div>' +
      '<div><h4>Collection</h4><ul>' + CATS.map(function (c) { return '<li><a href="#collection" data-jump="' + c.id + '">' + esc(c.label) + '</a></li>'; }).join('') + '</ul></div>' +
      '<div><h4>Visit</h4><ul>' + (C.contact.address ? '<li>' + esc(C.contact.address) + '</li>' : '') + (C.contact.email ? '<li><a href="mailto:' + esc(C.contact.email) + '">' + esc(C.contact.email) + '</a></li>' : '') + (C.contact.phone ? '<li><a href="tel:' + esc(C.contact.phone.replace(/[^\d+]/g, '')) + '">' + esc(C.contact.phone) + '</a></li>' : '') + soc.map(function (s) { return '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.label) + '</a></li>'; }).join('') + '</ul></div></div>' +
      '<div class="foot-base"><span>© ' + new Date().getFullYear() + ' ' + esc(C.brand.name) + '</span><span>CRÈME MOTION template by <a href="../index.html">Ciel Africa</a> · <a href="credits.html">Photo credits</a></span></div>' +
      '</div></footer>';
  }
  var drawer;
  function drawerShell() {
    drawer = document.createElement('dialog'); drawer.className = 'drawer'; drawer.setAttribute('aria-labelledby', 'drT');
    document.body.appendChild(drawer); wireDlg(drawer);
  }
  function openBag() { renderDrawer(); openDlg(drawer); }
  function renderDrawer() {
    var total = bag.reduce(function (a, l) { return a + linePrice(l); }, 0);
    drawer.innerHTML = '<div class="dr-head"><h2 id="drT">Order list</h2><button type="button" class="x" aria-label="Close">' + I.x + '</button></div>' +
      '<div class="dr-body">' + (bag.length ? bag.map(function (l, i) {
        var p = byId(l.id), o = [l.size, l.flavor, l.note ? '“' + l.note + '”' : ''].filter(Boolean).join(' · ');
        return '<div class="line"><img src="' + pic(p.images[0].src) + '" alt=""><div><h3>' + esc(p.name) + '</h3><div class="o">' + esc(o) + '</div><button type="button" class="rm" data-rm="' + i + '">Remove</button></div>' +
          '<div class="r"><span>' + money(linePrice(l)) + '</span><div class="qty" role="group" aria-label="Quantity of ' + esc(p.name) + '"><button type="button" data-lq="' + i + '" data-d="-1" aria-label="One less">−</button><output>' + l.qty + '</output><button type="button" data-lq="' + i + '" data-d="1" aria-label="One more">+</button></div></div></div>';
      }).join('') : '<div class="dr-empty"><b>Nothing here yet.</b>Add cakes and treats from the collection, then send the whole order in one WhatsApp message.<br><br><a class="btn ghost sm" href="#collection" data-close>Browse the collection</a></div>') + '</div>' +
      (bag.length ? '<div class="dr-foot"><div class="f" style="gap:6px"><label for="dDate" style="font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase">Date needed</label><input id="dDate" type="date" min="' + minDate() + '" class="note-in"></div>' +
        '<div class="seg" role="radiogroup" aria-label="Delivery or collection" style="--ivory:var(--ink);border-color:var(--line)">' + C.delivery.options.map(function (o, i) { return '<label><input type="radio" name="dMeth" value="' + esc(o.label) + '"' + (i === 0 ? ' checked' : '') + '><span style="color:var(--ink)">' + esc(o.label) + '</span></label>'; }).join('') + '</div>' +
        '<div class="dr-total"><span>Estimated total</span><b>' + money(total) + '</b></div>' +
        '<button type="button" class="btn wa block" data-send>' + I.wa + 'Send order on WhatsApp</button><p>Prices are confirmed by the bakery with your order. Delivery is quoted separately.</p></div>' : '');
    drawer.querySelector('.x').onclick = function () { closeDlg(drawer); };
    var cl = drawer.querySelector('[data-close]'); if (cl) cl.onclick = function () { closeDlg(drawer); };
    $$('[data-rm]', drawer).forEach(function (b) { b.onclick = function () { bag.splice(+b.dataset.rm, 1); saveBag(); renderDrawer(); }; });
    $$('[data-lq]', drawer).forEach(function (b) { b.onclick = function () { var l = bag[+b.dataset.lq]; l.qty = Math.max(1, Math.min(50, l.qty + +b.dataset.d)); saveBag(); renderDrawer(); drawer.querySelector('[data-lq="' + b.dataset.lq + '"][data-d="' + b.dataset.d + '"]').focus(); }; });
    $$('.seg input', drawer).forEach(function (r) { r.addEventListener('change', function () { $$('.seg span', drawer).forEach(function (s) { s.style.color = ''; }); $$('.seg input', drawer).forEach(function (x) { x.nextElementSibling.style.color = x.checked ? 'var(--ivory)' : 'var(--ink)'; }); }); });
    var first = drawer.querySelector('.seg input'); if (first) first.dispatchEvent(new Event('change'));
    var s = drawer.querySelector('[data-send]');
    if (s) s.onclick = function () {
      var w = C.whatsapp || {}, dt = $('#dDate', drawer).value, m = $('input[name="dMeth"]:checked', drawer);
      var lines = [(w.greeting || "Hello! I'd like to order") + ':', ''];
      bag.forEach(function (l, i) { var p = byId(l.id); lines.push((i + 1) + '. ' + p.name + (lineText(p, l).length ? ' — ' + lineText(p, l).join(', ') : '')); });
      lines.push('', 'Estimated total: ' + money(bag.reduce(function (a, l) { return a + linePrice(l); }, 0)));
      if (dt) lines.push('Date needed: ' + new Date(dt + 'T12:00').toLocaleDateString(C.currency.locale, { weekday: 'long', day: 'numeric', month: 'long' }));
      if (m) lines.push(m.value);
      lines.push('', w.closing || 'Please confirm availability.');
      sendWA(lines.join('\n'));
    };
  }

  /* ---------------- build ---------------- */
  $('#hdr').innerHTML = navHTML();
  app.innerHTML = heroHTML() + tickerHTML() + collectionHTML() + experienceHTML() + customHTML() + aboutHTML() + reviewsHTML() + galleryHTML() + contactHTML();
  $('#ftr').innerHTML = footerHTML();
  if (C.whatsapp && C.whatsapp.floatingButton) { var fab = document.createElement('button'); fab.type = 'button'; fab.className = 'fab'; fab.setAttribute('aria-label', 'Chat on WhatsApp'); fab.dataset.waGeneral = ''; fab.innerHTML = I.wa; document.body.appendChild(fab); }
  sheetShell(); drawerShell();
  layoutGrid(); renderBagCount();
  bindExperience(); bindCustom(); bindReviews(); bindGallery();

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

  /* delegated clicks */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-open],[data-wa],[data-wa-general],[data-bag],[data-cat],[data-jump]');
    if (!t) return;
    if (t.hasAttribute('data-open')) { e.preventDefault(); openProduct(t.dataset.open); }
    else if (t.hasAttribute('data-wa')) { var p = byId(t.dataset.wa); sendWA(p.availability === 'soldout' ? 'Hello! Is the ' + p.name + ' available again?' : productMsg(p, { size: p.sizes && p.sizes.length ? p.sizes[0].label : '', flavor: '', qty: 1 })); }
    else if (t.hasAttribute('data-wa-general')) { closeMenu(); sendWA("Hello! I'd like to ask about your cakes and availability."); }
    else if (t.hasAttribute('data-bag')) { closeMenu(); openBag(); }
    else if (t.classList.contains('tab') && t.dataset.cat) filterGrid(t.dataset.cat, t);
    else if (t.hasAttribute('data-jump')) { var b = $('.tab[data-cat="' + t.dataset.jump + '"]'); if (b) setTimeout(function () { filterGrid(t.dataset.jump, b); }, 10); }
  });

  /* ---------------- mobile menu ---------------- */
  var burger = $('.burger'), menu = $('#menu');
  function setMenu(open) {
    document.body.classList.toggle('menu-open', open);
    document.body.classList.toggle('lock', open);
    burger.setAttribute('aria-expanded', open); burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('aria-hidden', !open);
    $$('a, button', menu).forEach(function (a) { a.tabIndex = open ? 0 : -1; });
    if (open) setTimeout(function () { var a = menu.querySelector('a'); if (a) a.focus({ preventScroll: true }); }, 350);
  }
  function closeMenu() { if (document.body.classList.contains('menu-open')) setMenu(false); }
  burger.onclick = function () { setMenu(!document.body.classList.contains('menu-open')); };
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) { setMenu(false); burger.focus(); } });
  MOBILE.addEventListener && MOBILE.addEventListener('change', function () { closeMenu(); });

  /* ---------------- hero film ---------------- */
  (function hero() {
    var H = C.hero, sec = $('.hero'), v = $('video', sec), still = $('.still', sec), rep = $('.replay', sec), shown = false;
    var k = window.matchMedia('(max-width: 599px)').matches ? 'mobile' : 'desktop';
    still.src = H.still[k];
    var reveal = function () { if (!shown) { shown = true; sec.classList.add('in'); } };
    if (RM || !H.video || !H.video[k]) { sec.classList.add('rm'); reveal(); v.remove(); return; }
    v.poster = H.poster[k];
    [[H.videoWebm && H.videoWebm[k], 'video/webm; codecs=vp9'], [H.video[k], 'video/mp4']].forEach(function (s) {
      if (!s[0]) return; var so = document.createElement('source'); so.src = s[0]; so.type = s[1]; v.appendChild(so);
    });
    var srcs = $$('source', v); if (srcs.length) srcs[srcs.length - 1].addEventListener('error', function () { sec.classList.add('rm'); reveal(); });
    v.load();
    v.addEventListener('timeupdate', function () { if (v.currentTime >= (H.revealAt || 0)) reveal(); });
    v.addEventListener('ended', function () { reveal(); rep.hidden = false; });
    var tryPlay = v.play(); if (tryPlay && tryPlay.catch) tryPlay.catch(function () { sec.classList.add('rm'); reveal(); });
    setTimeout(function () { if (v.paused && v.currentTime === 0) { sec.classList.add('rm'); reveal(); } }, 2500);
    setTimeout(reveal, ((H.revealAt || 0) + 2.5) * 1000);
    rep.onclick = function () { sec.classList.remove('rm'); rep.hidden = true; v.currentTime = 0; v.play(); };
    document.addEventListener('visibilitychange', function () { if (document.hidden && !v.paused) v.pause(); });
  })();

  /* ---------------- scroll: nav, parallax, fab ---------------- */
  var nav = $('#nav'), media = $('[data-hero-media]'), copy = $('.hero-copy'), fabEl = $('.fab'), pars = $$('[data-par]'), ticking = false;
  var stripH = (function () { var s = $('.cstrip'); return s ? s.offsetHeight : 0; })();
  function onScroll() {
    ticking = false;
    var y = window.scrollY, vh = window.innerHeight;
    document.documentElement.style.setProperty('--strip', Math.max(0, stripH - y) + 'px');
    document.documentElement.style.setProperty('--strip-vis', Math.max(0, stripH - y) + 'px');
    nav.classList.toggle('solid', y > 30);
    if (fabEl) fabEl.classList.toggle('on', y > vh * .8);
    if (RM) return;
    if (y < vh * 1.2) {
      media.style.transform = 'translate3d(0,' + (y * 0.22).toFixed(1) + 'px,0) scale(' + (1 + y / vh * 0.06).toFixed(4) + ')';
      copy.style.transform = 'translate3d(0,' + (-y * 0.12).toFixed(1) + 'px,0)'; copy.style.opacity = Math.max(0, 1 - y / (vh * .75)).toFixed(3);
    }
    pars.forEach(function (el) {
      var r = el.getBoundingClientRect(); if (r.bottom < -100 || r.top > vh + 100) return;
      var c = (r.top + r.height / 2 - vh / 2); el.style.transform = 'translate3d(0,' + (c * -(+el.dataset.par)).toFixed(1) + 'px,0)';
    });
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener('resize', function () { stripH = (function () { var s = $('.cstrip'); return s ? s.offsetHeight : 0; })(); onScroll(); });
  onScroll();

  /* active nav link */
  if ('IntersectionObserver' in window) {
    var links = $$('.nav-links a');
    var navIO = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) links.forEach(function (a) { a.setAttribute('aria-current', a.getAttribute('href') === '#' + e.target.id ? 'true' : 'false'); }); }); }, { rootMargin: '-50% 0px -49% 0px' });
    $$('main > section').forEach(function (s) { navIO.observe(s); });
  }

  /* ---------------- reveals ---------------- */
  $$('.split').forEach(function (el) {
    var i = 0;
    (function walk(n) {
      Array.prototype.slice.call(n.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (w) {
            if (!w) return; if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(' ')); return; }
            var s = document.createElement('span'); s.className = 'w'; var inn = document.createElement('span'); inn.textContent = w; inn.style.setProperty('--i', i++); s.appendChild(inn); frag.appendChild(s);
          });
          n.replaceChild(frag, c);
        } else if (c.nodeType === 1 && !c.classList.contains('w')) walk(c);
      });
    })(el);
  });
  var rvs = $$('.rv, .rv-img, .split');
  if (RM || !('IntersectionObserver' in window)) rvs.forEach(function (el) { el.classList.add('in'); });
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });
    rvs.forEach(function (el) { io.observe(el); });
  }

  /* deep link to a product */
  route();
})();
