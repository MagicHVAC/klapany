/* Площадь пожара по тактической модели.
   Скорость: Теребнев В.В. «Пожарно-тактические расчёты», 2017 — по статье «Алгоритм расчёта и построения формы площади пожара
   в соответствии с тактической моделью», Пожаровзрывобезопасность, 2025, т. 34, № 3, формулы (1)–(4):
   t ≤ 10 мин — vл = 0,5·vл.т; после 10 мин до подачи стволов — vл.т; стволы поданы, расхода мало — 0,5·vл.т; достаточно — 0.
   Путь огня L — интеграл скорости по времени. Форма — круг радиусом L из очага, ограниченный стенами помещения (у стены — полукруг,
   в углу — четверть); при достижении обеих продольных стен — прямоугольная форма (допущение тактической модели, рис. 1, 8 статьи).
   Глубина тушения 5 м ручными стволами, 10 м лафетными — там же. v по умолчанию — СИТИС СПН-1 табл. 2 (м/с × 60). */
var FA_SRC = 'Теребнев В.В. Пожарно-тактические расчёты. 2017 — по статье в журнале «Пожаровзрывобезопасность», 2025, т. 34, № 3';
var FA_URL = 'https://www.fire-smi.ru/jour/article/download/1499/840';
var FA = { t: 0, play: true, raf: 0, last: 0 };

