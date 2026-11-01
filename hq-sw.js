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
  e.waitUntil(self.registration.showNotification(d.title || 'Ciel Admin', { body: d.body || '', icon: '/assets/img/icon-192.png', badge: '/assets/img/favicon-32.png', tag: d.tag || undefined, renotify: !!d.tag, data: { url: d.url || '/admin' } }).then(function () {
    return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (cs) { cs.forEach(function (c) { c.postMessage({ type: 'hq-push' }); }); });
  }));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || '/admin';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (cs) {
    for (var i = 0; i < cs.length; i++) { if (cs[i].url.indexOf('/admin') >= 0) { cs[i].navigate(url); return cs[i].focus(); } }
    return self.clients.openWindow(url);
  }));
});
