/* ============================================================
   Ciel M-Pesa — checkout component (browser, no dependencies)

   CielCheckout.mount(el, {
     theme,        // theme JSON (see theme.example.json)
     order,        // { id, description, amount, currency }  shown to the buyer
     transport,    // CielCheckout.httpTransport('/mpesa') for real payments
     pollMs, maxWaitMs
   }) -> { setTheme, setOrder, reset, state }

   The amount shown here is for display only. Your server decides what is
   charged (resolveOrder) and only Safaricom's answer marks a payment paid.
   ============================================================ */
(function (root) {
  'use strict';

  var DEFAULT_THEME = {
    version: 1, merchantName: 'Your Store', mode: 'light',
    colors: { primary: '#141414', accent: '#FF5A1F', background: '#F4F2EE', button: '#1F9D55', buttonText: '#FFFFFF' },
    radius: 12, buttonStyle: 'solid', font: 'system', layout: 'card'
  };
  var ENUMS = { mode: ['light', 'dark'], buttonStyle: ['solid', 'outline', 'pill'], font: ['system', 'rounded', 'serif', 'mono'], layout: ['card', 'split', 'compact'] };
  var FONT_STACKS = {
    system: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    rounded: 'ui-rounded, "SF Pro Rounded", "Nunito", "Segoe UI", system-ui, sans-serif',
    serif: 'Georgia, "Times New Roman", "Iowan Old Style", serif',
    mono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace'
  };
  var HEX = /^#(?:[0-9a-fA-F]{3}){1,2}$/;

  function validateTheme(input) {
    var t = JSON.parse(JSON.stringify(DEFAULT_THEME)), src = input && typeof input === 'object' ? input : {};
    if (src.merchantName != null) { var n = String(src.merchantName).replace(/[<>]/g, '').trim().slice(0, 40); if (n) t.merchantName = n; }
    Object.keys(ENUMS).forEach(function (k) { if (src[k] != null && ENUMS[k].indexOf(src[k]) >= 0) t[k] = src[k]; });
    if (src.radius != null) { var r = Number(src.radius); if (isFinite(r) && r >= 0 && r <= 28) t.radius = Math.round(r); }
    var c = src.colors && typeof src.colors === 'object' ? src.colors : {};
    Object.keys(DEFAULT_THEME.colors).forEach(function (k) { if (c[k] != null && HEX.test(String(c[k]))) t.colors[k] = String(c[k]).toUpperCase(); });
    return t;
  }
  function cssVars(theme) {
    var t = validateTheme(theme), dark = t.mode === 'dark';
    return {
      '--cm-primary': t.colors.primary, '--cm-accent': t.colors.accent, '--cm-bg': t.colors.background,
      '--cm-surface': dark ? '#16191E' : '#FFFFFF', '--cm-text': dark ? '#F1F2F4' : '#16181B',
      '--cm-muted': dark ? '#9AA1AB' : '#6B6F76', '--cm-line': dark ? '#2A2F37' : '#E4E1DA',
      '--cm-btn': t.colors.button, '--cm-btn-text': t.colors.buttonText,
      '--cm-radius': t.radius + 'px', '--cm-btn-radius': t.buttonStyle === 'pill' ? '999px' : t.radius + 'px',
      '--cm-font': FONT_STACKS[t.font]
    };
  }
  function normalizePhone(input) {
    var p = String(input == null ? '' : input).trim().replace(/[\s\-().]/g, '');
    if (p.charAt(0) === '+') p = p.slice(1);
    if (!/^\d+$/.test(p)) return null;
    if (p.charAt(0) === '0' && p.length === 10) p = '254' + p.slice(1);
    else if ((p.charAt(0) === '7' || p.charAt(0) === '1') && p.length === 9) p = '254' + p;
    return /^254(7|1)\d{8}$/.test(p) ? p : null;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function money(n, cur) { return (cur || 'KES') + ' ' + Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 }); }
  function initials(name) { return String(name || '?').trim().split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0).toUpperCase(); }).join('') || '?'; }

  /** Real transport: talks to the handlers from createHttpHandler() on your server. */
  function httpTransport(basePath) {
    var base = String(basePath || '/mpesa').replace(/\/$/, '');
    function call(method, url, body) {
      return fetch(url, { method: method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined, credentials: 'same-origin' })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || !j.ok) { var e = new Error(j.error || 'Something went wrong. Please try again.'); e.code = j.code; throw e; } return j.payment; }); });
    }
    return {
      start: function (o) { return call('POST', base + '/stk', { orderId: o.orderId, phone: o.phone }); },
      status: function (id) { return call('GET', base + '/status/' + encodeURIComponent(id)); }
    };
  }

  var ICON = {
    lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
    phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/></svg>',
    ok: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="m7.5 12.3 3 3 6-6.3"/></svg>',
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="m9 9 6 6M15 9l-6 6"/></svg>',
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M12 7v5l3 2"/></svg>'
  };

  function mount(el, opts) {
    opts = opts || {};
    var theme = validateTheme(opts.theme), order = opts.order || { id: '', description: '', amount: 0, currency: 'KES' };
    var transport = opts.transport || httpTransport(opts.basePath);
    var pollMs = opts.pollMs || 3000, maxWaitMs = opts.maxWaitMs || 150000;
    var st = { phase: 'idle', payment: null, error: '', phone: '' }, timer = null, started = 0, gen = 0;

    function applyTheme() {
      var v = cssVars(theme);
      Object.keys(v).forEach(function (k) { el.style.setProperty(k, v[k]); });
      el.setAttribute('data-layout', theme.layout); el.setAttribute('data-mode', theme.mode); el.setAttribute('data-btn', theme.buttonStyle);
      var nm = el.querySelectorAll('[data-cm-merchant]'); for (var i = 0; i < nm.length; i++) nm[i].textContent = theme.merchantName;
      var ini = el.querySelector('[data-cm-initials]'); if (ini) ini.textContent = initials(theme.merchantName);
    }
    function statusHtml() {
      var p = st.payment, sim = p && p.simulated;
      var simTag = sim ? '<span class="cm__sim">Simulation · no money moved</span>' : '';
      if (st.phase === 'sending') return '<div class="cm__state cm__state--busy"><span class="cm__spin" aria-hidden="true"></span><div><b>Sending the request…</b><p>Contacting M-Pesa for ' + esc(st.phoneLabel) + '.</p></div></div>';
      if (st.phase === 'waiting') return '<div class="cm__state cm__state--busy">' + ICON.phone + '<div><b>Check your phone</b><p>Enter your M-Pesa PIN on the prompt sent to ' + esc(p ? p.phone : st.phoneLabel) + '. This page updates when M-Pesa confirms.</p>' + simTag + '</div></div>';
      if (st.phase === 'paid') return '<div class="cm__state cm__state--ok">' + ICON.ok + '<div><b>' + (sim ? 'Simulated payment successful' : 'Payment confirmed') + '</b><p>' + (sim ? 'This is a demo outcome. A real payment is only confirmed by M-Pesa.' : esc(money(p.amount, order.currency)) + ' received' + (p.receipt ? ' · M-Pesa receipt ' + esc(p.receipt) : '') + '.') + '</p>' + simTag + '</div></div>';
      if (st.phase === 'review') return '<div class="cm__state cm__state--warn">' + ICON.clock + '<div><b>Payment being checked</b><p>' + esc(p.message) + '</p></div></div>';
      if (st.phase === 'failed' || st.phase === 'cancelled' || st.phase === 'expired') {
        var title = { failed: 'Payment not completed', cancelled: 'Request cancelled', expired: 'Request timed out' }[st.phase];
        var msg = (p && p.message) || '';
        return '<div class="cm__state cm__state--bad">' + ICON.x + '<div><b>' + (sim ? 'Simulated: ' : '') + title + '</b><p>' + esc(msg) + ' No money was taken.</p>' + simTag + '<button type="button" class="cm__link" data-cm-retry>Try again</button></div></div>';
      }
      return '';
    }
    function render() {
      var busy = st.phase === 'sending' || st.phase === 'waiting', done = st.phase === 'paid' || st.phase === 'review';
      el.classList.add('cm');
      el.innerHTML =
        '<div class="cm__shell">' +
          '<section class="cm__summary" aria-label="Order summary">' +
            '<div class="cm__brand"><span class="cm__logo" data-cm-initials></span><span class="cm__merchant" data-cm-merchant></span></div>' +
            '<div class="cm__label">You are paying</div>' +
            '<div class="cm__amount">' + esc(money(order.amount, order.currency)) + '</div>' +
            '<div class="cm__desc">' + esc(order.description || '') + '</div>' +
            (order.id ? '<div class="cm__ref">Order ' + esc(order.id) + '</div>' : '') +
          '</section>' +
          '<section class="cm__pay" aria-label="Pay with M-Pesa">' +
            '<div class="cm__method"><span class="cm__mp" aria-hidden="true"><i></i>M-PESA</span><span>Lipa na M-Pesa · prompt to your phone</span></div>' +
            (done ? '' :
            '<form class="cm__form" novalidate>' +
              '<label class="cm__fl" for="' + uid + '-ph">Safaricom number</label>' +
              '<input class="cm__input" id="' + uid + '-ph" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="07XX XXX XXX" value="' + esc(st.phone) + '"' + (busy ? ' disabled' : '') + ' aria-describedby="' + uid + '-err">' +
              '<p class="cm__err" id="' + uid + '-err" role="alert">' + esc(st.error) + '</p>' +
              '<button class="cm__btn" type="submit"' + (busy ? ' disabled' : '') + '>' + (busy ? '<span class="cm__spin cm__spin--btn" aria-hidden="true"></span>Waiting for M-Pesa' : 'Pay ' + esc(money(order.amount, order.currency)) + ' with M-Pesa') + '</button>' +
            '</form>') +
            '<div class="cm__status" aria-live="polite">' + statusHtml() + '</div>' +
            '<p class="cm__note">' + ICON.lock + '<span>You approve the payment on your own phone with your M-Pesa PIN. Never share your PIN.</span></p>' +
          '</section>' +
        '</div>' +
        '<p class="cm__foot"><span data-cm-merchant></span> · M-Pesa is a trademark of Safaricom PLC.</p>';
      applyTheme();
      var f = el.querySelector('.cm__form');
      if (f) f.addEventListener('submit', function (e) { e.preventDefault(); pay(f.querySelector('input').value); });
      var rt = el.querySelector('[data-cm-retry]'); if (rt) rt.addEventListener('click', function () { reset(true); });
    }
    function setPhase(ph, payment) { st.phase = ph; if (payment !== undefined) st.payment = payment; render(); if (opts.onChange) opts.onChange(api.state()); }
    function settle(p) {
      if (p.status === 'pending') return false;
      setPhase(p.status === 'paid' ? 'paid' : p.status === 'review' ? 'review' : (p.status === 'cancelled' || p.status === 'expired' ? p.status : 'failed'), p);
      return true;
    }
    function poll(id, g) {
      clearTimeout(timer);
      timer = setTimeout(function () {
        if (g !== gen) return;
        transport.status(id).then(function (p) {
          if (g !== gen) return;
          if (!settle(p)) {
            if (Date.now() - started > maxWaitMs) setPhase('expired', { status: 'expired', message: 'We stopped waiting for a response.', simulated: p.simulated });
            else poll(id, g);
          }
        }, function () { if (g === gen) poll(id, g); });
      }, pollMs);
    }
    function pay(raw) {
      st.phone = raw;
      var phone = normalizePhone(raw);
      if (!phone) { st.error = 'Enter a Safaricom number like 0712 345 678.'; render(); var i = el.querySelector('input'); if (i) i.focus(); return; }
      st.error = ''; st.phoneLabel = '0' + phone.slice(3, 6) + ' *** ' + phone.slice(-3);
      var g = ++gen; started = Date.now();
      setPhase('sending', null);
      transport.start({ orderId: order.id, phone: phone, amount: order.amount }).then(function (p) {
        if (g !== gen) return;
        if (!settle(p)) { setPhase('waiting', p); poll(p.id, g); }
      }, function (e) {
        if (g !== gen) return;
        st.error = e && e.message ? e.message : 'Could not start the payment. Please try again.';
        setPhase('idle', null);
      });
    }
    function reset(keepPhone) { gen++; clearTimeout(timer); st = { phase: 'idle', payment: null, error: '', phone: keepPhone ? st.phone : '' }; render(); if (opts.onChange) opts.onChange(api.state()); }
    var uid = 'cm' + Math.random().toString(36).slice(2, 8);
    var api = {
      setTheme: function (t) { theme = validateTheme(t); applyTheme(); },
      setOrder: function (o) { order = o || order; render(); },
      reset: function () { reset(false); },
      pay: pay,
      state: function () { return { phase: st.phase, payment: st.payment, error: st.error, theme: theme }; },
      destroy: function () { gen++; clearTimeout(timer); el.innerHTML = ''; }
    };
    render();
    return api;
  }

  var CielCheckout = { mount: mount, httpTransport: httpTransport, validateTheme: validateTheme, cssVars: cssVars, normalizePhone: normalizePhone, DEFAULT_THEME: DEFAULT_THEME };
  if (typeof module === 'object' && module.exports) module.exports = CielCheckout;
  else root.CielCheckout = CielCheckout;
})(typeof self !== 'undefined' ? self : this);
