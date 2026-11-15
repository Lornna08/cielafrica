/* ==========================================================================
   ABALI HOSPITAL — the page. Builds every section from config/site.config.js
   and data/content.js, then wires up the motion and the interactions.
   No frameworks, no animation libraries.
   ========================================================================== */
(function () {
  'use strict';
  var C = AB.config, D = AB.content, sample = !!C.sample;
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var em = function (s) { return esc(s).replace(/\*([^*]+)\*/g, '<em>$1</em>'); };
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pic = function (n, alt, sizes, cls) { return '<img class="' + (cls || '') + '" src="img/p/' + n + '-800.webp" srcset="img/p/' + n + '-800.webp 800w, img/p/' + n + '-1600.webp 1600w" sizes="' + (sizes || '50vw') + '" alt="' + esc(alt || '') + '" loading="lazy" decoding="async">'; };
  var deptById = {}; D.departments.forEach(function (d) { deptById[d.id] = d; });
  var tag = function (t) { return sample ? '<span class="sample">' + esc(t || 'Sample') + '</span>' : ''; };

  /* theme and fonts from the settings */
  var root = document.documentElement.style;
  Object.keys(C.theme).forEach(function (k) { root.setProperty('--' + k, C.theme[k]); });
  root.setProperty('--f-display', C.fonts.display); root.setProperty('--f-body', C.fonts.body);
  if (C.fonts.href && !document.querySelector('link[href="' + C.fonts.href + '"]')) { var lk = document.createElement('link'); lk.rel = 'stylesheet'; lk.href = C.fonts.href; document.head.appendChild(lk); }
  document.title = C.seo.title;

  var I = {
    arrow: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M9 7h8v8"/></svg>',
    right: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    left: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
    close: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    phone: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    pin: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    clock: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    pulse: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l2-5 4 10 2-5h6"/></svg>',
    wa: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 20.5 5 16a8.5 8.5 0 1 1 3.2 3.1z"/><path d="M9 9.5c.4 2 2 3.6 4 4l1.2-1.2 2 .9-.3 1.6c-3.3.4-7.4-3.7-7-7l1.6-.3.9 2z"/></svg>'
  };
  var MARK = '<svg class="mark" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="12" fill="var(--forest)"/><path d="M14 8c0 8 12 8 12 16s-12 8-12 16" fill="none" stroke="var(--pollen)" stroke-width="2.6" stroke-linecap="round"/><path d="M26 8c0 8-12 8-12 16" fill="none" stroke="#7FB77A" stroke-width="2.6" stroke-linecap="round" opacity=".9"/><path d="M15.6 13h8.8M15.6 27h8.8" stroke="#7FB77A" stroke-width="2" stroke-linecap="round" opacity=".7"/></svg>';
  var logo = function () { return C.brand.logo ? '<img src="' + esc(C.brand.logo) + '" alt="' + esc(C.brand.name) + '" height="36">' : MARK + '<span class="wm"><b>' + esc(C.brand.short) + '</b><small>Hospital</small></span>'; };

  /* ---------- header and mobile menu ---------- */
  function header() {
    return '<header class="hdr" id="hdr"><div class="hdr-in">' +
      '<a class="logo" href="#top" aria-label="' + esc(C.brand.name) + ', home">' + logo() + '</a>' +
      '<nav class="pill" aria-label="Main">' + C.nav.map(function (n) { return '<a href="' + n.href + '">' + esc(n.label) + '</a>'; }).join('') + '</nav>' +
      '<a class="btn btn--dark book" href="#book"><span>Book<span class="lg"> an appointment</span></span><i class="dot">' + I.arrow + '</i></a>' +
      '<button class="menu-b" type="button" aria-expanded="false" aria-controls="mm"><span class="bars"><i></i><i></i></span><span class="sr">Menu</span></button></div></header>' +
      '<div class="mm" id="mm" role="dialog" aria-modal="true" aria-label="Menu" hidden><div class="mm-in" tabindex="-1">' +
      '<nav aria-label="Menu">' + C.nav.map(function (n, i) { return '<a href="' + n.href + '" style="--i:' + i + '"><span>0' + (i + 1) + '</span>' + esc(n.label) + '</a>'; }).join('') + '</nav>' +
      '<div class="mm-foot"><a class="btn btn--pollen" href="#book">Book an appointment<i class="dot">' + I.arrow + '</i></a>' +
      (C.contact.emergency ? '<a class="mm-em" href="tel:' + esc(C.contact.emergency.replace(/\s/g, '')) + '">' + I.pulse + 'Emergency: ' + esc(C.contact.emergency) + '</a>' : '<p class="mm-em">' + I.pulse + esc(C.contact.emergencyNote) + '</p>') + '</div></div></div>';
  }

  /* ---------- A. hero ---------- */
  function hero() {
    var h = C.hero;
    return '<section class="hero" id="top" aria-labelledby="hh"><div class="hero-bg" aria-hidden="true"></div>' +
      '<canvas class="hx" aria-hidden="true"></canvas>' +
      '<div class="hero-in wrap"><p class="kicker hi" style="--d:.15s">' + esc(h.kicker) + '</p>' +
      '<h1 class="h1" id="hh">' + h.headline.map(function (l, i) { return '<span class="l"><span style="--d:' + (0.25 + i * 0.12) + 's">' + em(l) + '</span></span>'; }).join(' ') + '</h1>' +
      '<p class="lead hi" style="--d:.85s">' + esc(h.text) + '</p>' +
      '<div class="ctas hi" style="--d:1s"><a class="btn btn--dark" href="' + h.primary.href + '">' + esc(h.primary.label) + '<i class="dot">' + I.arrow + '</i></a><a class="btn btn--line" href="' + h.secondary.href + '">' + esc(h.secondary.label) + '</a></div>' +
      '<div class="hero-meta hi" style="--d:1.15s"><span>' + I.pulse + esc(C.contact.emergencyNote) + '</span><span class="opn" data-open></span></div></div>' +
      '<div class="chips" aria-label="Popular services">' + h.chips.map(function (c, i) { return '<a class="chip hi" style="--d:' + (1.25 + i * 0.1) + 's" href="' + c.href + '" data-dept="' + esc(c.dept || '') + '"><i></i>' + esc(c.label) + '</a>'; }).join('') + '</div>' +
      '<a class="cue hi" style="--d:1.5s" href="#about"><span>Scroll</span><i></i></a></section>';
  }

  /* ---------- B. introduction ---------- */
  function intro() {
    var t = D.intro;
    var st = em(t.statement).replace(/\[img:([a-z0-9-]+)\]/g, function (_, n) { return '<span class="inl" data-rv>' + pic(n, '', '160px') + '</span>'; });
    return '<section class="intro sec" id="about"><div class="wrap">' +
      '<p class="kicker" data-rv>' + esc(t.kicker) + '</p><p class="stmt" data-rv>' + st + '</p>' +
      '<div class="intro-g"><figure class="intro-fig" data-rv><div class="par" data-par="0.08">' + pic('consult', 'A doctor and a nurse reviewing a patient’s notes together', '(max-width:900px) 100vw, 40vw') + '</div><figcaption><b>Your care team, by name.</b> Every patient has a named doctor and nurse.</figcaption></figure>' +
      '<div class="intro-t"><p class="big" data-rv>' + esc(t.text) + '</p><div class="pillars">' + t.pillars.map(function (p, i) { return '<div class="pl" data-rv style="--d:' + i * 0.08 + 's"><span class="n">0' + (i + 1) + '</span><h3>' + esc(p.title) + '</h3><p>' + esc(p.text) + '</p></div>'; }).join('') + '</div></div></div></div></section>';
  }

  /* ---------- C. services ---------- */
  function services() {
    var d0 = D.departments[0];
    return '<section class="svc sec" id="services"><div class="wrap"><div class="sec-h"><div><p class="kicker" data-rv>Our services</p><h2 class="h2" data-rv>Everything your care needs, <em>under one roof.</em></h2></div>' +
      '<p class="sec-p" data-rv>Nine departments that share one record, one laboratory and one imaging suite, so a referral is a walk down the corridor, not a new start.</p></div>' +
      '<div class="svc-g"><ol class="svc-l" role="list">' + D.departments.map(function (d, i) {
        return '<li class="sv' + (i === 0 ? ' on' : '') + '" data-id="' + d.id + '" data-rv style="--d:' + i * 0.04 + 's"><button type="button" class="sv-b" aria-expanded="' + (i === 0) + '" aria-controls="sv-' + d.id + '"><span class="n">' + String(i + 1).padStart(2, '0') + '</span><span class="t">' + esc(d.name) + '</span><span class="px" aria-hidden="true"></span></button>' +
          '<div class="sv-x" id="sv-' + d.id + '"><div class="sv-xi"><p>' + esc(d.short) + '</p><ul>' + d.tags.map(function (t) { return '<li>' + I.check + esc(t) + '</li>'; }).join('') + '</ul>' +
          '<div class="sv-img">' + pic(d.img, d.name, '(max-width:900px) 100vw, 1px') + '</div><a class="lnk" href="#book" data-book="' + d.id + '">Book in ' + esc(d.name) + I.right + '</a></div></div></li>';
      }).join('') + '</ol>' +
      '<div class="svc-m" aria-hidden="true"><div class="svc-mi">' + D.departments.map(function (d, i) { return '<div class="svc-p' + (i === 0 ? ' on' : '') + '" data-id="' + d.id + '">' + pic(d.img, '', '(max-width:900px) 1px, 42vw') + '</div>'; }).join('') +
      '<div class="svc-cap"><span class="n" data-cap-n>01</span><b data-cap-t>' + esc(d0.name) + '</b><a class="btn btn--pollen btn--sm" href="#book" data-cap-b data-book="' + d0.id + '" tabindex="-1">Book<i class="dot">' + I.arrow + '</i></a></div></div></div></div></div></section>';
  }

  /* ---------- D. why Abali ---------- */
  function why() {
    var w = D.why;
    return '<section class="why sec" id="why"><div class="wrap"><div class="sec-h"><div><p class="kicker" data-rv>' + esc(w.kicker) + '</p><h2 class="h2" data-rv>' + em(w.title) + '</h2></div></div>' +
      '<div class="bento">' + w.items.map(function (it, i) {
        return '<article class="bx bx--' + (it.size || (it.img ? 'img' : it.tone)) + '" data-rv style="--d:' + i * 0.08 + 's">' + (it.img ? '<div class="bx-img par-wrap"><div class="par" data-par="0.06">' + pic(it.img, '', '(max-width:900px) 100vw, 50vw') + '</div></div>' : '<svg class="bx-art" viewBox="0 0 200 200" aria-hidden="true"><path d="M60 10c0 40 80 40 80 90s-80 50-80 90" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M140 10c0 40-80 40-80 90s80 50 80 90" fill="none" stroke="currentColor" stroke-width="1.4" opacity=".55"/></svg>') +
          '<div class="bx-t"><span class="n">0' + (i + 1) + '</span><h3>' + esc(it.title) + '</h3><p>' + esc(it.text) + '</p></div></article>';
      }).join('') + '</div></div></section>';
  }

  /* ---------- E. specialists ---------- */
  function specialists() {
    return '<section class="docs sec" id="specialists"><div class="wrap"><div class="docs-row">' +
      '<div class="docs-intro" data-rv><p class="kicker">Our specialists</p><h2 class="h2">The doctors you’ll <em>actually see.</em></h2><p>Meet the people behind your care. Open a profile to see clinic days and book directly.</p>' +
      '<div class="docs-nav"><button type="button" class="rb" data-dn="-1" aria-label="Previous specialists">' + I.left + '</button><button type="button" class="rb" data-dn="1" aria-label="More specialists">' + I.right + '</button></div>' + tag('Sample profiles') + '</div>' +
      '<div class="docs-track" tabindex="0" aria-label="Specialists">' + D.specialists.map(function (s, i) {
        return '<article class="doc" data-rv style="--d:' + i * 0.08 + 's"><button type="button" class="doc-b" data-doc="' + s.id + '" aria-label="View profile: ' + esc(s.name) + '"><div class="doc-img">' + pic(s.img, s.name, '(max-width:700px) 70vw, 300px') + '</div>' +
          '<div class="doc-t"><b>' + esc(s.name) + '</b><span>' + esc(s.role) + '</span><i class="dot">' + I.arrow + '</i></div></button></article>';
      }).join('') + '</div></div></div></section>';
  }
  function profile(s) {
    var d = $('#drawer'); d.innerHTML = '<div class="dw-bg" data-x></div><div class="dw" role="dialog" aria-modal="true" aria-labelledby="dwh"><button type="button" class="dw-x" data-x aria-label="Close">' + I.close + '</button>' +
      '<div class="dw-img">' + pic(s.img, s.name, '(max-width:700px) 100vw, 480px') + '</div><div class="dw-t">' + tag('Sample profile') + '<p class="kicker">' + esc(s.role) + '</p><h3 id="dwh">' + esc(s.name) + '</h3><p>' + esc(s.bio) + '</p>' +
      '<dl><dt>Clinic days</dt><dd>' + esc(s.days) + '</dd><dt>Languages</dt><dd>' + esc(s.languages) + '</dd><dt>Department</dt><dd>' + esc((deptById[s.dept] || {}).name || '') + '</dd></dl>' +
      '<a class="btn btn--dark" href="#book" data-book="' + s.dept + '" data-doc-pick="' + s.id + '">Book with ' + esc(s.name.split(' ').slice(0, 2).join(' ')) + '<i class="dot">' + I.arrow + '</i></a></div></div>';
    openLayer(d);
  }

  /* ---------- F. figures ---------- */
  function stats() {
    return '<section class="stats" aria-label="Abali in figures"><div class="wrap"><div class="st-g">' + D.stats.map(function (s, i) {
      return '<div class="st" data-rv style="--d:' + i * 0.08 + 's"><b><span data-count="' + s.value + '">0</span>' + esc(s.suffix) + '</b><span>' + esc(s.label) + '</span></div>';
    }).join('') + '</div>' + (sample ? '<p class="st-note"><span class="sample">Example figures</span> These numbers are placeholders for the template. Replace them with your own verified figures.</p>' : '') + '</div></section>';
  }

  /* ---------- G. patient information ---------- */
  function patients() {
    return '<section class="pat sec" id="patients"><div class="wrap"><div class="sec-h"><div><p class="kicker" data-rv>Patient information</p><h2 class="h2" data-rv>Your visit, <em>step by step.</em></h2></div><p class="sec-p" data-rv>What happens from the moment you book to the follow-up call, so there are no surprises on the day.</p></div>' +
      '<ol class="jr" data-jr>' + D.journey.map(function (j, i) { return '<li data-rv style="--d:' + i * 0.1 + 's"><span class="jr-d"><i>' + (i + 1) + '</i></span><h3>' + esc(j.title) + '</h3><p>' + esc(j.text) + '</p></li>'; }).join('') + '<span class="jr-line" aria-hidden="true"><i></i></span></ol>' +
      '<div class="pat-g"><div class="bring" data-rv><h3>What to bring</h3><ul>' + D.bring.map(function (b) { return '<li>' + I.check + esc(b) + '</li>'; }).join('') + '</ul><h3>Insurance and payment</h3><p>' + esc(D.insurance) + '</p></div>' +
      '<div class="fac">' + D.facilities.map(function (f, i) { return '<figure class="fc" data-rv style="--d:' + i * 0.08 + 's">' + pic(f.img, f.title, '(max-width:700px) 50vw, 22vw') + '<figcaption>' + esc(f.title) + '</figcaption></figure>'; }).join('') + '</div></div></div></section>';
  }

  /* ---------- H. booking ---------- */
  function booking() {
    var b = C.booking, live = !!b.endpoint;
    return '<section class="bk sec" id="book"><div class="wrap"><div class="bk-g">' +
      '<div class="bk-l" data-rv><p class="kicker">Appointments</p><h2 class="h2">Book an <em>appointment.</em></h2><p>Tell us what you need and when suits you. Our team will call or text to confirm the time with you.</p>' +
      '<ol class="bk-steps"><li><b>1</b>Send your request</li><li><b>2</b>We call to confirm</li><li><b>3</b>See your specialist</li></ol>' +
      '<p class="bk-em">' + I.pulse + '<span>' + esc(b.note) + '</span></p></div>' +
      '<form class="bk-f" id="bkf" novalidate data-rv>' + (live ? '' : '<p class="notice"><b>Live template.</b> This form checks your details but does not send them anywhere yet. Connect a booking endpoint in <code>config/site.config.js</code> to receive requests.</p>') +
      '<div class="f2">' + fld('name', 'Full name', '<input id="f-name" name="name" autocomplete="name" required>') + fld('phone', 'Phone number', '<input id="f-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="+254 7XX XXX XXX" required>') + '</div>' +
      fld('email', 'Email', '<input id="f-email" name="email" type="email" autocomplete="email" required>') +
      '<div class="f2">' + fld('dept', 'Department', '<select id="f-dept" name="dept" required><option value="">Choose a department</option>' + D.departments.map(function (d) { return '<option value="' + d.id + '">' + esc(d.name) + '</option>'; }).join('') + '</select>') +
      fld('doctor', 'Preferred doctor <small>optional</small>', '<select id="f-doctor" name="doctor"><option value="">No preference</option></select>') + '</div>' +
      '<div class="f2">' + fld('date', 'Preferred date', '<input id="f-date" name="date" type="date" required>') + fld('time', 'Preferred time', '<select id="f-time" name="time" required disabled><option value="">Pick a date first</option></select>') + '</div>' +
      fld('msg', 'Anything we should know? <small>optional</small>', '<textarea id="f-msg" name="message" rows="3" maxlength="800" placeholder="Symptoms, questions, or a referral you have"></textarea>') +
      '<label class="ck"><input type="checkbox" id="f-ok" required><span>I agree to be contacted about this request.</span></label><p class="err" id="e-ok"></p>' +
      '<button class="btn btn--dark btn--wide" type="submit">Request appointment<i class="dot">' + I.arrow + '</i></button>' +
      '<p class="small">We use your details only to arrange this appointment.</p></form></div></div></section>';
  }
  function fld(k, label, ctl) { return '<label class="fld" for="f-' + k + '"><span>' + label + '</span>' + ctl + '<p class="err" id="e-' + k + '"></p></label>'; }

  /* ---------- I. reviews ---------- */
  function reviews() {
    return '<section class="rv sec" aria-labelledby="rvh"><div class="wrap"><div class="rv-in"><p class="kicker" id="rvh">Patient stories</p><div class="rv-q" aria-live="polite">' + D.reviews.map(function (r, i) {
      return '<figure class="q' + (i === 0 ? ' on' : '') + '" data-q="' + i + '"><blockquote>“' + esc(r.quote) + '”</blockquote><figcaption><b>' + esc(r.name) + '</b><span>' + esc(r.meta) + '</span>' + tag('Sample review') + '</figcaption></figure>';
    }).join('') + '</div><div class="rv-nav"><button type="button" class="rb" data-rn="-1" aria-label="Previous review">' + I.left + '</button><span class="rv-c"><b data-rc>1</b> / ' + D.reviews.length + '</span><button type="button" class="rb" data-rn="1" aria-label="Next review">' + I.right + '</button></div></div></div></section>';
  }

  /* ---------- J. contact and location ---------- */
  var DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'], DN = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };
  function contact() {
    var c = C.contact, row = function (ic, label, val, href) { return '<li><span class="ic">' + ic + '</span><div><small>' + label + '</small>' + (val ? (href ? '<a href="' + href + '">' + esc(val) + '</a>' : '<b>' + esc(val) + '</b>') : '<b class="ph">Add in config</b>') + '</div></li>'; };
    var map = c.mapEmbed ? '<iframe title="Map" src="' + esc(c.mapEmbed) + '" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>' :
      '<div class="map-ph"><svg viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="600" height="400" fill="var(--sage)"/><g fill="none" stroke="#fff" stroke-linecap="round"><path d="M-20 300C120 260 200 330 330 280S520 150 640 190" stroke-width="18" opacity=".9"/><path d="M80-20C110 90 60 200 120 420" stroke-width="10" opacity=".8"/><path d="M380-20c-20 120 40 220 10 440" stroke-width="12" opacity=".8"/><path d="M-20 120c160 30 360-40 640 10" stroke-width="7" opacity=".7"/><path d="M200 420c30-90 150-140 260-120" stroke-width="5" opacity=".7"/></g><g fill="#B9D2C2" opacity=".8"><rect x="150" y="40" width="70" height="50" rx="8"/><rect x="430" y="60" width="90" height="60" rx="8"/><rect x="180" y="320" width="80" height="50" rx="8"/><rect x="470" y="290" width="70" height="70" rx="8"/></g></svg>' +
      '<span class="map-pin"><i></i>' + MARK + '</span><p class="map-note">' + (sample ? 'Map placeholder: add your Google Maps embed in config.' : '') + '</p></div>';
    return '<section class="ct sec" id="contact"><div class="wrap"><div class="sec-h"><div><p class="kicker" data-rv>Contact and location</p><h2 class="h2" data-rv>Find us, <em>call us,</em> or simply walk in.</h2></div></div>' +
      '<div class="ct-g"><div class="ct-c" data-rv><ul class="ct-l">' + row(I.pin, 'Address', c.address.join(', ')) + row(I.phone, 'Reception', c.phone, c.phone ? 'tel:' + c.phone.replace(/\s/g, '') : '') + row(I.pulse, 'Emergency line', c.emergency, c.emergency ? 'tel:' + c.emergency.replace(/\s/g, '') : '') + row(I.mail, 'Email', c.email, 'mailto:' + c.email) +
      (c.whatsapp ? row(I.wa, 'WhatsApp', '+' + c.whatsapp, 'https://wa.me/' + c.whatsapp) : '') + '</ul>' +
      '<div class="hrs"><h3>' + I.clock + 'Outpatient hours <span class="opn" data-open></span></h3><table>' + ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(function (k) { var h = c.hours[k] || []; return '<tr data-day="' + k + '"><th>' + DN[k] + '</th><td>' + (h.length ? h.map(function (x) { return x[0] + ' – ' + x[1]; }).join(', ') : 'Closed') + '</td></tr>'; }).join('') + '</table><p class="small">' + esc(c.hoursNote) + ' ' + esc(c.emergencyNote) + '</p></div>' +
      (c.mapUrl ? '<a class="btn btn--line" href="' + esc(c.mapUrl) + '" target="_blank" rel="noopener">Get directions<i class="dot">' + I.arrow + '</i></a>' : '') + '</div>' +
      '<div class="map" data-rv>' + map + '</div></div></div></section>';
  }

  /* ---------- K. footer ---------- */
  function footer() {
    var socials = C.social.filter(function (s) { return s.url; });
    return '<footer class="ft"><div class="wrap"><div class="ft-top"><p class="ft-h">Medicine that starts with <em>understanding you.</em></p><a class="btn btn--pollen" href="#book">Book an appointment<i class="dot">' + I.arrow + '</i></a></div>' +
      '<div class="ft-g"><div><a class="logo logo--lt" href="#top">' + logo() + '</a><p class="small">' + esc(C.contact.address.join(', ')) + '</p><p class="small">' + esc(C.contact.emergencyNote) + '</p></div>' +
      '<nav aria-label="Hospital"><h4>Hospital</h4>' + C.nav.map(function (n) { return '<a href="' + n.href + '">' + esc(n.label) + '</a>'; }).join('') + '</nav>' +
      '<nav aria-label="Departments"><h4>Departments</h4>' + D.departments.slice(0, 6).map(function (d) { return '<a href="#services" data-dept="' + d.id + '">' + esc(d.name) + '</a>'; }).join('') + '</nav>' +
      '<div><h4>Contact</h4>' + (C.contact.phone ? '<a href="tel:' + C.contact.phone.replace(/\s/g, '') + '">' + esc(C.contact.phone) + '</a>' : '') + '<a href="mailto:' + esc(C.contact.email) + '">' + esc(C.contact.email) + '</a>' +
      '<div class="soc">' + (socials.length ? socials.map(function (s) { return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.label) + '</a>'; }).join('') : C.social.map(function (s) { return '<span title="Add the link in config">' + esc(s.label) + '</span>'; }).join('')) + '</div></div></div>' +
      '<div class="ft-b"><span>© ' + new Date().getFullYear() + ' ' + esc(C.brand.name) + (sample ? ' · sample hospital, sample content' : '') + '</span><span><a href="credits.html">Photo credits</a> · Website by <a href="../index.html">Ciel Africa</a></span></div>' +
      '<p class="ft-wm" aria-hidden="true">' + esc(C.brand.short) + '</p></div></footer>';
  }

  /* ---------- build ---------- */
  $('#app').innerHTML = header() + '<main id="main">' + hero() + intro() + services() + why() + specialists() + stats() + patients() + booking() + reviews() + contact() + '</main>' + footer() + '<div id="drawer" class="layer" hidden></div><div class="toast" id="toast" role="status" aria-live="polite"></div>';

  /* ---------- layers (menu, profile): focus kept inside, Escape closes ---------- */
  var lastFocus = null;
  function openLayer(el) {
    lastFocus = document.activeElement; el.hidden = false; void el.offsetWidth; document.documentElement.classList.add('locked');   // the reflow lets the opening transition run
    requestAnimationFrame(function () { el.classList.add('open'); var f = el.querySelector('[tabindex="-1"]') || el.querySelector('a, button'); if (f) f.focus({ preventScroll: true }); });
  }
  function closeLayer(el) {
    el.classList.remove('open'); document.documentElement.classList.remove('locked');
    setTimeout(function () { el.hidden = true; }, RM ? 0 : 380); if (lastFocus) lastFocus.focus();
  }
  document.addEventListener('keydown', function (e) {
    var open = $$('.layer.open, .mm.open')[0]; if (!open) return;
    if (e.key === 'Escape') { if (open.id === 'mm') toggleMenu(false); else closeLayer(open); }
    if (e.key === 'Tab') { var f = $$('a[href], button, input, select, textarea', open).filter(function (x) { return x.offsetParent; }); if (!f.length) return; var a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { z.focus(); e.preventDefault(); } else if (!e.shiftKey && document.activeElement === z) { a.focus(); e.preventDefault(); } }
  });
  $('#drawer').addEventListener('click', function (e) { if (e.target.closest('[data-x]')) closeLayer($('#drawer')); if (e.target.closest('[data-book]')) closeLayer($('#drawer')); });

  var mm = $('#mm'), mb = $('.menu-b');
  function toggleMenu(on) {
    mb.setAttribute('aria-expanded', on); document.documentElement.classList.toggle('menu-open', on);
    if (on) openLayer(mm); else closeLayer(mm);
  }
  mb.addEventListener('click', function () { toggleMenu(mb.getAttribute('aria-expanded') !== 'true'); });
  mm.addEventListener('click', function (e) { if (e.target.closest('a')) toggleMenu(false); });

  /* ---------- in-page links: smooth, with the header taken into account ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]'); if (!a) return;
    var id = a.getAttribute('href'); if (id.length < 2 && id !== '#top') return;
    var t = id === '#top' ? document.body : $(id); if (!t) return;
    e.preventDefault();
    var y = id === '#top' ? 0 : t.getBoundingClientRect().top + scrollY - 76;
    window.scrollTo({ top: y, behavior: RM ? 'auto' : 'smooth' });
    if (a.dataset.book) setTimeout(function () { pickDept(a.dataset.book, a.dataset.docPick); }, RM ? 0 : 450);
    if (a.dataset.dept) setActive(a.dataset.dept, true);
    history.replaceState(null, '', id === '#top' ? location.pathname : id);
  });

  /* ---------- hero: reveal, helix, pointer and scroll ---------- */
  var heroEl = $('.hero'), helix = null, hc = $('.hx');
  requestAnimationFrame(function () { document.documentElement.classList.add('ready'); });
  try {
    if (window.AbaliHelix) { helix = new AbaliHelix(hc, C.hero.helix); if (helix.init()) { helix.start(); if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { helix.visible = es[0].isIntersecting; }).observe(heroEl); } else helix = null; }
  } catch (err) { helix = null; }
  if (!helix) heroEl.classList.add('no-gl');
  if (helix && !RM) heroEl.addEventListener('pointermove', function (e) { if (e.pointerType !== 'mouse') return; var r = heroEl.getBoundingClientRect(); helix.pointer((e.clientX - r.left) / r.width - 0.5, (e.clientY - r.top) / r.height - 0.5); });

  /* ---------- scroll: header, hero exit, parallax, journey line ---------- */
  var hdr = $('#hdr'), heroIn = $('.hero-in'), pars = $$('[data-par]'), jr = $('[data-jr]'), ticking = false, lastY = 0;
  function onScroll() {
    var y = scrollY, vh = innerHeight;
    hdr.classList.toggle('solid', y > 30);
    var dy = y - lastY;   // only react to a real change of direction, so tiny or repeated scroll positions never make the header flicker
    if (Math.abs(dy) > 6) { hdr.classList.toggle('away', dy > 0 && y > vh * 0.9 && !document.documentElement.classList.contains('menu-open')); lastY = y; }
    var hk = Math.min(1, Math.max(0, y / (heroEl.offsetHeight * 0.9)));
    if (helix) helix.scroll = hk;
    if (!RM) { heroIn.style.transform = 'translate3d(0,' + (y * 0.18) + 'px,0)'; heroIn.style.opacity = String(1 - hk * 1.1); }
    if (!RM) pars.forEach(function (p) { var r = p.parentNode.getBoundingClientRect(); if (r.bottom < -100 || r.top > vh + 100) return; var k = (r.top + r.height / 2 - vh / 2) / vh; p.style.transform = 'translate3d(0,' + (k * -100 * (+p.dataset.par)) + '%,0) scale(1.12)'; });
    if (jr) { var r = jr.getBoundingClientRect(), k = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.3))); jr.style.setProperty('--jr', k.toFixed(3)); }
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- section reveals and counters ---------- */
  var count = function (el) {
    var to = +el.dataset.count, t0 = null, dur = 1400;
    if (RM) { el.textContent = to; return; }
    var step = function (now) { if (!t0) t0 = now; var k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 4); el.textContent = Math.round(to * e); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window && !RM) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (!e.isIntersecting) return; e.target.classList.add('is-in'); io.unobserve(e.target); $$('[data-count]', e.target).forEach(count); }); }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    $$('[data-rv]').forEach(function (el) { io.observe(el); });
  } else { $$('[data-rv]').forEach(function (el) { el.classList.add('is-in'); }); $$('[data-count]').forEach(count); }

  /* ---------- services: the list and the picture beside it ---------- */
  var svList = $$('.sv'), svPics = $$('.svc-p'), wideQ = window.matchMedia('(min-width: 901px)');
  function setActive(id, scroll) {
    var d = deptById[id]; if (!d) return;
    svList.forEach(function (li) { var on = li.dataset.id === id; li.classList.toggle('on', on); $('.sv-b', li).setAttribute('aria-expanded', on); });
    svPics.forEach(function (p) { p.classList.toggle('on', p.dataset.id === id); });
    var i = D.departments.indexOf(d); $('[data-cap-n]').textContent = String(i + 1).padStart(2, '0'); $('[data-cap-t]').textContent = d.name; $('[data-cap-b]').dataset.book = id;
  }
  svList.forEach(function (li) {
    var b = $('.sv-b', li);
    b.addEventListener('click', function () { var on = li.classList.contains('on'); if (!wideQ.matches && on) { li.classList.remove('on'); b.setAttribute('aria-expanded', false); return; } setActive(li.dataset.id); });
    li.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse' && wideQ.matches) setActive(li.dataset.id); });
  });

  /* ---------- specialists: scroll track and profiles ---------- */
  var track = $('.docs-track');
  $$('[data-dn]').forEach(function (b) { b.addEventListener('click', function () { var card = $('.doc', track); track.scrollBy({ left: (+b.dataset.dn) * (card ? card.offsetWidth + 20 : 320), behavior: RM ? 'auto' : 'smooth' }); }); });
  track.addEventListener('click', function (e) { var b = e.target.closest('[data-doc]'); if (!b) return; var s = D.specialists.filter(function (x) { return x.id === b.dataset.doc; })[0]; if (s) profile(s); });

  /* ---------- reviews ---------- */
  var qi = 0, qs = $$('.q');
  function showQ(n) { qi = (n + qs.length) % qs.length; qs.forEach(function (q, i) { q.classList.toggle('on', i === qi); }); $('[data-rc]').textContent = qi + 1; }
  $$('[data-rn]').forEach(function (b) { b.addEventListener('click', function () { showQ(qi + (+b.dataset.rn)); }); });

  /* ---------- opening hours: "open now" ---------- */
  var toMin = function (s) { var p = s.split(':'); return +p[0] * 60 + +p[1]; };
  function nowIn() { try { var p = new Intl.DateTimeFormat('en-GB', { timeZone: C.contact.timezone, weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date()), o = {}; p.forEach(function (x) { o[x.type] = x.value; }); return { day: o.weekday.toLowerCase().slice(0, 3), min: (+o.hour % 24) * 60 + +o.minute }; } catch (e) { var d = new Date(); return { day: DAYS[d.getDay()], min: d.getHours() * 60 + d.getMinutes() }; } }
  (function () {
    var n = nowIn(), h = C.contact.hours[n.day] || [], open = h.some(function (x) { return n.min >= toMin(x[0]) && n.min < toMin(x[1]); });
    $$('[data-open]').forEach(function (el) { el.innerHTML = '<i class="' + (open ? 'y' : 'n') + '"></i>' + (open ? 'Clinics open now' : 'Clinics closed now'); });
    var tr = $('tr[data-day="' + n.day + '"]'); if (tr) tr.classList.add('today');
  })();

  /* ---------- booking form ---------- */
  var f = $('#bkf'), fDept = $('#f-dept'), fDoc = $('#f-doctor'), fDate = $('#f-date'), fTime = $('#f-time');
  var iso = function (d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  var d0 = new Date(); d0.setDate(d0.getDate() + (C.booking.leadDays || 0)); var d1 = new Date(); d1.setDate(d1.getDate() + (C.booking.maxDays || 60));
  fDate.min = iso(d0); fDate.max = iso(d1);
  function doctors() {
    var list = D.specialists.filter(function (s) { return !fDept.value || s.dept === fDept.value; }), cur = fDoc.value;
    fDoc.innerHTML = '<option value="">No preference</option>' + list.map(function (s) { return '<option value="' + s.id + '">' + esc(s.name) + ' · ' + esc(s.role) + '</option>'; }).join('');
    if (list.some(function (s) { return s.id === cur; })) fDoc.value = cur;
  }
  function times() {
    var v = fDate.value; fTime.innerHTML = ''; if (!v) { fTime.disabled = true; fTime.innerHTML = '<option value="">Pick a date first</option>'; return; }
    var p = v.split('-'), day = DAYS[new Date(+p[0], +p[1] - 1, +p[2]).getDay()], h = C.contact.hours[day] || [], step = C.booking.slotMinutes || 30, opts = [];
    h.forEach(function (x) { for (var m = toMin(x[0]); m + step <= toMin(x[1]); m += step) opts.push(String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0')); });
    fTime.disabled = !opts.length;
    fTime.innerHTML = opts.length ? '<option value="">Choose a time</option>' + opts.map(function (t) { return '<option>' + t + '</option>'; }).join('') : '<option value="">Clinics are closed that day</option>';
    if (!opts.length) err('date', 'Outpatient clinics are closed on ' + DN[day] + 's. Please pick another day.'); else err('date', '');
  }
  function pickDept(id, doc) { if (id) fDept.value = id; doctors(); if (doc) fDoc.value = doc; err('dept', ''); }
  fDept.addEventListener('change', function () { doctors(); err('dept', ''); });
  fDate.addEventListener('change', times);
  doctors();
  function err(k, m) { var e = $('#e-' + k), c = $('#f-' + k); if (e) e.textContent = m || ''; if (c) { c.classList.toggle('bad', !!m); if (m) c.setAttribute('aria-invalid', 'true'); else c.removeAttribute('aria-invalid'); } }
  ['name', 'phone', 'email', 'time', 'msg'].forEach(function (k) { var c = $('#f-' + k); if (c) c.addEventListener('input', function () { err(k, ''); }); });
  $('#f-ok').addEventListener('change', function () { err('ok', ''); });
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = function (id) { return $('#f-' + id).value.trim(); }, bad = [];
    if (v('name').length < 2) bad.push(['name', 'Please enter your full name.']);
    var ph = v('phone').replace(/[\s()-]/g, ''); if (!/^\+?\d{9,15}$/.test(ph)) bad.push(['phone', 'Please enter a phone number we can call, e.g. +254 7XX XXX XXX.']);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v('email'))) bad.push(['email', 'Please enter a valid email address.']);
    if (!v('dept')) bad.push(['dept', 'Please choose a department.']);
    if (!v('date')) bad.push(['date', 'Please choose a date.']); else if (v('date') < fDate.min || v('date') > fDate.max) bad.push(['date', 'Please choose a date between ' + fDate.min + ' and ' + fDate.max + '.']);
    else if (fTime.disabled) bad.push(['date', 'Clinics are closed that day. Please pick another day.']);
    if (!fTime.disabled && !v('time')) bad.push(['time', 'Please choose a time.']);
    if (!$('#f-ok').checked) bad.push(['ok', 'Please confirm we may contact you about this request.']);
    ['name', 'phone', 'email', 'dept', 'date', 'time', 'ok'].forEach(function (k) { err(k, ''); });
    bad.forEach(function (b) { err(b[0], b[1]); });
    if (bad.length) { var first = $('#f-' + bad[0][0]); first.focus(); toast(bad.length === 1 ? 'One detail needs your attention.' : bad.length + ' details need your attention.'); return; }
    var dept = deptById[v('dept')], doc = D.specialists.filter(function (s) { return s.id === v('doctor'); })[0];
    var data = { name: v('name'), phone: v('phone'), email: v('email'), department: dept.name, doctor: doc ? doc.name : 'No preference', date: v('date'), time: v('time'), message: v('msg') };
    data.summary = 'Appointment request: ' + data.name + ', ' + data.phone + ', ' + data.email + '. ' + data.department + ' (' + data.doctor + ') on ' + data.date + ' at ' + data.time + '.' + (data.message ? ' Note: ' + data.message : '');
    var btn = $('button[type=submit]', f), label = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="spin"></span>Sending…';
    var done = function (ok, live) {
      btn.disabled = false; btn.innerHTML = label;
      if (!ok) { toast('We couldn’t send your request just now. Please try again, or call us.', 'bad'); return; }
      f.innerHTML = '<div class="sent" tabindex="-1"><span class="sent-ic">' + I.check + '</span><h3>' + (live ? 'Request received' : 'Everything checks out') + '</h3>' +
        '<p>' + (live ? 'Thank you, ' + esc(data.name.split(' ')[0]) + '. Our team will call or text you on ' + esc(data.phone) + ' to confirm your appointment. It is not booked until we confirm.' : 'This is a live template, so your request was not sent anywhere. Once a booking endpoint is connected, requests like this go straight to the hospital, which calls to confirm.') + '</p>' +
        '<dl><dt>Department</dt><dd>' + esc(data.department) + '</dd><dt>Doctor</dt><dd>' + esc(data.doctor) + '</dd><dt>Preferred time</dt><dd>' + esc(data.date) + ', ' + esc(data.time) + '</dd></dl>' +
        '<button type="button" class="btn btn--line" data-again>Make another request</button></div>';
      $('.sent', f).focus();
      $('[data-again]', f).addEventListener('click', function () { location.reload(); });
    };
    if (!C.booking.endpoint) return setTimeout(function () { done(true, false); }, RM ? 0 : 700);
    fetch(C.booking.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { done(r.ok, true); }, function () { done(false, true); });
  });

  var tt; function toast(m, k) { var t = $('#toast'); t.textContent = m; t.className = 'toast show' + (k ? ' ' + k : ''); clearTimeout(tt); tt = setTimeout(function () { t.className = 'toast'; }, 3600); }
})();
