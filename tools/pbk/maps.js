/* Back-cover map stickers: a country silhouette with a pin, cut out like a sticker.
   Data: Natural Earth via world-atlas (public domain / ISC). Usage: node maps.js <repo> */
const fs = require('fs'), path = require('path'), t = require('topojson-client');
const REPO = process.argv[2]; const OUT = path.join(REPO, 'assets/pbk/maps'); fs.mkdirSync(OUT, { recursive: true });
global.self = global; require(path.join(REPO, 'assets/pbk/covers.js'));
const w = require('./node_modules/world-atlas/countries-50m.json');
const F = t.feature(w, w.objects.countries).features; const byName = {}; F.forEach(f => byName[f.properties.name] = f);
const w10 = require('./node_modules/world-atlas/countries-10m.json'); const byName10 = {}; t.feature(w10, w10.objects.countries).features.forEach(f => byName10[f.properties.name] = f);
const US = 'United States of America', UK = 'United Kingdom';
const D = {
  argentina: ['Argentina', -34.6, -58.4], aruba: ['Aruba', 12.52, -70.03], australia: ['Australia', -33.87, 151.21], bali: ['Indonesia', -8.4, 115.19], barcelona: ['Spain', 41.39, 2.17], bayonne: ['France', 43.49, -1.47], belgium: ['Belgium', 50.85, 4.35], berlin: ['Germany', 52.52, 13.4], brazil: ['Brazil', -22.9, -43.2], california: [US, 36.8, -119.4], canada: ['Canada', 45.42, -75.7], 'china-blossom': ['China', 39.9, 116.4], 'china-culture': ['China', 39.9, 116.4], colombia: ['Colombia', 4.71, -74.07], colorado: [US, 39.0, -105.5], copenhagen: ['Denmark', 55.68, 12.57], corsica: ['France', 42.04, 9.0], 'costa-rica': ['Costa Rica', 9.93, -84.08], crete: ['Greece', 35.24, 24.9], croatia: ['Croatia', 42.65, 18.09], 'dominican-republic': ['Dominican Rep.', 18.49, -69.93], dubai: ['United Arab Emirates', 25.2, 55.27], edinburgh: [UK, 55.95, -3.19], egypt: ['Egypt', 30.04, 31.24], finland: ['Finland', 60.17, 24.94], france: ['France', 48.86, 2.35], germany: ['Germany', 52.52, 13.4], greece: ['Greece', 37.98, 23.73], guadeloupe: ['France', 16.25, -61.58], ibiza: ['Spain', 38.91, 1.43], iceland: ['Iceland', 64.15, -21.94], ireland: ['Ireland', 53.35, -6.26], istanbul: ['Turkey', 41.01, 28.98], 'japan-fuji': ['Japan', 35.36, 138.73], 'japan-lantern': ['Japan', 35.01, 135.77], lanzarote: ['Spain', 29.04, -13.63], lisbon: ['Portugal', 38.72, -9.14], london: [UK, 51.51, -0.13], 'london-blue': [UK, 51.51, -0.13], madagascar: ['Madagascar', -18.88, 47.51], madeira: ['Portugal', 32.65, -16.91], maldives: ['Maldives', 4.18, 73.51], mallorca: ['Spain', 39.57, 2.65], malta: ['Malta', 35.9, 14.51], marseille: ['France', 43.3, 5.37], martinique: ['France', 14.64, -61.02], mauritius: ['Mauritius', -20.16, 57.5], mexico: ['Mexico', 19.43, -99.13], miami: [US, 25.76, -80.19], morocco: ['Morocco', 31.63, -8.0], mykonos: ['Greece', 37.45, 25.33], namibia: ['Namibia', -24.73, 15.29], 'new-york': [US, 40.71, -74.0], 'new-york-bridge': [US, 40.71, -74.0], 'new-zealand': ['New Zealand', -45.03, 168.66], 'new-zealand-kiwi': ['New Zealand', -36.85, 174.76], nice: ['France', 43.7, 7.27], norway: ['Norway', 60.39, 5.32], oman: ['Oman', 23.59, 58.38], paris: ['France', 48.86, 2.35], 'paris-croissant': ['France', 48.86, 2.35], philippines: ['Philippines', 14.6, 120.98], portugal: ['Portugal', 38.72, -9.14], 'portugal-azulejos': ['Portugal', 38.72, -9.14], quebec: ['Canada', 46.81, -71.21], reunion: ['France', -21.11, 55.53], rome: ['Italy', 41.9, 12.5], scotland: [UK, 57.12, -4.71], senegal: ['Senegal', 14.72, -17.47], seville: ['Spain', 37.39, -5.98], sicily: ['Italy', 37.6, 14.0], 'south-africa': ['South Africa', -33.92, 18.42], spain: ['Spain', 40.42, -3.7], 'sri-lanka': ['Sri Lanka', 6.93, 79.86], thailand: ['Thailand', 13.76, 100.5], tokyo: ['Japan', 35.68, 139.69], tunisia: ['Tunisia', 36.81, 10.18], vietnam: ['Vietnam', 21.03, 105.85], zanzibar: ['Tanzania', -6.16, 39.19],
  // Kenya covers (one file per colour option)
  'kenya-nairobi': ['Kenya', -1.29, 36.82], 'kenya-mombasa': ['Kenya', -4.04, 39.67], 'kenya-serengeti': ['Tanzania', -2.33, 34.83], 'kenya-kenya': ['Kenya', -1.29, 36.82], 'kenya-kenya-wild': ['Kenya', -1.5, 35.15]
};
const KPAL = { nairobi: ['#f6e7cf', '#b5452a', '#2f6e5a'], 'kenya-nairobi': [['#f6e7cf', '#b5452a', '#2f6e5a'], ['#1f3d36', '#f3d9a4', '#e9905e'], ['#e8a36b', '#3a1e10', '#fff6e6']] };
function polys(geom) { return geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates; }
function bbox(r) { let a = [1e9, 1e9, -1e9, -1e9]; r.forEach(([x, y]) => { a[0] = Math.min(a[0], x); a[1] = Math.min(a[1], y); a[2] = Math.max(a[2], x); a[3] = Math.max(a[3], y); }); return a; }
function area(r) { let s = 0; for (let i = 0; i < r.length - 1; i++) s += r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1]; return Math.abs(s / 2); }
function cen(r) { const b = bbox(r); return [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]; }
function dist(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1]); }
function inside(pt, r) { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi) c = !c; } return c; }
function dp(pts, tol) { if (pts.length < 3) return pts; let dmax = 0, idx = 0; const [a, b] = [pts[0], pts[pts.length - 1]]; for (let i = 1; i < pts.length - 1; i++) { const p = pts[i]; const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1e-9; const d = Math.abs((b[0] - a[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (b[1] - a[1])) / L; if (d > dmax) { dmax = d; idx = i; } } if (dmax > tol) { const l = dp(pts.slice(0, idx + 1), tol), r = dp(pts.slice(idx), tol); return l.slice(0, -1).concat(r); } return [a, b]; }
function build(name, lat, lon, hi) {
  const f = (hi ? byName10 : byName)[name]; if (!f) throw new Error('no country ' + name);
  const P = polys(f.geometry).map(p => p.map(r => r.map(([x, y]) => [x > 0 && lon < -100 && name === US && x > 100 ? x - 360 : x, y])));
  const pin = [lon, lat];
  const near = P.filter(p => { const b = bbox(p[0]); const dx = Math.max(b[0] - pin[0], 0, pin[0] - b[2]), dy = Math.max(b[1] - pin[1], 0, pin[1] - b[3]); return Math.hypot(dx, dy) < 6; });
  const P0 = (near.length ? near : P).slice().sort((a, b) => area(b[0]) - area(a[0]))[0];
  const b0 = bbox(P0[0]), c0 = cen(P0[0]), dg = Math.hypot(b0[2] - b0[0], b0[3] - b0[1]), Dm = dg < 1 ? 1.6 : dg < 3 ? 3.5 : Math.max(10, 0.5 * dg);
  let keep = P.filter(p => p === P0 || dist(cen(p[0]), c0) < Dm);
  const home = P.find(p => inside(pin, p[0])) || P.slice().sort((a, b) => dist(cen(a[0]), pin) - dist(cen(b[0]), pin))[0];
  if (keep.indexOf(home) < 0) keep.push(home);
  let all = []; keep.forEach(p => all = all.concat(p[0])); all.push(pin);
  if (!hi) { const sb = bbox(all); if (Math.max(sb[2] - sb[0], sb[3] - sb[1]) < 4) return build(name, lat, lon, true); }
  const bb = bbox(all), lat0 = (bb[1] + bb[3]) / 2, kx = Math.cos(lat0 * Math.PI / 180);
  const pw = (bb[2] - bb[0]) * kx, ph = bb[3] - bb[1], S = 480 / Math.max(pw, ph), ox = 300 - pw * S / 2, oy = 300 - ph * S / 2;
  const pr = ([x, y]) => [ox + (x - bb[0]) * kx * S, oy + (bb[3] - y) * S];
  let d = '';
  keep.forEach(p => p.forEach((ring, ri) => { if (ri > 0) return; const q = ring.map(pr), h = Math.floor(q.length / 2); let pts = q.length > 6 ? dp(q.slice(0, h + 1), 0.7).slice(0, -1).concat(dp(q.slice(h), 0.7)) : q; if (pts.length < 4 && area(ring) * S * S < 4) pts = ring.map(pr); if (pts.length < 3) return; d += 'M' + pts.map(q => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('L') + 'Z'; }));
  return { d, pin: pr(pin) };
}
function svg(m, fill, pinC) {
  const [px, py] = m.pin;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><defs><filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="9"/></filter></defs>` +
    `<path d="${m.d}" transform="translate(6 12)" fill="#000" fill-opacity=".22" stroke="#000" stroke-opacity=".22" stroke-width="34" stroke-linejoin="round" filter="url(#s)"/>` +
    `<path d="${m.d}" fill="#fff" stroke="#fff" stroke-width="34" stroke-linejoin="round"/>` +
    `<path d="${m.d}" fill="${fill}"/>` +
    `<g transform="translate(${px.toFixed(1)} ${py.toFixed(1)})"><path d="M0 0C-6-14-24-26-24-44A24 24 0 0 1 24-44C24-26 6-14 0 0Z" fill="#000" fill-opacity=".25" transform="translate(3 4)"/><path d="M0 0C-6-14-24-26-24-44A24 24 0 0 1 24-44C24-26 6-14 0 0Z" fill="${pinC}" stroke="#fff" stroke-width="6" stroke-linejoin="round"/><circle cy="-44" r="8.5" fill="#fff"/></g></svg>`;
}
function lum(h) { const n = parseInt(h.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; }
function colours(bg, tc) { const fill = Math.abs(lum(tc) - lum(bg)) > 0.25 ? tc : (lum(bg) > 0.5 ? '#1b1714' : '#ffffff'); const pin = /^#(e|f|d|c)[0-9a-f](0|1|2|3)/i.test(fill) && lum(fill) < 0.6 ? '#1b1714' : '#ff3b30'; return [fill, pin]; }
const list = self.PBK_COVERS; let n = 0;
list.forEach(c => { const e = D[c.id]; if (!e) return; const m = build(e[0], e[1], e[2]); const [fill, pin] = colours(c.bg, c.tc); fs.writeFileSync(path.join(OUT, c.id + '.svg'), svg(m, fill, pin)); n++; });
const K = { nairobi: [['#f6e7cf', '#b5452a'], ['#1f3d36', '#f3d9a4'], ['#e8a36b', '#3a1e10']], mombasa: [['#86d6e8', '#0c3f66'], ['#f4ead8', '#0e6f8f'], ['#0e5a78', '#ffffff']], serengeti: [['#fbe3b5', '#3b2314'], ['#3b2314', '#ffb23d'], ['#f2c7a5', '#8a2f12']], kenya: [['#f3eee2', '#141414'], ['#0f5c3a', '#ffffff'], ['#c8102e', '#ffffff']], 'kenya-wild': [['#f6d58e', '#7a3a10'], ['#2e3b2a', '#f6c06a'], ['#fff3dc', '#b5541a']] };
Object.keys(K).forEach(k => { const e = D['kenya-' + k]; const m = build(e[0], e[1], e[2]); K[k].forEach((p, i) => { const [fill, pin] = colours(p[0], p[1]); fs.writeFileSync(path.join(OUT, 'kenya-' + k + '-' + i + '.svg'), svg(m, fill, pin)); n++; }); });
console.log(n, 'maps');
