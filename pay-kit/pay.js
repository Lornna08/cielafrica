/* CIEL PAY KIT — checkout for M-PESA (STK push) and cards. Settings live in config.js.
   Nothing here holds keys. A payment is shown as received only when your server says so
   (or, as a live template, when the template panel says so, clearly marked as a live template). */
(function () {
  'use strict';
  var C = window.PAY, D = !!C.template;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var nf = new Intl.NumberFormat(C.currency.locale || 'en-KE');
  var money = function (n) { return C.currency.code + ' ' + nf.format(n); };
  var root = document.documentElement.style;
  Object.keys(C.theme || {}).forEach(function (k) { root.setProperty('--' + k, C.theme[k]); });

  var O = C.order, sub = O.items.reduce(function (a, i) { return a + i.qty * i.price; }, 0), TOTAL = sub + (O.delivery || 0);
  var S = { method: C.methods[0], mp: { stage: 'form', phone: '' }, cd: { stage: 'form' }, out: { mpesa: 'ok', card: 'ok' } };
  var T = {};   // timers
  var clear = function () { Object.keys(T).forEach(function (k) { clearInterval(T[k]); clearTimeout(T[k]); }); T = {}; };
  var say = function (m) { var l = $('#live'); l.textContent = ''; setTimeout(function () { l.textContent = m; }, 30); };

  var I = {
    phone: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/></svg>',
    card: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20M6 15h4"/></svg>',
    lock: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="4" y="11" width="16" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    shield: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5" stroke-linecap="round"/></svg>',
    chev: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>',
    arrow: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    nfc: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"><path d="M8.5 8.5a5 5 0 0 1 0 7M12 6a8.5 8.5 0 0 1 0 12M15.5 3.5a12 12 0 0 1 0 17"/></svg>'
  };

  /* ---------------- order summary ---------------- */
  function summary() {
    var b = C.merchant.logo ? '<img src="' + esc(C.merchant.logo) + '" alt="' + esc(C.merchant.name) + '">' : '<span class="dot">' + esc(C.merchant.name.charAt(0)) + '</span>' + esc(C.merchant.name);
    return '<aside class="sum" id="sum" aria-label="Order summary">' +
      '<div class="sumhead"><div class="brand">' + b + '</div><button class="sumtoggle" aria-expanded="false" aria-controls="sumitems">Order details ' + I.chev + '</button></div>' +
      '<div class="lab">You are paying</div>' +
      '<div class="amtrow"><div class="amount num"><small>' + esc(C.currency.code) + '</small>' + nf.format(TOTAL) + '</div></div>' +
      '<div class="ref">Order ' + esc(O.reference) + ' · ' + esc(C.merchant.name) + '</div>' +
      '<div class="items" id="sumitems">' + O.items.map(function (i) {
        return '<div class="it"><div class="th">' + (i.image ? '<img src="' + esc(i.image) + '" alt="">' : '') + '</div><div><b>' + esc(i.name) + '</b><span>Qty ' + i.qty + '</span></div><div class="p num">' + money(i.qty * i.price) + '</div></div>';
      }).join('') + '</div>' +
      '<div class="tot num"><div><span>Subtotal</span><span>' + money(sub) + '</span></div>' + (O.delivery ? '<div><span>Delivery</span><span>' + money(O.delivery) + '</span></div>' : '') + '<div class="g"><span>Total</span><span>' + money(TOTAL) + '</span></div></div>' +
      '<div class="foot">' + I.shield + '<span>Secure checkout. Your M-PESA PIN and card details are never shared with ' + esc(C.merchant.name) + '.</span></div>' +
      (D ? '<div class="foot" style="padding-top:12px;margin-top:0"><span class="demo-tag" style="margin-left:0">LIVE TEMPLATE</span><span>No money moves on this page.</span></div>' : '') +
      '</aside>';
  }

  /* ---------------- shell ---------------- */
  function shell() {
    var app = $('#app');
    app.innerHTML = summary() + '<section class="pay" aria-labelledby="payh"><h1 id="payh">How would you like to pay?</h1><p class="sub">Choose a payment method to complete your order.</p>' +
      '<div class="methods" role="radiogroup" aria-label="Payment method">' + C.methods.map(function (m) {
        return m === 'mpesa' ? '<button class="m mp" role="radio" data-m="mpesa"><span class="ic">' + I.phone + '</span><b><span class="mpesa-word">M-PESA</span></b><span>Approve on your phone</span><i class="rd"></i></button>'
          : '<button class="m cd" role="radio" data-m="card"><span class="ic">' + I.card + '</span><b>Card</b><span>Visa, Mastercard, Amex</span><i class="rd"></i></button>';
      }).join('') + '</div><div class="stage" id="stage"></div></section>';
    $('.sumtoggle').addEventListener('click', function () { var s = $('#sum'), o = s.classList.toggle('open'); this.setAttribute('aria-expanded', o); });
    $('.methods').addEventListener('click', function (e) { var b = e.target.closest('[data-m]'); if (b && !busy()) pick(b.dataset.m); });
    $('.methods').addEventListener('keydown', function (e) { if (!/Arrow/.test(e.key) || busy()) return; var i = C.methods.indexOf(S.method), n = C.methods[(i + (/Right|Down/.test(e.key) ? 1 : C.methods.length - 1)) % C.methods.length]; pick(n); $('[data-m="' + n + '"]').focus(); e.preventDefault(); });
    if (D) demoPanel();
    pick(S.method);
  }
  function busy() { return (S.method === 'mpesa' && S.mp.stage === 'wait') || (S.method === 'card' && S.cd.stage === 'busy'); }
  function pick(m) {
    S.method = m; clear();
    document.querySelectorAll('.m').forEach(function (b) { var on = b.dataset.m === m; b.setAttribute('aria-checked', on); b.tabIndex = on ? 0 : -1; });
    if (D) demoOptions();
    if (m === 'mpesa') { if (S.mp.stage === 'wait') S.mp.stage = 'form'; mpesa(); } else { if (S.cd.stage === 'busy') S.cd.stage = 'form'; card(); }
  }
  function view(html) { var st = $('#stage'); st.innerHTML = '<div class="view">' + html + '</div>'; return st; }
  function methodsLocked(on) { document.querySelectorAll('.m').forEach(function (b) { b.disabled = on && b.getAttribute('aria-checked') !== 'true'; b.style.opacity = b.disabled ? .45 : ''; }); }

  /* ================= M-PESA ================= */
  function normPhone(v) {
    var d = String(v).replace(/\D/g, '');
    if (d.indexOf('254') === 0) d = d.slice(3); else if (d.charAt(0) === '0') d = d.slice(1);
    return /^[17]\d{8}$/.test(d) ? '254' + d : null;
  }
  var showPhone = function (p) { var d = p.slice(3); return '0' + d.slice(0, 3) + ' ' + d.slice(3, 6) + ' ' + d.slice(6); };
  var maskPhone = function (p) { var d = p.slice(3); return '0' + d.slice(0, 3) + ' ••• ' + d.slice(6); };

  function mpesa() {
    var s = S.mp.stage;
    if (s === 'form') return mpForm();
    if (s === 'wait') return mpWait();
    return result();
  }
  function mpForm() {
    methodsLocked(false);
    var st = view('<form id="mpf" novalidate>' +
      '<label class="fld"><span>M-PESA phone number</span><div class="ctl" id="pc"><span class="pre">+254</span><input id="ph" type="tel" inputmode="numeric" autocomplete="tel-national" placeholder="712 345 678" aria-describedby="phe phh" value="' + esc(S.mp.phone ? showPhone(S.mp.phone).slice(1) : '') + '"></div></label>' +
      '<div class="err" id="phe" role="alert"></div><p class="hint" id="phh">You will get a prompt on this phone. Enter your M-PESA PIN there to approve.</p>' +
      '<button class="go mp" type="submit">Send payment request <span class="amt num">· ' + money(TOTAL) + '</span></button>' +
      '<p class="safe">' + I.lock + 'Your PIN is entered on your phone only. This page never sees it.</p></form>' +
      '<ol class="how"><li><b>1</b><strong>Enter your number</strong>The one you use for M-PESA.</li><li><b>2</b><strong>Approve on your phone</strong>A prompt asks for your PIN.</li><li><b>3</b><strong>All done</strong>Your receipt appears here.</li></ol>');
    var ph = $('#ph', st);
    ph.addEventListener('input', function () {
      var d = ph.value.replace(/\D/g, ''); if (d.indexOf('254') === 0) d = d.slice(3); if (d.charAt(0) === '0') d = d.slice(1); d = d.slice(0, 9);
      ph.value = [d.slice(0, 3), d.slice(3, 6), d.slice(6)].filter(Boolean).join(' ');
      $('#pc').classList.remove('bad'); $('#phe').textContent = '';
    });
    $('#mpf').addEventListener('submit', function (e) {
      e.preventDefault(); var p = normPhone(ph.value);
      if (!p) { $('#pc').classList.add('bad'); $('#phe').textContent = ph.value.trim() ? 'Enter a Safaricom number like 0712 345 678.' : 'Enter your M-PESA phone number.'; ph.focus(); return; }
      S.mp.phone = p; send();
    });
  }

  function send() {
    S.mp.stage = 'wait'; S.mp.t0 = Date.now(); S.mp.sentAt = Date.now(); S.mp.res = null; mpWait();
    if (D) return demoMpesa();
    post(C.mpesa.stkEndpoint, { phone: S.mp.phone, amount: TOTAL, reference: O.reference }).then(function (r) {
      if (!r || !r.id) throw new Error('no id');
      S.mp.id = r.id; step(1, 'ok'); step(2, 'on'); poll();
    }).catch(function () { finish({ state: 'failed', message: 'We could not send the request to your phone. Check the number and try again.' }); });
  }
  function poll() {
    T.poll = setInterval(function () {
      getStatus().then(function (r) { if (r && r.status && r.status !== 'pending') finish(r); }).catch(function () { });
    }, (C.mpesa.pollSeconds || 3) * 1000);
  }
  function getStatus() { return fetch(C.mpesa.statusEndpoint + (C.mpesa.statusEndpoint.indexOf('?') > -1 ? '&' : '?') + 'id=' + encodeURIComponent(S.mp.id), { headers: { Accept: 'application/json' } }).then(function (r) { if (!r.ok) throw 0; return r.json(); }); }
  function post(url, body) {
    if (!url) return Promise.reject(new Error('endpoint not set'));
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
  }

  function mpWait() {
    methodsLocked(true);
    var now = new Date(), W = waitFor(), hm = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    var st = view('<div class="wait" id="wv"><div class="phone-wrap" aria-hidden="true"><i class="ring"></i><i class="ring"></i><i class="ring"></i>' +
      '<div class="phone ip17 ip17--silver"><div class="ip17__body"><i class="ip17__k ip17__k--act"></i><i class="ip17__k ip17__k--vu"></i><i class="ip17__k ip17__k--vd"></i><i class="ip17__k ip17__k--pwr"></i><i class="ip17__k ip17__k--cam"></i><div class="ip17__bezel"><div class="ip17__scr scr"><div class="ip17__sb"><span>' + hm + '</span><svg viewBox="0 0 68 13" aria-hidden="true"><rect x="0" y="8.5" width="3" height="4" rx="1" stroke="none"/><rect x="4.6" y="6.5" width="3" height="6" rx="1" stroke="none"/><rect x="9.2" y="4" width="3" height="8.5" rx="1" stroke="none"/><rect x="13.8" y="1.5" width="3" height="11" rx="1" stroke="none"/><path d="M31 12.4 28.5 9.7a3.5 3.5 0 0 1 5 0Z" stroke="none"/><path d="M26.1 7.3a6.9 6.9 0 0 1 9.8 0M23.7 4.8a10.3 10.3 0 0 1 14.6 0" fill="none" stroke-width="1.7" stroke-linecap="round"/><rect x="44.5" y="1.2" width="20" height="10.6" rx="3.2" fill="none" stroke-width="1.1" opacity=".45"/><rect x="46.3" y="3" width="14.6" height="7" rx="1.7" stroke="none"/><rect x="65.6" y="4.6" width="1.6" height="3.8" rx=".8" stroke="none" opacity=".45"/></svg></div><i class="ip17__di"></i>' +
      '<div class="clock num">' + hm + '</div><div class="date">' + now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) + '</div>' +
      '<div class="sheet"><div class="h">M-PESA</div><div class="w">Pay <b>' + money(TOTAL) + '</b> to <b>' + esc(C.merchant.name) + '</b>. Enter your PIN.</div><div class="pin"><i></i><i></i><i></i><i></i></div><div class="bt"><span>Cancel</span><span>OK</span></div></div><i class="ip17__hb"></i></div></div></div></div>' +
      '<div class="timer" id="tm"><svg width="18" height="18" viewBox="0 0 20 20"><circle class="bg" cx="10" cy="10" r="8"/><circle class="fg" id="tmc" cx="10" cy="10" r="8" stroke-dasharray="50.27" stroke-dashoffset="0"/></svg><span id="tmt">' + clock(W) + '</span></div></div>' +
      '<div><h2 tabindex="-1" id="wh">Check your phone</h2><p>We sent a payment request to <b>' + showPhone(S.mp.phone) + '</b>. Unlock your phone and enter your M-PESA PIN to approve <b>' + money(TOTAL) + '</b>.</p>' +
      '<ol class="steps"><li id="s1"><span class="s">1</span>Request sent to your phone</li><li id="s2"><span class="s">2</span>Waiting for your PIN</li><li id="s3"><span class="s">3</span>Confirming the payment</li></ol>' +
      '<div class="acts"><button class="btn2" id="nohelp" aria-expanded="false">Didn’t get the prompt?</button><button class="btn2" id="chg">Change number</button></div><div id="helpw"></div></div></div>');
    $('#wh', st).focus({ preventScroll: true }); say('Payment request sent. Check your phone.');
    step(1, 'on');
    if (D) setTimeout(function () { if (S.mp.stage === 'wait') { step(1, 'ok'); step(2, 'on'); } }, 900);
    var C2 = 50.27;
    T.tick = setInterval(function () {
      var left = Math.max(0, W - (Date.now() - S.mp.t0) / 1000);
      $('#tmt') && ($('#tmt').textContent = clock(left)); $('#tmc') && ($('#tmc').style.strokeDashoffset = (C2 * (1 - left / W)).toFixed(2));
      if (left <= 0) finish({ state: 'timeout' });
    }, 250);
    $('#chg').addEventListener('click', function () { clear(); S.mp.stage = 'form'; mpForm(); $('#ph').focus(); });
    $('#nohelp').addEventListener('click', function () { var o = this.getAttribute('aria-expanded') === 'true'; this.setAttribute('aria-expanded', !o); o ? ($('#helpw').innerHTML = '') : help(); });
  }
  function waitFor() { return D && S.out.mpesa === 'timeout' ? 20 : (C.mpesa.waitSeconds || 90); }
  var clock = function (s) { s = Math.ceil(s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  function step(n, cls) { var li = $('#s' + n); if (!li) return; li.className = cls; if (cls === 'ok') li.querySelector('.s').innerHTML = '✓'; if (cls === 'no') li.querySelector('.s').innerHTML = '✕'; }

  function help() {
    var m = C.mpesa, fall = m.paybill ? 'Paybill <b>' + esc(m.paybill) + '</b>, account <b>' + esc(O.reference) + '</b>' : m.till ? 'Buy Goods till <b>' + esc(m.till) + '</b>' : '';
    $('#helpw').innerHTML = '<div class="help"><h3>If the prompt has not appeared</h3><ul><li>Make sure your phone is on, unlocked and has signal.</li><li>Close any other M-PESA or SIM menu that is open, then send again.</li><li>Check that <b>' + showPhone(S.mp.phone) + '</b> is the number registered for M-PESA.</li></ul>' +
      '<div class="acts" style="margin-top:14px"><button class="btn2" id="again" disabled>Send again</button></div>' +
      (fall ? '<div class="pb">Or pay from the M-PESA menu: ' + fall + ', amount <b>' + nf.format(TOTAL) + '</b>. Your order is updated once the payment is confirmed.</div>' : '') +
      (C.merchant.supportPhone ? '<div class="pb">Need help? Call <b>' + esc(C.merchant.supportPhone) + '</b></div>' : '') + '</div>';
    var b = $('#again'), wait = (C.mpesa.resendAfter || 30);
    var upd = function () { var left = Math.ceil(wait - (Date.now() - S.mp.sentAt) / 1000); if (!b.isConnected) return clearInterval(T.rs); if (left > 0) { b.disabled = true; b.textContent = 'Send again in ' + left + 's'; } else { b.disabled = false; b.textContent = 'Send again'; clearInterval(T.rs); } };
    upd(); T.rs = setInterval(upd, 500);
    b.addEventListener('click', function () { clear(); send(); });
  }

  function finish(r) {
    if (S.mp.stage !== 'wait') return;
    clear(); var ok = r.status === 'success' || r.state === 'success';
    var stt = ok ? 'success' : r.state === 'timeout' ? 'timeout' : 'failed';
    S.mp.res = { state: stt, code: r.resultCode, receipt: r.receipt, message: r.message };
    var wv = $('#wv');
    if (stt === 'success') { step(2, 'ok'); step(3, 'on'); if (wv) wv.classList.add('done'); badge(true); setTimeout(function () { step(3, 'ok'); }, 500); setTimeout(function () { S.mp.stage = 'result'; result(); }, 1300); }
    else if (stt === 'timeout') { S.mp.stage = 'result'; result(); }
    else { step(2, 'no'); if (wv) wv.classList.add('fail'); badge(false); setTimeout(function () { S.mp.stage = 'result'; result(); }, 1100); }
  }
  function badge(ok) { var p = $('.phone .scr'); if (p) p.insertAdjacentHTML('beforeend', '<div class="badge-ok' + (ok ? '' : ' no') + '">' + (ok ? '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>' : '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>') + '</div>'); }

  function demoMpesa() {
    var o = S.out.mpesa, codes = { cancel: '1032', unreach: '1037', funds: '1', pin: '2001' };
    if (o === 'timeout') return;   // the clock runs out by itself
    T.demo = setTimeout(function () {
      if (o === 'ok') finish({ status: 'success', receipt: 'LT' + Math.random().toString(36).slice(2, 8).toUpperCase() });
      else finish({ status: 'failed', resultCode: codes[o] });
    }, o === 'ok' ? 6500 : 5200);
  }

  /* ================= RESULT (both methods) ================= */
  function result() {
    methodsLocked(false);
    var m = S.method, r = m === 'mpesa' ? S.mp.res : S.cd.res, st;
    if (r.state === 'success') {
      var rows = m === 'mpesa'
        ? [['Paid with', 'M-PESA'], ['Phone', maskPhone(S.mp.phone)], ['M-PESA receipt', r.receipt || '—', 'code']]
        : [['Paid with', r.brand + ' •••• ' + r.last4], ['Reference', r.receipt, 'code']];
      rows.push(['Order', O.reference], ['Date', new Date().toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })]);
      st = view('<div class="res"><div class="tick">' + burst() + '<svg viewBox="0 0 92 92"><circle class="c" cx="46" cy="46" r="46"/><path class="k" d="M28 47.5l12 12 24-26"/></svg></div>' +
        '<h2 tabindex="-1" id="rh">Payment received</h2><p>Thank you. ' + esc(C.merchant.name) + ' has your payment for order ' + esc(O.reference) + '.</p>' +
        '<div class="rcpt"><div class="top"><span>Amount paid</span><b class="num">' + money(TOTAL) + '</b></div><dl>' + rows.map(function (x) { return '<dt>' + x[0] + '</dt><dd class="' + (x[2] || '') + '">' + esc(x[1]) + '</dd>'; }).join('') + '</dl></div>' +
        (D ? '<p class="demo-note">Live template receipt. No money moved and nothing was sent.</p>' : (C.receipt.note ? '<p class="hint" style="margin-top:14px">' + esc(C.receipt.note) + '</p>' : '')) +
        '<div class="acts" style="justify-content:center"><button class="btn2" id="dl">Download receipt</button><a class="go" style="width:auto;padding:0 22px;height:44px;margin:0;font-size:14px;border-radius:11px;text-decoration:none" href="' + esc(C.merchant.backUrl) + '">Back to store ' + I.arrow + '</a></div></div>');
      $('#dl', st).addEventListener('click', function () { window.print(); });
      say('Payment received.');
    } else if (r.state === 'timeout') {
      st = view('<div class="res"><div class="tick wt"><svg viewBox="0 0 92 92"><circle class="c" cx="46" cy="46" r="46"/><path class="k" d="M46 26v24M46 64v1"/></svg></div>' +
        '<h2 tabindex="-1" id="rh">We have not heard back yet</h2><p>If you entered your PIN, the payment may still be on its way. Please do not pay twice. Check again, or send a new request if you did not approve it.</p>' +
        '<div class="acts" style="justify-content:center"><button class="btn2" id="chk">Check again</button><button class="go mp" id="new" style="width:auto;padding:0 22px;height:44px;margin:0;font-size:14px;border-radius:11px">Send a new request</button></div><p class="hint" id="chkm" style="margin-top:12px" role="status"></p></div>');
      $('#chk', st).addEventListener('click', function () {
        var b = this; b.disabled = true; $('#chkm').textContent = 'Checking…';
        var done = function (x) {
          b.disabled = false;
          if (x && x.status && x.status !== 'pending') { S.mp.stage = 'wait'; mpWait(); finish(x); }
          else $('#chkm').textContent = 'Still no answer from M-PESA. If you approved it, your order updates as soon as it is confirmed.';
        };
        D ? setTimeout(done, 900) : getStatus().then(done).catch(function () { done(null); });
      });
      $('#new', st).addEventListener('click', function () { send(); });
      say('No answer yet.');
    } else {
      var msg = r.message || (m === 'mpesa' ? (C.mpesa.results[r.code] || C.mpesa.results['default']) : 'Your bank declined this card.');
      var other = C.methods.filter(function (x) { return x !== m; })[0];
      st = view('<div class="res"><div class="tick no"><svg viewBox="0 0 92 92"><circle class="c" cx="46" cy="46" r="46"/><path class="k" d="M33 33l26 26M59 33L33 59"/></svg></div>' +
        '<h2 tabindex="-1" id="rh">Payment not completed</h2><p>' + esc(msg) + ' No money was taken.</p>' +
        '<div class="acts" style="justify-content:center"><button class="go ' + (m === 'mpesa' ? 'mp' : '') + '" id="retry" style="width:auto;padding:0 22px;height:44px;margin:0;font-size:14px;border-radius:11px">Try again</button>' +
        (other ? '<button class="btn2" id="other">Pay by ' + (other === 'card' ? 'card' : 'M-PESA') + ' instead</button>' : '') + '</div></div>');
      $('#retry', st).addEventListener('click', function () { if (m === 'mpesa') { S.mp.stage = 'form'; mpForm(); } else { S.cd.stage = 'form'; card(); } });
      if (other) $('#other', st).addEventListener('click', function () { if (m === 'mpesa') S.mp.stage = 'form'; else S.cd.stage = 'form'; pick(other); });
      say('Payment not completed. ' + msg);
    }
    var h = $('#rh'); h && h.focus({ preventScroll: true });
  }
  function burst() { var h = ''; for (var i = 0; i < 12; i++) h += '<i style="--a:' + (i * 30) + 'deg;animation-delay:' + (.3 + (i % 3) * .05) + 's;' + (i % 2 ? 'width:5px;height:9px;' : '') + '"></i>'; return h; }

  /* ================= CARD ================= */
  var BR = {
    visa: { n: 'Visa', re: /^4/, g: 'linear-gradient(135deg,#22357F 0%,#111B4A 55%,#2B47A8 100%)', fmt: [4, 4, 4, 4], cvc: 3 },
    mastercard: { n: 'Mastercard', re: /^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/, g: 'linear-gradient(135deg,#3A2416 0%,#17110D 55%,#6B3414 100%)', fmt: [4, 4, 4, 4], cvc: 3 },
    amex: { n: 'Amex', re: /^3[47]/, g: 'linear-gradient(135deg,#0F6670 0%,#0A3B41 55%,#168D98 100%)', fmt: [4, 6, 5], cvc: 4 }
  };
  var brandOf = function (d) { for (var k in BR) if (C.card.brands.indexOf(k) > -1 && BR[k].re.test(d)) return k; return null; };
  var luhn = function (d) { var s = 0, alt = false; for (var i = d.length - 1; i >= 0; i--) { var n = +d[i]; if (alt) { n *= 2; if (n > 9) n -= 9; } s += n; alt = !alt; } return s % 10 === 0; };

  function card() {
    var s = S.cd.stage;
    if (s === 'result') return result();
    methodsLocked(false);
    if (!D) return hosted();
    var st = view('<div class="cardzone" id="cz"><div class="cc" id="cc"><div class="face front"><i class="chip"></i><span class="nfc">' + I.nfc + '</span><span class="brandw" id="cbw"></span><div class="ccnum" id="cnum"></div>' +
      '<div class="meta"><div style="min-width:0"><small>Card holder</small><div class="nm" id="cnm">Your name</div></div><div><small>Expires</small><div class="ex" id="cex">MM/YY</div></div></div></div>' +
      '<div class="face back"><i class="strip"></i><i class="sig"></i><div class="cvc" id="ccv">•••</div><div class="bk">This card is a preview. It is drawn by the page and is not a real card.</div></div></div></div>' +
      '<form id="cf" novalidate autocomplete="on">' +
      '<label class="fld"><span>Card number <span class="brands" id="brs">' + C.card.brands.map(function (b) { return '<i data-b="' + b + '">' + BR[b].n + '</i>'; }).join('') + '</span></span><div class="ctl" id="c-num"><input id="cn" inputmode="numeric" autocomplete="cc-number" placeholder="1234 1234 1234 1234" aria-describedby="e-num"></div><div class="err" id="e-num" role="alert"></div></label>' +
      '<label class="fld" style="margin-top:6px"><span>Name on card</span><div class="ctl" id="c-name"><input id="cnm2" autocomplete="cc-name" placeholder="As shown on the card" aria-describedby="e-name"></div><div class="err" id="e-name" role="alert"></div></label>' +
      '<div class="row2" style="margin-top:6px"><label class="fld" style="margin-top:0"><span>Expiry</span><div class="ctl" id="c-exp"><input id="cxp" inputmode="numeric" autocomplete="cc-exp" placeholder="MM / YY" aria-describedby="e-exp"></div><div class="err" id="e-exp" role="alert"></div></label>' +
      '<label class="fld" style="margin-top:0"><span>Security code</span><div class="ctl" id="c-cvc"><input id="ccv2" inputmode="numeric" autocomplete="cc-csc" placeholder="CVC" aria-describedby="e-cvc"><span class="suf">' + I.lock + '</span></div><div class="err" id="e-cvc" role="alert"></div></label></div>' +
      '<button class="go" type="submit" id="cpay">Pay <span class="num">' + money(TOTAL) + '</span></button>' +
      '<p class="safe">' + I.lock + (C.card.provider ? 'Secured by ' + esc(C.card.provider) + '. ' : '') + 'Live template: use a test number such as 4242 4242 4242 4242. Nothing is sent.</p></form>');
    var cn = $('#cn'), nm = $('#cnm2'), xp = $('#cxp'), cv = $('#ccv2'), cc = $('#cc');
    var digits = function () { return cn.value.replace(/\D/g, ''); };
    var draw = function () {
      var d = digits(), b = brandOf(d), f = b ? BR[b].fmt : [4, 4, 4, 4], out = '', k = 0;
      f.forEach(function (n, gi) { var g = ''; for (var j = 0; j < n; j++, k++) g += d[k] || '•'; out += '<span class="' + (d.length > k - n ? '' : 'ph') + '">' + g + '</span>' + (gi < f.length - 1 ? ' ' : ''); });
      $('#cnum').innerHTML = out;
      cc.querySelectorAll('.face').forEach(function (fc) { fc.style.setProperty('--cg', b ? BR[b].g : ''); });
      $('#cbw').className = 'brandw' + (b === 'mastercard' ? ' mc' : ''); $('#cbw').innerHTML = b === 'mastercard' ? '<i></i><i></i>' : b ? BR[b].n.toUpperCase() : '';
      document.querySelectorAll('#brs i').forEach(function (i) { i.className = !b ? '' : i.dataset.b === b ? 'on' : 'off'; });
    };
    cn.addEventListener('input', function () {
      var d = digits(), b = brandOf(d), f = b ? BR[b].fmt : [4, 4, 4, 4, 3], max = f.reduce(function (a, x) { return a + x; }, 0); d = d.slice(0, b ? max : 19);
      var parts = [], k = 0; f.forEach(function (n) { if (k < d.length) parts.push(d.slice(k, k + n)); k += n; }); cn.value = parts.join(' ');
      ok('num'); draw();
    });
    nm.addEventListener('input', function () { $('#cnm').textContent = nm.value.trim() || 'Your name'; ok('name'); });
    xp.addEventListener('input', function (e) {
      var d = xp.value.replace(/\D/g, '').slice(0, 4); if (d.length === 1 && +d > 1) d = '0' + d;
      xp.value = d.length > 2 ? d.slice(0, 2) + ' / ' + d.slice(2) : (d.length === 2 && e.inputType !== 'deleteContentBackward' ? d + ' / ' : d);
      $('#cex').textContent = d.length ? (d.slice(0, 2) + '/' + (d.slice(2) || 'YY')) : 'MM/YY'; ok('exp');
    });
    cv.addEventListener('input', function () { var b = brandOf(digits()); cv.value = cv.value.replace(/\D/g, '').slice(0, b ? BR[b].cvc : 4); $('#ccv').textContent = cv.value || '•••'; ok('cvc'); });
    cv.addEventListener('focus', function () { cc.classList.add('flip'); }); cv.addEventListener('blur', function () { cc.classList.remove('flip'); });
    var cz = $('#cz');
    cz.addEventListener('pointermove', function (e) { if (cc.classList.contains('flip') || e.pointerType !== 'mouse') return; var r = cc.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height; cc.style.setProperty('--ry', ((x - .5) * 16).toFixed(1) + 'deg'); cc.style.setProperty('--rx', ((.5 - y) * 12).toFixed(1) + 'deg'); cc.querySelectorAll('.face').forEach(function (f) { f.style.setProperty('--gx', (x * 100).toFixed(0) + '%'); f.style.setProperty('--gy', (y * 100).toFixed(0) + '%'); }); });
    cz.addEventListener('pointerleave', function () { cc.style.setProperty('--rx', '0deg'); cc.style.setProperty('--ry', '0deg'); });
    draw();
    function ok(k) { $('#c-' + k).classList.remove('bad'); $('#e-' + k).textContent = ''; }
    function bad(k, m) { $('#c-' + k).classList.add('bad'); $('#e-' + k).textContent = m; }
    $('#cf').addEventListener('submit', function (e) {
      e.preventDefault();
      var d = digits(), b = brandOf(d), errs = 0, first = null;
      var need = b ? BR[b].fmt.reduce(function (a, x) { return a + x; }, 0) : 16;
      if (!d) { bad('num', 'Enter your card number.'); errs++; first = first || cn; }
      else if (!b) { bad('num', 'We accept ' + C.card.brands.map(function (x) { return BR[x].n; }).join(', ') + '.'); errs++; first = first || cn; }
      else if (d.length < need || !luhn(d)) { bad('num', 'This card number is not complete or not valid.'); errs++; first = first || cn; }
      if (nm.value.trim().length < 2) { bad('name', 'Enter the name on the card.'); errs++; first = first || nm; }
      var x = xp.value.replace(/\D/g, ''), mm = +x.slice(0, 2), yy = +x.slice(2, 4), now = new Date();
      if (x.length < 4 || mm < 1 || mm > 12) { bad('exp', 'Use MM / YY.'); errs++; first = first || xp; }
      else if (new Date(2000 + yy, mm, 1) <= now) { bad('exp', 'This card has expired.'); errs++; first = first || xp; }
      if (cv.value.length !== (b ? BR[b].cvc : 3)) { bad('cvc', 'Enter the ' + (b ? BR[b].cvc : 3) + '-digit code.'); errs++; first = first || cv; }
      if (errs) { first.focus(); say(errs + ' field' + (errs > 1 ? 's need' : ' needs') + ' attention.'); return; }
      payDemo({ brand: BR[b].n, last4: d.slice(-4) });
    });
  }
  function payBtn(on) { var b = $('#cpay'); if (!b) return; b.disabled = on; b.innerHTML = on ? '<span class="spin"></span>Processing…' : 'Pay <span class="num">' + money(TOTAL) + '</span>'; }
  function payDemo(c) {
    S.cd.stage = 'busy'; methodsLocked(true); payBtn(true); say('Processing your payment.');
    var o = S.out.card, done = function (state) { S.cd.stage = 'result'; S.cd.res = { state: state, brand: c.brand, last4: c.last4, receipt: 'LT-' + Math.random().toString(36).slice(2, 8).toUpperCase() }; result(); };
    T.c = setTimeout(function () {
      if (o === 'ok') done('success');
      else if (o === 'decline') done('failed');
      else tds(c, function () { done('success'); });
    }, 1700);
  }
  function tds(c, cb) {
    var p = $('.pay'); p.insertAdjacentHTML('beforeend', '<div class="tds" role="dialog" aria-modal="true" aria-labelledby="tdh"><div class="box"><div class="bank">' + I.shield + 'Your bank</div><h3 id="tdh">Confirm it’s you</h3><p>Enter the 6-digit code your bank sent to approve ' + money(TOTAL) + ' to ' + esc(C.merchant.name) + ' with ' + esc(c.brand) + ' •••• ' + esc(c.last4) + '.</p>' +
      '<div class="otp">' + '<input inputmode="numeric" maxlength="1" aria-label="Digit 1">'.repeat(6) + '</div><button class="go" id="tdgo" style="margin-top:20px" disabled>Confirm</button><p class="hint" style="margin-top:12px">Live template: any six digits work.</p></div></div>');
    var box = $('.tds'), ins = box.querySelectorAll('.otp input'), go = $('#tdgo');
    ins.forEach(function (x, i) { x.setAttribute('aria-label', 'Digit ' + (i + 1));
      x.addEventListener('input', function () { x.value = x.value.replace(/\D/g, '').slice(-1); if (x.value && ins[i + 1]) ins[i + 1].focus(); go.disabled = [].some.call(ins, function (y) { return !y.value; }); });
      x.addEventListener('keydown', function (e) { if (e.key === 'Backspace' && !x.value && ins[i - 1]) ins[i - 1].focus(); });
      x.addEventListener('paste', function (e) { var t = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6); if (!t) return; e.preventDefault(); ins.forEach(function (y, j) { y.value = t[j] || ''; }); go.disabled = t.length < 6; });
    });
    ins[0].focus();
    go.addEventListener('click', function () { go.disabled = true; go.innerHTML = '<span class="spin"></span>Verifying…'; setTimeout(function () { box.remove(); cb(); }, 1300); });
  }
  function hosted() {
    var st = view('<div class="hosted">You will continue to ' + (C.card.provider ? '<b>' + esc(C.card.provider) + '</b>' : 'our payment provider') + '’s secure page to enter your card. You come back here once it is done.</div>' +
      '<button class="go" id="hgo">Continue to secure card payment ' + I.arrow + '</button><div class="err" id="herr" role="alert"></div>' +
      '<p class="safe">' + I.lock + 'Card details go straight to the payment provider.</p>');
    $('#hgo', st).addEventListener('click', function () {
      var b = this; b.disabled = true; b.innerHTML = '<span class="spin"></span>Opening secure payment…';
      post(C.card.checkoutEndpoint, { amount: TOTAL, currency: C.currency.code, reference: O.reference, items: O.items }).then(function (r) {
        if (!r || !r.url) throw 0; location.href = r.url;
      }).catch(function () { b.disabled = false; b.innerHTML = 'Continue to secure card payment ' + I.arrow; $('#herr').textContent = 'We could not open the card payment page. Please try again.'; });
    });
  }

  /* ================= LIVE TEMPLATE PANEL ================= */
  var OPTS = {
    mpesa: [['ok', 'Approved'], ['cancel', 'Cancelled on phone'], ['funds', 'Not enough balance'], ['pin', 'Wrong PIN'], ['unreach', 'Phone unreachable'], ['timeout', 'No answer (time runs out)']],
    card: [['ok', 'Approved'], ['3ds', 'Bank asks for a code'], ['decline', 'Declined by bank']]
  };
  function demoPanel() {
    document.body.insertAdjacentHTML('beforeend', '<div class="demo" role="region" aria-label="Live template controls"><b>LIVE TEMPLATE</b><label class="sr" for="dout">Outcome</label><span>Outcome</span><select id="dout"></select></div>');
    $('#dout').addEventListener('change', function () { S.out[S.method] = this.value; });
  }
  function demoOptions() { var s = $('#dout'); if (!s) return; s.innerHTML = OPTS[S.method].map(function (o) { return '<option value="' + o[0] + '"' + (S.out[S.method] === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join(''); }

  shell();
})();
