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
    { title: 'The cream', text: 'Swiss meringue buttercream whipped until it holds a peak and melts the moment it meets the tongue.', image: 'piping-ombre', alt: 'Buttercream piped in pink ombré rosettes', pos: '50% 50%' },
    { title: 'The fillings', text: 'Fresh strawberries, slow-cooked compotes, curds and caramels, made in our kitchen, never from a tin.', image: 'funfetti-slice', alt: 'A slice of layered cake showing sponge and buttercream', pos: '50% 50%' },
    { title: 'The frosting', text: 'Smoothed, combed or piped. Every finish is shaped by hand with a palette knife and a steady breath.', image: 'piping-bags', alt: 'Piping bags filled with chocolate and vanilla buttercream', pos: '50% 50%' },
    { title: 'The details', text: 'Vintage piping, bows, cherries, pearls and fresh flowers, placed one piece at a time.', image: 'cherry-vintage', alt: 'A vintage-piped cake topped with cherries', pos: '50% 40%' },
    { title: 'The moment', text: 'Boxed, delivered and set down in the middle of the table, ready for the first cut.', image: 'heart-candles', alt: 'A heart-shaped cake with lit candles', pos: '50% 45%' }
  ]
};

/* Reviews: replace with real reviews from your customers. In demo mode they are labelled as samples. */
CREME.testimonials = [
  { quote: 'The cake was the first thing everyone talked about, and the last thing left on the table. Not a crumb went home.', name: 'Amani', occasion: 'Birthday, Vintage Heart Cake' },
  { quote: 'They took a blurry photo from my phone and turned it into exactly the wedding cake I had imagined. Calm, kind and on time.', name: 'Wanjiru & Tom', occasion: 'Wedding, Ivory Wedding Cake' },
  { quote: 'Ordering on WhatsApp took two minutes. The bento box arrived with a handwritten card and the prettiest bow.', name: 'Leila', occasion: 'Gift, Bento Cake & Cupcakes' },
  { quote: 'Light sponge, real strawberries and cream that was not too sweet. My mother asked for the number before the candles were out.', name: 'David', occasion: 'Anniversary, Berry Celebration Cake' }
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
    { image: 'tier-pink-bow', tag: 'celebrations', alt: 'A tiered pink cake with a large bow', caption: 'Pink bow tiers' },
    { image: 'heart-red', tag: 'cakes', alt: 'A red heart-shaped cake with piped borders', caption: 'Red heart' },
    { image: 'bento-green', tag: 'cakes', alt: 'A small bento cake in a box', caption: 'Bento for two' },
    { image: 'piping-bags', tag: 'kitchen', alt: 'Piping bags filled with chocolate and vanilla buttercream', caption: 'Ready to pipe' },
    { image: 'cupcakes-bright', tag: 'details', alt: 'Brightly frosted cupcakes', caption: 'Bright cupcakes' },
    { image: 'cherry-vintage-2', tag: 'cakes', alt: 'A vintage-piped cake with cherries', caption: 'Vintage cherries' },
    { image: 'number-candle', tag: 'celebrations', alt: 'A birthday cake with a number candle', caption: 'Birthday number' },
    { image: 'piping-tips', tag: 'kitchen', alt: 'Cake decorating piping tips', caption: 'Tools of the trade' },
    { image: 'floral-pink', tag: 'celebrations', alt: 'A pink cake with flowers', caption: 'Garden blooms' },
    { image: 'mini-flower', tag: 'details', alt: 'A mini cake decorated with a flower', caption: 'Mini bloom' },
    { image: 'tier-striped', tag: 'celebrations', alt: 'A striped tiered cake', caption: 'Striped tiers' },
    { image: 'purple-cake', tag: 'cakes', alt: 'A lilac frosted cake', caption: 'Lilac' },
    { image: 'heart-love', tag: 'details', alt: 'A heart cake with piped lettering', caption: 'Written with love' },
    { image: 'pastry-table', tag: 'kitchen', alt: 'Pastries on a wooden board with a rolling pin and whisk', caption: 'Morning bake' }
  ]
};

CREME.ordering = {
  steps: [
    { title: 'Choose', text: 'Pick a cake and its size, flavour and toppers, or design your own.' },
    { title: 'Send', text: 'Send it on WhatsApp, as an order request or call us. Your order is written for you.' },
    { title: 'Confirm', text: 'We confirm the date, the price and delivery or collection, then we bake.' }
  ],
  faq: [
    { q: 'How much notice do you need?', a: 'Most cakes need two to three days. Wedding cakes are booked weeks ahead. Each cake shows its notice time; for anything sooner, message us and we will do our best.' },
    { q: 'How do I pay?', a: 'We confirm the total on WhatsApp, by phone or email and share payment details there. Custom and wedding cakes are secured with a deposit.' },
    { q: 'Can you make a cake from a photo?', a: 'Yes. Add a reference photo in the cake designer or send it in the chat. We will tell you honestly what we can match.' },
    { q: 'Are the prices on the website final?', a: 'They are estimates for the size, flavour and extras you choose. We confirm the final price, and any delivery fee, before we bake.' },
    { q: 'Do you cater for allergies?', a: 'Every product lists what it contains. Our kitchen handles gluten, dairy, eggs and nuts, so we cannot promise an allergen-free cake.' }
  ]
};
