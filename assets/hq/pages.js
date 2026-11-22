/* ============================================================
   CIEL ADMIN — Website editor: every page, section by section.
   Each section shows a live preview on top and its words, pictures
   and buttons underneath. Changes are kept as small edits (this text
   → that text) so they can be laid onto the newest version of the
   page when you publish. Also: what shows first on the Templates,
   Products, Work and Services pages, and the About page team.
   ============================================================ */
(function () {
  var X, W, C, H, esc;
  var PAGES = [['index.html', 'Home'], ['about.html', 'About'], ['services.html', 'Services'], ['templates.html', 'Templates'], ['work.html', 'Work'], ['products.html', 'Products'], ['contact.html', 'Contact'], ['insights.html', 'Insights'], ['domains.html', 'Domains'], ['quote.html', 'Start a project'], ['subscribe.html', 'Subscribe'], ['thanks.html', 'Thank you']];
  var HOME_NAMES = { HERO: 'Hero (top of the page)' };
  var AUTO = { team: 'The team (edit below)', tgrid: 'Templates (from Products → Templates)', tfilters: 'Template filters', tcount: 'Template count', pgrid: 'Products (from Products)', pfilters: 'Product filters', pcount: 'Product count', workTpl: 'Templates we built', wrows: 'Case studies', posts: 'Insights posts' };

  function init(ctx) { X = ctx; W = ctx.W; C = ctx.C; H = ctx.H; esc = H.esc; W.pages = W.pages || {}; W.src = W.src || {}; }

  /* ---------------- reading a page ---------------- */
  function frag(html) { var t = document.createElement('template'); t.innerHTML = html; return t; }
  function skip(el, home) { return !!el.closest('script,style,svg,noscript,template,[data-pre],select,option,textarea') || (home && !!el.closest('.sechead__t,.sechead__lead')); }
  function texts(root, home) {
    var out = [], w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) { var v = n.nodeValue.replace(/\s+/g, ' ').trim(); if (!v || !/[A-Za-z0-9]/.test(v) || skip(n.parentElement, home)) continue; out.push(n); }
    return out;
  }
  function imgs(root) { return [].filter.call(root.querySelectorAll('img'), function (x) { return !x.closest('[data-pre],noscript,template') && !/facebook\.com/.test(x.getAttribute('src') || ''); }); }
  function links(root) { return [].filter.call(root.querySelectorAll('a[href]'), function (x) { var h = x.getAttribute('href'); return !x.closest('[data-pre],template') && h && h.charAt(0) !== '#' && x.textContent.trim(); }); }
  function label(n) {
    var el = n.parentElement, t = el.closest('a,button') || el.closest('h1,h2,h3,h4,h5') || el.closest('p,li,label,figcaption,blockquote,dt,dd,small') || el, tag = t.tagName.toLowerCase();
    var base = tag === 'h1' ? 'Big heading' : tag === 'h2' ? 'Heading' : /^h[3-5]$/.test(tag) ? 'Small heading' : tag === 'p' ? 'Text' : tag === 'li' ? 'List item' : tag === 'a' || tag === 'button' ? 'Button / link' : 'Text';
    if (el.closest('.em')) base += ' · coloured part'; else if (el.closest('em,strong,b')) base += ' · bold part';
    if (el.closest('.k,.eyebrow,.crumb')) base = 'Small label';
    return base;
  }
  function norm(v) { return String(v || '').replace(/\s+/g, ' ').trim(); }

  /* the sections of a page: [{ key, html, visible, home }] in their current order */
  function sectionsOf(file, html) {
    if (file === 'index.html') {
      var s = C.splitMain(html), by = {}; s.blocks.forEach(function (b) { by[b.key] = b; });
      return W.model.sections.filter(function (x) { return by[x.key]; }).map(function (x) { return { key: x.key, html: by[x.key].html, visible: x.visible !== false, home: true, name: HOME_NAMES[x.key] || x.name }; });
    }
    var a = html.indexOf('<main id="main">'), b = html.lastIndexOf('</main>'); if (a < 0 || b < 0) return [];
    var t = frag(html.slice(a + 16, b)), list = [].filter.call(t.content.children, function (e) { return e.tagName === 'SECTION'; });
    var ops = W.pages[file] || {}, out = list.map(function (e, i) { return { key: 's' + i, html: e.outerHTML, visible: !e.hasAttribute('data-cms-hidden') && !(ops.hide && ops.hide['s' + i]), el: e }; });
    if (ops.order && ops.order.length) { var pos = {}; ops.order.forEach(function (k, i) { pos[k] = i; }); out.sort(function (x, y) { return (pos[x.key] != null ? pos[x.key] : 99 + +x.key.slice(1)) - (pos[y.key] != null ? pos[y.key] : 99 + +y.key.slice(1)); }); }
    return out;
  }
  function sectionName(sec, i) {
    if (sec.name) return sec.name;
    var t = frag(sec.html).content, h = t.querySelector('h1,h2,h3');
    if (h) [].forEach.call(h.querySelectorAll('br'), function (br) { br.replaceWith(' '); });
    var name = h ? norm(h.textContent) : '';
    return name ? name.slice(0, 60) : 'Section ' + (i + 1);
  }
  function autoOf(html) { var t = frag(html).content, f = []; Object.keys(AUTO).forEach(function (id) { if (t.querySelector('#' + id)) f.push(id); }); if (t.querySelector('[data-reviews]')) f.push('reviews'); if (t.querySelector('[data-subscribe]')) f.push('subscribe'); return f; }

  /* ---------------- laying edits onto a section ---------------- */
  function applySec(html, op, home) {
    var cnt = function (o) { return o ? Object.keys(o).length : 0; };
    if (!op || !(cnt(op.t) + cnt(op.im) + cnt(op.hr))) return html;
    var t = frag(html), root = t.content;
    var tn = texts(root, home);
    Object.keys(op.t || {}).forEach(function (i) {
      var e = op.t[i], n = tn[+i];
      if (!n || norm(n.nodeValue) !== norm(e.from)) n = tn.filter(function (x) { return norm(x.nodeValue) === norm(e.from); })[0];
      if (n) { var lead = /^\s/.test(n.nodeValue) ? ' ' : '', trail = /\s$/.test(n.nodeValue) ? ' ' : ''; n.nodeValue = lead + e.to + trail; }
    });
    var im = imgs(root);
    Object.keys(op.im || {}).forEach(function (i) {
      var e = op.im[i], n = im[+i];
      if (!n || (n.getAttribute('src') || '') !== e.from) n = im.filter(function (x) { return (x.getAttribute('src') || '') === e.from; })[0];
      if (n) { if (e.to) { n.setAttribute('src', e.to); n.removeAttribute('srcset'); } if (e.alt != null) n.setAttribute('alt', e.alt); }
    });
    var ln = links(root);
    Object.keys(op.hr || {}).forEach(function (i) {
      var e = op.hr[i], n = ln[+i];
      if (!n || n.getAttribute('href') !== e.from) n = ln.filter(function (x) { return x.getAttribute('href') === e.from; })[0];
      if (n) n.setAttribute('href', e.to);
    });
    return t.innerHTML;
  }
  /* the whole page with the draft's edits (menus and the homepage hero are added by sitecms.apply) */
  function compose(file, html) {
    var ops = W.pages[file] || {};
    if (file === 'index.html') {
      var s = C.splitMain(html);
      s.blocks.forEach(function (b) { if (ops[b.key]) b.html = applySec(b.html, ops[b.key], true); });
      return s.head + s.pre + s.blocks.map(function (b) { return '\n<!-- ' + b.key + ' -->\n' + (b.visible ? b.html : '<template data-cms-off>' + b.html.replace(/\s+$/, '') + '</template>\n'); }).join('') + s.tail;
    }
    var a = html.indexOf('<main id="main">'), z = html.lastIndexOf('</main>'); if (a < 0 || z < 0) return html;
    var t = frag(html.slice(a + 16, z)), list = [].filter.call(t.content.children, function (e) { return e.tagName === 'SECTION'; });
    list.forEach(function (e, i) {
      var k = 's' + i, op = ops[k];
      if (op) { var nt = frag(applySec(e.outerHTML, op, false)).content.firstElementChild; if (nt) { e.parentNode.replaceChild(nt, e); list[i] = nt; e = nt; } }
      if (ops.hide && ops.hide[k]) { e.setAttribute('data-cms-hidden', ''); e.style.display = 'none'; }
      else if (ops.hide && ops.hide[k] === false) { e.removeAttribute('data-cms-hidden'); e.style.removeProperty('display'); if (!e.getAttribute('style')) e.removeAttribute('style'); }
    });
    if (ops.order && ops.order.length) {
      var anchor = list[list.length - 1].nextSibling, par = list[0].parentNode, pos = {};
      ops.order.forEach(function (k, i) { pos[k] = i; });
      list.map(function (e, i) { return [e, pos['s' + i] != null ? pos['s' + i] : 99 + i]; }).sort(function (x, y) { return x[1] - y[1]; }).forEach(function (x) { par.insertBefore(x[0], anchor); });
    }
    return html.slice(0, a + 16) + t.innerHTML + html.slice(z);
  }
  function hasEdits(file) { var o = W.pages[file]; return !!o && Object.keys(o).some(function (k) { var v = o[k]; return k === 'order' ? v && v.length : k === 'hide' ? v && Object.keys(v).length : v && (Object.keys(v.t || {}).length || Object.keys(v.im || {}).length || Object.keys(v.hr || {}).length); }); }
  function editedPages() { return Object.keys(W.pages || {}).filter(hasEdits); }

  /* ---------------- previews ---------------- */
  function withUploads(html) { Object.keys(W.uploads || {}).forEach(function (p) { if (/^assets\/img\/(site|team)\//.test(p)) html = html.split(p).join('data:image/webp;base64,' + W.uploads[p]); }); return html; }
  function headOf(html) { var h = html.slice(0, html.indexOf('</head>')).replace('<head>', '<head><base href="/">'); return h + '<style>[data-r]{opacity:1!important;transform:none!important}body{margin:0}.nav,.mobile-menu,.foot,.wa-float,#cookieBar{display:none!important}main{padding-top:0!important}</style></head>'; }
  /* one section of the draft, from the live page plus edits (keys stay those of the live page) */
  function secHtml(file, base, key) {
    if (file === 'index.html') { var bl = C.splitMain(draftPage(file, base)).blocks.filter(function (x) { return x.key === key; })[0]; return bl ? bl.html : ''; }
    var s = sectionsOf(file, base).filter(function (x) { return x.key === key; })[0];
    return s ? applySec(s.html, (W.pages[file] || {})[key], false) : '';
  }
  /* a section on its own (fast, no scripts); parts filled by scripts get the page's scripts too, with only that part shown */
  function secDoc(file, base, key, auto) {
    var one = secHtml(file, base, key).replace(/style="display:none"/, '');
    if (!auto) return withUploads(headOf(base) + '<body><main id="main">' + one + '</main></body></html>');
    var a = base.indexOf('<main id="main">'), z = base.lastIndexOf('</main>');
    var page = base.slice(0, a + 16) + one + base.slice(z);
    return withUploads(override(page.replace('<head>', '<head><base href="/">').replace('</head>', '<style>[data-r]{opacity:1!important;transform:none!important}body{margin:0}.nav,.mobile-menu,.foot,.wa-float,#cookieBar,.ann{display:none!important}main{padding-top:0!important}</style></head>')));
  }
  /* the draft's order and team, for previews of pages that draw them from data files */
  function override(page) {
    var o = { templates: W.order.templates || null, products: W.order.products || null, work: W.order.work || null }, team = W.team || null;
    var js = '<script>(function(){var C=window.CIEL||{},O=' + JSON.stringify(o) + ',T=' + JSON.stringify(team) + ';function so(a,ids){if(!a||!ids)return a;var p={};ids.forEach(function(id,i){p[id]=i});return a.slice().sort(function(x,y){return (p[x.id]!=null?p[x.id]:1e4+a.indexOf(x))-(p[y.id]!=null?p[y.id]:1e4+a.indexOf(y))})}C.templates=so(C.templates,O.templates);C.products=so(C.products,O.products);C.work=so(C.work,O.work);if(T)C.team=T;})();<\/script>';
    js = js.replace(/<\/(?!script>)/g, '<\\/');
    var last = -1, re = /<script src="\/?data\/[^"]+"><\/script>/g, m; while ((m = re.exec(page))) last = m.index + m[0].length;
    return last > 0 ? page.slice(0, last) + js + page.slice(last) : page.replace('</body>', js + '</body>');
  }
  var io = null;
  function mountPreview(box, doc, onReady) {
    var dev = W.pgDev || (innerWidth < 700 ? 'mobile' : 'desktop'), w = dev === 'mobile' ? 390 : 1280;
    var f = box.querySelector('iframe'); if (!f) { f = document.createElement('iframe'); f.setAttribute('tabindex', '-1'); f.setAttribute('title', 'Section preview'); box.querySelector('.pg-pv__in').appendChild(f); }
    var sc = Math.min(1, (box.clientWidth || 340) / w);
    f.style.width = w + 'px'; f.style.transform = 'scale(' + sc + ')';
    f.onload = function () { var h = 300; try { var d = f.contentDocument; h = Math.max(d.documentElement.scrollHeight, d.body ? d.body.scrollHeight : 0); setTimeout(function () { try { var h2 = Math.max(d.documentElement.scrollHeight, d.body.scrollHeight); if (h2 > h) size(h2); } catch (e) { } }, 900); } catch (e) { } size(h); };
    function size(h) { f.style.height = h + 'px'; box.querySelector('.pg-pv__in').style.height = Math.round(h * sc) + 'px'; box.classList.toggle('is-tall', h * sc > 460); if (onReady) try { onReady(f, sc); } catch (e) { } }
    f.srcdoc = doc;
  }

  /* ---------------- the Pages tab ---------------- */
  function pages(f) {
    var file = W.pgFile || 'index.html';
    f.innerHTML = '<div class="pg"><div class="pg-top"><label class="pg-pick"><span>Page</span><select class="hq-in" id="pgF">' + PAGES.map(function (p) { return '<option value="' + p[0] + '"' + (p[0] === file ? ' selected' : '') + '>' + p[1] + (hasEdits(p[0]) ? ' •' : '') + '</option>'; }).join('') + '</select></label>' +
      '<div class="tabs" id="pgDev">' + [['mobile', 'Phone'], ['desktop', 'Computer']].map(function (d) { return '<button data-d="' + d[0] + '"' + ((W.pgDev || (innerWidth < 700 ? 'mobile' : 'desktop')) === d[0] ? ' class="is-on"' : '') + '>' + d[1] + '</button>'; }).join('') + '</div>' +
      '<button class="b b--sm" id="pgFull">' + H.I.eye + '<span>Whole page</span></button><a class="b b--sm b--ghost" id="pgLive" target="_blank" rel="noopener" href="/' + (file === 'index.html' ? '' : file.replace(/\.html$/, '')) + '">Live ↗</a></div>' +
      '<p class="pg-tip">Each part of the page is shown as it will look. Tap <b>Edit</b> under a part to change its words, pictures or buttons. Nothing goes live until you press Publish.</p><div id="pgL"><p class="muted">Loading the page…</p></div></div>';
    f.querySelector('#pgF').onchange = function () { W.pgFile = this.value; pages(f); };
    f.querySelectorAll('#pgDev [data-d]').forEach(function (x) { x.onclick = function () { W.pgDev = x.getAttribute('data-d'); pages(f); }; });
    f.querySelector('#pgFull').onclick = function () { full(file); };
    src(file).then(function (html) { list(f.querySelector('#pgL'), file, html); }, function (e) { f.querySelector('#pgL').innerHTML = '<p class="muted">Couldn’t load this page: ' + esc(e.message) + '</p>'; });
  }
  function src(file) { if (file === 'index.html') return Promise.resolve(W.index); return W.src[file] ? Promise.resolve(W.src[file]) : X.txt('/' + file).then(function (h) { W.src[file] = h; return h; }); }
  /* the page as the preview shows it: draft edits, then menus/hero from the site model */
  function draftPage(file, html) { var p = compose(file, html); try { if (/nav__links|<main id="main">/.test(p)) p = C.apply(p, W.model, file); } catch (e) { } return p; }
  function full(file) {
    src(file).then(function (html) {
      var m = H.modal('<div class="pg-full"><div class="row" style="justify-content:space-between"><h2>' + esc((PAGES.filter(function (p) { return p[0] === file; })[0] || [0, file])[1]) + ' · draft</h2><button class="b b--sm b--ghost" data-x>' + H.I.x + '</button></div><iframe title="Whole page preview"></iframe></div>');
      m.classList.add('pg-fullm');
      m.querySelector('iframe').srcdoc = withUploads(override(draftPage(file, html).replace('<head>', '<head><base href="/">')));
    });
  }
  function list(el, file, html) {
    var secs = sectionsOf(file, file === 'index.html' ? compose(file, html) : html), home = file === 'index.html';
    if (!secs.length) { el.innerHTML = '<p class="muted">This page has no editable parts.</p>'; return; }
    var ops = W.pages[file] = W.pages[file] || {};
    el.innerHTML = secs.map(function (s, i) {
      var auto = autoOf(s.html), op = ops[s.key] || {}, n = Object.keys(op.t || {}).length + Object.keys(op.im || {}).length + Object.keys(op.hr || {}).length;
      return '<article class="pg-sec' + (s.visible ? '' : ' is-off') + '" data-k="' + esc(s.key) + '">' +
        '<div class="pg-pv"><div class="pg-pv__in"></div><button type="button" class="pg-pv__more" data-more>Show all of it</button>' + (s.visible ? '' : '<span class="pg-pv__off">Hidden on the website</span>') + '</div>' +
        '<div class="pg-bar"><span class="pg-n">' + (i + 1) + '</span><b>' + esc(sectionName(s, i)) + '</b>' + (n ? '<span class="chip chip--o">' + n + ' change' + (n === 1 ? '' : 's') + '</span>' : '') +
        '<span class="pg-sp"></span>' + (s.key === 'HERO' ? '' : '<button type="button" class="b b--sm b--ghost" data-mv="-1" title="Move up"' + (i ? '' : ' disabled') + '>↑</button><button type="button" class="b b--sm b--ghost" data-mv="1" title="Move down"' + (i < secs.length - 1 ? '' : ' disabled') + '>↓</button><button type="button" class="b b--sm" data-eye>' + (s.visible ? 'Hide' : 'Show') + '</button>') +
        '<button type="button" class="b b--sm b--p" data-ed>Edit</button></div>' +
        '<div class="pg-ed" hidden></div>' + (auto.length ? '<p class="pg-auto">' + auto.map(function (a) { return AUTO[a] || (a === 'reviews' ? 'Customer reviews (from Reviews)' : 'Email sign-up'); }).join(' · ') + ' fill in by themselves' + (auto.some(function (a) { return /tgrid|pgrid|wrows|workTpl/.test(a); }) ? ' · arrange them under <a href="#website/order">What shows first</a>' : '') + '.</p>' : '') + '</article>';
    }).join('');
    /* previews appear as you scroll to them */
    if (io) io.disconnect();
    io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) { es.forEach(function (e) { if (!e.isIntersecting) return; io.unobserve(e.target); var k = e.target.closest('[data-k]').getAttribute('data-k'); mountPreview(e.target, secDoc(file, html, k, autoOf((secs.filter(function (x) { return x.key === k; })[0] || {}).html || '').length > 0)); }); }, { rootMargin: '400px 0px' }) : null;
    el.querySelectorAll('.pg-pv').forEach(function (b) { if (io) io.observe(b); else { var k = b.closest('[data-k]').getAttribute('data-k'); mountPreview(b, secDoc(file, html, k, false)); } });
    el.querySelectorAll('[data-more]').forEach(function (b) { b.onclick = function () { var p = b.closest('.pg-pv'); p.classList.toggle('is-open'); b.textContent = p.classList.contains('is-open') ? 'Show less' : 'Show all of it'; }; });
    var redraw = function () { list(el, file, html); };
    el.querySelectorAll('[data-mv]').forEach(function (b) { b.onclick = function () {
      var k = b.closest('[data-k]').getAttribute('data-k'), d = +b.getAttribute('data-mv');
      if (home) { var S = W.model.sections, i = S.findIndex(function (x) { return x.key === k; }), j = i + d; if (j < 1 || j >= S.length) return; var t = S[i]; S[i] = S[j]; S[j] = t; }
      else { var keys = secs.map(function (x) { return x.key; }), a = keys.indexOf(k), z = a + d; if (z < 0 || z >= keys.length) return; keys.splice(a, 1); keys.splice(z, 0, k); ops.order = keys; }
      X.changed(); redraw();
    }; });
    el.querySelectorAll('[data-eye]').forEach(function (b) { b.onclick = function () {
      var k = b.closest('[data-k]').getAttribute('data-k');
      if (home) { var s = W.model.sections.filter(function (x) { return x.key === k; })[0]; s.visible = s.visible === false; }
      else { ops.hide = ops.hide || {}; var cur = secs.filter(function (x) { return x.key === k; })[0]; ops.hide[k] = !!cur.visible; }
      X.changed(); redraw();
    }; });
    el.querySelectorAll('[data-ed]').forEach(function (b) { b.onclick = function () {
      var card = b.closest('[data-k]'), ed = card.querySelector('.pg-ed'), k = card.getAttribute('data-k');
      if (!ed.hidden) { ed.hidden = true; b.textContent = 'Edit'; return; }
      ed.hidden = false; b.textContent = 'Done';
      editor(ed, file, html, secs.filter(function (x) { return x.key === k; })[0], function () { var pv = card.querySelector('.pg-pv'); mountPreview(pv, secDoc(file, html, k, autoOf(sectionsOf(file, file === 'index.html' ? compose(file, html) : html).filter(function (x) { return x.key === k; })[0].html).length > 0)); var ch = card.querySelector('.pg-bar .chip'); var op = ops[k] || {}, n = Object.keys(op.t || {}).length + Object.keys(op.im || {}).length + Object.keys(op.hr || {}).length; if (ch) ch.textContent = n + ' change' + (n === 1 ? '' : 's'); });
    }; });
  }

  /* the fields of one section */
  function editor(ed, file, html, sec, refresh) {
    var home = file === 'index.html', ops = W.pages[file], op = ops[sec.key] = ops[sec.key] || {};
    op.t = op.t || {}; op.im = op.im || {}; op.hr = op.hr || {};
    /* fields come from the live page (so edits are always "live text → new text") */
    var base = home ? (C.splitMain(html).blocks.filter(function (b) { return b.key === sec.key; })[0] || {}).html || '' : (sectionsOf(file, html).filter(function (x) { return x.key === sec.key; })[0] || {}).html || '';
    var root = frag(base).content, tn = texts(root, home), im = imgs(root), ln = links(root);
    var parts = [];
    if (home && sec.key === 'HERO') parts.push(X.heroForm());
    if (home && sec.key !== 'HERO') {
      var ms = W.model.sections.filter(function (x) { return x.key === sec.key; })[0], mi = W.model.sections.indexOf(ms);
      if (ms && ms.title != null) parts.push('<div class="pg-f">' + X.inp('Heading', ms.title, 'data-mk="sections.' + mi + '.title"', 2) + (ms.lead != null ? X.inp('Text under the heading', ms.lead, 'data-mk="sections.' + mi + '.lead"', 3) : '') + '</div>');
    }
    if (!(home && sec.key === 'HERO')) {
      var rows = tn.map(function (n, i) { var cur = op.t[i] ? op.t[i].to : norm(n.nodeValue), long = cur.length > 70; return '<label class="field pg-t' + (op.t[i] ? ' is-ch' : '') + '"><span>' + esc(label(n)) + (op.t[i] ? ' <button type="button" class="pg-undo" data-ut="' + i + '">Undo</button>' : '') + '</span>' + (long ? '<textarea class="hq-in" rows="' + Math.min(6, Math.ceil(cur.length / 60)) + '" data-t="' + i + '">' + esc(cur) + '</textarea>' : '<input class="hq-in" data-t="' + i + '" value="' + esc(cur) + '">') + '</label>'; });
      if (rows.length) parts.push('<div class="pg-g"><h4>Words</h4>' + rows.join('') + '</div>');
      if (im.length) parts.push('<div class="pg-g"><h4>Pictures</h4><div class="pg-imgs">' + im.map(function (n, i) { var e = op.im[i] || {}, s0 = n.getAttribute('src') || '', s = e.to || s0, show = W.uploads[s] ? 'data:image/webp;base64,' + W.uploads[s] : (/^(https?:|data:|\/)/.test(s) ? s : '/' + s); return '<div class="pg-img"><img src="' + esc(show) + '" alt=""><div><label class="b b--sm">Replace<input type="file" accept="image/*" hidden data-im="' + i + '"></label>' + (e.to ? '<button type="button" class="b b--sm b--ghost" data-ui="' + i + '">Undo</button>' : '') + X.inp('Description (for Google and screen readers)', e.alt != null ? e.alt : (n.getAttribute('alt') || ''), 'data-alt="' + i + '"') + '</div></div>'; }).join('') + '</div></div>');
      if (ln.length) parts.push('<div class="pg-g"><h4>Where buttons and links go</h4>' + ln.map(function (n, i) { var e = op.hr[i]; return X.inp('“' + esc(norm(n.textContent).slice(0, 40)) + '”', e ? e.to : n.getAttribute('href'), 'data-hr="' + i + '" placeholder="/contact or https://…"'); }).join('') + '</div>');
    }
    if (file === 'about.html' && sec.html.indexOf('id="team"') >= 0) parts.push('<div class="pg-g"><h4>The team</h4><div id="pgTeam"></div></div>');
    if (!parts.length) parts.push('<p class="muted">Nothing to edit here. This part fills in by itself.</p>');
    ed.innerHTML = parts.join('');
    var t0 = null, later = function () { clearTimeout(t0); t0 = setTimeout(refresh, 450); };
    if (home && sec.key === 'HERO') X.bindHero(ed, later);
    ed.querySelectorAll('[data-mk]').forEach(function (x) { x.oninput = function () { X.setPath(W.model, x.getAttribute('data-mk'), x.value); X.changed(); later(); }; });
    ed.querySelectorAll('[data-t]').forEach(function (x) { x.oninput = function () { var i = x.getAttribute('data-t'), from = norm(tn[+i].nodeValue), v = norm(x.value); if (v === from || !v) delete op.t[i]; else op.t[i] = { from: from, to: v }; x.closest('.pg-t').classList.toggle('is-ch', !!op.t[i]); X.changed(); later(); }; });
    ed.querySelectorAll('[data-ut]').forEach(function (b) { b.onclick = function (e) { e.preventDefault(); delete op.t[b.getAttribute('data-ut')]; X.changed(); editor(ed, file, html, sec, refresh); refresh(); }; });
    ed.querySelectorAll('[data-hr]').forEach(function (x) { x.oninput = function () { var i = x.getAttribute('data-hr'), from = ln[+i].getAttribute('href'), v = x.value.trim(); if (!v || v === from) delete op.hr[i]; else op.hr[i] = { from: from, to: v }; X.changed(); }; });
    ed.querySelectorAll('[data-alt]').forEach(function (x) { x.oninput = function () { var i = x.getAttribute('data-alt'), n = im[+i]; op.im[i] = Object.assign(op.im[i] || { from: n.getAttribute('src') || '' }, { alt: x.value }); X.changed(); }; });
    ed.querySelectorAll('[data-ui]').forEach(function (b) { b.onclick = function () { var i = b.getAttribute('data-ui'); if (op.im[i]) { delete W.uploads[op.im[i].to]; delete op.im[i].to; if (op.im[i].alt == null) delete op.im[i]; } X.changed(); editor(ed, file, html, sec, refresh); refresh(); }; });
    ed.querySelectorAll('[data-im]').forEach(function (x) { x.onchange = function () {
      var i = x.getAttribute('data-im'), file0 = this.files[0]; if (!file0) return;
      webp(file0, 1800).then(function (b64) {
        var path = 'assets/img/site/' + file.replace(/\.html$/, '') + '-' + Date.now().toString(36) + '.webp';
        var e = op.im[i] = op.im[i] || { from: im[+i].getAttribute('src') || '' }; if (e.to) delete W.uploads[e.to];
        W.uploads[path] = b64; e.to = path; X.changed(); editor(ed, file, html, sec, refresh); refresh();
      }, function (er) { H.toast(er.message); });
    }; });
    var tb = ed.querySelector('#pgTeam'); if (tb) team(tb, refresh);
  }
  function webp(file, max) {
    return new Promise(function (ok, no) {
      if (!/^image\//.test(file.type)) return no(new Error('Choose a picture (JPG, PNG or WebP).'));
      var rd = new FileReader(); rd.onerror = function () { no(new Error('Couldn’t read that picture.')); };
      rd.onload = function () { var im = new Image(); im.onerror = function () { no(new Error('Couldn’t open that picture.')); }; im.onload = function () { var w = Math.min(max, im.width), h = Math.round(im.height * w / im.width), c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(im, 0, 0, w, h); var d = c.toDataURL('image/webp', .84); if (d.indexOf('data:image/webp') !== 0) d = c.toDataURL('image/jpeg', .86); ok(d.split(',')[1]); }; im.src = rd.result; };
      rd.readAsDataURL(file);
    });
  }

  /* ---------------- About page: the team ---------------- */
  function teamBase() { return W.teamBase ? Promise.resolve(W.teamBase) : X.txt('/data/team.js').then(function (js) { var w = {}; try { new Function('window', js)(w); } catch (e) { } W.teamBase = (w.CIEL && w.CIEL.team) || []; return W.teamBase; }); }
  function team(el, refresh) {
    teamBase().then(function (base) {
      var T = W.team = W.team || JSON.parse(JSON.stringify(base));
      var pic = function (m) { var s = m.image || ''; return W.uploads[s] ? 'data:image/webp;base64,' + W.uploads[s] : s ? (/^(https?:|data:|\/)/.test(s) ? s : '/' + s) : ''; };
      el.innerHTML = '<ul class="pg-team">' + T.map(function (m, i) { var p = pic(m); return '<li data-i="' + i + '"><div class="pg-tm__ph"' + (p ? ' style="background-image:url(\'' + esc(p) + '\')"' : '') + '>' + (p ? '' : esc(String(m.name || '?').split(/\s+/).map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase())) + '</div>' +
        '<div class="pg-tm__f">' + X.inp('Name', m.name, 'data-tk="name"') + X.inp('Role', m.role, 'data-tk="role"') + X.inp('About them', m.bio, 'data-tk="bio"', 3) +
        '<div class="row"><label class="b b--sm">' + (p ? 'Change photo' : 'Add photo') + '<input type="file" accept="image/*" hidden data-tp></label>' + (p ? '<button type="button" class="b b--sm b--ghost" data-trp>Remove photo</button>' : '') + '<span class="pg-sp"></span><button type="button" class="b b--sm b--ghost" data-tmv="-1"' + (i ? '' : ' disabled') + '>↑</button><button type="button" class="b b--sm b--ghost" data-tmv="1"' + (i < T.length - 1 ? '' : ' disabled') + '>↓</button><button type="button" class="b b--sm b--ghost" data-trm style="color:var(--r)">Remove</button></div></div></li>'; }).join('') + '</ul><button type="button" class="b b--sm" id="pgTAdd">+ Add a person</button>';
      var redraw = function () { team(el, refresh); refresh(); };
      el.querySelectorAll('[data-tk]').forEach(function (x) { x.oninput = function () { T[+x.closest('[data-i]').getAttribute('data-i')][x.getAttribute('data-tk')] = x.value; X.changed(); clearTimeout(el._t); el._t = setTimeout(refresh, 500); }; });
      el.querySelectorAll('[data-tmv]').forEach(function (b) { b.onclick = function () { var i = +b.closest('[data-i]').getAttribute('data-i'), j = i + +b.getAttribute('data-tmv'); var t = T[i]; T[i] = T[j]; T[j] = t; X.changed(); redraw(); }; });
      el.querySelectorAll('[data-trm]').forEach(function (b) { b.onclick = function () { var i = +b.closest('[data-i]').getAttribute('data-i'); HQAsk.confirm('Remove ' + (T[i].name || 'this person') + ' from the About page?').then(function (ok) { if (!ok) return; T.splice(i, 1); X.changed(); redraw(); }); }; });
      el.querySelectorAll('[data-trp]').forEach(function (b) { b.onclick = function () { var m = T[+b.closest('[data-i]').getAttribute('data-i')]; if (W.uploads[m.image]) delete W.uploads[m.image]; m.image = ''; X.changed(); redraw(); }; });
      el.querySelectorAll('[data-tp]').forEach(function (x) { x.onchange = function () { var m = T[+x.closest('[data-i]').getAttribute('data-i')], f0 = this.files[0]; if (!f0) return; webp(f0, 900).then(function (b64) { if (W.uploads[m.image]) delete W.uploads[m.image]; var path = 'assets/img/team/' + String(m.id || 'tm').replace(/[^a-z0-9-]/gi, '') + '-' + Date.now().toString(36) + '.webp'; W.uploads[path] = b64; m.image = path; X.changed(); redraw(); }, function (er) { H.toast(er.message); }); }; });
      el.querySelector('#pgTAdd').onclick = function () { var n = 1; T.forEach(function (m) { var k = /^tm-(\d+)$/.exec(m.id || ''); if (k) n = Math.max(n, +k[1] + 1); }); T.push({ id: 'tm-' + String(n).padStart(2, '0'), name: '', role: '', bio: '', image: '' }); X.changed(); redraw(); };
    });
  }

  /* ---------------- What shows first: Templates, Products, Work, Services ---------------- */
  var OPAGES = [['templates', 'Templates page', 'templates.html'], ['products', 'Products page', 'products.html'], ['work', 'Work page', 'work.html'], ['services', 'Services page', 'services.html']];
  function workBase() { return W.workBase ? Promise.resolve(W.workBase) : X.txt('/data/work.js').then(function (js) { var w = {}; try { new Function('window', js)(w); } catch (e) { } W.workBase = (w.CIEL && w.CIEL.work) || []; return W.workBase; }); }
  function sortBy(list, ids) { if (!ids || !ids.length) return list; var p = {}; ids.forEach(function (id, i) { p[id] = i; }); return list.slice().sort(function (a, b) { return (p[a.id] != null ? p[a.id] : 1e4 + list.indexOf(a)) - (p[b.id] != null ? p[b.id] : 1e4 + list.indexOf(b)); }); }
  function order(f) {
    var k = W.ordK || 'templates', pg = OPAGES.filter(function (x) { return x[0] === k; })[0];
    f.innerHTML = '<div class="pg"><div class="pg-top"><div class="tabs pg-otabs" id="orT">' + OPAGES.map(function (x) { return '<button data-k="' + x[0] + '"' + (x[0] === k ? ' class="is-on"' : '') + '>' + x[1] + '</button>'; }).join('') + '</div></div>' +
      '<p class="pg-tip">Use the arrows to choose what shows first. The preview updates as you go. Nothing goes live until you press Publish.</p>' +
      '<div class="pg-ord"><div class="pg-ord__l" id="orL"><p class="muted">Loading…</p></div><div class="pg-ord__p"><div class="pg-pv is-open"><div class="pg-pv__in"></div></div></div></div></div>';
    f.querySelectorAll('#orT [data-k]').forEach(function (x) { x.onclick = function () { W.ordK = x.getAttribute('data-k'); order(f); }; });
    var L = f.querySelector('#orL'), pv = f.querySelector('.pg-pv');
    var get = k === 'work' ? workBase() : k === 'services' && X.loadSvc ? Promise.resolve(X.loadSvc()).then(function () { return null; }, function () { return null; }) : Promise.resolve(null);
    get.then(function (wb) {
      var items, thumb;
      if (k === 'templates' || k === 'products') { items = sortBy(X.allItems(k), W.order[k]); thumb = function (p) { return X.shot(k, p); }; }
      else if (k === 'work') { items = sortBy(wb, W.order.work); thumb = function (p) { return p.image ? '/' + String(p.image).replace(/^\//, '') : ''; }; }
      else { items = X.svcList().map(function (s, i) { return { id: 'svc' + i, name: s.name, desc: s.price, _i: i }; }); thumb = function () { return ''; }; }
      var draw = function () {
        L.innerHTML = '<ol class="pg-olist">' + items.map(function (p, i) { var t = thumb(p); return '<li data-i="' + i + '"' + (p.hidden ? ' class="is-off"' : '') + '><span class="pg-on">' + (i + 1) + '</span>' + (t ? '<img src="' + esc(t) + '" alt="" loading="lazy">' : '<span class="pg-noimg"></span>') + '<div><b>' + esc(p.name) + '</b><small>' + esc(p.hidden ? 'Hidden' : (p.category || p.industry || p.desc || '')) + '</small></div><span class="pg-sp"></span><button type="button" class="b b--sm b--ghost" data-o="-1"' + (i ? '' : ' disabled') + ' aria-label="Move up">↑</button><button type="button" class="b b--sm b--ghost" data-o="1"' + (i < items.length - 1 ? '' : ' disabled') + ' aria-label="Move down">↓</button><button type="button" class="b b--sm b--ghost" data-top title="Move to the top"' + (i ? '' : ' disabled') + '>Top</button></li>'; }).join('') + '</ol>';
        L.querySelectorAll('li').forEach(function (li) {
          var mv = function (to) { var i = +li.getAttribute('data-i'); if (to < 0 || to >= items.length) return; var it = items.splice(i, 1)[0]; items.splice(to, 0, it); save(); draw(); show(); };
          li.querySelector('[data-o="-1"]').onclick = function () { mv(+li.getAttribute('data-i') - 1); };
          li.querySelector('[data-o="1"]').onclick = function () { mv(+li.getAttribute('data-i') + 1); };
          li.querySelector('[data-top]').onclick = function () { mv(0); };
        });
      };
      var save = function () {
        if (k === 'services') { var cur = X.svcList(); W.svcDraft = items.map(function (x) { return cur[x._i]; }); items.forEach(function (x, i) { x._i = i; }); }
        else W.order[k] = items.map(function (x) { return x.id; });
        X.changed();
      };
      var show = function () {
        src(pg[2]).then(function (html) {
          var page = draftPage(pg[2], html);
          if (k === 'services' && W.svcDraft) try { page = C.setServices(page, W.svcDraft); } catch (e) { }
          mountPreview(pv, withUploads(override(page.replace('<head>', '<head><base href="/">').replace('</head>', '<style>[data-r]{opacity:1!important;transform:none!important}.wa-float,#cookieBar{display:none!important}</style></head>'))), function (fr, sc) {
            /* open the preview at the list being arranged */
            var t = fr.contentDocument.querySelector(k === 'templates' ? '#tgrid' : k === 'products' ? '#pgrid' : k === 'work' ? '#wrows' : '.svcs'), box = pv.closest('.pg-ord__p');
            if (t && box) box.scrollTop = Math.max(0, (t.getBoundingClientRect().top + fr.contentWindow.scrollY) * sc - 12);
          });
        });
      };
      draw(); show();
    });
  }

  /* ---------------- publishing ---------------- */
  /* lay every edit onto the newest version of each page, right before publishing */
  function publishPages() {
    var files = editedPages(), out = {};
    return Promise.all(files.map(function (file) { return (file === 'index.html' ? X.txt('/index.html') : X.txt('/' + file)).then(function (h) { out[file] = compose(file, h); }); })).then(function () { return out; });
  }
  function summary() {
    var e = editedPages().map(function (f) { return (PAGES.filter(function (p) { return p[0] === f; })[0] || [0, f])[1]; });
    return (e.length ? '<li>Page edits: ' + esc(e.join(', ')) + '</li>' : '') + (W.team ? '<li>About page team</li>' : '') + (W.order && W.order.work ? '<li>Order of the Work page</li>' : '');
  }

  window.HQPages = { init: init, pages: pages, order: order, publishPages: publishPages, summary: summary, editedPages: editedPages, compose: compose };
})();
