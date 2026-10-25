/* ============================================================
   WANJA MWANGI — portfolio behaviour
   Reads content from data.js. No frameworks.
   ============================================================ */
(function () {
  'use strict';
  var W = window.WANJA, P = W.PHOTOS, C = W.CONTACT;
  var IMG = '/wanja/assets/img/';
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var ICON = {
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6"/></svg>'
  };
  var CAT = {}; W.CATEGORIES.forEach(function (c) { CAT[c.id] = c; });

  /* ---------- images ---------- */
  // sizes: a CSS sizes string for the layout slot
  function img(slug, o) {
    o = o || {}; var p = P[slug]; if (!p) return '';
    var set = p.s.map(function (w) { return IMG + slug + '-' + w + '.webp ' + w + 'w'; }).join(', ');
    var mid = p.s.filter(function (w) { return w <= 800; }).pop() || p.s[0];
    return '<img src="' + IMG + slug + '-' + mid + '.webp" srcset="' + set + '" sizes="' + (o.sizes || '(max-width: 640px) 100vw, 50vw') + '" width="' + p.w + '" height="' + p.h + '" alt="' + esc(p.alt) + '"' +
      (o.eager ? ' loading="eager" fetchpriority="high"' : ' loading="lazy"') + ' decoding="async"' + (o.cls ? ' class="' + o.cls + '"' : '') + '>';
  }
  W.img = img;
  // figure that opens the lightbox
  function fig(slug, group, idx, o) {
    o = o || {}; var p = P[slug], c = CAT[p.c];
    var style = '--c:' + (o.c || '1 / -1') + ';--m:' + (o.m || '1 / -1') + ';--mt:' + (o.mt || '0') + ';--mmt:' + (o.mmt || '0');
    return '<figure class="ph gi reveal" style="' + style + '"><button type="button" class="ph__btn" data-lb="' + group + '" data-i="' + idx + '" aria-label="View larger: ' + esc(p.alt) + '">' + img(slug, { sizes: o.sizes }) + '</button>' +
      (o.cap === false ? '' : '<figcaption><span><b>' + esc(o.cap || (c ? c.short : '')) + '</b></span><span class="num">' + esc(o.n || '') + '</span></figcaption>') + '</figure>';
  }
  function guard(root) {
    $$('img', root).forEach(function (im) {
      if (im.dataset.g) return; im.dataset.g = 1;
      im.addEventListener('error', function () {
        // fall back to the original upload once, then show the description
        if (!im.dataset.f) { var slug = (im.getAttribute('src') || '').split('/').pop().replace(/-\d+\.webp$/, ''); im.dataset.f = 1; im.removeAttribute('srcset'); var p = P[slug]; if (p) { im.src = IMG + 'original/' + slug + '.jpg'; return; } }
        im.classList.add('is-broken');
      });
    });
  }

  /* ---------- lightbox ---------- */
  var groups = {};
  function setGroup(name, slugs, label) { groups[name] = { slugs: slugs, label: label }; }
  var lb, lbImg, lbState = null, lastFocus = null;
  function buildLb() {
    lb = document.createElement('div');
    lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Image viewer');
    lb.innerHTML = '<div class="lb__top"><span class="lbl" data-lb-label></span><button type="button" class="lb__x" data-lb-close>Close ' + ICON.x + '</button></div>' +
      '<div class="lb__stage"><img class="lb__img" alt="" draggable="false"><button type="button" class="lb__nav lb__prev" data-lb-prev aria-label="Previous image">' + ICON.left + '</button><button type="button" class="lb__nav lb__next" data-lb-next aria-label="Next image">' + ICON.arrow + '</button></div>' +
      '<div class="lb__bot"><p class="lb__cap" data-lb-cap></p><span class="lb__count" aria-live="polite" data-lb-count></span></div>';
    document.body.appendChild(lb);
    lbImg = $('.lb__img', lb);
    lb.addEventListener('click', function (e) {
      if (e.target.closest('[data-lb-close]')) return closeLb();
      if (e.target.closest('[data-lb-prev]')) return step(-1);
      if (e.target.closest('[data-lb-next]')) return step(1);
      if (e.target === lb || e.target.classList.contains('lb__stage')) closeLb();
    });
    var sx = null, sy = null;
    lb.addEventListener('touchstart', function (e) { var t = e.touches[0]; sx = t.clientX; sy = t.clientY; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (sx == null) return; var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy; sx = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
      else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) closeLb();
    });
  }
  function show(i, fromEl) {
    var g = groups[lbState.group], n = g.slugs.length; i = (i + n) % n; lbState.i = i;
    var slug = g.slugs[i], p = P[slug];
    lbImg.removeAttribute('srcset');
    lbImg.src = IMG + slug + '-' + p.s[p.s.length - 1] + '.webp';
    lbImg.srcset = p.s.map(function (w) { return IMG + slug + '-' + w + '.webp ' + w + 'w'; }).join(', ');
    lbImg.sizes = '(max-width: 640px) 100vw, 80vw';
    lbImg.alt = p.alt; lbImg.width = p.w; lbImg.height = p.h;
    $('[data-lb-cap]', lb).textContent = p.alt;
    $('[data-lb-count]', lb).innerHTML = String(i + 1).padStart(2, '0') + ' <i>/ ' + String(n).padStart(2, '0') + '</i>';
    $('[data-lb-label]', lb).textContent = g.label || (CAT[p.c] ? CAT[p.c].num + ' · ' + CAT[p.c].name : 'Wanja Mwangi');
    // warm the neighbours
    [1, -1].forEach(function (d) { var s = g.slugs[(i + d + n) % n], q = P[s]; var im = new Image(); im.src = IMG + s + '-' + q.s[Math.min(q.s.length - 1, 2)] + '.webp'; });
    if (fromEl && !RM) fly(fromEl);
  }
  function fly(fromEl) {
    // image-led transition: grow the clicked photograph into place
    var r = fromEl.getBoundingClientRect();
    requestAnimationFrame(function () {
      var f = lbImg.getBoundingClientRect(); if (!f.width) return;
      lbImg.style.transition = 'none'; lbImg.style.transformOrigin = '0 0';
      lbImg.style.transform = 'translate(' + (r.left - f.left) + 'px,' + (r.top - f.top) + 'px) scale(' + (r.width / f.width) + ',' + (r.height / f.height) + ')';
      lbImg.getBoundingClientRect();
      lbImg.style.transition = 'transform .6s cubic-bezier(.2,.7,.1,1)'; lbImg.style.transform = '';
    });
  }
  function openLb(group, i, fromBtn) {
    if (!groups[group]) return;
    if (!lb) buildLb();
    lastFocus = fromBtn || document.activeElement;
    lbState = { group: group, i: i };
    document.documentElement.style.overflow = 'hidden';
    lb.classList.add('is-open');
    show(i, fromBtn ? $('img', fromBtn) : null);
    $('[data-lb-close]', lb).focus({ preventScroll: true });
    document.addEventListener('keydown', lbKeys);
  }
  function closeLb() {
    if (!lb || !lb.classList.contains('is-open')) return;
    lb.classList.remove('is-open'); document.documentElement.style.overflow = '';
    document.removeEventListener('keydown', lbKeys);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  function step(d) { if (lbState) show(lbState.i + d); }
  function lbKeys(e) {
    if (e.key === 'Escape') { e.preventDefault(); closeLb(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    else if (e.key === 'Tab') trap(e, lb);
  }
  function trap(e, box) {
    var f = $$('button,a[href],input,select,textarea', box).filter(function (x) { return x.offsetParent !== null; });
    if (!f.length) return; var a = f[0], z = f[f.length - 1];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
    else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-lb]'); if (!b) return;
    openLb(b.getAttribute('data-lb'), +b.getAttribute('data-i'), b);
  });

  /* ---------- header + menu ---------- */
  function shell() {
    var hdr = $('.hdr'); if (!hdr) return;
    var solidAt = document.body.classList.contains('home') ? 24 : 8, lastY = 0;
    function onScroll() {
      var y = window.scrollY;
      hdr.classList.toggle('is-solid', y > solidAt);
      if (!$('.menu.is-open')) hdr.classList.toggle('is-hidden', y > 420 && y > lastY + 4);
      if (y < lastY - 4 || y < 420) hdr.classList.remove('is-hidden');
      lastY = y;
    }
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    var menu = $('.menu'), btn = $('.menu-btn');
    if (!menu || !btn) return;
    function open() { menu.classList.add('is-open'); menu.removeAttribute('inert'); btn.setAttribute('aria-expanded', 'true'); document.documentElement.style.overflow = 'hidden'; $('[data-menu-close]', menu).focus(); document.addEventListener('keydown', keys); }
    function close() { menu.classList.remove('is-open'); menu.setAttribute('inert', ''); btn.setAttribute('aria-expanded', 'false'); document.documentElement.style.overflow = ''; document.removeEventListener('keydown', keys); btn.focus({ preventScroll: true }); }
    function keys(e) { if (e.key === 'Escape') close(); else if (e.key === 'Tab') trap(e, menu); }
    btn.addEventListener('click', open);
    menu.addEventListener('click', function (e) { if (e.target.closest('[data-menu-close]') || e.target.closest('nav a')) close(); });
  }

  /* ---------- reveal on scroll ---------- */
  var io = ('IntersectionObserver' in window && !RM) ? new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px' }) : null;
  function reveal(root) { $$('.reveal', root).forEach(function (el) { if (io) io.observe(el); else el.classList.add('is-in'); }); }

  /* ---------- home ---------- */
  var SELECTED = [
    ['noir-roses-seated', { c: '1 / 8', m: '1 / -1', sizes: '(max-width: 640px) 100vw, 56vw' }],
    ['rooftop-cap-gaze', { c: '9 / 13', m: '2 / 6', mt: '16vw', sizes: '(max-width: 640px) 66vw, 30vw' }],
    ['quote', { c: '1 / 13', m: '1 / -1' }],
    ['cocoa-portrait', { c: '2 / 6', m: '1 / 4', sizes: '(max-width: 640px) 50vw, 30vw' }],
    ['cocoa-standing', { c: '7 / 12', m: '4 / 7', mt: '8vw', mmt: '18vw', sizes: '(max-width: 640px) 50vw, 38vw' }],
    ['tribe-sweatsuit-back', { c: '1 / 9', m: '1 / -1', sizes: '(max-width: 640px) 100vw, 62vw' }],
    ['tribe-duo', { c: '10 / 13', m: '1 / 4', mt: '18vw', sizes: '(max-width: 640px) 50vw, 24vw' }],
    ['blend-street', { c: '3 / 7', m: '4 / 7', mmt: '14vw', sizes: '(max-width: 640px) 50vw, 30vw' }],
    ['monochrome-portrait', { c: '8 / 12', m: '2 / 6', mt: '10vw', sizes: '(max-width: 640px) 66vw, 30vw' }]
  ];
  function renderSelected(el) {
    var slugs = SELECTED.filter(function (x) { return x[0] !== 'quote'; }).map(function (x) { return x[0]; });
    setGroup('selected', slugs, 'Selected work');
    var i = 0;
    el.innerHTML = SELECTED.map(function (x) {
      if (x[0] === 'quote') return '<blockquote class="quote reveal gi" style="--c:' + x[1].c + ';--m:' + x[1].m + ';padding:clamp(8px,3vw,40px) 0">“Where fashion<br>meets attitude.”<small>From Contemporary Fashion</small></blockquote>';
      var p = P[x[0]], c = CAT[p.c], k = i++;
      x[1].cap = c.short; x[1].n = c.num;
      return fig(x[0], 'selected', k, x[1]);
    }).join('');
  }
  function renderToc(el) {
    el.innerHTML = W.CATEGORIES.map(function (c) {
      return '<li><a href="/wanja/portfolio/' + c.id + '" data-peek="' + c.photos[0] + '">' + img(c.photos[0], { cls: 'toc__thumb', sizes: '56px' }) +
        '<span class="toc__n">' + c.num + '</span><span class="toc__t">' + esc(c.name) + '</span><span class="toc__k">' + esc(c.kicker) + ' · ' + c.photos.length + ' frames</span><span class="toc__go">' + ICON.arrow + '</span></a></li>';
    }).join('');
    if (window.matchMedia('(hover: hover) and (min-width: 901px)').matches) {
      var peek = document.createElement('div'); peek.className = 'toc__peek'; peek.setAttribute('aria-hidden', 'true'); document.body.appendChild(peek);
      var cur = null;
      el.addEventListener('mousemove', function (e) {
        var a = e.target.closest('[data-peek]');
        if (!a) { peek.classList.remove('is-on'); cur = null; return; }
        var s = a.getAttribute('data-peek');
        if (s !== cur) { cur = s; peek.innerHTML = img(s, { sizes: '220px' }); }
        peek.style.left = (e.clientX + 150) + 'px'; peek.style.top = e.clientY + 'px'; peek.classList.add('is-on');
      });
      el.addEventListener('mouseleave', function () { peek.classList.remove('is-on'); cur = null; });
    }
  }
  function renderBrands(el) {
    el.innerHTML = W.BRANDS.map(function (b) {
      return '<figure class="brand reveal"><div class="brand__img"><img src="' + IMG + b.img + '" width="360" height="' + Math.round(360 * b.h / b.w) + '" alt="' + esc(b.name) + '" loading="lazy" decoding="async"></div><figcaption>' + esc(b.name) + '</figcaption></figure>';
    }).join('');
  }
  function renderServices(el) {
    el.innerHTML = W.SERVICES.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('');
  }

  /* ---------- portfolio ---------- */
  var LAYOUT = {
    lifestyle: [{ c: '1 / 7', m: '1 / -1', sizes: '(max-width: 640px) 100vw, 46vw' }, { c: '8 / 13', m: '1 / 4', mt: '12vw', sizes: '(max-width: 640px) 50vw, 38vw' }, { c: '3 / 8', m: '4 / 7', mmt: '16vw', sizes: '(max-width: 640px) 50vw, 38vw' }],
    fashion: [{ c: '1 / 8', m: '1 / -1', sizes: '(max-width: 640px) 100vw, 56vw' }, { c: '9 / 13', m: '1 / 4', mt: '16vw', sizes: '(max-width: 640px) 50vw, 30vw' }, { c: '2 / 6', m: '4 / 7', mmt: '18vw', sizes: '(max-width: 640px) 50vw, 30vw' }, { c: '7 / 13', m: '1 / -1', mt: '8vw', sizes: '(max-width: 640px) 100vw, 46vw' }, { c: '1 / 5', m: '1 / 4', mt: '4vw', sizes: '(max-width: 640px) 50vw, 30vw' }, { c: '6 / 11', m: '4 / 7', mt: '12vw', mmt: '12vw', sizes: '(max-width: 640px) 50vw, 38vw' }],
    glamour: [{ c: '1 / 8', m: '1 / -1', sizes: '(max-width: 640px) 100vw, 56vw' }, { c: '9 / 13', m: '2 / 6', mt: '20vw', sizes: '(max-width: 640px) 66vw, 30vw' }, { c: '2 / 7', m: '1 / 4', sizes: '(max-width: 640px) 50vw, 38vw' }, { c: '8 / 13', m: '4 / 7', mt: '10vw', mmt: '14vw', sizes: '(max-width: 640px) 50vw, 38vw' }],
    commercial: [{ c: '1 / 5', m: '1 / 4', sizes: '(max-width: 640px) 50vw, 30vw' }, { c: '5 / 9', m: '4 / 7', mt: '8vw', mmt: '12vw', sizes: '(max-width: 640px) 50vw, 30vw' }, { c: '9 / 13', m: '1 / 4', sizes: '(max-width: 640px) 50vw, 30vw' }, { c: '1 / 5', m: '4 / 7', mt: '2vw', mmt: '12vw', sizes: '(max-width: 640px) 50vw, 30vw' }, { c: '5 / 10', m: '1 / -1', mt: '6vw', sizes: '(max-width: 640px) 100vw, 38vw' }, { c: '10 / 13', m: '2 / 6', mt: '14vw', sizes: '(max-width: 640px) 66vw, 24vw' }]
  };
  function chapterHtml(c, single) {
    setGroup(c.id, c.photos, c.num + ' · ' + c.name);
    var n = c.photos.length, tribe = c.id === 'commercial' ? W.BRANDS.filter(function (b) { return b.name === 'Tribe Nomad'; })[0] : null;
    var h = '<section class="chapter" id="' + c.id + '" aria-labelledby="h-' + c.id + '"><div class="wrap"><div class="ch__head">' +
      '<div class="ch__num" aria-hidden="true">' + c.num + '</div>' +
      '<div class="ch__title"><span class="lbl">' + c.num + ' / ' + esc(c.kicker) + '</span><h2 id="h-' + c.id + '">' + (single ? esc(c.name) : '<a href="/wanja/portfolio/' + c.id + '" data-cat="' + c.id + '">' + esc(c.name) + '</a>') + '</h2><p class="lead">' + esc(c.lead) + '</p>' +
      (tribe ? '<div class="brandmark"><img src="' + IMG + tribe.img + '" width="56" height="56" alt="Tribe Nomad logo" loading="lazy"><span class="lbl">Campaign for <b>Tribe Nomad</b></span></div>' : '') + '</div>' +
      '<div class="ch__text is-clamped">' + c.body.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '<button type="button" class="lnk ch__more" data-more>Read more</button></div></div>' +
      '<div class="eg">' + c.photos.map(function (s, i) { var o = Object.assign({}, LAYOUT[c.id][i] || {}); o.cap = c.short; o.n = String(i + 1).padStart(2, '0') + ' / ' + String(n).padStart(2, '0'); return fig(s, c.id, i, o); }).join('') + '</div>';
    if (single) {
      var k = W.CATEGORIES.indexOf(c), nx = W.CATEGORIES[(k + 1) % W.CATEGORIES.length];
      h += '<div class="ch__next"><a class="lnk" href="/wanja/portfolio" data-cat="">' + ICON.left + ' All work</a><a href="/wanja/portfolio/' + nx.id + '" data-cat="' + nx.id + '" aria-label="Next chapter: ' + esc(nx.name) + '"><span><span class="lbl">Next · ' + nx.num + '</span><br><span class="serif">' + esc(nx.name) + '</span></span>' + img(nx.photos[0], { sizes: '72px' }) + '</a></div>';
    }
    return h + '</div></section>';
  }
  function portfolio(root) {
    var chips = $('[data-chips]'), box = $('[data-chapters]');
    chips.innerHTML = '<a class="chip" href="/wanja/portfolio" data-cat="">All work <small>' + Object.keys(P).filter(function (k) { return CAT[P[k].c]; }).length + '</small></a>' +
      W.CATEGORIES.map(function (c) { return '<a class="chip" href="/wanja/portfolio/' + c.id + '" data-cat="' + c.id + '"><small>' + c.num + '</small>' + esc(c.short) + ' <small>' + c.photos.length + '</small></a>'; }).join('');
    function current() { var m = location.pathname.match(/\/wanja\/portfolio\/([a-z]+)/); return m && CAT[m[1]] ? m[1] : ''; }
    function paint(id, first) {
      $$('.chip', chips).forEach(function (a) { a.setAttribute('aria-current', a.getAttribute('data-cat') === id ? 'true' : 'false'); });
      var act = $('.chip[aria-current="true"]', chips); if (act && act.scrollIntoView && !first) act.scrollIntoView({ block: 'nearest', inline: 'center', behavior: RM ? 'auto' : 'smooth' });
      box.innerHTML = id ? chapterHtml(CAT[id], true) : W.CATEGORIES.map(function (c) { return chapterHtml(c, false); }).join('');
      var c = CAT[id];
      document.title = (c ? c.name + ' — ' : 'Portfolio — ') + 'Wanja Mwangi';
      var ttl = $('[data-ptitle]'); if (ttl) ttl.innerHTML = c ? esc(c.short) : 'The <em>work</em>';
      var sub = $('[data-psub]'); if (sub) sub.textContent = c ? c.kicker + '. ' + c.photos.length + ' photographs.' : 'Four chapters of Wanja’s work: lifestyle and venue collaborations, contemporary fashion, editorial glamour and commercial brand campaigns.';
      var can = $('link[rel="canonical"]'); if (can) can.href = 'https://cielafrica.com/wanja/portfolio' + (id ? '/' + id : '');
      guard(box); reveal(box);
    }
    function go(id) {
      if (id === current() && location.pathname.indexOf('/wanja/portfolio') === 0) { window.scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' }); return; }
      history.pushState({ cat: id }, '', '/wanja/portfolio' + (id ? '/' + id : ''));
      swap(id);
    }
    function swap(id) {
      var top = function () { var h = $('.phead'); window.scrollTo({ top: h ? h.offsetTop + h.offsetHeight - 40 > window.scrollY ? window.scrollY : h.offsetTop + h.offsetHeight - 40 : 0, behavior: 'auto' }); };
      if (RM) { paint(id); top(); return; }
      if (document.startViewTransition) { document.startViewTransition(function () { paint(id); top(); }); return; }
      box.classList.add('is-leaving');
      setTimeout(function () { paint(id); top(); requestAnimationFrame(function () { box.classList.remove('is-leaving'); }); }, 280);
    }
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[data-cat]'); if (a && !e.metaKey && !e.ctrlKey && !e.shiftKey) { e.preventDefault(); go(a.getAttribute('data-cat')); return; }
      var m = e.target.closest('[data-more]'); if (m) { var t = m.closest('.ch__text'); t.classList.remove('is-clamped'); m.remove(); }
    });
    window.addEventListener('popstate', function () { swap(current()); });
    paint(current(), true);
  }

  /* ---------- rates ---------- */
  function renderRates(el, nav) {
    var n = 0;
    el.innerHTML = W.RATES.map(function (g, gi) {
      var num = String(gi + 1).padStart(2, '0');
      return '<section class="rgroup reveal" id="' + g.id + '" aria-labelledby="r-' + g.id + '"><div class="rgroup__h"><span>' + num + '</span><h2 id="r-' + g.id + '">' + esc(g.name) + '</h2></div>' +
        (g.id === 'events' ? '<div class="rgroup__ph">' + img('event-pink-fleece', { sizes: '120px' }) + '<p>Wanja at an event, from her rate card.</p></div>' : '') +
        g.items.map(function (it) {
          n++; var q = g.name + ' — ' + it[0] + (it[2] ? ' (' + it[2] + ')' : '');
          return '<div class="rrow"><div class="rrow__n"><span>' + esc(it[0]) + (it[2] ? '<span class="rrow__d">' + esc(it[2]) + '</span>' : '') + '</span></div><div class="rrow__p">' + esc(it[1]) + '</div><a class="rrow__q" href="/wanja/contact?service=' + encodeURIComponent(q) + '#enquire">Enquire<span class="sr"> about ' + esc(q) + '</span></a></div>';
        }).join('') + '</section>';
    }).join('');
    if (nav) nav.innerHTML = W.RATES.map(function (g, gi) { return '<li><a href="#' + g.id + '"><span>' + String(gi + 1).padStart(2, '0') + '</span>' + esc(g.name) + '</a></li>'; }).join('');
    var t = $('[data-terms]'); if (t) t.innerHTML = W.TERMS.map(function (x, i) { return '<li><span>' + String(i + 1).padStart(2, '0') + '</span>' + esc(x) + '</li>'; }).join('');
  }

  /* ---------- contact ---------- */
  function contact(form) {
    var sel = $('select[name="Service"]', form);
    sel.innerHTML = '<option value="">Choose a service (optional)</option>' + W.RATES.map(function (g) {
      return '<optgroup label="' + esc(g.name) + '">' + g.items.map(function (it) { var v = g.name + ' — ' + it[0] + (it[2] ? ' (' + it[2] + ')' : ''); return '<option value="' + esc(v) + '">' + esc(it[0] + (it[2] ? ' (' + it[2] + ')' : '') + ' · ' + it[1]) + '</option>'; }).join('') + '</optgroup>';
    }).join('') + '<option value="Something else">Something else / not sure yet</option>';
    var want = new URLSearchParams(location.search).get('service');
    if (want) { var ok = $$('option', sel).some(function (o) { return o.value === want; }); if (ok) sel.value = want; }
    var status = $('[data-status]', form), btn = $('button[type="submit"]', form);
    function err(name, msg) {
      var f = form.elements[name], e = $('[data-err="' + name + '"]', form);
      if (f) f.setAttribute('aria-invalid', msg ? 'true' : 'false'); if (e) e.textContent = msg || '';
      return !msg;
    }
    function validate() {
      var v = function (n) { return (form.elements[n].value || '').trim(); }, good = true, first = null;
      [['Name', v('Name') ? '' : 'Please add your name.'],
       ['Email', !v('Email') ? 'Please add your email so Wanja can reply.' : (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v('Email')) ? '' : 'That email address doesn’t look right.')],
       ['Details', v('Details').length >= 10 ? '' : 'Tell Wanja a little about the project (a sentence or two).']]
        .forEach(function (x) { if (!err(x[0], x[1])) { good = false; if (!first) first = form.elements[x[0]]; } });
      if (first) first.focus();
      return good;
    }
    ['Name', 'Email', 'Details'].forEach(function (n) { form.elements[n].addEventListener('input', function () { if (this.getAttribute('aria-invalid') === 'true') err(n, ''); }); });
    function fallback(d) {
      var body = 'Hi Wanja,\n\n' + d.Details + '\n\n— ' + d.Name + (d.Brand ? ' (' + d.Brand + ')' : '') + (d.Service ? '\nService: ' + d.Service : '') + (d['Preferred date'] ? '\nDate: ' + d['Preferred date'] : '') + (d.Phone ? '\nPhone: ' + d.Phone : '');
      return '<a href="mailto:' + C.email + '?subject=' + encodeURIComponent('Brand enquiry — ' + d.Name) + '&body=' + encodeURIComponent(body) + '">email it to Wanja</a> or <a href="https://wa.me/' + C.wa + '?text=' + encodeURIComponent(body) + '" target="_blank" rel="noopener">send it on WhatsApp</a>';
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault(); status.hidden = true;
      if (!validate()) return;
      var d = {}; ['Name', 'Email', 'Brand', 'Phone', 'Service', 'Preferred date', 'Details'].forEach(function (k) { var f = form.elements[k]; if (f && f.value.trim()) d[k] = f.value.trim(); });
      var payload = Object.assign({ _form: 'wanja', _honey: form.elements._honey.value }, d, { Page: 'cielafrica.com/wanja/contact' });
      btn.disabled = true; var label = btn.innerHTML; btn.textContent = 'Sending…';
      fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok && j.ok === true }; }); })
        .catch(function () { return { ok: false }; })
        .then(function (res) {
          btn.disabled = false; btn.innerHTML = label;
          if (res.ok) {
            form.outerHTML = '<div class="sent" role="status" tabindex="-1"><span class="lbl">Enquiry sent</span><p class="mid">Thank you, ' + esc(d.Name.split(' ')[0]) + '.</p><p>Your message is on its way to Wanja. She’ll reply to <b>' + esc(d.Email) + '</b>. For anything urgent, <a class="lnk" href="https://wa.me/' + C.wa + '" target="_blank" rel="noopener">WhatsApp ' + ICON.arrow + '</a></p></div>';
            var s = $('.sent'); if (s) s.focus();
          } else {
            status.className = 'status status--err'; status.hidden = false;
            status.innerHTML = '<b>Your enquiry wasn’t sent.</b> Nothing went through, so please try again, or ' + fallback(d) + ' instead.';
            status.focus();
          }
        });
    });
  }

  /* ---------- boot ---------- */
  function boot() {
    shell();
    var el;
    if ((el = $('[data-render="selected"]'))) renderSelected(el);
    if ((el = $('[data-render="toc"]'))) renderToc(el);
    if ((el = $('[data-render="brands"]'))) renderBrands(el);
    if ((el = $('[data-render="services"]'))) renderServices(el);
    if ((el = $('[data-render="rates"]'))) renderRates(el, $('[data-render="rates-nav"]'));
    if ($('[data-chapters]')) portfolio();
    if ((el = $('form[data-enquiry]'))) contact(el);
    // static hero/inline photos that open the viewer
    $$('[data-group]').forEach(function (g) { setGroup(g.getAttribute('data-group'), g.getAttribute('data-slugs').split(','), g.getAttribute('data-label')); });
    var y = $('[data-year]'); if (y) y.textContent = new Date().getFullYear();
    guard(document); reveal(document);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
