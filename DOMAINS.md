# Ciel Domains — setup & operations

Live at **cielafrica.com/domains** · admin at **cielafrica.com/domains/admin** · terms at **/domains/terms**.

Customers search, get honest availability and creative alternatives, and order. You fulfil each registration by hand on Truehost, then record it in the admin. Payment comes first, and every payment is confirmed with the provider on the server.

---

## 1. How it works right now

- Customers search, choose a domain, enter their details and **pay with an M-Pesa STK push** in the checkout. There is no review step.
- Every payment is confirmed with Safaricom (STK Query) on the server before it counts.
- **Before the orders database is connected**, each order is carried in a signed token:
  - You get two emails: **"New order (awaiting payment)"** with all the customer's details, then **"PAID — register …"** once Safaricom confirms the payment.
  - The customer gets a payment confirmation email.
  - Register the domain on Truehost with the customer's details, then email them the domain details.
- Card is shown at checkout but can't be selected yet.

## 2. Recommended setup (unlocks the admin dashboard)

| # | What | Where | Why |
|---|------|-------|-----|
| 1 | **Orders database**: Upstash for Redis (free plan) | Vercel → cielafrica → **Storage** → Create/Connect → *Upstash for Redis* → connect to this project (adds `KV_REST_API_URL` + `KV_REST_API_TOKEN`) | Stores orders, history and price edits, gives customers an order page, and turns on the admin. |
| 2 | **`ADMIN_PASSWORD`** | Vercel → Settings → Environment Variables | Sign-in for /domains/admin |
| 3 | `DOMAINS_SECRET` (recommended) | Any long random string | Signs sessions and payment tokens. Without it, a key is derived from your existing server secrets. |
| 4 | Redeploy | Vercel → Deployments → Redeploy | Loads the new variables |

Already configured and reused: the `MPESA_*` keys (production Till), `RESEND_API_KEY`, `MAIL_FROM` and `MAIL_TO`.

**Prices (Oct 24):** Truehost-based starting prices + KES 500 on the first year; renewal = first-year price + KES 200. With the database connected, edit them in the admin under **Pricing & settings**.

**Switched off by default:**
- .co, .io, .me and .shop: no automatic availability check is possible from the server.
- .tech, .software, .site, .store, .solutions, .xyz and .studio: no price set.

Turn any of them on in the admin once you've set a price (and, for the first group, are happy to check availability yourself).

## Daily operations (with the database)

1. A **"PAID — register *x* on Truehost"** email arrives.
2. In the admin, open the order (filter **Paid · to register**) and click **Recheck now**.
3. Register the domain on Truehost with the customer's registrant details. Record the Truehost ref, nameservers and expiry, then set the status to **Registered** (the customer is emailed).
4. If it can't be registered, set **Unavailable**. Then offer an alternative at the same price, or start the refund: send the M-Pesa refund yourself and record the transaction code.
5. Use **Export CSV** for accounting, and **Clean up** to delete unpaid orders older than 30 days.

## 3. Where availability comes from (internal — not shown to customers) (research, Oct 2026)

| Extensions | Source | What it can say |
|---|---|---|
| .com, .net | Verisign RDAP (`rdap.verisign.com`) | Registered / no record found. Free. Terms ban high-volume automated querying, so we cache and rate-limit. |
| .co.ke, .ke | KeNIC RDAP (`rdap.kenic.or.ke`) | Registered / no record found |
| .africa | ZACR RDAP (`rdap.nic.africa`) | Registered / no record found |
| .org | Public Interest Registry RDAP | Registered / no record found |
| .info .ai .digital .software .agency .solutions .consulting .studio | Identity Digital RDAP | Registered / no record found; **premium prices not shown** |
| .biz .tech .online .site .store .dev .app .cloud .design .blog .xyz | Their registries' RDAP servers (IANA bootstrap list) | Registered / no record found; **premium prices not shown** |
| .co, .io, .me, .shop | **No public RDAP** (.co/.io/.me), or RDAP that refuses cloud servers (.shop, GMO Registry returns HTTP 429). Public DNS only | Can prove a name is **taken** (it has nameservers). Can't prove it's free, so these show **"Availability needs confirmation"** and are verified before payment. |

- **"No record found" is shown as Available (preliminary).** It doesn't reserve the name, and it can't rule out registry-reserved or premium names. Short names (≤ 4 letters) in premium-prone extensions are always verified before payment.
- **What we never do:** scrape registrar sites, use a WHOIS reseller, or invent results. If a registry times out, the result says *"Couldn't check right now"*, not available.
- **Alternatives we didn't use:** the Fastly Domain Research API (formerly Domainr) gives real "can register" answers, but needs a paid Fastly account. GoDaddy, Namecheap and Porkbun availability APIs need accounts with balances, or only allow lookups by account holders. Any of them can be added later as a provider (see §4).

## 4. Architecture

```
api/domains.js              one Vercel function (keeps the project far under the Hobby function limit)
lib/domains/
  catalog.js                extensions, default prices, RDAP servers, verification rules
  config.js                 defaults + admin overrides (stored in Redis)
  normalize.js              input parsing & validation (ASCII only for now — IDNs are refused clearly)
  availability.js           RDAP + DNS providers, caching, timeouts, per-registry concurrency
  suggest.js                rule-based alternatives (no AI needed); avoids well-known brands
  pricing.js                first year + renewals × (N−1), tax included/added
  orders.js                 order lifecycle, payments, refunds, audit log, CSV, retention
  payments.js               M-Pesa STK push + server-side STK Query; Paystack init/verify/refund/webhook
  email.js                  Resend templates (customer + team)
  security.js               admin sessions, HMAC tokens, rate limits, order references
  registrar.js              provider interface for a future registrar API (manual Truehost today)
  handler.js                HTTP router
tests/domains.test.js       node --test tests/domains.test.js
tools/build-domains.py      regenerates the four domain pages from one shared shell
```

**Order states:** `awaiting_verification → pending_payment → pending_registration (paid) → registration_in_progress → registered`. Other states: `failed`, `unavailable`, `refund_pending`, `refunded` and `cancelled`.

**Security:**
- Payments are only marked paid after Daraja STK Query or Paystack verify confirms them (never from a redirect).
- Callbacks carry an HMAC token, and duplicate callbacks are ignored (exactly-once).
- A second STK push is blocked while the first could still complete.
- Admin sessions use HttpOnly SameSite=Strict cookies, with login rate-limited.
- State-changing requests require a same-origin check.
- Customer order links carry a private key; references are random (`CD-XXXXXXXX`), not sequential.
- No card data, PINs, Truehost passwords or secrets are stored in records or in the browser.

**Data retention:** unpaid orders and requests are deleted after 30 days (Clean up). Paid orders are kept for 5 years for tax records.

## 5. Testing

- **Automated:** `node --test tests/domains.test.js` (20 tests). They cover input validation, all availability states, registry outages, suggestions, pricing and tax, duplicate submits, M-Pesa success/cancel/pending, forged and duplicate callbacks, Paystack signatures and amount mismatches, refunds (both providers), admin access and login limits, workflow guards, price-change and alternative consent, config validation, CSV, the audit log and retention.
- **Local browser runs:** these used fake registries and fake M-Pesa, on desktop and phone widths.
- **Not tested here:** live M-Pesa (production keys) and a live Paystack charge. Do step 6 of the setup to test with real money.
