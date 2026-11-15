# CRÈME MOTION — bakery & dessert website template

A Ciel Africa template for cake shops, bakeries, patisseries, dessert studios and cupcake businesses.
*Velvet & Crumb* is a sample brand. Its products, prices, reviews and contact details are demonstration
content and must be replaced for each client.

## What's inside
- **Hero**: one full-bleed photograph of a cut cake showing its layers, with the headline settling in over it. A
  portrait crop is used on phones. A bakery can swap in its own photograph, or its own filmed cut (set `hero.video`).
- **How ordering works**: three short steps under the hero.
- **The menu**: a typographic category index that stays under the header, an even grid of photographed cakes with
  name, starting price, *Choose options* and a WhatsApp shortcut, and a *Design your own cake* card in the grid.
- **Product view** (`#product/<id>`, so it can be shared): photo gallery (arrows, thumbnails, swipe, keyboard),
  sizes with servings, flavours (each flavour can have its own prices), options such as frosting, grouped toppers and
  extras, a pick-your-flavours step (for boxes and trios), message on the cake, notes, quantity and a **live
  estimated total**, then **Order on WhatsApp** or **Add to my order**.
- **The cake studio**: five short steps (shape & size, flavour, finish, message & toppers, review & send) beside a
  photographic preview. The preview is a real photograph chosen by shape and piping style, with its frosting tinted to the
  chosen colour in the browser; the caption says when it is the closest reference rather than an exact match. Sizes and
  flavours show their prices with the current choices, the estimate and a summary stay beside the preview, and the last
  step sends the design on WhatsApp, as an order request, or adds it to the order. On phones a Back · price · Next bar sits
  at the bottom while you design.
- **Your order and checkout**: collect several cakes, then send them in one go by WhatsApp, as an order request
  (to your form endpoint, or by email), or call. Saved in the visitor's browser.
- **Mobile order bar**: on phones a bar with WhatsApp, Call (when a phone is set) and My order. It steps aside inside the
  cake studio and while the keyboard is open, and the page leaves room for it so it never covers content.
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
   - `hero`: kicker, headline lines, text, buttons, alt text and `reveal` (the photograph for desktop, tablet and
     phone, and how each is positioned). Or remove `reveal` and give a `video`.
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

### The hero photograph
Use a photograph of the bakery's own cake, ideally a cut slice that shows the layers, at about 2600 px wide (plus a
1500 px copy and a portrait crop around 1170 × 2080 for phones). Set `hero.reveal.position` so the layers stay in view (fractions of the
photo) where the layers are. Keep the left of the desktop photo (and the lower part of the phone photo) calm so the headline stays readable.

### Studio previews
`img/studio/` holds the preview photographs (`<name>.webp`, 960 × 1200) and a mask for each (`<name>-mask.png`, white
where the frosting is). List them in `data/designer.js → previews` with the shape and piping styles each one shows.

## Accessibility and performance
Keyboard navigation throughout (dialogs, gallery, carousel, menu), visible focus, skip link, alt text on every
photo, labelled form fields with error messages, and `prefers-reduced-motion` support (no parallax, no
autoplay). Images are WebP with `srcset` and lazy loading; the hero photograph is about 0.2 MB on desktop and 0.13 MB on phones, and is preloaded.

## Hosting
Static files only. Serve the folder from any web host. `index.html` has a `<base href="/creme-motion/">` tag for
the Ciel Africa demo; a one-line script next to it switches paths to the page's own folder anywhere else (a client's
domain, another folder, or the file opened from disk). You can also simply change the tag to your folder, or `/`.

## Credits
See `img/CREDITS.md` and `credits.html`. Product and gallery photos are Unsplash placeholders.

Created by Ciel Africa.
