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

window.CIEL.products = [
  { id:"prd-01", art:"mpesa-stk", name:"M-Pesa STK Push (Daraja)", category:"Payments & M-Pesa", desc:"WordPress & WooCommerce plugin for Safaricom Daraja STK Push — Lipa na M-Pesa checkout, C2B/B2C callbacks, auto-reconciliation and receipts.", meta:"Daraja API · STK Push · WooCommerce · Sandbox & Live", price:9500, rating:5.0, reviews:0, badge:"popular", image:"" },
  { id:"prd-02", art:"woo-mpesa", name:"M-Pesa WooCommerce Gateway", category:"Payments & M-Pesa", desc:"Full checkout gateway with Paybill/Till support, instant confirmation, order status sync and downloadable statements.", meta:"Paybill & Till · Instant confirm · Order sync", price:8500, rating:4.9, reviews:0, badge:"new", image:"" },
  { id:"prd-03", art:"sacco", name:"SACCO & Microfinance System", category:"Business Systems", desc:"Members, savings, loans, guarantors, dividends and M-Pesa disbursement — built for Kenyan SACCOs and chamas.", meta:"Loans · Savings · Dividends · M-Pesa payouts", price:145000, rating:5.0, reviews:0, badge:"popular", image:"" },
  { id:"prd-04", art:"etims", name:"KRA eTIMS Invoicing", category:"APIs", desc:"Generate KRA-compliant eTIMS tax invoices with QR codes, VAT breakdown and PDF export — API + WooCommerce plugin.", meta:"eTIMS · VAT · QR invoice · KRA compliant", price:26000, rating:4.9, reviews:0, badge:"new", image:"" },
  { id:"prd-05", art:"sms", name:"Bulk SMS Portal", category:"SMS & USSD", desc:"Send campaigns and transactional SMS via Africa's Talking or Twilio — contacts, templates, scheduling and delivery reports.", meta:"Africa's Talking · Scheduling · Delivery reports", price:32000, rating:4.8, reviews:0, badge:"", image:"" },
  { id:"prd-06", art:"ussd", name:"USSD Menu Builder", category:"SMS & USSD", desc:"Drag-and-drop USSD menus for payments, balance checks and self-service — works with Africa's Talking shortcodes.", meta:"*384# menus · Sessions · Self-service", price:38000, rating:4.7, reviews:0, badge:"", image:"" },
  { id:"prd-07", art:"pos", name:"POS & Inventory (Duka)", category:"Business Systems", desc:"Point-of-sale for shops and dukas — stock, suppliers, M-Pesa till, daily Z-reports and low-stock alerts.", meta:"POS · Stock · M-Pesa till · Z-reports", price:78000, rating:4.9, reviews:0, badge:"popular", image:"" },
  { id:"prd-08", art:"airtime", name:"Airtime & Bills API", category:"APIs", desc:"Sell airtime and pay bills (KPLC, DSTV, water) programmatically with a single wallet and reconciliation dashboard.", meta:"Airtime · KPLC · DSTV · Single wallet", price:42000, rating:4.8, reviews:0, badge:"", image:"" },
  { id:"prd-09", art:"admin", name:"Nimbus Admin Dashboard", category:"Admin Dashboards", desc:"Production-ready admin with charts, tables, roles and M-Pesa transaction views — drop into any business system.", meta:"Charts · Roles · M-Pesa views · Dark mode", price:12000, rating:4.9, reviews:0, badge:"", image:"" },
  { id:"prd-10", art:"rental", name:"Rental & Property Manager", category:"Business Systems", desc:"Track units, tenants, rent via M-Pesa, invoices and maintenance requests — for landlords and agents.", meta:"Tenants · Rent (M-Pesa) · Invoices · Requests", price:96000, rating:5.0, reviews:0, badge:"new", image:"" },
  { id:"prd-11", art:"booking", name:"Booking & Appointments", category:"Laravel Packages", desc:"Salon, clinic and consultant bookings with M-Pesa deposits, SMS reminders and a staff calendar.", meta:"Bookings · Deposits · SMS reminders", price:34000, rating:4.7, reviews:0, badge:"", image:"" },
  { id:"prd-12", art:"whatsapp", name:"WhatsApp Order Bot", category:"AI Tools", desc:"Take orders and answer FAQs on WhatsApp automatically, push orders to your dashboard and confirm via M-Pesa.", meta:"WhatsApp · Orders · FAQs · M-Pesa confirm", price:55000, rating:4.9, reviews:0, badge:"popular", image:"" }
];
