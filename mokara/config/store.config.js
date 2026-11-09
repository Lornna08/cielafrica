/* ==========================================================================
   MOKARA — store configuration
   Everything brand-specific lives here and in data/catalog.js. To re-skin the
   template for another roaster, edit these two files, not the components.
   ========================================================================== */
window.MOKARA = window.MOKARA || {};

MOKARA.config = {
  store: {
    name: 'MOKARA',
    tagline: 'Specialty coffee, roasted to order.',
    description: 'Single-origin coffees and a house espresso, sourced from six growing regions and roasted in small batches.',
    basePath: '/mokara/',        // where the store is served from (must end with /)
    demo: true                   // template mode: browser-only data, simulated M-Pesa checkout
  },

  /* Design tokens, mirrored into CSS custom properties at boot */
  theme: {
    espresso: '#2B1B16',
    roast: '#40261C',
    caramel: '#B77945',
    cream: '#F4EBDD',
    beige: '#E8D9C5',
    paper: '#FAF8F3',
    sage: '#8B9277'
  },

  currency: { code: 'KES', prefix: 'KES ' },

  /* Pack sizes: price = 250 g price × factor, rounded to the nearest 50 */
  sizes: [
    { id: '250g', label: '250 g', factor: 1 },
    { id: '500g', label: '500 g', factor: 1.85 },
    { id: '1kg', label: '1 kg', factor: 3.4 }
  ],
  formats: [
    { id: 'whole', label: 'Whole bean' },
    { id: 'ground', label: 'Ground' }
  ],
  grinds: [
    { id: 'espresso', label: 'Espresso', hint: 'Fine' },
    { id: 'moka', label: 'Moka pot', hint: 'Fine–medium' },
    { id: 'aeropress', label: 'AeroPress', hint: 'Medium–fine' },
    { id: 'filter', label: 'Pour-over / filter', hint: 'Medium' },
    { id: 'press', label: 'French press', hint: 'Coarse' }
  ],

  /* Delivery (template values; replace with your real rates) */
  shipping: {
    freeOver: 6000,
    methods: [
      { id: 'nairobi', name: 'Nairobi delivery', eta: 'Next working day after roasting', price: 300 },
      { id: 'country', name: 'Countrywide courier', eta: '2–4 working days', price: 550 },
      { id: 'pickup', name: 'Collect from the roastery', eta: 'Ready the day after roasting', price: 0 }
    ]
  },
  roastDays: 'We roast on Mondays and Thursdays and ship the same day.',

  /* Sample discount code (template only) */
  discounts: [
    { code: 'FIRSTCUP', type: 'percent', value: 10, label: '10% off your first order' }
  ],

  payments: { mpesa: true, card: false },

  /* Newsletter. Set an endpoint (your email provider's form URL) to collect sign-ups.
     Left empty, the template keeps the address in this browser and says so. */
  newsletter: { endpoint: '' },

  /* Contact. Sample details: replace before launch. Leave a value empty to hide it. */
  contact: {
    email: 'hello@mokara.example',
    hours: 'Mon–Sat, 8 am – 5 pm',
    instagram: '#'
  }
};
