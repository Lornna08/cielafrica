/* ============================================================
   CIEL SHOP — lightweight SVG charts (no dependencies)
   line/area, bars (stacked or diverging), donut, sparkline,
   horizontal bars. Responsive, with hover and tap tooltips.
   ============================================================ */
window.CS = window.CS || {};
(function () {
  'use strict';
  var ui = CS.ui, C = CS.charts = {};
  var observers = new WeakMap();

  // clean axis steps: 1, 2 or 5 × 10^k, with the top rounded up to a whole step
  function niceScale(maxVal, n) {
    if (!(maxVal > 0)) return { top: n || 4, step: 1, count: n || 4 };
    var raw = maxVal / (n || 4), e = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / e;
    var step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * e;
    if (step < 1) step = 1;
    var count = Math.max(1, Math.ceil(maxVal / step));
    return { top: step * count, step: step, count: count };
  }
  C.niceScale = niceScale;
  function watch(el, draw) {
    draw();
    if (!window.ResizeObserver) return;
    var old = observers.get(el); if (old) old.disconnect();
    var w = el.clientWidth;
    var ro = new ResizeObserver(function () { if (Math.abs(el.clientWidth - w) > 4) { w = el.clientWidth; draw(); } });
    ro.observe(el); observers.set(el, ro);
  }
  function tipEl(el) { var t = el.querySelector('.ctip'); if (!t) { t = document.createElement('div'); t.className = 'ctip'; el.appendChild(t); } return t; }
  function placeTip(el, tip, x, y) {
    var w = tip.offsetWidth, W = el.clientWidth;
    var left = x + 14; if (left + w > W) left = x - w - 14; if (left < 0) left = 0;
    tip.style.left = left + 'px'; tip.style.top = Math.max(0, y - 10) + 'px';
  }

  /* ---------- line / area ---------- */
  // o: {labels, series:[{name,values,color,dashed,area}], height, fmt, yFmt}
  C.line = function (el, o) {
    el.classList.add('chart');
    watch(el, function () {
      var W = Math.max(260, el.clientWidth), H = o.height || 240, pl = 48, pr = 12, pt = 12, pb = 26;
      var n = o.labels.length, all = [];
      o.series.forEach(function (s) { all = all.concat(s.values); });
      var sc = niceScale(Math.max.apply(null, all.concat([0])) * 1.02, 4), max = sc.top, ticks = sc.count;
      var x = function (i) { return pl + (n <= 1 ? (W - pl - pr) / 2 : i * (W - pl - pr) / (n - 1)); };
      var y = function (v) { return pt + (H - pt - pb) * (1 - v / max); };
      var yf = o.yFmt || ui.short, f = o.fmt || ui.num;
      var s = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + ui.esc(o.aria || 'Chart') + '">';
      for (var t = 0; t <= ticks; t++) { var v = max * t / ticks, yy = y(v); s += '<line class="gl" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + yy + '" y2="' + yy + '"/><text class="ax" x="' + (pl - 8) + '" y="' + (yy + 3.5) + '" text-anchor="end">' + yf(v) + '</text>'; }
      var every = Math.max(1, Math.ceil(n / Math.floor((W - pl - pr) / 64)));
      o.labels.forEach(function (l, i) { if (i % every === 0 || i === n - 1 && n < 12) s += '<text class="ax" x="' + x(i) + '" y="' + (H - 6) + '" text-anchor="middle">' + ui.esc(l) + '</text>'; });
      o.series.forEach(function (se, si) {
        var pts = se.values.map(function (v, i) { return [x(i), y(v)]; });
        var d = pts.map(function (p, i) {
          if (i === 0) return 'M' + p[0] + ',' + p[1];
          var p0 = pts[i - 1], cx = (p0[0] + p[0]) / 2;
          return 'C' + cx + ',' + p0[1] + ' ' + cx + ',' + p[1] + ' ' + p[0] + ',' + p[1];
        }).join('');
        if (se.area !== false && !se.dashed && pts.length) {
          var gid = 'g' + Math.random().toString(36).slice(2, 8);
          s += '<defs><linearGradient id="' + gid + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="' + se.color + '" stop-opacity=".16"/><stop offset="1" stop-color="' + se.color + '" stop-opacity="0"/></linearGradient></defs>';
          s += '<path d="' + d + 'L' + pts[pts.length - 1][0] + ',' + y(0) + 'L' + pts[0][0] + ',' + y(0) + 'Z" fill="url(#' + gid + ')"/>';
        }
        s += '<path d="' + d + '" fill="none" stroke="' + se.color + '" stroke-width="' + (se.dashed ? 1.6 : 2.2) + '"' + (se.dashed ? ' stroke-dasharray="4 4" opacity=".7"' : '') + ' stroke-linecap="round"/>';
        if (n <= 31 && !se.dashed) pts.forEach(function (p) { s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.4" fill="#fff" stroke="' + se.color + '" stroke-width="1.6" opacity="' + (n <= 14 ? 1 : 0) + '"/>'; });
      });
      s += '<line class="guide" x1="0" x2="0" y1="' + pt + '" y2="' + (H - pb) + '" style="display:none"/><g class="dots"></g>';
      s += '<rect x="' + pl + '" y="0" width="' + (W - pl - pr) + '" height="' + H + '" fill="transparent" class="hit"/></svg>';
      el.innerHTML = s;
      var svg = el.querySelector('svg'), guide = svg.querySelector('.guide'), dots = svg.querySelector('.dots'), tip = tipEl(el);
      function move(cx) {
        var r = svg.getBoundingClientRect(), mx = (cx - r.left) * (W / r.width);
        var i = Math.max(0, Math.min(n - 1, Math.round((mx - pl) / ((W - pl - pr) / Math.max(1, n - 1)))));
        guide.setAttribute('x1', x(i)); guide.setAttribute('x2', x(i)); guide.style.display = '';
        dots.innerHTML = o.series.map(function (se) { return '<circle cx="' + x(i) + '" cy="' + y(se.values[i]) + '" r="4" fill="' + se.color + '" stroke="#fff" stroke-width="2"/>'; }).join('');
        tip.innerHTML = '<b>' + ui.esc((o.tipLabels || o.labels)[i]) + '</b>' + o.series.map(function (se) { return '<div class="k"><i style="background:' + se.color + '"></i>' + ui.esc(se.name) + '<span>' + f(se.values[i]) + '</span></div>'; }).join('');
        tip.classList.add('on'); placeTip(el, tip, x(i) * (r.width / W), y(Math.max.apply(null, o.series.map(function (se) { return se.values[i]; }))) * (r.height / H));
      }
      function leave() { guide.style.display = 'none'; dots.innerHTML = ''; tip.classList.remove('on'); }
      svg.addEventListener('mousemove', function (e) { move(e.clientX); });
      svg.addEventListener('touchstart', function (e) { move(e.touches[0].clientX); }, { passive: true });
      svg.addEventListener('touchmove', function (e) { move(e.touches[0].clientX); }, { passive: true });
      svg.addEventListener('mouseleave', leave);
    });
  };

  /* ---------- vertical bars ---------- */
  // o: {labels, series:[{name,values,color}], stacked, diverging(bool: allow negatives), height, fmt}
  C.bars = function (el, o) {
    el.classList.add('chart');
    watch(el, function () {
      var W = Math.max(260, el.clientWidth), H = o.height || 220, pl = 44, pr = 8, pt = 10, pb = 26;
      var n = o.labels.length, maxP = 0, maxN = 0;
      for (var i = 0; i < n; i++) {
        var pos = 0, neg = 0;
        o.series.forEach(function (s) { var v = s.values[i]; if (o.stacked || o.diverging) { if (v >= 0) pos += v; else neg += v; } else { pos = Math.max(pos, v); } });
        maxP = Math.max(maxP, pos); maxN = Math.min(maxN, neg);
      }
      var sc = niceScale(Math.max(maxP, -maxN) * 1.02, maxN < 0 ? 3 : 4), top = sc.step * Math.max(1, Math.ceil(maxP / sc.step)), bot = maxN < 0 ? -sc.step * Math.ceil(-maxN / sc.step) : 0;
      var y = function (v) { return pt + (H - pt - pb) * (top - v) / (top - bot); };
      var band = (W - pl - pr) / n, bw = Math.max(3, Math.min(28, band * (o.stacked || o.diverging ? .58 : .7 / o.series.length)));
      var f = o.fmt || ui.num;
      var s = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + ui.esc(o.aria || 'Bar chart') + '">';
      var ticks = []; for (var tv = bot; tv <= top + 1e-9; tv += sc.step) ticks.push(Math.round(tv * 1e6) / 1e6);
      ticks.forEach(function (v) { s += '<line class="gl" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text class="ax" x="' + (pl - 8) + '" y="' + (y(v) + 3.5) + '" text-anchor="end">' + (v < 0 ? '−' : '') + ui.short(Math.abs(v)) + '</text>'; });
      var every = Math.max(1, Math.ceil(n / Math.floor((W - pl - pr) / 56)));
      for (var j = 0; j < n; j++) {
        var cx = pl + band * j + band / 2, posAcc = 0, negAcc = 0;
        s += '<g data-i="' + j + '"><rect x="' + (pl + band * j) + '" y="' + pt + '" width="' + band + '" height="' + (H - pt - pb) + '" fill="transparent"/>';
        o.series.forEach(function (se, si) {
          var v = se.values[j], x0, y0, h;
          if (o.stacked || o.diverging) {
            x0 = cx - bw / 2;
            if (v >= 0) { y0 = y(posAcc + v); h = y(posAcc) - y0; posAcc += v; } else { y0 = y(negAcc); h = y(negAcc + v) - y0; negAcc += v; }
          } else { x0 = cx - (bw * o.series.length) / 2 + si * bw; y0 = y(Math.max(0, v)); h = Math.abs(y(v) - y(0)); }
          if (h > 0) s += '<rect x="' + x0 + '" y="' + y0 + '" width="' + (o.stacked || o.diverging ? bw : bw - 2) + '" height="' + h + '" rx="' + Math.min(4, bw / 3) + '" fill="' + se.color + '"/>';
        });
        s += '</g>';
        if (j % every === 0) s += '<text class="ax" x="' + cx + '" y="' + (H - 6) + '" text-anchor="middle">' + ui.esc(o.labels[j]) + '</text>';
      }
      if (bot < 0) s += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y(0) + '" y2="' + y(0) + '" stroke="var(--line-2)"/>';
      s += '</svg>';
      el.innerHTML = s;
      var svg = el.querySelector('svg'), tip = tipEl(el);
      function show(g, cx, cy) {
        var i = +g.getAttribute('data-i');
        svg.querySelectorAll('g[data-i]').forEach(function (x) { x.style.opacity = x === g ? 1 : .55; });
        tip.innerHTML = '<b>' + ui.esc((o.tipLabels || o.labels)[i]) + '</b>' + o.series.map(function (se) { return '<div class="k"><i style="background:' + se.color + '"></i>' + ui.esc(se.name) + '<span>' + f(se.values[i]) + '</span></div>'; }).join('');
        var r = el.getBoundingClientRect(); tip.classList.add('on'); placeTip(el, tip, cx - r.left, cy - r.top);
      }
      svg.addEventListener('mousemove', function (e) { var g = e.target.closest('g[data-i]'); if (g) show(g, e.clientX, e.clientY); });
      svg.addEventListener('touchstart', function (e) { var g = e.target.closest('g[data-i]'); if (g) show(g, e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
      svg.addEventListener('mouseleave', function () { tip.classList.remove('on'); svg.querySelectorAll('g[data-i]').forEach(function (x) { x.style.opacity = 1; }); });
    });
  };

  /* ---------- donut ---------- */
  C.donut = function (el, o) {
    var items = o.items.filter(function (i) { return i.value > 0; }), total = items.reduce(function (t, i) { return t + i.value; }, 0);
    var S = o.size || 150, R = S / 2, r = R - (o.thick || 18), a0 = -Math.PI / 2, f = o.fmt || ui.num;
    var svg = '<svg width="' + S + '" height="' + S + '" viewBox="0 0 ' + S + ' ' + S + '" role="img" aria-label="' + ui.esc(o.aria || 'Breakdown') + '">';
    if (!total) svg += '<circle cx="' + R + '" cy="' + R + '" r="' + (R - 9) + '" fill="none" stroke="var(--bg-2)" stroke-width="18"/>';
    items.forEach(function (it, i) {
      var a1 = a0 + Math.max(0.0001, it.value / total * Math.PI * 2 - (items.length > 1 ? 0.025 : 0));
      var large = a1 - a0 > Math.PI ? 1 : 0;
      var p = function (a, rad) { return (R + rad * Math.cos(a)).toFixed(2) + ',' + (R + rad * Math.sin(a)).toFixed(2); };
      if (items.length === 1) svg += '<circle cx="' + R + '" cy="' + R + '" r="' + ((R + r) / 2) + '" fill="none" stroke="' + it.color + '" stroke-width="' + (R - r) + '" data-i="' + i + '"/>';
      else svg += '<path data-i="' + i + '" d="M' + p(a0, R) + 'A' + R + ',' + R + ' 0 ' + large + ' 1 ' + p(a1, R) + 'L' + p(a1, r) + 'A' + r + ',' + r + ' 0 ' + large + ' 0 ' + p(a0, r) + 'Z" fill="' + it.color + '" style="transition:opacity .15s"/>';
      a0 = a1 + (items.length > 1 ? 0.025 : 0);
    });
    svg += '<text x="' + R + '" y="' + (R - 2) + '" text-anchor="middle" style="font:700 17px var(--fd);fill:var(--ink)">' + ui.esc(o.center || ui.moneyShort(total)) + '</text><text x="' + R + '" y="' + (R + 15) + '" text-anchor="middle" style="font:500 11px var(--f);fill:var(--ink-3)">' + ui.esc(o.centerSub || 'total') + '</text></svg>';
    var leg = '<div class="donut-leg">' + o.items.map(function (it) { return '<div><i style="background:' + it.color + '"></i><span>' + ui.esc(it.label) + '</span><b>' + f(it.value) + '</b><em class="muted" style="font-style:normal;width:40px;text-align:right">' + (total ? Math.round(it.value / total * 100) : 0) + '%</em></div>'; }).join('') + '</div>';
    el.innerHTML = '<div class="donut-wrap chart" style="position:relative">' + svg + leg + '</div>';
    var wrap = el.firstChild, tip = tipEl(wrap);
    wrap.querySelector('svg').addEventListener('mousemove', function (e) {
      var t = e.target.closest('[data-i]'); if (!t) { tip.classList.remove('on'); return; }
      var it = items[+t.getAttribute('data-i')], r = wrap.getBoundingClientRect();
      tip.innerHTML = '<b>' + ui.esc(it.label) + '</b><div class="k">' + f(it.value) + '<span>' + Math.round(it.value / total * 100) + '%</span></div>';
      tip.classList.add('on'); placeTip(wrap, tip, e.clientX - r.left, e.clientY - r.top);
    });
    wrap.querySelector('svg').addEventListener('mouseleave', function () { tip.classList.remove('on'); });
  };

  /* ---------- horizontal bars (HTML) ---------- */
  C.hbars = function (items, o) {
    o = o || {};
    var max = Math.max.apply(null, items.map(function (i) { return i.value; }).concat([1])), f = o.fmt || ui.num;
    return '<div class="hbar">' + items.map(function (it, i) {
      return '<div class="hbar__r" title="' + ui.esc(it.label + ': ' + f(it.value)) + '"><span class="l">' + (it.html || ui.esc(it.label)) + '</span><span class="b"><i style="width:' + (it.value / max * 100).toFixed(1) + '%;background:' + (it.color || o.color || 'var(--acc)') + '"></i></span><span class="v num">' + f(it.value) + (it.sub ? '<div class="muted" style="font-weight:500;font-size:11px">' + it.sub + '</div>' : '') + '</span></div>';
    }).join('') + '</div>';
  };

  /* ---------- sparkline ---------- */
  C.spark = function (values, color, w, h) {
    w = w || 72; h = h || 26;
    if (!values.length) return '';
    var max = Math.max.apply(null, values), min = Math.min.apply(null, values), span = max - min || 1;
    var pts = values.map(function (v, i) { return (i * w / Math.max(1, values.length - 1)).toFixed(1) + ',' + (h - 2 - (v - min) / span * (h - 4)).toFixed(1); });
    return '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true"><polyline points="' + pts.join(' ') + '" fill="none" stroke="' + (color || 'var(--acc)') + '" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/></svg>';
  };
})();
