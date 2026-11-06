/* Раздел «АУПТ»: спринклерная установка водой или пеной низкой кратности — параметры по табл. 6.1 СП 485 и гидравлический расчёт
   тупиковой симметричной сети (рис. Б.2, секция А) по приложению Б: (Б.1)–(Б.4), (Б.6), (Б.9)–(Б.11), (Б.14)–(Б.20), (Б.23)–(Б.26), (Б.30), (Б.31).
   Ограничения: только табл. 6.1 (группы 1–4.2, высота до 10 м); группы 5–7 и высота больше 10 м — табл. 6.2–6.3, здесь не считаются. */
var AU = { r: null, t0: 0, raf: 0 };

function auPipeOpts(sel) {
  return AU_PIPES.map(function (p, i) { return '<option value="' + i + '"' + (i === sel ? ' selected' : '') + '>ГОСТ ' + p[0] + ': DN ' + p[1] + ', ' + String(p[2]).replace('.', ',') + '×' + String(p[3]).replace('.', ',') + ' — Kт ' + String(p[4]).replace('.', ',') + '</option>'; }).join('');
}
function auF(id, l, v, hint) { return '<div class="stf"><label for="' + id + '">' + l + '</label><input id="' + id + '" type="number" step="any" value="' + v + '" inputmode="decimal">' + (hint ? '<small class="dhint">' + hint + '</small>' : '') + '</div>'; }
function auS(id, l, opts, v) { return '<div class="stf"><label for="' + id + '">' + l + '</label><select id="' + id + '">' + opts + '</select></div>'; }
function auO(a, v) { return a.map(function (x) { return '<option value="' + x[0] + '"' + (x[0] === v ? ' selected' : '') + '>' + x[1] + '</option>'; }).join(''); }
function auIdx(tp, dn) { for (var i = 0; i < AU_PIPES.length; i++) if (AU_PIPES[i][0] === tp && AU_PIPES[i][1] === dn) return i; return 0; }

