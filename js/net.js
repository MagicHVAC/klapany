/* Аэродинамический расчёт сети вытяжной противодымной вентиляции (коллектор с этажными клапанами) и подбор вентилятора.
   Источник: «Расчётное определение основных параметров противодымной вентиляции зданий. Методические рекомендации к СП 7.13130.2013»
   (ФГБУ ВНИИПО МЧС России, согласованы МЧС России 30.01.2013, далее МР), п. 5.1.1–5.1.6, формулы (70)–(90);
   прил. 2 — свойства дымовых газов; прил. 3 (обязательное) — подсосы через воздуховоды класса «В» и закрытые НЗ клапаны.
   Формулы сверены по изображениям текста МР (meganorm), 06.11.2026.
   Допущения справочника (в МР не приведены, показываются пользователю): плотность воздуха ρa = 353/Ta; в (76), (87) слагаемое
   подсосов взято как в МР — Ta · ΔG без теплоёмкости воздуха (≈ 1 кДж/(кг·К)); теплопотери q задаёт пользователь (по умолчанию 0). */

/* прил. 2 МР: t, °C; ρ, кг/м³; μ·10⁶, Па·с */
var NET_GAS = [[0, 1.296, 15.78], [100, 0.951, 20.39], [200, 0.749, 24.50], [300, 0.618, 28.23], [400, 0.526, 31.69], [500, 0.457, 34.85],
  [600, 0.405, 37.87], [700, 0.363, 40.69], [800, 0.330, 43.38], [900, 0.301, 45.91], [1000, 0.275, 48.36]];
/* прил. 3 п. 2 МР: закрытые НЗ клапаны — характеристика удельного сопротивления дымогазопроницанию, м³/кг, по температуре газа */
var NET_SV = [[20, 29900, '20'], [100, 30300, '20–100'], [200, 38300, '100–200'], [300, 37900, '200–300'], [500, 29300, '300–500']];

function netGas(t) {
  var g = NET_GAS, i = 0;
  if (t <= g[0][0]) return { ro: g[0][1], mu: g[0][2] * 1e-6 };
  if (t >= g[g.length - 1][0]) return { ro: g[g.length - 1][1], mu: g[g.length - 1][2] * 1e-6 };
  while (g[i + 1][0] < t) i++;
  var k = (t - g[i][0]) / (g[i + 1][0] - g[i][0]);
  return { ro: g[i][1] + k * (g[i + 1][1] - g[i][1]), mu: (g[i][2] + k * (g[i + 1][2] - g[i][2])) * 1e-6 };
}
/* прил. 2 МР: cp = a(1 + exp(b − cT))^(−1/d), кДж/(кг·К), T — К */
function netCp(T) { return 1.3615803 * Math.pow(1 + Math.exp(7.0065648 - 0.0053034712 * T), -1 / 20.761095); }
function netSv(t) { for (var i = 0; i < NET_SV.length; i++) if (t <= NET_SV[i][0]) return NET_SV[i]; return null; }
/* (73) Альтшуль, (74) Re */
function netLam(ro, v, de, mu, k) { var Re = ro * v * de / mu; return { Re: Re, lam: 0.11 * Math.pow(68 / Re + k / de, 0.25) }; }
function netDe(a, b) { return 2 * a * b / (a + b); }

