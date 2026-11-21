/* Ciel Admin service worker: makes /admin installable and shows order / message notifications.
   It never caches order data: Ciel Admin always loads live from the server. */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function (e) {
  /* network only; if offline, show a small note for the app page itself */
  if (e.request.mode !== 'navigate') return;
  e.respondWith(fetch(e.request).catch(function () { return new Response('<!doctype html><meta name="viewport" content="width=device-width"><body style="font-family:sans-serif;background:#14110f;color:#f4ede4;display:grid;place-items:center;min-height:100vh;margin:0"><p>You’re offline. Ciel Admin will load when you’re back online.</p></body>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } }); }));
});
self.addEventListener('push', function (e) {
  var d = {}; try { d = e.data ? e.data.json() : {}; } catch (er) { d = { title: 'Ciel Admin', body: e.data ? e.data.text() : '' }; }
  /* leads, orders/payments and WhatsApp arrive as high-priority alerts: sound and vibration, shown on top and on the lock screen, kept until tapped */
  var opts = { body: d.body || '', icon: '/assets/img/icon-192.png', badge: '/assets/img/hq-badge.png', tag: d.tag || undefined, renotify: !!d.tag, timestamp: Date.now(), data: { url: d.url || '/admin' } };
  if (d.urgent) { opts.requireInteraction = true; opts.silent = false; opts.vibrate = [300, 120, 300, 120, 500]; opts.actions = [{ action: 'open', title: 'Open' }]; }
  e.waitUntil(self.registration.showNotification(d.title || 'Ciel Admin', opts).then(function () {
    /* a dot on the app icon until Ciel Admin is opened */
    if (d.urgent && self.navigator && self.navigator.setAppBadge) self.navigator.setAppBadge().catch(function () { });
    return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (cs) { cs.forEach(function (c) { c.postMessage({ type: 'hq-push' }); }); });
  }));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || '/admin';
  /* always open inside the app (never a separate browser view you can't close) */
  if (url.indexOf('/admin') !== 0) url = '/admin';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (cs) {
    for (var i = 0; i < cs.length; i++) {
      if (cs[i].url.indexOf('/admin') >= 0) { cs[i].postMessage({ type: 'hq-go', url: url }); return cs[i].focus(); }
    }
    return self.clients.openWindow(url);
  }));
});
