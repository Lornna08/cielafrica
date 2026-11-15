/* ==========================================================================
   CRÈME MOTION — site settings
   Everything that belongs to one bakery lives in this file and in the two
   files in /data. To set the template up for a new client, edit these three
   files and replace the photos in /img. You do not need to touch /js or /css.
   ========================================================================== */
window.CREME = window.CREME || {};

CREME.config = {
  /* Template mode: shows "sample" labels on reviews and, when no WhatsApp
     number is set below, previews each WhatsApp message before opening it.
     Set to false for a real bakery. */
  demo: true,

  brand: {
    name: 'Velvet & Crumb',                 // sample brand, replace
    short: 'V&C',                           // used where space is tight
    tagline: 'Cakes and desserts, baked to order.',
    logo: '',                               // path to an SVG or PNG, e.g. 'img/brand/logo.svg'. Empty = wordmark.
    logoHeight: 30,                         // px, desktop
    favicon: 'img/brand/favicon.svg'
  },

  /* Colours: cream surfaces, chocolate ink and four accents */
  theme: {
    cream: '#F5EEE3',
    ivory: '#FBF8F2',
    sand: '#E9DDCB',
    ink: '#2A1A14',      // chocolate, used for text
    cocoa: '#5A3A2B',
    caramel: '#B5763D',
    strawberry: '#C4485D',
    pistachio: '#93A266',
    line: 'rgba(42,26,20,.14)'
  },

  /* Fonts: any Google Fonts pair. Change the URL and the two family names. */
  fonts: {
    href: 'https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..700;1,6..96,400..600&family=Manrope:wght@400;500;600;700&display=swap',
    display: '"Bodoni Moda", "Didot", Georgia, serif',
    body: '"Manrope", system-ui, -apple-system, "Segoe UI", sans-serif'
  },

  currency: { prefix: 'KES ', locale: 'en-KE' },

  /* The hero: a video that plays once and rests on its final frame.
     Give a portrait version for phones. With reduced motion the "end" still is shown. */
  hero: {
    kicker: 'Patisserie & celebration cakes',
    headline: ['Every layer', 'tells a story.'],   // one line per item
    text: 'Hand-layered cakes, fresh cream and fruit-bright fillings, made to order for the moments you want to remember.',
    primary: { label: 'Explore the collection', href: '#collection' },
    secondary: { label: 'Order a custom cake', href: '#custom' },
    video: { desktop: 'img/hero/hero-1440.mp4', mobile: 'img/hero/hero-720x1280.mp4' },
    videoWebm: { desktop: 'img/hero/hero-1440.webm', mobile: 'img/hero/hero-720x1280.webm' },   // optional, smaller; tried first
    poster: { desktop: 'img/hero/hero-1440-start.webp', mobile: 'img/hero/hero-720x1280-start.webp' },
    still: { desktop: 'img/hero/hero-1440-end.webp', mobile: 'img/hero/hero-720x1280-end.webp' },
    revealAt: 3.9,                         // seconds into the video when the headline appears
    alt: 'A layered chocolate and raspberry cake on a stand, cut to reveal a slice with three sponge layers, vanilla cream and raspberry jam.'
  },

  /* WhatsApp ordering.
     number: the business WhatsApp number in international format, digits only
     (e.g. '2547XXXXXXXX'). Leave empty in the template: buttons still work and
     open WhatsApp with the message ready, so the visitor picks the chat. */
  whatsapp: {
    number: '',
    greeting: "Hello! I'd like to order",
    closing: 'Please confirm availability.',
    customIntro: "Hello! I'd like to request a custom cake.",
    floatingButton: true
  },

  /* Custom cake form. If endpoint is set, the form is POSTed there as
     multipart/form-data (including the reference image). If it is empty the
     enquiry is sent as a WhatsApp message instead. */
  orders: {
    endpoint: '',                          // e.g. 'https://formspree.io/f/xxxx' or your own API
    leadDays: 3,                           // earliest date offered on the form
    maxImageMB: 8
  },

  contact: {
    phone: '',                              // shown and dialled, e.g. '+254 7XX XXX XXX'
    email: 'orders@example.com',            // sample, replace
    address: 'Your studio address, City',   // sample, replace
    mapUrl: '',                             // link to Google Maps, optional
    hours: [
      ['Monday – Friday', '8:00 – 18:00'],
      ['Saturday', '9:00 – 16:00'],
      ['Sunday', 'Collections by appointment']
    ]
  },

  social: [
    { label: 'Instagram', url: '' },
    { label: 'TikTok', url: '' },
    { label: 'Facebook', url: '' }
  ],

  /* Delivery and collection, shown in Contact and offered on the forms */
  delivery: {
    intro: 'Every cake is baked for its date. Choose delivery or collect it from the studio.',
    options: [
      { id: 'delivery', label: 'Delivery', text: 'Delivered chilled in a cake box, in a time window you choose. Fees depend on distance and are confirmed with your order.' },
      { id: 'collection', label: 'Collection', text: 'Collect from the studio at a time agreed when you order. Bring a flat surface in the car for tall cakes.' }
    ],
    zones: [
      ['Within 5 km', 'from KES 300'],
      ['5 – 15 km', 'from KES 600'],
      ['Further away', 'quoted on request']
    ],
    note: 'Sample fees. Replace them with your own.'
  },

  about: {
    kicker: 'Our story',
    title: 'A small kitchen with a big appetite for detail.',
    paragraphs: [
      'We started with one oven, a stack of recipe cards and the belief that a cake should taste even better than it looks.',
      'Today every order is still baked by hand, in small batches, with real butter, fresh cream and fruit chosen that morning. We would rather make fewer cakes than rush a single one.'
    ],
    quote: 'We bake for the moment the knife goes in and everyone leans closer.',
    quoteBy: 'The founder',
    values: [
      { title: 'Baked to order', text: 'Nothing sits on a shelf. Your cake is baked for your date.' },
      { title: 'Real ingredients', text: 'Butter, cream, eggs, chocolate and fruit. No shortcuts in the filling.' },
      { title: 'Designed with you', text: 'Bring a colour, a theme or a photo and we will shape the cake around it.' }
    ],
    images: ['pastry-table', 'piping-bags', 'piping-tips']
  },

  /* Options offered on the custom cake form. Add, remove or rename freely. */
  customForm: {
    occasions: ['Birthday', 'Wedding', 'Anniversary', 'Baby shower', 'Graduation', 'Corporate event', 'Just because', 'Other'],
    sizes: ['6 inch (8–10 servings)', '8 inch (14–18 servings)', '10 inch (24–30 servings)', 'Two tiers (40–50 servings)', 'Three tiers (70–90 servings)', 'Not sure yet'],
    flavors: ['Chocolate fudge', 'Vanilla bean', 'Red velvet', 'Lemon & elderflower', 'Carrot & walnut', 'Strawberries & cream', 'Pistachio & raspberry', 'Not sure yet'],
    designs: ['Minimal & elegant', 'Floral', 'Drip & toppings', 'Naked / semi-naked', 'Themed', 'Match my reference photo'],
    servingsMax: 300
  },

  nav: [
    { label: 'Home', href: '#top' },
    { label: 'Our Collection', href: '#collection' },
    { label: 'Custom Cakes', href: '#custom' },
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' }
  ],

  seo: {
    title: 'Velvet & Crumb | Cakes and desserts, baked to order',
    description: 'Celebration and wedding cakes, cupcakes, mini cakes, dessert boxes and pastries, baked to order. A bakery website template by Ciel Africa.'
  }
};
