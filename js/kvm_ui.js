/* Раздел «Расчёт ПДВ» — расчёт системы целиком (дымоудаление, лестничная клетка, лифтовая шахта) по схеме, совместимой с «КВМ-Дым».
   1.21.3: открытие проектов КВМ убрано по указанию инженера (его отчёты — только эталон сверки). Форма исходных данных, поэтажная сеть, отчёт с формулами, Word.
   Ядра: kvm_smk.js (вытяжная), kvm_sup.js (приточная). Общие помощники — vn_core.js (vnC, vnTable, vnDoc), dpu.js (dpuFmt). */
var KV = { mode: 'smk', p: null, o: null, file: '' };
try { KV.mode = localStorage.getItem('klapany-kv-mode') || 'smk'; } catch (x) {}
var kf = function (v, n) { return dpuFmt(v, n === undefined ? 2 : n); };

/* ---------- значения по умолчанию (пример — коридор из отчёта, 15 этажей) ---------- */
function kvDefSmk() {
  var segs = [];
  for (var i = 0; i < 15; i++) segs.push({ vw: 800, vh: 300, nodeZ: 3.5, hA: 0.8, hB: 0.3, hL: i === 14 ? 0 : 1, hZ: 0, vA: 0.8, vB: 0.3, vL: 3, vZ: i === 0 || i === 14 ? 0 : 0.09 });
  return { name: 'Коридор', system: 'ДУ1', variant: 0, living: false, L: 5.2, W: 3.77, H: 2.4, Ff: 19.6, doors: [[0.9, 2.1], [2.3, 2.4]], hNz: 1.15, tr: 22, Fo: 9,
    qp: 600, Q: 14, v: 0.015, psi: 0.0137, cL: 43.43, cA: 112.8, dA: 1.89, dH: 2.1, cH: 2.3, eta: 0.8, r: 0.75, tOut: 28, tComp: -13, wind: 6.2,
    segs: segs, typ: kvTypDef(), segMode: 'typ', comp: window.compDef ? compDef() : null, Skl: 11000, eps: 0.0001, endExhaust: false, ductRes: 100, vOut: 20, dpuH: 2.3, dpuW: 800, dpuB: 400, dpuType: 2 };
}
function kvDefStair() {
  return { kind: 'stair', name: 'Лестничная клетка Н2', system: 'ПД1', windows: true, outerExit: true, noFloor1: false, floorTamb: false, N: 15, h1: 3.9, hf: 3.15, p: 1,
    Gsm: 4.76, Fs: 30.3, xis: 60, Fda: 1.8, hda: 2.1, nd: 1, xid: 2.44, xir: 4, Fd: 1.8, hd: 2.1, gasProof: false, Sd: 0, Fw: 3.75, winVar: 1, winVal: 3,
    Pplus: 20, h0: 15, duct: { a: 800, b: 600, rect: false, len: 20, eps: 0.1, xi: 2 }, air: { ta: -13, tr: 18, va: 6.2, kww: 0.8, kw0: -0.6 } };
}
function kvDefLift() {
  return { kind: 'lift', name: 'Лифтовая шахта', system: 'ПД2', outer: true, hall1: true, hallUp: true, hallUG: false, method: 0, N: 14, h2: 3.9, hf: 3.15, NUG: 0, hUG: 3,
    Fdl: 1.8, Fdr: 1.8, hdl: 2, nc: 1, m: 1, xil: 0, xid: 2.44, Fk: 2.5, Fls: 4.25, Sdl: 0, Sdr: 0, muGap: 0.65,
    Pplus: 20, h0: 3, duct: { a: 800, b: 800, rect: true, len: 2.33, eps: 0.1, xi: 2 }, air: { ta: -13, tr: 18, va: 6.2, kww: 0.8, kw0: -0.6 } };
}
function kvDef(m) { return m === 'stair' ? kvDefStair() : m === 'lift' ? kvDefLift() : m === 'tamb' && window.tbDef ? tbDef() : kvDefSmk(); }

