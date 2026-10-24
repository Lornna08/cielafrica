# NJIA — editorial streetwear store template

A Ciel Africa store template: an original streetwear label ("NJIA" is Swahili for "path") with a minimal, editorial shopping experience.

## What's inside
- **Home**: editorial hero, shop-by-category tiles, New Arrivals, "The details matter" editorial, Bestsellers (manually curated with `best: true`), lookbook teaser, Custom Made band, newsletter.
- **Collections** (`/shop/:id`): breadcrumbs, count, sort (Featured, Newest, Price), filters for category, size, colour, price and availability that really filter, removable filter chips, Clear all, mobile filter drawer and Load more. Filters are kept in the URL.
- **Quick view**: two-column modal with images, colour, size (required), stock, quantity and add to bag; focus trap, Esc to close, scroll lock.
- **Product page**: gallery with thumbnails (swipe on phones), colour and size with sold-out sizes, size guide, stock notes, accordions, related pieces, sticky add bar on phones, Product structured data.
- **Bag**, **checkout** (contact, address with Kenyan counties, delivery method, M-Pesa payment, order summary), **order confirmation**, **account** (orders, addresses, details), **lookbook** with shop-the-look, **Custom Made** enquiry form with reference images, help pages, search, photo credits.

## Customise
- `config/store.config.js`: name, colours, currency, delivery rates, discount codes, navigation, contact details, Custom Made form endpoint.
- `data/catalog.js`: products, collections, editorial images, lookbook, size guide.
- `data/credits.js`: photo credits.

## Template mode
`store.demo: true` keeps the bag, orders and account in the browser and simulates the M-Pesa prompt (nothing is charged). To go live, connect `NJIA.db` and `NJIA.pay.mpesa` in `js/core.js` to your back end (for example a WooCommerce or custom API). The server should send the STK push and confirm it with an STK query before marking an order paid. Never put API keys in front-end files.

## Images
Photos are served from the Unsplash CDN (hotlinked as the Unsplash API guidelines require) and credited on `/njia/credits`. They are styling placeholders, not photos of NJIA products. Replace them with your own product photography before launch.

Serve the folder from a web server at `/njia/` (deep links rely on the rewrite in `vercel.json`).
