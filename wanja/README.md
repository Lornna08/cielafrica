# Wanja Mwangi — portfolio (`/wanja`)

A personal editorial portfolio for Wanja Mwangi, housed inside the Ciel Africa site.
It replaces the Wix site at `wanjaa.wixsite.com/wanja` with the same content, photographs, services, rates and contact details.

## Pages

| URL | File |
|---|---|
| `/wanja` | `index.html`: cover, introduction, selected work, chapters, services, brands, invitation |
| `/wanja/portfolio` | `portfolio.html`: all four chapters |
| `/wanja/portfolio/lifestyle` · `/fashion` · `/glamour` · `/commercial` | same file. `vercel.json` rewrites these deep links, and `assets/wanja.js` reads the path. |
| `/wanja/about` | `about.html` |
| `/wanja/rates` | `rates.html` (the old `/wanja/rate-card` redirects here) |
| `/wanja/contact` | `contact.html`: direct channels plus the brand enquiry form |

The styles live in `assets/wanja.css` and load only on these pages, so nothing leaks into the rest of Ciel Africa.

## Updating content

Everything that changes lives in **`assets/data.js`**:

- **Photographs per chapter** (`CATEGORIES[].photos`), with alt text and chapter copy.
- **Rates** (`RATES`): copied exactly from the March 2026 rate card. **Update this list and replace `assets/wanja-mwangi-rate-card.pdf` whenever Wanja's pricing changes.**
- **Booking terms** (`TERMS`), **services** (`SERVICES`), **brands** (`BRANDS`) and **contact details** (`CONTACT`).

After editing, bump `?v=` on `data.js`, `wanja.js` and `wanja.css` in the five HTML files.

## Enquiry form

The form posts to the existing `/api/contact` function with `_form: "wanja"`. The server always sends these enquiries to `WANJA_MAIL_TO`, falling back to `wanjamary916@gmail.com`. It never uses an address supplied by the browser. Replies go straight to the sender.

If email isn't configured (`RESEND_API_KEY` missing) or Resend rejects the message, the visitor sees an error, along with ready-made email and WhatsApp links that carry their message. The form never shows success unless the server confirms delivery.

`MAIL_FROM` must be a domain that is verified in Resend. Otherwise Resend only delivers to the account owner.

## Image migration

Every photograph was downloaded from Wix's original media store (`static.wixstatic.com/media/<id>`), the full-size upload rather than Wix's resized copies.

- **Untouched originals:** `assets/img/original/`
- **Responsive WebP versions:** `assets/img/<slug>-<width>.webp`, at 480 and 800 px, 1200 px where the original is wider, and the original width (capped at 1600)
- **Not migrated:** one exact duplicate on the Wix site (`317c2f_d1bd4b2b…`, the same file as `cocoa-seated`)
- **Rate card PDF:** downloaded from `/_files/ugd/317c2f_f72f2a37…pdf` and kept as `assets/wanja-mwangi-rate-card.pdf`

