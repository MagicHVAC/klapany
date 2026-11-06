/* Число дымоприёмных устройств (ДПУ) и расстояние между ними: СП 7.13130.2013 с Изм. № 3 (с 01.07.2025),
   прил. Е (формулы Е.1, Е.2), п. 7.8 (коридоры: 45/30/20 м на ДПУ), п. 7.9 (помещения: ≤ 500 м² на ДПУ, зоны ≤ 3000 м²),
   п. 7.4 (температура дыма — только расчётом). Формулы сверены по изображениям официального текста (meganorm), 06.11.2026.
   ρ = 353/T — допущение справочника (уравнение состояния для воздуха), в СП 7 не приведено. */
var DPU_CORR = [['45', 'прямолинейный — до 45 м на 1 ДПУ'], ['30', 'угловой — до 30 м'], ['20', 'кольцевой, замкнутый — до 20 м']];

function dpuF(id, label, val, step, hint) {
  return '<div class="stf"><label for="' + id + '">' + label + '</label><input id="' + id + '" type="number" step="' + (step || 'any') + '" value="' + val + '" inputmode="decimal">' + (hint ? '<small class="dhint">' + hint + '</small>' : '') + '</div>';
}
function dpuS(id, label, opts, v) {
  return '<div class="stf"><label for="' + id + '">' + label + '</label><select id="' + id + '">' + opts.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === v ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div>';
}
function dpuBlock() {
  return '<p class="sub">Экспертиза просит число ДПУ на схеме — вот расчёт по приложению Е СП 7 с проверкой пп. 7.8 и 7.9. Расход и температуру дыма берёшь из своего расчёта по п. 7.4.</p>' +
    '<div class="trpick stpick">' +
    dpuS('dp-k', 'Что защищаем', [['room', 'помещение'], ['corr', 'коридор']], 'room') +
    '<div class="stf" id="dp-geo-r">' + '<label for="dp-a">Площадь помещения или дымовой зоны, м²</label><input id="dp-a" type="number" step="any" value="1200" inputmode="decimal"></div>' +
    '<div class="stf" id="dp-geo-c" hidden><label for="dp-l">Длина коридора, м</label><input id="dp-l" type="number" step="any" value="50" inputmode="decimal"></div>' +
    '<div class="stf" id="dp-geo-c2" hidden><label for="dp-cf">Конфигурация коридора</label><select id="dp-cf">' + DPU_CORR.map(function (o) { return '<option value="' + o[0] + '">' + o[1] + '</option>'; }).join('') + '</select></div>' +
    dpuS('dp-gm', 'Расход дыма задаю', [['g', 'массой Gsm, кг/с'], ['l', 'объёмом при Tsm, м³/ч']], 'g') +
    dpuF('dp-g', 'Gsm, кг/с — из расчёта', '6.5', 'any', 'пример, замени своим') +
    dpuF('dp-ts', 'Tsm — средняя температура дымового слоя, °C', '300', 'any', 'только из расчёта, п. 7.4') +
    dpuF('dp-tr', 'Tr — воздух в помещении до пожара, °C', '20', 'any') +
    dpuF('dp-ro', 'ρsm, кг/м³ — пусто: 353/Tsm', '', 'any', 'допущение справочника') +
    dpuS('dp-sh', 'Сечение ДПУ', [['rect', 'прямоугольное'], ['round', 'круглое']], 'rect') +
    dpuF('dp-w', 'Ширина или диаметр, мм', '600', '1') +
    dpuF('dp-h', 'Высота, мм (для прямоугольного)', '400', '1') +
    dpuS('dp-or', 'Расположение', [['h', 'горизонтально — на потолке, снизу воздуховода'], ['v', 'вертикально — в стенке шахты, воздуховода']], 'h') +
    dpuF('dp-wd', 'От оси ДПУ до стены или перегородки, м', '1.5', 'any') +
    dpuF('dp-hd', 'Низ ДПУ от пола, м', '4.2', 'any') +
    dpuF('dp-y', 'Низ дымового слоя от пола, м — из расчёта', '2.5', 'any') +
    dpuF('dp-door', 'Верх дверей эвакуационных выходов, м', '2.1', 'any') +
    '</div><div class="barres stres" id="dp-res"></div>' +
    '<div class="stanim" id="dp-anim"></div>' +
    '<div class="dpbtns"><button type="button" class="eibtn on" id="dp-doc">Скачать расчёт в Word</button></div>' +
    '<details class="issue dpf"><summary>Формулы и обозначения</summary><div><p>Е.1: V<sub>max</sub> = 4,16 · γ · d<sup>5/2</sup> · ((T<sub>sm</sub> − T<sub>r</sub>) / T<sub>r</sub>)<sup>1/2</sup>, м³/с — наибольший расход через 1 ДПУ.</p>' +
    '<p>γ = 1,0 — горизонтальное ДПУ на расстоянии от оси до стены не меньше 2D; 0,5 — в остальных случаях, включая вертикальное. D — эквивалентный гидравлический диаметр ДПУ: для прямоугольного 2ab/(a + b).</p>' +
    '<p>d — от нижней границы дымового слоя до низа ДПУ, м; всегда d ≥ 2D.</p><p>N<sub>min</sub> = G<sub>sm</sub> / (ρ<sub>sm</sub> · V<sub>max</sub>), округлять вверх.</p><p>Е.2: L<sub>min</sub> = 0,9 · V<sub>max</sub><sup>1/2</sup>, м — наименьшее расстояние между ДПУ.</p>' +
    '<p>Температуры в формулах — в кельвинах. Принятое число — большее из N<sub>min</sub> и числа по п. 7.8 или 7.9.</p></div></details>' +
    refs([['sp7', 'прил. Е'], ['sp7', '7.8'], ['sp7', '7.9'], ['sp7', '7.4']]);
}
function dpuNum(id) { var e = $('#' + id); if (!e) return NaN; var s = String(e.value).replace(',', '.').trim(); return s === '' ? NaN : parseFloat(s); }
function dpuFmt(v, n) { if (!isFinite(v)) return '—'; var k = Math.pow(10, n === undefined ? 2 : n); return (Math.round(v * k) / k).toString().replace('.', ','); }

