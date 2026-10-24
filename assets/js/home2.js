/* CIEL AFRICA — homepage: rotating hero word, hero lean, services showcase,
   sketch-to-live build journey, 10-second brief, Nairobi clock. */
(function () {
  'use strict';
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var playIn = function (v) { if (!v) return; if (v.preload === 'none') v.preload = 'auto'; var p = v.play(); if (p && p.catch) p.catch(function () { }); };

  /* hero word */
  var rot = $('.rot');
  if (rot && !RM) {
    var w = $$('span', rot), i = 0;
    setInterval(function () { var a = w[i], b = w[(i + 1) % w.length]; a.classList.remove('on'); a.classList.add('out'); b.classList.remove('out'); b.classList.add('on'); setTimeout(function () { a.classList.remove('out'); }, 800); i = (i + 1) % w.length; }, 2400);
  }

  /* hero: laptop + phone lean gently toward the pointer */
  var art = $('.hero__art.hx'), hero = $('.hero');
  if (art && FINE && !RM) {
    hero.addEventListener('mousemove', function (e) { var r = hero.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; art.style.transform = 'perspective(1400px) rotateY(' + (x * 6).toFixed(2) + 'deg) rotateX(' + (-y * 4).toFixed(2) + 'deg)'; });
    hero.addEventListener('mouseleave', function () { art.style.transform = ''; });
  }

  /* services showcase: real work for each service, auto-advancing while on screen */
  var shw = $('.shw');
  if (shw) {
    var its = $$('.shw__it', shw), ps = $$('.shw__p', shw), src = $('.shw__src', shw), got = $('.shw__got', shw), url = $('.shw .bf__url span'), tag = $('.shw .bf__tag');
    var cur = -1, timer = null, t0 = 0, D = 7000, vis = false, hold = false, raf = 0;
    var show = function (k) {
      if (k === cur) return; cur = k;
      its.forEach(function (it, j) { it.classList.toggle('on', j === k); it.querySelector('button').setAttribute('aria-selected', j === k); });
      ps.forEach(function (p, j) { p.classList.toggle('on', j === k); $$('video', p).forEach(function (v) { if (j === k && vis && !RM) { v.currentTime = 0; playIn(v); } else v.pause(); }); });
      var p = ps[k]; src.innerHTML = p.getAttribute('data-src'); url.textContent = p.getAttribute('data-url'); tag.textContent = p.getAttribute('data-tag');
      got.innerHTML = p.getAttribute('data-got').split('|').map(function (x) { return '<span>' + x + '</span>'; }).join('');
      t0 = performance.now();
    };
    var bars = $$('.shw__bar b', shw);
    var loop = function (t) {
      raf = requestAnimationFrame(loop);
      if (!vis || hold || RM) return;
      var p = Math.min(1, (t - t0) / D); bars.forEach(function (b, j) { b.style.transform = 'scaleX(' + (j === cur ? p : 0) + ')'; });
      if (p >= 1) show((cur + 1) % its.length);
    };
    its.forEach(function (it, j) { it.querySelector('button').addEventListener('click', function () { show(j); t0 = performance.now(); }); });
    shw.addEventListener('mouseenter', function () { hold = true; var pr = bars[cur]; if (pr) pr.style.transform = 'scaleX(1)'; });
    shw.addEventListener('mouseleave', function () { hold = false; t0 = performance.now(); });
    show(0);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; $$('video', ps[cur]).forEach(function (v) { if (vis && !RM) playIn(v); else v.pause(); }); if (vis) t0 = performance.now(); }, { threshold: .25 }).observe(shw);
    requestAnimationFrame(loop);
  }

  /* build journey: the frame follows the step you're reading */
  var jr = $('.jr');
  if (jr) {
    var sts = $$('.jr__st', jr), vid = $('.jr__vid', jr), jurl = $('.jr .bf__url span'), jtag = $('.jr .bf__tag');
    var U = ['Sketchbook · week 1', 'Prototype · design review', 'staging.cielafrica.com/c-ledger', 'books.yourcompany.co.ke'];
    var G = ['Discover', 'Design', 'Building', 'Live'];
    var set = function (n) {
      if (jr.__n === n) return; jr.__n = n;
      jr.setAttribute('data-step', n); jurl.textContent = U[n - 1]; jtag.textContent = G[n - 1];
      sts.forEach(function (s, j) { s.classList.toggle('on', j === n - 1); });
      if (n >= 3 && !RM) playIn(vid); else if (vid) vid.pause();
    };
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) set(+e.target.getAttribute('data-n')); }); }, { rootMargin: '-45% 0px -45% 0px' });
      sts.forEach(function (s) { io.observe(s); });
    }
    set(1);
  }

  /* 10-second brief */
  var qb = $('.qb');
  if (qb) {
    var T = { 'An online store': 'APEX MOTION', 'Accounting & finance': 'C-Ledger', 'Property & CRM': 'Reside Ke', 'Inventory & orders': 'Ciel Shop' };
    var pick = '', note = $('.qb__note'), wa = $('#qbWa'), q = $('#qbQuote');
    var upd = function () {
      var tpl = T[pick] || '', brief = 'Hi Ciel Africa! I’m building: ' + (pick || 'something new') + '.' + (tpl ? ' Your ' + tpl + ' template looks like a good starting point.' : '') + ' Can we talk?';
      wa.href = 'https://wa.me/254706549703?text=' + encodeURIComponent(brief);
      q.href = 'quote.html?' + (tpl ? 'template=' + encodeURIComponent(tpl) + '&' : '') + 'brief=' + encodeURIComponent(brief);
      note.textContent = pick ? (tpl ? 'Good news — ' + tpl + ' is a live template you can start from.' : 'We’ll scope it with you from a blank page.') : '';
    };
    $$('.qb__c button', qb).forEach(function (b) {
      b.addEventListener('click', function () { var v = b.textContent; pick = pick === v ? '' : v; $$('.qb__c button', qb).forEach(function (x) { x.setAttribute('aria-pressed', x.textContent === pick); }); upd(); });
    });
    upd();
  }

  /* Nairobi clock */
  var clk = $$('[data-clock]');
  var tick = function () { var t; try { t = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Nairobi', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()); } catch (e) { t = ''; } clk.forEach(function (c) { c.textContent = t; }); };
  if (clk.length) { tick(); setInterval(tick, 20000); }
})();
