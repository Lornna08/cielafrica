/* ============================================================
   Personal portfolio — behaviour
   Content comes from data.js (window.PF). No frameworks.
   ============================================================ */
(function () {
  'use strict';
  var D = window.PF, P = D.PHOTOS, C = D.CONTACT, BASE = D.base, IMG = D.img;
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var I = {
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>'
  };
  var CAT = {}; D.CATEGORIES.forEach(function (c) { CAT[c.id] = c; });

  /* ---------- images ---------- */
  function img(slug, o) {
    o = o || {}; var p = P[slug]; if (!p) return '';
    var set = p.s.map(function (w) { return IMG + slug + '-' + w + '.webp ' + w + 'w'; }).join(', ');
    var mid = p.s.filter(function (w) { return w <= 800; }).pop() || p.s[0];
    return '<img src="' + IMG + slug + '-' + mid + '.webp" srcset="' + set + '" sizes="' + (o.sizes || '(max-width: 640px) 50vw, 33vw') + '" width="' + p.w + '" height="' + p.h + '" alt="' + esc(p.alt) + '"' +
      (o.eager ? ' loading="eager" fetchpriority="high"' : ' loading="lazy"') + ' decoding="async">';
  }
  function guard(root) {
    $$('img', root).forEach(function (im) {
      if (im.dataset.g) return; im.dataset.g = 1;
      im.addEventListener('error', function () {
        var slug = (im.getAttribute('src') || '').split('/').pop().replace(/-\d+\.webp$/, '');
        if (!im.dataset.f && P[slug] && P[slug].o) { im.dataset.f = 1; im.removeAttribute('srcset'); im.src = IMG + 'original/' + P[slug].o; return; }
        im.classList.add('is-broken');
      });
    });
  }
  function tile(slug, group, i, cap) {
    var p = P[slug];
    return '<figure class="reveal"><button type="button" class="tile" data-lb="' + group + '" data-i="' + i + '" aria-label="Open photo: ' + esc(p.alt) + '">' + img(slug, { sizes: '(max-width: 640px) 50vw, (max-width: 960px) 33vw, 380px' }) + '</button>' + (cap ? '<figcaption>' + esc(cap) + '</figcaption>' : '') + '</figure>';
  }

  /* ---------- lightbox ---------- */
  var groups = {}, lb, lbImg, st = null, lastFocus = null;
  function group(name, slugs, label) { groups[name] = { slugs: slugs, label: label }; }
  function build() {
    lb = document.createElement('div'); lb.className = 'lb';
    lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Photo viewer');
    lb.innerHTML = '<div class="lb__top"><span class="lb__lbl" data-l></span><button type="button" class="lb__x" data-x aria-label="Close">' + I.x + '</button></div>' +
      '<div class="lb__stage"><img class="lb__img" alt="" draggable="false"><button type="button" class="lb__nav lb__prev" data-p aria-label="Previous photo">' + I.left + '</button><button type="button" class="lb__nav lb__next" data-n aria-label="Next photo">' + I.arrow + '</button></div>' +
      '<div class="lb__bot"><p class="lb__cap" data-c></p><span class="lb__count" aria-live="polite" data-k></span></div>';
    document.body.appendChild(lb); lbImg = $('.lb__img', lb);
    lb.addEventListener('click', function (e) {
      if (e.target.closest('[data-x]')) return close();
      if (e.target.closest('[data-p]')) return step(-1);
      if (e.target.closest('[data-n]')) return step(1);
      if (e.target.classList.contains('lb__stage')) close();
    });
    var sx = null, sy = null;
    lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (sx == null) return; var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy; sx = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
      else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) close();
    });
  }
  function show(i) {
    var g = groups[st.g], n = g.slugs.length; i = (i + n) % n; st.i = i;
    var s = g.slugs[i], p = P[s];
    lbImg.removeAttribute('srcset'); lbImg.src = IMG + s + '-' + (p.s.filter(function (w) { return w <= 800; }).pop() || p.s[0]) + '.webp';
    lbImg.srcset = p.s.map(function (w) { return IMG + s + '-' + w + '.webp ' + w + 'w'; }).join(', '); lbImg.sizes = '100vw';
    lbImg.alt = p.alt; lbImg.width = p.w; lbImg.height = p.h;
    $('[data-c]', lb).textContent = p.alt + (p.credit ? ' · Photo: ' + p.credit[0] + ' on Unsplash' : '');
    $('[data-k]', lb).textContent = (i + 1) + ' / ' + n;
    $('[data-l]', lb).textContent = g.label || (CAT[p.c] ? CAT[p.c].name : D.profile.name);
    [1, -1].forEach(function (d) { var q = g.slugs[(i + d + n) % n], pp = P[q]; (new Image()).src = IMG + q + '-' + (pp.s.filter(function (w) { return w <= 800; }).pop() || pp.s[0]) + '.webp'; });
  }
  function open(g, i, from) {
    if (!groups[g]) return; if (!lb) build();
    lastFocus = from || document.activeElement; st = { g: g, i: i };
    lb.classList.add('is-open'); document.documentElement.style.overflow = 'hidden';
    show(i); $('[data-x]', lb).focus({ preventScroll: true });
    document.addEventListener('keydown', keys);
  }
  function close() {
    if (!lb || !lb.classList.contains('is-open')) return;
    lb.classList.remove('is-open'); document.documentElement.style.overflow = '';
    document.removeEventListener('keydown', keys);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  function step(d) { if (st) show(st.i + d); }
  function keys(e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    else if (e.key === 'Tab') trap(e, lb);
  }
  function trap(e, box) {
    var f = $$('button,a[href],input,select,textarea', box).filter(function (x) { return x.offsetParent !== null; });
    if (!f.length) return; var a = f[0], z = f[f.length - 1];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
    else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
  }
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-lb]'); if (b) open(b.getAttribute('data-lb'), +b.getAttribute('data-i'), b); });

  /* ---------- header ---------- */
  function header() {
    var h = $('.hdr'); if (!h) return;
    var on = function () { h.classList.toggle('is-scrolled', window.scrollY > 4); };
    window.addEventListener('scroll', on, { passive: true }); on();
    var btn = $('.burger'), dr = $('.drawer'); if (!btn || !dr) return;
    function set(o) {
      btn.setAttribute('aria-expanded', o ? 'true' : 'false'); btn.setAttribute('aria-label', o ? 'Close menu' : 'Open menu');
      dr.classList.toggle('is-open', o); if (o) dr.removeAttribute('inert'); else dr.setAttribute('inert', '');
      if (o) { var f = $('a', dr); if (f) f.focus({ preventScroll: true }); document.addEventListener('keydown', k); document.addEventListener('click', out, true); }
      else { document.removeEventListener('keydown', k); document.removeEventListener('click', out, true); }
    }
    function k(e) { if (e.key === 'Escape') { set(false); btn.focus(); } }
    function out(e) { if (!dr.contains(e.target) && !btn.contains(e.target)) set(false); }
    btn.addEventListener('click', function () { set(btn.getAttribute('aria-expanded') !== 'true'); });
    dr.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
  }

  /* ---------- reveal ---------- */
  var io = ('IntersectionObserver' in window && !RM) ? new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -6% 0px' }) : null;
  function reveal(root) { $$('.reveal', root).forEach(function (el) { if (io) io.observe(el); else el.classList.add('is-in'); }); }

  /* ---------- rate helpers ---------- */
  function lowest(g) {
    var n = g.items.map(function (it) { var m = it[1].replace(/,/g, '').match(/KES\s*(\d+)/); return m ? +m[1] : null; }).filter(function (x) { return x != null; });
    return n.length ? 'KES ' + Math.min.apply(null, n).toLocaleString('en-US') : '';
  }

  /* ---------- home ---------- */
  function cats(el) {
    el.innerHTML = D.CATEGORIES.map(function (c) {
      return '<a class="cat reveal" href="' + BASE + '/portfolio/' + c.id + '">' + img(c.cover || c.photos[0], { sizes: '(max-width: 640px) 50vw, 25vw' }) + '<span class="cat__t"><b>' + esc(c.name) + '</b><span>' + c.photos.length + (c.photos.length === 1 ? ' photo' : ' photos') + '</span></span></a>';
    }).join('');
  }
  function featured(el) {
    var s = D.FEATURED; group('featured', s, 'Featured work');
    el.innerHTML = s.map(function (x, i) { return tile(x, 'featured', i, CAT[P[x].c] ? CAT[P[x].c].name : ''); }).join('');
  }
  function brands(el) {
    el.innerHTML = D.BRANDS.map(function (b) { return '<figure class="brandc reveal"><div><img src="' + IMG + b.img + '" width="360" height="360" alt="' + esc(b.name) + ' logo" loading="lazy" decoding="async"></div><figcaption>' + esc(b.name) + '</figcaption></figure>'; }).join('');
  }
  function svcs(el) {
    el.innerHTML = D.RATES.map(function (g) {
      var f = lowest(g);
      return '<li><a class="svc reveal" href="' + BASE + '/rates#' + g.id + '"><span><b>' + esc(g.name) + '</b><small>' + esc(g.items.map(function (it) { return it[0]; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).slice(0, 3).join(' · ')) + '</small></span><span class="from">' + (f ? 'from<strong>' + f + '</strong>' : '<strong>' + esc(g.items[0][1]) + '</strong>') + '</span></a></li>';
    }).join('');
  }
  function chips(el) { el.innerHTML = D.SERVICES.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join(''); }

  /* ---------- portfolio ---------- */
  function portfolio() {
    var tabs = $('[data-tabs]'), box = $('[data-chapters]');
    tabs.innerHTML = '<a class="tab" href="' + BASE + '/portfolio" data-cat="">All</a>' + D.CATEGORIES.map(function (c) { return '<a class="tab" href="' + BASE + '/portfolio/' + c.id + '" data-cat="' + c.id + '">' + esc(c.name) + '</a>'; }).join('');
    function cur() { var m = location.pathname.match(/\/portfolio\/([a-z]+)/); return m && CAT[m[1]] ? m[1] : ''; }
    function chapter(c, single) {
      group(c.id, c.photos, c.name);
      var partner = c.brand ? D.BRANDS.filter(function (b) { return b.name === c.brand; })[0] : null;
      var h = '<section class="chapter" id="' + c.id + '" aria-labelledby="h-' + c.id + '"><div class="chapter__h"><span class="eyebrow">' + esc(c.kicker) + '</span><h2 id="h-' + c.id + '">' + (single ? esc(c.name) : '<a href="' + BASE + '/portfolio/' + c.id + '" data-cat="' + c.id + '">' + esc(c.name) + '</a>') + '</h2>' +
        (partner ? '<div class="partner"><img src="' + IMG + partner.img + '" alt="" width="40" height="40">Campaign for ' + esc(partner.name) + '</div>' : '') +
        '<div class="desc is-short">' + c.body.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</div>' + (c.body.length > 1 ? '<button type="button" class="more" data-more aria-expanded="false">Read more</button>' : '') + '</div>' +
        '<div class="grid' + (c.photos.length === 1 ? ' grid--one' : '') + '">' + c.photos.map(function (s, i) { return tile(s, c.id, i); }).join('') + '</div>';
      if (single) {
        var k = D.CATEGORIES.indexOf(c), nx = D.CATEGORIES[(k + 1) % D.CATEGORIES.length];
        h += '<div class="next"><a class="link" href="' + BASE + '/portfolio" data-cat="">' + I.left + ' All work</a><a class="link" href="' + BASE + '/portfolio/' + nx.id + '" data-cat="' + nx.id + '">Next: ' + esc(nx.name) + ' ' + I.arrow + '</a></div>';
      }
      return h + '</section>';
    }
    function paint(id, first) {
      $$('.tab', tabs).forEach(function (a) { a.setAttribute('aria-current', a.getAttribute('data-cat') === id ? 'true' : 'false'); });
      var act = $('.tab[aria-current="true"]', tabs); if (act && !first) act.scrollIntoView({ block: 'nearest', inline: 'center', behavior: RM ? 'auto' : 'smooth' });
      else if (act && act.parentNode.scrollWidth > act.parentNode.clientWidth) { var sc = act.parentNode; sc.scrollLeft = act.offsetLeft - sc.offsetLeft - (sc.clientWidth - act.offsetWidth) / 2; }
      box.innerHTML = id ? chapter(CAT[id], true) : D.CATEGORIES.map(function (c) { return chapter(c, false); }).join('');
      var c = CAT[id];
      document.title = (c ? c.name + ' — ' : 'Portfolio — ') + D.profile.name;
      var can = $('link[rel="canonical"]'); if (can) can.href = D.site + BASE + '/portfolio' + (id ? '/' + id : '');
      guard(box); reveal(box);
    }
    function swap(id) {
      var y = $('.tabs').getBoundingClientRect().top + window.scrollY - (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--hdr')) || 64);
      box.classList.add('is-leaving');
      setTimeout(function () { paint(id); if (window.scrollY > y) window.scrollTo(0, y); box.classList.remove('is-leaving'); }, RM ? 0 : 180);
    }
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[data-cat]');
      if (a && !e.metaKey && !e.ctrlKey && !e.shiftKey) { e.preventDefault(); var id = a.getAttribute('data-cat'); if (id !== cur() || location.pathname.indexOf(BASE + '/portfolio') !== 0) { history.pushState({}, '', BASE + '/portfolio' + (id ? '/' + id : '')); swap(id); } return; }
      var m = e.target.closest('[data-more]'); if (m) { var d = m.previousElementSibling, o = d.classList.toggle('is-short'); m.textContent = o ? 'Read more' : 'Show less'; m.setAttribute('aria-expanded', o ? 'false' : 'true'); }
    });
    window.addEventListener('popstate', function () { swap(cur()); });
    paint(cur(), true);
  }

  /* ---------- rates ---------- */
  function rates(el, jump) {
    el.innerHTML = D.RATES.map(function (g) {
      return '<section class="rcard reveal" id="' + g.id + '" aria-labelledby="r-' + g.id + '"><h2 id="r-' + g.id + '">' + (g.photo ? img(g.photo, { sizes: '48px' }) : '') + esc(g.name) + '</h2>' +
        g.items.map(function (it) {
          var q = g.name + ' — ' + it[0] + (it[2] ? ' (' + it[2] + ')' : '');
          return '<div class="rrow"><div class="rrow__n">' + esc(it[0]) + (it[2] ? '<small>' + esc(it[2]) + '</small>' : '') + '</div><div class="rrow__p">' + esc(it[1]) + '</div><a class="rrow__q" href="' + BASE + '/contact?service=' + encodeURIComponent(q) + '#enquire">Enquire<span class="sr"> about ' + esc(q) + '</span> →</a></div>';
        }).join('') + '</section>';
    }).join('');
    if (jump) jump.innerHTML = D.RATES.map(function (g) { return '<a href="#' + g.id + '">' + esc(g.name) + '</a>'; }).join('');
    var t = $('[data-terms]'); if (t) t.innerHTML = D.TERMS.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');
  }

  /* ---------- contact form ---------- */
  function form(f) {
    var sel = f.elements.Service;
    sel.innerHTML = '<option value="">Choose a service (optional)</option>' + D.RATES.map(function (g) {
      return '<optgroup label="' + esc(g.name) + '">' + g.items.map(function (it) { var v = g.name + ' — ' + it[0] + (it[2] ? ' (' + it[2] + ')' : ''); return '<option value="' + esc(v) + '">' + esc(it[0] + (it[2] ? ' (' + it[2] + ')' : '') + ' · ' + it[1]) + '</option>'; }).join('') + '</optgroup>';
    }).join('') + '<option value="Something else">Something else / not sure yet</option>';
    var want = new URLSearchParams(location.search).get('service');
    if (want && $$('option', sel).some(function (o) { return o.value === want; })) sel.value = want;
    var status = $('[data-status]', f), btn = $('button[type="submit"]', f);
    function err(n, msg) { var x = f.elements[n], e = $('[data-err="' + n + '"]', f); x.setAttribute('aria-invalid', msg ? 'true' : 'false'); if (e) e.textContent = msg || ''; return !msg; }
    function validate() {
      var v = function (n) { return (f.elements[n].value || '').trim(); }, first = null;
      [['Name', v('Name') ? '' : 'Please add your name.'],
       ['Email', !v('Email') ? 'Please add your email so ' + D.profile.first + ' can reply.' : (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v('Email')) ? '' : 'That email address doesn’t look right.')],
       ['Details', v('Details').length >= 10 ? '' : 'Tell ' + D.profile.first + ' a little about the project.']]
        .forEach(function (x) { if (!err(x[0], x[1]) && !first) first = f.elements[x[0]]; });
      if (first) first.focus(); return !first;
    }
    ['Name', 'Email', 'Details'].forEach(function (n) { f.elements[n].addEventListener('input', function () { if (this.getAttribute('aria-invalid') === 'true') err(n, ''); }); });
    function body(d) { return 'Hi ' + D.profile.first + ',\n\n' + d.Details + '\n\n' + d.Name + (d.Brand ? ' (' + d.Brand + ')' : '') + (d.Service ? '\nService: ' + d.Service : '') + (d['Preferred date'] ? '\nDate: ' + d['Preferred date'] : '') + (d.Phone ? '\nPhone: ' + d.Phone : ''); }
    f.addEventListener('submit', function (e) {
      e.preventDefault(); status.hidden = true;
      if (!validate()) return;
      var d = {}; ['Name', 'Email', 'Brand', 'Phone', 'Service', 'Preferred date', 'Details'].forEach(function (k) { var x = f.elements[k]; if (x && x.value.trim()) d[k] = x.value.trim(); });
      if (D.form.mode !== 'send') {
        // template: never pretend to send
        status.className = 'status status--info'; status.hidden = false;
        status.innerHTML = '<b>This is a template, so nothing was sent.</b> On a live portfolio this form emails the owner directly. Everything you typed is still here.';
        status.focus(); return;
      }
      btn.disabled = true; var label = btn.innerHTML; btn.textContent = 'Sending…';
      fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.assign({ _form: D.form.key, _honey: f.elements._honey.value }, d, { Page: D.site.replace(/^https?:\/\//, '') + BASE + '/contact' })) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return r.ok && j.ok === true; }); })
        .catch(function () { return false; })
        .then(function (ok) {
          btn.disabled = false; btn.innerHTML = label;
          if (ok) {
            f.outerHTML = '<div class="sent" role="status" tabindex="-1"><span class="eyebrow">Enquiry sent</span><h3>Thank you, ' + esc(d.Name.split(' ')[0]) + '.</h3><p>Your message is on its way to ' + esc(D.profile.first) + ', who will reply to <b>' + esc(d.Email) + '</b>.</p><p style="margin-top:14px"><a class="btn btn--wa" href="https://wa.me/' + C.wa + '" target="_blank" rel="noopener">WhatsApp ' + esc(D.profile.first) + '</a></p></div>';
            var s = $('.sent'); if (s) s.focus();
          } else {
            status.className = 'status'; status.hidden = false;
            status.innerHTML = '<b>Your enquiry wasn’t sent.</b> Please try again, or <a href="mailto:' + C.email + '?subject=' + encodeURIComponent('Brand enquiry — ' + d.Name) + '&body=' + encodeURIComponent(body(d)) + '">email it</a> or <a href="https://wa.me/' + C.wa + '?text=' + encodeURIComponent(body(d)) + '" target="_blank" rel="noopener">send it on WhatsApp</a> instead.';
            status.focus();
          }
        });
    });
  }

  /* ---------- template mode: contact links are placeholders ---------- */
  function sampleLinks() {
    if (D.form.mode === 'send') return;
    var toast = null, timer = null;
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]'); if (!a) return;
      var h = a.getAttribute('href');
      if (!/^(mailto:|tel:|https:\/\/wa\.me|https:\/\/(www\.)?(instagram|tiktok|x)\.com)/.test(h)) return;
      e.preventDefault();
      if (!toast) { toast = document.createElement('div'); toast.setAttribute('role', 'status'); toast.style.cssText = 'position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:90;background:#1A1816;color:#fff;font-size:14px;padding:12px 16px;border-radius:8px;max-width:calc(100% - 32px);box-shadow:0 10px 30px -10px rgba(0,0,0,.4)'; document.body.appendChild(toast); }
      toast.textContent = 'Template preview: on a live portfolio this opens ' + (/^mailto/.test(h) ? 'an email' : /^tel/.test(h) ? 'a phone call' : /wa\.me/.test(h) ? 'WhatsApp' : 'the social profile') + ' with the owner’s real details.';
      toast.hidden = false; clearTimeout(timer); timer = setTimeout(function () { toast.hidden = true; }, 3200);
    });
  }

  /* ---------- boot ---------- */
  function boot() {
    header(); sampleLinks();
    var el;
    if ((el = $('[data-render="cats"]'))) cats(el);
    if ((el = $('[data-render="featured"]'))) featured(el);
    if ((el = $('[data-render="brands"]'))) brands(el);
    if ((el = $('[data-render="svcs"]'))) svcs(el);
    if ((el = $('[data-render="chips"]'))) chips(el);
    if ((el = $('[data-render="rates"]'))) rates(el, $('[data-render="rjump"]'));
    if ($('[data-chapters]')) portfolio();
    if ((el = $('form[data-enquiry]'))) form(el);
    $$('[data-group]').forEach(function (g) { group(g.getAttribute('data-group'), g.getAttribute('data-slugs').split(','), g.getAttribute('data-label')); });
    var y = $('[data-year]'); if (y) y.textContent = new Date().getFullYear();
    guard(document); reveal(document);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
