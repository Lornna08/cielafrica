/* ============================================================
   CIEL AFRICA PHOTO BOOKS — copy protection
   Blocks right-click, image dragging, long-press save, text selection
   of artwork, Save/Print/View-source shortcuts and printing. Files are
   only produced for paid orders (see shop.js). This deters copying; it
   cannot stop screenshots.
   ============================================================ */
(function () {
  'use strict';
  function editable(t) { return t && t.closest && t.closest('input, textarea, select, [contenteditable="true"]'); }
  document.addEventListener('contextmenu', function (e) { if (!editable(e.target)) e.preventDefault(); }, true);
  document.addEventListener('dragstart', function (e) { var t = e.target; if (t && (t.tagName === 'IMG' || t.tagName === 'CANVAS' || (t.closest && t.closest('.pk, .pe, .pf, .pfx'))) && !(t.closest && t.closest('[data-ph]'))) e.preventDefault(); }, true);
  document.addEventListener('keydown', function (e) {
    var k = (e.key || '').toLowerCase(), mod = e.ctrlKey || e.metaKey;
    if (mod && (k === 's' || k === 'p' || k === 'u')) { e.preventDefault(); e.stopPropagation(); }
    if (mod && e.shiftKey && (k === 'i' || k === 'j' || k === 'c')) { e.preventDefault(); }
    if (k === 'f12') e.preventDefault();
  }, true);
  document.addEventListener('copy', function (e) { if (!editable(e.target)) e.preventDefault(); }, true);
  var st = document.createElement('style');
  st.textContent = '.pk img,.pk canvas,.pe img,.pe canvas,.pf img,.pf canvas,.pfx canvas,.cart-row__th img{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-user-drag:none}' +
    '.pk,.pe,.pf{-webkit-user-select:none;user-select:none}.pk input,.pk textarea,.pe input,.pe textarea{-webkit-user-select:text;user-select:text}' +
    '@media print{body *{display:none!important}body::after{content:"Printing is turned off on Ciel Africa Photo Books.";display:block!important;padding:2rem;font:16px sans-serif}}';
  document.head.appendChild(st);
})();
