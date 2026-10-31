/* ============================================================
   CIEL PHOTO BOOKS — design engine (browser + Node)
   One source of truth for geometry. The editor, the full preview,
   the print-ready PDF and the payment server all call this file, so
   what the customer sees is computed exactly like what is printed.

   Units: millimetres, origin at the top-left of the trim box.
   Text sizes: points. Fonts: assets/fonts/pb (metrics in metrics.js).
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./metrics.js'), require('./art.js'));
  else root.PBE = factory(root.PBM, root.PBA);
})(typeof self !== 'undefined' ? self : this, function (MET, ART) {
  'use strict';
  var PT = 72 / 25.4; // points per mm

  /* ---------------- fonts ---------------- */
  var FONTS = {
    dmserif: { name: 'DM Serif Display', kind: 'Serif', file: 'pb-dmserif.ttf' },
    'dmserif-i': { name: 'DM Serif Italic', kind: 'Serif', file: 'pb-dmserif-i.ttf' },
    playfair: { name: 'Playfair Display', kind: 'Serif', file: 'pb-playfair.ttf' },
    'playfair-i': { name: 'Playfair Italic', kind: 'Serif', file: 'pb-playfair-i.ttf' },
    cormorant: { name: 'Cormorant Garamond', kind: 'Serif', file: 'pb-cormorant.ttf' },
    'cormorant-i': { name: 'Cormorant Italic', kind: 'Serif', file: 'pb-cormorant-i.ttf' },
    inter: { name: 'Inter', kind: 'Sans', file: 'pb-inter.ttf' },
    'inter-sb': { name: 'Inter SemiBold', kind: 'Sans', file: 'pb-inter-sb.ttf' },
    grotesk: { name: 'Space Grotesk', kind: 'Sans', file: 'pb-grotesk.ttf' },
    archivo: { name: 'Archivo Black', kind: 'Display', file: 'pb-archivo.ttf' },
    lilita: { name: 'Lilita One', kind: 'Display', file: 'pb-lilita.ttf' },
    caveat: { name: 'Caveat', kind: 'Handwritten', file: 'pb-caveat.ttf' }
  };
  var WIDTHS = {};
  Object.keys(MET).forEach(function (k) { var m = MET[k], map = {}; for (var i = 0; i < m.c.length; i++) map[m.c[i]] = m.w[i]; WIDTHS[k] = map; });
  function fontOk(id) { return !!(FONTS[id] && MET[id]); }
  function supported(fontId, ch) { return !!(WIDTHS[fontId] && WIDTHS[fontId][ch] != null); }
  /** characters the font can print; others are reported, never silently swapped */
  function cleanText(fontId, s) {
    s = String(s == null ? '' : s).replace(/\r\n?/g, '\n').replace(/\t/g, ' ').replace(/[\u2028\u2029]/g, '\n');
    var out = '', bad = [];
    for (var i = 0; i < s.length; i++) {
      var ch = s[i];
      if (ch === '\n' || supported(fontId, ch)) out += ch;
      else if (ch === '’' || ch === '‘') out += supported(fontId, '’') ? '’' : "'";
      else if (bad.indexOf(ch) < 0) bad.push(ch);
    }
    return { text: out, unsupported: bad };
  }
  function measure(fontId, text, sizePt) {
    var w = WIDTHS[fontId] || WIDTHS.inter, t = 0;
    for (var i = 0; i < text.length; i++) t += (w[text[i]] != null ? w[text[i]] : (w['?'] || 500));
    return t / 1000 * sizePt;
  }
  function wrap(fontId, text, sizePt, maxPt) {
    var paras = String(text).split('\n'), lines = [];
    paras.forEach(function (p) {
      var words = p.split(/ +/), line = '';
      if (!p.trim()) { lines.push(''); return; }
      words.forEach(function (wd) {
        if (!wd) return;
        var test = line ? line + ' ' + wd : wd;
        if (measure(fontId, test, sizePt) <= maxPt || !line) {
          if (!line && measure(fontId, wd, sizePt) > maxPt) { // break a very long word
            var part = '';
            for (var i = 0; i < wd.length; i++) { if (measure(fontId, part + wd[i], sizePt) > maxPt && part) { lines.push(part); part = ''; } part += wd[i]; }
            line = part;
          } else line = test;
        } else { lines.push(line); line = wd; if (measure(fontId, wd, sizePt) > maxPt) { var pp = ''; for (var j = 0; j < wd.length; j++) { if (measure(fontId, pp + wd[j], sizePt) > maxPt && pp) { lines.push(pp); pp = ''; } pp += wd[j]; } line = pp; } }
      });
      lines.push(line);
    });
    return lines;
  }

  /* ---------------- seeded random ---------------- */
  function rng(seed) { var a = (seed >>> 0) || 1; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* ---------------- layouts ----------------
     Slots are fractions of the page's content box (inside margins),
     or of the full bleed box when the layout is `bleed`.
     o = preferred photo orientation: l landscape, p portrait, s square, * any. */
  var LAYOUTS = [
    { id: 'full-bleed', name: 'Full bleed', group: 1, bleed: true, slots: [[0, 0, 1, 1, '*']] },
    { id: 'single', name: 'Single', group: 1, slots: [[0, 0, 1, 1, '*']] },
    { id: 'single-caption', name: 'Single + caption', group: 1, slots: [[0, 0, 1, 0.86, '*']], texts: [{ key: 'caption', role: 'caption', r: [0, 0.9, 1, 0.1], align: 'start' }] },
    { id: 'single-small', name: 'Quiet single', group: 1, slots: [[0.17, 0.15, 0.66, 0.58, '*']], texts: [{ key: 'caption', role: 'caption', r: [0.17, 0.77, 0.66, 0.08], align: 'middle' }] },
    { id: 'photo-text-side', name: 'Photo + story', group: 1, slots: [[0, 0, 0.6, 1, 'p']], texts: [{ key: 'body', role: 'body', r: [0.66, 0.3, 0.34, 0.45], align: 'start' }] },
    { id: 'text-photo', name: 'Photo + text below', group: 1, slots: [[0, 0, 1, 0.66, 'l']], texts: [{ key: 'body', role: 'body', r: [0, 0.72, 1, 0.28], align: 'start' }] },
    { id: 'two-side', name: 'Two side by side', group: 2, slots: [[0, 0, 0.5, 1, 'p'], [0.5, 0, 0.5, 1, 'p']] },
    { id: 'two-stack', name: 'Two stacked', group: 2, slots: [[0, 0, 1, 0.5, 'l'], [0, 0.5, 1, 0.5, 'l']] },
    { id: 'two-offset', name: 'Two offset', group: 2, slots: [[0, 0, 0.6, 0.62, 'p'], [0.4, 0.62, 0.6, 0.38, 'l']] },
    { id: 'two-quiet', name: 'Two with air', group: 2, slots: [[0.06, 0.2, 0.42, 0.5, 'p'], [0.52, 0.2, 0.42, 0.5, 'p']], texts: [{ key: 'caption', role: 'caption', r: [0.06, 0.76, 0.88, 0.08], align: 'middle' }] },
    { id: 'three-left', name: 'One large, two small', group: 3, slots: [[0, 0, 0.6, 1, 'p'], [0.6, 0, 0.4, 0.5, '*'], [0.6, 0.5, 0.4, 0.5, '*']] },
    { id: 'three-top', name: 'Wide over two', group: 3, slots: [[0, 0, 1, 0.58, 'l'], [0, 0.58, 0.5, 0.42, '*'], [0.5, 0.58, 0.5, 0.42, '*']] },
    { id: 'three-cols', name: 'Three columns', group: 3, slots: [[0, 0.18, 0.3333, 0.64, 'p'], [0.3333, 0.18, 0.3334, 0.64, 'p'], [0.6667, 0.18, 0.3333, 0.64, 'p']] },
    { id: 'four-grid', name: 'Four grid', group: 4, slots: [[0, 0, 0.5, 0.5, '*'], [0.5, 0, 0.5, 0.5, '*'], [0, 0.5, 0.5, 0.5, '*'], [0.5, 0.5, 0.5, 0.5, '*']] },
    { id: 'four-editorial', name: 'Four editorial', group: 4, slots: [[0, 0, 0.62, 0.55, 'l'], [0.62, 0, 0.38, 0.55, 'p'], [0, 0.55, 0.38, 0.45, 'p'], [0.38, 0.55, 0.62, 0.45, 'l']] },
    { id: 'five-collage', name: 'Collage of five', group: 5, slots: [[0, 0, 0.56, 0.46, 'l'], [0.56, 0, 0.44, 0.6, 'p'], [0, 0.46, 0.56, 0.54, 's'], [0.56, 0.6, 0.22, 0.4, 'p'], [0.78, 0.6, 0.22, 0.4, 'p']] },
    { id: 'six-grid', name: 'Six grid', group: 6, slots: [[0, 0, 0.5, 0.3333, '*'], [0.5, 0, 0.5, 0.3333, '*'], [0, 0.3333, 0.5, 0.3334, '*'], [0.5, 0.3333, 0.5, 0.3334, '*'], [0, 0.6667, 0.5, 0.3333, '*'], [0.5, 0.6667, 0.5, 0.3333, '*']] },
    { id: 'title-page', name: 'Title page', group: 0, kind: 'text', texts: [{ key: 'title', role: 'title', r: [0, 0.34, 1, 0.16], align: 'middle', valign: 'bottom' }, { key: 'subtitle', role: 'subtitle', r: [0.08, 0.53, 0.84, 0.08], align: 'middle' }, { key: 'body', role: 'body', r: [0.16, 0.66, 0.68, 0.2], align: 'middle' }] },
    { id: 'section', name: 'Section opener', group: 0, kind: 'text', ornament: true, texts: [{ key: 'title', role: 'section', r: [0, 0.4, 1, 0.12], align: 'middle', valign: 'bottom' }, { key: 'subtitle', role: 'subtitle', r: [0.1, 0.54, 0.8, 0.07], align: 'middle' }] },
    { id: 'quote', name: 'Message', group: 0, kind: 'text', texts: [{ key: 'body', role: 'quote', r: [0.1, 0.3, 0.8, 0.4], align: 'middle', valign: 'middle' }] },
    { id: 'blank', name: 'Blank', group: 0, kind: 'blank' }
  ];
  var LMAP = {}; LAYOUTS.forEach(function (l) { LMAP[l.id] = l; });

  var SPACING = { tight: { add: 0, gap: 2.5 }, normal: { add: 6, gap: 5 }, airy: { add: 16, gap: 8 } };
  var ROLE = { // size = fraction of trim width, in points
    title: { size: 0.17, lh: 1.05, font: 'title' }, section: { size: 0.12, lh: 1.05, font: 'title' },
    subtitle: { size: 0.06, lh: 1.25, font: 'body' }, body: { size: 0.052, lh: 1.4, font: 'body' },
    quote: { size: 0.075, lh: 1.35, font: 'title' }, caption: { size: 0.042, lh: 1.3, font: 'caption' }
  };

  /* ---------------- themes (per template) ---------------- */
  var THEMES = {
    'zanzibar-blue': { bg: '#26A4EA', ink: '#FFFFFF', accent: '#F4A3A0', soft: '#EAF6FD', page: '#FFFFFF', pink: '#F4A3A0', title: 'archivo', body: 'inter', caption: 'inter', cover: { style: 'illustration', art: 'arch-palm', pos: 'bottom', upper: false }, density: 'balanced', sectionBg: '#26A4EA', sectionInk: '#FFFFFF' },
    'zanzibar-night': { bg: '#111111', ink: '#FFFFFF', accent: '#F4A3A0', soft: '#F3F1EE', page: '#FFFFFF', title: 'archivo', body: 'inter', caption: 'inter', cover: { style: 'illustration', art: 'arch-palm', pos: 'bottom', upper: false }, density: 'balanced', sectionBg: '#111111', sectionInk: '#FFFFFF' },
    'paris-rose': { bg: '#E68AD2', ink: '#FFFFFF', accent: '#1F1F1F', soft: '#FBEAF7', page: '#FFFFFF', title: 'archivo', body: 'inter', caption: 'inter', cover: { style: 'illustration', art: 'tower-badge', pos: 'bottom', upper: true }, density: 'balanced', sectionBg: '#E68AD2', sectionInk: '#FFFFFF' },
    'cape-coral': { bg: '#FF8B72', ink: '#FFFFFF', accent: '#2F5D62', soft: '#FFF0EC', page: '#FFFFFF', title: 'lilita', body: 'inter', caption: 'inter', cover: { style: 'illustration', art: 'mountain-protea', pos: 'top', upper: true }, density: 'balanced', sectionBg: '#FF8B72', sectionInk: '#FFFFFF' },
    'amsterdam-canal': { bg: '#CFF8FC', ink: '#F2774F', accent: '#3557A5', soft: '#EFFCFD', page: '#FFFFFF', title: 'lilita', body: 'inter', caption: 'inter', cover: { style: 'illustration', art: 'canal-houses', pos: 'top', upper: true }, density: 'balanced', sectionBg: '#CFF8FC', sectionInk: '#F2774F' },
    'diani-shore': { bg: '#CFF8FC', ink: '#F2774F', accent: '#0E9C97', soft: '#EFFCFD', page: '#FFFFFF', title: 'archivo', body: 'inter', caption: 'inter', cover: { style: 'illustration', art: 'palm-sun', pos: 'bottom', upper: true }, density: 'airy', sectionBg: '#CFF8FC', sectionInk: '#F2774F' },
    'savanna-gold': { bg: '#F2B33D', ink: '#2B1D12', accent: '#B8471C', soft: '#FBF1DC', page: '#FFFDF8', title: 'dmserif', body: 'inter', caption: 'inter', cover: { style: 'illustration', art: 'acacia', pos: 'top', upper: false }, density: 'balanced', sectionBg: '#2B1D12', sectionInk: '#F2B33D' },
    'lamu-dhow': { bg: '#0F4C5C', ink: '#F4E9D8', accent: '#E9A23B', soft: '#F4EFE6', page: '#FFFFFF', title: 'dmserif', body: 'inter', caption: 'cormorant-i', cover: { style: 'illustration', art: 'dhow', pos: 'bottom', upper: false }, density: 'airy', sectionBg: '#0F4C5C', sectionInk: '#F4E9D8' },
    'love-letter': { bg: '#F6E3DF', ink: '#5A2E2A', accent: '#C9776B', soft: '#FBF2F0', page: '#FFFBFA', title: 'playfair-i', body: 'cormorant', caption: 'cormorant-i', cover: { style: 'photo-frame', art: 'heart-line', pos: 'bottom', upper: false }, density: 'airy', sectionBg: '#F6E3DF', sectionInk: '#5A2E2A' },
    'ivory-vows': { bg: '#F7F3EA', ink: '#2B2B2B', accent: '#A68A5B', soft: '#FBF9F4', page: '#FFFFFF', title: 'cormorant', body: 'cormorant', caption: 'cormorant-i', cover: { style: 'type', art: 'laurel', pos: 'middle', upper: true }, density: 'airy', sectionBg: '#F7F3EA', sectionInk: '#2B2B2B' },
    'family-table': { bg: '#C8623E', ink: '#FFF6EC', accent: '#F2C38B', soft: '#FBF1E8', page: '#FFFBF6', title: 'dmserif', body: 'inter', caption: 'caveat', cover: { style: 'photo-band', art: 'sprig', pos: 'bottom', upper: false }, density: 'balanced', sectionBg: '#C8623E', sectionInk: '#FFF6EC' },
    'crayon-days': { bg: '#FFD23F', ink: '#1E3A8A', accent: '#EE4266', soft: '#FFF8DA', page: '#FFFFFF', title: 'lilita', body: 'inter', caption: 'caveat', cover: { style: 'illustration', art: 'stars', pos: 'top', upper: false }, density: 'balanced', sectionBg: '#3BCEAC', sectionInk: '#FFFFFF' },
    'first-year': { bg: '#DCE7DA', ink: '#3E5641', accent: '#E9B8A8', soft: '#F3F7F2', page: '#FFFFFF', title: 'playfair', body: 'inter', caption: 'caveat', cover: { style: 'photo-frame', art: 'sprig', pos: 'bottom', upper: false }, density: 'airy', sectionBg: '#DCE7DA', sectionInk: '#3E5641' },
    'confetti': { bg: '#1F1B4D', ink: '#FFFFFF', accent: '#FF5A1F', soft: '#F2F1FA', page: '#FFFFFF', title: 'archivo', body: 'inter', caption: 'inter', cover: { style: 'illustration', art: 'confetti', pos: 'middle', upper: true }, density: 'balanced', sectionBg: '#1F1B4D', sectionInk: '#FFFFFF' },
    'cap-and-gown': { bg: '#14284B', ink: '#F4E3B5', accent: '#D4A73C', soft: '#F1F3F8', page: '#FFFFFF', title: 'dmserif', body: 'inter', caption: 'inter', cover: { style: 'type', art: 'laurel', pos: 'middle', upper: false }, density: 'balanced', sectionBg: '#14284B', sectionInk: '#F4E3B5' },
    'good-company': { bg: '#FFC93C', ink: '#1F1F1F', accent: '#FF6F59', soft: '#FFF6DB', page: '#FFFFFF', title: 'lilita', body: 'inter', caption: 'caveat', cover: { style: 'photo-band', art: 'stars', pos: 'bottom', upper: false }, density: 'full', sectionBg: '#FF6F59', sectionInk: '#FFFFFF' },
    'year-in-review': { bg: '#F2F0EA', ink: '#141414', accent: '#FF5A1F', soft: '#F7F6F2', page: '#FFFFFF', title: 'grotesk', body: 'inter', caption: 'inter', cover: { style: 'type', art: null, pos: 'top', upper: false, big: true }, density: 'full', sectionBg: '#141414', sectionInk: '#FFFFFF' },
    'portfolio-mono': { bg: '#0E0E0E', ink: '#FFFFFF', accent: '#9A9A9A', soft: '#F4F4F4', page: '#FFFFFF', title: 'grotesk', body: 'inter', caption: 'inter', cover: { style: 'photo-full', art: null, pos: 'bottom', upper: true }, density: 'airy', sectionBg: '#0E0E0E', sectionInk: '#FFFFFF' },
    'gallery-white': { bg: '#FFFFFF', ink: '#1A1A1A', accent: '#8C8C86', soft: '#FFFFFF', page: '#FFFFFF', title: 'playfair', body: 'inter', caption: 'inter', cover: { style: 'photo-frame', art: null, pos: 'bottom', upper: false }, density: 'airy', sectionBg: '#FFFFFF', sectionInk: '#1A1A1A' },
    'blank': { bg: '#F4F2EE', ink: '#1A1A1A', accent: '#FF5A1F', soft: '#FAFAF8', page: '#FFFFFF', title: 'dmserif', body: 'inter', caption: 'inter', cover: { style: 'type', art: null, pos: 'middle', upper: false }, density: 'balanced', sectionBg: '#F4F2EE', sectionInk: '#1A1A1A' }
  };
  function theme(id) { return THEMES[id] || THEMES.blank; }

  var COVER_STYLES = [
    { id: 'illustration', name: 'Illustration', photo: false },
    { id: 'photo-band', name: 'Photo + title band', photo: true },
    { id: 'photo-frame', name: 'Framed photo', photo: true },
    { id: 'photo-full', name: 'Full photo', photo: true },
    { id: 'type', name: 'Typography', photo: false }
  ];
  var BACK_STYLES = [{ id: 'color', name: 'Plain colour' }, { id: 'photo', name: 'Photo' }, { id: 'art', name: 'Small illustration' }];
  var ORNAMENTS = ['none', 'rule', 'dot', 'star', 'sprig'];

  /* ---------------- config helpers ---------------- */
  function format(cfg, id) { var f = (cfg.formats || []).filter(function (x) { return x.id === id; })[0]; return f || (cfg.formats || [])[0]; }
  function evenPages(cfg, f, n) {
    var p = f.pages, step = p.step || 2;
    n = Math.max(p.min, Math.min(p.max, Math.round(n)));
    n = p.min + Math.ceil((n - p.min) / step) * step;
    return Math.min(n, p.max);
  }
  function spineMm(cfg, project) {
    var b = (cfg.bindings || {})[project.binding || 'softcover'] || {}, paper = (cfg.papers || []).filter(function (p) { return p.id === project.paper; })[0] || (cfg.papers || [])[0] || { mmPerPage: 0.08 };
    return Math.round(((project.pages ? project.pages.length : 0) * (paper.mmPerPage || 0.08) + (b.boardAllowance || 0)) * 10) / 10;
  }
  function spineTextAllowed(cfg, project) {
    var b = (cfg.bindings || {})[project.binding || 'softcover'];
    return !!(b && b.spineText && spineMm(cfg, project) >= (b.spineTextMinMm || 6));
  }

  /* ---------------- geometry ---------------- */
  function dims(cfg, project) { var f = format(cfg, project.formatId); return { W: f.trimW, H: f.trimH, b: f.bleed, safe: f.safe, f: f }; }
  function side(index) { return index % 2 === 0 ? 'right' : 'left'; } // page 1 (index 0) is a right-hand page
  function content(d, page, index) {
    var sp = SPACING[page.spacing || 'normal'] || SPACING.normal, m = d.safe + sp.add, inner = 4;
    var r = { x: m, y: m, w: d.W - 2 * m - inner, h: d.H - 2 * m };
    if (side(index) === 'right') r.x += inner;
    return { r: r, gap: sp.gap };
  }
  function slotRect(box, fr, gap) {
    var x = box.x + fr[0] * box.w, y = box.y + fr[1] * box.h, w = fr[2] * box.w, h = fr[3] * box.h, g = gap / 2, e = 1e-4;
    if (fr[0] > e) { x += g; w -= g; }
    if (fr[0] + fr[2] < 1 - e) w -= g;
    if (fr[1] > e) { y += g; h -= g; }
    if (fr[1] + fr[3] < 1 - e) h -= g;
    return { x: x, y: y, w: w, h: h };
  }
  /** cover-fit an image into a frame, honouring zoom (≥1) and focal point (fx,fy in 0..1) */
  function place(rect, iw, ih, s) {
    s = s || {};
    var z = Math.max(1, Math.min(4, s.zoom || 1)), sc = Math.max(rect.w / iw, rect.h / ih) * z, dw = iw * sc, dh = ih * sc;
    var fx = s.fx == null ? 0.5 : s.fx, fy = s.fy == null ? 0.5 : s.fy;
    var x = rect.x + rect.w / 2 - fx * dw, y = rect.y + rect.h / 2 - fy * dh;
    x = Math.min(rect.x, Math.max(rect.x + rect.w - dw, x)); y = Math.min(rect.y, Math.max(rect.y + rect.h - dh, y));
    return { x: x, y: y, w: dw, h: dh, dpi: Math.round(iw / (dw / 25.4)) };
  }
  function orientOf(w, h) { var r = w / h; return r > 1.12 ? 'l' : (r < 0.89 ? 'p' : 's'); }

  /* ---------------- text boxes ---------------- */
  function textStyle(project, role, over) {
    var th = theme(project.templateId), t = project.theme || {}, R = ROLE[role] || ROLE.body, o = over || {};
    var fontKey = R.font === 'title' ? (t.titleFont || th.title) : (R.font === 'caption' ? (t.captionFont || th.caption) : (t.bodyFont || th.body));
    return { font: fontOk(o.font) ? o.font : fontKey, scale: o.scale || 1, color: o.color || null, align: o.align || null, lh: R.lh, base: R.size };
  }
  /** lay out a block of text into lines with baselines. Shrinks to fit (down to 55%). */
  function textBlock(d, rect, text, st, align, valign, upper) {
    var c = cleanText(st.font, upper ? String(text || '').toUpperCase() : text);
    var size = st.base * d.W * st.scale, min = size * 0.55, lines, lhMm, m = MET[st.font] || MET.inter, overflow = false, fitted = false;
    if (st.fit && c.text && c.text.indexOf('\n') < 0) { // poster titles: one line sized to the box width
      var w1 = measure(st.font, c.text, 1), cand = Math.min(rect.w * PT * st.fit / Math.max(w1, 0.01), rect.h * PT / st.lh) * st.scale;
      cand = Math.min(cand, rect.h * PT / st.lh);
      if (cand >= size * 0.9) { size = cand; lines = [c.text]; lhMm = size / PT * st.lh; fitted = true; }
    }
    for (var i = 0; !fitted && i < 30; i++) {
      lines = wrap(st.font, c.text, size, rect.w * PT);
      lhMm = size / PT * st.lh;
      if (lines.length * lhMm <= rect.h + 0.01 || size <= min) { overflow = lines.length * lhMm > rect.h + 0.01; break; }
      size = Math.max(min, size * 0.93);
    }
    var sizeMm = size / PT, total = lines.length * lhMm;
    var top = rect.y + (valign === 'middle' ? (rect.h - total) / 2 : valign === 'bottom' ? rect.h - total : 0);
    var asc = m.a / 1000 * sizeMm, desc = m.d / 1000 * sizeMm;
    var anchor = align || 'start', x = anchor === 'middle' ? rect.x + rect.w / 2 : anchor === 'end' ? rect.x + rect.w : rect.x;
    var out = lines.map(function (ln, k) { return { text: ln, x: x, y: top + k * lhMm + (lhMm - asc - desc) / 2 + asc }; });
    return { lines: out, size: size, anchor: anchor, overflow: overflow, unsupported: c.unsupported };
  }

  /* ---------------- art ---------------- */
  function artOps(key, x, y, s, ops, pal) {
    var a = ART && ART.art[key]; if (!a) return;
    pal = pal || {};
    function col(c) { return c && c.charAt(0) === '@' ? (pal[c.slice(1)] || '#888888') : (c || null); }
    a.shapes.forEach(function (sh) { ops.push({ t: 'path', d: sh.d, fill: col(sh.f), stroke: col(sh.s), sw: (sh.w || 0) * s, tx: x, ty: y, s: s }); });
  }
  function palette(project, th) { var t = project.theme || {}, cv = project.cover || {}; return { accent: cv.accent || t.accent || th.accent, ink: cv.ink || t.ink || th.ink, bg: cv.bg || t.bg || th.bg, soft: t.soft || th.soft }; }

  /* ---------------- render lists ----------------
     Every visual target becomes a list of drawing operations.
     SVG (editor, preview) and PDF both draw these lists. */
  function photoOp(ops, rect, slot, photos, warn, label) {
    var ph = slot && slot.photo && photos[slot.photo];
    if (!ph) { ops.push({ t: 'empty', x: rect.x, y: rect.y, w: rect.w, h: rect.h }); return null; }
    var p = place(rect, ph.w, ph.h, slot);
    ops.push({ t: 'img', id: ph.id, clip: rect, x: p.x, y: p.y, w: p.w, h: p.h });
    if (p.dpi < 150) warn.push({ level: p.dpi < 100 ? 'high' : 'low', code: 'dpi', msg: label + ': this photo is low resolution for its size (' + p.dpi + ' dpi). It may print soft.', dpi: p.dpi });
    return p;
  }
  function textOps(ops, items, warn, label, color, key, tb, extra) {
    if (tb.overflow) warn.push({ level: 'low', code: 'overflow', msg: label + ': some text is too long for its box.' });
    if (tb.unsupported.length) warn.push({ level: 'low', code: 'glyph', msg: label + ': these characters are not available in the chosen font and will not print: ' + tb.unsupported.join(' ') });
    tb.lines.forEach(function (ln) { if (ln.text) ops.push({ t: 'text', text: ln.text, x: ln.x, y: ln.y, size: tb.size, font: extra.font, color: color, anchor: tb.anchor, key: key }); });
    items.push({ key: key, rect: extra.rect, role: extra.role });
  }

  function renderPage(cfg, project, index, photos) {
    var d = dims(cfg, project), page = project.pages[index], th = theme(project.templateId), t = project.theme || {};
    var L = LMAP[page.layout] || LMAP.blank, ops = [], slots = [], texts = [], warn = [], label = 'Page ' + (index + 1);
    var isSection = L.id === 'section';
    var bg = page.bg || (isSection ? (t.sectionBg || th.sectionBg) : (t.page || th.page));
    var ink = page.ink || (isSection ? (t.sectionInk || th.sectionInk) : (t.pageInk || '#1A1A1A'));
    ops.push({ t: 'rect', x: -d.b, y: -d.b, w: d.W + 2 * d.b, h: d.H + 2 * d.b, fill: bg });
    var c = content(d, page, index);
    (L.slots || []).forEach(function (fr, i) {
      var rect = L.bleed ? { x: -d.b, y: -d.b, w: d.W + 2 * d.b, h: d.H + 2 * d.b } : slotRect(c.r, fr, c.gap);
      var s = (page.slots || [])[i] || {};
      var p = photoOp(ops, rect, s, photos, warn, label);
      slots.push({ i: i, rect: rect, photo: s.photo || null, dpi: p ? p.dpi : null, img: p, o: fr[4] });
    });
    (L.texts || []).forEach(function (tx) {
      var val = (page.texts || {})[tx.key];
      var r = slotRect(c.r, tx.r, 0), st = textStyle(project, tx.role, (page.style || {})[tx.key]);
      if (val == null || val === '') { texts.push({ key: tx.key, rect: r, role: tx.role, empty: true }); return; }
      var tb = textBlock(d, r, val, st, st.align || tx.align, tx.valign, false);
      textOps(ops, texts, warn, label, st.color || ink, tx.key, tb, { font: st.font, rect: r, role: tx.role });
    });
    var orn = page.ornament || (L.ornament ? (t.ornament || 'rule') : 'none');
    if (orn && orn !== 'none' && L.kind === 'text') ornament(ops, orn, d.W / 2, c.r.y + c.r.h * 0.33, d.W, page.accent || t.accent || th.accent);
    return { w: d.W, h: d.H, b: d.b, safe: d.safe, ops: ops, slots: slots, texts: texts, warn: warn, layout: L.id, side: side(index), content: c.r };
  }
  function ornament(ops, kind, cx, cy, W, color) {
    var u = W / 210;
    if (kind === 'rule') ops.push({ t: 'rect', x: cx - 12 * u, y: cy, w: 24 * u, h: 0.6 * u, fill: color });
    else if (kind === 'dot') ops.push({ t: 'path', d: circle(0, 0, 1.6), fill: color, tx: cx, ty: cy, s: u });
    else if (kind === 'star') ops.push({ t: 'path', d: star(0, 0, 4, 1.7, 5), fill: color, tx: cx, ty: cy, s: u });
    else if (kind === 'sprig') artOps('sprig', cx - 8 * u, cy - 8 * u, 0.16 * u, ops, { accent: color, ink: color });
  }

  function coverTexts(project) {
    var t = project.cover || {};
    return { title: t.title != null ? t.title : (project.title || ''), subtitle: t.subtitle != null ? t.subtitle : (project.subtitle || ''), byline: t.byline || '' };
  }
  function renderFront(cfg, project, photos) {
    var d = dims(cfg, project), th = theme(project.templateId), cv = project.cover || {}, ops = [], slots = [], texts = [], warn = [];
    var style = cv.style || th.cover.style, bg = cv.bg || (project.theme || {}).bg || th.bg, ink = cv.ink || (project.theme || {}).ink || th.ink;
    var titleFont = cv.titleFont || (project.theme || {}).titleFont || th.title, bodyFont = cv.bodyFont || (project.theme || {}).bodyFont || th.body;
    var upper = cv.upper != null ? cv.upper : th.cover.upper, pos = cv.pos || th.cover.pos, art = cv.art !== undefined ? cv.art : th.cover.art;
    var W = d.W, H = d.H, s = d.safe, T = coverTexts(project), label = 'Front cover';
    ops.push({ t: 'rect', x: -d.b, y: -d.b, w: W + 2 * d.b, h: H + 2 * d.b, fill: bg });
    var tStyle = { font: titleFont, scale: cv.titleScale || 1, lh: 1.02, base: th.cover.big ? 0.26 : 0.15, fit: style === 'illustration' ? (pos === 'top' ? 1 : 0.78) : (th.cover.big ? 1 : (style === 'type' ? 0.8 : 0.72)) };
    var sStyle = { font: bodyFont, scale: cv.subScale || 1, lh: 1.25, base: style === 'illustration' ? 0.075 : 0.062 };
    var bStyle = { font: bodyFont, scale: 1, lh: 1.2, base: 0.036 };
    var titleR, subR, byR, align = cv.align || 'middle', ph = cv.photo || {};
    function photoSlot(rect) { var p = photoOp(ops, rect, ph, photos, warn, label); slots.push({ i: 0, rect: rect, photo: ph.photo || null, dpi: p ? p.dpi : null, img: p, o: '*' }); }
    if (style === 'photo-full') {
      photoSlot({ x: -d.b, y: -d.b, w: W + 2 * d.b, h: H + 2 * d.b });
      // title sits in a solid label inside the safe area, never directly over the photo
      var lh = H * 0.2; ops.push({ t: 'rect', x: s, y: H - s - lh, w: W - 2 * s, h: lh, fill: bg });
      titleR = { x: s + W * 0.05, y: H - s - lh + lh * 0.12, w: W - 2 * s - W * 0.1, h: lh * 0.5 }; subR = { x: titleR.x, y: titleR.y + titleR.h + lh * 0.04, w: titleR.w, h: lh * 0.2 }; byR = null; align = cv.align || 'start';
    } else if (style === 'photo-band') {
      photoSlot({ x: -d.b, y: -d.b, w: W + 2 * d.b, h: H * 0.7 + d.b });
      titleR = { x: s, y: H * 0.73, w: W - 2 * s, h: H * 0.14 }; subR = { x: s, y: H * 0.875, w: W - 2 * s, h: H * 0.05 }; byR = { x: s, y: H - s - H * 0.035, w: W - 2 * s, h: H * 0.035 };
    } else if (style === 'photo-frame') {
      var fw = W * 0.68, fh = H * 0.56; photoSlot({ x: (W - fw) / 2, y: H * 0.12, w: fw, h: fh });
      titleR = { x: s, y: H * 0.71, w: W - 2 * s, h: H * 0.13 }; subR = { x: s, y: H * 0.845, w: W - 2 * s, h: H * 0.05 }; byR = { x: s, y: H - s - H * 0.035, w: W - 2 * s, h: H * 0.035 };
    } else if (style === 'illustration') {
      var top = pos === 'top', as = Math.min(W * 0.7, H * 0.56), ax = (W - as) / 2, ay = top ? H - s - as - H * 0.02 : H * 0.12;
      var A = art && ART && ART.art[art];
      if (A && A.ground) { // scenes that stand on the bottom edge: full width, ground continues to the bleed
        var gs = Math.min((W + 2 * d.b) / 100, H * 0.8 / 100); ax = (W - 100 * gs) / 2; ay = H + d.b - 100 * gs;
        ops.push({ t: 'rect', x: -d.b, y: ay + A.ground.y * gs, w: W + 2 * d.b, h: H + d.b - (ay + A.ground.y * gs), fill: A.ground.c });
        as = 100 * gs;
      }
      if (art) artOps(art, ax, ay, as / 100, ops, palette(project, th));
      if (top) { titleR = { x: s * 0.6, y: s * 0.8, w: W - 1.2 * s, h: H * 0.2 }; subR = { x: s, y: s * 0.8 + H * 0.205, w: W - 2 * s, h: H * 0.05 }; byR = null; }
      else { titleR = { x: s, y: H * 0.72, w: W - 2 * s, h: H * 0.13 }; subR = { x: s, y: H * 0.86, w: W - 2 * s, h: H * 0.05 }; byR = { x: s, y: H - s - H * 0.03, w: W - 2 * s, h: H * 0.03 }; }
    } else { // type
      var big = th.cover.big;
      if (art) artOps(art, W / 2 - W * 0.14, H * 0.16, W * 0.28 / 100, ops, palette(project, th));
      titleR = big ? { x: s, y: s, w: W - 2 * s, h: H * 0.52 } : { x: s, y: H * 0.36, w: W - 2 * s, h: H * 0.22 };
      subR = big ? { x: s, y: s + H * 0.54, w: W - 2 * s, h: H * 0.06 } : { x: s * 1.5, y: H * 0.6, w: W - 3 * s, h: H * 0.06 };
      byR = { x: s, y: H - s - H * 0.035, w: W - 2 * s, h: H * 0.035 }; if (big) align = cv.align || 'start';
    }
    var tv = style === 'type' && !th.cover.big ? 'bottom' : (pos === 'top' && style === 'illustration' ? 'top' : 'middle');
    if (T.title) textOps(ops, texts, warn, label, ink, 'title', textBlock(d, titleR, T.title, tStyle, align, tv, upper), { font: titleFont, rect: titleR, role: 'title' }); else texts.push({ key: 'title', rect: titleR, role: 'title', empty: true });
    if (T.subtitle) textOps(ops, texts, warn, label, cv.subInk || ink, 'subtitle', textBlock(d, subR, T.subtitle, sStyle, align, 'top', false), { font: bodyFont, rect: subR, role: 'subtitle' }); else texts.push({ key: 'subtitle', rect: subR, role: 'subtitle', empty: true });
    if (byR) { if (T.byline) textOps(ops, texts, warn, label, ink, 'byline', textBlock(d, byR, T.byline, bStyle, align, 'bottom', false), { font: bodyFont, rect: byR, role: 'byline' }); else texts.push({ key: 'byline', rect: byR, role: 'byline', empty: true }); }
    return { w: W, h: H, b: d.b, safe: s, ops: ops, slots: slots, texts: texts, warn: warn, cover: style };
  }
  function renderBack(cfg, project, photos) {
    var d = dims(cfg, project), th = theme(project.templateId), cv = project.cover || {}, bk = cv.back || {}, ops = [], slots = [], texts = [], warn = [];
    var bg = bk.bg || cv.bg || (project.theme || {}).bg || th.bg, ink = bk.ink || cv.ink || (project.theme || {}).ink || th.ink, W = d.W, H = d.H, s = d.safe;
    ops.push({ t: 'rect', x: -d.b, y: -d.b, w: W + 2 * d.b, h: H + 2 * d.b, fill: bg });
    var style = bk.style || 'color';
    if (style === 'photo') { var r = { x: W * 0.25, y: H * 0.2, w: W * 0.5, h: H * 0.42 }, ph = bk.photo || {}; var p = photoOp(ops, r, ph, photos, warn, 'Back cover'); slots.push({ i: 0, rect: r, photo: ph.photo || null, dpi: p ? p.dpi : null, img: p, o: '*' }); }
    else if (style === 'art') { var a = cv.art !== undefined ? cv.art : th.cover.art; if (a) artOps(a, W / 2 - W * 0.15, H * 0.24, W * 0.3 / 100, ops, palette(project, th)); }
    var tr = { x: s * 1.6, y: H * 0.68, w: W - 3.2 * s, h: H * 0.16 };
    if (bk.text) textOps(ops, texts, warn, 'Back cover', ink, 'text', textBlock(d, tr, bk.text, { font: cv.bodyFont || (project.theme || {}).bodyFont || th.body, scale: 1, lh: 1.4, base: 0.042 }, 'middle', 'top', false), { font: cv.bodyFont || th.body, rect: tr, role: 'body' }); else texts.push({ key: 'text', rect: tr, role: 'body', empty: true });
    return { w: W, h: H, b: d.b, safe: s, ops: ops, slots: slots, texts: texts, warn: warn };
  }
  /** spine strip, width = spineMm, height = trim height (no bleed; the cover spread adds it) */
  function renderSpine(cfg, project) {
    var d = dims(cfg, project), th = theme(project.templateId), cv = project.cover || {}, sw = spineMm(cfg, project), ops = [], warn = [];
    var bg = (cv.spine && cv.spine.bg) || cv.bg || (project.theme || {}).bg || th.bg, ink = cv.ink || (project.theme || {}).ink || th.ink;
    ops.push({ t: 'rect', x: 0, y: 0, w: sw, h: d.H, fill: bg });
    var txt = cv.spine && cv.spine.text;
    if (txt && spineTextAllowed(cfg, project)) {
      var font = cv.titleFont || th.title, size = Math.min(sw * 0.55 * PT, 14), c = cleanText(font, txt), m = MET[font] || MET.inter;
      var len = measure(font, c.text, size) / PT, maxLen = d.H - 2 * d.safe;
      while (len > maxLen && size > 5) { size *= 0.94; len = measure(font, c.text, size) / PT; }
      var sm = size / PT, base = sw / 2 + (m.a - m.d) / 2000 * sm;
      ops.push({ t: 'text', text: c.text, x: d.H / 2, y: base, size: size, font: font, color: ink, anchor: 'middle', rot: 90, w0: sw, key: 'spine' });
      if (c.unsupported.length) warn.push({ level: 'low', code: 'glyph', msg: 'Spine: some characters are not available in the font: ' + c.unsupported.join(' ') });
    }
    return { w: sw, h: d.H, b: 0, ops: ops, slots: [], texts: [], warn: warn };
  }

  /* ---------------- automatic layout ---------------- */
  function score(o, pref) { if (pref === '*') return 1; if (o === pref) return 2; if (o === 's' || pref === 's') return 1; return -1; }
  function bestAssign(photosArr, L) { // brute-force small permutations for the best orientation fit
    var n = photosArr.length, idx = [], best = null, bestS = -1e9;
    for (var i = 0; i < n; i++) idx.push(i);
    function perm(a, k) {
      if (k === n) { var s = 0; for (var j = 0; j < n; j++) s += score(photosArr[a[j]].o, L.slots[j][4]) - Math.abs(a[j] - j) * 0.01; if (s > bestS) { bestS = s; best = a.slice(); } return; }
      for (var i2 = k; i2 < n; i2++) { var t = a[k]; a[k] = a[i2]; a[i2] = t; perm(a, k + 1); t = a[k]; a[k] = a[i2]; a[i2] = t; }
    }
    perm(idx, 0);
    return { order: best, score: bestS };
  }
  function suggestPages(cfg, project, nPhotos) {
    var f = format(cfg, project.formatId);
    return evenPages(cfg, f, Math.ceil(nPhotos / 2.4) + 2);
  }
  /** photos: [{id,w,h,taken,added}] in the customer's order. Returns new pages[] (keeps locked pages). */
  function autoLayout(cfg, project, photos, opts) {
    opts = opts || {};
    var R = rng(opts.seed || project.seed || 1), th = theme(project.templateId), d = dims(cfg, project);
    var total = project.pages && project.pages.length ? project.pages.length : evenPages(cfg, d.f, d.f.pages.default);
    var keep = {}; (project.pages || []).forEach(function (p, i) { if (p.locked && i < total) keep[i] = p; });
    var used = {}; Object.keys(keep).forEach(function (i) { (keep[i].slots || []).forEach(function (s) { if (s.photo) used[s.photo] = 1; }); });
    var coverId = project.cover && project.cover.photo && project.cover.photo.photo;
    var list = photos.filter(function (p) { return !used[p.id]; }).map(function (p) { return { id: p.id, w: p.w, h: p.h, o: orientOf(p.w, p.h), mp: p.w * p.h / 1e6, taken: p.taken || null }; });
    if (coverId && list.length > total * 1.6) list = list.filter(function (p) { return p.id !== coverId; });
    // sections from photo dates (only when most photos carry a capture date)
    var sections = [];
    if (project.sectionMode !== 'off') {
      var dated = list.filter(function (p) { return p.taken; }).length;
      if (dated >= Math.max(6, list.length * 0.7)) {
        var cur = null;
        list.forEach(function (p) { var t = p.taken ? Date.parse(p.taken) : null; if (!cur || (t && cur.last && t - cur.last > 3 * 864e5)) { cur = { start: t, last: t, items: [] }; sections.push(cur); } cur.items.push(p); if (t) cur.last = t; });
        if (sections.length < 2 || sections.length > 8 || sections.some(function (s) { return s.items.length < 3; })) sections = [];
      }
    }
    // slots available for photo pages
    var free = []; for (var i = 0; i < total; i++) if (!keep[i]) free.push(i);
    var plan = []; // sequence of {kind:'title'|'section'|'photos', ...}
    var wantTitle = !!(project.title || project.subtitle || project.dedication) && free.length > 4;
    if (wantTitle) plan.push({ kind: 'title' });
    var groups = sections.length && free.length - plan.length >= sections.length * 3 ? sections : [{ items: list }];
    var photoPages = free.length - plan.length - (groups.length > 1 ? groups.length : 0);
    if (photoPages < 1) { groups = [{ items: list }]; photoPages = free.length - plan.length; }
    var nAll = list.length;
    groups.forEach(function (g, gi) {
      if (groups.length > 1) plan.push({ kind: 'section', g: g });
      var share = gi === groups.length - 1 ? photoPages - plan.filter(function (x) { return x.kind === 'photos'; }).length : Math.max(1, Math.round(photoPages * g.items.length / Math.max(1, nAll)));
      var items = g.items.slice(), pagesLeft = share;
      while (pagesLeft > 0) {
        var n = items.length, avg = n / pagesLeft, k;
        if (n === 0) { plan.push({ kind: 'photos', items: [] }); pagesLeft--; continue; }
        var maxK = Math.min(6, n - (pagesLeft - 1)), minK = Math.max(1, n - (pagesLeft - 1) * 6);
        if (maxK < 1) maxK = 1;
        k = Math.round(avg + (R() - 0.5) * 1.6);
        var hero = items[0] && items[0].mp >= 6 && R() < 0.22;
        if (hero) k = 1;
        k = Math.max(minK, Math.min(maxK, Math.max(1, k)));
        plan.push({ kind: 'photos', items: items.splice(0, k) }); pagesLeft--;
      }
      if (items.length) { var last = plan[plan.length - 1]; while (items.length && last.items.length < 6) last.items.push(items.shift()); }
    });
    // realise pages
    var out = [], recent = [], fi = 0, dpiPx = function (p) { return Math.min(p.w, p.h); };
    var dens = th.density;
    var pages = new Array(total);
    Object.keys(keep).forEach(function (i) { pages[i] = keep[i]; });
    plan.forEach(function (st) {
      while (pages[free[fi]] && fi < free.length) fi++;
      var at = free[fi++]; if (at == null) return;
      var pg = { id: 'pg' + (opts.idSeed || '') + at + '_' + Math.floor(R() * 1e6).toString(36), layout: 'blank', slots: [], texts: {}, spacing: dens === 'airy' ? 'airy' : (dens === 'full' ? 'tight' : 'normal') };
      if (st.kind === 'title') { pg.layout = 'title-page'; pg.texts = { title: project.title || '', subtitle: project.subtitle || '', body: project.dedication || '' }; }
      else if (st.kind === 'section') {
        pg.layout = 'section';
        var g = st.g, a = g.start ? new Date(g.start) : null, b = g.last ? new Date(g.last) : null;
        pg.texts = { title: '', subtitle: a ? dateRange(a, b) : '' }; pg.inferred = !!a;
      } else if (!st.items.length) { pg.layout = 'blank'; }
      else {
        var k = st.items.length, cands = LAYOUTS.filter(function (l) { return l.group === k && l.kind !== 'text' && (!l.texts || l.id === 'two-quiet' || l.id === 'single-small'); });
        if (k === 1) {
          var p0 = st.items[0], big = dpiPx(p0) >= 2400;
          cands = cands.filter(function (l) { return l.id !== 'full-bleed' || big; });
          if (dens === 'airy') cands = cands.filter(function (l) { return l.id !== 'single' || cands.length === 1; });
        }
        if (dens === 'airy' && k === 2 && R() < 0.5) cands = cands.filter(function (l) { return l.id === 'two-quiet' || l.id === 'two-side'; });
        if (dens !== 'airy') cands = cands.filter(function (l) { return l.id !== 'two-quiet' || cands.length === 1; });
        var bestL = null, bestScore = -1e9, bestOrder = null;
        cands.forEach(function (l) {
          var a2 = bestAssign(st.items, l), sc = a2.score + R() * 1.5 - (recent.indexOf(l.id) >= 0 ? 3 : 0);
          if (sc > bestScore) { bestScore = sc; bestL = l; bestOrder = a2.order; }
        });
        pg.layout = bestL.id;
        pg.slots = bestOrder.map(function (ix) { var p = st.items[ix]; return { photo: p.id, zoom: 1, fx: 0.5, fy: p.o === 'p' ? 0.42 : 0.5 }; });
        recent.unshift(bestL.id); recent = recent.slice(0, 2);
      }
      pages[at] = pg;
    });
    for (var j = 0; j < total; j++) if (!pages[j]) pages[j] = { id: 'pgb' + j + '_' + Math.floor(R() * 1e6).toString(36), layout: 'blank', slots: [], texts: {}, spacing: 'normal' };
    return pages;
  }
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function dateRange(a, b) {
    if (!b || a.toDateString() === b.toDateString()) return a.getDate() + ' ' + MONTHS[a.getMonth()] + ' ' + a.getFullYear();
    if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) return a.getDate() + '–' + b.getDate() + ' ' + MONTHS[a.getMonth()] + ' ' + a.getFullYear();
    if (a.getFullYear() === b.getFullYear()) return a.getDate() + ' ' + MONTHS[a.getMonth()] + ' – ' + b.getDate() + ' ' + MONTHS[b.getMonth()] + ' ' + a.getFullYear();
    return MONTHS[a.getMonth()] + ' ' + a.getFullYear() + ' – ' + MONTHS[b.getMonth()] + ' ' + b.getFullYear();
  }
  /** re-fit a page's photos when its layout changes (keeps photos in order, extra ones go back to the tray) */
  function applyLayout(page, layoutId) {
    var L = LMAP[layoutId]; if (!L) return page;
    var photos = (page.slots || []).filter(function (s) { return s && s.photo; });
    var n = (L.slots || []).length, slots = [];
    for (var i = 0; i < n; i++) slots.push(photos[i] ? { photo: photos[i].photo, zoom: photos[i].zoom || 1, fx: photos[i].fx, fy: photos[i].fy } : {});
    page.layout = layoutId; page.slots = slots; page.texts = page.texts || {};
    return page;
  }

  /* ---------------- validation ---------------- */
  function validate(cfg, project, photos) {
    var errors = [], warnings = [], f = format(cfg, project.formatId), n = (project.pages || []).length;
    if (!f || f.enabled === false) errors.push({ code: 'format', msg: 'The selected book format is no longer available. Choose another format.' });
    if (f) {
      if (n < f.pages.min || n > f.pages.max) errors.push({ code: 'pages', msg: 'This format needs between ' + f.pages.min + ' and ' + f.pages.max + ' pages (this book has ' + n + ').' });
      if ((n - f.pages.min) % (f.pages.step || 2)) errors.push({ code: 'pages', msg: 'Page count must go up in steps of ' + (f.pages.step || 2) + '.' });
    }
    function check(r, where) {
      r.slots.forEach(function (s) { if (!s.photo) errors.push({ code: 'empty', where: where, msg: where.label + ': a photo frame is empty. Add a photo or choose a layout with fewer photos.' }); else if (!photos[s.photo]) errors.push({ code: 'missing', where: where, msg: where.label + ': a photo is missing from this device. Upload it again or replace it.' }); });
      r.warn.forEach(function (w) { w.where = where; warnings.push(w); });
    }
    if (!f) return { errors: errors, warnings: warnings };
    check(renderFront(cfg, project, photos), { kind: 'front', label: 'Front cover' });
    check(renderBack(cfg, project, photos), { kind: 'back', label: 'Back cover' });
    renderSpine(cfg, project).warn.forEach(function (w) { w.where = { kind: 'spine', label: 'Spine' }; warnings.push(w); });
    for (var i = 0; i < n; i++) check(renderPage(cfg, project, i, photos), { kind: 'page', index: i, label: 'Page ' + (i + 1) });
    var blanks = (project.pages || []).filter(function (p) { return p.layout === 'blank'; }).length;
    if (blanks > 2) warnings.push({ level: 'low', code: 'blank', msg: blanks + ' pages are blank. Add more photos or reduce the page count.' });
    var ct = coverTexts(project);
    if (!ct.title) warnings.push({ level: 'low', code: 'notitle', msg: 'The cover has no title.' });
    return { errors: errors, warnings: warnings };
  }

  /* ---------------- pricing (shared with the payment server) ---------------- */
  function num(v) { return typeof v === 'number' && isFinite(v) && v >= 0 ? v : null; }
  function priceRule(rule, pages) {
    if (!rule || num(rule.base) == null) return null;
    var extra = Math.max(0, pages - (rule.includedPages || 0));
    if (extra > 0 && num(rule.perExtraPage) == null) return null;
    return Math.round(rule.base + extra * (rule.perExtraPage || 0));
  }
  /** opts: {product:'digital'|'print', formatId, pages, binding, paper, quantity, delivery} */
  function quote(cfg, o) {
    var f = format(cfg, o.formatId), lines = [], missing = [];
    if (!f || f.id !== o.formatId || f.enabled === false) return { ok: false, code: 'format', msg: 'This format is not available.' };
    var pages = Math.round(Number(o.pages) || 0);
    if (pages < f.pages.min || pages > f.pages.max || (pages - f.pages.min) % (f.pages.step || 2)) return { ok: false, code: 'pages', msg: 'Page count is outside this format’s limits.' };
    if (o.product === 'digital') {
      if (!(cfg.digital && cfg.digital.enabled)) return { ok: false, code: 'unavailable', msg: 'Digital PDFs are not on sale right now.' };
      var p = priceRule(f.digital, pages);
      if (p == null) return { ok: false, code: 'price_not_set', msg: 'The digital price for this format has not been set yet.', missing: ['formats.' + f.id + '.digital'] };
      lines.push({ label: 'Digital PDF · ' + f.name + ' ' + f.size + ' · ' + pages + ' pages', amount: p });
      return { ok: true, product: 'digital', lines: lines, total: p, currency: cfg.currency || 'KES' };
    }
    if (o.product === 'print') {
      if (!f.print || !f.print.enabled) return { ok: false, code: 'unavailable', msg: 'Printed books are not available in this format yet.' };
      var b = (f.print.bindings || {})[o.binding]; if (!b || !(cfg.bindings || {})[o.binding]) return { ok: false, code: 'binding', msg: 'This binding is not available for this format.' };
      var paper = (cfg.papers || []).filter(function (x) { return x.id === o.paper && x.enabled !== false; })[0]; if (!paper) return { ok: false, code: 'paper', msg: 'Choose an available paper.' };
      var qty = Math.max(1, Math.min(cfg.maxQuantity || 10, Math.round(Number(o.quantity) || 1)));
      var unit = priceRule(b, pages); if (unit == null) missing.push('formats.' + f.id + '.print.bindings.' + o.binding);
      var pp = num(paper.perPage); if (pp == null) missing.push('papers.' + paper.id + '.perPage');
      var del = (cfg.delivery || []).filter(function (x) { return x.id === o.delivery && x.enabled !== false; })[0];
      if (!del) return { ok: false, code: 'delivery', msg: 'Choose a delivery option.' };
      if (num(del.price) == null) missing.push('delivery.' + del.id);
      if (missing.length) return { ok: false, code: 'price_not_set', msg: 'Some prices for this printed book have not been set yet.', missing: missing };
      var each = unit + Math.round(pp * pages);
      lines.push({ label: 'Printed book · ' + f.name + ' ' + f.size + ' · ' + cfg.bindings[o.binding].name + ' · ' + paper.name + ' · ' + pages + ' pages', amount: each, qty: qty });
      lines.push({ label: del.name, amount: del.price });
      return { ok: true, product: 'print', lines: lines, total: each * qty + del.price, quantity: qty, currency: cfg.currency || 'KES', needsAddress: !!del.needsAddress };
    }
    return { ok: false, code: 'product', msg: 'Unknown product.' };
  }
  /** cheapest configured "from" price for marketing copy; null when nothing is priced */
  function fromPrice(cfg, product) {
    var best = null;
    (cfg.formats || []).forEach(function (f) {
      if (f.enabled === false) return;
      if (product === 'digital') { var p = priceRule(f.digital, f.pages.min); if (p != null && (best == null || p < best)) best = p; }
      else if (f.print && f.print.enabled) Object.keys(f.print.bindings || {}).forEach(function (k) { var u = priceRule(f.print.bindings[k], f.pages.min); if (u != null && (best == null || u < best)) best = u; });
    });
    return best;
  }

  /* ---------------- canonical design (for version hashes) ---------------- */
  function stable(v) {
    if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
    if (v && typeof v === 'object') return '{' + Object.keys(v).sort().filter(function (k) { return v[k] !== undefined; }).map(function (k) { return JSON.stringify(k) + ':' + stable(v[k]); }).join(',') + '}';
    return JSON.stringify(v);
  }
  /** everything that affects the printed output, plus the content hash of every photo used */
  function canonical(project, photos) {
    var ids = {};
    function addSlot(s) { if (s && s.photo) ids[s.photo] = 1; }
    (project.pages || []).forEach(function (p) { (p.slots || []).forEach(addSlot); });
    var cv = project.cover || {}; addSlot(cv.photo); addSlot((cv.back || {}).photo);
    var hashes = {}; Object.keys(ids).sort().forEach(function (id) { hashes[id] = photos[id] ? photos[id].hash : 'missing'; });
    return stable({ s: 1, formatId: project.formatId, binding: project.binding, paper: project.paper, templateId: project.templateId, theme: project.theme || {}, cover: cv, pages: (project.pages || []).map(function (p) { return { layout: p.layout, slots: p.slots, texts: p.texts, style: p.style, bg: p.bg, ink: p.ink, spacing: p.spacing, ornament: p.ornament, accent: p.accent }; }), photos: hashes });
  }

  function circle(cx, cy, r) { return 'M' + (cx - r) + ' ' + cy + 'A' + r + ' ' + r + ' 0 1 0 ' + (cx + r) + ' ' + cy + 'A' + r + ' ' + r + ' 0 1 0 ' + (cx - r) + ' ' + cy + 'Z'; }
  function star(cx, cy, R, r, n) { var d = ''; for (var i = 0; i < n * 2; i++) { var a = Math.PI / n * i - Math.PI / 2, rr = i % 2 ? r : R; d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(2) + ' ' + (cy + Math.sin(a) * rr).toFixed(2); } return d + 'Z'; }

  return {
    PT: PT, FONTS: FONTS, LAYOUTS: LAYOUTS, LMAP: LMAP, THEMES: THEMES, COVER_STYLES: COVER_STYLES, BACK_STYLES: BACK_STYLES, ORNAMENTS: ORNAMENTS, SPACING: SPACING,
    theme: theme, format: format, evenPages: evenPages, spineMm: spineMm, spineTextAllowed: spineTextAllowed, dims: dims, side: side,
    measure: measure, wrap: wrap, cleanText: cleanText, place: place, orientOf: orientOf,
    renderPage: renderPage, renderFront: renderFront, renderBack: renderBack, renderSpine: renderSpine,
    autoLayout: autoLayout, suggestPages: suggestPages, applyLayout: applyLayout, validate: validate, coverTexts: coverTexts,
    quote: quote, fromPrice: fromPrice, canonical: canonical, artOps: artOps, stable: stable, rng: rng, dateRange: dateRange, circle: circle, star: star
  };
});
