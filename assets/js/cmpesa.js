/* ============================================================
   CIEL AFRICA — Ciel M-Pesa product pages
   - prices and purchase options come from data/products.js
   - the playground drives the REAL checkout component from the
     self-hosted package (/assets/ciel-mpesa/checkout.js) with a
     local SIMULATION transport: nothing is sent anywhere.
   ============================================================ */
(function () {
  'use strict';
  var CIEL = window.CIEL || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var fmt = function (n) { return Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 }); };
  var RATE = CIEL.usdRate || 130;
  function product(id) { return (CIEL.products || []).filter(function (p) { return p.id === id; })[0] || null; }
  function options(p) { return (p.options && p.options.length ? p.options : [{ id: p.id, label: 'Licence', price: p.price }]).map(function (o, i) { return { id: o.id, label: o.label, note: o.note || '', price: i === 0 ? p.price : o.price }; }); }
  function usd(kes) { var u = kes / RATE; return (Math.abs(u - Math.round(u)) < 0.01 ? '' : '≈ ') + '$' + fmt(Math.round(u)); }
  var CM = window.CMPESA = { product: product, options: options, usd: usd };

  /* ---------- prices: [data-cm-price="id"] (from), [data-cm-price-opt="id:optId"] ---------- */
  function paintPrices() {
    $$('[data-cm-price]').forEach(function (el) {
      var p = product(el.getAttribute('data-cm-price')); if (!p) return;
      var ops = options(p), min = Math.min.apply(null, ops.map(function (o) { return o.price; }));
      el.innerHTML = '<span class="cmp-price__k">KES ' + fmt(min) + '</span><span class="cmp-price__u">' + usd(min) + '</span>' + (ops.length > 1 ? '<span class="cmp-price__f">from · one-time licence</span>' : '<span class="cmp-price__f">one-time licence</span>');
    });
    $$('[data-cm-price-opt]').forEach(function (el) {
      var a = el.getAttribute('data-cm-price-opt').split(':'), p = product(a[0]); if (!p) return;
      var o = options(p).filter(function (x) { return x.id === a[1]; })[0]; if (!o) return;
      el.textContent = 'KES ' + fmt(o.price) + ' (' + usd(o.price) + ')';
    });
    $$('[data-cm-rate]').forEach(function (el) { el.textContent = 'KES ' + fmt(RATE); });
  }

  /* ---------- purchase box: [data-cm-buy="id"] ---------- */
  function buyBox(el) {
    var p = product(el.getAttribute('data-cm-buy')); if (!p) { el.innerHTML = ''; return; }
    var ops = options(p), name = 'cmb-' + p.id;
    el.innerHTML = '<fieldset class="cmb__ops"><legend class="sr-only">Choose an option</legend>' + ops.map(function (o, i) {
      return '<label class="cmb__op"><input type="radio" name="' + name + '" value="' + esc(o.id) + '"' + (i === 0 ? ' checked' : '') + '><span class="cmb__op-m"><b>' + esc(o.label) + '</b>' + (o.note ? '<small>' + esc(o.note) + '</small>' : '') + '</span><span class="cmb__op-p"><b>KES ' + fmt(o.price) + '</b><small>' + usd(o.price) + '</small></span></label>';
    }).join('') + '</fieldset>' +
      '<button type="button" class="btn btn--p cmb__add">Add to cart</button>' +
      '<p class="cmb__fine">Pay with M-Pesa at checkout. After M-Pesa confirms your payment, we email the package and its guide to the address you give at checkout. Prices are in KES; dollar figures are for reference at KES ' + fmt(RATE) + ' = $1.</p>';
    $('.cmb__add', el).addEventListener('click', function () {
      var id = ($('input[name="' + name + '"]:checked', el) || {}).value, o = ops.filter(function (x) { return x.id === id; })[0] || ops[0];
      if (CIEL.cart) CIEL.cart.add(o.id, p.name + (ops.length > 1 ? ' — ' + o.label : ''), o.price);
    });
  }

  /* ---------- copy / download helpers ---------- */
  function copyText(text, btn) {
    function done(ok) { if (!btn) return; var t = btn.textContent; btn.textContent = ok ? 'Copied' : 'Press Ctrl+C to copy'; setTimeout(function () { btn.textContent = t; }, 1600); }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
    else { var ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); var ok = false; try { ok = document.execCommand('copy'); } catch (e) { /* */ } ta.remove(); done(ok); }
  }
  function download(name, text) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  $$('[data-copy]').forEach(function (b) { b.addEventListener('click', function () { var t = document.getElementById(b.getAttribute('data-copy')); if (t) copyText(t.textContent, b); }); });

  /* ---------- colour contrast (WCAG) ---------- */
  function lum(hex) {
    var h = hex.replace('#', ''); if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var rgb = [0, 2, 4].map(function (i) { var v = parseInt(h.substr(i, 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  CM.contrast = contrast;

  /* ---------- playground ---------- */
  var PRESETS = [
    { id: 'ciel', name: 'Ciel Orange', theme: { merchantName: 'Duka Bora', mode: 'light', colors: { primary: '#141414', accent: '#FF5A1F', background: '#FAFAF8', button: '#E84E14', buttonText: '#FFFFFF' }, radius: 6, buttonStyle: 'solid', font: 'system', layout: 'card' } },
    { id: 'mpesa', name: 'M-Pesa Inspired', theme: { merchantName: 'Duka Bora', mode: 'light', colors: { primary: '#0F5132', accent: '#3CA33C', background: '#EEF6EE', button: '#2E7D32', buttonText: '#FFFFFF' }, radius: 14, buttonStyle: 'pill', font: 'rounded', layout: 'card' } },
    { id: 'midnight', name: 'Midnight', theme: { merchantName: 'Duka Bora', mode: 'dark', colors: { primary: '#E8ECF2', accent: '#7C9CFF', background: '#0B0F17', button: '#7C9CFF', buttonText: '#0B0F17' }, radius: 14, buttonStyle: 'solid', font: 'system', layout: 'split' } },
    { id: 'minimal', name: 'Minimal Light', theme: { merchantName: 'Duka Bora', mode: 'light', colors: { primary: '#111111', accent: '#111111', background: '#FFFFFF', button: '#111111', buttonText: '#FFFFFF' }, radius: 2, buttonStyle: 'outline', font: 'system', layout: 'compact' } },
    { id: 'forest', name: 'Forest Green', theme: { merchantName: 'Duka Bora', mode: 'light', colors: { primary: '#1E3D2F', accent: '#B8862B', background: '#F3EFE6', button: '#1E3D2F', buttonText: '#F3EFE6' }, radius: 10, buttonStyle: 'solid', font: 'serif', layout: 'split' } }
  ];
  CM.PRESETS = PRESETS;
  var SAVE_KEY = 'ciel_mpesa_saved_themes_v1';
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  function loadSaved() { try { var v = JSON.parse(localStorage.getItem(SAVE_KEY) || '[]'); return Array.isArray(v) ? v.slice(0, 6) : []; } catch (e) { return []; } }
  function storeSaved(list) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(list.slice(0, 6))); return true; } catch (e) { return false; } }

  /** A simulated STK flow for the preview. It never makes a network request. */
  function simulationTransport(pg) {
    var n = 0;
    return {
      start: function (o) {
        return new Promise(function (resolve) {
          setTimeout(function () {
            n++;
            pg.sim = { id: 'SIM-' + Date.now().toString(36).toUpperCase() + n, phone: '0' + o.phone.slice(3, 6) + ' *** ' + o.phone.slice(-3), amount: o.amount, outcome: null };
            pg.onSim();
            resolve({ id: pg.sim.id, status: 'pending', amount: o.amount, phone: pg.sim.phone, simulated: true, message: 'Simulated prompt sent.' });
          }, 700);
        });
      },
      status: function (id) {
        return new Promise(function (resolve) {
          var s = pg.sim;
          if (!s || s.id !== id || !s.outcome) return resolve({ id: id, status: 'pending', simulated: true });
          var map = {
            paid: { status: 'paid', receipt: null, message: 'Simulated success.' },
            failed: { status: 'failed', message: 'Simulated: insufficient M-Pesa balance.' },
            cancelled: { status: 'cancelled', message: 'Simulated: the customer cancelled the prompt.' },
            expired: { status: 'expired', message: 'Simulated: the phone did not respond in time.' }
          }[s.outcome];
          resolve(Object.assign({ id: id, amount: s.amount, phone: s.phone, simulated: true }, map));
        });
      }
    };
  }

  function playground(root) {
    if (!window.CielCheckout) return;
    var CC = window.CielCheckout;
    var DEFAULT = clone(PRESETS[0].theme);
    var pg = { sim: null, onSim: function () {} };
    var theme = clone(DEFAULT), order = { id: 'DEMO-1042', description: '2 × Kahawa beans 250 g', amount: 1250, currency: 'KES' };
    var frame = $('[data-pg-frame]', root), host = $('[data-pg-checkout]', root), json = $('[data-pg-json]', root);

    var api = CC.mount(host, { theme: theme, order: order, transport: simulationTransport(pg), pollMs: 500, maxWaitMs: 10 * 60 * 1000, onChange: function (st) { paintSim(st.phase); } });

    function exported() { return CC.validateTheme(theme); }
    function activePreset() { var t = exported(); for (var i = 0; i < PRESETS.length; i++) if (same(CC.validateTheme(PRESETS[i].theme), t)) return PRESETS[i].id; return null; }
    function apply(src) {
      api.setTheme(theme);
      frame.style.setProperty('--pg-bg', exported().colors.background);
      json.textContent = JSON.stringify(exported(), null, 2);
      var act = activePreset();
      $$('[data-preset]', root).forEach(function (b) { var on = b.getAttribute('data-preset') === act; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      var lbl = $('[data-pg-active]', root); if (lbl) lbl.textContent = act ? 'Preset: ' + PRESETS.filter(function (p) { return p.id === act; })[0].name : 'Custom theme';
      if (src !== 'controls') syncControls();
      var c = contrast(exported().colors.button, exported().colors.buttonText), warn = $('[data-pg-contrast]', root);
      if (warn) { warn.hidden = c >= 4.5; warn.textContent = 'Low contrast between the button and its text (' + c.toFixed(1) + ':1). Aim for 4.5:1 or more so everyone can read it.'; }
    }
    function syncControls() {
      var t = exported();
      $$('[data-c]', root).forEach(function (inp) {
        var k = inp.getAttribute('data-c'), v = k.indexOf('colors.') === 0 ? t.colors[k.slice(7)] : t[k];
        if (inp.type === 'radio') inp.checked = inp.value === String(v);
        else if (inp.getAttribute('data-hex') !== null) inp.value = v;
        else inp.value = v;
        if (k === 'radius') { var o = $('[data-pg-radius]', root); if (o) o.textContent = v + ' px'; }
      });
    }
    function setKey(k, v) {
      if (k.indexOf('colors.') === 0) { theme.colors = theme.colors || {}; theme.colors[k.slice(7)] = v; }
      else theme[k] = k === 'radius' ? Number(v) : v;
    }
    $$('[data-c]', root).forEach(function (inp) {
      var ev = inp.type === 'radio' || inp.tagName === 'SELECT' ? 'change' : 'input';
      inp.addEventListener(ev, function () {
        var k = inp.getAttribute('data-c'), v = inp.value;
        if (inp.getAttribute('data-hex') !== null) {
          if (!/^#(?:[0-9a-fA-F]{3}){1,2}$/.test(v)) { inp.setAttribute('aria-invalid', 'true'); return; }
          inp.removeAttribute('aria-invalid');
          var pick = $('[data-c="' + k + '"][type="color"]', root); if (pick && v.length === 7) pick.value = v.toLowerCase();
        } else if (inp.type === 'color') {
          var hex = $('[data-c="' + k + '"][data-hex]', root); if (hex) { hex.value = v.toUpperCase(); hex.removeAttribute('aria-invalid'); }
        }
        if (k === 'radius') { var o = $('[data-pg-radius]', root); if (o) o.textContent = v + ' px'; }
        setKey(k, v); apply('controls');
      });
    });
    // order fields (preview only)
    var amt = $('[data-o="amount"]', root), desc = $('[data-o="description"]', root);
    function setOrder() {
      var a = Math.round(Number(amt.value)), ok = a >= 1 && a <= 250000;
      amt.setAttribute('aria-invalid', ok ? 'false' : 'true');
      $('[data-pg-amount-err]', root).hidden = ok;
      if (!ok) return;
      order = { id: order.id, description: (desc.value || '').slice(0, 60), amount: a, currency: 'KES' };
      api.setOrder(order); api.setTheme(theme); pg.sim = null; paintSim('idle');
    }
    if (amt) amt.addEventListener('input', setOrder);
    if (desc) desc.addEventListener('input', setOrder);

    $$('[data-preset]', root).forEach(function (b) { b.addEventListener('click', function () { var p = PRESETS.filter(function (x) { return x.id === b.getAttribute('data-preset'); })[0]; theme = clone(p.theme); theme.merchantName = exported().merchantName || p.theme.merchantName; apply(); }); });
    var rs = $('[data-pg-reset]', root); if (rs) rs.addEventListener('click', function () { theme = clone(DEFAULT); amt.value = 1250; desc.value = '2 × Kahawa beans 250 g'; setOrder(); api.reset(); apply(); });
    var cp = $('[data-pg-copy]', root); if (cp) cp.addEventListener('click', function () { copyText(JSON.stringify(exported(), null, 2), cp); });
    var dl = $('[data-pg-download]', root); if (dl) dl.addEventListener('click', function () { download('theme.json', JSON.stringify(exported(), null, 2) + '\n'); });

    // saved themes (this browser only)
    var savedBox = $('[data-pg-saved]', root);
    function paintSaved() {
      if (!savedBox) return;
      var list = loadSaved();
      savedBox.innerHTML = list.length ? list.map(function (s, i) { return '<span class="pg-saved"><button type="button" data-load="' + i + '">' + esc(s.name) + '</button><button type="button" class="pg-saved__x" data-del="' + i + '" aria-label="Delete ' + esc(s.name) + '">×</button></span>'; }).join('') : '<span class="pg-muted">Saved themes stay in this browser only.</span>';
    }
    var sv = $('[data-pg-save]', root);
    if (sv) sv.addEventListener('click', function () {
      var list = loadSaved(), t = exported(), name = (t.merchantName || 'Theme') + ' · ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      list.unshift({ name: name, theme: t });
      if (storeSaved(list)) { paintSaved(); var x = sv.textContent; sv.textContent = 'Saved'; setTimeout(function () { sv.textContent = x; }, 1400); }
      else { sv.textContent = 'This browser blocks saving'; }
    });
    if (savedBox) savedBox.addEventListener('click', function (e) {
      var l = e.target.closest('[data-load]'), d = e.target.closest('[data-del]'), list = loadSaved();
      if (l) { theme = clone(list[+l.getAttribute('data-load')].theme); apply(); }
      if (d) { list.splice(+d.getAttribute('data-del'), 1); storeSaved(list); paintSaved(); }
    });
    paintSaved();

    // full screen preview
    var fs = $('[data-pg-full]', root), shell = $('[data-pg-stage]', root);
    function closeFull() { shell.classList.remove('is-full'); document.body.classList.remove('pg-lock'); fs.textContent = 'Full screen'; fs.setAttribute('aria-pressed', 'false'); }
    if (fs) fs.addEventListener('click', function () {
      if (shell.classList.contains('is-full')) return closeFull();
      shell.classList.add('is-full'); document.body.classList.add('pg-lock'); fs.textContent = 'Exit full screen'; fs.setAttribute('aria-pressed', 'true');
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && shell.classList.contains('is-full')) closeFull(); });

    // simulation panel
    var simBox = $('[data-pg-sim]', root), phone = $('[data-pg-phone]', root);
    function paintSim(phase) {
      var waiting = phase === 'waiting' && pg.sim && !pg.sim.outcome;
      $$('[data-outcome]', root).forEach(function (b) { b.disabled = !waiting; });
      var msg = $('[data-pg-sim-msg]', root);
      if (msg) msg.textContent = phase === 'idle' ? 'Enter a sample number such as 0712 345 678 in the preview and press Pay.' : phase === 'sending' ? 'Sending the simulated request…' : waiting ? 'Simulated prompt shown on the phone. Choose what the customer does:' : phase === 'paid' ? 'Simulated success. In production only Safaricom’s confirmation marks a payment paid.' : 'Simulated outcome shown. Reset the demo to try again.';
      if (phone) {
        phone.classList.toggle('on', !!waiting);
        if (waiting) $('[data-pg-phone-t]', root).textContent = 'Pay KES ' + fmt(order.amount) + ' to ' + exported().merchantName + '? Enter your PIN.';
      }
      if (simBox) simBox.setAttribute('data-phase', phase);
    }
    pg.onSim = function () { paintSim('waiting'); };
    $$('[data-outcome]', root).forEach(function (b) { b.addEventListener('click', function () { if (pg.sim) { pg.sim.outcome = b.getAttribute('data-outcome'); paintSim('settling'); } }); });
    var sr = $('[data-pg-sim-reset]', root); if (sr) sr.addEventListener('click', function () { pg.sim = null; api.reset(); paintSim('idle'); });

    apply(); paintSim('idle');
    root.__pg = { api: api, theme: function () { return exported(); }, order: function () { return order; } };
  }

  /* ---------- WooCommerce checkout demo (mirrors the plugin's real behaviour) ---------- */
  function wooDemo(root) {
    var s = { title: 'M-Pesa', description: 'Enter your Safaricom number. You will get a prompt on your phone to approve the payment with your M-Pesa PIN.', button: 'Pay with M-Pesa', accent: '#1F9D55', method: 'ciel_mpesa', phase: 'form', order: 1042 };
    var form = $('[data-wd-form]', root), done = $('[data-wd-done]', root);
    function paintForm() {
      root.style.setProperty('--wd-accent', s.accent);
      $('[data-wd-title]', root).textContent = s.title;
      $('[data-wd-desc]', root).textContent = s.description;
      $('[data-wd-place]', root).textContent = s.method === 'ciel_mpesa' ? s.button : 'Place order';
      $$('[data-wd-method]', root).forEach(function (r) { var box = r.closest('.wd-m'); box.classList.toggle('on', r.checked); });
    }
    $$('[data-ws]', root).forEach(function (inp) { inp.addEventListener('input', function () { s[inp.getAttribute('data-ws')] = inp.value; paintForm(); }); });
    $$('[data-wd-method]', root).forEach(function (r) { r.addEventListener('change', function () { s.method = r.value; paintForm(); }); });
    var STATES = {
      pending: ['Pending payment', 'Check your phone and enter your M-Pesa PIN. This page updates when M-Pesa confirms.', 'pending'],
      paid: ['Processing', 'Simulated: payment confirmed. In the plugin this happens only after Safaricom confirms (callback + STK query).', 'paid'],
      cancelled: ['Failed', 'Simulated: the payment prompt was cancelled. No money was taken.', 'failed'],
      failed: ['Failed', 'Simulated: M-Pesa did not complete the payment (insufficient balance). No money was taken.', 'failed'],
      review: ['On hold', 'Simulated: the amount Safaricom reported did not match the order. Needs checking before shipping.', 'review']
    };
    function paintDone(st) {
      var x = STATES[st];
      $('[data-wd-status]', root).textContent = x[0];
      $('[data-wd-status]', root).setAttribute('data-s', x[2]);
      $('[data-wd-msg]', root).textContent = x[1];
      $('[data-wd-panel]', root).setAttribute('data-state', st);
      $('[data-wd-retry]', root).hidden = !(st === 'cancelled' || st === 'failed');
      $$('[data-wd-outcome]', root).forEach(function (b) { b.disabled = st !== 'pending'; });
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var err = $('[data-wd-err]', root);
      if (s.method !== 'ciel_mpesa') { err.textContent = 'In this demo only M-Pesa can be selected.'; return; }
      var n = window.CielCheckout ? window.CielCheckout.normalizePhone($('[data-wd-phone]', root).value) : null;
      if (!n) { err.textContent = 'Enter the Safaricom number that will pay, like 0712 345 678.'; $('[data-wd-phone]', root).focus(); return; }
      err.textContent = '';
      s.order++;
      $('[data-wd-order]', root).textContent = '#' + s.order;
      $('[data-wd-phone-m]', root).textContent = '0' + n.slice(3, 6) + ' *** ' + n.slice(-3);
      form.hidden = true; done.hidden = false; paintDone('pending');
      done.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
    $$('[data-wd-outcome]', root).forEach(function (b) { b.addEventListener('click', function () { paintDone(b.getAttribute('data-wd-outcome')); }); });
    $$('[data-wd-again]', root).forEach(function (b) { b.addEventListener('click', function () { form.hidden = false; done.hidden = true; }); });
    paintForm();
  }

  function init() {
    paintPrices();
    $$('[data-cm-buy]').forEach(buyBox);
    $$('[data-playground]').forEach(playground);
    $$('[data-woodemo]').forEach(wooDemo);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
