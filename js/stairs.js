/* Раздел «Лестничные клетки» на странице «Здание»: подбор типа, анимированный разрез, карточки.
   Данные — data_stairs.js, пределы — DEG_ROWS (табл. 21 123-ФЗ). Логика подбора — СП 1.13130 п. 4.4.12–4.4.19, 8.1.3;
   СП 2.13130 п. 5.4.16 г); СП 7.13130 п. 7.14 з), 8.4. */
var STAIR_CLS = [
  ['f13s', 'Ф1.3 жилой секционный'], ['f13c', 'Ф1.3 жилой коридорный, галерейный'], ['f1', 'Ф1.1, Ф1.2, Ф1.4'], ['f24', 'Ф2–Ф4 общественные'],
  ['f5ab', 'Ф5, здание категории А или Б'], ['f5v', 'Ф5, здание категории В'], ['f5gd', 'Ф5, здание категории Г или Д'], ['f5free', 'Ф5 категории В или Д без постоянных рабочих мест']
];
var STAIR_CAP = {
  'Л1': 'Обычная клетка от дыма не защищена. Дым, попавший через дверь, уходит через окна в наружной стене — их открывают вручную.',
  'Л2': 'Обычная клетка со светом сверху. Дым поднимается и уходит через проём в покрытии; при высоте 9–12 м проём открывается автоматически.',
  'Н1': 'С этажа в клетку попадают через открытый переход в наружной воздушной зоне. Дым из коридора уходит наружу и в клетку не попадает.',
  'Н2': 'Вентилятор подаёт наружный воздух в саму клетку: 20–150 Па. Через открытую дверь этажа пожара воздух выходит в коридор и не пускает дым; дым из коридора удаляет вытяжная противодымная вентиляция.',
  'Н3': 'На каждом этаже перед клеткой — тамбур-шлюз. Воздух подают в тамбур-шлюз этажа пожара: в открытой двери не меньше 1,3 м/с. Клетка без подпора.'
};
var STAIR_CAP_REF = { 'Л1': [['fz123', 'ст. 40'], ['sp2', '5.4.16 б)']], 'Л2': [['fz123', 'ст. 40'], ['sp1', '4.4.12'], ['sp1', '4.4.16']], 'Н1': [['fz123', 'ст. 40'], ['sp1', '4.4.14']],
  'Н2': [['sp7', '7.14 в)'], ['sp7', '7.15 б)'], ['sp7', '7.16 б)'], ['sp1', '4.4.13']], 'Н3': [['sp7', '7.14 г)'], ['sp7', '7.15'], ['sp7', '7.16 б)']] };

