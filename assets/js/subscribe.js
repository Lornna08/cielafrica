/* ============================================================
   CIEL AFRICA — email sign-up (homepage, Photo Books, /subscribe)
   <section data-subscribe="home|photobooks"></section>  → filled in here.
   Double opt-in: we email a confirmation link first; nobody is added
   until they tap it (see /api/hq?route=subscribe, lib/hq/subs.js).
   ============================================================ */
(function () {
  'use strict';
  var COPY = {
    home: { k: 'The Ciel letter', h: 'Good things, <em>now and then.</em>', p: 'New work from the studio, fresh photo book covers and the occasional offer, straight to your inbox.', perks: ['Studio news', 'New covers first', 'Offers'], btn: 'Subscribe' },
    photobooks: { k: 'Photo Books letter', h: 'New covers, <em>first.</em>', p: 'Be the first to see new covers and seasonal ideas, and hear about photo book offers before anyone else.', perks: ['New covers first', 'Gift ideas', 'Offers'], btn: 'Subscribe' },
    page: { k: 'The Ciel letter', h: 'Stay in <em>the loop.</em>', p: 'Websites and photo books from Nairobi: new work, new covers and the occasional offer.', perks: ['Studio news', 'New covers first', 'Offers'], btn: 'Subscribe' }
  };
  var CSS = '.csub{position:relative;overflow:hidden;isolation:isolate;border-radius:26px;background:#141110;color:#f6f1e9;padding:clamp(28px,5.5vw,64px);display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:clamp(22px,4.5vw,64px);align-items:center;margin-block:clamp(2rem,5vw,4rem);font-family:Inter,system-ui,-apple-system,sans-serif}' +
    '.csub::before{content:"";position:absolute;inset:0;z-index:-2;background:radial-gradient(60% 90% at 100% 0%,rgba(255,90,31,.38),transparent 62%),radial-gradient(50% 70% at 0% 100%,rgba(255,176,74,.16),transparent 70%)}' +
    '.csub__brk{position:absolute;right:-.04em;bottom:-.34em;z-index:-1;font:700 clamp(13rem,30vw,25rem)/1 "Space Grotesk",system-ui,sans-serif;color:rgba(255,90,31,.12);pointer-events:none;user-select:none}' +
    '.csub__k{display:inline-flex;align-items:center;gap:.5rem;font:600 .76rem/1 "Space Grotesk",system-ui,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:#ff8a4c}.csub__k b{color:#ff5a1f;font-size:1.1rem;letter-spacing:0}' +
    '.csub h2{font:700 clamp(2.1rem,4.6vw,3.6rem)/1 "Space Grotesk",system-ui,sans-serif;letter-spacing:-.04em;margin:.7rem 0 .9rem;color:#fffaf3}.csub h2 em{font-style:normal;color:#ff5a1f}' +
    '.csub__p{color:#c4bbaf;font-size:1.04rem;line-height:1.55;max-width:42ch;margin:0}' +
    '.csub__perks{display:flex;flex-wrap:wrap;gap:.45rem;margin:1.2rem 0 0;padding:0;list-style:none}.csub__perks li{display:inline-flex;align-items:center;gap:.4rem;border:1px solid rgba(255,255,255,.14);border-radius:999px;padding:.38rem .8rem;font-size:.82rem;color:#e9e1d6}.csub__perks li::before{content:"";width:6px;height:6px;border-radius:50%;background:#ff5a1f}' +
    '.csub__f{display:grid;gap:.7rem;margin:0}' +
    '.csub__nm{width:100%;box-sizing:border-box;height:50px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#fff;font:inherit;font-size:16px;padding:0 1.15rem;outline:none;transition:border-color .15s,background .15s}' +
    '.csub__row{display:flex;gap:6px;align-items:center;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:999px;padding:5px;transition:border-color .15s,box-shadow .15s}' +
    '.csub__row:focus-within,.csub__nm:focus{border-color:#ff5a1f;box-shadow:0 0 0 4px rgba(255,90,31,.18)}' +
    '.csub__row input{flex:1;min-width:0;height:44px;border:0;background:transparent;color:#fff;font:inherit;font-size:16px;padding:0 .9rem;outline:none}' +
    '.csub input::placeholder{color:#8f877d}' +
    '.csub__go{flex:none;height:44px;border:0;border-radius:999px;padding:0 1.35rem;background:linear-gradient(135deg,#ff5a1f,#ff7a2f)!important;color:#fff!important;font:700 .98rem "Space Grotesk",system-ui,sans-serif;letter-spacing:-.01em;cursor:pointer;box-shadow:0 12px 26px -12px rgba(255,90,31,.9);transition:transform .08s,filter .15s;display:inline-flex;align-items:center;gap:.45rem}' +
    '.csub__go:hover{filter:brightness(1.06)}.csub__go:active{transform:translateY(1px)}.csub__go:disabled{opacity:.7;cursor:progress}.csub__go svg{width:17px;height:17px}' +
    '.csub__ok{margin:0;padding:0 .4rem;font-size:.8rem;line-height:1.45;color:#a39b91}.csub__ok a{color:#e9e1d6}' +
    '.csub__err{min-height:1.2em;margin:0;font-size:.86rem;color:#ff9a7a}' +
    '.csub__hp{position:absolute!important;left:-9999px!important;width:1px;height:1px;opacity:0}' +
    '.csub__done{display:grid;gap:.6rem;justify-items:start;animation:csubIn .35s ease both}.csub__done i{width:52px;height:52px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#ff5a1f,#ffb04a);box-shadow:0 14px 30px -12px rgba(255,90,31,.9)}.csub__done i svg{width:26px;height:26px;color:#fff}.csub__done b{font:700 1.5rem/1.15 "Space Grotesk",system-ui,sans-serif;letter-spacing:-.02em;color:#fffaf3}.csub__done p{margin:0;color:#c4bbaf;line-height:1.55}' +
    '@keyframes csubIn{from{opacity:0;transform:translateY(8px)}}' +
    '.csub--light{background:#f3e9da;color:#141110}.csub--light::before{background:radial-gradient(60% 90% at 100% 0%,rgba(255,90,31,.22),transparent 62%),radial-gradient(50% 70% at 0% 100%,rgba(255,176,74,.22),transparent 70%)}.csub--light h2{color:#141110}.csub--light .csub__p,.csub--light .csub__ok{color:#5f564c}.csub--light .csub__ok a{color:#141110}.csub--light .csub__k{color:#d9480f}.csub--light .csub__perks li{border-color:rgba(20,17,16,.14);color:#3a332d}.csub--light .csub__row,.csub--light .csub__nm{background:#fffaf3;border-color:rgba(20,17,16,.12);color:#141110}.csub--light .csub__row input{color:#141110}.csub--light input::placeholder{color:#a0968a}.csub--light .csub__brk{color:rgba(255,90,31,.14)}.csub--light .csub__done b{color:#141110}.csub--light .csub__done p{color:#5f564c}.csub--light .csub__err{color:#c2410c}' +
    '@media(max-width:820px){.csub{grid-template-columns:minmax(0,1fr);border-radius:22px}.csub h2{font-size:clamp(2rem,9vw,2.8rem)}}' +
    '@media(max-width:420px){.csub__row{flex-wrap:wrap;border-radius:22px}.csub__row input{flex:1 1 100%}.csub__go{flex:1 1 100%;justify-content:center}}';
  var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>';
  var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
  var styled = false;
  function style() { if (styled) return; styled = true; var s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); }
  function post(route, data) {
    return fetch('/api/hq?route=' + route, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'ciel' }, body: JSON.stringify(data) })
      .then(function (r) { return r.json().catch(function () { return { ok: false, error: 'Something went wrong. Please try again.' }; }).then(function (j) { if (!r.ok || j.ok === false) throw new Error(j.error || 'Something went wrong. Please try again.'); return j; }); });
  }
  function render(el) {
    if (el.getAttribute('data-sub-on')) return; el.setAttribute('data-sub-on', '1'); style();
    var src = el.getAttribute('data-subscribe') || 'home', c = COPY[src] || COPY.home;
    el.innerHTML = '<div class="csub' + (el.hasAttribute('data-light') ? ' csub--light' : '') + '" id="subscribe-' + src + '"><span class="csub__brk" aria-hidden="true">‹</span>' +
      '<div><span class="csub__k"><b>‹</b> ' + c.k + '</span><h2>' + c.h + '</h2><p class="csub__p">' + c.p + '</p><ul class="csub__perks">' + c.perks.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div>' +
      '<div class="csub__box"><form class="csub__f" novalidate><input class="csub__nm" name="name" type="text" autocomplete="given-name" placeholder="First name (optional)" maxlength="80" aria-label="First name (optional)">' +
      '<div class="csub__row"><input name="email" type="email" inputmode="email" autocomplete="email" placeholder="Your email address" required aria-label="Email address"><button class="csub__go" type="submit">' + c.btn + ARROW + '</button></div>' +
      '<p class="csub__ok">By subscribing you agree to get Ciel Africa emails. Unsubscribe in one click, any time. <a href="/privacy.html#emails">Privacy note</a>.</p>' +
      '<input class="csub__hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<p class="csub__err" role="alert"></p></form></div></div>';
    var f = el.querySelector('form'), box = el.querySelector('.csub__box'), er = el.querySelector('.csub__err'), go = el.querySelector('.csub__go');
    f.addEventListener('submit', function (e) {
      e.preventDefault(); er.textContent = '';
      var email = f.email.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { er.textContent = 'Enter a valid email address.'; f.email.focus(); return; }
      go.disabled = true; var label = go.innerHTML; go.textContent = 'Sending…';
      post('subscribe', { email: email, name: f.name.value.trim(), consent: true, source: src === 'page' ? 'other' : src, hp: f.website.value })
        .then(function () {
          box.innerHTML = '<div class="csub__done" role="status"><i>' + CHECK + '</i><b>Almost there. Check your inbox.</b><p>We’ve sent a confirmation link to <strong>' + email.replace(/[<>&"]/g, '') + '</strong>. Tap it and you’re in. Can’t see it? Look in Promotions or Spam.</p></div>';
          try { if (window.va) window.va('event', { name: 'subscribe', source: src }); } catch (x) { }
        }, function (x) { go.disabled = false; go.innerHTML = label; er.textContent = x.message; });
    });
  }
  function mount(root) { (root || document).querySelectorAll('[data-subscribe]').forEach(render); }
  window.CielSub = { mount: mount, post: post };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { mount(); }); else mount();
})();
