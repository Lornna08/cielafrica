# MOKARA — specialty coffee store template

A Ciel Africa store template for a premium specialty coffee roaster. MOKARA is an original sample brand; its products, prices and reviews are demonstration content.

## What's inside
- **Home**: a full-screen product showcase (the signature interaction). Each coffee has its own background colour, packshot, tasting notes, rating, sizes, price and add to cart, with fluid transitions, autoplay with progress, thumbnails, arrows, keyboard and swipe support, parallax and floating beans. Then: the coffee collection, coffee origins, from bean to cup, a *find your perfect coffee* matcher, brew guides for five methods, the brand story and a newsletter sign-up.
- **Shop** (`/shop`): filters for roast, flavour and brew method, and sorting. Filters are kept in the URL.
- **Product pages** (`/coffee/:id`): gallery, size, whole bean or ground, grind size, quantity, add to cart, tasting profile, origin and processing details, brewing recommendations, reviews with a review form, related coffees and a sticky add bar on phones.
- **Cart** drawer and page, discount code, free-delivery progress, **checkout** (contact, delivery, M-Pesa), **order confirmation** and photo **credits**.

## Customise
- `config/store.config.js`: name, colours, currency, pack sizes and price factors, grind options, delivery rates, discount codes, newsletter endpoint and contact details.
- `data/catalog.js`: coffees (origin, roast, process, notes, profile, price, colours), origins, the bean-to-cup steps, brew recipes and photos.

## Template mode
`store.demo: true` keeps the cart, orders, reviews and newsletter sign-ups in the browser and simulates the M-Pesa prompt (nothing is charged). To go live, connect `MOKARA.db` and `MOKARA.pay.mpesa` in `js/core.js` to your back end. The server should send the STK push and confirm it with an STK query before an order is marked paid. Never put API keys in front-end files.

## Images
- `img/p/`: packshots of the bags, tin, espresso cup and beans are original 3D renders made for this template (transparent WebP at two sizes). Replace them with your own product photography using the same file names.
- Origin, bean-to-cup and brewing photographs are Unsplash images, loaded from images.unsplash.com and credited on `/mokara/credits`. They are placeholders, not photos of MOKARA's farms.

Serve the folder from a web server at `/mokara/` (deep links rely on the rewrite in `vercel.json`).
