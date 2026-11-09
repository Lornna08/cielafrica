/* ============================================================
   CIEL AFRICA — /api/photobooks?route=…  (Vercel Serverless Function)
   Photo Books: pricing, M-Pesa payment + receipts, print orders,
   print-file handover and the admin. Logic: lib/photobooks/handler.js
   Environment variables (all optional except where noted):
     MPESA_*                      existing Daraja settings (required to sell)
     KV_REST_API_URL / _TOKEN     Upstash Redis — order records + print files
                                  (required for printed-book orders)
     ADMIN_PASSWORD               admin sign-in at /photobooks/admin
     RESEND_API_KEY, MAIL_FROM, MAIL_TO   order emails
     ANTHROPIC_API_KEY or OPENAI_API_KEY  AI title/style suggestions
     PHOTOBOOKS_AI_MODEL          optional model override
   ============================================================ */
const { createHandler } = require('../lib/photobooks/handler');
module.exports = createHandler();
