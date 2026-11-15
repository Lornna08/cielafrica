/* ==========================================================================
   EMBER & PLATE — restaurant settings
   Everything that belongs to one restaurant lives in this file and in the two
   files in /data (menu.js and content.js). To set the template up for a new
   restaurant, edit these three files and replace the photos in /img.
   You do not need to touch /js or /css.
   ========================================================================== */
window.EP = window.EP || {};

EP.config = {
  /* Template mode. Shows "Sample" labels on reviews and prices, and a short
     notice on forms that nothing is sent to a real restaurant until the
     contact details below are filled in. Set to false for a real restaurant. */
  demo: true,

  brand: {
    name: 'Ember & Plate',                  // sample name, replace
    short: 'E&P',
    tagline: 'A contemporary grill house',
    logo: '',                               // path to an SVG or PNG, e.g. 'img/brand/logo.svg'. Empty = wordmark.
    logoHeight: 34,
    favicon: 'img/brand/favicon.svg'
  },

  /* Colours. Dark surfaces, warm wood and metallic accents. */
  theme: {
    night: '#0D0B0A',       // page background
    coal: '#14110F',        // raised surfaces
    wood: '#241A14',        // warm panels
    ash: '#2E2620',         // borders on dark
    ivory: '#EFE6D8',       // main text
    smoke: '#A99C8B',       // secondary text
    copper: '#C27C46',      // primary accent (buttons, prices)
    bronze: '#9C7448',
    gold: '#CDAE78',        // fine details
    ember: '#E2622B'        // used sparingly: live states, spice
  },

  /* Fonts: any Google Fonts pair. Change the URL and the two family names. */
  fonts: {
    href: 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Hanken+Grotesk:wght@400;500;600;700&display=swap',
    display: '"Instrument Serif", "Times New Roman", serif',
    body: '"Hanken Grotesk", system-ui, -apple-system, "Segoe UI", sans-serif'
  },

  currency: { prefix: 'KES ', locale: 'en-KE' },

  /* The opening scene. Two photographs: the first is shown with living fire
     (moving heat haze, flickering flames and rising sparks), the second is
     revealed through smoke as the visitor scrolls. To use one photograph only,
     remove `reveal`. To use your own film instead of photographs, set `video`.
     fire.flames: the area of the first photo where the flames are, as fractions
     of its width and height [left, top, right, bottom]; sparks rise from here.
     position: CSS object-position of each photo on wide and on portrait screens. */
  hero: {
    kicker: 'Wood-fire grill · Steaks · Seafood',
    headline: ['Crafted by fire.', 'Remembered by flavour.'],
    text: 'Prime cuts, whole fish and garden vegetables cooked over open flame, served with the warmth of a long dinner among friends.',
    primary: { label: 'Explore our menu', href: '#menu' },
    secondary: { label: 'Reserve a table', href: '#reserve' },
    fire: {
      image: 'img/hero/fire-a', widths: [1280, 1920, 2560],
      alt: 'A tomahawk steak searing over open flames on a grill.',
      position: { wide: '20% 50%', portrait: '42% 50%' },
      zoom: 1.1,                    // 1 = fit the screen; larger crops in closer
      flames: [0.5, 0.06, 0.9, 0.72]
    },
    reveal: {
      image: 'img/hero/sliced', widths: [1280, 1920, 2560],
      alt: 'Slices of tomahawk steak with a dark crust and a pink centre, in a cast iron pan.',
      position: { wide: '50% 55%', portrait: '58% 50%' },
      kicker: 'The signature',
      title: 'Flame-kissed tomahawk',
      text: 'Dry-aged on the bone, seared over hardwood and rested before it is carved at the table.',
      item: 'tomahawk'              // menu item id the "View dish" button opens
    },
    video: ''                       // e.g. 'img/hero/film.mp4' — replaces the photographs
  },

  /* Ordering. modes: any of 'whatsapp', 'request', 'payment'.
     - whatsapp: the order opens in WhatsApp, ready to send.
     - request:  the order is POSTed to orders.endpoint, or opens an email to contact.email.
     - payment:  sends the order to payment.checkoutEndpoint, which must return
                 { url } (a hosted checkout page). Shown only when that endpoint is set. */
  ordering: {
    enabled: true,
    modes: ['whatsapp', 'request', 'payment'],
    endpoint: '',                  // e.g. 'https://formspree.io/f/xxxx' or your own API
    payment: {
      provider: '',                // e.g. 'Paystack', 'Flutterwave', 'Stripe', 'M-Pesa'
      checkoutEndpoint: ''         // your server route that creates the checkout session
    },
    leadMinutes: 30,               // earliest time offered, from now
    note: 'Prices include VAT. We confirm every order before it goes on the grill.'   // sample, replace
  },

  /* Delivery and collection */
  delivery: {
    collection: true,
    delivery: true,
    minimum: 1500,                 // minimum order for delivery, 0 for none
    zones: [                       // shown at checkout; the fee is confirmed with the order
      { label: 'Within 3 km', fee: 200 },
      { label: '3 – 7 km', fee: 350 },
      { label: '7 – 12 km', fee: 550 }
    ],
    note: 'Sample delivery fees. Replace them with your own.'
  },

  /* Reservations.
     method: 'whatsapp' (booking opens in WhatsApp), 'request' (POSTed to endpoint or
     emailed) or 'link' (sends guests to an external booking system at bookingUrl).
     Nothing on this page says a table is confirmed: the restaurant confirms. */
  reservations: {
    method: 'request',
    alsoWhatsApp: true,            // offer WhatsApp as a second button
    endpoint: '',
    bookingUrl: '',                // e.g. a booking system page
    maxGuests: 12,
    largeGroupText: 'For more than 12 guests, private dining or a full buyout, tell us in the request and our events team will reply.',
    slotMinutes: 30,               // time slots offered, inside opening hours
    lastSeatingBeforeClose: 60,    // minutes before closing
    occasions: ['Birthday', 'Anniversary', 'Date night', 'Business dinner', 'Celebration', 'Other'],
    policy: 'We hold tables for 15 minutes. Please let us know if you are running late.'   // sample, replace
  },

  /* WhatsApp. number in international format, digits only, e.g. '2547XXXXXXXX'.
     Empty in the template: buttons still open WhatsApp with the message ready,
     and the visitor picks the chat. */
  whatsapp: {
    number: '',
    orderIntro: "Hello! I'd like to place an order:",
    bookingIntro: "Hello! I'd like to book a table:",
    general: "Hello! I have a question about the restaurant."
  },

  contact: {
    phone: '',                      // shown and dialled, e.g. '+254 7XX XXX XXX'
    email: 'reservations@example.com',   // sample, replace
    address: ['Your street address', 'Neighbourhood, City'],   // sample, replace
    mapEmbed: '',                   // Google Maps "Embed a map" src URL (optional)
    mapUrl: '',                     // link for "Get directions" (optional)
    timezone: 'Africa/Nairobi',
    /* Opening hours by weekday, 24-hour clock. Use [] for closed days.
       A day can have more than one service, e.g. [['12:00','15:00'],['18:00','23:00']]. */
    hours: {
      mon: [],
      tue: [['12:00', '15:00'], ['18:00', '23:00']],
      wed: [['12:00', '15:00'], ['18:00', '23:00']],
      thu: [['12:00', '15:00'], ['18:00', '23:00']],
      fri: [['12:00', '15:00'], ['18:00', '23:59']],
      sat: [['12:00', '23:59']],
      sun: [['12:00', '21:00']]
    },
    hoursNote: 'Kitchen closes 45 minutes before the doors. Sample hours, replace.'
  },

  social: [
    { label: 'Instagram', url: '' },
    { label: 'TikTok', url: '' },
    { label: 'Facebook', url: '' }
  ],

  nav: [
    { label: 'Menu', href: '#menu' },
    { label: 'Signatures', href: '#signatures' },
    { label: 'Experience', href: '#experience' },
    { label: 'Gallery', href: '#gallery' },
    { label: 'Visit', href: '#visit' }
  ],

  seo: {
    title: 'Ember & Plate | Wood-fire grill, steaks and seafood',
    description: 'Prime cuts, whole fish and garden vegetables cooked over open flame. See the menu, order for delivery or collection, and reserve a table.'
  }
};
