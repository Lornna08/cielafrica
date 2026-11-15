/* ==========================================================================
   CRÈME MOTION — editorial content (sample)
   The Cake Experience chapters, reviews, gallery, ordering steps and FAQ.
   Image names refer to img/p/<name>-800.webp / -1600.webp.
   ========================================================================== */
window.CREME = window.CREME || {};

CREME.experience = {
  kicker: 'The cake experience',
  title: 'Made slowly. Revealed in layers.',
  chapters: [
    { title: 'The layers', text: 'Sponges baked the day before, levelled by hand and soaked just enough to stay tender to the last forkful.', image: 'layers-dark', alt: 'A slice of chocolate layer cake showing dark sponge and cream layers', pos: '50% 60%' },
    { title: 'The cream', text: 'Swiss meringue buttercream whipped until it holds a peak and melts the moment it meets the tongue.', image: 'cupcake-single', alt: 'A close view of a piped buttercream swirl', pos: '50% 35%' },
    { title: 'The fillings', text: 'Fresh strawberries, slow-cooked compotes, curds and caramels, made in our kitchen, never from a tin.', image: 'shortcake-slices', alt: 'Strawberry shortcake slices showing cream and fresh strawberry layers', pos: '50% 50%' },
    { title: 'The frosting', text: 'Smoothed, combed or piped. Every finish is shaped by hand with a palette knife and a steady breath.', image: 'piping-bags', alt: 'Piping bags filled with chocolate and vanilla buttercream', pos: '50% 50%' },
    { title: 'The details', text: 'Sugar flowers, gold leaf, glazed fruit and chocolate work, placed one piece at a time.', image: 'gold-cherries', alt: 'A pink cake topped with gold-painted cherries and piped pearls', pos: '50% 30%' },
    { title: 'The moment', text: 'Boxed, delivered and set down in the middle of the table, ready for the first cut.', image: 'wedding-gold', alt: 'A tall wedding cake with sugar flowers lit by candlelight', pos: '50% 45%' }
  ]
};

/* Reviews: replace with real reviews from your customers. In demo mode they are labelled as samples. */
CREME.testimonials = [
  { quote: 'The cake was the first thing everyone talked about, and the last thing left on the table. Not a crumb went home.', name: 'Amani', occasion: 'Birthday, Chocolate Fudge Cake' },
  { quote: 'They took a blurry photo from my phone and turned it into exactly the wedding cake I had imagined. Calm, kind and on time.', name: 'Wanjiru & Tom', occasion: 'Wedding, Ivory Garden' },
  { quote: 'Ordering on WhatsApp took two minutes. The macaron box arrived with a handwritten card and the prettiest ribbon.', name: 'Leila', occasion: 'Gift, Macaron Gift Box' },
  { quote: 'Light sponge, real strawberries and cream that was not too sweet. My mother asked for the number before the candles were out.', name: 'David', occasion: 'Anniversary, Strawberries & Cream' }
];

/* Gallery: tag each photo so visitors can filter */
CREME.gallery = {
  filters: [
    { id: 'all', label: 'All' },
    { id: 'cakes', label: 'Cakes' },
    { id: 'celebrations', label: 'Celebrations' },
    { id: 'details', label: 'Details' },
    { id: 'kitchen', label: 'Behind the scenes' }
  ],
  items: [
    { image: 'celebration-gold', tag: 'celebrations', alt: 'A decorated cake on a gold pedestal', caption: 'Golden birthday' },
    { image: 'macaron-tower', tag: 'celebrations', alt: 'A tall tower of pastel macarons', caption: 'Macaron tower' },
    { image: 'peony-cake', tag: 'cakes', alt: 'A white rustic cake crowned with peonies', caption: 'Peony crown' },
    { image: 'pastry-table', tag: 'kitchen', alt: 'Croissants and pastries on a wooden board with a rolling pin and whisk', caption: 'Morning bake' },
    { image: 'macarons-plate', tag: 'details', alt: 'Pastel macarons on a green plate with dried petals', caption: 'Pastel macarons' },
    { image: 'drip-cakes', tag: 'cakes', alt: 'White cakes with dark chocolate drips', caption: 'The drip' },
    { image: 'tartlets', tag: 'details', alt: 'Fruit tartlets seen from above', caption: 'Glazed fruit' },
    { image: 'piping-tips', tag: 'kitchen', alt: 'Cake decorating piping tips', caption: 'Tools of the trade' },
    { image: 'wedding-rose', tag: 'celebrations', alt: 'A three-tier cake with pink flowers beside champagne glasses', caption: 'Garden wedding' },
    { image: 'choc-fork', tag: 'details', alt: 'A fork resting in a slice of chocolate cake', caption: 'First forkful' },
    { image: 'berry-naked', tag: 'cakes', alt: 'A semi-naked cake with strawberries and blueberries', caption: 'Summer berries' },
    { image: 'macarons-pink', tag: 'details', alt: 'Pink and yellow macarons stacked in front of a mug', caption: 'Little things' },
    { image: 'mini-fraisier', tag: 'cakes', alt: 'A strawberry fraisier with a pink glaze', caption: 'Fraisier' },
    { image: 'croissants-dark', tag: 'kitchen', alt: 'Croissants being dusted with flour', caption: 'Out of the oven' }
  ]
};

CREME.ordering = {
  steps: [
    { title: 'Choose', text: 'Pick a cake from the collection or tell us about the cake you have in mind.' },
    { title: 'Message', text: 'Tap Order on WhatsApp. Your choice, size and flavour are written for you.' },
    { title: 'Confirm', text: 'We confirm the date, the price and delivery or collection, then we start baking.' }
  ],
  faq: [
    { q: 'How much notice do you need?', a: 'Most cakes need two to three days. Wedding cakes are booked weeks ahead. Each product shows its notice time; for anything sooner, message us and we will do our best.' },
    { q: 'How do I pay?', a: 'We confirm the total on WhatsApp and share payment details there. Custom and wedding cakes are secured with a deposit.' },
    { q: 'Can you make a cake from a photo?', a: 'Yes. Upload a reference photo on the custom cake form or send it in the chat. We will tell you honestly what we can match.' },
    { q: 'Do you cater for allergies?', a: 'Every product lists what it contains. Our kitchen handles gluten, dairy, eggs and nuts, so we cannot promise an allergen-free cake.' }
  ]
};
