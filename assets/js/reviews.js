/* ============================================================
   CIEL AFRICA — real customer reviews on the website.
   <section data-reviews></section> stays hidden until there is at least one
   review that Ciel Africa approved AND the customer agreed to show
   (from /api/hq?route=reviews-public). Nothing is made up here.
   ============================================================ */
(function () {
  'use strict';
  var CSS = '.crev{margin-block:clamp(2rem,5vw,4rem)}.crev__h{display:flex;align-items:flex-end;justify-content:space-between;gap:1rem;flex-wrap:wrap;margin-bottom:1.2rem}' +
    '.crev__k{font:600 .76rem "Space Grotesk",system-ui,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:#d9480f}.crev__k b{color:#ff5a1f}' +
    '.crev h2{font:700 clamp(1.9rem,4vw,3rem)/1.02 "Space Grotesk",system-ui,sans-serif;letter-spacing:-.04em;margin:.5rem 0 0}.crev h2 em{font-style:normal;color:#ff5a1f}' +
    '.crev__avg{display:flex;align-items:center;gap:.6rem;font:600 .95rem Inter,system-ui,sans-serif;color:#3a332d}.crev__avg b{font:700 2rem "Space Grotesk",sans-serif;letter-spacing:-.03em;color:#141110}' +
    '.crev__g{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:.9rem}' +
    '.crev__c{background:#fff;border:1px solid #ece4d8;border-radius:20px;padding:1.2rem 1.2rem 1.1rem;display:flex;flex-direction:column;gap:.7rem;box-shadow:0 14px 34px -26px rgba(40,25,10,.45)}' +
    '.crev__s{color:#f59e0b;letter-spacing:2px;font-size:1.05rem}.crev__s i{font-style:normal;color:#e7ded1}' +
    '.crev__x{margin:0;font-size:1rem;line-height:1.55;color:#2b2724;flex:1}' +
    '.crev__w{font-size:.84rem;color:#6f655a}.crev__w b{color:#141110}';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var data = null;
  function load() { return data || (data = fetch('/api/hq?route=reviews-public').then(function (r) { return r.ok ? r.json() : { items: [] }; }).then(function (j) { return j.items || []; }, function () { return []; })); }
  function render(el) {
    if (el.getAttribute('data-rev-on')) return; el.setAttribute('data-rev-on', '1');
    load().then(function (items) {
      var only = el.getAttribute('data-reviews'); if (only) items = items.filter(function (r) { return r.kind === only; }).concat(items.filter(function (r) { return r.kind !== only; }));
      if (!items.length) { el.hidden = true; return; }
      if (!document.getElementById('crevCss')) { var s = document.createElement('style'); s.id = 'crevCss'; s.textContent = CSS; document.head.appendChild(s); }
      var avg = items.reduce(function (n, r) { return n + r.stars; }, 0) / items.length;
      el.hidden = false;
      el.innerHTML = '<div class="crev"><div class="crev__h"><div><span class="crev__k"><b>‹</b> Customer reviews</span><h2>In their <em>own words.</em></h2></div><div class="crev__avg"><b>' + avg.toFixed(1) + '</b><span>out of 5 · ' + items.length + ' review' + (items.length === 1 ? '' : 's') + '</span></div></div>' +
        '<div class="crev__g">' + items.slice(0, 6).map(function (r) { var st = ''; for (var i = 1; i <= 5; i++) st += i <= r.stars ? '★' : '<i>★</i>'; return '<figure class="crev__c" style="margin:0"><div class="crev__s" aria-label="' + r.stars + ' out of 5">' + st + '</div>' + (r.text ? '<blockquote class="crev__x" style="margin:0">“' + esc(r.text) + '”</blockquote>' : '') + '<figcaption class="crev__w"><b>' + esc(r.name) + '</b>' + (r.town ? ', ' + esc(r.town) : '') + ' · ' + esc(r.kind) + '</figcaption></figure>'; }).join('') + '</div></div>';
    });
  }
  function mount(root) { (root || document).querySelectorAll('[data-reviews]').forEach(render); }
  window.CielReviews = { mount: mount };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { mount(); }); else mount();
})();
