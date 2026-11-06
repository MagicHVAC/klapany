/* МР ВНИИПО к СП 7.13130, разд. 3 — расход удаляемых продуктов горения.
   3.1 — из горящего помещения: (2)–(12); 3.2.1 — из коридора, холла: (13)–(17) и прил. 1; 3.2.2 — атриум, вестибюль с проёмом: (18), (4).
   Формулы сверены по изображениям текста МР (meganorm), 06.11.2026. cp — прил. 2 МР (netCp из net.js). */

/* прил. 1 МР: усреднённые параметры пожарной нагрузки — Q, МДж/кг; v, м/с; ψ, кг/(м²·с) */
var VN_LOAD = [
  ['Мебель + бытовые изделия (I–II ст. огнест.)', 13.8, 0.0108, 0.0145], ['Мебель + ткани (I–II ст.)', 14.7, 0.0108, 0.0145], ['Мебель + ткани 0,75 + 0,25 (I ст.)', 14.9, 0.0125, 0.0162],
  ['Кабинет: мебель + бумага', 14.0, 0.0420, 0.0129], ['Облицовка панелями ДВП', 18.1, 0.0405, 0.0130], ['Административное: мебель + бумага', 14.0, 0.0220, 0.0210],
  ['Общественные: мебель + линолеум ПВХ', 14.0, 0.0150, 0.0137], ['Библиотеки, архивы', 14.5, 0.0103, 0.0110], ['Сцена: древесина', 13.8, 0.0368, 0.0145],
  ['Верхняя одежда: ворс, ткани', 23.3, 0.0835, 0.0130], ['Резинотехнические изделия', 36.0, 0.0184, 0.0112], ['Окрашенные полы, стены', 14.1, 0.0151, 0.0145],
  ['Выставочные залы, мастерские', 14.0, 0.0163, 0.0152], ['Издательства, типографии', 15.4, 0.0040, 0.0061], ['Мебель: дерево + облицовка', 14.4, 0.0154, 0.0135],
  ['Промтовары: текстиль', 16.7, 0.0071, 0.0244], ['Кабели АВВГ + АПВГ', 30.7, 0.0071, 0.0244], ['Радиоматериалы', 34.8, 0.0137, 0.0177],
  ['Электротехнические материалы', 20.9, 0.0125, 0.0076], ['Кабель АВВГ', 25.0, 0.0071, 0.0244], ['Кабель АПВГ', 36.4, 0.0071, 0.0244],
  ['Телефонный кабель ТПВ', 34.6, 0.0062, 0.0085], ['Древесные стройматериалы, штабель', 13.8, 0.0585, 0.0140], ['Фанера', 18.4, 0.0167, 0.0089]
];
var VN_QWOOD = 13.8; /* теплота сгорания древесины, МДж/кг — прил. 1 МР, строка «древесина» */
function vnLoadSel(id, v) { return dpuS(id, 'Пожарная нагрузка (прил. 1 МР)', VN_LOAD.map(function (x, i) { return [String(i), x[0] + ' — ' + x[1] + ' МДж/кг']; }), String(v)); }

/* (4), (A49), (A50): средняя температура дымового слоя, К. Qr = r·Qf, кВт */
function exhTsm(Qr, Gk, h, lsm, Asm, Tr) {
  var Tk = Tr + Qr / (1.0 * Gk), Ts = Tk;
  for (var i = 0; i < 30; i++) {
    Tk = Tr + Qr / (netCp(Tk) * Gk);
    var a = 0.01163 * Math.exp(0.0023 * (Ts - 273)), S = h * lsm + Asm, cs = netCp(Ts);
    Ts = Tr + cs / netCp(Tk) * Qr / (a * S) * (1 - Math.exp(-a * S / (cs * Gk)));
  }
  return { Ts: Ts, Tk: Tk };
}

