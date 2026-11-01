/* ============================================================
   CIEL PHOTO BOOKS — landing page (/photobooks)
   Every cover and spread is drawn live by the same engine the
   studio uses, filled with sample photos (Unsplash, credited on the
   page). Customer photos are never shown here.
   ============================================================ */
(function () {
  'use strict';
  var E = window.PBE, SV = window.PBS, SM = window.PBSamples, C = (window.CIEL && CIEL.photobooks) || {};
  if (!E || !SV || !SM) return;
  SV.injectFonts();
  var STUDIO = '/photobooks/studio';
  var used = {};
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function tpl(id) { return (C.templates || []).filter(function (t) { return t.id === id; })[0] || { id: id, name: id }; }
  function photoCover(id) { var st = SM.coverStyle(id) || E.theme(id).cover.style; return E.COVER_STYLES.filter(function (x) { return x.id === st; })[0].photo; }
  // designs with a photo on the cover first, then the illustrated ones
  function visible() { var l = (C.templates || []).filter(function (t) { return t.visible !== false && E.THEMES[t.id]; }); return l.filter(function (t) { return photoCover(t.id); }).concat(l.filter(function (t) { return !photoCover(t.id); })); }
  function catName(t) { return t.collection === 'destinations' ? 'Destination collection' : (((C.categories || []).filter(function (c) { return c.id === t.category; })[0]) || {}).name || ''; }
  function urlW(w) { return function (id) { used[id] = 1; return SM.url(SM.get(id), w); }; }
  var cache = {};
  function book(tid, fmt) { var k = tid + '|' + (fmt || 'sq21'); return cache[k] || (cache[k] = SM.book(E, C, tid, fmt || 'sq21')); }
  function cover(tid, fmt, w) { var b = book(tid, fmt); return SV.svg(E.renderFront(C, b.p, b.photos), { url: urlW(w || 600), empty: 'sample', label: tpl(tid).name + ' photo book cover' }); }
  function page(tid, fmt, i, w) { var b = book(tid, fmt); return SV.svg(E.renderPage(C, b.p, i, b.photos), { url: urlW(w || 800), empty: 'sample' }); }
  /** spreads that show photos on both sides (skips the title page) */
  function goodSpreads(tid, fmt) {
    var b = book(tid, fmt), n = b.p.pages.length, out = [];
    function has(i) { var pg = b.p.pages[i]; return pg && (pg.slots || []).some(function (s) { return s && s.photo; }); }
    for (var s = 1; 2 * s < n; s++) if (has(2 * s - 1) && has(2 * s)) out.push(s);
    return out;
  }
  function spread(tid, fmt, s, w) { return '<div class="pbs">' + [2 * s - 1, 2 * s].map(function (i) { return '<div class="pbs__pg">' + page(tid, fmt, i, w) + '</div>'; }).join('') + '</div>'; }
  function startUrl(tid, fmt) { return STUDIO + '#/new?t=' + encodeURIComponent(tid) + (fmt ? '&f=' + fmt : '') + '&go=1'; }

  /* ---------- hero: an open book with real photos, three closed books in front ---------- */
  var hero = document.getElementById('pbHero');
  if (hero) {
    var hs = goodSpreads('family-table', 'ls28')[0] || 1;
    hero.innerHTML =
      '<div class="pbh__spread" aria-hidden="true">' + [2 * hs - 1, 2 * hs].map(function (i) { return '<div class="pbh__pg">' + page('family-table', 'ls28', i, 900) + '</div>'; }).join('') + '</div>' +
      '<div class="pbh__bk pbh__bk--1">' + cover('love-letter') + '</div>' +
      '<div class="pbh__bk pbh__bk--2">' + cover('ivory-vows', 'a4p') + '</div>' +
      '<div class="pbh__bk pbh__bk--3">' + cover('zanzibar-blue') + '</div>';
  }

  /* ---------- how it works, with pictures ---------- */
  var h1 = document.getElementById('pbHow1'), h2 = document.getElementById('pbHow2'), h3 = document.getElementById('pbHow3');
  if (h1) h1.innerHTML = '<div class="pbw-fan">' + ['first-year', 'good-company', 'portfolio-mono'].map(function (t) { return '<span>' + cover(t, 'sq21', 400) + '</span>'; }).join('') + '</div>';
  if (h2) h2.innerHTML = '<div class="pbw-photos">' + SM.forTemplate('family-table', 6, true).map(function (m) { used[m.id] = 1; return '<img loading="lazy" alt="" src="' + esc(SM.url(m, 260)) + '">'; }).join('') + '<i>+</i></div>';
  if (h3) { var s3 = goodSpreads('good-company', 'sq21')[1] || 2; h3.innerHTML = spread('good-company', 'sq21', s3, 500); }

  /* ---------- designs: start from a finished book ---------- */
  var grid = document.getElementById('pbGrid'), filters = document.getElementById('pbFilters'), cat = 'all';
  function drawGrid() {
    var list = visible().filter(function (t) { return cat === 'all' || t.category === cat || t.collection === cat; });
    grid.innerHTML = list.map(function (t) {
      var strip = SM.forTemplate(t.id, 4, true);
      strip.forEach(function (m) { used[m.id] = 1; });
      return '<article class="pbt"><button type="button" class="pbt__cov" data-prev="' + t.id + '" aria-label="Look inside ' + esc(t.name) + '"><span class="pbt__book">' + cover(t.id) + '</span><span class="pbt__peek">Look inside</span></button>' +
        '<div class="pbt__strip" aria-hidden="true">' + strip.map(function (m) { return '<img loading="lazy" alt="" src="' + esc(SM.url(m, 240)) + '">'; }).join('') + '</div>' +
        '<div class="pbt__b"><div class="pbt__cat"><span class="brk">‹</span> ' + esc(catName(t)) + '</div><h3>' + esc(t.name) + '</h3><p>' + esc(t.desc || '') + '</p>' +
        '<div class="pbt__a"><a class="btn btn--p btn--sm" href="' + startUrl(t.id) + '">Start with this design</a><button type="button" class="pbt__pv" data-prev="' + t.id + '">Look inside</button></div></div></article>';
    }).join('');
    credits();
  }
  if (grid) {
    var cats = (C.categories || []).filter(function (c) { return visible().some(function (t) { return t.category === c.id; }); });
    filters.innerHTML = '<button type="button" class="gfilter on" data-cat="all">All designs</button><button type="button" class="gfilter" data-cat="destinations">Destinations</button>' + cats.map(function (c) { return '<button type="button" class="gfilter" data-cat="' + c.id + '">' + esc(c.name) + '</button>'; }).join('');
    filters.addEventListener('click', function (e) { var b = e.target.closest('[data-cat]'); if (!b) return; cat = b.getAttribute('data-cat'); filters.querySelectorAll('.gfilter').forEach(function (x) { x.classList.toggle('on', x === b); }); drawGrid(); });
    drawGrid();
  }

  /* ---------- look inside ---------- */
  var dlg = document.getElementById('pbDlg');
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-prev]'); if (!b || !dlg) return;
    var id = b.getAttribute('data-prev'), t = tpl(id), sps = goodSpreads(id, 'sq21').slice(0, 4);
    dlg.querySelector('.pbd__body').innerHTML = '<div class="pbd__grid"><div class="pbd__cov">' + cover(id) + '</div><div><p class="pbd__eb"><span class="brk">‹</span> ' + esc(catName(t)) + '</p><h2>' + esc(t.name) + '</h2><p>' + esc(t.desc || '') + '</p>' +
      '<p class="pbd__note">Shown with sample photos. When you start, the book opens exactly like this — add your photos and they replace the samples automatically. Change the layouts, text, colours and cover any time.</p>' +
      '<a class="btn btn--p btn--lg" href="' + startUrl(id) + '">Start with this design</a></div></div>' +
      '<h3 class="pbd__h3">Inside the book</h3><div class="pbd__spreads">' + sps.map(function (s) { return spread(id, 'sq21', s, 700); }).join('') + '</div>';
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    dlg.scrollTop = 0; credits();
  });
  if (dlg) dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target.closest('[data-close]')) { if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); } });

  /* ---------- example books ---------- */
  var ex = document.getElementById('pbExamples');
  if (ex) {
    var books = [
      { tid: 'ivory-vows', fmt: 'sq21', label: 'A wedding album', note: 'Ivory Vows · Square 21 cm' },
      { tid: 'family-table', fmt: 'sq21', label: 'Family memories', note: 'Family Table · Square 21 cm' },
      { tid: 'diani-shore', fmt: 'ls28', label: 'A week at the coast', note: 'Diani Shore · Landscape' }
    ];
    ex.innerHTML = books.map(function (b, k) {
      var sps = goodSpreads(b.tid, b.fmt);
      return '<figure class="pbx' + (k % 2 ? ' pbx--rev' : '') + '"><div class="pbx__row"><div class="pbx__cov' + (b.fmt === 'ls28' ? ' pbx__cov--ls' : '') + '">' + cover(b.tid, b.fmt) + '</div><div class="pbx__sp">' + spread(b.tid, b.fmt, sps[0] || 1, 900) + (sps[2] ? spread(b.tid, b.fmt, sps[2], 700) : '') + '</div></div>' +
        '<figcaption><b>' + esc(b.label) + '</b><span>' + esc(b.note) + '</span><a href="' + startUrl(b.tid, b.fmt) + '">Start with this book →</a></figcaption></figure>';
    }).join('');
  }
  var occ = document.getElementById('pbOcc');
  if (occ) {
    var O = [['love-letter', 'Love stories'], ['ivory-vows', 'Weddings'], ['first-year', "Baby's first year"], ['family-table', 'Family'], ['cap-and-gown', 'Graduations'], ['good-company', 'Friends'], ['crayon-days', 'Childhood'], ['year-in-review', 'Year in review']];
    occ.innerHTML = O.filter(function (o) { var t = tpl(o[0]); return t && t.visible !== false && E.THEMES[o[0]]; }).map(function (o) { return '<a class="pbo" href="' + startUrl(o[0]) + '"><span class="pbo__c">' + cover(o[0], 'sq21', 400) + '</span><b>' + esc(o[1]) + '</b></a>'; }).join('');
  }

  /* ---------- photo credits (every sample photo shown on this page) ---------- */
  function credits() {
    var el = document.getElementById('pbCredits'); if (!el) return;
    var list = SM.credits(Object.keys(used));
    el.innerHTML = list.length ? 'Sample photos via <a href="https://unsplash.com/?utm_source=ciel_africa&amp;utm_medium=referral" target="_blank" rel="noopener">Unsplash</a> by ' + list.map(function (c) { return '<a href="' + esc(c.link) + '" target="_blank" rel="noopener">' + esc(c.name) + '</a>'; }).join(', ') + '. They illustrate the designs and can’t be printed.' : '';
  }
  credits();

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
