/* ==========================================================================
   CRÈME MOTION — the menu (sample content)
   Categories, products, add-ons (toppers) and the flavour price list.
   Every product, price and description here is sample content: replace it
   with the bakery's own. Prices are numbers in the currency set in
   config/site.config.js.

   How prices work
   - sizes: [{ label, serves, price }]
   - flavors: optional. Either plain names ['Vanilla', 'Chocolate'] (no change
     to the price) or { name, prices: [...] } with one price per size (this
     replaces the size price), or { name, extra: 300 } / extra: [200, 300, ...]
     (added to the size price).
   - flavorTable: 'cake' or 'cupcake' uses the shared price lists below, so the
     same list feeds every product and the cake designer.
   - options: extra choices with a price each, e.g. the frosting.
   - addons: true offers the add-ons list (toppers) below.
   - message: true shows a "message on the cake" field.
   ========================================================================== */
window.CREME = window.CREME || {};

CREME.categories = [
  { id: 'celebration', label: 'Celebration Cakes', image: 'cherry-vintage' },
  { id: 'bento', label: 'Bento & Combo Boxes', image: 'bento-box' },
  { id: 'cupcakes', label: 'Cupcakes', image: 'cupcakes-dozen' },
  { id: 'mini', label: 'Mini Cakes', image: 'mini-hearts' },
  { id: 'milky', label: 'Milky Cakes', image: 'tres-leches' },
  { id: 'tiered', label: 'Tiered & Wedding', image: 'tier-pink-bow' },
  { id: 'seasonal', label: 'Seasonal Specials', image: 'berry-cake' }
];

/* Shared flavour price lists (sample prices). Cake sizes: 1 kg, 1.5 kg, 2 kg, 3 kg. */
CREME.flavorTables = {
  cake: {
    sizes: [{ label: '1 kg', serves: '8–10' }, { label: '1.5 kg', serves: '12–15' }, { label: '2 kg', serves: '16–20' }, { label: '3 kg', serves: '25–30' }],
    flavors: [
      { name: 'Vanilla', prices: [2100, 3100, 4100, 6200] },
      { name: 'Vanilla Oreo', prices: [2400, 3500, 4700, 7050] },
      { name: 'Chocolate', prices: [2600, 3800, 5100, 7700] },
      { name: 'Chocolate Chip', prices: [2900, 4300, 5750, 8600] },
      { name: 'Chocolate Mint', prices: [2900, 4300, 5750, 8600] },
      { name: 'Chocolate Fudge', prices: [3150, 4650, 6200, 9300] },
      { name: 'Chocolate Oreo', prices: [2950, 4350, 5800, 8700] },
      { name: 'Black / White Forest', prices: [3100, 4600, 6150, 9200] },
      { name: 'Lemon Poppy Seed', prices: [3900, 5850, 7800, 11700] },
      { name: 'Red Velvet', prices: [3150, 4650, 6200, 9300] },
      { name: 'Bubblegum', prices: [2600, 3850, 5150, 7700] },
      { name: 'Blueberry Layer', prices: [3300, 4950, 6600, 9900] },
      { name: 'Vanilla Raspberry', prices: [3100, 4600, 6150, 9200] },
      { name: 'Coconut', prices: [2900, 4300, 5750, 8600] },
      { name: 'Fruit flavour (lemon, strawberry, passion, pineapple, orange, piña colada, blueberry or mint)', short: 'Fruit flavour', prices: [2300, 3400, 4550, 6800] },
      { name: 'Salted Caramel', prices: [3600, 5350, 7200, 10800] },
      { name: 'Rich Fruit Cake', prices: [3100, 4650, 6200, 9300] }
    ]
  },
  cupcake: {
    sizes: [{ label: 'Box of 6' }, { label: 'Box of 12' }, { label: 'Box of 24' }],
    flavors: [
      { name: 'Vanilla', prices: [850, 1050, 2500] },
      { name: 'Marble', prices: [850, 1100, 2550] },
      { name: 'Chocolate', prices: [900, 1250, 2900] },
      { name: 'Chocolate Chip', prices: [1000, 1300, 2950] },
      { name: 'Chocolate Mint', prices: [1000, 1300, 2950] },
      { name: 'Raspberry', prices: [850, 1100, 2550] },
      { name: 'Red Velvet', prices: [900, 1250, 2700] },
      { name: 'Fruit flavour', prices: [850, 1150, 2700] },
      { name: 'Assorted (two flavours)', prices: [1050, 1550, 3100] }
    ]
  }
};

