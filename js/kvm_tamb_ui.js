/* 1.22.3: тамбур-шлюз / зона безопасности — поля формы, отчёт, объёмная схема. Ядро — kvm_tamb.js. */

/* ---------- поля формы (подключаются в kvm_ui.js как KV_F.tamb) ---------- */
var TB_F = [
  ['Объект', [['name', 'Проект', 't'], ['system', 'Система', 't']]],
  ['Условия', [['openDoor', 'Двери защищаемого помещения', [[false, 'закрыты — по сопротивлению дверей'], [true, 'одна открыта — vd·ρ·Fd']]],
    ['heat', 'Приток', [[true, 'с подогревом (зона безопасности МГН)'], [false, 'без подогрева']]], ['windDoor', 'Ветер на двери', [[false, 'не учитывать'], [true, '+ 0,5·Kww·ρa·va²']]]]],
  ['Воздух', [['air.ta', 'ta — наружный (зима), °C'], ['air.tr', 'tr — в здании, °C'], ['tsf', 'tsf — тёплый приток, °C'], ['air.va', 'va — ветер, м/с'], ['air.kww', 'Kww — наветренный'], ['air.kw0', 'Kw0 — заветренный']]],
  ['Здание', [['N', 'Надземных этажей'], ['h2', 'Отметка 2-го этажа, м'], ['hf', 'Высота вышележащих этажей, м'], ['NUG', 'Подземных этажей'], ['hUG', 'Высота подземных этажей, м']]],
  ['Защищаемое помещение', [['nd', 'nd — дверей (без дверей лифтовой шахты)'], ['Fd', 'Fd — площадь двери, м²'], ['hd', 'hd — высота двери, м'], ['vd', 'vd — скорость в открытой двери, м/с'],
    ['Pplus', 'P+ — избыточное давление, Па'], ['mFdsl', 'm·Fdsl — двери смежной лифтовой шахты, м²', '', '0 — шахты нет']]],
  ['Клапан и канал', [['Fkl', 'Fкл — сечение клапана с приточным устройством, м²'], ['xikl', 'ξкл — КМС открытого клапана'], ['Skl', 'Sкл — закрытого клапана, м³/кг', '', 'по паспорту; 30300 — пример'], ['hkl1', 'hкл(1) — высота клапана 1-го этажа, м'],
    ['sh.a', 'Канал a, мм'], ['sh.b', 'Канал b, мм'], ['sh.eps', 'ε канала, мм'], ['sh.tight', 'a — герметичность канала'], ['Htop', 'Высота верхнего участка до оголовка, м']]],
  ['Вентилятор', [['h0', 'h0s — от воздухозабора до оголовка, м']]]
];