/* ---------- схема полей: [путь, подпись, тип, подсказка] ---------- */
var KV_F = {
  smk: [
    ['Объект', [['name', 'Проект', 't'], ['system', 'Система', 't'], ['variant', 'Вариант', [[0, 'коридор, холл — смежные с горящим (МР 3.2.1)'], [2, 'зал, атриум — из горящего помещения (МР 3.1.1)']]],
      ['living', 'Здание', [[false, 'общественное — ksm = 1,2'], [true, 'жилое — ksm = 1,0']]], ['tr', 'tr — воздух в помещении, °C'], ['hNz', 'Hнз — высота незадымляемой зоны, м', '', 'низ дымового слоя от пола']]],
    ['Горящее помещение', [['L', 'Длина a, м'], ['W', 'Ширина b, м'], ['H', 'Высота h, м'], ['Ff', 'Площадь пола, м² (зал)'], ['doorsTxt', 'Проёмы B×H, м', 't', 'через «;», например 0,9x2,1; 2,3x2,4'],
      ['qp', 'qп — удельная пожарная нагрузка, МДж/м²', '', 'коридор: g0 = qп/13,8'], ['Q', 'Qн — теплота сгорания, МДж/кг'], ['psi', 'ψ — скорость выгорания, кг/(м²·с)', '', 'зал'],
      ['Fo', 'Fo — площадь очага, м²', '', 'зал'], ['eta', 'η — полнота сгорания', '', 'зал'], ['r', 'r — коэффициент теплопотерь на излучение', '', 'зал']]],
    ['Коридор', [['cL', 'lc — длина, м'], ['cA', 'Ac — площадь, м²'], ['cH', 'hк — высота потолка, м'], ['dA', 'Ad — площадь двери выхода, м²'], ['dH', 'Hd — высота двери, м']]],
    ['Наружный воздух', [['tOut', 'tн — летом (расчёт дыма), °C'], ['tComp', 'tн — зимой (компенсация), °C'], ['wind', 'Скорость ветра, м/с']]],
    ['Клапаны и выброс', [['Skl', 'Sкл — сопротивление газопроницанию закрытого клапана, м³/кг', '', '11000 — по умолчанию; по МР прил. 3 — 29300…38300'], ['eps', 'ε — шероховатость, м', '', 'металл 0,0001'],
      ['endExhaust', 'Выброс', [[false, 'на кровлю'], [true, 'на фасад — + сопротивление и 0,5ρv²']]], ['ductRes', 'Сопротивление воздуховодов до выброса, Па'], ['vOut', 'Скорость выброса на фасад, м/с']]],
    ['Дымоприёмное устройство', [['dpuH', 'Нижняя точка ДПУ от пола, м'], ['dpuW', 'ДПУ: a, мм'], ['dpuB', 'ДПУ: b, мм'],
      ['dpuType', 'Расположение', [[0, 'горизонтально, дальше 2D от стены — γ = 1'], [1, 'горизонтально, ближе 2D к стене — γ = 0,5'], [2, 'вертикально — γ = 0,5']]]]]
  ],
  stair: [
    ['Объект', [['name', 'Проект', 't'], ['system', 'Система', 't']]],
    ['Условия', [['windows', 'Окна', [[true, 'у наружной стены, окна на каждом этаже'], [false, 'без окон (ядро)']]], ['outerExit', 'Наружный выход', [[true, 'обособленный'], [false, 'нет']]],
      ['noFloor1', 'Связь с 1-м этажом', [[false, 'через одинарную дверь — (33), (34)'], [true, 'нет или через тамбур-шлюз — (23), (24)']]], ['floorTamb', 'Поэтажные выходы', [[false, 'одинарные двери'], [true, 'через тамбур-шлюзы — без утечек']]]]],
    ['Здание', [['N', 'Надземных этажей'], ['h1', 'Высота 1-го этажа, м'], ['hf', 'Высота вышележащих этажей, м'], ['p', 'Лестничных клеток в коридор']]],
    ['Воздух', [['air.ta', 'ta — наружный (зима), °C'], ['air.tr', 'tr — в здании, °C'], ['air.va', 'va — ветер, м/с'], ['air.kww', 'Kww — наветренный'], ['air.kw0', 'Kw0 — заветренный'], ['Gsm', 'Gsm — удаляется дыма с этажа, кг/с']]],
    ['Лестничная клетка', [['Fs', 'Fs — проекция маршей и площадок, м²'], ['xis', 'ξs — КМС маршей'], ['Fda', 'Fda — дверь наружного выхода, м²'], ['hda', 'hda — её высота, м'], ['nd', 'n — дверей подряд в выходе'],
      ['xid', 'ξd — КМС дверного проёма'], ['xir', 'ξr — КМС тамбура выхода', '', 'прямой 0, прямоугольный 0,99, z-образный 2,9–4'], ['Fd', 'Fd — дверь на этаже, м²'], ['hd', 'hd — её высота, м'],
      ['gasProof', 'Двери на этажах', [[false, 'обычные: 5300/ρs'], [true, 'дымогазонепроницаемые: 60000/ρs']]], ['Sd', 'Sd по паспорту, м³/кг (0 — по МР)'], ['Fw', 'Окно на этаже, м²'],
      ['winVar', 'Воздухопроницаемость окон задана', [[1, 'ΔQ100, м³/(ч·м²)'], [0, 'ΔG10, кг/(ч·м²)'], [2, 'R10'], [3, 'R100']]], ['winVal', 'Значение воздухопроницаемости']]],
    ['Вентилятор', [['Pplus', 'P+ — избыточное давление, Па'], ['h0', 'h0s — от воздухозабора до оголовка, м']]]
  ],
  lift: [
    ['Объект', [['name', 'Проект', 't'], ['system', 'Система', 't']]],
    ['Условия', [['outer', 'Шахта', [[true, 'у наружной стены — ветер в расчёте'], [false, 'в центральном ядре']]], ['hall1', 'Холл на основном посадочном этаже', [[true, 'выгорожен — (50)'], [false, 'нет — (44)']]],
      ['hallUp', 'Холлы на вышележащих этажах', [[true, 'выгорожены'], [false, 'нет']]], ['method', 'Метод', [[0, 'по расходу в открытом проёме по МР'], [1, 'приток только сверху, потери в зазоре кабины']]]]],
    ['Здание', [['N', 'Надземных этажей'], ['h2', 'Отметка 2-го этажа, м'], ['hf', 'Высота вышележащих этажей, м'], ['NUG', 'Подземных этажей'], ['hUG', 'Высота подземных этажей, м']]],
    ['Воздух', [['air.ta', 'ta — наружный (зима), °C'], ['air.tr', 'tr — в здании, °C'], ['air.va', 'va — ветер, м/с'], ['air.kww', 'Kww — наветренный'], ['air.kw0', 'Kw0 — заветренный']]],
    ['Шахта', [['Fdl', 'Fdl — двери шахты, м²'], ['hdl', 'hdl — их высота, м'], ['nc', 'n — кабин'], ['Fdr', 'Fdr — дверь холла, м²'], ['m', 'm — дверей холла'], ['xid', 'ξd — КМС двери холла'],
      ['Fk', 'Fk — сечение кабины, м²'], ['Fls', 'Fls — сечение шахты, м²'], ['xil', 'ξl (0 — по (45): 4,3 + Fk/Fls)'], ['muGap', 'μ зазора кабина–шахта'], ['Sdl', 'Sdl по паспорту (0 — 2600/ρl)'], ['Sdr', 'Sdr по паспорту (0 — 5300/ρl)']]],
    ['Вентилятор', [['Pplus', 'P+ — избыточное давление, Па'], ['h0', 'h0l — от воздухозабора до оголовка, м']]]
  ]
};
function kvGet(p, k) { return k.split('.').reduce(function (a, x) { return a == null ? a : a[x]; }, p); }
function kvSet(p, k, v) { var a = k.split('.'), o = p; for (var i = 0; i < a.length - 1; i++) o = o[a[i]]; o[a[a.length - 1]] = v; }
function kvDoorsTxt(d) { return (d || []).map(function (x) { return String(x[0]).replace('.', ',') + 'x' + String(x[1]).replace('.', ','); }).join('; '); }
function kvDoorsParse(s) { return String(s).split(/[;\n]/).map(function (x) { var m = x.replace(/,/g, '.').match(/([\d.]+)\s*[xх×*]\s*([\d.]+)/i); return m ? [+m[1], +m[2]] : null; }).filter(Boolean); }

