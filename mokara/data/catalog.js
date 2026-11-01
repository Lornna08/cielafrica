/* ==========================================================================
   MOKARA — catalogue: coffees, origins, bean-to-cup story and brew guides.
   Product renders in img/p/ are original 3D packshots made for this template.
   Editorial photos are Unsplash images, shown from images.unsplash.com and
   credited on /mokara/credits. Replace both with your own before launch.
   Ratings and reviews are sample data for the template, not real customers.
   ========================================================================== */
window.MOKARA = window.MOKARA || {};

/* Unsplash photos: [path, width, height, photographer, username] */
MOKARA.photos = {
  ethiopia: ['photo-1658823235938-c424fa0875d6', 3840, 2160, 'Temesgen Negussie', 'temureact'],
  kenya: ['photo-1535756736290-ec9480a7eaf0', 6016, 3908, 'David Clode', 'davidclode'],
  colombia: ['photo-1789009413779-99c4a0ddaedf', 4496, 3000, 'Cereza', 'cherrycomplexes'],
  brazil: ['photo-1671413945540-eaca7f4257f3', 5616, 3744, 'Projeto Café Gato-Mourisco', 'projetocafegatomourisco'],
  guatemala: ['photo-1517260106897-16d7fddc278a', 6000, 4000, 'Arturo Rivera', 'arivera2015'],
  rwanda: ['photo-1647891684895-15c5b831fde1', 5981, 4000, 'Ifeoluwa B.', 'ife_'],
  cultivate: ['photo-1788276363151-9edbb8129d0d', 3582, 2388, 'Sara Hobbs', 'saranhobbs'],
  harvest: ['photo-1662559102063-a665b04771fd', 7360, 4912, 'Carlos Felipe Ramírez Mesa', 'cafera13'],
  process: ['photo-1649616551649-06bbf4d11354', 5865, 3910, 'Dimitry B', 'dimitry_b'],
  roast: ['photo-1680381615265-6cce996f6e4f', 2615, 3269, 'Scott Soltys-Curry', 'heyscottcurry'],
  grind: ['photo-1537130508299-46ab547b4be3', 5243, 3495, 'Gregory Hayes', 'gregoryallen'],
  brew: ['photo-1729277133095-bff46b56c29a', 2774, 4161, 'Beau Carpenter', 'btcarpenter'],
  espresso: ['photo-1616388761741-a5936c6f61f6', 5083, 7624, 'Mohamed Shaffaf', 'shaffuscanvas'],
  pourover: ['photo-1650940925927-f4a30c930a4d', 5337, 3652, 'Paul Esch-Laurent', 'pinjasaur'],
  press: ['photo-1639906512494-dd4a536abc4e', 6000, 4000, 'Sorin Gheorghita', 'sxtcxtc'],
  aeropress: ['photo-1666779314089-ab7bd0b66cf8', 4350, 6521, 'cafeconcetto', 'cafeconcetto'],
  coldbrew: ['photo-1561641377-f7456d23aa9b', 2559, 2047, 'Wade Austin Ellis', 'wadeaustinellis'],
  hands: ['photo-1493925410384-84f842e616fb', 3412, 4263, 'Pablo Merchán Montes', 'pablomerchanm'],
  machine: ['photo-1583165278997-0250ea5d72e2', 4480, 6720, 'Nathan Dumlao', 'nate_dumlao']
};

