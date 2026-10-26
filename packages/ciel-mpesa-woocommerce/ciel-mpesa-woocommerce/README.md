# Ciel M-Pesa for WooCommerce — installation and setup guide

Version 1.0.0 · Ciel Africa · hello@cielafrica.com

This plugin adds M-Pesa STK Push (Lipa na M-Pesa Online) to WooCommerce checkout. The customer types their Safaricom number and gets a prompt on their phone. They approve with their M-Pesa PIN, and WooCommerce marks the order paid **only after Safaricom confirms**.

It is a WooCommerce payment method. It needs WordPress and WooCommerce, and it doesn't work on other kinds of websites. For a custom Node.js site, use *Ciel M-Pesa STK Push (self-hosted)*.

## Requirements

| | Required | Tested |
|---|---|---|
| WordPress | 6.4 or newer | 6.4.5 and 7.1.3 |
| WooCommerce | 8.2 or newer | 8.2.0 (classic checkout) and 11.2.1 (classic and block checkout) |
| PHP | 8.0 or newer | 8.3 |
| Store currency | Kenyan shilling (KES) | |
| Site address | **https** for live payments | |
| Daraja | A Safaricom Daraja app with Lipa na M-Pesa Online | Tested against a Daraja mock; test in Safaricom's sandbox before going live |

The plugin works with classic order storage and with High-Performance Order Storage (both tested).

## 1. Install

1. In WordPress go to **Plugins → Add New → Upload Plugin**, choose `ciel-mpesa-woocommerce.zip`, and click **Install Now**, then **Activate**.
2. Go to **WooCommerce → Settings → General** and set the currency to **Kenyan shilling (KSh)**. M-Pesa is hidden at checkout for any other currency.

## 2. Configure Daraja

Open **WooCommerce → Settings → Payments → Ciel M-Pesa (STK Push)**.

| Setting | What to enter |
|---|---|
| Environment | **Sandbox** while testing (no real money). **Production** once Safaricom has approved your app. |
| Consumer key, Consumer secret | From your app on the Safaricom developer portal. After saving, these fields show "saved", and the values are never printed back on the page. Leave a field blank to keep its saved value, or tick **Clear** to remove it. |
| Account type | **Paybill** or **Till number (Buy Goods)** |
| Business shortcode | Your Paybill number. For a till, the store or head-office number Safaricom gave you for STK Push. Sandbox: `174379`. |
| Till number | Till only: the number customers pay to |
| Passkey | The Lipa na M-Pesa Online passkey for the shortcode. Masked like the secret. |
| Account reference prefix | Optional, e.g. `SHOP`, so the customer sees `SHOP1042` for order 1042 (maximum 12 characters) |
| Verify results | On by default. Every successful callback is confirmed with an STK query before the order is marked paid. |
| Debug log | Writes events to **WooCommerce → Status → Logs** (source `ciel-mpesa`). Keys and full phone numbers are never logged. |

Tick **Enable**, then **Save changes**.

## 3. Callback URL

You don't paste anything into the Daraja portal: the plugin sends its callback URL with every request. It looks like this:

```
https://your-store.co.ke/wp-json/ciel-mpesa/v1/callback/<secret>
```

The secret is generated on first use and only shown masked. You can generate a new one from the settings screen. Payments still waiting for a result are then confirmed by the status check rather than the callback.

For the callback to arrive:

- the site must be reachable from the internet over **https** (production refuses plain http);
- security plugins or firewalls must allow `POST` to `/wp-json/ciel-mpesa/v1/callback/…`;
- the WordPress REST API must be enabled.

If a callback never arrives, the customer's order page still asks Daraja for the result (see below), so a paid order is still confirmed.

## 4. What the customer sees

1. At checkout they choose **M-Pesa**, enter their Safaricom number (prefilled from the billing phone when valid), and press **Pay with M-Pesa**. On the classic checkout this label comes from the *Order button text* setting.
2. The number is checked first. An invalid number never reaches Safaricom.
3. A prompt appears on their phone, and they land on the order page with a status panel: *Check your phone and enter your M-Pesa PIN*.
4. The panel updates by itself. It shows *Paid* with the M-Pesa receipt, or explains what happened and offers **Pay again**.

## 5. Order status behaviour

