# Ciel Shop

Commerce operations software by Ciel Africa: products, inventory, orders, an order board, batches with expiry, warehouses, suppliers and purchase orders, customers, returns, analytics and reports.

| URL | File | What it is |
| --- | --- | --- |
| `/ciel-shop` | `ciel-shop.html` (site root) | Public product page, in the Ciel Africa site style |
| `/ciel-shop/demo` | `ciel-shop/demo.html` | The live interactive demo. No sign-up needed. |
| `/templates` | `templates.html` | Ciel Shop is the first, featured card |

## How it's built

Plain HTML, CSS and JavaScript, the same as the rest of cielafrica.com. There's no build step and no npm. It deploys the way the site already does: push to GitHub and Vercel publishes it. It also runs straight from the zip if you open it in a browser, though serving it over a local web server is recommended.

```
ciel-shop/
  demo.html            app shell (loads the scripts below in order)
  css/app.css          design system: tokens, layout, tables, board, dialogs, responsive rules
  js/data.js           demo dataset generator (see "Demo data")
  js/store.js          the single data layer: selectors, rules, actions, persistence
  js/ui.js             formatting, icons, data table, dialogs, menus, toasts, CSV export
  js/charts.js         dependency-free SVG charts with tooltips
  js/app.js            router, sidebar, top bar, search (Ctrl/⌘K), notifications, demo banner
  js/pages-insights.js dashboard, analytics, reports
  js/pages-catalog.js  products, product workspace & form, inventory, batches, warehouses
  js/pages-orders.js   orders, order detail & form, order board, returns, customers
  js/pages-supply.js   suppliers, purchase orders, settings
assets/css/ciel-shop.css   product page + featured template card styles
assets/img/ciel-shop/      screenshots, share image, preview reel (mp4 + webm)
```

## Business rules (enforced in `store.js`)

- **Available = on hand − reserved.** Reserved is the sum of open orders (New → Ready to ship) in that warehouse. Orders can't be confirmed beyond available stock.
- **Batches are the source of truth for stock.** On-hand stock is the sum of batch remainders. Shipping, transfers, damage and write-offs consume batches first-expiry-first-out when FEFO is on, and oldest receipt first otherwise.
- **Every stock change writes a movement** recording the product, quantity, type, warehouse, batch, reference, reason, user and time. The Inventory page checks that the ledger reconciles with on-hand stock for every product.
- **Payment and fulfilment are separate.** Fulfilment runs Draft → New → Processing → Packing → Ready → Shipped → Delivered, or ends Cancelled or Returned. Orders can move backwards before shipping. Once shipped, goods come back only through a return.
- **Returns restock only resellable items.** Damaged returns are held as damaged stock until disposed of.
- **Receiving a purchase order** creates batches (with expiry dates for dated products), clears incoming stock and writes receipts. Partial receipts are supported.
- **Expiry dates** apply only to products with expiry tracking switched on.
- **Every figure in the dashboard, analytics and reports** is computed from the same orders, returns and movements. Nothing is hard-coded. Gross profit is calculated excluding VAT, at 16% by default.

## Demo data

`data.js` simulates about 200 days of trading for a fictional retailer, *Mawe Home & Pantry*. That covers daily orders across channels, payments, picking and shipping, returns, purchase orders, transfers between warehouses, damage, and expiry write-offs. The simulation is seeded, so it produces the same story every time, with dates anchored to the visitor's "today". All customers, suppliers and contact details are invented. Emails use `example.com`.

Sample product photos are from Unsplash and live in `ciel-shop/img/products/` (256px WebP, 241KB in total). They're used under the Unsplash License, each download was registered through the Unsplash API, and credits are in `img/products/CREDITS.md` and under Settings → Photo credits in the demo. Products added in the demo can have their own photo uploaded.

Changes are stored in the visitor's browser under `localStorage["cielshop:demo:v4"]`. UI preferences are stored under `cielshop:demo:ui`. Nothing is sent to a server. **Reset demo** in the top bar regenerates the dataset. If a visitor hasn't changed anything, the data refreshes after 12 hours so dates stay current.

The demo never takes payments, sends messages or books couriers. "Mark as paid" and "Record refund" only record the event.

## Price shown on the site

The starting price comes from the `tpl-cielshop` entry in `data/templates.js`, as `price` in KES. You can edit it in `/admin` with the other templates. Set it to `0` to show "On request" instead.

## What a production deployment adds

The public demo is deliberately client-only. A customer deployment adds:

- **Authentication and roles**: owner, manager, warehouse and sales, with per-warehouse permissions.
- **A server database**, such as PostgreSQL, with one schema per business or a `tenant_id` on every table:
  `products`, `variants`, `warehouses`, `batches(product_id, warehouse_id, number, qty_received, qty_remaining, unit_cost, mfg_date, expiry_date, po_id)`, `stock_movements` (append-only), `orders`, `order_lines`, `order_line_batches`, `payments`, `refunds`, `returns`, `return_lines`, `customers`, `suppliers`, `purchase_orders`, `po_lines`, `users`, `audit_log`.
- **Transactions** around shipping, receiving, transfers and adjustments, so batch quantities and movements always commit together.
- **Server-side validation** of the rules above.
- **Integrations** configured per customer: M-Pesa (Daraja), card payments, couriers, online store sync and accounting export. None of these are live in the demo.
