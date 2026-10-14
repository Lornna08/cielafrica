/* ============================================================
   CIEL AFRICA — Content Manager (admin.js)
   Edits the site's data in-browser and exports valid data/*.js
   files to commit to the repo. No server, no live writes.
   ============================================================ */
(function () {
  'use strict';

  /* ---- simple access gate ----
     NOTE: client-side only. Keeps the editor behind a word; it is
     NOT real security. Change the password by editing PASS below. */
  var PASS = 'ciel2026';          // <-- change this to your own password
  var KEY_OK = 'ciel_admin_ok';

  var gate = document.getElementById('gate');
  var app  = document.getElementById('app');
  var CIEL = window.CIEL || {};

  function unlock() {
    gate.style.display = 'none';
    app.classList.add('on');
    boot();
  }
  if (sessionStorage.getItem(KEY_OK) === '1') unlock();

  document.getElementById('gateBtn').addEventListener('click', tryPass);
  document.getElementById('gatePass').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') tryPass();
  });
  function tryPass() {
    var v = document.getElementById('gatePass').value;
    if (v === PASS) { try { sessionStorage.setItem(KEY_OK, '1'); } catch (e) {} unlock(); }
    else { document.getElementById('gateErr').textContent = 'Wrong password.'; }
  }
  document.getElementById('logoutBtn').addEventListener('click', function () {
    try { sessionStorage.removeItem(KEY_OK); } catch (e) {}
    location.reload();
  });

  /* ---- working copies (deep clone so Reset works) ---- */
  var orig = {
    products:  clone(CIEL.products || []),
    templates: clone(CIEL.templates || []),
    work:      clone(CIEL.work || []),
    insights:  clone(CIEL.insights || []),
    productCategories:  clone(CIEL.productCategories || []),
    templateCategories: clone(CIEL.templateCategories || []),
    workCategories:     clone(CIEL.workCategories || [])
  };
  var D = clone(orig);

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function esc(s) { return String(s == null ? '' : s); }

  /* ---- toast ---- */
  var toastEl = document.getElementById('toast'), toastT;
  function toast(msg, err) {
    toastEl.textContent = msg;
    toastEl.className = 'toast show' + (err ? ' toast--err' : '');
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.className = 'toast'; }, 2200);
  }

  /* ---- tabs ---- */
  function boot() {
    document.querySelectorAll('.side button[data-tab]').forEach(function (b) {
      b.addEventListener('click', function () {
        document.querySelectorAll('.side button[data-tab]').forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
        var t = b.getAttribute('data-tab');
        document.querySelectorAll('.panel').forEach(function (p) {
          p.classList.toggle('on', p.getAttribute('data-panel') === t);
        });
      });
    });
    document.querySelectorAll('[data-add]').forEach(function (b) {
      b.addEventListener('click', function () { addItem(b.getAttribute('data-add')); });
    });
    document.querySelectorAll('[data-export]').forEach(function (b) {
      b.addEventListener('click', function () { exportFile(b.getAttribute('data-export')); });
    });
    document.querySelectorAll('[data-addcat]').forEach(function (b) {
      b.addEventListener('click', function () { addCat(b.getAttribute('data-addcat')); });
    });
    document.getElementById('exportAllBtn').addEventListener('click', exportAll);
    document.getElementById('exportAllBtn2').addEventListener('click', exportAll);
    document.getElementById('reloadBtn').addEventListener('click', function () {
      if (confirm('Discard all changes and reload the original content?')) { D = clone(orig); renderAll(); toast('Reset to original'); }
    });
    renderAll();
  }

  function renderAll() {
    renderProducts(); renderTemplates(); renderWork(); renderInsights(); renderCats();
    ['products','templates','work','insights'].forEach(function (k) {
      var el = document.getElementById('c-' + k); if (el) el.textContent = D[k].length;
    });
  }

  /* ---------- field builders ---------- */
  function field(label, val, path, opts) {
    opts = opts || {};
    var id = 'fld';
    var input;
    if (opts.textarea) input = '<textarea data-path="' + path + '">' + esc(val) + '</textarea>';
    else if (opts.select) {
      input = '<select data-path="' + path + '">' + opts.select.map(function (o) {
        return '<option' + (o === val ? ' selected' : '') + '>' + esc(o) + '</option>';
      }).join('') + '</select>';
    } else if (opts.price) {
      input = '<div class="pricewrap"><span class="ks">KES</span><input type="number" min="0" step="500" data-path="' + path + '" value="' + esc(val) + '"></div>';
    } else {
      input = '<input data-path="' + path + '" value="' + esc(val).replace(/"/g, '&quot;') + '">';
    }
    return '<div class="f' + (opts.full ? ' f--full' : '') + '"><label>' + label + '</label>' + input +
           (opts.help ? '<span class="help">' + opts.help + '</span>' : '') + '</div>';
  }
  function chk(label, val, path) {
    return '<label class="chk"><input type="checkbox" data-path="' + path + '"' + (val ? ' checked' : '') + '> ' + label + '</label>';
  }

  /* ---------- PRODUCTS ---------- */
  function renderProducts() {
    var cats = D.productCategories.filter(function (c) { return c !== 'All'; });
    document.getElementById('rows-products').innerHTML = D.products.map(function (p, i) {
      return '<div class="row">' +
        '<div class="row__top"><span class="idx">' + esc(p.id || ('prd-' + (i + 1))) + '</span>' +
        '<span class="nm">' + esc(p.name) + '</span><span class="sp"></span>' +
        '<button class="btn btn--sm btn--danger" data-del="products" data-i="' + i + '">Remove</button></div>' +
        '<div class="grid">' +
          field('Name', p.name, 'products.' + i + '.name') +
          field('Price', p.price, 'products.' + i + '.price', { price: true }) +
          field('Category', p.category, 'products.' + i + '.category', { select: cats }) +
          field('Badge', p.badge || '', 'products.' + i + '.badge', { select: ['', 'new', 'popular'] }) +
          field('Description', p.desc, 'products.' + i + '.desc', { textarea: true, full: true }) +
          field('Meta line', p.meta || '', 'products.' + i + '.meta', { full: true, help: 'Short detail line shown under the product.' }) +
          field('Rating', p.rating, 'products.' + i + '.rating') +
          field('Art key', p.art || '', 'products.' + i + '.art', { help: 'Controls the product visual (advanced — leave as is).' }) +
        '</div></div>';
    }).join('');
    wire('products');
  }

  /* ---------- TEMPLATES ---------- */
  function renderTemplates() {
    var cats = D.templateCategories.filter(function (c) { return c !== 'All'; });
    document.getElementById('rows-templates').innerHTML = D.templates.map(function (t, i) {
      return '<div class="row">' +
        '<div class="row__top"><span class="idx">' + esc(t.id || ('tpl-' + (i + 1))) + '</span>' +
        '<span class="nm">' + esc(t.name) + '</span><span class="sp"></span>' +
        '<button class="btn btn--sm btn--danger" data-del="templates" data-i="' + i + '">Remove</button></div>' +
        '<div class="grid">' +
          field('Name', t.name, 'templates.' + i + '.name') +
          field('Price', t.price, 'templates.' + i + '.price', { price: true }) +
          field('Category', t.category, 'templates.' + i + '.category', { select: cats }) +
          field('Ideal for', t.idealFor || '', 'templates.' + i + '.idealFor') +
          field('Description', t.desc, 'templates.' + i + '.desc', { textarea: true, full: true }) +
        '</div>' +
        '<div class="addbar">' + chk('New', t.new, 'templates.' + i + '.new') + chk('Popular', t.popular, 'templates.' + i + '.popular') + '</div>' +
        '</div>';
    }).join('');
    wire('templates');
  }

  /* ---------- WORK ---------- */
  function renderWork() {
    var cats = (D.workCategories || []).filter(function (c) { return c !== 'All'; });
    document.getElementById('rows-work').innerHTML = D.work.map(function (w, i) {
      return '<div class="row">' +
        '<div class="row__top"><span class="idx">' + esc(w.id || ('work-' + (i + 1))) + '</span>' +
        '<span class="nm">' + esc(w.name) + '</span><span class="sp"></span>' +
        '<button class="btn btn--sm btn--danger" data-del="work" data-i="' + i + '">Remove</button></div>' +
        '<div class="grid">' +
          field('Name', w.name, 'work.' + i + '.name') +
          field('Category', w.category, 'work.' + i + '.category', cats.length ? { select: cats } : {}) +
          field('Industry', w.industry || '', 'work.' + i + '.industry') +
          field('Year', w.year || '', 'work.' + i + '.year') +
          field('Short summary', w.short || '', 'work.' + i + '.short', { textarea: true, full: true }) +
          field('Overview', w.overview || '', 'work.' + i + '.overview', { textarea: true, full: true }) +
          field('Challenge', w.challenge || '', 'work.' + i + '.challenge', { textarea: true, full: true }) +
          field('Solution', w.solution || '', 'work.' + i + '.solution', { textarea: true, full: true }) +
          field('Technologies', (w.technologies || []).join(', '), 'work.' + i + '.technologies', { full: true, help: 'Comma-separated.' }) +
          field('Services', (w.services || []).join(', '), 'work.' + i + '.services', { full: true, help: 'Comma-separated.' }) +
          field('Results', (w.results || []).join(' | '), 'work.' + i + '.results', { full: true, help: 'Separate each result with a vertical bar |' }) +
        '</div></div>';
    }).join('');
    wire('work');
  }

  /* ---------- INSIGHTS ---------- */
  function renderInsights() {
    document.getElementById('rows-insights').innerHTML = (D.insights || []).map(function (p, i) {
      return '<div class="row">' +
        '<div class="row__top"><span class="idx">' + esc(p.id || ('post-' + (i + 1))) + '</span>' +
        '<span class="nm">' + esc(p.title) + '</span><span class="sp"></span>' +
        '<button class="btn btn--sm btn--danger" data-del="insights" data-i="' + i + '">Remove</button></div>' +
        '<div class="grid">' +
          field('Title', p.title, 'insights.' + i + '.title', { full: true }) +
          field('Category', p.cat || '', 'insights.' + i + '.cat') +
          field('Date', p.date || '', 'insights.' + i + '.date') +
          field('Read time', p.read || '', 'insights.' + i + '.read') +
        '</div></div>';
    }).join('');
    wire('insights');
  }

  /* ---------- CATEGORIES ---------- */
  function renderCats() {
    renderCatList('products', 'productCategories', 'cats-products');
    renderCatList('templates', 'templateCategories', 'cats-templates');
  }
  function renderCatList(kind, prop, elId) {
    document.getElementById(elId).innerHTML = D[prop].map(function (c, i) {
      if (c === 'All') return '<span class="tag">All</span>';
      return '<span class="tag">' + esc(c) + ' <button data-delcat="' + prop + '" data-i="' + i + '" title="Remove">×</button></span>';
    }).join('');
    document.querySelectorAll('[data-delcat="' + prop + '"]').forEach(function (b) {
      b.addEventListener('click', function () {
        D[prop].splice(+b.getAttribute('data-i'), 1); renderCats();
      });
    });
  }
  function addCat(kind) {
    var prop = kind === 'products' ? 'productCategories' : 'templateCategories';
    var inp = document.getElementById('newcat-' + kind);
    var v = inp.value.trim();
    if (!v) return;
    if (D[prop].indexOf(v) === -1) D[prop].push(v);
    inp.value = ''; renderCats(); toast('Category added');
  }

  /* ---------- bind inputs to data ---------- */
  function wire(kind) {
    var root = document.getElementById('rows-' + kind);
    root.querySelectorAll('[data-path]').forEach(function (el) {
      el.addEventListener('input', function () { setPath(el); });
      el.addEventListener('change', function () { setPath(el); });
    });
    root.querySelectorAll('[data-del]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (!confirm('Remove this item?')) return;
        D[b.getAttribute('data-del')].splice(+b.getAttribute('data-i'), 1);
        renderAll();
        toast('Removed');
      });
    });
  }

  function setPath(el) {
    var path = el.getAttribute('data-path').split('.');
    var val;
    if (el.type === 'checkbox') val = el.checked;
    else if (el.type === 'number') val = el.value === '' ? 0 : Number(el.value);
    else val = el.value;

    // array fields
    var last = path[path.length - 1];
    if (last === 'technologies' || last === 'services') val = splitList(val, ',');
    if (last === 'results') val = splitList(val, '|');

    var ref = D;
    for (var i = 0; i < path.length - 1; i++) ref = ref[path[i]];
    ref[last] = val;

    // live-update the row title
    if (last === 'name' || last === 'title') {
      var row = el.closest('.row'); if (row) { var nm = row.querySelector('.nm'); if (nm) nm.textContent = val; }
    }
  }
  function splitList(s, sep) {
    return String(s).split(sep).map(function (x) { return x.trim(); }).filter(Boolean);
  }

  /* ---------- add item ---------- */
  function addItem(kind) {
    if (kind === 'products') {
      D.products.push({ id: nextId('prd', D.products), art: 'admin', name: 'New product', category: (D.productCategories[1] || 'APIs'), desc: '', meta: '', price: 0, rating: 5.0, reviews: 0, badge: 'new', image: '' });
    } else if (kind === 'templates') {
      D.templates.push({ id: nextId('tpl', D.templates), name: 'New template', category: (D.templateCategories[1] || 'Business'), desc: '', idealFor: '', price: 0, image: '', new: true, popular: false });
    } else if (kind === 'work') {
      D.work.push({ id: nextId('work', D.work), name: 'New project', category: (D.workCategories && D.workCategories[1]) || 'Business System', industry: '', mockup: 'analytics', mockupAlt: 'saas', year: 'Concept', image: '', short: '', technologies: [], services: [], overview: '', challenge: '', solution: '', results: [] });
    } else if (kind === 'insights') {
      D.insights.push({ id: nextId('post', D.insights), cat: '', title: 'New post', date: String(new Date().getFullYear()), read: '5 min', image: '' });
    }
    renderAll();
    // jump to that tab
    var tabBtn = document.querySelector('.side button[data-tab="' + kind + '"]'); if (tabBtn) tabBtn.click();
    toast('Added — scroll to the bottom');
    var rows = document.getElementById('rows-' + kind);
    if (rows && rows.lastElementChild) rows.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function nextId(prefix, arr) {
    var max = 0;
    arr.forEach(function (o) { var m = /(\d+)$/.exec(o.id || ''); if (m) max = Math.max(max, +m[1]); });
    var n = String(max + 1); if (n.length < 2) n = '0' + n;
    return prefix + '-' + n;
  }

  /* ---------- serialize back to data/*.js ---------- */
  function j(v) { return JSON.stringify(v); }           // compact, safe strings
  function objLine(o, keys) {
    return '{ ' + keys.filter(function (k) { return o[k] !== undefined; })
      .map(function (k) { return k + ':' + j(o[k]); }).join(', ') + ' }';
  }

  function buildProducts() {
    var head =
'/* ============================================================\n' +
'   CIEL AFRICA — Digital Products\n' +
'   Generated by the Content Manager. Edit via /admin, not by hand.\n' +
'   ============================================================ */\n' +
'window.CIEL = window.CIEL || {};\n\n' +
'window.CIEL.productCategories = ' + j(D.productCategories) + ';\n\n' +
'window.CIEL.products = [\n';
    var keys = ['id','art','name','category','desc','meta','price','rating','reviews','badge','image'];
    var body = D.products.map(function (p) { return '  ' + objLine(p, keys); }).join(',\n');
    return head + body + '\n];\n';
  }
  function buildTemplates() {
    var head =
'/* ============================================================\n' +
'   CIEL AFRICA — Website Templates\n' +
'   Generated by the Content Manager. Edit via /admin, not by hand.\n' +
'   ============================================================ */\n' +
'window.CIEL = window.CIEL || {};\n\n' +
'window.CIEL.templateCategories = ' + j(D.templateCategories) + ';\n\n' +
'window.CIEL.templates = [\n';
    var keys = ['id','name','category','desc','idealFor','price','image','new','popular'];
    var body = D.templates.map(function (t) { return '  ' + objLine(t, keys); }).join(',\n');
    return head + body + '\n];\n';
  }
  function buildWork() {
    var head =
'/* ============================================================\n' +
'   CIEL AFRICA — Selected Work + Insights\n' +
'   Generated by the Content Manager. Edit via /admin, not by hand.\n' +
'   ============================================================ */\n' +
'window.CIEL = window.CIEL || {};\n\n' +
'window.CIEL.workCategories = ' + j(D.workCategories) + ';\n\n' +
'window.CIEL.work = [\n';
    var wkeys = ['id','name','category','industry','mockup','mockupAlt','year','image','short','technologies','services','overview','challenge','solution','results'];
    var body = D.work.map(function (w) {
      return '  {\n' + wkeys.filter(function (k) { return w[k] !== undefined; })
        .map(function (k) { return '    ' + k + ':' + j(w[k]); }).join(',\n') + '\n  }';
    }).join(',\n');
    var ins =
'\n];\n\n' +
'window.CIEL.insights = [\n' +
    (D.insights || []).map(function (p) {
      return '  ' + objLine(p, ['id','cat','title','date','read','image']);
    }).join(',\n') +
'\n];\n';
    return head + body + ins;
  }

  function download(name, text) {
    var blob = new Blob([text], { type: 'text/javascript' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 400);
  }
  function exportFile(kind) {
    if (kind === 'products')  download('products.js', buildProducts());
    if (kind === 'templates') download('templates.js', buildTemplates());
    if (kind === 'work')      download('work.js', buildWork());
    toast('Downloaded ' + kind + '.js');
  }
  function exportAll() {
    exportFile('products');
    setTimeout(function () { exportFile('templates'); }, 250);
    setTimeout(function () { exportFile('work'); }, 500);
    setTimeout(function () { toast('Downloaded all 3 files'); }, 650);
  }

})();
