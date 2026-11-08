/* 1.30.0 Климатология — карта пунктов СП 131: зима (пятидневка 0,92), лето (0,95), ветер января, ГСОП под выбранные тип здания и tв.
   Leaflet 1.9.4 (cdnjs) грузится только при открытии карты; подложка OpenStreetMap, затемнена фильтром; координаты — GeoNames (CC BY 4.0),
   сопоставлены _tools/geo_sp131.py с проверкой по высоте станции. Значения точек — только из СП 131 (таблицы 5.1, 6.1), ГСОП — СП 50 ф. (5.2). */
(function () {
  var $ = function (s) { return document.querySelector(s); };
  var map = null, layer = null, mode = 'w', loading = false;
  try { mode = localStorage.getItem('klapany-clim-map') || 'w'; } catch (x) {}
  var PAL = {
    w: { t: 'Зима — пятидневка 0,92, °C', src: 'СП 131 табл. 5.1', st: [[-55, '#3a2f9e'], [-40, '#3f5fe0'], [-30, '#4f93f2'], [-20, '#6fc3ff'], [-10, '#a8e6ff'], [0, '#eefaff']], v: function (c) { return c.cold[3]; }, f: 0 },
    s: { t: 'Лето — обеспеченность 0,95, °C', src: 'СП 131 табл. 6.1', st: [[12, '#fff6cf'], [20, '#ffd986'], [25, '#ffb35c'], [29, '#ff8442'], [33, '#e8452c']], v: function (c) { return c.warm[1]; }, f: 0 },
    v: { t: 'Ветер — январь, макс. из средних по румбам, м/с', src: 'СП 131 табл. 5.1', st: [[0, '#2f6f6a'], [3, '#3fd0b0'], [6, '#8ab4ff'], [9, '#b79bff'], [12, '#ff6fb5'], [16, '#ff3b6b']], v: function (c) { return c.cold[17]; }, f: 1 },
    g: { t: 'ГСОП, °C·сут/год — тип здания и tв из карточки', src: 'СП 50.13330.2024 ф. (5.2)', st: [[1000, '#ffb35c'], [3000, '#ffe08a'], [5000, '#a8e6ff'], [7000, '#6fc3ff'], [9000, '#4f73f0'], [12000, '#3a2f9e']], v: function (c) { var r = window.CLIM && CLIM.gsopOf(c); return r ? r.g : null; }, f: 0 }
  };
  function hex(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  function col(st, v) {
    if (v <= st[0][0]) return st[0][1];
    for (var i = 0; i < st.length - 1; i++) if (v <= st[i + 1][0]) {
      var k = (v - st[i][0]) / (st[i + 1][0] - st[i][0]), a = hex(st[i][1]), b = hex(st[i + 1][1]);
      return 'rgb(' + a.map(function (x, j) { return Math.round(x + k * (b[j] - x)); }).join(',') + ')';
    }
    return st[st.length - 1][1];
  }
  function fmt(v, n) { return String(Math.round(v * Math.pow(10, n)) / Math.pow(10, n)).replace('.', ',').replace(/^-/, '−'); }
  function legend(P) {
    var g = 'linear-gradient(90deg,' + P.st.map(function (s, i) { return s[1] + ' ' + Math.round(i / (P.st.length - 1) * 100) + '%'; }).join(',') + ')';
    return '<div class="cmleg"><b>' + P.t + '</b><span class="cmbar" style="background:' + g + '"></span><span class="cmticks">' + P.st.map(function (s) { return '<i>' + fmt(s[0], 0) + '</i>'; }).join('') + '</span><small>' + P.src + '. Нажми на точку — карточка пункта.</small></div>';
  }
  function draw() {
    if (!map) return;
    var P = PAL[mode], cur = window.CLIM && CLIM.cur();
    if (layer) layer.remove();
    layer = L.layerGroup();
    SP131.cities.forEach(function (c) {
      var p = GEO131.p[c.r + '|' + c.c], v = P.v(c);
      if (!p || v === null || v === undefined) return;
      var lon = p[1] < 0 ? p[1] + 360 : p[1], on = cur === c;   /* Чукотка за 180° — продолжение карты */
      var m = L.circleMarker([p[0], lon], { radius: on ? 9 : 6, weight: on ? 3 : 1, color: on ? '#ffffff' : 'rgba(10,18,38,.9)', fillColor: col(P.st, v), fillOpacity: .95 });
      m.bindTooltip('<b>' + c.c + '</b> ' + fmt(v, P.f) + '<br><small>' + c.r + '</small>', { direction: 'top', offset: [0, -6] });
      m.on('click', function () { if (window.CLIM) CLIM.show(c, true); });
      layer.addLayer(m);
    });
    layer.addTo(map);
    $('#cmleg').innerHTML = legend(P);
    [].forEach.call(document.querySelectorAll('#cmodes button'), function (b) { b.classList.toggle('on', b.dataset.m === mode); });
  }
  function init() {
    if (map || loading) return;
    if (!window.L) {
      loading = true;
      var css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'; document.head.appendChild(css);
      var s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
      s.onload = function () { loading = false; init(); };
      s.onerror = function () { loading = false; $('#cmap').innerHTML = '<p class="cnote">Карта не загрузилась — нет интернета или библиотека недоступна. Таблицы и расчёты работают и без неё.</p>'; };
      document.head.appendChild(s); return;
    }
    map = L.map('cmap', { zoomSnap: 0.5, worldCopyJump: false, attributionControl: true }).setView([62, 100], 2.5);
    /* подложка OpenStreetMap (без ключа; CARTO с 2026 просит ключ), затемнена фильтром в clim.css */
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 12,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>; координаты — <a href="https://www.geonames.org/">GeoNames</a> (CC BY 4.0)' }).addTo(map);
    map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
    map.fitBounds([[41, 19], [77, 191]]);
    if (pending) { map.setView([pending[0], pending[1] < 0 ? pending[1] + 360 : pending[1]], 6); pending = null; }
    draw();
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('#cmodes button'); if (!b) return;
    mode = b.dataset.m; try { localStorage.setItem('klapany-clim-map', mode); } catch (x) {}
    draw();
  });
  var d = $('#cmapd');
  if (d) { d.addEventListener('toggle', function () { if (d.open) { init(); if (map) setTimeout(function () { map.invalidateSize(); }, 50); } }); if (d.open) init(); }
  var pin = null, pending = null;
  function mark(lat, lon, name) {   /* 1.32.0: город не из СП 131 — отметка на карте */
    if (!map) return;
    if (pin) pin.remove();
    pin = L.circleMarker([lat, lon < 0 ? lon + 360 : lon], { radius: 8, weight: 3, color: '#ffffff', fillColor: '#b79bff', fillOpacity: 1, dashArray: '3 3' })
      .bindTooltip(name + ' — нет в СП 131', { permanent: true, direction: 'right', offset: [8, 0] }).addTo(map);
    map.setView([lat, lon < 0 ? lon + 360 : lon], 6);
  }
  window.CLIM_MAP = { mark: mark, redraw: draw, view: function () { return map ? [map.getZoom(), map.getCenter().lat, map.getCenter().lng] : null; }, focus: function (c) {   /* 1.32.0, инженер: «выбрал город — к нему по карте зум» */
    var p = GEO131.p[c.r + '|' + c.c];
    if (!p) return draw();
    if (!map) { pending = p; return; }            /* карта ещё грузится — приблизить после загрузки */
    if (pin) { pin.remove(); pin = null; }
    map.setView([p[0], p[1] < 0 ? p[1] + 360 : p[1]], Math.max(map.getZoom(), 6), { animate: false });   /* сразу, без анимации — надёжно и на слабых телефонах */
    draw(); } };
})();
