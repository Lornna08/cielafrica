# Photo Books

## /photobooks (current)

The customer-facing Photo Books site is a single page app at **/photobooks** (`photobooks/index.html`):

| Route | What |
|---|---|
| `/photobooks` | Landing: category strip, cover carousel, 3 steps, collections, Kenya, price by pages, FAQ |
| `/photobooks/travel`, `/kenya`, `/event`, `/couple`, `/friends`, `/baby`, `/pets`, `/family`, `/year`, `/someone`, `/blank` | Category page: cover gallery, cover and colour picker, pages, "Start my … book" |
| `/photobooks/design?t=<template>&c=<colour>&n=<pages>` | Editor (creates a book and continues at `?p=<id>`) |
| `/photobooks/my-books` | Books saved in this browser |

| Piece | File |
|---|---|
| Router, landing, category pages, template chooser, my books | `assets/pbk/app.js` |
| Editor: cover designer with live book preview, pages (1–2 photos, move, resize, crop), text, stickers, colours, layouts, preview, order, print PDF | `assets/pbk/editor.js` |
| Renderer for covers and pages (canvas), book mockup | `assets/pbk/render.js`, `assets/pbk/mockmap-sm.png` |
| Illustrated covers and categories | `assets/pbk/catalog.js` |
| Sticker and illustration library (original vector art) | `assets/pbk/art.js` |
| Travel covers (generated list) | `assets/pbk/covers.js`, images in `assets/pbk/c/` (`f` flat cover, `p` cover with the title removed, `m` mockup) |
| Book size, pages and price by pages | `data/photobooks.js` → `book` |
| Styles | `assets/pbk/pbk.css` |
| Asset tools | `tools/pbk/` (see its README) |

Every book is portrait A4, 21 × 29.7 cm (a 1200 × 1697 design space; books made earlier at 21 × 28 cm move over automatically). The left 100 units are the spine side. The CIEL AFRICA mark is drawn by the renderer at a fixed size and position (`BRAND` in `render.js`), or is part of the artwork on the travel covers, and nothing can be placed over it.

**Prices:** `book.price` starts as `null` ("Price coming soon"). Price = `base + (pages − includedPages) × perExtraPage`. `book.ordering` stays `false` until online ordering and payment are connected; until then the Order step offers a WhatsApp order request and a print PDF (cover + pages, 200 dpi, no bleed).

Photos stay in the customer's browser (IndexedDB, `assets/js/pb/store.js` + `photos.js`) until a printed book is paid for.
### Orders, payment and print files