/* Frosting choices used by most cakes */
CREME.frosting = { id: 'frosting', label: 'Frosting', choices: [{ name: 'Buttercream' }, { name: 'Whipped cream', price: 650 }, { name: 'Black or deep-coloured buttercream', price: 350 }] };

/* Add-ons and toppers (sample prices) */
CREME.addons = [
  { group: 'Edible', name: 'Black graduation cap', price: 550 },
  { group: 'Edible', name: 'Custom graduation cap', price: 650 },
  { group: 'Edible', name: 'Fondant rose', price: 300 },
  { group: 'Edible', name: 'Sugar pearls', price: 120 },
  { group: 'Edible', name: 'Chocolate toppers', price: 350 },
  { group: 'Edible', name: 'Oreo cookies', price: 250 },
  { group: 'Edible', name: 'Large custom bow', price: 1050 },
  { group: 'Edible', name: 'Rainbow', price: 1000 },
  { group: 'Edible', name: 'Unicorn horn (large)', price: 1050 },
  { group: 'Edible', name: 'Teddy bear', price: 650 },
  { group: 'Edible', name: 'Character figure (medium)', price: 650 },
  { group: 'Edible', name: 'Fresh strawberries and berries', price: 450 },
  { group: 'Edible', name: 'Baby shoes', price: 550 },
  { group: 'Edible', name: 'Edible photo print', price: 1050 },
  { group: 'Decorations', name: 'A6 custom card', price: 300 },
  { group: 'Decorations', name: 'Ribbons (6)', price: 250 },
  { group: 'Decorations', name: 'Themed paper toppers', price: 950 },
  { group: 'Decorations', name: 'Acrylic name topper', price: 650 },
  { group: 'Decorations', name: 'Paper name topper', price: 350 },
  { group: 'Decorations', name: 'Wavy candles', price: 350 },
  { group: 'Decorations', name: 'Butterflies', price: 400 },
  { group: 'Decorations', name: 'Number placard', price: 200 },
  { group: 'Decorations', name: 'Number candles', price: 150 },
  { group: 'Decorations', name: 'Small tiara', price: 350 },
  { group: 'Decorations', name: 'Big tiara', price: 550 },
  { group: 'Decorations', name: 'Polaroid photos (10)', price: 550 },
  { group: 'Decorations', name: 'Gold spheres', price: 1000 },
  { group: 'Decorations', name: 'Fresh flowers (40–50 stems)', price: 3200 }
];