MOKARA.products = [
  {
    id: 'ethiopia-yirgacheffe', no: '01', name: 'Yirgacheffe', title: 'Ethiopia Yirgacheffe', line: ['Ethiopia', 'Yirgacheffe'],
    country: 'Ethiopia', region: 'Yirgacheffe, Gedeo Zone', origin: 'ethiopia',
    roast: 'Light roast', roastLevel: 1, process: 'Washed', varietal: 'Ethiopian heirloom', altitude: '1,900–2,200 m', harvest: 'November – January',
    producer: 'Smallholder farmers delivering to a community washing station',
    notes: ['Bergamot', 'Jasmine', 'Citrus', 'Honey'], flavours: ['floral', 'fruity'], methods: ['filter', 'pourover', 'aeropress'],
    profile: { acidity: 5, body: 2, sweetness: 4 },
    price: 1950, rating: 4.8,
    short: 'Tea-like and fragrant: jasmine on the nose, bergamot and lemon on the palate, and a long honey finish.',
    story: 'Yirgacheffe is where many people first realise coffee can taste of flowers. Cherries from hundreds of small garden plots are pulped, fermented and washed the same day, then dried on raised beds. We roast this lot light to keep its jasmine and citrus clear and bright.',
    bg: '#E9D9C3', accent: '#A8712B', ink: '#2B1B16', side: 'left',
    reviews: [
      { n: 'Wanjiru K.', r: 5, t: 'Like a cup of Earl Grey that turned into coffee. Beautiful as a pour-over.' },
      { n: 'Daniel O.', r: 5, t: 'Very floral and clean. Best a few days after the roast date.' },
      { n: 'Amina S.', r: 4, t: 'Lovely and light — a little too bright for me as espresso, perfect as filter.' }
    ]
  },
  {
    id: 'kenya-aa', no: '02', name: 'Kenya AA', title: 'Kenya AA', line: ['Kenya', 'AA'],
    country: 'Kenya', region: 'Nyeri, central highlands', origin: 'kenya',
    roast: 'Light–medium roast', roastLevel: 2, process: 'Washed', varietal: 'SL28 & SL34', altitude: '1,700–1,900 m', harvest: 'October – December',
    producer: 'Members of a cooperative society on the slopes of Mt Kenya',
    notes: ['Blackcurrant', 'Blackberry', 'Grapefruit', 'Brown sugar'], flavours: ['fruity'], methods: ['filter', 'pourover', 'aeropress', 'press'],
    profile: { acidity: 5, body: 3, sweetness: 4 },
    price: 2150, rating: 4.9,
    short: 'Juicy and bold: blackcurrant and ripe berries with a sparkling, grapefruit-bright acidity.',
    story: 'AA is the largest screen size in Kenya’s grading system — dense beans grown slowly on the red volcanic soils around Mt Kenya. Washed and soaked twice, this coffee is famous for its blackcurrant intensity. We take it just past light so the berries stay vivid and the body rounds out.',
    bg: '#DCC5C6', accent: '#8E2F45', ink: '#2B1B16', side: 'right',
    reviews: [
      { n: 'Brian M.', r: 5, t: 'Proper Kenyan blackcurrant. Wakes you up before the caffeine does.' },
      { n: 'Lucy N.', r: 5, t: 'Bright, juicy and sweet. My go-to for the AeroPress.' },
      { n: 'Peter G.', r: 4, t: 'Great coffee; needs a slightly finer grind than I expected.' }
    ]
  },
  {
    id: 'colombia-supremo', no: '03', name: 'Supremo', title: 'Colombia Supremo', line: ['Colombia', 'Supremo'],
    country: 'Colombia', region: 'Huila', origin: 'colombia',
    roast: 'Medium roast', roastLevel: 3, process: 'Washed', varietal: 'Caturra & Castillo', altitude: '1,500–1,900 m', harvest: 'April – June & October – December',
    producer: 'Family farms in the valleys of southern Huila',
    notes: ['Caramel', 'Milk chocolate', 'Red apple', 'Cherry'], flavours: ['chocolatey', 'fruity'], methods: ['espresso', 'filter', 'press', 'aeropress', 'pourover'],
    profile: { acidity: 3, body: 4, sweetness: 5 },
    price: 1850, rating: 4.7,
    short: 'Round and generous: caramel and milk chocolate with a red-fruit lift. Easy to love, any way you brew.',
    story: 'Huila’s mountains give two harvests a year, so this coffee is always fresh from the farm. Supremo is the top screen size, roasted to medium to bring caramel sweetness forward while keeping a gentle red-apple brightness. It is the coffee we drink when we can’t decide.',
    bg: '#E3C9AB', accent: '#9A5A2A', ink: '#2B1B16', side: 'left',
    reviews: [
      { n: 'Faith W.', r: 5, t: 'Sweet and balanced. Works with milk and black.' },
      { n: 'Kevin A.', r: 4, t: 'Smooth caramel cup in the French press.' },
      { n: 'Grace L.', r: 5, t: 'The one I reorder every month.' }
    ]
  },
  {
    id: 'brazil-santos', no: '04', name: 'Santos', title: 'Brazil Santos', line: ['Brazil', 'Santos'],
    country: 'Brazil', region: 'Sul de Minas', origin: 'brazil',
    roast: 'Medium–dark roast', roastLevel: 4, process: 'Natural', varietal: 'Yellow Bourbon & Mundo Novo', altitude: '1,000–1,300 m', harvest: 'May – September',
    producer: 'Estates in the rolling hills of southern Minas Gerais',
    notes: ['Hazelnut', 'Milk chocolate', 'Brown sugar', 'Almond'], flavours: ['nutty', 'chocolatey'], methods: ['espresso', 'press', 'moka'],
    profile: { acidity: 1, body: 5, sweetness: 4 },
    price: 1650, rating: 4.6,
    short: 'Comforting and low in acidity: roasted hazelnut and milk chocolate with a heavy, velvety body.',
    story: 'Named after the port it once sailed from, a Santos coffee is all about comfort. Cherries dry whole in the sun on wide patios, which gives this natural lot its nutty sweetness and full body. A medium–dark roast makes it rich in milk and gentle on the stomach.',
    bg: '#D8D3C0', accent: '#5E6650', ink: '#2B1B16', side: 'right',
    reviews: [
      { n: 'Joseph K.', r: 5, t: 'Chocolatey and smooth with no sourness. Perfect flat whites.' },
      { n: 'Mercy A.', r: 4, t: 'Nutty, heavy and easy. Great in the moka pot.' },
      { n: 'Samuel T.', r: 5, t: 'My partner who “doesn’t like specialty coffee” loves this one.' }
    ]
  },
  {
    id: 'guatemala-antigua', no: '05', name: 'Antigua', title: 'Guatemala Antigua', line: ['Guatemala', 'Antigua'],
    country: 'Guatemala', region: 'Antigua Valley, Sacatepéquez', origin: 'guatemala',
    roast: 'Medium roast', roastLevel: 3, process: 'Washed', varietal: 'Bourbon & Caturra', altitude: '1,500–1,700 m', harvest: 'December – March',
    producer: 'Shade-grown farms between three volcanoes',
    notes: ['Cocoa', 'Cinnamon', 'Clove', 'Brown sugar'], flavours: ['chocolatey', 'spicy'], methods: ['espresso', 'filter', 'press', 'pourover'],
    profile: { acidity: 3, body: 4, sweetness: 4 },
    price: 1950, rating: 4.8,
    short: 'Warm and layered: dark cocoa, a whisper of cinnamon and clove, and a balanced brown-sugar sweetness.',
    story: 'The Antigua valley sits between the Agua, Fuego and Acatenango volcanoes. Mineral-rich soil, cool nights and shade trees slow the cherries down, giving dense beans with cocoa depth and a gentle spice. A medium roast keeps the spice lifted and the finish clean.',
    bg: '#DCC0A9', accent: '#8A4A28', ink: '#2B1B16', side: 'left',
    reviews: [
      { n: 'Esther M.', r: 5, t: 'Cocoa and a little spice — like a cup of Christmas.' },
      { n: 'Collins O.', r: 5, t: 'Very balanced espresso, lovely crema.' },
      { n: 'Ruth J.', r: 4, t: 'Rich and smooth as a pour-over.' }
    ]
  },
  {
    id: 'espresso-house-blend', no: '06', name: 'House Espresso', title: 'House Espresso Blend', line: ['House', 'Espresso'],
    country: 'Brazil · Colombia · Ethiopia', region: 'Our year-round blend', origin: null, blend: true,
    roast: 'Dark roast', roastLevel: 5, process: 'Natural & washed', varietal: 'Bourbon, Caturra & heirloom', altitude: '1,100–2,000 m', harvest: 'Rotates with the seasons',
    producer: 'A blend of three of our single origins',
    notes: ['Dark chocolate', 'Toffee', 'Caramel', 'Roasted almond'], flavours: ['chocolatey', 'nutty'], methods: ['espresso', 'moka', 'press'],
    profile: { acidity: 1, body: 5, sweetness: 5 },
    price: 1750, rating: 4.9, pack: 'tin',
    short: 'Bold and syrupy: dark chocolate and toffee with a long caramel finish and thick, lasting crema.',
    story: 'Our House Espresso is built for milk and for the moka pot. Brazil gives the body, Colombia the caramel, and a little Ethiopia lifts the aroma. Each origin is roasted separately, blended, then rested for five days before it ships so it pulls a thick, steady crema.',
    bg: '#2B1B16', accent: '#C9A063', ink: '#F4EBDD', dark: true, side: 'right',
    reviews: [
      { n: 'Nicholas W.', r: 5, t: 'Thick crema and a proper chocolate hit. Cuts through milk beautifully.' },
      { n: 'Janet K.', r: 5, t: 'Dialled in on the first try. Consistent bag after bag.' },
      { n: 'Ali H.', r: 5, t: 'Toffee all the way. The best blend I have had locally.' }
    ]
  }
];

