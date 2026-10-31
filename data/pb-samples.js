/* ============================================================
   CIEL PHOTO BOOKS — sample photos
   Every design opens as a finished-looking book filled with these
   sample photos; customers replace them with their own. They are
   shown from Unsplash (hotlinked, as the Unsplash API guidelines ask)
   with photographer credit, or from licensed copies in this repo.
   Sample photos can never be printed or exported: the engine blocks
   ordering until every one is replaced.
   ============================================================ */
(function (root) {
  'use strict';
  // [unsplash path, width, height, photographer, username]
  var U = {
    coast: [['photo-1665449405918-0fee7660d2c1', 6000, 4000, 'Danai Tsoutreli', 'danaetsoutreli'], ['photo-1665449067830-5e06e062984d', 6000, 4000, 'Danai Tsoutreli', 'danaetsoutreli'], ['photo-1665448863448-a3fe2a384508', 5716, 3811, 'Danai Tsoutreli', 'danaetsoutreli'], ['photo-1665449067848-99b2f1f43841', 6000, 4000, 'Danai Tsoutreli', 'danaetsoutreli'], ['photo-1665449067834-3518bb5cc88d', 5526, 3752, 'Danai Tsoutreli', 'danaetsoutreli'], ['photo-1665449904779-7b76ec08a8e5', 6000, 4000, 'Danai Tsoutreli', 'danaetsoutreli']],
    safari: [['photo-1592784201029-bdb351d47eff', 5713, 3206, 'Gustav Schwiering', 'gustavphoto'], ['photo-1596790133876-73e292c227d0', 5184, 3456, 'Karin Petersen', 'karinpetersen'], ['photo-1711062753179-de7f85514155', 4024, 6048, 'Helena Pfisterer', 'pixbyhelena'], ['photo-1738701243287-df5b46011c2f', 6000, 4000, 'Mustafa Masetic', 'mmvisualstories']],
    wedding: [['photo-1695281536457-01f9a07c575b', 4016, 6016, 'Samwel Francis', 'lifeofsammy'], ['photo-1603214924133-5c2c78471b73', 3616, 4520, 'Blake Cheek', 'blakecheekk'], ['photo-1695281535578-ce371088bb3e', 4016, 5056, 'Samwel Francis', 'lifeofsammy'], ['photo-1661332517932-2d441bfb2994', 5329, 5283, 'Tope A. Asokere', 'topeasokere'], ['photo-1507650029083-5092f9b2b2e6', 2293, 1531, 'Andrew Itaga', 'and73w'], ['photo-1618999114008-fbf937170cdb', 4000, 6000, 'Dennis Irorere', 'denironyx']],
    love: [['photo-1544293180-6749b85ce918', 4622, 4160, 'One zone Studio', 'onezonestudio'], ['photo-1594468279034-c8c9dd917106', 3840, 5034, 'Oluwatobi Akindunjoye', 'oluwatobimayowa'], ['photo-1592599457454-e6ace3370314', 5568, 3712, 'LaShawn Dobbs', 'lashawndobbs'], ['photo-1624228652393-eab1721b1899', 4480, 6720, 'Kadarius Seegars', 'kseegars'], ['photo-1499372076272-6b5c2d2bb391', 3888, 5184, 'JD Mason', 'jmason'], ['photo-1542324909-57c08f1b1288', 3606, 4508, 'Ricky Esquivel', 'rickyrecap'], ['photo-1522941471521-6ee21ec5cc26', 5358, 6430, 'Jessica Felicio', 'jekafe']],
    baby: [['photo-1555093279-99bf405fe600', 3648, 4560, 'Arno Partissimo', 'partissimo'], ['photo-1655682597146-eb8412ca7d1c', 5184, 3456, 'Iwaria', 'iwaria'], ['photo-1761168433666-b5d7396c835e', 4000, 5000, 'Derrick Pare', 'kderrick049'], ['photo-1547082722-ebad0c0cb815', 3840, 2160, 'TopSphere Media', 'zvessels55'], ['photo-1590601689970-c298e8bddf12', 3024, 4032, 'Fuad Oba', 'oldmano3a'], ['photo-1582486225644-aeacf6aa0b1b', 4480, 6720, 'Nathan Dumlao', 'nate_dumlao'], ['photo-1470116945706-e6bf5d5a53ca', 4000, 3000, 'Aditya Romansa', 'adroman']],
    family: [['photo-1647616927583-1d44a79a38a5', 4088, 2725, 'Trust Katsande', 'iamtru'], ['photo-1643818657367-491080baeece', 5304, 7952, 'Osarugue Igbinoba', 'osarugue'], ['photo-1628517290972-74a92219db50', 6710, 4774, 'Anvesh', 'anvesh1616'], ['photo-1596510914965-9ae08acae566', 2706, 3503, 'Lawrence Crayton', 'lawrencecrayton'], ['photo-1577896849786-738ed6c78bd3', 12000, 7972, 'National Cancer Institute', 'nci'], ['photo-1643818653783-2f818a205bb6', 5304, 6630, 'Osarugue Igbinoba', 'osarugue'], ['photo-1597698110516-023a0489ac0c', 3648, 5472, 'Lawrence Crayton', 'lawrencecrayton'], ['photo-1578496781307-30c2b531c05a', 10800, 7200, 'National Cancer Institute', 'nci']],
    graduation: [['photo-1594750852563-5ed8e0421d40', 3334, 5000, 'Nqobile Vundla', 'nqoe'], ['photo-1627556704283-452301a45fd0', 5616, 3744, 'RUT MIIT', 'rutmiit'], ['photo-1594750852517-f37738fa2384', 5000, 3334, 'Nqobile Vundla', 'nqoe'], ['photo-1627556704243-5f0771d90783', 5616, 3744, 'RUT MIIT', 'rutmiit'], ['photo-1639304952112-95ae90b5cbb7', 3333, 5000, 'Nqobile Vundla', 'nqoe']],
    friends: [['photo-1768244016470-271b210a8407', 4000, 6000, 'Brian Kungu', 'oldceltic'], ['photo-1783788488938-3dd2603759ca', 4000, 6000, 'Kyle Kioko', 'kylekioko'], ['photo-1761839256602-0e28a5ab928d', 6192, 4128, "Land O'Lakes", 'landolakesinc'], ['photo-1788517639322-2709747e57d3', 4000, 5792, 'Dwayne Joe', 'spliff_dj_joe'], ['photo-1778501138411-7fe640ed26d9', 2624, 3684, 'Dwayne Joe', 'spliff_dj_joe'], ['photo-1778501145215-0485e57dd8b2', 2624, 3696, 'Dwayne Joe', 'spliff_dj_joe']],
    celebration: [['photo-1791774023174-c46dbeb286e1', 2656, 3320, 'Stephen Tettey Atsu', 'atsu_tettey'], ['photo-1673289072037-de784a40c145', 4480, 6720, 'Binti Malu', 'bintimalu'], ['photo-1791774023186-b4d8e9674faa', 2490, 3113, 'Stephen Tettey Atsu', 'atsu_tettey'], ['photo-1639304952112-95ae90b5cbb7', 3333, 5000, 'Nqobile Vundla', 'nqoe'], ['photo-1768244016470-271b210a8407', 4000, 6000, 'Brian Kungu', 'oldceltic'], ['photo-1761839256602-0e28a5ab928d', 6192, 4128, "Land O'Lakes", 'landolakesinc']],
    childhood: [['flagged/photo-1555251255-e9a095d6eb9d', 6000, 4000, 'Roman Nguyen', 'march08'], ['photo-1547496613-4e19af6736dc', 3840, 5760, 'Bennett Tobias', 'bwtobias'], ['photo-1521493959102-bdd6677fdd81', 6048, 4032, 'Bill Wegener', 'wegenerb'], ['photo-1543689604-6fe8dbcd1f59', 4928, 3280, 'Annie Spratt', 'anniespratt'], ['photo-1617056239820-8ce90ba48193', 4928, 3264, 'Abubakar Balogun', 'abubalo'], ['photo-1515658323406-25d61c141a6e', 3001, 4259, 'Ian Macharia', 'macharia']],
    city: [['photo-1609971757431-439cf7b4141b', 3456, 5184, 'Diogo Fagundes', 'diofagundes'], ['photo-1638874085157-91988ffd3fe5', 3228, 2152, 'Denise Schuld', 'nisi_bisi_'], ['photo-1654448190693-f59b70e5ee3c', 3563, 5344, 'real_jansen', 'real_jansen'], ['photo-1626806512616-972c578a7b4f', 3024, 4032, 'Marius Christensen', 'mariuschristensen']]
  };
  // licensed copies already in this repo (Unsplash License, credited in assets/img/pb-demo/CREDITS.md)
  var L = {
    coast: [['coast', 1000, 667, 'Mustafa Masetic', 'mmvisualstories'], ['palms', 800, 1000, 'Christian Lambert', '_christianlambert'], ['beach', 1000, 668, 'Norbert Braun', 'medion4you'], ['dhow', 1000, 750, 'Irene Alvarado', 'airin47'], ['deck', 1000, 800, 'Sasha Kaunas', 'akaunas'], ['run', 1000, 667, 'Karina Lago', 'karinalago']],
    portfolio: [['pf1', 667, 1000, 'Juan Manuel Merino', 'juanmaforpresident'], ['pf2', 615, 1000, 'Qwerqu McBrew', 'qwerqu_jnr'], ['pf3', 667, 1000, 'Michael Starkie', 'starkie_pics'], ['pf4', 667, 1000, 'Joseph Agboola', 'aduratomi'], ['pf5', 743, 1000, 'Stephen Tettey Atsu', 'atsu_tettey'], ['pf6', 710, 1000, 'Dwayne Joe', 'spliff_dj_joe'], ['pf7', 669, 1000, 'Prince Akachi', 'princearkman'], ['pf8', 900, 599, 'James Balensiefen', 'balensiefenphoto']]
  };
  var ALL = {};
  function key(s) { return 's_' + s.replace(/[^a-z0-9]/gi, '').slice(-14); }
  Object.keys(U).forEach(function (set) { U[set].forEach(function (r) { var id = key(r[0]); if (ALL[id]) { ALL[id].sets.push(set); return; } ALL[id] = { id: id, sample: true, sets: [set], w: r[1], h: r[2], hash: 'sample', name: 'Sample photo', credit: r[3], user: r[4], u: r[0] }; }); });
  Object.keys(L).forEach(function (set) { L[set].forEach(function (r) { var id = 's_l' + r[0]; ALL[id] = { id: id, sample: true, sets: ['l' + set], w: r[1] * 4, h: r[2] * 4, hash: 'sample', name: 'Sample photo', credit: r[3], user: r[4], local: r[0] }; }); });
  function setIds(set) { return Object.keys(ALL).filter(function (id) { return ALL[id].sets.indexOf(set) >= 0; }); }

  var TEMPLATE_SETS = {
    'zanzibar-blue': ['lcoast', 'coast'], 'zanzibar-night': ['coast', 'lcoast'], 'diani-shore': ['coast', 'lcoast'], 'lamu-dhow': ['lcoast', 'coast'],
    'paris-rose': ['city', 'love'], 'amsterdam-canal': ['city', 'friends'], 'cape-coral': ['safari', 'coast'], 'savanna-gold': ['safari', 'lcoast'],
    'love-letter': ['love'], 'ivory-vows': ['wedding', 'love'], 'family-table': ['family'], 'crayon-days': ['childhood', 'family'], 'first-year': ['baby', 'family'],
    'confetti': ['celebration', 'friends'], 'cap-and-gown': ['graduation', 'celebration'], 'good-company': ['friends', 'celebration'],
    'year-in-review': ['friends', 'family', 'coast', 'celebration'], 'portfolio-mono': ['lportfolio'], 'gallery-white': ['lportfolio', 'love'], 'blank': ['family', 'coast', 'friends']
  };
  var TITLES = { 'zanzibar-blue': 'Zanzibar', 'zanzibar-night': 'Zanzibar', 'paris-rose': 'Paris', 'cape-coral': 'Cape Town', 'amsterdam-canal': 'Amsterdam', 'diani-shore': 'Diani', 'savanna-gold': 'Safari', 'lamu-dhow': 'Lamu', 'love-letter': 'Us', 'ivory-vows': 'The Wedding', 'family-table': 'Family', 'crayon-days': 'Growing Up', 'first-year': 'The First Year', 'confetti': 'Celebrate', 'cap-and-gown': 'The Graduate', 'good-company': 'Good Company', 'year-in-review': '2026', 'portfolio-mono': 'Portfolio', 'gallery-white': 'Selected Work', 'blank': 'Your Title' };
  // sample books open with a photo on the cover for these designs (the design's own cover style stays available)
  var COVER = { 'ivory-vows': 'photo-frame', 'cap-and-gown': 'photo-band', 'year-in-review': 'photo-full', 'blank': 'photo-full' };
  var SUBS = { 'zanzibar-blue': '2026', 'paris-rose': '2026', 'diani-shore': '2026', 'year-in-review': 'A year in pictures', 'ivory-vows': 'Our day', 'first-year': 'Hello, little one' };

  // when a design's own sets run short, top up from these (people and moments that suit most books)
  var TOPUP = ['family', 'friends', 'celebration', 'love', 'coast', 'lcoast'];
  function forTemplate(tid, n, strict) {
    var sets = TEMPLATE_SETS[tid] || TEMPLATE_SETS.blank, out = [];
    sets.forEach(function (s) { setIds(s).forEach(function (id) { if (out.indexOf(id) < 0) out.push(id); }); });
    if (!strict && out.length < (n || 16)) TOPUP.forEach(function (s) { if (sets.indexOf(s) < 0) setIds(s).forEach(function (id) { if (out.indexOf(id) < 0) out.push(id); }); });
    return out.slice(0, n || 16).map(function (id) { return ALL[id]; });
  }
  function url(m, w) {
    if (!m) return '';
    if (m.local) return '/assets/img/pb-demo/' + m.local + '.webp';
    return 'https://images.unsplash.com/' + m.u + '?ixlib=rb-4.1.0&auto=format&fit=max&q=72&w=' + (w || 1200);
  }
  function credits(ids) {
    var seen = {}, out = [];
    ids.forEach(function (id) { var m = ALL[id]; if (m && !seen[m.user]) { seen[m.user] = 1; out.push({ name: m.credit, link: 'https://unsplash.com/@' + m.user + '?utm_source=ciel_africa&utm_medium=referral' }); } });
    return out;
  }
  /** a finished-looking sample book: { p: project, photos: {id: meta} }. E = engine, cfg = photobooks config */
  function book(E, cfg, tid, fmtId, seed, n) {
    var f = E.format(cfg, fmtId), th = E.theme(tid), samples = forTemplate(tid, n || 24), own = forTemplate(tid, 24, true), title = TITLES[tid] || 'Your Title';
    var p = { schema: 1, name: '', description: '', title: title, subtitle: SUBS[tid] || '', sampleTitle: title, dedication: '', templateId: tid, formatId: f.id, binding: Object.keys(cfg.bindings || {})[0] || 'softcover', paper: (cfg.papers || [])[0] ? cfg.papers[0].id : null, pageMode: 'auto', cover: {}, theme: {}, photoOrder: [], sampleIds: samples.map(function (m) { return m.id; }), seed: seed || 4 + tid.length };
    if (COVER[tid]) p.cover.style = COVER[tid];
    var photos = {}; samples.forEach(function (m) { photos[m.id] = m; });
    var style = p.cover.style || th.cover.style, needPhoto = E.COVER_STYLES.filter(function (s) { return s.id === style; })[0].photo;
    if (needPhoto) { var land = f.trimW > f.trimH, best = own.filter(function (m) { return land ? m.w > m.h : m.h >= m.w * 0.9; })[0] || own[0]; p.cover.photo = { photo: best.id, zoom: 1, fx: 0.5, fy: 0.42 }; }
    p.pages = new Array(E.evenPages(cfg, f, f.pages.min)).fill(0).map(function () { return {}; });
    p.pages = E.autoLayout(cfg, p, samples, { seed: p.seed, idSeed: (p.seed % 9973).toString(36) });
    return { p: p, photos: photos };
  }
  var PBSamples = { all: ALL, book: book, get: function (id) { return ALL[id]; }, isSample: function (id) { return !!(id && ALL[id]); }, forTemplate: forTemplate, url: url, credits: credits, title: function (t) { return TITLES[t] || 'Your Title'; }, subtitle: function (t) { return SUBS[t] || ''; }, coverStyle: function (t) { return COVER[t] || null; }, sets: TEMPLATE_SETS };
  if (typeof module === 'object' && module.exports) module.exports = PBSamples; else root.PBSamples = PBSamples;
})(typeof self !== 'undefined' ? self : this);
