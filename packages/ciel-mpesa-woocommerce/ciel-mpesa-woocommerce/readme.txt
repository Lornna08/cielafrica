=== Ciel M-Pesa for WooCommerce ===
Contributors: cielafrica
Tags: mpesa, m-pesa, woocommerce, kenya, stk push
Requires at least: 6.4
Tested up to: 7.1
Requires PHP: 8.0
Stable tag: 1.0.0
License: Commercial — see LICENSE.txt
WC requires at least: 8.2
WC tested up to: 11.2

M-Pesa STK Push (Lipa na M-Pesa Online) checkout for WooCommerce, using your own Safaricom Daraja app.

== Description ==

Customers choose M-Pesa, enter their Safaricom number and approve the payment on their phone with their M-Pesa PIN. The order is marked paid only after Safaricom confirms: a callback that matches the order, confirmed by an STK query, or a successful STK query.

* Classic checkout and the block-based Checkout.
* Paybill and Till (Buy Goods).
* Sandbox and production.
* Secret fields are never shown back in the settings screen.
* The callback URL carries a secret, and duplicate callbacks are ignored.
* An order is never completed twice.
* A "Check M-Pesa payment status" action on the order screen.
* Compatible with High-Performance Order Storage.

Full guide: see README.md in the download.

M-Pesa is a trademark of Safaricom PLC. Ciel Africa is not affiliated with or endorsed by Safaricom.

== Installation ==

1. Plugins → Add New → Upload Plugin, choose ciel-mpesa-woocommerce.zip, then Install and Activate.
2. WooCommerce → Settings → General: currency Kenyan shilling (KES).
3. WooCommerce → Settings → Payments → Ciel M-Pesa (STK Push): add your Daraja sandbox keys, shortcode and passkey, then enable it.
4. Place a test order in sandbox. Switch to production keys once Safaricom approves your app. Your site must use https.

== Changelog ==

= 1.0.0 =
* First release.
