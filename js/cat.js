/* Раздел «Категории»: калькуляторы по СП 12.13130 (Б.1–Б.5, разд. 6) */
function num(id) { var v = parseFloat(String($('#' + id).value).replace(',', '.')); return isFinite(v) ? v : 0; }
function fmt(v) { return (Math.round(v * 10) / 10).toLocaleString('ru-RU'); }
function catStep(k, v, n, cls) { return '<div class="bstep' + (cls ? ' ' + cls : '') + '"><span>' + k + '</span><b>' + v + '</b>' + (n ? '<small>' + n + '</small>' : '') + '</div>'; }

function roomCalcBlock() {
  return '<div class="trpick calc"><div class="cgrid">' +
    '<label>Пожарная нагрузка Q, МДж<input id="c-q" inputmode="decimal" value="25000"><small>Σ масса × низшая теплота сгорания</small></label>' +
    '<label>Площадь размещения S, м²<input id="c-s" inputmode="decimal" value="20"><small>не меньше 10 м²</small></label>' +
    '<label>Высота H до низа ферм, м<input id="c-h" inputmode="decimal" value="4"></label>' +
    '<label>Материал для В4<select id="c-m">' + QKR.map(function (m, i) { return '<option value="' + i + '">' + m[0] + (m[1] ? ', ' + String(m[1]).replace('.', ',') : '') + '</option>'; }).join('') + '</select></label>' +
    '</div><div class="barres" id="c-res"></div></div>' + refs([['sp12', 'прил. Б']]);
}
function lpr(q) {
  if (!q) return 12;
  var r = 12;
  LPR.forEach(function (p) { if (q >= p[0]) r = p[1]; });
  return r;
}
function roomCalc() {
  var o = $('#c-res');
  if (!o) return;
  var Q = num('c-q'), S0 = num('c-s'), H = num('c-h'), S = Math.max(S0, 10), g = Q / S, cat, gt = 0, note = '';
  if (g > 2200) cat = 'В1';
  else if (g >= 1401) { cat = 'В2'; gt = 2200; }
  else if (g >= 181) { cat = 'В3'; gt = 1400; }
  else if (g >= 1) cat = 'В4';
  else cat = '—';
  var h = catStep('Удельная нагрузка g', fmt(g) + ' МДж/м²', S0 < 10 ? 'S принята 10 м² вместо ' + fmt(S0) : 'Q / S');
  h += catStep('По табл. Б.1', cat === '—' ? 'не В' : cat, cat === '—' ? 'меньше 1 МДж/м² — проверь Г или Д' : '');
  if (gt) {
    var lim = 0.64 * gt * H * H, up = Q >= lim;
    if (up) cat = cat === 'В2' ? 'В1' : 'В2';
    h += catStep('Проверка Б.5', up ? cat : 'остаётся ' + cat, 'Q ' + (up ? '≥' : '<') + ' 0,64·' + gt + '·' + fmt(H) + '² = ' + fmt(lim) + ' МДж', up ? 'warn' : '');
  }
  if (cat === 'В4') {
    var m = QKR[$('#c-m').value], l = lpr(m[1]), L = H < 11 ? l + (11 - H) : l;
    note = 'Участки не больше 10 м², между ними не меньше ' + fmt(L) + ' м' + (H < 11 ? ' (' + fmt(l) + ' + 11 − ' + fmt(H) + ')' : '') + '. Иначе — В3.';
    h += catStep('Условие В4', fmt(L) + ' м', note);
  }
  h += catStep('Категория помещения', cat === '—' ? 'не В' : cat, 'если помещение не относится к А и Б', 'final');
  o.innerHTML = h;
  o.classList.remove('pop'); void o.offsetWidth; o.classList.add('pop');
}

function bldCalcBlock() {
  var f = function (id, t, v) { return '<label>' + t + '<input id="' + id + '" inputmode="decimal" value="' + v + '"></label>'; };
  return '<div class="trpick calc"><div class="cgrid">' + f('b-tot', 'Все помещения, м²', 5000) + f('b-a', 'Категория А, м²', 0) + f('b-b', 'Категория Б, м²', 0) +
    f('b-v', 'В1, В2, В3 вместе, м²', 400) + f('b-g', 'Категория Г, м²', 0) + '</div>' +
    '<div class="dchk"><label><input type="checkbox" id="b-aupt"> Помещения А, Б, В1–В3 оснащены АУПТ</label></div>' +
    '<div class="barres" id="b-res"></div></div>' + refs([['sp12', '6.2–6.10']]);
}
function bldCalc() {
  var o = $('#b-res');
  if (!o) return;
  var T = num('b-tot'), A = num('b-a'), B = num('b-b'), V = num('b-v'), G = num('b-g'), au = $('#b-aupt').checked;
  if (T <= 0) { o.innerHTML = catStep('Ошибка', 'нет площади', 'укажи площадь всех помещений'); return; }
  var p = function (x) { return fmt(x / T * 100) + ' %'; }, h = '', cat = 'Д';
  var sA = A, sAB = A + B, sV = sAB + V, sG = sV + G;
  var test = function (name, s, over, exempt, pt) {
    var o2 = over && !exempt;
    h += catStep(name, o2 ? 'да' : 'нет', fmt(s) + ' м² = ' + p(s) + (over ? (exempt ? '; снято по п. ' + pt + ' (АУПТ, ≤ 25 %)' : '; порог превышен') : '; порог не превышен'), o2 ? 'warn' : '');
    return o2;
  };
  if (test('Категория А, п. 6.2', sA, sA > 0.05 * T || sA > 200, au && sA <= 0.25 * T && sA <= 1000, '6.3')) cat = 'А';
  else if (test('Категория Б, п. 6.4', sAB, sAB > 0.05 * T || sAB > 200, au && sAB <= 0.25 * T && sAB <= 1000, '6.5')) cat = 'Б';
  else if (test('Категория В, п. 6.6', sV, sV > (sAB ? 0.05 : 0.1) * T, au && sV <= 0.25 * T && sV <= 3500, '6.7')) cat = 'В';
  else if (test('Категория Г, п. 6.8', sG, sG > 0.05 * T, au && sG <= 0.25 * T && sG <= 5000, '6.9')) cat = 'Г';
  h += catStep('Категория здания', cat, cat === 'Д' ? 'не относится к А, Б, В, Г — п. 6.10' : '', 'final');
  o.innerHTML = h;
  o.classList.remove('pop'); void o.offsetWidth; o.classList.add('pop');
}
document.addEventListener('input', function (e) {
  if (/^c-/.test(e.target.id)) roomCalc();
  if (/^b-/.test(e.target.id)) bldCalc();
});
document.addEventListener('change', function (e) {
  if (/^c-/.test(e.target.id)) roomCalc();
  if (/^b-/.test(e.target.id)) bldCalc();
});
