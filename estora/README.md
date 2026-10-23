# ESTORA — Real Estate CRM by Ciel Africa

ESTORA is a standalone real estate workspace for agencies: listings, leads, contacts, deals, rentals,
commissions, calendar, documents, analytics and team chat. This folder holds two things:

| Path | What it is |
| --- | --- |
| `index.html` | Public product website (`/estora/`) — hero, features, interactive preview, workflow, deployment, pricing, FAQ |
| `demo.html` | The interactive demo (`/estora/demo.html`) — the full app running on sample data, no sign-up |

Both are static: plain HTML, CSS and JavaScript, no build step and no server code. They deploy as part of
the main Ciel Africa site on Vercel.

## Running locally

Any static file server works. From the repository root:

```bash
python3 -m http.server 8000
# open http://localhost:8000/estora/ and http://localhost:8000/estora/demo.html
```

Opening `demo.html` directly from the file system also works in most browsers.

## Folder layout

```
estora/
  index.html            product website
  demo.html             demo app shell (loads the scripts below in order)
  css/site.css          product website styles
  css/app.css           application design system (tokens, components, responsive rules)
  js/data.js            ES.config, constants and the synthetic data generator
  js/store.js           data layer: state, selectors, actions, persistence
  js/ui.js              formatting, icons, components, modals/drawers, SVG charts and the pricing gauge
  js/app.js             shell: demo bar, top bar, tabs, router, search, notifications, chat panel
  js/pages-overview.js  dashboard
  js/pages-listings.js  listings, property workspace, pricing tool, listing form
  js/pages-deals.js     deals board, deal workspace, sales, commissions
  js/pages-crm.js       leads and contacts
  js/pages-ops.js       rentals, calendar, tasks, documents, team, analytics, settings
  img/p/                property photography (Unsplash)
  img/a/                team portraits (Unsplash)
  img/shots/            screenshots used on the product website
  img/CREDITS.md        photographer credits
```

## How the demo works

- **Routing** — hash routes (`#/overview`, `#/listings`, `#/property/p1041`, `#/deal/d2038`, `#/leads?lead=…`),
  so no server rewrites are needed. Each page registers itself as `ES.pages[name] = { render(view, params) }`.
- **Data** — `ES.generate(now)` builds an agency ("Northgate Realty", Nairobi and the coast) with a seeded
  random generator, so the same data appears every time. Dates are generated relative to today, so the
  calendar, follow-ups and charts always look current.
- **Store** — `ES.store` is the single source of truth. Pages read through selectors (`kpis`, `commission`,
  `weighted`, `commissionSeries`, …) and change data only through actions (`moveDeal`, `setPrice`,
  `convertLead`, `recordPayment`, `sendMessage`, …). Subscribers re-render after every change.
- **Business rules** — sale commission is a percentage of the final price (3% by default); a letting earns
  one month's rent. Closing a deal as won marks the listing sold or let, records commission as *earned*
  and, for rentals, creates a lease. Expected (weighted pipeline) and earned commission are always kept
  separate. Stage probabilities live in `ES.STAGES`.
- **Persistence** — state is saved to `localStorage` under `estora:demo:v1`. Untouched sessions refresh
  after 12 hours and edited ones after 30 days. **Reset demo** (with confirmation) restores the sample data.
- **Chat** — the team chat is simulated: messages you send stay in your browser and a teammate "replies"
  after a short typing indicator.
- **Uploads** — listing photos are downscaled in the browser and stored as data URLs; document uploads
  record metadata only. Files never leave the browser.

## Configuration

Agency name, currency, commission rate, letting fee and monthly team target are in `ES.config`
(`js/data.js`) and can also be changed in **Settings** inside the demo.

Pricing on the product website is set by one object near the bottom of `index.html`:

```js
var PRICING = { mode: 'published', licenceFrom: 30000, currency: 'KES' };
```

Set `mode` to anything other than `'published'` (e.g. `'quote'`) to hide the figure and show "Request a quote" instead.

## Photography

All photographs are from Unsplash and are stored locally as optimised WebP files so the demo never
depends on a third-party image host. Credits are in `img/CREDITS.md`. To swap a photo, replace the file
with one of the same name, or add a new one to `img/p/` and reference it from `js/data.js`.

All people, properties, prices, phone numbers and messages in the demo are fictional. There are no
testimonials or client logos.

## Accessibility and devices

- Keyboard-reachable navigation, visible focus rings, labelled icon buttons, `Esc` closes dialogs and drawers.
- Drag-and-drop on the deals board always has a menu alternative ("Move to…") on every card.
- `prefers-reduced-motion` is respected.
- Layouts adapt at 1380, 1180, 900 and 640 px. On phones the tabs collapse into a menu and chat opens as its own page.

## Taking it to production

The demo is a faithful front end, not a finished multi-user system. A production build replaces the
`localStorage` store with an API and database while keeping the same actions and selectors:

- authentication, roles and per-agent permissions
- a database (e.g. PostgreSQL) and an API implementing the store actions
- file storage for photos and documents (e.g. S3-compatible) with virus scanning
- real-time chat (WebSockets) and email/SMS/WhatsApp notifications
- optional integrations: property portals, M-Pesa reconciliation, email sync, e-signature
- audit log, backups and data export

Ciel Africa offers this as a managed cloud deployment, an install on your own server, or a custom build.
Contact: +254 706 549 703 or `quote.html?template=ESTORA`.
