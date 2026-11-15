/* ==========================================================================
   ABALI HOSPITAL — settings
   Everything that belongs to one hospital lives in this file and in
   data/content.js. To set the template up for a new hospital or clinic,
   edit these two files and replace the photos in img/p/. You do not need
   to touch js/ or css/.
   ========================================================================== */
window.AB = window.AB || {};

AB.config = {
  /* Template mode: shows "Sample" labels on profiles, figures and reviews, and a short notice on the
     appointment form that nothing is sent until a booking endpoint is connected. Set to false for a
     real hospital (after replacing the sample content). */
  sample: true,

  brand: {
    name: 'Abali Hospital',              // sample name, replace
    short: 'Abali',
    logo: '',                            // path to an SVG or PNG; empty = the mark below with the name
    favicon: 'img/brand/favicon.svg'
  },

  /* Colours. mint = page background, sage = soft panels, forest = deep panels and buttons,
     ink = text, grey = secondary text, pollen = the small bright accent. */
  theme: { mint: '#E4EDE6', mist: '#F3F6F1', sage: '#CFE0D4', forest: '#0E3B33', pine: '#165247', ink: '#13211D', grey: '#5E6F68', pollen: '#E2EC9B' },

  fonts: {
    href: 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300;1,9..144,400&family=Manrope:wght@400;500;600;700&display=swap',
    display: '"Fraunces", Georgia, "Times New Roman", serif',
    body: '"Manrope", system-ui, -apple-system, "Segoe UI", sans-serif'
  },

  nav: [
    { label: 'Home', href: '#top' },
    { label: 'About', href: '#about' },
    { label: 'Services', href: '#services' },
    { label: 'Specialists', href: '#specialists' },
    { label: 'Patient information', href: '#patients' },
    { label: 'Contact', href: '#contact' }
  ],

  hero: {
    kicker: 'Hospital & specialist care',
    headline: ['Medicine that', 'starts with', '*understanding you.*'],   // one line per item; *…* = italic
    text: 'From your first question to your last follow-up, one team listens, explains every step and stays with you, with specialists, tests and treatment under one roof.',
    primary: { label: 'Book an appointment', href: '#book' },
    secondary: { label: 'Explore services', href: '#services' },
    chips: [                              // small links that float beside the helix
      { label: 'Diagnostic imaging', href: '#services', dept: 'imaging' },
      { label: 'Laboratory', href: '#services', dept: 'lab' },
      { label: 'Maternity', href: '#services', dept: 'maternity' }
    ],
    /* The living helix: colours, how dense it is (1 = default), its size and where it sits.
       place.wide = laptops and desktops, place.tall = phones and portrait tablets.
       x, y: centre in screen units (-1 to 1), scale: size, rot: angle in radians. */
    helix: {
      colors: { deep: '#0B3F33', leaf: '#3F8F3E', light: '#8FC27F', glow: '#E3F09A' },
      density: 1,
      size: 2.6,
      place: { wide: { x: 0.42, y: 0.0, scale: 1.0, rot: -0.58 }, tall: { x: 0.0, y: 0.5, scale: 0.62, rot: -1.2 } }
    }
  },

  /* Appointment requests.
     endpoint: where the form is sent as JSON (Formspree, Getform, your own API or your booking system).
     Empty = template mode: the form checks everything but sends nothing, and says so.
     A request only shows as "received" when the endpoint answers with a 2xx status, and the message
     always says the hospital will call to confirm: nothing on this page books a slot by itself. */
  booking: {
    endpoint: '',
    slotMinutes: 30,
    leadDays: 1,                          // earliest day offered, counted from today
    maxDays: 60,
    note: 'We call or text to confirm every appointment. For an emergency, come straight to the emergency department or call the emergency line.'
  },

  contact: {
    phone: '',                            // e.g. '+254 7XX XXX XXX'
    emergency: '',                        // emergency line, e.g. '+254 7XX XXX XXX'
    email: 'appointments@example.com',    // sample, replace
    whatsapp: '',                         // digits only, e.g. '2547XXXXXXXX'
    address: ['Your street address', 'Neighbourhood, City'],   // sample, replace
    mapEmbed: '',                         // Google Maps "Embed a map" src URL (optional)
    mapUrl: '',                           // link for "Get directions" (optional)
    timezone: 'Africa/Nairobi',
    /* Outpatient clinic hours by weekday, 24-hour clock. [] = closed. */
    hours: {
      mon: [['08:00', '18:00']], tue: [['08:00', '18:00']], wed: [['08:00', '18:00']], thu: [['08:00', '18:00']],
      fri: [['08:00', '18:00']], sat: [['09:00', '14:00']], sun: []
    },
    emergencyNote: 'Emergency department open 24 hours, every day.',   // sample, replace
    hoursNote: 'Sample hours. Replace with your own.'
  },

  social: [
    { label: 'Instagram', url: '' },
    { label: 'Facebook', url: '' },
    { label: 'LinkedIn', url: '' },
    { label: 'X', url: '' }
  ],

  seo: {
    title: 'Abali Hospital | Medicine that starts with understanding you',
    description: 'A patient-first hospital with specialists, diagnostics, maternity, paediatrics and emergency care under one roof. Book an appointment online.'
  }
};
