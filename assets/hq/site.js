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
        W.products = (evalData(r[2]).products || []).filter(function (p) { return p.id !== 'prd-test'; });
        W.templates = evalData(r[3]).templates || [];
        W.pbBase = C.readPhotoBooks(r[4]);
        var d = r[5] && r[5].draft;
        W.model = d && d.model ? d.model : clone(W.base);
        W.items = d && d.items ? d.items : { products: {}, templates: {} };
        W.pb = d && d.photobooks ? d.photobooks : clone(W.pbBase);
        W.draftAt = d && d.at; W.loaded = true;
      });
  }
  function changed() { W.dirty = true; status(); clearTimeout(W.t); W.t = setTimeout(saveDraft, 1800); if (W.tab !== 'prices') preview(); }
  function saveDraft() {
    W.saving = true; status();
    return H.api('/api/hq?route=site-draft-save', { model: W.model, items: W.items, photobooks: W.pb }).then(function (r) { W.draftAt = r.at; W.dirty = false; W.saving = false; status(); }, function (e) { W.saving = false; status(e.message); });
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
    b.querySelector('#wsDiscard').onclick = function () { if (!confirm('Discard all unpublished changes and go back to what is live?')) return; H.api('/api/hq?route=site-draft-save', { clear: true }).then(function () { W.model = clone(W.base); W.items = { products: {}, templates: {} }; W.pb = clone(W.pbBase); W.draftAt = null; W.dirty = false; draw(); H.toast('Draft discarded'); }); };
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
  function formPrices(f) {
    function rowsFor(list, key, unit) {
      var ch = W.items[key] = W.items[key] || {};
      return list.map(function (p) {
        var c = ch[p.id] || {}, price = c.price != null ? c.price : p.price, was = 'was' in c ? c.was : p.was, hidden = 'hidden' in c ? c.hidden : !!p.hidden;
        return '<tr data-id="' + esc(p.id) + '" class="' + (hidden ? 'is-off' : '') + '"><td><b>' + esc(p.name) + '</b><small>' + esc(p.category || '') + '</small></td><td><input class="hq-in ws-num" type="number" min="0" step="50" data-f="price" value="' + esc(price) + '"></td><td><input class="hq-in ws-num" type="number" min="0" step="50" data-f="was" value="' + esc(was || '') + '" placeholder="—"></td><td><label class="check"><input type="checkbox" data-f="show"' + (hidden ? '' : ' checked') + '> Visible</label></td></tr>';
      }).join('');
    }
    var pb = W.pb;
    f.innerHTML = '<section class="card"><div class="card__h"><h2>Photo Books</h2><span class="muted" style="font-size:.8rem">Used by the editor, checkout and M-Pesa amount</span></div><div class="card__b ws-4">' +
      inp('Printed hardcover · first 24 pages (KES)', pb.printBase, 'type="number" min="0" data-k="printBase"') + inp('Each extra page (KES)', pb.printPage, 'type="number" min="0" data-k="printPage"') +
      inp('Print-ready PDF · first 24 pages (KES)', pb.pdfBase, 'type="number" min="0" data-k="pdfBase"') + inp('Each extra page (KES)', pb.pdfPage, 'type="number" min="0" data-k="pdfPage"') +
      Object.keys(pb.delivery).map(function (id) { return inp('Delivery: ' + esc(pb.delivery[id].name), pb.delivery[id].price, 'type="number" min="0" data-k="delivery.' + id + '.price"'); }).join('') + '</div></section>' +
      '<section class="card"><div class="card__h"><h2>Products</h2><span class="muted" style="font-size:.8rem">“Was” shows a sale: the old price crossed out</span></div><table class="tbl ws-tbl"><thead><tr><th>Product</th><th>Price (KES)</th><th>Was</th><th>Shown</th></tr></thead><tbody data-key="products">' + rowsFor(W.products, 'products') + '</tbody></table></section>' +
      '<section class="card"><div class="card__h"><h2>Website templates</h2></div><table class="tbl ws-tbl"><thead><tr><th>Template</th><th>From (KES)</th><th>Was</th><th>Shown</th></tr></thead><tbody data-key="templates">' + rowsFor(W.templates, 'templates') + '</tbody></table></section>' +
      '<p class="faint" style="font-size:.8rem">New prices apply to new orders once published. Items already in a customer’s cart keep the price they were added at.</p>';
    bindInputs(f.querySelector('.card__b'), function (k, v) { if (/^delivery\./.test(k)) { var id = k.split('.')[1]; pb.delivery[id].price = +v; } else pb[k] = +v; });
    f.querySelectorAll('tbody[data-key] input').forEach(function (x) {
      x.addEventListener(x.type === 'checkbox' ? 'change' : 'input', function () {
        var key = x.closest('tbody').getAttribute('data-key'), tr = x.closest('tr'), id = tr.getAttribute('data-id'), ch = W.items[key][id] = W.items[key][id] || {}, fl = x.getAttribute('data-f');
        if (fl === 'price') ch.price = +x.value; else if (fl === 'was') ch.was = x.value ? +x.value : null; else { ch.hidden = !x.checked; tr.classList.toggle('is-off', !x.checked); }
        changed();
      });
    });
  }

  /* ---------- history ---------- */
  function formHistory(f) {
    f.innerHTML = '<section class="card"><div class="card__h"><h2>Published versions</h2></div><div id="hv"><p class="empty">Loading…</p></div></section>';
    H.api('/api/hq?route=site-versions').then(function (r) {
      var el = document.getElementById('hv');
      if (!r.items.length) { el.innerHTML = '<p class="empty">Nothing published from Ciel HQ yet. Every publish is listed here and can be loaded back.</p>'; return; }
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
      H.api('/api/hq?route=site-publish', { model: W.model, items: W.items, photobooks: pbCh ? W.pb : null, note: m.querySelector('#pubNote').value }).then(function (r) {
        if (!r.sha) { msg.textContent = r.message || 'Nothing changed.'; go.disabled = false; return; }
        msg.innerHTML = 'Saved (' + esc(r.files.length) + ' files). Deploying to cielafrica.com… <span class="ws-spin"></span>';
        W.draftAt = null; W.dirty = false; status();
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

  window.HQSite = { init: function (h) { H = h; }, render: render, reload: function () { W.loaded = false; } };
})();
