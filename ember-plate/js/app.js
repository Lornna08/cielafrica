/* ==========================================================================
   EMBER & PLATE — restaurant website template by Ciel Africa
   Reads config/site.config.js, data/menu.js and data/content.js and builds
   the page. Restaurant-specific content never lives in this file.
   ========================================================================== */
(function () {
  'use strict';
  var C = EP.config, M = EP.menu || [], CATS = EP.categories || [], D = EP.dietary || {}, K = EP.content || {};
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var sstep = function (a, b, v) { var t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  var fmt = new Intl.NumberFormat(C.currency.locale || 'en', { maximumFractionDigits: 0 });
  var money = function (n) { return (C.currency.prefix || '') + fmt.format(Math.round(n)); };
  var pic = function (src, w) { return 'img/p/' + src + '-' + (w || 800) + '.webp'; };
  var srcset = function (src) { return pic(src, 800) + ' 800w, ' + pic(src, 1600) + ' 1600w'; };
  var byId = {}; M.forEach(function (m) { byId[m.id] = m; });
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var demo = !!C.demo;

  /* ---------------- theme from config ---------------- */
  (function theme() {
    var r = document.documentElement.style, t = C.theme || {};
    Object.keys(t).forEach(function (k) { r.setProperty('--' + k, t[k]); });
    if (C.fonts) {
      r.setProperty('--display', C.fonts.display); r.setProperty('--body', C.fonts.body);
      var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = C.fonts.href; document.head.appendChild(l);
    }
    if (C.seo) { document.title = C.seo.title; var md = $('meta[name="description"]'); if (md) md.content = C.seo.description; }
    if (C.brand.favicon) { var f = $('link[rel="icon"]'); if (f) f.href = C.brand.favicon; }
  })();

  /* ---------------- icons ---------------- */
  var I = {
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 2.9 2.9 0 0 0-.9 2.2 5.1 5.1 0 0 0 1 2.7 11.7 11.7 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="1"/><path d="m3 7 9 6 9-6"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    r: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 12h15M14 6l6 6-6 6"/></svg>',
    l: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M20 12H5M10 6l-6 6 6 6"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    minus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 12h14"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h10"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="1"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>',
    ext: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>'
  };

  /* ---------------- helpers: contact, time ---------------- */
  var hasPhone = !!(C.contact.phone || '').trim();
  var tel = function (p) { return 'tel:' + String(p).replace(/[^+\d]/g, ''); };
  var waLink = function (text) { var n = String(C.whatsapp.number || '').replace(/\D/g, ''); return 'https://wa.me/' + n + '?text=' + encodeURIComponent(text); };
  var openWA = function (text) { var w = window.open(waLink(text), '_blank', 'noopener'); if (!w) location.href = waLink(text); };
  var DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'], DAYN = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };
  var ORDERED = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  var toMin = function (s) { var p = s.split(':'); return +p[0] * 60 + +p[1]; };
  var hm = function (m) { m = Math.round(m); return pad(Math.floor(m / 60) % 24) + ':' + pad(m % 60); };
  /* the restaurant's local date and time, whatever the visitor's time zone */
  function nowLocal() {
    var d = new Date(), o = {};
    try {
      new Intl.DateTimeFormat('en-GB', { timeZone: C.contact.timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short' })
        .formatToParts(d).forEach(function (p) { o[p.type] = p.value; });
    } catch (e) { o = { year: d.getFullYear(), month: pad(d.getMonth() + 1), day: pad(d.getDate()), hour: pad(d.getHours()), minute: pad(d.getMinutes()), weekday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()] }; }
    return { date: o.year + '-' + o.month + '-' + o.day, min: (+o.hour % 24) * 60 + +o.minute, day: String(o.weekday).slice(0, 3).toLowerCase() };
  }
  var dayOf = function (iso) { var p = iso.split('-'); return DAYS[new Date(+p[0], +p[1] - 1, +p[2]).getDay()]; };
  var addDays = function (iso, n) { var p = iso.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2] + n); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  var niceDate = function (iso) { var p = iso.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }); };
  var services = function (day) { return (C.contact.hours[day] || []).map(function (s) { return [toMin(s[0]), toMin(s[1]) + (s[1] === '23:59' ? 1 : 0)]; }); };
  function openNow() { var n = nowLocal(); return services(n.day).some(function (s) { return n.min >= s[0] && n.min < s[1]; }); }
  function nextOpen() {
    var n = nowLocal();
    for (var i = 0; i < 8; i++) {
      var iso = addDays(n.date, i), sv = services(dayOf(iso));
      for (var k = 0; k < sv.length; k++) if (i > 0 || sv[k][0] > n.min) return { iso: iso, min: sv[k][0], today: i === 0 };
    }
    return null;
  }
  var hoursText = function (day) { var s = C.contact.hours[day] || []; return s.length ? s.map(function (x) { return x[0] + ' – ' + (x[1] === '23:59' ? 'late' : x[1]); }).join(' · ') : 'Closed'; };

  /* ---------------- order storage (this browser only) ---------------- */
  var KEY = 'ep-order-' + (C.brand.name || '').toLowerCase().replace(/\W+/g, '-');
  var cart = (function () { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } })();
  var save = function () { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) { } paintBag(); };
  var count = function () { return cart.reduce(function (a, l) { return a + l.qty; }, 0); };
  var subtotal = function () { return cart.reduce(function (a, l) { return a + l.unit * l.qty; }, 0); };

  /* ---------------- item pricing ---------------- */
  var basePrice = function (m) { return m.sizes && m.sizes.length ? Math.min.apply(null, m.sizes.map(function (s) { return s.price; })) : m.price; };
  var fromPrice = function (m) { return (m.sizes && m.sizes.length > 1 ? 'from ' : '') + money(basePrice(m)); };
  var needsChoice = function (m) { return (m.options || []).some(function (o) { return o.required; }) || (m.sizes && m.sizes.length > 1); };
  var avail = function (m) { return m.available !== false; };
  var orderOn = !!(C.ordering && C.ordering.enabled);

  /* ======================================================================
     HEADER, MENU OVERLAY
     ====================================================================== */
  var word = function () {
    if (C.brand.logo) return '<img src="' + C.brand.logo + '" alt="' + esc(C.brand.name) + '" style="height:' + C.brand.logoHeight + 'px;width:auto">';
    var n = esc(C.brand.name).replace(/ &amp; | and /i, function (m) { return ' <i>' + m.trim() + '</i> '; });
    return '<span class="wordmark">' + n + '</span>';
  };
  $('#hdr').innerHTML =
    '<header class="hdr" id="hdrBar"><div class="wrap">' +
    '<a class="logo" href="#top" aria-label="' + esc(C.brand.name) + ', back to top">' + word() + '</a>' +
    '<nav aria-label="Main"><ul class="nav-links">' + C.nav.map(function (n) { return '<li><a href="' + n.href + '">' + esc(n.label) + '</a></li>'; }).join('') + '</ul></nav>' +
    '<div class="hdr-act"><a class="btn sm reserve-top" href="#reserve">Reserve a table</a>' +
    (orderOn ? '<button type="button" class="bag" data-bag aria-label="Your order, 0 items">' + I.bag + '<span class="t">Order</span><span class="n" data-n="0">0</span></button>' : '') +
    '<button type="button" class="burger" aria-label="Open menu" aria-expanded="false" aria-controls="ovl"><span></span><span></span></button></div>' +
    '</div></header>' +
    '<div class="menu" id="ovl" aria-hidden="true"><ol>' +
    C.nav.concat([{ label: 'Reserve', href: '#reserve' }]).map(function (n, i) { return '<li><a href="' + n.href + '" style="--i:' + i + '" tabindex="-1">' + esc(n.label) + '</a></li>'; }).join('') + '</ol>' +
    '<div class="menu-foot"><div class="row"><a class="btn solid" href="#reserve" tabindex="-1">Reserve a table</a>' + (orderOn ? '<button type="button" class="btn" data-bag tabindex="-1">' + I.bag + 'Your order</button>' : '') + '</div>' +
    '<p data-today></p></div></div>';

  /* ======================================================================
     SECTIONS
     ====================================================================== */
  var H = C.hero, RV = H.reveal && !RM ? H.reveal : null;
  var heroSrc = function (o, w) { return o.image + '-' + w + '.webp'; };
  var heroSet = function (o) { return o.widths.map(function (w) { return heroSrc(o, w) + ' ' + w + 'w'; }).join(', '); };
  function heroHTML() {
    var f = H.fire, item = RV && byId[RV.item];
    return '<section class="hero' + (RV ? ' has-b' : '') + '" id="top" aria-label="Welcome">' +
      '<div class="hero-pin"><div class="hero-stage">' +
      '<img class="still-a" src="' + heroSrc(f, 1920) + '" srcset="' + heroSet(f) + '" sizes="100vw" alt="' + esc(f.alt) + '" fetchpriority="high" style="object-position:' + f.position.wide + '">' +
      (RV ? '<img class="still-b" src="' + heroSrc(RV, 1920) + '" srcset="' + heroSet(RV) + '" sizes="100vw" alt="' + esc(RV.alt) + '" loading="lazy" style="object-position:' + RV.position.wide + '">' : '') +
      '<canvas class="hero-gl" aria-hidden="true"></canvas><canvas class="hero-sparks" aria-hidden="true"></canvas><div class="hero-shade"></div></div>' +
      '<div class="hero-copy a"><div class="wrap"><div class="inner">' +
      '<span class="kicker">' + esc(H.kicker) + '</span>' +
      '<h1>' + H.headline.map(function (l) { return '<span class="ln"><span>' + esc(l) + '</span></span>'; }).join('') + '</h1>' +
      '<p class="lead">' + esc(H.text) + '</p>' +
      '<div class="cta"><a class="btn solid" href="' + H.primary.href + '">' + esc(H.primary.label) + I.r + '</a><a class="btn" href="' + H.secondary.href + '">' + esc(H.secondary.label) + '</a></div>' +
      '</div></div></div>' +
      (RV ? '<div class="hero-copy b" aria-hidden="true"><div class="wrap"><div class="inner">' +
        '<span class="kicker">' + esc(RV.kicker) + '</span><h2 class="h-l">' + esc(RV.title) + '</h2><p class="lead">' + esc(RV.text) + '</p>' +
        (item ? '<span class="price">' + fromPrice(item) + (demo ? ' · sample price' : '') + '</span>' : '') +
        '<div class="cta">' + (item ? '<button type="button" class="btn solid" data-open="' + item.id + '" tabindex="-1">View the dish' + I.r + '</button>' : '') + '<a class="btn" href="#menu" tabindex="-1">The full menu</a></div>' +
        '</div></div></div>' : '') +
      '<div class="hero-meta" aria-hidden="true"><span>' + (RV ? '01 / 02' : '') + '</span><span class="prog"><i></i></span><a class="cue" href="#intro" tabindex="-1">Scroll</a></div>' +
      '</div></section>';
  }

  function introHTML() {
    var t = K.intro; if (!t) return '';
    var words = t.statement.split(' ').map(function (w) { return '<span class="w">' + esc(w) + '</span>'; }).join(' ');
    return '<section class="sec intro" id="intro" aria-labelledby="introT"><div class="wrap">' +
      '<span class="kicker rv">' + esc(t.kicker) + '</span><p class="stmt" id="introT">' + words + '</p>' +
      '<div class="intro-grid"><div class="intro-pics">' + t.images.map(function (im) { return '<div class="pic rv-pic"><img src="' + pic(im.src) + '" srcset="' + srcset(im.src) + '" sizes="(max-width:860px) 50vw, 30vw" alt="' + esc(im.alt) + '" loading="lazy" decoding="async" style="object-position:' + (im.pos || '50% 50%') + '"></div>'; }).join('') + '</div>' +
      '<div><ul class="facts">' + t.facts.map(function (f, i) { return '<li class="rv" style="--d:' + (i * .08) + '"><span>' + esc(f.label) + '</span><b>' + esc(f.value) + '</b></li>'; }).join('') + '</ul>' +
      '<div class="rv" style="margin-top:30px"><a class="link" href="#experience">The experience' + I.r + '</a></div></div></div>' +
      '</div></section>';
  }

  function sigHTML() {
    var S = K.signatures; if (!S || !S.items.length) return '';
    var list = S.items.filter(function (s) { return byId[s.item]; });
    return '<section class="sig' + (RM ? ' static' : '') + '" id="signatures" aria-label="' + esc(S.kicker) + '" style="height:' + (RM ? 'auto' : (list.length * 100 + 20) + 'svh') + '">' +
      '<div class="sig-pin"' + (RM ? ' style="position:relative;height:auto"' : '') + '>' +
      '<div class="sig-head"><div class="wrap"><span class="kicker">' + esc(S.kicker) + '</span><div class="sig-dots" role="tablist" aria-label="Signature dishes">' +
      list.map(function (s, i) { return '<button type="button" role="tab" aria-label="' + esc(byId[s.item].name) + '" data-go="' + i + '"><i></i></button>'; }).join('') + '</div></div></div>' +
      list.map(function (s, i) {
        var m = byId[s.item];
        return '<article class="sig-slide' + (i === 0 ? ' cur' : '') + '"' + (RM ? ' style="position:relative;height:100svh;clip-path:none"' : '') + '><div class="bg"><img src="' + pic(s.image, 1600) + '" srcset="' + srcset(s.image) + '" sizes="100vw" alt="' + esc(m.image.alt) + '" loading="' + (i ? 'lazy' : 'eager') + '" decoding="async" style="object-position:' + (s.pos || '50% 50%') + '"></div>' +
          '<div class="sig-copy"><div class="wrap"><div class="inner">' +
          '<span class="idx">' + pad(i + 1) + ' — ' + pad(list.length) + '</span>' +
          '<h3>' + esc(m.name) + '</h3>' +
          '<p class="line">' + esc(s.line) + '</p>' +
          '<p class="desc">' + esc(m.description) + '</p>' +
          '<div class="row"><span class="price">' + fromPrice(m) + '</span><button type="button" class="btn solid" data-open="' + m.id + '">' + (orderOn && avail(m) ? 'Order now' : 'View dish') + I.r + '</button></div>' +
          '</div></div></div></article>';
      }).join('') + '</div></section>';
  }

  function menuHTML() {
    var used = CATS.filter(function (c) { return M.some(function (m) { return m.category === c.id; }); });
    var diets = Object.keys(D).filter(function (k) { return k !== 'alc' && M.some(function (m) { return (m.dietary || []).indexOf(k) > -1; }); });
    return '<section class="sec menu-sec" id="menu" aria-labelledby="menuT"><div class="wrap">' +
      '<div class="sec-head"><div><span class="kicker rv">The menu</span><h2 class="h-l rv" id="menuT">Cooked over fire,<br><em>served with care.</em></h2></div>' +
      '<div class="rv"><p class="lead">Browse by course, search for a dish or filter by what you eat. ' + (orderOn ? 'Add dishes to your order for delivery or collection.' : '') + '</p></div></div>' +
      '<div class="menu-tools rv"><label class="search"><span class="sr">Search the menu</span>' + I.search + '<input type="search" id="q" placeholder="Search dishes or ingredients" autocomplete="off"><button type="button" class="clear" aria-label="Clear search">' + I.x + '</button></label>' +
      '<div class="diet" role="group" aria-label="Dietary filters">' + diets.map(function (k) { return '<button type="button" class="chip" data-diet="' + k + '" aria-pressed="false">' + esc(D[k].label) + '</button>'; }).join('') + '</div></div>' +
      '</div>' +
      '<div class="cat-bar"><div class="cat-row" role="tablist" aria-label="Menu categories">' + used.map(function (c, i) {
        var n = M.filter(function (m) { return m.category === c.id; }).length;
        return '<button type="button" class="cat" role="tab" id="tab-' + c.id + '" aria-controls="dishes" aria-selected="false" data-cat="' + c.id + '">' + esc(c.label) + '<sup>' + n + '</sup></button>';
      }).join('') + '</div></div>' +
      '<div class="wrap"><div class="menu-body"><div class="plate" aria-hidden="true"><div class="plate-frame" id="plate"></div><div class="plate-cap"><b id="plateName"></b><span id="platePrice"></span></div></div>' +
      '<div><div class="cat-intro" id="catIntro"></div><div id="dishes" role="tabpanel" aria-live="polite"></div>' +
      '<div class="menu-foot-note">' + Object.keys(D).map(function (k) { return '<span><b>' + esc(D[k].short) + '</b> ' + esc(D[k].label) + '</span>'; }).join('') +
      (demo ? '<span class="demo-note">Sample menu and prices</span>' : '') + '</div></div></div></div>' +
      '</section>';
  }

  function expHTML() {
    var E = K.experience; if (!E) return '';
    return '<section class="sec exp" id="experience" aria-labelledby="expT"><div class="wrap">' +
      '<div class="sec-head"><div><span class="kicker rv">' + esc(E.kicker) + '</span><h2 class="h-l rv" id="expT">' + esc(E.title).replace(/An evening\./, '<em>An evening.</em>') + '</h2></div></div>' +
      '<div class="exp-wrap"><div class="exp-stage"><div class="frame">' + E.chapters.map(function (c, i) { return '<img src="' + pic(c.image, 1600) + '" alt="" loading="lazy" decoding="async" class="' + (i === 0 ? 'on' : '') + '" style="object-position:' + (c.pos || '50% 50%') + '">'; }).join('') + '</div><span class="count" id="expCount">01 / ' + pad(E.chapters.length) + '</span></div>' +
      '<ol class="chapters">' + E.chapters.map(function (c, i) {
        return '<li class="chapter' + (i === 0 ? ' cur' : '') + '" data-i="' + i + '"><div class="pic pic-m rv-pic"><img src="' + pic(c.image) + '" srcset="' + srcset(c.image) + '" sizes="100vw" alt="' + esc(c.alt) + '" loading="lazy" decoding="async" style="object-position:' + (c.pos || '50% 50%') + '"></div>' +
          '<span class="n">' + pad(i + 1) + '</span><h3>' + esc(c.title) + '</h3><p>' + esc(c.text) + '</p></li>';
      }).join('') + '</ol></div></div></section>';
  }

  function chefHTML() {
    var c = K.chef; if (!c) return '';
    return '<section class="sec chef grain" id="kitchen" aria-labelledby="chefT"><div class="wrap"><div class="chef-grid">' +
      '<div class="chef-pics"><div class="pic a rv-pic"><img src="' + pic(c.image) + '" srcset="' + srcset(c.image) + '" sizes="(max-width:900px) 80vw, 40vw" alt="' + esc(c.alt) + '" loading="lazy" decoding="async" style="object-position:' + (c.pos || '50% 50%') + '"></div>' +
      (c.image2 ? '<div class="pic b rv-pic"><img src="' + pic(c.image2) + '" alt="' + esc(c.alt2) + '" loading="lazy" decoding="async" style="object-position:' + (c.pos2 || '50% 50%') + '"></div>' : '') + '</div>' +
      '<div><span class="kicker rv">' + esc(c.kicker) + '</span><blockquote class="rv" id="chefT">' + esc(c.quote) + '</blockquote>' +
      '<div class="who rv">' + (c.name ? '<b>' + esc(c.name) + '</b>' : '') + '<span>' + esc(c.role) + '</span></div>' +
      '<div class="story rv">' + c.story.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</div>' +
      '<div class="phil">' + c.philosophy.map(function (p, i) { return '<div class="rv" style="--d:' + (i * .08) + '"><b>' + esc(p.title) + '</b><p>' + esc(p.text) + '</p></div>'; }).join('') + '</div>' +
      (c.history ? '<p class="hist rv">' + esc(c.history) + '</p>' : '') + '</div>' +
      '</div></div></section>';
  }

  function galHTML() {
    var G = K.gallery; if (!G || !G.length) return '';
    return '<section class="sec gal" id="gallery" aria-labelledby="galT"><div class="wrap">' +
      '<div class="sec-head"><div><span class="kicker rv">Gallery</span><h2 class="h-l rv" id="galT">A look <em>inside.</em></h2></div><div class="rv"><p class="lead">The dishes, the room and the moments in between. Tap any photo to see it full screen.</p></div></div>' +
      '<div class="gal-grid">' + G.map(function (g, i) { return '<button type="button" class="rv ' + (g.size || '') + '" style="--d:' + ((i % 4) * .06) + '" data-lb="' + i + '" aria-label="Open photo ' + (i + 1) + ' of ' + G.length + ': ' + esc(g.alt) + '"><img src="' + pic(g.src) + '" srcset="' + srcset(g.src) + '" sizes="(max-width:760px) 50vw, ' + (g.size === 'wide' ? '50vw' : '25vw') + '" alt="" loading="lazy" decoding="async" style="object-position:' + (g.pos || '50% 50%') + '"></button>'; }).join('') + '</div>' +
      '</div></section>';
  }

  function quotesHTML() {
    var T = K.testimonials; if (!T || !T.length) return '';
    return '<section class="sec" id="reviews" aria-labelledby="revT" style="padding-top:0"><div class="wrap">' +
      '<div class="sec-head"><div><span class="kicker rv">Guests</span><h2 class="h-m rv" id="revT">What people say after dinner.</h2></div></div>' +
      '<div class="quotes">' + T.map(function (t, i) { return '<blockquote class="quote rv" style="--d:' + (i * .08) + '"><p>' + esc(t.quote) + '</p><footer><b>' + esc(t.name) + '</b>' + (t.detail ? ' · ' + esc(t.detail) : '') + (demo ? '<br><span class="sample">Sample review</span>' : '') + '</footer></blockquote>'; }).join('') + '</div>' +
      '</div></section>';
  }

  function reserveHTML() {
    var R = C.reservations;
    return '<section class="sec reserve grain" id="reserve" aria-labelledby="resT"><div class="wrap"><div class="res-grid">' +
      '<div class="res-side"><span class="kicker rv">Reservations</span><h2 class="h-l rv" id="resT">Your table <em>is waiting.</em></h2>' +
      '<p class="lead rv">Tell us when you would like to come and how many of you there will be. We reply to every request to confirm your table.</p>' +
      '<p class="pol rv">' + I.info + '<span>' + esc(R.policy) + '</span></p>' +
      '<div class="pic rv-pic"><img src="' + pic('candle-table') + '" srcset="' + srcset('candle-table') + '" sizes="35vw" alt="A candle on a dressed table in a dim dining room." loading="lazy" decoding="async" style="object-position:50% 60%"></div></div>' +
      '<div class="res-form rv" id="resBox"></div>' +
      '</div></div></section>';
  }

  function visitHTML() {
    var c = C.contact, n = nowLocal();
    var rows = ORDERED.map(function (d) { return '<tr' + (d === n.day ? ' class="today"' : '') + '><th scope="row">' + DAYN[d] + (d === n.day ? ' · today' : '') + '</th><td>' + hoursText(d) + '</td></tr>'; }).join('');
    var social = (C.social || []).filter(function (s) { return s.url; });
    return '<section class="sec visit" id="visit" aria-labelledby="visT"><div class="wrap">' +
      '<div class="sec-head"><div><span class="kicker rv">Visit</span><h2 class="h-l rv" id="visT">Find us, <em>call us,</em> come hungry.</h2></div></div>' +
      '<div class="visit-grid">' +
      '<div class="rv"><h4>Opening hours</h4><div class="live" id="live"><i></i><span></span></div><table class="hours"><tbody>' + rows + '</tbody></table>' + (c.hoursNote ? '<p style="color:var(--smoke);font-size:13.5px;margin:14px 0 0">' + esc(c.hoursNote) + '</p>' : '') + '</div>' +
      '<div class="rv" style="--d:.08"><h4>Location</h4><p class="addr">' + c.address.map(esc).join('<br>') + '</p>' +
      (c.mapUrl ? '<a class="link" href="' + esc(c.mapUrl) + '" target="_blank" rel="noopener">Get directions' + I.ext + '</a>' : '') +
      (demo ? '<p style="margin-top:14px"><span class="demo-note">Sample address</span></p>' : '') + '</div>' +
      '<div class="rv" style="--d:.16"><h4>Contact</h4><ul class="contact-list">' +
      '<li><button type="button" data-wa-general><span><small>WhatsApp</small>Message us</span>' + I.wa + '</button></li>' +
      (hasPhone ? '<li><a href="' + tel(c.phone) + '"><span><small>Phone</small>' + esc(c.phone) + '</span>' + I.phone + '</a></li>' : '') +
      (c.email ? '<li><a href="mailto:' + esc(c.email) + '"><span><small>Email</small>' + esc(c.email) + '</span>' + I.mail + '</a></li>' : '') + '</ul>' +
      (social.length ? '<div class="social">' + social.map(function (s) { return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.label) + '</a>'; }).join('') + '</div>' : '') + '</div>' +
      '</div>' +
      '<div class="map rv">' + (c.mapEmbed ? '<iframe src="' + esc(c.mapEmbed) + '" title="Map showing ' + esc(C.brand.name) + '" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>' :
        '<div class="ph"><img src="' + pic('interior', 1600) + '" alt="" loading="lazy" decoding="async"><div class="card"><b>' + esc(C.brand.name) + '</b><p>' + c.address.map(esc).join(', ') + '</p>' +
        (c.mapUrl ? '<a class="link" href="' + esc(c.mapUrl) + '" target="_blank" rel="noopener">Open in maps' + I.ext + '</a>' : '<a class="link" href="#reserve">Reserve a table' + I.r + '</a>') + '</div></div>') + '</div>' +
      '</div></section>';
  }

  function faqHTML() {
    var F = K.faq; if (!F || !F.length) return '';
    return '<section class="sec faq" id="faq" aria-labelledby="faqT" style="padding-top:0"><div class="wrap"><div class="faq-grid">' +
      '<div><span class="kicker rv">Good to know</span><h2 class="h-m rv" id="faqT" style="margin-top:20px">Questions, answered.</h2></div>' +
      '<div>' + F.map(function (f) { return '<details class="rv"><summary>' + esc(f.q) + '<i aria-hidden="true"></i></summary><div class="a"><p>' + esc(f.a) + '</p></div></details>'; }).join('') + '</div>' +
      '</div></div></section>';
  }

  function footHTML() {
    var groups = [], last = null;
    ORDERED.forEach(function (d) { var t = hoursText(d); if (last && last.t === t) last.to = d; else { last = { from: d, to: d, t: t }; groups.push(last); } });
    var ab = function (d) { return DAYN[d].slice(0, 3); };
    return '<footer class="foot"><div class="wrap">' +
      '<div class="foot-cta"><h2 class="h-l rv">Pull up a chair. <em>The fire is lit.</em></h2><div class="row rv"><a class="btn solid" href="#reserve">Reserve a table</a>' + (orderOn ? '<button type="button" class="btn" data-bag>' + I.bag + 'Order for delivery</button>' : '') + '</div></div>' +
      '<div class="foot-cols"><div><a class="logo" href="#top">' + word() + '</a><p style="margin-top:14px;max-width:34ch">' + esc(C.brand.tagline) + '.</p></div>' +
      '<div><h5>Visit</h5><p>' + C.contact.address.map(esc).join('<br>') + '</p></div>' +
      '<div><h5>Hours</h5><ul>' + groups.map(function (g) { return '<li><p>' + ab(g.from) + (g.to !== g.from ? '–' + ab(g.to) : '') + ': ' + g.t + '</p></li>'; }).join('') + '</ul></div>' +
      '<div><h5>Explore</h5><ul>' + C.nav.concat([{ label: 'Reserve', href: '#reserve' }, { label: 'FAQ', href: '#faq' }]).map(function (n) { return '<li><a href="' + n.href + '">' + esc(n.label) + '</a></li>'; }).join('') + '</ul></div></div>' +
      '<p class="foot-word" aria-hidden="true">' + esc(C.brand.name).replace(/ &amp; /, ' <i>&amp;</i> ') + '</p>' +
      '<div class="foot-base"><span>© ' + new Date().getFullYear() + ' ' + esc(C.brand.name) + (demo ? ' · sample restaurant' : '') + '</span><span>EMBER &amp; PLATE template by <a href="../index.html">Ciel Africa</a> · <a href="credits.html">Photo credits</a></span></div>' +
      '</div></footer>';
  }

  $('#main').innerHTML = heroHTML() + introHTML() + sigHTML() + menuHTML() + expHTML() + chefHTML() + galHTML() + quotesHTML() + reserveHTML() + visitHTML() + faqHTML();
  $('#ftr').innerHTML = footHTML();

  /* layers: loader, dish sheet, order drawer, lightbox, toast, mobile bar */
  $('#layers').innerHTML =
    (RM ? '' : '<div class="loader" id="loader" aria-hidden="true"><div>' + word() + '<div class="bar"><i></i></div></div></div>') +
    '<div class="layer" id="dish" role="dialog" aria-modal="true" aria-labelledby="dishT" aria-hidden="true"><div class="scrim" data-close></div><div class="sheet"></div></div>' +
    (orderOn ? '<div class="layer" id="order" role="dialog" aria-modal="true" aria-labelledby="orderT" aria-hidden="true"><div class="scrim" data-close></div><div class="drawer"></div></div>' : '') +
    '<div class="lightbox" id="lb" role="dialog" aria-modal="true" aria-label="Gallery" aria-hidden="true"><div class="lb-top"><span id="lbN"></span><button type="button" class="icon-btn" data-lbx aria-label="Close gallery">' + I.x + '</button></div><div class="lb-stage"><img alt=""></div><p class="lb-cap" id="lbCap"></p><div class="lb-nav"><button type="button" class="icon-btn" data-lbp aria-label="Previous photo">' + I.l + '</button><button type="button" class="icon-btn" data-lbn aria-label="Next photo">' + I.r + '</button></div></div>' +
    '<div class="toast" id="toast" role="status" aria-live="polite"></div>' +
    '<nav class="mbar" id="mbar" aria-label="Quick actions"><a href="#menu">' + I.menu + 'Menu</a><a href="#reserve">' + I.cal + 'Reserve</a>' + (orderOn ? '<button type="button" class="ord" data-bag>' + I.bag + 'Order <span class="n">0</span></button>' : '<button type="button" data-wa-general>' + I.wa + 'WhatsApp</button>') + '</nav>';

  /* ======================================================================
     HERO
     ====================================================================== */
  var hero = $('.hero'), heroGL = null, loader = $('#loader');
  (function initHero() {
    var gl = $('.hero-gl', hero), sp = $('.hero-sparks', hero), shown = false, t0;
    var reveal = function () {
      if (shown) return; shown = true;
      if (loader) { loader.classList.add('gone'); setTimeout(function () { loader.remove(); }, 1000); }
      t0 = performance.now();
      if (heroGL) {
        var ramp = function (now) { var k = clamp((now - t0) / 2200, 0, 1); heroGL.intro = 1 - Math.pow(1 - k, 3); if (k < 1) requestAnimationFrame(ramp); };
        requestAnimationFrame(ramp);
      }
      setTimeout(function () { hero.classList.add('in'); }, RM ? 0 : 450);
    };
    if (RM) { reveal(); return; }
    setTimeout(reveal, 3200);   // never keep anyone waiting on a slow connection
    var canGL = !!(window.WebGLRenderingContext && document.createElement('canvas').getContext('webgl'));
    var wide = window.innerWidth > 1400 || window.innerWidth * (window.devicePixelRatio || 1) > 2200 || window.innerHeight > window.innerWidth;
    var pick = function (o) { return heroSrc(o, wide ? 2560 : 1920); };
    if (canGL && EP.HeroGL) {
      heroGL = new EP.HeroGL(gl, sp, { a: pick(H.fire), b: RV ? pick(RV) : null, posA: H.fire.position, posB: RV ? RV.position : null, flames: H.fire.flames || [0, 0, 1, 1], zoom: H.fire.zoom || 1 });
      heroGL.init().then(function () {
        hero.classList.add('gl'); heroGL.start(); reveal();
        if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { heroGL.visible = es[0].isIntersecting; }).observe(hero);
        window.addEventListener('resize', function () { heroGL.resize(); });
      }).catch(function () { heroGL = null; gl.remove(); sp.remove(); var im = $('.still-a', hero); if (im.complete) reveal(); else im.onload = reveal; });
    } else { gl.remove(); sp.remove(); var im = $('.still-a', hero); if (im.complete) reveal(); else { im.onload = reveal; im.onerror = reveal; } }
  })();
  function heroScroll(y, vh) {
    if (!RV) return;
    var h = hero.offsetHeight - vh, p = clamp(y / Math.max(1, h), 0, 1);
    var mix = sstep(.1, .78, p);
    if (heroGL) heroGL.p = mix; else { var b = $('.still-b', hero); if (b) b.style.opacity = mix; }
    var A = $('.hero-copy.a', hero), B = $('.hero-copy.b', hero), oa = 1 - sstep(.03, .3, p), ob = sstep(.6, .84, p);
    A.style.opacity = oa; A.style.transform = 'translateY(' + (-40 * (1 - oa)).toFixed(1) + 'px)'; A.style.visibility = oa < .02 ? 'hidden' : 'visible';
    B.style.opacity = ob; B.style.transform = 'translateY(' + (30 * (1 - ob)).toFixed(1) + 'px)'; B.style.visibility = ob < .02 ? 'hidden' : 'visible';
    B.setAttribute('aria-hidden', ob < .5); $$('[tabindex]', B).forEach(function (e) { e.tabIndex = ob > .5 ? 0 : -1; });
    $$('.hero-copy.a [href], .hero-copy.a button', hero).forEach(function (e) { e.tabIndex = oa > .5 ? 0 : -1; });
    var meta = $('.hero-meta', hero); meta.style.setProperty('--hp', p.toFixed(3)); meta.firstChild.textContent = p > .55 ? '02 / 02' : '01 / 02';
  }

  /* ======================================================================
     INTRO STATEMENT (words light up as you read)
     ====================================================================== */
  var stmt = $('.intro .stmt'), stmtW = stmt ? $$('.w', stmt) : [];
  function litWords(vh) {
    if (!stmt || RM) return;
    var r = stmt.getBoundingClientRect(), p = clamp((vh * .85 - r.top) / (r.height + vh * .35), 0, 1), n = Math.round(p * stmtW.length);
    stmtW.forEach(function (w, i) { w.classList.toggle('lit', i < n); });
  }

  /* ======================================================================
     SIGNATURE DISHES
     ====================================================================== */
  var sig = $('.sig'), sigSlides = sig ? $$('.sig-slide', sig) : [], sigDots = sig ? $$('.sig-dots button', sig) : [], sigCur = 0;
  function sigScroll(vh) {
    if (!sig || RM) return;
    var top = sig.getBoundingClientRect().top, f = clamp(-top / vh, 0, sigSlides.length - 1 + .2), cur = 0;
    sigSlides.forEach(function (s, i) {
      var r = i === 0 ? 1 : clamp(f - (i - 1) - .1, 0, 1), e = r < 1 ? 1 - Math.pow(1 - r, 2.2) : 1;
      if (i > 0) s.style.clipPath = 'inset(' + ((1 - e) * 100).toFixed(2) + '% 0 0 0)';
      var next = sigSlides[i + 1] ? clamp(f - i - .1, 0, 1) : 0;
      $('.bg img', s).style.transform = 'scale(' + (1.12 - .12 * e + .06 * next).toFixed(4) + ') translateY(' + (-next * 4).toFixed(2) + '%)';
      if (e > .55) cur = i;
      if (sigDots[i]) sigDots[i].style.setProperty('--f', i === 0 ? 1 : e.toFixed(3));
    });
    if (cur !== sigCur) { sigSlides[sigCur].classList.remove('cur'); sigSlides[cur].classList.add('cur'); sigCur = cur; }
    sigSlides.forEach(function (s, i) { $$('button', s).forEach(function (b) { b.tabIndex = i === cur ? 0 : -1; }); });
  }
  sigDots.forEach(function (b) { b.addEventListener('click', function () { var i = +b.dataset.go, top = sig.getBoundingClientRect().top + window.scrollY; window.scrollTo({ top: top + (i === 0 ? 0 : (i - 1 + 1.05) * window.innerHeight), behavior: RM ? 'auto' : 'smooth' }); }); });

  /* ======================================================================
     MENU
     ====================================================================== */
  var dishesEl = $('#dishes'), plate = $('#plate'), usedCats = CATS.filter(function (c) { return M.some(function (m) { return m.category === c.id; }); }), state = { cat: ((EP.menuStart && usedCats.filter(function (c) { return c.id === EP.menuStart; })[0]) || usedCats[0] || {}).id, q: '', diets: [] };
  var dietTags = function (m) { return (m.dietary || []).map(function (k) { return D[k] ? '<span class="tag' + (k === 'spicy' ? ' hot' : '') + '" title="' + esc(D[k].label) + '">' + esc(D[k].label) + '</span>' : ''; }).join(''); };
  var availTag = function (m) { return m.available === false ? '<span class="tag off">Not available today</span>' : m.available === 'limited' ? '<span class="tag lim">Limited</span>' : ''; };
  function dishHTML(m, k) {
    var off = !avail(m);
    return '<li class="dish' + (off ? ' off' : '') + '" data-id="' + m.id + '" style="--k:' + k + '">' +
      '<div class="thumb"><img src="' + pic(m.image.src) + '" alt="" loading="lazy" decoding="async" style="object-position:' + (m.image.pos || '50% 50%') + '"></div>' +
      '<h4><button type="button" data-open="' + m.id + '" aria-label="' + esc(m.name) + ': details' + (orderOn ? ' and ordering' : '') + '">' + esc(m.name) + '</button>' + (m.signature ? '<span class="sigmark">Signature</span>' : '') + '</h4>' +
      '<div class="pr num">' + (m.sizes && m.sizes.length > 1 ? '<small>from</small>' : '') + money(basePrice(m)) + '</div>' +
      '<p class="desc">' + esc(m.description) + '</p>' +
      '<div class="meta">' + availTag(m) + dietTags(m) + (m.note ? '<span class="note">' + esc(m.note) + '</span>' : '') +
      (orderOn && !off ? '<span class="acts"><button type="button" class="add" data-add="' + m.id + '" aria-label="Add ' + esc(m.name) + ' to your order">' + I.plus + (needsChoice(m) ? 'Choose' : 'Add') + '</button></span>' : '') +
      '</div></li>';
  }
  function matches(m) {
    if (state.diets.length && !state.diets.every(function (d) { return (m.dietary || []).indexOf(d) > -1; })) return false;
    if (!state.q) return true;
    var hay = (m.name + ' ' + m.description + ' ' + (m.ingredients || []).join(' ') + ' ' + ((CATS.filter(function (c) { return c.id === m.category; })[0] || {}).label || '')).toLowerCase();
    return state.q.toLowerCase().split(/\s+/).every(function (w) { return hay.indexOf(w) > -1; });
  }
  function renderMenu(animate) {
    var filtering = state.q || state.diets.length, html = '', first = null, intro = $('#catIntro');
    $$('.cat').forEach(function (t) { t.setAttribute('aria-selected', !filtering && t.dataset.cat === state.cat); t.tabIndex = (!filtering && t.dataset.cat === state.cat) || (filtering && t === $('.cat')) ? 0 : -1; });
    if (filtering) {
      var hits = M.filter(matches), k = 0;
      intro.innerHTML = '<h3>' + (hits.length ? hits.length + ' dish' + (hits.length > 1 ? 'es' : '') : 'No dishes') + '</h3><p>' + (state.q ? 'Matching “' + esc(state.q) + '”' : '') + (state.diets.length ? (state.q ? ', ' : '') + state.diets.map(function (d) { return D[d].label.toLowerCase(); }).join(' and ') : '') + '</p>';
      if (!hits.length) html = '<div class="empty"><b>Nothing matches yet.</b>Try another word, or clear the filters.<div style="margin-top:18px"><button type="button" class="btn sm" data-clear>Clear search and filters</button></div></div>';
      else CATS.forEach(function (c) {
        var g = hits.filter(function (m) { return m.category === c.id; }); if (!g.length) return;
        first = first || g[0];
        html += '<div class="res-group"><h5>' + esc(c.label) + '</h5><ul class="dishes' + (animate ? ' swap' : '') + '">' + g.map(function (m) { return dishHTML(m, k++); }).join('') + '</ul></div>';
      });
    } else {
      var cat = CATS.filter(function (c) { return c.id === state.cat; })[0] || CATS[0], list = M.filter(function (m) { return m.category === cat.id; });
      first = list[0];
      intro.innerHTML = '<h3>' + esc(cat.label) + '</h3><p>' + esc(cat.blurb || '') + '</p>';
      html = '<ul class="dishes' + (animate ? ' swap' : '') + '">' + list.map(dishHTML).join('') + '</ul>';
      dishesEl.setAttribute('aria-labelledby', 'tab-' + cat.id);
    }
    dishesEl.innerHTML = html;
    if (first) showPlate(first);
  }
  var plateId = null;
  function showPlate(m) {
    if (!plate || plateId === m.id) return; plateId = m.id;
    var old = $$('img', plate), im = new Image();
    im.alt = ''; im.decoding = 'async'; im.src = pic(m.image.src, 1600); im.style.objectPosition = m.image.pos || '50% 50%';
    im.className = RM ? '' : 'enter'; plate.appendChild(im);
    var go = function () { requestAnimationFrame(function () { im.classList.remove('enter'); old.forEach(function (o) { o.classList.add('out'); setTimeout(function () { o.remove(); }, 1000); }); }); };
    if (im.complete) go(); else { im.onload = go; im.onerror = go; }
    $('#plateName').textContent = m.name; $('#platePrice').textContent = fromPrice(m);
  }
  $$('.cat').forEach(function (t) {
    t.addEventListener('click', function () {
      if (state.cat === t.dataset.cat && !state.q && !state.diets.length) return;
      state.cat = t.dataset.cat; state.q = ''; state.diets = []; $('#q').value = ''; $('.search').classList.remove('has'); $$('.chip').forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
      renderMenu(true);
      var row = $('.cat-row'); row.scrollTo({ left: t.offsetLeft - row.clientWidth / 2 + t.offsetWidth / 2, behavior: RM ? 'auto' : 'smooth' });
      var bar = $('.cat-bar'), r = bar.getBoundingClientRect(), top0 = parseFloat(getComputedStyle(bar).top) || 0;
      if (r.top > top0 + 2) return; window.scrollTo({ top: window.scrollY + $('.menu-body').getBoundingClientRect().top - top0 - bar.offsetHeight - 24, behavior: RM ? 'auto' : 'smooth' });
    });
    t.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var all = $$('.cat'), i = all.indexOf(t) + (e.key === 'ArrowRight' ? 1 : -1); i = (i + all.length) % all.length; all[i].focus(); all[i].click(); e.preventDefault();
    });
  });
  var qT; $('#q').addEventListener('input', function (e) { clearTimeout(qT); var v = e.target.value.trim(); $('.search').classList.toggle('has', !!v); qT = setTimeout(function () { state.q = v; renderMenu(true); }, 140); });
  $('.search .clear').addEventListener('click', function () { $('#q').value = ''; state.q = ''; $('.search').classList.remove('has'); renderMenu(true); $('#q').focus(); });
  $$('.chip').forEach(function (c) { c.addEventListener('click', function () { var on = c.getAttribute('aria-pressed') !== 'true'; c.setAttribute('aria-pressed', on); state.diets = $$('.chip[aria-pressed="true"]').map(function (x) { return x.dataset.diet; }); renderMenu(true); }); });
  dishesEl.addEventListener('click', function (e) {
    if (e.target.closest('[data-clear]')) { state.q = ''; state.diets = []; $('#q').value = ''; $('.search').classList.remove('has'); $$('.chip').forEach(function (c) { c.setAttribute('aria-pressed', 'false'); }); renderMenu(true); return; }
    var add = e.target.closest('[data-add]'); if (add) { quickAdd(byId[add.dataset.add], add); return; }
    var op = e.target.closest('[data-open]'); if (op) { openDish(op.dataset.open, op); return; }
    var li = e.target.closest('.dish'); if (li && !e.target.closest('button')) openDish(li.dataset.id, li);
  });
  var hov = function (e) { var li = e.target.closest && e.target.closest('.dish'); if (!li) return; $$('.dish.act').forEach(function (d) { d.classList.remove('act'); }); li.classList.add('act'); showPlate(byId[li.dataset.id]); };
  dishesEl.addEventListener('mouseover', hov); dishesEl.addEventListener('focusin', hov);
  renderMenu(false);
  (function () { var row = $('.cat-row'), t = $('.cat[data-cat="' + state.cat + '"]'); if (row && t) row.scrollLeft = t.offsetLeft - row.clientWidth / 2 + t.offsetWidth / 2; })();

  /* ======================================================================
     DISH SHEET
     ====================================================================== */
  var dishL = $('#dish'), sheet = $('.sheet', dishL), lastFocus = null, cur = null;
  function trap(layer) {
    layer.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeLayer(layer); return; }
      if (e.key !== 'Tab') return;
      var f = $$('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex="0"]', layer).filter(function (x) { return x.offsetParent !== null; });
      if (!f.length) return; var a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { z.focus(); e.preventDefault(); } else if (!e.shiftKey && document.activeElement === z) { a.focus(); e.preventDefault(); }
    });
    layer.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) closeLayer(layer); });
  }
  function openLayer(layer, focusEl) {
    lastFocus = document.activeElement; layer.classList.add('open'); layer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lock', 'layer-open');
    setTimeout(function () { (focusEl || $('button, a, input', layer)).focus({ preventScroll: true }); }, 60);
  }
  function closeLayer(layer) {
    layer.classList.remove('open'); layer.setAttribute('aria-hidden', 'true');
    if (!$$('.layer.open').length) document.body.classList.remove('lock', 'layer-open');
    if (layer === dishL && location.hash.indexOf('#dish-') === 0) history.replaceState(null, '', location.pathname + location.search);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  trap(dishL);
  function lineTotal() {
    var m = cur.m, base = m.sizes && m.sizes.length ? m.sizes[cur.size].price : m.price, extra = 0;
    (m.options || []).forEach(function (o, i) { (cur.opts[i] || []).forEach(function (j) { extra += o.choices[j].price || 0; }); });
    return base + extra;
  }
  function openDish(id, from) {
    var m = byId[id]; if (!m) return;
    cur = { m: m, size: 0, opts: (m.options || []).map(function () { return []; }), qty: 1 };
    var off = !avail(m), cat = (CATS.filter(function (c) { return c.id === m.category; })[0] || {}).label;
    var opt = function (o, i) {
      return '<fieldset class="opt" data-o="' + i + '"><legend>' + esc(o.name) + '<span>' + (o.required ? 'Required' : o.type === 'many' ? 'Optional · choose any' : 'Optional') + '</span></legend><div class="pills">' +
        o.choices.map(function (c, j) { var idn = 'o' + i + '-' + j; return '<span class="pill"><input type="' + (o.type === 'many' ? 'checkbox' : 'radio') + '" name="o' + i + '" id="' + idn + '" value="' + j + '"' + (off ? ' disabled' : '') + '><label for="' + idn + '">' + esc(c.label) + (c.price ? '<small>+' + money(c.price) + '</small>' : '') + '</label></span>'; }).join('') +
        '</div><p class="err" hidden>Please choose one.</p></fieldset>';
    };
    sheet.innerHTML = '<div class="sheet-pic"><img src="' + pic(m.image.src, 1600) + '" alt="' + esc(m.image.alt) + '" style="object-position:' + (m.image.pos || '50% 50%') + '"></div>' +
      '<div class="sheet-body"><button type="button" class="icon-btn x" data-close aria-label="Close">' + I.x + '</button><div class="sheet-scroll">' +
      '<span class="kicker">' + esc(cat || '') + (m.signature ? ' · Signature' : '') + '</span><h3 id="dishT">' + esc(m.name) + '</h3>' +
      '<p class="desc">' + esc(m.description) + '</p><div class="meta">' + availTag(m) + dietTags(m) + (m.note ? '<span class="tag">' + esc(m.note) + '</span>' : '') + (demo ? '<span class="tag">Sample price</span>' : '') + '</div>' +
      (m.ingredients && m.ingredients.length ? '<p class="ingr"><b>Ingredients</b>' + m.ingredients.map(esc).join(' · ') + '</p>' : '') +
      (m.sizes && m.sizes.length ? '<fieldset class="opt"><legend>' + (m.sizes.length > 1 ? 'Choose a size' : 'Size') + '</legend><div class="pills">' + m.sizes.map(function (s, j) { return '<span class="pill"><input type="radio" name="size" id="sz' + j + '" value="' + j + '"' + (j === 0 ? ' checked' : '') + (off ? ' disabled' : '') + '><label for="sz' + j + '">' + esc(s.label) + '<small>' + money(s.price) + '</small></label></span>'; }).join('') + '</div></fieldset>' : '') +
      (orderOn ? (m.options || []).map(opt).join('') +
        '<label class="field"><span>Notes for the kitchen <small>optional</small></span><textarea id="dNote" rows="2" maxlength="200" placeholder="Allergies, no onions, sauce on the side…"' + (off ? ' disabled' : '') + '></textarea></label>' : '') +
      '</div>' +
      '<div class="sheet-foot">' + (off ? '<span class="unavail">Not available today. Ask us about it on WhatsApp.</span><button type="button" class="btn sm wa" data-wa-dish="' + m.id + '">' + I.wa + 'Ask</button>' :
        orderOn ? '<div class="qty" aria-label="Quantity"><button type="button" data-q="-1" aria-label="One less">' + I.minus + '</button><output id="dQty">1</output><button type="button" data-q="1" aria-label="One more">' + I.plus + '</button></div>' +
          '<button type="button" class="btn solid" id="dAdd">Add · <span class="num" id="dTot"></span></button>' :
          '<span class="num" style="flex:1;font-size:18px;color:var(--copper)">' + fromPrice(m) + '</span><a class="btn solid" href="#reserve" data-close>Reserve a table</a>') + '</div></div>';
    var upd = function () { var t = $('#dTot', sheet); if (t) t.textContent = money(lineTotal() * cur.qty); };
    sheet.onchange = function (e) {
      var t = e.target;
      if (t.name === 'size') cur.size = +t.value;
      else if (t.name && t.name.charAt(0) === 'o') { var i = +t.name.slice(1); cur.opts[i] = $$('input[name="o' + i + '"]:checked', sheet).map(function (x) { return +x.value; }); var fs = t.closest('.opt'); fs.querySelector('.err').hidden = true; }
      upd();
    };
    sheet.onclick = function (e) {
      var q = e.target.closest('[data-q]'); if (q) { cur.qty = clamp(cur.qty + +q.dataset.q, 1, 30); $('#dQty', sheet).textContent = cur.qty; upd(); return; }
      if (e.target.closest('#dAdd')) {
        var miss = (cur.m.options || []).map(function (o, i) { return o.required && !cur.opts[i].length ? i : -1; }).filter(function (i) { return i > -1; });
        if (miss.length) { miss.forEach(function (i) { var fs = $('.opt[data-o="' + i + '"]', sheet); fs.querySelector('.err').hidden = false; }); var f0 = $('.opt[data-o="' + miss[0] + '"]', sheet); f0.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' }); $('input', f0).focus({ preventScroll: true }); return; }
        addLine(cur.m, cur.size, cur.opts, cur.qty, ($('#dNote', sheet) || {}).value || '');
        closeLayer(dishL);
      }
      var w = e.target.closest('[data-wa-dish]'); if (w) openWA(C.whatsapp.general + ' Is the ' + cur.m.name + ' available?');
    };
    upd();
    if (location.hash !== '#dish-' + id) history.replaceState(null, '', '#dish-' + id);
    openLayer(dishL, $('.x', sheet));
  }

  /* ======================================================================
     ORDER
     ====================================================================== */
  function addLine(m, size, opts, qty, note) {
    var sz = m.sizes && m.sizes.length ? m.sizes[size] : null, labels = [], extra = 0;
    (m.options || []).forEach(function (o, i) { (opts[i] || []).forEach(function (j) { labels.push(o.choices[j].label); extra += o.choices[j].price || 0; }); });
    var unit = (sz ? sz.price : m.price) + extra, key = [m.id, sz ? sz.label : '', labels.join('|'), note].join('~');
    var ex = cart.filter(function (l) { return l.key === key; })[0];
    if (ex) ex.qty += qty; else cart.push({ key: key, id: m.id, name: m.name, size: sz ? sz.label : '', opts: labels, note: note, unit: unit, qty: qty, img: m.image.src });
    save(); toast(I.check + '<span>' + esc(m.name) + ' added to your order</span>');
    $$('.bag').forEach(function (b) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); });
  }
  function quickAdd(m, btn) {
    if (needsChoice(m)) { openDish(m.id, btn); return; }
    addLine(m, 0, (m.options || []).map(function () { return []; }), 1, '');
    if (btn) { btn.classList.add('done'); btn.innerHTML = I.check + 'Added'; setTimeout(function () { btn.classList.remove('done'); btn.innerHTML = I.plus + 'Add'; }, 1600); }
  }
  function paintBag() {
    var n = count();
    $$('.bag .n, .mbar .n').forEach(function (e) { e.textContent = n; e.setAttribute('data-n', n); });
    $$('.bag').forEach(function (b) { b.setAttribute('aria-label', 'Your order, ' + n + ' item' + (n === 1 ? '' : 's')); });
    if (orderL && orderL.classList.contains('open') && ostep === 'bag') renderOrder();
  }
  var orderL = $('#order'), drawer = orderL && $('.drawer', orderL), ostep = 'bag', ofill = null, odata = {};
  var DL = C.delivery || {};
  if (orderL) trap(orderL);
  ofill = DL.delivery ? 'delivery' : 'collection';
  var fee = function () { if (ofill !== 'delivery') return 0; var z = (DL.zones || [])[odata.zone]; return z ? z.fee : 0; };
  var modes = function () {
    var o = C.ordering, all = o.modes || ['whatsapp'];
    return all.filter(function (m) { return m !== 'payment' || (o.payment && o.payment.checkoutEndpoint) || demo; });
  };
  function orderTimes() {
    var n = nowLocal(), lead = (C.ordering.leadMinutes || 30), out = [];
    services(n.day).forEach(function (s) { for (var t = Math.ceil((Math.max(s[0], n.min + lead)) / 15) * 15; t <= s[1] - 15; t += 15) out.push(t); });
    return out;
  }
  function renderOrder() {
    if (!drawer) return;
    var lines = cart.map(function (l, i) {
      return '<div class="line-item"><div class="ph"><img src="' + pic(l.img) + '" alt="" loading="lazy"></div><b>' + esc(l.name) + '</b><span class="lp num">' + money(l.unit * l.qty) + '</span>' +
        '<p class="lo">' + [l.size].concat(l.opts).filter(Boolean).map(esc).join(' · ') + (l.note ? '<br><i>“' + esc(l.note) + '”</i>' : '') + '</p>' +
        '<div class="lr"><div class="qty sm" aria-label="Quantity of ' + esc(l.name) + '"><button type="button" data-lq="' + i + '" data-d="-1" aria-label="One less">' + I.minus + '</button><output>' + l.qty + '</output><button type="button" data-lq="' + i + '" data-d="1" aria-label="One more">' + I.plus + '</button></div><button type="button" class="rm" data-rm="' + i + '">Remove</button></div></div>';
    }).join('');
    var sub = subtotal(), steps = '<div class="steps"><span' + (ostep === 'bag' ? '><b>1 Order</b>' : '>1 Order') + '</span><span>·</span><span>' + (ostep === 'details' ? '<b>2 Details</b>' : '2 Details') + '</span></div>';
    var head = '<div class="drawer-head"><div><h3 id="orderT">' + (ostep === 'done' ? 'Thank you' : 'Your order') + '</h3>' + (ostep !== 'done' ? steps : '') + '</div><button type="button" class="icon-btn" data-close aria-label="Close your order">' + I.x + '</button></div>';
    if (ostep === 'done') { drawer.innerHTML = head + '<div class="drawer-body">' + odata.done + '</div>'; return; }
    if (!cart.length) {
      drawer.innerHTML = head + '<div class="drawer-body"><div class="empty-bag"><b>Nothing here yet.</b><p>Browse the menu and add the dishes you would like delivered or ready for collection.</p><a class="btn solid" href="#menu" data-close>See the menu</a></div></div>';
      return;
    }
    var both = DL.delivery && DL.collection, seg = both ? '<div class="seg" role="group" aria-label="Delivery or collection"><button type="button" data-fill="delivery" aria-pressed="' + (ofill === 'delivery') + '">Delivery</button><button type="button" data-fill="collection" aria-pressed="' + (ofill === 'collection') + '">Collection</button></div>' : '';
    var minWarn = ofill === 'delivery' && DL.minimum && sub < DL.minimum;
    var totals = '<div class="totals"><div><span>Subtotal</span><span class="num">' + money(sub) + '</span></div>' +
      (ofill === 'delivery' ? '<div><span>Delivery' + (odata.zone != null && DL.zones[odata.zone] ? ' · ' + esc(DL.zones[odata.zone].label) : '') + '</span><span class="num">' + (odata.zone != null && DL.zones[odata.zone] ? money(fee()) : 'chosen at the next step') + '</span></div>' : '') +
      '<div class="grand"><span>Estimated total</span><span class="num">' + money(sub + fee()) + '</span></div>' +
      '<small style="color:var(--smoke)">' + esc(C.ordering.note || '') + (demo ? ' Sample prices.' : '') + '</small></div>';
    if (ostep === 'bag') {
      drawer.innerHTML = head + '<div class="drawer-body">' + seg + lines + '</div><div class="drawer-foot">' + totals +
        (minWarn ? '<div class="notice">' + I.info + '<span>Delivery starts from <b>' + money(DL.minimum) + '</b>. Add a little more, or choose collection.</span></div>' : '') +
        '<button type="button" class="btn solid" style="width:100%" data-next' + (minWarn ? ' disabled' : '') + '>Continue to details' + I.r + '</button></div>';
      return;
    }
    /* details */
    var ms = modes(), times = orderTimes(), pay = C.ordering.payment || {}, payOk = !!pay.checkoutEndpoint;
    if (!odata.method || ms.indexOf(odata.method) < 0 || (odata.method === 'payment' && !payOk)) odata.method = ms.filter(function (m) { return m !== 'payment' || payOk; })[0] || 'whatsapp';
    var nx = nextOpen();
    var mdesc = {
      whatsapp: ['Send on WhatsApp', 'Your order opens in WhatsApp, ready to send. We reply to confirm.'],
      request: ['Send an order request', C.ordering.endpoint ? 'We receive your order and call or message you to confirm it.' : 'Your email app opens with the order, ready to send. We reply to confirm.'],
      payment: ['Pay online' + (pay.provider ? ' with ' + esc(pay.provider) : ''), payOk ? 'You are taken to a secure payment page. Your order is confirmed once payment goes through.' : 'Not connected in this template preview. A restaurant connects its own payment provider to switch this on.']
    };
    drawer.innerHTML = head + '<div class="drawer-body"><form id="oForm" novalidate>' +
      (demo ? '<div class="notice">' + I.info + '<span><b>Template preview.</b> Orders from this page do not reach a real restaurant. WhatsApp opens without a set chat, and requests go to a sample email address.</span></div>' : '') +
      seg +
      '<label class="field"><span>Your name</span><input name="name" autocomplete="name" required value="' + esc(odata.name || '') + '"><em class="msg"></em></label>' +
      '<label class="field"><span>Phone number</span><input name="phone" type="tel" autocomplete="tel" inputmode="tel" required value="' + esc(odata.phone || '') + '"><em class="msg"></em></label>' +
      '<label class="field"><span>Email <small>optional</small></span><input name="email" type="email" autocomplete="email" value="' + esc(odata.email || '') + '"><em class="msg"></em></label>' +
      (ofill === 'delivery' ? '<label class="field"><span>Delivery area</span><select name="zone" required><option value="">Choose your area</option>' + (DL.zones || []).map(function (z, i) { return '<option value="' + i + '"' + (+odata.zone === i && odata.zone !== '' && odata.zone != null ? ' selected' : '') + '>' + esc(z.label) + ' · ' + money(z.fee) + '</option>'; }).join('') + '</select><em class="msg"></em></label>' +
        '<label class="field"><span>Delivery address</span><textarea name="address" rows="2" autocomplete="street-address" required placeholder="Building, street, floor or house number, landmark">' + esc(odata.address || '') + '</textarea><em class="msg"></em></label>' : '') +
      '<label class="field"><span>' + (ofill === 'delivery' ? 'Deliver' : 'Ready for collection') + '</span><select name="when">' +
      (openNow() && times.length ? '<option value="asap">As soon as possible</option>' : '') + times.map(function (t) { return '<option value="' + hm(t) + '"' + (odata.when === hm(t) ? ' selected' : '') + '>Today at ' + hm(t) + '</option>'; }).join('') +
      (!times.length ? '<option value="next">' + (nx ? 'Next opening: ' + (nx.today ? 'today' : niceDate(nx.iso)) + ' at ' + hm(nx.min) : 'When you next open') + '</option>' : '') + '</select><em class="msg"></em></label>' +
      '<label class="field"><span>Notes <small>optional</small></span><textarea name="notes" rows="2" maxlength="300" placeholder="Allergies, gate code, cutlery…">' + esc(odata.notes || '') + '</textarea></label>' +
      '<fieldset class="opt" style="margin-bottom:6px"><legend>How would you like to send it?</legend><div class="methods">' +
      ms.map(function (k) { var off = k === 'payment' && !payOk; return '<label class="method' + (off ? ' off' : '') + '"><input type="radio" name="method" value="' + k + '"' + (odata.method === k ? ' checked' : '') + (off ? ' disabled' : '') + '><b>' + mdesc[k][0] + '</b><span>' + mdesc[k][1] + '</span></label>'; }).join('') +
      '</div></fieldset><p class="msg" id="oErr" role="alert" style="color:#F09A6E;font-size:14px"></p></form></div>' +
      '<div class="drawer-foot">' + totals + '<div style="display:flex;gap:10px"><button type="button" class="btn" data-back>' + I.l + '<span class="sr">Back to your order</span></button><button type="submit" form="oForm" class="btn solid" style="flex:1" id="oSend">' + sendLabel() + '</button></div></div>';
    var f = $('#oForm', drawer);
    f.addEventListener('input', function (e) { odata[e.target.name] = e.target.value; var fl = e.target.closest('.field'); if (fl) fl.classList.remove('bad'); });
    f.addEventListener('change', function (e) { odata[e.target.name] = e.target.value; if (e.target.name === 'zone' || e.target.name === 'method') { var s = drawer.querySelector('.drawer-body').scrollTop; renderOrder(); drawer.querySelector('.drawer-body').scrollTop = s; } });
    f.addEventListener('submit', function (e) { e.preventDefault(); submitOrder(f); });
  }
  var sendLabel = function () { return { whatsapp: 'Send on WhatsApp', request: 'Send order request', payment: 'Continue to payment' }[odata.method] || 'Send'; };
  function validate(form) {
    var ok = true;
    $$('[required]', form).forEach(function (el) {
      var v = el.value.trim(), fl = el.closest('.field'), msg = '';
      if (!v) msg = 'Please fill this in.';
      else if (el.type === 'tel' && v.replace(/\D/g, '').length < 9) msg = 'Please enter a phone number we can reach you on.';
      else if (el.name === 'name' && v.length < 2) msg = 'Please enter your name.';
      if (fl) { fl.classList.toggle('bad', !!msg); var m = fl.querySelector('.msg'); if (m) m.textContent = msg; }
      if (msg && ok) { ok = false; el.focus(); }
    });
    var em = $('[name="email"]', form);
    if (em && em.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.value.trim())) { var fl = em.closest('.field'); fl.classList.add('bad'); fl.querySelector('.msg').textContent = 'Please check this email address.'; if (ok) em.focus(); ok = false; }
    return ok;
  }
  function orderText() {
    var o = odata, z = DL.zones && DL.zones[o.zone];
    var when = o.when === 'asap' || !o.when ? 'As soon as possible' : o.when === 'next' ? 'At the next opening' : 'Today at ' + o.when;
    return [C.whatsapp.orderIntro, ''].concat(cart.map(function (l) { return '• ' + l.qty + ' × ' + l.name + (l.size ? ' (' + l.size + ')' : '') + (l.opts.length ? ' — ' + l.opts.join(', ') : '') + (l.note ? ' — note: ' + l.note : '') + ' — ' + money(l.unit * l.qty); }))
      .concat(['', 'Subtotal: ' + money(subtotal()), ofill === 'delivery' ? 'Delivery: ' + (z ? z.label + ', ' + money(z.fee) : '') : 'Collection', 'Estimated total: ' + money(subtotal() + fee()), '',
        (ofill === 'delivery' ? 'Deliver to: ' + (o.address || '') : 'Collection'), 'When: ' + when, 'Name: ' + (o.name || ''), 'Phone: ' + (o.phone || '')])
      .concat(o.email ? ['Email: ' + o.email] : []).concat(o.notes ? ['Notes: ' + o.notes] : []).join('\n');
  }
  var doneHTML = function (title, lines, extra) { return '<div class="result"><div class="seal">' + I.check + '</div><h4>' + title + '</h4>' + lines.map(function (l) { return '<p>' + l + '</p>'; }).join('') + (extra || '') + '</div>'; };
  function submitOrder(form) {
    if (!validate(form)) return;
    var err = $('#oErr', drawer), btn = $('#oSend', drawer); err.textContent = '';
    var payload = { type: 'order', restaurant: C.brand.name, fulfilment: ofill, items: cart.map(function (l) { return { name: l.name, size: l.size, options: l.opts, note: l.note, qty: l.qty, unitPrice: l.unit }; }), subtotal: subtotal(), deliveryFee: fee(), total: subtotal() + fee(), customer: { name: odata.name, phone: odata.phone, email: odata.email || '' }, address: odata.address || '', when: odata.when || 'asap', notes: odata.notes || '', summary: orderText() };
    var m = odata.method;
    if (m === 'whatsapp') {
      openWA(orderText());
      odata.done = doneHTML('Your order is ready in WhatsApp.', ['Send the message to place it. ' + esc(C.brand.name) + ' replies to confirm your order' + (ofill === 'delivery' ? ', the delivery fee' : '') + ' and the time.', 'Nothing is charged on this website.'], '<button type="button" class="btn" data-reopen-wa>Open WhatsApp again</button><br><button type="button" class="btn ghost" data-clear-order>Start a new order</button>');
      ostep = 'done'; renderOrder(); return;
    }
    if (m === 'request') {
      var ep = C.ordering.endpoint;
      if (!ep) {
        location.href = 'mailto:' + C.contact.email + '?subject=' + encodeURIComponent('Order request: ' + odata.name) + '&body=' + encodeURIComponent(orderText());
        odata.done = doneHTML('Your email is ready to send.', ['Your email app opened with the order filled in. Send it and ' + esc(C.brand.name) + ' will reply to confirm.', 'This is not a confirmation yet.'], '<button type="button" class="btn ghost" data-clear-order>Start a new order</button>');
        ostep = 'done'; renderOrder(); return;
      }
      btn.disabled = true; btn.textContent = 'Sending…';
      fetch(ep, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) })
        .then(function (r) { if (!r.ok) throw new Error(r.status); cart = []; save(); odata.done = doneHTML('Order request received.', ['Thank you, ' + esc(odata.name) + '. This is not a confirmation yet: we will call or message you on ' + esc(odata.phone) + ' to confirm your order' + (ofill === 'delivery' ? ' and delivery fee' : '') + '.'], '<a class="btn" href="#menu" data-close>Back to the menu</a>'); ostep = 'done'; renderOrder(); })
        .catch(function () { btn.disabled = false; btn.textContent = sendLabel(); err.innerHTML = 'Your request could not be sent. Please try again, or send it on WhatsApp instead.'; });
      return;
    }
    if (m === 'payment') {
      var pe = (C.ordering.payment || {}).checkoutEndpoint; if (!pe) return;
      btn.disabled = true; btn.textContent = 'Opening secure payment…';
      fetch(pe, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (j) { if (!j || !j.url) throw new Error('no url'); location.href = j.url; })
        .catch(function () { btn.disabled = false; btn.textContent = sendLabel(); err.textContent = 'Payment could not be started. Nothing was charged. Please try again, or choose another way to send your order.'; });
    }
  }
  if (drawer) drawer.addEventListener('click', function (e) {
    var t = e.target;
    var lq = t.closest('[data-lq]'); if (lq) { var l = cart[+lq.dataset.lq]; l.qty = clamp(l.qty + +lq.dataset.d, 0, 30); if (!l.qty) cart.splice(+lq.dataset.lq, 1); save(); return; }
    var rm = t.closest('[data-rm]'); if (rm) { cart.splice(+rm.dataset.rm, 1); save(); return; }
    var fl = t.closest('[data-fill]'); if (fl) { ofill = fl.dataset.fill; renderOrder(); return; }
    if (t.closest('[data-next]')) { ostep = 'details'; renderOrder(); var b = $('.drawer-body', drawer); b.scrollTop = 0; setTimeout(function () { var n = $('[name="name"]', drawer); if (n) n.focus({ preventScroll: true }); }, 50); return; }
    if (t.closest('[data-back]')) { ostep = 'bag'; renderOrder(); return; }
    if (t.closest('[data-reopen-wa]')) { openWA(orderText()); return; }
    if (t.closest('[data-clear-order]')) { cart = []; save(); ostep = 'bag'; odata = { name: odata.name, phone: odata.phone, email: odata.email }; renderOrder(); return; }
  });
  function openOrder() { if (!orderL) return; if (ostep === 'done') ostep = 'bag'; renderOrder(); openLayer(orderL, $('.drawer-head .icon-btn', drawer)); }
  paintBag();

  /* ======================================================================
     RESERVATIONS
     ====================================================================== */
  var R = C.reservations, rbox = $('#resBox'), rdata = { guests: 2 };
  function slots(iso) {
    var n = nowLocal(), today = iso === n.date, out = [];
    services(dayOf(iso)).forEach(function (s) { for (var t = s[0]; t <= s[1] - (R.lastSeatingBeforeClose || 60); t += (R.slotMinutes || 30)) if (!today || t >= n.min + 60) out.push(t); });
    return out;
  }
  function firstDate() { var n = nowLocal(); for (var i = 0; i < 14; i++) { var iso = addDays(n.date, i); if (slots(iso).length) return iso; } return n.date; }
  function renderRes() {
    var n = nowLocal(); rdata.date = rdata.date || firstDate();
    var sl = slots(rdata.date), g = [1, 2, 3, 4, 5, 6, 7, 8].filter(function (x) { return x <= R.maxGuests; }), more = R.maxGuests > 8;
    if (rdata.time && sl.indexOf(toMin(rdata.time)) < 0) rdata.time = '';
    var closed = !(C.contact.hours[dayOf(rdata.date)] || []).length;
    var methodBtn = { request: 'Send reservation request', whatsapp: 'Book on WhatsApp', link: 'Continue to booking' }[R.method] || 'Send reservation request';
    rbox.innerHTML = '<h3>Book a table</h3><p>' + (R.method === 'link' && R.bookingUrl ? 'Choose your details, then finish your booking on our reservations page.' : 'Send us your request and we will confirm your table by phone or email.') + '</p>' +
      (demo ? '<div class="notice">' + I.info + '<span><b>Template preview.</b> Requests from this page do not reach a real restaurant.</span></div>' : '') +
      '<form id="rForm" novalidate>' +
      '<div class="grid2"><label class="field"><span>Date</span><input type="date" name="date" required min="' + n.date + '" max="' + addDays(n.date, 120) + '" value="' + rdata.date + '"><em class="msg"></em></label>' +
      '<label class="field"><span>Occasion <small>optional</small></span><select name="occasion"><option value="">None</option>' + R.occasions.map(function (o) { return '<option' + (rdata.occasion === o ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select></label></div>' +
      '<fieldset class="opt field" id="tSet"><legend>Time<span>' + niceDate(rdata.date) + '</span></legend>' +
      (sl.length ? '<div class="times">' + sl.map(function (t) { var v = hm(t); return '<span class="pill"><input type="radio" name="time" id="t' + t + '" value="' + v + '"' + (rdata.time === v ? ' checked' : '') + '><label for="t' + t + '">' + v + '</label></span>'; }).join('') + '</div>'
        : '<p class="times-empty">' + (closed ? 'We are closed on ' + DAYN[dayOf(rdata.date)] + 's. Please choose another date.' : 'No more tables can be booked for today. Please choose another date.') + '</p>') +
      '<em class="msg" style="display:block;margin-top:8px"></em></fieldset>' +
      '<fieldset class="opt field"><legend>Guests' + (rdata.guests > 8 ? '<span>' + rdata.guests + ' guests</span>' : '') + '</legend><div class="guests">' + g.map(function (x) { return '<span class="pill"><input type="radio" name="guests" id="g' + x + '" value="' + x + '"' + (rdata.guests === x ? ' checked' : '') + '><label for="g' + x + '">' + x + '</label></span>'; }).join('') +
      (more ? '<span class="pill"><input type="radio" name="guests" id="gm" value="more"' + (rdata.guests > 8 ? ' checked' : '') + '><label for="gm">9+</label></span>' : '') + '</div>' +
      (rdata.guests > 8 ? '<label class="field" style="margin:14px 0 0"><span>How many guests?</span><input type="number" name="guestsN" min="9" max="' + R.maxGuests + '" value="' + rdata.guests + '" inputmode="numeric"></label><p style="color:var(--smoke);font-size:13.5px;margin:10px 0 0">' + esc(R.largeGroupText) + '</p>' : '') + '</fieldset>' +
      '<div class="grid2"><label class="field"><span>Your name</span><input name="name" autocomplete="name" required value="' + esc(rdata.name || '') + '"><em class="msg"></em></label>' +
      '<label class="field"><span>Phone number</span><input name="phone" type="tel" inputmode="tel" autocomplete="tel" required value="' + esc(rdata.phone || '') + '"><em class="msg"></em></label></div>' +
      '<label class="field"><span>Email <small>optional</small></span><input name="email" type="email" autocomplete="email" value="' + esc(rdata.email || '') + '"><em class="msg"></em></label>' +
      '<label class="field"><span>Special requests <small>optional</small></span><textarea name="requests" rows="3" maxlength="400" placeholder="A quiet table, a high chair, allergies, a birthday cake…">' + esc(rdata.requests || '') + '</textarea></label>' +
      '<p class="msg" id="rErr" role="alert" style="color:#F09A6E;font-size:14px;margin:0 0 10px"></p>' +
      '<div class="res-acts"><button type="submit" class="btn solid" id="rSend">' + methodBtn + '</button>' +
      (R.alsoWhatsApp && R.method !== 'whatsapp' ? '<button type="button" class="btn wa" data-rwa>' + I.wa + 'Book on WhatsApp</button>' : '') + '</div>' +
      '</form>';
    var f = $('#rForm', rbox);
    f.addEventListener('input', function (e) { var t = e.target; if (t.name === 'guestsN') rdata.guests = clamp(+t.value || 9, 9, R.maxGuests); else if (t.name && t.type !== 'radio' && t.name !== 'date') rdata[t.name] = t.value; var fl = t.closest('.field'); if (fl) fl.classList.remove('bad'); });
    f.addEventListener('change', function (e) {
      var t = e.target;
      if (t.name === 'date') { if (t.value) { rdata.date = t.value < n.date ? n.date : t.value; renderRes(); var d = $('[name="date"]', rbox); d.focus({ preventScroll: true }); } return; }
      if (t.name === 'time') { rdata.time = t.value; var ts = $('#tSet', rbox); ts.classList.remove('bad'); ts.querySelector('.msg').textContent = ''; }
      if (t.name === 'guests') { rdata.guests = t.value === 'more' ? Math.max(9, rdata.guests > 8 ? rdata.guests : 9) : +t.value; if (t.value === 'more' || $('[name="guestsN"]', rbox)) { renderRes(); var gi = $('[name="guestsN"]', rbox) || $('#g' + rdata.guests, rbox); if (gi) gi.focus({ preventScroll: true }); } }
      if (t.name === 'occasion') rdata.occasion = t.value;
    });
    f.addEventListener('submit', function (e) { e.preventDefault(); sendRes(R.method); });
    var rw = $('[data-rwa]', rbox); if (rw) rw.addEventListener('click', function () { sendRes('whatsapp'); });
  }
  function resText() {
    var d = rdata;
    return [C.whatsapp.bookingIntro, '', 'Date: ' + niceDate(d.date), 'Time: ' + d.time, 'Guests: ' + d.guests, 'Name: ' + d.name, 'Phone: ' + d.phone].concat(d.email ? ['Email: ' + d.email] : []).concat(d.occasion ? ['Occasion: ' + d.occasion] : []).concat(d.requests ? ['Requests: ' + d.requests] : []).join('\n');
  }
  function sendRes(method) {
    var f = $('#rForm', rbox), ok = validate(f), ts = $('#tSet', rbox);
    if (!rdata.time) { ts.classList.add('bad'); ts.querySelector('.msg').textContent = $('.times', ts) ? 'Please choose a time.' : 'Please choose a date with free tables.'; if (ok) { var fi = $('input[name="time"]', ts); (fi || $('[name="date"]', f)).focus(); } ok = false; }
    if (!ok) return;
    var done = function (title, lines, extra) { rbox.innerHTML = doneHTML(title, lines, (extra || '') + '<br><button type="button" class="btn ghost" data-rnew>Make another request</button>'); $('[data-rnew]', rbox).addEventListener('click', function () { rdata = { guests: 2, name: rdata.name, phone: rdata.phone, email: rdata.email }; renderRes(); }); var w = $('[data-rwa2]', rbox); if (w) w.addEventListener('click', function () { openWA(resText()); }); rbox.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' }); };
    var summary = rdata.guests + ' guest' + (rdata.guests > 1 ? 's' : '') + ', ' + niceDate(rdata.date) + ' at ' + rdata.time;
    if (method === 'whatsapp') { openWA(resText()); done('Your booking message is ready.', ['We opened WhatsApp with your request: ' + esc(summary) + '. Send it, and we reply to confirm your table.', 'Your table is not confirmed until we reply.'], '<button type="button" class="btn" data-rwa2>Open WhatsApp again</button>'); return; }
    if (method === 'link' && R.bookingUrl) { var u = R.bookingUrl + (R.bookingUrl.indexOf('?') > -1 ? '&' : '?') + 'date=' + rdata.date + '&time=' + encodeURIComponent(rdata.time) + '&party=' + rdata.guests; window.open(u, '_blank', 'noopener'); done('Finish your booking.', ['We opened our booking page in a new tab with ' + esc(summary) + '. Your table is confirmed there.'], '<a class="btn" href="' + esc(u) + '" target="_blank" rel="noopener">Open the booking page</a>'); return; }
    if (!R.endpoint) {
      location.href = 'mailto:' + C.contact.email + '?subject=' + encodeURIComponent('Table request: ' + summary) + '&body=' + encodeURIComponent(resText());
      done('Your email is ready to send.', ['Your email app opened with your request for ' + esc(summary) + '. Send it and we reply to confirm.', 'Your table is not confirmed until we reply.']); return;
    }
    var btn = $('#rSend', rbox), err = $('#rErr', rbox); btn.disabled = true; btn.textContent = 'Sending…'; err.textContent = '';
    fetch(R.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ type: 'reservation', restaurant: C.brand.name, date: rdata.date, time: rdata.time, guests: rdata.guests, name: rdata.name, phone: rdata.phone, email: rdata.email || '', occasion: rdata.occasion || '', requests: rdata.requests || '', summary: resText() }) })
      .then(function (r) { if (!r.ok) throw new Error(r.status); done('Request received.', ['Thank you, ' + esc(rdata.name) + '. We have your request for ' + esc(summary) + '.', 'This is not a confirmation yet: we will call or message you on ' + esc(rdata.phone) + ' to confirm your table.']); })
      .catch(function () { btn.disabled = false; btn.textContent = 'Send reservation request'; err.textContent = 'Your request could not be sent. Please try again, or book on WhatsApp.'; });
  }
  renderRes();

  /* ======================================================================
     GALLERY LIGHTBOX
     ====================================================================== */
  var lb = $('#lb'), G = K.gallery || [], gi = 0, lbImg = $('.lb-stage img', lb), lbLast;
  function lbShow(i, dir) {
    gi = (i + G.length) % G.length; var g = G[gi];
    lbImg.classList.add('out');
    var im = new Image(); im.src = pic(g.src, 1600);
    var go = function () { lbImg.src = im.src; lbImg.alt = g.alt; lbImg.classList.remove('out'); };
    if (im.complete) setTimeout(go, 120); else im.onload = go;
    $('#lbN').textContent = pad(gi + 1) + ' / ' + pad(G.length); $('#lbCap').textContent = g.alt;
  }
  function lbOpen(i) { lbLast = document.activeElement; lbShow(i); lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false'); document.body.classList.add('lock', 'layer-open'); setTimeout(function () { $('[data-lbx]', lb).focus(); }, 50); }
  function lbClose() { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); if (!$$('.layer.open').length) document.body.classList.remove('lock', 'layer-open'); if (lbLast) lbLast.focus({ preventScroll: true }); }
  $$('[data-lb]').forEach(function (b) { b.addEventListener('click', function () { lbOpen(+b.dataset.lb); }); });
  $('[data-lbx]', lb).addEventListener('click', lbClose); $('[data-lbn]', lb).addEventListener('click', function () { lbShow(gi + 1); }); $('[data-lbp]', lb).addEventListener('click', function () { lbShow(gi - 1); });
  lb.addEventListener('keydown', function (e) { if (e.key === 'Escape') lbClose(); else if (e.key === 'ArrowRight') lbShow(gi + 1); else if (e.key === 'ArrowLeft') lbShow(gi - 1); else if (e.key === 'Tab') { var f = $$('button', lb), a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { z.focus(); e.preventDefault(); } else if (!e.shiftKey && document.activeElement === z) { a.focus(); e.preventDefault(); } } });
  var sx = null; $('.lb-stage', lb).addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
  $('.lb-stage', lb).addEventListener('touchend', function (e) { if (sx == null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) lbShow(gi + (dx < 0 ? 1 : -1)); sx = null; });
  $('.lb-stage', lb).addEventListener('click', function (e) { if (e.target === e.currentTarget) lbClose(); });

  /* ======================================================================
     GLOBAL CLICKS, MENU OVERLAY, TOAST
     ====================================================================== */
  var ovl = $('#ovl'), burger = $('.burger');
  function setMenu(open) {
    ovl.classList.toggle('open', open); ovl.setAttribute('aria-hidden', !open); burger.setAttribute('aria-expanded', open); burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    $$('a, button', ovl).forEach(function (a) { a.tabIndex = open ? 0 : -1; }); document.body.classList.toggle('lock', open);
    if (open) { var n = nowLocal(); $('[data-today]', ovl).textContent = 'Today: ' + hoursText(n.day) + ' · ' + C.contact.address.join(', '); setTimeout(function () { $('a', ovl).focus({ preventScroll: true }); }, 300); }
  }
  burger.addEventListener('click', function () { setMenu(!ovl.classList.contains('open')); });
  ovl.addEventListener('click', function (e) { if (e.target.closest('a, button')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && ovl.classList.contains('open')) { setMenu(false); burger.focus(); } });
  document.addEventListener('click', function (e) {
    var t = e.target;
    var b = t.closest('[data-bag]'); if (b) { e.preventDefault(); if (ovl.classList.contains('open')) setMenu(false); openOrder(); return; }
    var o = t.closest('[data-open]'); if (o && !t.closest('#dishes')) { openDish(o.dataset.open, o); return; }
    if (t.closest('[data-wa-general]')) { openWA(C.whatsapp.general); return; }
    var a = t.closest('a[href^="#"]');
    if (a && a.getAttribute('href').length > 1) {
      var layer = a.closest('.layer'); if (layer) closeLayer(layer);
      var target = document.getElementById(a.getAttribute('href').slice(1));
      if (target) { e.preventDefault(); var y = target === hero ? 0 : target.getBoundingClientRect().top + window.scrollY - ((target.id === 'menu' || target.classList.contains('sec')) ? 0 : 0); window.scrollTo({ top: Math.max(0, y), behavior: RM ? 'auto' : 'smooth' }); history.replaceState(null, '', a.getAttribute('href')); setTimeout(function () { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }, RM ? 0 : 700); }
    }
  });
  var tT; function toast(html) { var t = $('#toast'); t.innerHTML = html; t.classList.add('on'); clearTimeout(tT); tT = setTimeout(function () { t.classList.remove('on'); }, 2400); }

  /* ======================================================================
     EXPERIENCE CHAPTERS
     ====================================================================== */
  var chapters = $$('.chapter'), expImgs = $$('.exp-stage .frame img'), expCur = 0;
  function setChapter(i) {
    if (i === expCur) return;
    chapters[expCur].classList.remove('cur'); chapters[i].classList.add('cur');
    expImgs.forEach(function (im, k) { im.classList.remove('was'); if (k !== i) { if (k === expCur) { im.classList.add('was'); im.classList.remove('on'); } else im.classList.remove('on'); } });
    var nx = expImgs[i]; nx.style.zIndex = 2; expImgs[expCur].style.zIndex = 1; expImgs.forEach(function (im, k) { if (k !== i && k !== expCur) im.style.zIndex = 0; });
    requestAnimationFrame(function () { nx.classList.add('on'); });
    expCur = i; var c = $('#expCount'); if (c) c.textContent = pad(i + 1) + ' / ' + pad(chapters.length);
  }

  /* ======================================================================
     SCROLL: header, hero, words, signatures, chapters, mobile bar
     ====================================================================== */
  var hdr = $('#hdrBar'), mbar = $('#mbar'), lastY = window.scrollY, ticking = false, typing = false;
  var stripH = function () { var s = $('.cstrip'); return s ? s.offsetHeight : 0; };
  function onScroll() {
    ticking = false;
    var y = window.scrollY, vh = window.innerHeight, sh = stripH();
    document.documentElement.style.setProperty('--strip', Math.max(0, sh - y) + 'px');
    hdr.classList.toggle('solid', y > sh + 20);
    var heroEnd = hero.offsetHeight - vh * .5, dy = y - lastY;
    if (y > heroEnd + vh && dy > 6 && !ovl.classList.contains('open')) { hdr.classList.add('away'); document.body.classList.add('hdr-away'); }
    else if (dy < -6 || y < heroEnd) { hdr.classList.remove('away'); document.body.classList.remove('hdr-away'); }
    lastY = y;
    heroScroll(Math.max(0, y - sh), vh); litWords(vh); sigScroll(vh);
    if (chapters.length && window.innerWidth > 900) { var best = expCur; chapters.forEach(function (c, i) { var r = c.getBoundingClientRect(); if (r.top < vh * .55 && r.bottom > vh * .45) best = i; }); setChapter(best); }
    var barOn = y > hero.offsetHeight - vh * .6 && !typing;
    mbar.classList.toggle('on', barOn); document.body.classList.toggle('bar-on', y > hero.offsetHeight - vh * .6);
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener('resize', onScroll);
  document.addEventListener('focusin', function (e) { if (e.target.matches('input:not([type=radio]):not([type=checkbox]), textarea, select')) { typing = true; document.body.classList.add('typing'); } });
  document.addEventListener('focusout', function () { setTimeout(function () { var a = document.activeElement; typing = !!(a && a.matches && a.matches('input:not([type=radio]):not([type=checkbox]), textarea, select')); document.body.classList.toggle('typing', typing); }, 80); });
  onScroll();

  /* nav state */
  if ('IntersectionObserver' in window) {
    var links = $$('.nav-links a');
    var nio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) links.forEach(function (a) { a.setAttribute('aria-current', a.getAttribute('href') === '#' + e.target.id ? 'true' : 'false'); }); }); }, { rootMargin: '-45% 0px -54% 0px' });
    $$('main > section').forEach(function (s) { nio.observe(s); });
    /* reveals */
    var rio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('on'); rio.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    $$('.rv, .rv-pic').forEach(function (el) { rio.observe(el); });
  } else $$('.rv, .rv-pic').forEach(function (el) { el.classList.add('on'); });

  /* open-now badge */
  (function live() {
    var el = $('#live'); if (!el) return;
    var on = openNow(), nx = nextOpen(), n = nowLocal();
    var close = (services(n.day).filter(function (s) { return n.min >= s[0] && n.min < s[1]; })[0] || [])[1];
    el.classList.toggle('open', on);
    $('span', el).textContent = on ? 'Open now · until ' + (close >= 1440 ? 'late' : hm(close)) : 'Closed now' + (nx ? ' · opens ' + (nx.today ? 'today' : DAYN[dayOf(nx.iso)]) + ' at ' + hm(nx.min) : '');
  })();

  /* deep link to a dish: #dish-<id> */
  if (location.hash.indexOf('#dish-') === 0 && byId[location.hash.slice(6)]) setTimeout(function () { openDish(location.hash.slice(6)); }, 400);
})();
