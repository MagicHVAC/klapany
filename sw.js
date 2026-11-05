/* Офлайн-работа. При новой версии поменять V и ?v= в index.html */
var V = 'klapany-1.0.0';
var FILES = ['./', 'index.html', 'css/style.css?v=1.0.0', 'js/data_norms.js?v=1.0.0', 'js/data_no.js?v=1.0.0', 'js/data_nz.js?v=1.0.0', 'js/data_more.js?v=1.0.0', 'js/schemes.js?v=1.0.0', 'js/render.js?v=1.0.0', 'js/app.js?v=1.0.0', 'manifest.webmanifest', 'icon-512.png'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(V).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (k) {
    return Promise.all(k.filter(function (n) { return n.indexOf('klapany-') === 0 && n !== V; }).map(function (n) { return caches.delete(n); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(function (r) {
    return r || fetch(e.request).then(function (a) {
      if (a.ok && new URL(e.request.url).origin.indexOf('fonts.g') > 0) { var c = a.clone(); caches.open(V).then(function (o) { o.put(e.request, c); }); }
      return a;
    }).catch(function () { return caches.match('index.html'); });
  }));
});