| Slug | Chapter | Original Wix file | Size | WebP widths |
|---|---|---|---|---|
| `rooftop-cap-gaze` | Lifestyle & Venue Collaborations | `317c2f_67e9587a45fc44559c9d9774d94eab9f~mv2.jpeg` | 828×1466 | 480, 800, 828 |
| `blend-street` | Lifestyle & Venue Collaborations | `317c2f_1f81a95d92224bef9362c8518ec8fdb1~mv2.jpeg` | 1200×1600 | 480, 800, 1200 |
| `rooftop-cap-seated` | Lifestyle & Venue Collaborations | `317c2f_4bdf3c2f9ec443b59287422b31fb150e~mv2.jpeg` | 879×1564 | 480, 800, 879 |
| `cocoa-chair-lean` | Contemporary Fashion | `317c2f_83a2b281b8c445daaa7c83cee534323b~mv2.jpeg` | 1279×1600 | 480, 800, 1200, 1279 |
| `cocoa-standing` | Contemporary Fashion | `317c2f_6965a7e3defe4f7c893172b9bf755516~mv2.jpeg` | 1280×1600 | 480, 800, 1200, 1280 |
| `cocoa-smile-standing` | Contemporary Fashion | `317c2f_a11dbca5475d483b85e583164b27d3ac~mv2.jpeg` | 1279×1600 | 480, 800, 1200, 1279 |
| `cocoa-laugh-seated` | Contemporary Fashion | `317c2f_52e0f98a18f446b79e2e4194b30ef253~mv2.jpeg` | 1279×1600 | 480, 800, 1200, 1279 |
| `cocoa-portrait` | Contemporary Fashion | `317c2f_d31457f9697d49dd8306bb46f907dc3e~mv2.jpeg` | 1279×1600 | 480, 800, 1200, 1279 |
| `cocoa-seated` | Contemporary Fashion | `317c2f_1425c39b4c754417852bb1ea3ea8a784~mv2.jpeg` | 1279×1600 | 480, 800, 1200, 1279 |
| `noir-roses-seated` | Editorial Glamour | `317c2f_2eb2437135e04fec9f7a92d62386fc97~mv2.jpeg` | 1279×1600 | 480, 800, 1200, 1279 |
| `noir-roses-gesture` | Editorial Glamour | `317c2f_3d1f6a34da0d402787a79cd133caf398~mv2.jpeg` | 1279×1600 | 480, 800, 1200, 1279 |
| `noir-roses-standing` | Editorial Glamour | `317c2f_4673de3ae7eb468dabadb0e53b345dec~mv2.jpeg` | 1280×1600 | 480, 800, 1200, 1280 |
| `monochrome-portrait` | Editorial Glamour | `317c2f_90ef8c895e5a445a8ea7e1f4152d308e~mv2.jpeg` | 1066×1600 | 480, 800, 1066 |
| `tribe-crop-tee` | Commercial Brand | `317c2f_f5e89ef6f5a2442690c6b16fb29c6ff8~mv2.jpeg` | 757×1280 | 480, 757 |
| `tribe-grey-tee` | Commercial Brand | `317c2f_3b26ef0e482b4426bdfc451b255120c4~mv2.jpeg` | 718×1280 | 480, 718 |
| `tribe-hoodie-knees` | Commercial Brand | `317c2f_c5811924c4b54b36aa1b543bb4836c25~mv2.jpeg` | 1063×1280 | 480, 800, 1063 |
| `tribe-duo` | Commercial Brand | `317c2f_66096ca46ea747b09d5a23d0af5c5c22~mv2.jpeg` | 772×1280 | 480, 772 |
| `tribe-sweatsuit-back` | Commercial Brand | `317c2f_187ce04083e9467e94fc788f321955ef~mv2.jpeg` | 1600×1452 | 480, 800, 1200, 1600 |
| `tribe-hoodie-floor` | Commercial Brand | `317c2f_6168cf36219f4a729e345f225974a6f8~mv2.jpeg` | 718×1280 | 480, 718 |
| `event-pink-fleece` | Event appearances (rate card only) | `ratecard.pdf (page 1, embedded image)` | 420×630 | 420 |

`event-pink-fleece` is not on the Wix site. It is embedded on page 1 of the rate card PDF, and was extracted unchanged at 420×630.

### Brands worked with (homepage strip on the Wix site)

| Brand | Original Wix file | Here |
|---|---|---|
| NBO Closet | `317c2f_9490c4475e654a51b91a0522647e02c7~mv2.jpg` | `img/brands/nbo-closet-360.webp` |
| Tribe Nomad | `317c2f_b33b55571850487d8f6d271963003584~mv2.jpeg` | `img/brands/tribe-nomad-360.webp` |
| Vista Digital | `317c2f_8af0dcebbaa5498aab5bcd484a1da1fe~mv2.jpeg` | `img/brands/vista-digital-360.webp` |
| Lil Secret Resort | `317c2f_c6a102a7143a4565bf3d8f299c37740c~mv2.jpeg` | `img/brands/lil-secret-resort-360.webp` |
| Reside KE | `317c2f_13df10928ffb48a9b3d032c17ded29ef~mv2.jpeg` | `img/brands/reside-ke-360.webp` |
| ABC | `317c2f_cdf246a823ca4cff9dcf43cff4b25604~mv2.jpeg` | `img/brands/abc-360.webp` |

### Left out deliberately

- **Wix social icons** (`11062b_*`, Wix stock icons) and **Wix background gradients** (`c837a6_*`).
- **Green metallic gown** (`317c2f_2cf19bc8…`): a Wix-protected (token-signed) image on the old Portfolio page that doesn't show Wanja. If it is her work, add it to `data.js`.

## Sources

| Item | Source |
|---|---|
| Name, tagline, location, phone, Gmail address | Wix homepage ("Get in Touch") and the rate card |
| `wanja@nbocloset.com` | Email icon in the Wix social bar |
| Instagram `@wanjah._`, TikTok `@wanjah._`, X `@wanja16_` | Wix social bar (the rate card also lists `@wanjah._`) |
| Chapter descriptions | The four Wix portfolio project pages. Spelling was corrected ("Lifestye & Venue Collabrations"), but the wording is unchanged. |
