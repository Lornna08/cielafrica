/* ============================================================
   CIEL DOMAINS — orders, payments, fulfilment, refunds

   Lifecycle (order.status)
     awaiting_verification   request saved; we confirm availability/price before any charge
     pending_payment         ready to pay
     pending_registration    PAID (verified server-side) · waiting for manual registration
     registration_in_progress
     registered              confirmed by the registry (Truehost reference recorded)
     failed | unavailable    could not be registered
     refund_pending          refund started (provider or manual M-Pesa)
     refunded                refund confirmed
     cancelled               unpaid order closed
   ============================================================ */
const sec = require('./security');
const { quote } = require('./pricing');
const { validateDomain } = require('./normalize');
const { findTld } = require('./config');
const { normalizePhone } = require('./payments');

const STATUSES = ['awaiting_verification', 'pending_payment', 'pending_registration', 'registration_in_progress', 'registered', 'failed', 'unavailable', 'refund_pending', 'refunded', 'cancelled'];
const PUBLIC_LABELS = {
  awaiting_verification: 'Order received', pending_payment: 'Awaiting payment', pending_registration: 'Payment received',
  registration_in_progress: 'Payment received', registered: 'Registered', failed: 'Not registered', unavailable: 'Not registered',
  refund_pending: 'Refund in progress', refunded: 'Refunded', cancelled: 'Cancelled'
};
const LABELS = {
  awaiting_verification: 'Checking availability', pending_payment: 'Awaiting payment', pending_registration: 'Paid · pending registration',
  registration_in_progress: 'Registration in progress', registered: 'Registered', failed: 'Registration failed', unavailable: 'Unavailable',
  refund_pending: 'Refund pending', refunded: 'Refunded', cancelled: 'Cancelled'
};
// admin-driven status moves (payment + refunds have their own guarded actions)
const MOVES = {
  awaiting_verification: ['unavailable', 'cancelled'],
  pending_payment: ['cancelled', 'unavailable'],
  pending_registration: ['registration_in_progress', 'registered', 'failed', 'unavailable'],
  registration_in_progress: ['registered', 'failed', 'unavailable', 'pending_registration'],
  failed: ['registration_in_progress', 'pending_registration'],
  unavailable: ['registration_in_progress'],
  registered: [], refund_pending: [], refunded: [], cancelled: []
};
const FILTERS = {
  all: () => true,
  pending_payment: o => o.status === 'pending_payment' || o.status === 'awaiting_verification',
  paid: o => o.status === 'pending_registration',
  in_progress: o => o.status === 'registration_in_progress',
  registered: o => o.status === 'registered',
  failed: o => o.status === 'failed' || o.status === 'unavailable',
  refund_pending: o => o.status === 'refund_pending',
  refunded: o => o.status === 'refunded'
};
const TERMS_VERSION = '2026-10-24';
const RETAIN_UNPAID_DAYS = 30;

function E(status, code, message) { const e = new Error(message); e.status = status; e.code = code; return e; }
const clean = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const maskPhone = p => p ? p.slice(0, 6) + '•••' + p.slice(-3) : '';