function stMove(path, n, dur, cls, r) {
  var s = '';
  for (var i = 0; i < n; i++) s += '<circle class="' + cls + '" r="' + (r || 3) + '"><animateMotion dur="' + dur + 's" begin="-' + (dur * i / n).toFixed(2) + 's" repeatCount="indefinite" path="' + path + '"/></circle>';
  return s;
}
function stMarch(x0, x1, y0, y1) {
  var m = (x0 + x1) / 2;
  return '<path class="stm" d="M' + x0 + ' ' + y1 + ' L' + m + ' ' + ((y0 + y1) / 2) + ' L' + x1 + ' ' + ((y0 + y1) / 2) + ' M' + x0 + ' ' + ((y0 + y1) / 2) + ' L' + m + ' ' + y0 + '"/>';
}
function stairSvg(k) {
  var sx = k === 'Н1' ? 240 : (k === 'Н3' ? 236 : 230), rx = k === 'Н1' ? 200 : 210, F = [50, 110, 170, 230], g = '';
  /* здание: помещения и этажи */
  g += '<rect class="stb" x="20" y="50" width="' + (rx - 20) + '" height="180"/>';
  F.slice(1, 3).forEach(function (y) { g += '<line class="stl" x1="20" y1="' + y + '" x2="' + rx + '" y2="' + y + '"/>'; });
  g += '<rect class="stfire-room" x="21" y="111" width="' + (rx - 22) + '" height="58"/>';
  /* лестничная клетка */
  g += '<rect class="stc-box" x="' + sx + '" y="50" width="' + (320 - sx) + '" height="180"/>';
  for (var f = 0; f < 3; f++) g += stMarch(sx + 8, 312, F[f] + 6, F[f + 1] - 4);
  /* двери с этажа */
  var doorX = k === 'Н1' ? sx : (k === 'Н3' ? 210 : sx);
  F.slice(0, 3).forEach(function (y) { g += '<rect class="std" x="' + (doorX - 2) + '" y="' + (y + 28) + '" width="4" height="30"/>'; });
  if (k !== 'Н1' && k !== 'Н3') g += '<rect class="stgap" x="' + rx + '" y="50" width="' + (sx - rx) + '" height="180"/>';
  if (k === 'Н1') {
    g += '<rect class="stair-zone" x="' + rx + '" y="50" width="' + (sx - rx) + '" height="180"/>';
    F.slice(1, 4).forEach(function (y) { g += '<line class="stl" x1="' + rx + '" y1="' + y + '" x2="' + sx + '" y2="' + y + '"/><line class="strail" x1="' + (rx + 20) + '" y1="' + (y - 14) + '" x2="' + (rx + 20) + '" y2="' + y + '"/>'; });
    F.slice(0, 3).forEach(function (y) { g += '<rect class="std" x="' + (rx - 2) + '" y="' + (y + 28) + '" width="4" height="30"/>'; });
    g += '<text class="stt" x="' + (rx + 20) + '" y="44" text-anchor="middle">воздушная зона</text>';
  }
  if (k === 'Н3') {
    F.slice(0, 3).forEach(function (y) { g += '<rect class="sttam' + (y === 110 ? ' on' : '') + '" x="210" y="' + (y + 22) + '" width="26" height="38"/><rect class="std" x="' + (sx - 2) + '" y="' + (y + 28) + '" width="4" height="30"/>'; });
    g += '<rect class="stduct" x="219" y="22" width="8" height="112"/><rect class="stfan" x="211" y="14" width="24" height="12" rx="3"/>';
    g += '<text class="stt" x="223" y="10" text-anchor="middle">подпор</text><text class="stt air" x="196" y="104" text-anchor="end">≥ 1,3 м/с</text>';
  }
  if (k === 'Л1') [70, 130, 190].forEach(function (y) { g += '<rect class="stwin" x="317" y="' + y + '" width="6" height="22"/>'; });
  if (k === 'Л2') g += '<rect class="stsky" x="255" y="46" width="44" height="7"/><text class="stt" x="277" y="40" text-anchor="middle">проём в покрытии</text>';
  if (k === 'Н2') g += '<rect class="stduct" x="296" y="22" width="8" height="28"/><rect class="stfan" x="288" y="12" width="24" height="12" rx="3"/><text class="stt" x="300" y="8" text-anchor="middle">подпор 20–150 Па</text>';
  if (k === 'Н2' || k === 'Н3') g += '<rect class="stex" x="150" y="22" width="10" height="90"/><text class="stt" x="155" y="16" text-anchor="middle">дымоудаление</text>';
  /* очаг */
  g += '<path class="stflame" d="M60 168 C52 158 56 150 62 142 C62 150 68 150 70 144 C76 152 74 162 68 168 Z"/><text class="stt fire" x="40" y="126">этаж пожара</text>';
  g += '<line class="stl" x1="0" y1="230" x2="360" y2="230"/>';
  /* потоки */
  var smoke = 'M64 142 C70 125 90 117 120 117 L' + (rx - 8) + ' 118 C' + (rx - 2) + ' 122 ' + (rx - 2) + ' 135 ' + (rx - 4) + ' 145', flows = '';
  if (k === 'Л1') flows = stMove(smoke + ' L' + (sx + 20) + ' 145 C' + (sx + 50) + ' 120 290 95 318 80 L345 72', 10, 6, 'sts', 4);
  if (k === 'Л2') flows = stMove(smoke + ' L' + (sx + 20) + ' 145 C' + (sx + 40) + ' 110 275 80 277 50 L277 22', 10, 6, 'sts', 4);
  if (k === 'Н1') flows = stMove(smoke + ' L' + (rx + 10) + ' 145 C' + (rx + 25) + ' 120 ' + (rx + 10) + ' 80 ' + (rx + 18) + ' 50 L' + (rx + 22) + ' 18', 10, 6, 'sts', 4);
  if (k === 'Н2') {
    flows = stMove('M64 142 C70 125 100 116 155 114 L155 20', 8, 5, 'sts', 4) +
      stMove('M300 22 L300 60 C300 90 270 110 260 140 L' + (sx + 6) + ' 150 L' + (rx - 30) + ' 152', 9, 4, 'sta', 3);
  }
  if (k === 'Н3') {
    flows = stMove('M64 142 C70 125 100 116 155 114 L155 20', 8, 5, 'sts', 4) +
      stMove('M223 22 L223 140 L216 150 L180 152', 8, 3.2, 'sta', 3);
  }
  return '<svg class="stsvg" viewBox="0 0 360 240" role="img" aria-label="Схема лестничной клетки ' + k + '">' + g + flows + '</svg>';
}
function stairAnim(k) {
  return stairSvg(k) + '<p class="stcap"><b>' + k + '.</b> ' + esc(STAIR_CAP[k]) + '</p>' + refs(STAIR_CAP_REF[k]) +
    '<p class="tnote">Схема поясняет принцип, это не чертёж. Серые точки — дым, голубые — подаваемый воздух.</p>';
}

