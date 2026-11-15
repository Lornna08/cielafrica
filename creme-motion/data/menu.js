/* ==========================================================================
   CRÈME MOTION — the menu (sample content)
   Categories and products. Every product, price and description here is
   sample content for the template. Replace it with the bakery's own.

   Product fields
   - id: short unique name, used in links (#product/<id>)
   - category: one of the category ids below
   - images: [{ src, alt, pos }] — src is a file name in img/p without the
     size suffix (img/p/<src>-800.webp and -1600.webp); pos is an optional
     CSS object-position, e.g. '50% 60%'
   - price: the starting price (number). Each size can set its own price.
   - sizes: [{ label, price, serves }]   flavors: ['...'] (optional)
   - availability: 'available' | 'preorder' | 'limited' | 'soldout'
   - lead: how much notice is needed, shown on the product
   - details: [['Label', 'Value'], ...]
   ========================================================================== */
window.CREME = window.CREME || {};

CREME.categories = [
  { id: 'celebration', label: 'Celebration Cakes' },
  { id: 'wedding', label: 'Wedding Cakes' },
  { id: 'cupcakes', label: 'Cupcakes' },
  { id: 'mini', label: 'Mini Cakes' },
  { id: 'boxes', label: 'Dessert Boxes' },
  { id: 'pastries', label: 'Cookies & Pastries' },
  { id: 'seasonal', label: 'Seasonal Specials' }
];

CREME.availability = {
  available: 'Available to order',
  preorder: 'Pre-order',
  limited: 'Limited this week',
  soldout: 'Sold out'
};

