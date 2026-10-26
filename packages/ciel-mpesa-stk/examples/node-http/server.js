'use strict';
/**
 * Example: a complete M-Pesa checkout on plain Node.js (no frameworks).
 *
 *   cp .env.example .env      # fill in your Daraja SANDBOX keys first
 *   node examples/node-http/server.js
 *   open http://localhost:3000/checkout.html?order=ORD-1001
 *
 * Daraja must be able to reach your callback, so MPESA_PUBLIC_URL has to be a public
 * https address (a tunnel such as ngrok or cloudflared works for local testing).
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { createMpesa, createHttpHandler, configFromEnv, JsonFileStore, validateTheme } = require('../../src');

// --- tiny .env loader (no dependency) -------------------------------------------------
const envFile = path.join(__dirname, '..', '..', '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}

// --- YOUR orders. In a real app this is your database. ---------------------------------
// The amount the customer is charged ALWAYS comes from here, never from the browser.
const ORDERS = {
  'ORD-1001': { id: 'ORD-1001', description: '2 × Kahawa beans 250 g', amount: 1, currency: 'KES', paid: false }
};

const store = new JsonFileStore(path.join(__dirname, '..', '..', 'data', 'payments.json'));

const mpesa = createMpesa({
  ...configFromEnv(),
  store,
  resolveOrder: async (orderId) => {
    const o = ORDERS[orderId];
    if (!o || o.paid) return null;
    return { amount: o.amount, reference: o.id, description: 'Order ' + o.id };
  },
  onPaid: async (payment) => {
    // Runs exactly once per confirmed payment. Fulfil the order here.
    const o = ORDERS[payment.orderId];
    if (o) { o.paid = true; o.receipt = payment.receipt; }
    console.log('PAID', payment.orderId, payment.amount, payment.receipt || '(receipt arrives with the callback)');
  },
  onUnsuccessful: async (payment) => console.log('NOT PAID', payment.orderId, payment.status, payment.resultDesc),
  onReview: async (payment) => console.log('NEEDS REVIEW', payment.orderId, payment.resultDesc),
  logger: console
});

const handleMpesa = createHttpHandler(mpesa);
const PUBLIC = path.join(__dirname, '..', '..', 'public');
const THEME_FILE = path.join(__dirname, '..', '..', 'theme.json');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json' };

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://local');
  if (url.pathname.startsWith(mpesa.basePath + '/')) return handleMpesa(req, res);
  if (url.pathname === '/theme.json') {
    let theme = {};
    try { theme = JSON.parse(fs.readFileSync(THEME_FILE, 'utf8')); } catch (e) { /* defaults */ }
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(validateTheme(theme).theme));
  }
  const om = url.pathname.match(/^\/orders\/([A-Za-z0-9-]+)\.json$/);
  if (om) {
    const o = ORDERS[om[1]];
    res.setHeader('Content-Type', 'application/json');
    if (!o) { res.statusCode = 404; return res.end('{}'); }
    return res.end(JSON.stringify({ id: o.id, description: o.description, amount: o.amount, currency: o.currency }));
  }
  const file = path.join(PUBLIC, path.normalize(url.pathname).replace(/^(\.\.[/\\])+/, ''));
  if (!file.startsWith(PUBLIC) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.statusCode = 404; return res.end('Not found'); }
  res.setHeader('Content-Type', TYPES[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
}).listen(process.env.PORT || 3000, () => {
  console.log('Checkout: http://localhost:' + (process.env.PORT || 3000) + '/checkout.html?order=ORD-1001');
  console.log('Daraja callback URL in use: ' + mpesa.callbackUrl.replace(mpesa.callbackSecret, '<MPESA_CALLBACK_SECRET>'));
  console.log('Environment: ' + mpesa.environment);
});