/* ---------- 3.1 горящее помещение ---------- */
function exhBlock() {
  var F = dpuF, S = dpuS;
  return '<p class="sub">Расход дыма из горящего помещения по уравнению (2): дымовой слой под потолком копится, пока колонка над очагом подаёт больше, чем удаляем. Два режима (п. 3.1): на время эвакуации — слой не опускается ниже допустимого до τэ; для пожарных подразделений — стационарно, G<sub>sm</sub> = G<sub>k</sub>.</p>' +
    vnGrp('Помещение', S('ex-kind', 'Тип помещения', [['hall', 'зал: торговый, зрительный, спортзал и т. п. — (7)/(8)'], ['atr', 'атриум, отделённый от этажей — (8)'], ['bal', 'атриум: пожар под галереей — (9)'], ['park', 'автостоянка — Qf = 5 МВт на автомобиль']], 'hall') +
      F('ex-a', 'Длина помещения a, м', '30', 'any') + F('ex-b', 'Ширина b, м', '20', 'any') + F('ex-H', 'Высота H, м', '6', 'any') +
      F('ex-y', 'Нижняя граница дымового слоя от пола, м', '2.5', 'any', 'не ниже верха дверей эвакуационных выходов') + F('ex-tr', 'Tr — воздух в помещении, °C', '20', 'any')) +
    '<div id="ex-fire">' + vnGrp('Очаг пожара — (3)', vnLoadSel('ex-mat', 6) + F('ex-q', 'Q — теплота сгорания, МДж/кг', '14', 'any') + F('ex-psi', 'ψ — скорость выгорания, кг/(м²·с)', '0.0137', 'any') +
      F('ex-f0', 'F0 — площадь горения, м²', '10', 'any', 'из расчёта площади пожара') + F('ex-eta', 'η — полнота сгорания', '1', 'any', 'пример; в МР значения нет') + F('ex-r', 'r — доля без потерь на излучение', '0.7', 'any', 'пример; в МР значения нет')) + '</div>' +
    '<div id="ex-park" hidden>' + vnGrp('Автостоянка — п. 3.1.2', S('ex-tier', 'Хранение', [['1', 'манежное — 1 автомобиль, 5 МВт'], ['2', 'двухъярусное — 10 МВт'], ['3', 'трёхъярусное — 15 МВт']], '1') + F('ex-rp', 'r — доля без потерь на излучение', '0.7', 'any', 'пример; в МР значения нет')) + '</div>' +
    '<div id="ex-bal" hidden>' + vnGrp('Пожар под галереей — (9)', F('ex-w', 'W — ширина струи из-под галереи, м', '6', 'any') + F('ex-hb', 'H — от основания атриума до ограждения галереи, м', '4', 'any') + F('ex-z', 'z — от ограждения галереи до низа дымового слоя, м', '8', 'any')) + '</div>' +
    vnGrp('Режим — (10)–(12)', S('ex-case', 'Расчёт', [['evac', 'на время эвакуации — интегрирую (2)'], ['fire', 'для пожарных подразделений — стационарно']], 'fire') + F('ex-te', 'τэ — расчётное время эвакуации, с', '180', 'any')) +
    '<div class="barres stres" id="ex-res"></div><div class="stanim" id="ex-anim"></div>' + vnBtns('exh') +
    '<details class="issue dpf"><summary>Формулы</summary><div><p>(2) A<sub>sm</sub>·d(ρ<sub>sm</sub>h)/dτ = G<sub>k</sub> − G<sub>sm</sub>; (3) Q<sub>f</sub> = ηQψF<sub>0</sub>; (4) T<sub>sm</sub> = T<sub>r</sub> + (c<sub>psm</sub>/c<sub>pk</sub>)·rQ<sub>f</sub>/(α(hl<sub>sm</sub> + A<sub>sm</sub>))·[1 − exp(−α(hl<sub>sm</sub> + A<sub>sm</sub>)/(c<sub>psm</sub>G<sub>k</sub>))]; T<sub>k</sub> = T<sub>r</sub> + rQ<sub>f</sub>/(c<sub>pk</sub>G<sub>k</sub>); α = 0,01163·exp(0,0023(T<sub>sm</sub> − 273)); (5) ρ<sub>sm</sub> = ρ<sub>r</sub>T<sub>r</sub>/T<sub>sm</sub>.</p>' +
    '<p>(7) G<sub>k</sub> = 0,071(rQ<sub>f</sub>)<sup>1/3</sup>(H − h)<sup>5/3</sup> + 0,0018rQ<sub>f</sub> — пламя ниже слоя, z<sub>1</sub> &lt; z; (8) G<sub>k</sub> = 0,032(rQ<sub>f</sub>)<sup>3/5</sup>(H − h) — пламя входит в слой; z<sub>1</sub> = 0,166(rQ<sub>f</sub>)<sup>2/5</sup>; (9) G<sub>k</sub> = 0,36(Q<sub>f</sub>W)<sup>1/3</sup>(z + 0,25H).</p>' +
    '<p>A<sub>sm</sub> = a·b, l<sub>sm</sub> = 2(a + b). Q<sub>f</sub> — кВт. (10), (11): за 0 ≤ τ ≤ τ<sub>э</sub> толщина слоя h ≤ h<sub>sm</sub>, G<sub>sm</sub> &lt; G<sub>k</sub>; (12): h = h<sub>sm</sub>, G<sub>sm</sub> = G<sub>k</sub>.</p></div></details>' +
    refs([['mr7', '3.1'], ['mr7', 'прил. 1'], ['sp7', '7.4']]);
}
function exhGk(r, h) {
  var z = r.H - h;
  if (r.kind === 'bal') return { G: 0.36 * Math.pow(r.Qf * r.w, 1 / 3) * (r.z + 0.25 * r.hb), f: '9' };
  if (r.kind === 'atr' || r.z1 > z) return { G: 0.032 * Math.pow(r.Qr, 0.6) * z, f: '8' };
  return { G: 0.071 * Math.pow(r.Qr, 1 / 3) * Math.pow(z, 5 / 3) + 0.0018 * r.Qr, f: '7' };
}
function exhCompute() {
  var n = dpuNum, r = { kind: $('#ex-kind').value, a: n('ex-a'), b: n('ex-b'), H: n('ex-H'), y: n('ex-y'), tr: n('ex-tr'), Q: n('ex-q'), psi: n('ex-psi'), F0: n('ex-f0'),
    eta: n('ex-eta'), rr: n('ex-r'), tier: +$('#ex-tier').value, rp: n('ex-rp'), w: n('ex-w'), hb: n('ex-hb'), z: n('ex-z'), cs: $('#ex-case').value, te: n('ex-te'), err: [], warn: [], marks: [], at: Date.now() };
  var L = [['ex-a', '', 0, null, true], ['ex-b', '', 0, null, true], ['ex-H', '', 0, null, true], ['ex-y', '', 0, null, true], ['ex-tr', '', -40, 60]];
  if (r.kind === 'park') L.push(['ex-rp', '', 0, 1, true]); else L.push(['ex-q', '', 0, null, true], ['ex-psi', '', 0, null, true], ['ex-f0', '', 0, null, true], ['ex-eta', '', 0, 1, true], ['ex-r', '', 0, 1, true]);
  if (r.kind === 'bal') L.push(['ex-w', '', 0, null, true], ['ex-hb', '', 0, null, true], ['ex-z', '', 0, null, true]);
  if (r.cs === 'evac') L.push(['ex-te', '', 0, null, true]);
  fcNums(L, r.marks);
  if (r.y >= r.H) r.marks.push(['ex-y', 'bad', 'Должна быть ниже потолка']);
  if (vnBad(r)) return r;
  r.Tr = r.tr + 273.15; r.ror = vnRho(r.tr); r.Asm = r.a * r.b; r.lsm = 2 * (r.a + r.b); r.hsm = r.H - r.y;
  if (r.kind === 'park') { r.Qf = 5000 * r.tier; r.r = r.rp; } else { r.Qf = r.eta * r.Q * 1000 * r.psi * r.F0; r.r = r.rr; }
  r.Qr = r.r * r.Qf; r.z1 = 0.166 * Math.pow(r.Qr, 0.4);
  var st = function (h) { var g = exhGk(r, h), t = exhTsm(r.Qr, g.G, h, r.lsm, r.Asm, r.Tr); return { G: g.G, f: g.f, Ts: t.Ts, Tk: t.Tk, ro: r.ror * r.Tr / t.Ts }; };
  var s = st(r.hsm); r.Gk = s.G; r.f = s.f; r.Ts = s.Ts; r.Tk = s.Tk; r.ro = s.ro;
  if (r.cs === 'fire') { r.Gsm = r.Gk; }
  else {
    /* (2) интегрирование: m = ρsm·h, шаг τэ/1500; h из m — итерацией по ρsm(h) */
    var hAt = function (Gs) {
      var m = 0, h = 0, dt = r.te / 1500;
      for (var k = 0; k < 1500; k++) {
        var q = st(Math.max(h, 1e-3)); m = Math.max(m + (q.G - Gs) / r.Asm * dt, 0);
        for (var j = 0; j < 4; j++) h = Math.min(m / st(Math.max(h, 1e-3)).ro, r.H * 0.999);
      }
      return h;
    };
    r.h0 = hAt(0);
    if (r.h0 <= r.hsm) { r.Gsm = 0; r.noNeed = true; }
    else { var lo = 0, hi = r.Gk; for (var it = 0; it < 26; it++) { var mid = (lo + hi) / 2; if (hAt(mid) > r.hsm) lo = mid; else hi = mid; } r.Gsm = hi; }
  }
  r.tsm = r.Ts - 273.15; r.Lsm = 3600 * r.Gsm / r.ro;
  if (r.kind === 'bal') r.warn.push('Формула (9) взята как в тексте МР: (Qf·W)^1/3. В NFPA 92B, на который ссылается МР, для струи из-под галереи, насколько я знаю, стоит W² — текст NFPA не сверял. При W ≠ 1 м результаты расходятся, согласуй выбор с экспертизой.');
  if (r.kind === 'park') r.warn.push('Автостоянка: нижняя граница слоя — не ниже верха дверей эвакуационных выходов; при ярусном хранении слой — не ниже верха автомобилей верхнего яруса (п. 3.1.2 МР).');
  if (r.tsm > 600) r.warn.push('Tsm = ' + dpuFmt(r.tsm, 0) + ' °C: проверь F0 и класс огнестойкости клапанов и вентилятора.');
  return r;
}
function exhCalc() {
  if (!$('#ex-kind')) return;
  var k = $('#ex-kind').value;
  $('#ex-fire').hidden = k === 'park'; $('#ex-park').hidden = k !== 'park'; $('#ex-bal').hidden = k !== 'bal';
  $('#ex-te').parentNode.hidden = $('#ex-case').value !== 'evac';
  var r = exhCompute(), f = dpuFmt;
  VN.exh = r;
  vnRes('ex-res', r, r.err.length ? '' :
    vnC('Удалять дыма Gsm', f(r.Gsm, 3) + ' кг/с', r.noNeed ? 'За τэ = ' + f(r.te, 0) + ' с слой опускается только до ' + f(r.h0, 2) + ' м ≤ hsm = ' + f(r.hsm, 2) + ' м — на время эвакуации удаление по (10), (11) не требуется. Проверь режим для пожарных подразделений.' : (r.cs === 'fire' ? 'Стационарно, (12): Gsm = Gk при h = hsm = ' + f(r.hsm, 2) + ' м.' : 'Наименьший расход, при котором за τэ = ' + f(r.te, 0) + ' с слой не толще ' + f(r.hsm, 2) + ' м — интегрирование (2).'), 'final') +
    vnC('Объёмный расход', f(r.Lsm, 0) + ' м³/ч', 'При Tsm, ρsm = ' + f(r.ro, 3) + ' кг/м³ — (5).', 'final') +
    vnC('Tsm — дымовой слой', f(r.tsm, 0) + ' °C', 'По (4); в колонке Tk = ' + f(r.Tk - 273.15, 0) + ' °C.') +
    vnC('Колонка Gk', f(r.Gk, 3) + ' кг/с', 'Формула (' + r.f + ')' + (r.kind === 'hall' || r.kind === 'park' ? ': пламя z1 = ' + f(r.z1, 2) + ' м ' + (r.f === '7' ? '<' : '>') + ' z = ' + f(r.H - r.hsm, 2) + ' м' : '') + '.') +
    vnC('Qf — очаг', f(r.Qf / 1000, 2) + ' МВт', r.kind === 'park' ? 'п. 3.1.2 МР: 5 МВт × ' + r.tier : '(3): η·Q·ψ·F0 = ' + f(r.eta, 2) + ' · ' + f(r.Q, 1) + ' · ' + f(r.psi, 4) + ' · ' + f(r.F0, 1) + '; r = ' + f(r.r, 2)));
  fcApply('ex-', r.marks);
  $('#ex-anim').innerHTML = r.err.length ? '' : exhSvg(r);
}
function exhSvg(r) {
  var W = 560, Hs = 200, k = 150 / r.H, fl = 180, top = fl - r.H * k, yl = fl - r.y * k, f = dpuFmt;
  var g = '<svg class="stsvg" viewBox="0 0 ' + W + ' ' + Hs + '" role="img" aria-label="Разрез: дымовой слой">';
  g += '<rect x="60" y="' + top + '" width="440" height="' + (yl - top) + '" class="dpsmoke"/>';
  g += '<line x1="40" y1="' + fl + '" x2="520" y2="' + fl + '" class="dpfloor"/><line x1="40" y1="' + top + '" x2="520" y2="' + top + '" class="dpline"/>';
  g += '<path d="M280 ' + fl + ' l-14 -18 l8 4 l6 -16 l6 16 l8 -4z" class="vnflame"/>';
  g += '<path d="M268 ' + (fl - 20) + ' L240 ' + yl + ' M292 ' + (fl - 20) + ' L320 ' + yl + '" class="dpline"/>';
  g += '<text class="stt fire" x="330" y="' + (fl - 8) + '">Qf ' + f(r.Qf / 1000, 1) + ' МВт</text>';
  g += '<text class="stt" x="66" y="' + (top + 14) + '">дымовой слой ' + f(r.hsm, 2) + ' м · ' + f(r.tsm, 0) + ' °C</text>';
  g += '<text class="stt" x="66" y="' + (yl + 14) + '">граница ' + f(r.y, 2) + ' м от пола</text>';
  g += '<path d="M440 ' + (top + 4) + ' v-' + 8 + '" class="dpleak"/><text class="stt air" x="448" y="' + (top - 2) + '">' + f(r.Gsm, 2) + ' кг/с</text>';
  return g + '</svg>';
}
function exhDoc() {
  var r = VN.exh; if (!r || r.err.length) return; var f = dpuFmt;
  var body = '<h2>Исходные данные</h2>' + vnTable(['Параметр', 'Значение'], [['Тип помещения', $('#ex-kind').selectedOptions[0].text], ['a × b × H, м', f(r.a, 1) + ' × ' + f(r.b, 1) + ' × ' + f(r.H, 2)], ['Низ дымового слоя от пола, м', f(r.y, 2)], ['Tr, °C', f(r.tr, 1)],
    r.kind === 'park' ? ['Очаг', '5 МВт × ' + r.tier + ' (п. 3.1.2 МР)'] : ['Q, МДж/кг; ψ, кг/(м²·с); F0, м²; η; r', f(r.Q, 1) + '; ' + f(r.psi, 4) + '; ' + f(r.F0, 1) + '; ' + f(r.eta, 2) + '; ' + f(r.r, 2)],
    ['Режим', r.cs === 'fire' ? 'для пожарных подразделений, (12)' : 'на время эвакуации τэ = ' + f(r.te, 0) + ' с, (10), (11)']]) +
    '<h2>Расчёт</h2><p>Q<sub>f</sub> = ' + f(r.Qf, 0) + ' кВт; rQ<sub>f</sub> = ' + f(r.Qr, 0) + ' кВт; A<sub>sm</sub> = ' + f(r.Asm, 1) + ' м²; l<sub>sm</sub> = ' + f(r.lsm, 1) + ' м; h<sub>sm</sub> = ' + f(r.hsm, 2) + ' м.</p>' +
    '<p>Колонка по формуле (' + r.f + '): G<sub>k</sub> = ' + f(r.Gk, 3) + ' кг/с. Температура по (4): T<sub>sm</sub> = ' + f(r.Ts, 1) + ' К (' + f(r.tsm, 1) + ' °C), ρ<sub>sm</sub> = ' + f(r.ro, 3) + ' кг/м³.</p>' +
    '<p><b>G<sub>sm</sub> = ' + f(r.Gsm, 3) + ' кг/с, L = ' + f(r.Lsm, 0) + ' м³/ч.</b></p>' + (r.warn.length ? '<ul>' + r.warn.map(function (w) { return '<li>' + w + '</li>'; }).join('') + '</ul>' : '');
  vnDoc('Расход продуктов горения из помещения', body, 'Расчёт_дым_помещение');
}

