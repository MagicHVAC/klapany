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
    dpuF('dp-vv', 'Скорость в сечении клапана, м/с — для подбора', '10', 'any', 'не больше 11, лучше 9–11 (МР ВНИИПО п. 5.1.1)') +
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
    or: $('#dp-or').value, wd: dpuNum('dp-wd'), hd: dpuNum('dp-hd'), y: dpuNum('dp-y'), door: dpuNum('dp-door'), vv: dpuNum('dp-vv'), err: [], warn: [], marks: [] };
  fcNums([['dp-a', '', 0, null, true], ['dp-l', '', 0, null, true], ['dp-g', '', 0, null, true], ['dp-ts', '', -50], ['dp-tr', '', -50], ['dp-w', '', 0, null, true], ['dp-h', '', 0, null, true],
    ['dp-wd', '', 0], ['dp-hd', '', 0, null, true], ['dp-y', '', 0], ['dp-door', '', 0], ['dp-vv', '', 0, null, true]], r.marks);
  if (r.marks.some(function (m) { return m[1] === 'bad' && m[0] !== 'dp-vv'; })) r.err.push('Исправь поля, подсвеченные красным.');
  r.Ts = r.ts + 273.15; r.Tr = r.tr + 273.15;
  r.D = r.sh === 'round' ? r.a : 2 * r.a * r.b / (r.a + r.b);
  r.gamma = (r.or === 'h' && r.wd >= 2 * r.D) ? 1 : 0.5;
  r.d = r.hd - r.y;
  r.ro = isFinite(r.ro0) && r.ro0 > 0 ? r.ro0 : 353 / r.Ts; r.roAuto = !(isFinite(r.ro0) && r.ro0 > 0);
  r.G = r.gm === 'l' ? r.G0 * r.ro / 3600 : r.G0;
  if (!(r.Ts > r.Tr)) { r.err.push('Tsm должна быть выше Tr — иначе формула Е.1 не работает.'); r.marks.push(['dp-ts', 'bad', 'Должна быть выше Tr']); }
  if (!(r.d > 0)) { r.err.push('Низ ДПУ должен быть выше нижней границы дымового слоя: d = ' + dpuFmt(r.d) + ' м.'); r.marks.push(['dp-y', 'bad', 'Выше низа ДПУ — так нельзя']); }
  else if (r.d < 2 * r.D) { r.err.push('Не выполнено d ≥ 2D: d = ' + dpuFmt(r.d) + ' м, 2D = ' + dpuFmt(2 * r.D) + ' м. Уменьши сечение ДПУ или подними его выше дымового слоя.'); r.marks.push(['dp-w', 'bad', 'Сечение велико: 2D > d (прил. Е)']); r.marks.push(['dp-hd', 'warnf', 'Или подними ДПУ: нужно d ≥ 2D']); }
  if (isFinite(r.door) && r.hd < r.door) { r.err.push('ДПУ ниже верха дверей эвакуационных выходов — нельзя (пп. 7.8, 7.9).'); r.marks.push(['dp-hd', 'bad', 'Ниже верха дверей — нельзя, пп. 7.8, 7.9']); }
  if (isFinite(r.door) && r.y < r.door) { r.warn.push('Низ дымового слоя ' + dpuFmt(r.y) + ' м ниже верха дверей эвакуационных выходов ' + dpuFmt(r.door) + ' м: дым будет уходить через дверные проёмы, а люди окажутся в дыму. Проверь расчёт высоты дымового слоя — это вывод справочника, в прил. Е такого ограничения нет.'); r.marks.push(['dp-y', 'warnf', 'Ниже верха дверей ' + dpuFmt(r.door) + ' м — проверь расчёт']); }
  if (r.or === 'h' && isFinite(r.wd) && r.wd < 2 * r.D) r.marks.push(['dp-wd', 'warnf', 'Меньше 2D = ' + dpuFmt(2 * r.D) + ' м: γ = 0,5']);
  r.Vmax = 4.16 * r.gamma * Math.pow(Math.max(r.d, 0), 2.5) * Math.sqrt(Math.max(r.Ts - r.Tr, 0) / r.Tr);
  r.Nmin = r.Vmax > 0 ? Math.ceil(r.G / (r.ro * r.Vmax) - 1e-9) : NaN;
  r.Lmin = 0.9 * Math.sqrt(r.Vmax);
  if (r.k === 'room') {
    r.Ngeo = Math.ceil(r.A / 500 - 1e-9); r.geoTxt = 'п. 7.9: не больше 500 м² на 1 ДПУ — ' + dpuFmt(r.A, 1) + ' / 500';
    if (r.A > 3000) r.marks.push(['dp-a', 'warnf', 'Больше 3000 м² — делить на дымовые зоны']);
    if (r.A > 3000) r.warn.push('Площадь больше 3000 м²: помещение делят на дымовые зоны до 3000 м² каждая, расчёт — на зону (п. 7.9). Условное деление при механической вытяжке — только если Tsm выше Tr на 20 °C и больше.');
  } else {
    r.Ngeo = Math.ceil(r.L / r.lim - 1e-9); r.geoTxt = 'п. 7.8: не больше ' + r.lim + ' м коридора на 1 ДПУ — ' + dpuFmt(r.L, 1) + ' / ' + r.lim;
    if (r.L > 60) r.marks.push(['dp-l', 'warnf', 'Больше 60 м — расход на каждый участок до 60 м']);
    if (r.L > 60) r.warn.push('Коридор длиннее 60 м: расход считают для каждого коридора длиной не больше 60 м (п. 7.4 а).');
  }
  r.N = Math.max(r.Nmin || 0, r.Ngeo || 0);
  r.Vone = r.N ? r.G / r.ro / r.N : NaN;
  if (r.k === 'corr' && r.N > 1 && r.L / r.N < r.Lmin) r.warn.push('На длине ' + dpuFmt(r.L, 1) + ' м при ' + r.N + ' ДПУ шаг ' + dpuFmt(r.L / r.N) + ' м меньше Lmin = ' + dpuFmt(r.Lmin) + ' м. Проверь расстановку или уменьши расход на ДПУ.');
  r.sizes = dpuSizes(r);
  /* скорость в введённом ДПУ: МР ВНИИПО п. 5.1.1 — сечения решёток и клапанов на скорость не больше 11 м/с, лучше 9–11 */
  r.Ain = r.sh === 'round' ? Math.PI * r.a * r.a / 4 : r.a * r.b; r.vIn = r.Vone / r.Ain;
  if (r.vv > 11) r.marks.push(['dp-vv', 'warnf', 'Больше 11 м/с — МР ВНИИПО п. 5.1.1: не больше 11, лучше 9–11']);
  if (r.vIn > 11) { r.warn.push('В введённом ДПУ ' + dpuFmt(r.a * 1000, 0) + (r.sh === 'round' ? ' мм' : ' × ' + dpuFmt(r.b * 1000, 0) + ' мм') + ' скорость ' + dpuFmt(r.vIn, 1) + ' м/с — больше 11 м/с (МР ВНИИПО к СП 7, п. 5.1.1: не больше 11, лучше 9–11). Возьми клапан больше или добавь ДПУ.'); r.marks.push(['dp-w', 'warnf', 'v = ' + dpuFmt(r.vIn, 1) + ' м/с > 11']); }
  if (r.ts - r.tr < 20 && r.k === 'room' && r.A > 3000) r.warn.push('Tsm − Tr меньше 20 °C — условно делить на зоны нельзя, только конструктивно (п. 7.9).');
  return r;
}
/* Подбор размеров клапана (ДПУ): нужное живое сечение A = V1 / v; ограничения прил. Е: 2D ≤ d, для γ = 1 ещё 2D ≤ расстояние до стены.
   Размеры перебираются кратно 50 мм от 200 до 2000, стороны не больше 1:4 — это шаг подбора справочника, не каталог: сверить с каталогом. */
