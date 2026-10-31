/* ============================================================
   CIEL PHOTO BOOKS — SVG renderer for engine draw lists.
   Used by the editor, the full preview and template cards.
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./engine.js'));
  else root.PBS = factory(root.PBE);
})(typeof self !== 'undefined' ? self : this, function (E) {
  'use strict';
  var uid = 0;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function n(v) { return Math.round(v * 1000) / 1000; }
  /** r = engine render result; o = { url(id) -> image URL, bleed:bool (show bleed area), guides:bool, empty:'editor'|'print', cls } */
  function svg(r, o) {
    o = o || {};
    var b = o.bleed ? r.b : 0, id = 'pb' + (++uid), parts = [];
    var vb = n(-b) + ' ' + n(-b) + ' ' + n(r.w + 2 * b) + ' ' + n(r.h + 2 * b);
    parts.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '" class="' + (o.cls || 'pbsvg') + '" preserveAspectRatio="xMidYMid meet"' + (o.label ? ' role="img" aria-label="' + esc(o.label) + '"' : ' aria-hidden="true"') + '>');
    if (!o.bleed) parts.push('<defs><clipPath id="' + id + 't"><rect x="0" y="0" width="' + n(r.w) + '" height="' + n(r.h) + '"/></clipPath></defs><g clip-path="url(#' + id + 't)">');
    var k = 0;
    r.ops.forEach(function (op) {
      if (op.t === 'rect') parts.push('<rect x="' + n(op.x) + '" y="' + n(op.y) + '" width="' + n(op.w) + '" height="' + n(op.h) + '" fill="' + op.fill + '"/>');
      else if (op.t === 'img') {
        var cid = id + 'c' + (k++), url = o.url ? o.url(op.id) : '';
        parts.push('<clipPath id="' + cid + '"><rect x="' + n(op.clip.x) + '" y="' + n(op.clip.y) + '" width="' + n(op.clip.w) + '" height="' + n(op.clip.h) + '"/></clipPath>');
        parts.push('<rect x="' + n(op.clip.x) + '" y="' + n(op.clip.y) + '" width="' + n(op.clip.w) + '" height="' + n(op.clip.h) + '" fill="#E4E2DC"/>');
        if (url) parts.push('<image href="' + esc(url) + '" x="' + n(op.x) + '" y="' + n(op.y) + '" width="' + n(op.w) + '" height="' + n(op.h) + '" preserveAspectRatio="none" clip-path="url(#' + cid + ')"/>');
      } else if (op.t === 'empty') {
        if (o.empty === 'sample') parts.push('<rect x="' + n(op.x) + '" y="' + n(op.y) + '" width="' + n(op.w) + '" height="' + n(op.h) + '" fill="' + (o.sampleFill || '#D9D6CE') + '"/>');
        else {
          var s = Math.min(op.w, op.h) * 0.12;
          parts.push('<rect class="pbempty" x="' + n(op.x) + '" y="' + n(op.y) + '" width="' + n(op.w) + '" height="' + n(op.h) + '" fill="#ECEBE4" stroke="#B9B7AE" stroke-width="0.5" stroke-dasharray="2 1.5"/>');
          parts.push('<path d="M' + n(op.x + op.w / 2 - s) + ' ' + n(op.y + op.h / 2) + 'h' + n(2 * s) + 'M' + n(op.x + op.w / 2) + ' ' + n(op.y + op.h / 2 - s) + 'v' + n(2 * s) + '" stroke="#9A988F" stroke-width="' + n(Math.max(0.4, s * 0.18)) + '" stroke-linecap="round"/>');
        }
      } else if (op.t === 'path') {
        parts.push('<path d="' + op.d + '" transform="translate(' + n(op.tx) + ' ' + n(op.ty) + ') scale(' + n(op.s) + ')" fill="' + (op.fill || 'none') + '"' + (op.stroke ? ' stroke="' + op.stroke + '" stroke-width="' + n(op.sw / op.s) + '" stroke-linejoin="round" stroke-linecap="round"' : '') + '/>');
      } else if (op.t === 'text') {
        var fs = n(op.size / E.PT), tr = '';
        if (op.rot) parts.push('<g transform="translate(' + n(r.w) + ' 0) rotate(90)"><text x="' + n(op.x) + '" y="' + n(op.y) + '" font-family="pb-' + op.font + '" font-size="' + fs + '" fill="' + op.color + '" text-anchor="' + op.anchor + '" xml:space="preserve" style="font-kerning:none;font-variant-ligatures:none">' + esc(op.text) + '</text></g>');
        else parts.push('<text x="' + n(op.x) + '" y="' + n(op.y) + '" font-family="pb-' + op.font + '" font-size="' + fs + '" fill="' + op.color + '" text-anchor="' + op.anchor + '" xml:space="preserve" style="font-kerning:none;font-variant-ligatures:none"' + tr + '>' + esc(op.text) + '</text>');
      }
    });
    if (!o.bleed) parts.push('</g>');
    if (o.guides) {
      parts.push('<rect x="0" y="0" width="' + n(r.w) + '" height="' + n(r.h) + '" fill="none" stroke="#FF5A1F" stroke-width="0.35" stroke-dasharray="1.5 1" class="pbguide"/>');
      if (r.safe) parts.push('<rect x="' + n(r.safe) + '" y="' + n(r.safe) + '" width="' + n(r.w - 2 * r.safe) + '" height="' + n(r.h - 2 * r.safe) + '" fill="none" stroke="#1F9D55" stroke-width="0.3" stroke-dasharray="1 1.2" class="pbguide"/>');
    }
    parts.push('</svg>');
    return parts.join('');
  }
  /** @font-face rules for the curated library (same TTF files the PDF embeds) */
  function fontCSS(base) {
    base = base || '/assets/fonts/pb/';
    return Object.keys(E.FONTS).map(function (k) { return '@font-face{font-family:"pb-' + k + '";src:url(' + base + E.FONTS[k].file + ') format("truetype");font-display:block;font-weight:400;font-style:normal}'; }).join('\n');
  }
  function injectFonts(doc, base) {
    doc = doc || document;
    if (doc.getElementById('pbfonts')) return;
    var st = doc.createElement('style'); st.id = 'pbfonts'; st.textContent = fontCSS(base) + '\n.pbsvg text{font-synthesis:none}'; doc.head.appendChild(st);
  }
  function loadFonts(doc) {
    doc = doc || document; injectFonts(doc);
    if (!doc.fonts || !doc.fonts.load) return Promise.resolve();
    return Promise.all(Object.keys(E.FONTS).map(function (k) { return doc.fonts.load('16px "pb-' + k + '"').catch(function () {}); }));
  }
  return { svg: svg, fontCSS: fontCSS, injectFonts: injectFonts, loadFonts: loadFonts, esc: esc };
});
