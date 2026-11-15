/* ==========================================================================
   EMBER & PLATE — the menu
   SAMPLE MENU. Every dish, description and price below is placeholder content
   for the template. Replace it with the restaurant's own menu.

   Categories: rename, reorder, add or remove them freely. Items point at a
   category by its id. A category with no items is not shown.

   Item fields
     id           unique, lowercase, no spaces
     name, category, description
     price        base price (number). Leave out when sizes set their own prices.
     sizes        [{ label, price }]  — the first is preselected
     options      [{ name, type: 'one' | 'many', required, choices: [{ label, price }] }]
     ingredients  ['...']
     dietary      keys from EP.dietary below
     available    true | false | 'limited'   (false shows "Not available today")
     note         short line shown under the price, e.g. 'Serves two'
     signature    true marks it as a house signature
     group        optional sub-heading inside a category, e.g. 'Cocktails' or 'Coffee & tea'
     orderable    false keeps it on the menu but out of online ordering (e.g. alcohol, dine-in only)
     image        optional: file name in img/p (without -800.webp), alt, optional pos (CSS object-position).
                  Dishes without a photo still look right on the menu and in ordering.
   ========================================================================== */
window.EP = window.EP || {};

EP.dietary = {
  v:     { label: 'Vegetarian', short: 'V' },
  vg:    { label: 'Vegan', short: 'VG' },
  gf:    { label: 'Gluten-free', short: 'GF' },
  df:    { label: 'Dairy-free', short: 'DF' },
  spicy: { label: 'Spicy', short: 'Hot' },
  nuts:  { label: 'Contains nuts', short: 'N' },
  alc:   { label: 'Contains alcohol', short: 'ALC' }
};

EP.categories = [
  { id: 'specials', label: "Chef's specials", blurb: 'What the kitchen is most excited about this week.', feature: true },
  { id: 'starters', label: 'Starters', blurb: 'Small plates to open the table.' },
  { id: 'grills', label: 'Signature grills', blurb: 'Skewers, ribs and birds over hardwood.' },
  { id: 'steaks', label: 'Steaks', blurb: 'Aged on the bone, seared hard, rested well.' },
  { id: 'burgers', label: 'Burgers', blurb: 'Ground in house every morning.' },
  { id: 'seafood', label: 'Seafood', blurb: 'From the coast to the coals.' },
  { id: 'pasta', label: 'Pasta', blurb: 'Rolled, cut and sauced to order.' },
  { id: 'sides', label: 'Sides', blurb: 'For the middle of the table.' },
  { id: 'desserts', label: 'Desserts', blurb: 'One more course. Always.' },
  { id: 'drinks', label: 'Drinks', blurb: 'Bar classics and house coolers.' }
];

/* The category the order-online catalogue opens on (an id from the list above). Empty = the first one. */
EP.orderStart = 'grills';

var DONENESS = { name: 'How would you like it cooked?', type: 'one', required: true, choices: [
  { label: 'Rare' }, { label: 'Medium rare' }, { label: 'Medium' }, { label: 'Medium well' }, { label: 'Well done' }] };
var STEAK_SAUCE = { name: 'Sauce', type: 'one', required: false, choices: [
  { label: 'Peppercorn', price: 250 }, { label: 'Chimichurri', price: 250 }, { label: 'Bone-marrow butter', price: 350 }, { label: 'Red wine jus', price: 300 }] };
var STEAK_SIDES = { name: 'Add a side', type: 'many', required: false, choices: [
  { label: 'Hand-cut fries', price: 450 }, { label: 'Charred corn', price: 550 }, { label: 'Grilled asparagus', price: 650 }] };