function dpuCompute() {
  var r = { k: $('#dp-k').value, A: dpuNum('dp-a'), L: dpuNum('dp-l'), lim: +$('#dp-cf').value, gm: $('#dp-gm').value, G0: dpuNum('dp-g'),
    ts: dpuNum('dp-ts'), tr: dpuNum('dp-tr'), ro0: dpuNum('dp-ro'), sh: $('#dp-sh').value, a: dpuNum('dp-w') / 1000, b: dpuNum('dp-h') / 1000,
    or: $('#dp-or').value, wd: dpuNum('dp-wd'), hd: dpuNum('dp-hd'), y: dpuNum('dp-y'), door: dpuNum('dp-door'), err: [], warn: [] };
  r.Ts = r.ts + 273.15; r.Tr = r.tr + 273.15;
  r.D = r.sh === 'round' ? r.a : 2 * r.a * r.b / (r.a + r.b);
  r.gamma = (r.or === 'h' && r.wd >= 2 * r.D) ? 1 : 0.5;
  r.d = r.hd - r.y;
  r.ro = isFinite(r.ro0) && r.ro0 > 0 ? r.ro0 : 353 / r.Ts; r.roAuto = !(isFinite(r.ro0) && r.ro0 > 0);
  r.G = r.gm === 'l' ? r.G0 * r.ro / 3600 : r.G0;
  if (!(r.Ts > r.Tr)) r.err.push('Tsm должна быть выше Tr — иначе формула Е.1 не работает.');
  if (!(r.d > 0)) r.err.push('Низ ДПУ должен быть выше нижней границы дымового слоя: d = ' + dpuFmt(r.d) + ' м.');
  else if (r.d < 2 * r.D) r.err.push('Не выполнено d ≥ 2D: d = ' + dpuFmt(r.d) + ' м, 2D = ' + dpuFmt(2 * r.D) + ' м. Уменьши сечение ДПУ или подними его выше дымового слоя.');
  if (isFinite(r.door) && r.hd < r.door) r.err.push('ДПУ ниже верха дверей эвакуационных выходов — нельзя (пп. 7.8, 7.9).');
  r.Vmax = 4.16 * r.gamma * Math.pow(Math.max(r.d, 0), 2.5) * Math.sqrt(Math.max(r.Ts - r.Tr, 0) / r.Tr);
  r.Nmin = r.Vmax > 0 ? Math.ceil(r.G / (r.ro * r.Vmax) - 1e-9) : NaN;
  r.Lmin = 0.9 * Math.sqrt(r.Vmax);
  if (r.k === 'room') {
    r.Ngeo = Math.ceil(r.A / 500 - 1e-9); r.geoTxt = 'п. 7.9: не больше 500 м² на 1 ДПУ — ' + dpuFmt(r.A, 1) + ' / 500';
    if (r.A > 3000) r.warn.push('Площадь больше 3000 м²: помещение делят на дымовые зоны до 3000 м² каждая, расчёт — на зону (п. 7.9). Условное деление при механической вытяжке — только если Tsm выше Tr на 20 °C и больше.');
  } else {
    r.Ngeo = Math.ceil(r.L / r.lim - 1e-9); r.geoTxt = 'п. 7.8: не больше ' + r.lim + ' м коридора на 1 ДПУ — ' + dpuFmt(r.L, 1) + ' / ' + r.lim;
    if (r.L > 60) r.warn.push('Коридор длиннее 60 м: расход считают для каждого коридора длиной не больше 60 м (п. 7.4 а).');
  }
  r.N = Math.max(r.Nmin || 0, r.Ngeo || 0);
  r.Vone = r.N ? r.G / r.ro / r.N : NaN;
  if (r.k === 'corr' && r.N > 1 && r.L / r.N < r.Lmin) r.warn.push('На длине ' + dpuFmt(r.L, 1) + ' м при ' + r.N + ' ДПУ шаг ' + dpuFmt(r.L / r.N) + ' м меньше Lmin = ' + dpuFmt(r.Lmin) + ' м. Проверь расстановку или уменьши расход на ДПУ.');
  if (r.ts - r.tr < 20 && r.k === 'room' && r.A > 3000) r.warn.push('Tsm − Tr меньше 20 °C — условно делить на зоны нельзя, только конструктивно (п. 7.9).');
  return r;
}
function dpuCalc() {
  if (!$('#dp-k')) return;
  var corr = $('#dp-k').value === 'corr';
  $('#dp-geo-r').hidden = corr; $('#dp-geo-c').hidden = !corr; $('#dp-geo-c2').hidden = !corr;
  $('#dp-h').parentNode.hidden = $('#dp-sh').value === 'round';
  $('#dp-wd').parentNode.hidden = $('#dp-or').value === 'v';
  $('#dp-g').previousSibling.textContent = $('#dp-gm').value === 'l' ? 'Расход дыма при Tsm, м³/ч — из расчёта' : 'Gsm, кг/с — из расчёта';
  var r = dpuCompute(), c = function (k, v, s, cl) { return '<div class="bstep' + (cl ? ' ' + cl : '') + '"><span>' + k + '</span><b>' + v + '</b>' + (s ? '<small>' + s + '</small>' : '') + '</div>'; };
  var h = '';
  if (r.err.length) h += r.err.map(function (e) { return c('Ошибка исходных данных', 'Пересмотри', e, 'warn'); }).join('');
  else {
    h += c('Принять ДПУ', r.N + ' шт.', 'Большее из Nmin = ' + r.Nmin + ' (прил. Е) и ' + r.Ngeo + ' (' + (r.k === 'room' ? 'п. 7.9' : 'п. 7.8') + ').', 'final');
    h += c('Vmax на 1 ДПУ, Е.1', dpuFmt(r.Vmax) + ' м³/с', 'γ = ' + dpuFmt(r.gamma, 1) + ', d = ' + dpuFmt(r.d) + ' м, D = ' + dpuFmt(r.D, 3) + ' м. Это ' + dpuFmt(r.Vmax * 3600, 0) + ' м³/ч.');
    h += c('Шаг между ДПУ, Е.2', 'не меньше ' + dpuFmt(r.Lmin) + ' м', 'Lmin = 0,9 · Vmax^1/2.');
    h += c('Фактически через 1 ДПУ', dpuFmt(r.Vone) + ' м³/с', 'Gsm / ρsm / N = ' + dpuFmt(r.G, 2) + ' / ' + dpuFmt(r.ro, 3) + ' / ' + r.N + (r.roAuto ? '; ρ = 353/Tsm' : '') + '.');
  }
  h += r.warn.map(function (w) { return c('Внимание', 'Проверь', w, 'warn'); }).join('');
  $('#dp-res').innerHTML = h;
  $('#dp-anim').innerHTML = dpuSvg(r);
  DPU_LAST = r;
}
var DPU_LAST = null;

