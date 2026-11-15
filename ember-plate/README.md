# EMBER & PLATE — restaurant website template

A Ciel Africa template for restaurants, grills, steakhouses, fine dining, bistros, cafés and lounges.
*Ember & Plate* is a sample restaurant. Its menu, prices, reviews, hours, address and contact details are
demonstration content and must be replaced for each client.

## What's inside
- **Opening scene.** A photograph of the signature dish over open flame, made alive in the browser: heat haze and a
  flame flicker limited to the fire, sparks rising from the coals, drifting smoke and a slow camera push. As the visitor
  scrolls, smoke rolls through the frame and reveals a second photograph (the dish, carved) with its name, price and
  a *View the dish* button. Runs on WebGL with a small noise texture, pauses off screen, and falls back to still
  photographs without WebGL or with reduced motion.
- **The house.** An opening statement that lights up word by word as it is read, two photographs and short facts.
- **Signature dishes.** Full-screen dishes that wipe in over each other as you scroll, each with name, line,
  description, price and *Order now*.
- **The menu.** Category rail that stays under the header, a large plate photograph that follows the dish you point
  at (desktop), editorial dish rows with dietary tags, signature marks, availability and notes, search across names,
  descriptions and ingredients, and dietary filters. Each dish opens a detail view (`#dish-<id>` links to it) with
  ingredients, sizes, required and optional choices with prices, kitchen notes, quantity and a live total.
- **Ordering.** An order drawer with quantities, delivery or collection, delivery areas and fees, a minimum for
  delivery, then customer details, address, time slots inside opening hours and notes. Send it on WhatsApp, as an order
  request (POST to your endpoint, or an email) or through online payment when a checkout endpoint is connected.
  Nothing is shown as confirmed or paid unless the restaurant's own system says so.
- **The experience.** Chapters (the room, the fire, the details, the table, the gathering) beside a sticky photograph
  that changes with each chapter.
- **The kitchen.** Chef or kitchen story: photographs, quote, name and role, story, philosophy and history.
- **Gallery.** An editorial grid that opens full screen (arrows, swipe, keyboard).
- **Reviews**, **Reservations**, **Visit** (opening hours with *Open now*, today highlighted, address, map,
  WhatsApp, phone, email and social links) and **FAQ**.
- **Mobile.** Full-screen menu, a Menu · Reserve · Order bar that appears after the opening scene and steps aside
  while typing (the page leaves room for it), bottom sheets for dishes, and touch-sized controls.

## Set it up for a new restaurant
You only edit three files and the photos. Nothing in `js/` or `css/` needs to change.

1. **`config/site.config.js`**
   - `demo`: set to `false` for a real restaurant (removes the sample labels and template notices).
   - `brand`, `theme` (colours), `fonts` (any Google Fonts pair), `currency`.
   - `hero`: kicker, headline lines, text, buttons; `fire` (photo, alt text, crop on wide and portrait screens, zoom
     and the `flames` area sparks rise from); `reveal` (the second photo and the dish it introduces). Remove `reveal`
     to use one photo. Set `video` to use the restaurant's own film instead.
   - `ordering`: which ways to send an order (`whatsapp`, `request`, `payment`), the request `endpoint`, and
     `payment.checkoutEndpoint` (your server creates a hosted checkout session and returns `{ url }`).
   - `delivery`: collection and delivery on or off, minimum order and delivery areas with fees.
   - `reservations`: `method` (`request`, `whatsapp` or `link` to an external booking page), endpoint, booking URL,
     maximum party size, slot length, last seating, occasions and policy.
   - `whatsapp.number` (international format, digits only, e.g. `2547XXXXXXXX`) and the message openings.
   - `contact`: phone, email, address lines, map embed and directions link, time zone, opening hours per day
     (several services per day are fine) and a note.
   - `social`, `nav`, `seo`.
2. **`data/menu.js`**: categories (rename, reorder, add or remove), the category the menu opens on, dietary labels,
   and the dishes (see the field list at the top of the file).
3. **`data/content.js`**: the opening statement, signature dishes, experience chapters, chef, gallery, reviews and FAQ.
4. **Photos**: put them in `img/p/` as `name-800.webp` and `name-1600.webp`, and the two hero photos in `img/hero/`
   as `name-1280/1920/2560.webp`.

## Form endpoints
Order and reservation requests are sent as JSON (`Content-Type: application/json`) with a ready-made `summary`
text, so they work with Formspree, Getform, Basin or your own API. A request only shows *received* when the endpoint
answers with a 2xx status, and the message always says the restaurant will confirm.

## Accessibility and performance
Semantic sections and headings, skip link, keyboard-operable menu tabs, dialogs with focus trap and Escape,
`aria-live` results, visible focus, reduced-motion alternatives everywhere, lazy images with `srcset`, and a hero that
pauses when it is off screen or the tab is hidden. No frameworks or animation libraries.

Photo credits: `credits.html` and `img/CREDITS.md`.