function faOpts() {
  var h = '<option value="">— ввести вручную —</option>', open = false;
  (window.SPN_T2 || []).forEach(function (r, i) {
    if (r.g) { if (open) h += '</optgroup>'; h += '<optgroup label="' + esc(r.n.slice(0, 90)) + '">'; open = true; }
    else if (r.v) h += '<option value="' + i + '">' + esc(r.n) + ' — ' + r.v + ' м/с</option>';
  });
  return h + (open ? '</optgroup>' : '');
}
function fareaBlock() {
  var F = function (id, l, v, hint) { return '<div class="stf"><label for="' + id + '">' + l + '</label><input id="' + id + '" type="number" step="any" value="' + v + '" inputmode="decimal">' + (hint ? '<small class="dhint">' + hint + '</small>' : '') + '</div>'; };
  var S = function (id, l, o, v) { return '<div class="stf"><label for="' + id + '">' + l + '</label><select id="' + id + '">' + o.map(function (x) { return '<option value="' + x[0] + '"' + (x[0] === v ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select></div>'; };
  return '<p class="sub">Тактическая модель: огонь идёт кругом из очага, у стен круг обрезается, дойдя до обеих продольных стен — фронт становится прямым. Скорость — по времени свободного развития и подаче стволов.</p>' +
    '<div class="trpick stpick">' +
    '<div class="stf" style="grid-column:1/-1"><label for="fa-m">Горючая нагрузка — линейная скорость из СИТИС СПН-1, табл. 2</label><select id="fa-m">' + faOpts() + '</select></div>' +
    F('fa-v', 'vл табличная, м/мин', '1', 'из выбора или своя') +
    F('fa-a', 'Длина помещения, м', '30') + F('fa-b', 'Ширина помещения, м', '12') +
    S('fa-o', 'Где очаг', [['c', 'в центре'], ['w', 'у длинной стены, посередине'], ['e', 'у торцевой стены, посередине'], ['k', 'в углу'], ['xy', 'задам координаты']], 'c') +
    F('fa-x', 'Очаг: x от левого торца, м', '15') + F('fa-y', 'Очаг: y от нижней стены, м', '6') +
    F('fa-t', 'Время свободного развития, мин', '15', 'до момента расчёта') +
    S('fa-s', 'Пожарные стволы', [['no', 'не поданы'], ['lo', 'поданы, расхода не хватает'], ['ok', 'поданы, расхода достаточно']], 'no') +
    F('fa-ts', 'Время подачи стволов, мин', '12') +
    S('fa-dt', 'Глубина тушения', [['5', '5 м — ручные стволы'], ['10', '10 м — лафетные']], '5') +
    '</div><div class="barres stres" id="fa-res"></div>' +
    '<div class="stanim"><div class="faplay"><button type="button" class="eibtn on" id="fa-pp">Пауза</button><input id="fa-sl" type="range" min="0" max="1000" value="1000" aria-label="Время на анимации"><span id="fa-now"></span></div><div id="fa-svg"></div>' +
    '<p class="tnote">Анимация проигрывает развитие от возгорания до заданного времени. Ползунок — перемотка. Это схема, не чертёж.</p></div>' +
    '<h3 class="sth">Площадь по минутам</h3><div class="tscroll" id="fa-tab"></div>' +
    '<p class="tnote">Скачок площади в момент выхода на обе продольные стены — свойство тактической модели: круг заменяется прямоугольником на всю ширину. Авторы статьи 2025 года отмечают его отдельно.</p>' +
    '<div class="dpbtns"><button type="button" class="eibtn on" id="fa-doc">Скачать расчёт в Word</button></div>' +
    '<details class="issue dpf"><summary>Формулы и допущения</summary><div>' +
    '<p>Скорость (1)–(4): до 10 мин v<sub>л</sub> = 0,5·v<sub>л.т</sub>; после 10 мин до подачи стволов — v<sub>л.т</sub>; стволы поданы, расхода не хватает — 0,5·v<sub>л.т</sub>; хватает — 0.</p>' +
    '<p>Путь огня — сумма по участкам: при t ≤ 10 мин L = 0,5·v<sub>л.т</sub>·t; при t > 10 мин и без стволов L = 5·v<sub>л.т</sub> + v<sub>л.т</sub>·(t − 10).</p>' +
    '<p>Площадь — геометрия: круг πL², у стены полукруг 0,5πL², в углу четверть 0,25πL², в общем случае — часть круга внутри помещения. Прямоугольная форма после выхода на обе продольные стены: S = b · (L<sub>лев</sub> + L<sub>прав</sub>), где b — ширина помещения.</p>' +
    '<p>Площадь тушения — полоса глубиной h по фронту: для прямоугольной формы S<sub>т</sub> = n·b·h, n — число направлений; для круговой части — кольцо π·h·(2L − h), обрезанное стенами.</p>' +
    '<p>Допущения модели: нагрузка равномерная по всей площади, одинаковая скорость в любой точке. Значения v<sub>л.т</sub> из СПН-1 даны для расчёта риска; применимость к объекту обосновывает разработчик расчёта.</p></div></details>' +
    '<div class="refs"><a class="ref" href="' + FA_URL + '" target="_blank" rel="noopener">Статья 2025: тактическая модель</a><span class="ref">Теребнев В.В., 2017</span></div>';
}
function faN(id) { var e = $('#' + id); var s = e ? String(e.value).replace(',', '.').trim() : ''; return s === '' ? NaN : parseFloat(s); }
function faF(v, n) { if (!isFinite(v)) return '—'; var k = Math.pow(10, n === undefined ? 1 : n); return (Math.round(v * k) / k).toString().replace('.', ','); }

function faInp() {
  var r = { v: faN('fa-v'), A: faN('fa-a'), B: faN('fa-b'), o: $('#fa-o').value, t: faN('fa-t'), s: $('#fa-s').value, ts: faN('fa-ts'), h: +$('#fa-dt').value };
  if (r.o === 'c') { r.x = r.A / 2; r.y = r.B / 2; } else if (r.o === 'w') { r.x = r.A / 2; r.y = 0; } else if (r.o === 'e') { r.x = 0; r.y = r.B / 2; } else if (r.o === 'k') { r.x = 0; r.y = 0; }
  else { r.x = Math.min(Math.max(faN('fa-x'), 0), r.A); r.y = Math.min(Math.max(faN('fa-y'), 0), r.B); }
  if (r.s === 'no') r.ts = Infinity;
  return r;
}
/* путь огня к моменту tau, мин */
function faL(r, tau) {
  var L = 0, v = r.v, ts = Math.max(r.ts, 0), seg = function (a, b, k) { var lo = Math.max(a, 0), hi = Math.min(b, tau); if (hi > lo) L += k * v * (hi - lo); };
  var kAfter = r.s === 'ok' ? 0 : 0.5;
  /* до 10 мин — 0,5 при любом состоянии стволов (формула (1)); после 10 мин — 1 до подачи стволов, затем 0,5 или 0 */
  seg(0, 10, 0.5);
  if (ts > 10) { seg(10, ts, 1); seg(ts, Infinity, kAfter); } else seg(10, Infinity, kAfter);
  if (r.s === 'ok' && ts < 10) { L = 0; seg(0, ts, 0.5); }
  return L;
}
/* площадь части круга (x0,y0,R) внутри [0,A]x[0,B] — численно */
function faClip(x0, y0, R, A, B, N) {
  if (R <= 0) return 0;
  var a = Math.max(0, x0 - R), b = Math.min(A, x0 + R), n = N || 600, dx = (b - a) / n, s = 0;
  for (var i = 0; i < n; i++) { var x = a + (i + 0.5) * dx, d = R * R - (x - x0) * (x - x0); if (d <= 0) continue; var h = Math.sqrt(d); s += Math.max(0, Math.min(B, y0 + h) - Math.max(0, y0 - h)) * dx; }
  return s;
}
function faState(r, tau) {
  var L = faL(r, tau), long = r.A >= r.B, x0 = long ? r.x : r.y, y0 = long ? r.y : r.x, AA = long ? r.A : r.B, BB = long ? r.B : r.A;
  var reach = L >= y0 && L >= BB - y0, st = { L: L, rect: false };
  if (reach) {
    var l = Math.min(L, x0), rr = Math.min(L, AA - x0);
    st.rect = true; st.S = BB * (l + rr); st.l = l; st.r = rr; st.n = (x0 - L > 0 ? 1 : 0) + (x0 + L < AA ? 1 : 0);
    st.St = Math.min(st.S, st.n * BB * r.h);
    st.form = st.n === 2 ? 'прямоугольная, 2 направления' : st.n === 1 ? 'прямоугольная, 1 направление' : 'охвачено всё помещение';
  } else {
    st.S = faClip(r.x, r.y, L, r.A, r.B);
    var inner = faClip(r.x, r.y, Math.max(L - r.h, 0), r.A, r.B);
    st.St = st.S - inner;
    var free = [r.x, r.A - r.x, r.y, r.B - r.y].filter(function (d) { return d > L + 1e-9; }).length;
    st.form = free === 4 ? 'круговая' : (free === 3 ? 'полукруговая у стены' : (free === 2 && (r.x < L && r.y < L || r.A - r.x < L && r.B - r.y < L || r.x < L && r.B - r.y < L || r.A - r.x < L && r.y < L) ? 'угловая' : 'круг, обрезанный стенами'));
  }
  st.S = Math.min(st.S, r.A * r.B); st.St = Math.min(st.St, st.S);
  return st;
}
function faSpeedTxt(r) {
  var ts = r.ts, p = ['до 10 мин — 0,5·vл.т = ' + faF(0.5 * r.v, 2) + ' м/мин'];
  if (r.s === 'no') p.push('после 10 мин — vл.т = ' + faF(r.v, 2) + ' м/мин');
  else {
    if (ts > 10) p.push('с 10 до ' + faF(ts) + ' мин — vл.т = ' + faF(r.v, 2) + ' м/мин');
    p.push('после подачи стволов на ' + faF(ts) + ' мин — ' + (r.s === 'ok' ? '0, рост остановлен' : '0,5·vл.т = ' + faF(0.5 * r.v, 2) + ' м/мин'));
  }
  return p.join('; ');
}
function fareaCalc() {
  if (!$('#fa-m')) { cancelAnimationFrame(FA.raf); FA.raf = 0; return; }
  var o = $('#fa-o').value; $('#fa-x').parentNode.hidden = $('#fa-y').parentNode.hidden = o !== 'xy';
  $('#fa-ts').parentNode.hidden = $('#fa-s').value === 'no';
  var r = faInp(), err = [], mk = fcNums([['fa-v', '', 0, null, true], ['fa-a', '', 0, null, true], ['fa-b', '', 0, null, true], ['fa-t', '', 0, 600, true], ['fa-ts', '', 0], ['fa-x', '', 0, r.A], ['fa-y', '', 0, r.B]], []);
  if (r.s !== 'no' && r.ts > r.t) mk.push(['fa-ts', 'warnf', 'Позже расчётного времени — стволы ещё не поданы']);
  fcApply('fa-', mk);
  if (mk.some(function (m) { return m[1] === 'bad'; })) err.push('Исправь поля, подсвеченные красным.');
  if (!(r.v > 0)) err.push('Задай линейную скорость больше 0.');
  if (!(r.A > 0 && r.B > 0)) err.push('Задай размеры помещения.');
  if (!(r.t > 0)) err.push('Задай время развития больше 0.');
  var c = function (k, v, s, cl) { return '<div class="bstep' + (cl ? ' ' + cl : '') + '"><span>' + k + '</span><b>' + v + '</b>' + (s ? '<small>' + s + '</small>' : '') + '</div>'; };
  if (err.length) { $('#fa-res').innerHTML = err.map(function (e) { return c('Исходные данные', 'Пересмотри', e, 'warn'); }).join(''); $('#fa-tab').innerHTML = ''; FA.r = null; return; }
  var st = faState(r, r.t), full = r.A * r.B;
  var tFull = null; for (var q = 0.1; q <= 600; q += 0.1) { if (faState(r, q).S >= full - 1e-6) { tFull = q; break; } if (faL(r, q) === faL(r, q + 50) && q > Math.max(r.ts, 10)) break; }
  var tWall = null; for (var q2 = 0.1; q2 <= 600; q2 += 0.1) { if (faState(r, q2).form !== 'круговая') { tWall = q2; break; } if (q2 > Math.max(r.ts, 10) && faL(r, q2) === faL(r, q2 + 50)) break; }
  var h = c('Площадь пожара на ' + faF(r.t) + ' мин', faF(st.S) + ' м²', 'Форма: ' + st.form + '. Это ' + faF(st.S / full * 100, 0) + ' % помещения ' + faF(full, 0) + ' м².', 'final');
  h += c('Путь огня L', faF(st.L, 2) + ' м', faSpeedTxt(r) + '.');
  h += c('Площадь тушения', faF(st.St) + ' м²', 'Глубина ' + r.h + ' м по фронту горения.');
  h += c('Когда упрётся в стену', tWall ? faF(tWall) + ' мин' : 'не упрётся', 'С этого момента форма меняется.');
  h += c('Охват всего помещения', tFull ? faF(tFull) + ' мин' : 'не наступит', r.s === 'ok' ? 'Стволы остановили рост.' : '');
  $('#fa-res').innerHTML = h;
  var steps = []; for (var m = 1; m <= Math.max(Math.ceil(r.t), 1); m++) steps.push(m);
  if (steps.length > 30) steps = steps.filter(function (m) { return m % 5 === 0 || m === Math.ceil(r.t); });
  $('#fa-tab').innerHTML = '<table class="vei"><thead><tr><th>t, мин</th><th>v, м/мин</th><th>L, м</th><th>S, м²</th><th>Sт, м²</th><th>Форма</th></tr></thead><tbody>' + steps.map(function (m) {
    var s = faState(r, m), v = (faL(r, m) - faL(r, m - 0.01)) / 0.01;
    return '<tr><td>' + m + '</td><td>' + faF(v, 2) + '</td><td>' + faF(s.L, 2) + '</td><td><span class="ei">' + faF(s.S) + '</span></td><td>' + faF(s.St) + '</td><td>' + s.form + '</td></tr>';
  }).join('') + '</tbody></table>';
  FA.r = r; FA.st = st; FA.tWall = tWall; FA.tFull = tFull;
  faDraw(FA.play ? FA.t : r.t * (+$('#fa-sl').value / 1000));
  if (!FA.raf) { FA.last = 0; FA.raf = requestAnimationFrame(faTick); }
}
function faTick(ts) {
  if (!$('#fa-svg') || !FA.r) { FA.raf = 0; return; }
  if (FA.play) {
    var dt = FA.last ? (ts - FA.last) / 1000 : 0; FA.last = ts;
    var dur = 8; FA.t += dt * FA.r.t / dur; if (FA.t > FA.r.t * 1.15) FA.t = 0;
    faDraw(Math.min(FA.t, FA.r.t)); $('#fa-sl').value = Math.round(Math.min(FA.t / FA.r.t, 1) * 1000);
  } else FA.last = 0;
  FA.raf = requestAnimationFrame(faTick);
}
function faDraw(tau) {
  var r = FA.r, box = $('#fa-svg'); if (!r || !box) return;
  var W = 340, k = Math.min(W / r.A, 190 / r.B), w = r.A * k, hh = r.B * k, ox = 10 + (W - w) / 2, oy = 14;
  var st = faState(r, tau), X = function (m) { return ox + m * k; }, Y = function (m) { return oy + hh - m * k; };
  var g = '<defs><clipPath id="faclip"><rect x="' + ox + '" y="' + oy + '" width="' + w + '" height="' + hh + '"/></clipPath>' +
    '<radialGradient id="fagr"><stop offset="0" stop-color="#ffd27a"/><stop offset=".55" stop-color="#ff7a3c"/><stop offset="1" stop-color="#d93a1e" stop-opacity=".85"/></radialGradient></defs>';
  g += '<rect class="faroom" x="' + ox + '" y="' + oy + '" width="' + w + '" height="' + hh + '"/>';
  if (st.rect) {
    var long = r.A >= r.B;
    var rx = long ? X(r.x - st.l) : ox, ry = long ? oy : Y(r.y + st.r), rw = long ? (st.l + st.r) * k : w, rh = long ? hh : (st.l + st.r) * k;
    g += '<rect class="faf" x="' + rx + '" y="' + ry + '" width="' + rw + '" height="' + rh + '" fill="url(#fagr)"/>';
    if (r.h && st.n) {
      if (long) { if (r.x - st.l > 0) g += '<rect class="fat" x="' + rx + '" y="' + oy + '" width="' + Math.min(r.h * k, rw) + '" height="' + hh + '"/>'; if (r.x + st.r < r.A) g += '<rect class="fat" x="' + (rx + rw - Math.min(r.h * k, rw)) + '" y="' + oy + '" width="' + Math.min(r.h * k, rw) + '" height="' + hh + '"/>'; }
      else { if (r.y + st.r < r.B) g += '<rect class="fat" x="' + ox + '" y="' + ry + '" width="' + w + '" height="' + Math.min(r.h * k, rh) + '"/>'; if (r.y - st.l > 0) g += '<rect class="fat" x="' + ox + '" y="' + (ry + rh - Math.min(r.h * k, rh)) + '" width="' + w + '" height="' + Math.min(r.h * k, rh) + '"/>'; }
    }
  } else if (st.L > 0) {
    g += '<g clip-path="url(#faclip)"><circle class="faf" cx="' + X(r.x) + '" cy="' + Y(r.y) + '" r="' + st.L * k + '" fill="url(#fagr)"/>' +
      (st.L > r.h ? '<circle class="fatr" cx="' + X(r.x) + '" cy="' + Y(r.y) + '" r="' + (st.L - r.h / 2) * k + '" stroke-width="' + r.h * k + '"/>' : '') + '</g>';
  }
  g += '<circle class="fa0" cx="' + X(r.x) + '" cy="' + Y(r.y) + '" r="3"/>';
  g += '<text class="stt" x="' + ox + '" y="' + (oy + hh + 13) + '">' + faF(r.A) + ' × ' + faF(r.B) + ' м</text>';
  box.innerHTML = '<svg class="stsvg" viewBox="0 0 360 ' + (hh + 34) + '" role="img" aria-label="Развитие площади пожара в плане">' + g + '</svg>';
  $('#fa-now').textContent = 't = ' + faF(tau) + ' мин · L = ' + faF(st.L, 2) + ' м · S = ' + faF(st.S) + ' м² · ' + st.form;
}
function faDoc() {
  var r = FA.r, st = FA.st; if (!r) return;
  var row = function (a, b) { return '<tr><td>' + a + '</td><td>' + b + '</td></tr>'; }, m = $('#fa-m'), mat = m.value ? m.options[m.selectedIndex].text : 'задана вручную';
  var steps = []; for (var q = 1; q <= Math.ceil(r.t); q++) steps.push(q);
  var html = '<html><head><meta charset="utf-8"><style>body{font-family:"Times New Roman";font-size:12pt}table{border-collapse:collapse}td,th{border:1px solid #000;padding:3pt 6pt}</style></head><body>' +
    '<h1 style="font-size:14pt">Расчёт площади пожара по тактической модели</h1>' +
    '<p>Основание: ' + FA_SRC + ', формулы (1)–(4). Значение линейной скорости: ' + (m.value ? 'СИТИС СПН-1, табл. 2' : 'принято разработчиком') + '.</p>' +
    '<table>' + row('Горючая нагрузка', esc(mat)) + row('Линейная скорость табличная vл.т, м/мин', faF(r.v, 3)) + row('Размеры помещения, м', faF(r.A) + ' × ' + faF(r.B)) +
    row('Очаг (x; y), м', faF(r.x) + '; ' + faF(r.y)) + row('Время свободного развития, мин', faF(r.t)) + row('Пожарные стволы', { no: 'не поданы', lo: 'поданы на ' + faF(r.ts) + ' мин, расхода недостаточно', ok: 'поданы на ' + faF(r.ts) + ' мин, расхода достаточно' }[r.s]) +
    row('Глубина тушения, м', r.h) + '</table>' +
    '<p>Скорость по участкам: ' + faSpeedTxt(r) + '.</p>' +
    '<p>Путь, пройденный огнём: L = ' + faF(st.L, 2) + ' м.</p>' +
    '<p>Форма площади пожара: ' + st.form + '. ' + (st.rect ? 'S = b · (Lлев + Lправ) = ' + faF(Math.min(r.A, r.B)) + ' · (' + faF(st.l, 2) + ' + ' + faF(st.r, 2) + ')' : 'S — площадь круга радиусом L в пределах помещения') + ' = <b>' + faF(st.S) + ' м²</b>.</p>' +
    '<p>Площадь тушения при глубине ' + r.h + ' м: ' + faF(st.St) + ' м².</p>' +
    '<table><tr><th>t, мин</th><th>L, м</th><th>S, м²</th><th>Форма</th></tr>' + steps.map(function (q) { var s = faState(r, q); return '<tr><td>' + q + '</td><td>' + faF(s.L, 2) + '</td><td>' + faF(s.S) + '</td><td>' + s.form + '</td></tr>'; }).join('') + '</table>' +
    '<p style="font-size:10pt;color:#555">Сформировано: «Справочник инженера ОВиК» v' + APP.ver + ', ' + new Date().toLocaleDateString('ru-RU') + '. Допущения модели: нагрузка равномерная, скорость одинаковая во всех точках. Решение принимает разработчик расчёта.</p></body></html>';
  var blob = new Blob(['﻿', html], { type: 'application/msword' }), a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'Расчёт_площади_пожара.doc'; document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
document.addEventListener('change', function (e) {
  if (e.target.id === 'fa-m' && e.target.value !== '') { var row = SPN_T2[+e.target.value]; $('#fa-v').value = (Math.round(parseFloat(String(row.v).replace(',', '.')) * 60 * 1000) / 1000); }
  if (/^fa-/.test(e.target.id) && e.target.id !== 'fa-sl') { FA.t = 0; fareaCalc(); }
});
document.addEventListener('input', function (e) {
  if (e.target.id === 'fa-sl') { FA.play = false; $('#fa-pp').textContent = 'Играть'; if (FA.r) faDraw(FA.r.t * (+e.target.value / 1000)); return; }
  if (/^fa-/.test(e.target.id) && e.target.tagName === 'INPUT') { FA.t = 0; fareaCalc(); }
});
document.addEventListener('click', function (e) {
  if (e.target.id === 'fa-pp') { FA.play = !FA.play; e.target.textContent = FA.play ? 'Пауза' : 'Играть'; if (FA.play && FA.r) FA.t = FA.r.t * (+$('#fa-sl').value / 1000) % (FA.r.t * 1.15); }
  if (e.target.id === 'fa-doc') faDoc();
});
