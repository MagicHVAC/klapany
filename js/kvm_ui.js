/* Раздел «Расчёт ПДВ» — расчёт системы целиком (дымоудаление, лестничная клетка, лифтовая шахта) по схеме, совместимой с «КВМ-Дым».
   Открытие проектов .smkprj / .isrprj (INI в cp1251), форма исходных данных, поэтажная сеть, отчёт с формулами, Word.
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
    segs: segs, Skl: 11000, eps: 0.0001, endExhaust: false, ductRes: 100, vOut: 20, dpuH: 2.3, dpuW: 800, dpuB: 400, dpuType: 2 };
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
function kvDef(m) { return m === 'stair' ? kvDefStair() : m === 'lift' ? kvDefLift() : kvDefSmk(); }

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
    ['Клапаны и выброс', [['Skl', 'Sкл — сопротивление газопроницанию закрытого клапана, м³/кг', '', '11000 — как в «КВМ-Дым»; по МР прил. 3 — 29300…38300'], ['eps', 'ε — шероховатость, м', '', 'металл 0,0001'],
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
    ['Вентилятор', [['Pplus', 'P+ — избыточное давление, Па'], ['h0', 'h0s — от воздухозабора до оголовка, м'], ['duct.rect', 'Воздуховод', [[false, 'круглый'], [true, 'прямоугольный']]],
      ['duct.a', 'D или A, мм'], ['duct.b', 'B, мм'], ['duct.len', 'Длина, м'], ['duct.xi', 'Σξ'], ['duct.eps', 'ε, мм']]]
  ],
  lift: [
    ['Объект', [['name', 'Проект', 't'], ['system', 'Система', 't']]],
    ['Условия', [['outer', 'Шахта', [[true, 'у наружной стены — ветер в расчёте'], [false, 'в центральном ядре']]], ['hall1', 'Холл на основном посадочном этаже', [[true, 'выгорожен — (50)'], [false, 'нет — (44)']]],
      ['hallUp', 'Холлы на вышележащих этажах', [[true, 'выгорожены'], [false, 'нет']]], ['method', 'Метод', [[0, 'по расходу в открытом проёме по МР'], [1, 'приток только сверху, потери в зазоре кабины']]]]],
    ['Здание', [['N', 'Надземных этажей'], ['h2', 'Отметка 2-го этажа, м'], ['hf', 'Высота вышележащих этажей, м'], ['NUG', 'Подземных этажей'], ['hUG', 'Высота подземных этажей, м']]],
    ['Воздух', [['air.ta', 'ta — наружный (зима), °C'], ['air.tr', 'tr — в здании, °C'], ['air.va', 'va — ветер, м/с'], ['air.kww', 'Kww — наветренный'], ['air.kw0', 'Kw0 — заветренный']]],
    ['Шахта', [['Fdl', 'Fdl — двери шахты, м²'], ['hdl', 'hdl — их высота, м'], ['nc', 'n — кабин'], ['Fdr', 'Fdr — дверь холла, м²'], ['m', 'm — дверей холла'], ['xid', 'ξd — КМС двери холла'],
      ['Fk', 'Fk — сечение кабины, м²'], ['Fls', 'Fls — сечение шахты, м²'], ['xil', 'ξl (0 — по (45): 4,3 + Fk/Fls)'], ['muGap', 'μ зазора кабина–шахта'], ['Sdl', 'Sdl по паспорту (0 — 2600/ρl)'], ['Sdr', 'Sdr по паспорту (0 — 5300/ρl)']]],
    ['Вентилятор', [['Pplus', 'P+ — избыточное давление, Па'], ['h0', 'h0l — от воздухозабора до оголовка, м'], ['duct.rect', 'Воздуховод', [[true, 'прямоугольный'], [false, 'круглый']]],
      ['duct.a', 'D или A, мм'], ['duct.b', 'B, мм'], ['duct.len', 'Длина, м'], ['duct.xi', 'Σξ'], ['duct.eps', 'ε, мм']]]
  ]
};
function kvGet(p, k) { return k.split('.').reduce(function (a, x) { return a == null ? a : a[x]; }, p); }
function kvSet(p, k, v) { var a = k.split('.'), o = p; for (var i = 0; i < a.length - 1; i++) o = o[a[i]]; o[a[a.length - 1]] = v; }
function kvDoorsTxt(d) { return (d || []).map(function (x) { return String(x[0]).replace('.', ',') + 'x' + String(x[1]).replace('.', ','); }).join('; '); }
function kvDoorsParse(s) { return String(s).split(/[;\n]/).map(function (x) { var m = x.replace(/,/g, '.').match(/([\d.]+)\s*[xх×*]\s*([\d.]+)/i); return m ? [+m[1], +m[2]] : null; }).filter(Boolean); }

function kvForm() {
  var p = KV.p, h = '';
  KV_F[KV.mode].forEach(function (g) {
    h += '<h3 class="nh">' + g[0] + '</h3><div class="trpick stpick">';
    g[1].forEach(function (f) {
      var id = 'kv-' + f[0].replace('.', '_'), v = f[0] === 'doorsTxt' ? kvDoorsTxt(p.doors) : kvGet(p, f[0]);
      if (Array.isArray(f[2])) h += '<div class="stf"><label for="' + id + '">' + f[1] + '</label><select id="' + id + '" data-kv="' + f[0] + '">' +
        f[2].map(function (o) { return '<option value="' + o[0] + '"' + (String(o[0]) === String(v) ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div>';
      else h += '<div class="stf"><label for="' + id + '">' + f[1] + '</label><input id="' + id + '" data-kv="' + f[0] + '" ' + (f[2] === 't' ? 'type="text"' : 'type="number" step="any" inputmode="decimal"') +
        ' value="' + (v == null ? '' : String(v).replace(/"/g, '&quot;')) + '">' + (f[3] ? '<small class="dhint">' + f[3] + '</small>' : '') + '</div>';
    });
    h += '</div>';
  });
  if (KV.mode === 'smk') h += kvSegs();
  return h;
}
var KV_SEGC = [['vw', 'Клапан a, мм'], ['vh', 'b, мм'], ['zkl', 'ζкл'], ['nodeZ', 'ζ узла'], ['hA', 'Гориз. a, м'], ['hB', 'b, м'], ['hL', 'L, м'], ['hZ', 'Σζ'], ['vA', 'Верт. a, м'], ['vB', 'b, м'], ['vL', 'L, м'], ['vZ', 'Σζ']];
function kvSegs() {
  var p = KV.p;
  return '<h3 class="nh">Сеть: участки снизу вверх — 1-й на этаже пожара (клапан открыт), последний — только вертикаль до вентилятора</h3>' +
    '<div class="tscroll"><table class="vei kvseg"><thead><tr><th>№</th>' + KV_SEGC.map(function (c) { return '<th>' + c[1] + '</th>'; }).join('') + '<th></th></tr></thead><tbody>' +
    p.segs.map(function (s, i) {
      return '<tr><td>' + (i + 1) + '</td>' + KV_SEGC.map(function (c) {
        var v = c[0] === 'zkl' ? (isFinite(s.zkl) ? s.zkl : '') : s[c[0]];
        return '<td><input class="kvc" data-seg="' + i + '" data-c="' + c[0] + '" type="number" step="any" value="' + (v == null ? '' : v) + '"' + (c[0] === 'zkl' ? ' placeholder="' + (isFinite(smkZkl(s.vw, s.vh)) ? smkZkl(s.vw, s.vh) : 'паспорт') + '"' : '') + '></td>';
      }).join('') + '<td><button type="button" class="eibtn kvdel" data-seg="' + i + '" title="Удалить участок">×</button></td></tr>';
    }).join('') + '</tbody></table></div>' +
    '<div class="dpbtns"><button type="button" class="eibtn" id="kv-add">+ участок (копия последнего с клапаном)</button>' +
    '<span class="tnote">ζкл пусто — по типоразмеру из отчётов «КВМ-Дым» (800×300 — 0,53; 800×400 — 0,35; 1350×450 — 0,26; 1500×800 — 0,19), иначе — по паспорту клапана. Проходное сечение — (a − 50)·(b − 50).</span></div>';
}

PAGES.pdv = (function (old) {
  return function () {
    if (!KV.p) KV.p = kvDef(KV.mode);
    return '<h1>Расчёт противодымной вентиляции</h1><p class="lead">Система целиком по методике ВНИИПО к СП 7.13130 — так, как считает «КВМ-Дым»: открой свой проект .smkprj или .isrprj, поправь данные, получи отчёт с формулами и Word. Сверено на 23 отчётах «КВМ-Дым» 5.2 — расходы и давления вентиляторов совпадают.</p>' +
      '<div class="vntabs" role="tablist">' + [['smk', 'Дымоудаление', 'коридор, зал'], ['stair', 'Лестничная клетка', 'подпор, п. 4.1'], ['lift', 'Лифтовая шахта', 'подпор, п. 4.2']].map(function (t) {
        return '<button type="button" data-kvm="' + t[0] + '"' + (t[0] === KV.mode ? ' class="on"' : '') + '>' + t[1] + '<small>' + t[2] + '</small></button>'; }).join('') + '</div>' +
      '<div class="dpbtns"><label class="eibtn on kvopen">Открыть проект КВМ<input type="file" id="kv-file" accept=".smkprj,.isrprj" hidden></label>' +
      '<button type="button" class="eibtn" id="kv-new">Новый (пример)</button><button type="button" class="eibtn" id="kv-doc">Скачать отчёт в Word</button><span class="tnote" id="kv-fname">' + (KV.file ? 'Открыт: ' + esc(KV.file) : '') + '</span></div>' +
      '<div id="kv-form">' + kvForm() + '</div><div class="barres stres" id="kv-res"></div><div id="kv-rep"></div>' +
      '<details class="issue"><summary>Отдельные расчёты по формулам МР (прежние вкладки)</summary><div>' + old().replace(/^<h1>[\s\S]*?<\/p>/, '') + '</div></details>';
  };
})(PAGES.pdv);

function kvCalc() {
  if (!$('#kv-form')) return;
  var p = KV.p, o;
  try { o = KV.mode === 'smk' ? smkCalc(p) : KV.mode === 'stair' ? supStair(p) : supLift(p); } catch (e) { o = { err: ['Ошибка расчёта: ' + e.message], warn: [] }; }
  KV.o = o;
  var h = '';
  if (o.err && o.err.length) h += o.err.map(function (e) { return vnC('Ошибка', 'Проверь данные', e, 'warn'); }).join('');
  if (isFinite(o.Lv)) {
    h += vnC('Вентилятор: подача', kf(o.Lv, 0) + ' м³/ч', KV.mode === 'smk' ? 'Lv = GШ/ρN·3600 = ' + kf(o.GN, 4) + ' / ' + kf(o.roN, 4) + ' · 3600; t перед вентилятором ' + kf(o.tFan, 0) + ' °C' : 'Lv = 3600·G/ρa = 3600 · ' + kf(o.Gs || o.Gl, 2) + ' / ' + kf(o.roa, 2), 'final');
    h += vnC('Вентилятор: давление', kf(o.Psv, KV.mode === 'smk' ? 2 : 0) + ' Па', KV.mode === 'smk' ? 'Psv = |PШN| + ΔPШ' + (o.Pvf ? ' + Pd + 0,5ρN·vf²' : '') : 'статическое, по (94)/(96)', 'final');
    if (KV.mode === 'smk') {
      h += vnC('Удалять дыма', kf(o.G, 2) + ' кг/с', kf(o.L, 0) + ' м³/ч при Tsm = ' + kf(o.Tsm, 0) + ' K; подсосы в сети +' + kf(o.Ga, 3) + ' кг/с');
      h += vnC('ДПУ', o.Nmin + ' шт.', 'V1max = ' + kf(o.V1, 2) + ' м³/с, Lmin = ' + kf(o.Lmin, 3) + ' м (СП 7 прил. Е)');
      h += vnC('Компенсация', kf(o.LaMin, 0) + '…' + kf(o.LaMax, 0) + ' м³/ч', 'Ga = GШ/(1,3…1,0) при t = ' + kf(p.tComp, 0) + ' °C');
    }
  }
  h += (o.warn || []).map(function (w) { return vnC('Внимание', 'Проверь', w, 'warn'); }).join('');
  $('#kv-res').innerHTML = h;
  $('#kv-rep').innerHTML = isFinite(o.Lv) ? kvReport(p, o) : '';
}

/* ---------- отчёт с формулами ---------- */
function kvLine(t, f) { return '<p class="kvl"><span>' + t + '</span><br>' + f + '</p>'; }
function kvReport(p, o) {
  if (KV.mode === 'smk') return kvRepSmk(p, o);
  if (KV.mode === 'stair') return kvRepStair(p, o);
  return kvRepLift(p, o);
}
function kvRepSmk(p, o) {
  var h = '<h2>Отчёт: вытяжная противодымная вентиляция</h2><p class="sub">' + esc(p.name) + (p.system ? ' · ' + esc(p.system) : '') + ' · ' + (p.variant === 0 ? 'удаление дыма из коридора (холла), смежного с горящим помещением' : 'удаление дыма из зала') + '</p>';
  if (p.variant === 0) {
    h += kvLine('Площадь пола и объём горящего помещения', 'Ff = ' + kf(o.Ff, 2) + ' м²; V = ' + kf(o.V, 2) + ' м³; Fw = 6·V<sup>2/3</sup> = ' + kf(o.Fw, 2) + ' м²') +
      kvLine('Проёмы и проёмность', 'A0 = ΣAi = ' + kf(o.A0, 2) + ' м²; П = Σ(Ai·Hi<sup>1/2</sup>)/V<sup>2/3</sup> = ' + kf(o.Pi, 4) + ' м<sup>1/2</sup>; V0 = 0,263·Qн = ' + kf(o.V0, 2) + ' м³/кг') +
      kvLine('Пожарная нагрузка', 'g0 = qп/Qнд = ' + kf(p.qp, 0) + '/13,8 = ' + kf(o.g0, 2) + ' кг/м²; gk = Ff·qп/((Fw − A0)·Qнд) = ' + kf(o.gk, 2) + ' кг/м²; gkкр = ' + kf(o.gkr, 2) + ' кг/м² → ' + (o.prv ? 'пожар, регулируемый вентиляцией' : 'пожар, регулируемый нагрузкой')) +
      kvLine('Температуры', 'T0max = ' + kf(o.T0max, 0) + ' K (' + (o.prv ? '13' : '14') + '); T0 = 0,8·T0max = ' + kf(o.T0, 0) + ' K; Tsm = ' + kf(o.Tsm, 1) + ' K (16), hsm = hк − Hнз = ' + kf(o.hsm, 2) + ' м') +
      kvLine('Расход продуктов горения (17)', 'GПГ = ksm·Ad·Hd<sup>1/2</sup> = ' + kf(o.ksm, 1) + ' · ' + kf(p.dA, 2) + ' · ' + kf(p.dH, 2) + '<sup>1/2</sup> = ' + kf(o.G, 3) + ' кг/с; LПГ = ' + kf(o.L, 0) + ' м³/ч');
  } else {
    h += kvLine('Очаг', 'Qf = η·Qн·1000·ψ·Fo = ' + kf(p.eta, 2) + ' · ' + kf(p.Q, 1) + ' · 1000 · ' + kf(p.psi, 4) + ' · ' + kf(p.Fo, 1) + ' = ' + kf(o.Qf, 0) + ' кВт; безопасное расстояние R = ' + kf(o.Rsafe, 2) + ' м') +
      kvLine('Высота пламени и колонка', 'Z = 0,166·(r·Qf)<sup>2/5</sup> = ' + kf(o.Zf, 2) + ' м ' + (o.f === 8 ? '> ' : '< ') + 'Hнз = ' + kf(p.hNz, 2) + ' м → формула (' + o.f + '): Gk = ' + kf(o.Gk, 3) + ' кг/с') +
      kvLine('Температура слоя (4)', 'Tk = ' + kf(o.Tk, 0) + ' K; α = ' + kf(o.alpha, 4) + ' кВт/(м²·К); Tsm = ' + kf(o.Tsm, 1) + ' K; lsm = ' + kf(o.lsm, 2) + ' м; Asm = ' + kf(o.Asm, 1) + ' м²') +
      kvLine('Расход продуктов горения (12)', 'GПГ = Gk = ' + kf(o.G, 3) + ' кг/с; LПГ = ' + kf(o.L, 0) + ' м³/ч');
  }
  h += kvLine('Открытый клапан на этаже пожара', 'Fкл = ' + kf(o.Fkl, 4) + ' м²; Vкл = ' + kf(o.vkl, 2) + ' м/с; ΔPкл = ½·(ζкл + ζ\')·Vкл²·ρ = ½ · (' + kf(o.zkl, 2) + ' + ' + kf(p.segs[0].nodeZ, 2) + ') · ' + kf(o.vkl, 2) + '² · ' + kf(353 / o.Tsm, 3) + ' = ' + kf(o.dPkl, 2) + ' Па');
  h += vnTable(['Участок', 'PШ, Па', 'Подсос клапана, кг/с', 'Подсос стенок, кг/с', 'GШ, кг/с', 'T, K', 'ρ, кг/м³', 'v верт., м/с', 'λ', 'ΔPШ, Па'], o.rows.map(function (r) {
    return [r.i + (r.open ? ' — пожар' : r.last ? ' — верх' : ''), kf(r.P, 2), kf(r.gKl, 5), kf(r.gH + r.gV, 5), kf(r.G, 4), kf(r.T, 2), kf(r.ro, 4), kf(r.ver.v, 2), kf(r.ver.lam, 4), kf(r.ver.dp, 2)];
  }));
  h += kvLine('Вентилятор', 'GШ = ' + kf(o.GN, 4) + ' кг/с; Lv = GШ/ρN·3600 = ' + kf(o.Lv, 0) + ' м³/ч; Psv = ' + kf(o.PshN, 2) + (o.Pvf ? ' + ' + kf(p.ductRes, 0) + ' + ' + kf(o.Pvf, 2) : '') + ' = ' + kf(o.Psv, 2) + ' Па; t = ' + kf(o.tFan, 0) + ' °C') +
    kvLine('Дымоприёмные устройства (СП 7 прил. Е)', 'Dэ = ' + kf(o.dpuD, 3) + ' м; γ = ' + kf(o.gamma, 1) + '; d = ' + kf(o.d, 2) + ' м; V1max = 4,16·γ·d<sup>5/2</sup>·[(Tsm − Tr)/Tr]<sup>1/2</sup> = ' + kf(o.V1, 2) + ' м³/с; Nmin = ' + o.Nmin + '; Lmin = 0,9·V1max<sup>1/2</sup> = ' + kf(o.Lmin, 3) + ' м') +
    kvLine('Компенсирующая подача', 'Ga = GШ/(1,3…1,0) = ' + kf(o.GaMin, 2) + '…' + kf(o.GaMax, 2) + ' кг/с; La = ' + kf(o.LaMin, 0) + '…' + kf(o.LaMax, 0) + ' м³/ч при t = ' + kf(p.tComp, 0) + ' °C');
  return h;
}
function kvRepStair(p, o) {
  var h = '<h2>Отчёт: подпор в лестничную клетку</h2><p class="sub">' + esc(p.name) + (p.system ? ' · ' + esc(p.system) : '') + '</p>' +
    kvLine('Плотности', 'ρa = ' + kf(o.roa, 3) + ', ρr = ' + kf(o.ror, 3) + ', ρs = ' + kf(o.ros, 3) + ' кг/м³ (ts = ' + kf(o.ts, 1) + ' °C); Pw = 0,25·(Kww − Kw0)·ρa·va² = ' + kf(o.Pw, 2) + ' Па') +
    kvLine(p.noFloor1 ? 'Давление у двери 2-го этажа (23)' : 'Давление у двери 1-го этажа (33)', 'Ps = ' + kf(o.P1, 2) + ' Па') +
    kvLine('Наружный выход ' + (p.noFloor1 ? '(24)' : '(34)'), 'Gsa = ' + kf(o.Gsa, 3) + ' кг/с; Gs(F) = Gsm/q = ' + kf(o.GsF, 3) + ' кг/с; принято Gs = ' + kf(o.Gs0, 3) + ' кг/с; Sd = ' + kf(o.Sd, 1) + ' м³/кг') +
    vnTable(['Этаж', 'h, м', 'Ps, Па', 'ΔPd, Па', 'vs, м/с', 'ΔPs, Па', 'ΔGsd, кг/с', 'ΔGsw, кг/с', 'Gw, кг/(ч·м²)', 'Gs, кг/с'], o.rows.slice().reverse().map(function (r) {
      return [r.i, kf(r.h, 2), kf(r.P, 2), kf(r.dPd, 2), kf(r.v, 3), kf(r.dPs, 2), kf(r.dG, 4), kf(r.dGw || 0, 4), kf(r.Gw || 0, 2), kf(r.G, 3)];
    })) +
    kvLine('Воздуховоды до оголовка', 'v = ' + kf(o.duct.v, 2) + ' м/с; Pd = ' + kf(o.duct.Pd, 2) + ' Па; λ = ' + kf(o.duct.f, 4) + ' (Кольбрук); Pвв = ' + kf(o.duct.P, 2) + ' Па') +
    kvLine('Вентилятор (93), (94)', 'Lv = ' + kf(o.Lv, 0) + ' м³/ч; Psv = Ps + g·hsN·(ρa − ρs) + g·h0s·(ρa − ρr) + Pвв = ' + kf(o.Ps, 2) + ' + 9,81·' + kf(o.hsN, 2) + '·' + kf(o.roa - o.ros, 3) + ' + 9,81·' + kf(p.h0, 1) + '·' + kf(o.roa - o.ror, 3) + ' + ' + kf(o.duct.P, 2) + ' = ' + kf(o.Psv, 0) + ' Па; t = ' + kf(p.air.ta, 0) + ' °C');
  return h;
}
function kvRepLift(p, o) {
  var h = '<h2>Отчёт: подпор в лифтовую шахту</h2><p class="sub">' + esc(p.name) + (p.system ? ' · ' + esc(p.system) : '') + '</p>' +
    kvLine('Плотности и сопротивления', 'ρa = ' + kf(o.roa, 3) + ', ρr = ' + kf(o.ror, 3) + ', ρl = ' + kf(o.rol, 3) + ' кг/м³; Pw = ' + kf(o.Pw, 2) + ' Па; Sdl = ' + kf(o.Sdl, 1) + ', Sdr = ' + kf(o.Sdr, 1) + ' м³/кг; Slr = ' + kf(o.Slr, 2) + '; ξl = ' + kf(o.xil, 2)) +
    kvLine('1-й этаж — двери открыты', 'Pl(1) = ' + kf(o.P1, 2) + ' Па; G(1) = ' + kf(o.G1, 3) + ' кг/с') +
    (o.dPcs ? kvLine('Зазор кабина–шахта', 'vcs = ' + kf(o.vcs, 2) + ' м/с; ΔPcs = ' + kf(o.dPcs, 2) + ' Па; Pl(n) = ' + kf(o.Pl, 2) + ' Па') : kvLine('Давление в шахте', 'Pl = ' + kf(o.Pl, 2) + ' Па')) +
    vnTable(['Этаж', 'hэ, м', 'ΔPd, Па', 'ΔG, кг/с'], o.rows.slice().reverse().map(function (r) { return [r.i, kf(r.h, 2), isFinite(r.dPd) ? kf(r.dPd, 2) : '—', kf(r.dG, 4)]; })) +
    kvLine('Воздуховоды', 'v = ' + kf(o.duct.v, 2) + ' м/с; λ = ' + kf(o.duct.f, 4) + '; Pdl = ' + kf(o.duct.P, 2) + ' Па') +
    kvLine('Вентилятор (95), (96)', 'Gl = ' + kf(o.Gl, 3) + ' кг/с; Lv = ' + kf(o.Lv, 0) + ' м³/ч; Psv = ' + kf(o.Psv, 0) + ' Па' + (p.method !== 1 ? ' (как в «КВМ-Дым»; по (96) МР с g·hlN·(ρa − ρl) — ' + kf(o.PsvMR, 0) + ' Па)' : ''));
  return h;
}