function auBlock() {
  var gr = AU_T61.map(function (r) { return [r[0], 'Группа ' + r[0] + ' — ' + AU_GR[r[0]].slice(0, 70) + '…']; });
  return '<h1>АУПТ: спринклерное пожаротушение</h1><p class="lead">Водяная или пенная спринклерная установка по СП 485 с Изм. № 1 и № 2: группа помещения, нормативные параметры, гидравлический расчёт диктующей зоны, требуемый напор насоса и запас воды. Расчёт выгружается в Word.</p>' +
    '<h2>Группа помещения</h2><div class="trpick stpick">' + auS('au-g', 'Группа по приложению А', auO(gr, '2')) +
    auS('au-w', 'Огнетушащее вещество', auO([['w', 'вода'], ['ws', 'вода со смачивателем'], ['f', 'раствор пенообразователя']], 'w')) +
    auF('au-h', 'Высота помещения, м', '6', 'табл. 6.1 — до 10 м') + auF('au-sf', 'Площадь помещения, м²', '500', 'если меньше нормативной — прим. 4') +
    '</div><p class="sub" id="au-gd"></p><div class="barres stres" id="au-norm"></div>' +
    '<h2>Оросители и сеть</h2><div class="trpick stpick">' +
    auF('au-k', 'K оросителя, л/(с·м^0,5) — по ТД', '0.47') +
    auS('au-pm', 'Давление у диктующего', auO([['f13', 'по формуле Б.1, q = 1,3·i·12'], ['f14', 'по формуле Б.1, q = 1,4·i·12'], ['f15', 'по формуле Б.1, q = 1,5·i·12'], ['td', 'по эпюрам или паспорту — ввести']], 'f13')) +
    auF('au-p1', 'P у диктующего по ТД, МПа', '0.1') + auF('au-pmin', 'Минимальное давление по ТД, МПа', '0.05', 'не ниже, чем в ТД оросителя') +
    auF('au-li', 'Шаг в рядке li, м', '3') + auF('au-lp', 'Шаг между рядками lp, м', '3') +
    auF('au-m', 'Оросителей в ветви рядка (с одной стороны)', '3') + auF('au-la', 'От ближнего оросителя до питающего, м', '1.5') +
    auS('au-dr', 'Труба рядка (распределительная)', auPipeOpts(auIdx('10704', 40))) + auS('au-dm', 'Труба питающего между рядками', auPipeOpts(auIdx('10704', 65))) +
    '</div>' +
    '<h2>До насоса</h2><div class="trpick stpick">' +
    auS('au-df', 'Труба питающего до насоса', auPipeOpts(auIdx('10704', 100))) + auF('au-lg', 'Горизонтальный участок до насоса, м', '40') + auF('au-lv', 'Вертикальный участок, м', '8') +
    auF('au-puu', 'Потери в узле управления Pуу, МПа — по паспорту', '0.02') + auF('au-hz', 'Высота диктующего оросителя над осью насоса H, м', '8') + auF('au-pin', 'Давление на входе насоса Pвх, МПа', '0.1') +
    '</div><div class="barres stres" id="au-res"></div>' +
    '<div class="stanim"><div id="au-svg"></div><p class="tnote">Срабатывание диктующей зоны: первым — диктующий, самый удалённый ороситель, затем по мере роста давления к питающему. Это схема, не чертёж.</p></div>' +
    '<h3 class="sth">Расчёт по узлам</h3><div class="tscroll" id="au-tab"></div>' +
    '<div class="dpbtns"><button type="button" class="eibtn on" id="au-doc">Скачать расчёт в Word</button></div>' +
    '<h2>Таблица 6.1</h2><div class="tscroll"><table class="vei"><thead><tr><th>Группа</th><th>i воды</th><th>i раствора</th><th>Q воды, л/с</th><th>Q раствора, л/с</th><th>Smin, м²</th><th>t, мин</th><th>Шаг, м</th></tr></thead><tbody>' +
    AU_T61.map(function (r) { return '<tr>' + r.map(function (v, j) { return '<td>' + (v === null ? '—' : v === 'т62' ? 'по табл. 6.2' : j ? String(v).replace('.', ',') : v) + '</td>'; }).join('') + '</tr>'; }).join('') +
    '</tbody></table></div><p class="tnote">Интенсивность — л/(с·м²), не менее; расход и площадь — для спринклерных и спринклерно-дренчерных АУП.</p>' + refs([['sp485', 'табл. 6.1']]) +
    '<h2>Диаметр рядка — ориентир, табл. Б.4</h2><div class="tscroll"><table class="vei"><thead><tr><th>DN</th>' + AU_B4.map(function (r) { return '<th>' + r[0] + '</th>'; }).join('') + '</tr></thead><tbody><tr><td>Оросителей в ветви, P ≥ 0,5 МПа</td>' + AU_B4.map(function (r) { return '<td>' + r[1] + '</td>'; }).join('') + '</tr><tr><td>P до 0,5 МПа</td>' + AU_B4.map(function (r) { return '<td>' + (r[2] === null ? '—' : r[2]) + '</td>'; }).join('') + '</tr></tbody></table></div>' + refs([['sp485', 'табл. Б.4']]) +
    '<h2>Правила</h2>' + mini(AU_NOTES);
}
PAGES.aupt = auBlock;

function auN(id) { var e = $('#' + id); var s = e ? String(e.value).replace(',', '.').trim() : ''; return s === '' ? NaN : parseFloat(s); }
function auFm(v, n) { if (!isFinite(v)) return '—'; var k = Math.pow(10, n === undefined ? 3 : n); return (Math.round(v * k) / k).toString().replace('.', ','); }
function auVel(Q, p) { var d = (p[2] - 2 * p[3]) / 1000; return Q / 1000 / (Math.PI * d * d / 4); }

