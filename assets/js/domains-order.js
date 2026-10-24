/* CIEL DOMAINS — order tracking + payment page (/domains/order?ref=…&k=…) */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var money = function (n) { return n == null ? 'To be confirmed' : 'KES ' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); };
  var root = $('#dmOrder');
  var u = new URLSearchParams(location.search), ref = (u.get('ref') || '').split('?')[0], key = (u.get('k') || '').split('?')[0];
  var data = null, poll = null, pollUntil = 0, payMsg = '';

  function api(route, body) {
    return fetch('/api/domains/' + route, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'ciel' }, body: body ? JSON.stringify(body) : undefined })
      .then(function (r) { return r.json().catch(function () { return { ok: false, error: 'Unexpected response.' }; }); })
      .catch(function () { return { ok: false, error: 'You seem to be offline. Try again.' }; });
  }
  function load(quiet) {
    if (!ref || !key) { root.innerHTML = '<div class="dmcard"><h2>We need your order link</h2><p>Open the link in the email we sent you. It contains your order reference and a private key.</p><p style="margin-top:1rem"><a class="btn btn--dark" href="/domains">Search for a domain</a></p></div>'; return Promise.resolve(); }
    return api('order?ref=' + encodeURIComponent(ref) + '&k=' + encodeURIComponent(key)).then(function (j) {
      if (!j.ok) { if (!quiet) root.innerHTML = '<div class="dmcard"><h2>Order not found</h2><p>' + esc(j.error || 'Check the link in your email.') + '</p></div>'; return; }
      data = j; render();
      var p = j.order.payment;
      if (p.pending && Date.now() < pollUntil) schedule(); else stopPoll();
      if (!p.pending && pollUntil && p.status === 'failed') { payMsg = '<div class="dmmsg">The payment wasn’t completed. You can try again.</div>'; pollUntil = 0; render(); }
    });
  }
  function schedule() { stopPoll(); poll = setTimeout(function () { load(true); }, 4000); }
  function stopPoll() { if (poll) clearTimeout(poll); poll = null; }

  var STEPS = [
    ['placed', 'Order placed', 'We saved your order and emailed you a copy.'],
    ['verify', 'Confirmed with the registry', 'Availability and price checked before payment.'],
    ['paid', 'Payment confirmed', 'Verified with the payment provider.'],
    ['registering', 'Registering', 'We register the domain by hand with the registry.'],
    ['done', 'Registered', 'The registry confirmed it’s yours.']
  ];
  function stage(o) {
    var s = o.status;
    if (s === 'awaiting_verification') return { at: 1, bad: false };
    if (s === 'pending_payment') return { at: 2, bad: false };
    if (s === 'pending_registration') return { at: 3, bad: false };
    if (s === 'registration_in_progress') return { at: 3, bad: false, now: true };
    if (s === 'registered') return { at: 5, bad: false };
    return { at: o.payment.status === 'paid' ? 3 : 1, bad: true };
  }

  function render() {
    var o = data.order, st = stage(o), needVerify = !!o.verification.required;
    var tl = STEPS.filter(function (x) { return x[0] !== 'verify' || needVerify; }).map(function (x, n) {
      var idx = STEPS.indexOf(x), cls = idx < st.at ? 'done' : idx === st.at ? (st.bad ? 'bad' : 'now') : '';
      if (st.bad && idx === st.at) return '<li class="bad"><span class="dmtl__i">!</span><div><b>' + esc(o.statusLabel) + '</b><span>' + badText(o) + '</span></div></li>';
      return '<li class="' + cls + '"><span class="dmtl__i">' + (cls === 'done' ? '✓' : n + 1) + '</span><div><b>' + x[1] + '</b><span>' + x[2] + '</span></div></li>';
    }).join('');
    var left = '<div class="dmcard"><p style="font-size:.85rem;color:var(--ink-faint)">Order ' + esc(o.ref) + '</p><div class="dmdom" style="margin-top:.4rem">' + esc(o.domain.split('.')[0]) + '<em>.' + esc(o.domain.slice(o.domain.indexOf('.') + 1)) + '</em></div>' +
      '<div class="dmmain__st"><span class="pill ' + pillCls(o) + '">' + esc(o.statusLabel) + '</span></div><ol class="dmtl">' + tl + '</ol></div>' + actionCard(o);
    var s = data.support || {};
    var right = '<div class="dmcard"><h2>Summary</h2><dl class="dmkv"><dt>Domain</dt><dd>' + esc(o.domain) + '</dd><dt>Term</dt><dd>' + o.years + ' year' + (o.years > 1 ? 's' : '') + '</dd><dt>Total</dt><dd>' + money(o.amount) + '</dd>' +
      (o.quote && o.quote.renewal != null ? '<dt>Renews at</dt><dd>' + money(o.quote.renewal) + ' / yr</dd>' : '') +
      '<dt>Payment</dt><dd>' + esc(payLabel(o)) + '</dd>' + (o.payment.receipt ? '<dt>Payment ref</dt><dd>' + esc(o.payment.receipt) + '</dd>' : '') +
      (o.registration ? '<dt>Registered</dt><dd>' + esc((o.registration.registeredAt || '').slice(0, 10)) + '</dd>' + (o.registration.expiresAt ? '<dt>Expires</dt><dd>' + esc(o.registration.expiresAt) + '</dd>' : '') + (o.registration.nameservers && o.registration.nameservers.length ? '<dt>Nameservers</dt><dd>' + o.registration.nameservers.map(esc).join('<br>') + '</dd>' : '') : '') +
      (o.refund.status !== 'none' ? '<dt>Refund</dt><dd>' + esc(refundLabel(o)) + '</dd>' : '') +
      '<dt>Registrant</dt><dd>' + esc(o.customer.name) + '</dd><dt>Email</dt><dd>' + esc(o.customer.email) + '</dd></dl></div>' +
      '<div class="dmcard"><h2>Need help?</h2><p style="font-size:.92rem">Quote <b>' + esc(o.ref) + '</b> and we’ll find your order straight away.</p><div class="dmlinks" style="margin-top:1rem"><a class="btn btn--dark btn--sm" href="https://wa.me/' + esc(s.whatsapp || '254706549703') + '?text=' + encodeURIComponent('Hi Ciel Africa, about my domain order ' + o.ref) + '" target="_blank" rel="noopener">WhatsApp</a><a class="btn btn--ghost btn--sm" href="mailto:' + esc(s.email || 'hello@cielafrica.com') + '?subject=' + encodeURIComponent('Domain order ' + o.ref) + '">Email us</a></div>' +
      '<p style="font-size:.82rem;margin-top:1rem">Search results don’t reserve a domain. It’s yours once this page says <b>Registered</b>. <a href="/domains/terms" style="text-decoration:underline">Terms</a>.</p></div>';
    root.innerHTML = '<div class="dmop__grid"><div>' + left + '</div><div>' + right + '</div></div>';
    bind();
  }
  function pillCls(o) { return o.status === 'registered' ? 'pill--available' : ['failed', 'unavailable', 'cancelled'].indexOf(o.status) > -1 ? 'pill--registered' : o.status === 'refunded' ? 'pill--registered' : 'pill--unknown'; }
  function payLabel(o) { var p = o.payment; return p.status === 'paid' ? 'Paid' + (p.method === 'mpesa' ? ' · M-Pesa' : p.method === 'card' ? ' · card' : '') : p.status === 'pending' ? 'Waiting for confirmation' : p.status === 'failed' ? 'Not completed' : 'Not paid'; }
  function refundLabel(o) { var r = o.refund; return r.status === 'completed' ? 'Completed · ' + money(r.amount) : r.status === 'failed' ? 'Needs attention — we’ll contact you' : 'In progress · ' + money(r.amount); }
  function badText(o) {
    if (o.status === 'cancelled') return 'This order was closed. Nothing was charged.';
    if (o.status === 'refund_pending') return 'Your refund has been started. Timing depends on the payment provider.';
    if (o.status === 'refunded') return 'Your refund is complete.';
    return o.payment.status === 'paid' ? 'We couldn’t register this domain. You’re eligible for a full refund, or an alternative at the same price if you agree.' : 'This domain can’t be registered. Nothing was charged.';
  }

  function actionCard(o) {
    if (o.priceChange && !o.priceChange.accepted && !o.priceChange.declined) {
      return '<div class="dmcard"><h2>The registry price is different</h2><p>We checked with the registry: <b>' + esc(o.domain) + '</b> costs <b>' + money(o.priceChange.to) + '</b> for this term (you saw ' + money(o.priceChange.from) + '). Nothing has been charged. Would you like to continue?</p><div class="dmlinks"><button class="btn btn--p" data-act="accept_price">Accept ' + money(o.priceChange.to) + '</button><button class="btn btn--ghost" data-act="decline_price">No thanks, cancel</button></div><div id="actMsg" style="margin-top:.8rem"></div></div>';
    }
    if (o.proposal && !o.proposal.decided) {
      return '<div class="dmcard"><h2>Would this work instead?</h2><p>We can register <b>' + esc(o.proposal.domain) + '</b> at the same price you paid. We’ll only switch with your agreement — otherwise you get a full refund.</p><div class="dmlinks"><button class="btn btn--p" data-act="accept_alternative">Yes, register ' + esc(o.proposal.domain) + '</button><button class="btn btn--ghost" data-act="decline_alternative">No, refund me</button></div><div id="actMsg" style="margin-top:.8rem"></div></div>';
    }
    if (o.status === 'awaiting_verification') return '<div class="dmcard"><h2>We’re confirming your domain</h2><p>Before taking any payment, we check with the registry that <b>' + esc(o.domain) + '</b> can be registered and what it costs. You’ll get an email with a payment link — usually within one working day.</p></div>';
    if (o.status !== 'pending_payment') return '';
    if (!data.ordering) return '<div class="dmcard"><h2>Payment</h2><p>Online payment isn’t open yet. We’ll contact you to complete this order.</p></div>';
    var p = o.payment;
    if (p.pending) return '<div class="dmcard"><h2>Waiting for your payment</h2><p>Check your phone and enter your M-Pesa PIN. This page updates on its own once Safaricom confirms the payment — please don’t pay twice.</p><div class="dmlinks"><button class="btn btn--ghost btn--sm" data-refresh>I’ve paid — check now</button></div>' + payMsg + '</div>';
    var mp = data.payments.mpesa, cd = data.payments.card;
    return '<div class="dmcard"><h2>Pay ' + money(o.amount) + '</h2><div class="dmpay">' +
      (mp ? '<div class="fld"><label for="payPhone">M-Pesa number</label><input id="payPhone" type="tel" inputmode="tel" placeholder="0712 345 678" maxlength="16" autocomplete="tel"></div><button class="btn btn--p" data-pay="mpesa">Pay with M-Pesa</button>' : '') +
      (mp && cd ? '<div class="dmpay__or">or</div>' : '') +
      (cd ? '<button class="btn btn--dark" data-pay="card">Pay by card</button>' : '') +
      (!mp && !cd ? '<p>Payment methods are temporarily unavailable. Please contact us with your reference.</p>' : '') +
      '<p style="font-size:.82rem">You’ll get a payment prompt on your phone. We register the domain once payment is confirmed. If it can’t be registered, you’re eligible for a full refund.</p>' + payMsg + '</div></div>';
  }

  function bind() {
    var pb = root.querySelectorAll('[data-pay]');
    [].forEach.call(pb, function (b) {
      b.addEventListener('click', function () {
        var method = b.dataset.pay, phone = method === 'mpesa' ? ($('#payPhone') || {}).value : '';
        if (method === 'mpesa' && !/^(\+?254|0)?[17]\d{8}$/.test(String(phone || '').replace(/[\s-]/g, ''))) { payMsg = '<div class="dmmsg">Enter a Safaricom number like 0712 345 678.</div>'; render(); $('#payPhone').value = phone; return; }
        b.disabled = true; b.textContent = 'Starting…';
        api('pay', { ref: ref, k: key, method: method, phone: phone }).then(function (j) {
          if (!j.ok) { payMsg = '<div class="dmmsg">' + esc(j.error || 'Payment could not start.') + '</div>'; render(); return; }
          if (j.url) { location.href = j.url; return; }
          payMsg = ''; pollUntil = Date.now() + 3 * 60000; load(true);
        });
      });
    });
    var r = root.querySelector('[data-refresh]'); if (r) r.addEventListener('click', function () { r.disabled = true; pollUntil = Math.max(pollUntil, Date.now() + 60000); load(true); });
    [].forEach.call(root.querySelectorAll('[data-act]'), function (b) {
      b.addEventListener('click', function () {
        [].forEach.call(root.querySelectorAll('[data-act]'), function (x) { x.disabled = true; });
        api('respond', { ref: ref, k: key, action: b.dataset.act }).then(function (j) {
          if (!j.ok) { $('#actMsg').innerHTML = '<div class="dmmsg">' + esc(j.error) + '</div>'; [].forEach.call(root.querySelectorAll('[data-act]'), function (x) { x.disabled = false; }); return; }
          load();
        });
      });
    });
  }

  // returning from a card payment: keep checking for a short while
  if (/[?&](reference|trxref)=/.test(location.search)) pollUntil = Date.now() + 60000;
  load();
})();
