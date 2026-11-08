/* Офлайн-работа. При новой версии поменять V и ?v= в index.html.
   1.18.1: страница (index.html) — СНАЧАЛА СЕТЬ, кэш только без интернета; при установке файлы берутся мимо кэша браузера
   (cache: 'reload'), иначе в новый кэш попадала старая страница (GitHub Pages держит её 10 мин) и сайт «откатывался». */
var V = 'klapany-1.31.0';
var FILES = ['./', 'index.html', 'css/style.css?v=1.31.0', 'css/vent.css?v=1.31.0', 'vent.html', 'clim.html', 'css/clim.css?v=1.31.0', 'js/data_sp131.js?v=1.31.0', 'js/clim_calc.js?v=1.31.0', 'js/clim.js?v=1.31.0', 'js/data_geo131.js?v=1.31.0', 'js/clim_map.js?v=1.31.0', 'js/data_vent.js?v=1.31.0', 'js/vent_search.js?v=1.31.0', 'js/vent.js?v=1.31.0', 'js/data_norms.js?v=1.31.0', 'js/data_no.js?v=1.31.0', 'js/data_nz.js?v=1.31.0', 'js/data_more.js?v=1.31.0', 'js/data_fire2.js?v=1.31.0', 'js/data_build.js?v=1.31.0', 'js/data_stairs.js?v=1.31.0', 'js/stairs.js?v=1.31.0', 'js/fieldcheck.js?v=1.31.0', 'js/dpu.js?v=1.31.0', 'js/dpu_low.js?v=1.31.0', 'js/net.js?v=1.31.0', 'js/data_comp.js?v=1.31.0', 'js/comp.js?v=1.31.0', 'js/data_cat.js?v=1.31.0', 'js/data_evac.js?v=1.31.0', 'js/data_alarm.js?v=1.31.0', 'js/cat.js?v=1.31.0', 'js/schemes.js?v=1.31.0', 'js/steps.js?v=1.31.0', 'js/anatomy.js?v=1.31.0', 'js/render.js?v=1.31.0', 'js/stats.js?v=1.31.0', 'js/data_rooms.js?v=1.31.0', 'js/data_spn.js?v=1.31.0', 'js/data_spn2.js?v=1.31.0', 'js/app.js?v=1.31.0', 'js/vn_core.js?v=1.31.0', 'js/vn_exh.js?v=1.31.0', 'js/vn_sup.js?v=1.31.0', 'js/kvm_smk.js?v=1.31.0', 'js/kvm_sup.js?v=1.31.0', 'js/kvm_lift_ug.js?v=1.31.0', 'js/pdv3d.js?v=1.31.0', 'js/pdv3d_smk.js?v=1.31.0', 'js/kvm_rep.js?v=1.31.0', 'js/kvm_comp.js?v=1.31.0', 'js/kvm_tamb.js?v=1.31.0', 'js/kvm_tamb_ui.js?v=1.31.0', 'js/data_clim.js?v=1.31.0', 'js/data_kms_cat.js?v=1.31.0', 'js/kvm_kms.js?v=1.31.0', 'js/kvm_scheme.js?v=1.31.0', 'js/pdv3r.js?v=1.31.0', 'js/kvm_sketch.js?v=1.31.0', 'js/vendor/three.min.js?v=1.31.0', 'js/kvm_ui.js?v=1.31.0', 'js/kvm_proj.js?v=1.31.0', 'js/kvm_kmsz.js?v=1.31.0', 'js/kvm_file.js?v=1.31.0', 'js/jokes.js?v=1.31.0', 'js/data_aupt.js?v=1.31.0', 'js/aupt.js?v=1.31.0', 'js/search.js?v=1.31.0', 'js/data_dbn.js?v=1.31.0', 'js/dbn.js?v=1.31.0', 'js/rooms.js?v=1.31.0', 'js/farea.js?v=1.31.0', 'js/hints.js?v=1.31.0', 'js/hints_kv.js?v=1.31.0', 'js/fx.js?v=1.31.0', 'snd/fireplace.mp3?v=1.31.0', 'manifest.webmanifest', 'icon-512.png', 'icon-192.png', 'favicon.ico', 'favicon-32.png', 'apple-touch-icon.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(V).then(function (c) {
    return Promise.all(FILES.map(function (f) {
      return fetch(new Request(f, { cache: 'reload' })).then(function (r) { if (r.ok) return c.put(f, r); });
    }));
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (k) {
    return Promise.all(k.filter(function (n) { return n.indexOf('klapany-') === 0 && n !== V; }).map(function (n) { return caches.delete(n); }));
  }).then(function () { return self.clients.claim(); }).then(function () {
    /* 1.21.1: вкладки со старой копией (до 1.18 в них нет перезагрузки по controllerchange) — перезагрузить 1 раз */
    return self.clients.matchAll({ type: 'window' }).then(function (cs) {
      cs.forEach(function (c) { try { c.navigate(c.url); } catch (x) {} });
    });
  }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var u = new URL(e.request.url);
  var fonts = u.hostname.indexOf('fonts.g') === 0;
  if (u.origin !== location.origin && !fonts) return;
  /* страница — сначала сеть */
  if (e.request.mode === 'navigate' || /\/(index\.html|vent\.html|clim\.html)?$/.test(u.pathname)) {
    var pg = /vent\.html$/.test(u.pathname) ? 'vent.html' : /clim\.html$/.test(u.pathname) ? 'clim.html' : 'index.html'; /* 1.22.5: у каждой страницы свой ключ; 1.31.0 + clim.html */
    /* 1.20.1: новый запрос по адресу, без init у navigate-запроса — некоторые браузеры такой fetch отвергают */
    e.respondWith(fetch(new Request(u.href, { cache: 'no-cache', credentials: 'same-origin' })).then(function (a) {
      if (a.ok) { var c = a.clone(); caches.open(V).then(function (o) { o.put(pg, c); }); }
      return a;
    }).catch(function () { return caches.match(pg).then(function (c) { return c || fetch(e.request); }); }));
    return;
  }
  /* файлы с ?v= и иконки — из кэша, нет в кэше — из сети */
  e.respondWith(caches.match(e.request).then(function (r) {
    return r || fetch(e.request).then(function (a) {
      if (a.ok && fonts) { var c = a.clone(); caches.open(V).then(function (o) { o.put(e.request, c); }); }
      return a;
    });
  }));
});