function auCompute() {
  var g = $('#au-g').value, w = $('#au-w').value, row = AU_T61.filter(function (r) { return r[0] === g; })[0], R = { g: g, w: w, err: [], warn: [], nodes: [], marks: [] };
  fcNums([['au-h', '', 0, null, true], ['au-sf', '', 0, null, true], ['au-k', '', 0, null, true], ['au-p1', '', 0, null, true], ['au-pmin', '', 0], ['au-li', '', 0, null, true], ['au-lp', '', 0, null, true],
    ['au-m', '', 1], ['au-la', '', 0, null, true], ['au-lg', '', 0], ['au-lv', '', 0], ['au-puu', '', 0], ['au-hz', '', -50], ['au-pin', '', 0]], R.marks);
  if (R.marks.some(function (m) { return m[1] === 'bad'; })) R.err.push('Исправь поля, подсвеченные красным.');
  R.h = auN('au-h'); R.Sf = auN('au-sf');
  var foam = w === 'f';
  R.i = foam ? row[2] : row[1]; R.Qn = foam ? row[4] : row[3]; R.Smin = row[5]; R.t = row[6]; R.lmax = row[7];
  if (R.i === 'т62' || R.i === null) R.marks.push([R.i === 'т62' ? 'au-g' : 'au-w', 'bad', R.i === 'т62' ? 'Группы 5–7 — по табл. 6.2, здесь не считаются' : 'Для этой группы такое ОТВ табл. 6.1 не нормирует']);
  if (R.i === 'т62') R.err.push('Группы 5–7 — параметры по табл. 6.2 (склады), здесь не реализовано.');
  else if (R.i === null) R.err.push(foam ? 'Для группы 1 раствор пенообразователя табл. 6.1 не нормирует.' : 'Для группы 4.2 табл. 6.1 даёт только раствор пенообразователя.');
  if (w === 'ws' && typeof R.i === 'number') { R.i = R.i / 1.5; R.Qn = R.Qn / 1.5; }
  if (R.h > 10) R.marks.push(['au-h', 'bad', 'Больше 10 м — табл. 6.2–6.3']);
  if (R.h > 10) R.err.push('Высота больше 10 м — параметры по табл. 6.2–6.3, от 20 до 30 м — дренчерные или АУП-ПП (прим. 3 к табл. 6.1).');
  if (g === '7' && foam === false) R.warn.push('Группа 7 — продолжительность для пены 25 мин (прим. 7).');
  R.Kred = (isFinite(R.Sf) && R.Sf < R.Smin) ? R.Sf / R.Smin : 1;
  R.QnAdj = typeof R.Qn === 'number' ? R.Qn * R.Kred : NaN;
  R.K = auN('au-k'); R.li = auN('au-li'); R.lp = auN('au-lp'); R.m = Math.round(auN('au-m')); R.la = auN('au-la');
  R.pr = AU_PIPES[+$('#au-dr').value]; R.pm = AU_PIPES[+$('#au-dm').value]; R.pf = AU_PIPES[+$('#au-df').value];
  R.lg = auN('au-lg'); R.lv = auN('au-lv'); R.puu = auN('au-puu'); R.H = auN('au-hz'); R.pin = auN('au-pin'); R.pmin = auN('au-pmin');
  if (R.li > R.lmax) R.marks.push(['au-li', 'bad', 'Больше ' + auFm(R.lmax, 1) + ' м по табл. 6.1']);
  if (R.lp > R.lmax) R.marks.push(['au-lp', 'bad', 'Больше ' + auFm(R.lmax, 1) + ' м по табл. 6.1']);
  if (R.li > R.lmax || R.lp > R.lmax) R.err.push('Шаг оросителей больше допустимого ' + auFm(R.lmax, 1) + ' м по табл. 6.1.');
  if (!(R.K > 0 && R.li > 0 && R.lp > 0 && R.m >= 1 && R.la > 0)) R.err.push('Заполни K, шаги, число оросителей в ветви и участок до питающего.');
  if (R.err.length) return R;
  /* (Б.2), (Б.3) */
  R.Om = R.li * R.lp; R.N = Math.ceil(R.Smin / R.Om - 1e-9);
  /* (Б.1) или ТД */
  var pm = $('#au-pm').value;
  if (pm === 'td') { R.P1 = auN('au-p1'); R.q1 = 10 * R.K * Math.sqrt(R.P1); R.pMode = 'по эпюрам или паспорту'; }
  else { var c = { f13: 1.3, f14: 1.4, f15: 1.5 }[pm]; R.c = c; R.q1 = c * R.i * 12; R.P1 = Math.pow(R.q1 / (10 * R.K), 2); R.pMode = 'по формуле Б.1 с коэффициентом ' + String(c).replace('.', ','); }
  if (isFinite(R.pmin) && R.P1 < R.pmin) { R.marks.push(['au-pmin', 'warnf', 'Расчётное P1 ниже — принято это значение']); R.warn.push('Давление по Б.1 ' + auFm(R.P1) + ' МПа ниже минимального по ТД — принято ' + auFm(R.pmin) + ' МПа.'); R.P1 = R.pmin; R.q1 = 10 * R.K * Math.sqrt(R.P1); }
  /* ветвь рядка I: (Б.4), (Б.6), (Б.9), (Б.10) */
  var P = R.P1, Q = 0, Kr = R.pr[4], vmax = 0;
  for (var k = 1; k <= R.m; k++) {
    var q = 10 * R.K * Math.sqrt(P); Q += q;
    var L = k < R.m ? R.li : R.la, dP = Q * Q * L / (100 * Kr), v = auVel(Q, R.pr); vmax = Math.max(vmax, v);
    R.nodes.push({ n: 'Ороситель ' + k + ' рядка I', P: P, q: q, Q: Q, L: L, dP: dP, v: v, pipe: R.pr });
    P += dP;
  }
  R.Pa = P; R.Qbr = Q; R.QI = 2 * Q; /* (Б.14), (Б.15) */
  R.B = R.QI * R.QI / R.Pa; /* (Б.17) */
  R.nodes.push({ n: 'Точка a: рядок I, 2 ветви', P: R.Pa, q: NaN, Q: R.QI, L: NaN, dP: NaN, v: NaN });
  var rows = Math.ceil(R.N / (2 * R.m)), Qc = R.QI, Pr = R.Pa, Km = R.pm[4];
  R.rowQ = [R.QI];
  for (var j = 2; j <= rows; j++) {
    var dPm = Qc * Qc * R.lp / (100 * Km), vm = auVel(Qc, R.pm); vmax = Math.max(vmax, vm); /* (Б.18) */
    R.nodes.push({ n: 'Питающий: рядок ' + (j - 1) + ' → ' + j, P: Pr, q: NaN, Q: Qc, L: R.lp, dP: dPm, v: vm, pipe: R.pm });
    Pr += dPm; /* (Б.19) */
    var Qr = Math.sqrt(R.B * Pr); Qc += Qr; R.rowQ.push(Qr); /* (Б.20) */
    R.nodes.push({ n: 'Рядок ' + j + ': Q = √(B·P)', P: Pr, q: NaN, Q: Qr, L: NaN, dP: NaN, v: NaN });
  }
  R.rows = rows; R.nSpr = rows * 2 * R.m; R.Qc = Qc; R.Pend = Pr; R.vmax = vmax;
  if (R.nSpr > R.N) R.warn.push('В диктующей зоне ' + R.N + ' оросителей по Б.2, по сетке целыми рядками — ' + R.nSpr + '. Расчёт целыми рядками, в запас.');
  /* (Б.24)–(Б.26) */
  R.Qpump = Math.max(R.Qc, R.QnAdj);
  R.below = R.Qc < R.QnAdj;
  /* (Б.30), (Б.31): потери от точки n до насоса, местные — 20 % линейных */
  var Kf = R.pf[4];
  R.Pg = R.Qpump * R.Qpump * R.lg / (100 * Kf); R.Pv = R.Qpump * R.Qpump * R.lv / (100 * Kf); R.Pm = 0.2 * (R.Pg + R.Pv);
  R.vf = auVel(R.Qpump, R.pf); vmax = Math.max(vmax, R.vf); R.vmax = vmax;
  R.Z = R.H / 100;
  R.Ptr = R.Pend + R.Pg + R.Pv + R.Pm + R.puu + R.Z; R.Pn = R.Ptr - R.pin;
  R.W = R.Qpump * R.t * 60 / 1000;
  [['au-dr', R.pr], ['au-dm', R.pm], ['au-df', R.pf]].forEach(function (x) { var Qx = x[0] === 'au-dr' ? R.Qbr : x[0] === 'au-dm' ? R.Qc : R.Qpump, vx = auVel(Qx, x[1]); if (vx > 10) R.marks.push([x[0], 'bad', 'Скорость ' + auFm(vx, 1) + ' м/с > 10 — увеличь DN']); });
  if (vmax > 10) R.warn.push('Скорость воды ' + auFm(vmax, 1) + ' м/с больше 10 м/с — увеличь диаметр (Б.1.2.6).');
  var b4 = AU_B4.filter(function (r) { return r[0] === R.pr[1]; })[0];
  if (b4) { var lim = R.P1 >= 0.5 ? b4[1] : b4[2]; if (typeof lim === 'number' && R.m > lim) R.marks.push(['au-dr', 'warnf', 'По табл. Б.4 — до ' + lim + ' оросителей в ветви']);
    if (typeof lim === 'number' && R.m > lim) R.warn.push('По табл. Б.4 на DN ' + R.pr[1] + ' ориентировочно до ' + lim + ' оросителей в ветви, у тебя ' + R.m + '. Проверь диаметр рядка.'); }
  return R;
}
function auCalc() {
  if (!$('#au-g')) { cancelAnimationFrame(AU.raf); AU.raf = 0; return; }
  $('#au-gd').textContent = 'Группа ' + $('#au-g').value + ': ' + AU_GR[$('#au-g').value] + '.';
  $('#au-p1').parentNode.hidden = $('#au-pm').value !== 'td';
  var R = auCompute(), c = function (k, v, s, cl) { return '<div class="bstep' + (cl ? ' ' + cl : '') + '"><span>' + k + '</span><b>' + v + '</b>' + (s ? '<small>' + s + '</small>' : '') + '</div>'; };
  var nh = '';
  if (typeof R.i === 'number') {
    nh += c('Интенсивность', auFm(R.i, 3) + ' л/(с·м²)', R.w === 'ws' ? 'вода со смачивателем: табличная / 1,5' : 'не менее');
    nh += c('Нормативный расход', auFm(R.QnAdj, 1) + ' л/с', R.Kred < 1 ? 'с K = Sф/S = ' + auFm(R.Kred, 2) + ' (прим. 4)' : 'не менее');
    nh += c('Минимальная площадь', R.Smin + ' м²', 'диктующая зона');
    nh += c('Время подачи', (R.t || '—') + ' мин', 'не менее'); nh += c('Шаг оросителей', 'до ' + auFm(R.lmax, 1) + ' м', 'розеткой вверх или вниз, п. 6.1.4');
  }
  $('#au-norm').innerHTML = nh;
  var h = '';
  if (R.err.length) h = R.err.map(function (e) { return c('Нельзя посчитать', 'Пересмотри', e, 'warn'); }).join('');
  else {
    h += c('Расход насоса', auFm(R.Qpump, 2) + ' л/с', R.below ? 'Расчётный ' + auFm(R.Qc, 2) + ' л/с меньше нормативного — насос на нормативный (Б.24).' : 'Расчётный больше нормативного ' + auFm(R.QnAdj, 1) + ' л/с — насос не меньше расчётного (Б.26).', 'final');
    h += c('Требуемое давление насоса', auFm(R.Pn, 3) + ' МПа', 'Pтр = ' + auFm(R.Ptr, 3) + ' МПа минус Pвх = ' + auFm(R.pin, 2) + '. Это ' + auFm(R.Pn * 102, 1) + ' м вод. ст.', 'final');
    h += c('Диктующий ороситель', auFm(R.q1, 3) + ' л/с', 'P1 = ' + auFm(R.P1, 4) + ' МПа, ' + R.pMode + '.');
    h += c('Оросителей в зоне', R.nSpr + ' шт.', 'N ≥ ' + R.Smin + ' / ' + auFm(R.Om, 2) + ' = ' + R.N + '; рядков: ' + R.rows + ', в каждом ' + (2 * R.m) + '.');
    h += c('Запас воды', auFm(R.W, 1) + ' м³', auFm(R.Qpump, 2) + ' л/с × ' + R.t + ' мин.');
    h += c('Наибольшая скорость', auFm(R.vmax, 2) + ' м/с', 'не больше 10 м/с.');
  }
  h += R.warn.map(function (w) { return c('Внимание', 'Проверь', w, 'warn'); }).join('');
  $('#au-res').innerHTML = h;
  fcApply('au-', R.marks);
  $('#au-tab').innerHTML = R.err.length ? '' : '<table class="vei"><thead><tr><th>Узел, участок</th><th>P, МПа</th><th>q, л/с</th><th>Q, л/с</th><th>L, м</th><th>ΔP, МПа</th><th>v, м/с</th></tr></thead><tbody>' +
    R.nodes.map(function (n) { return '<tr><td>' + n.n + '</td><td>' + auFm(n.P, 4) + '</td><td>' + auFm(n.q, 3) + '</td><td>' + auFm(n.Q, 3) + '</td><td>' + auFm(n.L, 2) + '</td><td>' + auFm(n.dP, 4) + '</td><td>' + auFm(n.v, 2) + '</td></tr>'; }).join('') +
    '<tr><td>Питающий до насоса: горизонталь + вертикаль</td><td>' + auFm(R.Pend, 4) + '</td><td></td><td>' + auFm(R.Qpump, 3) + '</td><td>' + auFm(R.lg + R.lv, 1) + '</td><td>' + auFm(R.Pg + R.Pv, 4) + '</td><td>' + auFm(R.vf, 2) + '</td></tr>' +
    '<tr><td>Местные 20 %, узел управления, Z = H/100</td><td></td><td></td><td></td><td></td><td>' + auFm(R.Pm + R.puu + R.Z, 4) + '</td><td></td></tr></tbody></table>';
  AU.r = R; AU.t0 = performance.now();
  if (!AU.raf) AU.raf = requestAnimationFrame(auTick);
}
function auTick(ts) {
  if (!$('#au-svg')) { AU.raf = 0; return; }
  auDraw(((ts - AU.t0) / 1000) % 9);
  AU.raf = requestAnimationFrame(auTick);
}
function auDraw(t) {
  var R = AU.r, box = $('#au-svg'); if (!box) return;
  if (!R || R.err.length) { box.innerHTML = ''; return; }
  var rows = R.rows, per = 2 * R.m, W = 340, k = Math.min(W / (per * R.li + 2), 170 / (rows * R.lp + 1)), ox = 10 + (W - per * R.li * k) / 2, oy = 20, g = '';
  var mainX = ox + R.m * R.li * k;
  g += '<line class="aumain" x1="' + mainX + '" y1="' + (oy - 10) + '" x2="' + mainX + '" y2="' + (oy + rows * R.lp * k + 14) + '"/>';
  g += '<text class="stt" x="' + (mainX + 4) + '" y="' + (oy + rows * R.lp * k + 14) + '">к насосу · ' + auFm(R.Qpump, 1) + ' л/с · ' + auFm(R.Pn, 2) + ' МПа</text>';
  for (var j = 0; j < rows; j++) {
    var y = oy + (j + 0.5) * R.lp * k;
    g += '<line class="aurow" x1="' + (ox + R.li * k / 2) + '" y1="' + y + '" x2="' + (ox + (per - 0.5) * R.li * k) + '" y2="' + y + '"/>';
    for (var s = 0; s < per; s++) {
      var x = ox + (s + 0.5) * R.li * k, far = Math.min(s, per - 1 - s), order = j * R.m + far, t0 = order * 0.25, on = t > t0;
      var dict = j === 0 && (s === 0 || s === per - 1);
      if (on) { var ph = ((t - t0) % 1.2) / 1.2; g += '<circle class="ausp" cx="' + x + '" cy="' + y + '" r="' + (3 + ph * R.li * k * 0.55) + '" style="opacity:' + (0.7 * (1 - ph)).toFixed(2) + '"/>'; }
      g += '<circle class="auh' + (on ? ' on' : '') + (dict ? ' dict' : '') + '" cx="' + x + '" cy="' + y + '" r="3.2"/>';
    }
  }
  g += '<text class="stt" x="' + ox + '" y="12">Диктующая зона: рядков ' + rows + ' × ' + per + ' = ' + R.nSpr + ' оросителей; рыжие — диктующие</text>';
  box.innerHTML = '<svg class="stsvg" viewBox="0 0 360 ' + (oy + rows * R.lp * k + 22) + '" role="img" aria-label="Схема срабатывания оросителей диктующей зоны">' + g + '</svg>';
}
function auDoc() {
  var R = AU.r; if (!R || R.err.length) return;
  var f = auFm, row = function (a, b) { return '<tr><td>' + a + '</td><td>' + b + '</td></tr>'; }, pn = function (p) { return 'ГОСТ ' + p[0] + ', DN ' + p[1] + ' (' + f(p[2], 1) + '×' + f(p[3], 1) + '), Kт = ' + f(p[4], 4) + ' л²/с²'; };
  var html = '<html><head><meta charset="utf-8"><style>body{font-family:"Times New Roman";font-size:12pt}table{border-collapse:collapse}td,th{border:1px solid #000;padding:3pt 6pt}</style></head><body>' +
    '<h1 style="font-size:14pt">Гидравлический расчёт спринклерной установки ' + (R.w === 'f' ? 'пенного' : 'водяного') + ' пожаротушения</h1>' +
    '<p>Основание: СП 485.1311500.2020 с Изм. № 1 (приказ МЧС России от 15.12.2025 № 1196) и № 2 (приказ от 26.05.2026 № 373): табл. 6.1, приложение А, приложение Б. Схема — тупиковая симметричная (рис. Б.2, секция А).</p>' +
    '<h2 style="font-size:12pt">Исходные данные</h2><table>' +
    row('Группа помещения (прил. А)', R.g + ' — ' + AU_GR[R.g]) + row('Огнетушащее вещество', { w: 'вода', ws: 'вода со смачивателем', f: 'раствор пенообразователя' }[R.w]) + row('Высота помещения, м', f(R.h, 1)) + row('Площадь помещения, м²', f(R.Sf, 1)) +
    row('Интенсивность орошения, л/(с·м²)', f(R.i, 3)) + row('Нормативный расход, л/с', f(R.QnAdj, 2) + (R.Kred < 1 ? ' (K = Sф/S = ' + f(R.Kred, 2) + ')' : '')) + row('Минимальная площадь орошения, м²', R.Smin) + row('Продолжительность подачи, мин', R.t) +
    row('Коэффициент производительности K, л/(с·м^0,5)', f(R.K, 3)) + row('Шаг li × lp, м', f(R.li, 2) + ' × ' + f(R.lp, 2)) + row('Оросителей в ветви рядка', R.m) +
    row('Распределительный трубопровод', pn(R.pr)) + row('Питающий между рядками', pn(R.pm)) + row('Питающий до насоса', pn(R.pf) + ', L = ' + f(R.lg, 1) + ' + ' + f(R.lv, 1) + ' м') +
    row('Потери в узле управления, МПа', f(R.puu, 3)) + row('Высота диктующего оросителя над осью насоса, м', f(R.H, 1)) + row('Давление на входе насоса, МПа', f(R.pin, 3)) + '</table>' +
    '<h2 style="font-size:12pt">Расчёт</h2>' +
    '<p>Условная площадь на ороситель (Б.3): Ω = li · lp = ' + f(R.li, 2) + ' · ' + f(R.lp, 2) + ' = ' + f(R.Om, 2) + ' м². Число оросителей (Б.2): N ≥ ' + R.Smin + ' / ' + f(R.Om, 2) + ' = ' + R.N + '; принято рядков: ' + R.rows + ', в каждом ' + (2 * R.m) + ' — ' + R.nSpr + ' шт.</p>' +
    (R.c ? '<p>Расход диктующего оросителя (Б.1): q1 = ' + f(R.c, 1) + ' · ' + f(R.i, 3) + ' · 12 = ' + f(R.q1, 3) + ' л/с; P1 = (q1 / 10K)² = (' + f(R.q1, 3) + ' / ' + f(10 * R.K, 2) + ')² = ' + f(R.P1, 4) + ' МПа.</p>' : '<p>Давление у диктующего оросителя по ТД: P1 = ' + f(R.P1, 4) + ' МПа; q1 = 10K√P1 = ' + f(R.q1, 3) + ' л/с (Б.4).</p>') +
    '<p>Потери на участках (Б.6): ΔP = Q² · L / (100 · Kт). Расход оросителей (Б.10): qn = 10K√Pn. Давление в узлах (Б.9), (Б.14), (Б.19).</p>' +
    '<table><tr><th>Узел, участок</th><th>P, МПа</th><th>q, л/с</th><th>Q, л/с</th><th>L, м</th><th>ΔP, МПа</th><th>v, м/с</th></tr>' +
    R.nodes.map(function (n) { return '<tr><td>' + n.n + '</td><td>' + f(n.P, 4) + '</td><td>' + f(n.q, 3) + '</td><td>' + f(n.Q, 3) + '</td><td>' + f(n.L, 2) + '</td><td>' + f(n.dP, 4) + '</td><td>' + f(n.v, 2) + '</td></tr>'; }).join('') + '</table>' +
    '<p>Рядок I (Б.15): QI = 2 · ' + f(R.Qbr, 3) + ' = ' + f(R.QI, 3) + ' л/с при Pa = ' + f(R.Pa, 4) + ' МПа. Обобщённая характеристика (Б.17): B = QI² / Pa = ' + f(R.B, 2) + ' л²/(с²·МПа). Последующие рядки (Б.20): Q = √(B · P).</p>' +
    '<p>Расчётный расход (Б.23): Qc = ' + f(R.Qc, 2) + ' л/с; нормативный Qн = ' + f(R.QnAdj, 2) + ' л/с. ' + (R.below ? 'Qc ≤ Qн (Б.24) — насос обеспечивает нормативный расход.' : 'Qc > Qн (Б.25) — расход насоса не менее расчётного (Б.26).') + ' Принято Qнас = ' + f(R.Qpump, 2) + ' л/с.</p>' +
    '<p>Требуемое давление насоса (Б.30): Pн = Pг + Pв + ΣPм + Pуу + Pд + Z − Pвх, где Pд + потери сети диктующей зоны = ' + f(R.Pend, 4) + ' МПа; Pг = ' + f(R.Pg, 4) + '; Pв = ' + f(R.Pv, 4) + '; ΣPм = 0,2 · (Pг + Pв) = ' + f(R.Pm, 4) + '; Pуу = ' + f(R.puu, 3) + '; Z = H / 100 = ' + f(R.Z, 3) + '; Pвх = ' + f(R.pin, 3) + ' МПа.</p>' +
    '<p><b>Pн = ' + f(R.Pn, 3) + ' МПа (' + f(R.Pn * 102, 1) + ' м вод. ст.), Qнас = ' + f(R.Qpump, 2) + ' л/с.</b> Запас ОТВ: W = Qнас · t = ' + f(R.Qpump, 2) + ' · ' + R.t + ' · 60 / 1000 = ' + f(R.W, 1) + ' м³.</p>' +
    (R.warn.length ? '<p><b>Замечания:</b></p><ul>' + R.warn.map(function (w) { return '<li>' + w + '</li>'; }).join('') + '</ul>' : '') +
    '<p style="font-size:10pt;color:#555">Сформировано: «Справочник инженера ОВиК» v' + APP.ver + ', ' + new Date().toLocaleDateString('ru-RU') + '. Местные потери приняты 20 % от линейных (п. Б.1.3.9, общий случай). Решение принимает разработчик проекта.</p></body></html>';
  var blob = new Blob(['﻿', html], { type: 'application/msword' }), a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'Расчёт_АУПТ.doc'; document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
document.addEventListener('input', function (e) { if (/^au-/.test(e.target.id)) auCalc(); });
document.addEventListener('change', function (e) { if (/^au-/.test(e.target.id)) auCalc(); });
document.addEventListener('click', function (e) { if (e.target.id === 'au-doc') auDoc(); });
