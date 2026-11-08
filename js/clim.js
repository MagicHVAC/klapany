/* 1.29.0 Страница «Климатология» (clim.html): поиск пункта, все таблицы СП 131.13330.2025 по нему, параметры А и Б (табл. 16.1),
   помесячный график, ГСОП и Rтр по СП 50.13330.2024 под тип здания и принятую tв (расчёты — js/clim_calc.js).
   Выбор пункта, типа здания и tв запоминается в браузере (только удобство). */
(function () {
  var $ = function (s) { return document.querySelector(s); };
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function f(v, n) { if (v === null || v === undefined || !isFinite(v)) return '—'; var k = Math.pow(10, n === undefined ? 1 : n); return String(Math.round(v * k) / k).replace('.', ',').replace(/^-/, '−'); }
  function fi(v) { return f(v, 0); }
  var C = SP131.cities, M = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  var MN = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  var st = { c: null, bt: 'res', tv: 20 };
  try { var sv = JSON.parse(localStorage.getItem('klapany-clim') || '{}'); if (sv.bt) st.bt = sv.bt; if (isFinite(sv.tv)) st.tv = sv.tv; st.cn = sv.cn; } catch (x) {}
  function save() { try { localStorage.setItem('klapany-clim', JSON.stringify({ bt: st.bt, tv: st.tv, cn: st.c ? st.c.r + '|' + st.c.c : '' })); } catch (x) {} }

  /* поиск: регистр, ё/е, английская раскладка */
  var EN = 'qwertyuiop[]asdfghjkl;\'zxcvbnm,.`', RU = 'йцукенгшщзхъфывапролджэячсмитьбюё';
  function norm(s) { s = String(s).toLowerCase(); var o = ''; for (var i = 0; i < s.length; i++) { var k = EN.indexOf(s[i]); o += k >= 0 ? RU[k] : s[i]; } return o.replace(/ё/g, 'е').replace(/[^а-яa-z0-9]/g, ''); }
  C.forEach(function (c) { c._n = norm(c.c); c._r = norm(c.r); });
  function find(q) {
    var n = norm(q); if (!n) return [];
    var a = [], b = [], d = [];
    C.forEach(function (c) { if (c._n.indexOf(n) === 0) a.push(c); else if (c._n.indexOf(n) > 0) b.push(c); else if (c._r.indexOf(n) >= 0) d.push(c); });
    return a.concat(b, d);
  }

  function num(label, v, unit, cls, hint) {
    return '<div class="cn' + (cls ? ' ' + cls : '') + '"' + (hint ? ' title="' + esc(hint) + '"' : '') + '><small>' + label + '</small><b>' + v + '</b>' + (unit ? '<i>' + unit + '</i>' : '') + '</div>';
  }
  function sec(id, title, src, body, open) {
    return '<details class="csec" id="' + id + '"' + (open ? ' open' : '') + '><summary><span>' + title + '</span><em>' + src + '</em></summary><div class="cbody">' + body + '</div></details>';
  }

  function cold(c) {
    var v = c.cold;
    return '<div class="cnums">' +
      num('Пятидневка 0,92', f(v[3], 0), '°C', 'cold big', 'Температура наиболее холодной пятидневки обеспеченностью 0,92 — параметры Б холодного периода (табл. 16.1); по СП 60.13330.2020 п. 5.13 Б — отопление и вентиляция зимой') +
      num('Пятидневка 0,98', f(v[2], 0), '°C', 'cold') + num('Сутки 0,98', f(v[0], 0), '°C', 'cold') + num('Сутки 0,92', f(v[1], 0), '°C', 'cold') +
      num('Обеспеченность 0,94', f(v[4], 0), '°C', 'cold', 'Параметры А холодного периода (табл. 16.1)') + num('Абсолютный минимум', f(v[5], 0), '°C', 'cold') +
      num('Амплитуда холодного месяца', f(v[6]), '°C') + '</div>' +
      '<div class="tscroll"><table class="ct"><thead><tr><th>Период со среднесуточной t</th><th>Продолжительность, сут</th><th>Средняя t, °C</th></tr></thead><tbody>' +
      [['≤ 0 °C', 7], ['≤ 8 °C — отопительный (жилые, общественные)', 9], ['≤ 10 °C — ДОО, школы, медицинские, интернаты', 11]].map(function (p) { return '<tr><td>' + p[0] + '</td><td>' + fi(v[p[1]]) + '</td><td>' + f(v[p[1] + 1]) + '</td></tr>'; }).join('') +
      '</tbody></table></div><div class="cnums">' +
      num('Влажность холодного месяца', fi(v[13]), '%') + num('Влажность в 15 ч', fi(v[14]), '%') + num('Осадки ноябрь–март', fi(v[15]), 'мм') +
      num('Ветер дек–фев, преобл.', esc(v[16] || '—'), '') + num('Ветер январь, макс. из средних по румбам', f(v[17]), 'м/с', 'wind') + num('Ветер за период ≤ 8 °C', f(v[18]), 'м/с', 'wind') + '</div>';
  }
  function warm(c) {
    var w = c.warm, a8 = SP131.amp8[c.c + ' (' + c.r + ')'];
    return '<div class="cnums">' +
      num('Обеспеченность 0,95', f(w[1], 0), '°C', 'warm big', 'Параметры А тёплого периода (табл. 16.1)') + num('Обеспеченность 0,98', f(w[2], 0), '°C', 'warm', 'Параметры Б тёплого периода') +
      num('Средняя максимальная тёплого месяца', f(w[3]), '°C', 'warm') + num('Абсолютный максимум', f(w[4], 0), '°C', 'warm') + num('Амплитуда тёплого месяца', f(w[5]), '°C') +
      (a8 ? num('Макс. амплитуда июля (табл. 8.1)', f(a8), '°C') : '') + num('Барометрическое давление', fi(w[0]), 'гПа') +
      num('Влажность тёплого месяца', fi(w[6]), '%') + num('Влажность в 15 ч', fi(w[7]), '%') + num('Осадки апрель–октябрь', fi(w[8]), 'мм') + num('Суточный максимум осадков', fi(w[9]), 'мм') +
      num('Ветер июнь–авг, преобл.', esc(w[10] || '—'), '') + num('Ветер июль, мин. из средних по румбам', f(w[11]), 'м/с', 'wind') + '</div>';
  }
  /* табл. 16.1: параметры А и Б */
  function ab(c) {
    var v = c.cold, w = c.warm, P = w[0], ent = null;
    SP131.ent.forEach(function (e) { if (norm(e[0]) === c._n) ent = e; });
    var eA = clEnth(v[4], v[14], P), eB = clEnth(v[3], v[14], P), vc = Math.max(v[17] || 0, 1), vw = Math.max(w[11] || 0, 1);
    var row = function (p, t, i, vv, amp, cls) { return '<tr class="' + cls + '"><td>' + p + '</td><td>' + t + '</td><td>' + i + '</td><td>' + vv + '</td><td>' + amp + '</td></tr>'; };
    return '<div class="tscroll"><table class="ct"><thead><tr><th>Период, параметры</th><th>t, °C</th><th>Энтальпия, кДж/кг</th><th>Ветер, м/с</th><th>Амплитуда, °C</th></tr></thead><tbody>' +
      row('Тёплый, А', f(w[1], 0), 'по карте, рис. А.5, А.7', f(vw), f(w[5]), 'warm') +
      row('Тёплый, Б', f(w[2], 0), ent ? f(ent[1]) + ' (табл. 16.2)' : 'по карте, рис. А.6, А.8', f(vw), f(w[5]), 'warm') +
      row('Холодный, А', f(v[4], 0), f(eA.i) + '*', f(vc), f(v[6]), 'cold') +
      row('Холодный, Б', f(v[3], 0), f(eB.i) + '*', f(vc), f(v[6]), 'cold') +
      '</tbody></table></div>' +
      (ent ? '<p class="cnote">Табл. 16.2: влагосодержание наружного воздуха в тёплый период — ' + f(ent[2]) + ' г/кг.</p>' : '') +
      '<p class="cnote">По СП 60.13330.2020, п. 5.13: параметры А — вентиляция летом; Б — отопление и вентиляция зимой, кондиционирование. Ветер — не менее 1 м/с (табл. 16.1). Давление ' + fi(P) + ' гПа (табл. 6.1). * Зимняя энтальпия — «по расчёту… по i-d–диаграмме» при φ в 15 ч холодного месяца ' + fi(v[14]) + ' %: расчёт справочника (давление насыщения по Магнусу) — сверь с i-d–диаграммой.</p>';
  }
  /* помесячно: график t и осадков + таблица */
  function months(c) {
    var t = c.tm, p = c.prec, W = 560, H = 190, x0 = 34, x1 = W - 34, y0 = 16, y1 = H - 24, tmin = Math.min.apply(null, t.slice(0, 12).concat([0])), tmax = Math.max.apply(null, t.slice(0, 12).concat([0]));
    tmin = Math.floor(tmin / 5) * 5; tmax = Math.ceil(tmax / 5) * 5; if (tmax === tmin) tmax += 5;
    var pmax = Math.max.apply(null, p.slice(0, 12).concat([10])), dx = (x1 - x0) / 12, Y = function (v) { return y1 - (v - tmin) / (tmax - tmin) * (y1 - y0); };
    var g = '<svg class="csvg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Средняя месячная температура и осадки">';
    for (var v = tmin; v <= tmax; v += 5) g += '<line class="cgl' + (v === 0 ? ' z' : '') + '" x1="' + x0 + '" x2="' + x1 + '" y1="' + Y(v) + '" y2="' + Y(v) + '"/><text class="ctx" x="' + (x0 - 4) + '" y="' + (Y(v) + 3) + '" text-anchor="end">' + f(v, 0) + '</text>';
    for (var i = 0; i < 12; i++) {
      var bh = p[i] / pmax * (y1 - y0) * 0.5;
      g += '<rect class="cbar" x="' + (x0 + i * dx + dx * 0.22) + '" y="' + (y1 - bh) + '" width="' + (dx * 0.56) + '" height="' + bh + '"><title>' + MN[i] + ': осадки ' + fi(p[i]) + ' мм</title></rect>';
      g += '<text class="ctx" x="' + (x0 + i * dx + dx / 2) + '" y="' + (H - 8) + '" text-anchor="middle">' + MN[i] + '</text>';
    }
    g += '<polyline class="cline" points="' + t.slice(0, 12).map(function (v, i) { return (x0 + i * dx + dx / 2) + ',' + Y(v); }).join(' ') + '"/>';
    t.slice(0, 12).forEach(function (v, i) { g += '<circle class="cdot ' + (v < 0 ? 'cold' : 'warm') + '" cx="' + (x0 + i * dx + dx / 2) + '" cy="' + Y(v) + '" r="3.5"><title>' + MN[i] + ': ' + f(v) + ' °C</title></circle>'; });
    g += '<text class="ctx" x="' + x0 + '" y="10">°C — линия, осадки — столбики (до ' + fi(pmax) + ' мм)</text></svg>';
    var rows = [['Температура, °C (табл. 7.1)', c.tm, 1], ['Амплитуда средняя / макс., °C (табл. 9.1)', c.amp, 'a'], ['Осадки, мм (табл. 10.1)', c.prec, 0], ['Парциальное давление пара, гПа (табл. 11.1)', c.pv, 1], ['Скорость ветра, м/с (табл. 12.1)', c.wind, 1]];
    return g + '<div class="tscroll"><table class="ct cmon"><thead><tr><th></th>' + M.map(function (m) { return '<th>' + m + '</th>'; }).join('') + '<th>Год</th></tr></thead><tbody>' +
      rows.map(function (r) {
        return '<tr><th>' + r[0] + '</th>' + (r[2] === 'a' ? r[1].map(function (x) { return '<td>' + f(x[0]) + '<br><small>' + f(x[1]) + '</small></td>'; }).join('') + '<td></td>' :
          r[1].map(function (x) { return '<td>' + f(x, r[2]) + '</td>'; }).join('')) + '</tr>';
      }).join('') + '</tbody></table></div>';
  }
  /* ГСОП, сутки, Rтр — СП 50.13330.2024 */
  function gsop(c) {
    var bt = CL_BT.filter(function (b) { return b[0] === st.bt; })[0] || CL_BT[0], r = clGsop(c, bt, st.tv);
    var h = '<div class="cform"><label>Тип здания<select id="cl-bt">' + CL_BT.map(function (b) { return '<option value="' + b[0] + '"' + (b[0] === bt[0] ? ' selected' : '') + '>' + b[1] + '</option>'; }).join('') + '</select></label>' +
      '<label>tв принятая, °C<input id="cl-tv" type="number" step="0.5" inputmode="decimal" value="' + st.tv + '"></label>' +
      '<div class="cchips">' + [16, 18, 20, 21, 22, 24].map(function (t) { return '<button type="button" data-tv="' + t + '"' + (t === st.tv ? ' class="on"' : '') + '>' + t + '</button>'; }).join('') + '</div></div>' +
      '<p class="cnote">tв по п. 5.2 СП 50: жилые, гостиницы, общежития и группа 1.2 — по минимальным оптимальным температурам ГОСТ 30494; общественные — по классификации помещений ГОСТ 30494; производственные — по нормам проектирования зданий.</p>';
    if (!r) return h + '<p class="cnote">Для этого пункта в СП 131 нет данных периода ≤ ' + bt[3] + ' °C.</p>';
    var cat = bt[2];
    h += '<div class="cnums">' + num('ГСОП', fi(r.g), '°C·сут/год', 'big acc', 'ГСОП = (tв − tот)·zот, СП 50.13330.2024 ф. (5.2)') +
      num('zот — отопительный период', fi(r.z), 'сут', 'acc') + num('tот — средняя за период', f(r.t), '°C', 'cold') +
      num('Период', '≤ ' + r.per + ' °C', '', '', r.per === 10 ? 'ДОО, общеобразовательные, медицинские, дома-интернаты — п. 5.2 СП 50' : 'жилые и общественные — п. 5.2 СП 50') + '</div>' +
      '<p class="cform-f">ГСОП = (' + f(st.tv) + ' − (' + f(r.t) + ')) × ' + fi(r.z) + ' = <b>' + fi(r.g) + '</b> °C·сут/год — СП 50.13330.2024, п. 5.2, ф. (5.2)</p>' +
      '<h4 class="ch4">Базовое Rтр, м²·°C/Вт — СП 50.13330.2024, табл. 3, категория ' + cat + ' (' + CL_CAT.filter(function (x) { return x[0] === cat; })[0][1] + ')</h4>' +
      '<div class="tscroll"><table class="ct"><thead><tr><th>Конструкция</th><th>Rтр</th><th>Как получено</th></tr></thead><tbody>' +
      CL_COLS.map(function (n, j) { var x = clRtr(cat, j, r.g); return '<tr><td>' + n + '</td><td><b>' + f(x.v, 2) + '</b></td><td class="chow">' + x.how + '</td></tr>'; }).join('') +
      '</tbody></table></div><p class="cnote">Rнорм = Rтр·mp (ф. 5.1); mp = 1, снижение — только при выполнении п. 10.1 (не менее 0,63 для стен, 1,0 для светопрозрачных, 0,8 для остальных).</p>';
    var other = [8, 10].map(function (p) { var b = p === 10 ? CL_BT[2] : CL_BT[0], x = clGsop(c, b, st.tv); return x ? '≤ ' + p + ' °C: ' + fi(x.z) + ' сут, ' + f(x.t) + ' °C → ГСОП ' + fi(x.g) : ''; }).join(' · ');
    return h + '<p class="cnote">При tв ' + f(st.tv) + ' °C: ' + other + '.</p>';
  }

  function card(c) {
    var lat = c.lat ? ' · ' + f(c.lat) + '° с. ш.' : '';
    return '<article class="ccard"><header><div><h2>' + esc(c.c) + '</h2><p>' + esc(c.r) + lat + '</p></div>' +
      '<div class="chero"><span class="cold">' + f(c.cold[3], 0) + '°</span><small>зима 0,92</small><span class="warm">' + f(c.warm[1], 0) + '°</span><small>лето 0,95</small></div></header>' +
      sec('c-gsop', 'ГСОП, отопительный период, Rтр', 'СП 50.13330.2024 п. 5.2, табл. 3', '<div id="cl-g">' + gsop(c) + '</div>', true) +
      sec('c-cold', 'Холодный период', 'СП 131 табл. 5.1', cold(c), true) +
      sec('c-warm', 'Тёплый период', 'СП 131 табл. 6.1, 8.1', warm(c), true) +
      sec('c-ab', 'Параметры А и Б для ОВиК', 'СП 131 табл. 16.1, 16.2', ab(c), false) +
      sec('c-mon', 'По месяцам: температура, амплитуда, осадки, пар, ветер', 'СП 131 табл. 7.1, 9.1–12.1', months(c), false) +
      '<p class="csrc">' + esc(SP131.src) + '. Широта — из базы кнопки 7: точная для известных пунктов, иначе по центру региона.</p></article>';
  }

  function show(c) {
    st.c = c; save();
    $('#cres').innerHTML = ''; $('#cq').value = c.c;
    $('#cview').innerHTML = card(c);
    try { history.replaceState(null, '', '#' + encodeURIComponent(c.c)); } catch (x) {}
  }
  function list(q) {
    var r = find(q).slice(0, 40);
    $('#cres').innerHTML = q ? (r.length ? r.map(function (c, i) { return '<button type="button" data-i="' + C.indexOf(c) + '"><b>' + esc(c.c) + '</b><small>' + esc(c.r) + '</small><i class="cold">' + f(c.cold[3], 0) + '°</i></button>'; }).join('') :
      '<p class="cnote">Не нашёл. В СП 131 — ' + C.length + ' пунктов. По п. 4.1 СП 131 при отсутствии данных допускается принимать ближайший репрезентативный пункт в местности с аналогичными условиями; для прибрежных районов морей и крупных водохранилищ, местности выше 500 м и пунктов дальше 100 км от метеостанции — данные территориального управления Росгидромета (с учётом прил. Б).</p>') : '';
  }

  $('#cq').addEventListener('input', function (e) { list(e.target.value); });
  $('#cq').addEventListener('keydown', function (e) { if (e.key === 'Enter') { var r = find(e.target.value); if (r.length) show(r[0]); } });
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button'); if (!b) return;
    if (b.dataset.i) show(C[+b.dataset.i]);
    else if (b.dataset.tv) { st.tv = +b.dataset.tv; save(); $('#cl-g').innerHTML = gsop(st.c); }
    else if (b.dataset.city) { var r = find(b.dataset.city); if (r.length) show(r[0]); }
  });
  document.addEventListener('change', function (e) {
    if (e.target.id === 'cl-bt') { st.bt = e.target.value; save(); $('#cl-g').innerHTML = gsop(st.c); }
  });
  document.addEventListener('input', function (e) {
    if (e.target.id === 'cl-tv') { var v = parseFloat(String(e.target.value).replace(',', '.')); if (isFinite(v)) { st.tv = v; save(); var box = $('#cl-g'), pos = e.target.selectionStart; box.innerHTML = gsop(st.c); var ni = $('#cl-tv'); ni.focus(); try { ni.setSelectionRange(pos, pos); } catch (x) {} } }
  });

  /* старт: из адреса, из запомненного, иначе Краснодар */
  var h = decodeURIComponent(location.hash.slice(1)), first = null;
  if (h) first = find(h)[0];
  if (!first && st.cn) first = C.filter(function (c) { return c.r + '|' + c.c === st.cn; })[0];
  if (!first) first = find('Краснодар')[0];
  $('#cex').innerHTML = 'Например: ' + ['Москва', 'Санкт-Петербург', 'Краснодар', 'Новосибирск', 'Якутск', 'Сочи'].map(function (n) { return '<button type="button" data-city="' + n + '">' + n + '</button>'; }).join('');
  if (first) show(first);
  if (window.APP) $('#ver').textContent = 'v' + APP.ver + ' · ' + APP.date + ' · ' + APP.author;
  if (window.NEWS) $('#news').innerHTML = NEWS.slice(0, 12).map(function (n) { return '<p><b>' + n.v + '</b> ' + n.d + '<br>' + esc(n.t) + '</p>'; }).join('');
  document.addEventListener('click', function (e) { if (e.target.id === 'newsbtn') $('#newsdlg').showModal(); else if (e.target.id === 'newsclose') $('#newsdlg').close(); });
  if ('serviceWorker' in navigator && location.protocol === 'https:') {   /* как в vent.js: офлайн и перезагрузка на новую версию */
    var had = !!navigator.serviceWorker.controller, done = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () { if (had && !done) { done = true; location.reload(); } });
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(function (r) { r.update(); }).catch(function () {});
  }
})();