- **Cart:** books go into the site cart as photo-book items (`assets/js/cart.js`). Checkout at **/photobooks/checkout** (`assets/pbk/shop.js`): printed hardcover or print-ready PDF, delivery, gift details, M-Pesa STK or an order request on WhatsApp.
- **Server:** `api/photobooks.js` routes `pbk-quote`, `pbk-pay`, `pbk-status` (prices from `data/photobooks.js → book`, payment confirmed with Daraja's STK Query), `pbk-verify`, `pbk-upload`, `pbk-upload-done`.
- **After payment** the customer's device renders every page at 300 dpi with 3 mm bleed plus small preview pages and uploads them to the **private Vercel Blob store** `cielafrica-photobooks` (`lib/photobooks/blobstore.js`). Paid PDFs download only with a signed receipt.
- **Orders inbox:** **/photobooks/orders** (sign in with the `ADMIN_PASSWORD` environment variable): customer and delivery details, gift notes, status updates, a flip-through preview of each book, every print page, and a print-ready PDF (216 × 303 mm with TrimBox 210 × 297 mm), and the whole cover in one piece (back · spine · front).
- **Editor extras:** photo editor (`photoedit.js`: crop with aspect ratios, filters, background removal with U²-Net small via onnxruntime-web, erase/restore brush), flip-book preview (`flip.js`, page-flip MIT), copy protection (`protect.js`).


---

## Earlier studio (redirects to /photobooks)

Customers create a personalised photo book at **/photobooks**, design it in the studio at **/photobooks/studio**, and buy a print-ready PDF or a printed book delivered in Kenya.

## How it works

| Piece | Where |
|---|---|
| Landing page (hero, designs, examples, pricing, FAQ) | `photobooks/index.html`, `assets/js/pb/landing.js`, `assets/css/pb-landing.css` |
| Studio: My books, new book, photos, editor, preview, order | `photobooks/studio.html`, `assets/js/pb/studio.js`, `editor.js`, `checkout.js` |
| Design engine: layouts, auto-layout, covers, text, validation, pricing | `assets/js/pb/engine.js` (runs in the browser and on the server) |
| Cover illustrations (original vector art) | `assets/js/pb/art.js` |
| Print-ready PDF renderer (pdf-lib + fontkit) | `assets/js/pb/pdf.js`, `assets/vendor/` |
| Curated fonts (OFL) and their metrics | `assets/fonts/pb/`, `assets/js/pb/metrics.js` (`tools/pb-metrics.py`) |
| Device storage (IndexedDB) | `assets/js/pb/store.js`, `photos.js` |
| Server: prices, M-Pesa, receipts, orders, print files, admin | `api/photobooks.js` → `lib/photobooks/handler.js` |
| Admin | `/photobooks/admin` (`assets/js/pb/admin.js`) |
| Customer order status | `/photobooks/order?t=…` |
| Configuration (formats, prices, delivery, templates) | `data/photobooks.js` |

The editor preview (SVG) and the PDF are drawn from the **same draw lists** produced by `engine.js` from the saved project, using the same font files and the same text measurements.

### Storage and privacy

- Projects and photographs are stored in the customer's browser (IndexedDB) on their device. Nothing is uploaded while designing. Originals are kept unchanged for print; 1600 px and 420 px copies keep the editor fast.
- A book can only be reopened in the browser where it was made. Cross-device accounts would need server photo storage (not built).
- Printed orders: after payment, the customer's browser renders the approved version's interior and cover PDFs and uploads them in 2 MB chunks to Redis, tied to the order. They expire after 180 days; delete them in the admin once printed.

### Payments

1. The customer approves one exact version. Its SHA-256 (design + every photo's content hash) is saved on the device.
2. `pay` prices it on the server from `data/photobooks.js` and sends an M-Pesa STK push (existing `MPESA_*` keys).
3. `status` asks Daraja's STK Query API. Only a confirmed payment returns an HMAC-signed receipt bound to that design hash. Paid orders are finalised once (Redis `SET NX`).
4. Before building the paid PDF, the browser calls `verify` with the receipt and the design hash; a forged or edited receipt is refused.

Limitation: because photos never leave the device, the final PDF is assembled in the customer's browser after server verification. A technically skilled person could run the renderer without paying; preventing that completely needs server-side rendering with server photo storage.

## Setup checklist (Vercel → Settings → Environment Variables)

| Variable | Needed for |
|---|---|
| `MPESA_*` (already set) | Taking payment |
| `ADMIN_PASSWORD` | `/photobooks/admin` sign-in and publishing prices |
| `GITHUB_TOKEN` | "Publish" in the admin (writes `data/photobooks.js`, like the main admin) |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` (Vercel → Storage → Upstash Redis, free tier) | Order records, the orders list, **printed orders** and print files |
| `RESEND_API_KEY`, `MAIL_FROM`, `MAIL_TO` (already set) | Order emails |
| `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` (optional) | AI title/style suggestions. Without it, built-in suggestions are used. |
| `PHOTOBOOKS_AI_MODEL` (optional) | Override the AI model |

## Prices

Every price in `data/photobooks.js` starts as `null` ("not set"); a product can't be bought until it is priced. Set prices in **/photobooks/admin → Formats & pricing → Publish**, or edit the file.

- Digital: `base + max(0, pages − includedPages) × perExtraPage` per format.
- Printed (per copy): binding `base + extra pages × perExtraPage` + `paper.perPage × pages`, × quantity, + delivery.
- Turn `print.enabled` on for a format only after your printer confirms the trim size, bleed, binding, paper and spine thickness (`papers[].mmPerPage`).

## Managing printed orders

Admin → Orders: filter by status, product, date or customer; open an order to see contact and delivery details, download the approved interior and cover PDFs (checksum-verified), update the status (optionally emailing the customer) and delete the files after printing. Statuses: Awaiting payment → Paid → Preparing print files → Ready for printing → Printing → Ready for collection / Dispatched → Delivered (or Cancelled / Refunded with the M-Pesa reversal reference).

## Example photos

The landing page examples use licensed Unsplash photos already in this repo; credits in `assets/img/pb-demo/CREDITS.md`. Customer photos are never used.

## Sample-filled books (v2)

- New books start from **Choose a design** (`/photobooks/studio#/new`). Each design opens as a finished book filled with sample photos from `data/pb-samples.js` (Unsplash, hotlinked with photographer credit; a few licensed copies live in `assets/img/pb-demo/`).
- Customers add photos from the editor's guide bar; `PBApp.fillSamples()` puts them into sample frames in reading order (cover first). Tapping a photo shows **Replace / Adjust / Remove**.
- Sample photos are never printable: `PBE.validate()` returns a `sample` error while any remain, which blocks preview approval, PDF export and ordering.
- The old describe-first flow is still available at `#/new/story`.
- Landing links can open a design directly: `/photobooks/studio#/new?t=<template>&go=1` (optional `&f=<format>`).

## November 2026 additions

- **Covers.** The CIEL AFRICA mark is drawn by the renderer on every front cover (small, near the bottom edge);
  it was removed from the travel artwork. Years are live text (2026 by default) and can be changed on the
  category page and in the editor; Year covers carry a year too. "Shadow behind the words" is a real,
  visible drop shadow and can be switched on or off.
- **Back cover** (`PBKShop.backDoc`): cover colour, a map sticker of the place for travel and Kenya covers
  (`assets/pbk/maps/`), the cover's own artwork for the others, and cielafrica.com / hello@cielafrica.com
  bottom right.
- **Editor.** Artwork (travel cut-outs), emoji and word stickers; 26 fonts (loaded on demand); lock;
  movable empty frames; photos dragged from the library onto frames or onto pages in the strip (press and
  hold on phones); uploaded stickers can be cropped, adjusted and cut out; "Undo edit" and "Original" per photo.
- **Preview.** Always an open book (two pages), also on phones; no page shake; no pinch zoom.
- **Prices.** Print-ready PDF from KES 1,600 (`data/photobooks.js → book.digital`).
- **Test order.** The "Ciel Test" book (category Someone) is only listed in a browser that is signed in to
  `/photobooks/orders`, and the server only accepts its KES 5 price (`book.testPrice`) with the admin session.
  Test orders are marked TEST and are deleted with their files after 24 hours (when the inbox loads, and by the
  daily cron `/api/photobooks?route=pbk-cron`; set `CRON_SECRET` in Vercel to lock that route to Vercel's cron).

## Ciel HQ (/admin) and order follow-up

- `/admin` is **Ciel HQ**: overview (revenue, orders to handle, what needs attention), all orders in one list
  (photo books, website shop, domains), calendar, task board, customers with notes, and links to every tool.
  Sign-in is checked on the server with `ADMIN_PASSWORD`; the same session works for Photo Book orders and Domains.
  Data: `lib/hq/handler.js` (`/api/hq`), private Blob `hq/*.json`; shop orders are recorded by `/api/stkquery`
  in `shop/orders/` when M-Pesa confirms a payment. The old content manager is at `/admin/content`.
- Customers can track an order at `/photobooks/track` (order number + phone or email, or the signed link in
  their emails). Status changes made in HQ or Photo Book orders email the customer (branded template:
  `lib/photobooks/mail.js`).
- Cover artwork: four covers use photo cut-outs from Unsplash (`assets/pbk/art2/CREDITS.txt`).
