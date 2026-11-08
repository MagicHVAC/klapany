/* 1.34.0 Климатология мира (инженер 08.11.2026: «весь мир»; «сначала нормативная, потом можно переключить»).
   Россия — только СП 131 (data_sp131.js). Остальные страны: своя норма (сейчас — Украина, ДСТУ-Н Б В.1.1-27:2010),
   иначе расчёт по суточным наблюдениям NOAA GSOD 1995–2024 методикой СП 131 (_tools/world_clim/world_build.py).
   Сверка методики: Краснодар — пятидневка 0,92 −15,3 против −15 в СП 131, отопительный период 142/142 сут.
   Подключается ПОСЛЕ data_geo131.js и data_world.js, ДО clim.js: вливает пункты в SP131.cities и GEO131.p. */
(function () {
  if (!window.WORLD || !window.SP131 || !window.GEO131) return;
  var N19 = function () { var a = []; for (var i = 0; i < 19; i++) a.push(null); return a; };
  /* cold11: [сутки 0,98, 0,92, пятидн. 0,98, 0,92, абс. min, ≤0 сут, t, ≤8 сут, t, ≤10 сут, t] → раскладка СП 131 табл. 5.1 */
  function set(o, cold11, tm, wm) {
    var c = N19(); cold11 = cold11 || [];
    c[0] = cold11[0]; c[1] = cold11[1]; c[2] = cold11[2]; c[3] = cold11[3]; c[5] = cold11[4];
    for (var k = 0; k < 6; k++) c[7 + k] = cold11[5 + k];
    var w = []; for (var j = 0; j < 12; j++) w.push(null);
    if (wm) { w[3] = wm[0]; w[4] = wm[1]; }
    o.cold = c; o.warm = w; o.tm = tm || null;
  }
  WORLD.pts.forEach(function (p) {
    /* [имя, страна, lat, lon, 'n'|'s', cold11, tm13, wm2, info, alt] */
    var o = { c: p[0], r: p[1], lat: p[2], w: { k: p[4], info: p[8], alt: p[9], cur: 'n' } };
    if (p[4] === 'n') { o.w.norm = [p[5], p[6], p[7]]; set(o, p[5], p[6], p[7]); }
    else set(o, p[5], p[6], p[7]);
    SP131.cities.push(o);
    GEO131.p[o.r + '|' + o.c] = [p[2], p[3]];
  });

  function swap(c) {   /* Норма ↔ Метеостанция NOAA */
    if (!c || !c.w || c.w.k !== 'n' || !c.w.alt) return;
    c.w.cur = c.w.cur === 'n' ? 'a' : 'n';
    var s = c.w.cur === 'n' ? c.w.norm : c.w.alt;
    set(c, s[0], s[1], s[2]);
  }

  function card(c, H) {
    var f = H.f, fi = H.fi, num = H.num, sec = H.sec, esc = H.esc, v = c.cold, w = c.warm, W = c.w;
    var isN = W.k === 'n' && W.cur === 'n', info = isN ? W.info : (W.k === 'n' ? W.alt[3] : W.info);
    var lon = GEO131.p[c.r + '|' + c.c][1];
    var srcN = WORLD.src.n[c.r] || 'норма страны';
    var est = isN ? '' : ' (оценка)';
    var badge = isN ? 'Норма: ' + esc(srcN) :
      'Расчёт по метеостанции NOAA «' + esc(info[1]) + '»: ' + info[0] + ' зим 1995–2024' + (info[0] < 20 ? ' (меньше 20 — точность ниже)' : '') + ', методика СП 131 — не нормативный документ';
    var tog = W.k === 'n' ? (W.alt ? '<div class="cchips cwsw"><button type="button" data-wsw="1"' + (isN ? ' class="on"' : '') + '>Норма</button><button type="button" data-wsw="1"' + (isN ? '' : ' class="on"') + '>Метеостанция NOAA</button></div>' :
      '<p class="cnote">Второго набора нет: рядом нет станции NOAA с рядом 20 лет и больше.</p>') : '';
    var unread = isN && W.info[3] && W.info[3].length ? '<p class="cnote">В тексте ДСТУ (распознанный скан) не читается: ' + W.info[3].map(function (k) { return { hp8_n: 'продолжительность ≤ 8 °C', hp8_t: 'средняя t ≤ 8 °C', hp10_n: 'продолжительность ≤ 10 °C', hp10_t: 'средняя t ≤ 10 °C' }[k]; }).join(', ') + ' — значение не подставлено.</p>' : '';
    var coldH = '<div class="cnums">' +
      num('Пятидневка 0,92', f(v[3], 0), '°C', 'cold big', 'Наиболее холодная пятидневка обеспеченностью 0,92 — параметры Б холодного периода') +
      num('Пятидневка 0,98' + est, f(v[2], 0), '°C', 'cold', isN ? '' : 'Для 0,98 ряда 30 лет мало: на Краснодаре расчёт холоднее СП 131 на 2,5 °C') +
      num('Сутки 0,98' + est, f(v[0], 0), '°C', 'cold') + num('Сутки 0,92', f(v[1], 0), '°C', 'cold') +
      num('Абсолютный минимум', f(v[5], 0), '°C', 'cold') + '</div>' +
      '<div class="tscroll"><table class="ct"><thead><tr><th>Период со среднесуточной t</th><th>Продолжительность, сут</th><th>Средняя t, °C</th></tr></thead><tbody>' +
      [['≤ 0 °C', 7], ['≤ 8 °C — отопительный (жилые, общественные)', 9], ['≤ 10 °C — ДОО, школы, медицинские, интернаты', 11]].map(function (p) { return '<tr><td>' + p[0] + '</td><td>' + fi(v[p[1]]) + '</td><td>' + f(v[p[1] + 1]) + '</td></tr>'; }).join('') +
      '</tbody></table></div>' + unread +
      (v[9] === 0 ? '<p class="cnote">Среднесуточная температура не опускается до 8 °C — отопительного периода по СП 50 нет.</p>' : '');
    var warmH = isN ? '<p class="cnote">Графы тёплого периода ДСТУ не перенесены: их шапка в скане распознана неуверенно. Переключи на «Метеостанция NOAA».</p>' : '<div class="cnums">' + num('Средняя максимальная тёплого месяца', f(w[3]), '°C', 'warm') + num('Абсолютный максимум', f(w[4], 0), '°C', 'warm') + '</div>' +
      '<p class="cnote">Обеспеченности 0,95 и 0,98 тёплого периода (параметры А и Б) считаются по срочным наблюдениям — по суточным данным их честно не получить, поэтому не показаны.</p>';
    var tm = c.tm, M = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    var monH = tm ? '<div class="tscroll"><table class="ct cmon"><thead><tr><th></th>' + M.map(function (m) { return '<th>' + m + '</th>'; }).join('') + '<th>Год</th></tr></thead><tbody><tr><th>Средняя t, °C</th>' +
      tm.map(function (x) { return '<td>' + f(x) + '</td>'; }).join('') + '</tr></tbody></table></div>' :
      '<p class="cnote">Месячные средние в тексте ДСТУ испорчены распознаванием скана — не перенесены. Переключи на «Метеостанция NOAA».</p>';
    var meth = isN ? '<p class="csrc">' + esc(srcN) + '. Перенесены графы холодного периода и отопительного периода; каждая строка проверена физикой (0,98 не теплее 0,92, период ≤ 8 °C не длиннее ≤ 10 °C).</p>' :
      '<p class="csrc">' + esc(WORLD.src.noaa) + '. Пятидневка и сутки — минимум за каждую зиму, обеспеченность по ряду зим; отопительный период — по сглаженному среднему ходу температуры. Сверено с СП 131 на Краснодаре и Москве: 0,92 и отопительный период — в пределах 1–2 °C и нескольких суток; 0,98 — оценка.</p>';
    return '<article class="ccard"><header><div><h2>' + esc(c.c) + '</h2><p>' + esc(c.r) + ' · ' + f(c.lat) + '°, ' + f(lon) + '°' + (info && info[2] !== null && info[2] !== undefined ? ' · ' + fi(info[2]) + ' м' : '') + '</p></div>' +
      '<div class="chero"><span class="cold">' + f(v[3], 0) + '°</span><small>зима 0,92</small>' + (w[4] !== null && w[4] !== undefined ? '<span class="warm">' + f(w[4], 0) + '°</span><small>абс. max</small>' : '<span class="warm">' + fi(v[9]) + '</span><small>сут ≤ 8 °C</small>') + '</div></header>' +
      '<p class="cwbadge' + (isN ? ' n' : '') + '">' + badge + '</p>' + tog +
      sec('c-gsop', 'ГСОП, отопительный период, Rтр', 'СП 50.13330.2024 п. 5.2, табл. 3', '<div id="cl-g">' + H.gsop(c) + '</div>', true) +
      sec('c-cold', 'Холодный период', isN ? 'ДСТУ-Н Б В.1.1-27:2010' : 'NOAA GSOD, методика СП 131', coldH, true) +
      sec('c-warm', 'Тёплый период', isN ? '—' : 'NOAA GSOD', warmH, false) +
      sec('c-mon', 'Средняя температура по месяцам', isN ? 'ДСТУ' : 'NOAA GSOD 1995–2024', monH, false) + meth + '</article>';
  }
  window.CLIM_W = { card: card, swap: swap, n: WORLD.pts.length };
})();
