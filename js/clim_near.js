/* 1.32.0, инженер 08.11.2026: «при поиске города, если его нет, предлагать ближайший».
   Город ищется в Nominatim (OpenStreetMap, ODbL) — только по нажатию кнопки, один запрос (правила сервиса: без автоподсказки).
   Ближайшие пункты СП 131 — по расстоянию по дуге большого круга до координат GeoNames (js/data_geo131.js).
   СП 131.13330.2025 п. 4.1: при отсутствии данных допускается ближайший репрезентативный пункт в местности с аналогичными условиями;
   прибрежные районы морей и крупных водохранилищ, местность выше 500 м, удалённость от метеостанции более 100 км — данные Росгидромета (прил. Б). */
(function () {
  var $ = function (s) { return document.querySelector(s); };
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function km(a, b, c, d) {
    var R = 6371, r = Math.PI / 180, x = Math.sin((c - a) * r / 2), y = Math.sin((d - b) * r / 2);
    return 2 * R * Math.asin(Math.sqrt(x * x + Math.cos(a * r) * Math.cos(c * r) * y * y));
  }
  function near(lat, lon, n) {
    var out = [];
    SP131.cities.forEach(function (c) { var p = GEO131.p[c.r + '|' + c.c]; if (p) out.push([km(lat, lon, p[0], p[1]), c]); });
    return out.sort(function (a, b) { return a[0] - b[0]; }).slice(0, n);
  }
  function t(v) { return v === null || v === undefined ? '—' : String(v).replace('-', '−'); }
  function block(place, lat, lon) {
    var l = near(lat, lon, 3), d0 = l.length ? l[0][0] : Infinity;
    var h = '<div class="cnear"><p><b>' + esc(place) + '</b> — в СП 131 нет. Ближайшие пункты СП 131 (по прямой):</p><div class="cres">' +
      l.map(function (x) { var c = x[1]; return '<button type="button" data-i="' + SP131.cities.indexOf(c) + '"><b>' + esc(c.c) + ' — ' + Math.round(x[0]) + ' км</b><small>' + esc(c.r) + '</small><i class="cold">' + t(c.cold[3]) + '°</i></button>'; }).join('') + '</div>';
    h += '<p class="cnote">' + (d0 > 100 ? '<b>Ближайший пункт дальше 100 км</b> — по п. 4.1 СП 131 климатические данные следует определять по данным территориального управления Росгидромета (с учётом прил. Б). ' : '') +
      'По п. 4.1 СП 131 ближайший пункт допускается принимать, только если он репрезентативный и в местности с аналогичными условиями; для прибрежных районов морей и крупных водохранилищ и местности выше 500 м — данные Росгидромета. Проверь высоту и берег сам: справочник их не знает.</p>';
    return h + '<p class="csrc">Координаты города — OpenStreetMap (Nominatim), пунктов — GeoNames.</p></div>';
  }
  function geocode(q, box) {
    box.innerHTML = '<p class="cnote">Ищу «' + esc(q) + '» на карте…</p>';
    var url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=ru,ua&accept-language=ru&q=' + encodeURIComponent(q);
    fetch(url).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (a) {
      a = a.filter(function (x) { return x.category === 'place' || x.type === 'administrative'; });
      if (!a.length) { box.innerHTML = '<p class="cnote">«' + esc(q) + '» не нашёлся и на карте. Проверь название.</p>'; return; }
      var x = a[0], name = x.display_name.split(',').slice(0, 3).join(',');
      box.innerHTML = block(name, +x.lat, +x.lon) + (a.length > 1 ? '<p class="cnote">Не тот? ' + a.slice(1).map(function (y, i) { return '<button type="button" class="cnalt" data-lat="' + y.lat + '" data-lon="' + y.lon + '" data-nm="' + esc(y.display_name.split(',').slice(0, 3).join(',')) + '">' + esc(y.display_name.split(',').slice(0, 3).join(',')) + '</button>'; }).join(' ') + '</p>' : '');
      if (window.CLIM_MAP && CLIM_MAP.mark) CLIM_MAP.mark(+x.lat, +x.lon, name);
    }).catch(function () { box.innerHTML = '<p class="cnote">Поиск по карте не ответил — нет интернета? Пункты СП 131 ищутся и без сети.</p>'; });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button'); if (!b) return;
    if (b.id === 'cngo') geocode(b.dataset.q, $('#cres'));
    else if (b.classList.contains('cnalt')) { $('#cres').innerHTML = block(b.dataset.nm, +b.dataset.lat, +b.dataset.lon); if (window.CLIM_MAP && CLIM_MAP.mark) CLIM_MAP.mark(+b.dataset.lat, +b.dataset.lon, b.dataset.nm); }
  });
  /* clim.js: нет совпадений — кнопка поиска по карте */
  window.CLIM_NEAR = { offer: function (q) {
    return '<div class="cnear"><p>«' + esc(q) + '» нет среди ' + SP131.cities.length + ' пунктов СП 131.</p><button type="button" class="eibtn" id="cngo" data-q="' + esc(q) + '">Найти город на карте и подобрать ближайший пункт</button></div>';
  } };
})();
