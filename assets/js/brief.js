/* ============================================================
   CIEL AFRICA — Project brief (quote.html)
   A guided 5-step brief. Prefills from ?template= / ?product= /
   ?service= / ?brief=, keeps a draft in this browser, and posts
   to /api/contact (emailed to the team via Resend).
   ============================================================ */
(function () {
  var root = document.getElementById('brief'); if (!root) return;
  var C = window.CIEL || {}, KEY = 'ciel:brief:v1';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var fmt = function (n) { return Number(n).toLocaleString('en-US'); };
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
    back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
    ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'
  };

  /* ---------- context from the link ---------- */
  var q = new URLSearchParams(location.search);
  var refName = q.get('template') || q.get('product') || q.get('service') || q.get('project') || '';
  var kind = q.get('template') ? 'template' : q.get('product') ? 'product' : q.get('service') ? 'service' : '';
  var ref = null;
  if (kind === 'template') ref = (C.templates || []).filter(function (t) { return t.name.toLowerCase() === refName.toLowerCase(); })[0] || null;
  if (kind === 'product') ref = (C.products || []).filter(function (t) { return t.name.toLowerCase() === refName.toLowerCase(); })[0] || null;

  /* ---------- question model ---------- */
  var NEEDS = [
    ['Customise a template', 'tpl', 'Start from one of our live templates'],
    ['New website', 'site', 'A fresh site for your brand'],
    ['Online shop', 'shop', 'Sell products with M-Pesa checkout'],
    ['Web app or business system', 'app', 'Dashboards, portals, internal tools'],
    ['Mobile app', 'mobile', 'Android and iPhone'],
    ['Payments & M-Pesa', 'pay', 'STK push, C2B, reconciliation'],
    ['Integrations & automation', 'plug', 'APIs, AI, connecting your tools'],
    ['Redesign or fix', 'fix', 'Improve what you already have'],
    ['Not sure yet', 'q', 'Help me work out what I need']
  ];
  if (kind === 'product') NEEDS.unshift(['A ready-made product', 'plug', 'Install and set up one of our products']);
  var CHANGES = ['Your logo, colours & fonts', 'Your own text & photos', 'Add or remove pages', 'Load your products or listings', 'M-Pesa payments live', 'Card payments', 'Your domain & hosting', 'Business email', 'WhatsApp on the site', 'Booking or enquiry forms', 'Training for your team', 'Something else'];
  var GOALS = ['Sell online', 'Get more enquiries', 'Take bookings', 'Look credible', 'Run operations', 'Automate manual work', 'Accept payments', 'Launch something new'];
  var FEATURES = ['M-Pesa', 'Card payments', 'Customer accounts', 'Admin dashboard', 'Bookings & calendar', 'Blog or news', 'More than one language', 'WhatsApp chat', 'SMS notifications', 'Email newsletter', 'Reports & analytics', 'Inventory & stock', 'Delivery & shipping', 'Accounting / CRM link', 'AI features', 'SEO set-up'];
  var BUDGETS = ['Under 20,000', '20,000 – 50,000', '50,000 – 100,000', '100,000 – 300,000', '300,000 – 700,000', '700,000+', 'Not sure yet'];
  var TIMES = ['As soon as possible', 'Within 2 weeks', 'Within a month', '1–3 months', 'Flexible'];

  var STEPS = [
    { id: 'you', t: 'About you', s: 'Who we’ll be working with' },
    { id: 'project', t: 'The project', s: 'What you want to build' },
    { id: 'build', t: 'Content & features', s: 'What it needs to do' },
    { id: 'plan', t: 'Budget & timing', s: 'When and how much' },
    { id: 'send', t: 'Review & send', s: 'Check and send your brief' }
  ];

  /* ---------- state (draft kept in this browser) ---------- */
  var S = { step: 0, f: {} };
  try { var saved = JSON.parse(localStorage.getItem(KEY)); if (saved && saved.f) S.f = saved.f; } catch (e) {}
  var F = S.f;
  F.country = F.country || 'Kenya';
  if (refName) { F.ref = refName; F.need = kind === 'template' ? 'Customise a template' : kind === 'product' ? 'A ready-made product' : F.need; }
  if (q.get('brief') && !F.details) F.details = q.get('brief').slice(0, 2000);
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ f: F })); } catch (e) {} }

  /* ---------- small builders ---------- */
  function field(id, label, o) {
    o = o || {}; var v = F[id] || '';
    var input = o.area ? '<textarea id="b-' + id + '" data-k="' + id + '" rows="' + (o.rows || 5) + '" placeholder="' + esc(o.ph || '') + '">' + esc(v) + '</textarea>'
      : o.select ? '<div class="bf-sel"><select id="b-' + id + '" data-k="' + id + '"><option value="">' + esc(o.ph || 'Choose…') + '</option>' + o.select.map(function (x) { return '<option' + (x === v ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select>' + I('<path d="M6 9l6 6 6-6"/>', 16) + '</div>'
      : '<input id="b-' + id + '" data-k="' + id + '" type="' + (o.type || 'text') + '" value="' + esc(v) + '" placeholder="' + esc(o.ph || '') + '"' + (o.ac ? ' autocomplete="' + o.ac + '"' : '') + (o.im ? ' inputmode="' + o.im + '"' : '') + '>';
    return '<div class="bf-f' + (o.half ? ' bf-f--h' : '') + '"><label for="b-' + id + '">' + label + (o.req ? '' : ' <small>optional</small>') + '</label>' + input + (o.hint ? '<p class="bf-hint">' + o.hint + '</p>' : '') + '<p class="bf-err" id="e-' + id + '" hidden></p></div>';
  }
  function chips(id, opts, multi, o) {
    o = o || {}; var cur = F[id] || (multi ? [] : '');
    return '<div class="bf-q"><p class="bf-ql" id="l-' + id + '">' + o.label + (multi ? ' <small class="bf-multi">choose any</small>' : '') + '</p>' +
      '<div class="bf-chips" role="' + (multi ? 'group' : 'radiogroup') + '" aria-labelledby="l-' + id + '">' + opts.map(function (x) {
        var on = multi ? cur.indexOf(x) >= 0 : cur === x;
        return '<button type="button" class="bf-chip' + (on ? ' is-on' : '') + '" data-c="' + id + '" data-v="' + esc(x) + '" data-m="' + (multi ? 1 : 0) + '" ' + (multi ? 'aria-pressed' : 'role="radio" aria-checked') + '="' + on + '">' + (multi ? '<i>' + I(IC.check, 13) + '</i>' : '') + esc(x) + '</button>';
      }).join('') + '</div><p class="bf-err" id="e-' + id + '" hidden></p></div>';
  }
  function tiles(id, opts, o) {
    o = o || {};
    return '<div class="bf-q"><p class="bf-ql" id="l-' + id + '">' + o.label + '</p><div class="bf-tiles' + (o.cls ? ' ' + o.cls : '') + '" role="radiogroup" aria-labelledby="l-' + id + '">' + opts.map(function (x) {
      var on = F[id] === x[0];
      return '<button type="button" class="bf-tile' + (on ? ' is-on' : '') + '" data-c="' + id + '" data-v="' + esc(x[0]) + '" data-m="0" role="radio" aria-checked="' + on + '"><span class="bf-tile__ic">' + I(IC[x[1]], 22) + '</span><b>' + esc(x[0]) + '</b>' + (x[2] ? '<small>' + esc(x[2]) + '</small>' : '') + '<span class="bf-tile__ok">' + I(IC.check, 14) + '</span></button>';
    }).join('') + '</div><p class="bf-err" id="e-' + id + '" hidden></p></div>';
  }

  /* ---------- steps ---------- */
  function stepHtml(i) {
    var isTpl = F.need === 'Customise a template' || kind === 'template';
    if (i === 0) return '<div class="bf-grid">' +
      field('name', 'Full name', { req: 1, ac: 'name', ph: 'Jane Wanjiru', half: 1 }) + field('email', 'Email', { req: 1, type: 'email', ac: 'email', ph: 'jane@company.co.ke', half: 1 }) +
      field('phone', 'Phone / WhatsApp', { req: 1, type: 'tel', ac: 'tel', im: 'tel', ph: '+254 7XX XXX XXX', half: 1 }) + field('company', 'Business or brand name', { ac: 'organization', ph: 'e.g. Zuri Homes', half: 1 }) +
      field('role', 'Your role', { select: ['Founder / owner', 'Director or manager', 'Marketing', 'IT / technical', 'Operations', 'Freelancer for a client', 'Other'], half: 1 }) +
      field('city', 'Town or city', { ac: 'address-level2', ph: 'Nairobi', half: 1 }) +
      field('website', 'Current website or social page', { type: 'url', ph: 'https://… or @yourbrand', hint: 'Helps us see your brand and audience before we reply.' }) +
      '</div>' +
      tiles('contact', [['WhatsApp', 'wa', ''], ['Phone call', 'call', ''], ['Email', 'mail', '']], { label: 'Best way to reach you', cls: 'bf-tiles--3' }) +
      chips('time', ['Morning', 'Afternoon', 'Evening', 'Any time'], false, { label: 'Best time to talk' });
    if (i === 1) return (kind === 'template' || kind === 'product' ? '' : tiles('need', NEEDS, { label: 'What are you after?' })) +
      (isTpl ? chips('changes', CHANGES, true, { label: 'What should we change on the template?' }) : '') +
      chips('stage', ['Brand-new idea', 'Replacing an existing site or system', 'Adding features', 'Fixing something that’s broken'], false, { label: 'Where are you starting from?' }) +
      chips('goals', GOALS, true, { label: 'What should it achieve?' }) +
      '<div class="bf-grid">' + field('audience', 'Who is it for?', { ph: 'e.g. young professionals in Nairobi who shop on their phones' }) +
      field('details', 'Tell us about it', { req: 1, area: 1, rows: 6, ph: isTpl ? 'What’s your business, what should the site help you do, and what would you change first?' : 'What are you building, who will use it, and what does success look like?' }) + '</div>';
    if (i === 2) return chips('brand', ['Logo & brand colours ready', 'Logo only', 'I need branding'], false, { label: 'Logo and brand' }) +
      chips('content', ['Text & photos ready', 'Partly ready', 'Need help with content'], false, { label: 'Words and photos' }) +
      '<div class="bf-grid">' + field('size', 'Roughly how big?', { select: ['1–5 pages', '6–15 pages', '16+ pages', 'Under 50 products', '50–500 products', '500+ products', 'Not sure'], half: 1 }) +
      field('users', 'Who logs in?', { select: ['Nobody, it’s public', 'Customers', 'Staff', 'Customers and staff', 'Not sure'], half: 1 }) + '</div>' +
      chips('features', FEATURES, true, { label: 'Features you’ll need' }) +
      chips('domain', ['I have a domain', 'I need a domain', 'Not sure'], false, { label: 'Domain name' }) +
      (F.domain === 'I have a domain' ? '<div class="bf-grid">' + field('domainName', 'Which domain?', { ph: 'yourbrand.co.ke' }) + '</div>' : F.domain === 'I need a domain' ? '<p class="bf-note">' + I(IC.site, 16) + '<span>You can <a href="domains.html" target="_blank" rel="noopener">search for one now</a>, or we’ll help you choose.</span></p>' : '') +
      chips('hosting', ['Ciel Africa hosts it', 'I already have hosting', 'Not sure'], false, { label: 'Hosting' }) +
      '<div class="bf-grid">' + field('likes', 'Sites or apps you like', { area: 1, rows: 3, ph: 'Paste links, and tell us what you like about each one' }) +
      field('files', 'Links to files', { ph: 'Google Drive, Dropbox or WeTransfer link to your logo, content or designs' }) + '</div>';
    if (i === 3) {
      var hint = ref && ref.price ? 'The ' + esc(ref.name) + ' template starts from KES ' + fmt(ref.price) + ' one-time set-up.' : 'A rough range is fine. It helps us suggest the right approach.';
      return chips('budget', BUDGETS, false, { label: 'Budget (KES)', req: 1 }) + '<p class="bf-hint bf-hint--q">' + hint + '</p>' +
        chips('timeline', TIMES, false, { label: 'When do you need it?', req: 1 }) +
        '<div class="bf-grid">' + field('deadline', 'Launch date or deadline', { type: 'date', half: 1, hint: 'An event, a season or a campaign date.' }) +
        field('heard', 'How did you hear about us?', { select: ['Google search', 'Instagram', 'TikTok', 'LinkedIn', 'X / Twitter', 'A friend or client', 'Saw a site we built', 'Other'], half: 1 }) + '</div>' +
        chips('decide', ['I make the decision', 'I’ll share it with my team', 'Comparing a few quotes'], false, { label: 'Who decides?' }) +
        chips('support', ['Yes, monthly support', 'Maybe later', 'No, just the build'], false, { label: 'Updates and support after launch?' });
    }
    return reviewHtml();
  }

  var LABELS = { name: 'Name', email: 'Email', phone: 'Phone / WhatsApp', company: 'Business', role: 'Role', city: 'Town or city', country: 'Country', website: 'Website / social', contact: 'Reach me by', time: 'Best time',
    ref: kind === 'product' ? 'Product' : kind === 'service' ? 'Service' : 'Template', need: 'Looking for', changes: 'Template changes', stage: 'Starting point', goals: 'Goals', audience: 'Audience', details: 'About the project',
    brand: 'Logo & brand', content: 'Words & photos', size: 'Size', users: 'Who logs in', features: 'Features', domain: 'Domain', domainName: 'Domain name', hosting: 'Hosting', likes: 'Sites they like', files: 'Files',
    budget: 'Budget (KES)', timeline: 'Timeline', deadline: 'Deadline', heard: 'Heard about us', decide: 'Decision', support: 'Support after launch' };
  var GROUPS = [['About you', ['name', 'email', 'phone', 'company', 'role', 'city', 'website', 'contact', 'time']], ['The project', ['ref', 'need', 'changes', 'stage', 'goals', 'audience', 'details']], ['Content & features', ['brand', 'content', 'size', 'users', 'features', 'domain', 'domainName', 'hosting', 'likes', 'files']], ['Budget & timing', ['budget', 'timeline', 'deadline', 'heard', 'decide', 'support']]];
  function val(k) { var v = F[k]; return Array.isArray(v) ? v.join(', ') : (v || ''); }
  function reviewHtml() {
    return '<div class="bf-review">' + GROUPS.map(function (g, gi) {
      var rows = g[1].filter(function (k) { return val(k); }).map(function (k) { return '<div class="bf-rv"><dt>' + LABELS[k] + '</dt><dd>' + esc(val(k)) + '</dd></div>'; }).join('');
      return '<section class="bf-rg"><div class="bf-rg__h"><h3>' + g[0] + '</h3><button type="button" class="bf-link" data-go="' + gi + '">' + I(IC.edit, 14) + 'Edit</button></div>' + (rows ? '<dl>' + rows + '</dl>' : '<p class="bf-empty">Nothing added yet.</p>') + '</section>';
    }).join('') + '</div>' +
      '<label class="bf-consent"><input type="checkbox" id="b-consent"' + (F.consent ? ' checked' : '') + '><span class="bf-box">' + I(IC.check, 13) + '</span><span>Ciel Africa may contact me about this project. See our <a href="privacy.html" target="_blank" rel="noopener">privacy policy</a>.</span></label><p class="bf-err" id="e-consent" hidden></p>';
  }

  /* ---------- live summary (aside) ---------- */
  var REQ = ['name', 'email', 'phone', 'need', 'details', 'budget', 'timeline'];
  var NICE = ['company', 'contact', 'stage', 'goals', 'brand', 'content', 'features', 'domain', 'deadline', 'likes'];
  function score() { var a = REQ.filter(function (k) { return val(k); }).length * 2, b = NICE.filter(function (k) { return val(k); }).length; return Math.round((a + b) / (REQ.length * 2 + NICE.length) * 100); }
  function aside() {
    var p = score(), items = [
      ['Name', F.name], ['Business', F.company], [LABELS.ref, F.ref], ['Looking for', F.need],
      ['Changes', (F.changes || []).length ? U((F.changes || []).length, 'change') : ''], ['Features', (F.features || []).length ? U((F.features || []).length, 'feature') : ''],
      ['Budget', F.budget ? 'KES ' + F.budget : ''], ['Timeline', F.timeline], ['Reach by', F.contact]
    ];
    $('#bf-sum').innerHTML = '<div class="bf-meter"><div><b>' + p + '%</b><span>' + (p < 40 ? 'Just getting started' : p < 75 ? 'Looking good' : p < 100 ? 'Almost there' : 'Complete brief') + '</span></div><i><span style="width:' + p + '%"></span></i></div>' +
      '<ul class="bf-sumlist">' + items.map(function (x) { return '<li class="' + (x[1] ? 'is-set' : '') + '"><span>' + x[0] + '</span><b>' + (x[1] ? esc(x[1]) : '—') + '</b></li>'; }).join('') + '</ul>';
  }
  function U(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }

  /* ---------- render ---------- */
  function render(focus) {
    $('#bf-steps').innerHTML = STEPS.map(function (s, i) { return '<li class="' + (i === S.step ? 'is-on' : i < S.step ? 'is-done' : '') + '"><button type="button" data-go="' + i + '"' + (i > maxStep() ? ' disabled' : '') + ' aria-current="' + (i === S.step ? 'step' : 'false') + '"><span>' + (i < S.step ? I(IC.check, 13) : i + 1) + '</span><b>' + s.t + '</b></button></li>'; }).join('');
    $('#bf-bar').style.width = ((S.step) / (STEPS.length - 1) * 100) + '%';
    var s = STEPS[S.step];
    $('#bf-body').innerHTML = '<div class="bf-head"><p class="bf-kicker">Step ' + (S.step + 1) + ' of ' + STEPS.length + '</p><h2>' + s.t + '</h2><p>' + s.s + '</p></div>' + stepHtml(S.step);
    $('#bf-back').hidden = S.step === 0;
    var last = S.step === STEPS.length - 1;
    $('#bf-next').innerHTML = last ? 'Send project brief' + I(IC.arrow, 18) : 'Continue' + I(IC.arrow, 18);
    $('#bf-next').classList.toggle('bf-send', last);
    $('#bf-wa').hidden = !last;
    if (last) $('#bf-wa').href = waLink();
    aside();
    if (focus) { var h = $('#bf-body h2'); h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); var top = root.getBoundingClientRect().top + scrollY - 100; if (scrollY > top) scrollTo({ top: top, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }
  }
  var reached = 0;
  function maxStep() { return Math.max(reached, S.step); }

  /* ---------- validation ---------- */
  function err(k, msg) { var e = document.getElementById('e-' + k); if (!e) return !msg; e.textContent = msg || ''; e.hidden = !msg; var el = document.getElementById('b-' + k); if (el) el.setAttribute('aria-invalid', msg ? 'true' : 'false'); return !msg; }
  function check(i) {
    var ok = true, first = null;
    function need(k, msg) { var good = !!val(k); if (!err(k, good ? '' : msg)) { ok = false; first = first || k; } }
    if (i === 0) {
      need('name', 'Please add your name.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(F.email || '')) { err('email', 'Enter a valid email, like name@company.co.ke.'); ok = false; first = first || 'email'; } else err('email', '');
      if (!/^\+?[\d\s()-]{9,}$/.test(F.phone || '')) { err('phone', 'Enter a phone or WhatsApp number we can reach.'); ok = false; first = first || 'phone'; } else err('phone', '');
    }
    if (i === 1) { need('need', 'Choose what you’re after.'); if ((F.details || '').trim().length < 15) { err('details', 'Tell us a little more (a sentence or two is enough).'); ok = false; first = first || 'details'; } else err('details', ''); }
    if (i === 3) { need('budget', 'Choose a rough budget, or “Not sure yet”.'); need('timeline', 'Choose when you need it.'); }
    if (i === 4 && !F.consent) { err('consent', 'Please confirm we can contact you about this project.'); ok = false; first = first || 'consent'; }
    if (!ok) { var el = document.getElementById('b-' + first) || $('[data-c="' + first + '"]'); if (el) { el.focus(); el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } }
    return ok;
  }

  /* ---------- events ---------- */
  root.addEventListener('input', function (e) { var k = e.target.getAttribute('data-k'); if (!k) return; F[k] = e.target.value; if (e.target.getAttribute('aria-invalid') === 'true') err(k, ''); save(); aside(); });
  root.addEventListener('change', function (e) { if (e.target.id === 'b-consent') { F.consent = e.target.checked; err('consent', ''); save(); } });
  root.addEventListener('click', function (e) {
    var c = e.target.closest('[data-c]');
    if (c) {
      var k = c.getAttribute('data-c'), v = c.getAttribute('data-v'), multi = c.getAttribute('data-m') === '1';
      if (multi) { var a = F[k] = F[k] || [], ix = a.indexOf(v); if (ix >= 0) a.splice(ix, 1); else a.push(v); c.classList.toggle('is-on', ix < 0); c.setAttribute('aria-pressed', ix < 0); }
      else { F[k] = F[k] === v && k !== 'need' ? '' : v; $$('[data-c="' + k + '"]').forEach(function (b) { var on = F[k] === b.getAttribute('data-v'); b.classList.toggle('is-on', on); b.setAttribute('aria-checked', on); }); }
      err(k, ''); save(); aside();
      if (k === 'domain' || k === 'need') { var y = scrollY; render(false); scrollTo(0, y); var again = $('[data-c="' + k + '"][data-v="' + CSS.escape(v) + '"]'); again && again.focus({ preventScroll: true }); }
    }
    var g = e.target.closest('[data-go]');
    if (g && !g.disabled) { var to = +g.getAttribute('data-go'); if (to > S.step && !check(S.step)) return; S.step = to; reached = Math.max(reached, to); render(true); }
  });
  $('#bf-back').addEventListener('click', function () { if (S.step > 0) { S.step--; render(true); } });
  $('#bf-next').addEventListener('click', function () {
    if (!check(S.step)) return;
    if (S.step < STEPS.length - 1) { S.step++; reached = Math.max(reached, S.step); render(true); return; }
    send();
  });
  $('#bf-reset').addEventListener('click', function () {
    if (!window.confirm('Clear everything you’ve entered?')) return;
    Object.keys(F).forEach(function (k) { delete F[k]; }); F.country = 'Kenya'; if (refName) { F.ref = refName; F.need = kind === 'template' ? 'Customise a template' : kind === 'product' ? 'A ready-made product' : ''; }
    try { localStorage.removeItem(KEY); } catch (er) {} S.step = 0; reached = 0; render(true);
  });

  /* ---------- sending ---------- */
  function payload() {
    var hp = document.getElementById('bf-honey');
    var d = { _form: 'brief', _honey: hp ? hp.value : '', _ref: F.ref || '', 'Name': F.name, 'Email': F.email };
    GROUPS.forEach(function (g) {
      var ks = g[1].filter(function (k) { return k !== 'name' && k !== 'email' && val(k); });
      if (!ks.length) return;
      d['## ' + g[0]] = g[0];
      ks.forEach(function (k) { d[LABELS[k]] = val(k); });
    });
    return d;
  }
  function send() {
    var btn = $('#bf-next'), st = $('#bf-status'); btn.disabled = true; btn.innerHTML = 'Sending…';
    st.className = 'bf-status'; st.textContent = '';
    fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload()) })
      .then(function (r) { return r.json().catch(function () { return { ok: r.ok }; }); })
      .then(function (res) { if (!res || !res.ok) throw new Error((res && res.error) || 'error'); try { localStorage.removeItem(KEY); } catch (e) {} location.href = 'thanks.html'; })
      .catch(function () { btn.disabled = false; render(false); st.className = 'bf-status bf-status--err'; st.innerHTML = 'Something went wrong sending your brief. Try again, send it on WhatsApp, or email <a href="mailto:hello@cielafrica.com">hello@cielafrica.com</a>.'; });
  }
  function waLink() {
    var lines = ['Hello Ciel Africa, here is my project brief.', ''];
    GROUPS.forEach(function (g) { var r = g[1].filter(function (k) { return val(k); }).map(function (k) { return '• ' + LABELS[k] + ': ' + val(k); }); if (r.length) { lines.push('*' + g[0] + '*'); lines = lines.concat(r); lines.push(''); } });
    return 'https://wa.me/254117959105?text=' + encodeURIComponent(lines.join('\n').slice(0, 3500));
  }

  /* ---------- context card ---------- */
  var ctx = $('#bf-ctx');
  if (refName) {
    var img = ref && ref.image ? '<span class="bf-ctx__img"><img src="' + esc(ref.image) + '" alt=""></span>' : '';
    var price = ref && ref.price > 0 ? '<span class="bf-ctx__p">From KES ' + fmt(ref.price) + (kind === 'template' ? ' <small>one-time set-up</small>' : '') + '</span>' : '';
    var live = ref && ref.demo ? '<a class="bf-link" href="' + esc(ref.demo) + '" target="_blank" rel="noopener">View the live template' + I(IC.ext, 14) + '</a>' : '';
    ctx.innerHTML = img + '<div><p class="bf-kicker">You’re ' + (kind === 'template' ? 'customising' : kind === 'product' ? 'asking about' : 'asking about') + '</p><h2>' + esc(refName) + '</h2>' + (ref && ref.idealFor ? '<p class="bf-ctx__d">' + esc(ref.category || '') + ' · ' + esc(ref.idealFor) + '</p>' : '') + '<div class="bf-ctx__row">' + price + live + '<a class="bf-link" href="' + (kind === 'product' ? 'products.html' : 'templates.html') + '">Change</a></div></div>';
    ctx.hidden = false;
  }

  render(false);
})();
