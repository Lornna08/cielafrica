# Ciel Africa — Website

A static, art-directed marketing site for **Ciel Africa**, a software engineering and
digital product studio. No build step, no framework — just HTML, CSS and vanilla JS,
so it deploys anywhere (Vercel, Netlify, cPanel, any static host).

## Structure

```
index.html              Homepage (9 distinct art-directed sections)
services.html           Services accordion (10 categories, FAQ)
templates.html          Website collection gallery (filter/search/sort)
products.html           Digital products gallery
work.html               Selected work (editorial rows)
about.html              About + founder (Lorna Matu)
insights.html           Blog index (placeholder posts)
contact.html            Contact details + CTAs
quote.html              Request-a-quote form (front-end)
privacy.html terms.html Legal templates

assets/css/base.css         Design tokens, type scale, buttons, reveal
assets/css/components.css    Every section + component treatment
assets/js/site.js            Nav, mobile menu, scroll reveal, helpers
assets/js/render.js          Card / row / preview renderers
assets/js/home.js            Homepage: showcase tabs, collection rail
assets/js/gallery.js         Templates/products/work filtering
assets/js/quote.js           Quote form: prefill, validate, confirm
assets/img/logo.svg          Logo mark

data/templates.js   Edit website templates here
data/products.js    Edit digital products here
data/work.js        Edit portfolio + insights here
data/mockups.js     UI mockups + showcase list for the homepage
```

## Editing content

All catalogue content lives in `data/*.js` as plain arrays — **no code changes needed**.
Add or edit objects, and set the `image` field to your own file (drop images into
`assets/img/…`) to replace the generated placeholder previews.

- **Categories** must match the `*Categories` arrays for filtering to work.
- **Badges/sorting**: `new: true` and `popular: true` control badges and sort tabs.

## The quote form

`quote.html` is **front-end only** — on submit it validates and shows a confirmation,
but does not yet send anything anywhere. To actually receive submissions, wire it to a
backend at the marked `TODO` in `assets/js/quote.js`. Options:

- A form service (Formspree, Basin, Web3Forms) — paste your endpoint into a `fetch`.
- A Vercel serverless function at `/api/quote` that emails you the `FormData`.

## Deploying to Truehost (cPanel)

You have hosting space and the `cielafrica.com` domain on Truehost, so the simplest
path is to upload the files directly:

1. Log in to your Truehost **cPanel** and open **File Manager**.
2. Go to `public_html/` (this is the folder that serves `cielafrica.com`).
3. Upload **everything inside this folder** — the `.html` files plus the `assets/`
   and `data/` folders — into `public_html/`. Keep the folder structure intact.
   (Easiest: zip the contents, upload the zip, then "Extract" inside cPanel.)
4. Make sure `index.html` sits directly in `public_html/` — that's your homepage.
5. Visit https://cielafrica.com to check it. Enable free SSL (AutoSSL / Let's Encrypt)
   under cPanel's SSL/TLS if it isn't already on, so the site loads over https.

Notes for cPanel hosting:
- Links use full filenames (e.g. `/about.html`), so they work on Apache without any
  extra config. The `vercel.json` file is only used by Vercel and is harmless to leave
  in place or delete.
- To receive quote-form submissions on Truehost, you can use a small PHP script instead
  of a serverless function — see the note in `assets/js/quote.js` and point the form's
  `fetch` at a `send-quote.php` you add in `public_html/`.

## Alternative: deploying to Vercel

1. Push this folder to a GitHub repo.
2. Import it in Vercel. **Framework Preset: Other.** Leave Build Command and Output
   Directory empty. Root Directory `./` (or the folder that contains `index.html`).
3. `vercel.json` already sets clean URLs (so `/about` works), caching and security headers.

## Contact & team

- **General email:** info@cielafrica.com
- **Founder (direct):** lorna@cielafrica.com
- **Phone:** +254 117 959 105

**Team**
- Lorna Matu — Founder · Lead Developer · Creative Director
- Tariq Mbugua — Software Development
- Naya O — 3D, Motion & Visual Design
- Zawadi J — Marketing & Business Strategy

---
© Ciel Africa. Portfolio/template/product names in `data/` are neutral placeholders —
replace them with real content before launch.
