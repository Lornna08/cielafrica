/* ============================================================
   CIEL AFRICA — "Altitude" homepage interactions (vanilla JS)
   starfield · 3D product constellation · sideways ride · kinetic
   rows with cursor preview · flight-plan brief builder · cursor
   ============================================================ */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var mouse = { x: innerWidth / 2, y: innerHeight / 2, nx: 0, ny: 0 };
  addEventListener('pointermove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; mouse.nx = e.clientX / innerWidth * 2 - 1; mouse.ny = e.clientY / innerHeight * 2 - 1; }, { passive: true });

  /* ---------- Nairobi clock ---------- */
  function nbo() {
    var d = new Date(), t;
    try { t = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Nairobi', hour: '2-digit', minute: '2-digit', hour12: false }).format(d); }
    catch (e) { var u = new Date(d.getTime() + (d.getTimezoneOffset() + 180) * 60000); t = ('0' + u.getHours()).slice(-2) + ':' + ('0' + u.getMinutes()).slice(-2); }
    $$('[data-clock]').forEach(function (el) { el.textContent = t; });
    var h = +t.slice(0, 2), m = $('#mood');
    if (m) m.textContent = h >= 6 && h < 9 ? 'Morning in Nairobi. Coffee’s on, stand-up’s soon.' : h >= 9 && h < 18 ? 'Working hours in Nairobi — we’re at our desks.' : h >= 18 && h < 22 ? 'Evening in Nairobi. Somebody’s still shipping.' : 'Late in Nairobi. Leave a message — we’ll pick it up at sunrise.';
  }
  nbo(); setInterval(nbo, 15000);
  var yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- nav + menu + progress ---------- */
  var nv = $('#nv'), prg = $('.prg');
  function onScroll() {
    var y = scrollY; nv.classList.toggle('is-s', y > 20);
    var max = document.documentElement.scrollHeight - innerHeight; if (prg) prg.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  var mb = $('.nv__m'), mm = $('#mm');
  function menu(open) { document.body.classList.toggle('menu-open', open); mb.setAttribute('aria-expanded', open); mm.setAttribute('aria-hidden', !open); document.documentElement.style.overflow = open ? 'hidden' : ''; }
  mb.addEventListener('click', function () { menu(!document.body.classList.contains('menu-open')); });
  $$('#mm a').forEach(function (a) { a.addEventListener('click', function () { menu(false); }); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape') menu(false); });

  /* ---------- headline: word-by-word rise ---------- */
  var hs = document.createElement('style');
  hs.textContent = '.js [data-split]{display:inline-block;transform:translateY(108%) rotate(3deg);opacity:0;transition:transform 1.2s cubic-bezier(.2,.75,.15,1),opacity 1.2s cubic-bezier(.2,.75,.15,1)}.js .hr.go [data-split]{transform:none;opacity:1}';
  document.head.appendChild(hs);
  $$('[data-split]').forEach(function (el, i) { el.style.transitionDelay = (120 + i * 110) + 'ms'; });
  requestAnimationFrame(function () { requestAnimationFrame(function () { var h = $('.hr'); if (h) h.classList.add('go'); }); });
  setTimeout(function () { var h = $('.hr'); if (h) h.classList.add('done'); }, RM ? 0 : 2200);

  /* ---------- reveals ---------- */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -6% 0px' }) : null;
  $$('.rv').forEach(function (el, i) { if (el.closest('.hr')) el.style.transitionDelay = (450 + (i % 4) * 120) + 'ms'; if (io && !RM) io.observe(el); else el.classList.add('in'); });

  /* ---------- videos: play only while visible ---------- */
  var vio = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { var v = e.target; if (e.isIntersecting && !RM) { if (v.preload === 'none') v.preload = 'auto'; var p = v.play(); if (p && p.catch) p.catch(function () { }); } else v.pause(); });
  }, { threshold: .2 }) : null;
  $$('video[data-auto]').forEach(function (v) { if (vio) vio.observe(v); });

  /* ---------- starfield ---------- */
  var cv = $('#sky'), hero = $('.hr');
  if (cv && cv.getContext) {
    var cx = cv.getContext('2d'), W = 0, H = 0, DPR = Math.min(2, devicePixelRatio || 1), stars = [], shoot = null, heroOn = true, px = 0, py = 0;
    var size = function () {
      W = cv.clientWidth; H = cv.clientHeight; cv.width = W * DPR; cv.height = H * DPR; cx.setTransform(DPR, 0, 0, DPR, 0, 0);
      var n = Math.round(clamp(W * H / 5200, 90, 340)); stars = [];
      for (var i = 0; i < n; i++) { var z = Math.random(); stars.push({ x: Math.random() * W, y: Math.random() * H * .92, z: z, r: .35 + z * 1.25, p: Math.random() * 6.28, s: .4 + Math.random() * 1.6, warm: Math.random() < .08 }); }
    };
    size(); addEventListener('resize', size);
    var draw = function (t) {
      cx.clearRect(0, 0, W, H);
      px = lerp(px, mouse.nx, .04); py = lerp(py, mouse.ny, .04);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i], a = RM ? .75 : .45 + .55 * Math.abs(Math.sin(t / 1000 * s.s + s.p));
        var x = s.x - px * 18 * s.z, y = s.y - py * 12 * s.z;
        cx.globalAlpha = a * (.45 + s.z * .55); cx.fillStyle = s.warm ? '#FFC79E' : (s.z > .8 ? '#FFFFFF' : '#C9D7FF');
        cx.beginPath(); cx.arc(x, y, s.r, 0, 6.283); cx.fill();
        if (s.z > .95) { cx.globalAlpha = a * .06; cx.beginPath(); cx.arc(x, y, s.r * 2.6, 0, 6.283); cx.fill(); }
      }
      if (!RM) {
        if (!shoot && Math.random() < .004) shoot = { x: Math.random() * W * .7 + W * .2, y: Math.random() * H * .35, l: 0, v: 9 + Math.random() * 6 };
        if (shoot) {
          shoot.l += shoot.v; var sx = shoot.x - shoot.l, sy = shoot.y + shoot.l * .45, g = cx.createLinearGradient(sx, sy, sx + 120, sy - 54);
          g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)');
          cx.globalAlpha = Math.max(0, 1 - shoot.l / 700); cx.strokeStyle = g; cx.lineWidth = 1.4; cx.beginPath(); cx.moveTo(sx, sy); cx.lineTo(sx + 120, sy - 54); cx.stroke();
          if (shoot.l > 700) shoot = null;
        }
      }
      cx.globalAlpha = 1;
    };
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { heroOn = es[0].isIntersecting; }).observe(hero);
    if (RM) draw(0); else (function loop(t) { if (heroOn && !document.hidden) draw(t); requestAnimationFrame(loop); })(0);
  }

  /* ---------- constellation tilt ---------- */
  var st = $('#cnst');
  if (st && !RM) {
    var rx = 0, ry = 0;
    (function tilt(t) {
      var tx, ty;
      if (FINE) { tx = -mouse.ny * 7 + 4; ty = mouse.nx * 11 - 8; }
      else { tx = 4 + Math.sin(t / 2600) * 3; ty = -8 + Math.sin(t / 3400) * 7; }
      rx = lerp(rx, tx, .06); ry = lerp(ry, ty, .06);
      st.style.transform = 'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
      requestAnimationFrame(tilt);
    })(0);
  } else if (st) st.style.transform = 'rotateX(4deg) rotateY(-8deg)';

  /* ---------- sideways ride (desktop) ---------- */
  var lw = $('#live'), pin = $('.lw__pin', lw), tr = $('#lwtr'), bar = $('.lw__bar i'), cnt = $('[data-cnt]');
  var cards = $$('.wk', tr), ride = matchMedia('(min-width: 1101px) and (min-height: 820px)');
  function setRide() {
    if (!ride.matches || RM) { lw.style.height = ''; tr.style.transform = ''; return; }
    var dist = tr.scrollWidth - innerWidth; lw.style.height = (innerHeight + Math.max(0, dist)) + 'px'; onRide();
  }
  function onRide() {
    if (!ride.matches || RM) return;
    var r = lw.getBoundingClientRect(), dist = tr.scrollWidth - innerWidth, p = clamp(-r.top / Math.max(1, r.height - innerHeight), 0, 1);
    tr.style.transform = 'translate3d(' + (-p * dist).toFixed(1) + 'px,0,0)';
    if (bar) bar.style.width = (p * 100) + '%';
    if (cnt) cnt.textContent = ('0' + Math.min(cards.length, 1 + Math.round(p * (cards.length - 1)))).slice(-2);
  }
  addEventListener('scroll', onRide, { passive: true }); addEventListener('resize', setRide); setRide();
  $$('.lw__arr button').forEach(function (b) { b.addEventListener('click', function () { var w = cards[0] ? cards[0].getBoundingClientRect().width + 24 : 600; tr.scrollBy({ left: w * +b.dataset.dir, behavior: RM ? 'auto' : 'smooth' }); }); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(setRide);

  /* ---------- kinetic rows: floating preview ---------- */
  var cpv = $('#cpv'), cimgs = cpv ? $$('img', cpv) : [], cpOn = false, vx = 0, vy = 0;
  if (cpv && FINE && !RM) {
    $$('.cp__r').forEach(function (r) {
      r.addEventListener('mouseenter', function () { cpOn = true; cpv.classList.add('on'); cimgs.forEach(function (im) { im.classList.toggle('on', im.dataset.i === r.dataset.i); }); });
      r.addEventListener('mouseleave', function () { cpOn = false; cpv.classList.remove('on'); });
    });
    (function follow() { vx = lerp(vx, mouse.x, .14); vy = lerp(vy, mouse.y, .14); var rot = clamp((mouse.x - vx) * .06, -10, 10); cpv.style.transform = 'translate(' + (vx + 30) + 'px,' + (vy - 120) + 'px) rotate(' + rot.toFixed(2) + 'deg) scale(' + (cpOn ? 1 : .6) + ')'; requestAnimationFrame(follow); })();
  }

  /* ---------- custom cursor + magnetic buttons ---------- */
  if (FINE && !RM) {
    document.documentElement.classList.add('has-cur');
    var cur = $('.cur'), dot = $('.cur-d'), lab = $('span', cur), cxp = mouse.x, cyp = mouse.y;
    (function c() { cxp = lerp(cxp, mouse.x, .18); cyp = lerp(cyp, mouse.y, .18); cur.style.transform = 'translate(' + cxp + 'px,' + cyp + 'px) translate(-50%,-50%)'; dot.style.transform = 'translate(' + mouse.x + 'px,' + mouse.y + 'px) translate(-50%,-50%)'; requestAnimationFrame(c); })();
    document.addEventListener('mouseover', function (e) {
      var l = e.target.closest('[data-cur]'), a = e.target.closest('a,button,input,label');
      cur.classList.toggle('is-l', !!l); cur.classList.toggle('is-h', !l && !!a); if (l) lab.textContent = l.getAttribute('data-cur');
    });
    $$('[data-mag]').forEach(function (b) {
      b.addEventListener('mousemove', function (e) { var r = b.getBoundingClientRect(); b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * .22).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * .3).toFixed(1) + 'px)'; });
      b.addEventListener('mouseleave', function () { b.style.transform = ''; });
    });
  } else { var c1 = $('.cur'), c2 = $('.cur-d'); if (c1) c1.remove(); if (c2) c2.remove(); }

  /* ---------- Nairobi photo parallax ---------- */
  var nph = $('#nbph'), nb = $('.nb');
  if (nph && !RM) addEventListener('scroll', function () { var r = nb.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return; nph.style.transform = 'translate3d(0,' + ((r.top - innerHeight / 2) * -.08).toFixed(1) + 'px,0)'; }, { passive: true });

  /* ---------- flight plan ---------- */
  var RUN = {
    store: { n: 'APEX MOTION', d: 'Live store template — catalogue, fitment, bag, checkout.', img: 'assets/img/apex-motion/card.webp?v=20261023a', href: 'apex-motion/', tpl: 'APEX MOTION', p: 'An online store' },
    finance: { n: 'C-Ledger', d: 'Live double-entry accounting template.', img: 'assets/img/c-ledger/card.webp?v=20261023a', href: 'c-ledger/demo.html', tpl: 'C-Ledger', p: 'Accounting & finance' },
    property: { n: 'Reside Ke', d: 'Live real-estate CRM template.', img: 'assets/img/reside-ke/card.webp?v=20261023c', href: 'reside-ke/demo.html', tpl: 'Reside Ke', p: 'Property & CRM' },
    inventory: { n: 'Ciel Shop', d: 'Live inventory & orders template.', img: 'assets/img/ciel-shop/card.webp?v=20261022d', href: 'ciel-shop/demo.html', tpl: 'Ciel Shop', p: 'Inventory & orders' },
    logistics: { n: 'Built on Transit’s playbook', d: 'Tracking, routing and a driver app — patterns from our Transit build.', img: 'assets/img/home/transit-live-poster.webp?v=20261023c', href: 'work.html', tpl: '', p: 'Logistics & delivery' },
    new: { n: 'A custom build', d: 'Designed from first principles, engineered to last.', img: 'assets/img/home/meridian-ui.webp', href: 'services.html', tpl: '', p: 'Something new' }
  };
  var S = { type: '', must: [], wk: 8, who: '' };
  var wk = $('#wk'), wko = $('#wko'), who = $('#who');
  function render() {
    var R = RUN[S.type] || RUN.new, done = (S.type ? 1 : 0) + (S.must.length ? 1 : 0) + 1 + (S.who ? 1 : 0);
    $('#bpWho').textContent = S.who || 'You';
    $('#bpType').textContent = S.type ? R.p : 'Pick what you’re building';
    $('#bpMust').textContent = S.must.length ? S.must.join(' · ') : '—';
    $('#eta').textContent = 'in ~' + S.wk + ' wks'; wko.textContent = '~' + S.wk + ' weeks';
    wk.style.setProperty('--p', ((S.wk - 2) / 22 * 100) + '%');
    $('#bpRunN').textContent = R.n; $('#bpRunD').textContent = R.d;
    var im = $('#bpImg'); if (im.getAttribute('src') !== R.img) im.src = R.img;
    $('#plane').style.left = (12 + done / 4 * 76) + '%';
    var code = (S.type || 'x') + S.must.length + S.wk + (S.who || ''); var h = 0; for (var i = 0; i < code.length; i++) h = (h * 31 + code.charCodeAt(i)) % 997;
    $('#fno').textContent = 'CA-' + ('00' + (h + 1)).slice(-3);
    var brief = 'Hi Ciel Africa! Here’s my flight plan:\n• Building: ' + (S.type ? R.p : 'not sure yet') + '\n• Must: ' + (S.must.length ? S.must.join(', ') : '—') + '\n• Target: live in ~' + S.wk + ' weeks\n• Starting point: ' + R.n + (S.who ? '\n• From: ' + S.who : '');
    $('#bpWa').href = 'https://wa.me/254706549703?text=' + encodeURIComponent(brief);
    $('#bpQ').href = 'quote.html?' + (R.tpl ? 'template=' + encodeURIComponent(R.tpl) + '&' : 'project=' + encodeURIComponent(R.n) + '&') + 'brief=' + encodeURIComponent(brief);
    $('#bpOk').textContent = done >= 3 ? 'Cleared for take-off. Send it whichever way you like.' : '';
  }
  $$('.chips').forEach(function (g) {
    var multi = g.hasAttribute('data-multi'), q = g.getAttribute('data-q');
    g.addEventListener('click', function (e) {
      var b = e.target.closest('.chip'); if (!b) return; var v = b.getAttribute('data-v');
      if (multi) { var on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on); S.must = $$('.chip[aria-pressed=true]', g).map(function (x) { return x.getAttribute('data-v'); }); }
      else { $$('.chip', g).forEach(function (x) { x.setAttribute('aria-pressed', x === b && S[q] !== v); }); S[q] = S[q] === v ? '' : v; }
      render();
    });
  });
  wk.addEventListener('input', function () { S.wk = +wk.value; render(); });
  who.addEventListener('input', function () { S.who = who.value.trim(); render(); });
  render();
})();