function dpuSvg(r) {
  var n = r.err.length ? 0 : r.N, show = Math.min(n, 8), W = 360, g = '', top = 30, floor = 150;
  var Hh = Math.max(r.hd + 0.6, r.door + 0.5, r.y + 1, 3), sc = (floor - top) / Hh, Y = function (m) { return floor - m * sc; };
  g += '<rect class="dpz" x="20" y="' + top + '" width="320" height="' + (floor - top) + '"/>';
  var ys = Y(Math.max(Math.min(r.y, Hh), 0));
  g += '<rect class="dpsmoke" x="20" y="' + top + '" width="320" height="' + Math.max(ys - top, 0) + '"><animate attributeName="opacity" values=".55;.8;.55" dur="4s" repeatCount="indefinite"/></rect>';
  g += '<line class="dpys" x1="20" y1="' + ys + '" x2="340" y2="' + ys + '"/><text class="stt" x="336" y="' + (ys + 11) + '" text-anchor="end">низ дымового слоя ' + dpuFmt(r.y, 2) + ' м</text>';
  g += '<line class="stl" x1="10" y1="' + floor + '" x2="350" y2="' + floor + '"/><line class="stl" x1="10" y1="' + top + '" x2="350" y2="' + top + '"/>';
  var yd = Y(r.door); g += '<rect class="dpdoor" x="24" y="' + yd + '" width="14" height="' + (floor - yd) + '"/><text class="stt" x="42" y="' + (yd + 9) + '">дверь</text>';
  g += '<path class="stflame" style="transform-origin:180px ' + floor + 'px" d="M174 ' + floor + ' C166 ' + (floor - 10) + ' 170 ' + (floor - 18) + ' 176 ' + (floor - 26) + ' C176 ' + (floor - 18) + ' 182 ' + (floor - 18) + ' 184 ' + (floor - 24) + ' C190 ' + (floor - 16) + ' 188 ' + (floor - 6) + ' 182 ' + floor + ' Z"/>';
  var yh = Y(r.hd), fl = '';
  for (var i = 0; i < show; i++) {
    var x = 20 + 320 * (i + 0.5) / show;
    g += '<rect class="dpduct" x="' + (x - 9) + '" y="' + (top - 8) + '" width="18" height="' + Math.max(yh - top + 8, 4) + '"/><rect class="dpgrille" x="' + (x - 11) + '" y="' + (yh - 3) + '" width="22" height="4"/>';
    fl += '<circle class="sts" r="3.5"><animateMotion dur="3.2s" begin="-' + (i * 0.37).toFixed(2) + 's" repeatCount="indefinite" path="M180 ' + (floor - 26) + ' C180 ' + (ys + 10) + ' ' + x + ' ' + (ys + 5) + ' ' + x + ' ' + (yh + 2) + ' L' + x + ' ' + (top - 10) + '"/></circle>' +
      '<circle class="sts" r="2.5"><animateMotion dur="3.2s" begin="-' + (i * 0.37 + 1.6).toFixed(2) + 's" repeatCount="indefinite" path="M180 ' + (floor - 26) + ' C175 ' + (ys + 15) + ' ' + (x + 6) + ' ' + (ys + 3) + ' ' + x + ' ' + (yh + 2) + ' L' + x + ' ' + (top - 10) + '"/></circle>';
  }
  if (show && r.d > 0) { var x0 = 20 + 320 * 0.5 / show + 16; g += '<line class="dpdim" x1="' + x0 + '" y1="' + yh + '" x2="' + x0 + '" y2="' + ys + '"/><text class="stt air" x="' + (x0 + 4) + '" y="' + ((yh + ys) / 2 + 3) + '">d = ' + dpuFmt(r.d) + ' м</text>'; }
  g += '<text class="stt" x="20" y="18">' + (n ? 'Разрез: ' + n + ' ДПУ' + (n > show ? ', показано ' + show : '') : 'Исправь исходные данные') + '</text>';
  /* план */
  var pTop = 175, pH = r.k === 'corr' ? 22 : 50, p = '<rect class="dpz" x="20" y="' + pTop + '" width="320" height="' + pH + '"/>';
  if (n) {
    var cols = r.k === 'corr' ? n : Math.ceil(Math.sqrt(n * 320 / pH / 3)), rows = r.k === 'corr' ? 1 : Math.ceil(n / cols), k = 0;
    for (var rr = 0; rr < rows; rr++) for (var cc = 0; cc < cols && k < Math.min(n, 40); cc++, k++)
      p += '<rect class="dpgrille" x="' + (20 + 320 * (cc + 0.5) / cols - 5) + '" y="' + (pTop + pH * (rr + 0.5) / rows - 3) + '" width="10" height="6"/>';
    p += '<text class="stt" x="20" y="' + (pTop + pH + 13) + '">План: ' + (r.k === 'corr' ? 'коридор ' + dpuFmt(r.L, 1) + ' м' : dpuFmt(r.A, 0) + ' м²') + ', шаг не меньше ' + dpuFmt(r.Lmin) + ' м — расставь по плану</text>';
  }
  return '<svg class="stsvg" viewBox="0 0 ' + W + ' ' + (pTop + pH + 20) + '" role="img" aria-label="Схема размещения дымоприёмных устройств">' + g + fl + p + '</svg>' +
    '<p class="tnote">Схема поясняет принцип, это не чертёж. Серые точки — дым, он поднимается и уходит в ДПУ.</p>';
}