function dpuSizes(r) {
  var o = { Dmax: r.d / 2, Dg: r.or === 'h' ? r.wd / 2 : NaN, list: [], need: NaN };
  if (!(r.Vone > 0) || !(r.vv > 0) || !(r.d > 0)) return o;
  o.need = r.Vone / r.vv;
  var lim = Math.min(o.Dmax, isFinite(o.Dg) ? o.Dg : Infinity), cand = [];
  for (var a = 200; a <= 2000; a += 50) for (var b = 200; b <= a; b += 50) {
    if (a / b > 4) continue;
    var A = a * b / 1e6, D = 2 * a * b / (a + b) / 1000;
    if (A < o.need || D > o.Dmax) continue;
    cand.push({ a: a, b: b, A: A, D: D, g1: D <= lim + 1e-9, v: r.Vone / A });
  }
  cand.sort(function (x, y) { return (y.g1 - x.g1) || (x.A - y.A) || (x.a / x.b - y.a / y.b); });
  var seen = {};
  o.list = cand.filter(function (c) { var k = c.a + 'x' + c.b; if (seen[k] || o.list.length > 5) return false; seen[k] = 1; return true; }).slice(0, 5);
  if (!o.list.length) {
    /* сколько ДПУ нужно, чтобы клапан с D ≤ d/2 пропустил расход при скорости v */
    var Dm = o.Dmax, Am = Dm * Dm; /* квадрат со стороной D: эквивалентный диаметр = D */
    o.needN = Math.ceil(r.G / r.ro / (Am * r.vv) - 1e-9);
  }
  return o;
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
  if (r.err.length) h += r.err.map(function (e) { return c('Ошибка исходных данных', 'Пересмотри', e, 'warn'); }).join('') + (r.d > 0 && r.d < 2 * r.D ? c('Подойдёт клапан', 'D ≤ ' + dpuFmt(r.d / 2, 2) + ' м', 'По d ≥ 2D эквивалентный диаметр не больше d/2. Например, ' + Math.floor(r.d / 2 * 20) * 50 + '×' + Math.floor(r.d / 2 * 20) * 50 + ' мм — сверь с каталогом; расход тогда проверь по числу ДПУ.', 'final') : '');
  else {
    h += c('Принять ДПУ', r.N + ' шт.', 'Большее из Nmin = ' + r.Nmin + ' (прил. Е) и ' + r.Ngeo + ' (' + (r.k === 'room' ? 'п. 7.9' : 'п. 7.8') + ').', 'final');
    h += c('Vmax на 1 ДПУ, Е.1', dpuFmt(r.Vmax) + ' м³/с', 'γ = ' + dpuFmt(r.gamma, 1) + ', d = ' + dpuFmt(r.d) + ' м, D = ' + dpuFmt(r.D, 3) + ' м. Это ' + dpuFmt(r.Vmax * 3600, 0) + ' м³/ч.');
    h += c('Шаг между ДПУ, Е.2', 'не меньше ' + dpuFmt(r.Lmin) + ' м', 'Lmin = 0,9 · Vmax^1/2 — по формуле Е.2 СП 7 от наибольшего расхода Vmax, а не от фактического.');
    h += c('Скорость в твоём ДПУ', dpuFmt(r.vIn, 1) + ' м/с', 'Введённый ' + dpuFmt(r.a * 1000, 0) + (r.sh === 'round' ? ' мм' : ' × ' + dpuFmt(r.b * 1000, 0) + ' мм') + ', живое сечение ' + dpuFmt(r.Ain, 3) + ' м². Верно: не больше 11 м/с, лучше 9–11 (МР ВНИИПО, п. 5.1.1).', r.vIn > 11 ? 'warn' : '');
    h += c('Фактически через 1 ДПУ', dpuFmt(r.Vone) + ' м³/с', 'Gsm / ρsm / N = ' + dpuFmt(r.G, 2) + ' / ' + dpuFmt(r.ro, 3) + ' / ' + r.N + (r.roAuto ? '; ρ = 353/Tsm' : '') + '.');
    var z = r.sizes;
    if (z.list.length) h += c('Размер клапана, мм', z.list[0].a + ' × ' + z.list[0].b, (z.list[0].a !== Math.round(r.a * 1000) || z.list[0].b !== Math.round(r.b * 1000) ? 'Это подбор под скорость ' + dpuFmt(r.vv, 1) + ' м/с, а не твой ДПУ — чтобы расчёт Vmax шёл по нему, введи этот размер выше. ' : '') + 'Живое сечение не меньше ' + dpuFmt(z.need, 3) + ' м² при ' + dpuFmt(r.vv, 1) + ' м/с. Варианты: ' + z.list.map(function (q) { return q.a + '×' + q.b + ' (v ' + dpuFmt(q.v, 1) + ' м/с' + (q.g1 ? '' : ', γ = 0,5') + ')'; }).join('; ') + '. Ограничение прил. Е: D ≤ d/2 = ' + dpuFmt(z.Dmax, 2) + ' м. Кратно 50 мм — сверь с каталогом производителя.', 'final');
    else if (isFinite(z.need)) h += c('Размер клапана', 'Не подобрать', 'Нужно сечение ' + dpuFmt(z.need, 3) + ' м², а по d ≥ 2D клапан не больше D = ' + dpuFmt(z.Dmax, 2) + ' м. Увеличь число ДПУ' + (z.needN ? ' примерно до ' + z.needN : '') + ', подними ДПУ или прими большую скорость по каталогу.', 'warn');
  }
  h += r.warn.map(function (w) { return c('Внимание', 'Проверь', w, 'warn'); }).join('');
  $('#dp-res').innerHTML = h;
  fcApply('dp-', r.marks);
  $('#dp-anim').innerHTML = dpuSvg(r);
  DPU_LAST = r;
}
var DPU_LAST = null;