/* ---------- отчёт ---------- */
function repTamb(p, o) {
  var n = 0, h = repHead('Расчёт подпора в тамбур-шлюз (зону безопасности)', p, REP_M), A = p.air, top = o.rows[o.rows.length - 1];
  h += repSum([['Подача вентилятора', rf(o.Lv, 0) + ' м³/ч', 'при ' + rf(A.ta, 0) + ' °C'], ['Давление вентилятора', rf(o.Psv, 0) + ' Па', 'приведённое; рабочее ' + rf(o.PsvW, 0) + ' Па'], ['Расход в помещение', rf(o.Gsf, 2) + ' кг/с', rf(o.Lsf, 0) + ' м³/ч']]
    .concat(p.heat ? [['Воздухонагреватель', rf(o.Q, 1) + ' кВт', 'до ' + rf(p.tsf, 0) + ' °C']] : []));
  h += repSec(++n, 'Исходные данные');
  h += repIn([['Двери', '', p.openDoor ? 'одна открыта' : 'закрыты', ''], ['Приток', '', p.heat ? 'с подогревом до ' + rf(p.tsf, 0) + ' °C' : 'без подогрева', ''],
    ['Наружный воздух / в здании', 'ta / tr', rf(A.ta, 0) + ' / ' + rf(A.tr, 0), '°C'], ['Ветер; Kww / Kw0', 'va', rf(A.va, 1) + '; ' + rf(A.kww, 2) + ' / ' + rf(A.kw0, 2), 'м/с'],
    ['Этажей надземных / подземных', '', p.N + ' / ' + p.NUG, ''], ['Двери: n × Fd, hd', '', p.nd + ' × ' + rf(p.Fd, 2) + ' м², ' + rf(p.hd, 2) + ' м', ''],
    ['Избыточное давление', 'P+', rf(p.Pplus, 0), 'Па'], ['Двери смежной лифтовой шахты', 'm·Fdsl', rf(p.mFdsl, 2), 'м²'],
    ['Клапан: Fкл, ξкл, Sкл', '', rf(p.Fkl, 2) + ' м², ' + rf(p.xikl, 2) + ', ' + rf(p.Skl, 0) + ' м³/кг', ''], ['Канал a × b, ε, a', '', rf(p.sh.a, 0) + ' × ' + rf(p.sh.b, 0) + ' мм, ' + rf(p.sh.eps, 2) + ' мм, ' + rf(p.sh.tight, 3), '']]);
  h += repSec(++n, 'Расход воздуха в защищаемое помещение');
  h += repF('Плотности', 'ρ = 353/T', 'ρ<sub>a</sub> = ' + rf(o.roa, 3) + '; ρ<sub>r</sub> = ' + rf(o.ror, 3) + '; ρ<sub>sf</sub> = ' + rf(o.rsf, 3), 'кг/м³') +
    repF('Ветер', 'P<sub>w0</sub> = 0,5·K<sub>w0</sub>·ρ<sub>a</sub>·v<sub>a</sub>²', '', rf(o.Pw0, 2) + ' Па') +
    repF('Сопротивление дверей', 'S<sub>dsf</sub> = 5300/ρ<sub>sf</sub>; S<sub>dsl</sub> = 2600/ρ<sub>sf</sub>', '', rf(o.Sdsf, 1) + '; ' + rf(o.Sdsl, 1) + ' м³/кг') +
    repF('Давление в помещении', 'P<sub>sf</sub> = P<sub>+</sub> − g·h<sub>d</sub>/2·(ρ<sub>a</sub> − ρ<sub>r</sub>)' + (p.windDoor ? ' + 0,5·K<sub>ww</sub>·ρ<sub>a</sub>·v<sub>a</sub>²' : ''), '', rf(o.Psf, 2) + ' Па') +
    (p.openDoor ? repF('Расход (открытая дверь)', 'G<sub>sf</sub> = v<sub>d</sub>·ρ<sub>sf</sub>·F<sub>d</sub>', rf(p.vd, 2) + ' · ' + rf(o.rsf, 3) + ' · ' + rf(p.Fd, 2), rf(o.Gsf, 3) + ' кг/с')
      : repF('Расход (двери закрыты)', 'G<sub>sf</sub> = n·F<sub>d</sub>·(P<sub>+</sub>/S<sub>dsf</sub>)<sup>1/2</sup> + m·F<sub>dsl</sub>·(P<sub>+</sub>/S<sub>dsl</sub>)<sup>1/2</sup>', '', rf(o.Gsf, 3) + ' кг/с')) +
    repF('Открытый клапан на этаже ' + o.rows[0].n, 'ΔP<sub>кл</sub> = ξ<sub>кл</sub>·ρ<sub>sf</sub>·v<sub>кл</sub>²/2', 'v<sub>кл</sub> = ' + rf(o.vkl, 2) + ' м/с', rf(o.dPkl, 2) + ' Па');
  h += repSec(++n, 'Вертикальный канал по этажам');
  h += '<p class="rep-p">Выше этажа пожара клапаны закрыты: утечка F<sub>кл</sub>·(ΔP<sub>кл</sub>/S<sub>кл</sub>)<sup>1/2</sup> и через стенки (ρ<sub>sf</sub>/3600)·Π·Δh·a·ΔP<sub>кл</sub><sup>0,65</sup> — по перепаду этажом ниже; трение λ по Кольбруку; ΔP<sub>кл</sub> = P<sub>ш</sub> − g·(h<sub>кл</sub> − h<sub>э пожара</sub>)·(ρ<sub>r</sub> − ρ<sub>sf</sub>).</p>';
  h += repT(['Этаж', 'h<sub>кл</sub>, м', 'P<sub>ш</sub>, Па', 'G<sub>ш</sub>, кг/с', 'v<sub>ш</sub>, м/с', 'ΔP<sub>кл</sub>, Па', 'ΔG<sub>ш</sub>, кг/с', 'ΔG<sub>кл</sub>, кг/с'], o.rows.slice().reverse().map(function (r) {
    return [r.n + (r === o.rows[0] ? ' (пожар)' : ''), rf(r.hk, 2), rf(r.P, 2), rf(r.G, 4), rf(r.v, 2), rf(r.dPk, 2), rf(r.gW, 4), rf(r.gK, 4)]; }), 'rep-net');
  h += repSec(++n, 'Вентилятор');
  h += repF('Верхний участок канала', 'ΔP<sub>top</sub> = λ·H<sub>top</sub>/D<sub>э</sub>·ρ<sub>a</sub>·v<sub>ш</sub>²/2', 'v<sub>ш</sub> = ' + rf(o.vsh, 2) + ' м/с; λ = ' + rf(o.lamTop, 4), rf(o.dPtop, 2) + ' Па') +
    (o.net ? kmsRep(o.net, 'Сеть от воздухозабора до канала') : repF('Воздуховод до канала', 'ΔP<sub>вв</sub> = (λ·l/D + Σξ)·ρ<sub>a</sub>·v²/2', 'v = ' + rf(o.vvv, 2) + ' м/с; λ = ' + rf(o.lamVV, 4), rf(o.dPvv, 2) + ' Па')) +
    repF('Давление у оголовка', 'P<sub>N</sub> = g·h<sub>N</sub>·(ρ<sub>a</sub> − ρ<sub>sf</sub>) − P<sub>w0</sub>', 'h<sub>N</sub> = ' + rf(o.hN, 2) + ' м', rf(o.PN, 2) + ' Па') +
    repF('Подача', 'L<sub>v</sub> = 3600·G<sub>s</sub>/ρ<sub>a</sub>', '3600 · ' + rf(o.Gs, 4) + ' / ' + rf(o.roa, 3), rf(o.Lv, 0) + ' м³/ч') +
    repF('Статическое давление', 'P<sub>sv</sub> = P<sub>ш верх</sub> + P<sub>N</sub> + g·(h<sub>0s</sub> + h<sub>N</sub>)·(ρ<sub>a</sub> − ρ<sub>sf</sub>) + ΔP<sub>вв</sub> + ΔP<sub>top</sub>', rf(top.P, 2) + ' + ' + rf(o.PN, 2) + ' + ' + rf(9.81 * (p.h0 + o.hN) * o.dro, 2) + ' + ' + rf(o.dPvv, 2) + ' + ' + rf(o.dPtop, 2), rf(o.PsvW, 2) + ' Па (рабочее)') + repPsv(o, o.roa, 'ρ<sub>a</sub>', 'по аналогии с (94)') +
    (p.heat ? repF('Мощность воздухонагревателя', 'Q = G<sub>s</sub>·c·(t<sub>sf</sub> − t<sub>a</sub>), c = 1,005 кДж/(кг·К)', rf(o.Gs, 3) + ' · 1,005 · (' + rf(p.tsf, 0) + ' − ' + rf(A.ta, 0) + ')', rf(o.Q, 1) + ' кВт') : '');
  return repSup('<div class="rep">' + h + repNote(o) + '</div>');
}