function netBlock() {
  var F = dpuF, S = dpuS;
  return '<p class="sub">Сеть дымоудаления от этажа пожара до вентилятора: потери давления, тяга, подсосы через стенки воздуховодов класса «В» и через закрытые клапаны других этажей, смешение и температура дыма, подбор вентилятора. Методика — МР ВНИИПО к СП 7.13130, п. 5.1. Расчётный этаж — нижний (МР п. 2.2): там длиннее сеть и больше подсосов.</p>' +
    '<div class="dpbtns"><button type="button" class="eibtn" id="sn-take">Взять Gsm и Tsm из расчёта дыма</button></div>' +
    '<h3 class="nh">Дым на входе</h3><div class="trpick stpick">' +
    F('sn-g', 'Gsm — расход дыма на этаже пожара, кг/с', '4', 'any', 'из расчёта по п. 7.4 СП 7') +
    F('sn-ts', 'Tsm — температура дыма, °C', '300', 'any', 'из того же расчёта') +
    F('sn-ta', 'Ta — воздух, который подсасывается, °C', '20', 'any', 'в помещениях, где идёт коллектор') +
    F('sn-p0', 'P0 — добавочное давление, Па', '0', 'any', 'естественная компенсация: P0 = Ra·Ga² (МР 5.1.2)') +
    '</div><h3 class="nh">Начальный участок — на этаже пожара</h3><div class="trpick stpick">' +
    F('sn-a0', 'Сечение: ширина, мм', '800', '1') + F('sn-b0', 'Сечение: высота, мм', '800', '1') +
    F('sn-l0', 'Длина в защищаемом помещении, м', '12', 'any') +
    F('sn-z0', 'Σζ местных сопротивлений', '2.5', 'any', 'ДПУ, отводы, тройники — Идельчик') +
    F('sn-lt', 'Транзит до коллектора, м', '6', 'any', 'с подсосами, класс «В»') +
    F('sn-zj', 'ζ узла присоединения к коллектору с клапаном', '1.5', 'any', 'клапан — по паспорту изготовителя') +
    '</div><h3 class="nh">Коллектор (шахта)</h3><div class="trpick stpick">' +
    F('sn-ac', 'Сечение: ширина, мм', '800', '1') + F('sn-bc', 'Сечение: высота, мм', '800', '1') +
    F('sn-n', 'Участков (этажей) до вентилятора', '9', '1', 'от этажа пожара вверх') +
    F('sn-h', 'Высота участка (этажа), м', '3.3', 'any') +
    F('sn-lh', 'Горизонтальная длина на участке, м', '0', 'any') +
    F('sn-zc', 'Σζ на участке', '0', 'any') +
    F('sn-nv', 'Закрытых клапанов на этаже, шт.', '1', '1') +
    F('sn-av', 'Клапан: ширина, мм', '800', '1') + F('sn-bv', 'Клапан: высота, мм', '800', '1') +
    F('sn-k', 'Шероховатость k, мм', '0.1', 'any', 'сталь — 0,1 (МР 5.1.2)') +
    F('sn-q', 'Теплопотери q, Вт/м', '0', 'any', '0 — без потерь тепла стенками') +
    '</div><h3 class="nh">От коллектора до выброса</h3><div class="trpick stpick">' +
    F('sn-ad', 'Сечение: ширина, мм', '800', '1') + F('sn-bd', 'Сечение: высота, мм', '800', '1') +
    F('sn-ld', 'Длина, м', '5', 'any') +
    F('sn-zd', 'Σζ (обвязка вентилятора, выброс)', '1.5', 'any') +
    S('sn-out', 'Выброс', [['roof', 'на кровлю'], ['fac', 'на фасад — v ≥ 20 м/с (МР 5.1.6)']], 'roof') +
    F('sn-vf', 'Скорость выброса на фасад, м/с', '20', 'any') +
    '</div><div class="barres stres" id="sn-res"></div><div class="stanim" id="sn-anim"></div><div id="sn-tab"></div>' +
    '<div class="dpbtns"><button type="button" class="eibtn on" id="sn-doc">Скачать расчёт сети в Word</button></div>' +
    '<details class="issue dpf"><summary>Формулы и обозначения</summary><div>' +
    '<p>(70) начальный участок: P<sub>sm0</sub> = P<sub>0</sub> + 0,5ρ<sub>sm0</sub>(Σζ<sub>0i</sub>v<sup>2</sup> + Σλ<sub>0i</sub>l<sub>0i</sub>v<sup>2</sup>/d<sub>e0i</sub>); (71) v = G/(ρF); (72) d<sub>e</sub> = 2ab/(a + b).</p>' +
    '<p>(73) λ = 0,11(68/Re + k/d<sub>e</sub>)<sup>1/4</sup>; (74) Re = ρvd<sub>e</sub>/μ — μ и ρ дыма по прил. 2.</p>' +
    '<p>(75), (76) транзит: G′ = G + ΔG<sub>da</sub>; T′ = (c<sub>p</sub>GT + ΔG<sub>da</sub>T<sub>a</sub> − q·l)/(c′<sub>p</sub>G′). (82) узел: P<sub>sm1</sub> = P′ + 0,5ζ′ρ′v′<sup>2</sup>.</p>' +
    '<p>(83) участок коллектора: P<sub>2</sub> = P<sub>1</sub> + 0,5ρ<sub>1</sub>(Σζ + λ(l + h)/d<sub>e</sub>)v<sup>2</sup> − gh(ρ<sub>a</sub> − ρ<sub>1</sub>).</p>' +
    '<p>(84) подсосы через стенки, класс «В» (прил. 3 п. 1): ΔG<sub>da</sub> = 3,556·10<sup>−5</sup>ρ<sub>a</sub>((P<sub>1</sub> + P<sub>2</sub>)/2)<sup>0,65</sup>(F/d<sub>e</sub>)(l + h).</p>' +
    '<p>(85) через закрытый клапан: ΔG<sub>dpa</sub> = F<sub>dp</sub>(P<sub>2</sub>/S<sub>dpsm</sub>)<sup>1/2</sup>, S — по прил. 3 п. 2: ' + NET_SV.map(function (s) { return s[2] + ' °C — ' + s[1]; }).join('; ') + ' м³/кг.</p>' +
    '<p>(86) G<sub>2</sub> = G<sub>1</sub> + ΔG<sub>da</sub> + ΔG<sub>dpa</sub>; (87) T<sub>2</sub> = (c<sub>p1</sub>G<sub>1</sub>T<sub>1</sub> + T<sub>a</sub>(ΔG<sub>da</sub> + ΔG<sub>dpa</sub>) − q(l + h))/(c<sub>p2</sub>G<sub>2</sub>); c<sub>p</sub> по прил. 2.</p>' +
    '<p>(88) L<sub>v</sub> = 3600G<sub>N</sub>/ρ<sub>N</sub>, м³/ч; (89) P<sub>sv</sub> = 1,2(P<sub>N</sub> + P<sub>d</sub>)/ρ<sub>N</sub>; (90) выброс на фасад: P<sub>sv</sub> = 1,2(P<sub>N</sub> + P<sub>d</sub> + 0,5ρ<sub>N</sub>v<sub>f</sub><sup>2</sup>)/ρ<sub>N</sub>, v<sub>f</sub> ≥ 20 м/с.</p>' +
    '<p>Сечения подбирать на скорость не больше 11 м/с, лучше 9–11 (МР 5.1.1). Допущение справочника: ρ<sub>a</sub> = 353/T<sub>a</sub>.</p></div></details>' +
    refs([['mr7', '5.1'], ['mr7', 'прил. 3'], ['sp7', '7.11']]);
}

