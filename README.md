# Ciel Africa

Premium software engineering & digital product studio website.
Static site (HTML / CSS / vanilla JS) — no build step. Deploys to Vercel as-is.

## Deploy to Vercel
1. Push this folder to a GitHub repository.
2. In Vercel, "Add New Project" → import the repo.
3. Framework preset: **Other** (no build command, output = root).
4. Deploy. `vercel.json` enables clean URLs, caching and security headers.
5. Add your domain `cielafrica.com` in Vercel → Project → Domains.

## Structure
```
index.html            Homepage
services.html         Services + pricing + FAQ
templates.html        Website templates gallery (filter/search/sort)
products.html         Digital products shop (filter/search/sort)
work.html             Portfolio / case studies
about.html            About + founder
insights.html         Blog / insights
quote.html            Request-a-quote workflow
contact.html          Contact
privacy.html terms.html
assets/css/           base.css (design system) + components.css
assets/js/            site.js, render.js, gallery.js, home.js, quote.js
assets/img/           logo.svg + your images
data/                 templates.js, products.js, work.js  <-- EDIT THESE
```

## Editing content (no code required)
- **Templates:** edit `data/templates.js`. Add objects; set `image` to a file in `assets/img/templates/`. Placeholder graphics show until you add images.
- **Products:** edit `data/products.js`.
- **Portfolio / case studies:** edit `data/work.js` (challenge, solution, results, tech, images).
- **Insights / testimonials:** edit the arrays in `data/work.js` (insights) and the testimonials block in `index.html`.

## Wiring up the quote form
The form in `quote.html` is front-end only. To receive submissions, connect
`assets/js/quote.js` (marked TODO) to a form service or a Vercel serverless
function at `/api/quote`. Until then it shows a confirmation screen.

## Brand
- Contact: Lorna Matu — lorna@cielafrica.com — +254 117 959 105
- Colors & type are defined as tokens at the top of `assets/css/base.css`.
