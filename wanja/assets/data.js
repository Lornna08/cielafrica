/* ============================================================
   WANJA MWANGI — portfolio content
   Everything here comes from Wanja's original Wix site
   (wanjaa.wixsite.com/wanja) and her rate card PDF.
   `src` records where each photograph was migrated from.
   Update this file when the work, rates or contacts change.
   ============================================================ */
window.WANJA = (function () {
  var PHOTOS = {
  'rooftop-cap-gaze': { c: 'lifestyle', w: 828, h: 1466, s: [480, 800, 828], alt: "Wanja seated on a rooftop terrace in a patterned cap, black bandeau and printed wide-leg trousers, looking away across the city", src: "wix:317c2f_67e9587a45fc44559c9d9774d94eab9f~mv2.jpeg" },
  'blend-street': { c: 'lifestyle', w: 1200, h: 1600, s: [480, 800, 1200], alt: "Wanja outside a café storefront in a black beret, red sunglasses, black knit top and brown cargo trousers", src: "wix:317c2f_1f81a95d92224bef9362c8518ec8fdb1~mv2.jpeg" },
  'rooftop-cap-seated': { c: 'lifestyle', w: 879, h: 1564, s: [480, 800, 879], alt: "Wanja seated on a rattan stool on a rooftop café terrace, wearing a patterned cap and printed trousers", src: "wix:317c2f_4bdf3c2f9ec443b59287422b31fb150e~mv2.jpeg" },
  'cocoa-chair-lean': { c: 'fashion', w: 1279, h: 1600, s: [480, 800, 1200, 1279], alt: "Wanja sitting astride a wooden chair, arms folded over the backrest, against a cocoa-brown backdrop; white shirt over a black leather bustier, sunglasses pushed up in her hair", src: "wix:317c2f_83a2b281b8c445daaa7c83cee534323b~mv2.jpeg" },
  'cocoa-standing': { c: 'fashion', w: 1280, h: 1600, s: [480, 800, 1200, 1280], alt: "Full-length portrait of Wanja standing against a cocoa-brown backdrop in a white shirt, black leather bustier and wide-leg jeans", src: "wix:317c2f_6965a7e3defe4f7c893172b9bf755516~mv2.jpeg" },
  'cocoa-smile-standing': { c: 'fashion', w: 1279, h: 1600, s: [480, 800, 1200, 1279], alt: "Wanja standing and smiling against a brown backdrop, holding the edge of her white shirt", src: "wix:317c2f_a11dbca5475d483b85e583164b27d3ac~mv2.jpeg" },
  'cocoa-laugh-seated': { c: 'fashion', w: 1279, h: 1600, s: [480, 800, 1200, 1279], alt: "Wanja laughing on a wooden chair with one hand raised to her face, sunglasses pushed up in her hair", src: "wix:317c2f_52e0f98a18f446b79e2e4194b30ef253~mv2.jpeg" },
  'cocoa-portrait': { c: 'fashion', w: 1279, h: 1600, s: [480, 800, 1200, 1279], alt: "Half-length portrait of Wanja smiling, hand at her collar, sunglasses resting in her hair", src: "wix:317c2f_d31457f9697d49dd8306bb46f907dc3e~mv2.jpeg" },
  'cocoa-seated': { c: 'fashion', w: 1279, h: 1600, s: [480, 800, 1200, 1279], alt: "Wanja seated casually on a wooden chair against a brown backdrop, in wide-leg jeans and sneakers", src: "wix:317c2f_1425c39b4c754417852bb1ea3ea8a784~mv2.jpeg" },
  'noir-roses-seated': { c: 'glamour', w: 1279, h: 1600, s: [480, 800, 1200, 1279], alt: "Wanja seated on a wooden chair in a black satin gown with a thigh split, holding a bouquet of red roses", src: "wix:317c2f_2eb2437135e04fec9f7a92d62386fc97~mv2.jpeg" },
  'noir-roses-gesture': { c: 'glamour', w: 1279, h: 1600, s: [480, 800, 1200, 1279], alt: "Wanja in a black satin gown holding red roses, one hand raised to her head, against a pale marbled backdrop", src: "wix:317c2f_3d1f6a34da0d402787a79cd133caf398~mv2.jpeg" },
  'noir-roses-standing': { c: 'glamour', w: 1280, h: 1600, s: [480, 800, 1200, 1280], alt: "Wanja smiling in a black satin gown with a thigh split, holding red roses against a pale marbled backdrop", src: "wix:317c2f_4673de3ae7eb468dabadb0e53b345dec~mv2.jpeg" },
  'monochrome-portrait': { c: 'glamour', w: 1066, h: 1600, s: [480, 800, 1066], alt: "Black-and-white portrait of Wanja smiling, braids falling over a sequinned strappy top", src: "wix:317c2f_90ef8c895e5a445a8ea7e1f4152d308e~mv2.jpeg" },
  'tribe-crop-tee': { c: 'commercial', w: 757, h: 1280, s: [480, 757], alt: "Wanja in a white Tribe Nomad crop tee and bright green cargo trousers, hand on hip", src: "wix:317c2f_f5e89ef6f5a2442690c6b16fb29c6ff8~mv2.jpeg" },
  'tribe-grey-tee': { c: 'commercial', w: 718, h: 1280, s: [480, 718], alt: "Wanja crouching in a grey Tribe Nomad T-shirt and white socks against a white backdrop", src: "wix:317c2f_3b26ef0e482b4426bdfc451b255120c4~mv2.jpeg" },
  'tribe-hoodie-knees': { c: 'commercial', w: 1063, h: 1280, s: [480, 800, 1063], alt: "Wanja seated with knees drawn up in a black Tribe Nomad hoodie and yellow shorts", src: "wix:317c2f_c5811924c4b54b36aa1b543bb4836c25~mv2.jpeg" },
  'tribe-duo': { c: 'commercial', w: 772, h: 1280, s: [480, 772], alt: "Wanja laughing beside a male model, both wearing Tribe Nomad T-shirts and joggers", src: "wix:317c2f_66096ca46ea747b09d5a23d0af5c5c22~mv2.jpeg" },
  'tribe-sweatsuit-back': { c: 'commercial', w: 1600, h: 1452, s: [480, 800, 1200, 1600], alt: "Wanja in a blue Tribe Nomad sweatsuit, turned away to show the back print, against a blue backdrop", src: "wix:317c2f_187ce04083e9467e94fc788f321955ef~mv2.jpeg" },
  'tribe-hoodie-floor': { c: 'commercial', w: 718, h: 1280, s: [480, 718], alt: "Wanja seated in a black Tribe Nomad hoodie, yellow shorts and black sneakers against a white backdrop", src: "wix:317c2f_6168cf36219f4a729e345f225974a6f8~mv2.jpeg" },
  'event-pink-fleece': { c: 'event', w: 420, h: 630, s: [420], alt: "Wanja smiling at an outdoor event in a pink and cream fleece jacket", src: "ratecard.pdf (page 1, embedded image)" }
  };

  var CATEGORIES = [
    {
      id: 'lifestyle', num: '01', name: 'Lifestyle & Venue Collaborations', short: 'Lifestyle & Venue',
      kicker: 'Cafés, rooftops & city moments',
      lead: 'Content that doesn’t just showcase a space, but sells an experience.',
      body: [
        'In Lifestyle & Venue Collaborations, Wanja blends fashion, personality and environment to create visually engaging content tailored for cafés, restaurants, hotels and experience-based brands.',
        'She naturally integrates the setting into the story, making locations feel aspirational yet approachable. Whether seated at a stylish rooftop café or capturing an urban city moment, Wanja brings effortless confidence and vibrant energy that enhances the venue’s atmosphere.',
        'Her strength in this category lies in creating content that doesn’t just showcase a space, but sells an experience. Through expressive styling, relaxed posing and authentic presence, she helps hospitality and lifestyle brands connect emotionally with their audience while maintaining a polished, influencer-ready aesthetic.'
      ],
      photos: ['rooftop-cap-gaze', 'blend-street', 'rooftop-cap-seated'],
      source: 'https://wanjaa.wixsite.com/wanja/portfolio-collections/portfolio/stylish-fashion-modeling-1'
    },
    {
      id: 'fashion', num: '02', name: 'Contemporary Fashion', short: 'Fashion',
      kicker: 'Structured styling, natural expression',
      lead: 'Polished, powerful and undeniably modern.',
      body: [
        'In Contemporary Fashion Editorial, Wanja embodies modern sophistication with a confident, commanding presence. This category highlights her ability to merge structured styling with natural expression, creating bold yet refined visuals that feel current and culturally relevant.',
        'Her poised posture, direct gaze and intentional styling showcase strength, individuality and effortless elegance. Wanja thrives in concept-driven studio settings where fashion meets attitude, delivering striking imagery suited for fashion campaigns, brand features and editorial publications.',
        'This category reflects her versatility: polished, powerful and undeniably modern.'
      ],
      photos: ['cocoa-chair-lean', 'cocoa-standing', 'cocoa-portrait', 'cocoa-laugh-seated', 'cocoa-smile-standing', 'cocoa-seated'],
      source: 'https://wanjaa.wixsite.com/wanja/portfolio-collections/portfolio/vibrant-fashion-poses'
    },
    {
      id: 'glamour', num: '03', name: 'Editorial Glamour', short: 'Glamour',
      kicker: 'Softness and strength',
      lead: 'Refined, high-impact imagery that feels both luxurious and authentic.',
      body: [
        'In Editorial Glamour, Wanja brings elegance, confidence and emotional expression together to create visually powerful images. She embodies sophisticated styling with natural poise, transforming simple studio settings into striking, magazine-worthy visuals.',
        'Her strength in this category lies in her ability to balance softness and strength, delivering refined, high-impact imagery that feels both luxurious and authentic. Whether seated, posed or in motion, Wanja commands attention while maintaining grace and warmth, making her a perfect fit for premium fashion and beauty campaigns.'
      ],
      photos: ['noir-roses-seated', 'noir-roses-gesture', 'monochrome-portrait', 'noir-roses-standing'],
      source: 'https://wanjaa.wixsite.com/wanja/portfolio-collections/portfolio/casual-lifestyle-modeling'
    },
    {
      id: 'commercial', num: '04', name: 'Commercial Brand', short: 'Commercial',
      kicker: 'Campaign · Tribe Nomad',
      lead: 'Showcasing products clearly, authentically, and in a way that resonates with everyday consumers.',
      body: [
        'In this commercial brand campaign, Wanja models for Tribe Nomad, bringing a confident, effortless energy that aligns perfectly with the brand’s identity. The styling is relaxed and minimal, allowing the product to stand out while her presence adds personality and authenticity.',
        'Wanja’s ability to embody a brand’s lifestyle makes the campaign feel natural rather than staged. Her posture, expression and grounded presence communicate comfort, confidence and modern street appeal: qualities essential for contemporary fashion brands.',
        'This category highlights her strength in commercial modelling: showcasing products clearly, authentically, and in a way that resonates with everyday consumers while maintaining a polished visual standard.'
      ],
      photos: ['tribe-crop-tee', 'tribe-hoodie-knees', 'tribe-duo', 'tribe-grey-tee', 'tribe-sweatsuit-back', 'tribe-hoodie-floor'],
      source: 'https://wanjaa.wixsite.com/wanja/portfolio-collections/portfolio/stylish-fashion-modeling'
    }
  ];

  // Services as listed on the rate card (page 1)
  var SERVICES = [
    'Content creation', 'Content marketing', 'Commercial modelling', 'Brand campaigns & collaboration',
    'Event appearances', 'Product photography', 'Service & product reviews & unboxing', 'Brand ambassadorship'
  ];

  // Rates exactly as published in the rate card PDF (March 2026). Prices in KES.
  var RATES = [
    { id: 'social', name: 'Social Media Content Creation', items: [
      ['Instagram Post', 'KES 2,000'],
      ['Instagram Reel / TikTok Video', 'KES 3,000'],
      ['Instagram Story', 'KES 1,500', '3 frames'],
      ['Content Bundle', 'KES 6,000', 'Post + Reel + Stories']
    ] },
    { id: 'campaigns', name: 'Brand Campaigns', items: [
      ['Short Brand Campaign', 'KES 15,000', '1–2 weeks'],
      ['Full Brand Campaign', 'KES 30,000–45,000', '1 month'],
      ['Long-Term Brand Ambassador', 'KES 85,000–160,000', '3–6 months']
    ] },
    { id: 'modelling', name: 'Commercial Modelling', items: [
      ['Fashion Shoot', 'KES 6,000', 'Half day'],
      ['Fashion Shoot', 'KES 10,000', 'Full day'],
      ['Commercial Modelling', 'KES 15,000–25,000', 'Ads / billboards'],
      ['E-commerce Product Modelling', 'KES 6,000']
    ] },
    { id: 'reviews', name: 'Product / Service Review', items: [
      ['Product Review', 'KES 5,000', 'Video content'],
      ['Product Review', 'KES 3,500', 'Photo + caption'],
      ['Service Experience Review', 'KES 6,000']
    ] },
    { id: 'promotion', name: 'Marketing & Content Promotion', items: [
      ['Brand Feature Content', 'KES 7,000'],
      ['Content Marketing Package', 'KES 12,000', '2 posts + 2 Reels'],
      ['Creative Brand Collaboration', 'KES 10,000–15,000']
    ] },
    { id: 'events', name: 'Event Appearances', items: [
      ['Event Appearance', 'KES 12,000'],
      ['Hosting / Brand Activation', 'KES 20,000'],
      ['Event Coverage Content', 'KES 13,500']
    ] },
    { id: 'additional', name: 'Additional Services', items: [
      ['Professional Content Creation', 'KES 12,000', 'Brand use'],
      ['Commercial Usage Rights', '+40%', 'Added to the rate'],
      ['Exclusivity', 'KES 32,000', 'Per month']
    ] }
  ];

  var TERMS = [
    '50% booking fee required to confirm work',
    'Balance payable before content delivery',
    'Rates may vary depending on scope and production',
    'Travel outside Nairobi billed separately'
  ];

  // "Brands worked with" on the original homepage
  var BRANDS = [
  { name: "NBO Closet", img: 'brands/nbo-closet-360.webp', w: 1563, h: 1563, src: "wix:317c2f_9490c4475e654a51b91a0522647e02c7~mv2.jpg" },
  { name: "Tribe Nomad", img: 'brands/tribe-nomad-360.webp', w: 1284, h: 1275, src: "wix:317c2f_b33b55571850487d8f6d271963003584~mv2.jpeg" },
  { name: "Vista Digital", img: 'brands/vista-digital-360.webp', w: 1225, h: 1081, src: "wix:317c2f_8af0dcebbaa5498aab5bcd484a1da1fe~mv2.jpeg" },
  { name: "Lil Secret Resort", img: 'brands/lil-secret-resort-360.webp', w: 1284, h: 1277, src: "wix:317c2f_c6a102a7143a4565bf3d8f299c37740c~mv2.jpeg" },
  { name: "Reside KE", img: 'brands/reside-ke-360.webp', w: 1563, h: 1563, src: "wix:317c2f_13df10928ffb48a9b3d032c17ded29ef~mv2.jpeg" },
  { name: "ABC", img: 'brands/abc-360.webp', w: 1563, h: 1563, src: "wix:317c2f_cdf246a823ca4cff9dcf43cff4b25604~mv2.jpeg" }
  ];

  var CONTACT = {
    location: 'Nairobi, Kenya',
    email: 'wanjamary916@gmail.com',      // Get in Touch section + rate card
    email2: 'wanja@nbocloset.com',        // email icon in the original site's social bar
    phone: '+254 795 802 604', tel: '+254795802604', wa: '254795802604',
    instagram: { handle: '@wanjah._', url: 'https://www.instagram.com/wanjah._' },
    tiktok: { handle: '@wanjah._', url: 'https://www.tiktok.com/@wanjah._' },
    x: { handle: '@wanja16_', url: 'https://x.com/wanja16_' }
  };

  return { PHOTOS: PHOTOS, CATEGORIES: CATEGORIES, SERVICES: SERVICES, RATES: RATES, TERMS: TERMS, BRANDS: BRANDS, CONTACT: CONTACT };
})();
