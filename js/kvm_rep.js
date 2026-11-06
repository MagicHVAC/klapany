/* Отчёт расчёта ПДВ (kvm_ui.js): аккуратная вёрстка на экране и в Word.
   Шапка, нумерованные разделы, исходные данные таблицей, формулы с подстановкой и результатом, таблицы по участкам и этажам, сводка.
   Шрифт отчёта — чертёжный «GOST type B» (ГОСТ 2.304), если установлен; иначе ISOCPEUR, затем Arial. */
var REP_FONT = "'GOST type B', 'GOST Type BU', 'ISOCPEUR', 'Arial Narrow', Arial, sans-serif";
/* в чертёжном шрифте нет знаков ², ³, ⁻¹ — заменяем верхним индексом */
function repSup(h) { return h.replace(/×/g, '<span class="rep-x">×</span>').replace(/⁻¹/g, '<sup>−1</sup>').replace(/²/g, '<sup>2</sup>').replace(/³/g, '<sup>3</sup>'); }
var rf = function (v, n) { return dpuFmt(v, n === undefined ? 2 : n); };

function repHead(title, p, method) {
  return '<div class="rep-top"><div class="rep-title">' + title + '</div><table class="rep-hd"><tr><td>Объект</td><td>' + esc(p.name || '—') + '</td></tr>' +
    '<tr><td>Система</td><td>' + esc(p.system || '—') + '</td></tr><tr><td>Методика</td><td>' + method + '</td></tr>' +
    '<tr><td>Дата</td><td>' + new Date().toLocaleDateString('ru-RU') + ' · «Справочник инженера ОВиК» v' + APP.ver + '</td></tr></table></div>';
}
function repSec(n, t) { return '<h3 class="rep-h">' + n + '. ' + t + '</h3>'; }
function repIn(rows) {
  return '<table class="rep-t rep-in"><colgroup><col style="width:40%"><col style="width:12%"><col><col style="width:9%"></colgroup><thead><tr><th>Параметр</th><th>Обозн.</th><th>Значение</th><th>Ед.</th></tr></thead><tbody>' +
    rows.map(function (r) { return '<tr><td>' + r[0] + '</td><td class="c">' + (r[1] || '') + '</td><td>' + r[2] + '</td><td class="c">' + (r[3] || '') + '</td></tr>'; }).join('') + '</tbody></table>';
}
/* формула: название, запись, подстановка, результат */
function repF(name, f, sub, res) {
  return '<div class="rep-f"><div class="rep-fn">' + name + '</div><div class="rep-fx">' + f + (sub ? ' = ' + sub : '') + (res ? ' = <b>' + res + '</b>' : '') + '</div></div>';
}
function repT(head, rows, cls) {
  return '<div class="rep-scroll"><table class="rep-t ' + (cls || '') + '"><thead><tr>' + head.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr></thead><tbody>' +
    rows.map(function (r) { return '<tr>' + r.map(function (x, i) { return '<td' + (i ? ' class="n"' : '') + '>' + x + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
}
function repSum(items) {
  return '<div class="rep-sum">' + items.map(function (x) { return '<div><span>' + x[0] + '</span><b>' + x[1] + '</b>' + (x[2] ? '<small>' + x[2] + '</small>' : '') + '</div>'; }).join('') + '</div>';
}
function repNote(o) { return (o.warn && o.warn.length) ? '<div class="rep-note"><b>Замечания</b><ul>' + o.warn.map(function (w) { return '<li>' + w + '</li>'; }).join('') + '</ul></div>' : ''; }
var REP_M = 'МР ВНИИПО к СП 7.13130.2013 (2013), СП 7.13130.2013 с Изм. № 1–3; порядок расчёта — как в «КВМ-Дым» 5.2';

/* ---------- вытяжная ---------- */
function repSmk(p, o) {
  var cor = p.variant === 0, n = 0, h = repHead('Расчёт системы вытяжной противодымной вентиляции', p, REP_M);
  h += repSum([['Подача вентилятора', rf(o.Lv, 0) + ' м³/ч', 'при ' + rf(o.tFan, 0) + ' °C'], ['Давление вентилятора', rf(o.Psv, 0) + ' Па', 'статическое'], ['Удалять дыма', rf(o.G, 2) + ' кг/с', rf(o.L, 0) + ' м³/ч'],
    ['Дымоприёмных устройств', 'не менее ' + o.Nmin, 'шаг ≥ ' + rf(o.Lmin, 2) + ' м'], ['Компенсация', rf(o.LaMin, 0) + '…' + rf(o.LaMax, 0) + ' м³/ч', 'при ' + rf(p.tComp, 0) + ' °C']]);
  h += repSec(++n, 'Исходные данные');
  var rows = [['Вариант', '', cor ? 'коридор, холл, смежные с горящим помещением' : 'зал (атриум) — из горящего помещения', ''], ['Здание', '', p.living ? 'жилое' : 'общественное', ''],
    ['Горящее помещение a × b × h', '', rf(p.L, 2) + ' × ' + rf(p.W, 2) + ' × ' + rf(p.H, 2), 'м'], ['Температура в помещении', 'tr', rf(p.tr, 0), '°C'], ['Высота незадымляемой зоны', 'Hнз', rf(p.hNz, 2), 'м']];
  if (cor) rows = rows.concat([['Проёмы горящего помещения', 'Bi × Hi', p.doors.map(function (d) { return rf(d[0], 2) + ' × ' + rf(d[1], 2); }).join('; '), 'м'], ['Удельная пожарная нагрузка', 'qп', rf(p.qp, 0), 'МДж/м²'],
    ['Теплота сгорания', 'Qн', rf(p.Q, 1), 'МДж/кг'], ['Длина коридора', 'lc', rf(p.cL, 2), 'м'], ['Площадь коридора', 'Ac', rf(p.cA, 1), 'м²'], ['Высота коридора', 'hк', rf(p.cH, 2), 'м'], ['Дверь выхода', 'Ad × Hd', rf(p.dA, 2) + ' м² × ' + rf(p.dH, 2), 'м']]);
  else rows = rows.concat([['Площадь пола', 'Ff', rf(p.Ff, 1), 'м²'], ['Площадь очага', 'Fo', rf(p.Fo, 1), 'м²'], ['Теплота сгорания', 'Qн', rf(p.Q, 1), 'МДж/кг'], ['Скорость выгорания', 'ψ', rf(p.psi, 4), 'кг/(м²·с)'],
    ['Полнота сгорания', 'η', rf(p.eta, 2), ''], ['Коэффициент теплопотерь на излучение', 'r', rf(p.r, 2), '']]);
  rows = rows.concat([['Наружный воздух: лето / зима', 'tн', rf(p.tOut, 0) + ' / ' + rf(p.tComp, 0), '°C'], ['Участков сети', '', p.segs.length, ''], ['Закрытый клапан: сопротивление газопроницанию', 'Sкл', rf(p.Skl, 0), 'м³/кг'],
    ['Выброс', '', p.endExhaust ? 'на фасад, ' + rf(p.vOut, 0) + ' м/с' : 'на кровлю', ''], ['ДПУ a × b, низ от пола', '', rf(p.dpuW, 0) + ' × ' + rf(p.dpuB, 0) + ' мм, ' + rf(p.dpuH, 2) + ' м', '']]);
  h += repIn(rows);
  h += repSec(++n, 'Расход продуктов горения');
  if (cor) {
    h += repF('Объём и площадь ограждений', 'V = a·b·h; F<sub>w</sub> = 6·V<sup>2/3</sup>', 'V = ' + rf(o.V, 2) + ' м³; 6 · ' + rf(o.V, 2) + '<sup>2/3</sup>', rf(o.Fw, 2) + ' м²') +
      repF('Проёмность', 'П = Σ(A<sub>i</sub>·H<sub>i</sub><sup>1/2</sup>) / V<sup>2/3</sup>', 'A<sub>0</sub> = ' + rf(o.A0, 2) + ' м²', rf(o.Pi, 4) + ' м<sup>1/2</sup>') +
      repF('Воздух на сгорание', 'V<sub>0</sub> = 0,263·Q<sub>н</sub>', '0,263 · ' + rf(p.Q, 1), rf(o.V0, 2) + ' м³/кг') +
      repF('Нагрузка, приведённая к полу', 'g<sub>0</sub> = q<sub>п</sub> / Q<sub>нд</sub>', rf(p.qp, 0) + ' / 13,8', rf(o.g0, 2) + ' кг/м²') +
      repF('Нагрузка, приведённая к ограждениям', 'g<sub>k</sub> = F<sub>f</sub>·q<sub>п</sub> / ((F<sub>w</sub> − A<sub>0</sub>)·Q<sub>нд</sub>)', rf(o.Ff, 2) + ' · ' + rf(p.qp, 0) + ' / ((' + rf(o.Fw, 2) + ' − ' + rf(o.A0, 2) + ') · 13,8)', rf(o.gk, 2) + ' кг/м²') +
      repF('Критическая нагрузка', 'g<sub>kкр</sub> = 4500·П³/(1 + 500·П³) + V<sup>1/3</sup>/(6·V<sub>0</sub>)', '', rf(o.gkr, 2) + ' кг/м² → ' + (o.prv ? 'пожар, регулируемый вентиляцией' : 'пожар, регулируемый нагрузкой')) +
      repF('Максимальная среднеобъёмная температура (' + (o.prv ? '13' : '14') + ')', o.prv ? 'T<sub>0max</sub> = T<sub>r</sub> + 940·exp(0,0047·g<sub>0</sub> − 0,141)' : 'T<sub>0max</sub> = T<sub>r</sub> + 224·g<sub>k</sub><sup>0,528</sup>', '', rf(o.T0max, 0) + ' K') +
      repF('Газы из горящего помещения (15)', 'T<sub>0</sub> = 0,8·T<sub>0max</sub>', '', rf(o.T0, 0) + ' K') +
      repF('Средняя температура слоя в коридоре (16)', 'T<sub>sm</sub> = T<sub>r</sub> + 1,22·(T<sub>0</sub> − T<sub>r</sub>)·(2h<sub>sm</sub> + A<sub>c</sub>/l<sub>c</sub>)/l<sub>c</sub>·[1 − exp(−0,58·l<sub>c</sub>/(2h<sub>sm</sub> + A<sub>c</sub>/l<sub>c</sub>))]', 'h<sub>sm</sub> = ' + rf(o.hsm, 2) + ' м', rf(o.Tsm, 1) + ' K') +
      repF('Массовый расход (17)', 'G<sub>ПГ</sub> = k<sub>sm</sub>·A<sub>d</sub>·H<sub>d</sub><sup>1/2</sup>', rf(o.ksm, 1) + ' · ' + rf(p.dA, 2) + ' · ' + rf(p.dH, 2) + '<sup>1/2</sup>', rf(o.G, 3) + ' кг/с');
  } else {
    h += repF('Мощность очага (3)', 'Q<sub>f</sub> = η·Q<sub>н</sub>·1000·ψ·F<sub>o</sub>', rf(p.eta, 2) + ' · ' + rf(p.Q, 1) + ' · 1000 · ' + rf(p.psi, 4) + ' · ' + rf(p.Fo, 1), rf(o.Qf, 0) + ' кВт') +
      repF('Безопасное расстояние', 'R = [Q<sub>f</sub>/(4π·q<sub>r</sub>)]<sup>0,5</sup>, q<sub>r</sub> = 10 кВт/м²', '', rf(o.Rsafe, 2) + ' м') +
      repF('Высота пламени', 'Z = 0,166·(r·Q<sub>f</sub>)<sup>2/5</sup>', '', rf(o.Zf, 2) + ' м ' + (o.f === 8 ? '> ' : '< ') + 'H<sub>нз</sub> = ' + rf(p.hNz, 2) + ' м') +
      repF('Конвективная колонка (' + o.f + ')', o.f === 8 ? 'G<sub>k</sub> = 0,032·(r·Q<sub>f</sub>)<sup>3/5</sup>·(h − H<sub>sm</sub>)' : 'G<sub>k</sub> = 0,071·(r·Q<sub>f</sub>)<sup>1/3</sup>·z<sup>5/3</sup> + 0,0018·r·Q<sub>f</sub>', '', rf(o.Gk, 3) + ' кг/с') +
      repF('Температура колонки и слоя (4)', 'T<sub>k</sub> = T<sub>r</sub> + r·Q<sub>f</sub>/(c<sub>pk</sub>·G<sub>k</sub>); α = 0,01163·exp(0,0023·(T<sub>sm</sub> − 273))', 'T<sub>k</sub> = ' + rf(o.Tk, 0) + ' K; α = ' + rf(o.alpha, 4), 'T<sub>sm</sub> = ' + rf(o.Tsm, 1) + ' K') +
      repF('Массовый расход (12)', 'G<sub>ПГ</sub> = G<sub>k</sub>', '', rf(o.G, 3) + ' кг/с');
  }
  h += repF('Объёмный расход', 'L<sub>ПГ</sub> = G<sub>ПГ</sub>/ρ<sub>ПГ</sub>·3600, ρ<sub>ПГ</sub> = 353/T<sub>sm</sub>', rf(o.G, 3) + ' / ' + rf(353 / o.Tsm, 3) + ' · 3600', rf(o.L, 0) + ' м³/ч');
  h += repSec(++n, 'Сеть вытяжной противодымной вентиляции');
  h += repF('Открытый клапан на этаже пожара', 'ΔP<sub>кл</sub> = ½·(ζ<sub>кл</sub> + ζ′)·V<sub>кл</sub>²·ρ<sub>ПГ</sub>, F<sub>кл</sub> = (a − 50)·(b − 50)', 'F<sub>кл</sub> = ' + rf(o.Fkl, 4) + ' м²; V<sub>кл</sub> = ' + rf(o.vkl, 2) + ' м/с; ½ · (' + rf(o.zkl, 2) + ' + ' + rf(p.segs[0].nodeZ, 2) + ') · ' + rf(o.vkl, 2) + '² · ' + rf(353 / o.Tsm, 3), rf(o.dPkl, 2) + ' Па') +
    '<p class="rep-p">Подсосы: через стенки — (ρ<sub>в</sub>/3600)·S·0,032·ΔP<sup>0,65</sup> (МР прил. 3 п. 1), через закрытые клапаны — F<sub>кл</sub>·(|P<sub>Ш</sub>|/S<sub>кл</sub>)<sup>1/2</sup>; смешение — по массе; λ — по Кольбруку.</p>';
  h += repT(['Участок', 'P<sub>Ш</sub>, Па', 'Подсос клапана, кг/с', 'Подсос стенок, кг/с', 'G<sub>Ш</sub>, кг/с', 'T, K', 'ρ, кг/м³', 'v, м/с', 'λ', 'ΔP<sub>Ш</sub>, Па'], o.rows.map(function (r) {
    return [r.i + (r.open ? ' (пожар)' : r.last ? ' (верх)' : ''), rf(r.P, 2), rf(r.gKl, 5), rf(r.gH + r.gV, 5), rf(r.G, 4), rf(r.T, 1), rf(r.ro, 3), rf(r.ver.v, 2), rf(r.ver.lam, 4), rf(r.ver.dp, 2)];
  }), 'rep-net');
  h += repSec(++n, 'Вентилятор');
  h += repF('Подача', 'L<sub>v</sub> = G<sub>Ш</sub>/ρ<sub>N</sub>·3600', rf(o.GN, 4) + ' / ' + rf(o.roN, 4) + ' · 3600', rf(o.Lv, 0) + ' м³/ч') +
    repF('Статическое давление', p.endExhaust ? 'P<sub>sv</sub> = |P<sub>ШN</sub>| + ΔP<sub>Ш</sub> + P<sub>d</sub> + 0,5·ρ<sub>N</sub>·v<sub>f</sub>²' : 'P<sub>sv</sub> = |P<sub>ШN</sub>| + ΔP<sub>Ш</sub>', rf(Math.abs(o.PN), 2) + ' + ' + rf(o.PshN - Math.abs(o.PN), 2) + (p.endExhaust ? ' + ' + rf(p.ductRes, 0) + ' + ' + rf(o.Pvf, 2) : ''), rf(o.Psv, 2) + ' Па') +
    repF('Температура перед вентилятором', 't = T<sub>N</sub> − 273', '', rf(o.tFan, 0) + ' °C');
  h += repSec(++n, 'Дымоприёмные устройства (СП 7.13130, прил. Е)');
  h += repF('Наибольший расход через 1 ДПУ (Е.1)', 'V<sub>1max</sub> = 4,16·γ·d<sup>5/2</sup>·[(T<sub>sm</sub> − T<sub>r</sub>)/T<sub>r</sub>]<sup>1/2</sup>', 'D<sub>э</sub> = ' + rf(o.dpuD, 3) + ' м; γ = ' + rf(o.gamma, 1) + '; d = ' + rf(o.d, 2) + ' м', rf(o.V1, 2) + ' м³/с') +
    repF('Наименьшее число ДПУ', 'N<sub>min</sub> = G<sub>ПГ</sub>/(ρ<sub>ПГ</sub>·V<sub>1max</sub>)', '', String(o.Nmin)) +
    repF('Наименьшее расстояние между ДПУ (Е.2)', 'L<sub>min</sub> = 0,9·V<sub>1max</sub><sup>1/2</sup>', '', rf(o.Lmin, 3) + ' м');
  h += repSec(++n, 'Компенсирующая подача воздуха');
  h += repF('Массовый расход', 'G<sub>a</sub> = G<sub>Ш</sub>/(1,3 … 1,0)', '', rf(o.GaMin, 2) + ' … ' + rf(o.GaMax, 2) + ' кг/с') +
    repF('Объёмный расход при ' + rf(p.tComp, 0) + ' °C', 'L<sub>a</sub> = 3600·G<sub>a</sub>/ρ<sub>a</sub>', '', rf(o.LaMin, 0) + ' … ' + rf(o.LaMax, 0) + ' м³/ч');
  return repSup('<div class="rep">' + h + repNote(o) + '</div>');
}

/* ---------- подпор: лестница ---------- */
function repAirRows(a) { return [['Наружный воздух (зима)', 'ta', rf(a.ta, 0), '°C'], ['Воздух в здании', 'tr', rf(a.tr, 0), '°C'], ['Скорость ветра', 'va', rf(a.va, 1), 'м/с'], ['Коэфф. ветрового напора', 'Kww / Kw0', rf(a.kww, 1) + ' / ' + rf(a.kw0, 1), '']]; }
function repDuct(d, o) { return (d.rect ? rf(d.a, 0) + ' × ' + rf(d.b, 0) + ' мм' : '⌀ ' + rf(d.a, 0) + ' мм') + ', l = ' + rf(d.len, 1) + ' м, Σξ = ' + rf(d.xi, 1); }
function repStair(p, o) {
  var n = 0, h = repHead('Расчёт подпора воздуха в лестничную клетку', p, REP_M);
  h += repSum([['Подача вентилятора', rf(o.Lv, 0) + ' м³/ч', 'наружный воздух ' + rf(p.air.ta, 0) + ' °C'], ['Давление вентилятора', rf(o.Psv, 0) + ' Па', 'статическое'], ['Перепад на дверях', 'до ' + rf(o.dpmax, 0) + ' Па', o.dpmax > 150 ? 'больше 150 — рассечка' : 'не больше 150 Па'], ['Расход в клетке', rf(o.Gs, 2) + ' кг/с', 'вверху']]);
  h += repSec(++n, 'Исходные данные');
  h += repIn([['Условия', '', [p.windows ? 'окна на каждом этаже' : 'без окон', p.outerExit ? 'обособленный наружный выход' : 'без наружного выхода', p.noFloor1 ? 'с 1-м этажом не сообщается' : 'с 1-м этажом — одинарная дверь', p.floorTamb ? 'поэтажно — через тамбур-шлюзы' : 'поэтажно — одинарные двери'].join('; '), ''],
    ['Этажей; высота 1-го / вышележащих', 'N', p.N + '; ' + rf(p.h1, 2) + ' / ' + rf(p.hf, 2), 'м']].concat(repAirRows(p.air)).concat([['Удаляется дыма с этажа пожара', 'Gsm', rf(p.Gsm, 2), 'кг/с'], ['Проекция маршей и площадок; КМС маршей', 'Fs; ξs', rf(p.Fs, 1) + '; ' + rf(p.xis, 0), 'м²'],
    ['Наружный выход: дверь, высота, дверей, ξd, ξr', '', rf(p.Fda, 2) + ' м², ' + rf(p.hda, 2) + ' м, ' + p.nd + ', ' + rf(p.xid, 2) + ', ' + rf(p.xir, 2), ''], ['Двери на этажах: площадь, высота', 'Fd, hd', rf(p.Fd, 2) + ' м², ' + rf(p.hd, 2) + ' м', ''],
    ['Окно на этаже; воздухопроницаемость', 'Fw', rf(p.Fw, 2) + ' м²; ' + rf(p.winVal, 2), ''], ['Избыточное давление', 'P+', rf(p.Pplus, 0), 'Па'], ['Воздуховод до оголовка', '', repDuct(p.duct), ''], ['Воздухозабор ниже оголовка на', 'h0s', rf(p.h0, 1), 'м']]));
  h += repSec(++n, 'Расчёт');
  h += repF('Плотности', 'ρ = 353/T; t<sub>s</sub> = (t<sub>a</sub> + t<sub>r</sub>)/2', 'ρ<sub>a</sub> = ' + rf(o.roa, 3) + '; ρ<sub>r</sub> = ' + rf(o.ror, 3) + '; ρ<sub>s</sub> = ' + rf(o.ros, 3), 'кг/м³') +
    repF('Ветровое давление', 'P<sub>w</sub> = 0,25·(K<sub>ww</sub> − K<sub>w0</sub>)·ρ<sub>a</sub>·v<sub>a</sub>²', '', rf(o.Pw, 2) + ' Па') +
    repF(p.noFloor1 ? 'Давление у двери 2-го этажа (23)' : 'Давление у двери 1-го этажа (33)', p.noFloor1 ? 'P<sub>s</sub> = P<sup>+</sup> + P<sub>w</sub> − g·(h<sub>2</sub> + 0,5h<sub>d</sub>)·(ρ<sub>s</sub> − ρ<sub>r</sub>)' : 'P<sub>s</sub> = P<sup>+</sup> + P<sub>w</sub> − 0,5·g·h<sub>d</sub>·(ρ<sub>s</sub> − ρ<sub>r</sub>)', '', rf(o.P1, 2) + ' Па') +
    repF('Расход через наружный выход ' + (p.noFloor1 ? '(24)' : '(34)'), 'G<sub>sa</sub> = {2ρ<sub>s</sub>·[…] / [(nξ<sub>d</sub> + ξ<sub>r</sub> + 1)/F<sub>da</sub>²' + (p.noFloor1 ? ' + ξ<sub>s</sub>/F<sub>s</sub>²' : '') + ']}<sup>1/2</sup>', '', rf(o.Gsa, 3) + ' кг/с') +
    repF('Расход в открытой двери этажа пожара (25)', 'G<sub>s(F)</sub> = G<sub>sm</sub>/q, q = max(p − 1; 1)', rf(p.Gsm, 2) + ' / ' + o.q, rf(o.GsF, 3) + ' кг/с → принято ' + rf(o.Gs0, 3) + ' кг/с') +
    repF('Сопротивление закрытых дверей', 'S<sub>d</sub> = ' + (p.gasProof ? '60000' : '5300') + '/ρ<sub>s</sub>', '', rf(o.Sd, 1) + ' м³/кг');
  h += repT(['Этаж', 'h, м', 'P<sub>s</sub>, Па', 'ΔP<sub>d</sub>, Па', 'v<sub>s</sub>, м/с', 'ΔP<sub>s</sub>, Па', 'ΔG<sub>sd</sub>, кг/с', 'ΔG<sub>sw</sub>, кг/с', 'G<sub>w</sub>, кг/(ч·м²)', 'G<sub>s</sub>, кг/с'], o.rows.slice().reverse().map(function (r) {
    return [r.i, rf(r.h, 2), rf(r.P, 2), rf(r.dPd, 2), rf(r.v, 3), rf(r.dPs, 2), rf(r.dG, 4), rf(r.dGw || 0, 4), rf(r.Gw || 0, 2), rf(r.G, 3)];
  }));
  h += repSec(++n, 'Вентилятор (93), (94)');
  h += repF('Воздуховоды до оголовка', 'P<sub>вв</sub> = λ·l/D<sub>э</sub>·P<sub>d</sub> + Σξ·P<sub>d</sub>', 'v = ' + rf(o.duct.v, 2) + ' м/с; P<sub>d</sub> = ' + rf(o.duct.Pd, 2) + ' Па; λ = ' + rf(o.duct.f, 4), rf(o.duct.P, 2) + ' Па') +
    repF('Подача', 'L<sub>v</sub> = 3600·G<sub>s</sub>/ρ<sub>a</sub>', '3600 · ' + rf(o.Gs, 3) + ' / ' + rf(o.roa, 3), rf(o.Lv, 0) + ' м³/ч') +
    repF('Статическое давление', 'P<sub>sv</sub> = P<sub>s</sub> + g·h<sub>sN</sub>·(ρ<sub>a</sub> − ρ<sub>s</sub>) + g·h<sub>0s</sub>·(ρ<sub>a</sub> − ρ<sub>r</sub>) + P<sub>вв</sub>', rf(o.Ps, 2) + ' + 9,81 · ' + rf(o.hsN, 2) + ' · ' + rf(o.roa - o.ros, 3) + ' + 9,81 · ' + rf(p.h0, 1) + ' · ' + rf(o.roa - o.ror, 3) + ' + ' + rf(o.duct.P, 2), rf(o.Psv, 0) + ' Па');
  return repSup('<div class="rep">' + h + repNote(o) + '</div>');
}

/* ---------- подпор: лифтовая шахта ---------- */
function repLift(p, o) {
  var n = 0, h = repHead('Расчёт подпора воздуха в лифтовую шахту', p, REP_M);
  h += repSum([['Подача вентилятора', rf(o.Lv, 0) + ' м³/ч', 'наружный воздух ' + rf(p.air.ta, 0) + ' °C'], ['Давление вентилятора', rf(o.Psv, 0) + ' Па', p.method !== 1 ? 'по (96) МР — ' + rf(o.PsvMR, 0) + ' Па' : 'статическое'], ['Расход на 1-м этаже', rf(o.G1, 2) + ' кг/с', 'двери открыты'], ['Утечки по этажам', rf(o.leak, 2) + ' кг/с', '']]);
  h += repSec(++n, 'Исходные данные');
  h += repIn([['Условия', '', [p.outer ? 'у наружной стены' : 'центральное ядро', p.hall1 ? 'холл на 1-м этаже' : 'без холла на 1-м', p.hallUp ? 'холлы на этажах' : 'без холлов', p.method === 1 ? 'приток только сверху' : 'по расходу в открытом проёме по МР'].join('; '), ''],
    ['Этажей надземных / подземных', 'N', p.N + ' / ' + p.NUG, ''], ['Отметка 2-го этажа; высота этажей', '', rf(p.h2, 2) + '; ' + rf(p.hf, 2), 'м']].concat(repAirRows(p.air)).concat([
    ['Двери шахты: площадь, высота, кабин', 'Fdl, hdl, n', rf(p.Fdl, 2) + ' м², ' + rf(p.hdl, 2) + ' м, ' + p.nc, ''], ['Двери холла: площадь, количество, ξd', 'Fdr, m', rf(p.Fdr, 2) + ' м², ' + p.m + ', ' + rf(p.xid, 2), ''],
    ['Сечения кабины / шахты', 'Fk / Fls', rf(p.Fk, 2) + ' / ' + rf(p.Fls, 2), 'м²'], ['Избыточное давление', 'P+', rf(p.Pplus, 0), 'Па'], ['Воздуховод', '', repDuct(p.duct), ''], ['Воздухозабор ниже оголовка на', 'h0l', rf(p.h0, 1), 'м']]));
  h += repSec(++n, 'Расчёт');
  h += repF('Плотности', 'ρ = 353/T; t<sub>l</sub> = (t<sub>a</sub> + t<sub>r</sub>)/2', 'ρ<sub>a</sub> = ' + rf(o.roa, 3) + '; ρ<sub>r</sub> = ' + rf(o.ror, 3) + '; ρ<sub>l</sub> = ' + rf(o.rol, 3), 'кг/м³') +
    repF('Сопротивления закрытых дверей (46)', 'S<sub>lr</sub> = S<sub>dl</sub>/(n·F<sub>dl</sub>)² + S<sub>dr</sub>/(m·F<sub>dr</sub>)²', 'S<sub>dl</sub> = ' + rf(o.Sdl, 1) + '; S<sub>dr</sub> = ' + rf(o.Sdr, 1), rf(o.Slr, 2) + ' кг⁻¹·м⁻¹') +
    repF('КМС узла «кабина–шахта» (45)', 'ξ<sub>l</sub> = 4,3 + F<sub>k</sub>/F<sub>ls</sub>', '', rf(o.xil, 2)) +
    repF('Давление и расход на 1-м этаже', 'G<sub>(1)</sub> = {2ρ<sub>l</sub>·P<sub>l(1)</sub> / [ξ<sub>l</sub>/(nF<sub>dl</sub>)²' + (p.hall1 ? ' + (ξ<sub>d</sub> + 1)/(mF<sub>dr</sub>)²' : '') + ']}<sup>1/2</sup>', 'P<sub>l(1)</sub> = ' + rf(o.P1, 2) + ' Па', rf(o.G1, 3) + ' кг/с') +
    (o.dPcs ? repF('Потери в зазоре кабина–шахта', 'ΔP<sub>cs</sub> = 0,5·ρ<sub>l</sub>·v<sub>cs</sub>²', 'v<sub>cs</sub> = ' + rf(o.vcs, 2) + ' м/с', rf(o.dPcs, 2) + ' Па; P<sub>l</sub> = ' + rf(o.Pl, 2) + ' Па') : repF('Давление в шахте', 'P<sub>l</sub> = P<sub>w</sub> + P<sup>+</sup> − g·(h<sub>2</sub> + 0,5h<sub>dl</sub>)·(ρ<sub>l</sub> − ρ<sub>r</sub>)', '', rf(o.Pl, 2) + ' Па'));
  h += repT(['Этаж', 'h<sub>э</sub>, м', 'ΔP<sub>d</sub>, Па', 'ΔG, кг/с'], o.rows.slice().reverse().map(function (r) { return [r.i + (r.i === 1 ? ' (двери открыты)' : ''), rf(r.h, 2), isFinite(r.dPd) ? rf(r.dPd, 2) : '—', r.i === 1 ? rf(o.G1, 3) : rf(r.dG, 4)]; }));
  h += repSec(++n, 'Вентилятор (95), (96)');
  h += repF('Воздуховоды', 'P<sub>dl</sub> = (λ·l/D<sub>э</sub> + Σξ)·0,5·ρ<sub>a</sub>·v²', 'v = ' + rf(o.duct.v, 2) + ' м/с; λ = ' + rf(o.duct.f, 4), rf(o.duct.P, 2) + ' Па') +
    repF('Подача', 'L<sub>v</sub> = 3600·G<sub>l</sub>/ρ<sub>a</sub>', '3600 · ' + rf(o.Gl, 3) + ' / ' + rf(o.roa, 3), rf(o.Lv, 0) + ' м³/ч') +
    repF('Статическое давление', p.method === 1 ? 'P<sub>sv</sub> = P<sub>l</sub> + g·h<sub>lN</sub>·(ρ<sub>a</sub> − ρ<sub>l</sub>) + g·h<sub>0l</sub>·(ρ<sub>a</sub> − ρ<sub>r</sub>) + P<sub>dl</sub>' : 'P<sub>sv</sub> = P<sub>l</sub> + g·h<sub>0l</sub>·(ρ<sub>a</sub> − ρ<sub>r</sub>) + P<sub>dl</sub> (как в «КВМ-Дым»)', '', rf(o.Psv, 0) + ' Па');
  return repSup('<div class="rep">' + h + repNote(o) + '</div>');
}

/* ---------- Word: лист A4, чертёжный шрифт ---------- */
var REP_CSS = '@page Section1{size:21cm 29.7cm;margin:2cm 1cm 2cm 2cm}div.Section1{page:Section1}' +
  'body{font-family:' + REP_FONT + ';font-size:12pt;color:#000}' +
  '.rep-title{font-size:16pt;font-weight:bold;text-align:center;margin:0 0 8pt}' +
  'table{border-collapse:collapse;width:100%}td,th{border:0.5pt solid #000;padding:2pt 4pt;font-size:10.5pt;vertical-align:top}th{background:#eee;font-weight:bold}' +
  '.rep-hd td:first-child{width:22%;font-weight:bold}.rep-h{font-size:13pt;margin:14pt 0 6pt}.n{text-align:right}.c{text-align:center}' +
  '.rep-sum{margin:8pt 0}.rep-sum div{border:0.5pt solid #000;padding:3pt 6pt;margin:0 0 3pt}.rep-sum span{display:block;font-size:9.5pt}.rep-sum b{font-size:13pt}.rep-sum small{font-size:9.5pt;margin-left:6pt}' +
  '.rep-x{font-family:Arial}.rep-f{margin:4pt 0}.rep-fn{font-size:10.5pt;color:#333}.rep-fx{font-size:12pt;margin-left:12pt}.rep-p{font-size:10.5pt}.rep-note{border:0.5pt solid #000;padding:4pt 8pt;margin-top:10pt;font-size:10.5pt}';
function repDoc(html, file) {
  var doc = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>Расчёт ПДВ</title><style>' + REP_CSS + '</style></head><body><div class="Section1">' +
    html.replace(/<div class="rep-scroll">|<\/div><!--s-->/g, '') + '<p style="font-size:9pt;color:#555;margin-top:14pt">Решение принимает ГИП. Порядок расчёта сверен с отчётами «КВМ-Дым» 5.2.</p></div></body></html>';
  var blob = new Blob(['﻿', doc], { type: 'application/msword' }), a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = file + '.doc'; document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