function stairPickBlock() {
  var o = function (a, v) { return a.map(function (x) { return '<option value="' + x[0] + '"' + (x[0] === v ? ' selected' : '') + '>' + x[1] + '</option>'; }).join(''); };
  return '<div class="trpick stpick">' +
    '<div class="stf"><label for="st-c">Класс здания</label><select id="st-c">' + o(STAIR_CLS, 'f24') + '</select></div>' +
    '<div class="stf"><label for="st-h">Высота здания по СП 1 п. 3.1, м</label><input id="st-h" type="number" min="0" step="0.1" value="20" inputmode="decimal"></div>' +
    '<div class="stf"><label for="st-d">Степень огнестойкости и класс</label><select id="st-d">' + o([['1', 'I или II, С0'], ['2', 'I или II, С1'], ['3', 'III, С0 или С1'], ['4', 'IV, V или С2, С3']], '1') + '</select></div>' +
    '<div class="stf"><label for="st-l">Естественный свет в клетке</label><select id="st-l">' + o([['wall', 'окна в наружных стенах'], ['roof', 'только проём в покрытии'], ['none', 'нет']], 'wall') + '</select></div>' +
    '<div class="stf"><label for="st-u">Подземных этажей, включая подвал</label><select id="st-u">' + o([['0', 'нет или 1'], ['2', '2 и больше']], '0') + '</select></div>' +
    '<label class="stchk"><input id="st-m" type="checkbox"> многофункциональное: клетка соединяет части разной функциональной пожарной опасности</label>' +
    '</div><div class="barres stres" id="st-res"></div>';
}
function stStep(cls, k, b, s, r) { return { c: cls, k: k, b: b, s: s, r: r }; }
function stairPick() {
  if (!$('#st-c')) return;
  var c =$('#st-c').value, h = parseFloat(String($('#st-h').value).replace(',', '.')) || 0, d = $('#st-d').value, l = $('#st-l').value,
    u = $('#st-u').value === '2', m = $('#st-m').checked, out = [], rec = [];
  var f14 = c === 'f13c' || c === 'f1' || c === 'f24', f5 = /^f5/.test(c);
  var needN = (h > 28 && c !== 'f5free') || c === 'f5ab' || m;
  if (needN) {
    var why = c === 'f5ab' ? 'Ф5 категории А или Б — при любой высоте' : (m && h <= 28 ? 'многофункциональное: при любой высоте для клеток между частями разной Ф' : 'здание выше 28 м');
    out.push(stStep('final', 'Требуются', 'Незадымляемые', why + '. Как правило — Н1.', [['sp1', '4.4.18']]));
    if (f14) { rec = ['Н1', 'Н2', 'Н3']; out.push(stStep('', 'Допускается', 'Н2 или Н3', 'Не меньше 50 % клеток — Н1 или Н2 со входом на каждом этаже через тамбур-шлюз 1-го типа с подпором при пожаре и выходом прямо наружу.', [['sp1', '4.4.18']])); }
    else if (c === 'f13s') { rec = ['Н1']; out.push(stStep('warn', 'Секционный жилой', 'Н1', 'Допуск Н2 и Н3 из п. 4.4.18 на секционные Ф1.3 не распространяется.', [['sp1', '4.4.18']])); }
    else if (c === 'f5ab') { rec = ['Н1', 'Н2', 'Н3']; out.push(stStep('', 'Вместо Н1 допускается', 'Н2 или Н3', 'С естественным освещением и постоянным подпором воздуха.', [['sp1', '8.1.3']])); }
    else if (c === 'f5v') { rec = ['Н1', 'Н2', 'Н3']; out.push(stStep('', 'Вместо Н1 допускается', 'Н2 или Н3', 'С подпором воздуха при пожаре.', [['sp1', '8.1.3']])); }
    else if (c === 'f5gd') { rec = ['Н1', 'Н2', 'Н3', 'Л1']; out.push(stStep('', 'Вместо Н1 допускается', 'Н2, Н3 или Л1', 'Н2, Н3 — с подпором при пожаре. Л1 — с разделением глухой противопожарной перегородкой через каждые 20 м по высоте и переходом из одной части в другую вне объёма клетки.', [['sp1', '8.1.3']])); }
  } else if (c === 'f5free' && h > 28) {
    rec = ['Л1'];
    out.push(stStep('warn', 'Прямого указания нет', 'Нужно обоснование', 'П. 4.4.18 незадымляемые не требует, но Л1 по п. 4.4.15 — только до 28 м, Л2 — до 9–12 м. Вывод справочника: решение согласовать отдельно.', [['sp1', '4.4.18'], ['sp1', '4.4.15']]));
  } else if (l !== 'none') {
    rec = [];
    if (l === 'wall') { rec = ['Л1']; out.push(stStep('final', 'Можно обычные', 'Л1', 'Высота до 28 м — Л1 допускается для всех классов.', [['sp1', '4.4.15']])); }
    var base = !f5 && d !== '4', f13 = c === 'f13s' || c === 'f13c', l2 = '', p50 = ' Таких клеток не больше 50 %, кроме зданий Ф1.3 и Ф1.4.';
    if (base && h <= 9) l2 = 'Высота до 9 м.' + p50;
    else if (base && h <= 12) l2 = 'От 9 до 12 м — только с автоматическим открыванием верхнего проёма при пожаре, кроме лечебных со стационаром.' + p50;
    else if (f13 && (d === '1' || d === '2')) l2 = 'Ф1.3 I–II степени, С0, С1 до 28 м — только при всех условиях: двери на клетку противопожарные 2-го типа, СПС и СОУЭ не ниже 2-го типа, аварийные выходы из квартир выше 4 м, световой колодец и фонарь с автооткрыванием, эвакуационное освещение 1-й категории.';
    if (l2) { rec.push('Л2'); out.push(stStep('', 'Допускается', 'Л2', l2, [['sp1', '4.4.16']])); }
    else out.push(stStep('warn', 'Нельзя', 'Л2', f5 ? 'Л2 — только для Ф1–Ф4.' : (d === '4' ? 'Нужны I–III степень и класс С0 или С1.' : 'Выше 12 м Л2 допускается только в жилых Ф1.3 I–II степени.'), [['sp1', '4.4.16']]));
  }
  if (l === 'roof' && rec.indexOf('Л2') < 0 && !needN) out.push(stStep('warn', 'Свет только сверху', 'Л1 и Л2 нельзя', 'Л1 нужны окна в наружных стенах на каждом этаже, Л2 здесь не допускается. Остаются незадымляемые без естественного света — см. ниже.', [['sp1', '4.4.12'], ['sp1', '4.4.16']]));
  if (l === 'none' || (l === 'roof' && (needN || rec.indexOf('Л2') < 0))) {
    var nl = h > 28 ? 'Н2 со входом на каждом этаже через тамбур-шлюз 1-го типа с подпором при пожаре' : 'Н2 или Н3';
    rec = h > 28 ? ['Н2', 'Н1'] : ['Н2', 'Н3'];
    out.push(stStep('warn', 'Без естественного света', h > 28 ? 'Н2 + тамбур-шлюз' : 'Н2 или Н3', nl + '. Постоянное искусственное освещение 1-й категории и фотолюминесцентные элементы по ГОСТ 34428-2018.' +
      (h > 28 ? ' Н1 без проёмов допускается при аварийном освещении.' : '') + ' Л1 без света — только для эвакуации из подвала.', [['sp1', '4.4.12'], ['fz123', 'ст. 40 ч. 2']]));
  }
  if (u) out.push(stStep('', '2 подземных этажа и больше', 'Н3 или Н2', 'Для эвакуации с подземных этажей — Н2 со входом через противопожарные двери не ниже 1-го типа. Выходы подземной и надземной части — обособленные.', [['sp1', '4.4.19'], ['sp1', '4.4.22']]));
  if (rec.indexOf('Н2') >= 0 || rec.indexOf('Н3') >= 0 || u) {
    out.push(stStep('', 'Двери Н2 и Н3', h >= 50 ? 'Противопожарные 1-го типа' : 'Противопожарные 2-го типа', h >= 50 ? 'Здание 50 м и выше. Наружные двери — не нормируются этим пунктом.' : 'Здание ниже 50 м. Наружные двери — не нормируются этим пунктом.', [['sp2', '5.4.16 г)']]));
    if (h > 28) out.push(stStep('', 'Н2 выше 28 м', 'Выход в вестибюль через тамбур-шлюз', 'С подпором воздуха при пожаре.', [['sp7', '8.4'], ['sp7', '7.14 м)']]));
    var tz = (m && h > 28) || ((c === 'f13s' || c === 'f13c') && h > 75) || (c === 'f24' && h > 50);
    if (tz) out.push(stStep('', 'Н2: поэтажные тамбур-шлюзы', 'Подпор на этаже пожара', 'Многофункциональные выше 28 м, жилые выше 75 м, общественные выше 50 м.', [['sp7', '7.14 з)']]));
  }
  $('#st-res').innerHTML = out.map(function (s) { return '<div class="bstep ' + s.c + '"><span>' + s.k + '</span><b>' + s.b + '</b><small>' + esc(s.s) + '</small>' + refs(s.r) + '</div>'; }).join('');
  [].forEach.call(document.querySelectorAll('[data-stair]'), function (b) { b.classList.toggle('rec', rec.indexOf(b.dataset.stair) >= 0); });
  if (rec.length) stairShow(rec[0]);
}
function stairShow(k) {
  var a = $('#st-anim'); if (!a) return;
  a.innerHTML = stairAnim(k);
  [].forEach.call(document.querySelectorAll('[data-stair]'), function (b) { b.classList.toggle('on', b.dataset.stair === k); });
}

