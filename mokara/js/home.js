/* ==========================================================================
   MOKARA — home: the product showcase (signature hero), collection, origins,
   bean to cup, find your coffee, brewing, story and newsletter.
   ========================================================================== */
(function () {
  'use strict';
  var M = window.MOKARA, C = M.config, U = M.u, db = M.db, esc = U.esc, P = M.products;

  /* =============================== hero =============================== */
  function heroHtml() {
    return '<section class="hx" id="hx" aria-roledescription="carousel" aria-label="Featured coffees">' +
      '<div class="hx__bg" aria-hidden="true"></div><div class="hx__ghost" aria-hidden="true">MOKARA</div>' +
      '<div class="hx__stage"><div class="hx__media" id="hxMedia">' + P.map(function (p, i) {
        return '<figure class="hx__fig' + (i === 0 ? ' on' : '') + '" data-i="' + i + '">' + (i === 0 ? U.pimg(p, 'hero', { eager: true, sizes: '(max-width: 860px) 92vw, 50vw' }) : '<img data-src="' + U.render(p, 'hero', 600) + '" data-srcset="' + U.renderSet(p, 'hero', [600, 1200]) + '" sizes="(max-width: 860px) 92vw, 50vw" alt="' + esc(p.title + (p.pack === 'tin' ? ', 250 g tin' : ', 250 g bag')) + '" width="1200" height="1300" decoding="async">') + '</figure>';
      }).join('') + '</div>' +
      '<div class="hx__info" id="hxInfo" aria-live="polite"></div></div>' +
      '<div class="hx__bar"><div class="hx__thumbs" role="tablist" aria-label="Choose a coffee">' + P.map(function (p, i) {
        return '<button type="button" role="tab" class="th" data-go="' + i + '" aria-selected="' + (i === 0) + '" aria-controls="hxInfo" tabindex="' + (i === 0 ? 0 : -1) + '" style="--tac:' + p.accent + ';--tbg:' + p.bg + '"><span class="th__n">' + p.no + '</span><span class="th__img"><img src="' + U.render(p, 'front', 480) + '" alt="" width="96" height="120" loading="' + (i < 4 ? 'eager' : 'lazy') + '" decoding="async"></span><span class="th__t">' + esc(p.line[0]) + '<br>' + esc(p.line[1]) + '</span><i class="th__pg"></i></button>';
      }).join('') + '</div>' +
      '<div class="hx__ctrl"><span class="hx__count" id="hxCount">01 / 0' + P.length + '</span><button type="button" class="ib ib--ring" data-step="-1" aria-label="Previous coffee">' + U.i('left') + '</button><button type="button" class="ib ib--ring" data-step="1" aria-label="Next coffee">' + U.i('right') + '</button><button type="button" class="hx__auto" id="hxAuto" aria-pressed="true">' + U.i('pause', 14) + '<span>Auto</span></button></div></div>' +
      '</section>';
  }
  function infoHtml(p) {
    var sizes = C.sizes.map(function (s, i) { return '<button type="button" class="chip' + (i === 0 ? ' on' : '') + '" role="radio" aria-checked="' + (i === 0) + '" data-size="' + s.id + '">' + s.label + '</button>'; }).join('');
    return '<p class="hx__price"><b id="hxPrice">' + U.money(p.price) + '</b> <span>/ 250 g</span></p>' +
      '<h1 class="hx__name"><span>' + esc(p.line[0]) + '</span> <span>' + esc(p.line[1]) + '</span></h1>' +
      '<p class="hx__kick">N° ' + p.no + ' · ' + (p.blend ? 'House blend' : 'Single origin') + ' · ' + esc(p.roast) + '</p>' +
      '<div class="hx__card glass"><div class="hx__rate"><b>' + p.rating.toFixed(1) + '</b>' + U.stars(p.rating) + '<a href="' + M.href('coffee/' + p.id) + '#reviews">' + p.reviews.length + ' sample reviews</a></div>' +
      '<dl class="hx__facts"><div><dt>Origin</dt><dd>' + esc(p.blend ? p.country : p.region + ', ' + p.country) + '</dd></div><div><dt>Roast</dt><dd>' + esc(p.roast.replace(' roast', '')) + '</dd></div><div><dt>Process</dt><dd>' + esc(p.process) + '</dd></div><div><dt>Format</dt><dd>Whole bean / ground</dd></div></dl>' +
      '<p class="hx__notes">' + p.notes.map(esc).join(' · ') + '</p><p class="hx__desc">' + esc(p.short) + '</p>' +
      '<div class="hx__sizes" role="radiogroup" aria-label="Size">' + sizes + '</div>' +
      '<div class="hx__acts"><button type="button" class="btn btn--ac" id="hxAdd">Add to cart — <span id="hxAddP">' + U.money(p.price) + '</span></button><a class="lnk" href="' + M.href('coffee/' + p.id) + '">Details' + U.i('arrow', 16) + '</a></div></div>';
  }
  function initHero(root) {
    var hx = U.$('#hx', root), info = U.$('#hxInfo', root), figs = U.$$('.hx__fig', root), ths = U.$$('.th', root);
    var cur = 0, size = '250g', busy = false, auto = !U.reduce, timer = null, hover = false, visible = true, DUR = 7000;
    function apply(i) {
      var p = P[i];
      hx.style.setProperty('--bg', p.bg); hx.style.setProperty('--ac', p.accent); hx.style.setProperty('--ink', p.ink);
      hx.dataset.side = p.side; hx.classList.toggle('hx--dark', !!p.dark); document.body.classList.toggle('hd-dark', !!p.dark && scrollY < 40);
      info.innerHTML = infoHtml(p); size = '250g';
      ths.forEach(function (t, k) { t.setAttribute('aria-selected', k === i); t.tabIndex = k === i ? 0 : -1; t.classList.toggle('on', k === i); });
      U.$('#hxCount').textContent = p.no + ' / 0' + P.length;
    }
    function show(i, dir) {
      i = (i + P.length) % P.length; if (i === cur || busy) return;
      busy = true; var prev = cur; cur = i;
      hx.classList.add('out'); hx.style.setProperty('--dir', dir || (i > prev ? 1 : -1));
      lazy(figs[i]);
      setTimeout(function () {
        figs[prev].classList.remove('on'); figs[i].classList.add('on');
        apply(i); hx.classList.remove('out'); busy = false; restart();
      }, U.reduce ? 0 : 420);
    }
    function lazy(f) { var im = f && f.querySelector('img[data-src]'); if (!im) return; im.srcset = im.dataset.srcset; im.src = im.dataset.src; im.removeAttribute('data-src'); im.removeAttribute('data-srcset'); }
    function restart() {
      clearTimeout(timer); ths.forEach(function (t) { t.classList.remove('run'); });
      if (!auto || hover || !visible || document.hidden) return;
      var t = ths[cur]; void t.offsetWidth; t.style.setProperty('--dur', DUR + 'ms'); t.classList.add('run');
      timer = setTimeout(function () { show(cur + 1, 1); }, DUR);
    }
    function setAuto(on) { auto = on; var b = U.$('#hxAuto'); b.setAttribute('aria-pressed', on); b.innerHTML = U.i(on ? 'pause' : 'play', 14) + '<span>Auto</span>'; b.setAttribute('aria-label', on ? 'Pause automatic rotation' : 'Start automatic rotation'); restart(); }
    apply(0); setAuto(auto);
    hx.addEventListener('click', function (e) {
      var g = e.target.closest('[data-go]'); if (g) { show(+g.dataset.go); return; }
      var s = e.target.closest('[data-step]'); if (s) { show(cur + (+s.dataset.step), +s.dataset.step); return; }
      if (e.target.closest('#hxAuto')) { setAuto(!auto); return; }
      var z = e.target.closest('[data-size]'); if (z) { size = z.dataset.size; U.$$('[data-size]', info).forEach(function (c) { var on = c === z; c.classList.toggle('on', on); c.setAttribute('aria-checked', on); }); var pr = M.priceFor(P[cur], size); U.$('#hxAddP').textContent = U.money(pr); U.$('#hxPrice').textContent = U.money(pr); U.$('.hx__price span', info).textContent = '/ ' + M.sizeById[size].label; return; }
      if (e.target.closest('#hxAdd')) { var r = db.add(P[cur].id, { size: size, format: 'whole' }); if (r.ok) { U.added(P[cur], r.line); var b = U.$('#hxAdd'); b.classList.add('ok'); setTimeout(function () { b.classList.remove('ok'); }, 1200); } }
    });
    U.$('.hx__thumbs', hx).addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return; e.preventDefault(); show(cur + d, d); setTimeout(function () { ths[cur].focus(); }, U.reduce ? 0 : 440);
    });
    hx.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { hover = true; restart(); } });
    hx.addEventListener('pointerleave', function () { hover = false; restart(); });
    hx.addEventListener('focusin', function () { hover = true; restart(); });
    hx.addEventListener('focusout', function () { hover = false; restart(); });
    document.addEventListener('visibilitychange', restart);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; restart(); }, { threshold: 0.35 }).observe(hx);
    // swipe
    var sx = null, sy = 0;
    hx.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    hx.addEventListener('touchend', function (e) { if (sx == null) return; var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3 && !e.target.closest('.hx__thumbs')) show(cur + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1); sx = null; });
    // parallax on the product and ghost word
    if (!U.reduce && matchMedia('(hover: hover)').matches) hx.addEventListener('pointermove', function (e) { var r = hx.getBoundingClientRect(); hx.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3)); hx.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3)); });
    U.beans(hx, 7, { seed: 7, min: 20, max: 44, avoid: [28, 72], kind: 'medium', kinds: 3 });
    // warm the other renders once the page has loaded
    var warm = function () { figs.forEach(function (f, k) { if (k) setTimeout(function () { lazy(f); }, k * 250); }); };
    if (document.readyState === 'complete') setTimeout(warm, 600); else window.addEventListener('load', function () { setTimeout(warm, 600); }, { once: true });
    M.onLeave = function () { clearTimeout(timer); M.hxDark = null; document.body.classList.remove('hd-dark'); };
    M.hxDark = function () { return !!P[cur].dark; };
    if (!M.hxScroll) { M.hxScroll = true; window.addEventListener('scroll', function () { if (U.$('#hx') && M.hxDark) document.body.classList.toggle('hd-dark', M.hxDark() && scrollY < 40); }, { passive: true }); }
  }

  /* =============================== sections =============================== */
  function card(p) {
    return '<article class="pc" data-rv style="--pbg:' + p.bg + ';--pac:' + p.accent + '"><a class="pc__img' + (p.dark ? ' pc__img--dark' : '') + '" href="' + M.href('coffee/' + p.id) + '" aria-label="' + esc(p.title) + '">' + U.pimg(p, 'front', { sizes: '(max-width: 640px) 46vw, (max-width: 1100px) 30vw, 22vw' }) + '<span class="pc__no">N° ' + p.no + '</span></a>' +
      '<div class="pc__b"><p class="pc__o">' + esc(p.blend ? 'House blend' : p.country) + ' · ' + esc(p.roast.replace(' roast', '')) + '</p><h3><a href="' + M.href('coffee/' + p.id) + '">' + esc(p.title) + '</a></h3><p class="pc__n">' + p.notes.slice(0, 3).map(esc).join(' · ') + '</p>' +
      '<div class="pc__f"><b>' + U.money(p.price) + '<small> / 250 g</small></b><button type="button" class="btn btn--sm btn--d" data-add="' + p.id + '" aria-label="Add ' + esc(p.title) + ', 250 g whole bean, to cart">' + U.i('plus', 16) + '<span>Add</span></button></div></div></article>';
  }
  M.card = card;
  function collection() {
    return '<section class="sec" id="collection"><div class="wrap"><div class="sh" data-rv><p class="ey">Our coffee collection</p><h2>Six coffees. <em>Six ways to start the day.</em></h2><p>From floral and bright to deep and chocolatey — each roasted to its own profile and shipped within days of roasting.</p></div>' +
      '<div class="pgrid">' + P.map(card).join('') + '</div></div></section>';
  }
  function origins() {
    return '<section class="sec sec--paper" id="origins"><div class="wrap"><div class="sh sh--row" data-rv><div><p class="ey">Discover coffee origins</p><h2>Where it grows <em>shapes how it tastes.</em></h2></div><p>Altitude, soil, rain and the hands that pick it — every origin has a signature. These are the six regions we buy from.</p></div>' +
      '<div class="og">' + M.origins.map(function (o, i) {
        var p = P.filter(function (x) { return x.origin === o.id; })[0];
        return '<article class="og__i" data-rv style="--d:' + (i % 3) * 80 + 'ms"><div class="og__img">' + U.photo(o.id, { alt: 'Coffee country in ' + o.name, sizes: '(max-width: 760px) 92vw, 30vw', widths: [480, 760, 1100] }) + '<span class="og__c">' + U.credit(o.id) + '</span></div>' +
          '<div class="og__b"><p class="og__r">' + U.i('pin', 14) + esc(o.region) + ' · ' + esc(o.altitude) + '</p><h3>' + esc(o.name) + '</h3><p>' + esc(o.text) + '</p><p class="og__t"><span>In the cup</span>' + esc(o.taste) + '</p>' +
          (p ? '<a class="lnk" href="' + M.href('coffee/' + p.id) + '">Shop ' + esc(p.title) + U.i('arrow', 16) + '</a>' : '<span class="og__soon">Seasonal lot · roasted when it arrives</span>') + '</div></article>';
      }).join('') + '</div></div></section>';
  }
  function process() {
    return '<section class="sec sec--dark" id="process"><div class="wrap"><div class="sh sh--light" data-rv><p class="ey">From bean to cup</p><h2>Six steps, <em>months of care.</em></h2><p>A cup of coffee is the last moment of a long journey. Here is what happens before it reaches you.</p></div>' +
      '<ol class="bc">' + M.steps.map(function (s, i) {
        return '<li class="bc__i" data-rv style="--d:' + (i % 3) * 90 + 'ms"><div class="bc__img">' + U.photo(s.id, { alt: s.title, sizes: '(max-width: 760px) 92vw, 31vw', widths: [480, 760, 1000] }) + '</div><div class="bc__b"><span class="bc__n">' + s.n + '</span><h3>' + esc(s.title) + '</h3><p>' + esc(s.text) + '</p><span class="bc__c">' + U.credit(s.id) + '</span></div></li>';
      }).join('') + '</ol></div></section>';
  }
  /* ----- find your perfect coffee ----- */
  var Q = [
    { k: 'roast', t: 'How do you like your roast?', o: [['light', 'Light'], ['medium', 'Medium'], ['dark', 'Dark']] },
    { k: 'flavour', t: 'Which flavours do you love?', multi: true, o: [['fruity', 'Fruity'], ['floral', 'Floral'], ['nutty', 'Nutty'], ['chocolatey', 'Chocolatey'], ['spicy', 'Spicy']] },
    { k: 'method', t: 'How do you brew?', o: [['espresso', 'Espresso'], ['filter', 'Filter'], ['press', 'French press'], ['pourover', 'Pour-over']] },
    { k: 'format', t: 'Whole bean or ground?', o: [['whole', 'Whole bean'], ['ground', 'Ground']] }
  ];
  function roastBand(p) { return p.roastLevel <= 2 ? 'light' : p.roastLevel === 3 ? 'medium' : 'dark'; }
  function score(p, a) {
    var s = 0, max = 0, why = [];
    if (a.roast) { max += 3; if (roastBand(p) === a.roast) { s += 3; why.push(p.roast); } else if (Math.abs({ light: 1.5, medium: 3, dark: 4.5 }[a.roast] - p.roastLevel) <= 1.5) s += 1; }
    if (a.flavour && a.flavour.length) { max += 3 * a.flavour.length; a.flavour.forEach(function (f) { if (p.flavours.indexOf(f) >= 0) { s += 3; why.push(f.charAt(0).toUpperCase() + f.slice(1)); } }); }
    if (a.method) { max += 2; if (p.methods.indexOf(a.method) >= 0) { s += 2; why.push('Great for ' + { espresso: 'espresso', filter: 'filter', press: 'the French press', pourover: 'pour-over' }[a.method]); } }
    return { p: p, pct: max ? Math.round(s / max * 100) : 0, why: why };
  }
  function discover() {
    return '<section class="sec" id="discover"><div class="wrap dv"><div class="dv__q" data-rv><p class="ey">Find your perfect coffee</p><h2>Tell us how you drink it. <em>We’ll pour the rest.</em></h2>' +
      Q.map(function (q) { return '<fieldset class="dv__g"><legend>' + q.t + (q.multi ? ' <small>Choose any</small>' : '') + '</legend><div class="chips">' + q.o.map(function (o) { return '<button type="button" class="chip" data-q="' + q.k + '" data-v="' + o[0] + '" aria-pressed="false">' + o[1] + '</button>'; }).join('') + '</div></fieldset>'; }).join('') +
      '<button type="button" class="lnk dv__reset" id="dvReset">Start over</button></div><div class="dv__r" id="dvR" aria-live="polite"></div></div></section>';
  }
  function initDiscover(root) {
    var a = { flavour: [] }, el = U.$('#dvR', root); if (!el) return;
    function draw() {
      var any = a.roast || a.method || a.flavour.length, res = P.map(function (p) { return score(p, a); }).sort(function (x, y) { return y.pct - x.pct || x.p.order - y.p.order; });
      var top = res.slice(0, 3), fmt = a.format || 'whole', grind = a.method === 'espresso' ? 'espresso' : a.method === 'press' ? 'press' : 'filter';
      el.innerHTML = '<p class="dv__h">' + (any ? 'Your best matches' : 'Pick a few answers — matches update as you go.') + '</p>' + top.map(function (r, i) {
        var p = r.p;
        return '<article class="dvm' + (i === 0 && any ? ' dvm--top' : '') + '" style="--pbg:' + p.bg + ';--pac:' + p.accent + '"><a class="dvm__img' + (p.dark ? ' dark' : '') + '" href="' + M.href('coffee/' + p.id) + '">' + U.pimg(p, 'front', { sizes: '120px' }) + '</a><div class="dvm__b">' + (any ? '<span class="dvm__pct">' + r.pct + '% match</span>' : '') + '<h3><a href="' + M.href('coffee/' + p.id) + '">' + esc(p.title) + '</a></h3><p>' + p.notes.slice(0, 3).map(esc).join(' · ') + '</p>' + (r.why.length ? '<p class="dvm__why">' + r.why.slice(0, 3).map(esc).join(' · ') + '</p>' : '') +
          '<div class="dvm__f"><b>' + U.money(p.price) + '</b><button type="button" class="btn btn--sm btn--d" data-add="' + p.id + '" data-format="' + fmt + '" data-grind="' + grind + '">Add' + (fmt === 'ground' ? ' · ground' : '') + '</button></div></div></article>';
      }).join('');
    }
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-q]');
      if (b) {
        var k = b.dataset.q, v = b.dataset.v;
        if (k === 'flavour') { var i = a.flavour.indexOf(v); if (i >= 0) a.flavour.splice(i, 1); else a.flavour.push(v); }
        else a[k] = a[k] === v ? null : v;
        U.$$('[data-q="' + k + '"]', root).forEach(function (c) { var on = k === 'flavour' ? a.flavour.indexOf(c.dataset.v) >= 0 : a[k] === c.dataset.v; c.setAttribute('aria-pressed', on); c.classList.toggle('on', on); });
        draw(); return;
      }
      if (e.target.closest('#dvReset')) { a = { flavour: [] }; U.$$('[data-q]', root).forEach(function (c) { c.setAttribute('aria-pressed', 'false'); c.classList.remove('on'); }); draw(); }
    });
    draw();
  }
  /* ----- brewing ----- */
  function brew() {
    return '<section class="sec sec--paper" id="brew"><div class="wrap"><div class="sh sh--row" data-rv><div><p class="ey">The brewing experience</p><h2>Five methods. <em>One great cup.</em></h2></div><p>Simple recipes we use every day. Weigh your coffee and water — it’s the single biggest step towards a better cup.</p></div>' +
      '<div class="bw" data-rv><div class="bw__tabs" role="tablist" aria-label="Brew methods">' + M.methods.map(function (m, i) { return '<button type="button" role="tab" id="bwt-' + m.id + '" aria-controls="bwp" aria-selected="' + (i === 0) + '" tabindex="' + (i === 0 ? 0 : -1) + '" data-bw="' + m.id + '"><span>0' + (i + 1) + '</span>' + esc(m.name) + '</button>'; }).join('') + '</div><div class="bw__p" id="bwp" role="tabpanel"></div></div></div></section>';
  }
  function brewPanel(m) {
    var best = P.filter(function (p) { return (M.methodBest[m.id] || []).some(function (k) { return p.methods.indexOf(k) >= 0; }); }).slice(0, 3);
    return '<div class="bw__img">' + U.photo(m.id, { alt: m.name, sizes: '(max-width: 860px) 92vw, 44vw', widths: [600, 900, 1300] }) + '<span class="bw__c">' + U.credit(m.id) + '</span></div>' +
      '<div class="bw__b"><h3>' + esc(m.name) + '</h3><dl class="bw__spec"><div><dt>Coffee</dt><dd>' + m.dose + '</dd></div><div><dt>Water</dt><dd>' + m.water + '</dd></div><div><dt>Ratio</dt><dd>' + m.ratio + '</dd></div><div><dt>Grind</dt><dd>' + m.grind + '</dd></div><div><dt>Temp</dt><dd>' + m.temp + '</dd></div><div><dt>Time</dt><dd>' + m.time + '</dd></div></dl>' +
      '<ol class="bw__steps">' + m.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' +
      '<p class="bw__best">Try it with</p><div class="bw__picks">' + best.map(function (p) { return '<a href="' + M.href('coffee/' + p.id) + '" style="--pbg:' + p.bg + '"><span class="' + (p.dark ? 'dark' : '') + '"><img src="' + U.render(p, 'front', 480) + '" alt="" loading="lazy"></span>' + esc(p.title) + '</a>'; }).join('') + '</div></div>';
  }
  function initBrew(root) {
    var tabs = U.$$('[data-bw]', root), panel = U.$('#bwp', root); if (!panel) return;
    function sel(id, focus) { var m = M.methods.filter(function (x) { return x.id === id; })[0]; tabs.forEach(function (t) { var on = t.dataset.bw === id; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; if (on && focus) t.focus(); }); panel.setAttribute('aria-labelledby', 'bwt-' + id); panel.classList.remove('in2'); void panel.offsetWidth; panel.innerHTML = brewPanel(m); panel.classList.add('in2'); }
    root.addEventListener('click', function (e) { var t = e.target.closest('[data-bw]'); if (t) sel(t.dataset.bw); });
    U.$('.bw__tabs', root).addEventListener('keydown', function (e) { var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return; e.preventDefault(); var i = tabs.findIndex(function (t) { return t.getAttribute('aria-selected') === 'true'; }); sel(tabs[(i + d + tabs.length) % tabs.length].dataset.bw, true); });
    sel(M.methods[0].id);
  }
  function story() {
    return '<section class="sec st" id="story"><div class="wrap st__g"><div class="st__media" data-rv><div class="st__a"><img src="img/p/pile-dark-1200.webp" srcset="img/p/pile-dark-700.webp 700w, img/p/pile-dark-1200.webp 1200w" sizes="(max-width: 860px) 92vw, 46vw" alt="Freshly roasted coffee beans" loading="lazy" width="1400" height="1000"></div><div class="st__b">' + U.photo('hands', { alt: 'Hands holding green coffee beans', sizes: '(max-width: 860px) 50vw, 20vw', widths: [400, 700] }) + '</div></div>' +
      '<div class="st__t" data-rv><p class="ey">Our story</p><h2>We roast for <em>the moment you open the bag.</em></h2><p>MOKARA began with a simple frustration: great coffee, stale by the time it reached us. So we buy fewer coffees, buy them well, and roast them only after you order.</p>' +
      '<ul class="pillars"><li>' + U.i('leaf', 22) + '<div><b>Sourced with care</b><span>We buy traceable lots from cooperatives and family farms and pay above market for quality.</span></div></li><li>' + U.i('flame', 22) + '<div><b>Roasted in small batches</b><span>Each coffee has its own profile, adjusted by taste every roast day.</span></div></li><li>' + U.i('clock', 22) + '<div><b>Fresh, always</b><span>' + esc(C.roastDays) + '</span></div></li></ul>' +
      '<p class="st__c">' + U.credit('hands') + '</p></div></div></section>';
  }
  function newsletter() {
    var s = db.state().news;
    return '<section class="nl" id="newsletter"><div class="wrap nl__in" data-rv><p class="ey">The roast list</p><h2>Fresh coffee news, <em>never stale.</em></h2><p>New lots, roast-day reminders and brewing tips — one short email a fortnight.</p>' +
      (s ? '<p class="nl__ok">' + U.i('check') + ' You’re on the list as ' + esc(s.email) + '.</p>' :
        '<form class="nl__f" id="nlF" novalidate><label class="sr" for="nlE">Email address</label><input id="nlE" type="email" autocomplete="email" placeholder="you@example.com" required><button class="btn btn--ac" type="submit">Subscribe</button></form><p class="nl__n" id="nlN">' + (C.newsletter.endpoint ? 'We’ll only use your email for this newsletter.' : 'Template: sign-ups are kept in this browser until you connect an email provider in the config.') + '</p>') + '</div></section>';
  }
  function initNews(root) {
    var f = U.$('#nlF', root); if (!f) return;
    U.beans(U.$('#newsletter', root), 7, { seed: 3, min: 24, max: 50, avoid: [25, 75] });
    f.addEventListener('submit', function (e) {
      e.preventDefault(); var inp = U.$('#nlE', f), v = inp.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { inp.setAttribute('aria-invalid', 'true'); U.$('#nlN', root).textContent = 'Please enter a valid email address.'; inp.focus(); return; }
      var done = function () { db.subscribe(v); var n = U.$('#newsletter', root); n.outerHTML = newsletter(); U.reveal(root); U.$('#newsletter .nl__in').classList.add('in'); };
      if (C.newsletter.endpoint) fetch(C.newsletter.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ email: v }) }).then(function (r) { if (!r.ok) throw 0; done(); }).catch(function () { U.$('#nlN', root).textContent = 'We couldn’t subscribe you just now. Please try again.'; });
      else done();
    });
  }

  /* =============================== intro =============================== */
  function intro() {
    var seen; try { seen = sessionStorage.getItem('mk:intro'); sessionStorage.setItem('mk:intro', '1'); } catch (e) { seen = '1'; }
    if (seen || U.reduce || /nointro/.test(location.search)) return;
    var d = document.createElement('div'); d.className = 'intro'; d.setAttribute('aria-hidden', 'true');
    d.innerHTML = '<div class="intro__in"><span>MOKARA</span><i></i><small>Specialty coffee roasters</small></div>';
    document.body.appendChild(d);
    setTimeout(function () { d.classList.add('go'); }, 950);
    setTimeout(function () { d.remove(); }, 1900);
  }

  /* =============================== route =============================== */
  function home(m) {
    var app = U.$('#app'), target = m && m[1];
    M.setTitle(target ? { origins: 'Coffee origins', brew: 'Brew guides', story: 'Our story', discover: 'Find your coffee', process: 'From bean to cup' }[target] : '');
    if (!U.$('#hx') || M.homeBuilt !== true) {
      app.innerHTML = heroHtml() + collection() + origins() + process() + discover() + brew() + story() + newsletter();
      initHero(app); initDiscover(U.$('#discover', app)); initBrew(U.$('#brew', app)); initNews(app);
      if (!target) intro();
    }
    if (target) {
      M.pendingScroll = true;
      setTimeout(function () { var s = document.getElementById(target); if (s) window.scrollTo({ top: s.getBoundingClientRect().top + scrollY - 70, behavior: 'auto' }); M.pendingScroll = false; }, 30);
    }
  }
  M.route(/^(?:(origins|brew|story|discover|process))?$/, home);
})();
