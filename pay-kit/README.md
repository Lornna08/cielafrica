# Pay Kit: M-PESA and card checkout

A Ciel Africa digital product. One checkout page for Lipa na M-PESA (STK push) and card payments.
Live template: `/pay-kit/` (template mode: nothing is sent and no money moves).

## What's inside
- **Order summary** with items, delivery and total. On phones it folds into a header with *Order details*.
- **M-PESA.** Phone number with Kenyan formats accepted (07…, 01…, 254…, +254…). Sending the request
  shows a phone with the prompt, a countdown, and live steps: request sent, waiting for your PIN,
  confirming. *Didn't get the prompt?* gives tips, *Send again* after a short wait, and an optional
  Paybill or till fallback. Daraja result codes become plain messages (cancelled, phone unreachable,
  not enough balance, wrong PIN). If time runs out the page says it has not heard back yet, warns
  against paying twice, and offers *Check again*. It never claims a failure it does not know about.
- **Cards.** As a live template: a live card preview that changes with the brand (Visa, Mastercard, Amex),
  flips to show the security code, Luhn and expiry checks, a bank verification (3-D Secure) step and
  declines. In live mode the page does not collect card numbers: it sends the order to your server,
  which opens a hosted checkout with your PCI-compliant provider and returns its URL.
- **Receipt** with a printable version (*Download receipt*).
- Mobile-first, keyboard friendly, screen-reader announcements, reduced-motion support.

## Set it up
Edit `config.js` only.
1. `template: false` when your endpoints are live.
2. `merchant`, `theme`, `currency` and `order` (your server should fill in the real order).
3. **M-PESA**: your server calls Safaricom Daraja. Keys stay on the server.
   - `stkEndpoint`: `POST { phone: "2547XXXXXXXX", amount, reference }` → `{ id }`
   - `statusEndpoint`: `GET ?id=…` → `{ status: "pending" | "success" | "failed", resultCode, receipt, message }`.
     Return `success` only after Daraja's callback reports `ResultCode` 0.
   - Optional `paybill` or `till` for the manual fallback.
4. **Cards**: `card.checkoutEndpoint` creates a hosted checkout session with your provider
   (for example Paystack, Flutterwave, Pesapal, DPO or Stripe) and returns `{ url }`.
   Set `card.provider` to show "Secured by …".

Pairs with the *M-Pesa STK Push API (Standalone)* product for the server side.
