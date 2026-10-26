'use strict';
/**
 * Example: mounting the handlers in an Express 4 or 5 app.
 *   npm install express
 *   node examples/express/server.js
 * The package itself has no dependencies; Express is only needed for this example.
 */
const path = require('path');
const express = require('express');
const { createMpesa, createHttpHandler, configFromEnv, MemoryStore } = require('../../src');

const orders = { 'ORD-2001': { amount: 1, reference: 'ORD-2001', description: 'Order ORD-2001' } };

const mpesa = createMpesa({
  ...configFromEnv(),
  store: new MemoryStore(), // use a database-backed store in production (see README)
  resolveOrder: async (id) => orders[id] || null,
  onPaid: async (p) => console.log('PAID', p.orderId, p.receipt)
});

const app = express();
app.use(express.json({ limit: '16kb' }));
app.use(createHttpHandler(mpesa));            // POST /mpesa/stk, GET /mpesa/status/:id, POST /mpesa/callback/:secret
app.use(express.static(path.join(__dirname, '..', '..', 'public')));
app.get('/orders/:id.json', (req, res) => {
  const o = orders[req.params.id];
  if (!o) return res.status(404).json({});
  res.json({ id: req.params.id, description: o.description, amount: o.amount, currency: 'KES' });
});
app.listen(process.env.PORT || 3000, () => console.log('http://localhost:' + (process.env.PORT || 3000) + '/checkout.html?order=ORD-2001'));