function netCompute() {
  var n = dpuNum, mm = function (id) { return n(id) / 1000; };
  var r = { G0: n('sn-g'), ts: n('sn-ts'), ta: n('sn-ta'), P0: n('sn-p0'), a0: mm('sn-a0'), b0: mm('sn-b0'), l0: n('sn-l0'), z0: n('sn-z0'), lt: n('sn-lt'), zj: n('sn-zj'),
    ac: mm('sn-ac'), bc: mm('sn-bc'), N: Math.round(n('sn-n')), h: n('sn-h'), lh: n('sn-lh'), zc: n('sn-zc'), nv: Math.round(n('sn-nv')), av: mm('sn-av'), bv: mm('sn-bv'),
    k: n('sn-k') / 1000, q: n('sn-q'), ad: mm('sn-ad'), bd: mm('sn-bd'), ld: n('sn-ld'), zd: n('sn-zd'), out: $('#sn-out').value, vf: n('sn-vf'),
    err: [], warn: [], marks: [], seg: [] };
  fcNums([['sn-g', '', 0, null, true], ['sn-ts', '', 0, 1000], ['sn-ta', '', -50, 60], ['sn-p0', '', 0], ['sn-a0', '', 0, null, true], ['sn-b0', '', 0, null, true], ['sn-l0', '', 0],
    ['sn-z0', '', 0], ['sn-lt', '', 0], ['sn-zj', '', 0], ['sn-ac', '', 0, null, true], ['sn-bc', '', 0, null, true], ['sn-n', '', 1, 150], ['sn-h', '', 0, null, true], ['sn-lh', '', 0],
    ['sn-zc', '', 0], ['sn-nv', '', 0, 20], ['sn-av', '', 0, null, true], ['sn-bv', '', 0, null, true], ['sn-k', '', 0, 20], ['sn-q', '', 0], ['sn-ad', '', 0, null, true], ['sn-bd', '', 0, null, true],
    ['sn-ld', '', 0], ['sn-zd', '', 0], ['sn-vf', '', 0]], r.marks);
  if (r.out === 'fac' && r.vf < 20) r.marks.push(['sn-vf', 'bad', 'Не меньше 20 м/с (МР 5.1.6)']);
  if (r.marks.some(function (m) { return m[1] === 'bad'; })) { r.err.push('Исправь поля, подсвеченные красным.'); return r; }
  var g = 9.81, Ta = r.ta + 273.15, roa = 353 / Ta, gas, v, L, de, F;
  r.roa = roa; r.Ta = Ta;
  /* (70) начальный участок */
  gas = netGas(r.ts); F = r.a0 * r.b0; de = netDe(r.a0, r.b0); v = r.G0 / (gas.ro * F); L = netLam(gas.ro, v, de, gas.mu, r.k);
  r.ro0 = gas.ro; r.mu0 = gas.mu; r.v0 = v; r.de0 = de; r.lam0 = L.lam; r.Re0 = L.Re;
  r.Psm0 = r.P0 + 0.5 * gas.ro * (r.z0 * v * v + L.lam * r.l0 * v * v / de);
  /* (75), (76) транзит с подсосами: давление — по (70) с заменой, подсосы — прил. 3 п. 1 */
  var P1 = r.Psm0, P2 = P1 + 0.5 * gas.ro * L.lam * r.lt * v * v / de;
  var dGt = r.lt > 0 ? 3.556e-5 * roa * Math.pow((P1 + P2) / 2, 0.65) * F / de * r.lt : 0;
  var G = r.G0, T = r.ts + 273.15, G2 = G + dGt, T2 = T;
  for (var it = 0; it < 6; it++) T2 = (netCp(T) * G * T + dGt * Ta - r.q / 1000 * r.lt) / (netCp(T2) * G2);
  r.Pt = P2; r.dGt = dGt; r.Gt = G2; r.Tt = T2;
  /* (82) узел присоединения к коллектору: скорость — в сечении начального (этажного) канала */
  gas = netGas(T2 - 273.15); v = G2 / (gas.ro * F);
  r.Psm1 = P2 + 0.5 * r.zj * gas.ro * v * v; r.vj = v;
  /* (83)–(87) участки коллектора */
  var Fc = r.ac * r.bc, dec = netDe(r.ac, r.bc), Fv = r.av * r.bv * r.nv, P = r.Psm1;
  G = G2; T = T2; r.vmax = Math.max(r.v0, r.vj);
  for (var i = 1; i <= r.N; i++) {
    gas = netGas(T - 273.15); v = G / (gas.ro * Fc); L = netLam(gas.ro, v, dec, gas.mu, r.k);
    var Pn = P + 0.5 * gas.ro * (r.zc + L.lam * (r.lh + r.h) / dec) * v * v - g * r.h * (roa - gas.ro);
    var dGa = 3.556e-5 * roa * Math.pow(Math.max((P + Pn) / 2, 0), 0.65) * Fc / dec * (r.lh + r.h);
    var sv = netSv(T - 273.15); if (!sv) { sv = NET_SV[NET_SV.length - 1]; r.svOut = true; }
    var dGv = Fv > 0 ? Fv * Math.sqrt(Math.max(Pn, 0) / sv[1]) : 0;
    var Gn = G + dGa + dGv, Tn = T;
    for (it = 0; it < 6; it++) Tn = (netCp(T) * G * T + Ta * (dGa + dGv) - r.q / 1000 * (r.lh + r.h)) / (netCp(Tn) * Gn);
    r.seg.push({ i: i, P1: P, P2: Pn, v: v, ro: gas.ro, lam: L.lam, Re: L.Re, dGa: dGa, dGv: dGv, S: sv, G1: G, G2: Gn, T1: T, T2: Tn, grav: g * r.h * (roa - gas.ro) });
    r.vmax = Math.max(r.vmax, v); P = Pn; G = Gn; T = Tn;
  }
  r.PN = P; r.GN = G; r.TN = T; gas = netGas(T - 273.15); r.roN = gas.ro;
  /* сеть от коллектора до выброса: сопротивление Pd по (70) без подсосов */
  var Fd = r.ad * r.bd, ded = netDe(r.ad, r.bd); v = G / (gas.ro * Fd); L = netLam(gas.ro, v, ded, gas.mu, r.k);
  r.vd = v; r.Pd = 0.5 * gas.ro * (r.zd + L.lam * r.ld / ded) * v * v; r.vmax = Math.max(r.vmax, v);
  r.Lv = 3600 * G / gas.ro;
  r.Pvf = r.out === 'fac' ? 0.5 * gas.ro * r.vf * r.vf : 0;
  r.Psv = 1.2 * (r.PN + r.Pd + r.Pvf) / gas.ro;
  r.leak = (r.GN - r.G0) / r.G0;
  /* Проверка справочника: пожар на ВЕРХНЕМ этаже (коллектор ниже без расхода, тяги нет) — сеть до выброса от узла этажа пожара.
     МР п. 2.2 берёт этаж «преимущественно нижний»; при сильной тяге худшим по давлению бывает верхний. Подсосы ниже этажа пожара не учтены. */
  gas = netGas(r.Tt - 273.15); v = r.Gt / (gas.ro * Fd); L = netLam(gas.ro, v, ded, gas.mu, r.k);
  r.top = { Pd: 0.5 * gas.ro * (r.zd + L.lam * r.ld / ded) * v * v, ro: gas.ro, Lv: 3600 * r.Gt / gas.ro, Pvf: r.out === 'fac' ? 0.5 * gas.ro * r.vf * r.vf : 0 };
  r.top.Psv = 1.2 * (r.Psm1 + r.top.Pd + r.top.Pvf) / gas.ro;
  r.fanP = Math.max(r.Psv, r.top.Psv); r.fanL = Math.max(r.Lv, r.top.Lv); r.fanTop = r.top.Psv > r.Psv;
  var over = r.seg.filter(function (s) { return s.P2 < 0; });
  if (over.length) {
    r.over = over[0].i;
    r.warn.push('С участка ' + over[0].i + ' в коллекторе уже не разрежение, а избыточное давление (тяга горячего дыма ' + dpuFmt(over[0].grav, 0) + ' Па на этаж больше потерь): дым будет выдавливаться через закрытые клапаны на этажи. Формула подсосов (85) МР этот случай не описывает, там подсос взят 0. Что делать: вентилятор подбирать по худшему этажу пожара, клапаны с малой дымогазопроницаемостью, разделить коллектор по высоте.');
  }
  /* проверки */
  [['sn-a0', r.v0, 'начальном участке'], ['sn-ac', r.seg.length ? r.seg[0].v : 0, 'коллекторе'], ['sn-ad', r.vd, 'сети до выброса']].forEach(function (x) {
    if (x[1] > 11) { r.warn.push('Скорость в ' + x[2] + ' ' + dpuFmt(x[1], 1) + ' м/с — больше 11 м/с (МР 5.1.1). Увеличь сечение, если трасса позволяет.'); r.marks.push([x[0], 'warnf', dpuFmt(x[1], 1) + ' м/с > 11']); }
  });
  if (r.svOut) r.warn.push('Температура дыма у клапанов выше 500 °C — таблица прил. 3 МР дальше не идёт, взято 29300 м³/кг (300–500 °C). Нужны данные изготовителя клапана.');
  if (r.ts > 1000) r.warn.push('Свойства дыма по прил. 2 взяты при 1000 °C.');
  if (r.leak > 0.3) r.warn.push('Подсосы ' + dpuFmt(r.leak * 100, 0) + ' % от расхода с этажа пожара: много закрытых клапанов или большое разрежение. Проверь сечения, раздели коллектор на системы.');
  return r;
}