/* Схема по введённым значениям: разрез (вертикаль — в масштабе) и план. Подписи — фактические числа; нарушения — красным. */
function dpuDim(x, y1, y2, txt, cls, side) {
  var a = Math.min(y1, y2), b = Math.max(y1, y2), tx = side === 'l' ? x - 4 : x + 4;
  return '<line class="dpdim ' + (cls || '') + '" x1="' + x + '" y1="' + a + '" x2="' + x + '" y2="' + b + '"/>' +
    '<line class="dpdim ' + (cls || '') + '" x1="' + (x - 3) + '" y1="' + a + '" x2="' + (x + 3) + '" y2="' + a + '"/><line class="dpdim ' + (cls || '') + '" x1="' + (x - 3) + '" y1="' + b + '" x2="' + (x + 3) + '" y2="' + b + '"/>' +
    '<text class="stt dpl ' + (cls || '') + '" x="' + tx + '" y="' + ((a + b) / 2 + 3) + '" text-anchor="' + (side === 'l' ? 'end' : 'start') + '">' + txt + '</text>';
}
function dpuSvg(r) {
  var f = dpuFmt, n = r.N > 0 && isFinite(r.N) ? r.N : 0, show = Math.min(n, 6), W = 360, g = '';
  var vert = r.or === 'v', a = r.a || 0, b = r.sh === 'round' ? a : (r.b || 0);
  var top = 46, floor = 186, Hh = Math.max((r.hd || 0) + (vert ? b : 0) + 0.7, (r.door || 0) + 0.5, (r.y || 0) + 0.6, 3);
  var sv = (floor - top) / Hh, Y = function (m) { return floor - Math.max(0, m) * sv; };
  var Lw = r.k === 'corr' ? r.L : Math.sqrt(r.A), x0 = 104, x1 = 340, sh = (x1 - x0) / (Lw > 0 ? Lw : 1), X = function (m) { return x0 + m * sh; };
  var ceil = Y(Hh - 0.15), ys = Y(r.y), yh = Y(r.hd), yd = Y(r.door);
  var badD = !(r.d >= 2 * r.D), badDoor = r.hd < r.door, warnY = r.y < r.door, badWall = !vert && r.wd < 2 * r.D;
  g += '<rect class="dpz" x="' + x0 + '" y="' + ceil + '" width="' + (x1 - x0) + '" height="' + (floor - ceil) + '"/>';
  g += '<rect class="dpsmoke" x="' + x0 + '" y="' + ceil + '" width="' + (x1 - x0) + '" height="' + Math.max(ys - ceil, 0) + '"><animate attributeName="opacity" values=".5;.75;.5" dur="4s" repeatCount="indefinite"/></rect>';
  g += '<line class="dpys' + (warnY ? ' wrn' : '') + '" x1="' + x0 + '" y1="' + ys + '" x2="' + x1 + '" y2="' + ys + '"/>';
  g += '<line class="stl" x1="' + (x0 - 6) + '" y1="' + floor + '" x2="' + (x1 + 6) + '" y2="' + floor + '"/>';
  g += '<rect class="dpdoor' + (warnY ? ' wrn' : '') + '" x="' + (x0 + 3) + '" y="' + yd + '" width="12" height="' + (floor - yd) + '"/>';
  g += '<text class="stt dpl' + (warnY ? ' wrn' : '') + '" x="' + (x0 + 18) + '" y="' + (yd + 8) + '">дверь, верх ' + f(r.door) + ' м</text>';
  g += '<path class="stflame" style="transform-origin:' + ((x0 + x1) / 2) + 'px ' + floor + 'px" d="M' + ((x0 + x1) / 2 - 6) + ' ' + floor + ' c-8 -10 -4 -18 2 -26 c0 8 6 8 8 2 c6 8 4 18 -2 24 z"/>';
  /* клапаны */
  var gx = [], fl = '';
  for (var i = 0; i < show; i++) gx.push(r.k === 'corr' ? X(Lw * (i + 0.5) / show) : X(Lw * (i + 0.5) / show));
  gx.forEach(function (x, i) {
    var cls = (badD || badDoor) ? ' bad' : '';
    if (!vert) {
      var gw = Math.max(a * sh, 6);
      g += '<rect class="dpduct" x="' + (x - gw / 2 - 2) + '" y="' + (top - 10) + '" width="' + (gw + 4) + '" height="' + Math.max(yh - top + 10, 4) + '"/>';
      g += '<rect class="dpgrille' + cls + '" x="' + (x - gw / 2) + '" y="' + (yh - 3) + '" width="' + gw + '" height="4"/>';
    } else {
      var gh = Math.max(b * sv, 4), sx = x + 6;
      g += '<rect class="dpduct" x="' + sx + '" y="' + (top - 10) + '" width="12" height="' + (floor - top + 10) + '"/>';
      g += '<rect class="dpgrille' + cls + '" x="' + (sx - 3) + '" y="' + (yh - gh) + '" width="4" height="' + gh + '"/>';
    }
    var tx = vert ? x + 2 : x, ty = vert ? yh - b * sv / 2 : yh + 2;
    fl += '<circle class="sts" r="3.2"><animateMotion dur="3.4s" begin="-' + (i * 0.5).toFixed(2) + 's" repeatCount="indefinite" path="M' + ((x0 + x1) / 2) + ' ' + (floor - 26) + ' C' + ((x0 + x1) / 2) + ' ' + (ys + 8) + ' ' + tx + ' ' + (ys + 4) + ' ' + tx + ' ' + ty + (vert ? ' L' + (x + 12) + ' ' + ty + ' L' + (x + 12) + ' ' + (top - 10) : ' L' + x + ' ' + (top - 10)) + '"/></circle>';
  });
  if (gx.length) {
    var x = gx[0];
    g += dpuDim(x0 - 18, floor, yh, 'низ ДПУ ' + f(r.hd) + ' м', badDoor ? 'bad' : '', 'l');
    g += dpuDim(x0 - 34, floor, ys, '', warnY ? 'wrn' : '', 'l');
    g += '<text class="stt dpl' + (warnY ? ' wrn' : '') + '" x="' + (x1 - 2) + '" y="' + (ys - 4) + '" text-anchor="end">низ дымового слоя ' + f(r.y) + ' м</text>';
    var dx = gx.length > 1 ? (gx[0] + gx[1]) / 2 : x + 24;
    g += dpuDim(dx, ys, yh, 'd = ' + f(r.d) + ' м ' + (badD ? '< ' : '≥ ') + '2D = ' + f(2 * r.D) + ' м', badD ? 'bad' : 'ok');
    g += '<text class="stt dpl" x="' + x + '" y="' + (vert ? yh - b * sv - 4 : top - 13) + '" text-anchor="middle">' + (r.sh === 'round' ? 'Ø ' + f(a * 1000, 0) : f(a * 1000, 0) + '×' + f(b * 1000, 0)) + ' мм, D = ' + f(r.D, 2) + ' м</text>';
    if (!vert) {
      var xw = X(0), yw = yh + 12;
      g += '<line class="dpdim ' + (badWall ? 'wrn' : '') + '" x1="' + x0 + '" y1="' + yw + '" x2="' + Math.max(x0 + 8, Math.min(x, x0 + r.wd * sh)) + '" y2="' + yw + '"/>' +
        '<text class="stt dpl ' + (badWall ? 'wrn' : '') + '" x="' + (x0 + 4) + '" y="' + (yw + 10) + '">до стены ' + f(r.wd) + ' м ' + (badWall ? '< 2D → γ = 0,5' : '≥ 2D → γ = 1') + '</text>';
    }
  }
  g += '<text class="stt" x="' + x0 + '" y="12">' + (n ? 'Разрез: ' + n + ' ДПУ' + (n > show ? ', показано ' + show : '') + (vert ? ' · вертикально, γ = 0,5' : '') : 'Исправь исходные данные') + '</text>';
  /* план */
  var pTop = floor + 26, pH = r.k === 'corr' ? 24 : Math.min(110, (x1 - x0)), p = '<rect class="dpz" x="' + x0 + '" y="' + pTop + '" width="' + (x1 - x0) + '" height="' + pH + '"/>', step = NaN;
  if (n) {
    var cols = r.k === 'corr' ? n : Math.ceil(Math.sqrt(n)), rows = r.k === 'corr' ? 1 : Math.ceil(n / cols), k = 0;
    step = r.k === 'corr' ? r.L / n : Math.sqrt(r.A) / cols;
    for (var rr = 0; rr < rows; rr++) for (var cc = 0; cc < cols && k < Math.min(n, 64); cc++, k++)
      p += '<rect class="dpgrille' + (step < r.Lmin ? ' bad' : '') + '" x="' + (x0 + (x1 - x0) * (cc + 0.5) / cols - 5) + '" y="' + (pTop + pH * (rr + 0.5) / rows - 3) + '" width="10" height="6"/>';
    if (cols > 1) { var px1 = x0 + (x1 - x0) * 0.5 / cols, px2 = x0 + (x1 - x0) * 1.5 / cols, py = pTop + pH * 0.5 / rows - 9;
      p += '<line class="dpdim ' + (step < r.Lmin ? 'bad' : 'ok') + '" x1="' + px1 + '" y1="' + py + '" x2="' + px2 + '" y2="' + py + '"/><text class="stt dpl ' + (step < r.Lmin ? 'bad' : 'ok') + '" x="' + ((px1 + px2) / 2) + '" y="' + (py - 3) + '" text-anchor="middle">шаг ' + f(step) + ' м ' + (step < r.Lmin ? '<' : '≥') + ' Lmin ' + f(r.Lmin) + ' м</text>'; }
    p += '<text class="stt" x="' + x0 + '" y="' + (pTop + pH + 13) + '">План: ' + (r.k === 'corr' ? 'коридор ' + f(r.L, 1) + ' м, ' + DPU_CORR.filter(function (c) { return +c[0] === r.lim; })[0][1] : f(r.A, 0) + ' м², условно квадрат ' + f(Math.sqrt(r.A), 1) + ' × ' + f(Math.sqrt(r.A), 1) + ' м') + '</text>';
  }
  return '<svg class="stsvg" viewBox="0 0 ' + W + ' ' + (pTop + pH + 20) + '" role="img" aria-label="Схема размещения дымоприёмных устройств по введённым значениям">' + g + fl + p + '</svg>' +
    '<p class="tnote">Схема строится по введённым значениям: высоты — в масштабе, по горизонтали сжато. Красное — нарушение, жёлтое — проверь. Это не чертёж.</p>';
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
    '<p style="font-size:10pt;color:#555">Сформировано: «Справочник инженера ОВиК» v' + APP.ver + ', ' + new Date().toLocaleDateString('ru-RU') + '. Решение принимает ГИП.</p></body></html>';
  var blob = new Blob(['﻿', html], { type: 'application/msword' }), a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'Расчёт_ДПУ.doc'; document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

document.addEventListener('input', function (e) { if (/^dp-/.test(e.target.id)) dpuCalc(); });
document.addEventListener('change', function (e) { if (/^dp-/.test(e.target.id)) dpuCalc(); });
document.addEventListener('click', function (e) { if (e.target.id === 'dp-doc') dpuDoc(); });
