/* ==========================================================================
   APEX MOTION — store configuration
   Everything brand-specific lives here. To re-skin the template for another
   retailer, edit this file (and the catalogue in data/), not the components.
   ========================================================================== */
window.APEX = window.APEX || {};

APEX.config = {
  store: {
    name: 'APEX MOTION',
    short: 'APEX',               // first half of the wordmark
    shortTail: 'MOTION',         // second half of the wordmark
    tagline: 'Performance parts, fitted right.',
    description: 'Performance wheels, premium components and carefully selected upgrades for drivers who expect more from every build.',
    basePath: '/apex-motion/',   // where the store is served from (must end with /)
    demo: true                   // demo mode: browser-only data, simulated checkout
  },

  /* Design tokens — mirrored into CSS custom properties at boot */
  theme: {
    ivory: '#F3F0E8',
    white: '#FFFFFF',
    ink: '#10110F',
    charcoal: '#191A18',
    accent: '#FF5722',
    accentInk: '#E64A19',
    muted: '#8B8B84',
    line: '#E2DED3',
    fontDisplay: "'Barlow Condensed', 'Oswald', 'Arial Narrow', sans-serif",
    fontText: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif"
  },

  /* Money */
  currency: { code: 'USD', symbol: '$', locale: 'en-US', decimals: 0 },

  /* Shipping rules (demo values) */
  shipping: {
    freeOver: 150,
    methods: [
      { id: 'standard', name: 'Standard delivery', eta: '3–5 working days', price: 12 },
      { id: 'express', name: 'Express delivery', eta: 'Next working day if ordered by 2 pm', price: 29 },
      { id: 'pickup', name: 'Collect from the workshop', eta: 'Ready in 24 hours', price: 0 }
    ],
    heavyItemNote: 'Wheels and tyres ship in sets on a pallet service. Single items ship by courier.'
  },

  /* Sample discount codes (demo only) */
  discounts: [
    { code: 'APEX10', type: 'percent', value: 10, label: '10% off your first order' },
    { code: 'TRACKDAY', type: 'fixed', value: 25, minSubtotal: 200, label: '$25 off orders over $200' }
  ],

  /* Contact & company — sample details, replace for a real store */
  contact: {
    email: 'hello@apexmotion.example',
    phone: '+1 (555) 014-2290',
    hours: 'Mon–Sat, 8 am – 6 pm',
    address: ['Unit 7, Paddock Works', 'Sample City'],
    social: [
      { name: 'Instagram', url: '#' },
      { name: 'YouTube', url: '#' },
      { name: 'TikTok', url: '#' }
    ]
  },

  /* Homepage content */
  home: {
    hero: {
      lines: [
        { text: 'BUILT', label: 'PERFORMANCE' },
        { text: 'TO MOVE', label: 'PRECISION' },
        { text: 'DIFFERENT.', label: 'ENGINEERED' }
      ],
      copy: 'Performance wheels, premium components, and carefully selected upgrades for drivers who expect more from every build.',
      primary: { label: 'Shop the Catalogue', href: 'shop' },
      secondary: { label: 'Explore the Collection', href: '#collections' }
    },
    ticker: ['Free shipping over $150', '30-day returns', 'Fitment checked by a human', '48-hour dispatch', 'Hub-centric rings included', 'Specialists on the line 6 days a week'],
    promise: {
      kicker: 'Why Apex',
      title: ['Engineered', 'to outlast'],
      points: [
        { t: 'A catalogue built around fitment', d: 'Every wheel and tyre carries its bolt pattern, offset and centre bore, so you can shortlist by vehicle.' },
        { t: 'Specified, not guessed', d: 'Load ratings, weights and materials are listed on every product page before you buy.' },
        { t: 'Specialists on the line', d: 'Talk to people who fit parts for a living, six days a week.' },
        { t: 'At your door in 48 hours', d: 'Most in-stock orders leave the workshop within two working days.' }
      ]
    },
    /* Promotional banners — swap these to promote any category */
    promos: [
      { kicker: 'Limited run', title: 'Track slicks', price: 289, unit: 'per tyre', copy: 'Semi-slick compounds in 18 and 19 inch for track days. Heat-cycled once, so they grip from the first lap.', cta: 'Shop collection', href: 'shop/tyres', image: 'img/products/t-01.webp' },
      { kicker: 'Big-brake season', title: 'Six-piston kits', price: 1890, unit: 'per axle', copy: 'Two-piece floating discs with forged calipers. Supplied with braided lines and a bedding-in guide.', cta: 'Shop brakes', href: 'shop/brakes', image: 'img/products/b-01.webp' },
      { kicker: 'Height-adjustable', title: 'Street coilovers', price: 1140, unit: 'per set', copy: 'Thirty-two clicks of damping, threaded bodies and a two-year warranty. Set the ride, then set the stance.', cta: 'Shop suspension', href: 'shop/suspension', image: 'img/products/s-03.webp' }
    ],
    cinematic: {
      kicker: 'Track-day gear',
      title: ['Own every', 'corner.'],
      copy: 'Gloves, harness-ready seats and the brake upgrades that turn a quick road car into a confident track car.',
      cta: { label: 'Shop performance', href: 'performance' },
      image: 'img/banners/smoke.webp'
    }
  },

  /* Policies — short versions shown on info pages */
  policies: {
    returns: 'Unused parts can be returned within 30 days in their original packaging. Wheels and tyres that have been mounted, and parts that have been fitted, cannot be returned unless faulty.',
    warranty: 'Wheels carry a two-year structural warranty. Other parts follow the manufacturer warranty shown on the product page.',
    fitment: 'Fitment information in this store is a guide. Always confirm bolt pattern, offset, centre bore, brake clearance and load rating for your exact vehicle before fitting.'
  },

  credit: { name: 'Ciel Africa', url: 'https://cielafrica.com', text: 'Store system by' }
};
