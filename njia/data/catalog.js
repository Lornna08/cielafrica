/* ==========================================================================
   NJIA — sample catalogue (template data)
   Replace with your own products. Images are Unsplash photo ids served from
   the Unsplash CDN (see js/core.js → U.img); swap them for your own product
   photography before launch. Stock is per size. `best: true` marks the
   manually curated Bestsellers row; it is not calculated from sales.
   ========================================================================== */
(function () {
  var N = window.NJIA;
  var TOP = ['XS', 'S', 'M', 'L', 'XL', 'XXL'], JEAN = ['28', '30', '32', '34', '36', '38'], ONE = ['One size'];
  function stock(sizes, map) { var o = {}; sizes.forEach(function (s, i) { o[s] = map && s in map ? map[s] : 6 + (i * 3) % 7; }); return o; }
  var C = {
    white: ['White', '#F4F3EF'], black: ['Black', '#1B1B1B'], ecru: ['Ecru', '#ECE6D8'], slate: ['Powder blue', '#A9BCD0'], sage: ['Sage', '#7E9488'], butter: ['Butter', '#EBD98C'], sky: ['Sky', '#9DB7D5'],
    olive: ['Olive', '#5E6B45'], indigo: ['Indigo', '#26324F'], mid: ['Mid blue', '#6C86A8'], wblack: ['Washed black', '#3A3A3A'],
    sand: ['Sand', '#C9B48E'], rose: ['Dusty rose', '#D9A3A6'], lilac: ['Lilac', '#B9A8D4'], mustard: ['Mustard', '#D6A928'],
    tan: ['Tan', '#B8946A'], camo: ['Camo', '#5D5A3E'], stripe: ['Blue stripe', '#8FA6C4'], grey: ['Heather grey', '#A9A9A6']
  };
  function col(k, img) { return { n: C[k][0], hex: C[k][1], img: img || 0 }; }

  N.categories = [
    { id: 'tops', name: 'Tops', types: ['T-shirts', 'Shirts', 'Hoodies & sweats'] },
    { id: 'jackets', name: 'Jackets', types: ['Jackets'] },
    { id: 'bottoms', name: 'Bottoms', types: ['Jeans', 'Trousers', 'Sets'] },
    { id: 'accessories', name: 'Accessories', types: ['Caps & hats'] }
  ];

  /* g: w = women, m = men, u = unisex · added: ISO date (New In = last 30 days) */
  N.products = [
    { id: 'p01', slug: 'lane-heavyweight-tee', name: 'Lane Heavyweight Tee', type: 'T-shirts', cat: 'tops', g: 'u', price: 2200, best: true, tags: ['essentials'], added: '2026-10-20',
      colors: [col('white')], sizes: TOP, stock: stock(TOP, { XXL: 0 }),
      imgs: ['photo-1778671394516-8270eac13c42', 'photo-1581655353564-df123a1eb820', 'photo-1584865288642-42078afe6942'], pos: ['50% 50%', '50% 45%', '50% 30%'],
      desc: 'The tee everything else is built around. A dense 240 gsm cotton jersey that holds its shape, cut boxy through the body with a dropped shoulder and a ribbed collar that stays flat.',
      fit: 'Relaxed, boxy fit. Take your usual size; size down for a closer fit.', fabric: '100% combed cotton, 240 gsm. Machine wash cold, inside out.' },
    { id: 'p02', slug: 'everyday-boxy-tee', name: 'Everyday Boxy Tee', type: 'T-shirts', cat: 'tops', g: 'm', price: 1900, tags: ['essentials'], added: '2026-08-30',
      colors: [col('black')], sizes: TOP, stock: stock(TOP),
      imgs: ['photo-1763750581767-b367bcd6c117'], pos: ['50% 25%'],
      desc: 'A lighter everyday tee with a short, square body and slightly longer sleeves. Made for heat, layering and the days you change twice.',
      fit: 'Boxy and slightly cropped. True to size.', fabric: '100% cotton, 190 gsm. Machine wash cold.' },
    { id: 'p03', slug: 'cropped-rib-tee', name: 'Cropped Rib Tee', type: 'T-shirts', cat: 'tops', g: 'w', price: 1800, tags: ['essentials'], added: '2026-10-22',
      colors: [col('black')], sizes: TOP, stock: stock(TOP, { XS: 2 }),
      imgs: ['photo-1780566036282-e0845b9e4efe'], pos: ['50% 20%'],
      desc: 'A fine-rib tee with a cropped length and a contrast trim at the neck. Sits close without clinging.',
      fit: 'Fitted, cropped at the waist. True to size.', fabric: '95% cotton, 5% elastane rib. Machine wash cold, dry flat.' },
    { id: 'p04', slug: 'graphic-boxy-tee', name: 'Graphic Boxy Tee', type: 'T-shirts', cat: 'tops', g: 'w', price: 2000, best: true, tags: ['essentials'], added: '2026-09-12',
      colors: [col('black')], sizes: TOP, stock: stock(TOP),
      imgs: ['photo-1626494635269-03814e49ce00'], pos: ['50% 22%'],
      desc: 'A boxy black tee with a bold chest print. Easy with wide trousers, denim or a bucket hat.',
      fit: 'Regular fit. True to size.', fabric: '100% cotton, 200 gsm. Machine wash cold.' },
    { id: 'p05', slug: 'long-sleeve-tee', name: 'Long Sleeve Tee', type: 'T-shirts', cat: 'tops', g: 'u', price: 2600, tags: ['essentials'], added: '2026-10-16',
      colors: [col('black')], sizes: TOP, stock: stock(TOP, { S: 1 }),
      imgs: ['photo-1618354691551-44de113f0164', 'photo-1623193904310-9d38ce94670b'], pos: ['50% 50%', '50% 20%'],
      desc: 'Heavyweight jersey with long, slightly stacked sleeves. The layer for cool mornings and evenings out.',
      fit: 'Relaxed fit with extra sleeve length.', fabric: '100% cotton, 240 gsm. Machine wash cold, inside out.' },
    { id: 'p06', slug: 'garment-dyed-tee-slate', name: 'Garment-Dyed Tee', type: 'T-shirts', cat: 'tops', g: 'u', price: 2400, was: 2900, tags: ['essentials'], added: '2026-07-28',
      colors: [col('slate')], sizes: TOP, stock: stock(TOP, { XS: 0, XXL: 2 }),
      imgs: ['photo-1564584217132-2271feaeb3c5'],
      desc: 'Dyed after it is sewn, so every seam takes the colour a little differently. Soft from the first wear.',
      fit: 'Relaxed fit. True to size.', fabric: '100% cotton, 220 gsm, garment dyed. Wash separately at first.' },
    { id: 'p07', slug: 'classic-crew-tee-sage', name: 'Classic Crew Tee', type: 'T-shirts', cat: 'tops', g: 'm', price: 2100, tags: ['essentials'], added: '2026-08-14',
      colors: [col('sage')], sizes: TOP, stock: stock(TOP),
      imgs: ['photo-1523381294911-8d3cead13475'], pos: ['35% 50%'],
      desc: 'A classic-weight crew neck tee in a washed sage. The quiet one you keep reaching for.',
      fit: 'Regular fit. True to size.', fabric: '100% cotton, 200 gsm. Machine wash cold.' },
    { id: 'p08', slug: 'oversized-poplin-shirt', name: 'Oversized Poplin Shirt', type: 'Shirts', cat: 'tops', g: 'w', price: 3800, tags: ['statement'], added: '2026-10-19',
      colors: [col('white')], sizes: TOP, stock: stock(TOP),
      imgs: ['photo-1629145810320-aec9e63dd798'], pos: ['50% 18%'],
      desc: 'Crisp cotton poplin cut long and generous, with a deep back pleat and dropped shoulders. Wear it buttoned, open or tied.',
      fit: 'Oversized. Size down for a less dramatic shape.', fabric: '100% cotton poplin. Machine wash cold, warm iron.' },
    { id: 'p09', slug: 'breton-stripe-tee', name: 'Breton Stripe Tee', type: 'T-shirts', cat: 'tops', g: 'm', price: 3400, tags: [], added: '2026-09-02',
      colors: [col('stripe')], sizes: TOP, stock: stock(TOP),
      imgs: ['photo-1623472927536-c966c62f0701'], pos: ['50% 22%'],
      desc: 'A soft striped tee with a relaxed body and a straight hem. Made for warm afternoons.',
      fit: 'Relaxed fit. True to size.', fabric: '100% cotton jersey. Machine wash cold, hang to dry.' },
    { id: 'p10', slug: 'loopback-hoodie-ecru', name: 'Loopback Hoodie', type: 'Hoodies & sweats', cat: 'tops', g: 'u', price: 4600, best: true, tags: ['essentials'], added: '2026-10-12',
      colors: [col('ecru')], sizes: TOP, stock: stock(TOP, { M: 3 }),
      imgs: ['photo-1620799140188-3b2a02fd9a77'],
      desc: 'Brushed-back loopback cotton with a double-layer hood, kangaroo pocket and heavy rib cuffs. Soft, warm and built to last.',
      fit: 'Relaxed fit. True to size.', fabric: '100% cotton loopback, 420 gsm. Machine wash cold, inside out.' },
    { id: 'p11', slug: 'fleece-hoodie', name: 'Fleece Hoodie', type: 'Hoodies & sweats', cat: 'tops', g: 'u', price: 3900, was: 4500, tags: ['essentials'], added: '2026-06-30',
      colors: [col('butter'), col('sage'), col('sky'), col('lilac')], sizes: TOP, stock: stock(TOP),
      imgs: ['photo-1699275303942-47957eea44b1'],
      desc: 'A brushed fleece hoodie in soft washed colours, with a lined hood and ribbed hem. The everyday sweat.',
      fit: 'Regular fit. True to size.', fabric: '80% cotton, 20% polyester fleece. Machine wash cold.' },
    { id: 'p12', slug: 'track-set', name: 'Track Set', type: 'Sets', cat: 'bottoms', g: 'w', price: 6800, tags: ['statement'], added: '2026-10-21',
      colors: [col('black')], sizes: TOP, stock: stock(TOP, { L: 0 }),
      imgs: ['photo-1783379800560-eb135f3e87fc'], pos: ['50% 25%'],
      desc: 'A matching zip track top and straight trouser in a smooth tricot. Wear together or apart.',
      fit: 'Relaxed fit. True to size.', fabric: '100% recycled polyester tricot. Machine wash cold.' },
    { id: 'p13', slug: 'indigo-trucker-jacket', name: 'Indigo Trucker Jacket', type: 'Jackets', cat: 'jackets', g: 'm', price: 6500, best: true, tags: ['denim'], added: '2026-09-20',
      colors: [col('indigo')], sizes: TOP, stock: stock(TOP),
      imgs: ['photo-1611312449408-fcece27cdbb7', 'photo-1614693348454-1e0710d21c60'], pos: ['50% 40%', '50% 25%'],
      desc: 'A four-pocket trucker in rigid 13 oz denim that softens and fades with you. Metal shank buttons and adjustable waist tabs.',
      fit: 'Regular fit. Size up to layer over a hoodie.', fabric: '100% cotton denim, 13 oz. Wash rarely, cold, inside out.' },
    { id: 'p14', slug: 'washed-trucker-jacket', name: 'Washed Trucker Jacket', type: 'Jackets', cat: 'jackets', g: 'u', price: 6200, tags: ['denim'], added: '2026-10-14',
      colors: [col('mid')], sizes: TOP, stock: stock(TOP, { XS: 0 }),
      imgs: ['photo-1543076447-215ad9ba6923', 'photo-1555583743-991174c11425'], pos: ['50% 45%', '50% 25%'],
      desc: 'The trucker in a soft vintage wash, already broken in. A boxier body and slightly dropped shoulder.',
      fit: 'Relaxed fit. True to size.', fabric: '100% cotton denim, stone washed. Machine wash cold.' },
    { id: 'p15', slug: 'cropped-denim-jacket', name: 'Cropped Denim Jacket', type: 'Jackets', cat: 'jackets', g: 'w', price: 5900, tags: ['denim'], added: '2026-09-25',
      colors: [col('mid')], sizes: TOP, stock: stock(TOP),
      imgs: ['photo-1577660002965-04865592fc60'], pos: ['50% 25%'],
      desc: 'A cropped denim jacket that finishes at the waist, made to sit over high-rise trousers and dresses.',
      fit: 'Cropped, regular through the body. True to size.', fabric: '100% cotton denim. Machine wash cold.' },
    { id: 'p17', slug: 'camo-field-jacket', name: 'Camo Field Jacket', type: 'Jackets', cat: 'jackets', g: 'm', price: 7800, tags: ['statement'], added: '2026-10-08',
      colors: [col('camo')], sizes: TOP, stock: stock(TOP, { XS: 0, S: 1, XXL: 0 }),
      imgs: ['photo-1778501138238-ba4274919673'], pos: ['50% 25%'],
      desc: 'A four-pocket field jacket in washed camo twill, with a hidden drawcord waist and a corduroy-lined collar.',
      fit: 'Relaxed fit. True to size.', fabric: '100% cotton twill. Machine wash cold, separately.' },
    { id: 'p18', slug: 'utility-overshirt-sand', name: 'Utility Overshirt', type: 'Jackets', cat: 'jackets', g: 'u', price: 5200, tags: ['statement'], added: '2026-10-10',
      colors: [col('sand')], sizes: TOP, stock: stock(TOP),
      imgs: ['photo-1788035839158-44d85a6e8083'], pos: ['50% 25%'],
      desc: 'Somewhere between a shirt and a jacket: brushed cotton canvas, two bellows pockets and snap closures.',
      fit: 'Relaxed fit. True to size.', fabric: '100% cotton canvas. Machine wash cold.' },
    { id: 'p19', slug: 'straight-jean-mid-blue', name: 'Straight Jean', type: 'Jeans', cat: 'bottoms', g: 'u', price: 4400, best: true, tags: ['denim', 'essentials'], added: '2026-09-05',
      colors: [col('mid')], sizes: JEAN, stock: stock(JEAN, { 38: 0 }),
      imgs: ['photo-1714143136372-ddaf8b606da7', 'photo-1714143136361-386dae5672e2'],
      desc: 'A straight, mid-rise five-pocket jean in a clean mid wash. Not skinny, not baggy: the one that goes with everything.',
      fit: 'Straight leg, mid rise. Inseam 81 cm.', fabric: '99% cotton, 1% elastane, 12 oz. Machine wash cold.' },
    { id: 'p20', slug: 'straight-jean-raw-indigo', name: 'Straight Jean Raw', type: 'Jeans', cat: 'bottoms', g: 'u', price: 4600, tags: ['denim'], added: '2026-10-18',
      colors: [col('indigo')], sizes: JEAN, stock: stock(JEAN),
      imgs: ['photo-1714143164072-7646ef5cb24d', 'photo-1713880453396-aa0493e308ec'],
      desc: 'The straight jean in rigid, unwashed indigo. It starts stiff and dark and becomes entirely yours.',
      fit: 'Straight leg, mid rise. Expect about 2 cm of give in the waist.', fabric: '100% cotton raw denim, 14 oz. Wash as rarely as you can.' },
    { id: 'p21', slug: 'relaxed-jean-washed-black', name: 'Relaxed Jean', type: 'Jeans', cat: 'bottoms', g: 'u', price: 4600, was: 5200, tags: ['denim'], added: '2026-07-18',
      colors: [col('wblack')], sizes: JEAN, stock: stock(JEAN, { 28: 2 }),
      imgs: ['photo-1718252540511-e958742e4165'],
      desc: 'A roomier jean with a slightly tapered leg in a soft washed black.',
      fit: 'Relaxed through the thigh, gently tapered. True to size.', fabric: '100% cotton denim. Machine wash cold, inside out.' },
    { id: 'p22', slug: 'cargo-jogger', name: 'Cargo Jogger', type: 'Trousers', cat: 'bottoms', g: 'w', price: 3600, tags: [], added: '2026-10-15',
      colors: [col('rose', 0), col('lilac', 1)], sizes: TOP, stock: stock(TOP),
      imgs: ['photo-1789110520495-8f1b8545c0ff', 'photo-1789110520465-efc5ff05c95e'], pos: ['50% 40%', '50% 40%'],
      desc: 'A soft twill jogger with deep cargo pockets, a drawcord waist and cuffed ankles.',
      fit: 'Relaxed fit with an elastic waist. True to size.', fabric: '98% cotton, 2% elastane twill. Machine wash cold.' },
    { id: 'p23', slug: 'wide-cargo-trouser', name: 'Wide Cargo Trouser', type: 'Trousers', cat: 'bottoms', g: 'w', price: 4200, tags: ['statement'], added: '2026-09-28',
      colors: [col('sand')], sizes: TOP, stock: stock(TOP),
      imgs: ['photo-1790564987301-f147b6cb9ef2'], pos: ['50% 30%'],
      desc: 'A high-rise, wide-leg cargo with a long, swishy line and flat front pockets.',
      fit: 'High rise, wide leg. True to size.', fabric: '100% cotton twill. Machine wash cold.' },
    { id: 'p24', slug: 'six-panel-cap-mustard', name: 'Six-Panel Cap', type: 'Caps & hats', cat: 'accessories', g: 'u', price: 1500, tags: ['essentials'], added: '2026-09-18',
      colors: [col('mustard')], sizes: ONE, stock: stock(ONE, { 'One size': 12 }),
      imgs: ['photo-1645266729222-17cd32e06fd0'],
      desc: 'A soft, unstructured six-panel cap in washed cotton with an adjustable strap.',
      fit: 'One size, adjustable.', fabric: '100% cotton. Hand wash.' },
    { id: 'p25', slug: 'wide-brim-hat-tan', name: 'Wide-Brim Hat', type: 'Caps & hats', cat: 'accessories', g: 'u', price: 2400, tags: ['statement'], added: '2026-08-20',
      colors: [col('tan')], sizes: ONE, stock: stock(ONE, { 'One size': 0 }),
      imgs: ['photo-1789925941317-23b34b25c86f'],
      desc: 'A wide, packable brim in cotton canvas. Proper shade for long days outside.',
      fit: 'One size, with an inner drawcord.', fabric: '100% cotton canvas. Spot clean.' },
    { id: 'p26', slug: 'canvas-bucket-hat', name: 'Canvas Bucket Hat', type: 'Caps & hats', cat: 'accessories', g: 'u', price: 1800, tags: ['essentials'], added: '2026-10-11',
      colors: [col('ecru')], sizes: ['S/M', 'L/XL'], stock: stock(['S/M', 'L/XL']),
      imgs: ['photo-1679324351719-f23312611c50'], pos: ['50% 10%'],
      desc: 'A short-brim bucket in sturdy canvas with stitched eyelets.',
      fit: 'S/M fits 56–57 cm, L/XL fits 58–60 cm.', fabric: '100% cotton canvas. Hand wash.' }
  ];

  /* Collections: route slug → title, intro and rule */
  N.collections = [
    { id: 'all', name: 'Shop all', intro: 'Every piece in the current collection.' },
    { id: 'new-in', name: 'New In', intro: 'The latest pieces, added over the last few weeks.', rule: function (p) { return N.isNew(p); } },
    { id: 'women', name: 'Women', intro: 'Pieces cut for women, plus the unisex essentials.', rule: function (p) { return p.g !== 'm'; } },
    { id: 'men', name: 'Men', intro: 'Pieces cut for men, plus the unisex essentials.', rule: function (p) { return p.g !== 'w'; } },
    { id: 'denim', name: 'Denim', intro: 'Rigid, washed and raw. Jeans and jackets that get better with every wear.', rule: function (p) { return p.tags.indexOf('denim') >= 0; } },
    { id: 'tops', name: 'Tops', intro: 'Heavyweight tees, shirts, hoodies and sweats.', rule: function (p) { return p.cat === 'tops'; } },
    { id: 'jackets', name: 'Jackets', intro: 'Truckers, overshirts and field jackets for every season.', rule: function (p) { return p.cat === 'jackets'; } },
    { id: 'bottoms', name: 'Bottoms', intro: 'Jeans, cargos and sets.', rule: function (p) { return p.cat === 'bottoms'; } },
    { id: 'accessories', name: 'Accessories', intro: 'Caps and hats to finish the look.', rule: function (p) { return p.cat === 'accessories'; } },
    { id: 'essentials', name: 'Everyday Essentials', intro: 'The pieces you wear on repeat.', rule: function (p) { return p.tags.indexOf('essentials') >= 0; } },
    { id: 'statement', name: 'Statement Pieces', intro: 'Bolder shapes and finishes for when you want to be seen.', rule: function (p) { return p.tags.indexOf('statement') >= 0; } },
    { id: 'sale', name: 'Sale', intro: 'Selected pieces at a lower price, while sizes last.', rule: function (p) { return !!p.was; } }
  ];

  /* Editorial imagery (Unsplash). These are styling references, not photos of NJIA products. */
  N.editorial = {
    hero: { img: 'photo-1548207775-a7676e36f20a', pos: '50% 22%', alt: 'Black-and-white portrait of a woman' },
    details: { img: 'photo-1706802196230-91ebd3174483', pos: '50% 50%', alt: 'Close-up of folded blue denim' },
    detailsInset: { img: 'photo-1604176354204-9268737828e4', pos: '50% 50%', alt: 'Hands holding a stack of folded jeans' },
    custom: { img: 'photo-1768746350424-ee28a364dcf5', pos: '50% 50%', alt: 'A tailor at an industrial sewing machine' },
    customHero: { img: 'photo-1708234165852-89c978e5e33d', pos: '50% 35%', alt: 'A maker working at a sewing machine' },
    customDetail: { img: 'photo-1768745888568-b3ef7c7ba366', pos: '50% 50%', alt: 'Fabric being stitched on an industrial machine' },
    tiles: [
      { label: 'Women', to: 'shop/women', img: 'photo-1667498235589-421cb0294b49', pos: '50% 25%' },
      { label: 'Men', to: 'shop/men', img: 'photo-1551537482-f2075a1d41f2', pos: '50% 25%' },
      { label: 'Denim', to: 'shop/denim', img: 'photo-1565084888279-aca607ecce0c', pos: '50% 50%' },
      { label: 'Jackets', to: 'shop/jackets', img: 'photo-1527016021513-b09758b777bd', pos: '50% 35%' }
    ]
  };

  /* Lookbook: editorial images with the catalogue pieces closest in spirit */
  N.lookbook = {
    title: 'Own Lane',
    season: 'Season 01',
    intro: 'Seven ways to wear the collection, from the morning commute to late nights in the city. Every look links to the pieces that recreate it.',
    looks: [
      { img: 'photo-1532332248682-206cc786359f', pos: '50% 30%', name: 'Morning commute', caption: 'Rigid denim, a cap and nowhere to be until nine.', items: ['p13', 'p20', 'p24'] },
      { img: 'photo-1767234071411-142a33427cc1', pos: '50% 25%', name: 'Errands, slowly', caption: 'A cropped rib and wide cargos for a long Saturday.', items: ['p03', 'p23', 'p26'] },
      { img: 'photo-1670831933696-375b430228e8', pos: '50% 30%', name: 'Studio hours', caption: 'Oversized poplin over washed black. Sleeves rolled.', items: ['p08', 'p21'] },
      { img: 'photo-1525187440203-df529491b0a4', pos: '50% 40%', name: 'After dark', caption: 'Black on black, walking home the long way.', items: ['p02', 'p21', 'p26'] },
      { img: 'photo-1773864930571-9c77b59b3270', pos: '50% 25%', name: 'Golden hour', caption: 'An overshirt left open over the pocket tee.', items: ['p18', 'p07', 'p24'] },
      { img: 'photo-1727330278217-0b6faa302084', pos: '50% 35%', name: 'Quiet monochrome', caption: 'The long sleeve, the relaxed jean and nothing else.', items: ['p05', 'p21'] },
      { img: 'photo-1775249297180-d9b637fe7a14', pos: '50% 25%', name: 'Statement', caption: 'Camo, contrast and confidence.', items: ['p17', 'p04', 'p19'] }
    ]
  };

  /* Size guide (body measurements in cm) */
  N.sizeData = {
    tops: { head: ['Size', 'Chest', 'Waist', 'Length'], rows: [['XS', '84–88', '70–74', '68'], ['S', '89–94', '75–80', '70'], ['M', '95–100', '81–86', '72'], ['L', '101–107', '87–93', '74'], ['XL', '108–114', '94–100', '76'], ['XXL', '115–121', '101–107', '78']] },
    jeans: { head: ['Size', 'Waist', 'Hip', 'Inseam'], rows: [['28', '71', '90', '81'], ['30', '76', '95', '81'], ['32', '81', '100', '81'], ['34', '86', '105', '81'], ['36', '91', '110', '81'], ['38', '96', '115', '81']] }
  };

  N.counties = ['Nairobi', 'Kiambu', 'Mombasa', 'Kisumu', 'Nakuru', 'Machakos', 'Kajiado', 'Uasin Gishu', 'Kilifi', 'Nyeri', 'Meru', 'Kakamega', 'Murang\'a', 'Kirinyaga', 'Embu', 'Laikipia', 'Nyandarua', 'Kericho', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Garissa', 'Homa Bay', 'Isiolo', 'Kisii', 'Kitui', 'Kwale', 'Lamu', 'Makueni', 'Mandera', 'Marsabit', 'Migori', 'Nandi', 'Narok', 'Nyamira', 'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River', 'Tharaka-Nithi', 'Trans Nzoia', 'Turkana', 'Vihiga', 'Wajir', 'West Pokot', 'Baringo'];
})();