CREME.products = [
  {
    id: 'chocolate-fudge-cake', category: 'celebration', featured: true,
    name: 'Chocolate Fudge Cake',
    short: 'Three dark sponges, fudge frosting and a glossy ganache drip.',
    description: 'Our deepest chocolate cake: three moist cocoa sponges layered with whipped chocolate fudge frosting, finished with a ganache drip and chocolate curls.',
    images: [
      { src: 'choc-slice', alt: 'A tall slice of layered chocolate fudge cake on a white plate', pos: '50% 55%' },
      { src: 'choc-swirl', alt: 'A whole chocolate cake topped with piped chocolate swirls and a ganache drip' },
      { src: 'choc-slice-2', alt: 'A slice of chocolate layer cake with a fork on a marble table' }
    ],
    price: 3800,
    sizes: [
      { label: '6 inches', price: 3800, serves: '8–10' },
      { label: '8 inches', price: 5200, serves: '14–18' },
      { label: '10 inches', price: 7400, serves: '24–30' }
    ],
    flavors: ['Classic fudge', 'Salted caramel fudge', 'Mocha fudge'],
    availability: 'available', lead: '2 days',
    details: [['Sponge', 'Cocoa and buttermilk'], ['Filling', 'Whipped chocolate fudge'], ['Finish', 'Ganache drip, chocolate curls'], ['Contains', 'Gluten, dairy, eggs, soy'], ['Keeps', '3 days in the fridge; serve at room temperature']]
  },
  {
    id: 'vanilla-bloom', category: 'celebration',
    name: 'Vanilla Bloom',
    short: 'Vanilla bean sponge in soft ivory buttercream with sugar flowers.',
    description: 'Light vanilla bean sponge with vanilla Swiss meringue buttercream and a layer of berry compote, finished in a textured ivory coat with handmade sugar flowers.',
    images: [
      { src: 'bloom-cake', alt: 'An ivory buttercream cake decorated with pink carnations and pearl sprinkles' },
      { src: 'peony-cake', alt: 'A white rustic buttercream cake crowned with pink peonies and roses' }
    ],
    price: 4200,
    sizes: [
      { label: '6 inches', price: 4200, serves: '8–10' },
      { label: '8 inches', price: 5800, serves: '14–18' },
      { label: '10 inches', price: 8200, serves: '24–30' }
    ],
    flavors: ['Vanilla & berry', 'Vanilla & lemon curd', 'Vanilla & passion fruit'],
    availability: 'available', lead: '3 days',
    details: [['Sponge', 'Vanilla bean'], ['Filling', 'Buttercream and berry compote'], ['Finish', 'Textured buttercream, sugar or fresh flowers'], ['Contains', 'Gluten, dairy, eggs'], ['Keeps', '3 days in the fridge']]
  },
  {
    id: 'strawberries-and-cream', category: 'celebration',
    name: 'Strawberries & Cream',
    short: 'Chiffon sponge, Chantilly cream and fresh strawberries.',
    description: 'A cloud-light chiffon sponge soaked in vanilla syrup and layered with Chantilly cream and sliced fresh strawberries. Best on the day.',
    images: [
      { src: 'shortcake-slices', alt: 'Slices of strawberry shortcake showing cream and strawberry layers' },
      { src: 'shortcake-slice', alt: 'A single slice of strawberry cream cake on a wooden table' },
      { src: 'strawberry-cream', alt: 'A cream cake decorated with halved strawberries and piped cream' }
    ],
    price: 3600,
    sizes: [
      { label: '6 inches', price: 3600, serves: '8–10' },
      { label: '8 inches', price: 4900, serves: '14–18' }
    ],
    flavors: ['Classic vanilla', 'Matcha sponge'],
    availability: 'limited', lead: '2 days',
    details: [['Sponge', 'Vanilla chiffon'], ['Filling', 'Chantilly cream, fresh strawberries'], ['Contains', 'Gluten, dairy, eggs'], ['Keeps', 'Best eaten the day it is collected']]
  },
  {
    id: 'cookies-and-cream-drip', category: 'celebration',
    name: 'Cookies & Cream Drip',
    short: 'Vanilla and chocolate sponge with a dark chocolate drip.',
    description: 'Alternating vanilla and chocolate sponges with cookie crumb buttercream, wrapped in smooth white buttercream with a dark chocolate drip.',
    images: [
      { src: 'drip-white', alt: 'A white buttercream cake with a dark chocolate drip on a cake stand' },
      { src: 'drip-cakes', alt: 'Two white cakes with chocolate drips on a white table' }
    ],
    price: 4000,
    sizes: [
      { label: '6 inches', price: 4000, serves: '8–10' },
      { label: '8 inches', price: 5500, serves: '14–18' }
    ],
    flavors: ['Cookies & cream', 'Vanilla & chocolate'],
    availability: 'available', lead: '2 days',
    details: [['Sponge', 'Vanilla and chocolate'], ['Filling', 'Cookie crumb buttercream'], ['Finish', 'Chocolate drip'], ['Contains', 'Gluten, dairy, eggs, soy']]
  },
  {
    id: 'ivory-garden-tiers', category: 'wedding', featured: true,
    name: 'Ivory Garden',
    short: 'Three tiers of textured buttercream with cascading greenery.',
    description: 'A three-tier wedding cake in combed ivory buttercream with a cascade of fresh flowers and greenery. Each tier can be a different flavour.',
    images: [
      { src: 'wedding-ivory', alt: 'A three-tier ivory wedding cake with cream roses and eucalyptus' },
      { src: 'wedding-sage', alt: 'A two-tier white wedding cake decorated with succulents' }
    ],
    price: 28000,
    sizes: [
      { label: 'Two tiers', price: 28000, serves: '40–50' },
      { label: 'Three tiers', price: 42000, serves: '70–90' },
      { label: 'Four tiers', price: 58000, serves: '110–130' }
    ],
    flavors: ['Vanilla & berry', 'Lemon & elderflower', 'Chocolate fudge', 'Red velvet'],
    availability: 'preorder', lead: '3 weeks',
    details: [['Includes', 'A tasting box for two, delivery and set-up'], ['Flowers', 'Fresh, food-safe, chosen with your florist'], ['Deposit', '50% to book your date'], ['Contains', 'Gluten, dairy, eggs']]
  },
  {
    id: 'rose-and-gold-tiers', category: 'wedding',
    name: 'Rose & Gold',
    short: 'Smooth white tiers with sugar roses and a touch of gold.',
    description: 'Tall, smooth tiers with handmade sugar roses, pearl piping and gold leaf details. Designed for evening receptions.',
    images: [
      { src: 'wedding-gold', alt: 'A four-tier wedding cake with sugar flowers and gold details lit by candles' },
      { src: 'wedding-rose', alt: 'A three-tier white cake with pink fresh flowers beside champagne glasses' }
    ],
    price: 34000,
    sizes: [
      { label: 'Three tiers', price: 34000, serves: '70–90' },
      { label: 'Four tiers', price: 52000, serves: '110–130' }
    ],
    flavors: ['Vanilla & raspberry', 'Pistachio & rose', 'Chocolate & salted caramel'],
    availability: 'preorder', lead: '4 weeks',
    details: [['Includes', 'Tasting, delivery and set-up'], ['Decoration', 'Sugar roses, pearl piping, edible gold leaf'], ['Deposit', '50% to book your date'], ['Contains', 'Gluten, dairy, eggs, nuts (pistachio option)']]
  },
  {
    id: 'vanilla-cupcakes', category: 'cupcakes', featured: true,
    name: 'Vanilla Bean Cupcakes',
    short: 'Tall swirls of vanilla buttercream with a golden crumb.',
    description: 'Soft vanilla bean cupcakes with a generous swirl of whipped buttercream and a sprinkle of gold sugar.',
    images: [
      { src: 'cupcakes-vanilla', alt: 'Vanilla cupcakes with swirls of buttercream in silver cases' },
      { src: 'cupcakes-vanilla-2', alt: 'Rows of vanilla cupcakes with buttercream and gold sprinkles' },
      { src: 'cupcake-single', alt: 'A single vanilla cupcake with a buttercream swirl' }
    ],
    price: 1800,
    sizes: [
      { label: 'Box of 6', price: 1800 },
      { label: 'Box of 12', price: 3300 },
      { label: 'Box of 24', price: 6200 }
    ],
    flavors: ['Vanilla bean', 'Chocolate', 'Red velvet', 'Lemon', 'Mixed box'],
    availability: 'available', lead: '1 day',
    details: [['Frosting', 'Whipped buttercream'], ['Personalise', 'Toppers and colours on request'], ['Contains', 'Gluten, dairy, eggs'], ['Keeps', '2 days in an airtight box']]
  },
  {
    id: 'pastel-cupcakes', category: 'cupcakes',
    name: 'Pastel Garden Cupcakes',
    short: 'Two-tone piped buttercream in soft spring colours.',
    description: 'Vanilla and chocolate cupcakes piped with two-tone pastel buttercream. A favourite for baby showers and birthdays.',
    images: [
      { src: 'cupcakes-pastel', alt: 'Cupcakes with two-tone pastel buttercream in a gift box' }
    ],
    price: 2000,
    sizes: [
      { label: 'Box of 6', price: 2000 },
      { label: 'Box of 12', price: 3700 }
    ],
    flavors: ['Vanilla', 'Chocolate', 'Mixed'],
    availability: 'available', lead: '2 days',
    details: [['Colours', 'Choose up to three'], ['Contains', 'Gluten, dairy, eggs']]
  },
  {
    id: 'strawberry-petit-gateau', category: 'mini',
    name: 'Strawberry Petit Gâteau',
    short: 'Individual mousse cakes with fresh strawberries.',
    description: 'Little strawberry mousse cakes on an almond sponge, glazed and topped with fresh berries. Sold in boxes for sharing.',
    images: [
      { src: 'mini-strawberry', alt: 'Three square strawberry mousse cakes topped with strawberries and blueberries' },
      { src: 'mini-fraisier', alt: 'A strawberry fraisier cake with a pink glaze and fresh strawberries' }
    ],
    price: 2400,
    sizes: [
      { label: 'Box of 4', price: 2400 },
      { label: 'Box of 8', price: 4500 }
    ],
    availability: 'available', lead: '2 days',
    details: [['Base', 'Almond sponge'], ['Contains', 'Gluten, dairy, eggs, almonds'], ['Keeps', '2 days in the fridge']]
  },
  {
    id: 'pistachio-tartlets', category: 'mini',
    name: 'Pistachio Cream Tartlets',
    short: 'Crisp sablé shells with pistachio cream and raspberry.',
    description: 'Butter sablé tart shells filled with raspberry jam and piped pistachio cream, finished with chopped pistachios.',
    images: [
      { src: 'mini-pistachio', alt: 'Small tartlets topped with piped green pistachio cream' }
    ],
    price: 2600,
    sizes: [
      { label: 'Box of 6', price: 2600 },
      { label: 'Box of 12', price: 4900 }
    ],
    availability: 'limited', lead: '2 days',
    details: [['Contains', 'Gluten, dairy, eggs, pistachio'], ['Keeps', '2 days in the fridge']]
  },
  {
    id: 'mini-chocolate-bundts', category: 'mini',
    name: 'Mini Chocolate Bundts',
    short: 'Rich little bundt cakes, perfect for gifting.',
    description: 'Dark chocolate mini bundt cakes with a crisp edge and a tender centre. Add a chocolate glaze or keep them plain.',
    images: [
      { src: 'mini-bundt', alt: 'Mini chocolate bundt cakes cooling on a wire rack' }
    ],
    price: 1600,
    sizes: [
      { label: 'Box of 6', price: 1600 },
      { label: 'Box of 12', price: 3000 }
    ],
    flavors: ['Plain', 'Chocolate glaze', 'Orange glaze'],
    availability: 'available', lead: '1 day',
    details: [['Contains', 'Gluten, dairy, eggs, soy']]
  },
  {
    id: 'macaron-gift-box', category: 'boxes', featured: true,
    name: 'Macaron Gift Box',
    short: 'A rainbow of French macarons in a keepsake box.',
    description: 'Crisp-shelled French macarons with ganache and buttercream fillings, packed in a gift box with a ribbon and a handwritten card.',
    images: [
      { src: 'box-macaron', alt: 'A box of colourful macarons on a dark background' },
      { src: 'box-macaron-pink', alt: 'A pink gift box filled with pink macarons' },
      { src: 'macaron-stack', alt: 'A stack of pastel macarons' }
    ],
    price: 2200,
    sizes: [
      { label: '12 macarons', price: 2200 },
      { label: '24 macarons', price: 4100 }
    ],
    flavors: ['Assorted', 'Raspberry', 'Pistachio', 'Salted caramel', 'Chocolate'],
    availability: 'available', lead: '2 days',
    details: [['Includes', 'Gift box, ribbon, handwritten card'], ['Contains', 'Almonds, dairy, eggs'], ['Keeps', '5 days in the fridge']]
  },
  {
    id: 'cookie-box', category: 'boxes',
    name: 'The Cookie Box',
    short: 'Six kinds of thick, chewy cookies in one box.',
    description: 'Our favourite cookies in one box: brown butter chocolate chip, double chocolate, oat and raisin, almond, white chocolate and the cookie of the month.',
    images: [
      { src: 'box-cookies', alt: 'A gift box of assorted gourmet cookies' },
      { src: 'box-cookies-2', alt: 'A box filled with chocolate and chocolate chip cookies' }
    ],
    price: 1900,
    sizes: [
      { label: 'Box of 6', price: 1900 },
      { label: 'Box of 12', price: 3500 }
    ],
    availability: 'available', lead: '1 day',
    details: [['Contains', 'Gluten, dairy, eggs, nuts'], ['Keeps', '5 days in an airtight tin']]
  },
  {
    id: 'brown-butter-cookies', category: 'pastries',
    name: 'Brown Butter Chocolate Chip',
    short: 'Crisp edges, soft middles and pools of dark chocolate.',
    description: 'Thick cookies made with browned butter, dark brown sugar and chopped dark chocolate, finished with flaky salt.',
    images: [
      { src: 'cookies-stack', alt: 'A stack of thick chocolate chip cookies on a wooden table' },
      { src: 'cookies-choc', alt: 'Chocolate chip cookies stacked on a plate' },
      { src: 'cookies-white', alt: 'A pile of chocolate chip cookies on a white surface' }
    ],
    price: 1200,
    sizes: [
      { label: '4 cookies', price: 1200 },
      { label: '8 cookies', price: 2200 }
    ],
    availability: 'available', lead: 'Same day if ordered before 10:00',
    details: [['Contains', 'Gluten, dairy, eggs, soy']]
  },
  {
    id: 'butter-croissants', category: 'pastries',
    name: 'Butter Croissants',
    short: 'Laminated over three days for a honeycomb crumb.',
    description: 'All-butter croissants, laminated by hand and baked every morning. Order plain, almond or pain au chocolat.',
    images: [
      { src: 'croissants', alt: 'Golden butter croissants on baking paper' },
      { src: 'croissants-dark', alt: 'Two croissants dusted with flour on a dark surface' },
      { src: 'pain-chocolat', alt: 'Trays of pain au chocolat in a bakery' }
    ],
    price: 900,
    sizes: [
      { label: 'Box of 4', price: 900 },
      { label: 'Box of 8', price: 1700 }
    ],
    flavors: ['Plain butter', 'Almond', 'Pain au chocolat', 'Mixed'],
    availability: 'available', lead: '1 day',
    details: [['Baked', 'Every morning'], ['Contains', 'Gluten, dairy, eggs (almond option: nuts)']]
  },
  {
    id: 'summer-berry-tart', category: 'seasonal', featured: true,
    name: 'Summer Berry Tart',
    short: 'Vanilla custard and a crown of fresh berries.',
    description: 'A crisp sweet pastry case filled with vanilla crème pâtissière and piled with strawberries, blueberries and raspberries. Available while the berries are at their best.',
    images: [
      { src: 'berry-tart', alt: 'A berry tart topped with strawberries, blueberries and blackberries' },
      { src: 'berry-tarts', alt: 'Two fruit tarts with strawberries and blueberries on a wooden table' },
      { src: 'tartlets', alt: 'Rows of fruit tartlets seen from above' }
    ],
    price: 3200,
    sizes: [
      { label: '8 inch tart', price: 3200, serves: '8' },
      { label: 'Box of 6 tartlets', price: 2400 }
    ],
    availability: 'limited', lead: '2 days',
    details: [['Season', 'While berries last'], ['Contains', 'Gluten, dairy, eggs']]
  },
  {
    id: 'pistachio-rose-cheesecake', category: 'seasonal',
    name: 'Pistachio Rose Cheesecake',
    short: 'Baked pistachio cheesecake with rose petals.',
    description: 'A creamy baked cheesecake with pistachio paste on a buttery crumb base, finished with chopped pistachios and dried rose petals.',
    images: [
      { src: 'pistachio-cheesecake', alt: 'A pistachio cheesecake decorated with rose petals and chopped pistachios' }
    ],
    price: 4400,
    sizes: [
      { label: '7 inches', price: 4400, serves: '10–12' },
      { label: '9 inches', price: 6200, serves: '16–18' }
    ],
    availability: 'preorder', lead: '3 days',
    details: [['Contains', 'Gluten, dairy, eggs, pistachio'], ['Keeps', '4 days in the fridge']]
  },
  {
    id: 'lemon-tart', category: 'seasonal',
    name: 'Sunlit Lemon Tart',
    short: 'Sharp lemon curd in a crisp sablé shell.',
    description: 'A bright, silky lemon curd tart topped with fresh fruit. Sharp, clean and the perfect end to a long lunch.',
    images: [
      { src: 'lemon-tart', alt: 'A lemon tart topped with lemon slices, strawberries and berries' }
    ],
    price: 2900,
    sizes: [
      { label: '8 inch tart', price: 2900, serves: '8' }
    ],
    availability: 'soldout', lead: '2 days',
    details: [['Contains', 'Gluten, dairy, eggs']]
  }
];