MOKARA.origins = [
  { id: 'ethiopia', name: 'Ethiopia', region: 'Yirgacheffe', altitude: '1,900–2,200 m', taste: 'Floral, citrus, tea-like', text: 'The birthplace of coffee. Heirloom varieties grown in garden plots give some of the most aromatic cups in the world.' },
  { id: 'kenya', name: 'Kenya', region: 'Nyeri', altitude: '1,700–1,900 m', taste: 'Blackcurrant, berries, bright', text: 'Volcanic soils, cool highland nights and meticulous washing produce coffees with unmistakable juicy intensity.' },
  { id: 'colombia', name: 'Colombia', region: 'Huila', altitude: '1,500–1,900 m', taste: 'Caramel, chocolate, red fruit', text: 'Steep Andean valleys and two harvests a year. Sweet, balanced coffees that shine any way you brew them.' },
  { id: 'brazil', name: 'Brazil', region: 'Sul de Minas', altitude: '1,000–1,300 m', taste: 'Nutty, chocolate, low acidity', text: 'Rolling hills and sun-dried naturals. The comforting, full-bodied heart of countless espresso blends.' },
  { id: 'guatemala', name: 'Guatemala', region: 'Antigua', altitude: '1,500–1,700 m', taste: 'Cocoa, spice, brown sugar', text: 'Shade-grown between volcanoes, where mineral soils and cool nights build cocoa depth and gentle spice.' },
  { id: 'rwanda', name: 'Rwanda', region: 'Lake Kivu', altitude: '1,500–2,000 m', taste: 'Red fruit, black tea, floral', text: 'A land of a thousand hills. Washed Bourbons with delicate red fruit — a seasonal lot we roast when it arrives.' }
];