/* ---------- 1.21.6: сеть «типовой этаж × N» — из полей собирается тот же массив p.segs, ядро smkCalc не меняется ---------- */
function kvTypDef() { return { n: 15, vw: 800, vh: 300, zkl: '', nodeZ: 3.5, hA: 0.8, hB: 0.3, hL: 1, hZ: 0, vA: 0.8, vB: 0.3, vL: 3, vZ: 0.09, z1: 0, topL: 3, topZ: 0 }; }
function kvBuildSegs(t) {
  var n = Math.max(1, Math.round(+t.n || 1)), a = [];
  for (var i = 0; i < n; i++) {
    var s = { vw: +t.vw, vh: +t.vh, nodeZ: +t.nodeZ, hA: +t.hA, hB: +t.hB, hL: +t.hL, hZ: +t.hZ, vA: +t.vA, vB: +t.vB, vL: +t.vL, vZ: +t.vZ };
    if (t.zkl !== '' && isFinite(+t.zkl)) s.zkl = +t.zkl;
    if (i === 0) s.vZ = +t.z1;
    if (i === n - 1 && n > 1) { s.hL = 0; s.vL = +t.topL; s.vZ = +t.topZ; }
    a.push(s);
  }
  return a;
}
var KV_TYP = [
  ['Сеть: типовой этаж', [['typ.n', 'Участков сети (этажей), шт.', '', 'снизу вверх: 1-й — этаж пожара, последний — до вентилятора'],
    ['typ.vw', 'Клапан a, мм'], ['typ.vh', 'Клапан b, мм'], ['typ.zkl', 'ζкл клапана', '', 'пусто — по типоразмеру'], ['typ.nodeZ', 'ζ узла присоединения'],
    ['typ.hA', 'Горизонталь a, м'], ['typ.hB', 'Горизонталь b, м'], ['typ.hL', 'Горизонталь L, м'], ['typ.hZ', 'Горизонталь Σζ'],
    ['typ.vA', 'Вертикаль a, м'], ['typ.vB', 'Вертикаль b, м'], ['typ.vL', 'Вертикаль L (высота этажа), м'], ['typ.vZ', 'Вертикаль Σζ']]],
  ['Отличия крайних участков', [['typ.z1', '1-й участок (этаж пожара): Σζ вертикали'], ['typ.topL', 'Верхний участок: L вертикали до вентилятора, м', '', 'горизонтали на нём нет'], ['typ.topZ', 'Верхний участок: Σζ вертикали']]]
];
/* 1.24.1: компактная форма — поля, ненужные выбранному варианту, скрыты (коридор: двери, qп, коридор; зал: площадь пола, очаг, ψ, η, r);
   переключатели до 4 вариантов — радиокнопками, видны сразу. Смена поля из KV_REDRAW перерисовывает форму. */