/* ---------- 3.2.1 коридор, холл ---------- */
function corBlock() {
  var F = dpuF, S = dpuS;
  return '<p class="sub">Дым из коридора или холла, смежного с горящим помещением. Вид пожара (регулируемый вентиляцией или нагрузкой) — по прил. 1, температура — (13)–(16), расход — (17).</p>' +
    vnGrp('Горящее помещение — прил. 1', vnLoadSel('co-mat', 6) + F('co-q', 'Q — теплота сгорания, МДж/кг', '14', 'any') + F('co-m', 'M — масса пожарной нагрузки, кг', '800', 'any') +
      F('co-ff', 'Ff — площадь пола, м²', '30', 'any') + F('co-v', 'V — объём, м³', '90', 'any') + F('co-a0', 'ΣA0 — площадь проёмов, м²', '3.6', 'any') + F('co-h0', 'h0 — высота проёмов, м', '2.1', 'any')) +
    vnGrp('Коридор (холл)', F('co-ac', 'Ac — площадь, м²', '60', 'any') + F('co-lc', 'lc — длина, м', '30', 'any') + F('co-hc', 'H — высота, м', '3', 'any') + F('co-hsm', 'hsm — толщина дымового слоя, м', '1.6', 'any', '0,5H ≤ hsm ≤ 0,6H') +
      F('co-ad', 'Ad — площадь двери выхода, м²', '1.89', 'any') + F('co-hd', 'Hd — высота двери, м', '2.1', 'any') + S('co-k', 'Здание', [['1', 'жилое — ksm = 1,0'], ['1.2', 'общественное — ksm = 1,2']], '1') + F('co-tr', 'Tr — воздух, °C', '20', 'any')) +
    '<div class="barres stres" id="co-res"></div>' + vnBtns('cor') +
    '<details class="issue dpf"><summary>Формулы</summary><div><p>Прил. 1: g<sub>0</sub> = MQ/(F<sub>f</sub>Q<sub>нд</sub>); g<sub>k</sub> = MQ/((F<sub>w</sub> − A<sub>0</sub>)Q<sub>нд</sub>), F<sub>w</sub> = 6V<sup>2/3</sup>; g<sub>kкр</sub> = 4500П³/(1 + 500П³) + V<sup>1/3</sup>/(6V<sub>0</sub>), П = ΣA<sub>0</sub>h<sub>0</sub><sup>1/2</sup>/V<sup>2/3</sup>, V<sub>0</sub> = 0,263·Q/1000 (Q в кДж/кг); Q<sub>нд</sub> = 13,8 МДж/кг.</p>' +
    '<p>g<sub>k</sub> &gt; g<sub>kкр</sub> — ПРВ: (13) T<sub>0max</sub> = T<sub>r</sub> + 940·exp(0,0047g<sub>0</sub> − 0,141); иначе ПРН: (14) T<sub>0max</sub> = T<sub>r</sub> + 224g<sub>k</sub><sup>0,528</sup>. (15) T<sub>0</sub> = 0,8T<sub>0max</sub>.</p>' +
    '<p>(16) T<sub>sm</sub> = T<sub>r</sub> + 1,22(T<sub>0</sub> − T<sub>r</sub>)(2h<sub>sm</sub> + A<sub>c</sub>/l<sub>c</sub>)/l<sub>c</sub>·[1 − exp(−0,58l<sub>c</sub>/(2h<sub>sm</sub> + A<sub>c</sub>/l<sub>c</sub>))]; (17) G<sub>sm</sub> = k<sub>sm</sub>A<sub>d</sub>H<sub>d</sub><sup>0,5</sup>.</p></div></details>' +
    refs([['mr7', '3.2.1'], ['mr7', 'прил. 1']]);
}
function corCompute() {
  var n = dpuNum, r = { Q: n('co-q'), M: n('co-m'), Ff: n('co-ff'), V: n('co-v'), A0: n('co-a0'), h0: n('co-h0'), Ac: n('co-ac'), lc: n('co-lc'), H: n('co-hc'), hsm: n('co-hsm'),
    Ad: n('co-ad'), Hd: n('co-hd'), k: +$('#co-k').value, tr: n('co-tr'), err: [], warn: [], marks: [], at: Date.now() };
  fcNums([['co-q', '', 0, null, true], ['co-m', '', 0, null, true], ['co-ff', '', 0, null, true], ['co-v', '', 0, null, true], ['co-a0', '', 0, null, true], ['co-h0', '', 0, null, true],
    ['co-ac', '', 0, null, true], ['co-lc', '', 0, null, true], ['co-hc', '', 0, null, true], ['co-hsm', '', 0, null, true], ['co-ad', '', 0, null, true], ['co-hd', '', 0, null, true], ['co-tr', '', -40, 60]], r.marks);
  if (r.hsm / r.H < 0.5 - 1e-9 || r.hsm / r.H > 0.6 + 1e-9) r.marks.push(['co-hsm', 'bad', 'Нужно ' + dpuFmt(0.5 * r.H, 2) + '…' + dpuFmt(0.6 * r.H, 2) + ' м (0,5H…0,6H)']);
  if (vnBad(r)) return r;
  r.Tr = r.tr + 273.15;
  r.g0 = r.M * r.Q / (r.Ff * VN_QWOOD); r.Fw = 6 * Math.pow(r.V, 2 / 3);
  if (r.Fw <= r.A0) { r.err.push('Площадь проёмов больше площади ограждений 6V^2/3 — проверь V и A0.'); return r; }
  r.gk = r.M * r.Q / ((r.Fw - r.A0) * VN_QWOOD);
  r.P = r.A0 * Math.sqrt(r.h0) / Math.pow(r.V, 2 / 3); r.V0 = 0.263 * r.Q * 1000 / 1000;
  r.gkr = 4500 * Math.pow(r.P, 3) / (1 + 500 * Math.pow(r.P, 3)) + Math.pow(r.V, 1 / 3) / (6 * r.V0);
  r.prv = r.gk > r.gkr;
  r.T0max = r.prv ? r.Tr + 940 * Math.exp(0.0047 * r.g0 - 0.141) : r.Tr + 224 * Math.pow(r.gk, 0.528);
  r.T0 = 0.8 * r.T0max;
  var c = 2 * r.hsm + r.Ac / r.lc;
  r.Ts = r.Tr + 1.22 * (r.T0 - r.Tr) * c / r.lc * (1 - Math.exp(-0.58 * r.lc / c));
  r.Gsm = r.k * r.Ad * Math.sqrt(r.Hd); r.tsm = r.Ts - 273.15; r.ro = vnRho(r.tr) * r.Tr / r.Ts; r.Lsm = 3600 * r.Gsm / r.ro;
  if (r.T0 < r.Tr) r.warn.push('T0 по (15) получилась ниже Tr — проверь исходные данные пожарной нагрузки.');
  return r;
}
function corCalc() {
  if (!$('#co-q')) return;
  var r = corCompute(), f = dpuFmt; VN.cor = r;
  vnRes('co-res', r, r.err.length ? '' :
    vnC('Удалять дыма Gsm', f(r.Gsm, 3) + ' кг/с', '(17): ' + f(r.k, 1) + ' · ' + f(r.Ad, 2) + ' · ' + f(r.Hd, 2) + '^0,5.', 'final') +
    vnC('Объёмный расход', f(r.Lsm, 0) + ' м³/ч', 'При Tsm, ρsm = ' + f(r.ro, 3) + ' кг/м³.', 'final') +
    vnC('Tsm — слой в коридоре', f(r.tsm, 0) + ' °C', '(16) при T0 = ' + f(r.T0 - 273.15, 0) + ' °C — газы из горящего помещения, (15).') +
    vnC('Вид пожара', r.prv ? 'ПРВ' : 'ПРН', (r.prv ? 'регулируемый вентиляцией' : 'регулируемый нагрузкой') + ': gk = ' + f(r.gk, 2) + (r.prv ? ' > ' : ' ≤ ') + 'gkкр = ' + f(r.gkr, 2) + ' кг/м²; T0max = ' + f(r.T0max - 273.15, 0) + ' °C по (' + (r.prv ? '13' : '14') + ').') +
    vnC('Нагрузка', 'g0 = ' + f(r.g0, 1), 'кг/м² к площади пола; П = ' + f(r.P, 4) + ' м^1/2, V0 = ' + f(r.V0, 2) + ' м³/кг.'));
  fcApply('co-', r.marks);
}
function corDoc() {
  var r = VN.cor; if (!r || r.err.length) return; var f = dpuFmt;
  var body = '<h2>Исходные данные</h2>' + vnTable(['Параметр', 'Значение'], [['Q, МДж/кг; M, кг', f(r.Q, 1) + '; ' + f(r.M, 0)], ['Ff, м²; V, м³; ΣA0, м²; h0, м', f(r.Ff, 1) + '; ' + f(r.V, 1) + '; ' + f(r.A0, 2) + '; ' + f(r.h0, 2)],
    ['Коридор Ac, м²; lc, м; H, м; hsm, м', f(r.Ac, 1) + '; ' + f(r.lc, 1) + '; ' + f(r.H, 2) + '; ' + f(r.hsm, 2)], ['Дверь Ad, м²; Hd, м; ksm', f(r.Ad, 2) + '; ' + f(r.Hd, 2) + '; ' + f(r.k, 1)], ['Tr, °C', f(r.tr, 1)]]) +
    '<h2>Расчёт</h2><p>g<sub>0</sub> = ' + f(r.g0, 2) + ' кг/м²; F<sub>w</sub> = 6V<sup>2/3</sup> = ' + f(r.Fw, 2) + ' м²; g<sub>k</sub> = ' + f(r.gk, 2) + ' кг/м²; П = ' + f(r.P, 4) + '; V<sub>0</sub> = ' + f(r.V0, 3) + ' м³/кг; g<sub>kкр</sub> = ' + f(r.gkr, 2) + ' кг/м² → ' + (r.prv ? 'ПРВ' : 'ПРН') + '.</p>' +
    '<p>T<sub>0max</sub> = ' + f(r.T0max, 1) + ' К по (' + (r.prv ? '13' : '14') + '); T<sub>0</sub> = 0,8T<sub>0max</sub> = ' + f(r.T0, 1) + ' К; по (16) T<sub>sm</sub> = ' + f(r.Ts, 1) + ' К (' + f(r.tsm, 1) + ' °C).</p>' +
    '<p><b>(17): G<sub>sm</sub> = ' + f(r.Gsm, 3) + ' кг/с; L = ' + f(r.Lsm, 0) + ' м³/ч при ρ<sub>sm</sub> = ' + f(r.ro, 3) + ' кг/м³.</b></p>';
  vnDoc('Расход продуктов горения из коридора (холла)', body, 'Расчёт_дым_коридор');
}

