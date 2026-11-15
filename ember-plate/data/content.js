/* ==========================================================================
   EMBER & PLATE — page content
   SAMPLE CONTENT for the template. Replace the words and photos with the
   restaurant's own. Photos are file names in img/p (without -800.webp).
   ========================================================================== */
window.EP = window.EP || {};

EP.content = {
  /* A short opening statement under the hero */
  intro: {
    kicker: 'The house',
    statement: 'We cook over live fire because nothing else tastes like it. Hardwood coals, patient hands and the best produce we can find, served in a room made for long evenings.',
    images: [
      { src: 'flame', alt: 'Flames leaping from a pan in a dark kitchen.', pos: '50% 60%' },
      { src: 'candle-table', alt: 'A candle glowing on a dressed table in a dim dining room.', pos: '50% 60%' }
    ],
    facts: [                                  // short facts about the restaurant, not numbers you cannot back up
      { label: 'Cooking', value: 'Open hardwood fire' },
      { label: 'Service', value: 'Lunch, dinner and late plates' },
      { label: 'Private dining', value: 'Up to 24 guests' }
    ]
  },

  /* Signature dishes: menu item ids, shown full screen one after another as the visitor scrolls */
  signatures: {
    kicker: 'Signature dishes',
    title: 'Plates people come back for.',
    items: [
      { item: 'tomahawk', image: 'tomahawk', pos: '58% 50%', line: 'The cut that started it all.' },
      { item: 'fillet-jus', image: 'jus-pour', pos: '50% 62%', line: 'Finished at the table.' },
      { item: 'king-prawn', image: 'prawn', pos: '50% 42%', line: 'Straight from the coals.' },
      { item: 'chicken-skewers', image: 'skewers-chicken', pos: '50% 62%', line: 'Marinated overnight, charred to order.' }
    ]
  },

  /* The dining experience, told in chapters */
  experience: {
    kicker: 'The experience',
    title: 'More than dinner. An evening.',
    chapters: [
      { title: 'The room', text: 'Low light, warm wood and tables set far enough apart for real conversation.',
        image: 'interior', alt: 'A long, softly lit restaurant dining room with wooden tables.', pos: '50% 50%' },
      { title: 'The fire', text: 'Everything starts at the hearth. The chefs cook in full view, so you can watch dinner happen.',
        image: 'wok', alt: 'Vegetables tossed in a pan above a flame, against a dark background.', pos: '50% 45%' },
      { title: 'The details', text: 'Sauces finished at the pass, herbs placed by hand, plates sent the moment they are ready.',
        image: 'garnish', alt: 'A chef placing herbs on a plated dish.', pos: '50% 60%' },
      { title: 'The table', text: 'Candles, linen and a glass that is never empty for long.',
        image: 'table-wine', alt: 'Wine glasses and a folded napkin on a dark restaurant table.', pos: '50% 50%' },
      { title: 'The gathering', text: 'Birthdays, deals closed, first dates and long Sunday lunches. Bring everyone.',
        image: 'group', alt: 'A group of friends dining together at a candlelit table.', pos: '50% 50%' }
    ]
  },

  /* Chef or kitchen story. Leave name empty to show the role only. */
  chef: {
    kicker: 'The kitchen',
    name: '',                                  // e.g. 'Chef Amani Otieno'
    role: 'Head chef and the kitchen team',
    image: 'chef', alt: 'A chef plating a dish at a dark counter.', pos: '50% 35%',
    image2: 'jus-pour', alt2: 'A sauce being spooned over a plated dish.', pos2: '50% 55%',
    quote: 'Fire is the oldest way to cook and still the hardest to master. We spend our days learning it.',
    story: [
      'The kitchen is built around one wood-burning grill. Every cut is seasoned simply, cooked hard over the coals and rested before it reaches the plate.',
      'We buy whole animals and whole fish from people we know, age the beef ourselves and change the specials with what the market brings in.'
    ],
    philosophy: [
      { title: 'Simple seasoning', text: 'Salt, fire and time. The produce does the rest.' },
      { title: 'Whole ingredients', text: 'Nose-to-tail cooking, so nothing good goes to waste.' },
      { title: 'Cooked to order', text: 'Nothing waits under a lamp. Your plate leaves the grill for you.' }
    ],
    history: 'Opened as a twelve-seat grill counter and grown, one table at a time, into the dining room you see today.'   // sample, replace
  },

  /* Gallery: shown in an editorial grid, opens full screen. size: 'tall' | 'wide' | '' */
  gallery: [
    { src: 'tomahawk', alt: 'A tomahawk steak in a cast iron pan with fries and rosemary.', size: 'wide', pos: '55% 50%' },
    { src: 'bar', alt: 'A long bar lit with warm lights and a row of stools.', size: 'tall' },
    { src: 'pour', alt: 'A spirit being poured over ice into a crystal glass.', size: 'tall' },
    { src: 'skewers-beef', alt: 'Beef skewers over a grill.', size: '' },
    { src: 'lamp-table', alt: 'A small lamp glowing on a wooden table.', size: 'tall' },
    { src: 'fire-b', alt: 'A tomahawk steak grilling over open flames.', size: 'wide' },
    { src: 'choc-pour', alt: 'Chocolate sauce poured over a chocolate cake.', size: 'tall' },
    { src: 'toast', alt: 'Friends raising glasses at a candlelit table.', size: 'wide' },
    { src: 'fondant', alt: 'A molten chocolate fondant.', size: '' },
    { src: 'brulee', alt: 'A crème brûlée being caramelised with a torch.', size: '' },
    { src: 'old-fashioned', alt: 'An old fashioned and half an orange on a bar.', size: '' },
    { src: 'embers', alt: 'Glowing embers in the dark.', size: 'wide' }
  ],

  /* Reviews. In demo mode they are labelled "Sample review". Use real, attributed reviews only. */
  testimonials: [
    { quote: 'The tomahawk was carved at the table and every slice was perfect. We stayed for three hours and nobody rushed us.', name: 'Sample guest', detail: 'Anniversary dinner' },
    { quote: 'Booked a table for twelve for a birthday. The team handled everything, from the cake to the playlist.', name: 'Sample guest', detail: 'Birthday celebration' },
    { quote: 'Ordered for collection on a Friday night. Hot, beautifully packed and on time.', name: 'Sample guest', detail: 'Collection order' }
  ],

  faq: [
    { q: 'Do I need to book?', a: 'Booking is recommended for dinner, especially on Friday and Saturday. We keep a few tables for walk-ins every night.' },
    { q: 'Can you cater for dietary requirements?', a: 'Yes. Dishes are marked vegetarian, vegan, gluten-free or dairy-free on the menu, and the kitchen can adapt many others. Tell us about allergies when you book or order.' },
    { q: 'Do you host private events?', a: 'The private room seats up to 24 guests. Send a reservation request with the date and number of guests and our events team will reply with menus.' },
    { q: 'How does ordering work?', a: 'Add dishes to your order, choose delivery or collection and send it. We confirm every order and the delivery fee before it is cooked.' },
    { q: 'Is there parking?', a: 'Replace this answer with your own parking, access and dress-code information.' }
  ]
};