/* ---------- открытие проекта КВМ ---------- */
function kvOpen(file) {
  var r = new FileReader();
  r.onload = function () {
    var text;
    try { text = new TextDecoder('windows-1251').decode(new Uint8Array(r.result)); } catch (e) { text = String.fromCharCode.apply(null, new Uint8Array(r.result)); }
    var d = smkIni(text), v = ((d.Project || {}).Variant || '').trim();
    if (/\.smkprj$/i.test(file.name) || d.Room) { KV.mode = 'smk'; KV.p = smkFromIni(d); }
    else if (v === 'SW-OG') { KV.mode = 'stair'; KV.p = supStairFromIni(d); KV.p.air = kvAir(d); }
    else if (v === 'LIFT') { KV.mode = 'lift'; KV.p = supLiftFromIni(d); KV.p.air = kvAir(d); }
    else { alert('Этот проект (вариант «' + v + '») сайт пока не открывает: есть дымоудаление, лестничная клетка и лифтовая шахта. Тамбур-шлюзы и зоны безопасности — следующим шагом.'); return; }
    KV.file = file.name; try { localStorage.setItem('klapany-kv-mode', KV.mode); } catch (x) {}
    show('pdv');
  };
  r.readAsArrayBuffer(file);
}
function kvAir(d) { var A = d.Air || {}, n = smkNum; return { ta: n(A.AirTempO), tr: n(A.AirTempI), va: n(A.WindSpeed), kww: n(A.KWW), kw0: n(A.KW0) }; }

