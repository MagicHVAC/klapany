/* Офлайн-работа. При новой версии поменять V и ?v= в index.html */
var V = 'klapany-1.15.0';
var FILES = ['./', 'index.html', 'css/style.css?v=1.15.0', 'js/data_norms.js?v=1.15.0', 'js/data_no.js?v=1.15.0', 'js/data_nz.js?v=1.15.0', 'js/data_more.js?v=1.15.0', 'js/data_fire2.js?v=1.15.0', 'js/data_build.js?v=1.15.0', 'js/data_stairs.js?v=1.15.0', 'js/stairs.js?v=1.15.0', 'js/dpu.js?v=1.15.0', 'js/data_comp.js?v=1.15.0', 'js/comp.js?v=1.15.0', 'js/data_cat.js?v=1.15.0', 'js/data_evac.js?v=1.15.0', 'js/data_alarm.js?v=1.15.0', 'js/cat.js?v=1.15.0', 'js/schemes.js?v=1.15.0', 'js/steps.js?v=1.15.0', 'js/anatomy.js?v=1.15.0', 'js/render.js?v=1.15.0', 'js/stats.js?v=1.15.0', 'js/data_rooms.js?v=1.15.0', 'js/data_spn.js?v=1.15.0', 'js/data_spn2.js?v=1.15.0', 'js/app.js?v=1.15.0', 'js/search.js?v=1.15.0', 'js/rooms.js?v=1.15.0', 'js/fx.js?v=1.15.0', 'manifest.webmanifest', 'icon-512.png', 'icon-192.png', 'favicon.ico', 'favicon-32.png', 'apple-touch-icon.png'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(V).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (k) {
    return Promise.all(k.filter(function (n) { return n.indexOf('klapany-') === 0 && n !== V; }).map(function (n) { return caches.delete(n); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var u = new URL(e.request.url);
  if (u.origin !== location.origin && u.hostname.indexOf('fonts.g') !== 0) return;
  e.respondWith(caches.match(e.request).then(function (r) {
    return r || fetch(e.request).then(function (a) {
      if (a.ok && new URL(e.request.url).origin.indexOf('fonts.g') > 0) { var c = a.clone(); caches.open(V).then(function (o) { o.put(e.request, c); }); }
      return a;
    }).catch(function () { return caches.match('index.html'); });
  }));
});
