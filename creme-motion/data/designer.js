/* ==========================================================================
   CRÈME MOTION — the cake designer (sample options and prices)
   Customers build their own cake and see a photographic preview with an estimated
   price. Change any option, colour or price here. Flavour prices come from
   CREME.flavorTables.cake in data/menu.js; toppers come from CREME.addons.
   ========================================================================== */
window.CREME = window.CREME || {};

CREME.designer = {
  intro: 'Choose the shape, size and flavour, then the colour and finish. The photograph changes with you and the price updates as you go. We confirm the final design and price before we bake.',

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


  messageMax: 30,

  /* Preview photographs (img/studio/<image>.webp with a matching <image>-mask.png that marks the frosting).
     The studio shows the photo that matches the chosen shape and piping style, or the closest one for that shape,
     and tints its frosting to the chosen colour. Add your own photographs and masks to show more combinations. */
  previewPath: 'img/studio/',
  previews: [
    { image: 'round-smooth', shape: 'round', piping: ['smooth'] },
    { image: 'round-vintage', shape: 'round', piping: ['vintage'] },
    { image: 'round-ruffles', shape: 'round', piping: ['ruffles', 'rosettes'] },
    { image: 'round-drip', shape: 'round', piping: ['drip'] },
    { image: 'heart', shape: 'heart', piping: ['vintage', 'ruffles'] },
    { image: 'tiers', shape: 'tiers', piping: ['smooth'] }
  ]
};
