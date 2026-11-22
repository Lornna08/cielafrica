/* ============================================================
   CIEL AFRICA — Start a project (quote.html)
   The order a studio would ask in:
     1. You: name and how to reach you
     2. What we're building: the kind of project, then its category
     3. Domain (websites and platforms only): have one, or search
     4. The must-haves that fit that category
     5. Budget and timing (last, and optional)
   Dropdowns where a choice is natural, plain boxes where words are
   better. Fields never re-draw while you type. Prefills from
   ?template= / ?product= / ?service= / ?brief=, keeps a draft in this
   browser, and posts to /api/contact (emailed and saved as a lead).
   ============================================================ */
(function () {
  var root = document.getElementById('brief'); if (!root) return;
  var C = window.CIEL || {}, KEY = 'ciel:brief:v4';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var $ = function (s, r) { return (r || root).querySelector(s); };
  var I = function (p, s) { return '<svg width="' + (s || 20) + '" height="' + (s || 20) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>'; };
  var IC = { check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>', ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>', search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>' };
  var money = function (n) { return n == null ? '' : 'KES ' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); };

  /* ---------- what people can ask us to build ---------- */
  var TYPES = [
    { id: 'web', name: 'A website', cats: ['Business or company website', 'Online store (e-commerce)', 'Start from one of your website templates', 'Portfolio', 'Personal brand or CV website', 'Landing page for a product or campaign', 'Blog or magazine', 'News or media website', 'Restaurant, café or food business', 'Hotel, lodge, guest house or Airbnb', 'Travel or tour company', 'Real estate and property listings', 'School, college or training centre', 'Church or faith organisation', 'NGO, foundation or non-profit', 'Wedding or event website', 'Photography or creative studio', 'Salon, spa or beauty business', 'Clinic, hospital or health practice', 'Law firm or professional services', 'Construction, engineering or architecture', 'Car dealer or automotive', 'Fashion or clothing brand', 'Fitness, gym or sports club', 'Music, artist or entertainment', 'Agriculture or agribusiness', 'Logistics, transport or courier', 'Directory or listings website', 'Marketplace with many sellers', 'Membership or community website', 'Online courses (e-learning)', 'Booking and appointments website', 'Job board or recruitment', 'Donations or fundraising', 'Government, county or institution', 'Something else'] },
    { id: 'dash', name: 'A web app or work dashboard', cats: ['Admin or operations dashboard', 'CRM: clients, leads and follow-ups', 'Inventory and stock management', 'Point of sale (POS)', 'HR, staff and payroll', 'Tasks, projects and team work', 'Booking and scheduling system', 'Fleet, delivery or dispatch tracking', 'School management system', 'Hospital or clinic management', 'SACCO, microfinance or loans', 'Property and rent management', 'Church or members management', 'Event ticketing and check-in', 'Customer or client portal', 'Reports and analytics (BI)', 'Internal tool for my team', 'Something else'] },
    { id: 'saas', name: 'A SaaS platform', cats: ['B2B software for other businesses', 'Subscription platform', 'Marketplace platform', 'Fintech or payments platform', 'EdTech or learning platform', 'HealthTech platform', 'PropTech or property platform', 'AgriTech platform', 'Logistics or delivery platform', 'HR or recruitment platform', 'Booking platform', 'AI-powered SaaS', 'Something else'] },
    { id: 'app', name: 'A mobile app (Android and iPhone)', cats: ['Company or business app', 'Shopping app', 'Delivery or ride app', 'Booking app', 'Wallet, savings or fintech app', 'Social or community app', 'Education or learning app', 'Health and fitness app', 'App for my existing website or system', 'Staff or field-team app', 'Event app', 'Something else'] },
    { id: 'soft', name: 'Business software or a system', cats: ['ERP for my whole business', 'Accounting and invoicing', 'Manufacturing or production', 'Government or institutional system', 'Desktop software (Windows or Mac)', 'Works-offline system', 'Hardware, IoT or devices', 'Replace spreadsheets with a proper system', 'Something else'] },
    { id: 'digital', name: 'A digital product', cats: ['One of your shop products', 'Website template', 'Dashboard or admin template', 'UI kit or design system', 'Mobile app template', 'Notion or spreadsheet template', 'eBook or guide', 'Online course', 'Printables or planners', 'Graphics, icons or brand kit', 'Code script or starter kit', 'Something else'] },
    { id: 'plugin', name: 'A plugin or extension', cats: ['WordPress plugin', 'WooCommerce extension', 'Shopify app', 'Payment plugin (M-Pesa or cards)', 'Chrome or browser extension', 'Figma plugin', 'VS Code extension', 'Something else'] },
    { id: 'api', name: 'An integration or API', cats: ['M-Pesa (Daraja) integration', 'Card payments integration', 'SMS or WhatsApp messaging', 'Email automation', 'Connect two systems I already use', 'An API for my own product', 'Accounting sync (QuickBooks, Odoo, Sage…)', 'Google Workspace or Microsoft 365', 'Something else'] },
    { id: 'ai', name: 'AI or automation', cats: ['AI chatbot or assistant', 'WhatsApp bot', 'Automate a workflow', 'Read and sort documents (OCR)', 'AI content or writing tool', 'Recommendations', 'Data analysis and forecasting', 'Something else'] },
    { id: 'trade', name: 'A trading system', cats: ['Expert Advisor (MT4 or MT5)', 'Custom indicator', 'Trading bot (forex or crypto)', 'Copy-trading system', 'Trading journal or dashboard', 'Signals platform', 'Something else'] },
    { id: 'design', name: 'Design and branding', cats: ['Logo and brand identity', 'UI/UX design for a website or app', 'Redesign of something I have (design only)', 'Pitch deck', 'Social media kit', 'Packaging or print', 'Something else'] },
    { id: 'care', name: 'Hosting, fixes and support', cats: ['Ongoing maintenance', 'Fix bugs or errors', 'Make my site faster', 'Move my site to new hosting', 'Security, SSL and backups', 'Business email setup', 'Cloud or DevOps setup', 'Something else'] },
    { id: 'other', name: 'Something else', cats: [] }
  ];
  var TYPE = {}; TYPES.forEach(function (t) { TYPE[t.name] = t; });
  var DOMAIN_TYPES = { web: 1, saas: 1 };

  /* ---------- must-haves, grouped; each category picks the groups that fit ---------- */
  var MPESA = 'M-Pesa STK push (customer pays from their phone)', CARD = 'Card payment gateway (Visa and Mastercard)';
  var G = {
    store: ['Online store', [MPESA, CARD, 'Cash on delivery', 'Products with options (size, colour…)', 'Stock tracking', 'Delivery areas and shipping fees', 'Order tracking for customers', 'Discount codes and coupons', 'Customer accounts and order history', 'Wishlist', 'Product reviews and ratings', 'Order on WhatsApp button', 'Abandoned cart reminders', 'Email or SMS receipts', 'Several currencies', 'Sell digital downloads', 'Import products from Excel', 'Connect to my shop counter (POS)']],
    booking: ['Bookings', ['Online booking calendar', 'Pay a deposit with M-Pesa', CARD, 'SMS or WhatsApp reminders', 'Staff, rooms or slots availability', 'Google Calendar sync', 'Cancel and reschedule online', 'Customer accounts']],
    food: ['Restaurant', ['Online menu', 'Food ordering and delivery', 'Table reservations', MPESA, CARD]],
    hotel: ['Stays', ['Room booking with availability', MPESA, CARD, 'Rates by season', 'Booking.com or Airbnb calendar sync', 'Photo galleries per room']],
    travel: ['Tours', ['Tour packages and itineraries', 'Booking requests or instant booking', MPESA, CARD, 'Prices in several currencies']],
    property: ['Property', ['Listings with search and filters', 'Map search', 'Enquiry button per listing', 'Agent profiles', 'Video or virtual tours', 'Mortgage calculator', 'Agents can post listings']],
    school: ['School', ['Online admissions and applications', 'Pay fees with M-Pesa', 'Student and parent portal', 'Results and report cards', 'Timetables and calendar', 'Course materials and e-learning']],
    ngo: ['Giving', ['Online donations (M-Pesa)', 'Online donations (card)', 'Monthly giving', 'Volunteer sign-up', 'Projects and impact stories', 'Reports and downloads']],
    church: ['Church', ['Online giving (M-Pesa)', 'Sermons (audio and video)', 'Live stream', 'Events calendar', 'Prayer requests', 'Members area']],
    events: ['Events', ['RSVP or registration', 'Ticket sales (M-Pesa and card)', 'QR tickets and check-in', 'Schedule and speakers', 'Countdown', 'Photo gallery after the event']],
    market: ['Marketplace', ['Sellers sign up and manage their shop', 'Commission and payouts to sellers', 'Ratings and reviews', 'Search and filters', 'Hold payment until delivery (escrow)', 'Approve listings before they go live', MPESA, CARD]],
    member: ['Members', ['Sign up and login', 'Paid memberships (M-Pesa and card)', 'Members-only content', 'Member directory', 'Forum or community']],
    course: ['Courses', ['Video lessons and modules', 'Quizzes and certificates', 'Paid courses (M-Pesa and card)', 'Student progress', 'Live classes (Zoom or Meet)']],
    jobs: ['Jobs', ['Employers post jobs', 'CV upload and applications', 'Paid job posts', 'Job alerts by email']],
    gallery: ['Showcase', ['Portfolio or gallery', 'Case studies', 'Video showreel', 'Client proofing or downloads', 'Instagram feed']],
    health: ['Health', ['Book appointments', 'Doctor or service profiles', 'Patient forms online', 'Telemedicine (video calls)', 'Insurance partners list']],
    site: ['Website essentials', ['Contact form', 'WhatsApp chat button', 'Google Maps and directions', 'Blog or news', 'Newsletter sign-up', 'Testimonials', 'FAQ', 'Several languages', 'Search engine setup (SEO)', 'Google Analytics and Meta Pixel', 'Downloadable brochure (PDF)', 'Social media links and feeds', 'I can edit it myself']],
    dash: ['System', ['User roles and permissions', 'Staff logins', 'Reports and charts', 'Export to Excel and PDF', 'Activity log (who did what)', 'M-Pesa payments and reconciliation', 'SMS, WhatsApp or email alerts', 'Works offline', 'Works well on phones', 'Import data from Excel', 'Connects to systems I already use', 'Several branches or locations', 'Approvals', 'Document uploads', 'Invoices and receipts', 'Customer portal']],
    saas: ['Platform', ['Sign-up and free trial', 'Subscription billing (M-Pesa and card)', 'Teams and roles', 'Each customer’s data kept separate', 'Super-admin dashboard', 'Plans and usage limits', 'API for customers', 'Onboarding emails', 'Usage analytics', 'Custom domains for customers']],
    app: ['App', ['Android app', 'iPhone app', 'Push notifications', 'Login with phone, Google or Apple', 'In-app payments (M-Pesa and card)', 'Maps and location', 'Chat or messaging', 'Works offline', 'Camera and photo upload', 'Admin dashboard to manage the app', 'Publish to Play Store and App Store']],
    delivery: ['Delivery', ['Live tracking on a map', 'Driver or rider app', 'Dispatch dashboard', 'Proof of delivery (photo or signature)', 'Route planning']],
    fin: ['Money', ['M-Pesa C2B (collect payments)', 'M-Pesa B2C (send payouts)', 'Wallets and balances', 'Loan applications and scoring', 'ID verification (KYC)', 'Statements', 'Two-step login security']],
    soft: ['Software', ['Accounting and invoicing', 'Stock and purchasing', 'HR and payroll', 'Reports and charts', 'User roles and permissions', 'Works offline', 'Backups', 'Several branches or locations', 'Move my old data in']],
    digital: ['Product', ['Instant download after payment', 'Licence keys', 'Documentation', 'Live preview page', 'Sell it on my own website', 'Free updates for buyers', 'Figma or source files']],
    plugin: ['Plugin', ['Settings page', 'Licence and auto-updates', 'Works with the latest WordPress and WooCommerce', MPESA, CARD, 'Documentation', 'Listed on a marketplace']],
    api: ['Integration', ['Test in a sandbox first', 'Callbacks and webhooks', 'Logs and automatic retries', 'Reconciliation reports', 'Security review']],
    ai: ['AI', ['Learns from my documents', 'Works on WhatsApp', 'Chat on my website', 'Hands over to a person', 'English and Swahili', 'Conversation reports']],
    trade: ['Trading', ['MetaTrader 4', 'MetaTrader 5', 'Backtest report', 'Risk settings (lot size, SL and TP)', 'Telegram alerts', 'Prop-firm rules', 'Source code included']],
    design: ['Design', ['Logo variations', 'Brand guidelines', 'Figma files', 'Social media templates', 'Print-ready files']],
    care: ['Support', ['Monthly maintenance', 'Speed improvements', 'Security and SSL', 'Daily backups', 'Uptime monitoring', 'Business email']]
  };
  function groupsFor(type, cat) {
    var c = String(cat || '').toLowerCase(), g = [];
    var has = function (re) { return re.test(c); };
    if (type === 'web') {
      if (has(/online store|fashion|template/)) g.push('store');
      if (has(/restaurant/)) g.push('food');
      if (has(/hotel/)) g.push('hotel');
      if (has(/travel/)) g.push('travel');
      if (has(/real estate/)) g.push('property');
      if (has(/school/)) g.push('school');
      if (has(/ngo|donation/)) g.push('ngo');
      if (has(/church/)) g.push('church');
      if (has(/wedding|event|music/)) g.push('events');
      if (has(/marketplace/)) g.push('market', 'store');
      if (has(/membership|fitness/)) g.push('member');
      if (has(/courses/)) g.push('course');
      if (has(/job board/)) g.push('jobs');
      if (has(/portfolio|photography|personal brand|construction|car dealer/)) g.push('gallery');
      if (has(/clinic/)) g.push('health');
      if (has(/booking|salon|fitness|clinic/)) g.push('booking');
      if (has(/logistics/)) g.push('delivery');
      g.push('site');
    }
    else if (type === 'dash') { if (has(/fleet|delivery/)) g.push('delivery'); if (has(/sacco|loan/)) g.push('fin'); if (has(/booking/)) g.push('booking'); if (has(/event/)) g.push('events'); if (has(/school/)) g.push('school'); g.push('dash'); }
    else if (type === 'saas') { g.push('saas'); if (has(/fintech/)) g.push('fin'); if (has(/marketplace/)) g.push('market'); if (has(/logistics/)) g.push('delivery'); if (has(/booking/)) g.push('booking'); if (has(/edtech/)) g.push('course'); }
    else if (type === 'app') { g.push('app'); if (has(/shopping/)) g.push('store'); if (has(/delivery/)) g.push('delivery'); if (has(/wallet/)) g.push('fin'); if (has(/booking/)) g.push('booking'); }
    else if (G[type]) g.push(type);
    return g.filter(function (x, i) { return g.indexOf(x) === i; });
  }

  var STAGE = ['A new build from scratch', 'A redesign or rebuild of something I have', 'New features for something I have', 'Fixes or improvements to something I have'];
  var INDUSTRY = ['Retail and e-commerce', 'Food, hospitality and travel', 'Health and wellness', 'Education and training', 'Finance, SACCO and microfinance', 'Real estate and property', 'Logistics and transport', 'Manufacturing and agriculture', 'NGO and non-profit', 'Faith organisation', 'Government and public sector', 'Media, creative and events', 'Professional services', 'Technology and startups', 'Personal brand', 'Other'];
  var SIZE = {
    store: ['How many products will you sell?', ['Under 20', '20 – 100', '100 – 1,000', 'Over 1,000', 'Not sure yet']],
    dash: ['How many people will use it?', ['Just me', '2 – 10', '11 – 50', '51 – 200', 'Over 200', 'The public (customers too)']],
    site: ['How many pages do you picture?', ['One page', '2 – 5 pages', '6 – 10 pages', 'More than 10', 'Not sure, advise me']]
  };
  var HAVE = ['Yes, I already have one', 'No, help me find one', 'Not sure yet'];
  var BUDGET = ['Under KES 25,000', 'KES 25,000 – 50,000', 'KES 50,000 – 100,000', 'KES 100,000 – 250,000', 'KES 250,000 – 500,000', 'Over KES 500,000', 'I’d like your advice on this'];
  var WHEN = ['As soon as possible', 'Within a month', 'In 1 – 3 months', 'In 3 – 6 months', 'Flexible, no fixed date'];
  var CONTENT = ['Yes, text and images are ready', 'Some of it', 'Not yet, I’d like help with it', 'Not needed for this project'];
  var HEARD = ['Google search', 'Instagram', 'Facebook', 'TikTok', 'LinkedIn', 'A friend or colleague', 'Saw a site you built', 'Other'];
  var REACH = ['WhatsApp', 'A phone call', 'Email'];

  /* ---------- where they came from ---------- */
  var q = new URLSearchParams(location.search);
  var refName = (q.get('template') || q.get('product') || q.get('service') || q.get('project') || '').slice(0, 120);
  var kind = q.get('template') ? 'template' : q.get('product') ? 'product' : q.get('service') ? 'service' : '';
  var ref = null;
  if (kind === 'template') ref = (C.templates || []).filter(function (t) { return t.name.toLowerCase() === refName.toLowerCase(); })[0] || null;
  if (kind === 'product') ref = (C.products || []).filter(function (t) { return t.name.toLowerCase() === refName.toLowerCase(); })[0] || null;
  function guess(name) {
    var n = String(name || '').toLowerCase();
    var r = [[/shop|store|commerce/, 'web', 'Online store (e-commerce)'], [/trading|expert advisor|\bea\b|indicator/, 'trade', ''], [/m-?pesa|payment|daraja/, 'api', 'M-Pesa (Daraja) integration'], [/\bapi\b|integration/, 'api', ''], [/\bai\b|chatbot|automation|bot\b/, 'ai', ''], [/saas|platform/, 'saas', ''], [/mobile|android|iphone|\bapp\b/, 'app', ''], [/dashboard|portal|crm|system|management/, 'dash', ''], [/design|brand|logo|ui\/ux|ux/, 'design', ''], [/maint|hosting|support|devops|cloud/, 'care', ''], [/wordpress|plugin/, 'plugin', ''], [/landing/, 'web', 'Landing page for a product or campaign'], [/web|site/, 'web', '']];
    for (var i = 0; i < r.length; i++) if (r[i][0].test(n)) { var t = TYPES.filter(function (x) { return x.id === r[i][1]; })[0]; return [t.name, r[i][2]]; }
    return ['', ''];
  }

  /* ---------- state (a draft is kept in this browser) ---------- */
  var S = { step: 0 }, F = {};
  try { var saved = JSON.parse(localStorage.getItem(KEY)); if (saved && saved.f) F = saved.f; } catch (e) { }
  function fromRef() {
    if (!refName) return; F.ref = refName;
    if (F.type) return;
    if (kind === 'template') { F.type = 'A website'; F.cat = 'Start from one of your website templates'; }
    else if (kind === 'product') { F.type = 'A digital product'; F.cat = 'One of your shop products'; }
    else { var g = guess(refName); F.type = g[0]; F.cat = g[1]; }
  }
  fromRef();
  if (q.get('brief') && !F.about) F.about = q.get('brief').slice(0, 1500);
  F.reach = F.reach || 'WhatsApp';
  F.features = F.features || [];
  var saveT = null;
  function save() { clearTimeout(saveT); saveT = setTimeout(function () { try { localStorage.setItem(KEY, JSON.stringify({ f: F })); } catch (e) { } }, 250); }
  function typeId() { return (TYPE[F.type] || {}).id || ''; }
  function needsDomain() { return !!DOMAIN_TYPES[typeId()]; }

  /* the steps depend on what they're building */
  function steps() {
    var s = [{ k: 'you', n: 'You', t: 'First, about you', s: 'So we know who we’re talking to and how to reply.' },
      { k: 'what', n: 'Project', t: 'What are we building?', s: 'Pick the closest match. You’ll describe it in your own words next.' }];
    if (needsDomain()) s.push({ k: 'domain', n: 'Domain', t: 'Your domain name', s: 'The address people will type to find you, like yourbrand.co.ke.' });
    s.push({ k: 'need', n: 'Must-haves', t: 'What must it do?', s: 'Tick what matters. Anything you’re unsure about, we’ll advise.' });
    s.push({ k: 'plan', n: 'Budget & timing', t: 'Budget and timing', s: 'Optional, but it helps us suggest the right approach.' });
    return s;
  }

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
    return '<div class="bf-f' + (o.half ? ' bf-f--h' : '') + '"' + (o.wrap ? ' id="' + o.wrap + '"' : '') + '>' + lab(id, label, o) + '<div class="bf-sel"><select id="b-' + id + '" data-k="' + id + '"><option value="">' + esc(o.ph || 'Choose one') + '</option>' + list.map(function (x) { return '<option' + (x === v ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select></div>' + (o.hint ? '<p class="bf-hint">' + o.hint + '</p>' : '') + '<p class="bf-err" id="e-' + id + '" hidden></p></div>';
  }
  function checks(id, label, list, note) {
    var cur = F[id] || [];
    return '<div class="bf-f"><p class="bf-lab">' + label + (note ? ' <small>' + note + '</small>' : '') + '</p><div class="bf-checks">' + list.map(function (x) { var on = cur.indexOf(x) >= 0; return '<label class="bf-ck' + (on ? ' is-on' : '') + '"><input type="checkbox" data-ck="' + id + '" value="' + esc(x) + '"' + (on ? ' checked' : '') + '><i>' + I(IC.check, 12) + '</i><span>' + esc(x) + '</span></label>'; }).join('') + '</div></div>';
  }
  function catField() {
    var t = TYPE[F.type];
    if (!t || !t.cats.length) return '';
    if (F.cat && t.cats.indexOf(F.cat) < 0) F.cat = '';
    return select('cat', t.id === 'web' ? 'What kind of website?' : t.id === 'digital' ? 'What kind of product?' : 'Which best describes it?', t.cats, { req: 1, ph: 'Choose the closest' });
  }
  function sizeKey() { var gs = groupsFor(typeId(), F.cat); return gs.indexOf('store') >= 0 ? 'store' : typeId() === 'web' ? 'site' : /dash|saas|soft/.test(typeId()) ? 'dash' : ''; }

  /* ---------- the steps ---------- */
  function stepHtml(k) {
    if (k === 'you') return '<div class="bf-grid">' +
      input('name', 'Full name', { req: 1, ac: 'name', ph: 'e.g. Jane Wanjiru', max: 80 }) +
      input('phone', 'WhatsApp or phone number', { req: F.reach !== 'Email', type: 'tel', ac: 'tel', im: 'tel', ph: 'e.g. 0712 345 678', half: 1, max: 30 }) +
      input('email', 'Email address', { req: F.reach === 'Email', type: 'email', ac: 'email', ph: 'you@company.com', half: 1, max: 120 }) +
      input('company', 'Company or organisation', { ac: 'organization', ph: 'If you have one', half: 1, max: 100 }) +
      input('role', 'Your role', { ph: 'e.g. Founder, Marketing lead', half: 1, max: 80 }) +
      select('reach', 'Best way to reach you', REACH, { req: 1, half: 1, ph: 'Choose one' }) + '</div>';
    if (k === 'what') return '<div class="bf-grid">' +
      select('type', 'What would you like us to create?', TYPES.map(function (t) { return t.name; }), { req: 1, ph: 'Choose a type of project' }) +
      '<div class="bf-f bf-f--wrap" id="bf-catw">' + catField() + '</div>' +
      select('stage', 'Is this new or existing?', STAGE, { half: 1 }) +
      select('industry', 'Your industry', INDUSTRY, { half: 1 }) +
      area('about', 'Describe it in your own words', { req: 1, rows: 5, ph: 'Who is it for, what should it do, and what would make it a success? A few sentences is perfect.', max: 2500 }) + '</div>';
    if (k === 'domain') return '<div class="bf-grid">' +
      select('have', 'Do you have a domain name?', HAVE, { req: 1, ph: 'Choose one' }) +
      '<div class="bf-f bf-f--wrap" id="bf-domw">' + domainField() + '</div></div>';
    if (k === 'need') {
      var gs = groupsFor(typeId(), F.cat), sk = sizeKey();
      return '<div class="bf-grid">' +
        (gs.length ? gs.map(function (g, i) { return checks('features', G[g][0], G[g][1], i ? 'tick any' : 'optional · tick any'); }).join('') : '') +
        (sk ? select('size', SIZE[sk][0], SIZE[sk][1], { half: 1 }) : '') +
        input('site', 'Current website or app', { type: 'url', im: 'url', ph: 'https://', half: 1, max: 200 }) +
        input('inspo', 'Sites or apps you admire', { ph: 'Links or names', max: 300 }) +
        area('musts', 'Anything else it must do?', { rows: 3, ph: 'Features, tools it must work with, who uses it…', max: 1500 }) + '</div>';
    }
    return '<div class="bf-grid">' +
      select('budget', 'Budget', BUDGET, { half: 1, ph: 'Choose a range' }) +
      select('when', 'When would you like to launch?', WHEN, { half: 1 }) +
      select('content', 'Is your content ready?', CONTENT, { half: 1, ph: 'Text, photos, logo…' }) +
      select('heard', 'How did you hear about us?', HEARD, { half: 1 }) +
      area('note', 'Anything else we should know?', { rows: 3, ph: 'Deadlines, questions for us…', max: 1500 }) + '</div>' +
      '<p class="bf-fine">By sending, you’re happy for Ciel Africa to contact you about this project. We never share your details. <a href="/privacy" target="_blank" rel="noopener">Privacy</a></p>';
  }

  /* ---------- domain: have one, or search for one ---------- */
  function domainField() {
    if (F.have === HAVE[0]) return '<div class="bf-grid bf-grid--in">' + input('domain', 'Your domain', { req: 1, ph: 'e.g. yourbrand.co.ke', max: 120, hint: 'We’ll connect it to your new site. You keep full ownership.' }) + '</div>';
    if (F.have !== HAVE[1]) return F.have ? '<p class="bf-hint bf-hint--box">No problem. We’ll help you choose one once we talk.</p>' : '';
    return '<div class="bf-ds"><label for="bf-dq">Search for a name</label><div class="bf-ds__row"><input id="bf-dq" type="text" inputmode="url" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="63" placeholder="e.g. yourbrand" value="' + esc(F.dq || '') + '"><button type="button" class="bf-btn bf-btn--p bf-ds__go" id="bf-dgo">' + I(IC.search, 18) + '<span>Search</span></button></div>' +
      '<p class="bf-err" id="e-dq" hidden></p><div class="bf-ds__res" id="bf-dres">' + picked() + '</div>' +
      '<p class="bf-hint">Just looking is fine. Choose a name and we’ll add it to your brief. You can buy it now or when we start.</p></div>';
  }
  function picked() {
    if (!F.domain || F.have !== HAVE[1]) return '';
    return '<div class="bf-dpick"><span class="bf-dpick__i">' + I(IC.check, 16) + '</span><div><b>' + esc(F.domain) + '</b><small>Saved to your brief' + (F.dprice ? ' · ' + esc(F.dprice) + ' first year' : '') + '</small></div><a class="bf-link" href="/domains?q=' + encodeURIComponent(F.domain) + '" target="_blank" rel="noopener">Buy it now' + I(IC.ext, 14) + '</a><button type="button" class="bf-dpick__x" data-dclear aria-label="Remove">' + I(IC.x, 16) + '</button></div>';
  }
  var dRun = 0;
  function api(route, body) {
    return fetch('/api/domains/' + route, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'ciel' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
      .catch(function () { return { ok: false, error: 'You seem to be offline. Check your connection and try again.' }; });
  }
  function dSearch() {
    var inp = document.getElementById('bf-dq'), box = document.getElementById('bf-dres'), go = document.getElementById('bf-dgo');
    var v = String(inp.value || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split(/[/?#\s]/)[0];
    err('dq', ''); if (!v) { err('dq', 'Type a name to search.'); inp.focus(); return; }
    F.dq = v; save();
    var my = ++dRun; go.disabled = true;
    box.innerHTML = picked() + '<div class="bf-dl">' + [0, 1, 2].map(function () { return '<div class="bf-dr is-wait"><span class="bf-sk"></span></div>'; }).join('') + '</div>';
    api('search', { q: v }).then(function (r) {
      if (my !== dRun) return;
      if (!r || !r.ok) { go.disabled = false; box.innerHTML = picked(); err('dq', (r && r.error) || 'Search isn’t available right now. Type the name you like in the box below instead.'); return; }
      var list = [], price = {};
      var add = function (d, p) { if (d && list.indexOf(d) < 0) { list.push(d); if (p) price[d] = p; } };
      if (r.primary) add(r.primary.domain, r.primary.price);
      (r.groups || []).forEach(function (g) { (g.items || []).forEach(function (it) { add(it.domain, it.price); }); });
      list = list.slice(0, 12);
      if (!list.length) { go.disabled = false; box.innerHTML = picked() + '<p class="bf-hint">No suggestions for that one. Try another word.</p>'; return; }
      return api('check', { domains: list }).then(function (j) {
        if (my !== dRun) return; go.disabled = false;
        var res = (j && j.ok ? j.results : []) || [], av = res.filter(function (x) { return x.state === 'available'; }).map(function (x) { return x.domain; });
        var exact = r.primary && r.primary.domain, taken = res.filter(function (x) { return x.domain === exact && (x.state === 'registered' || x.state === 'reserved'); }).length;
        av = av.slice(0, 6);
        box.innerHTML = picked() + (taken ? '<p class="bf-hint bf-hint--box"><b>' + esc(exact) + '</b> is taken. Here are names you can still get:</p>' : '') +
          (av.length ? '<div class="bf-dl">' + av.map(function (d) { var p = price[d], i = d.indexOf('.'); return '<div class="bf-dr' + (d === F.domain ? ' is-on' : '') + '"><span class="bf-dr__d"><b>' + esc(d.slice(0, i)) + '</b><em>' + esc(d.slice(i)) + '</em></span><span class="bf-dr__p">' + (p && p.total ? money(p.total) + '<small>first year</small>' : '') + '</span><button type="button" class="bf-btn bf-btn--ghost bf-dr__b" data-dpick="' + esc(d) + '" data-dp="' + esc(p && p.total ? money(p.total) : '') + '">' + (d === F.domain ? 'Chosen' : 'Choose') + '</button></div>'; }).join('') + '</div>'
            : '<p class="bf-hint">Those are all taken. Try another word or spelling.</p>');
      });
    });
  }

  /* ---------- the side card ---------- */
  function summary() {
    var it = [['Name', F.name], ['Building', F.ref && kind ? F.ref : (F.cat || F.type)], ['Domain', F.have === HAVE[0] || F.have === HAVE[1] ? F.domain : ''], ['Budget', F.budget], ['Launch', F.when]].filter(function (x) { return x[1]; });
    var el = $('#bf-sum'); if (!el) return;
    el.innerHTML = it.length ? '<ul class="bf-sumlist">' + it.map(function (x) { return '<li class="is-set"><span>' + x[0] + '</span><b>' + esc(x[1]) + '</b></li>'; }).join('') + '</ul>' : '<p class="bf-empty">Your answers show up here.</p>';
  }

  /* ---------- drawing a step (only when the step changes, never while typing) ---------- */
  var reached = 0;
  function bar() {
    var ST = steps(); if (S.step > ST.length - 1) S.step = ST.length - 1;
    $('#bf-steps').innerHTML = ST.map(function (s, i) { return '<li class="' + (i === S.step ? 'is-on' : i < S.step ? 'is-done' : '') + '"><button type="button" data-go="' + i + '"' + (i > reached && i > S.step ? ' disabled' : '') + ' aria-current="' + (i === S.step ? 'step' : 'false') + '"><span>' + (i < S.step ? I(IC.check, 14) : i + 1) + '</span><b>' + s.n + '</b></button></li>'; }).join('');
    $('#bf-steps').style.setProperty('--n', ST.length);
    $('#bf-bar').style.width = (S.step / (ST.length - 1) * 100) + '%';
    var kk = $('#bf-body .bf-kicker'); if (kk) kk.textContent = 'Step ' + (S.step + 1) + ' of ' + ST.length;
    return ST;
  }
  function render(focus) {
    var ST = bar(), s = ST[S.step];
    $('#bf-body').innerHTML = '<div class="bf-head"><p class="bf-kicker">Step ' + (S.step + 1) + ' of ' + ST.length + '</p><h2>' + s.t + '</h2><p>' + s.s + '</p></div>' + stepHtml(s.k);
    $('#bf-back').hidden = S.step === 0;
    var last = S.step === ST.length - 1;
    $('#bf-next').innerHTML = (last ? 'Send my brief' : 'Continue') + I(IC.arrow, 18);
    $('#bf-next').classList.toggle('bf-send', last);
    $('#bf-wa').hidden = !last; if (last) $('#bf-wa').href = waLink();
    summary();
    if (focus) { var h = $('#bf-body h2'); h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); var top = root.getBoundingClientRect().top + scrollY - 100; if (scrollY > top) scrollTo({ top: top, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }
  }
  function go(to) { S.step = to; reached = Math.max(reached, to); render(true); }
  function curKey() { return steps()[S.step].k; }

  /* ---------- checks ---------- */
  function err(k, msg) { var e = document.getElementById('e-' + k); if (e) { e.textContent = msg || ''; e.hidden = !msg; } var el = document.getElementById('b-' + k) || document.getElementById('bf-' + k); if (el) el.setAttribute('aria-invalid', msg ? 'true' : 'false'); return !msg; }
  function check(k) {
    var bad = [];
    if (k === 'you') {
      var phoneOk = /\d{9,}/.test(String(F.phone || '').replace(/\D/g, '')), mailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(F.email || '');
      if (!String(F.name || '').trim()) bad.push(['name', 'Please add your name.']); else err('name', '');
      if (F.email && !mailOk) bad.push(['email', 'That email doesn’t look right.']);
      else if (F.reach === 'Email' && !mailOk) bad.push(['email', 'Add your email, since that’s how you’d like us to reply.']); else err('email', '');
      if (F.phone && !phoneOk) bad.push(['phone', 'That number looks too short.']);
      else if (F.reach !== 'Email' && !phoneOk) bad.push(['phone', 'Add your number, since that’s how you’d like us to reply.']); else err('phone', '');
    }
    if (k === 'what') {
      if (!F.type) bad.push(['type', 'Choose what you’d like us to create.']); else err('type', '');
      var t = TYPE[F.type]; if (t && t.cats.length && !F.cat) bad.push(['cat', 'Choose the closest match.']); else err('cat', '');
      if (String(F.about || '').trim().length < 10) bad.push(['about', 'A sentence or two about the project, please.']); else err('about', '');
    }
    if (k === 'domain') {
      if (!F.have) bad.push(['have', 'Choose one.']); else err('have', '');
      if (F.have === HAVE[0] && !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(String(F.domain || '').trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/.*$/, ''))) bad.push(['domain', 'Type your domain, like yourbrand.co.ke.']);
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
      if (k === 'reach') {   /* the right contact box becomes the required one */
        var ph = $('label[for="b-phone"]'), em = $('label[for="b-email"]');
        if (ph) ph.innerHTML = 'WhatsApp or phone number' + (F.reach === 'Email' ? ' <small>optional</small>' : '');
        if (em) em.innerHTML = 'Email address' + (F.reach === 'Email' ? '' : ' <small>optional</small>');
      }
      if (k === 'type' && e.type === 'change') {   /* only the category box changes; the steps bar updates for the domain step */
        F.cat = ''; F.features = []; F.size = '';
        var w = document.getElementById('bf-catw'); if (w) w.innerHTML = catField();
        bar();
      }
      if (k === 'cat' && e.type === 'change') { F.features = []; F.size = ''; }
      if (k === 'have' && e.type === 'change') { F.domain = ''; F.dprice = ''; var dw = document.getElementById('bf-domw'); if (dw) dw.innerHTML = domainField(); }
      if (/^(name|type|cat|budget|when|domain|have)$/.test(k)) summary();
      return;
    }
    if (t.id === 'bf-dq') { err('dq', ''); return; }
    var ck = t.getAttribute('data-ck');
    if (ck) { var a = F[ck] = F[ck] || [], v = t.value, ix = a.indexOf(v); if (t.checked && ix < 0) a.push(v); if (!t.checked && ix >= 0) a.splice(ix, 1); syncChecks(v, t.checked); save(); }
  }
  /* the same option can sit in two groups (e.g. card payments): keep both ticks in step */
  function syncChecks(v, on) { Array.prototype.forEach.call(root.querySelectorAll('input[data-ck]'), function (x) { if (x.value === v) { x.checked = on; x.closest('.bf-ck').classList.toggle('is-on', on); } }); }
  root.addEventListener('input', onField);
  root.addEventListener('change', onField);
  root.addEventListener('click', function (e) {
    var g = e.target.closest('[data-go]'); if (g && !g.disabled) { var to = +g.getAttribute('data-go'); if (to > S.step && !check(curKey())) return; go(to); return; }
    if (e.target.closest('#bf-dgo')) { dSearch(); return; }
    var p = e.target.closest('[data-dpick]');
    if (p) { F.domain = p.getAttribute('data-dpick'); F.dprice = p.getAttribute('data-dp') || ''; save(); summary(); var box = document.getElementById('bf-dres'); box.querySelectorAll('.bf-dr').forEach(function (r) { var b = r.querySelector('[data-dpick]'), on = b && b.getAttribute('data-dpick') === F.domain; r.classList.toggle('is-on', on); if (b) b.textContent = on ? 'Chosen' : 'Choose'; }); var old = box.querySelector('.bf-dpick'); if (old) old.remove(); box.insertAdjacentHTML('afterbegin', picked()); return; }
    if (e.target.closest('[data-dclear]')) { F.domain = ''; F.dprice = ''; save(); summary(); var pk = $('.bf-dpick'); if (pk) pk.remove(); root.querySelectorAll('.bf-dr.is-on').forEach(function (r) { r.classList.remove('is-on'); var b = r.querySelector('[data-dpick]'); if (b) b.textContent = 'Choose'; }); }
  });
  $('#bf-back').addEventListener('click', function () { if (S.step > 0) go(S.step - 1); });
  $('#bf-next').addEventListener('click', function () { if (!check(curKey())) return; if (S.step < steps().length - 1) return go(S.step + 1); send(); });
  var rs = $('#bf-reset'); if (rs) rs.addEventListener('click', function () {
    Object.keys(F).forEach(function (k) { delete F[k]; }); F.reach = 'WhatsApp'; F.features = [];
    fromRef();
    try { localStorage.removeItem(KEY); } catch (er) { } S.step = 0; reached = 0; render(true);
  });
  /* Enter in a one-line box moves on (or searches, in the domain box) */
  root.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' || e.target.tagName !== 'INPUT' || e.target.type === 'checkbox') return;
    e.preventDefault(); if (e.target.id === 'bf-dq') dSearch(); else $('#bf-next').click();
  });

  /* ---------- sending ---------- */
  function domainLine() {
    if (!needsDomain() || !F.have) return '';
    if (F.have === HAVE[0]) return 'Has one: ' + (F.domain || '');
    if (F.have === HAVE[1]) return F.domain ? 'Wants: ' + F.domain + (F.dprice ? ' (' + F.dprice + ' first year)' : '') : 'Wants help finding one';
    return 'Not sure yet';
  }
  function rows() {
    var tName = F.type ? F.type.replace(/^An? /, '') : '';
    var looking = tName ? tName.charAt(0).toUpperCase() + tName.slice(1) + (F.cat ? ' — ' + F.cat : '') : '';
    var feats = (F.features || []).filter(function (x, i, a) { return a.indexOf(x) === i; });
    var sk = sizeKey();
    return [['Looking for', looking], [kind === 'product' ? 'Product' : kind === 'service' ? 'Service' : kind === 'template' ? 'Template' : 'About', F.ref], ['Project stage', F.stage], ['Industry', F.industry], ['Project description', F.about], ['Domain', domainLine()],
      ['Must-haves', feats.join(', ')], [sk ? SIZE[sk][0].replace(/\?$/, '') : 'Size', sk ? F.size : ''], ['Also must', F.musts], ['Current website', F.site], ['Sites they admire', F.inspo],
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
