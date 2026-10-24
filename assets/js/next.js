/* CIEL AFRICA — /next v3: rotating hero word, hero tilt, scroll progress,
   count-up numbers, M-Pesa prompt, process line, 10-second brief, Nairobi clock. */
(function () {
  'use strict';
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var seen = function (el, cb, m) { if (!el) return; if (!('IntersectionObserver' in window)) return cb(); var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { cb(); io.disconnect(); } }, { rootMargin: m || '0px 0px -15% 0px' }); io.observe(el); };

  /* hero word */
  var rot = $('.rot');
  if (rot && !RM) {
    var w = $$('span', rot), i = 0;
    setInterval(function () { var a = w[i], b = w[(i + 1) % w.length]; a.classList.remove('on'); a.classList.add('out'); b.classList.remove('out'); b.classList.add('on'); setTimeout(function () { a.classList.remove('out'); }, 800); i = (i + 1) % w.length; }, 2400);
  }

  /* hero: laptop + phone lean toward the pointer */
  var art = $('.hero__art.hx'), hero = $('.hero');
  if (art && FINE && !RM) {
    hero.addEventListener('mousemove', function (e) { var r = hero.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; art.style.transform = 'perspective(1400px) rotateY(' + (x * 7).toFixed(2) + 'deg) rotateX(' + (-y * 5).toFixed(2) + 'deg)'; });
    hero.addEventListener('mouseleave', function () { art.style.transform = ''; });
  }

  /* scroll progress */
  var prg = $('.prg');
  if (prg) addEventListener('scroll', function () { var m = document.documentElement.scrollHeight - innerHeight; prg.style.transform = 'scaleX(' + (m > 0 ? scrollY / m : 0) + ')'; }, { passive: true });

  /* count-up numbers */
  $$('[data-count]').forEach(function (el) {
    var to = +el.getAttribute('data-count');
    if (RM) { el.textContent = to; return; }
    el.textContent = '0';
    seen(el, function () { var t0 = performance.now(), d = 1400; (function f(t) { var p = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(to * e); if (p < 1) requestAnimationFrame(f); })(t0); });
  });

  /* M-Pesa prompt: PIN fills in, then "Payment received" */
  var stk = $('.stk');
  if (stk) {
    var pins = $$('.stk__pin span', stk), run = function () {
      var k = 0; stk.classList.remove('done'); pins.forEach(function (p) { p.classList.remove('f'); p.textContent = ''; });
      var t = setInterval(function () { if (k < pins.length) { pins[k].classList.add('f'); pins[k].textContent = '•'; k++; } else { clearInterval(t); stk.classList.add('done'); setTimeout(run, 3200); } }, 380);
    };
    if (RM) { pins.forEach(function (p) { p.classList.add('f'); p.textContent = '•'; }); stk.classList.add('done'); } else seen(stk, run);
  }

  /* process: the line fills and steps light up as you scroll */
  var steps = $('.steps');
  if (steps) {
    var fill = $('.steps__fill', steps), items = $$('li', steps);
    var upd = function () {
      var r = steps.getBoundingClientRect(), mid = innerHeight * .62, p = Math.max(0, Math.min(1, (mid - r.top) / r.height));
      fill.style.transform = 'scaleY(' + p.toFixed(3) + ')';
      items.forEach(function (li) { var q = li.getBoundingClientRect(); li.classList.toggle('on', q.top < mid); });
    };
    if (RM) { fill.style.transform = 'scaleY(1)'; items.forEach(function (li) { li.classList.add('on'); }); }
    else { addEventListener('scroll', upd, { passive: true }); upd(); }
  }
  var ph = $('.proc__ph'); seen(ph, function () { ph.classList.add('in'); });

  /* 10-second brief */
  var qb = $('.qb');
  if (qb) {
    var T = { 'An online store': 'APEX MOTION', 'Accounting & finance': 'C-Ledger', 'Property & CRM': 'Reside Ke', 'Inventory & orders': 'Ciel Shop' };
    var pick = '', note = $('.qb__note'), wa = $('#qbWa'), q = $('#qbQuote');
    var set = function () {
      var tpl = T[pick] || '', brief = 'Hi Ciel Africa! I’m building: ' + (pick || 'something new') + '.' + (tpl ? ' Your ' + tpl + ' template looks like a good starting point.' : '') + ' Can we talk?';
      wa.href = 'https://wa.me/254706549703?text=' + encodeURIComponent(brief);
      q.href = 'quote.html?' + (tpl ? 'template=' + encodeURIComponent(tpl) + '&' : '') + 'brief=' + encodeURIComponent(brief);
      note.textContent = pick ? (tpl ? 'Good news — ' + tpl + ' is a live template you can start from.' : 'We’ll scope it with you from a blank page.') : '';
    };
    $$('.qb__c button', qb).forEach(function (b) {
      b.addEventListener('click', function () { var v = b.textContent; pick = pick === v ? '' : v; $$('.qb__c button', qb).forEach(function (x) { x.setAttribute('aria-pressed', x.textContent === pick); }); set(); });
    });
    set();
  }

  /* Nairobi clock */
  var clk = $$('[data-clock]');
  var tick = function () { var t; try { t = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Nairobi', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()); } catch (e) { t = ''; } clk.forEach(function (c) { c.textContent = t; }); };
  if (clk.length) { tick(); setInterval(tick, 20000); }
})();