| What happened | WooCommerce order status | Order note |
|---|---|---|
| Prompt sent | **Pending payment** | Amount, masked phone, environment, request ID |
| A second attempt within 90 seconds while a prompt is still live | Unchanged; the customer is asked to wait | |
| Paid: success callback with the right amount, confirmed by STK query (or the query alone when no callback arrives) | **Processing** (or **Completed** when WooCommerce completes virtual or downloadable orders) via WooCommerce's normal payment completion. The M-Pesa receipt becomes the transaction ID. | Amount, receipt, how it was confirmed |
| Cancelled on the phone (result 1032) | **Failed** | "The customer cancelled the M-Pesa prompt." The customer can pay again. |
| Timed out on the phone (1037, 1019) | **Failed** | Reason, with Pay again |
| Other failures, e.g. insufficient balance (1) or wrong PIN (2001) | **Failed** | Safaricom's reason |
| No result 5 minutes after the prompt, while the order page is open | **Failed** | "No M-Pesa result after 5 minutes." A success arriving later still completes the order. |
| Callback amount differs from the order amount, or the callback says paid while the query says otherwise | **On hold** | "Needs checking before shipping" |
| A second payment arrives for an order that is already paid | Unchanged | Warning with the receipt, so you can refund it |
| Duplicate callbacks | Unchanged | No second completion and no second stock reduction |

Each payment is applied exactly once, whichever arrives first: the callback, the customer's status check, or the admin check. A database lock guards this.

**Admin check:** on the order screen, choose **Order actions → Check M-Pesa payment status** to ask Daraja directly.

Amounts: STK Push accepts whole shillings from 1 to 250,000. Totals with cents are rounded **up** so the store is never paid short.

## 6. Appearance: what you can change

| Setting in the plugin | Effect |
|---|---|
| Title and Description | How M-Pesa appears in the list of payment methods |
| Order button text | Classic checkout button label. The block checkout uses its own button label. |
| Accent colour | Focus colour of the phone field and the edge of the status panel |

Fonts, spacing, buttons and colours elsewhere come from your theme. To restyle further, use your theme's custom CSS. Every element the plugin adds uses classes that start with `.ciel-mpesa`, and `--ciel-mpesa-accent` sets the accent.

The *Make it yours* playground on cielafrica.com previews the self-hosted checkout. For this plugin it only shows the look you could recreate with these settings and CSS. It doesn't configure the plugin.

## 7. Going live

1. Test in sandbox: a successful payment, a cancel on the phone, and a wrong PIN.
2. Get your production keys and passkey from Safaricom, switch **Environment** to **Production**, and enter them.
3. Make sure the site is on https and that `/wp-json/` is reachable.
4. Place one small real order and refund it from your M-Pesa portal.

## 8. Troubleshooting

| Symptom | Check |
|---|---|
| M-Pesa doesn't show at checkout | Currency is KES; the gateway is enabled; consumer key, secret, shortcode and passkey are saved; in production the site uses https |
| "M-Pesa could not send the payment request" | Turn on the debug log. "Invalid Access Token" or "Invalid credentials" means the keys or environment are wrong (sandbox keys don't work in production). "Invalid Password" means the shortcode and passkey don't match. |
| Prompt arrives, but the order stays Pending | The callback isn't reaching the site (firewall, security plugin, http). The order page and the admin action still confirm by querying Daraja. |
| Order On hold | Read the note: the amount differed, or Safaricom's answers conflicted. Check your M-Pesa statement before shipping. |
| Customer was charged twice | See the order note for the second receipt and refund it from the M-Pesa portal |

## 9. Security

- **Credentials stay server-side.** Consumer key, consumer secret and passkey live in the WordPress database and are only used server-side. They are never printed back into the settings page and never sent to browsers.
- **Callbacks are checked.** The callback URL contains a long random secret, compared in constant time; requests with a wrong secret get 403. Callbacks must match a request this store sent, with the same amount, and are confirmed with an STK query.
- **The browser never decides.** It can't set the amount or mark an order paid. The status endpoint only reveals the state of one order, and only with that order's key.
- **Use sandbox keys for development**, and keep sandbox and production keys separate.

## 10. Uninstalling

Deleting the plugin removes its settings and callback secret. Orders, order notes and payment records stay: they are your accounting history.

M-Pesa is a trademark of Safaricom PLC. Ciel Africa is not affiliated with or endorsed by Safaricom.
