# Photo Books

Customers create a personalised photo book at **/photo-books**, design it in the studio at **/photo-books/studio**, and buy a print-ready PDF or a printed book delivered in Kenya.

## How it works

| Piece | Where |
|---|---|
| Landing page (hero, designs, examples, pricing, FAQ) | `photo-books/index.html`, `assets/js/pb/landing.js`, `assets/css/pb-landing.css` |
| Studio: My books, new book, photos, editor, preview, order | `photo-books/studio.html`, `assets/js/pb/studio.js`, `editor.js`, `checkout.js` |
| Design engine: layouts, auto-layout, covers, text, validation, pricing | `assets/js/pb/engine.js` (runs in the browser and on the server) |
| Cover illustrations (original vector art) | `assets/js/pb/art.js` |
| Print-ready PDF renderer (pdf-lib + fontkit) | `assets/js/pb/pdf.js`, `assets/vendor/` |
| Curated fonts (OFL) and their metrics | `assets/fonts/pb/`, `assets/js/pb/metrics.js` (`tools/pb-metrics.py`) |
| Device storage (IndexedDB) | `assets/js/pb/store.js`, `photos.js` |
| Server: prices, M-Pesa, receipts, orders, print files, admin | `api/photobooks.js` → `lib/photobooks/handler.js` |
| Admin | `/photo-books/admin` (`assets/js/pb/admin.js`) |
| Customer order status | `/photo-books/order?t=…` |
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
| `ADMIN_PASSWORD` | `/photo-books/admin` sign-in and publishing prices |
| `GITHUB_TOKEN` | "Publish" in the admin (writes `data/photobooks.js`, like the main admin) |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` (Vercel → Storage → Upstash Redis, free tier) | Order records, the orders list, **printed orders** and print files |
| `RESEND_API_KEY`, `MAIL_FROM`, `MAIL_TO` (already set) | Order emails |
| `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` (optional) | AI title/style suggestions. Without it, built-in suggestions are used. |
| `PHOTOBOOKS_AI_MODEL` (optional) | Override the AI model |

## Prices

Every price in `data/photobooks.js` starts as `null` ("not set"); a product can't be bought until it is priced. Set prices in **/photo-books/admin → Formats & pricing → Publish**, or edit the file.

- Digital: `base + max(0, pages − includedPages) × perExtraPage` per format.
- Printed (per copy): binding `base + extra pages × perExtraPage` + `paper.perPage × pages`, × quantity, + delivery.
- Turn `print.enabled` on for a format only after your printer confirms the trim size, bleed, binding, paper and spine thickness (`papers[].mmPerPage`).

## Managing printed orders

Admin → Orders: filter by status, product, date or customer; open an order to see contact and delivery details, download the approved interior and cover PDFs (checksum-verified), update the status (optionally emailing the customer) and delete the files after printing. Statuses: Awaiting payment → Paid → Preparing print files → Ready for printing → Printing → Ready for collection / Dispatched → Delivered (or Cancelled / Refunded with the M-Pesa reversal reference).

## Example photos

The landing page examples use licensed Unsplash photos already in this repo; credits in `assets/img/pb-demo/CREDITS.md`. Customer photos are never used.
