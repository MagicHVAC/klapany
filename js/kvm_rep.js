/* Отчёт расчёта ПДВ (kvm_ui.js): аккуратная вёрстка на экране и в Word.
   Шапка, нумерованные разделы, исходные данные таблицей, формулы с подстановкой и результатом, таблицы по участкам и этажам, сводка.
   Шрифт: на странице — шрифт сайта, в Word — Times New Roman (есть на любом ПК; 1.21.5 по указанию инженера). */
var REP_FONT = "'Times New Roman', Times, serif";
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
/* 1.23.3: без переноса и вправо — только числа; длинный текст переносится (иначе таблица уходила за край листа Word) */
function repIsNum(x) { return /^[\s\d,.+\-−—×⌀*()%]*$/.test(String(x == null ? '' : x).replace(/<[^>]+>/g, '')); }
function repT(head, rows, cls) {
  return '<div class="rep-scroll"><table class="rep-t ' + (cls || '') + '"><thead><tr>' + head.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr></thead><tbody>' +
    rows.map(function (r) { return '<tr>' + r.map(function (x, i) { return '<td' + (i && repIsNum(x) ? ' class="n"' : '') + '>' + x + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
}
function repSum(items) {
  return '<div class="rep-sum">' + items.map(function (x) { return '<div><span>' + x[0] + '</span><b>' + x[1] + '</b>' + (x[2] ? '<small>' + x[2] + '</small>' : '') + '</div>'; }).join('') + '</div>';
}
function repNote(o) { return (o.warn && o.warn.length) ? '<div class="rep-note"><b>Замечания</b><ul>' + o.warn.map(function (w) { return '<li>' + w + '</li>'; }).join('') + '</ul></div>' : ''; }
var REP_M = 'МР ВНИИПО к СП 7.13130.2013 (2013), СП 7.13130.2013 с Изм. № 1–3';
/* 1.27.0: МР (89), (90), (94), (96) — давление вентилятора приводится к стандартным условиям (ρ = 1,2 кг/м³) для подбора по каталогу */
function repPsv(o, ro, rn, fn) {
  return repF('Приведённое к стандартным условиям (' + fn + ') — для подбора по каталогу', 'P<sub>sv</sub> = 1,2·P<sub>раб</sub>/' + rn, '1,2 · ' + rf(o.PsvW, 2) + ' / ' + rf(ro, 4), rf(o.Psv, 0) + ' Па');
}
function repLam() { return (typeof SMK_COLEBROOK !== 'undefined' && SMK_COLEBROOK) ? 'λ — по Кольбруку (НЕ по МР, режим сверки)' : 'λ — по Альтшулю, МР (73): λ = 0,11·(68/Re + k/d<sub>e</sub>)<sup>1/4</sup>'; }

/* ---------- вытяжная ---------- */
function repSmk(p, o) {
  var V = +p.variant, cor = V === 0, n = 0, VN = ['коридор, холл, одноуровневый вестибюль — смежные с горящим помещением (МР 3.2.1)', 'многоуровневый вестибюль, молл, атриум — смежные с горящим помещением (МР 3.2.2)', 'зал, атриум — из горящего помещения (МР 3.1.1, 3.1.2)', 'атриум, очаг под галереей на уровне основания (МР 3.1.2, (9))', 'закрытая автостоянка, рампа (МР 3.1.2)'], h = repHead('Расчёт системы вытяжной противодымной вентиляции', p, REP_M);
  h += repSum([['Подача вентилятора', rf(o.Lv, 0) + ' м³/ч', 'при ' + rf(o.tFan, 0) + ' °C'], ['Давление вентилятора', rf(o.Psv, 0) + ' Па', 'приведённое (МР (' + (o.Pvf ? '90' : '89') + ')); рабочее ' + rf(o.PsvW, 0) + ' Па'], ['Удалять дыма', rf(o.G, 2) + ' кг/с', rf(o.L, 0) + ' м³/ч'],
    ['Дымоприёмных устройств', 'не менее ' + o.Nmin, 'шаг ≥ ' + rf(o.Lmin, 2) + ' м'], o.comp ? ['Компенсация: вентилятор', rf(o.comp.Lv, 0) + ' м³/ч', rf(o.comp.Psv, 0) + ' Па при ' + rf(p.tComp, 0) + ' °C'] : ['Компенсация', rf(o.La, 0) + ' м³/ч', 'n = ' + rf(o.nDis, 2) + ', при ' + rf(p.tComp, 0) + ' °C']]);
  h += repSec(++n, 'Исходные данные');
  var rows = [['Вариант', '', VN[V], '']].concat(cor ? [['Здание', '', p.living ? 'жилое' : 'общественное', '']] : []).concat([
    [V === 1 ? 'Защищаемый объём a × b × h' : 'Горящее помещение a × b × h', '', rf(p.L, 2) + ' × ' + rf(p.W, 2) + ' × ' + rf(p.H, 2), 'м'], ['Температура в помещении', 'tr', rf(p.tr, 0), '°C'], ['Низ дымового слоя от пола', 'Hнз', rf(p.hNz, 2), 'м']]);
  if (cor) rows = rows.concat([['Проёмы горящего помещения', 'Bi × Hi', p.doors.map(function (d) { return rf(d[0], 2) + ' × ' + rf(d[1], 2); }).join('; '), 'м'], ['Удельная пожарная нагрузка', 'qп', rf(p.qp, 0), 'МДж/м²'],
    ['Теплота сгорания', 'Qн', rf(p.Q, 1), 'МДж/кг'], ['Длина коридора', 'lc', rf(p.cL, 2), 'м'], ['Площадь коридора', 'Ac', rf(p.cA, 1), 'м²'], ['Высота коридора', 'hк', rf(p.cH, 2), 'м'], ['Дверь выхода', 'Ad × Hd', rf(p.dA, 2) + ' м² × ' + rf(p.dH, 2), 'м']]);
  else {
    rows.push(['Площадь пола', 'Asm', rf(o.Asm, 1) + (p.Ff > 0 ? '' : ' (a × b)'), 'м²']);
    if (V !== 4) rows = rows.concat([['Площадь очага', 'Fo', rf(p.Fo, 1), 'м²'], ['Теплота сгорания', 'Qн', rf(p.Q, 1), 'МДж/кг'], ['Скорость выгорания', 'ψ', rf(p.psi, 4), 'кг/(м²·с)'], ['Полнота сгорания', 'η', rf(p.eta, 2), '']]);
    else rows = rows.concat([['Ярусов хранения', '', String(o.tiers), ''], ['Верх дверей эвакуационных выходов', '', rf(p.dExitH, 2), 'м']]);
    rows.push(['Доля конвективной теплоты', 'r', rf(p.r, 2), '']);
    if (V === 1) rows = rows.concat([['Проём горящего помещения', 'Aw × Hw', rf(p.wA, 2) + ' м² × ' + rf(p.wH, 2), 'м'], ['Низ проёма от пола', '', rf(p.wZ, 2), 'м']]);
    if (V === 3) rows = rows.concat([['Ширина струи из-под галереи', 'W', rf(p.gW, 2), 'м'], ['От основания до ограждения галереи', 'H', rf(p.gH, 2), 'м']]);
  }
  rows = rows.concat([['Наружный воздух: лето / зима', 'tн', rf(p.tOut, 0) + ' / ' + rf(p.tComp, 0), '°C'], ['Участков сети', '', p.segs.length, ''], ['Закрытый клапан: Sдп', '', p.Skl > 0 ? rf(p.Skl, 0) + ' м³/кг (паспорт)' : 'по МР прил. 3 от температуры газа', ''],
    ['Конечный участок', '', p.endExhaust ? 'вентилятор с воздуховодами, выброс на фасад, v<sub>f</sub> = ' + rf(p.vOut, 0) + ' м/с' : 'крышный или настенный вентилятор', ''], ['Присоединительные воздуховоды', 'Pd', rf(o.dPout, 1), 'Па'], ['ДПУ a × b, низ от пола', '', rf(p.dpuW, 0) + ' × ' + rf(p.dpuB, 0) + ' мм, ' + rf(p.dpuH, 2) + ' м', '']]);
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
    var Qr = p.r * o.Qf;
    h += (V === 4 ? repF('Мощность очага (МР 3.1.2)', 'Q<sub>f</sub> = 5,0 МВт × число ярусов', '5000 · ' + o.tiers, rf(o.Qf, 0) + ' кВт')
        : repF('Мощность очага (3)', 'Q<sub>f</sub> = η·Q<sub>н</sub>·1000·ψ·F<sub>o</sub>', rf(p.eta, 2) + ' · ' + rf(p.Q, 1) + ' · 1000 · ' + rf(p.psi, 4) + ' · ' + rf(p.Fo, 1), rf(o.Qf, 0) + ' кВт')) +
      (V === 2 ? repF('Справочно: радиус при q<sub>кр</sub> = 10 кВт/м² (не из МР)', 'R = [Q<sub>f</sub>/(4π·q<sub>кр</sub>)]<sup>0,5</sup>', '', rf(o.Rsafe, 2) + ' м') : '') +
      repF('Геометрия слоя', 'h<sub>sm</sub> = H − H<sub>нз</sub>; l<sub>sm</sub> = 2(a + b); A<sub>sm</sub>', rf(p.H, 2) + ' − ' + rf(p.hNz, 2) + '; 2 · (' + rf(p.L, 2) + ' + ' + rf(p.W, 2) + ')', rf(o.hsm, 2) + ' м; ' + rf(o.lsm, 2) + ' м; ' + rf(o.Asm, 1) + ' м²') +
      (o.f === 7 || o.f === 8 ? repF('Высота факела, выбор (7) или (8)', 'z<sub>1</sub> = 0,166·(r·Q<sub>f</sub>)<sup>2/5</sup>', '0,166 · (' + rf(p.r, 2) + ' · ' + rf(o.Qf, 0) + ')<sup>0,4</sup>', rf(o.Zf, 2) + ' м ' + (o.f === 8 ? '> ' : '< ') + 'z = H<sub>нз</sub> = ' + rf(p.hNz, 2) + ' м → (' + o.f + ')') : '') +
      (o.f === 7 ? repF('Конвективная колонка (7)', 'G<sub>k</sub> = 0,071·(r·Q<sub>f</sub>)<sup>1/3</sup>·z<sup>5/3</sup> + 0,0018·r·Q<sub>f</sub>', '0,071 · ' + rf(Qr, 1) + '<sup>1/3</sup> · ' + rf(p.hNz, 2) + '<sup>5/3</sup> + 0,0018 · ' + rf(Qr, 1), rf(o.Gk, 3) + ' кг/с')
      : o.f === 8 ? repF('Конвективная колонка (8)', 'G<sub>k</sub> = 0,032·(r·Q<sub>f</sub>)<sup>3/5</sup>·z', '0,032 · ' + rf(Qr, 1) + '<sup>3/5</sup> · ' + rf(p.hNz, 2), rf(o.Gk, 3) + ' кг/с')
      : o.f === 9 ? repF('Струя из-под галереи (9)', 'G<sub>k</sub> = 0,36·(Q<sub>f</sub>·W)<sup>1/3</sup>·(z + 0,25·H), z = H<sub>нз</sub> − H', '0,36 · (' + rf(o.Qf, 0) + ' · ' + rf(p.gW, 2) + ')<sup>1/3</sup> · (' + rf(o.zg, 2) + ' + 0,25 · ' + rf(p.gH, 2) + ')', rf(o.Gk, 3) + ' кг/с') +
          '<p class="rep-p">В МР (9) напечатано (Q<sub>f</sub>·W)<sup>1/3</sup>; в первоисточнике — стандарте NFPA 92 [5] — W². Расчёт — по тексту МР.</p>'
      : repF('Геометрический комплекс (МР 3.2.2)', 'a = 2,4·A<sub>w</sub><sup>2/5</sup>·H<sub>w</sub><sup>1/5</sup> − 2,1·H<sub>w</sub>', '2,4 · ' + rf(p.wA, 2) + '<sup>0,4</sup> · ' + rf(p.wH, 2) + '<sup>0,2</sup> − 2,1 · ' + rf(p.wH, 2), rf(o.aw, 3) + ' м') +
        repF('Конвективная колонка из проёма (18)', 'G<sub>k</sub> = 0,68·(A<sub>w</sub>·H<sub>w</sub><sup>1/2</sup>)<sup>1/3</sup>·(Z<sub>w</sub> + a)<sup>5/3</sup> + 1,59·A<sub>w</sub>·H<sub>w</sub><sup>1/2</sup>, Z<sub>w</sub> = H<sub>нз</sub> − (низ проёма + H<sub>w</sub>)', 'Z<sub>w</sub> = ' + rf(o.Zw, 2) + ' м', rf(o.Gk, 3) + ' кг/с')) +
      repF('Температура колонки и слоя (4)', 'T<sub>k</sub> = T<sub>r</sub> + r·Q<sub>f</sub>/(c<sub>pk</sub>·G<sub>k</sub>); α = 0,01163·exp(0,0023·(T<sub>sm</sub> − 273))', 'T<sub>k</sub> = ' + rf(o.Tk, 0) + ' K; α = ' + rf(o.alpha, 4), 'T<sub>sm</sub> = ' + rf(o.Tsm, 1) + ' K') +
      repF('Массовый расход — режим (12), без интегрирования (2)', 'G<sub>ПГ</sub> = G<sub>k</sub>', '', rf(o.G, 3) + ' кг/с');
  }
  h += repF('Объёмный расход', 'L<sub>ПГ</sub> = G<sub>ПГ</sub>/ρ<sub>ПГ</sub>·3600, ρ<sub>ПГ</sub> = 353/T<sub>sm</sub>', rf(o.G, 3) + ' / ' + rf(353 / o.Tsm, 3) + ' · 3600', rf(o.L, 0) + ' м³/ч');
  h += repSec(++n, 'Сеть вытяжной противодымной вентиляции');
  h += repF('Открытый клапан на этаже пожара', 'ΔP<sub>кл</sub> = ½·(ζ<sub>кл</sub> + ζ′)·V<sub>кл</sub>²·ρ<sub>ПГ</sub>, F<sub>кл</sub> = (a − 50)·(b − 50)', 'F<sub>кл</sub> = ' + rf(o.Fkl, 4) + ' м²; V<sub>кл</sub> = ' + rf(o.vkl, 2) + ' м/с; ½ · (' + rf(o.zkl, 2) + ' + ' + rf(p.segs[0].nodeZ, 2) + ') · ' + rf(o.vkl, 2) + '² · ' + rf(353 / o.Tsm, 3), rf(o.dPkl, 2) + ' Па') +
    '<p class="rep-p">Подсосы: через стенки — (ρ<sub>в</sub>/3600)·S·0,032·ΔP<sup>0,65</sup> (МР прил. 3 п. 1), через закрытые клапаны — (85) F<sub>кл</sub>·(|P<sub>Ш</sub>|/S<sub>дп</sub>)<sup>1/2</sup>, S<sub>дп</sub> — ' + (p.Skl > 0 ? 'по паспорту ' + rf(p.Skl, 0) : 'по МР прил. 3 при температуре газа участка') + ' м³/кг; давление по участкам — (83): P<sub>i+1</sub> = P<sub>i</sub> − ΔP<sub>тр</sub> + g·h·(ρ<sub>r</sub> − ρ<sub>i</sub>); смешение — по массе; ' + repLam() + '; теплопотери через стенки не учтены (МР 5.1.5 допускает при падении t < 1 К; в запас по объёму).</p>';
  h += repT(['Участок', 'P<sub>Ш</sub>, Па', 'Подсос клапана, кг/с', 'Подсос стенок, кг/с', 'G<sub>Ш</sub>, кг/с', 'T, K', 'ρ, кг/м³', 'v, м/с', 'λ', 'ΔP<sub>Ш</sub>, Па'], o.rows.map(function (r) {
    return [r.i + (r.open ? ' (пожар)' : r.last ? ' (верх)' : ''), rf(r.P, 2), rf(r.gKl, 5), rf(r.gH + r.gV, 5), rf(r.G, 4), rf(r.T, 1), rf(r.ro, 3), rf(r.ver.v, 2), rf(r.ver.lam, 4), rf(r.ver.dp, 2)];
  }), 'rep-net');
  if (window.kmszRep) h += kmszRep(p);
  h += repSec(++n, 'Вентилятор');
  h += repF('Подача', 'L<sub>v</sub> = G<sub>Ш</sub>/ρ<sub>N</sub>·3600', rf(o.GN, 4) + ' / ' + rf(o.roN, 4) + ' · 3600', rf(o.Lv, 0) + ' м³/ч') +
    (o.netOut ? kmsRep(o.netOut, 'Сеть от вентилятора до выброса') : '') + repF('Статическое давление в рабочих условиях', 'P<sub>раб</sub> = |P<sub>N</sub>| + P<sub>d</sub>' + (o.Pvf ? ' + 0,5·ρ<sub>N</sub>·v<sub>f</sub>²' : ''), rf(o.PshN, 2) + ' + ' + rf(o.dPout, 2) + (o.Pvf ? ' + ' + rf(o.Pvf, 2) : ''), rf(o.PsvW, 2) + ' Па (рабочее)') + repPsv(o, o.roN, 'ρ<sub>N</sub>', o.Pvf ? '90' : '89') +
    repF('Температура перед вентилятором', 't = T<sub>N</sub> − 273', '', rf(o.tFan, 0) + ' °C');
  h += repSec(++n, 'Дымоприёмные устройства (СП 7.13130, прил. Е, Изм. № 3)');
  /* 1.27.0: число ДПУ — пошагово (инженер 07.11: «как получилось количество — должно быть расписано») */
  var Vs = o.G / o.ro, Nx = o.V1 > 0 ? Vs / o.V1 : NaN;
  h += repF('1. Эквивалентный диаметр ДПУ', 'D<sub>э</sub> = 2·a·b/(a + b)', '2 · ' + rf(p.dpuW / 1000, 3) + ' · ' + rf(p.dpuB / 1000, 3) + ' / (' + rf(p.dpuW / 1000, 3) + ' + ' + rf(p.dpuB / 1000, 3) + ')', rf(o.dpuD, 3) + ' м') +
    repF('2. Заглубление ДПУ в дымовой слой', 'd = H<sub>ДПУ</sub> − H<sub>нз</sub>; условие d ≥ 2D<sub>э</sub>', rf(p.dpuH, 2) + ' − ' + rf(p.hNz, 2) + ' = ' + rf(o.d, 2) + ' м; 2D<sub>э</sub> = ' + rf(2 * o.dpuD, 2) + ' м', o.d >= 2 * o.dpuD ? 'выполнено' : 'НЕ выполнено') +
    repF('3. Коэффициент расположения', 'γ = 1 — горизонтально, ось дальше 2D от стены; γ = 0,5 — ближе 2D или вертикально', ['горизонтально, дальше 2D', 'горизонтально, ближе 2D', 'вертикально'][p.dpuType] || '', 'γ = ' + rf(o.gamma, 1)) +
    repF('4. Наибольший расход через 1 ДПУ (Е.1)', 'V<sub>1max</sub> = 4,16·γ·d<sup>5/2</sup>·[(T<sub>sm</sub> − T<sub>r</sub>)/T<sub>r</sub>]<sup>1/2</sup>', '4,16 · ' + rf(o.gamma, 1) + ' · ' + rf(o.d, 2) + '<sup>5/2</sup> · [(' + rf(o.Tsm, 1) + ' − ' + rf(o.Tr, 1) + ') / ' + rf(o.Tr, 1) + ']<sup>1/2</sup>', rf(o.V1, 3) + ' м³/с') +
    repF('5. Объёмный расход дыма из помещения', 'V<sub>sm</sub> = G<sub>ПГ</sub>/ρ<sub>sm</sub>, ρ<sub>sm</sub> = 353/T<sub>sm</sub>', rf(o.G, 3) + ' / ' + rf(o.ro, 4), rf(Vs, 3) + ' м³/с') +
    repF('6. Число ДПУ', 'N = V<sub>sm</sub>/V<sub>1max</sub> → округление вверх до целого', rf(Vs, 3) + ' / ' + rf(o.V1, 3) + ' = ' + rf(Nx, 2), 'N<sub>min</sub> = ' + o.Nmin + ' шт.') +
    repF('7. Наименьшее расстояние между ДПУ (Е.2)', 'L<sub>min</sub> = 0,9·V<sub>1max</sub><sup>1/2</sup>', '0,9 · ' + rf(o.V1, 3) + '<sup>1/2</sup>', rf(o.Lmin, 2) + ' м') +
    '<p class="rep-p">Кроме расчёта проверь требования СП 7.13130 к расстановке ДПУ (зона обслуживания одного устройства) — принимается большее из чисел. Формулы — СП 7.13130.2013, приложение Е (обязательное), введено Изменением № 3 (приказ МЧС России от 27.03.2025 № 251): Е.1 — V<sub>max</sub> и N<sub>min</sub> = G<sub>sm</sub>/(ρ<sub>sm</sub>·V<sub>max</sub>) с округлением в большую сторону; Е.2 — L<sub>min</sub>. Сверено с действующей редакцией 07.11.2026.</p>';
  h += repSec(++n, 'Компенсирующая подача воздуха');
  h += repF('Массовый расход (65)', 'G<sub>a</sub> = G<sub>sm</sub>/(1 − n), −0,3 ≤ n ≤ 0,3', rf(o.G, 3) + ' / (1 − ' + rf(o.nDis, 2) + ')', rf(o.Gac, 3) + ' кг/с (допустимо ' + rf(o.GaMin, 2) + ' … ' + rf(o.GaMax, 2) + ')') +
    repF('Объёмный расход при ' + rf(p.tComp, 0) + ' °C (66)', 'L<sub>a</sub> = 3600·G<sub>a</sub>/ρ<sub>a</sub>', '3600 · ' + rf(o.Gac, 3) + ' / ' + rf(o.roComp, 3), rf(o.La, 0) + ' м³/ч');
  if (o.comp && window.repComp) h += repComp(p, o);
  return repSup('<div class="rep">' + h + repNote(o) + '</div>');
}

/* ---------- подпор: лестница ---------- */
function repAirRows(a) { return [['Наружный воздух (зима)', 'ta', rf(a.ta, 0), '°C'], ['Воздух в здании', 'tr', rf(a.tr, 0), '°C'], ['Скорость ветра', 'va', rf(a.va, 1), 'м/с'], ['Коэфф. ветрового напора', 'Kww / Kw0', rf(a.kww, 1) + ' / ' + rf(a.kw0, 1), '']]; }
function repDuct(d, o, p) { if (p && p.net && p.net.secs) return 'по участкам — ' + p.net.secs.length + ' шт., см. расчёт сети'; return (d.rect ? rf(d.a, 0) + ' × ' + rf(d.b, 0) + ' мм' : '⌀ ' + rf(d.a, 0) + ' мм') + ', l = ' + rf(d.len, 1) + ' м, Σξ = ' + rf(d.xi, 1); }
/* 1.26.0: лестничная клетка подземной части — МР п. 4.1.4, (38)–(42) */
function repStairUG(p, o) {
  var n = 0, h = repHead('Расчёт подпора воздуха в лестничную клетку подземной части', p, REP_M);
  h += repSum([['Подача вентилятора', rf(o.Lv, 0) + ' м³/ч', 'наружный воздух ' + rf(p.air.ta, 0) + ' °C'], ['Давление вентилятора', rf(o.Psv, 0) + ' Па', 'статическое'], ['Перепад на дверях', rf(o.dpmin, 0) + '…' + rf(o.dpmax, 0) + ' Па', o.dpmin < 20 ? 'меньше 20 Па' : o.dpmax > 150 ? 'больше 150 Па' : 'от 20 до 150 Па'], ['Расход в клетке', rf(o.Gs, 2) + ' кг/с', 'у нижнего этажа']]);
  h += repSec(++n, 'Исходные данные');
  h += repIn([['Условия', '', ['подземная часть, выход наружу на уровне 1-го этажа (п. 4.1.4)', p.floorTamb ? 'поэтажно — через тамбур-шлюзы' : 'поэтажно — одинарные двери'].join('; '), ''],
    ['Подземных этажей; высота', 'n; h', Math.round(p.NUG) + '; ' + rf(p.hUG, 2), 'м'], ['Глубина (пол нижнего подземного)', 'h-n', rf(o.hn, 2), 'м']].concat(repAirRows(p.air)).concat([['Удаляется дыма с этажа пожара', 'Gsm', rf(p.Gsm, 2), 'кг/с'],
    ['Проекция маршей и площадок; КМС клетки; z', 'Fs; ξs; z', rf(p.Fs, 1) + '; ' + rf(p.xis, 0) + '; ' + rf(p.zUG || 1, 2), 'м²'],
    ['Наружный выход: дверь, высота, дверей, ξd, ξr', '', rf(p.Fda, 2) + ' м², ' + rf(p.hda, 2) + ' м, ' + p.nd + ', ' + rf(p.xid, 2) + ', ' + rf(p.xir, 2), ''], ['Двери на этажах: площадь, высота', 'Fd, hd', rf(p.Fd, 2) + ' м², ' + rf(p.hd, 2) + ' м', ''],
    ['Воздуховод', '', repDuct(p.duct, null, p), ''], ['Подача воздуха в клетку', '', p.ugFeed === 'bot' ? 'снизу — у нижнего подземного этажа' : 'сверху — у верхнего подземного этажа', ''], ['Воздухозабор выше места подачи на', 'h0s', rf(p.h0, 1), 'м']]));
  h += repSec(++n, 'Расчёт');
  h += repF('Плотности', 'ρ = 353/T; t<sub>s</sub> = (t<sub>a</sub> + t<sub>r</sub>)/2', 'ρ<sub>a</sub> = ' + rf(o.roa, 3) + '; ρ<sub>r</sub> = ' + rf(o.ror, 3) + '; ρ<sub>s</sub> = ' + rf(o.ros, 3), 'кг/м³') +
    repF('Ветровое давление', 'P<sub>w</sub> = 0,25·(K<sub>ww</sub> − K<sub>w0</sub>)·ρ<sub>a</sub>·v<sub>a</sub>²', '', rf(o.Pw, 2) + ' Па') +
    repF('Давление в помещениях подземных этажей (38)', 'P<sub>r−i</sub> = g·(h<sub>−n</sub> − h<sub>−i</sub>)·(ρ<sub>a</sub> − ρ<sub>r</sub>)', 'по этажам — в таблице', '') +
    repF('Давление у двери верхнего подземного этажа (39)', 'P<sub>s−1</sub> = 20 + g·(h<sub>−n</sub> − (h<sub>−1</sub> + 0,5h<sub>d</sub>))·(ρ<sub>s</sub> − ρ<sub>r</sub>)', '', rf(o.P1, 2) + ' Па') +
    repF('Расход через наружный выход (40)', 'G<sub>sa</sub> = {2ρ<sub>s</sub>/[(nξ<sub>d</sub> + ξ<sub>r</sub> + 1)/F<sub>da</sub>² + 60z/F<sub>s</sub>²]·[P<sub>w</sub> + P<sub>s−1</sub> − g·(h<sub>−n</sub> − 0,5h<sub>da</sub>)·(ρ<sub>a</sub> − ρ<sub>s</sub>)]}<sup>1/2</sup>', '', rf(o.Gsa, 3) + ' кг/с') +
    repF('Расход в открытой двери этажа пожара (25)', 'G<sub>s−1</sub> = G<sub>sm</sub>/q, q = max(p − 1; 1)', rf(p.Gsm, 2) + ' / ' + o.q, rf(o.GsF, 3) + ' кг/с → принято ' + rf(o.Gs0, 3) + ' кг/с') +
    repF('Сопротивление закрытых дверей', 'S<sub>d</sub> = ' + (p.gasProof ? '60000' : '5300') + '/ρ<sub>s</sub>', '', rf(o.Sd, 1) + ' м³/кг') +
    repF('Нижележащие этажи (26)–(28), (' + (p.gasProof ? '42' : '41') + ')', 'ΔG<sub>sd(−i−1)</sub> = F<sub>d</sub>/S<sub>d</sub><sup>1/2</sup>·[P<sub>s(−i−1)</sub> − g·(h<sub>−n</sub> − (h<sub>(−i−1)</sub> − 0,5h<sub>d</sub>))·(ρ<sub>s</sub> − ρ<sub>r</sub>)]<sup>1/2</sup>', 'знаки ±0,5h<sub>d</sub> в (39) и (41) — как в МР', '');
  h += repT(['Этаж', 'h, м', 'P<sub>r</sub>, Па', 'P<sub>s</sub>, Па', 'ΔP<sub>d</sub>, Па', 'v<sub>s</sub>, м/с', 'ΔP<sub>s</sub>, Па', 'ΔG<sub>sd</sub>, кг/с', 'G<sub>s</sub>, кг/с'], o.rows.map(function (r) {
    return [r.i + (r.i === -1 ? ' (дверь открыта)' : ''), rf(r.h, 2), rf(r.Pr, 2), rf(r.P, 2), rf(r.dPd, 2), rf(r.v, 3), rf(r.dPs, 2), rf(r.dG, 4), rf(r.G, 3)];
  }));
  h += repSec(++n, 'Вентилятор (93), (94)');
  h += (o.net ? kmsRep(o.net, 'Сеть от воздухозабора до клетки') : repF('Воздуховоды', 'P<sub>вв</sub> = λ·l/D<sub>э</sub>·P<sub>d</sub> + Σξ·P<sub>d</sub>', 'v = ' + rf(o.duct.v, 2) + ' м/с; P<sub>d</sub> = ' + rf(o.duct.Pd, 2) + ' Па; λ = ' + rf(o.duct.f, 4), rf(o.duct.P, 2) + ' Па')) +
    repF('Подача', 'L<sub>v</sub> = 3600·G<sub>s</sub>/ρ<sub>a</sub>', '3600 · ' + rf(o.Gs, 3) + ' / ' + rf(o.roa, 3), rf(o.Lv, 0) + ' м³/ч') +
    (o.bot ? repF('Статическое давление, подача снизу', 'P<sub>sv</sub> = P<sub>s(−n)</sub> + g·h<sub>s</sub>·(ρ<sub>a</sub> − ρ<sub>s</sub>) + g·h<sub>0s</sub>·(ρ<sub>a</sub> − ρ<sub>r</sub>) + P<sub>вв</sub>', rf(o.Ps, 2) + ' + 9,81 · ' + rf(o.hsN, 2) + ' · ' + rf(o.roa - o.ros, 3) + ' + 9,81 · ' + rf(p.h0, 1) + ' · ' + rf(o.roa - o.ror, 3) + ' + ' + rf(o.duct.P, 2), rf(o.PsvW, 0) + ' Па (рабочее)') : repF('Статическое давление, подача сверху', 'P<sub>sv</sub> = P<sub>s−1</sub> + g·h<sub>0s</sub>·(ρ<sub>a</sub> − ρ<sub>r</sub>) + P<sub>вв</sub> (h<sub>s</sub> = 0)', rf(o.Ps, 2) + ' + 9,81 · ' + rf(p.h0, 1) + ' · ' + rf(o.roa - o.ror, 3) + ' + ' + rf(o.duct.P, 2), rf(o.PsvW, 0) + ' Па (рабочее)')) + repPsv(o, o.roa, 'ρ<sub>a</sub>', '94');
  return repSup('<div class="rep">' + h + repNote(o) + '</div>');
}
function repStair(p, o) {
  if (o.ug) return repStairUG(p, o);
  var n = 0, h = repHead('Расчёт подпора воздуха в лестничную клетку', p, REP_M);
  h += repSum([['Подача вентилятора', rf(o.Lv, 0) + ' м³/ч', 'наружный воздух ' + rf(p.air.ta, 0) + ' °C'], ['Давление вентилятора', rf(o.Psv, 0) + ' Па', 'статическое'], ['Перепад на дверях', 'до ' + rf(o.dpmax, 0) + ' Па', o.dpmax > 150 ? 'больше 150 — рассечка' : 'не больше 150 Па'], ['Расход в клетке', rf(o.Gs, 2) + ' кг/с', 'вверху']]);
  h += repSec(++n, 'Исходные данные');
  h += repIn([['Условия', '', [p.windows ? 'окна на каждом этаже' : 'без окон', p.outerExit ? 'обособленный наружный выход' : 'без наружного выхода', p.noFloor1 ? 'с 1-м этажом не сообщается' : 'с 1-м этажом — одинарная дверь', p.floorTamb ? 'поэтажно — через тамбур-шлюзы' : 'поэтажно — одинарные двери'].join('; '), ''],
    ['Этажей; высота 1-го / вышележащих', 'N', p.N + '; ' + rf(p.h1, 2) + ' / ' + rf(p.hf, 2), 'м']].concat(repAirRows(p.air)).concat([['Удаляется дыма с этажа пожара', 'Gsm', rf(p.Gsm, 2), 'кг/с'], ['Проекция маршей и площадок; КМС маршей', 'Fs; ξs', rf(p.Fs, 1) + '; ' + rf(p.xis, 0), 'м²'],
    ['Наружный выход: дверь, высота, дверей, ξd, ξr', '', rf(p.Fda, 2) + ' м², ' + rf(p.hda, 2) + ' м, ' + p.nd + ', ' + rf(p.xid, 2) + ', ' + rf(p.xir, 2), ''], ['Двери на этажах: площадь, высота', 'Fd, hd', rf(p.Fd, 2) + ' м², ' + rf(p.hd, 2) + ' м', ''],
    ['Окно на этаже; воздухопроницаемость', 'Fw', rf(p.Fw, 2) + ' м²; ' + rf(p.winVal, 2), ''], ['Избыточное давление', 'P+', rf(p.Pplus, 0), 'Па'], ['Воздуховод до оголовка', '', repDuct(p.duct, null, p), ''], ['Воздухозабор ниже оголовка на', 'h0s', rf(p.h0, 1), 'м']]));
  h += repSec(++n, 'Расчёт');
  h += repF('Плотности', 'ρ = 353/T; t<sub>s</sub> = (t<sub>a</sub> + t<sub>r</sub>)/2', 'ρ<sub>a</sub> = ' + rf(o.roa, 3) + '; ρ<sub>r</sub> = ' + rf(o.ror, 3) + '; ρ<sub>s</sub> = ' + rf(o.ros, 3), 'кг/м³') +
    repF('Ветровое давление', 'P<sub>w</sub> = 0,25·(K<sub>ww</sub> − K<sub>w0</sub>)·ρ<sub>a</sub>·v<sub>a</sub>²', '', rf(o.Pw, 2) + ' Па') +
    repF(p.noFloor1 ? 'Давление у двери 2-го этажа (23)' : 'Давление у двери 1-го этажа (33)', p.noFloor1 ? 'P<sub>s</sub> = P<sup>+</sup> + P<sub>w</sub> − g·(h<sub>2</sub> + 0,5h<sub>d</sub>)·(ρ<sub>s</sub> − ρ<sub>r</sub>)' : 'P<sub>s</sub> = P<sup>+</sup> + P<sub>w</sub> − 0,5·g·h<sub>d</sub>·(ρ<sub>s</sub> − ρ<sub>r</sub>)', '', rf(o.P1, 2) + ' Па') +
    repF('Расход через наружный выход ' + (p.noFloor1 ? '(24)' : '(34)'), 'G<sub>sa</sub> = {2ρ<sub>s</sub>·[…] / [(nξ<sub>d</sub> + ξ<sub>r</sub> + 1)/F<sub>da</sub>²' + (p.noFloor1 ? ' + 60z/F<sub>s</sub>², z = ' + rf(p.zUG || 1, 2) : '') + ']}<sup>1/2</sup>', '', rf(o.Gsa, 3) + ' кг/с') +
    repF('Расход в открытой двери этажа пожара (25)', 'G<sub>s(F)</sub> = G<sub>sm</sub>/q, q = max(p − 1; 1)', rf(p.Gsm, 2) + ' / ' + o.q, rf(o.GsF, 3) + ' кг/с → принято ' + rf(o.Gs0, 3) + ' кг/с') +
    repF('Сопротивление закрытых дверей', 'S<sub>d</sub> = ' + (p.gasProof ? '60000' : '5300') + '/ρ<sub>s</sub>', '', rf(o.Sd, 1) + ' м³/кг');
  h += repT(['Этаж', 'h, м', 'P<sub>s</sub>, Па', 'ΔP<sub>d</sub>, Па', 'v<sub>s</sub>, м/с', 'ΔP<sub>s</sub>, Па', 'ΔG<sub>sd</sub>, кг/с', 'ΔG<sub>sw</sub>, кг/с', 'G<sub>w</sub>, кг/(ч·м²)', 'G<sub>s</sub>, кг/с'], o.rows.slice().reverse().map(function (r) {
    return [r.i, rf(r.h, 2), rf(r.P, 2), rf(r.dPd, 2), rf(r.v, 3), rf(r.dPs, 2), rf(r.dG, 4), rf(r.dGw || 0, 4), rf(r.Gw || 0, 2), rf(r.G, 3)];
  }));
  h += repSec(++n, 'Вентилятор (93), (94)');
  h += (o.net ? kmsRep(o.net, 'Сеть от воздухозабора до клетки') : repF('Воздуховоды до оголовка', 'P<sub>вв</sub> = λ·l/D<sub>э</sub>·P<sub>d</sub> + Σξ·P<sub>d</sub>', 'v = ' + rf(o.duct.v, 2) + ' м/с; P<sub>d</sub> = ' + rf(o.duct.Pd, 2) + ' Па; λ = ' + rf(o.duct.f, 4), rf(o.duct.P, 2) + ' Па')) +
    repF('Подача', 'L<sub>v</sub> = 3600·G<sub>s</sub>/ρ<sub>a</sub>', '3600 · ' + rf(o.Gs, 3) + ' / ' + rf(o.roa, 3), rf(o.Lv, 0) + ' м³/ч') +
    repF('Статическое давление', 'P<sub>sv</sub> = P<sub>s</sub> + g·h<sub>sN</sub>·(ρ<sub>a</sub> − ρ<sub>s</sub>) + g·h<sub>0s</sub>·(ρ<sub>a</sub> − ρ<sub>r</sub>) + P<sub>вв</sub>', rf(o.Ps, 2) + ' + 9,81 · ' + rf(o.hsN, 2) + ' · ' + rf(o.roa - o.ros, 3) + ' + 9,81 · ' + rf(p.h0, 1) + ' · ' + rf(o.roa - o.ror, 3) + ' + ' + rf(o.duct.P, 2), rf(o.PsvW, 0) + ' Па (рабочее)') + repPsv(o, o.roa || o.roa, 'ρ<sub>a</sub>', '94');
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
    ['Сечения кабины / шахты', 'Fk / Fls', rf(p.Fk, 2) + ' / ' + rf(p.Fls, 2), 'м²'], ['Избыточное давление', 'P+', rf(p.Pplus, 0), 'Па'], ['Воздуховод', '', repDuct(p.duct, null, p), ''], ['Воздухозабор ниже оголовка на', 'h0l', rf(p.h0, 1), 'м']]));
  h += repSec(++n, 'Расчёт');
  h += repF('Плотности', 'ρ = 353/T; t<sub>l</sub> = (t<sub>a</sub> + t<sub>r</sub>)/2', 'ρ<sub>a</sub> = ' + rf(o.roa, 3) + '; ρ<sub>r</sub> = ' + rf(o.ror, 3) + '; ρ<sub>l</sub> = ' + rf(o.rol, 3), 'кг/м³') +
    repF('Сопротивления закрытых дверей (46)', 'S<sub>lr</sub> = S<sub>dl</sub>/(n·F<sub>dl</sub>)² + S<sub>dr</sub>/(m·F<sub>dr</sub>)²', 'S<sub>dl</sub> = ' + rf(o.Sdl, 1) + '; S<sub>dr</sub> = ' + rf(o.Sdr, 1), rf(o.Slr, 2) + ' кг⁻¹·м⁻¹') +
    repF('КМС узла «кабина–шахта» (45)', 'ξ<sub>l</sub> = 4,3 + F<sub>k</sub>/F<sub>ls</sub>', '', rf(o.xil, 2)) +
    repF('Давление и расход на 1-м этаже', 'G<sub>(1)</sub> = {2ρ<sub>l</sub>·P<sub>l(1)</sub> / [ξ<sub>l</sub>/(nF<sub>dl</sub>)²' + (p.hall1 ? ' + (ξ<sub>d</sub> + 1)/(mF<sub>dr</sub>)²' : '') + ']}<sup>1/2</sup>', 'P<sub>l(1)</sub> = ' + rf(o.P1, 2) + ' Па', rf(o.G1, 3) + ' кг/с') +
    (o.dPcs ? repF('Потери в зазоре кабина–шахта', 'ΔP<sub>cs</sub> = 0,5·ρ<sub>l</sub>·v<sub>cs</sub>²', 'v<sub>cs</sub> = ' + rf(o.vcs, 2) + ' м/с', rf(o.dPcs, 2) + ' Па; P<sub>l</sub> = ' + rf(o.Pl, 2) + ' Па') : repF('Давление в шахте', 'P<sub>l</sub> = P<sub>w</sub> + P<sup>+</sup> − g·(h<sub>2</sub> + 0,5h<sub>dl</sub>)·(ρ<sub>l</sub> − ρ<sub>r</sub>)', '', rf(o.Pl, 2) + ' Па'));
  h += repT(['Этаж', 'h<sub>э</sub>, м', 'ΔP<sub>d</sub>, Па', 'ΔG, кг/с'], o.rows.slice().reverse().map(function (r) { return [r.i + (r.i === 1 ? ' (двери открыты)' : ''), rf(r.h, 2), isFinite(r.dPd) ? rf(r.dPd, 2) : '—', r.i === 1 ? rf(o.G1, 3) : rf(r.dG, 4)]; }));
  h += repSec(++n, 'Вентилятор (95), (96)');
  h += (o.net ? kmsRep(o.net, 'Сеть от воздухозабора до шахты') : repF('Воздуховоды', 'P<sub>dl</sub> = (λ·l/D<sub>э</sub> + Σξ)·0,5·ρ<sub>a</sub>·v²', 'v = ' + rf(o.duct.v, 2) + ' м/с; λ = ' + rf(o.duct.f, 4), rf(o.duct.P, 2) + ' Па')) +
    repF('Подача', 'L<sub>v</sub> = 3600·G<sub>l</sub>/ρ<sub>a</sub>', '3600 · ' + rf(o.Gl, 3) + ' / ' + rf(o.roa, 3), rf(o.Lv, 0) + ' м³/ч') +
    repF('Статическое давление (96)', 'P<sub>раб</sub> = P<sub>l</sub> + g·h<sub>lN</sub>·(ρ<sub>a</sub> − ρ<sub>l</sub>) + g·h<sub>0l</sub>·(ρ<sub>a</sub> − ρ<sub>r</sub>) + P<sub>dl</sub>', rf(o.Pl, 2) + ' + ' + rf(o.gH, 2) + ' + 9,81 · ' + rf(p.h0, 1) + ' · ' + rf(o.roa - o.ror, 3) + ' + ' + rf(o.duct.P, 2), rf(o.PsvW, 0) + ' Па (рабочее)') + repPsv(o, o.roa, 'ρ<sub>a</sub>', '96');
  /* 1.27.2: подземная часть шахты — МР 4.2.5, 4.2.6 (supLiftUG, kvm_lift_ug.js) */
  if (o.ug && isFinite(o.ug.Lv)) {
    var u = o.ug, gg = 9.81;
    h += repSec(++n, 'Подземная часть шахты — отдельная система (МР 4.2.5, 4.2.6)');
    h += repF('Давление в шахте (55)', 'P<sub>l−n</sub> = 20 + g·(h<sub>−n</sub> − (h<sub>−n</sub> + 0,5·h<sub>dl</sub>))·(ρ<sub>l</sub> − ρ<sub>r</sub>)', '20 − 0,5 · 9,81 · ' + rf(p.hdl, 2) + ' · ' + rf(o.rol - o.ror, 4), rf(u.Pl, 2) + ' Па') +
      repF('Расход через открытые двери основного этажа (56)', 'G<sub>l1</sub> = {2ρ<sub>l</sub>/[ξ<sub>l</sub>/(nF<sub>dl</sub>)² + (ξ<sub>d</sub> + 1)/(mF<sub>dr</sub>)²]·[20 − 0,5gh<sub>dl</sub>(ρ<sub>l</sub> − ρ<sub>r</sub>) + 0,25(k<sub>ww</sub> − k<sub>w0</sub>)ρ<sub>a</sub>v<sub>a</sub>² − g(h<sub>−n</sub> − 0,5h<sub>dl</sub>)(ρ<sub>a</sub> − ρ<sub>l</sub>)]}<sup>1/2</sup>', 'h<sub>−n</sub> = −' + rf(p.NUG * p.hUG, 2) + ' м', rf(u.G1, 3) + ' кг/с') +
      repF('Доля нижней системы (4.2.6)', 'G<sub>l1</sub><sup>ниж</sup> = s·G<sub>l1</sub>; надземной — (1 − s)·G<sub>l1</sub><sup>надз</sup>', 's = ' + rf(u.share, 2) + (o.G1full ? '; надземная: ' + rf(o.G1full, 3) + ' → ' + rf(o.G1, 3) + ' кг/с' : ''), rf(u.G1u, 3) + ' кг/с') +
      repT(['Этаж', 'Отметка, м', 'ΔP на дверях, Па', 'Утечка, кг/с'], u.rows.map(function (r) { return [String(r.i), rf(r.h, 2), rf(r.dPd, 2), rf(r.dG, 4)]; }), 'rep-net') +
      repF('Суммарный расход (58)', 'G<sub>l</sub> = G<sub>l1</sub><sup>ниж</sup> + Σ[(P<sub>l−i</sub> + g(h<sub>−n</sub> − (h<sub>−i</sub> + 0,5h<sub>dl</sub>))(ρ<sub>l</sub> − ρ<sub>r</sub>))/S<sub>lr−i</sub>]<sup>1/2</sup>', rf(u.G1u, 3) + ' + ' + rf(u.leak, 4), rf(u.Gl, 3) + ' кг/с') +
      repF('Подача (95)', 'L<sub>v</sub> = 3600·G<sub>l</sub>/ρ<sub>a</sub>', '3600 · ' + rf(u.Gl, 3) + ' / ' + rf(o.roa, 3), rf(u.Lv, 0) + ' м³/ч') +
      repF('Статическое давление (96)', 'P<sub>раб</sub> = P<sub>l−n</sub> + g·h<sub>l</sub>·(ρ<sub>a</sub> − ρ<sub>l</sub>) + g·h<sub>0l</sub>·(ρ<sub>a</sub> − ρ<sub>r</sub>) + P<sub>dl</sub>', rf(u.Pl, 2) + ' + 9,81 · ' + rf(u.hl, 2) + ' · ' + rf(o.roa - o.rol, 4) + ' + 9,81 · ' + rf(u.h0, 1) + ' · ' + rf(o.roa - o.ror, 4) + ' + ' + rf(u.duct.P, 2), rf(u.PsvW, 2) + ' Па (рабочее)') +
      repPsv(u, o.roa, 'ρ<sub>a</sub>', '96');
  }
  return repSup('<div class="rep">' + h + repNote(o) + '</div>');
}

