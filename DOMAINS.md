# Ciel Domains — setup & operations

Live at **cielafrica.com/domains** · admin at **cielafrica.com/domains/admin** · terms at **/domains/terms**.

Customers search, get honest availability and creative alternatives, and order. You fulfil each registration by hand on Truehost, then record it in the admin. Payment comes first, and every payment is confirmed with the provider on the server.

---

## 1. One-time setup (≈15 minutes)

| # | What | Where | Why |
|---|------|-------|-----|
| 1 | **Orders database** — Upstash for Redis (free plan) | Vercel → cielafrica → **Storage** → Create/Connect → *Upstash for Redis* → connect to this project. Vercel adds `KV_REST_API_URL` + `KV_REST_API_TOKEN`. | Orders, the audit history, pricing edits and rate limits are stored here. Until it's connected, the page runs in **requests-only** mode: requests are emailed to you and nobody is charged. |
| 2 | **`ADMIN_PASSWORD`** | Vercel → Settings → Environment Variables (Production) | Sign-in for /domains/admin, checked on the server. Use a long, unique password. |
| 3 | `DOMAINS_SECRET` *(recommended)* | Same place — any long random string | Signs admin sessions and M-Pesa callback links. If it's missing, a key is derived from `ADMIN_PASSWORD`. |
| 4 | Redeploy | Vercel → Deployments → Redeploy (or push a commit) | Loads the new variables. |
| 5 | Review prices | /domains/admin → **Pricing & settings** | The defaults are starting points, a little above Truehost's public list. Set your own prices and save. |
| 6 | Small live test | Turn on **Accept orders & payments online**, order a cheap domain, pay with your own M-Pesa, then refund yourself from the admin | Proves the whole loop on your real Till before customers use it. |

Already configured and reused: `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`, `MPESA_PASSKEY`, `MPESA_TILL`, `MPESA_ENV=production`, `RESEND_API_KEY`, `MAIL_FROM`, `MAIL_TO`.

**Optional — card payments (Paystack):** set `PAYSTACK_SECRET_KEY` (start with `sk_test_…`). In Paystack → Settings → API, set the webhook URL to `https://cielafrica.com/api/domains/paystack-webhook`. Card is hidden from customers until the key exists. Paystack refunds are started from the admin through the Paystack API.

Other optional variables: `DOMAINS_BASE_URL` (defaults to https://cielafrica.com) and `DOMAINS_REGISTRAR` (defaults to `manual-truehost`).

## 2. Daily operations

1. **New paid order** → you get the email "PAID — register *x* on Truehost".
2. In the admin, open the order (filter **Paid · to register**). Click **Recheck now**, then **Copy name & open Truehost** and search for it there.
3. If it's free on Truehost, buy it using the **customer's registrant details** shown in the admin. Then:
   - set the status to **Registration in progress** and tick "I rechecked" (the customer is emailed);
   - record the **Truehost ref**, nameservers and expiry, then set **Registered** (the customer is emailed).
4. If it can't be registered, set **Unavailable** or **Failed** with a reason (the customer is emailed). Then either:
   - **Offer an alternative** at the same price (the customer accepts or declines on their order page), or
   - **Start the refund**. Card refunds go through Paystack automatically. For M-Pesa, send the money back yourself, then **Record refund completed** with the M-Pesa transaction code (the customer is emailed).
5. **Requests** (extensions marked "Verify first", names without a price, or anything the registry couldn't confirm) arrive as **Pending payment / verification**. Check the name and price on Truehost, then click **Mark verified**:
   - If you enter a different total, the customer must accept it before they can pay.
   - For names with no list price, the price you enter becomes the price.
   - In both cases the customer gets a payment link.
6. **Export CSV** gives your records for accounting. **Clean up** deletes unpaid orders older than 30 days; paid orders are kept.

Emails are only sent for things that are actually true. "Registered" requires a Truehost reference, and "Refund completed" requires the provider's confirmation or your M-Pesa code.

## 3. Where availability comes from (research, Oct 2026)

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
