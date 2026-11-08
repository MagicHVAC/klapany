/* 1.36.0 Погода сейчас в выбранном пункте (внизу карточки) + анимация на всю страницу по погоде (js/wx_fx.js).
   Данные: Open-Meteo (open-meteo.com, CC BY 4.0) — текущие значения погодной модели, без ключа; кэш на 10 мин.
   Коды погоды — WMO 4677 (как отдаёт Open-Meteo). Торнадо модель не предсказывает: анимация «торнадо» — при порывах ≥ 25 м/с
   (ураган по шкале Бофорта — 12 баллов от 32,7 м/с, 10 баллов от 24,5 м/с), с подписью. */
(function () {
  var $ = function (s) { return document.querySelector(s); };
  var cache = {}, cur = null, on = true, preview = '';
  try { var s = JSON.parse(localStorage.getItem('klapany-wx') || '{}'); on = s.on !== undefined ? !!s.on : !(matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (x) {}
  function save() { try { localStorage.setItem('klapany-wx', JSON.stringify({ on: on })); } catch (x) {} }
  function f(v, n) { if (v === null || v === undefined || !isFinite(v)) return '—'; var k = Math.pow(10, n || 0); return String(Math.round(v * k) / k).replace('.', ',').replace(/^-/, '−'); }
  var CODE = { 0: 'ясно', 1: 'преимущественно ясно', 2: 'переменная облачность', 3: 'пасмурно', 45: 'туман', 48: 'туман с изморозью',
    51: 'слабая морось', 53: 'морось', 55: 'сильная морось', 56: 'ледяная морось', 57: 'сильная ледяная морось',
    61: 'слабый дождь', 63: 'дождь', 65: 'сильный дождь', 66: 'ледяной дождь', 67: 'сильный ледяной дождь',
    71: 'слабый снег', 73: 'снег', 75: 'сильный снег', 77: 'снежная крупа', 80: 'слабый ливень', 81: 'ливень', 82: 'сильный ливень',
    85: 'снегопад', 86: 'сильный снегопад', 95: 'гроза', 96: 'гроза с градом', 99: 'гроза с сильным градом' };
  var KINDS = [['sun', '☀️ Солнце'], ['night', '🌙 Ночь'], ['clouds', '☁️ Тучи'], ['rain', '🌧️ Дождь'], ['snow', '❄️ Снег'], ['storm', '⛈️ Гроза'], ['fog', '🌫️ Туман'], ['wind', '🍂 Ветер'], ['tornado', '🌪️ Торнадо']];
  function pick(w) {
    var c = w.weather_code, g = w.wind_gusts_10m || 0, p = w.precipitation || 0;
    if (g >= 25) return ['tornado', 1, 'порывы ' + f(g) + ' м/с — ураганный ветер (торнадо модель не предсказывает — это показ)'];
    if (c >= 95) return ['storm', Math.min(1, 0.4 + p / 10), ''];
    if ((c >= 71 && c <= 77) || c === 85 || c === 86) return ['snow', c === 75 || c === 86 ? 1 : c === 73 || c === 85 ? 0.6 : 0.3, ''];
    if ((c >= 51 && c <= 67) || (c >= 80 && c <= 82)) return ['rain', Math.min(1, 0.2 + p / 6 + (c === 65 || c === 82 ? 0.4 : 0)), ''];
    if (c === 45 || c === 48) return ['fog', 0.7, ''];
    if (g >= 12) return ['wind', Math.min(1, (g - 12) / 13), ''];
    if (c === 3) return ['clouds', 0.6, ''];
    return [w.is_day ? 'sun' : 'night', 0.5, ''];
  }
  function anim() {
    if (!window.WXFX) return;
    if (!on) { WXFX.stop(); return; }
    /* 1.36.1: день/ночь — из погоды (is_day), широта — для фазы луны в южном полушарии */
    var p = cur && window.GEO131 && GEO131.p[cur.c.r + '|' + cur.c.c], o = { day: cur && cur.w ? !!cur.w.is_day : true, lat: p ? p[0] : 50 };
    if (preview) { WXFX.play(preview, 0.8, o); return; }
    if (cur && cur.k) WXFX.play(cur.k[0], cur.k[1], o); else WXFX.stop();
  }
  function box(c, w, err) {
    var k = w ? pick(w) : null;
    cur = { c: c, w: w, k: k };
    var h = '<section class="cwx"><h3>Погода сейчас</h3>';
    if (err) h += '<p class="cnote">' + err + '</p>';
    else if (!w) h += '<p class="cnote">Загружаю…</p>';
    else h += '<div class="cnums">' +
      '<div class="cn big ' + (w.temperature_2m < 0 ? 'cold' : 'warm') + '"><small>' + (CODE[w.weather_code] || 'код ' + w.weather_code) + '</small><b>' + f(w.temperature_2m, 1) + '</b><i>°C</i></div>' +
      '<div class="cn"><small>Ощущается</small><b>' + f(w.apparent_temperature, 1) + '</b><i>°C</i></div>' +
      '<div class="cn wind"><small>Ветер / порывы</small><b>' + f(w.wind_speed_10m, 1) + ' / ' + f(w.wind_gusts_10m, 1) + '</b><i>м/с</i></div>' +
      '<div class="cn"><small>Влажность</small><b>' + f(w.relative_humidity_2m) + '</b><i>%</i></div>' +
      '<div class="cn"><small>Облачность</small><b>' + f(w.cloud_cover) + '</b><i>%</i></div>' +
      '<div class="cn"><small>Осадки</small><b>' + f(w.precipitation, 1) + '</b><i>мм</i></div></div>' +
      (k[2] ? '<p class="cnote">' + k[2] + '</p>' : '') +
      '<p class="cnote">Местное время ' + String(w.time).replace('T', ' ') + '. Источник — <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a> (CC BY 4.0): погодная модель на текущий момент, не наблюдение метеостанции и не расчётная температура для проекта.</p>';
    h += '<div class="cwxbar"><button type="button" class="cwxon' + (on ? ' on' : '') + '" data-wxon="1">Анимация: ' + (on ? 'вкл' : 'выкл') + '</button>' +
      '<span>Посмотреть:</span><div class="cchips">' + KINDS.map(function (x) { return '<button type="button" data-wxk="' + x[0] + '"' + (preview === x[0] ? ' class="on"' : '') + '>' + x[1] + '</button>'; }).join('') +
      (preview ? '<button type="button" data-wxk="">↩ как сейчас</button>' : '') + '</div></div></section>';
    var art = document.querySelector('#cview .ccard'); if (!art) return;
    var el = art.querySelector('.cwx');
    if (el) el.outerHTML = h; else art.insertAdjacentHTML('beforeend', h);
    anim();
  }
  function show(c) {
    preview = '';
    var p = window.GEO131 && GEO131.p[c.r + '|' + c.c];
    if (!p) { box(c, null, 'Нет координат пункта — погоду не показать.'); return; }
    var key = p[0].toFixed(2) + ',' + p[1].toFixed(2), hit = cache[key];
    if (hit && Date.now() - hit.t < 600000) { box(c, hit.w); return; }
    box(c, null);
    var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + p[0] + '&longitude=' + p[1] +
      '&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,weather_code,is_day,precipitation,cloud_cover&wind_speed_unit=ms&timezone=auto';
    fetch(url).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) {
      cache[key] = { t: Date.now(), w: j.current };
      if (window.CLIM && CLIM.cur() === c) box(c, j.current);
    }).catch(function () { if (window.CLIM && CLIM.cur() === c) box(c, null, 'Погода не загрузилась — нет интернета или сервис недоступен.'); });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.cwx button'); if (!b) return;
    if (b.dataset.wxon) { on = !on; save(); }
    else if (b.dataset.wxk !== undefined) { preview = b.dataset.wxk; if (preview) { on = true; save(); } }
    if (cur) box(cur.c, cur.w);
  });
  window.CLIM_WX = { show: show };
})();