function netCalc() {
  if (!$('#sn-g')) return;
  $('#sn-vf').parentNode.hidden = $('#sn-out').value !== 'fac';
  var r = netCompute(), f = dpuFmt, c = function (k, v, s, cl) { return '<div class="bstep' + (cl ? ' ' + cl : '') + '"><span>' + k + '</span><b>' + v + '</b>' + (s ? '<small>' + s + '</small>' : '') + '</div>'; };
  var h = '';
  if (r.err.length) h += r.err.map(function (e) { return c('Ошибка исходных данных', 'Пересмотри', e, 'warn'); }).join('');
  else {
    h += c('Вентилятор: подача', f(r.fanL, 0) + ' м³/ч', 'Пожар на нижнем этаже: ' + f(r.Lv, 0) + ' м³/ч при ' + f(r.TN - 273.15, 0) + ' °C, ρ = ' + f(r.roN, 3) + ' кг/м³, ' + f(r.GN, 3) + ' кг/с — формула (88). На верхнем: ' + f(r.top.Lv, 0) + ' м³/ч.', 'final');
    h += c('Вентилятор: давление', f(r.fanP, 0) + ' Па', 'Статическое, приведённое к 1,2 кг/м³ — формула (' + (r.out === 'fac' ? '90' : '89') + '). Пожар на нижнем этаже: ' + f(r.Psv, 0) + ' Па (перед вентилятором ' + f(r.PN, 0) + ' Па, сеть до выброса ' + f(r.Pd, 0) + ' Па' + (r.Pvf ? ', выброс на фасад ' + f(r.Pvf, 0) + ' Па' : '') + '). На верхнем: ' + f(r.top.Psv, 0) + ' Па' + (r.fanTop ? ' — худший, принят он (проверка справочника, МР п. 2.2 говорит «преимущественно нижний»)' : '') + '.', 'final');
    h += c('Подсосы', '+' + f(r.leak * 100, 1) + ' %', 'Через стенки ' + f(r.dGt + r.seg.reduce(function (s, x) { return s + x.dGa; }, 0), 3) + ' кг/с, через закрытые клапаны ' + f(r.seg.reduce(function (s, x) { return s + x.dGv; }, 0), 3) + ' кг/с. С этажа пожара ' + f(r.G0, 3) + ' → у вентилятора ' + f(r.GN, 3) + ' кг/с.');
    h += c('Этаж пожара', f(r.Psm1, 0) + ' Па', 'Разрежение на входе в коллектор: начальный участок ' + f(r.Psm0, 0) + ' Па (v = ' + f(r.v0, 1) + ' м/с), транзит, узел с клапаном.');
    h += c('Температура у вентилятора', f(r.TN - 273.15, 0) + ' °C', 'Вентилятор по классу — не ниже этой температуры, класс по п. 7.11 СП 7.13130.');
  }
  h += r.warn.map(function (w) { return c('Внимание', 'Проверь', w, 'warn'); }).join('');
  $('#sn-res').innerHTML = h;
  fcApply('sn-', r.marks);
  $('#sn-anim').innerHTML = r.err.length ? '' : netSvg(r);
  $('#sn-tab').innerHTML = r.err.length ? '' : netTable(r);
  NET_LAST = r;
}
var NET_LAST = null;

