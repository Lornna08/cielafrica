# CRÈME MOTION — bakery & dessert website template

A Ciel Africa template for cake shops, bakeries, patisseries, dessert studios and cupcake businesses.
*Velvet & Crumb* is a sample brand. Its products, prices, reviews and contact details are demonstration
content and must be replaced for each client.

## What's inside
- **Signature hero**: an original 3D film of a cake being cut. The knife makes two cuts, the slice turns out to
  show the sponge, cream and raspberry layers, crumbs fall and the camera moves in. The headline appears as the
  slice is revealed. There is a portrait version for phones. With *reduced motion* turned on, a still of the cut cake is
  shown instead and nothing animates.
- **Signature Collection**: an editorial grid with category filters (seven sample categories), hover image swaps,
  availability badges and a one-tap **Order on WhatsApp** button on every product.
- **Product view** (`#product/<id>`, so it can be shared): photo gallery (arrows, thumbnails, swipe, keyboard),
  sizes with their own prices and servings, flavours, quantity, a note or cake message, availability and
  notice time, product details, **Order on WhatsApp** and **Add to order list**.
- **Order list**: collect several products, pick a date and delivery or collection, then send everything in one
  WhatsApp message. Saved in the visitor's browser.
- **The Cake Experience**: six editorial chapters (layers, cream, fillings, frosting, details, the moment) with a
  pinned image that changes as you scroll on desktop.
- **Custom Cake Orders**: occasion, size, flavour, design, reference photo upload with preview, servings, date
  (earliest date respects the notice period), delivery or collection, address, instructions and contact details,
  with validation.
- **About**, **Testimonials** (carousel), **Gallery** (filters and a full-screen viewer) and **Contact &
  Ordering** (WhatsApp, how ordering works, delivery and collection, fees, hours, contact, social links, FAQ).
- Animated mobile menu, a floating WhatsApp button, scroll reveals, parallax and View Transitions where the browser
  supports them.

## Set it up for a new bakery
You only edit three files and the photos. Nothing in `js/` or `css/` needs to change.

1. **`config/site.config.js`**
   - `brand`: name, short name, tagline, logo (`logo: 'img/brand/logo.svg'`; leave empty for a wordmark), favicon.
   - `theme`: the colours. `fonts`: a Google Fonts URL and the two family names.
   - `hero`: kicker, headline lines, text, buttons, the hero video for desktop and phone, the poster and still
     images, `revealAt` (seconds into the film when the headline appears) and the alt text.
   - **`whatsapp.number`**: the business WhatsApp number, international format, digits only (for example
     `2547XXXXXXXX`). Also the greeting and closing lines used in every message.
   - `orders.endpoint`: optional. If set, the custom cake form is POSTed there as `multipart/form-data`
     (all fields, the reference image and a ready-made `summary`). Works with Formspree, Getform, Basin or your own
     API. If empty, the enquiry is sent as a WhatsApp message.
   - `contact`, `social` (only links with a URL are shown), `delivery`, `about`, `customForm` (the options in each
     drop-down), `nav` and `seo`.
   - Set **`demo: false`** for a real bakery. This removes the "Sample review" labels and the delivery fee note.
2. **`data/menu.js`**: categories and products (name, description, photos, sizes and prices, flavours,
   availability, notice, details). Products link as `#product/<id>`.
3. **`data/content.js`**: the Cake Experience chapters, reviews, gallery photos and filters, ordering steps and FAQ.
4. **Photos**: put product and gallery photos in `img/p/` as `name-800.webp` and `name-1600.webp` and refer to them
   by `name`. Replace `img/brand/og.jpg` (1200 × 630) and the favicon.

### WhatsApp messages
Messages are written for the customer, for example:

> Hello! I'd like to order the Chocolate Fudge Cake. Size: 8 inches. Flavour: Mocha fudge. Please confirm availability.

Without a number (template mode) each button shows the message first and can open WhatsApp so the visitor chooses the chat.
With a number set, buttons open that chat directly.

### The hero film
`img/hero/` holds the film as MP4 (H.264) at 1440 × 810 for desktop and 720 × 1280 for phones, plus a first-frame
poster and a final-frame still for each. To use the bakery's own footage, export the same two sizes, keep the
first and last frames as WebP stills, and update `hero` in the config. Keep the left side of the desktop frame (and the
top of the phone frame) quiet so the headline stays readable.

## Accessibility and performance
Keyboard navigation throughout (dialogs, gallery, carousel, menu), visible focus, skip link, alt text on every
photo, labelled form fields with error messages, and `prefers-reduced-motion` support (no film, no parallax, no
autoplay). Images are WebP with `srcset` and lazy loading; the hero film is about 0.6 MB on desktop and
0.4 MB on phones and starts from a poster frame.

## Hosting
Static files only. Serve the folder from any web host. `index.html` has a `<base href="/creme-motion/">` tag for
the Ciel Africa demo; a one-line script next to it switches paths to the page's own folder anywhere else (a client's
domain, another folder, or the file opened from disk). You can also simply change the tag to your folder, or `/`.

## Credits
See `img/CREDITS.md` and `credits.html`. Product and gallery photos are Unsplash placeholders.

Created by Ciel Africa.