EP.menu = [
  /* ---- Chef's specials ---- */
  { id: 'fillet-jus', category: 'specials', name: 'Beef fillet, red wine jus', price: 4200, signature: true,
    description: 'Centre-cut fillet roasted over embers, finished at the table with a glossy red wine jus, pommes fondant and spring greens.',
    ingredients: ['Beef fillet', 'Red wine jus', 'Pommes fondant', 'Spring greens', 'Thyme butter'],
    options: [DONENESS], dietary: ['gf'], available: true,
    image: { src: 'jus-pour', alt: 'Jus being spooned over a plated beef fillet with a potato fondant.', pos: '50% 60%' } },
  { id: 'lamb-shank', category: 'specials', name: 'Slow-braised lamb shank', price: 2900, available: 'limited', note: 'Limited each evening',
    description: 'Braised for eight hours in red wine and rosemary until it falls from the bone, on creamed potato with roasted roots.',
    ingredients: ['Lamb shank', 'Red wine', 'Rosemary', 'Creamed potato', 'Roasted roots'], dietary: ['gf'],
    image: { src: 'lamb-shank', alt: 'A braised lamb shank in a dark bowl with vegetables.', pos: '50% 55%' } },

  /* ---- Starters ---- */
  { id: 'pumpkin-soup', category: 'starters', name: 'Roasted pumpkin soup', price: 850,
    description: 'Fire-roasted pumpkin, coconut cream and chilli, finished with spring onion and toasted coconut.',
    ingredients: ['Pumpkin', 'Coconut cream', 'Chilli', 'Spring onion', 'Toasted coconut'], dietary: ['vg', 'gf', 'df'], available: true,
    image: { src: 'soup', alt: 'A bowl of orange pumpkin soup topped with spring onion and chilli.', pos: '50% 45%' } },
  { id: 'bruschetta', category: 'starters', name: 'Tomato bruschetta', price: 750,
    description: 'Grilled sourdough rubbed with garlic, heaped with marinated tomatoes, basil and good olive oil.',
    ingredients: ['Sourdough', 'Tomatoes', 'Garlic', 'Basil', 'Olive oil'], dietary: ['v', 'df'], available: true,
    image: { src: 'bruschetta', alt: 'Bruschetta topped with chopped tomatoes on a wooden board.', pos: '50% 60%' } },
  { id: 'garlic-flatbread', category: 'starters', name: 'Charred garlic flatbread', price: 650,
    description: 'Blistered in the wood oven, brushed with garlic butter and sea salt.',
    sizes: [{ label: 'To share', price: 650 }, { label: 'For the table', price: 1100 }],
    ingredients: ['Flatbread', 'Garlic butter', 'Sea salt', 'Parsley'], dietary: ['v'], available: true,
    image: { src: 'flatbread', alt: 'A charred flatbread on a dark surface.', pos: '45% 50%' } },

  /* ---- Signature grills ---- */
  { id: 'chicken-skewers', category: 'grills', name: 'Ember chicken skewers', price: 1350, signature: true,
    description: 'Thigh meat marinated overnight in lemon, garlic and smoked paprika, grilled until the edges catch.',
    sizes: [{ label: 'Three skewers', price: 1350 }, { label: 'Five skewers', price: 2050 }],
    options: [{ name: 'Dip', type: 'one', required: false, choices: [{ label: 'Garlic toum' }, { label: 'Green chilli' }, { label: 'Smoked yoghurt' }] }],
    ingredients: ['Chicken thigh', 'Lemon', 'Garlic', 'Smoked paprika'], dietary: ['gf', 'df'], available: true,
    image: { src: 'skewers-chicken', alt: 'Chicken skewers grilling over glowing coals.', pos: '50% 60%' } },
  { id: 'beef-skewers', category: 'grills', name: 'Spiced beef skewers', price: 1550,
    description: 'Hand-cut beef in a dry rub of roasted spices and chilli, charred hard over the coals.',
    sizes: [{ label: 'Three skewers', price: 1550 }, { label: 'Five skewers', price: 2400 }],
    ingredients: ['Beef', 'Roasted spice rub', 'Chilli', 'Onion'], dietary: ['gf', 'df', 'spicy'], available: true,
    image: { src: 'skewers-beef', alt: 'Beef skewers on metal rods over a grill.', pos: '50% 55%' } },
  { id: 'lamb-rack', category: 'grills', name: 'Herb-crusted lamb rack', price: 3400,
    description: 'French-trimmed rack with a crust of mustard and soft herbs, roasted pink and served with charred vegetables.',
    ingredients: ['Lamb rack', 'Mustard', 'Parsley', 'Mint', 'Charred vegetables'], options: [DONENESS], dietary: ['gf'], available: true,
    image: { src: 'lamb-rack', alt: 'A rack of lamb, carved to show a pink centre, on a patterned plate.', pos: '40% 50%' } },
  { id: 'short-ribs', category: 'grills', name: 'Sticky glazed short ribs', price: 2600,
    description: 'Twelve-hour beef short ribs, lacquered over the fire in a tamarind and molasses glaze.',
    ingredients: ['Beef short rib', 'Tamarind', 'Molasses', 'Rosemary'], dietary: ['gf', 'df'], available: true,
    image: { src: 'short-ribs', alt: 'Glazed ribs piled on a plate with a sprig of herbs.', pos: '50% 45%' } },
  { id: 'half-chicken', category: 'grills', name: 'Flame-grilled chicken', price: 1800,
    description: 'Free-range chicken spatchcocked and grilled with lemon and herbs, with a fresh garden salad.',
    sizes: [{ label: 'Quarter', price: 1100 }, { label: 'Half', price: 1800 }, { label: 'Whole, to share', price: 3300 }],
    options: [{ name: 'Basting', type: 'one', required: true, choices: [{ label: 'Lemon and herb' }, { label: 'Hot pepper' }, { label: 'Garlic and thyme' }] }],
    ingredients: ['Chicken', 'Lemon', 'Herbs', 'Garden salad'], dietary: ['gf', 'df'], available: true,
    image: { src: 'chicken', alt: 'Grilled chicken pieces on a plate with peas and tomatoes.', pos: '50% 50%' } },
  { id: 'grill-flatbread', category: 'grills', name: 'Grill flatbread, sliced beef', price: 1500,
    description: 'Sliced grilled beef, peppers and onions on warm flatbread with herb yoghurt.',
    ingredients: ['Beef', 'Flatbread', 'Peppers', 'Onions', 'Herb yoghurt'], dietary: [], available: true,
    image: { src: 'grill-flatbread', alt: 'Grilled beef and vegetables on a flatbread, seen from above.', pos: '50% 50%' } },

  /* ---- Steaks ---- */
  { id: 'tomahawk', category: 'steaks', name: 'Tomahawk for two', price: 7800, signature: true, note: 'Serves two · carved at the table',
    description: 'A long-bone ribeye dry-aged for 28 days, seared over hardwood and rested before carving. With fries and two sauces.',
    sizes: [{ label: 'About 1.0 kg', price: 7800 }, { label: 'About 1.3 kg', price: 9600 }],
    options: [DONENESS, STEAK_SAUCE, STEAK_SIDES],
    ingredients: ['Dry-aged ribeye on the bone', 'Rosemary', 'Sea salt', 'Hand-cut fries'], dietary: ['gf'], available: true,
    image: { src: 'tomahawk', alt: 'A grilled tomahawk steak in a cast iron pan with sweet potato fries and rosemary.', pos: '55% 50%' } },
  { id: 'ribeye', category: 'steaks', name: 'Sliced ribeye', price: 3900,
    description: '400 g ribeye, sliced to share, with a skewer of grilled vegetables and peppercorn sauce.',
    sizes: [{ label: '300 g', price: 3100 }, { label: '400 g', price: 3900 }],
    options: [DONENESS, STEAK_SAUCE, STEAK_SIDES],
    ingredients: ['Ribeye', 'Grilled vegetables', 'Peppercorn sauce'], dietary: ['gf'], available: true,
    image: { src: 'ribeye-pan', alt: 'Sliced ribeye in a black pan with a vegetable skewer and peppercorn sauce.', pos: '50% 45%' } },
  { id: 'sirloin', category: 'steaks', name: 'Sirloin on the board', price: 3200,
    description: 'Sirloin carved on a walnut board with grilled lemon, flaky salt and a pile of fresh herbs.',
    options: [DONENESS, STEAK_SAUCE, STEAK_SIDES],
    ingredients: ['Sirloin', 'Grilled lemon', 'Flaky salt', 'Parsley'], dietary: ['gf', 'df'], available: true,
    image: { src: 'board', alt: 'Sliced steak on a wooden board with grilled lemon, tomatoes and parsley.', pos: '62% 50%' } },
  { id: 'steak-frites', category: 'steaks', name: 'Steak frites', price: 2900,
    description: 'Flat-iron steak under a green herb butter, with a stack of skinny fries.',
    options: [DONENESS],
    ingredients: ['Flat-iron steak', 'Herb butter', 'Fries'], dietary: ['gf'], available: false,
    image: { src: 'steak-frites', alt: 'Sliced steak with herb butter and fries on a plate in a restaurant.', pos: '45% 55%' } },

  /* ---- Burgers ---- */
  { id: 'ember-double', category: 'burgers', name: 'The Ember double', price: 1450, signature: true,
    description: 'Two smashed patties, aged cheddar, charred onions and smoky house sauce in a toasted brioche bun.',
    options: [{ name: 'Extras', type: 'many', required: false, choices: [{ label: 'Extra patty', price: 400 }, { label: 'Smoked bacon', price: 250 }, { label: 'Fried egg', price: 150 }] },
              { name: 'On the side', type: 'one', required: false, choices: [{ label: 'Fries', price: 0 }, { label: 'Side salad', price: 0 }] }],
    ingredients: ['Beef patties', 'Cheddar', 'Charred onions', 'House sauce', 'Brioche'], dietary: [], available: true,
    image: { src: 'burger', alt: 'A burger with melted cheese on a dark board.', pos: '48% 55%' } },
  { id: 'smash-fries', category: 'burgers', name: 'Smash burger and fries', price: 1300,
    description: 'A single smashed patty on a seeded bun with lettuce, tomato and pickles, with fries.',
    ingredients: ['Beef patty', 'Seeded bun', 'Lettuce', 'Tomato', 'Pickles', 'Fries'], dietary: [], available: true,
    image: { src: 'burger-fries', alt: 'A burger and fries on a slate board.', pos: '45% 55%' } },
  { id: 'house-burger', category: 'burgers', name: 'Classic house burger', price: 1150,
    description: 'Grilled patty, tomato, lettuce, red onion and mayonnaise on a sesame bun.',
    ingredients: ['Beef patty', 'Tomato', 'Lettuce', 'Red onion', 'Sesame bun'], dietary: [], available: true,
    image: { src: 'burger-classic', alt: 'A classic burger on a wooden board.', pos: '50% 45%' } },

  /* ---- Seafood ---- */
  { id: 'king-prawn', category: 'seafood', name: 'Charred king prawns', price: 2800, signature: true,
    description: 'Whole king prawns split and grilled in their shells with garlic, chilli and lime butter.',
    sizes: [{ label: 'Four prawns', price: 2800 }, { label: 'Six prawns', price: 3900 }],
    ingredients: ['King prawns', 'Garlic', 'Chilli', 'Lime butter'], dietary: ['gf', 'spicy'], available: 'limited', note: 'Market supply varies',
    image: { src: 'prawn', alt: 'A grilled king prawn glistening on a dark plate.', pos: '50% 45%' } },
  { id: 'garlic-prawns', category: 'seafood', name: 'Garlic butter prawns', price: 2200,
    description: 'Prawns sizzled in a cast iron pan with garlic, butter and cherry tomatoes. Bread for the juices.',
    ingredients: ['Prawns', 'Garlic', 'Butter', 'Cherry tomatoes', 'Bread'], dietary: [], available: true,
    image: { src: 'prawns-pan', alt: 'Prawns in a dark pan with tomatoes.', pos: '50% 60%' } },

  /* ---- Pasta ---- */
  { id: 'ragu', category: 'pasta', name: 'Slow beef ragù', price: 1600,
    description: 'Spaghetti in a ragù of beef braised with tomato and red wine, finished with parmesan.',
    ingredients: ['Spaghetti', 'Braised beef', 'Tomato', 'Red wine', 'Parmesan'], dietary: [], available: true,
    image: { src: 'pasta-twirl', alt: 'Spaghetti being lifted on a fork above a plate of pasta.', pos: '50% 40%' } },
  { id: 'pomodoro', category: 'pasta', name: 'Spaghetti pomodoro', price: 1200,
    description: 'Slow-cooked tomatoes, garlic, basil and olive oil. Simple, and done properly.',
    ingredients: ['Spaghetti', 'Tomatoes', 'Garlic', 'Basil', 'Olive oil'], dietary: ['v'], available: true,
    options: [{ name: 'Add', type: 'many', required: false, choices: [{ label: 'Burrata', price: 600 }, { label: 'Grilled prawns', price: 900 }] }],
    image: { src: 'pasta-fork', alt: 'Spaghetti with tomato sauce twirled on a fork.', pos: '50% 35%' } },
  { id: 'braised-spaghetti', category: 'pasta', name: 'Spaghetti, braised beef and pecorino', price: 1700,
    description: 'Shredded short rib folded through spaghetti with black pepper and plenty of pecorino.',
    ingredients: ['Spaghetti', 'Short rib', 'Pecorino', 'Black pepper'], dietary: [], available: true,
    image: { src: 'pasta-bowl', alt: 'A bowl of spaghetti topped with braised beef and cheese on a dark table.', pos: '50% 45%' } },

  /* ---- Sides ---- */
  { id: 'fries', category: 'sides', name: 'Hand-cut fries', price: 450,
    description: 'Twice-cooked and salted while hot.', ingredients: ['Potatoes', 'Sea salt'], dietary: ['vg', 'gf', 'df'], available: true,
    options: [{ name: 'Seasoning', type: 'one', required: false, choices: [{ label: 'Sea salt' }, { label: 'Rosemary salt' }, { label: 'Parmesan and truffle', price: 250 }] }],
    image: { src: 'fries', alt: 'Fries in a wire basket.', pos: '50% 50%' } },
  { id: 'charred-corn', category: 'sides', name: 'Charred corn and garden vegetables', price: 550,
    description: 'Corn on the cob and seasonal vegetables from the grill, with lime and chilli butter.',
    ingredients: ['Corn', 'Seasonal vegetables', 'Lime', 'Chilli butter'], dietary: ['v', 'gf'], available: true,
    image: { src: 'corn', alt: 'Charred corn on the cob with herbs and vegetables.', pos: '50% 40%' } },
  { id: 'asparagus', category: 'sides', name: 'Grilled asparagus', price: 650,
    description: 'Tender stems with lemon, olive oil and shaved parmesan.',
    ingredients: ['Asparagus', 'Lemon', 'Olive oil', 'Parmesan'], dietary: ['v', 'gf'], available: true,
    image: { src: 'asparagus', alt: 'A bunch of green asparagus against a black background.', pos: '50% 55%' } },
  { id: 'roast-veg', category: 'sides', name: 'Roasted roots', price: 500,
    description: 'Carrots, sweet potato and red onion roasted with thyme and honey.',
    ingredients: ['Carrots', 'Sweet potato', 'Red onion', 'Thyme', 'Honey'], dietary: ['v', 'gf'], available: true,
    image: { src: 'roast-veg', alt: 'Roasted vegetables in a black pan.', pos: '50% 50%' } },

  /* ---- Desserts ---- */
  { id: 'fondant', category: 'desserts', name: 'Molten chocolate fondant', price: 950, signature: true, note: 'Baked to order · 12 minutes',
    description: 'Dark chocolate fondant with a soft centre, served with vanilla cream.',
    ingredients: ['Dark chocolate', 'Butter', 'Eggs', 'Vanilla cream'], dietary: ['v'], available: true,
    image: { src: 'fondant', alt: 'A chocolate fondant with a molten centre on a white plate.', pos: '60% 45%' } },
  { id: 'brulee', category: 'desserts', name: 'Vanilla crème brûlée', price: 850,
    description: 'Vanilla bean custard under a glass-thin caramel, torched as it leaves the kitchen.',
    ingredients: ['Cream', 'Vanilla', 'Eggs', 'Caramel'], dietary: ['v', 'gf'], available: true,
    image: { src: 'brulee', alt: 'A crème brûlée being caramelised with a torch.', pos: '50% 55%' } },
  { id: 'torte', category: 'desserts', name: 'Dark chocolate torte', price: 800,
    description: 'A dense slice of dark chocolate cake with a berry coulis.',
    ingredients: ['Dark chocolate', 'Almond flour', 'Berry coulis'], dietary: ['v', 'gf', 'nuts'], available: true,
    image: { src: 'choc-cake', alt: 'A slice of chocolate cake on a plate.', pos: '55% 50%' } },
  { id: 'berry-tart', category: 'desserts', name: 'Chocolate and berry tart', price: 900,
    description: 'Chocolate tart with whipped cream, raspberries and blueberries.',
    ingredients: ['Chocolate', 'Cream', 'Raspberries', 'Blueberries'], dietary: ['v'], available: true,
    image: { src: 'berry-tart', alt: 'A chocolate tart topped with raspberries and blueberries on a wooden table.', pos: '35% 55%' } },

  /* ---- Drinks ---- */
  { id: 'old-fashioned', category: 'drinks', group: 'Cocktails', name: 'Smoked old fashioned', price: 1200, orderable: false,
    description: 'Bourbon, demerara and bitters, stirred down and smoked over oak.',
    ingredients: ['Bourbon', 'Demerara', 'Bitters', 'Orange'], dietary: ['alc'], available: true,
    image: { src: 'old-fashioned', alt: 'An old fashioned with ice next to half an orange on a bar.', pos: '60% 55%' } },
  { id: 'negroni', category: 'drinks', group: 'Cocktails', name: 'Ember negroni', price: 1200, orderable: false,
    description: 'Gin, bitter aperitivo and sweet vermouth with a flamed orange peel.',
    ingredients: ['Gin', 'Bitter aperitivo', 'Sweet vermouth', 'Orange'], dietary: ['alc'], available: true },
  { id: 'passion-mojito', category: 'drinks', group: 'Cocktails', name: 'Passion fruit mojito', price: 1100, orderable: false,
    description: 'White rum, passion fruit, lime and mint, topped with soda.',
    ingredients: ['White rum', 'Passion fruit', 'Lime', 'Mint', 'Soda'], dietary: ['alc'], available: true },
  { id: 'citrus-cooler', category: 'drinks', group: 'Without alcohol', name: 'Citrus cooler', price: 500,
    description: 'Fresh orange and lime pressed over ice with ginger syrup and soda.',
    ingredients: ['Orange', 'Lime', 'Ginger', 'Soda'], dietary: ['vg', 'gf'], available: true,
    image: { src: 'citrus', alt: 'Lime being squeezed into a glass of citrus cooler.', pos: '50% 45%' } },
  { id: 'berry-cooler', category: 'drinks', group: 'Without alcohol', name: 'Berry and mint cooler', price: 500,
    description: 'Crushed berries, mint and lime topped with sparkling water.',
    ingredients: ['Mixed berries', 'Mint', 'Lime', 'Sparkling water'], dietary: ['vg', 'gf'], available: true,
    image: { src: 'berry-cooler', alt: 'A red berry cooler with mint on a dark table.', pos: '50% 45%' } },
  { id: 'iced-tea', category: 'drinks', group: 'Without alcohol', name: 'Iced black tea, citrus', price: 450,
    description: 'Cold-brewed black tea with orange, lime and a little honey.',
    sizes: [{ label: 'Glass', price: 450 }, { label: 'Jug', price: 1300 }],
    ingredients: ['Black tea', 'Orange', 'Lime', 'Honey'], dietary: ['vg', 'gf'], available: true,
    image: { src: 'iced-tea', alt: 'A tall glass of iced tea with a slice of orange, oranges beside it.', pos: '50% 50%' } },
  { id: 'ginger-fizz', category: 'drinks', group: 'Without alcohol', name: 'Ginger and lemongrass fizz', price: 500,
    description: 'House ginger and lemongrass syrup, lime and soda.', ingredients: ['Ginger', 'Lemongrass', 'Lime', 'Soda'], dietary: ['vg', 'gf'], available: true },
  { id: 'fresh-juice', category: 'drinks', group: 'Without alcohol', name: 'Fresh juice of the day', price: 450,
    description: 'Ask what the market brought in this morning.', ingredients: ['Seasonal fruit'], dietary: ['vg', 'gf'], available: true },
  { id: 'water', category: 'drinks', group: 'Without alcohol', name: 'Still or sparkling water', price: 250,
    sizes: [{ label: '500 ml', price: 250 }, { label: '1 litre', price: 400 }],
    options: [{ name: 'Water', type: 'one', required: true, choices: [{ label: 'Still' }, { label: 'Sparkling' }] }],
    description: 'Chilled, in glass bottles.', ingredients: ['Water'], dietary: ['vg', 'gf'], available: true },
  { id: 'house-red', category: 'drinks', group: 'Wine and beer', name: 'House red', price: 900, orderable: false,
    sizes: [{ label: 'Glass', price: 900 }, { label: 'Bottle', price: 4200 }],
    description: 'A soft, full red that loves the grill. Ask for the wine list.', ingredients: ['Red wine'], dietary: ['alc'], available: true },
  { id: 'house-white', category: 'drinks', group: 'Wine and beer', name: 'House white', price: 900, orderable: false,
    sizes: [{ label: 'Glass', price: 900 }, { label: 'Bottle', price: 4200 }],
    description: 'Crisp and bright, for seafood and starters.', ingredients: ['White wine'], dietary: ['alc'], available: true },
  { id: 'lager', category: 'drinks', group: 'Wine and beer', name: 'Craft lager', price: 600, orderable: false,
    description: 'Cold, clean and brewed close to home.', ingredients: ['Lager'], dietary: ['alc'], available: true },
  { id: 'espresso', category: 'drinks', group: 'Coffee and tea', name: 'Espresso', price: 300,
    sizes: [{ label: 'Single', price: 300 }, { label: 'Double', price: 400 }],
    description: 'Single-origin beans, roasted locally.', ingredients: ['Coffee'], dietary: ['vg', 'gf'], available: true },
  { id: 'cappuccino', category: 'drinks', group: 'Coffee and tea', name: 'Cappuccino', price: 400,
    options: [{ name: 'Milk', type: 'one', required: false, choices: [{ label: 'Whole milk' }, { label: 'Oat milk', price: 80 }] }],
    description: 'Double shot with silky steamed milk.', ingredients: ['Coffee', 'Milk'], dietary: ['v', 'gf'], available: true },
  { id: 'mint-tea', category: 'drinks', group: 'Coffee and tea', name: 'Fresh mint tea', price: 300,
    description: 'A pot of fresh mint leaves and hot water, honey on the side.', ingredients: ['Mint', 'Honey'], dietary: ['v', 'gf'], available: true }
];
