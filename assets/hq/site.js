/* ============================================================
   CIEL HQ — Website: edit cielafrica.com and publish it.
   Homepage (hero, sections, announcement), menus & footer,
   prices & visibility (products, templates, Photo Books),
   drafts saved to the server, publish history and restore.
   Publishing commits the real files to GitHub; Vercel deploys them.
   ============================================================ */
(function () {
  var H, C = window.SiteCMS;
  var W = { loaded: false, tab: 'home', dev: 'desktop', dirty: false, saving: false };
  function esc(s) { return H.esc(s); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function txt(url) { return fetch(url + (url.indexOf('?') < 0 ? '?' : '&') + 'hq=' + Date.now(), { cache: 'no-store', credentials: 'same-origin' }).then(function (r) { if (!r.ok) throw new Error(url + ' ' + r.status); return r.text(); }); }
  function evalData(js) { var w = {}; try { new Function('window', js)(w); } catch (e) { } return (w.CIEL) || {}; }
  function money(n) { return 'KES ' + Math.round(+n || 0).toLocaleString('en-KE'); }

  /* ---------- load everything once ---------- */
  function load() {
    return Promise.all([txt('/index.html'), txt('/data/site.json').then(JSON.parse, function () { return null; }), txt('/data/products.js'), txt('/data/templates.js'), txt('/data/photobooks.js'), H.api('/api/hq?route=site-draft').catch(function () { return {}; }), H.api('/api/hq?route=site-status').catch(function () { return {}; })])
      .then(function (r) {
        W.index = r[0]; W.status = r[6] || {};
        W.base = r[1] && r[1].hero ? r[1] : C.extract(r[0]);
        var pd = evalData(r[2]), td = evalData(r[3]);
        W.products = (pd.products || []).filter(function (p) { return p.id !== 'prd-test'; }); W.pcats = (pd.productCategories || []).filter(function (c) { return c !== 'All'; });
        W.templates = td.templates || []; W.tcats = (td.templateCategories || []).filter(function (c) { return c !== 'All'; });
        W.pbBase = C.readPhotoBooks(r[4]);
        /* just published from here: the new prices, until the live file catches up */
        if (W.pbPublished && JSON.stringify(W.pbBase) !== JSON.stringify(W.pbPublished)) W.pbBase = clone(W.pbPublished); else W.pbPublished = null;
        var d = r[5] && r[5].draft;
        W.model = d && d.model ? d.model : clone(W.base);
        W.items = d && d.items ? d.items : { products: {}, templates: {} };
        W.pb = d && d.photobooks && d.photobooks.tiers ? d.photobooks : clone(W.pbBase); /* drafts from before per-size prices are ignored */
        W.uploads = d && d.uploads ? d.uploads : {};
        W.draftAt = d && d.at; W.loaded = true;
      });
  }
  function changed() { W.dirty = true; status(); clearTimeout(W.t); W.t = setTimeout(saveDraft, 1800); if (W.tab !== 'prices') preview(); }
  function saveDraft() {
    W.saving = true; status();
    return H.api('/api/hq?route=site-draft-save', { model: W.model, items: W.items, photobooks: W.pb, uploads: W.uploads }).then(function (r) { W.draftAt = r.at; W.dirty = false; W.saving = false; status(); }, function (e) { W.saving = false; status(e.message); });
  }
  function status(err) {
    var el = document.getElementById('wsSt'); if (!el) return;
    el.className = 'ws-st' + (err ? ' is-err' : W.dirty || W.saving ? ' is-busy' : W.draftAt ? ' is-draft' : '');
    el.textContent = err ? 'Couldn’t save: ' + err : W.saving ? 'Saving draft…' : W.dirty ? 'Unsaved changes' : W.draftAt ? 'Draft saved · not published yet' : 'Matches the live site';
  }

  /* ---------- preview ---------- */
  function preview() {
    var f = document.getElementById('wsPrev'); if (!f) return;
    clearTimeout(W.pt); W.pt = setTimeout(function () {
      var h = C.apply(W.index, W.model, 'index.html').replace('<head>', '<head><base href="/">');
      var y = 0; try { y = f.contentWindow.scrollY; } catch (e) { }
      f.onload = function () { try { f.contentWindow.scrollTo(0, y); f.contentDocument.querySelectorAll('[data-r]').forEach(function (x) { x.classList.add('in', 'is-in'); }); } catch (e) { } };
      f.srcdoc = h;
    }, 350);
  }

  /* ---------- shell ---------- */
  var TABS = [['home', 'Homepage'], ['menus', 'Menus & footer'], ['prices', 'Prices & visibility'], ['history', 'Publish history']];
  function render(tab) {
    W.tab = tab || W.tab;
    var b = H.body('<div class="ws"><p class="muted">Loading the live website…</p></div>');
    (W.loaded ? Promise.resolve() : load()).then(function () { draw(); }, function (e) { b.innerHTML = '<div class="card card__b"><b>Couldn’t load the website</b><p class="muted">' + esc(e.message) + '</p></div>'; });
  }
  function draw() {
    var gh = W.status.github;
    var b = H.body('<div class="ws">' +
      (gh === false ? '<div class="ws-warn"><b>Publishing is switched off.</b> You can edit and save drafts now. To publish, add <code>GITHUB_TOKEN</code> in Vercel (see <a href="#settings">Setup</a>).</div>' : '') +
      '<div class="ws-top"><div class="tabs" id="wsTabs">' + TABS.map(function (t) { return '<button data-t="' + t[0] + '"' + (W.tab === t[0] ? ' class="is-on"' : '') + '>' + t[1] + '</button>'; }).join('') + '</div><span id="wsSt" class="ws-st"></span>' +
      '<button class="b b--sm" id="wsDiscard">Discard draft</button><button class="b b--p" id="wsPub"' + (gh === false ? ' disabled title="Add GITHUB_TOKEN first"' : '') + '>Publish to cielafrica.com</button></div>' +
      '<div class="ws-main' + (W.tab === 'prices' || W.tab === 'history' ? ' is-wide' : '') + '"><div class="ws-form" id="wsForm"></div>' +
      (W.tab === 'prices' || W.tab === 'history' ? '' : '<div class="ws-pv"><div class="ws-pvbar"><div class="tabs" id="wsDev">' + [['desktop', 'Desktop'], ['tablet', 'Tablet'], ['mobile', 'Phone']].map(function (d) { return '<button data-d="' + d[0] + '"' + (W.dev === d[0] ? ' class="is-on"' : '') + '>' + d[1] + '</button>'; }).join('') + '</div><span class="muted" style="font-size:.78rem">Preview of your draft</span></div><div class="ws-frame ws-frame--' + W.dev + '"><iframe id="wsPrev" title="Website preview"></iframe></div></div>') +
      '</div></div>');
    b.querySelectorAll('#wsTabs [data-t]').forEach(function (x) { x.onclick = function () { location.hash = '#website/' + x.getAttribute('data-t'); }; });
    b.querySelectorAll('#wsDev [data-d]').forEach(function (x) { x.onclick = function () { W.dev = x.getAttribute('data-d'); draw(); }; });
    b.querySelector('#wsPub').onclick = publish;
    b.querySelector('#wsDiscard').onclick = function () { if (!confirm('Discard all unpublished changes and go back to what is live?')) return; H.api('/api/hq?route=site-draft-save', { clear: true }).then(function () { W.model = clone(W.base); W.items = { products: {}, templates: {} }; W.pb = clone(W.pbBase); W.uploads = {}; W.draftAt = null; W.dirty = false; draw(); H.toast('Draft discarded'); }); };
    var f = b.querySelector('#wsForm');
    ({ home: formHome, menus: formMenus, prices: formPrices, history: formHistory })[W.tab](f);
    status(); preview(); fit();
  }
  function fit() {
    var box = document.querySelector('.ws-frame'), f = document.getElementById('wsPrev'); if (!box || !f) return;
    var w = { desktop: 1280, tablet: 820, mobile: 390 }[W.dev], sc = Math.min(1, box.clientWidth / w);
    f.style.width = w + 'px'; f.style.height = Math.round(box.clientHeight / sc) + 'px'; f.style.transform = 'scale(' + sc + ')';
  }
  window.addEventListener('resize', function () { clearTimeout(W.ft); W.ft = setTimeout(fit, 150); });

  /* ---------- small form helpers ---------- */
  function inp(label, val, attrs, ta) { return '<label class="field"><span>' + label + '</span>' + (ta ? '<textarea class="hq-in" rows="' + ta + '" ' + attrs + '>' + esc(val) + '</textarea>' : '<input class="hq-in" value="' + esc(val) + '" ' + attrs + '>') + '</label>'; }
  function bindInputs(el, get) { el.querySelectorAll('[data-k]').forEach(function (x) { x.addEventListener('input', function () { get(x.getAttribute('data-k'), x.type === 'checkbox' ? x.checked : x.value, x); changed(); }); x.addEventListener('change', function () { if (x.type === 'checkbox') { get(x.getAttribute('data-k'), x.checked, x); changed(); } }); }); }
  function setPath(obj, path, v) { var p = path.split('.'), o = obj; for (var i = 0; i < p.length - 1; i++) o = o[p[i]]; o[p[p.length - 1]] = v; }
  /* drag to reorder (mouse and touch) plus up/down buttons */
  function sortable(list, arr, redraw) {
    var from = null;
    list.querySelectorAll('[data-i]').forEach(function (row) {
      row.addEventListener('dragstart', function (e) { from = +row.getAttribute('data-i'); row.classList.add('is-drag'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', String(from)); } catch (er) { } });
      row.addEventListener('dragend', function () { row.classList.remove('is-drag'); });
      row.addEventListener('dragover', function (e) { e.preventDefault(); row.classList.add('is-over'); });
      row.addEventListener('dragleave', function () { row.classList.remove('is-over'); });
      row.addEventListener('drop', function (e) { e.preventDefault(); row.classList.remove('is-over'); var to = +row.getAttribute('data-i'); if (from == null || from === to) return; var it = arr.splice(from, 1)[0]; arr.splice(to, 0, it); changed(); redraw(); });
    });
    list.querySelectorAll('[data-mv]').forEach(function (bt) { bt.onclick = function (e) { e.stopPropagation(); var i = +bt.closest('[data-i]').getAttribute('data-i'), j = i + (+bt.getAttribute('data-mv')); if (j < 0 || j >= arr.length) return; var t = arr[i]; arr[i] = arr[j]; arr[j] = t; changed(); redraw(); }; });
  }
  var GRIP = '<span class="ws-grip" title="Drag to move">⋮⋮</span>';
  var MV = '<button type="button" class="b b--sm b--ghost" data-mv="-1" title="Move up">↑</button><button type="button" class="b b--sm b--ghost" data-mv="1" title="Move down">↓</button>';

  /* ---------- homepage ---------- */
  function formHome(f) {
    var h = W.model.hero, m = W.model;
    f.innerHTML = '<section class="card"><div class="card__h"><h2>Hero</h2></div><div class="card__b ws-grid">' +
      inp('Small heading above the title', h.eyebrow, 'data-k="hero.eyebrow"') +
      inp('Title, first line', h.before, 'data-k="hero.before"') +
      inp('Rotating words (one per line)', (h.words || []).join('\n'), 'data-k="hero.words"', 4) +
      inp('Title, last line', h.after, 'data-k="hero.after"') +
      inp('Description', h.sub, 'data-k="hero.sub"', 3) +
      '<div class="ws-2">' + (h.ctas || []).map(function (c, i) { return '<div class="ws-box"><b>' + (i ? 'Second' : 'Main') + ' button</b>' + inp('Label', c.label, 'data-k="hero.ctas.' + i + '.label"') + inp('Link', c.href, 'data-k="hero.ctas.' + i + '.href" placeholder="quote.html or https://…"') + '</div>'; }).join('') + '</div></div></section>' +
      '<section class="card"><div class="card__h"><h2>Sections</h2><span class="muted" style="font-size:.8rem">Drag to reorder · eye to show or hide</span></div><ul class="ws-list" id="wsSecs"></ul></section>' +
      '<section class="card"><div class="card__h"><h2>Announcement bar</h2><label class="check"><input type="checkbox" data-k="announce.on"' + (m.announce.on ? ' checked' : '') + '> Show on every page</label></div><div class="card__b ws-grid">' + inp('Message', m.announce.text, 'data-k="announce.text" placeholder="e.g. Photo Books: order by 15 Dec for Christmas"') + inp('Link (optional)', m.announce.href, 'data-k="announce.href" placeholder="/photobooks"') + '</div></section>';
    bindInputs(f, function (k, v) {
      if (k === 'hero.words') v = v.split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
      if (/^hero\.(before|after|words)/.test(k)) W.model.hero.label = '';
      setPath(W.model, k, v);
    });
    secs();
  }
  function secs() {
    var ul = document.getElementById('wsSecs'), S = W.model.sections;
    ul.innerHTML = S.map(function (s, i) {
      var lock = s.key === 'HERO';
      return '<li data-i="' + i + '" draggable="true" class="' + (s.visible === false ? 'is-off' : '') + '"><div class="ws-row">' + GRIP + '<b>' + esc(s.name) + '</b>' + (s.title ? '<small>' + esc(s.title.split('\n')[0]) + '</small>' : '') + '<span class="ws-sp"></span>' + MV +
        (lock ? '<span class="chip">Always shown</span>' : '<button type="button" class="b b--sm" data-eye>' + (s.visible === false ? 'Hidden' : 'Shown') + '</button>') + (s.title != null ? '<button type="button" class="b b--sm" data-ed>Edit text</button>' : '') + '</div>' +
        (s.title != null ? '<div class="ws-ed" hidden>' + inp('Heading', s.title, 'data-k="sections.' + i + '.title"', 2) + (s.lead != null ? inp('Text under the heading', s.lead, 'data-k="sections.' + i + '.lead"', 3) : '') + '</div>' : '') + '</li>';
    }).join('');
    sortable(ul, S, secs);
    ul.querySelectorAll('[data-eye]').forEach(function (bt) { bt.onclick = function () { var s = S[+bt.closest('[data-i]').getAttribute('data-i')]; s.visible = s.visible === false; changed(); secs(); }; });
    ul.querySelectorAll('[data-ed]').forEach(function (bt) { bt.onclick = function () { var e = bt.closest('li').querySelector('.ws-ed'); e.hidden = !e.hidden; }; });
    bindInputs(ul, function (k, v) { setPath(W.model, k, v); });
  }

  /* ---------- menus & footer ---------- */
  function formMenus(f) {
    var m = W.model;
    f.innerHTML = '<section class="card"><div class="card__h"><h2>Top menu</h2><button class="b b--sm" id="mAdd">+ Add link</button></div><ul class="ws-list" id="mNav"></ul><div class="card__b ws-2" style="border-top:1px solid var(--line)">' + inp('Header button label', m.cta.label, 'data-k="cta.label"') + inp('Header button link', m.cta.href, 'data-k="cta.href"') + '</div></section>' +
      '<section class="card"><div class="card__h"><h2>Footer</h2><button class="b b--sm" id="fAdd">+ Add column</button></div><div class="card__b" id="mFoot" style="display:grid;gap:12px"></div></section>' +
      '<p class="faint" style="font-size:.8rem">The same menu and footer are used on every page of cielafrica.com (Photo Books and the live templates keep their own).</p>';
    bindInputs(f.querySelector('.card__b'), function (k, v) { setPath(W.model, k, v); });
    function nav() {
      var ul = document.getElementById('mNav');
      ul.innerHTML = m.nav.map(function (n, i) { return '<li data-i="' + i + '" draggable="true" class="' + (n.visible === false ? 'is-off' : '') + '"><div class="ws-row">' + GRIP + '<input class="hq-in ws-in" data-k="nav.' + i + '.label" value="' + esc(n.label) + '" placeholder="Label"><input class="hq-in ws-in" data-k="nav.' + i + '.href" value="' + esc(n.href) + '" placeholder="Link">' + MV + '<label class="check" title="Show in the menu"><input type="checkbox" data-k="nav.' + i + '.visible"' + (n.visible === false ? '' : ' checked') + '></label><button type="button" class="b b--sm b--ghost" data-del title="Remove">✕</button></div></li>'; }).join('');
      sortable(ul, m.nav, nav);
      bindInputs(ul, function (k, v) { setPath(W.model, k, v); var li = ul.querySelector('[data-k="' + k + '"]').closest('li'); if (/visible$/.test(k)) li.classList.toggle('is-off', !v); });
      ul.querySelectorAll('[data-del]').forEach(function (bt) { bt.onclick = function () { m.nav.splice(+bt.closest('li').getAttribute('data-i'), 1); changed(); nav(); }; });
    }
    function foot() {
      var el = document.getElementById('mFoot');
      el.innerHTML = m.footer.map(function (c, i) { return '<div class="ws-box"><div class="ws-row"><input class="hq-in ws-in" data-k="footer.' + i + '.title" value="' + esc(c.title) + '" placeholder="Column title"><button type="button" class="b b--sm b--ghost" data-dcol="' + i + '">Remove column</button></div><ul class="ws-list ws-list--in" data-col="' + i + '">' + c.links.map(function (l, j) { return '<li data-i="' + j + '" draggable="true"><div class="ws-row">' + GRIP + '<input class="hq-in ws-in" data-k="footer.' + i + '.links.' + j + '.label" value="' + esc(l.label) + '" placeholder="Label"><input class="hq-in ws-in" data-k="footer.' + i + '.links.' + j + '.href" value="' + esc(l.href) + '" placeholder="Link, mailto: or tel:">' + MV + '<button type="button" class="b b--sm b--ghost" data-dl="' + j + '">✕</button></div></li>'; }).join('') + '</ul><button type="button" class="b b--sm" data-al="' + i + '">+ Link</button></div>'; }).join('');
      bindInputs(el, function (k, v) { setPath(W.model, k, v); });
      el.querySelectorAll('[data-col]').forEach(function (ul) { sortable(ul, m.footer[+ul.getAttribute('data-col')].links, foot); });
      el.querySelectorAll('[data-dl]').forEach(function (bt) { bt.onclick = function () { m.footer[+bt.closest('[data-col]').getAttribute('data-col')].links.splice(+bt.getAttribute('data-dl'), 1); changed(); foot(); }; });
      el.querySelectorAll('[data-al]').forEach(function (bt) { bt.onclick = function () { m.footer[+bt.getAttribute('data-al')].links.push({ label: '', href: '' }); changed(); foot(); }; });
      el.querySelectorAll('[data-dcol]').forEach(function (bt) { bt.onclick = function () { if (!confirm('Remove this footer column?')) return; m.footer.splice(+bt.getAttribute('data-dcol'), 1); changed(); foot(); }; });
    }
    f.querySelector('#mAdd').onclick = function () { m.nav.push({ label: 'New link', href: '', visible: true }); changed(); nav(); };
    f.querySelector('#fAdd').onclick = function () { m.footer.push({ title: 'New column', links: [] }); changed(); foot(); };
    nav(); foot();
  }

  /* ---------- prices & visibility ---------- */
  /** Photo Books: a price for each book size, delivery, the hardcover case and coupons (used on Website → Prices and Products → Photo Books) */
  function pbCards(f) {
    var pb = W.pb; pb.tiers = pb.tiers || {}; pb.cover = pb.cover || { paperGsm: 170, paperBulk: 1, boardMm: 3, hingeMm: 8, wrapMm: 15 };
    var sizes = Object.keys(pb.tiers).map(Number).sort(function (a, b) { return a - b; });
    function spineAt(n) { var c = pb.cover; return Math.round(((+c.paperGsm || 0) * (+c.paperBulk || 0) * Math.ceil(n / 2) / 1000 + 2 * (+c.boardMm || 0)) * 10) / 10; }
    f.innerHTML = '<section class="card"><div class="card__h"><h2>Photo Books · printed hardcover</h2><span class="muted" style="font-size:.8rem">The price for each book size. A book between sizes pays the next size up.</span></div><div class="card__b ws-4" id="pbTiers">' +
      sizes.map(function (k) { return inp(k + ' pages (KES)', pb.tiers[k], 'type="number" min="0" step="50" data-k="tiers.' + k + '"'); }).join('') + '</div></section>' +
      '<section class="card"><div class="card__h"><h2>Delivery prices</h2></div><div class="card__b ws-4">' +
      Object.keys(pb.delivery).map(function (id) { return inp(esc(pb.delivery[id].name), pb.delivery[id].price, 'type="number" min="0" data-k="delivery.' + id + '.price"'); }).join('') + '</div></section>' +
      '<section class="card"><div class="card__h"><h2>Hardcover case (for the printer)</h2><span class="muted" style="font-size:.8rem">Ask your printer for these. They set the spine width and the full-cover file.</span></div><div class="card__b ws-4" id="pbCase">' +
      inp('Paper weight (gsm)', pb.cover.paperGsm, 'type="number" min="60" max="400" data-k="cover.paperGsm"') + inp('Paper bulk (1.0 = 1 µm per gsm)', pb.cover.paperBulk, 'type="number" min="0.5" max="2" step="0.05" data-k="cover.paperBulk"') +
      inp('Board thickness (mm)', pb.cover.boardMm, 'type="number" min="0" max="6" step="0.1" data-k="cover.boardMm"') + inp('Hinge each side of the spine (mm)', pb.cover.hingeMm, 'type="number" min="0" max="20" step="0.5" data-k="cover.hingeMm"') +
      inp('Wrap / turn-in all round (mm)', pb.cover.wrapMm, 'type="number" min="3" max="25" step="0.5" data-k="cover.wrapMm"') +
      '</div><p class="muted" id="pbSpines" style="font-size:.82rem;padding:0 1.2rem 1rem"></p></section>' +
      '<section class="card"><div class="card__h"><h2>Photo book coupons</h2><span class="muted" style="font-size:.8rem">Saved straight away (no publishing). Codes stay private.</span></div><div class="card__b" id="cpBox"><p class="empty">Loading coupons…</p></div></section>';
    function spines() { var el = document.getElementById('pbSpines'); if (el) el.innerHTML = 'Spine width: ' + sizes.map(function (k) { return '<b>' + k + ' pages ' + spineAt(k) + ' mm</b>'; }).join(' · ') + '. Full cover for 24 pages: ' + Math.round((2 * (+pb.cover.wrapMm) + 2 * 210 + 2 * (+pb.cover.hingeMm) + spineAt(24)) * 10) / 10 + ' × ' + (297 + 2 * (+pb.cover.wrapMm)) + ' mm.'; }
    f.querySelectorAll('section.card').forEach(function (sec, i) { if (i < 3) bindInputs(sec, function (k, v) { var p = k.split('.'); if (p[0] === 'delivery') pb.delivery[p[1]].price = +v; else if (p[0] === 'tiers') pb.tiers[p[1]] = +v; else if (p[0] === 'cover') { pb.cover[p[1]] = +v; spines(); } }); });
    spines(); coupons(document.getElementById('cpBox'));
  }
  function formPrices(f) {
    function rowsFor(list, key, unit) {
      var ch = W.items[key] = W.items[key] || {};
      return list.map(function (p) {
        var c = ch[p.id] || {}, price = c.price != null ? c.price : p.price, was = 'was' in c ? c.was : p.was, hidden = 'hidden' in c ? c.hidden : !!p.hidden;
        return '<tr data-id="' + esc(p.id) + '" class="' + (hidden ? 'is-off' : '') + '"><td><b>' + esc(p.name) + '</b><small>' + esc(p.category || '') + '</small></td><td><input class="hq-in ws-num" type="number" min="0" step="50" data-f="price" value="' + esc(price) + '"></td><td><input class="hq-in ws-num" type="number" min="0" step="50" data-f="was" value="' + esc(was || '') + '" placeholder="—"></td><td><label class="check"><input type="checkbox" data-f="show"' + (hidden ? '' : ' checked') + '> Visible</label></td></tr>';
      }).join('');
    }
    f.innerHTML = '<div id="pbWrap" style="display:grid;gap:1rem"></div>' +
      '<section class="card"><div class="card__h"><h2>Products</h2><span class="muted" style="font-size:.8rem">“Was” shows a sale: the old price crossed out</span></div><table class="tbl ws-tbl"><thead><tr><th>Product</th><th>Price (KES)</th><th>Was</th><th>Shown</th></tr></thead><tbody data-key="products">' + rowsFor(W.products, 'products') + '</tbody></table></section>' +
      '<section class="card"><div class="card__h"><h2>Website templates</h2></div><table class="tbl ws-tbl"><thead><tr><th>Template</th><th>From (KES)</th><th>Was</th><th>Shown</th></tr></thead><tbody data-key="templates">' + rowsFor(W.templates, 'templates') + '</tbody></table></section>' +
      '<p class="faint" style="font-size:.8rem">New prices apply to new orders once published. Items already in a customer’s cart keep the price they were added at.</p>';
    pbCards(f.querySelector('#pbWrap'));
    f.querySelectorAll('tbody[data-key] input').forEach(function (x) {
      x.addEventListener(x.type === 'checkbox' ? 'change' : 'input', function () {
        var key = x.closest('tbody').getAttribute('data-key'), tr = x.closest('tr'), id = tr.getAttribute('data-id'), ch = W.items[key][id] = W.items[key][id] || {}, fl = x.getAttribute('data-f');
        if (fl === 'price') ch.price = +x.value; else if (fl === 'was') ch.was = x.value ? +x.value : null; else { ch.hidden = !x.checked; tr.classList.toggle('is-off', !x.checked); }
        changed();
      });
    });
  }

  /* ---------- photo book coupons (kept on the server, not in the public files) ---------- */
  function coupons(box) {
    var list = [];
    function day(v) { return v ? new Date(v + 'T12:00:00').toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : ''; }
    function state(c) { var t = new Date(Date.now() + 3 * 36e5).toISOString().slice(0, 10); if (c.active === false) return ['Off', 'k']; if (c.expires && t > c.expires) return ['Expired', 'r']; if (c.starts && t < c.starts) return ['Starts ' + day(c.starts), 'y']; if (c.maxUses && (c.uses || 0) >= c.maxUses) return ['Used up', 'r']; return ['Active', 'g']; }
    function draw() {
      box.innerHTML = '<div class="ws-cpform"><b>' + (box._ed ? 'Edit ' + esc(box._ed.code) : 'New coupon') + '</b><div class="ws-4">' +
        inp('Code', box._ed ? box._ed.code : '', 'id="cpCode" maxlength="24" placeholder="e.g. KARIBU10" style="text-transform:uppercase"') +
        '<label class="field"><span>Type</span><select class="hq-in" id="cpType"><option value="percent">Percentage off</option><option value="fixed"' + (box._ed && box._ed.type === 'fixed' ? ' selected' : '') + '>Fixed amount off (KES)</option></select></label>' +
        inp('Value', box._ed ? box._ed.value : '', 'id="cpVal" type="number" min="1" step="1" placeholder="10"') +
        inp('Expires (optional)', box._ed ? box._ed.expires || '' : '', 'id="cpExp" type="date"') +
        inp('Starts (optional)', box._ed ? box._ed.starts || '' : '', 'id="cpStart" type="date"') +
        inp('Max uses (optional)', box._ed ? box._ed.maxUses || '' : '', 'id="cpMax" type="number" min="0" placeholder="Unlimited"') +
        inp('Minimum books total, KES (optional)', box._ed ? box._ed.minTotal || '' : '', 'id="cpMin" type="number" min="0" placeholder="None"') +
        inp('Note (only you see it)', box._ed ? box._ed.note || '' : '', 'id="cpNote" maxlength="120"') + '</div>' +
        '<label class="check"><input type="checkbox" id="cpOn"' + (!box._ed || box._ed.active !== false ? ' checked' : '') + '> Active</label>' +
        '<div class="row" style="gap:.5rem;margin-top:.5rem"><button class="b b--p b--sm" id="cpSave">' + (box._ed ? 'Save changes' : 'Add coupon') + '</button>' + (box._ed ? '<button class="b b--sm" id="cpCancel">Cancel</button>' : '') + '<span class="muted" id="cpMsg" style="font-size:.82rem"></span></div></div>' +
        (list.length ? '<table class="tbl ws-tbl" style="margin-top:1rem"><thead><tr><th>Code</th><th>Discount</th><th>Valid</th><th>Used</th><th>Status</th><th></th></tr></thead><tbody>' + list.map(function (c) { var st = state(c); return '<tr><td><b>' + esc(c.code) + '</b>' + (c.note ? '<small>' + esc(c.note) + '</small>' : '') + '</td><td>' + (c.type === 'percent' ? esc(c.value) + '%' : money(c.value)) + (c.minTotal ? '<small>min ' + money(c.minTotal) + '</small>' : '') + '</td><td>' + (c.starts ? 'from ' + day(c.starts) + '<br>' : '') + (c.expires ? 'until ' + day(c.expires) : 'No end date') + '</td><td>' + (c.uses || 0) + (c.maxUses ? ' / ' + c.maxUses : '') + '</td><td><span class="chip chip--' + st[1] + '">' + st[0] + '</span></td><td style="white-space:nowrap"><button class="b b--sm b--ghost" data-ed="' + esc(c.code) + '">Edit</button><button class="b b--sm b--ghost" data-del="' + esc(c.code) + '">Delete</button></td></tr>'; }).join('') + '</tbody></table>' : '<p class="empty" style="margin-top:1rem">No coupons yet.</p>');
      var g = function (id) { return box.querySelector('#' + id); };
      g('cpSave').onclick = function () {
        var bt = this; bt.disabled = true; g('cpMsg').textContent = 'Saving…';
        H.api('/api/photobooks?route=pbk-admin-coupon-save', { was: box._ed ? box._ed.code : null, code: g('cpCode').value, type: g('cpType').value, value: g('cpVal').value, expires: g('cpExp').value, starts: g('cpStart').value, maxUses: g('cpMax').value, minTotal: g('cpMin').value, note: g('cpNote').value, active: g('cpOn').checked })
          .then(function (r) { list = r.coupons; box._ed = null; draw(); H.toast('Coupon saved'); }, function (e) { bt.disabled = false; g('cpMsg').textContent = e.message; });
      };
      if (g('cpCancel')) g('cpCancel').onclick = function () { box._ed = null; draw(); };
      box.querySelectorAll('[data-ed]').forEach(function (bt) { bt.onclick = function () { box._ed = list.filter(function (c) { return c.code === bt.getAttribute('data-ed'); })[0]; draw(); box.scrollIntoView({ block: 'start', behavior: 'smooth' }); }; });
      box.querySelectorAll('[data-del]').forEach(function (bt) { bt.onclick = function () { var c = bt.getAttribute('data-del'); if (!confirm('Delete coupon ' + c + '? Customers can no longer use it.')) return; H.api('/api/photobooks?route=pbk-admin-coupon-delete', { code: c }).then(function (r) { list = r.coupons; draw(); H.toast('Coupon deleted'); }, function (e) { alert(e.message); }); }; });
    }
    H.api('/api/photobooks?route=pbk-admin-coupons').then(function (r) { list = r.coupons || []; if (!r.storage) { box.innerHTML = '<p class="empty">Coupons need Blob storage (Setup).</p>'; return; } draw(); }, function (e) { box.innerHTML = '<p class="empty">' + esc(e.message) + '</p>'; });
  }

  /* ---------- history ---------- */
  function formHistory(f) {
    f.innerHTML = '<section class="card"><div class="card__h"><h2>Published versions</h2></div><div id="hv"><p class="empty">Loading…</p></div></section>';
    H.api('/api/hq?route=site-versions').then(function (r) {
      var el = document.getElementById('hv');
      if (!r.items.length) { el.innerHTML = '<p class="empty">Nothing published from Ciel Admin yet. Every publish is listed here and can be loaded back.</p>'; return; }
      el.innerHTML = '<table class="tbl"><thead><tr><th>When</th><th>What changed</th><th></th></tr></thead><tbody>' + r.items.map(function (v) { return '<tr><td>' + H.dt(v.at) + '<small>' + esc(String(v.sha || '').slice(0, 7)) + '</small></td><td>' + esc(v.summary || '') + (v.note ? '<small>' + esc(v.note) + '</small>' : '') + '</td><td><button class="b b--sm" data-v="' + esc(v.id) + '">Load this version</button></td></tr>'; }).join('') + '</tbody></table>';
      el.querySelectorAll('[data-v]').forEach(function (bt) { bt.onclick = function () {
        if (!confirm('Load this version into the editor? Your current draft is replaced. Nothing changes on the live site until you publish.')) return;
        H.api('/api/hq?route=site-version&id=' + bt.getAttribute('data-v')).then(function (x) { var v = x.version; if (v.model) W.model = v.model; W.items = v.items || { products: {}, templates: {} }; if (v.photobooks) W.pb = v.photobooks; changed(); location.hash = '#website/home'; H.toast('Version loaded: review it, then Publish'); }, function (e) { H.toast(e.message); });
      }; });
    }, function (e) { document.getElementById('hv').innerHTML = '<p class="empty">' + esc(e.message) + '</p>'; });
  }

  /* ---------- publish ---------- */
  function publish() {
    var n = Object.keys(W.items.products || {}).length + Object.keys(W.items.templates || {}).length;
    var pbCh = JSON.stringify(W.pb) !== JSON.stringify(W.pbBase);
    var m = H.modal('<h2>Publish to cielafrica.com?</h2><p class="muted">Your draft goes live on the public website in about a minute.</p><ul class="hist" style="margin:.6rem 0"><li>Homepage, menus, footer and announcement as shown in the preview</li>' + (n ? '<li>' + n + ' price or visibility change' + (n === 1 ? '' : 's') + '</li>' : '') + (pbCh ? '<li>Photo Books prices</li>' : '') + '</ul><label class="field"><span>Note (optional)</span><input class="hq-in" id="pubNote" placeholder="e.g. Christmas announcement"></label><div class="row" style="margin-top:12px;justify-content:flex-end"><button class="b" data-x>Cancel</button><button class="b b--p" id="pubGo">Publish now</button></div><p class="muted" id="pubMsg" style="margin-top:8px"></p>');
    m.querySelector('#pubGo').onclick = function () {
      var go = this; go.disabled = true; var msg = m.querySelector('#pubMsg'); msg.textContent = 'Saving the files…';
      H.api('/api/hq?route=site-publish', { model: W.model, items: W.items, photobooks: pbCh ? W.pb : null, uploads: W.uploads, note: m.querySelector('#pubNote').value }).then(function (r) {
        if (!r.sha) { msg.textContent = r.message || 'Nothing changed.'; go.disabled = false; return; }
        msg.innerHTML = 'Saved (' + esc(r.files.length) + ' files). Deploying to cielafrica.com… <span class="ws-spin"></span>';
        W.draftAt = null; W.dirty = false; if (pbCh) { W.pbBase = clone(W.pb); W.pbPublished = clone(W.pb); } status();
        var tries = 0; (function poll() {
          tries++;
          txt('/data/site.json').then(JSON.parse).then(function (j) {
            if (j.publishedAt === r.stamp) { msg.innerHTML = '<b style="color:var(--g)">Live on cielafrica.com.</b> <a href="/" target="_blank" rel="noopener">Open the site ↗</a>'; W.loaded = false; setTimeout(function () { m.remove(); render(W.tab); }, 2500); return; }
            if (tries < 40) setTimeout(poll, 6000); else msg.textContent = 'Saved. The deployment is taking longer than usual; check again in a few minutes.';
          }, function () { if (tries < 40) setTimeout(poll, 6000); });
        })();
      }, function (e) { msg.textContent = e.message; go.disabled = false; });
    };
  }

  /* ---------- Products & templates catalogue (create, edit, duplicate, delete, picture) ---------- */
  function cur(kind, p) { var c = (W.items[kind] || {})[p.id] || {}; var o = {}; Object.keys(p).forEach(function (k) { o[k] = p[k]; }); Object.keys(c).forEach(function (k) { o[k] = c[k]; }); return o; }
  function allItems(kind) {
    var base = kind === 'products' ? W.products : W.templates, ch = W.items[kind] || {};
    var list = base.map(function (p) { return cur(kind, p); }).filter(function (p) { return !p.delete; });
    Object.keys(ch).forEach(function (id) { if (ch[id].create && !ch[id].delete) list.push(Object.assign({ id: id }, ch[id])); });
    return list;
  }
  function nextId(kind) { var pre = kind === 'products' ? 'prd-' : 'tpl-', n = 0; allItems(kind).concat(kind === 'products' ? W.products : W.templates).forEach(function (p) { var m = new RegExp('^' + pre + '(\\d+)$').exec(p.id); if (m) n = Math.max(n, +m[1]); }); Object.keys(W.items[kind] || {}).forEach(function (id) { var m = new RegExp('^' + pre + '(\\d+)$').exec(id); if (m) n = Math.max(n, +m[1]); }); return pre + String(n + 1).padStart(2, '0'); }
  function setItem(kind, id, patch) { var ch = W.items[kind] = W.items[kind] || {}; ch[id] = Object.assign(ch[id] || {}, patch); changed(); }
  function shot(kind, p) { return p.image || (kind === 'products' && /^prd-(0[1-9]|1\d|2[0-8])$/.test(p.id) ? '/assets/img/products/' + p.id + '.webp' : ''); }
  function renderCatalog(kind) {
    var b = H.body('<div class="ws"><p class="muted">Loading the catalogue…</p></div>');
    (W.loaded ? Promise.resolve() : load()).then(function () { drawCatalog(kind); }, function (e) { b.innerHTML = '<p class="empty">' + esc(e.message) + '</p>'; });
  }
  function drawCatalog(kind) {
    if (kind === 'photobooks' || (kind === 'products' && W.ctab === 'photobooks')) return drawPbTab();
    W.tab = 'prices'; var q = (W.cq || '').toLowerCase(), cat = W.cc || '', list = allItems(kind), ch = W.items[kind] || {}, cats = kind === 'products' ? W.pcats : W.tcats;
    var shown = list.filter(function (p) { return (!cat || p.category === cat) && (!q || (p.name + ' ' + (p.desc || '')).toLowerCase().indexOf(q) >= 0); });
    var b = H.body('<div class="ws"><div class="ws-top"><div class="tabs" id="catT"><button data-k="products"' + (kind === 'products' ? ' class="is-on"' : '') + '>Products <i>' + allItems('products').length + '</i></button><button data-k="templates"' + (kind === 'templates' ? ' class="is-on"' : '') + '>Website templates <i>' + allItems('templates').length + '</i></button><button data-k="photobooks"' + (kind === 'photobooks' ? ' class="is-on"' : '') + '>Photo Books</button></div><span id="wsSt" class="ws-st"></span><button class="b" id="catNew">+ New ' + (kind === 'products' ? 'product' : 'template') + '</button><button class="b b--p" id="wsPub"' + (W.status.github === false ? ' disabled title="Add GITHUB_TOKEN first"' : '') + '>Publish to cielafrica.com</button></div>' +
      '<div class="card"><div class="card__h" style="gap:.5rem;flex-wrap:wrap"><input class="hq-in" id="catQ" type="search" placeholder="Search" value="' + esc(W.cq || '') + '" style="max-width:260px"><select class="hq-in" id="catC" style="width:auto"><option value="">All categories</option>' + cats.map(function (c) { return '<option' + (c === cat ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</select><span class="muted" style="font-size:.8rem;margin-left:auto">' + shown.length + ' shown</span></div>' +
      '<table class="tbl cat-tbl"><thead><tr><th></th><th>Name</th><th class="hide-m">Category</th><th>Price</th><th>Status</th></tr></thead><tbody>' + shown.map(function (p) {
        var c = ch[p.id], img = W.uploads[(p.image || '').split('?')[0]] ? 'data:image/webp;base64,' + W.uploads[p.image.split('?')[0]] : shot(kind, p);
        return '<tr data-id="' + esc(p.id) + '"><td style="width:72px">' + (img ? '<img class="cat-img" src="' + esc(img.charAt(0) === '/' || /^data:/.test(img) ? img : '/' + img) + '" alt="">' : '<span class="cat-img cat-img--x"></span>') + '</td><td><b>' + esc(p.name) + '</b><small>' + esc(p.id) + (c ? ' · <span style="color:var(--b)">' + (c.create ? 'new, not published' : 'edited, not published') + '</span>' : '') + '</small></td><td class="hide-m">' + esc(p.category || '') + '</td><td><b>KES ' + Math.round(+p.price || 0).toLocaleString('en-KE') + '</b>' + (p.was > p.price ? '<small><s>KES ' + Math.round(p.was).toLocaleString('en-KE') + '</s></small>' : '') + '</td><td>' + (p.hidden ? '<span class="chip">Hidden</span>' : '<span class="chip chip--g">Live</span>') + '</td></tr>';
      }).join('') + '</tbody></table></div><p class="faint" style="font-size:.78rem">Changes are saved as a draft and go live when you publish (together with any Website editor changes).</p></div>');
    b.querySelectorAll('#catT [data-k]').forEach(function (x) { x.onclick = function () { W.cc = ''; var k = x.getAttribute('data-k'); W.ctab = k === 'photobooks' ? 'photobooks' : null; if (k === 'photobooks') { if (location.hash !== '#products') location.hash = '#products'; drawPbTab(); return; } location.hash = '#' + (k === 'products' ? 'products' : 'templates'); }; });
    var qi = b.querySelector('#catQ'); qi.oninput = function () { W.cq = qi.value; var pos = qi.selectionStart; drawCatalog(kind); var n = document.getElementById('catQ'); n.focus(); n.setSelectionRange(pos, pos); };
    b.querySelector('#catC').onchange = function () { W.cc = this.value; drawCatalog(kind); };
    b.querySelector('#wsPub').onclick = publish;
    b.querySelector('#catNew').onclick = function () { var id = nextId(kind); editItem(kind, Object.assign({ id: id, create: true, name: '', category: cats[0] || '', desc: '', price: 0 }, kind === 'products' ? { art: 'admin', meta: '' } : { idealFor: '' }), true); };
    b.querySelectorAll('tr[data-id]').forEach(function (tr) { tr.onclick = function () { var p = allItems(kind).filter(function (x) { return x.id === tr.getAttribute('data-id'); })[0]; if (p) editItem(kind, p); }; });
    status();
  }
  /* Products → Photo Books: the same settings as Website → Prices, with Publish at the top */
  function drawPbTab() {
    W.tab = 'prices'; W.ctab = 'photobooks';
    var b = H.body('<div class="ws"><div class="ws-top"><div class="tabs" id="catT"><button data-k="products">Products <i>' + allItems('products').length + '</i></button><button data-k="templates">Website templates <i>' + allItems('templates').length + '</i></button><button data-k="photobooks" class="is-on">Photo Books</button></div><span id="wsSt" class="ws-st"></span><button class="b b--p b--sm" id="wsPub">Publish to cielafrica.com</button></div>' +
      '<div id="pbWrap" style="display:grid;gap:1rem"></div><p class="faint" style="font-size:.78rem">Prices, delivery and the hardcover case go live when you publish. Coupons save straight away.</p></div>');
    b.querySelectorAll('#catT [data-k]').forEach(function (x) { x.onclick = function () { var k = x.getAttribute('data-k'); if (k === 'photobooks') return; W.ctab = null; if (k === 'products' && location.hash === '#products') drawCatalog('products'); else location.hash = '#' + k; }; });
    b.querySelector('#wsPub').onclick = publish;
    pbCards(b.querySelector('#pbWrap'));
    status();
  }
  function editItem(kind, p, isNew) {
    var cats = kind === 'products' ? W.pcats : W.tcats, tpl = kind === 'templates';
    var img = W.uploads[(p.image || '').split('?')[0]] ? 'data:image/webp;base64,' + W.uploads[p.image.split('?')[0]] : shot(kind, p);
    var m = H.modal('<div class="cat-ed"><div class="row" style="justify-content:space-between"><h2 style="font-size:1rem">' + (isNew ? 'New ' + (tpl ? 'template' : 'product') : esc(p.name)) + '</h2><button class="b b--sm b--ghost" data-x>✕</button></div>' +
      '<div class="cat-grid"><div><div class="cat-pic">' + (img ? '<img id="ePic" src="' + esc(img.charAt(0) === '/' || /^data:/.test(img) ? img : '/' + img) + '" alt="">' : '<span id="ePic" class="muted">No picture yet</span>') + '</div><label class="b b--sm" style="cursor:pointer;margin-top:8px;justify-content:center">Upload picture<input type="file" accept="image/*" id="eUp" hidden></label><p class="faint" style="font-size:.74rem;margin-top:6px">Shown on the card. Best at 800 × 720.</p></div>' +
      '<div class="ws-grid">' + inp('Name', p.name, 'id="eName"') + '<label class="field"><span>Category</span><select class="hq-in" id="eCat">' + cats.map(function (c) { return '<option' + (c === p.category ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</select></label>' +
      inp('Description', p.desc || '', 'id="eDesc"', 3) + (tpl ? inp('Ideal for', p.idealFor || '', 'id="eFor"') + inp('Live demo link (optional)', p.demo || '', 'id="eDemo" placeholder="mokara/ or https://…"') : inp('Detail line', p.meta || '', 'id="eMeta" placeholder="e.g. Daraja API · STK Push · Sandbox & Live"')) +
      '<div class="ws-2">' + inp(tpl ? 'Price from (KES)' : 'Price (KES)', p.price || 0, 'id="ePrice" type="number" min="0"') + inp('Was (KES, for a sale)', p.was || '', 'id="eWas" type="number" min="0" placeholder="—"') + '</div>' +
      (tpl ? '' : '<label class="field"><span>Badge</span><select class="hq-in" id="eBadge">' + [['', 'None'], ['new', 'New'], ['popular', 'Popular']].map(function (o) { return '<option value="' + o[0] + '"' + ((p.badge || '') === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label>') +
      '<label class="check"><input type="checkbox" id="eShow"' + (p.hidden ? '' : ' checked') + '> Shown on cielafrica.com</label></div></div>' +
      '<div class="cat-file" id="eFile">' + (isNew ? '<b>Download file</b><p class="muted">Publish this ' + (tpl ? 'template' : 'product') + ' first, then add the file customers download after paying.</p>' : '<p class="muted">Loading the download file…</p>') + '</div>' +
      '<div class="row" style="margin-top:14px">' + (isNew ? '' : '<button class="b b--sm" id="eDup">Duplicate</button><button class="b b--sm b--ghost" id="eDel" style="color:var(--r)">Delete</button>') + '<span style="flex:1"></span><button class="b" data-x>Cancel</button><button class="b b--p" id="eSave">' + (isNew ? 'Add to draft' : 'Save to draft') + '</button></div></div>');
    m.classList.add('cat-modal');
    var pic = null;
    if (!isNew) fileBox(m.querySelector('#eFile'), p);
    m.querySelector('#eUp').onchange = function () {
      var f = this.files[0]; if (!f) return; var rd = new FileReader();
      rd.onload = function () { var im = new Image(); im.onload = function () { var w = Math.min(1200, im.width), h = Math.round(im.height * w / im.width), c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(im, 0, 0, w, h); var url = c.toDataURL('image/webp', 0.86); pic = url.split(',')[1]; var el = m.querySelector('#ePic'); if (el.tagName !== 'IMG') { var n = document.createElement('img'); n.id = 'ePic'; el.replaceWith(n); el = n; } el.src = url; }; im.src = rd.result; };
      rd.readAsDataURL(f);
    };
    m.querySelector('#eSave').onclick = function () {
      var name = m.querySelector('#eName').value.trim(); if (!name) { H.toast('Give it a name'); return; }
      var patch = { name: name, category: m.querySelector('#eCat').value, desc: m.querySelector('#eDesc').value.trim(), price: +m.querySelector('#ePrice').value || 0, was: +m.querySelector('#eWas').value || null, hidden: !m.querySelector('#eShow').checked };
      if (tpl) { patch.idealFor = m.querySelector('#eFor').value.trim(); patch.demo = m.querySelector('#eDemo').value.trim(); } else { patch.meta = m.querySelector('#eMeta').value.trim(); patch.badge = m.querySelector('#eBadge').value; }
      if (pic) { var path = 'assets/img/' + kind + '/' + p.id + (isNew || !/\.webp/.test(p.image || '') ? '' : '-' + Date.now().toString(36)) + '.webp'; W.uploads[path] = pic; patch.image = path + '?v=' + Date.now().toString(36); }
      if (isNew) { patch.create = true; if (!tpl) patch.art = 'admin'; }
      setItem(kind, p.id, patch); m.remove(); drawCatalog(kind); H.toast('Saved to draft · publish when ready');
    };
    var dup = m.querySelector('#eDup'); if (dup) dup.onclick = function () { var id = nextId(kind), c = cur(kind, p), o = {}; ['name', 'category', 'desc', 'meta', 'idealFor', 'price', 'was', 'badge', 'art', 'image'].forEach(function (k) { if (c[k] != null && c[k] !== '') o[k] = c[k]; }); o.name = (o.name || '') + ' (copy)'; o.create = true; o.hidden = true; setItem(kind, id, o); m.remove(); drawCatalog(kind); H.toast('Duplicated as hidden: edit and show it when ready'); };
    var del = m.querySelector('#eDel'); if (del) del.onclick = function () { if (!confirm('Delete “' + p.name + '” from the website? It is removed when you publish. Past orders are not affected.')) return; var c = (W.items[kind] || {})[p.id]; if (c && c.create) { delete W.items[kind][p.id]; changed(); } else setItem(kind, p.id, { delete: true }); m.remove(); drawCatalog(kind); };
  }

  /* ---- the file a customer downloads after paying (private storage; link sent after M-Pesa confirms) ---- */
  function fileBox(el, p) {
    function size(n) { return n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'; }
    function draw(f, note) {
      el.innerHTML = '<b>Download file</b>' + (f ? '<p><span class="tag">' + esc(f.name) + '</span> <span class="muted">' + size(f.size || 0) + ' · added ' + H.d2(f.at) + '</span></p>' : '<p class="muted">No file yet. Customers who buy this get a download link only once a file is added here.</p>') +
        '<div class="row"><label class="b b--sm">' + (f ? 'Replace file' : 'Add file') + '<input type="file" id="fUp" hidden></label>' + (f ? '<button class="b b--sm b--ghost" id="fRm" style="color:var(--r)">Remove</button>' : '') + '<span class="muted" id="fMsg">' + (note || '') + '</span></div>';
      el.querySelector('#fUp').onchange = function () { var file = this.files[0]; if (file) up(file); };
      var rm = el.querySelector('#fRm'); if (rm) rm.onclick = function () { if (!confirm('Remove this file? Customers who already bought it will see that it is being prepared.')) return; H.api('/api/hq?route=pf-remove', { id: p.id }).then(function () { draw(null, 'Removed.'); }, function (e) { H.toast(e.message); }); };
    }
    function lib() { return window.CielBlobUpload ? Promise.resolve(window.CielBlobUpload) : new Promise(function (ok, no) { var sc = document.createElement('script'); sc.src = '/assets/vendor/vercel-blob-client-2.8.2.min.js'; sc.onload = function () { ok(window.CielBlobUpload); }; sc.onerror = function () { no(new Error('Couldn’t load the uploader.')); }; document.head.appendChild(sc); }); }
    function up(file) {
      var msg = el.querySelector('#fMsg'); msg.textContent = 'Preparing…';
      Promise.all([lib(), H.api('/api/hq?route=pf-key', { id: p.id, name: file.name })]).then(function (r) {
        return r[0](r[1].path, file, { access: 'private', handleUploadUrl: '/api/hq?route=pf-upload', multipart: file.size > 20 * 1048576, contentType: file.type || 'application/octet-stream', onUploadProgress: function (e) { msg.textContent = 'Uploading ' + Math.round(e.percentage || 0) + '%'; } })
          .then(function () { msg.textContent = 'Saving…'; return H.api('/api/hq?route=pf-attach', { id: p.id, path: r[1].path, name: file.name }); });
      }).then(function (x) { draw(x.file, 'Saved ✓ Buyers can download it.'); }, function (e) { msg.textContent = (e && e.message) || 'Upload failed.'; });
    }
    H.api('/api/hq?route=pf-list').then(function (x) { if (!x.storage) { el.innerHTML = '<b>Download file</b><p class="muted">File storage isn’t connected to this deployment.</p>'; return; } draw(x.files[p.id] || null); }, function (e) { el.innerHTML = '<p class="muted">' + esc(e.message) + '</p>'; });
  }
  window.HQSite = { init: function (h) { H = h; }, render: render, renderCatalog: renderCatalog, reload: function () { W.loaded = false; } };
})();
