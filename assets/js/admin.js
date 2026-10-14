/* ============================================================
   CIEL AFRICA — Content Manager (admin.js)
   Edits the site's data in-browser and exports valid data/*.js
   files to commit to the repo. No server, no live writes.
   - Login persists (localStorage) so a reload won't log you out
   - Edits auto-save to this browser so a reload won't lose work
   - Each tab has a Save button that downloads its data file
   ============================================================ */
(function () {
  'use strict';

  /* ---- access gate (client-side only — keep the URL private) ---- */
  var PASS = 'ciel2026';          // <-- change this to your own password
  var KEY_OK = 'ciel_admin_ok';
  var KEY_DRAFT = 'ciel_admin_draft';

  var gate = document.getElementById('gate');
  var app  = document.getElementById('app');
  var CIEL = window.CIEL || {};

  var ENTERED_PASS = '';   // kept in memory only, used to authenticate to /api/save

  function unlock() { gate.style.display = 'none'; app.classList.add('on'); boot(); }

  document.getElementById('gateBtn').addEventListener('click', tryPass);
  document.getElementById('gatePass').addEventListener('keydown', function (e) { if (e.key === 'Enter') tryPass(); });
  function tryPass() {
    var v = document.getElementById('gatePass').value;
    if (v === PASS) {
      ENTERED_PASS = v;
      try { localStorage.setItem(KEY_OK, '1'); } catch (e) {}
      unlock();
    } else { document.getElementById('gateErr').textContent = 'Wrong password.'; }
  }
  document.getElementById('logoutBtn').addEventListener('click', function () {
    try { localStorage.removeItem(KEY_OK); } catch (e) {}
    location.reload();
  });

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function esc(s) { return String(s == null ? '' : s); }

  /* ---- originals straight from the loaded data files ---- */
  var orig = {
    products:  clone(CIEL.products || []),
    templates: clone(CIEL.templates || []),
    work:      clone(CIEL.work || []),
    insights:  clone(CIEL.insights || []),
    team:      clone(CIEL.team || []),
    productCategories:  clone(CIEL.productCategories || []),
    templateCategories: clone(CIEL.templateCategories || []),
    workCategories:     clone(CIEL.workCategories || [])
  };

  // If a draft from a previous (unexported) session exists, offer to restore it
  var D = clone(orig);
  var hadDraft = false;
  try {
    var draft = localStorage.getItem(KEY_DRAFT);
    if (draft) { D = JSON.parse(draft); hadDraft = true; }
  } catch (e) {}

  function saveDraft() {
    try { localStorage.setItem(KEY_DRAFT, JSON.stringify(D)); } catch (e) {}
  }

  /* ---- toast ---- */
  var toastEl = document.getElementById('toast'), toastT;
  function toast(msg, err) {
    toastEl.textContent = msg;
    toastEl.className = 'toast show' + (err ? ' toast--err' : '');
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.className = 'toast'; }, 2400);
  }

  /* ---- data-load health check ---- */
  function loadWarning() {
    var missing = [];
    if (!CIEL.products)  missing.push('products.js');
    if (!CIEL.templates) missing.push('templates.js');
    if (!CIEL.work)      missing.push('work.js');
    if (!CIEL.team)      missing.push('team.js');
    if (missing.length) {
      var bar = document.getElementById('loadWarn');
      bar.style.display = 'block';
      bar.innerHTML = '⚠ Couldn’t load: <b>' + missing.join(', ') + '</b>. ' +
        'Make sure these files exist in your live <code>data/</code> folder and have deployed. ' +
        'Until then those sections will be empty.';
    }
  }

  /* ---- boot ---- */
  function boot() {
    loadWarning();
    document.querySelectorAll('.side button[data-tab]').forEach(function (b) {
      b.addEventListener('click', function () {
        document.querySelectorAll('.side button[data-tab]').forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
        var t = b.getAttribute('data-tab');
        document.querySelectorAll('.panel').forEach(function (p) { p.classList.toggle('on', p.getAttribute('data-panel') === t); });
      });
    });
    document.querySelectorAll('[data-add]').forEach(function (b) { b.addEventListener('click', function () { addItem(b.getAttribute('data-add')); }); });
    document.querySelectorAll('[data-save]').forEach(function (b) { b.addEventListener('click', function () { exportFile(b.getAttribute('data-save')); }); });
    document.querySelectorAll('[data-addcat]').forEach(function (b) { b.addEventListener('click', function () { addCat(b.getAttribute('data-addcat')); }); });
    var ea = document.getElementById('exportAllBtn'); if (ea) ea.addEventListener('click', exportAll);
    var ea2 = document.getElementById('exportAllBtn2'); if (ea2) ea2.addEventListener('click', exportAll);
    document.getElementById('reloadBtn').addEventListener('click', function () {
      if (confirm('Discard all unsaved changes and reload the original content?')) {
        D = clone(orig); try { localStorage.removeItem(KEY_DRAFT); } catch (e) {}
        renderAll(); toast('Reset to original');
      }
    });
    if (hadDraft) toast('Restored your unsaved changes');
    renderAll();
  }

  function renderAll() {
    renderProducts(); renderTemplates(); renderWork(); renderInsights(); renderTeam(); renderCats();
    ['products','templates','work','insights','team'].forEach(function (k) {
      var el = document.getElementById('c-' + k); if (el) el.textContent = (D[k] || []).length;
    });
    saveDraft();
  }

  /* ---------- field builders ---------- */
  function field(label, val, path, opts) {
    opts = opts || {};
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
      return '<div class="row"><div class="row__top"><span class="idx">' + esc(p.id || ('prd-' + (i + 1))) + '</span>' +
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
      return '<div class="row"><div class="row__top"><span class="idx">' + esc(t.id || ('tpl-' + (i + 1))) + '</span>' +
        '<span class="nm">' + esc(t.name) + '</span><span class="sp"></span>' +
        '<button class="btn btn--sm btn--danger" data-del="templates" data-i="' + i + '">Remove</button></div>' +
        '<div class="grid">' +
          field('Name', t.name, 'templates.' + i + '.name') +
          field('Price', t.price, 'templates.' + i + '.price', { price: true }) +
          field('Category', t.category, 'templates.' + i + '.category', { select: cats }) +
          field('Ideal for', t.idealFor || '', 'templates.' + i + '.idealFor') +
          field('Description', t.desc, 'templates.' + i + '.desc', { textarea: true, full: true }) +
        '</div><div class="addbar">' + chk('New', t.new, 'templates.' + i + '.new') + chk('Popular', t.popular, 'templates.' + i + '.popular') + '</div></div>';
    }).join('');
    wire('templates');
  }

  /* ---------- WORK ---------- */
  function renderWork() {
    var cats = (D.workCategories || []).filter(function (c) { return c !== 'All'; });
    document.getElementById('rows-work').innerHTML = D.work.map(function (w, i) {
      return '<div class="row"><div class="row__top"><span class="idx">' + esc(w.id || ('work-' + (i + 1))) + '</span>' +
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
      return '<div class="row"><div class="row__top"><span class="idx">' + esc(p.id || ('post-' + (i + 1))) + '</span>' +
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

  /* ---------- TEAM (with image upload) ---------- */
  function renderTeam() {
    document.getElementById('rows-team').innerHTML = (D.team || []).map(function (m, i) {
      var avatar = m.image
        ? '<img class="tm-avatar" src="' + esc(m.image) + '" alt="">'
        : '<div class="tm-avatar tm-avatar--ph">' + initials(m.name) + '</div>';
      return '<div class="row"><div class="row__top"><span class="idx">' + esc(m.id || ('tm-' + (i + 1))) + '</span>' +
        '<span class="nm">' + esc(m.name) + '</span><span class="sp"></span>' +
        '<button class="btn btn--sm btn--danger" data-del="team" data-i="' + i + '">Remove</button></div>' +
        '<div style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap">' +
          '<div style="display:flex;flex-direction:column;gap:8px;align-items:center">' + avatar +
            '<label class="btn btn--sm" style="cursor:pointer">Upload photo<input type="file" accept="image/*" data-img="' + i + '" style="display:none"></label>' +
            (m.image ? '<button class="btn btn--sm btn--danger" data-imgclear="' + i + '">Remove photo</button>' : '') +
          '</div>' +
          '<div class="grid" style="flex:1;min-width:240px">' +
            field('Name', m.name, 'team.' + i + '.name') +
            field('Role', m.role, 'team.' + i + '.role', { full: true }) +
            field('Bio', m.bio, 'team.' + i + '.bio', { textarea: true, full: true }) +
          '</div>' +
        '</div></div>';
    }).join('');
    wire('team');
    // wire uploads
    document.querySelectorAll('[data-img]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        var i = +inp.getAttribute('data-img');
        var file = inp.files && inp.files[0];
        if (!file) return;
        if (file.size > 900 * 1024) { toast('Image too big — keep under ~900KB', true); return; }
        var reader = new FileReader();
        reader.onload = function () { D.team[i].image = reader.result; renderTeam(); toast('Photo added'); };
        reader.readAsDataURL(file);
      });
    });
    document.querySelectorAll('[data-imgclear]').forEach(function (b) {
      b.addEventListener('click', function () { D.team[+b.getAttribute('data-imgclear')].image = ''; renderTeam(); });
    });
  }
  function initials(n) {
    return String(n || '?').trim().split(/\s+/).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase();
  }

  /* ---------- CATEGORIES ---------- */
  function renderCats() {
    renderCatList('productCategories', 'cats-products');
    renderCatList('templateCategories', 'cats-templates');
  }
  function renderCatList(prop, elId) {
    document.getElementById(elId).innerHTML = D[prop].map(function (c, i) {
      if (c === 'All') return '<span class="tag">All</span>';
      return '<span class="tag">' + esc(c) + ' <button data-delcat="' + prop + '" data-i="' + i + '" title="Remove">×</button></span>';
    }).join('');
    document.querySelectorAll('[data-delcat="' + prop + '"]').forEach(function (b) {
      b.addEventListener('click', function () { D[prop].splice(+b.getAttribute('data-i'), 1); renderCats(); saveDraft(); });
    });
  }
  function addCat(kind) {
    var prop = kind === 'products' ? 'productCategories' : 'templateCategories';
    var inp = document.getElementById('newcat-' + kind);
    var v = inp.value.trim(); if (!v) return;
    if (D[prop].indexOf(v) === -1) D[prop].push(v);
    inp.value = ''; renderCats(); saveDraft(); toast('Category added');
  }

  /* ---------- bind inputs ---------- */
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
        renderAll(); toast('Removed');
      });
    });
  }
  function setPath(el) {
    var path = el.getAttribute('data-path').split('.');
    var val;
    if (el.type === 'checkbox') val = el.checked;
    else if (el.type === 'number') val = el.value === '' ? 0 : Number(el.value);
    else val = el.value;
    var last = path[path.length - 1];
    if (last === 'technologies' || last === 'services') val = splitList(val, ',');
    if (last === 'results') val = splitList(val, '|');
    var ref = D;
    for (var i = 0; i < path.length - 1; i++) ref = ref[path[i]];
    ref[last] = val;
    if (last === 'name' || last === 'title') {
      var row = el.closest('.row'); if (row) { var nm = row.querySelector('.nm'); if (nm) nm.textContent = val; }
    }
    saveDraft();
  }
  function splitList(s, sep) { return String(s).split(sep).map(function (x) { return x.trim(); }).filter(Boolean); }

  /* ---------- add ---------- */
  function addItem(kind) {
    if (kind === 'products') D.products.push({ id: nextId('prd', D.products), art: 'admin', name: 'New product', category: (D.productCategories[1] || 'APIs'), desc: '', meta: '', price: 0, rating: 5.0, reviews: 0, badge: 'new', image: '' });
    else if (kind === 'templates') D.templates.push({ id: nextId('tpl', D.templates), name: 'New template', category: (D.templateCategories[1] || 'Business'), desc: '', idealFor: '', price: 0, image: '', new: true, popular: false });
    else if (kind === 'work') D.work.push({ id: nextId('work', D.work), name: 'New project', category: (D.workCategories && D.workCategories[1]) || 'Business System', industry: '', mockup: 'analytics', mockupAlt: 'saas', year: 'Concept', image: '', short: '', technologies: [], services: [], overview: '', challenge: '', solution: '', results: [] });
    else if (kind === 'insights') D.insights.push({ id: nextId('post', D.insights), cat: '', title: 'New post', date: String(new Date().getFullYear()), read: '5 min', image: '' });
    else if (kind === 'team') D.team.push({ id: nextId('tm', D.team), name: 'New member', role: '', bio: '', image: '' });
    renderAll();
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

  /* ---------- serialize ---------- */
  function j(v) { return JSON.stringify(v); }
  function objLine(o, keys) { return '{ ' + keys.filter(function (k) { return o[k] !== undefined; }).map(function (k) { return k + ':' + j(o[k]); }).join(', ') + ' }'; }

  function buildProducts() {
    return hdr('Digital Products') +
      'window.CIEL = window.CIEL || {};\n\nwindow.CIEL.productCategories = ' + j(D.productCategories) + ';\n\nwindow.CIEL.products = [\n' +
      D.products.map(function (p) { return '  ' + objLine(p, ['id','art','name','category','desc','meta','price','rating','reviews','badge','image']); }).join(',\n') + '\n];\n';
  }
  function buildTemplates() {
    return hdr('Website Templates') +
      'window.CIEL = window.CIEL || {};\n\nwindow.CIEL.templateCategories = ' + j(D.templateCategories) + ';\n\nwindow.CIEL.templates = [\n' +
      D.templates.map(function (t) { return '  ' + objLine(t, ['id','name','category','desc','idealFor','price','image','new','popular']); }).join(',\n') + '\n];\n';
  }
  function buildWork() {
    var wkeys = ['id','name','category','industry','mockup','mockupAlt','year','image','short','technologies','services','overview','challenge','solution','results'];
    return hdr('Selected Work + Insights') +
      'window.CIEL = window.CIEL || {};\n\nwindow.CIEL.workCategories = ' + j(D.workCategories) + ';\n\nwindow.CIEL.work = [\n' +
      D.work.map(function (w) { return '  {\n' + wkeys.filter(function (k) { return w[k] !== undefined; }).map(function (k) { return '    ' + k + ':' + j(w[k]); }).join(',\n') + '\n  }'; }).join(',\n') +
      '\n];\n\nwindow.CIEL.insights = [\n' +
      (D.insights || []).map(function (p) { return '  ' + objLine(p, ['id','cat','title','date','read','image']); }).join(',\n') + '\n];\n';
  }
  function buildTeam() {
    return hdr('Team (About page)') +
      'window.CIEL = window.CIEL || {};\n\nwindow.CIEL.team = [\n' +
      D.team.map(function (m) { return '  ' + objLine(m, ['id','name','role','bio','image']); }).join(',\n') + '\n];\n';
  }
  function hdr(title) {
    return '/* ============================================================\n   CIEL AFRICA — ' + title + '\n   Generated by the Content Manager. Edit via /admin, not by hand.\n   ============================================================ */\n';
  }

  function download(name, text) {
    var blob = new Blob([text], { type: 'text/javascript' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 400);
  }
  function buildFor(kind) {
    if (kind === 'products')  return { file: 'products.js',  text: buildProducts() };
    if (kind === 'templates') return { file: 'templates.js', text: buildTemplates() };
    if (kind === 'work')      return { file: 'work.js',      text: buildWork() };
    if (kind === 'team')      return { file: 'team.js',      text: buildTeam() };
    return null;
  }

  // Try the one-click publish API; fall back to a file download if it's
  // not set up or fails. Returns a promise resolving to 'published'|'downloaded'.
  function publishOrDownload(kind) {
    var built = buildFor(kind);
    if (!built) return Promise.resolve('skip');

    if (!ENTERED_PASS) {
      var pw = prompt('Enter your admin password to publish live (leave blank to just download the file):');
      if (pw) ENTERED_PASS = pw;
    }
    if (!ENTERED_PASS) { download(built.file, built.text); return Promise.resolve('downloaded'); }

    return fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: ENTERED_PASS, file: built.file, content: built.text })
    }).then(function (r) {
      return r.json().then(function (data) { return { status: r.status, data: data }; });
    }).then(function (res) {
      if (res.status === 200 && res.data && res.data.ok) return 'published';
      if (res.status === 401) { ENTERED_PASS = ''; toast('Publish rejected — wrong password. Downloaded instead.', true); download(built.file, built.text); return 'downloaded'; }
      // 500 = not configured yet, or other failure → graceful download
      download(built.file, built.text);
      return 'downloaded';
    }).catch(function () {
      // no function deployed / offline → download
      download(built.file, built.text);
      return 'downloaded';
    });
  }

  function exportFile(kind) {
    publishOrDownload(kind).then(function (mode) {
      if (mode === 'published') toast('Published ' + kind + '.js — live in ~30s');
      else if (mode === 'downloaded') toast('Saved ' + kind + '.js — upload it to your repo to publish');
    });
  }
  function exportAll() {
    var kinds = ['products', 'templates', 'work', 'team'];
    var published = 0, downloaded = 0;
    (function next(i) {
      if (i >= kinds.length) {
        if (downloaded === 0) toast('Published all files — live in ~30s');
        else toast('Saved ' + downloaded + ' file(s) to download — upload them to publish');
        return;
      }
      publishOrDownload(kinds[i]).then(function (mode) {
        if (mode === 'published') published++;
        if (mode === 'downloaded') downloaded++;
        setTimeout(function () { next(i + 1); }, mode === 'published' ? 120 : 300);
      });
    })(0);
  }

  /* ---- auto-unlock for returning users (runs last, when D & all
         functions are defined, so the app renders correctly) ---- */
  try { if (localStorage.getItem(KEY_OK) === '1') unlock(); } catch (e) {}

})();