/* ---------- объёмная схема (помощники — pdv3d.js, pdv3d_smk.js) ---------- */
function p3tamb(p, o) {
  var R = o.rows, N = R.length, fh = 1.3, bx = 10, by = 7, f = function (v, n) { return dpuFmt(v, n); };
  var s = Math.max(9, Math.min(24, 560 / (N * fh + (bx + by) * 0.5 + 7)));
  var W = 1180, H = Math.round((bx + by + 2) * 0.5 * s + (N * fh + 5) * s + 110), ox = 330 + (by + 1) * 0.866 * s, oy = H - (bx + by + 2) * 0.5 * s - 30;
  var P = function (a, b, c) { return p3pt(a, b, c, s, ox, oy); }, h = P3M, top = N * fh, i; P3Q = [];
  h += '<polygon points="' + p3poly([P(-1.5, -1.5, 0), P(bx + 2.5, -1.5, 0), P(bx + 2.5, by + 1.5, 0), P(-1.5, by + 1.5, 0)]) + '" fill="#e3e7eb" stroke="#cfd5db"/>';
  h += '<polygon points="' + p3poly([P(0, 0, 0), P(bx, 0, 0), P(bx, 0, top), P(0, 0, top)]) + '" fill="#dfe8f1" fill-opacity=".5" stroke="#9fb0c2" stroke-width=".6"/><polygon points="' + p3poly([P(0, 0, 0), P(0, by, 0), P(0, by, top), P(0, 0, top)]) + '" fill="#d7e2ed" fill-opacity=".5" stroke="#9fb0c2" stroke-width=".6"/>';
  var cx = 4.2, cy = 1.0, cw = 0.85;
  for (i = 0; i <= N; i++) {
    var z = i * fh;
    h += '<polygon points="' + p3poly([P(0, 0, z), P(bx, 0, z), P(bx, by, z), P(0, by, z)]) + '" fill="' + (i === 0 ? '#dcebf9' : i === N ? '#b9c3cd' : '#d3dbe3') + '" fill-opacity="' + (i === N ? 0.9 : 0.62) + '" stroke="#8a9aab" stroke-width=".6"/>';
    if (i < N) { var lb = P(0, by, z + fh * 0.45); h += p3txt(lb[0] - 8, lb[1], R[i].n + (i === 0 ? ' — пожар' : ''), i === 0 ? 'p3t p3b' : 'p3t', 'end'); }
  }
  /* защищаемое помещение на этаже пожара: выгородка и двери */
  h += p3m(cx - 2.2, cy + cw + 0.4, 0.02, 3.6, 2.6, fh - 0.1, s, ox, oy, '#2f7fd8');
  for (var d = 0; d < Math.min(p.nd || 1, 3); d++) h += p3face(cx - 1.9 + d * 1.1, cy + cw + 3.0, 0.02, 0.7, fh * 0.7, s, ox, oy, (p.openDoor && d === 0) ? '#f6f7f9' : '#5b6b7d', 0, 0);
  /* вертикальный канал с фланцами и клапанами; плашка — перепад на клапане, цвет — скорость в канале */
  for (i = 0; i < N; i++) {
    var z0 = i * fh, z1 = (i + 1) * fh, lo = i === 0 ? 0.3 : 0;
    h += p3m(cx, cy, z0 + lo, cw, cw, z1 - z0 - lo, s, ox, oy, '#2f7fd8');
    h += p3m(cx - 0.06, cy - 0.06, z1 - 0.07, cw + 0.12, cw + 0.12, 0.07, s, ox, oy);
    h += p3face(cx + 0.12, cy + cw, z0 + fh * 0.45, 0.6, 0.4, s, ox, oy, i === 0 ? '#2f7fd8' : '#3a4048', 3, i === 0 ? 0.1 : 0);
    var bdg = P(cx + cw, cy + cw, z0 + fh * 0.5); h += p3badge(bdg[0] + 8, bdg[1] + 4, R[i].v, f(R[i].dPk, 0) + ' Па');
  }
  /* приточная установка на кровле: корпус, жалюзи воздухозабора, нагреватель */
  h += p3m(cx - 0.5, cy - 2.0, top, 2.8, 1.6, 1.0, s, ox, oy, '#2f7fd8');
  h += p3m(cx + 0.05, cy - 0.45, top, cw - 0.1, cw + 0.4, 0.55, s, ox, oy, '#2f7fd8');
  h += p3faceX(cx + 2.3, cy - 1.85, top + 0.12, 1.2, 0.75, s, ox, oy, '#39414b', 5, false);
  if (p.heat) h += p3face(cx + 1.0, cy - 0.4, top + 0.15, 0.9, 0.7, s, ox, oy, '#b3412b', 6, 0);
  h += p3line([P(cx + 3.4, cy - 1.2, top + 0.5), P(cx + 2.4, cy - 1.2, top + 0.5)], 'p3flow', 'p3aC', '#2f7fd8');
  h += p3line([P(cx + cw * 0.5, cy + cw + 0.25, top - 0.3), P(cx + cw * 0.5, cy + cw + 0.25, 0.9)], 'p3flow', 'p3aC', '#2f7fd8');
  h += p3line([P(cx + 0.4, cy + cw + 0.4, 0.75), P(cx + 0.4, cy + cw + 2.4, 0.75)], 'p3flow', 'p3aC', '#2f7fd8');
  h += p3lead(P(cx + 1.0, cy - 2.0, top + 1.0), 120, -30, 'Подпор: ' + f(o.Lv, 0) + ' м³/ч · ' + f(o.Psv, 0) + ' Па', p.heat ? 'нагреватель ' + f(o.Q, 0) + ' кВт до ' + f(p.tsf, 0) + ' °C' : 'наружный воздух ' + f(p.air.ta, 0) + ' °C');
  h += p3lead(P(cx - 0.4, cy + cw + 3.0, fh * 0.4), -80, 60, (p.openDoor ? 'Дверь открыта: ' : 'Двери закрыты: ') + f(o.Gsf, 2) + ' кг/с', 'P = ' + f(o.Psf, 1) + ' Па в помещении');
  h += p3lead(P(cx + 0.4, cy + cw, fh * 0.65), 240, 70, 'Открытый клапан: ' + f(o.vkl, 1) + ' м/с, ' + f(o.dPkl, 1) + ' Па', 'выше закрытые клапаны, утечки ' + f(o.Gs - o.Gsf, 3) + ' кг/с');
  h += p3legend([['#2fb67a', 'до 9 м/с в канале'], ['#e7c13a', '9…11 м/с'], ['#ee8a2f', '11…15 м/с'], ['#d8432e', 'больше 15 м/с'], ['#2f7fd8', 'движение воздуха']], W - 290, 44, 'Число — перепад на клапане, цвет — скорость');
  h += p3txt(16, H - 12, 'В помещение ' + f(o.Gsf, 2) + ' кг/с → вентилятор ' + f(o.Gs, 2) + ' кг/с. Этажей ' + N + '. Схема условная, числа — из расчёта.');
  h += p3flush(P(0, by, 0)[0] - 95, P(bx + 2.5, -1.5, 0)[0] + 16, 175, H - 56);
  return p3wrap(W, H, h, 'Подпор в тамбур-шлюз (зону безопасности) ' + esc(p.system || ''));
}