var KV_HALL = function (p) { return +p.variant === 2; }, KV_COR = function (p) { return +p.variant === 0; };
var KV_VIS = { smk: { living: KV_COR, doorsTxt: KV_COR, qp: KV_COR, cL: KV_COR, cA: KV_COR, cH: KV_COR, dA: KV_COR, dH: KV_COR,
  Ff: KV_HALL, psi: KV_HALL, Fo: KV_HALL, eta: KV_HALL, r: KV_HALL,
  ductRes: function (p) { return !!p.endExhaust; }, vOut: function (p) { return !!p.endExhaust; } } };
var KV_REDRAW = { variant: 1, endExhaust: 1 };
function kvVis(p, k) { var m = KV_VIS[KV.mode], f = m && m[k]; return !f || f(p); }
function kvField(p, f) {
  var id = 'kv-' + f[0].replace('.', '_'), v = f[0] === 'doorsTxt' ? kvDoorsTxt(p.doors) : kvGet(p, f[0]), hid = kvVis(p, f[0]) ? '' : ' hidden';
  if (Array.isArray(f[2]) && f[2].length <= 4) return '<div class="stf kvrad"' + hid + '><label for="' + id + '">' + f[1] + '</label><div class="kvrg">' +
    f[2].map(function (o, i) { return '<label class="kvro"><input type="radio" name="' + id + '" id="' + id + (i ? '_' + i : '') + '" data-kv="' + f[0] + '" value="' + o[0] + '"' + (String(o[0]) === String(v) ? ' checked' : '') + '><span>' + o[1] + '</span></label>'; }).join('') + '</div></div>';
  if (Array.isArray(f[2])) return '<div class="stf kvsel"' + hid + '><label for="' + id + '">' + f[1] + '</label><select id="' + id + '" data-kv="' + f[0] + '">' +
    f[2].map(function (o) { return '<option value="' + o[0] + '"' + (String(o[0]) === String(v) ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div>';
  return '<div class="stf' + (f[2] === 't' ? ' kvtxt' : '') + '"' + hid + '><label for="' + id + '">' + f[1] + '</label><input id="' + id + '" data-kv="' + f[0] + '" ' + (f[2] === 't' ? 'type="text"' : 'type="number" step="any" inputmode="decimal"') +
    ' value="' + (v == null || (typeof v === 'number' && !isFinite(v)) ? '' : String(v).replace(/"/g, '&quot;')) + '">' + (f[3] ? '<small class="dhint">' + f[3] + '</small>' : '') + '</div>';
}
function kvCompForm() {
  var p = KV.p; if (!window.KV_COMP) return '';
  if (!p.comp) p.comp = compDef();
  return '<h3 class="nh">' + KV_COMP[0] + '</h3><div class="trpick stpick">' + KV_COMP[1].map(function (f) { return kvField(p, f); }).join('') + '</div>';
}
function kvTypForm() {
  var p = KV.p;
  if (!p.typ) { p.typ = kvTypDef(); p.segMode = 'typ'; p.segs = kvBuildSegs(p.typ); }
  return KV_TYP.map(function (g) { return '<h3 class="nh">' + g[0] + '</h3><div class="trpick stpick">' + g[1].map(function (f) { return kvField(p, f); }).join('') + '</div>'; }).join('') +
    '<details class="issue kvsegd"' + (p.segMode === 'table' ? ' open' : '') + '><summary>Таблица участков — для исключений' +
    (p.segMode === 'table' ? ' (правлена вручную: считается по таблице)' : ' (собрана из типового этажа)') + '</summary><div id="kv-segs">' + kvSegs() + '</div></details>';
}

function kvForm() {
  var p = KV.p, h = '';
  if (!KV_F.tamb && window.TB_F) KV_F.tamb = TB_F;
  if (window.kmsEnsure) kmsEnsure(KV.mode, p);
  KV_F[KV.mode].forEach(function (g, gi) {
    if (gi === 1 && window.kmsClimForm) h += kmsClimForm(KV.mode, p);
    var all = g[1].every(function (f) { return !kvVis(p, f[0]); });
    h += '<section class="kvgrp"' + (all ? ' hidden' : '') + '><h3 class="nh">' + g[0] + '</h3><div class="trpick stpick">' + g[1].map(function (f) { return kvField(p, f); }).join('') + '</div></section>';
  });
  if (KV.mode === 'smk') h += kvTypForm();
  if (window.kmsForm) h += kmsForm(KV.mode, p);
  if (KV.mode === 'smk') { h += kvCompForm(); if (window.kmsBox && p.compNet && (!p.comp || p.comp.on)) h += kmsBox('compNet', 'Сеть компенсирующей подачи (ДП)', p.compNet); }
  return h;
}
var KV_SEGC = [['vw', 'Клапан a, мм'], ['vh', 'b, мм'], ['zkl', 'ζкл'], ['nodeZ', 'ζ узла'], ['hA', 'Гориз. a, м'], ['hB', 'b, м'], ['hL', 'L, м'], ['hZ', 'Σζ'], ['vA', 'Верт. a, м'], ['vB', 'b, м'], ['vL', 'L, м'], ['vZ', 'Σζ']];
function kvSegs() {
  var p = KV.p;
  return '<p class="sub">Участки снизу вверх: 1-й — на этаже пожара (клапан открыт), последний — только вертикаль до вентилятора. Правка строки переводит расчёт на таблицу.</p>' +
    '<div class="dpbtns"><button type="button" class="eibtn" id="kv-retyp">Пересобрать таблицу из типового этажа</button></div>' +
    (window.kmszSegBar ? kmszSegBar() : '') +
    '<div class="tscroll"><table class="vei kvseg"><thead><tr>' + (window.kmszSegBar ? '<th><input type="checkbox" class="kvsel-all" title="Выбрать все участки"' + (KV.sel && KV.sel.length === p.segs.length ? ' checked' : '') + '></th>' : '') + '<th>№</th>' + KV_SEGC.map(function (c) { return '<th>' + c[1] + '</th>'; }).join('') + '<th></th></tr></thead><tbody>' +
    p.segs.map(function (s, i) {
      var on = KV.sel && KV.sel.indexOf(i) >= 0;
      return '<tr' + (on ? ' class="on"' : '') + '>' + (window.kmszSegBar ? '<td><input type="checkbox" class="kvsel" data-seg="' + i + '"' + (on ? ' checked' : '') + ' aria-label="Выбрать участок ' + (i + 1) + '"></td>' : '') + '<td>' + (i + 1) + '</td>' + KV_SEGC.map(function (c) {
        var v = c[0] === 'zkl' ? (isFinite(s.zkl) ? s.zkl : '') : s[c[0]], els = s[c[0] + 'Els'];
        return '<td><input class="kvc" data-seg="' + i + '" data-c="' + c[0] + '" type="number" step="any" value="' + (v == null ? '' : v) + '"' + (c[0] === 'zkl' ? ' placeholder="' + (isFinite(smkZkl(s.vw, s.vh)) ? smkZkl(s.vw, s.vh) : 'паспорт') + '"' : '') + (els && els.length ? ' title="собрано из ' + els.length + ' эл."' : '') + '>' + (els && els.length ? '<span class="kvels" title="собрано из элементов">◆</span>' : '') + '</td>';
      }).join('') + '<td><button type="button" class="eibtn kvdel" data-seg="' + i + '" title="Удалить участок">×</button></td></tr>';
    }).join('') + '</tbody></table></div>' +
    '<div class="dpbtns"><button type="button" class="eibtn" id="kv-add">+ участок (копия последнего с клапаном)</button>' +
    '<span class="tnote">ζкл пусто — по типоразмеру клапана (800×300 — 0,53; 800×400 — 0,35; 1350×450 — 0,26; 1500×800 — 0,19), иначе — по паспорту клапана. Проходное сечение — (a − 50)·(b − 50).</span></div>';
}

PAGES.pdv = (function (old) {
  return function () {
    if (!KV.p) KV.p = kvDef(KV.mode);
    return '<h1>Расчёт противодымной вентиляции</h1><p class="lead">Система целиком по методике ВНИИПО к СП 7.13130: введи данные системы — получишь подачу и давление вентилятора, отчёт с формулами и Word.</p>' +
      '<div class="vntabs" role="tablist">' + [['smk', 'Дымоудаление', 'коридор, зал'], ['stair', 'Лестничная клетка', 'подпор, п. 4.1'], ['lift', 'Лифтовая шахта', 'подпор, п. 4.2'], ['tamb', 'Тамбур-шлюз', 'подпор, зона безопасности']].map(function (t) {
        return '<button type="button" data-kvm="' + t[0] + '"' + (t[0] === KV.mode ? ' class="on"' : '') + '>' + t[1] + '<small>' + t[2] + '</small></button>'; }).join('') + '</div>' +
      '<div class="dpbtns"><button type="button" class="eibtn" id="kv-new">Новый (пример)</button><button type="button" class="eibtn" id="kv-doc">Скачать отчёт в Word</button>' + (window.kvfBtns ? kvfBtns() : '') + '</div>' +
      (window.kvpBlock ? '<div id="kvp">' + kvpBlock() + '</div>' : '') +
      '<div class="kvlay"><div class="kvL" id="kv-form">' + kvForm() + '</div><aside class="kvR"><div class="kvRh">Результат</div><div class="barres stres" id="kv-res"></div>' + kvDlBtns() +
      '<a class="kvgo" href="#kv-rep">К отчёту с формулами ↓</a></aside></div><div id="kv-rep"></div>' + kvDlBtns() +
      '<details class="issue"><summary>Отдельные расчёты по формулам МР (прежние вкладки)</summary><div>' + old().replace(/^<h1>[\s\S]*?<\/p>/, '') + '</div></details>';
  };
})(PAGES.pdv);

/* 1.23.0: расчёт любой системы по виду — для формы и для проекта «все системы» (kvm_proj.js) */
function kvRun(mode, p) {
  var o;
  if (window.kmsEnsure) kmsEnsure(mode, p);
  try { o = mode === 'smk' ? smkCalc(p) : mode === 'stair' ? supStair(p) : mode === 'tamb' ? tbCalc(p) : supLift(p); } catch (e) { o = { err: ['Ошибка расчёта: ' + e.message], warn: [] }; }
  if (mode === 'smk' && window.compCalc && isFinite(o.Lv)) { try { compCalc(p, o); } catch (x) { o.warn.push('Компенсация: ошибка расчёта — ' + x.message); } }
  return o;
}
/* 1.23.3: кнопки скачивания рядом с результатом и в конце отчёта (инженер: «где скачать расчёт?») */
/* картинки для Word: схема системы (pdvScheme, kvm_scheme.js) и объёмная схема (pdv3d) — по очереди, PNG */
function kvImgs(mode, p, o, cb) {
  var list = [], out = [];
  if (window.pdvScheme) { try { var s2 = pdvScheme(mode, p, o); if (s2) list.push({ title: 'Схема системы ' + esc(p.system || ''), svg: s2, w: 600, note: 'Схема по расчёту: участки, расходы и давления — из таблиц расчёта.' }); } catch (x) {} }
  var svg3 = ''; if (window.pdv3d) { try { svg3 = pdv3d(mode, p, o); } catch (x) {} }
  var next = function (i) {
    if (i >= list.length || !window.pdv3dPng) {
      /* 1.24.0: объёмная схема — рендер WebGL; нет WebGL — прежняя SVG */
      var t3 = 'Объёмная схема ' + esc(p.system || '');
      var old3 = function () { if (!svg3 || !window.pdv3dPng) return cb(out); pdv3dPng(svg3, function (png) { var vb = /viewBox="[\d.\s-]*?\s([\d.]+)\s([\d.]+)"/.exec(svg3); out.push({ title: t3, png: png, ar: vb ? +vb[2] / +vb[1] : 0 }); cb(out); }); };
      if (window.pdv3rPng) pdv3rPng(mode, p, o, function (u) { if (u) { out.push({ title: t3, png: u, ar: 960 / 1360, note: 'Цвет шахты и воздуховодов — скорость (до 9 м/с зелёный, 9–11 жёлтый, 11–15 оранжевый, больше 15 красный; МР ВНИИПО п. 5.1.1). Схема по расчёту, не чертёж.' }); cb(out); } else old3(); });
      else old3();
      return;
    }
    pdv3dPng(list[i].svg, function (png) { var vb = /viewBox="[\d.\s-]*?\s([\d.]+)\s([\d.]+)"/.exec(list[i].svg); out.push({ title: list[i].title, png: png, note: list[i].note, w: list[i].w, ar: vb ? +vb[2] / +vb[1] : 0 }); next(i + 1); });
  };
  next(0);
}
function kvDlBtns() { return '<div class="dpbtns kvdl"><button type="button" class="eibtn on kv-doc">Скачать расчёт в Word</button>' + (window.kvpBlock ? '<button type="button" class="eibtn kvp-save">В проект «все системы»</button>' : '') + (window.kvfBtns ? kvfBtns() : '') + '</div>'; }
function kvCalc() {
  if (!$('#kv-form')) return;
  var p = KV.p, o = kvRun(KV.mode, p);
  KV.o = o;
  if (window.kvpAuto) kvpAuto();
  var h = '';
  if (o.err && o.err.length) h += o.err.map(function (e) { return vnC('Ошибка', 'Проверь данные', e, 'warn'); }).join('');
  if (isFinite(o.Lv)) {
    h += vnC('Вентилятор: подача', kf(o.Lv, 0) + ' м³/ч', KV.mode === 'smk' ? 'Lv = GШ/ρN·3600 = ' + kf(o.GN, 4) + ' / ' + kf(o.roN, 4) + ' · 3600; t перед вентилятором ' + kf(o.tFan, 0) + ' °C' : 'Lv = 3600·G/ρa = 3600 · ' + kf(o.Gs || o.Gl, 2) + ' / ' + kf(o.roa, 2), 'final');
    h += vnC('Вентилятор: давление', kf(o.Psv, KV.mode === 'smk' ? 2 : 0) + ' Па', KV.mode === 'smk' ? 'Psv = |PШN| + ΔPШ' + (o.Pvf ? ' + Pd + 0,5ρN·vf²' : '') : KV.mode === 'tamb' ? 'Psv = Pш верх + PN + g(h0s + hN)(ρa − ρsf) + ΔPвв + ΔPtop' : 'статическое, по (94)/(96)', 'final');
    if (KV.mode === 'tamb') {
      h += vnC('В помещение', kf(o.Gsf, 2) + ' кг/с', (p.openDoor ? 'открытая дверь: vd·ρ·Fd' : 'закрытые двери: по Sdsf, Sdsl') + '; Psf = ' + kf(o.Psf, 1) + ' Па');
      h += vnC('Открытый клапан', kf(o.vkl, 1) + ' м/с', 'ΔPкл = ' + kf(o.dPkl, 1) + ' Па; утечки выше ' + kf(o.Gs - o.Gsf, 3) + ' кг/с');
      if (p.heat) h += vnC('Воздухонагреватель', kf(o.Q, 1) + ' кВт', 'нагрев от ' + kf(p.air.ta, 0) + ' до ' + kf(p.tsf, 0) + ' °C');
    }
    if (KV.mode === 'smk') {
      h += vnC('Удалять дыма', kf(o.G, 2) + ' кг/с', kf(o.L, 0) + ' м³/ч при Tsm = ' + kf(o.Tsm, 0) + ' K; подсосы в сети +' + kf(o.Ga, 3) + ' кг/с');
      h += vnC('ДПУ', o.Nmin + ' шт.', 'V1max = ' + kf(o.V1, 2) + ' м³/с, Lmin = ' + kf(o.Lmin, 3) + ' м (СП 7 прил. Е)');
      h += o.comp ? vnC('Компенсация: вентилятор', kf(o.comp.Lv, 0) + ' м³/ч · ' + kf(o.comp.Psv, 0) + ' Па', 'расход наибольший Ga = GШ/1,0 = ' + kf(o.comp.La, 0) + ' м³/ч + утечки закрытых клапанов; t = ' + kf(p.tComp, 0) + ' °C', 'final')
        : vnC('Компенсация', kf(o.LaMin, 0) + '…' + kf(o.LaMax, 0) + ' м³/ч', 'Ga = GШ/(1,3…1,0) при t = ' + kf(p.tComp, 0) + ' °C');
    }
  }
  h += (o.warn || []).map(function (w) { return vnC('Внимание', 'Проверь', w, 'warn'); }).join('');
  $('#kv-res').innerHTML = h;
  $('#kv-rep').innerHTML = isFinite(o.Lv) ? kvReport(p, o) : '';
  if (isFinite(o.Lv) && window.pdv3d) { try { $('#kv-rep').insertAdjacentHTML('afterbegin', '<div class="rep-3d">' + pdv3d(KV.mode, p, o) + '</div>'); } catch (x) {} }
  /* 1.24.0: объёмный вид WebGL — перерисовка через 0,7 с после последней правки */
  if (isFinite(o.Lv) && window.pdv3rView) {
    $('#kv-rep').insertAdjacentHTML('afterbegin', '<div class="rep-3r"><div class="rep-3rh">Объёмный вид по расчёту — вращай мышью или пальцем, колесо — ближе/дальше</div><div id="kv-3r" class="kv3r">' + (window.P3R && P3R.last ? '<img src="' + P3R.last + '" alt="">' : '') + '</div></div>');
    clearTimeout(P3R.t); P3R.t = setTimeout(function () { var b = $('#kv-3r'); if (b) pdv3rView(b, KV.mode, KV.p, KV.o); }, 700);
  }
}

/* ---------- отчёт: вёрстка — kvm_rep.js ---------- */
function kvReport(p, o, mode) { mode = mode || KV.mode; return mode === 'smk' ? repSmk(p, o) : mode === 'stair' ? repStair(p, o) : mode === 'tamb' ? repTamb(p, o) : repLift(p, o); }

function kvInput(e) {
  var t = e.target;
  if (t.dataset && t.dataset.kv) {
    var k = t.dataset.kv, v = t.value;
    if (k === 'doorsTxt') KV.p.doors = kvDoorsParse(v);
    else if (t.tagName === 'SELECT' || t.type === 'radio') kvSet(KV.p, k, v === 'true' ? true : v === 'false' ? false : (isFinite(+v) ? +v : v));
    else kvSet(KV.p, k, t.type === 'text' || (k === 'typ.zkl' && v.trim() === '') ? v : smkNum(v));
    if (k.indexOf('typ.') === 0 && KV.p.segMode !== 'table') { KV.p.segs = kvBuildSegs(KV.p.typ); var sg = $('#kv-segs'); if (sg) sg.innerHTML = kvSegs(); }
    if (KV_REDRAW[k] && KV.mode === 'smk') { var sy = window.scrollY; $('#kv-form').innerHTML = kvForm(); if (window.hintsAttach) hintsAttach(); window.scrollTo(0, sy); var r = document.getElementById(t.id); if (r) r.focus({ preventScroll: true }); }
    kvCalc();
  } else if (t.classList && t.classList.contains('kvc')) {
    var s = KV.p.segs[+t.dataset.seg], c = t.dataset.c;
    s[c] = t.value === '' && c === 'zkl' ? NaN : smkNum(t.value);
    if (s[c + 'Els']) delete s[c + 'Els']; /* число введено руками — состав из элементов больше не действует */
    if (KV.p.segMode !== 'table') { KV.p.segMode = 'table'; var sm = document.querySelector('.kvsegd summary'); if (sm) sm.textContent = 'Таблица участков — для исключений (правлена вручную: считается по таблице)'; }
    kvCalc();
  }
}
document.addEventListener('input', kvInput);
document.addEventListener('change', function (e) { if (e.target.tagName === 'SELECT') kvInput(e); });
document.addEventListener('click', function (e) {
  var m = e.target.closest && e.target.closest('[data-kvm]');
  if (m) { KV.mode = m.dataset.kvm; KV.p = kvDef(KV.mode); KV.file = ''; KV.pid = null; try { localStorage.setItem('klapany-kv-mode', KV.mode); } catch (x) {} show('pdv'); return; }
  if (e.target.id === 'kv-new') { KV.p = kvDef(KV.mode); KV.file = ''; KV.pid = null; show('pdv'); return; }
  if (e.target.id === 'kv-retyp') { KV.p.segMode = 'typ'; KV.p.segs = kvBuildSegs(KV.p.typ); $('#kv-form').innerHTML = kvForm(); if (window.hintsAttach) hintsAttach(); kvCalc(); return; }
  if (e.target.id === 'kv-add') { KV.p.segMode = 'table'; var L = KV.p.segs, last = L[L.length - 1], prev = L[L.length - 2] || last; L.splice(L.length - 1, 0, JSON.parse(JSON.stringify(prev))); $('#kv-form').innerHTML = kvForm(); if (window.hintsAttach) hintsAttach(); kvCalc(); return; }
  var del = e.target.closest && e.target.closest('.kvdel');
  if (del) { KV.p.segMode = 'table'; if (KV.p.segs.length > 1) KV.p.segs.splice(+del.dataset.seg, 1); $('#kv-form').innerHTML = kvForm(); kvCalc(); return; }
  if ((e.target.id === 'kv-doc' || (e.target.classList && e.target.classList.contains('kv-doc'))) && KV.o && isFinite(KV.o.Lv)) {
    var nm = String(KV.p.system || 'ПДВ').replace(/[^0-9A-Za-zА-Яа-яЁё., -]/g, '_') + '_расчёт';
    kvImgs(KV.mode, KV.p, KV.o, function (imgs) { repDoc(repPages(kvReport(KV.p, KV.o), imgs), nm); });
  }
});
