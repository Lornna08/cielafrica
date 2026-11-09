# APEX MOTION — automotive store template

A premium e-commerce storefront for wheels, tyres and performance parts, built by **Ciel Africa**.
Plain HTML, CSS and JavaScript: no build step, no framework, no dependencies beyond two Google Fonts.

Live demo: <https://cielafrica.com/apex-motion>

> **Demo mode.** Products, brands, prices, ratings, reviews and fitment data are samples.
> The bag, wishlist, account and orders live only in the visitor's browser (localStorage).
> Checkout is simulated: no payment is taken and no card details are collected.

---

## What's included

| Area | Details |
|---|---|
| Home | Hero with vehicle switcher and spec callouts, ticker, category tiles, "why us" section with a scroll-driven wheel, collections accordion, trending rail filtered by vehicle type, cinematic banner, journal, gallery, promo slider |
| Catalogue | `/shop`, `/shop/:category`, `/collections/:id`, `/performance` (dark technical look), `/search` — filters for vehicle, keyword, category, brand, price and stock; sort; grid/list view; load more; filters kept in the URL |
| Product page | Own URL per product, zoomable gallery, size and finish pickers, quantity capped by stock, fitment checker, specifications, delivery and returns, sample reviews, related products, Product JSON-LD |
| Fitment | Vehicle list with bolt pattern, centre bore and wheel diameters. Wheels match on all three; tyres on rim size; parts on a vehicle list. Every result says the data is a sample and should be confirmed. |
| Bag & checkout | Drawer and full bag page, discount codes (`APEX10`, `TRACKDAY`), free-shipping threshold, validated checkout, shipping methods, order confirmation with order number |
| Account | Demo sign-in, order history, saved addresses, wishlist, reset demo |
| Journal | Six articles with detail pages and Article JSON-LD |
| Info pages | Shipping, delivery, returns, fitment, FAQ, contact, about, privacy, terms |
| Quality | Responsive (1180 / 960 / 640 px breakpoints), keyboard shortcuts (`/` or Ctrl/⌘+K for search, Esc to close), focus management, reduced-motion support, Open Graph tags |

## Run it locally

The store uses clean URLs (`/apex-motion/product/...`), so serve it with any static server that falls back to `index.html`:

```bash
# from the repository root
npx serve -s .            # or any server with SPA fallback
```

Opening `apex-motion/index.html` straight from disk also works. The router switches to hash URLs (`#/shop`) automatically.

## Re-brand it

Everything brand-specific is in **`config/store.config.js`**:

- `store`: name, wordmark halves, tagline, description, `basePath`, demo flag
- `theme`: colours and font stacks. These are written into CSS custom properties at start-up, so you don't need to edit the CSS.
- `currency`, `shipping` (methods and free-shipping threshold), `discounts`
- `contact`, `policies`
- `home`: hero lines and labels, ticker items, promise points, promo slides, cinematic banner
- `credit`: the footer credit line

If you serve the store from a different folder, change `basePath`, the `<base href>` line in `index.html`, and the rewrite in `vercel.json`.

## Manage products

The catalogue is in **`data/catalog.js`**:

- `APEX.categories`, `APEX.brands`, `APEX.collections`, `APEX.gallery`
- `APEX.vehicles`: sample vehicles with `bolt`, `cb` (centre bore, mm) and `diameters`
- `APEX.products`: one call per product:

```js
p('w-04', 'Forged Monoblock R19', 'apex-forged', 'wheels', 890, {
  unit: 'per wheel', tags: ['forged', 'track'], stock: 18,
  rating: 4.9, reviews: 64,            // sample values: remove for a live store
  desc: '…',
  finishes: [{ n: 'Brushed silver', c: '#C9CBCC' }],
  sizes: ['19 × 8.5 ET35'],
  fit: { diameter: 19, bolts: ['5x112'], cb: 72.6 },
  specs: { Construction: 'Forged monoblock, 6061-T6' }
});
```

Product images go in `img/products/<id>.webp` (square, about 600 px). Journal articles are in `data/journal.js`. Bodies support `## ` headings and `> ` quotes.

## Going live

The demo keeps all state in `APEX.db` (`js/core.js`). To connect a real backend:

1. Load products from your API or CMS instead of `data/catalog.js` (keep the same object shape).
2. Replace `APEX.db.placeOrder` with a call to your order endpoint, and add a payment provider (Stripe, Paystack, Flutterwave, M-Pesa…) in the checkout's payment step.
3. Replace the demo sign-in with real authentication.
4. Remove the sample ratings and reviews, or feed real ones in, and set `store.demo` to `false`.
5. Have someone qualified check every fitment rule before you rely on it.

## Deploy

Static hosting is enough. On Vercel, this rewrite (already in the repository's `vercel.json`) serves deep links:

```json
{ "source": "/apex-motion/((?!.*\\.).*)", "destination": "/apex-motion" }
```

## Credits

Photography from Unsplash. See `img/CREDITS.md`. Fonts: Barlow Condensed and Inter (SIL Open Font License).
Store system by [Ciel Africa](https://cielafrica.com).
