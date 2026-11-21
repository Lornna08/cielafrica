/* ============================================================
   CIEL AFRICA — Start a project (quote.html)
   Three friendly steps: what you need → a few quick picks → how
   to reach you. Everything is tap-to-pick; only name and a phone
   or email are typed. Details are sorted out afterwards on
   WhatsApp or email. Prefills from ?template= / ?product= /
   ?service= / ?brief=, keeps a draft in this browser, and posts
   to /api/contact (emailed to the team, saved as a lead).
   ============================================================ */
(function () {
  var root = document.getElementById('brief'); if (!root) return;
  var C = window.CIEL || {}, KEY = 'ciel:brief:v2';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var $ = function (s, r) { return (r || root).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || root).querySelectorAll(s)); };
  var I = function (p, s) { return '<svg width="' + (s || 20) + '" height="' + (s || 20) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>'; };
  var IC = {
    tpl: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11"/>',
    site: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    shop: '<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    app: '<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 21h8M12 18v3M7 9h5M7 13h10"/>',
    mobile: '<rect x="7" y="2.5" width="10" height="19" rx="2.2"/><path d="M11 18.5h2"/>',
    pay: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 15h3"/>',
    plug: '<path d="M9 3v5M15 3v5M7 8h10v4a5 5 0 0 1-10 0zM12 17v4"/>',
    fix: '<path d="M14.5 5.5a4 4 0 0 0-5 5L4 16l4 4 5.5-5.5a4 4 0 0 0 5-5l-2.5 2.5-3-.5-.5-3z"/>',
    q: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.6v.6M12 17h.01"/>',
    wa: '<path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"/><path d="M9 9.5c.3 2 2.5 4.3 4.5 4.6l1.2-1.2 1.8.9-.4 1.6c-3.6.4-8-4-7.6-7.6l1.6-.4.9 1.8z"/>',
    call: '<path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'
  };

  /* ---------- context from the link ---------- */
  var q = new URLSearchParams(location.search);
  var refName = q.get('template') || q.get('product') || q.get('service') || q.get('project') || '';
  var kind = q.get('template') ? 'template' : q.get('product') ? 'product' : q.get('service') ? 'service' : '';
  var ref = null;
  if (kind === 'template') ref = (C.templates || []).filter(function (t) { return t.name.toLowerCase() === refName.toLowerCase(); })[0] || null;
  if (kind === 'product') ref = (C.products || []).filter(function (t) { return t.name.toLowerCase() === refName.toLowerCase(); })[0] || null;

  /* ---------- the choices ---------- */
  var NEEDS = [
    ['A website', 'site', 'For your business or brand'],
    ['An online shop', 'shop', 'Sell and get paid by M-Pesa'],
    ['One of your templates', 'tpl', 'Made yours, quickly'],
    ['A system or web app', 'app', 'Dashboards, portals, tools'],
    ['A mobile app', 'mobile', 'Android and iPhone'],
    ['M-Pesa payments', 'pay', 'On a site or system you have'],
    ['Fix or redesign', 'fix', 'Something you already have'],
    ['Not sure yet', 'q', 'Let’s figure it out together']
  ];
  if (kind === 'product') NEEDS.unshift(['This product', 'plug', 'Set up for my business']);
  var GOALS = ['More customers', 'Sell online', 'Take bookings', 'Look professional', 'Save time', 'Get paid easily'];
  var BUDGETS = ['Under 20k', '20k – 50k', '50k – 100k', '100k – 300k', '300k+', 'Not sure'];
  var TIMES = ['This week', 'In a few weeks', 'In a month or two', 'No rush'];
  var CONTACT = [['WhatsApp', 'wa'], ['A call', 'call'], ['Email', 'mail']];

  var STEPS = [
    { t: 'What can we help you with?', s: 'Pick the one that fits best.' },
    { t: 'A few quick picks', s: 'All optional. Tap what feels right.' },
    { t: 'How do we reach you?', s: 'We’ll reply within a day, usually much sooner.' }
  ];

  /* ---------- state (draft kept in this browser) ---------- */
  var S = { step: 0 }, F = {};
  try { var saved = JSON.parse(localStorage.getItem(KEY)); if (saved && saved.f) F = saved.f; } catch (e) { }
  if (refName) { F.ref = refName; F.need = kind === 'template' ? 'One of your templates' : kind === 'product' ? 'This product' : F.need; }
  if (q.get('brief') && !F.note) F.note = q.get('brief').slice(0, 600);
  F.contact = F.contact || 'WhatsApp';
  if (F.need && (kind === 'template' || kind === 'product')) S.step = 1;
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ f: F })); } catch (e) { } }

  /* ---------- builders ---------- */
  function chips(id, opts, multi, label) {
    var cur = F[id] || (multi ? [] : '');
    return '<div class="bf-q"><p class="bf-ql" id="l-' + id + '">' + label + (multi ? ' <small class="bf-multi">pick any</small>' : '') + '</p>' +
      '<div class="bf-chips" role="' + (multi ? 'group' : 'radiogroup') + '" aria-labelledby="l-' + id + '">' + opts.map(function (x) {
        var on = multi ? cur.indexOf(x) >= 0 : cur === x;
        return '<button type="button" class="bf-chip' + (on ? ' is-on' : '') + '" data-c="' + id + '" data-v="' + esc(x) + '" data-m="' + (multi ? 1 : 0) + '" ' + (multi ? 'aria-pressed' : 'role="radio" aria-checked') + '="' + on + '">' + (multi ? '<i>' + I(IC.check, 12) + '</i>' : '') + esc(x) + '</button>';
      }).join('') + '</div></div>';
  }
  function tiles(id, opts, cls) {
    return '<div class="bf-tiles' + (cls ? ' ' + cls : '') + '" role="radiogroup" aria-label="' + esc(STEPS[0].t) + '">' + opts.map(function (x) {
      var on = F[id] === x[0];
      return '<button type="button" class="bf-tile' + (on ? ' is-on' : '') + '" data-c="' + id + '" data-v="' + esc(x[0]) + '" data-m="0" role="radio" aria-checked="' + on + '"><span class="bf-tile__ic">' + I(IC[x[1]], 22) + '</span><b>' + esc(x[0]) + '</b>' + (x[2] ? '<small>' + esc(x[2]) + '</small>' : '') + '</button>';
    }).join('') + '</div><p class="bf-err" id="e-' + id + '" hidden></p>';
  }
  function field(id, label, o) {
    o = o || {}; var v = F[id] || '';
    var input = o.area ? '<textarea id="b-' + id + '" data-k="' + id + '" rows="' + (o.rows || 3) + '" placeholder="' + esc(o.ph || '') + '">' + esc(v) + '</textarea>'
      : '<input id="b-' + id + '" data-k="' + id + '" type="' + (o.type || 'text') + '" value="' + esc(v) + '" placeholder="' + esc(o.ph || '') + '"' + (o.ac ? ' autocomplete="' + o.ac + '"' : '') + (o.im ? ' inputmode="' + o.im + '"' : '') + '>';
    return '<div class="bf-f' + (o.half ? ' bf-f--h' : '') + '"><label for="b-' + id + '">' + label + (o.opt ? ' <small>optional</small>' : '') + '</label>' + input + (o.hint ? '<p class="bf-hint">' + o.hint + '</p>' : '') + '<p class="bf-err" id="e-' + id + '" hidden></p></div>';
  }

  /* ---------- steps ---------- */
  function stepHtml(i) {
    if (i === 0) return tiles('need', NEEDS, 'bf-tiles--easy');
    if (i === 1) return chips('goals', GOALS, true, 'What would make it a win?') +
      chips('budget', BUDGETS, false, 'Rough budget (KES)') +
      chips('timeline', TIMES, false, 'When would you like it?') +
      '<div class="bf-grid">' + field('note', 'Anything you’d like us to know?', { area: 1, rows: 3, opt: 1, ph: 'A line or two about your business or idea is plenty.' }) + '</div>';
    var em = F.contact === 'Email';
    return '<div class="bf-grid">' +
      field('name', 'Your name', { ac: 'name', ph: 'e.g. Jane', half: 1 }) +
      field('phone', 'WhatsApp or phone', { type: 'tel', ac: 'tel', im: 'tel', ph: '07XX XXX XXX', half: 1, opt: em }) +
      field('email', 'Email', { type: 'email', ac: 'email', ph: 'you@example.com', opt: !em }) +
      field('company', 'Business name', { ac: 'organization', ph: 'If you have one', opt: 1 }) + '</div>' +
      '<div class="bf-q"><p class="bf-ql" id="l-contact">Best way to reach you</p><div class="bf-chips" role="radiogroup" aria-labelledby="l-contact">' + CONTACT.map(function (x) {
        var on = F.contact === x[0];
        return '<button type="button" class="bf-chip bf-chip--ic' + (on ? ' is-on' : '') + '" data-c="contact" data-v="' + x[0] + '" data-m="0" role="radio" aria-checked="' + on + '">' + I(IC[x[1]], 16) + x[0] + '</button>';
      }).join('') + '</div></div>' +
      '<p class="bf-fine">By sending, you’re happy for Ciel Africa to contact you about this. We never share your details. <a href="/privacy" target="_blank" rel="noopener">Privacy</a></p>';
  }

  /* ---------- the side card: your picks ---------- */
  function picks() {
    var it = [['Looking for', F.ref ? F.ref : F.need], ['Wins', (F.goals || []).join(', ')], ['Budget', F.budget ? 'KES ' + F.budget : ''], ['When', F.timeline]].filter(function (x) { return x[1]; });
    $('#bf-sum').innerHTML = it.length ? '<ul class="bf-sumlist">' + it.map(function (x) { return '<li class="is-set"><span>' + x[0] + '</span><b>' + esc(x[1]) + '</b></li>'; }).join('') + '</ul>' : '<p class="bf-empty">Your picks show up here.</p>';
  }

  /* ---------- render ---------- */
  function render(focus) {
    $('#bf-steps').innerHTML = STEPS.map(function (s, i) { return '<li class="' + (i === S.step ? 'is-on' : i < S.step ? 'is-done' : '') + '"><button type="button" data-go="' + i + '"' + (i > reached && i > S.step ? ' disabled' : '') + ' aria-current="' + (i === S.step ? 'step' : 'false') + '"><span>' + (i < S.step ? I(IC.check, 13) : i + 1) + '</span><b>' + ['Your idea', 'Quick picks', 'Your details'][i] + '</b></button></li>'; }).join('');
    $('#bf-bar').style.width = (S.step / (STEPS.length - 1) * 100) + '%';
    var s = STEPS[S.step];
    $('#bf-body').innerHTML = '<div class="bf-head"><p class="bf-kicker">' + (S.step + 1) + ' of ' + STEPS.length + '</p><h2>' + s.t + '</h2><p>' + s.s + '</p></div>' + stepHtml(S.step);
    $('#bf-back').hidden = S.step === 0;
    var last = S.step === STEPS.length - 1;
    $('#bf-next').innerHTML = (last ? 'Send' : S.step === 1 && !(F.goals || []).length && !F.budget && !F.timeline && !F.note ? 'Skip' : 'Next') + I(IC.arrow, 18);
    $('#bf-next').classList.toggle('bf-send', last);
    $('#bf-next').hidden = S.step === 0 && !F.need;
    $('#bf-wa').hidden = !last;
    if (last) $('#bf-wa').href = waLink();
    picks();
    if (focus) { var h = $('#bf-body h2'); h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); var top = root.getBoundingClientRect().top + scrollY - 100; if (scrollY > top) scrollTo({ top: top, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }
  }
  var reached = S.step;
  function go(to) { S.step = to; reached = Math.max(reached, to); render(true); }

  /* ---------- checks: only what we need to reply ---------- */
  function err(k, msg) { var e = document.getElementById('e-' + k); if (e) { e.textContent = msg || ''; e.hidden = !msg; } var el = document.getElementById('b-' + k); if (el) el.setAttribute('aria-invalid', msg ? 'true' : 'false'); return !msg; }
  function check(i) {
    if (i === 0) return err('need', F.need ? '' : 'Pick one to continue.');
    if (i !== 2) return true;
    var ok = true, first = null, phoneOk = /\d{9,}/.test(String(F.phone || '').replace(/\D/g, '')), mailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(F.email || '');
    if (!String(F.name || '').trim()) { err('name', 'What should we call you?'); ok = false; first = 'name'; } else err('name', '');
    if (F.email && !mailOk) { err('email', 'That email doesn’t look right.'); ok = false; first = first || 'email'; } else err('email', '');
    if (F.phone && !phoneOk) { err('phone', 'That number looks too short.'); ok = false; first = first || 'phone'; } else if (!F.phone && !mailOk && !F.email) { err('phone', 'Add a number or an email so we can reach you.'); ok = false; first = first || 'phone'; } else err('phone', '');
    if (ok && F.contact === 'Email' && !mailOk) { err('email', 'Add your email, since that’s how you’d like us to reply.'); ok = false; first = 'email'; }
    if (ok && F.contact !== 'Email' && !phoneOk) { err('phone', 'Add your number, since that’s how you’d like us to reply.'); ok = false; first = 'phone'; }
    if (!ok) { var el = document.getElementById('b-' + first); if (el) { el.focus(); el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } }
    return ok;
  }

  /* ---------- events ---------- */
  root.addEventListener('input', function (e) { var k = e.target.getAttribute('data-k'); if (!k) return; F[k] = e.target.value; if (e.target.getAttribute('aria-invalid') === 'true') err(k, ''); save(); if (k === 'note') render(false); });
  root.addEventListener('click', function (e) {
    var c = e.target.closest('[data-c]');
    if (c) {
      var k = c.getAttribute('data-c'), v = c.getAttribute('data-v'), multi = c.getAttribute('data-m') === '1';
      if (multi) { var a = F[k] = F[k] || [], ix = a.indexOf(v); if (ix >= 0) a.splice(ix, 1); else a.push(v); c.classList.toggle('is-on', ix < 0); c.setAttribute('aria-pressed', ix < 0); }
      else { F[k] = F[k] === v && k !== 'need' && k !== 'contact' ? '' : v; $$('[data-c="' + k + '"]').forEach(function (b) { var on = F[k] === b.getAttribute('data-v'); b.classList.toggle('is-on', on); b.setAttribute('aria-checked', on); }); }
      save();
      if (k === 'need') { err('need', ''); setTimeout(function () { go(1); }, 220); return; }   /* one tap and you're on to the next step */
      if (k === 'contact') { var y = scrollY; render(false); scrollTo(0, y); return; }
      var y2 = scrollY; render(false); scrollTo(0, y2);
    }
    var g = e.target.closest('[data-go]');
    if (g && !g.disabled) { var to = +g.getAttribute('data-go'); if (to > S.step && !check(S.step)) return; go(to); }
  });
  $('#bf-back').addEventListener('click', function () { if (S.step > 0) go(S.step - 1); });
  $('#bf-next').addEventListener('click', function () { if (!check(S.step)) return; if (S.step < STEPS.length - 1) return go(S.step + 1); send(); });
  var rs = $('#bf-reset'); if (rs) rs.addEventListener('click', function () {
    Object.keys(F).forEach(function (k) { delete F[k]; }); F.contact = 'WhatsApp';
    if (refName) { F.ref = refName; F.need = kind === 'template' ? 'One of your templates' : kind === 'product' ? 'This product' : ''; }
    try { localStorage.removeItem(KEY); } catch (er) { } S.step = 0; reached = 0; render(true);
  });

  /* ---------- sending ---------- */
  function rows() {
    return [['Looking for', F.need], [kind === 'product' ? 'Product' : kind === 'service' ? 'Service' : kind === 'template' ? 'Template' : 'About', F.ref], ['What would make it a win', (F.goals || []).join(', ')], ['Budget (KES)', F.budget], ['When', F.timeline], ['Message', F.note], ['Business', F.company], ['Reach me by', F.contact]].filter(function (x) { return x[1]; });
  }
  function payload() {
    var hp = document.getElementById('bf-honey');
    var d = { _form: 'brief', _honey: hp ? hp.value : '', _ref: F.ref || '', 'Name': F.name, 'Email': F.email || '', 'WhatsApp or phone': F.phone || '' };
    rows().forEach(function (x) { d[x[0]] = x[1]; });
    return d;
  }
  function send() {
    var btn = $('#bf-next'), st = $('#bf-status'), bot = !!($('#bf-honey') || {}).value; btn.disabled = true; btn.innerHTML = 'Sending…';
    st.className = 'bf-status'; st.textContent = '';
    fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload()) })
      .then(function (r) { return r.json().catch(function () { return { ok: r.ok }; }); })
      .then(function (res) {
        if (!res || !res.ok) throw new Error((res && res.error) || 'error');
        try { localStorage.removeItem(KEY); } catch (e) { }
        /* Lead only for a real submission: the hidden anti-spam field must be empty */
        try { if (window.CielPixel && !bot) CielPixel.after('Lead', { content_name: 'Project brief', content_category: 'Quote request' }); } catch (e) { }
        location.href = '/thanks';
      })
      .catch(function (e) { btn.disabled = false; render(false); st.className = 'bf-status bf-status--err'; st.innerHTML = (e && e.message && e.message !== 'error' ? esc(e.message) + '. ' : 'Something went wrong. ') + 'Try again, or send it on WhatsApp instead.'; });
  }
  function waLink() {
    var lines = ['Hello Ciel Africa! I’d like to start a project.', ''].concat(rows().map(function (x) { return '• ' + x[0] + ': ' + x[1]; }));
    if (F.name) lines.push('', '— ' + F.name);
    return 'https://wa.me/254117959105?text=' + encodeURIComponent(lines.join('\n').slice(0, 3000));
  }

  /* ---------- context card (from a template or product page) ---------- */
  var ctx = $('#bf-ctx');
  if (refName && ctx) {
    var img = ref && ref.image ? '<span class="bf-ctx__img"><img src="' + esc(ref.image) + '" alt=""></span>' : '';
    var live = ref && ref.demo ? '<a class="bf-link" href="' + esc(ref.demo) + '" target="_blank" rel="noopener">See it live' + I(IC.ext, 14) + '</a>' : '';
    ctx.innerHTML = img + '<div><p class="bf-kicker">You’re asking about</p><h2>' + esc(refName) + '</h2>' + live + '</div>';
    ctx.hidden = false;
  }

  render(false);
})();
