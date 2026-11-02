/* ============================================================
   CIEL AFRICA PHOTO BOOKS — /photobooks app
   Landing, category pages, the template chooser and "My books".
   The editor lives in editor.js and opens at /photobooks/design.
   ============================================================ */
(function () {
  'use strict';
  var C = window.PBKCat, R = window.PBKR, CFG = (window.CIEL && CIEL.photobooks) || {}, BOOK = CFG.book || { pages: { min: 24, max: 100, step: 2, default: 24 }, price: {} };
  var main = document.getElementById('pbk');
  var PBK = window.PBK = window.PBK || {};
  var BASE = '/photobooks';
  try { window.PBK_ADMIN = localStorage.getItem('pbk_admin') === '1'; } catch (e) { }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function money(n) { return (CFG.currency || 'KES') + ' ' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  /** Book price for a page count, or null while prices are not set. */
  function price(pages) {
    var p = BOOK.price || {};
    if (p.base == null || p.perExtraPage == null) return null;
    return p.base + Math.max(0, pages - (p.includedPages || BOOK.pages.min)) * p.perExtraPage;
  }
  function priceLabel(pages) { var v = price(pages); return v == null ? 'Price coming soon' : money(v); }
  PBK.esc = esc; PBK.price = price; PBK.priceLabel = priceLabel; PBK.money = money; PBK.BOOK = BOOK; PBK.BASE = BASE;

  var ICON = {
    arrow: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    search: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    x: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    book: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/></svg>',
    phone: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M10.5 18.5h3"/></svg>',
    lock: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg>',
    eye: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    pages: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5h7v15H4zM13 5h7v15h-7z"/></svg>'
  };
  PBK.ICON = ICON;
  var ICON_EDIT = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>';

  var V3 = '7';
  function bookName(t, pi) { return t === 'blank' ? 'blank-' + (pi || 0) : t.kind === 'vector' ? t.cat + '-' + t.slug + '-' + (pi || 0) : 'travel-' + t.slug; }
  /** 3D book thumbnail (440×550) for a cover template. */
  function mockSrc(t, pi) { return '/assets/pbk/c/3/' + bookName(t, pi) + '.webp?v=' + V3; }
  var XL = ['kenya-nairobi-0', 'kenya-mombasa-0', 'kenya-serengeti-0', 'kenya-kenya-0', 'kenya-kenya-wild-0', 'travel-paris', 'travel-zanzibar', 'travel-tokyo', 'travel-ibiza', 'couple-our-story-0', 'travel-lisbon', 'travel-greece', 'baby-hello-baby-0', 'friends-besties-0', 'event-cheers-0', 'travel-new-york', 'travel-senegal', 'travel-madagascar', 'travel-south-africa', 'pets-good-boy-0', 'travel-mexico', 'travel-sicily', 'family-home-0', 'blank-0'];
  function bigSrc(t, pi) { var n = bookName(t, pi); return XL.indexOf(n) >= 0 ? '/assets/pbk/c/3/xl/' + n + '.webp?v=' + V3 : mockSrc(t, pi); }
  /** Where tapping a cover goes: its category page with that cover selected. */
  function coverLink(id, pi) { var t = C.TPL[id]; return BASE + '/' + (t ? t.cat : 'blank') + '?t=' + encodeURIComponent(id) + '&c=' + (pi || 0); }
  PBK.coverLink = coverLink;
  function customisable(t) { return t === 'blank' || t.kind === 'vector' || t.editable; }
  PBK.mockSrc = mockSrc; PBK.bigSrc = bigSrc;
  var IMGWH = ' width="440" height="550"';
  function catHero(cat) {
    var pick = { travel: 'travel/zanzibar', kenya: 'kenya/nairobi', event: 'event/cheers', couple: 'couple/our-story', friends: 'friends/besties', baby: 'baby/hello-baby', pets: 'pets/good-boy', family: 'family/home', year: 'year/365-days', someone: 'someone/for-mum' }[cat];
    return C.TPL[pick] || C.byCat(cat)[0];
  }

  /* ---------------- router ---------------- */
  function route() {
    var path = location.pathname.replace(/\/+$/, '').replace(/\.html$/, '');
    if (path === BASE + '/index') path = BASE;
    var seg = path.slice(BASE.length).replace(/^\//, '');
    document.body.classList.remove('pbk-editing');
    if (seg === 'design') { if (window.PBKEditor) PBKEditor.open(main); return; }
    if (seg === 'my-books') myBooks();
    else if (seg === 'track') track();
    else if (seg === 'checkout') { if (window.PBKShop) PBKShop.checkout(main); }
    else if (C.cat(seg) || seg === 'blank') category(seg);
    else return landing();
    backBar(seg);
  }
  /* "Back" above the category circles on every page except the landing page (the editor has its own) */
  var inApp = 0;
  function backBar(seg) {
    if (main.querySelector('.pk-back')) return;
    var label = { checkout: 'Back', 'my-books': 'Photo Books', track: 'Photo Books' }[seg] || 'Back';
    var b = document.createElement('div'); b.className = 'pk-back wrap';
    b.innerHTML = '<button type="button" class="pk-back__btn" aria-label="Go back"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg><span>' + label + '</span></button>';
    main.insertAdjacentElement('afterbegin', b);
    b.querySelector('button').onclick = function () { if (inApp > 0) { inApp--; history.back(); } else PBK.go(BASE); };
  }
  PBK.go = function (url) { history.pushState({}, '', url); inApp++; window.scrollTo(0, 0); route(); };
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-go]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    e.preventDefault(); PBK.go(a.getAttribute('href'));
  });
  window.addEventListener('popstate', function () { if (inApp > 0) inApp--; route(); });

  /* ---------------- shared bits ---------------- */
  var TINT = { travel: '#ffe1cf', kenya: '#fde4bf', event: '#dbe6ff', couple: '#ffdbe5', friends: '#fff0b3', baby: '#d9eeff', pets: '#ddf2da', family: '#f6e3cf', year: '#e6defe', someone: '#ffe0ef', blank: '#ece5da' };
  PBK.TINT = TINT;
  function seen() { try { return JSON.parse(localStorage.getItem('pbk_seen') || '{}'); } catch (e) { return {}; } }
  /* category circles, like stories: tap to flip through that category's covers */
  function catStrip(active) {
    var sn = seen();
    return '<nav class="pk-cats" aria-label="Photo book categories"><div class="pk-cats__in">' + C.CATS.map(function (c) {
      var t = catHero(c.id);
      return '<a data-go href="' + BASE + '/' + c.id + '" class="pk-cat' + (active === c.id ? ' is-on' : '') + '" aria-label="' + esc(c.name) + ' covers"><span class="pk-cat__ring"><span class="pk-cat__img" style="--tint:' + TINT[c.id] + '"><img src="' + mockSrc(t, 0) + '" alt="" loading="lazy"' + IMGWH + '></span></span><span class="pk-cat__n">' + esc(c.name) + '</span></a>';
    }).join('') + '</div></nav>';
  }
  /* ---------------- stories: a category's covers, one after another ---------------- */
  var sdlg;
  function stories(catId) {
    var cats = C.CATS.map(function (c) { return c.id; }), ci = Math.max(0, cats.indexOf(catId)), i = 0, timer = null, paused = false, t0 = 0, left = 0, DUR = 3600;
    if (!sdlg) { sdlg = document.createElement('dialog'); sdlg.className = 'pk-st'; document.body.appendChild(sdlg); }
    function list() { var l = C.byCat(cats[ci]); return l.slice(0, 24); }
    function draw() {
      var cat = C.cat(cats[ci]), l = list(), t = l[i], all = C.byCat(cats[ci]).length;
      var sn = seen(); sn[cat.id] = 1; try { localStorage.setItem('pbk_seen', JSON.stringify(sn)); } catch (e) { }
      document.querySelectorAll('.pk-cat[data-story="' + cat.id + '"]').forEach(function (b) { b.classList.add('is-seen'); });
      sdlg.style.setProperty('--tint', TINT[cat.id]);
      sdlg.innerHTML = '<div class="pk-st__in"><div class="pk-st__bars">' + l.map(function (_, k) { return '<i' + (k < i ? ' class="is-done"' : '') + '>' + (k === i ? '<b id="pkStBar"></b>' : '') + '</i>'; }).join('') + '</div>' +
        '<header class="pk-st__h"><span class="pk-st__av" style="--tint:' + TINT[cat.id] + '"><img src="' + mockSrc(catHero(cat.id), 0) + '" alt=""></span><div><b>' + esc(cat.name) + '</b><small>' + (i + 1) + ' of ' + l.length + (all > l.length ? ' · ' + all + ' covers' : '') + '</small></div><button class="pk-st__x" data-x aria-label="Close">' + ICON.x + '</button></header>' +
        '<div class="pk-st__stage"><button class="pk-st__tap pk-st__tap--l" data-prev aria-label="Previous"></button><img class="pk-st__book" src="' + (XL.indexOf(bookName(t, 0)) >= 0 ? bigSrc(t, 0) : mockSrc(t, 0)) + '" alt="' + esc(t.name) + ' photo book"><button class="pk-st__tap pk-st__tap--r" data-next aria-label="Next"></button></div>' +
        '<footer class="pk-st__f"><b class="pk-st__name">' + esc(t.name) + '</b>' + (customisable(t) ? '<span class="pk-st__tag">✎ Customisable</span>' : '') +
        '<a class="btn btn--p btn--lg pk-st__go" data-go href="' + coverLink(t.id, 0) + '">Use this cover ' + ICON.arrow + '</a><a class="pk-st__all" data-go href="' + BASE + '/' + cat.id + '">See all ' + all + ' ' + esc(cat.name.toLowerCase()) + ' covers</a></footer></div>';
      var nx = l[i + 1]; if (nx) { var im = new Image(); im.src = mockSrc(nx, 0); }
      start(DUR);
    }
    function start(d) { clearTimeout(timer); left = d; t0 = Date.now(); var bar = sdlg.querySelector('#pkStBar'); if (bar) { bar.style.transition = 'none'; bar.style.width = (100 - left / DUR * 100) + '%'; void bar.offsetWidth; bar.style.transition = 'width ' + left + 'ms linear'; bar.style.width = '100%'; } timer = setTimeout(next, left); }
    function pause() { if (paused) return; paused = true; clearTimeout(timer); left = Math.max(300, left - (Date.now() - t0)); var bar = sdlg.querySelector('#pkStBar'); if (bar) { var w = getComputedStyle(bar).width; bar.style.transition = 'none'; bar.style.width = w; } }
    function resume() { if (!paused) return; paused = false; start(left); }
    function next() { var l = list(); if (i < l.length - 1) { i++; draw(); } else if (ci < cats.length - 1) { ci++; i = 0; draw(); } else close(); }
    function prev() { if (i > 0) { i--; draw(); } else if (ci > 0) { ci--; i = 0; draw(); } else draw(); }
    function close() { clearTimeout(timer); if (sdlg.open) sdlg.close(); }
    var sx = null, sy = null, moved = false, downAt = 0;
    sdlg.onpointerdown = function (e) { if (e.target.closest('a,[data-x]')) return; sx = e.clientX; sy = e.clientY; moved = false; downAt = Date.now(); pause(); };
    sdlg.onpointerup = function (e) {
      if (sx == null) return; var dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
      if (dy > 90 && Math.abs(dy) > Math.abs(dx)) return close();
      if (Math.abs(dx) > 60) { moved = true; if (dx < 0 && ci < cats.length - 1) { ci++; i = 0; draw(); } else if (dx > 0 && ci > 0) { ci--; i = 0; draw(); } else resume(); return; }
      if (Date.now() - downAt > 350) { moved = true; resume(); return; }
      resume();
    };
    sdlg.onclick = function (e) {
      if (e.target.closest('[data-x]')) return close();
      if (e.target.closest('a[data-go]')) { close(); return; }
      if (moved) return;
      if (e.target.closest('[data-prev]')) prev(); else if (e.target.closest('[data-next]')) next();
      else if (e.target.closest('.pk-st__book')) { close(); PBK.go(coverLink(list()[i].id, 0)); }
    };
    sdlg.oncancel = function (e) { e.preventDefault(); close(); };
    sdlg.onkeydown = function (e) { if (e.key === 'ArrowRight') next(); if (e.key === 'ArrowLeft') prev(); };
    sdlg.onclose = function () { clearTimeout(timer); };
    document.addEventListener('visibilitychange', function () { if (!sdlg.open) return; if (document.hidden) pause(); else resume(); });
    draw(); sdlg.showModal();
  }
  PBK.stories = stories;
  document.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-story]'); if (b) { e.preventDefault(); stories(b.getAttribute('data-story')); } });
  function steps() {
    var c1 = ['travel/lisbon', 'kenya/mombasa', 'couple/amour'].map(function (id) { return '<img src="' + mockSrc(C.TPL[id], id === 'couple/amour' ? 0 : 0) + '" alt="" loading="lazy">'; }).join('');
    return '<section class="pk-steps wrap" id="how"><div class="pk-head"><span class="eyebrow"><span class="brk">‹</span> How it works</span><h2>Your photo book in <span class="pk-hl">3 steps</span></h2><p>About ten minutes on your phone. No design skills needed.</p></div>' +
      '<ol class="pk-steps__list">' +
      '<li class="pk-step"><div class="pk-step__vis pk-step__vis--1">' + c1 + '</div><span class="pk-step__n">1</span><h3>Choose your template</h3><p>Pick a cover for the trip, the person or the year: more than a hundred designs, or start from a blank cover.</p></li>' +
      '<li class="pk-step"><div class="pk-step__vis pk-step__vis--prints"><img src="' + US('photo-1739302750675-042ed497a429', 420, 0.75, 'faces') + '" alt="Two friends laughing" loading="lazy"><img src="' + US('photo-1643818657367-491080baeece', 360, 1.25, 'faces') + '" alt="A family with a child on their shoulders" loading="lazy"><img src="' + US('photo-1605087745782-32cd1a138c53', 360, 1.25) + '" alt="An elephant and her calf" loading="lazy"></div><span class="pk-step__n">2</span><h3>Add your photos</h3><p>Choose them straight from your camera roll. They drop into the pages, one or two per page, ready to print.</p></li>' +
      '<li class="pk-step"><div class="pk-step__vis pk-step__vis--ed"><img src="/assets/img/pb-demo/editor.webp?v=1" alt="The photo book editor: back cover, spine and front cover side by side" loading="lazy"></div><span class="pk-step__n">3</span><h3>Personalise it</h3><p>Just like Canva: change the words, colours and stickers, move and resize photos, then preview the whole book.</p></li>' +
      '</ol></section>';
  }
  /* Unsplash photos (hotlinked, as Unsplash asks; credits in assets/img/pb-demo/CREDITS.md) */
  function US(id, w, ar, crop) { return 'https://images.unsplash.com/' + id + '?auto=format&fit=crop&q=72&w=' + w + (ar ? '&h=' + Math.round(w * ar) : '') + '&crop=' + (crop || 'entropy'); }
  /* ---------------- open books: real pages, arranged ---------------- */
  function openBooks() {
    var D = '/assets/img/pb-demo/';
    function im(src, alt, cls) { return '<img class="' + (cls || '') + '" src="' + src + '" alt="' + esc(alt) + '" loading="lazy" draggable="false">'; }
    /* order: portraits, family, safari, travel, year in photos, wedding */
    var spreads = [
      { k: 'portraits', tag: 'Portraits', note: 'Black & white, framed', bg: '#efebe5',
        l: '<div class="pk-pg pk-pg--frame">' + im(D + 'pf2.webp', 'Black and white portrait') + '</div>',
        r: '<div class="pk-pg pk-pg--duo">' + im(D + 'pf1.webp', 'Portrait with braids') + im(D + 'pf3.webp', 'Portrait by the window') + '<span class="pk-pg__cap pk-pg__cap--serif">The faces we love</span></div>' },
      { k: 'family', tag: 'Family', note: 'Sundays together', bg: '#f3efe8',
        l: '<div class="pk-pg pk-pg--bleed">' + im(US('photo-1643818657367-491080baeece', 700, 1.414, 'faces'), 'A family with a child on their shoulders') + '</div>',
        r: '<div class="pk-pg pk-pg--frame pk-pg--note">' + im(US('photo-1596510914965-9ae08acae566', 600, 1.15, 'faces'), 'A mother carrying her baby by the sea') + '<span class="pk-pg__cap pk-pg__cap--script">Our little world</span></div>' },
      { k: 'safari', tag: 'Safari · Maasai Mara', note: 'One photo across both pages', bg: '#f1ebe0',
        pano: im(US('photo-1656266732667-59f75f1a56db', 1200, 297 / 420), 'Two lions walking through the grass') + '<span class="pk-pg__cap pk-pg__cap--light pk-pano__cap">Day three, Maasai Mara</span>' },
      { k: 'travel', tag: 'Travel · Diani', note: 'A collage and a sunset', bg: '#f4efe6',
        l: '<div class="pk-pg pk-pg--trio">' + im(D + 'beach.webp', 'White sand beach') + im(D + 'palms.webp', 'Palm trees by the pool') + im(D + 'deck.webp', 'Sun deck by the sea') + '</div>',
        r: '<div class="pk-pg pk-pg--bleed">' + im(D + 'dhow.webp', 'A dhow at sunset') + '<span class="pk-pg__cap pk-pg__cap--light">Sunset on the water</span></div>' },
      { k: 'year', tag: 'Year in photos', note: 'Twelve months, one book', bg: '#f6efe4',
        l: '<div class="pk-pg pk-pg--duo">' + im(US('photo-1739302750675-042ed497a429', 500, 1.5, 'faces'), 'Two friends laughing on a sofa') + im(D + 'run.webp', 'A runner at sunset') + '<span class="pk-pg__cap">January → June</span></div>',
        r: '<div class="pk-pg pk-pg--stack">' + im(D + 'coast.webp', 'The coast from the boat') + im(US('photo-1605087745782-32cd1a138c53', 600, 0.62), 'An elephant and her calf') + '<span class="pk-pg__cap">July → December</span></div>' },
      { k: 'wedding', tag: 'Wedding', note: 'Forever, in print', bg: '#f5f0ea',
        l: '<div class="pk-pg pk-pg--bleed">' + im(US('photo-1695281536457-01f9a07c575b', 700, 1.414, 'faces'), 'A bride and groom under a tree') + '</div>',
        r: '<div class="pk-pg pk-pg--frame pk-pg--note">' + im(US('photo-1695281535578-ce371088bb3e', 600, 1.15, 'faces'), 'A bride and groom pose for a photo') + '<span class="pk-pg__cap pk-pg__cap--script">Forever &amp; always</span></div>' }
    ];
    var closed = C.byCat('kenya')[0];
    return '<section class="pk-open" id="inside" aria-label="Inside the book"><div class="wrap"><div class="pk-head"><span class="eyebrow"><span class="brk">‹</span> Inside the book</span><h2>Open it and <span class="pk-hl">every page is yours</span></h2><p>Full-bleed sunsets, collages, framed portraits and captions in your own words.</p></div>' +
      '<div class="pk-open__grid">' + spreads.map(function (sp, i) {
        var inner = sp.pano ? '<div class="pk-pano">' + sp.pano + '</div>' : '<div class="pk-spread__l">' + sp.l + '</div><div class="pk-spread__r">' + sp.r + '</div>';
        return '<figure class="pk-open__item pk-open__item--' + sp.k + '" style="--paper:' + sp.bg + '"><div class="pk-spread' + (sp.pano ? ' pk-spread--pano' : '') + '">' + inner + '</div>' +
          (i === 0 && closed ? '<img class="pk-open__closed" src="' + mockSrc(closed, 0) + '" alt="" loading="lazy" draggable="false">' : '') +
          '<figcaption><b>' + esc(sp.tag) + '</b><span>' + esc(sp.note) + '</span></figcaption></figure>';
      }).join('') + '</div>' +
      '<div class="pk-open__cta"><button class="btn btn--p btn--lg" data-pick>Start my book ' + ICON.arrow + '</button></div></div></section>';
  }
  function trust() {
    return '<ul class="pk-trust"><li>' + ICON.book + '<span><b>Portrait hardcover</b>' + esc(BOOK.size || '21 × 29.7 cm (A4)') + ', ' + BOOK.pages.min + '–' + BOOK.pages.max + ' pages</span></li>' +
      '<li>' + ICON.phone + '<span><b>Design on your phone</b>or on a computer, no app to install</span></li>' +
      '<li>' + ICON.lock + '<span><b>Your photos stay private</b>they stay on your device while you design</span></li>' +
      '<li>' + ICON.eye + '<span><b>Preview every page</b>flip through the whole book before ordering</span></li></ul>';
  }
  function faq() {
    var q = [
      ['What size is the book?', 'Every book is portrait, ' + (BOOK.size || '21 × 29.7 cm (A4)') + ', with a hardcover. Every cover is designed for that size.'],
      ['How many pages can I have?', 'From ' + BOOK.pages.min + ' up to ' + BOOK.pages.max + ' pages. Add or remove pages any time while you design. The price depends on the number of pages.'],
      ['How many photos fit on a page?', 'One or two. Pick a layout, then move, resize and crop each photo until it looks right.'],
      ['Can I change the words on a cover?', 'Yes. Change the title and subtitle on the illustrated covers and on most travel covers, or start from a blank cover with your own colours, text and stickers. The small CIEL AFRICA mark always stays at the bottom.'],
      ['Where are my photos stored?', 'In your browser, on this device. Nothing is uploaded while you design, so use the same phone or computer to come back to your book.'],
      ['How much does it cost?', price(BOOK.pages.min) == null ? 'Prices are being finalised and will be shown here before ordering opens. You can design and save your book now.' : 'From ' + priceLabel(BOOK.pages.min) + ' for ' + BOOK.pages.min + ' pages. More pages cost more; the price updates as you add pages.']
    ];
    return '<section class="pk-faq wrap"><div class="pk-head"><span class="eyebrow"><span class="brk">‹</span> Questions</span><h2>Good to know</h2></div><div class="pk-faq__list">' + q.map(function (x) { return '<details><summary>' + esc(x[0]) + '</summary><p>' + esc(x[1]) + '</p></details>'; }).join('') + '</div></section>';
  }

  /* ---------------- landing ---------------- */
  function landing() {
    document.title = 'Photo Books — Ciel Africa';
    var flow = ['kenya/nairobi', 'travel/ibiza', 'kenya/mombasa', 'travel/paris', 'couple/our-story', 'kenya/serengeti', 'travel/zanzibar', 'baby/hello-baby', 'kenya/kenya', 'travel/tokyo', 'friends/besties', 'travel/lisbon'].filter(function (id) { return C.TPL[id]; });
    var rowA = ['travel/ibiza', 'kenya/serengeti', 'travel/lisbon', 'event/cheers', 'travel/madagascar', 'friends/besties', 'travel/new-york', 'baby/hello-baby', 'travel/senegal', 'kenya/kenya', 'travel/mexico', 'pets/good-boy'];
    var rowB = ['travel/greece', 'couple/amour', 'travel/south-africa', 'kenya/mombasa', 'travel/sicily', 'year/my-year', 'travel/london', 'family/home', 'travel/morocco', 'someone/for-mum', 'travel/bali', 'event/wedding'];
    function row(ids, pal) { var h = ids.filter(function (i) { return C.TPL[i]; }).map(function (id, i) { var t = C.TPL[id]; return '<a data-go href="' + coverLink(id, t.kind === 'vector' ? (i + pal) % t.palettes.length : 0) + '" class="pk-mq__item" aria-label="' + esc(t.name) + '"><img src="' + mockSrc(t, t.kind === 'vector' ? (i + pal) % t.palettes.length : 0) + '" alt="' + esc(t.name) + ' cover" loading="lazy"' + IMGWH + '></a>'; }).join(''); return h + h; }
    main.innerHTML = catStrip() +
      '<section class="pk-hero wrap"><span class="eyebrow pk-hero__eye"><span class="brk">‹</span> Photo Books</span><div class="pk-hero__copy">' +
      '<h1>Your memories deserve more than a <span class="pk-hl">camera roll.</span></h1>' +
      '<div class="pk-cta"><button class="btn btn--p btn--lg" data-pick>Create my photo book ' + ICON.arrow + '</button><a data-go href="' + BASE + '/travel" class="btn btn--ghost btn--lg">Browse travel covers</a></div></div>' +
      '<div class="pk-flow" id="pkFlow" aria-label="Cover designs">' + flow.map(function (id, i) { var t = C.TPL[id]; return '<a href="#collections" class="pk-flow__b" data-i="' + i + '" aria-label="' + esc(t.name) + '"><img src="' + bigSrc(t, 0) + '" alt="' + esc(t.name) + ' photo book" width="720" height="900"' + (i < 3 || i >= flow.length - 2 ? (i < 2 ? ' fetchpriority="high"' : '') : ' loading="lazy"') + '></a>'; }).join('') + '<div class="pk-flow__name" id="pkFlowName"></div></div></section>' +
      '<section class="pk-grid wrap" id="collections"><div class="pk-head"><span class="eyebrow"><span class="brk">‹</span> Collections</span><h2>A book for every story</h2></div><div class="pk-tiles">' +
      C.CATS.map(function (c) {
        var l = C.byCat(c.id), t = catHero(c.id), t2 = l.filter(function (x) { return x !== t; })[c.id === 'travel' ? 3 : 0] || t, n = l.length;
        return '<a data-go href="' + BASE + '/' + c.id + '" class="pk-tile pk-tile--' + c.id + '" style="--tint:' + TINT[c.id] + '"><span class="pk-tile__books"><img class="pk-tile__b2" src="' + mockSrc(t2, t2.kind === 'vector' ? 1 % t2.palettes.length : 0) + '" alt="" loading="lazy"' + IMGWH + '><img class="pk-tile__b1" src="' + mockSrc(t, 0) + '" alt="" loading="lazy"' + IMGWH + '></span><span class="pk-tile__txt"><span class="pk-tile__t">' + esc(c.name) + '</span><span class="pk-tile__n">' + n + ' cover' + (n === 1 ? '' : 's') + '</span></span><span class="pk-tile__go">' + ICON.arrow + '</span></a>';
      }).join('') +
      '<button class="pk-tile pk-tile--blank" data-blank style="--tint:' + TINT.blank + '"><span class="pk-tile__books"><img class="pk-tile__b2" src="' + mockSrc('blank', 2) + '" alt="" loading="lazy"' + IMGWH + '><img class="pk-tile__b1" src="' + mockSrc('blank', 4) + '" alt="" loading="lazy"' + IMGWH + '></span><span class="pk-tile__txt"><span class="pk-tile__t">Blank cover</span><span class="pk-tile__n">Design your own</span></span><span class="pk-tile__go">' + ICON.arrow + '</span></button>' +
      '</div></section>' +
      steps() + openBooks() +
      '<section class="pk-mq" aria-label="Cover designs"><div class="pk-mq__row"><div class="pk-mq__track">' + row(rowA, 0) + '</div></div><div class="pk-mq__row pk-mq__row--b"><div class="pk-mq__track">' + row(rowB, 1) + '</div></div></section>' +
      '<section class="pk-kenya"><div class="wrap pk-kenya__in"><div class="pk-kenya__copy"><span class="eyebrow"><span class="brk">‹</span> New</span><h2>Made for <span class="pk-hl">Kenya</span></h2><p>Nairobi, Mombasa, the Serengeti plains and a Kenya cover for every trip home. Same minimal style, same CIEL AFRICA mark, every word editable.</p><a data-go href="' + BASE + '/kenya" class="btn btn--dark">See the Kenya covers ' + ICON.arrow + '</a></div>' +
      '<div class="pk-kenya__books">' + C.byCat('kenya').slice(0, 4).map(function (t, i) { return '<a data-go href="' + coverLink(t.id, 0) + '"><img src="' + mockSrc(t, 0) + '" alt="' + esc(t.name) + ' cover" loading="lazy"' + IMGWH + '></a>'; }).join('') + '</div></div></section>' +
      '<section class="pk-spec wrap"><div class="pk-spec__card"><div><span class="eyebrow"><span class="brk">‹</span> The book</span><h2>Price by pages</h2><p>Start with ' + BOOK.pages.min + ' pages and add more as you go: the price depends on the number of pages.</p></div>' +
      '<div class="pk-calc"><label for="pkPages">Pages <output id="pkPagesOut">' + BOOK.pages.default + '</output></label><input type="range" id="pkPages" min="' + BOOK.pages.min + '" max="' + BOOK.pages.max + '" step="' + BOOK.pages.step + '" value="' + BOOK.pages.default + '"><div class="pk-calc__price" id="pkPrice">' + esc(priceLabel(BOOK.pages.default)) + '</div>' + (price(BOOK.pages.min) == null ? '<p class="pk-calc__note">Prices are being finalised. You can design and save your book now.</p>' : '') + '</div></div></section>' +
      trust() + faq() +
      '<section class="wrap"><div class="pk-band"><h2>Ready to make yours?</h2><p>Choose a cover and start adding photos.</p><button class="btn btn--p btn--lg" data-pick>Create my photo book ' + ICON.arrow + '</button><p class="pk-band__track">Already ordered? <a data-go href="' + BASE + '/track">Track your order</a> · <a data-go href="' + BASE + '/my-books">My books</a></p></div></section>';
    bindCommon(); flowStart(flow); continueCard(); if (window.PBKShop) PBKShop.resumeBanner(main);
    var r = document.getElementById('pkPages');
    if (r) r.addEventListener('input', function () { document.getElementById('pkPagesOut').textContent = r.value; document.getElementById('pkPrice').textContent = priceLabel(+r.value); });
  }

  /* hero cover flow: the centre book changes every few seconds */
  var flowT;
  function flowStart(ids) {
    var box = document.getElementById('pkFlow'); if (!box) return;
    var items = [].slice.call(box.querySelectorAll('.pk-flow__b')), n = items.length, at = 0, name = document.getElementById('pkFlowName'), moved = false;
    function lay() {
      items.forEach(function (el, i) { var d = ((i - at) % n + n) % n; if (d > n / 2) d -= n; el.setAttribute('data-pos', Math.abs(d) > 2 ? 'off' : String(d)); });
      var t = C.TPL[ids[at]]; if (name && t) name.textContent = t.name;
    }
    function next(k) { at = (at + (k || 1) + n) % n; lay(); }
    lay(); clearInterval(flowT);
    flowT = setInterval(function () { if (!document.body.contains(box)) { clearInterval(flowT); return; } if (!document.hidden) next(); }, 2600);
    var sx = null;
    box.addEventListener('pointerdown', function (e) { sx = e.clientX; moved = false; });
    box.addEventListener('pointerup', function (e) { if (sx == null) return; var dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 40) { moved = true; next(dx < 0 ? 1 : -1); } });
    box.addEventListener('click', function (e) {
      e.preventDefault(); if (moved) return;
      var c = document.getElementById('collections'); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
  /* "continue your book" when a draft is saved on this device */
  function continueCard() {
    if (!window.PBStore) return;
    PBStore.projects().then(function (l) {
      l = l.filter(function (p) { return p.app === 'pbk'; }); if (!l.length) return;
      var p = l[0], box = document.createElement('div'); box.className = 'pk-cont wrap';
      var mins = Math.round((Date.now() - (p.updatedAt || Date.now())) / 60000);
      var ago = mins < 1 ? 'just now' : mins < 60 ? mins + ' min ago' : mins < 1440 ? Math.round(mins / 60) + ' h ago' : new Date(p.updatedAt).toLocaleDateString();
      box.innerHTML = '<div class="pk-cont__in"><span class="pk-cont__dot"></span><div><b>Continue “' + esc(p.name || 'My photo book') + '”</b><span>Saved on this device · ' + ago + (l.length > 1 ? ' · <a data-go href="' + BASE + '/my-books">' + l.length + ' books</a>' : '') + '</span></div><a data-go class="btn btn--dark btn--sm" href="' + BASE + '/design?p=' + esc(p.id) + '">Continue</a><button class="pk-cont__del" aria-label="Delete this book" title="Delete this book">✕</button></div>';
      var strip = main.querySelector('.pk-cats'); if (strip) strip.insertAdjacentElement('afterend', box);
      box.querySelector('.pk-cont__del').onclick = function () { if (!confirm('Delete “' + (p.name || 'this book') + '” and its photos from this device? This can’t be undone.')) return; PBStore.deleteProject(p.id).then(function () { box.remove(); try { CIEL.cart.pbItems().forEach(function (i) { if (i.pb.p === p.id) CIEL.cart.remove(i.id); }); } catch (e) { } }); };
    }).catch(function () {});
  }
  function bindCommon() {
    main.querySelectorAll('[data-pick]').forEach(function (b) { b.addEventListener('click', function () { PBK.pick(b.getAttribute('data-pick') || 'all'); }); });
    main.querySelectorAll('[data-blank]').forEach(function (b) { b.addEventListener('click', function () { PBK.go(BASE + '/blank'); }); });
  }

  /* ---------------- category page ---------------- */
  function category(catId) {
    var cat = C.cat(catId) || { id: 'blank', name: 'Blank', title: 'Blank cover photo book', blurb: 'Design your own cover: colours, words and stickers. The CIEL AFRICA mark stays small at the bottom.', cta: 'Start my book' };
    document.title = cat.title + ' — Ciel Africa';
    var list = catId === 'blank' ? [] : C.byCat(catId);
    var st = { t: list[0] ? list[0].id : 'blank', c: 0, pages: BOOK.pages.default, q: '', cu: {} };
    var params = new URLSearchParams(location.search);
    st.collapsed = !!params.get('t') || catId === 'blank';
    if (params.get('t') && (C.TPL[params.get('t')] || params.get('t') === 'blank')) st.t = params.get('t');
    if (params.get('c')) st.c = +params.get('c') || 0;
    var PAGES = [24, 36, 48, 60, 80, 100].filter(function (n) { return n >= BOOK.pages.min && n <= BOOK.pages.max; });
    main.innerHTML = catStrip(catId) +
      '<section class="pk-prod wrap"><div class="pk-prod__gal"><div class="pk-prod__main"><img id="pkMain" alt=""' + IMGWH + '><canvas id="pkMainC" hidden></canvas></div><div class="pk-prod__alt" id="pkAlt"></div></div>' +
      '<div class="pk-prod__info"><div class="crumb"><a data-go href="' + BASE + '">Photo Books</a> <span class="brk">‹</span> ' + esc(cat.name) + '</div><h1>' + esc(cat.title) + '</h1>' +
      '<p class="pk-prod__blurb">' + esc(cat.blurb) + '</p>' +
      '<div class="pk-opt"><div class="pk-opt__h"><b><i class="pk-n">1</i>Choose your cover</b><span id="pkSel"></span></div>' +
      '<div class="pk-chosen" id="pkChosen" hidden><img alt=""' + IMGWH + '><div><b></b><span>✎ Customise it below</span></div><button type="button" class="btn btn--ghost btn--sm" id="pkChange">Change cover</button></div>' +
      '<div id="pkPick">' + (list.length > 8 ? '<label class="pk-search">' + ICON.search + '<input id="pkQ" type="search" placeholder="Search ' + list.length + ' covers (e.g. Paris, Kenya)" autocomplete="off"></label>' : '') +
      '<div class="pk-covers" id="pkCovers"></div></div></div>' +
      '<div class="pk-opt pk-make"><div class="pk-opt__h"><b><i class="pk-n">2</i>Make it yours</b><button type="button" class="pk-reset" id="pkReset" hidden>Reset</button></div><div class="pk-make__in"><canvas class="pk-make__mini" id="pkMini" aria-hidden="true"></canvas><div class="pk-make__f" id="pkMake"></div></div></div>' +
      '<div class="pk-opt"><div class="pk-opt__h"><b><i class="pk-n">3</i>Pages</b></div><div class="pk-pages" id="pkPg">' +
      PAGES.map(function (n) { return '<button type="button" data-p="' + n + '"' + (n === st.pages ? ' class="is-on"' : '') + '>' + n + '</button>'; }).join('') + '</div><p class="pk-opt__note">Up to 48 pages makes a slim book; 60 or more, a thicker one. You can add or remove pages later.</p></div>' +
      '<div class="pk-price"><div><span>Price</span><b id="pkPrice">' + esc(priceLabel(st.pages)) + '</b></div><small id="pkPriceFor">' + st.pages + ' pages</small></div>' +
      '<button class="btn btn--ghost btn--lg pk-cust" id="pkCust">' + ICON_EDIT + ' Customise cover in the editor</button>' +
      '<button class="btn btn--p btn--lg pk-start" id="pkStart">' + esc(cat.cta) + ' ' + ICON.arrow + '</button>' +
      '<button class="pk-link" data-pick="' + (catId === 'blank' ? 'all' : catId) + '">See all templates</button>' +
      trust() + '</div></section>' + steps() + faq();
    bindCommon();
    var covers = document.getElementById('pkCovers'), make = document.getElementById('pkMake');
    function sel() { return st.t === 'blank' ? null : C.TPL[st.t]; }
    function dirty() { return Object.keys(st.cu).some(function (k) { return st.cu[k] != null && st.cu[k] !== ''; }); }
    function drawCovers() {
      var q = st.q.toLowerCase().trim();
      var items = list.filter(function (t) { return !q || (t.name + ' ' + (t.title || '') + ' ' + (t.sub || '') + ' ' + t.cat).toLowerCase().indexOf(q) >= 0; });
      covers.innerHTML = (catId === 'blank' || !q ? '<button type="button" class="pk-cv pk-cv--blank' + (st.t === 'blank' ? ' is-on' : '') + '" data-t="blank"><img src="' + mockSrc('blank', 0) + '" alt="Blank cover" loading="lazy"' + IMGWH + '><i class="pk-badge">Design your own</i><span>Blank</span></button>' : '') +
        items.map(function (t) { return '<button type="button" class="pk-cv' + (t.id === st.t ? ' is-on' : '') + '" data-t="' + esc(t.id) + '" title="' + esc(t.name) + '"><img src="' + mockSrc(t, 0) + '" alt="' + esc(t.name) + '" loading="lazy"' + IMGWH + '>' + (customisable(t) ? '<i class="pk-badge" title="Customisable">✎</i>' : '') + '<span>' + esc(t.name) + '</span></button>'; }).join('') +
        (!items.length ? '<p class="pk-empty">No cover matches “' + esc(st.q) + '”. Try another word, or start from a blank cover.</p>' : '');
    }
    function sw(k, list, cur, big) { return '<div class="pk-sws">' + list.map(function (c, i) { var v = typeof c === 'string' ? c : c[0]; return '<button type="button" class="pk-sw' + (big ? ' pk-sw--pal' : '') + (cur === (big ? i : v) ? ' is-on' : '') + '" data-k="' + k + '" data-v="' + (big ? i : v) + '" style="--c:' + v + (big ? ';--d:' + c[1] : '') + '" aria-label="' + (big ? 'Colour option ' + (i + 1) : v) + '"></button>'; }).join('') + '</div>'; }
    function drawMake() {
      var t = sel(), w = C.words(st.t, st.c), h = '';
      var canT = C.canText(st.t), canC = C.canColor(st.t);
      if (canT) h += '<label class="pk-fld"><span>Title</span><input id="pkTi" maxlength="24" value="' + esc(st.cu.title != null ? st.cu.title : w.title) + '" autocomplete="off"></label>' +
        (w.sub || !t || t.kind === 'vector' ? '<label class="pk-fld"><span>Subtitle</span><input id="pkSu" maxlength="30" value="' + esc(st.cu.sub != null ? st.cu.sub : w.sub) + '" autocomplete="off"></label>' : '');
      if (w.year != null) h += '<label class="pk-fld pk-fld--yr"><span>Year</span><input id="pkYr" maxlength="9" inputmode="numeric" value="' + esc(st.cu.year != null ? st.cu.year : w.year) + '" autocomplete="off"></label>';
      if (canT || w.year != null) h += '<label class="pk-check"><input type="checkbox" id="pkSh"' + ((st.cu.sh != null ? +st.cu.sh : w.sh) ? ' checked' : '') + '><span>Shadow behind the words</span></label>';
      if (!t) h += '<div class="pk-fld"><span>Artwork</span><div class="pk-stks" id="pkStks"><button type="button" data-stk=""' + (!st.cu.stk ? ' class="is-on"' : '') + ' aria-label="No artwork"><i>None</i></button>' + C.ORDER.map(function (id) { return C.TPL[id]; }).filter(function (x) { return x.layered; }).map(function (x) { var k = 'tr:' + x.slug; return '<button type="button" data-stk="' + k + '"' + (st.cu.stk === k ? ' class="is-on"' : '') + ' aria-label="' + esc(x.name) + '"><img src="' + x.artThumb + '" alt="" loading="lazy"></button>'; }).join('') + '</div><small class="pk-opt__note">More artwork, emoji and words in the editor.</small></div>';
      if (t && t.kind === 'vector') h += '<div class="pk-fld"><span>Colours</span>' + sw('pal', t.palettes, st.c, true) + '</div>';
      else if (canC) {
        var base = t ? t.bg : C.BLANK[st.c] || C.BLANK[0];
        h += '<div class="pk-fld"><span>Cover colour</span>' + sw('bg', [base].concat(C.COVER_COLORS.filter(function (c) { return c !== base; })), st.cu.bg || base) + '</div>';
        var tc0 = t ? t.tc : (C.luminance(base) < 0.45 ? '#ffffff' : '#1d1d1f');
        h += '<div class="pk-fld"><span>Title colour</span>' + sw('tc', [tc0].concat(C.TEXT_COLORS.filter(function (c) { return c !== tc0; })), st.cu.tc || tc0) + '</div>';
        var sc0 = t ? ((t.lines[1] || {}).color || null) : (C.luminance(base) < 0.45 ? '#ffd25e' : '#e5383b');
        if (sc0 && (w.sub || !t)) h += '<div class="pk-fld"><span>Subtitle colour</span>' + sw('sc', [sc0].concat(C.TEXT_COLORS.filter(function (c) { return c !== sc0; })), st.cu.sc || sc0) + '</div>';
      }
      if (!canT && !canC) h += '<p class="pk-opt__note">This cover’s lettering is part of its artwork, so it’s used as it is. Add photos, text and stickers inside, or pick a cover marked ✎.</p>';
      else if (t && t.kind === 'raster' && !t.layered) h += '<p class="pk-opt__note">Change the words here. This cover’s colours are part of its artwork.</p>';
      else h += '<p class="pk-opt__note">More in the editor: move or swap the artwork, fonts, stickers and photos. CIEL AFRICA always stays small at the bottom.</p>';
      make.innerHTML = h;
      document.getElementById('pkReset').hidden = !dirty();
      var ti = document.getElementById('pkTi'), su = document.getElementById('pkSu');
      if (ti) ti.addEventListener('input', function () { st.cu.title = ti.value.toUpperCase(); soon(); document.getElementById('pkReset').hidden = false; });
      if (su) su.addEventListener('input', function () { st.cu.sub = su.value.toUpperCase(); soon(); document.getElementById('pkReset').hidden = false; });
      var yr = document.getElementById('pkYr'), sh = document.getElementById('pkSh');
      if (yr) yr.addEventListener('input', function () { st.cu.year = yr.value.toUpperCase(); soon(); document.getElementById('pkReset').hidden = false; });
      if (sh) sh.addEventListener('change', function () { st.cu.sh = sh.checked ? 1 : 0; render(); document.getElementById('pkReset').hidden = false; });
    }
    make.addEventListener('click', function (e) {
      var sk = e.target.closest('[data-stk]');
      if (sk) { st.cu.stk = sk.getAttribute('data-stk') || null; sk.parentNode.querySelectorAll('button').forEach(function (x) { x.classList.toggle('is-on', x === sk); }); document.getElementById('pkReset').hidden = !dirty(); render(); return; }
      var b = e.target.closest('[data-k]'); if (!b) return;
      var k = b.getAttribute('data-k'), v = b.getAttribute('data-v');
      if (k === 'pal') st.c = +v; else st.cu[k] = v;
      b.parentNode.querySelectorAll('.pk-sw').forEach(function (x) { x.classList.toggle('is-on', x === b); });
      document.getElementById('pkReset').hidden = !dirty() && k !== 'pal';
      if (k === 'pal') drawAlt();
      render();
    });
    document.getElementById('pkReset').addEventListener('click', function () { st.cu = {}; drawMake(); render(); });
    function drawAlt() {
      var t = sel(), alt = document.getElementById('pkAlt');
      var others = t ? (t.kind === 'vector' ? t.palettes.map(function (_, i) { return [t, i]; }) : list.filter(function (x) { return x.id !== st.t; }).slice(0, 4).map(function (x) { return [x, 0]; })) : C.BLANK.slice(0, 4).map(function (_, i) { return ['blank', i]; });
      alt.innerHTML = others.slice(0, 4).map(function (o) { return '<button type="button" data-alt="' + esc(o[0] === 'blank' ? 'blank' : o[0].id) + '" data-ac="' + o[1] + '"' + ((o[0] === 'blank' ? 'blank' : o[0].id) === st.t && o[1] === st.c ? ' class="is-on"' : '') + '><img src="' + mockSrc(o[0], o[1]) + '" alt="" loading="lazy"' + IMGWH + '></button>'; }).join('');
    }
    /* live 3D preview: the real cover with the customer's words and colours, slim or thick by pages */
    var rT, rN = 0;
    function soon() { clearTimeout(rT); rT = setTimeout(render, 140); }
    function render() {
      var my = ++rN, t = sel(), img = document.getElementById('pkMain'), cv = document.getElementById('pkMainC'), mini = document.getElementById('pkMini');
      if (!dirty() && R.bookKind(st.pages) === 'thin') { img.src = bigSrc(t || 'blank', st.c); img.hidden = false; cv.hidden = true; }
      var doc = C.customDoc(st.t, st.c, st.cu); if (!doc) return;
      var so = C.spineFor(doc, st.t, st.c);
      R.renderBook(doc, so, { pages: st.pages, large: true, px: 1200 }).then(function (m) {
        if (my !== rN) return;
        [cv, mini].forEach(function (c) { c.width = m.width; c.height = m.height; c.getContext('2d').drawImage(m, 0, 0); });
        cv.hidden = false; img.hidden = true;
      }).catch(function () {});
    }
    function collapse(on) {
      st.collapsed = on; var t = sel(), ch = document.getElementById('pkChosen');
      var pr = main.querySelector('.pk-prod'); if (pr) pr.classList.toggle('is-chosen', !!on);
      ch.hidden = !on; document.getElementById('pkPick').hidden = on;
      if (on) { ch.querySelector('img').src = mockSrc(t || 'blank', st.c); ch.querySelector('b').textContent = t ? t.name : 'Blank cover'; }
    }
    function drawSel() {
      var t = sel();
      collapse(st.collapsed);
      document.getElementById('pkSel').textContent = t ? t.name : 'Blank cover';
      covers.querySelectorAll('.pk-cv').forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-t') === st.t); });
      drawAlt(); drawMake(); render();
    }
    covers.addEventListener('click', function (e) {
      var b = e.target.closest('[data-t]'); if (!b) return;
      if (b.getAttribute('data-t') !== st.t) { st.t = b.getAttribute('data-t'); st.c = 0; st.cu = {}; }
      st.collapsed = true; drawSel();
      var mk = document.querySelector(innerWidth < 900 ? '.pk-prod' : '.pk-make'); if (mk) setTimeout(function () { var nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 70; var y = mk.getBoundingClientRect().top + scrollY - (innerWidth < 900 ? nav : 110); window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' }); }, 60);
    });
    document.getElementById('pkChange').addEventListener('click', function () { collapse(false); var on = covers.querySelector('.is-on'); if (on) covers.scrollTop = Math.max(0, on.offsetTop - 8); });
    document.getElementById('pkAlt').addEventListener('click', function (e) { var b = e.target.closest('[data-alt]'); if (!b) return; var id = b.getAttribute('data-alt'); if (id !== st.t) st.cu = {}; st.t = id; st.c = +b.getAttribute('data-ac'); drawSel(); });
    document.getElementById('pkPg').addEventListener('click', function (e) {
      var b = e.target.closest('[data-p]'); if (!b) return; var was = R.bookKind(st.pages); st.pages = +b.getAttribute('data-p');
      this.querySelectorAll('button').forEach(function (x) { x.classList.toggle('is-on', x === b); });
      document.getElementById('pkPrice').textContent = priceLabel(st.pages); document.getElementById('pkPriceFor').textContent = st.pages + ' pages';
      if (R.bookKind(st.pages) !== was) render();
    });
    var q = document.getElementById('pkQ'); if (q) q.addEventListener('input', function () { st.q = q.value; drawCovers(); });
    function start(go) {
      var u = BASE + '/design?t=' + encodeURIComponent(st.t) + '&c=' + st.c + '&n=' + st.pages + '&go=' + go;
      ['title', 'sub', 'bg', 'tc', 'sc', 'year', 'sh', 'stk'].forEach(function (k) { if (st.cu[k] != null && st.cu[k] !== '') u += '&' + k + '=' + encodeURIComponent(st.cu[k]); });
      PBK.go(u);
    }
    document.getElementById('pkStart').addEventListener('click', function () { start('photos'); });
    document.getElementById('pkCust').addEventListener('click', function () { start('cover'); });
    drawCovers(); drawSel();
    var on = covers.querySelector('.is-on'); if (on && on.offsetTop > covers.clientHeight) covers.scrollTop = on.offsetTop - 8;
  }

  /* ---------------- order tracking ---------------- */
  function track() {
    document.title = 'Track your order · Photo Books — Ciel Africa';
    var q = new URLSearchParams(location.search), ref = q.get('ref') || '', tok = q.get('t') || '';
    main.innerHTML = '<section class="pk-track wrap"><div class="pk-head"><span class="eyebrow"><span class="brk">‹</span> Photo Books</span><h1>Track your order</h1><p>Enter the order number from your email (it starts with PB-) and the phone number or email you ordered with.</p></div>' +
      '<form class="pk-track__f" id="tkF"><label><span>Order number</span><input id="tkRef" placeholder="PB-XXXXXXXX" value="' + esc(ref) + '" autocomplete="off" required></label><label><span>Phone or email</span><input id="tkC" placeholder="0712 345 678 or you@email.com" autocomplete="email"' + (tok ? '' : ' required') + '></label><button class="btn btn--p btn--lg">Track order ' + ICON.arrow + '</button></form><div id="tkOut"></div></section>';
    var f = document.getElementById('tkF'), out = document.getElementById('tkOut');
    function go(useTok) {
      out.innerHTML = '<p class="pk-empty">Looking up your order…</p>';
      fetch('/api/photobooks?route=pbk-track', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'ciel' }, credentials: 'same-origin', body: JSON.stringify({ ref: document.getElementById('tkRef').value, contact: document.getElementById('tkC').value, t: useTok ? tok : undefined }) })
        .then(function (r) { return r.json(); }).then(function (j) {
          if (!j.ok) { out.innerHTML = '<p class="pk-track__err">' + esc(j.error || 'We couldn’t find that order.') + '</p>'; return; }
          var o = j.order, print = o.items.some(function (i) { return i.product === 'print'; });
          var steps = [['Paid', 0], ['Pages received', 1], ['Printing', 2], [o.status === 'ready_collection' ? 'Ready to collect' : 'On its way', 3], ['Delivered', 4]];
          var when = function (t) { return t ? new Date(t).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' }) : ''; };
          out.innerHTML = '<div class="pk-track__card"><div class="pk-track__top"><div><span class="pk-track__ref">' + esc(o.ref) + (o.test ? ' · TEST' : '') + '</span><h2>' + esc(o.label) + '</h2></div><b>' + money(o.total) + '</b></div>' +
            (print && o.step >= 0 ? '<ol class="pk-track__steps">' + steps.map(function (s2) { return '<li class="' + (s2[1] < o.step ? 'is-done' : s2[1] === o.step ? 'is-now' : '') + '"><i></i><span>' + s2[0] + '</span></li>'; }).join('') + '</ol>' : '') +
            (print && o.status === 'paid' ? '<div class="pk-track__todo"><b>We’re still waiting for your book’s pages.</b> They send from the phone or computer you designed the book on. Open <a data-go href="' + BASE + '/my-books">My books</a> there and tap <b>Send now</b>: it continues from where it stopped.</div>' : '') +
            '<ul class="pk-track__items">' + o.items.map(function (i) { return '<li><b>' + esc(i.name) + '</b><span>' + (i.product === 'digital' ? 'Print-ready PDF' : 'Printed hardcover × ' + i.qty) + ' · ' + i.pages + ' pages</span></li>'; }).join('') + '</ul>' +
            (o.delivery ? '<p class="pk-track__del">' + esc(o.delivery) + '</p>' : '') +
            '<h3>History</h3><ul class="pk-track__hist">' + o.history.slice().reverse().map(function (h) { return '<li><b>' + esc(h.label) + '</b><span>' + when(h.at) + '</span></li>'; }).join('') + '</ul>' +
            '<p class="pk-track__help">Questions? <a target="_blank" rel="noopener" href="https://wa.me/254706549703?text=' + encodeURIComponent('Hello Ciel Africa, about my photo book order ' + o.ref) + '">WhatsApp us</a> or email hello@cielafrica.com.</p></div>';
        }, function () { out.innerHTML = '<p class="pk-track__err">Can’t reach Ciel Africa right now. Check your connection and try again.</p>'; });
    }
    f.addEventListener('submit', function (e) { e.preventDefault(); go(false); });
    if (ref && tok) go(true);
  }

  /* ---------------- template chooser (modal) ---------------- */
  var dlg;
  PBK.pick = function (cat, onPick) {
    if (!dlg) {
      dlg = document.createElement('dialog'); dlg.className = 'pk-dlg'; dlg.setAttribute('aria-label', 'Choose your template');
      document.body.appendChild(dlg);
      dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    }
    var st = { cat: cat || 'all', q: '' };
    var chips = [['all', 'All']].concat(C.CATS.map(function (c) { return [c.id, c.name]; })).concat([['blank', 'Blank']]);
    dlg.innerHTML = '<div class="pk-dlg__in"><header class="pk-dlg__h"><h2>Choose your template</h2><button type="button" class="pk-x" data-close aria-label="Close">' + ICON.x + '</button></header>' +
      '<label class="pk-search">' + ICON.search + '<input type="search" id="pkdQ" placeholder="Search: Paris, Nairobi, baby, wedding…" autocomplete="off"></label>' +
      '<div class="pk-chips" role="tablist">' + chips.map(function (c) { return '<button type="button" role="tab" data-cat="' + c[0] + '"' + (c[0] === st.cat ? ' class="is-on" aria-selected="true"' : '') + '>' + esc(c[1]) + '</button>'; }).join('') + '</div>' +
      '<div class="pk-dlg__grid" id="pkdGrid"></div></div>';
    var grid = dlg.querySelector('#pkdGrid');
    function draw() {
      var q = st.q.toLowerCase().trim(), items = [];
      if (st.cat === 'all' || st.cat === 'blank') items.push({ blank: true });
      if (st.cat !== 'blank') C.ORDER.forEach(function (id) { var t = C.TPL[id]; if (!C.visible(t)) return; if (st.cat !== 'all' && t.cat !== st.cat && !(st.cat === 'travel' && t.cat === 'kenya')) return; if (q && (t.name + ' ' + (t.title || '') + ' ' + (t.sub || '') + ' ' + t.cat + (t.cat === 'kenya' ? ' travel africa' : '')).toLowerCase().indexOf(q) < 0) return; items.push(t); });
      if (st.cat === 'blank') C.BLANK.forEach(function (_, i) { if (i) items.push({ blank: true, c: i }); });
      if (q) items = items.filter(function (x) { return !x.blank || 'blank'.indexOf(q) >= 0; });
      grid.innerHTML = items.map(function (t) {
        if (t.blank) return '<button type="button" class="pk-tp" data-id="blank" data-c="' + (t.c || 0) + '"><img src="' + mockSrc('blank', t.c || 0) + '" alt="" loading="lazy"' + IMGWH + '><span>Blank</span></button>';
        return '<button type="button" class="pk-tp" data-id="' + esc(t.id) + '" data-c="0"><img src="' + mockSrc(t, 0) + '" alt="" loading="lazy"' + IMGWH + '><span>' + esc(t.name) + '</span></button>';
      }).join('') || '<p class="pk-empty">Nothing matches “' + esc(st.q) + '”. Try another word or start with a blank cover.</p>';
    }
    dlg.querySelector('.pk-chips').addEventListener('click', function (e) { var b = e.target.closest('[data-cat]'); if (!b) return; st.cat = b.getAttribute('data-cat'); this.querySelectorAll('button').forEach(function (x) { var on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-selected', on ? 'true' : 'false'); }); draw(); grid.scrollTop = 0; });
    dlg.querySelector('#pkdQ').addEventListener('input', function () { st.q = this.value; if (st.q && st.cat !== 'all') { st.cat = 'all'; dlg.querySelectorAll('.pk-chips button').forEach(function (x) { x.classList.toggle('is-on', x.getAttribute('data-cat') === 'all'); }); } draw(); });
    dlg.querySelector('[data-close]').addEventListener('click', function () { dlg.close(); });
    grid.addEventListener('click', function (e) {
      var b = e.target.closest('[data-id]'); if (!b) return;
      var id = b.getAttribute('data-id'), c = +b.getAttribute('data-c') || 0;
      dlg.close();
      if (onPick) onPick(id, c); else PBK.go(id === 'blank' ? BASE + '/blank?c=' + c : coverLink(id, c));
    });
    draw();
    dlg.showModal();
    if (innerWidth > 700) dlg.querySelector('#pkdQ').focus();
  };

  /* ---------------- open an ordered book by its order number (read-only) ---------------- */
  function orderBox() {
    var q = new URLSearchParams(location.search);
    return '<div class="pk-ob"><div class="pk-ob__h"><b>Ordered a book?</b><span>Enter your order number to see your book as we received it and follow its progress. Sent books can’t be edited.</span></div>' +
      '<form class="pk-ob__f" id="obF"><input id="obRef" placeholder="Order number: PB-XXXXXXXX" value="' + esc(q.get('order') || '') + '" autocomplete="off" required><input id="obC" placeholder="Phone or email you ordered with" autocomplete="email" required><button class="btn btn--dark">Open my book</button></form><div id="obOut"></div></div>';
  }
  function bindOrderBox() {
    var f = document.getElementById('obF'), out = document.getElementById('obOut'); if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault(); out.innerHTML = '<p class="pk-empty">Looking up your order…</p>';
      fetch('/api/photobooks?route=pbk-track', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'ciel' }, credentials: 'same-origin', body: JSON.stringify({ ref: document.getElementById('obRef').value, contact: document.getElementById('obC').value }) })
        .then(function (r) { return r.json(); }).then(function (j) {
          if (!j.ok) { out.innerHTML = '<p class="pk-track__err">' + esc(j.error || 'We couldn’t find that order.') + '</p>'; return; }
          var o = j.order, wa = 'https://wa.me/254706549703?text=' + encodeURIComponent('Hello Ciel Africa, I need help with my photo book order ' + o.ref);
          var books = (j.books || []).map(function (b) {
            var pages = []; for (var i = 0; i < b.pages; i++) pages.push('<figure><img loading="lazy" draggable="false" src="/api/photobooks?route=pbk-view&t=' + encodeURIComponent(b.v) + '&i=' + i + '" alt="Page ' + (i + 1) + '"><figcaption>' + (i === 0 ? 'Front cover' : i === b.pages - 1 ? 'Back cover' : 'Page ' + i) + '</figcaption></figure>');
            return '<div class="pk-ob__book"><b>' + esc(b.name) + '</b><div class="pk-ob__pages">' + pages.join('') + '</div></div>';
          }).join('');
          out.innerHTML = '<div class="pk-ob__res"><div class="pk-ob__top"><div><span class="pk-track__ref">' + esc(o.ref) + (o.test ? ' · TEST' : '') + '</span><h3>' + esc(o.label) + '</h3></div><span class="pk-ob__lock">🔒 Sent: view only</span></div>' +
            (books || '<p class="pk-empty">Your book’s pages haven’t reached us yet. Open this page on the phone or computer you made the book on and tap <b>Send now</b>.</p>') +
            '<p class="pk-ob__help">Printed books are dispatched for delivery 24–48 hours after the pages reach us. Need a change or have a question? <a class="btn btn--p btn--sm" target="_blank" rel="noopener" href="' + wa + '">WhatsApp support</a> <a class="btn btn--ghost btn--sm" data-go href="' + BASE + '/track?ref=' + encodeURIComponent(o.ref) + '">Full tracking</a></p></div>';
        }, function () { out.innerHTML = '<p class="pk-track__err">Can’t reach Ciel Africa right now. Check your connection and try again.</p>'; });
    });
  }

  /* ---------------- my books ---------------- */
  function myBooks() {
    document.title = 'My photo books — Ciel Africa';
    main.innerHTML = catStrip() + '<section class="pk-my wrap"><div class="pk-head"><span class="eyebrow"><span class="brk">‹</span> Saved on this device</span><h2>My books</h2><p>Books are saved in this browser. Use the same phone or computer to continue.</p></div>' + orderBox() + '<div class="pk-my__grid" id="pkMy"><p class="pk-empty">Loading…</p></div></section>';
    bindOrderBox();
    var box = document.getElementById('pkMy');
    if (!window.PBStore) { box.innerHTML = '<p class="pk-empty">Storage is not available in this browser.</p>'; return; }
    PBStore.projects().then(function (list) {
      list = list.filter(function (p) { return p.app === 'pbk'; });
      if (!list.length) { box.innerHTML = '<div class="pk-empty"><p>No books yet.</p><button class="btn btn--p" data-pick>Create my photo book ' + ICON.arrow + '</button></div>'; bindCommon(); return; }
      box.innerHTML = list.map(function (p) {
        return '<div class="pk-myb"><a data-go href="' + BASE + '/design?p=' + esc(p.id) + '"><canvas width="275" height="355" data-p="' + esc(p.id) + '"></canvas></a><div><b>' + esc(p.name || 'My photo book') + '</b><span>' + (p.pages || []).length + ' pages · edited ' + new Date(p.updatedAt || Date.now()).toLocaleDateString() + '</span><div class="pk-myb__a"><a data-go class="btn btn--sm btn--dark" href="' + BASE + '/design?p=' + esc(p.id) + '">Open</a><button class="btn btn--sm btn--ghost" data-del="' + esc(p.id) + '">Delete</button></div></div></div>';
      }).join('');
      list.forEach(function (p) {
        var cv = box.querySelector('canvas[data-p="' + p.id + '"]'); if (!cv || !p.cover) return; C.fixCover(p.cover, p.tpl);
        R.renderBook(p.cover, C.spineFor(p.cover, p.tpl, p.pal), { pages: (p.pages || []).length, photo: function () { return null; } }).then(function (m) { cv.width = m.width; cv.height = m.height; cv.getContext('2d').drawImage(m, 0, 0); }).catch(function () {});
      });
      if (window.PBKShop) PBKShop.purchases().then(function (pl) {
        pl.forEach(function (pu) {
          var card = box.querySelector('canvas[data-p="' + pu.projectId + '"]'); card = card && card.closest('.pk-myb'); if (!card) return;
          var info = document.createElement('div'); info.className = 'pk-myb__paid' + (pu.product === 'print' && !pu.done ? ' is-todo' : '');
          info.innerHTML = pu.product === 'print' ? (pu.done ? '✓ Order ' + esc(pu.ref) + ': pages sent to Ciel Africa. <a data-go href="' + BASE + '/track?ref=' + encodeURIComponent(pu.ref) + '">Track order</a>' : 'Order ' + esc(pu.ref) + ' is paid, but its pages haven’t finished sending. <a class="btn btn--p btn--sm" data-go href="' + BASE + '/checkout?sent=' + encodeURIComponent(pu.ref) + '">Send now</a>') : '✓ PDF paid (' + esc(pu.ref) + ')';
          card.querySelector('div').appendChild(info);
          if (pu.product === 'print' && (pu.done || (pu.sent && pu.sent.print && pu.sent.print.length))) {
            card.classList.add('is-sent');
            var view = BASE + '/my-books?order=' + encodeURIComponent(pu.ref);
            card.querySelectorAll('a[href*="/design?p="]').forEach(function (a2) { a2.setAttribute('href', view); if (a2.classList.contains('btn')) a2.textContent = 'View'; });
            var acts = card.querySelector('.pk-myb__a'); if (acts) acts.insertAdjacentHTML('beforeend', '<a class="btn btn--sm btn--ghost" target="_blank" rel="noopener" href="https://wa.me/254706549703?text=' + encodeURIComponent('Hello Ciel Africa, I need help with my photo book order ' + pu.ref) + '">Support</a>');
            var del = card.querySelector('[data-del]'); if (del) del.remove();
            info.insertAdjacentHTML('beforeend', '<br><small>Sent books can’t be edited. Need a change? WhatsApp us.</small>');
          }
        });
      });
      box.querySelectorAll('[data-del]').forEach(function (b) {
        b.addEventListener('click', function () {
          if (!confirm('Delete this book and its photos from this device? This can’t be undone.')) return;
          PBStore.deleteProject(b.getAttribute('data-del')).then(myBooks);
        });
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', route); else setTimeout(route, 0);
})();
