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

  /* The hero is a photograph of the bakery's own cake, ideally a cut slice that shows the layers.
     reveal.image: the photo for desktop, a smaller copy for tablets and a portrait crop for phones;
     reveal.position: where each crop is anchored (CSS object-position).
     To use your own film instead, remove `reveal` and set video / videoWebm / poster / still / revealAt. */
  hero: {
    kicker: 'Patisserie & celebration cakes',
    headline: ['Every layer', 'tells a story.'],   // one line per item
    text: 'Hand-layered cakes, fresh cream and fruit-bright fillings, made to order for the moments you want to remember.',
    primary: { label: 'See the menu', href: '#collection' },
    secondary: { label: 'Design your cake', href: '#design' },
    reveal: {
      image: { desktop: 'img/hero/slice-2600.webp', tablet: 'img/hero/slice-1500.webp', mobile: 'img/hero/slice-portrait-1170.webp' },
      position: { desktop: '72% 50%', mobile: '50% 52%' }           // object-position of the photo
    },
    alt: 'A slice of red velvet cake with cream cheese frosting on a plate, the rest of the cake behind it.'
  },

  /* WhatsApp ordering.
     number: the business WhatsApp number in international format, digits only
     (e.g. '2547XXXXXXXX'). Leave empty in the template: buttons still work and
     open WhatsApp with the message ready, so the visitor picks the chat. */
  whatsapp: {
    number: '',
    greeting: "Hello! I'd like to order",
    closing: 'Please confirm availability.',
    customIntro: "Hello! I'd like to order a custom cake I designed on your website.",
    general: "Hello! I'd like to order a cake. Could you share what is available for my date?"
  },

  /* How customers can order. WhatsApp is always offered. "Send order request"
     POSTs to orders.endpoint when set, otherwise it opens an email to
     contact.email. A Call button appears wherever contact.phone is set. */
  order: {
    headline: 'Choose a cake, pick your size and flavour, then send it on WhatsApp, as an order request or by phone.',
    replyTime: 'We usually reply within an hour during opening hours.',      // sample, replace
    payment: 'We confirm the total before baking. A deposit secures your date.'  // sample, replace
  },

  /* Order requests (checkout and the cake designer). If endpoint is set,
     requests are POSTed there as multipart/form-data, including the reference
     image and a ready-made summary. If it is empty, "Send order request" opens
     an email to contact.email instead. */
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

  /* Occasions offered in the cake designer. Shapes, sizes, colours and piping live in data/designer.js. */
  customForm: {
    occasions: ['Birthday', 'Wedding', 'Anniversary', 'Baby shower', 'Graduation', 'Bridal shower', 'Corporate event', 'Just because', 'Other']
  },

  nav: [
    { label: 'Cakes', href: '#collection' },
    { label: 'Design your cake', href: '#design' },
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' }
  ],

  seo: {
    title: 'Velvet & Crumb | Cakes and desserts, baked to order',
    description: 'Celebration and vintage cakes, bento boxes, cupcakes, milky cakes and wedding tiers, baked to order. Design your own cake online. A bakery website template by Ciel Africa.'
  }
};
