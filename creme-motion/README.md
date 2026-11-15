# CRÈME MOTION — bakery & dessert website template

A Ciel Africa template for cake shops, bakeries, patisseries, dessert studios and cupcake businesses.
*Velvet & Crumb* is a sample brand. Its products, prices, reviews and contact details are demonstration
content and must be replaced for each client.

## What's inside
- **Signature hero**: an original 3D film of a vintage cake being cut. A chef's knife cuts down twice with a gentle
  sawing motion, a cake server slides under the slice and lifts it out towards the camera so the sponge, cream and jam
  layers face you, and crumbs fall. The headline settles as the slice is lifted. There is a portrait version for
  phones. With *reduced motion* turned on, a still of the cut cake is shown and nothing animates.
- **How to order**, right under the hero: one line on how ordering works with WhatsApp, Browse and (when a phone
  number is set) Call buttons.
- **The collection**: category tiles with photos, sticky filter chips with counts, and an even grid of cards. Every
  card shows the category, name, starting price and two buttons: **Order** (opens the options) and **WhatsApp**.
  On phones the grid is two columns.
- **Product view** (`#product/<id>`, so it can be shared): photo gallery (arrows, thumbnails, swipe, keyboard),
  sizes with servings, flavours (each flavour can have its own prices), options such as frosting, grouped toppers and
  extras, a pick-your-flavours step (for boxes and trios), message on the cake, notes, quantity and a **live
  estimated total**, then **Order on WhatsApp** or **Add to my order**.
- **Design your cake**: customers choose shape (round, heart, two tiers), size, flavour, buttercream or whipped
  cream, frosting colour, piping style and colour, a message and toppers. A drawing of the cake and the estimated
  price update with every choice. They add a reference photo, date, delivery or collection and their details, then
  send the design on WhatsApp, as an order request, or add it to their order.
- **Your order and checkout**: collect several cakes, then send them in one go by WhatsApp, as an order request
  (to your form endpoint, or by email), or call. Saved in the visitor's browser.
- **Mobile order bar**: on phones a bar with WhatsApp, Call (or Design) and My order stays at the bottom of the screen.
- **The Cake Experience**, **About**, **Testimonials**, **Gallery** and **Contact & ordering** (every way to order,
  delivery and fees, hours, contact, social links and FAQ).
- Headlines rise into place and then settle fully visible (nothing stays masked). Animated mobile menu, scroll
  reveals, parallax and View Transitions where supported.

## Ordering channels
| Channel | Where | How to set it up |
|---|---|---|
| WhatsApp | every card, product view, designer, checkout, nav, mobile bar | `whatsapp.number` in the config |
| Order request | checkout and designer | `orders.endpoint` (Formspree, Getform, Basin or your API). Empty = opens an email to `contact.email` |
| Call | menu, how-to-order strip, checkout, contact, mobile bar | `contact.phone`. Empty = no call buttons |
| Email | contact | `contact.email` |

## Prices
Prices are estimates the customer sees before sending; the bakery confirms the final price.
- A product has `sizes` (each with a `price`), or uses a shared `flavorTable` from `CREME.flavorTables`
  (sizes across, one row of prices per flavour).
- A flavour can carry its own `prices` (one per size) or an `extra` added to the size price.
- `options` (for example `'frosting'`, defined once in `CREME.frosting`) add their `price` when chosen.
- Toppers and extras come from `CREME.addons`; set `addons: true` on a product to offer them.
- `unit` / `qtyLabel` turn quantity into "per number or letter" pricing; `pick` asks for a set number of flavours.
- The designer (`data/designer.js`) prices a cake from the cake flavour table: each size maps to a column, or to a
  `factor` of the 1 kg price, plus shape, frosting, colour, piping, tier and topper extras.

## Set it up for a new bakery
You only edit four files and the photos. Nothing in `js/` or `css/` needs to change.

1. **`config/site.config.js`**
   - `brand`: name, short name, tagline, logo (`logo: 'img/brand/logo.svg'`; leave empty for a wordmark), favicon.
   - `theme`: the colours. `fonts`: a Google Fonts URL and the two family names.
   - `hero`: kicker, headline lines, text, buttons, the hero video for desktop and phone, the poster and still
     images, `revealAt` (seconds into the film when the headline appears) and the alt text.
   - **`whatsapp.number`**: the business WhatsApp number, international format, digits only (for example
     `2547XXXXXXXX`). Also the greeting, closing and general lines used in messages.
   - `order`: the how-to-order line, reply time and payment note.
   - `orders.endpoint`: optional. If set, order requests (checkout and designer) are POSTed there as
     `multipart/form-data` with the details, the reference image and a ready-made `summary`. If empty, "Send order
     request" opens an email to `contact.email`.
   - `contact` (a `phone` adds Call buttons everywhere), `social` (only links with a URL are shown), `delivery`,
     `about`, `customForm.occasions`, `nav` and `seo`.
   - Set **`demo: false`** for a real bakery. This removes the "Sample review" labels and the delivery fee note.
2. **`data/menu.js`**: categories (each with a tile photo), flavour price tables, frosting, toppers and extras, and
   products (name, description, photos, sizes and prices, flavours, options, notice, details). Products link as
   `#product/<id>`.
3. **`data/designer.js`**: the cake designer's shapes, sizes, colours, piping styles and their prices, and which
   toppers are drawn in the preview.
4. **`data/content.js`**: the Cake Experience chapters, reviews, gallery photos and filters, ordering steps and FAQ.
5. **Photos**: put product and gallery photos in `img/p/` as `name-800.webp` and `name-1600.webp` and refer to them
   by `name`. Replace `img/brand/og.jpg` (1200 × 630) and the favicon.

### WhatsApp messages
Messages are written for the customer, for example:

> Hello! I'd like to order the Vintage Heart Cake. Size: 1.5 kg. Flavour: Red Velvet. Message on the cake: “Happy 30th”. Estimated total: KES 4,700. Please confirm availability.

Without a number (template mode) each button shows the message first and can open WhatsApp so the visitor chooses the chat.
With a number set, buttons open that chat directly.

### The hero film
`img/hero/` holds the film as MP4 (H.264) and WebM at 1280 × 720 for desktop and 608 × 1080 for phones, plus a
first-frame poster and a final-frame still for each. A real filmed cut of the bakery's own cake works just as well. To use the bakery's own footage, export the same two sizes, keep the
first and last frames as WebP stills, and update `hero` in the config. Keep the left side of the desktop frame (and the
top of the phone frame) quiet so the headline stays readable.

## Accessibility and performance
Keyboard navigation throughout (dialogs, gallery, carousel, menu), visible focus, skip link, alt text on every
photo, labelled form fields with error messages, and `prefers-reduced-motion` support (no film, no parallax, no
autoplay). Images are WebP with `srcset` and lazy loading; the hero film is under 0.5 MB on desktop and
about 0.4 MB on phones and starts from a poster frame.

## Hosting
Static files only. Serve the folder from any web host. `index.html` has a `<base href="/creme-motion/">` tag for
the Ciel Africa demo; a one-line script next to it switches paths to the page's own folder anywhere else (a client's
domain, another folder, or the file opened from disk). You can also simply change the tag to your folder, or `/`.

## Credits
See `img/CREDITS.md` and `credits.html`. Product and gallery photos are Unsplash placeholders.

Created by Ciel Africa.
