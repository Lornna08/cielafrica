/* ============================================================
   CIEL AFRICA — Digital Products (Africa-focused)
   HOW TO EDIT: add objects; replace `image` with your file in
   assets/img/products/. `category` must match categories list.
   `meta` shows as the detail line under each product on the homepage.
   ============================================================ */
window.CIEL = window.CIEL || {};

window.CIEL.productCategories = [
  "All","WordPress Plugins","Payments & M-Pesa","Business Systems","WordPress Themes",
  "Website Templates","Laravel Packages","React Components","Admin Dashboards",
  "SMS & USSD","Automation Scripts","AI Tools","APIs"
];

window.CIEL.usdRate = 130; /* KES per US dollar, for reference prices on product pages */

window.CIEL.products = [
  /* TEST PRODUCT — auto-hides after the `expires` time (epoch ms). Safe to leave; it disappears on its own. */
  { id:"prd-test", art:"mpesa-stk", name:"Test Product (M-Pesa test)", category:"Payments & M-Pesa", desc:"A KES 10 test item for checking M-Pesa checkout end to end. This product removes itself automatically after 24 hours.", meta:"Test only · KES 10 · Auto-expires", price:10, rating:5.0, reviews:0, badge:"new", image:"", expires:1792655280000 },

  /* ---------- Ciel M-Pesa (product pages in /products/) ----------
     Prices in KES. `usd` figures on the pages are computed from CIEL.usdRate.
     `options` are the purchase choices shown on the product page. */
  { id:"ciel-mpesa-stk", art:"ciel-mpesa-stk", name:"Ciel M-Pesa STK Push (self-hosted)", category:"Payments & M-Pesa", desc:"Add M-Pesa STK Push to your own website or web app: a Node.js library with verified callbacks, payments settled exactly once, and a checkout you can theme.", meta:"Node.js 18+ · Express or node:http · Paybill & Till · Sandbox & live", price:7800, badge:"new", image:"", link:"products/ciel-mpesa-stk-push", options:[{ id:"ciel-mpesa-stk", label:"With your own Daraja keys", price:7800, note:"You already have a Daraja app (consumer key, secret, shortcode and passkey)." },{ id:"ciel-mpesa-stk-setup", label:"With Daraja setup help", price:10000, note:"We help you set up the Daraja app, get your keys and go live." }] },
  { id:"ciel-mpesa-woo", art:"ciel-mpesa-woo", name:"Ciel M-Pesa for WooCommerce", category:"WordPress Plugins", desc:"Add M-Pesa STK Push to your WooCommerce checkout without building the integration: a plugin that works with WooCommerce orders, from Pending payment to Processing.", meta:"WordPress 6.4+ · WooCommerce 8.2+ · PHP 8.0+ · Classic & block checkout", price:6000, badge:"new", image:"", link:"products/ciel-mpesa-woocommerce", options:[{ id:"ciel-mpesa-woo", label:"Plugin licence", price:6000, note:"Install it yourself with the setup guide." }] },
  { id:"prd-03", art:"sacco", name:"SACCO & Microfinance System", category:"Business Systems", desc:"Members, savings, loans, guarantors, dividends and M-Pesa disbursement — built for Kenyan SACCOs and chamas.", meta:"Loans · Savings · Dividends · M-Pesa payouts", price:55000, rating:5.0, reviews:0, badge:"popular", image:"" },
  { id:"prd-04", art:"etims", name:"KRA eTIMS Invoicing", category:"APIs", desc:"Generate KRA-compliant eTIMS tax invoices with QR codes, VAT breakdown and PDF export — API + WooCommerce plugin.", meta:"eTIMS · VAT · QR invoice · KRA compliant", price:12000, rating:4.9, reviews:0, badge:"new", image:"" },
  { id:"prd-05", art:"sms", name:"Bulk SMS Portal", category:"SMS & USSD", desc:"Send campaigns and transactional SMS via Africa's Talking or Twilio — contacts, templates, scheduling and delivery reports.", meta:"Africa's Talking · Scheduling · Delivery reports", price:14000, rating:4.8, reviews:0, badge:"", image:"" },
  { id:"prd-06", art:"ussd", name:"USSD Menu Builder", category:"SMS & USSD", desc:"Drag-and-drop USSD menus for payments, balance checks and self-service — works with Africa's Talking shortcodes.", meta:"*384# menus · Sessions · Self-service", price:16000, rating:4.7, reviews:0, badge:"", image:"" },
  { id:"prd-07", art:"pos", name:"POS & Inventory (Duka)", category:"Business Systems", desc:"Point-of-sale for shops and dukas — stock, suppliers, M-Pesa till, daily Z-reports and low-stock alerts.", meta:"POS · Stock · M-Pesa till · Z-reports", price:28000, rating:4.9, reviews:0, badge:"popular", image:"" },
  { id:"prd-08", art:"airtime", name:"Airtime & Bills API", category:"APIs", desc:"Sell airtime and pay bills (KPLC, DSTV, water) programmatically with a single wallet and reconciliation dashboard.", meta:"Airtime · KPLC · DSTV · Single wallet", price:18000, rating:4.8, reviews:0, badge:"", image:"" },
  { id:"prd-09", art:"admin", name:"Nimbus Admin Dashboard", category:"Admin Dashboards", desc:"Production-ready admin with charts, tables, roles and M-Pesa transaction views — drop into any business system.", meta:"Charts · Roles · M-Pesa views · Dark mode", price:6500, rating:4.9, reviews:0, badge:"", image:"" },
  { id:"prd-10", art:"rental", name:"Rental & Property Manager", category:"Business Systems", desc:"Track units, tenants, rent via M-Pesa, invoices and maintenance requests — for landlords and agents.", meta:"Tenants · Rent (M-Pesa) · Invoices · Requests", price:32000, rating:5.0, reviews:0, badge:"new", image:"" },
  { id:"prd-11", art:"booking", name:"Booking & Appointments", category:"Laravel Packages", desc:"Salon, clinic and consultant bookings with M-Pesa deposits, SMS reminders and a staff calendar.", meta:"Bookings · Deposits · SMS reminders", price:15000, rating:4.7, reviews:0, badge:"", image:"" },
  { id:"prd-12", art:"whatsapp", name:"WhatsApp Order Bot", category:"AI Tools", desc:"Take orders and answer FAQs on WhatsApp automatically, push orders to your dashboard and confirm via M-Pesa.", meta:"WhatsApp · Orders · FAQs · M-Pesa confirm", price:22000, rating:4.9, reviews:0, badge:"popular", image:"" },

  /* ---------- WordPress Plugins ---------- */
  { id:"prd-14", art:"etims", name:"KRA eTIMS for WooCommerce", category:"WordPress Plugins", desc:"Auto-generate KRA-compliant eTIMS invoices on every WooCommerce sale, with QR codes, VAT and PDF receipts.", meta:"eTIMS · VAT · QR · Auto-invoice", price:12000, rating:4.9, reviews:0, badge:"new", image:"" },
  { id:"prd-15", art:"sms", name:"SMS Notifications for WordPress", category:"WordPress Plugins", desc:"Send order, booking and form SMS via Africa's Talking — customer alerts, admin alerts and OTP login.", meta:"Africa's Talking · Order SMS · OTP", price:5500, rating:4.8, reviews:0, badge:"", image:"" },
  { id:"prd-16", art:"booking", name:"Bookings & Appointments (WP)", category:"WordPress Plugins", desc:"Accept bookings on WordPress with M-Pesa deposits, staff calendars, SMS reminders and Google Calendar sync.", meta:"Bookings · Deposits · Reminders · GCal", price:7500, rating:4.8, reviews:0, badge:"", image:"" },
  { id:"prd-17", art:"admin", name:"Membership & Paywall (WP)", category:"WordPress Plugins", desc:"Lock content behind paid membership tiers, recurring M-Pesa or card billing, and member-only areas.", meta:"Memberships · Recurring · Paywall", price:8500, rating:4.7, reviews:0, badge:"", image:"" },
  { id:"prd-18", art:"whatsapp", name:"WhatsApp Chat & Cart (WP)", category:"WordPress Plugins", desc:"Floating WhatsApp button, abandoned-cart nudges and one-tap checkout-to-WhatsApp for WooCommerce stores.", meta:"WhatsApp · Abandoned cart · 1-tap", price:4500, rating:4.8, reviews:0, badge:"popular", image:"" },
  { id:"prd-19", art:"admin", name:"Directory & Listings (WP)", category:"WordPress Plugins", desc:"Build a paid business directory or classifieds site — submissions, featured listings and M-Pesa paid placements.", meta:"Listings · Submissions · Paid featured", price:9500, rating:4.7, reviews:0, badge:"", image:"" },
  { id:"prd-20", art:"airtime", name:"Airtime & Bills Reseller (WP)", category:"WordPress Plugins", desc:"Sell airtime and pay bills from your WordPress site with wallet, markup control and reconciliation.", meta:"Airtime · Bills · Wallet · Markup", price:11000, rating:4.6, reviews:0, badge:"", image:"" },
  { id:"prd-21", art:"admin", name:"Donations & Fundraising (WP)", category:"WordPress Plugins", desc:"Collect donations via M-Pesa and card with campaigns, goals, donor receipts and recurring giving.", meta:"Donations · M-Pesa · Campaigns · Receipts", price:6000, rating:4.9, reviews:0, badge:"", image:"" },
  { id:"prd-22", art:"admin", name:"Invoicing & Quotes (WP)", category:"WordPress Plugins", desc:"Create and send branded invoices and quotes, accept M-Pesa payment and track paid/unpaid from your dashboard.", meta:"Invoices · Quotes · M-Pesa · Tracking", price:7000, rating:4.7, reviews:0, badge:"", image:"" },

  /* ---------- Standalone systems (no WordPress) ---------- */
  { id:"prd-24", art:"admin", name:"School Management System", category:"Business Systems", desc:"Students, fees (M-Pesa), exams, report cards, attendance, timetable and parent SMS — a full school platform.", meta:"Fees · Exams · Attendance · Parent SMS", price:65000, rating:5.0, reviews:0, badge:"", image:"" },
  { id:"prd-25", art:"admin", name:"Clinic & Hospital System", category:"Business Systems", desc:"Patient records, appointments, billing with M-Pesa, pharmacy stock and lab results for clinics.", meta:"EMR · Appointments · Billing · Pharmacy", price:72000, rating:5.0, reviews:0, badge:"", image:"" },
  { id:"prd-26", art:"admin", name:"Restaurant & QR Ordering", category:"Business Systems", desc:"Scan-to-order from the table, kitchen display, M-Pesa payment and daily sales — for restaurants and cafés.", meta:"QR order · Kitchen display · M-Pesa", price:34000, rating:4.8, reviews:0, badge:"new", image:"" },
  { id:"prd-27", art:"admin", name:"Delivery & Dispatch Platform", category:"Business Systems", desc:"Orders, rider app, live tracking, zones and COD/M-Pesa reconciliation for delivery businesses.", meta:"Rider app · Tracking · Zones · COD", price:85000, rating:4.9, reviews:0, badge:"", image:"" },
  { id:"prd-28", art:"admin", name:"E-commerce Store (Headless)", category:"Business Systems", desc:"A fast standalone online store — catalogue, cart, M-Pesa & card checkout, inventory and order admin. Not WordPress.", meta:"Catalogue · Cart · M-Pesa · Admin", price:48000, rating:4.9, reviews:0, badge:"popular", image:"" }
];