function netTable(r) {
  var f = dpuFmt;
  return '<div class="tscroll"><table class="vei"><thead><tr><th>Участок</th><th>P начало, Па</th><th>P конец, Па</th><th>v, м/с</th><th>λ</th><th>Тяга, Па</th><th>Подсос стенки, кг/с</th><th>Подсос клапаны, кг/с</th><th>G конец, кг/с</th><th>t конец, °C</th></tr></thead><tbody>' +
    '<tr><td>Начальный + транзит</td><td>' + f(r.P0, 0) + '</td><td>' + f(r.Pt, 1) + '</td><td>' + f(r.v0, 2) + '</td><td>' + f(r.lam0, 4) + '</td><td>—</td><td>' + f(r.dGt, 4) + '</td><td>—</td><td>' + f(r.Gt, 3) + '</td><td>' + f(r.Tt - 273.15, 1) + '</td></tr>' +
    '<tr><td>Узел с клапаном</td><td>' + f(r.Pt, 1) + '</td><td>' + f(r.Psm1, 1) + '</td><td>' + f(r.vj, 2) + '</td><td>—</td><td>—</td><td>—</td><td>—</td><td>' + f(r.Gt, 3) + '</td><td>' + f(r.Tt - 273.15, 1) + '</td></tr>' +
    r.seg.map(function (s) { return '<tr><td>Коллектор ' + s.i + '</td><td>' + f(s.P1, 1) + '</td><td>' + f(s.P2, 1) + '</td><td>' + f(s.v, 2) + '</td><td>' + f(s.lam, 4) + '</td><td>' + f(s.grav, 1) + '</td><td>' + f(s.dGa, 4) + '</td><td>' + f(s.dGv, 4) + '</td><td>' + f(s.G2, 3) + '</td><td>' + f(s.T2 - 273.15, 1) + '</td></tr>'; }).join('') +
    '<tr><td>До выброса</td><td>' + f(r.PN, 1) + '</td><td>' + f(r.PN + r.Pd, 1) + '</td><td>' + f(r.vd, 2) + '</td><td>—</td><td>—</td><td>—</td><td>—</td><td>' + f(r.GN, 3) + '</td><td>' + f(r.TN - 273.15, 1) + '</td></tr>' +
    '</tbody></table></div><p class="tnote">Тяга — gh(ρa − ρsm): горячий дым поднимается сам и уменьшает нужное разрежение.</p>';
}