function stairsBlock() {
  var lim = '<div class="tscroll"><table class="vei"><thead><tr><th>Степень</th><th>Внутренние стены клетки</th><th>Марши и площадки</th></tr></thead><tbody>' +
    DEG_ROWS.map(function (r) { return '<tr><td>' + r[0] + '</td><td><span class="ei">' + r[1][5] + '</span></td><td><span class="ei">' + r[1][6] + '</span></td></tr>'; }).join('') +
    '</tbody></table></div>' + refs([['fz123', 'табл. 21']]);
  var cards = '<div class="stairs">' + STAIR_TYPES.map(function (c) {
    return '<article class="stc"><div class="sthead"><b>' + c.k + '</b><h3>' + esc(c.h) + '</h3></div><p>' + esc(c.d) + '</p>' + refs(c.r) +
      '<ul>' + c.p.map(function (p) { return '<li>' + esc(p[0]) + refs(p[1]) + '</li>'; }).join('') + '</ul></article>';
  }).join('') + '</div>';
  var tabs = '<div class="eibtns" role="group" aria-label="Тип лестничной клетки">' + ['Л1', 'Л2', 'Н1', 'Н2', 'Н3'].map(function (k, i) {
    return '<button type="button" class="eibtn' + (i ? '' : ' on') + '" data-stair="' + k + '">' + k + '</button>'; }).join('') + '</div>';
  return '<h2 id="stairs">Лестничные клетки</h2><p class="sub">Какой тип нужен — подбор по зданию. Как работает каждый — схема с дымом и воздухом. Размеры маршей и площадок — в разделе <a href="#evac">«Эвакуация»</a>.</p>' +
    '<h3 class="sth">Какую клетку применить</h3>' + stairPickBlock() +
    '<h3 class="sth">Как работает</h3>' + tabs + '<div class="stanim" id="st-anim">' + stairAnim('Л1') + '</div>' +
    '<h3 class="sth">Требования по типам</h3>' + cards + '<h3 class="sth">Предел огнестойкости</h3>' + lim + '<h3 class="sth">Общие правила</h3>' + mini(STAIR_RULES);
}

document.addEventListener('click', function (e) {
  var b = e.target.closest && e.target.closest('[data-stair]');
  if (b) stairShow(b.dataset.stair);
});
document.addEventListener('change', function (e) { if (/^st-/.test(e.target.id)) stairPick(); });
document.addEventListener('input', function (e) { if (e.target.id === 'st-h') stairPick(); });
