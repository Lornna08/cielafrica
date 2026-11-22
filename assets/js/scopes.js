/* ============================================================
   CIEL AFRICA — what we build: project types, their categories and the
   must-haves that fit each category. Shared by Start a project
   (assets/js/brief.js) and Ciel Admin projects (scope picker).
   ============================================================ */
(function () {
  /* ---------- what people can ask us to build ---------- */
  var TYPES = [
    { id: 'web', name: 'A website', cats: ['Business or company website', 'Online store (e-commerce)', 'Start from one of your website templates', 'Portfolio', 'Personal brand or CV website', 'Landing page for a product or campaign', 'Blog or magazine', 'News or media website', 'Restaurant, café or food business', 'Hotel, lodge, guest house or Airbnb', 'Travel or tour company', 'Real estate and property listings', 'School, college or training centre', 'Church or faith organisation', 'NGO, foundation or non-profit', 'Wedding or event website', 'Event ticketing website', 'Photo book store (customers design and order books)', 'Photography or creative studio', 'Salon, spa or beauty business', 'Clinic, hospital or health practice', 'Law firm or professional services', 'Construction, engineering or architecture', 'Car dealer or automotive', 'Fashion or clothing brand', 'Fitness, gym or sports club', 'Music, artist or entertainment', 'Agriculture or agribusiness', 'Logistics, transport or courier', 'Directory or listings website', 'Marketplace with many sellers', 'Membership or community website', 'Online courses (e-learning)', 'Booking and appointments website', 'Job board or recruitment', 'Donations or fundraising', 'Government, county or institution', 'Something else'] },
    { id: 'dash', name: 'A web app or work dashboard', cats: ['Admin or operations dashboard', 'CRM: clients, leads and follow-ups', 'Inventory and stock management', 'Point of sale (POS)', 'HR, staff and payroll', 'Tasks, projects and team work', 'Booking and scheduling system', 'Fleet, delivery or dispatch tracking', 'School management system', 'Hospital or clinic management', 'SACCO, microfinance or loans', 'Property and rent management', 'Church or members management', 'Event ticketing and check-in', 'Support tickets and helpdesk', 'Photo book orders and print files', 'Customer or client portal', 'Reports and analytics (BI)', 'Internal tool for my team', 'Something else'] },
    { id: 'saas', name: 'A SaaS platform', cats: ['B2B software for other businesses', 'Subscription platform', 'Marketplace platform', 'Fintech or payments platform', 'EdTech or learning platform', 'HealthTech platform', 'PropTech or property platform', 'AgriTech platform', 'Logistics or delivery platform', 'HR or recruitment platform', 'Booking platform', 'Helpdesk or ticketing platform', 'Photo book or printing platform', 'AI-powered SaaS', 'Something else'] },
    { id: 'app', name: 'A mobile app (Android and iPhone)', cats: ['Company or business app', 'Shopping app', 'Delivery or ride app', 'Booking app', 'Wallet, savings or fintech app', 'Social or community app', 'Education or learning app', 'Health and fitness app', 'App for my existing website or system', 'Staff or field-team app', 'Event app', 'Something else'] },
    { id: 'soft', name: 'Business software or a system', cats: ['ERP for my whole business', 'Accounting and invoicing', 'Manufacturing or production', 'Government or institutional system', 'Desktop software (Windows or Mac)', 'Works-offline system', 'Hardware, IoT or devices', 'Replace spreadsheets with a proper system', 'Something else'] },
    { id: 'digital', name: 'A digital product', cats: ['One of your shop products', 'Website template', 'Dashboard or admin template', 'UI kit or design system', 'Mobile app template', 'Notion or spreadsheet template', 'eBook or guide', 'Online course', 'Printables or planners', 'Graphics, icons or brand kit', 'Code script or starter kit', 'Something else'] },
    { id: 'plugin', name: 'A plugin or extension', cats: ['WordPress plugin', 'WooCommerce extension', 'Shopify app', 'Payment plugin (M-Pesa or cards)', 'Chrome or browser extension', 'Figma plugin', 'VS Code extension', 'Something else'] },
    { id: 'api', name: 'An integration or API', cats: ['M-Pesa (Daraja) integration', 'Card payments integration', 'SMS or WhatsApp messaging', 'Email automation', 'Connect two systems I already use', 'An API for my own product', 'Accounting sync (QuickBooks, Odoo, Sage…)', 'Google Workspace or Microsoft 365', 'Something else'] },
    { id: 'ai', name: 'AI or automation', cats: ['AI chatbot or assistant', 'WhatsApp bot', 'Automate a workflow', 'Read and sort documents (OCR)', 'AI content or writing tool', 'Recommendations', 'Data analysis and forecasting', 'Something else'] },
    { id: 'trade', name: 'A trading system', cats: ['Deriv third-party app (Deriv API)', 'Deriv bot (Bot Builder)', 'Expert Advisor (MT4 or MT5)', 'Custom indicator', 'Trading bot (forex or crypto)', 'Copy-trading system', 'Trading journal or dashboard', 'Signals platform', 'Something else'] },
    { id: 'design', name: 'Design and branding', cats: ['Logo and brand identity', 'UI/UX design for a website or app', 'Redesign of something I have (design only)', 'Pitch deck', 'Social media kit', 'Packaging or print', 'Something else'] },
    { id: 'care', name: 'Hosting, fixes and support', cats: ['Ongoing maintenance', 'Fix bugs or errors', 'Make my site faster', 'Move my site to new hosting', 'Security, SSL and backups', 'Business email setup', 'Cloud or DevOps setup', 'Something else'] },
    { id: 'other', name: 'Something else', cats: [] }
  ];

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
    tickets: ['Ticketing', ['Customers open tickets by web form, email or WhatsApp', 'Assign tickets to staff', 'Priorities and response-time targets', 'Customers get status updates', 'Saved replies', 'Knowledge base or FAQ', 'Reports on response times']],
    photobook: ['Photo books', ['Book designer in the browser', 'Auto-arrange photos into pages', 'Covers, sizes and paper options', 'Prices by number of pages', 'Uploads at print quality', 'Print-ready PDF for the printer', 'Order tracking for customers', MPESA, CARD, 'Dashboard for orders and print files']],
    deriv: ['Deriv', ['Log in with Deriv', 'Trade from my app', 'Earn app markup on trades', 'Live prices and charts', 'Copy trading', 'Works on phones']],
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
      if (has(/photo book/)) g.push('photobook');
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
    else if (type === 'dash') { if (has(/fleet|delivery/)) g.push('delivery'); if (has(/sacco|loan/)) g.push('fin'); if (has(/booking/)) g.push('booking'); if (has(/event/)) g.push('events'); if (has(/school/)) g.push('school'); if (has(/support tickets/)) g.push('tickets'); if (has(/photo book/)) g.push('photobook'); g.push('dash'); }
    else if (type === 'saas') { g.push('saas'); if (has(/fintech/)) g.push('fin'); if (has(/marketplace/)) g.push('market'); if (has(/logistics/)) g.push('delivery'); if (has(/booking/)) g.push('booking'); if (has(/edtech/)) g.push('course'); if (has(/helpdesk/)) g.push('tickets'); if (has(/photo book/)) g.push('photobook'); }
    else if (type === 'app') { g.push('app'); if (has(/shopping/)) g.push('store'); if (has(/delivery/)) g.push('delivery'); if (has(/wallet/)) g.push('fin'); if (has(/booking/)) g.push('booking'); }
    else if (type === 'trade' && has(/deriv/)) g.push('deriv');
    else if (G[type]) g.push(type);
    return g.filter(function (x, i) { return g.indexOf(x) === i; });
  }

  window.CielScopes = { TYPES: TYPES, G: G, groupsFor: groupsFor,
    /* every must-have that fits a type and category, grouped: [[group name, [items]]] */
    scopeFor: function (typeId, cat) { return groupsFor(typeId, cat).map(function (g) { return G[g]; }); },
    typeByName: function (n) { var k = String(n || '').toLowerCase().replace(/^an? /, ''); return TYPES.filter(function (t) { return t.id === n || t.name.toLowerCase().replace(/^an? /, '') === k; })[0] || null; } };
})();
