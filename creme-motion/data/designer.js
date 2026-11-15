/* ==========================================================================
   CRÈME MOTION — the cake designer (sample options and prices)
   Customers build their own cake and see it drawn live with an estimated
   price. Change any option, colour or price here. Flavour prices come from
   CREME.flavorTables.cake in data/menu.js; toppers come from CREME.addons.
   ========================================================================== */
window.CREME = window.CREME || {};

CREME.designer = {
  intro: 'Choose a shape, size and flavour, pick your colours and piping, add a message and toppers. We confirm the final design and price with you before baking.',

  shapes: [
    { id: 'round', label: 'Round' },
    { id: 'heart', label: 'Heart', price: 350 },
    { id: 'tiers', label: 'Two tiers', minKg: 3 }
  ],

  /* sizes map onto the cake flavour table: table = index into flavorTables.cake.sizes, or a factor of the 1 kg price */
  sizes: [
    { label: 'Bento 0.5 kg', kg: 0.5, factor: 0.62, serves: '2–3', shapes: ['round', 'heart'] },
    { label: '1 kg', kg: 1, table: 0, serves: '8–10', shapes: ['round', 'heart'] },
    { label: '1.5 kg', kg: 1.5, table: 1, serves: '12–15', shapes: ['round', 'heart'] },
    { label: '2 kg', kg: 2, table: 2, serves: '16–20', shapes: ['round', 'heart'] },
    { label: '3 kg', kg: 3, table: 3, serves: '25–30', shapes: ['round', 'tiers'] },
    { label: '4 kg', kg: 4, factor: 4.15, serves: '32–40', shapes: ['tiers'] },
    { label: '5 kg', kg: 5, factor: 5.2, serves: '40–50', shapes: ['tiers'] }
  ],
  tierExtra: 1200,            /* added to two-tier cakes for supports and assembly */

  frosting: [
    { name: 'Buttercream' },
    { name: 'Whipped cream', price: 650 }
  ],

  colours: [
    { name: 'Blush pink', hex: '#F3C1CC' },
    { name: 'Hot pink', hex: '#EA5F94' },
    { name: 'Ivory', hex: '#F7EEDC' },
    { name: 'White', hex: '#FBFAF7' },
    { name: 'Butter yellow', hex: '#F6E3A1' },
    { name: 'Sage green', hex: '#B9CBA6' },
    { name: 'Lilac', hex: '#CDB7E3' },
    { name: 'Baby blue', hex: '#B9D6EE' },
    { name: 'Peach', hex: '#F6C3A2' },
    { name: 'Red', hex: '#C8283A', price: 350 },
    { name: 'Black', hex: '#242022', price: 350 },
    { name: 'Chocolate', hex: '#6B4130' }
  ],

  piping: [
    { id: 'smooth', label: 'Smooth & clean' },
    { id: 'vintage', label: 'Vintage piping', price: 400 },
    { id: 'ruffles', label: 'Ruffles', price: 500 },
    { id: 'rosettes', label: 'Rosettes', price: 300 },
    { id: 'drip', label: 'Chocolate drip', price: 450 }
  ],

  /* toppers that are drawn in the preview (any other add-on can still be chosen from the list) */
  drawn: {
    'Fresh strawberries and berries': 'berries',
    'Large custom bow': 'bow',
    'Sugar pearls': 'pearls',
    'Butterflies': 'butterflies',
    'Wavy candles': 'candles',
    'Number candles': 'numbers',
    'Small tiara': 'tiara',
    'Big tiara': 'tiara',
    'Fondant rose': 'roses',
    'Fresh flowers (40–50 stems)': 'roses',
    'Gold spheres': 'spheres',
    'Acrylic name topper': 'name',
    'Paper name topper': 'name',
    'Black graduation cap': 'cap',
    'Custom graduation cap': 'cap'
  },

  messageMax: 30
};
