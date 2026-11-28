/* Ciel Admin service worker: makes /admin installable, opens it instantly and shows alerts.
   The app itself (the page, its scripts, styles and fonts) is kept on the device so Ciel Admin opens
   straight away, then quietly checks for a newer version in the background. Order, customer and
   message data is never stored here: it always comes live from the server (/api is never cached). */
var SHELL = 'hq-shell-v1', FILES = 'hq-files-v1';
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return /^hq-/.test(k) && k !== SHELL && k !== FILES; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
var OFFLINE = '<!doctype html><meta name="viewport" content="width=device-width"><body style="font-family:sans-serif;background:#0F1729;color:#E8EBF3;display:grid;place-items:center;min-height:100vh;margin:0"><p>You’re offline. Ciel Admin will load when you’re back online.</p></body>';
/* keep only the files the current page uses (old versions are dropped after an update) */
function prune(html) {
  return caches.open(FILES).then(function (c) { return c.keys().then(function (ks) { return Promise.all(ks.map(function (r) { var u = new URL(r.url); if (u.origin === location.origin && /^\/assets\/(hq|js|pbk)\//.test(u.pathname) && html.indexOf(u.pathname + u.search) < 0 && !/\/assets\/hq\/manifest/.test(u.pathname)) return c.delete(r); })); }); });
}
function freshShell() {
  return fetch('/admin', { cache: 'no-store', credentials: 'same-origin' }).then(function (r) {
    if (!r.ok) return r;
    var copy = r.clone(); copy.text().then(function (h) { caches.open(SHELL).then(function (c) { c.put('/admin', new Response(h, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })); }); prune(h); });
    return r;
  });
}
self.addEventListener('fetch', function (e) {
  var req = e.request, u = new URL(req.url);
  if (req.method !== 'GET') return;
  /* the app page: the newest version from the server when it answers within 3 seconds (so a fix reaches the
     phone on the very next open), otherwise the copy kept on the device, otherwise the offline note */
  if (req.mode === 'navigate') {
    if (u.origin !== location.origin || !/^\/admin\/?$/.test(u.pathname)) return;
    var net = freshShell();
    e.waitUntil(net.catch(function () { }));
    e.respondWith(new Promise(function (done) {
      var sent = false, send = function (r) { if (!sent && r) { sent = true; done(r); } };
      var fromCache = function () { return caches.open(SHELL).then(function (c) { return c.match('/admin'); }); };
      net.then(function (r) { if (r && r.ok) send(r); else fromCache().then(function (h) { send(h || r); }); }, function () { fromCache().then(function (h) { send(h || new Response(OFFLINE, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })); }); });
      setTimeout(function () { fromCache().then(function (h) { if (h) send(h); }); }, 3000);
    }));
    return;
  }
  /* versioned app files and fonts never change once published: device first */
  var mine = u.origin === location.origin && !!u.search && /^\/assets\/(hq|vendor|js|pbk|img)\//.test(u.pathname) && !/manifest/.test(u.pathname);
  var font = /^https:\/\/fonts\.(googleapis|gstatic)\.com$/.test(u.origin);
  if (!mine && !font) return;
  if (/^\/api\//.test(u.pathname)) return;
  e.respondWith(caches.open(FILES).then(function (c) { return c.match(req).then(function (hit) {
    if (hit) return hit;
    return fetch(req).then(function (r) { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; });
  }); }));
});
self.addEventListener('push', function (e) {
  var d = {}; try { d = e.data ? e.data.json() : {}; } catch (er) { d = { title: 'Ciel Admin', body: e.data ? e.data.text() : '' }; }
  /* leads, orders/payments and WhatsApp arrive as high-priority alerts: sound and vibration, shown on top and on the lock screen, kept until tapped */
  /* Android already shows the app's name and the white Ciel mark in the status bar; a big logo on the right only
     squeezes the message, so phones get the full width for the text. */
  var android = /Android/i.test((self.navigator && self.navigator.userAgent) || '');
  var opts = { body: d.body || '', icon: android ? undefined : '/assets/img/icon-192.png', badge: '/assets/img/hq-badge.png?v=2', tag: d.tag || undefined, renotify: !!d.tag, timestamp: Date.now(), data: { url: d.url || '/admin' } };
  if (d.urgent) { opts.requireInteraction = true; opts.silent = false; opts.vibrate = [300, 120, 300, 120, 500]; opts.actions = [{ action: 'open', title: 'Open' }]; }
  var got = Date.now();
  /* tell Ciel Admin when it arrived (shown in the bell), without holding up the alert */
  var ack = d.id ? fetch('/api/hq?route=push-ack', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'hq' }, body: JSON.stringify({ id: d.id, at: got, device: /iPhone|iPad/.test((self.navigator || {}).userAgent || '') ? 'iPhone' : android ? 'Android' : 'computer' }) }).catch(function () { }) : null;
  e.waitUntil(Promise.all([ack, self.registration.showNotification(d.title || 'Ciel Admin', opts).then(function () {
    /* a dot on the app icon until Ciel Admin is opened */
    if (d.urgent && self.navigator && self.navigator.setAppBadge) self.navigator.setAppBadge().catch(function () { });
    return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (cs) { cs.forEach(function (c) { c.postMessage({ type: 'hq-push' }); }); });
  })]));
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
