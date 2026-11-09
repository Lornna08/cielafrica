/* ============================================================
   CIEL AFRICA HQ — /api/hq?route=…  (Vercel Serverless Function)
   The /admin dashboard: tasks, calendar, customer notes and the website
   shop orders. Logic in lib/hq/handler.js. Needs ADMIN_PASSWORD and the
   private Blob store (BLOB_READ_WRITE_TOKEN), both set in Vercel.
   ============================================================ */
const { createHandler } = require('../lib/hq/handler');
module.exports = createHandler();