/* Схема по расчёту: коллектор, этажи, закрытые клапаны со стрелками подсоса (толщина — по расходу), вентилятор. Не чертёж. */
function netSvg(r) {
  var f = dpuFmt, n = r.seg.length, show = Math.min(n, 12), W = 560, top = 62, fh = Math.max(26, Math.min(44, 420 / (show + 1))), H = top + fh * (show + 1) + 40;
  var x = 270, w = 34, maxV = Math.max.apply(null, r.seg.map(function (s) { return s.dGv + s.dGa; }).concat([1e-6]));
  var g = '<svg class="stsvg netsvg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Схема сети дымоудаления">';
  var yb = top + fh * (show + 1);
  g += '<rect x="' + x + '" y="' + top + '" width="' + w + '" height="' + (yb - top) + '" class="dpduct"/>';
  /* вентилятор */
  g += '<circle cx="' + (x + w / 2) + '" cy="' + (top - 22) + '" r="16" class="dpfan"/><line x1="' + (x + w / 2) + '" y1="' + (top - 6) + '" x2="' + (x + w / 2) + '" y2="' + top + '" class="dpline"/>';
  g += '<text class="stt" x="' + (x + w + 26) + '" y="' + (top - 26) + '">Вентилятор ' + f(r.fanL, 0) + ' м³/ч, ' + f(r.fanP, 0) + ' Па</text>';
  g += '<text class="stt dim" x="' + (x + w + 26) + '" y="' + (top - 10) + '">t ' + f(r.TN - 273.15, 0) + ' °C, разрежение ' + f(r.PN, 0) + ' Па</text>';
  for (var j = 0; j < show; j++) {
    var s = r.seg[n - show + j], y = top + fh * j + fh / 2, sw = 1 + 5 * (s.dGv + s.dGa) / maxV;
    g += '<line x1="40" y1="' + (y + fh / 2) + '" x2="' + (W - 20) + '" y2="' + (y + fh / 2) + '" class="dpfloor"/>';
    if (r.nv > 0) g += '<rect x="' + (x - 16) + '" y="' + (y - 7) + '" width="16" height="14" class="dpvalve"/><line x1="' + (x - 70) + '" y1="' + y + '" x2="' + (x - 18) + '" y2="' + y + '" class="dpleak" stroke-width="' + f(sw, 1).replace(',', '.') + '"/>';
    g += '<text class="stt dim" x="' + (x - 78) + '" y="' + (y + 4) + '" text-anchor="end">+' + f((s.dGv + s.dGa) * 1000, 0) + ' г/с</text>';
    g += '<text class="stt" x="' + (x + w + 10) + '" y="' + (y + 4) + '">' + f(s.P2, 0) + ' Па · ' + f(s.T2 - 273.15, 0) + ' °C · ' + f(s.G2, 2) + ' кг/с</text>';
  }
  /* этаж пожара */
  var yf = yb - fh / 2;
  g += '<line x1="40" y1="' + yb + '" x2="' + (W - 20) + '" y2="' + yb + '" class="dpfloor"/>';
  g += '<rect x="60" y="' + (yf - 8) + '" width="' + (x - 60) + '" height="16" class="dpduct"/><text class="stt fire" x="64" y="' + (yf - 12) + '">Этаж пожара: ' + f(r.G0, 2) + ' кг/с, ' + f(r.ts, 0) + ' °C</text>';
  g += '<text class="stt" x="' + (x + w + 10) + '" y="' + (yf + 4) + '">' + f(r.Psm1, 0) + ' Па на входе в коллектор</text>';
  if (n > show) g += '<text class="stt dim" x="' + (x + w / 2) + '" y="' + (top + fh * show + 4) + '" text-anchor="middle">⋮ ещё ' + (n - show) + '</text>';
  g += '</svg>';
  return g + '<p class="tnote">Схема строится по расчёту: стрелки — подсосы через закрытые клапаны и стенки (толще — больше). Показаны верхние ' + show + ' из ' + n + ' участков. Это не чертёж.</p>';
}

