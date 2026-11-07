/* ============================================================
   CIEL AFRICA — Photo Books configuration
   Edited from /photobooks/admin (or by hand). The browser and the
   payment server both read this file, so prices charged at checkout
   always come from here, never from the page.

   PRICES: every price starts as null = "not set". A product cannot be
   bought until its price is set. Nothing here is a final retail price.

   PRINT: a format/binding can be ordered as a printed book only when
   `print.enabled` is true AND its print prices are set. Turn it on only
   once your printer has confirmed they can produce that exact spec
   (trim size, bleed, binding, paper and spine width per page).

   Sizes are millimetres. bleed = extra image area beyond the trim on
   every edge; safe = distance from the trim that text and important
   parts of a photo keep clear of.
   ============================================================ */
(function (root) {
  var PB = {
    version: 1,
    currency: 'KES',
    usdRate: 130,

    /* The /photobooks book (portrait hardcover). The price depends on the number of pages:
       price = base + (pages − includedPages) × perExtraPage (KES). Set either to null to hide
       prices ("price coming soon"). Delivery prices are in `delivery` below. */
    book: {
      name: 'Portrait photo book', size: '21 × 29.7 cm (A4)', trimW: 210, trimH: 297, binding: 'Hardcover',
      pages: { min: 24, max: 100, step: 2, default: 24 },
      maxPhotosPerPage: 12,
      /* printed hardcover (KES) for each book size; a book between sizes pays the next size up. Edited in Ciel Admin → Website → Prices. */
      price: { tiers: { 24: 4500, 36: 4900, 48: 6100, 60: 7300, 80: 9300, 100: 11300 } },
      digital: { base: 1600, includedPages: 24, perExtraPage: 25 },  /* print-ready PDF (KES) */
      pdf: false,    /* print-ready PDFs on sale? (false = printed books only) */
      testPrice: 5,  /* KES: the admin-only "Ciel Test" book (Someone), for trying real payments; kept until deleted in the orders inbox */
      ordering: true, /* M-Pesa checkout at /photobooks/checkout */
      /* Paybill paid by hand: the customer pastes the M-Pesa message and Ciel Africa confirms the order */
      manualPay: { enabled: true, paybill: '400200', account: '613260' },
      /* The hardcover case. Spine = paperGsm × paperBulk × sheets ÷ 1000 + 2 × boardMm (2 pages a sheet).
         hingeMm = the groove each side of the spine; wrapMm = cover folded over the boards (incl. bleed).
         Ask the printer for their paper gsm/bulk, board thickness, hinge and turn-in, and enter them in Ciel Admin. */
      cover: { paperGsm: 170, paperBulk: 1, boardMm: 3, hingeMm: 8, wrapMm: 15 }
    },

    /* Free tier limits while designing (photos stay on the customer's device). */
    limits: { maxPhotosPerProject: 300, maxFileMB: 40, minPhotoPx: 800 },

    digital: {
      enabled: true,
      /* Digital PDF price per format: price = base + max(0, pages − includedPages) × perExtraPage */
      note: 'A print-ready, high-resolution PDF of your finished book.'
    },

    formats: [
      { id: 'sq21', name: 'Square', size: '21 × 21 cm', shape: 'square', trimW: 210, trimH: 210, bleed: 3, safe: 10,
        pages: { min: 20, max: 100, step: 2, default: 24 }, enabled: true,
        digital: { base: null, includedPages: 24, perExtraPage: null },
        print: { enabled: false, bindings: {
          softcover: { base: null, includedPages: 24, perExtraPage: null },
          hardcover: { base: null, includedPages: 24, perExtraPage: null } } } },

      { id: 'sq30', name: 'Large square', size: '30 × 30 cm', shape: 'square', trimW: 300, trimH: 300, bleed: 3, safe: 12,
        pages: { min: 20, max: 100, step: 2, default: 24 }, enabled: true,
        digital: { base: null, includedPages: 24, perExtraPage: null },
        print: { enabled: false, bindings: {
          hardcover: { base: null, includedPages: 24, perExtraPage: null } } } },

      { id: 'a4p', name: 'Portrait', size: 'A4 · 21 × 29.7 cm', shape: 'portrait', trimW: 210, trimH: 297, bleed: 3, safe: 10,
        pages: { min: 20, max: 100, step: 2, default: 24 }, enabled: true,
        digital: { base: null, includedPages: 24, perExtraPage: null },
        print: { enabled: false, bindings: {
          softcover: { base: null, includedPages: 24, perExtraPage: null },
          hardcover: { base: null, includedPages: 24, perExtraPage: null } } } },

      { id: 'ls28', name: 'Landscape', size: '28 × 21 cm', shape: 'landscape', trimW: 280, trimH: 210, bleed: 3, safe: 10,
        pages: { min: 20, max: 100, step: 2, default: 24 }, enabled: true,
        digital: { base: null, includedPages: 24, perExtraPage: null },
        print: { enabled: false, bindings: {
          softcover: { base: null, includedPages: 24, perExtraPage: null },
          hardcover: { base: null, includedPages: 24, perExtraPage: null } } } }
    ],

    /* Binding rules used for the cover file. spine = pages × paper.mmPerPage + board allowance. */
    bindings: {
      softcover: { name: 'Softcover', wrap: 3, hinge: 0, spineText: false, spineTextMinMm: 6, boardAllowance: 0.5 },
      hardcover: { name: 'Hardcover', wrap: 15, hinge: 8, spineText: true, spineTextMinMm: 6, boardAllowance: 4 }
    },

    papers: [
      { id: 'silk170', name: 'Silk 170 gsm', mmPerPage: 0.08, perPage: null, enabled: true },
      { id: 'matte200', name: 'Matte 200 gsm', mmPerPage: 0.1, perPage: null, enabled: true }
    ],

    /* Kenya fulfilment. needsAddress = collect a delivery address. price null = not set. */
    delivery: [
      { id: 'nairobi', name: 'Nairobi · parcel delivery', price: 200, needsAddress: true, enabled: true },
      { id: 'kenya', name: 'Rest of Kenya · parcel delivery', price: 350, needsAddress: true, enabled: true },
      { id: 'eastafrica', name: 'Other East African countries', price: 500, needsAddress: true, enabled: true },
      { id: 'uber', name: 'Uber bike (Nairobi): pay the rider on arrival', price: 0, needsAddress: true, enabled: true, note: 'We’ll tell you the Uber cost before we dispatch.' }
    ],
    maxQuantity: 10,

    /* Template metadata. Artwork and layouts live in assets/js/pb/. Set visible:false to hide one. */
    templates: [
      { id: 'zanzibar-blue', name: 'Zanzibar Blue', category: 'travel', collection: 'destinations', tags: ['Colourful', 'Illustrated'], desc: 'An arched window onto a palm and a low sun, on Indian Ocean blue.', visible: true, featured: true },
      { id: 'zanzibar-night', name: 'Zanzibar Night', category: 'travel', collection: 'destinations', tags: ['Bold', 'Illustrated'], desc: 'The same arch and palm, glowing against black.', visible: true },
      { id: 'paris-rose', name: 'Paris Rose', category: 'travel', collection: 'destinations', tags: ['Playful', 'Illustrated'], desc: 'A tower badge with soft clouds on rose pink.', visible: true, featured: true },
      { id: 'cape-coral', name: 'Cape Coral', category: 'travel', collection: 'destinations', tags: ['Colourful', 'Illustrated'], desc: 'A flat-topped mountain and protea on warm coral.', visible: true },
      { id: 'amsterdam-canal', name: 'Canal Houses', category: 'travel', collection: 'destinations', tags: ['Playful', 'Illustrated'], desc: 'Three gabled houses and bunting on pale aqua.', visible: true },
      { id: 'diani-shore', name: 'Diani Shore', category: 'travel', collection: 'destinations', tags: ['Calm', 'Illustrated'], desc: 'A palm, a half sun and a turquoise tide.', visible: true, featured: true },
      { id: 'savanna-gold', name: 'Savanna Gold', category: 'travel', collection: 'destinations', tags: ['Warm', 'Illustrated'], desc: 'An acacia at sunset over golden grass.', visible: true },
      { id: 'lamu-dhow', name: 'Dhow Sail', category: 'travel', collection: 'destinations', tags: ['Calm', 'Illustrated'], desc: 'A dhow sail on a still sea, in sand and deep teal.', visible: true },
      { id: 'love-letter', name: 'Love Letter', category: 'love', tags: ['Romantic', 'Serif'], desc: 'Blush paper, a large serif title and a single framed photo.', visible: true, featured: true },
      { id: 'ivory-vows', name: 'Ivory Vows', category: 'wedding', tags: ['Elegant', 'Minimal'], desc: 'Ivory and charcoal with fine type and generous margins.', visible: true },
      { id: 'family-table', name: 'Family Table', category: 'family', tags: ['Warm', 'Classic'], desc: 'Terracotta and cream; relaxed grids with room for captions.', visible: true },
      { id: 'crayon-days', name: 'Crayon Days', category: 'childhood', tags: ['Playful', 'Colourful'], desc: 'Rounded type and bright primaries for growing-up years.', visible: true },
      { id: 'first-year', name: 'First Year', category: 'baby', tags: ['Soft', 'Pastel'], desc: 'Pale sage and powder tones with gentle, airy pages.', visible: true },
      { id: 'confetti', name: 'Confetti', category: 'celebration', tags: ['Bold', 'Colourful'], desc: 'A burst of confetti and a big poster title.', visible: true },
      { id: 'cap-and-gown', name: 'Cap & Gown', category: 'graduation', tags: ['Classic', 'Bold'], desc: 'Deep navy and gold with a strong serif.', visible: true },
      { id: 'good-company', name: 'Good Company', category: 'friendship', tags: ['Playful', 'Bold'], desc: 'Sunny yellow, collage pages and handwritten captions.', visible: true },
      { id: 'year-in-review', name: 'Year in Review', category: 'life', tags: ['Editorial', 'Bold'], desc: 'A big numeral cover and month-by-month section pages.', visible: true },
      { id: 'portfolio-mono', name: 'Portfolio Mono', category: 'portfolio', tags: ['Editorial', 'Minimal'], desc: 'Black, white and full-bleed images. The photographs lead.', visible: true, featured: true },
      { id: 'gallery-white', name: 'Gallery White', category: 'minimal', tags: ['Minimal', 'Elegant'], desc: 'White pages, small type and lots of air around each photo.', visible: true },
      { id: 'blank', name: 'Blank canvas', category: 'custom', tags: ['Minimal'], desc: 'Start from neutral styling and make every choice yourself.', visible: true }
    ],

    categories: [
      { id: 'travel', name: 'Travel & holidays' }, { id: 'love', name: 'Love & anniversaries' },
      { id: 'wedding', name: 'Weddings & engagements' }, { id: 'family', name: 'Family memories' },
      { id: 'childhood', name: 'Childhood' }, { id: 'baby', name: "Baby's first year" },
      { id: 'celebration', name: 'Birthdays & celebrations' }, { id: 'graduation', name: 'Graduations' },
      { id: 'friendship', name: 'Friendship' }, { id: 'life', name: 'Life stories & yearly recaps' },
      { id: 'portfolio', name: 'Photography portfolios' }, { id: 'minimal', name: 'Minimal collections' },
      { id: 'custom', name: 'Custom' }
    ]
  };
  if (typeof module === 'object' && module.exports) module.exports = PB;
  else { root.CIEL = root.CIEL || {}; root.CIEL.photobooks = PB; }
})(typeof self !== 'undefined' ? self : this);
