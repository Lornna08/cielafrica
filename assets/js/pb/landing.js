/* ============================================================
   CIEL PHOTO BOOKS — landing page (/photo-books)
   Covers and example spreads are drawn live by the same engine the
   studio uses. Example photos are licensed Unsplash images (credited
   on the page), never customer photos.
   ============================================================ */
(function () {
  'use strict';
  var E = window.PBE, SV = window.PBS, C = (window.CIEL && CIEL.photobooks) || {};
  if (!E || !SV) return;
  SV.injectFonts();
  var DEMO = { coast: [1000, 667], dhow: [1000, 750], deck: [1000, 800], palms: [800, 1000], run: [1000, 667], beach: [1000, 668], pf1: [667, 1000], pf2: [615, 1000], pf3: [667, 1000], pf4: [667, 1000], pf5: [743, 1000], pf6: [710, 1000], pf7: [669, 1000], pf8: [900, 599] };
  var PH = {}; Object.keys(DEMO).forEach(function (k) { PH[k] = { id: k, w: DEMO[k][0] * 4, h: DEMO[k][1] * 4, hash: k }; });
  var url = function (id) { return '/assets/img/pb-demo/' + id + '.webp'; };
  var SAMPLE = { 'zanzibar-blue': 'Zanzibar', 'zanzibar-night': 'Zanzibar', 'paris-rose': 'Paris', 'cape-coral': 'Cape Town', 'amsterdam-canal': 'Amsterdam', 'diani-shore': 'Diani', 'savanna-gold': 'Savanna', 'lamu-dhow': 'Lamu', 'love-letter': 'Us', 'ivory-vows': 'The Wedding', 'family-table': 'Family', 'crayon-days': 'Growing Up', 'first-year': 'The First Year', 'confetti': 'Celebrate', 'cap-and-gown': 'The Graduate', 'good-company': 'Good Company', 'year-in-review': '2026', 'portfolio-mono': 'Portfolio', 'gallery-white': 'Selected Work', 'blank': 'Your Title' };
  var SUB = { 'year-in-review': 'A year in pictures', 'zanzibar-blue': '2026', 'paris-rose': '2026', 'diani-shore': '2026' };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function tpl(id) { return (C.templates || []).filter(function (t) { return t.id === id; })[0]; }
  function visible() { return (C.templates || []).filter(function (t) { return t.visible !== false && E.THEMES[t.id]; }); }
  function shade(hex) { var n = parseInt(String(hex).slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255, l = (r * 299 + g * 587 + b * 114) / 1000, k = l > 140 ? -34 : 36; function c(v) { return Math.max(0, Math.min(255, v + k)); } return 'rgb(' + c(r) + ',' + c(g) + ',' + c(b) + ')'; }
  function project(tid, fmt, photoIds, extra) {
    var p = Object.assign({ formatId: fmt || 'sq21', templateId: tid, title: SAMPLE[tid] || '', subtitle: SUB[tid] || '', pages: [], cover: {}, theme: {}, binding: 'hardcover', paper: 'silk170' }, extra || {});
    var th = E.theme(tid), style = (p.cover.style || th.cover.style);
    if (photoIds && photoIds.length && E.COVER_STYLES.filter(function (s) { return s.id === style; })[0].photo) p.cover.photo = { photo: photoIds[0], fx: 0.5, fy: 0.45 };
    return p;
  }
  function cover(tid, fmt, photoIds, extra) {
    var p = project(tid, fmt, photoIds, extra), th = E.theme(tid);
    return SV.svg(E.renderFront(C, p, PH), { url: url, empty: 'sample', sampleFill: th.page === '#FFFFFF' && th.bg === '#FFFFFF' ? '#E4E1DA' : shade(th.bg), label: (tpl(tid) || {}).name + ' cover design' });
  }
  function spreads(tid, fmt, ids, n, extra) {
    var p = project(tid, fmt, ids, extra);
    p.pages = new Array(20).fill(0).map(function () { return {}; });
    p.pages = E.autoLayout(C, p, ids.map(function (k) { return PH[k]; }), { seed: 7 });
    var out = [];
    for (var s = 1; s <= n; s++) out.push([2 * s - 1, 2 * s].map(function (i) { return SV.svg(E.renderPage(C, p, i, PH), { url: url, empty: 'sample', sampleFill: '#E4E1DA' }); }));
    return out;
  }

  /* ---------- hero ---------- */
  var hero = document.getElementById('pbHero');
  if (hero) {
    hero.innerHTML =
      '<div class="pbh__spread" aria-hidden="true">' + spreads('diani-shore', 'ls28', ['coast', 'palms', 'beach', 'dhow', 'deck', 'run'], 1)[0].map(function (s) { return '<div class="pbh__pg">' + s + '</div>'; }).join('') + '</div>' +
      '<div class="pbh__bk pbh__bk--1">' + cover('zanzibar-blue') + '</div>' +
      '<div class="pbh__bk pbh__bk--2 pbh__bk--tall">' + cover('paris-rose', 'a4p') + '</div>' +
      '<div class="pbh__bk pbh__bk--3">' + cover('portfolio-mono', 'sq21', ['pf3']) + '</div>';
  }

  /* ---------- gallery ---------- */
  var grid = document.getElementById('pbGrid'), filters = document.getElementById('pbFilters'), cat = 'all';
  function photoFor(t) { return { 'portfolio-mono': ['pf1'], 'gallery-white': ['pf6'], 'family-table': ['palms'], 'good-company': ['run'], 'love-letter': ['dhow'], 'first-year': ['beach'] }[t.id]; }
  function drawGrid() {
    var list = visible().filter(function (t) { return cat === 'all' || t.category === cat || t.collection === cat; });
    grid.innerHTML = list.map(function (t) {
      var th = E.theme(t.id), cn = ((C.categories || []).filter(function (c) { return c.id === t.category; })[0] || {}).name || '';
      return '<article class="pbt"><button type="button" class="pbt__cov" data-prev="' + t.id + '" aria-label="Preview ' + esc(t.name) + '">' + cover(t.id, 'sq21', photoFor(t)) + '</button><div class="pbt__b"><div class="pbt__cat"><span class="brk">‹</span> ' + esc(t.collection === 'destinations' ? 'Destination collection' : cn) + '</div><h3>' + esc(t.name) + '</h3><p>' + esc(t.desc) + '</p><div class="pbt__sw">' + [th.bg, th.accent, th.ink, th.page].map(function (c) { return '<i style="background:' + c + '"></i>'; }).join('') + '<span>' + esc((t.tags || []).join(' · ')) + '</span></div><div class="pbt__a"><a class="btn btn--dark btn--sm" href="/photo-books/studio#/new?t=' + t.id + '">Use this design</a><button type="button" class="pbt__pv" data-prev="' + t.id + '">Preview</button></div></div></article>';
    }).join('');
  }
  if (grid) {
    var cats = (C.categories || []).filter(function (c) { return visible().some(function (t) { return t.category === c.id; }); });
    filters.innerHTML = '<button type="button" class="gfilter on" data-cat="all">All designs</button><button type="button" class="gfilter" data-cat="destinations">Destination collection</button>' + cats.map(function (c) { return '<button type="button" class="gfilter" data-cat="' + c.id + '">' + esc(c.name) + '</button>'; }).join('');
    filters.addEventListener('click', function (e) { var b = e.target.closest('[data-cat]'); if (!b) return; cat = b.getAttribute('data-cat'); filters.querySelectorAll('.gfilter').forEach(function (x) { x.classList.toggle('on', x === b); }); drawGrid(); });
    drawGrid();
  }

  /* ---------- preview dialog ---------- */
  var dlg = document.getElementById('pbDlg');
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-prev]'); if (!b || !dlg) return;
    var id = b.getAttribute('data-prev'), t = tpl(id), ids = (photoFor(t) || []).concat(['coast', 'palms', 'beach', 'dhow', 'deck', 'run', 'pf2', 'pf4']);
    if (t.category === 'portfolio' || t.category === 'minimal') ids = ['pf1', 'pf2', 'pf3', 'pf4', 'pf5', 'pf6', 'pf7', 'pf8'];
    var sp = spreads(id, 'sq21', ids, 2);
    dlg.querySelector('.pbd__body').innerHTML = '<div class="pbd__grid"><div class="pbd__cov">' + cover(id, 'sq21', photoFor(t)) + '</div><div><p class="pbd__eb"><span class="brk">‹</span> ' + esc(t.collection === 'destinations' ? 'Destination collection' : (((C.categories || []).filter(function (c) { return c.id === t.category; })[0] || {}).name || '')) + '</p><h2>' + esc(t.name) + '</h2><p>' + esc(t.desc) + '</p><p class="pbd__note">The sample title and photos are placeholders. Your book uses your own title, words and photographs — and you can change every colour, font and layout.</p><a class="btn btn--p" href="/photo-books/studio#/new?t=' + id + '">Use this design</a></div></div><h3 class="pbd__h3">Inside pages (example)</h3><div class="pbd__spreads">' + sp.map(function (s) { return '<div class="pbs">' + s.map(function (x) { return '<div class="pbs__pg">' + x + '</div>'; }).join('') + '</div>'; }).join('') + '</div>';
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  });
  if (dlg) { dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target.closest('[data-close]')) dlg.close ? dlg.close() : dlg.removeAttribute('open'); }); }

  /* ---------- example books ---------- */
  var ex = document.getElementById('pbExamples');
  if (ex) {
    var books = [
      { tid: 'diani-shore', fmt: 'ls28', ids: ['coast', 'beach', 'palms', 'dhow', 'deck', 'run'], label: 'A week at the coast', note: 'Destination collection · Landscape' },
      { tid: 'portfolio-mono', fmt: 'sq21', ids: ['pf1', 'pf2', 'pf3', 'pf4', 'pf5', 'pf6', 'pf7', 'pf8'], label: 'A photography portfolio', note: 'Portfolio Mono · Square', extra: { title: 'Portfolio', subtitle: 'Selected portraits' } }
    ];
    ex.innerHTML = books.map(function (b) {
      var sp = spreads(b.tid, b.fmt, b.ids, 2, b.extra)[1];
      return '<figure class="pbx"><div class="pbx__row"><div class="pbx__cov' + (b.fmt === 'ls28' ? ' pbx__cov--ls' : '') + '">' + cover(b.tid, b.fmt, b.ids, b.extra) + '</div><div class="pbs pbs--lg">' + sp.map(function (x) { return '<div class="pbs__pg">' + x + '</div>'; }).join('') + '</div></div><figcaption><b>' + esc(b.label) + '</b><span>' + esc(b.note) + ' · laid out automatically, then edited</span></figcaption></figure>';
    }).join('');
  }
  var occ = document.getElementById('pbOcc');
  if (occ) {
    var O = [['love-letter', 'Love stories', ['dhow']], ['ivory-vows', 'Weddings'], ['first-year', "Baby's first year", ['beach']], ['family-table', 'Family memories', ['palms']], ['cap-and-gown', 'Graduations'], ['confetti', 'Birthdays'], ['crayon-days', 'Childhood'], ['year-in-review', 'Year in review']];
    occ.innerHTML = O.filter(function (o) { var t = tpl(o[0]); return t && t.visible !== false; }).map(function (o) { return '<a class="pbo" href="/photo-books/studio#/new?t=' + o[0] + '"><span class="pbo__c">' + cover(o[0], 'sq21', o[2]) + '</span><b>' + esc(o[1]) + '</b></a>'; }).join('');
  }

  /* ---------- pricing from configuration ---------- */
  var pr = document.getElementById('pbPricing');
  if (pr) {
    var cur = C.currency || 'KES', fmt = function (n) { return cur + ' ' + Number(n).toLocaleString('en-KE'); };
    var dFrom = E.fromPrice(C, 'digital'), pFrom = E.fromPrice(C, 'print'), printOn = (C.formats || []).some(function (f) { return f.enabled !== false && f.print && f.print.enabled; });
    var rows = (C.formats || []).filter(function (f) { return f.enabled !== false; }).map(function (f) {
      var d = E.quote(C, { product: 'digital', formatId: f.id, pages: f.pages.min });
      var pb = f.print && f.print.enabled ? Object.keys(f.print.bindings || {}).map(function (k) { var r = f.print.bindings[k]; return r && typeof r.base === 'number' ? (C.bindings[k] || {}).name + ' from ' + fmt(r.base) : null; }).filter(Boolean) : [];
      return '<tr><th scope="row">' + esc(f.name) + '<span>' + esc(f.size) + '</span></th><td>' + f.pages.min + '–' + f.pages.max + '</td><td>' + (d.ok ? 'From ' + fmt(d.total) : '<em>Price coming soon</em>') + '</td><td>' + (pb.length ? esc(pb.join(' · ')) : '<em>' + (printOn ? 'Not in this size yet' : 'Coming soon') + '</em>') + '</td></tr>';
    }).join('');
    pr.innerHTML = '<div class="pbp__cards"><div class="pbp__c"><h3>Digital photo book</h3><p class="pbp__price">' + (dFrom != null ? 'From ' + fmt(dFrom) : 'Price coming soon') + '</p><p>A print-ready, high-resolution PDF of your finished book: every page, front and back cover. Download it straight after payment.</p></div><div class="pbp__c pbp__c--dark"><h3>Printed photo book</h3><p class="pbp__price">' + (pFrom != null ? 'From ' + fmt(pFrom) : (printOn ? 'See sizes below' : 'Coming soon')) + '</p><p>Printed and bound by Ciel Africa in Kenya, then collected in Nairobi or delivered. ' + (printOn ? 'Delivery is priced at checkout.' : 'We’re finalising paper and binding with our printer — you can design and preview now.') + '</p></div></div>' +
      '<div class="pbp__tw"><table class="pbp__t"><thead><tr><th>Format</th><th>Pages</th><th>Digital PDF</th><th>Printed</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<p class="pbp__n">Designing and previewing is free. You only pay when you order, and the final price is always shown before you pay.' + (dFrom == null ? ' Prices will appear here as soon as they’re published.' : '') + '</p>';
  }
  var pt = document.getElementById('pbPrintNote'); if (pt) pt.textContent = (C.formats || []).some(function (f) { return f.enabled !== false && f.print && f.print.enabled; }) ? 'Digital PDF or printed in Kenya' : 'Digital PDF now · printed books coming soon';
})();