function netDoc() {
  var r = NET_LAST; if (!r || r.err.length) return;
  var f = dpuFmt, row = function (a, b) { return '<tr><td>' + a + '</td><td>' + b + '</td></tr>'; };
  var src = row('Gsm на этаже пожара, кг/с', f(r.G0, 3)) + row('Tsm, °C', f(r.ts, 1)) + row('Ta подсасываемого воздуха, °C', f(r.ta, 1) + ' (ρa = 353/Ta = ' + f(r.roa, 3) + ' кг/м³)') + row('P0, Па', f(r.P0, 1)) +
    row('Начальный участок, мм', f(r.a0 * 1000, 0) + ' × ' + f(r.b0 * 1000, 0) + ', l = ' + f(r.l0, 1) + ' м, Σζ = ' + f(r.z0, 2)) + row('Транзит, м', f(r.lt, 1)) + row('ζ узла с клапаном', f(r.zj, 2)) +
    row('Коллектор, мм', f(r.ac * 1000, 0) + ' × ' + f(r.bc * 1000, 0) + ', ' + r.N + ' участков по ' + f(r.h, 2) + ' м, горизонт. ' + f(r.lh, 1) + ' м, Σζ = ' + f(r.zc, 2)) +
    row('Закрытые клапаны на этаже', r.nv + ' шт. ' + f(r.av * 1000, 0) + ' × ' + f(r.bv * 1000, 0) + ' мм') + row('k, мм', f(r.k * 1000, 2)) + row('q, Вт/м', f(r.q, 1)) +
    row('До выброса, мм', f(r.ad * 1000, 0) + ' × ' + f(r.bd * 1000, 0) + ', l = ' + f(r.ld, 1) + ' м, Σζ = ' + f(r.zd, 2)) + row('Выброс', r.out === 'fac' ? 'на фасад, v = ' + f(r.vf, 1) + ' м/с' : 'на кровлю');
  var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>Расчёт сети дымоудаления</title>' +
    '<style>body{font-family:\'GOST type B\',\'GOST Type BU\',ISOCPEUR,Arial,sans-serif;font-size:12pt}h1{font-size:14pt}table{border-collapse:collapse}td,th{border:1px solid #000;padding:3pt 6pt;font-size:10pt}</style></head><body>' +
    '<h1>Аэродинамический расчёт сети вытяжной противодымной вентиляции и подбор вентилятора</h1>' +
    '<p>Основание: СП 7.13130.2013 с Изм. № 1–3; «Расчётное определение основных параметров противодымной вентиляции зданий. Методические рекомендации к СП 7.13130.2013» (ФГБУ ВНИИПО МЧС России, 2013), п. 5.1, прил. 2, прил. 3. Расчётный этаж пожара — нижний (МР п. 2.2).</p>' +
    '<h2 style="font-size:12pt">Исходные данные</h2><table>' + src + '</table>' +
    '<h2 style="font-size:12pt">Расчёт</h2>' +
    '<p>Начальный участок, формула (70): ρ<sub>sm0</sub> = ' + f(r.ro0, 3) + ' кг/м³ (прил. 2), v = G/(ρF) = ' + f(r.v0, 2) + ' м/с, d<sub>e</sub> = ' + f(r.de0, 3) + ' м, Re = ' + f(r.Re0, 0) + ', λ = ' + f(r.lam0, 4) + '; P<sub>sm0</sub> = ' + f(r.Psm0, 1) + ' Па.</p>' +
    '<p>Транзит, (75), (76): подсосы ΔG<sub>da</sub> = ' + f(r.dGt, 4) + ' кг/с; G′ = ' + f(r.Gt, 3) + ' кг/с, t′ = ' + f(r.Tt - 273.15, 1) + ' °C, P = ' + f(r.Pt, 1) + ' Па. Узел (82): P<sub>sm1</sub> = ' + f(r.Psm1, 1) + ' Па.</p>' +
    '<p>Участки коллектора — формулы (83)–(87), результаты в таблице.</p>' + netTable(r).replace(/<div class="tscroll">|<\/div>/g, '').replace(/class="[^"]*"/g, '') +
    '<p>Вентилятор, (88): L<sub>v</sub> = 3600 · ' + f(r.GN, 3) + ' / ' + f(r.roN, 3) + ' = ' + f(r.Lv, 0) + ' м³/ч при ' + f(r.TN - 273.15, 0) + ' °C.</p>' +
    '<p>Сопротивление сети до выброса P<sub>d</sub> = ' + f(r.Pd, 1) + ' Па (v = ' + f(r.vd, 2) + ' м/с). Формула (' + (r.out === 'fac' ? '90' : '89') + '): P<sub>sv</sub> = 1,2 · (' + f(r.PN, 1) + ' + ' + f(r.Pd, 1) + (r.Pvf ? ' + ' + f(r.Pvf, 1) : '') + ') / ' + f(r.roN, 3) + ' = ' + f(r.Psv, 0) + ' Па (пожар на нижнем этаже).</p>' +
    '<p>Проверка пожара на верхнем этаже (без коллектора ниже): P<sub>sv</sub> = 1,2 · (' + f(r.Psm1, 1) + ' + ' + f(r.top.Pd, 1) + (r.top.Pvf ? ' + ' + f(r.top.Pvf, 1) : '') + ') / ' + f(r.top.ro, 3) + ' = ' + f(r.top.Psv, 0) + ' Па, L<sub>v</sub> = ' + f(r.top.Lv, 0) + ' м³/ч.</p>' +
    '<p><b>Принят вентилятор: ' + f(r.fanL, 0) + ' м³/ч, ' + f(r.fanP, 0) + ' Па</b> (большее из двух случаев), температура перемещаемых газов до ' + f(Math.max(r.TN, r.Tt) - 273.15, 0) + ' °C.</p>' +
    (r.warn.length ? '<p><b>Замечания:</b></p><ul>' + r.warn.map(function (w) { return '<li>' + w + '</li>'; }).join('') + '</ul>' : '') +
    '<p>Допущения: ρ<sub>a</sub> = 353/T<sub>a</sub>; теплопотери стенками q = ' + f(r.q, 1) + ' Вт/м; коэффициенты местных сопротивлений приняты проектировщиком по справочнику Идельчика и паспортам клапанов.</p>' +
    '<p style="font-size:10pt;color:#555">Сформировано: «Справочник инженера ОВиК» v' + APP.ver + ', ' + new Date().toLocaleDateString('ru-RU') + '. Решение принимает ГИП.</p></body></html>';
  var blob = new Blob(['﻿', html], { type: 'application/msword' }), a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'Расчёт_сети_дымоудаления.doc'; document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

document.addEventListener('input', function (e) { if (/^sn-/.test(e.target.id)) netCalc(); });
document.addEventListener('change', function (e) { if (/^sn-/.test(e.target.id)) netCalc(); });
document.addEventListener('click', function (e) {
  if (e.target.id === 'sn-doc') netDoc();
  if (e.target.id === 'sn-take') {
    if (window.vnLastSmoke && vnLastSmoke()) { vnTake({ g: 'sn-g', t: 'sn-ts', tr: 'sn-ta' }); netCalc(); return; }
    var d = window.DPU_LAST; if (!d || d.err.length) { alert('Сначала посчитай расход дыма (вкладки «Дым из помещения», «Коридор», «Атриум») или ДПУ в разделе «Противодым».'); return; }
    $('#sn-g').value = Math.round(d.G * 1000) / 1000; $('#sn-ts').value = d.ts; $('#sn-ta').value = d.tr; netCalc();
  }
});
