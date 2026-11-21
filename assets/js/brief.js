/* ============================================================
   CIEL AFRICA — Start a project (quote.html)
   Three steps, in the order a studio would ask:
     1. You: name and how to reach you
     2. The project: what we're creating, for whom, what it must do
     3. Budget and timing (last, and all optional)
   Dropdowns where a choice is natural, plain boxes where words are
   better. Fields never re-draw while you type. Prefills from
   ?template= / ?product= / ?service= / ?brief=, keeps a draft in this
   browser, and posts to /api/contact (emailed and saved as a lead).
   ============================================================ */
(function () {
  var root = document.getElementById('brief'); if (!root) return;
  var C = window.CIEL || {}, KEY = 'ciel:brief:v3';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var $ = function (s, r) { return (r || root).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || root).querySelectorAll(s)); };
  var I = function (p, s) { return '<svg width="' + (s || 20) + '" height="' + (s || 20) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>'; };
  var IC = { check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>', ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>' };

  /* ---------- where they came from ---------- */
  var q = new URLSearchParams(location.search);
  var refName = (q.get('template') || q.get('product') || q.get('service') || q.get('project') || '').slice(0, 120);
  var kind = q.get('template') ? 'template' : q.get('product') ? 'product' : q.get('service') ? 'service' : '';
  var ref = null;
  if (kind === 'template') ref = (C.templates || []).filter(function (t) { return t.name.toLowerCase() === refName.toLowerCase(); })[0] || null;
  if (kind === 'product') ref = (C.products || []).filter(function (t) { return t.name.toLowerCase() === refName.toLowerCase(); })[0] || null;

  /* ---------- the questions ---------- */
  var CREATE = ['Business website', 'Online shop (e-commerce)', 'Web application or portal', 'Mobile app (Android & iPhone)', 'Custom software or SaaS platform', 'Business or management system', 'Institutional or enterprise system', 'M-Pesa & payments integration', 'API & third-party integrations', 'Trading system or Expert Advisor', 'AI assistant or automation', 'Data dashboard & analytics', 'WordPress or CMS build', 'UI/UX & product design', 'Cloud, DevOps & hosting', 'Maintenance & support', 'One of your website templates', 'A digital product from your shop', 'Something else'];
  var STAGE = ['A new build from scratch', 'A redesign or rebuild of something I have', 'New features for something I have', 'Fixes or improvements to something I have'];
  var INDUSTRY = ['Retail & e-commerce', 'Food, hospitality & travel', 'Health & wellness', 'Education & training', 'Finance, SACCO & microfinance', 'Real estate & property', 'Logistics & transport', 'Manufacturing & agriculture', 'NGO & non-profit', 'Government & public sector', 'Media, creative & events', 'Professional services', 'Technology & startups', 'Personal brand', 'Other'];
  var FEATURES = ['M-Pesa or card payments', 'Customer accounts & login', 'Admin dashboard', 'Bookings or appointments', 'Product catalogue & cart', 'Blog or news', 'Several languages', 'SMS or WhatsApp alerts', 'Reports & analytics', 'Connects to tools I already use'];
  var BUDGET = ['Under KES 25,000', 'KES 25,000 – 50,000', 'KES 50,000 – 100,000', 'KES 100,000 – 250,000', 'KES 250,000 – 500,000', 'Over KES 500,000', 'I’d like your advice on this'];
  var WHEN = ['As soon as possible', 'Within a month', 'In 1 – 3 months', 'In 3 – 6 months', 'Flexible, no fixed date'];
  var CONTENT = ['Yes, text and images are ready', 'Some of it', 'Not yet, I’d like help with it', 'Not needed for this project'];
  var HEARD = ['Google search', 'Instagram', 'Facebook', 'TikTok', 'LinkedIn', 'A friend or colleague', 'Saw a site you built', 'Other'];
  var REACH = ['WhatsApp', 'A phone call', 'Email'];

  var STEPS = [
    { t: 'First, about you', s: 'So we know who we’re talking to and how to reply.' },
    { t: 'Your project', s: 'Tell us what we’ll be creating. The more we know, the better our first answer.' },
    { t: 'Budget & timing', s: 'Optional, but it helps us suggest the right approach.' }
  ];

  /* ---------- state (a draft is kept in this browser) ---------- */
  var S = { step: 0 }, F = {};
  try { var saved = JSON.parse(localStorage.getItem(KEY)); if (saved && saved.f) F = saved.f; } catch (e) { }
  if (refName) { F.ref = refName; if (!F.create) F.create = kind === 'template' ? 'One of your website templates' : kind === 'product' ? 'A digital product from your shop' : (CREATE.filter(function (c) { return c.toLowerCase().indexOf(refName.toLowerCase().split(' ')[0]) >= 0; })[0] || ''); }
  if (q.get('brief') && !F.about) F.about = q.get('brief').slice(0, 1500);
  F.reach = F.reach || 'WhatsApp';
  F.features = F.features || [];
  var saveT = null;
  function save() { clearTimeout(saveT); saveT = setTimeout(function () { try { localStorage.setItem(KEY, JSON.stringify({ f: F })); } catch (e) { } }, 250); }

  /* ---------- building blocks ---------- */
  function lab(id, label, o) { return '<label for="b-' + id + '">' + label + (o.req ? '' : ' <small>optional</small>') + '</label>'; }
  function input(id, label, o) {
    o = o || {};
    return '<div class="bf-f' + (o.half ? ' bf-f--h' : '') + '">' + lab(id, label, o) + '<input id="b-' + id + '" data-k="' + id + '" type="' + (o.type || 'text') + '" value="' + esc(F[id] || '') + '" placeholder="' + esc(o.ph || '') + '"' + (o.ac ? ' autocomplete="' + o.ac + '"' : '') + (o.im ? ' inputmode="' + o.im + '"' : '') + ' maxlength="' + (o.max || 160) + '">' + (o.hint ? '<p class="bf-hint">' + o.hint + '</p>' : '') + '<p class="bf-err" id="e-' + id + '" hidden></p></div>';
  }
  function area(id, label, o) {
    o = o || {};
    return '<div class="bf-f">' + lab(id, label, o) + '<textarea id="b-' + id + '" data-k="' + id + '" rows="' + (o.rows || 4) + '" placeholder="' + esc(o.ph || '') + '" maxlength="' + (o.max || 2000) + '">' + esc(F[id] || '') + '</textarea>' + (o.hint ? '<p class="bf-hint">' + o.hint + '</p>' : '') + '<p class="bf-err" id="e-' + id + '" hidden></p></div>';
  }
  function select(id, label, list, o) {
    o = o || {}; var v = F[id] || '';
    return '<div class="bf-f' + (o.half ? ' bf-f--h' : '') + '">' + lab(id, label, o) + '<div class="bf-sel"><select id="b-' + id + '" data-k="' + id + '"><option value="">' + esc(o.ph || 'Choose one') + '</option>' + list.map(function (x) { return '<option' + (x === v ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select></div><p class="bf-err" id="e-' + id + '" hidden></p></div>';
  }
  function checks(id, label, list) {
    var cur = F[id] || [];
    return '<div class="bf-f"><p class="bf-lab">' + label + ' <small>optional · tick any</small></p><div class="bf-checks">' + list.map(function (x, i) { var on = cur.indexOf(x) >= 0; return '<label class="bf-ck' + (on ? ' is-on' : '') + '"><input type="checkbox" data-ck="' + id + '" value="' + esc(x) + '"' + (on ? ' checked' : '') + '><i>' + I(IC.check, 12) + '</i><span>' + esc(x) + '</span></label>'; }).join('') + '</div></div>';
  }

  /* ---------- the three steps ---------- */
  function stepHtml(i) {
    if (i === 0) return '<div class="bf-grid">' +
      input('name', 'Full name', { req: 1, ac: 'name', ph: 'e.g. Jane Wanjiru', max: 80 }) +
      input('phone', 'WhatsApp or phone number', { req: F.reach !== 'Email', type: 'tel', ac: 'tel', im: 'tel', ph: 'e.g. 0712 345 678', half: 1, max: 30 }) +
      input('email', 'Email address', { req: F.reach === 'Email', type: 'email', ac: 'email', ph: 'you@company.com', half: 1, max: 120 }) +
      input('company', 'Company or organisation', { ac: 'organization', ph: 'If you have one', half: 1, max: 100 }) +
      input('role', 'Your role', { ph: 'e.g. Founder, Marketing lead', half: 1, max: 80 }) +
      select('reach', 'Best way to reach you', REACH, { req: 1, half: 1, ph: 'Choose one' }) + '</div>';
    if (i === 1) return '<div class="bf-grid">' +
      select('create', 'What would you like us to create?', CREATE, { req: 1 }) +
      select('stage', 'Is it new, or something you already have?', STAGE, { half: 1 }) +
      select('industry', 'Your industry', INDUSTRY, { half: 1 }) +
      area('about', 'Describe the project', { req: 1, rows: 5, ph: 'Who is it for, what should it do, and what would make it a success? A few sentences is perfect.', max: 2500 }) +
      checks('features', 'Must-have features', FEATURES) +
      input('site', 'Current website or app', { type: 'url', im: 'url', ph: 'https://', half: 1, max: 200 }) +
      input('inspo', 'Sites or apps you admire', { ph: 'Links or names', half: 1, max: 300 }) + '</div>';
    return '<div class="bf-grid">' +
      select('budget', 'Budget', BUDGET, { half: 1, ph: 'Choose a range' }) +
      select('when', 'When would you like to launch?', WHEN, { half: 1 }) +
      select('content', 'Is your content ready?', CONTENT, { half: 1, ph: 'Text, photos, logo…' }) +
      select('heard', 'How did you hear about us?', HEARD, { half: 1 }) +
      area('note', 'Anything else we should know?', { rows: 3, ph: 'Deadlines, must-use tools, questions for us…', max: 1500 }) + '</div>' +
      '<p class="bf-fine">By sending, you’re happy for Ciel Africa to contact you about this project. We never share your details. <a href="/privacy" target="_blank" rel="noopener">Privacy</a></p>';
  }

  /* ---------- the side card ---------- */
  function summary() {
    var it = [['Name', F.name], ['Creating', F.ref && kind ? F.ref : F.create], ['Industry', F.industry], ['Budget', F.budget], ['Launch', F.when]].filter(function (x) { return x[1]; });
    var el = $('#bf-sum'); if (!el) return;
    el.innerHTML = it.length ? '<ul class="bf-sumlist">' + it.map(function (x) { return '<li class="is-set"><span>' + x[0] + '</span><b>' + esc(x[1]) + '</b></li>'; }).join('') + '</ul>' : '<p class="bf-empty">Your answers show up here.</p>';
  }

  /* ---------- drawing a step (only when the step changes, never while typing) ---------- */
  var reached = 0;
  function render(focus) {
    $('#bf-steps').innerHTML = STEPS.map(function (s, i) { return '<li class="' + (i === S.step ? 'is-on' : i < S.step ? 'is-done' : '') + '"><button type="button" data-go="' + i + '"' + (i > reached && i > S.step ? ' disabled' : '') + ' aria-current="' + (i === S.step ? 'step' : 'false') + '"><span>' + (i < S.step ? I(IC.check, 14) : i + 1) + '</span><b>' + ['You', 'Project', 'Budget & timing'][i] + '</b></button></li>'; }).join('');
    $('#bf-bar').style.width = (S.step / (STEPS.length - 1) * 100) + '%';
    var s = STEPS[S.step];
    $('#bf-body').innerHTML = '<div class="bf-head"><p class="bf-kicker">Step ' + (S.step + 1) + ' of ' + STEPS.length + '</p><h2>' + s.t + '</h2><p>' + s.s + '</p></div>' + stepHtml(S.step);
    $('#bf-back').hidden = S.step === 0;
    var last = S.step === STEPS.length - 1;
    $('#bf-next').innerHTML = (last ? 'Send my brief' : 'Continue') + I(IC.arrow, 18);
    $('#bf-next').classList.toggle('bf-send', last);
    $('#bf-wa').hidden = !last; if (last) $('#bf-wa').href = waLink();
    summary();
    if (focus) { var h = $('#bf-body h2'); h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); var top = root.getBoundingClientRect().top + scrollY - 100; if (scrollY > top) scrollTo({ top: top, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }
  }
  function go(to) { S.step = to; reached = Math.max(reached, to); render(true); }

  /* ---------- checks ---------- */
  function err(k, msg) { var e = document.getElementById('e-' + k); if (e) { e.textContent = msg || ''; e.hidden = !msg; } var el = document.getElementById('b-' + k); if (el) el.setAttribute('aria-invalid', msg ? 'true' : 'false'); return !msg; }
  function check(i) {
    var bad = [];
    if (i === 0) {
      var phoneOk = /\d{9,}/.test(String(F.phone || '').replace(/\D/g, '')), mailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(F.email || '');
      if (!String(F.name || '').trim()) bad.push(['name', 'Please add your name.']); else err('name', '');
      if (F.email && !mailOk) bad.push(['email', 'That email doesn’t look right.']);
      else if (F.reach === 'Email' && !mailOk) bad.push(['email', 'Add your email, since that’s how you’d like us to reply.']); else err('email', '');
      if (F.phone && !phoneOk) bad.push(['phone', 'That number looks too short.']);
      else if (F.reach !== 'Email' && !phoneOk) bad.push(['phone', 'Add your number, since that’s how you’d like us to reply.']); else err('phone', '');
    }
    if (i === 1) {
      if (!F.create) bad.push(['create', 'Choose what you’d like us to create.']); else err('create', '');
      if (String(F.about || '').trim().length < 10) bad.push(['about', 'A sentence or two about the project, please.']); else err('about', '');
    }
    bad.forEach(function (b) { err(b[0], b[1]); });
    if (bad.length) { var el = document.getElementById('b-' + bad[0][0]); if (el) { el.focus({ preventScroll: true }); el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } }
    return !bad.length;
  }

  /* ---------- typing and picking: update the answer, nothing re-draws ---------- */
  function onField(e) {
    var t = e.target, k = t.getAttribute('data-k');
    if (k) {
      F[k] = t.value; if (t.getAttribute('aria-invalid') === 'true') err(k, ''); save();
      if (k === 'reach' && S.step === 0) {   /* the right contact box becomes the required one */
        var ph = $('label[for="b-phone"]'), em = $('label[for="b-email"]');
        if (ph) ph.innerHTML = 'WhatsApp or phone number' + (F.reach === 'Email' ? ' <small>optional</small>' : '');
        if (em) em.innerHTML = 'Email address' + (F.reach === 'Email' ? '' : ' <small>optional</small>');
      }
      if (/^(name|create|industry|budget|when)$/.test(k)) summary();
      return;
    }
    var ck = t.getAttribute('data-ck');
    if (ck) { var a = F[ck] = F[ck] || [], v = t.value, ix = a.indexOf(v); if (t.checked && ix < 0) a.push(v); if (!t.checked && ix >= 0) a.splice(ix, 1); t.closest('.bf-ck').classList.toggle('is-on', t.checked); save(); }
  }
  root.addEventListener('input', onField);
  root.addEventListener('change', onField);
  root.addEventListener('click', function (e) { var g = e.target.closest('[data-go]'); if (g && !g.disabled) { var to = +g.getAttribute('data-go'); if (to > S.step && !check(S.step)) return; go(to); } });
  $('#bf-back').addEventListener('click', function () { if (S.step > 0) go(S.step - 1); });
  $('#bf-next').addEventListener('click', function () { if (!check(S.step)) return; if (S.step < STEPS.length - 1) return go(S.step + 1); send(); });
  var rs = $('#bf-reset'); if (rs) rs.addEventListener('click', function () {
    Object.keys(F).forEach(function (k) { delete F[k]; }); F.reach = 'WhatsApp'; F.features = [];
    if (refName) { F.ref = refName; F.create = kind === 'template' ? 'One of your website templates' : kind === 'product' ? 'A digital product from your shop' : ''; }
    try { localStorage.removeItem(KEY); } catch (er) { } S.step = 0; reached = 0; render(true);
  });
  /* Enter in a one-line box moves on, like a normal form */
  root.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox') { e.preventDefault(); $('#bf-next').click(); } });

  /* ---------- sending ---------- */
  function rows() {
    return [['Looking for', F.create], [kind === 'product' ? 'Product' : kind === 'service' ? 'Service' : kind === 'template' ? 'Template' : 'About', F.ref], ['Project stage', F.stage], ['Industry', F.industry], ['Project description', F.about], ['Must-have features', (F.features || []).join(', ')], ['Current website', F.site], ['Sites they admire', F.inspo],
      ['Budget', F.budget], ['Launch', F.when], ['Content ready', F.content], ['Heard about us', F.heard], ['Anything else', F.note], ['Company', F.company], ['Role', F.role], ['Reach me by', F.reach]].filter(function (x) { return x[1]; });
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
    try { localStorage.setItem(KEY, JSON.stringify({ f: F })); } catch (e) { }
    fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload()) })
      .then(function (r) { return r.json().catch(function () { return { ok: r.ok }; }); })
      .then(function (res) {
        if (!res || !res.ok) throw new Error((res && res.error) || 'error');
        try { localStorage.removeItem(KEY); } catch (e) { }
        /* Lead only for a real submission: the hidden anti-spam field must be empty */
        try { if (window.CielPixel && !bot) CielPixel.after('Lead', { content_name: 'Project brief', content_category: 'Quote request' }); } catch (e) { }
        location.href = '/thanks';
      })
      .catch(function (e) { btn.disabled = false; btn.innerHTML = 'Send my brief' + I(IC.arrow, 18); st.className = 'bf-status bf-status--err'; st.innerHTML = (e && e.message && e.message !== 'error' ? esc(e.message) + '. ' : 'Something went wrong. ') + 'Try again, or send it on WhatsApp instead.'; });
  }
  function waLink() {
    var lines = ['Hello Ciel Africa! I’d like to start a project.', ''].concat(rows().map(function (x) { return '• ' + x[0] + ': ' + x[1]; }));
    if (F.name) lines.push('', '— ' + F.name + (F.company ? ', ' + F.company : ''));
    return 'https://wa.me/254117959105?text=' + encodeURIComponent(lines.join('\n').slice(0, 3000));
  }
  $('#bf-wa').addEventListener('click', function () { this.href = waLink(); });

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