MOKARA.steps = [
  { id: 'cultivate', n: '01', title: 'Cultivation', text: 'Coffee grows best in the shade at altitude, where cool nights let cherries ripen slowly and build sugar.' },
  { id: 'harvest', n: '02', title: 'Harvesting', text: 'Ripe red cherries are picked by hand, often over several passes, so only the sweetest fruit goes forward.' },
  { id: 'process', n: '03', title: 'Processing', text: 'Washed, natural or honey: how the fruit is removed and the seeds dried shapes clarity, body and sweetness.' },
  { id: 'roast', n: '04', title: 'Roasting', text: 'We roast in small batches to a profile written for each coffee, then cool quickly to lock in aroma.' },
  { id: 'grind', n: '05', title: 'Grinding', text: 'Grind just before brewing. Finer for espresso, coarser for the French press — size controls extraction.' },
  { id: 'brew', n: '06', title: 'Brewing', text: 'Good water, the right ratio and a steady pour. A few minutes of care turns seeds into something extraordinary.' }
];

MOKARA.methods = [
  { id: 'espresso', name: 'Espresso', time: '25–30 s', dose: '18 g', water: '36 g out', ratio: '1 : 2', grind: 'Fine', temp: '93 °C',
    steps: ['Dose 18 g of finely ground coffee into the basket and level it.', 'Tamp firmly and evenly, then lock in the portafilter.', 'Pull 36 g of espresso in 25–30 seconds.', 'Taste: sour means grind finer, bitter means grind coarser.'] },
  { id: 'pourover', name: 'Pour-over', time: '3 min', dose: '15 g', water: '250 g', ratio: '1 : 16', grind: 'Medium', temp: '94 °C',
    steps: ['Rinse the paper filter with hot water and discard it.', 'Add 15 g of coffee and bloom with 40 g of water for 40 seconds.', 'Pour slowly in circles to 250 g by 2 minutes.', 'Let it drain; aim to finish around 3 minutes.'] },
  { id: 'press', name: 'French press', time: '4 min', dose: '30 g', water: '500 g', ratio: '1 : 16', grind: 'Coarse', temp: '95 °C',
    steps: ['Add 30 g of coarsely ground coffee to the press.', 'Pour 500 g of hot water and stir gently.', 'Put the lid on and steep for 4 minutes.', 'Skim the crust, press slowly and pour straight away.'] },
  { id: 'aeropress', name: 'AeroPress', time: '2 min', dose: '15 g', water: '220 g', ratio: '1 : 15', grind: 'Medium–fine', temp: '90 °C',
    steps: ['Rinse the filter in the cap and assemble inverted.', 'Add 15 g of coffee and 220 g of water, then stir 10 times.', 'Steep for 1 minute 30 seconds.', 'Flip onto your cup and press gently for 30 seconds.'] },
  { id: 'coldbrew', name: 'Cold brew', time: '16 h', dose: '100 g', water: '1 L', ratio: '1 : 10', grind: 'Coarse', temp: 'Cold',
    steps: ['Combine 100 g of coarsely ground coffee with 1 litre of cold water.', 'Stir, cover and leave in the fridge for 14–18 hours.', 'Strain through a paper filter.', 'Serve over ice, diluted 1 : 1 with water or milk.'] }
];
MOKARA.methodBest = { espresso: ['espresso', 'moka'], pourover: ['pourover', 'filter'], press: ['press'], aeropress: ['aeropress', 'filter'], coldbrew: ['press', 'filter'] };
