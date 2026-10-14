/* ============================================================
   CIEL AFRICA — Living background
   A single lightweight canvas that sits behind the whole site:
   a slow drifting constellation field with blue/cyan glow,
   plus a reactive "aura" that lifts in the hero.
   - Device-pixel-ratio aware, capped for perf
   - Pauses when the tab is hidden
   - Fully respects prefers-reduced-motion (renders a quiet static field)
   ============================================================ */
(function () {
  'use strict';

  var canvas = document.getElementById('ciel-bg');
  if (!canvas) return;
  var ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  var reduce = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Palette (matches base.css tokens)
  var BLUE = [47, 107, 255];   // #2F6BFF
  var CYAN = [87, 217, 196];   // #57D9C4
  var GREEN = [61, 214, 140];  // #3DD68C

  var W = 0, H = 0, DPR = 1;
  var nodes = [];
  var mouse = { x: -9999, y: -9999, active: false };
  var heroBottom = 0;      // y (css px) where the hero ends — field is densest above it
  var t = 0;
  var running = true;

  function mix(a, b, k) {
    return [
      Math.round(a[0] + (b[0] - a[0]) * k),
      Math.round(a[1] + (b[1] - a[1]) * k),
      Math.round(a[2] + (b[2] - a[2]) * k)
    ];
  }
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }

  function nodeCount() {
    var area = W * H;
    // sparser field — calmer, less busy over text
    var n = Math.round(area / 26000);
    return Math.max(22, Math.min(reduce ? 40 : 70, n));
  }

  function makeNodes() {
    nodes = [];
    var n = nodeCount();
    for (var i = 0; i < n; i++) {
      var tone = Math.random();
      var col = tone < 0.55 ? mix(BLUE, CYAN, Math.random())
              : tone < 0.85 ? CYAN
              : mix(CYAN, GREEN, Math.random() * 0.6);
      nodes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.14,
        vy: (Math.random() - 0.5) * 0.14,
        r: Math.random() * 1.6 + 0.6,
        col: col,
        tw: Math.random() * Math.PI * 2,   // twinkle phase
        tws: 0.004 + Math.random() * 0.01  // twinkle speed
      });
    }
  }

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    var hero = document.querySelector('.hero');
    heroBottom = hero ? Math.min(hero.getBoundingClientRect().bottom, H) : H * 0.6;

    makeNodes();
  }

  function linkDist() { return W < 680 ? 112 : 150; }

  function step() {
    ctx.clearRect(0, 0, W, H);
    t += 1;

    var LD = linkDist();
    var LD2 = LD * LD;

    // --- move ---
    for (var i = 0; i < nodes.length; i++) {
      var p = nodes[i];
      if (!reduce) {
        p.x += p.vx;
        p.y += p.vy;

        // gentle pointer attraction (hero interactivity)
        if (mouse.active) {
          var dx = mouse.x - p.x, dy = mouse.y - p.y;
          var d2 = dx * dx + dy * dy;
          if (d2 < 26000 && d2 > 1) {
            var f = 0.9 / Math.sqrt(d2);
            p.vx += dx * f * 0.012;
            p.vy += dy * f * 0.012;
          }
        }
        // speed clamp so it never gets frantic
        p.vx = Math.max(-0.42, Math.min(0.42, p.vx * 0.992));
        p.vy = Math.max(-0.42, Math.min(0.42, p.vy * 0.992));

        // wrap edges
        if (p.x < -20) p.x = W + 20; else if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; else if (p.y > H + 20) p.y = -20;
      }
      p.tw += p.tws;
    }

    // --- links ---
    ctx.lineWidth = 1;
    for (var a = 0; a < nodes.length; a++) {
      var n1 = nodes[a];
      for (var b = a + 1; b < nodes.length; b++) {
        var n2 = nodes[b];
        var ddx = n1.x - n2.x, ddy = n1.y - n2.y;
        var dist2 = ddx * ddx + ddy * ddy;
        if (dist2 < LD2) {
          var dist = Math.sqrt(dist2);
          var near = 1 - dist / LD;
          // denser/brighter in the hero band
          var bandY = Math.min(n1.y, n2.y);
          var heroBoost = bandY < heroBottom ? 0.7 : 0.3;
          var alpha = near * 0.38 * heroBoost;
          if (alpha > 0.02) {
            var lc = mix(n1.col, n2.col, 0.5);
            ctx.strokeStyle = rgba(lc, alpha);
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
          }
        }
      }
    }

    // --- nodes ---
    for (var k = 0; k < nodes.length; k++) {
      var q = nodes[k];
      var twinkle = 0.5 + Math.sin(q.tw) * 0.3;
      var hb = q.y < heroBottom ? 0.8 : 0.5;
      var glowR = q.r * 5;
      var g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, glowR);
      g.addColorStop(0, rgba(q.col, 0.4 * twinkle * hb));
      g.addColorStop(1, rgba(q.col, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(q.x, q.y, glowR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = rgba(q.col, 0.75 * twinkle * hb);
      ctx.beginPath();
      ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2);
      ctx.fill();
    }

    if (running && !reduce) requestAnimationFrame(step);
  }

  // --- events ---
  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(resize, 160);
  }, { passive: true });

  if (!reduce) {
    window.addEventListener('pointermove', function (e) {
      // only react while over the hero region
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = e.clientY < heroBottom + 40;
    }, { passive: true });
    window.addEventListener('pointerleave', function () { mouse.active = false; });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        running = false;
      } else if (!running) {
        running = true;
        requestAnimationFrame(step);
      }
    });
  }

  resize();
  step(); // reduced-motion: draws one quiet frame and stops
})();