function makeOrders(deps) {
  const { store, checker, email, now = () => Date.now() } = deps;
  const base = () => (process.env.DOMAINS_BASE_URL || deps.baseUrl || 'https://cielafrica.com').replace(/\/$/, '');
  const K = { o: r => 'dc:order:' + r, idx: 'dc:orders', audit: r => 'dc:audit:' + r, idem: k => 'dc:idem:' + k, pay: id => 'dc:pay:' + id, lock: r => 'dc:lk:' + r, paid: r => 'dc:paidlock:' + r, evt: id => 'dc:evt:' + id };
  const iso = () => new Date(now()).toISOString();
  const orderLink = o => base() + '/domains/order?ref=' + encodeURIComponent(o.ref) + '&k=' + encodeURIComponent(o.accessKey || '');
  const adminLink = o => base() + '/domains/admin#' + o.ref;

  async function get(ref) { if (!/^CD-[0-9A-Z]{8}$/.test(String(ref || ''))) return null; return store.get(K.o(ref)); }
  async function audit(ref, actor, action, detail) { await store.lpush(K.audit(ref), { at: iso(), actor, action, detail: detail || null }, 300); }

  /** read-modify-write under a short lock */
  async function update(ref, fn) {
    let got = false;
    for (let i = 0; i < 30 && !got; i++) { got = await store.set(K.lock(ref), 1, { ex: 15, nx: true }); if (!got) await new Promise(r => setTimeout(r, 100)); }
    if (!got) throw E(409, 'busy', 'This order is being updated — try again in a moment.');
    try {
      const o = await store.get(K.o(ref)); if (!o) throw E(404, 'not_found', 'Order not found.');
      const r = await fn(o);
      o.updatedAt = iso();
      await store.set(K.o(ref), o);
      return r === undefined ? o : r;
    } finally { await store.del(K.lock(ref)).catch(() => {}); }
  }

  async function sendCustomer(kind, o, extra) {
    const res = await email.notifyCustomer(kind, o, orderLink(o), extra);
    await store.lpush(K.audit(o.ref), { at: iso(), actor: 'system', action: 'email', detail: { kind, sent: !!(res && res.ok) } }, 300);
    return res;
  }

  /* ---------------- create ---------------- */
  /** validate an order request (shared by stored and token-based orders) */
  async function prepare(input, ctx) {
    const cfg = ctx.cfg;
    const v = validateDomain(input.domain, cfg.tlds.map(t => t.tld));
    if (!v.ok) throw E(400, v.code, v.message);
    const t = findTld(cfg, v.tld);
    if (!t || !t.enabled) throw E(400, 'tld', 'We don’t offer that extension right now.');
    const q = quote(t, Number(input.years), cfg.settings, v.label);
    if (!q.ok) throw E(400, q.code, q.message);
    const c = input.customer || {};
    const cust = {
      name: clean(c.name, 80), email: clean(c.email, 120).toLowerCase(), phone: clean(c.phone, 20),
      organisation: clean(c.organisation, 100), address: clean(c.address, 160), city: clean(c.city, 60), country: clean(c.country || 'Kenya', 60),
      notes: clean(c.notes, 400)
    };
    if (cust.name.length < 2) throw E(400, 'name', 'Enter the registrant’s full name.');
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(cust.email)) throw E(400, 'email', 'Enter a valid email address.');
    const ph = cust.phone.replace(/[^\d+]/g, '');
    if (!/^\+?\d{9,15}$/.test(ph)) throw E(400, 'phone', 'Enter a valid phone number.');
    cust.phone = normalizePhone(ph) || ph;
    if (cust.address.length < 3 || cust.city.length < 2) throw E(400, 'address', 'The registry needs a postal or street address and town.');
    if (input.agree !== true) throw E(400, 'terms', 'Please accept the registration and refund terms.');
    const idem = clean(input.idemKey, 64);
    if (!/^[A-Za-z0-9_-]{16,64}$/.test(idem)) throw E(400, 'idem', 'Missing request id.');
    return { v, t, q, cust, idem };
  }
  async function freshCheck(v, t, q) {
    const fresh = await checker.checkOne(v.domain, t, { fresh: true });
    if (fresh.state === 'registered' || fresh.state === 'reserved') throw E(409, 'taken', `Sorry — ${v.domain} was just taken. Pick another option.`);
    if (fresh.state !== 'available' && !q.verifyBeforePayment) throw E(503, 'check', 'We couldn’t check this name just now. Please try again in a moment.');
    return fresh;
  }

  async function create(input, ctx) {
    const { v, t, q, cust, idem } = await prepare(input, ctx);

    // duplicate submit → return the original order
    const prior = await store.get(K.idem(idem));
    if (prior) { const o = await get(prior.ref); if (o) return { order: o, key: prior.key, duplicate: true }; }

    // fresh availability check before checkout
    const fresh = await freshCheck(v, t, q);
    const mustVerify = q.verifyBeforePayment || !ctx.ordering;

    const ref = sec.orderRef(), key = sec.randomId(18);
    const claimed = await store.set(K.idem(idem), { ref, key }, { ex: 7 * 86400, nx: true });
    if (!claimed) { const p = await store.get(K.idem(idem)); const o = p && await get(p.ref); if (o) return { order: o, key: p.key, duplicate: true }; }

    const o = {
      ref, accessKey: key, createdAt: iso(), updatedAt: iso(), termsVersion: TERMS_VERSION,
      domain: v.domain, label: v.label, tld: v.tld, years: q.years,
      currency: q.currency, amount: q.total, quote: q, customer: cust,
      status: mustVerify ? 'awaiting_verification' : 'pending_payment',
      availability: { atOrder: fresh, last: fresh },
      verification: { status: mustVerify ? 'pending' : 'not_required', reasons: q.verifyReasons.concat(fresh.state !== 'available' ? ['availability'] : []).concat(!ctx.ordering ? ['ordering_closed'] : []) },
      payment: { status: 'unpaid', method: null, attempts: [] },
      registration: { truehostRef: '', nameservers: [], registeredAt: null, expiresAt: null, failureReason: '' },
      refund: { status: 'none' },
      consent: { agreedAt: iso(), termsVersion: TERMS_VERSION, ipHash: sec.sha(ctx.ip || '').slice(0, 16) },
      notes: []
    };
    await store.set(K.o(ref), o);
    await store.zadd(K.idx, now(), ref);
    await audit(ref, 'customer', 'created', { status: o.status, amount: o.amount, availability: fresh.state });
    await sendCustomer(mustVerify ? 'received_verify' : 'received_pay', o);
    await email.notifyTeam((mustVerify ? 'New request to verify: ' : 'New order (awaiting payment): ') + o.domain, o, null, adminLink(o));
    return { order: o, key, duplicate: false };
  }

  async function forCustomer(ref, key) {
    const o = await get(ref);
    if (!o || !key || !sec.safeEq(key, o.accessKey)) throw E(404, 'not_found', 'We couldn’t find that order. Check the link in your email.');
    return o;
  }

  function publicView(o) {
    return {
      ref: o.ref, domain: o.domain, tld: o.tld, years: o.years, currency: o.currency, amount: o.amount, quote: o.quote,
      status: o.status, statusLabel: PUBLIC_LABELS[o.status], createdAt: o.createdAt, updatedAt: o.updatedAt,
      customer: { name: o.customer.name, email: o.customer.email, phone: maskPhone(o.customer.phone) },
      verification: { status: o.verification.status, required: (o.verification.reasons || []).length > 0 }, priceChange: o.priceChange || null, proposal: o.proposal || null,
      payment: { status: o.payment.status, method: o.payment.method, paidAt: o.payment.paidAt || null, receipt: o.payment.receipt || null, pending: o.payment.attempts.some(a => a.status === 'pending') },
      registration: o.status === 'registered' ? { registeredAt: o.registration.registeredAt, expiresAt: o.registration.expiresAt, nameservers: o.registration.nameservers } : null,
      refund: { status: o.refund.status, amount: o.refund.amount || null, completedAt: o.refund.completedAt || null },
      availability: o.availability.last ? { state: o.availability.last.state, checkedAt: o.availability.last.checkedAt } : null
    };
  }

  /* ---------------- payments ---------------- */
  async function startPayment(ref, key, p, ctx) {
    const o = await forCustomer(ref, key);
    if (!ctx.ordering) throw E(403, 'closed', 'Online payment isn’t open yet — we’ll contact you to complete this order.');
    if (o.status !== 'pending_payment') throw E(409, 'state', o.status === 'awaiting_verification' ? 'We’re still confirming this domain — you’ll get a payment link by email.' : 'This order doesn’t need payment.');
    if (o.priceChange && !o.priceChange.accepted) throw E(409, 'price', 'Please accept the updated price first.');
    if (!o.amount || o.amount < 1) throw E(409, 'price', 'This order has no confirmed price yet.');
    const method = p.method === 'card' ? 'card' : 'mpesa';
    if (method === 'mpesa' && !ctx.mpesa) throw E(400, 'method', 'M-Pesa isn’t available right now.');
    if (method === 'card' && !ctx.card) throw E(400, 'method', 'Card payment isn’t available right now.');

    // never open a second payment while an earlier one could still complete:
    // settle older attempts with the provider first, and reuse a recent one
    for (const a of o.payment.attempts.filter(x => x.status === 'pending')) {
      const cur = await confirmAttempt(o.ref, a.id);
      if (cur && cur.payment.status === 'paid') return { method: cur.payment.method, paid: true };
    }
    const fresh = await get(o.ref);
    const live = fresh.payment.attempts.find(a => a.status === 'pending' && now() - Date.parse(a.startedAt) < 180000);
    if (live) return { method: live.method, pending: true, reused: true, url: live.url || null, message: 'A payment request is already open — finish it on your phone, or wait a couple of minutes to try again.' };

    if (method === 'mpesa') {
      const phone = normalizePhone(p.phone);
      if (!phone) throw E(400, 'phone', 'Enter the Safaricom number to pay from, e.g. 0712 345 678.');
      const cb = base() + '/api/domains/mpesa-callback?o=' + o.ref + '&t=' + sec.sign('mpesa|' + o.ref);
      const r = await deps.mpesa.stkPush({ phone, amount: o.amount, accountRef: o.ref, description: 'Domain ' + o.ref.slice(3), callbackUrl: cb });
      if (!r.ok) throw E(502, 'mpesa', r.error || 'M-Pesa didn’t accept the request. Try again.');
      await store.set(K.pay(r.checkoutRequestID), { ref: o.ref }, { ex: 30 * 86400 });
      await update(o.ref, x => { x.payment.status = 'pending'; x.payment.method = 'mpesa'; x.payment.attempts.push({ id: r.checkoutRequestID, method: 'mpesa', amount: x.amount, phone: maskPhone(phone), startedAt: iso(), status: 'pending' }); });
      await audit(o.ref, 'customer', 'payment_started', { method: 'mpesa', amount: o.amount });
      return { method, pending: true, message: 'Check your phone and enter your M-Pesa PIN.' };
    }
    const n = o.payment.attempts.length + 1, reference = o.ref + '-' + n;
    const r = await deps.paystack.initialize({ email: o.customer.email, amount: o.amount, reference, callbackUrl: base() + '/domains/order?ref=' + o.ref + '&k=' + encodeURIComponent(key), metadata: { order: o.ref, domain: o.domain } });
    if (!r.ok) throw E(502, 'card', r.error || 'Card payment could not start.');
    await store.set(K.pay(reference), { ref: o.ref }, { ex: 30 * 86400 });
    await update(o.ref, x => { x.payment.status = 'pending'; x.payment.method = 'card'; x.payment.attempts.push({ id: reference, method: 'card', amount: x.amount, startedAt: iso(), status: 'pending', url: r.url }); });
    await audit(o.ref, 'customer', 'payment_started', { method: 'card', amount: o.amount });
    return { method, pending: true, url: r.url };
  }

  /** confirm an attempt with the provider (never trusts the browser or an unsigned callback) */
  async function confirmAttempt(ref, attemptId, hint) {
    const o = await get(ref); if (!o) return null;
    const a = o.payment.attempts.find(x => x.id === attemptId); if (!a || a.status !== 'pending') return o;
    let v;
    try { v = a.method === 'mpesa' ? await deps.mpesa.query(attemptId) : await deps.paystack.verify(attemptId); }
    catch (e) { return o; }
    if (v.status === 'pending') return o;
    if (v.status === 'paid' && a.method === 'card' && (Math.round(v.amount) !== a.amount || v.currency !== 'KES')) {
      v = { status: 'failed', desc: 'amount mismatch' };
      await audit(ref, 'system', 'payment_mismatch', { expected: a.amount, got: v.amount });
    }
    if (v.status === 'paid') return markPaid(ref, attemptId, Object.assign({}, hint || {}, { channel: v.channel }));
    return update(ref, x => {
      const at = x.payment.attempts.find(y => y.id === attemptId); if (!at || at.status !== 'pending') return;
      at.status = 'failed'; at.result = clean(v.desc, 120); at.endedAt = iso();
      if (x.payment.status !== 'paid' && !x.payment.attempts.some(y => y.status === 'pending')) x.payment.status = 'failed';
    }).then(async x => { await audit(ref, 'system', 'payment_failed', { attempt: attemptId, desc: clean(v.desc, 120) }); return x; });
  }

  async function markPaid(ref, attemptId, hint) {
    // exactly-once: the first confirmation wins, duplicates are ignored
    const first = await store.set(K.paid(ref), attemptId, { nx: true });
    if (!first) {
      const o = await update(ref, x => { const at = x.payment.attempts.find(y => y.id === attemptId); if (at && at.status === 'pending') { at.status = 'duplicate_paid'; at.endedAt = iso(); if (hint && hint.receipt) at.receipt = clean(hint.receipt, 40); } });
      await audit(ref, 'system', 'duplicate_payment', { attempt: attemptId });
      await email.notifyTeam('DUPLICATE PAYMENT — refund the extra payment on ' + o.domain, o, [['Extra payment', attemptId + (hint && hint.receipt ? ' · ' + hint.receipt : '')]], adminLink(o));
      return o;
    }
    const o = await update(ref, x => {
      const at = x.payment.attempts.find(y => y.id === attemptId);
      if (at) { at.status = 'paid'; at.endedAt = iso(); if (hint && hint.receipt) at.receipt = clean(hint.receipt, 40); }
      x.payment.status = 'paid'; x.payment.method = at ? at.method : x.payment.method;
      x.payment.paidAt = iso(); x.payment.amount = at ? at.amount : x.amount; x.payment.reference = attemptId;
      x.payment.receipt = (hint && hint.receipt && clean(hint.receipt, 40)) || (at && at.method === 'card' ? attemptId : '');
      if (x.status === 'pending_payment') x.status = 'pending_registration';
      x.verification.status = x.verification.status === 'verified' ? 'verified' : 'recheck_before_registering';
    });
    await audit(ref, 'system', 'payment_confirmed', { attempt: attemptId, amount: o.payment.amount, method: o.payment.method });
    await sendCustomer('payment_confirmed', o);
    await email.notifyTeam('PAID — register ' + o.domain + ' on Truehost', o, [['Recheck first', 'Search the domain on Truehost before buying'], ['Payment ref', o.payment.receipt || o.payment.reference]], adminLink(o));
    return o;
  }

  /** customer page polls this: confirm pending attempts older than a few seconds */
  async function refresh(o) {
    const pend = o.payment.attempts.filter(a => a.status === 'pending' && now() - Date.parse(a.startedAt) > 4000);
    let cur = o;
    for (const a of pend) cur = (await confirmAttempt(o.ref, a.id)) || cur;
    // give up on abandoned attempts after 10 minutes (the customer can retry)
    return cur;
  }

  async function mpesaCallback(q, body) {
    const ref = String(q.o || '');
    if (!/^CD-[0-9A-Z]{8}$/.test(ref) || !sec.safeEq(q.t, sec.sign('mpesa|' + ref))) return { ok: false, reason: 'bad token' };
    const cb = (body && body.Body && body.Body.stkCallback) || {};
    const id = cb.CheckoutRequestID; if (!id) return { ok: false, reason: 'no id' };
    const map = await store.get(K.pay(id)); if (!map || map.ref !== ref) return { ok: false, reason: 'unknown attempt' };
    const seen = await store.set(K.evt('mp:' + id), 1, { ex: 7 * 86400, nx: true });
    const items = (cb.CallbackMetadata && cb.CallbackMetadata.Item) || [];
    const val = n => { const it = items.find(x => x.Name === n); return it ? it.Value : null; };
    if (val('Amount') != null) {
      const o = await get(ref); const a = o && o.payment.attempts.find(x => x.id === id);
      if (a && Math.round(Number(val('Amount'))) !== a.amount) { await audit(ref, 'system', 'payment_mismatch', { expected: a.amount, got: val('Amount') }); return { ok: true, ignored: 'amount' }; }
    }
    await confirmAttempt(ref, id, { receipt: val('MpesaReceiptNumber') });
    return { ok: true, duplicate: !seen };
  }

  async function paystackWebhook(raw, sig) {
    if (!deps.paystack.verifySignature(raw, sig)) return { ok: false, status: 401 };
    let ev; try { ev = JSON.parse(raw); } catch (e) { return { ok: false, status: 400 }; }
    const d = ev.data || {}, evId = ev.event + ':' + (d.id || d.reference || '');
    const fresh = await store.set(K.evt('ps:' + evId), 1, { ex: 30 * 86400, nx: true });
    if (!fresh) return { ok: true, duplicate: true };
    if (ev.event === 'charge.success' && d.reference) {
      const map = await store.get(K.pay(d.reference)); if (map) await confirmAttempt(map.ref, d.reference);
    }
    if (/^refund\./.test(ev.event)) {
      const txRef = (d.transaction && d.transaction.reference) || d.transaction_reference || '';
      const map = txRef && await store.get(K.pay(txRef));
      if (map) {
        const kind = ev.event.split('.')[1];
        const o = await update(map.ref, x => {
          if (kind === 'processed') { x.refund.status = 'completed'; x.refund.completedAt = iso(); x.refund.providerRef = String(d.id || x.refund.providerRef || ''); x.status = 'refunded'; }
          else if (kind === 'failed') { x.refund.status = 'failed'; }
          else if (x.refund.status !== 'completed') x.refund.status = 'processing';
        });
        await audit(map.ref, 'paystack', 'refund_' + kind, { id: d.id });
        if (kind === 'processed') await sendCustomer('refund_completed', o);
      }
    }
    return { ok: true };
  }

  /* ---------------- customer decisions ---------------- */
  async function customerAction(ref, key, action) {
    const o0 = await forCustomer(ref, key);
    if (action === 'accept_price' || action === 'decline_price') {
      if (!o0.priceChange || o0.priceChange.accepted) throw E(409, 'state', 'There’s no price change waiting for you.');
      const o = await update(ref, x => {
        if (action === 'accept_price') { x.priceChange.accepted = true; x.priceChange.acceptedAt = iso(); x.amount = x.priceChange.to; x.quote = Object.assign({}, x.quote, { total: x.priceChange.to, subtotal: x.priceChange.to, adjusted: true }); x.status = 'pending_payment'; x.verification.status = 'verified'; }
        else { x.priceChange.declined = true; x.status = 'cancelled'; }
      });
      await audit(ref, 'customer', action, { to: o.priceChange.to });
      await email.notifyTeam('Customer ' + (action === 'accept_price' ? 'accepted' : 'declined') + ' new price: ' + o.domain, o, null, adminLink(o));
      return o;
    }
    if (action === 'accept_alternative' || action === 'decline_alternative') {
      if (!o0.proposal || o0.proposal.decided) throw E(409, 'state', 'There’s no alternative waiting for you.');
      const o = await update(ref, x => {
        x.proposal.decided = action; x.proposal.decidedAt = iso();
        if (action === 'accept_alternative') {
          x.previousDomains = (x.previousDomains || []).concat([x.domain]);
          const v = validateDomain(x.proposal.domain, [x.proposal.tld]);
          x.domain = v.domain; x.label = v.label; x.tld = v.tld;
          x.status = 'pending_registration'; x.verification.status = 'recheck_before_registering'; x.registration.failureReason = '';
        }
      });
      await audit(ref, 'customer', action, { domain: o0.proposal.domain });
      await email.notifyTeam('Customer ' + (action === 'accept_alternative' ? 'ACCEPTED' : 'declined') + ' alternative ' + o0.proposal.domain, o, null, adminLink(o));
      return o;
    }
    throw E(400, 'action', 'Unknown action.');
  }

  /* ---------------- admin ---------------- */
  async function list(filter, limit) {
    const refs = await store.zrevrange(K.idx, 0, (limit || 1000) - 1);
    const all = (await store.mget(refs.map(K.o))).filter(Boolean);
    const f = FILTERS[filter] || FILTERS.all;
    return all.filter(f);
  }

  async function adminAction(ref, action, d, ctx) {
    d = d || {}; const actor = 'admin';
    const o0 = await get(ref); if (!o0) throw E(404, 'not_found', 'Order not found.');
    const paid = o0.payment.status === 'paid';
    switch (action) {
      case 'recheck': {
        const t = findTld(ctx.cfg, o0.tld) || { tld: o0.tld, method: 'dns' };
        const r = await checker.checkOne(o0.domain, t, { fresh: true });
        const o = await update(ref, x => { x.availability.last = r; });
        await audit(ref, actor, 'recheck', { state: r.state, source: r.sourceName });
        return o;
      }
      case 'mark_verified': {
        const note = clean(d.note, 300);
        const newAmt = d.amount === undefined || d.amount === '' || d.amount === null ? null : Math.round(Number(d.amount));
        if (newAmt !== null && !(newAmt >= 1 && newAmt < 10000000)) throw E(400, 'amount', 'Enter a valid amount in KES.');
        if (o0.status === 'awaiting_verification' && o0.amount == null && newAmt === null) throw E(400, 'amount', 'This extension has no list price — enter the confirmed total in KES.');
        const o = await update(ref, x => {
          x.verification.status = 'verified'; x.verification.at = iso(); x.verification.note = note;
          if (x.status === 'awaiting_verification') {
            if (newAmt !== null && x.amount != null && newAmt !== x.amount) { x.priceChange = { from: x.amount, to: newAmt, at: iso(), accepted: false }; }
            else {
              if (x.amount == null && newAmt !== null) { x.amount = newAmt; x.quote = Object.assign({}, x.quote, { total: newAmt, subtotal: newAmt, priced: true, confirmedByAdmin: true }); }
              if (x.amount) x.status = 'pending_payment';
            }
          }
        });
        await audit(ref, actor, 'verified', { note, amount: newAmt });
        if (o.status === 'awaiting_verification' && o.priceChange && !o.priceChange.accepted) await sendCustomer('price_change', o, { fetch: undefined });
        else if (o0.status === 'awaiting_verification' && o.status === 'pending_payment') await sendCustomer('verified', o, { cardEnabled: !!ctx.card });
        return o;
      }
      case 'set_status': {
        const to = String(d.status || '');
        if (!STATUSES.includes(to) || !(MOVES[o0.status] || []).includes(to)) throw E(400, 'move', `Can’t move an order from “${LABELS[o0.status]}” to “${LABELS[to] || to}”.`);
        if (['registration_in_progress', 'registered'].includes(to) && !paid) throw E(400, 'unpaid', 'Only paid orders can be registered.');
        if (to === 'registered' && !clean(d.truehostRef || o0.registration.truehostRef, 80)) throw E(400, 'truehost', 'Record the Truehost transaction/order reference first.');
        if (to === 'registration_in_progress' && o0.verification.status === 'recheck_before_registering' && d.rechecked !== true) throw E(400, 'recheck', 'Recheck availability (or confirm you searched it on Truehost) before registering.');
        const reason = clean(d.reason, 200);
        const o = await update(ref, x => {
          x.status = to;
          if (to === 'registration_in_progress' && x.verification.status === 'recheck_before_registering') { x.verification.status = 'verified'; x.verification.at = iso(); }
          if (to === 'registered') { x.registration.registeredAt = iso(); if (d.truehostRef) x.registration.truehostRef = clean(d.truehostRef, 80); if (d.expiresAt) x.registration.expiresAt = clean(d.expiresAt, 10); }
          if (to === 'failed' || to === 'unavailable') x.registration.failureReason = reason || (to === 'unavailable' ? 'the domain was taken before we could register it' : 'the registry rejected the registration');
        });
        await audit(ref, actor, 'status', { from: o0.status, to, reason });
        if (to === 'registration_in_progress') await sendCustomer('in_progress', o);
        if (to === 'registered') await sendCustomer('registered', o);
        if (to === 'failed' || to === 'unavailable') await sendCustomer('unavailable', o);
        return o;
      }
      case 'record_registration': {
        const ns = (Array.isArray(d.nameservers) ? d.nameservers : String(d.nameservers || '').split(/[\s,]+/)).map(s => s.trim().toLowerCase()).filter(s => /^[a-z0-9.-]{3,253}$/.test(s)).slice(0, 8);
        const o = await update(ref, x => {
          if (d.truehostRef !== undefined) x.registration.truehostRef = clean(d.truehostRef, 80);
          if (d.nameservers !== undefined) x.registration.nameservers = ns;
          if (d.expiresAt !== undefined) x.registration.expiresAt = /^\d{4}-\d{2}-\d{2}$/.test(d.expiresAt) ? d.expiresAt : x.registration.expiresAt;
          if (d.setupNotes !== undefined) x.registration.setupNotes = clean(d.setupNotes, 400);
        });
        await audit(ref, actor, 'registration_details', { truehostRef: o.registration.truehostRef, nameservers: ns });
        return o;
      }
      case 'propose_alternative': {
        if (!paid || !['failed', 'unavailable'].includes(o0.status)) throw E(400, 'state', 'Alternatives are offered on paid orders that couldn’t be registered.');
        const v = validateDomain(d.domain, ctx.cfg.tlds.map(t => t.tld)); if (!v.ok) throw E(400, v.code, v.message);
        const o = await update(ref, x => { x.proposal = { domain: v.domain, tld: v.tld, at: iso(), samePrice: true }; });
        await audit(ref, actor, 'proposed_alternative', { domain: v.domain });
        await sendCustomer('alternative', o);
        return o;
      }
      case 'refund_start': {
        if (!paid) throw E(400, 'unpaid', 'Nothing was paid on this order.');
        if (!['failed', 'unavailable'].includes(o0.status) && d.override !== true) throw E(400, 'state', 'Refunds start from failed or unavailable orders (tick override to refund another state).');
        if (o0.refund.status !== 'none' && o0.refund.status !== 'failed') throw E(409, 'state', 'A refund is already ' + o0.refund.status + '.');
        const amount = d.amount ? Math.round(Number(d.amount)) : o0.payment.amount;
        if (!(amount >= 1 && amount <= o0.payment.amount)) throw E(400, 'amount', 'Refund must be between 1 and the amount paid.');
        let providerRes = null;
        if (o0.payment.method === 'card') {
          if (!ctx.card) throw E(400, 'card', 'Paystack isn’t configured — refund from the Paystack dashboard, then record it.');
          providerRes = await deps.paystack.refund({ reference: o0.payment.reference, amount });
          if (!providerRes.ok) throw E(502, 'refund', 'Paystack: ' + providerRes.error);
        }
        const o = await update(ref, x => {
          x.refund = { status: x.payment.method === 'card' ? 'processing' : 'pending', amount, method: x.payment.method, requestedAt: iso(), providerRef: providerRes ? String(providerRes.id || '') : '', note: clean(d.note, 200), fromStatus: x.status };
          x.status = 'refund_pending';
        });
        await audit(ref, actor, 'refund_started', { amount, method: o.refund.method, provider: providerRes ? 'paystack' : 'manual' });
        await sendCustomer('refund_initiated', o);
        return o;
      }
      case 'refund_complete': {
        if (o0.status !== 'refund_pending') throw E(400, 'state', 'Start the refund first.');
        const pref = clean(d.providerRef, 60);
        if (o0.refund.method !== 'card' && !/^[A-Z0-9]{8,12}$/i.test(pref)) throw E(400, 'ref', 'Enter the M-Pesa transaction code of the refund you sent (e.g. SJK3XY12AB).');
        const o = await update(ref, x => { x.refund.status = 'completed'; x.refund.completedAt = iso(); x.refund.providerRef = pref || x.refund.providerRef; x.status = 'refunded'; });
        await audit(ref, actor, 'refund_completed', { providerRef: pref });
        await sendCustomer('refund_completed', o);
        return o;
      }
      case 'refund_failed': {
        if (o0.status !== 'refund_pending') throw E(400, 'state', 'No refund in progress.');
        const o = await update(ref, x => { x.refund.status = 'failed'; x.refund.failedReason = clean(d.reason, 200); x.status = x.refund.fromStatus || 'failed'; });
        await audit(ref, actor, 'refund_failed', { reason: clean(d.reason, 200) });
        return o;
      }
      case 'note': {
        const text = clean(d.text, 1000); if (!text) throw E(400, 'note', 'Write a note first.');
        const o = await update(ref, x => { x.notes.push({ at: iso(), text }); });
        await audit(ref, actor, 'note', null);
        return o;
      }
      case 'resend': {
        const kind = String(d.kind || '');
        const allowed = { received: o0.status === 'awaiting_verification' ? 'received_verify' : 'received_pay', verified: 'verified', payment_confirmed: 'payment_confirmed', in_progress: 'in_progress', registered: 'registered', unavailable: 'unavailable', alternative: 'alternative', refund_initiated: 'refund_initiated', refund_completed: 'refund_completed', price_change: 'price_change' };
        const k = allowed[kind]; if (!k) throw E(400, 'kind', 'Unknown email.');
        if (k === 'registered' && o0.status !== 'registered') throw E(400, 'state', 'Only send “registered” after registration is confirmed.');
        if (k === 'payment_confirmed' && !paid) throw E(400, 'state', 'Payment isn’t confirmed.');
        if (k === 'refund_completed' && o0.refund.status !== 'completed') throw E(400, 'state', 'Refund isn’t completed.');
        const r = await sendCustomer(k, o0, { cardEnabled: !!ctx.card });
        await audit(ref, actor, 'resend', { kind: k, sent: !!(r && r.ok) });
        return o0;
      }
      case 'cancel': {
        if (paid) throw E(400, 'paid', 'Paid orders are refunded, not cancelled.');
        const o = await update(ref, x => { x.status = 'cancelled'; x.cancelReason = clean(d.reason, 200); });
        await audit(ref, actor, 'cancelled', { reason: clean(d.reason, 200) });
        return o;
      }
      default: throw E(400, 'action', 'Unknown action.');
    }
  }

  /** data retention: unpaid orders older than 30 days are deleted */
  async function purgeUnpaid() {
    const all = await list('all', 5000), cutoff = now() - RETAIN_UNPAID_DAYS * 86400000;
    let n = 0;
    for (const o of all) {
      if (o.payment.status === 'paid' || o.payment.attempts.some(a => a.status === 'paid' || a.status === 'pending')) continue;
      if (Date.parse(o.createdAt) > cutoff) continue;
      if (!['awaiting_verification', 'pending_payment', 'cancelled', 'unavailable'].includes(o.status)) continue;
      await store.del(K.o(o.ref)); await store.zrem(K.idx, o.ref); await store.del(K.audit(o.ref)); n++;
    }
    return n;
  }

  function adminView(o) { const x = Object.assign({}, o); delete x.accessKey; return x; }

  async function auditLog(ref) { return store.lrange(K.audit(ref), 0, 299); }

  function csv(orders) {
    const cols = ['ref', 'createdAt', 'updatedAt', 'domain', 'tld', 'years', 'amount', 'currency', 'status', 'payment', 'paymentMethod', 'paymentRef', 'verification', 'refund', 'refundRef', 'truehostRef', 'name', 'email', 'phone', 'organisation', 'city', 'country'];
    const q = v => { v = v == null ? '' : String(v); if (/^[=+\-@\t\r]/.test(v)) v = "'" + v; return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    const rows = orders.map(o => [o.ref, o.createdAt, o.updatedAt, o.domain, o.tld, o.years, o.amount, o.currency, o.status, o.payment.status, o.payment.method, o.payment.receipt || o.payment.reference, o.verification.status, o.refund.status, o.refund.providerRef, o.registration.truehostRef, o.customer.name, o.customer.email, o.customer.phone, o.customer.organisation, o.customer.city, o.customer.country].map(q).join(','));
    return cols.join(',') + '\n' + rows.join('\n') + '\n';
  }

  return { prepare, freshCheck, create, get, forCustomer, publicView, adminView, startPayment, refresh, confirmAttempt, markPaid, mpesaCallback, paystackWebhook, customerAction, list, adminAction, auditLog, purgeUnpaid, csv, orderLink };
}

module.exports = { makeOrders, STATUSES, LABELS, FILTERS, MOVES, TERMS_VERSION, RETAIN_UNPAID_DAYS };
