# EMBER & PLATE — restaurant website template

A Ciel Africa template for restaurants, grills, steakhouses, fine dining, bistros, cafés and lounges.
*Ember & Plate* is a sample restaurant. Its menu, prices, reviews, hours, address and contact details are
demonstration content and must be replaced for each client.

## What's inside
- **Opening scene.** A photograph of the signature dish over open flame, made alive in the browser: heat haze and a
  flame flicker limited to the fire, sparks rising from the coals, smoke rolling up through the frame in two drifting
  layers and a slow camera push. On phones held upright the fire takes the top of the screen at a wider framing and
  the words sit below it. Runs on WebGL with a small noise texture, pauses off screen, and falls back to the still
  photograph without WebGL or with reduced motion.
- **Light and dark.** Dark by default (`theme.default`), with a sun/moon switch in the header. The visitor's choice
  is remembered in their browser. Photo areas keep their dark colours in either mode.
- **The house.** An opening statement that lights up word by word as it is read, two photographs and short facts.
- **Signature dishes.** Full-screen dishes that wipe in over each other as you scroll, with *Order now*.
- **The menu** (for reading). Laid out like a printed menu, course by course: a framed *Chef's specials* panel, then
  every course with its photograph, dish names with dotted leaders to the price, descriptions, dietary marks, sizes,
  house signatures and availability. Drinks are grouped (cocktails, without alcohol, wine and beer, coffee and tea).
  A course bar follows you down the page and highlights where you are; *Find a dish* searches names, descriptions and
  ingredients; dietary toggles show only what fits. On desktop a photo of the dish follows the pointer. Every dish
  opens its details (`#dish-<id>` links to it).
- **Order online** (for buying). A separate catalogue of what can be ordered: delivery and collection facts,
  category tabs, photo cards with *Add* or *Choose*. Dishes marked `orderable: false` (for example alcohol) stay on the
  menu but not in ordering, and their details say they are served in the restaurant only.
- **Your order.** Quantities, delivery or collection, delivery areas and fees, a minimum for delivery, then customer
  details, address, time slots inside opening hours and notes. Send it on WhatsApp, as an order request (POST to your
  endpoint, or an email) or through online payment when a checkout endpoint is connected. Nothing is shown as
  confirmed or paid unless the restaurant's own system says so.
- **Glovo.** One *Order on Glovo* link at the bottom of the page (`glovo.url`; leave it empty to hide it).
- **The experience**, **The kitchen**, **Gallery** (opens full screen: arrows, swipe, keyboard), **Reviews**,
  **Reservations**, **Visit** (opening hours with *Open now*, address, map, WhatsApp, phone, email, social links) and
  **FAQ**.
- **Mobile.** Full-screen menu, a Menu · Reserve · Order bar that appears after the opening scene and steps aside
  while typing (the page leaves room for it), bottom sheets for dishes, and touch-sized controls.

## Set it up for a new restaurant
You only edit three files and the photos. Nothing in `js/` or `css/` needs to change.

1. **`config/site.config.js`**
   - `demo`: set to `false` for a real restaurant (removes the sample labels and template notices).
   - `brand`, `theme` (the default mode, the switcher, and a `dark` and a `light` palette), `fonts` (any Google
     Fonts pair), `currency`.
   - `hero`: kicker, headline lines, text, buttons and `fire` (photo, alt text, framing on wide screens and on
     phones, zoom, the `flames` area the flicker and sparks stay inside, and how much `smoke`). Set `video` to use
     the restaurant's own film instead.
   - `glovo`: the restaurant's Glovo store link and its line of text.
   - `ordering`: which ways to send an order (`whatsapp`, `request`, `payment`), the request `endpoint`, and
     `payment.checkoutEndpoint` (your server creates a hosted checkout session and returns `{ url }`).
   - `delivery`: collection and delivery on or off, minimum order and delivery areas with fees.
   - `reservations`: `method` (`request`, `whatsapp` or `link` to an external booking page), endpoint, booking URL,
     maximum party size, slot length, last seating, occasions and policy.
   - `whatsapp.number` (international format, digits only, e.g. `2547XXXXXXXX`) and the message openings.
   - `contact`: phone, email, address lines, map embed and directions link, time zone, opening hours per day
     (several services per day are fine) and a note.
   - `social`, `nav`, `seo`.
2. **`data/menu.js`**: categories (rename, reorder, add or remove; `feature: true` frames one, like Chef's specials),
   the category the order catalogue opens on, dietary labels, and the dishes (see the field list at the top of the
   file). Photos are optional per dish; `group` adds sub-headings such as Cocktails; `orderable: false` keeps a dish
   off online ordering.
3. **`data/content.js`**: the opening statement, signature dishes, experience chapters, chef, gallery, reviews and FAQ.
4. **Photos**: put them in `img/p/` as `name-800.webp` and `name-1600.webp`, and the hero photo in `img/hero/` as
   `name-1280/1920/2560.webp`.

## Form endpoints
Order and reservation requests are sent as JSON (`Content-Type: application/json`) with a ready-made `summary`
text, so they work with Formspree, Getform, Basin or your own API. A request only shows *received* when the endpoint
answers with a 2xx status, and the message always says the restaurant will confirm.

## Accessibility and performance
Semantic sections and headings, skip link, keyboard-operable menu tabs, dialogs with focus trap and Escape,
`aria-live` results, visible focus, reduced-motion alternatives everywhere, lazy images with `srcset`, and a hero that
pauses when it is off screen or the tab is hidden. No frameworks or animation libraries.

Photo credits: `credits.html` and `img/CREDITS.md`.
