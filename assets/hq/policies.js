/* ============================================================
   CIEL AFRICA — policy pages (terms, privacy, refunds, delivery, cookies).
   Each page keeps its content as a small model (title, intro, date and
   sections) in a JSON block, plus the HTML made from it, between
   <!-- POLICY --> and <!-- /POLICY -->. Ciel Admin edits the model and
   publishes; the server rebuilds the HTML with the same code, so what
   you preview is what goes live.
   Writing: a blank line starts a new paragraph, a line starting with
   "- " is a bullet, **bold**, and [words](https://link) for links.
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Policies = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  var LIST = [
    { id: 'terms', file: 'terms.html', url: '/terms', name: 'Terms and Conditions' },
    { id: 'privacy', file: 'privacy.html', url: '/privacy', name: 'Privacy Policy' },
    { id: 'refunds', file: 'refunds.html', url: '/refunds', name: 'Refund and Returns Policy' },
    { id: 'delivery', file: 'delivery.html', url: '/delivery', name: 'Delivery and Collection Policy' },
    { id: 'cookies', file: 'cookies.html', url: '/cookies', name: 'Cookie Policy' }
  ];
  var esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function longDate(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? (+m[3]) + ' ' + MONTHS[+m[2] - 1] + ' ' + m[1] : ''; }
  function safeUrl(u) { u = String(u || '').trim(); return /^(https?:\/\/|mailto:|tel:|\/[^\/]|\/$|#)/i.test(u) ? u : null; }
  /* one line of text: escaped, then **bold** and [words](link) */
  function inline(t) {
    var out = esc(t);
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (all, words, url) {
      var u = safeUrl(url.replace(/&amp;/g, '&')); if (!u) return words;
      var ext = /^https?:/i.test(u) && !/^https?:\/\/(www\.)?cielafrica\.com/i.test(u);
      return '<a href="' + esc(u) + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + words + '</a>';
    });
    return out;
  }
  /* a section's text: paragraphs and bullet lists */
  function block(body) {
    var lines = String(body || '').replace(/\r/g, '').split('\n'), out = [], para = [], list = [];
    function flushP() { if (para.length) { out.push('<p>' + para.map(inline).join('<br>') + '</p>'); para = []; } }
    function flushL() { if (list.length) { out.push('<ul>' + list.map(function (x) { return '<li>' + inline(x) + '</li>'; }).join('') + '</ul>'); list = []; } }
    lines.forEach(function (l) {
      var t = l.trim();
      if (!t) { flushP(); flushL(); return; }
      var b = /^[-•*]\s+(.*)$/.exec(t);
      if (b) { flushP(); list.push(b[1]); } else { flushL(); para.push(t); }
    });
    flushP(); flushL();
    return out.join('');
  }
  function slug(s) { return String(s || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'section'; }
  function clean(m) {
    m = m || {};
    var s = function (v, n) { return String(v == null ? '' : v).replace(/[\u0000-\u0009\u000b-\u001f]/g, '').slice(0, n); };
    return {
      id: s(m.id, 30), title: s(m.title, 120).trim(), intro: s(m.intro, 600).trim(),
      updated: /^\d{4}-\d{2}-\d{2}$/.test(m.updated || '') ? m.updated : new Date().toISOString().slice(0, 10),
      sections: (Array.isArray(m.sections) ? m.sections : []).slice(0, 40).map(function (x) { return { h: s(x && x.h, 140).trim(), body: s(x && x.body, 8000) }; }).filter(function (x) { return x.h || x.body.trim(); })
    };
  }
  /** the page content (heading, intro, contents list and sections) */
  function render(m) {
    m = clean(m);
    var used = {}, ids = m.sections.map(function (x) { var k = slug(x.h), n = k, i = 2; while (used[n]) n = k + '-' + (i++); used[n] = 1; return n; });
    var toc = m.sections.length > 3 ? '<nav class="pol__toc" aria-label="On this page"><b>On this page</b><ol>' + m.sections.map(function (x, i) { return x.h ? '<li><a href="#' + ids[i] + '">' + esc(x.h) + '</a></li>' : ''; }).join('') + '</ol></nav>' : '';
    return '<section class="phead wrap">\n  <div class="crumb"><span class="brk">‹</span> Policies</div>\n  <div class="hl"><h1>' + esc(m.title) + '</h1></div>\n  <p class="lead">' + inline(m.intro) + '</p>\n  <p class="pol__date">Last updated ' + longDate(m.updated) + '</p>\n</section>' +
      '<section class="sec wrap pol__sec"><div class="pol">' + toc + '<div class="prose pol__body">' +
      m.sections.map(function (x, i) { return (x.h ? '<h2 id="' + ids[i] + '">' + esc(x.h) + '</h2>' : '') + block(x.body); }).join('') +
      '</div></div></section>\n' + others(m.id);
  }
  function others(id) {
    return '<section class="sec wrap pol__more"><h2 class="pol__moreh">Our policies</h2><div class="pol__links">' + LIST.map(function (p) { return '<a href="' + p.url + '"' + (p.id === id ? ' aria-current="page"' : '') + '>' + esc(p.name) + '</a>'; }).join('') + '<a href="/domains/terms">Domain terms</a></div></section>';
  }
  function json(m) { return JSON.stringify(clean(m)).replace(/</g, '\\u003c').replace(/-->/g, '--\\u003e'); }
  /** reads the model out of a policy page */
  function parse(page) {
    var m = /<script type="application\/json" id="policy-data">([\s\S]*?)<\/script>/.exec(page || '');
    if (!m) return null;
    try { return clean(JSON.parse(m[1])); } catch (e) { return null; }
  }
  /** puts a model into a policy page: content, model, title and description */
  function apply(page, m) {
    m = clean(m);
    var a = page.indexOf('<!-- POLICY -->'), b = page.indexOf('<!-- /POLICY -->');
    if (a < 0 || b < a) throw new Error('This page has no policy section.');
    var desc = esc((m.intro || m.title).replace(/\*\*|\[|\]\([^)]*\)/g, '').slice(0, 155));
    var out = page.slice(0, a) + '<!-- POLICY -->\n<script type="application/json" id="policy-data">' + json(m) + '</script>\n' + render(m) + '\n' + page.slice(b);
    out = out.replace(/<title>[\s\S]*?<\/title>/, '<title>' + esc(m.title) + ' — Ciel Africa</title>')
      .replace(/(<meta name="description" content=")[^"]*(")/, '$1' + desc + '$2')
      .replace(/(<meta property="og:title" content=")[^"]*(")/, '$1' + esc(m.title) + ' — Ciel Africa$2')
      .replace(/(<meta property="og:description" content=")[^"]*(")/, '$1' + desc + '$2')
      .replace(/(<meta name="twitter:title" content=")[^"]*(")/, '$1' + esc(m.title) + ' — Ciel Africa$2')
      .replace(/(<meta name="twitter:description" content=")[^"]*(")/, '$1' + desc + '$2');
    return out;
  }
  return { LIST: LIST, render: render, parse: parse, apply: apply, clean: clean, block: block, longDate: longDate };
});
