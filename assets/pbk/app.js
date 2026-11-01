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

  function mockSrc(t, pi) { return t === 'blank' ? '/assets/pbk/c/m/blank-' + (pi || 0) + '.webp?v=1' : t.mock(pi); }
  PBK.mockSrc = mockSrc;
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
    if (seg === 'my-books') return myBooks();
    if (C.cat(seg) || seg === 'blank') return category(seg);
    landing();
  }
  PBK.go = function (url) { history.pushState({}, '', url); window.scrollTo(0, 0); route(); };
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-go]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    e.preventDefault(); PBK.go(a.getAttribute('href'));
  });
  window.addEventListener('popstate', route);

  /* ---------------- shared bits ---------------- */
  function catStrip(active) {
    return '<nav class="pk-cats" aria-label="Photo book categories"><div class="pk-cats__in">' + C.CATS.map(function (c) {
      var t = catHero(c.id);
      return '<a data-go href="' + BASE + '/' + c.id + '" class="pk-cat' + (active === c.id ? ' is-on' : '') + '"><span class="pk-cat__img"><img src="' + mockSrc(t, 0) + '" alt="" loading="lazy" width="550" height="710"></span><span>' + esc(c.name) + '</span></a>';
    }).join('') + '</div></nav>';
  }
  function steps() {
    var c1 = ['travel/lisbon', 'kenya/mombasa', 'couple/amour'].map(function (id) { return '<img src="' + mockSrc(C.TPL[id], id === 'couple/amour' ? 0 : 0) + '" alt="" loading="lazy">'; }).join('');
    return '<section class="pk-steps wrap" id="how"><div class="pk-head"><span class="eyebrow"><span class="brk">‹</span> How it works</span><h2>Your photo book in <span class="pk-hl">3 steps</span></h2><p>About ten minutes on your phone. No design skills needed.</p></div>' +
      '<ol class="pk-steps__list">' +
      '<li class="pk-step"><div class="pk-step__vis pk-step__vis--1">' + c1 + '</div><span class="pk-step__n">1</span><h3>Choose your template</h3><p>Pick a cover for the trip, the person or the year: more than a hundred designs, or start from a blank cover.</p></li>' +
      '<li class="pk-step"><div class="pk-step__vis pk-step__vis--2"><div class="pk-phone"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="pk-arrow">' + ICON.arrow + '</div><div class="pk-page"><i></i><i></i></div></div><span class="pk-step__n">2</span><h3>Add your photos</h3><p>Choose them straight from your camera roll. They drop into the pages, one or two per page.</p></li>' +
      '<li class="pk-step"><div class="pk-step__vis pk-step__vis--3"><div class="pk-ui"><span class="pk-ui__bar"></span><span class="pk-ui__page"><b></b></span><span class="pk-ui__tools"><i>Aa</i><i>★</i><i>●</i></span></div></div><span class="pk-step__n">3</span><h3>Personalise it</h3><p>Just like Canva: change the words, colours and stickers, move and resize photos, then preview the whole book.</p></li>' +
      '</ol></section>';
  }
  function trust() {
    return '<ul class="pk-trust"><li>' + ICON.book + '<span><b>Portrait hardcover</b>' + esc(BOOK.size || '21 × 28 cm') + ', ' + BOOK.pages.min + '–' + BOOK.pages.max + ' pages</span></li>' +
      '<li>' + ICON.phone + '<span><b>Design on your phone</b>or on a computer, no app to install</span></li>' +
      '<li>' + ICON.lock + '<span><b>Your photos stay private</b>they stay on your device while you design</span></li>' +
      '<li>' + ICON.eye + '<span><b>Preview every page</b>flip through the whole book before ordering</span></li></ul>';
  }
  function faq() {
    var q = [
      ['What size is the book?', 'Every book is portrait, ' + (BOOK.size || '21 × 28 cm') + ', with a hardcover. Every cover is designed for that size.'],
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
    var fan = ['travel/zanzibar', 'kenya/nairobi', 'travel/paris', 'couple/our-story', 'travel/tokyo'];
    var rowA = ['travel/ibiza', 'kenya/serengeti', 'travel/lisbon', 'event/cheers', 'travel/madagascar', 'friends/besties', 'travel/new-york', 'baby/hello-baby', 'travel/senegal', 'kenya/kenya', 'travel/mexico', 'pets/good-boy'];
    var rowB = ['travel/greece', 'couple/amour', 'travel/south-africa', 'kenya/mombasa', 'travel/sicily', 'year/my-year', 'travel/london', 'family/home', 'travel/morocco', 'someone/for-mum', 'travel/bali', 'event/wedding'];
    function row(ids, pal) { var h = ids.filter(function (i) { return C.TPL[i]; }).map(function (id, i) { var t = C.TPL[id]; return '<a data-go href="' + BASE + '/design?t=' + encodeURIComponent(id) + '&c=' + (t.kind === 'vector' ? (i + pal) % t.palettes.length : 0) + '" class="pk-mq__item" aria-label="' + esc(t.name) + '"><img src="' + mockSrc(t, t.kind === 'vector' ? (i + pal) % t.palettes.length : 0) + '" alt="' + esc(t.name) + ' cover" loading="lazy" width="550" height="710"></a>'; }).join(''); return h + h; }
    main.innerHTML = catStrip() +
      '<section class="pk-hero wrap"><div class="pk-hero__copy"><span class="eyebrow"><span class="brk">‹</span> Photo Books</span>' +
      '<h1>Your memories deserve more than a <span class="pk-hl">camera roll.</span></h1>' +
      '<p class="pk-lead">Pick a cover, add your photos and make every page yours. A portrait hardcover book, ' + esc(BOOK.size || '21 × 28 cm') + ', designed in minutes on your phone.</p>' +
      '<div class="pk-cta"><button class="btn btn--p btn--lg" data-pick>Create my photo book ' + ICON.arrow + '</button><a data-go href="' + BASE + '/travel" class="btn btn--ghost btn--lg">Browse travel covers</a></div>' +
      '<p class="pk-note">' + C.ORDER.length + ' covers · Kenya, travel, couples, family and more · <a data-go href="' + BASE + '/my-books">My books</a></p></div>' +
      '<div class="pk-fan" aria-hidden="true">' + fan.map(function (id, i) { var t = C.TPL[id]; return t ? '<img class="pk-fan__b pk-fan__b--' + i + '" src="' + mockSrc(t, 0) + '" alt="" width="550" height="710"' + (i === 2 ? ' fetchpriority="high"' : '') + '>' : ''; }).join('') + '</div></section>' +
      '<section class="pk-mq" aria-label="Cover designs"><div class="pk-mq__row"><div class="pk-mq__track">' + row(rowA, 0) + '</div></div><div class="pk-mq__row pk-mq__row--b"><div class="pk-mq__track">' + row(rowB, 1) + '</div></div></section>' +
      steps() +
      '<section class="pk-grid wrap" id="collections"><div class="pk-head"><span class="eyebrow"><span class="brk">‹</span> Collections</span><h2>A book for every story</h2></div><div class="pk-tiles">' +
      C.CATS.map(function (c) { var t = catHero(c.id); var n = C.byCat(c.id).length; return '<a data-go href="' + BASE + '/' + c.id + '" class="pk-tile pk-tile--' + c.id + '"><span class="pk-tile__img"><img src="' + mockSrc(t, 0) + '" alt="" loading="lazy" width="550" height="710"></span><span class="pk-tile__t">' + esc(c.name) + '</span><span class="pk-tile__n">' + n + ' cover' + (n === 1 ? '' : 's') + '</span></a>'; }).join('') +
      '<button class="pk-tile pk-tile--blank" data-blank><span class="pk-tile__img"><img src="' + mockSrc('blank', 4) + '" alt="" loading="lazy" width="550" height="710"></span><span class="pk-tile__t">Blank cover</span><span class="pk-tile__n">Design your own</span></button>' +
      '</div></section>' +
      '<section class="pk-kenya"><div class="wrap pk-kenya__in"><div class="pk-kenya__copy"><span class="eyebrow"><span class="brk">‹</span> New</span><h2>Made for <span class="pk-hl">Kenya</span></h2><p>Nairobi, Mombasa, the Serengeti plains and a Kenya cover for every trip home. Same minimal style, same CIEL AFRICA mark, every word editable.</p><a data-go href="' + BASE + '/kenya" class="btn btn--dark">See the Kenya covers ' + ICON.arrow + '</a></div>' +
      '<div class="pk-kenya__books">' + C.byCat('kenya').slice(0, 4).map(function (t, i) { return '<a data-go href="' + BASE + '/design?t=' + encodeURIComponent(t.id) + '&c=0"><img src="' + mockSrc(t, 0) + '" alt="' + esc(t.name) + ' cover" loading="lazy" width="550" height="710"></a>'; }).join('') + '</div></div></section>' +
      '<section class="pk-spec wrap"><div class="pk-spec__card"><div><span class="eyebrow"><span class="brk">‹</span> The book</span><h2>Price by pages</h2><p>Every book is a portrait hardcover, ' + esc(BOOK.size || '21 × 28 cm') + '. Start with ' + BOOK.pages.min + ' pages and add more as you go: the price depends on the number of pages.</p></div>' +
      '<div class="pk-calc"><label for="pkPages">Pages <output id="pkPagesOut">' + BOOK.pages.default + '</output></label><input type="range" id="pkPages" min="' + BOOK.pages.min + '" max="' + BOOK.pages.max + '" step="' + BOOK.pages.step + '" value="' + BOOK.pages.default + '"><div class="pk-calc__price" id="pkPrice">' + esc(priceLabel(BOOK.pages.default)) + '</div>' + (price(BOOK.pages.min) == null ? '<p class="pk-calc__note">Prices are being finalised. You can design and save your book now.</p>' : '') + '</div></div></section>' +
      trust() + faq() +
      '<section class="wrap"><div class="pk-band"><h2>Ready to make yours?</h2><p>Choose a cover and start adding photos.</p><button class="btn btn--p btn--lg" data-pick>Create my photo book ' + ICON.arrow + '</button></div></section>';
    bindCommon();
    var r = document.getElementById('pkPages');
    if (r) r.addEventListener('input', function () { document.getElementById('pkPagesOut').textContent = r.value; document.getElementById('pkPrice').textContent = priceLabel(+r.value); });
  }

  function bindCommon() {
    main.querySelectorAll('[data-pick]').forEach(function (b) { b.addEventListener('click', function () { PBK.pick(b.getAttribute('data-pick') || 'all'); }); });
    main.querySelectorAll('[data-blank]').forEach(function (b) { b.addEventListener('click', function () { PBK.go(BASE + '/design?t=blank&c=0'); }); });
  }

  /* ---------------- category page ---------------- */
  function category(catId) {
    var cat = C.cat(catId) || { id: 'blank', name: 'Blank', title: 'Blank cover photo book', blurb: 'Design your own cover: colours, words and stickers. The CIEL AFRICA mark stays small at the bottom.', cta: 'Start my book' };
    document.title = cat.title + ' — Ciel Africa';
    var list = catId === 'blank' ? [] : C.byCat(catId);
    var st = { t: list[0] ? list[0].id : 'blank', c: 0, pages: BOOK.pages.default, q: '' };
    var params = new URLSearchParams(location.search);
    if (params.get('t') && (C.TPL[params.get('t')] || params.get('t') === 'blank')) st.t = params.get('t');
    if (params.get('c')) st.c = +params.get('c') || 0;
    main.innerHTML = catStrip(catId) +
      '<section class="pk-prod wrap"><div class="pk-prod__gal"><div class="pk-prod__main"><img id="pkMain" alt="" width="550" height="710"></div><div class="pk-prod__alt" id="pkAlt"></div></div>' +
      '<div class="pk-prod__info"><div class="crumb"><a data-go href="' + BASE + '">Photo Books</a> <span class="brk">‹</span> ' + esc(cat.name) + '</div><h1>' + esc(cat.title) + '</h1>' +
      '<p class="pk-prod__price"><span id="pkPrice">' + esc(priceLabel(st.pages)) + '</span><small id="pkPriceFor">' + st.pages + ' pages</small></p>' +
      '<p class="pk-prod__blurb">' + esc(cat.blurb) + '</p>' +
      '<div class="pk-opt"><div class="pk-opt__h"><b>Choose your cover</b><span id="pkSel"></span></div>' +
      (list.length > 8 ? '<label class="pk-search">' + ICON.search + '<input id="pkQ" type="search" placeholder="Search ' + list.length + ' covers (e.g. Paris, Kenya)" autocomplete="off"></label>' : '') +
      '<div class="pk-covers" id="pkCovers"></div><div class="pk-swatches" id="pkSw"></div></div>' +
      '<div class="pk-opt"><div class="pk-opt__h"><b>Pages</b><span>' + esc(BOOK.size || '21 × 28 cm') + ' portrait</span></div><div class="pk-pages" id="pkPg">' +
      [24, 36, 48, 60, 80, 100].filter(function (n) { return n >= BOOK.pages.min && n <= BOOK.pages.max; }).map(function (n) { return '<button type="button" data-p="' + n + '"' + (n === st.pages ? ' class="is-on"' : '') + '>' + n + '</button>'; }).join('') + '</div><p class="pk-opt__note">You can add or remove pages later in the editor.</p></div>' +
      '<button class="btn btn--p btn--lg pk-start" id="pkStart">' + esc(cat.cta) + ' ' + ICON.arrow + '</button>' +
      '<button class="pk-link" data-pick="' + (catId === 'blank' ? 'all' : catId) + '">See all templates</button>' +
      trust() + '</div></section>' + steps() + faq();
    bindCommon();
    var covers = document.getElementById('pkCovers'), sw = document.getElementById('pkSw');
    function sel() { return st.t === 'blank' ? null : C.TPL[st.t]; }
    function drawCovers() {
      var q = st.q.toLowerCase().trim();
      var items = list.filter(function (t) { return !q || (t.name + ' ' + (t.title || '') + ' ' + (t.sub || '') + ' ' + t.cat).toLowerCase().indexOf(q) >= 0; });
      covers.innerHTML = items.map(function (t) { return '<button type="button" class="pk-cv' + (t.id === st.t ? ' is-on' : '') + '" data-t="' + esc(t.id) + '" title="' + esc(t.name) + '"><img src="' + mockSrc(t, t.id === st.t ? st.c : 0) + '" alt="' + esc(t.name) + '" loading="lazy" width="550" height="710"><span>' + esc(t.name) + '</span></button>'; }).join('') +
        (catId === 'blank' || !q ? '<button type="button" class="pk-cv pk-cv--blank' + (st.t === 'blank' ? ' is-on' : '') + '" data-t="blank"><img src="' + mockSrc('blank', st.t === 'blank' ? st.c : 4) + '" alt="Blank cover" loading="lazy" width="550" height="710"><span>Blank</span></button>' : '') +
        (!items.length ? '<p class="pk-empty">No cover matches “' + esc(st.q) + '”. Try another word, or start from a blank cover.</p>' : '');
    }
    function drawSel() {
      var t = sel();
      document.getElementById('pkMain').src = mockSrc(t || 'blank', st.c);
      document.getElementById('pkMain').alt = (t ? t.name : 'Blank') + ' cover';
      document.getElementById('pkSel').textContent = t ? t.name : 'Blank cover';
      var pals = t ? (t.kind === 'vector' ? t.palettes.map(function (p) { return p[0]; }) : []) : C.BLANK;
      sw.innerHTML = pals.length > 1 ? '<span class="pk-sw__l">Colour</span>' + pals.map(function (c, i) { return '<button type="button" class="pk-sw' + (i === st.c ? ' is-on' : '') + '" data-c="' + i + '" style="--c:' + c + '" aria-label="Colour ' + (i + 1) + '"></button>'; }).join('') : (t && t.kind === 'raster' ? '<span class="pk-sw__l">' + (t.editable ? 'Title and subtitle can be changed in the editor.' : 'This cover is used as it is; add stickers and photos inside.') + '</span>' : '');
      var alt = document.getElementById('pkAlt');
      var others = (t ? (t.kind === 'vector' ? t.palettes.map(function (_, i) { return [t, i]; }) : list.filter(function (x) { return x.id !== st.t; }).slice(0, 3).map(function (x) { return [x, 0]; })) : C.BLANK.slice(0, 4).map(function (_, i) { return ['blank', i]; }));
      alt.innerHTML = others.slice(0, 4).map(function (o) { return '<button type="button" data-alt="' + esc(o[0] === 'blank' ? 'blank' : o[0].id) + '" data-ac="' + o[1] + '"><img src="' + mockSrc(o[0], o[1]) + '" alt="" loading="lazy" width="550" height="710"></button>'; }).join('');
      covers.querySelectorAll('.pk-cv').forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-t') === st.t); });
    }
    covers.addEventListener('click', function (e) { var b = e.target.closest('[data-t]'); if (!b) return; st.t = b.getAttribute('data-t'); st.c = 0; drawSel(); if (innerWidth < 900) document.querySelector('.pk-prod__gal').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    sw.addEventListener('click', function (e) { var b = e.target.closest('[data-c]'); if (!b) return; st.c = +b.getAttribute('data-c'); drawSel(); var img = covers.querySelector('.is-on img'); if (img) img.src = mockSrc(sel() || 'blank', st.c); });
    document.getElementById('pkAlt').addEventListener('click', function (e) { var b = e.target.closest('[data-alt]'); if (!b) return; st.t = b.getAttribute('data-alt'); st.c = +b.getAttribute('data-ac'); drawSel(); });
    document.getElementById('pkPg').addEventListener('click', function (e) { var b = e.target.closest('[data-p]'); if (!b) return; st.pages = +b.getAttribute('data-p'); this.querySelectorAll('button').forEach(function (x) { x.classList.toggle('is-on', x === b); }); document.getElementById('pkPrice').textContent = priceLabel(st.pages); document.getElementById('pkPriceFor').textContent = st.pages + ' pages'; });
    var q = document.getElementById('pkQ'); if (q) q.addEventListener('input', function () { st.q = q.value; drawCovers(); });
    document.getElementById('pkStart').addEventListener('click', function () { PBK.go(BASE + '/design?t=' + encodeURIComponent(st.t) + '&c=' + st.c + '&n=' + st.pages); });
    drawCovers(); drawSel();
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
      if (st.cat !== 'blank') C.ORDER.forEach(function (id) { var t = C.TPL[id]; if (st.cat !== 'all' && t.cat !== st.cat && !(st.cat === 'travel' && t.cat === 'kenya')) return; if (q && (t.name + ' ' + (t.title || '') + ' ' + (t.sub || '') + ' ' + t.cat + (t.cat === 'kenya' ? ' travel africa' : '')).toLowerCase().indexOf(q) < 0) return; items.push(t); });
      if (st.cat === 'blank') C.BLANK.forEach(function (_, i) { if (i) items.push({ blank: true, c: i }); });
      if (q) items = items.filter(function (x) { return !x.blank || 'blank'.indexOf(q) >= 0; });
      grid.innerHTML = items.map(function (t) {
        if (t.blank) return '<button type="button" class="pk-tp" data-id="blank" data-c="' + (t.c || 0) + '"><img src="' + mockSrc('blank', t.c || 0) + '" alt="" loading="lazy" width="550" height="710"><span>Blank</span></button>';
        return '<button type="button" class="pk-tp" data-id="' + esc(t.id) + '" data-c="0"><img src="' + mockSrc(t, 0) + '" alt="" loading="lazy" width="550" height="710"><span>' + esc(t.name) + '</span></button>';
      }).join('') || '<p class="pk-empty">Nothing matches “' + esc(st.q) + '”. Try another word or start with a blank cover.</p>';
    }
    dlg.querySelector('.pk-chips').addEventListener('click', function (e) { var b = e.target.closest('[data-cat]'); if (!b) return; st.cat = b.getAttribute('data-cat'); this.querySelectorAll('button').forEach(function (x) { var on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-selected', on ? 'true' : 'false'); }); draw(); grid.scrollTop = 0; });
    dlg.querySelector('#pkdQ').addEventListener('input', function () { st.q = this.value; if (st.q && st.cat !== 'all') { st.cat = 'all'; dlg.querySelectorAll('.pk-chips button').forEach(function (x) { x.classList.toggle('is-on', x.getAttribute('data-cat') === 'all'); }); } draw(); });
    dlg.querySelector('[data-close]').addEventListener('click', function () { dlg.close(); });
    grid.addEventListener('click', function (e) {
      var b = e.target.closest('[data-id]'); if (!b) return;
      var id = b.getAttribute('data-id'), c = +b.getAttribute('data-c') || 0;
      dlg.close();
      if (onPick) onPick(id, c); else PBK.go(BASE + '/design?t=' + encodeURIComponent(id) + '&c=' + c);
    });
    draw();
    dlg.showModal();
    if (innerWidth > 700) dlg.querySelector('#pkdQ').focus();
  };

  /* ---------------- my books ---------------- */
  function myBooks() {
    document.title = 'My photo books — Ciel Africa';
    main.innerHTML = catStrip() + '<section class="pk-my wrap"><div class="pk-head"><span class="eyebrow"><span class="brk">‹</span> Saved on this device</span><h2>My books</h2><p>Books are saved in this browser. Use the same phone or computer to continue.</p></div><div class="pk-my__grid" id="pkMy"><p class="pk-empty">Loading…</p></div></section>';
    var box = document.getElementById('pkMy');
    if (!window.PBStore) { box.innerHTML = '<p class="pk-empty">Storage is not available in this browser.</p>'; return; }
    PBStore.projects().then(function (list) {
      list = list.filter(function (p) { return p.app === 'pbk'; });
      if (!list.length) { box.innerHTML = '<div class="pk-empty"><p>No books yet.</p><button class="btn btn--p" data-pick>Create my photo book ' + ICON.arrow + '</button></div>'; bindCommon(); return; }
      box.innerHTML = list.map(function (p) {
        return '<div class="pk-myb"><a data-go href="' + BASE + '/design?p=' + esc(p.id) + '"><canvas width="275" height="355" data-p="' + esc(p.id) + '"></canvas></a><div><b>' + esc(p.name || 'My photo book') + '</b><span>' + (p.pages || []).length + ' pages · edited ' + new Date(p.updatedAt || Date.now()).toLocaleDateString() + '</span><div class="pk-myb__a"><a data-go class="btn btn--sm btn--dark" href="' + BASE + '/design?p=' + esc(p.id) + '">Open</a><button class="btn btn--sm btn--ghost" data-del="' + esc(p.id) + '">Delete</button></div></div></div>';
      }).join('');
      R.mockMap().then(function (map) {
        list.forEach(function (p) {
          var cv = box.querySelector('canvas[data-p="' + p.id + '"]'); if (!cv || !p.cover) return;
          R.toCanvas(p.cover, 600, { photo: function () { return null; } }).then(function (flat) { var m = R.mock(flat, map); cv.getContext('2d').drawImage(m, 0, 0, cv.width, cv.height); });
        });
      }).catch(function () {});
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
