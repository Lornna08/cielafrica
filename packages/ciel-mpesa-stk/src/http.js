'use strict';
/**
 * HTTP handlers for Node's (req, res). Works with node:http and with Express
 * (mount it with app.use(handler); if express.json() already parsed the body it is reused).
 *
 *   POST {basePath}/stk                 { orderId, phone }  -> starts an STK Push
 *   GET  {basePath}/status/:id                              -> payment status (polls Daraja while pending)
 *   POST {basePath}/callback/:secret    Safaricom's result  -> verified, idempotent settlement
 */
const { MpesaError } = require('./errors');

function send(res, status, obj) {
  if (res.headersSent) return;
  const body = JSON.stringify(obj);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(body);
}

function readJson(req, limit) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return Promise.resolve(req.body);
  return new Promise((resolve, reject) => {
    let size = 0, over = false; const chunks = [];
    req.on('data', (c) => {
      if (over) return; // keep draining so we can still answer
      size += c.length;
      if (size > limit) { over = true; chunks.length = 0; return; }
      chunks.push(c);
    });
    req.on('end', () => {
      if (over) return reject(new MpesaError('Request too large.', { code: 'too_large', status: 413 }));
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch (e) { reject(new MpesaError('Invalid JSON.', { code: 'bad_json', status: 400 })); }
    });
    req.on('error', reject);
  });
}

/** Small per-IP limiter for the endpoint that sends prompts to phones. */
function rateLimiter(max, windowMs) {
  const hits = new Map();
  return (key) => {
    const now = Date.now();
    const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
    arr.push(now); hits.set(key, arr);
    if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
    return arr.length <= max;
  };
}

/**
 * @param {import('./service').MpesaService} mpesa
 * @param {object} [o]
 * @param {number} [o.maxBodyBytes=16384]
 * @param {number} [o.stkPerMinute=5]     STK requests allowed per client IP per minute
 * @param {(req)=>string} [o.clientIp]    how to read the client IP (behind a proxy, use X-Forwarded-For from YOUR proxy only)
 */
function createHttpHandler(mpesa, o = {}) {
  const base = mpesa.basePath;
  const limit = o.maxBodyBytes || 16384;
  const allow = rateLimiter(o.stkPerMinute || 5, 60000);
  const ipOf = o.clientIp || ((req) => (req.socket && req.socket.remoteAddress) || 'unknown');

  return async function mpesaHandler(req, res, next) {
    const url = new URL(req.originalUrl || req.url, 'http://local');
    const p = url.pathname;
    if (!p.startsWith(base + '/')) return next ? next() : send(res, 404, { ok: false, error: 'Not found' });
    const rest = p.slice(base.length + 1).split('/');
    try {
      if (rest[0] === 'stk' && rest.length === 1) {
        if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'Method not allowed' });
        if (!allow(ipOf(req))) return send(res, 429, { ok: false, error: 'Too many payment requests. Wait a minute and try again.' });
        const body = await readJson(req, limit);
        const view = await mpesa.initiate({ orderId: body.orderId, phone: body.phone });
        return send(res, 201, { ok: true, payment: view });
      }
      if (rest[0] === 'status' && rest.length === 2) {
        if (req.method !== 'GET') return send(res, 405, { ok: false, error: 'Method not allowed' });
        const view = await mpesa.status(decodeURIComponent(rest[1]));
        return send(res, 200, { ok: true, payment: view });
      }
      if (rest[0] === 'callback' && rest.length === 2) {
        if (req.method !== 'POST') return send(res, 405, { ResultCode: 1, ResultDesc: 'Method not allowed' });
        let body;
        try { body = await readJson(req, limit); } catch (e) { return send(res, 400, { ResultCode: 1, ResultDesc: 'Bad request' }); }
        const r = await mpesa.handleCallback(body, decodeURIComponent(rest[1]));
        return send(res, r.status, r.body);
      }
      return next ? next() : send(res, 404, { ok: false, error: 'Not found' });
    } catch (e) {
      if (e instanceof MpesaError) {
        if (e.status >= 500) mpesa.log.error('[mpesa] ' + e.code + ': ' + (e.details || e.message));
        else if (e.details) mpesa.log.warn('[mpesa] ' + e.code + ': ' + e.details);
        return send(res, e.status, { ok: false, error: e.message, code: e.code });
      }
      mpesa.log.error('[mpesa] unexpected error: ' + (e && e.stack || e));
      return send(res, 500, { ok: false, error: 'Something went wrong. Please try again.' });
    }
  };
}

module.exports = { createHttpHandler, readJson };