/* ---------- 3.2.2 атриум, вестибюль, молл с проёмом горящего помещения ---------- */
function atrBlock() {
  var F = dpuF;
  return '<p class="sub">Вестибюль на 2 и более уровня, молл, атриум, куда дым идёт из проёма горящего помещения: колонка по (18), температура слоя — по (4).</p>' +
    vnGrp('Проём горящего помещения — (18)', F('at-aw', 'Aw — площадь проёма, м²', '6', 'any') + F('at-hw', 'Hw — высота проёма, м', '2.5', 'any') + F('at-zw', 'Zw — от верха проёма до низа слоя, м', '6', 'any')) +
    vnGrp('Защищаемый объём — (4)', F('at-a', 'Длина a, м', '30', 'any') + F('at-b', 'Ширина b, м', '20', 'any') + F('at-h', 'h — толщина дымового слоя, м', '3', 'any') +
      F('at-qf', 'Qf — мощность очага, кВт', '2000', 'any', 'из вкладки «Дым из помещения» или своё') + F('at-r', 'r — доля без потерь на излучение', '0.7', 'any', 'пример; в МР значения нет') + F('at-tr', 'Tr — воздух, °C', '20', 'any')) +
    '<div class="barres stres" id="at-res"></div>' + vnBtns('atr', '<button type="button" class="eibtn" id="at-take">Взять Qf из вкладки «Дым из помещения»</button>') +
    '<details class="issue dpf"><summary>Формулы</summary><div><p>(18) G<sub>k</sub> = 0,68(A<sub>w</sub>H<sub>w</sub><sup>1/2</sup>)<sup>1/3</sup>(Z<sub>w</sub> + a)<sup>5/3</sup> + 1,59A<sub>w</sub>H<sub>w</sub><sup>1/2</sup>; a = 2,4A<sub>w</sub><sup>2/5</sup>H<sub>w</sub><sup>1/5</sup> − 2,1H<sub>w</sub>. G<sub>sm</sub> = G<sub>k</sub>; T<sub>sm</sub> — по (4).</p></div></details>' +
    refs([['mr7', '3.2.2']]);
}
function atrCompute() {
  var n = dpuNum, r = { Aw: n('at-aw'), Hw: n('at-hw'), Zw: n('at-zw'), a: n('at-a'), b: n('at-b'), h: n('at-h'), Qf: n('at-qf'), r: n('at-r'), tr: n('at-tr'), err: [], warn: [], marks: [], at: Date.now() };
  fcNums([['at-aw', '', 0, null, true], ['at-hw', '', 0, null, true], ['at-zw', '', 0, null, true], ['at-a', '', 0, null, true], ['at-b', '', 0, null, true], ['at-h', '', 0, null, true], ['at-qf', '', 0, null, true], ['at-r', '', 0, 1, true], ['at-tr', '', -40, 60]], r.marks);
  if (vnBad(r)) return r;
  r.aa = 2.4 * Math.pow(r.Aw, 0.4) * Math.pow(r.Hw, 0.2) - 2.1 * r.Hw;
  var c = r.Aw * Math.sqrt(r.Hw);
  if (r.Zw + r.aa <= 0) { r.err.push('Zw + a ≤ 0 — формула (18) неприменима: увеличь Zw.'); return r; }
  r.Gk = 0.68 * Math.pow(c, 1 / 3) * Math.pow(r.Zw + r.aa, 5 / 3) + 1.59 * c; r.Gsm = r.Gk;
  r.Tr = r.tr + 273.15; var t = exhTsm(r.r * r.Qf, r.Gk, r.h, 2 * (r.a + r.b), r.a * r.b, r.Tr);
  r.Ts = t.Ts; r.tsm = r.Ts - 273.15; r.ro = vnRho(r.tr) * r.Tr / r.Ts; r.Lsm = 3600 * r.Gsm / r.ro;
  return r;
}
function atrCalc() {
  if (!$('#at-aw')) return;
  var r = atrCompute(), f = dpuFmt; VN.atr = r;
  vnRes('at-res', r, r.err.length ? '' :
    vnC('Удалять дыма Gsm', f(r.Gsm, 3) + ' кг/с', '(18): a = ' + f(r.aa, 3) + ' м.', 'final') + vnC('Объёмный расход', f(r.Lsm, 0) + ' м³/ч', 'ρsm = ' + f(r.ro, 3) + ' кг/м³.', 'final') +
    vnC('Tsm', f(r.tsm, 0) + ' °C', 'По (4) при rQf = ' + f(r.r * r.Qf, 0) + ' кВт.'));
  fcApply('at-', r.marks);
}
function atrDoc() {
  var r = VN.atr; if (!r || r.err.length) return; var f = dpuFmt;
  vnDoc('Расход продуктов горения из атриума (вестибюля)', '<h2>Исходные данные</h2>' + vnTable(['Параметр', 'Значение'], [['Aw, м²; Hw, м; Zw, м', f(r.Aw, 2) + '; ' + f(r.Hw, 2) + '; ' + f(r.Zw, 2)], ['a × b, м; h, м', f(r.a, 1) + ' × ' + f(r.b, 1) + '; ' + f(r.h, 2)], ['Qf, кВт; r; Tr, °C', f(r.Qf, 0) + '; ' + f(r.r, 2) + '; ' + f(r.tr, 1)]]) +
    '<h2>Расчёт</h2><p>a = 2,4A<sub>w</sub><sup>2/5</sup>H<sub>w</sub><sup>1/5</sup> − 2,1H<sub>w</sub> = ' + f(r.aa, 3) + ' м; (18): <b>G<sub>sm</sub> = G<sub>k</sub> = ' + f(r.Gsm, 3) + ' кг/с</b>; по (4) T<sub>sm</sub> = ' + f(r.tsm, 1) + ' °C; L = ' + f(r.Lsm, 0) + ' м³/ч.</p>', 'Расчёт_дым_атриум');
}
document.addEventListener('change', function (e) {
  var m = /^(ex|co)-mat$/.exec(e.target.id); if (!m) return;
  var x = VN_LOAD[+e.target.value]; $('#' + m[1] + '-q').value = x[1]; if (m[1] === 'ex') $('#ex-psi').value = x[3];
  window[m[1] === 'ex' ? 'exhCalc' : 'corCalc']();
});
document.addEventListener('click', function (e) {
  if (e.target.id === 'at-take') { var r = VN.exh; if (!r || r.err.length) { alert('Сначала посчитай вкладку «Дым из помещения».'); return; } $('#at-qf').value = Math.round(r.Qf); $('#at-r').value = r.r; atrCalc(); }
});
