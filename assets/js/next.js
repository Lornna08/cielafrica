/* CIEL AFRICA — /next v2: rotating hero word, scroll progress, services
   preview, 10-second brief in the CTA band, Nairobi clock. */
(function () {
  'use strict';
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  /* hero word */
  var rot = $('.rot');
  if (rot && !RM) {
    var w = $$('span', rot), i = 0;
    setInterval(function () { var a = w[i], b = w[(i + 1) % w.length]; a.classList.remove('on'); a.classList.add('out'); b.classList.remove('out'); b.classList.add('on'); setTimeout(function () { a.classList.remove('out'); }, 800); i = (i + 1) % w.length; }, 2400);
  }

  /* scroll progress */
  var prg = $('.prg');
  if (prg) addEventListener('scroll', function () { var m = document.documentElement.scrollHeight - innerHeight; prg.style.transform = 'scaleX(' + (m > 0 ? scrollY / m : 0) + ')'; }, { passive: true });

  /* services preview (desktop): follows the pointer down the empty middle of the list */
  var list = $('#svcList');
  if (list && matchMedia('(hover: hover) and (pointer: fine)').matches && !RM) {
    var imgs = ['assets/img/home/meridian-ui.webp', 'assets/img/home/transit-ui.webp', 'assets/img/ciel-shop/card.webp?v=20261022d', 'assets/img/reside-ke/card.webp?v=20261023c', 'assets/img/c-ledger/card.webp?v=20261023a', 'assets/img/apex-motion/card.webp?v=20261023a'];
    var svp = document.createElement('div'); svp.className = 'svp'; svp.setAttribute('aria-hidden', 'true');
    svp.innerHTML = imgs.map(function (s) { return '<img src="' + s + '" alt="" loading="lazy">'; }).join('');
    list.appendChild(svp);
    var pics = $$('img', svp), ty = 0, y = 0, on = false, rows;
    var bind = function () {
      rows = $$('.svc', list);
      rows.forEach(function (r, k) {
        r.addEventListener('mouseenter', function () { on = true; svp.classList.add('on'); pics.forEach(function (p, j) { p.classList.toggle('on', j === k % pics.length); }); });
        r.addEventListener('mouseleave', function () { on = false; svp.classList.remove('on'); });
      });
    };
    bind();
    list.addEventListener('mousemove', function (e) { var b = list.getBoundingClientRect(); ty = e.clientY - b.top; });
    (function loop() { var d = ty - y; y += d * .14; svp.style.transform = 'translate(-50%,' + (y - svp.offsetHeight / 2).toFixed(1) + 'px) rotate(' + Math.max(-6, Math.min(6, d * .05)).toFixed(2) + 'deg) scale(' + (on ? 1 : .85) + ')'; requestAnimationFrame(loop); })();
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
