/* ============================================================
   CIEL AFRICA — Meta Pixel (1368811611869665) and the site's Meta events.
   The one and only copy of the pixel base code. Loaded (not async) in the
   <head> of public pages, so window.CielPixel exists before page scripts run.

   - Runs only on cielafrica.com: a template copied to another domain never reports here.
   - PageView: once per page, and once per in-app page change (photo books), never twice
     for the same address. Meta's own automatic history tracking is switched off so it
     can't double up.
   - Never fires on an address that carries a private token (?t=, ?k=, ?token=, ...).
   - Page scripts call CielPixel.track(name, params, { id, once }) for Lead, AddToCart,
     InitiateCheckout and Purchase; Contact is caught here from WhatsApp, phone and email taps.
   ============================================================ */
(function () {
  var ID = '1368811611869665', W = window, D = document, L = location;
  var ON = /(^|\.)cielafrica\.com$/.test(L.hostname) || W.__CPX_TEST === true;
  /* live templates: their pages count as views of that template, but their own
     contact links belong to the sample business, so they are not Ciel contacts */
  var TPL = { 'abali': 'Abali Hospital', 'apex-motion': 'Apex Motion', 'c-ledger': 'C-Ledger', 'ciel-shop': 'Ciel Shop', 'creme-motion': 'Crème Motion', 'ember-plate': 'Ember & Plate',
    'kintra': 'Kintra', 'mokara': 'Mokara', 'muse': 'Muse', 'njia': 'Njia', 'orbit': 'Orbit', 'pay-kit': 'Pay Kit', 'reside-ke': 'Reside', 'wanja': 'Wanja' };
  var PB_SKIP = { 'design': 1, 'my-books': 1, 'track': 1, 'checkout': 1, 'index': 1, 'index.html': 1 };
  function noop() { }
  function segs() { return L.pathname.replace(/\.html$/, '').split('/').filter(Boolean); }
  function tplSlug() { var s = L.pathname.split('/'); return s.length > 2 && TPL[s[1]] ? s[1] : null; }
  function secret() { return /[?&](t|k|tok|token|receipt|crid|key)=/i.test(L.search); }
  function ss(k, v) { try { if (v === undefined) return JSON.parse(sessionStorage.getItem(k) || 'null'); sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  function ls(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null'); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }

  var api = W.CielPixel = { track: noop, after: noop, cart: noop, on: false };
  if (!ON) return;

  /* ---- Meta base code (unchanged apart from the id living above) ---- */
  !function (f, b, e, v, n, t, s) {
    if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0;
    t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  }(W, D, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  W.fbq.disablePushState = true;                 // we send in-app page views ourselves (below), exactly once each
  W.fbq('set', 'autoConfig', false, ID);         // no automatic button-click or page-content events
  W.fbq('init', ID);
  api.on = true;

  /* ---- events ---- */
  function send(name, params, eventId) {
    if (secret()) return false;
    var p = {}; Object.keys(params || {}).forEach(function (k) { if (params[k] !== undefined && params[k] !== null && params[k] !== '') p[k] = params[k]; });
    if (p.value !== undefined) { p.value = Math.round(Number(p.value) * 100) / 100; if (!isFinite(p.value)) delete p.value; else p.currency = p.currency || 'KES'; }
    if (eventId) W.fbq('track', name, p, { eventID: String(eventId) }); else W.fbq('track', name, p);
    (api.log || (api.log = [])).push([name, p, eventId || null]);
    return true;
  }
  /* opts.once: never send the same key twice in this browser (Purchase), opts.session: once per visit */
  api.track = function (name, params, opts) {
    opts = opts || {};
    var key = opts.once || opts.session, store = opts.once ? ls : ss, done = key ? (store('cpx_done') || []) : null;
    if (key && done.indexOf(name + ':' + key) > -1) return false;
    var ok = send(name, params, opts.id || null);
    if (ok && key) { done.push(name + ':' + key); store('cpx_done', done.slice(-80)); }
    return ok;
  };
  /* for events that happen just before the browser leaves the page (a form that redirects
     to the thank-you page): sent as soon as the next page of this site opens */
  api.after = function (name, params, opts) { var q = ss('cpx_next') || []; q.push([name, params || {}, opts || {}, Date.now()]); ss('cpx_next', q); };
  function flush() { var q = ss('cpx_next') || []; if (!q.length) return; ss('cpx_next', []); q.forEach(function (x) { if (Date.now() - x[3] < 10 * 60000) api.track(x[0], x[1], x[2]); }); }

  /* ecommerce helper: cart lines -> Meta parameters */
  api.cart = function (items, value) {
    items = items || [];
    var contents = items.map(function (i) { return { id: String(i.id), quantity: Number(i.qty || 1), item_price: Number(i.price || 0) }; });
    var total = value != null ? Number(value) : contents.reduce(function (s, c) { return s + c.item_price * c.quantity; }, 0);
    return { content_ids: contents.map(function (c) { return c.id; }), contents: contents, content_type: 'product', num_items: contents.reduce(function (s, c) { return s + c.quantity; }, 0), value: total, currency: 'KES' };
  };

  /* ---- PageView + ViewContent: once per address ---- */
  var last = null;
  function viewContent() {
    var s = segs(), a = s[0] || '', b = s[1] || '';
    var t = tplSlug();
    if (t) return api.track('ViewContent', { content_name: TPL[t] + ' (live template)', content_category: 'Website templates', content_ids: ['tpl-' + t], content_type: 'product' });
    if (a === 'services') return api.track('ViewContent', { content_name: 'Services', content_category: 'Services' });
    if (a === 'products') return api.track('ViewContent', { content_name: 'Products', content_category: 'Products' });
    if (a === 'templates') return api.track('ViewContent', { content_name: 'Website templates', content_category: 'Website templates' });
    if (a === 'ciel-shop') return api.track('ViewContent', { content_name: 'Ciel Shop', content_category: 'Website templates', content_ids: ['tpl-ciel-shop'], content_type: 'product' });
    if (a === 'domains' && !b) return api.track('ViewContent', { content_name: 'Domains', content_category: 'Domains' });
    if (a === 'photobooks') {
      if (!b || b === 'index') return api.track('ViewContent', { content_name: 'Photo Books', content_category: 'Photo Books' });
      if (!PB_SKIP[b] && /^[a-z-]+$/.test(b)) return api.track('ViewContent', { content_name: 'Photo Books · ' + b.replace(/-/g, ' ').replace(/^./, function (c) { return c.toUpperCase(); }), content_category: 'Photo Books', content_ids: ['pb-' + b], content_type: 'product_group' });
    }
  }
  function pageview() {
    var u = L.pathname + L.search;
    if (u === last || secret()) return;
    last = u;
    send('PageView', {});
    viewContent();
  }
  api.pageview = pageview;
  pageview();
  flush();
  /* in-app page changes (photo books): pushState and back/forward, not replaceState */
  var push = history.pushState;
  history.pushState = function () { var r = push.apply(this, arguments); setTimeout(pageview, 0); return r; };
  W.addEventListener('popstate', function () { setTimeout(pageview, 0); });

  /* ---- Contact: WhatsApp, phone and email taps on Ciel Africa's own pages ---- */
  D.addEventListener('click', function (ev) {
    var a = ev.target && ev.target.closest && ev.target.closest('a[href]');
    if (!a || tplSlug()) return;
    var h = a.getAttribute('href') || '', ch = /wa\.me\/|api\.whatsapp\.com\//i.test(h) ? 'WhatsApp' : /^tel:/i.test(h) ? 'Phone' : /^mailto:/i.test(h) ? 'Email' : null;
    if (!ch) return;
    var k = 'cpx_c_' + ch, t = ss(k);
    if (t && Date.now() - t < 30000) return;   // one tap, one Contact (double taps and repeat clicks within 30 s are ignored)
    ss(k, Date.now());
    api.track('Contact', { content_name: ch, content_category: (segs()[0] || 'home') });
  }, true);
})();
