/* ==========================================================================
   NJIA — store configuration
   Everything brand-specific lives here. To re-skin the template for another
   label, edit this file and data/catalog.js, not the components.
   ========================================================================== */
window.NJIA = window.NJIA || {};

NJIA.config = {
  store: {
    name: 'NJIA',
    tagline: 'Made for your own lane.',
    description: 'Streetwear, everyday essentials and statement pieces for the way you move.',
    basePath: '/njia/',          // where the store is served from (must end with /)
    demo: true                   // template mode: browser-only data, simulated M-Pesa checkout
  },

  /* Design tokens, mirrored into CSS custom properties at boot */
  theme: {
    white: '#FFFFFF',
    paper: '#F8F8F6',
    ink: '#171717',
    charcoal: '#292929',
    muted: '#777777',
    line: '#E5E5E3',
    accent: '#E94B35'
  },

  currency: { code: 'KES', prefix: 'KES ', locale: 'en-KE' },

  /* Delivery (template values; replace with your real rates) */
  shipping: {
    freeOver: 10000,
    methods: [
      { id: 'nairobi', name: 'Nairobi delivery', eta: 'Same or next working day', price: 300 },
      { id: 'country', name: 'Countrywide courier', eta: '2–4 working days', price: 550 },
      { id: 'pickup', name: 'Pick up from the studio', eta: 'Ready within 24 hours', price: 0 }
    ]
  },

  /* Sample discount code (template only) */
  discounts: [
    { code: 'LANE10', type: 'percent', value: 10, label: '10% off your order' }
  ],

  payments: {
    mpesa: true,                 // STK push. Connect your Daraja back end in js/core.js → NJIA.pay
    card: false                  // shown but not selectable until a card provider is connected
  },

  /* Custom Made enquiries. Set an endpoint (Formspree, your API…) to receive them.
     Left empty, the template keeps the enquiry in the browser and says so. */
  customForm: { endpoint: '' },

  /* Contact. Sample details: replace before launch. Leave a value empty to hide it. */
  contact: {
    email: 'hello@njia.example',
    phone: '',
    whatsapp: '',
    hours: 'Mon–Sat, 9 am – 6 pm',
    instagram: '#'
  },

  /* Main navigation: label → route */
  nav: [
    ['New In', 'shop/new-in'],
    ['Women', 'shop/women'],
    ['Men', 'shop/men'],
    ['Shop', 'shop/all'],
    ['Denim', 'shop/denim'],
    ['Tops', 'shop/tops'],
    ['Jackets', 'shop/jackets'],
    ['Custom Made', 'custom-made'],
    ['Lookbook', 'lookbook']
  ],

  popularSearches: ['Heavyweight tee', 'Denim jacket', 'Straight jean', 'Cargo', 'Hoodie', 'Cap']
};