/* Выгрузка в Word: HTML-документ с расширением .doc — Word открывает его как документ */
function dpuDoc() {
  var r = DPU_LAST; if (!r) return;
  var row = function (a, b) { return '<tr><td>' + a + '</td><td>' + b + '</td></tr>'; }, f = dpuFmt;
  var src = (r.k === 'room' ? row('Площадь помещения (дымовой зоны), м²', f(r.A, 1)) : row('Длина коридора, м', f(r.L, 1)) + row('Длина на 1 ДПУ по п. 7.8, м', r.lim)) +
    row(r.gm === 'l' ? 'Расход дыма при Tsm, м³/ч' : 'Gsm, кг/с', f(r.G0, 3)) + row('Tsm, °C', f(r.ts, 1)) + row('Tr, °C', f(r.tr, 1)) + row('ρsm, кг/м³', f(r.ro, 3) + (r.roAuto ? ' (353/Tsm)' : '')) +
    row('Сечение ДПУ, мм', r.sh === 'round' ? 'Ø ' + f(r.a * 1000, 0) : f(r.a * 1000, 0) + ' × ' + f(r.b * 1000, 0)) + row('Расположение', r.or === 'h' ? 'горизонтальное' : 'вертикальное') +
    (r.or === 'h' ? row('От оси ДПУ до стены, м', f(r.wd)) : '') + row('Низ ДПУ от пола, м', f(r.hd)) + row('Низ дымового слоя от пола, м', f(r.y)) + row('Верх дверей эвакуационных выходов, м', f(r.door));
  var calc = r.err.length ? '<p><b>Расчёт не выполнен:</b> ' + r.err.join(' ') + '</p>' :
    '<p>Эквивалентный диаметр D = ' + (r.sh === 'round' ? 'Ø = ' + f(r.D, 3) : '2ab/(a + b) = 2 · ' + f(r.a, 3) + ' · ' + f(r.b, 3) + ' / (' + f(r.a, 3) + ' + ' + f(r.b, 3) + ') = ' + f(r.D, 3)) + ' м.</p>' +
    '<p>d = ' + f(r.hd) + ' − ' + f(r.y) + ' = ' + f(r.d) + ' м; проверка d ≥ 2D: ' + f(r.d) + ' ≥ ' + f(2 * r.D, 3) + ' — выполнено.</p>' +
    '<p>γ = ' + f(r.gamma, 1) + ' — ' + (r.gamma === 1 ? 'горизонтальное ДПУ, от оси до стены ' + f(r.wd) + ' м ≥ 2D' : 'вертикальное ДПУ или расстояние до стены меньше 2D') + '.</p>' +
    '<p>Формула Е.1: V<sub>max</sub> = 4,16 · γ · d<sup>5/2</sup> · ((T<sub>sm</sub> − T<sub>r</sub>)/T<sub>r</sub>)<sup>1/2</sup> = 4,16 · ' + f(r.gamma, 1) + ' · ' + f(r.d) + '<sup>5/2</sup> · ((' + f(r.Ts, 2) + ' − ' + f(r.Tr, 2) + ')/' + f(r.Tr, 2) + ')<sup>1/2</sup> = ' + f(r.Vmax, 3) + ' м³/с.</p>' +
    (r.gm === 'l' ? '<p>G<sub>sm</sub> = ' + f(r.G0, 0) + ' · ' + f(r.ro, 3) + ' / 3600 = ' + f(r.G, 3) + ' кг/с.</p>' : '') +
    '<p>N<sub>min</sub> = G<sub>sm</sub> / (ρ<sub>sm</sub> · V<sub>max</sub>) = ' + f(r.G, 3) + ' / (' + f(r.ro, 3) + ' · ' + f(r.Vmax, 3) + ') = ' + f(r.G / (r.ro * r.Vmax), 2) + ' → ' + r.Nmin + ' шт.</p>' +
    '<p>По ' + r.geoTxt + ' → ' + r.Ngeo + ' шт.</p>' +
    '<p><b>Принято: ' + r.N + ' дымоприёмных устройств.</b></p>' +
    '<p>Формула Е.2: L<sub>min</sub> = 0,9 · V<sub>max</sub><sup>1/2</sup> = 0,9 · ' + f(r.Vmax, 3) + '<sup>1/2</sup> = ' + f(r.Lmin) + ' м — наименьшее расстояние между ДПУ.</p>' +
    '<p>Фактический расход через 1 ДПУ: ' + f(r.G, 3) + ' / ' + f(r.ro, 3) + ' / ' + r.N + ' = ' + f(r.Vone, 3) + ' м³/с ≤ V<sub>max</sub>.</p>';
  var warn = r.warn.length ? '<p><b>Замечания:</b></p><ul>' + r.warn.map(function (w) { return '<li>' + w + '</li>'; }).join('') + '</ul>' : '';
  var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>Расчёт ДПУ</title>' +
    '<style>body{font-family:"Times New Roman";font-size:12pt}h1{font-size:14pt}table{border-collapse:collapse}td{border:1px solid #000;padding:3pt 6pt}</style></head><body>' +
    '<h1>Расчёт количества дымоприёмных устройств системы вытяжной противодымной вентиляции</h1>' +
    '<p>Основание: СП 7.13130.2013 с Изм. № 3 (приказ МЧС России от 27.03.2025 № 251), приложение Е, пп. 7.4, ' + (r.k === 'room' ? '7.9' : '7.8') + '.</p>' +
    '<p>Объект защиты: ' + (r.k === 'room' ? 'помещение (дымовая зона)' : 'коридор') + '.</p><h2 style="font-size:12pt">Исходные данные</h2><table>' + src + '</table>' +
    '<p>Массовый расход и средняя температура дымового слоя приняты по расчёту по п. 7.4 СП 7.13130.' + (r.roAuto ? ' Плотность продуктов горения принята по уравнению состояния ρ = 353/T<sub>sm</sub>.' : '') + '</p>' +
    '<h2 style="font-size:12pt">Расчёт</h2>' + calc + warn +
    '<p style="font-size:10pt;color:#555">Сформировано: справочник «Клапаны» v' + APP.ver + ', ' + new Date().toLocaleDateString('ru-RU') + '. Решение принимает ГИП.</p></body></html>';
  var blob = new Blob(['﻿', html], { type: 'application/msword' }), a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'Расчёт_ДПУ.doc'; document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

document.addEventListener('input', function (e) { if (/^dp-/.test(e.target.id)) dpuCalc(); });
document.addEventListener('change', function (e) { if (/^dp-/.test(e.target.id)) dpuCalc(); });
document.addEventListener('click', function (e) { if (e.target.id === 'dp-doc') dpuDoc(); });