document.addEventListener('change', function (e) { if (e.target.id === 'kv-file' && e.target.files[0]) kvOpen(e.target.files[0]); });
function kvInput(e) {
  var t = e.target;
  if (t.dataset && t.dataset.kv) {
    var k = t.dataset.kv, v = t.value;
    if (k === 'doorsTxt') KV.p.doors = kvDoorsParse(v);
    else if (t.tagName === 'SELECT') kvSet(KV.p, k, v === 'true' ? true : v === 'false' ? false : (isFinite(+v) ? +v : v));
    else kvSet(KV.p, k, t.type === 'text' ? v : smkNum(v));
    kvCalc();
  } else if (t.classList && t.classList.contains('kvc')) {
    var s = KV.p.segs[+t.dataset.seg], c = t.dataset.c;
    s[c] = t.value === '' && c === 'zkl' ? NaN : smkNum(t.value); kvCalc();
  }
}
document.addEventListener('input', kvInput);
document.addEventListener('change', function (e) { if (e.target.tagName === 'SELECT') kvInput(e); });
document.addEventListener('click', function (e) {
  var m = e.target.closest && e.target.closest('[data-kvm]');
  if (m) { KV.mode = m.dataset.kvm; KV.p = kvDef(KV.mode); KV.file = ''; try { localStorage.setItem('klapany-kv-mode', KV.mode); } catch (x) {} show('pdv'); return; }
  if (e.target.id === 'kv-new') { KV.p = kvDef(KV.mode); KV.file = ''; show('pdv'); return; }
  if (e.target.id === 'kv-add') { var L = KV.p.segs, last = L[L.length - 1], prev = L[L.length - 2] || last; L.splice(L.length - 1, 0, JSON.parse(JSON.stringify(prev))); $('#kv-form').innerHTML = kvForm(); if (window.hintsAttach) hintsAttach(); kvCalc(); return; }
  var del = e.target.closest && e.target.closest('.kvdel');
  if (del) { if (KV.p.segs.length > 1) KV.p.segs.splice(+del.dataset.seg, 1); $('#kv-form').innerHTML = kvForm(); kvCalc(); return; }
  if (e.target.id === 'kv-doc' && KV.o && isFinite(KV.o.Lv)) {
    var tt = { smk: 'Расчёт системы вытяжной противодымной вентиляции', stair: 'Расчёт подпора воздуха в лестничную клетку', lift: 'Расчёт подпора воздуха в лифтовую шахту' }[KV.mode];
    vnDoc(tt, kvReport(KV.p, KV.o).replace(/<p class="kvl"><span>/g, '<p><b>').replace(/<\/span><br>/g, '</b><br>'), (KV.p.system || 'ПДВ').replace(/[\\/:*?"<>|]/g, '_') + '_расчёт');
  }
});
