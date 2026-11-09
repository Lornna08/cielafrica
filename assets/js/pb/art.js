/* ============================================================
   CIEL PHOTO BOOKS — original cover illustrations
   Drawn for Ciel Africa as plain vector paths in a 100 × 100 box,
   so the same shapes render in the browser (SVG) and in the PDF.
   Colours starting with @ come from the book's palette.
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PBA = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  function f(n) { return Math.round(n * 100) / 100; }
  function circ(cx, cy, r) { return 'M' + f(cx - r) + ' ' + f(cy) + 'A' + r + ' ' + r + ' 0 1 0 ' + f(cx + r) + ' ' + f(cy) + 'A' + r + ' ' + r + ' 0 1 0 ' + f(cx - r) + ' ' + f(cy) + 'Z'; }
  function rot(x, y, cx, cy, a) { var c = Math.cos(a), s = Math.sin(a); return [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]; }
  /** pointed leaf/petal from (bx,by), length len, half-width wid, angle a (radians, 0 = up) */
  function leaf(bx, by, len, wid, a) {
    var tip = rot(bx, by - len, bx, by, a), c1 = rot(bx - wid, by - len * 0.35, bx, by, a), c2 = rot(bx - wid * 0.7, by - len * 0.8, bx, by, a), c3 = rot(bx + wid * 0.7, by - len * 0.8, bx, by, a), c4 = rot(bx + wid, by - len * 0.35, bx, by, a);
    return 'M' + f(bx) + ' ' + f(by) + 'C' + f(c1[0]) + ' ' + f(c1[1]) + ' ' + f(c2[0]) + ' ' + f(c2[1]) + ' ' + f(tip[0]) + ' ' + f(tip[1]) + 'C' + f(c3[0]) + ' ' + f(c3[1]) + ' ' + f(c4[0]) + ' ' + f(c4[1]) + ' ' + f(bx) + ' ' + f(by) + 'Z';
  }
  function star(cx, cy, R, r, n, a0) { var d = ''; for (var i = 0; i < n * 2; i++) { var a = Math.PI / n * i - Math.PI / 2 + (a0 || 0), rr = i % 2 ? r : R; d += (i ? 'L' : 'M') + f(cx + Math.cos(a) * rr) + ' ' + f(cy + Math.sin(a) * rr); } return d + 'Z'; }
  function rect(x, y, w, h) { return 'M' + f(x) + ' ' + f(y) + 'H' + f(x + w) + 'V' + f(y + h) + 'H' + f(x) + 'Z'; }
  function rng(seed) { var a = seed; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var K = '#141414';

  var art = {};

  art['arch-palm'] = { name: 'Arched window and palm', shapes: [
    { d: 'M18 97V42A32 32 0 0 1 82 42V97Z', f: '#F4A3A0', s: K, w: 0.9 },
    { d: 'M27 87V43A23 23 0 0 1 73 43V87Z', f: K },
    { d: 'M31 87V44A21 21 0 0 1 73 44V87Z', f: '#7CC6F2' },
    { d: circ(44, 70, 5), f: '#E9B949', s: K, w: 0.6 },
    { d: 'M63.5 87C62.8 72 60 58 54 47.5L57.6 46.4C63.6 57.6 67 72 68.8 87Z', f: '#E9B949', s: K, w: 0.6 },
    { d: leaf(55.5, 46, 21, 5.5, -1.05), f: '#E9B949', s: K, w: 0.6 },
    { d: leaf(55.5, 46, 19, 4.6, -2.2), f: '#E9B949', s: K, w: 0.6 },
    { d: leaf(55.5, 46, 19, 4.4, 0.25), f: '#E9B949', s: K, w: 0.6 },
    { d: leaf(55.5, 46, 17, 4.6, 1.15), f: '#E9B949', s: K, w: 0.6 },
    { d: leaf(55.5, 46, 16, 4.2, 2.15), f: '#E9B949', s: K, w: 0.6 },
    { d: circ(53, 49.5, 2.5), f: '#E9B949', s: K, w: 0.5 },
    { d: circ(57.6, 50.2, 2.5), f: '#E9B949', s: K, w: 0.5 },
    { d: 'M18 87H82', s: K, w: 0.9 }
  ] };

  art['tower-badge'] = { name: 'Tower badge', shapes: [
    { d: 'M50 9C75 9 91 32 91 58C91 80 81 91 62 91L38 91C19 91 9 80 9 58C9 32 25 9 50 9Z', f: '#F3EDE0' },
    { d: 'M50 15C71 15 85 35 85 58C85 77 77 85 60 85L40 85C23 85 15 77 15 58C15 35 29 15 50 15Z', f: '#67A5CF' },
    { d: 'M15 61C21 55 27 59 31 57C37 51 45 55 50 53C56 47 66 51 70 49C76 47 81 51 85 53L85 72L15 72Z', f: '#F3EDE0' },
    { d: 'M15 66H28V61H38V68H63V62H85V78H15Z', f: '#2A2A2A' },
    { d: 'M49.6 15.5H50.4V22H49.6Z', f: '#2A2A2A' },
    { d: 'M50 21L51.6 34L54.2 50L58.4 66L63.5 79L57.2 79C56 72.5 44 72.5 42.8 79L36.5 79L41.6 66L45.8 50L48.4 34Z', f: '#E38B3A', s: '#2A2A2A', w: 0.5 },
    { d: rect(45, 49.2, 10, 2.2), f: '#E38B3A', s: '#2A2A2A', w: 0.45 },
    { d: rect(41.2, 64.5, 17.6, 2.4), f: '#E38B3A', s: '#2A2A2A', w: 0.45 },
    { d: rect(47.8, 33.4, 4.4, 1.6), f: '#E38B3A', s: '#2A2A2A', w: 0.4 },
    { d: 'M47 53L53 63M53 53L47 63M49 37L51 47M51 37L49 47', s: '#2A2A2A', w: 0.35 },
    { d: 'M15 76C19 69 27 69 31 73C35 67 45 68 48 74C53 68 61 68 65 72C70 66 79 68 85 72L85 78C85 82 79 85 70 85L30 85C22 85 15 82 15 78Z', f: '#2E7D46' },
    { d: 'M24 76C26 74 29 74 31 76M58 75C60 73 63 73 65 75', s: '#1B4D2B', w: 0.5 }
  ] };

  var pro = [];
  [-1.3, -0.95, -0.6, -0.3, 0, 0.3, 0.6, 0.95, 1.3].forEach(function (a, i) { pro.push({ d: leaf(24, 80, i % 2 ? 15 : 17, 4, a), f: i % 2 ? '#F7A8B8' : '#F48FA5', s: '#8E3B55', w: 0.45 }); });
  art['mountain-protea'] = { name: 'Flat-topped mountain and protea', ground: { y: 90, c: '#1F4549' }, shapes: [
    { d: circ(74, 30, 10), f: '#FFD9A8' },
    { d: 'M0 90L15 58L25 52L29 42L71 41L76 48L88 57L100 90L100 100L0 100Z', f: '#2F5D62' },
    { d: 'M29 42L71 41L72 43.5L28.4 44.6Z', f: '#3E7479' },
    { d: 'M0 90C20 81 40 83 60 86C76 88 90 86 100 90L100 100L0 100Z', f: '#1F4549' },
    { d: leaf(20, 98, 18, 4, -0.5), f: '#5E8C61', s: '#2E4A30', w: 0.4 },
    { d: leaf(28, 98, 18, 4, 0.55), f: '#5E8C61', s: '#2E4A30', w: 0.4 }
  ].concat(pro).concat([{ d: circ(24, 81, 5), f: '#F3D9DF', s: '#8E3B55', w: 0.45 }]) };

  function house(x, w, top, col, win, door) {
    var s = [], g = top - 9, b = 97;
    s.push({ d: 'M' + x + ' ' + b + 'V' + top + 'H' + f(x + w * 0.16) + 'C' + f(x + w * 0.16) + ' ' + f(top - 4) + ' ' + f(x + w * 0.28) + ' ' + f(g + 2) + ' ' + f(x + w * 0.34) + ' ' + g + 'L' + f(x + w * 0.34) + ' ' + f(g - 5) + 'C' + f(x + w * 0.34) + ' ' + f(g - 9) + ' ' + f(x + w * 0.66) + ' ' + f(g - 9) + ' ' + f(x + w * 0.66) + ' ' + f(g - 5) + 'L' + f(x + w * 0.66) + ' ' + g + 'C' + f(x + w * 0.72) + ' ' + f(g + 2) + ' ' + f(x + w * 0.84) + ' ' + f(top - 4) + ' ' + f(x + w * 0.84) + ' ' + top + 'H' + (x + w) + 'V' + b + 'Z', f: col, s: K, w: 0.5 });
    s.push({ d: circ(x + w / 2, g - 4, 2), f: win, s: '#FFFFFF', w: 0.5 });
    var cw = w * 0.2, gap = (w - 3 * cw) / 4;
    for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) {
      var wx = x + gap + c * (cw + gap), wy = top + 4 + r * 11;
      if (r === 2 && c === 1) continue;
      s.push({ d: rect(wx, wy, cw, 7.5), f: win, s: '#FFFFFF', w: 0.6 });
    }
    s.push({ d: rect(x + w / 2 - cw / 2 - 0.5, top + 26, cw + 1, b - top - 26), f: door, s: K, w: 0.5 });
    return s;
  }
  var bunt = [{ d: 'M6 20Q50 34 94 20', s: '#E8603C', w: 0.6 }];
  ['#E8603C', '#3B4FA8', '#F2B33D', '#F4A3A0', '#3B4FA8', '#E8603C'].forEach(function (c, i) {
    var t = (i + 0.7) / 6.4, x = 6 + 88 * t, y = 20 + 14 * 2 * t * (1 - t) * 1.0;
    bunt.push({ d: 'M' + f(x - 4.5) + ' ' + f(y) + 'L' + f(x + 4.5) + ' ' + f(y + 0.4) + 'L' + f(x + 0.2) + ' ' + f(y + 10) + 'Z', f: c });
  });
  art['canal-houses'] = { name: 'Gabled canal houses', ground: { y: 97, c: '#2A2A2A' }, shapes: bunt.concat(house(4, 30, 62, '#8BC8E8', '#3B4FA8', '#E8603C'), house(35, 30, 54, '#E8603C', '#3B4FA8', '#8BC8E8'), house(66, 30, 60, '#F2B33D', '#3B4FA8', '#3B4FA8')) };

  var fr = [];
  [-1.45, -0.85, -0.2, 0.45, 1.1, 1.7].forEach(function (a, i) { fr.push({ d: leaf(38, 48, i % 2 ? 19 : 22, 6, a), f: '#0E9C97' }); });
  art['palm-sun'] = { name: 'Palm, half sun and tide', shapes: [
    { d: 'M24 82A32 32 0 0 1 88 82Z', f: '#FCE38A' },
    { d: 'M52 56C52 52 56 51 58 53C59 50 64 50 65 54C67 54 69 55 69 57L52 57Z', f: '#FFF6D8' },
    { d: 'M70 68C70 65 73 64 75 66C76 63 80 63 81 66C83 66 85 67 85 69L70 69Z', f: '#FFF6D8' },
    { d: 'M40 76H88V84H40Z', f: '#A8E6E2' },
    { d: 'M50 79H58M64 80.5H76M54 82.5H60', s: '#FFFFFF', w: 0.8 },
    { d: 'M40 84C52 81 62 86 88 83V90H40Z', f: '#F5A623' },
    { d: 'M34 90C35 76 38 62 36.5 49L39.5 48.6C41.8 62 40 76 38.5 90Z', f: '#B5541C' }
  ].concat(fr).concat([
    { d: circ(37, 50, 2.6), f: '#F59E5B' }, { d: circ(40.5, 51.5, 2.6), f: '#F59E5B' },
    { d: 'M22 90C22 84 27 81 31 83C33 79 40 79 42 83C46 82 50 85 50 90Z', f: '#0E8B86' }
  ]) };

  art['acacia'] = { name: 'Acacia at sunset', ground: { y: 94, c: '#8E3412' }, shapes: [
    { d: circ(56, 54, 27), f: '#FBE3A6' },
    { d: 'M0 94C20 78 70 72 100 94V100H0Z', f: '#B8471C' },
    { d: 'M0 94C34 89 66 91 100 94V100H0Z', f: '#8E3412' },
    { d: 'M47.5 82C48.5 72 47 64 43 57L45.2 56C48.6 61.5 50.2 67 50.6 74C52.5 66 56 61 61 57.5L62.4 58.8C57 63.5 53.6 70 52.4 82Z', f: '#2B1D12' },
    { d: 'M17 53C23 45 39 43 50 45C62 42 79 45 85 51C77 55 63 55 50 54C38 56 25 56 17 53Z', f: '#2B1D12' },
    { d: 'M28 50C33 47 40 46 46 47M58 46C65 45 72 46 77 49', s: '#3D2A1A', w: 0.6 },
    { d: 'M70 26L73 28.5L76 26M78 32L80.5 34L83 32', s: '#2B1D12', w: 0.8 }
  ] };

  art['dhow'] = { name: 'Dhow sail', shapes: [
    { d: circ(70, 28, 9), f: '#E9A23B' },
    { d: 'M24 38L82 14', s: '#F4E9D8', w: 1.1 },
    { d: 'M27 38.5L80 16L74 66L44 66Z', f: '#F4E9D8', s: '#1E2A2E', w: 0.5 },
    { d: 'M51.2 66V27H52.6V66Z', f: '#5B3A22' },
    { d: 'M22 68H82C78 77 71 80 60 80H36C29 80 25 76 22 68Z', f: '#8A5A35', s: '#1E2A2E', w: 0.5 },
    { d: 'M27 72H78', s: '#C68B59', w: 0.7 },
    { d: 'M10 86H34M44 86H62M70 86H90M18 91H42M54 91H82', s: '#F4E9D8', w: 0.8 }
  ] };

  art['heart-line'] = { name: 'Line heart', shapes: [
    { d: 'M50 80C30 64 18 52 18 38C18 28 26 22 34 22C42 22 47 27 50 33C53 27 58 22 66 22C74 22 82 28 82 38C82 52 70 64 50 80Z', s: '@accent', w: 1.4 }
  ] };

  var lau = [];
  for (var i = 0; i < 7; i++) {
    var t = i / 6, ang = 0.2 + t * 1.25;
    var lx = 46 - Math.sin(ang) * 26, ly = 84 - (1 - Math.cos(ang)) * 4 - t * 50;
    lau.push({ d: leaf(lx, ly, 10, 2.6, -0.9 - t * 0.5), f: '@accent' });
    lau.push({ d: leaf(lx, ly, 9, 2.4, 0.35 - t * 0.6), f: '@accent' });
    lau.push({ d: leaf(100 - lx, ly, 10, 2.6, 0.9 + t * 0.5), f: '@accent' });
    lau.push({ d: leaf(100 - lx, ly, 9, 2.4, -0.35 + t * 0.6), f: '@accent' });
  }
  art['laurel'] = { name: 'Laurel', shapes: [{ d: 'M46 86C26 74 20 54 26 32M54 86C74 74 80 54 74 32', s: '@accent', w: 0.9 }].concat(lau) };

  art['sprig'] = { name: 'Sprig', shapes: [{ d: 'M50 92C50 70 50 40 50 12', s: '@accent', w: 1.2 }].concat([0, 1, 2, 3, 4].map(function (k) { return { d: leaf(50, 86 - k * 16, 18 - k * 2, 5, k % 2 ? 0.75 : -0.75), f: '@accent' }; })).concat([{ d: leaf(50, 18, 12, 4, 0), f: '@accent' }]) };

  art['stars'] = { name: 'Stars and a doodle', shapes: [
    { d: star(28, 30, 13, 5.5, 5, 0.1), f: '#EE4266' },
    { d: star(72, 26, 9, 3.8, 5, -0.2), f: '#3BCEAC' },
    { d: star(64, 66, 15, 6.5, 5, 0.15), f: '#1E3A8A' },
    { d: star(30, 74, 7, 3, 5, 0), f: '#FFFFFF' },
    { d: circ(48, 46, 3), f: '#EE4266' },
    { d: 'M10 54C18 46 22 62 30 54C38 46 42 62 50 54C58 46 62 62 70 54C78 46 82 62 90 54', s: '#1E3A8A', w: 1.4 }
  ] };

  var conf = [], R = rng(77), cols = ['#FF5A1F', '#FFD23F', '#3BCEAC', '#EE4266', '#FFFFFF', '#7AA2FF'];
  for (var c = 0; c < 46; c++) {
    var x = R() * 96 + 2, y = R() * 96 + 2, col = cols[c % cols.length];
    if (x > 18 && x < 82 && y > 30 && y < 72) continue;
    if (c % 3 === 0) conf.push({ d: circ(x, y, 1 + R() * 1.2), f: col });
    else { var a = R() * Math.PI, w = 1 + R() * 1.4, h = 3 + R() * 3, p1 = rot(x - w, y - h, x, y, a), p2 = rot(x + w, y - h, x, y, a), p3 = rot(x + w, y + h, x, y, a), p4 = rot(x - w, y + h, x, y, a); conf.push({ d: 'M' + f(p1[0]) + ' ' + f(p1[1]) + 'L' + f(p2[0]) + ' ' + f(p2[1]) + 'L' + f(p3[0]) + ' ' + f(p3[1]) + 'L' + f(p4[0]) + ' ' + f(p4[1]) + 'Z', f: col }); }
  }
  art['confetti'] = { name: 'Confetti', shapes: conf };

  art['starfish'] = { name: 'Starfish', shapes: [
    { d: 'M50 12C54 30 58 38 88 40C64 52 62 58 72 88C54 70 46 70 28 88C38 58 36 52 12 40C42 38 46 30 50 12Z', f: '#F2894B' },
    { d: 'M50 12C54 30 58 38 88 40C64 52 62 58 72 88C60 76 54 72 50 70Z', f: '#E8763A' }
  ].concat([[50, 24], [50, 34], [50, 44], [62, 42], [74, 41], [58, 56], [64, 70], [42, 56], [36, 70], [38, 42], [26, 41]].map(function (p) { return { d: circ(p[0], p[1], 1.8), f: '#F8D6A8' }; })) };

  return { art: art, list: Object.keys(art) };
});
