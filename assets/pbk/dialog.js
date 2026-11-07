/* ============================================================
   CIEL AFRICA — in-page dialogs for Photo Books.
   The browser's own confirm() / alert() / prompt() don't open inside many
   in-app browsers and phone web views (they silently answer "no"), so every
   question is asked with this instead. All three return a Promise.
     PBKAsk.confirm(text, { title, ok, cancel, danger }) → true / false
     PBKAsk.alert(text, { title, ok })                   → undefined
     PBKAsk.prompt(text, value, { title, ok })           → string / null
   ============================================================ */
(function () {
  'use strict';
  var css = false;
  function style() {
    if (css) return; css = true;
    var s = document.createElement('style');
    s.textContent = '.pka{position:fixed;inset:0;z-index:10050;display:grid;place-items:center;padding:16px;background:rgba(20,18,16,.48);animation:pkaIn .16s ease}' +
      '@keyframes pkaIn{from{opacity:0}to{opacity:1}}' +
      '.pka__b{width:min(420px,100%);background:#fff;color:#1a1714;border-radius:18px;padding:1.4rem 1.3rem 1.1rem;box-shadow:0 24px 60px -18px rgba(0,0,0,.45);font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}' +
      '.pka__t{font-weight:700;font-size:1.05rem;margin:0 0 .35rem}.pka__m{margin:0;color:#4c463f;white-space:pre-line}' +
      '.pka__in{width:100%;margin-top:.8rem;height:46px;border:1px solid #e3ddd3;border-radius:12px;padding:0 .8rem;font:inherit;font-size:16px;outline:none}.pka__in:focus{border-color:#ff5a1f;box-shadow:0 0 0 3px rgba(255,90,31,.18)}' +
      '.pka__a{display:flex;justify-content:flex-end;gap:.5rem;margin-top:1.1rem;flex-wrap:wrap}' +
      '.pka__a button{border:0;border-radius:999px;padding:.7rem 1.15rem;font:600 14.5px system-ui,-apple-system,sans-serif;cursor:pointer;min-height:44px}' +
      '.pka__no{background:#f1ede6;color:#1a1714}.pka__ok{background:#141210;color:#fff}.pka__ok.is-p{background:#ff5a1f}.pka__ok.is-d{background:#c0262d}';
    document.head.appendChild(s);
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function open(kind, text, o) {
    o = o || {}; style();
    return new Promise(function (done) {
      var back = document.activeElement, d = document.createElement('div');
      d.className = 'pka'; d.setAttribute('role', kind === 'alert' ? 'alertdialog' : 'dialog'); d.setAttribute('aria-modal', 'true');
      d.innerHTML = '<div class="pka__b">' + (o.title ? '<p class="pka__t">' + esc(o.title) + '</p>' : '') + '<p class="pka__m">' + esc(text) + '</p>' +
        (kind === 'prompt' ? '<input class="pka__in" type="text" value="' + esc(o.value || '') + '">' : '') +
        '<div class="pka__a">' + (kind === 'alert' ? '' : '<button type="button" class="pka__no">' + esc(o.cancel || 'Cancel') + '</button>') +
        '<button type="button" class="pka__ok' + (o.danger ? ' is-d' : o.primary ? ' is-p' : '') + '">' + esc(o.ok || 'OK') + '</button></div></div>';
      document.body.appendChild(d);
      var inp = d.querySelector('.pka__in'), ok = d.querySelector('.pka__ok'), no = d.querySelector('.pka__no');
      function end(v) { document.removeEventListener('keydown', key, true); d.remove(); try { if (back && back.focus) back.focus(); } catch (e) { } done(v); }
      function yes() { end(kind === 'prompt' ? inp.value : kind === 'confirm' ? true : undefined); }
      function nay() { end(kind === 'prompt' ? null : kind === 'confirm' ? false : undefined); }
      function key(e) { if (e.key === 'Escape') { e.preventDefault(); nay(); } else if (e.key === 'Enter' && (kind !== 'prompt' || e.target === inp)) { e.preventDefault(); yes(); } }
      document.addEventListener('keydown', key, true);
      ok.onclick = yes; if (no) no.onclick = nay;
      d.addEventListener('click', function (e) { if (e.target === d && kind !== 'alert') nay(); });
      setTimeout(function () { (inp || ok).focus(); if (inp) inp.select(); }, 30);
    });
  }
  window.PBKAsk = {
    confirm: function (t, o) { return open('confirm', t, o); },
    alert: function (t, o) { return open('alert', t, o); },
    prompt: function (t, v, o) { o = o || {}; o.value = v; return open('prompt', t, o); }
  };
})();