/* ---------- Word: лист A4, чертёжный шрифт ---------- */
var REP_CSS = '@page Section1{size:21cm 29.7cm;margin:2cm 1cm 2cm 2cm}div.Section1{page:Section1}' +
  'body{font-family:' + REP_FONT + ';font-size:12pt;color:#000}' +
  '.rep-title{font-size:16pt;font-weight:bold;text-align:center;margin:0 0 8pt}' +
  'table{border-collapse:collapse;width:100%}td,th{border:0.5pt solid #000;padding:2pt 4pt;font-size:10.5pt;vertical-align:top}th{background:#eee;font-weight:bold}' +
  '.rep-hd td:first-child{width:22%;font-weight:bold}.rep-h{font-size:13pt;margin:14pt 0 6pt}.n{text-align:right;white-space:nowrap}.c{text-align:center}' +
  '.rep-sum{margin:8pt 0}.rep-sum div{border:0.5pt solid #000;padding:3pt 6pt;margin:0 0 3pt}.rep-sum span{display:block;font-size:9.5pt}.rep-sum b{font-size:13pt}.rep-sum small{font-size:9.5pt;margin-left:6pt}' +
  '.rep-net td,.rep-net th{font-size:8pt;padding:1pt 2pt}' +
  '.rep-x{font-family:Arial}.rep-f{margin:4pt 0}.rep-fn{font-size:10.5pt;color:#333}.rep-fx{font-size:12pt;margin-left:12pt}.rep-p{font-size:10.5pt}.rep-note{border:0.5pt solid #000;padding:4pt 8pt;margin-top:10pt;font-size:10.5pt}';
