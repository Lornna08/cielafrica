/* ============================================================
   CIEL HQ — website content engine (used by Ciel HQ in the browser
   for previews, and by the server when publishing to cielafrica.com).
   It reads the real pages, builds an editable model, and writes the
   model back into the static HTML: homepage hero, section order,
   visibility and headings, header menu, mobile menu, footer and an
   optional announcement bar. Catalogue helpers change prices and
   visibility inside data/*.js without touching anything else.
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SiteCMS = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  var esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  var txt = function (h) { return String(h || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&#8209;/g, '‑').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim(); };
  var html = function (t) { return esc(t).replace(/\n/g, '<br>'); };
  var safeHref = function (h) { h = String(h || '').trim(); return /^(https?:\/\/|\/|#|mailto:|tel:|[a-z0-9-]+(\.html)?([#?].*)?$)/i.test(h) && !/^javascript:/i.test(h) ? h : '#'; };

  /* ---------------- sections of the homepage ---------------- */
  var SECTION_NAMES = { HERO: 'Hero', STRIP: 'Services ticker', WORK: 'Our work', TEMPLATES: 'Templates', SERVICES: 'Services', PROCESS: 'How a build goes', WHY: 'Why teams keep us', 'PHOTO BOOKS': 'Photo Books', CTA: 'Call to action' };
  function splitMain(page) {
    var a = page.indexOf('<main id="main">'), b = page.indexOf('</main>');
    if (a < 0 || b < 0) throw new Error('The homepage structure was not recognised.');
    var head = page.slice(0, a + 16), body = page.slice(a + 16, b), tail = page.slice(b);
    var parts = body.split(/\n(?=<!-- [A-Z][A-Z ]+ -->\n)/), pre = '', blocks = [];
    parts.forEach(function (p) {
      var m = p.match(/^<!-- ([A-Z][A-Z ]+) -->\n/);
      if (!m) { pre += p; return; }
      var inner = p.slice(m[0].length), off = /^<template data-cms-off>([\s\S]*)<\/template>\s*$/.exec(inner);
      blocks.push({ key: m[1], name: SECTION_NAMES[m[1]] || m[1].charAt(0) + m[1].slice(1).toLowerCase(), html: off ? off[1] : inner, visible: !off });
    });
    return { head: head, pre: pre, blocks: blocks, tail: tail };
  }
  function joinMain(s) { return s.head + s.pre + s.blocks.map(function (b) { return '\n<!-- ' + b.key + ' -->\n' + (b.visible ? b.html : '<template data-cms-off>' + b.html.replace(/\s+$/, '') + '</template>\n'); }).join('') + s.tail; }

  /* ---------------- read the live site into a model ---------------- */
  function extract(index) {
    var s = splitMain(index), hero = (s.blocks.filter(function (b) { return b.key === 'HERO'; })[0] || {}).html || '';
    var h1 = /<h1 class="mega" aria-label="([^"]*)">([\s\S]*?)<br><span class="rot" aria-hidden="true">([\s\S]*?)<\/span><br>([\s\S]*?)<\/h1>/.exec(hero) || [];
    var words = []; (h1[3] || '').replace(/<span[^>]*>([\s\S]*?)<\/span>/g, function (_, w) { words.push(txt(w)); });
    var ctas = []; ((/<div class="hero__cta">([\s\S]*?)<\/div>/.exec(hero) || [])[1] || '').replace(/<a href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g, function (_, h, l) { ctas.push({ label: txt(l), href: h }); });
    var nav = []; ((/<nav class="nav__links"[^>]*>([\s\S]*?)<\/nav>/.exec(index) || [])[1] || '').replace(/<a href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g, function (_, h, l) { nav.push({ label: txt(l), href: h, visible: true }); });
    var cta = /<a href="([^"]*)" class="nav__cta">([\s\S]*?)<\/a>/.exec(index) || [];
    var cols = []; ((/<div class="foot__cols">([\s\S]*?)\n\s*<\/div>\n\s*<\/div>/.exec(index) || [])[1] || '').replace(/<div class="foot__col"><h4>(?:<span class="brk">‹<\/span> )?([\s\S]*?)<\/h4>([\s\S]*?)<\/div>/g, function (_, t, links) {
      var l = []; links.replace(/<a href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g, function (__, h, lb) { l.push({ label: txt(lb), href: h }); });
      cols.push({ title: txt(t), links: l });
    });
    var ann = /<!--cms:announce-->([\s\S]*?)<!--\/cms:announce-->/.exec(index), annText = '', annHref = '';
    if (ann && ann[1]) { annText = txt(ann[1]); annHref = (/href="([^"]*)"/.exec(ann[1]) || [])[1] || ''; }
    return {
      v: 1,
      hero: { eyebrow: txt((/<span class="eyebrow"><span class="brk">‹<\/span> ([\s\S]*?)<\/span>/.exec(hero) || [])[1]), before: txt(h1[2]), words: words, after: txt(h1[4]), label: h1[1] ? txt(h1[1]) : '', sub: txt((/<p class="hero__sub">([\s\S]*?)<\/p>/.exec(hero) || [])[1]), ctas: ctas },
      sections: s.blocks.map(function (b) { return { key: b.key, name: b.name, visible: b.visible, title: txt((/<h2 class="sechead__t">([\s\S]*?)<\/h2>/.exec(b.html) || [])[1]) || null, lead: txt((/<p class="sechead__lead">([\s\S]*?)<\/p>/.exec(b.html) || [])[1]) || null }; }),
      nav: nav, cta: { label: txt(cta[2]) || 'Start a project', href: cta[1] || 'quote.html' },
      footer: cols, announce: { on: !!annText, text: annText, href: annHref }
    };
  }

  /* ---------------- write the model into a page ---------------- */
  var norm = function (h) { h = String(h || '').replace(/^\//, '').replace(/[#?].*$/, ''); return h === '' ? 'index.html' : h; };
  /* pages under a sub-path (e.g. /domains/order) need root-relative links */
  var abs = function (h, absolute) { h = safeHref(h); return absolute && /^[a-z0-9-]+(\.html)?([#?].*)?$/i.test(h) ? (h === 'index.html' ? '/' : '/' + h) : h; };
  function navHtml(m, cur, absolute) {
    return m.nav.filter(function (n) { return n.visible !== false && n.label; }).map(function (n) { return '<a href="' + esc(abs(n.href, absolute)) + '"' + (cur && norm(n.href) === cur ? ' aria-current="page"' : '') + '>' + esc(n.label) + '</a>'; }).join('');
  }
  function apply(page, m, file) {
    var out = page;
    if (m.nav && /<nav class="nav__links"/.test(out)) {
      var old = (/<nav class="nav__links"[^>]*>([\s\S]*?)<\/nav>/.exec(out) || [])[1] || '', absolute = /^\s*<a href="\//.test(old);
      var cur = (/<a href="([^"]*)" aria-current="page"/.exec(old) || [])[1]; cur = cur != null ? norm(cur) : null;
      out = out.replace(/(<nav class="nav__links"[^>]*>)[\s\S]*?(<\/nav>)/, function (_, a, b) { return a + navHtml(m, cur, absolute) + b; });
      out = out.replace(/<a href="[^"]*" class="nav__cta">[\s\S]*?<\/a>/, '<a href="' + esc(abs(m.cta.href, absolute)) + '" class="nav__cta">' + esc(m.cta.label) + '</a>');
      out = out.replace(/(<div class="mobile-menu" id="mobileMenu">)[\s\S]*?(<\/div>)/, function (_, a, b) {
        return a + m.nav.filter(function (n) { return n.visible !== false && n.label; }).map(function (n) { return '<a href="' + esc(abs(n.href, absolute)) + '"><span class="brk">‹</span> ' + esc(n.label) + '</a>'; }).join('') + '<a href="' + esc(abs(m.cta.href, absolute)) + '" class="btn btn--p">' + esc(m.cta.label) + '</a>' + b;
      });
    }
    if (m.footer && /<div class="foot__cols">/.test(out)) {
      var fabs = /<div class="foot__cols">\s*<div class="foot__col"><h4>[\s\S]*?<\/h4><a href="\//.test(out);
      out = out.replace(/(<div class="foot__cols">\n)[\s\S]*?(\n\s*<\/div>\n\s*<\/div>)/, function (_, a, b) {
        return a + m.footer.map(function (c) { return '        <div class="foot__col"><h4><span class="brk">‹</span> ' + esc(c.title) + '</h4>' + c.links.filter(function (l) { return l.label; }).map(function (l) { return '<a href="' + esc(abs(l.href, fabs)) + '">' + esc(l.label) + '</a>'; }).join('') + '</div>'; }).join('\n') + b;
      });
    }
    if (m.announce && /<header class="nav"/.test(out)) {
      var bar = m.announce.on && m.announce.text ? '<div class="annc" style="background:#141414;color:#fff;text-align:center;font:600 .86rem/1.4 Inter,system-ui,sans-serif;padding:.55rem 1rem">' + (m.announce.href ? '<a href="' + esc(safeHref(m.announce.href)) + '" style="color:#fff;text-decoration:underline;text-underline-offset:3px">' + esc(m.announce.text) + '</a>' : esc(m.announce.text)) + '</div>' : '';
      if (/<!--cms:announce-->/.test(out)) out = out.replace(/<!--cms:announce-->[\s\S]*?<!--\/cms:announce-->/, '<!--cms:announce-->' + bar + '<!--/cms:announce-->');
      else out = out.replace(/<header class="nav"/, '<!--cms:announce-->' + bar + '<!--/cms:announce-->\n<header class="nav"');
    }
    if (file === 'index.html' && m.hero && m.sections) {
      var s = splitMain(out), h = m.hero;
      s.blocks.forEach(function (b) {
        var cfg = m.sections.filter(function (x) { return x.key === b.key; })[0]; if (!cfg) return;
        b.visible = cfg.visible !== false || b.key === 'HERO';
        if (cfg.title != null) b.html = b.html.replace(/(<h2 class="sechead__t">)[\s\S]*?(<\/h2>)/, function (_, a, c) { return a + html(cfg.title) + c; });
        if (cfg.lead != null) b.html = b.html.replace(/(<p class="sechead__lead">)[\s\S]*?(<\/p>)/, function (_, a, c) { return a + html(cfg.lead) + c; });
        if (b.key === 'HERO') {
          b.html = b.html.replace(/(<span class="eyebrow"><span class="brk">‹<\/span> )[\s\S]*?(<\/span>)/, function (_, a, c) { return a + esc(h.eyebrow) + c; });
          var words = (h.words || []).filter(Boolean);
          var label = h.label || (h.before + ' ' + (words[0] || '') + ' ' + h.after).replace(/\s+/g, ' ').trim();
          b.html = b.html.replace(/<h1 class="mega"[\s\S]*?<\/h1>/, '<h1 class="mega" aria-label="' + esc(label) + '">' + esc(h.before) + '<br><span class="rot" aria-hidden="true">' + words.map(function (w, i) { return '<span' + (i ? '' : ' class="on"') + '>' + esc(w).replace(/-/g, '&#8209;') + '</span>'; }).join('') + '</span><br>' + esc(h.after) + '</h1>');
          b.html = b.html.replace(/(<p class="hero__sub">)[\s\S]*?(<\/p>)/, function (_, a, c) { return a + esc(h.sub) + c; });
          b.html = b.html.replace(/(<div class="hero__cta">)[\s\S]*?(<\/div>)/, function (_, a, c) { return a + '\n' + (h.ctas || []).filter(function (x) { return x.label; }).map(function (x, i) { return '        <a href="' + esc(safeHref(x.href)) + '" class="btn ' + (i ? 'btn--ghost' : 'btn--p') + ' btn--lg">' + esc(x.label) + '</a>'; }).join('\n') + '\n      ' + c; });
        }
      });
      var order = m.sections.map(function (x) { return x.key; });
      s.blocks.sort(function (a, b) { var i = order.indexOf(a.key), j = order.indexOf(b.key); return (i < 0 ? 99 : i) - (j < 0 ? 99 : j); });
      out = joinMain(s);
    }
    return out;
  }

  /* ---------------- catalogue: prices and visibility inside data/*.js ---------------- */
  function objRange(js, id) {
    var i = js.indexOf('id:"' + id + '"'); if (i < 0) return null;
    var start = js.lastIndexOf('{', i), depth = 0, k = start;
    for (; k < js.length; k++) { var ch = js[k]; if (ch === '"' ) { k = js.indexOf('"', k + 1); if (k < 0) break; continue; } if (ch === '{') depth++; else if (ch === '}') { depth--; if (!depth) break; } }
    return [start, k + 1];
  }
  function setField(obj, key, val) {
    var re = new RegExp('(\\b' + key + ':)\\s*(?:"[^"]*"|[\\d.]+|true|false|null)');
    if (val === undefined || val === null || val === false) return obj.replace(new RegExp(',\\s*' + key + ':\\s*(?:"[^"]*"|[\\d.]+|true|false|null)'), '');
    var v = typeof val === 'string' ? JSON.stringify(val) : String(val);
    return re.test(obj) ? obj.replace(re, '$1' + v) : obj.replace(/\s*\}$/, ', ' + key + ':' + v + ' }');
  }
  /** changes = { id: { price, was, hidden, badge } } */
  function setItems(js, changes) {
    Object.keys(changes || {}).forEach(function (id) {
      var r = objRange(js, id); if (!r) return; var o = js.slice(r[0], r[1]), c = changes[id];
      if (c.price != null) o = setField(o, 'price', Math.max(0, Math.round(+c.price || 0)));
      if ('was' in c) o = setField(o, 'was', c.was ? Math.round(+c.was) : null);
      if ('hidden' in c) o = setField(o, 'hidden', c.hidden ? true : null);
      js = js.slice(0, r[0]) + o + js.slice(r[1]);
    });
    return js;
  }
  /** p = { printBase, printPage, pdfBase, pdfPage, delivery:{id:price} } */
  function setPhotoBooks(js, p) {
    var n = function (v) { return Math.max(0, Math.round(+v || 0)); };
    if (p.printBase != null) js = js.replace(/(price: \{ base: )\d+(, includedPages: \d+, perExtraPage: )\d+/, '$1' + n(p.printBase) + '$2' + n(p.printPage));
    if (p.pdfBase != null) js = js.replace(/(digital: \{ base: )\d+(, includedPages: \d+, perExtraPage: )\d+/, '$1' + n(p.pdfBase) + '$2' + n(p.pdfPage));
    Object.keys(p.delivery || {}).forEach(function (id) { js = js.replace(new RegExp("(\\{ id: '" + id + "', name: '[^']*', price: )\\d+"), '$1' + n(p.delivery[id])); });
    return js;
  }
  function readPhotoBooks(js) {
    var a = /price: \{ base: (\d+), includedPages: \d+, perExtraPage: (\d+)/.exec(js) || [], b = /digital: \{ base: (\d+), includedPages: \d+, perExtraPage: (\d+)/.exec(js) || [], d = {};
    js.replace(/\{ id: '([a-z]+)', name: '([^']*)', price: (\d+)/g, function (_, id, name, pr) { d[id] = { name: name, price: +pr }; });
    return { printBase: +a[1], printPage: +a[2], pdfBase: +b[1], pdfPage: +b[2], delivery: d };
  }
  return { extract: extract, apply: apply, setItems: setItems, setPhotoBooks: setPhotoBooks, readPhotoBooks: readPhotoBooks, splitMain: splitMain, esc: esc };
});
