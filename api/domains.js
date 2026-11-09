/* ============================================================
   CIEL AFRICA — /api/domains/*  (Vercel Serverless Function)
   Ciel Domains: search, availability, orders, payments, admin.
   All logic lives in lib/domains/. Environment variables:
     KV_REST_API_URL / KV_REST_API_TOKEN   Upstash Redis (orders database)
     ADMIN_PASSWORD                        admin sign-in (/domains/admin)
     DOMAINS_SECRET                        optional; signs sessions & callbacks
     MPESA_*                               existing Daraja settings (reused)
     PAYSTACK_SECRET_KEY                   optional; card payments + refunds
     RESEND_API_KEY / MAIL_FROM / MAIL_TO  existing email settings (reused)
   ============================================================ */
const { createHandler } = require('../lib/domains/handler');
module.exports = createHandler();