/* 1.22.5: Word не понимает плитки сводки (div/span) — склеивал «Подача вентилятора15569 м³/ч». Для Word сводка — таблица */
function repSumWord(html) {
  /* 1.23.3: плитки без вложенных div — берём ровно их; прежняя «ленивая» выборка до <h3/<table съедала вставленную схему и исходные данные */
  return html.replace(/<div class="rep-sum">((?:<div><span>[\s\S]*?<\/span><b>[\s\S]*?<\/b>(?:<small>[\s\S]*?<\/small>)?<\/div>)*)<\/div>/g, function (m, inner) {
    var rows = inner.replace(/<div><span>([\s\S]*?)<\/span><b>([\s\S]*?)<\/b>(?:<small>([\s\S]*?)<\/small>)?<\/div>/g, function (x, a, v, n) {
      return '<tr><td style="width:40%">' + a + '</td><td style="width:28%;white-space:nowrap"><b>' + v + '</b></td><td>' + (n || '') + '</td></tr>'; });
    return '<table class="rep-t" style="margin:8pt 0"><tbody>' + rows + '</tbody></table>';
  });
}
/* 1.23.3: листы Word — сводка; каждая схема на своём листе крупно; затем расчёт с формулами (инженер: «на одном листе схема, на другом 3D, и расчёт») */
var REP_PB = '<br clear="all" style="page-break-before:always">';
function repPages(rep, imgs) {
  var pics = (imgs || []).filter(function (x) { return x && x.png; }).map(function (x) {
    return REP_PB + '<h3 class="rep-h" style="text-align:center;page-break-after:avoid;margin-top:0">' + x.title + '</h3><p style="text-align:center"><img src="' + x.png + '" width="' + (x.w || 680) + '"' + (x.ar ? ' height="' + Math.round((x.w || 680) * x.ar) + '"' : '') + ' style="width:' + ((x.w || 680) / 680 * 18).toFixed(1) + 'cm' + (x.ar ? ';height:' + ((x.w || 680) / 680 * 18 * x.ar).toFixed(1) + 'cm' : '') + '"></p>' + (x.note ? '<p class="rep-p" style="text-align:center">' + x.note + '</p>' : '');
  }).join('');
  return rep.replace('<h3 class="rep-h">1.', pics + REP_PB + '<h3 class="rep-h">1.');
}
function repDoc(html, file) {
  html = repSumWord(html);
  var doc = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>Расчёт ПДВ</title><style>' + REP_CSS + '</style></head><body><div class="Section1">' +
    html.replace(/<div class="rep-scroll">|<\/div><!--s-->/g, '') + '<p style="font-size:9pt;color:#555;margin-top:14pt">Решение принимает ГИП.</p></div></body></html>';
  var blob = new Blob(['﻿', doc], { type: 'application/msword' }), a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = file + '.doc'; document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