CREME.products = [
  {
    id: 'signature-cake', category: 'celebration', featured: true,
    name: 'Signature Buttercream Cake',
    short: 'Your favourite flavour, soft layers and smooth buttercream, by the kilo.',
    description: 'Our everyday celebration cake: two or three tender layers filled and finished in silky buttercream, piped and decorated in your colours. Choose the weight and any of our flavours; the price updates as you choose.',
    images: [
      { src: 'cherry-vintage', alt: 'A white buttercream cake with piped vintage borders and glossy red cherries', pos: '50% 30%' },
      { src: 'cherry-vintage-2', alt: 'Close view of piped buttercream ruffles and cherries on a celebration cake' },
      { src: 'purple-cake', alt: 'A lilac buttercream cake topped with blueberries on a wooden stand' }
    ],
    flavorTable: 'cake', options: ['frosting'], addons: true, message: true,
    lead: '2 days',
    details: [['Sizes', '1 kg to 3 kg; bigger cakes and tiers on request'], ['Frosting', 'Buttercream; whipped cream or deep colours at a small extra cost'], ['Fruit flavours', 'Lemon, strawberry, mint, raspberry, passion, pineapple, orange, piña colada, blueberry'], ['Toppers', 'Choose from the add-ons, priced separately']]
  },
  {
    id: 'vintage-heart', category: 'celebration', featured: true,
    name: 'Vintage Heart Cake',
    short: 'A heart-shaped cake with lavish vintage piping and a message on top.',
    description: 'The heart cake everyone photographs first: piped borders, scallops and a hand-written message, in any colour combination you like.',
    images: [
      { src: 'heart-red', alt: 'A pink heart-shaped cake with red vintage piping and the word Love written on top' },
      { src: 'heart-pink', alt: 'A soft pink heart cake with layered piped ruffles' },
      { src: 'heart-love', alt: 'A heart cake with red and cream piping in warm light' }
    ],
    sizes: [{ label: '1 kg', serves: '8–10', price: 2700 }, { label: '1.5 kg', serves: '12–15', price: 3950 }, { label: '2 kg', serves: '16–20', price: 5250 }],
    flavors: ['Vanilla', { name: 'Chocolate', extra: [450, 650, 900] }, { name: 'Red Velvet', extra: [950, 1400, 1900] }, { name: 'Vanilla Raspberry', extra: [900, 1350, 1800] }, { name: 'Salted Caramel', extra: [1450, 2100, 2850] }],
    options: ['frosting'], addons: true, message: true, lead: '3 days',
    details: [['Piping', 'Vintage borders, scallops and swags'], ['Message', 'Up to 30 characters, piped by hand']]
  },
  {
    id: 'garden-floral', category: 'celebration',
    name: 'Garden Floral Cake',
    short: 'Buttercream florals and fresh blooms in soft, romantic colours.',
    description: 'A tall cake in painted buttercream with hand-piped flowers or fresh blooms, finished with a touch of gold.',
    images: [
      { src: 'floral-pink', alt: 'A tall lilac and pink cake with a gold edge and white flowers on top' },
      { src: 'bloom-cake', alt: 'An ivory buttercream cake decorated with pink carnations' },
      { src: 'peony-cake', alt: 'A white cake crowned with pink peonies' }
    ],
    sizes: [{ label: '1.5 kg', serves: '12–15', price: 4350 }, { label: '2 kg', serves: '16–20', price: 5650 }, { label: '3 kg', serves: '25–30', price: 8450 }],
    flavors: ['Vanilla', { name: 'Vanilla Raspberry', extra: [1000, 1350, 2000] }, { name: 'Lemon Poppy Seed', extra: [2450, 3250, 4900] }, { name: 'Red Velvet', extra: [1250, 1650, 2500] }],
    options: ['frosting'], addons: true, message: true, lead: '3 days',
    details: [['Flowers', 'Piped buttercream, or fresh flowers (add-on)'], ['Finish', 'Gold leaf edge']]
  },
  {
    id: 'number-cake', category: 'celebration',
    name: 'Number or Letter Cake',
    short: 'Your age or initials, layered with cream and topped with treats.',
    description: 'Each number or letter is two layers of cake piped with cream and dressed with berries, macarons, flowers or sweets. Choose how many characters you need.',
    images: [
      { src: 'number-candle', alt: 'A cake with a number two candle and colourful sprinkles' },
      { src: 'funfetti-slice', alt: 'A slice of sprinkle cake on a striped plate with ribbons' }
    ],
    sizes: [{ label: 'Per number or letter', serves: '6–8 each', price: 3600 }],
    unit: 'number or letter', qtyLabel: 'Numbers / letters',
    flavors: ['Vanilla', 'Chocolate Oreo', 'Chocolate Fudge', 'Mint', 'Raspberry Lemon', 'Blueberry Layer', 'Salted Caramel', 'Bubblegum', 'Coconut', 'Fruit flavour', 'Assorted (two flavours)'],
    options: [{ id: 'cream', label: 'Cream', choices: [{ name: 'Buttercream' }, { name: 'Whipped cream', price: 700 }] }],
    addons: true, message: true, lead: '3 days',
    details: [['Size', 'About 1.5 kg per character'], ['Toppings', 'Included; extras from the add-ons']]
  },
  {
    id: 'bento-cake', category: 'bento', featured: true,
    name: 'Bento Cake',
    short: 'A little 0.5 kg cake in a takeaway box, with your message.',
    description: 'A small, perfectly decorated cake for one or two, boxed with a candle. The sweetest way to say happy birthday.',
    images: [
      { src: 'bento-box', alt: 'A small cream bento cake with Happy Birthday written on it, in an open lunch box with a candle' },
      { src: 'bento-green', alt: 'A mint green bento cake in a box on a wooden table' }
    ],
    sizes: [{ label: 'Bento (0.5 kg)', serves: '2–3', price: 1350 }],
    flavors: ['Vanilla', 'Marble', 'Chocolate', { name: 'Chocolate Chip', extra: 150 }, { name: 'Red Velvet', extra: 150 }, 'Fruit flavour'],
    addons: true, message: true, lead: '1 day',
    details: [['Includes', 'Box and a candle'], ['Message', 'Up to 25 characters']]
  },
  {
    id: 'bento-duo', category: 'bento',
    name: 'Bento & Cupcake Duo',
    short: 'A bento cake with two matching cupcakes.',
    description: 'A 0.5 kg bento cake and two cupcakes, decorated to match and boxed together.',
    images: [
      { src: 'bento-green', alt: 'A green bento cake in a white box' },
      { src: 'cupcake-box', alt: 'Decorated cupcakes in a window box with flowers' }
    ],
    sizes: [{ label: 'Bento + 2 cupcakes', serves: '3–4', price: 1600 }],
    flavors: ['Vanilla', 'Bubblegum', 'Pineapple', 'Lemon', 'Passion', 'Chocolate', 'Mint', 'Strawberry', 'Orange'],
    addons: true, message: true, lead: '2 days',
    details: [['Cake', '0.5 kg'], ['Cupcakes', 'Two, in the same colours']]
  },
  {
    id: 'bento-five', category: 'bento', featured: true,
    name: 'Bento Box of Five',
    short: 'A bento cake surrounded by four cupcakes, the classic gift box.',
    description: 'Our most-gifted box: a 0.5 kg bento cake in the middle and four cupcakes around it, all piped in your colours.',
    images: [
      { src: 'cupcake-box', alt: 'Cupcakes decorated in pastel colours in a gift box' },
      { src: 'bento-box', alt: 'A bento cake in an open box' }
    ],
    sizes: [{ label: 'Bento + 4 cupcakes', serves: '5–6', price: 2450 }],
    flavors: ['Vanilla', 'Marble', 'Chocolate', 'Fruit flavour', 'Vanilla Oreo', { name: 'Chocolate Mint', extra: 250 }, { name: 'Chocolate Chip', extra: 250 }, { name: 'Red Velvet', extra: 250 }, { name: 'Raspberry', extra: 250 }, { name: 'Assorted (two flavours)', extra: 250 }],
    addons: true, message: true, lead: '2 days',
    details: [['Cake', '0.5 kg'], ['Cupcakes', 'Four, matching']]
  },
  {
    id: 'bento-eight', category: 'bento',
    name: 'Bento Party Box of Eight',
    short: 'A bento cake and seven cupcakes for sharing.',
    description: 'For office surprises and small parties: a 0.5 kg bento cake with seven cupcakes, boxed and ready to share.',
    images: [
      { src: 'cupcakes-retro', alt: 'A box of colourful frosted cupcakes' },
      { src: 'bento-green', alt: 'A green bento cake in a box' }
    ],
    sizes: [{ label: 'Bento + 7 cupcakes', serves: '8–10', price: 3750 }],
    flavors: ['Vanilla & Chocolate Oreo', 'Chocolate Mint', 'Chocolate Chip', 'Raspberry', 'Red Velvet', 'Coconut', 'Salted Caramel', 'Bubblegum', 'Assorted'],
    addons: true, message: true, lead: '2 days',
    details: [['Cake', '0.5 kg'], ['Cupcakes', 'Seven']]
  },
  {
    id: 'cupcakes', category: 'cupcakes', featured: true,
    name: 'Classic Cupcakes',
    short: 'Soft cupcakes with a tall buttercream swirl, by the box.',
    description: 'Freshly baked cupcakes piped with buttercream in your colours. Choose a box size and a flavour, or an assorted box of two flavours.',
    images: [
      { src: 'cupcakes-dozen', alt: 'A dozen vanilla and chocolate cupcakes with buttercream swirls, seen from above' },
      { src: 'cupcakes-vanilla', alt: 'Vanilla cupcakes with buttercream swirls' },
      { src: 'cupcake-single', alt: 'A single cupcake with a buttercream swirl' }
    ],
    flavorTable: 'cupcake', addons: true, lead: '1 day',
    details: [['Frosting', 'Buttercream'], ['Assorted box', 'Two flavours of your choice']]
  },
  {
    id: 'print-cupcakes', category: 'cupcakes',
    name: 'Edible Print Cupcakes',
    short: 'Cupcakes topped with your photo, logo or design.',
    description: 'Send us a photo, a logo or a theme and we print it on edible discs for every cupcake. Perfect for birthdays, launches and branded events.',
    images: [
      { src: 'cupcakes-bright', alt: 'Brightly frosted cupcakes with sprinkles in a box' },
      { src: 'cupcakes-retro', alt: 'A box of decorated cupcakes' }
    ],
    sizes: [{ label: 'Box of 6', price: 1550 }, { label: 'Box of 12', price: 2100 }],
    flavors: ['Vanilla', 'Marble', 'Chocolate', 'Chocolate Chip', 'Chocolate Mint', 'Red Velvet', 'Lemon', 'Strawberry', 'Passion', 'Blueberry'],
    upload: true, lead: '3 days',
    details: [['How to order', 'Pick your flavour and frosting colour, then send the images on WhatsApp'], ['Limit', 'Up to 6 different prints per box']]
  },
  {
    id: 'trio-delight', category: 'mini', featured: true,
    name: 'Trio Delight',
    short: 'Three mini cakes, three flavours, up to 2 kg in total.',
    description: 'Can’t choose? Three little cakes, each in a different flavour, decorated as a set. Lovely for small celebrations and dessert tables.',
    images: [
      { src: 'mini-strawberry', alt: 'Three small square cakes topped with strawberries and blueberries' },
      { src: 'mini-flower', alt: 'A small white cake with a flower, on a dessert table' }
    ],
    sizes: [{ label: 'Three mini cakes', serves: '12–16', price: 3300 }],
    pick: { label: 'Choose three flavours', count: 3, from: ['Vanilla', 'Raspberry', 'Vanilla Oreo', 'Chocolate Oreo', 'Chocolate', 'Chocolate Mint', 'Chocolate Chip', 'Red Velvet', 'Fruit flavour', 'Lemon', 'Strawberry', 'Passion', 'Piña colada'] },
    addons: true, message: true, lead: '3 days',
    details: [['Weight', 'Up to 2 kg in total'], ['Decoration', 'Matching set']]
  },
  {
    id: 'mini-heart', category: 'mini',
    name: 'Mini Heart Cake',
    short: 'A small heart cake with piped hearts and a sweet message.',
    description: 'A 0.6 kg heart cake piped with tiny hearts and your words. A thoughtful little surprise.',
    images: [
      { src: 'mini-hearts', alt: 'Hands holding a small round cake decorated with colourful piped hearts' },
      { src: 'heart-candles', alt: 'A white heart cake with lit candles' }
    ],
    sizes: [{ label: 'Mini (0.6 kg)', serves: '3–4', price: 1650 }],
    flavors: ['Vanilla', 'Chocolate', { name: 'Red Velvet', extra: 200 }, 'Strawberry', 'Lemon'],
    message: true, addons: true, lead: '1 day',
    details: [['Includes', 'Box and candle']]
  },
  {
    id: 'milky-tin', category: 'milky', featured: true,
    name: 'Milky Tres Leches Tin',
    short: 'Light sponge soaked in three milks and topped with whipped cream.',
    description: 'A classic milky cake: a light sponge soaked in evaporated milk, condensed milk and cream, finished with whipped cream. Served chilled in its tin.',
    images: [
      { src: 'tres-leches', alt: 'A slice of tres leches cake with raspberries on a white plate' },
      { src: 'milky-tin', alt: 'Squares of milky cake on a plate with a fork beside a baking tin' }
    ],
    sizes: [{ label: 'Tin (about 800 g)', serves: '4–6', price: 1250 }],
    flavors: ['Classic vanilla', 'Rich chocolate', { name: 'Biscoff & caramel', extra: 150 }, 'Passion fruit'],
    lead: '1 day',
    details: [['Keep', 'Refrigerated; best within 2 days'], ['Serve', 'Chilled']]
  },
  {
    id: 'two-tier', category: 'tiered', featured: true,
    name: 'Two-Tier Celebration Cake',
    short: 'Two tiers, one show-stopper. From 3 kg.',
    description: 'For milestone birthdays, baby showers and engagements: two tiers decorated with bows, flowers or piping. Each tier can be a different flavour.',
    images: [
      { src: 'tier-pink-bow', alt: 'A pink two-tier cake with a large bow and flowers on top' },
      { src: 'tier-striped', alt: 'A two-tier cake with green and white stripes and pink flowers' }
    ],
    sizes: [{ label: '3 kg', serves: '25–30', price: 9600 }, { label: '4 kg', serves: '32–40', price: 12500 }, { label: '5 kg', serves: '40–50', price: 15300 }],
    flavors: ['Vanilla', { name: 'Chocolate', extra: [1500, 2000, 2500] }, { name: 'Red Velvet', extra: [3000, 4000, 5000] }, { name: 'Two different flavours', extra: [1200, 1600, 2000] }],
    options: ['frosting'], addons: true, message: true, lead: '5 days',
    details: [['Tiers', 'Two; three tiers on request'], ['Delivery', 'Delivered and set up']]
  },
  {
    id: 'ivory-wedding', category: 'tiered',
    name: 'Ivory Wedding Cake',
    short: 'Elegant ivory tiers with flowers, made for your day.',
    description: 'Smooth or textured ivory tiers with fresh or sugar flowers. We start with a tasting and design it with you and your florist.',
    images: [
      { src: 'wedding-ivory', alt: 'A three-tier ivory wedding cake with cream roses' },
      { src: 'wedding-rose', alt: 'A three-tier white cake with pink flowers beside champagne glasses' },
      { src: 'wedding-gold', alt: 'A tall wedding cake with sugar flowers and gold details' }
    ],
    sizes: [{ label: '4 kg (2 tiers)', serves: '32–40', price: 14600 }, { label: '6 kg (3 tiers)', serves: '50–60', price: 21200 }, { label: '8 kg (3 tiers)', serves: '70–80', price: 27800 }],
    flavors: ['Vanilla', 'Vanilla Raspberry', 'Lemon Poppy Seed', 'Red Velvet', 'Chocolate Fudge', 'Different flavour per tier'],
    options: ['frosting'], addons: true, lead: '3 weeks',
    details: [['Includes', 'Tasting, delivery and set-up'], ['Booking', 'Confirmed with a deposit']]
  },
  {
    id: 'berry-cake', category: 'seasonal',
    name: 'Fresh Berry Cake',
    short: 'Vanilla sponge, whipped cream and a crown of fresh berries.',
    description: 'Light vanilla layers with whipped cream and fresh berries inside and on top. Made while the berries are at their best.',
    images: [
      { src: 'berry-cake', alt: 'A layered sponge cake with cream, topped with fresh raspberries' },
      { src: 'blackberry-cake', alt: 'A white cake topped with blackberries and lilac flowers on a green stand' },
      { src: 'berry-naked', alt: 'A semi-naked cake with strawberries and blueberries' }
    ],
    sizes: [{ label: '1 kg', serves: '8–10', price: 3450 }, { label: '1.5 kg', serves: '12–15', price: 4950 }, { label: '2 kg', serves: '16–20', price: 6550 }],
    flavors: ['Vanilla', 'Lemon', { name: 'Chocolate', extra: [300, 450, 600] }],
    message: true, lead: '2 days',
    details: [['Fruit', 'Strawberries, raspberries, blueberries or blackberries, as in season'], ['Keep', 'Refrigerated']]
  },
  {
    id: 'valentine-bento', category: 'seasonal',
    name: 'Valentine’s Heart Bento',
    short: 'A heart-shaped bento cake with roses and a love note.',
    description: 'A small heart cake in a box with piped roses, pearls and your message. Available around Valentine’s Day and anniversaries.',
    images: [
      { src: 'heart-pink', alt: 'A pink heart cake with piped ruffles' },
      { src: 'heart-candles', alt: 'A white heart cake with candles' }
    ],
    sizes: [{ label: 'Heart bento (0.6 kg)', serves: '2–3', price: 1750 }],
    flavors: ['Vanilla', 'Red Velvet', 'Chocolate', 'Strawberry'],
    message: true, addons: true, lead: '2 days',
    details: [['Includes', 'Box, candle and a love note card']]
  }
];
