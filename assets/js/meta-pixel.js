/* Meta Pixel for Ciel Africa (pixel 1368811611869665).
   Runs only on cielafrica.com, so a template copied to another domain never reports to Ciel Africa's pixel.
   Not loaded on admin, order, download or review pages. */
(function () {
  if (!/(^|\.)cielafrica\.com$/.test(location.hostname)) return;
  !function (f, b, e, v, n, t, s) {
    if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0;
    t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  fbq('set', 'autoConfig', false, '1368811611869665'); // page views only: no automatic button-click or page-content events
  fbq('init', '1368811611869665');
  fbq('track', 'PageView');
})();
