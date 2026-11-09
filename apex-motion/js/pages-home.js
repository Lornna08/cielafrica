/* APEX MOTION — homepage */
(function () {
  var A = APEX, C = A.config, U = A.u, db = A.db, ui = A.ui, i = U.i, esc = U.esc, H = A.href;
  var heroTimer = null, promoTimer = null, cleanup = [];
  A.cleanup = function () { clearInterval(heroTimer); clearInterval(promoTimer); cleanup.forEach(function (f) { f(); }); cleanup = []; };

  A.route('/', function () {
    var h = C.home, vt = A.vehicleTypes, cur = vt[0].id;
    var trending = function (type) {
      var vs = A.vehicles.filter(function (v) { return v.type === type; });
      return A.products.filter(function (p) { return p.category === 'wheels' && vs.some(function (v) { return A.fits(p, v); }); })
        .sort(function (a, b) { return b.pop - a.pop; }).slice(0, 8);
    };
    var main = U.$('#main');
    main.innerHTML = '<div class="view">' +
      /* HERO */
      '<section class="hero" aria-label="Introduction"><div class="hero__bg"></div>' +
      '<svg class="hero__curve" viewBox="0 0 1000 300" fill="none" aria-hidden="true"><path d="M0 290C260 270 520 190 1000 10" stroke="' + C.theme.accent + '" stroke-width="1.4" opacity=".55"/></svg>' +
      '<div class="wrap"><div class="hero__grid"><div>' +
        '<h1 class="hl" aria-label="' + esc(h.hero.lines.map(function (l) { return l.text; }).join(' ')) + '">' + h.hero.lines.map(function (l) { return '<span class="hl__row" aria-hidden="true"><span class="hl__w">' + esc(l.text) + '</span><span class="hl__lab">' + esc(l.label) + '</span></span>'; }).join('') + '</h1>' +
        '<p class="hero__copy">' + esc(h.hero.copy) + '</p>' +
        '<div class="hero__cta"><a class="btn btn--ink" href="' + H(h.hero.primary.href) + '">' + esc(h.hero.primary.label) + '</a><a class="link" href="' + h.hero.secondary.href + '">' + esc(h.hero.secondary.label) + ' ' + i('down', 16) + '</a></div></div>' +
        '<div class="hero__stage" id="stage">' + vt.map(function (v, k) {
          return '<img class="hero__car' + (k ? '' : ' on') + '" data-vt="' + v.id + '" src="' + v.image + '" alt="' + esc(v.alt) + '" width="2000" height="880"' + (k ? ' loading="lazy"' : ' fetchpriority="high"') + '>' +
            v.specs.map(function (s) { return '<span class="spec' + (k ? '' : ' on') + (s.x > 60 ? ' spec--r' : '') + '" data-vs="' + v.id + '" style="left:' + s.x + '%;top:' + s.y + '%">' + esc(s.t) + '</span>'; }).join('');
        }).join('') + '</div></div>' +
        '<div class="vtypes" role="tablist" aria-label="Choose a vehicle type">' + vt.map(function (v, k) { return '<button class="vt' + (k ? '' : ' on') + '" role="tab" aria-selected="' + !k + '" data-type="' + v.id + '">' + i(v.icon, 34) + '<span>' + esc(v.name) + '</span></button>'; }).join('') + '</div>' +
      '</div></section>' +
      /* TICKER */
      '<div class="ticker" aria-hidden="true"><div class="ticker__t">' + [0, 1].map(function () { return '<div class="ticker__g">' + h.ticker.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div>'; }).join('') + '</div></div>' +
      /* CATEGORIES */
      '<section class="sec" style="padding-bottom:0" aria-labelledby="cath"><div class="wrap"><div class="rail-h"><h2 class="disp" id="cath" style="font-size:clamp(26px,2.6vw,34px)">Shop by category</h2><span class="sp"></span><a class="link" href="' + H('shop') + '">All parts ' + i('arrow', 16) + '</a></div>' +
        '<div class="cats">' + A.categories.map(function (c) { var n = A.products.filter(function (p) { return p.category === c.id; }).length; return '<a class="cat" href="' + H('shop/' + c.id) + '">' + i(c.icon, 30) + '<b>' + esc(c.name) + '</b><span>' + n + ' item' + (n === 1 ? '' : 's') + '</span></a>'; }).join('') + '</div></div></section>' +
      /* PROMISE */
      '<section class="sec promise" id="why" aria-labelledby="whyh"><div class="wrap"><div class="sec-head" data-rv><span class="kicker">' + esc(h.promise.kicker) + '</span><h2 id="whyh">' + h.promise.title.map(esc).join('<br>') + '</h2></div>' +
        '<div class="promise__grid"><div class="promise__col">' + h.promise.points.slice(0, 2).map(pt).join('') + '</div>' +
        '<div class="promise__wheel" data-rv><img id="pwheel" src="img/brand/wheel.webp" alt="Forged monoblock wheel" width="800" height="800" loading="lazy"></div>' +
        '<div class="promise__col">' + h.promise.points.slice(2).map(pt).join('') + '</div></div></div></section>' +
      /* MARQUES / COLLECTIONS */
      '<section class="sec" id="collections" style="padding-top:0" aria-labelledby="mqh"><div class="wrap"><div class="sec-head" data-rv><span class="kicker">Collections</span><h2 id="mqh">Marques we keep<br>on the road</h2></div>' +
        '<div class="marq" id="marq" data-rv>' + A.collections.map(function (c, k) {
          return '<a class="mq' + (k === 0 ? ' on' : '') + '" href="' + H('collections/' + c.id) + '" data-mq><img src="' + c.image + '" alt="" loading="lazy"><span class="mq__v">' + esc(c.name) + '</span>' +
            '<div class="mq__c"><small>' + c.count + ' parts</small><h3>' + esc(c.name) + '</h3><p>' + esc(c.blurb) + '</p><span class="round round--l" aria-hidden="true">' + i('arrow', 18) + '</span></div></a>';
        }).join('') + '</div></div></section>' +
      /* CATALOGUE */
      '<section class="sec" style="padding-top:0" aria-labelledby="cath2"><div class="wrap"><div class="sec-head" data-rv><span class="kicker">New arrivals</span><h2 id="cath2">Explore the catalogue</h2><p>Showing wheels for <b id="forv">' + esc(vt[0].name.toLowerCase()) + '</b> · ratings are sample data</p></div>' +
        '<div class="rail-h"><h3>Trending wheels</h3><a class="link" href="' + H('shop/wheels') + '">View all wheels ' + i('arrow', 16) + '</a><span class="sp"></span><button class="round round--line" data-rail="-1" aria-label="Previous">' + i('arrowL', 18) + '</button><button class="round" data-rail="1" aria-label="Next">' + i('arrow', 18) + '</button></div>' +
        '<div class="rail" id="rail" tabindex="0" aria-label="Trending wheels">' + trending(cur).map(ui.card).join('') + '</div></div></section>' +
      /* CINEMATIC */
      '<section class="cine" id="cine" aria-labelledby="cineh"><img src="' + h.cinematic.image + '" alt="Black saloon surrounded by tyre smoke at night" loading="lazy" id="cineimg"><div class="wrap" style="width:100%"><div class="cine__c"><span class="kicker kicker--acc">' + esc(h.cinematic.kicker) + '</span><h2 id="cineh">' + h.cinematic.title.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</h2><p>' + esc(h.cinematic.copy) + '</p><a class="btn btn--acc" href="' + H(h.cinematic.cta.href) + '">' + esc(h.cinematic.cta.label) + '</a></div></div></section>' +
      /* JOURNAL */
      '<section class="sec" aria-labelledby="jh"><div class="wrap"><div class="sec-head" data-rv><span class="kicker">Journal</span><h2 id="jh">On the bench</h2></div>' +
        '<div class="jgrid">' + A.articles.slice(0, 5).map(function (a, k) { return A.ui.article(a, k === 0 ? 'jc--lead' : ''); }).join('') + '</div>' +
        '<div style="text-align:center;margin-top:30px"><a class="btn btn--line" href="' + H('journal') + '">Read the journal</a></div></div></section>' +
      /* GALLERY */
      '<section class="sec" style="padding-top:0" aria-labelledby="gh"><div class="wrap"><div class="sec-head" data-rv><span class="kicker">Behind the build</span><h2 id="gh">From the garage</h2></div>' +
        '<div class="bento">' + [1, 2, 0, 5, 4, 3, 6].map(function (i) { return A.gallery[i]; }).filter(Boolean).map(function (g) { return '<figure data-rv><img src="' + g.img + '" alt="' + esc(g.alt) + '" loading="lazy"></figure>'; }).join('') + '</div></div></section>' +
      /* PROMO */
      '<section class="sec" style="padding-top:0" aria-roledescription="carousel" aria-label="Offers"><div class="wrap"><div class="promo" id="promo"><div class="promo__c"><div class="promo__slide" id="pslide"></div>' +
        '<div class="promo__ctl"><div class="dots" id="pdots">' + h.promos.map(function (p, k) { return '<button aria-label="Show offer ' + (k + 1) + '" class="' + (k ? '' : 'on') + '"></button>'; }).join('') + '</div><span class="sp" style="flex:1"></span><button class="round round--line" style="border-color:rgba(255,255,255,.2);color:#fff" data-pm="-1" aria-label="Previous offer">' + i('arrowL', 18) + '</button><button class="round round--l" data-pm="1" aria-label="Next offer">' + i('arrow', 18) + '</button></div></div>' +
        '<div class="promo__m">' + h.promos.map(function (p, k) { return '<img src="' + p.image + '" alt="" class="' + (k ? '' : 'on') + '" loading="lazy">'; }).join('') + '</div></div></div></section>' +
    '</div>';
    function pt(p) { return '<div class="promise__pt" data-rv><h3>' + esc(p.t) + '</h3><p>' + esc(p.d) + '</p></div>'; }

    /* hero vehicle switching */
    var setType = function (id) {
      cur = id;
      U.$$('.vt', main).forEach(function (b) { var on = b.getAttribute('data-type') === id; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
      U.$$('.hero__car', main).forEach(function (im) { im.classList.toggle('on', im.getAttribute('data-vt') === id); });
      U.$$('.spec', main).forEach(function (s) { s.classList.remove('on'); });
      setTimeout(function () { U.$$('.spec[data-vs="' + id + '"]', main).forEach(function (s, k) { setTimeout(function () { s.classList.add('on'); }, 120 * k); }); }, 380);
      var t = A.vehicleTypes.filter(function (v) { return v.id === id; })[0];
      U.$('#forv').textContent = t.name.toLowerCase();
      U.$('#rail').innerHTML = trending(id).map(ui.card).join('');
    };
    U.$$('.vt', main).forEach(function (b) { b.onclick = function () { clearInterval(heroTimer); setType(b.getAttribute('data-type')); }; });
    if (!U.reduce) heroTimer = setInterval(function () { var k = vt.map(function (v) { return v.id; }).indexOf(cur); setType(vt[(k + 1) % vt.length].id); }, 6500);

    /* rail arrows */
    U.$$('[data-rail]', main).forEach(function (b) { b.onclick = function () { var r = U.$('#rail'); r.scrollBy({ left: (+b.getAttribute('data-rail')) * r.clientWidth * 0.75, behavior: U.reduce ? 'auto' : 'smooth' }); }; });

    /* marques accordion */
    var mq = U.$$('[data-mq]', main);
    mq.forEach(function (m) { var on = function () { mq.forEach(function (x) { x.classList.toggle('on', x === m); }); }; m.addEventListener('mouseenter', on); m.addEventListener('focus', on); });

    /* promo slider */
    var pk = 0, ps = U.$('#pslide');
    var drawPromo = function (k, anim) {
      var p = h.promos[k];
      var html = '<span class="kicker kicker--acc">' + esc(p.kicker) + '</span><h3>' + esc(p.title) + '</h3><div class="promo__price num">' + U.money(p.price) + '<small>' + esc(p.unit) + '</small></div><p>' + esc(p.copy) + '</p><div style="margin-bottom:26px"><a class="btn btn--acc" href="' + H(p.href) + '">' + esc(p.cta) + '</a></div>';
      if (!anim) { ps.innerHTML = html; } else { ps.classList.add('out'); setTimeout(function () { ps.innerHTML = html; ps.classList.remove('out'); }, 300); }
      U.$$('#pdots button').forEach(function (d, j) { d.classList.toggle('on', j === k); });
      U.$$('.promo__m img', main).forEach(function (im, j) { im.classList.toggle('on', j === k); });
    };
    var goPromo = function (d) { pk = (pk + d + h.promos.length) % h.promos.length; drawPromo(pk, true); };
    drawPromo(0);
    U.$$('[data-pm]', main).forEach(function (b) { b.onclick = function () { clearInterval(promoTimer); goPromo(+b.getAttribute('data-pm')); }; });
    U.$$('#pdots button').forEach(function (d, j) { d.onclick = function () { clearInterval(promoTimer); pk = j; drawPromo(j, true); }; });
    if (!U.reduce) promoTimer = setInterval(function () { goPromo(1); }, 7000);

    /* scroll effects: wheel rotation, cinematic parallax + reveal */
    var wheel = U.$('#pwheel'), cine = U.$('#cine'), cimg = U.$('#cineimg');
    var tick = false;
    var onScroll = function () {
      if (tick) return; tick = true;
      requestAnimationFrame(function () {
        tick = false; var vh = innerHeight;
        var r = wheel.getBoundingClientRect(); var p = (vh - r.top) / (vh + r.height);
        if (!U.reduce) wheel.style.transform = 'rotate(' + (p * 220 - 60).toFixed(1) + 'deg) scale(' + (0.86 + Math.min(1, Math.max(0, p)) * 0.18).toFixed(3) + ')';
        var c = cine.getBoundingClientRect();
        if (c.top < vh * 0.7) cine.classList.add('in');
        if (!U.reduce) { var q = Math.max(-1, Math.min(1, (c.top + c.height / 2 - vh / 2) / vh)); cimg.style.transform = 'translate3d(0,' + (q * -40).toFixed(1) + 'px,0)'; }
      });
    };
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
    cleanup.push(function () { removeEventListener('scroll', onScroll); });
    if (U.reduce) cine.classList.add('in');

    ui.setNav('', false); ui.reveal(main);
    ui.meta('', C.store.description);
    ui.ld({ '@context': 'https://schema.org', '@type': 'Store', name: C.store.name, description: C.store.description });
  });

  A.ui.article = function (a, cls) {
    return '<a class="jc ' + (cls || '') + '" href="' + H('journal/' + a.slug) + '" data-rv><div class="jc__m"><img src="' + a.image + '" alt="" loading="lazy"></div><div class="jc__meta"><span>' + U.date(a.date) + '</span><b>' + esc(a.cat) + '</b><span>' + a.read + ' min read</span></div><h3>' + esc(a.title) + '</h3><p>' + esc(a.excerpt) + '</p><span class="link">Read more ' + i('arrow', 15) + '</span></a>';
  };
})();
