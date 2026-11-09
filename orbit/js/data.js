/* ============================================================
   ORBIT SOCIAL — sample workspace
   A fictional agency (Northlight Studio) running four client brands
   plus one brand still being onboarded. Every account here is a
   SAMPLE account: nothing connects to a real network, and every
   metric is generated sample data, labelled as such in the app.
   Dates are generated relative to "today" so the calendar is always
   current.
   ============================================================ */
window.OS = window.OS || {};
(function () {
  'use strict';
  var T = OS.time;

  function rng(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  OS.rng = rng; OS.hash = hash;

  var MEDIA = 'img/media/', VID = 'video/';
  // name, type, brand, campaign key, tags, alt, credit[photographer, username]
  var ASSETS = [
    ['latte-art', 'image', 'sav', 'barista', ['latte', 'café'], 'Rosetta latte art in a white cup on a wooden table', ['Phil Desforges', 'storybyphil']],
    ['coffee-beans', 'image', 'sav', 'harvest', ['beans', 'texture'], 'Freshly roasted coffee beans filling the frame', ['Mike Kenneally', 'asthetik']],
    ['roasting', 'image', 'sav', 'harvest', ['roastery', 'process'], 'Roaster stirring hot beans in the cooling tray', ['Tim Mossholder', 'timmossholder']],
    ['espresso-pour', 'image', 'sav', 'barista', ['espresso', 'machine'], 'Espresso pouring from a portafilter', ['Nathan Dumlao', 'nate_dumlao']],
    ['pour-over', 'image', 'sav', 'barista', ['pour over', 'brew guide'], 'Barista brewing pour-over coffee', ['Karl Fredrickson', 'kfred']],
    ['flat-white', 'image', 'sav', null, ['latte', 'dark'], 'Heart latte art in a cup on a dark background', ['Nick Harsell', 'nickharsell']],
    ['battle-ropes', 'image', 'kil', 'stories', ['strength', 'class'], 'Two members training with battle ropes', ['Meghan Holmes', 'yellowteapot']],
    ['mat-class', 'image', 'kil', 'reset', ['mobility', 'class'], 'Group mat class doing glute bridges', ['bruce mars', 'brucemars']],
    ['dumbbell-row', 'image', 'kil', 'reset', ['strength', 'form'], 'Member doing a dumbbell row on a bench', ['CATHY PHAM', 'cathypham243']],
    ['kettlebells', 'image', 'kil', null, ['equipment', 'studio'], 'A row of kettlebells on the studio floor', ['Heidi Erickson', 'herickson7']],
    ['barbell-squad', 'image', 'kil', 'stories', ['strength', 'team'], 'Three athletes lifting barbells together', ['Sven Mieke', 'sxoxm']],
    ['sunrise-run', 'image', 'kil', 'reset', ['run club', 'outdoors'], 'Runner silhouetted against a sunrise', ['Karina lago', 'karinalago']],
    ['pool-palms', 'image', 'pwa', 'festive', ['pool', 'property'], 'Pool lined with palms and loungers', ['Christian Lambert', '_christianlambert']],
    ['infinity-deck', 'image', 'pwa', 'weekends', ['ocean view', 'deck'], 'Infinity pool deck with loungers facing the ocean', ['Sasha Kaunas', 'akaunas']],
    ['dhow-sunset', 'image', 'pwa', 'weekends', ['sunset', 'experiences'], 'Traditional sailing boat at sunset', ['Irene Alvarado', 'airin47']],
    ['white-beach', 'image', 'pwa', 'festive', ['beach'], 'White sand beach with turquoise water and palms', ['Norbert Braun', 'medion4you']],
    ['coastline', 'image', 'pwa', null, ['coast', 'aerial'], 'Calm blue sea with a palm-lined island coast', ['Mustafa Masetic', 'mmvisualstories']],
    ['suite', 'image', 'pwa', 'festive', ['rooms'], 'Bright suite with a made bed and tall windows', ['Albert Vincent Wu', 'albertvincentwu']],
    ['textures', 'image', 'zur', 'science', ['texture', 'flatlay'], 'Gel, cream and oil textures with green leaves', ['ibnu ihza', 'mahendra_10']],
    ['serum-duo', 'image', 'zur', 'serum', ['product', 'serum'], 'Serum bottle beside a white jar', ['Birgith Roosipuu', 'msbirgith']],
    ['dropper-white', 'image', 'zur', 'serum', ['product'], 'White dropper bottle on a white surface', ['Content Pixie', 'contentpixie']],
    ['roller-oil', 'image', 'zur', null, ['ritual', 'tools'], 'Face roller, gua sha and facial oil', ['Viva Luna Studios', 'vivalunastudios']],
    ['dropper-glass', 'image', 'zur', 'science', ['ingredients'], 'Glass dropper above an amber bottle', ['Sanket Khatua', 'sanket_khatua']],
    ['moisturise', 'image', 'zur', 'science', ['routine', 'people'], 'Woman applying moisturiser to her cheek', ['Leighann Blackwood', 'ohleighann']],
    ['glow-portrait', 'image', 'zur', 'serum', ['people', 'campaign'], 'Portrait with natural hair and glowing skin', ['Good Faces', 'goodfacesagency']],
    ['espresso-reel', 'video', 'sav', 'barista', ['reel', 'espresso'], 'Slow push-in on an espresso shot', ['Nathan Dumlao', 'nate_dumlao']],
    ['class-reel', 'video', 'kil', 'reset', ['reel', 'class'], 'Pan across a mat class', ['bruce mars', 'brucemars']],
    ['dhow-reel', 'video', 'pwa', 'weekends', ['reel', 'sunset'], 'Pan across a sunset sail', ['Irene Alvarado', 'airin47']],
    ['routine-reel', 'video', 'zur', 'science', ['reel', 'routine'], 'Close-up of a moisturiser routine', ['Leighann Blackwood', 'ohleighann']]
  ];
  var DIMS = { 'latte-art': [1080, 1080], 'coffee-beans': [1080, 824], roasting: [1080, 721], 'espresso-pour': [1080, 1619], 'pour-over': [1080, 720], 'flat-white': [1080, 1080], 'battle-ropes': [1080, 608], 'mat-class': [1080, 720], 'dumbbell-row': [1080, 802], kettlebells: [1080, 720], 'barbell-squad': [1080, 630], 'sunrise-run': [1080, 720], 'pool-palms': [1080, 1350], 'infinity-deck': [1080, 864], 'dhow-sunset': [1080, 810], 'white-beach': [1080, 721], coastline: [1080, 720], suite: [1080, 1620], textures: [1080, 617], 'serum-duo': [1080, 1518], 'dropper-white': [1080, 720], 'roller-oil': [1080, 720], 'dropper-glass': [1080, 1922], moisturise: [1080, 1620], 'glow-portrait': [1080, 1625] };
  var SIZES = { 'latte-art': 142, 'coffee-beans': 168, roasting: 121, 'espresso-pour': 96, 'pour-over': 88, 'flat-white': 64, 'battle-ropes': 96, 'mat-class': 102, 'dumbbell-row': 104, kettlebells: 118, 'barbell-squad': 76, 'sunrise-run': 38, 'pool-palms': 181, 'infinity-deck': 137, 'dhow-sunset': 48, 'white-beach': 116, coastline: 52, suite: 92, textures: 58, 'serum-duo': 42, 'dropper-white': 31, 'roller-oil': 46, 'dropper-glass': 39, moisturise: 66, 'glow-portrait': 104, 'espresso-reel': 193, 'class-reel': 191, 'dhow-reel': 222, 'routine-reel': 164 };

  /* ---------- brands, accounts, people ---------- */
  var BR = {
    sav: { id: 'b-sav', name: 'Savanna Roast', handle: 'savannaroast', color: '#8A5A2B', industry: 'Specialty coffee roaster & café · Nairobi', clientApproval: true },
    kil: { id: 'b-kil', name: 'Kilele Fitness', handle: 'kilelefit', color: '#D9480F', industry: 'Boutique training studio · Westlands', clientApproval: false },
    pwa: { id: 'b-pwa', name: 'Pwani Stays', handle: 'pwanistays', color: '#1971C2', industry: 'Boutique beach hotel · Diani', clientApproval: true },
    zur: { id: 'b-zur', name: 'Zuri Botanics', handle: 'zuribotanics', color: '#A6476F', industry: 'Natural skincare · made in Kenya', clientApproval: true },
    mta: { id: 'b-mta', name: 'Mtaa Bakery', handle: 'mtaabakery', color: '#6741D9', industry: 'Neighbourhood bakery · onboarding', clientApproval: true }
  };
  var ACC = [
    ['a-sav-ig', 'sav', 'instagram', 'Savanna Roast', '@savannaroast', 18400, 'sample'],
    ['a-sav-fb', 'sav', 'facebook', 'Savanna Roast Coffee', 'Savanna Roast Coffee', 9200, 'sample'],
    ['a-sav-tt', 'sav', 'tiktok', 'Savanna Roast', '@savannaroast', 6100, 'sample'],
    ['a-sav-li', 'sav', 'linkedin', 'Savanna Roast Co.', 'Savanna Roast Co.', 1450, 'sample'],
    ['a-kil-ig', 'kil', 'instagram', 'Kilele Fitness', '@kilelefit', 24700, 'sample'],
    ['a-kil-tt', 'kil', 'tiktok', 'Kilele Fitness', '@kilelefit', 41300, 'sample'],
    ['a-kil-yt', 'kil', 'youtube', 'Kilele Fitness', 'Kilele Fitness', 3900, 'sample'],
    ['a-pwa-ig', 'pwa', 'instagram', 'Pwani Stays', '@pwanistays', 12800, 'expired'],
    ['a-pwa-fb', 'pwa', 'facebook', 'Pwani Stays Diani', 'Pwani Stays Diani', 15600, 'sample'],
    ['a-pwa-x', 'pwa', 'x', 'Pwani Stays', '@pwanistays', 2300, 'sample'],
    ['a-zur-ig', 'zur', 'instagram', 'Zuri Botanics', '@zuribotanics', 31200, 'sample'],
    ['a-zur-tt', 'zur', 'tiktok', 'Zuri Botanics', '@zuribotanics', 22600, 'sample'],
    ['a-zur-fb', 'zur', 'facebook', 'Zuri Botanics', 'Zuri Botanics', 7800, 'sample']
  ];
  var USERS = [
    ['u-wanjiru', 'Wanjiru Kamau', 'wanjiru@northlight.example', 'Founder', 'owner', 'all'],
    ['u-brian', 'Brian Otieno', 'brian@northlight.example', 'Operations lead', 'admin', 'all'],
    ['u-achieng', 'Achieng Odhiambo', 'achieng@northlight.example', 'Account manager', 'manager', ['b-sav', 'b-zur', 'b-mta']],
    ['u-kevin', 'Kevin Mutua', 'kevin@northlight.example', 'Account manager', 'manager', ['b-kil', 'b-pwa']],
    ['u-faith', 'Faith Njeri', 'faith@northlight.example', 'Copywriter', 'creator', 'all'],
    ['u-tony', 'Tony Kiprop', 'tony@northlight.example', 'Designer', 'creator', 'all'],
    ['u-grace', 'Grace Wambui', 'grace@northlight.example', 'Creative lead', 'approver', 'all'],
    ['u-daniel', 'Daniel Kariuki', 'daniel@northlight.example', 'Insights analyst', 'analyst', 'all'],
    ['u-amani', 'Amani Hassan', 'amani@pwanistays.example', 'Marketing, Pwani Stays', 'client', ['b-pwa']],
    ['u-lucy', 'Lucy Mwangi', 'lucy@savannaroast.example', 'Brand manager, Savanna Roast', 'client', ['b-sav']],
    ['u-sam', 'Sam Mwende', 'sam@zuribotanics.example', 'Founder, Zuri Botanics', 'client', ['b-zur'], 'invited']
  ];
  var CAMPS = {
    harvest: ['c-harvest', 'sav', 'Harvest Blend launch', -6, 21, 'Launch the new Nyeri × Kirinyaga seasonal blend'],
    barista: ['c-barista', 'sav', 'Barista Sessions', -70, 60, 'Weekly brew-guide content'],
    reset: ['c-reset', 'kil', '30-Day Reset Challenge', 7, 37, 'Drive sign-ups for the November challenge'],
    stories: ['c-stories', 'kil', 'Member Stories', -60, 60, 'Real members, real progress'],
    festive: ['c-festive', 'pwa', 'Festive Season Escapes', -3, 60, 'Fill December and New Year rooms'],
    weekends: ['c-weekends', 'pwa', 'Coast Weekends', -75, 45, 'Weekend packages for Nairobi travellers'],
    serum: ['c-serum', 'zur', 'Shea Glow Serum launch', 2, 30, 'Pre-orders and launch of the new serum'],
    science: ['c-science', 'zur', 'Skin Science Sundays', -80, 80, 'Ingredient education series']
  };
  var CC = { harvest: '#B7791F', barista: '#8A5A2B', reset: '#D9480F', stories: '#2F62B8', festive: '#0F8A7E', weekends: '#1971C2', serum: '#A6476F', science: '#6E4FB0' };

  /* ---------- captions ----------
     [brandKey, caption, mediaNames, accountSuffixes, campaign, options] */
  var PAST = {
    sav: [
      ['Monday reset, the slow way. Our V60 recipe: 15g Savanna House, 250g water at 93°C, 3 minutes. Save this for your next brew. ☕️\n\n#pourover #kenyancoffee #brewguide', ['pour-over'], ['ig', 'fb'], 'barista'],
      ['Every cup starts here. Small batches, roasted every Tuesday and Friday in Ngong Road so your beans are never more than a week old.\n\n#specialtycoffee #roastery #nairobi', ['roasting'], ['ig', 'fb', 'li'], null],
      ['Latte art practice at 7am hits different. Who’s coming in for one before work?\n\n#latteart #nairobicafe', ['latte-art'], ['ig'], 'barista'],
      ['The perfect shot is 18g in, 36g out, 28 seconds. Watch our head barista Brian dial in this morning’s espresso.', ['espresso-reel'], ['tt', 'ig'], 'barista', { instagram: { type: 'reel' }, tiktok: { privacy: 'everyone' } }],
      ['We’ve paid our farming partners in Nyeri 32% above the fair-trade minimum this season. Here’s what direct trade means for the cooperatives we buy from.', ['coffee-beans'], ['li', 'fb'], null],
      ['Flat white or cortado? Tell us your order and we’ll have it ready on your next visit. 🤎', ['flat-white'], ['ig', 'fb'], null],
      ['Grind size matters more than you think. Too fine and your pour-over chokes; too coarse and it tastes thin. Our quick guide in the carousel.\n\n#coffeetips #brewguide', ['pour-over', 'coffee-beans'], ['ig'], 'barista'],
      ['Saturday cupping session is full! Thank you to the 24 coffee lovers who joined us to taste five lots from Kirinyaga and Nyeri.', ['latte-art'], ['fb', 'ig'], null],
      ['From cherry to cup in 41 days. A look inside this month’s roast.', ['roasting'], ['tt'], 'harvest', { tiktok: { privacy: 'everyone' } }],
      ['We’re hiring a weekend barista for our Kilimani café. Experience with milk texturing a plus, a love of good coffee a must. Apply via the link in bio.', ['espresso-pour'], ['li', 'fb'], null]
    ],
    kil: [
      ['5am crew showed up again. 🔥 Who’s joining Thursday’s Strength 45?\n\n#kilelefit #nairobifitness #morningworkout', ['battle-ropes'], ['ig'], 'stories'],
      ['Mobility isn’t optional. 10 minutes after every session keeps you training for years, not weeks.', ['class-reel'], ['tt', 'ig'], null, { instagram: { type: 'reel' }, tiktok: { privacy: 'everyone' } }],
      ['Meet Wairimu: 14 months with us, first pull-up last week, now training for her first half marathon. This is what consistency looks like. 💪', ['barbell-squad'], ['ig'], 'stories'],
      ['Form check: the dumbbell row. Flat back, elbow to hip, pause at the top. Save it for leg day’s cousin, back day.', ['dumbbell-row'], ['ig', 'tt'], null, { tiktok: { privacy: 'everyone' } }],
      ['Full studio tour + how our 6-week programme works, from first assessment to retest.', ['class-reel'], ['yt'], null, { youtube: { title: 'Inside Kilele Fitness: how our 6-week programme works', type: 'video' } }],
      ['New kettlebells just landed. 8kg to 32kg, ready for Saturday’s KB Flow class.', ['kettlebells'], ['ig'], null],
      ['Run club, every Sunday, 6:30am from Arboretum gate. All paces welcome, coffee after.', ['sunrise-run'], ['ig', 'tt'], null, { tiktok: { privacy: 'everyone' } }],
      ['Rest days are training days too. Sleep, protein, a walk. That’s it.', ['mat-class'], ['ig'], null],
      ['3 moves to fix desk posture, 10 minutes, no equipment.', ['class-reel'], ['yt', 'tt'], null, { youtube: { title: '3 moves to fix desk posture (10 minutes, no equipment)', type: 'short' }, tiktok: { privacy: 'everyone' } }],
      ['Coach Otieno’s rule: leave two reps in the tank on most sets. Train hard, recover harder.', ['barbell-squad'], ['tt'], 'stories', { tiktok: { privacy: 'everyone' } }]
    ],
    pwa: [
      ['Sunset sails leave the beach at 5:30pm every Friday and Saturday. Bring your camera; the dolphins usually come too. 🐬\n\n#diani #kenyancoast', ['dhow-sunset'], ['ig', 'fb'], 'weekends'],
      ['Your Nairobi weekend, upgraded. Friday flight, two nights by the ocean, Sunday brunch. From KES 38,500 per person sharing.', ['infinity-deck'], ['fb', 'ig', 'x'], 'weekends'],
      ['Mornings at Pwani: swim, breakfast on the deck, do absolutely nothing until lunch.', ['pool-palms'], ['ig'], null],
      ['The tide is out, the sand is warm and the water is 27°C. Diani today. 🌊', ['white-beach'], ['ig', 'fb', 'x'], null],
      ['Our garden suites are now open after a full refresh: new linen, rain showers, and a private terrace for every room.', ['suite'], ['fb', 'ig'], null],
      ['Planning a coast wedding? Our events team can host up to 120 guests on the beach lawn. Enquiries via DM.', ['coastline'], ['fb'], null],
      ['Golden hour from the deck. No filter needed.', ['dhow-reel'], ['ig'], 'weekends', { instagram: { type: 'reel' } }],
      ['Thank you to everyone who stayed with us over Mashujaa weekend. 96% occupancy and a lot of happy sunburns. ☀️', ['pool-palms'], ['fb', 'x'], null]
    ],
    zur: [
      ['Shea, baobab and a little patience. Our butters are whipped by hand in small batches in Nanyuki.\n\n#naturalskincare #madeinkenya', ['textures'], ['ig', 'fb'], 'science'],
      ['Skin Science Sunday: what does “non-comedogenic” actually mean? A thread on oils that won’t clog your pores. 🧪', ['dropper-glass'], ['ig'], 'science'],
      ['Your evening routine in 30 seconds: cleanse, tone, a few drops of oil, then moisturise.', ['routine-reel'], ['tt', 'ig'], 'science', { instagram: { type: 'reel' }, tiktok: { privacy: 'everyone' } }],
      ['Rose quartz roller + our Baobab Facial Oil = a 5-minute ritual that actually feels like self-care.', ['roller-oil'], ['ig', 'fb'], null],
      ['Real skin, no retouching. Thank you Achieng for trusting us with your routine for 3 months. 🤍', ['moisturise'], ['ig'], null],
      ['Ingredient spotlight: marula oil is rich in antioxidants and absorbs fast, which is why it’s the base of our day oil.', ['dropper-glass'], ['fb', 'ig'], 'science'],
      ['Restocked! Shea Body Butter 200ml is back in all three sizes. Link in bio.', ['textures'], ['ig', 'tt'], null, { tiktok: { privacy: 'everyone' } }],
      ['Why we use amber glass: it protects light-sensitive oils so they stay effective for longer.', ['serum-duo'], ['fb'], 'science']
    ]
  };
  // upcoming + workflow posts: [brand, caption, media, accounts, campaign, status, dayOffset, time, author, opts, extra]
  var NEXT = [
    ['sav', 'Introducing Harvest Blend: Nyeri AA meets Kirinyaga peaberry. Notes of blackcurrant, cocoa and orange zest. Available in-store and online from Friday. ☕️\n\n#harvestblend #kenyancoffee #newrelease', ['coffee-beans', 'roasting'], ['ig', 'fb'], 'harvest', 'scheduled', 1, '08:00', 'u-faith'],
    ['sav', 'Behind the roast: 14 minutes, 212°C, and a lot of listening for first crack. This is how Harvest Blend gets its sweetness.', ['espresso-reel'], ['tt'], 'harvest', 'scheduled', 2, '18:30', 'u-tony', { tiktok: { privacy: 'everyone' } }],
    ['sav', 'Harvest Blend launch weekend: buy any 500g bag and get a free pour-over class for two. Ts & Cs in store.', ['latte-art'], ['ig', 'fb'], 'harvest', 'in_review', 4, '09:00', 'u-faith', null, { stage: 1 }],
    ['sav', 'How we source: a short film from our visit to the Gikanda cooperative in Nyeri.', ['coffee-beans'], ['li'], 'harvest', 'changes_requested', 6, '12:30', 'u-faith', null, { feedback: ['u-lucy', 'Love this. Can we name the cooperative’s chairperson and add a line about the 32% premium? Lucy'] }],
    ['sav', 'Your weekend brew guide: AeroPress, inverted method, 1:15 ratio. Full recipe in the caption.', ['pour-over'], ['ig'], 'barista', 'draft', 8, '07:30', 'u-tony'],
    ['sav', 'Flat white Friday. Come say hi at Kilimani or Westlands.', ['flat-white'], ['ig', 'fb'], null, 'approved', 3, '07:30', 'u-faith'],
    ['kil', 'The 30-Day Reset Challenge starts 1 November. Three sessions a week, a nutrition guide and a community that won’t let you quit. Sign-ups open now, link in bio. 🔥\n\n#kileleReset #nairobifitness', ['mat-class'], ['ig', 'tt'], 'reset', 'scheduled', 1, '19:00', 'u-faith', { tiktok: { privacy: 'everyone' } }],
    ['kil', 'What to expect in week one of the Reset: assessment, form coaching, and a lot of high-fives.', ['class-reel'], ['yt'], 'reset', 'scheduled', 3, '17:00', 'u-tony', { youtube: { title: 'Week one of the 30-Day Reset: what to expect', type: 'short' } }],
    ['kil', 'Kettlebell swings: hips, not arms. Three cues that fixed it for 200+ members.', ['kettlebells'], ['ig', 'tt'], 'reset', 'in_review', 5, '18:00', 'u-tony', { tiktok: { privacy: 'everyone' } }],
    ['kil', 'Member story: Brian lost 9kg and found a new sport. Full interview on our channel.', ['barbell-squad'], ['ig'], 'stories', 'draft', 9, '12:00', 'u-faith'],
    ['kil', 'Sunday run club is back after the rains. Meet 6:30am, Arboretum gate.', ['sunrise-run'], ['ig'], null, 'scheduled', 6, '17:30', 'u-kevin'],
    ['pwa', 'Festive Season Escapes are open: 3 nights in December with breakfast, a sunset sail and airport transfers. Early-bird rate ends 15 November.\n\n#diani #festiveseason #kenyancoast', ['white-beach'], ['fb', 'x'], 'festive', 'scheduled', 2, '10:00', 'u-faith'],
    ['pwa', 'New Year’s Eve on the beach lawn: live band, seafood grill and fireworks over the ocean. Limited rooms left.', ['pool-palms'], ['ig', 'fb'], 'festive', 'in_review', 7, '18:00', 'u-faith'],
    ['pwa', 'Room tour: the Ocean Suite, from sunrise to sunset.', ['suite'], ['ig'], 'festive', 'draft', 11, '19:00', 'u-tony'],
    ['pwa', 'Weekend forecast for Diani: 29°C, light breeze, perfect for the sail. A few spots left for Saturday.', ['dhow-sunset'], ['ig'], 'weekends', 'failed', -1, '16:00', 'u-kevin'],
    ['zur', 'Something golden is coming. 03.11 ✨', ['glow-portrait'], ['ig', 'tt', 'fb'], 'serum', 'scheduled', 1, '20:00', 'u-tony', { tiktok: { privacy: 'everyone' } }],
    ['zur', 'Shea Glow Serum pre-orders open Monday: shea oleosomes, niacinamide and baobab seed oil for a soft, even glow. First 300 orders include a jade roller.\n\n#sheaglow #naturalskincare', ['serum-duo', 'dropper-white'], ['ig', 'fb'], 'serum', 'in_review', 4, '09:00', 'u-faith'],
    ['zur', 'Skin Science Sunday: niacinamide vs vitamin C. Can you use them together? (Yes. Here’s how.)', ['dropper-glass'], ['ig'], 'science', 'approved', 5, '11:00', 'u-faith'],
    ['zur', 'Unboxing the new serum with our founder Sam.', ['routine-reel'], ['tt'], 'serum', 'draft', 10, '19:30', 'u-tony'],
    ['zur', 'Day oil, night oil, or both? Our quick guide to building a routine that suits your skin.', ['roller-oil'], ['fb'], null, 'scheduled', 3, '12:30', 'u-achieng']
  ];

  OS.seed = function () {
    var R = rng(20261025), now = Date.now(), today = T.todayKey();
    var ws = {
      id: 'ws-northlight', name: 'Northlight Studio', plan: 'Agency', timezone: 'Africa/Nairobi', weekStart: 1, defaultTime: '09:00',
      bestTimes: { instagram: '19:00', facebook: '12:30', linkedin: '08:30', tiktok: '19:30', youtube: '17:00', x: '12:00' },
      approval: { requireBeforeSchedule: true, allowSelfApproval: false, stages: [{ id: 'internal', name: 'Internal review', roles: ['owner', 'admin', 'manager', 'approver'], enabled: true }, { id: 'client', name: 'Client approval', roles: ['owner', 'admin', 'client'], enabled: true }] },
      notifications: { submitted: { app: true, email: true }, approved: { app: true, email: false }, changes: { app: true, email: true }, failed: { app: true, email: true }, mention: { app: true, email: true }, inbox: { app: true, email: false }, digest: 'weekly' },
      matrix: JSON.parse(JSON.stringify(OS.policy.DEFAULT_MATRIX))
    };
    var brands = Object.keys(BR).map(function (k) { var b = BR[k]; return { id: b.id, key: k, name: b.name, handle: b.handle, color: b.color, industry: b.industry, clientApproval: b.clientApproval, createdAt: new Date(now - (k === 'mta' ? 3 : 200) * 864e5).toISOString() }; });
    var bid = function (k) { return BR[k].id; };
    var users = USERS.map(function (u, i) { return { id: u[0], name: u[1], email: u[2], title: u[3], role: u[4], brands: u[5], status: u[6] || 'active', lastActive: u[6] ? null : new Date(now - (i * 37 + 5) * 60000 * (i % 3 ? 9 : 1)).toISOString(), joinedAt: new Date(now - (300 - i * 20) * 864e5).toISOString() }; });
    var accounts = ACC.map(function (a, i) {
      return { id: a[0], brandId: bid(a[1]), platform: a[2], name: a[3], handle: a[4], followers: a[5], status: a[6], connection: 'sample', connectedAt: new Date(now - (180 - i * 7) * 864e5).toISOString(), lastSync: a[6] === 'expired' ? new Date(now - 6 * 864e5).toISOString() : new Date(now - (i * 13 + 9) * 60000).toISOString(), note: a[6] === 'expired' ? 'Access token expired 6 days ago. Reconnect to resume publishing.' : '' };
    });
    var campaigns = Object.keys(CAMPS).map(function (k) { var c = CAMPS[k]; return { id: c[0], key: k, brandId: bid(c[1]), name: c[2], start: T.addDaysKey(today, c[3]), end: T.addDaysKey(today, c[4]), goal: c[5], color: CC[k] }; });
    var campId = function (k) { return k ? CAMPS[k][0] : null; };
    var assets = ASSETS.map(function (a, i) {
      var vid = a[1] === 'video', d = DIMS[a[0]] || [720, 1280];
      return { id: 'm-' + a[0], name: a[0] + (vid ? '.mp4' : '.webp'), type: a[1], brandId: bid(a[2]), campaignId: campId(a[3]), tags: a[4], alt: a[5], credit: a[6],
        src: vid ? VID + a[0] + '.mp4' : MEDIA + a[0] + '-1080.webp', srcAlt: vid ? VID + a[0] + '.webm' : null, thumb: vid ? VID + a[0] + '-poster.webp' : MEDIA + a[0] + '-400.webp',
        w: vid ? 720 : d[0], h: vid ? 1280 : d[1], duration: vid ? 7 : null, size: (SIZES[a[0]] || 80) * 1024, uploadedAt: new Date(now - (40 + i * 3) * 864e5).toISOString(), uploadedBy: i % 2 ? 'u-tony' : 'u-faith', sample: true };
    });
    var assetId = function (n) { return 'm-' + n; };
    var acc = function (k, suf) { return 'a-' + k + '-' + suf; };
    var posts = [], seq = 1;
    function pid() { return 'p-' + String(seq++).padStart(3, '0'); }

    // published history: spread over the last ~50 days
    Object.keys(PAST).forEach(function (k, bi) {
      PAST[k].forEach(function (c, i) {
        var dayOff = -(2 + Math.round(i * 4.6 + bi * 1.3)), times = ['07:30', '12:30', '18:00', '19:30'], at = T.iso(T.addDaysKey(today, dayOff), times[(i + bi) % 4]);
        var ids = c[2].map(function (s) { return acc(k, s); });
        var p = { id: pid(), brandId: bid(k), caption: c[0], accountIds: ids, mediaIds: c[1].map(assetId), options: c[4] || {}, campaignId: campId(c[3]), labels: [], status: 'published', stage: 0, version: 2,
          scheduledAt: at, publishedAt: at, authorId: i % 2 ? 'u-tony' : 'u-faith', createdAt: new Date(new Date(at).getTime() - 5 * 864e5).toISOString(), updatedAt: at, approvals: [], comments: [], results: {}, metrics: {}, sample: true };
        p.approvals.push({ stageId: 'internal', stageName: 'Internal review', userId: k === 'kil' || k === 'pwa' ? 'u-kevin' : 'u-achieng', decision: 'approved', at: new Date(new Date(at).getTime() - 3 * 864e5).toISOString(), version: 2 });
        if (BR[k].clientApproval && k !== 'zur') p.approvals.push({ stageId: 'client', stageName: 'Client approval', userId: k === 'pwa' ? 'u-amani' : 'u-lucy', decision: 'approved', at: new Date(new Date(at).getTime() - 2 * 864e5).toISOString(), version: 2 });
        if (k === 'zur' && BR[k].clientApproval) p.approvals.push({ stageId: 'client', stageName: 'Client approval', userId: 'u-wanjiru', decision: 'approved', at: new Date(new Date(at).getTime() - 2 * 864e5).toISOString(), version: 2, note: 'Approved on the client’s behalf (by email).' });
        ids.forEach(function (aid) {
          var a = accounts.filter(function (x) { return x.id === aid; })[0], rr = rng(hash(p.id + aid));
          var vid = c[1].some(function (n) { return /reel/.test(n); });
          var base = a.followers * (a.platform === 'tiktok' ? (vid ? 0.9 + rr() * 1.6 : 0.4) : a.platform === 'linkedin' ? 0.55 : a.platform === 'x' ? 0.35 : a.platform === 'youtube' ? 0.8 + rr() * 2 : 0.28 + rr() * 0.32);
          var reach = Math.round(base * (0.7 + rr() * 0.9)), er = (a.platform === 'tiktok' ? 0.055 : a.platform === 'linkedin' ? 0.034 : a.platform === 'x' ? 0.018 : 0.042) * (0.6 + rr() * 0.9);
          var eng = Math.round(reach * er), likes = Math.round(eng * 0.78), comments = Math.round(eng * 0.07), shares = Math.round(eng * 0.08), saves = eng - likes - comments - shares;
          p.results[aid] = { ok: true, simulated: false, sample: true, at: at };
          p.metrics[aid] = { reach: reach, impressions: Math.round(reach * (1.25 + rr() * 0.5)), likes: likes, comments: comments, shares: shares, saves: Math.max(0, saves), clicks: Math.round(reach * (0.004 + rr() * 0.01)), views: vid ? Math.round(reach * (1.4 + rr())) : 0 };
        });
        posts.push(p);
      });
    });

    // workflow + upcoming
    NEXT.forEach(function (n, i) {
      var k = n[0], at = T.iso(T.addDaysKey(today, n[6]), n[7]), ids = n[3].map(function (s) { return acc(k, s); }), x = n[10] || {};
      var p = { id: pid(), brandId: bid(k), caption: n[1], accountIds: ids, mediaIds: n[2].map(assetId), options: n[9] || {}, campaignId: campId(n[4]), labels: [], status: n[5], stage: x.stage || 0, version: 1,
        scheduledAt: at, publishedAt: null, authorId: n[8], createdAt: new Date(now - (6 - i % 5) * 864e5 - i * 3600e3).toISOString(), updatedAt: new Date(now - (i % 4 + 1) * 3600e3 * 5).toISOString(), approvals: [], comments: [], results: {}, metrics: null, sample: true };
      var reviewer = k === 'kil' || k === 'pwa' ? 'u-kevin' : 'u-achieng';
      if (n[5] === 'in_review') {
        p.submittedAt = new Date(now - (i % 3 + 1) * 3600e3 * 7).toISOString();
        if (p.stage === 1) p.approvals.push({ stageId: 'internal', stageName: 'Internal review', userId: reviewer, decision: 'approved', at: new Date(now - 3 * 3600e3).toISOString(), version: 1 });
        p.comments.push({ id: 'c' + i + 'a', userId: n[8], body: 'Ready for review. Copy is final; the image is the colour-graded version from Tuesday’s shoot.', at: p.submittedAt, version: 1, kind: 'comment' });
      }
      if (n[5] === 'changes_requested') {
        p.version = 1; p.submittedAt = new Date(now - 2 * 864e5).toISOString();
        p.approvals.push({ stageId: 'internal', stageName: 'Internal review', userId: reviewer, decision: 'approved', at: new Date(now - 40 * 3600e3).toISOString(), version: 1 });
        p.approvals.push({ stageId: 'client', stageName: 'Client approval', userId: x.feedback[0], decision: 'changes', at: new Date(now - 20 * 3600e3).toISOString(), version: 1, note: x.feedback[1] });
        p.comments.push({ id: 'c' + i + 'f', userId: x.feedback[0], body: x.feedback[1], at: new Date(now - 20 * 3600e3).toISOString(), version: 1, kind: 'feedback' });
      }
      if (n[5] === 'approved' || n[5] === 'scheduled' || n[5] === 'failed') {
        p.approvals.push({ stageId: 'internal', stageName: 'Internal review', userId: reviewer, decision: 'approved', at: new Date(now - (30 + i) * 3600e3).toISOString(), version: 1 });
        if (BR[k].clientApproval) p.approvals.push({ stageId: 'client', stageName: 'Client approval', userId: k === 'pwa' ? 'u-amani' : k === 'sav' ? 'u-lucy' : 'u-wanjiru', decision: 'approved', at: new Date(now - (20 + i) * 3600e3).toISOString(), version: 1 });
      }
      if (n[5] === 'failed') {
        p.results[ids[0]] = { ok: false, at: at, error: 'The connection to @pwanistays has expired. Reconnect the account and try again.' };
        p.failedAt = at;
      }
      posts.push(p);
    });
    // an older draft caption idea (no date) for the library's caption drafts
    posts.push({ id: pid(), brandId: bid('mta'), caption: 'Fresh mandazi and chapati every morning from 6am. Pre-order for office meetings via WhatsApp.', accountIds: [], mediaIds: [], options: {}, campaignId: null, labels: ['idea'], status: 'draft', stage: 0, version: 1, scheduledAt: null, publishedAt: null, authorId: 'u-faith', createdAt: new Date(now - 2 * 864e5).toISOString(), updatedAt: new Date(now - 2 * 864e5).toISOString(), approvals: [], comments: [], results: {}, metrics: null, sample: true });

    var snippets = [
      { id: 's1', brandId: 'b-sav', name: 'Coffee hashtags', body: '#kenyancoffee #specialtycoffee #nairobicafe #brewguide', kind: 'hashtags' },
      { id: 's2', brandId: 'b-kil', name: 'Studio hashtags', body: '#kilelefit #nairobifitness #strengthtraining', kind: 'hashtags' },
      { id: 's3', brandId: 'b-pwa', name: 'Coast hashtags', body: '#diani #kenyancoast #beachholiday #magicalkenya', kind: 'hashtags' },
      { id: 's4', brandId: 'b-zur', name: 'Skincare hashtags', body: '#naturalskincare #madeinkenya #skinsciencesunday', kind: 'hashtags' },
      { id: 's5', brandId: 'b-pwa', name: 'Booking sign-off', body: 'Book direct for the best rate: link in bio or WhatsApp our reservations team.', kind: 'caption' },
      { id: 's6', brandId: 'b-sav', name: 'Café locations', body: 'Find us in Kilimani (7am–7pm) and Westlands (7am–9pm), every day.', kind: 'caption' }
    ];

    // inbox
    var C = [];
    function conv(id, k, accSuf, kind, contact, handle, postIdx, msgs, o) {
      o = o || {};
      C.push({ id: id, brandId: bid(k), accountId: acc(k, accSuf), kind: kind, contact: { name: contact, handle: handle }, postId: postIdx != null ? posts[postIdx] && posts[postIdx].id : null,
        messages: msgs.map(function (m, j) { return { id: id + '-' + j, from: m[0], userId: m[3] || null, body: m[1], at: new Date(now - m[2] * 60000).toISOString() }; }),
        status: o.status || 'open', unread: !!o.unread, assigneeId: o.assignee || null, tags: o.tags || [], sample: true });
    }
    conv('i1', 'sav', 'ig', 'comment', 'Mercy W.', '@mercy.wanjiku', 0, [['them', 'Tried this recipe with your Gatomboya beans and it was the best cup I’ve made at home. What grind setting do you use on a hand grinder?', 42]], { unread: true, tags: ['question'] });
    conv('i2', 'sav', 'ig', 'dm', 'Jabali Office Park', '@jabali.offices', null, [['them', 'Hi! Do you do coffee catering for corporate events? We have a 60-person launch on the 14th.', 180], ['note', 'Lead for the catering menu. Sending to Lucy at Savanna for pricing.', 160, 'u-achieng']], { unread: true, assignee: 'u-achieng', tags: ['sales lead'] });
    conv('i3', 'sav', 'fb', 'comment', 'Peter Kamau', 'Peter Kamau', 4, [['them', 'Proud to see Kenyan farmers getting a better deal. Keep it up 👏', 600], ['us', 'Thank you Peter! The cooperatives are the real heroes here.', 560, 'u-faith']], { status: 'resolved' });
    conv('i4', 'kil', 'ig', 'dm', 'Njoki', '@njoki.runs', null, [['them', 'Is the Reset Challenge okay for complete beginners? I haven’t trained in 2 years.', 25]], { unread: true, tags: ['question'] });
    conv('i5', 'kil', 'tt', 'comment', 'fitwithjay', '@fitwithjay', 15, [['them', 'what weight should a beginner start with for swings??', 95]], { unread: true });
    conv('i6', 'kil', 'ig', 'mention', 'Wairimu G.', '@wairimu.g', null, [['them', 'First pull-up EVER at @kilelefit this morning 😭🙌 14 months of showing up', 300], ['note', 'Great UGC. Ask for permission to repost in Member Stories.', 280, 'u-kevin']], { assignee: 'u-faith', tags: ['ugc'] });
    conv('i7', 'pwa', 'fb', 'dm', 'Hassan Ali', 'Hassan Ali', null, [['them', 'Hello, what is the rate for 2 adults and 2 kids (6 and 9) for 3 nights from 27 Dec?', 70], ['note', 'Festive rates aren’t loaded yet. Amani to confirm by tomorrow.', 50, 'u-kevin']], { unread: true, assignee: 'u-kevin', tags: ['booking'] });
    conv('i8', 'pwa', 'x', 'mention', 'Travel With Wendy', '@wendytravels', null, [['them', 'Woke up to this view at @pwanistays and honestly I don’t want to go back to Nairobi 🌊', 1500], ['us', 'Stay another night, Wendy, we won’t tell anyone 😉', 1440, 'u-faith']], { status: 'resolved', tags: ['ugc'] });
    conv('i9', 'pwa', 'fb', 'comment', 'Grace Achieng', 'Grace Achieng', 20, [['them', 'Do you allow day visitors for the sunset sail or only guests?', 400]], {});
    conv('i10', 'zur', 'ig', 'comment', 'Shiro', '@shiro.skin', 33, [['them', 'Can I use the day oil under sunscreen? My skin is quite oily.', 33]], { unread: true, tags: ['question'] });
    conv('i11', 'zur', 'ig', 'dm', 'Nia Beauty Store', '@niabeauty.ke', null, [['them', 'We’d love to stock Zuri Botanics in our Kisumu store. Who can we talk to about wholesale?', 240], ['us', 'Hi Nia! Thank you. Please email wholesale@zuribotanics.example and Sam will get back to you this week.', 200, 'u-achieng']], { assignee: 'u-achieng', tags: ['wholesale'] });
    conv('i12', 'zur', 'tt', 'comment', 'kemmy', '@kemmy_k', 34, [['them', 'my order hasn’t arrived and it’s been 9 days 😕', 120]], { unread: true, tags: ['complaint'], assignee: 'u-achieng' });


    var notifications = [
      { id: 'n1', kind: 'warn', icon: 'alert', title: 'Post failed to publish', body: 'Pwani Stays · Instagram connection expired', link: '#/calendar?view=list&status=failed', at: new Date(now - 18 * 3600e3).toISOString(), read: false },
      { id: 'n2', kind: 'info', icon: 'check', title: '3 posts are waiting for review', body: 'Savanna Roast, Kilele Fitness, Zuri Botanics', link: '#/approvals', at: new Date(now - 4 * 3600e3).toISOString(), read: false },
      { id: 'n3', kind: 'info', icon: 'message', title: 'Lucy Mwangi requested changes', body: '“How we source: a short film…”', link: '#/approvals?tab=changes', at: new Date(now - 20 * 3600e3).toISOString(), read: false },
      { id: 'n4', kind: 'info', icon: 'inbox', title: '6 unread conversations', body: 'Comments and messages across 4 brands', link: '#/inbox', at: new Date(now - 40 * 60000).toISOString(), read: true }
    ];

    return {
      v: 1, seededAt: new Date(now).toISOString(), currentUserId: 'u-wanjiru', workspace: ws, brands: brands, users: users, accounts: accounts, campaigns: campaigns, assets: assets,
      posts: posts, snippets: snippets, conversations: C, notifications: notifications,
      activity: [
        { id: 'ac1', at: new Date(now - 20 * 3600e3).toISOString(), userId: 'u-lucy', type: 'changes', text: 'requested changes on “How we source: a short film…”', brandId: 'b-sav' },
        { id: 'ac2', at: new Date(now - 18 * 3600e3).toISOString(), userId: null, type: 'failed', text: 'A Pwani Stays post failed: Instagram connection expired', brandId: 'b-pwa' },
        { id: 'ac3', at: new Date(now - 7 * 3600e3).toISOString(), userId: 'u-faith', type: 'submitted', text: 'submitted “Shea Glow Serum pre-orders open Monday…” for review', brandId: 'b-zur' },
        { id: 'ac4', at: new Date(now - 5 * 3600e3).toISOString(), userId: 'u-tony', type: 'submitted', text: 'submitted “Kettlebell swings: hips, not arms…” for review', brandId: 'b-kil' },
        { id: 'ac5', at: new Date(now - 3 * 3600e3).toISOString(), userId: 'u-achieng', type: 'approved', text: 'approved the internal review of “Harvest Blend launch weekend…”', brandId: 'b-sav' },
        { id: 'ac6', at: new Date(now - 2 * 3600e3).toISOString(), userId: 'u-kevin', type: 'scheduled', text: 'scheduled “Sunday run club is back after the rains…”', brandId: 'b-kil' }
      ]
    };
  };

  /* ---------- sample analytics ----------
     Generated on the fly from the account id and the day, so it never
     has to be stored and always looks the same for the same day. */
  OS.sampleDaily = function (account, dayKey, daysAgo) {
    var r = rng(hash(account.id + dayKey)), p = account.platform;
    var dow = T.dowOfKey(dayKey), weekday = [0.82, 1.04, 1.08, 1.02, 1.1, 0.98, 0.86][dow];
    var growth = { instagram: 0.0011, tiktok: 0.0026, facebook: 0.0004, linkedin: 0.0009, youtube: 0.0016, x: 0.0003 }[p] || 0.001;
    var followers = Math.round(account.followers / Math.pow(1 + growth, daysAgo));
    var reachRate = { instagram: 0.11, tiktok: 0.32, facebook: 0.07, linkedin: 0.09, youtube: 0.18, x: 0.05 }[p] || 0.1;
    var reach = Math.round(followers * reachRate * weekday * (0.72 + r() * 0.6));
    var er = { instagram: 0.041, tiktok: 0.058, facebook: 0.022, linkedin: 0.033, youtube: 0.047, x: 0.016 }[p] || 0.03;
    var eng = Math.round(reach * er * (0.7 + r() * 0.6));
    return { followers: followers, reach: reach, impressions: Math.round(reach * (1.35 + r() * 0.4)), engagements: eng, clicks: Math.round(reach * 0.006 * (0.6 + r())) };
  };
})();
