# Ciel M-Pesa STK Push — self-hosted integration

M-Pesa STK Push (Lipa na M-Pesa Online) for your own Node.js web app. The package handles the server side with Safaricom Daraja:

- getting an access token;
- sending the payment prompt;
- receiving and checking the callback;
- confirming the result with an STK query;
- recording each payment so it is settled exactly once.

It also includes a themeable checkout page.

Version 1.0.0 · by Ciel Africa · hello@cielafrica.com

## What it is, and what it isn't

- **It is** a server-side library plus a browser checkout component. You add both to an app you control.
- **It isn't** a hosted gateway, and it isn't a WordPress plugin. For WooCommerce, use *Ciel M-Pesa for WooCommerce*.
- **Money moves only on Safaricom's systems.** This code asks Daraja to prompt the customer, then trusts only Daraja's answer to mark a payment paid.

## Requirements

| | |
|---|---|
| Runtime | **Node.js 18.17 or newer** (uses the built-in `fetch`). Tested on Node.js 22. |
| Dependencies | None. |
| Frameworks | `node:http` and **Express 4 and 5** (tested). Anything that gives you Node's `req`/`res` works the same way. |
| Server | A long-running Node.js process for `MemoryStore` or `JsonFileStore`. On serverless or several instances, use a database store (see [Storing payments](#storing-payments)). |
| Daraja | A Daraja app with Lipa na M-Pesa Online: consumer key, consumer secret, shortcode and passkey. Start with the sandbox. |
| Network | A public **https** URL that Safaricom can reach for the callback. |

## Quick start (sandbox)

```bash
cp .env.example .env          # add your sandbox keys and a callback secret
node examples/node-http/server.js
# open http://localhost:3000/checkout.html?order=ORD-1001
```

For local testing, Daraja must reach your callback. Expose port 3000 with a tunnel (for example ngrok or cloudflared) and set `MPESA_PUBLIC_URL` to the tunnel's https address.

Run the tests (no keys needed; they use a mock Daraja):

```bash
npm test
```

## How a payment works

```
Browser                      Your server (this package)                 Safaricom Daraja
   |  POST /mpesa/stk {orderId, phone}  |                                        |
   |----------------------------------->|  resolveOrder(orderId) -> amount      |
   |                                    |  POST /mpesa/stkpush/v1/processrequest |
   |                                    |--------------------------------------->|  prompt on the phone
   |  { status: "pending" }             |<--- CheckoutRequestID (accepted only)  |
   |<-----------------------------------|                                        |
   |  GET /mpesa/status/:id  (polling)  |                                        |
   |----------------------------------->|  POST /mpesa/stkpushquery/v1/query --->|
   |                                    |                                        |
   |                                    |<-- POST /mpesa/callback/<secret> ------|  customer enters PIN
   |                                    |  check secret, amount, then query -----|
   |  { status: "paid", receipt }       |  onPaid(payment) runs exactly once     |
   |<-----------------------------------|                                        |
```

1. **Configure your Daraja app** and note the consumer key, consumer secret, shortcode and passkey.
2. **Put the credentials on the server** in environment variables. Never in browser code, never in git.
3. **Callback URL.** The package builds it as `MPESA_PUBLIC_URL + /mpesa/callback/ + MPESA_CALLBACK_SECRET` and sends it with every STK request.
4. **Start a payment.** The browser sends only `orderId` and `phone`. Your `resolveOrder()` returns the amount from your records.
5. **Receive the callback.** The package checks the secret in the path and the body's shape, matches the `CheckoutRequestID` to a pending record, and checks the amount against what was requested.
6. **Verify the result.** A success callback is confirmed with an STK query before the payment is marked paid. If the callback is slow, the status endpoint queries Daraja itself.
7. **Update your order.** `onPaid(payment)` runs once per confirmed payment. Fulfil the order there.

> A Daraja response of `ResponseCode: "0"` to the STK request only means **the request was accepted**. It is not a payment. Only a success callback that matches, verified by a query, or a successful query, marks a payment `paid`.

## Configuration

```js
const { createMpesa, createHttpHandler, configFromEnv, JsonFileStore } = require('ciel-mpesa-stk');

const mpesa = createMpesa({
  ...configFromEnv(),            // MPESA_* environment variables
  store: new JsonFileStore('data/payments.json'),
  resolveOrder: async (orderId) => {
    const order = await db.orders.find(orderId);        // YOUR data
    if (!order || order.paid) return null;
    return { amount: order.totalKes, reference: order.number, description: 'Order ' + order.number };
  },
  onPaid: async (payment) => { await db.orders.markPaid(payment.orderId, payment.receipt, payment.id); },
  onUnsuccessful: async (payment) => { /* cancelled, expired or failed */ },
  onReview: async (payment) => { /* needs a person: amount mismatch, conflicting answers, paid after expiry */ }
});

app.use(createHttpHandler(mpesa)); // Express — or: http.createServer(createHttpHandler(mpesa))
```

| Option | Env variable | Notes |
|---|---|---|
| `environment` | `MPESA_ENV` | `sandbox` (default) or `production` |
| `consumerKey`, `consumerSecret` | `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET` | From your Daraja app |
| `shortcode` | `MPESA_SHORTCODE` | Paybill number, or the store / head-office number for a Till |
| `passkey` | `MPESA_PASSKEY` | Lipa na M-Pesa Online passkey |
| `till` | `MPESA_TILL` | Set for Buy Goods. Payments then go to this till (`CustomerBuyGoodsOnline`). |
| `publicUrl` | `MPESA_PUBLIC_URL` | Your public address; must be https in production |
| `basePath` | `MPESA_BASE_PATH` | Default `/mpesa` |
| `callbackSecret` | `MPESA_CALLBACK_SECRET` | 24+ characters from `A–Z a–z 0–9 - _` |
| `resolveOrder(orderId)` | | **Required.** Returns `{ amount, reference, description }`, or `null` when the order can't be paid |
| `store` | | Default `MemoryStore` (lost on restart) |
| `verifyCallbackWithQuery` | | Default `true` |
| `expireAfterMs` | | Default 5 minutes. When a status check finds a payment still pending after this long, it becomes `expired`. A later success callback moves it to `review`, never ignored. |
| `retryAfterMs` | | Default 90 seconds before the same order can send another prompt |

Amounts must be whole shillings from 1 to 250,000 (the STK Push limit).

## Endpoints

| Method and path | Body | Answer |
|---|---|---|
| `POST /mpesa/stk` | `{ "orderId": "ORD-1001", "phone": "0712 345 678" }` | `201 { ok, payment }` · `400` bad phone or order · `409` already paid or a prompt is still waiting · `429` too many requests |
| `GET /mpesa/status/:id` | | `200 { ok, payment }`. Asks Daraja while the payment is pending, rate limited per payment. |
| `POST /mpesa/callback/:secret` | Safaricom's callback | `200 {"ResultCode":0,"ResultDesc":"Accepted"}` · `403` wrong secret · `400` malformed |

`payment` is safe to show the buyer: `{ id, status, amount, reference, phone (masked), receipt, message, environment }`.

Statuses are `pending`, then one of `paid`, `cancelled`, `expired`, `failed` or `review`. The mapping is:

| Result code | Status |
|---|---|
| `0` | `paid` (after verification) |
| `1032` | `cancelled` |
| `1037`, `1019` | `expired` |
| Any other code | `failed` |

## The checkout page and themes

`public/checkout.html` loads `checkout.js` and `checkout.css`, reads `theme.json` and your order summary, and talks to the endpoints above.

You can also mount the component on any page of your own:

```html
<link rel="stylesheet" href="/checkout.css">
<div id="pay"></div>
<script src="/checkout.js"></script>
<script>
  CielCheckout.mount(document.getElementById('pay'), {
    theme: { merchantName: 'Duka Bora', colors: { button: '#1F9D55' } },
    order: { id: 'ORD-1001', description: '2 × Kahawa beans', amount: 1250, currency: 'KES' }, // display only
    transport: CielCheckout.httpTransport('/mpesa')
  });
</script>
```

A theme is appearance only. Every key is optional, and invalid values fall back to the defaults:

```json
{
  "version": 1,
  "merchantName": "Your Store",
  "mode": "light",
  "colors": { "primary": "#141414", "accent": "#FF5A1F", "background": "#F4F2EE", "button": "#1F9D55", "buttonText": "#FFFFFF" },
  "radius": 12,
  "buttonStyle": "solid",
  "font": "system",
  "layout": "card"
}
```

`mode` is `light` or `dark`; `buttonStyle` is `solid`, `outline` or `pill`; `font` is `system`, `rounded`, `serif` or `mono` (system font stacks, nothing downloaded); `layout` is `card`, `split` or `compact`; `radius` is 0–28.

The **"Make it yours"** playground on cielafrica.com exports this exact format. Save its JSON as `theme.json`.

## Storing payments

`MemoryStore` and `JsonFileStore` suit a single Node.js process. For serverless functions or several instances, implement these five methods on your database. `transition` must be atomic:

```js
{
  async get(id) {},                        // record or null
  async findByOrder(orderId) {},           // records for one order
  async create(record) {},                 // insert; fail if the id exists
  async transition(id, fromStatus, patch){},// UPDATE ... SET ... WHERE id = $1 AND status = $2; return the row or null
  async patch(id, patch) {}                // non-status fields (e.g. a receipt that arrives late)
}
```

The record id is Daraja's `CheckoutRequestID`. Keep the `receipt` (the M-Pesa transaction code), `amount`, `phone`, `orderId`, `status`, `resultCode` and `verifiedBy` for reconciliation.

## Security checklist

- Keep `MPESA_CONSUMER_SECRET`, `MPESA_PASSKEY` and `MPESA_CALLBACK_SECRET` in server environment variables only. `.env` is git-ignored.
- **The browser never sets the amount.** `resolveOrder()` does, from your records.
- **The callback URL carries a long secret.** Requests with the wrong secret are refused (constant-time comparison). Daraja callbacks aren't signed, so success is also confirmed with an STK query before anything is marked paid.
- **Duplicate callbacks and repeated status checks are idempotent.** A status changes only from `pending`, atomically, so `onPaid` can't run twice for one payment.
- **Amount mismatches and conflicting answers go to `review`.** They are never marked paid automatically.
- **Use https in production** (enforced). Use the sandbox while building, and keep separate keys and callback secrets for sandbox and production.
- **Errors shown to customers are generic.** Daraja's raw error text goes to your logs only, and phone numbers in logs are masked.
- **Limits:** a per-IP limit on `POST /stk` (5 per minute by default), a 16 KB body limit, and one live prompt per order. Behind a proxy, pass `clientIp` so the limit sees the real client.

## Troubleshooting

| Symptom | Check |
|---|---|
| `Could not authenticate with M-Pesa` | Consumer key or secret, and that `MPESA_ENV` matches the keys (sandbox keys don't work in production) |
| `Bad Request - Invalid Password` in logs | Shortcode and passkey pair, and for a Till that `MPESA_SHORTCODE` is the store number while `MPESA_TILL` is the till |
| Prompt arrives, but the page stays on "Check your phone" | Daraja can't reach your callback. Check `MPESA_PUBLIC_URL`, https, firewall, and the secret in the path. The status endpoint still confirms by querying Daraja. |
| `403` on the callback | `MPESA_CALLBACK_SECRET` changed after the request was sent |
| `409` when paying | That order already has a payment, or a prompt is still waiting (wait for `retryAfterMs`) |

## Files

```
src/        library (index.js is the entry point)
public/     checkout.html, checkout.js, checkout.css
examples/   node-http (no dependencies) and express
test/       node:test suite with a mock Daraja (npm test)
.env.example, theme.example.json
```

M-Pesa is a trademark of Safaricom PLC. Ciel Africa is not affiliated with or endorsed by Safaricom.
