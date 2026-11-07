/* ============================================================
   CIEL AFRICA PHOTO BOOKS — "Arrange for me".
   Lays a set of photos out like a designer would, all in the browser:
   1. reads each photo's look from its thumbnail: colours and mood,
      sharpness, exposure, skin tones (people) and where the subject is;
   2. puts them in story order (capture time when the photo has it) and
      splits them into moments by time gaps, place (GPS) and mood;
      photos without a date join the moment they look most like;
   3. gives each bigger moment an opening photo on a page of its own,
      then shares the rest out over pages so every photo lands in a frame
      of its own shape (portraits in tall frames, landscapes in wide ones;
      never two portraits squeezed into stacked wide frames);
   4. centres each crop on the subject (faces and detail), so people
      aren't cut off.
   Nothing leaves the device.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 1. what each photo looks like ---------- */
  function lab(r, g, b) {
    function lin(c) { c /= 255; return c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92; }
    var R = lin(r), G = lin(g), B = lin(b);
    var x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047, y = R * 0.2126 + G * 0.7152 + B * 0.0722, z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
    function f(t) { return t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116; }
    var fx = f(x), fy = f(y), fz = f(z);
    return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
  }
  function loadImg(url) {
    return new Promise(function (ok) { if (!url) return ok(null); var im = new Image(); im.onload = function () { ok(im); }; im.onerror = function () { ok(null); }; im.src = url; });
  }
  var N = 48; /* analysis grid */
  function look(im) {
    var w = im.naturalWidth || im.width, h = im.naturalHeight || im.height, s = N / Math.max(w, h);
    var cw = Math.max(4, Math.round(w * s)), ch = Math.max(4, Math.round(h * s));
    var c = document.createElement('canvas'); c.width = cw; c.height = ch;
    var x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0, cw, ch);
    var d = x.getImageData(0, 0, cw, ch).data, n = cw * ch, L = new Float32Array(n);
    var sL = 0, sA = 0, sB = 0, sC = 0, skin = 0, skX = 0, skY = 0, hue = [0, 0, 0, 0, 0, 0];
    for (var i = 0; i < n; i++) {
      var r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2], q = lab(r, g, b);
      L[i] = q[0]; sL += q[0]; sA += q[1]; sB += q[2];
      var chroma = Math.hypot(q[1], q[2]); sC += chroma;
      if (chroma > 12) { var hh = (Math.atan2(q[2], q[1]) + Math.PI) / (2 * Math.PI); hue[Math.min(5, Math.floor(hh * 6))] += chroma; }
      /* skin (all skin tones): warm, moderately saturated, not too dark or bright */
      var mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      if (r > g && g >= b * 0.85 && mx - mn > 12 && mx - mn < 150 && r > 50 && r < 252 && q[1] > 6 && q[1] < 38 && q[2] > 6 && q[2] < 45 && (r - g) < 90) { skin++; skX += i % cw; skY += (i / cw) | 0; }
    }
    var mL = sL / n, vL = 0; for (i = 0; i < n; i++) vL += (L[i] - mL) * (L[i] - mL);
    /* detail (edges) and where it sits: the subject */
    var ge = 0, gx = 0, gy = 0, gs = 0;
    for (var yy = 1; yy < ch - 1; yy++) for (var xx = 1; xx < cw - 1; xx++) {
      var k = yy * cw + xx, gr = Math.abs(L[k + 1] - L[k - 1]) + Math.abs(L[k + cw] - L[k - cw]);
      ge += gr;
      var wgt = gr * gr; gx += xx * wgt; gy += yy * wgt; gs += wgt;
    }
    var inner = Math.max(1, (cw - 2) * (ch - 2)), sharp = ge / inner;
    var sx = gs ? gx / gs / (cw - 1) : 0.5, sy = gs ? gy / gs / (ch - 1) : 0.45;
    var skinR = skin / n;
    /* people: lean the crop towards the skin tones (faces), heads sit in the upper part */
    if (skin > n * 0.02) { var kx = skX / skin / (cw - 1), ky = skY / skin / (ch - 1); sx = sx * 0.4 + kx * 0.6; sy = sy * 0.4 + ky * 0.6 - 0.04; }
    sx = 0.5 + (sx - 0.5) * 0.85; sy = 0.48 + (sy - 0.48) * 0.85; /* stay a little towards the middle */
    var hs = hue.reduce(function (a, b) { return a + b; }, 0) || 1;
    return {
      lab: [mL, sA / n, sB / n], contrast: Math.sqrt(vL / n), colour: sC / n, hue: hue.map(function (v) { return v / hs; }),
      sharp: sharp, skin: skinR, people: skinR > 0.035, focus: { x: Math.max(0.15, Math.min(0.85, sx)), y: Math.max(0.15, Math.min(0.85, sy)) }
    };
  }
  /**
   * metas: photo metadata [{id,w,h,taken,gps,name,added}], url(id) → Promise<url>|url
   * → Promise<[item]>  (item: {id, ar, t, gps, look, score, idx})
   */
  function features(metas, url, onStep) {
    var out = [], i = 0;
    function next() {
      if (i >= metas.length) return Promise.resolve(out);
      var m = metas[i], idx = i++;
      if (onStep && idx % 12 === 0) onStep(idx, metas.length);
      return Promise.resolve(url(m.id)).then(loadImg).then(function (im) {
        var lk = null; try { lk = im ? look(im) : null; } catch (e) { lk = null; }
        var t = m.taken ? Date.parse(m.taken) : NaN;
        out.push({ id: m.id, ar: m.w && m.h ? m.w / m.h : 1, t: isNaN(t) ? null : t, gps: m.gps || null, name: m.name || '', idx: idx, look: lk || { lab: [55, 0, 0], contrast: 20, colour: 10, hue: [0, 0, 0, 0, 0, 0], sharp: 4, skin: 0, people: false, focus: { x: 0.5, y: 0.45 } } });
        return next();
      });
    }
    return next().then(function (l) {
      var mx = Math.max.apply(null, l.map(function (x) { return x.look.sharp; }).concat([1]));
      l.forEach(function (x) {
        var k = x.look, expo = 1 - Math.min(1, Math.abs(k.lab[0] - 55) / 55);
        x.score = 0.38 * (k.sharp / mx) + 0.22 * Math.min(1, k.colour / 30) + 0.2 * expo + 0.12 * Math.min(1, k.contrast / 28) + (k.people ? 0.14 : 0) + (x.ar > 1.15 ? 0.04 : 0);
      });
      return l;
    });
  }

  /* ---------- 2. story order and moments ---------- */
  function cdist(a, b) {
    var p = a.look, q = b.look, dl = p.lab[0] - q.lab[0], da = p.lab[1] - q.lab[1], db = p.lab[2] - q.lab[2], dh = 0;
    for (var i = 0; i < 6; i++) dh += Math.abs(p.hue[i] - q.hue[i]);
    return Math.sqrt(dl * dl * 0.6 + da * da + db * db) + dh * 14;
  }
  function km(a, b) {
    var R = 6371, toR = Math.PI / 180, dLa = (b.lat - a.lat) * toR, dLo = (b.lng - a.lng) * toR;
    var h = Math.sin(dLa / 2) * Math.sin(dLa / 2) + Math.cos(a.lat * toR) * Math.cos(b.lat * toR) * Math.sin(dLo / 2) * Math.sin(dLo / 2);
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  }
  function natural(a, b) { return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' }); }
  function order(items) {
    var timed = items.filter(function (x) { return x.t != null; });
    if (timed.length >= Math.max(2, items.length * 0.5)) {
      timed.sort(function (a, b) { return a.t - b.t || natural(a.name, b.name); });
      /* undated photos go right after the dated photo they look most like */
      items.filter(function (x) { return x.t == null; }).forEach(function (x) {
        var best = 0, bd = 1e9; timed.forEach(function (y, j) { if (y.t == null) return; var d = cdist(x, y); if (d < bd) { bd = d; best = j; } });
        timed.splice(best + 1, 0, x);
      });
      return timed;
    }
    /* no dates: keep the camera's numbering, then gather photos of the same mood together */
    var l = items.slice();
    if (l.every(function (x) { return /\d{3,}/.test(x.name); })) l.sort(function (a, b) { return natural(a.name, b.name); });
    var k = Math.max(1, Math.min(12, Math.round(Math.sqrt(l.length / 2.5))));
    if (k < 2) return l;
    /* k-means on mood, seeded along the sequence so groups follow the order people chose */
    var cent = []; for (var i = 0; i < k; i++) cent.push(l[Math.floor((i + 0.5) * l.length / k)]);
    var asg = new Array(l.length);
    for (var it = 0; it < 6; it++) {
      l.forEach(function (x, j) { var b = 0, bd = 1e9; cent.forEach(function (c, ci) { var d = cdist(x, c) + Math.abs(j / l.length - (c._pos != null ? c._pos : ci / k)) * 30; if (d < bd) { bd = d; b = ci; } }); asg[j] = b; });
      cent = cent.map(function (c, ci) {
        var m = l.filter(function (x, j) { return asg[j] === ci; }); if (!m.length) return c;
        var lb = [0, 0, 0], hu = [0, 0, 0, 0, 0, 0], pos = 0;
        m.forEach(function (x) { for (var q = 0; q < 3; q++) lb[q] += x.look.lab[q] / m.length; for (q = 0; q < 6; q++) hu[q] += x.look.hue[q] / m.length; pos += l.indexOf(x) / l.length / m.length; });
        return { look: { lab: lb, hue: hu }, _pos: pos };
      });
    }
    var groups = cent.map(function (c, ci) { return { pos: c._pos != null ? c._pos : ci / k, l: l.filter(function (x, j) { return asg[j] === ci; }) }; }).filter(function (g) { return g.l.length; });
    groups.sort(function (a, b) { return a.pos - b.pos; });
    /* inside a group, each photo is followed by the one most like it, so similar shots share a page */
    var out = []; groups.forEach(function (g) {
      var left = g.l.slice(), cur = left.shift(), seq = [cur];
      while (left.length) { var bi = 0, bd = 1e9; left.forEach(function (x, j) { var d = cdist(cur, x) + Math.abs(Math.log(cur.ar / x.ar)) * 6; if (d < bd) { bd = d; bi = j; } }); cur = left.splice(bi, 1)[0]; seq.push(cur); }
      seq[0]._brk = true; out = out.concat(seq);
    });
    return out;
  }
  function moments(l) {
    if (!l.length) return [];
    var gaps = []; for (var i = 1; i < l.length; i++) if (l[i].t != null && l[i - 1].t != null) gaps.push(l[i].t - l[i - 1].t);
    gaps.sort(function (a, b) { return a - b; });
    var med = gaps.length ? gaps[Math.floor(gaps.length / 2)] : 0, thr = Math.max(45 * 60e3, Math.min(6 * 3600e3, med * 4));
    var out = [[l[0]]];
    for (i = 1; i < l.length; i++) {
      var a = l[i - 1], b = l[i], cur = out[out.length - 1], brk = false;
      if (b._brk) brk = true;
      else if (a.t != null && b.t != null) {
        var g = b.t - a.t; if (g > thr || new Date(a.t).toDateString() !== new Date(b.t).toDateString() && g > 2 * 3600e3) brk = true;
        if (!brk && a.gps && b.gps && g > 10 * 60e3 && km(a.gps, b.gps) > 2) brk = true;
      } else if (a.gps && b.gps && km(a.gps, b.gps) > 2) brk = true;
      else if (a.t == null || b.t == null) {
        var tail = cur.slice(-3), d = tail.reduce(function (s, x) { return s + cdist(x, b); }, 0) / tail.length;
        if (cur.length >= 3 && d > 34) brk = true;
      }
      if (brk) out.push([b]); else cur.push(b);
    }
    /* a single photo on its own joins the moment next to it it's closest to */
    for (i = 0; i < out.length; i++) {
      if (out[i].length !== 1 || out.length < 2) continue;
      var x = out[i][0], prev = out[i - 1], nx = out[i + 1];
      var dp = prev ? gapTo(prev[prev.length - 1], x) : 1e15, dn = nx ? gapTo(x, nx[0]) : 1e15;
      if (Math.min(dp, dn) > 3 * 3600e3) continue;
      if (dp <= dn) prev.push(x); else nx.unshift(x);
      out.splice(i, 1); i--;
    }
    return out;
    function gapTo(a, b) { return a.t != null && b.t != null ? Math.abs(b.t - a.t) : cdist(a, b) * 6e4; }
  }

  /* ---------- 3. pages ---------- */
  var PREF = { wide: 0.05, one: 0.06, full: 0.22, land: 0.02, square: 0.05, polaroid: 0.14, twov: 0, twost: 0.03, twost2: 0.04, collage: 0.16, bigsmall: 0.09, fullduo: 0.12, three: 0, threev: 0.2, threel: 0.02, threep: 0.06, four: 0.1, fourl: 0.08, five: 0.12, six: 0.18 };
  function perms(n) { if (n <= 1) return [[0]]; var out = []; perms(n - 1).forEach(function (p) { for (var i = 0; i <= p.length; i++) { var q = p.slice(); q.splice(i, 0, n - 1); out.push(q); } }); return out; }
  var PERM = [null, perms(1), perms(2), perms(3), perms(4)];
  /** how well a set of photos fits a layout: lower is better. Returns {cost, order} (order[f] = index of the photo in frame f) */
  function fit(ph, L) {
    var f = L.f, n = ph.length; if (f.length !== n) return null;
    var area = f.map(function (r) { return r[2] * r[3]; }), tot = area.reduce(function (a, b) { return a + b; }, 0);
    function lossOf(p, r) { var l = Math.abs(Math.log(p.ar / (r[2] / r[3]))); return l + (p.look.people && l > 0.3 ? (l - 0.3) * 0.6 : 0); }
    function costOf(ord) {
      var s = 0, worst = 0;
      for (var j = 0; j < n; j++) { var l = lossOf(ph[ord[j]], f[j]); s += l * area[j] / tot; if (l > worst) worst = l; }
      /* the best photo should get the biggest frame */
      var big = 0; for (j = 1; j < n; j++) if (area[j] > area[big] * 1.2) big = j;
      var bonus = n > 1 && area[big] > tot / n * 1.3 ? (Math.max.apply(null, ph.map(function (x) { return x.score; })) - ph[ord[big]].score) * 0.25 : 0;
      return s + Math.max(0, worst - 0.42) * 2.2 + bonus;
    }
    var best = null;
    if (n <= 4) PERM[n].forEach(function (ord) { var c = costOf(ord); if (!best || c < best.cost) best = { cost: c, order: ord }; });
    else {
      /* larger pages: wide photos to the widest frames */
      var fi = f.map(function (r, j) { return j; }).sort(function (a, b) { return f[b][2] / f[b][3] - f[a][2] / f[a][3]; });
      var pi = ph.map(function (p, j) { return j; }).sort(function (a, b) { return ph[b].ar - ph[a].ar; }), ord = new Array(n);
      fi.forEach(function (fj, k) { ord[fj] = pi[k]; }); best = { cost: costOf(ord), order: ord };
    }
    return best;
  }
  function bestLayout(ph, layouts, hero) {
    var best = null;
    Object.keys(layouts).forEach(function (k) {
      if (layouts[k].f.length !== ph.length || PREF[k] == null) return;
      var r = fit(ph, layouts[k]); if (!r) return;
      var c = r.cost + PREF[k] - (hero && ph.length === 1 && (k === 'full' && ph[0].ar < 1.05 || k === 'wide' && ph[0].ar >= 1.05) ? 0.2 : 0);
      if (!best || c < best.cost) best = { key: k, cost: c, order: r.order, alt: best };
      else if (!best.alt || c < best.alt.cost) best.alt = { key: k, cost: c, order: r.order };
    });
    return best;
  }
  /** splits one moment's photos (in order) into exactly q pages, each 1–6 photos, as well-fitting as possible */
  function split(ph, q, layouts) {
    var n = ph.length, avg = n / q, memo = {};
    function chunkCost(i, s) { var k = i + ':' + s; if (!(k in memo)) { var b = bestLayout(ph.slice(i, i + s), layouts); memo[k] = b ? b.cost + Math.abs(s - avg) * 0.18 : 1e9; } return memo[k]; }
    /* D[j][i] = best cost to lay out the first i photos on j pages */
    var D = [], P = [];
    for (var j = 0; j <= q; j++) { D.push(new Array(n + 1).fill(1e18)); P.push(new Array(n + 1).fill(0)); }
    D[0][0] = 0;
    for (j = 1; j <= q; j++) for (var i = 1; i <= n; i++) for (var s = 1; s <= 6 && s <= i; s++) {
      if (D[j - 1][i - s] >= 1e18) continue; var c = D[j - 1][i - s] + chunkCost(i - s, s);
      if (c < D[j][i]) { D[j][i] = c; P[j][i] = s; }
    }
    if (D[q][n] >= 1e18) return null;
    var out = []; i = n; for (j = q; j > 0; j--) { s = P[j][i]; out.unshift(ph.slice(i - s, i)); i -= s; }
    return out;
  }
  /**
   * items (from features), opts: { layouts, slots (pages to fill without adding), max (most pages that may be used) }
   * → [{ layout, ids: [photo id per frame], crops: [{z,cx,cy}] }]
   */
  var SIMPLE = { one: 1, land: 1, square: 1 };
  function plan(items, opts) {
    var L = opts.layouts, n = items.length; if (!n) return [];
    var seq = order(items), ms = moments(seq);
    var dens = n <= 10 ? 1 : n <= 30 ? 1.6 : n <= 80 ? 2 : n <= 160 ? 2.5 : 3;
    var T = Math.max(Math.ceil(n / 6), Math.min(opts.max, Math.ceil(n / dens)));
    /* the pages are already there (and paid for): use them, rather than crowding photos onto a few */
    if (opts.slots) T = Math.max(T, Math.min(opts.slots, opts.max, Math.ceil(n / 1.35)));
    if (T < ms.length) T = Math.min(opts.max, ms.length);
    /* pages per moment, in proportion to its photos */
    var share = ms.map(function (m) { return m.length / n * T; }), pg = share.map(function (v, i) { return Math.max(1, Math.min(ms[i].length, Math.floor(v))); });
    var left = T - pg.reduce(function (a, b) { return a + b; }, 0);
    var byRem = ms.map(function (m, i) { return i; }).sort(function (a, b) { return (share[b] - pg[b]) - (share[a] - pg[a]); });
    for (var r = 0; left > 0 && r < byRem.length * 3; r++) { var i0 = byRem[r % byRem.length]; if (pg[i0] < ms[i0].length) { pg[i0]++; left--; } }
    while (left < 0) { var mx = -1; pg.forEach(function (v, i) { if (v > 1 && (mx < 0 || ms[i].length / v < ms[mx].length / pg[mx])) mx = i; }); if (mx < 0) break; pg[mx]--; left++; }
    ms.forEach(function (m, i) { while (Math.ceil(m.length / pg[i]) > 6) pg[i]++; });
    var pages = [];
    ms.forEach(function (m, mi) {
      var q = pg[mi], rest = m.slice();
      /* the moment opens with its strongest photo on a page of its own */
      if (q >= 2 && m.length >= 3) {
        var look = rest.slice(0, Math.max(1, Math.ceil(rest.length / 3))), hero = look.reduce(function (a, b) { return b.score > a.score ? b : a; });
        rest.splice(rest.indexOf(hero), 1);
        var hb = bestLayout([hero], L, true); pages.push({ key: hb.key, alt: hb.alt, ph: [hero], order: hb.order, cost: hb.cost }); q--;
      }
      var parts = split(rest, q, L) || split(rest, Math.ceil(rest.length / 6), L) || [rest];
      parts.forEach(function (p) { var b = bestLayout(p, L); if (b) pages.push({ key: b.key, alt: b.alt, ph: p, order: b.order, cost: b.cost }); });
    });
    /* variety: the same layout twice in a row (or facing) swaps to a close second */
    for (var k = 1; k < pages.length; k++) {
      var a = pages[k - 1], b = pages[k];
      if (a.key === b.key && b.alt && b.alt.cost - b.cost < 0.14) { pages[k] = { key: b.alt.key, ph: b.ph, order: b.alt.order, cost: b.alt.cost }; }
    }
    return pages.map(function (p) {
      var ids = [], crops = [];
      p.order.forEach(function (oi, f) {
        var x = p.ph[oi], fr = L[p.key].f[f], fa = fr[2] / fr[3], fc = x.look.focus;
        /* only move the crop along the side that is actually cropped */
        crops.push({ z: 1, cx: x.ar > fa * 1.02 ? +fc.x.toFixed(3) : 0.5, cy: x.ar < fa / 1.02 ? +fc.y.toFixed(3) : 0.5 });
        ids.push(x.id);
      });
      /* one photo on a simple page: the frame follows the photo's shape (very long or tall photos are
         trimmed a little) and is centred on the page, so it never sits high with a gap below */
      var rects = null;
      if (SIMPLE[p.key] && p.ph.length === 1) {
        var x1 = p.ph[p.order[0]], PW = 1200, PH = L.full ? L.full.f[0][3] : 1697, M = 90, bw = PW - 2 * M, bh = PH - 2 * M;
        var a = Math.max(0.55, Math.min(2.2, x1.ar)), w = bw, h = bw / a;
        if (h > bh) { h = bh; w = bh * a; }
        /* a landscape photo alone on a page runs edge to edge, so the page reads as one big picture */
        if (a >= 1.15) { w = PW; h = PW / a; }
        w = Math.round(w); h = Math.round(h);
        rects = [[Math.round((PW - w) / 2), Math.round((PH - h) / 2), w, h]];
        var fc1 = x1.look.focus;
        crops = [{ z: 1, cx: x1.ar > a * 1.02 ? +fc1.x.toFixed(3) : 0.5, cy: x1.ar < a / 1.02 ? +fc1.y.toFixed(3) : 0.5 }];
      }
      return { layout: p.key, ids: ids, crops: crops, rects: rects };
    });
  }
  window.PBKArrange = { features: features, plan: plan, look: look, _order: order, _moments: moments };
})();
